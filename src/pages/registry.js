/**
 * REGISTRO DE PÁGINAS — la tabla de tipos.
 *
 * Cada página vive en su propia carpeta, con TODO lo suyo dentro:
 *
 *     src/pages/combinacion/
 *         index.js     la lógica y el DOM
 *         textos.js    lo que dice  ← lo único que hay que tocar para cambiarlo
 *         estilos.css  cómo se ve
 *
 * Para cambiar lo que dice una página no hace falta abrir su código: se abre
 * su `textos.js` y ya. Para añadir un tipo nuevo, se crea una carpeta más y
 * se pone una línea en la tabla de abajo.
 *
 * Cada tipo de experiencia se importa de forma perezosa: el módulo de la
 * constelación no se descarga hasta que hace falta. En un móvil con datos
 * limitados eso es la diferencia entre abrir el libro en un segundo o en seis.
 */

const loaders = {
  cover: () => import("./portada/index.js"),
  envelope: () => import("./sobre/index.js"),
  chapter: () => import("./capitulo/index.js"),
  depth: () => import("./profundidad/index.js"),
  scratch: () => import("./rascar/index.js"),
  polaroids: () => import("./polaroids/index.js"),
  veil: () => import("./velo/index.js"),
  filmstrip: () => import("./carrete/index.js"),
  handwriting: () => import("./escrito/index.js"),
  memoryfield: () => import("./recuerdos/index.js"),
  secret: () => import("./secreto/index.js"),
  constellation: () => import("./constelacion/index.js"),
  finale: () => import("./final/index.js"),

  // ── Añadidos en la segunda edición ──────────────────────
  typewriter: () => import("./maquina/index.js"),
  postcard: () => import("./postal/index.js"),
  petals: () => import("./petalos/index.js"),
  mosaic: () => import("./mosaico/index.js"),
  lock: () => import("./combinacion/index.js"),
  puerta: () => import("./puerta/index.js"),
  razones: () => import("./razones/index.js"),
  burbujas: () => import("./burbujas/index.js"),
  frasco: () => import("./frasco/index.js"),
  cupones: () => import("./cupones/index.js"),
  manos: () => import("./manos/index.js"),
  farolitos: () => import("./farolitos/index.js"),
  relojes: () => import("./relojes/index.js"),
  huellas: () => import("./huellas/index.js"),
  faro: () => import("./faro/index.js"),
  promesas: () => import("./promesas/index.js"),
  undia: () => import("./un-dia/index.js"),
  bottle: () => import("./botella/index.js"),
  gift: () => import("./regalo/index.js"),
  pulse: () => import("./pulso/index.js"),
  orbit: () => import("./distancia/index.js"),
  sorpresa: () => import("./ultima-sorpresa/index.js"),

  // ── Para las páginas de `mis-paginas/` ──────────────────
  photo: () => import("./foto/index.js"),
  gallery: () => import("./galeria/index.js"),
  video: () => import("./video/index.js"),

  // ── Las que salen solas de `paginas-html/` ──────────────
  html: () => import("./html/index.js"),

  // ── Las que salen solas de `images/amores/` ─────────────
  amor: () => import("./amor/index.js"),
};

const cache = new Map();

/**
 * Devuelve la clase de página para un tipo.
 * @param {keyof typeof loaders} type
 */
export async function resolvePage(type) {
  if (cache.has(type)) return cache.get(type);

  const load = loaders[type];
  if (!load) throw new Error(`[registry] tipo de página desconocido: "${type}"`);

  const mod = await load();
  const PageClass = mod.default;
  if (!PageClass) throw new Error(`[registry] "${type}" no exporta una página por defecto`);

  cache.set(type, PageClass);
  return PageClass;
}

/** Descarga por adelantado el módulo de un tipo, sin instanciar nada. */
export function warmup(type) {
  if (cache.has(type) || !loaders[type]) return;
  loaders[type]().then((mod) => cache.set(type, mod.default)).catch(() => {});
}

