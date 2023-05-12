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
    
    init(baseViewController: UIViewController) {
        self.baseViewController = baseViewController
    }
    
    func present(_ component: any ComponentModel, animated: Bool) async {
        await sync.perform { await _present(component, animated: animated) }
    }
    
    /**
     Dismiss the view controller. Returns `true` if the view controller could be dismissed, or `false` if it has not been presented.
     */
    func dismiss(_ component: any ComponentModel, animated: Bool) async {
        await sync.perform { await _dismiss(component, animated: animated) }
    }

    func dismissAll(animated: Bool) async {
        await sync.perform { await _dismissAll(animated: animated) }
    }

    /**
     Returns the component id of the top-most component, if there is one.
     */
    func topComponentId() -> ComponentId? {
        var currentViewController = self.baseViewController
        var lastComponentId: ComponentId?
        while let presentedViewController = currentViewController.presentedViewController {
            if let nativeNavigationViewController = presentedViewController as? NativeNavigationViewController {
                lastComponentId = nativeNavigationViewController.componentId
            }

            currentViewController = presentedViewController
        }
        return lastComponentId
    }
    
    @MainActor
    private func _present(_ component: any ComponentModel, animated: Bool) async {
        /* Wait for the present to complete to avoid race conditions, as iOS gets
           into a confused state if multiple things are presented and dismissed at once.
         */
        await withCheckedContinuation { continuation in
            self.topViewController().present(component.viewController, animated: animated) {
                continuation.resume()
            }
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
        if !presentedViewControllers.isEmpty {
            await withCheckedContinuation { continuation in
                component.viewController.dismiss(animated: false) {
                    continuation.resume()
                }
            }
        }

        await withCheckedContinuation { continuation in
            presentingViewController.dismiss(animated: animated) {
                continuation.resume()
            }
        }

        /* Re-present any view controllers that were presented by the dismissed view controller */
        var topViewController = self.topViewController()
        for toPresent in presentedViewControllers {
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

    private func topViewController() -> UIViewController {
        var currentViewController = self.baseViewController
        while let presentedViewController = currentViewController.presentedViewController {
            currentViewController = presentedViewController
        }
        return currentViewController
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
