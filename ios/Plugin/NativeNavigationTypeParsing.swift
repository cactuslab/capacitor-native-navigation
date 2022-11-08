import Capacitor
import Foundation

func componentSpecFromJSObject(_ object: JSObjectLike) throws -> ComponentSpec {
    guard let typeString = object.getString("type") else {
        throw NativeNavigatorError.missingParameter(name: "type")
    }
    guard let type = ComponentType(rawValue: typeString) else {
        throw NativeNavigatorError.invalidParameter(name: "type", value: typeString)
    }

    let id = object.getString("id")

    var componentOptions: ComponentOptions?
    if let componentOptionsValue = object.getObject("options") {
        componentOptions = try ComponentOptions.fromJSObject(componentOptionsValue)
    }

    switch type {
    case .stack:
        var spec = StackSpec(stack: [])
        spec.id = id
        spec.options = componentOptions

        if let initialStack = object.getArray("stack") as? [JSObject] {
            for initialStackItem in initialStack {
                spec.stack.append(try componentSpecFromJSObject(initialStackItem))
            }
        }

        return spec
    case .tabs:
        var spec = TabsSpec(tabs: [])
        spec.id = id
        spec.options = componentOptions
        
        guard let tabs = object.getArray("tabs") as? [JSObject] else {
            throw NativeNavigatorError.missingParameter(name: "tabs")
        }

        for tabOptions in tabs {
            spec.tabs.append(try componentSpecFromJSObject(tabOptions))
        }

        return spec
    case .view:
        guard let path = object.getString("path") else {
            throw NativeNavigatorError.missingParameter(name: "path")
        }
        
        var spec = ViewSpec(path: path)
        spec.id = id
        spec.options = componentOptions

        if let state = object.getObject("state") {
            spec.state = state
        }
        return spec
    }
}

extension SetRootOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> SetRootOptions {
        guard let componentValue = object.getObject("component") else {
            throw NativeNavigatorError.missingParameter(name: "component")
        }
        let component = try componentSpecFromJSObject(componentValue)
        let animated = object.getBool("animated", false)
        
        return SetRootOptions(component: component, animated: animated)
    }
    
}

extension SetComponentOptions {

    static func fromJSObject(_ object: JSObjectLike) throws -> SetComponentOptions {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.missingParameter(name: "id")
        }

        let animated = object.getBool("animated", false)
        
        guard let options = object.getObject("options") else {
            throw NativeNavigatorError.missingParameter(name: "options")
        }

        return SetComponentOptions(id: id, animated: animated, options: try ComponentOptions.fromJSObject(options))
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

extension PushOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> PushOptions {
        guard let componentValue = object.getObject("component") else {
            throw NativeNavigatorError.missingParameter(name: "component")
        }
        let component = try componentSpecFromJSObject(componentValue)

        let animated = object.getBool("animated", true)
        
        var result = PushOptions(component: component, animated: animated)
        result.stack = object.getString("stack")
        result.replace = object.getBool("replace")
        
        return result
    }
}

extension PopOptions {

    static func fromJSObject(_ object: JSObjectLike) throws -> PopOptions {
        let animated = object.getBool("animated", true)
        
        var result = PopOptions(animated: animated)
        result.stack = object.getString("stack")
        result.count = object.getInt("count")
        return result
    }
}

extension ResetOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> ResetOptions {
        let animated = object.getBool("animated", false)
        
        return ResetOptions(animated: animated)
    }
    
}
