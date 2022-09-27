import Capacitor
import Foundation

struct CreateOptions {
    var type: RootType
    var name: String?
    var presentationStyle: PresentationStyle?
    var modalPresentationStyle: ModalPresentationStyle?
    var stacks: [String]?
}

struct PresentOptions {
    var rootName: String?
    var rootOptions: CreateOptions?
    var animated: Bool
    var presentationStyle: PresentationStyle?
    var modalPresentationStyle: ModalPresentationStyle?
}

struct ViewOptions {
    var path: String
    var state: JSObject?
}

struct PushOptions {
    var stack: String?
    var animated: Bool
    var viewId: String
}

struct PushResult {
    var stack: String
}

enum RootType: String {
    case stack
    case tabs
    case plain
}

enum PresentationStyle: String {
    case normal
    case modal
}

enum ModalPresentationStyle: String {
    case fullScreen
    case pageSheet
    case formSheet
}
