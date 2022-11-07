package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

class StackItem(var id: String, var title: String, var image: String?) {

    companion object {
        fun fromJSObject(jsObject: JSObject): StackItem {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            val title = jsObject.getString("title") ?: throw MissingParameterException("title")
            val image = jsObject.getString("image")

            return StackItem(id, title, image)
        }
    }
}