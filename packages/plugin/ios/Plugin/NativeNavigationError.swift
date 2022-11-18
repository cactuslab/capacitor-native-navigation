import Foundation

enum NativeNavigatorError: LocalizedError {
    case missingParameter(name: String)
    case invalidParameter(name: String, value: Any)
    
    case alreadyPresented(name: String)
    case notPresented(name: String)
    case notARoot(name: String)
    case componentAlreadyExists(name: String)
    case notAStack(name: String)
    case notTabs(name: String)
    case componentNotFound(name: String)
    case illegalState(message: String)

    var errorDescription: String? {
        switch self {
        case .alreadyPresented(name: let name):
            return "Already presented: \(name)"
        case .notPresented(name: let name):
            return "Not presented: \(name)"
        case .notARoot(name: let name):
            return "Not a root: \(name)"
        case .illegalState(message: let message):
            return "Illegal state: \(message)"
        case .missingParameter(name: let name):
            return "Missing parameter: \(name)"
        case .invalidParameter(name: let name, value: let value):
            return "Invalid parameter \"\(name)\": \(value)"
        case .componentAlreadyExists(name: let name):
            return "Component already exists: \(name)"
        case .notAStack(name: let name):
            return "Component is not a stack: \(name)"
        case .notTabs(name: let name):
            return "Component is not tabs: \(name)"
        case .componentNotFound(name: let name):
            return "Component not found: \(name)"
        }
    }
}
