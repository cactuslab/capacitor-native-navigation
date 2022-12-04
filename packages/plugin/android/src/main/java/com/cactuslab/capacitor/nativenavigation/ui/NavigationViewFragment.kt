package com.cactuslab.capacitor.nativenavigation.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.*
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.view.MenuHost
import androidx.core.view.MenuProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.cactuslab.capacitor.nativenavigation.NativeNavigationViewModel
import com.cactuslab.capacitor.nativenavigation.databinding.FragmentScreenBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NavigationViewFragment: Fragment() {
    private var binding: FragmentScreenBinding? = null

    private val viewModel : NativeNavigationViewModel by activityViewModels()
    private val webviewViewModel: WebviewViewModel by viewModels()
    private var componentId: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return FragmentScreenBinding.inflate(inflater, container, false).also {
            binding = it
        }.root
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val binding = binding ?: return

        setupToolbar(binding.toolbar)

        setupMenu()

        val settings = binding.webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.setGeolocationEnabled(true)
        settings.databaseEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true

        // if optionsId is null then the view is present as an unconfigured first launch. This view will likely be replaced immediately
        val optionsId = (this.arguments?.getString("optionsId") ?: return).also { this.componentId = it }

        Log.d(TAG, "Setting up Fragment with component id: $optionsId.")

        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                Log.d(TAG, "Web view loading request ${request?.url} MainFrame:${request?.isForMainFrame}")

                tryLoadHTML()
                return true
            }
        }

        val nativeNavigation = viewModel.nativeNavigation!!
        val bundle = webviewViewModel.bundledState
        if (bundle != null) {
            binding.webView.restoreState(bundle)
            webviewViewModel.hasInitialisedWebview = true
        } else {

            nativeNavigation.notifyCreateView(optionsId)
        }

        val componentSpec = nativeNavigation.componentSpecForId(optionsId)!!

        componentSpec.options?.let {
            webviewViewModel.setComponentOptions(it)
        }

        webviewViewModel.componentOptionsLiveData.observe(viewLifecycleOwner) { options ->
            if (options == null) {
                binding.toolbar.visibility = View.GONE
            } else {
                binding.toolbar.visibility = View.VISIBLE
                binding.toolbar.title = options.title?.value()
            }

            binding.toolbar.invalidateMenu()

            if (findNavController().previousBackStackEntry != null) {
                binding.toolbar.setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
            }
        }

        Log.d(TAG, "Starting observation with id: $optionsId on $this")

        viewModel.signalForId(optionsId).observe(viewLifecycleOwner) { signal ->
            if (signal.consumed ) {
                Log.d(TAG, "Signal consumed. No Action Taken")
                return@observe
            }

            when (signal) {
//                is NativeNavigationViewModel.Signal.WindowOpen -> {
//                    Log.d(TAG, "Receiving window.open with id:${optionsId} on $this")
//                    val webViewTransport = signal.message.obj!! as WebView.WebViewTransport
//                    webViewTransport.webView = binding.webView
//                    Log.d(TAG, "Frag got signal to window open")
//                    signal.message.sendToTarget()
//                }
                is NativeNavigationViewModel.Signal.SetOptions -> {
                    webviewViewModel.setComponentOptions(signal.options.options)
                }
                else -> {}
            }

            signal.consumed = true
        }

        binding.webView.visibility = View.VISIBLE
    }

    private fun setupMenu() {
        val menuhost = binding?.toolbar ?: return

        menuhost.addMenuProvider(object: MenuProvider {
            override fun onCreateMenu(menu: Menu, menuInflater: MenuInflater) {

                val options = webviewViewModel.componentOptionsLiveData.value
                if (options != null) {
                    options.stack?.rightItems?.forEach { item ->
                        val menuItem = menu.add(0, item.id.hashCode(), 0, item.title)
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

        val bundle = Bundle()
        binding?.webView?.saveState(bundle)
        webviewViewModel.bundledState = bundle
        webviewViewModel.hasInitialisedWebview = false
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


        val binding = binding ?: return
        val bundle = Bundle()
        binding.webView.saveState(bundle)
        outState.putBundle("webviewState", bundle)
    }



    private fun tryLoadHTML() {
        if (webviewViewModel.hasInitialisedWebview) {
            return
        }
        webviewViewModel.hasInitialisedWebview = true

        lifecycleScope.launch(Dispatchers.Main) {
            val binding = binding ?: return@launch

//            viewModel.htmlLiveData.observe(viewLifecycleOwner) { htmlString ->
//                Log.d(TAG, "Loading HTML into webview to get it started on $this")
//                binding.webView.loadDataWithBaseURL(viewModel.baseUrl, htmlString, "text/html", "utf-8", null)
//                viewModel.htmlLiveData.removeObservers(viewLifecycleOwner)
//            }
        }
    }

    companion object {
        private const val TAG = "NavigationFrag"
    }
}