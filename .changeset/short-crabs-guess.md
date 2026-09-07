---
"capacitor-native-navigation": patch
---

iOS: clear the flag that marks a view webview as out of date

`path` and `state` set `webViewNeedsUpdate`, and nothing cleared it. After the
first update of a view, every later call sent another `updateView` event, and
waited for the view to report itself ready again, even when nothing had changed.
The flag is now cleared once the event carries the current path and state, so a
change that arrives while the view is still preparing marks the view again.

`createOpdateWebView` is renamed to `createOrUpdateWebView`.
