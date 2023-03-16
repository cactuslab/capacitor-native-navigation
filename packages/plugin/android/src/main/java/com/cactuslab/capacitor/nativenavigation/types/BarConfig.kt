package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class BarConfig(var background: FillOptions?, var title: LabelOptions?, var buttons: LabelOptions?, var visible: Boolean?) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        background?.let { obj.put("background", it.toJSObject()) }
        title?.let { obj.put("title", it.toJSObject()) }
        buttons?.let { obj.put("buttons", it.toJSObject()) }
        visible?.let { obj.put("visible", it) }
        return obj
    }

    fun merge(other: BarConfig?) {
        other?.title?.let { this.title = it }
        other?.background?.let { this.background = it }
        other?.visible?.let { this.visible = it }
        other?.buttons?.let { this.buttons = it }
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : BarConfig {
            val background = jsObject.getJSObject("background")?.let { FillOptions.fromJSObject(it) }
            val title = jsObject.getJSObject("title")?.let { LabelOptions.fromJSObject(it) }
            val buttons = jsObject.getJSObject("buttons")?.let { LabelOptions.fromJSObject(it) }
            val visible = jsObject.getBool("visible")
            return BarConfig(background = background, title = title, buttons = buttons, visible = visible)
        }
    }
}