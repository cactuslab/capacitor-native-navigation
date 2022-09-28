import Capacitor
import Foundation

extension CreateOptions {

    static func fromJSObject(_ object: JSObjectLike) throws -> CreateOptions {
        guard let typeString = object.getString("type") else {
            throw NativeNavigatorError.missingParameter(name: "type")
        }
        guard let type = ComponentType(rawValue: typeString) else {
            throw NativeNavigatorError.invalidParameter(name: "type", value: typeString)
        }

        let retain = object.getBool("retain", false)

        var options = CreateOptions(type: type, retain: retain)

        options.id = object.getString("id")

        if let componentOptions = object.getObject("options") {
            options.options = try ComponentOptions.fromJSObject(componentOptions)
        }

        switch type {
        case .stack:
            var stackOptions = StackOptions()

            if let initialStack = object.getArray("stack") as? [JSObject] {
                stackOptions.stack = []
                for initialStackItem in initialStack {
                    stackOptions.stack!.append(try CreateOptions.fromJSObject(initialStackItem))
                }
            }

            options.stackOptions = stackOptions
        case .tabs:
            guard let tabs = object.getArray("tabs") as? [JSObject] else {
                throw NativeNavigatorError.missingParameter(name: "tabs")
            }

            var tabsOptions = TabsOptions(tabs: [])
            for tabOptions in tabs {
                tabsOptions.tabs.append(try CreateOptions.fromJSObject(tabOptions))
            }

            options.tabsOptions = tabsOptions
        case .view:
            guard let path = object.getString("path") else {
                throw NativeNavigatorError.missingParameter(name: "path")
            }

            var viewOptions = ViewOptions(path: path)

            if let state = object.getObject("state") {
                viewOptions.state = state
            }
            options.viewOptions = viewOptions
        }

        return options
    }

}

extension SetComponentOptions {

    static func fromJSObject(_ object: JSObjectLike) throws -> SetComponentOptions {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.missingParameter(name: "id")
        }

        let animated = object.getBool("animated", false)

        return SetComponentOptions(id: id, animated: animated, options: try ComponentOptions.fromJSObject(object))
    }

}

extension ComponentOptions {

    static func fromJSObject(_ object: JSObjectLike) throws -> ComponentOptions {
        var result = ComponentOptions()

        result.title = object.getString("title")

        if let stackOptions = object.getObject("stack") {
            result.stack = try ComponentOptions.StackOptions.fromJSObject(stackOptions)
        }

        if let tabOptions = object.getObject("tab") {
            result.tab = try ComponentOptions.TabOptions.fromJSObject(tabOptions)
        }

        if let modalPresentationStyleString = object.getString("modalPresentationStyle") {
            if let modalPresentationStyleValue = ModalPresentationStyle(rawValue: modalPresentationStyleString) {
                result.modalPresentationStyle = modalPresentationStyleValue
            } else {
                throw NativeNavigatorError.invalidParameter(name: "modalPresentationStyle", value: modalPresentationStyleString)
            }
        }

        return result
    }
}

extension ComponentOptions.StackOptions {

    typealias StackOptions = ComponentOptions.StackOptions
    typealias StackItem = ComponentOptions.StackItem

    static func fromJSObject(_ object: JSObjectLike) throws -> StackOptions {
        var result = StackOptions()
        if let backItem = object.getObject("backItem") {
            result.backItem = try StackItem.fromJSObject(backItem)
        }
        if let leftItems = object.getArray("leftItems") {
            result.leftItems = []

            for leftItem in leftItems {
                guard let leftItem = leftItem as? JSObject else {
                    throw NativeNavigatorError.invalidParameter(name: "StackOptions.leftItems", value: leftItem)
                }

                result.leftItems!.append(try StackItem.fromJSObject(leftItem))
            }
        }
        if let rightItems = object.getArray("rightItems") {
            result.rightItems = []

            for rightItem in rightItems {
                guard let rightItem = rightItem as? JSObject else {
                    throw NativeNavigatorError.invalidParameter(name: "StackOptions.rightItems", value: rightItem)
                }

                result.rightItems!.append(try StackItem.fromJSObject(rightItem))
            }
        }
        return result
    }

}

extension ComponentOptions.StackItem {

    typealias StackItem = ComponentOptions.StackItem

    static func fromJSObject(_ object: JSObjectLike) throws -> StackItem {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.id", value: object)
        }
        guard let title = object.getString("title") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.title", value: object)
        }
        let image = object.getString("image")
        return StackItem(id: id, title: title, image: image)
    }

}

extension ComponentOptions.TabOptions {

    typealias TabOptions = ComponentOptions.TabOptions

    static func fromJSObject(_ object: JSObjectLike) throws -> TabOptions {
        var result = TabOptions()
        result.badgeValue = object.getString("badgeValue")
        result.image = object.getString("image")
        return result
    }

}
