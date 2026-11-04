/**
 * GIRAR LAS COSAS (Fase 64): cada mueble se puede girar libremente y se ve desde ese ángulo, no como una
 * imagen plana que da vueltas.
 *
 *   · El dibujo de frente se pasa a pixel (4 del mundo = 1 pixel) y se vuelve un bloquecito de vóxeles con su
 *     hondura: el frente es el dibujo, los costados toman el color de la orilla (más oscuros), arriba el de la
 *     parte de arriba (más clarito) y la espalda es lisa, del color de cada fila.
 *   · Se dibuja desde el ángulo (rotando alrededor de lo vertical y con la mirada un poco desde arriba, como la
 *     casita) con un z-buffer: lo de atrás queda tapado. Al final, su contornito pixel.
 *   · Se hace una vez por cosa, color y ángulo (de 15 en 15 grados) y se guarda.
 */
const PX = 4, ELEV = 0.36, CACHE = new Map(), PEND = new Map();
export const ELEV_GIRO = ELEV;
export const pasoGiro = 15;
/** El ángulo guardado de una cosa (0…345, de 15 en 15). */
export function giroDe(o) { const g = Math.round((+o?.e?.giro || 0) / pasoGiro) * pasoGiro; return ((g % 360) + 360) % 360; }
/** La hondura de un mueble (en el mundo). */
export const hondura = (d) => Math.max(10, Math.min(150, d.hondo ?? Math.min(d.w * 0.55, d.h * 0.5 + 24)));
/** Lo que ocupa en el piso (medio ancho y media hondura) ya girado. */
export function huellaGirada(d, g, medio, fondo) {
  const a = (g * Math.PI) / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)), mh = fondo / 2;
  return { medio: medio * c + mh * s * 2.2, fondo: (medio * s) / 1.4 + fondo * c };
}
/** El monito sentado en una cosa girada: dónde queda su asiento y hacia dónde mira. */
export function lugarGirado(l, g, sx) {
  const dx0 = l.dx * sx;
  if (!g) return { dx: dx0, dy: l.dy, cara: "frente", mira: l.mira ? l.mira * sx : 0 };
  const a = (g * Math.PI) / 180, dx = dx0 * Math.cos(a), dz = dx0 * Math.sin(a);
  const cara = g > 45 && g < 135 ? "der" : g >= 135 && g <= 225 ? "atras" : g > 225 && g < 315 ? "izq" : "frente";
  return { dx, dy: l.dy - dz * ELEV, cara, mira: cara === "der" ? 1 : cara === "izq" ? -1 : l.mira ? l.mira * sx : 0 };
}
const svgConMedida = (s, w, h) => s.replace(/^<svg\b/, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`);
const mezcla = (c, k) => k < 1 ? [c[0] * k, c[1] * k, c[2] * k] : [c[0] + (255 - c[0]) * (k - 1), c[1] + (255 - c[1]) * (k - 1), c[2] + (255 - c[2]) * (k - 1)];

/** La vista girada: { url, w, h, ax, ay } en el mundo (ax, ay = el punto del piso al centro de su base), o null. */
export function vistaGirada(d, e, C, g, f) {
  const clave = `${d.k}|${C || ""}|${g}|${f ? 1 : 0}|${e?.dano | 0}`;
  if (CACHE.has(clave)) return Promise.resolve(CACHE.get(clave));
  if (PEND.has(clave)) return PEND.get(clave);
  const pr = (async () => {
    try {
      const W = Math.max(2, Math.ceil(d.w / PX)), H = Math.max(2, Math.ceil(d.h / PX));
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgConMedida(d.arte(e || {}, C), W, H));
      await img.decode();
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const cx = cv.getContext("2d", { willReadFrequently: true });
      if (f) { cx.translate(W, 0); cx.scale(-1, 1); }
      cx.drawImage(img, 0, 0, W, H);
      const src = cx.getImageData(0, 0, W, H).data, op = new Uint8Array(W * H), col = new Array(W * H);
      for (let i = 0; i < W * H; i++) { if (src[i * 4 + 3] > 110) { op[i] = 1; col[i] = [src[i * 4], src[i * 4 + 1], src[i * 4 + 2]]; } }
      const D = Math.max(2, Math.round(hondura(d) / PX));
      // Los colores de los costados (la orilla de cada fila), de arriba (lo de arriba de cada columna) y de la espalda.
      const izq = [], der = [], fila = [], arriba = [];
      for (let v = 0; v < H; v++) {
        let a = -1, b = -1, s0 = 0, s1 = 0, s2 = 0, n = 0;
        for (let u = 0; u < W; u++) if (op[v * W + u]) { if (a < 0) a = u; b = u; const c = col[v * W + u]; s0 += c[0]; s1 += c[1]; s2 += c[2]; n++; }
        izq[v] = a >= 0 ? col[v * W + a] : null; der[v] = b >= 0 ? col[v * W + b] : null; fila[v] = n ? [s0 / n, s1 / n, s2 / n] : null;
      }
      for (let u = 0; u < W; u++) { arriba[u] = null; for (let v = 0; v < H; v++) if (op[v * W + u]) { arriba[u] = col[v * W + u]; break; } }
      // Proyección: girar alrededor de lo vertical (a = a lo ancho, b = a lo hondo) y ver un poquito desde arriba.
      const ang = (g * Math.PI) / 180, co = Math.cos(ang), si = Math.sin(ang), cu = W / 2, cz = D / 2;
      const P = (u, v, z) => { const a = u - cu, b = z - cz, X = a * co - b * si, Z = a * si + b * co; return [X, v - Z * ELEV, Z]; };
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [u, v] of [[0, 0], [W, 0], [0, H], [W, H]]) for (const z of [0, D]) { const [X, Y] = P(u, v, z); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
      const OW = Math.ceil(x1 - x0) + 3, OH = Math.ceil(y1 - y0) + 3, zb = new Float32Array(OW * OH).fill(1e9), out = new Uint8ClampedArray(OW * OH * 4);
      const luzLado = Math.abs(si) > 0.05 ? (si > 0 ? 0.72 : 0.84) : 0.8;
      // La forma de lado: los asientos tienen respaldo atrás y asiento adelante; los muebles de caja, todo lo hondo;
      // lo demás (lámparas, plantas, cositas) es redondito: cada fila tan honda como ancha.
      const caja = d.tope != null || !!d.superficie || /mesa|ropero|refri|librero|estufa|alacena|buro|escritorio|consola|tocador|baul|lavadora|tele|repisa|fregadero|barra|cama|banca|caja|cajon|piano|arcade/.test(d.k);
      const asiento = !caja && !!d.lugares?.some((l) => l.pose === "sentado");
      const zA = new Int16Array(H), zB = new Int16Array(H);
      for (let v = 0; v < H; v++) {
        if (!fila[v]) { zA[v] = 1; zB[v] = 0; continue; }
        if (asiento && v < H * 0.5) { zA[v] = Math.floor(D * 0.62); zB[v] = D - 1; }
        else if (!caja && !asiento) { let a = W, b = -1; for (let u = 0; u < W; u++) if (op[v * W + u]) { if (u < a) a = u; b = u; } const h = Math.max(1, Math.min(D, Math.round((b - a + 1) * 0.9))); zA[v] = Math.floor(cz - h / 2); zB[v] = Math.min(D - 1, zA[v] + h - 1); }
        else { zA[v] = 0; zB[v] = D - 1; }
      }
      const lleno3 = (u, v, z) => u >= 0 && v >= 0 && u < W && v < H && op[v * W + u] && z >= zA[v] && z <= zB[v];
      for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
        if (!op[v * W + u]) continue;
        const cc = col[v * W + u];
        for (let z = zA[v]; z <= zB[v]; z++) {
          let c;
          if (!lleno3(u, v, z - 1)) c = cc;
          else if (!lleno3(u, v - 1, z)) c = mezcla(cc, 1.12);
          else if (!lleno3(u - 1, v, z) || !lleno3(u + 1, v, z)) c = mezcla((u < cu ? izq[v] : der[v]) || cc, luzLado);
          else if (!lleno3(u, v, z + 1)) c = mezcla(fila[v], 0.82 - (v / H) * 0.12);
          else continue;
          for (const [du, dv] of [[0.25, 0.25], [0.75, 0.75]]) {
            const [X, Y, Z] = P(u + du, v + dv, z + 0.5), i = Math.floor(X - x0) + 1, j = Math.floor(Y - y0) + 1, k = j * OW + i;
            if (i < 0 || j < 0 || i >= OW || j >= OH || Z >= zb[k]) continue;
            zb[k] = Z; out[k * 4] = c[0]; out[k * 4 + 1] = c[1]; out[k * 4 + 2] = c[2]; out[k * 4 + 3] = 255;
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
      // El ancla: el centro de la base (abajo, a media hondura), para que gire en su lugar.
      const [AX, AY] = P(cu, H, cz);
      const r = { url: oc.toDataURL(), w: OW * PX, h: OH * PX, ax: (AX - x0 + 1) * PX, ay: (AY - y0 + 1) * PX };
      CACHE.set(clave, r);
      if (CACHE.size > 160) CACHE.delete(CACHE.keys().next().value);
      return r;
    } catch (er) { return null; } finally { PEND.delete(clave); }
  })();
  PEND.set(clave, pr);
  return pr;
}
