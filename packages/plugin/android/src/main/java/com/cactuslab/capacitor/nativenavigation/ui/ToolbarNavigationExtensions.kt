package com.cactuslab.capacitor.nativenavigation.ui

import android.app.Activity
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import androidx.annotation.ColorInt
import androidx.annotation.StringRes
import androidx.appcompat.graphics.drawable.DrawerArrowDrawable
import androidx.appcompat.widget.Toolbar
import androidx.drawerlayout.widget.DrawerLayout
import androidx.fragment.app.Fragment
import androidx.navigation.NavController
import androidx.navigation.NavDestination
import androidx.navigation.NavGraph
import androidx.navigation.fragment.DialogFragmentNavigator
import androidx.navigation.fragment.FragmentNavigator
import androidx.navigation.fragment.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.transition.TransitionManager
import com.cactuslab.capacitor.nativenavigation.R
import com.google.android.material.appbar.CollapsingToolbarLayout
import java.util.regex.Pattern

fun Fragment.setupToolbar(toolbar: Toolbar, drawerLayout: DrawerLayout? = null) {
    val navController = findNavController()
    val wrapper = ToolbarWrapper(toolbar)
    val appBarConfiguration = AppBarConfiguration(navController.graph, drawerLayout)
    val currentDestination: NavDestination? = navController.lastDestination(this::class.java)
    toolbar.setNavigationOnClickListener { navController.navigateUp(appBarConfiguration) }
    setupIcon(wrapper, currentDestination, appBarConfiguration, drawerLayout)
    setupTitle(wrapper, currentDestination, arguments)
}

fun Fragment.setupToolbar(
    collapsingToolbarLayout: CollapsingToolbarLayout,
    toolbar: Toolbar,
    drawerLayout: DrawerLayout? = null
) {
    val navController = findNavController()
    val wrapper = CollapsingToolbarLayoutWrapper(collapsingToolbarLayout, toolbar)
    val appBarConfiguration = AppBarConfiguration(navController.graph, drawerLayout)
    val currentDestination: NavDestination? = navController.lastDestination(this::class.java)
    toolbar.setNavigationOnClickListener { navController.navigateUp(appBarConfiguration) }
    setupIcon(wrapper, currentDestination, appBarConfiguration, drawerLayout)
    setupTitle(wrapper, currentDestination, arguments)
}

private fun NavController.lastDestination(clazz: Class<out Fragment>): NavDestination? {
    val isCurrent = currentDestination?.let { checkDestination(it, clazz) } ?: false
    return if (isCurrent) {
        currentDestination
    } else {
        val allDestinations = createFlatList(graph)
        allDestinations.find { checkDestination(it, clazz) }
    }
}

private fun createFlatList(graph: Iterable<NavDestination>): Iterable<NavDestination> {
    return mutableListOf<NavDestination>().also { navDestinations ->
        graph.forEach {
            if (it is NavGraph) {
                navDestinations += createFlatList(it)
            } else {
                navDestinations += it
            }
        }
    }
}

private fun checkDestination(destination: NavDestination, clazz: Class<out Fragment>): Boolean {
    return when (destination) {
        is FragmentNavigator.Destination -> destination.className
        is DialogFragmentNavigator.Destination -> destination.className
        else -> throw IllegalStateException()
    } == clazz.name
}

private interface Wrapper<out T : ViewGroup> {
    val toolbar: T
    fun setNavigationIcon(icon: Drawable?, @StringRes contentDescription: Int)
    fun setTitle(title: String?)
    fun setNavigationClickListener(clickListener: View.OnClickListener)
}

private open class ToolbarWrapper(override val toolbar: Toolbar) : Wrapper<Toolbar> {
    override fun setNavigationIcon(icon: Drawable?, contentDescription: Int) {
        val useTransition = icon == null && toolbar.navigationIcon != null
        toolbar.navigationIcon = icon
        toolbar.setNavigationContentDescription(contentDescription)
        if (useTransition) {
            TransitionManager.beginDelayedTransition(toolbar)
        }
    }

    override fun setTitle(title: String?) {
        toolbar.title = title
    }

    override fun setNavigationClickListener(clickListener: View.OnClickListener) {
        toolbar.setNavigationOnClickListener(clickListener)
    }
}

private class CollapsingToolbarLayoutWrapper(
    val collapsingToolbarLayout: CollapsingToolbarLayout,
    override val toolbar: Toolbar
) : ToolbarWrapper(toolbar) {
    override fun setTitle(title: String?) {
        collapsingToolbarLayout.title = title
    }
}

private fun <T : ViewGroup> setupIcon(
    wrapper: Wrapper<T>,
    navDestination: NavDestination?,
    appBarConfiguration: AppBarConfiguration,
    drawerLayout: DrawerLayout?
) {

    val isTopLevelDestination =
        matchDestinations(
            navDestination,
            appBarConfiguration.topLevelDestinations
        )

    if (drawerLayout == null && isTopLevelDestination) {
        wrapper.setNavigationIcon(null, 0)
    } else {
        val showAsDrawerIndicator = drawerLayout != null && isTopLevelDestination
        val mArrowDrawable = DrawerArrowDrawable(wrapper.toolbar.context)
        wrapper.setNavigationIcon(
            mArrowDrawable,
            if (showAsDrawerIndicator) R.string.nav_app_bar_open_drawer_description else R.string.nav_app_bar_navigate_up_description
        )
        mArrowDrawable.progress = if (showAsDrawerIndicator) 0f else 1f
    }
}

private fun <T : ViewGroup> setupTitle(
    toolbar: Wrapper<T>,
    navDestination: NavDestination?,
    arguments: Bundle?
) {
    toolbar.setTitle(navDestination?.let { getLabelDestination(it, arguments) })
}

fun getLabelDestination(
    destination: NavDestination,
    arguments: Bundle?
): String {
    val label = destination.label

    if (!label.isNullOrEmpty()) {
        // Fill in the data pattern with the args to build a valid URI
        val title = StringBuffer()
        val fillInPattern = Pattern.compile("\\{(.+?)\\}")
        val matcher = fillInPattern.matcher(label)
        while (matcher.find()) {
            val argName = matcher.group(1)
            if (arguments != null && arguments.containsKey(argName)) {
                matcher.appendReplacement(title, "")
                title.append(arguments[argName].toString())
            } else {
                throw IllegalArgumentException(
                    "Could not find " + argName + " in "
                            + arguments + " to fill label " + label
                )
            }
        }
        matcher.appendTail(title)
        return title.toString()
    }

    return label.toString()
}

private fun matchDestinations(destination: NavDestination?, destinationIds: Set<Int?>): Boolean {
    var currentDestination: NavDestination? = destination
    do {
        if (destinationIds.contains(currentDestination!!.id)) {
            return true
        }
        currentDestination = currentDestination.parent
    } while (currentDestination != null)

    return false
}

fun Fragment.changeStatusBarColor(@ColorInt color: Int) {
    requireActivity().changeStatusBarColor(color)
}

fun Activity.changeStatusBarColor(@ColorInt color: Int) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        window.statusBarColor = color
    }
}