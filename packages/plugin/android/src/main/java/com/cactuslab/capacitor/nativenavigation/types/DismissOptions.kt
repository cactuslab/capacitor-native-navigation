package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class DismissOptions(val componentId: String?, val animated: Boolean) {

    companion object {

        fun fromJSObject(jsObject: JSObject): DismissOptions {
            val componentId = jsObject.getString("id")
            val animated = jsObject.getBoolean("animated", false) ?: false
            return DismissOptions(componentId, animated)
        }

    }

}