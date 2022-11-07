package com.cactuslab.capacitor.nativenavigation

import android.os.Build
import android.util.Log
import android.webkit.WebChromeClient
import androidx.lifecycle.ViewModelProvider
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.types.*
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeNavigation")
class NativeNavigationPlugin : Plugin() {
    private lateinit var implementation: NativeNavigation
    private lateinit var model: NativeNavigationViewModel

    override fun load() {
        model = ViewModelProvider(activity)[NativeNavigationViewModel::class.java]
        implementation = NativeNavigation(this, model)
    }

    @PluginMethod
    fun setRoot(call: PluginCall) {
        try {
            val options = SetRootOptions.fromJSObject(call.data)
            activity.runOnUiThread {
                val chromeClient = capacitorChromeClient()
                bridge.webView.webChromeClient =
                    NavigationChromeClient(chromeClient, implementation)
                implementation.setRoot(
                    options = options,
                    context = context,
                    activity = activity,
                    call = call
                )
            }
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun present(call: PluginCall) {
        try {
            val options = PresentOptions.fromJSObject(call.data)
            implementation.present(options = options, call = call)
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun dismiss(call: PluginCall) {

        call.reject("Dismiss not ready")
    }

    @PluginMethod
    fun push(call: PluginCall) {
        try {
            val options = PushOptions.fromJSObject(call.data)
            implementation.push(options = options, call = call)
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
    fun setOptions(call: PluginCall) {
        try {
            val options = SetComponentOptions.fromJSObject(call.data)
            implementation.setOptions(options)
            call.resolve()
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    private fun capacitorChromeClient(): WebChromeClient = if (WebViewFeature.isFeatureSupported(WebViewFeature.GET_WEB_CHROME_CLIENT)) {
        when (val client = WebViewCompat.getWebChromeClient(bridge.webView)) {
            is BridgeWebChromeClient -> {
                client
            }
            is NavigationChromeClient -> {
                client.bridgeChromeClient
            }
            else -> client ?: throw Exception("Unexpected web client")
        }
    } else {
        BridgeWebChromeClient(bridge)
    }

    @PluginMethod
    fun reset(call: PluginCall) {
        // This is a tear down method. Reset the UI to the capacitor state.
        activity.runOnUiThread {
            val client = capacitorChromeClient()
            bridge.webView.webChromeClient = client

            implementation.reset(call)
        }
    }

    fun notifyCreateView(path: String, id: String, state: JSObject?) {
        val obj = JSObject()
        obj.put("path", path)
        obj.put("id", id)
        state?.let {
            obj.put("state", it)
        }

        Log.d(TAG, "Notify Create View [path: $path, id: $id, state: $state]")

        notifyListeners("createView", obj, true)
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
//        notifyListeners("click", obj, true)
    }

    companion object {
        const val TAG = "NNPlugin"
    }

}