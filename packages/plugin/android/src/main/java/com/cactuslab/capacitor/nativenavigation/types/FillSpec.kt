package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject

data class FillSpec(var color: String? = null) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        color?.let {
            obj.put(COLOR_KEY, it)
        }
        return obj
    }
    companion object {
        private const val COLOR_KEY = "color"

        fun fromJSObject(jsObject: JSObject): FillSpec {
            val color = jsObject.getString(COLOR_KEY)
            return FillSpec(color)
        }

        fun updateFromContainer(jsObject: JSObject, key: String, existingValue: FillSpec?): FillSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val obj = jsObject.getJSObject(key)!!
                val result = existingValue ?: FillSpec()
                result.color = String.updateFromContainer(obj, COLOR_KEY, result.color)
                result
            }
        }
    }
}

