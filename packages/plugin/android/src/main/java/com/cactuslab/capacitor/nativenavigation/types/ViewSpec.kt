package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject
import java.util.*

class ViewSpec(id: String? = null,
               options: ComponentOptions? = null,
               var path: String,
               var state: JSObject?) :
    ComponentSpec(type = ComponentType.VIEW, id = id ?: UUID.randomUUID().toString(), options = options), TabsOptionsTabs
{

    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()
        obj.put("path", path)
        state?.let { obj.put("state", it) }
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): ViewSpec {

            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )
            if (type != ComponentType.VIEW) {
                throw InvalidParameterException("type", "Type $type is incorrect for ViewOptions")
            }

            val path = jsObject.getString("path") ?: throw MissingParameterException("path")
            val state = jsObject.getJSObject("state")

            val options = jsObject.getJSObject("options")?.let { ComponentOptions.fromJSObject(it) }

            return ViewSpec(id = jsObject.getString("id"),
                options = options,
                path = path,
                state = state
                )
        }
    }
}