/**
 * Lo que un monito puede traer en la mano (sale del refri, la estufa, el asador, el librero, el buzón…).
 * Lo de comer se come con «Comer»; lo demás se puede regalar a tu amorcito.
 * (Fase 73) Todo en pixel art dibujado a mano (bocaditos.js), como las referencias.
 */
import { mano, MANO } from "./bocaditos.js";

const px = (k) => mano(MANO[k]);
const COMIDA = [
  ["manzana", "Manzanita"], ["cafe", "Cafecito"], ["tostada", "Pan tostado"], ["helado", "Helado"],
  ["sandia", "Sandía"], ["galleta", "Galletita"], ["platano", "Plátano"], ["uvas", "Uvitas"], ["paleta", "Paleta de hielo"],
  ["limonada", "Limonada"], ["malvavisco", "Malvavisco asado"],
  // (Fase 73) Lo nuevo del refri y la hielera.
  ["dona", "Donita"], ["cuernito", "Cuernito"], ["refresco", "Refresco"], ["leche_fresa", "Leche de fresa"],
  ["leche_platano", "Leche de plátano"], ["leche_choco", "Leche de chocolate"], ["leche", "Lechita"],
];
const COSAS = [["libro", "Libro"], ["flor", "Ramito de flores"], ["carta", "Cartita de amor"], ["estrellita", "Estrellita"], ["pelotita", "Pelotita"], ["osito", "Ositito"]];

export const COSAS_MANO = {};
for (const [k, n] of COMIDA) COSAS_MANO[k] = { n, comible: true, arte: px(k) };
for (const [k, n] of COSAS) COSAS_MANO[k] = { n, arte: px(k) };
// (Los hotcakes y el elote de la mano son los de la estufa: los pone recetas.js, ya servidos.)
