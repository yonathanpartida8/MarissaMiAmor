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
  besoSubiendo: ["¿eh? 😳", "¿un besito? 🥹", "ay, mi amor…", "me late bien fuerte 💗", "¡me vas a derretir! 😭💗"],

  /** Quién habla en el diálogo. */
  besoQuien: "mi corazón",

  /** El diálogo, una tarjeta tras otra (se pasa tocando). */
  besoDialogo: [
    "¡Ksjsbs 😭💗 me chivié toditito!",
    "Me mandaste un besito con tus deditos y mi corazón se fue hasta 420, mi amor ✨",
    "Es que tú no sabes lo bonito que me haces sentir, mi niña linda 🥹",
    "Cada besito tuyo me pone así, bien contento 💗",
    "…",
    "Ese besito ya es mío y lo guardo aquí, en mi corazón. Te amo, preciosa 💗",
    "¿Me das otro besito? Pero besa bien tus deditos y de nuevo ponlos en el sensor, ksjsbs 😭💗✨",
  ],

  /** Los dos botones del final del diálogo. */
  besoOtraVez: "otro besito 💋",
  besoCerrar: "guardar mi besito 💗",
};

export default textos;
