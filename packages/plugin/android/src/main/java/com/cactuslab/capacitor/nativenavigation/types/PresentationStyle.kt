package com.cactuslab.capacitor.nativenavigation.types

enum class PresentationStyle(val id: String) {
    FULLSCREEN("fullscreen"), PAGE_SHEET("pageSheet"), FORM_SHEET("formSheet");

    companion object {
        operator fun get(id: String?): PresentationStyle? = values().find { it.id == id }
    }
}