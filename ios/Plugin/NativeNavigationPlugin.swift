import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(NativeNavigationPlugin)
public class NativeNavigationPlugin: CAPPlugin {
    private var implementation: NativeNavigation! = nil

    @objc override public func load() {
        self.implementation = NativeNavigation(bridge: self.bridge!, plugin: self)
    }

    @objc func create(_ call: CAPPluginCall) {
        guard let typeString = call.getString("type") else {
            call.reject("Missing \"type\"")
            return
        }
        guard let type = RootType(rawValue: typeString) else {
            call.reject("Invalid \"type\": \(typeString)")
            return
        }

        guard let name = call.getString("name") else {
            call.reject("Missing \"name\"")
            return
        }

        var presentationStyle: PresentationStyle? = nil
        if let presentationStyleString = call.getString("presentationStyle") {
            if let presentationStyleValue = PresentationStyle(rawValue: presentationStyleString) {
                presentationStyle = presentationStyleValue
            } else {
                call.reject("Invalid \"presentationStyle\": \(presentationStyleString)")
                return
            }
        }
        let finalPresentationStyle = presentationStyle

        Task {
            do {
                let createdName = try await implementation.create(CreateOptions(type: type, name: name, presentationStyle: finalPresentationStyle))
                call.resolve([ "root": createdName ])
            } catch {
                call.reject("Failed to create: \(error)")
            }
        }
    }

    @objc func present(_ call: CAPPluginCall) {
        let animated = call.getBool("animated", true)

        var presentOptions = PresentOptions(animated: animated)

        let rootName = call.getString("root")
        let rootOptions = call.getObject("root")

        if rootName == nil && rootOptions == nil {
            call.reject("Missing \"root\"")
            return
        }

        presentOptions.rootName = rootName

        if let presentationStyleString = call.getString("presentationStyle") {
            if let presentationStyleValue = PresentationStyle(rawValue: presentationStyleString) {
                presentOptions.presentationStyle = presentationStyleValue
            } else {
                call.reject("Invalid \"presentationStyle\": \(presentationStyleString)")
                return
            }
        }
        
        if let modalPresentationStyleString = call.getString("modalPresentationStyle") {
            if let modalPresentationStyleValue = ModalPresentationStyle(rawValue: modalPresentationStyleString) {
                presentOptions.modalPresentationStyle = modalPresentationStyleValue
            } else {
                call.reject("Invalid \"modalPresentationStyle\": \(modalPresentationStyleString)")
                return
            }
        }

        let finalPresentOptions = presentOptions

        Task {
            do {
                let presentedRootName = try await implementation.present(finalPresentOptions)
                call.resolve([ "root": presentedRootName ])
            } catch {
                call.reject("Failed to present: \(error)")
            }
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        guard let root = call.getString("root") else {
            call.reject("Missing \"root\"")
            return
        }

        let animated = call.getBool("animated", true)

        Task {
            do {
                try await implementation.dismiss(root, animated: animated)
                call.resolve([ "root": root ])
            } catch {
                call.reject("Failed to present: \(error)")
            }
        }
    }

    @objc func createView(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else {
            call.reject("Missing \"path\"")
            return
        }

        Task {
            do {
                let result = try await implementation.createView(ViewOptions(path: path))
                call.resolve([ "viewId": result ])
            } catch {
                call.reject("Failed to push: \(error)")
            }
        }
    }

    @objc func push(_ call: CAPPluginCall) {
        let stackName = call.getString("stack")
        guard let viewId = call.getString("viewId") else {
            call.reject("Missing \"viewId\"")
            return
        }

        let animated = call.getBool("animated", true)

        Task {
            do {
                let result = try await implementation.push(PushOptions(stack: stackName, animated: animated, viewId: viewId))
                call.resolve([
                    "stack": result.stack,
                ])
            } catch {
                call.reject("Failed to push: \(error)")
            }
        }
    }

    @objc func pop(_ call: CAPPluginCall) {
//        if let location = call.getObject("location") {
//            implementation.push(location)
//        }
        call.resolve()
    }

}
