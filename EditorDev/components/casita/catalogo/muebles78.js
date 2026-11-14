/**
 * (Fase 78) LOS MUEBLES PRINCIPALES EN PIXEL CON VOLUMEN: la cama, el ropero, el buró, el escritorio, el tocador y
 * el baúl de la recámara; el librero y la tele de la sala; el librero alto y el piano del estudio; la tina del baño.
 * Dibujados a mano cuadrito por cuadrito (1 = 4 del mundo) como la cocina de la Fase 75: el FRENTE aquí, y la TAPA
 * (lo de arriba, que se ve en perspectiva) con `tapa(u, z, W, D, v)` —u de izquierda a derecha, z de enfrente a atrás,
 * v el renglón de esa tapa—, así cada mueble tiene su cubierta, su colchón, su teclado o su agua VISTOS DESDE ARRIBA,
 * en vez de ser un dibujo plano estirado hacia atrás. `perfil` dice qué tan hondo va cada franja (la cabecera, la
 * lámpara al fondo del buró, la laptop al fondo del escritorio, el cuerpo del piano atrás del teclado).
 *
 *   · Lo que hace cada mueble (dónde se acuestan o sientan los monitos, sus acciones, sus colores) NO cambia.
 *   · Lo vivo sigue vivo: las puertas del ropero (puerta-i, puerta-d), la pantalla de la laptop y de la tele, la
 *     luz del buró, la tapa y los juguetes del baúl, las notas del piano, la espuma de la tina.
 *   · Las letras son las de la paleta de pixel.js; ( ) [ ] { son la rampa del color elegido; `pal(C)` agrega tonos.
 */
import { pix, rects, PAL, rampa } from "./pixel.js";
import { lienzo, hash, R } from "./lienzo.js";
import { tono, svg } from "./arte.js";
import { conVivo } from "./cocina75.js";

/** Un corazoncito de 5 × 4 cuadritos (x, y: su esquina de arriba a la izquierda). */
function corazon(L, x, y, c) { for (const [dx, dy] of [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]]) L.pon(x + dx, y + dy, c); }
/** Uno chiquito de 3 × 3. */
const corazonChico = (pon, x, y, c) => { for (const [dx, dy] of [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) pon(x + dx, y + dy, c); };
/** ¿Cae (u, z) dentro de un corazón chiquito con esquina en (x, y)? */
const enCorazon = (u, z, x, y) => [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]].some(([dx, dy]) => u === x + dx && z === y + dy);
/** Una estrellita de 5 × 5. */
function estrella(L, x, y, c) { for (const [dx, dy] of [[2, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [0, 4], [4, 4]]) L.pon(x + dx, y + dy, c); }

/* ═════════════ LA CAMA (63 × 34, 20 de hondo): cabecera acolchada en un extremo, colchón visto desde arriba con sus
   dos almohadas y la cobija del color elegido, marco de madera y patitas. ═════════════ */
const PAL_CAMA = (C) => ({ "<": tono(C, 0.86), ">": tono(C, 0.64) });
function cama() {
  const L = lienzo(63, 34);
  // La cabecera: acolchada del color, con su orilla redondita, botoncitos y su corazón.
  L.caja(0, 3, 9, 28, "<"); L.caja(1, 2, 8, 2, "<"); L.caja(2, 1, 7, 1, "<");
  for (let y = 3; y <= 27; y++) L.pon(0, y, "["); L.caja(2, 1, 7, 1, "["); L.pon(1, 2, "[");
  for (let y = 2; y <= 28; y++) L.pon(9, y, ">"); L.caja(0, 28, 9, 28, ">");
  for (const [x, y] of [[3, 6], [6, 6], [3, 11], [6, 11], [3, 21], [6, 21], [3, 26], [6, 26]]) L.pon(x, y, ">");
  corazon(L, 2, 14, "#");
  // El colchón con su sábana (de frente: su costado blanco), y abajo el marco de madera.
  L.caja(10, 15, 59, 24, "#"); L.caja(10, 15, 59, 15, "C"); L.caja(10, 24, 59, 24, "k"); for (let y = 16; y <= 23; y++) L.pon(59, y, "k");
  L.caja(10, 25, 59, 28, "d"); L.caja(10, 25, 59, 25, "e"); L.caja(10, 28, 59, 28, "c");
  // Las almohadas (de frente se ve su orillita gordita).
  L.caja(11, 13, 24, 14, "#"); L.caja(11, 14, 24, 14, "j"); L.pon(11, 13, "k"); L.pon(24, 13, "j");
  // La cobija que cae por el frente desde la orilla del colchón, con su doblez y sus corazoncitos.
  L.caja(27, 15, 59, 27, "["); L.caja(27, 15, 59, 15, "]"); L.caja(27, 27, 59, 27, ")"); for (let y = 16; y <= 26; y++) L.pon(27, y, ")");
  for (const [x, y] of [[33, 21], [43, 23], [53, 21]]) corazonChico(L.pon, x, y, "{");
  // Las patitas, en las esquinas.
  L.patas([11, 56], 29, 33, "c", "b", "a");
  return L.filas();
}
function tapaCama(u, z, W, D, v) {
  if (u <= 9) return u === 0 || u === 9 || z === 0 || z === D - 1 ? "<" : "[";          // la cabecera (su canto)
  if (v === 13) {                                                                          // las almohadas (dos, a lo hondo)
    const a = z <= 9, z0 = a ? 2 : 10, z1 = a ? 9 : 17;
    if (u === 11 || u === 24 || z === z0 || z === z1) return "j";
    if (u === 23 || z === z1 - 1) return "k";
    return u <= 13 && z <= z0 + 2 ? "C" : "#";
  }
  if (u >= 27) {                                                                           // la cobija
    if (u === 27) return ")";
    if (u === 28) return "]";
    if (z === D - 1) return ")";
    for (const [x, y] of [[33, 4], [44, 12], [55, 4], [38, 15], [50, 16]]) if (enCorazon(u, z, x, y)) return "{";
    return "[";
  }
  if (u === 25 || u === 26) return "C";                                                    // la sábana doblada
  return z === D - 1 ? "k" : "#";
}
/** La cobija por encima (viva, en su capa de enfrente): tapa a los monitos acostados hasta el pecho. */
function frenteCama(e, C) {
  const y = (z) => 60 - Math.round(z * 1.44);
  let s = R(108, 32, 132, 28, C) + R(108, 32, 4, 28, tono(C, 0.72)) + R(112, 32, 4, 28, tono(C, 1.22)) + R(116, 56, 124, 4, tono(C, 1.2));
  for (const [x, z] of [[33, 4], [44, 12], [55, 4], [38, 15], [50, 16]]) { const px = x * 4, py = y(z + 2); s += R(px, py, 4, 2, tono(C, 1.45)) + R(px + 8, py, 4, 2, tono(C, 1.45)) + R(px, py + 2, 12, 2, tono(C, 1.45)) + R(px + 4, py + 4, 4, 2, tono(C, 1.45)); }
  return svg(252, 136, `<g class="cobija" shape-rendering="crispEdges">${s}</g>`);
}

/* ═════════════ EL ROPERO (32 × 54): cornisa, dos puertas con tablero y corazón (se abren), por dentro su ropita. ═════════════ */
function ropero() {
  const L = lienzo(32, 54);
  // La cornisa (sale un cuadrito de cada lado) y el cuerpo.
  L.caja(1, 0, 30, 0, "{"); L.caja(0, 1, 31, 1, "]"); L.caja(0, 2, 31, 2, ")");
  // (El marco es de dos cuadritos: así su costado toma el color del mueble y no el del hueco de adentro.)
  L.caja(1, 3, 30, 49, "["); for (let y = 3; y <= 49; y++) { L.pon(1, y, "]"); L.pon(30, y, ")"); }
  // Por dentro (se ve al abrir): el hueco, el tubo, la ropita colgada, una repisa con ropa doblada y los zapatitos.
  L.caja(3, 4, 28, 47, "%"); L.caja(3, 4, 28, 4, "0"); L.caja(3, 8, 28, 8, "h"); L.caja(3, 9, 28, 9, "g");
  [["I", "H", 4], ["S", "R", 10], ["!", "9", 16], ["s", "r", 22]].forEach(([c, s, x]) => { L.pon(x + 2, 9, "j"); L.caja(x, 10, x + 4, 23, c); L.caja(x + 4, 10, x + 4, 23, s); L.caja(x, 10, x + 4, 10, s); L.caja(x + 1, 11, x + 1, 22, c === "!" ? "?" : "#", "ISs!"); L.caja(x, 24, x + 4, 24, s); });
  L.caja(3, 30, 28, 30, "e"); L.caja(3, 31, 28, 31, "c");
  [["J", 4], ["B", 11], ["?", 18], ["N", 24]].forEach(([c, x]) => { L.caja(x, 26, x + 4, 29, c); L.caja(x, 26, x + 4, 26, "#"); });
  L.caja(3, 42, 28, 42, "e"); L.caja(3, 43, 28, 43, "c");
  [["w", 5], ["A", 12], ["H", 19], ["0", 25]].forEach(([c, x]) => { L.caja(x, 45, x + 2, 46, c); L.pon(x + 1, 45, "#"); });
  // La base: su riel, el zoclo y las patitas.
  L.caja(1, 48, 30, 49, ")"); L.caja(2, 50, 29, 51, "("); L.patas([2, 28], 52, 53, "a", "0");
  return L.filas();
}
/** Una puerta del ropero (viva): tablero con realce, tablero hundido, corazón y perilla de latón. */
function puertaRopero(a, b, knobX) {
  const L = lienzo(32, 54);
  L.realce(a, 4, b, 47, "[", "]", ")"); L.hundido(a + 2, 7, b - 2, 44, "[", ")", "{");
  corazon(L, a + 4, 13, "#"); L.pon(a + 5, 13, "{"); L.pon(a + 8, 13, "{");
  L.pon(knobX, 25, "o"); L.pon(knobX, 26, "m");
  return L.filas();
}
const tapaRopero = (u, z, W, D) => (z === D - 1 || u === 0 || u === W - 1 ? "]" : "{");

/* ═════════════ EL BURÓ (19 × 40): su lamparita rosa atrás, un librito encima, dos cajoncitos de madera. ═════════════ */
function buro() {
  const L = lienzo(19, 40);
  // La lámpara: pantalla rosa (más oscura a la derecha), cuello de metal y base.
  for (let y = 1; y <= 9; y++) { const a = 6 - Math.round(((y - 1) / 8) * 2), b = 12 + Math.round(((y - 1) / 8) * 2); L.caja(a, y, b, y, "J"); L.caja(b - 1, y, b, y, "I"); L.pon(a, y, "#"); }
  L.caja(4, 9, 14, 9, "H"); corazonChico(L.pon, 8, 4, "I");
  L.caja(9, 10, 9, 20, "i"); L.caja(10, 10, 10, 20, "h"); L.caja(6, 20, 13, 21, "h"); L.caja(7, 20, 12, 20, "i"); L.pon(6, 20, "."); L.pon(13, 20, ".");
  // El mueble: tapa de madera clara, cuerpo, dos cajones crema con perilla y patitas.
  L.caja(1, 22, 17, 22, "f"); L.caja(1, 23, 17, 37, "d"); for (let y = 23; y <= 37; y++) { L.pon(1, y, "e"); L.pon(17, y, "c"); }
  L.realce(3, 25, 15, 29, "C", "#", "E"); L.pon(9, 27, "c"); L.realce(3, 31, 15, 35, "C", "#", "E"); L.pon(9, 33, "c");
  L.caja(1, 37, 17, 37, "c"); L.patas([2, 15], 38, 39, "b", "a");
  return L.filas();
}
function tapaBuro(u, z, W, D, v) {
  if (v <= 9) return v === 1 ? "J" : "I";
  if (v <= 21) return "i";
  // La tapa del buró: madera clara con sus vetas; encima, a la izquierda, un librito azul con sus hojas.
  if (u >= 2 && u <= 5 && z >= 2 && z <= 6) return z === 6 || u === 5 ? "k" : u === 2 ? "A" : "B";
  return z === D - 1 ? "c" : hash(u, z) < 0.09 ? "d" : "e";
}

/* ═════════════ EL ESCRITORIO (40 × 29, 18 de hondo): cubierta de madera con la laptop atrás, lapicera, cajonera y panel. ═════════════ */
function escritorio() {
  const L = lienzo(40, 29);
  // La laptop: pantalla de pie (el vidrio vivo va encima) y su teclado.
  L.caja(19, 1, 34, 9, "j"); L.caja(19, 1, 34, 1, "k"); L.caja(34, 1, 34, 9, "i"); L.caja(20, 2, 33, 8, "%");
  L.caja(16, 9, 35, 9, "j"); L.caja(16, 10, 35, 10, "h");
  // La lapicera rosa con sus lápices.
  L.caja(4, 6, 7, 9, "I"); L.caja(4, 6, 7, 6, "J"); L.pon(7, 9, "H");
  L.caja(5, 2, 5, 5, "!"); L.pon(5, 2, "?"); L.caja(6, 3, 6, 5, "s"); L.pon(6, 3, "t"); L.pon(4, 4, "H"); L.pon(4, 5, "H");
  // La cubierta (tres renglones: filo claro, madera, canto en sombra).
  L.caja(0, 10, 39, 10, "f", ".j"); L.caja(0, 11, 39, 11, "e"); L.caja(0, 12, 39, 12, "c");
  // La cajonera de la izquierda con sus dos cajones crema, y el panel de la derecha.
  L.caja(2, 13, 14, 27, "d"); for (let y = 13; y <= 27; y++) { L.pon(2, y, "e"); L.pon(14, y, "c"); } L.caja(2, 27, 14, 27, "b");
  L.realce(4, 15, 12, 19, "C", "#", "E"); L.pon(8, 17, "c"); L.realce(4, 21, 12, 25, "C", "#", "E"); L.pon(8, 23, "c");
  L.caja(34, 13, 37, 27, "d"); for (let y = 13; y <= 27; y++) { L.pon(34, y, "e"); L.pon(37, y, "c"); } L.caja(34, 27, 37, 27, "b");
  return L.filas();
}
function tapaEscritorio(u, z, W, D, v) {
  if (v <= 1) return "k";
  if (v <= 5) return u === 5 ? "9" : "r";
  if (v <= 8) return "J";
  if (v === 9) return (u + z) % 2 ? "h" : "i";
  return z === D - 1 ? "c" : hash(u, z) < 0.09 ? "d" : "e";
}

/* ═════════════ EL TOCADOR (32 × 44): espejo ovalado atrás con su corazón, perfumitos, cubierta y dos cajones. ═════════════ */
const PAL_TOCADOR = (C) => ({ "<": tono(C, 0.84) });
function tocador() {
  const L = lienzo(32, 44);
  L.elipse(15.5, 12, 9.6, 11.4, "Q", "<"); L.elipse(15.5, 12, 8.3, 10.1, "Q", "P");
  for (let y = 4; y <= 13; y++) L.pon(8 + Math.round((y - 4) * 0.3), y, "#", "QP"); L.linea(10, 5, 14, 3, "#", "QP");
  L.caja(11, 15, 18, 18, "P", "QP"); corazonChico(L.pon, 14, 0, "I"); L.pon(15, 1, "H");
  L.caja(14, 22, 17, 23, "<");
  // Los perfumitos: uno rosa con tapa dorada y uno lila con tapita blanca.
  L.caja(3, 19, 5, 23, "I"); L.pon(3, 19, "J"); L.caja(3, 18, 5, 18, "n"); L.pon(4, 17, "m"); L.pon(5, 23, "H");
  L.caja(26, 20, 28, 23, "M"); L.pon(26, 20, "N"); L.caja(26, 19, 28, 19, "#"); L.pon(28, 23, "L");
  // La cubierta y el cuerpo con sus dos cajones.
  L.caja(1, 24, 30, 24, "]"); L.caja(1, 25, 30, 25, "["); L.caja(1, 26, 30, 26, ")");
  L.caja(2, 27, 29, 40, "["); for (let y = 27; y <= 40; y++) { L.pon(2, y, "]"); L.pon(29, y, ")"); } L.caja(2, 40, 29, 40, ")");
  L.realce(4, 29, 14, 38, "]", "{", ")"); L.pon(13, 33, "c"); L.realce(17, 29, 27, 38, "]", "{", ")"); L.pon(18, 33, "c");
  L.patas([4, 26], 41, 43, "c", "b", "a");
  return L.filas();
}
function tapaTocador(u, z, W, D, v) {
  if (v < 24) return v <= 1 ? "I" : v <= 18 ? "<" : u <= 6 ? "n" : "#";
  if (u >= 20 && u <= 25 && z >= 2 && z <= 5) return u === 20 || z === 5 ? "E" : "C";    // un cepillito crema
  return z === D - 1 ? ")" : hash(u, z) < 0.05 ? "{" : "]";
}

/* ═════════════ EL BAÚL (29 × 20, 14 de hondo): caja de madera con sus cinchos del color, estrella y corazón; la tapa
   abombada se abre (viva) y asoman los juguetes. ═════════════ */
function baul() {
  const L = lienzo(29, 20);
  L.caja(0, 7, 28, 19, "d"); for (let y = 7; y <= 18; y++) { L.pon(0, y, "e"); L.pon(28, y, "c"); } L.caja(0, 19, 28, 19, "b");
  L.caja(0, 9, 28, 10, "["); L.caja(0, 9, 28, 9, "]"); L.caja(3, 7, 4, 18, "["); L.caja(24, 7, 25, 18, "["); L.pon(3, 7, "]"); L.pon(24, 7, "]");
  L.caja(13, 11, 15, 13, "o"); L.pon(13, 11, "?"); L.pon(15, 13, "l"); L.pon(14, 13, "0");
  estrella(L, 6, 12, "["); corazon(L, 18, 12, "H");
  return L.filas();
}
function tapaBaul() {
  const L = lienzo(29, 20);
  L.caja(6, 0, 22, 0, "f"); L.caja(3, 1, 25, 1, "f"); L.caja(1, 2, 27, 2, "e"); L.caja(0, 3, 28, 5, "e"); L.caja(0, 4, 28, 4, "["); L.caja(0, 6, 28, 6, "c");
  for (let y = 2; y <= 5; y++) { L.pon(3, y, "["); L.pon(4, y, "["); L.pon(24, y, "["); L.pon(25, y, "["); } L.pon(3, 1, "]"); L.pon(4, 1, "]");
  return L.filas();
}
function juguetesBaul() {
  const L = lienzo(29, 20);
  L.elipse(10, 4.5, 1.6, 1.6, "I", "H"); L.pon(9, 3, "J");
  L.caja(14, 2, 17, 5, "S"); L.caja(14, 2, 17, 2, "Q"); L.pon(17, 5, "R"); L.pon(15, 3, "#");
  estrella(L, 20, 1, "!"); L.pon(22, 3, "?");
  return L.filas();
}
const tapaBaulDentro = (u, z, W, D) => (u === 0 || u === W - 1 || z === 0 || z === D - 1 ? "c" : u === 1 || u === W - 2 || z === 1 || z === D - 2 ? "&" : "%");

/* ═════════════ LOS LIBREROS: cuerpo de madera con sus costados, repisas con su canto, libros de pie, plantita, cuadrito y tacita. ═════════════ */
const LIBROS = [["I", "H"], ["S", "R"], ["!", "9"], ["M", "L"], ["s", "r"], ["x", "w"], ["B", "A"], ["N", "M"], ["Z", "Y"], ["J", "I"]];
function librero(W, H, repisas, semilla, desde = 0) {
  const L = lienzo(W, H);
  L.caja(0, desde, W - 1, H - 1, "c");
  L.caja(0, desde, W - 1, desde, "f"); L.caja(0, desde + 1, W - 1, desde + 1, "e");
  for (let y = desde + 2; y <= H - 3; y++) { L.pon(0, y, "e"); L.pon(1, y, "d"); L.pon(W - 2, y, "d"); L.pon(W - 1, y, "b"); }
  L.caja(0, H - 2, W - 1, H - 2, "b"); L.caja(0, H - 1, W - 1, H - 1, "a");
  const tabla = (y) => { L.caja(1, y, W - 2, y, "e"); L.caja(1, y + 1, W - 2, y + 1, "c"); };
  // Los libros de cada repisa (de pie, de anchos y altos distintos), con algún adorno entre ellos.
  const fila = (y, n, x0 = 3, hasta = W - 4) => {
    let x = x0;
    for (let i = 0; i < 40 && x <= hasta - 1; i++) {
      const r = hash(i + n * 7, semilla), w = r < 0.35 ? 2 : 3, h = 6 + Math.floor(hash(i * 3 + n, semilla + 1) * 4), [c, s] = LIBROS[(i + n + semilla) % LIBROS.length];
      if (x + w - 1 > hasta) break;
      L.caja(x, y - h, x + w - 1, y - 1, c); L.caja(x + w - 1, y - h, x + w - 1, y - 1, s); L.pon(x, y - h, "#"); L.pon(x + (w > 2 ? 1 : 0), y - h + 2, "#", c);
      x += w;
    }
  };
  repisas.forEach((y, i) => tabla(y));
  return { L, fila, tabla };
}
function libreroSala() {
  const W = 33, H = 51, { L, fila } = librero(W, H, [15, 28, 41], 3);
  fila(15, 0, 3, 19); L.caja(22, 8, 29, 14, "7"); L.caja(22, 8, 29, 8, "8"); L.pon(29, 14, "6"); for (const [x, y, c] of [[24, 7, "s"], [26, 6, "r"], [23, 5, "s"], [27, 5, "t"], [25, 4, "r"], [28, 7, "s"]]) L.pon(x, y, c);
  fila(28, 1, 3, 15); L.realce(19, 20, 29, 27, "C", "#", "E"); L.caja(21, 22, 27, 25, "J"); corazonChico(L.pon, 23, 22, "H");
  fila(41, 2, 3, 12); L.caja(16, 36, 24, 40, "e"); L.caja(16, 36, 24, 36, "f"); L.caja(16, 40, 24, 40, "c"); L.caja(26, 35, 29, 40, "P"); L.caja(26, 35, 29, 35, "Q"); L.pon(29, 40, "O"); L.pon(27, 37, "#");
  fila(48, 3, 3, 29);
  return L.filas();
}
function libreroAlto() {
  const W = 29, H = 54, { L, fila } = librero(W, H, [15, 27, 38, 50], 5, 3);
  // La matita de encima (en su maceta naranja) y las repisas.
  L.caja(10, 1, 18, 3, "7"); L.caja(10, 1, 18, 1, "8"); L.pon(18, 3, "6"); for (const [x, y, c] of [[12, 0, "s"], [15, 0, "r"], [17, 0, "s"], [13, 1, "t"], [11, 0, "r"]]) L.pon(x, y, c);
  fila(15, 0, 3, 25);
  fila(27, 1, 3, 13); L.realce(17, 20, 25, 26, "C", "#", "E"); L.caja(19, 22, 23, 24, "J"); corazonChico(L.pon, 20, 22, "H");
  L.elipse(7, 33, 2.4, 2.4, "P", "O"); L.pon(6, 32, "#"); fila(38, 2, 12, 25);
  fila(50, 3, 3, 25);
  return L.filas();
}
const tapaLibrero = (u, z, W, D, v) => (v <= 3 && u >= 9 && u <= 19 ? (hash(u, z) < 0.5 ? "s" : "r") : z === D - 1 ? "c" : hash(u, z) < 0.08 ? "e" : "f");

/* ═════════════ LA TELE (38 × 39, 19 de hondo): la pantalla atrás sobre su mueble de madera con dos puertas. ═════════════ */
function tele() {
  const L = lienzo(38, 39);
  L.caja(1, 0, 36, 24, "&"); for (const [x, y] of [[1, 0], [36, 0], [1, 24], [36, 24]]) L.pon(x, y, ".");
  L.caja(2, 0, 35, 0, "h"); for (let y = 1; y <= 23; y++) L.pon(1, y, "h"); L.caja(2, 24, 35, 24, "%");
  L.caja(3, 2, 34, 22, "%"); L.pon(33, 23, "I");
  L.caja(16, 25, 21, 26, "g"); L.pon(16, 25, "h"); L.pon(16, 26, "h");
  L.caja(1, 27, 36, 27, "f"); L.caja(1, 28, 36, 28, "e"); L.caja(1, 29, 36, 37, "d"); for (let y = 29; y <= 37; y++) { L.pon(1, y, "e"); L.pon(36, y, "c"); }
  L.realce(3, 30, 17, 36, "e", "f", "c"); L.pon(16, 33, "c"); L.realce(20, 30, 34, 36, "e", "f", "c"); L.pon(21, 33, "c");
  L.caja(1, 38, 36, 38, "b");
  return L.filas();
}
function tapaTele(u, z, W, D, v) {
  if (v <= 24) return u === 1 || u === W - 2 ? "%" : z === D - 1 ? "%" : "&";
  if (v <= 26) return "h";
  return z === D - 1 ? "c" : hash(u, z) < 0.09 ? "e" : "f";
}

/* ═════════════ EL PIANO (39 × 38, 19 de hondo): cuerpo alto atrás, partitura, teclado que sale adelante (visto desde
   arriba, con sus teclas negras), patas y pedales de latón. ═════════════ */
const NEGRAS = (i) => [0, 1, 3, 4, 5].includes(i % 7);
function piano() {
  const L = lienzo(39, 38);
  // La partitura de pie sobre la tapa.
  L.caja(12, 0, 26, 7, "C"); L.caja(12, 0, 26, 0, "#"); L.caja(26, 0, 26, 7, "E"); for (const y of [2, 4, 6]) L.caja(13, y, 25, y, "E"); for (const [x, y] of [[15, 3], [19, 2], [22, 5], [17, 5]]) L.pon(x, y, "0");
  // El cuerpo de arriba con su tablero hundido y su corazón.
  L.caja(1, 4, 37, 14, "["); L.caja(1, 4, 37, 4, "]"); for (let y = 4; y <= 14; y++) { L.pon(1, y, "]"); L.pon(37, y, ")"); }
  L.hundido(4, 7, 34, 13, "[", ")", "{"); corazonChico(L.pon, 18, 9, "(");
  // El teclado: la tapita, las teclas blancas con sus negras, y su canto.
  L.caja(1, 15, 37, 15, ")");
  for (let u = 2; u <= 36; u++) { const sep = (u - 2) % 3 === 2; for (let y = 16; y <= 19; y++) L.pon(u, y, sep ? "k" : "#"); }
  for (let i = 0; i < 12; i++) if (NEGRAS(i)) { const u = 2 + i * 3 + 2; L.pon(u, 16, "%"); L.pon(u, 17, "%"); L.pon(u, 18, "0"); }
  L.caja(1, 20, 37, 20, ")"); L.pon(1, 16, "]"); L.pon(37, 16, ")");
  // El cuerpo de abajo, las patas y los pedales.
  L.caja(1, 21, 37, 28, "["); for (let y = 21; y <= 28; y++) { L.pon(1, y, "]"); L.pon(37, y, ")"); } L.hundido(4, 22, 34, 27, "[", ")", "{"); L.caja(1, 28, 37, 28, ")");
  for (const x of [2, 34]) { L.caja(x, 29, x + 2, 37, "["); L.caja(x + 2, 29, x + 2, 37, ")"); L.caja(x, 37, x + 2, 37, "("); }
  L.caja(16, 34, 17, 35, "n"); L.caja(20, 34, 21, 35, "n"); L.caja(16, 36, 17, 36, "m"); L.caja(20, 36, 21, 36, "m");
  return L.filas();
}
function tapaPiano(u, z, W, D, v) {
  if (v <= 3) return "C";
  if (v <= 14) return z === D - 1 || u === 1 || u === W - 2 ? ")" : "]";
  if (v === 15) {                                                                  // el teclado visto desde arriba
    const sep = (u - 2) % 3 === 2, i = Math.floor((u - 2) / 3), zN = Math.floor(D * 0.42);
    if (sep && NEGRAS(i) && z >= zN - 3 && z <= zN - 1) return "%";
    return sep ? "k" : z >= zN - 1 ? "k" : "#";
  }
  return "]";
}

/* ═════════════ LA TINA (58 × 31, 19 de hondo): su borde, el agua adentro (vista desde arriba), su llave de metal, el
   corazón al frente y sus patitas de latón. ═════════════ */
function tina() {
  const L = lienzo(58, 31);
  // La llave: el tubo que sube, la curva y la boquilla, y su placa sobre el borde.
  L.caja(50, 1, 51, 9, "i"); L.caja(51, 2, 51, 9, "h"); L.caja(50, 1, 53, 1, "j"); L.pon(54, 1, "i"); L.pon(54, 2, "h"); L.pon(54, 3, "g");
  L.caja(47, 9, 53, 9, "j"); L.pon(47, 9, "k"); L.pon(53, 9, "h"); L.caja(46, 6, 47, 7, "j"); L.pon(46, 6, "k");
  // El borde y la panza (redondita abajo).
  L.caja(2, 10, 55, 10, "]"); L.caja(1, 11, 56, 11, ")");
  L.caja(1, 12, 56, 23, "["); L.caja(2, 24, 55, 24, "["); L.caja(4, 25, 53, 25, "["); L.caja(7, 26, 50, 26, "[");
  for (let y = 12; y <= 23; y++) { L.pon(1, y, "]"); L.pon(56, y, ")"); L.pon(55, y, ")"); }
  L.caja(7, 26, 50, 26, ")"); for (const [x, y] of [[2, 24], [55, 24], [3, 24], [4, 25], [5, 25], [53, 25], [52, 25], [54, 24], [6, 26], [51, 26]]) L.pon(x, y, ")");
  corazon(L, 26, 17, "I");
  // Las patitas de latón (como garritas).
  L.caja(7, 27, 9, 29, "n"); L.caja(9, 27, 9, 29, "m"); L.caja(7, 30, 9, 30, "l"); L.caja(48, 27, 50, 29, "n"); L.caja(50, 27, 50, 29, "m"); L.caja(48, 30, 50, 30, "l");
  return L.filas();
}
function tapaTina(u, z, W, D, v) {
  if (v < 10) return v === 9 ? "j" : v === 1 ? "j" : "i";
  const esquina = (u <= 5 || u >= 52) && (z <= 2 || z >= D - 3), dentro = u >= 4 && u <= 53 && z >= 2 && z <= D - 3 && !esquina;
  if (!dentro) return z === D - 1 ? ")" : (u >= 4 && u <= 53 && (z === 1 || z === D - 2)) || ((u === 3 || u === 54) && z >= 2 && z <= D - 3) ? "k" : "]";
  if (z === 2 || u === 4) return "S";
  return hash(u, z) < 0.07 ? "Q" : "P";
}
/** Lo de enfrente de la tina (lo que tapa al monito que se baña): su panza de enfrente y, viva, la espuma. */
function frenteTina(filas) {
  const ESPUMA = `<g class="espuma">${[34, 62, 92, 124, 154, 184].map((x, i) => `<circle cx="${x}" cy="${40 - (i % 2) * 5}" r="${13 + (i % 3) * 2}" fill="#fff" stroke="#4b2e42" stroke-opacity=".16" stroke-width="2"/>`).join("")}<circle cx="80" cy="22" r="5" fill="#fff" opacity=".9"/><circle cx="150" cy="18" r="4" fill="#fff" opacity=".9"/></g>`;
  const pared = filas.map((f, y) => (y >= 11 && y <= 26 ? f : "."));
  return (e, C) => svg(232, 124, `<g shape-rendering="crispEdges">${rects(pared, { ...PAL, ...rampa(C || "#ffffff") })}</g>${ESPUMA}`);
}

/** Los redibujos: k → función que recibe lo de antes (para conservar lo vivo) y regresa lo nuevo. */
export const MUEBLES78 = {
  cama: () => ({ ...pix({ filas: cama(), pal: PAL_CAMA, tapa: tapaCama, palTapa: PAL_CAMA, hondo: 80, perfil: [[52, 60, 0.1, 0.9]], forma: "caja" }), frente: frenteCama }),
  ropero: () => pix({ filas: ropero(), capas: [{ clase: "puerta-i", f: puertaRopero(3, 15, 14) }, { clase: "puerta-d", f: puertaRopero(16, 28, 17) }], tapa: tapaRopero, forma: "caja" }),
  buro: (viejo) => conVivo({ filas: buro(), tapa: tapaBuro, perfil: [[0, 88, 0.45, 0.9]], forma: "caja" }, viejo.arte),
  escritorio: (viejo) => conVivo({ filas: escritorio(), tapa: tapaEscritorio, hondo: 72, perfil: [[0, 36, 0.58, 0.76], [36, 40, 0.3, 0.76], [52, 112, 0.02, 0.98]] }, viejo.arte),
  tocador: () => pix({ filas: tocador(), pal: PAL_TOCADOR, tapa: tapaTocador, palTapa: PAL_TOCADOR, perfil: [[0, 96, 0.72, 0.9]], forma: "caja" }),
  baul: () => pix({ filas: baul(), capas: [{ clase: "tapa", f: tapaBaul() }, { clase: "juguetes", f: juguetesBaul() }], tapa: tapaBaulDentro, hondo: 56, forma: "caja" }),
  librero: () => pix({ filas: libreroSala(), tapa: tapaLibrero, forma: "caja" }),
  librero_alto: () => pix({ filas: libreroAlto(), tapa: tapaLibrero, forma: "caja", perfil: [[0, 12, 0.3, 0.7]] }),
  tele: (viejo) => conVivo({ filas: tele(), tapa: tapaTele, hondo: 76, perfil: [[0, 96, 0.3, 0.95], [96, 108, 0.45, 0.75]], forma: "caja" }, viejo.arte),
  piano: (viejo) => conVivo({ filas: piano(), tapa: tapaPiano, hondo: 76, perfil: [[0, 16, 0.55, 0.7], [16, 60, 0.42, 1], [84, 116, 0.42, 1], [116, 152, 0, 0.22], [116, 152, 0.72, 0.94]], forma: "caja" }, viejo.arte),
  tina: () => { const filas = tina(); return { ...pix({ filas, tapa: tapaTina, hondo: 76, perfil: [[0, 40, 0.4, 0.6]], forma: "caja" }), frente: frenteTina(filas) }; },
};
