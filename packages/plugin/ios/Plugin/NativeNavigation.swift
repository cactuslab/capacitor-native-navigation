import Foundation
import Capacitor



protocol ComponentModel {
    associatedtype T: NativeNavigationViewController
    associatedtype S: ComponentSpec
    var componentId: ComponentId { get }
    var spec: S { get set }
    var viewController: T { get }
    var container: ComponentId? { get }
    var presentOptions: PresentOptions? { get set }
    
    var presented: Bool { get set }
    var dismissed: Bool { get set }
}

class StackModel: ComponentModel {
    let componentId: ComponentId
    var spec: StackSpec
    let viewController: NativeNavigationNavigationController
    var views: [ComponentId]
    let container: ComponentId?
    var presentOptions: PresentOptions?
    var presented: Bool
    var dismissed: Bool
    
    init(componentId: ComponentId, spec: StackSpec, viewController: NativeNavigationNavigationController, views: [ComponentId], container: ComponentId? = nil, presentOptions: PresentOptions? = nil) {
        self.componentId = componentId
        self.spec = spec
        self.viewController = viewController
        self.views = views
        self.container = container
        self.presentOptions = presentOptions
        self.presented = false
        self.dismissed = false
    }
    
    func topComponentId() -> ComponentId? {
        return views.last
    }
}

class TabsModel: ComponentModel {
    let componentId: ComponentId
    var spec: TabsSpec
    let viewController: NativeNavigationTabBarController
    var tabs: [ComponentId]
    var selectedIndex: Int
    let container: ComponentId?
    var presentOptions: PresentOptions?
    var presented: Bool
    var dismissed: Bool
    
    init(componentId: ComponentId, spec: TabsSpec, viewController: NativeNavigationTabBarController, tabs: [ComponentId], selectedIndex: Int, container: ComponentId? = nil, presentOptions: PresentOptions? = nil) {
        self.componentId = componentId
        self.spec = spec
        self.viewController = viewController
        self.tabs = tabs
        self.selectedIndex = selectedIndex
        self.container = container
        self.presentOptions = presentOptions
        self.presented = false
        self.dismissed = false
    }
    
    func selectedComponentId() -> ComponentId? {
        if selectedIndex < tabs.count {
            return tabs[selectedIndex]
        } else {
            return nil
        }
    }
}

class ViewModel: ComponentModel {
    let componentId: ComponentId
    var spec: ViewSpec
    let viewController: NativeNavigationWebViewController
    let container: ComponentId?
    var presentOptions: PresentOptions?
    var presented: Bool
    var dismissed: Bool
    
    init(componentId: ComponentId, spec: ViewSpec, viewController: NativeNavigationWebViewController, container: ComponentId? = nil, presentOptions: PresentOptions? = nil) {
        self.componentId = componentId
        self.spec = spec
        self.viewController = viewController
        self.container = container
        self.presentOptions = presentOptions
        self.presented = false
        self.dismissed = false
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

    @MainActor
    func present(_ options: PresentOptions) async throws -> PresentResult {
        var component = try self.createComponent(options.component, container: nil)
        component.presented = true
        component.presentOptions = options
        
        await waitForViewsReady(component.viewController)
        
        if component.dismissed {
            throw NativeNavigatorError.componentDismissed(name: component.componentId)
        }
        
        let top = try self.currentRoot()
        roots.append(component.componentId)
        
        component.viewController.modalPresentationStyle = options.style.toUIModalPresentationStyle()
        
        component.viewController.presentationController?.delegate = self
        if let top = top {
            top.viewController.present(component.viewController, animated: options.animated)
        } else {
            self.bridge.viewController!.present(component.viewController, animated: options.animated)
        }
        
        /* Wait for the present to complete to avoid race conditions */
        await withCheckedContinuation { continuation in
            component.viewController.onViewDidAppear {
                continuation.resume()
            }
        }

        if component.dismissed {
            if let presentingViewController = component.viewController.presentingViewController {
                presentingViewController.dismiss(animated: options.animated)
                component.viewController.dismissed()
            }
            throw NativeNavigatorError.componentDismissed(name: component.componentId)
        }
        
        return PresentResult(id: component.componentId)
    }

    @MainActor
    func dismiss(_ options: DismissOptions) async throws -> DismissResult {
        var root: (any ComponentModel)
        if let componentId = options.id {
            root = try findComponent(id: componentId)
        } else {
            guard let component = try currentRoot() else {
                throw NativeNavigatorError.illegalState(message: "No presented components")
            }
            root = component
        }
        
        guard root.presented else {
            throw NativeNavigatorError.componentNotPresented(name: root.componentId)
        }
        
        roots.removeAll { $0 == root.componentId }
        removeComponent(root.componentId)
        
        root.viewController.cancel()
        
        if let presentingViewController = root.viewController.presentingViewController {
            root.dismissed = true
            presentingViewController.dismiss(animated: options.animated)
            root.viewController.dismissed()
        } else {
            /* Component not yet presented */
            root.dismissed = true
        }
        
        return DismissResult(id: root.componentId)
    }

    @MainActor
    func push(_ options: PushOptions) async throws -> PushResult {
        let container = try findStackOrView(id: options.target)

        if let stack = container as? StackModel {
            var popped = false
            if options.mode == PushMode.replace {
                if let popCount = options.popCount, popCount > 0 {
                    _ = try pop(PopOptions(stack: options.target, count: popCount, animated: false))
                    popped = true
                }
                
                if let topComponentId = stack.topComponentId() {
                    guard let topComponent = try component(topComponentId) as? ViewModel else {
                        throw NativeNavigatorError.illegalState(message: "Top of stack is not a view: \(topComponentId)")
                    }
                    try await updateView(options.component, component: topComponent)
                    
                    await waitForViewsReady(topComponent.viewController)
                    
                    return PushResult(id: topComponent.componentId, stack: stack.componentId)
                }
            }
            
            let viewModel = try self.createView(options.component, container: stack)
            await waitForViewsReady(viewModel.viewController)

            if let popCount = options.popCount, popCount > 0, !popped {
                _ = try pop(PopOptions(stack: options.target, count: popCount, animated: false))
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
            try await updateView(options.component, component: vc)
            await waitForViewsReady(vc.viewController)
            
            return PushResult(id: vc.componentId)
        } else {
            throw NativeNavigatorError.illegalState(message: "Cannot push to component: \(container.componentId)")
        }
    }
    
    @MainActor
    func pop(_ options: PopOptions) throws -> PopResult {
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
        
    func update(_ options: UpdateOptions, updatedSpec: any ComponentSpec) throws {
        let component = try self.component(options.id)
        
        switch (component, updatedSpec) {
        case let (model as TabsModel, spec as TabsSpec):
            Task {
                try await self.configureViewController(model, options: spec, animated: options.animated)
            }
            model.spec = spec
        case let (model as ViewModel, spec as ViewSpec):
            Task {
                try await self.configureViewController(model, options: spec, animated: options.animated)
            }
            model.spec = spec
        case let (model as StackModel, spec as StackSpec):
            Task {
                try await self.configureViewController(model, options: spec, animated: options.animated)
            }
            model.spec = spec
        default:
            throw NativeNavigatorError.illegalState(message: "Component and Spec did not match types \(component.self), \(updatedSpec.self)")
        }
    }

    @MainActor
    func reset(_ options: ResetOptions) async throws {
        /* Remove existing roots, if any */
        for componentId in self.roots.reversed() {
            do {
                _ = try await self.dismiss(DismissOptions(id: componentId, animated: options.animated))
            } catch {
                print("NativeNavigation.reset: failed to dismiss \(componentId): \(error)")
            }
        }
        
        self.roots.removeAll()
        self.removeComponents(Array(self.componentsById.keys))
    }
    
    @MainActor
    func get(_ options: GetOptions) async throws -> GetResult {
        let component = try findComponent(id: options.id)
        
        var result = GetResult()
        result.component = try self.options(component)
        
        var containerId = component.container
        while containerId != nil {
            let container = try self.component(containerId!)
            if let stack = container as? StackModel, result.stack == nil {
                result.stack = try self.options(stack) as? StackSpec
                containerId = stack.container
            }
            if let tabs = container as? TabsModel, result.tabs == nil {
                result.tabs = try self.options(tabs) as? TabsSpec
                /* We don't look above tabs, as we assume the order is tabs -> stack -> view */
                break
            }
        }
        return result
    }
    
    @MainActor
    func message(_ options: MessageOptions) async throws {
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
            var specs: [ViewSpec] = []
            
            for childId in vc.views {
                let child = try self.component(childId)
                if let childOptions = try options(child) as? ViewSpec {
                    specs.append(childOptions)
                } else {
                    throw NativeNavigatorError.illegalState(message: "Stack contained view controller of an unexpected type: \(childId)")
                }
            }
            
            var result = StackSpec(components: specs)
            result.id = vc.componentId
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
    
    private func updateComponent(_ model: any ComponentModel) throws {
        guard self.componentsById[model.componentId] != nil else {
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
        
        let model = StackModel(componentId: componentId, spec: spec, viewController: nc, views: [], container: container?.componentId)
        
        /* So our webView doesn't disappear under the title bar */
//        nc.navigationBar.scrollEdgeAppearance = nc.navigationBar.standardAppearance

        try self.configureViewController(model, options: spec, animated: false)
        
        var viewControllers = [UIViewController]()
        for stackItemCreateOptions in spec.components {
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
        let model = TabsModel(componentId: componentId, spec: spec, viewController: tc, tabs: [], selectedIndex: 0, container: container?.componentId)
        
        try self.configureViewController(model, options: spec, animated: false)
    
        // TODO: Fix tabs to work with tabSpec
        fatalError("Unimplemented processing of tabComponents in createTabs")
//        let tabComponents = try spec.tabs.map {
//            try self.createComponent($0, container: model)
//        }
        
//        model.tabs = tabComponents.map { $0.componentId }
        
//        tc.viewControllers = tabComponents.map { $0.viewController }
//        tc.delegate = self

//        try storeComponent(model)
//        return model
    }

    @MainActor
    private func createView(_ spec: ViewSpec, container: (any ComponentModel)?) throws -> ViewModel {
        let componentId = spec.id ?? generateId()
        let stackId = (container as? StackModel)?.componentId
        
        let viewController = NativeNavigationWebViewController(componentId: componentId, path: spec.path, state: spec.state, stackId: stackId, plugin: plugin)
        let model = ViewModel(componentId: componentId, spec: spec, viewController: viewController, container: container?.componentId)
        
        try self.configureViewController(model, options: spec, animated: false)

        try storeComponent(model)
        
        return model
    }
    
    @MainActor
    private func updateView(_ spec: ViewSpec, component: ViewModel) async throws {
        let viewController = component.viewController
        
        try self.configureViewController(component, options: spec, animated: false)
        
        viewController.path = spec.path
        viewController.state = spec.state
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
    
    @MainActor
    private func configureViewController(_ component: StackModel, options: StackSpec, animated: Bool) throws {
        let viewController = component.viewController
        viewController.title = options.title
        /* If there is no title set on a UIViewController when it's the root of a stack, the title doesn't show up immediately unless... */
        if let nc = viewController.navigationController {
            nc.navigationBar.setNeedsLayout()
        }
        
        if let barOptions = options.bar {
            /* There doesn't seem to be an easy way to tint the back button item */
            if let color = barOptions.buttons?.color {
                viewController.navigationBar.tintColor = color
            }
            
            if barOptions.background != nil {
                viewController.navigationBar.scrollEdgeAppearance = customiseBarAppearance(UINavigationBarAppearance(), options: barOptions)
            } else {
                viewController.navigationBar.scrollEdgeAppearance = nil
            }
            viewController.navigationBar.standardAppearance = customiseBarAppearance(UINavigationBarAppearance(), options: barOptions)
        }
    }
    
    @MainActor
    private func configureViewController(_ component: TabsModel, options: TabsSpec, animated: Bool) throws {
        let viewController = component.viewController
        viewController.title = options.title
        /* If there is no title set on a UIViewController when it's the root of a stack, the title doesn't show up immediately unless... */
        if let nc = viewController.navigationController {
            nc.navigationBar.setNeedsLayout()
        }
        // TODO: Fix up the code below to work with the new TabsSpec
//        if let tabOptions = options.tab {
//            if let badgeValue = tabOptions.badgeValue {
//                viewController.tabBarItem.badgeValue = badgeValue
//            } else {
//                viewController.tabBarItem.badgeValue = nil
//            }
//            if let image = tabOptions.image {
//                viewController.tabBarItem.image = try toImage(image)
//            }
//        }
    }

    @MainActor
    private func configureViewController(_ component: ViewModel, options: ViewSpec, animated: Bool) throws {
        let viewController = component.viewController
        viewController.title = options.title
        /* If there is no title set on a UIViewController when it's the root of a stack, the title doesn't show up immediately unless... */
        if let nc = viewController.navigationController {
            nc.navigationBar.setNeedsLayout()
        }
        
        if let stackItem = options.stackItem {
            if let backItem = stackItem.backItem {
                viewController.navigationItem.backButtonTitle = backItem.title
                if let _ = backItem.image {
                    // TODO: Handle a back button with a custom image
                }
            } else {
                viewController.navigationItem.backButtonTitle = nil
                viewController.navigationItem.backBarButtonItem = nil
            }
            
            if let items = stackItem.leftItems {
                let existingItems = viewController.navigationItem.leftBarButtonItems ?? []
                viewController.navigationItem.leftBarButtonItems = try items.enumerated().map({ (index, item) in try setOrCreateBarButtonItem(item, buttonItem: existingItems.safeElement(at: index)) })
            } else {
                viewController.navigationItem.leftBarButtonItems = []
            }
            
            if let items = stackItem.rightItems {
                let existingItems = viewController.navigationItem.rightBarButtonItems ?? []
                viewController.navigationItem.rightBarButtonItems = try items.enumerated().map({ (index, item) in try setOrCreateBarButtonItem(item, buttonItem: existingItems.safeElement(at: index)) })
            } else {
                viewController.navigationItem.rightBarButtonItems = []
            }
            
            if let backEnabled = stackItem.backEnabled {
                viewController.navigationItem.setHidesBackButton(!backEnabled, animated: animated)
            } else {
                // TODO: verify correct behaviour, but a sufficient default might be that it's false
                viewController.navigationItem.setHidesBackButton(false, animated: animated)
            }
            
            
            var barSpec = stackItem.bar ?? BarSpec()
            if let containerId = component.container, let stackModel = try findComponent(id: containerId) as? StackModel, let spec = stackModel.spec.bar {
                barSpec = barSpec.barSpecWithFallback(spec)
            }
            
            let appearance = stackItem.bar != nil ? customiseBarAppearance(UINavigationBarAppearance(), options: barSpec) : nil
            viewController.navigationItem.standardAppearance = appearance
            viewController.navigationItem.scrollEdgeAppearance = appearance
            viewController.navigationItem.compactAppearance = appearance
            
            if let navigationController = viewController.navigationController {
                if navigationController.topViewController == viewController {
                    /* This controller is the topmost in this stack so apply options that may show or hide settings for the whole navigation controller */
                    if let barOptions = stackItem.bar {
                        navigationController.setNavigationBarHidden(barOptions.visible == false, animated: animated)
                    }
                    
                }
            }
        }

        func setOrCreateBarButtonItem(_ stackItem: StackBarButtonItem, buttonItem: UIBarButtonItem?) throws -> UIBarButtonItem {
            let action = UIAction(title: stackItem.title) { _ in
                let data = ["buttonId": stackItem.id, "componentId": component.componentId]
                self.plugin.notifyListeners("click:\(component.componentId)", data: data, retainUntilConsumed: true)
                self.plugin.notifyListeners("click", data: data, retainUntilConsumed: true)
            }
            
            let result = buttonItem ?? UIBarButtonItem()
            
            if let image = stackItem.image {
                action.image = try toImage(image)
            }
            
            result.primaryAction = action
        
            return result
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
    
    private func customiseBarAppearance(_ a: UINavigationBarAppearance, options barOptions: BarSpec) -> UINavigationBarAppearance {
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
    
}

extension NativeNavigation: UINavigationControllerDelegate {
    
    func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {

        do {
            guard let navigationController = navigationController as? NativeNavigationNavigationController else {
                throw NativeNavigatorError.illegalState(message: "Unexpected UINavigationController implementation")
            }
            guard let viewController = viewController as? NativeNavigationViewController else {
                throw NativeNavigatorError.illegalState(message: "Unexpected UIViewController implementation")
            }

            let viewComponent = try self.component(viewController.componentId)
            if let viewModel = viewComponent as? ViewModel {
                let barVisible = viewModel.spec.stackItem?.bar?.visible ?? true

                if navigationController.isNavigationBarHidden == barVisible {
                    navigationController.setNavigationBarHidden(!barVisible, animated: animated)
                }
            }
            
        } catch {
            fatalError(error.localizedDescription)
        }
        
    }
    
    /**
     We maintain the array of views in our push and pop methods, so this is often a NOOP, however this catches when the user goes back using native controls.
     */
    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
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
    
    func presentationControllerShouldDismiss(_ presentationController: UIPresentationController) -> Bool {
        let viewController = presentationController.presentedViewController
        if let viewController = viewController as? NativeNavigationViewController {
            if let component = try? findComponent(id: viewController.componentId), let presentOptions = component.presentOptions {
                return presentOptions.cancellable
            }
        }
        return true
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

extension Array {
    func safeElement(at index: Int) -> Element? {
        guard index >= 0 && index < count else { return nil }
        return self[index]
    }
}
