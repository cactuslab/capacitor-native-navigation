package com.cactuslab.capacitor.nativenavigation.types

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException
import com.cactuslab.capacitor.nativenavigation.helpers.jsObjectSequence
import com.cactuslab.capacitor.nativenavigation.helpers.updateFromContainer
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import java.util.UUID

class StackSpec(
    id: String? = null,
    var components: List<ViewSpec>? = null,
    var bar: BarSpec? = null,
    var title: String? = null
) : ComponentSpec(type = ComponentType.STACK, id = id ?: UUID.randomUUID().toString()), TabsOptionsTabs
{
    override fun toJSObject(): JSObject {
        val obj = super.toJSObject()
        components?.let { obj.put("stack", JSArray(it.map { spec -> spec.toJSObject() })) }
        return obj
    }

    override fun update(jsObject: JSObject) {
        title = String.updateFromContainer(jsObject, "title", title)
        bar = BarSpec.updateFromContainer(jsObject, "bar", bar)
        // TODO: Update the components. We're undecided as to how a stack should perform an update of its components if at all
    }

    override fun topBarSpec(): BarSpec? {
        return bar
    }

    companion object {
        fun fromJSObject(jsObject: JSObject): StackSpec {

            val typeString = jsObject.getString("type") ?: throw MissingParameterException("type")
            val type: ComponentType = ComponentType.Companion[typeString]
                ?: throw InvalidParameterException(
                    "type",
                    typeString
                )
            if (type != ComponentType.STACK) {
                throw InvalidParameterException("type", "Type $type is incorrect for ViewOptions")
            }

            val components = jsObject.getJSONArray("components")

            val bar = jsObject.getJSObject("bar")?.let { BarSpec.fromJSObject(it) }

            val title = jsObject.getString("title")

            return StackSpec(
                id = jsObject.getString("id"),
                components = components.jsObjectSequence().map { ViewSpec.fromJSObject(it) }
                    .toList(),
                bar = bar,
                title = title,
            )
        }
    }
}