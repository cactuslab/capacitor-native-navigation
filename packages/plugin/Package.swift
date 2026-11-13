// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorNativeNavigation",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorNativeNavigation",
            targets: ["NativeNavigationPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", "6.0.0"..<"9.0.0")
    ],
    targets: [
        .target(
            name: "NativeNavigationPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/NativeNavigationPlugin"),
        .testTarget(
            name: "NativeNavigationPluginTests",
            dependencies: ["NativeNavigationPlugin"],
            path: "ios/Tests/NativeNavigationPluginTests")
    ]
)