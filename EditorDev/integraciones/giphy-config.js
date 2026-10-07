/**
 * GIPHY YA CONFIGURADO — para que GIFs y Stickers funcionen sin hacer nada.
 *
 * Las claves de GIPHY para web son claves PÚBLICAS de cliente (así las usan
 * sus propios SDK): sólo sirven para buscar GIFs y GIPHY limita su uso. Aun
 * así, el orden de preferencia sigue siendo el más seguro posible:
 *   1. un proxy propio (herramientas/giphy-proxy/worker.js) si lo configuras,
 *   2. el servidor local (herramientas/servir.mjs con GIPHY_KEY),
 *   3. una clave pegada en este aparato (GIFs → Conectar),
 *   4. esta clave del proyecto.
 * Recomendado: en developers.giphy.com, limita esta clave a tu dominio
 * (yonathanpartida8.github.io). Para cambiarla, cambia sólo esta línea.
 */
export const CLAVE_PROYECTO = "1Gh3XaeJlqQErHqK0WofBQrUdLCSfzd3";
export const PROXY_PROYECTO = ""; // p. ej. "https://giphy-proxy.tu-cuenta.workers.dev"
