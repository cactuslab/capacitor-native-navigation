package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class TabConfig(val image: String?, val badgeValue: String?) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        image?.let { obj.put("image", it) }
        badgeValue?.let { obj.put("badgeValue", it) }
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): TabConfig {
            val image = jsObject.getString("image")
            val badgeValue = jsObject.getString("badgeValue")
            return TabConfig(image, badgeValue)
        }
    }
}