package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.getcapacitor.JSObject
import org.json.JSONArray
import java.util.*

class TabsSpec(id: String? = null,
               alias: String? = null,
               state: JSObject? = null,
               var tabSpecs: List<TabSpec>) : ComponentSpec(type = ComponentType.TABS, id = id ?: UUID.randomUUID().toString(), alias = alias, state = state) {

    /** Flat list of tab child components for backwards compat with insertComponent */
    val tabs: List<TabsOptionsTabs>
        get() = tabSpecs.map { it.component }

    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()
        return obj
    }

    override fun topBarSpec(): BarSpec? {
        fatalError("Not yet implemented")
    }

    override fun update(jsObject: JSObject) {
        jsObject.getString("title")?.let { /* title not stored on TabsSpec currently */ }
        if (jsObject.has("tabs")) {
            val tabsArray = jsObject.getJSONArray("tabs")
            for (i in 0 until tabsArray.length()) {
                if (i < tabSpecs.count()) {
                    val tabObj = JSObject.fromJSONObject(tabsArray.getJSONObject(i)) ?: continue
                    val existing = tabSpecs[i]
                    val updatedTabs = tabSpecs.toMutableList()
                    updatedTabs[i] = TabSpec(
                        title = tabObj.getString("title") ?: existing.title,
                        image = tabObj.getString("image") ?: existing.image,
                        badgeValue = if (tabObj.has("badgeValue")) tabObj.getString("badgeValue") else existing.badgeValue,
                        component = existing.component
                    )
                    tabSpecs = updatedTabs
                }
            }
        }
    }

    private fun fatalError(message: String): Nothing {
        throw NotImplementedError(message)
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): TabsSpec {
            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException("type", typeString)
            if (type != ComponentType.TABS) {
                throw InvalidParameterException("type", "Type $type is incorrect for TabsSpec")
            }

            val state = jsObject.getJSObject("state")
            if (!jsObject.has("tabs")) throw MissingParameterException("tabs")
            val tabs = jsObject.getJSONArray("tabs")

            return TabsSpec(
                id = jsObject.getString("id"),
                alias = jsObject.getString("alias"),
                state = state,
                tabSpecs = tabs.jsObjectSequence().map { TabSpec.fromJSObject(it) }.toList()
            )
        }
    }
}
