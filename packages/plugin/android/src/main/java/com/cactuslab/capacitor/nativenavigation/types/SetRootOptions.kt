package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class SetRootOptions(val component: ComponentSpec, val animated: Boolean) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): SetRootOptions {
            val componentJS = jsObject.getJSObject("component") ?: throw MissingParameterException("component")
            val component = ComponentSpec.fromJSObject(componentJS)
            val animated = jsObject.getBoolean("animated", false) ?: false
            return SetRootOptions(component, animated)
        }
    }

}
