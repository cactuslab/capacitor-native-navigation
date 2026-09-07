---
"capacitor-native-navigation": patch
---

Android: reject a stack that has no components, rather than crash

`present` read `components.last()` and `components.first()` on a stack. A stack
spec always parses to a list, so `components: []` produced an empty list, and
`last()` threw. The throw happened inside `runOnUiThread`, where nothing caught
it, so the app crashed and the call never settled. `present` now rejects such a
stack before it changes any state.

`present` also inserted the components of a stack a second time. `insertComponent`
already walks into a stack and merges the container state into each component,
so the extra pass did the same work twice.
