package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

class TabSpec(
    val title: String?,
    val image: String?,
    val badgeValue: String?,
    val component: TabsOptionsTabs
) {
    companion object {
        fun fromJSObject(jsObject: JSObject): TabSpec {
            val title = jsObject.getString("title")
            val image = jsObject.getString("image")
            val badgeValue = jsObject.getString("badgeValue")

            val componentObject = jsObject.getJSObject("component")
                ?: throw MissingParameterException("component")

            val typeString = componentObject.getString("type")
                ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException("type", typeString)

            val component: TabsOptionsTabs = when (type) {
                ComponentType.STACK -> StackSpec.fromJSObject(componentObject)
                ComponentType.VIEW -> ViewSpec.fromJSObject(componentObject)
                else -> throw InvalidParameterException("type", typeString)
            }

            return TabSpec(title = title, image = image, badgeValue = badgeValue, component = component)
        }
    }
}
