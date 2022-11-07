package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class PresentOptions(
    var component: ComponentSpec,
    var animated: Boolean) {

    companion object {
        @Throws(MissingParameterException::class)
        fun fromJSObject(jsObject: JSObject): PresentOptions {
            val componentJS = jsObject.getJSObject("component") ?: throw MissingParameterException("component")
            val component = ComponentSpec.fromJSObject(componentJS)
            val animated = jsObject.getBool("animated") ?: true
            return PresentOptions(component, animated)
        }
    }

}
