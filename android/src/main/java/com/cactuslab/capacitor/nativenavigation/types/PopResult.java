package com.cactuslab.capacitor.nativenavigation.types;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class PopResult {
    @NonNull
    public String stack;
    @Nullable
    public String id;

    public PopResult(@NonNull String stack, @Nullable String id) {
        this.stack = stack;
        this.id = id;
    }

}
