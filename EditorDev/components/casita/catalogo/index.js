/**
 * EL CATÁLOGO de la casita: todo lo que se puede poner, por categorías (un archivo por categoría).
 * Para agregar cosas nuevas: se agregan en su archivo (o en uno nuevo, sumado aquí) y aparecen solas en
 * «Acomodar». Cada cosa dice su tamaño, en qué capa va (piso, pared o alfombra), su dibujo, dónde se
 * sientan o acuestan los monitos (`lugares`), qué pasa al tocarla (`al`, en acciones.js) y sus colores.
 *
 * Lo demás que puede decir (Fase 54): `superficie` (dónde se sirven los platillos de una mesa),
 * `brilla` (su luz de noche: x, y, radio, color, y si prende con su estado `propio` o `siempre`),
 * `rayo` (luz del sol que entra), `fiesta` (prendida, el cuarto se llena de lucecitas) y si es
 * `portatil` (se puede llevar con el dedo mientras juegan) o `mascota` (pasea solita).
 */
import { ITEMS as SALA } from "./sala.js";
import { ITEMS as COCINA } from "./cocina.js";
import { ITEMS as RECAMARA } from "./recamara.js";
import { ITEMS as BANO } from "./bano.js";
import { ITEMS as JARDIN } from "./jardin.js";
import { ITEMS as DECO } from "./deco.js";
import { ITEMS as MASCOTAS } from "./mascotas.js";
import { ITEMS as ESTUDIO } from "./estudio.js";
import { ITEMS as TERRAZA } from "./terraza.js";
import { ITEMS as COSITAS } from "./cositas.js";
import { ITEMS as LINDAS } from "./lindas.js";
import { ITEMS as LIMPIEZA, MANO as MANO_LIMPIEZA } from "./limpieza.js";
import { ITEMS as FINOS } from "./finos.js";
import { ITEMS as FINOS2 } from "./finos2.js";
import { ITEMS as TECHO } from "./techo.js";
import { ITEMS as JARDIN2 } from "./jardin2.js";
import { colgadoY, usarAltos } from "../cuartos.js";
import { REDIBUJOS } from "./redibujos.js";
import { VISTAS } from "./vistas.js";
import { COSAS_MANO } from "./comida.js";
import { RECETAS, arteReceta } from "./recetas.js";
export { COSAS_MANO };
export { RECETAS, recetasDe, arteReceta, baseDe } from "./recetas.js";

export const CATALOGO = { ...SALA, ...COCINA, ...RECAMARA, ...BANO, ...JARDIN, ...DECO, ...MASCOTAS, ...ESTUDIO, ...TERRAZA, ...COSITAS, ...LINDAS, ...LIMPIEZA, ...FINOS, ...FINOS2, ...TECHO, ...JARDIN2 };
// (Fase 64) Las herramientas de limpieza y la naranja también se traen en la mano; el árbol del columpio suelta hojitas.
Object.assign(COSAS_MANO, MANO_LIMPIEZA);
CATALOGO.arbol.hojas = "#7fd29b";

// Las luces de lo que ya existía (las cosas nuevas lo traen en su archivo).
const BRILLOS = {
  lampara: { x: 32, y: 56, r: 150 }, buro: { x: 37, y: 40, r: 110 }, farol: { x: 28, y: 36, r: 160 },
  chimenea: { x: 88, y: 128, r: 170, c: "#ffae5c", propio: "on" }, tele: { x: 75, y: 62, r: 120, c: "#a9d8ff", propio: "canal" },
};
const PORTATILES = ["cojin_corazon", "juego_te", "rosita", "cosita", "florero", "velas", "taza", "libros_pila", "portarretrato", "lamparita", "radio", "frasco", "tetera", "despertador", "pecerita", "planta_chica", "pastel_cumple", "peluche", "patito", "cojin", "maceta", "globo", "gatito", "perrito", "conejito", "tortuga", "flamenco", "regadera_j", "guitarra", "globo_mundo", "puff", "lampara_lava", "hielera", "cesto"];
/** Qué tan abajo del borde de arriba está la tapa de cada mueble (donde se pueden poner cositas encima). */
const TOPES = { mesa: 30, mesita: 20, mesa_picnic: 36, buro: 90, escritorio: 40, barra_cafe: 36, barra_tostador: 36, barra_micro: 36, barra_licuadora: 36, barra_fruta: 36, fregadero: 36, estufa: 26, piano: 16, consola: 80, tocador: 96, baul: 26, librero: 10, librero_alto: 12, ropero: 6, refri: 4, lavadora: 6, tele: 110, chimenea: 10, repisa: 34, alacena: 34, especiero: 34, hielera: 14, lavabo: 30 };
const MASCOTAS_VIVAS = ["gatito", "perrito", "conejito", "tortuga"];

// (Fase 70) Los que se redibujaron en pixel: cambia su dibujo (y su forma para girar); lo que hacen se queda igual.
for (const [k, f] of Object.entries(REDIBUJOS)) if (CATALOGO[k]) { const nuevo = f(); delete CATALOGO[k].frente; Object.assign(CATALOGO[k], nuevo); }
// (Fase 71) Los focos del techo cuelgan justo del techo (y la casa de entrada sabe cuánto miden).
for (const d of Object.values(TECHO)) d.y = colgadoY(d.h);
usarAltos((t) => CATALOGO[t]?.h || 100);
// (Fase 71) Su costado y su espalda dibujados a mano (las cuatro vistas).
for (const [k, v] of Object.entries(VISTAS)) if (CATALOGO[k]) CATALOGO[k].vistas = v;
for (const [k, d] of Object.entries(CATALOGO)) {
  d.k = k;
  if (FINOS2[k]) d.nuevo = true;
  // (Fase 70) Lo redondo por todos lados (botes, cubetas, jaulitas, canastas, la lámpara de pie): girado sigue redondo.
  if (d.torno == null && d.forma == null && /^(bote|cubeta|pajarito|canasta|barril|tambor|cesto|olla|paraguero|lampara)(_|$)/.test(k) && !/arco|colgante|pared|mesa|nube|lava/.test(k)) d.torno = true;
  d.capa ||= "piso";
  d.y ??= d.capa === "pared" ? 260 : d.capa === "alfombra" ? 556 : 505;
  if (BRILLOS[k]) d.brilla ||= BRILLOS[k];
  if (PORTATILES.includes(k)) d.portatil = true;
  if (MASCOTAS_VIVAS.includes(k)) d.mascota = true;
  if (k === "ventana") d.rayo = true;
  if (TOPES[k] != null) d.tope = TOPES[k];
  // (Fase 69) Lo que girarlo no le cambia nada (lo redondo, las plantas, las cositas chiquitas) no se gira.
  if (d.torno || d.cat === "adornos" || d.cat === "plantas" || (d.portatil && d.w <= 90 && d.h <= 120) || /planta|maceta|cactus|monstera|helecho|ficus|palmera|^arbol|arbusto|^flores|bonsai|suculenta|lavanda|orquidea|pothos/.test(k)) d.noGira = true;
  // (Fase 68) Lo chiquito que se carga no estorba al caminar: se patea (y rueda) cuando pasas por encima.
  if (d.portatil && !d.mascota && d.w <= 90 && d.h <= 120) d.noEstorba = true;
}
// Lo que se soltó en el piso se ve como lo que es.
CATALOGO.cosita.arte = (e) => COSAS_MANO[e?.k]?.arte || "";

// Lo que se cocina también se lleva en la mano (y se sirve en una mesa).
for (const r of Object.values(RECETAS)) COSAS_MANO[r.k] = { n: r.n, comible: true, plato: true, arte: arteReceta(r) };

export const CATEGORIAS = [
  ["sala", "Sala"], ["cocina", "Cocina"], ["recamara", "Recámara"], ["bano", "Baño"], ["estudio", "Estudio"], ["cositas", "Cositas"],
  ["adornos", "Adornitos"], ["plantas", "Plantitas"], ["jardin", "Jardín"], ["rio", "Río y caminos"], ["terraza", "Terraza"], ["deco", "Decoración"], ["techo", "Techo"], ["limpieza", "Limpieza"], ["mascotas", "Mascotitas"],
];
export const deCategoria = (cat) => Object.values(CATALOGO).filter((d) => d.cat === cat);
/** El color de un objeto (si tiene varios). */
export const colorDe = (d, e) => (d.colores ? d.colores[Math.abs(e?.col | 0) % d.colores.length] : null);
