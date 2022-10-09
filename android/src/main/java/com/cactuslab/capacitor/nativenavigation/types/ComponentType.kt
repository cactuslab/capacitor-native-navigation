package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions.TabOptions
import com.cactuslab.capacitor.nativenavigation.types.ModalPresentationStyle
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import com.cactuslab.capacitor.nativenavigation.types.TabsOptions
import com.cactuslab.capacitor.nativenavigation.types.ViewOptions
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.types.CreateOptions

enum class ComponentType(val id: String) {
    STACK("stack"), TABS("tabs"), VIEW("view");

    companion object {
        operator fun get(id: String?): ComponentType? {
            for (value in values()) {
                if (value.id.contentEquals(id)) {
                    return value
                }
            }
            return null
        }
    }
}