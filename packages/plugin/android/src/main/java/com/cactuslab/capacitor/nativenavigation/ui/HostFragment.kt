package com.cactuslab.capacitor.nativenavigation.ui

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import androidx.fragment.app.Fragment
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding

class HostFragment: NativeNavigationFragment() {

    var binding: ActivityNavigationBinding? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ActivityNavigationBinding.inflate(inflater, container, false).also { this.binding = it }.root
    }

    companion object {
        private const val TAG = "HostFragment"
    }
}