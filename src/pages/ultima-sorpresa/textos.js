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
   * Los seis objetos. `gesto` es sólo para la pista que se susurra si
   * lleva un rato sin tocar nada — la interacción está en el código.
   */
  objetos: {
    cerilla: {
      gesto: "tócala",
      dice: "Para las noches en que hablamos hasta tarde y no me di cuenta de la hora.",
    },
    papel: {
      gesto: "desdóblalo",
      dice: "Aquí escribí tu nombre el día que no me atreví a decírtelo.",
    },
    llave: {
      gesto: "gírala",
      dice: "No abre nada. La guardo porque me la diste tú.",
    },
    concha: {
      gesto: "mantén el dedo",
      dice: "Suena a un sitio al que quiero llevarte, mi amor.",
    },
    estrella: {
      gesto: "tócala dos veces",
      dice: "Pedí un deseo y me salió tu cara.",
    },
    anillo: {
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
