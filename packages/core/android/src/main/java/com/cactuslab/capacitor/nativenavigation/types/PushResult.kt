package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class PushResult(val stackId: String) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("stack", stackId)
        return obj
    }
}