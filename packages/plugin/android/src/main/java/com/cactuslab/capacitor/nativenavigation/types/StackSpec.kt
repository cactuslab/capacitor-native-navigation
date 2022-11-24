package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import java.util.UUID

class StackSpec(id: String? = null,
                options: ComponentOptions? = null,
                var stack: List<ViewSpec>? = null) : ComponentSpec(type = ComponentType.STACK, id = id ?: UUID.randomUUID().toString(), options = options), TabsOptionsTabs
{
    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()

        stack?.let { obj.put("stack", JSArray(it.map { spec -> spec.toJSObject() })) }

        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): StackSpec {

            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )
            if (type != ComponentType.STACK) {
                throw InvalidParameterException("type", "Type $type is incorrect for ViewOptions")
            }

            val stack = jsObject.getJSONArray("stack")

            val options = jsObject.getJSObject("options")?.let { ComponentOptions.fromJSObject(it) }

            return StackSpec(id = jsObject.getString("id"),
                options = options,
                stack = stack.jsObjectSequence().map { ViewSpec.fromJSObject(it) }.toList()
            )
        }
    }
}