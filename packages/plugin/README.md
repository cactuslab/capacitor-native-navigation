# Capacitor Native Navigation Plugin

Native navigation for Capacitor apps.

This package provides a [Capacitor](https://capacitorjs.com/) plugin for controlling native navigation UI from a React DOM app.

Please see the root of this repository for a discussion of how to use this plugin.

## Install

```bash
npm install @cactuslab/native-navigation
npx cap sync
```

## API

<docgen-index>

* [`present(...)`](#present)
* [`dismiss(...)`](#dismiss)
* [`push(...)`](#push)
* [`pop(...)`](#pop)
* [`update(...)`](#update)
* [`reset(...)`](#reset)
* [`get(...)`](#get)
* [`message(...)`](#message)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### present(...)

```typescript
present(options: PresentOptions) => Promise<PresentResult>
```

Present a new native UI.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#presentoptions">PresentOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#presentresult">PresentResult</a>&gt;</code>

--------------------


### dismiss(...)

```typescript
dismiss(options?: DismissOptions | undefined) => Promise<DismissResult>
```

Dismiss a native UI. The component id may be a component that was previously presented or
a component within a previously presented component.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#dismissoptions">DismissOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#dismissresult">DismissResult</a>&gt;</code>

--------------------


### push(...)

```typescript
push(options: PushOptions) => Promise<PushResult>
```

Push a new component onto a stack, or replace an existing component.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code><a href="#pushoptions">PushOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#pushresult">PushResult</a>&gt;</code>

--------------------


### pop(...)

```typescript
pop(options: PopOptions) => Promise<PopResult>
```

Pop the top component off a stack

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`options`** | <code><a href="#popoptions">PopOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#popresult">PopResult</a>&gt;</code>

--------------------


### update(...)

```typescript
update(options: UpdateOptions) => Promise<void>
```

Set the options for an existing component

| Param         | Type                                                    |
| ------------- | ------------------------------------------------------- |
| **`options`** | <code><a href="#updateoptions">UpdateOptions</a></code> |

--------------------


### reset(...)

```typescript
reset(options?: ResetOptions | undefined) => Promise<void>
```

Remove all of the native UI and reset back to the root Capacitor webview.

| Param         | Type                                                  |
| ------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#resetoptions">ResetOptions</a></code> |

--------------------


### get(...)

```typescript
get(options?: GetOptions | undefined) => Promise<GetResult>
```

Get the spec and context of a component

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`options`** | <code><a href="#getoptions">GetOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#getresult">GetResult</a>&gt;</code>

--------------------


### message(...)

```typescript
message<D>(options: MessageOptions<D>) => Promise<void>
```

Send a message to a component.

| Param         | Type                                                               |
| ------------- | ------------------------------------------------------------------ |
| **`options`** | <code><a href="#messageoptions">MessageOptions</a>&lt;D&gt;</code> |

--------------------


### Interfaces


#### PresentResult

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### PresentOptions

| Prop              | Type                                                            | Description                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`component`**   | <code><a href="#anycomponentspec">AnyComponentSpec</a></code>   | The component to present.                                                                                                                                                |
| **`style`**       | <code><a href="#presentationstyle">PresentationStyle</a></code> | The presentation style. Defaults to `'fullScreen'`                                                                                                                       |
| **`cancellable`** | <code>boolean</code>                                            | Whether to allow the user to use system gestures or the back button to unwind the presentation. Useful to prevent the accidental dismissal of a form. Defaults to `true` |
| **`animated`**    | <code>boolean</code>                                            | Whether to animate the presenting. Defaults to `true`                                                                                                                    |


#### StackSpec

| Prop             | Type                                                | Description                                                                 |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| **`type`**       | <code>'stack'</code>                                |                                                                             |
| **`components`** | <code>ViewSpec[]</code>                             |                                                                             |
| **`bar`**        | <code><a href="#barspec">BarSpec</a></code>         |                                                                             |
| **`title`**      | <code>string</code>                                 |                                                                             |
| **`state`**      | <code><a href="#stateobject">StateObject</a></code> | State that will be mixed into the state of each of the contained components |


#### ViewSpec

| Prop            | Type                                                    | Description                                                                                                                                                 |
| --------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`type`**      | <code>'view'</code>                                     |                                                                                                                                                             |
| **`path`**      | <code>string</code>                                     | The path representing the view.                                                                                                                             |
| **`state`**     | <code><a href="#stateobject">StateObject</a></code>     |                                                                                                                                                             |
| **`title`**     | <code>string</code>                                     | The title is shown in the title bar when the view is shown in a stack. Titles may also be used in other ways by the native environment and are a good idea. |
| **`stackItem`** | <code><a href="#stackitemspec">StackItemSpec</a></code> | Options for when the component is used in a stack                                                                                                           |
| **`android`**   | <code>{ backButtonId?: string; }</code>                 | Options for Android specific features                                                                                                                       |


#### StackItemSpec

| Prop             | Type                                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`backItem`**   | <code><a href="#stackbarbuttonitem">StackBarButtonItem</a></code> | The back item used when this stack item is on the back stack. This is only currently used by iOS as Android will show an arrow with no title if back is enabled                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **`leftItems`**  | <code>StackBarButtonItem[]</code>                                 | Setting any value to leftItems will disable the navigation back buttons on both iOS and Android. (Android hardware back button is not affected). iOS: items will show on the left side of the navigation bar replacing the back button. The swipe back gesture will be disabled. Android: Toolbars have support for only a single image-button on the left. If the first item has an image then the toolbar will insert this item left of the title replacing the default back button if there would have been one. The remaining left items will appear on the right of the toolbar ahead of any right items. |
| **`rightItems`** | <code>StackBarButtonItem[]</code>                                 | Right items will show on the rightmost edge of the navigation bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **`bar`**        | <code><a href="#barspec">BarSpec</a></code>                       | Customise the bar on top of the default options provided by the stack                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |


#### StackBarButtonItem

| Prop          | Type                                                         | Description                                                                     |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **`id`**      | <code><a href="#buttonid">ButtonId</a></code>                |                                                                                 |
| **`title`**   | <code>string</code>                                          | A title for the button or context for a screen reader if the button has an icon |
| **`image`**   | <code><a href="#imagespec">ImageSpec</a></code>              | If image is present then the title will be replaced by the image                |
| **`android`** | <code>{ image?: <a href="#imagespec">ImageSpec</a>; }</code> | Custom options for Android specific behaviours                                  |


#### ImageObject

| Prop        | Type                | Description                                                                                                                                                         |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`uri`**   | <code>string</code> | The uri for the image.                                                                                                                                              |
| **`scale`** | <code>number</code> | The scale to use for the image, e.g. 2 for a 2x scale image. If not provided the scale will be determined automatically from the filename, or it will default to 1. |


#### BarSpec

| Prop             | Type                                              |
| ---------------- | ------------------------------------------------- |
| **`background`** | <code><a href="#fillspec">FillSpec</a></code>     |
| **`title`**      | <code><a href="#labelspec">LabelSpec</a></code>   |
| **`buttons`**    | <code><a href="#labelspec">LabelSpec</a></code>   |
| **`visible`**    | <code>boolean</code>                              |
| **`iOS`**        | <code><a href="#barspecios">BarSpecIOS</a></code> |


#### FillSpec

| Prop        | Type                |
| ----------- | ------------------- |
| **`color`** | <code>string</code> |


#### LabelSpec

| Prop        | Type                                          |
| ----------- | --------------------------------------------- |
| **`color`** | <code>string</code>                           |
| **`font`**  | <code><a href="#fontspec">FontSpec</a></code> |


#### FontSpec

| Prop       | Type                |
| ---------- | ------------------- |
| **`name`** | <code>string</code> |
| **`size`** | <code>number</code> |


#### BarSpecIOS

| Prop             | Type                         | Description                             |
| ---------------- | ---------------------------- | --------------------------------------- |
| **`hideShadow`** | <code>boolean \| null</code> | Default behaviour is to show the shadow |


#### TabsSpec

| Prop        | Type                                                | Description                                                                 |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| **`type`**  | <code>'tabs'</code>                                 |                                                                             |
| **`tabs`**  | <code>TabSpec[]</code>                              |                                                                             |
| **`title`** | <code>string</code>                                 |                                                                             |
| **`state`** | <code><a href="#stateobject">StateObject</a></code> | State that will be mixed into the state of each of the contained components |


#### TabSpec

| Prop             | Type                                                                                | Description                                                                 |
| ---------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **`alias`**      | <code><a href="#componentalias">ComponentAlias</a></code>                           |                                                                             |
| **`title`**      | <code>string</code>                                                                 |                                                                             |
| **`image`**      | <code><a href="#imagespec">ImageSpec</a></code>                                     |                                                                             |
| **`badgeValue`** | <code>string</code>                                                                 |                                                                             |
| **`component`**  | <code><a href="#viewspec">ViewSpec</a> \| <a href="#stackspec">StackSpec</a></code> |                                                                             |
| **`state`**      | <code><a href="#stateobject">StateObject</a></code>                                 | State that will be mixed into the state of each of the contained components |


#### DismissResult

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### DismissOptions

| Prop           | Type                                                          |
| -------------- | ------------------------------------------------------------- |
| **`id`**       | <code>string \| <a href="#componentid">ComponentId</a></code> |
| **`animated`** | <code>boolean</code>                                          |


#### PushResult

| Prop        | Type                                                | Description                                                |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------- |
| **`id`**    | <code><a href="#componentid">ComponentId</a></code> | The id of the component that was pushed.                   |
| **`stack`** | <code><a href="#componentid">ComponentId</a></code> | The stack that was pushed to, if it was pushed to a stack. |


#### PushOptions

| Prop            | Type                                                          | Description                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`component`** | <code><a href="#viewspec">ViewSpec</a></code>                 | The options for the view to push onto the stack.                                                                                                                                                                 |
| **`target`**    | <code>string \| <a href="#componentid">ComponentId</a></code> | The target component to push to, usually a stack, or undefined to push to the current stack or component.                                                                                                        |
| **`animated`**  | <code>boolean</code>                                          | Whether to animate the push. Defaults to `true`                                                                                                                                                                  |
| **`mode`**      | <code><a href="#pushmode">PushMode</a></code>                 | The mode to use for the push. Defaults to `'push'`. push: Push the component onto the stack. replace: Replace the current top-most component in the stack. root: Reset the stack back to just the new component. |
| **`popCount`**  | <code>number</code>                                           | How many items to pop first                                                                                                                                                                                      |


#### PopResult

| Prop        | Type                                                | Description                                                                                                                      |
| ----------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **`stack`** | <code><a href="#componentid">ComponentId</a></code> |                                                                                                                                  |
| **`count`** | <code>number</code>                                 | The number of components that were popped                                                                                        |
| **`id`**    | <code><a href="#componentid">ComponentId</a></code> | The id of the component that was popped, if any. If multiple components are popped, the id will be of the last component popped. |


#### PopOptions

| Prop           | Type                                                          | Description                                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| **`stack`**    | <code>string \| <a href="#componentid">ComponentId</a></code> | The stack to pop from, or undefined to pop from the current stack. |
| **`count`**    | <code>number</code>                                           | How many items to pop                                              |
| **`animated`** | <code>boolean</code>                                          | Whether to animate the pop. Defaults to `true`                     |


#### UpdateOptions

| Prop           | Type                                                                                                                                                                      | Description                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **`id`**       | <code>string \| <a href="#componentid">ComponentId</a></code>                                                                                                             |                                                     |
| **`animated`** | <code>boolean</code>                                                                                                                                                      | Whether to animate the changes. Defaults to `false` |
| **`update`**   | <code><a href="#stackupdate">StackUpdate</a> \| <a href="#tabsupdate">TabsUpdate</a> \| <a href="#tabupdate">TabUpdate</a> \| <a href="#viewupdate">ViewUpdate</a></code> |                                                     |


#### StackUpdate

Options for stack components

| Prop             | Type                                            |
| ---------------- | ----------------------------------------------- |
| **`components`** | <code>ViewSpec[]</code>                         |
| **`bar`**        | <code><a href="#barupdate">BarUpdate</a></code> |


#### BarUpdate

| Prop             | Type                                                        |
| ---------------- | ----------------------------------------------------------- |
| **`background`** | <code><a href="#fillupdate">FillUpdate</a> \| null</code>   |
| **`title`**      | <code><a href="#labelupdate">LabelUpdate</a> \| null</code> |
| **`buttons`**    | <code><a href="#labelupdate">LabelUpdate</a> \| null</code> |
| **`visible`**    | <code>boolean \| null</code>                                |
| **`iOS`**        | <code><a href="#barspecios">BarSpecIOS</a></code>           |


#### FillUpdate

| Prop        | Type                        |
| ----------- | --------------------------- |
| **`color`** | <code>string \| null</code> |


#### LabelUpdate

| Prop        | Type                                                      |
| ----------- | --------------------------------------------------------- |
| **`color`** | <code>string \| null</code>                               |
| **`font`**  | <code><a href="#fontupdate">FontUpdate</a> \| null</code> |


#### FontUpdate

| Prop       | Type                        |
| ---------- | --------------------------- |
| **`name`** | <code>string \| null</code> |
| **`size`** | <code>number \| null</code> |


#### TabsUpdate

Options for tabs components

| Prop       | Type                   |
| ---------- | ---------------------- |
| **`tabs`** | <code>TabSpec[]</code> |


#### TabUpdate

| Prop             | Type                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| **`title`**      | <code>string \| null</code>                                                         |
| **`image`**      | <code><a href="#imagespec">ImageSpec</a> \| null</code>                             |
| **`badgeValue`** | <code>string \| null</code>                                                         |
| **`component`**  | <code><a href="#viewspec">ViewSpec</a> \| <a href="#stackspec">StackSpec</a></code> |


#### ViewUpdate

Options for view components

| Prop            | Type                                                        | Description                                       |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| **`stackItem`** | <code><a href="#stackitemupdate">StackItemUpdate</a></code> | Options for when the component is used in a stack |
| **`android`**   | <code>{ backButtonId?: string \| null; }</code>             | Options for Android specific features             |


#### StackItemUpdate

| Prop             | Type                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`backItem`**   | <code><a href="#stackbarbuttonitem">StackBarButtonItem</a> \| null</code> | The back item used when this stack item is on the back stack. This is only currently used by iOS as Android will show an arrow with no title if back is enabled                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **`leftItems`**  | <code>StackBarButtonItem[] \| null</code>                                 | Setting any value to leftItems will disable the navigation back buttons on both iOS and Android. (Android hardware back button is not affected). iOS: items will show on the left side of the navigation bar replacing the back button. The swipe back gesture will be disabled. Android: Toolbars have support for only a single image-button on the left. If the first item has an image then the toolbar will insert this item left of the title replacing the default back button if there would have been one. The remaining left items will appear on the right of the toolbar ahead of any right items. |
| **`rightItems`** | <code>StackBarButtonItem[] \| null</code>                                 | Right items will show on the rightmost edge of the navigation bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **`bar`**        | <code><a href="#barupdate">BarUpdate</a> \| null</code>                   | Customise the bar on top of the default options provided by the stack                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |


#### ResetOptions

| Prop           | Type                 | Description                                                                       |
| -------------- | -------------------- | --------------------------------------------------------------------------------- |
| **`animated`** | <code>boolean</code> | Whether to animate resetting the navigation back to Capacitor Defaults to `false` |


#### GetResult

| Prop            | Type                                                            | Description                                 |
| --------------- | --------------------------------------------------------------- | ------------------------------------------- |
| **`component`** | <code><a href="#anycomponentmodel">AnyComponentModel</a></code> | The component, if any.                      |
| **`stack`**     | <code><a href="#stackmodel">StackModel</a></code>               | The stack containing the component, if any. |
| **`tabs`**      | <code><a href="#tabsmodel">TabsModel</a></code>                 | The tabs containing the component, if any.  |


#### StackModel

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### TabsModel

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### ViewModel

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### GetOptions

| Prop     | Type                                                          | Description                                                          |
| -------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| **`id`** | <code>string \| <a href="#componentid">ComponentId</a></code> | The component id to get, or undefined to get the top-most component. |


#### MessageOptions

| Prop         | Type                                                | Description                                                                            |
| ------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **`target`** | <code><a href="#componentid">ComponentId</a></code> | The target component of the message, or `undefined` to send to the top-most component. |
| **`type`**   | <code>string</code>                                 | The message type.                                                                      |
| **`value`**  | <code>D</code>                                      | A message value. Must be JSON stringifiable.                                           |


### Type Aliases


#### ComponentId

<code><a href="#opaque">Opaque</a>&lt;'<a href="#componentid">ComponentId</a>', string&gt;</code>


#### Opaque

<code>T & { __TYPE__: K }</code>


#### AnyComponentSpec

<code><a href="#stackspec">StackSpec</a> | <a href="#tabsspec">TabsSpec</a> | <a href="#viewspec">ViewSpec</a></code>


#### StateObject

<code><a href="#record">Record</a>&lt;string, string | number | boolean | null&gt;</code>


#### Record

Construct a type with a set of properties K of type T

<code>{ [P in K]: T; }</code>


#### ButtonId

<code>string</code>


#### ImageSpec

<code><a href="#imageobject">ImageObject</a> | string</code>


#### ComponentAlias

<code>string</code>


#### PresentationStyle

<code>'fullScreen' | 'pageSheet' | 'formSheet' | 'dialog'</code>


#### PushMode

push: Push the component onto the stack.
replace: Replace the current top-most component in the stack.
root: Reset the stack back to just the new component.

<code>'push' | 'replace' | 'root'</code>


#### AnyComponentModel

<code><a href="#stackmodel">StackModel</a> | <a href="#tabsmodel">TabsModel</a> | <a href="#viewmodel">ViewModel</a></code>

</docgen-api>
