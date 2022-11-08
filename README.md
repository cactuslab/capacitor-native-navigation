# native-navigation

Native navigation for Capacitor apps

## Install

```bash
npm install native-navigation
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
* [`reset()`](#reset)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

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
dismiss(options: DismissOptions) => any
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


### reset()

```typescript
reset() => any
```

Remove all of the native UI and reset back to the root Capacitor webview.

**Returns:** <code>any</code>

--------------------


### Interfaces


#### SetRootOptions

| Prop            | Type                                                      | Description                                          |
| --------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| **`component`** | <code><a href="#componentspecs">ComponentSpecs</a></code> | The component to set as the root of the application. |


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

| Prop            | Type                                                | Description                                                      |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| **`component`** | <code><a href="#viewspec">ViewSpec</a></code>       | The options for the view to push onto the stack.                 |
| **`stack`**     | <code><a href="#componentid">ComponentId</a></code> | The stack to push to, or undefined to push to the current stack. |
| **`animated`**  | <code>boolean</code>                                | Whether to animate the push. Defaults to `true`                  |


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

| Prop           | Type                                                | Description                                         |
| -------------- | --------------------------------------------------- | --------------------------------------------------- |
| **`id`**       | <code><a href="#componentid">ComponentId</a></code> |                                                     |
| **`animated`** | <code>boolean</code>                                | Whether to animate the changes. Defaults to `false` |


### Type Aliases


#### ComponentSpecs

<code><a href="#stackspec">StackSpec</a> | <a href="#tabsspec">TabsSpec</a> | <a href="#viewspec">ViewSpec</a></code>


#### ViewState

<code>Record&lt;string, string | number | boolean | null&gt;</code>


#### ComponentId

<code>string</code>

</docgen-api>
