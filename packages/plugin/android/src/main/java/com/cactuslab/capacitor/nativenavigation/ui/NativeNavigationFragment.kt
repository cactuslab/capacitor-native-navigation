package com.cactuslab.capacitor.nativenavigation.ui

import android.util.Log
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import androidx.fragment.app.Fragment

open class NativeNavigationFragment: Fragment() {
    var onEnterEnd: Runnable? = null
    var onExitEnd: Runnable? = null

    fun resolveEnter() {
        onEnterEnd?.let { runnable ->
//            Log.d(TAG, "Resolve Enter on Fragment")
            runnable.run()
            onEnterEnd = null
        }
    }

    fun resolveExit() {
        onExitEnd?.let { runnable ->
//            Log.d(TAG, "Resolve Exit on Fragment")
            runnable.run()
            onExitEnd = null
        }
    }

    override fun onCreateAnimation(transit: Int, enter: Boolean, nextAnim: Int): Animation? {
        if (nextAnim == 0)
        {
            if (enter) {
                resolveEnter()
            } else {
                resolveExit()
            }
            return null
        }

        val animator = AnimationUtils.loadAnimation(requireContext(), nextAnim)

        animator.setAnimationListener(object : Animation.AnimationListener {
            override fun onAnimationStart(animation: Animation?) {
                /* if an animation was interrupted there may still be a lingering completion */
                if (enter) {
                    resolveExit()
                } else {
                    resolveEnter()
                }
//                Log.d(TAG, "ANIMATOR START")
            }

            override fun onAnimationEnd(animation: Animation?) {
//                Log.d(TAG, "ANIMATOR END")
                if (enter) {
                    resolveEnter()
                } else {
                    resolveExit()
                }
            }

            override fun onAnimationRepeat(animation: Animation?) {
//                Log.d(TAG, "ANIMATOR REPEAT")
            }
        })

        return animator
    }

    override fun onDestroy() {
        super.onDestroy()
        /* Guarantee any clean-up */
        resolveEnter()
        resolveExit()
    }

    companion object {
        private const val TAG = "NativeNavigationFragment"
    }

}