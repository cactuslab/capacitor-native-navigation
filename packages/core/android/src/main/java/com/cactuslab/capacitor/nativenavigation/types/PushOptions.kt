package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class PushOptions(val component: ViewSpec, val stackId: String?, val animated: Boolean) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): PushOptions {
            val componentJS = jsObject.getJSObject("component") ?: throw MissingParameterException("component")
            val component = ViewSpec.fromJSObject(componentJS)
            val animated = jsObject.getBool("animated") ?: true
            val stackId = jsObject.getString("stack")
            return PushOptions(component, stackId, animated)
        }
    }

}