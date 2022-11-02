package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class PushOptions(val id: String, val stackId: String?, val animated: Boolean) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): PushOptions {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            val animated = jsObject.getBool("animated") ?: true
            val stackId = jsObject.getString("stack")
            return PushOptions(id, stackId, animated)
        }
    }

}