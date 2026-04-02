---
"capacitor-native-navigation-react-router": minor
---

Add data router support with loader handoff:

- Support react-router data routers via the `router` prop on `NativeNavigationRouter`
- Loaders run before native push by default, with loaded data handed off to the new view via `hydrationData` (no double-load)
- Current view shows `navigation.state === 'loading'` via standard `useNavigation()` while loaders run
- Add `dontAwaitLoaders` prop to push immediately with `Suspense`/`Await` loading instead
- Multiple `NativeNavigationRouter` instances can coexist via view ownership tagging
