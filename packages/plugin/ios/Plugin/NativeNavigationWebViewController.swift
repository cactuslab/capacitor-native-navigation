import Foundation
import Capacitor

class NativeNavigationWebViewController: UIViewController, NativeNavigationViewController {

    private weak var plugin: CAPPlugin!
    private var viewDidAppearCallbacks: [() -> ()] = []
    
    let componentId: String
    var path: String? {
        didSet {
            webViewNeedsUpdate = true
        }
    }
    
    var state: JSObject? {
        didSet {
            webViewNeedsUpdate = true
        }
    }
    
    var webView: WKWebView? {
        willSet {
            if let webView = webView {
                webView.removeFromSuperview()
            }
        }
        didSet {
            if let webView = webView {
                webView.translatesAutoresizingMaskIntoConstraints = false
                self.view.addSubview(webView)
                webView.leftAnchor.constraint(equalTo: self.view.leftAnchor).isActive = true
                webView.rightAnchor.constraint(equalTo: self.view.rightAnchor).isActive = true
                webView.topAnchor.constraint(equalTo: self.view.topAnchor).isActive = true
                webView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor).isActive = true
            }
        }
    }
    private var viewReadyContinuations: [CheckedContinuation<Void, Never>] = []
    private var webViewNeedsUpdate = false
    private let stackId: ComponentId?

    init(componentId: String, path: String?, state: JSObject?, stackId: ComponentId?, plugin: CAPPlugin) {
        self.componentId = componentId
        self.path = path
        self.state = state
        self.stackId = stackId
        self.plugin = plugin
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override var debugDescription: String {
        return "\(super.debugDescription) componentId=\(componentId) path=\(path ?? "<none>")"
    }

    /**
     Create the webview required for this view. Waits for the view to be ready before returning.
     */
    func createOpdateWebView() async {
        guard webView == nil || webViewNeedsUpdate else {
            return
        }

        await withCheckedContinuation { continuation in
            self.viewReadyContinuations.append(continuation)

            var notificationData: [String : Any] = ["id": self.componentId]
            if let path = self.path {
                notificationData["path"] = path
            }
            if let state = self.state {
                notificationData["state"] = state
            }
            if let stackId = self.stackId {
                notificationData["stack"] = stackId
            }

            if webView == nil {
                /* Callback to JavaScript to trigger a call to window.open to create the WKWebView and then init it */
                self.plugin.notifyListeners("createView", data: notificationData, retainUntilConsumed: true)
            } else {
                self.plugin.notifyListeners("updateView", data: notificationData, retainUntilConsumed: true)
            }
        }
    }

    func webViewReady() throws {
        guard let continuation = viewReadyContinuations.first else {
            throw NativeNavigatorError.illegalState(message: "View has already been reported as ready or has not been created")
        }

        viewReadyContinuations.removeFirst()

        continuation.resume()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self.plugin.notifyListeners("viewWillAppear:\(self.componentId)", data: [:], retainUntilConsumed: true)
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        for callback in self.viewDidAppearCallbacks {
            callback()
        }
        self.viewDidAppearCallbacks.removeAll()
        
        self.plugin.notifyListeners("viewDidAppear:\(self.componentId)", data: [:], retainUntilConsumed: true)
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        self.plugin.notifyListeners("viewWillDisappear:\(self.componentId)", data: [:], retainUntilConsumed: true)
    }
    
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        self.plugin.notifyListeners("viewDidDisappear:\(self.componentId)", data: [:], retainUntilConsumed: true)
    }
    
    func onViewDidAppear(_ callback: @escaping () -> ()) {
        viewDidAppearCallbacks.append(callback)
    }
    
    func dismissed() {
        for callback in self.viewDidAppearCallbacks {
            callback()
        }
        self.viewDidAppearCallbacks.removeAll()
        
        for continuation in viewReadyContinuations {
            continuation.resume()
        }
        self.viewReadyContinuations.removeAll()
    }

}
