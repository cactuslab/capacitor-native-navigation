package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class SetRootOptions(val id: String) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): SetRootOptions {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            return SetRootOptions(id)
        }
    }

}
