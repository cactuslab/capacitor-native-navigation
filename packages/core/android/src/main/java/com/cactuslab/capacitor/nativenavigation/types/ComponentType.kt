package com.cactuslab.capacitor.nativenavigation.types

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