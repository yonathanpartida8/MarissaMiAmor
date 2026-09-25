/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TEXTOS DE LA PÁGINA DEL SECRETO                                 ║
 * ║                                                                  ║
 * ║  Cómo funciona: en `nota` marca palabras entre *asteriscos*.      ║
 * ║  Cada palabra marcada esconde una frase de `escondidas`, en el    ║
 * ║  mismo orden. Al tocarla se enciende y suelta su frase.           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const textos = {
  arriba: "hay cosas escritas entre líneas",
  titulo: "Lo que no se ve de primeras",

  /**
   * La nota. Las palabras entre *asteriscos* esconden algo.
   * Pon tantas como quieras: el número de frases de abajo tiene que coincidir.
   */
  nota:
    "Hay cosas que no te digo en voz *alta* porque suenan pequeñas dichas así, de golpe. " +
    "Que me gusta cómo dices mi *nombre*. Que reviso el teléfono más veces de las que " +
    "debería. Que aprendí a hacer bien el *café* sólo porque un día dijiste que te gustaba. " +
    "Que hay canciones que ya no son mías, son *nuestras*. Y que si me preguntan qué es lo " +
    "mejor que me ha pasado, no tengo que *pensarlo*.",

  /** Una por cada palabra marcada, en el mismo orden. */
  escondidas: [
    "…y en voz baja te las digo todas.",
    "lo dices como si pesara poco. A mí me pesa todo.",
    "sigo haciéndolo mal, pero lo hago pensando en ti.",
    "no me las devuelvas nunca.",
    "eres tú, mi amor. Siempre fuiste tú.",
  ],

  /** El susurro que aparece si lleva un rato sin encontrar nada. */
  empujoncito: "toca las palabras",

  /** Cuando ya las ha encontrado todas. */
  final: "Te amo, mi niña. Con todo lo que no digo también.",

  /** Arriba de la carta. */
  saludo: "Para Marissa,",
  fecha: "23 · 08 · 25",
  firma: "— tuyo, aunque no lo diga en voz alta",

  // ── LA LINTERNA DE TINTA INVISIBLE ──────────────────────────────────
  // Con la linterna encendida, al pasar el dedo por la carta aparecen estas
  // frases, escritas con tinta que sólo se ve con esa luz. Cada una lleva
  // dónde va (en % de la carta) y cuánto se tuerce.
  linterna: "linterna",
  linternaAyuda: "pasa el dedo por la carta",
  invisibles: [
    { texto: "te pienso más de lo que te digo", x: 12, y: 30, giro: -4 },
    { texto: "quédate", x: 68, y: 44, giro: 6 },
    { texto: "eres mi casa", x: 10, y: 58, giro: 3 },
    { texto: "ya quiero verte", x: 52, y: 72, giro: -5 },
    { texto: "para siempre, ¿va?", x: 22, y: 86, giro: 2 },
  ],
  linternaTodas: "Tinta invisible: ahora ya lo sabes todo.",

  // ── EASTER EGGS ───────────────────────────────────────────────────
  /** Mantener pulsado el lacre de la esquina. */
  lacre: "M · Y",
  secretoDelLacre: "esto lo cerré yo",

  /** Doble toque en cualquier parte del papel. */
  corazonSuelto: "eres mi amor",
};

export default textos;
