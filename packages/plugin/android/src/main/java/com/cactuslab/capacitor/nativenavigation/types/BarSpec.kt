package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSObject

class BarSpec(
    var background: FillSpec? = null,
    var title: LabelSpec? = null,
    var buttons: LabelSpec? = null,
    var visible: Boolean? = null,
    ) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        background?.let { obj.put(BACKGROUND_KEY, it.toJSObject()) }
        title?.let { obj.put(TITLE_KEY, it.toJSObject()) }
        buttons?.let { obj.put(BUTTONS_KEY, it.toJSObject()) }
        visible?.let { obj.put(VISIBLE_KEY, it) }

        val androidObj = JSObject()
        obj.put(ANDROID_KEY, androidObj)

        return obj
    }

    fun merge(other: BarSpec?): BarSpec {
        val spec = BarSpec()
        spec.title = LabelSpec.merge(other?.title, title)
        spec.buttons = LabelSpec.merge(other?.buttons, buttons)
        spec.visible = other?.visible ?: this.visible
        spec.background = other?.background ?: this.background
        return spec
    }

    companion object {
        private const val ANDROID_KEY = "android"
        private const val VISIBLE_KEY = "visible"
        private const val BACKGROUND_KEY = "background"
        private const val TITLE_KEY = "title"
        private const val BUTTONS_KEY = "buttons"

        fun fromJSObject(jsObject: JSObject) : BarSpec {
            val background = jsObject.getJSObject(BACKGROUND_KEY)?.let { FillSpec.fromJSObject(it) }
            val title = jsObject.getJSObject(TITLE_KEY)?.let { LabelSpec.fromJSObject(it) }
            val buttons = jsObject.getJSObject(BUTTONS_KEY)?.let { LabelSpec.fromJSObject(it) }
            val visible = jsObject.getBool(VISIBLE_KEY)

            return BarSpec(background = background, title = title, buttons = buttons, visible = visible)
        }

        fun updateFromContainer(jsObject: JSObject, key: String, existingValue: BarSpec?): BarSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val result = existingValue ?: BarSpec()
                val obj = jsObject.getJSObject(key)!!
                result.background = FillSpec.updateFromContainer(obj, BACKGROUND_KEY, result.background)
                result.title = LabelSpec.updateFromContainer(obj, TITLE_KEY, result.title)
                result.buttons = LabelSpec.updateFromContainer(obj, BUTTONS_KEY, result.buttons)
                result.visible = Boolean.updateFromContainer(obj, VISIBLE_KEY, result.visible)
                result
            }
        }
    }
}