/**
 * TYPEWRITERPAGE — la carta que se escribe sola.
 *
 * El texto va apareciendo letra a letra, con el ritmo desigual de alguien que
 * está pensando: se detiene en las comas, respira en los puntos y de vez en
 * cuando duda antes de una palabra. Si se mantiene el dedo, escribe más
 * rápido; al soltar, vuelve a su ritmo.
 *
 * No es un efecto decorativo: leer a la velocidad a la que alguien escribe es
 * una forma distinta de leer, y es la que le va a esta página.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createSparkles } from "../../components/Sparkles.js";
import { el, setVars } from "../../utils/dom.js";

/** Milisegundos por carácter, según lo que acabe de escribir. */
const PAUSE = {
  base: 34,
  ",": 210,
  ";": 240,
  ":": 240,
  ".": 420,
  "…": 520,
  "?": 420,
  "!": 420,
};

export default class TypewriterPage extends BasePage {
  static type = "typewriter";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.paper.tw", {
      "data-page": this.id,
      "aria-label": ch?.title,
    });
    setVars(this.root, {
      "--accent": this.palette.a,
      "--drop-color": this.palette.a,
      "--accent-line": this.palette.a,
    });

    this.textEl = el("p.tw__text");
    this.cursorEl = el("span.tw__cursor");
    this.textEl.append(this.cursorEl);

    this.sparkles = createSparkles(this.ctx, { seed: `tw-${this.id}`, scale: 0.7 });

    this.root.append(
      el("header.tw__head.entra--teclea", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.tw__title", { text: ch?.title || "" }),
      ]),
      el("div.tw__sheet", { "data-claim-drag": "" }, [this.textEl]),
      el("div.tw__foot", {}, [
        el("span.tw__hint", { text: "mantén pulsado para ir más rápido" }),
      ]),
      this.sparkles.node
    );

    // Texto accesible completo desde el principio: un lector de pantalla no
    // tiene por qué esperar a que termine la animación.
    this.textEl.setAttribute("aria-label", ch?.text || "");
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.full = this.chapter?.text || "";
    this.at = 0;
    this.wait = 620; // un respiro antes de la primera letra
    this.fast = false;
    this.done = false;

    this.addGestures(
      new Gestures(
        this.root,
        {
          onDown: () => {
            if (this.done) return;
            this.fast = true;
            this.root.classList.add("is-fast");
          },
          onUp: () => {
            this.fast = false;
            this.root.classList.remove("is-fast");
          },
          onTap: () => {
            // Un toque cuando ya terminó: se relee desde el principio.
            if (this.done) this.#restart();
          },
        },
        { exclusive: true, threshold: 999 }
      )
    );

    this.addTicker((dt, time, realDt) => this.#frame(realDt ?? dt), 11);
  }

  #frame(dt) {
    if (this.done) return;

    this.wait -= dt * 1000 * (this.fast ? 4.5 : 1);
    if (this.wait > 0) return;

    // Puede tocar escribir varias letras en un mismo frame si el aparato va
    // lento o si está acelerando: se recuperan aquí, sin perder ritmo.
    let guard = 0;
    while (this.wait <= 0 && this.at < this.full.length && guard++ < 40) {
      const char = this.full[this.at++];
      this.cursorEl.before(document.createTextNode(char));

      const pause = PAUSE[char] ?? PAUSE.base;
      // Irregularidad humana: nadie teclea a intervalos exactos.
      const jitter = 0.7 + Math.random() * 0.7;
      this.wait += pause * jitter * (this.fast ? 0.22 : 1);

      if (char !== " " && Math.random() < 0.22) this.ctx.haptics.scrub(0.2);
      if (char === "." || char === "…") this.ctx.audio.play("turn", { volume: 0.1, rate: 1.9 });
    }

    if (this.at >= this.full.length) this.#finish();
  }

  #finish() {
    this.done = true;
    this.root.classList.add("is-done");
    this.ctx.haptics.play("reveal");
    this.ctx.gl?.pulse(0.35);
    this.unlockSecret();
  }

  #restart() {
    this.textEl.textContent = "";
    this.textEl.append(this.cursorEl);
    this.at = 0;
    this.wait = 260;
    this.done = false;
    this.root.classList.remove("is-done");
    this.ctx.haptics.play("tap");
  }

  destroy() {
    this.sparkles?.destroy();
    super.destroy();
  }
}
