package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class PushResult(private val id: String, private val stackId: String?) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("id", id)
        stackId?.let {
            obj.put("stack", stackId)
        }
        return obj
    }
}