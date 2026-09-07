---
"capacitor-native-navigation": patch
---

iOS: require iOS 15, and build the whole plugin in the Xcode project

The podspec asked for iOS 14, and `Plugin.xcodeproj` asked for iOS 13, but
Capacitor 8 requires iOS 15. An app that uses this plugin therefore already
needed iOS 15, so the lower numbers only misreported the real minimum. The
podspec, the Podfile and the Xcode project now all state iOS 15.

The Xcode project also compiled only 2 of the 13 Swift files, so `verify:ios`
could never build. The remaining 11 files are now in the target.
