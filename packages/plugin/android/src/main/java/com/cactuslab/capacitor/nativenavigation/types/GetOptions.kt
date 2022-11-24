package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class GetOptions(val id: String?) {

    companion object {
        fun fromJSObject(jsObject: JSObject): GetOptions {
            val componentId = jsObject.getString("id")
            return GetOptions(componentId)
        }
    }
}