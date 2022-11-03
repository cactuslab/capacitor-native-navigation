package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions.TabOptions
import com.cactuslab.capacitor.nativenavigation.types.ModalPresentationStyle
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import com.cactuslab.capacitor.nativenavigation.types.TabsOptions
import com.cactuslab.capacitor.nativenavigation.types.ViewOptions
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.types.CreateOptions
import com.getcapacitor.JSObject
import java.util.*

class ViewOptions(id: String? = null,
                  options: ComponentOptions? = null,
                  retain: Boolean = false,
                  var path: String,
                  var state: JSObject?) :
    CreateOptions(type = ComponentType.VIEW, id = id ?: UUID.randomUUID().toString(), options = options, retain = retain), TabsOptionsTabs
{

    companion object {
        fun fromJSObject(jsObject: JSObject): ViewOptions {

            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )
            if (type != ComponentType.VIEW) {
                throw InvalidParameterException("type", "Type $type is incorrect for ViewOptions")
            }

            val retain = jsObject.getBoolean("retain", false)!!
            val path = jsObject.getString("path") ?: throw MissingParameterException("path")
            val state = jsObject.getJSObject("state")

            return ViewOptions(id = jsObject.getString("id"),
                options = null,
                retain = retain,
                path = path,
                state = state
                )
        }
    }
}