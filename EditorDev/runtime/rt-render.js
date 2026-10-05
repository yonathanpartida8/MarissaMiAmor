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
      case "album": return !e.album || e.album.ampliar !== false || e.album.disposicion === "pila";
      case "video": return !!(e.video && e.video.controles);
      case "html": return !e.html || e.html.interactivo !== false;
      default: return false;
    }
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
    c.textContent = "";
    if (ctx.modo !== "editor") return;
    const v = h("div", "rt-vacio", c);
    v.innerHTML = `<span>＋</span><b>${texto}</b>`;
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

  PINTAR.video = function (c, e, ctx) {
    const v = e.video || {};
    const url = v.asset ? ctx.url(v.asset) : null;
    if (!url) { vacio(c, "Añadir vídeo", ctx, e); return; }
    if (ctx.modo === "mini") { c.innerHTML = '<div class="rt-marcador">▶</div>'; return; }
    let n = c.firstChild;
    if (!n || n.tagName !== "VIDEO") {
      c.textContent = ""; n = h("video", "rt-vid", c);
      n.setAttribute("playsinline", ""); n.playsInline = true; n.preload = "metadata";
    }
    n.muted = ctx.modo !== "vista" || !!v.silencio;
    n.loop = !!v.bucle;
    n.controls = ctx.modo === "vista" && !!v.controles;
    n.style.objectFit = v.ajuste || "cover";
    if (n.getAttribute("src") !== url) n.src = url;
    if (ctx.modo === "vista" && v.auto && ctx.activo) n.play().catch(function () {});
  };

  /** El HTML libre va SIEMPRE en su marco aislado: sin acceso al librito. */
  RT.envolverHtml = function (codigo) {
    codigo = String(codigo || "");
    if (/<html[\s>]|<body[\s>]/i.test(codigo)) return codigo;
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + "<style>html,body{margin:0;height:100%;background:transparent;font-family:system-ui,sans-serif;overflow:hidden;-webkit-text-size-adjust:100%}</style>"
      + "</head><body>" + codigo + "</body></html>";
  };

  PINTAR.html = function (c, e, ctx) {
    const x = e.html || {};
    if (ctx.modo === "mini") { c.innerHTML = '<div class="rt-marcador">&lt;/&gt;</div>'; return; }
    let f = c.firstChild;
    if (!f || f.tagName !== "IFRAME") {
      c.textContent = ""; f = h("iframe", "rt-marco", c);
      f.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock");
      f.setAttribute("allow", "autoplay; fullscreen");
      f.setAttribute("title", e.nombre || "HTML");
    }
    const doc = RT.envolverHtml(x.codigo);
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
    const caja = n._rt.c.firstChild;
    if (!caja || caja.className !== "rt-comp") return;
    const f = caja.firstChild;
    if (k.ajuste === "adaptar") {
      caja.style.cssText = "position:absolute;inset:0";
      f.style.width = f.style.height = "100%";
    } else {
      const W = k.ancho || e.w, H = k.alto || e.h;
      caja.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transform:scale(${e.w / W},${e.h / H})`;
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
      n.addEventListener("click", function (ev) {
        const x = n._rt.e;
        if (x.accion && x.accion.tipo && ctx.accion) { ev.stopPropagation(); ctx.accion(x.accion, x); }
      });
    }
    RT.actualizarEl(n, e, ctx);
    return n;
  };

  RT.actualizarEl = function (n, e, ctx, z) {
    const r = n._rt;
    r.e = e;
    if (r.tipo !== e.tipo) { r.c.textContent = ""; r.c.className = "rt-c"; r.firma = null; r.tipo = e.tipo; }
    n.className = "rt-el rt-e-" + e.tipo + (RT.esInteractivo(e) ? " rt-toca" : "");
    const s = n.style;
    s.left = e.x + "px"; s.top = e.y + "px";
    s.width = Math.max(1, e.w) + "px"; s.height = Math.max(1, e.h) + "px";
    s.transform = e.rot ? `rotate(${e.rot}deg)` : "";
    s.opacity = e.opacidad == null || e.opacidad === 1 ? "" : e.opacidad;
    // «Empieza escondido»: en el librito no se ve hasta que una acción lo muestra.
    s.display = e.oculto || (ctx.modo === "vista" && e.inicioOculto && !r.revelado) ? "none" : "";
    n.classList.toggle("rt-escondido", ctx.modo === "editor" && !!e.inicioOculto);
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
    let im = n.firstChild;
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
