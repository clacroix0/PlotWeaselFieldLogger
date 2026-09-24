package gov.bia.plotweasel;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final int REQUIRED_PERMISSION_REQUEST = 1001;
    private static final String EXPORT_ROOT_FOLDER = "PlotWeasel";
    private static final String LOG_TAG = "PlotWeaselExport";

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        /*
         * Always load the HTML asset packaged in the current APK rather
         * than reusing an older WebView resource-cache copy.
         */
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        /*
         * This clears the WebView resource cache. It does not clear the
         * Field Logger projects stored in WebView localStorage.
         */
        webView.clearCache(true);

        webView.setWebViewClient(new WebViewClient());

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(
                    String origin,
                    GeolocationPermissions.Callback callback
            ) {
                callback.invoke(origin, true, false);
            }
        });

        /*
         * This name must exactly match the JavaScript calls in the HTML:
         *
         * window.AndroidFileBridge.saveTextFile(...)
         * window.AndroidFileBridge.saveTextFiles(...)
         */
        webView.addJavascriptInterface(
                new AndroidFileBridge(),
                "AndroidFileBridge"
        );

        setContentView(webView);

        requestRequiredPermissionsIfNeeded();

        /*
         * Keep this filename and URL stable between releases.
         * Changing it could separate the app from existing WebView
         * local-storage data.
         */
        webView.loadUrl(
                "file:///android_asset/field_logger/PlotWeasel_Field_Logger.html"
        );
    }

    private void requestRequiredPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }

        List<String> missingPermissions = new ArrayList<>();

        if (
                checkSelfPermission(
                        Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            missingPermissions.add(
                    Manifest.permission.ACCESS_FINE_LOCATION
            );
        }

        if (
                checkSelfPermission(
                        Manifest.permission.ACCESS_COARSE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            missingPermissions.add(
                    Manifest.permission.ACCESS_COARSE_LOCATION
            );
        }

        /*
         * Android 10 and newer use MediaStore and do not need
         * broad storage permission.
         *
         * Android 8 and Android 9 use the legacy permission that
         * AndroidManifest.xml limits to API 28 and earlier.
         */
        if (
                Build.VERSION.SDK_INT <= Build.VERSION_CODES.P
                        && checkSelfPermission(
                        Manifest.permission.WRITE_EXTERNAL_STORAGE
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            missingPermissions.add(
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
            );
        }

        if (!missingPermissions.isEmpty()) {
            requestPermissions(
                    missingPermissions.toArray(new String[0]),
                    REQUIRED_PERMISSION_REQUEST
            );
        }
    }

    public final class AndroidFileBridge {
        @JavascriptInterface
        public String saveTextFile(
                String fileName,
                String mimeType,
                String content
        ) {
            try {
                String safeFileName =
                        sanitizeFileName(fileName);

                String safeMimeType =
                        normalizeMimeType(mimeType);

                String safeContent =
                        content == null
                                ? ""
                                : content;

                writeTextFile(
                        "",
                        safeFileName,
                        safeMimeType,
                        safeContent
                );

                return resultJson(
                        true,
                        "Saved "
                                + safeFileName
                                + " to Downloads/"
                                + EXPORT_ROOT_FOLDER
                                + "."
                );
            } catch (Exception error) {
                Log.e(
                        LOG_TAG,
                        "Single-file export failed",
                        error
                );

                return resultJson(
                        false,
                        readableError(error)
                );
            }
        }

        @JavascriptInterface
        public String saveTextFiles(
                String folderName,
                String filesJson
        ) {
            try {
                String safeFolderName =
                        sanitizeFolderName(folderName);

                JSONArray files =
                        new JSONArray(
                                filesJson == null
                                        ? "[]"
                                        : filesJson
                        );

                if (files.length() == 0) {
                    throw new IOException(
                            "No export files were supplied."
                    );
                }

                for (
                        int index = 0;
                        index < files.length();
                        index += 1
                ) {
                    JSONObject file =
                            files.getJSONObject(index);

                    String safeFileName =
                            sanitizeFileName(
                                    file.optString(
                                            "name",
                                            ""
                                    )
                            );

                    String safeMimeType =
                            normalizeMimeType(
                                    file.optString(
                                            "mimeType",
                                            "text/plain"
                                    )
                            );

                    String safeContent =
                            file.optString(
                                    "content",
                                    ""
                            );

                    writeTextFile(
                            safeFolderName,
                            safeFileName,
                            safeMimeType,
                            safeContent
                    );
                }

                return resultJson(
                        true,
                        "Saved "
                                + files.length()
                                + " files to Downloads/"
                                + EXPORT_ROOT_FOLDER
                                + "/"
                                + safeFolderName
                                + "."
                );
            } catch (Exception error) {
                Log.e(
                        LOG_TAG,
                        "Multi-file export failed",
                        error
                );

                return resultJson(
                        false,
                        readableError(error)
                );
            }
        }
    }

    private void writeTextFile(
            String subfolder,
            String fileName,
            String mimeType,
            String content
    ) throws IOException {
        if (
                Build.VERSION.SDK_INT
                        >= Build.VERSION_CODES.Q
        ) {
            writeUsingMediaStore(
                    subfolder,
                    fileName,
                    mimeType,
                    content
            );
        } else {
            writeUsingLegacyDownloads(
                    subfolder,
                    fileName,
                    content
            );
        }
    }

    @TargetApi(Build.VERSION_CODES.Q)
    private void writeUsingMediaStore(
            String subfolder,
            String fileName,
            String mimeType,
            String content
    ) throws IOException {
        String relativePath =
                Environment.DIRECTORY_DOWNLOADS
                        + "/"
                        + EXPORT_ROOT_FOLDER;

        if (!subfolder.isEmpty()) {
            relativePath += "/" + subfolder;
        }

        ContentValues values =
                new ContentValues();

        values.put(
                MediaStore.MediaColumns.DISPLAY_NAME,
                fileName
        );

        values.put(
                MediaStore.MediaColumns.MIME_TYPE,
                mimeType
        );

        values.put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                relativePath
        );

        values.put(
                MediaStore.MediaColumns.IS_PENDING,
                1
        );

        ContentResolver resolver =
                getContentResolver();

        Uri collection =
                MediaStore.Downloads.getContentUri(
                        MediaStore.VOLUME_EXTERNAL_PRIMARY
                );

        Uri item =
                resolver.insert(
                        collection,
                        values
                );

        if (item == null) {
            throw new IOException(
                    "Android could not create "
                            + fileName
                            + "."
            );
        }

        try {
            try (
                    OutputStream output =
                            resolver.openOutputStream(
                                    item,
                                    "w"
                            )
            ) {
                if (output == null) {
                    throw new IOException(
                            "Android could not open "
                                    + fileName
                                    + " for writing."
                    );
                }

                output.write(
                        content.getBytes(
                                StandardCharsets.UTF_8
                        )
                );

                output.flush();
            }

            ContentValues completed =
                    new ContentValues();

            completed.put(
                    MediaStore.MediaColumns.IS_PENDING,
                    0
            );

            int updated =
                    resolver.update(
                            item,
                            completed,
                            null,
                            null
                    );

            if (updated == 0) {
                throw new IOException(
                        "Android could not finish saving "
                                + fileName
                                + "."
                );
            }
        } catch (Exception error) {
            try {
                resolver.delete(
                        item,
                        null,
                        null
                );
            } catch (Exception ignored) {
                /*
                 * Preserve the original export error.
                 */
            }

            if (error instanceof IOException) {
                throw (IOException) error;
            }

            throw new IOException(
                    "Android could not save "
                            + fileName
                            + ".",
                    error
            );
        }
    }

    @SuppressWarnings("deprecation")
    private void writeUsingLegacyDownloads(
            String subfolder,
            String fileName,
            String content
    ) throws IOException {
        if (
                checkSelfPermission(
                        Manifest.permission.WRITE_EXTERNAL_STORAGE
                ) != PackageManager.PERMISSION_GRANTED
        ) {
            throw new IOException(
                    "Storage permission is required on Android 8 or 9. "
                            + "Allow the permission and try the export again."
            );
        }

        if (
                !Environment.MEDIA_MOUNTED.equals(
                        Environment.getExternalStorageState()
                )
        ) {
            throw new IOException(
                    "Android shared storage is not available."
            );
        }

        File downloads =
                Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_DOWNLOADS
                );

        File outputFolder =
                new File(
                        downloads,
                        EXPORT_ROOT_FOLDER
                );

        if (!subfolder.isEmpty()) {
            outputFolder =
                    new File(
                            outputFolder,
                            subfolder
                    );
        }

        if (
                !outputFolder.exists()
                        && !outputFolder.mkdirs()
        ) {
            throw new IOException(
                    "Android could not create the export folder."
            );
        }

        File outputFile =
                new File(
                        outputFolder,
                        fileName
                );

        try (
                FileOutputStream output =
                        new FileOutputStream(
                                outputFile
                        )
        ) {
            output.write(
                    content.getBytes(
                            StandardCharsets.UTF_8
                    )
            );

            output.flush();
        }
    }

    private String sanitizeFileName(
            String rawValue
    ) {
        String value =
                rawValue == null
                        ? ""
                        : rawValue.trim();

        value =
                value.replaceAll(
                        "[\\p{Cntrl}\\\\/:*?\"<>|]",
                        "_"
                );

        value =
                value.replaceAll(
                        "^\\.+",
                        ""
                );

        if (value.isEmpty()) {
            return "PlotWeasel_export.txt";
        }

        return value;
    }

    private String sanitizeFolderName(
            String rawValue
    ) {
        String value =
                rawValue == null
                        ? ""
                        : rawValue.trim();

        value =
                value.replaceAll(
                        "[\\p{Cntrl}\\\\/:*?\"<>|.]",
                        "_"
                );

        value =
                value.replaceAll(
                        "_+",
                        "_"
                );

        value =
                value.replaceAll(
                        "^_+|_+$",
                        ""
                );

        if (value.isEmpty()) {
            return "FieldLoggerExport";
        }

        return value;
    }

    private String normalizeMimeType(
            String rawValue
    ) {
        String value =
                rawValue == null
                        ? ""
                        : rawValue.trim();

        return value.isEmpty()
                ? "text/plain"
                : value;
    }

    private String readableError(
            Exception error
    ) {
        String message =
                error.getMessage();

        if (
                message == null
                        || message.trim().isEmpty()
        ) {
            return "Android could not save the export file. "
                    + "Error: "
                    + error.getClass().getSimpleName()
                    + ".";
        }

        return message;
    }

    private String resultJson(
            boolean ok,
            String message
    ) {
        return "{\"ok\":"
                + ok
                + ",\"message\":"
                + JSONObject.quote(
                        message == null
                                ? ""
                                : message
                )
                + "}";
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (
                webView != null
                        && webView.canGoBack()
        ) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface(
                    "AndroidFileBridge"
            );

            webView.destroy();
            webView = null;
        }

        super.onDestroy();
    }
}