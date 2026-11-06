package com.granfish.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity implements GranFishChromeClient.FileChooserCallback {

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private View layoutOffline;
    private ValueCallback<Uri[]> uploadMessage;
    private ActivityResultLauncher<Intent> fileChooserLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Switch from splash theme to main app theme
        setTheme(R.style.Theme_GranFish);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        initFileChooser();
        setupWebView();
        setupBackNavigation();

        loadStartPage();
    }

    private void initViews() {
        webView = findViewById(R.id.webView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        progressBar = findViewById(R.id.progressBar);
        layoutOffline = findViewById(R.id.layoutOffline);

        Button btnRetry = findViewById(R.id.btnRetry);
        btnRetry.setOnClickListener(v -> {
            layoutOffline.setVisibility(View.GONE);
            webView.reload();
        });

        swipeRefreshLayout.setColorSchemeResources(R.color.teal, R.color.copper);
        swipeRefreshLayout.setOnRefreshListener(() -> {
            webView.reload();
            swipeRefreshLayout.setRefreshing(false);
        });
    }

    private void initFileChooser() {
        fileChooserLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (uploadMessage == null) return;
                Uri[] results = null;
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    Intent data = result.getData();
                    if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    } else if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    }
                }
                uploadMessage.onReceiveValue(results);
                uploadMessage = null;
            }
        );
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // JavaScript & Storage (essential for 3D configurator, Marina chat, and catalog)
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Rendering & Viewport
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // Media & Audio
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Mixed content
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        // Custom User Agent suffix
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + AppConfig.USER_AGENT_SUFFIX);

        // Hardware Acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Asset Loader for local offline asset serving
        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new GranFishWebClient(this, assetLoader, layoutOffline));
        webView.setWebChromeClient(new GranFishChromeClient(progressBar, this));

        // Downloads listener (catalogs, PPTX, PDFs)
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                request.setTitle(fileName);
                request.setDescription("Baixando arquivo Gran Fish…");
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                if (dm != null) {
                    dm.enqueue(request);
                    Toast.makeText(MainActivity.this, getString(R.string.download_started) + " " + fileName, Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                // Fallback to browser
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
            }
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                // First check if a modal or Marina chat is open inside webview
                webView.evaluateJavascript(
                    "(function() { " +
                    "  const modal = document.querySelector('dialog[open]'); " +
                    "  if (modal) { modal.close(); return 'modal'; } " +
                    "  const gfcBox = document.querySelector('.gfc-box:not([hidden])'); " +
                    "  if (gfcBox) { " +
                    "    const btn = document.querySelector('.gfc-back, .gfc-x'); " +
                    "    if (btn) btn.click(); else gfcBox.hidden = true; " +
                    "    return 'chat'; " +
                    "  } " +
                    "  return ''; " +
                    "})()",
                    value -> {
                        // If dialog or chat was handled by JS, do not navigate back
                        if (value != null && (value.contains("modal") || value.contains("chat"))) {
                            return;
                        }

                        // Otherwise go back in WebView history
                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            setEnabled(false);
                            getOnBackPressedDispatcher().onBackPressed();
                        }
                    }
                );
            }
        });
    }

    private void loadStartPage() {
        webView.loadUrl(AppConfig.DEFAULT_URL);
    }

    @Override
    public void onFileChooserRequested(ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
        if (uploadMessage != null) {
            uploadMessage.onReceiveValue(null);
            uploadMessage = null;
        }
        uploadMessage = filePathCallback;

        Intent intent = fileChooserParams.createIntent();
        try {
            fileChooserLauncher.launch(intent);
        } catch (Exception e) {
            uploadMessage = null;
            Toast.makeText(this, "Não foi possível abrir o seletor de arquivos", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
