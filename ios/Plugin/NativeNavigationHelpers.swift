import Capacitor
import Foundation

protocol JSObjectLike {

    func getString(_ key: String) -> String?

    func getBool(_ key: String) -> Bool?

    func getBool(_ key: String, _ defaultValue: Bool) -> Bool

    func getInt(_ key: String) -> Int?

    func getFloat(_ key: String) -> Float?

    func getDouble(_ key: String) -> Double?

    func getArray(_ key: String) -> JSArray?

    func getObject(_ key: String) -> JSObject?
    
    func isNull(_ key: String) -> Bool

}

extension CAPPluginCall: JSObjectLike {

    func isNull(_ key: String) -> Bool {
        return (self.getAny(key) as? NSNull) != nil
    }
    
}

extension JSObject: JSObjectLike {

    func getString(_ key: String) -> String? {
        return self[key] as? String
    }

    func getBool(_ key: String) -> Bool? {
        return self[key] as? Bool
    }

    func getBool(_ key: String, _ defaultValue: Bool) -> Bool {
        return getBool(key) ?? defaultValue
    }

    func getInt(_ key: String) -> Int? {
        return self[key] as? Int
    }

    func getFloat(_ key: String) -> Float? {
        if let floatValue = self[key] as? Float {
            return floatValue
        } else if let doubleValue = self[key] as? Double {
            return Float(doubleValue)
        }
        return nil
    }

    func getDouble(_ key: String) -> Double? {
        return self[key] as? Double
    }

    func getArray(_ key: String) -> JSArray? {
        return self[key] as? JSArray
    }

    func getObject(_ key: String) -> JSObject? {
        return self[key] as? JSObject
    }
    
    func isNull(_ key: String) -> Bool {
        return (self[key] as? NSNull) != nil
    }

}

extension UIColor {
    public convenience init?(hex: String) {
        let r, g, b, a: CGFloat

        if hex.hasPrefix("#") {
            let start = hex.index(hex.startIndex, offsetBy: 1)
            let hexColor = String(hex[start...])

            if hexColor.count == 6 || hexColor.count == 8 {
                let scanner = Scanner(string: hexColor)
                var hexNumber: UInt64 = 0

                if scanner.scanHexInt64(&hexNumber) {
                    if hexColor.count == 8 {
                        r = CGFloat((hexNumber & 0xff000000) >> 24) / 255
                        g = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
                        b = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
                        a = CGFloat(hexNumber & 0x000000ff) / 255
                    } else {
                        r = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
                        g = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
                        b = CGFloat(hexNumber & 0x000000ff) / 255
                        a = 1.0
                    }

                    self.init(red: r, green: g, blue: b, alpha: a)
                    return
                }
            }
        }

        return nil
    }
}

