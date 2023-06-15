# @cactuslab/native-navigation-react

## 6.1.0

### Minor Changes

- 5d72bb2: Add alias option to replace id for user-specified way to reference components

  This is because allowing the user to specify an actual component id was troublesome
  as it meant the id could be used to present, dismiss and then present again, which
  results in two different component models in the native code that share the same
  component id.

### Patch Changes

- Updated dependencies [5385d2d]
- Updated dependencies [07e361a]
- Updated dependencies [42ec557]
- Updated dependencies [5d72bb2]
- Updated dependencies [bf30927]
- Updated dependencies [85ac89c]
- Updated dependencies [2b2f1f7]
- Updated dependencies [660661b]
  - @cactuslab/native-navigation@0.7.0

## 6.1.0-next.0

### Minor Changes

- 5d72bb2: Add alias option to replace id for user-specified way to reference components

  This is because allowing the user to specify an actual component id was troublesome
  as it meant the id could be used to present, dismiss and then present again, which
  results in two different component models in the native code that share the same
  component id.

### Patch Changes

- Updated dependencies [5385d2d]
- Updated dependencies [07e361a]
- Updated dependencies [42ec557]
- Updated dependencies [5d72bb2]
- Updated dependencies [bf30927]
- Updated dependencies [85ac89c]
- Updated dependencies [660661b]
  - @cactuslab/native-navigation@0.7.0-next.0

## 6.0.0

### Patch Changes

- 63e89de: navigation: Fix issue where modal is closed natively and remove listener missed it
- 65b9585: Fix fault where a modal that never fired viewReady would never be dismissed
- Updated dependencies [aa9599f]
- Updated dependencies [ec8aadd]
- Updated dependencies [d88b6ce]
- Updated dependencies [c15bb76]
  - @cactuslab/native-navigation@0.6.0

## 5.0.0

### Minor Changes

- 90a909b: Add ViewUpdate as an optional parameter to `useNativeNavigationViewContext`

### Patch Changes

- Updated dependencies [86e67e8]
- Updated dependencies [9842b3f]
- Updated dependencies [3a92a06]
- Updated dependencies [10fe5f1]
- Updated dependencies [991eceb]
  - @cactuslab/native-navigation@0.5.0

## 4.1.0

### Minor Changes

- 4d7405b: Add open and onClose to NativeNavigationModal

### Patch Changes

- 136b67d: Catch errors from viewReady plugin call
- 7ea0af6: Context dismiss function doesn't require options
- Updated dependencies [f2c453a]
- Updated dependencies [8840a5b]
- Updated dependencies [58c59fa]
- Updated dependencies [0af59f1]
- Updated dependencies [209789b]
- Updated dependencies [a18842c]
  - @cactuslab/native-navigation@0.4.1

## 4.0.0

### Major Changes

- 4d741e8: Move NativeNavigationViews from native-navigation-react to native-navigation-react-router as NativeNavigationRouter
- ea64a47: Change to using React portals from roots.

  This is in order to be able to wrap contexts and providers around the whole application, as you would
  usually do in a React application using routing.

### Minor Changes

- cd866e4: NativeNavigationModel now supports context and fires viewReady correctly
- 02b0af8: Add debounce to NativeNavigationModal
- ed67a32: Upgrade to Capacitor 5 and update other dependencies

### Patch Changes

- 2862c55: Capacitor: Fix peer dependency for Capacitor 5
- d17babb: Add animated and cancellable to NativeNavigationModal
- 64a3844: native-navigation-modal: Handle native navigation api errors
- ad8cd03: Fix development remount fault in NativeNavigationModal
- 8cbf96b: Fire viewReady when NativeNavigationViews first mounts
- Updated dependencies [2862c55]
- Updated dependencies [f745451]
- Updated dependencies [bb4fc40]
- Updated dependencies [b6b815d]
- Updated dependencies [bc843cb]
- Updated dependencies [51cec3b]
- Updated dependencies [7bef20b]
- Updated dependencies [6c144ab]
- Updated dependencies [13a6e92]
- Updated dependencies [52b7329]
- Updated dependencies [ec75c6c]
- Updated dependencies [905e941]
- Updated dependencies [2d8d41d]
- Updated dependencies [72d857c]
- Updated dependencies [d0261dd]
- Updated dependencies [35f49ff]
- Updated dependencies [2add2a5]
- Updated dependencies [ed67a32]
- Updated dependencies [a83dd7e]
  - @cactuslab/native-navigation@0.4.0

## 3.1.0

### Minor Changes

- ebcc558: Add useNativeNavigationView hook to support portaling
- 7e78dd6: Add NativeNavigationModal component

### Patch Changes

- Updated dependencies [ad0c767]
- Updated dependencies [e0dc757]
  - @cactuslab/native-navigation@0.3.1

## 3.0.0

### Minor Changes

- 8eb7b84: Fix race condition when removing plugin listeners before the addListener Promise completes

### Patch Changes

- 815da46: Upgrade dependencies
- Updated dependencies [3f25211]
- Updated dependencies [e2706c1]
- Updated dependencies [f6b3925]
  - @cactuslab/native-navigation@0.3.0

## 2.0.0

### Minor Changes

- 1c09146: Context always wants ViewOptions

### Patch Changes

- Updated dependencies [07a0376]
- Updated dependencies [e6ef6ea]
- Updated dependencies [c7971af]
  - @cactuslab/native-navigation@0.2.0

## 1.0.0

### Minor Changes

- a0a7df3: Modal navigation support

### Patch Changes

- Updated dependencies [c901c24]
- Updated dependencies [a0a7df3]
- Updated dependencies [cf84e19]
  - @cactuslab/native-navigation@0.1.0

## 0.0.9

### Patch Changes

- da2dc51: Support copying CSSStyleSheet.insertRule actions between native windows to support Emotion in production
- Updated dependencies [65565e2]
- Updated dependencies [740123c]
  - @cactuslab/native-navigation@0.0.8

## 0.0.8

### Patch Changes

- 477dbd8: Improve error reporting
- 1b2463c: setOptions gets specific component id support
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
  - @cactuslab/native-navigation@0.0.7

## 0.0.7

### Patch Changes

- Updated dependencies [d45530c]
- Updated dependencies [e1abe83]
  - @cactuslab/native-navigation@0.0.6

## 0.0.6

### Patch Changes

- Updated dependencies [51ca1de]
- Updated dependencies [fb4fec9]
  - @cactuslab/native-navigation@0.0.5

## 0.0.5

### Patch Changes

- b11eb70: Provide a default context to make it easier to use context
- Updated dependencies [f8ef128]
- Updated dependencies [e66a5a7]
- Updated dependencies [33377b1]
- Updated dependencies [258b8cc]
  - @cactuslab/native-navigation@0.0.4

## 0.0.4

### Patch Changes

- 9b285f1: Fix adding of sentinel to new windows
- 6933f34: Improve copying head nodes to new windows
- 520c98a: Native React context no longer throws errors on web platform
- 5654446: Add updateView event to use to replace current webview's content
- bb9dbd9: Support syncing head nodes that have an unknown sibling
- 0851d48: Make a view's stack id available
- 364955d: Sync updated nodes to other views
- a4b2f23: NativeNavigationContext now optional to avoid generating errors on the web
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
  - @cactuslab/native-navigation@0.0.3

## 0.0.3

### Patch Changes

- c5bd5ba: Synchronise elements added to the head to the new webviews

  This provides compatibility with libraries such as `emotion` that dynamically add `<style>` elements to the `<head>`.

## 0.0.2

### Patch Changes

- Updated dependencies [d8075be]
  - @cactuslab/native-navigation@0.0.2
