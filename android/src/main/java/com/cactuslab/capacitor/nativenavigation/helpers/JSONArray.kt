@file:Suppress("UNCHECKED_CAST")

package com.cactuslab.capacitor.nativenavigation.helpers

import com.getcapacitor.JSObject
import org.json.JSONArray

fun JSONArray.jsObjectSequence(): Sequence<JSObject> =
    (0 until this.length()).asSequence().map { JSObject.fromJSONObject(this.getJSONObject(it)) }