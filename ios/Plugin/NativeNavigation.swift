import Foundation
import Capacitor

class NativeNavigation: NSObject {

    private let bridge: CAPBridgeProtocol
    private let plugin: CAPPlugin
    private var webViewDelegate: NativeNavigationWebViewDelegate?
    private var rootsByName: [String: UIViewController] = [:]
    private var idCounter = 1
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
    func create(_ options: CreateOptions) async throws -> CreateResult {
        let viewController = try await self.createViewController(options)
        return CreateResult(id: viewController.componentId!)
    }
    
    @MainActor
    private func createViewController(_ options: CreateOptions) async throws -> UIViewController {
        switch options.type {
        case .stack:
            return try await createStack(options)
        case .tabs:
            return try await createTabs(options)
        case .view:
            return try createView(options)
        }
    }
    
    @MainActor
    func setRoot(_ options: SetRootOptions) async throws {
        let id = options.id
        guard let root = rootsByName[id] else {
            throw NativeNavigatorError.unknownRoot(name: id)
        }

        guard !root.isBeingPresented else {
            throw NativeNavigatorError.alreadyPresented(name: id)
        }

        guard root.parent == nil else {
            throw NativeNavigatorError.notARoot(name: id)
        }
        
        window.rootViewController = root
    }

    @MainActor
    func present(_ options: PresentOptions) async throws -> PresentResult {
        let id = options.id
        guard let root = rootsByName[id] else {
            throw NativeNavigatorError.unknownRoot(name: id)
        }

        guard !root.isBeingPresented else {
            throw NativeNavigatorError.alreadyPresented(name: id)
        }

        guard root.parent == nil else {
            throw NativeNavigatorError.notARoot(name: id)
        }
        
        guard let top = try self.topViewController() else {
            throw NativeNavigatorError.illegalState(message: "Cannot find top")
        }

        top.present(root, animated: options.animated)

        return PresentResult(id: id)
    }

    @MainActor
    func dismiss(_ options: DismissOptions) async throws -> DismissResult {
        var viewController: UIViewController!
        
        if let id = options.id {
            viewController = rootsByName[id]
        } else {
            viewController = try self.topViewController()
        }
        
        guard let viewController = viewController else {
            throw NativeNavigatorError.illegalState(message: "Cannot find a view controller to dismiss")
        }
        
        guard let id = viewController.componentId else {
            throw NativeNavigatorError.illegalState(message: "The top view controller does not have a component id")
        }

        if viewController.isBeingPresented {
            viewController.presentingViewController?.dismiss(animated: options.animated)
            return DismissResult(id: id)
        } else {
            throw NativeNavigatorError.notPresented(name: id)
        }
    }

    @MainActor
    func push(_ options: PushOptions) async throws -> PushResult {
        let stack = try self.findStack(name: options.stack)
        
        guard let vc = rootsByName[options.id] else {
            throw NativeNavigatorError.unknownView(name: options.id)
        }
        
        //        rootsByName[options.id] = nil // TODO don't do this if retain is true
        
        if stack.viewControllers.isEmpty {
            print("PUSH ROOT")
            stack.setViewControllers([vc], animated: false)
        } else {
            stack.pushViewController(vc, animated: options.animated)
        }

        return PushResult(stack: stack.componentId!)
    }
    
    @MainActor
    func pop(_ options: PopOptions) async throws -> PopResult {
        let stack = try self.findStack(name: options.stack)
        
        let viewController = stack.popViewController(animated: options.animated)
        
        return PopResult(stack: stack.componentId!, id: viewController?.componentId)
    }
    
    @MainActor
    func setOptions(_ options: ComponentOptions) async throws {
        guard let vc = rootsByName[options.id] else {
            throw NativeNavigatorError.unknownView(name: options.id)
        }
        
        if let title = options.title {
            vc.title = title
        }
    }

    @MainActor
    func reset() async throws {
        self.window.rootViewController = self.saveCapacitorRoot

        if let rootViewController = self.window.rootViewController, rootViewController.presentedViewController != nil {
            rootViewController.dismiss(animated: false)
        }

        self.rootsByName.removeAll()
    }
    
    private func findStack(name: String?) throws -> UINavigationController {
        if let stackNameValue = name {
            guard let possibleStackValue = rootsByName[stackNameValue] else {
                throw NativeNavigatorError.unknownRoot(name: stackNameValue)
            }
            
            guard let stack = possibleStackValue as? UINavigationController else {
                throw NativeNavigatorError.notAStack(name: stackNameValue)
            }
            
            return stack
        } else {
            guard let stack = try self.topViewController() as? UINavigationController else {
                throw NativeNavigatorError.currentIsNotStack
            }
            
            guard stack.componentId != nil else {
                throw NativeNavigatorError.illegalState(message: "Top view controller does not have a componentId")
            }
            
            return stack
        }
    }
    
    func webView(forComponent componentId: String, configuration: WKWebViewConfiguration) throws -> WKWebView? {
        guard let view = self.rootsByName[componentId] else {
            throw NativeNavigatorError.notARoot(name: componentId)
        }
        guard let viewController = view as? NativeNavigationViewController else {
            throw NativeNavigatorError.illegalState(message: "Not a view: \(componentId)")
        }

        guard let webView = self.bridge.webView else {
            throw NativeNavigatorError.illegalState(message: "Cannot find main webView")
        }
        guard let html = self.html else {
            throw NativeNavigatorError.illegalState(message: "html not loaded")
        }

        let newWebView = WKWebView(frame: .zero, configuration: configuration)
        _ = newWebView.loadHTMLString(html, baseURL: webView.url!)
        viewController.webView = newWebView
        
        return newWebView
    }

    private func topViewController() throws -> UIViewController? {
        var result = window.rootViewController
        while result?.presentedViewController != nil {
            result = result?.presentedViewController
        }
        return result
    }

    private func generateId() -> String {
        let result = "_root\(self.idCounter)"
        self.idCounter += 1
        return result
    }

    private func storeRoot(_ root: UIViewController, id: String?) throws -> String {
        if let id = id {
            if rootsByName[id] != nil {
                throw NativeNavigatorError.rootAlreadyExists(name: id)
            }
            rootsByName[id] = root
            root.componentId = id
            return id
        } else {
            let id = generateId()
            if rootsByName[id] != nil {
                throw NativeNavigatorError.illegalState(message: "Dynamically generated component id already exists: \(id)")
            }
            rootsByName[id] = root
            root.componentId = id
            return id
        }
    }

    @MainActor
    private func createStack(_ options: CreateOptions) async throws -> UINavigationController {
        if let id = options.id, let existing = rootsByName[id] {
            guard let existingNavigationController = existing as? UINavigationController else {
                throw NativeNavigatorError.notAStack(name: id)
            }
            return existingNavigationController
        }
        
//        let vc = UIViewController()
//        vc.title = "Test"
//        vc.view.backgroundColor = .brown
//        let nc = UINavigationController(rootViewController: vc)
        let nc = UINavigationController()
        
        /* So our webView doesn't disappear under the title bar */
//        nc.navigationBar.scrollEdgeAppearance = nc.navigationBar.standardAppearance
        
        if let modalPresentationStyle = options.modalPresentationStyle {
            nc.modalPresentationStyle = modalPresentationStyle.toUIModalPresentationStyle()
        }
        
        if let stackOptions = options.stackOptions {
            if let stack = stackOptions.stack {
                var viewControllers = [UIViewController]()
                for stackItemCreateOptions in stack {
                    let stackItem = try await self.createViewController(stackItemCreateOptions)
                    viewControllers.append(stackItem)
                }
                nc.viewControllers = viewControllers
            }
        }

        _ = try self.storeRoot(nc, id: options.id)
        return nc
    }

    @MainActor
    private func createTabs(_ options: CreateOptions) async throws -> UITabBarController {
        guard let tabsOptions = options.tabsOptions else {
            throw NativeNavigatorError.illegalState(message: "Missing tabsOptions")
        }
        
        if let id = options.id, let existing = rootsByName[id] {
            guard let existingTabBarController = existing as? UITabBarController else {
                throw NativeNavigatorError.notTabs(name: id)
            }
            return existingTabBarController
        }
        
        let tc = UITabBarController()

        var vcs: [UIViewController] = []
        for tabOption in tabsOptions.tabs {
            let created = try await self.create(tabOption)
            let tab = rootsByName[created.id]!
            vcs.append(tab)
        }

        _ = try storeRoot(tc, id: options.id)
        return tc
    }

    private func createView(_ options: CreateOptions) throws -> UIViewController {
        guard let viewOptions = options.viewOptions else {
            throw NativeNavigatorError.illegalState(message: "Missing viewOptions")
        }
        
        if let id = options.id, let existing = rootsByName[id] {
            guard let existingViewController = existing as? NativeNavigationViewController else {
                throw NativeNavigatorError.illegalState(message: "Existing component with the same ID already exists but is not a view")
            }
            return existingViewController
        }
        
        let vc = NativeNavigationViewController(path: viewOptions.path, state: viewOptions.state)
//        vc.modalPresentationStyle = .fullScreen

        let id = try storeRoot(vc, id: options.id)
        
        var notificationData: [String : Any] = ["path": viewOptions.path, "id": id]
        if let state = viewOptions.state {
            notificationData["state"] = state
        }
        self.plugin.notifyListeners("view", data: notificationData, retainUntilConsumed: true)
        return vc
    }
    
    //    @MainActor
    //    func createView(_ options: ViewOptions) async throws -> CreateResult {
    //        let viewId = generateViewControllerId()
    //
    //        let view = NativeNavigationViewController(path: options.path, state: options.state)
    //        viewsById[viewId] = view
    //
    //        var notificationData: [String : Any] = ["path": options.path, "viewId": viewId]
    //        if let state = view.state {
    //            notificationData["state"] = state
    //        }
    //        self.plugin.notifyListeners("view", data: notificationData, retainUntilConsumed: true)
    //        return viewId
    //    }

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
    static var componentId: UInt8 = 0
}

extension UIViewController {

    var componentId: String? {
        get {
            guard let value = objc_getAssociatedObject(self, &AssociatedKeys.componentId) as? String else {
                return nil
            }
            return value
        }
        set(newValue) {
            objc_setAssociatedObject(self, &AssociatedKeys.componentId, newValue, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
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
