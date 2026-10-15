/**
 * ANALIZAR UN COMPONENTE — dónde se toca, qué es fondo y qué se ve.
 *
 * Se abre el componente escondido, a su tamaño natural, y se MIRA (nunca se
 * cambia nada de su HTML, su CSS ni su JavaScript):
 *
 *   interactivos  botones, enlaces, campos, lo que tiene `cursor: pointer`,
 *                 `onclick`, `role="button"`… → la zona táctil real
 *   fondo         lo que pinta detrás (html/body, o algo que ocupa casi todo
 *                 sin ser tocable). Si dentro hay algo tocable, sólo cuenta su
 *                 pintura («caja»); si no, el elemento entero («todo»)
 *   visual        lo demás que se ve (textos, imágenes, dibujos, lienzos)
 *
 * Con eso el editor ajusta SU propia zona para seleccionarlo (no la del
 * componente) y sabe qué quitar si TÚ pides «Eliminar fondo». Son dos cosas
 * independientes: detectar no quita nada.
 *
 *   contenido     el recuadro de lo que DE VERDAD se ve: el texto (no la caja
 *                 entera del párrafo), lo pintado en los lienzos (mirando sus
 *                 píxeles unas cuantas veces, por si se mueve) y lo demás. Con
 *                 él, el elemento se encuadra a su contenido en vez de ocupar
 *                 todo el marco (el hitbox deja de ser gigante).
 */
const VIVO = "button, a[href], input, select, textarea, summary, label[for], [onclick], [role=button], [role=link], [role=slider], [tabindex]:not([tabindex='-1']), [data-claim-drag], [contenteditable=''], [contenteditable=true], video[controls], audio[controls]";
const MEDIA = new Set(["IMG", "SVG", "CANVAS", "VIDEO", "PICTURE"]);
const transparente = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0(\.0+)?\)$/.test(c);

function selector(doc, n) {
  if (n === doc.documentElement) return "html";
  if (n === doc.body) return "body";
  const partes = [];
  while (n && n !== doc.body && n.parentElement) {
    const p = n.parentElement;
    partes.unshift(`:nth-child(${Array.prototype.indexOf.call(p.children, n) + 1})`);
    n = p;
  }
  return "body > " + partes.join(" > ");
}

const caja = (r) => ({ x: Math.max(0, Math.floor(r.left ?? r.x)), y: Math.max(0, Math.floor(r.top ?? r.y)), w: Math.ceil(r.width ?? r.w), h: Math.ceil(r.height ?? r.h) });
const juntar = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lo pintado en un lienzo 2D (coordenadas del marco). `null` = nada pintado;
 *  `undefined` = no se puede saber (WebGL o protegido): cuenta entero. */
function pintadoDe(cv, doc) {
  const r = cv.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  try {
    // En el marco de análisis (se tira después) pedir el contexto 2D no estorba;
    // si el lienzo es WebGL devuelve null y no se toca.
    if (!cv.getContext("2d")) return undefined;
    const k = Math.min(1, 180 / Math.max(r.width, r.height));
    const w = Math.max(1, Math.round(r.width * k)), h = Math.max(1, Math.round(r.height * k));
    const t = doc.createElement("canvas");
    t.width = w; t.height = h;
    const g = t.getContext("2d", { willReadFrequently: true });
    g.drawImage(cv, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    return { x: r.left + x0 / k, y: r.top + y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
  } catch (e) { return undefined; }
}

function pinta(cs) {
  return !transparente(cs.backgroundColor) || (cs.backgroundImage && cs.backgroundImage !== "none") || (cs.boxShadow && cs.boxShadow !== "none") || (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none" && !transparente(cs.borderTopColor));
}

function unir(zonas, max) {
  if (zonas.length <= max) return zonas;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const z of zonas) { x0 = Math.min(x0, z.x); y0 = Math.min(y0, z.y); x1 = Math.max(x1, z.x + z.w); y1 = Math.max(y1, z.y + z.h); }
  return [{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
}

/** Abre el componente escondido y lo analiza. */
export async function analizar(url, { ancho, alto, aislado } = {}) {
  let W = ancho || 360, H = alto || 360;
  const natural = { w: W, h: H };
  if (aislado) return { natural, interactivos: [], visual: [], fondo: [], resumen: "aislado: no se puede mirar por dentro" };
  const f = document.createElement("iframe");
  f.className = "ed-lector";
  f.style.width = W + "px";
  f.style.height = H + "px";
  f.src = url;
  document.body.append(f);
  try {
    await new Promise((ok) => { f.onload = ok; setTimeout(ok, 6000); });
    await new Promise((r) => setTimeout(r, 700));
    const doc = f.contentDocument, win = f.contentWindow;
    if (!doc || !doc.body) return { natural, interactivos: [], visual: [], fondo: [], resumen: "" };
    // Sin tamaño declarado: si lo que dibuja es más grande que la prueba (un lienzo
    // de 400×650, algo centrado que se sale…), el marco crece hasta abarcarlo.
    // Nunca se achica: lo que llena la pantalla o se anima hacia afuera no se corta.
    if (!ancho || !alto) {
      let x0 = 0, y0 = 0, x1 = W, y1 = H;
      for (const n of doc.body.querySelectorAll("*")) {
        const r = n.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.width > 4000 || r.height > 4000) continue;
        const cs = win.getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      }
      const nw = Math.min(1600, Math.ceil(x1 - x0)), nh = Math.min(2000, Math.ceil(y1 - y0));
      if ((!ancho && nw > W + 8) || (!alto && nh > H + 8)) {
        if (!ancho) W = Math.max(W, nw);
        if (!alto) H = Math.max(H, nh);
        natural.w = W; natural.h = H;
        f.style.width = W + "px"; f.style.height = H + "px";
        await new Promise((r) => setTimeout(r, 450));
      }
    }
    const area = W * H;
    const interactivos = [], vivos = [], fondo = [], visual = [];
    const dentroDe = (lista, n) => lista.some((x) => x !== n && x.contains(n));
    for (const n of [doc.documentElement, doc.body]) {
      const cs = win.getComputedStyle(n);
      if (pinta(cs)) fondo.push({ sel: selector(doc, n), modo: "caja", x: 0, y: 0, w: W, h: H });
    }
    const todos = [...doc.body.querySelectorAll("*")];
    const estilos = new Map();
    const visible = (n) => {
      let cs = estilos.get(n);
      if (!cs) { cs = win.getComputedStyle(n); estilos.set(n, cs); }
      return cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.02 ? cs : null;
    };
    const texto = (n) => {
      if (!/\S/.test(n.textContent || "")) return null;
      const rg = doc.createRange();
      rg.selectNodeContents(n);
      const r = rg.getBoundingClientRect();
      return r.width > 1 && r.height > 1 ? r : null;
    };
    // Lo que se ve de verdad, mirado varias veces (por si se mueve): los lienzos
    // por sus píxeles, el texto por sus letras y lo demás por su caja.
    const lienzos = new Map();
    const cvs = todos.filter((n) => n.tagName === "CANVAS" && visible(n));
    const queSeVe = (n) => {
      const cs = visible(n);
      if (!cs || /^(SCRIPT|STYLE|LINK|META|TEMPLATE|HTML|BODY)$/i.test(n.tagName)) return null;
      const tag = n.tagName.toUpperCase();
      if (tag !== "SVG" && n.closest("svg")) return null;
      if (tag === "CANVAS") { const p = lienzos.get(n); return p === "?" ? n.getBoundingClientRect() : p || null; }
      if (MEDIA.has(tag) || pinta(cs)) return n.getBoundingClientRect();
      return n.children.length ? null : texto(n);
    };
    const miradas = [];
    for (let i = 0; i < 4; i++) {
      if (i) await espera(350);
      for (const cv of cvs) {
        if (lienzos.get(cv) === "?") continue;
        const p = pintadoDe(cv, doc);
        if (p === undefined) { lienzos.set(cv, "?"); continue; }
        const a = lienzos.get(cv);
        lienzos.set(cv, a && p ? juntar(a, p) : a || p);
      }
      let u = null;
      for (const n of todos) {
        const r = queSeVe(n);
        if (!r) continue;
        const q = caja(r);
        if (q.w < 2 || q.h < 2 || q.x > W || q.y > H) continue;
        u = u ? juntar(u, q) : q;
      }
      miradas.push(u);
    }
    // 1 · Lo que se toca (el de más afuera, sin repetir lo de dentro).
    for (const n of todos) {
      const cs = visible(n);
      if (!cs || /^(SCRIPT|STYLE|LINK|META|TEMPLATE)$/.test(n.tagName)) continue;
      const esVivo = n.matches(VIVO) || (cs.cursor === "pointer" && (!n.parentElement || win.getComputedStyle(n.parentElement).cursor !== "pointer"));
      if (!esVivo || dentroDe(vivos, n)) continue;
      let r = n.getBoundingClientRect();
      // Un lienzo tocable: su zona es lo que tiene pintado (no el lienzo entero).
      if (n.tagName === "CANVAS") { const p = lienzos.get(n); if (p === null) continue; if (p && p !== "?") r = p; }
      const q = caja(r);
      if (q.w < 4 || q.h < 4 || q.x + q.w < 0 || q.y + q.h < 0 || q.x > W || q.y > H) continue;
      vivos.push(n);
      interactivos.push({ ...q, que: (n.getAttribute("aria-label") || n.textContent || n.tagName).trim().slice(0, 24) });
    }
    // 2 · El fondo: lo que ocupa casi todo y no es tocable.
    const fondos = [];
    for (const n of todos) {
      const cs = visible(n);
      if (!cs || vivos.includes(n)) continue;
      const r = n.getBoundingClientRect();
      if (r.width * r.height < area * 0.6) continue;
      const imagen = n.tagName === "IMG" || (MEDIA.has(n.tagName.toUpperCase()) && n.tagName !== "CANVAS");
      if (!pinta(cs) && !imagen) continue;
      if (dentroDe(fondos, n)) continue;
      const conVivo = vivos.some((v) => n.contains(v));
      fondos.push(n);
      fondo.push({ sel: selector(doc, n), modo: conVivo ? "caja" : "todo", ...caja(r) });
    }
    // 3 · Lo demás que se ve (sin contar lo que es fondo o adorno del fondo).
    for (const n of todos) {
      const cs = visible(n);
      if (!cs || vivos.includes(n) || dentroDe(vivos, n) || fondos.includes(n)) continue;
      if (fondos.some((fo) => fo.contains(n) && !vivos.some((v) => fo.contains(v)))) continue;
      const tag = n.tagName.toUpperCase();
      const hoja = MEDIA.has(tag) || !n.children.length;
      if (!hoja && !pinta(cs)) continue;
      const r = queSeVe(n);
      if (!r) continue;
      const q = caja(r);
      if (q.w < 2 || q.h < 2) continue;
      visual.push(q);
    }
    // El recuadro de lo que se ve (con un margen, sin salirse del marco). Si
    // creció mucho entre una mirada y otra, lo de adentro se mueve por todo el
    // marco: entonces el elemento conserva el marco entero.
    let contenido = null;
    for (const u of miradas) if (u) contenido = contenido ? juntar(contenido, u) : u;
    const primera = miradas.find(Boolean);
    const mueve = !!(contenido && primera && contenido.w * contenido.h > primera.w * primera.h * 1.35);
    for (const q of [...interactivos, ...fondo.filter((z) => z.w)]) contenido = contenido ? juntar(contenido, q) : { x: q.x, y: q.y, w: q.w, h: q.h };
    if (contenido) {
      const m = Math.max(10, Math.round(Math.max(contenido.w, contenido.h) * 0.06));
      const x = Math.max(0, contenido.x - m), y = Math.max(0, contenido.y - m);
      contenido = { x, y, w: Math.min(W, contenido.x + contenido.w + m) - x, h: Math.min(H, contenido.y + contenido.h + m) - y };
      if (contenido.w < 8 || contenido.h < 8) contenido = null;
    }
    const res = [];
    if (interactivos.length) res.push(interactivos.length === 1 ? "1 zona táctil" : `${interactivos.length} zonas táctiles`);
    if (fondo.some((z) => z.sel !== "html" && z.sel !== "body") || fondo.length) res.push("fondo decorativo");
    return { natural, contenido, mueve, interactivos: unir(interactivos, 16), visual: unir(visual, 24), fondo, resumen: res.join(" · ") || "sin zonas detectadas" };
  } catch (e) {
    return { natural, interactivos: [], visual: [], fondo: [], resumen: "no se pudo mirar por dentro" };
  } finally { f.remove(); }
}

/** ¿Este punto (en coordenadas naturales del componente) toca su zona? */
export function tocaZona(an, x, y, pad = 6) {
  if (!an) return true;
  const zonas = an.interactivos && an.interactivos.length ? an.interactivos : an.visual && an.visual.length ? an.visual : null;
  if (!zonas) return true;
  return zonas.some((z) => x >= z.x - pad && x <= z.x + z.w + pad && y >= z.y - pad && y <= z.y + z.h + pad);
}
