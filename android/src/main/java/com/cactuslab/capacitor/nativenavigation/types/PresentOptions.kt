package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class PresentOptions(
    var id: String,
    var animated: Boolean) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): PresentOptions {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            val animated = jsObject.getBool("animated") ?: true
            return PresentOptions(id, animated)
        }
    }

}
