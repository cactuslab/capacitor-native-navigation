---
"capacitor-native-navigation-react": patch
---

React: copy stylesheet rules into new windows through the DOM

Emotion, which styles MUI and react-select, adds its rules with `insertRule` in
production, so the `<style>` element it puts in the head stays empty. We copied
those rules into each view window through the CSSOM of that window.

That does not work. A window's `document.styleSheets` does not hold a `<style>`
element we copied in until some time after we add it, so
`findMatchingStyleSheet` returned nothing and the rules went nowhere. Rules
added later hit the same problem and were lost for good, and the failed copies
also produced `IndexSizeError` warnings, because we passed the rule index from
the main window straight through to a copy that held fewer rules.

The first view kept its styles. Every view after it lost all of them.

We now copy the rules as text. `copyOfHeadNode` fills an empty `<style>` element
from the rules it holds, and each new rule is added to the text of the copy
instead of to its stylesheet. Rules are batched into a microtask, so a window
parses its stylesheet once per task rather than once per rule. A stylesheet with
no owner element no longer throws either.
