/**
 * SPARKLES — el polvo suspendido de las páginas de papel.
 *
 * La atmósfera WebGL vive detrás del libro; dentro de las páginas de papel no
 * llega. Esta capa pone unas pocas motas flotando *sobre* el papel: se ven al
 * trasluz, se mueven despacio y de vez en cuando una brilla.
 *
 * Todo va en CSS con animaciones compuestas en GPU y sin un solo frame de JS:
 * son treinta elementos que el navegador anima solo y que no cuestan nada.
 */

import { el } from "../utils/dom.js";
import { seeded } from "../utils/rng.js";

const COUNT = { low: 0, mid: 12, high: 26 };

/**
 * @param {import("../core/Context.js").Context} ctx
 * @param {object} [options]
 * @param {string} [options.seed]   misma semilla = mismas motas
 * @param {string} [options.kind]   "dust" (motas) · "hearts" (corazones muy sutiles)
 * @param {number} [options.scale]  multiplicador de cantidad
 */
export function createSparkles(ctx, { seed = "polvo", kind = "dust", scale = 1 } = {}) {
  const count = Math.round((COUNT[ctx.caps.tierName] ?? 12) * scale);
  const layer = el("div.sparkles", { "aria-hidden": "true", dataset: { kind } });

  if (!count) return { node: layer, destroy() {} };

  const rng = seeded(seed);

  for (let i = 0; i < count; i++) {
    const mote = el("i.sparkle");
    // Todo sembrado: las motas caen siempre igual, así el libro es el mismo
    // libro cada vez que se abre.
    mote.style.setProperty("--x", `${rng.range(2, 98).toFixed(2)}%`);
    mote.style.setProperty("--y", `${rng.range(2, 98).toFixed(2)}%`);
    mote.style.setProperty("--s", rng.range(0.5, 1.7).toFixed(2));
    mote.style.setProperty("--dur", `${rng.range(9, 22).toFixed(1)}s`);
    mote.style.setProperty("--delay", `${rng.range(-20, 0).toFixed(1)}s`);
    mote.style.setProperty("--drift", `${rng.range(-26, 26).toFixed(0)}px`);
    mote.style.setProperty("--rise", `${rng.range(-70, -26).toFixed(0)}px`);
    // Una de cada seis brilla de verdad; el resto son sólo presencia.
    if (rng.next() < 0.16) mote.classList.add("sparkle--bright");
    layer.append(mote);
  }

  return {
    node: layer,
    destroy() {
      layer.remove();
    },
  };
}
