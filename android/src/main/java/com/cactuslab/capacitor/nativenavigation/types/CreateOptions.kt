package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSObject

sealed class CreateOptions(val type: ComponentType,
                         var id: String,
                         val options: ComponentOptions? = null,
                         val retain: Boolean = false) {

    companion object {

        @Throws(MissingParameterException::class, InvalidParameterException::class)
        fun fromJSObject(jsObject: JSObject): CreateOptions {
            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion.get(typeString)
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )

            return when (type) {
                ComponentType.STACK -> {
                    StackOptions.fromJSObject(jsObject)
                }
                ComponentType.TABS -> {
                    TabsOptions.fromJSObject(jsObject)
                }
                ComponentType.VIEW -> {
                    ViewOptions.fromJSObject(jsObject)
                }
            }
        }
    }
}