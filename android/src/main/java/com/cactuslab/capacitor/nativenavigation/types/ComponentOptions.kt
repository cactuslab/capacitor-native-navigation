package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class ComponentOptions(val title: String?, val stack: StackConfig?, val tab: TabConfig?, val modalPresentationStyle: ModalPresentationStyle?) {
    companion object {
        fun fromJSObject(jsObject: JSObject): ComponentOptions {
            val title = jsObject.getString("title")

            val stack = jsObject.getJSObject("stack")?.let { StackConfig.fromJSObject(it) }
            val tab = jsObject.getJSObject("tab")?.let { TabConfig.fromJSObject(it) }
            val modalPresentationStyle = jsObject.getString("modalPresentationStyle")?.let { ModalPresentationStyle.get(it) }

            return ComponentOptions(title, stack, tab, modalPresentationStyle)
        }
    }
}