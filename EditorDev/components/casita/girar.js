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
      const caja = /ropero|refri|librero|estufa|alacena|buro|tocador|baul|lavadora|repisa|fregadero|barra|caja|cajon|piano|arcade|lavabo|tina|inodoro|consola|tele|chimenea|closet|horno|micro|cuna|cama/.test(d.k) && !/mesa|escritorio/.test(d.k);
      const asiento = !caja && !!d.lugares?.some((l) => l.pose === "sentado");
      let vSeat = Math.round(H * 0.5), vPatas = H;
      if (asiento) {
        // El asiento: la fila más ancha de la mitad de abajo; las patitas: donde abajo la silueta tiene huecos.
        let mx = -1; for (let v = Math.floor(H * 0.35); v < H * 0.85; v++) { const w = b0[v] - a0[v]; if (w > mx) { mx = w; vSeat = v; } }
        for (let v = H - 1; v > vSeat; v--) { let huecos = 0; for (let u = a0[v] + 1; u < b0[v]; u++) if (!op[v * W + u]) huecos++; if (huecos > W * 0.25) vPatas = v; else break; }
      }
      const perfil = PERFILES[d.k] || d.perfil;
      const lado = (z, v) => {
        if (!fila[v]) return false;
        // (Fase 65) Lo delgado es delgado: la pantalla de la tele, el espejo del tocador, el tanque del excusado atrás…
        if (perfil) { const py = (v + 0.5) * PX; for (const [y0, y1, z0, z1] of perfil) if (py >= y0 && py < y1) return z >= Math.floor(z0 * D) && z <= Math.max(Math.floor(z0 * D), Math.ceil(z1 * D) - 1); }
        if (caja) return true;
        if (asiento) {
          if (v < vSeat - 1) return z >= Math.floor(D * 0.64);
          if (v >= vPatas) return z <= 1 || z >= D - 2;
          return true;
        }
        const u = Math.min(W - 1, Math.floor(((z + 0.5) / D) * W));
        return !!op[v * W + u] || (u > a0[v] && u < b0[v] && v < H * 0.7);
      };
      const ang = (g * Math.PI) / 180, co = Math.cos(ang), si = Math.sin(ang), cu = W / 2, cz = D / 2;
      const P = (u, v, z) => { const a = u - cu, b = z - cz, X = a * co - b * si, Z = a * si + b * co; return [X, v - Z * ELEV, Z]; };
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [u, v] of [[0, 0], [W, 0], [0, H], [W, H]]) for (const z of [0, D]) { const [X, Y] = P(u, v, z); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
      const OW = Math.ceil(x1 - x0) + 3, OH = Math.ceil(y1 - y0) + 3, zb = new Float32Array(OW * OH).fill(1e9), out = new Uint8ClampedArray(OW * OH * 4);
      const luzLado = si > 0 ? 0.74 : 0.86;
      // (Fase 66) Lo más alto que hay en cada columna y hondura (para saber dónde se sienta o se acuesta un monito).
      const tope = new Int16Array(W * D).fill(-1);
      const lleno3 = (u, v, z) => u >= 0 && v >= 0 && u < W && v < H && z >= 0 && z < D && op[v * W + u] && lado(z, v);
      for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
        if (!op[v * W + u]) continue;
        const cc = col[v * W + u];
        for (let z = 0; z < D; z++) {
          if (!lado(z, v)) continue;
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
