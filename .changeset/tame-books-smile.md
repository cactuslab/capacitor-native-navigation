---
"capacitor-native-navigation": patch
---

Android: push to a presented view that has no target

When the presented root is a single view, rather than a stack, `push` compared
the target with the context id. A `push` with no target took the other branch,
which set the current id to `null`, and the call rejected with "There is no
current view to replace". The branch for a stack already handled a target that
is null or blank. The branch for a view now does the same.

That branch also inserted the component without its container, so the state of
the container was not merged into it. It now passes the container, as the branch
for a stack does.
