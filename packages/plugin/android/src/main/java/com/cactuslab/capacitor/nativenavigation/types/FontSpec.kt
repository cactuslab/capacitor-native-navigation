package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject

data class FontSpec(var name: String? = null, var size: Double? = null) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        name?.let { obj.put("name", it) }
        size?.let { obj.put("size", it) }
        return obj
    }

    companion object {
        fun merge(primary: FontSpec?, fallback:FontSpec?) : FontSpec? {
            if (primary == null) {
                return fallback
            }
            if (fallback == null) {
                return primary
            }
            val spec = FontSpec(name = fallback.name, size = fallback.size)
            primary.name?.let { spec.name = it }
            primary.size?.let { spec.size = it }
            return spec
        }

        fun fromJSObject(jsObject: JSObject): FontSpec {
            val name = jsObject.getString("name")
            val size = if (jsObject.has("size")) jsObject.getDouble("size") else null
            return FontSpec(name, size)
        }

        fun updateFromContainer(jsObject: JSObject, key: String, existingValue: FontSpec?): FontSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val result = existingValue ?: FontSpec()
                val obj = jsObject.getJSObject(key)!!
                result.name = String.updateFromContainer(obj, "name", result.name)
                result.size = Double.updateFromContainer(obj, "size", result.size)
                result
            }
        }
    }

}