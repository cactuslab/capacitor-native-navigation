# @cactuslab/native-navigation

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
