package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

data class LabelOptions(val color: String?, val font: FontOptions?) {
    companion object {
        fun fromJSObject(jsObject: JSObject) : LabelOptions {
            val color = jsObject.getString("color")
            val font = jsObject.getJSObject("font")?.let { FontOptions.fromJSObject(it) }
            return LabelOptions(color, font)
        }
    }

}