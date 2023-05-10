import Foundation

protocol NativeNavigationViewController: UIViewController {
    
    var componentId: String { get }
    
    /** Add a callback for when the view has appeared */
    func onViewDidAppear(_ callback: @escaping () -> ())
    
    /** The presentation of this view has been cancelled */
    func cancel()
    
    /** The view has been dismissed */
    func dismissed()
    
}

