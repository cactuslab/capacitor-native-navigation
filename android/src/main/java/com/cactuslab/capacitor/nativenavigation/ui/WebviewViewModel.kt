package com.cactuslab.capacitor.nativenavigation.ui

import android.os.Bundle
import androidx.lifecycle.ViewModel

class WebviewViewModel: ViewModel() {

    var hasInitialisedWebview = false

    var bundledState: Bundle? = null

}