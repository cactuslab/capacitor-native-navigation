package com.cactuslab.capacitor.nativenavigation.ui

import android.os.Bundle
import android.util.Log
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.findFragment
import androidx.navigation.NavController
import androidx.navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.cactuslab.capacitor.nativenavigation.R
import com.cactuslab.capacitor.nativenavigation.databinding.ActivityNavigationBinding

class NavigationActivity: AppCompatActivity() {
    private var binding: ActivityNavigationBinding? = null
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val binding = ActivityNavigationBinding.inflate(layoutInflater).also { this.binding = it }
        setContentView(binding.root)

        navController = supportFragmentManager.findFragmentById(binding.navigationHost.id)?.findNavController() ?: throw IllegalStateException("Activity $this does not have a NavHostFragment")

        navController.addOnDestinationChangedListener { controller, destination, arguments ->

            Log.d(TAG, "Navigated to ${destination.displayName}")

        }

        onBackPressedDispatcher.addCallback(this, object: OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
//                moveTaskToBack(true)
                finish()
            }
        })

    }

    override fun onSupportNavigateUp(): Boolean {
        return findNavController(R.id.navigation_host).navigateUp()
    }

    override fun onDestroy() {
        super.onDestroy()
        binding = null
    }

    companion object {
        private const val TAG = "NavigationActivity"
    }

}