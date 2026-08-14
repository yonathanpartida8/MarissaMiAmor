/**
 * Aleatoriedad *reproducible*: las polaroids caen siempre en el mismo sitio,
 * las estrellas siempre forman el mismo cielo. Un libro debe ser el mismo
 * libro cada vez que se abre.
 */

/** Mulberry32: rápido, minúsculo, calidad de sobra para dispersión visual. */
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convierte un texto en semilla numérica estable (djb2). */
export function hashSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Generador con utilidades encima. */
export function seeded(seedSource = 1) {
  const rng = createRng(typeof seedSource === "string" ? hashSeed(seedSource) : seedSource);
  return {
    next: rng,
    range: (min, max) => min + rng() * (max - min),
    int: (min, max) => Math.floor(min + rng() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(rng() * arr.length)],
    sign: () => (rng() < 0.5 ? -1 : 1),
    /** Barajado Fisher–Yates sobre una copia. */
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}
