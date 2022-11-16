import Foundation
import Capacitor

class NativeNavigation: NSObject {

    private let bridge: CAPBridgeProtocol
    private let plugin: CAPPlugin
    private var webViewDelegate: NativeNavigationWebViewDelegate?
    private var componentsById: [String: WeakContainer<UIViewController>] = [:]
    private var viewReadyContinuations: [ComponentId: CheckedContinuation<Void, Never>] = [:]
    private var idCounter = 1
    private let saveCapacitorRoot: UIViewController?
    private var html: String? = nil
    private var window: UIWindow? {
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
        } // TODO the window is nil if we launch the app with slow animations

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
    func setRoot(_ options: SetRootOptions) async throws -> SetRootResult {
        let root = try await self.createViewController(options.component)
        
        guard let window = self.window else {
            throw NativeNavigatorError.illegalState(message: "No window")
        }
        
        let container = window.rootViewController!
        
        /* Remove an existing root, if any */
        for child in container.children {
            if child.componentId != nil {
                child.willMove(toParent: nil)
                if let childView = child.viewIfLoaded {
                    childView.removeFromSuperview()
                }
                child.removeFromParent()
            }
        }
        
        /* Add new root */
        container.addChild(root)
        root.view.frame = container.view.bounds
        container.view.addSubview(root.view)
        root.didMove(toParent: container)
        
        return SetRootResult(id: root.componentId!)
    }

    @MainActor
    func present(_ options: PresentOptions) async throws -> PresentResult {
        let root = try await self.createViewController(options.component)
        
        guard let top = try self.topViewController() else {
            throw NativeNavigatorError.illegalState(message: "Cannot find top")
        }

        top.present(root, animated: options.animated)

        return PresentResult(id: root.componentId!)
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

        if let presentingViewController = viewController.presentingViewController {
            presentingViewController.dismiss(animated: options.animated)
            return DismissResult(id: id)
        } else {
            throw NativeNavigatorError.notPresented(name: id)
        }
    }

    @MainActor
    func push(_ options: PushOptions) async throws -> PushResult {
        /* Create the new view controller first to avoid a race condition when the creation of a stack is waiting to complete asynchronously while push is called again */
        let vc = try await self.createViewController(options.component)
        
        let stack = try self.findStack(name: options.stack)
        
        if stack.viewControllers.isEmpty {
            stack.setViewControllers([vc], animated: false)
        } else if options.mode == PushMode.replace {
            var viewControllers = stack.viewControllers
            viewControllers[viewControllers.count - 1] = vc
            stack.setViewControllers(viewControllers, animated: options.animated)
        } else if options.mode == PushMode.root {
            stack.setViewControllers([vc], animated: options.animated)
        } else {
            stack.pushViewController(vc, animated: options.animated)
        }

        return PushResult(id: vc.componentId!, stack: stack.componentId!)
    }
    
    @MainActor
    func pop(_ options: PopOptions) async throws -> PopResult {
        let stack = try self.findStack(name: options.stack)
        
        let count = options.count ?? 1
        if count > 1 {
            let viewControllers = stack.viewControllers
            if count < viewControllers.count {
                let targetViewController = viewControllers[viewControllers.count - count - 1]
                let popped = stack.popToViewController(targetViewController, animated: options.animated)
                return PopResult(stack: stack.componentId!, count: popped?.count ?? 0, id: popped?.count ?? 0 > 0 ? popped?[0].componentId : nil)
            } else {
                let popped = stack.popToRootViewController(animated: options.animated)
                return PopResult(stack: stack.componentId!, count: popped?.count ?? 0, id: popped?.count ?? 0 > 0 ? popped?[0].componentId : nil)
            }
        } else if count == 1 {
            let viewController = stack.popViewController(animated: options.animated)
            return PopResult(stack: stack.componentId!, count: viewController != nil ? 1 : 0, id: viewController?.componentId)
        } else {
            return PopResult(stack: stack.componentId!, count: 0)
        }
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
    func reset(_ options: ResetOptions) async throws {
        guard let window = self.window else {
            throw NativeNavigatorError.illegalState(message: "No window")
        }
        
        window.rootViewController = self.saveCapacitorRoot

        if window.rootViewController?.presentedViewController != nil {
            window.rootViewController?.dismiss(animated: options.animated)
        }

        self.componentsById.removeAll()
    }
    
    @MainActor
    func get(_ options: GetOptions) async throws -> ComponentSpec {
        var vc: UIViewController?
        if let id = options.id {
            vc = self.component(id)
            guard vc != nil else {
                throw NativeNavigatorError.componentNotFound(name: id)
            }
        } else {
            vc = try self.topViewController()
        }
        
        guard let vc = vc else {
            throw NativeNavigatorError.illegalState(message: "No current component")
        }
        
        return try self.options(vc)
    }
    
    @MainActor
    private func options(_ vc: UIViewController) throws -> ComponentSpec {
        if let vc = vc as? UINavigationController {
            var result = StackSpec(stack: [])
            result.id = vc.componentId
            
            for child in vc.viewControllers {
                result.stack.append(try options(child))
            }
            return result
        } else if let vc = vc as? UITabBarController {
            var result = TabsSpec(tabs: [])
            result.id = vc.componentId
            return result
        } else if let vc = vc as? NativeNavigationViewController {
            var result = ViewSpec(path: vc.path)
            result.id = vc.componentId
            return result
        } else {
            throw NativeNavigatorError.illegalState(message: "Component is not of an expected type: \(vc.componentId ?? "no id")")
        }
    }
    
    @MainActor
    func viewReady(_ options: ViewReadyOptions) async throws {
        guard let continuation = viewReadyContinuations[options.id] else {
            throw NativeNavigatorError.illegalState(message: "No view ready continuation found: \(options.id)")
        }
        
        continuation.resume()
    }
    
    @MainActor
    private func createViewController(_ spec: ComponentSpec) async throws -> UIViewController {
        if let stackSpec = spec as? StackSpec {
            return try await createStack(stackSpec)
        } else if let tabsSpec = spec as? TabsSpec {
            return try await createTabs(tabsSpec)
        } else if let viewSpec = spec as? ViewSpec {
            return try await createView(viewSpec)
        } else {
            throw NativeNavigatorError.illegalState(message: "Unsupported component spec \(spec.type)")
        }
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
        guard let window = self.window else {
            throw NativeNavigatorError.illegalState(message: "No window")
        }
        
        var result = window.rootViewController!
        
        /* Find our root */
        if let root = result.children.last {
            result = root
        }

        var foundMore = true
        while foundMore {
            foundMore = false

            while result.presentedViewController != nil {
                result = result.presentedViewController!
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
        if let component = componentsById[id] {
            if let viewController = component.value {
                return viewController
            } else {
                return nil
            }
        } else {
            return nil
        }
    }

    private func storeComponent(_ component: UIViewController, options: ComponentSpec) throws -> String {
        let id = options.id ?? generateId()

        if self.component(id) != nil {
            throw NativeNavigatorError.componentAlreadyExists(name: id)
        }

        componentsById[id] = WeakContainer<UIViewController>(value: component)

        component.componentId = id
        component.options = options
        return id
    }

    @MainActor
    private func removeComponent(_ id: ComponentId) {
        componentsById[id] = nil
    }

    @MainActor
    private func createStack(_ options: StackSpec) async throws -> UINavigationController {
        let nc = UINavigationController()
        
        /* So our webView doesn't disappear under the title bar */
//        nc.navigationBar.scrollEdgeAppearance = nc.navigationBar.standardAppearance

        if let componentOptions = options.options {
            try self.configureViewController(nc, options: componentOptions, animated: false)
        }
        
        var viewControllers = [UIViewController]()
        for stackItemCreateOptions in options.stack {
            let stackItem = try await self.createViewController(stackItemCreateOptions)
            viewControllers.append(stackItem)
        }
        nc.viewControllers = viewControllers

        _ = try self.storeComponent(nc, options: options)
        return nc
    }

    @MainActor
    private func createTabs(_ options: TabsSpec) async throws -> UITabBarController {
        let tc = UITabBarController()
        if let componentOptions = options.options {
            try self.configureViewController(tc, options: componentOptions, animated: false)
        }
        
        /* Load tabs asynchronously */
        let vcs: [UIViewController] = try await withThrowingTaskGroup(of: UIViewController.self) { [self] group in
            for tabOption in options.tabs {
                group.addTask {
                    try await self.createViewController(tabOption)
                }
            }
            
            var result: [UIViewController] = []
            for try await vc in group {
                result.append(vc)
            }
            return result
        }
        
        tc.viewControllers = vcs

        _ = try storeComponent(tc, options: options)
        return tc
    }

    @MainActor
    private func createView(_ options: ViewSpec) async throws -> UIViewController {
        let vc = NativeNavigationViewController(path: options.path, state: options.state)
        if let componentOptions = options.options {
            try self.configureViewController(vc, options: componentOptions, animated: false)
        }

        let id = try storeComponent(vc, options: options)
        
        var notificationData: [String : Any] = ["path": options.path, "id": id]
        if let state = options.state {
            notificationData["state"] = state
        }

        vc.onDeinit = {
            self.plugin.notifyListeners("destroyView", data: ["id": id], retainUntilConsumed: true)
            DispatchQueue.main.async {
                self.removeComponent(id) // TODO call removeComponent for stacks and tabs too
            }
        }
        
        await withCheckedContinuation { continuation in
            viewReadyContinuations[id] = continuation
            
            /* Callback to JavaScript to trigger a call to window.open to create the WKWebView and then init it */
            self.plugin.notifyListeners("createView", data: notificationData, retainUntilConsumed: true)
        }
        
        return vc
    }

    private func configureViewController(_ viewController: UIViewController, options: ComponentOptions, animated: Bool) throws {
        if let modalPresentationStyle = options.modalPresentationStyle {
            viewController.modalPresentationStyle = modalPresentationStyle.toUIModalPresentationStyle()
        }

        if let title = options.title {
            switch title {
            case .null:
                viewController.title = nil
            case .value(let title):
                viewController.title = title
                
                /* If there is no title set on a UIViewController when it's the root of a stack, the title doesn't show up immediately unless... */
                if let nc = viewController.navigationController {
                    nc.navigationBar.setNeedsLayout()
                }
            }
        }

        if let stackOptions = options.stack {
            if let item = stackOptions.backItem {
                viewController.navigationItem.backButtonTitle = item.title
            }
            if let items = stackOptions.leftItems {
                viewController.navigationItem.leftBarButtonItems = try items.map({ item in try toBarButtonItem(item) })
            }
            if let items = stackOptions.rightItems {
                viewController.navigationItem.rightBarButtonItems = try items.map({ item in try toBarButtonItem(item) })
            }
        }
        
        if let navigationController = viewController as? UINavigationController {
            if let barOptions = options.bar {
                let a = UIBarAppearance(barAppearance: navigationController.navigationBar.standardAppearance)
                if let color = barOptions.background?.color {
                    a.backgroundColor = color
                }
                
                let aa = UINavigationBarAppearance(barAppearance: a)
                if let titleOptions = barOptions.title {
                    if let color = titleOptions.color {
                        aa.titleTextAttributes[.foregroundColor] = color
                    }
                    if let font = titleOptions.font {
                        aa.titleTextAttributes[.font] = font
                    }
                }
                if let buttonOptions = barOptions.buttons {
                    if let color = buttonOptions.color {
                        aa.buttonAppearance.normal.titleTextAttributes[.foregroundColor] = color
                    }
                    if let font = buttonOptions.font {
                        aa.buttonAppearance.normal.titleTextAttributes[.font] = font
                    }
                }
                
                navigationController.navigationBar.scrollEdgeAppearance = aa
                navigationController.navigationBar.standardAppearance = aa
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

        func toBarButtonItem(_ stackItem: ComponentOptions.StackBarItem) throws -> UIBarButtonItem {
            let action = UIAction(title: stackItem.title) { [weak viewController] _ in
                if let viewController = viewController, let componentId = viewController.componentId {
                    let data = ["buttonId": stackItem.id, "componentId": componentId]
                    self.plugin.notifyListeners("click:\(componentId)", data: data, retainUntilConsumed: true)
                    self.plugin.notifyListeners("click", data: data, retainUntilConsumed: true)
                }
            }
            if let image = stackItem.image {
                action.image = try toImage(image)
            }
            return UIBarButtonItem(primaryAction: action)
        }

        func toImage(_ image: ImageObject) throws -> UIImage {
            guard let url = URL(string: image.uri, relativeTo: self.bridge.webView?.url) else {
                throw NativeNavigatorError.illegalState(message: "Cannot construct URL for path: \(image.uri)")
            }

            let data: Data
            do {
                data = try Data(contentsOf: url)
            } catch {
                throw NativeNavigatorError.illegalState(message: "Failed to load image \"\(image.uri)\": \(error)")
            }
            
            let scale = image.scale ?? determineImageScale(image.uri)
            if let uiImage = UIImage(data: data, scale: scale) {
                return uiImage
            } else {
                throw NativeNavigatorError.illegalState(message: "Not an image at \"\(image.uri)\"")
            }
        }
        
        func determineImageScale(_ path: String) -> CGFloat {
            let filename = ((path as NSString).lastPathComponent as NSString).deletingPathExtension
            if filename.hasSuffix("@2x") {
                return 2
            } else if filename.hasSuffix("@3x") {
                return 3
            } else {
                return 1
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
        let sanitizedContent = content.replacingOccurrences(of: "<script", with: "<!-- ")
            .replacingOccurrences(of: "</script>", with: " -->")
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

    var options: ComponentSpec? {
        get {
            guard let value = objc_getAssociatedObject(self, &AssociatedKeys.createOptions) as? ComponentSpec else {
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
                webView.translatesAutoresizingMaskIntoConstraints = false
                self.view.addSubview(webView)
                webView.leftAnchor.constraint(equalTo: self.view.leftAnchor).isActive = true
                webView.rightAnchor.constraint(equalTo: self.view.rightAnchor).isActive = true
                webView.topAnchor.constraint(equalTo: self.view.topAnchor).isActive = true
                webView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor).isActive = true
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
