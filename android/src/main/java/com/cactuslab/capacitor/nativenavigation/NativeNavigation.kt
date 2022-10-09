package com.cactuslab.capacitor.nativenavigation

import android.util.Log

class NativeNavigation {
    fun echo(value: String): String {
        Log.i("Echo", value)
        return value
    }
}