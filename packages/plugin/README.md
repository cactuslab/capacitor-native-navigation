# native-navigation

Native navigation for Capacitor apps

## Install

```bash
npm install @cactuslab/native-navigation
npx cap sync
```

## API

<docgen-index>

* [`setRoot(...)`](#setroot)
* [`present(...)`](#present)
* [`dismiss(...)`](#dismiss)
* [`push(...)`](#push)
* [`pop(...)`](#pop)
* [`setOptions(...)`](#setoptions)
* [`reset(...)`](#reset)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)
* [Enums](#enums)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### setRoot(...)

```typescript
setRoot(options: SetRootOptions) => any
```

Set the root UI of the application.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#setrootoptions">SetRootOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### present(...)

```typescript
present(options: PresentOptions) => any
```

Present a new native UI as a modal.

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

Push a new component onto a stack

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
setOptions(options: SetComponentOptions) => any
```

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#setcomponentoptions">SetComponentOptions</a></code> |

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


### Interfaces


#### SetRootOptions

| Prop            | Type                                                      | Description                                              |
| --------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| **`component`** | <code><a href="#componentspecs">ComponentSpecs</a></code> | The component to set as the root of the application.     |
| **`animated`**  | <code>boolean</code>                                      | Whether to animate setting the root. Defaults to `false` |


#### StackSpec

| Prop        | Type                 |
| ----------- | -------------------- |
| **`type`**  | <code>'stack'</code> |
| **`stack`** | <code>{}</code>      |


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
| **`tabs`** | <code>{}</code>     |


#### SetRootResult

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### PresentOptions

| Prop            | Type                                                      | Description                                           |
| --------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| **`component`** | <code><a href="#componentspecs">ComponentSpecs</a></code> | The component to present as a modal.                  |
| **`animated`**  | <code>boolean</code>                                      | Whether to animate the presenting. Defaults to `true` |


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

| Prop            | Type                                                | Description                                                                        |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **`component`** | <code><a href="#viewspec">ViewSpec</a></code>       | The options for the view to push onto the stack.                                   |
| **`stack`**     | <code><a href="#componentid">ComponentId</a></code> | The stack to push to, or undefined to push to the current stack.                   |
| **`animated`**  | <code>boolean</code>                                | Whether to animate the push. Defaults to `true`                                    |
| **`mode`**      | <code><a href="#pushmode">PushMode</a></code>       | The mode to use for the push. Defaults to <a href="#pushmode">`PushMode.PUSH`</a>. |


#### PushResult

| Prop        | Type                                                | Description                              |
| ----------- | --------------------------------------------------- | ---------------------------------------- |
| **`id`**    | <code><a href="#componentid">ComponentId</a></code> | The id of the component that was pushed. |
| **`stack`** | <code><a href="#componentid">ComponentId</a></code> | The stack that was pushed to.            |


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


#### SetComponentOptions

| Prop           | Type                                                                | Description                                         |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| **`id`**       | <code><a href="#componentid">ComponentId</a></code>                 |                                                     |
| **`animated`** | <code>boolean</code>                                                | Whether to animate the changes. Defaults to `false` |
| **`options`**  | <code><a href="#allcomponentoptions">AllComponentOptions</a></code> |                                                     |


#### StackOptions

Options for stack components

| Prop      | Type                                                                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`bar`** | <code>{ background?: <a href="#filloptions">FillOptions</a>; title?: <a href="#labeloptions">LabelOptions</a>; buttons?: <a href="#labeloptions">LabelOptions</a>; }</code> |


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


#### ComponentOptions

| Prop                         | Type                                                                                                   | Description                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **`title`**                  | <code>string \| null</code>                                                                            |                                                   |
| **`stack`**                  | <code>{ backItem?: <a href="#stackbaritem">StackBarItem</a>; leftItems?: {}; rightItems?: {}; }</code> | Options for when the component is used in a stack |
| **`tab`**                    | <code>{ image?: <a href="#imagespec">ImageSpec</a>; badgeValue?: string; }</code>                      | Options for when the component is used in a tab   |
| **`modalPresentationStyle`** | <code><a href="#modalpresentationstyle">ModalPresentationStyle</a></code>                              |                                                   |


#### StackBarItem

| Prop        | Type                                            |
| ----------- | ----------------------------------------------- |
| **`id`**    | <code><a href="#buttonid">ButtonId</a></code>   |
| **`title`** | <code>string</code>                             |
| **`image`** | <code><a href="#imagespec">ImageSpec</a></code> |


#### ImageObject

| Prop        | Type                | Description                                                                                                                                                         |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`uri`**   | <code>string</code> | The uri for the image.                                                                                                                                              |
| **`scale`** | <code>number</code> | The scale to use for the image, e.g. 2 for a 2x scale image. If not provided the scale will be determined automatically from the filename, or it will default to 1. |


#### ResetOptions

| Prop           | Type                 | Description                                                                       |
| -------------- | -------------------- | --------------------------------------------------------------------------------- |
| **`animated`** | <code>boolean</code> | Whether to animate resetting the navigation back to Capacitor Defaults to `false` |


### Type Aliases


#### ComponentSpecs

<code><a href="#stackspec">StackSpec</a> | <a href="#tabsspec">TabsSpec</a> | <a href="#viewspec">ViewSpec</a></code>


#### ViewState

<code>Record&lt;string, string | number | boolean | null&gt;</code>


#### ComponentId

<code>string</code>


#### AllComponentOptions

<code><a href="#stackoptions">StackOptions</a> | <a href="#tabsoptions">TabsOptions</a> | <a href="#viewoptions">ViewOptions</a></code>


#### TabsOptions

Options for tabs components

<code><a href="#componentoptions">ComponentOptions</a></code>


#### ButtonId

<code>string</code>


#### ImageSpec

<code><a href="#imageobject">ImageObject</a> | string</code>


#### ModalPresentationStyle

<code>'fullScreen' | 'pageSheet' | 'formSheet'</code>


#### ViewOptions

Options for view components

<code><a href="#componentoptions">ComponentOptions</a></code>


### Enums


#### PushMode

| Members       | Value                  | Description                                          |
| ------------- | ---------------------- | ---------------------------------------------------- |
| **`PUSH`**    | <code>'push'</code>    | Push the component onto the stack.                   |
| **`REPLACE`** | <code>'replace'</code> | Replace the current top-most component in the stack. |
| **`ROOT`**    | <code>'root'</code>    | Reset the stack back to just the new component.      |

</docgen-api>
