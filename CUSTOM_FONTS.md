# Custom Fonts

Both Android and iOS support `.ttf` font files.

## iOS

### Step 1

Add the font files into Xcode by dragging and dropping them into the `App` project.

### Step 2

Update the `Info.plist` file to list the names of your custom font files.

```plist
<key>UIAppFonts</key>
<array>
    <string>MyCustomFont-Bold.ttf</string>
    <string>MyCustomFont-Regular.ttf</string>
</array>
```

## Android

### Step 1

Create a `fonts` folder in your android `assets` folder. Eg. `android/app/src/main/assets/fonts/`

Do not use Android Studio to insert your fonts. The only way that this plugin can read the font file is when it is loaded into the package without any special packaging.

### Step 2

Add all of your custom font files into the `fonts` folder and rename them to the format `fontfamily_style.ttf` where fontfamily is the name of the Font and `style` is `bold`, `italic` etc. The regular weight doesn't need the `style` suffix, eg `solway.ttf` and `solway_bold.ttf`. You should use only lowercase names with underscores.

## Native Navigation

Use the font family name as the name of the font wherever a `FontOptions` is available. eg

```ts
font: {
    name: 'Solway',
    size: 26,
}
```
