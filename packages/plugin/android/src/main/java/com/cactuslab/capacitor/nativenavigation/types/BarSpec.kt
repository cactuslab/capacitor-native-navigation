package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject

class BarSpec(
    var background: FillSpec? = null,
    var title: LabelSpec? = null,
    var buttons: LabelSpec? = null,
    var visible: Boolean? = null
    ) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        background?.let { obj.put("background", it.toJSObject()) }
        title?.let { obj.put("title", it.toJSObject()) }
        buttons?.let { obj.put("buttons", it.toJSObject()) }
        visible?.let { obj.put("visible", it) }
        return obj
    }

    fun merge(other: BarSpec?): BarSpec {
        val spec = BarSpec()
        spec.title = other?.title ?: this.title
        spec.visible = other?.visible ?: this.visible
        spec.buttons = other?.buttons ?: this.buttons
        spec.background = other?.background ?: this.background
        return spec
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : BarSpec {
            val background = jsObject.getJSObject("background")?.let { FillSpec.fromJSObject(it) }
            val title = jsObject.getJSObject("title")?.let { LabelSpec.fromJSObject(it) }
            val buttons = jsObject.getJSObject("buttons")?.let { LabelSpec.fromJSObject(it) }
            val visible = jsObject.getBool("visible")
            return BarSpec(background = background, title = title, buttons = buttons, visible = visible)
        }

        fun updateFromContainer(jsObject: JSObject, key: String, existingValue: BarSpec?): BarSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val result = existingValue ?: BarSpec()
                val obj = jsObject.getJSObject(key)!!
                result.background = FillSpec.updateFromContainer(obj, "background", result.background)
                result.title = LabelSpec.updateFromContainer(obj, "title", result.title)
                result.buttons = LabelSpec.updateFromContainer(obj, "buttons", result.buttons)
                result.visible = Boolean.updateFromContainer(obj, "visible", result.visible)
                result
            }
        }
    }
}