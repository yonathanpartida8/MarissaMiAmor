/**
 * MANIFIESTO — el orden del libro.
 *
 * ── LOS TRES SITIOS QUE HAY QUE TOCAR ─────────────────────────────────
 *   · el TEXTO de una página  →  `chapters.js`
 *   · las FOTOS de una página →  `fotos.js`
 *   · el ORDEN del libro      →  este archivo
 *
 * ── Y TRES CARPETAS QUE SE AÑADEN SOLAS ───────────────────────────────
 * Estas no se escriben aquí: se detectan al abrir el libro y se colocan
 * siempre en el mismo sitio, en este orden y sin mezclarse nunca:
 *
 *     [ lo de este archivo · … · el final ]  [ paginas-html/ ]  [ images/amores/ ]
 *
 *   · `mis-paginas/`    páginas suyas escritas a mano; van DENTRO del libro,
 *                       donde él diga, siempre antes del final
 *   · `paginas-html/`   un archivo HTML suelto = una página; después del final
 *   · `images/amores/`  una foto = una página; lo último de lo último
 *
 * Y no hay un cuarto. Las tres listas se enganchan por el mismo nombre de
 * página (el `id` de aquí abajo), así que para cambiar la foto de un
 * capítulo no hay que venir a tocar el manifiesto: basta con escribir el
 * nombre del archivo en la línea de esa página en `fotos.js`.
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
 * @property {object[]} [photos]    fotos; normalmente NO se escribe aquí,
 *                                  sale sola de `fotos.js` por el `id`
 * @property {string} [transition]  cómo se llega. Nueve maneras:
 *      flip      la hoja gira sobre su lomo (y se puede arrastrar)
 *      dissolve  se deshace en luz mientras la otra se condensa
 *      zoom      travelling: la cámara atraviesa una y aterriza en la otra
 *      fold      se pliega sobre sí misma, como una carta que se guarda
 *      iris      diafragma de cámara que se abre desde el centro
 *      slide     la nueva empuja a la anterior, con paralaje
 *      ink       cala como una mancha de tinta
 *      tide      sube como la marea, con el borde ondulado
 *      bloom     se abre en el sitio y se enfoca
 * @property {string} [hint]        pista que susurra si se queda quieta
 * @property {string} [secret]      id del secreto que esconde
 * @property {boolean} [gl]         necesita la escena 3D
 */

import { fotosDe } from "./fotos.js";
import { chapterById } from "./chapters.js";

/** @type {PageEntry[]} */
const pages = [
  // ═══════════════════════════════════════════════════════════════
  //  ANTES DE TODO: `paginas-html/inicio.html1.html`, `…2.html` y el
  //  candado de la fecha. Hasta que no se abre, no se pasa de ahí.
  // ═══════════════════════════════════════════════════════════════
  {
    id: "inicio-1",
    type: "html",
    chapter: "inicio-1",
    src: "paginas-html/inicio.html1.html",
    transition: "dissolve",
  },
  {
    id: "inicio-2",
    type: "html",
    chapter: "inicio-2",
    src: "paginas-html/inicio.html2.html",
    transition: "flip",
  },
  {
    id: "puerta",
    type: "puerta",
    chapter: "puerta",
    transition: "zoom",
    hint: "gira las ruedas hasta nuestra fecha",
  },

  // ═══════════════════════════════════════════════════════════════
  //  PORTADA
  // ═══════════════════════════════════════════════════════════════
  {
    id: "portada",
    type: "cover",
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
    transition: "ink",
    gl: true,
    hint: "mueve el teléfono · la imagen tiene fondo",
  },
  {
    id: "lo-que-no-dije",
    type: "scratch",
    chapter: "lo-que-no-dije",
    transition: "flip",
    hint: "rasca con el dedo",
    secret: "raspado-1",
  },
  {
    id: "postal-primera",
    type: "postcard",
    chapter: "postal-primera",
    transition: "fold",
    gl: true,
    hint: "arrástrala para darle la vuelta",
    secret: "postal-1",
  },
  {
    id: "tu-voz",
    type: "chapter",
    chapter: "tu-voz",
    transition: "slide",
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
    transition: "flip",
    hint: "arrástralas · tócalas dos veces para verles el reverso",
    secret: "desorden-movido",
  },
  {
    id: "llueve-alla",
    type: "chapter",
    chapter: "llueve-alla",
    transition: "tide",
    hint: "pasa el dedo por el cristal empañado",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO II — CONOCERTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "lista-pendiente",
    type: "veil",
    chapter: "lista-pendiente",
    transition: "bloom",
    gl: true,
    hint: "acaricia la pantalla",
    secret: "velo-1",
  },
  {
    id: "por-pedacitos",
    type: "mosaic",
    chapter: "por-pedacitos",
    transition: "zoom",
    gl: true,
    hint: "toca las piezas · o arrastra por encima",
    secret: "mosaico-1",
  },
  {
    id: "me-caigo-mejor",
    type: "chapter",
    chapter: "me-caigo-mejor",
    transition: "slide",
    hint: "el reflejo te sigue",
  },
  {
    id: "razones",
    type: "razones",
    chapter: "razones",
    transition: "corazon",
    hint: "arrastra la carta a un lado, o tócala",
    secret: "razones-todas",
  },
  {
    id: "nuestra-pelicula",
    type: "filmstrip",
    chapter: "nuestra-pelicula",
    transition: "iris",
    hint: "desliza el carrete hasta el final",
    secret: "carrete-1",
  },
  {
    id: "con-mi-letra",
    type: "handwriting",
    chapter: "con-mi-letra",
    transition: "ink",
    hint: "arrastra hacia abajo y lo escribo delante de ti",
    secret: "escrito-a-mano",
  },
  {
    id: "la-combinacion",
    type: "lock",
    chapter: "la-combinacion",
    transition: "zoom",
    gl: true,
    hint: "gira los rodillos · día, mes y año",
    secret: "caja-abierta",
  },
  {
    id: "mi-norte",
    type: "chapter",
    chapter: "mi-norte",
    transition: "bloom",
    hint: "tócala",
  },
  {
    id: "botella",
    type: "bottle",
    chapter: "botella",
    transition: "tide",
    gl: true,
    hint: "tira del corcho hacia arriba",
    secret: "botella-abierta",
  },
  {
    id: "todo-lo-que-guardo",
    type: "memoryfield",
    chapter: "todo-lo-que-guardo",
    transition: "zoom",
    gl: true,
    hint: "gira el campo · toca un recuerdo",
    secret: "recuerdo-tocado",
  },
  {
    id: "en-voz-baja",
    type: "secret",
    chapter: "en-voz-baja",
    transition: "dissolve",
    hint: "toca las palabras de la nota",
    secret: "voz-baja",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO III — EXTRAÑARTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "regalo",
    type: "gift",
    chapter: "regalo",
    transition: "bloom",
    gl: true,
    // La página ya dice «tira del listón» con su flecha; la pista dice
    // DÓNDE, que es lo que no se ve.
    hint: "de la puntita de abajo · hacia ti",
    secret: "regalo-abierto",
  },
  {
    id: "cupones",
    type: "cupones",
    chapter: "cupones",
    transition: "slide",
    hint: "toca el vale de arriba, o arráncalo hacia arriba",
    secret: "vales-todos",
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
    id: "manos",
    type: "manos",
    chapter: "manos",
    transition: "dissolve",
    hint: "arrastra tu mano hacia la mía",
    secret: "manos-juntas",
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
    transition: "ink",
    gl: true,
    hint: "une las estrellas con el dedo",
    secret: "constelacion",
  },
  {
    id: "farolitos",
    type: "farolitos",
    chapter: "farolitos",
    transition: "ink",
    hint: "toca el cielo para soltar un farolito",
    secret: "farolitos-todos",
  },
  {
    id: "postal-segunda",
    type: "postcard",
    chapter: "postal-segunda",
    transition: "fold",
    gl: true,
    secret: "postal-2",
  },
  {
    id: "burbujas",
    type: "burbujas",
    chapter: "burbujas",
    transition: "bloom",
    hint: "toca las burbujas para reventarlas",
    secret: "burbujas-frase",
  },
  {
    id: "te-lo-digo-bajito",
    type: "chapter",
    chapter: "te-lo-digo-bajito",
    transition: "slide",
    hint: "acércate: está escrito bajito",
  },
  {
    id: "debajo-de-esto",
    type: "scratch",
    chapter: "debajo-de-esto",
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
    transition: "tide",
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
    transition: "slide",
  },
  {
    id: "cajita",
    type: "cajita",
    chapter: "cajita",
    transition: "corazon",
    hint: "sigue girando hasta que termine la canción",
    secret: "cajita-cancion",
  },
  {
    id: "rompecabezas-dos",
    type: "mosaic",
    chapter: "rompecabezas-dos",
    transition: "zoom",
    gl: true,
    hint: "descúbrela entera",
    secret: "mosaico-2",
  },
  {
    id: "acariciar",
    type: "veil",
    chapter: "acariciar",
    transition: "bloom",
    gl: true,
    hint: "acaricia · toca dos veces para cambiar",
    secret: "velo-2",
  },
  {
    id: "mejorar",
    type: "chapter",
    chapter: "mejorar",
    transition: "ink",
  },
  {
    id: "cosas-tuyas",
    type: "polaroids",
    chapter: "cosas-tuyas",
    transition: "slide",
    hint: "dales la vuelta",
    secret: "cosas-tuyas-vistas",
  },
  {
    id: "frasco",
    type: "frasco",
    chapter: "frasco",
    transition: "corazon",
    hint: "toca el frasco para sacar una notita",
    secret: "frasco-vacio",
  },
  {
    id: "no-se-me-pasa",
    type: "filmstrip",
    chapter: "no-se-me-pasa",
    transition: "iris",
    secret: "carrete-2",
  },
  {
    id: "gracias",
    type: "chapter",
    chapter: "gracias",
    transition: "tide",
  },
  {
    id: "ultima-sorpresa",
    type: "sorpresa",
    chapter: "ultimo-secreto",
    transition: "ink",
    gl: true,
    hint: "toca las cosas del cajón",
    secret: "ultimo-secreto",
  },
  {
    id: "te-elijo",
    type: "depth",
    chapter: "te-elijo",
    transition: "bloom",
    gl: true,
  },

  // ═══════════════════════════════════════════════════════════════
  //  FINAL
  // ═══════════════════════════════════════════════════════════════
  {
    id: "final",
    type: "finale",
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
/**
 * Le pone su índice, su acto y sus fotos a cada entrada.
 *
 * Las fotos salen de `fotos.js` buscando por el nombre de la página. Antes
 * había que escribirlas también aquí —treinta líneas de `photos: grupos.loQue
 * Sea`—, así que cambiar una foto obligaba a tocar dos archivos y a acertar
 * con un nombre en jerga. Ahora hay un solo sitio y se llama como la página.
 */
function decorate(list) {
  list.forEach((entry, index) => {
    entry.index = index;
    entry.act = entry.act || chapterById[entry.chapter]?.act || null;
    // Las páginas de él (`mis-paginas/`, `images/amores/`) traen las suyas.
    entry.photos = entry.photos || fotosDe(entry.id);
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

/**
 * Añade las páginas de `paginas-html/` DESPUÉS del final y ANTES de las fotos.
 *
 * El libro tiene tres tramos, y este orden no es negociable:
 *
 *     [ las páginas de siempre · … · el final ]  [ las HTML ]  [ las fotos ]
 *
 * Por eso no vale con `push`. Las fotos de `images/amores/` se buscan en la
 * red y pueden llegar antes o después que las HTML según lo que tarde cada
 * carpeta; si las HTML se limitaran a añadirse al final, un día aparecerían
 * detrás de las fotos y otro día en medio de ellas, según qué petición
 * volviera primero. Aquí se busca el sitio en vez de suponerlo: justo delante
 * de la primera foto, o al final si todavía no hay ninguna.
 */
export function registerPaginasHtml(entries) {
  if (!entries?.length) return manifest;

  for (const entry of entries) {
    const primeraFoto = manifest.findIndex((e) => e.type === "amor");
    const at = primeraFoto === -1 ? finDeLoNormal() : primeraFoto;
    manifest.splice(at, 0, { ...entry });
  }

  decorate(manifest);
  return manifest;
}

/**
 * Dónde acaba el libro «normal»: antes de las páginas marcadas como
 * últimas.
 *
 * Hay páginas que tienen que ir al final de todo pase lo que pase —la
 * noche estrellada—, y las HTML y las fotos se añaden cuando llegan de
 * la red, que puede ser en cualquier orden. Sin esto, una foto que
 * llegara tarde se colocaría DETRÁS del final del libro.
 */
function finDeLoNormal() {
  const i = manifest.findIndex((e) => e.ultima);
  return i === -1 ? manifest.length : i;
}

/**
 * Añade una página que va DESPUÉS DE TODO, y que nada puede adelantar.
 *
 * Es para el cierre de verdad: la noche estrellada. Se marca con
 * `ultima: true` y `registerAmores` y `registerPaginasHtml` lo respetan,
 * llegue lo que llegue después y en el orden que llegue.
 */
export function registerUltima(entry) {
  if (!entry) return manifest;
  if (manifest.some((e) => e.id === entry.id)) return manifest;
  manifest.push({ ...entry, ultima: true });
  decorate(manifest);
  return manifest;
}

/**
 * Añade las páginas de `images/amores/` DESPUÉS de todo.
 *
 * Ojo a la diferencia con `registerCustomPages`: aquélla mete las páginas
 * *antes* del cierre, porque son capítulos suyos y el cierre tiene que cerrar.
 * Éstas no. Éstas van detrás del final y detrás de las HTML, como el álbum que
 * se abre cuando ya se ha leído el libro entero. Nunca, bajo ningún concepto,
 * antes de las páginas principales: son lo último de lo último.
 */
export function registerAmores(entries) {
  if (!entries?.length) return manifest;

  /* Detrás de todo, sí, pero DELANTE del cierre de verdad: la noche
     estrellada va marcada `ultima` y nada se pone después de ella. */
  for (const entry of entries) manifest.splice(finDeLoNormal(), 0, { ...entry });

  decorate(manifest);
  return manifest;
}

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
