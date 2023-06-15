package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSObject
import java.util.*

class TabsSpec(id: String? = null,
               alias: String? = null,
               state: JSObject? = null,
               var tabs: List<TabsOptionsTabs>) : ComponentSpec(type = ComponentType.TABS, id = id ?: UUID.randomUUID().toString(), alias = alias, state = state) {

    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()


        return obj
    }

    override fun topBarSpec(): BarSpec? {
        TODO("Not yet implemented")
    }

    override fun update(jsObject: JSObject) {
        TODO("Not yet implemented")
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

            val state = jsObject.getJSObject("state")
            if (!jsObject.has("tabs")) throw MissingParameterException("tabs")
            val tabs = jsObject.getJSONArray("tabs")

            return TabsSpec(id = jsObject.getString("id"),
                alias = jsObject.getString("alias"),
                state = state,
                tabs = tabs.jsObjectSequence().map { tabFromJsObject(it) }.toList()
            )
        }
    }
}