---
"capacitor-native-navigation": patch
---

Let `popCount` pop the whole stack, on both platforms

A `push` with a `popCount` larger than the stack depth trapped on both platforms.
iOS guarded the branch on the stack it started with, but it read the top of the
copy it had already popped, so `views.last!` crashed. Android removed the last
entry once per requested pop, so it ran off the end of the list, and it then read
a negative index in the back stack.

`popCount` now pops at most the whole stack. When it empties the stack, the view
that is pushed becomes the whole stack, so `push`, `replace` and `root` all reach
the same single view. A replace always leaves one view behind to replace, which
reaches that same state.
