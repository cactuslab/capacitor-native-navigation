package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class BarConfig(val background: FillOptions?, val title: LabelOptions?, val buttons: LabelOptions?) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        background?.let { obj.put("background", it.toJSObject()) }
        title?.let { obj.put("title", it.toJSObject()) }
        buttons?.let { obj.put("buttons", it.toJSObject()) }
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : BarConfig {
            val background = jsObject.getJSObject("background")?.let { FillOptions.fromJSObject(it) }
            val title = jsObject.getJSObject("title")?.let { LabelOptions.fromJSObject(it) }
            val buttons = jsObject.getJSObject("buttons")?.let { LabelOptions.fromJSObject(it) }
            return BarConfig(background, title, buttons)
        }
    }
}