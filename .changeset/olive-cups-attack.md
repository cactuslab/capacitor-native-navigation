---
"capacitor-native-navigation-react-router": patch
---

React Router: push the first navigation from each data router view

`NativeNavigationDataRouter` navigated the inner memory router and then
subscribed to it, to wait for the loaders. A route with no loaders settles
inside the `navigate` call, so the subscriber missed it and the promise never
settled. The native push never happened.

Each later navigation resolved the promise of the one before it, so a view
pushed the previous target and the first tap appeared to do nothing.

The subscriber is now added before the navigation starts.
