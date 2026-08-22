/**
 * SCRATCHPAGE — hay algo debajo.
 *
 * La página llega con una lámina plateada encima y nada más. No dice qué
 * hacer: primero se le deja el momento de "¿y ahora qué?". Al pasar el dedo
 * sale la primera raya y, a partir de ahí, ya no hace falta explicar nada.
 *
 * Cuando queda medio descubierta, la lámina se disuelve sola y aparece el
 * texto: recompensa clara por haber hecho el gesto.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { ScratchSurface, silverLayer } from "../../components/ScratchSurface.js";
import { el, qs, splitWords, setVars } from "../../utils/dom.js";

export default class ScratchPage extends BasePage {
  static type = "scratch";

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.paper.scratch", {
      "data-page": this.id,
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent, "--drop-color": accent, "--accent-line": accent });

    this.plate = el("div.scratch__plate", { "data-claim-drag": "" }, [
      el("div.scratch__photo"),
      el("div.scratch__frame"),
      el("canvas.scratch__canvas"),
      el("div.scratch__dust"),
    ]);

    this.proseEl = el("div.prose.scratch__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.body = el("div.scratch__body.hueco-barra", {}, [
      el("h2.title.scratch__title", { text: ch?.title || "" }),
      el("hr.rule"),
      el("div.lectura.scratch__scroll", {}, [this.proseEl]),
    ]);

    this.root.append(
      el("header.scratch__head.entra--enfoca", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
      ]),
      this.plate,
      this.body
    );

    this.canvas = qs(".scratch__canvas", this.plate);
    this.photoEl = qs(".scratch__photo", this.plate);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    const photo = this.photos[0];
    if (photo) {
      await this.ctx.assets.load(photo.src).catch(() => {});
      this.photoEl.style.backgroundImage = `url("${photo.src}")`;
    }

    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.surface = new ScratchSurface(this.canvas, {
      paint: silverLayer(this.palette.a),
      brush: 34,
      threshold: 0.5,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      onProgress: (p) => {
        setVars(this.root, { "--revealed": String(p) });
        this.ctx.haptics.scrub(0.35 + p * 0.4);
        if (p > 0.02 && !this.started) {
          this.started = true;
          this.ctx.audio.play("turn", { volume: 0.25, rate: 1.6 });
        }
      },
      onComplete: () => this.#reveal(),
    });

    // El canvas necesita medidas reales, y sólo las hay tras el layout.
    this.#resize();
    this.track(this.ctx.viewport.on("resize", () => this.#resize()));

    const toLocal = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.x - rect.left, y: e.y - rect.top };
    };

    this.addGestures(
      new Gestures(
        this.plate,
        {
          onDown: (e) => {
            const p = toLocal(e);
            this.surface.scratch(p.x, p.y);
          },
          onPan: (e) => {
            const p = toLocal(e);
            this.surface.scratch(p.x, p.y, Math.min(1, Math.hypot(e.vx, e.vy) * 2.5));
          },
          onPanEnd: () => this.surface.lift(),
          onUp: () => this.surface.lift(),
        },
        { exclusive: true, threshold: 2 }
      )
    );
  }

  #resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width && rect.height) this.surface?.resize(rect.width, rect.height);
  }

  async #reveal() {
    if (this.revealed) return;
    this.revealed = true;

    this.ctx.haptics.play("reveal");
    this.ctx.audio.play("turn", { volume: 0.4, rate: 1.2 });
    this.ctx.gl?.pulse(0.7);

    await this.surface.dissolve(760);
    this.root.classList.add("is-revealed");
    this.proseEl.classList.add("is-writing");
    this.unlockSecret();
  }

  destroy() {
    this.surface = null;
    super.destroy();
  }
}
