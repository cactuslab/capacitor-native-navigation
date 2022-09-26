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
* [`present(...)`](#present)
* [`dismiss(...)`](#dismiss)
* [`push(...)`](#push)
* [`pop(...)`](#pop)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### create(...)

```typescript
create(options: RootOptions) => any
```

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code><a href="#rootoptions">RootOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### present(...)

```typescript
present(options: PresentOptions) => any
```

Present a new root.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#presentoptions">PresentOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### dismiss(...)

```typescript
dismiss(options: DismissOptions) => any
```

Dismiss a root.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#dismissoptions">DismissOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### push(...)

```typescript
push(options: PushOptions) => any
```

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code><a href="#pushoptions">PushOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### pop(...)

```typescript
pop(options: PopOptions) => any
```

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`options`** | <code><a href="#popoptions">PopOptions</a></code> |

**Returns:** <code>any</code>

--------------------


### Interfaces


#### RootOptions

| Prop                         | Type                                                                      |
| ---------------------------- | ------------------------------------------------------------------------- |
| **`type`**                   | <code><a href="#roottype">RootType</a></code>                             |
| **`name`**                   | <code><a href="#rootname">RootName</a></code>                             |
| **`presentationStyle`**      | <code><a href="#presentationstyle">PresentationStyle</a></code>           |
| **`modalPresentationStyle`** | <code><a href="#modalpresentationstyle">ModalPresentationStyle</a></code> |


#### CreateResult

| Prop       | Type                                          |
| ---------- | --------------------------------------------- |
| **`root`** | <code><a href="#rootname">RootName</a></code> |


#### PresentOptions

| Prop                         | Type                                                                      | Description                                                     |
| ---------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **`root`**                   | <code>string \| <a href="#rootoptions">RootOptions</a></code>             | The root to present; either an already created one or a new one |
| **`animated`**               | <code>boolean</code>                                                      |                                                                 |
| **`presentationStyle`**      | <code><a href="#presentationstyle">PresentationStyle</a></code>           |                                                                 |
| **`modalPresentationStyle`** | <code><a href="#modalpresentationstyle">ModalPresentationStyle</a></code> |                                                                 |


#### PresentResult

| Prop       | Type                                          |
| ---------- | --------------------------------------------- |
| **`root`** | <code><a href="#rootname">RootName</a></code> |


#### DismissOptions

| Prop           | Type                                          |
| -------------- | --------------------------------------------- |
| **`root`**     | <code><a href="#rootname">RootName</a></code> |
| **`animated`** | <code>boolean</code>                          |


#### PushOptions

| Prop        | Type                                          | Description                                                      |
| ----------- | --------------------------------------------- | ---------------------------------------------------------------- |
| **`stack`** | <code><a href="#rootname">RootName</a></code> | The stack to push to, or undefined to push to the current stack. |
| **`path`**  | <code>string</code>                           | The path representing the view to push.                          |


#### PushResult

| Prop         | Type                                          | Description                   |
| ------------ | --------------------------------------------- | ----------------------------- |
| **`stack`**  | <code><a href="#rootname">RootName</a></code> | The stack that was pushed to. |
| **`viewId`** | <code><a href="#viewid">ViewId</a></code>     | The id of the view pushed     |


#### PopOptions

| Prop        | Type                                          | Description                                                        |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------ |
| **`stack`** | <code><a href="#rootname">RootName</a></code> | The stack to pop from, or undefined to pop from the current stack. |


#### PopResult

| Prop         | Type                                          |
| ------------ | --------------------------------------------- |
| **`stack`**  | <code><a href="#rootname">RootName</a></code> |
| **`viewId`** | <code><a href="#viewid">ViewId</a></code>     |


### Type Aliases


#### RootType

<code>'stack' | 'tabs' | 'plain'</code>


#### RootName

<code>string</code>


#### PresentationStyle

<code>'normal' | 'modal'</code>


#### ModalPresentationStyle

<code>'fullScreen' | 'pageSheet' | 'formSheet'</code>


#### ViewId

<code>string</code>

</docgen-api>
