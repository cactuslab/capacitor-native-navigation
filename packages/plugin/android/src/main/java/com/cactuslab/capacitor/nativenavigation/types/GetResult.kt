package com.cactuslab.capacitor.nativenavigation.types

import com.getcapacitor.JSObject

class GetResult(var component: ComponentSpec? = null, var stack: StackSpec? = null, var tabs: TabsSpec? = null) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        component?.let {
            obj.put("component", it.toJSObject())
        }
        stack?.let { obj.put("stack", it.toJSObject()) }
        tabs?.let { obj.put("tabs", it.toJSObject()) }
        return obj
    }

}