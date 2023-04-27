import Capacitor
import Foundation

protocol JSObjectDecodable {
    static func fromJSObject(_ object: JSObjectLike) throws -> Self
}

protocol JSObjectUpdatable {
    static func updateOrCreate(_ object: JSObjectLike, existingObj: inout Self?) throws
}

extension JSObjectUpdatable {
    
    /// An updateOrCreate that can handle `null` attributes used when unsetting something. If `null` then the existingObject is set to nil as if it were unset.
    /// - Parameters:
    ///   - object: The Container js object
    ///   - key: The key for the attribute we are inspecting
    ///   - existingObject: An object to mutate when the value is decoded.
    static func updateOrCreate(_ object: JSObjectLike, key: String, existingObject: inout Self?) throws {
        if object.isNull(key) {
            existingObject = nil
        } else {
            if let obj = object.getObject(key) {
                try Self.updateOrCreate(obj, existingObj: &existingObject)
            }
        }
    }
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
    /// A helper function to resolve the three possible states of `key` of `object`. This function allows us to interpret `undefined | null | T` types.
    /// - Parameters:
    ///   - object: The container object.
    ///   - key: The key to inspect for decoding.
    ///   - customDecoder: A block to decode the object if it exists.
    /// - Returns: `nil` if the key isn't present, otherwise a `Nullable`
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

extension Nullable where T == UIColor {
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String) throws -> Nullable<T>? {
        return try fromJSObjectOrNil(object, key: key, customDecoder: {
            if let color = $0.getString($1) {
                return try parseColor(color)
            } else {
                return nil
            }
        })
    }
}

extension Nullable where T == UIFont {
    static func fromJSObjectOrNil(_ object: JSObjectLike, key: String) throws -> Nullable<T>? {
        return try fromJSObjectOrNil(object, key: key, customDecoder: {
            if let font = $0.getObject($1) {
                return try parseFont(font)
            } else {
                return nil
            }
        })
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

func tabableSpecFromJSObject(_ object: JSObjectLike) throws -> TabableSpec {
    guard let typeString = object.getString("type") else {
        throw NativeNavigatorError.missingParameter(name: "type")
    }
    guard let type = ComponentType(rawValue: typeString) else {
        throw NativeNavigatorError.invalidParameter(name: "type", value: typeString)
    }

    switch type {
    case .stack:
        return try StackSpec.fromJSObject(object)
    case .view:
        return try ViewSpec.fromJSObject(object)
    case .tabs:
        throw NativeNavigatorError.invalidParameter(name: "type.tabs", value: "Invalid Option for Tab")
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
        return try TabsSpec.fromJSObject(object)
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


func parseColor(_ color: String) throws -> UIColor {
    if let result = UIColor(hex: color) {
        return result
    } else {
        throw NativeNavigatorError.invalidParameter(name: "color", value: color)
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
