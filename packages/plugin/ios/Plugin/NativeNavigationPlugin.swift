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
    
    @objc override public func shouldOverrideLoad(_ navigationAction: WKNavigationAction) -> NSNumber? {
        if navigationAction.targetFrame?.isMainFrame ?? false {
            /* Whenever there is navigation or a page load in Capacitor's webview we must reset the UI that this plugin has created
             otherwise whatever happens in Capacitor's webview will not be visible as our UI will cover it.
             
             We ignore non-mainframe loads
             */
            CAPLog.print("🤖 NativeNavigation: resetting plugin for navigation to \(navigationAction)")
            
            Task {
                do {
                    /* Remove all listeners */
                    self.eventListeners?.removeAllObjects()
                    
                    /* Reset the UI */
                    try await implementation.reset(ResetOptions(animated: false))
                } catch {
                    CAPLog.print("🤖 NativeNavigation: failed to reset plugin on page load: \(error.localizedDescription)")
                }
            }
        }
        return nil
    }

    @objc func present(_ call: CAPPluginCall) {
        do {
            let options = try PresentOptions.fromJSObject(call)

            Task {
                do {
                    let result = try await implementation.present(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to present: \(error.localizedDescription)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        do {
            let options = try DismissOptions.fromJSObject(call)
            
            Task {
                do {
                    let result = try await implementation.dismiss(options)
                    call.resolve(result.toPluginResult())
                } catch {
                    call.reject("Failed to dismiss: \(error.localizedDescription)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
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
                    call.reject("Failed to push: \(error.localizedDescription)")
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
                    call.reject("Failed to pop: \(error.localizedDescription)")
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
                    call.reject("Failed to set options: \(error.localizedDescription)")
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
                    call.reject("Failed to reset: \(error.localizedDescription)")
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
                    call.reject("Failed to get: \(error.localizedDescription)")
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
                    call.reject("Failed to handle view ready: \(error.localizedDescription)")
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }

}
