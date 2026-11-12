---
"capacitor-native-navigation-react-router": major
"capacitor-native-navigation-history": major
"capacitor-native-navigation-react": major
"capacitor-native-navigation": minor
---

Require Capacitor 6, and install the iOS plugin with Swift Package Manager instead of CocoaPods

The iOS plugin now ships a `Package.swift` and no podspec. Apps must use Swift
Package Manager. In apps that still use CocoaPods, `pod install` fails because
the plugin has no podspec.

The plugin now registers through `CAPBridgedPlugin` in Swift, which requires
Capacitor 6 or later. The `@capacitor/core` peer dependency is now `>=6` in all
packages.
