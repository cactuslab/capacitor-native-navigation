# capacitor-native-navigation

## 0.13.0

### Minor Changes

- 30487c0: iOS: add the bottom root to the base view controller instead of presenting it

  Capacitor plugins present their own view controllers on `bridge.viewController`,
  which is the base view controller. We presented the bottom root on that same view
  controller. UIKit refuses a presentation on a view controller that already presents
  another one, and it only logs a warning. The plugin's view controller never
  appeared, and the plugin call never resolved and never rejected.

  `@capacitor/camera` shows this problem. The photo picker does not appear, and
  `getPhoto` never returns. `@capacitor/share` has the same problem.

  The bottom root is now a child of the base view controller. Each root above the
  bottom root is presented on the nearest root below it. The base view controller
  presents nothing, so these plugins work again.

  Two behaviours change, because iOS now asks the base view controller rather than
  the root navigation controller:
  - The status bar follows the base view controller. Use `@capacitor/status-bar`, or
    `UIStatusBarStyle` in `Info.plist`, instead of the navigation bar style.
  - The supported orientations follow `UISupportedInterfaceOrientations` in
    `Info.plist`.

  The bottom root also appears and disappears without animation, because a child
  view controller is not presented. The `animated` option still applies to every
  root above it.

### Patch Changes

- 7554a3a: Cancel pending view loads, and report `window.open` failures

  `attemptLoad` polls a new window for up to 4.5 seconds, and it had no
  cancellation. A `destroyView` event that arrived during the poll removed
  nothing, because the id was not registered yet. The poll then registered a view
  that the native side had already destroyed, and nothing removed that view again.

  We now track the views that we wait on, and we abandon a poll when its view is
  destroyed.

  A null result from `window.open` was also dropped without a message. We can
  never report such a view as ready, and the native side waits for that report, so
  we now log the failure.

- 4fe086c: Android: report the four view lifecycle events at four distinct points

  `onPause` sent `viewWillDisappear` and `viewDidDisappear` one after the other,
  and `onResume` sent `viewWillAppear` and `viewDidAppear` one after the other.
  Each pair arrived at the same moment, so the two events carried the same
  meaning. iOS reports four distinct points.

  The events now follow the fragment lifecycle: will appear on start, did appear
  on resume, will disappear on pause, and did disappear on stop.

  Those callbacks also forced the component id, which a fragment does not always
  have. A fragment for a view that is not yet configured has no id, so the forced
  value threw. The callbacks are now null safe.

- 2aac102: iOS: keep the alias map correct, and stop crashing the app at startup

  The map from alias to component was declared with a component id as its key,
  though it is keyed by alias. It also accepted the same alias twice without a
  word, and removing one component then removed the entry that pointed at another,
  still live, component. The key type is corrected, a repeated alias is logged,
  and an alias entry is removed only when it still points at the component that is
  going away.

  Two failures during start up called `fatalError`, which brought down the whole
  host app: a missing webview, and a page that could not be read. Both now log,
  and the plugin degrades instead. The force unwraps that would have crashed on
  that degraded path are guarded as well, so a call reports a real error rather
  than trapping.

- d284da4: Let `popCount` pop the whole stack, on both platforms

  A `push` with a `popCount` larger than the stack depth trapped on both platforms.
  iOS guarded the branch on the stack it started with, but it read the top of the
  copy it had already popped, so `views.last!` crashed. Android removed the last
  entry once per requested pop, so it ran off the end of the list, and it then read
  a negative index in the back stack.

  `popCount` now pops at most the whole stack. When it empties the stack, the view
  that is pushed becomes the whole stack, so `push`, `replace` and `root` all reach
  the same single view. A replace always leaves one view behind to replace, which
  reaches that same state.

- 960f2f7: iOS: require iOS 15, and build the whole plugin in the Xcode project

  The podspec asked for iOS 14, and `Plugin.xcodeproj` asked for iOS 13, but
  Capacitor 8 requires iOS 15. An app that uses this plugin therefore already
  needed iOS 15, so the lower numbers only misreported the real minimum. The
  podspec, the Podfile and the Xcode project now all state iOS 15.

  The Xcode project also compiled only 2 of the 13 Swift files, so `verify:ios`
  could never build. The remaining 11 files are now in the target.

- 8d59dd6: iOS: load bar and tab images off the main thread

  `toImage` read the image with `Data(contentsOf:)` while it ran on the main
  actor. The image address is resolved against the address of the webview, and a
  Capacitor app serves that address from a local server, so every bar button and
  every tab item blocked the user interface on a synchronous request.

  Images now load on a background queue, and they are applied on the main actor
  when they arrive. A cache holds each loaded image by address, scale and tint, so
  a repeated image is applied at once and does not flicker. A failure is logged.

- 11ed9d3: iOS: guard the collection access in `pop`, and always advance in `get`

  `pop` read element zero of the array that `popToRootViewController` returned,
  which traps when that array is empty rather than nil. It also took a slice from
  index one of the views of a stack, and removed the last view, both of which trap
  when the stack holds no views. Each case is now guarded, and reports a result
  with a count of zero.

  `get` walked from a component up through its containers, but it advanced only
  while it recorded the first enclosing stack. Any other container left the walk
  on the same id, and the loop then ran forever on the main thread. The walk now
  advances on every step.

- d5370ee: Android: reject a stack that has no components, rather than crash

  `present` read `components.last()` and `components.first()` on a stack. A stack
  spec always parses to a list, so `components: []` produced an empty list, and
  `last()` threw. The throw happened inside `runOnUiThread`, where nothing caught
  it, so the app crashed and the call never settled. `present` now rejects such a
  stack before it changes any state.

  `present` also inserted the components of a stack a second time. `insertComponent`
  already walks into a stack and merges the container state into each component,
  so the extra pass did the same work twice.

- 2900980: Android: reject a failed call instead of crashing the app

  `dismiss`, `push`, `get`, `update`, `message` and `reset` parsed their options
  inside a `try`, but they called the implementation inside `activity.runOnUiThread`,
  which sits outside that `try`. Any exception from the implementation crashed the
  app, and the plugin call never settled. Each call now rejects with the failure.

  `handleOnStart` also added a webview listener on each start, while
  `handleOnDestroy` removed one only at the end of the activity. The listener
  accumulated across a stop and start cycle, and the plugin then reset itself once
  for each registration on a page load. The listener is now added once.

- 4bae739: Remove script elements from the view page reliably

  Both platforms built the page for a view webview by replacing `<script` with the
  start of a comment, and `</script>` with the end of one. That replacement is
  case sensitive, so `<SCRIPT` survived and its code still ran. A `-->` inside the
  text of a script also closed the injected comment early, which put the rest of
  that script back into the page, and corrupted the markup after it.

  Script elements are now removed outright, with a case insensitive expression
  that spans lines and handles a self-closing tag. The intent of this code is that
  no script runs in a view webview, and removing the elements states that
  directly.

- 3b0ad26: Android: report console output from the webviews we create

  Each view uses its own `WebView`, and those webviews had no `WebChromeClient`, so
  their console messages were dropped. They now log under the `Capacitor/Console`
  tag, prefixed with the id of the view that produced them.

- 93e80b8: iOS: clear the flag that marks a view webview as out of date

  `path` and `state` set `webViewNeedsUpdate`, and nothing cleared it. After the
  first update of a view, every later call sent another `updateView` event, and
  waited for the view to report itself ready again, even when nothing had changed.
  The flag is now cleared once the event carries the current path and state, so a
  change that arrives while the view is still preparing marks the view again.

  `createOpdateWebView` is renamed to `createOrUpdateWebView`.

- 49c6c51: Android: destroy the webview of a view that is destroyed

  `shouldOverrideLoad` removed a webview from the cache as soon as that view
  loaded, and `reset` destroyed only the webviews that were still in the cache.
  Every webview that actually loaded was therefore leaked, together with its
  render process. `cleanUpComponentWithId` dropped the live data for a component
  but never destroyed its webview either.

  A second registry now holds every webview by component id.
  `notifyDestroyView` destroys the webview of that component, and `reset` destroys
  the rest. A webview is detached from its parent, on the main thread, before it
  is destroyed.

- c5bb825: Android: repair the standalone plugin build

  `verify:android` failed before it compiled anything. The Gradle wrapper pinned
  7.4.2, and the Android Gradle plugin needs 8.9. The wrapper is now 8.9, matching
  the example app.

  `build.gradle` also now supplies defaults for `androidxActivityVersion`,
  `androidxFragmentVersion` and `androidxWebkitVersion`. An app project sets these
  in `variables.gradle`, so only a standalone build sees the defaults.

- 9b649ef: Android: push to a presented view that has no target

  When the presented root is a single view, rather than a stack, `push` compared
  the target with the context id. A `push` with no target took the other branch,
  which set the current id to `null`, and the call rejected with "There is no
  current view to replace". The branch for a stack already handled a target that
  is null or blank. The branch for a view now does the same.

  That branch also inserted the component without its container, so the state of
  the container was not merged into it. It now passes the container, as the branch
  for a stack does.

- 59036a1: Android: return a real `PopResult` from `pop`

  `pop` resolved with no result at all, and it ignored both `count` and `stack`.
  It always popped one entry from the top navigation context, through the back
  pressed dispatcher.

  The declared result is `PopResult { stack, count, id }`, and callers rely on it.
  `useNativeNavigationNavigator` in `capacitor-native-navigation-react-router`
  tests `result.count === 0` to decide whether to dismiss a modal when a stack has
  nothing left to pop. On Android that test compared `undefined` with `0`, so the
  modal never dismissed.

  `pop` now takes `PopOptions`, it pops `count` entries from the stack that
  `stack` names, and it resolves the stack id, the number of entries popped, and
  the id of the last entry popped. When there is nothing to pop it reports
  `count: 0`, as iOS does, and it leaves the decision to the caller.

  Android replays the animation that each view declared when it was pushed, so
  `animated` cannot change a pop animation. `pop` states this in a comment.

## 0.12.1

### Patch Changes

- 3807ca9: Fix Android compile issue

## 0.12.0

### Minor Changes

- 37421db: Implement Android tabs support using `BottomNavigationView` with dynamic menu items and tab switching
- a250fe2: Implement iOS tabs support with `UITabBarController`, tab bar items with titles/images/badges
- c968383: Implement iOS 26 `UITab` API for correct Liquid Glass tab bar layout
- 01a3b10: Implement tab badge/title/image updates via `updateTab`

### Patch Changes

- 06028f0: Fix: add max retry limit to `attemptLoad` polling loop
- 9ab9cc2: Fix: clear view binding references in `onDestroyView`
- 4f74a59: Fix: `UIColor.toHex()` crash on grayscale colors
- 2ce3aa6: Fix: nil out `CaptureDataURLSchemeTask` continuation after resume to prevent double resume
- 8f13b0b: Fix: use optional chaining for weak `plugin` reference in `deinit`
- abcdf1c: Fix: replace `fatalError` with logging in UIKit delegate callbacks
- 5d9ad98: Fix: replace force-unwraps with safe access to prevent crashes
- 74a8392: Fix: remove early `return null` in `lastDestination` and fix NPE in `matchDestinations`
- 255e42f: Fix: use unique IDs for menu items instead of `String.hashCode()`
- 8e9f41f: Fix: use `unknown` instead of `any` for `MessageEventData` default generic
- 543dce3: Fix: clear component maps and destroy WebViews on `reset()`
- 708d089: Fix: break retain cycle in `NativeNavigationWebViewDelegate` by using weak references
- 79d2144: Fix: set tab bar items after assigning viewControllers to `UITabBarController`
- 26d91bb: Fix: `TabsSpec` type check validates against `STACK` instead of `TABS`
- cfba1eb: Fix: capture `self` weakly in UIAction closure to prevent retain cycle
- cb6640e: Fix: wrap `update()` plugin method in `Task` for main actor dispatch

## 0.11.0

### Minor Changes

- 17a7658: Update dependencies

### Patch Changes

- 2781b03: Fix: Android 15 compatiblity warning about incorrect usage of removeLast

## 0.10.2

### Patch Changes

- 68d43f2: Fix: Running media no longer requires user gestures on Android

## 0.10.1

### Patch Changes

- 324bfee: iOS: Introduced option to prevent bounce scrolling on the webview.

## 0.10.0

### Minor Changes

- 5fe2132: Improved android toolbar behaviour

### Patch Changes

- 4c3e387: ios: Carry capacitor configurations into the Native Navigation webview
- 51710b7: iOS: Apply button color to the Back button arrow
- d5d87b8: Android: Use animated changes when updating the status bar color
- 15aec09: android: fixed jvm and kotlin toolchain inconsistency

## 0.9.1

### Patch Changes

- b667720: Update peer dependencies to be more lenient
- 689da2c: Fix plugin Podspec name

## 0.9.0

### Minor Changes

- 4d4c694: Build to ES2020 so we don't output so many shims
- b16c1c9: No longer output IIFE

  We don't believe anyone needs to use IIFE versions of this library, and they're a pain to maintain with all these global names!

### Patch Changes

- 3316211: Upgrade dependencies

## 0.8.0

### Minor Changes

- 79e38e8: Rename packages from `@cactuslab` to no scope

## 0.7.6

### Patch Changes

- 44836f5: Android: Fix race condition on resuming from background with a reset UI

## 0.7.5

### Patch Changes

- db35275: Added blocking actions on routing to prevent double navigations

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
