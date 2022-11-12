package com.cactuslab.capacitor.nativenavigation

import android.content.Context
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.NavType
import androidx.navigation.createGraph
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.fragment
import androidx.navigation.ui.AppBarConfiguration
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding
import com.cactuslab.capacitor.nativenavigation.types.*
import com.cactuslab.capacitor.nativenavigation.ui.BlankViewFragment
import com.cactuslab.capacitor.nativenavigation.ui.NavigationViewFragment
import com.getcapacitor.PluginCall
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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

    private var viewActions: MutableMap<String,() -> Unit> = mutableMapOf()

    var onBackPressedCallback: OnBackPressedCallback? = null
    private var webviewsCache: MutableMap<String, WebView> = mutableMapOf()

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
        Log.d(TAG, "setOptions -> $options")
        val spec = components.get(options.id)!!
        spec.options = options.options

        viewModel.postSetOptions(options, options.id)
    }

    fun reset(call: PluginCall) {

        viewActions.clear()

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

    private fun makeWebView(id: String? = null): WebView {
        val webView = WebView(plugin.context)
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.setGeolocationEnabled(true)
        settings.databaseEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                Log.d("CustomWebView", "Web view loading request ${request?.url} MainFrame:${request?.isForMainFrame}")
                return true
            }
        }

        id?.let {
            webviewsCache.put(id, webView)
        }

        return webView
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
        Log.d(TAG, "notifyDestroyView Started for $componentId")
        plugin.notifyDestroyView(componentId)
        viewModel.cleanUpComponentWithId(componentId)
        viewActions.remove(componentId)
        Log.d(TAG, "notifyDestroyView Completed for $componentId")
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
                        val webView = makeWebView(screen.id)
                        viewModel.postWebView(webView, screen.id)
                        notifyCreateView(screen.id)

                        viewActions[screen.id] = {
                            navController.setGraph(R.navigation.native_navigation, startDestinationArgs = Bundle().also { it.putString("optionsId", screen.id) })
                        }
                    }
                }
                is TabsSpec -> {

                }
                is ViewSpec -> {
                    val webView = makeWebView(component.id)
                    viewModel.postWebView(webView, component.id)
                    notifyCreateView(component.id)

                    viewActions[component.id] = {
                        navController.setGraph(R.navigation.native_navigation, startDestinationArgs = Bundle().also { it.putString("optionsId", component.id) })
                    }
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

            val webView = makeWebView(component.id)
            viewModel.postWebView(webView, component.id)
            notifyCreateView(component.id)

            viewActions[component.id] = {
                val action = NativeNavigationDirections.actionGlobalNavScreen(component.id)
                navController.navigate(action)
            }
//            plugin.activity.lifecycleScope.launch {
//                delay(400)
//                val action = NativeNavigationDirections.actionGlobalNavScreen(component.id)
//                navController.navigate(action)
//            }
        }

        val result = PushResult(stackId )
        call.resolve(result.toJSObject())

    }


    fun windowOpen(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {

        val component = nextWindowAction ?: return false
        nextWindowAction = null

        Log.d(TAG, "windowOpen with url ${view!!.url!!}")


        val webView = webviewsCache.get(component.id)!!

//        webView.loadDataWithBaseURL()

        resultMsg?.let { message ->
            val webViewTransport = message.obj!! as WebView.WebViewTransport
            webViewTransport.webView = webView
            Log.d(TAG, "Frag got signal to window open")
            message.sendToTarget()

//            Log.d(TAG, "Posting window open with a message ${component.id}")
//            viewModel.postWindowOpen(message = it, id = component.id)
        }

        viewModel.setHtml(view.url!!, webView)
        webviewsCache.remove(component.id)

        return true
    }

    fun viewReady(options: ViewReadyOptions) {
        val action = viewActions.remove(options.id)
        plugin.activity.runOnUiThread(action)
    }

    companion object {
        private const val TAG = "NativeNavigation"
    }

}