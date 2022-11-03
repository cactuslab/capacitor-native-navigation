package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions.TabOptions
import com.cactuslab.capacitor.nativenavigation.types.ModalPresentationStyle
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import com.cactuslab.capacitor.nativenavigation.types.TabsOptions
import com.cactuslab.capacitor.nativenavigation.types.ViewOptions
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.cactuslab.capacitor.nativenavigation.types.CreateOptions
import com.getcapacitor.JSObject
import java.util.*

class TabsOptions(id: String? = null,
                   options: ComponentOptions? = null,
                   retain: Boolean = false,
                   var tabs: List<TabsOptionsTabs>) : CreateOptions(type = ComponentType.TABS, id = id ?: UUID.randomUUID().toString(), options = options, retain = retain) {

    companion object {

        private fun tabFromJsObject(jsObject: JSObject): TabsOptionsTabs {
            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )

            return when (type) {
                ComponentType.STACK -> StackOptions.fromJSObject(jsObject)
                ComponentType.VIEW -> ViewOptions.fromJSObject(jsObject)
                else -> {
                    throw InvalidParameterException(
                        "type",
                        typeString
                    )
                }
            }
        }

        fun fromJSObject(jsObject: JSObject): TabsOptions {

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

            return TabsOptions(id = jsObject.getString("id"),
                options = null,
                retain = retain,
                tabs = tabs.jsObjectSequence().map { tabFromJsObject(it) }.toList()
            )
        }
    }
}