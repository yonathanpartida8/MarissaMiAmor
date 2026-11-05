/**
 * EL EXTERIOR (Fase 64): un patio grande para explorar, dibujado en pixel art de verdad (cada pixel se pone con su
 * paleta, su tramado y sus orillas; no es un filtro encima).
 *
 *   · Mide como tres cuartos de largo y también es hondo: se explora para los lados y hacia abajo. Hay zonas:
 *     la entrada con su porche, la plaza con la fuente, el jardín de flores con su estanque, el huerto con sus
 *     árboles frutales, el río (con puente y con piedritas para cruzar) y el prado de abajo.
 *   · Los límites son naturales: espinas a la izquierda y abajo, un barranco a la derecha y la casa y el seto
 *     atrás. Nada de eso se pisa (la navegación lo sabe) ni se puede acomodar (al acomodar se ve en naranja).
 *   · La fachada de la casa tiene su puerta de verdad (lleva a la sala), ventanas que se prenden de noche y faroles.
 *   · El escenario (árboles, arbustos, rocas, la fuente y los letreros) está en el mundo con su hondura: el monito
 *     pasa por delante o por detrás; los árboles se mecen y sueltan hojitas (suciedad.js).
 *
 * Todo se dibuja una sola vez en lienzos chiquitos (3 del mundo = 1 pixel) que se agrandan sin suavizar.
 */
export const MAPA = { w: 2400, fondo: 452, frente: 1580, alto: 1640, arriba: 130, px: 3 };
export const FACHADA = { x0: 840, x1: 1560, puerta: 1200, techo: 58, pared: 206, base: 452 };

/* ── Tipos de terreno ── */
export const T = { PASTO: 0, TIERRA: 1, PIEDRA: 2, AGUA: 3, ORILLA: 4, PUENTE: 5, ESPINAS: 6, BARRANCO: 7, ROCA: 8, SETO: 9, PORCHE: 10, CASA: 11, PIEDRAS: 12, SURCOS: 13 };
const BLOQUEA = new Set([T.AGUA, T.ORILLA, T.ESPINAS, T.BARRANCO, T.ROCA, T.SETO, T.CASA]);

/* ── Ruido y azar con semilla (siempre igual en los dos teléfonos) ── */
export const hash = (x, y, s = 0) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
export function ruido(x, y, esc, s = 0) {
  const fx = x / esc, fy = y / esc, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (i, j) => BAYER[(j & 3) * 4 + (i & 3)];

/* ── Los caminos (líneas que se recorren) ── */
const CAMINOS = [
  [[1090, 884], [900, 906], [700, 886], [520, 892]],
  [[520, 892], [330, 862], [205, 762], [172, 622], [262, 520]],
  [[520, 892], [452, 1000], [430, 1120]],
  [[430, 1290], [420, 1380], [600, 1424], [900, 1364], [1200, 1340]],
  [[1310, 884], [1500, 872], [1700, 866], [1900, 860], [2160, 850]],
  [[1830, 860], [1830, 632], [2210, 632]],
  [[1200, 975], [1200, 1150]],
  [[1200, 1258], [1200, 1340], [1500, 1380], [1850, 1362], [2200, 1334]],
];
const CAJAS = CAMINOS.map((l) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of l) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a - 60, b - 60, c + 60, d + 60]; });
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
function distCaminos(x, y) {
  let m = 1e9;
  for (let k = 0; k < CAMINOS.length; k++) {
    const B = CAJAS[k];
    if (x < B[0] || x > B[2] || y < B[1] || y > B[3]) continue;
    const l = CAMINOS[k];
    for (let i = 1; i < l.length; i++) m = Math.min(m, distSeg(x, y, l[i - 1][0], l[i - 1][1], l[i][0], l[i][1]));
  }
  return m;
}
export const rioY = (x) => 1205 + 28 * Math.sin(x / 210) + 14 * Math.sin(x / 97 + 1.3);
const rioAncho = (x) => 46 + 6 * Math.sin(x / 150);
const PIEDRAS_RIO = (() => { const l = []; for (let k = -2; k <= 2; k++) l.push([430 + (k % 2 ? 6 : -4), rioY(430) + k * 23]); return l; })();
export const bordeBarranco = (y, n = 0) => 2292 + 20 * Math.sin(y / 95) + 10 * Math.sin(y / 37) + n * 10;

let PROF = 0;   // (lo hondo del agua del último punto: para pintarla)
/** El terreno en (x, y) del patio (x desde la orilla izquierda del patio). */
export function terreno(x, y) {
  PROF = 0;
  const n = ruido(x, y, 26) - 0.5;
  if (y < MAPA.fondo) return x >= FACHADA.x0 && x <= FACHADA.x1 ? T.CASA : T.SETO;
  if (x < 64 + 16 * Math.sin(y / 70) + n * 16) return T.ESPINAS;
  if (y > 1552 + 16 * Math.sin(x / 90) + 9 * Math.sin(x / 31) + n * 14) return T.ESPINAS;
  const xr = bordeBarranco(y, n);
  if (x > xr + 26) return T.BARRANCO;
  if (x > xr) return T.ROCA;
  if (y < 471 + n * 8 && (x < FACHADA.x0 - 8 || x > FACHADA.x1 + 8)) return T.SETO;
  if (y < 504 && Math.abs(x - FACHADA.puerta) < 94) return T.PORCHE;
  // El río (con su puente y sus piedritas).
  const yr = rioY(x), hw = rioAncho(x), dr = Math.abs(y - yr);
  if (dr < hw + n * 7) {
    if (Math.abs(x - FACHADA.puerta) < 54) return T.PUENTE;
    for (const [sx, sy] of PIEDRAS_RIO) if (Math.hypot(x - sx, (y - sy) * 1.15) < 23) return T.PIEDRAS;
    PROF = Math.max(0, 1 - dr / hw);
    return dr < hw - 9 ? T.AGUA : T.ORILLA;
  }
  // El estanque del jardín de flores.
  const ep = ((x - 430) / 150) ** 2 + ((y - 700) / 66) ** 2 + n * 0.14;
  if (ep < 1) { PROF = 1 - ep; return ep < 0.8 ? T.AGUA : T.ORILLA; }
  // La plaza (con la fuente) y el caminito de piedra de la puerta.
  if (Math.hypot(x - 1200, (y - 862) * 1.25) < 120 + n * 8) return T.PIEDRA;
  if (Math.abs(x - 1200) < 40 + n * 5 && y < 862) return T.PIEDRA;
  if (distCaminos(x, y) < 30 + n * 9) return T.TIERRA;
  if (x > 1720 && x < 2064 && y > 952 && y < 1090) return T.SURCOS;
  // El seto entre la plaza y el huerto (con su hueco para el camino).
  if (Math.abs(x - 1650 - 10 * Math.sin(y / 50)) < 15 && y > 471 && y < 1112 && !(y > 796 && y < 934)) return T.SETO;
  return T.PASTO;
}
/** (Fase 65) El agua en (x, y): su hondura (0 a 1) si es agua; -1 si es orilla; -2 si es el puente o las piedritas; 0 si no. */
export function aguaEn(x, y) {
  const t = terreno(x, y);
  return t === T.AGUA ? 0.04 + PROF * 0.96 : t === T.ORILLA ? -1 : t === T.PUENTE || t === T.PIEDRAS ? -2 : 0;
}
/* La cuadrícula de tipos (6 del mundo por cuadrito) para lo que se pregunta mucho: caminar y acomodar. Se hace una vez. */
const G6 = 6, GY0 = MAPA.fondo - 12;
let REJ = null, RW = 0, RH = 0;
function rejilla() {
  if (REJ) return REJ;
  RW = Math.ceil(MAPA.w / G6); RH = Math.ceil((MAPA.alto - GY0) / G6);
  REJ = new Uint8Array(RW * RH);
  for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) REJ[j * RW + i] = terreno(i * G6 + G6 / 2, GY0 + j * G6 + G6 / 2);
  return REJ;
}
/** El tipo de terreno (rápido, de la cuadrícula). */
export function tipoEn(x, y) {
  if (y < MAPA.fondo) return x >= FACHADA.x0 && x <= FACHADA.x1 ? T.CASA : T.SETO;
  const g = rejilla(), i = Math.floor(x / G6), j = Math.floor((y - GY0) / G6);
  if (i < 0 || i >= RW || j >= RH) return T.ESPINAS;
  return g[j * RW + i];
}
export const pisable = (x, y) => !BLOQUEA.has(tipoEn(x, y));

/* ── El escenario: árboles, arbustos, rocas, la fuente y los letreros (fijos, con hondura) ── */
export const ESCENARIO = [
  // Jardín de flores (izquierda) y el estanque.
  ["sauce", 262, 662], ["cerezo", 660, 566], ["cerezo", 150, 940], ["roble", 720, 1060], ["arbusto", 560, 600], ["arbusto", 330, 520],
  ["roca", 596, 770], ["roca", 330, 770], ["arbusto", 860, 600], ["cerezo", 420, 540],
  // La plaza.
  ["fuente", 1200, 880], ["cerezo", 1004, 768], ["cerezo", 1398, 768], ["arbusto", 1066, 990], ["arbusto", 1336, 990], ["letrero", 1292, 974],
  // El huerto.
  ["frutal", 1760, 566, 0], ["frutal", 1900, 566, 1], ["frutal", 2040, 566, 0], ["frutal", 2180, 566, 1],
  ["frutal", 1760, 712, 1], ["frutal", 1900, 712, 0], ["frutal", 2040, 712, 1], ["frutal", 2180, 712, 0],
  ["pino", 2234, 990], ["pino", 1700, 1070], ["arbusto", 2120, 1050],
  // Las orillas del río y el prado de abajo.
  ["abedul", 900, 1090], ["abedul", 1560, 1122], ["sauce", 660, 1294], ["roble", 900, 1466], ["roble", 1620, 1480], ["pino", 2150, 1470],
  ["pino", 330, 1476], ["arbusto", 1360, 1500], ["cerezo", 1000, 1284], ["roca", 1930, 1306], ["roca", 2040, 1508], ["letrero", 1252, 1316],
  ["abedul", 1640, 1300], ["arbusto", 560, 1500], ["roble", 170, 1400],
].map(([k, x, y, v = 0], i) => ({ id: "e" + i, k, x, y, v }));
/** Lo que mide cada cosa del escenario y su «huella» en el piso (lo que no se pisa). */
// (Fase 65) Los árboles de verdad grandes: dos a tres veces lo alto de los monitos (el pino y el roble, más).
export const MEDIDAS = {
  roble: { w: 380, h: 500, hw: 30, hd: 15, hojas: "#6cbf6a" }, cerezo: { w: 320, h: 420, hw: 24, hd: 12, hojas: "#ffb3cc" },
  frutal: { w: 232, h: 296, hw: 20, hd: 11, hojas: "#7ccf6f" }, pino: { w: 236, h: 520, hw: 24, hd: 12, hojas: "#4f9a62" },
  abedul: { w: 220, h: 450, hw: 18, hd: 10, hojas: "#c9e36a" }, sauce: { w: 390, h: 420, hw: 28, hd: 14, hojas: "#9ed36f" },
  arbusto: { w: 96, h: 64, hw: 40, hd: 16 }, roca: { w: 90, h: 54, hw: 38, hd: 16 }, fuente: { w: 190, h: 170, hw: 80, hd: 34 },
  letrero: { w: 84, h: 120, hw: 8, hd: 6 },
};
export const ES_ARBOL = new Set(["roble", "cerezo", "frutal", "pino", "abedul", "sauce"]);
export function huellaEsc(e) { const m = MEDIDAS[e.k]; return { x0: e.x - m.hw, x1: e.x + m.hw, y0: e.y - m.hd, y1: e.y + 4 }; }

/** ¿Se puede poner algo aquí al acomodar? (sólo en el pasto, sin tocar caminos, agua, orillas ni el escenario) */
export function editable(x, y) {
  for (const [dx, dy] of [[0, 0], [-18, 0], [18, 0], [0, -10], [0, 10]]) if (tipoEn(x + dx, y + dy) !== T.PASTO) return false;
  for (const e of ESCENARIO) { const h = huellaEsc(e); if (x > h.x0 - 26 && x < h.x1 + 26 && y > h.y0 - 14 && y < h.y1 + 14) return false; }
  return y <= MAPA.frente - 20;
}

/* ═════════════ Pintar en pixel ═════════════ */
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const P = (...l) => l.map(hex);
const PAL = {
  pasto: P("#4f9a52", "#5eab5c", "#6dbb66", "#7fca74", "#93d886"), mata: P("#3f8746", "#a4e392"),
  tierra: P("#c9a06f", "#d6b07d", "#e2c191", "#b48a5c", "#efd6ad"),
  piedra: P("#c9c0d6", "#d8d0e3", "#e6e0ee", "#a99fb6", "#f4f0f8"),
  agua: P("#3b86c6", "#4b9bd6", "#5fb0e3", "#7cc6ef", "#b9e6fa", "#eefaff"),
  orilla: P("#d9c28d", "#e6d3a2", "#c8ad78"),
  puente: P("#b47a4b", "#c98f5c", "#daa572", "#7a4f33", "#e8bb8a"),
  espinas: P("#2c5236", "#386442", "#477a4d", "#5f945d", "#6b4630", "#e45d80", "#c23251"),
  roca: P("#9c8e84", "#b3a598", "#cbbfb2", "#7e7068", "#e0d6cb"),
  barranco: P("#6e5f6d", "#5a4d5f", "#463c55", "#352e48", "#272138", "#7d7088"),
  seto: P("#2f6b3c", "#3f8a4d", "#4f9e5a", "#69b86f", "#ffc2d6"),
  porche: P("#d3a77b", "#e3b98f", "#a87a55", "#f0cfa6"),
  surcos: P("#8a5c3c", "#a37250", "#6a442c", "#6cc36a", "#9be08a"),
  flores: P("#ffffff", "#ffb3cf", "#ffe27a", "#c9a7ff", "#ff8fa8"),
};
function lienzo(cv, w, h) { cv.width = w; cv.height = h; const ctx = cv.getContext("2d"); const img = ctx.createImageData(w, h); return { ctx, img, d: img.data, w, h }; }
function pon(L, i, j, c, a = 255) { if (i < 0 || j < 0 || i >= L.w || j >= L.h) return; const o = (j * L.w + i) * 4; L.d[o] = c[0]; L.d[o + 1] = c[1]; L.d[o + 2] = c[2]; L.d[o + 3] = a; }
function oscurece(L, i, j, k) { if (i < 0 || j < 0 || i >= L.w || j >= L.h) return; const o = (j * L.w + i) * 4; L.d[o] *= k; L.d[o + 1] *= k; L.d[o + 2] *= k; }

/** El piso del patio (de y0 a alto). Devuelve la cuadrícula de tipos (para la máscara de lo que no se acomoda). */
/** (Se dibuja en pedacitos para no trabar la pantalla: `pausa` deja respirar entre uno y otro.) */
export async function pintarTerreno(cv, y0 = MAPA.fondo - 12, pausa = () => new Promise((r) => setTimeout(r, 0))) {
  const S = MAPA.px, W = Math.ceil(MAPA.w / S), H = Math.ceil((MAPA.alto - y0) / S), L = lienzo(cv, W, H);
  const tipos = new Uint8Array(W * H), prof = new Float32Array(W * H);
  for (let j = 0; j < H; j++) { for (let i = 0; i < W; i++) { const k = j * W + i; tipos[k] = terreno(i * S + 1.5, y0 + j * S + 1.5); prof[k] = PROF; } if (j % 24 === 23) await pausa(); }
  const t = (i, j) => (i < 0 || j < 0 || i >= W || j >= H ? -1 : tipos[j * W + i]);
  for (let j = 0; j < H; j++) { if (j % 40 === 39) await pausa(); for (let i = 0; i < W; i++) {
    const k = j * W + i, ty = tipos[k], x = i * S, y = y0 + j * S, b = bayer(i, j);
    const arriba = t(i, j - 1), abajo = t(i, j + 1), izq = t(i - 1, j), der = t(i + 1, j);
    let c;
    switch (ty) {
      case T.PASTO: {
        const v = ruido(x, y, 46) * 0.62 + ruido(x, y, 14, 3) * 0.38;
        let q = Math.max(0, Math.min(4, Math.floor(v * 4 + b - 0.25)));
        // Matitas: una V oscurita con la puntita clara, y florecitas sueltas (más en el prado).
        const ci = i >> 2, cj = j >> 2, hm = hash(ci, cj, 11);
        if (hm < 0.16 && (i & 3) === 1 && (j & 3) === 2) c = PAL.mata[0];
        else if (hm < 0.16 && (i & 3) === 1 && (j & 3) === 1) c = PAL.mata[1];
        else {
          const hf = hash(i, j, 5), prado = y > 1270 ? 0.012 : y < 1130 && x < 900 ? 0.008 : 0.003;
          if (hf < prado) c = PAL.flores[Math.floor(hash(i, j, 6) * 5)];
          else c = PAL.pasto[q];
        }
        // Orillita oscura donde empieza otra cosa (el pasto se asoma sobre la tierra).
        if (arriba >= 0 && arriba !== T.PASTO && arriba !== T.SURCOS) c = PAL.pasto[0];
        break;
      }
      case T.TIERRA: {
        const hp = hash(i, j, 21);
        c = hp < 0.05 ? PAL.tierra[3] : hp > 0.96 ? PAL.tierra[4] : PAL.tierra[Math.min(2, Math.floor(ruido(x, y, 20, 2) * 3 + b * 0.6))];
        if (arriba === T.PASTO || izq === T.PASTO || der === T.PASTO) c = PAL.tierra[3];
        if (abajo === T.PASTO && hash(i, j, 4) < 0.5) c = PAL.pasto[1];
        break;
      }
      case T.PIEDRA: {
        // Losetas en tabique (7×5) con su junta, su brillito arriba y su sombrita abajo.
        const fila = Math.floor(j / 5), off = fila % 2 ? 3 : 0, col = Math.floor((i + off) / 7), ii = (i + off) % 7, jj = j % 5;
        if (ii === 0 || jj === 0) c = PAL.piedra[3];
        else { const h = hash(col, fila, 9); c = jj === 1 ? PAL.piedra[4] : jj === 4 ? PAL.piedra[0] : PAL.piedra[h < 0.33 ? 0 : h < 0.7 ? 1 : 2]; }
        if (arriba === T.PASTO) c = PAL.pasto[0];
        break;
      }
      case T.AGUA: case T.ORILLA: {
        const p = prof[k];
        if (ty === T.ORILLA) { c = PAL.orilla[hash(i, j, 7) < 0.3 ? 2 : 1]; if (arriba === T.PASTO || izq === T.PASTO || der === T.PASTO) c = PAL.orilla[2]; if (abajo === T.AGUA) c = PAL.agua[5]; break; }
        let q = p > 0.62 ? 0 : p > 0.38 ? 1 : p > 0.2 ? 2 : 3;
        if (b > 0.75 && q < 3 && p < 0.7) q++;
        c = PAL.agua[q];
        // Olitas: rayitas claras que van de lado; brillitos sueltos.
        if (hash(i >> 3, j, 31) < 0.09 && (i & 7) < 4) c = PAL.agua[4];
        if (hash(i, j, 33) < 0.004) c = PAL.agua[5];
        if (arriba === T.ORILLA || arriba === T.PASTO) c = PAL.agua[4];
        if (izq === T.PUENTE || der === T.PUENTE || izq === T.PIEDRAS || abajo === T.PIEDRAS) c = PAL.agua[0];
        break;
      }
      case T.PUENTE: {
        const xx = x - (FACHADA.puerta - 54);
        if (xx < 9 || xx > 99) c = (j % 6 === 0) ? PAL.puente[4] : PAL.puente[3];     // el barandal con sus postes
        else c = j % 4 === 0 ? PAL.puente[3] : PAL.puente[hash(0, j >> 2, 41) < 0.5 ? 1 : 2];
        if ((j % 4 === 1) && xx >= 9 && xx <= 99) c = PAL.puente[4];
        break;
      }
      case T.PIEDRAS: { c = arriba !== T.PIEDRAS ? PAL.piedra[4] : abajo !== T.PIEDRAS ? PAL.piedra[3] : PAL.piedra[hash(i, j, 12) < 0.5 ? 1 : 0]; break; }
      case T.ESPINAS: {
        const v = ruido(x, y, 12, 8), h = hash(i, j, 17);
        c = PAL.espinas[v < 0.35 ? 0 : v < 0.6 ? 1 : 2];
        if (h < 0.08) c = PAL.espinas[4];                          // ramitas
        if (h > 0.985) c = PAL.espinas[5]; else if (h > 0.975) c = PAL.espinas[6];   // espinitas y moritas
        if (arriba >= 0 && arriba !== T.ESPINAS) c = PAL.espinas[3];
        break;
      }
      case T.ROCA: { const v = ruido(x, y, 9, 4); c = PAL.roca[v < 0.3 ? 0 : v < 0.65 ? 1 : 2]; if (hash(i, j, 13) < 0.05) c = PAL.roca[3]; if (izq === T.PASTO || arriba === T.PASTO) c = PAL.roca[4]; break; }
      case T.BARRANCO: {
        // La caída: la cara de la roca con sus vetas y, más allá, lo hondo que se pierde en la neblina.
        const xr = bordeBarranco(y) + 26, dx = x - xr;
        if (dx < 34) c = (Math.floor(y / 9) % 2 ? PAL.barranco[0] : PAL.barranco[1]);
        else { const q = Math.min(4, 2 + Math.floor((dx - 34) / 40 + b * 0.8)); c = PAL.barranco[q]; if (hash(i >> 2, j >> 1, 19) < 0.06) c = PAL.barranco[5]; }
        break;
      }
      case T.SETO: {
        const v = ruido(x, y, 7, 6), h = hash(i, j, 23);
        c = PAL.seto[v < 0.3 ? 0 : v < 0.55 ? 1 : v < 0.8 ? 2 : 3];
        if (h > 0.992) c = PAL.seto[4];
        if (arriba >= 0 && arriba !== T.SETO && arriba !== T.CASA) c = PAL.seto[3];
        if (abajo >= 0 && abajo !== T.SETO) c = PAL.seto[0];
        break;
      }
      case T.PORCHE: { c = j % 4 === 0 ? PAL.porche[2] : PAL.porche[hash(i >> 4, j >> 2, 3) < 0.5 ? 0 : 1]; if (j % 4 === 1) c = PAL.porche[3]; if (abajo >= 0 && abajo !== T.PORCHE) c = PAL.porche[2]; break; }
      case T.SURCOS: { const r = j % 5; c = r < 2 ? PAL.surcos[1] : r < 4 ? PAL.surcos[0] : PAL.surcos[2]; if (r === 1 && i % 5 === 2) c = PAL.surcos[3]; if (r === 0 && i % 5 === 2) c = PAL.surcos[4]; break; }
      default: { c = hex("#cbbcc9"); }
    }
    pon(L, i, j, c);
    // Sombra suave de lo que está arriba (el seto y la casa) sobre el pasto.
    if ((ty === T.PASTO || ty === T.TIERRA || ty === T.PIEDRA) && y < 500 && (t(i, j - 3) === T.SETO || t(i, j - 3) === T.CASA)) oscurece(L, i, j, 0.86);
  } }
  // Las sombras del escenario en el piso (redonditas, hacia la izquierda: el sol está a la derecha).
  for (const e of ESCENARIO) {
    const m = MEDIDAS[e.k], rx = (ES_ARBOL.has(e.k) ? m.w * 0.36 : m.w * 0.5) / S, ry = rx * 0.32, cx = (e.x - 10) / S, cy = (e.y - y0 + 2) / S;
    for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) {
      const dd = ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2;
      if (dd < 1 && (dd < 0.6 || bayer(i, j) > 0.5)) oscurece(L, i, j, 0.8);
    }
  }
  // Nenúfares en el estanque (con su florecita).
  for (const [nx, ny, fl] of [[372, 690, 1], [468, 716, 0], [520, 684, 1], [344, 724, 0], [430, 668, 0]]) {
    const ci = Math.round(nx / S), cj = Math.round((ny - y0) / S);
    for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if ((i * i) / 9 + (j * j) / 4 <= 1 && !(i > 0 && j === 0)) pon(L, ci + i, cj + j, j < 0 && i < 0 ? hex("#8fd06f") : hex("#5fae55"));
    if (fl) { pon(L, ci - 1, cj - 1, hex("#ffc2d6")); pon(L, ci, cj - 2, hex("#ff8fb0")); pon(L, ci - 2, cj - 2, hex("#ffc2d6")); }
  }
  L.ctx.putImageData(L.img, 0, 0);
  return { tipos, W, H, y0 };
}

/** La máscara naranja de lo que no se puede acomodar (se ve sólo al acomodar). */
export function pintarNoEditable(cv, y0 = MAPA.fondo - 12) {
  const S = MAPA.px * 2, W = Math.ceil(MAPA.w / S), H = Math.ceil((MAPA.alto - y0) / S), L = lienzo(cv, W, H);
  const N = [255, 150, 60], B = [255, 214, 160];
  const ok = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) ok[j * W + i] = editable(i * S + S / 2, y0 + j * S + S / 2) ? 1 : 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (ok[j * W + i]) continue;
    const borde = (i > 0 && ok[j * W + i - 1]) || (i < W - 1 && ok[j * W + i + 1]) || (j > 0 && ok[(j - 1) * W + i]) || (j < H - 1 && ok[(j + 1) * W + i]);
    if (borde) pon(L, i, j, B, 235);
    else if (((i + j) & 3) < 2) pon(L, i, j, N, 120);
    else pon(L, i, j, N, 50);
  }
  L.ctx.putImageData(L.img, 0, 0);
}

/** El paisaje de atrás: cielo con nubes, montañas a lo lejos, lomas, el bosque y la cerca blanca. */
export function pintarPanorama(cv, hora = "dia", clima = "sol") {
  const S = MAPA.px, y0 = -MAPA.arriba, y1 = MAPA.fondo + 6, W = Math.ceil(MAPA.w / S), H = Math.ceil((y1 - y0) / S), L = lienzo(cv, W, H);
  const nub = clima !== "sol";
  const CIELO = { dia: nub ? ["#8fa9c6", "#b3c6d9", "#d5e0ea"] : ["#6fb8ef", "#9ad2fa", "#d2efff"], tarde: ["#f39ab3", "#ffbfae", "#ffe0b0"], noche: ["#1a1d48", "#2b2d62", "#45427e"] }[hora];
  const C3 = CIELO.map(hex);
  const MONTE = { dia: P("#9fb4de", "#b9c9ea", "#f4f7ff"), tarde: P("#c99ac4", "#e0b3cc", "#ffeef3"), noche: P("#3b3f74", "#4a4d86", "#8f93c9") }[hora];
  const LOMA = { dia: P("#86c98b", "#9ad69a", "#72b97b"), tarde: P("#b8b08a", "#cfc29a", "#a39a7a"), noche: P("#2f4c56", "#3a5b62", "#27404a") }[hora];
  const BOSQ = { dia: P("#3f8650", "#4f9a5e", "#62b06d", "#2f6b3c"), tarde: P("#6f7a52", "#828c5e", "#99a06c", "#56603f"), noche: P("#1f3a3c", "#284848", "#335656", "#172d30") }[hora];
  const NUBE = { dia: nub ? P("#e9eef3", "#c7d1dc") : P("#ffffff", "#dbe9f6"), tarde: P("#fff1ea", "#f3bfc6"), noche: P("#555a8c", "#43467a") }[hora];
  for (let j = 0; j < H; j++) {
    const f = j / H, b0 = Math.min(2, Math.floor(f * 2.2 + 0.0001));
    for (let i = 0; i < W; i++) {
      const g = f * 2.2 - b0, c = g > 0.6 && bayer(i, j) < (g - 0.6) * 2.5 ? C3[Math.min(2, b0 + 1)] : C3[b0];
      pon(L, i, j, c);
    }
  }
  // Estrellitas de noche.
  if (hora === "noche") for (let k = 0; k < 160; k++) { const i = Math.floor(hash(k, 1, 51) * W), j = Math.floor(hash(k, 2, 51) * H * 0.55); pon(L, i, j, hash(k, 3, 51) < 0.2 ? [255, 240, 190] : [230, 234, 255]); }
  // Nubes de pixel (gorditas, con su panza más oscura).
  for (let k = 0; k < 9; k++) {
    const cx = hash(k, 7, 52) * W, cy = 8 + hash(k, 8, 52) * H * 0.32, ancho = 18 + hash(k, 9, 52) * 26;
    for (let b = 0; b < 5; b++) {
      const bx = cx + (b - 2) * ancho * 0.28, by = cy - (b === 2 ? 4 : b % 2 ? 2 : 0), r = ancho * (b === 2 ? 0.32 : 0.24);
      for (let j = Math.floor(by - r); j <= by + r * 0.6; j++) for (let i = Math.floor(bx - r); i <= bx + r; i++) if ((i - bx) ** 2 + ((j - by) * 1.5) ** 2 < r * r) pon(L, i, j, j > by + r * 0.2 ? NUBE[1] : NUBE[0]);
    }
  }
  // Montañas a lo lejos (con nieve en la punta) y luego las lomas.
  for (let i = 0; i < W; i++) {
    const x = i * S, alt = (xx) => 40 + 190 * ruido(xx, 0, 320, 61) ** 1.4 + 56 * ruido(xx, 0, 96, 62) + 12 * ruido(xx, 0, 26, 65);
    const alto = alt(x), cae = alt(x + S) < alto, top = Math.floor((340 - alto - y0) / S), nieve = Math.max(0, (alto - 150) * 0.1);
    for (let j = Math.max(0, top); j < H; j++) { const prof = j - top; pon(L, i, j, prof < nieve + ruido(x, 9, 30, 63) * 2 ? MONTE[2] : (cae ? bayer(i, j) < 0.7 : prof > 16 && bayer(i, j) < 0.35) ? MONTE[1] : MONTE[0]); }
    const loma = 372 - 34 * ruido(x, 0, 180, 64), tl = Math.floor((loma - y0) / S);
    for (let j = Math.max(0, tl); j < H; j++) pon(L, i, j, j === tl ? LOMA[1] : (j - tl) > 6 && bayer(i, j) < 0.4 ? LOMA[2] : LOMA[0]);
  }
  // El bosque de atrás: copitas redondas y pinos, en dos filas.
  for (let fila = 0; fila < 2; fila++) for (let k = 0; k < 90; k++) {
    const x = (k / 90) * MAPA.w + hash(k, fila, 71) * 26, base = (fila ? 452 : 424) - y0, pino = hash(k, fila, 72) < 0.35;
    const r = (fila ? 18 : 13) + hash(k, fila, 73) * 8, cx = x / S, cy = (base - r * 1.6) / S, rr = r / S;
    const col = fila ? BOSQ : [BOSQ[3], BOSQ[0], BOSQ[1], BOSQ[3]];
    if (pino) { for (let j = 0; j < rr * 3.2; j++) { const half = (j / (rr * 3.2)) * rr * 1.1; for (let i = Math.floor(cx - half); i <= cx + half; i++) pon(L, i, Math.floor(cy - rr * 1.6 + j), i < cx - half * 0.3 ? col[1] : col[0]); } }
    else for (let j = Math.floor(cy - rr); j <= cy + rr * 1.6; j++) for (let i = Math.floor(cx - rr); i <= cx + rr; i++) { const d = (i - cx) ** 2 + (j - cy) ** 2; if (d < rr * rr || (j > cy && Math.abs(i - cx) < rr * 0.9)) pon(L, i, j, d < rr * rr * 0.4 && i < cx && j < cy ? col[2] : j > cy + rr * 0.6 ? col[3] : col[1]); }
  }
  // La cerca blanca (sólo donde no está la casa), con sus postes picudos y su sombrita.
  const blanco = hora === "noche" ? P("#8b8fb8", "#6a6e98", "#4b4f78") : P("#ffffff", "#e7dbe4", "#c9b8c6");
  const fy0 = Math.floor((392 - y0) / S), fy1 = Math.floor((446 - y0) / S);
  for (let i = 0; i < W; i++) {
    const x = i * S;
    if (x > FACHADA.x0 - 14 && x < FACHADA.x1 + 14) continue;
    const pi = i % 8;
    for (let j = fy0; j <= fy1; j++) {
      const poste = pi >= 1 && pi <= 5, punta = j - fy0 < 3 && Math.abs(pi - 3) > j - fy0, riel = j === fy0 + 5 || j === fy0 + 11;
      if (poste && !punta) pon(L, i, j, pi === 5 ? blanco[1] : blanco[0]);
      else if (riel) pon(L, i, j, blanco[1]);
      if (poste && j === fy1) pon(L, i, j, blanco[2]);
    }
  }
  L.ctx.putImageData(L.img, 0, 0);
  return { arriba: CIELO[0] };
}

/** La fachada de la casa: techo de tejitas, paredes de tablitas, ventanas con jardinera, faroles y el marco de la puerta. */
export function pintarFachada(cv, hora = "dia") {
  const S = MAPA.px, x0 = FACHADA.x0 - 24, x1 = FACHADA.x1 + 24, y0 = FACHADA.techo - 8, y1 = FACHADA.base + 18;
  const W = Math.ceil((x1 - x0) / S), H = Math.ceil((y1 - y0) / S), L = lienzo(cv, W, H);
  const noche = hora === "noche", tarde = hora === "tarde";
  const TEJA = P("#e25f7f", "#ef7f98", "#f59db1", "#b9425f", "#7a2b45"), PARED = P("#ffd9e4", "#f6c4d3", "#fff3f7", "#e7aec1");
  const MARCO = P("#ffffff", "#eedce5", "#c7aebb"), VIDRIO = noche ? P("#ffd27a", "#ffe9a8", "#f7b85a") : tarde ? P("#ffc7a8", "#ffe2cf", "#f0a58f") : P("#9fd6ff", "#d8f1ff", "#78bdf0");
  const BASE = P("#cbbcc9", "#b5a5b4", "#ddd1db"), CONTORNO = hex("#6b3550"), MENTA = P("#9ad8c0", "#7cc3a9"), JARD = P("#b47a4b", "#8f5c38");
  const X = (x) => Math.floor((x - x0) / S), Y = (y) => Math.floor((y - y0) / S);
  const rect = (xa, ya, xb, yb, c) => { for (let j = Y(ya); j < Y(yb); j++) for (let i = X(xa); i < X(xb); i++) pon(L, i, j, typeof c === "function" ? c(i, j) : c); };
  // Paredes (tablitas horizontales con su rayita) y las esquinas blancas.
  rect(FACHADA.x0, FACHADA.pared, FACHADA.x1, FACHADA.base - 18, (i, j) => (j % 5 === 0 ? PARED[3] : j % 5 === 1 ? PARED[2] : PARED[bayer(i, j) < 0.12 ? 1 : 0]));
  rect(FACHADA.x0, FACHADA.pared, FACHADA.x0 + 15, FACHADA.base - 18, MARCO[0]); rect(FACHADA.x1 - 15, FACHADA.pared, FACHADA.x1, FACHADA.base - 18, MARCO[1]);
  rect(FACHADA.x0, FACHADA.base - 18, FACHADA.x1, FACHADA.base, (i, j) => (j === Y(FACHADA.base - 18) ? BASE[2] : (i + (j % 2) * 3) % 6 === 0 ? BASE[1] : BASE[0]));
  // El techo: tejitas en escamas, con su alero y el frontón en medio (con su ventanita redonda).
  const cx = (FACHADA.x0 + FACHADA.x1) / 2;
  for (let j = Y(FACHADA.techo + 70); j < Y(FACHADA.pared + 6); j++) {
    const y = y0 + j * S, f = (y - (FACHADA.techo + 70)) / (FACHADA.pared + 6 - FACHADA.techo - 70), ext = 4 + f * 20;
    for (let i = X(FACHADA.x0 - ext); i < X(FACHADA.x1 + ext); i++) { const fila = Math.floor(j / 3), ii = (i + (fila % 2) * 2) % 4; pon(L, i, j, j % 3 === 2 ? TEJA[3] : ii === 0 ? TEJA[0] : j % 3 === 0 ? TEJA[2] : TEJA[1]); }
  }
  for (let j = Y(FACHADA.techo); j < Y(FACHADA.techo + 92); j++) {
    const y = y0 + j * S, half = ((y - FACHADA.techo) / 92) * 210;
    for (let i = X(cx - half); i < X(cx + half); i++) pon(L, i, j, Math.abs(i - X(cx)) > (half / S) - 2 ? TEJA[4] : j % 3 === 2 ? TEJA[3] : TEJA[1]);
  }
  for (let j = Y(FACHADA.techo + 18); j < Y(FACHADA.techo + 92); j++) { const y = y0 + j * S, half = ((y - FACHADA.techo - 18) / 74) * 150; for (let i = X(cx - half); i < X(cx + half); i++) pon(L, i, j, j % 5 === 0 ? PARED[3] : PARED[0]); }
  const vr = 22 / S, vcx = X(cx), vcy = Y(FACHADA.techo + 66);
  for (let j = vcy - 9; j <= vcy + 9; j++) for (let i = vcx - 9; i <= vcx + 9; i++) { const d = Math.hypot(i - vcx, j - vcy); if (d < vr + 2) pon(L, i, j, d > vr ? MARCO[0] : (i === vcx || j === vcy) ? MARCO[1] : (i - vcx) < -(j - vcy) ? VIDRIO[1] : VIDRIO[0]); }
  // La chimenea de ladrillo.
  rect(1440, FACHADA.techo + 40, 1488, FACHADA.techo + 110, (i, j) => ((j % 3 === 0) || ((i + (Math.floor(j / 3) % 2) * 2) % 5 === 0) ? hex("#a85a5a") : hex("#d27a72")));
  rect(1434, FACHADA.techo + 34, 1494, FACHADA.techo + 44, hex("#8c4a4a"));
  // Las ventanas (dos de cada lado), con postigos menta y su jardinera de flores.
  for (const vx of [928, 1056, 1344, 1472]) {
    const a = vx - 36, b = vx + 36, t = 262, u = 352;
    rect(a - 14, t, a, u, (i, j) => (j % 3 === 0 ? MENTA[1] : MENTA[0])); rect(b, t, b + 14, u, (i, j) => (j % 3 === 0 ? MENTA[1] : MENTA[0]));
    rect(a, t, b, u, MARCO[0]);
    rect(a + 6, t + 6, b - 6, u - 6, (i, j) => { const d = (i - X(a)) - (j - Y(t)); return d > 2 && d < 6 ? VIDRIO[1] : (Math.abs(i - X(vx)) < 1 || j === Y((t + u) / 2)) ? MARCO[1] : j > Y(u - 14) ? VIDRIO[2] : VIDRIO[0]; });
    rect(a - 6, u, b + 6, u + 20, (i, j) => (j === Y(u) ? JARD[1] : JARD[0]));
    for (let k = 0; k < 9; k++) { const fi = X(a - 2) + k * 3 + (k % 2), fj = Y(u) - 1 - (k % 3 === 0 ? 1 : 0); pon(L, fi, fj, PAL.flores[(k + vx) % 5]); pon(L, fi + 1, fj + 1, hex("#5fb36a")); pon(L, fi - 1, fj + 1, hex("#5fb36a")); }
  }
  // El marco de la puerta, su toldito de olanes, el numerito y los faroles de los lados.
  const px0 = FACHADA.puerta - 60, px1 = FACHADA.puerta + 60;
  rect(px0, 246, px1, FACHADA.base, MARCO[0]); rect(px0 + 6, 252, px1 - 6, FACHADA.base, hex("#7b4d5f"));
  for (let j = Y(222); j < Y(248); j++) for (let i = X(px0 - 16); i < X(px1 + 16); i++) { const ii = (i - X(px0 - 16)) % 5; if (j > Y(240) && ii > 2) continue; pon(L, i, j, Math.floor((i - X(px0 - 16)) / 5) % 2 ? hex("#ffffff") : TEJA[2]); }
  for (const lx of [px0 - 26, px1 + 12]) {
    rect(lx, 300, lx + 14, 304, hex("#3d2f3a")); rect(lx + 2, 304, lx + 12, 330, noche || tarde ? hex("#ffd36e") : hex("#f6e7b0")); rect(lx, 330, lx + 14, 336, hex("#3d2f3a"));
    if (noche) for (let j = Y(290); j < Y(346); j++) for (let i = X(lx - 16); i < X(lx + 30); i++) { const d = Math.hypot(i - X(lx + 7), (j - Y(318)) * 0.9); if (d < 6 && d > 3 && bayer(i, j) < 0.35) pon(L, i, j, hex("#ffe7a8")); }
  }
  // Matas de hortensias al pie de la casa (a los lados del porche).
  for (let k = 0; k < 10; k++) {
    const bx = k < 5 ? 870 + k * 50 : 1330 + (k - 5) * 50, by = FACHADA.base - 6, r = 20 + (k % 3) * 3, azul = k % 2;
    const C = azul ? P("#8fb8f0", "#b5d1fa", "#6d93d2") : P("#ff9fc0", "#ffc7da", "#e27aa0");
    for (let j = Y(by - r * 1.2); j < Y(by + 6); j++) for (let i = X(bx - r); i < X(bx + r); i++) {
      const d = Math.hypot((i - X(bx)) * S, (j - Y(by - r * 0.4)) * S * 1.2);
      if (d < r) { const h = hash(i, j, 81); pon(L, i, j, h < 0.25 ? hex("#4f9a5a") : d < r * 0.5 && (i - X(bx)) < 0 ? C[1] : h > 0.9 ? C[2] : C[0]); }
    }
  }
  // Contorno oscurito de la silueta (pixel art: una rayita alrededor de todo).
  const a = new Uint8Array(W * H);
  for (let q = 0; q < W * H; q++) a[q] = L.d[q * 4 + 3] > 0 ? 1 : 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (a[j * W + i]) continue;
    if ((i > 0 && a[j * W + i - 1]) || (i < W - 1 && a[j * W + i + 1]) || (j > 0 && a[(j - 1) * W + i])) pon(L, i, j, CONTORNO);
  }
  L.ctx.putImageData(L.img, 0, 0);
  return { left: x0, top: y0, width: W * S, height: H * S };
}

/* ═════════════ Los dibujos del escenario (pixel, con su contorno y su luz de arriba a la izquierda) ═════════════ */
const SPRITES = new Map();
function silueta(L, mask, W, H, C, contorno) {
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (mask[j * W + i]) continue;
    if ((i > 0 && mask[j * W + i - 1]) || (i < W - 1 && mask[j * W + i + 1]) || (j > 0 && mask[(j - 1) * W + i]) || (j < H - 1 && mask[(j + 1) * W + i])) pon(L, i, j, contorno);
  }
}
/** Una copa de árbol hecha de bolitas, sombreada por pixel (luz de arriba a la izquierda), con su textura de hojitas. */
function copa(L, W, H, bolas, pal, semilla, extra) {
  const mask = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let mejor = -9;
    for (const [bx, by, r] of bolas) {
      const dx = (i - bx) / r, dy = (j - by) / r, d = dx * dx + dy * dy;
      if (d < 1) { const luz = (dx * -0.62 + dy * -0.78) * 0.9 + (1 - d) * 0.35; if (luz > mejor) mejor = luz; }
    }
    if (mejor === -9) continue;
    mask[j * W + i] = 1;
    const h = hash(i >> 1, j >> 1, semilla), v = mejor + (h - 0.5) * 0.5 + (bayer(i, j) - 0.5) * 0.25;
    let q = v < -0.35 ? 0 : v < 0.05 ? 1 : v < 0.45 ? 2 : 3;
    let c = pal[q];
    if (extra) c = extra(i, j, q) || c;
    pon(L, i, j, c);
  }
  return mask;
}
function tronco(L, W, H, cx, top, base, ancho, pal, blanco = false) {
  const mask = new Uint8Array(W * H);
  for (let j = top; j < base; j++) {
    const f = (j - top) / Math.max(1, base - top), a = ancho * (0.8 + f * 0.25) + (j > base - 3 ? 2 : 0);
    for (let i = Math.floor(cx - a / 2); i < cx + a / 2; i++) {
      const u = (i - (cx - a / 2)) / a;
      let c = u < 0.3 ? pal[2] : u > 0.72 ? pal[0] : pal[1];
      if (blanco && hash(i, j >> 1, 5) < 0.12) c = hex("#3d3540");
      else if (!blanco && hash(i, j, 3) < 0.1) c = pal[0];
      pon(L, i, j, c); mask[j * W + i] = 1;
    }
  }
  return mask;
}
/** El dibujo de una cosa del escenario: { tronco, copa } como url de imagen (los árboles se mecen sólo de la copa). */
export function spriteEsc(k, v = 0) {
  const clave = k + v;
  if (SPRITES.has(clave)) return SPRITES.get(clave);
  const m = MEDIDAS[k], S = MAPA.px, W = Math.ceil(m.w / S), H = Math.ceil(m.h / S), out = {};
  const hacer = (fn) => { const cv = document.createElement("canvas"), L = lienzo(cv, W, H); fn(L); L.ctx.putImageData(L.img, 0, 0); return cv.toDataURL(); };
  const CORTEZA = P("#5e3b27", "#8a5a3c", "#a8714b"), OUT = hex("#2a3b2e");
  const cx = W / 2;
  if (ES_ARBOL.has(k)) {
    const PALS = {
      roble: P("#3f8a4a", "#58a85a", "#72c26a", "#93d983"), cerezo: P("#e07aa0", "#f59dbb", "#ffc2d6", "#ffe1ea"),
      frutal: P("#3f8a4a", "#55a659", "#6fc068", "#8fd77f"), abedul: P("#7aa84a", "#99c25a", "#b8d86e", "#d7ec8f"),
      sauce: P("#5c9a4c", "#79b45c", "#97cc6c", "#b6e08a"), pino: P("#24583c", "#2f6d48", "#3f8656", "#56a067"),
    };
    const pal = PALS[k], base = H - 1, sem = 90 + v;
    out.tronco = hacer((L) => {
      const top = k === "pino" ? Math.floor(H * 0.55) : Math.floor(H * 0.42), ancho = { pino: 7, abedul: 6, roble: 12, sauce: 11, cerezo: 9, frutal: 8 }[k] || 8;
      const mk = tronco(L, W, H, cx, top, base, ancho, k === "abedul" ? P("#cfc6c0", "#ece6e1", "#ffffff") : CORTEZA, k === "abedul");
      // Raíces que se abren en la base.
      for (const s of [-1, 1]) for (let q = 0; q < 4; q++) { pon(L, Math.floor(cx + s * (ancho / 2 + q)), base, CORTEZA[0]); mk[(base) * W + Math.floor(cx + s * (ancho / 2 + q))] = 1; }
      if (k !== "pino" && k !== "abedul") for (const [dx, dy] of [[-1, -0.7], [1, -0.55]]) for (let q = 0; q < 9; q++) { const i = Math.floor(cx + dx * (3 + q)), j = Math.floor(top + 8 + dy * q * 1.6); pon(L, i, j, CORTEZA[1]); pon(L, i, j + 1, CORTEZA[0]); mk[j * W + i] = 1; mk[(j + 1) * W + i] = 1; }
      silueta(L, mk, W, H, null, hex("#3a2418"));
    });
    out.copa = hacer((L) => {
      let mk;
      if (k === "pino") {
        // (Fase 65) El pino: punta en pico y cinco pisos de ramas que se abren hacia abajo, cada uno con su orilla de
        // agujitas (dientes) y la sombrita que le hace el de arriba.
        mk = new Uint8Array(W * H);
        for (let piso = 0; piso < 5; piso++) {
          const t = Math.floor(H * (0.005 + piso * 0.118)), b = Math.floor(H * (0.17 + piso * 0.128)), half0 = piso === 0 ? 0.6 : W * (0.06 + piso * 0.035), half1 = W * (0.15 + piso * 0.072);
          for (let j = t; j < b; j++) {
            const f = (j - t) / (b - t), half = half0 + (half1 - half0) * Math.pow(f, 0.85) + (hash(j, piso, sem) - 0.5) * 1.6;
            for (let i = Math.floor(cx - half); i < cx + half; i++) {
              // Abajo de cada piso, dientes de agujitas (no una orilla recta).
              if (j > b - 4 && hash(i >> 1, piso * 7 + (b - j), sem) < 0.3 + (j - (b - 4)) * 0.18) continue;
              const u = (i - (cx - half)) / (2 * half);
              let q = u < 0.3 ? 3 : u < 0.55 ? 2 : u < 0.8 ? 1 : 0;
              if (f < 0.16 && piso > 0) q = Math.max(0, q - 2);
              pon(L, i, j, hash(i, j, sem) < 0.14 ? pal[Math.max(0, q - 1)] : pal[q]); mk[j * W + i] = 1;
            }
          }
        }
      } else {
        const r = W * 0.27, top = H * 0.1, cy = k === "sauce" ? H * 0.32 : H * 0.3;
        const bolas = [[cx, cy, r * 1.15], [cx - r * 0.95, cy + r * 0.42, r * 0.85], [cx + r * 0.95, cy + r * 0.45, r * 0.85], [cx - r * 0.3, top + r * 0.6, r * 0.8], [cx + r * 0.45, cy + r * 0.75, r * 0.8], [cx - r * 0.55, cy + r * 0.85, r * 0.7]];
        const frutas = k === "frutal" ? (v ? P("#ff9a3c", "#ffd08a") : P("#ff4f5e", "#ffb0b6")) : null;
        mk = copa(L, W, H, bolas, pal, sem, (i, j, q) => {
          if (frutas && hash(i >> 1, j >> 1, sem + 7) < 0.035 && (i & 1) === 0) return (j & 1) ? frutas[0] : frutas[1];
          if (k === "cerezo" && hash(i, j, sem + 3) < 0.04) return hex("#ffffff");
          if (k === "roble" && hash(i, j, sem + 4) < 0.012) return hex("#ff8fb0");
          return null;
        });
        // El sauce: ramitas que cuelgan.
        if (k === "sauce") for (let s = 0; s < 22; s++) { const i0 = Math.floor(cx - r * 1.6 + s * (r * 3.2 / 22)), l = Math.floor(H * (0.25 + hash(s, 1, sem) * 0.32)); for (let j = Math.floor(cy + r * 0.4); j < cy + r * 0.4 + l && j < H - 4; j++) { const i = i0 + (j % 7 === 0 ? 1 : 0); pon(L, i, j, j % 4 ? pal[2] : pal[3]); mk[j * W + i] = 1; } }
      }
      silueta(L, mk, W, H, null, OUT);
    });
    SPRITES.set(clave, out);
    return out;
  }
  out.copa = "";
  out.tronco = hacer((L) => {
    const mk = new Uint8Array(W * H);
    const bolita = (bx, by, r, pal, fl) => { for (let j = Math.floor(by - r); j <= by + r; j++) for (let i = Math.floor(bx - r); i <= bx + r; i++) { const dx = (i - bx) / r, dy = (j - by) / r, d = dx * dx + dy * dy; if (d >= 1 || j >= H) continue; const luz = (dx * -0.6 + dy * -0.8) + (bayer(i, j) - 0.5) * 0.4; let c = pal[luz < -0.3 ? 0 : luz < 0.3 ? 1 : 2]; if (fl && hash(i, j, 5 + v) < 0.07) c = fl[(i + j) % fl.length]; pon(L, i, j, c); mk[j * W + i] = 1; } };
    if (k === "arbusto") { const pal = P("#3f8a4a", "#5aa95c", "#7ec776"), fl = v % 2 ? P("#ffffff", "#ffe27a") : P("#ff9fc0", "#ffffff"); bolita(cx - W * 0.22, H * 0.62, W * 0.26, pal, fl); bolita(cx + W * 0.22, H * 0.62, W * 0.26, pal, fl); bolita(cx, H * 0.45, W * 0.3, pal, fl); }
    else if (k === "roca") { const pal = P("#8c8088", "#aaa0a6", "#cfc7cb"); bolita(cx - W * 0.12, H * 0.62, W * 0.3, pal); bolita(cx + W * 0.18, H * 0.7, W * 0.22, pal); for (let i = 0; i < W; i++) for (let j = 0; j < H * 0.5; j++) if (mk[j * W + i] && hash(i, j, 9) < 0.18 && j < H * 0.45) pon(L, i, j, hex("#7cb86a")); }
    else if (k === "fuente") {
      // El tazón de piedra, el agüita y la columnita con su platito arriba.
      const pal = P("#a99fb6", "#cfc7da", "#ece6f2"), agua = P("#5fb0e3", "#9fd8f6", "#e8f8ff");
      for (let j = Math.floor(H * 0.55); j < H; j++) for (let i = 0; i < W; i++) { const dx = (i - cx) / (W * 0.48), dy = (j - H * 0.75) / (H * 0.24); if (dx * dx + dy * dy < 1) { const borde = dx * dx + dy * dy > 0.62; pon(L, i, j, borde ? (dy < 0 ? pal[2] : pal[0]) : agua[hash(i >> 1, j, 3) < 0.15 ? 1 : 0]); mk[j * W + i] = 1; } }
      for (let j = Math.floor(H * 0.2); j < H * 0.7; j++) for (let i = Math.floor(cx - 4); i < cx + 4; i++) { pon(L, i, j, i < cx - 1 ? pal[2] : pal[1]); mk[j * W + i] = 1; }
      for (let j = Math.floor(H * 0.16); j < H * 0.26; j++) for (let i = Math.floor(cx - W * 0.2); i < cx + W * 0.2; i++) { const dy = (j - H * 0.21) / (H * 0.05), dx = (i - cx) / (W * 0.2); if (dx * dx + dy * dy < 1) { pon(L, i, j, dy < 0 ? agua[1] : pal[1]); mk[j * W + i] = 1; } }
    } else if (k === "letrero") {
      const madera = P("#8a5a3c", "#b47a4b", "#d49b68");
      for (let j = Math.floor(H * 0.2); j < H; j++) for (let i = Math.floor(cx - 2); i < cx + 2; i++) { pon(L, i, j, i < cx ? madera[1] : madera[0]); mk[j * W + i] = 1; }
      const tablas = [[0.12, 1, "#ff9fc0"], [0.3, -1, "#9fd6ff"], [0.48, 1, "#ffe27a"]];
      for (const [f, dir, col] of tablas) {
        const j0 = Math.floor(H * f), j1 = j0 + 7, a = dir > 0 ? cx - 3 : 2, b = dir > 0 ? W - 3 : cx + 3;
        for (let j = j0; j < j1; j++) for (let i = Math.floor(a); i < b; i++) { const punta = dir > 0 ? i > b - 4 && Math.abs(j - (j0 + 3)) > b - 1 - i : i < a + 3 && Math.abs(j - (j0 + 3)) > i - a; if (punta) continue; pon(L, i, j, j === j0 ? madera[2] : j === j1 - 1 ? madera[0] : madera[1]); mk[j * W + i] = 1; }
        for (let q = 0; q < 3; q++) pon(L, Math.floor((a + b) / 2) - 1 + q, j0 + 3, hex(col));
        pon(L, Math.floor((a + b) / 2), j0 + 2, hex(col)); pon(L, Math.floor((a + b) / 2), j0 + 4, hex(col));
      }
    }
    silueta(L, mk, W, H, null, hex("#3a2c38"));
  });
  SPRITES.set(clave, out);
  return out;
}


/** Lo que había la primera vez en el jardín de 700 (Fase 63), y a dónde se va en el patio grande. */
export const MUDANZA = { ja0: [790, 800], ja1: [970, 650], ja2: [1050, 540], ja3: [1350, 540], ja4: [1300, 690], ja5: [1110, 700], ja7: [1480, 660], ja8: [1530, 600] };
