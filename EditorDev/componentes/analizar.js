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

const caja = (r) => ({ x: Math.max(0, Math.floor(r.left)), y: Math.max(0, Math.floor(r.top)), w: Math.ceil(r.width), h: Math.ceil(r.height) });

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
    // 1 · Lo que se toca (el de más afuera, sin repetir lo de dentro).
    for (const n of todos) {
      const cs = visible(n);
      if (!cs || /^(SCRIPT|STYLE|LINK|META|TEMPLATE)$/.test(n.tagName)) continue;
      const esVivo = n.matches(VIVO) || (cs.cursor === "pointer" && (!n.parentElement || win.getComputedStyle(n.parentElement).cursor !== "pointer"));
      if (!esVivo || dentroDe(vivos, n)) continue;
      const r = n.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
      vivos.push(n);
      interactivos.push({ ...caja(r), que: (n.getAttribute("aria-label") || n.textContent || n.tagName).trim().slice(0, 24) });
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
      if (tag === "SVG" ? false : n.closest("svg")) continue;
      const r = n.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      visual.push(caja(r));
    }
    const res = [];
    if (interactivos.length) res.push(interactivos.length === 1 ? "1 zona táctil" : `${interactivos.length} zonas táctiles`);
    if (fondo.some((z) => z.sel !== "html" && z.sel !== "body") || fondo.length) res.push("fondo decorativo");
    return { natural, interactivos: unir(interactivos, 16), visual: unir(visual, 24), fondo, resumen: res.join(" · ") || "sin zonas detectadas" };
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
