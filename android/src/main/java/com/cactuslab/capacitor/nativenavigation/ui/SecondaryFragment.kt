package com.cactuslab.capacitor.nativenavigation.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.navArgs
import com.cactuslab.capacitor.nativenavigation.NativeNavigationViewModel
import com.cactuslab.capacitor.nativenavigation.databinding.FragmentScreenBinding
import com.getcapacitor.BridgeActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import java.nio.charset.StandardCharsets

class SecondaryFragment: Fragment() {
    private var binding: FragmentScreenBinding? = null

    private val viewModel : NativeNavigationViewModel by activityViewModels()
    private val webviewViewModel: WebviewViewModel by viewModels()

    private var hasRunOpen: Boolean = false

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return FragmentScreenBinding.inflate(inflater, container, false).also { binding = it }.root
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val binding = binding ?: return

        val settings = binding.webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.setGeolocationEnabled(true)
        settings.databaseEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true

        val args: SecondaryFragmentArgs by navArgs()
//        args.mainLabel?.let {
//            binding.mainTextView.text = it
//        }

        val bridgeActivity : BridgeActivity = getActivity() as BridgeActivity
        val bridge = bridgeActivity.bridge

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

        webviewViewModel.bundledState?.let {bundle ->
            Log.d(TAG, "Restoring Webview state")
            binding.webView.restoreState(bundle)
        }
//        savedInstanceState?.let { bundle ->
//            bundle.getBundle("webviewState")?.let { webviewBundle ->
//
//            }
//        }



//        args.callbackId?.let {
//            val call = bridge.getSavedCall(args.callbackId)
//            call.resolve()
//            bridge.releaseCall(call)
//        }



        Log.d(TAG, "Starting observation with id: ${args.optionsId} on $this")

        viewModel.signalForId(args.optionsId).observe(viewLifecycleOwner) { signal ->
            when (signal) {
                is NativeNavigationViewModel.Signal.WindowOpen -> {
                    if (signal.consumed || this.hasRunOpen) {
                        Log.d(TAG, "Signal consumed, no attempt to bind $this")
                        return@observe
                    }
                    hasRunOpen = true
                    Log.d(TAG, "Receiving window.open with id:${args.optionsId} on $this")
                    val webViewTransport = signal.message.obj!! as WebView.WebViewTransport
                    webViewTransport.webView = binding.webView
                    Log.d(TAG, "Frag got signal to window open")
                    signal.message.sendToTarget()
                    signal.consumed = true

                }
            }
        }


//        val message = args.resultMessage
//        val webViewTransport = message!!.obj!! as WebView.WebViewTransport
//
//        webViewTransport.webView = binding.webView
        binding.webView.visibility = View.VISIBLE
//
//        message.sendToTarget()
    }

    override fun onDestroyView() {
        val bundle = Bundle()
        binding?.webView?.saveState(bundle)
        webviewViewModel.bundledState = bundle
        super.onDestroyView()


        Log.d(TAG, "Fragment View Destroyed $this")
    }

    override fun onDestroy() {
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

            viewModel.htmlLiveData.observe(viewLifecycleOwner) { htmlString ->
                // binding.webView.loadDataWithBaseURL("http://tbook.local:5173",htmlString, null, null, null)
                Log.d(TAG, "Loading HTML into webview to get it started on $this")
                binding.webView.loadDataWithBaseURL(viewModel.baseUrl, htmlString, "text/html", "utf-8", null)
                viewModel.htmlLiveData.removeObservers(viewLifecycleOwner)
            }
        }
    }

    companion object {
        private const val TAG = "SecondaryFrag"
    }
}