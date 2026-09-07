---
"capacitor-native-navigation": patch
---

Android: destroy the webview of a view that is destroyed

`shouldOverrideLoad` removed a webview from the cache as soon as that view
loaded, and `reset` destroyed only the webviews that were still in the cache.
Every webview that actually loaded was therefore leaked, together with its
render process. `cleanUpComponentWithId` dropped the live data for a component
but never destroyed its webview either.

A second registry now holds every webview by component id.
`notifyDestroyView` destroys the webview of that component, and `reset` destroys
the rest. A webview is detached from its parent, on the main thread, before it
is destroyed.
