import Foundation
import Capacitor



protocol ComponentModel {
    associatedtype T: UIViewController
    var componentId: ComponentId { get }
    var options: ComponentOptions? { get set }
    var viewController: T { get }
    var container: ComponentId? { get }
}

class StackModel: ComponentModel {
    let componentId: ComponentId
    var options: ComponentOptions?
    let viewController: NativeNavigationNavigationController
    var views: [ComponentId]
    let container: ComponentId?
    
    init(componentId: ComponentId, options: ComponentOptions? = nil, viewController: NativeNavigationNavigationController, views: [ComponentId], container: ComponentId? = nil) {
        self.componentId = componentId
        self.options = options
        self.viewController = viewController
        self.views = views
        self.container = container
    }
    
    func topComponentId() -> ComponentId? {
        return views.last
    }
}

class TabsModel: ComponentModel {
    let componentId: ComponentId
    var options: ComponentOptions?
    let viewController: NativeNavigationTabBarController
    var tabs: [ComponentId]
    var selectedIndex: Int
    let container: ComponentId?
    
    init(componentId: ComponentId, options: ComponentOptions? = nil, viewController: NativeNavigationTabBarController, tabs: [ComponentId], selectedIndex: Int, container: ComponentId? = nil) {
        self.componentId = componentId
        self.options = options
        self.viewController = viewController
        self.tabs = tabs
        self.selectedIndex = selectedIndex
        self.container = container
    }
    
    func selectedComponentId() -> ComponentId? {
        if selectedIndex < tabs.count {
            return tabs[selectedIndex]
        } else {
            return nil
        }
    }
}

struct ViewModel: ComponentModel {
    let componentId: ComponentId
    var options: ComponentOptions?
    let viewController: NativeNavigationWebViewController
    let container: ComponentId?
    
    init(componentId: ComponentId, options: ComponentOptions? = nil, viewController: NativeNavigationWebViewController, container: ComponentId? = nil) {
        self.componentId = componentId
        self.options = options
        self.viewController = viewController
        self.container = container
    }
}

class NativeNavigation: NSObject {

    private let bridge: CAPBridgeProtocol
    private let plugin: CAPPlugin
    private var webViewDelegate: NativeNavigationWebViewDelegate?
    private var componentsById: [ComponentId: any ComponentModel] = [:]
    private var idCounter = 1
    private var html: String? = nil
    private var roots: [ComponentId] = []
    private var window: UIWindow? {
        return self.bridge.webView?.window
    }

    /** We need to let some asynchronous operations happen one-at-a-time so we don't get a race condition
        between creating a component, and then manipultating it.

        An example of such a situation is creating a stack with a view, and then
        pushing on a view, and then replacing that view, all before the first view has finished creating.
        That would mean that when we come to push and replace, we might be looking at a stack that hasn't
        yet appeared, and in fact that might not yet have the pushed view added to it when we come to replace.
        This is because we wait for a view's creation to complete, and the act of creating a view runs more
        JavaScript that might interact with the plugin.
     */
    private let sync = OneAtATime()

    public init(bridge: CAPBridgeProtocol, plugin: CAPPlugin) {
        self.bridge = bridge
        self.plugin = plugin

        super.init()
        
        if let webView = self.bridge.webView {
            self.webViewDelegate = NativeNavigationWebViewDelegate(mainWebView: webView, implementation: self)
            webView.uiDelegate = self.webViewDelegate
            webView.navigationDelegate = self.webViewDelegate

            /* Allow window.open to be used without a click event */
            webView.configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        } else {
            fatalError("No webView")
        }

        Task {
            do {
                try await self.loadPageContent()
            } catch {
                fatalError("Failed to load page content: \(error)")
            }
        }
    }

    func present(_ options: PresentOptions) async throws -> PresentResult {
        return try await sync.perform { try await _present(options) }
    }

    @MainActor
    private func _present(_ options: PresentOptions) async throws -> PresentResult {
        let component = try self.createComponent(options.component, container: nil)
        await waitForViewsReady(component.viewController)

        if !options.animated && options.style == PresentationStyle.fullScreen {
            guard let window = self.window else {
                throw NativeNavigatorError.illegalState(message: "No window")
            }
            
            roots.append(component.componentId)

            let container = window.rootViewController!

            /* Add new root */
            container.addChild(component.viewController)
            component.viewController.view.frame = container.view.bounds
            container.view.addSubview(component.viewController.view)
            component.viewController.didMove(toParent: container)
        } else {
            guard let top = try self.currentRoot() else {
                throw NativeNavigatorError.illegalState(message: "Cannot find top")
            }

            roots.append(component.componentId)
            
            component.viewController.modalPresentationStyle = options.style.toUIModalPresentationStyle()
            
            component.viewController.presentationController?.delegate = self
            top.viewController.present(component.viewController, animated: options.animated)
        }

        return PresentResult(id: component.componentId)
    }

    func dismiss(_ options: DismissOptions) async throws -> DismissResult {
        return try await sync.perform { try await _dismiss(options) }
    }

    @MainActor
    private func _dismiss(_ options: DismissOptions) async throws -> DismissResult {
        let root = try findRoot(id: options.id)
        
        roots.removeAll { $0 == root.componentId }
        removeComponent(root.componentId)
        
        if let presentingViewController = root.viewController.presentingViewController {
            presentingViewController.dismiss(animated: options.animated)
            return DismissResult(id: root.componentId)
        } else {
            removeRoot(root, animated: options.animated)
            return DismissResult(id: root.componentId)
        }
    }

    func push(_ options: PushOptions) async throws -> PushResult {
        return try await sync.perform { try await _push(options) }
    }

    @MainActor
    private func _push(_ options: PushOptions) async throws -> PushResult {
        let container = try findStackOrView(id: options.target)

        if let stack = container as? StackModel {
            var popped = false
            if options.mode == PushMode.replace {
                if let popCount = options.popCount, popCount > 0 {
                    _ = try _pop(PopOptions(stack: options.target, count: popCount, animated: false))
                    popped = true
                }
                
                if let topComponentId = stack.topComponentId() {
                    guard let topComponent = try component(topComponentId) as? ViewModel else {
                        throw NativeNavigatorError.illegalState(message: "Top of stack is not a view: \(topComponentId)")
                    }
                    let afterReady = try await updateView(options.component, component: topComponent)
                    
                    await waitForViewsReady(topComponent.viewController)
                    afterReady()
                    return PushResult(id: topComponent.componentId, stack: stack.componentId)
                }
            }
            
            let viewModel = try self.createView(options.component, container: stack)
            await waitForViewsReady(viewModel.viewController)

            if let popCount = options.popCount, popCount > 0, !popped {
                _ = try _pop(PopOptions(stack: options.target, count: popCount, animated: false))
                popped = true
            }

            /* Push onto a stack */
            if stack.views.isEmpty {
                stack.views = [viewModel.componentId]
                stack.viewController.setViewControllers([viewModel.viewController], animated: false)
            } else if options.mode == PushMode.replace {
                var views = stack.views
                views[views.count - 1] = viewModel.componentId
                let viewControllers = try views.map { try component($0).viewController }
                stack.viewController.setViewControllers(viewControllers, animated: options.animated)
            } else if options.mode == PushMode.root {
                stack.views = [viewModel.componentId]
                stack.viewController.setViewControllers([viewModel.viewController], animated: options.animated)
            } else {
                stack.views.append(viewModel.componentId)
                stack.viewController.pushViewController(viewModel.viewController, animated: options.animated)
            }
            return PushResult(id: viewModel.componentId, stack: stack.componentId)
        } else if let vc = container as? ViewModel {
            /* We can push without a UINavigationController; we just always replace the component's contents */
            let afterReady = try await updateView(options.component, component: vc)
            await waitForViewsReady(vc.viewController)
            afterReady()
            return PushResult(id: vc.componentId)
        } else {
            throw NativeNavigatorError.illegalState(message: "Cannot push to component: \(container.componentId)")
        }
    }

    func pop(_ options: PopOptions) async throws -> PopResult {
        return try await sync.perform { try await _pop(options) }
    }
    
    @MainActor
    private func _pop(_ options: PopOptions) throws -> PopResult {
        guard let stack = try findStackOrView(id: options.stack) as? StackModel else {
            throw NativeNavigatorError.illegalState(message: "Can only pop from a stack")
        }

        let count = options.count ?? 1
        if count > 1 {
            var views = stack.views
            if count < views.count {
                let targetComponentId = views[views.count - count - 1]
                let targetComponent = try component(targetComponentId)
                
                if let popped = stack.viewController.popToViewController(targetComponent.viewController, animated: options.animated), popped.count > 0 {
                    if let poppedComponentId = (popped[0] as? NativeNavigationWebViewController)?.componentId {
                        guard let from = views.firstIndex(of: poppedComponentId) else {
                            throw NativeNavigatorError.illegalState(message: "Popped a component that is not expected: \(poppedComponentId)")
                        }
                        self.removeComponents(Array(views[from...]))
                        views.removeSubrange(from...)
                        stack.views = views
                        return PopResult(stack: stack.componentId, count: popped.count, id: poppedComponentId)
                    } else {
                        throw NativeNavigatorError.illegalState(message: "Popped an unknown component: \(popped[0])")
                    }
                } else {
                    return PopResult(stack: stack.componentId, count: 0, id: nil)
                }
            } else {
                let popped = stack.viewController.popToRootViewController(animated: options.animated)
                let poppedComponentId = try views.first { try component($0).viewController == popped?[0] }
                
                self.removeComponents(Array(views[1...]))
                views.removeSubrange(1...)
                stack.views = views
                return PopResult(stack: stack.componentId, count: popped?.count ?? 0, id: poppedComponentId)
            }
        } else if count == 1 {
            if let viewController = stack.viewController.popViewController(animated: options.animated) {
                guard let poppedComponentId = (viewController as? NativeNavigationWebViewController)?.componentId else {
                    throw NativeNavigatorError.illegalState(message: "Popped an unknown component: \(viewController)")
                }
                
                self.removeComponent(poppedComponentId)
                stack.views.removeLast()
                return PopResult(stack: stack.componentId, count: 1, id: poppedComponentId)
            } else {
                return PopResult(stack: stack.componentId, count: 0)
            }
        } else {
            return PopResult(stack: stack.componentId, count: 0)
        }
    }
    
    @MainActor
    func setOptions(_ options: SetComponentOptions) async throws {
        let component = try self.component(options.id)

        let componentOptions = options.options
        
        try self.configureViewController(component, options: componentOptions, animated: options.animated)
    }

    func reset(_ options: ResetOptions) async throws {
        return try await sync.perform { try await _reset(options) }
    }

    @MainActor
    private func _reset(_ options: ResetOptions) async throws {
        /* Remove an existing root, if any */
        for componentId in self.roots {
            let root = try component(componentId)
            removeRoot(root, animated: options.animated)
        }
        
        self.roots.removeAll()
        self.removeComponents(Array(self.componentsById.keys))
    }

    func get(_ options: GetOptions) async throws -> GetResult {
        return try await sync.perform { try await _get(options) }
    }
    
    @MainActor
    private func _get(_ options: GetOptions) async throws -> GetResult {
        let component = try findComponent(id: options.id)
        
        var result = GetResult()
        result.component = try self.options(component)
        
        if let containerId = component.container {
            let container = try self.component(containerId)
            if let stack = container as? StackModel {
                result.stack = try self.options(stack) as? StackSpec
            }
            if let tabs = container as? TabsModel {
                result.tabs = try self.options(tabs) as? TabsSpec
            }
        }
        return result
    }
    
    func message(_ options: MessageOptions) async throws {
        return try await sync.perform { try await _message(options) }
    }
    
    @MainActor
    private func _message(_ options: MessageOptions) async throws {
        let component = try findComponent(id: options.target)
        
        var data: [String: Any] = [
            "target": component.componentId,
            "type": options.type,
        ]
        if let value = options.value {
            data["value"] = value
        }
        self.plugin.notifyListeners("message", data: data, retainUntilConsumed: true)
    }
    
    @MainActor
    private func options(_ vc: any ComponentModel) throws -> ComponentSpec {
        if let vc = vc as? StackModel {
            var result = StackSpec(stack: [])
            result.id = vc.componentId
            
            for childId in vc.views {
                let child = try self.component(childId)
                if let childOptions = try options(child) as? ViewSpec {
                    result.stack.append(childOptions)
                } else {
                    throw NativeNavigatorError.illegalState(message: "Stack contained view controller of an unexpected type: \(childId)")
                }
            }
            return result
        } else if let vc = vc as? TabsModel {
            var result = TabsSpec(tabs: [])
            result.id = vc.componentId
            return result
        } else if let vc = vc as? ViewModel {
            var result = ViewSpec(path: vc.viewController.path, state: vc.viewController.state)
            result.id = vc.componentId
            return result
        } else {
            throw NativeNavigatorError.illegalState(message: "Component is not of an expected type: \(vc.componentId)")
        }
    }
    
    @MainActor
    func viewReady(_ options: ViewReadyOptions) async throws {
        let component = try self.component(options.id)
        
        guard let component = component as? ViewModel else {
            throw NativeNavigatorError.illegalState(message: "Component is not a view in viewReady: \(options.id)")
        }
        
        try component.viewController.webViewReady()
    }
    
    @MainActor
    private func createComponent(_ spec: ComponentSpec, container: (any ComponentModel)?) throws -> any ComponentModel {
        if let stackSpec = spec as? StackSpec {
            return try createStack(stackSpec, container: container)
        } else if let tabsSpec = spec as? TabsSpec {
            return try createTabs(tabsSpec, container: container)
        } else if let viewSpec = spec as? ViewSpec {
            return try createView(viewSpec, container: container)
        } else {
            throw NativeNavigatorError.illegalState(message: "Unsupported component spec \(spec.type)")
        }
    }
    
    func webView(forComponent componentId: String, configuration: WKWebViewConfiguration) throws -> WKWebView? {
        let view = try self.component(componentId)
        guard let view = view as? ViewModel else {
            throw NativeNavigatorError.illegalState(message: "Not a view: \(componentId)")
        }

        guard let webView = self.bridge.webView else {
            throw NativeNavigatorError.illegalState(message: "Cannot find main webView")
        }
        guard let html = self.html else {
            throw NativeNavigatorError.illegalState(message: "html not loaded")
        }

        let newWebView = WKWebView(frame: .zero, configuration: configuration)
        newWebView.uiDelegate = self.webViewDelegate
        newWebView.navigationDelegate = self.webViewDelegate
        _ = newWebView.loadHTMLString(html, baseURL: webView.url!)
        view.viewController.webView = newWebView
        
        return newWebView
    }
    
    /** Find the root component with the given id, or if no id is given, find the current root component. A root is a component that has been presented. */
    func findRoot(id: ComponentId?) throws -> any ComponentModel {
        if let id = id {
            guard self.roots.contains(id) else {
                throw NativeNavigatorError.notARoot(name: id)
            }
            return try self.component(id)
        }
        
        if let root = try self.currentRoot() {
            return root
        }
        
        throw NativeNavigatorError.illegalState(message: "No current root component found")
    }
    
    /** Find the component with the given id, or if no id is given, find the current leaf component. */
    func findComponent(id: ComponentId?) throws -> any ComponentModel {
        if let id = id {
            return try self.component(id)
        }
        
        if let root = try self.currentRoot() {
            return try findLeaf(root)
        }
        
        throw NativeNavigatorError.illegalState(message: "No current component found")
    }
    
    /** Given a component, find the currently active leaf of that component, or the component itself if it is a leaf. */
    func findLeaf(_ component: any ComponentModel) throws -> any ComponentModel {
        if let stack = component as? StackModel {
            if let top = stack.views.last {
                return try self.component(top)
            } else {
                return stack
            }
        } else if let tabs = component as? TabsModel {
            if let selected = tabs.selectedComponentId() {
                return try findLeaf(try self.component(selected))
            } else {
                return tabs
            }
        } else {
            return component
        }
    }
    
    func findStackOrView(id: ComponentId?) throws -> any ComponentModel {
        if let id = id {
            return try self.component(id)
        }
        
        if let root = try self.currentRoot() {
            if let stack = root as? StackModel {
                return stack
            } else if let tabs = root as? TabsModel {
                if let selected = tabs.selectedComponentId() {
                    return try self.component(selected)
                } else {
                    throw NativeNavigatorError.illegalState(message: "Empty tabs")
                }
            } else if let view = root as? ViewModel {
                return view
            } else {
                throw NativeNavigatorError.illegalState(message: "No native navigation root presented")
            }
        }
        
        throw NativeNavigatorError.illegalState(message: "No current stack or view found")
    }
    
    func findStackOrView(component: UIViewController) throws -> UIViewController {
        if let stack = component as? UINavigationController {
            return stack
        }
        if let view = component as? NativeNavigationWebViewController {
            return view
        }
        if let tabs = component as? UITabBarController {
            if let selectedViewController = tabs.selectedViewController {
                return try findStackOrView(component: selectedViewController)
            } else {
                throw NativeNavigatorError.illegalState(message: "Tabs controller found with no tabs")
            }
        }
        throw NativeNavigatorError.illegalState(message: "Non-component found: \(component)")
    }

    private func currentRoot() throws -> (any ComponentModel)? {
        if let componentId = self.roots.last {
            return try self.component(componentId)
        } else {
            return nil
        }
    }

    private func generateId() -> String {
        let result = "_component\(self.idCounter)"
        self.idCounter += 1
        return result
    }

    private func component(_ id: ComponentId) throws -> any ComponentModel {
        if let component = componentsById[id] {
            return component
        } else {
            throw NativeNavigatorError.componentNotFound(name: id)
        }
    }

    private func storeComponent(_ model: any ComponentModel) throws {
        guard self.componentsById[model.componentId] == nil else {
            throw NativeNavigatorError.componentAlreadyExists(name: model.componentId)
        }

        componentsById[model.componentId] = model
    }

    @MainActor
    private func removeComponent(_ id: ComponentId) {
        if let component = componentsById[id] {
            if let view = component as? ViewModel {
                self.plugin.notifyListeners("destroyView", data: ["id": view.componentId], retainUntilConsumed: true)
            } else if let stack = component as? StackModel {
                removeComponents(stack.views)
            } else if let tabs = component as? TabsModel {
                removeComponents(tabs.tabs)
            }
        }
        
        roots.removeAll { $0 == id }
        componentsById[id] = nil
    }
    
    @MainActor
    private func removeComponents(_ ids: [ComponentId]) {
        for id in ids {
            self.removeComponent(id)
        }
    }

    @MainActor
    private func createStack(_ spec: StackSpec, container: (any ComponentModel)?) throws -> StackModel {
        let componentId = spec.id ?? generateId()
        let nc = NativeNavigationNavigationController(componentId: componentId)
        
        let model = StackModel(componentId: componentId, viewController: nc, views: [], container: container?.componentId)
        
        /* So our webView doesn't disappear under the title bar */
//        nc.navigationBar.scrollEdgeAppearance = nc.navigationBar.standardAppearance

        if let componentOptions = spec.options {
            try self.configureViewController(model, options: componentOptions, animated: false)
        }
        
        var viewControllers = [UIViewController]()
        for stackItemCreateOptions in spec.stack {
            let stackItem = try self.createView(stackItemCreateOptions, container: model)
            model.views.append(stackItem.componentId)
            viewControllers.append(stackItem.viewController)
        }
        nc.viewControllers = viewControllers
        nc.delegate = self

        try storeComponent(model)
        return model
    }

    @MainActor
    private func createTabs(_ spec: TabsSpec, container: (any ComponentModel)?) throws -> TabsModel {
        let componentId = spec.id ?? generateId()
        let tc = NativeNavigationTabBarController(componentId: componentId)
        let model = TabsModel(componentId: componentId, viewController: tc, tabs: [], selectedIndex: 0, container: container?.componentId)
        
        if let componentOptions = spec.options {
            try self.configureViewController(model, options: componentOptions, animated: false)
        }
        
        let tabComponents = try spec.tabs.map {
            try self.createComponent($0, container: model)
        }
        
        model.tabs = tabComponents.map { $0.componentId }
        
        tc.viewControllers = tabComponents.map { $0.viewController }
        tc.delegate = self

        try storeComponent(model)
        return model
    }

    @MainActor
    private func createView(_ spec: ViewSpec, container: (any ComponentModel)?) throws -> ViewModel {
        let componentId = spec.id ?? generateId()
        let stackId = (container as? StackModel)?.componentId
        
        let viewController = NativeNavigationWebViewController(componentId: componentId, path: spec.path, state: spec.state, stackId: stackId, plugin: plugin)
        let model = ViewModel(componentId: componentId, viewController: viewController, container: container?.componentId)
        
        if let componentOptions = spec.options {
            try self.configureViewController(model, options: componentOptions, animated: false)
        }

        try storeComponent(model)
        
        return model
    }
    
    @MainActor
    private func updateView(_ options: ViewSpec, component: ViewModel) async throws -> () -> Void {
        let viewController = component.viewController
        let savedLeftBarButtonItems = viewController.navigationItem.leftBarButtonItems
        let savedRightBarButtonItems = viewController.navigationItem.rightBarButtonItems
        
        if let componentOptions = options.options {
            try self.configureViewController(component, options: componentOptions, animated: false)
        }
        
        viewController.path = options.path
        viewController.state = options.state
        
        /* Tidy up any viewController state that has not been changed during the render of the updated view.
           Doing this _after ready_ means we don't get a flash where items disappear and then appear.
         */
        return {
            if viewController.navigationItem.leftBarButtonItems == savedLeftBarButtonItems {
                viewController.navigationItem.leftBarButtonItems = nil
            }
            if viewController.navigationItem.rightBarButtonItems == savedRightBarButtonItems {
                viewController.navigationItem.rightBarButtonItems = nil
            }
        }
    }
    
    /**
     Create and wait for all of the views in the hierarchy to be ready.
     */
    @MainActor
    private func waitForViewsReady(_ vc: UIViewController) async {
        if let vc = vc as? NativeNavigationWebViewController {
            await vc.createOpdateWebView()
        } else if let nc = vc as? UINavigationController {
            for vc in nc.viewControllers {
                await waitForViewsReady(vc)
            }
        } else if let tc = vc as? UITabBarController {
            for vc in tc.viewControllers ?? [] {
                await waitForViewsReady(vc)
            }
        }
    }

    private func configureViewController(_ component: any ComponentModel, options: ComponentOptions, animated: Bool) throws {
        let viewController = component.viewController
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
            func customiseBarAppearance(_ a: UINavigationBarAppearance, options barOptions: ComponentOptions.BarOptions) -> UINavigationBarAppearance {
                let aa = UINavigationBarAppearance(barAppearance: a)
                if let color = barOptions.background?.color {
                    aa.backgroundColor = color
                }
                
                if let titleOptions = barOptions.title {
                    if let color = titleOptions.color {
                        aa.titleTextAttributes[.foregroundColor] = color
                    }
                    if let font = titleOptions.font {
                        aa.titleTextAttributes[.font] = font
                    }
                }
                if let buttonOptions = barOptions.buttons {
                    let navButtonAppearance = UIBarButtonItemAppearance()
                    
                    if let color = buttonOptions.color {
                        navButtonAppearance.normal.titleTextAttributes[.foregroundColor] = color
                        navigationController.navigationBar.tintColor = color
                    }
                    if let font = buttonOptions.font {
                        navButtonAppearance.normal.titleTextAttributes[.font] = font
                    }
                    
                    aa.backButtonAppearance = navButtonAppearance
                    aa.buttonAppearance = navButtonAppearance
                    aa.doneButtonAppearance = navButtonAppearance
                }
                return aa
            }
            
            if let barOptions = options.bar {
                if barOptions.background != nil {
                    navigationController.navigationBar.scrollEdgeAppearance = customiseBarAppearance(UINavigationBarAppearance(), options: barOptions)
                } else {
                    navigationController.navigationBar.scrollEdgeAppearance = nil
                }
                navigationController.navigationBar.standardAppearance = customiseBarAppearance(UINavigationBarAppearance(), options: barOptions)
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
            let action = UIAction(title: stackItem.title) { _ in
                let data = ["buttonId": stackItem.id, "componentId": component.componentId]
                self.plugin.notifyListeners("click:\(component.componentId)", data: data, retainUntilConsumed: true)
                self.plugin.notifyListeners("click", data: data, retainUntilConsumed: true)
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
    @MainActor
    private func loadPageContent() async throws {
        guard let webView = self.bridge.webView else {
            throw NativeNavigatorError.illegalState(message: "Cannot find webView")
        }

        guard let url = webView.url else {
            throw NativeNavigatorError.illegalState(message: "webView doesn't have a url")
        }
        
        var content: String?
        if let scheme = url.scheme {
            if let schemeHandler = self.bridge.webView?.configuration.urlSchemeHandler(forURLScheme: scheme) {
                let myTask = CaptureDataURLSchemeTask(url: url)
                content = try await withCheckedThrowingContinuation { continuation in
                    myTask.continuation = continuation
                    schemeHandler.webView(self.bridge.webView!, start: myTask)
                }
            }
        }
        
        if content == nil {
            content = try String(contentsOf: url)
        }
        
        guard let content = content else {
            throw NativeNavigatorError.illegalState(message: "cannot load webView html")
        }

        /* Disable any JavaScript on the page, as we don't want to run any JavaScript on these
           pages... we just want to inject DOM nodes.
         */
        let sanitizedContent = content.replacingOccurrences(of: "<script", with: "<!-- ")
            .replacingOccurrences(of: "</script>", with: " -->")
        self.html = sanitizedContent
    }
    
    private func removeRoot(_ root: any ComponentModel, animated: Bool) {
        let viewController = root.viewController
        if viewController.presentedViewController != nil {
            viewController.dismiss(animated: animated)
        } else {
            viewController.willMove(toParent: nil)
            if let rootView = viewController.viewIfLoaded {
                rootView.removeFromSuperview()
            }
            viewController.removeFromParent()
        }
    }
    
}

extension NativeNavigation: UINavigationControllerDelegate {
    
    /**
     We maintain the array of views in our push and pop methods, so this is often a NOOP, however this catches when the user goes back using native controls.
     */
    func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
        do {
            guard let navigationController = navigationController as? NativeNavigationNavigationController else {
                throw NativeNavigatorError.illegalState(message: "Unexpected UINavigationController implementation")
            }
            guard let viewController = viewController as? NativeNavigationViewController else {
                throw NativeNavigatorError.illegalState(message: "Unexpected UIViewController implementation")
            }
            
            guard let component = try self.component(navigationController.componentId) as? StackModel else {
                throw NativeNavigatorError.illegalState(message: "Component for UINavigationController is not a StackModel")
            }
            
            guard let topIndex = component.views.firstIndex(of: viewController.componentId) else {
                throw NativeNavigatorError.illegalState(message: "Top component of UINavigationController is not known: \(viewController.componentId)")
            }
            
            self.removeComponents(Array(component.views[(topIndex + 1)...]))
            component.views.removeSubrange((topIndex + 1)...)
        } catch {
            fatalError(error.localizedDescription)
        }
    }
}

extension NativeNavigation: UITabBarControllerDelegate {
    
    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        do {
            guard let tabBarController = tabBarController as? NativeNavigationTabBarController else {
                throw NativeNavigatorError.illegalState(message: "Unexpected UITabBarController implementation")
            }
            guard let viewController = viewController as? NativeNavigationViewController else {
                throw NativeNavigatorError.illegalState(message: "Unexpected UIViewController implementation: \(viewController)")
            }
            
            guard let component = try self.component(tabBarController.componentId) as? TabsModel else {
                throw NativeNavigatorError.illegalState(message: "Component for UITabBarController is not a TabsModel")
            }
            
            guard let selectedIndex = component.tabs.firstIndex(of: viewController.componentId) else {
                throw NativeNavigatorError.illegalState(message: "Selected component of UITabBarController is not known: \(viewController.componentId)")
            }
            
            component.selectedIndex = selectedIndex
        } catch {
            fatalError(error.localizedDescription)
        }
    }
    
}

extension NativeNavigation: UIAdaptivePresentationControllerDelegate {
    
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        let viewController = presentationController.presentedViewController
        if let viewController = viewController as? NativeNavigationViewController {
            self.removeComponent(viewController.componentId)
        }
    }
    
}

/** Ensure one-at-a-time invocation of asynchronous operations. The next one starts when the previous one finishes. */
private actor OneAtATime {
    private var continuations: [CheckedContinuation<Void, Never>]? = nil

    func perform<T>(_ operation: () async throws -> T) async throws -> T {
        if continuations != nil {
            await withCheckedContinuation { continuation in
                continuations!.append(continuation)
            }
        } else {
            continuations = []
        }

        defer {
            if let next = continuations!.first {
                continuations!.removeFirst()
                next.resume()
            } else {
                continuations = nil
            }
        }

        return try await operation()
    }

}

class CaptureDataURLSchemeTask: NSObject, WKURLSchemeTask {
    var request: URLRequest
    private var data = Data()
    private var encoding: String.Encoding?
    var continuation: CheckedContinuation<String, Error>?
    
    init(url: URL) {
        self.request = URLRequest(url: url)
    }
    
    func didReceive(_ response: URLResponse) {
        if let textEncodingName = response.textEncodingName {
            self.encoding = String.Encoding(rawValue: CFStringConvertEncodingToNSStringEncoding(CFStringConvertIANACharSetNameToEncoding(textEncodingName as CFString)));
        }
    }
    
    func didReceive(_ data: Data) {
        self.data.append(data)
    }
    
    func didFinish() {
        if let encoding = self.encoding {
            if let string = String(data: data, encoding: encoding) {
                continuation?.resume(returning: string)
            } else {
                continuation?.resume(throwing: NativeNavigatorError.illegalState(message: "Cannot parse data"))
            }
        } else {
            if let string = String(data: data, encoding: .utf8) {
                continuation?.resume(returning: string)
            } else {
                continuation?.resume(throwing: NativeNavigatorError.illegalState(message: "Cannot parse data"))
            }
        }
    }
    
    func didFailWithError(_ error: Error) {
        continuation?.resume(throwing: error)
    }
    
}
