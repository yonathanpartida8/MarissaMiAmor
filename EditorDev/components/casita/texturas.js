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
  const r = { url: `url("${L.listo().toDataURL("image/png")}")`, w: w * PX, h: h * PX };
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
