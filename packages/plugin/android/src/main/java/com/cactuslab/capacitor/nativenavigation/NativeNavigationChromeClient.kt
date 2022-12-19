package com.cactuslab.capacitor.nativenavigation

import android.net.Uri
import android.os.Message
import android.util.Log
import android.view.View
import android.webkit.*

class NativeNavigationChromeClient(val bridgeChromeClient: WebChromeClient, val nativeNavigation: NativeNavigation) : WebChromeClient() {

    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        bridgeChromeClient.onShowCustomView(view, callback)
    }

    override fun onHideCustomView() {
        bridgeChromeClient.onHideCustomView()
    }

    override fun onPermissionRequest(request: PermissionRequest?) {
        bridgeChromeClient.onPermissionRequest(request)
    }

    override fun onJsAlert(
        view: WebView?,
        url: String?,
        message: String?,
        result: JsResult?
    ): Boolean {
        return bridgeChromeClient.onJsAlert(view, url, message, result)
    }

    override fun onJsConfirm(
        view: WebView?,
        url: String?,
        message: String?,
        result: JsResult?
    ): Boolean {
        return bridgeChromeClient.onJsConfirm(view, url, message, result)
    }

    override fun onJsPrompt(
        view: WebView?,
        url: String?,
        message: String?,
        defaultValue: String?,
        result: JsPromptResult?
    ): Boolean {
        return bridgeChromeClient.onJsPrompt(view, url, message, defaultValue, result)
    }

    override fun onGeolocationPermissionsShowPrompt(
        origin: String?,
        callback: GeolocationPermissions.Callback?
    ) {
        return bridgeChromeClient.onGeolocationPermissionsShowPrompt(origin, callback)
    }

    override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
    ): Boolean {
        return bridgeChromeClient.onShowFileChooser(webView, filePathCallback, fileChooserParams)
    }

    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
        return bridgeChromeClient.onConsoleMessage(consoleMessage)
    }

    override fun onCreateWindow(
        view: WebView?,
        isDialog: Boolean,
        isUserGesture: Boolean,
        resultMsg: Message?
    ): Boolean {
        Log.d(TAG, "Asked to create window with view:${view}, isDialog:${isDialog}, isUserGesture: ${isUserGesture}, result:${resultMsg}")

        if (!nativeNavigation.windowOpen(view, isDialog, isUserGesture, resultMsg)) {
            return bridgeChromeClient.onCreateWindow(view, isDialog, isUserGesture, resultMsg)
        }
        return true
    }

    override fun onCloseWindow(window: WebView?) {
        Log.d(TAG, "Told to close window: $window")
        bridgeChromeClient.onCloseWindow(window)
    }

    companion object {
        private const val TAG = "NavChromeClient"
    }
}