---
"capacitor-native-navigation-react-router": patch
---

React Router: register data router routes during render

The registry of data router routes was filled in an effect, and effects run
after the commit. On the first commit, a router with `<Route>` children saw an
empty registry. It claimed every untagged view, including the views of a data
router, and both routers rendered into the same element. Nothing re-rendered to
correct this. A data router that mounted later had the same result.

Routes are now registered during render. A router with `<Route>` children
subscribes to the registry, and it re-evaluates which views it owns when the
registry changes.

A cached view element also held no record of the router that built it, so a
router that took over a view reused the element of the previous owner, with the
children and the router id of that owner. A router now reuses only the elements
that it built.
