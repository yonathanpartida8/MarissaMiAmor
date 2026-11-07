/**
 * COSITAS DE COCINA (Fase 73), como la cocinita de la referencia: platos de adorno en la pared, una repisa con su
 * frasco de manzanas y su bolsita de pan, el botecito de las cucharas, un pay de cereza con su enrejado, un
 * panquecito con su cereza y el platito del gatito. Mismo pixel art que los muebles (cuadritos de 4, sombreado a
 * mano) y del tamaño que les toca junto al monito.
 */
import { pix } from "./pixel.js";

/** Un plato de adorno (8 × 8): orilla, fondo y su centro. */
const plato = (a, b) => ["..EEEE..", ".EC#CCE.", `EC${a}${b}${a}${a}CE`, `E${b}${b}#${b}${a}CE`, `EC${a}${b}${a}${b}CE`, `EC${a}${a}${b}${a}CE`, ".ECCCCE.", "..EEEE.."];
/** Tres platos en la pared; el de en medio más arribita. */
function platosPared() {
  const L = plato("J", "I"), M = plato("N", "M"), R = plato("B", "A"), vacio = "........";
  return Array.from({ length: 10 }, (_, y) => [L[y - 2] || vacio, M[y] || vacio, R[y - 2] || vacio].join("."));
}

export const ITEMS = {
  platos_pared: pix({ n: "Platos de adorno", cat: "cocina", capa: "pared", noGira: true, filas: platosPared() }),
  repisa_frasco: pix({
    n: "Repisa con frasco", cat: "cocina", capa: "pared", noGira: true,
    filas: [
      "..mnnm.....78...",
      ".PQQQQP...787...",
      ".PQwxQP..EF78FE.",
      ".PwxwwP..EDDDDE.",
      ".PwwvwP..ED#DDE.",
      ".PvwwxP..EDDDDE.",
      ".PPPPPP..EEEEEE.",
      "cccccccccccccccc",
      "bbbbbbbbbbbbbbbb",
      "..a..........a..",
      "..aa........aa..",
    ],
  }),
  botecito_cucharas: pix({
    n: "Botecito de cucharas", cat: "adornos", y: 550, hondo: 20, noGira: true,
    filas: [
      "..e...j.",
      ".ede.jkj",
      "..d.c.j.",
      "..d.c.i.",
      "..d.c.i.",
      ".XYYYYX.",
      "XZZZZZYX",
      "XZ#ZZZYX",
      "XZZZZZYX",
      "XZZJZZYX",
      ".XZZZYX.",
      "..XXXX..",
    ],
  }),
  pay: pix({
    n: "Pay de cereza", cat: "adornos", y: 550, hondo: 26, noGira: true,
    filas: [
      "....888888....",
      "..887w7w7w88..",
      ".87w8w8w8w8w7.",
      ".8w7w7w7w7w78.",
      "78888888888887",
      "67777777777776",
      ".HJJJJJJJJJJH.",
      "..HHHHHHHHHH..",
    ],
  }),
  panquecito: pix({
    n: "Panquecito", cat: "adornos", y: 550, hondo: 16, noGira: true,
    filas: ["...xw...", "..JIIJ..", ".JIJJIJ.", "IJJJJJJI", ".878787.", ".787878.", "..8787..", "..6666.."],
  }),
  platito_gatito: pix({
    n: "Platito del gatito", cat: "mascotas", y: 550, hondo: 20, noGira: true,
    filas: ["..787878..", ".HJJJJJJH.", "HJJ#JJJJJH", "HIIIIIIIIH", ".HHHHHHHH."],
  }),
};
