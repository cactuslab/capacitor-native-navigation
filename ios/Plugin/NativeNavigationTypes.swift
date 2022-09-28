import Capacitor
import Foundation

typealias ComponentId = String
typealias ButtonId = String

struct CreateOptions {
    var type: ComponentType
    var id: ComponentId?
    var options: ComponentOptions?
    var retain: Bool
    
    var stackOptions: StackOptions?
    var tabsOptions: TabsOptions?
    var viewOptions: ViewOptions?
}

struct StackOptions {
    var stack: [CreateOptions]?
}

struct TabsOptions {
    var tabs: [CreateOptions]
}

struct ViewOptions {
    var path: String
    var state: JSObject?
}

struct CreateResult {
    var id: ComponentId
}

extension CreateResult {
    
    func toPluginResult() -> PluginCallResultData {
        return [
            "id": id
        ]
    }
    
}

enum ComponentType: String {
    case stack
    case tabs
    case view
}

struct SetRootOptions {
    var id: ComponentId
}

struct PresentOptions {
    var id: ComponentId
    
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
    var id: ComponentId
    var stack: ComponentId?
    var animated: Bool
}

struct PushResult {
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
    var animated: Bool
}

struct PopResult {
    var stack: ComponentId
    var id: ComponentId?
}

extension PopResult {

    func toPluginResult() -> PluginCallResultData {
        var result = PluginCallResultData()
        result["stack"] = stack
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
    var title: String?
    var stack: ComponentOptions.StackOptions?
    var tab: ComponentOptions.TabOptions?

    var modalPresentationStyle: ModalPresentationStyle?

    struct StackOptions {
        var backItem: StackItem?
        var leftItems: [StackItem]?
        var rightItems: [StackItem]?
    }

    struct StackItem {
        var id: ButtonId
        var title: String
        var image: String?
    }

    struct TabOptions {
        var image: String?
        var badgeValue: String?
    }
}
