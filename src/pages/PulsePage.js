/**
 * PULSEPAGE — pon el dedo aquí.
 *
 * Mientras se mantiene el dedo sobre la almohadilla, una línea de pulso avanza
 * por la pantalla dibujándose sola, con su vibración en cada latido. Al llegar
 * al final del recorrido aparece la frase.
 *
 * Si se levanta el dedo, la línea se queda donde estaba y se apaga poco a
 * poco: no se pierde lo avanzado, pero hay que volver a poner el dedo. Está
 * hecho así a propósito: la página trata de sostener algo.
 */

import { BasePage } from "./BasePage.js";
import { Gestures } from "../core/Gestures.js";
import { el, setVars, wait } from "../utils/dom.js";
import { clamp01, damp } from "../utils/math.js";

const BEATS_NEEDED = 7;
const BPM = 68;

export default class PulsePage extends BasePage {
  static type = "pulse";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.pulse", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a, "--beat": "0", "--on": "0" });

    this.canvas = el("canvas.pulse__trace", { "aria-hidden": "true" });

    this.pad = el("button.pulse__pad", {
      type: "button",
      "data-claim-drag": "",
      "aria-label": "Mantén el dedo para tomar el pulso",
    }, [
      el("span.pulse__ring"),
      el("span.pulse__ring.pulse__ring--2"),
      el("span.pulse__finger"),
      el("span.pulse__bpm", { text: "—" }),
    ]);

    this.revealEl = el("p.pulse__reveal", { text: ch?.reveal || "" });

    this.root.append(
      el("header.pulse__head", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.pulse__title", { text: ch?.title || "" }),
      ]),
      el("div.pulse__monitor", {}, [this.canvas, el("div.pulse__grid")]),
      el("p.pulse__text", { text: ch?.text || "" }),
      this.pad,
      this.revealEl
    );

    this.bpmEl = this.pad.querySelector(".pulse__bpm");
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.ctx2d = this.canvas.getContext("2d");
    this.holding = false;
    this.beats = 0;
    this.phase = 0;
    this.x = 0;
    this.glow = 0;
    this.done = this.ctx.store.hasSecret(this.entry.secret);

    this.#resize();
    this.track(this.ctx.viewport.on("resize", () => this.#resize()));

    if (this.done) {
      this.#finish(false);
    } else {
      this.addGestures(
        new Gestures(
          this.pad,
          {
            onDown: () => {
              this.holding = true;
              this.root.classList.add("is-holding");
              this.ctx.haptics.play("tap");
            },
            onUp: () => {
              this.holding = false;
              this.root.classList.remove("is-holding");
            },
          },
          { exclusive: true, threshold: 999 }
        )
      );
    }

    this.addTicker((dt, time, realDt) => this.#frame(realDt ?? dt, time), 11);
  }

  #resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
    this.x = 0;
    this.ctx2d.clearRect(0, 0, this.w, this.h);
  }

  /**
   * Forma de onda de un latido, normalizada de 0 a 1.
   * No es un electrocardiograma de verdad, pero tiene sus tres golpes y se
   * reconoce al instante, que es lo único que hace falta aquí.
   */
  #wave(t) {
    if (t < 0.10) return Math.sin(t / 0.10 * Math.PI) * 0.14;        // P
    if (t < 0.16) return -(t - 0.10) / 0.06 * 0.22;                   // Q
    if (t < 0.21) return -0.22 + (t - 0.16) / 0.05 * 1.22;            // R
    if (t < 0.27) return 1.0 - (t - 0.21) / 0.06 * 1.34;              // S
    if (t < 0.34) return -0.34 + (t - 0.27) / 0.07 * 0.34;
    if (t < 0.52) return Math.sin((t - 0.34) / 0.18 * Math.PI) * 0.3; // T
    return 0;
  }

  #frame(dt, time) {
    if (!this.w) return;

    // La aguja avanza sólo mientras hay dedo.
    const speed = this.holding ? this.w / (60 / BPM) / 3.2 : 0;
    this.glow = damp(this.glow, this.holding ? 1 : 0, 4, dt);
    setVars(this.root, { "--on": this.glow.toFixed(3) });

    if (!this.holding || this.done) {
      // Sin dedo, el trazo se desvanece despacio en vez de borrarse de golpe.
      if (this.glow > 0.01) this.#fade(dt);
      return;
    }

    const prevPhase = this.phase;
    this.phase += (dt * BPM) / 60;

    // Cada vez que la fase cruza un entero, hay un latido.
    if (Math.floor(this.phase) > Math.floor(prevPhase)) {
      this.beats++;
      this.ctx.haptics.play("heart");
      this.ctx.audio.play("turn", { volume: 0.12, rate: 0.55 });
      this.bpmEl.textContent = `${BPM + Math.round(Math.sin(this.beats) * 3)}`;
      setVars(this.root, { "--beat": "1" });
      setTimeout(() => setVars(this.root, { "--beat": "0" }), 140);
      if (this.beats >= BEATS_NEEDED) this.#finish(true);
    }

    this.#draw(speed * dt);
  }

  /** Dibuja el tramo recorrido en este frame. */
  #draw(advance) {
    const ctx = this.ctx2d;
    const mid = this.h * 0.55;
    const amp = this.h * 0.34;
    const steps = Math.max(1, Math.ceil(advance));

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = this.palette.a;
    ctx.shadowColor = this.palette.a;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = this.x + (advance * i) / steps;
      const t = ((x / this.w) * 3.2) % 1;
      const y = mid - this.#wave(t) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.x += advance;
    if (this.x >= this.w) {
      this.x = 0;
      ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  /** Atenúa lo dibujado pintando un velo casi transparente encima. */
  #fade(dt) {
    const ctx = this.ctx2d;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.5, dt * 1.6)})`;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "source-over";
  }

  async #finish(celebrate) {
    if (this.finished) return;
    this.finished = true;
    this.done = true;
    this.holding = false;
    this.root.classList.remove("is-holding");
    this.root.classList.add("is-read");

    if (!celebrate) return;
    this.ctx.haptics.play("heart");
    this.ctx.gl?.pulse(0.9);
    await wait(420);
    this.root.classList.add("is-said");
    this.unlockSecret();
  }
}
