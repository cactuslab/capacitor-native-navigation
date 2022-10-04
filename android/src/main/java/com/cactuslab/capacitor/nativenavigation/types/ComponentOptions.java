package com.cactuslab.capacitor.nativenavigation.types;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.List;

public class ComponentOptions {
    @Nullable
    public String title;
    @Nullable
    public StackOptions stack;
    @Nullable
    public TabOptions tab;

    @Nullable
    public ModalPresentationStyle modalPresentationStyle;

    public static class StackOptions {
        @Nullable
        public StackItem backItem;
        @Nullable
        public List<StackItem> leftItems;
        @Nullable
        public List<StackItem> rightItems;
    }

    public static class StackItem {
        @NonNull
        public String id;
        @NonNull
        public String title;
        @Nullable
        public String image;

        public StackItem(@NonNull String id, @NonNull String title, @Nullable String image) {
            this.id = id;
            this.title = title;
            this.image = image;
        }
    }

    public static class TabOptions {
        @Nullable
        public String image;
        @Nullable
        public String badgeValue;
    }
}
