# Capacitor Native Navigation

Capacitor Native Navigation is a plugin for [Capacitor](https://capacitorjs.com/) that allows a React DOM application
to use native UI for views, stacks and tabs.

The traditional method of using React DOM on native is to either mimic native navigation transitions or to simply behave like a webapp
without transitions and without a native backstack. Capacitor Native Navigation lets you use all of the native navigation containers from
React DOM, often transparently, so you have the best of native and web.

## Installation

To install Capacitor Native Navigation in your app we add the required packages to your app... these are the packages usually required for a React app using ReactRouter:

```shell
pnpm add capacitor-native-navigation capacitor-native-navigation-react capacitor-native-navigation-react-router
```

### Tips & Tricks

To use your local development server from your app, we need to setup some package scripts and tweak the Capacitor configuration like we have done in our [example](./packages/example) app:

In `package.json` add the following scripts:

```json
{
  "scripts": {
    "cap:local": "CAP_SERVER=http://$(ipconfig getifaddr en0 || ipconfig getifaddr en1):5173/ cap sync",
    "start:host": "vite --host $(ipconfig getifaddr en0 || ipconfig getifaddr en1)",
  }
}
```

In your `capacitor.config.ts`, add to your `server` configuration:

```typescript
import process from 'process'

const config: CapacitorConfig = {
  ...,
	server: {
		/* Set the CAP_SERVER environment variable when running cap copy or cap sync; see the cap:local npm script */
		url: process.env.CAP_SERVER || undefined,
	},
}
```

If you see an error on the `process` module import and your project is a Vite project, you may need to add `capacitor.config.ts` to the list of files to include in `tsconfig.node.json`.

To use, now run:

```shell
pnpm cap:local
pnpm start:host
```

Then build and run the native app. Changes you make should automatically reload in your app.

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
import { NativeNavigation } from 'capacitor-native-navigation'
import { initReact, NativeNavigationReactRootProps } from 'capacitor-native-navigation-react'

function Root(props: NativeNavigationReactRootProps): JSX.Element {
  const { pathname, search, hash, state } = props

  ...
}

initReact({
  plugin: NativeNavigation,
  root: Root,
})
```

[capacitor-native-navigation-react](./packages/react)

### Differences to React DOM

Capacitor Native Navigation tries as much as possible to be a seamless adaptation of React DOM to native, however there are some differences that you should be aware of.

Each view is mounted as a separate React portal. Views in a _stack_ remain mounted, even when not the frontmost in the stack, so they continue to respond to state changes (such as Redux, or timers), even if they're not currently visible. Be careful not to trigger unintentional side-effects such as navigation from a component that is not visible.

## React Router

Capacitor Native Navigation transparently integrates with [React Router](https://reactrouter.com/) so that the `navigate()` function
translates pushes, replaces and backs into their native equivalent. This enables Capacitor Native Navigation to be very loosely coupled
with your app; you start with a separate native entrypoint, but then reuse all of you web routing and navigating (`navigate`, `Link`, etc)
code.

The root view component receives all of the location information from Capacitor Native Navigation in its props. We use `Router` from `react-router-dom` to create the root router with a custom `Navigator`.

```typescript
import { Route, Router, Routes } from 'react-router-dom'
import { NativeNavigation } from 'capacitor-native-navigation'
import { NativeNavigationReactRootProps } from 'capacitor-native-navigation-react'
import { useNativeNavigationNavigator } from 'capacitor-native-navigation-react-router'

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

[capacitor-native-navigation-react-router](./packages/react-router)

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

## Safe Area and Toolbar Margins for Mobile Web Content

When developing for mobile, it’s crucial to ensure that your content respects the safe area insets, which prevent content from overlapping with native elements like the navigation bar, home indicator, and toolbars. This plugin provides CSS variables that help manage these safe areas effectively.

### Injecting Safe Area Insets

The plugin injects CSS variables based on the safe area insets and toolbar height, allowing you to control margins and padding to avoid overlap with native UI components. These values adapt dynamically based on the device’s safe areas.

#### Injected CSS Variables

Here’s a breakdown of the CSS variables injected by the plugin:

At a minimum, your app should align its content with the `native-navigation-inset` values. Doing so ensures that your content is positioned correctly below the toolbar (if it’s visible) or beneath the status bar (if the toolbar is hidden).

* **Navigation Insets**: A simplified safe area inset that accomodates the toolbar if present
  * `--native-navigation-inset-top`
  * `--native-navigation-inset-bottom`
  * `--native-navigation-inset-left`
  * `--native-navigation-inset-right`

* **Safe Content Insets**: The insets where it is both safe for gesutres and safe for drawing (ignoring toolbar appearance)
  * `--native-navigation-safe-content-inset-top`
  * `--native-navigation-safe-content-inset-bottom`
  * `--native-navigation-safe-content-inset-left`
  * `--native-navigation-safe-content-inset-right`

* **Safe Drawing Insets**: The insets where it is both safe for drawing (ignoring toolbar appearance)
  * `--native-navigation-safe-drawing-inset-top`
  * `--native-navigation-safe-drawing-inset-bottom`
  * `--native-navigation-safe-drawing-inset-left`
  * `--native-navigation-safe-drawing-inset-right`

* **Safe Gestures Insets**: The insets where it is both safe for gestures (ignoring toolbar appearance)
  * `--native-navigation-safe-gestures-inset-top`
  * `--native-navigation-safe-gestures-inset-bottom`
  * `--native-navigation-safe-gestures-inset-left`
  * `--native-navigation-safe-gestures-inset-right`

* **Toolbar Height**
  * `--native-navigation-toolbar-height`: The height of the toolbar if present, useful for additional margin adjustments.

### Using Insets in CSS

To apply these values, you can use CSS `calc()` to set padding or margins based on the device’s safe area. Here’s an example for setting padding on the `body` element:

```css
body {
  padding-top: calc(var(--native-navigation-inset-top, env(safe-area-inset-top, 0)));
  padding-bottom: calc(var(--native-navigation-inset-bottom, env(safe-area-inset-bottom, 0)));
  padding-left: calc(var(--native-navigation-inset-left, env(safe-area-inset-left, 0)));
  padding-right: calc(var(--native-navigation-inset-right, env(safe-area-inset-right, 0)));
}
```

## Work in progress

* Android tabs support

## Developing

To build all of the packages:

```shell
nvm use
pnpm install
pnpm build
```

This repository uses [`changesets`](https://github.com/changesets/changesets). A changeset file should be included with most commits:

```shell
pnpm changeset
```

Include the file generated in `./changeset` in your commit.

### Example app

Build and run the [Example app](./packages/example) to try it out.

### Linking to your app in development

Create global pnpm links for the current node version for the packages in this repository:

```shell
pnpm run link
```

Then in your app (adjust the package list to match the packages you have installed):

```shell
pnpm link --global capacitor-native-navigation capacitor-native-navigation-react capacitor-native-navigation-react-router
```

Remember this will break every time you run `pnpm install`, so to make it semi-permanent change the `package.json` to use
`link:./path/to/capacitor-native-navigation/packages/plugin` etc.

## Publishing

To publish a new version to npm we process the changesets files and then build, test, git tag and publish to npmjs.com.

```shell
nvm use
pnpm install
pnpm release:version
```

Commit the changed files, and then:

```shell
pnpm release
```
