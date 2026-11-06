/**
 * MÁS DECORACIÓN (Fase 69): plantitas, lámparas, cosas de pared, textiles y más adornitos, en el mismo pixel art de
 * `finos.js` (cuadrito por cuadrito, sombreado a mano, lo que se mueve en cuadros). Las proporciones van con el
 * monito: un vaso es más chico que una maceta, una lámpara de mesa le llega a la cintura a una mesa, la palmera es
 * casi de su altura.
 */
import { pix, E, E2, X } from "./pixel.js";
import { sentado } from "./arte.js";

const TELAS = ["#ef8bb4", "#937ac8", "#5a83c2", "#58b4a0", "#e9c23c", "#c44a54"];
const PANTALLAS = ["#ffc6dc", "#fff3a0", "#c8b6ef", "#bfe6d4", "#f3e5c8"];
/** Los cuadritos de una letra pintados de otra (para «prendido»: el papel de la lámpara se ilumina). */
const recolor = (filas, de, a, ox = 0, oy = 0) => filas.flatMap((f, y) => [...f].map((c, x) => (c === de ? [x + ox, y + oy, a] : null)).filter(Boolean));
/** Una florecita de 3×3 (centro y pétalos). */
const flor = (x, y, p = "J", c = "H") => [[x, y - 1, p], [x - 1, y, p], [x, y, c], [x + 1, y, p], [x, y + 1, p]];

/** La sansevieria: hojas como espadas, con bandas y orilla amarilla. */
function sansevieria() {
  const W = 12, H = 24, f = Array.from({ length: H }, () => Array(W).fill("."));
  for (const [x, top] of [[2, 0], [5, 2], [8, 1], [10, 6], [0, 7], [4, 9], [7, 5]]) {
    for (let y = top; y < 17; y++) {
      const banda = (y + x) % 4 === 0;
      f[y][x] = y === top ? "s" : y % 5 === 2 ? "t" : banda ? "s" : "r";
      if (x + 1 < W) f[y][x + 1] = y === top ? "." : banda ? "q" : y % 3 ? "q" : "p";
    }
  }
  const maceta = ["..CCCCCCCC..", "..DCCCCCCD..", "..DAAAAAAD..", "..DCCCCCCD..", "..DCzCCzCD..", "..DCCCCCCD..", "...DDDDDD...", "....EEEE...."];
  maceta.forEach((m, i) => { for (let x = 0; x < W; x++) if (m[x] !== ".") f[16 + i][x] = m[x]; });
  return f.map((r) => r.join(""));
}
/** La palmera de interior: hojas que salen del centro, con sus foliolos, en su canasta de mimbre. */
function palmera() {
  const W = 26, H = 36, f = Array.from({ length: H }, () => Array(W).fill(".")), pon = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) f[y][x] = c; };
  const cx = 13, cy = 13;
  for (const [ang, L] of [[-160, 12], [-130, 13], [-100, 12], [-70, 12], [-45, 13], [-15, 12], [180, 10], [0, 10], [-88, 9]]) {
    const a = (ang * Math.PI) / 180;
    for (let i = 0; i <= L; i++) {
      const t = i / L, x = cx + Math.cos(a) * i, y = cy + Math.sin(a) * i + t * t * 5;
      pon(x, y, i % 2 ? "r" : "q");
      if (i > 1 && i < L) { const n = Math.max(1, Math.round((1 - t) * 3)); for (let k = 1; k <= n; k++) { pon(x - Math.sin(a) * k, y + Math.cos(a) * k + k * 0.6, k === n ? "s" : "r"); pon(x + Math.sin(a) * k, y - Math.cos(a) * k + k * 0.6, k === n ? "t" : "s"); } }
    }
  }
  for (let y = 13; y < 28; y++) { pon(12, y, y % 3 ? "c" : "b"); pon(13, y, y % 3 ? "b" : "a"); }
  const canasta = ["......edededededed.......", "......dededededede.......", ".....edcdcdcdcdcdce......", ".....dcdcdcdcdcdcdd......", ".....ededededededee......", "......dcdcdcdcdcdc.......", "......cdcdcdcdcdcd.......", ".......bbbbbbbbbb........"];
  canasta.forEach((m, i) => { for (let x = 0; x < m.length && x < W; x++) if (m[x] !== ".") f[28 + i][x + 1] = m[x]; });
  return f.map((r) => r.join(""));
}


/** El organizador: sus puertitas (cada una una capa viva que se abre girando sobre su bisagra). */
const PUERTA = ["dddddddddddd", "deeeeeeeeeec", "deccccccccec", ...X("decdddddddec", 11), "deccccccccec", "deeeeeeeeeec", "deccccccccec", ...X("decdddddddec", 12), "deccccccccec", "deeeeeeeeeec", "cccccccccccc"];
const HUECO = ["dcaaaaaaaaaaac", ...X("dcbbbbbbbbbbbc", 8), "dceeeeeeeeeeec", "dcdddddddddddc"];

export const ITEMS = {
  // ── Plantitas ──
  helecho_colgante: pix({
    n: "Helecho colgante", cat: "plantas", capa: "pared",
    filas: [
      "......EE......", ".....E..E.....", "....E....E....", "...E......E...", "...E.s..s.E...", "..sE.rssr.Es..", ".srsrsrrsrsrs.", "srrqrrqqrrqrrs",
      "r788888888887r", "sr6777777776rs", "r.6787777776.r", "s..56666665..s", "r.r.555555.r.r", "s.r........r.s", "r.s........s.r", ...X("..............", 5),
    ],
    capas: [
      { clase: "px-a", t: 3.2, p: [[2, 15, "r"], [11, 15, "r"], [2, 16, "s"], [11, 16, "s"], [3, 17, "r"], [10, 17, "r"], [3, 18, "s"], [10, 18, "s"]] },
      { clase: "px-b", t: 3.2, p: [[1, 15, "r"], [12, 15, "r"], [2, 16, "s"], [11, 16, "s"], [2, 17, "r"], [11, 17, "r"], [3, 18, "s"], [10, 18, "s"]] },
    ],
  }),
  sansevieria: pix({ n: "Sansevieria", cat: "plantas", hondo: 40, filas: sansevieria() }),
  palmera_interior: pix({ n: "Palmera de interior", cat: "plantas", hondo: 96, filas: palmera() }),
  orquidea: pix({
    n: "Orquídea", cat: "plantas", y: 550, hondo: 28,
    filas: [".........", ".........", ".........", ".........", "....r....", "...r.....", "...r.....", "..r......", ".s.r.s...", "..srs....", ".CCCCCC..", ".DCCCCD..", ".DCAACD..", "..DDDD..."],
    capas: [{ p: [...flor(4, 1), ...flor(7, 2, "N", "L"), ...flor(2, 3), [5, 2, "r"], [6, 3, "r"], [3, 4, "r"]] }],
  }),
  lavanda: pix({ n: "Lavanda en maceta", cat: "plantas", y: 550, hondo: 32, filas: ["M..N..M.", "NM.MN.NM", ".M.NM.M.", ".r.Mr.r.", ".r.rr.r.", "..srrs..", "78888887", ".677776.", ".677876.", "..5665.."] }),
  cactus_flor: pix({ n: "Cactus con flor", cat: "plantas", y: 550, hondo: 28, filas: ["...I...", "..IJI..", "..rtr..", "s.rsr..", "rsrsr.s", ".rrsrsr", "..rsr..", "6777776", ".55555."] }),
  pothos: pix({
    n: "Pothos colgantito", cat: "plantas", y: 550, hondo: 36,
    filas: ["..s.rs.s..", ".srsrrsrs.", "srrqrrqrrs", ".78888887.", ".67777776.", "r.677776.s", "s.r5555r.r", "r.s....s.s", "s.r....r.r", "..s....s..", "..r.......", "..s......."],
  }),
  // ── Lámparas ──
  lampara_colgante: pix({
    n: "Lámpara colgante", cat: "deco", capa: "pared", al: "lava", colores: PANTALLAS, brilla: { x: 24, y: 70, r: 170, propio: "on" },
    sinContorno: true,
    filas: E([...X(".....&", 10), "....hh", "...)[[", "..)[]]", ".)[[[[", ")[[[[[", ")(((((", "....DC"]),
    capas: [{ clase: "px-on", r: [[2, 12, 7, 1, "{"], [1, 13, 9, 2, "]"], [4, 16, 3, 1, "W"]] }],
  }),
  farolito: pix({
    n: "Farolito", cat: "adornos", y: 550, al: "fuego", hondo: 28, brilla: { x: 14, y: 20, r: 80, c: "#ffcf7a", propio: "on" },
    filas: ["...n...", "..m.m..", ".mnnnm.", ".lQQQl.", ".lQQQl.", ".lQCQl.", ".lQCQl.", ".lQDQl.", "mnnnnnm", ".m...m."],
    capas: [
      { clase: "px-on px-a", t: 0.55, p: [[3, 4, "V"], [3, 3, "W"]] },
      { clase: "px-on px-b", t: 0.55, p: [[3, 4, "W"], [3, 3, "V"], [2, 4, "U"]] },
    ],
  }),
  lampara_papel: (() => {
    const filas = E2(["...DDDD", "..DCCCC", ".DCCCCC", "DCCCCCC", "EDDDDDD", ...[0, 1, 2, 3, 4].flatMap(() => [...X("DCCCCCC", 4), "EDDDDDD"]), ".DCCCCC", "..DDDDD", ...X("......b", 7), "...cccc", "..bbbbb"]);
    return pix({
      n: "Lámpara de papel", cat: "sala", al: "lava", hondo: 56, torno: true, brilla: { x: 28, y: 60, r: 170, c: "#ffe2a8", propio: "on" },
      filas, capas: [{ clase: "px-on", p: recolor(filas, "C", "?") }],
    });
  })(),
  // ── En la pared ──
  espejo_redondo: pix({
    n: "Espejo redondo", cat: "deco", capa: "pared",
    filas: E2(["....mnnn", "..mnoQQQ", ".mnQQQQQ", ".nQQPPPP", "mnQPPPPP", "nQQPPPPP", "nQPPPPPP", "nQPPPPPP"].concat(["nQPPPPPP", "nQPPPPPP", "nQPPPPPP", "mnPPPPPP", ".nPPPPPP", ".mnPPPPP", "..mnPPPP", "....mnnn"].map((f, i) => (i > 9 ? f : f)))),
    capas: [{ clase: "px-brillo", p: [[5, 3, "#"], [4, 4, "#"], [3, 5, "#"], [6, 3, "Q"], [5, 4, "Q"]] }],
  }),
  reloj_pared: pix({
    n: "Reloj de pared", cat: "deco", capa: "pared", al: "reloj",
    filas: E2(["....dddd", "..ddeeee", ".deeCCCC", ".deCCCC0", "deCCCCCC", "deCCCCCC", "de0CCCCC", "deCCCCC0"]).concat(E2(["deCCCCCC", "deCCCCCC", ".deCCCCC", ".deCCCC0", "..ddeeee", "....dddd"])),
    capas: [
      { p: [[7, 7, "0"], [6, 7, "0"], [7, 5, "0"], [7, 6, "0"]] },
      { clase: "px4-1", t: 4, p: [[8, 4, "w"]] }, { clase: "px4-2", t: 4, p: [[10, 8, "w"]] },
      { clase: "px4-3", t: 4, p: [[7, 11, "w"]] }, { clase: "px4-4", t: 4, p: [[4, 8, "w"]] },
    ],
  }),
  guirnalda_foquitos: (() => {
    const W = 40, filas = Array.from({ length: 9 }, () => "."), alambre = [], focos = [];
    for (let x = 0; x < W; x++) { const y = Math.round(1 + Math.sin((x / (W - 1)) * Math.PI) * 4); alambre.push([x, y, "2"]); if (x % 5 === 2) focos.push([x, y + 1]); }
    const C = ["w", "!", "Z", "I", "A", "U", "M", "s"];
    return pix({
      n: "Guirnalda de foquitos", cat: "deco", capa: "pared", sinContorno: true, brilla: { x: 80, y: 22, r: 120, c: "#ffe7a0", siempre: true },
      filas: filas.map(() => ".".repeat(W)),
      capas: [
        { p: alambre },
        { p: focos.flatMap(([x, y], i) => [[x, y, "&"], [x, y + 1, C[i % C.length]], [x - 1, y + 1, C[i % C.length]], [x, y + 2, C[i % C.length]], [x - 1, y + 2, C[i % C.length]]]) },
        { clase: "px3-1", t: 1.8, p: focos.filter((_, i) => i % 3 === 0).map(([x, y]) => [x - 1, y + 1, "W"]) },
        { clase: "px3-2", t: 1.8, p: focos.filter((_, i) => i % 3 === 1).map(([x, y]) => [x - 1, y + 1, "W"]) },
        { clase: "px3-3", t: 1.8, p: focos.filter((_, i) => i % 3 === 2).map(([x, y]) => [x - 1, y + 1, "W"]) },
      ],
    });
  })(),
  cuadro_gatito: pix({
    n: "Retrato del gatito", cat: "deco", capa: "pared",
    filas: X(".".repeat(18), 22),
    capas: [
      { r: [[0, 0, 18, 22, "3"], [1, 1, 16, 20, "4"], [1, 1, 16, 1, "d"], [2, 2, 14, 18, "J"]] },
      { x: 3, y: 4, f: ["..h......h..", ".hih....hih.", ".hiihhhhiih.", ".hiiiiiiiih.", "hiiikiikiiih", "hii0kii0kiih", "hiiiiIIiiiih", "hiiiii0iiiih", ".hiii0.0iih.", "..hhiiiihh..", "...wwwwww...", "..hwiw!wwh..", ".hiiiiiiiih.", "hiiiiiiiiiih"] },
    ],
  }),
  cuadro_bodegon: pix({
    n: "Cuadro de frutas", cat: "deco", capa: "pared",
    filas: X(".".repeat(20), 16),
    capas: [
      { r: [[0, 0, 20, 16, "m"], [1, 1, 18, 14, "n"], [1, 1, 18, 1, "o"], [2, 2, 16, 12, "X"], [2, 10, 16, 4, "4"]] },
      { x: 4, y: 4, f: ["......s.....", ".....rs.....", "..ww.!!..vv.", ".wxww!?!vvwv", ".wwwvU!!vvvv", "..wv.UU..vv.", "CCCCCCCCCCCC", ".DDDDDDDDDD.", "..EEEEEEEE.."] },
    ],
  }),
  corona_flores: pix({
    n: "Corona de flores", cat: "deco", capa: "pared",
    filas: E2(["....qrrs", "..qrrsrq", ".qrs..sr", ".rs.....", "qrs.....", "rs......", "rs......", "qr......"]).concat(E2(["rs......", "qrs.....", ".rs.....", ".qrs..sr", "..qrrsrq", "....qrrs", ".....www", "....w.ww"])),
    capas: [{ p: [...flor(3, 3), ...flor(12, 3, "?", "!"), ...flor(2, 9, "N", "L"), ...flor(13, 10), ...flor(8, 13, "x", "w"), ...flor(7, 1, "?", "!")] }],
  }),
  // ── Textiles y muebles chiquitos ──
  cesta_mimbre: pix({
    n: "Cesta con cobija", cat: "recamara", hondo: 40, colores: TELAS,
    filas: ["..))[[[]]{{[[....", ".)[[]]{{]][[[)(..", ")[[[{{]][[[[[))(.", "dedededededededed", "cdcdcdcdcdcdcdcdc", "dedededededededed", "cdcdcdcdcdcdcdcdc", "dedededededededed", ".cdcdcdcdcdcdcdc.", "..bbbbbbbbbbbbb.."],
  }),
  escalera_mantas: pix({
    n: "Escalera con mantas", cat: "recamara", hondo: 30, volcable: true, colores: TELAS,
    filas: [
      "..de........de..", "..dc........dc..", "..dddddddddddd..", "..dc........dc..", "..dc)[[]]))(dc..", "..dc[[]][[[[dc..", "..dc]]{{]][(dc..", "..dddddddddddd..",
      "..dc[)....[)dc..", ".de.[)....[).de.", ".dc..........dc.", ".dddddddddddddd.", ".dcGHIIHHGGHIdc..", ".dcHIIJJIIHHGdc..", ".dcGHHIIHHGGHdc..", ".dc.HI....HI.dc.",
      ".dc.GH....GH.dc.", "de............de", "dc............dc", "dddddddddddddddd", "dc............dc", "dc............dc", "dc............dc", "bb............bb",
    ].map((f) => f.slice(0, 16)),
  }),
  biombo: pix({
    n: "Biombo de flores", cat: "recamara", hondo: 20,
    filas: (() => {
      const panel = ["dddddddddddd", "dJJJJJJJJJJd", "dJJIJJJJsJJd", "dJIHIJJJrsJd", "dJJIJJJsrJJd", "dJJrJJJJrJJd", "dJJrJJIJrJJd", "dJsrJIHIrJJd", "dJJrsJIJrsJd", "dJJrJJrJrJJd"];
      const fil = [];
      for (let y = 0; y < 40; y++) { const p = y < 10 ? panel[y] : y < 36 ? panel[2 + ((y - 2) % 8)] : y < 38 ? "dddddddddddd" : ".b........b."; fil.push(p + p + p); }
      return fil;
    })(),
  }),
  banco_tapizado: pix({
    n: "Banca tapizada", cat: "sala", hondo: 44, colores: TELAS, lugares: [sentado(-30, -26), sentado(30, -26)],
    filas: [".]]]]]]]]]]]]]]]]]]]]]]]]]]]]]].", "]{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{]", "[[[)[[[[[[)[[[[[[[)[[[[[[[)[[[[[", "[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[", "((((((((((((((((((((((((((((((((", "dddddddddddddddddddddddddddddddd", "cbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbc", ".cb..........................bc.", ".cb..........................bc.", ".cbccccccccccccccccccccccccccbc.", ".cb..........................bc.", ".cb..........................bc.", ".bb..........................bb."],
  }),
  paraguero: pix({
    n: "Paragüero", cat: "sala", y: 548, hondo: 32, volcable: true,
    filas: ["..w...A...", ".wxw.AB...", "wxwxwBAB..", "..u..z....", "..u...z...", "..u...z...", "..u...z...", ".huu..zg..", ".hijjjjih.", ".hijjjjih.", ".hijjjjih.", ".hinnnnih.", ".hijjjjih.", ".hijjjjih.", ".hijjjjih.", ".hinnnnih.", ".hijjjjih.", ".hijjjjih.", "..hhhhhh..", "...gggg..."],
  }),
  maletas: pix({
    n: "Maletas viejitas", cat: "recamara", hondo: 48,
    filas: [
      "......nnnn........", ".....n....n.......", "..cccccccccccccc..", "..cdddddddddddmc..", "..cdeeeeeeeeedmc..", "..cddddnnddddddc..", "..cbbbbbbbbbbbbc..", "..cccccccccccccc..",
      "........nnn.......", ".......n...n......", "uuuuuuuuuuuuuuuuuu", "uvvvvvvvvvvvvvvvmu", "uvwwwwwwwwwwwwwvmu", "uvvvvvvvnnvvvvvvvu", "uvvvvvvvvvvvvvvvvu", "uvwwwwwwwwwwwwwwvu", "uvvvvvvvvvvvvvvvmu", "uuuuuuuuuuuuuuuuuu", ".l..............l.", ".l..............l.",
    ],
  }),
  // ── Más adornitos (chiquitos, para mesas y repisas) ──
  frutero: pix({ n: "Frutero", cat: "adornos", y: 550, hondo: 32, filas: ["....rs......", "..ww.r!!....", ".wxww!?!vv..", "wwwwvU!!vvvw", "CCCCCCCCCCCC", ".DDDDDDDDDD.", "...EEEEEE..."] }),
  taza_cafe: pix({
    n: "Taza de café", cat: "adornos", y: 550, hondo: 16,
    filas: [".....", ".....", ".....", "CCCC.", "C33CD", "CCCCD", "DCCC.", ".DDD."],
    capas: [{ clase: "px-a", t: 1.6, p: [[1, 2, "k"], [2, 1, "k"]] }, { clase: "px-b", t: 1.6, p: [[2, 2, "k"], [1, 0, "k"]] }],
  }),
  perfumes: pix({ n: "Perfumes", cat: "adornos", y: 550, hondo: 20, fragil: "vidrio", filas: ["..n.....", ".nmn..o.", ".JIJ.mnm", "JIIIJ.Q.", "J#IIJPQP", "JIIIJQ#P", "JIIHJQQP", ".JJJ.PPP"] }),
  joyero: pix({ n: "Joyero", cat: "adornos", y: 550, hondo: 24, filas: [".wwwwwww.", "wHJJJJJHw", "wJ#.#.#Jw", "vvvvvvvvv", "vnvvnvvnv", "vvvvvvvvv", ".uuuuuuu."] }),
  dino: pix({ n: "Dinosaurio de juguete", cat: "adornos", y: 550, hondo: 20, filas: [".......ss.", "......sstt", "......s0ss", ".s....sss.", "sssssssss.", ".ssttsss..", "..ss..ss..", "..rr..rr.."] }),
  caracolas: pix({ n: "Caracolas", cat: "adornos", y: 550, hondo: 20, filas: ["..JJ.....", ".JIIJ.DE.", "JIHIJDCCE", "JJIJJECDE", ".JJ..EEE."] }),
  difusor: pix({
    n: "Difusor de aroma", cat: "adornos", y: 550, hondo: 20,
    filas: ["......", "......", "......", "..CC..", ".CCCD.", "CCDCCD", "CCCCCD", "DCCCCE", ".DDDE."],
    capas: [{ clase: "px3-1", t: 2.4, p: [[2, 2, "k"], [3, 1, "j"]] }, { clase: "px3-2", t: 2.4, p: [[3, 2, "k"], [2, 0, "j"]] }, { clase: "px3-3", t: 2.4, p: [[2, 1, "k"], [3, 0, "j"]] }],
  }),
  camara_foto: pix({ n: "Cámara de fotos", cat: "adornos", y: 550, hondo: 20, filas: ["..hh..k..", "ggggggggg", "gjjhhhjjg", "gjhAAhjjg", "gjhAzhjwg", "gjjhhhjjg", "ggggggggg"] }),
  maquina_escribir: pix({
    n: "Máquina de escribir", cat: "adornos", y: 550, hondo: 32,
    filas: ["...CCCCCCCC...", "...DCCCCCCD...", "gggggggggggggg", "ghiiiiiiiiiihg", "ghjkjkjkjkjihg", "ghikjkjkjkjihg", "ghjkjkjkjkjihg", "ghiiijjjiiiihg", "gggggggggggggg"],
  }),
  portavelas: pix({
    n: "Portavelas de corazón", cat: "adornos", y: 550, al: "fuego", hondo: 20, brilla: { x: 16, y: 8, r: 64, c: "#ffcf7a", propio: "on" },
    filas: ["........", "........", "........", ".II..II.", "IJJIIJJI", "IJCDDCJI", ".IJCCJI.", "..IJJI..", "...II..."],
    capas: [{ p: [[3, 4, "0"]] }, { clase: "px-on px-a", t: 0.6, p: [[3, 3, "V"], [3, 2, "W"], [4, 3, "U"]] }, { clase: "px-on px-b", t: 0.6, p: [[3, 3, "W"], [4, 2, "V"], [3, 2, "U"]] }],
  }),

  // ── Para guardar (Fase 69): se abre y se cierra, y lo que guardas se ve adentro, en orden ──
  organizador: pix({
    n: "Organizador con puertitas", cat: "sala", al: "guarda", hondo: 48, caja: true, noGira: true,
    guarda: { huecos: [[8, 12, 44, 36], [60, 12, 44, 36], [8, 56, 44, 36], [60, 56, 44, 36], [8, 100, 44, 36], [60, 100, 44, 36]] },
    filas: E2(["...ddddddddddd", ".ddeeeeeeeeeee", "dccccccccccccc", ...HUECO, ...HUECO.slice(0, 1), ...X("dcbbbbbbbbbbbc", 8), "dceeeeeeeeeeec", "dcdddddddddddc", "dcaaaaaaaaaaac", ...X("dcbbbbbbbbbbbc", 8), "dceeeeeeeeeeec", "dddddddddddddd", "cccccccccccccc", ".cb...........", ".cb...........", ".bb..........."]),
    capas: [
      { clase: "puerta-i", x: 2, y: 3, f: PUERTA, p: [[12, 17, "o"], [12, 18, "n"]] },
      { clase: "puerta-d", x: 14, y: 3, f: PUERTA.map((f) => [...f].reverse().join("")), p: [[15, 17, "o"], [15, 18, "n"]] },
    ],
  }),
};
for (const d of Object.values(ITEMS)) if (d.cat === "adornos" || (d.cat === "plantas" && d.h <= 60 && d.capa !== "pared")) d.portatil = true;
