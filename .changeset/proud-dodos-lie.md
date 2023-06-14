---
"@cactuslab/native-navigation-react-router": minor
"@cactuslab/native-navigation": minor
"@cactuslab/native-navigation-react": minor
---

Add alias option to replace id for user-specified way to reference components

This is because allowing the user to specify an actual component id was troublesome
as it meant the id could be used to present, dismiss and then present again, which
results in two different component models in the native code that share the same
component id.
