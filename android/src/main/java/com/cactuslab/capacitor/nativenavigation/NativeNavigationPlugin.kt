package com.cactuslab.capacitor.nativenavigation

import android.os.Build
import android.util.Log
import androidx.lifecycle.ViewModelProvider
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
    fun create(call: PluginCall) {
        try {
            val options = CreateOptions.fromJSObject(call.data)
            implementation.create(options = options, activity = activity, call = call, bridge = bridge)
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        } catch (e: InvalidParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun setRoot(call: PluginCall) {
        try {
            val options = SetRootOptions.fromJSObject(call.data)
            implementation.setRoot(options = options, context = context, activity = activity, call = call)
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        }
    }

    @PluginMethod
    fun prepare(call: PluginCall) {
        try {
            val options = PrepareOptions.fromJSObject(call.data)
            implementation.prepare(options = options)
            call.resolve()
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
//        call.reject("Pop not ready")
        call.resolve()
    }

    @PluginMethod
    fun setOptions(call: PluginCall) {
//        call.reject("Set Options not ready")
        call.resolve()
    }

    @PluginMethod
    fun reset(call: PluginCall) {

        activity.runOnUiThread {
            val chromeClient = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val client = bridge.webView.webChromeClient
                if (client is BridgeWebChromeClient) {
                    client
                } else if (client is NavigationChromeClient) {
                    client.bridgeChromeClient
                } else {
                    throw Exception("Unexpected web client")
                }
            } else {
                TODO("VERSION.SDK_INT < O")
                BridgeWebChromeClient(bridge)
            }

            bridge.webView.webChromeClient = NavigationChromeClient(chromeClient, implementation)


            implementation.reset(context, activity, call)
//            call.resolve()
        }



//        call.resolve()
//        call.reject("Not ready to reset yet")
    }

    fun notifyCreateView(path: String, id: String, state: JSObject?) {
        val obj = JSObject()
        obj.put("path", path)
        obj.put("id", id)
        state?.let {
            obj.put("state", it)
        }

        Log.d(TAG, "Notify Create View [path: $path, id: $id, state: $state")

        notifyListeners("createView", obj, true)
    }

//    fun nativeNotifyListeners(eventName: String?, data: JSObject?, retainUntilConsumed: Boolean) {
//        notifyListeners(eventName, data, retainUntilConsumed)
//    }

    companion object {
        const val TAG = "NNPlugin"
    }

}