package com.cactuslab.capacitor.nativenavigation.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding

class HostFragment: Fragment() {

    var binding: ActivityNavigationBinding? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ActivityNavigationBinding.inflate(inflater, container, false).also { this.binding = it }.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
    }

}