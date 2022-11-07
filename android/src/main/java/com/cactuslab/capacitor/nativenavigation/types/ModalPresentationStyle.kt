package com.cactuslab.capacitor.nativenavigation.types

enum class ModalPresentationStyle(val id: String) {
    FULLSCREEN("fullscreen"), PAGE_SHEET("pageSheet"), FORM_SHEET("formSheet");

    companion object {
        operator fun get(id: String?): ModalPresentationStyle? {
            for (value in values()) {
                if (value.id.contentEquals(id)) {
                    return value
                }
            }
            return null
        }
    }
}