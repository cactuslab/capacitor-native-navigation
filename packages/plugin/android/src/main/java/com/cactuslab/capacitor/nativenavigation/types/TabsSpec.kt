package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSObject
import java.util.*

class TabsSpec(id: String? = null,
               options: ComponentOptions? = null,
               retain: Boolean = false,
               var tabs: List<TabsOptionsTabs>) : ComponentSpec(type = ComponentType.TABS, id = id ?: UUID.randomUUID().toString(), options = options, retain = retain) {

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

            val retain = jsObject.getBoolean("retain", false)!!

            if (!jsObject.has("tabs")) throw MissingParameterException("tabs")
            val tabs = jsObject.getJSONArray("tabs")

            val options = jsObject.getJSObject("options")?.let { ComponentOptions.fromJSObject(it) }

            return TabsSpec(id = jsObject.getString("id"),
                options = options,
                retain = retain,
                tabs = tabs.jsObjectSequence().map { tabFromJsObject(it) }.toList()
            )
        }
    }
}