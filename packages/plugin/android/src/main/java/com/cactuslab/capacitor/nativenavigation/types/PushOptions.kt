package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class PushOptions(val component: ViewSpec, val target: String?, val animated: Boolean, val mode: PushMode, val popCount: Int) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): PushOptions {
            val componentJS = jsObject.getJSObject("component") ?: throw MissingParameterException("component")
            val component = ViewSpec.fromJSObject(componentJS)
            val animated = jsObject.getBool("animated") ?: true
            val target = jsObject.getString("target")
            val mode = jsObject.getString("mode")?.let { PushMode.get(it) } ?: PushMode.PUSH
            val popCount = jsObject.getInteger("popCount", 0) ?: 0
            return PushOptions(component, target, animated, mode, popCount)
        }
    }

}