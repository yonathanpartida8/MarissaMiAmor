/**
 * SECRETPAGE — lo que sólo se ve si insistes.
 *
 * La página está a oscuras. Al apoyar el dedo se abre un círculo de luz que
 * crece mientras no lo levantes: es una linterna que hay que sostener. Si lo
 * sueltas antes de tiempo, la oscuridad vuelve a cerrarse.
 *
 * Cuando la luz llena la página, se queda encendida para siempre.
 */

import { BasePage } from "./BasePage.js";
import { Gestures } from "../core/Gestures.js";
import { el, qs, splitWords, setVars } from "../utils/dom.js";
import { clamp01, damp } from "../utils/math.js";

const HOLD_SECONDS = 2.1;

export default class SecretPage extends BasePage {
  static type = "secret";

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.secret", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent, "--r": "0", "--x": "50%", "--y": "50%" });

    this.proseEl = el("div.prose.secret__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.reveal = el("div.secret__reveal", {}, [
      el("div.secret__photo"),
      el("div.secret__content.paper", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.secret__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.secret__scroll", {}, [this.proseEl]),
      ]),
    ]);

    this.root.append(
      el("div.secret__dark", {}, [
        el("div.secret__whisper", { text: "aquí hay algo" }),
      ]),
      this.reveal,
      el("div.secret__halo"),
      el("div.secret__prompt", { text: "mantén el dedo sobre la página" })
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    const photo = this.photos[0];
    if (photo) {
      await this.ctx.assets.load(photo.src).catch(() => {});
      qs(".secret__photo", this.root).style.backgroundImage = `url("${photo.src}")`;
    }

    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.hold = 0;
    this.shown = 0;
    this.holding = false;
    this.done = this.ctx.store.hasSecret(this.entry.secret);

    // Si ya lo encontró en otra visita, la página se abre para ella sola.
    if (this.done) {
      this.hold = 1;
      this.shown = 1;
      this.#complete(false);
    }

    const setOrigin = (e) => {
      const rect = this.root.getBoundingClientRect();
      setVars(this.root, {
        "--x": `${((e.x - rect.left) / rect.width) * 100}%`,
        "--y": `${((e.y - rect.top) / rect.height) * 100}%`,
      });
    };

    this.addGestures(
      new Gestures(
        this.root,
        {
          onDown: (e) => {
            if (this.done) return;
            this.holding = true;
            setOrigin(e);
            this.ctx.haptics.play("tap");
            this.root.classList.add("is-holding");
          },
          onPan: (e) => {
            if (this.done || !this.holding) return;
            setOrigin(e);
          },
          onUp: () => {
            this.holding = false;
            this.root.classList.remove("is-holding");
          },
        },
        { exclusive: true, threshold: 999 } // nunca cede el gesto: aquí se sostiene
      )
    );

    this.addTicker((dt, time, realDt) => this.#frame(dt, realDt), 11);
  }

  #frame(dt, realDt) {
    if (this.done) return;

    const before = this.hold;
    // Sube al mantener y baja más despacio al soltar: se puede recolocar el
    // dedo sin perder todo lo ganado, pero soltar del todo sí cuesta.
    // En tiempo real: sostener la linterna dura lo mismo en cualquier móvil.
    this.hold = clamp01(this.hold + (this.holding ? realDt / HOLD_SECONDS : -realDt / 1.8));
    this.shown = damp(this.shown, this.hold, 8, dt);

    if (Math.abs(this.hold - before) > 0.0001) {
      setVars(this.root, { "--r": this.shown.toFixed(4) });
      if (this.holding && Math.random() < realDt * (3 + this.hold * 12)) {
        this.ctx.haptics.scrub(this.hold);
      }
    }

    if (this.hold >= 1) this.#complete(true);
  }

  #complete(celebrate) {
    if (this.done && celebrate) return;
    this.done = true;
    this.hold = 1;
    setVars(this.root, { "--r": "1" });
    this.root.classList.add("is-open");

    if (!celebrate) return;
    this.ctx.haptics.play("heart");
    this.ctx.audio.play("open", { volume: 0.5, rate: 1.1 });
    this.ctx.gl?.flash(0.4);
    this.proseEl.classList.add("is-writing");
    this.unlockSecret();
  }
}
