/**
 * (Fase 75) LA COCINA EN PIXEL DE VERDAD, con volumen: el refri, la estufa, el fregadero y las barras (cafetera,
 * tostador, microondas, licuadora y frutero) dibujados a mano, cuadrito por cuadrito, en el estilo de una cocinita
 * pixel art acogedora: refri crema con sus imanes y su notita, gabinetes turquesa con tableros con bisel y perillas de
 * latón, cubierta crema, estufa con su horno de vidrio que se prende naranja, hornillas de verdad ARRIBA (en la tapa,
 * con su hondura) y la tarja metida en la cubierta.
 *
 *   · El frente se dibuja aquí; la TAPA (lo de arriba, que se ve en perspectiva) también: `tapa(u, z, W, D, v)` dice el
 *     color de cada cuadrito de arriba (u de izquierda a derecha, z de enfrente a atrás).
 *   · Lo que se mueve sigue igual que antes (mismas clases): la puerta del refri se abre, el horno se pone naranja, el
 *     chorro del fregadero, el vapor del café, el pan del tostador, el platito del micro, el vaso de la licuadora, el
 *     sartén y la olla. Lo que hace cada cosa (acciones, lugares, colores) no cambia.
 */
import { pix } from "./pixel.js";
import { separar } from "../girar.js";

/** Un lienzo de letras (cada letra, un color de la paleta) con herramientas de carpintero. */
function lienzo(W, H) {
  const G = Array.from({ length: H }, () => Array(W).fill("."));
  const pon = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H && c) G[y][x] = c; };
  const caja = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pon(x, y, c); };
  /** Un tablero que sobresale: luz arriba y a la izquierda, sombra abajo y a la derecha. */
  const realce = (x0, y0, x1, y1, fondo, luz, sombra) => { caja(x0, y0, x1, y1, fondo); for (let x = x0; x <= x1; x++) { pon(x, y0, luz); pon(x, y1, sombra); } for (let y = y0; y <= y1; y++) { pon(x0, y, luz); pon(x1, y, sombra); } pon(x1, y0, fondo); pon(x0, y1, fondo); };
  /** Un tablero hundido: al revés (sombra arriba y a la izquierda, luz abajo y a la derecha). */
  const hundido = (x0, y0, x1, y1, fondo, sombra, luz) => realce(x0, y0, x1, y1, fondo, sombra, luz);
  const filas = () => G.map((f) => f.join(""));
  return { W, H, G, pon, caja, realce, hundido, filas };
}
/** Sólo lo vivo (lo que tiene clase) de un dibujo de antes, sin lo que se rehízo en pixel. */
function vivoDe(svg, quitar = []) {
  try {
    const v = separar(svg).vivo;
    if (!v) return "";
    const doc = new DOMParser().parseFromString(v.replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"'), "image/svg+xml");
    for (const c of quitar) doc.querySelectorAll("." + c).forEach((n) => n.remove());
    return doc.documentElement.innerHTML;
  } catch (e) { return ""; }
}
/** Un mueble pixel con su parte viva (dibujo de antes) encima, recorrida si cambió tantito la medida. */
function conVivo(def, viejo, quitar = [], dx = 0, dy = 0) {
  const p = pix(def), base = p.arte;
  p.arte = (e, C) => {
    const v = viejo ? vivoDe(viejo(e, C), quitar) : "", extra = def.vivo ? def.vivo(e, C) : "";
    return base(e, C).replace(/<\/svg>\s*$/, `${v ? `<g transform="translate(${dx} ${dy})">${v}</g>` : ""}${extra}</svg>`);
  };
  return p;
}
const enC = (u, z, cx, cz, r) => Math.hypot(u + 0.5 - cx, z + 0.5 - cz) <= r;
const hash = (a, b) => { let h = Math.imul(a * 73856093 ^ b * 19349663, 2654435761) >>> 0; return (h % 1000) / 1000; };

/* ───────────── El refri (26 × 54): crema, puerta de arriba y de abajo, imanes, notita y por dentro su comida ───────────── */
function refri() {
  const L = lienzo(26, 54);
  // El cuerpo: orillas redonditas arriba, su costado claro a la izquierda y en sombra a la derecha.
  L.caja(0, 2, 25, 47, "["); for (let y = 2; y <= 47; y++) { L.pon(0, y, "]"); L.pon(25, y, ")"); }
  L.caja(3, 0, 22, 0, "]"); L.caja(1, 1, 24, 1, "{"); L.pon(0, 1, "."); L.pon(25, 1, ".");
  // La puerta del congelador con su bisel, su brillo de esmalte y su manija.
  L.realce(1, 2, 24, 16, "[", "{", ")");
  for (let y = 4; y <= 14; y++) { L.pon(4, y, "{"); if (y < 9) L.pon(5, y, "]"); }
  for (let y = 8; y <= 14; y++) { L.pon(20, y, "j"); L.pon(21, y, "h"); } L.pon(20, 8, "k"); L.pon(21, 14, "g");
  // Un iman redondo y una fotito (cielo, pasto y solecito).
  L.caja(7, 5, 8, 6, "I"); L.pon(7, 5, "J"); L.pon(8, 6, "H");
  L.realce(11, 8, 16, 13, "C", "#", "E"); L.caja(12, 9, 15, 10, "B"); L.caja(12, 11, 15, 12, "s"); L.pon(14, 9, "!"); L.pon(12, 12, "r");
  // La rendija entre puertas.
  L.caja(1, 17, 24, 17, "("); L.caja(1, 18, 24, 18, ")");
  // Por dentro (se ve al abrir): repisas y comida.
  L.caja(2, 19, 23, 46, "C");
  for (const y of [27, 36]) { L.caja(2, y, 23, y, "E"); L.caja(2, y + 1, 23, y + 1, "D"); }
  L.caja(4, 21, 6, 26, "A"); L.caja(4, 21, 6, 22, "#"); L.pon(5, 23, "B");               // leche
  L.caja(9, 23, 11, 26, "P"); L.caja(9, 22, 11, 22, "n"); L.pon(10, 24, "w");            // mermelada
  L.caja(15, 24, 16, 25, "w"); L.pon(15, 24, "x"); L.pon(16, 23, "s");                    // tomate
  L.caja(5, 31, 9, 34, "J"); L.caja(5, 31, 9, 31, "C"); L.pon(7, 30, "w");               // pastelito
  L.caja(14, 29, 15, 34, "r"); L.pon(14, 29, "s"); L.pon(14, 30, "t");                    // botella
  for (const x of [5, 8, 11]) { L.pon(x, 41, "C"); L.pon(x, 42, "D"); }                   // huevitos
  L.caja(16, 40, 19, 42, "7"); L.pon(19, 39, "s");                                         // zanahoria
  // La base con su rejilla y sus patitas.
  L.caja(0, 47, 25, 47, ")");
  L.caja(0, 48, 25, 51, ")"); for (let x = 6; x <= 19; x++) for (const y of [49, 50]) if (x % 2 === 0) L.pon(x, y, "(");
  for (const x of [2, 3, 22, 23]) { L.pon(x, 52, "%"); L.pon(x, 53, "0"); }
  return L.filas();
}
/** La puerta de abajo del refri (viva: se abre), con su manija, su brillo, la notita y un iman de fresa. */
function puertaRefri() {
  const L = lienzo(26, 54);
  L.realce(1, 19, 24, 46, "[", "{", ")");
  for (let y = 21; y <= 43; y++) if (y % 9 !== 0) L.pon(4, y, "{");
  for (let y = 21; y <= 31; y++) { L.pon(20, y, "j"); L.pon(21, y, "h"); } L.pon(20, 21, "k"); L.pon(21, 31, "g");
  // La notita (con sus renglones y un corazón) detenida con un iman rosa.
  L.realce(7, 25, 14, 34, "C", "#", "E"); for (const [y, x1] of [[27, 13], [29, 12], [31, 13]]) L.caja(8, y, x1, y, "E"); L.pon(12, 33, "w"); L.pon(13, 33, "w");
  L.caja(10, 24, 11, 25, "I"); L.pon(10, 24, "J");
  // El iman de fresa.
  L.caja(15, 37, 17, 39, "w"); L.pon(15, 37, "x"); L.pon(16, 36, "s"); L.pon(17, 36, "r"); L.pon(16, 38, "?");
  return L.filas();
}

/* ───────────── La estufa (31 × 34): turquesa, tablero de perillas, horno de vidrio y cajón ───────────── */
function estufa() {
  const L = lienzo(31, 34);
  // La orilla de la cubierta (metal) sobre el mueble.
  L.caja(0, 6, 30, 6, "k"); L.caja(0, 7, 30, 7, "j"); L.caja(0, 8, 30, 8, "h");
  L.caja(0, 9, 30, 32, "Y"); for (let y = 9; y <= 32; y++) { L.pon(0, y, "Z"); L.pon(30, y, "X"); } L.caja(0, 9, 30, 9, "Z");
  // El tablero de perillas (crema) con su relojito.
  L.realce(2, 10, 28, 13, "D", "C", "E");
  for (const x of [5, 10, 19, 24]) { L.pon(x, 11, "k"); L.pon(x + 1, 11, "j"); L.pon(x, 12, "i"); L.pon(x + 1, 12, "g"); }
  L.caja(14, 11, 16, 12, "0"); L.pon(14, 11, "!"); L.pon(16, 11, "!"); L.pon(15, 12, "9");
  // La jaladera del horno.
  L.caja(5, 15, 25, 15, "k"); L.caja(5, 16, 25, 16, "i"); L.pon(5, 15, "h"); L.pon(25, 15, "h");
  // La puerta del horno con su ventana (el vidrio oscuro; lo naranja se prende encima).
  L.realce(3, 17, 27, 29, "Y", "Z", "X");
  L.caja(6, 19, 24, 27, "0");
  // El cajón de abajo y su zoclo.
  L.caja(1, 30, 29, 30, "X"); L.caja(12, 31, 18, 31, "X"); L.caja(0, 33, 30, 33, "X");
  return L.filas();
}
/** La tapa de la estufa: cubierta de metal oscuro con cuatro hornillas (parrillas, quemador y su corona). */
function tapaEstufa(u, z, W, D) {
  const cs = [[8, D * 0.32], [22, D * 0.32], [8, D * 0.74], [22, D * 0.74]];
  for (const [cx, cz] of cs) {
    const d = Math.hypot(u + 0.5 - cx, (z + 0.5 - cz) * 1.25);
    if (d <= 1.1) return "i";
    if (d <= 1.9) return "%";
    if (d <= 2.9) return (u + z) % 2 ? "0" : "h";
    if (d <= 3.4) return "0";
  }
  if (u === 0 || u === W - 1 || z === D - 1) return "h";
  return z < 1 ? "i" : "&";
}

/* ───────────── El gabinete de las barras (30 × 32): cubierta crema y dos puertas con tablero ───────────── */
function gabinete(L, w = 30, puertas = [[2, 13], [16, 27]]) {
  // La cubierta (su filo de enfrente) y la sombrita que hace sobre las puertas.
  // (Cuatro renglones: así su costado también es crema y no agarra el color de lo que está encima.)
  L.caja(0, 9, w - 1, 9, "C"); L.caja(0, 10, w - 1, 11, "D"); L.caja(0, 12, w - 1, 12, "E");
  L.caja(0, 13, w - 1, 29, "["); for (let y = 13; y <= 29; y++) { L.pon(0, y, "]"); L.pon(w - 1, y, ")"); }
  L.caja(1, 13, w - 2, 13, ")");
  // Las puertas con su tablero hundido y su perilla de latón.
  puertas.forEach(([a, b], i) => {
    L.realce(a, 14, b, 28, "[", "]", ")");
    L.hundido(a + 2, 16, b - 2, 26, "[", ")", "{");
    const kx = i === 0 ? b - 1 : a + 1;
    if (puertas.length > 1 && i < 2) { L.pon(kx, 20, "o"); L.pon(kx, 21, "m"); }
  });
  for (let i = 0; i < puertas.length - 1; i++) { const x = puertas[i][1] + 1; for (let y = 14; y <= 28; y++) { L.pon(x, y, "("); if (x + 1 < puertas[i + 1][0]) L.pon(x + 1, y, ")"); } }
  // El zoclo hundido.
  L.caja(0, 30, w - 1, 31, "("); L.caja(1, 30, w - 2, 30, ")");
}
/** La cubierta de arriba: crema con vetitas de mármol. */
const tapaCubierta = (u, z, W, D, v) => (v >= 9 ? (hash(u, z) < 0.07 ? "E" : z >= D - 1 ? "E" : "D") : null);

function barra(dibujo) { const L = lienzo(30, 32); gabinete(L); dibujo(L); return L.filas(); }
const CAFETERA = (L) => {
  L.caja(9, 0, 18, 1, "&"); L.caja(9, 0, 18, 0, "h");                       // la tapa
  L.caja(9, 2, 18, 8, "%"); L.pon(9, 2, "&"); L.caja(10, 2, 13, 2, "&");     // el cuerpo
  L.caja(15, 3, 17, 3, "Z"); L.pon(16, 3, "t");                              // su lucecita
  L.caja(11, 5, 16, 8, "Q"); L.caja(11, 7, 16, 8, "4"); L.pon(11, 5, "#"); L.caja(11, 4, 16, 4, "h");   // la jarra de café
  L.caja(22, 5, 25, 8, "I"); L.caja(22, 5, 25, 5, "J"); L.pon(26, 6, "H"); L.pon(26, 7, "H"); L.pon(23, 7, "#");   // la taza
};
const TOSTADOR = (L) => {
  L.caja(8, 3, 21, 8, "I"); L.caja(8, 3, 21, 3, "J"); L.pon(8, 4, "J"); L.caja(21, 4, 21, 8, "H");
  L.caja(10, 3, 13, 3, "0"); L.caja(15, 3, 18, 3, "0");                      // las ranuras
  L.caja(9, 6, 20, 6, "j"); L.caja(9, 7, 20, 7, "i");                         // la franja de metal
  L.pon(22, 5, "h"); L.pon(23, 5, "h");                                       // la palanquita
  L.caja(2, 6, 4, 8, "w"); L.pon(2, 6, "x"); L.pon(3, 5, "s");                // una manzana
};
const MICRO = (L) => {
  L.realce(4, 0, 25, 8, "C", "#", "E");
  L.caja(6, 2, 18, 6, "0"); L.caja(6, 2, 18, 2, "%");                         // la ventanita
  L.caja(20, 1, 24, 7, "D"); L.caja(21, 2, 23, 2, "Z"); for (const y of [4, 5, 6]) { L.pon(21, y, "h"); L.pon(23, y, "h"); }
};
const LICUADORA = (L) => {
  L.caja(10, 6, 18, 8, "I"); L.caja(10, 6, 18, 6, "J"); L.pon(14, 7, "#"); L.pon(18, 8, "H");
  L.caja(22, 6, 24, 8, "!"); L.pon(22, 6, "?"); L.pon(24, 8, "9");            // un limón
  L.caja(4, 7, 5, 8, "w"); L.pon(4, 7, "x"); L.pon(5, 6, "s");                // una fresa
};
const FRUTERO = (L) => {
  L.caja(9, 2, 11, 4, "w"); L.pon(9, 2, "x"); L.pon(10, 1, "2");             // manzana
  L.caja(13, 2, 15, 4, "U"); L.pon(13, 2, "V");                               // naranja
  for (const [x, y] of [[15, 1], [16, 1], [17, 1], [18, 2], [19, 2]]) L.pon(x, y, "!"); L.pon(19, 3, "9");   // plátano
  for (const [x, y] of [[18, 3], [19, 4], [17, 4], [18, 5]]) L.pon(x, y, "L"); L.pon(18, 4, "M");            // uvas
  L.caja(6, 5, 23, 6, "C"); L.caja(7, 7, 22, 7, "C"); L.caja(9, 8, 20, 8, "D"); L.caja(7, 6, 22, 6, "J");   // el platón con su raya rosa
};

/* ───────────── El fregadero (38 × 32): llave de latón, jabón, matita y tres puertas ───────────── */
function fregadero() {
  const L = lienzo(38, 32);
  gabinete(L, 38, [[2, 12], [14, 24], [26, 35]]);
  // La llave (cuello, curva y boquilla) y sus perillas de caliente y frío.
  for (let y = 2; y <= 8; y++) { L.pon(17, y, "j"); L.pon(18, y, "i"); }
  L.caja(17, 1, 21, 1, "j"); L.caja(18, 2, 21, 2, "i"); L.pon(21, 3, "h");
  L.caja(14, 7, 15, 8, "I"); L.pon(14, 7, "J"); L.caja(20, 7, 21, 8, "B"); L.pon(20, 7, "P");
  // El jabón rosa con su bomba.
  L.caja(5, 4, 7, 8, "I"); L.pon(5, 4, "J"); L.pon(6, 3, "h"); L.pon(6, 2, "h"); L.pon(7, 2, "h"); L.pon(7, 8, "H");
  // La matita en su maceta de barro.
  L.caja(30, 5, 33, 8, "7"); L.caja(30, 5, 33, 5, "8"); L.pon(33, 8, "6");
  for (const [x, y, c] of [[31, 4, "r"], [32, 3, "s"], [30, 2, "s"], [33, 1, "r"], [31, 1, "t"], [29, 3, "r"], [34, 3, "s"]]) L.pon(x, y, c);
  return L.filas();
}
/** La tapa del fregadero: cubierta crema con la tarja metida (orilla, fondo en sombra y su coladera). */
function tapaFregadero(u, z, W, D, v) {
  if (v < 9) return null;
  const a = 9, b = 27, z0 = 2, z1 = D - 3;
  if (u >= a && u <= b && z >= z0 && z <= z1) {
    if (u === a || u === b || z === z0 || z === z1) return "j";
    if (Math.abs(u + 0.5 - (a + b + 1) / 2) <= 1 && Math.abs(z + 0.5 - (z0 + z1 + 1) / 2) <= 0.6) return "g";
    return u <= a + 1 || z >= z1 - 1 ? "h" : "i";
  }
  return hash(u, z) < 0.07 || z >= D - 1 ? "E" : "D";
}

/* ───────────── La alacena (44 × 22): dos repisas de madera con ménsulas, frascos, bolsita de papel, platos y tazas ───────────── */
function alacena() {
  const L = lienzo(44, 22);
  const tabla = (y) => { L.caja(0, y, 43, y, "e"); L.caja(0, y + 1, 43, y + 1, "c"); L.pon(0, y, "d"); L.pon(43, y + 1, "b"); };
  const mensula = (x, y) => { L.pon(x, y, "b"); L.pon(x + 1, y, "c"); L.pon(x, y + 1, "a"); };
  // Arriba: un frasco de vidrio con manzanas (tapa roja), uno de frijolitos (tapa rosa), la bolsita de papel y dos platos.
  L.caja(2, 2, 8, 8, "P"); L.caja(3, 3, 7, 8, "Q"); L.caja(2, 1, 8, 1, "v"); L.caja(3, 0, 7, 0, "w");
  for (const [x, y] of [[3, 7], [5, 7], [7, 7], [4, 5], [6, 5]]) { L.pon(x, y, "w"); L.pon(x, y - 1, "x"); } L.pon(2, 3, "#");
  L.caja(11, 4, 15, 8, "Q"); L.caja(11, 3, 15, 3, "I"); L.caja(12, 6, 14, 8, "6"); L.pon(12, 6, "7"); L.pon(14, 7, "5"); L.pon(11, 4, "#");
  L.caja(18, 2, 24, 8, "e"); L.caja(18, 2, 24, 2, "d"); for (const x of [19, 21, 23]) L.pon(x, 1, "e"); L.caja(24, 3, 24, 8, "d"); L.caja(19, 5, 22, 6, "D"); L.pon(20, 5, "w");
  const plato = (cx, borde) => { for (let y = 0; y <= 8; y++) for (let x = cx - 4; x <= cx + 4; x++) { const d = Math.hypot(x - cx, (y - 4.5) * 1.05); if (d <= 4.6) L.pon(x, y, d > 3.4 ? borde : d > 2.4 ? "C" : "D"); } };
  plato(31, "I"); plato(39, "S");
  tabla(9); mensula(3, 11); mensula(39, 11);
  // Abajo: tres tazas colgadas de sus ganchitos y, en la repisa, dos botes (turquesa y crema) y una matita.
  for (const [x, c, s] of [[7, "I", "H"], [13, "S", "R"], [19, "!", "9"]]) { L.pon(x + 1, 11, "h"); L.caja(x, 12, x + 3, 14, c); L.caja(x + 1, 15, x + 2, 15, c); L.pon(x + 3, 14, s); L.pon(x + 4, 13, s); L.pon(x, 12, "#"); }
  L.caja(26, 13, 31, 18, "Y"); L.caja(26, 12, 31, 12, "Z"); L.caja(27, 15, 30, 16, "D"); L.pon(31, 14, "X");
  L.caja(33, 14, 37, 18, "D"); L.caja(33, 13, 37, 13, "E"); L.caja(34, 16, 36, 16, "I"); L.pon(37, 15, "E");
  L.caja(39, 16, 42, 18, "7"); L.caja(39, 16, 42, 16, "8");
  for (const [x, y, c] of [[40, 15, "r"], [41, 14, "s"], [39, 14, "s"], [42, 13, "r"], [40, 13, "t"]]) L.pon(x, y, c);
  tabla(19); mensula(3, 21); mensula(39, 21);
  return L.filas();
}

/** Los redibujos: k → función que recibe lo de antes (para conservar lo vivo) y regresa lo nuevo. */
export const COCINA75 = {
  refri: (viejo) => ({ ...conVivo({ filas: refri(), capas: [{ clase: "puerta-b", f: puertaRefri() }], tapa: (u, z, W, D) => (z >= D - 1 ? "]" : u === 0 || u === W - 1 ? "]" : "{") }, null), colores: ["#f1e2c2", ...viejo.colores.filter((c) => c !== "#f1e2c2")] }),
  estufa: (viejo) => conVivo({ filas: estufa(), tapa: tapaEstufa, vivo: () => '<rect class="horno" x="24" y="76" width="76" height="36" fill="#1b1620"/><rect class="horno-brillo" x="28" y="96" width="68" height="4" fill="#5a556e"/><rect class="horno-brillo" x="28" y="80" width="12" height="4" fill="#fff" opacity=".22"/><rect class="horno-brillo" x="40" y="84" width="8" height="4" fill="#fff" opacity=".14"/>' }, viejo.arte, ["horno"], 1, 0),
  fregadero: (viejo) => ({ ...conVivo({ filas: fregadero(), tapa: tapaFregadero, perfil: [[0, 36, 0.6, 0.85]] }, viejo.arte, [], 0, 2), colores: ["#4f9e98", ...viejo.colores] }),
  barra_cafe: (viejo) => ({ ...conVivo({ filas: barra(CAFETERA), tapa: tapaCubierta, perfil: [[0, 36, 0.28, 0.72]] }, viejo.arte), colores: ["#4f9e98", ...viejo.colores] }),
  barra_tostador: (viejo) => ({ ...conVivo({ filas: barra(TOSTADOR), tapa: tapaCubierta, perfil: [[0, 36, 0.28, 0.72]] }, viejo.arte), colores: ["#4f9e98", ...viejo.colores] }),
  barra_micro: (viejo) => ({ ...conVivo({ filas: barra(MICRO), tapa: tapaCubierta, perfil: [[0, 36, 0.22, 0.78]] }, viejo.arte), colores: ["#4f9e98", ...viejo.colores] }),
  barra_licuadora: (viejo) => ({ ...conVivo({ filas: barra(LICUADORA), tapa: tapaCubierta, perfil: [[0, 36, 0.3, 0.7]] }, viejo.arte), colores: ["#4f9e98", ...viejo.colores] }),
  barra_fruta: (viejo) => ({ ...conVivo({ filas: barra(FRUTERO), tapa: tapaCubierta, perfil: [[0, 36, 0.25, 0.75]] }, viejo.arte), colores: ["#4f9e98", ...viejo.colores] }),
  alacena: () => pix({ filas: alacena() }),
};
