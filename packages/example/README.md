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

Setup the iOS toolchain:

```shell
cd ios
gem install bundler
bundle install
cd ..
```

```shell
pnpm cap:local
```
