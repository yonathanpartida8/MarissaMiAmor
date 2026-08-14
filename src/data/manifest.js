/**
 * MANIFIESTO — el orden del libro.
 *
 * Esta es la única lista que hay que tocar para añadir, quitar o reordenar
 * páginas. Cada entrada dice qué tipo de experiencia es, qué capítulo lleva
 * dentro, qué fotos consume y cómo se transiciona hacia ella.
 *
 * Añadir una página nueva:
 *   1. crea src/pages/MiPagina.js extendiendo BasePage
 *   2. regístrala en src/pages/registry.js
 *   3. añade una línea aquí, donde quieras que aparezca
 * Nada más. Ni router, ni navegación, ni CSS global que actualizar.
 */

import { groups } from "./photos.js";

/**
 * @typedef {object} PageEntry
 * @property {string} id            identificador único y estable
 * @property {string} type          clave del registro de páginas
 * @property {string} [chapter]     id del capítulo que muestra
 * @property {object[]} [photos]    fotos que consume
 * @property {string} [transition]  cómo se llega a ella: flip | dissolve | zoom | fold
 * @property {string} [hint]        pista que aparece si se queda quieta
 * @property {string} [secret]      id del secreto que esconde
 * @property {boolean} [gl]         necesita la escena 3D
 */

/** @type {PageEntry[]} */
export const manifest = [
  {
    id: "portada",
    type: "cover",
    photos: groups.cover,
    transition: "none",
    hint: "mantén el dedo sobre el sello",
  },
  {
    id: "carta-01",
    type: "envelope",
    chapter: "encuentro",
    transition: "zoom",
    hint: "arrastra el sello de cera para romperlo",
    secret: "sello-roto",
  },
  {
    id: "distancia-02",
    type: "depth",
    chapter: "distancia",
    photos: groups.distancia,
    transition: "dissolve",
    gl: true,
    hint: "mueve el teléfono… la foto tiene fondo",
  },
  {
    id: "certeza-03",
    type: "scratch",
    chapter: "certeza",
    photos: groups.certeza,
    transition: "flip",
    hint: "rasca con el dedo",
    secret: "raspado-1",
  },
  {
    id: "jardin-04",
    type: "polaroids",
    chapter: "jardin",
    photos: groups.jardin,
    transition: "fold",
    hint: "arrástralas · tócalas dos veces para darles la vuelta",
    secret: "jardin-ordenado",
  },
  {
    id: "tormenta-05",
    type: "chapter",
    chapter: "tormenta",
    photos: groups.tormenta,
    transition: "flip",
    hint: "pasa el dedo por el cristal empañado",
  },
  {
    id: "gestos-06",
    type: "veil",
    chapter: "gestos",
    photos: groups.gestos,
    transition: "dissolve",
    gl: true,
    hint: "acaricia la pantalla para revelar",
    secret: "velo-1",
  },
  {
    id: "espejo-07",
    type: "chapter",
    chapter: "espejo",
    photos: groups.espejo,
    transition: "fold",
    hint: "el reflejo te sigue",
  },
  {
    id: "invierno-08",
    type: "filmstrip",
    chapter: "invierno",
    photos: groups.invierno,
    transition: "zoom",
    hint: "desliza la tira de fotos",
    secret: "tira-completa",
  },
  {
    id: "loquviene-09",
    type: "handwriting",
    chapter: "loquviene",
    transition: "flip",
    hint: "arrastra hacia abajo y lo escribo delante de ti",
    secret: "escrito-a-mano",
  },
  {
    id: "conexion-10",
    type: "memoryfield",
    chapter: "conexion",
    photos: groups.conexion,
    transition: "zoom",
    gl: true,
    hint: "gira el campo de recuerdos · toca uno",
    secret: "recuerdo-tocado",
  },
  {
    id: "solotu-11",
    type: "secret",
    chapter: "solotu",
    photos: groups.solotu,
    transition: "dissolve",
    hint: "mantén pulsado, sin soltar",
    secret: "solo-tu",
  },
  {
    id: "eleccion-12",
    type: "chapter",
    chapter: "eleccion",
    photos: groups.eleccion,
    transition: "flip",
    hint: "toca la brújula",
  },
  {
    id: "contigo-13",
    type: "constellation",
    chapter: "contigo",
    photos: groups.contigo,
    transition: "dissolve",
    gl: true,
    hint: "une las estrellas con el dedo",
    secret: "constelacion",
  },
  {
    id: "loquesiento-14",
    type: "chapter",
    chapter: "loquesiento",
    photos: groups.loquesiento,
    transition: "flip",
  },
  {
    id: "amanera-15",
    type: "veil",
    chapter: "amanera",
    photos: groups.amanera,
    transition: "dissolve",
    gl: true,
    hint: "acaricia la pantalla",
    secret: "velo-2",
  },
  {
    id: "silencio-16",
    type: "chapter",
    chapter: "silencio",
    photos: groups.silencio,
    transition: "fold",
    hint: "acércate: está escrito bajito",
  },
  {
    id: "masdeloqueparece-17",
    type: "scratch",
    chapter: "masdeloqueparece",
    photos: groups.masdeloqueparece,
    transition: "flip",
    hint: "rasca aquí también",
    secret: "raspado-2",
  },
  {
    id: "pornosotros-18",
    type: "chapter",
    chapter: "pornosotros",
    photos: groups.pornosotros,
    transition: "flip",
  },
  {
    id: "crecer-19",
    type: "depth",
    chapter: "crecer",
    photos: groups.crecer,
    transition: "dissolve",
    gl: true,
    hint: "inclina el teléfono",
  },
  {
    id: "increible-20",
    type: "polaroids",
    chapter: "increible",
    photos: groups.increible,
    transition: "fold",
    hint: "muévelas donde quieras",
  },
  {
    id: "final",
    type: "finale",
    photos: groups.final,
    transition: "zoom",
    gl: true,
    hint: "toca el corazón",
    secret: "final",
  },
];

export const pageCount = manifest.length;

export const indexOfPage = (id) => manifest.findIndex((p) => p.id === id);

/** Todos los secretos que el libro puede esconder. */
export const allSecrets = manifest.filter((p) => p.secret).map((p) => p.secret);
