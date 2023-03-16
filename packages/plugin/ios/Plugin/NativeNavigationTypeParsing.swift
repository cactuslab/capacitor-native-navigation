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

        guard let initialStack = object.getArray("stack") as? [JSObject] else {
            throw NativeNavigatorError.missingParameter(name: "stack")
        }
        
        for initialStackItem in initialStack {
            if let initialStackItemSpec = try componentSpecFromJSObject(initialStackItem) as? ViewSpec {
                spec.stack.append(initialStackItemSpec)
            } else {
                throw NativeNavigatorError.invalidParameter(name: "stack", value: initialStackItem)
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

func toPresentationStyle(_ object: JSObjectLike, key: String) throws -> PresentationStyle {
    if let presentationStyleString = object.getString(key) {
        if let presentationStyleValue = PresentationStyle(rawValue: presentationStyleString) {
            return presentationStyleValue
        } else {
            throw NativeNavigatorError.invalidParameter(name: key, value: presentationStyleString)
        }
    } else {
        return .fullScreen
    }
}

extension PresentOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> PresentOptions {
        guard let componentValue = object.getObject("component") else {
            throw NativeNavigatorError.missingParameter(name: "component")
        }
        let component = try componentSpecFromJSObject(componentValue)
        let style = try toPresentationStyle(object, key: "style")
        let cancellable = object.getBool("cancellable", true)
        let animated = object.getBool("animated", true)

        return PresentOptions(component: component, style: style, cancellable: cancellable, animated: animated)
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

        if object.isNull("title") {
            result.title = .null
        } else if let title = object.getString("title") {
            result.title = .value(title)
        }

        if let stackOptions = object.getObject("stack") {
            result.stack = try ComponentOptions.StackOptions.fromJSObject(stackOptions)
        }

        if let tabOptions = object.getObject("tab") {
            result.tab = try ComponentOptions.TabOptions.fromJSObject(tabOptions)
        }
        
        if let barOptions = object.getObject("bar") {
            result.bar = try ComponentOptions.BarOptions.fromJSObject(barOptions)
        }

        return result
    }
}

extension ComponentOptions.StackOptions {

    typealias StackOptions = ComponentOptions.StackOptions
    typealias StackItem = ComponentOptions.StackBarItem

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

extension ComponentOptions.StackBarItem {

    typealias This = ComponentOptions.StackBarItem

    static func fromJSObject(_ object: JSObjectLike) throws -> This {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.id", value: object)
        }
        guard let title = object.getString("title") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.title", value: object)
        }
        let image = try ImageObject.fromJSObject(object, key: "image")
        return This(id: id, title: title, image: image)
    }

}

extension ImageObject {
    
    typealias This = ImageObject
    
    static func fromJSObject(_ object: JSObjectLike) throws -> This {
        guard let uri = object.getString("uri") else {
            throw NativeNavigatorError.invalidParameter(name: "ImageObject.uri", value: object)
        }
        
        var result = This(uri: uri)
        if let scale = object.getFloat("scale") {
            result.scale = CGFloat(scale)
        }
        return result
    }
    
    static func fromJSObject(_ object: JSObjectLike, key: String) throws -> This? {
        if let imageObject = object.getObject(key) {
            return try ImageObject.fromJSObject(imageObject)
        } else if let imageUri = object.getString(key) {
            return This(uri: imageUri)
        } else if object.has(key) {
            throw NativeNavigatorError.invalidParameter(name: key, value: object)
        } else {
            return nil
        }
    }
}

extension ComponentOptions.TabOptions {

    typealias This = ComponentOptions.TabOptions

    static func fromJSObject(_ object: JSObjectLike) throws -> This {
        var result = This()
        result.badgeValue = object.getString("badgeValue")
        result.image = try ImageObject.fromJSObject(object, key: "image")
        return result
    }

}

extension ComponentOptions.BarOptions {

    typealias This = ComponentOptions.BarOptions

    static func fromJSObject(_ object: JSObjectLike) throws -> This {
        var result = This()
        if let backgroundOptions = object.getObject("background") {
            result.background = try ComponentOptions.FillOptions.fromJSObject(backgroundOptions)
        }
        if let titleOptions = object.getObject("title") {
            result.title = try ComponentOptions.LabelOptions.fromJSObject(titleOptions)
        }
        if let buttonsOptions = object.getObject("buttons") {
            result.buttons = try ComponentOptions.LabelOptions.fromJSObject(buttonsOptions)
        }
        result.visible = object.getBool("visible")
        return result
    }

}

func parseColor(_ color: String) throws -> UIColor {
    if let result = UIColor(hex: color) {
        return result
    } else {
        throw NativeNavigatorError.invalidParameter(name: "color", value: color)
    }
}

extension ComponentOptions.FillOptions {
 
    typealias This = ComponentOptions.FillOptions

    static func fromJSObject(_ object: JSObjectLike) throws -> This {
        var result = This()
        if let color = object.getString("color") {
            result.color = try parseColor(color)
        }
        return result
    }
    
}

extension ComponentOptions.LabelOptions {
 
    typealias This = ComponentOptions.LabelOptions

    static func fromJSObject(_ object: JSObjectLike) throws -> This {
        var result = This()
        if let color = object.getString("color") {
            result.color = try parseColor(color)
        }
        if let font = object.getObject("font") {
            result.font = try parseFont(font)
        }
        return result
    }
    
}

func parseFont(_ object: JSObjectLike) throws -> UIFont {
    guard let name = object.getString("name") else {
        throw NativeNavigatorError.missingParameter(name: "font.name")
    }
    let size = object.getFloat("size") ?? Float(UIFont.systemFontSize)
    
    guard let font = UIFont(name: name, size: CGFloat(size)) else {
        throw NativeNavigatorError.invalidParameter(name: "font", value: name)
    }
    return font
}

extension PushOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> PushOptions {
        guard let componentValue = object.getObject("component") else {
            throw NativeNavigatorError.missingParameter(name: "component")
        }
        guard let component = try componentSpecFromJSObject(componentValue) as? ViewSpec else {
            throw NativeNavigatorError.invalidParameter(name: "component", value: componentValue)
        }

        let animated = object.getBool("animated", true)
        
        var result = PushOptions(component: component, animated: animated)
        result.target = object.getString("target")
        if let mode = object.getString("mode") {
            if let modeValue = PushMode(rawValue: mode) {
                result.mode = modeValue
            } else {
                throw NativeNavigatorError.invalidParameter(name: "mode", value: mode)
            }
        }
        
        if let popCount = object.getInt("popCount") {
            result.popCount = popCount
        }
        
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

extension DismissOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> DismissOptions {
        let id = object.getString("id")
        let animated = object.getBool("animated", true)
        return DismissOptions(id: id, animated: animated)
    }
    
}

extension ResetOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> ResetOptions {
        let animated = object.getBool("animated", false)
        
        return ResetOptions(animated: animated)
    }
    
}

extension ViewReadyOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> ViewReadyOptions {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.missingParameter(name: "id")
        }
        
        return ViewReadyOptions(id: id)
    }
    
}

extension GetOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> GetOptions {
        var result = GetOptions()
        
        if let id = object.getString("id") {
            result.id = id
        }
        
        return result
    }
    
}

extension MessageOptions {
    
    static func fromJSObject(_ object: JSObjectLike) throws -> MessageOptions {
        guard let type = object.getString("type") else {
            throw NativeNavigatorError.missingParameter(name: "type")
        }
        var result = MessageOptions(type: type)
        result.target = object.getString("target")
        result.value = object.getObject("value")
        return result
    }
    
}
