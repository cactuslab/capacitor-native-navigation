---
"capacitor-native-navigation-react-router": patch
---

React Router: resolve modals by pathname, and stabilise the navigator

`findModalConfig` received a full href, with the search string and the hash.
`pathToRegexp('/modal')` does not match `/modal?x=1`, so an exact-path modal
config stopped matching as soon as a query string or a hash was present.
`findModalConfig` now matches the pathname.

`parsePath` looked for `?` before `#`. For `/a#b?c` it put `?c` into the search,
and it left `/a#b` as the pathname. It now finds the hash first, as React
Router's own `parsePath` does.

`routerProps.navigation || {}` allocated a new object on each render. That
changed the identity of the navigator, and it rebuilt the duplicate-navigation
guard around `push` with the guard flag reset, so the guard could fail to hold.
The navigator now depends on the option fields that it uses.

The `presentOptions` callback of a modal received the raw state, so a presented
modal reached the native side without its router tag, and it ignored
`opts.state`. That callback now receives the same state as the normal push path.
