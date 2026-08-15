/**
 * MANIFIESTO — el orden del libro.
 *
 * ── CÓMO AÑADIR UNA PÁGINA ────────────────────────────────────────────
 *   1. escribe el capítulo en `chapters.js`
 *   2. añade una línea aquí, donde quieras que salga
 * Ya está. La navegación, el índice, el progreso, la precarga, la memoria y
 * la paleta del fondo se ajustan solos. El libro está pensado para crecer:
 * da igual que sean cuarenta páginas o cuatrocientas.
 * ──────────────────────────────────────────────────────────────────────
 *
 * @typedef {object} PageEntry
 * @property {string} id            identificador único y estable
 * @property {string} type          clave del registro de páginas
 * @property {string} [chapter]     id del capítulo que muestra
 * @property {object[]} [photos]    fotos que consume
 * @property {string} [transition]  cómo se llega: flip · dissolve · zoom · fold · iris
 * @property {string} [hint]        pista que susurra si se queda quieta
 * @property {string} [secret]      id del secreto que esconde
 * @property {boolean} [gl]         necesita la escena 3D
 */

import { groups } from "./photos.js";
import { chapterById } from "./chapters.js";

/** @type {PageEntry[]} */
const pages = [
  // ═══════════════════════════════════════════════════════════════
  //  PORTADA
  // ═══════════════════════════════════════════════════════════════
  {
    id: "portada",
    type: "cover",
    photos: groups.portada,
    transition: "none",
    hint: "mantén el dedo sobre el sello",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO I — ENCONTRARTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "abreme",
    type: "envelope",
    chapter: "abreme",
    transition: "zoom",
    hint: "arrastra el sello de cera para romperlo",
    secret: "sello-roto",
  },
  {
    id: "en-voz-alta",
    type: "typewriter",
    chapter: "en-voz-alta",
    transition: "flip",
    hint: "mantén pulsado y escribo más rápido",
    secret: "escrito-solo",
  },
  {
    id: "tres-de-la-manana",
    type: "depth",
    chapter: "tres-de-la-manana",
    photos: groups.tresDeLaManana,
    transition: "dissolve",
    gl: true,
    hint: "mueve el teléfono · la imagen tiene fondo",
  },
  {
    id: "lo-que-no-dije",
    type: "scratch",
    chapter: "lo-que-no-dije",
    photos: groups.loQueNoDije,
    transition: "flip",
    hint: "rasca con el dedo",
    secret: "raspado-1",
  },
  {
    id: "postal-primera",
    type: "postcard",
    chapter: "postal-primera",
    photos: groups.postalPrimera,
    transition: "fold",
    gl: true,
    hint: "arrástrala para darle la vuelta",
    secret: "postal-1",
  },
  {
    id: "tu-voz",
    type: "chapter",
    chapter: "tu-voz",
    photos: groups.tuVoz,
    transition: "flip",
  },
  {
    id: "deshojando",
    type: "petals",
    chapter: "deshojando",
    transition: "fold",
    hint: "tira de un pétalo",
    secret: "deshojada",
  },
  {
    id: "nuestro-desorden",
    type: "polaroids",
    chapter: "nuestro-desorden",
    photos: groups.nuestroDesorden,
    transition: "flip",
    hint: "arrástralas · tócalas dos veces para verles el reverso",
    secret: "desorden-movido",
  },
  {
    id: "llueve-alla",
    type: "chapter",
    chapter: "llueve-alla",
    photos: groups.llueveAlla,
    transition: "iris",
    hint: "pasa el dedo por el cristal empañado",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO II — CONOCERTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "lista-pendiente",
    type: "veil",
    chapter: "lista-pendiente",
    photos: groups.listaPendiente,
    transition: "dissolve",
    gl: true,
    hint: "acaricia la pantalla",
    secret: "velo-1",
  },
  {
    id: "por-pedacitos",
    type: "mosaic",
    chapter: "por-pedacitos",
    photos: groups.porPedacitos,
    transition: "zoom",
    gl: true,
    hint: "toca las piezas · o arrastra por encima",
    secret: "mosaico-1",
  },
  {
    id: "me-caigo-mejor",
    type: "chapter",
    chapter: "me-caigo-mejor",
    photos: groups.meCaigoMejor,
    transition: "fold",
    hint: "el reflejo te sigue",
  },
  {
    id: "nuestra-pelicula",
    type: "filmstrip",
    chapter: "nuestra-pelicula",
    photos: groups.nuestraPelicula,
    transition: "iris",
    hint: "desliza el carrete hasta el final",
    secret: "carrete-1",
  },
  {
    id: "con-mi-letra",
    type: "handwriting",
    chapter: "con-mi-letra",
    transition: "flip",
    hint: "arrastra hacia abajo y lo escribo delante de ti",
    secret: "escrito-a-mano",
  },
  {
    id: "la-combinacion",
    type: "lock",
    chapter: "la-combinacion",
    photos: groups.laCombinacion,
    transition: "zoom",
    gl: true,
    hint: "gira las ruedas · arriba y abajo",
    secret: "caja-abierta",
  },
  {
    id: "mi-norte",
    type: "chapter",
    chapter: "mi-norte",
    photos: groups.miNorte,
    transition: "flip",
    hint: "tócala",
  },
  {
    id: "botella",
    type: "bottle",
    chapter: "botella",
    transition: "dissolve",
    gl: true,
    hint: "tira del corcho hacia arriba",
    secret: "botella-abierta",
  },
  {
    id: "todo-lo-que-guardo",
    type: "memoryfield",
    chapter: "todo-lo-que-guardo",
    photos: groups.todoLoQueGuardo,
    transition: "zoom",
    gl: true,
    hint: "gira el campo · toca un recuerdo",
    secret: "recuerdo-tocado",
  },
  {
    id: "en-voz-baja",
    type: "secret",
    chapter: "en-voz-baja",
    photos: groups.enVozBaja,
    transition: "dissolve",
    hint: "mantén el dedo, sin soltar",
    secret: "voz-baja",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO III — EXTRAÑARTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "regalo",
    type: "gift",
    chapter: "regalo",
    photos: groups.regalo,
    transition: "zoom",
    gl: true,
    hint: "tira del listón",
    secret: "regalo-abierto",
  },
  {
    id: "la-distancia",
    type: "orbit",
    chapter: "la-distancia",
    transition: "dissolve",
    gl: true,
    hint: "acércalos · se resisten",
    secret: "distancia-cerrada",
  },
  {
    id: "mi-pulso",
    type: "pulse",
    chapter: "mi-pulso",
    transition: "iris",
    gl: true,
    hint: "pon el dedo y no lo quites",
    secret: "pulso-tomado",
  },
  {
    id: "mismo-cielo",
    type: "constellation",
    chapter: "mismo-cielo",
    photos: groups.mismoCielo,
    transition: "dissolve",
    gl: true,
    hint: "une las estrellas con el dedo",
    secret: "constelacion",
  },
  {
    id: "postal-segunda",
    type: "postcard",
    chapter: "postal-segunda",
    photos: groups.postalSegunda,
    transition: "fold",
    gl: true,
    secret: "postal-2",
  },
  {
    id: "te-lo-digo-bajito",
    type: "chapter",
    chapter: "te-lo-digo-bajito",
    photos: groups.teLoDigoBajito,
    transition: "flip",
    hint: "acércate: está escrito bajito",
  },
  {
    id: "debajo-de-esto",
    type: "scratch",
    chapter: "debajo-de-esto",
    photos: groups.debajoDeEsto,
    transition: "flip",
    hint: "rasca aquí también",
    secret: "raspado-2",
  },
  {
    id: "confesion",
    type: "typewriter",
    chapter: "confesion",
    transition: "fold",
    secret: "confesion-leida",
  },
  {
    id: "sin-adornos",
    type: "depth",
    chapter: "sin-adornos",
    photos: groups.sinAdornos,
    transition: "dissolve",
    gl: true,
    hint: "inclina el teléfono",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO IV — ELEGIRTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "aburridos",
    type: "chapter",
    chapter: "aburridos",
    photos: groups.aburridos,
    transition: "flip",
  },
  {
    id: "rompecabezas-dos",
    type: "mosaic",
    chapter: "rompecabezas-dos",
    photos: groups.rompecabezasDos,
    transition: "zoom",
    gl: true,
    hint: "descúbrela entera",
    secret: "mosaico-2",
  },
  {
    id: "acariciar",
    type: "veil",
    chapter: "acariciar",
    photos: groups.acariciar,
    transition: "dissolve",
    gl: true,
    hint: "acaricia · toca dos veces para cambiar",
    secret: "velo-2",
  },
  {
    id: "mejorar",
    type: "chapter",
    chapter: "mejorar",
    photos: groups.mejorar,
    transition: "flip",
  },
  {
    id: "cosas-tuyas",
    type: "polaroids",
    chapter: "cosas-tuyas",
    photos: groups.cosasTuyas,
    transition: "fold",
    hint: "dales la vuelta",
    secret: "cosas-tuyas-vistas",
  },
  {
    id: "no-se-me-pasa",
    type: "filmstrip",
    chapter: "no-se-me-pasa",
    photos: groups.noSeMePasa,
    transition: "iris",
    secret: "carrete-2",
  },
  {
    id: "gracias",
    type: "chapter",
    chapter: "gracias",
    photos: groups.gracias,
    transition: "flip",
  },
  {
    id: "ultimo-secreto",
    type: "secret",
    chapter: "ultimo-secreto",
    photos: groups.ultimoSecreto,
    transition: "dissolve",
    hint: "sostén el dedo hasta el final",
    secret: "ultimo-secreto",
  },
  {
    id: "te-elijo",
    type: "depth",
    chapter: "te-elijo",
    photos: groups.teElijo,
    transition: "zoom",
    gl: true,
  },

  // ═══════════════════════════════════════════════════════════════
  //  FINAL
  // ═══════════════════════════════════════════════════════════════
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

/**
 * Cada página hereda el acto de su capítulo. Así el índice se agrupa solo y
 * no hay que repetir el dato en dos sitios.
 */
/** Le pone su índice y su acto a cada entrada. */
function decorate(list) {
  list.forEach((entry, index) => {
    entry.index = index;
    entry.act = entry.act || chapterById[entry.chapter]?.act || null;
  });
  return list;
}

/**
 * El manifiesto es un array MUTABLE a propósito: las páginas de `mis-paginas/`
 * se cargan después (son un módulo aparte que puede fallar sin tumbar nada) y
 * se insertan aquí. Todo lo demás lee `manifest` por referencia, así que en
 * cuanto se insertan ya están en el índice, en el progreso y en la navegación.
 */
export const manifest = decorate(pages.map((entry) => ({ ...entry })));

/**
 * Inserta las páginas de él. `where` decide dónde va cada una:
 *   "final"  (por defecto) justo antes de la página de cierre
 *   "inicio" después de la portada
 *   número   en esa posición del libro (1 = después de la portada)
 */
export function registerCustomPages(entries) {
  if (!entries?.length) return manifest;

  for (const entry of entries) {
    const where = entry.where ?? "final";
    let at;
    let appended = false;

    if (where === "inicio") {
      at = 1;
    } else if (where !== "final" && Number.isFinite(Number(where))) {
      at = Math.max(1, Math.min(manifest.length, Math.round(Number(where))));
    } else {
      // "final": siempre justo antes del cierre, que tiene que quedar último.
      // Se recalcula en cada vuelta porque el manifiesto acaba de crecer.
      at = manifest.findIndex((e) => e.type === "finale");
      if (at === -1) at = manifest.length;
      appended = true;
    }

    const copy = { ...entry };

    // Una página metida en medio del libro se pone el acto de sus vecinas:
    // si la ha colocado entre "Conocerte" y "Conocerte", ahí pertenece, y el
    // índice se lee seguido. Sólo las del final forman su propio acto.
    if (!appended) {
      copy.act = manifest[at - 1]?.act || manifest[at]?.act || copy.act || null;
    }

    manifest.splice(at, 0, copy);
  }

  decorate(manifest);
  return manifest;
}

/** Longitud actual del libro. Es una función porque el libro puede crecer. */
export const pageCount = () => manifest.length;

export const indexOfPage = (id) => manifest.findIndex((p) => p.id === id);

/** Todos los secretos que el libro puede esconder ahora mismo. */
export const allSecrets = () => manifest.filter((p) => p.secret).map((p) => p.secret);

/**
 * Páginas agrupadas por acto, para el índice.
 *
 * Se agrupa por TRAMOS SEGUIDOS y no por nombre de acto. Con un mapa, una
 * página suelta metida al principio arrastraba a su grupo todas las demás del
 * mismo acto y el índice dejaba de ir en orden: aparecía la página 41 entre
 * la 1 y la 2. Así el índice siempre se lee como se pasa el libro.
 *
 * @returns {[string, PageEntry[]][]}
 */
export function byAct() {
  const runs = [];
  for (const entry of manifest) {
    const key = entry.act || "otros";
    const last = runs[runs.length - 1];
    if (last && last[0] === key) last[1].push(entry);
    else runs.push([key, [entry]]);
  }
  return runs;
}
