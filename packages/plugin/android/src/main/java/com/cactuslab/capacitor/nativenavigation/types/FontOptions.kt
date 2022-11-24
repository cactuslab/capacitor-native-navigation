package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class FontOptions(val name: String, val size: Double) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("name", name)
        obj.put("size", size)
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): FontOptions {
            val name = jsObject.getString("name") ?: throw MissingParameterException("name")
            val size = jsObject.getDouble("size")
            return FontOptions(name, size)
        }
    }
}