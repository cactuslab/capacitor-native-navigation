# @cactuslab/native-navigation

## 0.7.4

### Patch Changes

- 6b0e760: iOS: Fix race condition on pushing multiple times during animation

## 0.7.3

### Patch Changes

- 130b7ea: native: added support for disabling tint of image buttons

## 0.7.2

### Patch Changes

- 4b788f9: Updated readme to be clearer about push/pop and present/dismiss
- 2e6f739: native: Improved fallback support for BarSpec so that a color can be changed without clearing the font

## 0.7.1

### Patch Changes

- 2822ca6: Android: Fix statusbar color and bar settings
- b591bb0: Android: Fix broken dismiss on aliased modals

## 0.7.0

### Minor Changes

- 5385d2d: Rename ComponentOptions to ComponentUpdate
- 42ec557: Add state to Stack and Tab specs, which get combined with View state
- 5d72bb2: Add alias option to replace id for user-specified way to reference components

  This is because allowing the user to specify an actual component id was troublesome
  as it meant the id could be used to present, dismiss and then present again, which
  results in two different component models in the native code that share the same
  component id.

- bf30927: Fix race condition between dismiss followed by present where the component still existed until the dismiss complete
- 85ac89c: Simplified and standardised leftItems behaviour.
- 660661b: Rename ViewState to StateObject

### Patch Changes

- 07e361a: Android: added support for hardware back button interruption
- 2b2f1f7: iOS: add missing combined state for updateView

## 0.7.0-next.1

### Patch Changes

- 2ca090e: iOS: add missing combined state for updateView

## 0.7.0-next.0

### Minor Changes

- 5385d2d: Rename ComponentOptions to ComponentUpdate
- 42ec557: Add state to Stack and Tab specs, which get combined with View state
- 5d72bb2: Add alias option to replace id for user-specified way to reference components

  This is because allowing the user to specify an actual component id was troublesome
  as it meant the id could be used to present, dismiss and then present again, which
  results in two different component models in the native code that share the same
  component id.

- bf30927: Fix race condition between dismiss followed by present where the component still existed until the dismiss complete
- 85ac89c: Simplified and standardised leftItems behaviour.
- 660661b: Rename ViewState to StateObject

### Patch Changes

- 07e361a: Android: added support for hardware back button interruption

## 0.6.5

### Patch Changes

- 726f2e9: iOS: Use backwards compatible setInspectable on webview

## 0.6.4

### Patch Changes

- c576b65: iOS: Crash fixed - Re-presentation of modals when lower modal is dismissed

## 0.6.3

### Patch Changes

- c991ca8: android: prepend left items to right items so that they show in the menu

## 0.6.2

### Patch Changes

- 5203797: iOS: Use capacitor setting for webView inspectable

## 0.6.1

### Patch Changes

- 9f72a06: iOS: Added option to hide the shadow on a navigation bar

## 0.6.0

### Minor Changes

- ec8aadd: Allow dismiss to be called on a non-root component
- d88b6ce: iOS: implement own support for alert, confirm, input / prompt to work around crashes when we have presented multiple view controllers

### Patch Changes

- aa9599f: iOS: to find unpresented view controllers as top component
- c15bb76: Android: fix status bar color when navigating back

## 0.5.0

### Minor Changes

- 3a92a06: iOS: ensure roots are presented in the correct order
- 10fe5f1: iOS: use model of presented views rather than which is actually presented

### Patch Changes

- 86e67e8: iOS: save and restore UIAdaptivePresentationControllerDelegate
- 9842b3f: iOS: fix dismissal of a root that isn't top
- 991eceb: Android: handle modals race condition.

## 0.4.1

### Patch Changes

- f2c453a: Fix error presenting a view with stackItems
- 8840a5b: iOS: fix race conditions in push()
- 58c59fa: Improve error message when viewReady is fired multiple times
- 0af59f1: iOS: resolve race condition between dismiss and finding the top component
- 209789b: android: Fix issue with missing strings xml
- a18842c: iOS: fix ComponentModel memory leak

## 0.4.0

### Minor Changes

- bb4fc40: iOS: use present and dismiss callbacks
- b6b815d: iOS: present API waits for animated components to appear before resolving
- bc843cb: iOS: remove one-at-a-time plugin API limitation
- 6c144ab: Paths are now optional for ViewSpec
- 905e941: iOS: fix race conditions between present and dismiss
- 2d8d41d: iOS: wait for animated and non-animated presents to complete
- 72d857c: iOS: manager for root view controllers
- 35f49ff: iOS: support dismissing a component that has itself presented components
- ed67a32: Upgrade to Capacitor 5 and update other dependencies

### Patch Changes

- 2862c55: Capacitor: Fix peer dependency for Capacitor 5
- f745451: Fix fault dismissing non-modal view controller
- 51cec3b: iOS: fix race condition on dismissing
- 7bef20b: Remove subview roots
- 13a6e92: Add title back to ViewSpec
- 52b7329: iOS: only animate the dismiss if it was the topmost controller
- ec75c6c: Android: Allow path to be optional on ViewSpec
- d0261dd: Allow modals to be presented without a root view
- 2add2a5: iOS: Resolve reset race condition
- a83dd7e: iOS: Fix delete of web view to occur after the view controller is dismissed

## 0.3.1

### Patch Changes

- ad0c767: Android: Fix font lookup to replace dash with underscore
- e0dc757: Export AnyComponentSpec

## 0.3.0

### Minor Changes

- 3f25211: iOS: Resolve race condition on model updates

### Patch Changes

- e2706c1: Remove unnecessary react dependencies
- f6b3925: Android: Properly decode and apply the scale to an image

## 0.2.0

### Minor Changes

- 07a0376: feature: Added support for disabling system back action on stack
- e6ef6ea: Android: Added support for 'update' and viewWillAppear etc

### Patch Changes

- c7971af: Removed need for patching capacitor

## 0.1.2

### Patch Changes

- 580c084: Address listeners not being removed by ensuring that we only forward to the bridge navigation on the main webview

## 0.1.1

### Patch Changes

- b1f43c4: iOS Fix issue where screen goes blank on a partial swipe back

## 0.1.0

### Minor Changes

- c901c24: Modals: Allow option to prevent system gestures for dismissing
- a0a7df3: Modal navigation support
- cf84e19: toolbar: Added ability to set visibility of bars using update

## 0.0.8

### Patch Changes

- 65565e2: iOS: change approach for finding our UIWindow

  The original method was devised when we removed Capacitor's `WKWebView` from the view
  hierarchy, which we don't do anymore, and breaks when things like system PIN prompts
  take over the UI.

- 740123c: android: Fixed callback removal

## 0.0.7

### Patch Changes

- 1056118: iOS: fix resetting of the plugin for iframe loads
- 8a817cd: iOS: include logging and error reporting
- fa55c7a: iOS: Fix handling of tel and mailto links in our views and improve reset behaviour
- da0bb70: android: support for handling of external links
- fade427: android: Fixed opening urls from capacitor host
- edc92bf: iOS: use new namespacing of window.open to better identify our URL requests
- 4f61d1c: Remove view key from GetResult
- 304ab7a: android: Added support for transparent title bars. Introduces new variable --native-navigation-inset-top to allow the application to inject insets.
- 2cef744: Move plugin reset to native to solve resetting our UI if the app navigates to a new URL in the Capacitor webview
- 5959ada: iOS: fix loading of HTML in production
- 718edfe: android: Fixed toolbar back button to invoke the expected back action
- 99b56d7: android: Support for the capacitor specific namespaced urls
- 35fd1ce: Namespace window.open paths

## 0.0.6

### Patch Changes

- d45530c: Add isNativeNavigationAvailable
- e1abe83: iOS: fix flashing of bar items during a replace

## 0.0.5

### Patch Changes

- 51ca1de: Added support for custom fonts and icons in the toolbar
- fb4fec9: added target and dismiss to navigation state

## 0.0.4

### Patch Changes

- f8ef128: iOS: Fix stack bar styling
- e66a5a7: iOS: fix stack bar handling re background colours and scrollEdgeAppearance
- 33377b1: Reworked push and present on Android to match documented behaviour
- 258b8cc: Added support for Get request on Android

## 0.0.3

### Patch Changes

- 7148148: iOS: simplify and standardise finding of views
- 08188df: Replace `setRoot` with `present` as they do basically equivalent things
- a035895: android: Added stable support for pushing and popping on stacks with title options.
- 7395386: Rework asynchronous creation of views to resolve setRoot + immediate push race condition
- 06493e9: Add support for pushing to a non-stack view
- 2e34b18: Don't call reset automatically on web
- 5654446: Add updateView event to use to replace current webview's content
- 00c33e8: iOS: fix styling of navigation bar scroll edge appearance
- 5c463f7: iOS: Synchronous asychronous operations to avoid creation race conditions
- b877369: Include containing stack id in data sent to views
- ff0779e: Change get() method to return more contextual information
- 881a70e: iOS: move NativeNavigationViewController into its own file finally
- be55f83: Fix back button image colour
- e739c20: Fix reset after change to child view controllers
- 6981173: Track root stack so we can identify current root before it's presented
- 92bfc86: iOS: fix reset for modals
- 324870c: Change PushMode from an enum to a string literal

## 0.0.2

### Patch Changes

- d8075be: Fix package to include podspec
