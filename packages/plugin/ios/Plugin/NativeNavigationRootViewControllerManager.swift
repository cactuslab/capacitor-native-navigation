//
//  NativeNavigationRootViewControllerManager.swift
//  CactuslabNativeNavigation
//
//  Created by Karl von Randow on 11/05/23.
//

import Foundation

/**
 Manages the presentation of root view controllers.
 */
class NativeNavigationRootViewControllerManager {
    
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
    
    private let baseViewController: UIViewController
    
    private (set) var roots: [any ComponentModel] = []
    
    init(baseViewController: UIViewController) {
        self.baseViewController = baseViewController
    }

    func append(root: any ComponentModel) {
        roots.append(root)
    }

    func remove(root: any ComponentModel) {
        roots.removeAll(where: { $0.componentId == root.componentId })
    }

    func remove(id: ComponentId) {
        roots.removeAll(where: { $0.componentId == id })
    }

    func removeAll() {
        roots.removeAll()
    }
    
    func topComponent() -> (any ComponentModel)? {
        return roots.last
    }

    @MainActor
    func present(_ component: any ComponentModel, animated: Bool) async {
        await sync.perform {
            await _present(component, animated: animated)
        }
    }
    
    @MainActor
    func present(_ viewController: UIViewController, animated: Bool) async {
        await sync.perform {
            await _present(viewController, animated: animated)
        }
    }
    
    /**
     Dismiss the view controller. Returns `true` if the view controller could be dismissed, or `false` if it has not been presented.
     */
    @MainActor
    func dismiss(_ component: any ComponentModel, animated: Bool) async {
        await sync.perform { await _dismiss(component, animated: animated) }
    }

    func dismissAll(animated: Bool) async {
        await sync.perform {
            await _dismissAll(animated: animated)
        }
    }

    private func viewControllerToPresent(_ component: any ComponentModel) -> UIViewController? {
        /* Find the position in the hierarchy at which this component should be presented */
        guard let componentIndex = roots.firstIndex(where: { $0.componentId == component.componentId }) else {
            /* The component must have been dismissed */
            return nil
        }

        for i in stride(from: componentIndex - 1, through: 0, by: -1) {
            let candidate = roots[i].viewController
            if candidate.presentingViewController != nil {
                return candidate
            }
        }

        return self.baseViewController
    }
    
    @MainActor
    private func _present(_ viewController: UIViewController, animated: Bool) async {
        let presentingViewController = self.presentedViewControllers(self.baseViewController).last ?? self.baseViewController
        
        await withCheckedContinuation { continuation in
            presentingViewController.present(viewController, animated: animated) {
                continuation.resume()
            }
        }
    }
    
    @MainActor
    private func _present(_ component: any ComponentModel, animated: Bool) async {
        guard let presentingViewController = self.viewControllerToPresent(component) else {
            /* The component must have been dismissed */
            return
        }

        /* If the presenting component itself presents some components, we need to fix the presentation
           hierarchy
         */
        let presentedViewControllers = self.presentedViewControllers(presentingViewController)
        var savedPresentationControllerDelegates: [UIViewController : UIAdaptivePresentationControllerDelegate] = [:]
        for viewController in presentedViewControllers {
            savedPresentationControllerDelegates[viewController] = viewController.presentationController?.delegate
        }
        
        /* Dismiss the currently presented view controllers that we need to insert this new view controller between */
        if !presentedViewControllers.isEmpty {
            await withCheckedContinuation { continuation in
                presentingViewController.dismiss(animated: false) {
                    continuation.resume()
                }
            }
        }

        /* Wait for the present to complete to avoid race conditions, as iOS gets
           into a confused state if multiple things are presented and dismissed at once.
         */
        await withCheckedContinuation { continuation in
            presentingViewController.present(component.viewController, animated: presentedViewControllers.isEmpty && animated) {
                continuation.resume()
            }
        }

        /* Re-present any view controllers that were presented by the dismissed view controller */
        var topViewController: UIViewController = component.viewController
        for toPresent in presentedViewControllers {
            /* Restore presentation controller delegate */
            if let presentationController = toPresent.presentationController {
                presentationController.delegate = savedPresentationControllerDelegates[toPresent]
            }
            
            await withCheckedContinuation { continuation in
                topViewController.present(toPresent, animated: false) {
                    continuation.resume()
                }
            }
            topViewController = toPresent
        }
    }
    
    @MainActor
    private func _dismiss(_ component: any ComponentModel, animated: Bool) async {
        guard let presentingViewController = component.viewController.presentingViewController else {
            return
        }

        /* If the dismissing component itself presents some components, we need to fix the presentation
           hierarchy
         */
        let presentedViewControllers = self.presentedViewControllers(component.viewController)
        var savedPresentationControllerDelegates: [UIViewController : UIAdaptivePresentationControllerDelegate] = [:]
        for viewController in presentedViewControllers {
            savedPresentationControllerDelegates[viewController] = viewController.presentationController?.delegate
        }

        await withCheckedContinuation { continuation in
            presentingViewController.dismiss(animated: presentedViewControllers.isEmpty && animated) {
                continuation.resume()
            }
        }

        /* Re-present any view controllers that were presented by the dismissed view controller */
        var topViewController = presentingViewController
        for toPresent in presentedViewControllers {
            /* Restore presentation controller delegate */
            if let presentationController = toPresent.presentationController {
                presentationController.delegate = savedPresentationControllerDelegates[toPresent]
            }
            
            await withCheckedContinuation { continuation in
                topViewController.present(toPresent, animated: false) {
                    continuation.resume()
                }
            }
            topViewController = toPresent
        }
    }

    @MainActor
    private func _dismissAll(animated: Bool) async {
        if let _ = self.baseViewController.presentedViewController {
            await withCheckedContinuation { continuation in
                self.baseViewController.dismiss(animated: animated) {
                    continuation.resume()
                }
            }
        }
    }

    private func presentedViewControllers(_ viewController: UIViewController) -> [UIViewController] {
        var result: [UIViewController] = []
        if let presentedViewController = viewController.presentedViewController {
            result.append(presentedViewController)
            result.append(contentsOf: self.presentedViewControllers(presentedViewController))
        }
        return result
    }
    
}

/** Ensure one-at-a-time invocation of asynchronous operations. The next one starts when the previous one finishes. */
private actor OneAtATime {
    private var continuations: [CheckedContinuation<Void, Never>]? = nil

    func perform<T>(_ operation: () async throws -> T) async rethrows -> T {
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
