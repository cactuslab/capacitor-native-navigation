import Capacitor
import Foundation

typealias ComponentId = String
typealias ButtonId = String



protocol ComponentSpec {
    var type: ComponentType { get }
    var id: ComponentId? { get set }
    
    func toPluginResult() -> PluginCallResultData
}

protocol TabableSpec: ComponentSpec {
    
}

struct StackSpec: TabableSpec & StackOptionsLike {
    var type: ComponentType { return ComponentType.stack }
    var id: ComponentId?
    var options: StackOptions?
    
    var components: [ViewSpec]?
    var bar: BarOptions?
    var title: Nullable<String>?
    
    func requireComponents() -> [ViewSpec] {
        return components!
    }
}

struct TabsSpec: ComponentSpec {
    var type: ComponentType { return ComponentType.tabs }
    var id: ComponentId?
    var options: TabsOptions?
    
    var tabs: [TabableSpec]
}

protocol ViewOptionsLike : ComponentOptions {
    var stackItem: StackItem? { get set }
}

protocol StackOptionsLike : ComponentOptions {
    var bar: BarOptions? { get set }
    var components: [ViewSpec]? { get set }
}

protocol TabOptionsLike : ComponentOptions {
    
}

struct ViewSpec: TabableSpec & ViewOptionsLike {
    var type: ComponentType { return ComponentType.view }
    var id: ComponentId?
    
    var title: Nullable<String>?
    var stackItem: StackItem?
    
    var path: String
    var state: JSObject?
}

fileprivate func componentSpecToPluginResult(_ spec: ComponentSpec) -> PluginCallResultData {
    var result: PluginCallResultData = [
        "type": spec.type.rawValue,
        ]
    if let id = spec.id {
        result["id"] = id
    }
    if let options = spec.options {
        result["options"] = options.toPluginResult()
    }
    return result
}

extension StackSpec {
    func toPluginResult() -> PluginCallResultData {
        var result = componentSpecToPluginResult(self)
        
        var stackResult: [PluginCallResultData] = []
        for child in requireComponents() {
            stackResult.append(child.toPluginResult())
        }
        result["components"] = stackResult
        
        return result
    }
}

extension TabsSpec {
    func toPluginResult() -> PluginCallResultData {
        var result = componentSpecToPluginResult(self)
        
        var tabsResult: [PluginCallResultData] = []
        for child in self.tabs {
            tabsResult.append(child.toPluginResult())
        }
        result["tabs"] = tabsResult
        
        return result
    }
}

extension ViewSpec {
    func toPluginResult() -> PluginCallResultData {
        var result = componentSpecToPluginResult(self)
        result["path"] = self.path
        if let state = self.state {
            result["state"] = state
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

struct PresentResult {
    var id: ComponentId
}

extension PresentResult {

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
}

extension PresentationStyle {

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

struct DismissResult {
    var id: ComponentId
}

extension DismissResult {

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

struct PushResult {
    var id: ComponentId
    var stack: ComponentId?
}

extension PushResult {

    func toPluginResult() -> PluginCallResultData {
        var result = [
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

struct TabOptions: JSObjectDecodable {
    var title: Nullable<String>?
    var image: Nullable<ImageObject>?
    var badgeValue: Nullable<String>?
    
    var component: ComponentSpec?
}

protocol ComponentOptions: JSObjectDecodable {
    var title: Nullable<String>? { get set }
}

struct UpdateOptions<T: JSObjectDecodable> {
    var id: ComponentId
    var animated: Bool

    var options: T
}

struct StackOptions: StackOptionsLike {
    var title: Nullable<String>?
    var components: [ViewSpec]?
    var bar: BarOptions?
}

struct TabsOptions: ComponentOptions {
    var title: Nullable<String>?
    var tabs: [TabsSpec]?
}

struct ViewOptions: ViewOptionsLike {
    var title: Nullable<String>?
    var stackItem: StackItem?
}

struct StackItem {
    var backItem: Nullable<StackBarButtonItem>?
    var leftItems: [StackBarButtonItem]?
    var rightItems: [StackBarButtonItem]?
    var backEnabled: Nullable<Bool>?
}

struct StackBarButtonItem {
    var id: ButtonId
    var title: String
    var image: Nullable<ImageObject>?
}

struct BarOptions {
    var background: FillOptions?
    var title: LabelOptions?
    var buttons: LabelOptions?
    var visible: Bool?
}

struct FillOptions {
    var color: UIColor?
}

struct LabelOptions {
    var color: UIColor?
    var font: UIFont?
}

extension Optional {
    
    mutating func setOrTryApply(_ other: Wrapped?, apply: (_ base: Wrapped, _ overlay: Wrapped) -> Wrapped) {
        guard let other = other else { return }
        switch self {
        case .none:
            self = .some(other)
        case .some(let wrapped):
            self = .some(apply(wrapped, other))
        }
    }
    
}

extension ComponentOptions {
    
    func toPluginResult() -> PluginCallResultData {
        // TODO
        return [:]
    }
    
}

struct ResetOptions {
    var animated: Bool
}

enum Nullable<T> {
    case value(_ value: T)
    case null
}

struct ViewReadyOptions {
    var id: ComponentId
}

struct ImageObject {
    var uri: String
    var scale: CGFloat?
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
