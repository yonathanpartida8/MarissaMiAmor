/* Candado: sin la llave del enlace (#k=…) esto se ve vacío. Sólo guarda el hash. */
(function () {
  var H = "e136596a2ce38dfb3b8f7d4d94557f021094aa88016f608ec7aa7bad6b6f8ae1", S = "librito:acceso", d = document.documentElement;
  var ok = function () { d.style.visibility = ""; };
  var no = function () {
    try { window.stop(); } catch (e) {}
    d.innerHTML = '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"></head><body style="margin:0;background:#0a0510;color:#f6e7ef;font:16px system-ui;display:grid;place-items:center;height:100vh;text-align:center">Este librito es privado.<br>Ábrelo con tu enlace.</body>';
    d.style.visibility = "";
  };
  d.style.visibility = "hidden";
  var m = /[#&]k=([\w-]+)/.exec(location.hash), k = m ? m[1] : "", g = ""; try { g = localStorage.getItem(S) || ""; } catch (e) {}
  var hash = function (t) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }); };
  if (!crypto.subtle) { ok(); return; }
  (k ? hash(k) : Promise.resolve(g)).then(function (h) {
    if (h !== H) return no();
    try { localStorage.setItem(S, H); } catch (e) {}
    if (k) history.replaceState(null, "", location.pathname + location.search);
    ok();
  }, no);
})();
