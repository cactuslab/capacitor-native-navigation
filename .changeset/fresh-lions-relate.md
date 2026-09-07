---
"capacitor-native-navigation": patch
---

iOS: load bar and tab images off the main thread

`toImage` read the image with `Data(contentsOf:)` while it ran on the main
actor. The image address is resolved against the address of the webview, and a
Capacitor app serves that address from a local server, so every bar button and
every tab item blocked the user interface on a synchronous request.

Images now load on a background queue, and they are applied on the main actor
when they arrive. A cache holds each loaded image by address, scale and tint, so
a repeated image is applied at once and does not flicker. A failure is logged.
