package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class MessageOptions(
    var target: String?,
    var type: String,
    var value: JSObject?
) {

    companion object {
        fun fromJSObject(jsObject: JSObject): MessageOptions {
            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val target = jsObject.getString("target")
            val value = jsObject.getJSObject("value")
            return MessageOptions(target = target, type = typeString, value = value)
        }
    }
}