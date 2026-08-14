/**
 * BOTTLEPAGE — el mensaje en la botella.
 *
 * La botella flota, se mece con el oleaje y responde a la inclinación del
 * teléfono. Hay que sacarle el corcho tirando de él hacia arriba; entonces el
 * papel enrollado sale y se desenrolla en el aire hasta ocupar la página.
 *
 * El mar son dos capas de olas en SVG a distinta velocidad. Cuesta menos que
 * un shader y, a este tamaño, se ve igual de bien.
 */

import { BasePage } from "./BasePage.js";
import { Gestures } from "../core/Gestures.js";
import { createSparkles } from "../components/Sparkles.js";
import { el, splitWords, setVars, wait } from "../utils/dom.js";
import { clamp01, damp } from "../utils/math.js";

const CORK_DISTANCE = 68;

export default class BottlePage extends BasePage {
  static type = "bottle";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.bottle", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a, "--pull": "0" });

    // ---- La carta que va dentro ---------------------------------------
    this.proseEl = el("div.bot__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.scroll = el("article.bot__scroll.paper.paper--aged", {}, [
      el("div.bot__roll.bot__roll--top"),
      el("div.bot__inner", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.bot__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.bot__read", {}, [this.proseEl]),
        el("div.bot__sign", { text: "— llegó, al final" }),
      ]),
      el("div.bot__roll.bot__roll--bottom"),
    ]);

    // ---- La botella -----------------------------------------------------
    this.cork = el("button.bot__cork", {
      type: "button",
      "data-claim-drag": "",
      "aria-label": "Tira del corcho hacia arriba",
    });

    this.bottle = el("div.bot__bottle", {}, [
      el("div.bot__glass", {}, [
        el("div.bot__paper"),
        el("div.bot__shine"),
        el("div.bot__water"),
      ]),
      el("div.bot__neck"),
      this.cork,
    ]);

    // ---- El mar ---------------------------------------------------------
    const wave = (cls) =>
      el("div", { class: `bot__wave ${cls}`, html:
        `<svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
           <path d="M0,60 C150,110 350,10 600,60 C850,110 1050,10 1200,60 L1200,120 L0,120 Z"/>
         </svg>` });

    this.sparkles = createSparkles(this.ctx, { seed: `bot-${this.id}`, scale: 0.8 });

    this.root.append(
      el("div.bot__sea", {}, [wave("bot__wave--back"), wave("bot__wave--mid"), wave("bot__wave--front")]),
      el("div.bot__stage", {}, [this.bottle]),
      this.scroll,
      el("p.bot__prompt", { text: "tira del corcho" }),
      this.sparkles.node
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.pull = 0;
    this.opened = false;
    this.bob = 0;

    this.addGestures(
      new Gestures(
        this.cork,
        {
          onPan: (e) => {
            if (this.opened) return;
            // Sólo cuenta tirar hacia arriba.
            this.pull = clamp01(Math.max(0, -e.dy) / CORK_DISTANCE);
            setVars(this.root, { "--pull": this.pull.toFixed(3) });
            if (Math.random() < 0.3) this.ctx.haptics.scrub(this.pull);
            if (this.pull >= 1) this.#uncork();
          },
          onPanEnd: () => {
            if (this.opened) return;
            this.pull = 0;
            setVars(this.root, { "--pull": "0" });
            this.ctx.haptics.play("tick");
          },
          onTap: () => {
            if (this.opened) return;
            this.cork.classList.remove("is-nudge");
            void this.cork.offsetWidth;
            this.cork.classList.add("is-nudge");
            this.ctx.ui?.showHint("hacia arriba, con fuerza");
          },
        },
        { axis: "y", exclusive: true, threshold: 4 }
      )
    );

    this.addTicker((dt, time) => this.#frame(dt, time), 11);
  }

  #frame(dt, time) {
    if (this.opened) return;

    // La botella se mece: dos senos a distinta frecuencia para que no se note
    // el bucle, más la inclinación del teléfono.
    const tilt = this.ctx.pointer.tiltSmooth;
    this.bob = damp(this.bob, tilt.x, 2.2, dt);

    const sway = Math.sin(time * 0.9) * 4 + Math.sin(time * 0.37) * 2.4;
    const rise = Math.sin(time * 1.15 + 0.6) * 5;

    setVars(this.bottle, {
      "--sway": `${sway + this.bob * 9}deg`,
      "--rise": `${rise}px`,
    });
  }

  async #uncork() {
    if (this.opened) return;
    this.opened = true;

    this.ctx.haptics.play("open");
    this.ctx.audio.play("open", { volume: 0.55 });
    this.ctx.audio.duck(0.45, 6000);
    this.ctx.gl?.pulse(0.7);

    this.root.classList.add("is-uncorked");
    await wait(560);

    // El papel sale…
    this.root.classList.add("is-out");
    this.ctx.haptics.play("reveal");
    await wait(680);

    // …y se desenrolla.
    this.root.classList.add("is-unrolled");
    await wait(720);

    this.proseEl.classList.add("is-writing");
    this.root.classList.add("is-reading");
    this.unlockSecret();
  }

  destroy() {
    this.sparkles?.destroy();
    super.destroy();
  }
}
