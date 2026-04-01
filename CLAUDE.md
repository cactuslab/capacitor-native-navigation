# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Capacitor Native Navigation is a Capacitor plugin that lets React DOM apps use native navigation components (UINavigationController, UITabBarController on iOS; Fragments on Android). It bridges React views with native view controllers/fragments so each "screen" is a real native navigation entry.

## Monorepo Structure

pnpm workspace with packages in `packages/`:

- **`plugin`** (`capacitor-native-navigation`) — Core Capacitor plugin: TypeScript API, iOS Swift implementation, Android Kotlin implementation, web fallback
- **`react`** (`capacitor-native-navigation-react`) — React integration: view lifecycle, portal rendering, `initReact()`
- **`react-router`** (`capacitor-native-navigation-react-router`) — React Router 6 integration: custom Navigator, modal path matching
- **`history`** (`capacitor-native-navigation-history`) — Alternative integration using History API directly
- **`example`** — Example Vite + React app with iOS and Android native projects

## Build Commands

```shell
nvm use                  # Node 22
pnpm install             # Install all dependencies
pnpm build               # Build all packages (TypeScript + Rollup)
pnpm watch               # Watch mode for development
pnpm clean               # Remove all dist/ directories
pnpm test                # Run tests across packages
pnpm --filter <pkg> build # Build a single package
```

### Verification (platform builds)

```shell
pnpm --filter capacitor-native-navigation verify        # All platforms
pnpm --filter capacitor-native-navigation verify:ios     # xcodebuild
pnpm --filter capacitor-native-navigation verify:android # Gradle build + test
pnpm --filter capacitor-native-navigation verify:web     # TypeScript compile
```

### Formatting

```shell
pnpm --filter capacitor-native-navigation fmt  # ESLint + Prettier + SwiftLint autofix
```

### Example App

```shell
cd packages/example
pnpm start               # Vite dev server
pnpm start:host          # Dev server on local network
pnpm cap:local           # Sync Capacitor for local dev
```

## Code Style

- **No semicolons** (ESLint `semi: never`)
- **Tabs** for indentation
- **Single quotes**
- Prettier config: `@ionic/prettier-config`
- SwiftLint config: `@ionic/swiftlint-config`
- TypeScript strict mode, target ES2020, JSX: `react`

## Architecture

### Native-JS Bridge

The plugin API (`packages/plugin/src/definitions.ts`) defines the bridge: `present()`, `dismiss()`, `push()`, `pop()`, `update()`, `reset()`, `get()`, `message()`. These map to Capacitor plugin calls handled by:

- **iOS**: `packages/plugin/ios/Plugin/` — Swift, UIKit-based. `NativeNavigationPlugin.swift` is the entry point, `NativeNavigation.swift` manages view controllers.
- **Android**: `packages/plugin/android/src/main/java/com/cactuslab/capacitor/nativenavigation/` — Kotlin, Fragment-based. `NativeNavigationPlugin.kt` is the entry point.
- **Web**: `packages/plugin/src/web.ts` — Fallback for browser development.

### Component Model

- **Views**: Atomic screens (one web route = one native view controller/fragment)
- **Stacks**: Push/pop navigation (UINavigationController / Fragment back stack)
- **Tabs**: Tab bar with independent stacks (iOS only via UITabBarController)
- **Modals**: Presented over existing content

### React Integration

`initReact()` registers view lifecycle handlers. Each native view gets a React portal. Views remain mounted when off-screen to preserve state. The `CreateView` / `UpdateView` / `DestroyView` event system drives the lifecycle.

### Type Safety

Uses opaque/branded types for `ComponentId`, `ButtonId`, `ComponentAlias` to prevent accidental mixing of ID types.

## Known Issues

### Android WebView lifecycle
WebViews are created with Activity context but cached in ViewModel (survives config changes). The `NativeNavigationViewModel` holds a strong reference to `NativeNavigation` which holds `Plugin` which holds Activity — a potential leak chain on configuration changes.

## Publishing

Uses Changesets for version management:
```shell
pnpm changeset           # Create changeset
pnpm release:version     # Update versions
pnpm release             # Clean, build, test, publish
```
