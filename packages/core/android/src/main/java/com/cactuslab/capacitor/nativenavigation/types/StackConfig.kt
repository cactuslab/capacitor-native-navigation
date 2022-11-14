package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.getJSObjectArray
import com.getcapacitor.JSObject

class StackConfig(var backItem: StackItem?, var leftItems: List<StackItem>?, var rightItems: List<StackItem>?) {

    fun mergeOptions(other: StackConfig) {
        other.backItem?.let { this.backItem = it }
        other.leftItems?.let { this.leftItems = it }
        other.rightItems?.let { this.rightItems = it }
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : StackConfig {

            val backItem = jsObject.getJSObject("backItem")?.let { StackItem.fromJSObject(it) }
            val leftItems = jsObject.getJSObjectArray("leftItems")?.map { StackItem.fromJSObject(it) }?.toList()
            val rightItems = jsObject.getJSObjectArray("rightItems")?.map { StackItem.fromJSObject(it) }?.toList()

            return StackConfig(backItem = backItem, leftItems = leftItems, rightItems = rightItems)
        }
    }
}