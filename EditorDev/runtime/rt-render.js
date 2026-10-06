/*
 * LIBRITO · cómo se pinta cada cosa
 *
 * Cada elemento es siempre la misma cebolla de cuatro capas:
 *
 *   .rt-el   dónde está, cuánto mide, cuánto gira (lo que se edita)
 *   .rt-ae   la animación de entrada y la de salida
 *   .rt-ab   la animación que se repite (flotar, latir…)
 *   .rt-c    el contenido con su caja (fondo, borde, sombra)
 *
 * Así cada animación mueve su propia capa y ninguna pisa la posición ni el
 * giro que se le puso a mano. Todo con `transform` y `opacity`.
 *
 * El orden de las capas (qué va delante) es `z-index`, no el orden en el
 * DOM: mover un marco <iframe> dentro del DOM lo recarga entero.
 */
(function (RT) {
  "use strict";
  const h = RT.h;
  let cuenta = 0;

  /** ¿Recibe toques en el librito? Lo decorativo deja pasar el dedo. */
  RT.esInteractivo = function (e) {
    if (e.accion && e.accion.tipo) return true;
    if (e.sonidos && e.sonidos.tocar) return true;
    switch (e.tipo) {
      case "boton": case "carrusel": case "pagina": return true;
      case "componente": return !(e.componente && e.componente.decorativo);
      case "escena3d": return !e.escena3d || e.escena3d.orbitar !== false;
      case "album": return !e.album || e.album.ampliar !== false || e.album.disposicion === "pila";
      case "video": return !!(e.video && (e.video.controles || RT.modoVideo(e.video) === "manual"));
      case "html": return !e.html || e.html.interactivo !== false;
      default: return false;
    }
  };

  /* ── Hoja automática (se adapta a cada pantalla) ─────────────────
     Con «Automática», ancho×alto es la ZONA SEGURA del diseño. En cada
     pantalla la hoja crece por un lado (nunca se corta nada: la zona
     segura cabe entera) y cada elemento se queda pegado a su borde: lo de
     arriba arriba, lo de abajo abajo, lo centrado centrado y lo que ocupa
     todo (fondos) se estira. Sin anclas puestas, se deducen solas por
     dónde está. Con un tamaño fijo, nada de esto cambia nada. */
  RT.esAuto = function (aj) { return !!aj && aj.formato === "auto"; };

  RT.medidas = function (aj, vw, vh) {
    aj = aj || {};
    const W0 = aj.ancho || 390, H0 = aj.alto || 844;
    const s = vw > 0 && vh > 0 ? Math.min(vw / W0, vh / H0) : 1;
    if (!RT.esAuto(aj) || !(vw > 0 && vh > 0)) return { W: W0, H: H0, W0: W0, H0: H0, s: s, auto: false };
    return { W: Math.max(W0, Math.round(vw / s)), H: Math.max(H0, Math.round(vh / s)), W0: W0, H0: H0, s: s, auto: true };
  };

  RT.anclaDe = function (e, m) {
    const a = e.ancla || {};
    const W0 = (m && m.W0) || 390, H0 = (m && m.H0) || 844;
    let ah = a.h, av = a.v;
    if (!ah || ah === "auto") {
      const cx = e.x + e.w / 2;
      ah = e.tipo === "pagina" || e.w >= W0 * 0.9 ? "estirar" : cx < W0 / 3 ? "izq" : cx > (W0 * 2) / 3 ? "der" : "centro";
    }
    if (!av || av === "auto") {
      const cy = e.y + e.h / 2;
      av = e.tipo === "pagina" || e.h >= H0 * 0.9 ? "estirar" : cy < H0 / 3 ? "arriba" : cy > (H0 * 2) / 3 ? "abajo" : "centro";
    }
    return { h: ah, v: av };
  };

  /** Dónde se ve un elemento en esta pantalla (en la hoja fija, donde está). */
  RT.colocar = function (e, m) {
    if (!m || !m.auto || (m.W === m.W0 && m.H === m.H0)) return e;
    const dx = m.W - m.W0, dy = m.H - m.H0;
    const a = RT.anclaDe(e, m);
    let x = e.x, y = e.y, w = e.w, h = e.h;
    if (a.h === "der") x += dx; else if (a.h === "centro") x += dx / 2; else if (a.h === "estirar") w += dx;
    if (a.v === "abajo") y += dy; else if (a.v === "centro") y += dy / 2; else if (a.v === "estirar") h += dy;
    return { x: x, y: y, w: w, h: h, rot: e.rot };
  };

  /** Lo contrario: una caja vista en esta pantalla → lo que se guarda. */
  RT.descolocar = function (e, caja, m, ancla) {
    if (!m || !m.auto || (m.W === m.W0 && m.H === m.H0)) return caja;
    const dx = m.W - m.W0, dy = m.H - m.H0;
    const a = ancla || RT.anclaDe(e, m);
    const r = { x: caja.x, y: caja.y, w: caja.w, h: caja.h };
    if (a.h === "der") r.x -= dx; else if (a.h === "centro") r.x -= dx / 2; else if (a.h === "estirar") r.w -= dx;
    if (a.v === "abajo") r.y -= dy; else if (a.v === "centro") r.y -= dy / 2; else if (a.v === "estirar") r.h -= dy;
    return r;
  };

  /* ── Cada tipo ─────────────────────────────────────────────────── */
  const PINTAR = {};

  PINTAR.texto = function (c, e) {
    const t = e.texto || {};
    let b = c.firstChild;
    if (!b || b.className !== "rt-t") { c.textContent = ""; b = h("div", "rt-t", c); }
    b.innerHTML = RT.sanearTexto(t.html);
    const s = b.style;
    s.fontFamily = RT.pilaFuente(t.fuente);
    s.fontSize = RT.num(t.tam, 24) + "px";
    s.fontWeight = t.peso || 400;
    s.fontStyle = t.cursiva ? "italic" : "normal";
    s.textDecoration = t.subrayado ? "underline" : "";
    s.textAlign = t.alin || "center";
    s.color = t.color || "";
    s.letterSpacing = t.interletra ? t.interletra + "px" : "";
    s.lineHeight = RT.num(t.interlinea, 1.3);
    s.textShadow = RT.sombra(t.sombra);
    s.textTransform = t.mayus ? "uppercase" : "";
    // Letras rellenas con un degradado o una imagen.
    s.background = t.relleno || "";
    s.webkitBackgroundClip = s.backgroundClip = t.relleno ? "text" : "";
    s.webkitTextFillColor = t.relleno ? "transparent" : "";
    c.style.justifyContent = t.valin === "centro" ? "center" : t.valin === "abajo" ? "flex-end" : "flex-start";
  };

  function marcoFoto(c, clase) {
    let m = c.firstChild;
    if (!m || m.className !== clase) { c.textContent = ""; m = h("div", clase, c); }
    return m;
  }

  function vacio(c, texto, ctx, e) {
    // Ya está (se repinta mucho al arrastrar): no rehacerlo, que parpadea.
    const ya = c.firstChild;
    if (ya && ya.className === "rt-vacio" && c.childNodes.length === 1 && ya.dataset.t === texto) return;
    c.textContent = "";
    if (ctx.modo !== "editor") return;
    const v = h("div", "rt-vacio", c);
    v.dataset.t = texto;
    v.innerHTML = `<span><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span><b>${texto}</b>`;
    if (ctx.pedir) v.dataset.pedir = e.id;
  }

  PINTAR.imagen = function (c, e, ctx) {
    const im = e.imagen || {};
    const url = im.asset ? ctx.url(im.asset) : null;
    c.classList.remove("rt-polaroid", "rt-cinta", "rt-mf-vintage", "rt-mf-sello", "rt-mf-washi", "rt-mf-doble");
    if (im.marco) c.classList.add(im.marco === "polaroid" ? "rt-polaroid" : im.marco === "cinta" ? "rt-cinta" : "rt-mf-" + im.marco);
    if (!url) { vacio(c, "Añadir foto", ctx, e); return; }
    const m = marcoFoto(c, "rt-foto");
    let img = m.firstChild;
    if (!img) {
      img = h("img", "", m);
      img.decoding = "async"; img.draggable = false; img.alt = "";
      if (ctx.modo === "mini") img.loading = "lazy";
    }
    if (img.getAttribute("src") !== url) img.src = url;
    const r = im.recorte || {};
    const x = RT.num(r.x, 50), y = RT.num(r.y, 50), z = RT.num(r.zoom, 1);
    const s = img.style;
    s.objectFit = im.ajuste || "cover";
    s.objectPosition = `${x}% ${y}%`;
    s.transformOrigin = `${x}% ${y}%`;
    s.transform = z !== 1 ? `scale(${z})` : "";
    s.filter = RT.filtro(im.filtro);
    RT.mascara(m, im.forma);
    m.style.borderRadius = im.forma === "circulo" ? "50%" : "";
  };

  function gradienteSvg(id, g) {
    const ang = (RT.num(g.angulo, 160) * Math.PI) / 180;
    const sx = Math.sin(ang) / 2, sy = -Math.cos(ang) / 2;
    return `<defs><linearGradient id="${id}" x1="${0.5 - sx}" y1="${0.5 - sy}" x2="${0.5 + sx}" y2="${0.5 + sy}">`
      + `<stop offset="0" stop-color="${g.a}"/><stop offset="1" stop-color="${g.b}"/></linearGradient></defs>`;
  }

  PINTAR.forma = function (c, e) {
    const f = e.forma || {};
    const fig = f.figura || "rect";
    c.textContent = "";
    c.style.background = c.style.border = "";
    if (fig === "rect" || fig === "circulo") {
      const caja = h("div", "rt-figura", c);
      caja.style.background = f.gradiente ? RT.gradiente(f.gradiente) : f.relleno || "transparent";
      caja.style.border = f.grosor > 0 ? `${f.grosor}px solid ${f.trazo || "#000"}` : "";
      const rr = e.caja && e.caja.radio;
      caja.style.borderRadius = fig === "circulo" ? "50%" : rr ? (typeof rr === "string" ? rr : rr + "px") : "";
      return;
    }
    if (fig === "linea") {
      const l = h("div", "rt-linea", c);
      l.style.height = Math.max(1, RT.num(f.grosor, 3)) + "px";
      l.style.background = f.gradiente ? RT.gradiente(f.gradiente) : f.relleno || f.trazo || "#000";
      l.style.borderRadius = f.redondo ? "99px" : "";
      return;
    }
    const d = RT.FIGURAS[fig] || RT.FIGURAS.corazon;
    const id = "rtg" + ++cuenta;
    const relleno = f.gradiente ? `url(#${id})` : f.relleno || "transparent";
    c.innerHTML = `<svg class="rt-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${f.gradiente ? gradienteSvg(id, f.gradiente) : ""}`
      + `<path d="${d}" fill="${relleno}" stroke="${f.grosor > 0 ? f.trazo || "#000" : "none"}" stroke-width="${RT.num(f.grosor, 0)}" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
  };

  const svgLimpio = new Map();
  PINTAR.dibujo = function (c, e) {
    const d = e.dibujo || {};
    let limpio = svgLimpio.get(d.svg);
    if (limpio == null) { limpio = RT.sanearSvg(d.svg); if (svgLimpio.size > 300) svgLimpio.clear(); svgLimpio.set(d.svg, limpio); }
    c.innerHTML = limpio;
    c.style.color = d.color || "";
    const svg = c.firstChild;
    if (svg && svg.setAttribute) {
      svg.setAttribute("class", "rt-svg");
      if (d.estirar) svg.setAttribute("preserveAspectRatio", "none");
    }
  };

  PINTAR.trazo = function (c, e) {
    const t = e.trazo || {};
    c.innerHTML = `<svg class="rt-svg" viewBox="0 0 ${RT.num(t.vw, 100)} ${RT.num(t.vh, 100)}" preserveAspectRatio="none">`
      + `<path d="${String(t.d || "").replace(/[^MLQCZmlqcz0-9.,\s-]/g, "")}" fill="none" stroke="${t.color || "#e0457f"}" stroke-width="${RT.num(t.grosor, 4)}"`
      + ` stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  };

  PINTAR.boton = function (c, e, ctx) {
    const b = e.boton || {};
    let n = c.firstChild;
    if (!n || n.tagName !== "BUTTON") { c.textContent = ""; n = h("button", "", c); n.type = "button"; }
    n.className = "rt-boton rt-b-" + (b.estilo || "relleno");
    n.textContent = b.texto || "Botón";
    const s = n.style;
    s.fontFamily = RT.pilaFuente(b.fuente);
    s.fontSize = RT.num(b.tam, 18) + "px";
    s.fontWeight = b.peso || 500;
    s.color = b.color || "";
    s.setProperty("--rt-b", b.fondo || "#e0457f");
    s.borderRadius = RT.num(b.radio, 999) + "px";
    n.tabIndex = ctx.modo === "vista" ? 0 : -1;
  };

  /** «auto» (empieza solo al llegar) o «manual» (se toca para verlo). */
  RT.modoVideo = function (v) { return v && (v.modo || (v.auto ? "auto" : "manual")); };
  RT.MARCOS_VIDEO = { ninguno: "Sin marco", polaroid: "Polaroid", redondo: "Redondeado", cine: "Cine", neon: "Neón", cinta: "Con cinta", tele: "Tele antigua" };

  /**
   * Un vídeo con su marco y, si se pide, un resplandor detrás hecho con sus
   * propios colores (un lienzo chiquito de 24×14 que se agranda borroso:
   * casi no cuesta). En modo manual se toca para reproducir o pausar.
   */
  PINTAR.video = function (c, e, ctx) {
    const v = e.video || {};
    const url = v.asset ? ctx.url(v.asset) : null;
    if (!url) { vacio(c, "Añadir vídeo", ctx, e); return; }
    if (ctx.modo === "mini") { c.innerHTML = '<div class="rt-marcador">▶</div>'; return; }
    let w = c.firstChild;
    if (!w || !w.classList || !w.classList.contains("rt-vwrap")) {
      c.textContent = ""; w = h("div", "rt-vwrap", c);
      const n = h("video", "rt-vid", w);
      n.setAttribute("playsinline", ""); n.playsInline = true; n.preload = "metadata";
    }
    const n = w.querySelector("video");
    const marco = RT.MARCOS_VIDEO[v.marco] ? v.marco : "ninguno";
    w.className = "rt-vwrap rt-vm-" + marco;
    n.muted = ctx.modo !== "vista" || !!v.silencio;
    n.loop = !!v.bucle;
    n.controls = ctx.modo === "vista" && !!v.controles;
    n.style.objectFit = v.ajuste || "cover";
    if (n.getAttribute("src") !== url) n.src = url;
    const modo = RT.modoVideo(v);
    // Botón grande de reproducir (modo manual, sin controles del sistema).
    let b = w.querySelector(".rt-vid-play");
    if (ctx.modo === "vista" && modo === "manual" && !v.controles) {
      if (!b) {
        b = h("button", "rt-vid-play", w); b.type = "button"; b.setAttribute("aria-label", "Reproducir");
        w.addEventListener("click", function (ev) { ev.stopPropagation(); if (n.paused) n.play().catch(function () {}); else n.pause(); });
        n.addEventListener("play", function () { w.classList.add("sonando"); });
        n.addEventListener("pause", function () { w.classList.remove("sonando"); });
      }
    } else if (b) b.remove();
    if (ctx.modo !== "vista" && !n.paused) n.pause();
    // Resplandor con los colores del vídeo.
    const amb = Math.max(0, Math.min(1, +v.ambiente || 0));
    let cv = w.querySelector(".rt-vamb");
    let parar = null;
    if (amb > 0) {
      if (!cv) { cv = document.createElement("canvas"); cv.className = "rt-vamb"; cv.width = 24; cv.height = 14; w.insertBefore(cv, w.firstChild); }
      w.style.setProperty("--rt-amb", String(amb));
      const g = cv.getContext("2d");
      let t = 0, vivo = true, leer = true;
      const pintar = function () {
        if (!vivo || n.readyState < 2) return;
        try { g.drawImage(n, 0, 0, 24, 14); } catch (err) { return; }
        if (leer) {
          try {
            const d = g.getImageData(0, 0, 24, 14).data;
            let r = 0, gg = 0, bb = 0;
            for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; }
            const k = d.length / 4;
            w.style.setProperty("--rt-vcolor", "rgb(" + Math.round(r / k) + "," + Math.round(gg / k) + "," + Math.round(bb / k) + ")");
          } catch (err) { leer = false; } // un vídeo de otro sitio no deja leer sus colores (pero sí verse)
        }
      };
      const bucle = function () { if (!vivo) return; pintar(); t = setTimeout(bucle, n.paused ? 900 : 220); };
      if (n.readyState >= 2) bucle(); else n.addEventListener("loadeddata", function () { if (ctx.modo !== "vista" && n.currentTime < 0.05) { try { n.currentTime = 0.1; } catch (err) { /* nada */ } } bucle(); }, { once: true });
      n.addEventListener("seeked", pintar);
      parar = function () { vivo = false; clearTimeout(t); n.removeEventListener("seeked", pintar); };
    } else if (cv) { cv.remove(); w.style.removeProperty("--rt-vcolor"); }
    if (ctx.modo === "vista" && modo === "auto" && ctx.activo && !RT.inicioDe(e)) n.play().catch(function () {});
    return parar ? { destruir: parar } : null;
  };

  /* El HTML libre va SIEMPRE en su marco aislado: sin acceso al librito.
     Se acepta un trozo (se envuelve) o un documento entero tal cual
     (<!DOCTYPE>, <html>, <head>, <style>, <script>, <body>…). Al principio
     se le pone un «puente» chiquito para que lo que el aislamiento no deja
     (localStorage, cookies) no rompa sus scripts: guardan en memoria. */
  const PUENTE = "<script>(function(){function M(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}"
    + "['localStorage','sessionStorage'].forEach(function(n){try{window[n].getItem('x')}catch(e){try{Object.defineProperty(window,n,{value:M(),configurable:true})}catch(x){}}});"
    + "try{document.cookie}catch(e){try{var c='';Object.defineProperty(document,'cookie',{get:function(){return c},set:function(v){c=String(v).split(';')[0]},configurable:true})}catch(x){}}})();<\/script>";
  RT.esDocumento = function (codigo) { return /^\s*(<!--[\s\S]*?-->\s*)*<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(String(codigo || "")); };
  RT.envolverHtml = function (codigo) {
    codigo = String(codigo || "");
    if (RT.esDocumento(codigo)) {
      if (/<head[^>]*>/i.test(codigo)) return codigo.replace(/<head[^>]*>/i, (m) => m + PUENTE);
      if (/<html[^>]*>/i.test(codigo)) return codigo.replace(/<html[^>]*>/i, (m) => m + "<head>" + PUENTE + "</head>");
      return PUENTE + codigo;
    }
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + PUENTE
      + "<style>html,body{margin:0;height:100%;background:transparent;font-family:system-ui,sans-serif;overflow:hidden;-webkit-text-size-adjust:100%}</style>"
      + "</head><body>" + codigo + "</body></html>";
  };

  /* Los archivos que pide un HTML pegado («foto.jpg», «musica.mp3»…) y que se
     subieron al editor: se cambian por su dirección de verdad. En el editor
     son `data:` (un marco aislado no puede abrir las `blob:` del editor). */
  const escaparRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  RT.conArchivos = function (codigo, archivos, ctx) {
    codigo = String(codigo || "");
    if (!archivos || !ctx) return codigo;
    for (const nombre in archivos) {
      const id = archivos[nombre];
      let u = (ctx.urlDatos && ctx.urlDatos(id)) || (ctx.url && ctx.url(id));
      if (!u) continue;
      if (!/^(data:|https?:|blob:)/i.test(u)) { try { u = new URL(u, location.href).href; } catch (err) { /* se deja */ } }
      const re = new RegExp(`(["'(=\\s])(?:\\./)?${escaparRe(nombre)}(?=["')\\s?#>])`, "g");
      codigo = codigo.replace(re, (m, a) => a + u);
    }
    return codigo;
  };

  PINTAR.html = function (c, e, ctx) {
    const x = e.html || {};
    if (ctx.modo === "mini") { c.innerHTML = '<div class="rt-marcador">&lt;/&gt;</div>'; return; }
    // Una página HTML recién creada (todavía sin código): en el editor, «pega aquí».
    if (!String(x.codigo || "").trim()) { vacio(c, "Toca dos veces y pega tu HTML", ctx, e); return; }
    let f = c.firstChild;
    if (!f || f.tagName !== "IFRAME") {
      c.textContent = ""; f = h("iframe", "rt-marco", c);
      f.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock");
      f.setAttribute("allow", "autoplay; fullscreen; accelerometer; gyroscope");
      f.setAttribute("loading", ctx.modo === "vista" ? "eager" : "lazy");
      f.setAttribute("title", e.nombre || "HTML");
    }
    const doc = RT.envolverHtml(RT.conArchivos(x.codigo, x.archivos, ctx));
    if (f._doc !== doc) { f._doc = doc; f.srcdoc = doc; }
  };

  /* Una página HTML tuya, tal cual, con todo su JavaScript. Si se sacaron
     de ella textos o fotos para editarlos encima, el original de cada uno
     se esconde aquí dentro (sin moverlo, para que nada salte de sitio). */
  PINTAR.pagina = function (c, e, ctx) {
    const p = e.pagina || {};
    if (ctx.modo === "mini" || !p.ruta) { c.innerHTML = `<div class="rt-marcador rt-marcador-pag">${p.titulo || "Página original"}</div>`; return; }
    let f = c.firstChild;
    const url = ctx.ruta ? ctx.ruta(p.ruta) : p.ruta;
    if (!f || f.tagName !== "IFRAME") {
      c.textContent = ""; f = h("iframe", "rt-marco", c);
      f.setAttribute("allow", "autoplay *; fullscreen *; accelerometer *; gyroscope *");
      f.setAttribute("title", p.titulo || "Página");
      f.addEventListener("load", function () { ocultarEn(f); });
    }
    if (f._url !== url) { f._url = url; f.src = url; }
    ocultarEn(f);
  };

  /* ── Componentes de assets/ ─────────────────────────────────────
     Su HTML no se toca NUNCA: se abre tal cual en su marco, con sus rutas,
     estilos, scripts y sonidos. Lo único que pone el librito es dónde va,
     de qué tamaño (se escala entero, como una foto) y sus parámetros, que
     viajan en la dirección (?p=…). «Eliminar fondo» sólo existe si se pide,
     y sólo afecta a esta copia en la página. */
  RT.urlComponente = function (e, ctx) {
    const k = e.componente || {};
    let url = ctx.ruta ? ctx.ruta(k.ruta + (k.entrada || "index.html")) : k.ruta + (k.entrada || "index.html");
    const p = {};
    for (const def of k.parametros || []) {
      let v = k.params && k.params[def.id] != null ? k.params[def.id] : def.def;
      if (v == null || v === "") continue;
      if ((def.tipo === "imagen" || def.tipo === "audio") && ctx.url) {
        const u = ctx.url(v);
        if (!u) continue;
        try { v = new URL(u, location.href).href; } catch (err) { v = u; }
      }
      p[def.id] = v;
    }
    if (Object.keys(p).length) url += (url.indexOf("?") < 0 ? "?" : "&") + "p=" + encodeURIComponent(JSON.stringify(p));
    return url;
  };

  /** Las zonas → `path()` de CSS (para dejar pasar los toques fuera del contenido). */
  RT.rutaZonas = function (zonas) {
    return zonas.map((z) => `M${z.x} ${z.y}h${z.w}v${z.h}h${-z.w}Z`).join("");
  };

  RT.tamComponente = function (n, e) {
    const k = e.componente || {};
    const b = n._rt.caja || e;
    const caja = n._rt.c.firstChild;
    if (!caja || caja.className !== "rt-comp") return;
    const f = caja.firstChild;
    if (k.ajuste === "adaptar") {
      caja.style.cssText = "position:absolute;inset:0";
      f.style.width = f.style.height = "100%";
    } else {
      const W = k.ancho || b.w, H = k.alto || b.h;
      caja.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transform:scale(${b.w / W},${b.h / H})`;
      f.style.width = W + "px"; f.style.height = H + "px";
    }
    // «Dejar pasar los toques fuera de lo que se ve»: sólo recorta lo transparente
    // (el fondo, si lo tiene y no se quitó, cuenta como parte de lo que se ve).
    const an = k.analisis;
    const zonas = k.recorte && an && (an.interactivos || []).concat(an.visual || [], k.sinFondo ? [] : (an.fondo || []).filter((z) => z.w));
    caja.style.clipPath = zonas && zonas.length ? `path("${RT.rutaZonas(zonas)}")` : "";
  };

  PINTAR.componente = function (c, e, ctx, n) {
    const k = e.componente || {};
    if (!k.ruta) { c.textContent = ""; return; }
    if (ctx.modo === "mini") {
      c.innerHTML = k.miniatura && ctx.ruta ? `<img class="rt-comp-mini" alt="" loading="lazy" src="${ctx.ruta(k.miniatura)}">` : `<div class="rt-marcador">✿</div>`;
      return;
    }
    let caja = c.firstChild;
    if (!caja || caja.className !== "rt-comp") {
      c.textContent = "";
      caja = h("div", "rt-comp", c);
      const f = h("iframe", "rt-marco", caja);
      f.setAttribute("allow", "autoplay *; fullscreen *");
      f.setAttribute("title", e.nombre || "Componente");
      if (k.aislado) f.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-modals");
      f.addEventListener("load", function () { RT.prepararComponente(f, n._rt.e || e, ctx); });
    }
    const f = caja.firstChild;
    f._e = e;
    const url = RT.urlComponente(e, ctx);
    if (f._url !== url) { f._url = url; f.src = url; }
    RT.prepararComponente(f, e, ctx);
  };

  /** Lo que el librito añade a la copia: sólo si se pidió (fondo) o para escuchar (sonido). */
  RT.prepararComponente = function (f, e, ctx) {
    let doc = null;
    try { doc = f.contentDocument; } catch (err) { doc = null; }
    if (!doc || !doc.documentElement) return;
    f._e = e;
    const k = e.componente || {};
    let st = doc.getElementById("rt-sin-fondo");
    const css = k.sinFondo ? RT.cssSinFondo(k.analisis) : "";
    if (css) {
      if (!st) { st = doc.createElement("style"); st.id = "rt-sin-fondo"; (doc.head || doc.documentElement).appendChild(st); }
      if (st.textContent !== css) st.textContent = css;
    } else if (st) st.remove();
    if (ctx.modo === "vista" && ctx.sonido && !f._escucha) {
      f._escucha = true;
      doc.addEventListener("pointerdown", function () {
        const s = f._e && f._e.sonidos;
        if (s && s.tocar) ctx.sonido(s.tocar, s.volumen);
      }, true);
    }
  };

  RT.cssSinFondo = function (an) {
    let css = "html,body{background:transparent!important;background-image:none!important}";
    for (const z of (an && an.fondo) || []) css += (OCULTAR[z.modo] || OCULTAR.caja)(z.sel);
    return css;
  };

  function ocultarEn(f) {
    let doc = null;
    try { doc = f.contentDocument; } catch (err) { doc = null; }
    if (!doc || !doc.head) return;
    let st = doc.getElementById("rt-ocultos");
    if (!st) { st = doc.createElement("style"); st.id = "rt-ocultos"; doc.head.appendChild(st); }
    const css = f._ocultos || "";
    if (st.textContent !== css) st.textContent = css;
  }
  RT.ocultarEn = ocultarEn;

  /* ── Elemento ─────────────────────────────────────────────────── */
  RT.crearEl = function (e, ctx) {
    const n = h("div", "rt-el");
    n.dataset.id = e.id;
    const ae = h("div", "rt-ae", n);
    const ab = h("div", "rt-ab", ae);
    const c = h("div", "rt-c", ab);
    n._rt = { ae: ae, ab: ab, c: c, firma: null, tipo: e.tipo, e: e };
    if (ctx.modo === "vista") {
      // Tocar: su sonido y su acción (la del botón o la de cualquier elemento).
      n.addEventListener("pointerdown", function () {
        const x = n._rt.e, s = x.sonidos;
        if (s && s.tocar && ctx.sonido && x.tipo !== "componente") ctx.sonido(s.tocar, s.volumen);
      });
      // Un toque = una acción: un doble toque rápido no pasa dos páginas.
      let ultimo = 0;
      n.addEventListener("click", function (ev) {
        const x = n._rt.e;
        if (!(x.accion && x.accion.tipo && ctx.accion)) return;
        ev.stopPropagation();
        const ahora = performance.now();
        if (ahora - ultimo < 380) return;
        ultimo = ahora;
        ctx.accion(x.accion, x);
      });
      n.addEventListener("keydown", function (ev) {
        const x = n._rt.e;
        if ((ev.key === "Enter" || ev.key === " ") && x.accion && x.accion.tipo && ev.target === n) { ev.preventDefault(); n.click(); }
      });
    }
    RT.actualizarEl(n, e, ctx);
    return n;
  };

  RT.actualizarEl = function (n, e, ctx, z) {
    const r = n._rt;
    r.e = e;
    if (r.tipo !== e.tipo) { r.c.textContent = ""; r.c.className = "rt-c"; r.firma = null; r.tipo = e.tipo; }
    // «Permitir interacción» apagado: en el librito no recibe toques.
    const toca = RT.esInteractivo(e) && !(e.permisos && e.permisos.interactuar === false);
    const accion = ctx.modo === "vista" && !!(e.accion && e.accion.tipo);
    if (accion && e.tipo !== "boton") { n.tabIndex = 0; n.setAttribute("role", "button"); if (e.nombre) n.setAttribute("aria-label", e.nombre); }
    const cls = "rt-el rt-e-" + e.tipo + (toca ? " rt-toca" : "") + (accion ? " rt-accion" : "") + (e.permisos && e.permisos.interactuar === false ? " rt-sin-toque" : "") + (ctx.modo === "editor" && e.inicioOculto ? " rt-escondido" : "") + (n._rt.extra || "");
    if (n.className !== cls) n.className = cls;
    const b = RT.colocar(e, ctx.medidas);
    r.caja = b;
    const s = n.style;
    s.left = b.x + "px"; s.top = b.y + "px";
    s.width = Math.max(1, b.w) + "px"; s.height = Math.max(1, b.h) + "px";
    s.transform = e.rot ? `rotate(${e.rot}deg)` : "";
    s.opacity = e.opacidad == null || e.opacidad === 1 ? "" : e.opacidad;
    // «Empieza escondido»: en el librito no se ve hasta que una acción lo muestra.
    s.display = e.oculto || (ctx.modo === "vista" && e.inicioOculto && !r.revelado) ? "none" : "";
    if (z != null) s.zIndex = z;
    s.mixBlendMode = e.mezcla || "";
    RT.aplicarCaja(r.c, e.caja);
    r.c.style.filter = RT.efectos(e.efectos);
    if (e.tipo === "texto") r.c.classList.add("rt-flex");
    const datos = e[e.tipo];
    const firma = JSON.stringify(datos || null) + (e.tipo === "forma" ? JSON.stringify(e.caja && e.caja.radio) : "");
    if (firma !== r.firma || e.tipo === "imagen" || e.tipo === "video") {
      r.firma = firma;
      if (r.vida) { r.vida.destruir(); r.vida = null; }
      const pintor = PINTAR[e.tipo] || RT.componentes && RT.componentes[e.tipo];
      if (pintor) r.vida = pintor(r.c, e, ctx, n) || null;
      if (r.vida && typeof r.vida.destruir !== "function") r.vida = null;
    }
    if (e.tipo === "componente") RT.tamComponente(n, e);
    if (e.tipo === "pagina") { const f = r.c.firstChild; if (f && f.tagName === "IFRAME") { f._ocultos = ctx.ocultos ? ctx.ocultos(e) : ""; ocultarEn(f); } }
  };

  RT.destruirEl = function (n) {
    const r = n._rt;
    if (r && r.vida) { r.vida.destruir(); r.vida = null; }
    const v = n.querySelector("video");
    if (v) { v.pause(); v.removeAttribute("src"); try { v.load(); } catch (err) { /* nada */ } }
    n.remove();
  };

  /* ── Fondo de página ──────────────────────────────────────────── */
  RT.pintarFondo = function (n, f, ctx) {
    f = f || {};
    const s = n.style;
    s.background = f.css ? f.css : f.tipo === "gradiente" ? RT.gradiente(f.gradiente) : f.color || "#fff";
    if (f.tipo === "gradiente" || f.css) s.backgroundColor = f.color || "";
    pintarFondoHtml(n, f.html, ctx);
    let im = n.querySelector(":scope > .rt-fondo-img");
    const url = f.imagen && f.imagen.asset ? ctx.url(f.imagen.asset) : null;
    if (!url) { if (im) im.remove(); return; }
    if (!im) im = h("div", "rt-fondo-img", n);
    const i = f.imagen;
    im.style.backgroundImage = `url("${url}")`;
    im.style.backgroundSize = i.ajuste === "contain" ? "contain" : i.ajuste === "mosaico" ? "auto" : "cover";
    im.style.backgroundRepeat = i.ajuste === "mosaico" ? "repeat" : "no-repeat";
    im.style.backgroundPosition = i.pos || "center";
    im.style.opacity = RT.num(i.opacidad, 1);
    im.style.filter = i.desenfoque ? `blur(${i.desenfoque}px)` : "";
    im.style.transform = i.desenfoque ? "scale(1.06)" : "";
  };

  /* Fondo con HTML (partículas, degradados vivos, canvas…): va en su marco,
     DETRÁS de todo lo de la página y sin recibir toques en el editor (nunca
     estorba al elegir o mover). En el librito puede ser tocable si se pide.
       { codigo }  lo pegado: aislado, como cualquier HTML
       { ruta }    una carpeta de assets/fondos/ (con sus css, js, imágenes) */
  function pintarFondoHtml(n, fh, ctx) {
    let f = n.querySelector(":scope > .rt-fondo-html");
    const hay = fh && (String(fh.codigo || "").trim() || fh.ruta) && ctx.modo !== "mini";
    const pag = n.parentNode;
    if (pag && pag.classList) pag.classList.toggle("rt-fondo-vivo", !!(hay && ctx.modo === "vista" && fh.interactivo));
    if (!hay) { if (f) f.remove(); return; }
    const modo = fh.ruta ? "ruta" : "codigo";
    if (f && f._modo !== modo) { f.remove(); f = null; }
    if (!f) {
      f = document.createElement("iframe");
      f.className = "rt-fondo-html";
      f._modo = modo;
      f.setAttribute("title", "Fondo");
      f.setAttribute("tabindex", "-1");
      f.setAttribute("allow", "autoplay; accelerometer; gyroscope");
      if (modo === "codigo") f.setAttribute("sandbox", "allow-scripts");
      if (ctx.modo !== "vista") f.setAttribute("loading", "lazy");
      n.insertBefore(f, n.firstChild);
    }
    if (modo === "ruta") {
      const url = ctx.ruta ? ctx.ruta(fh.ruta) : fh.ruta;
      if (f._url !== url) { f._url = url; f.src = url; }
    } else {
      const doc = RT.envolverHtml(RT.conArchivos(fh.codigo, fh.archivos, ctx));
      if (f._doc !== doc) { f._doc = doc; f.srcdoc = doc; }
    }
    f.classList.toggle("rt-toca-fondo", ctx.modo === "vista" && !!fh.interactivo);
  }

  /* Lo que se sacó a capas se esconde en el original, y SÓLO esa parte:
       todo   la foto, el dibujo (visibility: hidden, sin mover nada)
       texto  sólo las letras (lo de dentro que se toca sigue ahí)
       caja   sólo el fondo, el borde y la sombra (sus hijos se siguen viendo) */
  const OCULTAR = {
    todo: (s) => `${s}{visibility:hidden!important}`,
    texto: (s) => `${s},${s} *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}`,
    caja: (s) => `${s}{background:none!important;border-color:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;outline:none!important}`,
  };
  RT.ocultosDe = function (pagina) {
    const m = {};
    for (const e of pagina.els || []) {
      const o = e.origen;
      if (!o || !o.de || !o.sel) continue;
      m[o.de] = (m[o.de] || "") + (OCULTAR[o.modo] || OCULTAR.todo)(o.sel) + "\n";
    }
    return m;
  };

  /* ── Página ───────────────────────────────────────────────────── */
  RT.Pagina = class {
    constructor(pagina, ctx, ancho, alto) {
      this.ctx = ctx;
      this.nodo = h("div", "rt-pagina rt-modo-" + ctx.modo);
      this.nodo.style.width = ancho + "px";
      this.nodo.style.height = alto + "px";
      this.ancho = ancho; this.alto = alto;
      this.fondo = h("div", "rt-fondo", this.nodo);
      this.capa = h("div", "rt-capa", this.nodo);
      this.nodos = new Map();
      this.sincronizar(pagina);
    }

    sincronizar(pagina) {
      this.pagina = pagina;
      const ctx = this.ctx;
      const ocultos = RT.ocultosDe(pagina);
      ctx.ocultos = (e) => ocultos[e.id] || "";
      RT.pintarFondo(this.fondo, pagina.fondo, ctx);
      const vivos = new Set();
      const els = pagina.els || [];
      for (let i = 0; i < els.length; i++) {
        const e = els[i];
        vivos.add(e.id);
        let n = this.nodos.get(e.id);
        if (!n) { n = RT.crearEl(e, ctx); n.style.zIndex = i + 1; this.capa.appendChild(n); this.nodos.set(e.id, n); }
        else RT.actualizarEl(n, e, ctx, i + 1);
      }
      for (const [id, n] of this.nodos) if (!vivos.has(id)) { RT.destruirEl(n); this.nodos.delete(id); }
    }

    /** Otra pantalla (hoja automática): mismo contenido, recolocado. */
    redimensionar(ancho, alto) {
      if (ancho === this.ancho && alto === this.alto) return;
      this.ancho = ancho; this.alto = alto;
      this.nodo.style.width = ancho + "px";
      this.nodo.style.height = alto + "px";
      for (const e of this.pagina.els || []) { const n = this.nodos.get(e.id); if (n) RT.actualizarEl(n, e, this.ctx); }
    }

    /** Sólo un elemento (lo que se usa mientras se arrastra). */
    actualizar(e) {
      const n = this.nodos.get(e.id);
      if (n) RT.actualizarEl(n, e, this.ctx);
    }

    destruir() {
      for (const n of this.nodos.values()) RT.destruirEl(n);
      this.nodos.clear();
      this.nodo.remove();
    }
  };
})(window.LibritoRT = window.LibritoRT || {});
