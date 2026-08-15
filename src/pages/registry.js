/**
 * REGISTRO DE PÁGINAS — la tabla de tipos.
 *
 * Cada tipo de experiencia se importa de forma perezosa: el módulo de la
 * constelación no se descarga hasta que hace falta. En un móvil con datos
 * limitados eso es la diferencia entre abrir el libro en un segundo o en seis.
 */

const loaders = {
  cover: () => import("./CoverPage.js"),
  envelope: () => import("./EnvelopePage.js"),
  chapter: () => import("./ChapterPage.js"),
  depth: () => import("./DepthPage.js"),
  scratch: () => import("./ScratchPage.js"),
  polaroids: () => import("./PolaroidsPage.js"),
  veil: () => import("./VeilPage.js"),
  filmstrip: () => import("./FilmstripPage.js"),
  handwriting: () => import("./HandwritingPage.js"),
  memoryfield: () => import("./MemoryFieldPage.js"),
  secret: () => import("./SecretPage.js"),
  constellation: () => import("./ConstellationPage.js"),
  finale: () => import("./FinalePage.js"),

  // ── Añadidos en la segunda edición ──────────────────────
  typewriter: () => import("./TypewriterPage.js"),
  postcard: () => import("./PostcardPage.js"),
  petals: () => import("./PetalsPage.js"),
  mosaic: () => import("./MosaicPage.js"),
  lock: () => import("./LockPage.js"),
  bottle: () => import("./BottlePage.js"),
  gift: () => import("./GiftPage.js"),
  pulse: () => import("./PulsePage.js"),
  orbit: () => import("./OrbitPage.js"),

  // ── Para las páginas de `mis-paginas/` ──────────────────
  photo: () => import("./PhotoPage.js"),
  gallery: () => import("./GalleryPage.js"),
  video: () => import("./VideoPage.js"),
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

export const knownTypes = Object.keys(loaders);
