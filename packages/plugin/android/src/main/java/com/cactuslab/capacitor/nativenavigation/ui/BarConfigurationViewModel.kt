package com.cactuslab.capacitor.nativenavigation.ui

import android.graphics.Color
import androidx.annotation.ColorInt
import androidx.lifecycle.ViewModel
import com.cactuslab.capacitor.nativenavigation.helpers.parseRGBAColor
import com.cactuslab.capacitor.nativenavigation.types.BarSpec
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.cactuslab.capacitor.nativenavigation.types.FontSpec
import com.cactuslab.capacitor.nativenavigation.types.StackSpec
import com.cactuslab.capacitor.nativenavigation.types.ViewSpec

class BarConfigurationViewModel: ViewModel() {

    data class ToolbarColorValues(
        @ColorInt
        val background: Int = Color.TRANSPARENT,
        @ColorInt
        val titleColor: Int = Color.BLACK,
        @ColorInt
        val buttonsColor: Int = Color.BLACK,
    ) {
        fun copyFromBarSpec(spec: BarSpec?): ToolbarColorValues {
            return copy(
                background = spec?.background?.color?.parseRGBAColor() ?: background,
                titleColor = spec?.title?.color?.parseRGBAColor() ?: titleColor,
                buttonsColor = spec?.buttons?.color?.parseRGBAColor() ?: buttonsColor,
            )
        }
    }

    data class BarValues(
        val visible: Boolean = true,
        val baseToolbarColors: ToolbarColorValues = ToolbarColorValues(),
        val titleFont: FontSpec? = null,
        val buttonsFont: FontSpec? = null,
        val title: String? = null
    )
    private var _viewState = BarValues()

    // Raw state from the developer
    private var barSpec: BarSpec? = null
    private var stackBarSpec: BarSpec? = null

    // Merged state to be rendered in the current screen
    private var resultSpec: BarSpec?  = null

    fun updateSpec(stackSpec: StackSpec?, viewSpec: ViewSpec?): BarValues {

        val isStack = stackSpec?.type == ComponentType.STACK

        val isNotVisible = (viewSpec?.stackItem == null && stackSpec?.bar == null) || !isStack

        // Merge the latest stack spec features into our local state
        stackBarSpec = stackBarSpec?.merge(stackSpec?.bar) ?: stackSpec?.bar
        // Merge the latest view spec features into our local state
        barSpec = barSpec?.merge(viewSpec?.stackItem?.bar) ?: viewSpec?.stackItem?.bar

        // Combine the local states into a single result spec
        resultSpec = stackBarSpec?.merge(barSpec) ?: barSpec

        // Update the view state with the combined spec
        val baseToolbarColors = _viewState.baseToolbarColors.copyFromBarSpec(resultSpec)
        val resultIsVisible = !isNotVisible && (resultSpec?.visible ?: true)

        _viewState = _viewState.copy(
            visible = resultIsVisible,
            baseToolbarColors = baseToolbarColors,
            titleFont = resultSpec?.title?.font,
            buttonsFont = resultSpec?.buttons?.font,
            title = viewSpec?.title
        )

        return _viewState
    }
}