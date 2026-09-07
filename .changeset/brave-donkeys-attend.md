---
"capacitor-native-navigation": patch
---

Cancel pending view loads, and report `window.open` failures

`attemptLoad` polls a new window for up to 4.5 seconds, and it had no
cancellation. A `destroyView` event that arrived during the poll removed
nothing, because the id was not registered yet. The poll then registered a view
that the native side had already destroyed, and nothing removed that view again.

We now track the views that we wait on, and we abandon a poll when its view is
destroyed.

A null result from `window.open` was also dropped without a message. We can
never report such a view as ready, and the native side waits for that report, so
we now log the failure.
