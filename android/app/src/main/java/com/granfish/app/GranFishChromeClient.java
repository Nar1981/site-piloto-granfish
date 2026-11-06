package com.granfish.app;

import android.net.Uri;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.ProgressBar;

import androidx.activity.result.ActivityResultLauncher;
import androidx.annotation.Nullable;

public class GranFishChromeClient extends WebChromeClient {

    private final ProgressBar progressBar;
    private final FileChooserCallback fileChooserCallback;

    public interface FileChooserCallback {
        void onFileChooserRequested(ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams);
    }

    public GranFishChromeClient(@Nullable ProgressBar progressBar, @Nullable FileChooserCallback fileChooserCallback) {
        this.progressBar = progressBar;
        this.fileChooserCallback = fileChooserCallback;
    }

    @Override
    public void onProgressChanged(WebView view, int newProgress) {
        if (progressBar != null) {
            if (newProgress < 100) {
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(newProgress);
            } else {
                progressBar.setVisibility(View.GONE);
            }
        }
        super.onProgressChanged(view, newProgress);
    }

    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
        if (fileChooserCallback != null) {
            fileChooserCallback.onFileChooserRequested(filePathCallback, fileChooserParams);
            return true;
        }
        return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
    }

    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
    }
}
