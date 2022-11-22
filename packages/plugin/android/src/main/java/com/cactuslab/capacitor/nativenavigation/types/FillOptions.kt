package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

data class FillOptions(val color: String?) {
    companion object {
        fun fromJSObject(jsObject: JSObject): FillOptions {
            val color = jsObject.getString("color")
            return FillOptions(color)
        }
    }
}