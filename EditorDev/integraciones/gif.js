/**
 * GIF ANIMADOS: QUITAR EL FONDO SIN PERDER LA ANIMACIÓN
 *
 *   1. se sacan TODOS los cuadros (con el decodificador del navegador si lo
 *      tiene —ImageDecoder— o con el lector de GIF de aquí abajo);
 *   2. a cada cuadro se le quita el fondo con el método elegido:
 *        local     el color (o colores) del borde se borra «inundando» desde
 *                  las orillas, con tolerancia y borde suave (ideal para
 *                  fondos lisos; los stickers de GIPHY ya vienen sin fondo)
 *        externo   un servicio que recibe cada cuadro (PNG) y devuelve el
 *                  cuadro sin fondo: se conecta con registrarMetodo() o con
 *                  la dirección guardada en «editordev:quitar-fondo-url»
 *   3. se vuelven a juntar en un PNG ANIMADO (APNG): transparencia de verdad
 *      (con bordes suaves, que un GIF no tiene) y se ve en todos los navegadores.
 * Todo pasa en este aparato, por partes, sin trabar la pantalla.
 */

/* ── Leer un GIF (cuando el navegador no trae ImageDecoder) ───────── */
function lzw(minimo, datos, n) {
  const salida = new Uint8Array(n);
  const limpiar = 1 << minimo, fin = limpiar + 1;
  const pref = new Int32Array(4096), suf = new Uint8Array(4096), pila = new Uint8Array(4097);
  for (let i = 0; i < limpiar; i++) suf[i] = i;
  let tam = minimo + 1, mascara = (1 << tam) - 1, libre = fin + 1, viejo = -1, primero = 0;
  let dato = 0, bits = 0, i = 0, o = 0, sp = 0;
  while (o < n) {
    if (sp === 0) {
      while (bits < tam) { if (i >= datos.length) return salida; dato |= datos[i++] << bits; bits += 8; }
      let c = dato & mascara;
      dato >>>= tam; bits -= tam;
      if (c === limpiar) { tam = minimo + 1; mascara = (1 << tam) - 1; libre = fin + 1; viejo = -1; continue; }
      if (c === fin || c > libre) break;
      if (viejo === -1) { pila[sp++] = suf[c]; viejo = c; primero = c; continue; }
      const entra = c;
      if (c === libre) { pila[sp++] = primero; c = viejo; }
      while (c > limpiar) { pila[sp++] = suf[c]; c = pref[c]; }
      primero = suf[c];
      pila[sp++] = primero;
      if (libre < 4096) {
        pref[libre] = viejo; suf[libre] = primero; libre++;
        if ((libre & mascara) === 0 && libre < 4096) { tam++; mascara += libre; }
      }
      viejo = entra;
    }
    salida[o++] = pila[--sp];
  }
  return salida;
}

export function leerGif(buf) {
  const d = new Uint8Array(buf);
  if (!/^GIF8[79]a$/.test(String.fromCharCode(...d.subarray(0, 6)))) throw new Error("No es un GIF");
  let p = 6;
  const u8 = () => d[p++];
  const u16 = () => { const v = d[p] | (d[p + 1] << 8); p += 2; return v; };
  const W = u16(), H = u16(), f = u8();
  p += 2;
  let global = null;
  if (f & 0x80) { const n = 2 << (f & 7); global = d.subarray(p, p + n * 3); p += n * 3; }
  const lienzo = new Uint8ClampedArray(W * H * 4);
  const cuadros = [];
  let gce = { ms: 100, trans: -1, disp: 0 };
  while (p < d.length) {
    const b = u8();
    if (b === 0x3b) break;
    if (b === 0x21) {
      const tipo = u8();
      if (tipo === 0xf9) {
        const largo = u8();
        const pk = u8(), retraso = u16(), ti = u8();
        p += Math.max(0, largo - 4);
        let l; while ((l = u8())) p += l;
        gce = { disp: (pk >> 2) & 7, trans: pk & 1 ? ti : -1, ms: retraso ? Math.max(20, retraso * 10) : 100 };
      } else { let l; while ((l = u8())) p += l; }
      continue;
    }
    if (b !== 0x2c) break;
    const x = u16(), y = u16(), w = u16(), h = u16(), pk = u8();
    let tabla = global;
    if (pk & 0x80) { const n = 2 << (pk & 7); tabla = d.subarray(p, p + n * 3); p += n * 3; }
    const entrelazado = !!(pk & 0x40);
    const minimo = u8();
    const partes = [];
    let total = 0, l;
    while ((l = u8())) { partes.push(d.subarray(p, p + l)); total += l; p += l; }
    const datos = new Uint8Array(total);
    let o = 0;
    for (const q of partes) { datos.set(q, o); o += q.length; }
    const idx = lzw(minimo, datos, w * h);
    const filas = [];
    if (entrelazado) for (const [ini, paso] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let r = ini; r < h; r += paso) filas.push(r);
    const previo = gce.disp === 3 ? lienzo.slice() : null;
    if (tabla) {
      for (let i = 0; i < w * h; i++) {
        const c = idx[i];
        if (c === gce.trans) continue;
        const fila = (i / w) | 0;
        const X = x + (i - fila * w), Y = y + (entrelazado ? filas[fila] : fila);
        if (X >= W || Y >= H) continue;
        const k = (Y * W + X) * 4;
        lienzo[k] = tabla[c * 3]; lienzo[k + 1] = tabla[c * 3 + 1]; lienzo[k + 2] = tabla[c * 3 + 2]; lienzo[k + 3] = 255;
      }
    }
    cuadros.push({ datos: new ImageData(lienzo.slice(), W, H), ms: gce.ms });
    if (gce.disp === 2) {
      for (let yy = y; yy < Math.min(H, y + h); yy++) lienzo.fill(0, (yy * W + x) * 4, (yy * W + Math.min(W, x + w)) * 4);
    } else if (previo) lienzo.set(previo);
    gce = { ms: 100, trans: -1, disp: 0 };
  }
  if (!cuadros.length) throw new Error("El GIF no tiene cuadros");
  return { w: W, h: H, cuadros };
}

const pausa = () => new Promise((r) => setTimeout(r, 0));

/** Todos los cuadros de un GIF o WebP animado, ya compuestos y (si hace falta) achicados. */
export async function cuadros(blob, { maxLado = 360, maxCuadros = 120 } = {}) {
  let res = null;
  const buf = await blob.arrayBuffer();
  if (window.ImageDecoder && (await ImageDecoder.isTypeSupported(blob.type || "image/gif").catch(() => false))) {
    try {
      const dec = new ImageDecoder({ data: buf, type: blob.type || "image/gif" });
      await dec.tracks.ready;
      const n = dec.tracks.selectedTrack.frameCount;
      const lista = [];
      let W = 0, H = 0, c = null, g = null;
      for (let i = 0; i < n; i++) {
        const r = await dec.decode({ frameIndex: i });
        const im = r.image;
        if (!c) { W = im.displayWidth; H = im.displayHeight; c = new OffscreenCanvas(W, H); g = c.getContext("2d", { willReadFrequently: true }); }
        g.clearRect(0, 0, W, H);
        g.drawImage(im, 0, 0, W, H);
        lista.push({ datos: g.getImageData(0, 0, W, H), ms: Math.max(20, Math.round((im.duration || 100000) / 1000)) });
        im.close();
        if (i % 6 === 5) await pausa();
      }
      dec.close();
      res = { w: W, h: H, cuadros: lista };
    } catch (e) { res = null; }
  }
  if (!res) res = leerGif(buf);
  // Demasiados cuadros: se salta alguno (y se suman los tiempos).
  if (res.cuadros.length > maxCuadros) {
    const k = Math.ceil(res.cuadros.length / maxCuadros);
    const pocos = [];
    for (let i = 0; i < res.cuadros.length; i += k) pocos.push({ datos: res.cuadros[i].datos, ms: res.cuadros.slice(i, i + k).reduce((s, x) => s + x.ms, 0) });
    res.cuadros = pocos;
  }
  // Muy grande: se achica (más rápido y pesa menos).
  const esc = Math.min(1, maxLado / Math.max(res.w, res.h));
  if (esc < 1) {
    const w = Math.max(1, Math.round(res.w * esc)), h = Math.max(1, Math.round(res.h * esc));
    const a = new OffscreenCanvas(res.w, res.h), ga = a.getContext("2d", { willReadFrequently: true });
    const b = new OffscreenCanvas(w, h), gb = b.getContext("2d", { willReadFrequently: true });
    gb.imageSmoothingQuality = "high";
    for (const q of res.cuadros) { ga.putImageData(q.datos, 0, 0); gb.clearRect(0, 0, w, h); gb.drawImage(a, 0, 0, w, h); q.datos = gb.getImageData(0, 0, w, h); }
    res.w = w; res.h = h;
  }
  return res;
}

/* ── Quitar el fondo de un cuadro ────────────────────────────────── */
/** Los colores del fondo: los que más se repiten en las orillas. */
export function coloresDeFondo(img) {
  const { width: w, height: h, data: d } = img;
  const cuenta = new Map();
  let total = 0;
  const ver = (x, y) => {
    const k = (y * w + x) * 4;
    if (d[k + 3] < 16) return;
    const c = ((d[k] >> 4) << 8) | ((d[k + 1] >> 4) << 4) | (d[k + 2] >> 4);
    const v = cuenta.get(c) || { n: 0, r: 0, g: 0, b: 0 };
    v.n++; v.r += d[k]; v.g += d[k + 1]; v.b += d[k + 2];
    cuenta.set(c, v);
    total++;
  };
  for (let x = 0; x < w; x++) { ver(x, 0); ver(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { ver(0, y); ver(w - 1, y); }
  return [...cuenta.values()].sort((a, b) => b.n - a.n).filter((v, i) => i === 0 || v.n > total * 0.08).slice(0, 3).map((v) => [v.r / v.n, v.g / v.n, v.b / v.n]);
}

/** Método local: se «inunda» desde las orillas todo lo que se parece al fondo. */
export function quitarFondoLocal(img, { colores, tolerancia = 40, suave = true } = {}) {
  const { width: w, height: h, data: d } = img;
  colores = colores || coloresDeFondo(img);
  const out = new Uint8ClampedArray(d);
  const fondo = new Uint8Array(w * h);
  const t2 = tolerancia * tolerancia * 3;
  const parece = (i) => {
    const k = i * 4;
    if (d[k + 3] < 16) return true;
    for (const c of colores) { const r = d[k] - c[0], g = d[k + 1] - c[1], b = d[k + 2] - c[2]; if (r * r + g * g + b * b <= t2) return true; }
    return false;
  };
  const pila = new Int32Array(w * h);
  let sp = 0;
  const empujar = (i) => { if (!fondo[i] && parece(i)) { fondo[i] = 1; pila[sp++] = i; } };
  for (let x = 0; x < w; x++) { empujar(x); empujar((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { empujar(y * w); empujar(y * w + w - 1); }
  while (sp) {
    const i = pila[--sp];
    const x = i % w;
    if (x > 0) empujar(i - 1);
    if (x < w - 1) empujar(i + 1);
    if (i >= w) empujar(i - w);
    if (i < w * (h - 1)) empujar(i + w);
  }
  for (let i = 0; i < w * h; i++) if (fondo[i]) out[i * 4 + 3] = 0;
  if (suave) {
    // Borde suave: lo que toca el fondo se vuelve un poquito transparente.
    for (let i = 0; i < w * h; i++) {
      if (fondo[i]) continue;
      const x = i % w;
      const n = (x > 0 && fondo[i - 1]) + (x < w - 1 && fondo[i + 1]) + (i >= w && fondo[i - w]) + (i < w * (h - 1) && fondo[i + w]);
      if (n) out[i * 4 + 3] = Math.round(out[i * 4 + 3] * (1 - n * 0.2));
    }
  }
  return new ImageData(out, w, h);
}

/* Un servicio externo: recibe un PNG y devuelve el PNG sin fondo. */
async function quitarFondoExterno(img, { url }) {
  const c = new OffscreenCanvas(img.width, img.height);
  c.getContext("2d").putImageData(img, 0, 0);
  const png = await c.convertToBlob({ type: "image/png" });
  const r = await fetch(url, { method: "POST", body: png, headers: { "Content-Type": "image/png" } });
  if (!r.ok) throw new Error("El servicio para quitar fondos respondió " + r.status);
  const bmp = await createImageBitmap(await r.blob());
  const g = c.getContext("2d", { willReadFrequently: true });
  g.clearRect(0, 0, c.width, c.height);
  g.drawImage(bmp, 0, 0, c.width, c.height);
  return g.getImageData(0, 0, c.width, c.height);
}

export const METODOS = { local: quitarFondoLocal, externo: quitarFondoExterno };
/** Conectar otro método (un servicio de IA, por ejemplo): fn(ImageData, opciones) → ImageData. */
export function registrarMetodo(nombre, fn) { METODOS[nombre] = fn; }

/* ── Volver a juntar los cuadros: PNG animado (APNG) ─────────────── */
const TABLA = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABLA[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function trozo(tipo, datos) {
  const b = new Uint8Array(12 + datos.length);
  const v = new DataView(b.buffer);
  v.setUint32(0, datos.length);
  for (let i = 0; i < 4; i++) b[4 + i] = tipo.charCodeAt(i);
  b.set(datos, 8);
  v.setUint32(8 + datos.length, crc(b.subarray(4, 8 + datos.length)));
  return b;
}
async function comprimir(u8) {
  if (!window.CompressionStream) throw new Error("Este navegador no sabe armar el PNG animado (actualízalo).");
  const cs = new CompressionStream("deflate"); // «deflate» = zlib, lo que pide el PNG
  const w = cs.writable.getWriter();
  w.write(u8); w.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}
/* Filtro «Sub» en cada fila: comprime bien las fotos y los dibujos animados. */
function filtrar(rgba, w, h) {
  const fila = w * 4, out = new Uint8Array((fila + 1) * h);
  for (let y = 0; y < h; y++) {
    const o = y * (fila + 1), s = y * fila;
    out[o] = 1;
    for (let x = 0; x < fila; x++) out[o + 1 + x] = (rgba[s + x] - (x >= 4 ? rgba[s + x - 4] : 0)) & 255;
  }
  return out;
}

/** La zona que cambió entre dos cuadros (o null si son iguales). */
function zonaCambio(a, b, w, h) {
  const A = new Uint32Array(a.buffer, a.byteOffset, w * h), B = new Uint32Array(b.buffer, b.byteOffset, w * h);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const f = y * w;
    for (let x = 0; x < w; x++) if (A[f + x] !== B[f + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function recorte(rgba, w, z) {
  const out = new Uint8ClampedArray(z.w * z.h * 4);
  for (let y = 0; y < z.h; y++) out.set(rgba.subarray(((z.y + y) * w + z.x) * 4, ((z.y + y) * w + z.x + z.w) * 4), y * z.w * 4);
  return out;
}

/**
 * PNG animado. Cada cuadro guarda sólo la zona que cambió respecto del
 * anterior (se pinta encima, reemplazando) y los cuadros repetidos se juntan
 * en uno más largo: pesa mucho menos y se ve exactamente igual.
 */
export async function aAPNG(lista, w, h, alProgreso) {
  // Juntar los cuadros iguales (sumando su tiempo) y calcular la zona de cada uno.
  const cs = [];
  for (const f of lista) {
    const d = f.datos.data;
    const prev = cs[cs.length - 1];
    if (prev) {
      const z = zonaCambio(prev.d, d, w, h);
      if (!z) { prev.ms += f.ms; continue; }
      cs.push({ d, ms: f.ms, z });
    } else cs.push({ d, ms: f.ms, z: { x: 0, y: 0, w, h } });
  }
  const partes = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])];
  const ihdr = new Uint8Array(13);
  const vi = new DataView(ihdr.buffer);
  vi.setUint32(0, w); vi.setUint32(4, h); ihdr[8] = 8; ihdr[9] = 6;
  partes.push(trozo("IHDR", ihdr));
  const actl = new Uint8Array(8);
  new DataView(actl.buffer).setUint32(0, cs.length);
  partes.push(trozo("acTL", actl));
  let seq = 0;
  for (let i = 0; i < cs.length; i++) {
    const { d, ms, z } = cs[i];
    const fc = new Uint8Array(26);
    const v = new DataView(fc.buffer);
    v.setUint32(0, seq++); v.setUint32(4, z.w); v.setUint32(8, z.h); v.setUint32(12, z.x); v.setUint32(16, z.y);
    v.setUint16(20, Math.min(65535, Math.max(10, Math.round(ms)))); v.setUint16(22, 1000);
    fc[24] = 0; fc[25] = 0; // queda como está · la zona reemplaza lo de debajo
    partes.push(trozo("fcTL", fc));
    const px = i === 0 ? d : recorte(d, w, z);
    const comp = await comprimir(filtrar(px, z.w, z.h));
    if (i === 0) partes.push(trozo("IDAT", comp));
    else { const fd = new Uint8Array(4 + comp.length); new DataView(fd.buffer).setUint32(0, seq++); fd.set(comp, 4); partes.push(trozo("fdAT", fd)); }
    alProgreso?.((i + 1) / cs.length);
  }
  partes.push(trozo("IEND", new Uint8Array(0)));
  return new Blob(partes, { type: "image/png" });
}

/* ── Todo junto ──────────────────────────────────────────────────── */
function metodoGuardado() { try { return localStorage.getItem("editordev:quitar-fondo-url") || ""; } catch (e) { return ""; } }

/**
 * Quita el fondo de un GIF/WebP animado y devuelve { blob (PNG animado), w, h, cuadros }.
 * op: { tolerancia, suave, metodo ("local" | "externo" | uno registrado), alProgreso(0…1) }
 */
export async function quitarFondoAnimado(blob, op = {}) {
  const { w, h, cuadros: cs } = await cuadros(blob, op);
  const metodo = op.metodo || "local";
  const fn = METODOS[metodo] || METODOS.local;
  const colores = coloresDeFondo(cs[0].datos);
  const opciones = { colores, tolerancia: op.tolerancia ?? 40, suave: op.suave !== false, url: op.url || metodoGuardado() };
  const listos = [];
  for (let i = 0; i < cs.length; i++) {
    listos.push({ datos: await fn(cs[i].datos, opciones), ms: cs[i].ms });
    op.alProgreso?.(((i + 1) / cs.length) * 0.75);
    if (i % 3 === 2) await pausa();
  }
  const png = await aAPNG(listos, w, h, (k) => op.alProgreso?.(0.75 + k * 0.25));
  return { blob: png, w, h, cuadros: listos.length };
}

/** Vista rápida: sólo el primer cuadro sin fondo (para mover la tolerancia en vivo). */
export async function primerCuadroSinFondo(blob, tolerancia = 40, cache = {}) {
  if (!cache.cs) cache.cs = await cuadros(blob, { maxLado: 320, maxCuadros: 1 });
  const img = quitarFondoLocal(cache.cs.cuadros[0].datos, { tolerancia });
  const c = new OffscreenCanvas(img.width, img.height);
  c.getContext("2d").putImageData(img, 0, 0);
  return URL.createObjectURL(await c.convertToBlob({ type: "image/png" }));
}
