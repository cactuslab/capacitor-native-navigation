---
"capacitor-native-navigation-react-router": major
---

Modal config paths no longer match as prefixes, they now support path-to-regexp

To retain the old behaviour, add a `*` at the end of your exiting modal paths that need to match as a path prefix.
The modal config `path` attribute now also supports an array of paths.
