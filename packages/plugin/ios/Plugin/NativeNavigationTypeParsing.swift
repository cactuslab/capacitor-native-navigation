import Capacitor
import Foundation

protocol JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> Self
}

extension Nullable where T: JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike, key: String) throws -> Nullable<T> {
        if object.isNull(key) {
            return .null
        } else {
            if let internalObject = object.getObject(key) {
                let value = try T.fromJSObject(internalObject)
                return .value(value)
            } else {
                throw NativeNavigatorError.missingParameter(name: key)
            }
        }
    }
    
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String) throws -> Nullable<T>? {
        if object.isNull(key) {
            return .null
        } else {
            if let internalObject = object.getObject(key) {
                let value = try T.fromJSObject(internalObject)
                return .value(value)
            } else {
                return nil
            }
        }
    }
}

extension Nullable {
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String, customDecoder: (_ object: JSObjectLike, _ key: String) throws -> T?) throws -> Nullable<T>? {
        if object.isNull(key) {
            return .null
        } else {
            if let value = try customDecoder(object, key) {
                return .value(value)
            } else {
                return nil
            }
        }
    }
}

extension Nullable where T == Bool {
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String) throws -> Nullable<T>? {
        return try fromJSObjectOrNil(object, key: key, customDecoder: { $0.getBool($1) })
    }
}

extension Nullable where T == String {
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String) throws -> Nullable<T>? {
        return try fromJSObjectOrNil(object, key: key, customDecoder: { $0.getString($1) })
    }
}

extension Nullable where T == Int {
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String) throws -> Nullable<T>? {
        return try fromJSObjectOrNil(object, key: key, customDecoder: { $0.getInt($1) })
    }
}

extension Nullable where T == ImageObject {
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String) throws -> Nullable<T>? {
        return try fromJSObjectOrNil(object, key: key, customDecoder: { try ImageObject.fromJSObject($0, key: $1) })
    }
}

extension ViewSpec: JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> ViewSpec {
        guard let path = object.getString("path") else {
            throw NativeNavigatorError.missingParameter(name: "path")
        }
        var spec = ViewSpec(path: path)
        spec.id = object.getString("id")
        
        if let state = object.getObject("state") {
            spec.state = state
        }
        
        try spec.setViewOptionsFromJSObject(object)
        
        return spec
    }
}

extension StackSpec: JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> StackSpec {
        var spec = StackSpec()
        spec.id = object.getString("id")
        
        guard let initialStackObjects = object.getArray("components") as? [JSObject] else {
            throw NativeNavigatorError.missingParameter(name: "components")
        }
        
        var initialStack: [ViewSpec] = []
        for initialStackItem in initialStackObjects {
            initialStack.append(try ViewSpec.fromJSObject(initialStackItem))
        }
        
        try spec.setStackOptionsFromJSObject(object)
        
        return spec
    }
}

extension TabsSpec: JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> TabsSpec {
        var spec = TabsSpec(
    }
}

func componentSpecFromJSObject(_ object: JSObjectLike) throws -> ComponentSpec {
    guard let typeString = object.getString("type") else {
        throw NativeNavigatorError.missingParameter(name: "type")
    }
    guard let type = ComponentType(rawValue: typeString) else {
        throw NativeNavigatorError.invalidParameter(name: "type", value: typeString)
    }


    switch type {
    case .stack:
        return try StackSpec.fromJSObject(object)
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
        return try ViewSpec.fromJSObject(object)
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

extension UpdateOptions: JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> UpdateOptions {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.missingParameter(name: "id")
        }

        let animated = object.getBool("animated", false)
        
        guard let options = object.getObject("options") else {
            throw NativeNavigatorError.missingParameter(name: "options")
        }
        return UpdateOptions(id: id, animated: animated, options: try T.fromJSObject(options))
    }
}

extension ComponentOptions {
    fileprivate mutating func setComponentOptionsFromJSObject(_ object: JSObjectLike) throws {
        title = try Nullable<String>.fromJSObjectOrNil(object, key: "title")
    }
}

extension ViewOptionsLike {
    fileprivate mutating func setViewOptionsFromJSObject(_ object: JSObjectLike) throws {
        if let obj = object.getObject("stackItem") {
            stackItem = try StackItem.fromJSObject(obj)
        }
        try setComponentOptionsFromJSObject(object)
    }
}

extension StackOptionsLike {
    fileprivate mutating func setStackOptionsFromJSObject(_ object: JSObjectLike) throws {
        try setComponentOptionsFromJSObject(object)
        
        if object.has("components") {
            guard let viewSpecObjects = object.getArray("components") as? [JSObject] else {
                throw NativeNavigatorError.missingParameter(name: "components")
            }
            
            var stackComponents: [ViewSpec] = []
            for initialStackItem in viewSpecObjects {
                stackComponents.append(try ViewSpec.fromJSObject(initialStackItem))
            }
            components = stackComponents
        }
        
        if let barObject = object.getObject("bar") {
            bar = try BarOptions.fromJSObject(barObject)
        }
    }
}

extension StackOptions {
    static func fromJSObject(_ object: JSObjectLike) throws -> StackOptions {
        var result = StackOptions()
        try result.setComponentOptionsFromJSObject(object)
        return result
    }
}

extension TabsOptions {
    static func fromJSObject(_ object: JSObjectLike) throws -> TabsOptions {
        var result = TabsOptions()
        try result.setComponentOptionsFromJSObject(object)
        
        return result
    }
}

extension ViewOptions {
    static func fromJSObject(_ object: JSObjectLike) throws -> ViewOptions {
        var result = ViewOptions()
        try result.setViewOptionsFromJSObject(object)
        return result
    }
}

extension TabOptions {
    static func fromJSObject(_ object: JSObjectLike) throws -> TabOptions {
        var result = TabOptions()
        result.badgeValue = try Nullable<String>.fromJSObjectOrNil(object, key: "badgeValue")
        result.image = try Nullable<ImageObject>.fromJSObjectOrNil(object, key: "image")
        result.title = try Nullable<String>.fromJSObjectOrNil(object, key: "title")
        
        if let componentObject = object.getObject("component") {
            result.component = try componentSpecFromJSObject(componentObject)
        }
        
        return result
    }
}

extension StackBarButtonItem: JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> StackBarButtonItem {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.id", value: object)
        }
        guard let title = object.getString("title") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.title", value: object)
        }
        
        let image = try Nullable<ImageObject>.fromJSObjectOrNil(object, key: "image")
        
        return StackBarButtonItem(id: id, title: title, image: image)
    }
}

extension StackItem: JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> StackItem {
        var result = StackItem()
        result.backItem = try Nullable<StackBarButtonItem>.fromJSObjectOrNil(object, key: "backItem")
        
        if let leftItems = object.getArray("leftItems") {
            var items: [StackBarButtonItem] = []

            for leftItem in leftItems {
                guard let leftItem = leftItem as? JSObject else {
                    throw NativeNavigatorError.invalidParameter(name: "StackOptions.leftItems", value: leftItem)
                }

                items.append(try StackBarButtonItem.fromJSObject(leftItem))
            }
            
            result.leftItems = items
        }
        if let rightItems = object.getArray("rightItems") {
            var items: [StackBarButtonItem] = []

            for rightItem in rightItems {
                guard let rightItem = rightItem as? JSObject else {
                    throw NativeNavigatorError.invalidParameter(name: "StackOptions.rightItems", value: rightItem)
                }

                items.append(try StackBarButtonItem.fromJSObject(rightItem))
            }
            
            result.rightItems = items
        }
        result.backEnabled = try Nullable<Bool>.fromJSObjectOrNil(object, key: "backEnabled")
        
        return result
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

extension BarOptions: JSObjectDecodable {

    static func fromJSObject(_ object: JSObjectLike) throws -> BarOptions {
        var result = BarOptions()
        if let backgroundOptions = object.getObject("background") {
            result.background = try FillOptions.fromJSObject(backgroundOptions)
        }
        if let titleOptions = object.getObject("title") {
            result.title = try LabelOptions.fromJSObject(titleOptions)
        }
        if let buttonsOptions = object.getObject("buttons") {
            result.buttons = try LabelOptions.fromJSObject(buttonsOptions)
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

extension FillOptions: JSObjectDecodable {
 
    static func fromJSObject(_ object: JSObjectLike) throws -> FillOptions {
        var result = FillOptions()
        if let color = object.getString("color") {
            result.color = try parseColor(color)
        }
        return result
    }
    
}

extension LabelOptions: JSObjectDecodable {

    static func fromJSObject(_ object: JSObjectLike) throws -> LabelOptions {
        var result = LabelOptions()
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
