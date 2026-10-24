package io.github.yonathanpartida8.librito;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.Manifest;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * My Love Pages como app: abre tu GitHub Pages a pantalla completa, sin barra de
 * direcciones. Todo lo demás (el editor, Mensajitos, Detallitos, Nuestros días) es
 * la misma página de siempre; aquí sólo se le da lo que un navegador da y una
 * vista web no: elegir fotos, vídeo a pantalla completa, guardar descargas, el
 * botón «atrás» del teléfono y (Fase 45) la cámara, el micrófono y la ubicación,
 * que se piden al teléfono sólo cuando la página los usa y sólo para tu sitio.
 * Lo que no puede una vista web: las notificaciones push (para eso, la app
 * instalada desde Chrome).
 */
public class MainActivity extends Activity {
    private static final int ELEGIR = 7, PERMISOS_MEDIOS = 8, PERMISO_UBICACION = 9;
    private WebView web;
    private String host;
    private ValueCallback<Uri[]> alElegir;
    private View pantallaCompleta;
    private WebChromeClient.CustomViewCallback alSalirDePantalla;
    private PermissionRequest pedidoMedios;
    private String origenUbicacion;
    private GeolocationPermissions.Callback alUbicacion;
    /** La página que se ve ahora (el puente de descargas sólo atiende a tu sitio). */
    private volatile String paginaActual = "";

    // Las descargas de la página (el .zip del editor, fotos…) son «blob:», que el
    // gestor de descargas de Android no entiende: se leen en la página y llegan aquí.
    private static final String DESCARGAS =
        "(function(){if(window.__libritoDescargas)return;window.__libritoDescargas=1;" +
        "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');" +
        "if(!a||!/^(blob:|data:)/.test(a.href))return;e.preventDefault();var n=a.getAttribute('download')||'archivo';" +
        "fetch(a.href).then(function(r){return r.blob()}).then(function(b){var f=new FileReader();" +
        "f.onload=function(){LibritoAndroid.guardar(n,b.type||'application/octet-stream',String(f.result).split(',')[1]||'')};" +
        "f.readAsDataURL(b)})},true)})();";

    @Override
    protected void onCreate(Bundle guardado) {
        super.onCreate(guardado);
        host = Uri.parse(BuildConfig.URL_LIBRITO).getHost();
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web = new WebView(this);
        web.setBackgroundColor(0xFFFFF6F1);
        setContentView(web);
        pantallaEntera();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setGeolocationEnabled(true);
        s.setUserAgentString(s.getUserAgentString() + " LibritoApp/1");
        web.addJavascriptInterface(new Puente(), "LibritoAndroid");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (host != null && host.equals(u.getHost())) return false;
                // Lo de fuera (GitHub, WhatsApp, un enlace) se abre en su app.
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException e) { /* nada */ }
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                paginaActual = url == null ? "" : url;
                if (esMio(url)) v.evaluateJavascript(DESCARGAS, null);
            }

            @Override
            public void doUpdateVisitedHistory(WebView v, String url, boolean recarga) {
                paginaActual = url == null ? "" : url;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            // La cámara y el micrófono (getUserMedia): sólo para tu sitio, y con el permiso del teléfono.
            @Override
            public void onPermissionRequest(PermissionRequest r) {
                if (!esMio(r.getOrigin().toString())) { r.deny(); return; }
                List<String> faltan = new ArrayList<>();
                for (String rec : r.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(rec) && !tiene(Manifest.permission.CAMERA)) faltan.add(Manifest.permission.CAMERA);
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(rec) && !tiene(Manifest.permission.RECORD_AUDIO)) faltan.add(Manifest.permission.RECORD_AUDIO);
                }
                if (faltan.isEmpty()) { r.grant(r.getResources()); return; }
                if (pedidoMedios != null) pedidoMedios.deny();
                pedidoMedios = r;
                requestPermissions(faltan.toArray(new String[0]), PERMISOS_MEDIOS);
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest r) {
                if (pedidoMedios == r) pedidoMedios = null;
            }

            // La ubicación (Nuestros días): lo mismo.
            @Override
            public void onGeolocationPermissionsShowPrompt(String origen, GeolocationPermissions.Callback cb) {
                if (!esMio(origen)) { cb.invoke(origen, false, false); return; }
                if (tiene(Manifest.permission.ACCESS_FINE_LOCATION) || tiene(Manifest.permission.ACCESS_COARSE_LOCATION)) { cb.invoke(origen, true, false); return; }
                origenUbicacion = origen;
                alUbicacion = cb;
                requestPermissions(new String[] { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }, PERMISO_UBICACION);
            }

            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (alElegir != null) alElegir.onReceiveValue(null);
                alElegir = cb;
                try {
                    Intent i = p.createIntent();
                    if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(i, ELEGIR);
                    return true;
                } catch (ActivityNotFoundException e) {
                    alElegir = null;
                    return false;
                }
            }

            @Override
            public void onShowCustomView(View vista, CustomViewCallback alSalir) {
                if (pantallaCompleta != null) { alSalir.onCustomViewHidden(); return; }
                pantallaCompleta = vista;
                alSalirDePantalla = alSalir;
                ((FrameLayout) getWindow().getDecorView()).addView(vista, new FrameLayout.LayoutParams(-1, -1));
                web.setVisibility(View.GONE);
            }

            @Override
            public void onHideCustomView() {
                if (pantallaCompleta == null) return;
                ((FrameLayout) getWindow().getDecorView()).removeView(pantallaCompleta);
                pantallaCompleta = null;
                web.setVisibility(View.VISIBLE);
                if (alSalirDePantalla != null) alSalirDePantalla.onCustomViewHidden();
                alSalirDePantalla = null;
            }
        });

        web.setDownloadListener((url, agente, disposicion, tipo, largo) -> {
            if (url.startsWith("http")) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (ActivityNotFoundException e) { /* nada */ }
            }
        });

        if (guardado != null) web.restoreState(guardado);
        else web.loadUrl(BuildConfig.URL_LIBRITO);
    }

    /** Sin barras del sistema (se asoman deslizando desde el borde), como un libro de verdad. */
    private void pantallaEntera() {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean foco) {
        super.onWindowFocusChanged(foco);
        if (foco) pantallaEntera();
    }

    @Override
    protected void onActivityResult(int pedido, int resultado, Intent datos) {
        if (pedido == ELEGIR && alElegir != null) {
            alElegir.onReceiveValue(elegidos(resultado, datos));
            alElegir = null;
            return;
        }
        super.onActivityResult(pedido, resultado, datos);
    }

    /** Uno o varios archivos elegidos (parseResult sólo devuelve uno cuando son varios). */
    private Uri[] elegidos(int resultado, Intent datos) {
        if (resultado != RESULT_OK || datos == null) return null;
        if (datos.getClipData() != null) {
            int n = datos.getClipData().getItemCount();
            Uri[] us = new Uri[n];
            for (int i = 0; i < n; i++) us[i] = datos.getClipData().getItemAt(i).getUri();
            return us;
        }
        return WebChromeClient.FileChooserParams.parseResult(resultado, datos);
    }

    @Override
    public void onRequestPermissionsResult(int pedido, String[] permisos, int[] resultados) {
        super.onRequestPermissionsResult(pedido, permisos, resultados);
        if (pedido == PERMISOS_MEDIOS && pedidoMedios != null) {
            PermissionRequest r = pedidoMedios;
            pedidoMedios = null;
            List<String> dar = new ArrayList<>();
            for (String rec : r.getResources()) {
                if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(rec) && tiene(Manifest.permission.CAMERA)) dar.add(rec);
                if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(rec) && tiene(Manifest.permission.RECORD_AUDIO)) dar.add(rec);
            }
            if (dar.isEmpty()) r.deny(); else r.grant(dar.toArray(new String[0]));
        } else if (pedido == PERMISO_UBICACION && alUbicacion != null) {
            boolean si = tiene(Manifest.permission.ACCESS_FINE_LOCATION) || tiene(Manifest.permission.ACCESS_COARSE_LOCATION);
            alUbicacion.invoke(origenUbicacion, si, false);
            alUbicacion = null;
            origenUbicacion = null;
        }
    }

    private boolean tiene(String permiso) {
        return Build.VERSION.SDK_INT < 23 || checkSelfPermission(permiso) == PackageManager.PERMISSION_GRANTED;
    }

    /** ¿Es una dirección de tu sitio (el mismo que abre la app, por https)? */
    private boolean esMio(String url) {
        if (url == null || host == null) return false;
        Uri u = Uri.parse(url);
        return "https".equals(u.getScheme()) && host.equals(u.getHost());
    }

    @Override
    public void onBackPressed() {
        if (pantallaCompleta != null) { web.getWebChromeClient().onHideCustomView(); return; }
        // El libro y el editor saben qué hacer con «atrás» (cerrar un menú, preguntar antes de salir).
        if (web.canGoBack()) { web.goBack(); return; }
        super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        web.saveState(estado);
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    /** Lo que la página puede pedirle al teléfono. */
    private class Puente {
        @JavascriptInterface
        public void guardar(String nombre, String tipo, String base64) {
            if (!esMio(paginaActual)) return;   // sólo tu sitio puede guardar en el teléfono
            String limpio = nombre.replaceAll("[\\\\/:*?\"<>|]", "-");
            try {
                byte[] datos = Base64.decode(base64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, limpio);
                    v.put(MediaStore.Downloads.MIME_TYPE, tipo);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Librito");
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (u == null) throw new Exception("sin sitio");
                    try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(datos); }
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    try (FileOutputStream o = new FileOutputStream(new File(dir, limpio))) { o.write(datos); }
                }
                aviso("Guardado en Descargas: " + limpio);
            } catch (Exception e) {
                aviso("No se pudo guardar " + limpio);
            }
        }
    }

    private void aviso(String t) {
        runOnUiThread(() -> Toast.makeText(this, t, Toast.LENGTH_LONG).show());
    }
}
