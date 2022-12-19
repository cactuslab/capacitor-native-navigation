package com.cactuslab.capacitor.nativenavigation

import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import com.getcapacitor.Bridge

class NativeNavigationWebViewClient(val bridge: Bridge): WebViewClient() {

    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        return bridge.localServer.shouldInterceptRequest(request)
    }

    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url ?: return false
        var shouldOverride = bridge.launchIntent(url)
        if (!shouldOverride) {
            shouldOverride = bridge.localServer.shouldOverrideUrlLoading(view, request)
        }
        return shouldOverride
    }

    @Deprecated("Deprecated in Java")
    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        return bridge.launchIntent(Uri.parse(url))
    }

}