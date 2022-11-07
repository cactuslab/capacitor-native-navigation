package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

class SetComponentOptions(val id: String, val animated: Boolean, val options: ComponentOptions) {

    companion object {
        fun fromJSObject(jsObject: JSObject): SetComponentOptions {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            val animated = jsObject.getBoolean("animated", false) ?: false
            val options = ComponentOptions.fromJSObject(jsObject)

            return SetComponentOptions(id, animated, options)
        }
    }

}