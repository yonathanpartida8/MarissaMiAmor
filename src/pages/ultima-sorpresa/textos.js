/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TEXTOS DE LA ÚLTIMA SORPRESA                                    ║
 * ║                                                                  ║
 * ║  Seis objetos sobre una mesa. Cada uno se toca de una manera      ║
 * ║  distinta y dice lo suyo. Cuando están los seis, pasa algo.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const textos = {
  arriba: "hay seis cosas aquí",
  titulo: "El cajón",

  /** Se lee al llegar, antes de tocar nada. */
  intro: "Guardo cosas pequeñas. Tócalas.",

  /**
   * Los seis objetos. `etiqueta` es la notita que sale debajo al
   * encontrarlo; `gesto` es sólo para la pista que se susurra si lleva un
   * rato sin tocar nada — la interacción está en el código.
   */
  objetos: {
    beso: {
      etiqueta: "el primero",
      gesto: "tócalo",
      dice: "El primero. Me quedé tonto un rato largo, mi amor.",
    },
    carta: {
      etiqueta: "tu nombre",
      gesto: "ábrela",
      dice: "Aquí escribí tu nombre el día que no me atreví a decírtelo.",
    },
    espiral: {
      etiqueta: "un mechón",
      gesto: "desenróllala",
      dice: "Un mechón tuyo. No preguntes cómo acabó aquí.",
    },
    corazon: {
      etiqueta: "late por ti",
      gesto: "mantén el dedo",
      dice: "Sigue haciendo lo mismo cada vez que apareces.",
    },
    estrella: {
      etiqueta: "un deseo",
      gesto: "tócala dos veces",
      dice: "Pedí un deseo y me salió tu cara.",
    },
    anillo: {
      etiqueta: "algún día",
      gesto: "tócalo",
      dice: "Algún día. Sin prisa, pero algún día.",
    },
  },

  /** El susurro si lleva un rato sin tocar nada. */
  empujoncito: "toca las cosas del cajón",

  /** Va contando cuántas quedan. */
  quedan: (n) => (n === 1 ? "queda una" : `quedan ${n}`),

  // ── EL FINAL ──────────────────────────────────────────────────────
  final: "Y esto también lo guardo:",
  finalGrande: "que te amo muchísimo, amorcito.",
  firma: "— siempre tuyo",

  // ── EASTER EGG ────────────────────────────────────────────────────
  /** Tocar tres veces el fondo vacío suelta una luciérnaga. */
  luciernaga: "sigue ahí",
};

export default textos;
