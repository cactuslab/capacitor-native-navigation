package com.cactuslab.capacitor.nativenavigation.ui

import android.os.Bundle
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import kotlinx.coroutines.flow.MutableStateFlow
import androidx.lifecycle.asLiveData

class WebviewViewModel: ViewModel() {

    var hasInitialisedWebview = false

    var bundledState: Bundle? = null

    private val componentOptionsState = MutableLiveData<ComponentOptions>()
    val componentOptionsLiveData: LiveData<ComponentOptions> = componentOptionsState

    fun setComponentOptions(options: ComponentOptions?) {

        val currentOptions = componentOptionsState.value
        if (options != null && currentOptions != null) {
            currentOptions.mergeOptions(options)
            componentOptionsState.postValue(currentOptions!!)
        } else if (currentOptions == null && options != null) {
            componentOptionsState.postValue(options!!)
        }
    }

}