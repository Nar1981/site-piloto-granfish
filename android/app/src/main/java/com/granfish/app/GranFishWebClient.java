package com.granfish.app;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.WebViewAssetLoader;

public class GranFishWebClient extends WebViewClient {

    private final Context context;
    private final WebViewAssetLoader assetLoader;
    private final View offlineView;
    private boolean hasError = false;

    public GranFishWebClient(@NonNull Context context, @NonNull WebViewAssetLoader assetLoader, @Nullable View offlineView) {
        this.context = context;
        this.assetLoader = assetLoader;
        this.offlineView = offlineView;
    }

    @Nullable
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        // Intercept local assets securely via WebViewAssetLoader
        return assetLoader.shouldInterceptRequest(request.getUrl());
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        return handleUri(uri);
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String urlString) {
        Uri uri = Uri.parse(urlString);
        return handleUri(uri);
    }

    private boolean handleUri(Uri uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();

        if (scheme == null) return false;

        // Open WhatsApp directly in WhatsApp app
        if ("whatsapp".equalsIgnoreCase(scheme) || (host != null && host.contains("wa.me"))) {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                context.startActivity(intent);
                return true;
            } catch (ActivityNotFoundException e) {
                Toast.makeText(context, "WhatsApp não instalado", Toast.LENGTH_SHORT).show();
                return false;
            }
        }

        // Phone call
        if ("tel".equalsIgnoreCase(scheme)) {
            Intent intent = new Intent(Intent.ACTION_DIAL, uri);
            context.startActivity(intent);
            return true;
        }

        // Email
        if ("mailto".equalsIgnoreCase(scheme)) {
            Intent intent = new Intent(Intent.ACTION_SENDTO, uri);
            context.startActivity(intent);
            return true;
        }

        // Google Maps / Location
        if ("geo".equalsIgnoreCase(scheme) || (host != null && host.contains("maps.google.com"))) {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            context.startActivity(intent);
            return true;
        }

        // PDF Files -> view with external PDF viewer
        if (uri.getPath() != null && uri.getPath().endsWith(".pdf")) {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            try {
                context.startActivity(intent);
                return true;
            } catch (Exception e) {
                // let webview handle or download
            }
        }

        // Allow appassets.androidplatform.net to stay within WebView
        if (host != null && host.contains("appassets.androidplatform.net")) {
            return false;
        }

        return false;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        hasError = false;
        if (offlineView != null) offlineView.setVisibility(View.GONE);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        if (!hasError && offlineView != null) {
            offlineView.setVisibility(View.GONE);
        }
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        // Only show offline for main frame request
        if (request.isForMainFrame()) {
            hasError = true;
            if (offlineView != null) {
                offlineView.setVisibility(View.VISIBLE);
            }
        }
    }
}
