package com.cactuslab.capacitor.nativenavigation.helpers

import android.content.Context
import android.graphics.Color
import android.util.TypedValue
import androidx.core.graphics.ColorUtils

fun Number.spToPx(context: Context) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_SP, this.toFloat(), context.resources.displayMetrics).toInt()

fun Number.dpToPx(context: Context) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP, this.toFloat(), context.resources.displayMetrics).toInt()

fun Int.isColorDark(): Boolean {
    val whiteContrast = ColorUtils.calculateContrast(Color.WHITE, this)
    val blackContrast = ColorUtils.calculateContrast(Color.BLACK, this)

    return blackContrast < whiteContrast
}