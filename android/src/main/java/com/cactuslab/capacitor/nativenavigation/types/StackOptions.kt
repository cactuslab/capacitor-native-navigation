package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSObject
import java.util.UUID

class StackOptions(id: String? = null,
                        options: ComponentOptions? = null,
                        retain: Boolean = false,
                        var stack: List<ViewOptions>? = null) : CreateOptions(type = ComponentType.STACK, id = id ?: UUID.randomUUID().toString(), options = options, retain = retain), TabsOptionsTabs
{
    companion object {
        fun fromJSObject(jsObject: JSObject): StackOptions {

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
            val stack = jsObject.getJSONArray("stack")

            return StackOptions(id = jsObject.getString("id"),
                options = null,
                retain = retain,
                stack = stack.jsObjectSequence().map { ViewOptions.fromJSObject(it) }.toList()
            )
        }
    }
}