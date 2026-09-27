/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  TUS PÁGINAS                                                         ║
 * ║  Este archivo es tuyo. Añade aquí todas las páginas que quieras.     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * CÓMO SE USA
 * ───────────
 *   1. Sube tus archivos a las carpetas de al lado:
 *        mis-paginas/fotos/    → .jpg  .png  .webp
 *        mis-paginas/videos/   → .mp4  .webm
 *   2. Añade una entrada a la lista de abajo.
 *   3. Sube los cambios. Ya está: la página aparece en el libro, en el
 *      índice y en el contador de progreso, sin tocar nada más.
 *
 * No hay que compilar ni instalar nada.
 *
 *
 * TIPOS DE PÁGINA
 * ───────────────
 *   "foto"      una imagen a pantalla completa con su texto encima
 *   "galeria"   varias imágenes que se pasan deslizando
 *   "video"     un vídeo que se toca para reproducir
 *   "carta"     sólo texto, sobre papel
 *
 *   Y si te quedas con ganas, también valen los tipos del libro:
 *   "polaroids", "mosaico", "rascar", "postal", "secreto", "escrito"…
 *   (la lista completa está en el README de esta carpeta)
 *
 *
 * CAMPOS
 * ──────
 *   tipo      cuál de los de arriba. Si no lo pones, se deduce solo.
 *   titulo    el título grande
 *   arriba    la línea pequeña de encima del título   (opcional)
 *   texto     el cuerpo                               (opcional)
 *   foto      "mis-paginas/fotos/loquesea.jpg"        (o varias, en lista)
 *   video     "mis-paginas/videos/loquesea.mp4"
 *   poster    imagen fija del vídeo antes de darle    (opcional)
 *   frases    lista de frases sueltas que se descubren tocando (opcional)
 *   secreto   texto que aparece al resolver la página (opcional)
 *   color     color de acento, ej. "#ec6f92"          (opcional)
 *   donde     "final" (por defecto) · "inicio" · o el número de página
 *
 * Sólo `titulo` es obligatorio. Todo lo demás puede faltar.
 *
 *
 * ────────────────────────────────────────────────────────────────────────
 * Borra las barras `//` de un bloque para activarlo, cambia lo que quieras
 * y listo. Los ejemplos están escritos para que funcionen tal cual (usan
 * imágenes que ya están en el libro), así puedes probar antes de subir
 * nada tuyo.
 * ────────────────────────────────────────────────────────────────────────
 */

export default [
  // ── EJEMPLO 1 · una foto con su texto ───────────────────────────────
  // {
  //   tipo: "foto",
  //   arriba: "el día que",
  //   titulo: "Aquella tarde",
  //   texto: "Lo que quieras contar de esta foto. Puede ser una línea o diez.",
  //   foto: "mis-paginas/fotos/mi-foto.jpg",
  //   color: "#ec6f92",
  // },

  // ── EJEMPLO 2 · varias fotos que se pasan deslizando ────────────────
  // {
  //   tipo: "galeria",
  //   titulo: "Aquel fin de semana",
  //   texto: "Un par de líneas y ya.",
  //   foto: [
  //     "mis-paginas/fotos/uno.jpg",
  //     "mis-paginas/fotos/dos.jpg",
  //     "mis-paginas/fotos/tres.jpg",
  //   ],
  // },

  // ── EJEMPLO 3 · un vídeo ────────────────────────────────────────────
  // {
  //   tipo: "video",
  //   arriba: "dale al play",
  //   titulo: "Esto lo grabé para ti",
  //   texto: "Sube el volumen.",
  //   video: "mis-paginas/videos/VID-20260915-WA0017.mp4",
  //   poster: "mis-paginas/fotos/portada-del-video.jpg",
  // },

  // ── EJEMPLO 4 · sólo texto ──────────────────────────────────────────
  // {
  //   tipo: "carta",
  //   arriba: "sin más",
  //   titulo: "Se me olvidaba",
  //   texto: "Una carta que se te ocurrió después y quieres meter aquí.",
  //   donde: "final",
  // },

  // ── EJEMPLO 5 · polaroids con frases detrás ─────────────────────────
  // {
  //   tipo: "polaroids",
  //   titulo: "Un puñado de recuerdos",
  //   texto: "Muévelas. Tócalas dos veces para ver el reverso.",
  //   foto: [
  //     "mis-paginas/fotos/a.jpg",
  //     "mis-paginas/fotos/b.jpg",
  //     "mis-paginas/fotos/c.jpg",
  //   ],
  //   frases: ["esta me encanta", "acuérdate de este día", "mírate"],
  // },
];
