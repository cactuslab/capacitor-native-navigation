package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject

data class FillSpec(var color: String? = null, var onScrollColor: String? = null) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        color?.let {
            obj.put(COLOR_KEY, it)
        }
        onScrollColor?.let {
            obj.put(ON_SCROLL_COLOR_KEY, it)
        }
        return obj
    }
    companion object {
        private const val COLOR_KEY = "color"
        private const val ON_SCROLL_COLOR_KEY = "onScrollColor"

        fun fromJSObject(jsObject: JSObject): FillSpec {
            val color = jsObject.getString(COLOR_KEY)
            val onScrollColor = jsObject.getString(ON_SCROLL_COLOR_KEY)
            return FillSpec(color, onScrollColor)
        }

        fun updateFromContainer(jsObject: JSObject, key: String, existingValue: FillSpec?): FillSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val obj = jsObject.getJSObject(key)!!
                val result = existingValue ?: FillSpec()
                result.color = String.updateFromContainer(obj, COLOR_KEY, result.color)
                result.onScrollColor = String.updateFromContainer(obj, ON_SCROLL_COLOR_KEY, result.onScrollColor)
                result
            }
        }
    }
}

