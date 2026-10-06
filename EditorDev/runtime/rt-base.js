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

  const pedidas = new Set();
  /** Pide (una sola vez cada una) las tipografías que se van usando. */
  RT.cargarFuentes = function (nombres) {
    const nuevas = [];
    for (const n of nombres) if (n && RT.FUENTES[n] && RT.FUENTES[n].g && !pedidas.has(n)) { pedidas.add(n); nuevas.push(n); }
    if (!nuevas.length) return;
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = RT.urlFuentes(nuevas);
    document.head.appendChild(l);
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
    if (f.brillo != null && f.brillo !== 100) p.push(`brightness(${f.brillo}%)`);
    if (f.contraste != null && f.contraste !== 100) p.push(`contrast(${f.contraste}%)`);
    if (f.saturacion != null && f.saturacion !== 100) p.push(`saturate(${f.saturacion}%)`);
    if (f.byn) p.push(`grayscale(${f.byn}%)`);
    if (f.sepia) p.push(`sepia(${f.sepia}%)`);
    if (f.tono) p.push(`hue-rotate(${f.tono}deg)`);
    if (f.invertir) p.push(`invert(${f.invertir}%)`);
    return p.join(" ");
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
