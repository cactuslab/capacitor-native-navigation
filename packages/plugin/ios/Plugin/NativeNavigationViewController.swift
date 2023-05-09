import Foundation

protocol NativeNavigationViewController: UIViewController {
    
    var componentId: String { get }
    
    func onViewDidAppear(_ callback: @escaping () -> ())
    
}

