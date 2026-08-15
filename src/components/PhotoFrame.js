/**
 * PHOTOFRAME — cómo se enseña una fotografía en este libro.
 *
 * Una imagen no aparece: se revela. Primero llega el marco, después el grano y
 * la luz, y al final ella, enfocándose. Una vez ahí sigue viva: se mueve un
 * poco con el dedo (la imagen y el marco a distinta velocidad, que es lo que
 * da la profundidad), tiene un brillo que recorre el cristal según cómo
 * inclines el teléfono, y se puede acercar con dos dedos.
 *
 * Lo usan casi todas las páginas que enseñan una foto. Cambiar aquí cambia el
 * libro entero, que es justo lo que se quiere.
 */

import { el, qs } from "../utils/dom.js";
import { Gestures } from "../core/Gestures.js";
import { clamp, damp, clamp01 } from "../utils/math.js";

/**
 * @param {import("../core/Context.js").Context} ctx
 * @param {object} options
 * @param {object} options.photo        { src }
 * @param {string} [options.shape]      rect · oval · circle · postcard
 * @param {string} [options.ratio]      "4 / 5", "1 / 1"…
 * @param {number} [options.parallax]   fuerza del paralaje interno (0–1)
 * @param {boolean} [options.zoomable]  permite pellizcar para acercar
 * @param {string} [options.caption]
 * @param {number} [options.delay]      retraso del revelado, en ms
 */
export function createPhotoFrame(ctx, options = {}) {
  const {
    photo = null,
    shape = "rect",
    ratio = "4 / 5",
    parallax = 1,
    zoomable = false,
    caption = "",
    delay = 0,
  } = options;

  const node = el("figure.pframe", { dataset: { shape } }, [
    el("div.pframe__shadow"),
    el("div.pframe__window", {}, [
      el("div.pframe__img"),
      el("div.pframe__grain"),
      el("div.pframe__glare"),
      el("div.pframe__vignette"),
      el("div.pframe__sheen"),
    ]),
    el("div.pframe__edge"),
    caption ? el("figcaption.pframe__caption", { text: caption }) : null,
  ]);

  node.style.setProperty("--ratio", ratio);
  node.style.setProperty("--par", String(parallax));

  const windowEl = qs(".pframe__window", node);
  const imgEl = qs(".pframe__img", node);

  // Estado del movimiento, suavizado aparte para que nada dé tirones.
  const state = {
    px: 0,
    py: 0,
    zoom: 1,
    zoomTarget: 1,
    panX: 0,
    panY: 0,
    loaded: false,
  };

  let gestures = null;

  /** Carga la imagen y lanza el revelado. */
  async function load() {
    if (!photo) return null;
    const img = await ctx.assets.load(photo.src).catch(() => null);
    if (!img) {
      node.classList.add("is-missing");
      // Si la foto es suya, esto casi siempre es una ruta mal escrita y
      // conviene decírselo con nombre y apellidos. El hueco se queda digno
      // igualmente: ella nunca ve un error, sólo un marco vacío bonito.
      if (photo.custom) {
        console.warn(
          `[mis-paginas] no se encontró la foto "${photo.src}". ` +
            `Comprueba que el archivo esté subido y que la ruta empiece por "mis-paginas/".`
        );
      }
      return null;
    }
    imgEl.style.backgroundImage = `url("${photo.src}")`;
    state.loaded = true;

    // Tres tiempos: marco → imagen velada → imagen nítida. Lo que hace que
    // parezca que se está revelando y no que simplemente ha cargado.
    setTimeout(() => node.classList.add("is-arriving"), delay);
    setTimeout(() => node.classList.add("is-revealing"), delay + 180);
    setTimeout(() => node.classList.add("is-revealed"), delay + 900);
    return img;
  }

  /** Pellizcar para acercar; al soltar vuelve solo si se quedó pequeña. */
  function enableZoom() {
    if (!zoomable) return;
    gestures = new Gestures(
      windowEl,
      {
        onPinch: ({ scale }) => {
          state.zoomTarget = clamp(scale, 1, 2.6);
          node.classList.add("is-zooming");
        },
        onPinchEnd: () => {
          // Por debajo de 1.15 no merece la pena: vuelve a su sitio.
          if (state.zoomTarget < 1.15) {
            state.zoomTarget = 1;
            state.panX = state.panY = 0;
            node.classList.remove("is-zooming");
          }
          ctx.haptics.play("tick");
        },
        onPan: (e) => {
          if (state.zoomTarget <= 1.05) return;
          // Con la imagen acercada, el arrastre la recorre en vez de pasar página.
          const limit = (state.zoom - 1) * 60;
          state.panX = clamp(state.panX + e.vx * 12, -limit, limit);
          state.panY = clamp(state.panY + e.vy * 12, -limit, limit);
        },
        onDoubleTap: () => {
          state.zoomTarget = state.zoomTarget > 1.2 ? 1 : 2;
          if (state.zoomTarget === 1) {
            state.panX = state.panY = 0;
            node.classList.remove("is-zooming");
          } else {
            node.classList.add("is-zooming");
          }
          ctx.haptics.play("tap");
        },
      },
      { pinch: true, exclusive: true, threshold: 8 }
    );
    windowEl.setAttribute("data-claim-drag", "");
  }

  /** Un frame. La llama la página que lo contenga. */
  function tick(dt, time) {
    const p = ctx.pointer.influence;
    const strength = parallax;

    state.px = damp(state.px, p.x, 3.4, dt);
    state.py = damp(state.py, p.y, 3.4, dt);
    state.zoom = damp(state.zoom, state.zoomTarget, 8, dt);

    // El marco se inclina…
    node.style.setProperty("--tilt-x", `${state.py * 4.5 * strength}deg`);
    node.style.setProperty("--tilt-y", `${state.px * 6 * strength}deg`);

    // …y la imagen se mueve dentro de él, un poco más que el marco. Esa
    // diferencia de velocidad es toda la sensación de profundidad.
    node.style.setProperty("--img-x", `${state.px * -9 * strength + state.panX}px`);
    node.style.setProperty("--img-y", `${state.py * 7 * strength + state.panY}px`);
    node.style.setProperty("--zoom", state.zoom.toFixed(3));

    // El brillo va al contrario, como una fuente de luz que no se mueve.
    node.style.setProperty("--glare-x", `${50 - state.px * 42}%`);
    node.style.setProperty("--glare-y", `${50 - state.py * 38}%`);

    // Y la sombra cae hacia donde no da la luz.
    node.style.setProperty("--sh-x", `${state.px * 10}px`);
    node.style.setProperty("--sh-y", `${6 + state.py * -6}px`);
  }

  function destroy() {
    gestures?.destroy();
    gestures = null;
  }

  enableZoom();

  return { node, load, tick, destroy, state, imgEl, windowEl };
}
