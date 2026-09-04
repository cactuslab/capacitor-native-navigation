---
"capacitor-native-navigation": patch
---

Android: report console output from the webviews we create

Each view uses its own `WebView`, and those webviews had no `WebChromeClient`, so
their console messages were dropped. They now log under the `Capacitor/Console`
tag, prefixed with the id of the view that produced them.
