/**
 * PIXEL ART DE VERDAD (Fase 68): cosas dibujadas cuadrito por cuadrito, no figuras lisas.
 *
 *   · 1 cuadrito = 4 del mundo (la misma rejilla de los muebles en pixel y del monito), así todo combina.
 *   · Una paleta común con sus rampas (maderas, metales, latón, telas, vidrio, plantas, fuego…) de lo oscuro a lo
 *     claro: con ella se sombrea a mano (luz arriba a la izquierda, sombra abajo a la derecha).
 *   · Lo que se puede pintar de otro color usa la rampa de su color: ( ) [ ] { (de oscuro a claro).
 *   · Lo que se mueve va en capas con clase (no se hornea al girarlo y sigue vivo): cuadros que se turnan
 *     (px-a/px-b, px3-1…3, px4-1…4), lo que sólo sale prendido (px-on) o apagado (px-off).
 *   · El contorno de afuera se lo pone girar.js (vistaPlana), igual que a los demás muebles.
 */
import { tono } from "./arte.js";

export const PXL = 4;
export const PAL = {
  // Madera miel (de oscuro a claro).
  a: "#4a2b2c", b: "#76463a", c: "#a0634a", d: "#c4875c", e: "#dfac7c", f: "#f3cfa0",
  // Nogal (lo fino).
  1: "#2f1c22", 2: "#4e2f30", 3: "#6f453d", 4: "#93604d",
  // Metal (lavanda grisáceo).
  g: "#383447", h: "#5a556e", i: "#8a86a2", j: "#bcb9d2", k: "#ecebf6",
  // Latón.
  l: "#6e4a1e", m: "#a8742c", n: "#d9a845", o: "#f7dc84",
  // Verdes de planta.
  p: "#21402e", q: "#2e6440", r: "#4b9450", s: "#80c463", t: "#c1e68b",
  // Rojos (vino a coral).
  u: "#561d2b", v: "#8c2e3c", w: "#c44a54", x: "#ec7f7f",
  // Azules.
  y: "#202c58", z: "#33508e", A: "#5a83c2", B: "#96bde6",
  // Cremas y papel.
  C: "#fffaf0", D: "#f3e5c8", E: "#dbc49c", F: "#ad936c",
  // Rosas.
  G: "#7c2f55", H: "#bb5283", I: "#ef8bb4", J: "#ffc6dc",
  // Lilas.
  K: "#3c2a5a", L: "#62498f", M: "#937ac8", N: "#c8b6ef",
  // Vidrio y agua.
  O: "#5f9fc0", P: "#9fd3ea", Q: "#d8f2fb", R: "#3f86c4", S: "#7cc0ec",
  // Fuego.
  T: "#b2421c", U: "#ec7428", V: "#ffb43c", W: "#fff07a",
  // Turquesa.
  X: "#1d4a4c", Y: "#2c786f", Z: "#58b4a0",
  // Barro.
  5: "#6e3420", 6: "#a1512c", 7: "#cd7942", 8: "#eca469",
  // Amarillos.
  9: "#b88a14", "!": "#e9c23c", "?": "#fff3a0",
  // Oscuros y blanco.
  0: "#1b1620", "%": "#2b2333", "&": "#463b4e", "#": "#ffffff",
};
/** La rampa de un color (lo que se puede pintar de otro color). */
export const rampa = (C) => ({ "(": tono(C, 0.5), ")": tono(C, 0.72), "[": C, "]": tono(C, 1.22), "{": tono(C, 1.45) });
/** Espejo: cada fila sigue al revés (impar: la última letra es el centro; par: se repite). */
export const E = (filas) => filas.map((s) => s + [...s.slice(0, -1)].reverse().join(""));
export const E2 = (filas) => filas.map((s) => s + [...s].reverse().join(""));
/** Repite una fila n veces. */
export const X = (fila, n) => Array(n).fill(fila);

/** De filas de letras a rectangulitos (juntando los de la misma fila y color). */
function rects(filas, pal, ox = 0, oy = 0) {
  let s = "";
  filas.forEach((f, y) => {
    for (let x = 0; x < f.length;) {
      const ch = f[x], c = pal[ch];
      if (!c) { x++; continue; }
      let w = 1;
      while (f[x + w] === ch) w++;
      s += `<rect x="${(ox + x) * PXL}" y="${(oy + y) * PXL}" width="${w * PXL}" height="${PXL}" fill="${c}"/>`;
      x += w;
    }
  });
  return s;
}
const capa = (c, pal) => {
  const P = c.pal ? { ...pal, ...c.pal } : pal;
  let s = c.f ? rects(c.f, P, c.x || 0, c.y || 0) : "";
  if (c.p) s += c.p.map(([x, y, k]) => `<rect x="${x * PXL}" y="${y * PXL}" width="${PXL}" height="${PXL}" fill="${P[k] || k}"/>`).join("");
  if (c.r) s += c.r.map(([x, y, w, h, k]) => `<rect x="${x * PXL}" y="${y * PXL}" width="${w * PXL}" height="${h * PXL}" fill="${P[k] || k}"/>`).join("");
  return c.clase ? `<g class="${c.clase}"${c.t ? ` style="--pxt:${c.t}s"` : ""}>${s}</g>` : s;
};

/** Una cosa dibujada en pixel: `filas` (lo de abajo) y `capas` encima (con o sin clase). */
export function pix(def) {
  const { filas, capas = [], pal: palPropia, ...resto } = def;
  const H = filas.length, W = Math.max(...filas.map((f) => f.length));
  return {
    ...resto, w: W * PXL, h: H * PXL, pixel: true, _filas: filas,
    arte: (e, C) => {
      const pal = { ...PAL, ...(C ? rampa(C) : {}), ...(palPropia || {}) };
      const extra = typeof def.extra === "function" ? def.extra(e || {}, C) : [];
      return `<svg viewBox="0 0 ${W * PXL} ${H * PXL}" aria-hidden="true" shape-rendering="crispEdges">${rects(filas, pal)}${[...capas, ...extra].map((c) => capa(c, pal)).join("")}</svg>`;
    },
  };
}
/** Revisa que todas las filas midan lo mismo (para dibujar sin errores). */
export function revisar(items) {
  const mal = [];
  for (const [k, d] of Object.entries(items)) {
    const l = d._filas || [];
    const w = Math.max(...l.map((f) => f.length));
    l.forEach((f, i) => { if (f.length !== w) mal.push(`${k}: fila ${i} mide ${f.length} (debe ${w})`); });
  }
  return mal;
}
