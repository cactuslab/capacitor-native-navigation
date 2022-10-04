package com.cactuslab.capacitor.nativenavigation;

import com.cactuslab.capacitor.nativenavigation.exceptions.InvalidParameterException;
import com.cactuslab.capacitor.nativenavigation.exceptions.MissingParameterException;
import com.cactuslab.capacitor.nativenavigation.types.CreateOptions;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeNavigation")
public class NativeNavigationPlugin extends Plugin {

    private NativeNavigation implementation = new NativeNavigation();

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
    }

    @PluginMethod
    public void create(PluginCall call) {

        try {
            CreateOptions options = CreateOptions.fromJSObject(call.getData());
            call.reject("Made an options but wasn't ready yet");

        } catch (MissingParameterException | InvalidParameterException e) {
            call.reject(e.getLocalizedMessage());
        }

    }
}
