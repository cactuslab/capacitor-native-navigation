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
* [`setOptions(...)`](#setoptions)
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
present(options: PresentOptions) => any
```

Present a new native UI.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#presentoptions">PresentOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### dismiss(...)

```typescript
dismiss(options?: DismissOptions | undefined) => any
```

Dismiss a native UI.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#dismissoptions">DismissOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### push(...)

```typescript
push(options: PushOptions) => any
```

Push a new component onto a stack, or replace an existing component.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code><a href="#pushoptions">PushOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### pop(...)

```typescript
pop(options: PopOptions) => any
```

Pop the top component off a stack

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`options`** | <code><a href="#popoptions">PopOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### setOptions(...)

```typescript
setOptions(options: SetOptionsOptions) => any
```

Set the options for an existing component

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#setoptionsoptions">SetOptionsOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### reset(...)

```typescript
reset(options?: ResetOptions | undefined) => any
```

Remove all of the native UI and reset back to the root Capacitor webview.

| Param         | Type                                                  |
| ------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#resetoptions">ResetOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### get(...)

```typescript
get(options?: GetOptions | undefined) => any
```

Get the spec and context of a component

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`options`** | <code><a href="#getoptions">GetOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### message(...)

```typescript
message<D>(options: MessageOptions<D>) => any
```

Send a message to a component.

| Param         | Type                                                               |
| ------------- | ------------------------------------------------------------------ |
| **`options`** | <code><a href="#messageoptions">MessageOptions</a>&lt;D&gt;</code> |

**Returns:** <code>any</code>

--------------------


### Interfaces


#### PresentOptions

| Prop              | Type                                                            | Description                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`component`**   | <code><a href="#componentspecs">ComponentSpecs</a></code>       | The component to present.                                                                                                                                                |
| **`style`**       | <code><a href="#presentationstyle">PresentationStyle</a></code> | The presentation style. Defaults to `'fullScreen'`                                                                                                                       |
| **`cancellable`** | <code>boolean</code>                                            | Whether to allow the user to use system gestures or the back button to unwind the presentation. Useful to prevent the accidental dismissal of a form. Defaults to `true` |
| **`animated`**    | <code>boolean</code>                                            | Whether to animate the presenting. Defaults to `true`                                                                                                                    |


#### StackSpec

| Prop             | Type                 |
| ---------------- | -------------------- |
| **`type`**       | <code>'stack'</code> |
| **`components`** | <code>{}</code>      |


#### ViewSpec

| Prop        | Type                                            | Description                     |
| ----------- | ----------------------------------------------- | ------------------------------- |
| **`type`**  | <code>'view'</code>                             |                                 |
| **`path`**  | <code>string</code>                             | The path representing the view. |
| **`state`** | <code><a href="#viewstate">ViewState</a></code> |                                 |


#### TabsSpec

| Prop       | Type                |
| ---------- | ------------------- |
| **`type`** | <code>'tabs'</code> |


#### PresentResult

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### DismissOptions

| Prop           | Type                                                |
| -------------- | --------------------------------------------------- |
| **`id`**       | <code><a href="#componentid">ComponentId</a></code> |
| **`animated`** | <code>boolean</code>                                |


#### DismissResult

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### PushOptions

| Prop            | Type                                                | Description                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`component`** | <code><a href="#viewspec">ViewSpec</a></code>       | The options for the view to push onto the stack.                                                                                                                                                                 |
| **`target`**    | <code><a href="#componentid">ComponentId</a></code> | The target component to push to, usually a stack, or undefined to push to the current stack or component.                                                                                                        |
| **`animated`**  | <code>boolean</code>                                | Whether to animate the push. Defaults to `true`                                                                                                                                                                  |
| **`mode`**      | <code><a href="#pushmode">PushMode</a></code>       | The mode to use for the push. Defaults to `'push'`. push: Push the component onto the stack. replace: Replace the current top-most component in the stack. root: Reset the stack back to just the new component. |
| **`popCount`**  | <code>number</code>                                 | How many items to pop first                                                                                                                                                                                      |


#### PushResult

| Prop        | Type                                                | Description                                                |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------- |
| **`id`**    | <code><a href="#componentid">ComponentId</a></code> | The id of the component that was pushed.                   |
| **`stack`** | <code><a href="#componentid">ComponentId</a></code> | The stack that was pushed to, if it was pushed to a stack. |


#### PopOptions

| Prop           | Type                                                | Description                                                        |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| **`stack`**    | <code><a href="#componentid">ComponentId</a></code> | The stack to pop from, or undefined to pop from the current stack. |
| **`count`**    | <code>number</code>                                 | How many items to pop                                              |
| **`animated`** | <code>boolean</code>                                | Whether to animate the pop. Defaults to `true`                     |


#### PopResult

| Prop        | Type                                                | Description                                                                                                                      |
| ----------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **`stack`** | <code><a href="#componentid">ComponentId</a></code> |                                                                                                                                  |
| **`count`** | <code>number</code>                                 | The number of components that were popped                                                                                        |
| **`id`**    | <code><a href="#componentid">ComponentId</a></code> | The id of the component that was popped, if any. If multiple components are popped, the id will be of the last component popped. |


#### SetOptionsOptions

| Prop           | Type                                                | Description                                         |
| -------------- | --------------------------------------------------- | --------------------------------------------------- |
| **`id`**       | <code><a href="#componentid">ComponentId</a></code> |                                                     |
| **`animated`** | <code>boolean</code>                                | Whether to animate the changes. Defaults to `false` |
| **`options`**  | <code><a href="#alloptions">AllOptions</a></code>   |                                                     |


#### StackOptions

Options for stack components

| Prop             | Type                                              |
| ---------------- | ------------------------------------------------- |
| **`components`** | <code>{}</code>                                   |
| **`bar`**        | <code><a href="#baroptions">BarOptions</a></code> |


#### BarOptions

| Prop             | Type                                                  |
| ---------------- | ----------------------------------------------------- |
| **`background`** | <code><a href="#filloptions">FillOptions</a></code>   |
| **`title`**      | <code><a href="#labeloptions">LabelOptions</a></code> |
| **`buttons`**    | <code><a href="#labeloptions">LabelOptions</a></code> |
| **`visible`**    | <code>boolean</code>                                  |


#### FillOptions

| Prop        | Type                |
| ----------- | ------------------- |
| **`color`** | <code>string</code> |


#### LabelOptions

| Prop        | Type                                                |
| ----------- | --------------------------------------------------- |
| **`color`** | <code>string</code>                                 |
| **`font`**  | <code><a href="#fontoptions">FontOptions</a></code> |


#### FontOptions

| Prop       | Type                |
| ---------- | ------------------- |
| **`name`** | <code>string</code> |
| **`size`** | <code>number</code> |


#### TabsOptions

Options for tabs components

| Prop       | Type            |
| ---------- | --------------- |
| **`tabs`** | <code>{}</code> |


#### TabSpec

| Prop     | Type                                                | Description                                                              |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> | The id to use for the tab, or undefined to automatically generate an id. |


#### TabOptions

| Prop             | Type                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| **`title`**      | <code>string</code>                                                                 |
| **`image`**      | <code><a href="#imagespec">ImageSpec</a></code>                                     |
| **`badgeValue`** | <code>string</code>                                                                 |
| **`component`**  | <code><a href="#stackspec">StackSpec</a> \| <a href="#viewspec">ViewSpec</a></code> |


#### ImageObject

| Prop        | Type                | Description                                                                                                                                                         |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`uri`**   | <code>string</code> | The uri for the image.                                                                                                                                              |
| **`scale`** | <code>number</code> | The scale to use for the image, e.g. 2 for a 2x scale image. If not provided the scale will be determined automatically from the filename, or it will default to 1. |


#### ViewOptions

Options for view components

| Prop        | Type                                                                                                                                                                      | Description                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **`stack`** | <code>{ backItem?: <a href="#stackbaritem">StackBarItem</a>; leftItems?: {}; rightItems?: {}; backEnabled?: boolean; bar?: <a href="#baroptions">BarOptions</a>; }</code> | Options for when the component is used in a stack |


#### StackBarItem

| Prop        | Type                                            |
| ----------- | ----------------------------------------------- |
| **`id`**    | <code><a href="#buttonid">ButtonId</a></code>   |
| **`title`** | <code>string</code>                             |
| **`image`** | <code><a href="#imagespec">ImageSpec</a></code> |


#### ResetOptions

| Prop           | Type                 | Description                                                                       |
| -------------- | -------------------- | --------------------------------------------------------------------------------- |
| **`animated`** | <code>boolean</code> | Whether to animate resetting the navigation back to Capacitor Defaults to `false` |


#### GetOptions

| Prop     | Type                                                | Description                                                          |
| -------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> | The component id to get, or undefined to get the top-most component. |


#### GetResult

| Prop            | Type                                                      | Description                                 |
| --------------- | --------------------------------------------------------- | ------------------------------------------- |
| **`component`** | <code><a href="#componentspecs">ComponentSpecs</a></code> | The component, if any.                      |
| **`stack`**     | <code><a href="#stackspec">StackSpec</a></code>           | The stack containing the component, if any. |
| **`tabs`**      | <code><a href="#tabsspec">TabsSpec</a></code>             | The tabs containing the component, if any.  |


#### MessageOptions

| Prop         | Type                                                | Description                                                                            |
| ------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **`target`** | <code><a href="#componentid">ComponentId</a></code> | The target component of the message, or `undefined` to send to the top-most component. |
| **`type`**   | <code>string</code>                                 | The message type.                                                                      |
| **`value`**  | <code>D</code>                                      | A message value. Must be JSON stringifiable.                                           |


### Type Aliases


#### ComponentSpecs

<code><a href="#stackspec">StackSpec</a> | <a href="#tabsspec">TabsSpec</a> | <a href="#viewspec">ViewSpec</a></code>


#### ViewState

<code>Record&lt;string, string | number | boolean | null&gt;</code>


#### PresentationStyle

<code>'fullScreen' | 'pageSheet' | 'formSheet' | 'dialog'</code>


#### ComponentId

<code>string</code>


#### PushMode

push: Push the component onto the stack.
replace: Replace the current top-most component in the stack.
root: Reset the stack back to just the new component.

<code>'push' | 'replace' | 'root'</code>


#### AllOptions

<code><a href="#stackoptions">StackOptions</a> | <a href="#tabsoptions">TabsOptions</a> | <a href="#taboptions">TabOptions</a> | <a href="#viewoptions">ViewOptions</a></code>


#### ImageSpec

<code><a href="#imageobject">ImageObject</a> | string</code>


#### ButtonId

<code>string</code>

</docgen-api>
