package com.cactuslab.capacitor.nativenavigation.ui

import android.annotation.SuppressLint
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.text.SpannableString
import android.text.Spanned
import android.text.style.AbsoluteSizeSpan
import android.text.style.ForegroundColorSpan
import android.util.Base64
import android.util.DisplayMetrics
import android.util.Log
import android.view.*
import android.webkit.WebResourceRequest
import android.webkit.WebView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.text.toSpannable
import androidx.core.view.MenuProvider
import androidx.core.view.WindowCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import coil.imageLoader
import coil.request.ImageRequest
import com.cactuslab.capacitor.nativenavigation.NativeNavigationViewModel
import com.cactuslab.capacitor.nativenavigation.databinding.FragmentBlankBinding
import com.cactuslab.capacitor.nativenavigation.helpers.*
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.cactuslab.capacitor.nativenavigation.types.StackSpec
import com.getcapacitor.JSObject
import com.google.android.material.appbar.AppBarLayout
import java.io.ByteArrayOutputStream

class ViewSpecFragment : Fragment(), MenuProvider {
    private var binding: FragmentBlankBinding? = null

    private val viewModel : NativeNavigationViewModel by activityViewModels()
    private val webviewViewModel: WebviewViewModel by viewModels()
    private var componentId: String? = null

    private var webView: WebView? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return FragmentBlankBinding.inflate(inflater, container, false).also {
            binding = it
        }.root
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

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

            val layoutParams = CoordinatorLayout.LayoutParams(CoordinatorLayout.LayoutParams.MATCH_PARENT, CoordinatorLayout.LayoutParams.MATCH_PARENT)
            layoutParams.behavior = AppBarLayout.ScrollingViewBehavior()
            webview.layoutParams = layoutParams

            binding.root.addView(webview, 0)
            this.webView = webview
        }

        viewModel.signalForId(optionsId).observe(viewLifecycleOwner) { signal ->
            if (signal.consumed ) {
                Log.d(TAG, "Signal consumed. No Action Taken")
                return@observe
            }

            when (signal) {
                is NativeNavigationViewModel.Signal.Update -> {
                    Log.d(TAG, "update Received $optionsId pushing to viewModel")
                    updateToolbar()
                    setupMenu()
                }
            }

            signal.consumed = true
        }
    }

    private fun updateToolbar() {
        val spec = viewModel.nativeNavigation!!.viewSpecForId(componentId!!)!!
        val toolbar = binding?.toolbar ?: return
        val appBarLayout = binding?.appBarLayout ?: return
        val componentId = componentId ?: return

        val stackOptions = viewModel.nativeNavigation?.findStackComponentIdHosting(componentId)?.let {
            viewModel.nativeNavigation?.componentSpecForId(it) as? StackSpec
        }

        val isStack = stackOptions?.type == ComponentType.STACK
        val barSpec = stackOptions?.bar?.merge(spec.stackItem?.bar) ?: spec.stackItem?.bar

        Log.d(TAG, "viewModel update being applied $componentId")
        if (spec.stackItem == null && stackOptions?.bar == null || !isStack) {
            toolbar.visibility = View.GONE
        } else {
            val isToolbarVisible = barSpec?.visible ?: true
            toolbar.visibility = if (isToolbarVisible) View.VISIBLE else View.GONE
            val titleSpan = spec.title?.toSpannable()

            barSpec?.let { bar ->
                bar.background?.color?.let { color ->
                    val colorInt = color.parseRGBAColor()

                    toolbar.setBackgroundColor(colorInt)
                    requireActivity().window.statusBarColor = colorInt
                    appBarLayout.setBackgroundColor(colorInt)

                    val alpha = Color.alpha(colorInt)
                    val isTransparent = alpha < 255

                    if (isTransparent) {
                        val layoutParams = CoordinatorLayout.LayoutParams(CoordinatorLayout.LayoutParams.MATCH_PARENT, CoordinatorLayout.LayoutParams.MATCH_PARENT)
                        this.webView?.layoutParams = layoutParams

                        toolbar.onMeasuredSize { width, height ->
                            this.webView?.injectCSS("""
                                :root { --native-navigation-inset-top: ${height.pxToDp(requireContext())}px; }
                            """.trimIndent(), id = "cool")
                        }

                    } else {
                        val layoutParams = CoordinatorLayout.LayoutParams(CoordinatorLayout.LayoutParams.MATCH_PARENT, CoordinatorLayout.LayoutParams.MATCH_PARENT)
                        layoutParams.behavior = AppBarLayout.ScrollingViewBehavior()
                        this.webView?.layoutParams = layoutParams
                        this.webView?.injectCSS("""
                                :root { --native-navigation-inset-top: ${0}px; }
                            """.trimIndent(), id = "cool")
                    }

                    WindowCompat.getInsetsController(requireActivity().window, requireActivity().window.decorView).isAppearanceLightStatusBars = !colorInt.isColorDark()
                }

                bar.title?.let { labelOptions ->
                    labelOptions.color?.let { color ->
                        toolbar.setTitleTextColor(color.parseRGBAColor())
                    }
                    labelOptions.font?.let { fontOptions ->
                        fontOptions.name?.let { fontName ->
                            val typeface = FontManager.getTypeface(requireContext(), fontName, Typeface.NORMAL, requireContext().assets)
                            titleSpan?.setSpan(CustomTypefaceSpan(typeface), 0, titleSpan.length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
                        }
                        fontOptions.size?.let { fontSize ->
                            titleSpan?.setSpan(AbsoluteSizeSpan(fontSize.spToPx(requireContext())), 0, titleSpan.length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
                        }
                    }
                }

                bar.buttons?.let { labelOptions ->
                    labelOptions.color?.let { color ->
                        toolbar.setNavigationIconTint(color.parseRGBAColor())
                    }
                }
            }

            toolbar.title = titleSpan

//            barSpec?.let { bar ->
//                bar.background?.color?.let { color ->
//                    toolbar.setBackgroundColor(color.parseRGBAColor())
//                }
//            }

        }

        toolbar.invalidateMenu()

        if (findNavController().previousBackStackEntry != null && spec.stackItem?.backEnabled != false) {
            toolbar.setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
        } else {
            toolbar.navigationIcon = null
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

        val spec = viewModel.nativeNavigation?.viewSpecForId(componentId)!!
        val stackOptions = viewModel.nativeNavigation?.findStackComponentIdHosting(componentId)?.let {
            viewModel.nativeNavigation?.componentSpecForId(it) as? StackSpec
        }

        val barSpec = stackOptions?.bar?.merge(spec.stackItem?.bar) ?: spec.stackItem?.bar

        val stackItem = spec.stackItem
        if (stackItem != null) {
            stackItem.rightItems?.forEach { item ->
                val spanString = SpannableString(item.title)
                var tintColor: Int? = null

                barSpec?.buttons?.let { labelOptions ->
                    labelOptions.color?.let { color ->
                        tintColor = color.parseRGBAColor()
                        spanString.setSpan(ForegroundColorSpan(color.parseRGBAColor()), 0, spanString.length, 0)
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
                    var url = path
                    var scale: Double = 1.0
                    if (path.startsWith("{")) {
                        /** This is a JSON object, let's convert and see what we find */
                        val json = JSObject(path)
                        url = json.getString("uri") ?: return@let
                        if (json.has("scale")) {
                            scale = json.getDouble("scale")
                        }
                    }
                    if (url.startsWith("data:")) {
                        val decodedBytes = Base64.decode(url.substringAfter("base64,"),Base64.DEFAULT)
                        val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                        bitmap.setDensityFromScale(scale)
                        ImageRequest.Builder(requireContext())
                            .data(bitmap)
                            .target { resource ->
                                tintColor?.let {
                                    resource.setTint(it)
                                }
                                menuItem.icon = resource
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
                                            tintColor?.let {
                                                resource.setTint(it)
                                            }
                                            menuItem.icon = resource
                                        }
                                        .build().also {
                                            requireContext().imageLoader.enqueue(it)
                                        }
                                } else {}
                            }
                            else -> {
                                ImageRequest.Builder(requireContext())
                                    .data(uri)
                                    .target { resource ->
                                        tintColor?.let {
                                            resource.setTint(it)
                                        }
                                        menuItem.icon = resource
                                    }
                                    .build().also {
                                        requireContext().imageLoader.enqueue(it)
                                    }
                            }
                        }
                    }
                }

                menuItem.setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_IF_ROOM)
            }
        }
    }

    override fun onMenuItemSelected(menuItem: MenuItem): Boolean {
        val spec = viewModel.nativeNavigation?.viewSpecForId(componentId!!)!!

        val options = spec.stackItem ?: return false
        val componentId = componentId ?: return false
        for (item in options.rightItems ?: listOf()) {
            if (menuItem.itemId == item.id.hashCode()) {
                viewModel.nativeNavigation?.notifyClick(item.id, componentId)
                return true
            }
        }

        return false
    }
}