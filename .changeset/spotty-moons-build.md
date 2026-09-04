---
"capacitor-native-navigation": patch
---

Android: repair the standalone plugin build

`verify:android` failed before it compiled anything. The Gradle wrapper pinned
7.4.2, and the Android Gradle plugin needs 8.9. The wrapper is now 8.9, matching
the example app.

`build.gradle` also now supplies defaults for `androidxActivityVersion`,
`androidxFragmentVersion` and `androidxWebkitVersion`. An app project sets these
in `variables.gradle`, so only a standalone build sees the defaults.
