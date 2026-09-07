---
"capacitor-native-navigation": patch
---

Remove script elements from the view page reliably

Both platforms built the page for a view webview by replacing `<script` with the
start of a comment, and `</script>` with the end of one. That replacement is
case sensitive, so `<SCRIPT` survived and its code still ran. A `-->` inside the
text of a script also closed the injected comment early, which put the rest of
that script back into the page, and corrupted the markup after it.

Script elements are now removed outright, with a case insensitive expression
that spans lines and handles a self-closing tag. The intent of this code is that
no script runs in a view webview, and removing the elements states that
directly.
