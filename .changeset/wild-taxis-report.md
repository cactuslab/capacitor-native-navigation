---
"capacitor-native-navigation": patch
---

Android: return a real `PopResult` from `pop`

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
