/**
 * RÍO Y CAMINOS DEL JARDÍN (Fase 72): tiras para armar tu propio río y tus caminitos, en pixel art de verdad.
 *
 *   · Son del piso (van debajo de todo y se puede caminar encima). Ninguna lleva contorno: así una tira se junta
 *     con la otra sin que se note la unión.
 *   · Cada tira dice dónde están sus bocas (`bocas`: x, y desde su centro de abajo, y hacia dónde ve). Al soltarla
 *     cerca de otra de su misma familia (río con río, camino con camino) se pega sola, boca con boca; y al ponerla
 *     desde el cajón con otra elegida, sale ya pegadita a la que sigue (así el río crece tocando una sola vez).
 *   · El agua se mueve (olitas que corren con la corriente, en tres cuadros) y se puede pintar de otro color.
 *   · Las piezas: el río a lo largo y hacia el fondo, dos curvas (con «voltear» dan las cuatro vueltas), un laguito
 *     para terminarlo, el puentecito y cinco caminos (tierra, piedritas, ladrillo, madera y flores).
 *   · Y más cositas lindas para el jardín: cerca, hongo casita, bebedero de pajaritos, letrerito, pajarera y macizo de flores.
 *   · Todo se dibuja con código (cuadrito por cuadrito, con un azar fijo): siempre sale igual en los dos teléfonos.
 */
import { pix } from "./pixel.js";

const azar = (x, y, s = 0) => { let h = Math.imul(x + 1013, 374761393) ^ Math.imul(y + 2029, 668265263) ^ Math.imul(s + 7, 982451653); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const rejilla = (W, H) => Array.from({ length: H }, () => Array(W).fill("."));
const filas = (g) => g.map((f) => f.join(""));
const trasponer = (g) => g[0].map((_, x) => g.map((f) => f[x]));
const elipse = (g, cx, cy, rx, ry, k, si = () => true) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 && si(x, y)) g[y][x] = k; };
const rect = (g, x0, y0, w, h, k) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (g[y] && x >= 0 && x < g[0].length) g[y][x] = k; };
const P = 4;   // un cuadrito = 4 del mundo

/* ── EL RÍO ── (18 cuadritos de ancho: orilla, arena mojada, agua bajita y agua honda en medio) */
const T = 18, LARGO = 48;
/** Qué va en el renglón i del ancho del río (simétrico: así cualquier pieza se junta con cualquiera). */
function orilla(i, x, s) {
  const j = Math.min(i, T - 1 - i), a = azar(x, i, s);
  if (j === 0) return a < 0.5 ? "." : a < 0.62 ? "s" : "E";
  if (j === 1) return a < 0.08 ? "." : a < 0.16 ? "i" : a < 0.2 ? "j" : a < 0.3 ? "D" : "E";
  if (j === 2) return a < 0.1 ? "j" : a < 0.4 ? "D" : "E";
  if (j === 3) return a < 0.25 ? "E" : "F";
  if (j === 4) return a < 0.12 ? "#" : "]";
  if (j === 5) return a < 0.18 ? "]" : "[";
  if (j === 6) return a < 0.22 ? "[" : ")";
  return a < 0.07 ? "(" : a < 0.16 ? "[" : ")";
}
/** Olitas que corren: tres cuadros, cada uno dos cuadritos más adelante (en la dirección del agua). */
function olitas(W, H, dentro, s, paso = [2, 0]) {
  const base = [];
  for (let n = 0; n < Math.round((W * H) / 60); n++) {
    const x = Math.floor(azar(n, 1, s) * W), y = Math.floor(azar(n, 2, s) * H), l = 1 + Math.floor(azar(n, 3, s) * 3);
    base.push([x, y, l, azar(n, 4, s) < 0.35 ? "{" : "]"]);
  }
  return [1, 2, 3].map((k) => {
    const p = [];
    for (const [x, y, l, c] of base) for (let i = 0; i < l; i++) {
      const X = ((x + i * (paso[0] ? 1 : 0) + paso[0] * (k - 1)) % W + W) % W, Y = ((y + i * (paso[1] ? 1 : 0) + paso[1] * (k - 1)) % H + H) % H;
      if (dentro(X, Y)) p.push([X, Y, c]);
    }
    return { clase: `px3-${k}`, t: 1.6, p };
  });
}
const esAgua = (g) => (x, y) => /[()[\]#]/.test(g[y]?.[x] || ".");
const AGUAS = ["#5aa9e6", "#4fc3b5", "#7f9cf5", "#ff9cc7", "#8fd4ff"];

function rioRecto(vertical) {
  let g = rejilla(LARGO, T);
  for (let x = 0; x < LARGO; x++) for (let i = 0; i < T; i++) g[i][x] = orilla(i, x, 1);
  if (vertical) g = trasponer(g);
  const W = g[0].length, H = g.length;
  return pix({
    n: vertical ? "Río hacia el fondo" : "Río a lo largo", cat: "rio", capa: "alfombra", colores: AGUAS, filas: filas(g),
    capas: olitas(W, H, esAgua(g), vertical ? 3 : 2, vertical ? [0, 2] : [2, 0]),
    tira: "rio", zAlf: 2, sinContorno: true, noGira: true, nuevo: true,
    bocas: vertical ? [[0, -H * P, "N"], [0, 0, "S"]] : [[-W * P / 2, -H * P / 2, "W"], [W * P / 2, -H * P / 2, "E"]],
  });
}
/** La curva: un cuarto de anillo (del ancho del río) que da vuelta de abajo hacia la derecha (o de arriba). */
function rioCurva(arriba) {
  const S = 30, R0 = S - T, g = rejilla(S, S), cy = arriba ? 0 : S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x + 0.5 - S, y + 0.5 - cy), i = Math.floor(d - R0);
    if (i >= 0 && i < T) g[y][x] = orilla(i, Math.round(Math.atan2(y + 0.5 - cy, x + 0.5 - S) * 30), 4);
  }
  const m = (T / 2) * P, L = S * P;
  return pix({
    n: arriba ? "Vuelta del río (de arriba)" : "Vuelta del río (de abajo)", cat: "rio", capa: "alfombra", colores: AGUAS, filas: filas(g),
    capas: olitas(S, S, esAgua(g), arriba ? 6 : 5, [1, arriba ? 1 : -1]),
    tira: "rio", zAlf: 2, sinContorno: true, noGira: true, nuevo: true,
    bocas: arriba ? [[-L / 2 + m, -L, "N"], [L / 2, -m, "E"]] : [[-L / 2 + m, 0, "S"], [L / 2, -L + m, "E"]],
  });
}
/** El laguito: para que el río termine bonito (o para tenerlo solito), con nenúfares y piedritas. */
function laguito() {
  const W = 40, H = 26, g = rejilla(W, H), cx = W / 2, cy = H / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x + 0.5 - cx) / (W / 2), (y + 0.5 - cy) / (H / 2)), a = azar(x, y, 9), j = (1 - d) * 13;
    if (d > 1) continue;
    g[y][x] = j < 0.9 ? (a < 0.4 ? "." : a < 0.55 ? "s" : "E") : j < 1.9 ? (a < 0.14 ? "i" : a < 0.3 ? "D" : "E") : j < 2.6 ? "F" : j < 3.4 ? (a < 0.15 ? "#" : "]") : j < 4.6 ? "[" : a < 0.06 ? "(" : ")";
  }
  // Bocas a la izquierda y arriba (por ahí llega el río, de lado o desde el fondo): la orilla se abre.
  for (let y = 4; y < 22; y++) for (let x = 0; x < 6; x++) { const i = y - 4; g[y][x] = orilla(i, x, 1); }
  for (let x = 11; x < 29; x++) for (let y = 0; y < 6; y++) g[y][x] = orilla(x - 11, y, 3);
  // Nenúfares (con su florecita) y piedras en la orilla.
  for (const [x, y, f] of [[22, 9, 1], [29, 15, 0], [17, 16, 0], [27, 8, 0]]) { elipse(g, x, y, 2.6, 1.8, "r"); g[y - 1][x - 1] = "s"; g[y][x + 1] = "q"; if (f) { g[y - 1][x] = "I"; g[y - 2][x] = "J"; g[y - 1][x + 1] = "I"; } }
  for (const [x, y] of [[34, 4], [37, 13], [33, 22], [12, 23]]) { elipse(g, x, y, 2, 1.5, "i"); g[y - 1][x - 1] = "j"; g[y][x + 1] = "h"; }
  return pix({
    n: "Laguito", cat: "rio", capa: "alfombra", colores: AGUAS, filas: filas(g),
    capas: olitas(W, H, (x, y) => /[)[]/.test(g[y][x]), 8, [1, 0]),
    tira: "rio", zAlf: 2, sinContorno: true, noGira: true, nuevo: true,
    bocas: [[-W * P / 2, -H * P + 13 * P, "W"], [0, -H * P, "N"]],
  });
}
/** El puentecito de madera (cruza el río): tablas, barandal y sus postes. */
function puentecito(horizontal) {
  const W = 16, H = 28;
  let g = rejilla(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x < 2 || x >= W - 2) { g[y][x] = x === 0 || x === W - 1 ? "b" : "c"; continue; }
    g[y][x] = y % 3 === 2 ? "b" : (Math.floor(y / 3) % 2 ? "d" : "e");
    if (y % 3 === 0 && azar(x, y, 12) < 0.12) g[y][x] = "c";
    if (y % 3 === 1 && (x === 3 || x === W - 4)) g[y][x] = "g";
  }
  for (const y of [1, 13, 26]) for (const x of [0, 1, W - 2, W - 1]) { g[y][x] = "a"; g[y - 1][x] = x % (W - 1) ? "c" : "b"; }
  if (horizontal) g = trasponer(g);
  return pix({ n: horizontal ? "Puentecito (de lado)" : "Puentecito", cat: "rio", capa: "alfombra", filas: filas(g), zAlf: 4, sinContorno: true, noGira: true, nuevo: true, colores: null });
}

/* ── LOS CAMINOS ── (12 cuadritos de ancho; todos se juntan entre sí) */
const C = 12, CL = 40;
const CAMINOS = {
  tierra: { n: "Camino de tierra", px: (i, x) => { const j = Math.min(i, C - 1 - i), a = azar(x, i, 21); return j === 0 ? (a < 0.45 ? "." : a < 0.6 ? "s" : "7") : j === 1 ? (a < 0.12 ? "6" : a < 0.2 ? "E" : "7") : a < 0.05 ? "6" : a < 0.09 ? "E" : a < 0.12 ? "F" : a < 0.26 ? "8" : "7"; } },
  piedritas: {
    n: "Camino de piedritas", colores: ["#b4b0c8", "#e8b4c4", "#dcc79e", "#a8d8c0", "#c9b7ef"],
    lienzo: () => {
      const g = rejilla(CL, C);
      for (const [cx, cy, rx] of [[6, 6, 4.6], [16, 5.5, 3.8], [25, 6.5, 4.4], [34.5, 5.8, 4]]) {
        elipse(g, cx, cy + 0.6, rx, 3.6, "(");
        elipse(g, cx, cy, rx, 3.4, "[");
        elipse(g, cx - 0.8, cy - 0.9, rx * 0.62, 1.8, "]");
        g[Math.floor(cy - 2)][Math.floor(cx - 1)] = "{";
        if (azar(cx, cy, 5) < 0.6) g[Math.floor(cy + 2)][Math.floor(cx + rx - 2)] = "r";
      }
      return g;
    },
  },
  ladrillo: {
    n: "Camino de ladrillo", colores: ["#d9825b", "#e89ab0", "#e8d2a6", "#b9a3e0", "#9fc7a6"],
    px: (i, x) => {
      if (i === 0 || i === C - 1) return "(";
      const fila = Math.floor((i - 1) / 3.34), dentro = (i - 1) % 3 === 2, off = fila % 2 ? 3 : 0;
      if (dentro || (x + off) % 6 === 5) return "D";
      const a = azar(Math.floor((x + off) / 6), fila, 31);
      return (i - 1) % 3 === 0 && (x + off) % 6 < 2 ? "]" : a < 0.3 ? ")" : "[";
    },
  },
  madera: { n: "Camino de madera", px: (i, x) => { if (i === 0 || i === C - 1) return "b"; if (x % 4 === 3) return "a"; const a = azar(Math.floor(x / 4), 0, 41); if ((i === 2 || i === C - 3) && x % 4 === 1) return "g"; return azar(x, i, 42) < 0.1 ? "c" : a < 0.5 ? "d" : "e"; } },
  flores: {
    n: "Camino con flores", colores: ["#ff9cbf", "#ffd36e", "#c9a7ff", "#ffffff", "#ff8a80"],
    px: (i, x) => {
      const j = Math.min(i, C - 1 - i), a = azar(x, i, 51);
      if (j >= 3) return a < 0.1 ? "E" : a < 0.16 ? "F" : "D";
      if (j === 0) return a < 0.35 ? "." : "r";
      // Florecitas en las orillas (en cruz: pétalos del color elegido y su centro amarillo).
      const fx = x % 5, flor = (Math.floor(x / 5) + (i < 6 ? 0 : 1)) % 2 === 0;
      if (flor && j === 1 && fx === 2) return "!";
      if (flor && ((j === 1 && (fx === 1 || fx === 3)) || ((j === 2 || j === 0) && fx === 2))) return "[";
      return a < 0.3 ? "s" : a < 0.5 ? "q" : "r";
    },
  },
};
function camino(k, vertical) {
  const c = CAMINOS[k];
  let g = c.lienzo ? c.lienzo() : rejilla(CL, C);
  if (!c.lienzo) for (let x = 0; x < CL; x++) for (let i = 0; i < C; i++) g[i][x] = c.px(i, x);
  if (vertical) g = trasponer(g);
  const W = g[0].length, H = g.length;
  return pix({
    n: c.n + (vertical ? " (hacia el fondo)" : ""), cat: "rio", capa: "alfombra", colores: c.colores, filas: filas(g),
    tira: "camino", sinContorno: true, noGira: true, nuevo: true,
    bocas: vertical ? [[0, -H * P, "N"], [0, 0, "S"]] : [[-W * P / 2, -H * P / 2, "W"], [W * P / 2, -H * P / 2, "E"]],
  });
}

/* ── MÁS COSITAS LINDAS PARA EL JARDÍN ── */
function cerca() {
  const W = 36, H = 18, g = rejilla(W, H);
  for (let x = 0; x < W; x++) { g[6][x] = "["; g[7][x] = ")"; g[12][x] = "["; g[13][x] = ")"; }
  for (let p = 0; p < 6; p++) {
    const x0 = 1 + p * 6;
    for (let y = 2; y < H; y++) for (let x = x0; x < x0 + 4; x++) g[y][x] = x === x0 ? "]" : x === x0 + 3 ? ")" : "[";
    g[1][x0 + 1] = "]"; g[1][x0 + 2] = "["; g[0][x0 + 1] = "{"; g[0][x0 + 2] = "]";
    g[H - 1][x0] = "("; g[H - 1][x0 + 3] = "(";
  }
  return pix({ n: "Cerquita de jardín", cat: "jardin", colores: ["#ffffff", "#ffc6dc", "#c9f0dc", "#dfac7c", "#d6ccff"], filas: filas(g), nuevo: true });
}
function hongo() {
  const W = 22, H = 24, g = rejilla(W, H);
  rect(g, 8, 12, 6, 11, "D"); rect(g, 8, 12, 1, 11, "C"); rect(g, 13, 12, 1, 11, "E"); rect(g, 7, 22, 8, 2, "F");
  elipse(g, 11, 10, 10.5, 7.5, ")", (x, y) => y < 12);
  elipse(g, 11, 9.4, 10, 7, "[", (x, y) => y < 11);
  elipse(g, 8.5, 6, 4.5, 2.4, "]", (x, y) => y < 9);
  for (const [x, y] of [[6, 7], [14, 5], [16, 9], [10, 3], [4, 10]]) { g[y][x] = "C"; g[y][x + 1] = "C"; g[y + 1][x] = "C"; g[y + 1][x + 1] = "D"; }
  rect(g, 9, 16, 4, 4, "a"); g[16][9] = "b"; g[16][12] = "b"; g[18][11] = "n";   // la puertita
  return pix({ n: "Hongo casita", cat: "jardin", colores: ["#ef5a6f", "#ff9cbf", "#b998f0", "#ffb84a", "#5ab0e6"], filas: filas(g), nuevo: true });
}
function bebedero() {
  const W = 26, H = 26, g = rejilla(W, H);
  rect(g, 10, 10, 6, 13, "i"); rect(g, 10, 10, 1, 13, "j"); rect(g, 15, 10, 1, 13, "h");
  elipse(g, 13, 24, 8, 2.2, "h"); elipse(g, 13, 23.4, 7, 1.6, "i");
  elipse(g, 13, 7, 12.5, 4.6, "h"); elipse(g, 13, 6.4, 12, 4, "i"); elipse(g, 13, 5.6, 10.5, 3, "["); elipse(g, 11, 5, 5, 1.2, "]");
  rect(g, 1, 8, 24, 1, "j");
  const brillo = (k, x) => ({ clase: `px-${k}`, t: 1.4, p: [[x, 5, "{"], [x + 1, 5, "{"], [x + 7, 6, "{"]] });
  // Un pajarito que se asoma (a veces).
  return pix({ n: "Bebedero de pajaritos", cat: "jardin", colores: ["#8fd0ff", "#94dfbd", "#c9b7ef"], filas: filas(g), capas: [brillo("a", 7), brillo("b", 10), { clase: "px-cucu", r: [[17, 0, 3, 2, "!"], [16, 1, 1, 1, "U"], [18, 2, 2, 1, "9"]] }], nuevo: true, noGira: true });
}
function letrerito() {
  const W = 26, H = 26, g = rejilla(W, H);
  rect(g, 12, 13, 3, 13, "c"); rect(g, 12, 13, 1, 13, "d");
  rect(g, 1, 2, 24, 12, "d"); rect(g, 1, 2, 24, 1, "e"); rect(g, 1, 13, 24, 1, "b"); rect(g, 1, 2, 1, 12, "e"); rect(g, 24, 2, 1, 12, "c");
  for (let y = 5; y < 12; y += 3) for (let x = 3; x < 23; x++) if (azar(x, y, 61) < 0.35) g[y][x] = "c";
  // Un corazón en medio.
  for (const [x, y] of [[11, 5], [12, 5], [14, 5], [15, 5], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7], [15, 7], [16, 7], [11, 8], [12, 8], [13, 8], [14, 8], [15, 8], [12, 9], [13, 9], [14, 9], [13, 10]]) g[y][x] = "[";
  g[5][11] = "]"; g[6][11] = "{";
  g[1][4] = "a"; g[1][21] = "a";
  return pix({ n: "Letrerito de corazón", cat: "jardin", colores: ["#ff5c93", "#ff9cbf", "#c9a7ff", "#ffd36e"], filas: filas(g), nuevo: true, noGira: true });
}
function pajarera() {
  const W = 20, H = 40, g = rejilla(W, H);
  rect(g, 9, 17, 2, 23, "b"); rect(g, 9, 17, 1, 23, "c");
  rect(g, 4, 6, 12, 12, "["); rect(g, 4, 6, 1, 12, "]"); rect(g, 15, 6, 1, 12, ")");
  for (let y = 0; y < 7; y++) for (let x = 0; x < W; x++) { const d = Math.abs(x - 9.5); if (d <= y + 2.5 && d >= y - 0.5) g[y][x] = y === 0 ? "e" : "d"; if (d <= y + 2.5 && d > y + 1.5) g[y][x] = "b"; }
  elipse(g, 10, 11, 2.2, 2.2, "%"); g[14][10] = "c"; g[14][11] = "c"; rect(g, 3, 17, 14, 1, "c");
  return pix({ n: "Pajarera", cat: "jardin", colores: ["#8fd0ff", "#ff9cbf", "#ffd36e", "#94dfbd", "#ffffff"], filas: filas(g), nuevo: true, noGira: true });
}
function macizo() {
  const W = 36, H = 16, g = rejilla(W, H);
  rect(g, 0, 8, W, 8, "7"); rect(g, 0, 8, W, 1, "8"); rect(g, 0, 15, W, 1, "5");
  for (let x = 0; x < W; x += 6) rect(g, x, 9, 1, 6, "6");
  for (let x = 1; x < W - 1; x++) for (let y = 2; y < 9; y++) { const a = azar(x, y, 71); if (y >= 6 || a < 0.55) g[y][x] = a < 0.3 ? "q" : a < 0.7 ? "r" : "s"; }
  for (let n = 0; n < 9; n++) { const x = 2 + n * 4 - (n % 2), y = 2 + (n % 3); g[y][x] = "!"; g[y - 1][x] = "["; g[y + 1][x] = "["; g[y][x - 1] = "["; g[y][x + 1] = "]"; }
  return pix({ n: "Macizo de flores", cat: "jardin", colores: ["#ff9cbf", "#ffd36e", "#c9a7ff", "#ff8a80", "#ffffff"], filas: filas(g), nuevo: true, noGira: true });
}

export const ITEMS = {
  rio: rioRecto(false), rio_v: rioRecto(true), rio_curva: rioCurva(false), rio_curva_a: rioCurva(true), laguito: laguito(),
  puentecito: puentecito(false), puentecito_h: puentecito(true),
  camino_tierra: camino("tierra", false), camino_tierra_v: camino("tierra", true),
  camino_piedritas: camino("piedritas", false), camino_piedritas_v: camino("piedritas", true),
  camino_ladrillo: camino("ladrillo", false), camino_ladrillo_v: camino("ladrillo", true),
  camino_madera: camino("madera", false), camino_madera_v: camino("madera", true),
  camino_flores: camino("flores", false), camino_flores_v: camino("flores", true),
  cerquita: cerca(), hongo_casita: hongo(), bebedero: bebedero(), letrerito: letrerito(), pajarera: pajarera(), macizo: macizo(),
};
// (Lo que no se pinta de otro color no lleva la lista.)
for (const d of Object.values(ITEMS)) if (!d.colores) delete d.colores;
