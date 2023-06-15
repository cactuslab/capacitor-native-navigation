package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

sealed class ComponentSpec(val type: ComponentType,
                           var id: String, var alias: String?) {

    open fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("type", type.id)
        obj.put("id", id)
        alias?.let { obj.put("alias", it) }
        return obj
    }

    abstract fun update(jsObject: JSObject)

    abstract fun topBarSpec(): BarSpec?

    companion object {

        @Throws(MissingParameterException::class, InvalidParameterException::class)
        fun fromJSObject(jsObject: JSObject): ComponentSpec {
            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion.get(typeString)
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )

            return when (type) {
                ComponentType.STACK -> {
                    StackSpec.fromJSObject(jsObject)
                }
                ComponentType.TABS -> {
                    TabsSpec.fromJSObject(jsObject)
                }
                ComponentType.VIEW -> {
                    ViewSpec.fromJSObject(jsObject)
                }
            }
        }
    }
}