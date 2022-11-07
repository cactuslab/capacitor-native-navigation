package com.cactuslab.capacitor.nativenavigation

import android.content.Context
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import androidx.navigation.fragment.findNavController
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding
import com.cactuslab.capacitor.nativenavigation.types.*
import com.getcapacitor.PluginCall
import java.util.*
import kotlin.collections.MutableMap
import kotlin.collections.forEach
import kotlin.collections.last
import kotlin.collections.mutableMapOf
import kotlin.collections.set

class NativeNavigation(val plugin: NativeNavigationPlugin, val viewModel: NativeNavigationViewModel) {

    init {
        viewModel.nativeNavigation = this
    }

    private val components : MutableMap<String, ComponentSpec> = mutableMapOf()
    var binding: ActivityNavigationBinding? = null
    var navController: NavController? = null

    var nextWindowAction: ComponentSpec? = null
    var currentStackId: String? = null

    var onBackPressedCallback: OnBackPressedCallback? = null

    private fun insertComponent(component: ComponentSpec) {
        components[component.id] = component
        when (component) {
            is StackSpec -> {
                component.stack?.forEach { insertComponent(it) }
            }
            is TabsSpec -> {
                component.tabs.forEach { insertComponent(it as ComponentSpec) }
            }
            else -> {}
        }
    }

    fun componentSpecForId(id: String): ComponentSpec? {
        return components.get(id)
    }

    fun setOptions(options: SetComponentOptions) {
        val spec = components.get(options.id)!!
        spec.options = options.options

        viewModel.postSetOptions(options, options.id)
    }

    fun reset(call: PluginCall) {

        val binding = binding ?: return

        binding.root.visibility = View.GONE
//        binding.root.parent?.let { viewParent ->
//            (viewParent as ViewGroup).removeView(binding.root)
//        }

        navController?.setGraph(R.navigation.native_navigation, startDestinationArgs = Bundle())
//        this.binding = null

        onBackPressedCallback?.remove()
        onBackPressedCallback = null

//        navController = null
        nextWindowAction = null
        currentStackId = null

        components.clear()

        call.resolve()
    }

    private fun setupBackPressedHandler() {
        val activity = plugin.activity
        val navController = navController!!
        onBackPressedCallback?.remove()
        onBackPressedCallback = null
        onBackPressedCallback = object: OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                Log.d(TAG, "Back pressed callback")
                val didNavigate = navController.previousBackStackEntry?.let { backStackEntry ->
                    navController.navigateUp()
                } ?: false

                if (!didNavigate) {
                    activity.finish()
                }
            }
        }.also { activity.onBackPressedDispatcher.addCallback(it) }
    }

    private fun navControllerOrCreate() = navController ?: kotlin.run {
            val context = plugin.context
            val activity = plugin.activity
            val binding = ActivityNavigationBinding.inflate(LayoutInflater.from(context)).also { this.binding = it }
            activity.addContentView(binding.root, ViewGroup.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT))
            activity.supportFragmentManager.findFragmentById(binding.navigationHost.id)!!.findNavController().also { navController ->
                this.navController = navController
                navController.addOnDestinationChangedListener { controller, destination, arguments ->
                    Log.d(TAG, "Navigated to ${destination.displayName}")
                }

                setupBackPressedHandler()
            }
        }

    fun notifyCreateView(id: String) {
        val component = components[id] as ViewSpec
        nextWindowAction = component
        plugin.notifyCreateView(component.path, component.id, component.state)
    }

    fun notifyDestroyView(componentId: String) {
        plugin.notifyDestroyView(componentId)
    }

    fun notifyClick(buttonId: String, componentId: String) {
        plugin.notifyClick(buttonId, componentId)
    }

    fun setRoot(options: SetRootOptions, context: Context, activity: AppCompatActivity, call: PluginCall) {
        val component = options.component
        insertComponent(component)


        Log.d(TAG, "Asked to SetRoot: ${component.id} for createOptions: $component")

        plugin.activity.runOnUiThread {
            val navController = navControllerOrCreate()
            setupBackPressedHandler()
            binding?.root?.visibility = View.VISIBLE

            when (component) {
                is StackSpec -> {
                    currentStackId = component.id
                    val screen = component.stack?.last()
                    screen?.let {
                        navController.setGraph(R.navigation.native_navigation, startDestinationArgs = Bundle().also { it.putString("optionsId", screen.id) })
                    }
                }
                is TabsSpec -> {

                }
                is ViewSpec -> {
                    navController.setGraph(R.navigation.native_navigation, startDestinationArgs = Bundle().also { it.putString("optionsId", component.id) })
                }
                else -> {}
            }
        }

        call.resolve()
    }

    fun present(options: PresentOptions, call: PluginCall) {
//        Log.d(TAG, "Asked to present: ${options.id}, animated: ${options.animated}")
//        val id = options.id
//        val result = PresentResult(id)
//        call.resolve(result.toJSObject())
    }

    fun pop(call: PluginCall, activity: AppCompatActivity) {
        activity.onBackPressedDispatcher.onBackPressed()
        call.resolve()
    }

    fun push(options: PushOptions, call: PluginCall) {

        val component = options.component
        insertComponent(component)

        val stackId = currentStackId ?: run {
            UUID.randomUUID().toString().also { currentStackId = it }
        }

        Log.d(TAG, "Asked to push: ${component.id} for createOptions: $component")

        plugin.activity.runOnUiThread {
            val navController = navControllerOrCreate()
            val action = NativeNavigationDirections.actionGlobalNavScreen(component.id)
            navController.navigate(action)
        }

        val result = PushResult(stackId )
        call.resolve(result.toJSObject())

    }


    fun windowOpen(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {

        val component = nextWindowAction ?: return false
        nextWindowAction = null

        Log.d(TAG, "windowOpen with url ${view!!.url!!}")
        viewModel.setHtml(view.url!!)

        resultMsg?.let {
            Log.d(TAG, "Posting window open with a message ${component.id}")
            viewModel.postWindowOpen(message = it, id = component.id)
        }

        return true
    }

    companion object {
        private const val TAG = "NativeNavigation"
    }

}