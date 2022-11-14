package com.cactuslab.capacitor.nativenavigation.types

sealed interface Nullable<T> {

    fun value() : T?

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