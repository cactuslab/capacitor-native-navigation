package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject

data class LabelSpec(var color: String? = null, var font: FontSpec? = null) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        color?.let { obj.put("color", it) }
        font?.let { obj.put("font", it.toJSObject()) }
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : LabelSpec {
            val color = jsObject.getString("color")
            val font = jsObject.getJSObject("font")?.let { FontSpec.fromJSObject(it) }
            return LabelSpec(color, font)
        }

        fun updateFromContainer(jsObject: JSObject, key: String, existingValue: LabelSpec?): LabelSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val obj = jsObject.getJSObject(key)!!
                val result = existingValue ?: LabelSpec()
                result.color = String.updateFromContainer(obj, "color", result.color)
                result.font = FontSpec.updateFromContainer(obj, "font", result.font)
                result
            }
        }
    }

}