package com.granfish.app;

public final class AppConfig {
    private AppConfig() {}

    // Live URL fallback if deployed, or local asset loader URL
    public static final String LOCAL_ASSET_URL = "https://appassets.androidplatform.net/assets/index.html";
    
    // Set to your remote deployment URL (e.g. "https://granfish.com.br") or leave null to use bundled assets
    public static final String REMOTE_URL = null; 

    public static final String DEFAULT_URL = REMOTE_URL != null ? REMOTE_URL : LOCAL_ASSET_URL;

    public static final String APP_SCHEME = "granfish";
    public static final String WHATSAPP_PACKAGE = "com.whatsapp";
    public static final String USER_AGENT_SUFFIX = " GranFishApp/1.0 (Android)";
}
