# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.flipper.** { *; }
-keep class com.facebook.fresco.** { *; }
-keep class com.facebook.imagepipeline.** { *; }
-keep class com.facebook.common.** { *; }
-keep class com.facebook.drawee.** { *; }

# React Native Bridge
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * extends com.facebook.react.uimanager.SimpleViewManager { *; }
-keep class * extends com.facebook.react.uimanager.ViewGroupManager { *; }
-keepclassmembers class *  {
    @com.facebook.react.uimanager.annotations.ReactProp <fields>;
}
-keepclassmembers class *  {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <fields>;
}

# Keep React Native JavaScript interfaces
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# expo
-keep class expo.** { *; }
-keep class expo.modules.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep drawables, mipmaps, and other resources
-keep class **.R$* {
    public static final int *;
}

# Add any project specific keep options here:
