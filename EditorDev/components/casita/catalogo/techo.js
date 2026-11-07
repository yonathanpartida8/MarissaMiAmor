/**
 * (Fase 71) LOS FOCOS DEL TECHO: se cuelgan del techo de cada cuarto (sólo se mueven de lado a lado), alumbran el
 * cuarto de verdad de noche (son la luz del cuarto) y cada uno se prende o se apaga al tocarlo; el apagador del
 * cuarto los apaga todos. Dibujados en pixel, cuadrito por cuadrito (1 = 4 del mundo), con su florón en el techo.
 *   · Lo que sólo brilla prendido va en la capa `foco-luz`; lo que se ve apagado, en `foco-apag`.
 *   · El ventilador gira sus aspas (dos cuadros que se turnan) sólo prendido; la bola disco destella.
 */
import { pix } from "./pixel.js";

const PANTALLAS = ["#ff9cbf", "#c9a7ff", "#8fd0ff", "#94dfbd", "#ffd96b", "#fffaf0"];

/** Un lienzo de letras (cada letra, un color de la paleta) para dibujar con cajas, líneas y círculos. */
function lienzo(W, H) {
  const G = Array.from({ length: H }, () => Array(W).fill("."));
  const pon = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) G[y][x] = c; };
  const caja = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pon(x, y, c); };
  return { G, pon, caja, filas: () => G.map((f) => f.join("")) };
}
/** Lo que se ve sólo prendido: las celdas que cambian (de una función que da la letra prendida o null). */
const luz = (W, H, f) => { const p = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = f(x, y); if (c) p.push([x, y, c]); } return p; };
/** El florón del techo y el cable (en la columna cx, de la fila 2 hasta la `hasta`). */
const colgar = (L, cx, hasta, ancho = 2) => {
  L.caja(cx - ancho, 0, cx + ancho, 0, "k"); L.caja(cx - ancho + 1, 1, cx + ancho - 1, 1, "i");
  for (let y = 2; y <= hasta; y++) L.pon(cx, y, "&");
};

// ── La campana (como la de la sala): pantalla redonda de color, su foco abajo. ──
function campana() {
  const W = 15, H = 26, L = lienzo(W, H), cx = 7;
  colgar(L, cx, 12);
  L.caja(6, 13, 8, 13, "m"); L.caja(6, 14, 8, 14, "n");
  for (let y = 14; y <= 21; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - 7.5) / 7.4, dy = (y + 0.5 - 22) / 8.2;
    if (dx * dx + dy * dy > 1) continue;
    const borde = dx * dx + dy * dy > 0.78;
    L.pon(x, y, y === 21 ? ")" : borde ? (dx < 0 ? "[" : ")") : dx < -0.35 && dy < -0.35 ? "{" : dx < 0 ? "]" : "[");
  }
  L.caja(1, 22, 13, 22, "("); L.caja(5, 23, 9, 24, "D"); L.caja(6, 25, 8, 25, "E");
  return { filas: L.filas(), capas: [{ clase: "foco-luz", p: luz(W, H, (x, y) => (y >= 23 && y <= 25 && x >= 5 && x <= 9 && !(y === 25 && (x === 5 || x === 9)) ? (y === 23 ? "W" : "?") : y === 22 && x >= 3 && x <= 11 ? "V" : null)) }] };
}
// ── El foco pelón (de filamento): su socket de latón y su vidrio en forma de pera. ──
function pelon() {
  const W = 9, H = 28, L = lienzo(W, H), cx = 4;
  colgar(L, cx, 15, 2);
  for (let y = 16; y <= 18; y++) L.caja(3, y, 5, y, y === 17 ? "l" : "n");
  const ancho = { 19: [3, 5], 20: [3, 5], 21: [2, 6], 22: [2, 6], 23: [2, 6], 24: [2, 6], 25: [2, 6], 26: [3, 5], 27: [4, 4] };
  for (const [y, [a, b]] of Object.entries(ancho)) for (let x = a; x <= b; x++) L.pon(x, +y, x === a && +y < 26 ? "#" : "Q");
  for (const [x, y] of [[3, 20], [5, 20], [3, 21], [5, 21], [4, 22], [3, 23], [5, 23]]) L.pon(x, y, "F");
  return { filas: L.filas(), capas: [{ clase: "foco-luz", p: luz(W, H, (x, y) => { const a = ancho[y]; if (!a || x < a[0] || x > a[1]) return null; return [[3, 20], [5, 20], [3, 21], [5, 21], [4, 22], [3, 23], [5, 23]].some(([i, j]) => i === x && j === y) ? "W" : y >= 25 ? "V" : "?"; }) }] };
}
// ── El candil: florón y cadena de latón, brazos curvos, cinco velitas con su foco y cristalitos que cuelgan. ──
function candil() {
  const W = 25, H = 28, L = lienzo(W, H), cx = 12;
  L.caja(9, 0, 15, 0, "n"); L.caja(10, 1, 14, 1, "m");
  for (let y = 2; y <= 9; y++) L.pon(cx, y, y % 2 ? "l" : "n");
  L.caja(11, 10, 13, 10, "n"); L.caja(10, 11, 14, 12, "m"); L.caja(11, 13, 13, 13, "n");
  L.caja(11, 14, 13, 19, "m"); L.pon(11, 15, "o"); L.pon(11, 16, "o");
  L.caja(10, 20, 14, 21, "n"); L.caja(11, 22, 13, 22, "m"); L.pon(12, 23, "n"); L.pon(12, 24, "o");
  // Los brazos (curvos, hacia afuera) y sus platitos.
  const brazos = [[2, 18], [7, 19], [17, 19], [22, 18]];
  for (const [x] of brazos) { const d = x < cx ? -1 : 1; for (let t = 0; t <= Math.abs(x - cx); t++) { const xx = cx + d * t, yy = 19 - Math.round(Math.sin((t / Math.abs(x - cx)) * Math.PI) * 2); L.pon(xx, yy, "m"); } }
  for (const [x, y] of [...brazos, [12, 13]]) { L.caja(x - 1, y - 1, x + 1, y - 1, "n"); L.caja(x - 1, y - 5, x + 1, y - 2, "C"); L.pon(x + 1, y - 4, "D"); L.pon(x, y - 6, "D"); L.pon(x, y - 7, "E"); }
  // Los cristalitos.
  for (const x of [4, 9, 15, 20]) { L.pon(x, 20, "j"); L.pon(x, 21, "Q"); L.pon(x, 22, "P"); }
  const llamas = [...brazos, [12, 13]];
  return { filas: L.filas(), capas: [{ clase: "foco-luz", p: luz(W, H, (x, y) => (llamas.some(([a, b]) => a === x && (y === b - 6 || y === b - 7)) ? (llamas.some(([a, b]) => a === x && y === b - 7) ? "W" : "?") : null)) }] };
}
// ── El plafón: pegadito al techo, de vidrio esmerilado con su aro. ──
function plafon() {
  const W = 18, H = 6, L = lienzo(W, H);
  L.caja(2, 0, 15, 0, "j");
  for (let y = 1; y <= 5; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - 9) / 8.6, dy = (y - 0.5) / 5.2;
    if (dx * dx + dy * dy > 1) continue;
    L.pon(x, y, y === 1 ? "i" : dx < -0.4 ? "C" : dx > 0.55 || y === 5 ? "E" : "D");
  }
  return { filas: L.filas(), capas: [{ clase: "foco-luz", p: luz(W, H, (x, y) => { const dx = (x + 0.5 - 9) / 8.6, dy = (y - 0.5) / 5.2; return y >= 2 && dx * dx + dy * dy <= 0.8 ? (Math.abs(dx) < 0.45 ? "W" : "?") : null; }) }] };
}
// ── El farol de papel: una esfera de papel con sus aros, de color. ──
function farolPapel() {
  const W = 13, H = 26, L = lienzo(W, H), cx = 6;
  colgar(L, cx, 9);
  L.caja(5, 10, 7, 10, "h");
  for (let y = 11; y <= 25; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - 6.5) / 6.4, dy = (y + 0.5 - 18.2) / 7.2;
    if (dx * dx + dy * dy > 1) continue;
    L.pon(x, y, y % 3 === 0 ? ")" : dx * dx + dy * dy > 0.75 ? (dx < 0 ? "[" : ")") : dx < -0.2 && dy < -0.2 ? "{" : "]");
  }
  return { filas: L.filas(), capas: [{ clase: "foco-luz", p: luz(W, H, (x, y) => { const dx = (x + 0.5 - 6.5) / 6.4, dy = (y + 0.5 - 18.2) / 7.2, r = dx * dx + dy * dy; return r <= 0.55 && y % 3 ? (r < 0.22 ? "?" : "{") : null; }) }] };
}
// ── El ventilador de techo con su luz: el tubo, el motor, cuatro aspas de madera (giran prendido) y su tazón de luz. ──
function ventilador() {
  const W = 34, H = 16, L = lienzo(W, H);
  L.caja(14, 0, 19, 0, "k"); L.caja(15, 1, 18, 1, "i");
  for (let y = 2; y <= 5; y++) L.caja(16, y, 17, y, y === 2 ? "h" : "i");
  L.caja(13, 6, 20, 6, "j"); L.caja(12, 7, 21, 8, "i"); L.caja(13, 9, 20, 9, "h");
  L.caja(14, 10, 19, 10, "n"); L.caja(13, 11, 20, 12, "D"); L.caja(14, 13, 19, 13, "E"); L.caja(15, 14, 18, 14, "F");
  // Aspas: cuadro A (de frente, largas) y cuadro B (de canto, cortitas).
  const a = [], b = [];
  for (let x = 0; x <= 11; x++) { a.push([x, 8, x < 2 ? "c" : "d"], [33 - x, 8, x < 2 ? "c" : "d"]); if (x > 1) a.push([x, 9, "c"], [33 - x, 9, "c"]); }
  for (let x = 6; x <= 11; x++) { b.push([x, 8, "e"], [33 - x, 8, "e"], [x, 9, "d"], [33 - x, 9, "d"]); }
  return {
    filas: L.filas(),
    capas: [
      { clase: "aspa-a", p: a }, { clase: "aspa-b", p: b },
      { clase: "foco-luz", p: luz(W, H, (x, y) => (y >= 11 && y <= 13 && x >= 14 && x <= 19 ? (y === 11 ? "W" : "?") : null)) },
    ],
  };
}
// ── La bola disco: espejitos que destellan prendida (cuadros que se turnan). ──
function bolaDisco() {
  const W = 11, H = 24, L = lienzo(W, H), cx = 5;
  colgar(L, cx, 10, 2);
  L.caja(4, 11, 6, 11, "h");
  const dentro = (x, y) => { const dx = (x + 0.5 - 5.5) / 5.4, dy = (y + 0.5 - 17.6) / 5.6; return dx * dx + dy * dy <= 1; };
  for (let y = 12; y <= 23; y++) for (let x = 0; x < W; x++) if (dentro(x, y)) L.pon(x, y, (x + y) % 2 ? "j" : x < 4 && y < 17 ? "k" : "i");
  const brillos = (s) => luz(W, H, (x, y) => (dentro(x, y) && (x * 3 + y * 5 + s) % 7 === 0 ? ((x + y + s) % 3 ? "#" : "N") : null));
  return { filas: L.filas(), capas: [{ clase: "foco-luz px-a", t: 0.5, p: brillos(0) }, { clase: "foco-luz px-b", t: 0.5, p: brillos(3) }] };
}

const foco = (n, dib, extra) => { const { filas, capas } = dib(); return pix({ n, cat: "techo", capa: "pared", techo: true, al: "foco", filas, capas, ...extra }); };

export const ITEMS = {
  foco_campana: foco("Lámpara de campana", campana, { colores: PANTALLAS, brilla: { x: 30, y: 96, r: 300, c: "#ffe2a8", cuarto: true } }),
  foco_pelon: foco("Foco de filamento", pelon, { brilla: { x: 18, y: 92, r: 280, c: "#ffcf8a", cuarto: true } }),
  candil: foco("Candil", candil, { brilla: { x: 50, y: 50, r: 320, c: "#ffe7b0", cuarto: true } }),
  plafon: foco("Plafón", plafon, { brilla: { x: 36, y: 16, r: 300, c: "#fff1d0", cuarto: true } }),
  farol_papel: foco("Farol de papel", farolPapel, { colores: PANTALLAS, brilla: { x: 26, y: 72, r: 290, c: "#ffe2a8", cuarto: true } }),
  ventilador_techo: foco("Ventilador con luz", ventilador, { brilla: { x: 68, y: 50, r: 290, c: "#fff1d0", cuarto: true } }),
  bola_disco: foco("Bola disco", bolaDisco, { brilla: { x: 22, y: 70, r: 260, c: "#e8d0ff", cuarto: true } }),
};
