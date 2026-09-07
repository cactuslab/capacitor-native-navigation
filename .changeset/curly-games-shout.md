---
"capacitor-native-navigation": patch
---

Android: report the four view lifecycle events at four distinct points

`onPause` sent `viewWillDisappear` and `viewDidDisappear` one after the other,
and `onResume` sent `viewWillAppear` and `viewDidAppear` one after the other.
Each pair arrived at the same moment, so the two events carried the same
meaning. iOS reports four distinct points.

The events now follow the fragment lifecycle: will appear on start, did appear
on resume, will disappear on pause, and did disappear on stop.

Those callbacks also forced the component id, which a fragment does not always
have. A fragment for a view that is not yet configured has no id, so the forced
value threw. The callbacks are now null safe.
