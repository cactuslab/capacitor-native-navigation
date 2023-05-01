package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject

data class FillSpec(var color: String? = null) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        color?.let {
            obj.put("color", it)
        }
        return obj
    }
    companion object {
        fun fromJSObject(jsObject: JSObject): FillSpec {
            val color = jsObject.getString("color")
            return FillSpec(color)
        }

        fun updateFromContainer(jsObject: JSObject, key: String, existingValue: FillSpec?): FillSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val obj = jsObject.getJSObject(key)!!
                val result = existingValue ?: FillSpec()
                result.color = String.updateFromContainer(obj, "color", result.color)
                result
            }
        }
    }
}

