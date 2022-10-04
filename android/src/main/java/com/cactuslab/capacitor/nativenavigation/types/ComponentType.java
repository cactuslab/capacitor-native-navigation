package com.cactuslab.capacitor.nativenavigation.types;

import androidx.annotation.Nullable;

public enum ComponentType {
    STACK("stack"),
    TABS("tabs"),
    VIEW("view");

    private final String id;

    ComponentType(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static ComponentType get(String id) {
        for (ComponentType value : values()) {
            if (value.id.contentEquals(id)) {
                return value;
            }
        }
        return null;
    }

}
