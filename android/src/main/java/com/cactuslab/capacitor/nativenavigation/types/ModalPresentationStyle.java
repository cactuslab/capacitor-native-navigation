package com.cactuslab.capacitor.nativenavigation.types;

import com.google.gson.annotations.SerializedName;

public enum ModalPresentationStyle {
    @SerializedName("fullScreen")
    FULLSCREEN,
    @SerializedName("pageSheet")
    PAGE_SHEET,
    @SerializedName("formSheet")
    FORM_SHEET
}
