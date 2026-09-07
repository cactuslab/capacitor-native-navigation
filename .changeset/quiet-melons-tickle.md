---
"capacitor-native-navigation-react-router": patch
---

React Router: rebuild the data router when the view path changes

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
