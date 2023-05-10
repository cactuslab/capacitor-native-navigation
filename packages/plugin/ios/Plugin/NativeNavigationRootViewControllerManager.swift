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
    
    private (set) var roots: [any ComponentModel] = []
    
    private let baseViewController: UIViewController
    
    init(baseViewController: UIViewController) {
        self.baseViewController = baseViewController
    }
    
    func present(_ component: any ComponentModel, animated: Bool) async throws {
        try await sync.perform { await _present(component, animated: animated) }
    }
    
    /**
     Dismiss the view controller. Returns `true` if the view controller could be dismissed, or `false` if it has not been presented.
     */
    func dismiss(_ component: any ComponentModel, animated: Bool) async throws {
        try await sync.perform { await _dismiss(component, animated: animated) }
    }
    
    @MainActor
    func didDismiss(_ component: any ComponentModel) {
        roots.removeAll(where: { $0.componentId == component.componentId })
    }
    
    func currentRoot() -> (any ComponentModel)? {
        return self.roots.last
    }
    
    @MainActor
    private func _present(_ component: any ComponentModel, animated: Bool) async {
        if let top = roots.last {
            top.viewController.present(component.viewController, animated: animated)
        } else {
            self.baseViewController.present(component.viewController, animated: animated)
        }
        
        /* Wait for the present to complete to avoid race conditions */
        await withCheckedContinuation { continuation in
            component.viewController.onViewDidAppear {
                continuation.resume()
            }
        }
        
        roots.append(component)
    }
    
    @MainActor
    private func _dismiss(_ component: any ComponentModel, animated: Bool) async {
        component.viewController.willDismiss()
        
        if let presentingViewController = component.viewController.presentingViewController {
            presentingViewController.dismiss(animated: animated)
            
            didDismiss(component)
            component.viewController.didDismiss()
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
