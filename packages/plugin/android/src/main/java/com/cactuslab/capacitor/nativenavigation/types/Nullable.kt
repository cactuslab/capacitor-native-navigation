package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

sealed interface Nullable<T> {

    fun value() : T?

    fun toJSObject(): Any {
        return value() ?: JSObject.NULL
    }

    data class Value<T>(val value: T) : Nullable<T> {
        override fun value(): T? {
            return value
        }
    }

    class Null<T> : Nullable<T> {
        override fun value(): T? {
            return null
        }
    }
}