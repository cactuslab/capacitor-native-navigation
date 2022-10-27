package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

data class CreateResult(val id: String) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("id", id)
        return obj
    }
}
