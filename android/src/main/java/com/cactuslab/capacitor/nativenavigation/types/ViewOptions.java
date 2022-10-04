package com.cactuslab.capacitor.nativenavigation.types;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;

public class ViewOptions {
    @NonNull
    public String path;
    @Nullable
    public JSObject state;

    public ViewOptions(@NonNull String path, @Nullable JSObject state) {
        this.path = path;
        this.state = state;
    }
}
