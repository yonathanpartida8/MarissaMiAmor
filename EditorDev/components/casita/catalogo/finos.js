/**
 * LO FINO (Fase 68): muebles y adornos dibujados en pixel art de verdad, cuadrito por cuadrito, con su sombreado a
 * mano (luz arriba a la izquierda), detallitos y lo que se mueve en cuadros (péndulos, flamas, foquitos…).
 * Todos se pueden girar (360°) sin perder lo que se mueve, y las cositas chicas se ponen encima de mesas,
 * escritorios, estantes y repisas.
 */
import { pix, E, E2, X } from "./pixel.js";
import { sentado } from "./arte.js";

const TELAS = ["#ef8bb4", "#937ac8", "#5a83c2", "#58b4a0", "#e9c23c", "#c44a54"];
const MANTELES = ["#ffc6dc", "#c8b6ef", "#fff3a0", "#bfe6d4", "#cfe3ff"];
const PANTALLAS = ["#ffc6dc", "#fff3a0", "#c8b6ef", "#bfe6d4", "#f3e5c8"];

/** Una flamita de vela (2 de ancho) en la columna x, renglón y (hasta abajo), en el cuadro 0 o 1. */
const flama = (x, y, k) => (k ? [[x, y - 3, "U"], [x, y - 2, "U"], [x + 1, y - 2, "V"], [x, y - 1, "V"], [x + 1, y - 1, "W"], [x, y, "W"], [x + 1, y, "V"]]
  : [[x + 1, y - 3, "U"], [x, y - 2, "V"], [x + 1, y - 2, "U"], [x, y - 1, "W"], [x + 1, y - 1, "V"], [x, y, "V"], [x + 1, y, "W"]]);
/** Un péndulo (varilla y lenteja) en la columna x desde el renglón y0, de largo l; lado -1, 0 o 1. */
function pendulo(x, y0, l, lado) {
  const m = Math.floor(l / 2), p = [];
  for (let i = 0; i < l; i++) p.push([x + (i >= m ? lado : 0), y0 + i, "n"]);
  const bx = x + lado, by = y0 + l;
  p.push([bx, by, "n"], [bx - 1, by + 1, "n"], [bx, by + 1, "o"], [bx + 1, by + 1, "n"], [bx, by + 2, "m"]);
  return p;
}


/** El tapete de rayas (como de lana tejida, con flequitos). */
function rayas() {
  const tira = "vvwwxxDDxxwwvvGGHHIIJJIIHHGG", f = [];
  for (let y = 0; y < 16; y++) {
    let fila = "";
    for (let x = 0; x < 60; x++) {
      if (x < 2 || x > 57) { fila += (y % 2 === 0) === (x === 0 || x === 59) ? "." : "D"; continue; }
      if (y === 0 || y === 15) { fila += "u"; continue; }
      const c = tira[(x - 2) % tira.length];
      fila += (y % 2 && (x + y) % 4 === 1) ? ({ v: "u", w: "v", x: "w", D: "E", G: "G", H: "G", I: "H", J: "I" }[c] || c) : c;
    }
    f.push(fila);
  }
  return f;
}
/** Libros parados entre dos sujetalibros. */
function libritos() {
  const L = [["vw", 9], ["z", 10], ["qr", 8], ["!", 9], ["HI", 10], ["L", 7], ["Y", 9]], cols = [];
  for (const [c, h] of L) for (const ch of c) cols.push([ch, h]);
  const W = cols.length + 4, f = [];
  for (let y = 0; y < 11; y++) {
    let fila = y >= 3 ? "mn" : "..";
    for (const [ch, h] of cols) { const top = 11 - h; fila += y < top ? "." : y === top ? "#" : y === top + 3 ? "n" : ch; }
    fila += y >= 3 ? "nm" : "..";
    f.push(fila.slice(0, W));
  }
  return f;
}
const R = (...p) => p.join("");
/** El mueble bajo: puertitas con su perilla y patas cortitas. */
const credenza = () => E2([
  "e".repeat(21), "d".repeat(21), "b".repeat(21), R("c", "eeeeeeeeeeed", "c", "eeeeeee"),
  ...X(R("c", "eddddddddddc", "c", "edddddd"), 4), R("c", "eddddnnddddc", "c", "edddddn"), ...X(R("c", "eddddddddddc", "c", "edddddd"), 2),
  R("c", "dccccccccccc", "c", "dcccccc"), "b".repeat(21), ".cb" + ".".repeat(18), ".cb" + ".".repeat(18), ".bb" + ".".repeat(18),
]);
/** La rocola: sus foquitos corren por el tubo de colores. */
const TUBO = [[8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [7, 4], [6, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12], [5, 13], [5, 14], [5, 15]];
const foquitos = (k) => TUBO.filter((_, i) => i % 3 === k).flatMap(([x, y]) => [[x, y, "W"], [25 - x, y, "W"]]);

export const ITEMS = {
  reloj_pendulo: pix({
    n: "Reloj de péndulo", cat: "sala", al: "reloj", hondo: 34, caja: true,
    filas: E([
      ".......o", "......mn", ".....233", "...22344", "..234444", ".2344444", ".2nnnnnn", ".23mmmmm",
      ".23mCCC0", ".23mCCCC", ".23m0CC0", ".23mCCCC", ".23mCCC0", ".23mmmmm", ".2333333", "..234444",
      "..2343%%", ...X("..234%%%", 20), "..234444", "..233333", ".2344444", ".2nnnnnn", ".2344444",
      ".2343334", ".2343444", ".2343444", ".2343334", ".2344444", "22333333", ".23.....", ".22.....",
    ]),
    capas: [
      { p: [[8, 9, "0"], [9, 8, "0"], [6, 11, "0"], [8, 19, "&"], [7, 20, "&"], [9, 29, "&"], [8, 30, "&"], [3, 16, "4"], [4, 40, "o"]] },
      { clase: "px4-1", t: 2.4, p: pendulo(7, 17, 13, 0) },
      { clase: "px4-2", t: 2.4, p: pendulo(7, 17, 13, 1) },
      { clase: "px4-3", t: 2.4, p: pendulo(7, 17, 13, 0) },
      { clase: "px4-4", t: 2.4, p: pendulo(7, 17, 13, -1) },
    ],
  }),
  estufa_lena: pix({
    n: "Estufa de leña", cat: "sala", al: "fuego", hondo: 64, perfil: [[0, 56, 0.36, 0.64], [144, 160, 0, 0.2], [144, 160, 0.8, 1]], brilla: { x: 46, y: 96, r: 170, c: "#ffae5c", propio: "on" },
    filas: E([
      ...X(".........ghi", 12), "........hiji", "........ghhh", "..ghhhhhhhhh", "..giiiiiiiii", "...ghhhhhhhh", "...ghmmmmmmm",
      "...ghhhhhhhh", "...ghhhh0000", ...X("...ghhh00000", 9), "...ghhhhhhhh", "...ghmmmmmmm", "...ghhhhhhhh",
      "...ghhhhiiii", "...ghhhhiinn", "...ghhhhhhhh", "...ggggggggg", "...gh.......", "..ghh.......", "..gh........", ".ggh........",
    ]),
    capas: [
      { r: [[10, 0, 1, 12, "j"], [4, 16, 1, 18, "i"]] },
      { x: 7, y: 27, f: ["bccbbccbb", "aTaaTaaTa"] },
      { clase: "px-on px3-1", t: 0.75, x: 7, y: 20, f: ["....T....", "...TU..T.", "..TUVT.U.", "..UVWVTU.", ".TUVWWVU.", ".UVWWWWVT", ".TVWWWVUT"] },
      { clase: "px-on px3-2", t: 0.75, x: 7, y: 20, f: ["......T..", ".T...TU..", ".UT.TUV..", ".UVTUVWT.", ".TVWVWWU.", ".UVWWWWVT", ".TVWWWVUT"] },
      { clase: "px-on px3-3", t: 0.75, x: 7, y: 20, f: ["..T......", "..UT..T..", ".TVU.TU..", ".UWVUVU..", ".UVWWWVT.", "TVWWWWVU.", "TUVWWWVT."] },
      { clase: "fijo", r: [[9, 20, 1, 7, "h"], [11, 20, 1, 7, "h"], [13, 20, 1, 7, "h"]] },
    ],
  }),
  estante: pix({
    n: "Estante de madera", cat: "sala", hondo: 44, caja: true, topes: [6, 58, 114, 170],
    filas: E2([
      "deeeeeeeeeeeeeeee", "cdddddddddddddddd", "cbbbbbbbbbbbbbbbb", ...X("dcbccccbccccbcccc", 10),
      "deeeeeeeeeeeeeeee", "cdddddddddddddddd", "cbbbbbbbbbbbbbbbb", ...X("dcbccccbccccbcccc", 11),
      "deeeeeeeeeeeeeeee", "cdddddddddddddddd", "cbbbbbbbbbbbbbbbb", ...X("dcbccccbccccbcccc", 11),
      "deeeeeeeeeeeeeeee", "cdddddddddddddddd", "cbbbbbbbbbbbbbbbb", "cb...............",
    ]),
    capas: [{ r: [[0, 0, 1, 44, "e"], [1, 3, 1, 10, "d"]] }],
  }),
  silla_madera: pix({
    n: "Silla de madera", cat: "cocina", hondo: 44, volcable: true, colores: TELAS, lugares: [sentado(0, -62)],
    filas: E2([
      "..cdddd", "..cdeee", "..cd...", "..cd...", "..cdddd", "..cd...", "..cd...", "..cdddd", "..cd...", "..cd...",
      ".)[[[[[", ")]]]]]]", ")[[[[[[", ")((((((", "cdddddd", "cbbbbbb",
      ".cb....", ".cb....", ".cb....", ".cb....", ".cbcccc", ".cb....", ".cb....", ".cb....", ".cb....", ".bb....",
    ]),
    capas: [{ p: [[3, 1, "f"], [4, 1, "f"], [2, 11, "{"], [3, 11, "{"]] }],
  }),
  sillon_orejero: pix({
    n: "Sillón orejero", cat: "sala", hondo: 70, colores: TELAS, lugares: [sentado(0, -56)],
    filas: E([
      ".....))))))))", "...))[[[[[[[[", "..)[[]]]]]]]]", ".)[[[[[[[[[[[", ".)[[[[[[[[[[[", ")[[[[[[[[)[[[", ")[[[[[[[[[[[[",
      ")[[[[[[[[[[[[", ")[[[)[[[[)[[[", ")[[[)[[[[[[[[", ")[[[)[[[[[[[[", ")]]])[[[[)[[[", ")[[[)[[[[[[[[", ")[[[)))))))))",
      ")[[[)]]]]]]]]", ")[[[)[[[[[[[[", ")[[[)[[[[[[[[", ")[[[)((((((((", ")[[[)))))))))", ")((((((((((((", ")((((((((((((",
      ".bbbbbbbbbbbb", ".cddddddddddd", ".bccccccccccc", "..bc.........", "..bc.........", "..bc.........", ".bbc.........",
    ]),
    capas: [{ p: [[2, 3, "{"], [3, 2, "{"], [1, 12, "{"], [2, 12, "{"], [6, 15, "{"], [7, 15, "{"]] }],
  }),
  lampara_pie: pix({
    n: "Lámpara de pie", cat: "sala", al: "lava", hondo: 56, torno: true, volcable: true, colores: PANTALLAS, brilla: { x: 28, y: 36, r: 160, propio: "on" },
    filas: E2([
      "....)))", "...)[[[", "...)]]]", "..)[[[[", "..)[[[[", "..)[[[[", ".)[[[[[", ".)[[[[[", ".)(((((", ".nmnmnm", ".m.m.m.",
      ...X("......n", 30), ".....mn", "....mnn", "...mnno", "..lmmmm", "..llll.",
    ]),
    capas: [
      { p: [[4, 1, "{"], [3, 3, "{"], [3, 4, "]"], [2, 6, "]"]] },
      { clase: "px-on", r: [[3, 3, 8, 3, "]"], [2, 6, 10, 2, "]"], [4, 2, 6, 1, "{"], [6, 8, 2, 1, "W"], [6, 9, 2, 1, "?"]] },
    ],
  }),
  candelabro: pix({
    n: "Candelabro", cat: "sala", al: "fuego", hondo: 64, torno: true, perfil: [[0, 64, 0.42, 0.58], [64, 140, 0.44, 0.56]], volcable: true, brilla: { x: 32, y: 12, r: 140, c: "#ffcf7a", propio: "on" },
    filas: E2([
      "........", "........", "........", "........", ".CC....C", ...X(".CD....C", 5), "mnnm..mn", ".mn....n", ".mn....n", ".mnn...n",
      "..mnnnnn", "...mmnnn", ...X(".......n", 18), "......mn", ".....mno", "....mnnn", "...lmmmm", "..llllll", "...l....",
    ]),
    capas: [
      { p: [[2, 3, "0"], [8, 3, "0"], [13, 3, "0"], [7, 17, "o"], [7, 22, "o"]] },
      { clase: "px-on px-a", t: 0.6, p: [...flama(1, 3, 0), ...flama(7, 3, 1), ...flama(13, 3, 0)] },
      { clase: "px-on px-b", t: 0.6, p: [...flama(1, 3, 1), ...flama(7, 3, 0), ...flama(13, 3, 1)] },
    ],
  }),
  mesita_redonda: pix({
    n: "Mesita con mantel", cat: "sala", hondo: 96, torno: true, colores: MANTELES, tope: 8,
    filas: E2([
      ".....]]]]]]]", "...]]{{{{{{{", "..]{{{{{{{{{", "..[]]]]]]]]]", ".)[[[[[[[[[[", ".)[[[[[[[[[[",
      ...X(".)[)[[)[[)[[", 7), "))[)[[)[[)[[", "))[)[[)[[)[[", ")[[)[[)[[)[[", "##[##[##[##[", ".#..#..#..#.",
    ]),
  }),
  rocola: pix({
    n: "Rocola", cat: "sala", al: "musica", musica: "baile", hondo: 52, caja: true, brilla: { x: 52, y: 40, r: 130, c: "#ffb3d6", propio: "on" },
    filas: E2([
      "..........ccd", "........ccdee", "......ccdeeff", ".....cdeIIIII", "....cdeIJJJJJ", "...cdeIJ%%%%%", "..cdeIJ%%%%%%",
      "..cde!?%%%&&&", "..cde!?%%&&II", "..cde!?%%%&&&", "..cde!?%%%%%%", "..cdeZ?%jjjjj", "..cdeZY%kkkkk", "..cdeZY%%%%%%",
      "..cdeZYkkkkkk", "..cdeZYjjjjjj", "..cdddddddddd", "..cdeeeeeeeee", ...[0, 1, 2, 3, 4].flatMap(() => ["..cde%%%%%%%%", "..cde%jjjjjjj"]),
      "..cde%%%%%%%%", "..cdeeeeeeeee", "..cdddddddddd", ".bccccccccccc", ".bddddddddddd", ".beeeeeeeeeee", ".bdnnnnnnnnnn",
      ".bddddddddddd", ".bccccccccccc", ".bbbbbbbbbbbb", "..bb.........", "..bb.........", ".bbb.........",
    ]),
    capas: [
      { p: [[3, 6, "f"], [4, 5, "f"], [5, 4, "f"], [2, 20, "f"], [11, 8, "#"], [12, 7, "k"]] },
      { clase: "px-on px3-1", t: 0.9, p: foquitos(0) },
      { clase: "px-on px3-2", t: 0.9, p: foquitos(1) },
      { clase: "px-on px3-3", t: 0.9, p: foquitos(2) },
      { clase: "px-on px-a", t: 0.5, r: [[11, 8, 2, 1, "J"], [13, 8, 2, 1, "I"]] },
    ],
  }),
  vitrina: pix({
    n: "Vitrina", cat: "cocina", hondo: 56, caja: true, tope: 6,
    filas: E2([
      ".....2222222222", "...223333333333", ".22334444444444", "233333333333333", ".23nnnnnnnnnnnn", ".23444444444444",
      ".234DDDDDDDDD43", ".234DDDCCCDDD43", ".234DDCJJJCDD43", ".234DDCJCJCDD43", ".234DDCJJJCDD43", ".234DDDCCCDDD43",
      ".23433333333343", ".234DDDDDDDDD43", ".234DkkDDkkDD43", ".234DkkjDkkjD43", ".234DjjDDjjDD43", ".23433333333343",
      ".234DDDDDDDDD43", ".234DDPPDDDDD43", ".234DPQPDDDDD43", ".234DPPPDDIDD43", ".234DDPDDDIID43", ".23444444444443",
      ".23nnnnnnnnnnnn", ".23333333333333", ".23444444444443", ".23433333333343", ...X(".23434444444343", 4), ".234344444443n3",
      ...X(".23434444444343", 4), ".23433333333343", ".23444444444443", ".22222222222222", "..22...........", "..22...........",
    ]),
    capas: [{ p: [[11, 6, "Q"], [10, 7, "Q"], [12, 13, "Q"], [11, 14, "Q"], [6, 19, "Q"], [25, 6, "Q"], [24, 7, "Q"], [26, 13, "Q"], [20, 20, "Q"], [19, 21, "Q"]] }],
  }),
  mueble_bajo: pix({
    n: "Mueble bajito", cat: "sala", hondo: 56, caja: true, tope: 6,
    filas: credenza(),
    capas: [{ p: [[6, 8, "o"], [35, 8, "o"], [1, 4, "f"], [15, 4, "f"]] }],
  }),
  sofa_antiguo: pix({
    n: "Sofá antiguo", cat: "sala", hondo: 84, colores: TELAS, lugares: [sentado(-50, -60), sentado(50, -60)],
    filas: E2([
      "........))))))))))))))))))", "......))[[[[[[[[[[[[[[[[[[", ".....)[]]]]]]]]]]]]]]]]]]]", "....)[[[[[[[[[[[[[[[[[[[[[",
      "....)[[[)[[[[[)[[[[[)[[[[[", "....)[[[[[[[[[[[[[[[[[[[[[", "....)[[[[[[)[[[[[)[[[[[)[[", ".)))))[[[[[[[[[[[[[[[[[[[[",
      ")]]]]])[[)[[[[[)[[[[[)[[[[", ")[[[[[)[[[[[[[[[[[[[[[[[[[", ")[[[[[)[[[[[)[[[[[)[[[[[)[", ")[[[[[)[[[[[[[[[[[[[[[[[[[",
      ")[[[[[))))))))))))))))))))", ")[[[[[)]]]]]]]]]]]]]]]]]]]", ")[[[[[)[[[[[[[[[[[[[[[[[[[", ")[[[[[)[[[[[[[[[[[[[[[[[[[",
      ")[[[[[)(((((((((((((((((((", ")[[[[[))))))))))))))))))))", ")([[[((((((((((((((((((((((", ")(((((((((((((((((((((((((",
      ".)((((((((((((((((((((((((", "..bbbbbbbbbbbbbbbbbbbbbbbb", "..cddddddddddddddddddddddd", "..bccccccccccccccccccccccc",
      "...bc.....................", "...bc.....................", "..bbc.....................", "..bb......................",
    ]).map((f) => f.slice(0, 52)),
    capas: [{ p: [[1, 8, "{"], [2, 8, "{"], [9, 2, "{"], [10, 2, "{"], [3, 22, "e"]] }],
  }),
  perchero: pix({
    n: "Perchero", cat: "recamara", hondo: 56, torno: true, volcable: true, perfil: [[0, 64, 0.3, 0.7]],
    filas: [
      "......43......", ".....4332.....", "..3...43.eee..", "..32..43eeffe.", "...33343wwwww.", ".IH...43ffffff", ".IIH..43.dddd.",
      ".IIH..43......", ".IHH..43......", ".IIH..43......", "..IH..43......", "..IH..43......", ".JIH..43......", ".IIH..43......",
      ".I.H..43......", ...X("......43......", 23), ".....3443.....", "....334433....", "...33344333...", "..3333443333..", ".222222222222.", "..22......22..",
    ],
  }),
  ficus: pix({
    n: "Ficus", cat: "deco", hondo: 80, torno: true,
    filas: [
      "..........ss............", "........ssrrs..tt.......", ".....tssrrqrrsstss......", "....tssrqqrrsrrrsrs.....",
      "...ssrrqpqrrsrqqrrss....", "..tsrrqpqrsrrsrqpqrss...", "..srqqpqrrsrrrsrqqrrst..", ".tsrqpqrrssrqqrrsrrrss..",
      ".srrqqrrstsrqpqrrsrqrs..", "tsrqpqrrsrrqpqrrssrqqrs.", "srrqqrsssrqqrrsttsrqpqrs", "srqpqrrsrrqrrsrrsrrqqrs.",
      ".srqqrrsrqpqrrqqrrsrrrs.", ".tsrrssrqqrrsrpqrsrqqs..", "..ssrrsrrrsrrqqrrsrrs...", "...tssrsrssrsrrssrst....",
      "....tsss.4rs..sss.......", ".......ss43ss.s.........", "........r43.ss..........", ".........43.............",
      ".........43r............", "........s43rs...........", "........r43.............", ".........43.............",
      ".........43.............", ".........43.............", "....788888888887........", "....677777777776........",
      ".....6777777776.........", ".....6787777776.........", ".....6787777776.........", ".....6777777776.........",
      "......67777776..........", "......56666665..........", ".......555555...........",
    ],
  }),
  reloj_cucu: pix({
    n: "Reloj cucú", cat: "deco", capa: "pared", al: "reloj",
    filas: E2([
      "......2", ".....23", "....234", "...2344", "..23444", ".234444", "2344444", "2222222", ".3ddddd", ".3ddd00", ".3ddd00", ".3ddddd",
      ".3dmmmm", ".3dmCCC", ".3dmCC0", ".3dmCCC", ".3dmmmm", ".3ddddd", ".333333", ...X(".......", 6),
    ]),
    capas: [
      { p: [[0, 7, "r"], [13, 7, "r"], [1, 6, "s"], [12, 6, "s"], [8, 13, "0"], [9, 12, "0"], [4, 19, "i"], [4, 20, "i"], [4, 21, "i"], [9, 19, "i"], [9, 20, "i"], [9, 21, "i"],
        [4, 22, "b"], [3, 23, "b"], [4, 23, "c"], [5, 23, "b"], [4, 24, "b"], [9, 22, "b"], [8, 23, "b"], [9, 23, "c"], [10, 23, "b"], [9, 24, "b"]] },
      { clase: "px4-1", t: 2, p: pendulo(6, 19, 2, 0) }, { clase: "px4-2", t: 2, p: pendulo(6, 19, 2, 1) },
      { clase: "px4-3", t: 2, p: pendulo(6, 19, 2, 0) }, { clase: "px4-4", t: 2, p: pendulo(6, 19, 2, -1) },
      { clase: "px-cucu", p: [[5, 9, "w"], [6, 9, "0"], [7, 9, "w"], [6, 10, "w"], [7, 10, "x"], [8, 10, "w"], [4, 10, "!"]] },
    ],
  }),
  cuadro_paisaje: pix({
    n: "Cuadro del campo", cat: "deco", capa: "pared",
    filas: X(".".repeat(30), 22),
    capas: [
      { r: [[0, 0, 30, 22, "m"], [1, 1, 28, 20, "n"], [1, 1, 28, 1, "o"], [1, 1, 1, 20, "o"], [1, 20, 28, 1, "l"], [28, 1, 1, 20, "l"], [2, 2, 26, 18, "l"]] },
      { x: 3, y: 3, f: [
        "AAAAAAAAAAAAAAAAAAAAAAAA", "AAAABBBAAAAAAAAAAA?!?AAA", "AAABCCCBAAAAAAAAA?!!!?AA", "BBBBBBBBBBBBBBBBBB?!?BBB",
        "BBBBBBBBBBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBBBBBBBBBB", "BBBBBBBBBBNNBBBBBBBBBBBB", "BBBBBBBBBNNMNBBBBBBBNBBB",
        "BBBBBBBBNMMMMNBBBBBNMNBB", "BBBtttBNMMMMMMNBBBNMMMNB", "BBtsssttMMMMMMMNttNMMMMN", "ttssssssstttttttsssttttt",
        "sssrsssssssssssssrssssss", "ssrqrsssss77ssssrqrsssss", "rrrqrrrrr7887rrrrqrrrrrr", "qqqqqqqq788887qqqqqqqqqq",
      ] },
      { p: [[3, 15, "b"], [3, 16, "b"], [21, 15, "b"], [21, 16, "b"]] },
    ],
  }),
  repisa_madera: pix({
    n: "Repisa de madera", cat: "deco", capa: "pared", tope: 3,
    filas: ["e".repeat(30), "d".repeat(30), "b" + "c".repeat(28) + "b", "...cdb..................cdb...", "...cdb..................cdb...", "....cb..................cb....", "....cb..................cb....", ".....b..................b....."],
    capas: [{ r: [[0, 0, 1, 2, "f"]] }],
  }),
  alfombra_rayas: pix({ n: "Tapete de rayas", cat: "sala", capa: "alfombra", y: 556, filas: rayas() }),

  // ── Cositas chicas (se ponen encima de mesas, escritorios, estantes y repisas) ──
  vaso_agua: pix({
    n: "Vaso de agua", cat: "adornos", y: 550, torno: true, hondo: 16, fragil: "vidrio", derrame: "agua",
    filas: ["PQQP", "QSSP", "Q#SP", "QSRP", "QSRP", ".PP."],
  }),
  vaso_jugo: pix({
    n: "Vaso de jugo", cat: "adornos", y: 550, torno: true, hondo: 16, fragil: "vidrio", derrame: "jugo",
    filas: ["..I.", "PQIP", "QVIP", "Q?VP", "QVUP", "QVUP", ".PP."],
  }),
  copa: pix({
    n: "Copa", cat: "adornos", y: 550, torno: true, hondo: 20, fragil: "vidrio", derrame: "jugo",
    filas: ["PQQQP", "QwwvP", ".QvP.", "..Q..", "..Q..", "..P..", ".QPP.", ".PPP."],
  }),
  jarron_vidrio: pix({
    n: "Jarrón con tulipanes", cat: "adornos", y: 550, torno: true, hondo: 28, fragil: "vidrio", derrame: "agua",
    filas: [".I...?.", "IJI.!?!", ".H.r.9.", "s.r.r.s", ".srrrs.", "..rrr..", ".QPPPQ.", ".QrPrP.", "Q#SrSRP", "Q#SSSRP", "QSSSSRP", ".QSSRP.", "..PPP.."],
  }),
  lampara_mesa: pix({
    n: "Lámpara de mesa", cat: "adornos", y: 550, al: "lava", torno: true, hondo: 36, colores: PANTALLAS, brilla: { x: 18, y: 10, r: 100, propio: "on" },
    filas: E(["..)))", ".)[[[", ".)]]]", ")[[[[", ")((((", "....n", "...mn", "...DC", "..EDC", "..EDC", "..EDD", "...ED", ".llll"]),
    capas: [
      { p: [[2, 1, "{"], [1, 3, "{"], [3, 8, "#"], [3, 9, "#"]] },
      { clase: "px-on", r: [[2, 1, 5, 1, "{"], [1, 2, 7, 2, "]"], [3, 4, 3, 1, "W"]] },
    ],
  }),
  lampara_hongo: pix({
    n: "Lamparita de hongo", cat: "adornos", y: 550, al: "lava", torno: true, hondo: 36, brilla: { x: 18, y: 14, r: 80, c: "#ffb3a0", propio: "on" },
    filas: E(["...ww", ".wwxx", "wwx#x", "vwwxx", "vvwww", ".vvvv", "...DC", "...DC", "..EDC", ".EDDC", ".FEEE"]),
    capas: [{ clase: "px-on", r: [[2, 1, 5, 1, "J"], [1, 2, 7, 2, "x"], [3, 6, 3, 3, "?"]], p: [[3, 2, "#"], [5, 2, "#"], [4, 3, "#"], [2, 3, "#"], [6, 3, "#"]] }],
  }),
  libro_abierto: pix({ n: "Libro abierto", cat: "adornos", y: 550, hondo: 28, filas: E2([".CCCCC", "DCEEEC", "DCEEEC", "DCCCCE", "wwwwww"]) }),
  libros_fila: pix({ n: "Libros con sujetalibros", cat: "adornos", y: 550, hondo: 32, filas: libritos() }),
  suculenta: pix({ n: "Suculenta", cat: "adornos", y: 550, torno: true, hondo: 28, filas: E(["...s", ".s.t", "srst", ".rsr", "7888", ".677", "..66"]) }),
  bonsai: pix({
    n: "Bonsái", cat: "adornos", y: 550, hondo: 40,
    filas: ["...ssss......", "..srrrss.sss.", ".srqqrrssrrs.", "..sqqrs.srqs.", "....bb..rqs..", ".....bb.bb...", "......bbb....", "......bc.....", ".....bcb.....", ".YZZZZZZZZZY.", ".XYYYYYYYYYX.", "..XXXXXXXXX..", "..X.......X.."],
    capas: [{ p: [[4, 9, "r"], [5, 9, "s"], [8, 9, "r"]] }],
  }),
  maneki: pix({
    n: "Gatito de la suerte", cat: "adornos", y: 550, hondo: 28, torno: true,
    filas: [".D....D.", ".DJ..JD.", ".CCCCCC.", "CC0CC0CC", "CCCJJCCC", ".CwwwwC.", "CCC!CCCC", "CCCCCCCC", "CDCCCCDC", ".DDDDDD."],
    capas: [
      { clase: "px-a", t: 1.4, p: [[7, 0, "C"], [7, 1, "J"], [7, 2, "C"], [6, 3, "C"]] },
      { clase: "px-b", t: 1.4, p: [[7, 2, "C"], [7, 3, "J"], [7, 4, "C"]] },
    ],
  }),
  bola_nieve: pix({
    n: "Bola de nieve", cat: "adornos", y: 550, hondo: 24, torno: true, fragil: "vidrio", derrame: "agua",
    filas: [".PQQP.", "QBBBBP", "QBwwBP", "QBCCBP", ".CCCC.", ".cddc.", "cbbbbc"],
    capas: [
      { clase: "px3-1", t: 2.4, p: [[1, 1, "#"], [4, 2, "#"]] },
      { clase: "px3-2", t: 2.4, p: [[1, 2, "#"], [4, 3, "#"], [3, 1, "#"]] },
      { clase: "px3-3", t: 2.4, p: [[1, 3, "#"], [4, 1, "#"]] },
    ],
  }),
  reloj_arena: pix({
    n: "Reloj de arena", cat: "adornos", y: 550, hondo: 16, torno: true, fragil: "vidrio",
    filas: ["mnnm", "lPQl", "lPQl", "lPPl", "lPQl", "lPQl", "mnnm"],
    capas: [
      { clase: "px3-1", t: 6, p: [[1, 1, "!"], [2, 1, "!"], [1, 2, "!"], [2, 2, "!"], [1, 5, "9"]] },
      { clase: "px3-2", t: 6, p: [[1, 2, "!"], [2, 2, "!"], [1, 3, "!"], [1, 5, "9"], [2, 5, "9"]] },
      { clase: "px3-3", t: 6, p: [[2, 2, "!"], [1, 4, "9"], [1, 5, "9"], [2, 5, "9"], [2, 4, "9"]] },
    ],
  }),
  caja_musica: pix({
    n: "Cajita de música", cat: "adornos", y: 550, al: "musica", musica: "baile", hondo: 32, caja: true,
    filas: [".dddddddd.", ".dQQQQQQd.", ".dQPPPPQd.", ".dQQQQQQd.", ".dddddddd.", "eeeeeeeeee", "dddIdIdddd", "dddIIIdddd", "ddddIddddd", "bbbbbbbbbb"],
    capas: [
      { clase: "px-off", p: [[4, 1, "8"], [4, 2, "I"], [3, 3, "J"], [4, 3, "J"], [5, 3, "J"], [4, 4, "C"]] },
      { clase: "px-on px-a", t: 0.8, p: [[4, 1, "8"], [4, 2, "I"], [3, 3, "J"], [4, 3, "J"], [5, 3, "J"], [4, 4, "C"]] },
      { clase: "px-on px-b", t: 0.8, p: [[5, 1, "8"], [5, 2, "I"], [4, 3, "J"], [5, 3, "J"], [6, 3, "J"], [5, 4, "C"]] },
    ],
  }),
  robotito: pix({
    n: "Robotito", cat: "adornos", y: 550, hondo: 28, caja: true,
    filas: ["........", "....i...", ".jkkkkj.", ".jZjjZj.", ".jjwwjj.", ".iiiiii.", "hjjjjjjh", "hjw!Zjjh", ".jjjjjj.", ".ii..ii.", ".hh..hh."],
    capas: [{ clase: "px-a", t: 1.2, p: [[4, 0, "W"]] }, { clase: "px-b", t: 1.2, p: [[4, 0, "w"]] }],
  }),
  vela_frasco: pix({
    n: "Vela en frasco", cat: "adornos", y: 550, al: "fuego", torno: true, hondo: 16, fragil: "vidrio", brilla: { x: 8, y: 6, r: 64, c: "#ffcf7a", propio: "on" },
    filas: ["....", "....", "....", "QQQP", "QCDP", "QCDP", "PPPP"],
    capas: [
      { p: [[1, 3, "0"]] },
      { clase: "px-on px-a", t: 0.6, p: flama(1, 2, 0) },
      { clase: "px-on px-b", t: 0.6, p: flama(1, 2, 1) },
    ],
  }),
  carrito: pix({ n: "Carrito de juguete", cat: "adornos", y: 550, hondo: 24, filas: ["...wwww....", "..wBBwBw...", ".wwwwwwwww.", "?wwwwwwwww?", "vv00vvv00vv", "..00...00.."] }),
  cubo_colores: pix({ n: "Cubo de colores", cat: "adornos", y: 550, hondo: 24, caja: true, filas: ["wwBB!!", "wwBB!!", "ssCCUU", "ssCCUU", "!!ssww", "!!ssww"] }),
  plato_deco: pix({ n: "Plato de talavera", cat: "adornos", y: 550, hondo: 16, fragil: "ceramica", filas: E(["..CCC", ".CAAA", "CACCA", "CACAz", "CACCA", ".CAAA", "..CCC", "...l.", "..lll"]) }),
};
// Las cositas chicas se llevan con el dedo mientras juegan (y se ponen encima de los muebles).
for (const d of Object.values(ITEMS)) if (d.cat === "adornos") d.portatil = true;
