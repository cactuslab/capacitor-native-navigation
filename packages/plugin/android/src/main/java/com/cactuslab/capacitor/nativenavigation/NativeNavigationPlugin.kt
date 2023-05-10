package com.cactuslab.capacitor.nativenavigation

import android.net.Uri
import android.util.Log
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.lifecycle.ViewModelProvider
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.types.*
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeNavigation")
class NativeNavigationPlugin : Plugin() {
    private lateinit var implementation: NativeNavigation
    private lateinit var model: NativeNavigationViewModel

    private var isLoaded = false

    private val webViewListener = object: WebViewListener() {
        override fun onPageStarted(webView: WebView?) {
            Log.d(TAG, "onPageStarted: A page start was detected on ${webView}")
            if (webView == bridge.webView) {
                Log.d(TAG, "onPageStarted: A page start was detected on the root view. Calling reset now.")
                activity.runOnUiThread {
                    cleanUp()
                }
            }
        }
    }

    override fun load() {
        model = ViewModelProvider(activity)[NativeNavigationViewModel::class.java]
        implementation = NativeNavigation(this, model)
        isLoaded = true

    }

    override fun handleOnStart() {
        super.handleOnStart()
        bridge.addWebViewListener(webViewListener)
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        bridge.removeWebViewListener(webViewListener)
    }

    override fun shouldOverrideLoad(url: Uri?): Boolean? {
        if (!isLoaded) {
            return null
        }
        val result = implementation.shouldOverrideLoad(url)
        Log.d(TAG, "ShouldOverrideLoad of url $url returning $result")
        return result
    }

    @PluginMethod
    fun viewReady(call: PluginCall) {
        try {
            val options = ViewReadyOptions.fromJSObject(call.data)
            implementation.viewReady(options = options)
            call.resolve()
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun present(call: PluginCall) {
        activity.runOnUiThread {
            try {
                val chromeClient = capacitorChromeClient()
                bridge.webView.webChromeClient = NativeNavigationChromeClient(chromeClient, implementation)
                bridge.webView.settings.setSupportMultipleWindows(true)

                val options = PresentOptions.fromJSObject(call.data)
                implementation.present(options = options, call = call)
            } catch (e: MissingParameterException) {
                call.reject(e.localizedMessage)
            }
        }
    }

    @PluginMethod
    fun dismiss(call: PluginCall) {
        try {
            val options = DismissOptions.fromJSObject(call.data)
            activity.runOnUiThread {
                implementation.dismiss(options, call)
            }
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun push(call: PluginCall) {
        try {
            val options = PushOptions.fromJSObject(call.data)
            activity.runOnUiThread {
                implementation.push(options = options, call = call)
            }
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun pop(call: PluginCall) {

        activity.runOnUiThread {
            implementation.pop(call, activity)
        }
//        call.reject("Pop not ready")
//        call.resolve()
    }

    @PluginMethod
    fun get(call: PluginCall) {
        try {
            val options = GetOptions.fromJSObject(call.data)
            activity.runOnUiThread {
                implementation.getOptions(options, call)
            }
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }


    }

    @PluginMethod
    fun update(call: PluginCall) {
        try {
            val options = UpdateOptions.fromJSObject(call.data)
            activity.runOnUiThread {
                implementation.update(options)
                call.resolve()
            }
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun message(call: PluginCall) {
        try {
            val options = MessageOptions.fromJSObject(call.data)
            activity.runOnUiThread {
                implementation.message(options, call)
            }
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    private fun capacitorChromeClient(): WebChromeClient = if (WebViewFeature.isFeatureSupported(WebViewFeature.GET_WEB_CHROME_CLIENT)) {
        when (val client = WebViewCompat.getWebChromeClient(bridge.webView)) {
            is BridgeWebChromeClient -> {
                client
            }
            is NativeNavigationChromeClient -> {
                client.bridgeChromeClient
            }
            else -> client ?: throw Exception("Unexpected web client")
        }
    } else {
        BridgeWebChromeClient(bridge)
    }


    private fun cleanUp() {
        val client = capacitorChromeClient()
        bridge.webView.webChromeClient = client

        implementation.reset()
    }

    @PluginMethod
    fun reset(call: PluginCall) {
        // This is a tear down method. Reset the UI to the capacitor state.
        activity.runOnUiThread {
            cleanUp()
            call.resolve()
        }
    }

    fun notifyCreateView(path: String?, id: String, state: JSObject?, stack: String?) {
        val obj = JSObject()
        path?.let { obj.put("path", it) }
        obj.put("id", id)
        state?.let {
            obj.put("state", it)
        }
        stack?.let {
            obj.put("stack", stack)
        }

        Log.d(TAG, "Notify Create View [path: $path, id: $id, state: $state]")

        notifyListeners("createView", obj, true)
    }

    fun notifyUpdateView(path: String?, id: String, state: JSObject?, stack: String?) {
        val obj = JSObject()
        path?.let { obj.put("path", it) }
        obj.put("id", id)
        state?.let {
            obj.put("state", it)
        }
        stack?.let {
            obj.put("stack", stack)
        }

        Log.d(TAG, "Notify Update View [path: $path, id: $id, state: $state]")

        notifyListeners("updateView", obj, true)
    }

    fun notifyDestroyView(id: String) {
        val obj = JSObject()
        obj.put("id", id)
        Log.d(TAG, "Notify Destroy View [id: $id]")

        notifyListeners("destroyView", obj, true)
    }

    fun notifyClick(buttonId: String, componentId: String) {
        val obj = JSObject()
        obj.put("buttonId", buttonId)
        obj.put("componentId", componentId)

        notifyListeners("click:$componentId",  obj, true)
        notifyListeners("click", obj, true)
    }

    fun notifyMessage(target: String, type: String, value: JSObject?) {
        val obj = JSObject()
        obj.put("target", target)
        obj.put("type", type)
        value?.let {
            obj.put("value", it)
        }

        notifyListeners("message", obj, true)
    }

    fun notifyViewWillAppear(componentId: String) {
        notifyListeners("viewWillAppear:$componentId", JSObject(), true)
    }

    fun notifyViewDidAppear(componentId: String) {
        notifyListeners("viewDidAppear:$componentId", JSObject(), true)
    }

    fun notifyViewWillDisappear(componentId: String) {
        notifyListeners("viewWillDisappear:$componentId", JSObject(), true)
    }

    fun notifyViewDidDisappear(componentId: String) {
        notifyListeners("viewDidDisappear:$componentId", JSObject(), true)
    }

    companion object {
        const val TAG = "NNPlugin"
    }

}