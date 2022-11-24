package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

data class FillOptions(val color: String?) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        color?.let {
            obj.put("color", it)
        }
        return obj
    }
    companion object {
        fun fromJSObject(jsObject: JSObject): FillOptions {
            val color = jsObject.getString("color")
            return FillOptions(color)
        }
    }
}