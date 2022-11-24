package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

class StackItem(var id: String, var title: String, var image: String?) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("id", id)
        obj.put("title", title)
        image?.let { obj.put("image", it) }
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): StackItem {
            val id = jsObject.getString("id") ?: throw MissingParameterException("id")
            val title = jsObject.getString("title") ?: throw MissingParameterException("title")
            val image = jsObject.getString("image")

            return StackItem(id, title, image)
        }
    }
}