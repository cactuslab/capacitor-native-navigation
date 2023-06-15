package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject
import java.util.*

class ViewSpec(id: String? = null,
               alias: String? = null,
               var path: String? = null,
               var state: JSObject?,

               var title: String? = null,
               var stackItem: StackItemSpec? = null,
               var backButtonId: String? = null,
               ) :
    ComponentSpec(type = ComponentType.VIEW, id = id ?: UUID.randomUUID().toString(), alias = alias), TabsOptionsTabs
{

    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()
        path?.let { obj.put("path", it)  }
        state?.let { obj.put("state", it) }
        backButtonId?.let {
            val android = JSObject()
            android.put("backButtonId", it)
            obj.put("android", android)
        }
        return obj
    }

    override fun update(jsObject: JSObject) {
        title = String.updateFromContainer(jsObject, "title", title)
        stackItem = StackItemSpec.updateFromContainer(jsObject, "stackItem", stackItem)
        jsObject.getJSObject("android")?.let { androidOpts ->
            backButtonId = String.updateFromContainer(androidOpts, "backButtonId", backButtonId)
        }
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

            val path = jsObject.getString("path")
            val state = jsObject.getJSObject("state")

            val stackItem = jsObject.getJSObject("stackItem")?.let { StackItemSpec.fromJSObject(it) }
            val title = jsObject.getString("title")

            val androidOpts = jsObject.getJSObject("android")

            return ViewSpec(id = jsObject.getString("id"),
                alias = jsObject.getString("alias"),
                path = path,
                state = state,
                title = title,
                stackItem = stackItem,
                backButtonId = androidOpts?.getString("backButtonId")
                )
        }


    }
}