---
"capacitor-native-navigation": patch
---

Android: reject a failed call instead of crashing the app

`dismiss`, `push`, `get`, `update`, `message` and `reset` parsed their options
inside a `try`, but they called the implementation inside `activity.runOnUiThread`,
which sits outside that `try`. Any exception from the implementation crashed the
app, and the plugin call never settled. Each call now rejects with the failure.

`handleOnStart` also added a webview listener on each start, while
`handleOnDestroy` removed one only at the end of the activity. The listener
accumulated across a stop and start cycle, and the plugin then reset itself once
for each registration on a page load. The listener is now added once.
