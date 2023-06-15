package com.cactuslab.capacitor.nativenavigation.helpers

import com.getcapacitor.JSObject

fun JSObject.getJSObjectArray(name: String): Sequence<JSObject>? {
    if (!has(name)) {
        return null
    }
    val obj = getJSONArray(name)
    return obj.jsObjectSequence()
}

fun mergeJSObjects(primary: JSObject?, fallback: JSObject?): JSObject? {
    if (fallback == null) {
        return primary
    }
    if (primary == null) {
        return fallback
    }

    val result = JSObject()

    fallback.keys().forEach { key ->
        result.put(key, fallback.get(key))
    }

    primary.keys().forEach { key ->
        result.put(key, primary.get(key))
    }

    return result
}