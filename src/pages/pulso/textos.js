/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TEXTOS DE LA PÁGINA DEL CORAZÓN                                 ║
 * ║  Cambia lo que quieras aquí. No hace falta tocar nada más.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const textos = {
  arriba: "pon el pulgar y no lo quites",
  titulo: "Mi pulso",

  /** Lo que se lee antes de poner el dedo. */
  texto:
    "Ponle el dedo encima y quédate un momento. Esto no mide nada — no es un aparato — " +
    "pero es lo más parecido que sé hacer a enseñarte cómo se me pone el pecho cuando " +
    "apareces.",

  /** Lo que dice la almohadilla antes de tocarla. */
  invitacion: "aquí",

  /** Mientras se sostiene el dedo. Van saliendo en orden, un latido cada una. */
  latidos: [
    "ahí estás",
    "no lo sueltes",
    "esto es tuyo",
    "más rápido",
    "un poco más",
    "casi",
  ],

  /** Cuando se levanta el dedo antes de tiempo. */
  suelto: "vuelve",

  /** La frase del final, cuando aguanta hasta el final. */
  revelacion: "Así se me pone cada vez, mi vida. Cada vez. Te amo.",

  /** Debajo del número, para que no parezca un aparato médico. */
  pieDelNumero: "latidos por minuto, más o menos",

  // ── EL BESO (escondido) ─────────────────────────────────────────────
  // Sale debajo del corazón cuando ya se leyó la frase. Con dos dedos
  // puestos a la vez —o tocando esta misma línea— el corazón se acelera
  // hasta `besoMaximo` latidos por minuto y sale el diálogo.

  /** La invitación. */
  beso: "Besa tus dos dedos y ponlos para ver mi pulso",

  /** Hasta cuántos latidos por minuto llega. */
  besoMaximo: 420,

  /** Lo que va diciendo mientras se acelera, en orden. */
  besoSubiendo: ["¿eh?", "espérate…", "no, no, no", "¡ay!", "ayuda"],

  /** Quién habla en el diálogo. */
  besoQuien: "mi corazón",

  /** El diálogo, una tarjeta tras otra (se pasa tocando). */
  besoDialogo: [
    "¡Jhsusbsy 😭 me chivié!",
    "No se vale, eh… me mandaste un besito con los dedos y se me fue hasta 420.",
    "Ya, ya… déjame respirar tantito.",
    "…",
    "Bueno, ya estoy. Pero ese beso ya es mío y no te lo devuelvo.",
  ],

  /** Los dos botones del final del diálogo. */
  besoOtraVez: "otro besito",
  besoCerrar: "ya, respira",
};

export default textos;
