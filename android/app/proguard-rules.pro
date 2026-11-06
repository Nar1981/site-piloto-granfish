# Proguard rules for Gran Fish app
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.granfish.app.** { *; }
