import Capacitor
import Foundation

typealias ComponentId = String
typealias ButtonId = String


/** Something that can be turned into a result for the plugin frontend */
protocol PluginResultable {
    func toPluginResult() -> PluginCallResultData
}

/** The base of all component specs */
protocol ComponentSpec: PluginResultable {
    var type: ComponentType { get }
    var id: ComponentId? { get set }
    var alias: ComponentId? { get set }
    var state: JSObject? { get set }
    
    mutating func update(_ object: JSObjectLike) throws
}

/** A ComponentSpec that can appear in a TabSpec */
protocol TabableSpec: ComponentSpec {
    
}

struct StackSpec: TabableSpec, JSObjectDecodable {
    var type: ComponentType { return ComponentType.stack }
    var id: ComponentId?
    var alias: ComponentId?
    
    var components: [ViewSpec]
    var bar: BarSpec?
    var title: String?
    
    var state: JSObject?
    
    static func fromJSObject(_ object: JSObjectLike) throws -> StackSpec {
        guard let viewSpecObjects = object.getArray("components") as? [JSObject] else {
            throw NativeNavigatorError.missingParameter(name: "components")
        }
        
        var stackComponents: [ViewSpec] = []
        for initialStackItem in viewSpecObjects {
            stackComponents.append(try ViewSpec.fromJSObject(initialStackItem))
        }
    
        var spec = StackSpec(components: stackComponents)
        spec.alias = object.getString("alias")
        spec.title = object.getString("title")
        
        if let barObject = object.getObject("bar") {
            spec.bar = try BarSpec.fromJSObject(barObject)
        }
        
        if let state = object.getObject("state") {
            spec.state = state
        }
        
        return spec
    }
    
    mutating func update(_ object: JSObjectLike) throws {
        try BarSpec.updateOrCreate(object, key: "bar", existingObject: &bar)
        // TODO: Update the components. We're undecided as to how a stack should perform an update of its components if at all
    }
    
    func toPluginResult() -> PluginCallResultData {
        var result = componentSpecToPluginResult(self)
        
        var stackResult: [PluginCallResultData] = []
        for child in components {
            stackResult.append(child.toPluginResult())
        }
        result["components"] = stackResult
        
        if let title = title {
            result["title"] = title
        }
        
        if let value = bar {
            result["bar"] = value.toPluginResult()
        }
        
        if let state = self.state {
            result["state"] = state
        }
        
        return result
    }
}

struct TabsSpec: ComponentSpec {
    
    var type: ComponentType { return ComponentType.tabs }
    var id: ComponentId?
    var alias: ComponentId?
    
    var title: String?
    var tabs: [TabSpec]
    
    var state: JSObject?
    
    func toPluginResult() -> PluginCallResultData {
        var result = componentSpecToPluginResult(self)
        
        var tabsResult: [PluginCallResultData] = []
        for child in self.tabs {
            tabsResult.append(child.toPluginResult())
        }
        result["tabs"] = tabsResult
        if let value = title {
            result["title"] = value
        }
        
        if let state = self.state {
            result["state"] = state
        }
        
        return result
    }
    
    static func fromJSObject(_ object: JSObjectLike) throws -> TabsSpec {
        
        guard let initialTabObjects = object.getArray("tabs") as? [JSObject] else {
            throw NativeNavigatorError.missingParameter(name: "tabs")
        }
        var initialTabs: [TabSpec] = []
        for initialTabItem in initialTabObjects {
            initialTabs.append(try TabSpec.fromJSObject(initialTabItem))
        }

        var spec = TabsSpec(tabs: initialTabs)
        spec.title = object.getString("title")
        spec.alias = object.getString("alias")
        
        if let state = object.getObject("state") {
            spec.state = state
        }
        
        return spec
    }
    
    mutating func update(_ object: JSObjectLike) throws {
        // TODO: Unimplemented
        fatalError("Updating a tabspec is unimplemented")
    }
}

struct TabSpec: PluginResultable, JSObjectUpdatable, JSObjectDecodable {
    var id: ComponentId?
    
    var title: String?
    var image: ImageObject?
    var badgeValue: String?
    
    var component: TabableSpec
    
    var state: JSObject?
    
    func toPluginResult() -> PluginCallResultData {
        var result: PluginCallResultData = [:]
        if let id = id {
            result["id"] = id
        }
        if let image = image {
            result["image"] = image.toPluginResult()
        }
        if let value = badgeValue {
            result["badgeValue"] = value
        }
        result["component"] = component.toPluginResult()
        if let state = self.state {
            result["state"] = state
        }
        return result
    }
    
    static func fromJSObject(_ object: JSObjectLike) throws -> TabSpec {
        // TODO: Review this commented out code an update it for correctness
        fatalError("This method is not implemented")
//        guard let componentObject = object.getObject("component") else {
//            throw NativeNavigatorError.missingParameter(name: "component")
//        }
//
//        let componentSpec = try tabableSpecFromJSObject(componentObject)
//
//        var result = TabSpec(component: componentSpec)
//
//        result.id = object.getString("id")
//        result.badgeValue = object.getString("badgeValue")
//        result.image = try ImageObject.fromJSObject(object, key: "image")
//        result.title = object.getString("title")
//
//        return result
    }
    
    static func updateOrCreate(_ object: JSObjectLike, existingObj: inout TabSpec?) throws {
        // TODO: Unimplemented
        fatalError("Updating a tabspec is unimplemented")
    }
}

struct ViewSpec: TabableSpec, JSObjectDecodable {
    
    var type: ComponentType { return ComponentType.view }
    var id: ComponentId?
    var alias: ComponentId?
    
    var title: String?
    var stackItem: StackItemSpec?
    
    var path: String?
    var state: JSObject?
    
    static func fromJSObject(_ object: JSObjectLike) throws -> ViewSpec {
        var spec = ViewSpec()
        spec.path = object.getString("path")
        spec.alias = object.getString("alias")
        spec.title = object.getString("title")
        
        if let state = object.getObject("state") {
            spec.state = state
        }
        
        if let jsStackItem = object.getObject("stackItem") {
            spec.stackItem = try StackItemSpec.fromJSObject(jsStackItem)
        }
                
        return spec
    }
    
    mutating func update(_ object: JSObjectLike) throws {
        try Nullable<String>.fromJSObjectOrNil(object, key: "title")?.apply({self.title = $0})
        try StackItemSpec.updateOrCreate(object, key: "stackItem", existingObject: &stackItem)
    }
    
    func toPluginResult() -> PluginCallResultData {
        var result = componentSpecToPluginResult(self)
        if let path = self.path {
            result["path"] = path
        }
        if let state = self.state {
            result["state"] = state
        }
        if let title = title {
            result["title"] = title
        }
        if let stackItem = stackItem {
            result["stackItem"] = stackItem.toPluginResult()
        }
        return result
    }
    
}

enum ComponentType: String {
    case stack
    case tabs
    case view
}

struct PresentOptions {
    var component: ComponentSpec
    var style: PresentationStyle
    var cancellable: Bool
    var animated: Bool
}

struct PresentResult: PluginResultable {
    var id: ComponentId
    
    func toPluginResult() -> PluginCallResultData {
        return [
            "id": id
        ]
    }
}

enum PresentationStyle: String {
    case fullScreen
    case pageSheet
    case formSheet
    
    func toUIModalPresentationStyle() -> UIModalPresentationStyle {
        switch self {
        case .fullScreen: return .overFullScreen
        case .pageSheet: return .pageSheet
        case .formSheet: return .formSheet
        }
    }
}

struct DismissOptions {
    var id: ComponentId?
    var animated: Bool
}

struct DismissResult: PluginResultable {
    var id: ComponentId
    
    func toPluginResult() -> PluginCallResultData {
        return [
            "id": id
        ]
    }
}

struct PushOptions {
    var component: ViewSpec
    var target: ComponentId?
    var animated: Bool
    var mode: PushMode?
    var popCount: Int?
}

enum PushMode: String {
    case push
    case replace
    case root
}

struct PushResult: PluginResultable {
    var id: ComponentId
    var stack: ComponentId?
    
    func toPluginResult() -> PluginCallResultData {
        var result: PluginCallResultData = [
            "id": id
        ]
        if let stack = self.stack {
            result["stack"] = stack
        }
        return result
    }
}

struct PopOptions {
    var stack: ComponentId?
    var count: Int?
    var animated: Bool
}

struct PopResult {
    var stack: ComponentId
    var count: Int
    var id: ComponentId?
}

extension PopResult {

    func toPluginResult() -> PluginCallResultData {
        var result = PluginCallResultData()
        result["stack"] = stack
        result["count"] = count
        if let id = id {
            result["id"] = id
        }
        return result
    }

}

struct UpdateOptions: JSObjectDecodable {
    var id: ComponentId
    var animated: Bool

    var update: JSObjectLike?
    
    static func fromJSObject(_ object: JSObjectLike) throws -> UpdateOptions {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.missingParameter(name: "id")
        }

        let animated = object.getBool("animated", false)
        
        guard let options = object.getObject("update") else {
            throw NativeNavigatorError.missingParameter(name: "update")
        }
        
        return UpdateOptions(id: id, animated: animated, update: options)
    }
}

struct StackItemSpec: PluginResultable, JSObjectDecodable, JSObjectUpdatable {
    var backItem: StackBarButtonItem?
    var leftItems: [StackBarButtonItem]?
    var rightItems: [StackBarButtonItem]?
    
    var bar: BarSpec?

    var backEnabled: Bool {
        return leftItems == nil
    }
    
    func toPluginResult() -> PluginCallResultData {
        var result: PluginCallResultData = [:]
        if let value = backItem?.toPluginResult() {
            result["backItem"] = value
        }
        if let value = leftItems?.map({$0.toPluginResult()}) {
            result["leftItems"] = value
        }
        if let value = rightItems?.map({$0.toPluginResult()}) {
            result["rightItems"] = value
        }
        if let value = bar?.toPluginResult() {
            result["bar"] = value
        }
        return result
    }
    
    static func fromJSObject(_ object: JSObjectLike) throws -> StackItemSpec {
        var result = StackItemSpec()
        if let obj = object.getObject("backItem") {
            result.backItem = try StackBarButtonItem.fromJSObject(obj)
        }
    
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
        if let obj = object.getObject("bar") {
            result.bar = try BarSpec.fromJSObject(obj)
        }
        
        return result
    }
    
    static func updateOrCreate(_ object: JSObjectLike, existingObj: inout StackItemSpec?) throws {
        var spec = existingObj ?? StackItemSpec()
        
        try Nullable<StackBarButtonItem>.fromJSObjectOrNil(object, key: "backItem")?.apply({spec.backItem = $0})
        
        try Nullable<[StackBarButtonItem]>.fromJSObjectOrNil(object, key: "leftItems", customDecoder: { object, key in
            if let jsItems = object.getArray(key) {
                var items: [StackBarButtonItem] = []
                for item in jsItems {
                    guard let item = item as? JSObject else {
                        throw NativeNavigatorError.invalidParameter(name: key, value: item)
                    }

                    items.append(try StackBarButtonItem.fromJSObject(item))
                }
                return items
            }
            return nil
        })?.apply({spec.leftItems = $0})
        
        try Nullable<[StackBarButtonItem]>.fromJSObjectOrNil(object, key: "rightItems", customDecoder: { object, key in
            if let jsItems = object.getArray(key) {
                var items: [StackBarButtonItem] = []
                for item in jsItems {
                    guard let item = item as? JSObject else {
                        throw NativeNavigatorError.invalidParameter(name: key, value: item)
                    }

                    items.append(try StackBarButtonItem.fromJSObject(item))
                }
                return items
            }
            return nil
        })?.apply({spec.rightItems = $0})
        
        try BarSpec.updateOrCreate(object, key: "bar", existingObject: &spec.bar)
    
        existingObj = spec
    }
}

struct StackBarButtonItem: PluginResultable, JSObjectDecodable {
    
    var id: ButtonId
    var title: String
    var image: ImageObject?
    
    func toPluginResult() -> PluginCallResultData {
        var result: PluginCallResultData = ["id": id, "title": title]
        if let value = image?.toPluginResult() {
            result["image"] = value
        }
        return result
    }
    
    static func fromJSObject(_ object: JSObjectLike) throws -> StackBarButtonItem {
        guard let id = object.getString("id") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.id", value: object)
        }
        guard let title = object.getString("title") else {
            throw NativeNavigatorError.invalidParameter(name: "StackItem.title", value: object)
        }
        
        let image = try ImageObject.fromJSObject(object, key: "image") //Nullable<ImageObject>.fromJSObjectOrNil(object, key: "image")
        
        return StackBarButtonItem(id: id, title: title, image: image)
    }
}

struct BarSpec : PluginResultable, JSObjectUpdatable, JSObjectDecodable {
    var background: FillSpec?
    var title: LabelSpec?
    var buttons: LabelSpec?
    var visible: Bool?
    var hideShadow: Bool?
    
    /// Create a new bar spec that combines the fallback values where this instance is nil.
    /// This is useful for merging a view's `BarSpec` with it's container stack `BarSpec`
    /// - Parameter fallback: The spec to fallback to when an attribute is nil
    /// - Returns: A new BarSpec combining both `self` and the `fallback`
    func barSpecWithFallback(_ fallback: BarSpec) -> BarSpec {
        var spec = BarSpec()
        spec.background = background ?? fallback.background
        spec.title =  LabelSpec.merge(primary: title, fallback: fallback.title)
        spec.buttons = LabelSpec.merge(primary: buttons, fallback: fallback.buttons)
        spec.visible = visible ?? fallback.visible
        spec.hideShadow = hideShadow ?? fallback.hideShadow
        return spec
    }
    
    static func fromJSObject(_ object: JSObjectLike) throws -> BarSpec {
        var result = BarSpec()
        if let backgroundOptions = object.getObject("background") {
            result.background = try FillSpec.fromJSObject(backgroundOptions)
        }
        if let titleOptions = object.getObject("title") {
            result.title = try LabelSpec.fromJSObject(titleOptions)
        }
        if let buttonsOptions = object.getObject("buttons") {
            result.buttons = try LabelSpec.fromJSObject(buttonsOptions)
        }
        result.visible = object.getBool("visible")
        if let iOSOpts = object.getObject("iOS") {
            if let hideShadow = iOSOpts.getBool("hideShadow") {
                result.hideShadow = hideShadow
            }
        }
        return result
    }
    
    static func updateOrCreate(_ object: JSObjectLike, existingObj: inout BarSpec?) throws {
        var spec = existingObj ?? BarSpec()

        try FillSpec.updateOrCreate(object, key: "background", existingObject: &spec.background)
        try LabelSpec.updateOrCreate(object, key: "title", existingObject: &spec.title)
        try LabelSpec.updateOrCreate(object, key: "buttons", existingObject: &spec.buttons)
        try Nullable<Bool>.fromJSObjectOrNil(object, key: "visible")?.apply({spec.visible = $0})
        if let iOSOpts = object.getObject("iOS") {
            try Nullable<Bool>.fromJSObjectOrNil(iOSOpts, key: "hideShadow")?.apply({spec.hideShadow = $0})
        }
        
        existingObj = spec
    }
    
    func toPluginResult() -> Capacitor.PluginCallResultData {
        var result: PluginCallResultData = [:]
        if let value = background?.toPluginResult() {
            result["background"] = value
        }
        if let value = title?.toPluginResult() {
            result["title"] = value
        }
        if let value = buttons?.toPluginResult() {
            result["buttons"] = value
        }
        if let value = visible {
            result["visible"] = value
        }
        var iOSOpts: PluginCallResultData = [:]
        if let value = hideShadow {
            iOSOpts["hideShadow"] = value
        }
        if !iOSOpts.isEmpty {
            result["iOS"] = iOSOpts
        }
        return result
    }
}

struct FillSpec : PluginResultable, JSObjectDecodable, JSObjectUpdatable {
    var color: UIColor?
    
    static func fromJSObject(_ object: JSObjectLike) throws -> FillSpec {
        var result = FillSpec()
        if let color = object.getString("color") {
            result.color = try parseColor(color)
        }
        return result
    }
        
    static func updateOrCreate(_ object: JSObjectLike, existingObj: inout FillSpec?) throws {
        if (existingObj == nil) {
            existingObj = FillSpec()
        }
        try Nullable<UIColor>.fromJSObjectOrNil(object, key: "color")?.apply({existingObj?.color = $0})
    }
    
    func toPluginResult() -> PluginCallResultData {
        var result: PluginCallResultData = [:]
        if let value = color?.toHex() {
            result["color"] = value
        }
        return result
    }
}

struct LabelSpec: PluginResultable, JSObjectDecodable, JSObjectUpdatable {
    var color: UIColor?
    var font: UIFont?
    
    func toPluginResult() -> PluginCallResultData {
        var result: PluginCallResultData = [:]
        if let value = color?.toHex() {
            result["color"] = value
        }
        if let name = font?.fontName, let size = font?.pointSize {
            result["font"] = ["name": name, "size": size] as [String : Any]
        }
        return result
    }
    
    static func merge(primary: LabelSpec?, fallback: LabelSpec?) -> LabelSpec? {
        guard let primary = primary else {
            return fallback
        }
        guard let fallback = fallback else {
            return primary
        }
        var spec = LabelSpec(color: fallback.color, font: fallback.font)
        if let color = primary.color {
            spec.color = primary.color
        }
        if let font = primary.font {
            spec.font = font
        }
        return spec
    }
    
    static func fromJSObject(_ object: JSObjectLike) throws -> LabelSpec {
        var result = LabelSpec()
        if let color = object.getString("color") {
            result.color = try parseColor(color)
        }
        if let font = object.getObject("font") {
            result.font = try parseFont(font)
        }
        return result
    }
    
    static func updateOrCreate(_ object: JSObjectLike, existingObj: inout LabelSpec?) throws {
        if (existingObj == nil) {
            existingObj = LabelSpec()
        }
        try Nullable<UIColor>.fromJSObjectOrNil(object, key: "color")?.apply({existingObj?.color = $0})
        try Nullable<UIFont>.fromJSObjectOrNil(object, key: "font")?.apply({existingObj?.font = $0})
    }
    
}

struct ResetOptions {
    var animated: Bool
}

struct ViewReadyOptions {
    var id: ComponentId
}

struct ImageObject: PluginResultable {
    var uri: String
    var scale: CGFloat?
    
    func toPluginResult() -> PluginCallResultData {
        var result: PluginCallResultData = ["uri": uri]
        if let scale = scale {
            result["scale"] = scale
        }
        return result
    }
}

struct GetOptions {
    var id: ComponentId?
}

struct GetResult {
    var component: ComponentSpec?
    var stack: StackSpec?
    var tabs: TabsSpec?
}

extension GetResult {

    func toPluginResult() -> PluginCallResultData {
        var result = PluginCallResultData()
        if let component = component {
            result["component"] = component.toPluginResult()
        }
        if let stack = stack {
            result["stack"] = stack.toPluginResult()
        }
        if let tabs = tabs {
            result["tabs"] = tabs.toPluginResult()
        }
        return result
    }

}

struct MessageOptions {
    var target: ComponentId?
    var type: String
    var value: JSObjectLike?
}

//MARK: Extensions

extension Optional {
    fileprivate mutating func setOrTryApply(_ other: Wrapped?, apply: (_ base: Wrapped, _ overlay: Wrapped) -> Wrapped) {
        guard let other = other else { return }
        switch self {
        case .none:
            self = .some(other)
        case .some(let wrapped):
            self = .some(apply(wrapped, other))
        }
    }
}

//MARK: Utilities

fileprivate func componentSpecToPluginResult(_ spec: ComponentSpec) -> PluginCallResultData {
    var result: PluginCallResultData = [
        "type": spec.type.rawValue,
        ]
    if let id = spec.id {
        result["id"] = id
    }
    if let alias = spec.alias {
        result["alias"] = alias
    }
    return result
}
