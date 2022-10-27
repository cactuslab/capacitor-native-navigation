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
import androidx.navigation.fragment.navArgs
import com.cactuslab.capacitor.nativenavigation.NativeNavigationViewModel
import com.cactuslab.capacitor.nativenavigation.databinding.FragmentScreenBinding
import com.getcapacitor.BridgeActivity
import java.nio.charset.StandardCharsets

class SecondaryFragment: Fragment() {
    private var binding: FragmentScreenBinding? = null

    private val viewModel : NativeNavigationViewModel by activityViewModels()

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
        args.mainLabel?.let {
            binding.mainTextView.text = it
        }
        val bridgeActivity : BridgeActivity = getActivity() as BridgeActivity
        val bridge = bridgeActivity.bridge

        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                Log.d(TAG, "Web view loading request ${request?.url} MainFrame:${request?.isForMainFrame}")

                return true
            }
        }

        args.callbackId?.let {
            val call = bridge.getSavedCall(args.callbackId)
            call.resolve()
            bridge.releaseCall(call)
        }

        viewModel.htmlLiveData.observe(viewLifecycleOwner) { htmlString ->
            // binding.webView.loadDataWithBaseURL("http://tbook.local:5173",htmlString, null, null, null)
            Log.d(TAG, "Expecting to load html $htmlString")
            binding.webView.loadDataWithBaseURL(viewModel.baseUrl, htmlString, "text/html", "utf-8", null)
        }

        val message = args.resultMessage
        val webViewTransport = message!!.obj!! as WebView.WebViewTransport

        webViewTransport.webView = binding.webView
        binding.webView.visibility = View.VISIBLE

        message.sendToTarget()
    }

    companion object {
        private const val TAG = "SecondaryFrag"
    }
}