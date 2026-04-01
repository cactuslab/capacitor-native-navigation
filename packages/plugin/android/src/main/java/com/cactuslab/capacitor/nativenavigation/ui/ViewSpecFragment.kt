package com.cactuslab.capacitor.nativenavigation.ui

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Spannable
import android.text.SpannableString
import android.text.Spanned
import android.text.style.AbsoluteSizeSpan
import android.text.style.ForegroundColorSpan
import android.util.Base64
import android.util.Log
import android.view.*
import android.webkit.WebResourceRequest
import android.webkit.WebView
import androidx.annotation.ColorInt
import androidx.appcompat.widget.Toolbar
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.animation.doOnEnd
import androidx.core.graphics.ColorUtils
import androidx.core.text.toSpannable
import androidx.core.view.MenuProvider
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.doOnLayout
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.flowWithLifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewModelScope
import androidx.navigation.fragment.findNavController
import coil.imageLoader
import coil.request.ImageRequest
import com.cactuslab.capacitor.nativenavigation.NativeNavigationViewModel
import com.cactuslab.capacitor.nativenavigation.databinding.FragmentBlankBinding
import com.cactuslab.capacitor.nativenavigation.helpers.*
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.cactuslab.capacitor.nativenavigation.types.StackBarButtonItem
import com.cactuslab.capacitor.nativenavigation.types.StackSpec
import com.getcapacitor.JSObject
import com.google.android.material.appbar.AppBarLayout
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream

class ViewSpecFragment : NativeNavigationFragment(), MenuProvider {
    private var binding: FragmentBlankBinding? = null

    private val viewModel : NativeNavigationViewModel by activityViewModels()
    private val webviewViewModel: WebviewViewModel by viewModels()
    private val barConfigurationViewModel: BarConfigurationViewModel by viewModels()

    private var componentId: String? = null

    private var webView: WebView? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        Log.d(TAG, "onCreateView - ViewSpecFragment")
        return FragmentBlankBinding.inflate(inflater, container, false).also {
            binding = it
        }.root
    }

    private var appBarAnimator: ValueAnimator? = null

    private var previousState: BarConfigurationViewModel.BarValues? = null

    private fun setColors(backgroundColor: Int, titleColor: Int, buttonsColor: Int) {
        val appBarLayout = binding?.appBarLayout ?: return
        val toolbar = binding?.toolbar ?: return

        appBarLayout.setBackgroundColor(backgroundColor)
        toolbar.setTitleTextColor(titleColor)

        toolbar.navigationIcon?.mutate()?.setTint(buttonsColor)
        for (i in 0 until toolbar.menu.size()) {
            val menuItem = toolbar.menu.getItem(i)
            // Handle icon tint
            menuItem.icon?.mutate()?.setTint(buttonsColor)
            // Handle text color
            val spanString = SpannableString(menuItem.title)
            spanString.setSpan(
                ForegroundColorSpan(buttonsColor),
                0,
                spanString.length,
                Spannable.SPAN_INCLUSIVE_INCLUSIVE
            )
            menuItem.title = spanString
        }
    }

    private fun animateAppBarColor(
        state: BarConfigurationViewModel.BarValues,
        duration: Long
    ) {
        val previousState = previousState

        if (previousState == null || duration == 0L || previousState == state) {
            // Initial setting should not be animated
            setColors(state.baseToolbarColors.background, state.baseToolbarColors.titleColor, state.baseToolbarColors.buttonsColor)
            this.previousState = state
            return
        }

        var fromTheme = previousState.baseToolbarColors
        val toTheme = state.baseToolbarColors
        this.previousState = state

        val animator = appBarAnimator
        if (animator?.isRunning == true) {
            val progress = animator.animatedValue as Float
            fromTheme = fromTheme.copy(
                background = ArgbEvaluator().evaluate(progress, fromTheme.background, toTheme.background) as Int,
                titleColor = ArgbEvaluator().evaluate(progress, fromTheme.titleColor, toTheme.titleColor) as Int,
                buttonsColor = ArgbEvaluator().evaluate(progress, fromTheme.buttonsColor, toTheme.buttonsColor) as Int
            )
            animator.cancel()
        }

        appBarAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            this.duration = duration
            addUpdateListener { animator ->
                val progress = animator.animatedFraction

                val currentBackground = ArgbEvaluator().evaluate(progress, fromTheme.background, toTheme.background) as Int
                val currentTitleColor = ArgbEvaluator().evaluate(progress, fromTheme.titleColor, toTheme.titleColor) as Int
                val currentButtonsColor = ArgbEvaluator().evaluate(progress, fromTheme.buttonsColor, toTheme.buttonsColor) as Int

                setColors(currentBackground, currentTitleColor, currentButtonsColor)
            }
            start()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        onEnterEnd = Runnable {
            componentId?.let {
                viewModel.nativeNavigation?.completePush(it)
            }
        }

        val binding = binding ?: return

        setupToolbar(binding.toolbar)

        setupMenu()

        // if optionsId is null then the view is present as an unconfigured first launch. This view will likely be replaced immediately
        val optionsId = (this.arguments?.getString("optionsId") ?: return).also { this.componentId = it }

        Log.d(TAG, "Setting up Fragment with component id: $optionsId.")

        updateToolbar()

        Log.d(TAG, "Starting observation with id: $optionsId on $this")

        viewModel.webViewLiveDataForId(optionsId).observe(viewLifecycleOwner) { webview ->
            if (webview == null) {
                return@observe
            }

            webview.parent?.let {
                val group = it as ViewGroup
                group.removeView(webview)
            }

            val layoutParams = CoordinatorLayout.LayoutParams(
                CoordinatorLayout.LayoutParams.MATCH_PARENT,
                CoordinatorLayout.LayoutParams.MATCH_PARENT
            )
            layoutParams.behavior = AppBarLayout.ScrollingViewBehavior()
            webview.layoutParams = layoutParams

            binding.root.addView(webview, 0)
            this.webView = webview

            webview.doOnLayout {
                it.rootWindowInsets?.let { insets ->
                    webviewViewModel.updateInsets(insets)
                }
            }

            updateToolbar()
        }

        viewModel.signalForId(optionsId).observe(viewLifecycleOwner) { signal ->
            if (signal.consumed ) {
                Log.d(TAG, "Signal consumed. No Action Taken")
                return@observe
            }

            when (signal) {
                is NativeNavigationViewModel.Signal.Update -> {
                    Log.d(TAG, "update Received $optionsId pushing to viewModel")

                    updateToolbar(signal.options.animated)
                    setupMenu()
                }
            }

            signal.consumed = true
        }

        viewLifecycleOwner.lifecycleScope.launch {
            webviewViewModel.state.flowWithLifecycle(viewLifecycleOwner.lifecycle).collect { state ->
                val webview = webView ?: return@collect
                val ctx = context ?: return@collect

                val topInset = if (!state.isToolbarVisible) {
                    state.safeDrawing.top
                } else {
                    0
                }
                webview.injectCSS("""
                :root { --native-navigation-inset-top: ${topInset.pxToDp(requireContext())}px; }
                :root { --native-navigation-inset-bottom: ${state.safeDrawing.bottom.pxToDp(requireContext())}px; }
                :root { --native-navigation-inset-left: ${state.safeDrawing.left.pxToDp(requireContext())}px; }
                :root { --native-navigation-inset-right: ${state.safeDrawing.right.pxToDp(requireContext())}px; }
                            
                :root { --native-navigation-safe-content-inset-top: ${state.safeContent.top.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-content-inset-bottom: ${state.safeContent.bottom.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-content-inset-left: ${state.safeContent.left.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-content-inset-right: ${state.safeContent.right.pxToDp(ctx)}px; }
                
                :root { --native-navigation-safe-drawing-inset-top: ${state.safeDrawing.top.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-drawing-inset-bottom: ${state.safeDrawing.bottom.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-drawing-inset-left: ${state.safeDrawing.left.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-drawing-inset-right: ${state.safeDrawing.right.pxToDp(ctx)}px; }
                
                :root { --native-navigation-safe-gestures-inset-top: ${state.safeGestures.top.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-gestures-inset-bottom: ${state.safeGestures.bottom.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-gestures-inset-left: ${state.safeGestures.left.pxToDp(ctx)}px; }
                :root { --native-navigation-safe-gestures-inset-right: ${state.safeGestures.right.pxToDp(ctx)}px; }
                
                :root { --native-navigation-toolbar-height: ${state.toolbarHeight.pxToDp(ctx)}px; }
                """.trimIndent(), id = "native-navigation-inset")
            }
        }
    }

    private fun updateToolbar(animated: Boolean = false) {
        val animationDuration: Long = if (animated) 200 else 0
        val binding = binding ?: return
        val toolbar = binding.toolbar
        val appBarLayout = binding.appBarLayout
        val componentId = componentId ?: return
        val spec = viewModel.nativeNavigation?.viewSpecForId(componentId) ?: return

        val stackOptions = viewModel.nativeNavigation?.findStackComponentIdHosting(componentId)?.let {
            viewModel.nativeNavigation?.componentSpecForId(it) as? StackSpec
        }

        val state = barConfigurationViewModel.updateSpec(stackOptions, spec)
        toolbar.visibility = if (state.visible) View.VISIBLE else View.GONE
        webviewViewModel.updateToolbarVisible(state.visible)

        changeStatusBarColor(state.baseToolbarColors.background, animationDuration)

        toolbar.onMeasuredSize { _, height ->
            webviewViewModel.updateToolbarHeight(height)
        }

        animateAppBarColor(state, animationDuration)

        toolbar.invalidateMenu()

        val titleSpan = state.title?.toSpannable()
        state.titleFont?.let { fontOptions ->
            fontOptions.name?.let { fontName ->
                val typeface = FontManager.getTypeface(requireContext(), fontName, Typeface.NORMAL, requireContext().assets)
                titleSpan?.setSpan(CustomTypefaceSpan(typeface), 0, titleSpan.length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
            }
            fontOptions.size?.let { fontSize ->
                titleSpan?.setSpan(AbsoluteSizeSpan(fontSize.spToPx(requireContext())), 0, titleSpan.length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
            }
        }
        toolbar.title = titleSpan

        val tintColor: Int = state.baseToolbarColors.buttonsColor

        val navigationItem = spec.stackItem?.navigationItem()
        if (navigationItem != null) {
            navigationItem.image?.let { path ->
                fetchDrawable(path, tintColor) { icon ->
                    toolbar.navigationIcon = icon
                    toolbar.setNavigationOnClickListener {
                        viewModel.nativeNavigation?.notifyClick(navigationItem.id, componentId)
                    }
                }
            }
        } else {
            if (findNavController().previousBackStackEntry != null && spec.stackItem?.leftItems == null) {
                toolbar.setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
                toolbar.navigationIcon?.mutate()?.setTint(tintColor)
            } else {
                toolbar.navigationIcon = null
            }
        }
    }

    override fun onPause() {
        super.onPause()
        viewModel.nativeNavigation?.plugin?.notifyViewWillDisappear(componentId!!)
        viewModel.nativeNavigation?.plugin?.notifyViewDidDisappear(componentId!!)
    }

    override fun onResume() {
        super.onResume()
        updateToolbar()
        setupMenu()
        viewModel.nativeNavigation?.plugin?.notifyViewWillAppear(componentId!!)
        viewModel.nativeNavigation?.plugin?.notifyViewDidAppear(componentId!!)
    }

    private fun setupMenu() {
        val menuhost = binding?.toolbar ?: return
        menuhost.removeMenuProvider(this)
        menuhost.addMenuProvider(this, viewLifecycleOwner)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
        Log.d(TAG, "Fragment View Destroyed $this")
    }

    override fun onDestroy() {

        componentId?.let {
            viewModel.nativeNavigation?.notifyDestroyView(it)
        }
        super.onDestroy()
        Log.d(TAG, "Fragment Destroyed $this")
    }

    override fun onSaveInstanceState(outState: Bundle) {
        Log.d(TAG, "Saving Webview state")
        super.onSaveInstanceState(outState)
    }

    companion object {
        private const val TAG = "BlankViewFrag"
    }

    override fun onCreateMenu(menu: Menu, menuInflater: MenuInflater) {
        val componentId = componentId ?: return

        val spec = viewModel.nativeNavigation?.viewSpecForId(componentId) ?: return
        val stackOptions = viewModel.nativeNavigation?.findStackComponentIdHosting(componentId)?.let {
            viewModel.nativeNavigation?.componentSpecForId(it) as? StackSpec
        }

        val barSpec = stackOptions?.bar?.merge(spec.stackItem?.bar) ?: spec.stackItem?.bar

        val stackItem = spec.stackItem
        if (stackItem != null) {
            val items: MutableList<StackBarButtonItem> = mutableListOf()
            stackItem.nonNavigationLeftItems()?.let { items.addAll(it) }
            stackItem.rightItems?.let { items.addAll(it) }
            items.forEach { item ->
                val spanString = SpannableString(item.title)

                barSpec?.buttons?.let { labelOptions ->
                    previousState?.baseToolbarColors?.buttonsColor?.let { tintColor ->
                        spanString.setSpan(
                            ForegroundColorSpan(tintColor),
                            0,
                            spanString.length,
                            Spanned.SPAN_INCLUSIVE_INCLUSIVE
                        )
                    }
                    labelOptions.font?.let { fontOptions ->
                        fontOptions.name?.let { fontName ->
                            val typeface = FontManager.getTypeface(requireContext(), fontName, Typeface.NORMAL, requireContext().assets)
                            spanString.setSpan(CustomTypefaceSpan(typeface), 0, spanString.length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
                        }
                        fontOptions.size?.let { fontSize ->
                            spanString.setSpan(AbsoluteSizeSpan(fontSize.spToPx(requireContext())), 0, spanString.length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
                        }
                    }
                }

                val menuItem = menu.add(0, item.id.hashCode(), 0, spanString)

                item.image?.let { path ->
                    fetchDrawable(path, previousState?.baseToolbarColors?.buttonsColor) { icon ->
                        menuItem.icon = icon
                    }
                }

                menuItem.setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_IF_ROOM)
            }
        }
    }

    private fun fetchDrawable(path: String, tintColor: Int?, setDrawable: (Drawable?) -> Unit) {
        var url = path
        var scale: Double = 1.0
        var disableTint = false
        if (path.startsWith("{")) {
            /** This is a JSON object, let's convert and see what we find */
            val json = JSObject(path)
            url = json.getString("uri") ?: return setDrawable(null)
            if (json.has("scale")) {
                scale = json.getDouble("scale")
            }
            if (json.has("disableTint")) {
                disableTint = json.getBool("disableTint") ?: false
            }
        }

        fun handleResource(resource: Drawable) {
            if (!disableTint) {
                tintColor?.let {
                    resource.setTint(it)
                }
            }
            setDrawable(resource)
        }

        if (url.startsWith("data:")) {
            val decodedBytes = Base64.decode(url.substringAfter("base64,"),Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            bitmap.setDensityFromScale(scale)
            ImageRequest.Builder(requireContext())
                .data(bitmap)
                .target { resource ->
                    handleResource(resource)
                }
                .build().also {
                    requireContext().imageLoader.enqueue(it)
                }

        } else {
            val uri = Uri.parse(viewModel.baseUrl).buildUpon()
                .path(url)
                .build()
            val plugin = viewModel.nativeNavigation?.plugin
            when (uri.host) {
                plugin?.bridge?.host -> {
                    val response = plugin!!.bridge.localServer.shouldInterceptRequest(object: WebResourceRequest {
                        override fun getUrl(): Uri = uri
                        override fun isForMainFrame(): Boolean = true
                        override fun isRedirect(): Boolean = false
                        override fun hasGesture(): Boolean = true
                        override fun getMethod(): String = "GET"
                        override fun getRequestHeaders(): MutableMap<String, String> = mutableMapOf()
                    })
                    if (response != null && response.statusCode == 200) {

                        val outputStream = ByteArrayOutputStream()
                        response.data.use { input ->
                            outputStream.use { output ->
                                input.copyTo(output)
                            }
                        }
                        val byteArray = outputStream.toByteArray()

                        ImageRequest.Builder(requireContext())
                            .data(byteArray)
                            .target { resource ->
                                handleResource(resource)
                            }
                            .build().also {
                                requireContext().imageLoader.enqueue(it)
                            }
                    } else {
                        setDrawable(null)
                    }
                }
                else -> {
                    ImageRequest.Builder(requireContext())
                        .data(uri)
                        .target { resource ->
                            handleResource(resource)
                        }
                        .build().also {
                            requireContext().imageLoader.enqueue(it)
                        }
                }
            }
        }
    }

    override fun onMenuItemSelected(menuItem: MenuItem): Boolean {
        val spec = viewModel.nativeNavigation?.viewSpecForId(componentId!!)!!

        val options = spec.stackItem ?: return false
        val componentId = componentId ?: return false
        val items: MutableList<StackBarButtonItem> = mutableListOf()
        options.nonNavigationLeftItems()?.let { items.addAll(it) }
        options.rightItems?.let { items.addAll(it) }
        for (item in items) {
            if (menuItem.itemId == item.id.hashCode()) {
                viewModel.nativeNavigation?.notifyClick(item.id, componentId)
                return true
            }
        }
        return false
    }
}