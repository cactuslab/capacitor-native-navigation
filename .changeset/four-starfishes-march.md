---
"@cactuslab/native-navigation": patch
---

iOS: change approach for finding our UIWindow

The original method was devised when we removed Capacitor's `WKWebView` from the view
hierarchy, which we don't do anymore, and breaks when things like system PIN prompts
take over the UI.
