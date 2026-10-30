/**
 * EL CATÁLOGO de la casita: todo lo que se puede poner, por categorías (un archivo por categoría).
 * Para agregar cosas nuevas: se agregan en su archivo (o en uno nuevo, sumado aquí) y aparecen solas en
 * «Acomodar». Cada cosa dice su tamaño, en qué capa va (piso, pared o alfombra), su dibujo, dónde se
 * sientan o acuestan los monitos (`lugares`), qué pasa al tocarla (`al`, en acciones.js) y sus colores.
 */
import { ITEMS as SALA } from "./sala.js";
import { ITEMS as COCINA } from "./cocina.js";
import { ITEMS as RECAMARA } from "./recamara.js";
import { ITEMS as BANO } from "./bano.js";
import { ITEMS as JARDIN } from "./jardin.js";
import { ITEMS as DECO } from "./deco.js";
import { ITEMS as MASCOTAS } from "./mascotas.js";
export { COSAS_MANO } from "./comida.js";

export const CATALOGO = { ...SALA, ...COCINA, ...RECAMARA, ...BANO, ...JARDIN, ...DECO, ...MASCOTAS };
for (const [k, d] of Object.entries(CATALOGO)) {
  d.k = k;
  d.capa ||= "piso";
  d.y ??= d.capa === "pared" ? 260 : d.capa === "alfombra" ? 556 : 505;
}

export const CATEGORIAS = [
  ["sala", "Sala"], ["cocina", "Cocina"], ["recamara", "Recámara"], ["bano", "Baño"],
  ["jardin", "Jardín"], ["deco", "Decoración"], ["mascotas", "Mascotitas"],
];
export const deCategoria = (cat) => Object.values(CATALOGO).filter((d) => d.cat === cat);
/** El color de un objeto (si tiene varios). */
export const colorDe = (d, e) => (d.colores ? d.colores[Math.abs(e?.col | 0) % d.colores.length] : null);
