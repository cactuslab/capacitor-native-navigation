package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class ComponentOptions(var title: Nullable<String>?, var stack: StackConfig?, var tab: TabConfig?, var bar: BarConfig?) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        title?.let {
            obj.put("title", it.toJSObject())
        }
        stack?.let { obj.put("stack", it.toJSObject()) }
        tab?.let { obj.put("tab", it.toJSObject()) }
        bar?.let { obj.put("bar", it.toJSObject()) }
        return obj
    }

    fun mergeOptions(other: ComponentOptions) {
        other.title?.let { this.title = it }
        val myStack = this.stack
        if (myStack != null) {
            myStack.mergeOptions(other.stack)
        } else {
            this.stack = other.stack
        }
        other.tab?.let { this.tab = it }
        val bar = this.bar
        if (bar != null) {
            bar.merge(other.bar)
        } else {
            this.bar = other.bar
        }
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): ComponentOptions {
            val title: Nullable<String>? = if (jsObject.has("title")) {
                if (jsObject.isNull("title")) {
                    Nullable.Null()
                } else {
                    Nullable.Value(jsObject.getString("title")!!)
                }
            } else {
                null
            }

            val stack = jsObject.getJSObject("stack")?.let { StackConfig.fromJSObject(it) }
            val tab = jsObject.getJSObject("tab")?.let { TabConfig.fromJSObject(it) }
            val modalPresentationStyle = jsObject.getString("modalPresentationStyle")?.let { PresentationStyle.get(it) }
            val bar = jsObject.getJSObject("bar")?.let { BarConfig.fromJSObject(it) }

            return ComponentOptions(title, stack, tab, bar)
        }
    }
}