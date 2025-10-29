# capacitor-native-navigation-react-router

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
