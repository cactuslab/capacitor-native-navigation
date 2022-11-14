package com.cactuslab.capacitor.nativenavigation.exceptions

class InvalidParameterException(val name: String, val value: Any) : Exception(
    "InvalidParameterException name: $name value: $value"
) {

    override fun getLocalizedMessage(): String {
        return "InvalidParameterException name: $name value: $value"
    }
}