package com.cinespartan.app;

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {
    private View mCustomView;
    private WebChromeClient.CustomViewCallback mCustomViewCallback;
    private ViewGroup mDecorView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep screen on while app is active (ideal for TV Box streaming)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    public void onStart() {
        super.onStart();
        Bridge bridge = this.getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();
            
            // Streaming & Media Playback Settings
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            
            // Habilita cookies de terceiros para embeds de streaming e resolução rápida de sessões sem travar o app
            try {
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
            } catch (Exception ignored) {}

            // ANTI-AD & ANTI-REDIRECT SHIELD NATIVO:
            // Desativa múltiplas janelas para bloquear popups nativamente sem custo de CPU nem alocação de WebViews na UI thread
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);

            // Fullscreen & Security WebChromeClient
            webView.addJavascriptInterface(new AndroidBridge(), "AndroidNative");

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                    // Bloqueia silenciosamente popups sem criar novas WebViews na UI thread
                    return false;
                }

                @Override
                public void onShowCustomView(View view, CustomViewCallback callback) {
                    if (mCustomView != null) {
                        onHideCustomView();
                        return;
                    }
                    mCustomView = view;
                    mCustomViewCallback = callback;
                    mCustomView.setBackgroundColor(android.graphics.Color.BLACK);
                    mDecorView = (ViewGroup) getWindow().getDecorView();
                    mDecorView.addView(mCustomView, new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                    webView.setVisibility(View.GONE);
                    try {
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                    } catch (Exception ignored) {}
                    getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                    getWindow().getDecorView().setSystemUiVisibility(
                            View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    );
                }

                @Override
                public void onHideCustomView() {
                    if (mCustomView == null) return;
                    if (mDecorView != null) {
                        mDecorView.removeView(mCustomView);
                    }
                    mCustomView = null;
                    if (mCustomViewCallback != null) {
                        mCustomViewCallback.onCustomViewHidden();
                        mCustomViewCallback = null;
                    }
                    webView.setVisibility(View.VISIBLE);
                    try {
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    } catch (Exception ignored) {}
                    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                }
            });

            // WebViewClient with Stream Proxy and Ad Navigation Shield
            webView.setWebViewClient(new StreamProxyWebViewClient(bridge));
        }
    }

    public class AndroidBridge {
        @android.webkit.JavascriptInterface
        public void setFullscreen(final boolean enable) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (enable) {
                        try {
                            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                        } catch (Exception ignored) {}
                        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                        getWindow().getDecorView().setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        );
                    } else {
                        try {
                            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                        } catch (Exception ignored) {}
                        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                    }
                }
            });
        }

        @android.webkit.JavascriptInterface
        public boolean isNative() {
            return true;
        }
    }

    @Override
    public void onBackPressed() {
        if (mCustomView != null) {
            // Exit fullscreen when user presses Back on TV remote or phone
            if (mCustomViewCallback != null) {
                mCustomViewCallback.onCustomViewHidden();
                mCustomViewCallback = null;
            }
            if (mDecorView != null && mCustomView != null) {
                mDecorView.removeView(mCustomView);
            }
            mCustomView = null;
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setVisibility(View.VISIBLE);
            }
            try {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
            } catch (Exception ignored) {}
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
            return;
        }

        super.onBackPressed();
    }

    private static class StreamProxyWebViewClient extends BridgeWebViewClient {
        // Known intrusive ad & commercial video ad networks to block at network layer
        private static final String[] BLOCKED_AD_PATTERNS = {
            "adsterra", "popads", "clickadu", "propellerads", "monetag",
            "exoclick", "adnxs", "histats", "adkeep", "syndication",
            "doubleclick", "trafficjunky", "richaudience", "bet365",
            "1xbet", "blaze", "betano", "onclkds", "clkmc", "go.redirect",
            "directrev", "adtrue", "yllix", "hilltopads", "galaksion",
            "a-ads", "pushwhoosh", "notix", "tsyndicate", "admaven",
            "coinhive", "realsrv", "mcclp", "trafficfactory",
            "googlesyndication", "googleadservices",
            "aniview", "springserve", "spotxchange", "smartadserver",
            "vidazoo", "teads", "pubmatic", "openx", "rubiconproject",
            "criteo", "outbrain", "taboola", "mgid", "inmobi", "vdo.ai",
            "playwire", "connatix", "wurl", "invidi", "adkernel", "tremorvideo",
            "zergnet", "adition", "ad-delivery", "adserver", "adskeeper",
            "adcash", "popcash", "bidvertiser"
        };

        public StreamProxyWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (url == null) return false;
            String host = url.getHost();
            
            // Allow internal app navigation
            if (host == null || host.equals("localhost") || host.equals("127.0.0.1") || host.contains("cinespartan")) {
                return false;
            }

            // Block any iframe attempt to redirect our app out to an ad site
            for (String adPattern : BLOCKED_AD_PATTERNS) {
                if (url.toString().toLowerCase().contains(adPattern)) {
                    return true; // Cancel and swallow the ad redirect!
                }
            }

            return super.shouldOverrideUrlLoading(view, request);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (uri != null) {
                String host = uri.getHost();

                // NUNCA intercepta arquivos internos do app (localhost, 127.0.0.1, cinespartan)
                // Isso evita erros 400 e previne corrupção de bundles JS/CSS da aplicação
                if (host == null || host.equals("localhost") || host.equals("127.0.0.1") || host.contains("cinespartan")) {
                    return super.shouldInterceptRequest(view, request);
                }

                String uriStr = uri.toString().toLowerCase();

                // Fast-path de Mídia: Nunca intercepta fragmentos de vídeo (.ts, .m3u8, .mp4, m4s) para máxima fluidez a 60 FPS e zero buffering
                if (uriStr.endsWith(".ts") || uriStr.endsWith(".m3u8") || uriStr.endsWith(".mp4") 
                        || uriStr.endsWith(".m4s") || uriStr.contains(".m3u8?") || uriStr.contains(".ts?") 
                        || uriStr.contains("/hls/") || uriStr.contains("/segments/")) {
                    return super.shouldInterceptRequest(view, request);
                }

                // Bloqueia scripts de anúncios invasivos conhecidos de forma limpa sem quebrar a execução de players
                for (String pattern : BLOCKED_AD_PATTERNS) {
                    if (uriStr.contains(pattern)) {
                        return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
                    }
                }

                // Handle native HLS/IPTV Stream Proxy
                if (uri.getPath() != null && uri.getPath().contains("/api/proxy-stream")) {
                    String targetUrl = uri.getQueryParameter("url");
                    if (targetUrl != null && !targetUrl.isEmpty()) {
                        try {
                            URL url = new URL(targetUrl);
                            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("GET");
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                            conn.setRequestProperty("Accept", "*/*");
                            conn.setConnectTimeout(8000);
                            conn.setReadTimeout(12000);
                            conn.setInstanceFollowRedirects(true);
                            conn.connect();

                            int responseCode = conn.getResponseCode();
                            if (responseCode >= 400) {
                                return new WebResourceResponse("text/plain", "UTF-8", responseCode, "Error", null, new ByteArrayInputStream(new byte[0]));
                            }

                            String contentType = conn.getContentType();
                            if (contentType == null) contentType = "video/MP2T";
                            InputStream in = conn.getInputStream();

                            Map<String, String> headers = new HashMap<>();
                            headers.put("Access-Control-Allow-Origin", "*");
                            headers.put("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
                            headers.put("Access-Control-Allow-Headers", "*");

                            boolean isM3u8 = targetUrl.contains(".m3u8") || contentType.contains("mpegurl");
                            if (isM3u8) {
                                byte[] rawBytes = readStreamBytes(in);
                                String text = new String(rawBytes, StandardCharsets.UTF_8);

                                StringBuilder sb = new StringBuilder();
                                for (String line : text.split("\n")) {
                                    String trimmed = line.trim();
                                    if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                                        String full;
                                        try {
                                            full = trimmed.startsWith("http") ? trimmed : new URL(url, trimmed).toString();
                                        } catch (Exception ex) {
                                            full = trimmed;
                                        }
                                        sb.append("/api/proxy-stream?url=").append(Uri.encode(full)).append("\n");
                                    } else if (trimmed.startsWith("#EXT") && trimmed.contains("URI=\"")) {
                                        sb.append(trimmed.replaceAll("URI=\"([^\"]+)\"", "URI=\"/api/proxy-stream?url=$1\"")).append("\n");
                                    } else {
                                        sb.append(line).append("\n");
                                    }
                                }
                                byte[] rewritten = sb.toString().getBytes(StandardCharsets.UTF_8);
                                return new WebResourceResponse("application/vnd.apple.mpegurl", "UTF-8", 200, "OK", headers, new ByteArrayInputStream(rewritten));
                            }

                            return new WebResourceResponse(contentType, "UTF-8", 200, "OK", headers, in);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
            return super.shouldInterceptRequest(view, request);
        }

        private static byte[] readStreamBytes(InputStream in) throws Exception {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            int nRead;
            byte[] data = new byte[8192];
            while ((nRead = in.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            buffer.flush();
            return buffer.toByteArray();
        }
    }
}
