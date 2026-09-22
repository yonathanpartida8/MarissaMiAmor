/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TEXTOS DE LAS PÁGINAS DE IMAGEN                                 ║
 * ║                                                                  ║
 * ║  Estas páginas salen solas de `images/amores/amor1.png`,          ║
 * ║  `amor2.png`… y por defecto NO llevan texto: la foto es la        ║
 * ║  protagonista y no hace falta explicarla.                         ║
 * ║                                                                  ║
 * ║  Si a alguna sí quieres ponerle una frase, se escribe aquí        ║
 * ║  con su número. Lo que no pongas, se queda limpio.                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const textos = {
  /**
   * Frases por número de imagen. El número es el de `amorN.png`.
   * Ejemplo:
   *
   *     frases: {
   *       1: "aquella tarde",
   *       4: "mi favorita de todas",
   *     },
   */
  frases: {},

  /** El corazoncito que sale al tocar la foto. Ponlo a "" para quitarlo. */
  alTocar: "♥",

  /** Se susurra una sola vez, en la primera foto, para que sepa que se toca. */
  primeraVez: "tócala · pellízcala para acercarla",
};

export default textos;
