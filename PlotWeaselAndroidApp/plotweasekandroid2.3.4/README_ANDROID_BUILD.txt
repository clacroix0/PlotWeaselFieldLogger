Plot Weasel Field Logger Android APK Wrapper
Version: v2.2.8
Release date: June 16, 2026

Purpose:
This project wraps the offline HTML field logger in a small Android WebView app. The APK gives Samsung tablets a black-footed ferret paw home-screen app icon and launches directly without asking which browser should open an HTML file.

Important:
- This project has no INTERNET permission.
- Location permission is included so the offline Field Logger can use the tablet GPS for plot-center UTM capture.
- The field logger files are bundled under app/src/main/assets/field_logger.
- Data remains local to Plot Weasel Field Logger's WebView storage until exported.
- The APK must be built on a machine with Android Studio or Android Gradle Plugin tooling.

Build with Android Studio:
1. Open this folder in Android Studio.
2. Let Android Studio sync Gradle.
3. Build > Generate Signed Bundle / APK.
4. Choose APK.
5. Sign using the BIA/IT-approved signing process.
6. Deploy through the approved local or MDM process.

GFE / managed tablet note:
If sideloading APKs is blocked, IT/MDM must deploy the APK. That is the normal managed-device path for a no-chooser home-screen app icon.

Why this exists:
Android treats loose .html files as documents, so it may ask which app should open them. An installed APK owns its launcher icon and opens the bundled offline app directly.





Patched package note:
This copy loads PlotWeasel_Field_Logger_SINGLE_FILE_v2.2.8_clean_dialog_icon.html.
That HTML avoids the Android JavaScript prompt header for New Project and uses the bundled weasel.png icon.
The native Android WebView settings in MainActivity still enable DOM storage for persistent local data.
