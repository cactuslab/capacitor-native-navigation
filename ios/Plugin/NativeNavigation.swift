import Foundation
import Capacitor

class NativeNavigation: NSObject {

    private let bridge: CAPBridgeProtocol
    private let plugin: CAPPlugin
    private var webViewDelegate: NativeNavigationWebViewDelegate?
    private var rootsByName: [String: UIViewController] = [:]
    private var stacksByName: [String: UINavigationController] = [:]
    private var viewControllersById: [String: WeakViewController] = [:]
    private var rootNameCounter = 1
    private let saveCapacitorRoot: UIViewController?

    public init(bridge: CAPBridgeProtocol, plugin: CAPPlugin) {
        self.bridge = bridge
        self.plugin = plugin
        self.saveCapacitorRoot = bridge.viewController /* Attempt to prevent the view controller disappearing*/
        
        super.init()
        
        if let webView = self.bridge.webView {
            self.webViewDelegate = NativeNavigationWebViewDelegate(wrapped: webView.uiDelegate, implementation: self)
            webView.uiDelegate = self.webViewDelegate

            /* Allow window.open to be used without a click event */
            webView.configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        }
    }

    @MainActor
    func create(_ options: CreateOptions) async throws -> String {
        switch options.type {
        case .stack:
            return try createStack(options)
        case .tabs:
            return try createTabs(options)
        case .plain:
            return try createPlain(options)
        }
    }

    @MainActor
    func present(_ options: PresentOptions) async throws -> String {
        var root: UIViewController!
        var rootName: String!

        if let rootNameValue = options.rootName {
            rootName = rootNameValue
            root = rootsByName[rootNameValue]
            guard root != nil else {
                throw NativeNavigatorError.unknownRoot(name: rootName)
            }
        } else if let rootOptions = options.rootOptions {
            let rootNameValue = try await self.create(rootOptions)
            rootName = rootNameValue
            root = rootsByName[rootNameValue]

            guard root != nil else {
                throw NativeNavigatorError.illegalState(message: "Root created but not found")
            }
        }

        guard !root.isBeingPresented else {
            throw NativeNavigatorError.alreadyPresented(name: rootName)
        }

        guard root.parent == nil else {
            throw NativeNavigatorError.notARoot(name: rootName)
        }

        let presentationStyle = options.presentationStyle ?? .none // TODO use view controller's default
        switch presentationStyle {
        case .none, .normal:
            if let window = self.bridge.webView?.window {
                window.rootViewController = root
            } else {
                throw NativeNavigatorError.illegalState(message: "Cannot find window")
            }
        case .modal:
            if let modalPresentationStyle = options.modalPresentationStyle {
                switch modalPresentationStyle {
                case .fullScreen:
                    try self.presentViewController(root, animated: options.animated, modalPresentationStyle: .fullScreen)
                case .pageSheet:
                    try self.presentViewController(root, animated: options.animated, modalPresentationStyle: .pageSheet)
                case .formSheet:
                    try self.presentViewController(root, animated: options.animated, modalPresentationStyle: .formSheet)
                }
            } else {
                try self.presentViewController(root, animated: options.animated, modalPresentationStyle: .fullScreen)
            }
        }

        return rootName
    }

    @MainActor
    func dismiss(_ rootName: String, animated: Bool) async throws {
        guard let root = rootsByName[rootName] else {
            throw NativeNavigatorError.unknownRoot(name: rootName)
        }

        if root.isBeingPresented {
            root.presentingViewController?.dismiss(animated: animated)
            return
        }

        throw NativeNavigatorError.notPresented(name: rootName)
    }

    @MainActor
    func push(_ options: PushOptions) async throws -> PushResult {
        var stack: UINavigationController!
        var stackName: String!
        if let stackNameValue = options.stack {
            guard let stackValue = stacksByName[stackNameValue] else {
                throw NativeNavigatorError.unknownRoot(name: stackNameValue)
            }
            stack = stackValue
            stackName = stackNameValue
        } else {
            guard let stackValue = try self.topViewController() as? UINavigationController else {
                throw NativeNavigatorError.currentIsNotStack
            }
            stack = stackValue
            stackName = stack.name
            guard stackName != nil else {
                throw NativeNavigatorError.illegalState(message: "Top view controller is not one of ours")
            }
        }

        let vc = UIViewController()
//        vc.view.backgroundColor = .systemPink
        
        stack.pushViewController(vc, animated: options.animated)
        
        let viewId = generateViewControllerId()
        
        self.viewControllersById[viewId] = WeakViewController(viewController: vc)
        self.plugin.notifyListeners("view", data: ["path": options.path, "viewId": viewId], retainUntilConsumed: true)

        return PushResult(stack: stackName, viewId: viewId)
    }
    
    func webView(forViewId viewId: String, configuration: WKWebViewConfiguration) throws -> WKWebView? {
        guard let viewController = self.viewControllersById[viewId]?.viewController else {
            return nil
        }
        
        /* So we don't load the javascript from our start path */
        guard let webView = self.bridge.webView else {
            throw NativeNavigatorError.illegalState(message: "Cannot find webView")
        }
        
        configuration.preferences = configuration.preferences.copy() as! WKPreferences
        configuration.preferences.javaScriptEnabled = false

        let newWebView = WKWebView(frame: .zero, configuration: configuration)
        _ = newWebView.load(URLRequest(url: webView.url!))
        viewController.view = newWebView
        
        return newWebView
    }

    private func presentViewController(_ root: UIViewController, animated: Bool, modalPresentationStyle: UIModalPresentationStyle?) throws {
        guard let top = try self.topViewController() else {
            throw NativeNavigatorError.illegalState(message: "Cannot find top")
        }

        if let modalPresentationStyle = modalPresentationStyle {
            root.modalPresentationStyle = modalPresentationStyle
        }
        top.present(root, animated: animated)
    }

    private func topViewController() throws -> UIViewController? {
        guard let window = self.bridge.webView?.window else {
            throw NativeNavigatorError.illegalState(message: "Cannot find window")
        }

        var result = window.rootViewController
        while result?.presentedViewController != nil {
            result = result?.presentedViewController
        }
        return result
    }

    private func generateRootName() -> String {
        let result = "_root\(self.rootNameCounter)"
        self.rootNameCounter += 1
        return result
    }

    private func generateStackName() -> String {
        let result = "_stack\(self.rootNameCounter)"
        self.rootNameCounter += 1
        return result
    }
    
    private func generateViewControllerId() -> String {
        let result = "_view\(self.rootNameCounter)"
        self.rootNameCounter += 1
        return result
    }

    private func storeRoot(_ root: UIViewController, name: String?) throws -> String {
        if let name = name {
            if rootsByName[name] != nil {
                throw NativeNavigatorError.rootAlreadyExists(name: name)
            }
            rootsByName[name] = root
            return name
        } else {
            let name = generateRootName()
            if rootsByName[name] != nil {
                throw NativeNavigatorError.illegalState(message: "Dynamically generated root name already exists: \(name)")
            }
            rootsByName[name] = root
            return name
        }
    }

    private func storeStack(_ stack: UINavigationController, name: String?) throws -> String {
        if let name = name {
            if stacksByName[name] != nil {
                throw NativeNavigatorError.stackAlreadyExists(name: name)
            }
            stacksByName[name] = stack
            stack.name = name
            return name
        } else {
            let name = generateStackName()
            if stacksByName[name] != nil {
                throw NativeNavigatorError.illegalState(message: "Dynamically generated stack name already exists: \(name)")
            }
            stacksByName[name] = stack
            stack.name = name
            return name
        }
    }

    private func createStack(_ options: CreateOptions) throws -> String {
//        let vc = UIViewController()
//        vc.title = "Test"
//        vc.view.backgroundColor = .brown
        let nc = UINavigationController()
        
        /* So our webView doesn't disappear under the title bar */
        nc.navigationBar.scrollEdgeAppearance = nc.navigationBar.standardAppearance

        let name = try storeStack(nc, name: options.name)
        return try self.storeRoot(nc, name: name)
    }

    private func createTabs(_ options: CreateOptions) throws -> String {
        let tc = UITabBarController()

        var vcs: [UIViewController] = []
        if let stacks = options.stacks {
            for stack in stacks {
                let nc = UINavigationController()
                vcs.append(nc)
                _ = try storeStack(nc, name: stack)
            }
        }

        return try storeRoot(tc, name: options.name)
    }

    private func createPlain(_ options: CreateOptions) throws -> String {
        let vc = UIViewController()
//        vc.modalPresentationStyle = .fullScreen

        return try storeRoot(vc, name: options.name)
    }
}

struct AssociatedKeys {
    static var name: UInt8 = 0
}

extension UIViewController {

    var name: String? {
        get {
            guard let value = objc_getAssociatedObject(self, &AssociatedKeys.name) as? String else {
                return nil
            }
            return value
        }
        set(newValue) {
            objc_setAssociatedObject(self, &AssociatedKeys.name, newValue, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
    }

}

struct WeakViewController {
    weak var viewController: UIViewController?
}
