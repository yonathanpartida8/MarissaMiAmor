/* Librito · reproductor (hecho con EditorDev) */
/*
 * LIBRITO · base del reproductor
 *
 * El reproductor es lo mismo en dos sitios: dentro del editor (el lienzo
 * pinta cada página con estas funciones, así lo que ves es lo que sale) y
 * en el librito exportado. Por eso son guiones clásicos, sin `import`: el
 * .zip se abre también como archivo suelto en el teléfono, y los módulos ES
 * no cargan desde `file://`.
 *
 * Todo cuelga de `window.LibritoRT`.
 */
(function (RT) {
  "use strict";

  /* ── DOM ─────────────────────────────────────────────────────────── */
  RT.h = function (tag, clase, padre) {
    const n = document.createElement(tag);
    if (clase) n.className = clase;
    if (padre) padre.appendChild(n);
    return n;
  };
  RT.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  RT.num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);

  /* ── Tipografías ─────────────────────────────────────────────────
     Las tres del libro primero. Las de Google se piden sólo cuando
     algún texto las usa (en el editor) o sólo las usadas (al exportar). */
  const SERIF = "Georgia, 'Times New Roman', serif";
  const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  const MANO = "'Segoe Script', 'Bradley Hand', cursive";
  RT.FUENTES = {
    "Cormorant Garamond": { g: "Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400", pila: SERIF, tipo: "serif" },
    "Caveat": { g: "Caveat:wght@400;600", pila: MANO, tipo: "mano" },
    "Jost": { g: "Jost:wght@300;400;500;600", pila: SANS, tipo: "sans" },
    "Playfair Display": { g: "Playfair+Display:ital,wght@0,400;0,600;1,400", pila: SERIF, tipo: "serif" },
    "Lora": { g: "Lora:ital,wght@0,400;0,600;1,400", pila: SERIF, tipo: "serif" },
    "Dancing Script": { g: "Dancing+Script:wght@400;600", pila: MANO, tipo: "mano" },
    "Great Vibes": { g: "Great+Vibes", pila: MANO, tipo: "mano" },
    "Sacramento": { g: "Sacramento", pila: MANO, tipo: "mano" },
    "Pacifico": { g: "Pacifico", pila: MANO, tipo: "mano" },
    "Amatic SC": { g: "Amatic+SC:wght@400;700", pila: MANO, tipo: "mano" },
    "Quicksand": { g: "Quicksand:wght@400;600", pila: SANS, tipo: "sans" },
    "Poppins": { g: "Poppins:wght@300;400;600", pila: SANS, tipo: "sans" },
    "Nunito": { g: "Nunito:wght@400;700", pila: SANS, tipo: "sans" },
    "Satisfy": { g: "Satisfy", pila: MANO, tipo: "mano" },
    "Parisienne": { g: "Parisienne", pila: MANO, tipo: "mano" },
    "Allura": { g: "Allura", pila: MANO, tipo: "mano" },
    "Homemade Apple": { g: "Homemade+Apple", pila: MANO, tipo: "mano" },
    "Shadows Into Light": { g: "Shadows+Into+Light", pila: MANO, tipo: "mano" },
    "Indie Flower": { g: "Indie+Flower", pila: MANO, tipo: "mano" },
    "Kalam": { g: "Kalam:wght@400;700", pila: MANO, tipo: "mano" },
    "Patrick Hand": { g: "Patrick+Hand", pila: MANO, tipo: "mano" },
    "Gloria Hallelujah": { g: "Gloria+Hallelujah", pila: MANO, tipo: "mano" },
    "Cinzel": { g: "Cinzel:wght@400;600", pila: SERIF, tipo: "serif" },
    "DM Serif Display": { g: "DM+Serif+Display:ital@0;1", pila: SERIF, tipo: "serif" },
    "Libre Baskerville": { g: "Libre+Baskerville:ital,wght@0,400;0,700;1,400", pila: SERIF, tipo: "serif" },
    "Merriweather": { g: "Merriweather:ital,wght@0,400;0,700;1,400", pila: SERIF, tipo: "serif" },
    "EB Garamond": { g: "EB+Garamond:ital,wght@0,400;0,600;1,400", pila: SERIF, tipo: "serif" },
    "Montserrat": { g: "Montserrat:wght@300;400;600;700", pila: SANS, tipo: "sans" },
    "Raleway": { g: "Raleway:wght@300;400;600", pila: SANS, tipo: "sans" },
    "Josefin Sans": { g: "Josefin+Sans:wght@300;400;600", pila: SANS, tipo: "sans" },
    "Comfortaa": { g: "Comfortaa:wght@400;700", pila: SANS, tipo: "sans" },
    "Fredoka": { g: "Fredoka:wght@400;600", pila: SANS, tipo: "divertida" },
    "Baloo 2": { g: "Baloo+2:wght@400;600", pila: SANS, tipo: "divertida" },
    "Lobster": { g: "Lobster", pila: MANO, tipo: "divertida" },
    "Cookie": { g: "Cookie", pila: MANO, tipo: "divertida" },
    "Chewy": { g: "Chewy", pila: SANS, tipo: "divertida" },
    "Space Mono": { g: "Space+Mono:wght@400;700", pila: "'Courier New', monospace", tipo: "mono" },
    "Georgia": { pila: SERIF, tipo: "serif" },
    "Sistema": { pila: SANS, tipo: "sans" },
    "Courier": { pila: "'Courier New', Courier, monospace", tipo: "mono" },
  };

  RT.pilaFuente = function (nombre) {
    if (!nombre) return "";
    const f = RT.FUENTES[nombre];
    if (!f) return nombre.indexOf(",") >= 0 || nombre.indexOf("'") >= 0 || nombre.indexOf('"') >= 0 ? nombre : `"${nombre}", ${SERIF}`;
    return nombre === "Sistema" || nombre === "Georgia" || nombre === "Courier" ? f.pila : `"${nombre}", ${f.pila}`;
  };

  /** URL de Google Fonts para una lista de familias (o "" si ninguna es de Google). */
  RT.urlFuentes = function (nombres) {
    const fam = [];
    for (const n of nombres) { const f = RT.FUENTES[n]; if (f && f.g && fam.indexOf(f.g) < 0) fam.push(f.g); }
    return fam.length ? "https://fonts.googleapis.com/css2?" + fam.map((f) => "family=" + f).join("&") + "&display=swap" : "";
  };

  const pedidas = new Map();
  /**
   * Pide (una sola vez cada una) las tipografías que se van usando. Con
   * `esperar`, la promesa se cumple cuando ya están listas para medir el texto.
   */
  RT.cargarFuentes = function (nombres, esperar) {
    const nuevas = [], esperas = [], g = [];
    for (const n of nombres || []) {
      if (!n || !RT.FUENTES[n] || !RT.FUENTES[n].g) continue;
      g.push(n);
      if (pedidas.has(n)) esperas.push(pedidas.get(n)); else nuevas.push(n);
    }
    if (nuevas.length) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = RT.urlFuentes(nuevas);
      const p = new Promise((ok) => { l.onload = l.onerror = () => ok(); setTimeout(ok, 5000); });
      for (const n of nuevas) pedidas.set(n, p);
      esperas.push(p);
      document.head.appendChild(l);
    }
    if (!esperar) return Promise.resolve();
    return Promise.all(esperas).then(() => (document.fonts && document.fonts.load
      ? Promise.all(g.map((n) => document.fonts.load('400 24px "' + n + '"').catch(() => null)))
      : null));
  };

  /* ── Saneado ──────────────────────────────────────────────────────
     El texto admite un poco de formato (negrita, cursiva, color de una
     palabra) y nada más: ni guiones, ni enlaces, ni estilos que muevan
     cosas. Lo mismo con los dibujos SVG. El HTML libre NO pasa por aquí:
     ése va siempre dentro de su propio marco aislado. */
  const EN_LINEA = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, BR: 1, SPAN: 1, SMALL: 1, MARK: 1, SUB: 1, SUP: 1, FONT: 1 };
  const ESTILOS_OK = /^(color|font-weight|font-style|text-decoration(-line)?|font-size|font-family|background-color|letter-spacing)$/;

  RT.sanearTexto = function (html) {
    const t = document.createElement("template");
    t.innerHTML = String(html == null ? "" : html);
    const limpiar = (padre) => {
      for (const n of Array.from(padre.childNodes)) {
        if (n.nodeType === 3) continue;
        if (n.nodeType !== 1) { n.remove(); continue; }
        const tag = n.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME" || tag === "OBJECT" || tag === "TEMPLATE") { n.remove(); continue; }
        limpiar(n);
        if (!EN_LINEA[tag]) {
          // Bloques (div/p de contenteditable): su contenido, con un salto de línea.
          const frag = document.createDocumentFragment();
          const esBloque = /^(DIV|P|LI|H\d|SECTION|ARTICLE|BLOCKQUOTE)$/.test(tag);
          if (esBloque && n.previousSibling) frag.appendChild(document.createElement("br"));
          while (n.firstChild) frag.appendChild(n.firstChild);
          n.replaceWith(frag);
          continue;
        }
        for (const a of Array.from(n.attributes)) {
          if (a.name === "style") {
            const ok = [];
            for (let i = 0; i < n.style.length; i++) {
              const p = n.style[i];
              const v = n.style.getPropertyValue(p);
              if (ESTILOS_OK.test(p) && !/url\(|expression/i.test(v)) ok.push(p + ":" + v);
            }
            if (ok.length) n.setAttribute("style", ok.join(";")); else n.removeAttribute("style");
          } else if (!(tag === "FONT" && (a.name === "color" || a.name === "face"))) n.removeAttribute(a.name);
        }
      }
    };
    limpiar(t.content);
    const d = document.createElement("div");
    d.appendChild(t.content);
    return d.innerHTML;
  };

  RT.textoAHtml = function (txt) {
    const d = document.createElement("div");
    d.textContent = String(txt == null ? "" : txt);
    return d.innerHTML.replace(/\n/g, "<br>");
  };

  RT.htmlATexto = function (html) {
    const d = document.createElement("div");
    d.innerHTML = String(html || "").replace(/<br\s*\/?>/gi, "\n");
    return d.textContent;
  };

  RT.sanearSvg = function (markup) {
    let doc;
    try { doc = new DOMParser().parseFromString(String(markup || ""), "image/svg+xml"); } catch (e) { return ""; }
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return "";
    const fuera = svg.querySelectorAll("script, foreignObject, iframe, object, embed, audio, video");
    for (const n of Array.from(fuera)) n.remove();
    const todos = [svg].concat(Array.from(svg.querySelectorAll("*")));
    for (const n of todos) {
      for (const a of Array.from(n.attributes)) {
        const nom = a.name.toLowerCase();
        if (nom.indexOf("on") === 0) n.removeAttribute(a.name);
        else if ((nom === "href" || nom === "xlink:href") && !/^(#|data:image\/)/i.test(a.value.trim())) n.removeAttribute(a.name);
      }
    }
    svg.removeAttribute("width"); svg.removeAttribute("height");
    return new XMLSerializer().serializeToString(svg);
  };

  /* ── Colores, sombras y cajas ───────────────────────────────────── */
  RT.sombra = function (s) {
    if (!s) return "";
    if (typeof s === "string") return s;
    return `${RT.num(s.x, 0)}px ${RT.num(s.y, 4)}px ${RT.num(s.blur, 12)}px ${s.color || "rgba(0,0,0,.25)"}`;
  };

  RT.gradiente = function (g) {
    if (!g) return "";
    const a = g.a || "#ffd9ea", b = g.b || "#ff7fae";
    if (g.tipo === "radial") return `radial-gradient(circle at ${RT.num(g.cx, 50)}% ${RT.num(g.cy, 40)}%, ${a}, ${b})`;
    return `linear-gradient(${RT.num(g.angulo, 160)}deg, ${a}, ${b})`;
  };

  /** Lo que tiene alrededor un elemento: fondo, borde, esquinas, sombra y aire. */
  RT.aplicarCaja = function (n, c) {
    const s = n.style;
    c = c || {};
    const fondo = c.gradiente ? RT.gradiente(c.gradiente) : c.fondo || "";
    s.background = fondo;
    const b = c.borde;
    s.border = b && b.ancho > 0 ? `${b.ancho}px ${b.estilo || "solid"} ${b.color || "#000"}` : "";
    s.borderRadius = c.radio ? (typeof c.radio === "string" ? c.radio : c.radio + "px") : "";
    s.boxShadow = RT.sombra(c.sombra);
    s.padding = c.relleno ? c.relleno + "px" : "";
    s.backdropFilter = s.webkitBackdropFilter = c.vidrio ? `blur(${c.vidrio}px)` : "";
  };

  /* ── Formas con máscara (fotos en corazón, estrella…) ─────────────── */
  RT.FIGURAS = {
    corazon: "M50 92C22 72 4 56 4 33 4 17 16 6 30 6c9 0 16 5 20 12C54 11 61 6 70 6c14 0 26 11 26 27 0 23-18 39-46 59z",
    estrella: "M50 4l13.5 29 31.5 3.6-23.4 21.4 6.6 31L50 73.4 21.8 89l6.6-31L5 36.6l31.5-3.6z",
    triangulo: "M50 6L96 92H4z",
    rombo: "M50 3L97 50 50 97 3 50z",
    hexagono: "M27 6h46l23 44-23 44H27L4 50z",
    arco: "M4 96V50C4 24 25 4 50 4s46 20 46 46v46z",
    gota: "M50 4C50 4 88 46 88 66c0 21-17 30-38 30S12 87 12 66C12 46 50 4 50 4z",
    nube: "M26 84C12 84 4 74 4 62s9-21 21-21c2-15 14-27 30-27 14 0 26 10 29 23 9 1 16 9 16 19 0 16-11 28-26 28z",
    ola: "M0 40C17 22 33 22 50 40s33 18 50 0V100H0z",
  };

  RT.mascara = function (n, figura) {
    const d = RT.FIGURAS[figura];
    if (!d) { n.style.webkitMaskImage = n.style.maskImage = ""; return; }
    const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}'/></svg>`)}")`;
    n.style.webkitMaskImage = n.style.maskImage = url;
    n.style.webkitMaskSize = n.style.maskSize = "100% 100%";
    n.style.webkitMaskRepeat = n.style.maskRepeat = "no-repeat";
  };

  RT.filtro = function (f) {
    if (!f) return "";
    if (typeof f === "string") return f === "none" ? "" : f;
    const p = [];
    if (f.brillo != null && f.brillo !== 100) p.push(`brightness(${f.brillo}%)`);
    if (f.contraste != null && f.contraste !== 100) p.push(`contrast(${f.contraste}%)`);
    if (f.saturacion != null && f.saturacion !== 100) p.push(`saturate(${f.saturacion}%)`);
    if (f.bn) p.push(`grayscale(${f.bn}%)`);
    if (f.sepia) p.push(`sepia(${f.sepia}%)`);
    if (f.desenfoque) p.push(`blur(${f.desenfoque}px)`);
    return p.join(" ");
  };

  /** Efectos de cualquier elemento (también de los componentes, sin tocarlos por dentro). */
  RT.efectos = function (f) {
    if (!f) return "";
    const p = [];
    if (f.sombra) p.push(`drop-shadow(${RT.num(f.sombra.x, 0)}px ${RT.num(f.sombra.y, 6)}px ${RT.num(f.sombra.blur, 10)}px ${f.sombra.color || "rgba(60,20,45,.35)"})`);
    if (f.resplandor) p.push(`drop-shadow(0 0 ${RT.num(f.resplandor.tam, 10)}px ${f.resplandor.color || "#ffd6e8"})`);
    if (f.desenfoque) p.push(`blur(${f.desenfoque}px)`);
    // Brillo, exposición (pasos de cámara: −2…2) y luz (levanta o baja las sombras: −100…100).
    let br = RT.num(f.brillo, 100) / 100, co = RT.num(f.contraste, 100) / 100;
    if (f.exposicion) br *= Math.pow(2, RT.num(f.exposicion, 0));
    if (f.luz) { const l = RT.clamp(RT.num(f.luz, 0) / 100, -1, 1); br *= 1 + l * 0.2; co *= 1 - l * 0.24; }
    if (Math.abs(br - 1) > 0.004) p.push(`brightness(${Math.round(br * 1000) / 10}%)`);
    if (Math.abs(co - 1) > 0.004) p.push(`contrast(${Math.round(co * 1000) / 10}%)`);
    if (f.saturacion != null && f.saturacion !== 100) p.push(`saturate(${f.saturacion}%)`);
    if (f.byn) p.push(`grayscale(${f.byn}%)`);
    if (f.sepia) p.push(`sepia(${f.sepia}%)`);
    if (f.tono) p.push(`hue-rotate(${f.tono}deg)`);
    if (f.invertir) p.push(`invert(${f.invertir}%)`);
    // Temperatura (−100 frío … 100 cálido): un filtro SVG que sube el rojo y baja el azul (o al revés).
    if (f.temperatura) p.push(`url(#${RT.filtroTemperatura(f.temperatura)})`);
    return p.join(" ");
  };

  /** Los filtros de temperatura viven una sola vez en la página (de 10 en 10). */
  RT.filtroTemperatura = function (t) {
    const paso = Math.round(RT.clamp(RT.num(t, 0), -100, 100) / 10) * 10;
    const id = "rt-temp" + (paso < 0 ? "m" + -paso : paso);
    if (!document.getElementById(id)) {
      let defs = document.getElementById("rt-filtros");
      if (!defs) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.id = "rt-filtros";
        svg.appendChild(defs);
        (document.body || document.documentElement).appendChild(svg);
      }
      const k = paso / 100;
      const fl = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      fl.id = id;
      fl.setAttribute("color-interpolation-filters", "sRGB");
      const m = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
      m.setAttribute("type", "matrix");
      m.setAttribute("values", `${1 + 0.16 * k} 0 0 0 ${0.02 * k}  0 ${1 + 0.03 * k} 0 0 0  0 0 ${1 - 0.18 * k} 0 ${-0.02 * k}  0 0 0 1 0`);
      fl.appendChild(m);
      defs.appendChild(fl);
    }
    return id;
  };

  /* ── Sonidos cortos (botones, apariciones, transiciones) ─────────── */
  const cacheSon = new Map();
  RT.sonar = function (url, vol) {
    if (!url) return;
    try {
      let base = cacheSon.get(url);
      if (!base) { base = new Audio(url); base.preload = "auto"; cacheSon.set(url, base); if (cacheSon.size > 40) cacheSon.delete(cacheSon.keys().next().value); }
      const a = base.paused || base.ended || base.currentTime === 0 ? base : base.cloneNode();
      a.currentTime = 0;
      a.volume = RT.clamp(RT.num(vol, 0.9), 0, 1);
      const r = a.play();
      if (r && r.catch) r.catch(function () {});
      // Quien quiera enterarse (la música baja mientras suena: «ducking»).
      if (RT.alSonar) RT.alSonar(a);
      return a;
    } catch (err) { return null; }
  };
  RT.precargarSonido = function (url) { if (url && !cacheSon.has(url)) { const a = new Audio(); a.preload = "auto"; a.src = url; cacheSon.set(url, a); } };

  /** ¿Pide el teléfono menos movimiento? Entonces las animaciones se acortan. */
  RT.menosMovimiento = function () {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
})(window.LibritoRT = window.LibritoRT || {});

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
    if (RT.tieneToque && RT.tieneToque(e.toque)) return true;
    const an = e.anim;
    if (an && ((an.reaccion && an.reaccion.presionar) || (an.magia || []).some((m) => m.momento === "tocar"))) return true;
    switch (e.tipo) {
      case "boton": case "carrusel": case "pagina": return true;
      case "componente": return !(e.componente && e.componente.decorativo);
      case "escena3d": return !e.escena3d || e.escena3d.orbitar !== false;
      case "album": return !e.album || e.album.ampliar !== false || e.album.disposicion === "pila";
      // Un vídeo con sonido se toca (para darle sonido si el navegador lo empezó en silencio, o pausarlo).
      case "video": return !!(e.video && (e.video.controles || RT.modoVideo(e.video) === "manual" || !e.video.silencio));
      case "html": return !e.html || e.html.interactivo !== false;
      default: return false;
    }
  };

  /* Miniaturas (páginas, transiciones): lo que no se puede pintar en chiquito
     se ve como una tarjetita oscura con su icono y su nombre (no un bloque rosa). */
  const ICO_MINI = {
    video: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.8v6.4l5.2-3.2z" fill="currentColor"/>',
    html: '<path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.4 5.5l-2.8 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    componente: '<path d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    d3: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    pagina: '<path d="M6 3.5h8.5L19 8v12.5H6z M14.5 3.5V8H19M9 12h7M9 15.5h7M9 9h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>',
  };
  RT.marcador = function (tipo, nombre, clase) {
    const t = String(nombre || "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
    return '<div class="rt-marcador rt-mk-' + tipo + (clase ? " " + clase : "") + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICO_MINI[tipo] || ICO_MINI.componente) + "</svg>" + (t ? "<span>" + t + "</span>" : "") + "</div>";
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

  /* Los de un mismo grupo deducen su ancla con la caja del GRUPO entero: así
     se mueven juntos en cualquier pantalla y nunca se separan. Cada página
     anota sus grupos al pintarse (RT.Pagina). */
  RT.cajasGrupo = new Map();
  RT.anotarGrupos = function (els) {
    const g = {};
    for (const e of els || []) {
      if (!e.grupo) continue;
      const b = g[e.grupo];
      if (!b) g[e.grupo] = { x: e.x, y: e.y, r: e.x + e.w, b: e.y + e.h };
      else { b.x = Math.min(b.x, e.x); b.y = Math.min(b.y, e.y); b.r = Math.max(b.r, e.x + e.w); b.b = Math.max(b.b, e.y + e.h); }
    }
    for (const k in g) { const b = g[k]; RT.cajasGrupo.set(k, { x: b.x, y: b.y, w: b.r - b.x, h: b.b - b.y }); }
  };

  RT.anclaDe = function (e, m) {
    const a = e.ancla || {};
    const W0 = (m && m.W0) || 390, H0 = (m && m.H0) || 844;
    const g = e.grupo && RT.cajasGrupo.get(e.grupo);
    const c = g || e;
    let ah = a.h, av = a.v;
    if (!ah || ah === "auto") {
      const cx = c.x + c.w / 2;
      ah = e.tipo === "pagina" || c.w >= W0 * 0.9 ? "estirar" : cx < W0 / 3 ? "izq" : cx > (W0 * 2) / 3 ? "der" : "centro";
      // En un grupo, sólo se estira lo que de verdad ocupa todo: lo demás se corre con él.
      if (g && ah === "estirar" && e.w < W0 * 0.9) ah = "centro";
    }
    if (!av || av === "auto") {
      const cy = c.y + c.h / 2;
      av = e.tipo === "pagina" || c.h >= H0 * 0.9 ? "estirar" : cy < H0 / 3 ? "arriba" : cy > (H0 * 2) / 3 ? "abajo" : "centro";
      if (g && av === "estirar" && e.h < H0 * 0.9) av = "centro";
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

  /* El botón de música (delgadito, redondo o sólo el icono). En el librito
     cambia solo entre «suena» (barritas) y «en pausa» (triángulo), y no se ve
     si la página no tiene canción. */
  // Las barritas que bailan son <i> (no rectángulos SVG): así su animación la
  // mueve la tarjeta gráfica y no obliga a repintar la página en cada cuadro.
  const ICONO_MUSICA = '<span class="rt-mb-i" aria-hidden="true"><span class="rt-mb-son"><i></i><i></i><i></i></span><svg class="rt-mb-pausa" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>';
  PINTAR.musica = function (c, e, ctx) {
    const m = e.musica || {};
    let b = c.firstChild;
    if (!b || !b.classList || !b.classList.contains("rt-musica-b")) {
      c.textContent = "";
      b = h("button", "rt-musica-b", c); b.type = "button";
      b.innerHTML = ICONO_MUSICA + '<span class="rt-mb-t"></span>';
    }
    b.className = "rt-musica-b rt-mb-" + (m.estilo || "slim");
    b.style.setProperty("--mb-c", m.color || "#ffffff");
    b.style.setProperty("--mb-f", m.fondo || "rgba(30,14,34,.55)");
    b.lastChild.textContent = m.estilo === "icono" || m.estilo === "redondo" ? "" : m.texto || "Música";
    b.setAttribute("aria-label", "Música: pausar o poner");
    b.tabIndex = ctx.modo === "vista" ? 0 : -1;
  };

  /** Lo que va siempre encima: los botones para pasar página y el de música. */
  RT.prioritario = function (e) {
    return !!e && (e.tipo === "musica" || (e.accion && /^(anterior|siguiente|inicio)$/.test(e.accion.tipo || "")));
  };

  /** «auto» (empieza solo al llegar) o «manual» (se toca para verlo). */
  RT.modoVideo = function (v) { return v && (v.modo || (v.auto ? "auto" : "manual")); };
  RT.MARCOS_VIDEO = { ninguno: "Sin marco", polaroid: "Polaroid", redondo: "Redondeado", cine: "Cine", neon: "Neón", cinta: "Con cinta", tele: "Tele antigua" };
  RT.ESTILOS_VIDEO = { normal: "Normal", sueno: "Sueño (brillo suave)", cine: "Cine (franjas y grano)", vhs: "VHS retro", recuerdo: "Recuerdo (sepia)", noche: "Noche azul", vivo: "Colores vivos" };

  /* Controles propios (los del sistema se ven viejos y cambian en cada
     teléfono): reproducir, barra para adelantar, tiempo, sonido y pantalla
     completa. Se esconden solos mientras se ve y vuelven al tocar. */
  const SVG = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="currentColor"/></svg>';
  const ICO_V = {
    play: SVG("M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"),
    pausa: SVG("M7 5h3.2v14H7zM13.8 5H17v14h-3.2z"),
    son: SVG("M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 8.5a5 5 0 0 1 0 7l-1.2-1.2a3.3 3.3 0 0 0 0-4.6zM17.9 6.1a8.4 8.4 0 0 1 0 11.8l-1.2-1.2a6.7 6.7 0 0 0 0-9.4z"),
    mudo: SVG("M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.2 9.4l1.2-1.2 2.1 2.1 2.1-2.1 1.2 1.2-2.1 2.1 2.1 2.1-1.2 1.2-2.1-2.1-2.1 2.1-1.2-1.2 2.1-2.1z"),
    grande: SVG("M4 4h6v2H6v4H4zM14 4h6v6h-2V6h-4zM4 14h2v4h4v2H4zM18 14h2v6h-6v-2h4z"),
  };
  const tiempo = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  function controlesVideo(w, n) {
    const b = h("div", "rt-vctl", w);
    b.innerHTML = '<button type="button" class="rt-vb rt-vb-play" aria-label="Reproducir"></button><div class="rt-vbar" role="slider" aria-label="Avance" tabindex="0"><i class="rt-vbuf"></i><i class="rt-vprog"></i><b class="rt-vpunto"></b></div><span class="rt-vt">0:00</span><button type="button" class="rt-vb rt-vb-son" aria-label="Sonido"></button><button type="button" class="rt-vb rt-vb-full" aria-label="Pantalla completa">' + ICO_V.grande + "</button>";
    const bp = b.querySelector(".rt-vb-play"), bs = b.querySelector(".rt-vb-son"), barra = b.querySelector(".rt-vbar"), prog = b.querySelector(".rt-vprog"), buf = b.querySelector(".rt-vbuf"), punto = b.querySelector(".rt-vpunto"), t = b.querySelector(".rt-vt");
    let ocultar = 0;
    const mostrar = () => { w.classList.remove("rt-vctl-fuera"); clearTimeout(ocultar); if (!n.paused) ocultar = setTimeout(() => w.classList.add("rt-vctl-fuera"), 2600); };
    const pintar = () => {
      const k = n.duration ? n.currentTime / n.duration : 0;
      prog.style.transform = "scaleX(" + k + ")"; punto.style.left = k * 100 + "%";
      t.textContent = tiempo(n.currentTime) + (n.duration && isFinite(n.duration) ? " / " + tiempo(n.duration) : "");
      barra.setAttribute("aria-valuenow", String(Math.round(k * 100)));
    };
    const estado = () => { bp.innerHTML = n.paused ? ICO_V.play : ICO_V.pausa; bp.setAttribute("aria-label", n.paused ? "Reproducir" : "Pausar"); bs.innerHTML = n.muted ? ICO_V.mudo : ICO_V.son; mostrar(); };
    n.addEventListener("timeupdate", pintar);
    n.addEventListener("loadedmetadata", pintar);
    n.addEventListener("progress", () => { try { const r = n.buffered; if (r.length && n.duration) buf.style.transform = "scaleX(" + r.end(r.length - 1) / n.duration + ")"; } catch (err) { /* nada */ } });
    for (const ev of ["play", "pause", "volumechange"]) n.addEventListener(ev, estado);
    bp.addEventListener("click", (ev) => { ev.stopPropagation(); if (n.paused) n.play().catch(() => {}); else n.pause(); });
    bs.addEventListener("click", (ev) => { ev.stopPropagation(); n.muted = !n.muted; w.classList.remove("rt-vmudo"); if (!n.muted && n.volume < 0.05) n.volume = 1; });
    b.querySelector(".rt-vb-full").addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (w.requestFullscreen) w.requestFullscreen().catch(() => { if (n.webkitEnterFullscreen) n.webkitEnterFullscreen(); });
      else if (n.webkitEnterFullscreen) n.webkitEnterFullscreen();
    });
    const ir = (ev) => { const r = barra.getBoundingClientRect(); const k = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)); if (n.duration) { n.currentTime = k * n.duration; pintar(); } };
    barra.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); ev.preventDefault(); try { barra.setPointerCapture(ev.pointerId); } catch (err) { /* nada */ } w.classList.add("rt-varrastra"); ir(ev); const mv = (e2) => ir(e2); const fin = () => { w.classList.remove("rt-varrastra"); barra.removeEventListener("pointermove", mv); barra.removeEventListener("pointerup", fin); barra.removeEventListener("pointercancel", fin); mostrar(); }; barra.addEventListener("pointermove", mv); barra.addEventListener("pointerup", fin); barra.addEventListener("pointercancel", fin); });
    barra.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") n.currentTime = Math.min(n.duration || 0, n.currentTime + 5); else if (ev.key === "ArrowLeft") n.currentTime = Math.max(0, n.currentTime - 5); });
    b.addEventListener("click", (ev) => ev.stopPropagation());
    w.addEventListener("pointerdown", mostrar);
    estado(); pintar();
    return b;
  }

  /**
   * Un vídeo con su marco y, si se pide, un resplandor detrás hecho con sus
   * propios colores (un lienzo chiquito de 24×14 que se agranda borroso:
   * casi no cuesta). En modo manual se toca para reproducir o pausar.
   */
  /* Al salir de la app o cambiar de pestaña el navegador pausa los vídeos; al
     volver, siguen los que estaban sonando (antes se quedaban parados). */
  if (typeof document !== "undefined" && !RT._vidVisible) {
    RT._vidVisible = true;
    document.addEventListener("visibilitychange", function () {
      const vs = document.querySelectorAll(".rt-modo-vista video.rt-vid");
      if (document.hidden) { for (let i = 0; i < vs.length; i++) vs[i]._seguir = !vs[i].paused; return; }
      for (let i = 0; i < vs.length; i++) if (vs[i]._seguir && vs[i].isConnected) { vs[i]._seguir = false; RT.reproducirVideo(vs[i]); }
    });
  }

  /** Empieza un vídeo: con sonido si el teléfono deja; si no, en silencio
   *  (con el aviso «Toca para el sonido»). Nunca se queda negro sin avisar. */
  RT.reproducirVideo = function (n) {
    const w = n.closest(".rt-vwrap");
    return n.play().catch(function () {
      if (n.muted) return;
      n.muted = true;
      if (w) w.classList.add("rt-vmudo");
      return n.play().catch(function () { if (w) w.classList.remove("rt-vmudo"); });
    });
  };

  PINTAR.video = function (c, e, ctx) {
    const v = e.video || {};
    const url = v.asset ? ctx.url(v.asset) : null;
    if (!url) { vacio(c, "Añadir vídeo", ctx, e); return; }
    if (ctx.modo === "mini") { c.innerHTML = RT.marcador("video", e.nombre); return; }
    let w = c.firstChild;
    if (!w || !w.classList || !w.classList.contains("rt-vwrap")) {
      c.textContent = ""; w = h("div", "rt-vwrap", c);
      const n = h("video", "rt-vid", w);
      n.setAttribute("playsinline", ""); n.playsInline = true; n.preload = "metadata";
    }
    const n = w.querySelector("video");
    const marco = RT.MARCOS_VIDEO[v.marco] ? v.marco : "ninguno";
    // Lo que es estado (sonando, sin sonido…) sobrevive a repintar.
    const queda = ["sonando", "rt-vmudo", "rt-vctl-fuera", "rt-varrastra"].filter(function (k) { return w.classList.contains(k); });
    w.className = "rt-vwrap rt-vm-" + marco + (queda.length ? " " + queda.join(" ") : "");
    // Si el teléfono no dejó empezar con sonido, sigue sin sonido hasta que lo toquen.
    n.muted = ctx.modo !== "vista" || !!v.silencio || w.classList.contains("rt-vmudo");
    n.loop = !!v.bucle;
    n.controls = false;
    const estilo = RT.ESTILOS_VIDEO[v.estilo] ? v.estilo : "normal";
    w.classList.toggle("rt-vepico", !!v.epico);
    if (estilo !== "normal") w.classList.add("rt-vfx-" + estilo);
    n.style.objectFit = v.ajuste || "cover";
    if (n.getAttribute("src") !== url) n.src = url;
    const modo = RT.modoVideo(v);
    let barra = w.querySelector(".rt-vctl");
    if (ctx.modo === "vista" && v.controles) { if (!barra) controlesVideo(w, n); }
    else if (barra) barra.remove();
    // Lo que el vídeo tiene configurado AHORA (el toque lo lee al momento: no se duplican oyentes).
    w._v = v; w._modo = modo;
    // «Toca para el sonido» (cuando empezó solo y en silencio) y el botón grande de
    // reproducir son CONTROLES: sólo con «barra de controles» encendida.
    let chip = w.querySelector(".rt-vsonido");
    if (ctx.modo === "vista" && v.controles && !v.silencio) {
      if (!chip) {
        chip = h("button", "rt-vsonido", w); chip.type = "button";
        chip.innerHTML = ICO_V.mudo + "<span>Toca para el sonido</span>";
        chip.addEventListener("click", function (ev) { ev.stopPropagation(); n.muted = false; if (n.volume < 0.05) n.volume = 1; w.classList.remove("rt-vmudo"); if (n.paused) n.play().catch(function () {}); });
      }
    } else if (chip) chip.remove();
    let b = w.querySelector(".rt-vid-play");
    if (ctx.modo === "vista" && modo === "manual" && v.controles) {
      if (!b) { b = h("button", "rt-vid-play", w); b.type = "button"; b.setAttribute("aria-label", "Reproducir"); }
    } else if (b) b.remove();
    // Un solo manejador de toques por vídeo (antes podían sumarse y pausar de más):
    //   en pausa → reproduce (con sonido: el toque lo permite) · sonando en
    //   silencio por el navegador → le pone sonido · sonando → pausa.
    // Funciona igual con o sin controles visibles.
    if (ctx.modo === "vista" && !w._toque) {
      w._toque = true;
      n.addEventListener("play", function () { w.classList.add("sonando"); });
      n.addEventListener("pause", function () { w.classList.remove("sonando"); });
      w.addEventListener("click", function (ev) {
        if (ev.target.closest(".rt-vctl, .rt-vsonido")) return;
        const vv = w._v || {};
        if (!w.closest(".rt-accion")) ev.stopPropagation();
        const conSonido = !vv.silencio;
        if (n.paused) { if (conSonido) { n.muted = false; w.classList.remove("rt-vmudo"); } RT.reproducirVideo(n); return; }
        if (conSonido && n.muted) { n.muted = false; if (n.volume < 0.05) n.volume = 1; w.classList.remove("rt-vmudo"); return; }
        n.pause();
      });
    }
    if (ctx.modo !== "vista" && !n.paused) n.pause();
    // Resplandor con los colores del vídeo.
    const amb = Math.max(0, Math.min(1, +v.ambiente || (v.epico ? 0.75 : 0)));
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
      const bucle = function () { if (!vivo) return; pintar(); t = setTimeout(bucle, n.paused ? 900 : v.epico ? 120 : 220); };
      if (n.readyState >= 2) bucle(); else n.addEventListener("loadeddata", function () { if (ctx.modo !== "vista" && n.currentTime < 0.05) { try { n.currentTime = 0.1; } catch (err) { /* nada */ } } bucle(); }, { once: true });
      n.addEventListener("seeked", pintar);
      parar = function () { vivo = false; clearTimeout(t); n.removeEventListener("seeked", pintar); };
    } else if (cv) { cv.remove(); w.style.removeProperty("--rt-vcolor"); }
    // Arranca una sola vez (si ella lo pausó, repintar no lo vuelve a poner).
    if (ctx.modo === "vista" && modo === "auto" && ctx.activo && !RT.inicioDe(e) && !w._arrancado) { w._arrancado = true; RT.reproducirVideo(n); }
    return parar ? { destruir: parar } : null;
  };

  /* El HTML libre va SIEMPRE en su marco aislado: sin acceso al librito.
     Se acepta un trozo (se envuelve) o un documento entero tal cual
     (<!DOCTYPE>, <html>, <head>, <style>, <script>, <body>…). Al principio
     se le pone un «puente» chiquito para que lo que el aislamiento no deja
     (localStorage, cookies) no rompa sus scripts: guardan en memoria. */
  const PUENTE = '<style id="sin-resaltado">html{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}*,*::before,*::after{-webkit-tap-highlight-color:transparent}body{-webkit-user-select:none;user-select:none}input,textarea,select,[contenteditable]:not([contenteditable="false"]),[contenteditable]:not([contenteditable="false"]) *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}</style>'
    + "<script>(function(){function M(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}"
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
    if (ctx.modo === "mini") { c.innerHTML = RT.marcador("html", e.nombre); return; }
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
    if (ctx.modo === "mini" || !p.ruta) { c.innerHTML = RT.marcador("pagina", p.titulo || "Página original", "rt-marcador-pag"); return; }
    // Un original escondido (se sacó todo a capas) no se carga en el librito: ni suena ni gasta.
    if (ctx.modo === "vista" && e.oculto) { c.textContent = ""; return; }
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

  /** El recuadro de lo que se ve de un componente (o null: el marco entero). */
  RT.encuadreDe = function (k) {
    const q = k && k.ajuste !== "adaptar" && k.encuadre;
    return q && q.w > 4 && q.h > 4 ? q : null;
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
      // Con `encuadre`, el elemento mide sólo lo que se ve del marco: el marco se
      // corre para que eso quede dentro (lo que se anima hacia afuera se sigue viendo).
      const W = k.ancho || b.w, H = k.alto || b.h;
      const q = RT.encuadreDe(k);
      const sx = b.w / (q ? q.w : W), sy = b.h / (q ? q.h : H);
      caja.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transform:${q ? `translate(${-q.x * sx}px,${-q.y * sy}px) ` : ""}scale(${sx},${sy})`;
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
      c.innerHTML = k.miniatura && ctx.ruta ? `<img class="rt-comp-mini" alt="" loading="lazy" src="${ctx.ruta(k.miniatura)}">` : RT.marcador("componente", e.nombre);
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
      n.addEventListener("pointerdown", function (ev) {
        const x = n._rt.e, s = x.sonidos;
        if (ev._rtToque) return; // ya lo atendió una zona táctil
        if (s && s.tocar && ctx.sonido && x.tipo !== "componente") ctx.sonido(s.tocar, s.volumen);
        if (RT.tieneToque && RT.tieneToque(x.toque)) { ev._rtToque = true; RT.efectoToque(n, x.toque, ev.clientX, ev.clientY); }
        // Reacciones: mientras se presiona (se hunde, crece, brilla…) y su magia «al tocarlo».
        const an = x.anim;
        if (an && an.reaccion && an.reaccion.presionar && RT.presionar) RT.presionar(n, an.reaccion.presionar, ev);
        if (an && an.magia && RT.magiaAlTocar) RT.magiaAlTocar(n, x);
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
    // El marco «sello» trae su propia sombra: se suma a los efectos (no se pisa).
    const base = e.tipo === "imagen" && e.imagen && e.imagen.marco === "sello" ? "drop-shadow(0 6px 10px rgba(60,20,40,.22)) " : "";
    r.c.style.filter = (base + RT.efectos(e.efectos)).trim();
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
    if (RT.pintarZonas && (e.zonas || r.zonas)) RT.pintarZonas(n, e, ctx);
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
      // «Al tocar la página»: un efectito en cualquier toque (si no lo atendió ya un elemento).
      if (ctx.modo === "vista") this.nodo.addEventListener("pointerdown", (ev) => {
        const t = this.pagina && this.pagina.toque;
        if (!ev._rtToque && t && t.efecto && RT.particulas) RT.particulas(t.efecto, ev.clientX, ev.clientY, t);
      });
      this.sincronizar(pagina);
    }

    sincronizar(pagina) {
      this.pagina = pagina;
      RT.anotarGrupos(pagina.els);
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
        // Pasar página y música, siempre por encima de todo (nunca quedan tapados).
        const z = (RT.prioritario(e) ? 5000 : 0) + i + 1;
        if (!n) { n = RT.crearEl(e, ctx); n.style.zIndex = z; this.capa.appendChild(n); this.nodos.set(e.id, n); }
        else RT.actualizarEl(n, e, ctx, z);
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
      // Si se movió un miembro de un grupo, la caja del grupo (y el ancla de todos) se pone al día.
      if (e.grupo && this.pagina) {
        const els = (this.pagina.els || []).map((x) => (x.id === e.id ? e : x)).filter((x) => x.grupo === e.grupo);
        const antes = JSON.stringify(RT.cajasGrupo.get(e.grupo) || null);
        RT.anotarGrupos(els);
        if (this.ctx.medidas && this.ctx.medidas.auto && JSON.stringify(RT.cajasGrupo.get(e.grupo)) !== antes) {
          for (const x of els) if (x.id !== e.id) { const m = this.nodos.get(x.id); if (m) RT.actualizarEl(m, x, this.ctx); }
        }
      }
      if (n) RT.actualizarEl(n, e, this.ctx);
    }

    destruir() {
      for (const n of this.nodos.values()) RT.destruirEl(n);
      this.nodos.clear();
      this.nodo.remove();
    }
  };
})(window.LibritoRT = window.LibritoRT || {});

/*
 * LIBRITO · animaciones
 *
 * Todas con la API de animaciones del navegador (Web Animations): se
 * mueven en el compositor como las de CSS, pero además se pueden pausar y
 * llevar a cualquier milisegundo, que es lo que necesita la línea de tiempo
 * del editor para que lo que se ve al arrastrar sea lo que sale.
 *
 * Cada elemento puede tener cuatro, y cada una mueve su propia capa:
 *   entrada  → .rt-ae   al llegar a la página
 *   bucle    → .rt-ab   empieza cuando termina la entrada
 *   salida   → .rt-ae   al irse de la página
 *   propia   → .rt-c    fotogramas a mano (o las que traía una página importada)
 *
 * Los nombres y sus ajustes viven aquí y el editor los lee de aquí: así el
 * menú del editor y lo que sabe hacer el librito nunca se desincronizan.
 *
 * Fase 11:
 *   · trayectorias de verdad (arcos, espirales, órbitas, ochos, deriva
 *     orgánica), rebotes con física, entradas con profundidad 3D
 *   · «intensidad» en todas (escala distancias, giros y tamaños) y
 *     «velocidad» en los bucles
 *   · animación propia con fotogramas POR PROPIEDAD (posición con curva,
 *     escala, giro, opacidad, desenfoque, color, brillo), cada uno con su
 *     propio ritmo, también curvas a mano (cubic-bezier)
 *   · magia (rt-magia.js): chispas, brillitos, estelas, resplandor, ondas…
 */
(function (RT) {
  "use strict";

  RT.FACIL = {
    suave: { n: "Suave", v: "cubic-bezier(.22,.8,.26,1)" },
    entraSale: { n: "Entra y sale suave", v: "cubic-bezier(.65,0,.35,1)" },
    frena: { n: "Frena al final", v: "cubic-bezier(.1,.7,.2,1)" },
    acelera: { n: "Acelera", v: "cubic-bezier(.55,0,.9,.45)" },
    rebote: { n: "Con rebote", v: "cubic-bezier(.34,1.56,.64,1)" },
    elastico: { n: "Elástico", v: "cubic-bezier(.68,-0.55,.27,1.55)" },
    lineal: { n: "Constante", v: "linear" },
  };
  const facil = (f) => (RT.FACIL[f] ? RT.FACIL[f].v : f && /\(|^ease|^linear|^step/.test(f) ? f : RT.FACIL.suave.v);
  RT.facil = facil;

  /* Un ritmo como función (0→1): para muestrear trayectorias y fotogramas. */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
      if (!(t >= 0 && t <= 1) || Math.abs(sx(t) - x) > 1e-4) { let a = 0, b = 1; t = x; for (let i = 0; i < 30; i++) { const v = sx(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) a = t; else b = t; t = (a + b) / 2; } }
      return sy(t);
    };
  }
  const CSS_FACIL = { ease: [0.25, 0.1, 0.25, 1], "ease-in": [0.42, 0, 1, 1], "ease-out": [0, 0, 0.58, 1], "ease-in-out": [0.42, 0, 0.58, 1] };
  RT.facilFn = function (f) {
    const v = facil(f);
    const m = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(v);
    if (m) return bezier(+m[1], +m[2], +m[3], +m[4]);
    if (CSS_FACIL[v]) return bezier.apply(null, CSS_FACIL[v]);
    return (x) => x;
  };

  /* Una trayectoria muestreada: fn(u) → { x, y, r, s | sx sy, o, b (desenfoque), br (brillo), z, rx, ry }.
     Con perspectiva, todas las piezas 3D van siempre (así el navegador interpola suave). */
  const f2 = (v) => (Math.abs(v) < 1e-4 ? 0 : +v.toFixed(3));
  function tray(n, fn, persp) {
    const out = [];
    const conFiltro = (() => { const p0 = fn(0); return p0.b != null || p0.br != null; })();
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = fn(u);
      let t = persp ? `perspective(${persp}px) translateZ(${f2(p.z || 0)}px) rotateX(${f2(p.rx || 0)}deg) rotateY(${f2(p.ry || 0)}deg) ` : "";
      t += `translate(${f2(p.x || 0)}px, ${f2(p.y || 0)}px) rotate(${f2(p.r || 0)}deg) scale(${f2(p.sx != null ? p.sx : p.s != null ? p.s : 1)}, ${f2(p.sy != null ? p.sy : p.s != null ? p.s : 1)})`;
      const k = { offset: u, transform: t };
      if (p.o != null) k.opacity = Math.max(0, Math.min(1, p.o));
      if (conFiltro) k.filter = `blur(${f2(Math.max(0, p.b || 0))}px) brightness(${f2(p.br != null ? p.br : 1)})`;
      if (p.origen) k.transformOrigin = p.origen;
      out.push(k);
    }
    return out;
  }
  /** Al revés (para las salidas que deshacen una entrada). */
  const alReves = (k) => k.slice().reverse().map((x) => Object.assign({}, x, { offset: x.offset != null ? 1 - x.offset : undefined }));
  const perp = (dir) => { const m = mov(dir, 1); return [-m[1], m[0]]; };
  const CAE = "cubic-bezier(.5,0,1,.6)", SUBE = "cubic-bezier(0,.4,.5,1)", VAIVEN = "cubic-bezier(.45,0,.55,1)";
  /** Rebotes con física: cae, toca el suelo (se aplasta un poquito) y rebota cada vez menos. */
  function rebotes(p) {
    const n = Math.max(1, Math.min(6, Math.round(RT.num(p.rebotes, 3)))), H = Math.max(16, p.dist * 3), e = 0.52;
    const alturas = [];
    let h = H, T = 1;
    for (let i = 0; i < n; i++) { h *= e * e; alturas.push(h); T += 2 * Math.sqrt(h / H); }
    const o = "50% 100%";
    const k = [{ offset: 0, transform: `translateY(${-H}px) scale(.94, 1.08)`, opacity: 0, transformOrigin: o, easing: CAE }];
    let t = 1;
    k.push({ offset: t / T, transform: "translateY(0px) scale(1.16, .84)", opacity: 1, transformOrigin: o, easing: SUBE });
    alturas.forEach((a, i) => {
      const d = Math.sqrt(a / H);
      t += d; k.push({ offset: t / T, transform: `translateY(${f2(-a)}px) scale(.97, 1.03)`, opacity: 1, transformOrigin: o, easing: CAE });
      t += d; const q = 0.16 * Math.pow(e, i + 1);
      k.push({ offset: Math.min(1, t / T), transform: `translateY(0px) scale(${f2(1 + q)}, ${f2(1 - q)})`, opacity: 1, transformOrigin: o, easing: SUBE });
    });
    k[k.length - 1] = { offset: 1, transform: "translateY(0px) scale(1, 1)", opacity: 1, transformOrigin: o };
    return k;
  }
  /** Una curva periódica suave (empieza y acaba en 0: el bucle no salta). */
  const onda = (u, armonicos) => { let v = 0, v0 = 0; for (const [a, f, fase] of armonicos) { v += a * Math.sin(2 * Math.PI * f * u + fase); v0 += a * Math.sin(fase); } return v - v0; };

  RT.DIRS = { arriba: "Hacia arriba", abajo: "Hacia abajo", izquierda: "Hacia la izquierda", derecha: "Hacia la derecha" };
  function mov(dir, d) {
    switch (dir) {
      case "arriba": return [0, -d];
      case "izquierda": return [-d, 0];
      case "derecha": return [d, 0];
      default: return [0, d];
    }
  }
  const tr = (x, y) => `translate(${x}px, ${y}px)`;
  const RECORTE = { derecha: "inset(0 100% 0 0)", izquierda: "inset(0 0 0 100%)", abajo: "inset(0 0 100% 0)", arriba: "inset(100% 0 0 0)" };

  /* Cada una: n (nombre), usa (qué ajustes tiene sentido mostrar), f (fotogramas). */
  RT.ANIM = {
    entrada: {
      ninguna: { n: "Ninguna" },
      aparecer: { n: "Aparecer", f: () => [{ opacity: 0 }, { opacity: 1 }] },
      deslizar: { n: "Deslizar", usa: ["dir", "dist"], f: (p) => { const m = mov(p.dir, p.dist); return [{ opacity: 0, transform: tr(-m[0], -m[1]) }, { opacity: 1, transform: tr(0, 0) }]; } },
      zoom: { n: "Aparecer y crecer", usa: ["escala"], f: (p) => [{ opacity: 0, transform: `scale(${RT.num(p.escala, 0.6)})` }, { opacity: 1, transform: "scale(1)" }] },
      rebote: { n: "Rebote", f: () => [{ opacity: 0, transform: "scale(.3)", offset: 0 }, { opacity: 1, transform: "scale(1.08)", offset: 0.55 }, { transform: "scale(.96)", offset: 0.8 }, { opacity: 1, transform: "scale(1)", offset: 1 }] },
      latido: { n: "Latido", f: () => [{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1.22)", offset: 0.5 }, { transform: "scale(.92)", offset: 0.75 }, { opacity: 1, transform: "scale(1)" }] },
      girar: { n: "Girar", usa: ["giro"], f: (p) => [{ opacity: 0, transform: `rotate(${-RT.num(p.giro, 90)}deg) scale(.6)` }, { opacity: 1, transform: "rotate(0deg) scale(1)" }] },
      caer: { n: "Caer", usa: ["dist"], f: (p) => [{ opacity: 0, transform: `translateY(${-p.dist * 2}px)` }, { opacity: 1, transform: "translateY(0px)", offset: 0.6 }, { transform: `translateY(${-p.dist * 0.25}px)`, offset: 0.8 }, { opacity: 1, transform: "translateY(0px)" }] },
      desenfoque: { n: "Desde borroso", f: () => [{ opacity: 0, filter: "blur(14px)", transform: "scale(1.04)" }, { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }] },
      revelar: { n: "Revelar (como si se escribiera)", usa: ["dir"], f: (p) => [{ clipPath: RECORTE[p.dir] || RECORTE.derecha }, { clipPath: "inset(0 0 0 0)" }] },
      voltear: { n: "Voltear", f: () => [{ opacity: 0, transform: "perspective(800px) rotateY(85deg)" }, { opacity: 1, transform: "perspective(800px) rotateY(0deg)" }] },
      destello: { n: "Destello", f: () => [{ opacity: 0, filter: "brightness(2.4) blur(6px)" }, { opacity: 1, filter: "brightness(1) blur(0px)" }] },
      sello: { n: "Sello (como estampado)", f: () => [{ opacity: 0, transform: "scale(1.8) rotate(-12deg)" }, { opacity: 1, transform: "scale(.94) rotate(2deg)", offset: 0.6 }, { opacity: 1, transform: "scale(1) rotate(0deg)" }] },
      circulo: { n: "Aparecer en círculo", f: () => [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }] },
      elastico: { n: "Elástico", f: () => [{ opacity: 0, transform: "scale(.2, 1.4)" }, { opacity: 1, transform: "scale(1.2, .85)", offset: 0.45 }, { transform: "scale(.92, 1.08)", offset: 0.7 }, { opacity: 1, transform: "scale(1, 1)" }] },
      pegar: { n: "Pegarse (como sticker)", f: () => [{ opacity: 0, transform: "translateY(-30px) rotate(-8deg) scale(1.15)" }, { opacity: 1, transform: "translateY(2px) rotate(1deg) scale(.98)", offset: 0.7 }, { opacity: 1, transform: "translateY(0) rotate(0deg) scale(1)" }] },
      arco: { n: "Llegar en arco", usa: ["dir", "dist"], f: (p) => {
        const m = mov(p.dir, 1), q = perp(p.dir), d = p.dist * 2.4, s = [-m[0] * d, -m[1] * d], c = [s[0] / 2 + q[0] * d * 0.6, s[1] / 2 + q[1] * d * 0.6];
        return tray(20, (u) => { const v = 1 - u; return { x: v * v * s[0] + 2 * v * u * c[0], y: v * v * s[1] + 2 * v * u * c[1], r: -16 * v * v, s: 0.82 + 0.18 * u, o: Math.min(1, u * 2.6) }; });
      } },
      espiral: { n: "Espiral", usa: ["dist", "giro"], f: (p) => tray(26, (u) => { const v = 1 - u, a = v * (p.giro / 90) * Math.PI * 3, r = p.dist * 1.7 * v; return { x: Math.cos(a) * r, y: Math.sin(a) * r, r: -v * p.giro * 2, s: 0.25 + 0.75 * u, o: Math.min(1, u * 3) }; }) },
      profundidad: { n: "Desde el fondo (3D)", usa: ["dist"], f: (p) => tray(12, (u) => { const v = 1 - u; return { z: -p.dist * 14 * v, rx: 18 * v * v, o: Math.min(1, u * 2.2), b: 7 * v * v, br: 1 + 0.25 * v }; }, 900) },
      caer3d: { n: "Caer en 3D", f: () => { const o = "50% 0%"; return [{ opacity: 0, transform: "perspective(900px) rotateX(-92deg)", transformOrigin: o }, { opacity: 1, transform: "perspective(900px) rotateX(16deg)", transformOrigin: o, offset: 0.6 }, { opacity: 1, transform: "perspective(900px) rotateX(-6deg)", transformOrigin: o, offset: 0.82 }, { opacity: 1, transform: "perspective(900px) rotateX(0deg)", transformOrigin: o }]; } },
      desplegar: { n: "Desplegar (3D)", f: () => { const o = "0% 50%"; return [{ opacity: 0, transform: "perspective(900px) rotateY(-95deg)", transformOrigin: o }, { opacity: 1, transform: "perspective(900px) rotateY(12deg)", transformOrigin: o, offset: 0.65 }, { opacity: 1, transform: "perspective(900px) rotateY(0deg)", transformOrigin: o }]; } },
      rebotes: { n: "Rebotes (con física)", usa: ["dist", "rebotes"], lineal: true, f: rebotes },
      organico: { n: "Llegar y acomodarse (orgánico)", usa: ["dist", "giro"], lineal: true, f: (p) => tray(28, (u) => {
        if (u >= 1) return { o: 1 };
        const a = Math.exp(-4.6 * u), w = Math.PI * 4.6 * u;
        return { y: p.dist * a * Math.cos(w), r: p.giro * 0.1 * a * Math.sin(w), sx: 1 + 0.1 * a * Math.sin(w + 0.6), sy: 1 - 0.1 * a * Math.sin(w + 0.6), o: Math.min(1, u * 4) };
      }) },
      cine: { n: "Cinematográfica", f: () => [{ opacity: 0, transform: "scale(1.45)", filter: "blur(14px) brightness(1.6)" }, { opacity: 1, transform: "scale(1.04)", filter: "blur(2px) brightness(1.15)", offset: 0.55 }, { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }] },
      magica: { n: "Aparición mágica", f: () => [{ opacity: 0, transform: "scale(.4) rotate(-20deg)", filter: "brightness(3) saturate(0) blur(6px)" }, { opacity: 1, transform: "scale(1.12) rotate(4deg)", filter: "brightness(1.8) saturate(1.4) blur(0px)", offset: 0.55 }, { opacity: 1, transform: "scale(.97) rotate(-1deg)", filter: "brightness(1.1) saturate(1.1) blur(0px)", offset: 0.8 }, { opacity: 1, transform: "scale(1) rotate(0deg)", filter: "brightness(1) saturate(1) blur(0px)" }] },
    },
    salida: {
      ninguna: { n: "Ninguna" },
      desaparecer: { n: "Desvanecer", f: () => [{ opacity: 1 }, { opacity: 0 }] },
      deslizar: { n: "Deslizar", usa: ["dir", "dist"], f: (p) => { const m = mov(p.dir, p.dist); return [{ opacity: 1, transform: tr(0, 0) }, { opacity: 0, transform: tr(m[0], m[1]) }]; } },
      zoom: { n: "Desvanecer y encoger", usa: ["escala"], f: (p) => [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: `scale(${RT.num(p.escala, 0.6)})` }] },
      crecer: { n: "Crecer y desvanecer", f: () => [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.35)" }] },
      girar: { n: "Girar", usa: ["giro"], f: (p) => [{ opacity: 1, transform: "rotate(0deg) scale(1)" }, { opacity: 0, transform: `rotate(${RT.num(p.giro, 90)}deg) scale(.6)` }] },
      desenfoque: { n: "Hacia borroso", f: () => [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(14px)" }] },
      voltear: { n: "Voltear", f: () => [{ opacity: 1, transform: "perspective(800px) rotateY(0deg)" }, { opacity: 0, transform: "perspective(800px) rotateY(-85deg)" }] },
      arco: { n: "Irse en arco", usa: ["dir", "dist"], f: (p) => alReves(RT.ANIM.entrada.arco.f(Object.assign({}, p, { dir: { arriba: "abajo", abajo: "arriba", izquierda: "derecha", derecha: "izquierda" }[p.dir] || "arriba" }))) },
      espiral: { n: "Espiral", usa: ["dist", "giro"], f: (p) => alReves(RT.ANIM.entrada.espiral.f(p)) },
      fondo: { n: "Hacia el fondo (3D)", usa: ["dist"], f: (p) => alReves(RT.ANIM.entrada.profundidad.f(p)) },
      saltito: { n: "Saltito y se va", usa: ["dist"], f: (p) => { const o = "50% 100%"; return [{ opacity: 1, transform: "translateY(0px) scale(1, 1)", transformOrigin: o }, { opacity: 1, transform: "translateY(0px) scale(1.12, .86)", transformOrigin: o, offset: 0.18 }, { opacity: 1, transform: `translateY(${-p.dist}px) scale(.94, 1.08)`, transformOrigin: o, offset: 0.45 }, { opacity: 0, transform: `translateY(${p.dist * 4}px) scale(1, 1)`, transformOrigin: o }]; } },
      polvo: { n: "Deshacerse en polvo mágico", usa: ["dist"], magia: "polvo", f: (p) => [{ opacity: 1, transform: "translateY(0px) scale(1)", filter: "blur(0px) brightness(1)" }, { opacity: 0.85, transform: "translateY(-4px) scale(1.02)", filter: "blur(1px) brightness(1.5)", offset: 0.3 }, { opacity: 0, transform: `translateY(${-p.dist}px) scale(1.08)`, filter: "blur(10px) brightness(2)" }] },
      caer3d: { n: "Caer en 3D", f: () => { const o = "50% 100%"; return [{ opacity: 1, transform: "perspective(900px) rotateX(0deg)", transformOrigin: o }, { opacity: 1, transform: "perspective(900px) rotateX(-12deg)", transformOrigin: o, offset: 0.3 }, { opacity: 0, transform: "perspective(900px) rotateX(92deg)", transformOrigin: o }]; } },
    },
    bucle: {
      ninguno: { n: "Ninguno" },
      flotar: { n: "Flotar", usa: ["dir", "dist"], f: (p) => { const m = mov(p.dir || "arriba", p.dist * 0.4); return [{ transform: tr(0, 0) }, { transform: tr(m[0], m[1]) }, { transform: tr(0, 0) }]; } },
      latir: { n: "Latir", usa: ["escala"], f: (p) => [{ transform: "scale(1)" }, { transform: `scale(${RT.num(p.escala, 1.08)})` }, { transform: "scale(1)" }] },
      palpitar: { n: "Palpitar (corazón)", f: () => [{ transform: "scale(1)", offset: 0 }, { transform: "scale(1.12)", offset: 0.14 }, { transform: "scale(1)", offset: 0.28 }, { transform: "scale(1.08)", offset: 0.42 }, { transform: "scale(1)", offset: 0.7 }, { transform: "scale(1)", offset: 1 }] },
      balancear: { n: "Balancear", usa: ["giro"], f: (p) => { const g = RT.num(p.giro, 6); return [{ transform: `rotate(${-g}deg)` }, { transform: `rotate(${g}deg)` }, { transform: `rotate(${-g}deg)` }]; } },
      girar: { n: "Girar sin parar", lineal: true, f: () => [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }] },
      brillar: { n: "Brillar", f: () => [{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }] },
      respirar: { n: "Respirar", f: () => [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.03)", opacity: 0.9 }, { transform: "scale(1)", opacity: 1 }] },
      temblar: { n: "Temblar", f: () => [{ transform: "translateX(0)" }, { transform: "translateX(-3px)", offset: 0.2 }, { transform: "translateX(3px)", offset: 0.4 }, { transform: "translateX(-2px)", offset: 0.6 }, { transform: "translateX(2px)", offset: 0.8 }, { transform: "translateX(0)" }] },
      rebotar: { n: "Rebotar", usa: ["dist"], f: (p) => [{ transform: "translateY(0)", offset: 0 }, { transform: `translateY(${-p.dist}px)`, offset: 0.3 }, { transform: "translateY(0)", offset: 0.55 }, { transform: `translateY(${-p.dist * 0.3}px)`, offset: 0.72 }, { transform: "translateY(0)", offset: 0.88 }, { transform: "translateY(0)", offset: 1 }] },
      aletear: { n: "Aletear", f: () => [{ transform: "scaleX(1)" }, { transform: "scaleX(.55)" }, { transform: "scaleX(1)" }] },
      arcoiris: { n: "Arcoíris", lineal: true, f: () => [{ filter: "hue-rotate(0deg)" }, { filter: "hue-rotate(360deg)" }] },
      resplandor: { n: "Resplandor", f: () => [{ filter: "drop-shadow(0 0 0px rgba(255,190,220,0))" }, { filter: "drop-shadow(0 0 14px rgba(255,170,210,.95))" }, { filter: "drop-shadow(0 0 0px rgba(255,190,220,0))" }] },
      parpadear: { n: "Parpadear", f: () => [{ opacity: 1 }, { opacity: 1, offset: 0.45 }, { opacity: 0.15, offset: 0.5 }, { opacity: 1, offset: 0.55 }, { opacity: 1 }] },
      orbita: { n: "Órbita (círculo)", usa: ["dist"], lineal: true, f: (p) => { const r = p.dist * 0.7; return tray(32, (u) => ({ x: Math.cos(u * 2 * Math.PI) * r - r, y: Math.sin(u * 2 * Math.PI) * r })); } },
      ocho: { n: "Ocho (infinito)", usa: ["dist"], lineal: true, f: (p) => { const r = p.dist * 0.8; return tray(40, (u) => ({ x: Math.sin(u * 2 * Math.PI) * r, y: Math.sin(u * 4 * Math.PI) * r * 0.45, r: Math.cos(u * 2 * Math.PI) * 4 - 4 })); } },
      deriva: { n: "Deriva orgánica", usa: ["dist", "giro"], lineal: true, f: (p) => tray(48, (u) => ({
        x: onda(u, [[p.dist * 0.5, 1, 0.4], [p.dist * 0.22, 2, 1.7], [p.dist * 0.1, 3, 0.2]]),
        y: onda(u, [[p.dist * 0.45, 1, 2.1], [p.dist * 0.2, 3, 0.9]]),
        r: onda(u, [[p.giro * 0.5, 1, 1.1], [p.giro * 0.25, 2, 0.3]]),
        s: 1 + onda(u, [[0.025, 2, 0.5]]),
      })) },
      pendulo: { n: "Péndulo", usa: ["giro"], lineal: true, f: (p) => { const g = RT.num(p.giro, 6) * 2, o = "50% 0%"; return [{ transform: `rotate(${-g}deg)`, transformOrigin: o, easing: VAIVEN }, { transform: `rotate(${g}deg)`, transformOrigin: o, easing: VAIVEN, offset: 0.5 }, { transform: `rotate(${-g}deg)`, transformOrigin: o }]; } },
      gelatina: { n: "Gelatina", f: () => [{ transform: "scale(1, 1)" }, { transform: "scale(1.12, .88)", offset: 0.3 }, { transform: "scale(.9, 1.1)", offset: 0.45 }, { transform: "scale(1.05, .95)", offset: 0.6 }, { transform: "scale(.98, 1.02)", offset: 0.75 }, { transform: "scale(1, 1)" }] },
      latidoLuz: { n: "Latido con luz", f: () => [{ transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 0px rgba(255,150,200,0))" }, { transform: "scale(1.08)", filter: "brightness(1.2) drop-shadow(0 0 12px rgba(255,150,200,.9))", offset: 0.18 }, { transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 2px rgba(255,150,200,.3))", offset: 0.36 }, { transform: "scale(1.05)", filter: "brightness(1.12) drop-shadow(0 0 8px rgba(255,150,200,.7))", offset: 0.5 }, { transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 0px rgba(255,150,200,0))", offset: 0.75 }, { transform: "scale(1)", filter: "brightness(1) drop-shadow(0 0 0px rgba(255,150,200,0))" }] },
    },
  };

  RT.ANIM_DEF = {
    entrada: { tipo: "ninguna", dur: 800, retraso: 0, facil: "suave", dir: "arriba", dist: 40, escala: 0.6, giro: 90, intensidad: 1, rebotes: 3 },
    salida: { tipo: "ninguna", dur: 500, retraso: 0, facil: "suave", dir: "abajo", dist: 40, escala: 0.6, giro: 90, intensidad: 1, rebotes: 3 },
    bucle: { tipo: "ninguno", dur: 2400, retraso: 0, facil: "entraSale", dir: "arriba", dist: 20, escala: 1.08, giro: 6, repetir: "inf", alterna: false, intensidad: 1, velocidad: 1 },
  };

  /** Los ajustes de una fase, con la intensidad ya aplicada a distancias, giros y tamaños. */
  function param(fase, a) {
    const d = RT.ANIM_DEF[fase];
    const p = {};
    for (const k in d) p[k] = a && a[k] != null ? a[k] : d[k];
    const k = RT.clamp(RT.num(+p.intensidad, 1), 0, 4);
    if (k !== 1) {
      p.dist *= k;
      p.giro *= k;
      p.escala = fase === "bucle" ? 1 + (p.escala - 1) * k : RT.clamp(1 - (1 - p.escala) * k, 0.02, 3);
    }
    return p;
  }
  RT.paramAnim = param;

  /* Las propiedades de la animación propia (y su valor si no se dice nada). */
  RT.PROPS = {
    pos: { n: "Posición", campos: ["x", "y"], def: 0 },
    escala: { n: "Escala", def: 1 },
    rot: { n: "Giro", def: 0, unidad: "°" },
    opacidad: { n: "Opacidad", def: 1 },
    desenfoque: { n: "Desenfoque", def: 0, unidad: "px" },
    tono: { n: "Color (tono)", def: 0, unidad: "°" },
    brillo: { n: "Brillo", def: 1 },
  };
  const tienePos = (f) => f.x != null || f.y != null;
  RT.tieneProp = (f, k) => (k === "pos" ? tienePos(f) : f[k] != null);

  /** Fotogramas a mano → fotogramas del navegador.
   *  v1 (los de antes): cada fotograma trae todo; lo que falta vale lo de siempre.
   *  v2 (por propiedad): cada propiedad tiene SUS fotogramas y su ritmo entre
   *  uno y otro; la posición puede ir en curva (`curva`, px hacia un lado). */
  RT.fotogramasPropios = function (pr) {
    if (pr.raw && pr.raw.length) return pr.raw;
    const fs = (pr.fotogramas || []).slice().sort((a, b) => a.t - b.t);
    if (fs.length < 2) return null;
    if (!(pr.v >= 2)) {
      const blur = fs.some((f) => f.desenfoque), color = fs.some((f) => f.tono || (f.brillo != null && f.brillo !== 1));
      return fs.map((f) => {
        const k = {
          offset: RT.clamp(RT.num(f.t, 0), 0, 1),
          transform: `translate(${RT.num(f.x, 0)}px, ${RT.num(f.y, 0)}px) rotate(${RT.num(f.rot, 0)}deg) scale(${RT.num(f.escala, 1)})`,
          opacity: RT.num(f.opacidad, 1),
        };
        if (blur || color) k.filter = `blur(${RT.num(f.desenfoque, 0)}px)` + (color ? ` hue-rotate(${RT.num(f.tono, 0)}deg) brightness(${RT.num(f.brillo, 1)})` : "");
        if (f.facil) k.easing = facil(f.facil);
        return k;
      });
    }
    // v2: cada propiedad por su lado; se muestrea para respetar el ritmo de cada tramo.
    const def = pr.facil || "suave";
    const claves = {};
    for (const k in RT.PROPS) {
      const l = fs.filter((f) => RT.tieneProp(f, k));
      if (l.length) claves[k] = l;
    }
    const usadas = Object.keys(claves);
    if (!usadas.length) return null;
    const tiempos = new Set([0, 1]);
    for (const f of fs) tiempos.add(RT.clamp(RT.num(f.t, 0), 0, 1));
    const N = 48;
    for (let i = 1; i < N; i++) tiempos.add(i / N);
    const ts = [...tiempos].sort((a, b) => a - b);
    // Valor de una propiedad en el instante u.
    const tramo = (l, u) => {
      if (u <= l[0].t) return [l[0], l[0], 0];
      const z = l[l.length - 1];
      if (u >= z.t) return [z, z, 0];
      let i = 0;
      while (i < l.length - 2 && l[i + 1].t < u) i++;
      const a = l[i], b = l[i + 1];
      const w = b.t - a.t || 1;
      return [a, b, RT.facilFn(a.facil || def)((u - a.t) / w)];
    };
    const valor = (k, u) => {
      const l = claves[k], d = RT.PROPS[k].def;
      if (!l) return d;
      const [a, b, e] = tramo(l, u);
      return RT.num(a[k], d) + (RT.num(b[k], d) - RT.num(a[k], d)) * e;
    };
    const posicion = (u) => {
      const l = claves.pos;
      if (!l) return [0, 0];
      const [a, b, e] = tramo(l, u);
      const ax = RT.num(a.x, 0), ay = RT.num(a.y, 0), bx = RT.num(b.x, 0), by = RT.num(b.y, 0);
      const c = RT.num(a.curva, 0);
      if (!c || a === b) return [ax + (bx - ax) * e, ay + (by - ay) * e];
      // Curva: el tramo se dobla hacia un lado (bezier cuadrática).
      const L = Math.hypot(bx - ax, by - ay) || 1, mx = (ax + bx) / 2 - ((by - ay) / L) * c, my = (ay + by) / 2 + ((bx - ax) / L) * c, v = 1 - e;
      return [v * v * ax + 2 * v * e * mx + e * e * bx, v * v * ay + 2 * v * e * my + e * e * by];
    };
    const filtro = usadas.some((k) => k === "desenfoque" || k === "tono" || k === "brillo");
    return ts.map((u) => {
      const [x, y] = posicion(u);
      const k = { offset: u, transform: `translate(${f2(x)}px, ${f2(y)}px) rotate(${f2(valor("rot", u))}deg) scale(${f2(valor("escala", u))})`, opacity: f2(RT.clamp(valor("opacidad", u), 0, 1)) };
      if (filtro) k.filter = `blur(${f2(Math.max(0, valor("desenfoque", u)))}px) hue-rotate(${f2(valor("tono", u))}deg) brightness(${f2(Math.max(0, valor("brillo", u)))})`;
      return k;
    });
  };

  /** Valores de la animación propia en un instante (0–1): para el editor de fotogramas. */
  RT.valoresPropios = function (pr, u) {
    const fr = RT.fotogramasPropios(Object.assign({}, pr, { v: 2 }));
    const out = { x: 0, y: 0, escala: 1, rot: 0, opacidad: 1, desenfoque: 0, tono: 0, brillo: 1 };
    const fs = (pr.fotogramas || []).slice().sort((a, b) => a.t - b.t);
    if (!fr || !fs.length) return out;
    // Se interpola sobre los fotogramas reales de cada propiedad (con su ritmo).
    const def = pr.facil || "suave";
    for (const k of ["x", "y", "escala", "rot", "opacidad", "desenfoque", "tono", "brillo"]) {
      const l = fs.filter((f) => f[k] != null);
      if (!l.length) continue;
      if (u <= l[0].t) { out[k] = l[0][k]; continue; }
      const z = l[l.length - 1];
      if (u >= z.t) { out[k] = z[k]; continue; }
      let i = 0;
      while (i < l.length - 2 && l[i + 1].t < u) i++;
      const a = l[i], b = l[i + 1];
      out[k] = a[k] + (b[k] - a[k]) * RT.facilFn(a.facil || def)((u - a.t) / ((b.t - a.t) || 1));
    }
    return out;
  };

  function repetir(r) { return r === "inf" || r === Infinity || r == null ? Infinity : Math.max(1, +r || 1); }

  /* Cuándo está un elemento en la página (línea de tiempo):
       tiempo.inicio  ms en que aparece (antes no se ve)        · 0 = desde el principio
       tiempo.fin     ms en que se va (su salida termina ahí)   · null = se queda
     Las animaciones de entrada y la propia cuentan desde su inicio. */
  RT.inicioDe = function (e) { return Math.max(0, RT.num(e.tiempo && e.tiempo.inicio, 0)); };
  RT.finDe = function (e) { const f = e.tiempo && e.tiempo.fin; return f == null || f === "" ? null : Math.max(RT.inicioDe(e) + 50, RT.num(f, 0)); };

  /** Cuánto dura la entrada de un elemento (con su retraso y su inicio). */
  RT.finEntrada = function (e) {
    const a = e.anim || {};
    const ini = RT.inicioDe(e);
    let fin = ini;
    if (a.entrada && a.entrada.tipo && a.entrada.tipo !== "ninguna") fin = ini + RT.num(a.entrada.retraso, 0) + RT.num(a.entrada.dur, 800);
    const pr = a.propia;
    if (pr && (pr.raw || pr.fotogramas)) {
      const n = repetir(pr.repetir);
      if (n !== Infinity) fin = Math.max(fin, ini + RT.num(pr.retraso, 0) + RT.num(pr.dur, 1000) * n);
    }
    const f = RT.finDe(e);
    return f != null ? Math.max(fin, f) : fin;
  };

  /* ── El animador de una página ─────────────────────────────────── */
  RT.Animador = class {
    constructor(pagina, nodos) {
      this.pagina = pagina;
      this.nodos = nodos;
      this.anims = [];
      this.total = 0;
    }

    _anim(capa, frames, op) {
      try {
        const a = capa.animate(frames, op);
        this.anims.push(a);
        return a;
      } catch (err) { return null; }
    }

    /** Arranca todas las entradas, y los bucles detrás de cada una. */
    entrar(opciones) {
      opciones = opciones || {};
      this.cancelar();
      const poco = opciones.vista && RT.menosMovimiento();
      let total = 0;
      for (const e of this.pagina.els || []) {
        const n = this.nodos.get(e.id);
        if (!n || e.oculto || !e.anim) continue;
        const a = e.anim;
        const ini = RT.inicioDe(e), hasta = RT.finDe(e);
        let fin = ini;
        // Cuándo está: antes de su inicio y después de su fin no se ve.
        if (ini > 0 || hasta != null) {
          const D = (hasta != null ? hasta : ini) + 1;
          const k = [];
          if (ini > 0) k.push({ visibility: "hidden", offset: 0 }, { visibility: "hidden", offset: ini / D });
          k.push({ visibility: "visible", offset: ini / D });
          if (hasta != null) k.push({ visibility: "visible", offset: hasta / D }, { visibility: "hidden", offset: hasta / D }, { visibility: "hidden", offset: 1 });
          else k.push({ visibility: "visible", offset: 1 });
          this._anim(n, k, { duration: D, easing: "linear", fill: "both" });
        }
        const en = a.entrada && RT.ANIM.entrada[a.entrada.tipo];
        if (en && en.f) {
          const p = param("entrada", a.entrada);
          const dur = poco ? Math.min(p.dur, 200) : p.dur;
          this._anim(n._rt.ae, en.f(p), { duration: dur, delay: ini + p.retraso, easing: en.lineal ? "linear" : facil(p.facil), fill: "both" });
          fin = ini + p.retraso + dur;
        }
        const pr = a.propia;
        const fr = pr && RT.fotogramasPropios(pr);
        if (fr && !poco) {
          this._anim(n._rt.c, fr, {
            duration: RT.num(pr.dur, 1000), delay: ini + RT.num(pr.retraso, 0), easing: pr.v >= 2 ? "linear" : facil(pr.facil),
            iterations: repetir(pr.repetir), direction: pr.direccion || "normal", fill: pr.relleno || "both",
          });
          if (repetir(pr.repetir) !== Infinity) fin = Math.max(fin, ini + RT.num(pr.retraso, 0) + RT.num(pr.dur, 1000) * repetir(pr.repetir));
        }
        // Se va a su hora: la salida termina justo en su fin.
        const sa = hasta != null && a.salida && RT.ANIM.salida[a.salida.tipo];
        if (sa && sa.f) {
          const p = param("salida", a.salida);
          this._anim(n._rt.ae, sa.f(p), { duration: p.dur, delay: Math.max(ini, hasta - p.dur), easing: sa.lineal ? "linear" : facil(p.facil), fill: "forwards" });
        }
        const bu = a.bucle && RT.ANIM.bucle[a.bucle.tipo];
        if (bu && bu.f && !poco) {
          const p = param("bucle", a.bucle);
          this._anim(n._rt.ab, bu.f(p), {
            duration: p.dur / RT.clamp(RT.num(+p.velocidad, 1), 0.1, 10), delay: fin + p.retraso, iterations: repetir(p.repetir),
            direction: p.alterna ? "alternate" : "normal", easing: bu.lineal ? "linear" : facil(p.facil), fill: "none",
          });
        }
        // La magia (chispas, estelas, resplandor…): después, porque la estela copia lo de arriba.
        if (RT.magia && !poco) RT.magia(this, n, e, { ini: ini, fin: fin, hasta: hasta });
        total = Math.max(total, hasta != null ? Math.max(fin, hasta) : fin);
      }
      if (this.componentes) for (const c of this.componentes) total = Math.max(total, c.entrar ? c.entrar(this) || 0 : 0);
      this.total = total;
      return this;
    }

    /** Las salidas; la promesa se cumple cuando termina la última. */
    salir() {
      let max = 0;
      for (const e of this.pagina.els || []) {
        const n = this.nodos.get(e.id);
        const s = e.anim && e.anim.salida;
        const def = s && RT.ANIM.salida[s.tipo];
        if (!n || e.oculto || !def || !def.f || RT.finDe(e) != null) continue;
        const p = param("salida", s);
        this._anim(n._rt.ae, def.f(p), { duration: p.dur, delay: p.retraso, easing: def.lineal ? "linear" : facil(p.facil), fill: "forwards" });
        if (RT.magia && !RT.menosMovimiento()) RT.magia(this, n, e, { salida: true, desde: p.retraso, dur: p.dur });
        max = Math.max(max, p.retraso + p.dur);
      }
      return new Promise((r) => setTimeout(r, Math.min(max, 2500)));
    }

    /** Lleva todas a un instante (línea de tiempo del editor). */
    ir(ms) {
      for (const a of this.anims) { try { a.pause(); a.currentTime = ms; } catch (err) { /* nada */ } }
    }
    pausar() { for (const a of this.anims) a.pause(); }
    seguir() { for (const a of this.anims) a.play(); }
    cancelar() {
      for (const a of this.anims) { try { a.cancel(); } catch (err) { /* nada */ } }
      this.anims = [];
      for (const x of this.extras || []) x.remove();
      this.extras = [];
    }
  };

  /** Una animación de entrada suelta (las fotos de un álbum, por ejemplo). */
  RT.animarUno = function (nodo, tipo, p) {
    const def = RT.ANIM.entrada[tipo];
    if (!def || !def.f || !nodo.animate) return null;
    const q = param("entrada", p);
    try { return nodo.animate(def.f(q), { duration: q.dur, delay: q.retraso, easing: facil(q.facil), fill: "both" }); } catch (err) { return null; }
  };
})(window.LibritoRT = window.LibritoRT || {});

/*
 * LIBRITO · magia
 *
 * Efectos que acompañan a un elemento: chispas, brillitos, estela, resplandor,
 * ondas de energía, corazones, polvo mágico y halo. Se combinan entre sí y
 * con cualquier animación (anim.magia es una lista).
 *
 *   e.anim.magia = [{ tipo, momento, color, cantidad, retraso }]
 *     momento  "entrada" al terminar de llegar · "siempre" mientras está
 *              · "salida" al irse · "tocar" al tocarlo (en el librito)
 *
 * Todo son piezas chiquitas animadas con la API de animaciones del navegador
 * (sólo transform y opacidad: las mueve la tarjeta gráfica) y con el azar
 * «sembrado» por elemento: la línea de tiempo del editor puede ir a cualquier
 * instante y se ve SIEMPRE lo mismo. Hay un tope de piezas por elemento.
 */
(function (RT) {
  "use strict";

  RT.MAGIA = {
    chispas: { n: "Chispas" },
    brillitos: { n: "Brillitos" },
    estela: { n: "Estela" },
    resplandor: { n: "Resplandor" },
    ondas: { n: "Ondas de energía" },
    corazones: { n: "Corazones" },
    polvo: { n: "Polvo mágico" },
    halo: { n: "Halo" },
  };
  RT.MAGIA_MOMENTOS = [["entrada", "Al aparecer"], ["siempre", "Mientras está"], ["salida", "Al irse"], ["tocar", "Al tocarlo"]];

  const ESTRELLA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor"/></svg>';
  const CORAZON = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.5 1.2 4.3 2.4.8-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>';
  // Lo que no se copia para la estela (pesado o con vida propia).
  const SIN_ESTELA = /^(video|componente|html|pagina|escena3d|carrusel|album|musica)$/;

  /** Azar con semilla: el mismo elemento da siempre las mismas chispas. */
  function semilla(txt) {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function caja(n, e) {
    const b = n._rt && n._rt.caja;
    return { w: Math.max(8, (b && b.w) || e.w || 100), h: Math.max(8, (b && b.h) || e.h || 100) };
  }

  /** La capa de la magia dentro del elemento (detrás o delante del contenido). */
  function capa(A, n, detras) {
    const c = document.createElement("div");
    c.className = "rt-mg" + (detras ? " rt-mg-detras" : "");
    c.setAttribute("aria-hidden", "true");
    // Sin z-index: detrás = primero en el orden (se pinta antes que el contenido), delante = último.
    c.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible";
    if (detras) n.insertBefore(c, n.firstChild); else n.appendChild(c);
    A.extras = A.extras || [];
    A.extras.push(c);
    return c;
  }

  function pieza(c, tam, html, css) {
    const p = document.createElement("i");
    p.style.cssText = `position:absolute;left:50%;top:50%;width:${tam}px;height:${tam}px;margin:${-tam / 2}px 0 0 ${-tam / 2}px;display:block;opacity:0;${css || ""}`;
    if (html) p.innerHTML = html;
    c.appendChild(p);
    return p;
  }

  function animar(A, nodo, k, op) {
    try { const a = nodo.animate(k, op); A.anims.push(a); return a; } catch (err) { return null; }
  }

  /**
   * Una pasada de un efecto. `t0` = cuándo (ms desde que arranca la página),
   * `siempre` = se repite mientras está. Devuelve cuánto dura una pasada.
   */
  const EFECTOS = {
    chispas(A, n, e, m, t0, siempre, az) {
      const { w, h } = caja(n, e), c = capa(A, n, false), R = Math.max(w, h) * 0.62, q = Math.round(12 * m.k), dur = 950;
      for (let i = 0; i < q; i++) {
        const a = (i / q) * Math.PI * 2 + (az() - 0.5) * 0.6, d = R * (0.75 + az() * 0.55), t = 8 + az() * 10;
        const p = pieza(c, t, ESTRELLA, `color:${i % 2 ? "#fff7cf" : m.color};filter:drop-shadow(0 0 4px ${m.color})`);
        const fin = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 8}px) scale(0) rotate(270deg)`;
        const k = [
          { transform: "translate(0px,0px) scale(0) rotate(0deg)", opacity: 1, offset: 0 },
          { transform: `translate(${Math.cos(a) * d * 0.85}px,${Math.sin(a) * d * 0.85}px) scale(1) rotate(${120 + az() * 120}deg)`, opacity: 1, offset: siempre ? 0.22 : 0.55 },
          { transform: fin, opacity: 0, offset: siempre ? 0.4 : 1 },
        ];
        // Repitiéndose: estalla y descansa (el resto de la vuelta, quieta e invisible).
        if (siempre) k.push({ transform: fin, opacity: 0, offset: 1 });
        animar(A, p, k, { duration: siempre ? 2600 : dur, delay: t0 + az() * 80, iterations: siempre ? Infinity : 1, easing: "cubic-bezier(.2,.7,.3,1)" });
      }
      return dur;
    },
    brillitos(A, n, e, m, t0, siempre, az) {
      const { w, h } = caja(n, e), c = capa(A, n, false), q = Math.round(9 * m.k), dur = 1500;
      for (let i = 0; i < q; i++) {
        // En el borde (un poquito fuera): se ve como un aura de destellos.
        const lado = az() * 4 | 0, u = az();
        const x = lado < 2 ? (u - 0.5) * w * 1.1 : (lado === 2 ? -0.55 : 0.55) * w, y = lado < 2 ? (lado === 0 ? -0.55 : 0.55) * h : (u - 0.5) * h * 1.1;
        const t = 7 + az() * 9, ret = az() * (siempre ? 2200 : 400);
        const p = pieza(c, t, ESTRELLA, `color:${az() < 0.35 ? "#ffffff" : m.color};filter:drop-shadow(0 0 3px ${m.color})`);
        animar(A, p, [
          { transform: `translate(${x}px,${y}px) scale(0) rotate(0deg)`, opacity: 0 },
          { transform: `translate(${x}px,${y}px) scale(1) rotate(45deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${x}px,${y - 6}px) scale(0) rotate(90deg)`, opacity: 0 },
        ], { duration: siempre ? 1300 + az() * 1200 : dur, delay: t0 + ret, iterations: siempre ? Infinity : 1, easing: "ease-in-out" });
      }
      return dur + 400;
    },
    ondas(A, n, e, m, t0, siempre) {
      const { w, h } = caja(n, e), c = capa(A, n, true), d = Math.max(w, h) * 0.7, dur = 1100;
      for (let i = 0; i < 3; i++) {
        const p = pieza(c, d, "", `border-radius:50%;border:2px solid ${m.color};box-shadow:0 0 12px ${m.color},inset 0 0 10px ${m.color}`);
        animar(A, p, [{ transform: "scale(.35)", opacity: 0.95 }, { transform: `scale(${1.9 + m.k * 0.4})`, opacity: 0 }], { duration: dur, delay: t0 + i * 220, iterations: siempre ? Infinity : 1, easing: "cubic-bezier(.2,.6,.3,1)", endDelay: siempre ? 900 : 0 });
      }
      return dur + 440;
    },
    resplandor(A, n, e, m, t0, siempre) {
      const { w, h } = caja(n, e), c = capa(A, n, true), d = Math.max(w, h) * 1.25;
      const p = pieza(c, d, "", `border-radius:50%;background:radial-gradient(circle, ${m.color} 0%, ${m.color}99 30%, transparent 68%);filter:blur(10px)`);
      if (siempre) animar(A, p, [{ transform: "scale(.82)", opacity: 0.35 * m.k }, { transform: "scale(1.06)", opacity: Math.min(1, 0.85 * m.k) }, { transform: "scale(.82)", opacity: 0.35 * m.k }], { duration: 2400, delay: t0, iterations: Infinity, easing: "ease-in-out" });
      else animar(A, p, [{ transform: "scale(.5)", opacity: 0 }, { transform: "scale(1.1)", opacity: Math.min(1, 0.95 * m.k), offset: 0.35 }, { transform: "scale(1.25)", opacity: 0 }], { duration: 1200, delay: t0, easing: "ease-out" });
      return 1200;
    },
    corazones(A, n, e, m, t0, siempre, az) {
      const { w, h } = caja(n, e), c = capa(A, n, false), q = Math.round(6 * m.k), dur = 1700;
      for (let i = 0; i < q; i++) {
        const x0 = (az() - 0.5) * w * 0.8, sube = h * (0.6 + az() * 0.6) + 30, vaiven = 10 + az() * 16, t = 11 + az() * 10;
        const p = pieza(c, t, CORAZON, `color:${i % 3 ? m.color : "#ff8fb1"};filter:drop-shadow(0 2px 3px rgba(120,20,60,.25))`);
        animar(A, p, [
          { transform: `translate(${x0}px,${h * 0.3}px) scale(.3)`, opacity: 0 },
          { transform: `translate(${x0 + vaiven}px,${h * 0.3 - sube * 0.35}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${x0 - vaiven}px,${h * 0.3 - sube * 0.7}px) scale(.95)`, opacity: 0.9, offset: 0.65 },
          { transform: `translate(${x0}px,${h * 0.3 - sube}px) scale(.8)`, opacity: 0 },
        ], { duration: siempre ? dur + az() * 900 : dur, delay: t0 + (siempre ? az() * 2600 : az() * 300), iterations: siempre ? Infinity : 1, easing: "linear" });
      }
      return dur + 300;
    },
    polvo(A, n, e, m, t0, siempre, az, dur0) {
      const { w, h } = caja(n, e), c = capa(A, n, false), q = Math.round(18 * m.k), dur = Math.max(600, dur0 || 900);
      for (let i = 0; i < q; i++) {
        const x = (az() - 0.5) * w * 0.9, y = (az() - 0.5) * h * 0.9, t = 2 + az() * 4, dx = (az() - 0.5) * 50, dy = -(30 + az() * 70);
        const p = pieza(c, t, "", `border-radius:50%;background:${az() < 0.3 ? "#fff6d8" : m.color};box-shadow:0 0 6px ${m.color}`);
        animar(A, p, [
          { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 0 },
          { transform: `translate(${x + dx * 0.3}px,${y + dy * 0.3}px) scale(1.2)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${x + dx}px,${y + dy}px) scale(.2)`, opacity: 0 },
        ], { duration: siempre ? 1800 + az() * 1400 : dur * (0.7 + az() * 0.5), delay: t0 + az() * (siempre ? 2400 : dur * 0.35), iterations: siempre ? Infinity : 1, easing: "cubic-bezier(.3,.6,.4,1)" });
      }
      return dur;
    },
    halo(A, n, e, m, t0, siempre) {
      const { w, h } = caja(n, e), c = capa(A, n, false), r = Math.max(w, h) * 0.62, q = 10;
      const anillo = pieza(c, 2 * r, "", "");
      for (let i = 0; i < q; i++) {
        const a = (i / q) * Math.PI * 2, t = i % 2 ? 5 : 8;
        const d = document.createElement("i");
        d.style.cssText = `position:absolute;left:50%;top:50%;width:${t}px;height:${t}px;margin:${-t / 2}px 0 0 ${-t / 2}px;border-radius:50%;background:${i % 3 ? m.color : "#fff"};box-shadow:0 0 8px ${m.color};transform:translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px)`;
        anillo.appendChild(d);
      }
      if (siempre) animar(A, anillo, [{ transform: "rotate(0deg) scale(1)", opacity: 0.9 }, { transform: "rotate(180deg) scale(1.04)", opacity: 0.6 }, { transform: "rotate(360deg) scale(1)", opacity: 0.9 }], { duration: 5200 / Math.max(0.3, m.k), delay: t0, iterations: Infinity, easing: "linear" });
      else animar(A, anillo, [{ transform: "rotate(-90deg) scale(.4)", opacity: 0 }, { transform: "rotate(90deg) scale(1)", opacity: 1, offset: 0.5 }, { transform: "rotate(200deg) scale(1.15)", opacity: 0 }], { duration: 1400, delay: t0, easing: "cubic-bezier(.2,.7,.3,1)" });
      return 1400;
    },
    /* La estela: copias del elemento que repiten SUS animaciones un pelín
       después, cada vez más transparentes (sólo mientras se mueve). */
    estela(A, n, e, m, t0, siempre, az, dur0, t) {
      if (SIN_ESTELA.test(e.tipo) || !n._rt) return 0;
      const capas = [n._rt.ae, n._rt.ab, n._rt.c];
      const propias = A.anims.filter((a) => a.effect && capas.indexOf(a.effect.target) >= 0);
      if (!propias.length) return 0;
      const copias = Math.max(2, Math.min(5, Math.round(3 * m.k)));
      for (let i = 1; i <= copias; i++) {
        const g = capa(A, n, true);
        g.style.opacity = String(0.42 * Math.pow(0.62, i - 1));
        g.style.filter = `blur(${i * 0.6}px)`;
        const ve = g.appendChild(document.createElement("div")), ae = ve.appendChild(document.createElement("div")), ab = ae.appendChild(document.createElement("div")), cc = ab.appendChild(n._rt.c.cloneNode(true));
        for (const x of [ve, ae, ab, cc]) x.style.cssText += ";position:relative;width:100%;height:100%;box-sizing:border-box";
        const mapa = new Map([[n._rt.ae, ae], [n._rt.ab, ab], [n._rt.c, cc]]);
        for (const a of propias) {
          const tm = a.effect.getTiming();
          animar(A, mapa.get(a.effect.target), a.effect.getKeyframes(), Object.assign({}, tm, { delay: (tm.delay || 0) + i * 55 }));
        }
        // Sólo se ve mientras hay movimiento: al terminar la entrada se apaga.
        if (!siempre) animar(A, ve, [{ opacity: 0 }, { opacity: 1, offset: 0.05 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: Math.max(200, (t.fin - t.ini) + i * 55 + 120), delay: t.ini, fill: "both" });
      }
      return 0;
    },
  };

  function datos(m, e, i) {
    return { tipo: m.tipo, color: m.color || "#ff7fae", k: RT.clamp(RT.num(+m.cantidad, 1), 0.3, 2.5), retraso: RT.num(+m.retraso, 0), az: semilla((e.id || "x") + ":" + i + ":" + m.tipo) };
  }

  /**
   * La magia de un elemento dentro de un animador de página (editor y librito).
   * `t` = { ini, fin, hasta } en ms de la página, o { salida: true, desde, dur }.
   */
  RT.magia = function (A, n, e, t) {
    const lista = ((e.anim && e.anim.magia) || []).slice();
    // La salida «polvo mágico» trae su polvo aunque no se haya puesto.
    const sa = e.anim && e.anim.salida, def = sa && RT.ANIM.salida[sa.tipo];
    if (def && def.magia && !lista.some((x) => x.tipo === def.magia && x.momento === "salida")) lista.push({ tipo: def.magia, momento: "salida", auto: true });
    lista.forEach((m0, i) => {
      const f = EFECTOS[m0.tipo];
      if (!f) return;
      const m = datos(m0, e, i);
      const mo = m0.momento || "entrada";
      if (t.salida) {
        if (mo === "salida") f(A, n, e, m, t.desde + m.retraso, false, m.az, t.dur, t);
        return;
      }
      if (mo === "entrada") f(A, n, e, m, (m0.tipo === "estela" ? 0 : Math.max(t.ini, t.fin - 160)) + m.retraso, false, m.az, 0, t);
      else if (mo === "siempre") f(A, n, e, m, t.fin + m.retraso, true, m.az, 0, t);
      else if (mo === "salida" && t.hasta != null) {
        const p = sa && RT.ANIM.salida[sa.tipo] && sa.tipo !== "ninguna" ? RT.num(sa.dur, 500) : 600;
        f(A, n, e, m, Math.max(t.ini, t.hasta - p) + m.retraso, false, m.az, p, t);
      }
    });
  };

  /** Al tocarlo (en el librito): la magia «tocar» suena una vez y se recoge sola. */
  RT.magiaAlTocar = function (n, e) {
    const lista = ((e.anim && e.anim.magia) || []).filter((m) => m.momento === "tocar" && EFECTOS[m.tipo] && m.tipo !== "estela");
    if (!lista.length || RT.menosMovimiento()) return;
    if (n._mgToque) { for (const a of n._mgToque.anims) { try { a.cancel(); } catch (err) { /* nada */ } } for (const x of n._mgToque.extras || []) x.remove(); }
    const A = { anims: [], extras: [] };
    n._mgToque = A;
    let max = 0;
    lista.forEach((m0, i) => { const m = datos(m0, e, i); m.az = semilla(e.id + ":" + i + ":" + performance.now()); max = Math.max(max, EFECTOS[m0.tipo](A, n, e, m, m.retraso, false, m.az, 900, { ini: 0, fin: 0 }) + m.retraso); });
    setTimeout(() => { if (n._mgToque !== A) return; for (const x of A.extras) x.remove(); n._mgToque = null; }, max + 1400);
  };

  /* ── Reacciones: lo que hace el elemento mientras lo presionan ───── */
  RT.REACCIONES = [["", "Nada"], ["hundir", "Hundirse"], ["crecer", "Crecer"], ["brillar", "Brillar"], ["gelatina", "Gelatina"], ["inclinar", "Inclinarse"]];
  const PRESION = {
    hundir: [{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(.9)", filter: "brightness(.92)" }],
    crecer: [{ transform: "scale(1)" }, { transform: "scale(1.1)" }],
    brillar: [{ filter: "brightness(1) drop-shadow(0 0 0px rgba(255,170,210,0))" }, { filter: "brightness(1.3) drop-shadow(0 0 14px rgba(255,170,210,.95))" }],
    gelatina: [{ transform: "scale(1, 1)" }, { transform: "scale(1.12, .86)" }],
    inclinar: [{ transform: "perspective(500px) rotateX(0deg) scale(1)" }, { transform: "perspective(500px) rotateX(14deg) scale(.96)" }],
  };
  /** Presionar → se hunde (o crece, brilla…); soltar → vuelve con un rebotito. */
  RT.presionar = function (n, tipo, ev) {
    const k = PRESION[tipo];
    if (!k || !n || !n._rt || !n.animate) return;
    const c = n._rt.ab;
    try {
      if (c._presion) c._presion.cancel();
      // «add»: se suma a lo que ya haga (su bucle sigue debajo, sin saltos).
      const a = c.animate(k, { duration: 140, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards", composite: "add" });
      c._presion = a;
      const soltar = () => {
        removeEventListener("pointerup", soltar, true);
        removeEventListener("pointercancel", soltar, true);
        if (c._presion !== a) return;
        const vuelta = c.animate([k[1], k[0]], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)", composite: "add" });
        a.cancel();
        c._presion = vuelta;
        vuelta.onfinish = () => { if (c._presion === vuelta) c._presion = null; };
      };
      addEventListener("pointerup", soltar, true);
      addEventListener("pointercancel", soltar, true);
    } catch (err) { /* nada */ }
  };
})(window.LibritoRT = window.LibritoRT || {});

/*
 * LIBRITO · álbumes y carruseles
 *
 * Las fotos SIEMPRE las pone quien edita: aquí sólo se decide cómo se
 * enseñan. Ligeros a propósito: sólo se piden las fotos que se ven (y la
 * de al lado), el carrusel se para si la pestaña no está a la vista y todo
 * lo que se mueve es `transform` y `opacity`.
 */
(function (RT) {
  "use strict";
  const h = RT.h;
  RT.componentes = RT.componentes || {};

  function azar(semilla) {
    let s = 0;
    for (let i = 0; i < semilla.length; i++) s = (s * 31 + semilla.charCodeAt(i)) | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fotosDe(lista, ctx) {
    const r = [];
    for (const id of lista || []) { const u = ctx.url(id); if (u) r.push(u); }
    return r;
  }

  function vacio(c, ctx, e, texto) {
    c.textContent = "";
    if (ctx.modo !== "editor") return null;
    const v = h("div", "rt-vacio", c);
    v.innerHTML = `<span>＋</span><b>${texto}</b>`;
    v.dataset.pedir = e.id;
    return null;
  }

  function imagen(padre, url, perezosa) {
    const i = h("img", "", padre);
    i.decoding = "async"; i.draggable = false; i.alt = "";
    if (perezosa) i.loading = "lazy";
    i.src = url;
    return i;
  }

  /* ── Álbum ──────────────────────────────────────────────────────── */
  RT.componentes.album = function (c, e, ctx) {
    const a = e.album || {};
    const urls = fotosDe(a.fotos, ctx);
    if (!urls.length) return vacio(c, ctx, e, "Añadir fotos al álbum");
    c.textContent = "";
    const disp = a.disposicion || "cuadricula";
    const w = h("div", "rt-album rt-al-" + disp + " rt-marco-" + (a.marco || "ninguno"), c);
    w.style.setProperty("--gap", RT.num(a.espacio, 8) + "px");
    w.style.setProperty("--cols", Math.max(1, RT.num(a.columnas, 2)));
    w.style.setProperty("--radio", RT.num(a.radio, 10) + "px");
    w.style.setProperty("--prop", a.proporcion && a.proporcion !== "libre" ? a.proporcion : "auto");
    if (a.direccion === "vertical") w.classList.add("rt-al-vertical");
    const items = [];
    const rnd = azar(e.id);
    const n = urls.length;
    urls.forEach(function (u, i) {
      const f = h("figure", "rt-al-foto", w);
      imagen(f, u, ctx.modo !== "editor");
      f.style.setProperty("--i", i);
      if (disp === "polaroids") {
        const cols = Math.ceil(Math.sqrt(n * (e.w / Math.max(1, e.h))));
        const filas = Math.ceil(n / cols);
        const cw = 100 / cols, ch = 100 / filas;
        const x = (i % cols) * cw + cw / 2 + (rnd() - 0.5) * cw * 0.35;
        const y = Math.floor(i / cols) * ch + ch / 2 + (rnd() - 0.5) * ch * 0.3;
        f.style.left = x + "%"; f.style.top = y + "%";
        f.style.setProperty("--rot", ((rnd() - 0.5) * 18).toFixed(1) + "deg");
        f.style.width = Math.min(70, 118 / cols) + "%";
      } else if (disp === "pila") {
        f.style.setProperty("--rot", ((rnd() - 0.5) * 14).toFixed(1) + "deg");
        f.style.zIndex = n - i;
      } else if (disp === "mosaico" && i % 5 === 0) f.classList.add("rt-al-grande");
      items.push(f);
    });

    const vida = { destruir: function () {} };
    if (ctx.modo !== "vista") return vida;

    let quitar = null;
    if (disp === "pila") {
      const orden = items.map(function (_, j) { return j; });
      const pasar = function () {
        const f = items[orden[0]];
        f.animate([{ transform: "translate(-50%,-50%) rotate(var(--rot))" }, { transform: "translate(30%,-70%) rotate(16deg)", opacity: 0.3, offset: 0.5 }, { transform: "translate(-50%,-50%) rotate(var(--rot))" }], { duration: 650, easing: "cubic-bezier(.3,.7,.3,1)" });
        setTimeout(function () { orden.push(orden.shift()); orden.forEach(function (j, pos) { items[j].style.zIndex = n - pos; }); }, 320);
      };
      w.addEventListener("click", pasar);
      quitar = function () { w.removeEventListener("click", pasar); };
    } else if (a.ampliar !== false) {
      const abrir = function (ev) {
        const f = ev.target.closest(".rt-al-foto");
        if (f) RT.ampliar(urls, items.indexOf(f));
      };
      w.addEventListener("click", abrir);
      quitar = function () { w.removeEventListener("click", abrir); };
    }
    vida.destruir = function () { if (quitar) quitar(); };
    vida.entrar = function (animador) {
      const cas = a.cascada || {};
      if (!cas.tipo || cas.tipo === "ninguna") return 0;
      const base = RT.finEntrada(e) || 0;
      const paso = RT.num(cas.paso, 110), dur = RT.num(cas.dur, 650);
      items.forEach(function (f, i) {
        const def = RT.ANIM.entrada[cas.tipo];
        if (def && def.f) animador._anim(f, def.f({ dir: cas.dir || "arriba", dist: 30, escala: 0.7, giro: 25 }), { duration: dur, delay: base + i * paso, easing: "cubic-bezier(.22,.8,.26,1)", fill: "both" });
      });
      return base + (n - 1) * paso + dur;
    };
    return vida;
  };

  /* ── Carrusel ───────────────────────────────────────────────────── */
  RT.componentes.carrusel = function (c, e, ctx) {
    const k = e.carrusel || {};
    const urls = fotosDe(k.fotos, ctx);
    if (!urls.length) return vacio(c, ctx, e, "Añadir fotos al carrusel");
    c.textContent = "";
    const modo = k.modo || "deslizar";
    const vertical = k.direccion === "vertical";
    const n = urls.length;
    const vel = RT.num(k.velocidad, 600);
    const w = h("div", "rt-car rt-car-" + modo + (vertical ? " rt-car-v" : ""), c);
    w.style.setProperty("--gap", RT.num(k.espacio, 0) + "px");
    w.style.setProperty("--radio", RT.num(k.radio, 12) + "px");
    w.style.setProperty("--vel", vel + "ms");
    w.setAttribute("data-claim-drag", "");
    const pista = h("div", "rt-car-pista", w);
    const slides = urls.map(function (u) {
      const d = h("div", "rt-car-d", pista);
      d._url = u;
      return d;
    });
    let puntos = null;
    if (k.puntos !== false && n > 1) {
      puntos = h("div", "rt-car-puntos", w);
      for (let i = 0; i < n; i++) h("i", "", puntos);
    }
    let i = Math.min(n - 1, Math.max(0, RT.num(k.inicio, 0)));

    function cargar(j) {
      const d = slides[((j % n) + n) % n];
      if (d && !d.firstChild) { const im = imagen(d, d._url, false); im.style.objectFit = k.ajuste || "cover"; }
    }

    function pintar(arrastre) {
      const off = arrastre || 0;
      cargar(i); cargar(i + 1); cargar(i - 1);
      if (modo === "deslizar") {
        const pct = -i * 100;
        pista.style.transform = vertical
          ? `translateY(calc(${pct}% - ${i} * var(--gap) + ${off}px))`
          : `translateX(calc(${pct}% - ${i} * var(--gap) + ${off}px))`;
      } else {
        slides.forEach(function (d, j) {
          let dd = j - i;
          if (k.bucle !== false && n > 2) { if (dd > n / 2) dd -= n; if (dd < -n / 2) dd += n; }
          if (modo === "fundido") { d.classList.toggle("rt-act", dd === 0); return; }
          const ad = Math.abs(dd);
          const desp = dd * 58 + (off / Math.max(1, e.w)) * 60;
          d.style.transform = vertical
            ? `translateY(${desp}%) scale(${1 - Math.min(ad, 3) * 0.16})`
            : `translateX(${desp}%) scale(${1 - Math.min(ad, 3) * 0.16}) rotateY(${-dd * 22}deg)`;
          d.style.zIndex = 20 - ad;
          d.style.opacity = ad > 2 ? 0 : 1 - ad * 0.28;
        });
      }
      if (puntos) for (let j = 0; j < n; j++) puntos.children[j].classList.toggle("rt-act", j === i);
    }

    function ir(j) {
      if (k.bucle !== false) i = ((j % n) + n) % n;
      else i = Math.max(0, Math.min(n - 1, j));
      pintar();
    }
    pintar();

    const vida = { destruir: function () {} };
    if (ctx.modo !== "vista" || n < 2) return vida;

    if (k.flechas) {
      const a = h("button", "rt-car-f rt-car-ant", w); a.type = "button"; a.textContent = "‹";
      const b = h("button", "rt-car-f rt-car-sig", w); b.type = "button"; b.textContent = "›";
      a.addEventListener("click", function () { ir(i - 1); reiniciar(); });
      b.addEventListener("click", function () { ir(i + 1); reiniciar(); });
    }

    let reloj = null;
    function reiniciar() {
      if (reloj) clearInterval(reloj);
      reloj = null;
      if (k.auto !== false) reloj = setInterval(function () { if (!document.hidden) ir(i + 1); }, Math.max(1200, RT.num(k.intervalo, 3200)));
    }
    reiniciar();

    let x0 = null, y0 = 0, mov = 0;
    function abajo(ev) { x0 = ev.clientX; y0 = ev.clientY; mov = 0; w.classList.add("rt-arrastra"); try { w.setPointerCapture(ev.pointerId); } catch (err) { /* nada */ } ev.stopPropagation(); }
    function mueve(ev) {
      if (x0 == null) return;
      const esc = (w.getBoundingClientRect().width / Math.max(1, w.offsetWidth)) || 1;
      mov = (vertical ? ev.clientY - y0 : ev.clientX - x0) / esc;
      pintar(mov);
    }
    function arriba() {
      if (x0 == null) return;
      x0 = null; w.classList.remove("rt-arrastra");
      if (Math.abs(mov) > 40) ir(i + (mov < 0 ? 1 : -1)); else pintar();
      reiniciar();
    }
    w.addEventListener("pointerdown", abajo);
    w.addEventListener("pointermove", mueve);
    w.addEventListener("pointerup", arriba);
    w.addEventListener("pointercancel", arriba);
    vida.destruir = function () { if (reloj) clearInterval(reloj); };
    return vida;
  };

  /* ── Ver una foto en grande ─────────────────────────────────────── */
  RT.ampliar = function (urls, i) {
    if (!urls || !urls.length) return;
    const capa = h("div", "rt-ampliar", document.body);
    const img = h("img", "", capa);
    img.alt = "";
    const cerrar = h("button", "rt-amp-x", capa); cerrar.type = "button"; cerrar.textContent = "✕"; cerrar.setAttribute("aria-label", "Cerrar");
    let j = i || 0;
    function poner() { img.src = urls[(j + urls.length) % urls.length]; }
    poner();
    let x0 = null;
    capa.addEventListener("pointerdown", function (ev) { x0 = ev.clientX; ev.stopPropagation(); });
    capa.addEventListener("pointerup", function (ev) {
      if (x0 == null) return;
      const d = ev.clientX - x0; x0 = null;
      if (Math.abs(d) > 50 && urls.length > 1) { j += d < 0 ? 1 : -1; poner(); }
      else if (ev.target !== img) fin();
    });
    function tecla(ev) {
      if (ev.key === "Escape") fin();
      else if (ev.key === "ArrowRight") { j++; poner(); }
      else if (ev.key === "ArrowLeft") { j--; poner(); }
      ev.stopPropagation();
    }
    function fin() { document.removeEventListener("keydown", tecla, true); capa.classList.add("rt-fuera"); setTimeout(function () { capa.remove(); }, 260); }
    cerrar.addEventListener("click", fin);
    document.addEventListener("keydown", tecla, true);
    requestAnimationFrame(function () { capa.classList.add("rt-dentro"); });
  };
})(window.LibritoRT = window.LibritoRT || {});

/*
 * LIBRITO · escenas 3D (WebGL2)
 *
 * El elemento «Escena 3D» dibuja con WebGL2 una figura (corazón, esfera,
 * toro, estrella…) o un modelo tuyo (.glb, .gltf o .obj, con sus colores,
 * texturas y animaciones), con su material, su luz y una cámara que se gira
 * con el dedo y se acerca con dos.
 *
 * Usa three.js (el que ya vive en vendor/three) y SÓLO se descarga cuando
 * una página tiene una escena 3D. Cada escena:
 *   · no dibuja nada si no se ve (fuera de pantalla o en otra pestaña),
 *   · dibuja una sola vez si está quieta (sin girar ni animarse),
 *   · suelta su memoria de la tarjeta gráfica al quitarla de la página.
 *
 * Si el aparato no tiene WebGL2, lo dice en vez de quedarse en blanco.
 */
(function (RT) {
  "use strict";
  const h = RT.h;

  // Dónde está three.js: junto al editor (EditorDev/runtime → ../../vendor)
  // o junto al librito exportado (scripts/librito.js → ../vendor).
  const yo = document.currentScript && document.currentScript.src;
  if (!RT.rutaThree) {
    try { RT.rutaThree = new URL(/\/runtime\/rt-3d\.js(\?|$)/.test(yo || "") ? "../../vendor/three/three.module.min.js" : "../vendor/three/three.module.min.js", yo || location.href).href; }
    catch (e) { RT.rutaThree = "vendor/three/three.module.min.js"; }
  }
  let promesa = null;
  RT.cargarThree = function () { return promesa || (promesa = import(RT.rutaThree)); };
  RT.hayWebGL2 = function () { return typeof WebGL2RenderingContext !== "undefined"; };

  RT.FIGURAS3D = {
    corazon: "Corazón", esfera: "Esfera", cubo: "Cubo", toro: "Dona", nudo: "Nudo", estrella: "Estrella",
    diamante: "Diamante", anillo: "Anillo", cono: "Cono", cilindro: "Cilindro", capsula: "Cápsula",
  };

  /* ── Figuras ────────────────────────────────────────────────────── */
  function figura(T, nombre) {
    const ext = { depth: 0.42, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 5, curveSegments: 28 };
    switch (nombre) {
      case "esfera": return new T.SphereGeometry(1, 64, 40);
      case "cubo": return new T.BoxGeometry(1.4, 1.4, 1.4, 2, 2, 2);
      case "toro": return new T.TorusGeometry(0.8, 0.32, 40, 120);
      case "nudo": return new T.TorusKnotGeometry(0.62, 0.2, 200, 28);
      case "diamante": return new T.OctahedronGeometry(1, 0);
      case "anillo": return new T.TorusGeometry(0.9, 0.11, 24, 120);
      case "cono": return new T.ConeGeometry(0.8, 1.6, 64);
      case "cilindro": return new T.CylinderGeometry(0.75, 0.75, 1.5, 64);
      case "capsula": return T.CapsuleGeometry ? new T.CapsuleGeometry(0.55, 0.9, 12, 32) : new T.SphereGeometry(1, 48, 32);
      case "estrella": {
        const s = new T.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 0.45 : 1, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
          if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        s.closePath();
        return new T.ExtrudeGeometry(s, { ...ext, depth: 0.3 });
      }
      default: {
        // Corazón: la curva clásica, de punta hacia abajo.
        const s = new T.Shape();
        s.moveTo(0.5, 0.5);
        s.bezierCurveTo(0.5, 0.5, 0.4, 0, 0, 0);
        s.bezierCurveTo(-0.6, 0, -0.6, 0.7, -0.6, 0.7);
        s.bezierCurveTo(-0.6, 1.1, -0.3, 1.54, 0.5, 1.9);
        s.bezierCurveTo(1.2, 1.54, 1.6, 1.1, 1.6, 0.7);
        s.bezierCurveTo(1.6, 0.7, 1.6, 0, 1.0, 0);
        s.bezierCurveTo(0.7, 0, 0.5, 0.5, 0.5, 0.5);
        const g = new T.ExtrudeGeometry(s, ext);
        g.rotateZ(Math.PI);
        return g;
      }
    }
  }

  /** Centrado y del mismo tamaño siempre (cabe en una esfera de radio 1). */
  function normalizar(T, obj) {
    const caja = new T.Box3().setFromObject(obj);
    if (caja.isEmpty()) return obj;
    const c = caja.getCenter(new T.Vector3());
    const r = caja.getBoundingSphere(new T.Sphere()).radius || 1;
    const g = new T.Group();
    obj.position.sub(c);
    g.add(obj);
    g.scale.setScalar(1 / r);
    return g;
  }

  /* ── glTF / GLB (lector propio, pequeño) ───────────────────────── */
  const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  function leer(dv, o, ct) {
    switch (ct) {
      case 5120: return dv.getInt8(o);
      case 5121: return dv.getUint8(o);
      case 5122: return dv.getInt16(o, true);
      case 5123: return dv.getUint16(o, true);
      case 5125: return dv.getUint32(o, true);
      default: return dv.getFloat32(o, true);
    }
  }

  async function cargarGLTF(T, buf, base) {
    let json = null, bin = null;
    const dv = new DataView(buf);
    if (buf.byteLength > 12 && dv.getUint32(0, true) === 0x46546c67) {
      let o = 12;
      while (o + 8 <= buf.byteLength) {
        const largo = dv.getUint32(o, true), tipo = dv.getUint32(o + 4, true);
        const datos = buf.slice(o + 8, o + 8 + largo);
        if (tipo === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(datos));
        else if (tipo === 0x004e4942) bin = datos;
        o += 8 + largo;
      }
    } else json = JSON.parse(new TextDecoder().decode(buf));
    if (!json) throw new Error("No es un glTF");
    const buffers = await Promise.all((json.buffers || []).map(async (b) => {
      if (!b.uri) return bin;
      return (await fetch(/^data:/.test(b.uri) ? b.uri : new URL(b.uri, base).href)).arrayBuffer();
    }));
    const accesor = (i) => {
      const a = json.accessors[i];
      const C = COMP[a.componentType], n = NUM[a.type];
      let arr;
      if (a.bufferView == null) arr = new C(a.count * n);
      else {
        const v = json.bufferViews[a.bufferView];
        const b = buffers[v.buffer];
        const o = (v.byteOffset || 0) + (a.byteOffset || 0);
        const tam = C.BYTES_PER_ELEMENT;
        if (v.byteStride && v.byteStride !== n * tam) {
          arr = new C(a.count * n);
          const d = new DataView(b);
          for (let k = 0; k < a.count; k++) for (let j = 0; j < n; j++) arr[k * n + j] = leer(d, o + k * v.byteStride + j * tam, a.componentType);
        } else arr = new C(b.slice(o, o + a.count * n * tam));
      }
      return { arr, n, norm: !!a.normalized };
    };
    const texturas = new Map();
    const textura = async (i, srgb) => {
      const k = i + ":" + srgb;
      if (texturas.has(k)) return texturas.get(k);
      const tx = json.textures[i];
      const im = json.images[tx.source];
      let blob;
      if (im.bufferView != null) {
        const v = json.bufferViews[im.bufferView];
        blob = new Blob([buffers[v.buffer].slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength)], { type: im.mimeType || "image/png" });
      } else blob = await (await fetch(/^data:/.test(im.uri) ? im.uri : new URL(im.uri, base).href)).blob();
      const bm = await createImageBitmap(blob, { imageOrientation: "none" });
      const t = new T.Texture(bm);
      t.flipY = false;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      const s = json.samplers?.[tx.sampler];
      if (s) { t.wrapS = s.wrapS === 33071 ? T.ClampToEdgeWrapping : s.wrapS === 33648 ? T.MirroredRepeatWrapping : T.RepeatWrapping; t.wrapT = s.wrapT === 33071 ? T.ClampToEdgeWrapping : s.wrapT === 33648 ? T.MirroredRepeatWrapping : T.RepeatWrapping; }
      t.needsUpdate = true;
      texturas.set(k, t);
      return t;
    };
    const materiales = new Map();
    const material = async (i) => {
      if (materiales.has(i)) return materiales.get(i);
      const m = json.materials[i] || {};
      const p = m.pbrMetallicRoughness || {};
      const c = p.baseColorFactor || [1, 1, 1, 1];
      const mat = new T.MeshStandardMaterial({
        metalness: p.metallicFactor ?? 1, roughness: p.roughnessFactor ?? 1,
        side: m.doubleSided ? T.DoubleSide : T.FrontSide,
        transparent: m.alphaMode === "BLEND", opacity: c[3] ?? 1, alphaTest: m.alphaMode === "MASK" ? m.alphaCutoff ?? 0.5 : 0,
      });
      mat.color.setRGB(c[0], c[1], c[2], T.LinearSRGBColorSpace);
      if (p.baseColorTexture) mat.map = await textura(p.baseColorTexture.index, true);
      if (p.metallicRoughnessTexture) mat.metalnessMap = mat.roughnessMap = await textura(p.metallicRoughnessTexture.index, false);
      if (m.normalTexture) mat.normalMap = await textura(m.normalTexture.index, false);
      if (m.emissiveTexture) mat.emissiveMap = await textura(m.emissiveTexture.index, true);
      if (m.emissiveFactor) mat.emissive.setRGB(m.emissiveFactor[0], m.emissiveFactor[1], m.emissiveFactor[2], T.LinearSRGBColorSpace);
      materiales.set(i, mat);
      return mat;
    };
    const malla = async (mi) => {
      const g = new T.Group();
      for (const p of json.meshes[mi].primitives) {
        const geo = new T.BufferGeometry();
        for (const [nom, ai] of Object.entries(p.attributes)) {
          const k = { POSITION: "position", NORMAL: "normal", TEXCOORD_0: "uv", COLOR_0: "color" }[nom];
          if (!k) continue;
          const a = accesor(ai);
          geo.setAttribute(k, new T.BufferAttribute(a.arr, a.n, a.norm));
        }
        if (p.indices != null) geo.setIndex(new T.BufferAttribute(accesor(p.indices).arr, 1));
        if (!geo.attributes.normal) geo.computeVertexNormals();
        let mat = p.material != null ? await material(p.material) : new T.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
        if (geo.attributes.color) { mat = mat.clone(); mat.vertexColors = true; }
        const modo = p.mode ?? 4;
        g.add(modo === 4 || modo == null ? new T.Mesh(geo, mat) : modo === 0 ? new T.Points(geo, new T.PointsMaterial({ color: mat.color, size: 0.02 })) : new T.LineSegments(geo, new T.LineBasicMaterial({ color: mat.color })));
      }
      return g;
    };
    const nodos = [];
    const nodo = async (i) => {
      const nd = json.nodes[i];
      const o = nd.mesh != null ? await malla(nd.mesh) : new T.Object3D();
      o.name = nd.name || "";
      if (nd.matrix) { const m = new T.Matrix4().fromArray(nd.matrix); m.decompose(o.position, o.quaternion, o.scale); }
      else {
        if (nd.translation) o.position.fromArray(nd.translation);
        if (nd.rotation) o.quaternion.fromArray(nd.rotation);
        if (nd.scale) o.scale.fromArray(nd.scale);
      }
      nodos[i] = o;
      for (const c of nd.children || []) o.add(await nodo(c));
      return o;
    };
    const esc = json.scenes?.[json.scene || 0];
    const hijos = new Set((json.nodes || []).flatMap((n) => n.children || []));
    const raices = esc ? esc.nodes : (json.nodes || []).map((_, i) => i).filter((i) => !hijos.has(i));
    const raiz = new T.Group();
    for (const i of raices) raiz.add(await nodo(i));
    const clips = (json.animations || []).map((an, k) => {
      const pistas = [];
      for (const ch of an.channels) {
        const s = an.samplers[ch.sampler];
        const o = nodos[ch.target.node];
        if (!o || !/translation|rotation|scale/.test(ch.target.path)) continue;
        const t = accesor(s.input).arr;
        let v = accesor(s.output).arr;
        const n = ch.target.path === "rotation" ? 4 : 3;
        if (s.interpolation === "CUBICSPLINE") { const w = new Float32Array(t.length * n); for (let j = 0; j < t.length; j++) for (let q = 0; q < n; q++) w[j * n + q] = v[j * 3 * n + n + q]; v = w; }
        else if (!(v instanceof Float32Array)) v = Float32Array.from(v);
        const interp = s.interpolation === "STEP" ? T.InterpolateDiscrete : T.InterpolateLinear;
        const Pista = ch.target.path === "rotation" ? T.QuaternionKeyframeTrack : T.VectorKeyframeTrack;
        pistas.push(new Pista(o.uuid + "." + { translation: "position", rotation: "quaternion", scale: "scale" }[ch.target.path], Float32Array.from(t), v, interp));
      }
      return new T.AnimationClip(an.name || "animación " + (k + 1), -1, pistas);
    });
    return { raiz, clips };
  }

  /* ── OBJ ────────────────────────────────────────────────────────── */
  function cargarOBJ(T, texto, mat) {
    const v = [], vn = [], vt = [], pos = [], nor = [], uv = [];
    for (const linea of texto.split(/\r?\n/)) {
      const p = linea.trim().split(/\s+/);
      if (p[0] === "v") v.push(+p[1], +p[2], +p[3]);
      else if (p[0] === "vn") vn.push(+p[1], +p[2], +p[3]);
      else if (p[0] === "vt") vt.push(+p[1], +p[2]);
      else if (p[0] === "f") {
        const c = p.slice(1).map((x) => x.split("/").map((q) => (q ? parseInt(q, 10) : 0)));
        const idx = (q, lista, n) => (q < 0 ? lista.length / n + q : q - 1);
        for (let i = 1; i < c.length - 1; i++) for (const k of [c[0], c[i], c[i + 1]]) {
          const a = idx(k[0], v, 3); pos.push(v[a * 3], v[a * 3 + 1], v[a * 3 + 2]);
          if (k[1]) { const b = idx(k[1], vt, 2); uv.push(vt[b * 2], vt[b * 2 + 1]); }
          if (k[2]) { const d = idx(k[2], vn, 3); nor.push(vn[d * 3], vn[d * 3 + 1], vn[d * 3 + 2]); }
        }
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    if (nor.length === pos.length) geo.setAttribute("normal", new T.Float32BufferAttribute(nor, 3)); else geo.computeVertexNormals();
    if (uv.length / 2 === pos.length / 3) geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    return new T.Mesh(geo, mat);
  }

  /* ── La escena de un elemento ───────────────────────────────────── */
  class Escena {
    constructor(lienzo, e, ctx) {
      this.lienzo = lienzo;
      this.ctx = ctx;
      this.e = e;
      this.vivo = true;
      this.visible = true;
      this.usr = { x: 0, y: 0, z: 1 };
      this._carga = 0;
      if (!RT.hayWebGL2()) { this._aviso("Este aparato no tiene WebGL2: la escena 3D no se puede mostrar."); return; }
      RT.cargarThree().then((T) => { if (this.vivo) this._montar(T); }).catch((err) => { console.warn(err); this._aviso("No se pudo cargar el motor 3D."); });
    }

    _aviso(t) {
      const c = this.lienzo.parentNode;
      if (!c) return;
      const a = h("div", "rt-marcador rt-3d-aviso", c);
      a.textContent = t;
    }

    _montar(T) {
      this.T = T;
      const r = new T.WebGLRenderer({ canvas: this.lienzo, antialias: true, alpha: true, powerPreference: "low-power" });
      r.outputColorSpace = T.SRGBColorSpace;
      r.toneMapping = T.ACESFilmicToneMapping;
      this.r = r;
      this.escena = new T.Scene();
      this.cam = new T.PerspectiveCamera(32, 1, 0.05, 50);
      this.cam.position.set(0, 0, 4.2);
      this.cielo = new T.HemisphereLight(0xffffff, 0x8a7a9a, 0.8);
      this.sol = new T.DirectionalLight(0xffffff, 1.4);
      this.sol.position.set(2.5, 3.5, 4);
      this.contra = new T.DirectionalLight(0xffd6e8, 0.45);
      this.contra.position.set(-3, -1, -2);
      this.escena.add(this.cielo, this.sol, this.contra);
      this.pivote = new T.Group();
      this.escena.add(this.pivote);
      this.reloj = new T.Clock();
      this.ro = new ResizeObserver(() => this._medir());
      this.ro.observe(this.lienzo);
      this.io = new IntersectionObserver((xs) => { this.visible = xs.some((x) => x.isIntersecting); this._pedir(); });
      this.io.observe(this.lienzo);
      this._vis = () => this._pedir();
      document.addEventListener("visibilitychange", this._vis);
      this._dedos();
      this._medir();
      this._cargar();
      this.actualizar(this.e);
    }

    async _cargar() {
      const T = this.T;
      const d = this.e.escena3d || {};
      const n = ++this._carga;
      this._clave = clave(this.e);
      this._quitarModelo();
      let obj = null, clips = [];
      try {
        if (d.fuente === "archivo" && d.asset) {
          const url = this.ctx.url ? this.ctx.url(d.asset) : null;
          if (!url) throw new Error("Falta el modelo");
          const res = await fetch(url);
          const formato = (d.formato || "").toLowerCase();
          if (formato === "obj") obj = cargarOBJ(T, await res.text(), this._material());
          else { const g = await cargarGLTF(T, await res.arrayBuffer(), new URL(url, location.href).href); obj = g.raiz; clips = g.clips; }
          this.propios = formato !== "obj";
        } else {
          obj = new T.Mesh(figura(T, d.figura || "corazon"), this._material());
          this.propios = false;
        }
      } catch (err) {
        console.warn(err);
        obj = new T.Mesh(new T.IcosahedronGeometry(1, 1), new T.MeshStandardMaterial({ color: 0x999999, wireframe: true }));
      }
      if (!this.vivo || n !== this._carga) { tirar(obj); return; }
      this.modelo = normalizar(T, obj);
      this.pivote.add(this.modelo);
      if (clips.length) { this.mixer = new T.AnimationMixer(this.modelo); this.acciones = clips.map((c) => this.mixer.clipAction(c)); }
      this.actualizar(this.e);
    }

    _material() {
      const d = this.e.escena3d || {};
      return new this.T.MeshStandardMaterial({ color: d.color || "#d8397a", metalness: d.metal ?? 0.15, roughness: d.rugosidad ?? 0.4, wireframe: !!d.alambre, flatShading: !!d.plano });
    }

    _quitarModelo() {
      if (this.mixer) { this.mixer.stopAllAction(); this.mixer = null; this.acciones = null; }
      if (this.modelo) { this.pivote.remove(this.modelo); tirar(this.modelo); this.modelo = null; }
    }

    /** Cambió algo (color, luz, giro…): se aplica sin rehacer la escena. */
    actualizar(e) {
      this.e = e;
      if (!this.T) return;
      const T = this.T;
      const d = e.escena3d || {};
      // El elemento cambia «en su sitio»: se compara con lo que se cargó, no con el objeto.
      if (this._clave != null && clave(e) !== this._clave) return this._cargar();
      this.sol.intensity = d.luz ?? 1.4;
      this.sol.color.set(d.luzColor || "#ffffff");
      this.cielo.intensity = d.ambiente ?? 0.7;
      this.escena.background = d.fondo ? new T.Color(d.fondo) : null;
      if (this.modelo) {
        const usarPropios = this.propios && d.colores !== "uno";
        this.modelo.traverse((o) => {
          if (!o.isMesh) return;
          if (!usarPropios) {
            if (!o.material._nuestro) { o.material = this._material(); o.material._nuestro = true; }
            o.material.color.set(d.color || "#d8397a");
            o.material.metalness = d.metal ?? 0.15;
            o.material.roughness = d.rugosidad ?? 0.4;
          }
          o.material.wireframe = !!d.alambre;
          if (o.material.flatShading !== !!d.plano) { o.material.flatShading = !!d.plano; o.material.needsUpdate = true; }
        });
      }
      if (this.acciones) for (const a of this.acciones) { if (d.animar !== false) a.play(); else a.stop(); }
      this._pedir();
    }

    _medir() {
      if (!this.r) return;
      const w = this.lienzo.clientWidth, hh = this.lienzo.clientHeight;
      if (!w || !hh) return;
      const k = this.ctx.escala ? this.ctx.escala() : 1;
      this.r.setPixelRatio(Math.min(2.5, Math.max(1, (devicePixelRatio || 1) * Math.min(2, k))));
      this.r.setSize(w, hh, false);
      this.cam.aspect = w / hh;
      this.cam.updateProjectionMatrix();
      this._pedir();
    }

    /** Arrastrar = girarla; dos dedos o rueda = acercar (en el librito, o al «Probar aquí»). */
    _dedos() {
      const c = this.lienzo;
      const p = new Map();
      let base = null;
      c.addEventListener("pointerdown", (ev) => {
        if ((this.e.escena3d || {}).orbitar === false) return;
        p.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        try { c.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
        base = null;
        this.tocando = true;
        this._pedir();
      });
      c.addEventListener("pointermove", (ev) => {
        const q = p.get(ev.pointerId);
        if (!q) return;
        if (p.size === 1) {
          this.usr.y += (ev.clientX - q.x) * 0.012;
          this.usr.x = Math.max(-1.4, Math.min(1.4, this.usr.x + (ev.clientY - q.y) * 0.012));
        }
        q.x = ev.clientX; q.y = ev.clientY;
        if (p.size === 2) {
          const [a, b] = [...p.values()];
          const dd = Math.hypot(a.x - b.x, a.y - b.y);
          if (base) this.usr.z = Math.max(0.4, Math.min(3, this.usr.z * (dd / base)));
          base = dd;
        }
        this._pedir();
      });
      const fin = (ev) => { p.delete(ev.pointerId); base = null; if (!p.size) this.tocando = false; };
      c.addEventListener("pointerup", fin);
      c.addEventListener("pointercancel", fin);
      c.addEventListener("wheel", (ev) => { if ((this.e.escena3d || {}).orbitar === false) return; ev.preventDefault(); this.usr.z = Math.max(0.4, Math.min(3, this.usr.z * Math.exp(-ev.deltaY * 0.0015))); this._pedir(); }, { passive: false });
    }

    _pedir() {
      if (!this.vivo || !this.r || this._raf) return;
      this._raf = requestAnimationFrame((t) => this._cuadro(t));
    }

    _cuadro(t) {
      this._raf = 0;
      if (!this.vivo || !this.r) return;
      const d = this.e.escena3d || {};
      const dt = Math.min(0.1, this.reloj.getDelta());
      const mueve = (d.girar || 0) !== 0 || (this.mixer && d.animar !== false) || this.tocando;
      if (!this.visible || document.hidden) return;
      // En el editor, a 30 cuadros: sobra para ver cómo queda.
      if (this.ctx.modo !== "vista" && mueve && t - (this._ult || 0) < 30) { this._raf = requestAnimationFrame((x) => this._cuadro(x)); return; }
      this._ult = t;
      this.giro = (this.giro || 0) + (d.girar || 0) * dt;
      if (this.mixer && d.animar !== false) this.mixer.update(dt);
      this.pivote.rotation.set((d.rotX ?? -0.25) + this.usr.x, (d.rotY ?? 0.5) + this.usr.y + this.giro, 0);
      this.cam.position.z = 4.2 / Math.max(0.2, (d.zoom ?? 1) * this.usr.z);
      this.r.render(this.escena, this.cam);
      if (mueve) this._raf = requestAnimationFrame((x) => this._cuadro(x));
    }

    /** Se quita de la página: suelta todo lo de la tarjeta gráfica. Si en el
        mismo instante se vuelve a pedir (sólo cambió un ajuste), se reusa. */
    destruir() {
      this._muere = true;
      queueMicrotask(() => { if (this._muere) this._destruirYa(); });
    }

    _destruirYa() {
      this.vivo = false;
      cancelAnimationFrame(this._raf);
      this.ro?.disconnect();
      this.io?.disconnect();
      document.removeEventListener("visibilitychange", this._vis);
      this._quitarModelo();
      if (this.r) { this.r.dispose(); try { this.r.forceContextLoss(); } catch (e) { /* nada */ } this.r = null; }
    }
  }

  function clave(e) { const d = e.escena3d || {}; return [d.fuente, d.figura, d.asset, d.colores, d.formato].join("|"); }

  function tirar(obj) {
    obj.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [].concat(o.material || [])) {
        for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"]) m[k]?.dispose?.();
        m.dispose?.();
      }
    });
  }

  RT.componentes = RT.componentes || {};
  RT.componentes.escena3d = function (c, e, ctx, n) {
    if (ctx.modo === "mini") { c.innerHTML = RT.marcador ? RT.marcador("d3", e.nombre || "3D") : '<div class="rt-marcador">3D</div>'; return null; }
    const ya = n && n._rt && n._rt.escena3d;
    if (ya && ya.vivo && ya.lienzo.parentNode === c) { ya._muere = false; ya.actualizar(e); return ya; }
    c.textContent = "";
    const lienzo = h("canvas", "rt-3d", c);
    const esc = new Escena(lienzo, e, ctx);
    if (n && n._rt) n._rt.escena3d = esc;
    return esc;
  };
})(window.LibritoRT = window.LibritoRT || {});

/*
 * LIBRITO · transiciones entre páginas
 *
 * Cada transición dice qué le pasa a la página que se va y a la que llega.
 * La dirección «auto» sigue al dedo: hacia delante entra por la derecha y
 * hacia atrás por la izquierda. Si se fija una, al volver se invierte.
 */
(function (RT) {
  "use strict";

  function vec(dir, d) {
    switch (dir) {
      case "derecha": return [d, 0];
      case "arriba": return [0, -d];
      case "abajo": return [0, d];
      default: return [-d, 0];
    }
  }
  const pct = (v) => `translate(${v[0]}%, ${v[1]}%)`;

  RT.TRANS = {
    ninguna: { n: "Ninguna" },
    fundido: { n: "Fundido", f: () => ({ sale: [{ opacity: 1 }, { opacity: 0 }], entra: [{ opacity: 0 }, { opacity: 1 }] }) },
    disolver: { n: "Disolver", f: () => ({ sale: [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(8px)" }], entra: [{ opacity: 0, filter: "blur(8px) brightness(1.15)" }, { opacity: 1, filter: "blur(0px) brightness(1)" }] }) },
    deslizar: { n: "Deslizar", dir: true, f: (d) => { const v = vec(d, 100); return { sale: [{ opacity: 1 }, { opacity: 0.6 }], entra: [{ transform: pct([-v[0], -v[1]]) }, { transform: "translate(0,0)" }], encima: "entra" }; } },
    empujar: { n: "Desplazamiento", dir: true, f: (d) => { const v = vec(d, 100); return { sale: [{ transform: "translate(0,0)" }, { transform: pct(v) }], entra: [{ transform: pct([-v[0], -v[1]]) }, { transform: "translate(0,0)" }] }; } },
    zoom: { n: "Zoom", f: () => ({ sale: [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.15)" }], entra: [{ opacity: 0, transform: "scale(.88)" }, { opacity: 1, transform: "scale(1)" }] }) },
    voltear: { n: "Voltear", dir: true, f: (d) => {
      const g = d === "derecha" || d === "abajo" ? -1 : 1;
      const eje = d === "arriba" || d === "abajo" ? "rotateX" : "rotateY";
      return {
        sale: [{ transform: `perspective(1400px) ${eje}(0deg)`, opacity: 1 }, { transform: `perspective(1400px) ${eje}(${-90 * g}deg)`, opacity: 1, offset: 0.5 }, { transform: `perspective(1400px) ${eje}(${-90 * g}deg)`, opacity: 0 }],
        entra: [{ transform: `perspective(1400px) ${eje}(${90 * g}deg)`, opacity: 0 }, { transform: `perspective(1400px) ${eje}(${90 * g}deg)`, opacity: 1, offset: 0.5 }, { transform: `perspective(1400px) ${eje}(0deg)`, opacity: 1 }],
      };
    } },
    hoja: { n: "Pasar la hoja", f: (d, atras) => atras
      ? { entra: [{ transform: "perspective(1800px) rotateY(-100deg)", transformOrigin: "left center" }, { transform: "perspective(1800px) rotateY(0deg)", transformOrigin: "left center" }], sale: [{ filter: "brightness(1)" }, { filter: "brightness(.75)" }], encima: "entra" }
      : { sale: [{ transform: "perspective(1800px) rotateY(0deg)", transformOrigin: "left center", filter: "brightness(1)" }, { transform: "perspective(1800px) rotateY(-100deg)", transformOrigin: "left center", filter: "brightness(.8)" }], entra: [{ filter: "brightness(.75)" }, { filter: "brightness(1)" }], encima: "sale" } },
    desenfoque: { n: "Desenfoque", f: () => ({ sale: [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(18px)" }], entra: [{ opacity: 0, filter: "blur(18px)" }, { opacity: 1, filter: "blur(0px)" }] }) },
    circulo: { n: "Círculo", f: () => ({ sale: [{ opacity: 1 }, { opacity: 0.4 }], entra: [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }], encima: "entra" }) },
    cortina: { n: "Cortina", dir: true, f: (d) => {
      const desde = { izquierda: "inset(0 0 0 100%)", derecha: "inset(0 100% 0 0)", arriba: "inset(100% 0 0 0)", abajo: "inset(0 0 100% 0)" }[d] || "inset(0 0 0 100%)";
      return { sale: [{ opacity: 1 }, { opacity: 0.7 }], entra: [{ clipPath: desde }, { clipPath: "inset(0 0 0 0)" }], encima: "entra" };
    } },
    // De cine (Fase 11).
    cine: { n: "Zoom de cine", f: () => ({ sale: [{ opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }, { opacity: 0, transform: "scale(1.28)", filter: "blur(10px) brightness(1.7)" }], entra: [{ opacity: 0, transform: "scale(.86)", filter: "blur(10px) brightness(1.3)" }, { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }], encima: "entra" }) },
    profundidad: { n: "Profundidad 3D", dir: true, f: (d) => { const s = d === "derecha" || d === "abajo" ? -1 : 1, eje = d === "arriba" || d === "abajo" ? "X" : "Y"; return { sale: [{ opacity: 1, transform: "perspective(1400px) translateZ(0px) rotate" + eje + "(0deg)", filter: "brightness(1)" }, { opacity: 0, transform: `perspective(1400px) translateZ(-520px) rotate${eje}(${-22 * s}deg)`, filter: "brightness(.6)" }], entra: [{ opacity: 0, transform: `perspective(1400px) translateZ(260px) rotate${eje}(${18 * s}deg)` }, { opacity: 1, transform: "perspective(1400px) translateZ(0px) rotate" + eje + "(0deg)" }], encima: "entra" }; } },
    paralaje: { n: "Paralaje", dir: true, f: (d) => { const v = vec(d, 100); return { sale: [{ transform: "translate(0,0)", filter: "brightness(1)" }, { transform: pct([v[0] * 0.3, v[1] * 0.3]), filter: "brightness(.62)" }], entra: [{ transform: pct([-v[0], -v[1]]), boxShadow: "0 0 40px rgba(0,0,0,.35)" }, { transform: "translate(0,0)", boxShadow: "0 0 0 rgba(0,0,0,0)" }], encima: "entra" }; } },
    destello: { n: "Destello de luz", f: () => ({ sale: [{ opacity: 1, filter: "brightness(1) saturate(1)" }, { opacity: 0, filter: "brightness(3.5) saturate(.4)" }], entra: [{ opacity: 0, filter: "brightness(3.5) saturate(.4)" }, { opacity: 1, filter: "brightness(1) saturate(1)" }], encima: "entra" }) },
    remolino: { n: "Remolino", f: () => ({ sale: [{ opacity: 1, transform: "rotate(0deg) scale(1)", filter: "blur(0px)" }, { opacity: 0, transform: "rotate(-28deg) scale(.55)", filter: "blur(6px)" }], entra: [{ opacity: 0, transform: "rotate(24deg) scale(1.35)", filter: "blur(6px)" }, { opacity: 1, transform: "rotate(0deg) scale(1)", filter: "blur(0px)" }], encima: "entra" }) },
    personalizada: { n: "Personalizada", dir: false, f: (d, atras, p) => {
      p = p || {};
      const g = atras ? -1 : 1;
      const x = RT.num(p.x, 30) * g, y = RT.num(p.y, 0) * g, s = RT.num(p.escala, 0.95), r = RT.num(p.rot, 0) * g, o = RT.num(p.opacidad, 0), b = RT.num(p.desenfoque, 0);
      return {
        entra: [{ transform: `translate(${x}%, ${y}%) scale(${s}) rotate(${r}deg)`, opacity: o, filter: `blur(${b}px)` }, { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, filter: "blur(0px)" }],
        sale: [{ transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, filter: "blur(0px)" }, { transform: `translate(${-x}%, ${-y}%) scale(${2 - s}) rotate(${-r}deg)`, opacity: o, filter: `blur(${b}px)` }],
      };
    } },
  };

  /* Animaciones y transiciones propias (de assets/animaciones, assets/transiciones
     o escritas en el editor): viajan DENTRO del proyecto (ajustes.extras) como
     fotogramas, así el librito exportado no necesita las carpetas. */
  RT.registrarExtras = function (aj) {
    const x = aj && aj.extras;
    if (!x) return;
    for (const id in x.animaciones || {}) {
      const a = x.animaciones[id];
      const fase = RT.ANIM[a.fase] ? a.fase : "entrada";
      const k = a.fotogramas;
      if (!Array.isArray(k) || !k.length) continue;
      RT.ANIM[fase][id] = { n: a.n || id, propia: true, lineal: !!a.lineal, f: () => k };
    }
    for (const id in x.transiciones || {}) {
      const t = x.transiciones[id];
      if (!t || (!t.entra && !t.sale)) continue;
      RT.TRANS[id] = { n: t.n || id, propia: true, f: () => ({ entra: t.entra || null, sale: t.sale || null, encima: t.encima || "entra" }) };
    }
  };

  const DIR_INV = { izquierda: "derecha", derecha: "izquierda", arriba: "abajo", abajo: "arriba" };

  /** Pasa de `viejo` a `nuevo`. Se cumple cuando acaba (o enseguida si no hay). */
  RT.transicion = function (viejo, nuevo, cfg, atras) {
    cfg = cfg || {};
    const def = RT.TRANS[cfg.tipo] || RT.TRANS.fundido;
    if (!viejo || !def.f || !nuevo.animate) return Promise.resolve();
    let dir = cfg.dir && cfg.dir !== "auto" ? cfg.dir : "izquierda";
    if (atras) dir = DIR_INV[dir] || dir;
    const k = def.f(dir, !!atras, cfg.propia);
    let dur = RT.num(cfg.dur, 700);
    if (RT.menosMovimiento()) dur = Math.min(dur, 250);
    const op = { duration: dur, easing: (RT.FACIL[cfg.facil] || RT.FACIL.entraSale).v, fill: "both" };
    viejo.style.zIndex = k.encima === "sale" ? 2 : 1;
    nuevo.style.zIndex = k.encima === "sale" ? 1 : 2;
    const anims = [];
    try {
      if (k.sale) anims.push(viejo.animate(k.sale, op));
      if (k.entra) anims.push(nuevo.animate(k.entra, op));
    } catch (err) { return Promise.resolve(); }
    return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => {
      for (const a of anims) { try { a.cancel(); } catch (err) { /* nada */ } }
      nuevo.style.zIndex = "";
    });
  };
})(window.LibritoRT = window.LibritoRT || {});

/**
 * EFECTOS AL TOCAR Y ZONAS TÁCTILES — lo que pasa cuando ella toca algo.
 *
 *   e.toque      = { efecto, mov, color, cantidad }
 *                  efecto: partículas u ondas que salen del dedo
 *                  mov:    lo que hace el propio elemento (latido, rebote…)
 *   e.zonas      = [{ id, nombre, x, y, w, h, efecto, mov, color, cantidad,
 *                     sonido, volumen, accion }]
 *                  rectángulos relativos (0..1) dentro del elemento. En el
 *                  librito son invisibles; cada uno hace lo suyo. Como viven
 *                  dentro del elemento, se mueven, giran y escalan con él.
 *   pagina.toque = { efecto, color, cantidad }   cualquier toque en la hoja
 *
 * Todo se dibuja en una capa fija encima de la pantalla que nunca recibe
 * toques, con animaciones del navegador (sin bucles propios) y con un tope
 * de piezas a la vez: no se traba ni con muchos toques seguidos.
 */
(function (RT) {
  "use strict";

  RT.TOQUES = [
    ["", "Nada"], ["ondas", "Ondas"], ["corazones", "Corazones"], ["chispas", "Destellos"],
    ["estrellas", "Estrellitas"], ["confeti", "Confeti"], ["burbujas", "Burbujas"], ["teamo", "«Te amo»"],
    ["besos", "Besitos"], ["petalos", "Pétalos"],
  ];
  RT.MOVS = [
    ["", "Nada"], ["pulso", "Latido"], ["rebote", "Rebote"], ["saltito", "Saltito"], ["sacudir", "Sacudida"],
    ["girar", "Giro"], ["crecer", "Crecer"], ["brillo", "Brillo"], ["color", "Color"], ["desvanecer", "Opacidad"],
    ["flotar", "Flotar"],
  ];

  const CORAZON = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.5 1.2 4.3 2.4.8-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>';
  const DESTELLO = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" fill="currentColor"/></svg>';
  const ESTRELLA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9z" fill="currentColor"/></svg>';
  const BESO = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M1.5 11.5C4 8 6.6 6.4 8.8 6.4c1.3 0 2.4.7 3.2 1.6.8-.9 1.9-1.6 3.2-1.6 2.2 0 4.8 1.6 7.3 5.1-2.7 4-6.3 6.6-10.5 6.6S4.2 15.5 1.5 11.5z" fill="currentColor"/><path d="M3.6 11.6c3 .8 5.7 1.1 8.4 1.1s5.4-.3 8.4-1.1" stroke="rgba(0,0,0,.32)" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>';
  const PETALO = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 1.5c4.6 3.4 6.8 7.6 6.8 11.6a6.8 6.8 0 0 1-13.6 0c0-4 2.2-8.2 6.8-11.6z" fill="currentColor"/><path d="M12 5v13" stroke="rgba(255,255,255,.45)" stroke-width="1" stroke-linecap="round"/></svg>';
  const MAX_PIEZAS = 90;
  let capa = null, vivas = 0;

  const quieto = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimiento === "reducido"; } catch (e) { return false; }
  };
  const azar = (a, b) => a + Math.random() * (b - a);

  function laCapa() {
    if (capa && capa.isConnected) return capa;
    capa = document.createElement("div");
    capa.className = "rt-fx-capa";
    capa.setAttribute("aria-hidden", "true");
    capa.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden;contain:strict";
    document.body.appendChild(capa);
    return capa;
  }

  /** Una pieza que vuela y se borra sola. */
  function pieza(x, y, tam, html, color, frames, dur, extra) {
    if (vivas >= MAX_PIEZAS) return;
    const p = document.createElement("i");
    p.style.cssText = `position:absolute;left:${x - tam / 2}px;top:${y - tam / 2}px;width:${tam}px;height:${tam}px;color:${color};display:block;will-change:transform,opacity;${extra || ""}`;
    if (html) p.innerHTML = html;
    laCapa().appendChild(p);
    vivas++;
    let fin = false;
    const quitar = () => { if (fin) return; fin = true; vivas--; p.remove(); };
    try { const a = p.animate(frames, { duration: dur, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }); a.onfinish = quitar; a.oncancel = quitar; } catch (e) { /* nada */ }
    setTimeout(quitar, dur + 200);
    return p;
  }

  function paleta(color) {
    return [color, "#ff8fb1", "#ffd23f", "#8fd3ff", "#b79cff", "#7be0a8", "#ffffff"];
  }

  /** Partículas u ondas en (x, y) de la pantalla. */
  RT.particulas = function (tipo, x, y, op) {
    if (!tipo) return;
    op = op || {};
    const color = op.color || "#ff5c93";
    const k = Math.max(0.3, Math.min(2.5, +op.cantidad || 1)) * (quieto() ? 0.4 : 1);
    const n = (base) => Math.max(1, Math.round(base * k));
    switch (tipo) {
      case "ondas":
        for (let i = 0; i < (quieto() ? 1 : 3); i++) {
          setTimeout(() => pieza(x, y, 22, "", color, [
            { transform: "scale(.3)", opacity: 0.95 },
            { transform: `scale(${5 + i * 1.6 * k})`, opacity: 0 },
          ], 760 + i * 160, `border:2.5px solid ${color};border-radius:50%;box-shadow:0 0 10px ${color}`), i * 110);
        }
        break;
      case "corazones":
        for (let i = 0; i < n(7); i++) {
          const a = azar(-Math.PI * 0.9, -Math.PI * 0.1), d = azar(50, 130) * k, t = azar(14, 28);
          pieza(x, y, t, CORAZON, i % 3 ? color : "#ff8fb1", [
            { transform: "translate(0,0) scale(.2) rotate(0deg)", opacity: 1 },
            { transform: `translate(${Math.cos(a) * d * 0.6}px,${Math.sin(a) * d * 0.6}px) scale(1.1) rotate(${azar(-20, 20)}deg)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 40}px) scale(.8) rotate(${azar(-30, 30)}deg)`, opacity: 0 },
          ], azar(900, 1300), "filter:drop-shadow(0 2px 4px rgba(120,20,60,.25))");
        }
        break;
      case "chispas":
      case "estrellas": {
        const forma = tipo === "chispas" ? DESTELLO : ESTRELLA;
        const cols = paleta(color);
        for (let i = 0; i < n(10); i++) {
          const a = (i / n(10)) * Math.PI * 2 + azar(-0.3, 0.3), d = azar(40, 110) * k, t = azar(9, 20);
          pieza(x, y, t, forma, tipo === "chispas" ? (i % 2 ? "#fff6c8" : color) : cols[i % cols.length], [
            { transform: "translate(0,0) scale(0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1) rotate(${azar(90, 200)}deg)`, opacity: 1, offset: 0.6 },
            { transform: `translate(${Math.cos(a) * d * 1.15}px,${Math.sin(a) * d * 1.15 + 10}px) scale(0) rotate(260deg)`, opacity: 0 },
          ], azar(650, 950), `filter:drop-shadow(0 0 5px ${color})`);
        }
        break;
      }
      case "confeti": {
        const cols = paleta(color);
        for (let i = 0; i < n(16); i++) {
          const vx = azar(-140, 140) * k, sube = azar(60, 150) * k, w = azar(6, 10);
          pieza(x, y, w, "", cols[i % cols.length], [
            { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${vx * 0.6}px,${-sube}px) rotate(${azar(180, 360)}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${vx}px,${azar(80, 200)}px) rotate(${azar(500, 900)}deg)`, opacity: 0 },
          ], azar(1100, 1600), `background:${cols[i % cols.length]};height:${w * 0.45}px;border-radius:1px`);
        }
        break;
      }
      case "burbujas":
        for (let i = 0; i < n(8); i++) {
          const t = azar(10, 26), dx = azar(-60, 60) * k;
          pieza(x + azar(-12, 12), y, t, "", color, [
            { transform: "translate(0,0) scale(.3)", opacity: 0.9 },
            { transform: `translate(${dx * 0.5}px,${-azar(40, 70) * k}px) scale(1)`, opacity: 0.9, offset: 0.5 },
            { transform: `translate(${dx}px,${-azar(110, 170) * k}px) scale(1.15)`, opacity: 0 },
          ], azar(1100, 1700), `border-radius:50%;border:1.5px solid ${color};background:radial-gradient(circle at 32% 30%,rgba(255,255,255,.95) 0 12%,rgba(255,255,255,.18) 30%,transparent 70%)`);
        }
        break;
      case "besos":
        for (let i = 0; i < n(6); i++) {
          const a = azar(-Math.PI * 0.85, -Math.PI * 0.15), d = azar(45, 120) * k, t = azar(16, 26);
          pieza(x, y, t, BESO, i % 2 ? color : "#c8102e", [
            { transform: `translate(0,0) scale(.2) rotate(${azar(-25, 25)}deg)`, opacity: 1 },
            { transform: `translate(${Math.cos(a) * d * 0.7}px,${Math.sin(a) * d * 0.7}px) scale(1.15) rotate(${azar(-15, 15)}deg)`, opacity: 1, offset: 0.4 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 30}px) scale(.85) rotate(${azar(-25, 25)}deg)`, opacity: 0 },
          ], azar(900, 1300), "filter:drop-shadow(0 2px 3px rgba(90,0,20,.3))");
        }
        break;
      case "petalos": {
        const cols = [color, "#ffb3c9", "#ff8fb1"];
        for (let i = 0; i < n(9); i++) {
          const vx = azar(-90, 90) * k, t = azar(10, 18), g = azar(-260, 260);
          pieza(x, y, t, PETALO, cols[i % 3], [
            { transform: "translate(0,0) scale(.3) rotate(0deg)", opacity: 1 },
            { transform: `translate(${vx * 0.5}px,${-azar(30, 70) * k}px) scale(1) rotate(${g * 0.4}deg)`, opacity: 1, offset: 0.3 },
            { transform: `translate(${vx + azar(-20, 20)}px,${azar(60, 140) * k}px) scale(.9) rotate(${g}deg)`, opacity: 0 },
          ], azar(1400, 2000), "filter:drop-shadow(0 1px 2px rgba(120,20,60,.2))");
        }
        break;
      }
      case "teamo": {
        const p = pieza(x, y, 10, "", color, [
          { transform: "translate(-50%,0) scale(.6)", opacity: 0 },
          { transform: "translate(-50%,-26px) scale(1.08)", opacity: 1, offset: 0.25 },
          { transform: "translate(-50%,-74px) scale(1)", opacity: 0 },
        ], 1500, `width:auto;height:auto;white-space:nowrap;font:600 ${Math.round(26 * Math.min(1.6, k))}px Caveat,"Dancing Script",cursive;text-shadow:0 2px 8px rgba(0,0,0,.18),0 0 14px rgba(255,255,255,.7)`);
        if (p) p.textContent = op.texto || "te amo";
        break;
      }
    }
  };

  /** Lo que hace el propio elemento al tocarlo (no pisa sus otras animaciones). */
  RT.moverAlToque = function (n, mov, op) {
    if (!n || !mov || !n._rt) return;
    const c = n._rt.c;
    const color = (op && op.color) || "#ff5c93";
    const base = c.style.filter || "";
    const corto = quieto();
    const F = {
      pulso: [[{ transform: "scale(1)" }, { transform: "scale(1.12)", offset: 0.25 }, { transform: "scale(.97)", offset: 0.5 }, { transform: "scale(1.06)", offset: 0.7 }, { transform: "scale(1)" }], 650],
      rebote: [[{ transform: "scale(1,1)" }, { transform: "scale(1.18,.84)", offset: 0.2 }, { transform: "scale(.9,1.12)", offset: 0.45 }, { transform: "scale(1.05,.96)", offset: 0.7 }, { transform: "scale(1,1)" }], 620],
      saltito: [[{ transform: "translateY(0)" }, { transform: "translateY(-18%)", offset: 0.35 }, { transform: "translateY(0)", offset: 0.7 }, { transform: "translateY(-4%)", offset: 0.85 }, { transform: "translateY(0)" }], 600],
      sacudir: [[{ transform: "translateX(0)" }, { transform: "translateX(-7%) rotate(-3deg)", offset: 0.2 }, { transform: "translateX(6%) rotate(3deg)", offset: 0.4 }, { transform: "translateX(-4%)", offset: 0.6 }, { transform: "translateX(2%)", offset: 0.8 }, { transform: "translateX(0)" }], 520],
      girar: [[{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], 700],
      crecer: [[{ transform: "scale(1)" }, { transform: "scale(1.22)", offset: 0.4 }, { transform: "scale(1.22)", offset: 0.6 }, { transform: "scale(1)" }], 900],
      brillo: [[{ filter: base || "none" }, { filter: `${base} brightness(1.35) drop-shadow(0 0 14px ${color}) drop-shadow(0 0 4px ${color})`.trim(), offset: 0.3 }, { filter: base || "none" }], 900],
      color: [[{ filter: `${base} hue-rotate(0deg)`.trim() }, { filter: `${base} hue-rotate(180deg) saturate(1.5)`.trim(), offset: 0.5 }, { filter: `${base} hue-rotate(360deg)`.trim() }], 900],
      desvanecer: [[{ opacity: 1 }, { opacity: 0.25, offset: 0.4 }, { opacity: 1 }], 800],
      flotar: [[{ transform: "translateY(0)" }, { transform: "translateY(-9%) rotate(-2deg)", offset: 0.45 }, { transform: "translateY(-6%) rotate(1.5deg)", offset: 0.7 }, { transform: "translateY(0)" }], 1300],
    }[mov];
    if (!F) return;
    try {
      if (c._toque) c._toque.cancel();
      c._toque = c.animate(F[0], { duration: corto ? Math.min(F[1], 300) : F[1], easing: "ease-out" });
    } catch (e) { /* nada */ }
  };

  /** Un toque completo: partículas en el dedo + movimiento del elemento. */
  RT.efectoToque = function (n, t, x, y) {
    if (!t) return;
    if (t.efecto) RT.particulas(t.efecto, x, y, t);
    if (t.mov && n) RT.moverAlToque(n, t.mov, t);
  };
  RT.tieneToque = (t) => !!(t && (t.efecto || t.mov));

  /* ── Zonas táctiles (sólo en el librito; en el editor se editan aparte) ── */
  RT.pintarZonas = function (n, e, ctx) {
    const zs = ctx.modo === "vista" ? (e.zonas || []).filter((z) => z && z.w > 0 && z.h > 0) : [];
    let cont = n._rt.zonas;
    const firma = JSON.stringify(zs);
    if (cont && cont._firma === firma) return;
    if (!zs.length) { if (cont) { cont.remove(); n._rt.zonas = null; } return; }
    if (!cont) { cont = RT.h("div", "rt-zonas", n); n._rt.zonas = cont; }
    cont._firma = firma;
    cont.textContent = "";
    for (const z of zs) {
      const d = RT.h("div", "rt-zona", cont);
      d.style.left = z.x * 100 + "%"; d.style.top = z.y * 100 + "%";
      d.style.width = z.w * 100 + "%"; d.style.height = z.h * 100 + "%";
      if (z.accion && z.accion.tipo) { d.setAttribute("role", "button"); d.tabIndex = 0; if (z.nombre) d.setAttribute("aria-label", z.nombre); }
      d.addEventListener("pointerdown", (ev) => {
        ev._rtToque = true;
        RT.efectoToque(n, z, ev.clientX, ev.clientY);
        if (z.sonido && ctx.sonido) ctx.sonido(z.sonido, z.volumen);
        if (z.vibrar && navigator.vibrate) { try { navigator.vibrate(18); } catch (err) { /* nada */ } }
      });
      let ultimo = 0;
      d.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (!(z.accion && z.accion.tipo && ctx.accion)) return;
        const ahora = performance.now();
        if (ahora - ultimo < 380) return;
        ultimo = ahora;
        ctx.accion(z.accion, e);
      });
      d.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); const r = d.getBoundingClientRect(); RT.efectoToque(n, z, r.left + r.width / 2, r.top + r.height / 2); d.click(); } });
    }
  };
})(window.LibritoRT = window.LibritoRT || {});

/*
 * LIBRITO · la música
 *
 * Una canción para todo el librito y, si una página quiere, la suya (o
 * silencio). Al cambiar se funden: la que se va baja mientras la nueva sube.
 *
 * El volumen va por Web Audio porque en iPhone `audio.volume` no hace nada
 * (siempre suena al máximo). Y nada suena hasta el primer toque: los
 * navegadores no dejan que una página empiece a sonar sola.
 */
(function (RT) {
  "use strict";

  RT.Musica = class {
    constructor() {
      this.ac = null;
      this.actual = null;   // { src, audio, gain, vol }
      this.listo = false;
      this.silencio = false;
      this.deseo = null;
      this._vis = () => {
        if (!this.actual) return;
        if (document.hidden) this.actual.audio.pause();
        else if (this.listo && !this.silencio) this.actual.audio.play().catch(() => {});
      };
      document.addEventListener("visibilitychange", this._vis);
    }

    /** Llamar dentro de un toque. */
    desbloquear() {
      if (this.listo) return;
      this.listo = true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && location.protocol !== "file:") this.ac = new AC();
      } catch (err) { this.ac = null; }
      if (this.ac && this.ac.state === "suspended") this.ac.resume().catch(() => {});
      if (this.deseo) { const d = this.deseo; this.deseo = null; this.poner(d.src, d.vol, d.bucle); }
    }

    _crear(src, bucle) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.loop = bucle !== false;
      audio.src = src;
      let gain = null;
      if (this.ac) {
        try {
          const nodo = this.ac.createMediaElementSource(audio);
          gain = this.ac.createGain();
          gain.gain.value = 0;
          nodo.connect(gain).connect(this.ac.destination);
        } catch (err) { gain = null; }
      }
      if (!gain) audio.volume = 0;
      return { src: src, audio: audio, gain: gain, vol: 0 };
    }

    _fundir(p, hasta, ms, alFin) {
      const v = this.silencio ? 0 : RT.clamp(hasta, 0, 1);
      if (p.gain) {
        const t = this.ac.currentTime;
        p.gain.gain.cancelScheduledValues(t);
        p.gain.gain.setValueAtTime(p.gain.gain.value, t);
        p.gain.gain.linearRampToValueAtTime(v, t + ms / 1000);
      } else {
        const desde = p.audio.volume, t0 = performance.now();
        clearInterval(p.reloj);
        p.reloj = setInterval(() => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          p.audio.volume = desde + (v - desde) * k;
          if (k >= 1) clearInterval(p.reloj);
        }, 40);
      }
      p.vol = hasta;
      if (alFin) setTimeout(alFin, ms + 30);
    }

    /** Lo que debería sonar ahora (src null = nada). */
    poner(src, vol, bucle) {
      vol = RT.num(vol, 0.8);
      if (!this.listo) { this.deseo = src ? { src: src, vol: vol, bucle: bucle } : null; return; }
      const act = this.actual;
      if (act && act.src === src) { act.audio.loop = bucle !== false; this._fundir(act, vol, 500); return; }
      if (act) {
        this._fundir(act, 0, 700, () => { act.audio.pause(); act.audio.removeAttribute("src"); try { act.audio.load(); } catch (err) { /* nada */ } });
        this.actual = null;
      }
      if (!src) return;
      const p = this._crear(src, bucle);
      this.actual = p;
      if (!document.hidden) p.audio.play().catch(() => {});
      this._fundir(p, vol, 900);
    }

    /** Bajar la música mientras suena otra cosa (un reproductor de un componente). */
    agachar(on) {
      if (!this.actual) return;
      const p = this.actual;
      if (on) { if (p._vol == null) p._vol = p.vol; this._fundir(p, p._vol * 0.15, 400); p.vol = p._vol; }
      else if (p._vol != null) { this._fundir(p, p._vol, 600); p._vol = null; }
    }

    /** Baja un poco mientras suena un efecto y vuelve sola, suave, al terminar. */
    agacharPor(audio) {
      if (!audio || !this.actual) return;
      this._efectos = (this._efectos || 0) + 1;
      if (this._efectos === 1) {
        const p = this.actual;
        if (p._volE == null) p._volE = p.vol;
        this._fundir(p, p._volE * 0.35, 250);
        p.vol = p._volE;
      }
      let listo = false;
      const soltar = () => {
        if (listo) return;
        listo = true;
        audio.removeEventListener("ended", soltar);
        audio.removeEventListener("pause", soltar);
        clearTimeout(t);
        this._efectos = Math.max(0, (this._efectos || 1) - 1);
        if (!this._efectos && this.actual && this.actual._volE != null) { const p = this.actual; this._fundir(p, p._volE, 900); p._volE = null; }
      };
      audio.addEventListener("ended", soltar);
      audio.addEventListener("pause", soltar);
      const d = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 6;
      const t = setTimeout(soltar, Math.min(30, d) * 1000 + 300);
    }

    alternar() {
      this.silencio = !this.silencio;
      if (this.actual) {
        if (!this.silencio && this.actual.audio.paused) this.actual.audio.play().catch(() => {});
        this._fundir(this.actual, this.actual.vol, 300);
      }
      return !this.silencio;
    }

    destruir() {
      document.removeEventListener("visibilitychange", this._vis);
      if (this.actual) { this.actual.audio.pause(); this.actual.audio.removeAttribute("src"); }
      this.actual = null;
      if (this.ac) this.ac.close().catch(() => {});
    }
  };
})(window.LibritoRT = window.LibritoRT || {});

/*
 * LIBRITO · el reproductor
 *
 * Enseña el librito página a página. Sólo existe en el DOM la página que
 * se ve (y, durante la transición, la que se va): las demás no gastan nada.
 * Los datos de cada página se piden cuando hacen falta, y mientras ella lee
 * se adelanta la siguiente para que pasar de hoja sea instantáneo.
 *
 * La hoja tiene un tamaño fijo (el del diseño) y se escala entera para
 * caber en la pantalla, así se ve igual en cualquier teléfono.
 */
(function (RT) {
  "use strict";
  const h = RT.h;

  /* ── Páginas que llegan en su propio archivo (librito exportado) ── */
  RT._pags = RT._pags || {};
  const esperando = {};
  RT.pagina = function (id, datos) {
    RT._pags[id] = datos;
    if (esperando[id]) { esperando[id].forEach((r) => r(datos)); delete esperando[id]; }
  };
  RT.cargarScript = function (src, id) {
    if (RT._pags[id]) return Promise.resolve(RT._pags[id]);
    return new Promise((resolver, fallar) => {
      (esperando[id] = esperando[id] || []).push(resolver);
      if (esperando[id].length > 1) return;
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onerror = () => { delete esperando[id]; fallar(new Error("No se pudo cargar " + src)); };
      document.head.appendChild(s);
    });
  };

  RT.Libro = class {
    constructor(raiz, datos, op) {
      this.raiz = raiz;
      this.datos = datos;
      this.op = op || {};
      const a = datos.ajustes || {};
      RT.registrarExtras && RT.registrarExtras(a);
      this.W = a.ancho || 390;
      this.H = a.alto || 844;
      this.rep = Object.assign({ flechas: true, progreso: true, deslizar: true, indice: true, tocarParaEmpezar: true, alFinal: "quedarse", autoAvance: 0 }, a.reproduccion || {});
      // «Probar página» (editor): sólo esa página, sin flechas, barrita ni índice.
      if (this.op.soloPagina) Object.assign(this.rep, { flechas: false, progreso: false, indice: false, deslizar: false, autoAvance: 0, tocarParaEmpezar: false });
      this._sonandoPistas = [];
      this.orden = datos.orden.slice();
      // Si el librito usa el botón de música de la hoja, el chip viejo «♪» ya no sale (sólo el nuevo).
      this.botonNuevo = Object.values(datos.paginas || {}).some((p) => (p.els || []).some((e) => e.tipo === "musica"));
      this.i = -1;
      this.actual = null;
      this.ocupado = false;
      this.musica = new RT.Musica();
      // Vistas previas chiquitas (Detallitos): la página se ve, pero no suena.
      if (this.op.silencio) this.musica.silencio = true;
      this.ctx = {
        modo: "vista", activo: true,
        url: (id) => this.op.url(id),
        urlDatos: (id) => (this.op.urlDatos ? this.op.urlDatos(id) : null),
        ruta: (r) => (this.op.ruta ? this.op.ruta(r) : r),
        accion: (ac, e) => this.accion(ac, e),
        sonido: (id, vol) => RT.sonar(this.op.url(id), vol),
        escala: () => this.escala || 1,
      };
      // Los componentes de assets/ pueden pedir cosas («siguiente», «musica»…).
      this._mensaje = (ev) => {
        const d = ev.data && ev.data.librito;
        if (!d || !this.actual) return;
        const ok = Array.prototype.some.call(this.marco.querySelectorAll("iframe"), (f) => f.contentWindow === ev.source);
        if (!ok) return;
        if (typeof d === "string") {
          if (d === "bajarMusica") this.musica.agachar(true);
          else if (d === "subirMusica") this.musica.agachar(false);
          else this.accion({ tipo: d });
        } else if (d.ir) this.accion({ tipo: "ir", destino: d.ir });
        else if (d.sonido) RT.sonar(d.sonido, d.volumen);
      };
      addEventListener("message", this._mensaje);
      RT.alSonar = (a) => this.musica.agacharPor(a);
      this._montar();
      const ini = typeof op.inicio === "string" ? Math.max(0, this.orden.indexOf(op.inicio)) : op.inicio || 0;
      const empezar = () => this.ir(ini, false, true);
      if (this.rep.tocarParaEmpezar && !op.sinPortadilla) this._portadilla(empezar);
      else { this.musica.desbloquear(); empezar(); }
    }

    _montar() {
      const r = this.raiz;
      r.classList.add("rt-libro");
      this.marco = h("div", "rt-escenario", r);
      this.marco.style.width = this.W + "px";
      this.marco.style.height = this.H + "px";
      const ui = h("div", "rt-ui", r);
      this.ant = h("button", "rt-nav rt-nav-ant", ui); this.ant.type = "button"; this.ant.setAttribute("aria-label", "Página anterior"); this.ant.innerHTML = "<span>‹</span>";
      this.sig = h("button", "rt-nav rt-nav-sig", ui); this.sig.type = "button"; this.sig.setAttribute("aria-label", "Página siguiente"); this.sig.innerHTML = "<span>›</span>";
      this.ant.addEventListener("click", () => this.anterior());
      this.sig.addEventListener("click", () => this.siguiente());
      // Las flechas son las de assets/deslizar/ (izquierda y derecha) que eligió el editor.
      const bt = this.rep.botones, uIzq = bt && bt.izq && this.op.url(bt.izq), uDer = bt && bt.der && this.op.url(bt.der);
      if (uIzq && uDer) {
        for (const [b, u] of [[this.ant, uIzq], [this.sig, uDer]]) {
          b.classList.add("rt-nav-img");
          b.innerHTML = "";
          const im = h("img", "", b); im.alt = ""; im.draggable = false; im.decoding = "async"; im.src = u;
          if (bt.tam) b.style.setProperty("--rt-nav", bt.tam + "px");
        }
      }
      if (!this.rep.flechas) { this.ant.hidden = true; this.sig.hidden = true; }
      this.prog = h("div", "rt-prog", ui);
      this.progBarra = h("i", "", this.prog);
      if (!this.rep.progreso) this.prog.hidden = true;
      const arriba = h("div", "rt-arriba", ui);
      this.btnMusica = h("button", "rt-chip", arriba); this.btnMusica.type = "button"; this.btnMusica.textContent = "♪"; this.btnMusica.setAttribute("aria-label", "Música");
      this.btnMusica.addEventListener("click", () => { const on = this.musica.alternar(); this.btnMusica.classList.toggle("rt-off", !on); this.raiz.classList.toggle("rt-musica-off", !on); });
      this.btnMusica.hidden = true;
      if (this.rep.indice && this.orden.length > 2) {
        const b = h("button", "rt-chip", arriba); b.type = "button"; b.textContent = "☰"; b.setAttribute("aria-label", "Índice");
        b.addEventListener("click", () => this._indice());
      }
      if (this.op.cerrar && !this.op.soloPagina) {
        const x = h("button", "rt-chip", arriba); x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Cerrar");
        x.addEventListener("click", () => this.op.cerrar());
      }
      this._escalar = () => {
        const vv = window.visualViewport;
        const w = vv ? vv.width : innerWidth, hh = vv ? vv.height : innerHeight;
        // Salió el teclado (mismo ancho, mucho menos alto, escribiendo): la hoja no se
        // reacomoda «como si se hubiera girado»; el teclado sólo tapa un poco.
        const ae = document.activeElement;
        const escribe = ae && (ae.tagName === "IFRAME" || /INPUT|TEXTAREA|SELECT/.test(ae.tagName) || ae.isContentEditable);
        if (this.medidas && escribe && Math.abs(w - this._ultW) < 2 && hh < this._ultH * 0.86) return;
        this._ultW = w; this._ultH = hh;
        // Hoja automática: la hoja toma la forma de la pantalla (vertical u
        // horizontal) y lo de dentro se recoloca; con tamaño fijo, se escala.
        // En «Probar página» la hoja se arma con la pantalla del editor (fijar) y sólo se escala.
        const f = this.op.fijar;
        const m = RT.medidas(this.datos.ajustes, f && f.w > 0 ? f.w : w, f && f.h > 0 ? f.h : hh);
        this.medidas = m;
        this.ctx.medidas = m;
        if (m.W !== this.W || m.H !== this.H) {
          this.W = m.W; this.H = m.H;
          this.marco.style.width = this.W + "px";
          this.marco.style.height = this.H + "px";
          if (this.actual) this.actual.redimensionar(this.W, this.H);
        }
        const s = Math.min(w / this.W, hh / this.H);
        this.escala = s;
        this.marco.style.transform = `translate(-50%, -50%) scale(${s})`;
      };
      this._escalar();
      this._rs = () => { cancelAnimationFrame(this._rf); this._rf = requestAnimationFrame(this._escalar); };
      addEventListener("resize", this._rs);
      addEventListener("orientationchange", this._rs);
      if (window.visualViewport) visualViewport.addEventListener("resize", this._rs);
      this._tecla = (ev) => {
        if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
        if (ev.key === "ArrowRight" || ev.key === "PageDown" || ev.key === " ") { ev.preventDefault(); this.siguiente(); }
        else if (ev.key === "ArrowLeft" || ev.key === "PageUp") { ev.preventDefault(); this.anterior(); }
      };
      addEventListener("keydown", this._tecla);
      if (this.rep.deslizar) this._gestos();
    }

    _gestos() {
      let x0 = null, y0 = 0, t0 = 0;
      this.raiz.addEventListener("pointerdown", (ev) => {
        if (ev.target.closest(".rt-toca, .rt-ui button, [data-claim-drag], .rt-indice")) { x0 = null; return; }
        x0 = ev.clientX; y0 = ev.clientY; t0 = performance.now();
      });
      this.raiz.addEventListener("pointerup", (ev) => {
        if (x0 == null) return;
        const dx = ev.clientX - x0, dy = ev.clientY - y0, dt = performance.now() - t0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 900) dx < 0 ? this.siguiente() : this.anterior();
      });
    }

    _portadilla(alEntrar) {
      const p = h("div", "rt-portadilla", this.raiz);
      const t = h("div", "rt-portadilla-t", p);
      t.innerHTML = `<b></b><span>Toca para abrir</span>`;
      t.firstChild.textContent = this.datos.nombre || "Mi librito";
      const ir = () => {
        this.musica.desbloquear();
        p.classList.add("rt-fuera");
        setTimeout(() => p.remove(), 500);
        alEntrar();
      };
      p.addEventListener("click", ir, { once: true });
    }

    async _pagina(i) {
      const id = this.orden[i];
      if (this.datos.paginas && this.datos.paginas[id]) return this.datos.paginas[id];
      return this.op.cargar(id);
    }

    siguiente() {
      if (this.i < this.orden.length - 1) this.ir(this.i + 1, false);
      else if (this.rep.alFinal === "portada") this.ir(0, false);
    }
    anterior() { if (this.i > 0) this.ir(this.i - 1, true); }

    async ir(i, atras, primera) {
      if (i < 0 || i >= this.orden.length || i === this.i) return;
      if (this.ocupado) { this._pendiente = [i, atras]; return; }
      this.ocupado = true;
      clearTimeout(this._auto);
      let pag;
      try { pag = await this._pagina(i); } catch (err) { console.warn(err); this.ocupado = false; return; }
      const viejo = this.actual;
      this._pararPistas();
      if (viejo && viejo.anim) await viejo.anim.salir();
      const nueva = new RT.Pagina(pag, this.ctx, this.W, this.H);
      this.marco.appendChild(nueva.nodo);
      const anim = new RT.Animador(pag, nueva.nodos);
      anim.componentes = Array.from(nueva.nodos.values()).map((n) => n._rt.vida).filter((v) => v && v.entrar);
      nueva.anim = anim;
      this.i = i;
      this.actual = nueva;
      this._pintarUI(pag);
      const cfg = pag.transicion && pag.transicion.tipo ? pag.transicion : (this.datos.ajustes || {}).transicion || { tipo: "fundido" };
      const dur = primera || !viejo ? 0 : RT.num(cfg.dur, 700);
      this._quitarRelojes();
      if (viejo && cfg.sonido) RT.sonar(this.op.url(cfg.sonido), cfg.volumen);
      for (const e of pag.els || []) { const so = e.sonidos; if (so && so.tocar) RT.precargarSonido(this.op.url(so.tocar)); }
      setTimeout(() => {
        if (this.actual !== nueva) return;
        anim.entrar({ vista: true });
        // Los vídeos que empiezan más tarde (línea de tiempo).
        for (const e of pag.els || []) {
          if (e.tipo !== "video" || !e.video || RT.modoVideo(e.video) !== "auto" || !RT.inicioDe(e)) continue;
          const v = nueva.nodos.get(e.id) && nueva.nodos.get(e.id).querySelector("video");
          if (v) this._relojes.push(setTimeout(() => RT.reproducirVideo(v), RT.inicioDe(e)));
        }
        // Los sonidos «al aparecer», cuando empieza su entrada.
        for (const e of pag.els || []) {
          const so = e.sonidos;
          if (!so || !so.aparecer || e.oculto || e.inicioOculto) continue;
          const ret = RT.inicioDe(e) + (e.anim && e.anim.entrada && e.anim.entrada.tipo !== "ninguna" ? RT.num(e.anim.entrada.retraso, 0) : 0);
          this._relojes.push(setTimeout(() => RT.sonar(this.op.url(so.aparecer), so.volumen), ret));
        }
        this._pistas(pag);
      }, primera || !viejo ? 60 : dur * 0.45);
      if (viejo) {
        await RT.transicion(viejo.nodo, nueva.nodo, cfg, atras);
        if (viejo.anim) viejo.anim.cancelar();
        viejo.destruir();
      }
      this._sonar(pag);
      this.ocupado = false;
      this._adelantar(i + 1);
      const auto = this.op.soloPagina ? 0 : RT.num(pag.duracion, 0) || RT.num(this.rep.autoAvance, 0);
      if (auto > 0) this._auto = setTimeout(() => this.siguiente(), auto * 1000);
      if (this._pendiente) { const p = this._pendiente; this._pendiente = null; this.ir(p[0], p[1]); }
    }

    _pintarUI(pag) {
      const n = this.orden.length;
      this.progBarra.style.transform = `scaleX(${n > 1 ? this.i / (n - 1) : 1})`;
      this.ant.disabled = this.i === 0;
      this.sig.disabled = this.i === n - 1 && this.rep.alFinal !== "portada";
      const f = pag.fondo || {};
      this.raiz.style.background = f.tipo === "gradiente" && f.gradiente ? RT.gradiente(f.gradiente) : f.css || f.color || "#111";
    }

    _sonar(pag) {
      const g = (this.datos.ajustes || {}).musica || {};
      const m = pag.musica || {};
      let src = null, vol = 0.8, bucle = true;
      if (m.modo === "silencio") src = null;
      else if (m.modo === "propia" && m.asset) { src = this.op.url(m.asset); vol = RT.num(m.volumen, 0.8); bucle = m.bucle !== false; }
      else if (g.asset) { src = this.op.url(g.asset); vol = RT.num(g.volumen, 0.8); bucle = g.bucle !== false; }
      this.btnMusica.hidden = this.botonNuevo || (!src && !this.musica.actual);
      this.raiz.classList.toggle("rt-con-musica", !!src);
      this.musica.poner(src, vol, bucle);
    }

    /** Deja lista la siguiente: sus datos y sus fotos, sin pintarla. */
    _adelantar(i) {
      if (i >= this.orden.length) return;
      const hacer = () => this._pagina(i).then((p) => {
        for (const e of p.els || []) {
          const ids = e.imagen ? [e.imagen.asset] : e.album ? e.album.fotos : e.carrusel ? (e.carrusel.fotos || []).slice(0, 2) : [];
          for (const id of ids || []) { const u = id && this.op.url(id); if (u) { const im = new Image(); im.decoding = "async"; im.src = u; } }
        }
        if (p.fondo && p.fondo.imagen && p.fondo.imagen.asset) { const im = new Image(); im.src = this.op.url(p.fondo.imagen.asset); }
      }).catch(() => {});
      if (window.requestIdleCallback) requestIdleCallback(hacer, { timeout: 2000 }); else setTimeout(hacer, 400);
    }

    _quitarRelojes() { for (const t of this._relojes || []) clearTimeout(t); this._relojes = []; }

    /* Las pistas de audio de la página (línea de tiempo del editor): cada una
       a su hora, desde su recorte, con su volumen; la música baja mientras suenan. */
    _pistas(pag) {
      this._pararPistas();
      if (this.op.silencio) return;
      for (const t of pag.audios || []) {
        if (t.silencio) continue; // silenciada en la línea de tiempo
        const url = this.op.url(t.asset);
        if (!url) continue;
        const s = { relojes: [], a: null };
        s.relojes.push(setTimeout(() => {
          const a = new Audio();
          a.preload = "auto";
          a.loop = !!t.bucle;
          a.src = url;
          a.volume = RT.clamp(RT.num(t.vol, 0.9), 0, 1);
          const ir = () => { try { a.currentTime = RT.num(t.desde, 0) / 1000; } catch (err) { /* nada */ } };
          ir();
          a.addEventListener("loadedmetadata", ir, { once: true });
          a.play().catch(() => {});
          if (RT.alSonar) RT.alSonar(a);
          s.a = a;
          if (t.dur) s.relojes.push(setTimeout(() => this._apagarPista(s), RT.num(t.dur, 0)));
        }, Math.max(0, RT.num(t.inicio, 0))));
        this._sonandoPistas.push(s);
      }
    }

    _apagarPista(s) {
      for (const r of s.relojes) clearTimeout(r);
      s.relojes = [];
      const a = s.a;
      if (!a) return;
      s.a = null;
      // Un fundido cortito (en iPhone el volumen no cambia: se corta al final).
      const v0 = a.volume, t0 = performance.now();
      const paso = () => { const k = Math.min(1, (performance.now() - t0) / 220); try { a.volume = v0 * (1 - k); } catch (err) { /* nada */ } if (k < 1) requestAnimationFrame(paso); else { a.pause(); a.removeAttribute("src"); } };
      requestAnimationFrame(paso);
    }

    _pararPistas() { for (const s of this._sonandoPistas || []) this._apagarPista(s); this._sonandoPistas = []; }

    /** Un elemento de la página que se está viendo. */
    _nodo(id) { return this.actual && id ? this.actual.nodos.get(id) : null; }

    _mostrar(id, ver) {
      const n = this._nodo(id);
      if (!n) return;
      const e = n._rt.e;
      const visible = n.style.display !== "none";
      const quiere = ver == null ? !visible : ver;
      if (quiere === visible) return;
      n._rt.revelado = quiere;
      n.style.display = quiere ? "" : "none";
      if (quiere) {
        const en = e.anim && e.anim.entrada;
        RT.animarUno(n._rt.ae, en && en.tipo !== "ninguna" ? en.tipo : "zoom", Object.assign({}, en || {}, { retraso: 0 }));
        if (e.sonidos && e.sonidos.aparecer) RT.sonar(this.op.url(e.sonidos.aparecer), e.sonidos.volumen);
      }
    }

    accion(ac, desde) {
      if (!ac || !ac.tipo) return;
      switch (ac.tipo) {
        case "mostrar": this._mostrar(ac.destino, true); break;
        case "ocultar": this._mostrar(ac.destino, false); break;
        case "alternar": this._mostrar(ac.destino, null); break;
        case "animar": {
          const n = this._nodo(ac.destino) || (desde && this._nodo(desde.id));
          if (n) { const en = n._rt.e.anim && n._rt.e.anim.entrada; RT.animarUno(n._rt.ae, en && en.tipo !== "ninguna" ? en.tipo : "rebote", Object.assign({}, en || {}, { retraso: 0 })); }
          break;
        }
        case "sonido": if (ac.destino) RT.sonar(this.op.url(ac.destino), ac.volumen); break;
        case "siguiente": this.siguiente(); break;
        case "anterior": this.anterior(); break;
        case "inicio": this.ir(0, true); break;
        case "ir": { const j = this.orden.indexOf(ac.destino); if (j >= 0) this.ir(j, j < this.i); break; }
        case "enlace": if (/^(https?:|mailto:|tel:)/i.test(ac.destino || "")) window.open(ac.destino, "_blank", "noopener"); break;
        case "musica": { const on = this.musica.alternar(); this.btnMusica.classList.toggle("rt-off", !on); this.raiz.classList.toggle("rt-musica-off", !on); break; }
      }
    }

    _indice() {
      const capa = h("div", "rt-indice", this.raiz);
      const caja = h("div", "rt-indice-caja", capa);
      const t = h("b", "", caja); t.textContent = this.datos.nombre || "Índice";
      const l = h("ol", "", caja);
      this.orden.forEach((id, j) => {
        const li = h("li", j === this.i ? "rt-act" : "", l);
        const b = h("button", "", li); b.type = "button";
        b.textContent = (this.datos.titulos && this.datos.titulos[id]) || "Página " + (j + 1);
        b.addEventListener("click", () => { cerrar(); this.ir(j, j < this.i); });
      });
      const cerrar = () => { capa.classList.add("rt-fuera"); setTimeout(() => capa.remove(), 220); };
      capa.addEventListener("click", (ev) => { if (ev.target === capa) cerrar(); });
      requestAnimationFrame(() => capa.classList.add("rt-dentro"));
    }

    destruir() {
      clearTimeout(this._auto);
      this._quitarRelojes();
      this._pararPistas();
      removeEventListener("message", this._mensaje);
      if (RT.alSonar) RT.alSonar = null;
      removeEventListener("resize", this._rs);
      removeEventListener("orientationchange", this._rs);
      removeEventListener("keydown", this._tecla);
      if (window.visualViewport) visualViewport.removeEventListener("resize", this._rs);
      if (this.actual) { if (this.actual.anim) this.actual.anim.cancelar(); this.actual.destruir(); }
      this.musica.destruir();
      this.raiz.textContent = "";
    }
  };

  /** Arranque del librito exportado: lee `window.LIBRITO_DATOS`. */
  RT.arrancar = function () {
    const d = window.LIBRITO_DATOS;
    if (!d) return;
    document.title = d.nombre || "Mi librito";
    const raiz = document.getElementById("librito") || document.body;
    RT.libro = new RT.Libro(raiz, d, {
      url: (id) => (d.archivos && d.archivos[id]) || null,
      ruta: (r) => "pages/originales/" + r.split("/").map(encodeURIComponent).join("/"),
      cargar: (id) => RT.cargarScript(d.paginasArchivos[id], id),
    });
  };
})(window.LibritoRT = window.LibritoRT || {});
