package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

class UpdateOptions(val id: String, val animated: Boolean, val update: JSObject?) {

    companion object {
        fun fromJSObject(jsObject: JSObject): UpdateOptions {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            val animated = jsObject.getBoolean("animated", false) ?: false
            val update = jsObject.getJSObject("update")
            return UpdateOptions(id, animated, update)
        }
    }

}