package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSObject

data class CreateOptions(var type: ComponentType,
                         var id: String? = null,
                         var options: ComponentOptions? = null,
                         var retain: Boolean = false,
                         var stackOptions: StackOptions? = null,
                         var tabsOptions: TabsOptions? = null,
                         var viewOptions: ViewOptions? = null) {

    fun path(): String {
        when (type) {
            ComponentType.STACK -> {
                TODO("Handle the path for a stack")
            }
            ComponentType.TABS -> {
                TODO("Handle the path for a tabs")
            }
            ComponentType.VIEW -> {
                return viewOptions!!.path
            }
        }
    }

    companion object {

        @Throws(MissingParameterException::class, InvalidParameterException::class)
        fun fromJSObject(jsObject: JSObject): CreateOptions {
            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion.get(typeString)
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )
            val options = CreateOptions(type)

            options.retain = jsObject.getBoolean("retain", false)!!
            options.id = jsObject.getString("id")

            when (type) {
                ComponentType.STACK -> {
                    if (jsObject.has("stack")) {
                        val stack = jsObject.getJSONArray("stack")
                        options.stackOptions = StackOptions(stack.jsObjectSequence().map { fromJSObject(it) }.toList())
                    }
                }
                ComponentType.TABS -> {
                    if (!jsObject.has("tabs")) throw MissingParameterException("tabs")
                    val tabs = jsObject.getJSONArray("tabs")
                    options.tabsOptions = TabsOptions(tabs.jsObjectSequence().map { fromJSObject(it) }.toList())
                }
                ComponentType.VIEW -> {
                    val path = jsObject.getString("path") ?: throw MissingParameterException("path")
                    options.viewOptions = ViewOptions(path, jsObject.getJSObject("state"))
                }
            }

            return options
        }
    }
}