# native-navigation

Native navigation for Capacitor apps

## Install

```bash
npm install native-navigation
npx cap sync
```

## API

<docgen-index>

* [`create(...)`](#create)
* [`setRoot(...)`](#setroot)
* [`prepare(...)`](#prepare)
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

### create(...)

```typescript
create(options: CreateOptionsValues) => any
```

Create a new native UI.

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#createoptionsvalues">CreateOptionsValues</a></code> |

**Returns:** <code>any</code>

--------------------


### setRoot(...)

```typescript
setRoot(options: SetRootOptions) => any
```

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#setrootoptions">SetRootOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### prepare(...)

```typescript
prepare(options: PrepareOptions) => any
```

Prepare a component to handle a subsequent window.open. Allowing us to ensure that window opens come from our application.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#prepareoptions">PrepareOptions</a></code> |

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


#### StackOptions

| Prop        | Type                 |
| ----------- | -------------------- |
| **`type`**  | <code>'stack'</code> |
| **`stack`** | <code>{}</code>      |


#### TabsOptions

| Prop       | Type                |
| ---------- | ------------------- |
| **`type`** | <code>'tabs'</code> |
| **`tabs`** | <code>{}</code>     |


#### ViewOptions

| Prop        | Type                                       | Description                     |
| ----------- | ------------------------------------------ | ------------------------------- |
| **`type`**  | <code>'view'</code>                        |                                 |
| **`path`**  | <code>string</code>                        | The path representing the view. |
| **`state`** | <code>Record&lt;string, unknown&gt;</code> |                                 |


#### CreateResult

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### SetRootOptions

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### PrepareOptions

| Prop     | Type                                                |
| -------- | --------------------------------------------------- |
| **`id`** | <code><a href="#componentid">ComponentId</a></code> |


#### PresentOptions

| Prop           | Type                                                | Description                                                                     |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| **`id`**       | <code><a href="#componentid">ComponentId</a></code> | The component to present as a modal; either an already created one or a new one |
| **`animated`** | <code>boolean</code>                                | Whether to animate the presenting. Defaults to `true`                           |


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

| Prop           | Type                                                | Description                                                      |
| -------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| **`id`**       | <code><a href="#componentid">ComponentId</a></code> | The id of the component to push.                                 |
| **`stack`**    | <code><a href="#componentid">ComponentId</a></code> | The stack to push to, or undefined to push to the current stack. |
| **`animated`** | <code>boolean</code>                                | Whether to animate the push. Defaults to `true`                  |


#### PushResult

| Prop        | Type                                                | Description                   |
| ----------- | --------------------------------------------------- | ----------------------------- |
| **`stack`** | <code><a href="#componentid">ComponentId</a></code> | The stack that was pushed to. |


#### PopOptions

| Prop           | Type                                                | Description                                                        |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| **`stack`**    | <code><a href="#componentid">ComponentId</a></code> | The stack to pop from, or undefined to pop from the current stack. |
| **`animated`** | <code>boolean</code>                                | Whether to animate the pop. Defaults to `true`                     |


#### PopResult

| Prop        | Type                                                | Description                                     |
| ----------- | --------------------------------------------------- | ----------------------------------------------- |
| **`stack`** | <code><a href="#componentid">ComponentId</a></code> |                                                 |
| **`id`**    | <code><a href="#componentid">ComponentId</a></code> | The id of the component that was popped, if any |


#### SetComponentOptions

| Prop           | Type                                                | Description                                         |
| -------------- | --------------------------------------------------- | --------------------------------------------------- |
| **`id`**       | <code><a href="#componentid">ComponentId</a></code> |                                                     |
| **`animated`** | <code>boolean</code>                                | Whether to animate the changes. Defaults to `false` |


### Type Aliases


#### CreateOptionsValues

<code><a href="#stackoptions">StackOptions</a> | <a href="#tabsoptions">TabsOptions</a> | <a href="#viewoptions">ViewOptions</a></code>


#### ComponentId

<code>string</code>

</docgen-api>
