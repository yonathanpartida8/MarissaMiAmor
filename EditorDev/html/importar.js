/**
 * IMPORTAR — tus páginas de siempre, dentro del editor.
 *
 * «Usar tal cual»: la página entra como capa «Página original» y funciona
 *   exactamente igual que en el librito, con todo su JavaScript.
 *
 * «Editar como plantilla» / «Hacer editable»: se abre la página escondida a
 *   tamaño de hoja, se deja que su JavaScript arme todo y se recorre lo que
 *   se ve: cada texto, foto, dibujo, caja con fondo y sus animaciones se
 *   vuelven capas editables, en el mismo sitio y con el mismo estilo.
 *   Dos maneras:
 *     · conservando lo interactivo (recomendado): la página original sigue
 *       debajo funcionando (sus lienzos, juegos y botones) y SÓLO lo que se
 *       sacó a capas se esconde en ella;
 *     · sólo lo que se ve: todo pasa a capas (los dibujos de <canvas> se
 *       vuelven fotos) y se quita el original.
 *
 * «Importar mi librito»: un proyecto nuevo con todo el librito de siempre,
 *   sin abrir ninguna página: las HTML como originales y las demás como
 *   cartas editables con su texto y sus fotos.
 */
import { el, modal, aviso, boton } from "../components/ui.js";
import { nuevoEl, nuevaPagina, nuevoProyecto, uid } from "../core/modelo.js";
import { paginasHtml, titulo as leerTitulo, recorrido, PESADAS } from "../assets/librito.js";
import { RAIZ, rutaAUrl } from "../assets/biblioteca.js";
import { ico } from "../components/iconos.js";

const RT = window.LibritoRT;
const SALTAR = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "HEAD", "TITLE", "SOURCE", "TRACK", "BASE"]);
const EN_LINEA = new Set(["inline", "contents"]);
const PROPS_ANIM = new Set(["offset", "easing", "transform", "opacity", "filter", "clipPath", "color", "backgroundColor", "boxShadow", "translate", "scale", "rotate"]);

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const cuadro = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const transparente = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0(\.0+)?\)$/.test(c);

/** Ruta del repositorio de una dirección (o null si es de fuera). */
function aRuta(url) {
  if (!url || !url.startsWith(RAIZ)) return null;
  try { return decodeURIComponent(url.slice(RAIZ.length).split(/[?#]/)[0]); } catch (e) { return null; }
}

export class Importador {
  constructor(app) {
    this.app = app;
    this.E = app.estado;
  }

  get P() { return this.E.proyecto; }

  /* ── La lista de tus páginas ────────────────────────────────────── */
  async misPaginas() {
    const lista = await paginasHtml();
    const ul = el("ul.ed-mis-paginas");
    let caja = null;
    for (const p of lista) {
      const nombre = el("b", { text: p.titulo });
      const li = el("li", {}, [
        el("div", {}, [nombre, el("small", { text: p.ruta.replace("paginas-html/", "") + (p.pesada ? " · escena pesada" : "") })]),
        el("div.ed-botonera", {}, [
          boton("Editar como plantilla", () => { caja.cerrar(); this.comoPlantilla(p.ruta, nombre.textContent, p.pesada); }, "chico primario"),
          boton("Usar tal cual", () => { caja.cerrar(); this.usarTalCual(p.ruta, nombre.textContent); }, "chico"),
          boton(ico("ojo"), () => open(rutaAUrl(p.ruta), "_blank"), "chico ico", "Verla en otra pestaña"),
        ]),
      ]);
      if (p.pesada) li.classList.add("pesada");
      ul.append(li);
      // El título se lee después y sin prisa (4 KB del principio).
      leerTitulo(p.ruta).then((t) => { if (t) { nombre.textContent = t; p.titulo = t; } });
    }
    const p = modal({
      titulo: "Mis páginas",
      ancho: 640,
      contenido: [
        el("p.ed-ayuda", { text: "«Editar como plantilla» saca a capas editables sus textos, fotos, adornos y animaciones, y deja debajo lo que se mueve con JavaScript. «Usar tal cual» la pone entera, funcionando igual que en el librito." }),
        ul,
        el("div.ed-botonera", {}, [boton(`${ico("biblioteca")}<span>Importar mi librito entero como proyecto nuevo</span>`, () => { caja.cerrar(); this.importarLibrito(); }, "chico")]),
      ],
    });
    caja = modal.ultima;
    return p;
  }

  usarTalCual(ruta, titulo) {
    const pg = nuevaPagina(this.P, { nombre: titulo || ruta.split("/").pop() });
    pg.els.push(nuevoEl("pagina", this.P, { nombre: "Página original · " + (titulo || ""), pagina: { ruta, titulo }, bloqueado: true }));
    this.app.acciones.nuevaPagina(pg);
    aviso("Lista: funciona igual que en el librito. Puedes poner cosas encima");
  }

  async comoPlantilla(ruta, titulo, pesada) {
    if (pesada && !(await modal({ titulo: "Escena pesada", contenido: el("p", { text: "Esta página es una escena grande (3D o con muchísimas cosas). Leerla tarda y gasta batería. ¿Seguir?" }), acciones: [["Cancelar", false], ["Seguir", true, "primario"]], ancho: 420 }))) return;
    const pg = nuevaPagina(this.P, { nombre: titulo || ruta.split("/").pop() });
    const base = nuevoEl("pagina", this.P, { nombre: "Página original · " + (titulo || ""), pagina: { ruta, titulo }, bloqueado: true });
    pg.els.push(base);
    this.app.acciones.nuevaPagina(pg);
    await this.hacerEditable(this.E.el(base.id));
  }

  /* ── Hacer editable ─────────────────────────────────────────────── */
  async hacerEditable(e, modo) {
    if (!e || e.tipo !== "pagina") return;
    if (!modo) {
      modo = await modal({
        titulo: "Hacer editable",
        ancho: 520,
        contenido: [el("p", { text: `Se van a sacar a capas los textos, fotos, adornos y animaciones de «${e.pagina.titulo || e.pagina.ruta}».` })],
        acciones: [["Cancelar", null], ["Sólo lo que se ve", "plano"], ["Conservar lo interactivo", "hibrido", "primario"]],
      });
      if (!modo) return;
    }
    const hibrido = modo === "hibrido";
    const prog = this._progreso("Leyendo la página…");
    try {
      const r = await this.leer(rutaAUrl(e.pagina.ruta), { hibrido, de: e.id, alProgreso: prog.poner });
      const pid = this.E.paginaId;
      const ids = [];
      this.E.transaccion("Hacer editable", () => {
        let i = this.E.pagina.els.findIndex((x) => x.id === e.id) + 1;
        for (const x of r.els) { this.E.agregarEl(x, i++, pid, false); ids.push(x.id); }
        if (r.fondo) this.E.setPag({ "fondo.css": r.fondo, "fondo.tipo": "color", "fondo.color": r.fondoColor || "#ffffff" }, "Fondo", null, pid);
        if (!hibrido) this.E.quitarEls([e.id], pid);
      });
      if (Object.keys(r.fuentes).length) {
        const extra = { ...(this.P.ajustes.fuentesExtra || {}), ...r.fuentes };
        this.E.setProy({ "ajustes.fuentesExtra": extra }, "Letras de la página");
        registrarFuentes(extra);
        RT.cargarFuentes(Object.keys(r.fuentes));
      }
      for (const ruta of r.audios) this.app.bib.delLibrito(ruta, "audio", ruta.split("/").pop().replace(/\.[^.]+$/, ""));
      this.E.seleccionar([]);
      aviso(`Listo: ${r.els.length} capas editables${r.audios.length ? ` · ${r.audios.length} canciones en Audio` : ""}${r.animadas ? ` · ${r.animadas} con su animación` : ""}`, 4200);
      if (!r.els.length) aviso("Esta página se dibuja casi toda con JavaScript: no había textos ni fotos que sacar. Sigue funcionando tal cual.", 5200);
    } catch (err) {
      console.error(err);
      aviso("No se pudo leer la página: " + err.message, 4000, "error");
    } finally { prog.cerrar(); }
  }

  _progreso(texto) {
    const t = el("p", { text: texto });
    const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), t])]);
    document.body.append(capa);
    return { poner: (x) => { t.textContent = x; }, cerrar: () => capa.remove() };
  }

  /**
   * Abre la página escondida, a tamaño de hoja, y la recorre.
   * Devuelve { els, fondo, fuentes, audios, animadas }.
   */
  async leer(url, { hibrido = true, de = null, alProgreso } = {}) {
    const { ancho: W, alto: H } = this.P.ajustes;
    const f = el("iframe.ed-lector", { title: "lectura", style: { width: W + "px", height: H + "px" } });
    f.src = url;
    document.body.append(f);
    try {
      await new Promise((ok) => { f.onload = ok; setTimeout(ok, 9000); });
      alProgreso?.("Dejando que la página se arme…");
      await espera(1500);
      const doc = f.contentDocument, win = f.contentWindow;
      if (!doc || !doc.body) throw new Error("la página no se pudo abrir");
      try { win.scrollTo(0, 0); } catch (err) { /* nada */ }
      // Las animaciones: primero se apuntan, luego se llevan a su final.
      const anims = new Map();
      try {
        for (const a of doc.getAnimations()) {
          const t = a.effect?.target;
          if (t && a.animationName && !anims.has(t)) anims.set(t, { nombre: a.animationName, frames: a.effect.getKeyframes(), tiempo: a.effect.getTiming() });
        }
        for (const a of doc.getAnimations()) {
          const it = a.effect?.getTiming?.().iterations;
          if (it === Infinity) { a.pause(); a.currentTime = 0; } else a.finish();
        }
      } catch (err) { /* navegador sin getAnimations */ }
      await cuadro();
      alProgreso?.("Sacando textos, fotos y adornos…");
      const r = await this._recorrer(doc, win, url, { W, H, hibrido, de, anims });
      return r;
    } finally { f.remove(); }
  }

  async _recorrer(doc, win, url, { W, H, hibrido, de, anims }) {
    const P = this.P;
    const bib = this.app.bib;
    const els = [];
    const pend = [];
    let animadas = 0;
    const fuentesUsadas = new Set();
    const selector = (n) => {
      const partes = [];
      while (n && n !== doc.body && n.parentElement) {
        const p = n.parentElement;
        partes.unshift(`:nth-child(${Array.prototype.indexOf.call(p.children, n) + 1})`);
        n = p;
      }
      return "body > " + partes.join(" > ");
    };
    const caja = (n, cs) => {
      const r = n.getBoundingClientRect();
      let rot = 0, k = 1;
      if (cs.transform && cs.transform !== "none") {
        try { const m = new DOMMatrix(cs.transform); rot = (Math.atan2(m.b, m.a) * 180) / Math.PI; k = Math.hypot(m.a, m.b); } catch (err) { /* nada */ }
      }
      let w = (n.offsetWidth ?? r.width) * k, h = (n.offsetHeight ?? r.height) * k;
      if (!w || !h) { w = r.width; h = r.height; rot = 0; }
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.max(2, Math.round(w)), h: Math.max(2, Math.round(h)), rot: Math.round(rot * 10) / 10 };
    };
    const comun = (n, cs, opac, modo) => {
      const o = { opacidad: Math.round(Math.min(1, opac) * 100) / 100 };
      if (hibrido && de) o.origen = { de, sel: selector(n), modo };
      const a = anims.get(n);
      if (a) {
        const raw = a.frames.map((f) => { const k = {}; for (const p in f) if (PROPS_ANIM.has(p) && f[p] != null && f[p] !== "") k[p] = f[p]; return k; }).filter((k) => Object.keys(k).length);
        if (raw.length >= 2) {
          const t = a.tiempo;
          o.anim = { entrada: { tipo: "ninguna" }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: { raw, nombre: a.nombre, dur: Math.round(+t.duration || 1000), retraso: Math.round(t.delay || 0), repetir: t.iterations === Infinity ? "inf" : t.iterations || 1, direccion: t.direction || "normal", facil: t.easing || "ease", relleno: t.fill === "auto" ? "none" : t.fill || "none" } };
          animadas++;
        }
      }
      return o;
    };
    const cajaCss = (cs) => {
      const c = {};
      const img = cs.backgroundImage;
      const col = cs.backgroundColor;
      if (img && img !== "none" && !/url\(/.test(img)) c.fondo = transparente(col) ? img : `${img}, ${col}`;
      else if (!transparente(col)) c.fondo = col;
      if (cs.borderRadius && cs.borderRadius !== "0px") c.radio = cs.borderRadius;
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw > 0 && cs.borderTopStyle !== "none" && !transparente(cs.borderTopColor)) c.borde = { ancho: bw, color: cs.borderTopColor, estilo: cs.borderTopStyle };
      if (cs.boxShadow && cs.boxShadow !== "none") c.sombra = cs.boxShadow;
      const bf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (bf && /blur\(([\d.]+)px/.test(bf)) c.vidrio = +RegExp.$1;
      return c;
    };
    const assetDe = async (src, nombre) => {
      if (!src) return null;
      if (/^(data:|blob:)/.test(src)) {
        try { const b = await (await fetch(src)).blob(); return (await bib.deBlob(b, "imagen", nombre || "imagen")).id; } catch (err) { return null; }
      }
      const ruta = aRuta(new URL(src, url).href);
      if (ruta) return bib.delLibrito(ruta, "imagen", nombre || ruta.split("/").pop()).id;
      return this.E.agregarAsset({ id: uid("a"), tipo: "imagen", nombre: nombre || "imagen", fuente: "url", ruta: src, creado: Date.now() }).id;
    };
    const interactivo = (n, cs) => {
      const t = n.tagName;
      return t === "BUTTON" || (t === "A" && n.hasAttribute("href")) || t === "INPUT" || t === "SELECT" || t === "TEXTAREA" || t === "LABEL" || t === "SUMMARY"
        || n.hasAttribute("onclick") || n.getAttribute("role") === "button" || n.isContentEditable || n.hasAttribute("data-claim-drag") || cs.cursor === "pointer";
    };
    // Letras rellenas con un degradado (background-clip: text).
    const recorteTexto = (cs) => /text/.test(cs.webkitBackgroundClip || cs.backgroundClip || "");
    // Una caja con algo vivo dentro (botones, lienzos…) se queda en el original:
    // si se sacara a una capa, quedaría ENCIMA de lo que hay que tocar.
    const VIVO = "button, a[href], input, select, textarea, canvas, video, iframe, [onclick], [role=button], [data-claim-drag], [contenteditable]";
    const vivo = (n) => !!n.querySelector(VIVO);
    const textoDirecto = (n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    const enLinea = (n) => [...n.children].every((c) => c.tagName === "BR" || EN_LINEA.has(win.getComputedStyle(c).display));
    const familia = (ff) => {
      const primera = (ff || "").split(",")[0].trim().replace(/^["']|["']$/g, "");
      if (RT.FUENTES[primera]) return primera;
      fuentesUsadas.add(primera);
      return ff;
    };

    const textoDe = (n, cs) => {
      // Copia con los estilos en línea de lo que cambia de color/grosor/cursiva.
      const copia = n.cloneNode(true);
      const orig = n.querySelectorAll("*"), cop = copia.querySelectorAll("*");
      orig.forEach((o, i) => {
        const s = win.getComputedStyle(o), c = cop[i];
        const est = [];
        if (s.color !== cs.color) est.push("color:" + s.color);
        if (s.fontWeight !== cs.fontWeight) est.push("font-weight:" + s.fontWeight);
        if (s.fontStyle !== cs.fontStyle) est.push("font-style:" + s.fontStyle);
        if (parseFloat(s.fontSize) !== parseFloat(cs.fontSize)) est.push("font-size:" + s.fontSize);
        c.setAttribute("style", est.join(";"));
      });
      if (!/^pre/.test(cs.whiteSpace)) {
        const tw = doc.createTreeWalker(copia, NodeFilter.SHOW_TEXT);
        const ns = [];
        while (tw.nextNode()) ns.push(tw.currentNode);
        for (const t of ns) t.textContent = t.textContent.replace(/\s+/g, " ");
        if (ns.length) { ns[0].textContent = ns[0].textContent.replace(/^ /, ""); ns[ns.length - 1].textContent = ns[ns.length - 1].textContent.replace(/ $/, ""); }
      }
      return RT.sanearTexto(copia.innerHTML);
    };

    const visitar = (n, opacPadre) => {
      const tag = n.tagName;
      if (SALTAR.has(tag)) return;
      const cs = win.getComputedStyle(n);
      if (cs.display === "none") return;
      const opac = opacPadre * (parseFloat(cs.opacity) || 0);
      const oculto = cs.visibility === "hidden" || opac < 0.04;
      const r = n.getBoundingClientRect();
      if (r.right < -40 || r.left > W + 40 || r.top > H * 2.5 || r.bottom < -40) return;
      if (hibrido && interactivo(n, cs)) return;
      const b = caja(n, cs);
      if (tag === "IMG") {
        if (!oculto && r.width > 4 && r.height > 4) {
          const o = comun(n, cs, opac, "todo");
          const c = cajaCss(cs);
          pend.push(assetDe(n.currentSrc || n.src, n.alt).then((id) => id && els.push({ orden: ordenDe(n), el: nuevoEl("imagen", P, { ...b, nombre: n.alt || "Foto", caja: c, ...o, imagen: { asset: id, ajuste: cs.objectFit === "contain" ? "contain" : cs.objectFit === "fill" ? "fill" : "cover", filtro: cs.filter !== "none" ? cs.filter : null } }) })));
        }
        return;
      }
      if (tag === "svg" || tag === "SVG") {
        if (!oculto && r.width > 4 && r.height > 4) {
          const copia = n.cloneNode(true);
          const or = [n, ...n.querySelectorAll("*")], cp = [copia, ...copia.querySelectorAll("*")];
          or.forEach((o, i) => {
            const s = win.getComputedStyle(o);
            for (const p of ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity"]) { const v = s.getPropertyValue(p); if (v && v !== "none" || p === "fill") cp[i].setAttribute(p, v || "none"); }
          });
          if (!copia.getAttribute("viewBox")) copia.setAttribute("viewBox", `0 0 ${Math.round(r.width)} ${Math.round(r.height)}`);
          copia.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          els.push({ orden: ordenDe(n), el: nuevoEl("dibujo", P, { ...b, nombre: "Dibujo", ...comun(n, cs, opac, "todo"), dibujo: { svg: copia.outerHTML, color: cs.color, estirar: true } }) });
        }
        return;
      }
      if (tag === "CANVAS") {
        if (!hibrido && !oculto && r.width > 8 && r.height > 8) {
          try {
            const datos = n.toDataURL("image/png");
            pend.push(assetDe(datos, "dibujo de la página").then((id) => id && els.push({ orden: ordenDe(n), el: nuevoEl("imagen", P, { ...b, nombre: "Lienzo (como foto)", ...comun(n, cs, opac, "todo"), imagen: { asset: id, ajuste: "fill" } }) })));
          } catch (err) { /* lienzo con cosas de fuera: no se puede leer */ }
        }
        return;
      }
      if (tag === "IFRAME" || tag === "VIDEO" || tag === "AUDIO" || tag === "OBJECT" || tag === "EMBED") return;
      if (!oculto) {
        const pagina = r.width >= W * 0.95 && r.height >= H * 0.9;
        const c = cajaCss(cs);
        const url = /url\(["']?([^"')]+)["']?\)/.exec(cs.backgroundImage)?.[1];
        if (url && !pagina && r.width > 6 && r.height > 6) {
          const o = comun(n, cs, opac, "caja");
          pend.push(assetDe(url, "fondo").then((id) => id && els.push({ orden: ordenDe(n), el: nuevoEl("imagen", P, { ...b, nombre: "Imagen de fondo", caja: { radio: c.radio, sombra: c.sombra }, ...o, imagen: { asset: id, ajuste: cs.backgroundSize === "contain" ? "contain" : "cover" } }) })));
        } else if ((c.fondo || c.borde || c.sombra) && !pagina && !recorteTexto(cs) && !(hibrido && vivo(n)) && r.width > 2 && r.height > 2) {
          els.push({ orden: ordenDe(n), el: nuevoEl("forma", P, { ...b, nombre: "Caja", caja: c, ...comun(n, cs, opac, "caja"), forma: { figura: "rect", relleno: "transparent", grosor: 0 } }) });
        }
        if (textoDirecto(n) && enLinea(n)) {
          const rg = doc.createRange();
          rg.selectNodeContents(n);
          const tr = rg.getBoundingClientRect();
          const t = tr.width > 1 ? { x: Math.round(tr.left) - 2, y: Math.round(tr.top), w: Math.round(tr.width) + 4, h: Math.round(tr.height) + 2, rot: b.rot } : b;
          const lh = cs.lineHeight === "normal" ? 1.2 : parseFloat(cs.lineHeight) / (parseFloat(cs.fontSize) || 16);
          const sombra = cs.textShadow && cs.textShadow !== "none" ? cs.textShadow : null;
          els.push({ orden: ordenDe(n) + 0.5, el: nuevoEl("texto", P, {
            ...t, nombre: n.textContent.trim().slice(0, 28) || "Texto", ...comun(n, cs, opac, "texto"),
            texto: {
              html: textoDe(n, cs), fuente: familia(cs.fontFamily), tam: Math.round(parseFloat(cs.fontSize) * 10) / 10, peso: +cs.fontWeight || 400,
              cursiva: cs.fontStyle === "italic", alin: { start: "left", end: "right", "-webkit-center": "center" }[cs.textAlign] || cs.textAlign,
              color: cs.color, interletra: cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing) || 0, interlinea: Math.round(lh * 100) / 100,
              sombra, mayus: cs.textTransform === "uppercase", subrayado: /underline/.test(cs.textDecorationLine || cs.textDecoration), valin: "arriba",
              relleno: recorteTexto(cs) ? cajaCss(cs).fondo || null : null,
            },
          }) });
          return;
        }
      }
      for (const c of n.children) visitar(c, opac);
    };
    const todos = [...doc.body.querySelectorAll("*")];
    const indice = new Map(todos.map((n, i) => [n, i]));
    const ordenDe = (n) => indice.get(n) ?? 0;

    for (const c of doc.body.children) visitar(c, 1);
    await Promise.all(pend);
    els.sort((a, b) => a.orden - b.orden);

    // Fondo de la página.
    let fondo = null, fondoColor = null;
    for (const n of [doc.body, doc.documentElement]) {
      const cs = win.getComputedStyle(n);
      const c = cajaCss(cs);
      if (c.fondo) { fondo = c.fondo; fondoColor = transparente(cs.backgroundColor) ? null : cs.backgroundColor; break; }
    }
    if (!fondo) {
      // Un contenedor que cubre toda la hoja hace de fondo.
      for (const n of doc.body.children) {
        const r = n.getBoundingClientRect();
        if (r.width >= W * 0.95 && r.height >= H * 0.9) { const c = cajaCss(win.getComputedStyle(n)); if (c.fondo) { fondo = c.fondo; break; } }
      }
    }

    // Las letras de Google que usa (sólo las que de verdad salen en los textos).
    const fuentes = {};
    for (const l of doc.querySelectorAll('link[href*="fonts.googleapis.com"]')) {
      try {
        for (const fam of new URL(l.href).searchParams.getAll("family")) {
          const nombre = fam.split(":")[0].replace(/\+/g, " ");
          if (fuentesUsadas.has(nombre) && !RT.FUENTES[nombre]) fuentes[nombre] = fam.replace(/ /g, "+");
        }
      } catch (err) { /* nada */ }
    }

    // Canciones que menciona (se apuntan, no se descargan).
    const audios = new Set();
    const html = doc.documentElement.outerHTML;
    for (const m of html.matchAll(/["'`(]([^"'`()\s<>]+?\.(?:mp3|m4a|ogg|wav|aac))["'`)]/gi)) {
      try { const r = aRuta(new URL(m[1], url).href); if (r) audios.add(r); } catch (err) { /* nada */ }
    }
    try {
      const A = win.LIBRITO_ARCHIVOS;
      if (A) for (const v of Object.values(A).flat()) if (typeof v === "string" && /\.(mp3|m4a|ogg|wav)$/i.test(v)) { const r = aRuta(new URL(v, url).href); if (r) audios.add(r); }
    } catch (err) { /* nada */ }

    return { els: els.map((x) => x.el), fondo, fondoColor, fuentes, audios: [...audios], animadas };
  }

  /* ── El librito entero, como proyecto nuevo ─────────────────────── */
  async importarLibrito() {
    const incluirPesadas = el("input", { type: "checkbox" });
    const ok = await modal({
      titulo: "Importar mi librito",
      ancho: 520,
      contenido: [
        el("p", { text: "Se crea un proyecto NUEVO con todo el librito de siempre (el tuyo no se toca):" }),
        el("ul.ed-lista", {}, [
          el("li", { text: "Las páginas HTML entran tal cual, funcionando. Cada una tiene «Hacer editable» para sacar sus textos y fotos." }),
          el("li", { text: "Las páginas con mecánica propia del libro (sobre, rascar, candado…) entran como cartas editables con su texto y sus fotos." }),
          el("li", { text: "No se descarga nada ahora: las fotos y canciones se piden cuando las ves." }),
        ]),
        el("label.ed-fila", {}, [incluirPesadas, el("span", { text: "Incluir también las escenas pesadas (la ciudad 3D…)" })]),
      ],
      acciones: [["Cancelar", false], ["Importar", true, "primario"]],
    });
    if (!ok) return;
    const prog = this._progreso("Armando tu librito…");
    try {
      const rec = await recorrido();
      const P = nuevoProyecto("Mi librito (editable)");
      const { ancho: W, alto: H } = P.ajustes;
      const assets = P.assets;
      const ref = (ruta, tipo, nombre) => {
        const ya = Object.values(assets).find((a) => a.ruta === ruta);
        if (ya) return ya.id;
        const id = uid("a");
        assets[id] = { id, tipo, nombre: nombre || ruta.split("/").pop(), archivo: ruta.split("/").pop(), fuente: "librito", ruta, creado: Date.now() };
        return id;
      };
      const TRANS = { none: "ninguna", dissolve: "disolver", flip: "voltear", zoom: "zoom", fade: "fundido", slide: "deslizar", push: "empujar", ink: "circulo", iris: "circulo", heart: "circulo", tide: "cortina", bloom: "desenfoque", fold: "hoja", pageflip: "hoja" };
      const poner = (pg, t) => { pg.transicion = t && TRANS[t] ? { tipo: TRANS[t], dur: 800, dir: "auto", facil: "entraSale" } : null; P.paginas[pg.id] = pg; P.orden.push(pg.id); };
      const titulos = await paginasHtml();
      for (const e of rec) {
        if (e.ruta && /\.html$/i.test(e.ruta)) {
          if (PESADAS.test(e.ruta) && !incluirPesadas.checked) continue;
          const t = e.cap?.title || titulos.find((x) => x.ruta === e.ruta)?.titulo || e.ruta.split("/").pop();
          const pg = nuevaPagina(P, { nombre: t });
          pg.els.push(nuevoEl("pagina", P, { nombre: "Página original · " + t, pagina: { ruta: e.ruta, titulo: t }, bloqueado: true }));
          poner(pg, e.transicion);
          continue;
        }
        if (e.tipo === "cover") {
          const pg = nuevaPagina(P, { nombre: "Portada", fondo: { tipo: "gradiente", color: "#1c0e2e", gradiente: { a: "#3a1d47", b: "#14091b", angulo: 170, tipo: "radial" } } });
          if (e.fotos[0]) pg.els.push(nuevoEl("imagen", P, { nombre: "Foto de portada", x: 30, y: 110, w: W - 60, h: Math.round(H * 0.55), caja: { radio: 18, sombra: { x: 0, y: 18, blur: 40, color: "rgba(0,0,0,.45)" } }, imagen: { asset: ref(e.fotos[0], "imagen", "portada") }, anim: { entrada: { tipo: "zoom", dur: 1200 }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null } }));
          pg.els.push(nuevoEl("texto", P, { nombre: "Título", x: 24, y: Math.round(H * 0.55) + 140, w: W - 48, h: 70, texto: { html: "Marissa · Mi Amorcito", fuente: "Cormorant Garamond", tam: 40, peso: 600, cursiva: true, color: "#ffe9f1" }, anim: { entrada: { tipo: "desenfoque", dur: 1200, retraso: 500 }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null } }));
          poner(pg, null);
          P.ajustes.portada = pg.id;
          continue;
        }
        const c = e.cap;
        if (!c || (!c.text && !c.title)) continue;
        const pal = c.palette || { a: "#ffb0cb", b: "#e0457f", deep: "#1a1030" };
        const pg = nuevaPagina(P, { nombre: c.title || e.id, fondo: { tipo: "gradiente", color: "#fff8f5", gradiente: { a: "#fffaf6", b: mezclaSuave(pal.a), angulo: 180, tipo: "lineal" } } });
        const texto = String(c.text || "");
        const largo = texto.length > 520 || e.fotos.length === 0;
        let y = 64;
        const poner_ = (nombre, html, x, w, t, anim) => {
          const h = medirTexto(html, t, w);
          pg.els.push(nuevoEl("texto", P, { nombre, x, y, w, h, texto: { html, ...t }, anim }));
          y += h + 12;
          return h;
        };
        if (c.kicker) poner_("Antetítulo", RT.textoAHtml(c.kicker), 30, W - 60, { fuente: "Jost", tam: 13, peso: 500, interletra: 2, mayus: true, color: pal.b }, anima("aparecer", 0));
        if (c.title) poner_("Título", RT.textoAHtml(c.title), 24, W - 48, { fuente: "Cormorant Garamond", tam: 36, peso: 600, color: pal.deep, interlinea: 1.1 }, anima("deslizar", 150));
        y += 6;
        const hT = poner_("Texto", RT.textoAHtml(texto), 30, W - 60, { fuente: "Cormorant Garamond", tam: 19, peso: 500, alin: "left", interlinea: 1.55, color: pal.deep }, anima("aparecer", 450));
        y -= hT + 12;
        poner(pg, e.transicion);
        const fotos = e.fotos.map((f) => ref(f, "imagen", f.split("/").slice(-2).join(" · ")));
        if (fotos.length) {
          const destino = largo ? nuevaPagina(P, { nombre: (c.title || "Fotos") + " · fotos", fondo: pg.fondo }) : pg;
          const yf = largo ? 80 : Math.min(H - 300, y + hT + 24);
          const hf = largo ? H - 160 : H - yf - 40;
          if (fotos.length === 1) destino.els.push(nuevoEl("imagen", P, { nombre: "Foto", x: W / 2 - Math.min(150, hf * 0.42), y: yf, w: Math.min(300, hf * 0.84), h: hf, rot: -2, imagen: { asset: fotos[0], marco: "polaroid" }, anim: anima("zoom", 700) }));
          else destino.els.push(nuevoEl("carrusel", P, { nombre: "Fotos", x: 30, y: yf, w: W - 60, h: hf, carrusel: { fotos, modo: "cartas" } }));
          if (largo) poner(destino, "fade");
        }
      }
      const musica = Object.values(assets).find((a) => a.ruta === "assets/audio/musica.mp3");
      P.ajustes.musica.asset = musica ? musica.id : ref("assets/audio/musica.mp3", "audio", "Música del librito");
      prog.poner("Guardando…");
      await this.app.abrirProyecto(P, true);
      aviso(`Tu librito: ${P.orden.length} páginas listas para editar`, 4000);
    } catch (err) {
      console.error(err);
      aviso("No se pudo importar: " + err.message, 4000, "error");
    } finally { prog.cerrar(); }
  }
}

/** Alto real de un texto con su letra y su ancho (se mide en la página, escondido). */
function medirTexto(html, t, ancho) {
  const d = document.createElement("div");
  d.className = "rt-t";
  Object.assign(d.style, { position: "absolute", left: "-9999px", top: "0", width: ancho + "px", fontFamily: RT.pilaFuente(t.fuente), fontSize: t.tam + "px", fontWeight: t.peso || 400, lineHeight: t.interlinea || 1.3, letterSpacing: (t.interletra || 0) + "px", textTransform: t.mayus ? "uppercase" : "", whiteSpace: "pre-wrap" });
  d.innerHTML = html;
  document.body.append(d);
  const h = Math.ceil(d.offsetHeight) + 4;
  d.remove();
  return h;
}

function anima(tipo, retraso) {
  return { entrada: { tipo, dur: 900, retraso, facil: "suave", dir: "arriba", dist: 26 }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null };
}

function mezclaSuave(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  if (isNaN(n)) return "#fde6ee";
  const m = (c) => Math.round(c + (255 - c) * 0.72);
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => m(c).toString(16).padStart(2, "0")).join("");
}

/** Letras de Google que trajo una página importada. */
export function registrarFuentes(extra) {
  for (const [n, g] of Object.entries(extra || {})) if (!RT.FUENTES[n]) RT.FUENTES[n] = { g, pila: "Georgia, serif", tipo: "serif" };
}
