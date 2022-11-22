package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

data class DismissResult(val componentId: String) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("id", componentId)
        return obj
    }
}