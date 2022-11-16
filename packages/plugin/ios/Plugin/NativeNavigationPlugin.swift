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
    
    @objc func setRoot(_ call: CAPPluginCall) {
        do {
            let options = try SetRootOptions.fromJSObject(call)
            
            Task {
                do {
                    let result = try await implementation.setRoot(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to set root: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func present(_ call: CAPPluginCall) {
        do {
            guard let componentValue = call.getObject("component") else {
                throw NativeNavigatorError.missingParameter(name: "component")
            }
            let component = try componentSpecFromJSObject(componentValue)
            
            let animated = call.getBool("animated", true)

            let options = PresentOptions(component: component, animated: animated)

            Task {
                do {
                    let result = try await implementation.present(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to present: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
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
                call.reject("Failed to dismiss: \(error)")
            }
        }
    }

    @objc func push(_ call: CAPPluginCall) {
        do {
            let options = try PushOptions.fromJSObject(call)

            Task {
                do {
                    let result = try await implementation.push(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to push: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func pop(_ call: CAPPluginCall) {
        do {
            let options = try PopOptions.fromJSObject(call)
            
            Task {
                do {
                    let result = try await implementation.pop(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to pop: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
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
        do {
            let options = try ResetOptions.fromJSObject(call)
            
            Task {
                do {
                    try await implementation.reset(options)
                    call.resolve()
                } catch {
                    call.reject("Failed to reset: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }
    
    @objc func get(_ call: CAPPluginCall) {
        do {
            let options = try GetOptions.fromJSObject(call)
            Task {
                do {
                    let result = try await implementation.get(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to get: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }
    
    @objc public func viewReady(_ call: CAPPluginCall) {
        do {
            let options = try ViewReadyOptions.fromJSObject(call)
            
            Task {
                do {
                    try await implementation.viewReady(options)
                    call.resolve()
                } catch {
                    call.reject("Failed to handle view ready: \(error)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }

}
