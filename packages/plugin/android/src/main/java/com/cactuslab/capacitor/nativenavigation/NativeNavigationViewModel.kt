package com.cactuslab.capacitor.nativenavigation

import android.os.Message
import android.webkit.WebView
import androidx.lifecycle.*
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import com.cactuslab.capacitor.nativenavigation.types.SetComponentOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.jsoup.Jsoup

class NativeNavigationViewModel: ViewModel() {

    sealed class Signal(var consumed: Boolean) {
        data class SetOptions(val options: SetComponentOptions) : Signal(false)
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

    fun postSetOptions(options: SetComponentOptions, id: String) {
        val signal = findOrCreateSignal(id)
        signal.postValue(Signal.SetOptions(options))
    }

    fun setHtml(url: String, webView: WebView) {
        baseUrl = url
        viewModelScope.launch {
            withContext(Dispatchers.Default) {
                val string = Jsoup.connect(url).header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8").get().toString()
                val sanitised = string.replace("<script", "<!-- ").replace("</script>", " -->")
//                mHtmlLiveData.postValue(sanitised)

                withContext(Dispatchers.Main) {
                    webView.loadDataWithBaseURL(url, sanitised,"text/html", "utf-8", null)
                }

            }
        }
    }

    fun postWebView(view: WebView, id: String) {
        val signal = findOrCreateWebViewLiveData(id)
        signal.postValue(view)
    }

    lateinit var baseUrl: String

    private val mHtmlLiveData = MutableLiveData<String>()
    val htmlLiveData: LiveData<String> = mHtmlLiveData

}