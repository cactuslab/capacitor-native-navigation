import Foundation

@objc public class NativeNavigation: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}
