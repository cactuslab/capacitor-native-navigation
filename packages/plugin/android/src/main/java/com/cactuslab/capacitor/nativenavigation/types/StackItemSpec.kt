package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.helpers.checkNullOrUndefined
import com.cactuslab.capacitor.nativenavigation.helpers.getJSObjectArray
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject

class StackItemSpec(
    var backItem: StackBarButtonItem? = null,
    var leftItems: List<StackBarButtonItem>? = null,
    var rightItems: List<StackBarButtonItem>? = null,
    var bar: BarSpec? = null
) {

    fun toJSObject(): JSObject {
        val obj = JSObject()
        backItem?.let { obj.put("backItem", it.toJSObject()) }
        leftItems?.let { obj.put("leftItems", JSArray(it.map { item -> item.toJSObject() })) }
        rightItems?.let { obj.put("rightItems", JSArray(it.map { item -> item.toJSObject() })) }
        bar?.let { obj.put("bar", it.toJSObject()) }
        return obj
    }

    fun navigationItem(): StackBarButtonItem? {
        val firstItem = leftItems?.firstOrNull() ?: return null
        return if (firstItem.image != null) {
            firstItem
        } else {
            null
        }
    }

    fun nonNavigationLeftItems(): List<StackBarButtonItem>? {
        val items = leftItems ?: return null
        if (navigationItem() == null) {
            return items
        }
        return if (items.size > 1) {
            items.subList(1, items.size)
        } else {
            listOf()
        }
    }

    fun backEnabled(): Boolean {
        return leftItems == null
    }

    companion object {
        fun fromJSObject(jsObject: JSObject) : StackItemSpec {
            val backItem = jsObject.getJSObject("backItem")?.let { StackBarButtonItem.fromJSObject(it) }
            val leftItems = jsObject.getJSObjectArray("leftItems")?.map { StackBarButtonItem.fromJSObject(it) }?.toList()
            val rightItems = jsObject.getJSObjectArray("rightItems")?.map { StackBarButtonItem.fromJSObject(it) }?.toList()
            val bar = jsObject.getJSObject("bar")?.let { BarSpec.fromJSObject(it) }
            return StackItemSpec(backItem = backItem, leftItems = leftItems, rightItems = rightItems, bar = bar)
        }

        fun updateFromContainer(jsObject: JSObject, key:String, existingValue: StackItemSpec?): StackItemSpec? {
            return checkNullOrUndefined(jsObject, key, existingValue) {
                val result = existingValue ?: StackItemSpec()
                val obj = jsObject.getJSObject(key)!!
                result.backItem = checkNullOrUndefined(obj, "backItem", result.backItem) {
                    obj.getJSObject("backItem")?.let { StackBarButtonItem.fromJSObject(it) }
                }
                result.leftItems = checkNullOrUndefined(obj, "leftItems", result.leftItems) {
                    obj.getJSObjectArray("leftItems")?.map { StackBarButtonItem.fromJSObject(it) }?.toList()
                }
                result.rightItems = checkNullOrUndefined(obj, "rightItems", result.rightItems) {
                    obj.getJSObjectArray("rightItems")?.map { StackBarButtonItem.fromJSObject(it) }?.toList()
                }
                result.bar = BarSpec.updateFromContainer(obj, "bar", result.bar)
                result
            }
        }
    }
}