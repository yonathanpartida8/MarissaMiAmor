/**
 * HUELLA — la versión de una foto, para que nunca se vea la vieja.
 *
 * El libro guarda las fotos en el teléfono para abrir sin internet. Si él
 * sube otra con el MISMO nombre (`imagen1.png` nueva en lugar de la vieja),
 * el teléfono seguía enseñando la guardada. Ahora cada foto lleva al final
 * un trocito de su contenido (`?v=3fa2c1d0`, lo calcula
 * `herramientas/contenido.mjs`): foto nueva, dirección nueva.
 */
import contenido from "./contenido.js";

/** `ruta` sin codificar, desde la raíz: "fotos-paginas/01-portada/imagen1.png". */
export function conHuella(ruta) {
  const h = contenido?.huellas?.[String(ruta).normalize("NFC")];
  return h ? `?v=${h}` : "";
}
