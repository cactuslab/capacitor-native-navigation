import Foundation

class NativeNavigationTabBarController: UITabBarController, NativeNavigationViewController {
    
    let componentId: String
    private var viewDidAppearCallbacks: [() -> ()] = []
    
    init(componentId: String) {
        self.componentId = componentId
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        for callback in self.viewDidAppearCallbacks {
            callback()
        }
        self.viewDidAppearCallbacks = []
    }
    
    func onViewDidAppear(_ callback: @escaping () -> ()) {
        viewDidAppearCallbacks.append(callback)
    }
    
}
