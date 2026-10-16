/*
 * VISOR DE LO PUBLICADO — sólo va en los libritos publicados (no en el editor
 * ni en el .zip normal). Lo hace sentir como una app:
 *   · una carga bonita (un corazón que late) hasta que aparece la primera página;
 *   · un botón de pantalla completa que aparece al tocar y se esconde solo
 *     (también con la tecla F); en iPhone, donde Safari no deja, una nota
 *     de una vez: «Compartir → Agregar a inicio» (y se abre a pantalla completa);
 *   · la pantalla no se apaga mientras se lee.
 * Es SÓLO para ver: lo publicado no trae el proyecto editable.
 */
(function () {
  "use strict";
  var d = document, raiz = d.documentElement;

  /* 1 · La carga */
  var carga = d.getElementById("visor-carga");
  function quitarCarga() {
    if (!carga) return;
    var c = carga; carga = null;
    c.classList.add("fuera");
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 700);
  }
  var lib = d.getElementById("librito");
  if (lib && carga && window.MutationObserver) {
    var mo = new MutationObserver(function () {
      if (lib.children.length && lib.querySelector("img, canvas, video, iframe, svg, p, h1, h2, div div")) { mo.disconnect(); setTimeout(quitarCarga, 280); }
    });
    mo.observe(lib, { childList: true, subtree: true });
  }
  addEventListener("load", function () { setTimeout(quitarCarga, 1200); });
  setTimeout(quitarCarga, 7000);

  /* 2 · Pantalla completa */
  var pedirPC = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
  var salirPC = d.exitFullscreen || d.webkitExitFullscreen;
  var dentro = function () { return !!(d.fullscreenElement || d.webkitFullscreenElement); };
  var instalada = (window.matchMedia && matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches) || navigator.standalone;
  var ICONO_ENTRAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/></svg>';
  var ICONO_SALIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v4a1 1 0 0 1-1 1H4M15 4v4a1 1 0 0 0 1 1h4M9 20v-4a1 1 0 0 0-1-1H4M15 20v-4a1 1 0 0 1 1-1h4"/></svg>';

  if (pedirPC && !instalada) {
    var b = d.createElement("button");
    b.type = "button";
    b.className = "visor-pc";
    var pintar = function () {
      var en = dentro();
      b.innerHTML = en ? ICONO_SALIR : ICONO_ENTRAR;
      b.setAttribute("aria-label", en ? "Salir de pantalla completa" : "Pantalla completa");
      b.title = b.getAttribute("aria-label") + " (F)";
    };
    pintar();
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      try {
        if (dentro()) salirPC.call(d);
        else { var p = pedirPC.call(raiz, { navigationUI: "hide" }); if (p && p.catch) p.catch(function () {}); }
      } catch (err) { /* el navegador no quiso */ }
    });
    b.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    d.body.appendChild(b);
    var t = 0;
    var mostrar = function () { b.classList.add("ver"); clearTimeout(t); t = setTimeout(function () { b.classList.remove("ver"); }, 2600); };
    ["pointerdown", "pointermove", "keydown"].forEach(function (n) { addEventListener(n, mostrar, { passive: true, capture: true }); });
    d.addEventListener("fullscreenchange", pintar);
    d.addEventListener("webkitfullscreenchange", pintar);
    addEventListener("keydown", function (e) {
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(input|textarea|select)$/i.test((e.target && e.target.tagName) || "")) b.click();
    });
    setTimeout(mostrar, 900);
  } else if (!instalada && /iPhone|iPod/.test(navigator.userAgent)) {
    // iPhone: Safari no deja pantalla completa a una página; agregada al inicio, sí.
    var vista = false;
    try { vista = localStorage.getItem("visor:nota-inicio") === "1"; localStorage.setItem("visor:nota-inicio", "1"); } catch (e) { vista = true; }
    if (!vista) setTimeout(function () {
      var n = d.createElement("div");
      n.className = "visor-nota";
      n.textContent = "Para verlo a pantalla completa: Compartir → «Agregar a inicio».";
      n.addEventListener("click", function () { n.classList.remove("ver"); });
      d.body.appendChild(n);
      requestAnimationFrame(function () { n.classList.add("ver"); });
      setTimeout(function () { n.classList.remove("ver"); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 500); }, 6500);
    }, 2500);
  }

  /* 3 · Que la pantalla no se apague mientras se lee */
  var despierta = null;
  function mantener() {
    if (!navigator.wakeLock || d.visibilityState !== "visible" || despierta) return;
    navigator.wakeLock.request("screen").then(function (x) {
      despierta = x;
      x.addEventListener && x.addEventListener("release", function () { despierta = null; });
    }).catch(function () {});
  }
  d.addEventListener("visibilitychange", mantener);
  addEventListener("pointerdown", mantener, { once: true, passive: true });
  mantener();
})();
