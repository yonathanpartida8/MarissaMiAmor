import { FONDO_3D, FRENTE_3D, PARED_3D, PISO as PISO_M, H as H_M } from "./cuartos.js";
/**
 * TEXTURAS EN PIXEL ART (Fase 57): los tapices de las paredes, los pisos, la lluvia y los charquitos, y lo de
 * enfrente de afuera (la cerca, la fachada de la casa, el caminito y el barandal de la terraza), dibujados
 * cuadrito por cuadrito en lienzos chiquitos y agrandados sin suavizar (un cuadrito = 3 del mundo, igual que
 * el fondo). Las texturas se hacen una vez y se guardan; lo de enfrente se redibuja sólo si cambia la hora.
 */
const PX = 3;
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mez = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const cla = (c, t) => mez(c, [255, 255, 255], t), osc = (c, k) => c.map((v, i) => Math.round(v * k * (i === 2 ? 1.02 : 1)));
const cache = new Map();

/** Un lienzo chiquito con su función para poner cuadritos (con transparencia opcional). */
function lienzo(w, h, cv = document.createElement("canvas")) {
  cv.width = w; cv.height = h;
  const c = cv.getContext("2d"), img = c.createImageData(w, h), d = img.data;
  const pon = (x, y, k, a = 255) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4; d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = a; };
  const caja = (x, y, ww, hh, k, a) => { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) pon(x + i, y + j, k, a); };
  const listo = () => { c.putImageData(img, 0, 0); return cv; };
  return { cv, pon, caja, listo };
}
const comoUrl = (k, w, h, dibujar) => {
  if (cache.has(k)) return cache.get(k);
  const L = lienzo(w, h); dibujar(L);
  const cv = L.listo();
  const r = { url: `url("${cv.toDataURL("image/png")}")`, w: w * PX, h: h * PX, cv, tw: w, th: h };
  cache.set(k, r);
  return r;
};
const css = (t) => ({ backgroundImage: t.url, backgroundSize: `${t.w}px ${t.h}px`, backgroundRepeat: "repeat" });

/* ── Los tapices (16 × 16) ── */
const FIG = {
  corazon: [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."],
  estrella: ["..X..", ".XXX.", "XXXXX", ".X.X."],
  chica: [".X.", "XXX", ".X."],
};
const figura = (pon, f, x, y, k) => f.forEach((fila, j) => [...fila].forEach((ch, i) => { if (ch === "X") pon(x + i, y + j, k); }));
export function texPared(color, patron) {
  return css(comoUrl(`p|${color}|${patron}`, 16, 16, ({ pon, caja }) => {
    const B = rgb(color), L = cla(B, 0.5), D = osc(B, 0.95), D2 = osc(B, 0.9);
    caja(0, 0, 16, 16, B);
    // Un tramado finito para que no se vea plano.
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x * 3 + y * 5) % 11 === 0) pon(x, y, D);
    if (patron === "rayas") for (let y = 0; y < 16; y++) { for (let x = 0; x < 3; x++) { pon(x, y, L); pon(x + 8, y, L); } pon(3, y, D2); pon(11, y, D2); }
    if (patron === "puntos") { caja(3, 3, 2, 2, L); caja(11, 11, 2, 2, L); pon(4, 4, cla(B, 0.75)); pon(12, 12, cla(B, 0.75)); }
    if (patron === "corazones") { figura(pon, FIG.corazon, 2, 2, L); figura(pon, FIG.chica, 11, 11, cla(B, 0.35)); }
    if (patron === "estrellas") { figura(pon, FIG.estrella, 2, 3, L); pon(12, 11, L); pon(11, 12, L); pon(12, 12, L); pon(13, 12, L); pon(12, 13, L); }
    if (patron === "ladrillo") {
      for (let x = 0; x < 16; x++) { pon(x, 0, L); pon(x, 8, L); pon(x, 7, D2); pon(x, 15, D2); }
      for (let y = 1; y < 8; y++) { pon(0, y, L); pon(15, y, D2); } for (let y = 9; y < 16; y++) { pon(8, y, L); pon(7, y, D2); }
    }
    if (patron === "azulejo") { for (let i = 0; i < 16; i++) { pon(i, 0, L); pon(0, i, L); pon(i, 8, L); pon(8, i, L); } for (const [x, y] of [[4, 4], [12, 4], [4, 12], [12, 12]]) { pon(x, y, cla(B, 0.7)); pon(x + 1, y, L); pon(x, y + 1, L); } }
    if (patron === "cuadros") { caja(0, 0, 8, 8, L); caja(8, 8, 8, 8, L); }
  }));
}

/* ── Los pisos ── */
const PISOS = {
  madera: ["#e6bf96", "#dcb288", "#b98a62", "#efcfaa"], clara: ["#f6dfc2", "#ecd2b2", "#d4b48f", "#fbead3"],
  duela: ["#d9a878", "#cf9c6b", "#9a6a46", "#e6b98b"],
};
export function texPiso(tipo) {
  if (PISOS[tipo]) return css(comoUrl(`f|${tipo}`, 40, 12, ({ pon, caja }) => {
    const [a, b, s, g] = PISOS[tipo].map(rgb);
    for (let fila = 0; fila < 3; fila++) {
      const y = fila * 4, k = fila % 2 ? b : a, junta = [6, 26, 16][fila];
      caja(0, y, 40, 4, k);
      for (let x = 0; x < 40; x++) pon(x, y + 3, s);
      for (let j = 0; j < 3; j++) { pon(junta, y + j, s); pon((junta + 1) % 40, y + j, cla(k, 0.2)); }
      for (let i = 0; i < 5; i++) pon((junta + 5 + i * 7 + fila * 3) % 40, y + 1 + (i % 2), g);   // vetas
      if (tipo === "duela") for (let x = 0; x < 40; x++) if (x % 10 === 3) pon(x, y + 1, osc(k, 0.86));
    }
  }));
  if (tipo === "mosaico") return css(comoUrl("f|mosaico", 16, 16, ({ pon, caja }) => {
    const A = rgb("#ffffff"), B = rgb("#dcefff"), G = rgb("#c4dcef");
    caja(0, 0, 8, 8, A); caja(8, 8, 8, 8, A); caja(8, 0, 8, 8, B); caja(0, 8, 8, 8, B);
    for (let i = 0; i < 16; i++) { pon(i, 7, G); pon(i, 15, G); pon(7, i, G); pon(15, i, G); }
    pon(3, 3, B); pon(11, 11, B); pon(11, 3, cla(B, 0.5)); pon(3, 11, cla(B, 0.5));
  }));
  if (tipo === "alfombra") return css(comoUrl("f|alfombra", 12, 12, ({ pon, caja }) => {
    const A = rgb("#f6c6d8"); caja(0, 0, 12, 12, A);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if ((x + y) % 2 === 0) pon(x, y, osc(A, 0.97));
    for (const [x, y] of [[2, 2], [8, 8]]) { pon(x, y, [255, 255, 255]); pon(x + 1, y, cla(A, 0.6)); }
  }));
  if (tipo === "barro") return css(comoUrl("f|barro", 16, 10, ({ pon, caja }) => {
    const A = rgb("#f0b49b"), G = rgb("#ffe3d4"); caja(0, 0, 16, 10, A);
    for (let x = 0; x < 16; x++) { pon(x, 0, G); pon(x, 9, osc(A, 0.88)); } for (let y = 0; y < 10; y++) { pon(0, y, G); pon(15, y, osc(A, 0.9)); }
    pon(5, 4, cla(A, 0.25)); pon(10, 6, osc(A, 0.94)); pon(6, 4, cla(A, 0.25));
  }));
  // Pasto (también lo de afuera): matitas claras y oscuras, que se repiten sin que se note.
  return css(comoUrl("f|pasto", 24, 16, ({ pon, caja }) => {
    const A = rgb("#8fd59e"), D = rgb("#6fbf84"), L = rgb("#b5e8bd");
    caja(0, 0, 24, 16, A);
    for (const [x, y] of [[2, 3], [9, 1], [15, 6], [20, 2], [5, 11], [12, 13], [18, 10], [22, 14]]) { pon(x, y, D); pon(x + 1, y - 1, D); pon(x + 2, y, D); pon(x + 1, y, L); }
    for (const [x, y] of [[7, 7], [14, 3], [1, 14], [19, 8]]) { pon(x, y, [255, 214, 232]); pon(x, y + 1, D); }   // florecitas
  }));
}

/* ── La lluvia: gotitas de 1 × 3, chuecas según el viento ── */
export function texLluvia(clima) {
  const n = { lluvia: 7, tormenta: 12, extra: 18 }[clima] || 7, inc = clima === "extra" ? 2 : 1;
  return comoUrl(`ll|${clima}`, 24, 24, ({ pon }) => {
    const K = [214, 230, 255];
    for (let i = 0; i < n; i++) {
      const x = (i * 7 + (i % 3) * 5) % 24, y = (i * 11 + (i % 4) * 3) % 24;
      for (let j = 0; j < 3 + (clima === "extra" ? 1 : 0); j++) pon((x - Math.floor(j / (3 - inc + 1)) + 24) % 24, (y + j) % 24, K, j === 0 ? 120 : 210);
    }
  });
}

/* ── Charquitos (del ancho del cuarto): dónde están (en el mundo) y su dibujo ── */
/** [x (fracción del cuarto), y (mundo), radio x, radio y]: los usa la lluvia (ondas) y para brincar en ellos. */
export const CHARCOS = [[0.2, 506, 39, 7], [0.62, 492, 51, 8], [0.86, 518, 30, 6], [0.4, 572, 45, 8], [0.75, 598, 33, 7], [0.28, 650, 42, 8], [0.66, 682, 36, 7]];
export const CHARCOS_ARRIBA = 470, CHARCOS_ALTO = 240;
export function texCharcos(ancho) {
  return comoUrl(`ch2|${ancho}`, Math.ceil(ancho / PX), CHARCOS_ALTO / PX, ({ pon }) => {
    const W = Math.ceil(ancho / PX), A = [150, 200, 255], L = [220, 240, 255], O = [110, 160, 220];
    for (const [fx, wy, wrx, wry] of CHARCOS) {
      const cx = fx * W, fy = (wy - CHARCOS_ARRIBA) / PX, rx = Math.round(wrx / PX), ry = wry / PX;
      for (let y = -Math.ceil(ry); y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d <= 1) pon(cx + x, fy + y, d > 0.7 ? O : A, d > 0.7 ? 170 : 140); }
      for (let x = -rx + 3; x < -rx + 7; x++) pon(cx + x, fy - 1, L, 220);
      pon(cx + rx - 4, fy + 1, L, 200);
    }
  });
}

/* ── Lo de enfrente de afuera: un lienzo del cuarto, desde y = ARRIBA hasta el piso ── */
export const FRENTE_ARRIBA = 120, FRENTE_ABAJO = 564;
export function pintarFrente(cv, { tipo, ancho, hora = "dia" }) {
  const W = Math.ceil(ancho / PX), H = Math.ceil((FRENTE_ABAJO - FRENTE_ARRIBA) / PX);
  const { pon, caja, listo } = lienzo(W, H, cv);
  const Y = (y) => Math.round((y - FRENTE_ARRIBA) / PX), X = (x) => Math.round(x / PX);
  const noche = hora === "noche";
  if (tipo === "terraza") {
    // El barandal: pasamanos, barrotes y zoclo.
    const C = rgb("#fff7ef"), S = rgb("#e5cdb8"), O = rgb("#b99a86");
    const y0 = Y(370);
    caja(0, y0, W, 3, C); for (let x = 0; x < W; x++) { pon(x, y0 - 1, O); pon(x, y0 + 3, S); pon(x, y0 + 4, O); }
    for (let x = 4; x < W; x += 16) { caja(x, y0 + 5, 3, 19, C); for (let y = y0 + 5; y < y0 + 24; y++) { pon(x - 1, y, O); pon(x + 2, y, S); pon(x + 3, y, O); } }
    caja(0, y0 + 24, W, 2, C); for (let x = 0; x < W; x++) pon(x, y0 + 26, O);
    return listo();
  }
  // La cerca de madera blanca (con su sombrita).
  const B = rgb("#ffffff"), S = rgb("#ead6df"), O = rgb("#b99aab");
  const cy = Y(376), alto = 24;
  for (const ry of [cy + 10, cy + 18]) { caja(0, ry, W, 3, B); for (let x = 0; x < W; x++) { pon(x, ry - 1, O); pon(x, ry + 2, S); pon(x, ry + 3, O); } }
  for (let x = 2; x < W; x += 15) {
    for (let y = cy + 2; y < cy + alto; y++) { caja(x, y, 7, 1, B); pon(x - 1, y, O); pon(x + 6, y, S); pon(x + 7, y, O); }
    for (let i = 0; i < 3; i++) { caja(x + i, cy + 2 - i, 7 - i * 2, 1, B); pon(x + i - 1, cy + 2 - i, O); pon(x + 7 - i, cy + 2 - i, O); }
    pon(x + 3, cy - 1, O);
  }
  // El caminito de piedras.
  const P = rgb("#f3e3d3"), PS = rgb("#d9c2ad");
  for (const [x, y, rx, ry] of [[ancho - 70, 478, 7, 2.6], [ancho - 108, 502, 8, 3], [ancho - 150, 532, 9, 3.2]]) {
    const cx = X(x), c2 = Y(y);
    for (let j = -Math.ceil(ry); j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i / rx) ** 2 + (j / ry) ** 2 <= 1) pon(cx + i, c2 + j, j > ry - 1.5 ? PS : P);
  }
  // La fachada de la casa (a la derecha): techo, tablitas, ventanas (prendidas de noche) y su sombra.
  const fx0 = X(ancho - 150), ft = Y(196), fb = Y(472), RO = rgb("#ff86b0"), RO2 = rgb("#f06c9b"), T1 = rgb("#ffd6e2"), T2 = rgb("#ffcbdb"), BO = rgb("#c9849f");
  for (let y = ft; y < fb; y++) for (let x = fx0; x < W; x++) pon(x, y, (y - ft) % 8 === 7 ? T2 : T1);
  for (let y = ft; y < fb; y++) { pon(fx0, y, BO); pon(fx0 + 1, y, [255, 240, 246]); }
  for (let i = 0; i < W - fx0 + 10; i++) { const y = ft - Math.round(i * 0.38); for (let j = y; j < ft; j++) pon(fx0 - 9 + i, j, RO); pon(fx0 - 9 + i, y - 1, BO); for (let k = 0; k < 3; k++) pon(fx0 - 9 + i, ft - k, RO2); }
  const vid = noche ? rgb("#ffe9a8") : rgb("#bfe6ff"), MB = rgb("#ffffff");
  const cx1 = X(ancho - 150 + 44), cy1 = Y(196 + 50);
  for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) { const d = i * i + j * j; if (d <= 81) pon(cx1 + i, cy1 + j, d <= 49 ? (i + j < -4 && !noche ? cla(vid, 0.5) : vid) : MB); }
  const vx = X(ancho - 16 - 40), vy = Y(196 + 34);
  for (let j = 0; j < 18; j++) for (let i = 0; i < 14; i++) { const arco = j < 4 && (i - 6.5) ** 2 + (j - 4) ** 2 > 36; if (arco) continue; pon(vx + i, vy + j, i < 2 || i > 11 || j > 15 || (j < 6 && (i - 6.5) ** 2 + (j - 6) ** 2 > 25) ? MB : vid); }
  for (let j = 2; j < 16; j++) pon(vx + 7, vy + j, MB);
  return listo();
}

/* ── (Fase 58) El carrito que pasa, el sol y la luna, en pixel ── */
export function texAuto(color = "#ff86b0") {
  return comoUrl(`auto|${color}`, 32, 14, ({ pon, caja }) => {
    const C = rgb(color), O = osc(C, 0.55), L = cla(C, 0.35), V = rgb("#cdeeff"), N = rgb("#3a2a35"), G = rgb("#d8d2dc");
    caja(8, 2, 13, 4, C); caja(2, 6, 28, 5, C);
    for (let x = 9; x < 21; x++) pon(x, 1, O);
    caja(10, 3, 5, 3, V); caja(16, 3, 4, 3, V); pon(15, 3, C); pon(10, 3, cla(V, 0.6));
    for (let x = 2; x < 30; x++) { pon(x, 5, x > 7 && x < 22 ? C : O); pon(x, 11, O); } for (let y = 6; y < 11; y++) { pon(1, y, O); pon(30, y, O); }
    for (let x = 3; x < 29; x++) pon(x, 6, L);
    pon(29, 7, [255, 243, 160]); pon(29, 8, [255, 243, 160]); pon(2, 8, [255, 120, 140]);
    for (const cx of [8, 23]) { caja(cx - 2, 10, 5, 4, N); caja(cx - 1, 11, 3, 2, G); pon(cx, 11, [255, 255, 255]); }
  });
}
export function texSol(tarde = false) {
  return comoUrl(`sol|${tarde}`, 26, 26, ({ pon }) => {
    const A = rgb(tarde ? "#ffb070" : "#ffe680"), B = rgb(tarde ? "#ff8f6b" : "#ffd04d"), L = rgb(tarde ? "#ffd2a8" : "#fff6c8");
    for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) { const d = x * x + y * y; if (d <= 49) pon(13 + x, 13 + y, d > 30 ? B : (x - 2) * (x - 2) + (y + 2) * (y + 2) < 8 ? L : A); }
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; for (let r = 10; r <= 12; r++) pon(13 + Math.round(Math.cos(a) * r), 13 + Math.round(Math.sin(a) * r), B); }
  });
}
export function texLuna() {
  return comoUrl("luna", 22, 22, ({ pon }) => {
    const A = rgb("#fff3c4"), B = rgb("#e9d79a"), C = rgb("#d8c486");
    for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) {
      const d = x * x + y * y;
      if (d > 64 || (x + 5) * (x + 5) + (y - 3) * (y - 3) < 44) continue;
      pon(11 + x, 11 + y, d > 46 ? B : A);
    }
    for (const [x, y] of [[4, -2], [2, 3], [5, 4]]) pon(11 + x, 11 + y, C);
  });
}

/** (Fase 59) Nubecita pixel (tres formas), blanca con su sombra abajo y su brillito arriba. */
export function texNubePx(v = 0) {
  const B = [[[10, 9, 9, 5], [20, 6, 9, 6], [30, 8, 8, 5], [38, 10, 7, 4]], [[9, 9, 8, 4], [18, 7, 8, 5], [27, 9, 7, 4]], [[8, 10, 7, 4], [17, 7, 10, 6], [28, 6, 8, 6], [37, 9, 8, 5], [45, 11, 6, 3]]][v % 3];
  return comoUrl(`nube|${v % 3}`, 52, 16, ({ pon }) => {
    const A = rgb("#ffffff"), S = rgb("#e4dcf2"), L = rgb("#fffaff");
    for (let y = 0; y < 16; y++) for (let x = 0; x < 52; x++) {
      const dentro = B.some(([bx, by, rx, ry]) => ((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2 <= 1) && y <= 13;
      if (!dentro) continue;
      const abajo = !B.some(([bx, by, rx, ry]) => ((x - bx) / rx) ** 2 + ((y + 2 - by) / ry) ** 2 <= 1) || y >= 12;
      const arriba = !B.some(([bx, by, rx, ry]) => ((x - bx) / rx) ** 2 + ((y - 2 - by) / ry) ** 2 <= 1);
      pon(x, y, abajo ? S : arriba ? L : A);
    }
  });
}
/** (Fase 59) Pajarito pixel con dos cuadros (alas arriba y abajo) para que aletee. */
export function texPajaro() {
  return comoUrl("pajaro", 14, 5, ({ pon }) => {
    const K = rgb("#4b3a52");
    for (const [x, y] of [[0, 0], [1, 1], [2, 2], [3, 2], [4, 1], [5, 0], [3, 3]]) pon(x, y, K);
    for (const [x, y] of [[0, 3], [1, 2], [2, 2], [3, 2], [4, 2], [5, 3], [3, 3]]) pon(7 + x, y, K);
  });
}

/** (Fase 59/60) La pared entre dos cuartos, en perspectiva (2.5D), de 80 × 180 cuadritos (todo el alto del mundo):
 *  · su cara de lado junto a la esquina (con el color de la pared del cuarto que se ve) y su orilla,
 *  · su base sobre el piso, que se abre hacia ti según dónde esté la cámara (`off`, en unidades del mundo),
 *  · y su puerta DE LADO, parada sobre la base (abierta o cerrada). `exterior`: la pared de la casa (más gruesa). */
export function pintarMuro3d(cv, off, { abierta = false, exterior = false, pared = "#ffe1ec" } = {}) {
  const L = lienzo(80, 180, cv), PISO_ = 108, HONDO = 72;
  const A = rgb(exterior ? "#f1e2d3" : "#fff6ee"), O = rgb(exterior ? "#c9ab93" : "#e3c9d4"), S = rgb("#5a2846");
  const W = rgb(pared), Wo = W.map((v) => Math.round(v * 0.8)), Wd = W.map((v) => Math.round(v * 0.68));
  const xEn = (t) => 40 + (off / 4) * t, yEn = (t) => PISO_ + HONDO * t;
  const grueso = exterior ? 1.6 : 1;
  // 1) La cara de lado de la pared, cerquita de la esquina (lo que hace que se vea en 3D).
  const tCara = 0.2, xa = 40, xb = xEn(tCara);
  if (Math.abs(xb - xa) >= 1) {
    const izq = Math.min(xa, xb), der = Math.max(xa, xb);
    for (let x = Math.floor(izq); x <= Math.ceil(der); x++) {
      const t = Math.abs(off) < 1 ? 0 : lim01((x - 40) / ((off / 4) || 1)) , ybajo = yEn(Math.min(tCara, t));
      for (let y = 0; y <= ybajo; y++) L.pon(x, y, (x + y) % 7 === 0 ? Wd : Wo);
    }
    for (let y = 0; y <= yEn(tCara); y++) L.pon(Math.round(xb), y, O);   // su orilla (el grueso de la pared)
  }
  // 2) La base sobre el piso.
  for (let y = PISO_; y < 180; y++) {
    const t = (y - PISO_) / (HONDO - 1), cx = xEn(t), m = (2 + Math.round(2.6 * t)) * grueso, a = Math.round(cx - m), b = Math.round(cx + m);
    for (let x = a; x <= b; x++) L.pon(x, y, x === a || x === b || y === 179 ? O : A);
    for (let i = 1; i <= 3; i++) L.pon(b + i, y, S, [70, 40, 18][i - 1]);
  }
  // 3) La puerta de lado (de t1 a t2 del fondo hacia ti), parada sobre la base.
  const t1 = 0.3, t2 = 0.56, alto = (t) => 38 * (0.92 + 0.3 * t);
  const MARCO = rgb(exterior ? "#8a5a44" : "#4a3346"), HOJA = rgb(exterior ? "#c98a62" : "#f2a7c3"), HOJA2 = rgb(exterior ? "#a8704f" : "#e38fb1");
  // (Aunque la veas casi de canto, la puerta siempre tiene su anchito para que se note que es puerta.)
  const dx0 = xEn(t2) - xEn(t1), dxP = (Math.sign(off) || 1) * Math.max(Math.abs(dx0), 8), xP = (t) => xEn(t1) + ((t - t1) / (t2 - t1)) * dxP;
  const pasos = Math.max(2, Math.round(Math.abs(dxP)) + 2);
  for (let i = 0; i <= pasos; i++) {
    const t = t1 + (t2 - t1) * (i / pasos), x = Math.round(xP(t)), yb = Math.round(yEn(t)), yt = Math.round(yb - alto(t));
    if (!abierta) for (let y = yt; y <= yb; y++) L.pon(x, y, i === 0 || i === pasos ? MARCO : (y - yt) % 9 === 0 ? HOJA2 : HOJA);
    else { L.pon(x, yt, MARCO); for (let y = yt + 1; y <= yb; y++) if (i === 0 || i === pasos) L.pon(x, y, MARCO); }
  }
  // La perilla, o (abierta) la hoja pegadita a la pared hacia el fondo.
  if (!abierta) { const t = t1 + (t2 - t1) * 0.78; L.pon(Math.round(xP(t)), Math.round(yEn(t) - alto(t) * 0.48), rgb("#ffd36e")); L.pon(Math.round(xP(t)), Math.round(yEn(t) - alto(t) * 0.48) + 1, rgb("#c9a040")); }
  else for (let y = Math.round(yEn(t1) - alto(t1)); y <= Math.round(yEn(t1)); y++) { L.pon(Math.round(xP(t1) - Math.sign(dxP) * 2), y, HOJA2); L.pon(Math.round(xP(t1) - Math.sign(dxP)), y, HOJA); }
  L.listo();
}
const lim01 = (v) => Math.max(0, Math.min(1, v));


/* ═══ (Fase 61) La cajita 3D de cada cuarto, en pixel art: las paredes de los lados con su tapiz EN PERSPECTIVA,
 *  el piso en perspectiva (las tablas se juntan hacia el fondo), zoclos en las tres paredes, la esquina con su
 *  sombrita, el corte de la pared adelante y las puertas DE LADO (en la pared de su lado, abiertas o cerradas).
 *  La pared de atrás es la de siempre (CSS); este lienzo pinta todo lo demás. Un cuadrito = 3 del mundo. ═══ */
const ARRIBA3D = -330, ABAJO3D = 800, PXC = 3;   // (hasta 800: abajo del cuarto se sigue viendo el piso)
const datosDe = (t) => { if (!t) return null; if (!t.datos) t.datos = t.cv.getContext("2d").getImageData(0, 0, t.tw, t.th).data; return t; };
const muestra = (t, u, v) => { const x = ((Math.floor(u) % t.tw) + t.tw) % t.tw, y = ((Math.floor(v) % t.th) + t.th) % t.th, i = (y * t.tw + x) * 4; return [t.datos[i], t.datos[i + 1], t.datos[i + 2]]; };
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** cfg: { w, pared: clave del tapiz, piso: clave del piso, izq/der: null o { puerta, abierta, exterior, cap } } */
export function pintarCaja(cv, cfg, soloPuertas = false) {
  const W = Math.ceil(cfg.w / PXC), HH = Math.ceil((ABAJO3D - ARRIBA3D) / PXC);
  let c = cv._c, img = cv._img;
  if (!img || cv.width !== W || cv.height !== HH || !soloPuertas) { cv.width = W; cv.height = HH; c = cv.getContext("2d"); img = c.createImageData(W, HH); cv._c = c; cv._img = img; }
  // (Fase 62) B: ancho al fondo; F: ancho enfrente (menos que el cuarto: a los lados queda el corte de la pared, que se dibuja aparte).
  const d = img.data, w = cfg.w, cx = w / 2, B = FONDO_3D, F = FRENTE_3D, L = cx - (w * B) / 2, Rr = cx + (w * B) / 2, FL = cx - (w * F) / 2;
  const tp = datosDe(cache.get(cfg.pared)), tf = datosDe(cache.get(cfg.piso));
  const ZOC = [255, 250, 247], ZOC2 = [232, 214, 222], LINEA = [120, 80, 105];
  const put = (i, j, k, f = 1, a = 255) => { const o = (j * W + i) * 4; d[o] = Math.min(255, k[0] * f); d[o + 1] = Math.min(255, k[1] * f); d[o + 2] = Math.min(255, k[2] * f); d[o + 3] = a; };
  // (Fase 62) La puerta, en la pared de su lado: de 0.16 a 0.66 de hondo y más alta que el monito (186), con su marco claro,
  // su orilla, dos tableros hundidos, la manija del lado de enfrente y la rendija de abajo. Abierta: el pasillo oscurito.
  const U0 = 0.16, U1 = 0.66, HT = 186;
  const puertaEn = (lado, u, hgt) => {
    const p = lado < 0 ? cfg.izq : cfg.der;
    if (!p?.puerta || u < U0 || u > U1 || hgt > HT + 7) return null;
    const hx = /^#?([0-9a-f]{6})$/i.exec(p.color || ""), hn = hx ? parseInt(hx[1], 16) : 0;
    const ORILLA = p.exterior ? [140, 98, 76] : [178, 136, 158], MARCO = p.exterior ? [236, 214, 196] : [255, 247, 242], HOJA = hx ? [hn >> 16, (hn >> 8) & 255, hn & 255] : p.exterior ? [199, 136, 96] : [240, 163, 192];
    if (u < U0 + 0.008 || u > U1 - 0.008 || hgt > HT + 4) return ORILLA;
    if (u < U0 + 0.03 || u > U1 - 0.03 || hgt > HT - 3) return MARCO.map((v) => v * (hgt > HT - 3 ? 0.97 : 1));
    if (u < U0 + 0.038 || u > U1 - 0.038 || hgt > HT - 7) return ORILLA.map((v) => v * 0.9);
    const fu = (u - U0) / (U1 - U0);   // 0 al fondo … 1 enfrente
    // (Fase 63) Abriéndose poco a poco: la hoja gira hacia su bisagra (atrás) y se va viendo el pasillo oscurito.
    const ap = p.ap ?? (p.abierta ? 1 : 0);
    if (ap > 0) {
      const lim = 1 - 0.8 * ap;
      if (fu < lim) return HOJA.map((v) => v * (0.92 - 0.24 * ap + 0.1 * (fu / Math.max(0.05, lim))));
      const f = 0.4 + 0.32 * (hgt / HT); return [50 * f, 36 * f, 58 * f];
    }
    const ku = U1 - 0.078;
    if (Math.abs(u - ku) < 0.011 && Math.abs(hgt - 84) < 4) return [255, 214, 120];   // la manija
    if (Math.abs(u - ku) < 0.017 && Math.abs(hgt - 84) < 6.5) return [170, 116, 60];
    if (hgt < 4) return HOJA.map((v) => v * 0.62);                                     // la rendija de abajo
    let f = 0.88 + 0.14 * fu + 0.04 * (hgt / HT);
    const a = U0 + 0.075, b = U1 - 0.075, m = (a + b) / 2, en = (u0, u1, h0, h1) => u > u0 && u < u1 && hgt > h0 && hgt < h1;
    const arriba = en(a, m - 0.012, 104, HT - 24) || en(m + 0.012, b, 104, HT - 24), abajo = en(a, m - 0.012, 20, 90) || en(m + 0.012, b, 20, 90);
    if (arriba || abajo) { f *= 0.9; if (en(a, b, abajo ? 86 : HT - 28, abajo ? 90 : HT - 24)) f *= 1.12; }   // tablero hundido con su brillito arriba
    return HOJA.map((v) => v * f);
  };
  const pixel = (i, j) => {
    const X = (i + 0.5) * PXC, Y = ARRIBA3D + (j + 0.5) * PXC, b = BAY[(j % 4) * 4 + (i % 4)] / 16;
    // (Fase 62) El corte de la pared (enfrente, a los lados) va en otro lado, encima de los monitos: aquí queda vacío.
    if (X < FL || X > w - FL) return put(i, j, [0, 0, 0], 1, 0);
    if (Y >= PISO_M) {
      const t = (Y - PISO_M) / (H_M - PISO_M), s = B + (F - B) * Math.min(1, t), half = (w / 2) * s, ax = Math.abs(X - cx);
      if (ax <= half) {   // El piso.
        if (!tf) return put(i, j, [0, 0, 0], 1, 0);
        const xl = cx + (X - cx) / s, k = muestra(tf, xl / PXC, (Y - PISO_M) / PXC / s);
        let f = 0.84 + 0.16 * t;
        if (half - ax < 10) f *= 0.86 + (half - ax) / 70;   // sombrita junto a las paredes
        if (Y - PISO_M < 8) f *= 0.82 + (Y - PISO_M) / 45;  // y junto a la de atrás
        return put(i, j, k, f + (b - 0.5) * 0.03);
      }
    } else if (X >= L && X <= Rr) {
      // La pared de atrás se ve a través; sólo su esquina y la sombrita junto a ella.
      const e = Math.min(X - L, Rr - X);
      if (e < 1.6) return put(i, j, LINEA, 1, 150);
      if (e < 14) return put(i, j, [60, 30, 50], 1, Math.round((1 - e / 14) * 46 * (b > 0.4 ? 1 : 0.7)));
      return put(i, j, [0, 0, 0], 1, 0);
    }
    // Las paredes de los lados.
    const lado = X < cx ? -1 : 1, se = Math.min(F, Math.max(B, (lado < 0 ? cx - X : X - cx) / (w / 2))), u = (se - B) / (F - B), Ye = PISO_M + u * (H_M - PISO_M);
    const hgt = (Ye - Y) / se;
    if (hgt < 0) return put(i, j, [0, 0, 0], 1, 0);
    const pu = puertaEn(lado, u, hgt);
    if (pu) return put(i, j, pu);
    let f = (lado < 0 ? 0.9 : 0.95) * (0.92 + 0.08 * u);
    if (hgt < 1.8) return put(i, j, LINEA, 0.9);
    if (hgt < 14) return put(i, j, hgt > 12 ? ZOC2 : ZOC, f + 0.06);
    if (!tp) return put(i, j, [255, 225, 236], f);
    return put(i, j, muestra(tp, (u * PARED_3D) / PXC, -hgt / PXC), f + (b - 0.5) * 0.025);
  };
  if (!soloPuertas) { for (let j = 0; j < HH; j++) for (let i = 0; i < W; i++) pixel(i, j); c.putImageData(img, 0, 0); return; }
  // Sólo donde están las puertas (al abrirse o cerrarse): rapidito.
  for (const lado of [-1, 1]) {
    if (!(lado < 0 ? cfg.izq : cfg.der)?.puerta) continue;
    const xs = [U0 - 0.02, U1 + 0.02].map((u) => { const se = B + u * (F - B); return lado < 0 ? cx - se * w / 2 : cx + se * w / 2; });
    const i0 = Math.max(0, Math.floor(Math.min(...xs) / PXC) - 1), i1 = Math.min(W - 1, Math.ceil(Math.max(...xs) / PXC) + 1);
    const y1 = PISO_M + (U1 + 0.02) * (H_M - PISO_M), j0 = Math.max(0, Math.floor((PISO_M + (U0 - 0.02) * (H_M - PISO_M) - HT - 20 - ARRIBA3D) / PXC)), j1 = Math.min(HH - 1, Math.ceil((y1 - ARRIBA3D) / PXC) + 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) pixel(i, j);
    c.putImageData(img, 0, 0, i0, j0, i1 - i0 + 1, j1 - j0 + 1);
  }
}
/** La clave con la que se guardó el tapiz / el piso (para la cajita 3D). */
export const claveTapiz = (color, patron) => `p|${color}|${patron}`;
export const clavePiso = (tipo) => (PISOS[tipo] || ["mosaico", "alfombra", "barro"].includes(tipo) ? `f|${tipo}` : "f|pasto");

/* ── (Fase 66) Sombras y luces en pixel (nada de degradados lisos) ── */
/** La sombrita pixel de algo del piso: un óvalo de `celdas` cuadritos de ancho (de 4 del mundo), con su centro más
 *  oscuro y la orilla tramada. `sol`: la verdosa de afuera de día. */
export function sombraPx(celdas, sol = false) {
  const w = Math.max(3, Math.min(90, Math.round(celdas))), h = Math.max(3, Math.min(7, Math.round(w / 6) + 2)), k = sol ? [36, 58, 40] : [70, 34, 60];
  return comoUrl("sombra" + w + (sol ? "s" : ""), w, h, (L) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const dx = (i + 0.5 - w / 2) / (w / 2), dy = (j + 0.5 - h / 2) / (h / 2), r = dx * dx + dy * dy;
      if (r > 1) continue;
      const a = r < 0.3 ? (sol ? 92 : 78) : r < 0.65 ? (sol ? 58 : 48) : (i + j) % 2 ? (sol ? 30 : 24) : 0;
      if (a) L.pon(i, j, k, a);
    }
  });
}
/** El cono de luz de la lámpara del techo, en pixel: escalones de luz con trama (no un degradado liso). */
export function conoLuzPx() {
  const w = 60, h = 95;
  return comoUrl("cono", w, h, (L) => {
    for (let j = 0; j < h; j++) {
      const f = j / h, ancho = 6 + f * 24;
      for (let i = 0; i < w; i++) {
        const dx = Math.abs(i + 0.5 - w / 2) / ancho;
        if (dx > 1) continue;
        const v = (1 - f * 0.85) * (1 - dx * dx), b = BAY[(j % 4) * 4 + (i % 4)] / 16;
        const n = Math.floor(v * 4 + b * 0.9);
        if (n > 0) L.pon(i, j, [255, 243, 176], [0, 34, 58, 84, 100][Math.min(4, n)]);
      }
    }
  });
}
