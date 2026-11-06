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
 *   · Se hace una vez por cosa, dibujo y ángulo (de 15 en 15 grados) y se guarda.
 */
const PX = 4, ELEV = 0.36, CACHE = new Map(), PEND = new Map(), PODADO = new Map();
export const ELEV_GIRO = ELEV;
export const pasoGiro = 15;
/** El ángulo guardado de una cosa (0…345, de 15 en 15). */
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
async function rejilla(d, quieto) {
  const clave = `rej|${d.k}|${huella(quieto)}`;
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
  const clave = `${d.k}|${huella(partes.quieto)}|${g}|70`;
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
      const D = Math.max(2, Math.round(hondura(d) / PX));
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
      const R0 = Math.hypot(cu, cz) + 2, paso = 0.2;
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
            if (f === 5) { c = mezcla(base, 1.1); }
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
      // La línea entre caras (de pixel art): donde se juntan dos caras distintas, la de abajo o la de la derecha se
      // oscurece un poquito (así se ve la orilla del mueble girado, como un dibujo).
      for (let j = OH - 1; j >= 1; j--) for (let i = OW - 1; i >= 1; i--) {
        const q = j * OW + i, f = cara[q];
        if (!f) continue;
        const arriba = cara[q - OW], izqF = cara[q - 1];
        if ((arriba && arriba !== f && arriba === 5 && f !== 5) || (!torno && izqF && izqF !== f && f !== 5 && izqF !== 5 && Math.abs(zb[q] - zb[q - 1]) < 3)) { out[q * 4] *= 0.86; out[q * 4 + 1] *= 0.84; out[q * 4 + 2] = out[q * 4 + 2] * 0.88 + 6; }
      }
      // Lo más alto que hay en cada columna y hondura (para saber dónde se sienta o se acuesta un monito).
      const tope = new Int16Array(W * D).fill(-1);
      for (let u = 0; u < W; u++) for (let z = 0; z < D; z++) for (let v = 0; v < H; v++) if (dentro(u, v, z)) { tope[u * D + z] = v; break; }
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
          if (u < ub0 - 1 || u > ub1 + 2 || z < zA - 1 || z > zB + 1) continue;
          const orilla = u < ub0 || u > ub1 + 1 || z < zA || z > zB;
          if (orilla && (i + j) % 2) continue;
          o2[k2] = 70; o2[k2 + 1] = 34; o2[k2 + 2] = 60; o2[k2 + 3] = orilla ? 40 : 76;
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
      const r = { url: oc.toDataURL(), w: OW2 * PX, h: OH2 * PX, ax: (AX - X0 + 1) * PX, ay: (AY - Y0 + 1) * PX, matriz: frente ? [co, -si * ELEV, 0, 1, ex, ey] : medio, frente,
        // (Fase 66) Para meter un monito adentro sin que se atraviese: lo hondo de cada pixel y lo alto de cada columna.
        zb: zb2, x0: X0, y0: Y0, OW: OW2, OH: OH2, W, H, D, cu, cz, tope, g };
      CACHE.set(clave, r);
      if (CACHE.size > 200) CACHE.delete(CACHE.keys().next().value);
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
export function vistaPlana(d, e, C) {
  const arte = d.arte(e || {}, C), partes = separar(arte), clave = `plana|${d.k}|${huella(partes.quieto)}`;
  if (CACHE.has(clave)) return Promise.resolve(CACHE.get(clave));
  if (PEND.has(clave)) return PEND.get(clave);
  const pr = (COLA = COLA.then(async () => {
    await new Promise((r) => setTimeout(r, 0));
    try {
      const { cw, ch, out } = await rejilla(d, partes.quieto);
      // (Fase 69) Lo delicado (un cable, una guirnalda) no lleva contorno: se vería gordo.
      const { o2, OW2, OH2 } = contornar(out, cw, ch, d.sinContorno);
      const cv = document.createElement("canvas"); cv.width = OW2; cv.height = OH2;
      cv.getContext("2d").putImageData(new ImageData(o2, OW2, OH2), 0, 0);
      const r = { url: cv.toDataURL(), w: OW2 * PX, h: OH2 * PX };
      CACHE.set(clave, r);
      if (CACHE.size > 260) CACHE.delete(CACHE.keys().next().value);
      return r;
    } catch (er) { return null; } finally { PEND.delete(clave); }
  }));
  PEND.set(clave, pr);
  return pr;
}

/** (Fase 68) El sombreado de pixel art de una imagen en cuadritos (cw × ch, RGBA, alfa 0 o 255). */
function sombrear(out, cw, ch) {
  const op = (i, j) => i >= 0 && j >= 0 && i < cw && j < ch && out[(j * cw + i) * 4 + 3] === 255;
  const lum = (k) => out[k] * 0.3 + out[k + 1] * 0.59 + out[k + 2] * 0.11;
  const marca = new Uint8Array(cw * ch);   // 1 luz arriba, 2 sombrita abajo, 3 línea entre partes
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    if (!op(i, j)) continue;
    const q = j * cw + i, k = q * 4, L = lum(k);
    for (const [a, b] of [[i + 1, j], [i, j + 1]]) {
      if (!op(a, b)) continue;
      const q2 = b * cw + a, k2 = q2 * 4, dif = Math.abs(out[k] - out[k2]) + Math.abs(out[k + 1] - out[k2 + 1]) + Math.abs(out[k + 2] - out[k2 + 2]);
      if (dif < 50) continue;
      const L2 = lum(k2), cual = L2 < L ? q2 : q, Lc = Math.min(L, L2);
      if (Lc > 58) marca[cual] = 3;
    }
    if (marca[q] !== 3) { if (!op(i, j - 1) && L > 70) marca[q] = 1; else if (!op(i, j + 1)) marca[q] = 2; }
  }
  for (let q = 0; q < cw * ch; q++) {
    const m = marca[q], k = q * 4;
    if (m === 3) { out[k] *= 0.76; out[k + 1] *= 0.74; out[k + 2] = out[k + 2] * 0.78 + 10; }
    else if (m === 2) { out[k] *= 0.88; out[k + 1] *= 0.86; out[k + 2] = out[k + 2] * 0.9 + 6; }
    else if (m === 1) { out[k] += (255 - out[k]) * 0.16; out[k + 1] += (248 - out[k + 1]) * 0.14; out[k + 2] += (232 - out[k + 2]) * 0.1; }
  }
}
