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
        do {
            let options = try CreateOptions.fromJSObject(call)

            Task {
                do {
                    let result = try await implementation.create(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to create: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }
    
    @objc func prepare(_ call: CAPPluginCall) {
        call.resolve()
    }
    
    @objc func setRoot(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject(NativeNavigatorError.missingParameter(name: "id").localizedDescription)
            return
        }

        let options = SetRootOptions(id: id)

        Task {
            do {
                try await implementation.setRoot(options)
                call.resolve()
            } catch {
                call.reject("Failed to set root: \(error)")
            }
        }
    }

    @objc func present(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject(NativeNavigatorError.missingParameter(name: "id").localizedDescription)
            return
        }
        let animated = call.getBool("animated", true)

        let options = PresentOptions(id: id, animated: animated)

        Task {
            do {
                let result = try await implementation.present(options)
                call.resolve(result.toPluginResult())
            } catch {
                call.reject("Failed to present: \(error)")
            }
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject(NativeNavigatorError.missingParameter(name: "id").localizedDescription)
            return
        }

        let animated = call.getBool("animated", true)
        let options = DismissOptions(id: id, animated: animated)

        Task {
            do {
                let result = try await implementation.dismiss(options)
                call.resolve(result.toPluginResult())
            } catch {
                call.reject("Failed to present: \(error)")
            }
        }
    }

    @objc func push(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject(NativeNavigatorError.missingParameter(name: "id").localizedDescription)
            return
        }

        let animated = call.getBool("animated", true)
        var options = PushOptions(id: id, animated: animated)
        
        options.stack = call.getString("stack")
        
        let finalOptions = options

        Task {
            do {
                let result = try await implementation.push(finalOptions)
                call.resolve(result.toPluginResult())
            } catch {
                call.reject("Failed to push: \(error)")
            }
        }
    }

    @objc func pop(_ call: CAPPluginCall) {
        let animated = call.getBool("animated", true)

        var options = PopOptions(animated: animated)

        options.stack = call.getString("stack")
        
        let finalOptions = options
        
        Task {
            do {
                let result = try await implementation.pop(finalOptions)
                call.resolve(result.toPluginResult())
            } catch {
                call.reject("Failed to pop: \(error)")
            }
        }
    }
    
    @objc func setOptions(_ call: CAPPluginCall) {
        do {
            let options = try SetComponentOptions.fromJSObject(call)
            Task {
                do {
                    try await implementation.setOptions(options)
                    call.resolve()
                } catch {
                    call.reject("Failed to set options: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc public func reset(_ call: CAPPluginCall) {
        Task {
            do {
                try await implementation.reset()
                call.resolve()
            } catch {
                call.reject("Failed to reset: \(error)")
            }
        }
    }

}
