---
"capacitor-native-navigation-react-router": patch
---

Fix data router navigations to routes without loaders never pushing the native view. The settle listener is now attached before the inner router navigates, completion is detected by location key, and navigations superseded before settling no longer push a stale destination.
