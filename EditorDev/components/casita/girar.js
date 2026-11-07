/**
 * GIRAR LAS COSAS (Fase 64, rehecho en la Fase 65): cada mueble se gira libremente y se ve desde ese ángulo,
 * sin perder sus animaciones.
 *
 *   · El cuerpo (lo que no se mueve) se pasa a pixel (4 del mundo = 1 pixel) y se vuelve un volumen de vóxeles: la
 *     silueta de frente CRUZADA con la de lado (casco visual), así una mesa de lado muestra sus patas, una
 *     lámpara sigue siendo lámpara y un sillón tiene respaldo atrás y asiento adelante (no un bloque).
 *   · Las partes animadas (las que tienen clase en el dibujo: focos, flamas, peces, ojitos, pantallas…) NO se
 *     hornean: se quedan vivas en una capa encima, puesta con la misma transformación del frente girado (una
 *     matriz afín), así siguen moviéndose, prendiéndose y apagándose, alineadas con su lugar.
 *   · Lo que se mueve casi entero (un columpio, una hamaca) no se gira: se queda de frente (`plano`).
 *   · Se hace una vez por cosa, dibujo y ángulo y se guarda.
 *
 * (Fase 71) Ya no se gira libre: cada cosa tiene CUATRO vistas —de frente, de su lado derecho, de espaldas y de su
 * lado izquierdo— (de 90 en 90 grados). Así no salen esas vistas chuecas de en medio que parecían un bloque grueso, y
 * el teléfono hace mucho menos trabajo. Los muebles principales traen su costado y su espalda dibujados a mano
 * (`vistas` en catalogo/vistas.js): la forma de lado (con sus patas, su respaldo, su brazo enrollado…) y sus colores,
 * con la misma paleta de su frente.
 */
import { PAL, rampa } from "./catalogo/pixel.js";

const PX = 4, ELEV = 0.36, CACHE = new Map(), PEND = new Map(), PODADO = new Map();
/**
 * (Fase 75) SIN PARPADEOS: las vistas de frente ya hechas (pixel plano o con volumen) se guardan en el teléfono
 * (IndexedDB). La siguiente vez que abres el juego (y las miniaturas de «Acomodar») salen al instante, sin pasar por el
 * dibujo liso ni aparecer de a poquito. Si cambia la forma de dibujar, cambia VER_VISTAS y se hacen de nuevo.
 */
const VER_VISTAS = "75b", BD_VISTAS = "casita-vistas";
let BD = null;
const abrirBD = () => new Promise((ok) => {
  try {
    const q = indexedDB.open(BD_VISTAS, 1);
    q.onupgradeneeded = () => { try { q.result.createObjectStore("v"); } catch (e) { /* ya existe */ } };
    q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); q.onblocked = () => ok(null);
  } catch (e) { ok(null); }
});
export const vistasListas = (async () => {
  try {
    BD = await Promise.race([abrirBD(), new Promise((ok) => setTimeout(() => ok(null), 1500))]);
    if (!BD) return;
    const st = BD.transaction("v", "readonly").objectStore("v");
    const [ks, vs] = await Promise.all([new Promise((ok) => { const q = st.getAllKeys(); q.onsuccess = () => ok(q.result || []); q.onerror = () => ok([]); }), new Promise((ok) => { const q = st.getAll(); q.onsuccess = () => ok(q.result || []); q.onerror = () => ok([]); })]);
    const viejas = [];
    ks.forEach((k, i) => { const [ver, ...resto] = String(k).split("§"); if (ver === VER_VISTAS) { if (!CACHE.has(resto.join("§"))) CACHE.set(resto.join("§"), vs[i]); } else viejas.push(k); });
    if (viejas.length) { const tx = BD.transaction("v", "readwrite"); for (const k of viejas) tx.objectStore("v").delete(k); }
  } catch (e) { /* sin memoria: se hacen como siempre */ }
})();
const POR_GUARDAR = new Map();
let tGuardar = 0;
/** Guarda (en ratitos, juntando varias) una vista de frente: sólo lo que hace falta para pintarla. */
function recordar(clave, v) {
  if (!v || !BD) return;
  POR_GUARDAR.set(clave, v.plano ? { plano: true } : { url: v.url, w: v.w, h: v.h, fx: v.fx, fy: v.fy, ax: v.ax, ay: v.ay, frente: true });
  clearTimeout(tGuardar);
  tGuardar = setTimeout(() => {
    try { const tx = BD.transaction("v", "readwrite"), st = tx.objectStore("v"); for (const [k, x] of POR_GUARDAR) st.put(x, VER_VISTAS + "§" + k); POR_GUARDAR.clear(); } catch (e) { /* nada */ }
  }, 1200);
}
export const ELEV_GIRO = ELEV;
export const pasoGiro = 90;
/** Cómo se llama cada una de las cuatro vistas. */
export const NOMBRE_VISTA = { 0: "De frente", 90: "Lado izquierdo", 180: "De espaldas", 270: "Lado derecho" };
/** (Fase 72) Lo plano o delgadito (una hamaca, la bici, un cuadro, una cerca…) de lado sería un palito sin sentido:
 *  esas cosas sólo se ven de frente o de espaldas (al revés). Lo que trae su costado dibujado a mano, sí de lado. */
export const soloFrenteAtras = (d) => !d.vistas && (d.forma === "plano" || (d.forma == null && PLANOS.test(d.k)) || hondura(d) / Math.max(1, d.w) < 0.25);
/** El ángulo guardado de una cosa (0, 90, 180 o 270; lo de antes, girado libre, va a la vista más cercana). */
export function giroDe(o) { const g = Math.round((+o?.e?.giro || 0) / pasoGiro) * pasoGiro; return ((g % 360) + 360) % 360; }
/** La hondura de un mueble (en el mundo): lo que de verdad mide para atrás, sin ensancharlo. */
export const hondura = (d) => Math.max(10, Math.min(150, d.hondo ?? Math.min(d.w * 0.5, d.h * 0.45 + 20)));
/** Lo que ocupa en el piso (medio ancho y hondura, en las unidades del piso) ya girado. */
export function huellaGirada(d, g, medio, fondo) {
  const a = (g * Math.PI) / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)), hx = (hondura(d) / 2) * Math.min(1, (medio * 2) / d.w + 0.2);
  return { medio: medio * c + hx * s, fondo: fondo * c + ((medio * 2) * s) * (fondo / Math.max(1, hondura(d))) };
}
/** El monito sentado en una cosa girada: dónde queda su asiento, hacia dónde mira y por dónde llega. */
export function lugarGirado(l, g, sx) {
  const dx0 = l.dx * sx;
  if (!g) return { dx: dx0, dy: l.dy, cara: "frente", mira: l.mira ? l.mira * sx : 0, llega: [0, 24] };
  const a = (g * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a), dx = dx0 * co, dz = dx0 * si;
  let cara = g > 45 && g < 135 ? "der" : g >= 135 && g <= 225 ? "atras" : g > 225 && g < 315 ? "izq" : "frente";
  if (sx < 0 && (cara === "der" || cara === "izq")) cara = cara === "der" ? "izq" : "der";   // (volteado, mira al otro lado)
  // Hacia dónde mira el asiento (en el piso): de frente = hacia ti; girado, hacia su lado. Por ahí llega el monito.
  const llega = [si * 52 * sx, co * 26];
  return { dx, dy: l.dy - dz * ELEV, cara, mira: cara === "der" ? 1 : cara === "izq" ? -1 : l.mira ? l.mira * sx : 0, llega };
}
const svgConMedida = (s, w, h) => s.replace(/^<svg\b/, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`);
const mezcla = (c, k) => k < 1 ? [c[0] * k, c[1] * k, c[2] * k] : [c[0] + (255 - c[0]) * (k - 1), c[1] + (255 - c[1]) * (k - 1), c[2] + (255 - c[2]) * (k - 1)];
const huella = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

/** (Fase 65) Qué tan hondo es cada franja de algunos muebles: [desde y, hasta y (en el dibujo), de z, a z (0 = el
 *  frente, 1 = atrás)]. Lo que no sale aquí usa su silueta. */
const PERFILES = {
  tele: [[0, 112, 0.46, 0.64]],
  consola: [[0, 84, 0.42, 0.66]],
  tocador: [[0, 97, 0.7, 0.86]],
  inodoro: [[0, 52, 0.6, 1]],
  lavabo: [[0, 40, 0.66, 0.84], [72, 128, 0.32, 0.68]],
  fregadero: [[0, 37, 0.62, 0.8]],
  piano: [[0, 18, 0.56, 0.72]],
};
/** Separa el dibujo en lo quieto (sin clase) y lo vivo (con clase y lo que va dentro). */
export function separar(svg) {
  if (PODADO.has(svg)) return PODADO.get(svg);
  let r = { quieto: svg, vivo: "" };
  try {
    const doc = new DOMParser().parseFromString(svgConMedida(svg, 10, 10), "image/svg+xml"), raiz = doc.documentElement;
    if (raiz.nodeName === "svg") {
      const q = raiz.cloneNode(true), v = raiz.cloneNode(true);
      const podar = (n, dejarVivo) => {
        for (const h of [...n.children]) {
          const tiene = h.hasAttribute("class"), dentro = !tiene && !!h.querySelector("[class]");
          if (dejarVivo) { if (tiene) continue; if (dentro) podar(h, true); else if (!["defs", "filter", "linearGradient", "radialGradient", "clipPath", "mask", "pattern"].includes(h.nodeName)) h.remove(); }
          else { if (tiene) h.remove(); else if (dentro) podar(h, false); }
        }
      };
      podar(q, false); podar(v, true);
      const ser = new XMLSerializer(), limpiar = (n) => ser.serializeToString(n).replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, "").replace(/ width="10" height="10"/, "");
      r = { quieto: limpiar(q), vivo: v.querySelector("[class]") ? limpiar(v) : "" };
    }
  } catch (e) { /* nada: se hornea todo */ }
  PODADO.set(svg, r);
  if (PODADO.size > 300) PODADO.delete(PODADO.keys().next().value);
  return r;
}
export async function rasterizar(svg, W, H) {
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgConMedida(svg, W, H));
  await img.decode();
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  cx.drawImage(img, 0, 0, W, H);
  return cx.getImageData(0, 0, W, H).data;
}

/** (Fase 70) Lo que es casi plano (de frente y de lado se ve delgadito): al girarlo NO se vuelve bloque. */
const PLANOS = /bici|hamaca|luces|cerca|reja|letrero|cuadro|espejo|biombo|escalera|perchero|guirnalda|columpio|tendedero|marco|porteria|rehilete|caballete|atril|pizarr|telar|arco|rejilla|valla|tabla_surf|patineta|guitarra|ukulele|violin|raqueta/;
const PASOS_LUZ = [0.78, 0.86, 0.93, 1];
const escalon = (f) => PASOS_LUZ.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));

/**
 * (Fase 70) LA REJILLA DE CUADRITOS de una cosa: la MISMA para verla de frente y girada (así no cambia de estilo al
 * girarla). Lo quieto del dibujo a 1 del mundo por pixel, y cada cuadrito de 4 × 4 toma el color que más hay en él
 * (las rayitas oscuras ganan si ocupan buena parte). En lo dibujado con vectores, los colores casi iguales (degradados,
 * orillas suavizadas) se juntan en uno solo, como una paleta de pixel art, para que no se vea embarrado; luego lleva su
 * sombreado de pixel art. Lo que ya viene en pixel (`d.pixel`) se queda tal cual.
 */
const REJ = new Map(), REJ_P = new Map();
export async function rejilla(d, quieto) {
  const clave = `rej74|${d.k}|${huella(quieto)}`;
  if (REJ.has(clave)) return REJ.get(clave);
  if (REJ_P.has(clave)) return REJ_P.get(clave);
  const pr = (async () => {
    const W = Math.max(4, Math.round(d.w)), H = Math.max(4, Math.round(d.h)), cw = Math.ceil(W / PX), ch = Math.ceil(H / PX);
    const src = await rasterizar(quieto, W, H), out = new Uint8ClampedArray(cw * ch * 4);
    const lum = (c) => c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const cubetas = new Map();
      let n = 0;
      for (let y = j * PX; y < Math.min(H, j * PX + PX); y++) for (let x = i * PX; x < Math.min(W, i * PX + PX); x++) {
        const k = (y * W + x) * 4;
        if (src[k + 3] < 128) continue;
        n++;
        const key = ((src[k] >> 4) << 8) | ((src[k + 1] >> 4) << 4) | (src[k + 2] >> 4), c = cubetas.get(key);
        if (c) { c.n++; c.r += src[k]; c.g += src[k + 1]; c.b += src[k + 2]; } else cubetas.set(key, { n: 1, r: src[k], g: src[k + 1], b: src[k + 2] });
      }
      if (n < 7) continue;
      let mejor = null, oscuro = null;
      for (const c of cubetas.values()) { c.r /= c.n; c.g /= c.n; c.b /= c.n; if (!mejor || c.n > mejor.n) mejor = c; }
      for (const c of cubetas.values()) if (c !== mejor && c.n >= 5 && lum(c) < lum(mejor) * 0.55 && (!oscuro || c.n > oscuro.n)) oscuro = c;
      const c = oscuro || mejor, k = (j * cw + i) * 4;
      out[k] = c.r; out[k + 1] = c.g; out[k + 2] = c.b; out[k + 3] = 255;
    }
    if (!d.pixel) { paleta(out, cw * ch); sombrear(out, cw, ch); }
    const r = { cw, ch, out };
    REJ.set(clave, r);
    if (REJ.size > 260) REJ.delete(REJ.keys().next().value);
    return r;
  })();
  REJ_P.set(clave, pr);
  try { return await pr; } finally { REJ_P.delete(clave); }
}
/** (Fase 70) Junta los colores casi iguales en uno (el que más hay), como la paleta corta del pixel art. */
function paleta(out, n) {
  const cuenta = new Map();
  for (let q = 0; q < n; q++) { const k = q * 4; if (out[k + 3] !== 255) continue; const c = (out[k] << 16) | (out[k + 1] << 8) | out[k + 2]; cuenta.set(c, (cuenta.get(c) || 0) + 1); }
  const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]), pal = [], mapa = new Map();
  for (const [c] of orden) {
    const r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    let cerca = null, dm = 1e9;
    for (const p of pal) { const dd = Math.abs(p[0] - r) + Math.abs(p[1] - g) * 1.2 + Math.abs(p[2] - b); if (dd < dm) { dm = dd; cerca = p; } }
    if (cerca && dm < 30) mapa.set(c, cerca); else { const p = [r, g, b]; pal.push(p); mapa.set(c, p); }
  }
  for (let q = 0; q < n; q++) { const k = q * 4; if (out[k + 3] !== 255) continue; const p = mapa.get((out[k] << 16) | (out[k + 1] << 8) | out[k + 2]); out[k] = p[0]; out[k + 1] = p[1]; out[k + 2] = p[2]; }
}
/** El contorno pixel por fuera (del color de junto, mucho más oscuro), igual de frente y girado. */
function contornar(src, cw, ch, sinContorno) {
  const OW2 = cw + 2, OH2 = ch + 2, o2 = new Uint8ClampedArray(OW2 * OH2 * 4), en = (i, j) => i >= 0 && j >= 0 && i < cw && j < ch && src[(j * cw + i) * 4 + 3] === 255;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const a = (j * cw + i) * 4, b = ((j + 1) * OW2 + i + 1) * 4; for (let q = 0; q < 4; q++) o2[b + q] = src[a + q]; }
  if (!sinContorno) for (let j = -1; j <= ch; j++) for (let i = -1; i <= cw; i++) {
    if (en(i, j)) continue;
    const v = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].find(([a, b]) => en(a, b));
    if (!v) continue;
    const a = (v[1] * cw + v[0]) * 4, b = ((j + 1) * OW2 + i + 1) * 4;
    o2[b] = src[a] * 0.42; o2[b + 1] = src[a + 1] * 0.41; o2[b + 2] = src[a + 2] * 0.42 + 23; o2[b + 3] = 255;
  }
  return { o2, OW2, OH2 };
}

/** La vista girada: { url, w, h, ax, ay, vivo, matriz, frente } en el mundo (ax, ay = el centro de su base), o
 *  { plano: true } si casi todo se mueve (entonces no se gira), o null si no se pudo.
 *
 *  (Fase 70, rehecha) Antes cada cuadrito se «salpicaba» en dos puntos (quedaban rayas y huecos), los colores salían
 *  de una muestra borrosa del dibujo (girado se veía distinto que de frente) y todo lo que no era caja se volvía un
 *  bloque (la bici, la hamaca). Ahora:
 *   · los colores son los MISMOS cuadritos de frente (la rejilla de arriba, con su paleta y su sombreado);
 *   · cada cosa tiene su forma: caja, redonda (de torno), asiento (respaldo atrás, asiento, patitas), plana (la bici,
 *     un cuadro, la hamaca: delgadita) o sólida (lo demás: lo ancho es hondo, lo angosto —un poste, una pata— es
 *     delgado, y las patas de abajo quedan en sus esquinas, adelante y atrás);
 *   · se dibuja por rayos: cada pixel de la vista busca la primera cara que toca (sin huecos ni rayas) y sabe qué cara
 *     es: arriba lleva luz, lo que mira a la luz casi igual y lo que se aleja un escalón más oscuro (pocos tonos, como
 *     pixel art), con su línea entre caras y el mismo contorno que de frente. */
export function vistaGirada(d, e, C, g) {
  const arte = d.arte(e || {}, C), partes0 = separar(arte);
  // (Fase 70) Lo que tiene una parte de enfrente aparte (la tina, la cama: lo que tapa al monito) se gira completo:
  // girado, esa parte se esconde, así que va dentro del volumen (y el monito queda adentro con su hondura).
  let partes = partes0;
  if (d.frente) { const pf = separar(d.frente(e || {}, C)); partes = { ...partes0, quieto: partes0.quieto.replace(/<\/svg>\s*$/, pf.quieto.replace(/^<svg[^>]*>/, "")) }; }
  const clave = `${d.k}|${huella(partes.quieto)}|${g}|74`;
  if (CACHE.has(clave)) return Promise.resolve({ ...CACHE.get(clave), vivo: partes.vivo });
  if (PEND.has(clave)) return PEND.get(clave).then((r) => r && { ...r, vivo: partes.vivo });
  const pr = (async () => {
    try {
      const R = await rejilla(d, partes.quieto), W = R.cw, H = R.ch, src = R.out;
      const op = new Uint8Array(W * H);
      let nq = 0;
      for (let q = 0; q < W * H; q++) if (src[q * 4 + 3] === 255) { op[q] = 1; nq++; }
      const cel = (u, v) => { const k = (v * W + u) * 4; return [src[k], src[k + 1], src[k + 2]]; };
      // ¿Casi todo se mueve? Entonces no se gira (se vería roto).
      if (partes.vivo) {
        const todo = await rasterizar(arte, W, H);
        let nt = 0; for (let q = 0; q < W * H; q++) if (todo[q * 4 + 3] > 110) nt++;
        if (nt && nq / nt < 0.55) { const r = { plano: true }; CACHE.set(clave, r); return r; }
      }
      // (Fase 71) Lo dibujado a mano: su costado (forma y color), su perfil de en medio y su espalda.
      const V = d.vistas || null;
      // (Fase 74) La tapa dibujada a mano (las hornillas, la tarja, la madera de la cubierta…): una letra de la paleta por
      // cuadrito de arriba (u de izquierda a derecha, z de enfrente a atrás, v el renglón de esa tapa).
      const palT = d.tapa ? { ...PAL, ...(C ? rampa(C) : {}), ...(d.palTapa || {}) } : null, memoT = new Map();
      const colT = (ch) => { if (!ch) return null; if (memoT.has(ch)) return memoT.get(ch); const t = String(palT[ch] || ""), m = /^#?([0-9a-f]{6})$/i.exec(t), n = m ? parseInt(m[1], 16) : -1, c = n < 0 ? null : [n >> 16, (n >> 8) & 255, n & 255]; memoT.set(ch, c); return c; };
      const D = V?.D || Math.max(2, Math.round(hondura(d) / PX));
      let colV = null, ladoDe = null;
      if (V) {
        // Los colores del dibujo a mano se ajustan a la paleta de su frente (el mismo rosa, la misma madera).
        const pal = { ...PAL, ...(C ? rampa(C) : {}), ...(V.pal ? V.pal(C || "#ff9cbf") : {}) }, delFrente = new Map();
        for (let q = 0; q < W * H; q++) if (op[q]) delFrente.set((src[q * 4] << 16) | (src[q * 4 + 1] << 8) | src[q * 4 + 2], 1);
        const lista = [...delFrente.keys()].map((n) => [n >> 16, (n >> 8) & 255, n & 255]), memo = new Map();
        colV = (ch) => {
          if (!ch || ch === "=") return null;
          if (memo.has(ch)) return memo.get(ch);
          const t = String(pal[ch] || ""), m = /^#?([0-9a-f]{6})$/i.exec(t), r = /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(t), n = m ? parseInt(m[1], 16) : 0, c = r ? [+r[1], +r[2], +r[3]] : [n >> 16, (n >> 8) & 255, n & 255];
          let mejor = c, dm = 64;
          for (const p of lista) { const dd = Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) + Math.abs(p[2] - c[2]); if (dd < dm) { dm = dd; mejor = p; } }
          memo.set(ch, mejor);
          return mejor;
        };
        const br = V.brazos | 0;
        ladoDe = (u, v, z) => (V.centro && u >= br && u < W - br ? V.centro(v, z, u) : V.lado(v, z, u));
      }
      // Cada renglón: sus tramos (de dónde a dónde hay dibujo), sus orillas y su color de en medio.
      const tramos = [], a0 = new Int16Array(H).fill(-1), b0 = new Int16Array(H).fill(-1), izq = [], der = [], fila = [];
      let anchoMax = 1;
      for (let v = 0; v < H; v++) {
        const l = []; let ini = -1, s0 = 0, s1 = 0, s2 = 0, n = 0;
        for (let u = 0; u <= W; u++) {
          const hay = u < W && op[v * W + u];
          if (hay) { if (ini < 0) ini = u; const c = cel(u, v); s0 += c[0]; s1 += c[1]; s2 += c[2]; n++; }
          else if (ini >= 0) { l.push([ini, u - 1]); ini = -1; }
        }
        tramos[v] = l;
        if (l.length) {
          a0[v] = l[0][0]; b0[v] = l[l.length - 1][1]; fila[v] = [s0 / n, s1 / n, s2 / n]; anchoMax = Math.max(anchoMax, b0[v] - a0[v] + 1);
          // El costado lleva el color de junto a la orilla (no la rayita oscura de la orilla misma).
          const t0 = l[0], t1 = l[l.length - 1];
          izq[v] = cel(t0[1] - t0[0] >= 2 ? t0[0] + 1 : t0[0], v); der[v] = cel(t1[1] - t1[0] >= 2 ? t1[1] - 1 : t1[1], v);
        }
      }
      // (Un renglón suelto de otro color en la orilla —una rayita del dibujo— no hace raya en el costado.)
      for (const o of [izq, der]) for (let v = 1; v < H - 1; v++) {
        const a = o[v - 1], c = o[v], b2 = o[v + 1], dif = (x, y) => Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]);
        if (a && c && b2 && dif(a, b2) < 40 && dif(a, c) > 60) o[v] = a;
      }
      // (Y en franjas: mientras el color de la orilla se parezca al de la franja, sigue la franja —así el costado de un
      // sofá o de una tienda es parejo—; si cambia de veras —la cubierta blanca sobre el mueble—, empieza otra.)
      for (const o of [izq, der]) {
        let banda = null; for (let v = 0; v < H; v++) { const c = o[v]; if (!c) { banda = null; continue; } if (banda && Math.abs(banda[0] - c[0]) + Math.abs(banda[1] - c[1]) + Math.abs(banda[2] - c[2]) < 70) o[v] = banda; else banda = c; }
        // Una franja de hasta tres renglones (una costura, la orilla de un cojín) se une a la de junto: no hace raya.
        for (let v = 0; v < H;) {
          let w = v; while (w + 1 < H && o[w + 1] && o[v] && o[w + 1] === o[v]) w++;
          if (o[v] && w - v + 1 <= 3) {
            // (Fase 75) Se une a la de junto que sea del mismo mueble (mismo ancho; no lo que está puesto encima, como la
            // cafetera sobre la cubierta) y, si las dos lo son, a la que más se le parece.
            const ar = v > 0 && o[v - 1], ab = w + 1 < H && o[w + 1], ancho = (q) => Math.abs(a0[q] - a0[v]) + Math.abs(b0[q] - b0[v]) <= 2;
            const dd = (x) => Math.abs(x[0] - o[v][0]) + Math.abs(x[1] - o[v][1]) + Math.abs(x[2] - o[v][2]);
            let vecino = ar || ab;
            if (ar && ab) { const sa = ancho(v - 1), sb = ancho(w + 1); vecino = sa !== sb ? (sa ? ar : ab) : dd(ar) <= dd(ab) ? ar : ab; }
            if (vecino) for (let q = v; q <= w; q++) o[q] = vecino;
          }
          v = w + 1;
        }
      }
      // La espalda de un mueble es un tablero de un solo color (el que más hay en sus orillas), no rayas.
      const dorso = (() => {
        const cuenta = new Map();
        for (let v = 0; v < H; v++) for (const c of [izq[v], der[v]]) if (c) { const k = (c[0] << 16) | (c[1] << 8) | c[2]; cuenta.set(k, (cuenta.get(k) || 0) + 1); }
        let mk = 0, mn = -1; for (const [k, n] of cuenta) if (n > mn) { mn = n; mk = k; }
        return [mk >> 16, (mk >> 8) & 255, mk & 255];
      })();
      const caja = d.forma === "caja" || (d.forma == null && (d.caja ?? (/ropero|refri|librero|estufa|alacena|buro|tocador|baul|lavadora|repisa|fregadero|barra|caja|cajon|piano|arcade|lavabo|tina|inodoro|consola|tele|chimenea|closet|horno|micro|cuna|cama|vitrina|estante|organizador|mueble/.test(d.k) && !/mesa|escritorio/.test(d.k))));
      const torno = d.forma === "redondo" || (d.forma == null && !!d.torno);
      const asiento = d.forma === "asiento" || (d.forma == null && !caja && !torno && !!d.lugares?.some((l) => l.pose === "sentado"));
      const plano = d.forma === "plano" || (d.forma == null && !caja && !torno && !asiento && PLANOS.test(d.k));
      const grosor = Math.max(1, Math.round((d.grosor ?? 8) / PX));
      // Las patas: abajo, los renglones con huecos por dentro (dos o más tramos) son patas; van en las esquinas.
      let vPatas = H;
      for (let v = H - 1; v > H * 0.45; v--) { if (tramos[v].length >= 2 && b0[v] - a0[v] > W * 0.35) vPatas = v; else break; }
      const patita = Math.max(1, Math.min(3, Math.round(D * 0.16)));
      let vSeat = Math.round(H * 0.5);
      if (asiento) { let mx = -1; for (let v = Math.floor(H * 0.35); v < H * 0.85; v++) { const w = b0[v] - a0[v]; if (w > mx) { mx = w; vSeat = v; } } }
      const perfil = PERFILES[d.k] || d.perfil;
      const cz = D / 2, cu = W / 2;
      /** ¿Hay algo en este cuadrito del volumen? (u: de izquierda a derecha, v: de arriba abajo, z: de enfrente a atrás) */
      const dentro = (u, v, z) => {
        if (u < 0 || v < 0 || z < 0 || u >= W || v >= H || z >= D || !op[v * W + u]) return false;
        if (V) return !!ladoDe(u, v, z);
        if (perfil) {
          const py = (v + 0.5) * PX;
          let hay = false;
          for (const [y0, y1, z0, z1] of perfil) if (py >= y0 && py < y1) { hay = true; if (z >= Math.floor(z0 * D) && z <= Math.max(Math.floor(z0 * D), Math.ceil(z1 * D) - 1)) return true; }
          if (hay) return false;
        }
        if (plano) return Math.abs(z + 0.5 - cz) <= grosor / 2 + 0.01;
        if (v >= vPatas && !torno) return z < patita || z >= D - patita;
        if (torno) { const uc = (a0[v] + b0[v] + 1) / 2, r = (b0[v] - a0[v] + 1) / 2; return Math.hypot(u + 0.5 - uc, ((z + 0.5 - cz) * W) / D) <= r + 0.35; }
        if (caja) return true;
        if (asiento) return v < vSeat - 1 ? z >= Math.floor(D * 0.64) : true;
        // Sólido: el tramo ancho es hondo; lo angosto (un poste, una manija) es delgado, en medio.
        const t = tramos[v].find(([x, y]) => u >= x && u <= y), ancho = t ? t[1] - t[0] + 1 : 1;
        if (ancho >= anchoMax * 0.55) return true;
        const hz = Math.max(0.5, (D * ancho) / anchoMax / 2);
        return Math.abs(z + 0.5 - cz) <= hz + 0.01;
      };
      const ang = (g * Math.PI) / 180, co = Math.cos(ang), si = Math.sin(ang);
      const P = (u, v, z) => { const a = u - cu, b = z - cz, X = a * co - b * si, Z = a * si + b * co; return [X, v - Z * ELEV, Z]; };
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [u, v] of [[0, 0], [W, 0], [0, H], [W, H]]) for (const z of [0, D]) { const [X, Y] = P(u, v, z); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
      const OW = Math.ceil(x1 - x0) + 3, OH = Math.ceil(y1 - y0) + 3, zb = new Float32Array(OW * OH).fill(1e9), out = new Uint8ClampedArray(OW * OH * 4), cara = new Uint8Array(OW * OH);
      // La luz viene de arriba a la izquierda: arriba un escalón más clara; lo que mira para la derecha, más oscuro.
      // (Lo que sigue casi de frente —menos de unos 35°— conserva EXACTAMENTE sus colores de frente; sólo lo que de verdad
      // se voltea hacia la derecha baja un escalón o dos. Así girarlo poquito no le cambia el estilo.)
      const luz = (nx, nz) => { const X = nx * co - nz * si, Z = nx * si + nz * co, phi = Math.atan2(X, -Z) / (Math.PI / 2); return escalon(phi > 0.38 ? 1 - 0.24 * Math.min(1, (phi - 0.38) / 0.62) : phi < -0.6 ? 0.96 : 1); };
      const L = { f: luz(0, -1), b: luz(0, 1), l: luz(-1, 0), r: luz(1, 0) };
      // Lo más alto que hay en cada columna y hondura (para saber dónde se sienta o se acuesta un monito).
      const tope = new Int16Array(W * D).fill(-1);
      for (let u = 0; u < W; u++) for (let z = 0; z < D; z++) for (let v = 0; v < H; v++) if (dentro(u, v, z)) { tope[u * D + z] = v; break; }
      const topeEn = (u, z) => (u < 0 || u >= W ? 1e4 : tope[u * D + z] < 0 ? 1e4 : tope[u * D + z]);
      const R0 = Math.abs(si) * cu + Math.abs(co) * cz + 1.5, paso = 0.2;   // (Fase 74: sólo lo que cruza la cosa)
      for (let j = 0; j < OH; j++) for (let i = 0; i < OW; i++) {
        const X = x0 - 1 + i + 0.5, Y = y0 - 1 + j + 0.5;
        let pu = -99, pv = -99, pz = -99;
        for (let Z = -R0; Z <= R0; Z += paso) {
          const a = X * co + Z * si, b = -X * si + Z * co, u = Math.floor(a + cu), z = Math.floor(b + cz), v = Math.floor(Y + Z * ELEV);
          if (u === pu && v === pv && z === pz) continue;
          if (dentro(u, v, z)) {
            // ¿Por qué cara entró? La del lado por donde venía el rayo, si ese vecino está vacío.
            // (1 enfrente, 2 atrás, 3 izquierda, 4 derecha, 5 arriba)
            let f = 0;
            if (v > pv && !dentro(u, v - 1, z)) f = 5;
            if (!f && z !== pz) { const dz = z > pz ? -1 : 1; if (!dentro(u, v, z + dz)) f = dz < 0 ? 1 : 2; }
            if (!f && u !== pu) { const du = u > pu ? -1 : 1; if (!dentro(u + du, v, z)) f = du < 0 ? 3 : 4; }
            if (!f) f = !dentro(u, v - 1, z) ? 5 : !dentro(u, v, z - 1) ? 1 : 2;
            const base = cel(u, v);
            let c, k;
            if (V) {
              // (Fase 71) Lo dibujado a mano: el costado y lo de arriba con su color de lado; la espalda con el suyo.
              if (f === 5) { const tl = topeEn(u - 1, z), tr = topeEn(u + 1, z), pl = tl === v || tr === v || (tl > H && tr > H); if (!pl) f = tl > v ? 3 : 4; }
              if (f === 1) { c = base; k = L.f; }
              else if (f === 2) { c = colV(V.atras?.(u, v)) || (V.atras ? null : mezcla(colV(ladoDe(u, v, z)) || base, 0.97)) || base; k = L.b; }
              else { const lc = colV(ladoDe(u, v, z)) || (f === 3 ? izq[v] : der[v]) || base; c = f === 5 ? mezcla(lc, 1.06) : lc; k = f === 3 ? L.l : f === 4 ? L.r : null; }
            }
            else if (f === 5) {
              // (En una ladera —el techo de una tienda, la orilla de algo redondo— los cubitos hacen escalones: ahí la
              // cara de arriba se sombrea como la ladera, pareja, en vez de rayas claras y oscuras.)
              const tl = topeEn(u - 1, z), tr = topeEn(u + 1, z), plano = tl === v || tr === v || (tl > H && tr > H);
              // (Fase 74) Si el renglón de hasta arriba del dibujo es su rayita oscura, la tapa lleva el color del material
              // (el de abajo de la rayita); y se aclara adelante y se apaga un poquito hacia atrás.
              if (plano) {
                const tt = palT ? colT(d.tapa(u, z, W, D, v)) : null;
                if (tt) c = mezcla(tt, 1.02 - 0.05 * Math.min(1, z / Math.max(1, D - 1)));
                else { const deb = v + 1 < H && op[(v + 1) * W + u] ? cel(u, v + 1) : null, lb = (x) => x[0] * 0.3 + x[1] * 0.59 + x[2] * 0.11; c = mezcla(deb && lb(base) < lb(deb) * 0.8 ? deb : base, 1.13 - 0.07 * Math.min(1, z / Math.max(1, D - 1))); }
              }
              else { const izqda = tl > v; f = izqda ? 3 : 4; c = (izqda ? izq[v] : der[v]) || base; k = izqda ? L.l : L.r; }
            }
            else if (torno) {
              // Lo redondo se sombrea con su curva (en escalones), no por caras: así no salen rayas.
              const uc = (a0[v] + b0[v] + 1) / 2, nx = u + 0.5 - uc, nz = ((z + 0.5 - cz) * W) / D, m = Math.hypot(nx, nz) || 1;
              c = base; k = luz(nx / m, nz / m);
            }
            else if (f === 1) { c = base; k = L.f; }
            else if (f === 2) { c = caja || asiento ? mezcla(dorso, v === 0 || !op[(v - 1) * W + u] ? 1.06 : 0.96) : base; k = L.b; }
            else { const orilla = f === 3 ? izq[v] : der[v]; c = plano ? base : orilla || base; k = f === 3 ? L.l : L.r; }
            if (k != null) c = mezcla(c, k);
            const q = j * OW + i;
            zb[q] = Z; cara[q] = f; out[q * 4] = c[0]; out[q * 4 + 1] = c[1]; out[q * 4 + 2] = c[2]; out[q * 4 + 3] = 255;
            break;
          }
          pu = u; pv = v; pz = z;
        }
      }
      // (Fase 74) EL VOLUMEN, como pixel art a mano:
      //  · el filo de enfrente de cada tapa agarra luz (un renglón más claro);
      //  · lo de arriba pegado a algo más alto de atrás (el asiento junto al respaldo, la tapa junto a la repisa) queda en
      //    su sombrita;
      //  · y lo que toca el piso se oscurece tantito en su renglón de abajo (sombra de contacto).
      const tinta = (q, f) => { const k = q * 4; if (f > 1) { out[k] += (255 - out[k]) * (f - 1); out[k + 1] += (250 - out[k + 1]) * (f - 1); out[k + 2] += (240 - out[k + 2]) * (f - 1); } else { out[k] *= f; out[k + 1] *= f * 0.98; out[k + 2] = out[k + 2] * f + (1 - f) * 30; } };
      for (let j = 0; j < OH; j++) for (let i = 0; i < OW; i++) {
        const q = j * OW + i, f = cara[q];
        if (f !== 5) continue;
        const ab = j + 1 < OH ? cara[q + OW] : 0, ar = j > 0 ? cara[q - OW] : 0;
        if (ab && ab !== 5 && Math.abs(zb[q + OW] - zb[q]) < 2.2) tinta(q, 1.1);
        else if (ar && ar !== 5 && zb[q - OW] > zb[q] + 0.6) tinta(q, 0.86);
      }
      {
        const fondo = new Int16Array(OW).fill(-1);
        for (let i = 0; i < OW; i++) for (let j = OH - 1; j >= 0; j--) if (cara[j * OW + i]) { fondo[i] = j; break; }
        for (let i = 0; i < OW; i++) if (fondo[i] >= 0 && cara[fondo[i] * OW + i] !== 5) tinta(fondo[i] * OW + i, 0.84);
      }
      // La línea entre caras (de pixel art): donde se juntan dos caras distintas, la de abajo o la de la derecha se
      // oscurece un poquito (así se ve la orilla del mueble girado, como un dibujo).
      for (let j = OH - 1; j >= 1; j--) for (let i = OW - 1; i >= 1; i--) {
        const q = j * OW + i, f = cara[q];
        if (!f) continue;
        const arriba = cara[q - OW], izqF = cara[q - 1];
        if ((arriba && arriba !== f && arriba === 5 && f !== 5) || (!torno && izqF && izqF !== f && f !== 5 && izqF !== 5 && Math.abs(zb[q] - zb[q - 1]) < 3)) { out[q * 4] *= 0.86; out[q * 4 + 1] *= 0.84; out[q * 4 + 2] = out[q * 4 + 2] * 0.88 + 6; }
      }
      // El contorno (el mismo de frente).
      const { o2, OW2, OH2 } = contornar(out, OW, OH, d.sinContorno);
      // La sombrita en el piso, con la forma de su base girada (pixel, con la orilla tramada), debajo de todo.
      {
        let ub0 = W, ub1 = -1; const banda = Math.max(1, Math.round(H * 0.14));
        for (let v = H - banda; v < H; v++) if (a0[v] >= 0) { ub0 = Math.min(ub0, a0[v]); ub1 = Math.max(ub1, b0[v]); }
        if (ub1 >= ub0) for (let j = 0; j < OH; j++) for (let i = 0; i < OW; i++) {
          const k2 = ((j + 1) * OW2 + i + 1) * 4;
          if (o2[k2 + 3]) continue;
          const X = x0 - 1 + i + 0.5, Y = y0 - 1 + j + 0.5, Z = (H - Y) / ELEV, a = X * co + Z * si, b = -X * si + Z * co, u = a + cu, z = b + cz;
          // (Lo plano, como la bici, hace una sombra delgadita.)
          const zA = plano ? cz - grosor / 2 - 1 : 0, zB = plano ? cz + grosor / 2 + 1 : D;
          if (u < ub0 - 1 || u > ub1 + 3 || z < zA - 1 || z > zB + 1) continue;
          const orilla = u < ub0 || u > ub1 + 2 || z < zA || z > zB, centro = !orilla && u > ub0 + 1 && u < ub1 && z > zA + 1;
          if (orilla && (i + j) % 2) continue;
          o2[k2] = 70; o2[k2 + 1] = 34; o2[k2 + 2] = 60; o2[k2 + 3] = orilla ? 40 : centro ? 92 : 70;
        }
      }
      const oc = document.createElement("canvas"); oc.width = OW2; oc.height = OH2;
      oc.getContext("2d").putImageData(new ImageData(o2, OW2, OH2), 0, 0);
      // (Con el contorno la imagen creció un cuadrito por lado: todo se recorre uno.)
      const X0 = x0 - 1, Y0 = y0 - 1;
      const [AX, AY] = P(cu, H, cz);
      const zb2 = new Float32Array(OW2 * OH2).fill(1e9);
      for (let j = 0; j < OH; j++) for (let i = 0; i < OW; i++) zb2[(j + 1) * OW2 + i + 1] = zb[j * OW + i];
      // La matriz del frente girado (de las coordenadas del dibujo a las de la vista): para la capa viva.
      const ex = PX * (-cu * co + cz * si - X0 + 1), ey = PX * (cu * si * ELEV + cz * co * ELEV - Y0 + 1);
      // De lado o de espaldas lo vivo no se pierde: va en el plano de en medio, del ancho que se ve del objeto, y DETRÁS
      // de lo quieto (así una pantalla queda tapada por el mueble y una flamita o unas hojas siguen moviéndose arriba).
      const frente = co > 0.12, kx = (co < 0 ? -1 : 1) * Math.min(1, (Math.abs(co) * W + Math.abs(si) * D) / W);
      const medio = [kx, 0, 0, 1, PX * (-kx * cu - X0 + 1), PX * (1 - Y0)];
      // (Fase 74) De frente (0°): en qué pixel de la vista empieza el dibujo de frente (su esquina de arriba a la
      // izquierda), con el mismo primer paso del rayo que lo pintó: así lo vivo queda EXACTO encima de sus cuadritos.
      let fx = 0, fy = 0;
      if (!g) {
        const Zf = -R0 + Math.ceil((R0 - cz) / paso - 1e-9) * paso;
        let i0 = 0, j0 = 0;
        while (i0 < OW && Math.floor(X0 + i0 + 0.5 + cu) < 0) i0++;
        while (j0 < OH && Math.floor(Y0 + j0 + 0.5 + Zf * ELEV) < 0) j0++;
        fx = (i0 + 1) * PX; fy = (j0 + 1) * PX;
      }
      const r = { url: oc.toDataURL(), w: OW2 * PX, h: OH2 * PX, ax: (AX - X0 + 1) * PX, ay: (AY - Y0 + 1) * PX, fx, fy, matriz: frente ? [co, -si * ELEV, 0, 1, ex, ey] : medio, frente,
        // (Fase 66) Para meter un monito adentro sin que se atraviese: lo hondo de cada pixel y lo alto de cada columna.
        zb: zb2, x0: X0, y0: Y0, OW: OW2, OH: OH2, W, H, D, cu, cz, tope, g };
      CACHE.set(clave, r);
      if (CACHE.size > 900) CACHE.delete(CACHE.keys().next().value);
      return r;
    } catch (er) { return null; } finally { PEND.delete(clave); }
  })();
  PEND.set(clave, pr);
  return pr.then((r) => r && { ...r, vivo: partes.vivo });
}

/**
 * (Fase 67) LA COSA DE FRENTE EN PIXEL DE VERDAD: lo quieto del dibujo se vuelve cuadritos de 4 (como los monitos y
 * las cosas giradas), con la misma rejilla que se usa al girarla (Fase 70), y su contorno pixel por fuera.
 * Lo que se mueve sigue vivo encima (el mismo dibujo, con lo quieto transparente). Se hacen de una en una.
 */
let COLA = Promise.resolve();
/**
 * (Fase 74) DE FRENTE CON VOLUMEN (2.5D): lo que va en el piso y se puede girar se ve de frente con su grosor, como en
 * una casita pixel art de verdad: el frente de siempre (los mismos cuadritos, en el mismo lugar) y, encima, su tapa en
 * perspectiva (la cubierta del mueble, el asiento y el respaldo del sillón, la tapa del refri), con su filo de luz, su
 * sombrita junto a lo más alto, su contacto con el piso y su sombra pixel en el piso. Es la misma vista que al girarlo
 * (a 0°), así de frente y girado se ve igual de hondo. `fx`, `fy`: dónde empieza el dibujo de frente dentro de la vista.
 * Lo que ya viene dibujado con su tapa (`ya34`), lo plano (una bici, un cuadro) y lo que casi todo se mueve se queda
 * como estaba.
 */
export const con34 = (d) => d.capa === "piso" && !d.mascota && !d.noGira && !d.ya34 && d.k !== "cosita" && !soloFrenteAtras(d);
const claveFrente = (d, e, C) => { const partes0 = separar(d.arte(e || {}, C)); let q = partes0.quieto; if (d.frente) q = q.replace(/<\/svg>\s*$/, separar(d.frente(e || {}, C)).quieto.replace(/^<svg[^>]*>/, "")); return `${d.k}|${huella(q)}|0|74`; };
export function vista34Ya(d, e, C) { try { const v = CACHE.get(claveFrente(d, e, C)); return v && !v.plano ? v : null; } catch (er) { return null; } }
export function vista34(d, e, C) {
  let k; try { k = claveFrente(d, e, C); } catch (er) { return Promise.resolve(null); }
  const ya = CACHE.get(k);
  if (ya) return Promise.resolve(ya.plano ? null : ya);
  const pr = (COLA = COLA.then(async () => {
    await vistasListas;
    if (CACHE.has(k)) return CACHE.get(k);
    await new Promise((r) => setTimeout(r, 0));   // (deja pintar un cuadro entre una y otra)
    const v = await vistaGirada(d, e, C, 0);
    recordar(k, v);
    return v;
  }));
  return pr.then((v) => (v && !v.plano ? v : null), () => null);
}
/** (Fase 74) La vista de frente que le toca: con volumen si va en el piso; si no (o si casi todo se mueve), la plana. */
export function vistaFrente(d, e, C) { return con34(d) ? vista34(d, e, C).then((v) => v || vistaPlana(d, e, C)) : vistaPlana(d, e, C); }
export function vistaFrenteYa(d, e, C) { return con34(d) ? vista34Ya(d, e, C) : vistaPlanaYa(d, e, C); }
/** (Fase 73) La vista plana si ya está hecha (para pintarla al instante, sin pasar por el dibujo liso). */
export function vistaPlanaYa(d, e, C) {
  try { const partes = separar(d.arte(e || {}, C)); return CACHE.get(`plana|${d.k}|${huella(partes.quieto)}`) || null; } catch (er) { return null; }
}
export function vistaPlana(d, e, C) {
  const arte = d.arte(e || {}, C), partes = separar(arte), clave = `plana|${d.k}|${huella(partes.quieto)}`;
  if (CACHE.has(clave)) return Promise.resolve(CACHE.get(clave));
  if (PEND.has(clave)) return PEND.get(clave);
  const pr = (COLA = COLA.then(async () => {
    await vistasListas;
    if (CACHE.has(clave)) { PEND.delete(clave); return CACHE.get(clave); }
    await new Promise((r) => setTimeout(r, 0));
    try {
      const { cw, ch, out } = await rejilla(d, partes.quieto);
      // (Fase 69) Lo delicado (un cable, una guirnalda) no lleva contorno: se vería gordo.
      const { o2, OW2, OH2 } = contornar(out, cw, ch, d.sinContorno);
      const cv = document.createElement("canvas"); cv.width = OW2; cv.height = OH2;
      cv.getContext("2d").putImageData(new ImageData(o2, OW2, OH2), 0, 0);
      const r = { url: cv.toDataURL(), w: OW2 * PX, h: OH2 * PX };
      CACHE.set(clave, r); recordar(clave, r);
      if (CACHE.size > 700) CACHE.delete(CACHE.keys().next().value);
      return r;
    } catch (er) { return null; } finally { PEND.delete(clave); }
  }));
  PEND.set(clave, pr);
  return pr;
}

/**
 * (Fase 68, rehecho en la Fase 74) EL SOMBREADO DE PIXEL ART de lo que viene de vectores (cw × ch, RGBA, alfa 0 o 255),
 * por partes: cada parte del dibujo (los cuadritos juntos del mismo color) se sombrea como volumen, con la luz arriba a
 * la izquierda:
 *   · su filo de arriba agarra luz (y un poquito su orilla izquierda);
 *   · su orilla de abajo y la de la derecha bajan un escalón;
 *   · lo de abajo de las partes grandes se apaga en escalones tramados (así un cojín, un ropero o una tina no se ven
 *     planos);
 *   · y donde se juntan dos partes muy distintas, la línea de pixel art (la más oscura de las dos se marca).
 */
function sombrear(out, cw, ch) {
  const N = cw * ch, op = (i, j) => i >= 0 && j >= 0 && i < cw && j < ch && out[(j * cw + i) * 4 + 3] === 255;
  const lum = (k) => out[k] * 0.3 + out[k + 1] * 0.59 + out[k + 2] * 0.11;
  const col = (q) => (out[q * 4] << 16) | (out[q * 4 + 1] << 8) | out[q * 4 + 2];
  // 1) Las partes: cuadritos juntos del mismo color (con su alto y su ancho).
  const parte = new Int32Array(N).fill(-1), y0 = [], y1 = [], x0 = [], x1 = [], tam = [];
  for (let q = 0; q < N; q++) {
    if (parte[q] >= 0 || out[q * 4 + 3] !== 255) continue;
    const id = y0.length, c = col(q), pila = [q];
    parte[q] = id; y0.push(1e9); y1.push(-1); x0.push(1e9); x1.push(-1); tam.push(0);
    while (pila.length) {
      const r = pila.pop(), i = r % cw, j = (r / cw) | 0;
      tam[id]++; if (j < y0[id]) y0[id] = j; if (j > y1[id]) y1[id] = j; if (i < x0[id]) x0[id] = i; if (i > x1[id]) x1[id] = i;
      for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) { if (!op(a, b)) continue; const t = b * cw + a; if (parte[t] < 0 && col(t) === c) { parte[t] = id; pila.push(t); } }
    }
  }
  const otra = (q, a, b) => !op(a, b) || parte[b * cw + a] !== parte[q];
  const marca = new Uint8Array(N);   // 1 filo de luz, 2 orilla en sombra, 3 línea entre partes, 4 sombra tramada abajo, 5 luz de la orilla izquierda
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    if (!op(i, j)) continue;
    const q = j * cw + i, k = q * 4, L = lum(k), id = parte[q], alto = y1[id] - y0[id] + 1, ancho = x1[id] - x0[id] + 1;
    // La línea entre partes muy distintas (la más oscura de las dos).
    for (const [a, b] of [[i + 1, j], [i, j + 1]]) {
      if (!op(a, b)) continue;
      const q2 = b * cw + a, k2 = q2 * 4, dif = Math.abs(out[k] - out[k2]) + Math.abs(out[k + 1] - out[k2 + 1]) + Math.abs(out[k + 2] - out[k2 + 2]);
      if (dif < 60) continue;
      const L2 = lum(k2), cual = L2 < L ? q2 : q;
      if (Math.min(L, L2) > 58) marca[cual] = 3;
    }
    if (marca[q] === 3 || tam[id] < 3) continue;
    if (otra(q, i, j - 1) && L > 60) marca[q] = 1;
    else if (alto > 2 && otra(q, i, j + 1)) marca[q] = 2;
    else if (ancho > 3 && otra(q, i + 1, j)) marca[q] = 2;
    else if (ancho > 3 && otra(q, i - 1, j) && L > 60) marca[q] = 5;
    else if (alto >= 6 && j > y0[id] + alto * 0.62 && ((i + j) % 2 === 0 || j > y0[id] + alto * 0.8)) marca[q] = 4;
  }
  for (let q = 0; q < N; q++) {
    const m = marca[q], k = q * 4;
    if (m === 3) { out[k] *= 0.76; out[k + 1] *= 0.74; out[k + 2] = out[k + 2] * 0.78 + 10; }
    else if (m === 2) { out[k] *= 0.87; out[k + 1] *= 0.85; out[k + 2] = out[k + 2] * 0.89 + 7; }
    else if (m === 4) { out[k] *= 0.94; out[k + 1] *= 0.93; out[k + 2] = out[k + 2] * 0.95 + 4; }
    else if (m === 1) { out[k] += (255 - out[k]) * 0.2; out[k + 1] += (250 - out[k + 1]) * 0.18; out[k + 2] += (236 - out[k + 2]) * 0.13; }
    else if (m === 5) { out[k] += (255 - out[k]) * 0.08; out[k + 1] += (250 - out[k + 1]) * 0.07; out[k + 2] += (236 - out[k + 2]) * 0.05; }
  }
}
