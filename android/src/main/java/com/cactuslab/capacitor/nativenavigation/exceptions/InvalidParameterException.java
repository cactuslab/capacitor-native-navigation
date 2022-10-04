package com.cactuslab.capacitor.nativenavigation.exceptions;

import androidx.annotation.Nullable;

public class InvalidParameterException extends Exception {

    private final Object value;
    private final String name;

    public InvalidParameterException(String name, Object value) {
        super("InvalidParameterException name: " + name + " value: " + value);
        this.name = name;
        this.value = value;
    }

    public Object getValue() {
        return value;
    }

    public String getName() {
        return name;
    }

    @Nullable
    @Override
    public String getLocalizedMessage() {
        return "InvalidParameterException name: " + name + " value: " + value;
    }
}
