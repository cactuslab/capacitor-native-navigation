import Foundation
import Capacitor

class NativeNavigation: NSObject {

    private let bridge: CAPBridgeProtocol
    private let plugin: CAPPlugin
    private var webViewDelegate: NativeNavigationWebViewDelegate?
    private var retainedComponentsById: [String: UIViewController] = [:]
    private var componentsById: [String: WeakContainer<UIViewController>] = [:]
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
        guard let root = self.component(id) else {
            throw NativeNavigatorError.componentNotFound(name: id)
        }

        guard !root.isBeingPresented else {
            throw NativeNavigatorError.alreadyPresented(name: id)
        }

        guard root.parent == nil else {
            throw NativeNavigatorError.notARoot(name: id)
        }
        
        window.rootViewController = root

        unretainComponentIfNecessary(root)
    }

    @MainActor
    func present(_ options: PresentOptions) async throws -> PresentResult {
        let id = options.id
        guard let root = self.component(id) else {
            throw NativeNavigatorError.componentNotFound(name: id)
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

        unretainComponentIfNecessary(root)

        return PresentResult(id: id)
    }

    @MainActor
    func dismiss(_ options: DismissOptions) async throws -> DismissResult {
        var viewController: UIViewController!
        
        if let id = options.id {
            viewController = self.component(id)
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
        
        guard let vc = component(options.id) else {
            throw NativeNavigatorError.componentNotFound(name: options.id)
        }
        
        if stack.viewControllers.isEmpty {
            stack.setViewControllers([vc], animated: false)
        } else {
            stack.pushViewController(vc, animated: options.animated)
        }

        unretainComponentIfNecessary(vc)

        return PushResult(stack: stack.componentId!)
    }
    
    @MainActor
    func pop(_ options: PopOptions) async throws -> PopResult {
        let stack = try self.findStack(name: options.stack)
        
        let viewController = stack.popViewController(animated: options.animated)
        
        return PopResult(stack: stack.componentId!, id: viewController?.componentId)
    }
    
    @MainActor
    func setOptions(_ options: SetComponentOptions) async throws {
        guard let vc = self.component(options.id) else {
            throw NativeNavigatorError.componentNotFound(name: options.id)
        }

        let componentOptions = options.options
        
        try self.configureViewController(vc, options: componentOptions, animated: options.animated)
    }

    @MainActor
    func reset() async throws {
        self.window.rootViewController = self.saveCapacitorRoot

        if let rootViewController = self.window.rootViewController, rootViewController.presentedViewController != nil {
            rootViewController.dismiss(animated: false)
        }

        self.retainedComponentsById.removeAll()
        self.componentsById.removeAll()
    }
    
    private func findStack(name: String?) throws -> UINavigationController {
        if let stackNameValue = name {
            guard let possibleStackValue = self.component(stackNameValue) else {
                throw NativeNavigatorError.componentNotFound(name: stackNameValue)
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
        guard let view = self.component(componentId) else {
            throw NativeNavigatorError.componentNotFound(name: componentId)
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

        var foundMore = true
        while foundMore {
            foundMore = false

            while result?.presentedViewController != nil {
                result = result?.presentedViewController
                foundMore = true
            }
            if let tabs = result as? UITabBarController {
                if let selectedViewController = tabs.selectedViewController {
                    result = selectedViewController
                    foundMore = true
                }
            }
        }

        return result
    }

    private func generateId() -> String {
        let result = "_component\(self.idCounter)"
        self.idCounter += 1
        return result
    }

    private func component(_ id: ComponentId) -> UIViewController? {
        if let root = retainedComponentsById[id] {
            return root
        } else if let component = componentsById[id] {
            if let viewController = component.value {
                return viewController
            } else {
                return nil
            }
        } else {
            return nil
        }
    }

    private func storeComponent(_ component: UIViewController, options: CreateOptions) throws -> String {
        let id = options.id ?? generateId()

        if self.component(id) != nil {
            throw NativeNavigatorError.componentAlreadyExists(name: id)
        }

        retainedComponentsById[id] = component
        componentsById[id] = WeakContainer<UIViewController>(value: component)

        component.componentId = id
        component.options = options
        return id
    }

    private func removeComponent(_ id: ComponentId) {
        retainedComponentsById[id] = nil
        componentsById[id] = nil
    }

    private func unretainComponentIfNecessary(_ component: UIViewController) {
        if let componentCreateOptions = component.options, let componentId = component.componentId, !componentCreateOptions.retain {
            retainedComponentsById[componentId] = nil
        }
    }

    @MainActor
    private func createStack(_ options: CreateOptions) async throws -> UINavigationController {
        let nc = UINavigationController()
        
        /* So our webView doesn't disappear under the title bar */
//        nc.navigationBar.scrollEdgeAppearance = nc.navigationBar.standardAppearance

        if let componentOptions = options.options {
            try self.configureViewController(nc, options: componentOptions, animated: false)
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

        _ = try self.storeComponent(nc, options: options)
        return nc
    }

    @MainActor
    private func createTabs(_ options: CreateOptions) async throws -> UITabBarController {
        guard let tabsOptions = options.tabsOptions else {
            throw NativeNavigatorError.illegalState(message: "Missing tabsOptions")
        }
        
        let tc = UITabBarController()
        if let componentOptions = options.options {
            try self.configureViewController(tc, options: componentOptions, animated: false)
        }

        var vcs: [UIViewController] = []
        for tabOption in tabsOptions.tabs {
            let tab = try await self.createViewController(tabOption)
            vcs.append(tab)
        }

        tc.viewControllers = vcs

        _ = try storeComponent(tc, options: options)
        return tc
    }

    private func createView(_ options: CreateOptions) throws -> UIViewController {
        guard let viewOptions = options.viewOptions else {
            throw NativeNavigatorError.illegalState(message: "Missing viewOptions")
        }
        
        let vc = NativeNavigationViewController(path: viewOptions.path, state: viewOptions.state)
        if let componentOptions = options.options {
            try self.configureViewController(vc, options: componentOptions, animated: false)
        }

        let id = try storeComponent(vc, options: options)
        
        var notificationData: [String : Any] = ["path": viewOptions.path, "id": id]
        if let state = viewOptions.state {
            notificationData["state"] = state
        }

        /* Callback to JavaScript to trigger a call to window.open to create the WKWebView and then init it */
        self.plugin.notifyListeners("createView", data: notificationData, retainUntilConsumed: true)

        vc.onDeinit = {
            self.plugin.notifyListeners("destroyView", data: ["id": id], retainUntilConsumed: true)
            self.removeComponent(id) // TODO call removeComponent for stacks and tabs too
        }
        return vc
    }

    private func configureViewController(_ viewController: UIViewController, options: ComponentOptions, animated: Bool) throws {
        if let modalPresentationStyle = options.modalPresentationStyle {
            viewController.modalPresentationStyle = modalPresentationStyle.toUIModalPresentationStyle()
        }

        if let title = options.title {
//            viewController.title = title
            viewController.navigationItem.title = title
            viewController.tabBarItem.title = title
        }

        if let stackOptions = options.stack {
            if let item = stackOptions.backItem {
                viewController.navigationItem.backButtonTitle = item.title
            }
            if let items = stackOptions.leftItems {
                viewController.navigationItem.leftBarButtonItems = items.map({ item in toBarButtonItem(item) })
            }
            if let items = stackOptions.rightItems {
                viewController.navigationItem.rightBarButtonItems = items.map({ item in toBarButtonItem(item) })
            }
        }

        if let tabOptions = options.tab {
            if let badgeValue = tabOptions.badgeValue {
                viewController.tabBarItem.badgeValue = badgeValue
            } else {
                viewController.tabBarItem.badgeValue = nil
            }
            if let image = tabOptions.image {
                viewController.tabBarItem.image = try toImage(image)
            }
        }

        func toBarButtonItem(_ stackItem: ComponentOptions.StackItem) -> UIBarButtonItem {
            let action = UIAction(title: stackItem.title) { [weak viewController] _ in
                if let viewController = viewController, let componentId = viewController.componentId {
                    let data = ["buttonId": stackItem.id, "componentId": componentId]
                    self.plugin.notifyListeners("click:\(componentId)", data: data, retainUntilConsumed: true)
                    self.plugin.notifyListeners("click", data: data, retainUntilConsumed: true)
                }
            }
            return UIBarButtonItem(primaryAction: action)
        }

        func toImage(_ path: String) throws -> UIImage {
            guard let url = URL(string: path, relativeTo: self.bridge.webView?.url) else {
                throw NativeNavigatorError.illegalState(message: "Cannot construct URL for path: \(path)")
            }

            let data: Data
            do {
                data = try Data(contentsOf: url)
            } catch {
                throw NativeNavigatorError.illegalState(message: "Failed to load image \"\(path)\": \(error)")
            }

            if let uiImage = UIImage(data: data) {
                return uiImage
            } else {
                throw NativeNavigatorError.illegalState(message: "Not an image at \"\(path)\"")
            }
        }

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
    static var componentId: UInt8 = 0
    static var createOptions: UInt8 = 0
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

    var options: CreateOptions? {
        get {
            guard let value = objc_getAssociatedObject(self, &AssociatedKeys.createOptions) as? CreateOptions else {
                return nil
            }
            return value
        }
        set(newValue) {
            objc_setAssociatedObject(self, &AssociatedKeys.createOptions, newValue, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
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
    var onDeinit: (() -> Void)?

    init(path: String, state: JSObject?) {
        self.path = path
        self.state = state
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        if let onDeinit = self.onDeinit {
            onDeinit()
        }
    }

}
