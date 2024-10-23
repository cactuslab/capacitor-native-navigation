# Capacitor Native Navigation example app

This example includes web, iOS and Android projects to test with while developing and evaluating Capacitor Native Navigation.

## Web

```shell
nvm use
pnpm install
pnpm start
```

Then navigate to the URL displayed.

## iOS

Prerequisites:

* `rbenv` for managing Ruby versions

Setup the iOS toolchain using Ruby and bundler to install Cocoapods:

```shell
cd ios
gem install bundler
bundle install
cd ..
```

From time to time we can update the iOS toolchain to the latest versions:

```shell
cd ios
bundle update
cd ..
```

## Development

Update the iOS (and Android) project with the latest plugin code, expecting to connect to a dev server running on your local machine:

```shell
nvm use
pnpm cap:local
```

This script configures the iOS app to use the example app's web code by connecting directly to `vite`. You can see that by inspecting
the `server.url` property in `ios/App/App/capacitor.config.json`. So we also need to run `vite` and bind it to the LAN interface
(otherwise the app will fail with a "Failed to load page content" fatal error):

```shell
pnpm start:host
```

Open the iOS project; build and run the app:

```shell
open ios/App/App.xcworkspace
```

Open the Android folder in Android Studio; build and run the app. Or compile on the command-line:

```shell
cd android
gradle bundle
```

Changes in the example app's web code should cause the app to automatically refresh.

## Publishing

To setup the app to run with built-in web code (not using a local development server):

```shell
pnpm exec cap sync
```
