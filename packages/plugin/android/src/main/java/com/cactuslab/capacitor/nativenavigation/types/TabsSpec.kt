package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSObject
import java.util.*

class TabsSpec(id: String? = null,
               options: ComponentOptions? = null,
               var tabs: List<TabsOptionsTabs>) : ComponentSpec(type = ComponentType.TABS, id = id ?: UUID.randomUUID().toString(), options = options) {

    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()


        return obj
    }

    companion object {

        private fun tabFromJsObject(jsObject: JSObject): TabsOptionsTabs {
            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )

            return when (type) {
                ComponentType.STACK -> StackSpec.fromJSObject(jsObject)
                ComponentType.VIEW -> ViewSpec.fromJSObject(jsObject)
                else -> {
                    throw InvalidParameterException(
                        "type",
                        typeString
                    )
                }
            }
        }

        fun fromJSObject(jsObject: JSObject): TabsSpec {

            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )
            if (type != ComponentType.STACK) {
                throw InvalidParameterException("type", "Type $type is incorrect for ViewOptions")
            }

            if (!jsObject.has("tabs")) throw MissingParameterException("tabs")
            val tabs = jsObject.getJSONArray("tabs")

            val options = jsObject.getJSObject("options")?.let { ComponentOptions.fromJSObject(it) }

            return TabsSpec(id = jsObject.getString("id"),
                options = options,
                tabs = tabs.jsObjectSequence().map { tabFromJsObject(it) }.toList()
            )
        }
    }
}