//
//  NativeNavigationRootViewControllerManager.swift
//  CapacitorNativeNavigation
//
//  Created by Karl von Randow on 11/05/23.
//

import Capacitor
import Foundation
import UIKit

/**
 Manages the presentation of root view controllers.

 The bottom root becomes a child of the base view controller. We do not present it. Capacitor
 plugins present their own view controllers on `bridge.viewController`, which is the base view
 controller. UIKit refuses a presentation on a view controller that already presents another one,
 and it reports no error, so a presented bottom root stops those plugins from working.

 Each root above the bottom root is presented on the nearest root below it.
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
    
    private(set) var roots: [any ComponentModel] = []

    /** The view controller that is a child of the base view controller, if there is one. */
    private var embeddedViewController: UIViewController?

    /** Where a root belongs in the view controller hierarchy. */
    private enum RootPlacement {
        /** The root becomes a child of the base view controller. */
        case embed
        /** The root is presented on the given view controller. */
        case present(on: UIViewController)
        /** The root has gone, so it belongs nowhere. */
        case nowhere
    }

    init(baseViewController: UIViewController) {
        self.baseViewController = baseViewController
    }

    func append(root: any ComponentModel) {
        roots.append(root)
    }

    func remove(id: ComponentId) {
        roots.removeAll(where: { $0.componentId == id })
    }

    func removeAll() {
        roots.removeAll()
    }
    
    func topComponent() -> (any ComponentModel)? {
        for component in roots.reversed() {
            if component.presented {
                return component
            }
        }
        return nil
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

    private func placement(for component: any ComponentModel) -> RootPlacement {
        /* Find the position in the hierarchy at which this component belongs */
        guard let componentIndex = roots.firstIndex(where: { $0.componentId == component.componentId }) else {
            /* The component must have been dismissed */
            return .nowhere
        }

        /* Find the nearest root below this one that is on the screen */
        for i in stride(from: componentIndex - 1, through: 0, by: -1) {
            let candidate = roots[i].viewController
            if candidate === embeddedViewController || candidate.presentingViewController != nil {
                return .present(on: candidate)
            }
        }

        /* This is the bottom root, so it becomes a child of the base view controller */
        if embeddedViewController == nil {
            return .embed
        }

        /* We have a bottom root while another view controller is already a child of the base view
           controller. We believe this cannot happen. Presenting on the base view controller is the
           behaviour this class exists to avoid, so say so loudly rather than fail quietly.
         */
        CAPLog.print("🤖 NativeNavigation: presenting root \(component.componentId) on the base view controller, which stops other plugins from presenting")
        assertionFailure("A bottom root was placed while another view controller is embedded")
        return .present(on: self.baseViewController)
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
        switch placement(for: component) {
        case .nowhere:
            /* The component must have been dismissed */
            return
        case .embed:
            embed(component.viewController)
        case .present(let presentingViewController):
            await _present(component.viewController, on: presentingViewController, animated: animated)
        }
    }

    @MainActor
    private func _present(_ viewControllerToPresent: UIViewController, on presentingViewController: UIViewController, animated: Bool) async {
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
            presentingViewController.present(viewControllerToPresent, animated: presentedViewControllers.isEmpty && animated) {
                continuation.resume()
            }
        }

        /* Re-present any view controllers that were presented by the dismissed view controller */
        var topViewController: UIViewController = viewControllerToPresent
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
        if component.viewController === embeddedViewController {
            /* Removing a child does not disturb what the base view controller presents, so any root
               above this one stays on the screen.
             */
            unembed()
            return
        }

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
            
            /* if the controller to present is presented on an existing controller, first dismiss it without animation */
            if let presentingController = toPresent.presentingViewController {
                await withCheckedContinuation { continuation in
                    presentingController.dismiss(animated: false) {
                        continuation.resume()
                    }
                }
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
        unembed()
    }

    /** Add the given view controller as a child of the base view controller, and let it fill the screen. */
    @MainActor
    private func embed(_ viewController: UIViewController) {
        let baseView = self.baseViewController.view!

        self.baseViewController.addChild(viewController)
        viewController.view.frame = baseView.bounds
        viewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        baseView.addSubview(viewController.view)
        viewController.didMove(toParent: self.baseViewController)

        embeddedViewController = viewController
    }

    /** Remove the child of the base view controller, if there is one. */
    @MainActor
    private func unembed() {
        guard let viewController = embeddedViewController else {
            return
        }

        viewController.willMove(toParent: nil)
        viewController.view.removeFromSuperview()
        viewController.removeFromParent()

        embeddedViewController = nil
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
