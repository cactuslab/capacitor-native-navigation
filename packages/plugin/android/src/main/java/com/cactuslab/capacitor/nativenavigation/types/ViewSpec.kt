package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject
import java.util.*

class ViewSpec(id: String? = null,
               var path: String,
               var state: JSObject?,

               var title: String? = null,
               var stackItem: StackItemSpec? = null,
               ) :
    ComponentSpec(type = ComponentType.VIEW, id = id ?: UUID.randomUUID().toString()), TabsOptionsTabs
{

    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()
        obj.put("path", path)
        state?.let { obj.put("state", it) }
        return obj
    }

    override fun update(jsObject: JSObject) {
        title = String.updateFromContainer(jsObject, "title", title)
        stackItem = StackItemSpec.updateFromContainer(jsObject, "stackItem", stackItem)
    }

    override fun topBarSpec(): BarSpec? {
        return stackItem?.bar
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

            val stackItem = jsObject.getJSObject("stackItem")?.let { StackItemSpec.fromJSObject(it) }
            val title = jsObject.getString("title")

            return ViewSpec(id = jsObject.getString("id"),
                path = path,
                state = state,
                title = title,
                stackItem = stackItem
                )
        }


    }
}