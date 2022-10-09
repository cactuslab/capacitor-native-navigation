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

class CreateOptions(var type: ComponentType) {
    var id: String? = null
    var options: ComponentOptions? = null
    var retain = false
    var stackOptions: StackOptions? = null
    var tabsOptions: TabsOptions? = null
    var viewOptions: ViewOptions? = null

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
            return options
        }
    }
}