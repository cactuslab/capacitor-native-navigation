package com.cactuslab.capacitor.nativenavigation

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Message
import android.util.Log
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.os.bundleOf
import androidx.fragment.app.FragmentTransaction
import androidx.lifecycle.lifecycleScope
import androidx.navigation.*
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.fragment.fragment
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding
import com.cactuslab.capacitor.nativenavigation.types.*
import com.cactuslab.capacitor.nativenavigation.ui.BlankViewFragment
import com.cactuslab.capacitor.nativenavigation.ui.HostFragment
import com.getcapacitor.BridgeWebViewClient
import com.getcapacitor.PluginCall
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.*
import kotlin.collections.set


class NativeNavigation(val plugin: NativeNavigationPlugin, val viewModel: NativeNavigationViewModel) {

    init {
        Log.d(TAG, "--- NATIVE NAVIGATION CONSTRUCTED ---")
        viewModel.nativeNavigation = this
    }

    class NavContext(
        val contextId: String,
        val fragment: HostFragment,
        private val addToActivityBlock: (transaction: FragmentTransaction) -> Unit,
        private val removeFromActivityBlock: (transaction: FragmentTransaction) -> Unit) {
        private var isAddedToActivity: Boolean = fragment.isAdded

        var startRoute : String? = null

        /**
         * The virtual stack exists to serve as an in-memory model of the expected stack after all operations are completed.
         * This stack allows us to inspect what a stack will look like before it is presented.
         */
        val virtualStack: MutableList<String> = mutableListOf()

        fun getBinding(): ActivityNavigationBinding? {
            return fragment.binding
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
            removeFromActivityBlock(transaction)
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
            startRoute = "$contextId/$startDestination"
        }
    }

    private val navContexts : MutableList<NavContext> = mutableListOf()

    private val components : MutableMap<String, ComponentSpec> = mutableMapOf()

    private var nextWindowAction = LinkedList<ComponentSpec>()

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
            /// Check if this is the host stack id
            if (navContext.contextId == componentId) {
                return navContext.contextId
            }

            /// Check if this id is in the view heirarchy
            navContext.fragment.binding?.navigationHost?.findNavController()?.let { navController ->
                navController.backQueue.forEach { entry ->
                    if (entry.arguments?.getString(nav_arguments.component_id) == componentId) {
                        return navContext.contextId
                    }
                }

            }

            /// Check if this exists in our model. This model shows the eventual expected state after all view operations are complete
            if (navContext.virtualStack.contains(componentId)) {
                return navContext.contextId
            }
        }
        return null
    }

    fun shouldOverrideLoad(url: Uri?): Boolean? {
        if (url == null) {
            return null
        }

        if (url.pathSegments.size == 0) {
            return null
        }
        if (url.pathSegments.get(0) != "capacitor-native-navigation") {
            return null
        }

        val identifier = url.lastPathSegment
        if (identifier.isNullOrBlank()) {
            return false
        }

        val spec = componentSpecForId(identifier)
        if (spec != null) {

            val webView = webviewsCache.remove(identifier)!!

            plugin.activity.lifecycleScope.launch(Dispatchers.Main) {
                Log.d(TAG, "Setting HTML on Webivew for component ${identifier}")
                viewModel.setHtml(url.toString(), webView, plugin)
            }

            return true
        }

        return false
    }

    fun getOptions(options: GetOptions, call: PluginCall) {
        val target = options.id

        Log.d(TAG, "getOptions -> id: ${options.id}")
        val navContext = if (target.isNullOrBlank()) {
            try {
                navContexts.last()
            } catch (e: kotlin.NoSuchElementException) {
                call.reject("No content has been presented", e)
                return
            }
        } else {
            val navContextId = findStackComponentIdHosting(target)
            navContexts.find { it.contextId == navContextId }
        }
        if (navContext == null) {
            call.reject("This target doesn't exist $target")
            return
        }

        val rootSpec = components.get(navContext.contextId)
        val viewSpec = if (target.isNullOrBlank()) {
            try {
                components.get(navContext.virtualStack.last())
            } catch (e: kotlin.NoSuchElementException) {
                call.reject("No viewspec in the current component", e)
                return
            }
        } else {
            components.get(target)
        }

        val result = GetResult(component = viewSpec)
        rootSpec?.let {
            when (it) {
                is StackSpec -> {
                    val componentSpecs =
                        navContext.virtualStack.mapNotNull { componentSpecForId(it) }
                    result.stack = StackSpec(id = rootSpec.id, options = rootSpec.options, stack = componentSpecs as List<ViewSpec>)
                }
                is TabsSpec -> TODO("Tabs Not implemented yet")
                is ViewSpec -> {
                    result.view = viewSpec as ViewSpec
                }
            }
        }

        Log.d(TAG, "GET result: ${result.toJSObject()}")

        call.resolve(result.toJSObject())
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

        onBackPressedCallback?.remove()
        onBackPressedCallback = null

        nextWindowAction.clear()

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
                } else {
                    navContext.virtualStack.removeLast()
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

        webView.webViewClient = BridgeWebViewClient(plugin.bridge)
//        webView.webChromeClient = NavigationChromeClient(BridgeWebChromeClient(plugin.bridge), this)

        id?.let {
            webviewsCache.put(id, webView)
        }

        return webView
    }

    private fun pushNavController(id: String, animated: Boolean): NavContext {

        val fragment = HostFragment()

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

        navContexts.add(navContext)

        return navContext
    }

    fun notifyCreateView(id: String) {
        val component = components[id] as ViewSpec
        nextWindowAction.add(component)
        plugin.notifyCreateView(component.path, component.id, component.state, findStackComponentIdHosting(id))
    }

    fun notifyUpdateView(id: String) {
        val component = components[id] as ViewSpec
        plugin.notifyUpdateView(component.path, component.id, component.state, findStackComponentIdHosting(id))
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

    fun present(options: PresentOptions, call: PluginCall) {
        val component = options.component
        insertComponent(component)

        Log.d(TAG, "Asked to Present: ${component.id} for createOptions: $component")

        val navContext = pushNavController(component.id, options.animated)
        setupBackPressedHandler()

        when (component) {
            is ViewSpec -> {
                val webView = makeWebView(component.id)
                viewModel.postWebView(webView, component.id)
                navContext.virtualStack.clear()
                navContext.virtualStack.add(component.id)

                viewActions[component.id] = {
                    val transaction = plugin.activity.supportFragmentManager.beginTransaction()
                    navContext.tryAddToActivity(transaction)
                    transaction.commitNow()

                    navContext.runSetup(component.id)
                }

                notifyCreateView(component.id)
            }
            is StackSpec -> {
                val stack = component.stack ?: listOf()
                navContext.virtualStack.clear()

                stack.forEachIndexed { _, viewSpec ->
                    insertComponent(viewSpec)
                    val webView = makeWebView(viewSpec.id)
                    viewModel.postWebView(webView, viewSpec.id)
                    navContext.virtualStack.add(viewSpec.id)
                }
                val lastViewSpec = stack.last()
                val firstViewSpec = stack.first()

                viewActions[lastViewSpec.id] = {
                    val transaction = plugin.activity.supportFragmentManager.beginTransaction()
                    navContext.tryAddToActivity(transaction)
                    transaction.commitNow()

                    val navController = navContext.navController()
                    navContext.runSetup(firstViewSpec.id)

                    stack.forEachIndexed { index, viewSpec ->
                        if (index != 0) {
                            navController!!.navigate("${component.id}/${viewSpec.id}") {
                            }
                        }
                    }
                }

                notifyCreateView(lastViewSpec.id)
            }
            is TabsSpec -> {


            }
        }

//        viewActions[component.id] = {
//
//            val transaction = plugin.activity.supportFragmentManager.beginTransaction()
//            navContext.tryAddToActivity(transaction)
//            transaction.commitNow()
//
//            navContext.runSetup(component.id)
//
////                val bottomsheet = ModalBottomSheet().also {
////                    it.arguments = bundleOf(OPTIONS_ID to component.id)
////                }
////                bottomsheet.show(plugin.activity.supportFragmentManager, component.id)
//        }
//
//        notifyCreateView(component.id)

        val result = PresentResult(component.id)
        call.resolve(result.toJSObject())

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
        Log.d(TAG, "Push Started")

        val component = options.component

        val target = options.target
        val navContext = if (target.isNullOrBlank()) {
            try {
                navContexts.last()
            } catch (e: kotlin.NoSuchElementException) {
                Log.d(TAG, "No such stack to push on to. Try presenting first. $e")
                call.reject("No such stack to push on to", e)
                return
            }
        } else {
            val navContextId = findStackComponentIdHosting(target)
            navContexts.find { it.contextId == navContextId }
        }
        if (navContext == null) {
            Log.d(TAG, "No such stack to push on to. Try presenting first.")
            call.reject("No such stack to push on to. Try presenting first.")
            return
        }

        val presentedComponentHost = componentSpecForId(navContext.contextId)!!

        when (presentedComponentHost.type) {
            ComponentType.STACK -> {
                val stackId = navContext.contextId

                Log.d(TAG, "Asked to push: ${component.id} into STACK for createOptions: $component")

                when(options.mode) {
                    PushMode.PUSH -> {
                        insertComponent(component)

                        Log.d(TAG, "PUSH -> Inserted component ${component.id}")
                        var lastRemovedId: String? = null
                        if (options.popCount > 0) {
                            Log.d(TAG, "Popping ${options.popCount} views first")
                            for (i in 1..options.popCount) {
                                lastRemovedId = navContext.virtualStack.removeLast()
                            }
                        }

                        Log.d(TAG, "LastRemoveId is ${lastRemovedId}")
                        navContext.virtualStack.add(component.id)
                        val webView = makeWebView(component.id)
                        viewModel.postWebView(webView, component.id)
                        viewActions[component.id] = {
                            val navController = navContext.fragment.binding?.navigationHost?.findNavController()

                            navController!!.navigate("${stackId}/${component.id}") {
                                if (options.animated) {
                                    anim {
                                        enter = R.anim.slide_in_right
                                        exit = R.anim.slide_out_left
                                        popEnter = R.anim.slide_in_left
                                        popExit = R.anim.slide_out_right
                                    }
                                }
                                if (lastRemovedId != null) {
                                    popUpTo("${stackId}/${lastRemovedId}") {
                                        inclusive = true
                                        saveState = false
                                    }
                                }
                            }
                        }

                        notifyCreateView(component.id)

                        val result = PushResult(component.id , stackId)
                        call.resolve(result.toJSObject())
                    }
                    PushMode.REPLACE -> {

                        var lastRemovedId: String? = null

                        Log.d(TAG, "REPLACE with a popCount of ${options.popCount}")
                        var backStackEntry: NavBackStackEntry? = null
                        if (options.popCount > 0) {
                            for (i in 1..options.popCount) {
                                lastRemovedId = navContext.virtualStack.removeLast()
                            }
                            val navController = navContext.fragment.binding?.navigationHost?.findNavController()
                            backStackEntry = navController!!.backQueue[navController.backQueue.size - options.popCount]
                        }

                        val currentId = if (target.isNullOrBlank() || target == navContext.contextId) { //
                            navContext.virtualStack.lastOrNull()
                        } else {
                            target
                        }

                        if (currentId.isNullOrBlank()) {
                            Log.d(TAG, "There is no current view to replace on this stack \"$stackId\"")
                            call.reject("There is no current view to replace on this stack \"$stackId\"")
                            return
                        }

                        component.id = currentId
                        insertComponent(component)

                        if (backStackEntry != null) {
                            val navController = navContext.fragment.binding?.navigationHost?.findNavController()
                            navController!!.popBackStack(backStackEntry.destination.id, inclusive = true, saveState = false)
                        }

                        notifyUpdateView(currentId)
                        val result = PushResult(currentId, stackId)
                        call.resolve(result.toJSObject())
                    }
                    PushMode.ROOT -> {
                        insertComponent(component)

                        navContext.virtualStack.clear()
                        navContext.virtualStack.add(component.id)
                        val webView = makeWebView(component.id)
                        viewModel.postWebView(webView, component.id)
                        viewActions[component.id] = {
                            val navController = navContext.fragment.binding?.navigationHost?.findNavController()

                            navController!!.navigate("${stackId}/${component.id}") {
                                if (options.animated) {
                                    anim {
                                        enter = R.anim.slide_in_right
                                        exit = R.anim.slide_out_left
                                        popEnter = R.anim.slide_in_left
                                        popExit = R.anim.slide_out_right
                                    }
                                }
                                popUpTo(navContext.startRoute!!) {
                                    inclusive = true
                                    saveState = false
                                }
                            }
                        }

                        notifyCreateView(component.id)

                        val result = PushResult(component.id , stackId)
                        call.resolve(result.toJSObject())
                    }
                }


            }
            ComponentType.TABS -> {
                call.reject("Not implemented TABS replace yet")
            }
            ComponentType.VIEW -> {

//                call.reject("Not implemented VIEW replace yet")
                val stackId = navContext.contextId

                val currentId = if (target == navContext.contextId) {
                    navContext.navController()?.currentBackStackEntry?.arguments?.getString(nav_arguments.component_id)
                } else {
                    target
                }

                if (currentId.isNullOrBlank()) {
                    Log.d(TAG, "There is no current view to replace on this stack \"$stackId\"")
                    call.reject("There is no current view to replace on this stack $stackId")
                    return
                }
                component.id = currentId
                insertComponent(component)

                notifyUpdateView(currentId)
                val result = PushResult(currentId, stackId)
                call.resolve(result.toJSObject())

//
//                Log.d(TAG, "Asked to push: ${component.id} for createOptions: $component")
//
//                val webView = makeWebView(component.id)
//                viewModel.postWebView(webView, component.id)
//                viewActions[component.id] = {
//                    val navController = navContext.fragment.binding?.navigationHost?.findNavController()
//                    val currentEntry = navController!!.currentBackStackEntry!!
//                    val displayedComponentId = currentEntry.arguments!!.getString(nav_arguments.component_id)!!
//                    val route = navContext.startRoute!!
//                    navController!!.navigate("${stackId}/${component.id}") {
//                        anim {
//                            enter = R.anim.fade_in
//                            exit = R.anim.fade_out
//                            popEnter = -1
//                            popExit = -1
//                        }
//                        popUpTo(route) {
//                            inclusive = false
//                            saveState = false
//                        }
//                    }
//                }
//
//                notifyCreateView(component.id)
//
//                val result = PushResult(stackId )
//                call.resolve(result.toJSObject())
            }
        }
    }

    fun windowOpen(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {

        val component = nextWindowAction.poll() ?: return false

        Log.d(TAG, "windowOpen with url ${view!!.url!!}")

        val webView = webviewsCache.get(component.id)!!

        resultMsg?.let { message ->
            val webViewTransport = message.obj!! as WebView.WebViewTransport
            webViewTransport.webView = webView
            Log.d(TAG, "Frag got signal to window open")
            message.sendToTarget()
        }

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