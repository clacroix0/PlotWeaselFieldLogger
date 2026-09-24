Plot Weasel Field Logger - Android README

Version: v2.3.4
Field Logger release date: September 21, 2026
Android README updated: September 22, 2026

Official Android release:
- Recommended APK filename: PlotWeaselFieldLogger_Ver2.3.4.apk
- SHA-256: REPLACE_WITH_FINAL_SIGNED_APK_SHA256
- Android versionName: 2.3.4
- Android versionCode: 230
- Release type: Signed Android Studio-built APK for direct or internal Android installation.
- Bundled Field Logger source: PlotWeasel_Field_Logger.html
- Android wrapper source: app/src/main/java/gov/bia/plotweasel/MainActivity.java
- Android export root: Downloads/PlotWeasel

Important:
The APK filename, Android version code, and SHA-256 value must describe the final signed release APK that is actually distributed. Do not use the hash from an older APK, a debug APK, an unsigned APK, or an intermediate build.

Confirm that the final app/build.gradle file uses versionCode 230 before retaining that value in this README. If a different higher versionCode is required for the final build, update this README to match it.

Purpose:
Plot Weasel Field Logger is an offline field data-entry application for Android field tablets, Samsung tablets, Microsoft Surface devices, and secured Windows computers. It collects site, point-sample tree, Southwest woodland nested-plot, and regeneration records.

The Android Studio-built APK stores working records locally in the application WebView until the user exports or clears them.

The application exports files for:
- Project setup.
- Crew-to-crew and tablet-to-office transfer.
- Project backups.
- Office merging.
- Reference and master records.
- Regeneration records.
- Plot Weasel Desktop point-sample tree calculations.

Plot Weasel Desktop calculations use the file whose name contains PlotWeasel_upload. Woodland records are kept separate and are not included in that Desktop upload.

Plot Weasel Desktop v2.3.3 is a separate hosted Shiny R application developed and maintained by Casey Sigg. This Android README documents the Field Logger APK and the Field Logger export contract only.

Authors and Credits:
- Created by Casey Sigg, Steve Singleton, and Chris LaCroix with the USDI BIA Division of Forestry, Branch of Inventory and Planning.
- Casey Sigg created the Plot Weasel Desktop R script, which is the calculation engine and scientific foundation for Plot Weasel Desktop.
- Steve Singleton created the field and master workbook templates that guided the Plot Weasel Field Logger structure and exports.
- Chris LaCroix did the vibe coding that turned the script, templates, and workflow into the Plot Weasel Desktop and Plot Weasel Field Logger.

Major v2.3.4 changes:
- Adds a native Android file-export bridge to the Android Studio-built APK.
- Fixes the Samsung and Android export failure caused by unsupported browser Blob downloads and the desktop-only directory picker.
- Adds AndroidFileBridge.saveTextFile for individual CSV, JSON, and text exports.
- Adds AndroidFileBridge.saveTextFiles for the grouped Site, Tree, Woodland, Regen, and Review export.
- Saves individual Android exports under Downloads/PlotWeasel.
- Saves the grouped CSV and Review export in a dated project-and-crew subfolder under Downloads/PlotWeasel.
- Keeps the Microsoft Edge folder-picker workflow for the offline Windows HTML version.
- Requires Android to return an explicit success or failure result before the Field Logger HTML reports that a file was saved.
- Prevents the Project Setup export from displaying a false success after an Android save failure.
- Adds an in-app note telling Android users to look under Downloads/PlotWeasel.
- Keeps the stable HTML asset filename PlotWeasel_Field_Logger.html.
- Keeps the existing application ID so a correctly signed v2.3.4 APK can update the v2.3.3 application.
- Keeps the existing Field Logger local-storage keys so the update does not intentionally separate existing projects from the updated application.

Carried forward from v2.3.3:
- Multiple locally saved projects.
- Site, point-sample tree, woodland nested-plot, and regeneration records.
- Southwest Variant setting.
- Woodland Nested Plot tab with the subtitle "fixed radius only."
- Separate hardcoded Southwest woodland species list.
- Separate Woodland.csv export.
- Woodland records excluded from PlotWeasel_upload.csv.
- Tree.csv includes both Live/Dead and lowercase status fields.
- Tree.csv includes Damage Agent 1 and Damage Agent 2.
- PlotWeasel_upload.csv includes Damage Agent 1 and Damage Agent 2.
- Project Setup carries the Southwest Variant setting.
- Crew Packages and backups preserve woodland records.
- Review items include woodland records.
- Plot, tree, woodland, regeneration, and review record counts.
- Plot-center GPS capture for 30 seconds when location services are available.

Official source:
- PlotWeasel_Field_Logger.html is the official single-file Field Logger source.
- The Android application must bundle this exact HTML file.
- The HTML source belongs in app/src/main/assets/field_logger.
- The bundled filename must remain PlotWeasel_Field_Logger.html.
- The installed application must display v2.3.4.
- The installed application must display Released September 21, 2026.
- The Android wrapper must open file:///android_asset/field_logger/PlotWeasel_Field_Logger.html.
- Remove obsolete versioned HTML files from the Android assets folder so the wrapper cannot accidentally open an older release.
- Do not edit generated copies under app/build or app/build/intermediates.
- MainActivity.java must register an Android JavaScript interface named AndroidFileBridge.
- MainActivity.java must expose saveTextFile and saveTextFiles as JavascriptInterface methods.
- The Java bridge name and method names must exactly match the JavaScript in PlotWeasel_Field_Logger.html.
- app/build.gradle must use versionName "2.3.4".
- app/build.gradle must use a versionCode greater than the prior installed release.
- app/build.gradle must retain the applicationId used by the installed release.
- app/src/main/res/values/strings.xml should identify the application as Plot Weasel Field Logger v2.3.4.

Required stable Android identity:
- Java package: gov.bia.plotweasel
- Android application ID: gov.bia.plotweasel.fieldlogger
- Stable HTML asset URL: file:///android_asset/field_logger/PlotWeasel_Field_Logger.html
- Android bridge name: AndroidFileBridge
- Individual export method: saveTextFile
- Grouped export method: saveTextFiles

Do not change the application ID for a normal update. Android treats an APK with a different application ID as a different application.

Recommended Android installation:
1. Obtain PlotWeaselFieldLogger_Ver2.3.4.apk from the approved release location.
2. When the final release SHA-256 value is available, compare the APK hash with the published value.
3. Copy PlotWeaselFieldLogger_Ver2.3.4.apk to the Android tablet.
4. Open Files, My Files, or the approved file manager.
5. Tap PlotWeaselFieldLogger_Ver2.3.4.apk.
6. If Android requests permission, allow installation from the approved file source.
7. If v2.3.3 is already installed, install v2.3.4 over the existing application as an update.
8. Do not uninstall v2.3.3 before installing the update.
9. Install the application.
10. Open Plot Weasel Field Logger from its application icon.
11. Allow Location permission while using the application.
12. Enable Precise location when Android offers that choice.
13. Confirm the application header shows v2.3.4.
14. Confirm the header shows Released September 21, 2026.
15. Confirm the storage status shows Local only.
16. Confirm existing projects are still present when this is an update.
17. Create or open a test project.
18. Close the application completely.
19. Reopen it and confirm the project and records remain available.
20. Test Export Project Setup.
21. Test Crew Package.
22. Test Backup JSON.
23. Test Plot Weasel Desktop CSV.
24. Test Save Site, Tree, Woodland, Regen CSVs.
25. Open My Files, then Downloads, then PlotWeasel.
26. Confirm the actual exported files exist.
27. Open at least one exported JSON file and one exported CSV file.
28. Do not return the tablet to operational use until local storage and every export test pass.

Play Protect and direct-install warning:
Android may warn that a directly installed APK is unknown, unrecognized, or was not installed from Google Play.

Only proceed when:
- The APK came from the approved Plot Weasel release source.
- The filename matches the approved release.
- The final SHA-256 value matches the published value when one is available.
- The APK is the signed release build rather than a debug or unsigned build.

The installation-source warning is separate from Field Logger exporting. Approving the APK for installation does not create the Android export bridge. Exporting works only when the current HTML and MainActivity.java bridge are both included in the built APK.

Do not begin operational field collection when:
- The application displays an unexpected version.
- The application displays an unexpected release date.
- The application displays Memory only.
- Buttons or dropdowns do not respond.
- A test project disappears after closing and reopening the application.
- Project Setup, Crew Package, Backup JSON, or CSV exports cannot be saved.
- Exported files cannot be found under Downloads/PlotWeasel.
- The grouped export displays the old Folder save cancelled message.
- The application opens an older Field Logger file.
- The Southwest Variant was requested but the Woodland tab cannot be activated.
- The application displays an export success message but the file does not exist.
- An existing project disappears after updating the APK.

Storage modes:
- Local only: Expected mode for operational field collection. Records are stored locally until exported, deleted, or cleared.
- Memory only: Temporary and unsafe for operational field collection. Records may disappear when the application closes, reloads, crashes, or Android clears it.
- Do not collect operational data in Memory only mode.
- Local application data is separate from the APK installer file.
- Deleting the APK from Downloads does not uninstall the installed application.
- Uninstalling the application can remove locally stored projects.
- Clearing application storage through Android Settings can remove all locally stored projects.
- Installing a correctly signed update over the existing application should not intentionally clear the existing application storage.
- Always export and verify backups before an update.

Android export locations:
The v2.3.4 Android Studio APK uses the native AndroidFileBridge.

Individual exports are saved directly under:
My Files
  Downloads
    PlotWeasel

Individual exports include:
- Project Setup JSON.
- Crew Package JSON.
- Backup JSON.
- Plot Weasel Desktop CSV.

The grouped export is saved in a dated project-and-crew subfolder under:
My Files
  Downloads
    PlotWeasel
      Project_Crew_site-tree-regen-csvs_YYYYMMDD

When Southwest Variant is active or woodland records exist, the grouped folder name includes woodland:
My Files
  Downloads
    PlotWeasel
      Project_Crew_site-tree-woodland-regen-csvs_YYYYMMDD

The grouped folder contains:
- Site.csv.
- Tree.csv.
- Woodland.csv when Southwest Variant is active or woodland records exist.
- Regen.csv.
- Review.txt.

Android users do not select a parent folder with the desktop-browser directory picker. MainActivity.java writes the files through the native Android bridge.

The Windows offline HTML version still uses the browser folder picker. In Microsoft Edge, the user selects a parent folder and Field Logger creates the dated export subfolder inside it.

Required first-use test:
1. Confirm v2.3.4 appears in the header.
2. Confirm Released September 21, 2026 appears in the header.
3. Confirm Local only appears in the header.
4. Create a project named Test Project.
5. Add a plot.
6. Add one point-sample tree record.
7. Activate Southwest Variant / Woodland Nested Plot.
8. Add one woodland record.
9. Add one regeneration record.
10. Close the application.
11. Reopen the application.
12. Confirm the project and all record types remain available.
13. Export Project Setup JSON.
14. Export a Backup JSON.
15. Export a Crew Package JSON.
16. Export a Plot Weasel Desktop CSV.
17. Use Save Site, Tree, Woodland, Regen CSVs.
18. Open My Files.
19. Open Downloads.
20. Open PlotWeasel.
21. Confirm the Project Setup JSON exists directly under PlotWeasel.
22. Confirm the Backup JSON exists directly under PlotWeasel.
23. Confirm the Crew Package JSON exists directly under PlotWeasel.
24. Confirm the Plot Weasel Desktop CSV exists directly under PlotWeasel.
25. Open the dated grouped-export subfolder.
26. Confirm Site.csv exists.
27. Confirm Tree.csv exists.
28. Confirm Woodland.csv exists.
29. Confirm Regen.csv exists.
30. Confirm Review.txt exists.
31. Confirm the Plot Weasel Desktop CSV does not contain the woodland record.
32. Confirm Tree.csv contains a lowercase status column.
33. Confirm Tree.csv retains the Live/Dead column.
34. Confirm Woodland.csv contains the woodland record.
35. Open at least one JSON export and one CSV export.
36. Confirm no export displays Folder save cancelled.
37. Confirm no button appears to do nothing.
38. Confirm successful exports report the Downloads/PlotWeasel location.
39. Delete the test project only after every test passes.
40. Separately test the offline HTML grouped export in Microsoft Edge on Windows when the Windows release will also be distributed.

Supported non-APK launch path:
1. Copy PlotWeasel_Field_Logger.html to a Windows or Microsoft Surface device.
2. Open the HTML file directly in Microsoft Edge.
3. Confirm the header shows v2.3.4.
4. Confirm the header shows Local only.
5. Do not open the file through a restricted Teams, SharePoint, email, or cloud preview.
6. Download the file to the device before opening it.
7. Test individual browser downloads.
8. Test Save Site, Tree, Woodland, Regen CSVs.
9. Choose an approved parent folder when Edge displays the folder picker.
10. Confirm Field Logger creates the expected dated export folder.
11. The single HTML file is the official non-APK source.

Browser and device notes:
- The signed Android Studio-built APK is the recommended route for Android field tablets.
- A loose HTML file may be treated as a document or restricted preview on Android.
- Microsoft Edge is the supported browser for the local HTML version on Windows and Microsoft Surface devices.
- Google Chrome may work, but Microsoft Edge is the tested Windows route.
- Safari on iPhone and iPad may treat a local HTML file as a preview instead of a complete application.
- Do not rely on an iPhone or iPad until project creation, controls, storage, GPS, Southwest Variant, woodland entry, and all exports have been tested.
- Direct or internal APK installation does not require Google Play Store publication.
- A simple MIT App Inventor WebViewer wrapper is not the supported v2.3.4 Android build.
- An unsupported wrapper may show Memory only or may not expose AndroidFileBridge.
- Use the Android Studio-built APK for operational Android field collection.

No-internet and no-cloud workflow:
1. Create or open the project on an office computer or designated setup tablet.
2. Enter the Project name.
3. Build the point-sample Tree and Regen project species pick list.
4. Save the project species list when it should be reusable.
5. Review or edit the project damage-agent list.
6. Activate Southwest Variant / Woodland Nested Plot when the project requires woodland measurements.
7. Open Export / Merge.
8. Export Project Setup.
9. On Android, verify the Project Setup JSON under Downloads/PlotWeasel.
10. Copy the Project Setup JSON to every crew tablet through an approved local transfer method.
11. Install the current APK on each tablet when it is not already installed.
12. Open Field Logger on each tablet.
13. Confirm v2.3.4 and Local only.
14. Import Project Setup before entering records.
15. Enter the tablet-specific Crew Name and Crew ID.
16. Each crew collects records locally.
17. At the end of each field day or examination, export a Crew Package JSON.
18. Also export a Backup JSON for the active project.
19. Verify both files under Downloads/PlotWeasel.
20. When multiple projects exist, open each project and export a separate Backup JSON.
21. Copy the exported files to approved removable media or a secured office computer.
22. At the office, open Field Logger on a secured Windows computer or designated merge device.
23. Import the Crew Package files.
24. Review the merged records.
25. Save Site.csv, Tree.csv, Woodland.csv when applicable, Regen.csv, and Review.txt.
26. Export the Plot Weasel Desktop CSV.
27. Upload only the file containing PlotWeasel_upload in its filename into Plot Weasel Desktop.
28. Follow the current Plot Weasel Desktop maintainer instructions for the hosted Shiny application.

Project Setup:
- Project Setup is a settings-only JSON file.
- It includes Project name.
- It includes the current point-sample Tree and Regen species pick list.
- It includes the saved species list.
- It includes the project damage-agent list.
- It includes the Southwest Variant enabled or disabled setting.
- It does not include plots.
- It does not include site records.
- It does not include point-sample tree records.
- It does not include woodland records.
- It does not include regeneration records.
- It does not include Crew Name.
- It does not include Crew ID.
- Importing Project Setup does not delete existing field records.
- Importing Project Setup leaves Crew Name and Crew ID unchanged.
- On Android v2.3.4, Project Setup exports are saved under Downloads/PlotWeasel.

Crew Package:
- A Crew Package is a JSON export of the active project.
- It includes project settings.
- It includes plots and site information.
- It includes point-sample tree records.
- It includes woodland records.
- It includes regeneration records.
- It includes the Southwest Variant setting.
- It includes Project Name, Crew Name, and Crew ID.
- It is used to transfer and merge field data at the office.
- It can also move work to a replacement tablet.
- Keep Crew Package files until office merging and validation are complete.
- On Android v2.3.4, Crew Packages are saved under Downloads/PlotWeasel.

Backup JSON:
- Backup JSON contains the active project.
- It includes the active project's settings, plots, point-sample trees, woodland records, and regeneration records.
- It is not a combined backup of every project stored on the tablet.
- When multiple projects are stored on one tablet, switch to each project and export a separate Backup JSON.
- Export a Backup JSON at the end of each field day.
- Export a Backup JSON before updating the APK.
- Export a Backup JSON before uninstalling.
- Export a Backup JSON before clearing application storage.
- Export a Backup JSON before deleting a project.
- Confirm that the backup file exists and opens before changing or removing the application.
- On Android v2.3.4, Backup JSON files are saved under Downloads/PlotWeasel.

Projects on one device:
- Field Logger supports multiple saved projects in the same application storage.
- Use the Projects panel to switch between projects.
- The project dropdown displays project name and record counts.
- New Project creates a blank project without deleting existing projects.
- New Project retains Crew Name and Crew ID for convenience.
- New Project begins with blank plots, point-sample trees, woodland records, regeneration records, and project species.
- Delete Project removes only the active project.
- Clear Device Data removes all projects stored by that application.
- Back up every project separately before using Clear Device Data.

Southwest Variant:
- Activate Southwest Variant / Woodland Nested Plot from the Field Session panel.
- Activating the setting displays the Woodland tab.
- Deactivating the setting hides the Woodland tab.
- Hiding the tab does not delete existing woodland records.
- Project Setup transfers the Southwest Variant setting to other tablets.
- A project containing woodland records is normalized as a Southwest Variant project.
- Woodland records are separate from point-sample Tree records.

Woodland Nested Plot:
- The Woodland tab is labeled Woodland Nested Plot.
- The subtitle says fixed radius only.
- Woodland measurements are for the fixed-radius woodland nested plot.
- Woodland records must not be entered as point-sample Tree records.
- Point-sample Tree records must not be entered as Woodland records.
- Woodland records are stored separately from trees tallied in the point sample.
- Woodland records export to Woodland.csv.
- Woodland records do not export to PlotWeasel_upload.csv.

Southwest woodland species:
- 106 - common or two-needle pinyon
- 65 - Utah juniper
- 814 - Gambel oak
- 63 - alligator juniper
- 66 - Rocky Mountain juniper
- 69 - oneseed juniper
- 803 - Arizona white oak
- 810 - Emory oak
- 843 - silverleaf oak
- 133 - singleleaf pinyon
- 134 - border pinyon
- 143 - Arizona pinyon pine
- 477 - curlleaf mountain-mahogany
- 990 - miscellaneous hardwoods

Tab-specific species-code note:
- The Trees and Woodland tabs intentionally maintain separate species mappings.
- The separate mappings support different measurements and volume equations.
- Use the species name and code displayed by the tab where the record is entered.
- Do not substitute a Trees-tab code into a Woodland record.
- Do not substitute a Woodland-tab code into a point-sample Tree record.
- Do not enter the same sampled tree on both tabs.
- Trees uses code 475 for curlleaf mountain-mahogany.
- Woodland uses code 477 for curlleaf mountain-mahogany.
- Trees uses code 990 for desert ironwood.
- Woodland uses code 990 for miscellaneous hardwoods.
- Keep the legacy Woodland conversion from code 476 to code 477.

Woodland entry rules:
- Species must come from the hardcoded Southwest woodland species list.
- Live/Dead is required.
- DRC means Diameter at Root Collar.
- Use ERDC when a tree is forked at ground line.
- DRC is required for live woodland trees.
- DRC must be a number greater than zero when entered.
- DRC uses the same one-decimal shorthand behavior as point-sample DBH.
- Form Class is required for live and dead woodland records.
- Form Class 1 means single stem.
- Form Class 2 means multiple stems or tree forked at ground line.
- Height is required for live woodland trees.
- Height must be a number greater than zero when entered.
- Woodland records do not use Actual Height.
- Woodland records do not use Cull.
- Crown Ratio must be between 0 and 100 when entered.
- Age must be between 0 and 1000 when entered.
- Crown Ratio and Age are disabled for dead woodland trees.
- Dead woodland trees require Decay Class 1 through 5.
- Decay Class cannot be used for live woodland trees.
- Damage Agent 2 must be different from Damage Agent 1.
- None exports as a blank damage-agent value.

Point-sample tree entry rules:
- Species is required.
- Live/Dead is required.
- Live trees require DBH.
- Live-tree DBH must be 5.0 inches or greater.
- Dead-tree DBH is optional.
- Any entered DBH must be numeric and at least 5.0 inches.
- Live trees require Height.
- Live-tree Height must be at least 8 feet.
- Dead-tree Height is optional only when Actual Height is blank and Broken Top is not selected.
- Any entered Height must be numeric and at least 8 feet.
- Dead trees require Decay Class 1 through 5.
- Cull, Crown Ratio, and Age are disabled for dead trees.
- Cull must be between 0 and 100 when entered.
- Crown Ratio must be between 0 and 100 when entered.
- Age must be between 0 and 1000 when entered.
- Damage Agent 2 must be different from Damage Agent 1.
- None exports as a blank damage-agent value.
- Species, DBH, and Height are required for a measured point-sample tree row to be included in PlotWeasel_upload.csv.
- A saved dead-tree record with blank DBH or Height can remain in Tree.csv but is not exported as a qualifying measured row in PlotWeasel_upload.csv.

Broken Top and Actual Height:
- For a normal live tree, leave Actual Height blank.
- For a normal live tree, the export writes Height into actualht.
- When Broken Top is selected as either damage agent, both Height and Actual Height are required.
- Actual Height means the actual measured height to the broken top.
- Height means the estimated total height the tree would have without the broken top.
- Actual Height must be less than Height.
- Actual Height must be greater than zero.
- Dead-tree Actual Height is optional when Broken Top is not selected.
- When Actual Height is entered for a dead tree, Height is also required.
- When Actual Height is entered for a dead tree, Actual Height must be less than Height.

DBH and DRC shorthand:
- DBH and woodland DRC are saved with one decimal place.
- Typing 10 becomes 10.0.
- Typing 10.3 remains 10.3.
- Typing 105 becomes 10.5.
- Typing 103 becomes 10.3.
- Typing 50 becomes 5.0.
- Typing 55 becomes 5.5.
- Typing 500 becomes 50.0.
- To enter fifty inches, type 50.0 or 500.
- An explicitly entered decimal point takes priority over shorthand conversion.

Decay classes:
- Class 1: Recently dead; bark and fine branches intact; wood hard.
- Class 2: Some bark loss; fine branches gone; wood firm.
- Class 3: Bark mostly gone; top often broken; wood starting to soften.
- Class 4: No bark; wood soft; form degrading.
- Class 5: Very soft, crumbling; snag collapsing or stump-like.
- DECAYCD is blank for live records.
- Dead point-sample trees and dead woodland trees require a decay class.

Regeneration entry rules:
- Species is required.
- Stem Count is required.
- Stem Count must be greater than zero.
- Diameter Class includes 0-inch, 2-inch, and 4-inch classes.
- Regeneration in the 2-inch or 4-inch diameter class must use the >5 ft Height Class.
- Damage Agent None exports as blank.

Species lists:
- The application includes an FIA master species list for point-sample Tree and Regen records.
- Each project starts with an empty project species pick list.
- The project species pick list supplies the Tree and Regen dropdowns.
- Use the Species tab to search by common name or FIA code.
- Add only the point-sample Tree and Regen species needed for the project.
- Removing a species from the project list does not delete previously saved records.
- Clear Species List empties the current dropdown without deleting saved records.
- Save Species List stores one reusable species list within the active project.
- Saving again replaces the previously saved list.
- Restore Saved List restores the saved list.
- Project Setup transfers the project species list and saved species list.
- The Woodland tab does not use the general project species list.
- The Woodland tab uses its own hardcoded Southwest woodland species list.

GPS capture:
- GPS capture runs for 30 seconds at plot center.
- The application averages valid location fixes.
- Latitude and longitude are converted to whole-meter UTM Easting and Northing.
- UTM Zone is saved with the coordinates.
- GPS Accuracy is stored in meters when provided.
- GPS Fix Count records the number of fixes collected.
- When altitude is available, Elevation is populated in whole feet.
- Android Location permission must be allowed.
- Precise location should be enabled.
- Device Location Services must be turned on.
- GPS does not upload coordinates.
- UTM and Elevation may be entered manually.

Exports:
- Project Setup JSON transfers project settings without field records or crew identity.
- Crew Package JSON transfers and merges the active project's settings and field records.
- Backup JSON backs up the active project.
- Plot Weasel Desktop CSV creates the point-sample tree upload.
- Save Site, Tree, Woodland, Regen CSVs creates office CSV files and Review.txt.
- Android v2.3.4 routes individual exports through AndroidFileBridge.saveTextFile.
- Android v2.3.4 routes the grouped export through AndroidFileBridge.saveTextFiles.
- Individual Android exports are saved directly under Downloads/PlotWeasel.
- The grouped Android export is saved in a dated project-and-crew subfolder under Downloads/PlotWeasel.
- The Android APK does not use window.showDirectoryPicker for its native export route.
- The Windows offline HTML version continues to use the browser folder picker.
- A successful Android save must return a JSON result with ok set to true.
- An Android failure must return a JSON result with ok set to false and a readable message.
- A blank or unreadable Android result is treated as a failure by the v2.3.4 HTML.

PlotWeasel_upload.csv:
- The generated filename contains PlotWeasel_upload.
- This is the only Field Logger CSV intended for Plot Weasel Desktop point-sample tree calculations.
- It contains eligible point-sample Tree records.
- It does not contain Woodland records.
- Woodland DRC and Form Class fields remain blank in point-sample tree rows.
- record_type is tree for exported point-sample records.
- status contains lowercase live or dead.
- Damage Agent 1 exports in damage_agent.
- Damage Agent 2 exports in damage_agent_2.
- None exports as blank.
- A normal tree with blank Actual Height exports Height in actualht.
- A Broken Top tree exports the actual height to the broken top in actualht.
- A Broken Top tree exports estimated total Height in ht.
- A plot without an eligible point-sample Tree record receives one blank tree row.
- The blank row keeps the plot represented in the Desktop denominator.
- A woodland record does not prevent creation of a blank point-sample tree row when that plot has no eligible point-sample Tree records.
- Point-sample records missing required Desktop measurements remain in Tree.csv but are not exported as measured rows in PlotWeasel_upload.csv.
- On Android v2.3.4, this file is saved under Downloads/PlotWeasel.

PlotWeasel_upload.csv header:
plot,record_type,spp,dbh,drc,form_class,ht,actualht,cull,DECAYCD,crown_ratio,status,damage_agent,damage_agent_2,species_name,crew_id,source_record_id,project_name,crew_name

Site.csv:
- Site.csv contains one row for each saved plot.
- It includes project, elevation, slope, aspect, slope position, soil and habitat information, Site Index, UTM coordinates, GPS information, date, crew information, access notes, logging notes, forest-soil notes, record ID, and update time.
- Site.csv is reference and master-record data.
- Plot Weasel Desktop does not calculate point-sample trees from Site.csv.
- Site.csv is written inside the grouped export folder.

Tree.csv:
- Tree.csv contains point-sample Tree records.
- It does not contain Woodland records.
- It includes record_type with the value tree.
- It includes Live/Dead.
- It includes status with lowercase live or dead.
- It includes Damage Agents and Damage Agent 2.
- It includes DECAYCD.
- It includes actualht.
- It includes a plot-only null row when a plot has no saved point-sample Tree records.
- Null rows have blank Live/Dead and status values.
- Tree.csv is written inside the grouped export folder.

Tree.csv header:
plot,Project,record_type,spp,spp_code,dbh,ht,actualht,cull,Crown Ratio (%),Age (years),Damage Agents,Damage Agent 2,DECAYCD,Live/Dead,status,notes,Crew Name,record_id,crew_id,updated_at

Woodland.csv:
- Woodland.csv contains fixed-radius woodland nested-plot records.
- It is created when Southwest Variant is enabled or woodland records exist.
- It includes record_type with the value woodland.
- It includes woodland species name and code.
- It includes DRC.
- It includes Form Class.
- It includes Height.
- It includes Crown Ratio and Age when applicable.
- It includes both damage-agent fields.
- It includes DECAYCD.
- It includes Live/Dead.
- It remains separate from Tree.csv.
- It remains separate from PlotWeasel_upload.csv.
- When Southwest Variant is enabled, a plot with no woodland records receives a plot-only woodland null row.
- Woodland.csv is written inside the grouped export folder.

Woodland.csv header:
plot,Project,record_type,spp,spp_code,drc,form_class,ht,Crown Ratio (%),Age (years),Damage Agents,Damage Agent 2,DECAYCD,Live/Dead,notes,Crew Name,record_id,crew_id,updated_at

Regen.csv:
- Regen.csv contains regeneration records.
- It includes species, FIA species code, stem count, diameter class, height class, damage agent, notes, crew information, record ID, and update time.
- It includes a plot-only null row when a plot has no saved regeneration records.
- The regeneration null row retains the real sampled plot number.
- The regeneration measurement fields are blank on the null row.
- Regen.csv is written inside the grouped export folder.

Review.txt:
- Review.txt contains the current ERROR and WARNING messages.
- Review items can identify plots, point-sample trees, woodland records, and regeneration records.
- Resolve ERROR items before final use of the exports.
- Review WARNING items and determine whether missing information is acceptable.
- Review.txt is written inside the grouped export folder.

Null plots:
- Add the plot even when no point-sample trees, woodland trees, or regeneration are present.
- Enter whatever site information is available.
- Leave the applicable record forms empty.
- Do not create fake measured records.
- Site.csv includes the plot.
- Tree.csv includes a point-sample tree null row when the plot has no point-sample Tree records.
- Woodland.csv includes a woodland null row when Southwest Variant is enabled and the plot has no woodland records.
- Regen.csv includes a regeneration null row when the plot has no regeneration records.
- PlotWeasel_upload.csv includes a blank tree row when the plot has no eligible point-sample Tree records.
- Null rows are generated during export and are not stored as regular field records.

Plot Weasel Desktop compatibility:
- The documented downstream reference remains Plot Weasel Desktop v2.3.3.
- Plot Weasel Desktop is a separate hosted Shiny R application.
- Plot Weasel Desktop is developed and maintained by Casey Sigg.
- Desktop support contact: casey.sigg@bia.gov.
- Upload only the file whose name contains PlotWeasel_upload for point-sample tree calculations unless the current Desktop instructions say otherwise.
- Do not upload Woodland.csv as the point-sample tree calculation file.
- Confirm end-to-end compatibility before claiming full compatibility.
- Numbered regeneration null rows require Desktop maintainer review and testing because Field Logger preserves the real sampled plot number.

Security:
- The application does not require internet, cloud storage, Python, R, or administrator rights during normal field use.
- GPS uses device location services and does not upload coordinates.
- Data remains in local application storage until exported or cleared.
- Local storage is not encrypted by Plot Weasel Field Logger.
- Project Setup, Crew Package, Backup JSON, CSV, and TXT exports are not encrypted by Field Logger.
- Android exports under Downloads/PlotWeasel can be accessed through the tablet file manager.
- Keep tablets and exported files secured.
- Use approved transfer and storage methods.
- Do not place sensitive files in personal or unapproved cloud-storage locations.
- Clear device data only after exports have been transferred, opened, verified, and retained according to policy.
- Do not request or use MANAGE_EXTERNAL_STORAGE for this release.
- Modern Android exports should use MediaStore Downloads.
- Android 8 and Android 9 may use the limited legacy WRITE_EXTERNAL_STORAGE permission declared only through API 28.

Updating an installed APK:
1. Open every project stored on the tablet.
2. Export a separate Backup JSON for every project.
3. Open My Files.
4. Open Downloads.
5. Open PlotWeasel.
6. Confirm every backup file exists.
7. Open at least one backup to confirm it is readable.
8. Copy every backup to an approved location.
9. Export required Crew Package files.
10. Keep the existing application installed.
11. Install the newer signed APK over the existing application.
12. The updated APK must use the same Android application ID.
13. The updated APK must use the same Android signing key.
14. The updated Android versionCode must be greater than the installed versionCode.
15. The HTML asset URL must remain file:///android_asset/field_logger/PlotWeasel_Field_Logger.html.
16. Open the updated application.
17. Confirm the header shows v2.3.4.
18. Confirm the release date shows September 21, 2026.
19. Confirm the status shows Local only.
20. Confirm all projects and records remain available.
21. Confirm existing woodland records remain available.
22. Test Export Project Setup.
23. Test Crew Package.
24. Test Backup JSON.
25. Test Plot Weasel Desktop CSV.
26. Test Save Site, Tree, Woodland, Regen CSVs.
27. Verify the actual files under Downloads/PlotWeasel.
28. Do not return the tablet to operational use until persistence and every export test pass.

Uninstalling:
- Do not uninstall until every project has a verified Backup JSON.
- Uninstalling can remove all locally stored projects and records.
- Reinstalling the APK does not automatically restore removed application data.
- Restore each project from its Backup JSON when needed.
- The APK installer file may be deleted from Downloads after successful installation.
- Deleting the APK installer does not uninstall the application.
- Do not uninstall merely because Android reports that an update cannot be installed.
- First confirm the application ID, signing key, and versionCode.

Android signing:
- Release updates must use the same signing key as the installed release.
- Keep the .jks keystore private.
- Keep the keystore password private.
- Keep the key alias private.
- Keep the key password private.
- Back up signing information in an approved secure location.
- Do not commit a keystore or passwords to GitHub.
- Losing the signing key may prevent future APKs from installing as updates.

Android Studio maintainer checklist:
1. Back up all test and field data.
2. Open the Android project.
3. Locate app/src/main/assets/field_logger.
4. Remove obsolete Field Logger HTML copies from that folder.
5. Place the current PlotWeasel_Field_Logger.html in that folder.
6. Confirm the HTML title identifies v2.3.4.
7. Confirm the HTML APP_VERSION constant is 2.3.4.
8. Confirm the visible version pill is v2.3.4.
9. Confirm the visible release date is September 21, 2026.
10. Confirm the HTML contains hasAndroidFileBridge("saveTextFile").
11. Confirm the HTML contains hasAndroidFileBridge("saveTextFiles").
12. Confirm the HTML contains window.AndroidFileBridge.saveTextFile.
13. Confirm the HTML contains window.AndroidFileBridge.saveTextFiles.
14. Confirm both saveCsvsToFolder functions check the Android bridge before showDirectoryPicker.
15. Confirm exportProjectSetup does not display a false success after an Android failure.
16. Open app/src/main/java/gov/bia/plotweasel/MainActivity.java.
17. Confirm MainActivity.java loads file:///android_asset/field_logger/PlotWeasel_Field_Logger.html.
18. Confirm MainActivity.java registers the JavaScript interface with the exact name AndroidFileBridge.
19. Confirm MainActivity.java exposes saveTextFile.
20. Confirm MainActivity.java exposes saveTextFiles.
21. Confirm both Java methods use the JavascriptInterface annotation.
22. Confirm each Java method returns a JSON string containing ok and message.
23. Confirm successful saves return ok true.
24. Confirm failed saves return ok false.
25. Confirm modern Android exports use MediaStore Downloads.
26. Confirm Android 8 and Android 9 use only the limited legacy storage route.
27. Open app/src/main/AndroidManifest.xml.
28. Confirm ACCESS_FINE_LOCATION is declared.
29. Confirm ACCESS_COARSE_LOCATION is declared.
30. Confirm WRITE_EXTERNAL_STORAGE is limited with android:maxSdkVersion="28".
31. Confirm MANAGE_EXTERNAL_STORAGE is not declared.
32. Open app/build.gradle.
33. Confirm namespace is gov.bia.plotweasel.
34. Confirm applicationId is gov.bia.plotweasel.fieldlogger.
35. Confirm versionName is "2.3.4".
36. Confirm versionCode is greater than the prior release.
37. For the planned build, confirm versionCode is 230.
38. Open app/src/main/res/values/strings.xml.
39. Confirm the displayed application name identifies v2.3.4.
40. Search the Android project for old Field Logger version references.
41. Do not replace Plot Weasel Desktop v2.3.3 references unless Desktop itself changes.
42. Delete stale generated app/build output before the final build.
43. Do not edit source files under app/build or app/build/intermediates.
44. Clean the Android project.
45. Rebuild the Android project.
46. Build the signed release APK.
47. Use the same release signing key as v2.3.3.
48. Rename the final signed APK to PlotWeaselFieldLogger_Ver2.3.4.apk.
49. Install it over v2.3.3 on a test tablet without uninstalling.
50. Confirm v2.3.4 appears in the header.
51. Confirm Released September 21, 2026 appears in the header.
52. Confirm Local only appears in the header.
53. Confirm existing test project data remains available.
54. Test the Southwest Variant checkbox.
55. Test the Woodland tab.
56. Test one live woodland record.
57. Test one dead woodland record.
58. Test GPS capture.
59. Test Project Setup export and import.
60. Test Crew Package export and import.
61. Test Backup JSON export and restore.
62. Test PlotWeasel_upload.csv.
63. Test Site.csv.
64. Test Tree.csv.
65. Test Woodland.csv.
66. Test Regen.csv.
67. Test Review.txt.
68. Confirm individual exports appear under Downloads/PlotWeasel.
69. Confirm grouped files appear in a dated subfolder under Downloads/PlotWeasel.
70. Confirm no Android export displays Folder save cancelled.
71. Confirm a forced export failure displays an error rather than a false success.
72. Test the offline HTML folder export in Microsoft Edge on Windows.
73. Calculate the SHA-256 hash from the final signed APK.
74. Replace the SHA-256 placeholder in this README.
75. Confirm the Android versionCode in this README matches the final app/build.gradle file.
76. Retain the signed APK, source HTML, Java wrapper, README, release notes, and test results together.

Required v2.3.4 acceptance tests:
- The header shows v2.3.4.
- The header shows Released September 21, 2026.
- The Android build shows Local only.
- A test project remains after closing and reopening the app.
- v2.3.4 installs over v2.3.3 without uninstalling.
- Existing test data remains after the update.
- Export Project Setup creates a JSON file under Downloads/PlotWeasel.
- Crew Package creates a JSON file under Downloads/PlotWeasel.
- Backup JSON creates a JSON file under Downloads/PlotWeasel.
- Plot Weasel Desktop CSV creates a CSV file under Downloads/PlotWeasel.
- Save Site, Tree, Woodland, Regen CSVs creates a dated subfolder under Downloads/PlotWeasel.
- The grouped folder contains Site.csv.
- The grouped folder contains Tree.csv.
- The grouped folder contains Woodland.csv when applicable.
- The grouped folder contains Regen.csv.
- The grouped folder contains Review.txt.
- No Android export displays Folder save cancelled.
- No Android export button appears to do nothing.
- Android export failures display a visible error.
- Android success messages identify the saved location.
- The Windows Microsoft Edge folder-picker export remains functional.
- Southwest Variant displays the Woodland tab.
- The Woodland title includes fixed radius only.
- Woodland species code 106 displays common or two-needle pinyon.
- Woodland species code 143 displays Arizona pinyon pine.
- Woodland species code 477 displays curlleaf mountain-mahogany.
- A woodland record is present in Woodland.csv.
- A woodland record is absent from PlotWeasel_upload.csv.
- Tree.csv contains record_type.
- Tree.csv contains Live/Dead.
- Tree.csv contains status.
- Tree.csv contains Damage Agent 2.
- Tree.csv contains DECAYCD.
- PlotWeasel_upload.csv contains record_type.
- PlotWeasel_upload.csv contains status.
- PlotWeasel_upload.csv contains damage_agent_2.
- None does not appear as a damage-agent value in exported CSV fields.
- A Broken Top tree requires Actual Height and Height.
- Broken Top Actual Height is greater than zero.
- Broken Top Actual Height is less than estimated total Height.
- A normal live tree exports Height as actualht.
- A dead point-sample tree exports the correct DECAYCD.
- A dead woodland tree exports the correct DECAYCD.
- A plot without point-sample trees receives a Tree.csv null row.
- A Southwest Variant plot without woodland records receives a Woodland.csv null row.
- A plot without regeneration records receives a Regen.csv null row.
- A plot without eligible point-sample trees receives a blank PlotWeasel_upload.csv tree row.
- A woodland record does not prevent creation of the point-sample tree null row.
- Crew and project information appear as expected.
- Project Setup transfers the Southwest Variant setting without replacing Crew Name or Crew ID.
- Crew Packages preserve woodland records.
- Backup JSON preserves woodland records.
- Exported files open correctly before release distribution.
- The numbered regeneration null-row behavior is tested with Plot Weasel Desktop v2.3.3 before full compatibility is claimed.
- The final signed APK hash replaces the README placeholder.

Troubleshooting:

Memory only:
Stop operational field collection. Persistent storage is not available. Export any recoverable project immediately and do not continue using the build for operational data.

Wrong Field Logger version in header:
The Android build is loading an older HTML asset or an older APK remains installed. Confirm MainActivity.java loads PlotWeasel_Field_Logger.html, remove obsolete asset copies, clean the build, rebuild, and install the correct APK.

Wrong release date in header:
The bundled HTML is not the approved v2.3.4 source. Replace the source asset, clean the project, and rebuild.

Play Protect or unrecognized application warning:
Confirm the APK came from the approved source and verify its SHA-256 value. This warning concerns the installation source and is separate from the export system.

Woodland tab missing:
Activate Southwest Variant / Woodland Nested Plot in the Field Session panel.

Existing woodland records seem hidden:
Reactivate Southwest Variant. Hiding the tab does not delete woodland records.

Woodland record appears in PlotWeasel_upload.csv:
Do not distribute the build. The current Desktop export must contain qualifying point-sample Tree records only.

Tree.csv has no status column:
Do not distribute the build. The current Tree.csv schema includes the lowercase status field.

Android export button appears to do nothing:
Confirm the installed app shows v2.3.4. Check Downloads/PlotWeasel. If no file exists, confirm MainActivity.java registers AndroidFileBridge and exposes saveTextFile. Confirm the current bridge-enabled HTML is bundled. Clean, rebuild, and install the newly signed APK over the existing app.

Save Site, Tree, Woodland, Regen CSVs displays Folder save cancelled:
The Android bridge was not detected and the HTML fell back to the browser directory picker. The APK probably contains the old MainActivity.java, the old HTML asset, or an old APK was installed. Do not uninstall the existing app. Correct the source, increase the versionCode when needed, rebuild, sign with the same key, and install the update over the existing application.

Folder save unavailable appears inside the Android APK:
AndroidFileBridge was not registered or the APK contains the wrong HTML. Confirm the bridge name and method names exactly match.

Android did not confirm that the file was saved:
The Java bridge returned a blank or unreadable result. Confirm saveTextFile and saveTextFiles always return a JSON string containing ok and message.

File save failed:
Record the complete message shown by Field Logger. Confirm shared storage is available, the build contains the current Java bridge, and the Java method returned ok false with a readable message. Do not claim the file was saved until it exists in My Files.

Export reports success but file cannot be found:
Open My Files, then Downloads, then PlotWeasel. Individual JSON and CSV exports are directly in PlotWeasel. Grouped files are inside a dated project-and-crew subfolder. Search My Files using part of the project name when needed.

Grouped export folder cannot be found:
Look for a folder whose name contains the project name, Crew ID, export type, and current date. The folder may include site-tree-woodland-regen-csvs or site-tree-regen-csvs.

Old version after rebuilding:
Remove old HTML copies from app/src/main/assets/field_logger, verify the wrapper filename, delete stale app/build output, clean the Android project, rebuild, sign the release APK, and install that newly built file.

Buttons do not respond:
The HTML may be open in a restricted preview or the APK may contain an incomplete or outdated asset. Confirm the HTML is loaded from the stable Android asset path.

Project disappears after restart:
Do not use the build. Persistent storage is not working or the application identity or asset origin changed.

Existing projects disappear after an update:
Stop using the new build. Confirm the application ID, signing identity, stable asset URL, and storage keys. Do not uninstall either version while investigating. Restore only from verified backups when necessary.

GPS permission denied:
Open Android Settings, locate Plot Weasel Field Logger, allow Location while using the app, and enable Precise location.

No GPS fix:
Move to an open location, confirm Location Services are enabled, confirm application permission, and try again.

Update will not install:
Confirm the APK uses the same application ID, the same signing key, and a versionCode greater than the installed version. Do not uninstall merely to bypass the update error.

Project was deleted:
Restore the project from its Backup JSON.

All projects were cleared:
Restore each project separately from its own Backup JSON.

Backup JSON cannot be found:
Open Downloads/PlotWeasel. Remember that Backup JSON contains only the active project. Export each saved project separately.

Windows folder picker does not appear:
Open the official local PlotWeasel_Field_Logger.html file in Microsoft Edge. Do not run it from Teams, SharePoint, email, or another restricted preview.

Release-file retention:
Retain the following together for every official release:
- Final signed APK.
- Exact PlotWeasel_Field_Logger.html source included in the APK.
- Exact MainActivity.java source included in the APK.
- AndroidManifest.xml.
- app/build.gradle.
- strings.xml.
- Android README.
- General repository README.
- User Guide.
- SHA-256 hash.
- Android versionName.
- Android versionCode.
- Application ID.
- Release date.
- Signing-key reference.
- Test results.
- Known limitations.
- A record of the device and Android version used for acceptance testing.
- A record confirming the update was installed over the previous version without uninstalling.
- A record confirming all Android exports appeared under Downloads/PlotWeasel.