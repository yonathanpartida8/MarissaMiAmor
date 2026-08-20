/**
 * HANDWRITINGPAGE — la carta que se escribe delante de ella.
 *
 * La página llega en blanco, con la pluma esperando arriba. Arrastrando hacia
 * abajo, la tinta va apareciendo línea a línea y la plumilla avanza escribiendo,
 * con su temblor y su rasgueo. Si suelta a medias, la tinta se queda donde
 * estaba: la carta está a medio escribir hasta que ella decida terminarla.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, qs, setVars } from "../../utils/dom.js";
import { clamp01, damp } from "../../utils/math.js";

export default class HandwritingPage extends BasePage {
  static type = "handwriting";

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.paper.hw", {
      "data-page": this.id,
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent, "--w": "0" });

    this.textEl = el("div.hw__text.selectable", { text: ch?.text || "" });

    this.nib = el("div.hw__nib", {}, [
      el("div.hw__nibtip"),
      el("div.hw__nibglow"),
    ]);

    this.root.append(
      el("header.hw__head", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.hw__title", { text: ch?.title || "" }),
      ]),
      el("div.hw__sheet", { "data-claim-drag": "" }, [
        el("div.hw__rules"),
        this.textEl,
        this.nib,
      ]),
      el("div.hw__sign.signature", { text: "te amo, mi amorcito" }),
      el("div.hw__prompt", { text: "arrastra hacia abajo" })
    );

    this.sheet = qs(".hw__sheet", this.root);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.written = 0;      // 0..1 escrito de verdad
    this.display = 0;      // versión suavizada, la que se pinta
    this.startWritten = 0;
    this.finished = false;

    this.addGestures(
      new Gestures(
        this.sheet,
        {
          onPanStart: () => {
            this.startWritten = this.written;
            this.root.classList.add("is-writing-now");
          },
          onPan: (e) => {
            const height = this.sheet.clientHeight || 1;
            // Sólo se escribe hacia abajo; hacia arriba no se borra.
            const gained = Math.max(0, e.dy) / (height * 0.9);
            const next = clamp01(this.startWritten + gained);
            if (next > this.written) {
              // Rasgueo: vibración proporcional a lo rápido que escribe.
              if (Math.random() < 0.4) this.ctx.haptics.scrub(Math.min(1, Math.abs(e.vy) * 3));
              this.written = next;
            }
          },
          onPanEnd: () => {
            this.root.classList.remove("is-writing-now");
            if (this.written >= 0.985) this.#finish();
          },
          onTap: () => {
            if (this.finished) return;
            this.ctx.ui?.showHint("arrastra hacia abajo, despacio");
            this.ctx.haptics.play("tick");
          },
        },
        { axis: "y", exclusive: true, threshold: 6 }
      )
    );

    this.addTicker((dt, t) => this.#frame(dt, t), 11);
  }

  #frame(dt, time) {
    const before = this.display;
    this.display = damp(this.display, this.written, 9, dt);
    if (Math.abs(this.display - before) < 0.0002 && this.finished) return;

    setVars(this.root, { "--w": this.display.toFixed(4) });

    // La plumilla no va recta: escribe, y escribir tiembla.
    const wobble = Math.sin(time * 22) * 3.5 + Math.sin(time * 9.3) * 2;
    const drift = Math.sin(this.display * 34) * 26;
    setVars(this.nib, {
      "--nib-x": `${(drift + wobble).toFixed(1)}px`,
      "--nib-tilt": `${(-28 + wobble * 0.6).toFixed(2)}deg`,
    });

    if (this.display >= 0.99 && !this.finished) this.#finish();
  }

  #finish() {
    if (this.finished) return;
    this.finished = true;
    this.written = 1;
    this.root.classList.add("is-finished");
    this.ctx.haptics.play("heart");
    this.ctx.audio.play("turn", { volume: 0.3, rate: 1.1 });
    this.ctx.gl?.pulse(0.6);
    this.unlockSecret();
  }
}
