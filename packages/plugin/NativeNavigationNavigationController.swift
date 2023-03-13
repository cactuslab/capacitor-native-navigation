import Foundation

class NativeNavigationNavigationController: UINavigationController {
    
    let componentId: String
    
    init(componentId: String) {
        self.componentId = componentId
        
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override var shouldAutomaticallyForwardAppearanceMethods: Bool {
        return true
    }

}
