package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions.TabOptions
import com.cactuslab.capacitor.nativenavigation.types.ModalPresentationStyle
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import com.cactuslab.capacitor.nativenavigation.types.TabsOptions
import com.cactuslab.capacitor.nativenavigation.types.ViewOptions
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.types.CreateOptions

class ComponentOptions {
    var title: String? = null
    var stack: StackOptions? = null
    var tab: TabOptions? = null
    var modalPresentationStyle: ModalPresentationStyle? = null

    class StackOptions {
        var backItem: StackItem? = null
        var leftItems: List<StackItem>? = null
        var rightItems: List<StackItem>? = null
    }

    class StackItem(var id: String, var title: String, var image: String?)
    class TabOptions {
        var image: String? = null
        var badgeValue: String? = null
    }
}