/**
 * PORTADITA — la miniatura de una página, para la colección de Detallitos.
 *
 * Se dibuja al mandarla, en un lienzo, con lo que la página tiene: su fondo
 * (color, degradado o foto), sus fotos (con su encuadre, su forma y su
 * marco), sus letras (con su letra, tamaño, color y alineación), sus formas,
 * dibujos, trazos y botones, cada uno girado y con su transparencia. Lo que
 * no se puede dibujar quieto (un HTML, un video, una escena 3D) queda como
 * una manchita suave de su color: la portadita se reconoce sin tener que
 * abrir la página. Nada de marcos ni capturas: sale igual en Android, iPhone
 * y computadora, y pesa unos pocos KB.
 *
 *   dibujarPortadita(app, pagina) → Blob (webp o jpg) o null
 */
const RT = () => window.LibritoRT;

function cargar(url) {
  return new Promise((ok) => {
    if (!url) return ok(null);
    const im = new Image();
    if (!/^(blob|data):/.test(url) && new URL(url, location.href).origin !== location.origin) im.crossOrigin = "anonymous";
    im.decoding = "async";
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = url;
  });
}

/** Un degradado del librito ({ a, b, angulo, tipo }) para el lienzo, dentro de la caja (x, y, w, h). */
function degradado(g, cx, x, y, w, h) {
  const a = g.a || "#ffd9ea", b = g.b || "#ff7fae";
  let gr;
  if (g.tipo === "radial") {
    const px = x + (w * (g.cx ?? 50)) / 100, py = y + (h * (g.cy ?? 40)) / 100;
    gr = cx.createRadialGradient(px, py, 0, px, py, Math.hypot(w, h) * 0.6);
  } else {
    const ang = ((g.angulo ?? 160) * Math.PI) / 180, dx = Math.sin(ang) / 2, dy = -Math.cos(ang) / 2;
    gr = cx.createLinearGradient(x + w * (0.5 - dx), y + h * (0.5 - dy), x + w * (0.5 + dx), y + h * (0.5 + dy));
  }
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  return gr;
}

function caminoRedondo(cx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
  cx.beginPath();
  if (cx.roundRect) cx.roundRect(x, y, w, h, r);
  else cx.rect(x, y, w, h);
}

/** «cover» con el encuadre del librito (x, y en % y zoom). */
function foto(cx, im, x, y, w, h, { ajuste = "cover", rx = 50, ry = 50, zoom = 1 } = {}) {
  const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  if (!iw || !ih) return;
  const k = (ajuste === "contain" ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * (zoom || 1);
  const dw = iw * k, dh = ih * k;
  cx.drawImage(im, x + (w - dw) * (rx / 100), y + (h - dh) * (ry / 100), dw, dh);
}

/** Las letras de un texto del librito, con sus saltos de línea. */
function letras(html) {
  const limpio = String(RT()?.sanearTexto ? RT().sanearTexto(html || "") : html || "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6])>/gi, "\n");
  return (new DOMParser().parseFromString(limpio, "text/html").body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

function renglones(cx, texto, ancho) {
  const out = [];
  for (const parrafo of texto.split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = linea ? linea + " " + palabra : palabra;
      if (cx.measureText(prueba).width > ancho && linea) { out.push(linea); linea = palabra; }
      else linea = prueba;
    }
    out.push(linea);
  }
  return out;
}

async function elemento(cx, e, app, k, imgs) {
  const R = RT(), x = e.x * k, y = e.y * k, w = e.w * k, h = e.h * k;
  cx.save();
  cx.globalAlpha = Math.max(0, Math.min(1, e.opacidad ?? 1));
  cx.translate(x + w / 2, y + h / 2);
  if (e.rot) cx.rotate((e.rot * Math.PI) / 180);
  cx.translate(-w / 2, -h / 2);
  // La caja (fondo, borde y esquinas) de cualquier elemento.
  const c = e.caja || {}, radio = (typeof c.radio === "number" ? c.radio : parseFloat(c.radio) || 0) * k;
  if (c.fondo || c.gradiente) { caminoRedondo(cx, 0, 0, w, h, radio); cx.fillStyle = c.gradiente ? degradado(c.gradiente, cx, 0, 0, w, h) : c.fondo; cx.fill(); }
  const t = e.tipo;
  if (t === "imagen" || t === "album" || t === "carrusel") {
    const im = e.imagen || {}, id = im.asset || e[t]?.fotos?.[0]?.asset || e[t]?.items?.[0]?.asset;
    const img = imgs.get(id);
    let pad = 0;
    if (im.marco === "polaroid") { pad = Math.min(w, h) * 0.06; cx.fillStyle = "#fffdf8"; cx.fillRect(0, 0, w, h); }
    cx.save();
    if (im.forma === "circulo") { cx.beginPath(); cx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); cx.clip(); }
    else { caminoRedondo(cx, pad, pad, w - pad * 2, h - pad * (im.marco === "polaroid" ? 4 : 2), radio); cx.clip(); }
    if (img) { const r = im.recorte || {}; foto(cx, img, pad, pad, w - pad * 2, h - pad * (im.marco === "polaroid" ? 4 : 2), { ajuste: im.ajuste, rx: r.x ?? 50, ry: r.y ?? 50, zoom: r.zoom || 1 }); }
    else { cx.fillStyle = "rgba(255, 210, 230, .6)"; cx.fill(); }
    cx.restore();
  } else if (t === "texto" || t === "boton") {
    const tx = t === "texto" ? e.texto || {} : e.boton || {};
    const texto = t === "texto" ? letras(tx.html) : String(tx.texto || "Botón");
    if (t === "boton") { caminoRedondo(cx, 0, 0, w, h, h / 2); cx.fillStyle = tx.fondo || "#e0457f"; cx.fill(); }
    if (texto) {
      const tam = (+tx.tam || 24) * k, il = (+tx.interlinea || 1.3) * tam, pad = (+c.relleno || 0) * k;
      cx.font = `${tx.cursiva ? "italic " : ""}${tx.peso || 400} ${tam}px ${R?.pilaFuente ? R.pilaFuente(tx.fuente) : "sans-serif"}`;
      if ("letterSpacing" in cx && tx.interletra) cx.letterSpacing = tx.interletra * k + "px";
      cx.fillStyle = t === "boton" ? tx.color || "#fff" : tx.color || "#3a2335";
      cx.textBaseline = "alphabetic";
      const alin = t === "boton" ? "center" : tx.alin === "izquierda" || tx.alin === "left" ? "left" : tx.alin === "derecha" || tx.alin === "right" ? "right" : tx.alin === "justify" || tx.alin === "justificar" ? "left" : tx.alin || "center";
      cx.textAlign = alin === "izq" ? "left" : alin === "der" ? "right" : alin;
      const lineas = renglones(cx, tx.mayus ? texto.toUpperCase() : texto, Math.max(10, w - pad * 2));
      const alto = lineas.length * il;
      const v = t === "boton" ? "centro" : tx.valin;
      let y0 = v === "centro" ? (h - alto) / 2 : v === "abajo" ? h - alto - pad : pad;
      const xx = cx.textAlign === "left" ? pad : cx.textAlign === "right" ? w - pad : w / 2;
      const s = tx.sombra;
      if (s && s.color) { cx.shadowColor = s.color; cx.shadowBlur = (+s.blur || 12) * k; cx.shadowOffsetX = (+s.x || 0) * k; cx.shadowOffsetY = (+s.y || 4) * k; }
      for (const l of lineas) { y0 += il; if (y0 - il > h + il) break; cx.fillText(l, xx, y0 - (il - tam) / 2 - tam * 0.12); }
    }
  } else if (t === "forma") {
    const f = e.forma || {}, fig = f.figura || "rect";
    const relleno = f.gradiente ? degradado(f.gradiente, cx, 0, 0, w, h) : f.relleno || "transparent";
    if (fig === "rect" || fig === "circulo") {
      cx.beginPath();
      if (fig === "circulo") cx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      else caminoRedondo(cx, 0, 0, w, h, radio);
      cx.fillStyle = relleno; cx.fill();
      if (f.grosor > 0) { cx.lineWidth = f.grosor * k; cx.strokeStyle = f.trazo || "#000"; cx.stroke(); }
    } else if (fig === "linea") {
      cx.fillStyle = f.gradiente ? relleno : f.relleno || f.trazo || "#000";
      const g = Math.max(1, (+f.grosor || 3) * k);
      caminoRedondo(cx, 0, (h - g) / 2, w, g, f.redondo ? g / 2 : 0); cx.fill();
    } else {
      const d = R?.FIGURAS?.[fig] || R?.FIGURAS?.corazon;
      if (d && typeof Path2D !== "undefined") {
        cx.save(); cx.scale(w / 100, h / 100);
        const p = new Path2D(d);
        cx.fillStyle = f.gradiente ? degradado(f.gradiente, cx, 0, 0, 100, 100) : relleno; cx.fill(p);
        cx.restore();
      }
    }
  } else if (t === "dibujo" || t === "trazo") {
    const img = imgs.get(e.id);
    if (img) cx.drawImage(img, 0, 0, w, h);
  } else if (t !== "musica") {
    // Lo que no se dibuja quieto (HTML, video, 3D…): una manchita suave, para que se sienta que ahí hay algo.
    caminoRedondo(cx, 0, 0, w, h, Math.min(w, h) * 0.12);
    cx.fillStyle = "rgba(255, 255, 255, .28)"; cx.fill();
  }
  cx.restore();
}

/** Un dibujo o un trazo como imagen SVG (para ponerlo en el lienzo). */
function svgDe(e) {
  const R = RT();
  if (e.tipo === "dibujo") {
    const d = e.dibujo || {};
    let svg = R?.sanearSvg ? R.sanearSvg(d.svg || "") : "";
    if (!svg) return null;
    if (d.color) svg = svg.replace(/currentColor/g, d.color);
    if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const t = e.trazo || {};
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${+t.vw || 100} ${+t.vh || 100}" preserveAspectRatio="none" width="${Math.max(1, e.w)}" height="${Math.max(1, e.h)}">`
    + `<path d="${String(t.d || "").replace(/[^MLQCZmlqcz0-9.,\s-]/g, "")}" fill="none" stroke="${String(t.color || "#e0457f").replace(/[^#a-zA-Z0-9(),.\s%]/g, "")}" stroke-width="${+t.grosor || 4}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/** La portadita de `pagina` (por defecto, la que está abierta). Ancho en píxeles. */
export async function dibujarPortadita(app, pagina = app.estado?.pagina, ancho = 360) {
  if (!pagina) return null;
  const P = app.estado.proyecto, m = app.lienzo?.m, a = P?.ajustes || {};
  const W = m?.auto ? m.W : a.ancho || 390, H = m?.auto ? m.H : a.alto || 844;
  const k = ancho / W, alto = Math.round(Math.min(H * k, ancho * 2.2));
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho; lienzo.height = alto;
  const cx = lienzo.getContext("2d");
  // Las fotos que hacen falta, todas a la vez.
  const els = (pagina.els || []).filter((e) => !e.oculto && e.w > 0 && e.h > 0);
  const imgs = new Map();
  const url = (id) => (id ? app.bib?.url?.(id) : null);
  const f = pagina.fondo || {};
  const pedidos = [cargar(url(f.imagen?.asset)).then((im) => imgs.set("__fondo", im))];
  for (const e of els) {
    if (e.tipo === "dibujo" || e.tipo === "trazo") pedidos.push(cargar(svgDe(e)).then((im) => imgs.set(e.id, im)));
    const id = e.imagen?.asset || e[e.tipo]?.fotos?.[0]?.asset || e[e.tipo]?.items?.[0]?.asset;
    if (id && !imgs.has(id)) { imgs.set(id, null); pedidos.push(cargar(url(id)).then((im) => imgs.set(id, im))); }
  }
  await Promise.race([Promise.all(pedidos), new Promise((r) => setTimeout(r, 4000))]);
  try { await document.fonts?.ready; } catch (e) { /* sigue */ }
  const pintar = async (conFotos) => {
    cx.clearRect(0, 0, ancho, alto);
    cx.fillStyle = f.color || "#fff";
    cx.fillRect(0, 0, ancho, alto);
    if (f.tipo === "gradiente" && f.gradiente) { cx.fillStyle = degradado(f.gradiente, cx, 0, 0, ancho, alto); cx.fillRect(0, 0, ancho, alto); }
    const fi = conFotos && imgs.get("__fondo");
    if (fi) { cx.save(); cx.globalAlpha = f.imagen.opacidad ?? 1; foto(cx, fi, 0, 0, ancho, alto, { ajuste: f.imagen.ajuste === "contain" ? "contain" : "cover" }); cx.restore(); }
    const mapa = conFotos ? imgs : new Map([...imgs].filter(([key]) => els.some((e) => e.id === key)));
    for (const e of els) await elemento(cx, e, app, k, mapa);
  };
  const aBlob = () => new Promise((ok, mal) => {
    try {
      lienzo.toBlob((b) => {
        if (b && /webp/.test(b.type)) return ok(b);
        lienzo.toBlob((j) => ok(j), "image/jpeg", 0.84);
      }, "image/webp", 0.82);
    } catch (e) { mal(e); }
  });
  await pintar(true);
  try { return await aBlob(); }
  catch (e) {
    // Alguna foto de otro sitio no dejó copiarse: sin esas, pero con todo lo demás.
    await pintar(false);
    try { return await aBlob(); } catch (e2) { return null; }
  }
}
