package com.cactuslab.capacitor.nativenavigation.ui

import android.graphics.Insets
import android.os.Build
import android.os.Bundle
import android.view.WindowInsets
import androidx.annotation.RequiresApi
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class WebviewViewModel: ViewModel() {

    data class MeasuredInsets(
        val top: Int = 0,
        val bottom: Int = 0,
        val left: Int = 0,
        val right: Int = 0
    ) {
        @RequiresApi(Build.VERSION_CODES.Q)
        constructor(insets: Insets) : this(
            top = insets.top,
            bottom = insets.bottom,
            left = insets.left,
            right = insets.right
        )
    }

    data class State(
        val toolbarHeight: Int = 0,
        val isToolbarVisible: Boolean = true,
        val safeContent: MeasuredInsets = MeasuredInsets(),
        val safeDrawing: MeasuredInsets = MeasuredInsets(),
        val safeGestures: MeasuredInsets = MeasuredInsets()
    )

    private val insetState = MutableStateFlow(State())
    val state = insetState.asStateFlow()

    fun updateInsets(insets: WindowInsets) {
        val safeDrawing = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            MeasuredInsets(insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime()))
        } else {
            MeasuredInsets(
                top = insets.systemWindowInsetTop,
                bottom = insets.systemWindowInsetBottom,
                left = insets.systemWindowInsetLeft,
                right = insets.systemWindowInsetRight
            )
        }

        val safeGestures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            MeasuredInsets(insets.getInsets(WindowInsetsCompat.Type.systemGestures() or WindowInsetsCompat.Type.mandatorySystemGestures() or WindowInsetsCompat.Type.tappableElement() or WindowInsetsCompat.Type.displayCutout()))
        } else {
            MeasuredInsets(
                top = insets.systemWindowInsetTop,
                bottom = insets.systemWindowInsetBottom,
                left = insets.systemWindowInsetLeft,
                right = insets.systemWindowInsetRight
            )
        }

        val safeContent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            MeasuredInsets(insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime() or WindowInsetsCompat.Type.systemGestures() or WindowInsetsCompat.Type.mandatorySystemGestures() or WindowInsetsCompat.Type.tappableElement() or WindowInsetsCompat.Type.displayCutout()))
        } else {
            MeasuredInsets(
                top = insets.systemWindowInsetTop,
                bottom = insets.systemWindowInsetBottom,
                left = insets.systemWindowInsetLeft,
                right = insets.systemWindowInsetRight
            )
        }

        insetState.update { it.copy(safeContent = safeContent, safeDrawing = safeDrawing, safeGestures = safeGestures) }
    }

    fun updateToolbarHeight(toolbarHeight: Int) {
        insetState.update { it.copy(toolbarHeight = toolbarHeight) }
    }

    fun updateToolbarVisible(isToolbarVisible: Boolean) {
        insetState.update { it.copy(isToolbarVisible = isToolbarVisible) }
    }
}