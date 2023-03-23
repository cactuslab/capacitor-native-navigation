import Capacitor
import Foundation
import WebKit

class NativeNavigationWebViewDelegate : NSObject, WKUIDelegate, WKNavigationDelegate {

    private let wrappedUIDelegate: WKUIDelegate?
    private let wrappedNavigationDelegate: WKNavigationDelegate?
    private let mainWebView: WKWebView
    private let implementation: NativeNavigation

    init(mainWebView: WKWebView, implementation: NativeNavigation) {
        self.wrappedUIDelegate = mainWebView.uiDelegate
        self.wrappedNavigationDelegate = mainWebView.navigationDelegate
        self.mainWebView = mainWebView
        self.implementation = implementation
    }
    
    // MARK: - WKNavigationDelegate
    // See WebViewDelegationHandler for the funcs that we must proxy through
    
    // The force unwrap is part of the protocol declaration, so we should keep it.
    // swiftlint:disable:next implicitly_unwrapped_optional
    public func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        
        if webView == mainWebView {
            self.wrappedNavigationDelegate?.webView?(webView, didStartProvisionalNavigation: navigation)
            
            /* Whenever there is navigation or a page load in Capacitor's webview we must reset the UI that this plugin has created
               otherwise whatever happens in Capacitor's webview will not be visible as our UI will cover it.
             */
            CAPLog.print("🤖 NativeNavigation: resetting plugin due to page load")
            Task {
                do {
                    try await implementation.reset(ResetOptions(animated: false))
                } catch {
                    CAPLog.print("🤖 NativeNavigation: failed to reset plugin on page load: \(error.localizedDescription)")
                }
            }
        }
    }

    @available(iOS 15, *)
    func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        self.wrappedUIDelegate?.webView?(webView, requestMediaCapturePermissionFor: origin, initiatedByFrame: frame, type: type, decisionHandler: decisionHandler)
    }

    @available(iOS 15, *)
    func webView(_ webView: WKWebView,
                 requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        self.wrappedUIDelegate?.webView?(webView, requestDeviceOrientationAndMotionPermissionFor: origin, initiatedByFrame: frame, decisionHandler: decisionHandler)
    }

    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        self.wrappedNavigationDelegate?.webView?(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
    }

    // The force unwrap is part of the protocol declaration, so we should keep it.
    // swiftlint:disable:next implicitly_unwrapped_optional
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        self.wrappedNavigationDelegate?.webView?(webView, didFinish: navigation)
    }

    // The force unwrap is part of the protocol declaration, so we should keep it.
    // swiftlint:disable:next implicitly_unwrapped_optional
    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        self.wrappedNavigationDelegate?.webView?(webView, didFail: navigation, withError: error)
    }

    // The force unwrap is part of the protocol declaration, so we should keep it.
    // swiftlint:disable:next implicitly_unwrapped_optional
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        self.wrappedNavigationDelegate?.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
    }

    public func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        self.wrappedNavigationDelegate?.webViewWebContentProcessDidTerminate?(webView)
    }

    // MARK: - WKUIDelegate
    // See WebViewDelegationHandler for the funcs that we must proxy through

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        self.wrappedUIDelegate?.webView?(webView, runJavaScriptAlertPanelWithMessage: message, initiatedByFrame: frame, completionHandler: completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        self.wrappedUIDelegate?.webView?(webView, runJavaScriptConfirmPanelWithMessage: message, initiatedByFrame: frame, completionHandler: completionHandler)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        self.wrappedUIDelegate?.webView?(webView, runJavaScriptTextInputPanelWithPrompt: prompt, defaultText: defaultText, initiatedByFrame: frame, completionHandler: completionHandler)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let path = navigationAction.request.url?.path, path.starts(with: "/capacitor-native-navigation/") else {
            return self.wrappedUIDelegate?.webView?(webView, createWebViewWith: configuration, for: navigationAction, windowFeatures: windowFeatures)
        }
        
        let viewId = (path as NSString).lastPathComponent
        
        do {
            return try implementation.webView(forComponent: String(viewId), configuration: configuration)
        } catch {
            CAPLog.print("🤖 Cannot open new webview: \(error)")
            return nil
        }
    }

}
