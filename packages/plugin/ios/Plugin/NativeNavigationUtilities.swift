//
//  NativeNavigationUtilities.swift
//  CapacitorNativeNavigation
//
//  Created by Thomas Carey on 24/04/23.
//

import Foundation

/** JavaScript diffentiates undefined, null and value. This enables Swift to represent nil as undefined, .null as null, and .value as value. */
enum Nullable<T> {
    case value(_ value: T)
    case null
    
    func valueOrNil() -> T? {
        switch self {
        case .null: return nil
        case let .value(value):
            return value
        }
    }
    
    func apply(_ block:(T?) -> ()) {
        switch self {
        case .null:
            block(nil)
        case .value(let value):
            block(value)
        }
    }
}

extension UIColor {
    func toHex() -> String? {
        var r: CGFloat = 0
        var g: CGFloat = 0
        var b: CGFloat = 0
        var a: CGFloat = 0
        guard self.getRed(&r, green: &g, blue: &b, alpha: &a) else {
            return nil
        }

        let hasAlpha = a != 1.0

        return String(format: "#%02lX%02lX%02lX%@",
                      lroundf(Float(r) * 255), lroundf(Float(g) * 255), lroundf(Float(b) * 255),
                      hasAlpha ? String(format: "%02lX", lroundf(Float(a) * 255)) : "")
    }
}
