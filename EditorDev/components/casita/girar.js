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

/** La vista girada: { url, w, h, ax, ay, vivo, matriz, frente } en el mundo (ax, ay = el centro de su base), o
 *  { plano: true } si casi todo se mueve (entonces no se gira), o null si no se pudo. */
export function vistaGirada(d, e, C, g) {
  const arte = d.arte(e || {}, C), partes = separar(arte);
  const clave = `${d.k}|${huella(partes.quieto)}|${g}`;
  if (CACHE.has(clave)) return Promise.resolve({ ...CACHE.get(clave), vivo: partes.vivo });
  if (PEND.has(clave)) return PEND.get(clave).then((r) => r && { ...r, vivo: partes.vivo });
  const pr = (async () => {
    try {
      const W = Math.max(2, Math.ceil(d.w / PX)), H = Math.max(2, Math.ceil(d.h / PX));
      const src = await rasterizar(partes.quieto, W, H), op = new Uint8Array(W * H), col = new Array(W * H);
      let nq = 0;
      for (let i = 0; i < W * H; i++) { if (src[i * 4 + 3] > 110) { op[i] = 1; nq++; col[i] = [src[i * 4], src[i * 4 + 1], src[i * 4 + 2]]; } }
      // ¿Casi todo se mueve? Entonces no se gira (se vería roto).
      if (partes.vivo) {
        const todo = await rasterizar(arte, W, H);
        let nt = 0; for (let i = 0; i < W * H; i++) if (todo[i * 4 + 3] > 110) nt++;
        if (nt && nq / nt < 0.55) { const r = { plano: true }; CACHE.set(clave, r); return r; }
      }
      const D = Math.max(2, Math.round(hondura(d) / PX));
      const izq = [], der = [], fila = [], a0 = new Int16Array(H), b0 = new Int16Array(H);
      for (let v = 0; v < H; v++) {
        let a = -1, b = -1, s0 = 0, s1 = 0, s2 = 0, n = 0;
        for (let u = 0; u < W; u++) if (op[v * W + u]) { if (a < 0) a = u; b = u; const c = col[v * W + u]; s0 += c[0]; s1 += c[1]; s2 += c[2]; n++; }
        a0[v] = a; b0[v] = b; izq[v] = a >= 0 ? col[v * W + a] : null; der[v] = b >= 0 ? col[v * W + b] : null; fila[v] = n ? [s0 / n, s1 / n, s2 / n] : null;
      }
      // La silueta de lado: cajas, todo lo hondo; asientos, respaldo atrás / asiento / patitas en las esquinas; lo demás
      // (mesas, lámparas, plantas, cositas), su misma silueta de frente apretada a lo hondo.
      const caja = d.caja ?? (/ropero|refri|librero|estufa|alacena|buro|tocador|baul|lavadora|repisa|fregadero|barra|caja|cajon|piano|arcade|lavabo|tina|inodoro|consola|tele|chimenea|closet|horno|micro|cuna|cama/.test(d.k) && !/mesa|escritorio/.test(d.k));
      // (Fase 68) Lo redondo (lámparas, vasos, jarrones, macetas, mesitas redondas): cada renglón es un círculo.
      const torno = !!d.torno;
      const asiento = !caja && !!d.lugares?.some((l) => l.pose === "sentado");
      let vSeat = Math.round(H * 0.5), vPatas = H;
      if (asiento) {
        // El asiento: la fila más ancha de la mitad de abajo; las patitas: donde abajo la silueta tiene huecos.
        let mx = -1; for (let v = Math.floor(H * 0.35); v < H * 0.85; v++) { const w = b0[v] - a0[v]; if (w > mx) { mx = w; vSeat = v; } }
        for (let v = H - 1; v > vSeat; v--) { let huecos = 0; for (let u = a0[v] + 1; u < b0[v]; u++) if (!op[v * W + u]) huecos++; if (huecos > W * 0.25) vPatas = v; else break; }
      }
      const perfil = PERFILES[d.k] || d.perfil;
      const lado = (z, v, u) => {
        if (!fila[v]) return false;
        // (Fase 65) Lo delgado es delgado: la pantalla de la tele, el espejo del tocador, el tanque del excusado atrás…
        // (Fase 68) Una franja puede tener varios pedazos (las patitas de adelante y las de atrás).
        if (perfil) {
          const py = (v + 0.5) * PX;
          let hay = false;
          for (const [y0, y1, z0, z1] of perfil) if (py >= y0 && py < y1) { hay = true; if (z >= Math.floor(z0 * D) && z <= Math.max(Math.floor(z0 * D), Math.ceil(z1 * D) - 1)) return true; }
          if (hay) return false;
        }
        if (torno) { const uc = (a0[v] + b0[v] + 1) / 2, r = (b0[v] - a0[v] + 1) / 2; return Math.hypot(u + 0.5 - uc, ((z + 0.5 - cz) * W) / D) <= r + 0.35; }
        if (caja) return true;
        if (asiento) {
          if (v < vSeat - 1) return z >= Math.floor(D * 0.64);
          if (v >= vPatas) return z <= 1 || z >= D - 2;
          return true;
        }
        const uu = Math.min(W - 1, Math.floor(((z + 0.5) / D) * W));
        return !!op[v * W + uu] || (uu > a0[v] && uu < b0[v] && v < H * 0.7);
      };
      const ang = (g * Math.PI) / 180, co = Math.cos(ang), si = Math.sin(ang), cu = W / 2, cz = D / 2;
      const P = (u, v, z) => { const a = u - cu, b = z - cz, X = a * co - b * si, Z = a * si + b * co; return [X, v - Z * ELEV, Z]; };
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [u, v] of [[0, 0], [W, 0], [0, H], [W, H]]) for (const z of [0, D]) { const [X, Y] = P(u, v, z); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
      const OW = Math.ceil(x1 - x0) + 3, OH = Math.ceil(y1 - y0) + 3, zb = new Float32Array(OW * OH).fill(1e9), out = new Uint8ClampedArray(OW * OH * 4);
      const luzLado = si > 0 ? 0.74 : 0.86;
      // (Fase 66) Lo más alto que hay en cada columna y hondura (para saber dónde se sienta o se acuesta un monito).
      const tope = new Int16Array(W * D).fill(-1);
      const lleno3 = (u, v, z) => u >= 0 && v >= 0 && u < W && v < H && z >= 0 && z < D && op[v * W + u] && lado(z, v, u);
      for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
        if (!op[v * W + u]) continue;
        const cc = col[v * W + u];
        for (let z = 0; z < D; z++) {
          if (!lado(z, v, u)) continue;
          if (tope[u * D + z] < 0) tope[u * D + z] = v;
          let c;
          if (!lleno3(u, v, z - 1)) c = cc;
          else if (!lleno3(u, v - 1, z)) c = mezcla(cc, 1.12);
          else if (!lleno3(u - 1, v, z) || !lleno3(u + 1, v, z)) {
            // De lado: en lo redondito, la misma textura del frente apretada; en cajas y asientos, el color de la orilla.
            const base = caja || asiento ? (u < cu ? izq[v] : der[v]) : col[v * W + Math.min(W - 1, Math.floor(((z + 0.5) / D) * W))] || (u < cu ? izq[v] : der[v]);
            c = mezcla(base || cc, luzLado);
          } else if (!lleno3(u, v, z + 1)) c = caja || asiento ? mezcla(fila[v], 0.8 - (v / H) * 0.1) : mezcla(col[v * W + (W - 1 - u)] || fila[v], 0.8);
          else continue;
          for (const [du, dv] of [[0.25, 0.25], [0.75, 0.75]]) {
            const [X, Y, Z] = P(u + du, v + dv, z + 0.5), i = Math.floor(X - x0) + 1, j = Math.floor(Y - y0) + 1, k = j * OW + i;
            if (i < 0 || j < 0 || i >= OW || j >= OH || Z >= zb[k]) continue;
            zb[k] = Z; out[k * 4] = c[0]; out[k * 4 + 1] = c[1]; out[k * 4 + 2] = c[2]; out[k * 4 + 3] = 255;
          }
        }
      }
      // (Fase 66) La sombrita en el piso, con la forma de su base girada (pixel, con la orilla tramada).
      {
        let ub0 = W, ub1 = -1; const banda = Math.max(1, Math.round(H * 0.14));
        for (let v = H - banda; v < H; v++) if (a0[v] >= 0) { ub0 = Math.min(ub0, a0[v]); ub1 = Math.max(ub1, b0[v]); }
        if (ub1 >= ub0) for (let z = -1; z <= D; z++) for (let u = ub0 - 1; u <= ub1 + 1; u++) {
          const orilla = u < ub0 || u > ub1 || z < 0 || z >= D;
          for (const [du, dz] of [[0.25, 0.25], [0.75, 0.75], [0.25, 0.75], [0.75, 0.25]]) {
            const [X, Y] = P(u + du, H, z + dz), i = Math.floor(X - x0) + 1, j = Math.floor(Y - y0) + 1, k = j * OW + i;
            if (i < 0 || j < 0 || i >= OW || j >= OH || out[k * 4 + 3]) continue;
            if (orilla && (i + j) % 2) continue;
            out[k * 4] = 70; out[k * 4 + 1] = 34; out[k * 4 + 2] = 60; out[k * 4 + 3] = orilla ? 40 : 76;
          }
        }
      }
      // Contornito pixel alrededor.
      const lleno = (i, j) => i >= 0 && j >= 0 && i < OW && j < OH && out[(j * OW + i) * 4 + 3] === 255;
      const borde = [];
      for (let j = 0; j < OH; j++) for (let i = 0; i < OW; i++) if (!lleno(i, j) && (lleno(i - 1, j) || lleno(i + 1, j) || lleno(i, j - 1) || lleno(i, j + 1))) borde.push((j * OW + i) * 4);
      for (const k of borde) { out[k] = 75; out[k + 1] = 46; out[k + 2] = 66; out[k + 3] = 150; }
      const oc = document.createElement("canvas"); oc.width = OW; oc.height = OH;
      oc.getContext("2d").putImageData(new ImageData(out, OW, OH), 0, 0);
      const [AX, AY] = P(cu, H, cz);
      // La matriz del frente girado (de las coordenadas del dibujo a las de la vista): para la capa viva.
      const ex = PX * (-cu * co + cz * si - x0 + 1), ey = PX * (cu * si * ELEV + cz * co * ELEV - y0 + 1);
      // De lado o de espaldas lo vivo no se pierde: va en el plano de en medio, del ancho que se ve del objeto, y DETRÁS
      // de lo quieto (así una pantalla queda tapada por el mueble y una flamita o unas hojas siguen moviéndose arriba).
      const frente = co > 0.12, kx = (co < 0 ? -1 : 1) * Math.min(1, (Math.abs(co) * W + Math.abs(si) * D) / W);
      const medio = [kx, 0, 0, 1, PX * (-kx * cu - x0 + 1), PX * (1 - y0)];
      const r = { url: oc.toDataURL(), w: OW * PX, h: OH * PX, ax: (AX - x0 + 1) * PX, ay: (AY - y0 + 1) * PX, matriz: frente ? [co, -si * ELEV, 0, 1, ex, ey] : medio, frente,
        // (Fase 66) Para meter un monito adentro sin que se atraviese: lo hondo de cada pixel y lo alto de cada columna.
        zb, x0, y0, OW, OH, W, H, D, cu, cz, tope, g };
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
 * las cosas giradas). Cada cuadrito toma el color que más hay en él (sin mezclas de orilla), y las rayitas oscuras
 * del dibujo (el contorno, las costuras) ganan si ocupan buena parte del cuadrito, para que no se pierdan.
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
      const W = Math.max(4, Math.round(d.w)), H = Math.max(4, Math.round(d.h)), cw = Math.ceil(W / PX), ch = Math.ceil(H / PX);
      const src = await rasterizar(partes.quieto, W, H), out = new Uint8ClampedArray(cw * ch * 4);
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
      // (Fase 68) Sombreado de pixel art (lo que ya viene dibujado en pixel, `d.pixel`, se queda como está): entre dos
      // partes de colores distintos, la más oscura lleva su línea; arriba de la silueta le da la luz y abajo se
      // asienta con su sombrita. Así lo liso se ve con volumen y con sus piezas separadas.
      if (!d.pixel) sombrear(out, cw, ch);
      // El contorno pixel por fuera (del color de junto, mucho más oscuro), como el de los monitos: un cuadrito más
      // de cada lado.
      const OW2 = cw + 2, OH2 = ch + 2, o2 = new Uint8ClampedArray(OW2 * OH2 * 4), en = (i, j) => i >= 0 && j >= 0 && i < cw && j < ch && out[(j * cw + i) * 4 + 3] === 255;
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) if (en(i, j)) { const a = (j * cw + i) * 4, b = ((j + 1) * OW2 + i + 1) * 4; for (let q = 0; q < 4; q++) o2[b + q] = out[a + q]; }
      // (Fase 69) Lo delicado (un cable, una guirnalda) no lleva contorno: se vería gordo.
      if (!d.sinContorno) for (let j = -1; j <= ch; j++) for (let i = -1; i <= cw; i++) {
        if (en(i, j)) continue;
        const v = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].find(([a, b]) => en(a, b));
        if (!v) continue;
        const a = (v[1] * cw + v[0]) * 4, b = ((j + 1) * OW2 + i + 1) * 4;
        o2[b] = out[a] * 0.42; o2[b + 1] = out[a + 1] * 0.41; o2[b + 2] = out[a + 2] * 0.42 + 23; o2[b + 3] = 255;
      }
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
