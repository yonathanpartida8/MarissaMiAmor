/**
 * LAS RECETAS: lo que se cocina en la estufa (sartén, olla u horno), en el asador, el micro o la
 * licuadora. Cada una dice dónde se hace, cuánto tarda y cómo se ve servida (plato, tazón o sola).
 * Al terminar, el platillo queda en la mano de tu monito; tocando una mesa se sirve para los dos.
 * Para agregar una receta: una fila aquí y aparece sola en «¿Qué cocinamos?».
 *
 * La comida se dibuja en un cuadrito de 44 × 30 (el plato al fondo y la comida encima): 22 × 15 cuadritos de pixel art.
 */
import { BASES_PIX, PLATILLOS, capa } from "./bocaditos.js";

/** (Fase 73) Todo en pixel art dibujado a mano (bocaditos.js): el plato o el tazón, y la comida encima. */
const BASES = BASES_PIX;

/** [clave, nombre, dónde se hace, segundos (ya no se usan: cocina.js decide), color (lo que se ve en el sartén), base] */
const LISTA = [
  ["hotcakes", "Hotcakes", "sarten", 3, "#f2b45a", "plato"],
  ["huevos", "Huevitos con tocino", "sarten", 3, "#fff3c4", "plato"],
  ["quesadillas", "Quesadillas", "sarten", 3, "#f3d38a", "plato"],
  ["tacos", "Taquitos", "sarten", 3, "#e9a24e", "plato"],
  ["papas", "Papitas fritas", "sarten", 3, "#f6c45a", "nada"],
  ["donas", "Donitas", "sarten", 3, "#ff9cc4", "plato"],
  ["sopa", "Sopita calientita", "olla", 4, "#ffb46b", "tazon"],
  ["pasta", "Espagueti con albóndigas", "olla", 4, "#ffe08a", "plato"],
  ["ramen", "Ramen", "olla", 4, "#f6c38a", "tazon"],
  ["pozole", "Pozolito", "olla", 4, "#e8603c", "tazon"],
  ["sushi", "Sushi", "olla", 4, "#ff9e6b", "plato"],
  ["chocolate", "Chocolate caliente", "olla", 3, "#7a4a32", "nada"],
  ["pizza", "Pizza", "horno", 5, "#ffcf5c", "plato"],
  ["pastel", "Pastelito de fresa", "horno", 5, "#ffd0e2", "plato"],
  ["galletas", "Galletitas", "horno", 4, "#e7b46c", "plato"],
  ["pollo", "Pollito rostizado", "horno", 5, "#e9a24e", "plato"],
  ["cuernitos", "Cuernitos", "horno", 4, "#f0b45a", "plato"],
  ["elote", "Elotito asado", "parrilla", 3, "#ffd84d", "plato"],
  ["hamburguesa", "Hamburguesa", "parrilla", 4, "#9a4a2c", "plato"],
  ["brochetas", "Brochetitas", "parrilla", 4, "#e8513f", "plato"],
  ["hotdog", "Hot dog", "parrilla", 3, "#d94a4a", "plato"],
  ["palomitas", "Palomitas", "micro", 3, "#fff6d8", "nada"],
  ["licuado", "Licuado de fresa", "licuadora", 3, "#ff9cbf", "nada"],
];

export const RECETAS = {};
for (const [k, n, en, s, color, base] of LISTA) RECETAS[k] = { k, n, en, ms: s * 1000, color, base, comida: capa(PLATILLOS[k]), horno: en === "horno" };
export const recetasDe = (en) => Object.values(RECETAS).filter((r) => (Array.isArray(en) ? en.includes(r.en) : r.en === en));
export const baseDe = (r) => BASES[r.base] || "";
/** El platillo completo (para la mano, el panel y la estufa): el plato y la comida en su grupito (ahí caen las mordidas). */
export const arteReceta = (r) => `<svg class="ca-px" data-cel="2" viewBox="0 0 44 30" aria-hidden="true" shape-rendering="crispEdges">${baseDe(r)}<g class="ca-comida">${r.comida}</g></svg>`;
