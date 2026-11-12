---
"capacitor-native-navigation-react": patch
"capacitor-native-navigation-react-router": patch
"capacitor-native-navigation-history": patch
---

Accept React 19 and React Router 7 as peer dependencies, alongside React 18 and React Router 6. The packages are already built and run against them in the example app, but the peer ranges only allowed React 18 and React Router 6, so `npm install` into a React 19 app failed with `ERESOLVE`.
