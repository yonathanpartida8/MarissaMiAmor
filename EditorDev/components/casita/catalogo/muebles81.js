/**
 * (Fase 81) MUEBLES QUE SE NOTA QUÉ SON: los que, chiquitos o girados, no se reconocían («la mesa que no parece
 * mesa»), redibujados con detalle, cuadrito por cuadrito (1 = 4 del mundo), con su luz arriba a la izquierda, su
 * sombra abajo a la derecha, sus vetas y sus adornos:
 *
 *   · LA MESA de la cocina: de madera, con su canto grueso, faldón tallado, cuatro patas torneadas y un camino de mesa
 *     del color elegido que cuelga por enfrente; vista desde arriba, sus tablas con vetas y el camino a lo largo.
 *   · LA MESITA de la sala: tapa con su canto, un cajoncito con jaladera de latón, patas curvas y una repisa abajo
 *     con revistas y una canastita.
 *   · LA MESITA REDONDA: de pedestal torneado con su pie, y un mantel corto con encaje (ya no un tambor).
 *   · EL TOCADISCOS: en su mueble de madera, con la bocina de tela y los discos guardados; arriba, visto desde arriba,
 *     el disco con sus surcos y su etiqueta, el plato, el brazo y sus perillas.
 *   · LA LÁMPARA DE PIE: pantalla plisada con su ribete y sus borlitas, poste de latón con anillos y su base.
 *   · LA LÁMPARA DE LAVA: vidrio del color elegido con su brillo, tapa y base cromadas.
 *
 * Con la forma «mesa» (girar.js) las mesas giradas tienen sus patas en las cuatro esquinas y su tapa de lado a lado.
 * Lo que hace cada cosa (dónde van los platos, la música, la luz, sus colores) no cambia; lo vivo sigue vivo.
 */
import { pix } from "./pixel.js";
import { lienzo } from "./lienzo.js";
import { conVivo } from "./cocina75.js";

/** Un corazoncito de 5 × 4. */
const corazon = (L, x, y, c) => { for (const [dx, dy] of [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]]) L.pon(x + dx, y + dy, c); };
const enCorazonChico = (u, z, x, y) => [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]].some(([dx, dy]) => u === x + dx && z === y + dy);
/** Una pata torneada: de arriba abajo, el ancho y los colores de cada renglón (la luz a la izquierda). */
function pataTorneada(L, x, y0, h, der = false) {
  // [desde x, colores]: bloque de arriba, collar, bulbo, cuello, fuste, anillo, pie y su sombrita en el piso.
  const perfil = [];
  for (let i = 0; i < 4; i++) perfil.push([0, "ddc"]);
  perfil.push([0, "bba"]);
  for (let i = 0; i < 3; i++) perfil.push([0, i === 0 ? "fec" : "edc"]);
  perfil.push([0, "ccb"]);
  const fuste = h - perfil.length - 3;
  for (let i = 0; i < fuste; i++) perfil.push([der ? 0 : 1, i === 0 ? "dc" : "ec"]);
  perfil.push([0, "edc"], [0, "ccb"], [0, "baa"]);
  perfil.forEach(([dx, cols], i) => { [...cols].forEach((c, j) => L.pon(x + dx + j, y0 + i, c)); });
}

/* ═════════════ LA MESA DE LA COCINA (44 × 26, 29 de hondo) ═════════════ */
function mesa() {
  const L = lienzo(44, 26);
  // La tapa: su canto grueso con luz arriba, sus vetas y la sombra de abajo.
  L.caja(1, 7, 42, 7, "f"); L.caja(0, 8, 43, 8, "e"); L.caja(0, 9, 43, 9, "d"); L.caja(1, 10, 42, 10, "b");
  L.pon(0, 8, "f"); L.pon(43, 8, "d"); L.pon(43, 9, "c");
  for (let x = 2; x < 42; x++) { if ((x * 5) % 13 < 3) L.pon(x, 8, "d"); if ((x * 7 + 4) % 17 < 2) L.pon(x, 9, "c"); }
  // El faldón tallado entre las patas: moldura, una rombito cada tantito y su sombra.
  L.caja(4, 11, 39, 11, "c"); L.caja(4, 12, 39, 12, "d"); L.caja(4, 13, 39, 13, "b");
  for (let x = 7; x <= 36; x += 6) { L.pon(x, 12, "f"); L.pon(x - 1, 12, "e"); L.pon(x + 1, 12, "e"); }
  // Las patas torneadas (las de enfrente; las de atrás quedan justo detrás).
  pataTorneada(L, 2, 10, 16); pataTorneada(L, 39, 10, 16, true);
  // El camino de mesa (del color elegido): cae por enfrente, con su orilla, su corazón bordado y sus borlitas.
  L.caja(15, 7, 28, 7, "]"); L.caja(15, 8, 28, 12, "[");
  for (let y = 8; y <= 12; y++) { L.pon(15, y, "]"); L.pon(28, y, ")"); }
  L.caja(15, 13, 28, 13, ")"); for (let x = 16; x <= 27; x += 2) L.pon(x, 13, "(");
  corazon(L, 19, 9, "{"); L.pon(20, 9, "#");
  return L.filas();
}
function tapaMesa(u, z, W, D) {
  // El camino de mesa a lo largo (de enfrente a atrás) con sus corazoncitos bordados.
  if (u >= 15 && u <= 28) {
    if (u === 15) return "]";
    if (u === 28) return ")";
    for (const zz of [4, 13, 22]) if (enCorazonChico(u, z, 20, zz)) return "{";
    return u === 16 ? "{" : "[";
  }
  return tablas(u, z, D, 6);
}
/** Tablas de madera vistas desde arriba (de lado a lado): su filo de luz, su junta, rayitas de veta y algún nudito. */
function tablas(u, z, D, ancho) {
  // (Suave: girada, una raya clara junto a una oscura se ve picadita; así sólo hay la junta y unas vetas largas.)
  if (z === 0) return "f";
  if (z === D - 1) return "d";
  const t = Math.floor(z / ancho), r = z % ancho;
  if (r === ancho - 1) return "d";
  if (r === 2 && ((u + t * 9) % 19) < 6) return "d";                          // la veta: rayitas largas
  return "e";
}
/** El florero de la mesa (vivo: se quita cuando hay platos): jarrón de vidrio con tulipanes y hojitas. */
const FLORERO = [{ clase: "adorno", p: [
  // Los tulipanes.
  [19, 0, "I"], [20, 0, "J"], [19, 1, "H"], [20, 1, "I"], [22, 0, "!"], [23, 0, "?"], [22, 1, "9"], [23, 1, "!"], [25, 1, "I"], [25, 0, "J"],
  [20, 2, "r"], [22, 2, "r"], [24, 2, "s"], [21, 2, "s"], [18, 2, "s"], [25, 2, "r"],
  // El jarrón.
  [20, 3, "Q"], [21, 3, "P"], [22, 3, "P"], [23, 3, "O"], [19, 4, "Q"], [20, 4, "#"], [21, 4, "P"], [22, 4, "P"], [23, 4, "O"], [24, 4, "O"],
  [19, 5, "P"], [20, 5, "Q"], [21, 5, "P"], [22, 5, "P"], [23, 5, "P"], [24, 5, "O"], [20, 6, "O"], [21, 6, "O"], [22, 6, "O"], [23, 6, "R"],
] }];

/* ═════════════ LA MESITA DE LA SALA (38 × 18, 22 de hondo) ═════════════ */
function mesita() {
  const L = lienzo(38, 18);
  // La tapa (delgada) con su canto: luz arriba, rayitas de veta y su sombrita.
  L.caja(1, 5, 36, 5, "f"); L.caja(0, 6, 37, 6, "e"); L.caja(1, 7, 36, 7, "c");
  L.pon(0, 6, "f"); L.pon(37, 6, "d");
  for (let x = 2; x < 36; x++) if ((x * 5) % 13 < 3) L.pon(x, 6, "d");
  // El faldón (delgadito) con su cajoncito y la jaladera de latón.
  L.caja(4, 8, 33, 8, "d"); L.caja(4, 9, 33, 9, "b");
  L.caja(14, 8, 23, 8, "e"); L.pon(14, 8, "f"); L.pon(23, 8, "c"); L.pon(18, 8, "n"); L.pon(19, 8, "m");
  // Las patas curvas (largas, se abren tantito abajo).
  for (const [x, der] of [[2, false], [33, true]]) {
    for (let y = 8; y <= 9; y++) { L.pon(x, y, "d"); L.pon(x + 1, y, "d"); L.pon(x + 2, y, "c"); }
    const ix = der ? x : x + 1;
    for (let y = 10; y <= 15; y++) { L.pon(ix, y, "d"); L.pon(ix + 1, y, "c"); }
    const fx = der ? x + 1 : x;
    L.pon(fx, 16, "e"); L.pon(fx + 1, 16, "d"); L.pon(fx + 2, 16, "c");
    L.pon(der ? x + 1 : x - 1, 17, "b"); L.pon(der ? x + 2 : x, 17, "b"); L.pon(der ? x + 3 : x + 1, 17, "a");
  }
  // La repisa de abajo y, encima, sus revistas y una canastita tejida.
  L.caja(4, 14, 33, 14, "e"); L.caja(4, 15, 33, 15, "c");
  L.caja(9, 13, 16, 13, "A"); L.pon(9, 13, "B"); L.caja(10, 12, 15, 12, "I"); L.pon(10, 12, "J");
  return L.filas();
}
function tapaMesita(u, z, W, D) {
  // Un carpetita de encaje en medio, y las tablas con sus vetas.
  const cu = W / 2, cz = D / 2, r = Math.hypot((u + 0.5 - cu) / 1.6, z + 0.5 - cz);
  if (r < 4.6) return r > 3.7 ? (Math.round(Math.atan2(z - cz, u - cu) * 3) % 2 ? "#" : "C") : r < 1.4 ? "J" : "#";
  return tablas(u, z, D, 5);
}
/** Lo de encima de la mesita (vivo: se quita al servir): un floreritos con su rosa y unos libros apilados. */
const ENCIMA_MESITA = [{ clase: "adorno", p: [
  [6, 0, "w"], [7, 0, "x"], [6, 1, "v"], [7, 1, "w"], [5, 1, "s"], [8, 2, "r"], [7, 2, "r"],
  [6, 2, "P"], [5, 3, "Q"], [6, 3, "#"], [7, 3, "P"], [8, 3, "O"], [5, 4, "P"], [6, 4, "P"], [7, 4, "P"], [8, 4, "O"],
  [26, 2, "s"], [27, 2, "s"], [28, 2, "s"], [29, 2, "r"], [26, 3, "I"], [27, 3, "J"], [28, 3, "I"], [29, 3, "I"], [30, 3, "H"],
  [25, 4, "z"], [26, 4, "A"], [27, 4, "B"], [28, 4, "A"], [29, 4, "A"], [30, 4, "A"], [31, 4, "y"],
] }];

/* ═════════════ LA MESITA REDONDA (24 × 21): pedestal torneado y mantel corto con encaje ═════════════ */
function mesitaRedonda() {
  const L = lienzo(24, 21);
  // El mantel corto: la tapa redonda y lo que cae (sus pliegues, la luz a la izquierda) con su encaje de ondas.
  L.caja(4, 2, 19, 2, "{"); L.caja(2, 3, 21, 3, "]");
  for (let y = 4; y <= 6; y++) for (let x = 1; x <= 22; x++) {
    const plie = (x - 1) % 4, luz = x < 8 ? 1 : x > 17 ? -1 : 0;
    L.pon(x, y, plie === 0 ? (luz > 0 ? "{" : "]") : plie === 3 ? ")" : luz < 0 ? ")" : "[");
  }
  for (let x = 1; x <= 22; x++) { L.pon(x, 7, x % 3 === 0 ? "C" : "#"); if (x % 3 === 1) L.pon(x, 8, "#"); }
  // El pedestal torneado: cuello, anillo, bulbo, fuste largo y el pie redondo.
  L.caja(10, 8, 13, 9, "d"); L.pon(10, 8, "e"); L.pon(13, 8, "c"); L.pon(13, 9, "c"); L.pon(10, 9, "e");
  L.caja(9, 10, 14, 10, "c"); L.pon(9, 10, "d"); L.pon(14, 10, "b");
  L.caja(9, 11, 14, 12, "e"); for (const y of [11, 12]) { L.pon(9, y, "f"); L.pon(13, y, "d"); L.pon(14, y, "c"); }
  L.caja(10, 13, 13, 15, "d"); for (let y = 13; y <= 15; y++) { L.pon(10, y, "e"); L.pon(13, y, "c"); }
  L.caja(9, 16, 14, 16, "c"); L.pon(9, 16, "d"); L.pon(14, 16, "b");
  L.caja(8, 17, 15, 17, "e"); L.pon(8, 17, "f"); L.pon(15, 17, "c");
  L.caja(6, 18, 17, 18, "d"); L.pon(6, 18, "e"); L.pon(17, 18, "c");
  L.caja(5, 19, 18, 19, "c"); L.caja(5, 20, 18, 20, "b"); L.pon(5, 20, "a"); L.pon(18, 20, "a");
  return L.filas();
}
function tapaRedonda(u, z, W, D) {
  // El mantel visto desde arriba: redondo, con su orilla de encaje, unos corazoncitos y la luz arriba a la izquierda.
  const x = (u + 0.5 - W / 2) / (W / 2), y = (z + 0.5 - D / 2) / (D / 2), r = Math.hypot(x, y);
  if (r > 0.86) return Math.round(Math.atan2(y, x) * 5) % 2 ? "#" : "C";
  if (r > 0.78) return ")";
  if (Math.abs(r - 0.45) < 0.07) return "]";
  if (x + y < -0.7) return "{";
  return "[";
}
/** Lo de encima (vivo, se quita al servir): una velita en su platito. */
const VELITA = [{ clase: "adorno", p: [[11, 0, "W"], [12, 0, "V"], [11, 1, "#"], [12, 1, "C"], [10, 2, "j"], [11, 2, "k"], [12, 2, "j"], [13, 2, "i"]] }];

/* ═════════════ EL TOCADISCOS (28 × 30, 16 de hondo): el disco se ve desde arriba ═════════════ */
function tocadiscos() {
  const L = lienzo(28, 30);
  // La consola del tocadiscos (rosa) con su perilla y su lucecita.
  L.caja(1, 9, 26, 9, "J"); L.caja(0, 10, 27, 11, "I"); L.caja(0, 12, 27, 12, "H");
  L.pon(0, 10, "J"); L.pon(27, 10, "H"); L.pon(27, 11, "H");
  L.pon(3, 11, "W"); L.pon(21, 10, "k"); L.pon(21, 11, "i"); L.pon(23, 10, "k"); L.pon(23, 11, "i"); L.pon(25, 10, "j"); L.pon(25, 11, "h");
  // El mueble de madera: marco, bocina de tela con sus rendijas, y los discos guardados.
  L.caja(1, 13, 26, 26, "d"); for (let y = 13; y <= 26; y++) { L.pon(1, y, "e"); L.pon(26, y, "c"); } L.caja(1, 13, 26, 13, "c");
  L.hundido(3, 15, 12, 25, "E", "F", "D");
  for (let y = 17; y <= 23; y += 2) L.caja(5, y, 10, y, "F");
  L.pon(7, 20, "I"); L.pon(8, 20, "I"); L.pon(7, 21, "H");
  L.hundido(14, 15, 24, 25, "%", "0", "&");
  const lomos = ["w", "A", "!", "H", "Z", "M", "x", "S", "9"];
  for (let x = 15; x <= 23; x++) { const c = lomos[(x - 15) % lomos.length], top = 17 + (x % 3 === 0 ? 1 : 0); L.caja(x, top, x, 24, c); L.pon(x, top, "#"); }
  L.caja(15, 24, 23, 24, "c");
  L.pon(13, 20, "n"); L.pon(13, 21, "m");
  // El zoclo y sus patitas.
  L.caja(1, 26, 26, 26, "c"); L.caja(2, 27, 25, 27, "b"); L.patas([3, 23], 28, 29, "b", "a");
  return L.filas();
}
function tapaTocadiscos(u, z, W, D, v) {
  if (v !== 9) return u === 0 || z === D - 1 ? "H" : "d";
  // El plato y el disco: surcos, su etiqueta y su agujerito; el brazo con su cabeza; las perillas.
  const cu = 10.5, cz = 8, r = Math.hypot((u + 0.5 - cu) * 0.82, z + 0.5 - cz);
  if (r <= 1) return "#";
  if (r <= 2.6) return r < 1.8 ? "x" : "w";
  if (r <= 6.4) return Math.abs(r - 4.2) < 0.4 || Math.abs(r - 5.6) < 0.35 ? "&" : "%";
  if (r <= 7.2) return "j";
  // El brazo: de su base (atrás a la derecha) hacia la orilla del disco.
  const bx = 21, bz = 12;
  if (Math.hypot(u - bx, z - bz) <= 1.2) return "k";
  for (let t = 0; t <= 1; t += 0.05) { const x = bx + (15.5 - bx) * t, y = bz + (6.5 - bz) * t; if (Math.round(x) === u && Math.round(y) === z) return t > 0.85 ? "h" : "i"; }
  if ((u === 24 || u === 25) && (z === 3 || z === 5)) return "j";
  if (z === 0 || u === 0) return "J";
  if (z === D - 1 || u === W - 1) return "H";
  return "I";
}

/* ═════════════ LA LÁMPARA DE PIE (16 × 49) ═════════════ */
function lampara() {
  const L = lienzo(16, 49);
  // El remate y la pantalla plisada (más ancha abajo), con su ribete rosa y sus borlitas.
  L.pon(7, 0, "o"); L.pon(8, 0, "n"); L.pon(7, 1, "n"); L.pon(8, 1, "m");
  for (let y = 2; y <= 15; y++) {
    const a = Math.round(4 - ((y - 2) / 13) * 4), b = 15 - a;
    for (let x = a; x <= b; x++) {
      const pl = (x - a) % 3, lado = (x - a) / Math.max(1, b - a);
      L.pon(x, y, x === a ? "C" : x === b ? "F" : pl === 0 ? (lado < 0.5 ? "C" : "D") : pl === 2 ? (lado > 0.6 ? "F" : "E") : "D");
    }
  }
  for (let x = 4; x <= 11; x++) L.pon(x, 2, "I");
  for (let x = 0; x <= 15; x++) { L.pon(x, 15, x < 3 ? "J" : x > 12 ? "H" : "I"); if (x % 3 === 1) L.pon(x, 16, "H"); }
  // El poste de latón con sus anillos.
  for (let y = 16; y <= 44; y++) { L.pon(7, y, "n"); L.pon(8, y, "m"); }
  for (const y of [17, 27, 37]) { L.pon(6, y, "o"); L.pon(7, y, "o"); L.pon(8, y, "n"); L.pon(9, y, "m"); }
  // La base redonda.
  L.caja(5, 45, 10, 45, "n"); L.pon(5, 45, "o"); L.pon(10, 45, "m");
  L.caja(3, 46, 12, 46, "n"); L.pon(3, 46, "o"); L.pon(4, 46, "o"); L.pon(12, 46, "m");
  L.caja(2, 47, 13, 47, "m"); L.pon(2, 47, "n");
  L.caja(2, 48, 13, 48, "l");
  return L.filas();
}

/* ═════════════ LA LÁMPARA DE LAVA (11 × 24) ═════════════ */
function lava() {
  const L = lienzo(11, 24);
  // La tapita cromada.
  L.caja(4, 1, 6, 1, "k"); L.caja(3, 2, 7, 2, "j"); L.pon(7, 2, "h"); L.caja(3, 3, 7, 3, "i"); L.pon(3, 3, "j"); L.pon(7, 3, "g");
  // El vidrio del color elegido (claro), angosto arriba y más ancho abajo, con su brillo.
  for (let y = 4; y <= 17; y++) {
    const a = y < 8 ? 3 : 2, b = y < 8 ? 7 : 8;
    for (let x = a; x <= b; x++) L.pon(x, y, x === a ? "]" : x === b ? ")" : "{");
    L.pon(a + 1, y, y % 5 === 2 ? "{" : "#");
  }
  // La base cromada (un cono con sus anillos).
  L.caja(2, 18, 8, 18, "j"); L.pon(8, 18, "h");
  L.caja(2, 19, 8, 19, "i"); L.pon(2, 19, "j"); L.pon(8, 19, "g");
  L.caja(1, 20, 9, 21, "i"); L.pon(1, 20, "k"); L.pon(1, 21, "j"); L.pon(9, 20, "h"); L.pon(9, 21, "h"); L.caja(2, 20, 3, 20, "k");
  L.caja(0, 22, 10, 22, "h"); L.pon(0, 22, "i");
  L.caja(0, 23, 10, 23, "g");
  return L.filas();
}

/* ═════════════ LA BOCINA DE FIESTA (17 × 32): gabinete con sus orillas, tweeter, woofer con su cono y su tira de luz ═════════════ */
function bocina() {
  const L = lienzo(17, 32);
  L.caja(1, 1, 15, 30, "%"); L.caja(2, 0, 14, 0, "&"); L.caja(2, 31, 14, 31, "0");
  for (let y = 1; y <= 30; y++) { L.pon(0, y, "&"); L.pon(1, y, "&"); L.pon(16, y, "0"); L.pon(15, y, "0"); }
  L.pon(0, 1, "."); L.pon(16, 1, "."); L.pon(0, 30, "."); L.pon(16, 30, ".");
  // El tweeter (arriba) y un corazoncito.
  L.elipse(8.5, 9, 2.6, 2.6, "g", "h"); L.pon(8, 9, "i"); L.pon(7, 8, "k");
  for (const [x, y] of [[7, 14], [9, 14], [7, 15], [8, 15], [9, 15], [8, 16]]) L.pon(x, y, "H");
  // El hueco del woofer (el cono va vivo encima) y la tira rosa de abajo.
  L.elipse(8.5, 22.5, 6, 6, "0", "&");
  L.caja(3, 29, 13, 29, "H"); L.pon(3, 29, "I");
  return L.filas();
}
const CONO = [{ clase: "cono", p: (() => { const o = []; for (let y = 17; y <= 28; y++) for (let x = 3; x <= 14; x++) { const r = Math.hypot(x + 0.5 - 8.5, y + 0.5 - 22.5); if (r > 5.2) continue; o.push([x, y, r < 1.6 ? (x < 8 && y < 22 ? "j" : "%") : r < 3.4 ? (x + y < 30 ? "i" : "h") : r < 4.4 ? "h" : "g"]); } return o; })() },
  { clase: "led", p: [[4, 3, "I"], [5, 3, "J"], [6, 3, "I"], [7, 3, "I"], [8, 3, "J"], [9, 3, "I"], [10, 3, "I"], [11, 3, "J"], [12, 3, "I"]] }];

/* ═════════════ EL BOTE DE BASURA (14 × 18): de pedal, con su tapa (se abre), costillitas, corazón y su pedal ═════════════ */
function bote() {
  const L = lienzo(14, 18);
  L.caja(2, 5, 11, 15, "[");
  for (let y = 5; y <= 15; y++) { L.pon(2, y, "{"); L.pon(3, y, "]"); L.pon(11, y, ")"); L.pon(10, y, ")"); for (const x of [5, 8]) L.pon(x, y, "]"); }
  L.caja(2, 5, 11, 5, ")");
  corazon(L, 4, 9, "#"); L.pon(5, 9, "C");
  L.caja(2, 16, 11, 16, "("); L.caja(3, 17, 10, 17, "0");
  L.caja(5, 16, 8, 16, "i"); L.pon(5, 16, "j"); L.pon(8, 16, "h");
  return L.filas();
}
const TAPA_BOTE = [{ clase: "tapa", p: [[5, 1, "("], [6, 1, ")"], [7, 1, ")"], [8, 1, "("], ...[2, 3, 4].flatMap((y) => Array.from({ length: 12 }, (_, i) => [i + 1, y, y === 2 ? (i < 3 ? "{" : "]") : y === 3 ? "[" : ")"]))] }];

/** Los redibujos: k → función que recibe lo de antes (para conservar lo vivo) y regresa lo nuevo. */
export const MUEBLES81 = {
  mesa: () => pix({ filas: mesa(), capas: FLORERO, tapa: tapaMesa, hondo: 116, forma: "mesa", pata: 3 }),
  mesita: (viejo) => ({ ...pix({ filas: mesita(), capas: ENCIMA_MESITA, tapa: tapaMesita, hondo: 88, forma: "mesa", pata: 3 }), superficie: viejo.superficie }),
  mesita_redonda: () => pix({ filas: mesitaRedonda(), capas: VELITA, tapa: tapaRedonda, hondo: 96, torno: true }),
  tocadiscos: (viejo) => conVivo({ filas: tocadiscos(), tapa: tapaTocadiscos, hondo: 64, forma: "caja" }, viejo.arte, ["disco"]),
  lampara: (viejo) => conVivo({ filas: lampara(), torno: true }, viejo.arte),
  lampara_lava: (viejo) => conVivo({ filas: lava(), torno: true }, viejo.arte),
  bocina: (viejo) => conVivo({ filas: bocina(), capas: CONO, hondo: 48, forma: "caja" }, viejo.arte, ["cono", "led"]),
  bote_basura: () => pix({ filas: bote(), capas: TAPA_BOTE, torno: true }),
};
