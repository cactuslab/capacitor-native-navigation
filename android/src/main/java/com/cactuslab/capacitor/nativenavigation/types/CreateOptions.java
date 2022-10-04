package com.cactuslab.capacitor.nativenavigation.types;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException;
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException;
import com.getcapacitor.JSObject;

import java.util.Objects;

public class CreateOptions {
    @NonNull
    public ComponentType type;
    @Nullable
    public String id;
    @Nullable
    public ComponentOptions options;
    @NonNull
    public Boolean retain = false;

    @Nullable
    public StackOptions stackOptions;
    @Nullable
    public TabsOptions tabsOptions;
    @Nullable
    public ViewOptions viewOptions;

    public CreateOptions(@NonNull ComponentType type) {
        this.type = type;
    }

    public static CreateOptions fromJSObject(@NonNull JSObject jsObject) throws MissingParameterException, InvalidParameterException {
        String typeString = jsObject.getString("type");
        if (typeString == null) {
            throw new MissingParameterException("type");
        }
        ComponentType type = ComponentType.get(typeString);
        if (type == null) {
            throw new InvalidParameterException("type", typeString);
        }

        CreateOptions options = new CreateOptions(type);

        options.retain = Objects.requireNonNull(jsObject.getBoolean("retain", false));
        options.id = jsObject.getString("id");

        return options;
    }
}
