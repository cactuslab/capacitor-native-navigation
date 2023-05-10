import Foundation

protocol NativeNavigationViewController: UIViewController {
    
    var componentId: String { get }
    
    /** Add a callback for when the view has appeared */
    func onViewDidAppear(_ callback: @escaping () -> ())
    
    /** The view controller is about to be, or wants to be, dismissed */
    func willDismiss()
    
    /** The view controller has been dismissed */
    func didDismiss()
    
}

