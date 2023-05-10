import Foundation

protocol NativeNavigationViewController: UIViewController {
    
    var componentId: String { get }
    
    /** Add a callback for when the view has appeared */
    func onViewDidAppear(_ callback: @escaping () -> ())
    
    /** The view has been dismissed */
    func dismissed()
    
}

