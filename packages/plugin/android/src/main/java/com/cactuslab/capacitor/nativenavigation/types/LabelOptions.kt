package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

data class LabelOptions(val color: String?, val font: FontOptions?) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        color?.let { obj.put("color", it) }
        font?.let { obj.put("font", it.toJSObject()) }
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : LabelOptions {
            val color = jsObject.getString("color")
            val font = jsObject.getJSObject("font")?.let { FontOptions.fromJSObject(it) }
            return LabelOptions(color, font)
        }
    }

}