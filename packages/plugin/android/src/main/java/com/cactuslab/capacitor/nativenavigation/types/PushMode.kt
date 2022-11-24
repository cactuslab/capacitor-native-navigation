package com.cactuslab.capacitor.nativenavigation.types

enum class PushMode(val id: String) {
    PUSH("push"), REPLACE("replace"), ROOT("root");

    companion object {
        operator fun get(id: String?): PushMode? = values().find { it.id == id }
    }
}