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

/** El papel de la noche: crema con una gota de rosa. */
const PAPEL_NOCHE = {
  claro: "#fffaf4",
  medio: "#fbf0e8",
  hondo: "#f3e2da",
  bajo: "#e7d0c8",
  borde: "#d4b3ab",
  tinta: "#3d2a2b",
  tintaSuave: "#705558",
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
    barraSistema: "#fbeaf0",

    /**
     * A medio camino, y a propósito más cerca de la luz que de la sombra:
     * un pastel oscuro es un malva triste. El hondo sube casi tanto como en
     * el claro, pero conservando bastante más color, y los acentos se
     * quedan con su saturación: el rosa TIENE que verse, es de lo que va
     * este modo.
     */
    fondo: ({ a, b, deep }) => ({
      a: mezclar(a, "#ffffff", 0.16),
      b: mezclar(b, "#ffd9e6", 0.46),
      deep: mezclar(deep, "#ffe9f1", 0.89),
    }),

    papel: {
      claro: "#fffdfb",
      medio: "#fff6f8",
      hondo: "#ffeaf0",
      bajo: "#f7d8e2",
      borde: "#e9bccb",
      tinta: "#4a2b39",
      tintaSuave: "#7d5d68",
    },

    tinte: {
      claro: 0.04,
      medio: 0.07,
      hondo: 0.11,
      bajo: 0.16,
      borde: 0.22,
      tinta: 0.14,
      tintaSuave: 0.18,
    },

    sombraBase: "#c08fa0",
    luzBase: "#fffdfe",

    texto: {
      base: "#4a2333",
      suave: "rgba(74, 35, 51, 0.84)",
      tenue: "rgba(74, 35, 51, 0.74)",
    },

    oro: { base: "#8c5730", brillo: "#71421f" },

    cromoLuz: "#8a3a57",
    cromoMezcla: [0.1, 0.19],

    vineta: { fuerza: 0.18, sobrePapel: 0.1 },
    grano: { base: 0.03, alto: 0.04 },
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
    barraSistema: "#0a0510",

    /** De noche el capítulo se ve tal y como está escrito. */
    fondo: (paleta) => paleta,

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
    sombraBase: "#a8836a",
    luzBase: "#fffdf6",

    /* Marfil templado: un blanco frío sobre fondo rosa se ve azulado. */
    texto: {
      base: "#fdeee9",
      suave: "rgba(253, 238, 233, 0.68)",
      tenue: "rgba(253, 238, 233, 0.58)",
    },

    /* De noche el champán de siempre. */
    oro: { base: "#e6c08a", brillo: "#ffe2bb" },

    cromoLuz: "#ffffff",
    cromoMezcla: [0.22, 0.4],

    vineta: { fuerza: 0.55, sobrePapel: 0.44 },
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
