package com.cactuslab.capacitor.nativenavigation.types

import android.content.Context
import android.graphics.Typeface
import androidx.core.graphics.TypefaceCompat
import androidx.core.graphics.TypefaceCompatUtil
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.getcapacitor.JSObject

data class FontOptions(val name: String?, val size: Double?) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        name?.let { obj.put("name", it) }
        size?.let { obj.put("size", it) }
        return obj
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): FontOptions {
            val name = jsObject.getString("name")
            val size = if (jsObject.has("size")) jsObject.getDouble("size") else null
            return FontOptions(name, size)
        }
    }

}