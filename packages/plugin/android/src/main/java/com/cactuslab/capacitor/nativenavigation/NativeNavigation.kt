package com.cactuslab.capacitor.nativenavigation

import android.annotation.SuppressLint
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
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.os.bundleOf
import androidx.fragment.app.FragmentTransaction
import androidx.lifecycle.lifecycleScope
import androidx.navigation.*
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.fragment
import androidx.navigation.ui.AppBarConfiguration
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding
import com.cactuslab.capacitor.nativenavigation.types.*
import com.cactuslab.capacitor.nativenavigation.ui.BlankViewFragment
import com.cactuslab.capacitor.nativenavigation.ui.HostFragment
import com.cactuslab.capacitor.nativenavigation.ui.ModalBottomSheet
import com.cactuslab.capacitor.nativenavigation.ui.NavigationViewFragment
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.*
import kotlin.NoSuchElementException
import kotlin.collections.MutableMap
import kotlin.collections.forEach
import kotlin.collections.last
import kotlin.collections.mutableMapOf
import kotlin.collections.set



class NativeNavigation(val plugin: NativeNavigationPlugin, val viewModel: NativeNavigationViewModel) {

    init {
        viewModel.nativeNavigation = this
    }

    class NavContext(
        val contextId: String,
        val fragment: HostFragment,
        private val addToActivityBlock: (transaction: FragmentTransaction) -> Unit,
        private val removeFromActivityBlock: (transaction: FragmentTransaction) -> Unit) {
        var isAddedToActivity: Boolean = fragment.isAdded

        fun getBinding(): ActivityNavigationBinding? {
            return fragment.binding
        }

        fun navHostFragment(): NavHostFragment? {
            if (!isAddedToActivity) {
                return null
            }

            return getBinding()?.navigationHost?.getFragment<NavHostFragment>()
        }

        fun navController(): NavController? {
            return fragment.binding?.navigationHost?.findNavController()
        }

        fun tryAddToActivity(transaction: FragmentTransaction) {
            if (!isAddedToActivity) {
                addToActivityBlock(transaction)
            }
        }

        fun tryRemoveFromActivity(transaction: FragmentTransaction) {
//            if (isAddedToActivity) {
                removeFromActivityBlock(transaction)
//            }
        }

        fun runSetup(startDestination: String) {
            val host = getBinding()?.navigationHost?.getFragment<NavHostFragment>() ?: throw Exception("The navigation host is null")
            val graph = host.createGraph(startDestination = "$contextId/{${nav_arguments.component_id}}", route = "$contextId/$startDestination") {
                fragment<BlankViewFragment>("$contextId/{${nav_arguments.component_id}}") {
                    argument(nav_arguments.component_id) {
                        type = NavType.StringType
                    }
                }
            }
            host.navController.setGraph(graph = graph, bundleOf(nav_arguments.component_id to startDestination))
        }
    }

    private val navContexts : MutableList<NavContext> = mutableListOf()

    private val components : MutableMap<String, ComponentSpec> = mutableMapOf()

    private var nextWindowAction: ComponentSpec? = null

    private val viewActions: MutableMap<String,() -> Unit> = mutableMapOf()

    private var onBackPressedCallback: OnBackPressedCallback? = null

    private val webviewsCache: MutableMap<String, WebView> = mutableMapOf()

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

    fun findStackComponentIdHosting(componentId: String): String? {
        navContexts.forEach { navContext ->
            navContext.fragment.binding?.navigationHost?.findNavController()?.let { navController ->
                navController.backQueue.forEach { entry ->
                    if (entry.arguments?.getString(nav_arguments.component_id) == componentId) {
                        return navContext.contextId
                    }
                }

            }
        }
        return null
    }

    fun setOptions(options: SetComponentOptions) {
        Log.d(TAG, "setOptions -> $options")
        val spec = components.get(options.id)!!
        val specOptions = spec.options
        if (specOptions != null) {
            specOptions.mergeOptions(options.options)
            viewModel.postSetOptions(SetComponentOptions(options.id, options.animated, specOptions), options.id)
        } else {
            spec.options = options.options
            viewModel.postSetOptions(options, options.id)
        }
    }

    fun reset() {

        Log.d(TAG, "--- RESET STARTED ---")
        viewActions.clear()

        val transaction = plugin.activity.supportFragmentManager.beginTransaction()
        navContexts.reversed().forEach { navContext ->
            navContext.tryRemoveFromActivity(transaction)
        }
        transaction.commitNowAllowingStateLoss()

        navContexts.clear()

//        navController?.setGraph(R.navigation.native_navigation, startDestinationArgs = Bundle())
//        this.binding = null

        onBackPressedCallback?.remove()
        onBackPressedCallback = null

//        navController = null
        nextWindowAction = null
//        currentStackId = null

//        components.clear()

        viewModel.reset()

        Log.d(TAG, "--- RESET COMPLETE ---")
    }

    private fun removeNavContext(navContext: NavContext) {
        val transaction = plugin.activity.supportFragmentManager.beginTransaction()
        navContext.tryRemoveFromActivity(transaction)
        transaction.commitNowAllowingStateLoss()
    }

    private fun popNavContext() {
        try {
            val navContext = navContexts.removeLast()
            removeNavContext(navContext)
        } catch (_: NoSuchElementException) {

        }
    }

    private fun setupBackPressedHandler() {
        val activity = plugin.activity
        onBackPressedCallback?.remove()
        onBackPressedCallback = null
        onBackPressedCallback = object: OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                Log.d(TAG, "Back pressed callback")

                val navContext = navContexts.last()

                val navController = navContext.navController()

                val didNavigate = navController?.previousBackStackEntry?.let { backStackEntry ->
                    navController.navigateUp()
                } ?: false

                if (!didNavigate) {

                    if (navContexts.size > 1) {
                        popNavContext()
                    } else {
                        activity.finish()
                    }
                }
            }
        }.also { activity.onBackPressedDispatcher.addCallback(it) }
    }

    @SuppressLint("SetJavaScriptEnabled")
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

    private fun pushNavController(id: String, animated: Boolean): NavContext {

        val context = plugin.context
        val activity = plugin.activity
        val parent = activity.findViewById<WebView>(com.getcapacitor.android.R.id.webview).parent as ViewGroup

        val fragment = HostFragment()

//        activity.supportFragmentManager.beginTransaction().add(com.getcapacitor.android.R.id.webview, fragment).commitNow()

        //val binding = ActivityNavigationBinding.inflate(LayoutInflater.from(context), parent, true)

        val navContext = NavContext(id, fragment, addToActivityBlock = { transaction ->
            if (animated) {
                transaction.setCustomAnimations(R.anim.slide_up_in, 0)
            }
            transaction.add(com.getcapacitor.android.R.id.webview, fragment)

        }, removeFromActivityBlock = { transaction ->
            if (animated) {
                transaction.setCustomAnimations(0, R.anim.slide_down_out)
            }
            transaction.remove(fragment)
        })

//        Log.d(TAG, "navController - ${navContext.navHostFragment.navController}")
//        val layoutParams =  ViewGroup.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT)

//        activity.addContentView(binding.root, layoutParams)
//        navContext.navController.addOnDestinationChangedListener { controller, destination, arguments ->
//            Log.d(TAG, "Navigated to ${destination.displayName}")
//        }

        navContexts.add(navContext)

        return navContext
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

    object nav_arguments {
        const val component_id = "optionsId"
    }

    fun setRoot(options: SetRootOptions, context: Context, activity: AppCompatActivity, call: PluginCall) {

        plugin.activity.runOnUiThread {
            reset()

            val component = options.component
            insertComponent(component)
            Log.d(TAG, "Asked to SetRoot: ${component.id} for createOptions: $component")

            val navContext = pushNavController(component.id, options.animated)
            setupBackPressedHandler()

            when (component) {
                is StackSpec -> {
                    val screen = component.stack?.last()

                    screen?.let {
                        insertComponent(screen)
                        val webView = makeWebView(screen.id)
                        viewModel.postWebView(webView, screen.id)

                        viewActions[screen.id] = {

                            val transaction = activity.supportFragmentManager.beginTransaction()
//                            transaction.setCustomAnimations(-1, -1, -1, -1)
                            navContext.tryAddToActivity(transaction)
                            transaction.commitNow()

                            navContext.runSetup(screen.id)
//                            val controller = navContext.fragment.binding?.navigationHost?.findNavController()
//                            controller!!.navigate(route = "${component.id}/${screen.id}", navOptions {
//                                popUpTo(component.id) {
//                                    inclusive = true
//                                    saveState = false
//                                }
//                            })

//                            navController.setGraph(R.navigation.native_navigation, startDestinationArgs = bundleOf(
//                                OPTIONS_ID to screen.id))
                        }

                        notifyCreateView(screen.id)
                    }
                }
                is TabsSpec -> {

                }
                is ViewSpec -> {
                    val webView = makeWebView(component.id)
                    viewModel.postWebView(webView, component.id)

                    viewActions[component.id] = {

//                        navContext.navHostFragment.navController.navigate(route = "${component.id}/${component.id}", navOptions {
//                            popUpTo(component.id) {
//                                inclusive = true
//                                saveState = false
//                            }
//                        })
                    //                        navController.setGraph(R.navigation.native_navigation, startDestinationArgs = bundleOf(
//                            OPTIONS_ID to component.id))
                    }

                    notifyCreateView(component.id)
                }
                else -> {}
            }
            call.resolve(SetRootResult(component.id).toJSObject())
        }
    }

    fun present(options: PresentOptions, call: PluginCall) {
        plugin.activity.runOnUiThread {
            val component = options.component
            insertComponent(component)

            val webView = makeWebView(component.id)
            viewModel.postWebView(webView, component.id)
            val navContext = pushNavController(component.id, options.animated)
//            val navController = navContext.navController


//            navContext.navHostFragment.navController = NavController(context = plugin.context)
            viewActions[component.id] = {

                val transaction = plugin.activity.supportFragmentManager.beginTransaction()
                navContext.tryAddToActivity(transaction)
                transaction.commitNow()

                navContext.runSetup(component.id)
//                navContext.navController()!!.navigate(route = "${component.id}/${component.id}", navOptions {
//                    popUpTo(component.id) {
//                        inclusive = true
//                        saveState = false
//                    }
//                })

//                navController.navigate(R.id.action_global_nav_screen, bundleOf(OPTIONS_ID to component.id), navOptions {
//                    launchSingleTop = true
//                    popUpTo(navController.graph.findStartDestination().id) {
//                        inclusive = true
//                        saveState = false
//                    }
//                } )
//                val bottomsheet = ModalBottomSheet().also {
//                    it.arguments = bundleOf(OPTIONS_ID to component.id)
//                }
//                bottomsheet.show(plugin.activity.supportFragmentManager, component.id)
            }

            notifyCreateView(component.id)

            val result = PresentResult(component.id)
            call.resolve(result.toJSObject())
        }

    }

    fun pop(call: PluginCall, activity: AppCompatActivity) {
        activity.onBackPressedDispatcher.onBackPressed()
        call.resolve()
    }

    fun dismiss(options: DismissOptions, call: PluginCall) {
        if (options.componentId.isNullOrBlank() && navContexts.isNotEmpty()) {
            val navContext = navContexts.last()
            popNavContext()

            val result = DismissResult(navContext.contextId)
            call.resolve(result.toJSObject())
        } else {

            val navContext = navContexts.find { it.contextId == options.componentId }
            if (navContext != null) {
                navContexts.remove(navContext)
                removeNavContext(navContext)
                val result = DismissResult(navContext.contextId)
                call.resolve(result.toJSObject())
            } else {
                call.reject("No such component is presented")
            }
        }
    }

    fun push(options: PushOptions, call: PluginCall) {

        plugin.activity.runOnUiThread {
            val component = options.component
            insertComponent(component)

            val navContext = navContexts.last()

            val stackId = navContext.contextId

            Log.d(TAG, "Asked to push: ${component.id} for createOptions: $component")

            val webView = makeWebView(component.id)
            viewModel.postWebView(webView, component.id)
            viewActions[component.id] = {
                val navController = navContext.fragment.binding?.navigationHost?.findNavController()

                navController!!.navigate("${stackId}/${component.id}") {
                    anim {
                        enter = R.anim.slide_in_right
                        exit = R.anim.slide_out_left
                        popEnter = R.anim.slide_in_left
                        popExit = R.anim.slide_out_right
                    }
                }
            }

            notifyCreateView(component.id)
//            plugin.activity.lifecycleScope.launch {
//                delay(400)
//                val action = NativeNavigationDirections.actionGlobalNavScreen(component.id)
//                navController.navigate(action)
//            }

            val result = PushResult(stackId )
            call.resolve(result.toJSObject())
        }
    }


    fun windowOpen(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {

        val component = nextWindowAction ?: return false
        nextWindowAction = null

        Log.d(TAG, "windowOpen with url ${view!!.url!!}")


        val webView = webviewsCache.remove(component.id)!!

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


        return true
    }

    fun viewReady(options: ViewReadyOptions) {
        val action = viewActions.remove(options.id)
        plugin.activity.runOnUiThread(action)
    }

    companion object {
        private const val TAG = "NativeNavigation"

        private const val OPTIONS_ID = "optionsId"
    }

}