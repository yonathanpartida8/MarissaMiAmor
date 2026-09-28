/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  LOS TRES MODOS DEL LIBRO                                        ║
 * ║                                                                  ║
 * ║    ☀️  claro    de día, con la ventana abierta                    ║
 * ║    🌸  pastel   el rubor de la tarde                             ║
 * ║    🌙  noche    la lámpara encendida y nadie más despierto        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ── QUÉ NO SON ────────────────────────────────────────────────────────
 * No son tres interfaces distintas ni tres paletas sueltas. Los colores de
 * cada capítulo —los nueve de `paletas.js`— siguen mandando en los tres: un
 * capítulo «vino» es vino de día y es vino de noche. Lo que cambia es LA
 * HABITACIÓN donde está el libro, no el libro.
 *
 * Por eso un tema no define colores: define CÓMO SE TRATA el color que ya
 * hay. Cuánta luz tiene el aire, cuánto se tiñe el papel, hacia dónde va la
 * tinta, cuánta viñeta aguanta la escena.
 *
 * ── LA PARTE DIFÍCIL: EL FONDO ────────────────────────────────────────
 * El fondo del libro es un shader que SUMA luz: parte de un color casi
 * negro y le añade velos de color encima, que es como se pinta algo que
 * brilla en la oscuridad. Poner ahí un fondo claro sin tocar nada más no
 * daba un modo claro: daba una pantalla blanca quemada, porque a un blanco
 * ya no se le puede sumar nada.
 *
 * Así que cada tema trae dos cosas para el fondo:
 *
 *   · `fondo(paleta)`   los tres colores del capítulo, llevados a la
 *                       habitación de este tema (de noche se quedan como
 *                       están; de día el hondo sube casi hasta el blanco y
 *                       los acentos se suavizan para no chillar).
 *
 *   · `luzAmbiente`     0 o 1, y va al shader. Con 0 los velos SUMAN luz,
 *                       como siempre. Con 1 los velos TIÑEN: en vez de
 *                       iluminar un cuarto oscuro, colorean una pared
 *                       blanca. Es la misma niebla, moviéndose igual, con
 *                       la única diferencia que separa una vidriera de una
 *                       linterna.
 *
 * ── PARA AÑADIR UN CUARTO MODO ────────────────────────────────────────
 * Se copia uno de los tres de abajo, se cambian sus números y se pone en
 * `TEMAS`. El selector de la barra, el guardado y el resto del libro lo
 * recogen solos: nadie tiene una lista de tres escrita a mano.
 */

import { mezclar } from "./color.js";

/** El papel de la noche: marfil cálido, con la tinta en ciruela e índigo. */
const PAPEL_NOCHE = {
  claro: "#fffbf5",
  medio: "#fdf4ec",
  hondo: "#f8e9e1",
  bajo: "#efdad4",
  borde: "#d9bccb",
  tinta: "#2e2042",
  tintaSuave: "#625476",
};

export const TEMAS = {
  // ══════════════════════════════════════════════════════════════════
  //  ☀️  CLARO — de día, con la ventana abierta.
  // ══════════════════════════════════════════════════════════════════
  claro: {
    id: "claro",
    nombre: "Claro",
    emoji: "☀️",
    /** Lo que dice el aviso al cambiar. */
    frase: "Modo claro · de día",

    /** El fondo tiñe en vez de sumar. Ver la nota de arriba. */
    luzAmbiente: 1,

    /** Para el navegador: barra de estado, formularios, barras de scroll. */
    esquema: "light",
    /** El color de la barra del sistema en el móvil. */
    barraSistema: "#fdf6f2",

    /**
     * La habitación es blanca y cálida. El hondo del capítulo casi
     * desaparece —queda como el rescoldo de su color en una pared— y los
     * acentos se rebajan: a plena luz, un rosa saturado en un velo de dos
     * palmos de ancho es un manchón, no una atmósfera.
     */
    fondo: ({ a, b, deep }) => ({
      a: mezclar(a, "#ffffff", 0.28),
      b: mezclar(b, "#ffd3dd", 0.52),
      deep: mezclar(deep, "#fffaf6", 0.94),
    }),

    papel: {
      claro: "#ffffff",
      medio: "#fffcf9",
      hondo: "#fdf4ef",
      bajo: "#f2e3da",
      borde: "#ddc4b8",
      tinta: "#33232a",
      tintaSuave: "#6b545c",
    },

    /* De día el papel se tiñe menos: la luz de la habitación ya es blanca,
       y una hoja muy teñida sobre una pared blanca parece sucia. */
    tinte: {
      claro: 0.03,
      medio: 0.05,
      hondo: 0.09,
      bajo: 0.13,
      borde: 0.2,
      tinta: 0.12,
      tintaSuave: 0.16,
    },

    sombraBase: "#b08d76",
    luzBase: "#ffffff",

    /* El cromo —barra, índice, avisos— es claro, así que su texto es
       oscuro. Es el cambio que hace que esto sea un modo claro de verdad y
       no un modo oscuro con el fondo subido. */
    texto: {
      base: "#38242c",
      suave: "rgba(56, 36, 44, 0.84)",
      tenue: "rgba(56, 36, 44, 0.74)",
    },

    /* El dorado del cromo: el contador de secretos, la nota del aviso, la
       música encendida. El champán del libro es precioso sobre el cromo
       oscuro de la noche y a plena luz desaparece —se midió: 1.06 a 1
       contra su propio fondo, o sea invisible—. De día es oro viejo. */
    oro: { base: "#8a5f22", brillo: "#6f4a15" },

    /* El filo de luz del cromo. Sobre un cromo claro, un filo blanco no se
       ve: aquí es una sombra vinosa muy floja, que es lo que separa una
       superficie clara de otra. */
    cromoLuz: "#7a4a55",

    /* Cuánto color del capítulo lleva el cromo. De día muy poco: una barra
       rosa sobre una pared blanca es un cartel. */
    cromoMezcla: [0.07, 0.14],

    /* A plena luz casi no hay viñeta: oscurecer las esquinas de una escena
       clara la ensucia en vez de darle cine. */
    vineta: { fuerza: 0.12, sobrePapel: 0.06 },
    grano: { base: 0.022, alto: 0.03 },
  },

  // ══════════════════════════════════════════════════════════════════
  //  🌸  PASTEL — el rubor de la tarde.
  // ══════════════════════════════════════════════════════════════════
  pastel: {
    id: "pastel",
    nombre: "Pastel",
    emoji: "🌸",
    frase: "Modo pastel · la tarde",

    luzAmbiente: 1,
    esquema: "light",
    barraSistema: "#fff5ee",

    /**
     * La tarde con luz de verdad. El aire ya NO sale de oscurecer el hondo
     * del capítulo (eso daba un rosa despintado, grisáceo): sale de su color
     * VIVO disuelto en crema. Así cada capítulo tiñe la habitación de su
     * propio tono —durazno, lavanda, menta, rosa— limpio y luminoso, y los
     * velos conservan casi toda su saturación.
     */
    fondo: ({ a, b }) => ({
      a: mezclar(a, "#ffcf9e", 0.34),
      // El segundo velo se va hacia la lavanda: así la tarde nunca es de
      // un solo color, sino rosa con lila, durazno con lila, menta con lila.
      b: mezclar(mezclar(b, "#a58cff", 0.55), "#ffffff", 0.12),
      deep: mezclar(mezclar(a, "#e9dcff", 0.35), "#fffaf4", 0.84),
    }),

    papel: {
      claro: "#fffefb",
      medio: "#fffaf5",
      hondo: "#fff2ea",
      bajo: "#fbe4dc",
      borde: "#eec3c9",
      tinta: "#33204a",
      tintaSuave: "#67557d",
    },

    tinte: {
      claro: 0.04,
      medio: 0.07,
      hondo: 0.1,
      bajo: 0.15,
      borde: 0.22,
      tinta: 0.12,
      tintaSuave: 0.16,
    },

    sombraBase: "#a98bc0",
    luzBase: "#fffdf8",

    /* Tinta ciruela-índigo: se lee perfecto y no es negro ni café. */
    texto: {
      base: "#33204a",
      suave: "rgba(51, 32, 74, 0.84)",
      tenue: "rgba(51, 32, 74, 0.72)",
    },

    oro: { base: "#b0621a", brillo: "#8f4c0f" },

    cromoLuz: "#5a3a8c",
    cromoMezcla: [0.1, 0.2],

    vineta: { fuerza: 0.12, sobrePapel: 0.08 },
    grano: { base: 0.024, alto: 0.032 },
  },

  // ══════════════════════════════════════════════════════════════════
  //  🌙  NOCHE — la lámpara encendida y nadie más despierto.
  //  El libro nació así. Estos son sus números de siempre.
  // ══════════════════════════════════════════════════════════════════
  noche: {
    id: "noche",
    nombre: "Noche",
    emoji: "🌙",
    frase: "Modo noche · la lámpara",

    /** Los velos SUMAN luz: es un cuarto oscuro con una linterna dentro. */
    luzAmbiente: 0,
    esquema: "dark",
    barraSistema: "#0e0b22",

    /** De noche el capítulo se ve casi como está escrito; su segundo velo
        se tiñe un poco de violeta, para que la noche sea romántica y no roja. */
    fondo: ({ a, b, deep }) => ({ a, b: mezclar(b, "#6a4fe0", 0.3), deep }),

    papel: PAPEL_NOCHE,

    /* Números pequeños a propósito: el papel tiene que seguir siendo papel.
       Lo que se busca es que la hoja parezca estar DENTRO de esa luz, no
       que se ponga del color del capítulo. */
    tinte: {
      claro: 0.05,
      medio: 0.09,
      hondo: 0.14,
      bajo: 0.2,
      borde: 0.26,
      tinta: 0.16,
      tintaSuave: 0.2,
    },

    /** Un pardo cálido y un blanco cálido: la sombra y la luz de la hoja. */
    sombraBase: "#8a6fa6",
    luzBase: "#fffdf6",

    /* Marfil templado: un blanco frío sobre fondo rosa se ve azulado. */
    texto: {
      base: "#fff3ec",
      suave: "rgba(255, 243, 236, 0.72)",
      tenue: "rgba(255, 243, 236, 0.6)",
    },

    /* De noche, champán dorado. */
    oro: { base: "#ffcf8a", brillo: "#ffe6bf" },

    cromoLuz: "#ffffff",
    cromoMezcla: [0.22, 0.4],

    vineta: { fuerza: 0.48, sobrePapel: 0.38 },
    grano: { base: 0.035, alto: 0.05 },
  },
};

/** El orden en que los recorre el botón de la barra: de día a noche. */
/* El modo claro se quitó: el libro vive entre la tarde y la noche. */
export const ORDEN = ["pastel", "noche"];

/** Con el que abre quien nunca ha elegido. El libro nació de noche. */
export const TEMA_POR_DEFECTO = "noche";

let activo = TEMAS[TEMA_POR_DEFECTO];

/** El tema que está puesto ahora mismo. */
export function temaActivo() {
  return activo;
}

/**
 * Pone un tema. No toca el DOM: de eso se encarga `luz.js`, que es quien
 * sabe traducir todo esto a tokens. Aquí sólo se decide cuál es.
 *
 * @param {string} id
 * @returns {boolean} si de verdad ha cambiado
 */
export function ponerTema(id) {
  // Quien tuviera guardado el modo claro pasa al pastel, que es el más cercano.
  if (!ORDEN.includes(id)) id = "pastel";
  const tema = TEMAS[id];
  if (!tema || tema === activo) return false;
  activo = tema;
  return true;
}

/** El siguiente en la rueda. Es lo que hace el botón de la barra. */
export function temaSiguiente(id = activo.id) {
  const i = ORDEN.indexOf(id);
  return ORDEN[(i + 1) % ORDEN.length];
}

/**
 * Los tres colores de un capítulo, llevados a la habitación del tema.
 *
 * Lo llaman DOS sitios —`luz.js` para el papel y el router para el fondo de
 * WebGL— y es importante que sea el mismo cálculo en los dos: si el fondo
 * se aclarara por un lado y el papel se tiñera por otro, volveríamos a
 * tener dos cosas distintas en la misma pantalla, que es justo lo que este
 * libro lleva tiempo evitando.
 */
export function fondoDelTema(paleta, tema = activo) {
  if (!paleta?.a) return paleta;
  return tema.fondo(paleta);
}

/**
 * Lo que el sistema operativo prefiere, si es que el libro no tiene ya una
 * elección guardada. Quien lleva el teléfono en modo claro se merece abrir
 * el libro de día sin tener que pedirlo.
 */
export function temaDelSistema() {
  try {
    return matchMedia("(prefers-color-scheme: light)").matches ? "pastel" : "noche";
  } catch {
    return TEMA_POR_DEFECTO;
  }
}
