package com.cactuslab.capacitor.nativenavigation.helpers

import com.getcapacitor.JSObject

fun JSObject.getJSObjectArray(name: String): Sequence<JSObject>? {
    if (!has(name)) {
        return null
    }
    val obj = getJSONArray(name)
    return obj.jsObjectSequence()
}