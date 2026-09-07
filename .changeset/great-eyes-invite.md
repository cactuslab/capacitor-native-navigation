---
"capacitor-native-navigation": patch
---

iOS: guard the collection access in `pop`, and always advance in `get`

`pop` read element zero of the array that `popToRootViewController` returned,
which traps when that array is empty rather than nil. It also took a slice from
index one of the views of a stack, and removed the last view, both of which trap
when the stack holds no views. Each case is now guarded, and reports a result
with a count of zero.

`get` walked from a component up through its containers, but it advanced only
while it recorded the first enclosing stack. Any other container left the walk
on the same id, and the loop then ran forever on the main thread. The walk now
advances on every step.
