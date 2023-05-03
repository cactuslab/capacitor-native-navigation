package com.cactuslab.capacitor.nativenavigation.helpers

import android.content.Context
import android.content.res.AssetManager
import android.graphics.Typeface
import android.util.SparseArray
import androidx.core.content.res.ResourcesCompat
import androidx.core.graphics.TypefaceCompat


object FontManager {

    // NOTE: Indices in `EXTENSIONS` correspond to the `TypeFace` style constants.
    private val EXTENSIONS = arrayOf("", "_bold", "_italic", "_bold_italic")
    private val FILE_EXTENSIONS = arrayOf(".ttf", ".otf")
    private const val FONTS_ASSET_PATH = "fonts/"

    private val fontCache: MutableMap<String, FontFamily> = mutableMapOf()
    private val typefaceCache: MutableMap<String, Typeface> = mutableMapOf()

    fun getTypeface(context: Context, fontFamilyName: String, style: Int, assetManager: AssetManager) : Typeface =
        getTypeface(context, fontFamilyName, TypefaceStyle(style), assetManager)

    fun getTypeface(context: Context, fontFamilyName: String, weight: Int, italic: Boolean, assetManager: AssetManager) : Typeface =
        getTypeface(context, fontFamilyName, TypefaceStyle(weight, italic), assetManager)

    fun getTypeface(context: Context, fontFamilyName: String, style: Int, weight: Int, assetManager: AssetManager) : Typeface =
        getTypeface(context, fontFamilyName, TypefaceStyle(style, weight), assetManager)

    fun getTypeface(context: Context, fontFamilyName: String, typefaceStyle: TypefaceStyle, assetManager: AssetManager): Typeface {
        if (typefaceCache.containsKey(fontFamilyName)){
            return typefaceStyle.apply(context, typefaceCache[fontFamilyName])
        }

        val assetFontFamily = fontCache[fontFamilyName] ?: FontFamily().also { fontCache[fontFamilyName] = it }

        val style = typefaceStyle.nearestStyle

        return assetFontFamily.typefaceForStyle(style) ?: createAssetTypeface(context, fontFamilyName, style, assetManager).also { assetFontFamily.setTypefaceForStyle(style, it) }
    }

    /*
   * This method allows you to load custom fonts from res/font folder as provided font family name.
   * Fonts may be one of .ttf, .otf or XML (https://developer.android.com/guide/topics/ui/look-and-feel/fonts-in-xml).
   * To support multiple font styles or weights, you must provide a font in XML format.
   *
   * ReactFontManager.getInstance().addCustomFont(this, "Srisakdi", R.font.srisakdi);
   */
    fun addCustomFont(context: Context, fontFamily: String, fontId: Int) {
        ResourcesCompat.getFont(context, fontId)?.let { typefaceCache[fontFamily] = it }
    }

    /**
     * Equivalent method to {@see addCustomFont(Context, String, int)} which accepts a Typeface
     * object.
     */
    fun addCustomFont(fontFamily: String, font: Typeface) {
        typefaceCache[fontFamily] = font
    }

    /**
     * Add additional font family, or replace the exist one in the font memory cache.
     *
     * @param style
     * @see {@link Typeface.DEFAULT}
     *
     * @see {@link Typeface.BOLD}
     *
     * @see {@link Typeface.ITALIC}
     *
     * @see {@link Typeface.BOLD_ITALIC}
     */
    fun setTypeface(fontFamilyName: String, style: Int, typeface: Typeface) {
        val assetFontFamily = fontCache[fontFamilyName] ?: FontFamily().also { fontCache[fontFamilyName] = it }
        assetFontFamily.setTypefaceForStyle(style, typeface)
    }

    private fun createAssetTypeface(context: Context, fontFamilyName: String, style: Int, assetManager: AssetManager): Typeface {
        val extension = EXTENSIONS[style]
        for (fileExtension in FILE_EXTENSIONS) {
            val fileName = StringBuilder()
                .append(FONTS_ASSET_PATH)
                .append(fontFamilyName.lowercase().replace("-", "_"))
                .append(extension)
                .append(fileExtension)
                .toString()
            return try {
                Typeface.createFromAsset(assetManager, fileName)
            } catch (e: RuntimeException) {
                // If the typeface asset does not exist, try another extension.
                continue
            }
        }
        return Typeface.create(fontFamilyName, style)
    }

    class FontFamily {
        private val typefaceSparseArray: SparseArray<Typeface> = SparseArray(4)

        fun typefaceForStyle(style: Int) : Typeface? {
            return typefaceSparseArray.get(style)
        }

        fun setTypefaceForStyle(style: Int, typeface: Typeface) {
            typefaceSparseArray.put(style, typeface)
        }
    }

    class TypefaceStyle {
        private val mItalic: Boolean
        private val mWeight: Int

        constructor(weight: Int?, italic: Boolean) {
            mItalic = italic
            mWeight = weight ?: NORMAL
        }

        constructor(style: Int?) {
            val resolvedStyle = style ?: Typeface.NORMAL

            mItalic = resolvedStyle and Typeface.ITALIC != 0
            mWeight = if (resolvedStyle and Typeface.BOLD != 0) BOLD else NORMAL
        }

        /**
         * If `weight` is supplied, it will be combined with the italic bit from `style`. Otherwise, any
         * existing weight bit in `style` will be used.
         */
        constructor(style: Int?, weight: Int?) {
            val resolvedStyle = style ?: Typeface.NORMAL
            mItalic = resolvedStyle and Typeface.ITALIC != 0
            mWeight = weight ?: if (resolvedStyle and Typeface.BOLD != 0)  BOLD  else NORMAL
        }

        val nearestStyle: Int
            get() = if (mWeight < BOLD) {
                if (mItalic) Typeface.ITALIC else Typeface.NORMAL
            } else {
                if (mItalic) Typeface.BOLD_ITALIC else Typeface.BOLD
            }

        fun apply(context: Context, typeface: Typeface?): Typeface = TypefaceCompat.create(context, typeface, mWeight, mItalic)

        companion object {
            const val BOLD = 700
            const val NORMAL = 400
            private const val MIN_WEIGHT = 1
            private const val MAX_WEIGHT = 1000
        }
    }

}