package com.cactuslab.capacitor.nativenavigation

import android.net.Uri
import android.os.Message
import android.util.Log
import android.view.View
import android.webkit.*
import com.getcapacitor.Logger

/**
 * @param componentId the id of the view this webview presents, or null if this is Capacitor's own webview
 */
class NativeNavigationChromeClient(val bridgeChromeClient: WebChromeClient, val nativeNavigation: NativeNavigation, val componentId: String? = null) : WebChromeClient() {

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
        if (componentId == null || consoleMessage == null) {
            return bridgeChromeClient.onConsoleMessage(consoleMessage)
        }

        /* Log messages from the webviews we create ourselves, so we can report which view they came from */
        val message = "View $componentId - File: ${consoleMessage.sourceId()} - Line ${consoleMessage.lineNumber()} - Msg: ${consoleMessage.message()}"
        when (consoleMessage.messageLevel()) {
            ConsoleMessage.MessageLevel.ERROR -> Log.e(CONSOLE_TAG, message)
            ConsoleMessage.MessageLevel.WARNING -> Log.w(CONSOLE_TAG, message)
            ConsoleMessage.MessageLevel.TIP -> Log.d(CONSOLE_TAG, message)
            else -> Log.i(CONSOLE_TAG, message)
        }
        return true
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
        private val CONSOLE_TAG = Logger.tags("Console")
    }
}