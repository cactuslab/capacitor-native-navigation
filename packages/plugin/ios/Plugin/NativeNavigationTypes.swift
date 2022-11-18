import Capacitor
import Foundation

typealias ComponentId = String
typealias ButtonId = String

protocol ComponentSpec {
    var type: ComponentType { get }
    var id: ComponentId? { get set }
    var options: ComponentOptions? { get set }
    
    func toPluginResult() -> PluginCallResultData
}

struct StackSpec: ComponentSpec {
    var type: ComponentType { return ComponentType.stack }
    var id: ComponentId?
    var options: ComponentOptions?
    
    var stack: [ViewSpec]
}

struct TabsSpec: ComponentSpec {
    var type: ComponentType { return ComponentType.tabs }
    var id: ComponentId?
    var options: ComponentOptions?
    
    var tabs: [ComponentSpec]
}

struct ViewSpec: ComponentSpec {
    var type: ComponentType { return ComponentType.view }
    var id: ComponentId?
    var options: ComponentOptions?
    
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
        for child in self.stack {
            stackResult.append(child.toPluginResult())
        }
        result["stack"] = stackResult
        
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

struct SetRootOptions {
    var component: ComponentSpec
    var animated: Bool
}

struct SetRootResult {
    var id: ComponentId
}

extension SetRootResult {
    
    func toPluginResult() -> PluginCallResultData {
        return [
            "id": id
        ]
    }
    
}

struct PresentOptions {
    var component: ComponentSpec
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

enum ModalPresentationStyle: String {
    case fullScreen
    case pageSheet
    case formSheet
}

extension ModalPresentationStyle {

    func toUIModalPresentationStyle() -> UIModalPresentationStyle {
        switch self {
        case .fullScreen: return .fullScreen
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
    var stack: ComponentId?
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
    var stack: ComponentId
}

extension PushResult {

    func toPluginResult() -> PluginCallResultData {
        return [
            "stack": stack
        ]
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

struct SetComponentOptions {
    var id: ComponentId
    var animated: Bool

    var options: ComponentOptions
}

struct ComponentOptions {
    var title: Nullable<String>?
    var stack: ComponentOptions.StackOptions?
    var tab: ComponentOptions.TabOptions?

    var modalPresentationStyle: ModalPresentationStyle?
    
    var bar: BarOptions?

    struct StackOptions {
        var backItem: StackItem?
        var leftItems: [StackItem]?
        var rightItems: [StackItem]?
    }

    struct StackBarItem {
        var id: ButtonId
        var title: String
        var image: ImageObject?
    }

    struct TabOptions {
        var image: ImageObject?
        var badgeValue: String?
    }
    
    struct BarOptions {
        var background: FillOptions?
        var title: LabelOptions?
        var buttons: LabelOptions?
    }
    
    struct FillOptions {
        var color: UIColor?
    }
    
    struct LabelOptions {
        var color: UIColor?
        var font: UIFont?
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
