import Capacitor
import Foundation
import WebKit

class NativeNavigationWebViewDelegate : NSObject, WKUIDelegate {

    private let wrapped: WKUIDelegate?
    private let implementation: NativeNavigation

    init(wrapped: WKUIDelegate?, implementation: NativeNavigation) {
        self.wrapped = wrapped
        self.implementation = implementation
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let path = navigationAction.request.url?.path else { // TODO better recognition of our things
            return self.wrapped?.webView?(webView, createWebViewWith: configuration, for: navigationAction, windowFeatures: windowFeatures)
        }
        
        let viewId = path.dropFirst()
        
        
        print("OPEN \(viewId)") // TODO use URL to configure view
        
        do {
            return try implementation.webView(forViewId: String(viewId), configuration: configuration)
        } catch {
            CAPLog.print("🤬 Cannot open new webview: \(error)")
            return nil
        }

//        let configuration2 = configuration.copy() as! WKWebViewConfiguration

//        let v = UIViewController()
//        v.title = "Hello World"
////        v.modalPresentationStyle = .fullScreen
//        let nv = UINavigationController(rootViewController: v)
//        nv.navigationBar.scrollEdgeAppearance = nv.navigationBar.standardAppearance
//
//        /* So we don't load the javascript from our start path */
//        configuration.preferences = configuration.preferences.copy() as! WKPreferences
//        configuration.preferences.javaScriptEnabled = false
//
//        let newWebView = WKWebView(frame: .zero, configuration: configuration)
//        v.self.view = newWebView
//
//        self.bridge.viewController?.present(nv, animated: true)
//        print("OK")
//
//        let url = webView.url!
//        CAPLog.print("⚡️  Loading new window at \(url.absoluteString)...")
//        _ = newWebView.load(URLRequest(url: url))
//
////        self.bridge.config.appStartPath


//        return newWebView
    }

    // See WebViewDelegationHandler for the funcs that we must proxy through

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        if let wrapped = self.wrapped {
            wrapped.webView?(webView, runJavaScriptAlertPanelWithMessage: message, initiatedByFrame: frame, completionHandler: completionHandler)
        }
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        if let wrapped = self.wrapped {
            wrapped.webView?(webView, runJavaScriptConfirmPanelWithMessage: message, initiatedByFrame: frame, completionHandler: completionHandler)
        }
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        if let wrapped = self.wrapped {
            wrapped.webView?(webView, runJavaScriptTextInputPanelWithPrompt: prompt, defaultText: defaultText, initiatedByFrame: frame, completionHandler: completionHandler)
        }
    }

}
