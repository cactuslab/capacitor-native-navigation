# native-navigation

Native navigation for Capacitor apps

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
setOptions(options: SetComponentOptions) => any
```

Set the options for an existing component

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


### Interfaces


#### PresentOptions

| Prop            | Type                                                            | Description                                           |
| --------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| **`component`** | <code><a href="#componentspecs">ComponentSpecs</a></code>       | The component to present.                             |
| **`style`**     | <code><a href="#presentationstyle">PresentationStyle</a></code> | The presentation style. Defaults to `'fullScreen'`    |
| **`animated`**  | <code>boolean</code>                                            | Whether to animate the presenting. Defaults to `true` |


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

| Prop        | Type                                                                                                   | Description                                       |
| ----------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **`title`** | <code>string \| null</code>                                                                            |                                                   |
| **`stack`** | <code>{ backItem?: <a href="#stackbaritem">StackBarItem</a>; leftItems?: {}; rightItems?: {}; }</code> | Options for when the component is used in a stack |
| **`tab`**   | <code>{ image?: <a href="#imagespec">ImageSpec</a>; badgeValue?: string; }</code>                      | Options for when the component is used in a tab   |


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


#### AllComponentOptions

<code><a href="#stackoptions">StackOptions</a> | <a href="#tabsoptions">TabsOptions</a> | <a href="#viewoptions">ViewOptions</a></code>


#### TabsOptions

Options for tabs components

<code><a href="#componentoptions">ComponentOptions</a></code>


#### ButtonId

<code>string</code>


#### ImageSpec

<code><a href="#imageobject">ImageObject</a> | string</code>


#### ViewOptions

Options for view components

<code><a href="#componentoptions">ComponentOptions</a></code>

</docgen-api>
