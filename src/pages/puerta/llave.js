/**
 * LLAVE DE LA PUERTA — cómo sabe el libro que el candado de entrada ya se
 * abrió.
 *
 * No se guarda un «sí» a secas: se guarda una huella del código. Así, si él
 * cambia el código en `textos.js`, la huella vieja ya no coincide y el
 * candado vuelve a pedirlo; y un «true» que quedara guardado de antes (de
 * cuando se abría con la fecha) tampoco abre nada.
 */

import textos from "./textos.js";

export function huellaPuerta() {
  const s = `puerta|${String(textos.codigo || textos.fecha || "")}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `p${(h >>> 0).toString(36)}`;
}

export const puertaAbierta = (store) => store.get("puertaAbierta") === huellaPuerta();
