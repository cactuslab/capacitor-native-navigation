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
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import com.cactuslab.capacitor.nativenavigation.types.ComponentType
import com.getcapacitor.JSObject
import com.google.android.material.appbar.AppBarLayout
import java.io.ByteArrayOutputStream

class BlankViewFragment : Fragment() {
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

        val nativeNavigation = viewModel.nativeNavigation!!

        val componentSpec = nativeNavigation.componentSpecForId(optionsId)!!

        componentSpec.options?.let {
            webviewViewModel.setComponentOptions(it)
        }

        updateToolbar(componentSpec.options)
        webviewViewModel.componentOptionsLiveData.observe(viewLifecycleOwner) { options ->
            updateToolbar(options)
        }

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
                is NativeNavigationViewModel.Signal.SetOptions -> {
                    Log.d(TAG, "setOptions Received $optionsId pushing to viewModel")
                    webviewViewModel.setComponentOptions(signal.options.options)
                }
            }

            signal.consumed = true
        }
    }

    private fun updateToolbar(options: ComponentOptions?) {
        val toolbar = binding?.toolbar ?: return
        val appBarLayout = binding?.appBarLayout ?: return
        val componentId = componentId ?: return

        val stackOptions = viewModel.nativeNavigation?.findStackComponentIdHosting(componentId)?.let {
            viewModel.nativeNavigation?.componentSpecForId(it)
        }

        val isStack = stackOptions?.type == ComponentType.STACK

        Log.d(TAG, "viewModel setOptions being applied $componentId")
        if (options == null && stackOptions?.options?.bar == null || !isStack) {
            toolbar.visibility = View.GONE
        } else {

            val isToolbarVisible = options?.bar?.visible ?: true
            toolbar.visibility = if (isToolbarVisible) View.VISIBLE else View.GONE
            val titleSpan = options?.title?.value()?.toSpannable()

            stackOptions?.options?.bar?.let { bar ->
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

            options?.bar?.let { bar ->
                bar.background?.color?.let { color ->
                    toolbar.setBackgroundColor(color.parseRGBAColor())
                }
            }

        }

        toolbar.invalidateMenu()

        if (findNavController().previousBackStackEntry != null && options?.stack?.backEnabled != false) {
            toolbar.setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
        } else {
            toolbar.navigationIcon = null
        }
    }

    private fun setupMenu() {
        val menuhost = binding?.toolbar ?: return

        menuhost.addMenuProvider(object: MenuProvider {
            override fun onCreateMenu(menu: Menu, menuInflater: MenuInflater) {

                val componentId = componentId ?: return

                val stackOptions = viewModel.nativeNavigation?.findStackComponentIdHosting(componentId)?.let {
                    viewModel.nativeNavigation?.componentSpecForId(it)
                }

                val options = webviewViewModel.componentOptionsLiveData.value
                if (options != null) {
                    options.stack?.rightItems?.forEach { item ->
                        val spanString = SpannableString(item.title)
                        var tintColor: Int? = null

                        stackOptions?.options?.bar?.buttons?.let { labelOptions ->
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
                            if (path.startsWith("{")) {
                                /** This is a JSON object, let's convert and see what we find */
                                val json = JSObject(path)
                                url = json.getString("uri") ?: return@let
                            }
                            if (url.startsWith("data:")) {
                                val decodedBytes = Base64.decode(path.substringAfter("base64,"),Base64.DEFAULT)
                                val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)

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
                val options = webviewViewModel.componentOptionsLiveData.value?.stack ?: return false
                val componentId = componentId ?: return false
                for (item in options.rightItems ?: listOf()) {
                    if (menuItem.itemId == item.id.hashCode()) {
                        viewModel.nativeNavigation?.notifyClick(item.id, componentId)
                        return true
                    }
                }

                return false
            }
        }, viewLifecycleOwner)
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
}