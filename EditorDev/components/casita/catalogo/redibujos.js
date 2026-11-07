/**
 * (Fase 70) REDIBUJADOS EN PIXEL DE VERDAD: los muebles que, pasados a cuadritos desde su dibujo de vectores, no se
 * parecían bien a lo que son. Se dibujan cuadrito por cuadrito (calculados, para que lo redondo salga redondo) con la
 * paleta común (pixel.js) y su forma para girar. Lo que cada uno HACE (dónde se sienta el monito, dónde van los platos,
 * su acción, sus colores) se queda igual: aquí sólo cambia el dibujo.
 */
import { pix } from "./pixel.js";

/** Un lienzo de letras para dibujar con líneas, cajas y elipses (cada letra es un color de la paleta). */
function lienzo(W, H) {
  const G = Array.from({ length: H }, () => Array(W).fill("."));
  const pon = (x, y, c, si = null) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; if (si && !si.includes(G[y][x])) return; G[y][x] = c; };
  const linea = (x0, y0, x1, y1, c, si) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1; for (let t = 0; t <= n; t++) pon(x0 + ((x1 - x0) * t) / n, y0 + ((y1 - y0) * t) / n, c, si); };
  const caja = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pon(x, y, c); };
  return { W, H, G, pon, linea, caja, filas: () => G.map((f) => f.join("")) };
}

/** La mesa redonda con su mantel de olanes, cuatro patas de madera y su florero (que se esconde al servir). */
function mesa() {
  const L = lienzo(44, 26), cx = 21.5, cy = 8, rx = 21.2, ry = 4.3;
  const dentro = (x, y) => (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2) <= 1;
  // Las patas de atrás (más oscuras: van detrás) y las de enfrente.
  for (const x of [11, 32]) L.caja(x, 11, x, 23, "b");
  for (const x of [5, 37]) { L.caja(x, 13, x + 1, 24, "c"); L.caja(x + 1, 13, x + 1, 24, "b"); L.pon(x, 25, "a"); L.pon(x + 1, 25, "a"); }
  // El mantel: la tapa (elipse) y su faldita con olanes y bolitas.
  for (let y = 0; y < 26; y++) for (let x = 0; x < 44; x++) {
    if (dentro(x, y)) {
      const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1);
      L.pon(x, y, borde ? "]" : (x + 0.5 - cx) * 0.4 + (y + 0.5 - cy) * 1.6 < -3.4 ? "{" : "[");
    }
  }
  for (let x = 1; x < 43; x++) {
    const t = Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / rx) ** 2)), y0 = Math.round(cy + t * ry), y1 = y0 + 4 + ((x % 4) === 1 ? 1 : 0);
    for (let y = y0; y <= y1; y++) L.pon(x, y, y === y1 ? ")" : y === y0 ? "]" : "[");
    if (x % 4 === 3) L.pon(x, y0 + 2, "H");
  }
  return L.filas();
}
/** El florerito de la mesa (vivo: se quita cuando hay platos). */
const FLORERO = [{ clase: "adorno", p: [[20, 3, "P"], [21, 3, "Q"], [22, 3, "P"], [20, 4, "Q"], [21, 4, "S"], [22, 4, "P"], [20, 5, "P"], [21, 5, "R"], [22, 5, "O"], [21, 2, "r"], [20, 1, "w"], [21, 0, "x"], [22, 1, "!"], [23, 2, "s"], [19, 2, "s"]] }];

/** La silla de la cocina: respaldo redondito con su corazón, asiento acolchado y cuatro patas. */
function silla() {
  const L = lienzo(16, 28);
  for (const x of [3, 12]) L.caja(x, 17, x, 25, "b");                       // patas de atrás
  for (let y = 0; y <= 13; y++) for (let x = 2; x <= 13; x++) {
    const esquina = (y < 2 || y > 11) && (x < 4 || x > 11) && !((y === 1 || y === 12) && (x === 3 || x === 12));
    if (esquina && (y === 0 || y === 13) && (x === 2 || x === 13 || x === 3 || x === 12)) continue;
    if ((y === 0 || y === 13) && (x === 2 || x === 13)) continue;
    const orilla = y === 0 || x === 2 || x === 13 || (y === 1 && (x === 3 || x === 12));
    L.pon(x, y, orilla ? ")" : x <= 4 && y <= 7 ? "{" : "[");
  }
  for (const [x, y] of [[6, 5], [9, 5], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [6, 7], [7, 7], [8, 7], [9, 7], [7, 8], [8, 8]]) L.pon(x, y, "C");
  L.pon(6, 6, "#");
  for (let x = 0; x <= 15; x++) { L.pon(x, 14, x === 0 || x === 15 ? ")" : "{"); L.pon(x, 15, x === 0 || x === 15 ? ")" : "["); L.pon(x, 16, ")"); }
  for (const x of [1, 13]) { L.caja(x, 17, x + 1, 26, "c"); L.caja(x + 1, 17, x + 1, 26, "b"); L.pon(x, 27, "a"); L.pon(x + 1, 27, "a"); }
  return L.filas();
}

/** El telescopio en su tripié, apuntando al cielo, con su lente brillante. */
function telescopio() {
  const L = lienzo(23, 36), A = [11, 19];
  L.linea(...A, 11, 34, "g");                                   // pata de atrás
  L.linea(...A, 2, 34, "h"); L.linea(A[0] - 1, A[1], 1, 34, "i");
  L.linea(...A, 20, 34, "h"); L.linea(A[0] + 1, A[1], 21, 34, "g");
  for (const x of [1, 2, 11, 20, 21]) L.pon(x, 35, "0");
  L.caja(10, 17, 12, 20, "g"); L.pon(10, 17, "h");
  // El tubo (del color elegido), grueso, en diagonal, con su anillo.
  for (let t = 0; t <= 1; t += 0.02) {
    const x = 3 + 15 * t, y = 16 - 10 * t;
    for (let k = -1.6; k <= 1.6; k += 0.5) L.pon(x - k * 0.55, y - k * 0.85, k < -0.9 ? "{" : k > 0.9 ? ")" : "[");
  }
  L.linea(11, 10, 13, 13, "(");                                // el anillo de en medio
  // La lente grande (adelante, arriba) y el ocular (atrás, abajo).
  for (const [x, y, c] of [[18, 4, "j"], [19, 4, "j"], [20, 5, "j"], [20, 6, "i"], [19, 7, "i"], [18, 7, "h"], [17, 6, "h"], [17, 5, "j"], [18, 5, "B"], [19, 5, "#"], [18, 6, "A"], [19, 6, "B"]]) L.pon(x, y, c);
  for (const [x, y] of [[1, 17], [2, 17], [1, 18], [2, 18], [0, 18]]) L.pon(x, y, "g");
  return L.filas();
}
const DESTELLOS = [{ clase: "px-a", p: [[3, 2, "?"], [4, 3, "!"], [16, 0, "?"]] }, { clase: "px-b", p: [[4, 2, "!"], [3, 3, "?"], [15, 1, "!"]] }];

/** El micrófono de karaoke en su pedestal, con su cable enrollado. */
function microfono() {
  const L = lienzo(15, 40);
  for (let y = 37; y <= 39; y++) for (let x = 0; x < 15; x++) { const d = ((x + 0.5 - 7.5) / 6.6) ** 2 + ((y + 0.5 - 38.2) / 1.7) ** 2; if (d <= 1) L.pon(x, y, y === 37 ? "i" : d > 0.6 ? "g" : "h"); }
  L.caja(7, 12, 7, 36, "i"); L.caja(8, 12, 8, 36, "h");
  L.linea(8, 12, 10, 9, "h");
  L.linea(10, 9, 11, 7, "0"); L.linea(11, 9, 12, 7, "%");
  for (let y = 0; y < 8; y++) for (let x = 9; x < 15; x++) { const d = Math.hypot(x + 0.5 - 12.3, y + 0.5 - 3.6); if (d <= 2.9) L.pon(x, y, d > 2.2 ? "h" : (x + y) % 2 ? "j" : "k"); }
  for (let y = 14; y <= 34; y += 1) L.pon(y % 4 < 2 ? 6 : 9, y, "K", ".");
  L.pon(5, 19, "w"); L.pon(4, 18, "x"); L.pon(5, 18, "w"); L.pon(4, 19, "w"); L.pon(5, 20, "v");
  L.pon(10, 24, "!"); L.pon(11, 24, "?"); L.pon(10, 25, "9");
  return L.filas();
}

/** El fuerte de cobijas: la casita de tela con sus costuras, la entrada y una guirnalda de foquitos arriba. */
function fuerte() {
  const L = lienzo(48, 35), A = [23.5, 3];
  for (let y = 3; y <= 34; y++) {
    const t = (y - 3) / 31, x0 = Math.round(A[0] - t * 22.6), x1 = Math.round(A[0] + t * 22.6);
    for (let x = x0; x <= x1; x++) {
      const orilla = x === x0 || x === x1 || y === 34;
      L.pon(x, y, orilla ? "(" : x < A[0] ? (x - x0 < 3 ? "{" : "[") : x1 - x < 2 ? ")" : "]");
    }
  }
  L.linea(...A, 14, 34, ")", "[]{"); L.linea(...A, 33, 34, ")", "[]{");          // las costuras
  for (let y = 15; y <= 33; y++) { const t = (y - 15) / 18, x0 = Math.round(23.5 - 2 - t * 5.5), x1 = Math.round(23.5 + 2 + t * 5.5); for (let x = x0; x <= x1; x++) L.pon(x, y, x === x0 || x === x1 ? "(" : y > 30 ? "a" : "%"); }
  for (const [cx, cy] of [[9, 29], [38, 29], [23.5, 9]]) for (const [dx, dy] of [[-1, 0], [1, 0], [-1, -1], [1, -1], [0, 0], [0, 1], [-2, -1], [2, -1]]) L.pon(cx + dx + (dx < 0 ? 0 : 0), cy + dy, "C", "[]{)");
  return L.filas();
}
/** La guirnalda va viva (encima, en su capa): así al girar el fuerte no se vuelve un techo. Cable, foquitos apagados y,
 *  turnándose, los prendidos. */
const FOQUITOS = (() => {
  const yc = (x) => Math.round(4 + 3 * Math.sin((x / 47) * Math.PI)), y = (x) => yc(x) + 1, xs = [5, 14, 23, 33, 42];
  const cable = { clase: "cable", p: [...Array(48).keys()].map((x) => [x, yc(x), "&"]).concat(xs.map((x) => [x, y(x), "n"])) };
  return [cable, ...[1, 2, 3].map((n) => ({ clase: `px3-${n}`, p: xs.filter((_, i) => i % 3 === n - 1).map((x) => [x, y(x), "?"]) }))];
})();

/** Lo nuevo de cada uno (sólo su dibujo y su forma para girar). */
/** (Fase 71) LA VENTANA NUEVA: marco blanco de madera con su cruceta, cenefa con olanes en su barra de latón, cortinas
 *  amarradas con moño (se cierran de verdad: otro dibujo, no estiradas), repisa con un cactus y una maceta con flores, y
 *  el vidrio con el cielo de verdad (día, tarde, noche con luna y estrellas, o lluvia), cada uno en su capa. */
function ventana() {
  const W = 40, H = 46, L = lienzo(W, H);
  // La barra de latón con sus remates.
  L.caja(1, 3, 38, 3, "n"); for (const x of [0, 39]) { L.pon(x, 2, "o"); L.pon(x, 3, "m"); L.pon(x, 4, "l"); }
  // El marco blanco: orilla, cara (clara arriba y a la izquierda, sombrita abajo y a la derecha) y su bisel.
  L.caja(6, 8, 33, 37, "E"); L.caja(7, 9, 32, 36, "C");
  for (let y = 9; y <= 36; y++) { L.pon(7, y, "#"); L.pon(32, y, "D"); }
  L.caja(7, 9, 32, 9, "#"); L.caja(7, 36, 32, 36, "D");
  L.caja(9, 11, 30, 11, "D"); L.caja(9, 11, 9, 34, "D"); L.caja(30, 11, 30, 34, "#"); L.caja(9, 34, 30, 34, "#");
  for (let y = 12; y <= 33; y++) for (let x = 10; x <= 29; x++) L.pon(x, y, ".");
  // La repisa (con sus mensulitas).
  L.caja(4, 37, 35, 37, "#"); L.caja(4, 38, 35, 38, "C"); L.caja(5, 39, 34, 39, "D");
  for (const x of [8, 31]) { L.pon(x, 40, "E"); L.pon(x + 1, 40, "E"); L.pon(x, 41, "E"); }
  // La cenefa con sus pliegues y olanes (del color elegido).
  for (let x = 3; x <= 36; x++) {
    L.pon(x, 4, "]"); L.pon(x, 5, "["); L.pon(x, 6, (x - 3) % 5 === 0 ? ")" : "[");
    const k = (x - 3) % 5; if (k >= 1 && k <= 3) L.pon(x, 7, k === 2 ? "[" : ")"); if (k === 2) L.pon(x, 8, ")");
  }
  const cielo = (f) => { const p = []; for (let y = 12; y <= 33; y++) for (let x = 10; x <= 29; x++) { const c = f(x, y); if (c) p.push([x, y, c]); } return p; };
  const dia = cielo((x, y) => {
    const nube = (y === 15 && x >= 13 && x <= 15) || (y === 16 && x >= 12 && x <= 17) || (y === 28 && x >= 22 && x <= 24) || (y === 29 && x >= 21 && x <= 26);
    if (nube) return y === 16 || y === 29 ? "k" : "#";
    if (Math.hypot(x - 26, y - 14.5) < 1.6) return "W";
    if (Math.hypot(x - 26, y - 14.5) < 2.4) return "?";
    return y <= 18 ? "B" : y <= 26 ? "P" : "Q";
  });
  const tarde = cielo((x, y) => (Math.hypot(x - 24.5, y - 33) < 2.6 ? "W" : y <= 17 ? "M" : y <= 23 ? "I" : y <= 28 ? "x" : "V"));
  const noche = cielo((x, y) => {
    if (Math.hypot(x - 14, y - 15.5) < 2.2 && Math.hypot(x - 15.2, y - 14.6) >= 1.9) return "?";
    if ([[22, 14], [27, 17], [12, 22], [25, 25], [17, 28], [28, 30], [21, 20]].some(([a, b]) => a === x && b === y)) return (x + y) % 2 ? "#" : "W";
    return y <= 20 ? "y" : y <= 28 ? "z" : "L";
  });
  const lluvia = cielo((x, y) => ((x * 2 + y * 3) % 9 === 0 ? "k" : y <= 22 ? "i" : "j"));
  // La cruceta (encima del cielo) y las macetitas de la repisa.
  const cruceta = [];
  for (let y = 12; y <= 33; y++) { cruceta.push([19, y, "C"], [20, y, "D"]); }
  for (let x = 10; x <= 29; x++) { cruceta.push([x, 22, "#"], [x, 23, "D"]); }
  const macetas = [
    ...[[24, 34], [25, 34], [26, 34], [27, 34], [28, 34], [29, 34], [30, 34]].map(([x, y]) => [x, y, "8"]),
    ...[25, 26, 27, 28, 29].flatMap((x) => [[x, 35, x === 29 ? "6" : "7"], [x, 36, x === 29 ? "6" : "7"]]),
    [26, 33, "r"], [28, 33, "r"], [27, 32, "s"], [25, 32, "s"], [29, 32, "r"], [27, 31, "q"],
    [25, 30, "I"], [26, 31, "J"], [28, 30, "x"], [29, 31, "J"], [27, 29, "I"], [24, 31, "J"],
    [10, 34, "8"], [11, 34, "8"], [12, 34, "8"], [10, 35, "7"], [11, 35, "7"], [12, 35, "6"], [10, 36, "7"], [11, 36, "7"], [12, 36, "6"],
    [11, 30, "s"], [11, 31, "r"], [11, 32, "r"], [11, 33, "r"], [10, 31, "s"], [12, 32, "s"], [10, 32, "q"], [11, 29, "J"],
  ];
  // Las cortinas abiertas, amarradas con su moño, y cerradas (dos paños que se juntan en medio).
  const abiertas = [], cerradas = [];
  for (const lado of [-1, 1]) {
    for (let y = 8; y <= 42; y++) {
      const [a, b] = y <= 20 ? [2, 9] : y <= 23 ? [3, 6] : y <= 32 ? [2, 7] : [1, 8];
      for (let x = a; x <= b; x++) {
        const fold = y <= 20 ? (x - a) % 3 === 2 : y >= 24 && (x - a) % 3 === 1;
        const c = y === 42 ? ")" : x === a ? "]" : fold ? ")" : "[";
        abiertas.push([lado < 0 ? x : W - 1 - x, y, c]);
      }
    }
    for (let x = 1; x <= 8; x++) abiertas.push([lado < 0 ? x : W - 1 - x, 22, x === 1 || x === 8 ? "G" : "H"]);
    for (const [x, y, c] of [[1, 21, "I"], [1, 23, "I"], [0, 22, "H"]]) abiertas.push([lado < 0 ? x : W - 1 - x, y, c]);
    for (let y = 8; y <= 40; y++) for (let x = 2; x <= 19; x++) {
      const c = y === 40 ? ")" : (x - 2) % 3 === 2 ? ")" : (x - 2) % 3 === 0 ? "]" : "[";
      cerradas.push([lado < 0 ? x : W - 1 - x, y, c]);
    }
  }
  return {
    filas: L.filas(),
    capas: [
      { clase: "dia", p: dia }, { clase: "tarde-o", p: tarde }, { clase: "noche-o", p: noche }, { clase: "lluvia-o", p: lluvia },
      { p: [...cruceta, ...macetas] },
      { clase: "cortina-ab", p: abiertas }, { clase: "cortina-ce", p: cerradas },
    ],
  };
}

export const REDIBUJOS = {
  ventana: () => { const v = ventana(); return pix({ filas: v.filas, capas: v.capas, sinContorno: true }); },
  mesa: () => pix({ filas: mesa(), capas: FLORERO, hondo: 116 }),
  silla: () => pix({ filas: silla() }),
  telescopio: () => pix({ filas: telescopio(), capas: DESTELLOS, noGira: true }),
  microfono: () => pix({ filas: microfono(), noGira: true }),
  fuerte_cobijas: () => pix({ filas: fuerte(), capas: FOQUITOS, forma: "caja" }),
};
