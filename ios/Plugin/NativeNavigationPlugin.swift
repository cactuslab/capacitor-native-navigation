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
            call.reject(NativeNavigatorError.missingParameter(name: "type").localizedDescription)
            return
        }
        guard let type = ComponentType(rawValue: typeString) else {
            call.reject(NativeNavigatorError.invalidParameter(name: "type", value: typeString).localizedDescription)
            return
        }
        
        var options = CreateOptions(type: type)
        
        options.id = call.getString("id")
        
        if let modalPresentationStyleString = call.getString("modalPresentationStyle") {
            if let modalPresentationStyleValue = ModalPresentationStyle(rawValue: modalPresentationStyleString) {
                options.modalPresentationStyle = modalPresentationStyleValue
            } else {
                call.reject(NativeNavigatorError.invalidParameter(name: "modalPresentationStyle", value: modalPresentationStyleString).localizedDescription)
                return
            }
        }
        
        switch type {
        case .stack:
            let stackOptions = StackOptions()
            options.stackOptions = stackOptions
        case .tabs:
            guard let tabs = call.getArray("tabs") else {
                call.reject(NativeNavigatorError.missingParameter(name: "tabs").localizedDescription)
                return
            }
            
//            var tabsSuboptions = [CreateOptions]()
//            for tab in tabs {
//                guard let tab2 = tab as? Dictionary<String, JSValue> else {
//                    call.reject(NativeNavigatorError.invalidParameter(name: "tabs", value: tab).localizedDescription)
//                }
//
////                tabsSuboptions.append(CreateOptions())
//            }
//
//            let tabsOptions = TabsOptions(tabs: tabsSuboptions)
//            options.tabsOptions = tabsOptions
        case .view:
            guard let path = call.getString("path") else {
                call.reject(NativeNavigatorError.missingParameter(name: "path").localizedDescription)
                return
            }
            
            var viewOptions = ViewOptions(path: path)
            
            if let state = call.getObject("state") {
                viewOptions.state = state
            }
            options.viewOptions = viewOptions
        }

        let finalOptions = options
        Task {
            do {
                let result = try await implementation.create(finalOptions)
                call.resolve(result.toPluginResult())
            } catch {
                call.reject("Failed to create: \(error)")
            }
        }
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
        guard let id = call.getString("id") else {
            call.reject(NativeNavigatorError.missingParameter(name: "id").localizedDescription)
            return
        }
        
        var options = ComponentOptions(id: id)
        
        options.title = call.getString("title")
        
        if let button = call.getObject("rightButton") {
            var buttonOptions = ButtonOptions()
            buttonOptions.title = button["title"] as? String
            options.rightButton = buttonOptions
        }
        
        let finalOptions = options
        Task {
            do {
                try await implementation.setOptions(finalOptions)
                call.resolve()
            } catch {
                call.reject("Failed to set options: \(error)")
            }
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
