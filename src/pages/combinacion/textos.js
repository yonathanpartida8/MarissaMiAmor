/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TEXTOS DE LA PÁGINA DEL CANDADO                                 ║
 * ║  Cambia lo que quieras aquí. No hace falta tocar nada más.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const textos = {
  /** La línea pequeña de encima del candado. */
  arriba: "pon la fecha y se abre",

  /** Lo que hay grabado en el metal del candado. */
  grabado: "M & Y",

  // ── LA FECHA QUE ABRE ─────────────────────────────────────────────
  /**
   * Día, mes y año. Se escribe así: "DD-MM-AAAA".
   *
   * Es lo ÚNICO que abre el candado. No hay atajo, no se rinde a los pocos
   * intentos y no se abre solo: mientras no esté puesta esta fecha exacta,
   * lo de dentro sigue guardado.
   *
   * La rueda de los años se hace sola alrededor de éste, así que si cambias
   * el año aquí, la rueda cambia con él.
   */
  fecha: "23-08-2025",

  /** La pista que aparece tras unos cuantos intentos. Nunca da la respuesta. */
  pista: "el día en que todo esto empezó",

  /** La segunda pista, más cerquita, cuando ya lleva unos cuantos. */
  pistaDos: "verano. hacía calor y yo estaba nerviosísimo",

  // ── LO QUE DICE MIENTRAS SE INTENTA ───────────────────────────────
  fallo: [
    "no era ésa",
    "casi",
    "prueba otra vez, mi amor",
    "tú sabes cuál es",
  ],

  /** Cuando ya lleva muchos intentos, señala qué rueda está bien puesta. */
  ayuda: "mira: eso ya lo tienes bien",

  // ── AL ABRIRSE ────────────────────────────────────────────────────
  abierto: "abierto",

  /** El título de lo que hay guardado dentro. */
  titulo: "Sólo tú sabes abrirlo",

  /** El cuerpo. Puedes escribir tanto como quieras: hace scroll solo. */
  texto: "Guardo cosas. No muchas, pero las guardo: una fecha, una frase que dijiste sin darle importancia, la cara que pusiste cuando te dije lo que sentía. Las tengo aquí dentro, detrás de un día que sólo significa algo para nosotros dos.\nNuestro día especial. Ese día que, aunque estemos lejos y no podamos vivirlo juntos de la manera que quisiera, sigue siendo nuestro. Una fecha que para los demás puede ser cualquiera, pero que para mí siempre va a tener algo diferente porque lleva un pedacito de nosotros.\nGuardo esos pequeños momentos porque, estando a distancia, a veces son lo más cerquita que puedo sentirte. Una llamada, un mensaje, una palabra tuya… cosas pequeñitas que terminan significando muchísimo cuando vienen de ti.\nY quizá algún día podamos mirar atrás y decir: “¿Te acuerdas de todo esto?” Y entonces ya no estaremos separados por una pantalla, sino juntos, recordando todo lo que tuvimos que esperar para llegar hasta ahí.\nPor eso sólo tú sabes abrirlo. Porque sólo tú conoces la historia que hay detrás de todo lo que guardo aquí.",

  /** Lo que aparece al final, cuando ya está todo abierto. */
  revelacion: "Te amo muchísimo, amorcito. Y nuestro día siempre va a ser nuestro. 🥹",
};

export default textos;
