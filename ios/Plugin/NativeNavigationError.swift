import Foundation

enum NativeNavigatorError: Error {
    case unknownRoot(name: String)
    case alreadyPresented(name: String)
    case notPresented(name: String)
    case notARoot(name: String)
    case rootAlreadyExists(name: String)
    case stackAlreadyExists(name: String)
    case currentIsNotStack
    case illegalState(message: String)

//    var localizedDescription: String {
//        switch self {
//        case .unknownRoot(let name):
//            return "Unknown root: \(name)"
//        case .alreadyPresented(name: let name):
//            return "Already presented: \(name)"
//        case .notPresented(name: let name):
//            return "Not presented: \(name)"
//        case .notARoot(name: let name):
//            return "Not a root: \(name)"
//        case .rootAlreadyExists(name: let name):
//            return "Root already exists: \(name)"
//        case .illegalState(message: let message):
//            return "Illegal state: \(message)"
//        }
//    }
}
