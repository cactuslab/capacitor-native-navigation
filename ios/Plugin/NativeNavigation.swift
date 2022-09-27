import Foundation
import Capacitor

class NativeNavigation: NSObject {

    private let bridge: CAPBridgeProtocol
    private let plugin: CAPPlugin
    private var webViewDelegate: NativeNavigationWebViewDelegate?
    private var rootsByName: [String: UIViewController] = [:]
    private var stacksByName: [String: UINavigationController] = [:]
    private var viewsById: [String: NativeNavigationViewController] = [:]
    private var rootNameCounter = 1
    private let saveCapacitorRoot: UIViewController?
    private var html: String? = nil
    private var window: UIWindow! {
            // Get connected scenes
            return UIApplication.shared.connectedScenes
                // Keep only active scenes, onscreen and visible to the user
                .filter { $0.activationState == .foregroundActive }
                // Keep only the first `UIWindowScene`
                .first(where: { $0 is UIWindowScene })
                // Get its associated windows
                .flatMap({ $0 as? UIWindowScene })?.windows
                // Finally, keep only the key window
                .first(where: \.isKeyWindow)
        }

    public init(bridge: CAPBridgeProtocol, plugin: CAPPlugin) {
        self.bridge = bridge
        self.plugin = plugin
        self.saveCapacitorRoot = bridge.viewController /* Attempt to prevent the view controller disappearing */

        super.init()
        
        if let webView = self.bridge.webView {
            self.webViewDelegate = NativeNavigationWebViewDelegate(wrapped: webView.uiDelegate, implementation: self)
            webView.uiDelegate = self.webViewDelegate

            /* Allow window.open to be used without a click event */
            webView.configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        } else {
            fatalError("No webView")
        }

        Task {
            try await self.loadPageContent()
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
            window.rootViewController = root
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
    func createView(_ options: ViewOptions) async throws -> String {
        let viewId = generateViewControllerId()

        let view = NativeNavigationViewController(path: options.path, state: options.state)
        viewsById[viewId] = view

        var notificationData: [String : Any] = ["path": options.path, "viewId": viewId]
        if let state = view.state {
            notificationData["state"] = state
        }
        self.plugin.notifyListeners("view", data: notificationData, retainUntilConsumed: true)
        return viewId
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

        guard let vc = viewsById[options.viewId] else {
            throw NativeNavigatorError.unknownView(name: options.viewId)
        }

        viewsById[options.viewId] = nil
        
        stack.pushViewController(vc, animated: options.animated)

        return PushResult(stack: stackName)
    }
    
    func webView(forViewId viewId: String, configuration: WKWebViewConfiguration) throws -> WKWebView? {
        guard let view = self.viewsById[viewId] else {
            CAPLog.print("NativeNavigation: unknown view id: \(viewId)")
            return nil
        }

        guard let webView = self.bridge.webView else {
            throw NativeNavigatorError.illegalState(message: "Cannot find webView")
        }
        guard let html = self.html else {
            throw NativeNavigatorError.illegalState(message: "html not loaded")
        }

        let newWebView = WKWebView(frame: .zero, configuration: configuration)
        _ = newWebView.loadHTMLString(html, baseURL: webView.url!)
        view.webView = newWebView
        
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
//        let nc = UINavigationController(rootViewController: vc)
        let nc = UINavigationController()
        
        /* So our webView doesn't disappear under the title bar */
//        nc.navigationBar.scrollEdgeAppearance = nc.navigationBar.standardAppearance

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

    /**
     Load the HTML page content that we'll use for our webviews.
     */
    private func loadPageContent() async throws {
        guard let webView = self.bridge.webView else {
            throw NativeNavigatorError.illegalState(message: "Cannot find webView")
        }

        let content = try await String(contentsOf: webView.url!)

        /* Disable any JavaScript on the page, as we don't want to run any JavaScript on these
           pages... we just want to inject DOM nodes.
         */
        let sanitizedContent = content.replacingOccurrences(of: "<script", with: "<!--")
            .replacingOccurrences(of: "</script>", with: "-->")
        self.html = sanitizedContent
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

struct WeakContainer<T> where T: AnyObject {
    weak var value: T?
}

class NativeNavigationViewController: UIViewController {

    var path: String
    var state: JSObject?
    var webView: WKWebView? {
        willSet {
            if let webView = webView {
                webView.removeFromSuperview()
            }
        }
        didSet {
            if let webView = webView {
                webView.frame = self.view.bounds
                self.view.addSubview(webView)
            }
        }
    }

    init(path: String, state: JSObject?) {
        self.path = path
        self.state = state
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

}
