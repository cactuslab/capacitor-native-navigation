package com.cactuslab.capacitor.nativenavigation

import com.getcapacitor.annotation.CapacitorPlugin
import com.cactuslab.capacitor.nativenavigation.NativeNavigation
import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.getcapacitor.PluginMethod
import com.getcapacitor.PluginCall
import com.cactuslab.capacitor.nativenavigation.types.CreateOptions
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin

@CapacitorPlugin(name = "NativeNavigation")
class NativeNavigationPlugin : Plugin() {
    private val implementation = NativeNavigation()
    @PluginMethod
    fun echo(call: PluginCall) {
        val value = call.getString("value")
        val ret = JSObject()
        value?.let {
            ret.put("value", implementation.echo(it))
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun create(call: PluginCall) {
        try {
            val options = CreateOptions.fromJSObject(call.data)
            call.reject("Made an options but wasn't ready yet")
        } catch (e: MissingParameterException) {
            call.reject(e.localizedMessage)
        } catch (e: InvalidParameterException) {
            call.reject(e.localizedMessage)
        }
    }
}