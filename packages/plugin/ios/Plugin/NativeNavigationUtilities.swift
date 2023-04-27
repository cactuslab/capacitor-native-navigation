//
//  NativeNavigationUtilities.swift
//  CactuslabNativeNavigation
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
        guard let components = self.cgColor.components else {
            return nil
        }
        
        let r = Float(components[0])
        let g = Float(components[1])
        let b = Float(components[2])
        let a = Float(components[3])
        
        let hasAlpha = a != 1.0
        
        return String(format: "#%02lX%02lX%02lX%@",
                      lroundf(r * 255), lroundf(g * 255), lroundf(b * 255),
                      hasAlpha ? String(format: "%02lX", lroundf(a * 255)) : "")
    }
}
