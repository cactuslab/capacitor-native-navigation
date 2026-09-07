package com.cactuslab.capacitor.nativenavigation

import android.net.Uri
import android.util.Log
import android.webkit.WebResourceRequest
import android.webkit.WebView
import androidx.lifecycle.*
import com.cactuslab.capacitor.nativenavigation.types.UpdateOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.jsoup.Jsoup
import java.io.BufferedReader

class NativeNavigationViewModel: ViewModel() {

    sealed class Signal(var consumed: Boolean) {
        data class Update(val options: UpdateOptions) : Signal(false)
    }

    var nativeNavigation: NativeNavigation? = null

    private val signals : MutableMap<String, MutableLiveData<Signal>> = mutableMapOf()
    fun signalForId(id: String) : LiveData<Signal> = findOrCreateSignal(id)

    private val webViews : MutableMap<String, MutableLiveData<WebView>> = mutableMapOf()
    fun webViewLiveDataForId(id: String): LiveData<WebView> = findOrCreateWebViewLiveData(id)

    fun reset() {
        signals.clear()
        webViews.clear()
    }

    fun cleanUpComponentWithId(id: String) {
        signals.remove(id)
        webViews.remove(id)
    }

    private fun findOrCreateSignal(id: String): MutableLiveData<Signal> = signals[id] ?: run {
        val liveData = MutableLiveData<Signal>()
        signals[id] = liveData
        return@run liveData
    }

    private fun findOrCreateWebViewLiveData(id: String): MutableLiveData<WebView> = webViews[id] ?: run {
        val liveData = MutableLiveData<WebView>()
        webViews[id] = liveData
        return@run liveData
    }

    fun postUpdate(options: UpdateOptions, id: String) {
        val signal = findOrCreateSignal(id)
        signal.postValue(Signal.Update(options))
    }


    private val htmlStateFlow = MutableStateFlow<String?>(null)

    fun setHtml(url: String, webView: WebView, plugin: NativeNavigationPlugin) {
        baseUrl = url

        val html = htmlStateFlow.value
        if (html != null) {
            viewModelScope.launch(Dispatchers.Main) {
                webView.loadDataWithBaseURL(url, html,"text/html", "utf-8", null)
            }
            return
        }

        val uri = Uri.parse(url)

        when (uri.host) {
            plugin.bridge.host -> {

                val response = plugin.bridge.localServer.shouldInterceptRequest(object: WebResourceRequest {
                    override fun getUrl(): Uri = uri
                    override fun isForMainFrame(): Boolean = true
                    override fun isRedirect(): Boolean = false
                    override fun hasGesture(): Boolean = true
                    override fun getMethod(): String = "GET"
                    override fun getRequestHeaders(): MutableMap<String, String> = mutableMapOf()
                })

                if (response != null && response.statusCode == 200) {
                    viewModelScope.launch(Dispatchers.Default) {
                        val string = response.data.bufferedReader().use(BufferedReader::readText)
                        val sanitised = sanitiseHtml(string)
                        htmlStateFlow.value = sanitised
                        withContext(Dispatchers.Main) {
                            webView.loadDataWithBaseURL(url, sanitised,"text/html", "utf-8", null)
                        }
                    }

                    Log.d(TAG, "Go a response $response")
                } else {
                    Log.d(TAG, "Got Nothing from localServer")
                }
            }
            else -> {
                viewModelScope.launch {
                    withContext(Dispatchers.Default) {
                        val string = Jsoup.connect(url).header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8").get().toString()
                        val sanitised = sanitiseHtml(string)
                        htmlStateFlow.value = sanitised
                        withContext(Dispatchers.Main) {
                            webView.loadDataWithBaseURL(url, sanitised,"text/html", "utf-8", null)
                        }
                    }
                }
            }
        }
    }

    /**
     * Remove the script elements from the html, as no JavaScript must run in the webviews that we
     * create for the views. We remove the elements rather than comment them out, as a comment can
     * be terminated early by the content of a script.
     */
    private fun sanitiseHtml(html: String): String {
        return html
            .replace(SELF_CLOSING_SCRIPT_REGEX, "")
            .replace(SCRIPT_REGEX, "")
    }

    fun postWebView(view: WebView, id: String) {
        val signal = findOrCreateWebViewLiveData(id)
        signal.postValue(view)
    }

    lateinit var baseUrl: String

//    private val mHtmlLiveData = MutableLiveData<String>()
//    val htmlLiveData: LiveData<String> = mHtmlLiveData


    companion object {
        private const val TAG = "ViewModel"

        /** Matches a script element, and its content, however the element is capitalised */
        private val SCRIPT_REGEX = Regex(
            "<script\\b[^>]*>.*?</script\\s*>",
            setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)
        )

        /** Matches a self closing script element, however the element is capitalised */
        private val SELF_CLOSING_SCRIPT_REGEX = Regex("<script\\b[^>]*/>", RegexOption.IGNORE_CASE)
    }
}