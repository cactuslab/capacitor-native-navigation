package com.cactuslab.capacitor.nativenavigation.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.*
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.view.MenuProvider
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.cactuslab.capacitor.nativenavigation.NativeNavigationViewModel
import com.cactuslab.capacitor.nativenavigation.databinding.FragmentBlankBinding
import com.cactuslab.capacitor.nativenavigation.types.ComponentOptions
import com.google.android.material.appbar.AppBarLayout
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class ModalBottomSheet: BottomSheetDialogFragment() {

    private var binding: FragmentBlankBinding? = null

    private val viewModel : NativeNavigationViewModel by activityViewModels()
    private val webviewViewModel: WebviewViewModel by viewModels()
    private var componentId: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return FragmentBlankBinding.inflate(inflater, container, false).also {
            binding = it
        }.root
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val binding = binding ?: return

//        setupToolbar(binding.toolbar)

        setupMenu()

        // if optionsId is null then the view is present as an unconfigured first launch. This view will likely be replaced immediately
        val optionsId = (this.arguments?.getString("optionsId") ?: return).also { this.componentId = it }

        Log.d(TAG, "Setting up Fragment with component id: $optionsId.")

        val nativeNavigation = viewModel.nativeNavigation!!

        val componentSpec = nativeNavigation.componentSpecForId(optionsId)!!

        componentSpec.options?.let {
            webviewViewModel.setComponentOptions(it)
        }

        updateToolbar(componentSpec.options)
        webviewViewModel.componentOptionsLiveData.observe(viewLifecycleOwner) { options ->
            updateToolbar(options)
        }

        Log.d(TAG, "Starting observation with id: $optionsId on $this")

        viewModel.webViewLiveDataForId(optionsId).observe(viewLifecycleOwner) { webview ->
            if (webview == null) {
                return@observe
            }

            webview.parent?.let {
                val group = it as ViewGroup
                group.removeView(webview)
            }

            val layoutParams = CoordinatorLayout.LayoutParams(CoordinatorLayout.LayoutParams.MATCH_PARENT, CoordinatorLayout.LayoutParams.MATCH_PARENT)
            layoutParams.behavior = AppBarLayout.ScrollingViewBehavior()
            webview.layoutParams = layoutParams

            binding.root.addView(webview, 0)
        }

        viewModel.signalForId(optionsId).observe(viewLifecycleOwner) { signal ->
            if (signal.consumed ) {
                Log.d(TAG, "Signal consumed. No Action Taken")
                return@observe
            }

            when (signal) {
                is NativeNavigationViewModel.Signal.Update -> {
                    Log.d(TAG, "update Received $optionsId pushing to viewModel")
                    webviewViewModel.setComponentOptions(signal.options.options)
                }
            }

            signal.consumed = true
        }
    }

    private fun updateToolbar(options: ComponentOptions?) {
        val toolbar = binding?.toolbar ?: return

        Log.d(TAG, "viewModel update being applied $componentId")
        if (options == null) {
            toolbar.visibility = View.GONE
        } else {
            toolbar.visibility = View.VISIBLE
            toolbar.title = options.title?.value()
        }

        toolbar.invalidateMenu()

        if (findNavController().previousBackStackEntry != null) {
            toolbar.setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
        }
    }

    private fun setupMenu() {
        val menuhost = binding?.toolbar ?: return

        menuhost.addMenuProvider(object: MenuProvider {
            override fun onCreateMenu(menu: Menu, menuInflater: MenuInflater) {

                val options = webviewViewModel.componentOptionsLiveData.value
                if (options != null) {
                    options.stack?.rightItems?.forEach { item ->
                        val menuItem = menu.add(0, item.id.hashCode(), 0, item.title)
                        menuItem.setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_IF_ROOM)
                    }
                }

            }

            override fun onMenuItemSelected(menuItem: MenuItem): Boolean {
                val options = webviewViewModel.componentOptionsLiveData.value?.stack ?: return false
                val componentId = componentId ?: return false
                for (item in options.rightItems ?: listOf()) {
                    if (menuItem.itemId == item.id.hashCode()) {
                        viewModel.nativeNavigation?.notifyClick(item.id, componentId)
                        return true
                    }
                }

                return false
            }
        }, viewLifecycleOwner)
    }

    override fun onDestroyView() {
        super.onDestroyView()

        Log.d(TAG, "Fragment View Destroyed $this")
    }

    override fun onDestroy() {

        componentId?.let {
            viewModel.nativeNavigation?.notifyDestroyView(it)
        }
        super.onDestroy()
        Log.d(TAG, "Fragment Destroyed $this")
    }

    override fun onSaveInstanceState(outState: Bundle) {
        Log.d(TAG, "Saving Webview state")
        super.onSaveInstanceState(outState)
    }

    companion object {
        private const val TAG = "ModalBottomSheet"
    }
}