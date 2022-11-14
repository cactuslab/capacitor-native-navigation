package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

class ViewReadyOptions(var id: String) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): ViewReadyOptions {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            return ViewReadyOptions(id)
        }
    }
}