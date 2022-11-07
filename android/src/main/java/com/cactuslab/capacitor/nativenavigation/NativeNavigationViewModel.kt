package com.cactuslab.capacitor.nativenavigation

import android.os.Message
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
        data class WindowOpen(val message: Message) : Signal(false)
        data class SetOptions(val options: SetComponentOptions) : Signal(false)
    }

    var nativeNavigation: NativeNavigation? = null

    private val signals : MutableMap<String, MutableLiveData<Signal>> = mutableMapOf()

    fun signalForId(id: String) : LiveData<Signal> = signals[id] ?: run {
        val liveData = MutableLiveData<Signal>()
        signals[id] = liveData
        return@run liveData
    }

    fun postWindowOpen(message: Message, id: String) {
        val signal = signals[id]
        signal?.postValue(Signal.WindowOpen(message))
    }

    fun postSetOptions(options: SetComponentOptions, id: String) {
        val signal = signals[id]
        signal?.postValue(Signal.SetOptions(options))
    }

    fun setHtml(url: String) {
        baseUrl = url
        viewModelScope.launch {
            withContext(Dispatchers.Default) {
                val string = Jsoup.connect(url).header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8").get().toString()

                val sanitised = string.replace("<script", "<!--").replace("</script>", "-->")

                mHtmlLiveData.postValue(sanitised)
            }
        }
    }

    lateinit var baseUrl: String

    private val mHtmlLiveData = MutableLiveData<String>()
    val htmlLiveData: LiveData<String> = mHtmlLiveData

}