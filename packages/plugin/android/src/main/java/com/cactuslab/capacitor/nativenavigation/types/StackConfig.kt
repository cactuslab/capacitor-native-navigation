package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.getJSObjectArray
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject

class StackConfig(var backItem: StackItem?, var leftItems: List<StackItem>?, var rightItems: List<StackItem>?, var backEnabled: Boolean?) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        backItem?.let { obj.put("backItem", it.toJSObject()) }
        leftItems?.let { obj.put("leftItems", JSArray(it.map { item -> item.toJSObject() })) }
        rightItems?.let { obj.put("rightItems", JSArray(it.map { item -> item.toJSObject() })) }
        backEnabled?.let { obj.put("backEnabed", it) }
        return obj
    }

    fun mergeOptions(other: StackConfig?) {
        val otherConfig = other ?: return
        otherConfig.backItem?.let { this.backItem = it }
        otherConfig.leftItems?.let { this.leftItems = it }
        otherConfig.rightItems?.let { this.rightItems = it }
        otherConfig.backEnabled?.let { this.backEnabled = it }
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : StackConfig {

            val backItem = jsObject.getJSObject("backItem")?.let { StackItem.fromJSObject(it) }
            val leftItems = jsObject.getJSObjectArray("leftItems")?.map { StackItem.fromJSObject(it) }?.toList()
            val rightItems = jsObject.getJSObjectArray("rightItems")?.map { StackItem.fromJSObject(it) }?.toList()
            val backEnabled = jsObject.getBool("backEnabled")
            return StackConfig(backItem = backItem, leftItems = leftItems, rightItems = rightItems, backEnabled = backEnabled)
        }
    }
}