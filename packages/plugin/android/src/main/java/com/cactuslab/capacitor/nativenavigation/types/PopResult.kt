package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

data class PopResult(val stack: String, val count: Int, val id: String?) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("stack", stack)
        obj.put("count", count)
        id?.let {
            obj.put("id", it)
        }
        return obj
    }
}
