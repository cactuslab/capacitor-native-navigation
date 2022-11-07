package com.cactuslab.capacitor.nativenavigation.ui

import android.os.Bundle
import androidx.lifecycle.ViewModel
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import kotlinx.coroutines.flow.MutableStateFlow
import androidx.lifecycle.asLiveData

class WebviewViewModel: ViewModel() {

    var hasInitialisedWebview = false

    var bundledState: Bundle? = null

    private val componentOptionsState = MutableStateFlow<ComponentOptions?>(null)
    val componentOptionsLiveData = componentOptionsState.asLiveData()

    fun setComponentOptions(options: ComponentOptions?) {
       componentOptionsState.value = options
    }

}