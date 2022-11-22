#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(NativeNavigationPlugin, "NativeNavigation",
           CAP_PLUGIN_METHOD(prepare, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(present, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(dismiss, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(push, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(pop, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setOptions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(reset, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(get, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(viewReady, CAPPluginReturnPromise);

           /* A workaround for https://github.com/ionic-team/capacitor/issues/5959 */
           CAP_PLUGIN_METHOD(removeAllListeners, CAPPluginReturnPromise);
)
