package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class PopOptions(val stack: String?, val count: Int, val animated: Boolean) {

    companion object {

        fun fromJSObject(jsObject: JSObject): PopOptions {
            val stack = jsObject.getString("stack")
            val count = jsObject.getInteger("count", 1) ?: 1
            val animated = jsObject.getBool("animated") ?: true
            return PopOptions(stack, count, animated)
        }

    }

}
