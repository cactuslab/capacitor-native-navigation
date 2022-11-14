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
        
        let viewId = (path as NSString).lastPathComponent
        
        do {
            return try implementation.webView(forComponent: String(viewId), configuration: configuration)
        } catch {
            CAPLog.print("🤬 Cannot open new webview: \(error)")
            return nil
        }
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
