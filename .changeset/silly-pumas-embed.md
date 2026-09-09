---
"capacitor-native-navigation": minor
---

iOS: add the bottom root to the base view controller instead of presenting it

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
