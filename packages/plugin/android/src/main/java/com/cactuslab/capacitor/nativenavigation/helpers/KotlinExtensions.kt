package com.cactuslab.capacitor.nativenavigation.helpers

import android.content.Context
import android.graphics.Color
import android.os.Build
import android.util.TypedValue
import android.view.View
import android.view.ViewTreeObserver
import android.view.WindowInsets
import android.webkit.ValueCallback
import android.webkit.WebView
import androidx.annotation.ColorInt
import androidx.annotation.RequiresApi
import androidx.core.graphics.ColorUtils
import androidx.core.graphics.toColorInt
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets

fun Number.spToPx(context: Context) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_SP, this.toFloat(), context.resources.displayMetrics).toInt()

fun Number.dpToPx(context: Context) = TypedValue.applyDimension(
    TypedValue.COMPLEX_UNIT_DIP, this.toFloat(), context.resources.displayMetrics).toInt()

fun Number.pxToDp(context: Context) = this.toFloat() / context.resources.displayMetrics.density

fun Int.isColorDark(): Boolean {
    val withoutTransparency = ColorUtils.setAlphaComponent(this, 255)

    val whiteContrast = ColorUtils.calculateContrast(Color.WHITE, withoutTransparency)
    val blackContrast = ColorUtils.calculateContrast(Color.BLACK, withoutTransparency)

    return blackContrast < whiteContrast
}

@ColorInt
fun String.parseRGBAColor(): Int {
    val colorvalues = if (this.startsWith("#")) {
        this.substringAfter("#")
    } else {
        this
    }

    when (colorvalues.length) {
        3 -> {
            val r = colorvalues[0]
            val g = colorvalues[1]
            val b = colorvalues[2]
            return "#$r$r$g$g$b$b".toColorInt()
        }
        4 -> {
            val r = colorvalues[0]
            val g = colorvalues[1]
            val b = colorvalues[2]
            val a = colorvalues[3]
            return "#$a$a$r$r$g$g$b$b".toColorInt()
        }
        8 -> {
            val r = colorvalues.subSequence(0,2)
            val g = colorvalues.subSequence(2,4)
            val b = colorvalues.subSequence(4,6)
            val a = colorvalues.subSequence(6,8)
            return "#$a$r$g$b".toColorInt()
        }
        else -> return this.toColorInt()
    }
}

data class InitialPadding(val left: Int, val top: Int,
                          val right: Int, val bottom: Int)

private fun recordInitialPaddingForView(view: View) = InitialPadding(
    view.paddingLeft, view.paddingTop, view.paddingRight, view.paddingBottom)

fun View.doOnApplyWindowInsets(f: (View, WindowInsets, InitialPadding) -> Unit) {

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
        // Create a snapshot of the view's padding state
        val initialPadding = recordInitialPaddingForView(this)
        // Set an actual OnApplyWindowInsetsListener which proxies to the given
        // lambda, also passing in the original padding state

        setOnApplyWindowInsetsListener { v, insets ->
            f(v, insets, initialPadding)
            // Always return the insets, so that children can also use them
            insets
        }

        // request some insets
        requestApplyInsetsWhenAttached()
    }

}

/**
 * Call [View.requestApplyInsets] in a safe away. If we're attached it calls it straight-away.
 * If not it sets an [View.OnAttachStateChangeListener] and waits to be attached before calling
 * [View.requestApplyInsets].
 */
@RequiresApi(Build.VERSION_CODES.KITKAT_WATCH)
fun View.requestApplyInsetsWhenAttached() {
    if (isAttachedToWindow) {
        requestApplyInsets()
    } else {
        addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
            override fun onViewAttachedToWindow(v: View) {
                v.removeOnAttachStateChangeListener(this)
                v.requestApplyInsets()
            }

            override fun onViewDetachedFromWindow(v: View) = Unit
        })
    }
}

fun String.toBase64(): String {
    val inputStream: InputStream = ByteArrayInputStream(this.toByteArray(StandardCharsets.UTF_8))
    val buffer = ByteArray(inputStream.available())
    inputStream.read(buffer)
    inputStream.close()

    return android.util.Base64.encodeToString(buffer, android.util.Base64.NO_WRAP)
}

/**
 * Inject CSS into the DOM. If id is non-null this will remove a style if it exists
 *
 * @param cssString The CSS to inject
 * @param id An optional id. If set it allows replacing of a previously injected style tag
 * @param resultCallback An optional callback to observe the result
 */
fun WebView.injectCSS(cssString: String, id: String? = null, resultCallback: ValueCallback<String?>? = null) {

    var styleCss =
        """
            javascript:(function() {
                var parent = document.getElementsByTagName('head').item(0);
                var style = document.createElement('style');
                style.type = 'text/css';
        """.trimIndent()

    id?.let {
        val identifier = "native-navigation-$it"
        styleCss += """
            var oldElem = document.getElementById("$identifier");
            if (oldElem) {
                oldElem.remove();
            }
            style.id = "$identifier";
        """.trimIndent()
    }

    styleCss +=  """        
            style.innerHTML = window.atob('${cssString.toBase64()}');
            parent.appendChild(style)
        })()
        """.trimIndent()

    this.evaluateJavascript(styleCss, resultCallback)
}

fun View.onMeasuredSize(onResult: (width: Int, height: Int) -> Unit) {
    viewTreeObserver.addOnPreDrawListener(object: ViewTreeObserver.OnPreDrawListener {
        override fun onPreDraw(): Boolean {
            onResult(this@onMeasuredSize.width, this@onMeasuredSize.height)
            this@onMeasuredSize.viewTreeObserver.removeOnPreDrawListener(this)
            return true
        }
    })
}