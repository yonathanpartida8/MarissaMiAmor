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
  texto:
    "Guardo cosas. No muchas, pero las guardo: una fecha, una frase que dijiste sin darle importancia, " +
    "la cara que pusiste cuando te dije lo que sentía. Las tengo aquí dentro, detrás de un día que sólo " +
    "significa algo para nosotros dos.\n\n" +
    "Cualquiera podría probar mil fechas. Tú lo sabías al primer intento, mi vida, y eso es exactamente " +
    "lo que quería contarte con esto.",

  /** Lo que aparece al final, cuando ya está todo abierto. */
  revelacion: "Te amo muchísimo, amorcito.",
};

export default textos;
