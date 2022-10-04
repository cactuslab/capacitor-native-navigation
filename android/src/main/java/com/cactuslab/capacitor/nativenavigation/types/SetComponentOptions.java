package com.cactuslab.capacitor.nativenavigation.types;

import androidx.annotation.NonNull;

public class SetComponentOptions {
    @NonNull
    public String id;
    @NonNull
    public Boolean animated = false;
    @NonNull
    public ComponentOptions options;

    public SetComponentOptions(@NonNull String id, @NonNull Boolean animated, @NonNull ComponentOptions options) {
        this.id = id;
        this.animated = animated;
        this.options = options;
    }
}
