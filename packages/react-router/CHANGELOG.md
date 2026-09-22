# capacitor-native-navigation-react-router

## 8.2.2

### Patch Changes

- f975ea9: React Router: register data router routes during render

  The registry of data router routes was filled in an effect, and effects run
  after the commit. On the first commit, a router with `<Route>` children saw an
  empty registry. It claimed every untagged view, including the views of a data
  router, and both routers rendered into the same element. Nothing re-rendered to
  correct this. A data router that mounted later had the same result.

  Routes are now registered during render. A router with `<Route>` children
  subscribes to the registry, and it re-evaluates which views it owns when the
  registry changes.

  A cached view element also held no record of the router that built it, so a
  router that took over a view reused the element of the previous owner, with the
  children and the router id of that owner. A router now reuses only the elements
  that it built.

- 9b27286: React Router: push the first navigation from each data router view

  `NativeNavigationDataRouter` navigated the inner memory router and then
  subscribed to it, to wait for the loaders. A route with no loaders settles
  inside the `navigate` call, so the subscriber missed it and the promise never
  settled. The native push never happened.

  Each later navigation resolved the promise of the one before it, so a view
  pushed the previous target and the first tap appeared to do nothing.

  The subscriber is now added before the navigation starts.

- e1c943e: React Router: resolve modals by pathname, and stabilise the navigator

  `findModalConfig` received a full href, with the search string and the hash.
  `pathToRegexp('/modal')` does not match `/modal?x=1`, so an exact-path modal
  config stopped matching as soon as a query string or a hash was present.
  `findModalConfig` now matches the pathname.

  `parsePath` looked for `?` before `#`. For `/a#b?c` it put `?c` into the search,
  and it left `/a#b` as the pathname. It now finds the hash first, as React
  Router's own `parsePath` does.

  `routerProps.navigation || {}` allocated a new object on each render. That
  changed the identity of the navigator, and it rebuilt the duplicate-navigation
  guard around `push` with the guard flag reset, so the guard could fail to hold.
  The navigator now depends on the option fields that it uses.

  The `presentOptions` callback of a modal received the raw state, so a presented
  modal reached the native side without its router tag, and it ignored
  `opts.state`. That callback now receives the same state as the normal push path.

- 958110e: React Router: rebuild the data router when the view path changes

  The inner memory router was built once per view, and it captured the view path.
  A replacing navigation reuses the native view, and it updates the props of that
  view in place, so the component did not unmount. The view kept rendering its
  original route. The router is now keyed on the view path, so a change of path
  disposes the old router, and it builds a new one.

  The loader handoff was a single module value. Navigations in two stacks, or in
  two tabs, overwrote each other. A handoff was also cleared only when a matching
  view claimed it, so a push that failed left an entry behind, and a later
  navigation to the same pathname picked that entry up as stale loader data.
  Handoffs are now keyed by pathname, they expire, and a handoff is discarded when
  its native navigation fails.

- Updated dependencies [7554a3a]
- Updated dependencies [4fe086c]
- Updated dependencies [2aac102]
- Updated dependencies [d284da4]
- Updated dependencies [960f2f7]
- Updated dependencies [8d59dd6]
- Updated dependencies [11ed9d3]
- Updated dependencies [d5370ee]
- Updated dependencies [2900980]
- Updated dependencies [4bae739]
- Updated dependencies [3b0ad26]
- Updated dependencies [93e80b8]
- Updated dependencies [30487c0]
- Updated dependencies [49c6c51]
- Updated dependencies [c5bb825]
- Updated dependencies [9b649ef]
- Updated dependencies [ba74470]
- Updated dependencies [59036a1]
  - capacitor-native-navigation@0.13.0
  - capacitor-native-navigation-react@6.4.3

## 8.2.1

### Patch Changes

- Updated dependencies [3807ca9]
  - capacitor-native-navigation@0.12.1
  - capacitor-native-navigation-react@6.4.2

## 8.2.0

### Minor Changes

- fd719d7: Improve native tab switch performance by using `queueMicrotask` to report view ready

## 8.1.0

### Minor Changes

- d725df7: Add data router support with loader handoff, view ownership, and `dontAwaitLoaders` prop
- d725df7: Add data router support with loader handoff:
  - Support react-router data routers via the `router` prop on `NativeNavigationRouter`
  - Loaders run before native push by default, with loaded data handed off to the new view via `hydrationData` (no double-load)
  - Current view shows `navigation.state === 'loading'` via standard `useNavigation()` while loaders run
  - Add `dontAwaitLoaders` prop to push immediately with `Suspense`/`Await` loading instead
  - Multiple `NativeNavigationRouter` instances can coexist via view ownership tagging

### Patch Changes

- 1d82b67: Wrap web fallback in `BrowserRouter` when native navigation is not available
- 93033a2: Remove debug `console.log` statements and unused `delay` function
- e5b3a90: Adapt hooks to `MessageEventData` `unknown` default generic
- Updated dependencies [06028f0]
- Updated dependencies [9ab9cc2]
- Updated dependencies [4f74a59]
- Updated dependencies [2ce3aa6]
- Updated dependencies [8f13b0b]
- Updated dependencies [abcdf1c]
- Updated dependencies [5d9ad98]
- Updated dependencies [74a8392]
- Updated dependencies [6cd68f5]
- Updated dependencies [255e42f]
- Updated dependencies [8e9f41f]
- Updated dependencies [543dce3]
- Updated dependencies [708d089]
- Updated dependencies [79d2144]
- Updated dependencies [26d91bb]
- Updated dependencies [cfba1eb]
- Updated dependencies [cb6640e]
- Updated dependencies [37421db]
- Updated dependencies [a250fe2]
- Updated dependencies [c968383]
- Updated dependencies [01a3b10]
  - capacitor-native-navigation@0.12.0
  - capacitor-native-navigation-react@6.4.1

## 8.0.0

### Major Changes

- 19688e1: Modal config paths no longer match as prefixes, they now support path-to-regexp

  To retain the old behaviour, add a `*` at the end of your exiting modal paths that need to match as a path prefix.
  The modal config `path` attribute now also supports an array of paths.

### Minor Changes

- 17a7658: Update dependencies
- 7265197: Add support for path params in modal config
- a648a2c: Use react-jsx in TypeScript

### Patch Changes

- Updated dependencies [17a7658]
- Updated dependencies [2781b03]
- Updated dependencies [a648a2c]
  - capacitor-native-navigation@0.11.0
  - capacitor-native-navigation-react@6.4.0

## 7.4.3

### Patch Changes

- Updated dependencies [68d43f2]
  - capacitor-native-navigation@0.10.2
  - capacitor-native-navigation-react@6.3.4

## 7.4.2

### Patch Changes

- Updated dependencies [324bfee]
  - capacitor-native-navigation@0.10.1
  - capacitor-native-navigation-react@6.3.3

## 7.4.1

### Patch Changes

- Updated dependencies [4c3e387]
- Updated dependencies [5fe2132]
- Updated dependencies [51710b7]
- Updated dependencies [d5d87b8]
- Updated dependencies [15aec09]
  - capacitor-native-navigation@0.10.0
  - capacitor-native-navigation-react@6.3.2

## 7.4.0

### Minor Changes

- 7dffc65: Add react-router data router support

### Patch Changes

- b667720: Update peer dependencies to be more lenient
- 8754303: Bump react-router-dom version
- Updated dependencies [b667720]
- Updated dependencies [689da2c]
- Updated dependencies [fd8354d]
  - capacitor-native-navigation@0.9.1
  - capacitor-native-navigation-react@6.3.1

## 7.3.0

### Minor Changes

- 4d4c694: Build to ES2020 so we don't output so many shims
- b16c1c9: No longer output IIFE

  We don't believe anyone needs to use IIFE versions of this library, and they're a pain to maintain with all these global names!

### Patch Changes

- ea0aa14: Fix circular dependency in NativeNavigationRouter
- 3316211: Upgrade dependencies
- Updated dependencies [4d4c694]
- Updated dependencies [b16c1c9]
- Updated dependencies [3316211]
  - capacitor-native-navigation@0.9.0
  - capacitor-native-navigation-react@6.3.0

## 7.2.0

### Minor Changes

- 79e38e8: Rename packages from `@cactuslab` to no scope

### Patch Changes

- Updated dependencies [79e38e8]
  - capacitor-native-navigation@0.8.0
  - capacitor-native-navigation-react@6.2.0

## 7.1.1

### Patch Changes

- db35275: Added blocking actions on routing to prevent double navigations
- Updated dependencies [db35275]
  - capacitor-native-navigation@0.7.5

## 7.1.0

### Minor Changes

- 5d72bb2: Add alias option to replace id for user-specified way to reference components

  This is because allowing the user to specify an actual component id was troublesome
  as it meant the id could be used to present, dismiss and then present again, which
  results in two different component models in the native code that share the same
  component id.

- 660661b: Rename ViewState to StateObject

### Patch Changes

- Updated dependencies [5385d2d]
- Updated dependencies [07e361a]
- Updated dependencies [42ec557]
- Updated dependencies [5d72bb2]
- Updated dependencies [bf30927]
- Updated dependencies [85ac89c]
- Updated dependencies [2b2f1f7]
- Updated dependencies [660661b]
  - capacitor-native-navigation@0.7.0
  - capacitor-native-navigation-react@6.1.0

## 7.1.0-next.0

### Minor Changes

- 5d72bb2: Add alias option to replace id for user-specified way to reference components

  This is because allowing the user to specify an actual component id was troublesome
  as it meant the id could be used to present, dismiss and then present again, which
  results in two different component models in the native code that share the same
  component id.

- 660661b: Rename ViewState to StateObject

### Patch Changes

- Updated dependencies [5385d2d]
- Updated dependencies [07e361a]
- Updated dependencies [42ec557]
- Updated dependencies [5d72bb2]
- Updated dependencies [bf30927]
- Updated dependencies [85ac89c]
- Updated dependencies [660661b]
  - capacitor-native-navigation@0.7.0-next.0
  - capacitor-native-navigation-react@6.1.0-next.0

## 7.0.0

### Major Changes

- eab1bec: Make navigate() function special state values type-safe

  This is a breaking change for existing usage as we've moved these special state values into a name-spaced key inside state.

## 6.0.0

### Patch Changes

- b73eacb: react-router: Forward animated option if it's specified in the state
- Updated dependencies [aa9599f]
- Updated dependencies [63e89de]
- Updated dependencies [ec8aadd]
- Updated dependencies [d88b6ce]
- Updated dependencies [c15bb76]
- Updated dependencies [65b9585]
  - capacitor-native-navigation@0.6.0
  - capacitor-native-navigation-react@6.0.0

## 5.0.0

### Patch Changes

- 718859d: Fire viewReady with a timeout of 1 to allow useLayoutEffects to run and to update native view options
- Updated dependencies [86e67e8]
- Updated dependencies [9842b3f]
- Updated dependencies [3a92a06]
- Updated dependencies [90a909b]
- Updated dependencies [10fe5f1]
- Updated dependencies [991eceb]
  - capacitor-native-navigation@0.5.0
  - capacitor-native-navigation-react@5.0.0

## 4.0.1

### Patch Changes

- 06766a5: Catch errors from dismissing modals
- dfe3463: Prevent viewReady being fired multiple times in development
- Updated dependencies [f2c453a]
- Updated dependencies [136b67d]
- Updated dependencies [4d7405b]
- Updated dependencies [8840a5b]
- Updated dependencies [58c59fa]
- Updated dependencies [7ea0af6]
- Updated dependencies [0af59f1]
- Updated dependencies [209789b]
- Updated dependencies [a18842c]
  - capacitor-native-navigation@0.4.1
  - capacitor-native-navigation-react@4.1.0

## 4.0.0

### Major Changes

- 4d741e8: Move NativeNavigationViews from native-navigation-react to native-navigation-react-router as NativeNavigationRouter
- ea64a47: Change to using React portals from roots.

  This is in order to be able to wrap contexts and providers around the whole application, as you would
  usually do in a React application using routing.

### Minor Changes

- cd866e4: NativeNavigationModel now supports context and fires viewReady correctly
- ed67a32: Upgrade to Capacitor 5 and update other dependencies

### Patch Changes

- 2862c55: Capacitor: Fix peer dependency for Capacitor 5
- 6a76ab3: react-router: Export types with better names
- Updated dependencies [2862c55]
- Updated dependencies [f745451]
- Updated dependencies [bb4fc40]
- Updated dependencies [d17babb]
- Updated dependencies [b6b815d]
- Updated dependencies [bc843cb]
- Updated dependencies [cd866e4]
- Updated dependencies [51cec3b]
- Updated dependencies [7bef20b]
- Updated dependencies [6c144ab]
- Updated dependencies [64a3844]
- Updated dependencies [13a6e92]
- Updated dependencies [52b7329]
- Updated dependencies [ec75c6c]
- Updated dependencies [905e941]
- Updated dependencies [2d8d41d]
- Updated dependencies [4d741e8]
- Updated dependencies [ad8cd03]
- Updated dependencies [72d857c]
- Updated dependencies [d0261dd]
- Updated dependencies [02b0af8]
- Updated dependencies [35f49ff]
- Updated dependencies [ea64a47]
- Updated dependencies [2add2a5]
- Updated dependencies [8cbf96b]
- Updated dependencies [ed67a32]
- Updated dependencies [a83dd7e]
  - capacitor-native-navigation@0.4.0
  - capacitor-native-navigation-react@4.0.0

## 3.0.0

### Patch Changes

- 815da46: Upgrade dependencies
- Updated dependencies [3f25211]
- Updated dependencies [e2706c1]
- Updated dependencies [815da46]
- Updated dependencies [8eb7b84]
- Updated dependencies [f6b3925]
  - capacitor-native-navigation@0.3.0
  - capacitor-native-navigation-react@3.0.0

## 2.0.0

### Patch Changes

- Updated dependencies [07a0376]
- Updated dependencies [e6ef6ea]
- Updated dependencies [1c09146]
- Updated dependencies [c7971af]
  - capacitor-native-navigation@0.2.0
  - capacitor-native-navigation-react@2.0.0

## 1.0.0

### Minor Changes

- a0a7df3: Modal navigation support

### Patch Changes

- Updated dependencies [c901c24]
- Updated dependencies [a0a7df3]
- Updated dependencies [cf84e19]
  - capacitor-native-navigation@0.1.0
  - capacitor-native-navigation-react@1.0.0

## 0.0.8

### Patch Changes

- Updated dependencies [65565e2]
- Updated dependencies [740123c]
  - capacitor-native-navigation@0.0.8

## 0.0.7

### Patch Changes

- 477dbd8: Improve error reporting
- Updated dependencies [1056118]
- Updated dependencies [8a817cd]
- Updated dependencies [fa55c7a]
- Updated dependencies [da0bb70]
- Updated dependencies [fade427]
- Updated dependencies [edc92bf]
- Updated dependencies [4f61d1c]
- Updated dependencies [304ab7a]
- Updated dependencies [2cef744]
- Updated dependencies [5959ada]
- Updated dependencies [718edfe]
- Updated dependencies [99b56d7]
- Updated dependencies [35fd1ce]
  - capacitor-native-navigation@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [d45530c]
- Updated dependencies [e1abe83]
  - capacitor-native-navigation@0.0.6

## 0.0.5

### Patch Changes

- fb4fec9: added target and dismiss to navigation state
- Updated dependencies [51ca1de]
- Updated dependencies [fb4fec9]
  - capacitor-native-navigation@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies [f8ef128]
- Updated dependencies [e66a5a7]
- Updated dependencies [33377b1]
- Updated dependencies [258b8cc]
  - capacitor-native-navigation@0.0.4

## 0.0.3

### Patch Changes

- b6f65c6: Push specifically to the view's containing stack
- fccd7be: Support root state property for root push
- 324870c: Change PushMode from an enum to a string literal
- Updated dependencies [7148148]
- Updated dependencies [08188df]
- Updated dependencies [a035895]
- Updated dependencies [7395386]
- Updated dependencies [06493e9]
- Updated dependencies [2e34b18]
- Updated dependencies [5654446]
- Updated dependencies [00c33e8]
- Updated dependencies [5c463f7]
- Updated dependencies [b877369]
- Updated dependencies [ff0779e]
- Updated dependencies [881a70e]
- Updated dependencies [be55f83]
- Updated dependencies [e739c20]
- Updated dependencies [6981173]
- Updated dependencies [92bfc86]
- Updated dependencies [324870c]
  - capacitor-native-navigation@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [d8075be]
  - capacitor-native-navigation@0.0.2
