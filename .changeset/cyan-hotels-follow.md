---
"capacitor-native-navigation": patch
---

iOS: keep the alias map correct, and stop crashing the app at startup

The map from alias to component was declared with a component id as its key,
though it is keyed by alias. It also accepted the same alias twice without a
word, and removing one component then removed the entry that pointed at another,
still live, component. The key type is corrected, a repeated alias is logged,
and an alias entry is removed only when it still points at the component that is
going away.

Two failures during start up called `fatalError`, which brought down the whole
host app: a missing webview, and a page that could not be read. Both now log,
and the plugin degrades instead. The force unwraps that would have crashed on
that degraded path are guarded as well, so a call reports a real error rather
than trapping.
