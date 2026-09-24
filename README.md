# Plot Weasel Field Logger

Version: **v2.3.4**  
Release date: **September 21, 2026**  
Documentation updated: **September 24, 2026**

Plot Weasel Field Logger is an offline field data-entry application for site,
point-sample tree, Southwest woodland nested-plot, and regeneration records. It
stores working data locally on the device until the user exports it.

This repository and README maintain **Plot Weasel Field Logger only**. Plot
Weasel Desktop is a separate hosted Shiny R application developed and
maintained by Casey Sigg. Field Logger creates CSV files for downstream use in
Desktop, but Desktop hosting, calculations, interface behavior, releases,
documentation, and support are controlled by its maintainer.

## Application Preview

<p align="center">
  <a href="./plotweasel-main.png">
    <img
      src="./plotweasel-main.png.png"
      alt="Plot Weasel Field Logger v2.3.4 interface showing the Site Data screen, project controls, field session settings, plot controls, and record counts"
      width="1000"
    >
  </a>
</p>

<p align="center">
  <em>Plot Weasel Field Logger v2.3.4 main Site Data screen. Select the image to view it at full resolution.</em>
</p>

## v2.3.4 Release Highlights

- Adds a native Android export bridge for the Android Studio-built APK.
- Fixes the Android/Samsung export path that previously depended on unsupported
  browser Blob downloads and the desktop-only directory picker.
- Saves Project Setup JSON, Crew Package JSON, Backup JSON, and the Plot Weasel
  Desktop CSV under `Downloads/PlotWeasel` on Android.
- Saves `Site.csv`, `Tree.csv`, optional `Woodland.csv`, `Regen.csv`, and
  `Review.txt` together in a dated project-and-crew subfolder under
  `Downloads/PlotWeasel`.
- Preserves the Microsoft Edge folder-picker workflow for the offline Windows
  HTML version.
- Requires Android to return an explicit success or failure result before the
  HTML reports that a file was saved.
- Keeps the Android application ID, HTML storage keys, and stable asset URL
  unchanged so a properly signed v2.3.4 APK can update v2.3.3 without
  intentionally clearing locally stored projects.
- Carries forward the Southwest Variant / Woodland Nested Plot workflow added
  in v2.3.3.
- Keeps woodland records separate from point-sample tree records.
- Exports woodland records to a separate `Woodland.csv` file.
- Excludes every woodland record from the file whose name contains
  `PlotWeasel_upload`.
- Keeps the lowercase `status` field in `Tree.csv` while retaining the original
  `Live/Dead` field.
- Keeps `record_type`, `drc`, and `form_class` in the Plot Weasel Desktop upload
  schema. Current measured rows use `record_type=tree`; `drc` and
  `form_class` are blank because woodland rows are excluded.
- Preserves the updated woodland common names for species codes 106, 143, and
  477.
- Preserves woodland records in Crew Packages and Backup JSON exports.
- Includes the Southwest Variant setting in Project Setup JSON files.

## Official Android APK

| Item | Value |
|---|---|
| APK filename | `PlotWeaselFieldLogger_Ver2.3.4.apk` |
| SHA-256 | `REPLACE_WITH_FINAL_SIGNED_APK_SHA256` |
| Release type | Signed Android Studio-built APK for direct or internal Android installation |
| Google Play account required | No, not for direct/internal APK installation |

> **Release maintainer:** Replace the SHA-256 placeholder with the hash from the
> final signed v2.3.4 APK before publishing the release. Do not copy a hash from
> an earlier release.

## Official Source and Documentation

- `PlotWeasel_Field_Logger.html` is the official self-contained Field Logger
  source bundled into the Android application.
- `app/src/main/java/gov/bia/plotweasel/MainActivity.java` contains the Android
  WebView and native export bridge.
- `app/src/main/AndroidManifest.xml` contains the Android application and
  permission declarations.
- `app/build.gradle` contains the Android application ID, version code, and
  version name.
- `PlotWeasel_How_To_Guide.html` is the detailed user guide.
- The installed application must display **v2.3.4** and
  **Released September 21, 2026**.
- The Android wrapper must load the stable asset URL:

```text
file:///android_asset/field_logger/PlotWeasel_Field_Logger.html
```
