package com.cactuslab.capacitor.nativenavigation

import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.LayoutInflater
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import androidx.navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding
import com.cactuslab.capacitor.nativenavigation.types.*
import com.cactuslab.capacitor.nativenavigation.ui.NavigationActivity
import com.cactuslab.capacitor.nativenavigation.ui.ScreenFragmentDirections
import com.getcapacitor.Bridge
import com.getcapacitor.PluginCall
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID
import android.os.Message
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.navigation.navOptions

class NativeNavigation(val plugin: NativeNavigationPlugin, val viewModel: NativeNavigationViewModel) {

    init {
        viewModel.nativeNavigation = this
    }

    val components : MutableMap<String, CreateOptions> = mutableMapOf()
    var binding: ActivityNavigationBinding? = null
    var navController: NavController? = null

    var nextWindowAction: CreateOptions? = null
    var currentStackId: String? = null

    fun create(options: CreateOptions, activity: AppCompatActivity, call: PluginCall, bridge: Bridge) {
        val id = options.id ?: UUID.randomUUID().toString()
        options.id = id
        components[id] = options

        val result = CreateResult(id)
        call.resolve(result.toJSObject())

//        bridge.saveCall(call)
//        activity.runOnUiThread {
//            val action = ScreenFragmentDirections.actionGlobalNavScreen("This is a test", callbackId = call.callbackId)
//            navController?.navigate(action)
////            navController?.
//        }

//
//
//
//        plugin.notifyCreateView(options.viewOptions?.path ?: "", id, options.viewOptions?.state)
    }

    fun prepare(options: PrepareOptions ) {
        val id = options.id
        nextWindowAction = components[id]
    }

    fun reset(context: Context, activity: AppCompatActivity, call: PluginCall) {
        val binding = ActivityNavigationBinding.inflate(LayoutInflater.from(context)).also { this.binding = it }
        activity.addContentView(binding.root, ViewGroup.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT))

        navController = activity.supportFragmentManager.findFragmentById(binding.navigationHost.id)?.findNavController()

        navController!!.addOnDestinationChangedListener { controller, destination, arguments ->

            Log.d(TAG, "Navigated to ${destination.displayName}")

        }

        activity.onBackPressedDispatcher.addCallback(object: OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                Log.d(TAG, "Back pressed callback")
                navController?.previousBackStackEntry?.let {
                    navController?.navigateUp()
                }

            }
        })

        call.resolve()
    }

    fun setRoot(options: SetRootOptions, context: Context, activity: AppCompatActivity, call: PluginCall) {
        val createOptions = components[options.id]
        Log.d(TAG, "Asked to SetRoot: ${options.id} for createOptions: $createOptions")


        if (createOptions == null) {
            call.reject("Root id ${options.id} doesn't exist. Please create it first.")
            return
        }

        nextWindowAction = createOptions

        val navController = navController ?: return

        plugin.activity.runOnUiThread {

            when (createOptions.type) {
                ComponentType.STACK -> {
                    val option = createOptions.stackOptions?.stack?.last { opts -> opts.type == ComponentType.VIEW }

                    currentStackId = createOptions.id
                    plugin.notifyCreateView(option!!.viewOptions!!.path, options.id, option.viewOptions?.state)
                    // We want to push on the last item in the stack, but we also want to insert a bunch of actions into the backstack
                    val action = ScreenFragmentDirections.actionGlobalNavScreen(options.id)

                    navController.navigate(action, navOptions { anim { enter = -1; exit = -1; popEnter = -1; popExit = -1 } })
                }
                ComponentType.TABS -> {

                }
                ComponentType.VIEW -> {
                    plugin.notifyCreateView(createOptions.viewOptions!!.path, options.id, createOptions.viewOptions?.state)

                    val action = ScreenFragmentDirections.actionGlobalNavScreen(options.id)
                    navController.navigate(action)
                }
            }
        }

        call.resolve()

//        options
//        plugin.notifyCreateView("", options.id, null)
    }

    fun present(options: PresentOptions, call: PluginCall) {
        Log.d(TAG, "Asked to present: ${options.id}, animated: ${options.animated}")
        val id = options.id
        val result = PresentResult(id)
        call.resolve(result.toJSObject())
    }

    fun push(options: PushOptions, call: PluginCall) {
        //val id = options.stackId ?: UUID.randomUUID().toString()

        val createOptions = components[options.id]
        if (createOptions == null) {
            call.reject("Asked to push a view ${options.id} that hasn't been first created")
            return
        }

        nextWindowAction = createOptions

        val navController = navController ?: return

        plugin.activity.runOnUiThread {

            when (createOptions.type) {
                ComponentType.STACK -> {
                    val option = createOptions.stackOptions?.stack?.last { opts -> opts.type == ComponentType.VIEW }
                    currentStackId = createOptions.id
                    plugin.notifyCreateView(option!!.viewOptions!!.path, options.id, option.viewOptions?.state)
                    // We want to push on the last item in the stack, but we also want to insert a bunch of actions into the backstack
                    val action = ScreenFragmentDirections.actionGlobalNavScreen(options.id)
                    navController.navigate(action, navOptions { anim { enter = -1; exit = -1; popEnter = -1; popExit = -1 } })
                }
                ComponentType.TABS -> {

                }
                ComponentType.VIEW -> {
                    plugin.notifyCreateView(createOptions.viewOptions!!.path, options.id, createOptions.viewOptions?.state)

                    val action = ScreenFragmentDirections.actionGlobalNavScreen(options.id)
                    navController.navigate(action)
                }
            }
        }

        call.resolve()

        val stackId = currentStackId ?: ""
        Log.d(TAG, "Asked to push: ${options.id} on stack:${stackId}, animated: ${options.animated}")

        val result = PushResult(stackId)
        call.resolve(result.toJSObject())
    }


    fun windowOpen(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {

        val navController = navController ?: return false

        val component = nextWindowAction ?: return false
        nextWindowAction = null

//        when (component.viewOptions) {
//            is PushOptions -> {
//
//            }
//        }

        Log.d(TAG, "windowOpen with url ${view!!.url!!}")
        viewModel.setHtml(view!!.url!!)

        resultMsg?.let {
            Log.d(TAG, "Posting window open with a message ${component.id}")
            viewModel.postWindowOpen(message = it, id = component.id!!)
        }

//        // TODO: Use component to decide on the direction of this navigation
//        plugin.activity.runOnUiThread {
//            val action = ScreenFragmentDirections.actionGlobalNavScreen("This is a test", callbackId = null, resultMessage = resultMsg)
//            navController.navigate(action)
//        }

        return true
    }

    companion object {
        private const val TAG = "NativeNavigation"
    }

}