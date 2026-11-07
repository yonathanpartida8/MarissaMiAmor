import { FONDO_3D, FRENTE_3D, PARED_3D, PISO as PISO_M, H as H_M, TECHO_ATRAS as TB, TECHO_FRENTE as TF } from "./cuartos.js";
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

/* ═══ (Fase 74) LOS CUARTOS EN PIXEL DE VERDAD: tapices, pisos y lambrín dibujados con su relieve, en cuadritos de 4
 *  (los mismos que los muebles y los monitos, así todo el cuarto se ve del mismo pixel art). La luz viene de arriba
 *  a la izquierda: lo que sobresale tiene su filo claro arriba y su sombrita abajo a la derecha; lo hundido, al revés. ═══ */
const PXR = 4;
/** Un número fijo (0…1) por cuadrito, para que la variación (vetas, motitas, tono de cada tabla) no cambie nunca. */
const hsh = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const comoUrlR = (k, w, h, dibujar) => {
  if (cache.has(k)) return cache.get(k);
  const L = lienzo(w, h); dibujar(L);
  const cv = L.listo();
  const r = { url: `url("${cv.toDataURL("image/png")}")`, w: w * PXR, h: h * PXR, cv, tw: w, th: h };
  cache.set(k, r);
  return r;
};
/** Una figurita con su relieve: relleno, su brillito arriba a la izquierda y su sombrita abajo a la derecha. */
function figuraRelieve(pon, f, x, y, rel, luz, sombra) {
  const en = (i, j) => f[j]?.[i] === "X";
  f.forEach((fila, j) => [...fila].forEach((ch, i) => {
    if (ch !== "X") return;
    pon(x + i, y + j, !en(i - 1, j) || !en(i, j - 1) ? luz : rel);
    if (!en(i + 1, j + 1) && !en(i + 1, j) && !en(i, j + 1)) pon(x + i + 1, y + j + 1, sombra);
  }));
}
const FIG = {
  corazon: [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
  chico: [".X.X.", "XXXXX", ".XXX.", "..X.."],
  estrella: ["...X...", "..XXX..", "XXXXXXX", ".XXXXX.", ".XX.XX.", "X.....X"],
  brillo: [".X.", "XXX", ".X."],
  punto: [".XX.", "XXXX", "XXXX", ".XX."],
  flor: [".X.", "X.X", ".X."],
};
export function texPared(color, patron) {
  return css(comoUrlR(`p|${color}|${patron}|74`, 24, 24, ({ pon, caja }) => {
    const B = rgb(color), L = cla(B, 0.5), L2 = cla(B, 0.78), D = osc(B, 0.955), D2 = osc(B, 0.9), S = osc(B, 0.86);
    caja(0, 0, 24, 24, B);
    // El papel: motitas finitas (no plano), siempre en el mismo lugar.
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const h = hsh(x, y, 7); if (h < 0.07) pon(x, y, D); else if (h > 0.975) pon(x, y, cla(B, 0.18)); }
    if (patron === "liso") { for (const [x, y] of [[5, 5], [17, 17]]) figuraRelieve(pon, FIG.flor, x, y, L, L2, D2); for (const [x, y] of [[17, 6], [6, 18]]) pon(x, y, L); }
    if (patron === "rayas") for (let y = 0; y < 24; y++) {
      // Una raya ancha clarita con su filo, una finita, y su sombrita (como papel con relieve).
      for (let x = 2; x < 8; x++) pon(x, y, x === 2 ? L2 : L);
      pon(8, y, S); pon(14, y, D2); pon(15, y, cla(B, 0.3));
      if (y % 8 === 4) { pon(19, y, L2); pon(20, y, L); pon(19, y + 1, L); }   // puntitos bordados entre rayas
    }
    if (patron === "puntos") { for (const [x, y] of [[2, 2], [14, 14]]) figuraRelieve(pon, FIG.punto, x, y, L, L2, S); for (const [x, y] of [[14, 3], [3, 15]]) figuraRelieve(pon, FIG.brillo, x, y, cla(B, 0.35), L, D2); }
    if (patron === "corazones") { figuraRelieve(pon, FIG.corazon, 2, 3, L, L2, S); figuraRelieve(pon, FIG.chico, 15, 15, cla(B, 0.38), L, D2); pon(17, 5, L); pon(5, 18, L); }
    if (patron === "estrellas") { figuraRelieve(pon, FIG.estrella, 2, 2, L, L2, S); figuraRelieve(pon, FIG.brillo, 15, 15, L, L2, D2); pon(19, 4, L2); pon(5, 19, L); pon(20, 12, cla(B, 0.3)); }
    if (patron === "ladrillo") {
      // Ladrillos de 12 × 6 cuadritos, cada uno de su tono, con su filo claro, su sombrita y la mezcla entre ellos.
      const M = cla(B, 0.62);
      for (let f = 0; f < 4; f++) for (let b = -1; b < 2; b++) {
        const x0 = b * 12 + (f % 2) * 6, y0 = f * 6, t = 0.94 + hsh(b + 5, f, 3) * 0.1, K = osc(B, t), KL = cla(K, 0.22), KS = osc(K, 0.9);
        for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) {
          const X = ((x0 + x) % 24 + 24) % 24, Y = y0 + y;
          if (y === 5 || x === 11) { pon(X, Y, M); continue; }
          pon(X, Y, y === 0 || x === 0 ? KL : y === 4 || x === 10 ? KS : hsh(X, Y, 9) < 0.08 ? osc(K, 0.93) : K);
        }
      }
    }
    if (patron === "azulejo") {
      // Azulejos de 12 × 12 con su junta, su bisel y una florecita en medio.
      const J = cla(B, 0.7);
      for (const [x0, y0] of [[0, 0], [12, 0], [0, 12], [12, 12]]) {
        for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
          const X = x0 + x, Y = y0 + y;
          if (x === 11 || y === 11) { pon(X, Y, J); continue; }
          pon(X, Y, x === 0 || y === 0 ? L2 : x === 10 || y === 10 ? D2 : (x + y) % 9 === 0 ? cla(B, 0.12) : B);
        }
        figuraRelieve(pon, FIG.flor, x0 + 4, y0 + 4, L, L2, D2); pon(x0 + 5, y0 + 5, cla(B, 0.25));
      }
    }
    if (patron === "cuadros") {
      // Cuadritos de mantel (vichy): las bandas se cruzan y donde se encuentran se ve más oscuro, con su tejido.
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
        const bx = Math.floor(x / 6) % 2 === 0, by = Math.floor(y / 6) % 2 === 0;
        const k = bx && by ? osc(B, 0.95) : bx || by ? B : cla(B, 0.55);
        pon(x, y, (x + y) % 2 && (bx || by) ? mez(k, cla(B, 0.55), 0.18) : k);
      }
    }
  }));
}

/* ── Los pisos ── */
const PISOS = {
  madera: ["#e6bf96", "#dcb288", "#b98a62", "#efcfaa"], clara: ["#f6dfc2", "#ecd2b2", "#d4b48f", "#fbead3"],
  duela: ["#d9a878", "#cf9c6b", "#9a6a46", "#e6b98b"],
};
export function texPiso(tipo) {
  if (PISOS[tipo]) return css(comoUrlR(`f|${tipo}|74`, 64, 16, ({ pon }) => {
    // Tablas de 4 cuadritos de ancho, de largos distintos y escalonadas: cada tabla de su tono, con su filo claro, la
    // rendija oscura entre tablas, vetas y de vez en cuando un nudito.
    const [a, b, s, g] = PISOS[tipo].map(rgb), tonos = [a, b, mez(a, b, 0.5), osc(a, 0.965)];
    const LARGOS = [[0, 22, 40], [10, 34, 52], [4, 28, 46], [16, 40, 58]];
    for (let fila = 0; fila < 4; fila++) {
      const y0 = fila * 4, cortes = LARGOS[fila];
      for (let x = 0; x < 64; x++) {
        const tabla = cortes.filter((c) => c <= x).length + fila * 5, k = tonos[Math.floor(hsh(tabla, fila, 11) * 4)];
        const junta = cortes.includes(x);
        for (let y = 0; y < 4; y++) {
          let c = k;
          if (y === 3) c = s;                                            // la rendija entre filas
          else if (junta) c = osc(s, 1.08);                              // la junta entre tablas
          else if (cortes.includes(x - 1)) c = cla(k, 0.2);              // el filo clarito junto a la junta
          else if (y === 0) c = cla(k, 0.16);                            // la luz sobre el filo de la tabla
          else if (hsh(x, y0 + y, 13) < 0.11) c = osc(k, 0.93);          // vetas
          else if (hsh(x, y0 + y, 17) > 0.965) c = g;
          if (tipo === "duela" && y === 1 && x % 12 === 6) c = osc(k, 0.8);   // los clavitos de la terraza
          pon(x, y0 + y, c);
        }
      }
      // Un nudito por fila (con su anillo).
      const nx = 6 + Math.floor(hsh(fila, 3, 19) * 50);
      pon(nx, y0 + 1, osc(a, 0.78)); pon(nx + 1, y0 + 1, osc(a, 0.86)); pon(nx - 1, y0 + 1, osc(a, 0.92)); pon(nx, y0 + 2, osc(a, 0.92));
    }
  }));
  if (tipo === "mosaico") return css(comoUrlR("f|mosaico|74", 16, 16, ({ pon }) => {
    const A = rgb("#ffffff"), B = rgb("#dcefff"), G = rgb("#bcd3e6"), LA = rgb("#ffffff"), SA = rgb("#e8eef5"), LB = rgb("#eaf6ff"), SB = rgb("#c9e1f4");
    for (const [x0, y0, blanco] of [[0, 0, 1], [8, 8, 1], [8, 0, 0], [0, 8, 0]]) for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const X = x0 + x, Y = y0 + y;
      if (x === 7 || y === 7) { pon(X, Y, G); continue; }
      pon(X, Y, x === 0 || y === 0 ? (blanco ? LA : LB) : x === 6 || y === 6 ? (blanco ? SA : SB) : blanco ? A : B);
      if (blanco && ((x === 3 && y >= 2 && y <= 4) || (y === 3 && x >= 2 && x <= 4))) pon(X, Y, x === 3 && y === 3 ? rgb("#ffd6e6") : LB);   // la florecita
    }
  }));
  if (tipo === "alfombra") return css(comoUrlR("f|alfombra|74", 12, 12, ({ pon, caja }) => {
    const A = rgb("#f6c6d8"); caja(0, 0, 12, 12, A);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const h = hsh(x, y, 23); if ((x + y) % 2 === 0) pon(x, y, osc(A, 0.965)); if (h > 0.93) pon(x, y, cla(A, 0.3)); }
    figuraRelieve(pon, FIG.chico, 1, 2, cla(A, 0.35), cla(A, 0.6), osc(A, 0.9)); pon(8, 8, rgb("#ffffff")); pon(9, 8, cla(A, 0.6));
  }));
  if (tipo === "barro") return css(comoUrlR("f|barro|74", 16, 12, ({ pon }) => {
    const A = rgb("#f0b49b"), G = rgb("#fbe0d2");
    for (let f = 0; f < 2; f++) for (let b = -1; b < 2; b++) {
      const x0 = b * 8 + (f % 2) * 4, y0 = f * 6, K = osc(A, 0.94 + hsh(b + 4, f, 29) * 0.1);
      for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) {
        const X = ((x0 + x) % 16 + 16) % 16, Y = y0 + y;
        pon(X, Y, x === 7 || y === 5 ? G : x === 0 || y === 0 ? cla(K, 0.2) : x === 6 || y === 4 ? osc(K, 0.9) : hsh(X, Y, 31) < 0.09 ? osc(K, 0.93) : K);
      }
    }
  }));
  // Pasto (también lo de afuera): matitas claras y oscuras, que se repiten sin que se note.
  return css(comoUrlR("f|pasto|74", 24, 16, ({ pon, caja }) => {
    const A = rgb("#8fd59e"), D = rgb("#6fbf84"), L = rgb("#b5e8bd");
    caja(0, 0, 24, 16, A);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 24; x++) if (hsh(x, y, 37) < 0.1) pon(x, y, osc(A, 0.95));
    for (const [x, y] of [[2, 3], [9, 1], [15, 6], [20, 2], [5, 11], [12, 13], [18, 10], [22, 14]]) { pon(x, y, D); pon(x + 1, y - 1, D); pon(x + 2, y, D); pon(x + 1, y, L); }
    for (const [x, y] of [[7, 7], [14, 3], [1, 14], [19, 8]]) { pon(x, y, [255, 214, 232]); pon(x, y + 1, D); }   // florecitas
  }));
}
/**
 * (Fase 74) EL LAMBRÍN de abajo de las paredes, con su zoclo: un pasamanos con su filo y su sombrita, tableros
 * hundidos (sombra arriba y a la izquierda, luz abajo y a la derecha, como molduras de verdad) y el zoclo con su
 * remate, su ranura y su orilla. Del color de la pared, aclarado (como madera pintada). 24 × 29 cuadritos: de
 * y = 316 a y = 432 del mundo.
 */
export const LAMBRIN_ARRIBA = 316, LAMBRIN_ALTO = 116;
export function texLambrin(color) {
  return comoUrlR(`lam|${color}|74`, 24, 29, ({ pon }) => {
    const P = mez(rgb(color), [255, 252, 246], 0.68), PL = cla(P, 0.55), PD = osc(P, 0.92), PDD = osc(P, 0.82), LIN = osc(P, 0.7);
    for (let y = 0; y < 29; y++) for (let x = 0; x < 24; x++) {
      let c = P;
      if (y === 0) c = PL; else if (y === 1) c = P; else if (y === 2) c = PD; else if (y === 3) c = PDD;          // el pasamanos
      else if (y <= 21) {
        const enT = x >= 3 && x <= 20 && y >= 6 && y <= 19;                                                    // el tablero hundido
        if (enT) c = x === 3 || y === 6 ? PDD : x === 20 || y === 19 ? PL : x === 4 || y === 7 ? PD : hsh(x, y, 41) < 0.05 ? PD : cla(P, 0.12);
        else if (x === 23) c = PD;                                                                             // la junta entre tableros
        else if (x === 0) c = cla(P, 0.3);
        else if (y === 4) c = osc(P, 0.95);                                                                    // sombrita bajo el pasamanos
      }
      else if (y === 22) c = PL;                                                                               // el remate del zoclo
      else if (y === 23 || y === 24) c = P;
      else if (y === 25) c = PDD;                                                                              // su ranura
      else if (y === 26 || y === 27) c = PD;
      else c = LIN;                                                                                            // su orilla con el piso
      pon(x, y, c);
    }
  });
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
/** (Fase 69) EL SOL, más lindo: un disco con su degradado a mano (centro casi blanco, orilla dorada), su brillito arriba
 *  a la izquierda, un halo de cuadritos que se desvanece y, aparte, dos juegos de rayos que se turnan (destellan).
 *  En la tarde es más grande y naranja, con las franjas de atardecer de abajo (como en los juegos retro). */
export function texSol(tarde = false) {
  return comoUrl(`sol69|${tarde}`, 40, 40, ({ pon }) => {
    const C = 20, R = tarde ? 11 : 9;
    const ramp = (tarde ? ["#fff1c8", "#ffd27a", "#ffa25a", "#f2704f", "#d9534f"] : ["#fffdf0", "#fff3a6", "#ffe066", "#ffc845", "#f5a524"]).map(rgb);
    // Halo: cuadritos sueltos que se van desvaneciendo (sin difuminar: sigue siendo pixel).
    for (let y = -19; y <= 19; y++) for (let x = -19; x <= 19; x++) {
      const d = Math.hypot(x, y);
      if (d > R + 0.5 && d < R + 7) { const t = (d - R) / 7, a = Math.round(120 * (1 - t) ** 1.6); if (a > 8 && ((x + y) % 2 === 0 || t < 0.35)) pon(C + x, C + y, ramp[1], a); }
    }
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      if (d > R + 0.35) continue;
      // La luz viene de arriba a la izquierda: el degradado se corre hacia allá.
      const l = Math.hypot(x + R * 0.32, y + R * 0.32) / (R * 1.32);
      let k = l < 0.28 ? 0 : l < 0.52 ? 1 : l < 0.74 ? 2 : l < 0.92 ? 3 : 4;
      if (d > R - 0.8) k = 4;
      // Franjas de atardecer: en la mitad de abajo, rayitas del color del cielo (huecos) cada vez más gruesas.
      if (tarde && y > 1) { const fr = [3, 6, 8, 10]; if (fr.includes(y) || (y === 11)) continue; }
      pon(C + x, C + y, ramp[k]);
    }
    // El brillito.
    for (const [x, y] of [[-4, -5], [-5, -4], [-3, -5], [-5, -3], [-4, -4]]) pon(C + x, C + y, rgb("#ffffff"), 235);
  });
}
/** Los rayos del sol (dos juegos que se turnan: rectos y diagonales), para que destelle sin girar. */
export function texRayos(tarde = false, b = 0) {
  return comoUrl(`rayos69|${tarde}|${b}`, 40, 40, ({ pon }) => {
    const C = 20, R0 = tarde ? 13 : 11, K = rgb(tarde ? "#ffb26b" : "#ffd24a"), L = rgb(tarde ? "#ffd9a8" : "#fff2a8");
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + (b ? Math.PI / 8 : 0), largo = i % 2 ? 3 : 5;
      for (let r = R0; r < R0 + largo; r++) {
        const x = C + Math.cos(a) * r, y = C + Math.sin(a) * r;
        pon(x, y, r === R0 ? L : K, Math.round(255 * (1 - (r - R0) / (largo + 1))));
      }
    }
  });
}
/** La fase de la luna HOY (0 = nueva, 0.5 = llena), con el mes lunar de 29.53 días contado desde una luna nueva conocida. */
export function faseLuna(fecha = new Date()) {
  const dias = (fecha.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5, m = 29.530588853;
  return (((dias % m) + m) % m) / m;
}
/** (Fase 69) LA LUNA, más linda: con sus cráteres (orilla oscura y centro claro), su sombra según la fase de hoy (lo que no
 *  le da el sol se ve tenue, como en la vida real: «luz de la Tierra») y un halo suave de cuadritos. */
export function texLuna(fase = faseLuna()) {
  // (Nunca casi toda oscura: a lo más un cuarto creciente/menguante gordito, para que siempre se vea bonita.)
  const q = Math.max(3, Math.min(13, Math.round(fase * 16) % 16));
  return comoUrl(`luna69|${q}`, 34, 34, ({ pon }) => {
    const C = 17, R = 9.5, f = q / 16;
    const A = rgb("#fff8dc"), B = rgb("#f2e4b3"), M = rgb("#dccb93"), O = rgb("#b9a875"), N = rgb("#7b7fae"), N2 = rgb("#9094c0");
    for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) {
      const d = Math.hypot(x, y);
      if (d > R + 0.5 && d < R + 6) { const t = (d - R) / 6, a = Math.round(70 * (1 - t) ** 2); if (a > 6 && (x + y) % 2 === 0) pon(C + x, C + y, A, a); }
    }
    // ¿Le da el sol? La sombra es una elipse que avanza de derecha a izquierda (hemisferio norte).
    const iluminado = (x, y) => {
      const yy = y / R, ancho = Math.sqrt(Math.max(0, 1 - yy * yy)), xx = x / R;
      const k = Math.cos(f * 2 * Math.PI);   // 1 nueva, -1 llena
      return f < 0.5 ? xx > k * ancho : xx < -k * ancho;
    };
    const craters = [[-3, -3, 2.2], [3, 2, 2.6], [-2, 4, 1.5], [4, -4, 1.3], [-5, 1, 1.1], [1, -1, 1]];
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) {
      const d = Math.hypot(x, y);
      if (d > R + 0.3) continue;
      let k = d > R - 1 ? M : (x + y) < -6 ? A : B;
      for (const [cx, cy, cr] of craters) { const dc = Math.hypot(x - cx, y - cy); if (dc <= cr) k = dc > cr - 0.9 && (x - cx) + (y - cy) > 0 ? O : M; }
      if (!iluminado(x, y)) k = d > R - 1 ? N2 : (x + y) % 3 === 0 ? N2 : N;
      pon(C + x, C + y, k);
    }
    for (const [x, y] of [[-5, -6], [-6, -5], [-4, -6]]) if (iluminado(x, y)) pon(C + x, C + y, rgb("#ffffff"), 220);
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
const ARRIBA3D = -330, ABAJO3D = 800, PXC = 4;   // (Fase 74: cuadritos de 4, como los muebles)   // (hasta 800: abajo del cuarto se sigue viendo el piso)
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
  const tp = datosDe(cache.get(cfg.pared)), tf = datosDe(cache.get(cfg.piso)), tl = datosDe(cfg.lambrin ? cache.get(cfg.lambrin) : null);
  const ZOC = [255, 250, 247], ZOC2 = [232, 214, 222], LINEA = [120, 80, 105];
  const put = (i, j, k, f = 1, a = 255) => { const o = (j * W + i) * 4; d[o] = Math.min(255, k[0] * f); d[o + 1] = Math.min(255, k[1] * f); d[o + 2] = Math.min(255, k[2] * f); d[o + 3] = a; };
  // (Fase 62) La puerta, en la pared de su lado: de 0.24 a 0.58 de hondo y poquito más alta que el monito (160), con su marco claro,
  // su orilla, dos tableros hundidos, la manija del lado de enfrente y la rendija de abajo. Abierta: el pasillo oscurito.
  const U0 = 0.24, U1 = 0.58, HT = 160;   // (Fase 71: de tamaño normal; antes 0.16…0.66 y 186 de alto)
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
    if (Math.abs(u - ku) < 0.011 && Math.abs(hgt - 74) < 4) return [255, 214, 120];   // la manija
    if (Math.abs(u - ku) < 0.017 && Math.abs(hgt - 74) < 6.5) return [170, 116, 60];
    if (hgt < 4) return HOJA.map((v) => v * 0.62);                                     // la rendija de abajo
    let f = 0.88 + 0.14 * fu + 0.04 * (hgt / HT);
    const a = U0 + 0.075, b = U1 - 0.075, m = (a + b) / 2, en = (u0, u1, h0, h1) => u > u0 && u < u1 && hgt > h0 && hgt < h1;
    const arriba = en(a, m - 0.012, 88, HT - 20) || en(m + 0.012, b, 88, HT - 20), abajo = en(a, m - 0.012, 16, 76) || en(m + 0.012, b, 16, 76);
    if (arriba || abajo) { f *= 0.9; if (en(a, b, abajo ? 72 : HT - 24, abajo ? 76 : HT - 20)) f *= 1.12; }   // tablero hundido con su brillito arriba
    return HOJA.map((v) => v * f);
  };
  const pixel = (i, j) => {
    const X = (i + 0.5) * PXC, Y = ARRIBA3D + (j + 0.5) * PXC, b = BAY[(j % 4) * 4 + (i % 4)] / 16;
    // (Fase 62) El corte de la pared (enfrente, a los lados) va en otro lado, encima de los monitos: aquí queda vacío.
    if (X < FL || X > w - FL) return put(i, j, [0, 0, 0], 1, 0);
    // (Fase 71) EL TECHO: arriba de la pared de atrás y de las de los lados (la orilla de arriba de cada pared va de
    // TECHO_ATRAS, al fondo, a TECHO_FRENTE, enfrente). Tablitas claras en perspectiva y su moldura donde se juntan.
    let aoT = 0;   // (Fase 74) la sombrita que hace la moldura del techo sobre la pared (0…1)
    if (Y < TB + 30) {
      const se = Math.abs(X - cx) / (w / 2), u = se <= B ? 0 : Math.min(1, (se - B) / (F - B)), yT = TB + u * (TF - TB);
      if (Y < yT) {
        const t = Math.min(1, Math.max(0, (TB - Y) / (TB - TF))), sc = B + (F - B) * t, xl = cx + (X - cx) / sc;
        let f = 0.88 + 0.12 * t;
        if (yT - Y < 7) f *= 0.9;                                   // sombrita junto a la moldura
        const tabla = ((xl % 46) + 46) % 46;
        if (tabla < 2.2) return put(i, j, [214, 194, 196], f);       // la junta entre tablitas
        return put(i, j, tabla < 8 ? [255, 250, 246] : [249, 240, 236], f + (b - 0.5) * 0.03);
      }
      const m = Y - yT;
      // (Fase 74) La moldura con su perfil: su línea, el bocel clarito, la media caña en sombra, otro filo y su orilla.
      if (m < 14) return put(i, j, m < 2 ? LINEA : m < 5 ? [255, 253, 250] : m < 8 ? [236, 222, 228] : m < 10 ? [250, 244, 246] : m < 12 ? [214, 194, 204] : [150, 120, 140], 1, m >= 12 ? 190 : 255);
      if (m < 30) aoT = 1 - (m - 14) / 16;
    }
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
      // (Fase 74) Sombritas de rincón: junto a las esquinas y bajo la moldura, en escalones tramados (no un degradado).
      const ae = e < 18 ? 1 - e / 18 : 0, a = Math.max(ae * 52, aoT * 44);
      if (a > 0) { const esc = a > 34 ? 1 : a > 18 ? (b > 0.3 ? 0.72 : 0.5) : b > 0.55 ? 0.5 : 0; if (esc) return put(i, j, [60, 30, 50], 1, Math.round(a * esc)); }
      return put(i, j, [0, 0, 0], 1, 0);
    }
    // Las paredes de los lados.
    const lado = X < cx ? -1 : 1, se = Math.min(F, Math.max(B, (lado < 0 ? cx - X : X - cx) / (w / 2))), u = (se - B) / (F - B), Ye = PISO_M + u * (H_M - PISO_M);
    const hgt = (Ye - Y) / se;
    if (hgt < 0) return put(i, j, [0, 0, 0], 1, 0);
    const pu = puertaEn(lado, u, hgt);
    if (pu) return put(i, j, pu);
    let f = (lado < 0 ? 0.9 : 0.95) * (0.92 + 0.08 * u) * (1 - 0.1 * aoT);
    if (hgt < 1.8) return put(i, j, LINEA, 0.9);
    // (Fase 74) El lambrín con su zoclo también en las paredes de los lados (en perspectiva, como el de atrás).
    if (tl && hgt < LAMBRIN_ALTO) return put(i, j, muestra(tl, (u * PARED_3D) / PXC, (LAMBRIN_ALTO - hgt) / PXC), f + 0.04);
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
export const claveTapiz = (color, patron) => `p|${color}|${patron}|74`;
export const clavePiso = (tipo) => (PISOS[tipo] || ["mosaico", "alfombra", "barro"].includes(tipo) ? `f|${tipo}|74` : "f|pasto|74");
export const claveLambrin = (color) => `lam|${color}|74`;

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

/* ═══ (Fase 71) EL SUBTERRÁNEO: lo de enfrente del piso (donde ya no se acomoda) es un corte de la tierra, como en una
 *  casita de muñecas sobre su terreno: la orilla del piso, capas de tierra, barro y roca, raíces, piedras, huesitos,
 *  gusanitos, cristales, un cráneo de dinosaurio y un gnomo enterrado. Cada cuarto el suyo (sale siempre igual: su
 *  semilla es su nombre). Un cuadrito = 4 del mundo, como los muebles. ═══ */
const CRANEO = [
  "...........oooooo.......",
  "........ooobbbbbbo......",
  "......oobbbbbbbbbboo....",
  "....oobbbbbbbbbbbbbbo...",
  "...obbbbbbbbbbbdddsbbo..",
  "..obbddbbbbbbbbddddsbbo.",
  ".obbbddbbbbbsbbbdddbbbo.",
  "obbbbbbbbbbbbssbbbbbbbo.",
  "otbtbtbtbtbtbbbbbbbbbo..",
  ".ododododododssssssso...",
  "..otbtbtbtbtbbbbbbbo....",
  "...obbbbbbbbbbbbbbo.....",
  "....oooooooooooooo......",
];
const GNOMO = [
  "......r....",
  ".....rr....",
  ".....rrR...",
  "....rrrR...",
  "....rrrrR..",
  "...rrrrrR..",
  "..rrrrrrrR.",
  "..ffffffff.",
  "..feffffef.",
  "..ffffnfff.",
  ".wwwffffwww",
  ".wwwwwwwwww",
  "..wwwwwwww.",
  "..bwwwwwwb.",
  ".bbbwwwwbbb",
  ".bbbbwwbbbb",
  "..bbbbbbbb.",
];
const HUESO = ["bb...bb", ".bbbbb.", "bb...bb"];
const PAL_SUB = { o: [96, 80, 62], b: [240, 229, 204], s: [208, 192, 160], d: [56, 42, 44], t: [255, 251, 242], r: [214, 66, 60], R: [158, 44, 48], f: [246, 204, 168], e: [44, 32, 44], n: [238, 150, 130], w: [246, 246, 246] };
PAL_SUB.b2 = [70, 112, 192];
export function texSubsuelo(k, wm) {
  const w = Math.max(40, Math.ceil(wm / 4)), h = 110;
  return comoUrl(`sub|${k}|${w}`, w, h, ({ pon, caja }) => {
    let sem = [...k].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const R = () => (sem = (Math.imul(sem, 1664525) + 1013904223) >>> 0) / 4294967296;
    const fase = R() * 6, fase2 = R() * 6;
    const capa = (x, y) => {
      const l1 = 16 + Math.sin(x * 0.09 + fase) * 2, l2 = 38 + Math.sin(x * 0.06 + fase2) * 3, l3 = 46 + Math.sin(x * 0.07 + fase) * 2;
      return y < l1 ? [112, 78, 52] : y < l2 ? [96, 66, 47] : y < l3 ? [146, 94, 62] : [80, 62, 58];
    };
    const ocupado = new Uint8Array(w * h), marca = (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h) ocupado[y * w + x] = 1; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = capa(x, y), b = BAY[(y % 4) * 4 + (x % 4)] / 16, r = R();
      let k2 = c;
      // En el cambio de capa, tramado (como en los juegos de antes).
      const c2 = capa(x, y + 2);
      if (c2 !== c && b > 0.5) k2 = c2;
      if (r < 0.035) k2 = cla(k2, 0.16); else if (r < 0.07) k2 = osc(k2, 0.78);
      pon(x, y, k2);
    }
    // La orilla del piso (el corte de la duela) y su sombrita.
    caja(0, 0, w, 1, [92, 60, 52]); caja(0, 1, w, 1, [176, 128, 92]); caja(0, 2, w, 1, [140, 98, 72]); caja(0, 3, w, 1, [70, 48, 40]);
    // Piedritas sueltas.
    for (let i = 0; i < w * 0.35; i++) { const x = Math.floor(R() * w), y = 5 + Math.floor(R() * (h - 8)); pon(x, y, [150, 142, 150]); pon(x + 1, y, [118, 112, 122]); pon(x, y - 1, [182, 176, 186]); }
    // Raíces que bajan del piso.
    for (let i = 0; i < Math.max(3, w / 30); i++) {
      let x = 2 + R() * (w - 4), y = 4;
      const largo = 6 + R() * 16;
      for (let t = 0; t < largo; t++) { pon(x, y, [158, 118, 84]); if (R() < 0.3) pon(x + (R() < 0.5 ? -1 : 1), y, [130, 96, 68]); x += R() < 0.33 ? -1 : R() < 0.5 ? 1 : 0; y += 1; }
    }
    // Un sprite (con su contorno de tierra oscura alrededor) donde haya lugar.
    const dibuja = (spr, x0, y0, pal = PAL_SUB) => {
      spr.forEach((fila, j) => [...fila].forEach((ch, i) => {
        if (ch === ".") return;
        const k3 = pal[ch]; if (!k3) return;
        pon(x0 + i, y0 + j, k3); marca(x0 + i, y0 + j);
      }));
      spr.forEach((fila, j) => [...fila].forEach((ch, i) => {
        if (ch === ".") return;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x0 + i + dx, yy = y0 + j + dy, f = spr[j + dy]?.[i + dx]; if ((f == null || f === ".") && !ocupado[yy * w + xx]) pon(xx, yy, osc(capa(xx, yy), 0.62)); }
      }));
    };
    const PAL_GNOMO = { ...PAL_SUB, b: PAL_SUB.b2 };
    const libre = (x0, y0, ww, hh) => { for (let y = y0 - 1; y < y0 + hh + 1; y++) for (let x = x0 - 1; x < x0 + ww + 1; x++) if (x < 0 || y < 4 || x >= w || y >= h || ocupado[y * w + x]) return false; return true; };
    const poner = (ww, hh, y0, y1, f, intentos = 30) => { for (let i = 0; i < intentos; i++) { const x = Math.floor(R() * (w - ww - 2)) + 1, y = Math.floor(y0 + R() * (y1 - y0)); if (libre(x, y, ww, hh)) { f(x, y); return true; } } return false; };
    // El cráneo de dinosaurio (a veces mirando al otro lado) y el gnomo enterrado.
    const espejo = (spr) => spr.map((f) => [...f].reverse().join(""));
    poner(24, 13, 8, 22, (x, y) => dibuja(R() < 0.5 ? CRANEO : espejo(CRANEO), x, y));
    poner(11, 17, 6, 14, (x, y) => dibuja(GNOMO, x, y, PAL_GNOMO));
    poner(24, 13, 52, 90, (x, y) => dibuja(R() < 0.5 ? CRANEO : espejo(CRANEO), x, y));   // otro fósil, más hondo
    // Piedras grandes (con su luz arriba a la izquierda).
    for (let n = 0; n < 6 + Math.floor(w / 45); n++) {
      const rx = 2 + Math.floor(R() * 5), ry = 1 + Math.floor(R() * 3);
      poner(rx * 2 + 1, ry * 2 + 1, 6, h - 10, (x0, y0) => {
        for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
          const q = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2; if (q > 1) continue;
          const borde = (x / (rx - 0.2)) ** 2 + (y / (ry - 0.2)) ** 2 > 1;
          pon(x0 + rx + x, y0 + ry + y, borde ? [70, 64, 76] : x + y < -1 ? [176, 170, 184] : x + y > 1 ? [104, 98, 112] : [138, 132, 146]); marca(x0 + rx + x, y0 + ry + y);
        }
      });
    }
    // Huesitos, cristalitos y gusanitos.
    for (let n = 0; n < 2; n++) poner(7, 3, 10, h - 6, (x, y) => dibuja(HUESO, x, y));
    poner(5, 5, 30, h - 8, (x, y) => { const C = R() < 0.5 ? [[255, 160, 200], [200, 90, 150], [255, 220, 236]] : [[150, 200, 255], [80, 130, 210], [220, 240, 255]]; for (const [dx, dy, t] of [[2, 0, 2], [1, 1, 0], [2, 1, 0], [3, 1, 1], [0, 2, 0], [1, 2, 0], [2, 2, 1], [3, 2, 1], [4, 2, 1], [1, 3, 1], [2, 3, 1], [3, 3, 1]]) { pon(x + dx, y + dy, C[t]); marca(x + dx, y + dy); } });
    for (let n = 0; n < 3; n++) poner(4, 2, 5, 40, (x, y) => { pon(x, y, [236, 140, 160]); pon(x + 1, y + 1, [236, 140, 160]); pon(x + 2, y + 1, [220, 120, 146]); pon(x + 3, y, [236, 140, 160]); pon(x + 3, y - 1, [60, 40, 44]); });
  });
}

/* ═══ (Fase 72) LA PUERTA EN PIXEL: su marco (con moldura y un corazoncito) y su hoja del color del cuarto (tableros,
 *  ventanita de corazón y perilla de latón). Un cuadrito = 4 del mundo; la hoja sigue abriéndose en 3D. ═══ */
export function texPuerta(color = "#f2b1c6") {
  const C = /^#?([0-9a-f]{6})$/i.test(color || "") ? rgb(color.startsWith("#") ? color : "#" + color) : [242, 177, 198];
  const f = (k) => osc(C, k), cl = (t) => cla(C, t);
  const marco = comoUrl("pmarco", 21, 42, ({ pon, caja }) => {
    const O = [150, 110, 130], L = [255, 250, 246], M = [240, 226, 230], S = [206, 182, 194];
    caja(0, 0, 21, 3, M); caja(0, 0, 21, 1, O); caja(0, 1, 21, 1, L);
    caja(0, 3, 2, 39, L); caja(19, 3, 2, 39, S); for (let y = 0; y < 42; y++) { pon(0, y, O); pon(20, y, O); }
    caja(2, 2, 17, 1, S);
    for (const [x, y] of [[9, 1], [11, 1], [9, 2], [10, 2], [11, 2], [10, 3]]) pon(x, y > 2 ? 2 : y, [236, 120, 160]);
    pon(10, 1, [255, 170, 200]);
  });
  const hoja = comoUrl("phoja|" + C.join(","), 17, 39, ({ pon, caja }) => {
    caja(0, 0, 17, 39, C);
    for (let y = 0; y < 39; y++) { pon(0, y, f(0.62)); pon(16, y, f(0.62)); pon(1, y, cl(0.18)); pon(15, y, f(0.88)); }
    caja(0, 0, 17, 1, f(0.62)); caja(0, 38, 17, 1, f(0.5));
    const tablero = (y0, y1) => {
      caja(3, y0, 11, y1 - y0 + 1, cl(0.08));
      for (let x = 3; x <= 13; x++) { pon(x, y0, f(0.82)); pon(x, y1, cl(0.22)); }
      for (let y = y0; y <= y1; y++) { pon(3, y, f(0.82)); pon(13, y, cl(0.22)); }
    };
    tablero(3, 17); tablero(21, 35);
    // La ventanita de corazón (vidrio claro) en el tablero de arriba.
    const cor = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
    cor.forEach((fila, j) => [...fila].forEach((ch, i) => { if (ch === "X") pon(5 + i, 7 + j, j < 2 && i < 3 ? [255, 250, 252] : [255, 228, 240]); }));
    // La perilla.
    pon(13, 19, [255, 220, 130]); pon(14, 19, [214, 160, 70]); pon(13, 20, [214, 160, 70]); pon(14, 20, [170, 116, 60]);
  });
  return { marco: marco.url, hoja: hoja.url };
}
