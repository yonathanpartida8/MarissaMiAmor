/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TEXTOS DE LA PÁGINA DEL CORAZÓN                                 ║
 * ║  Cambia lo que quieras aquí. No hace falta tocar nada más.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const textos = {
  arriba: "pon tu pulgarcito y no lo quites",
  titulo: "Mi pulso",

  /** Lo que se lee antes de poner el dedo. */
  texto:
    "Ponle tu dedito encima y quédate conmigo un ratito. Esto no mide nada — no es un aparato — " +
    "pero es lo más parecido que sé hacer para enseñarte cómo se me pone el corazón cada vez " +
    "que apareces, mi amor. Así, tal cual, se me pone por ti.",

  /** Lo que dice la almohadilla antes de tocarla. */
  invitacion: "aquí, mi vida",

  /** Mientras se sostiene el dedo. Van saliendo en orden, un latido cada una. */
  latidos: [
    "ahí estás, mi amor 🥹",
    "no lo sueltes, ¿sí?",
    "siente cómo late por ti",
    "esto es todo tuyo",
    "ay, más rápido 🫠",
    "es que eres tú",
    "un poquito más…",
    "casi, mi vida 🤍",
  ],

  /** Cuando se levanta el dedo antes de tiempo (sale una distinta cada vez). */
  suelto: [
    "vuelve 🥺",
    "no te vayas, mi amor",
    "¿a dónde vas? ponlo otra vez 🥹",
    "te extrañé ya, regresa",
  ],

  /** La frase del final, cuando aguanta hasta el final. */
  revelacion: "Así se me pone cada vez que te veo, mi vida. Cada vez. Te amo con todo mi corazón. 🤍",

  /**
   * Cuando ya vio la frase y vuelve a poner el dedo: de vez en cuando se
   * escapa una de éstas, al azar.
   */
  mientras: [
    "late por ti, nada más por ti",
    "mi corazón te reconoce 🥹",
    "así suenas tú por dentro de mí",
    "tuyo, completito",
    "te amo en cada latido",
    "¿sientes? eres tú 🤍",
    "mi lugar favorito es contigo",
    "ya ni disimula, se acelera solito",
    "cada pum es un te amo",
    "mi niña linda, te amo",
  ],

  /** Debajo del número, para que no parezca un aparato médico. */
  pieDelNumero: "latidos por minuto por ti, más o menos",

  // ── EL BESO (escondido) ─────────────────────────────────────────────
  // Sale debajo del corazón cuando ya se leyó la frase. Con dos dedos
  // puestos a la vez —o tocando esta misma línea— el corazón se acelera
  // hasta `besoMaximo` latidos por minuto y sale el diálogo.

  /** La invitación. */
  beso: "Besa tus dos deditos y ponlos aquí para ver mi pulso 💋",

  /** Hasta cuántos latidos por minuto llega. */
  besoMaximo: 420,

  /** Lo que va diciendo mientras se acelera, en orden. */
  besoSubiendo: ["¿eh? 😳", "espérate…", "no, no, no", "¡ay, mi amor!", "ayudaaa 😭"],

  /** Quién habla en el diálogo. */
  besoQuien: "mi corazón",

  /** El diálogo, una tarjeta tras otra (se pasa tocando). */
  besoDialogo: [
    "¡Jhsusbsy 😭 me chivié!",
    "No se vale, eh… me mandaste un besito con los deditos y me fui hasta 420.",
    "Es que tú no sabes lo que me haces, mi amor 🫠",
    "Ya, ya… déjame respirar tantito.",
    "…",
    "Bueno, ya estoy. Pero ese beso ya es mío y no te lo devuelvo. Te amo, preciosa 🤍",
  ],

  /** Los dos botones del final del diálogo. */
  besoOtraVez: "otro besito 💋",
  besoCerrar: "ya, respira 🥹",
};

export default textos;
