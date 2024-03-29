package com.cactuslab.capacitor.nativenavigation

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.os.bundleOf
import androidx.core.view.WindowCompat
import androidx.fragment.app.FragmentManager
import androidx.fragment.app.FragmentTransaction
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.*
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.fragment.fragment
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding
import com.cactuslab.capacitor.nativenavigation.helpers.isColorDark
import com.cactuslab.capacitor.nativenavigation.helpers.mergeJSObjects
import com.cactuslab.capacitor.nativenavigation.helpers.parseRGBAColor
import com.cactuslab.capacitor.nativenavigation.types.*
import com.cactuslab.capacitor.nativenavigation.ui.ViewSpecFragment
import com.cactuslab.capacitor.nativenavigation.ui.HostFragment
import com.cactuslab.capacitor.nativenavigation.ui.changeStatusBarColor
import com.getcapacitor.PluginCall
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.*
import kotlin.NoSuchElementException
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
        var presentOptions: PresentOptions? = null

        var startRoute : String? = null

        /* A flag to indicate if this nav context has been removed or requested to be removed from the view hierarchy */
        private var isRemoved: Boolean = false
        /* A flag to indicate if this nav context has been added to the view hierarchy */
        private var isAdded: Boolean = false

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
            if (isRemoved) {
                return
            }
            if (!isAddedToActivity) {
                addToActivityBlock(transaction)
                isAdded = true
            }
        }

        fun tryRemoveFromActivity(transaction: FragmentTransaction) {
            if (isAdded) {
                removeFromActivityBlock(transaction)
                isAdded = false
            }
            isRemoved = true
        }

        fun runSetup(startDestination: String) {
            if (isRemoved) {
                return
            }
            val host = getBinding()?.navigationHost?.getFragment<NavHostFragment>() ?: throw Exception("The navigation host is null")
            val graph = host.createGraph(startDestination = "$contextId/{${nav_arguments.component_id}}", route = "$contextId/$startDestination") {
                fragment<ViewSpecFragment>("$contextId/{${nav_arguments.component_id}}") {
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

    private val componentsById : MutableMap<String, ComponentSpec> = mutableMapOf()
    private val componentsByAlias : MutableMap<String, ComponentSpec> = mutableMapOf()

    private var nextWindowAction = LinkedList<ComponentSpec>()

    private val viewActions: MutableMap<String,() -> Unit> = mutableMapOf()

    private var onBackPressedCallback: OnBackPressedCallback? = null

    private val webviewsCache: MutableMap<String, WebView> = mutableMapOf()

    /** used to ensure that when native navigation is popping nothing can prevent it */
    private var applicationDrivenPop: Boolean = false;

    private fun insertComponent(component: ComponentSpec, container: ComponentSpec? = null) {
        componentsById[component.id] = component
        component.alias?.let {
            componentsByAlias[it] = component
        }
        container?.state?.let { containerState ->
            component.state = mergeJSObjects(component.state, containerState)
        }
        when (component) {
            is StackSpec -> {
                component.components?.forEach { insertComponent(it, component) }
            }
            is TabsSpec -> {
                component.tabs.forEach { insertComponent(it as ComponentSpec, component) }
            }
            else -> {}
        }
    }

    fun componentSpecForId(id: String): ComponentSpec? {
        return componentsById[id] ?: componentsByAlias[id]
    }

    fun viewSpecForId(id: String): ViewSpec? {
        return componentsById[id] as? ViewSpec ?: componentsByAlias[id] as? ViewSpec
    }

    fun findStackComponentIdHosting(componentId: String): String? {
        val component = componentSpecForId(componentId)
        val id = component?.id ?: return null
        navContexts.forEach { navContext ->
            /// Check if this is the host stack id
            if (navContext.contextId == id) {
                return navContext.contextId
            }

            /// Check if this id is in the view heirarchy
            navContext.fragment.binding?.navigationHost?.findNavController()?.let { navController ->
                navController.backQueue.forEach { entry ->
                    if (entry.arguments?.getString(nav_arguments.component_id) == id) {
                        return navContext.contextId
                    }
                }

            }

            /// Check if this exists in our model. This model shows the eventual expected state after all view operations are complete
            if (navContext.virtualStack.contains(id)) {
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

            Log.d(TAG, "shouldOverrideLoad: Removing Webview in Cache for id: ${identifier}")
            val webView = webviewsCache.remove(identifier)!!

            plugin.activity.lifecycleScope.launch(Dispatchers.Main) {
                Log.d(TAG, "shouldOverrideLoad: Setting HTML on Webivew for component ${identifier}")
                viewModel.setHtml(url.toString(), webView, plugin)
            }

            return true
        }

        return false
    }

    @Throws(kotlin.NoSuchElementException::class)
    fun navContextForTarget(target: String?) : NavContext {
        val navContext = if (target.isNullOrBlank()) {
            navContexts.last()
        } else {
            val navContextId = findStackComponentIdHosting(target)
            navContexts.find { it.contextId == navContextId }
        }
        if (navContext == null) {
            throw NoSuchElementException("No content has been presented")
        }
        return navContext
    }

    data class Target(val navContext: NavContext, val viewSpec: ComponentSpec)

    @Throws(kotlin.NoSuchElementException::class)
    fun findTarget(target: String?) : Target {
        val navContext = navContextForTarget(target)
        val viewSpec = if (target.isNullOrBlank()) {
            componentSpecForId(navContext.virtualStack.last())
        } else {
            componentSpecForId(target)
        }
        if (viewSpec == null) {
            throw NoSuchElementException("No such target exists at target:'$target'")
        }
        return Target(navContext, viewSpec)
    }

    fun getOptions(options: GetOptions, call: PluginCall) {
        Log.d(TAG, "getOptions: -> id: ${options.id}")

        val target = try {
            findTarget(options.id)
        } catch (e: kotlin.NoSuchElementException) {
            call.reject("No content matches the target")
            return
        }

        val rootSpec = componentSpecForId(target.navContext.contextId)

        val result = GetResult(component = target.viewSpec)
        if (target.navContext.contextId != options.id) {
            rootSpec?.let {
                when (it) {
                    is StackSpec -> {
                        val componentSpecs =
                            target.navContext.virtualStack.mapNotNull { componentSpecForId(it) }
                        result.stack = StackSpec(id = rootSpec.id, components = componentSpecs as List<ViewSpec>)
                    }
                    is TabsSpec -> TODO("Tabs Not implemented yet")
                    is ViewSpec -> {
                        TODO("View Not implemented as a container")
                    }
                }
            }
        }
        Log.d(TAG, "getOptions: GET result: ${result.toJSObject()}")

        call.resolve(result.toJSObject())
    }

    fun update(options: UpdateOptions) {
        Log.d(TAG, "update: -> $options")
        val spec = componentSpecForId(options.id)!!

        options.update?.let { obj ->
            spec.update(obj)
        }
        viewModel.postUpdate(options, options.id)
    }

    fun message(message: MessageOptions, call: PluginCall) {
        val target = try {
            findTarget(message.target)
        } catch (e: kotlin.NoSuchElementException) {
            call.reject("No content matches the target")
            return
        }

        plugin.notifyMessage(target.viewSpec.id, message.type, message.value)
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
        Log.d(TAG, "removeNavContext: Removing context for id ${navContext.contextId}")
        val transaction = plugin.activity.supportFragmentManager.beginTransaction()
        navContext.tryRemoveFromActivity(transaction)
        transaction.commitNowAllowingStateLoss()

        navContexts.lastOrNull()?.let context@ { topNavContext ->
            topNavContext.virtualStack.lastOrNull()?.let { topStackId ->
                val spec = componentSpecForId(topStackId) ?: return@context

                val backgroundColor = spec.topBarSpec()?.background?.color ?: topNavContext.presentOptions?.component?.topBarSpec()?.background?.color
                backgroundColor?.parseRGBAColor()?.let { statusColor ->
                    plugin.activity.changeStatusBarColor(statusColor)
                }
            }
        }
    }

    private fun popNavContext() {
        try {
            val navContext = navContexts.removeLast()
            removeNavContext(navContext)
        } catch (_: NoSuchElementException) {

        }
    }

    private fun setupBackPressedHandler() {
        Log.d(TAG, "setupBackPressedHandler: STARTED SETUP FOR BACK ---")
        val activity = plugin.activity
        onBackPressedCallback?.remove()
        onBackPressedCallback = object: OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                Log.d(TAG, "Back pressed callback")

                val navContext = navContexts.last()

                val navController = navContext.navController()

                if (navController?.previousBackStackEntry != null) {
                    navContext.virtualStack.lastOrNull()?.let { topMostId ->
                        val isBackEnabled = when (val componentSpec = componentSpecForId(topMostId)) {
                            is ViewSpec -> {
                                val buttonId = componentSpec.backButtonId
                                if (buttonId != null) {
                                    notifyClick(buttonId, componentSpec.id)
                                    false
                                } else {
                                    componentSpec.stackItem?.backEnabled()
                                }
                            }
                            else -> { null }
                        } ?: true

                        if (!isBackEnabled && !applicationDrivenPop) {
                            /** Back on stack has been disabled. Tell the system we handled it. */
                            return
                        }
                    }
                }

                val didNavigate = navController?.previousBackStackEntry?.let { backStackEntry ->
                    navController.navigateUp()
                } ?: false

                if (!didNavigate) {

                    if (navContext.presentOptions?.cancellable == false) {
                        /**
                         * This presentation is not cancellable so the best option is to jump the
                         * user out of the app as if they hit the home button instead
                         */
                        activity.moveTaskToBack(true)
                    } else if (navContexts.size > 1) {
                        popNavContext()
                    } else {
                        /**
                         * Move the task to back when we have nothing else to go back to as if the
                         * user hit the home button
                         */
                        activity.moveTaskToBack(true)
                    }
                } else {
                    navContext.virtualStack.removeLast()
                }
            }
        }.also { activity.onBackPressedDispatcher.addCallback(activity, it) }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun makeWebView(id: String? = null): WebView {
        Log.d(TAG, "makeWebView: Started for id:${id}")
        val webView = WebView(plugin.context)
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.setGeolocationEnabled(true)
        settings.databaseEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true

        webView.webViewClient = NativeNavigationWebViewClient(plugin.bridge)

        id?.let {
            Log.d(TAG, "makeWebView: Putting webview in cache for id:${id}")
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
            transaction.add(android.R.id.content, fragment)
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
        Log.d(TAG, "notifyCreateView: started for id: ${id}")
        val component = componentSpecForId(id) as ViewSpec
        nextWindowAction.add(component)
        plugin.notifyCreateView(component.path, component.id, component.alias, component.state, findStackComponentIdHosting(id))
    }

    fun notifyUpdateView(id: String) {
        Log.d(TAG, "notifyUpdateView: started for id: ${id}")
        val component = componentSpecForId(id) as ViewSpec
        plugin.notifyUpdateView(component.path, component.id, component.alias, component.state, findStackComponentIdHosting(id))
    }

    fun notifyDestroyView(componentId: String) {
        Log.d(TAG, "notifyDestroyView: Started for $componentId")
        val component = componentSpecForId(componentId)
        plugin.notifyDestroyView(componentId, component?.alias)
        viewModel.cleanUpComponentWithId(componentId)
        viewActions.remove(componentId)
        Log.d(TAG, "notifyDestroyView: Completed for $componentId")
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

        Log.d(TAG, "⬆️ PRESENT: ${component.id} ${component.alias} for createOptions: $component")

        val navContext = pushNavController(component.id, options.animated)
        navContext.presentOptions = options

        setupBackPressedHandler()

        when (component) {
            is ViewSpec -> {
                val webView = makeWebView(component.id)
                viewModel.postWebView(webView, component.id)
                navContext.virtualStack.clear()
                navContext.virtualStack.add(component.id)

                navContext.fragment.onEnterEnd = Runnable {
                    Log.d(TAG, "ANIMATOR ON ENTER END")
                    val result = PresentResult(component.id)
                    call.resolve(result.toJSObject())
                }

                viewActions[component.id] = {

                    val transaction = plugin.activity.supportFragmentManager.beginTransaction()

                    navContext.tryAddToActivity(transaction)

                    transaction.commitNow()

                    navContext.runSetup(component.id)
                }

                notifyCreateView(component.id)
            }
            is StackSpec -> {
                val stack = component.components ?: listOf()
                navContext.virtualStack.clear()

                navContext.fragment.onEnterEnd = Runnable {
                    Log.d(TAG, "ANIMATOR ON ENTER END")
                    val result = PresentResult(component.id)
                    call.resolve(result.toJSObject())
                }

                stack.forEachIndexed { _, viewSpec ->
                    insertComponent(viewSpec, component)
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
    }

    fun pop(call: PluginCall, activity: AppCompatActivity) {
        Log.d(TAG, "pop: Processing pop")
        applicationDrivenPop = true
        activity.onBackPressedDispatcher.onBackPressed()
        applicationDrivenPop = false
        call.resolve()
    }

    fun dismiss(options: DismissOptions, call: PluginCall) {
        Log.d(TAG, "⬇️ DISMISS: ${options.componentId}")
        var id = options.componentId
        if (id.isNullOrBlank() && navContexts.isNotEmpty()) {
            val navContext = navContexts.last()
            navContext.fragment.onExitEnd = Runnable {
                Log.d(TAG, "DISMISS EXIT END")
                val result = DismissResult(navContext.contextId)
                call.resolve(result.toJSObject())
            }
            popNavContext()
        } else {

            if (id != null) {
                /* convert id/alias to id */
                val componentSpec = componentSpecForId(id)
                id = componentSpec?.id
            }

            val navContext = navContexts.find { it.contextId == id || it.virtualStack.contains(id) }
            if (navContext != null) {
                navContext.fragment.onExitEnd = Runnable {
                    Log.d(TAG, "DISMISS EXIT END")
                    val result = DismissResult(navContext.contextId)
                    call.resolve(result.toJSObject())
                }
                navContexts.remove(navContext)
                removeNavContext(navContext)

            } else {
                call.reject("No such component is presented")
            }
        }
    }

    private val pushActions: MutableMap<String,() -> Unit> = mutableMapOf()

    fun completePush(id: String) {
        pushActions.remove(id)?.let { function -> function() }
    }

    fun push(options: PushOptions, call: PluginCall) {
        Log.d(TAG, "push: Started for id ${options.component.id}")

        /* Other plugins can clear out the back pressed handlers. We need to constantly force our handler into the activity */
        setupBackPressedHandler()

        val component = options.component

        val target = options.target
        val navContext = if (target.isNullOrBlank()) {
            try {
                navContexts.last()
            } catch (e: kotlin.NoSuchElementException) {
                Log.d(TAG, "push: No such stack to push on to. Try presenting first. $e")
                call.reject("No such stack to push on to", e)
                return
            }
        } else {
            val navContextId = findStackComponentIdHosting(target)
            navContexts.find { it.contextId == navContextId }
        }
        if (navContext == null) {
            Log.d(TAG, "push: No such stack to push on to. Try presenting first.")
            call.reject("No such stack to push on to. Try presenting first.")
            return
        }



        val presentedComponentHost = componentSpecForId(navContext.contextId)!!

        when (presentedComponentHost.type) {
            ComponentType.STACK -> {
                val stackId = navContext.contextId

                Log.d(TAG, "push: ${component.id} into STACK for createOptions: $component")

                when(options.mode) {
                    PushMode.PUSH -> {

                        pushActions[component.id] = {
                            val result = PushResult(component.id , stackId)
                            call.resolve(result.toJSObject())
                        }
                        insertComponent(component, presentedComponentHost)

                        Log.d(TAG, "push: PUSH -> Inserted component ${component.id}")
                        var lastRemovedId: String? = null
                        if (options.popCount > 0) {
                            Log.d(TAG, "Popping ${options.popCount} views first")
                            for (i in 1..options.popCount) {
                                lastRemovedId = navContext.virtualStack.removeLast()
                            }
                        }

                        Log.d(TAG, "push: LastRemoveId is ${lastRemovedId}")
                        navContext.virtualStack.add(component.id)
                        val webView = makeWebView(component.id)
                        viewModel.postWebView(webView, component.id)
                        viewActions[component.id] = {
                            val navHost = navContext.fragment.binding?.navigationHost!!
                            val navController = navHost.findNavController()

                            navController.addOnDestinationChangedListener(object: NavController.OnDestinationChangedListener {
                                override fun onDestinationChanged(
                                    controller: NavController,
                                    destination: NavDestination,
                                    arguments: Bundle?
                                ) {
                                    Log.d(TAG, "DESTINATION CHANGED to ${destination.route}")
                                    controller.removeOnDestinationChangedListener(this)
                                }
                            })
                            navContext.fragment.childFragmentManager.addOnBackStackChangedListener(object: FragmentManager.OnBackStackChangedListener {
                                override fun onBackStackChanged() {
                                    Log.d(TAG, "BACKSTACK CHANGED")
                                    navContext.fragment.childFragmentManager.removeOnBackStackChangedListener(this)
                                }
                            })
                            navController.navigate("${stackId}/${component.id}") {
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



                    }
                    PushMode.REPLACE -> {

                        var lastRemovedId: String? = null

                        Log.d(TAG, "push: REPLACE with a popCount of ${options.popCount}")
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
                            Log.d(TAG, "push: There is no current view to replace on this stack \"$stackId\"")
                            call.reject("There is no current view to replace on this stack \"$stackId\"")
                            return
                        }

                        component.id = currentId
                        insertComponent(component, presentedComponentHost)

//                        pushActions[component.id] = {
//                            val result = PushResult(component.id , stackId)
//                            call.resolve(result.toJSObject())
//                        }
//
                        if (backStackEntry != null) {
                            val navController = navContext.fragment.binding?.navigationHost?.findNavController()
                            navController!!.popBackStack(backStackEntry.destination.id, inclusive = true, saveState = false)
                        }

                        notifyUpdateView(currentId)
                        val result = PushResult(currentId, stackId)
                        call.resolve(result.toJSObject())
                    }
                    PushMode.ROOT -> {
                        insertComponent(component, presentedComponentHost)

                        pushActions[component.id] = {
                            val result = PushResult(component.id , stackId)
                            call.resolve(result.toJSObject())
                        }

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

//                        val result = PushResult(component.id , stackId)
//                        call.resolve(result.toJSObject())
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
                    Log.d(TAG, "push: There is no current view to replace on this stack \"$stackId\"")
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
        Log.d(TAG, "windowOpen: started")
        val component = nextWindowAction.poll() ?: return false

        Log.d(TAG, "windowOpen: with url ${view!!.url!!} for componentId ${component.id}")

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
        Log.d(TAG, "viewReady: processing viewAction for ${options.id}")
        val action = viewActions.remove(options.id)
        plugin.activity.runOnUiThread(action)
    }

    companion object {
        private const val TAG = "NativeNavigation"
    }

}