# Capacitor Native Navigation

Capacitor Native Navigation is a plugin for [Capacitor](https://capacitorjs.com/) that allows a React DOM application
to use native UI for views, stacks and tabs.

The traditional method of using React DOM on native is to either mimic native navigation transitions or to simply behave like a webapp
without transitions and without a native backstack. Capacitor Native Navigation lets you use all of the native navigation containers from
React DOM, often transparently, so you have the best of native and web.

## Native navigation components

Native applications are made up of "views". Views can be organised in "stacks" or "tabs". Views can also be presented modally, over another view. On iOS the native component representing a view is the `UIViewController`.

A stack is a collection of views with the top-most view being the visible one, and the views underneath it forming a back-stack. On iOS the native component representing a stack is the `UINavigationController`, on Android the built-in back button navigates back through stacks.

Tabs are another collection of views with buttons (tabs) to switch between the different views. On iOS the native component representing `tabs` is the `UITabBarController`.

## API

The Capacitor Native Navigation plugin exposes an API for manipulating native views from JavaScript. You'll use the API to initialise the application, but most of the navigation in the application itself can avoid using the Capacitor Native Navigation API by taking advantage of routing library integration. This is a goal of Capacitor Native Navigation, to not require tight coupling in your application.

[API docs](./packages/plugin/)

### Present a new view

The first thing you'll want to do is to present a native view. The `present` API call includes:

* a `component` specification, which describes a structure or tabs, stacks and views to present.
* a presentation `style`, in case you're presenting modally.
* an `animated` flag, to allow or prevent transition animations.

Here is an example to present a new stack containing a single view:

```typescript
const stack = await NativeNavigation.present({
    component: {
      type: 'stack',
      stack: [
        {
          type: 'view',
          path: '/welcome',
          options: {
            title: 'Welcome,
          }
        }
      ],
    },
    animated: false,
  })
```

The result of the `present` API call is an object containing the `id` of the presented component. You can also specify the `id` in the component specification to hard-code it.

### Dismiss a view

Modal views can often be dismissed by the user themselves using native controls, but all _presented_ views can be dismissed using the `dismiss` API. The `dismiss` API call includes:

* the component `id` to dismiss.
* an `animated` flag, to allow or prevent transition animations.

### Push a view

When you have an existing stack, you can push a new view onto it, or replace the top-most view. The `push` API call includes:

* a `component` specification, which describes a structure or tabs, stacks and views to push.
* the `target` component id, to identify the stack to push to. This is usually omitted, meaning push to the current stack.
* an `animated` flag, to allow or prevent transition animations.
* the `mode`, either _push_ (the default), or _replace_ or _root_ (to reset the stack back to just the new component).

```typescript
NativeNavigation.push({
  component: {
    type: 'view',
    path: '/features',
  },
})
```

### Pop a view

Usually the user will pop views themselves using native back controls, but you can also trigger popping one or more views off a stack. The `pop` API call includes:

* a `stack` id, to identify the stack to pop from. This is usually omitted, meaning pop from the current stack.
* a `count` of the number of views to pop, which defaults to 1.
* an `animated` flag, to allow or prevent transition animations.

```typescript
NativeNavigation.pop({})
```

## React

Capacitor Native Navigation integrates with [React](https://react.dev/) to render React components for each view or screen in the app. Each view has a path (and search, hash and state), which is used to work out which components to show; often using a routing library such as React Router ([see below](#react-router)).

The React integration is activated by calling `initReact` and passing a reference to the `NativeNavigation` plugin, and the root component that will render each view.

```typescript
import { NativeNavigation } from '@cactuslab/native-navigation'
import { initReact, NativeNavigationReactRootProps } from '@cactuslab/native-navigation-react'

function Root(props: NativeNavigationReactRootProps): JSX.Element {
  const { pathname, search, hash, state } = props

  ...
}

initReact({
  plugin: NativeNavigation,
  root: Root,
})
```

[@cactuslab/native-navigation-react](./packages/react)

### Differences to React DOM

Capacitor Native Navigation tries as much as possible to be a seamless adaptation of React DOM to native, however there are some differences that you should be aware of.

Each view is mounted as a separate React DOM root. If there are ten _views_ in a _stack_ there will be ten React DOM roots.

The components in each view continue to respond to state changes (such as Redux, or timers), even if they're not currently visible. You must be careful not to trigger unintentional side-effects such as navigation from a component that is not visible.

Because each view is a separate root, you cannot share context or state between two views. Instead use global context / state such as [Redux](https://redux.js.org), or pass state between views using navigation state. This has the additional benefit that state will be maintained when reloading the page in the browser.

## React Router

Capacitor Native Navigation transparently integrates with [React Router](https://reactrouter.com/) so that the `navigate()` function
translates pushes, replaces and backs into their native equivalent. This enables Capacitor Native Navigation to be very loosely coupled
with your app; you start with a separate native entrypoint, but then reuse all of you web routing and navigating (`navigate`, `Link`, etc)
code.

The root view component receives all of the location information from Capacitor Native Navigation in its props. We use `Router` from `react-router-dom` to create the root router with a custom `Navigator`.

```typescript
import { Route, Router, Routes } from 'react-router-dom'
import { NativeNavigation } from '@cactuslab/native-navigation'
import { NativeNavigationReactRootProps } from '@cactuslab/native-navigation-react'
import { useNativeNavigationNavigator } from '@cactuslab/native-navigation-react-router'

export default function Root(props: NativeNavigationReactRootProps): JSX.Element {
  const { pathname, search, hash, state } = props

  const navigator = useNativeNavigationNavigator({
    plugin: NativeNavigation,
    modals: [],
  })

  return (
    <Router location={{ pathname, search, hash, state }} navigator={navigator}>
      <Routes>
        ...
      </Routes>
    </Router>
  )
}
```

[@cactuslab/native-navigation-react-router](./packages/react-router)

### Modals

Special support is available for modal views in the `useNativeNavigationNavigator` hook.

```typescript
const navigator = useNativeNavigationNavigator({
    plugin: NativeNavigation,
    modals: [
      {
        /* The path prefix for views that should be in the modal */
        path: '/modal/',
        /* A function to return the component specification for the view to present for the modal */
        presentOptions(path, state) {
          return {
            component: {
              type: 'stack',
              stack: [
                {
                  type: 'view',
                  path,
                  state,
                  options: {
                    /* We can specify the title here, or set it using `update` from the component */
                    title: 'My Modal Title',
                    stack: {
                      rightItems: [
                        /* Add a close button to the view */
                        {
                          id: 'close',
                          title: 'Close',
                        },
                      ],
                    },
                  },
                },
              ],
            },
            style: 'formSheet',
            cancellable: false
          }
        },
      },
    ]
  })
```

## Work in progress

* Android tabs support
