/**
 * LOCKPAGE — la caja con combinación.
 *
 * Cuatro ruedas que se giran con el dedo, con topes que se notan uno a uno. Si
 * la combinación es la correcta se abre; si no, la caja se sacude y no pasa
 * nada malo. A la tercera equivocación aparece la pista, y a la sexta la caja
 * cede sola: esto es un regalo, no un examen.
 *
 * La combinación se escribe en chapters.js (campo `combination`), para que
 * cambiarla no obligue a tocar una línea de código.
 */

import { BasePage } from "./BasePage.js";
import { Gestures } from "../core/Gestures.js";
import { createPhotoFrame } from "../components/PhotoFrame.js";
import { el, setVars, wait } from "../utils/dom.js";
import { clamp, damp } from "../utils/math.js";

const WHEEL_STEP = 42; // px de arrastre por dígito

export default class LockPage extends BasePage {
  static type = "lock";

  build() {
    const ch = this.chapter;
    this.code = String(ch?.combination ?? "0000").split("").map(Number);

    this.root = el("section.page.lock", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // ---- Las ruedas -----------------------------------------------------
    this.wheels = this.code.map((_, i) => {
      const wheel = el("div.lock__wheel", {
        "data-claim-drag": "",
        role: "spinbutton",
        "aria-label": `Rueda ${i + 1}`,
        "aria-valuemin": "0",
        "aria-valuemax": "9",
      });
      const strip = el("div.lock__strip");
      // 0–9 repetidos: la rueda gira sin fin sin costuras visibles.
      for (let r = 0; r < 3; r++) {
        for (let d = 0; d < 10; d++) strip.append(el("span.lock__digit", { text: String(d) }));
      }
      wheel.append(strip, el("div.lock__gloss"));
      return { node: wheel, strip, value: 0, offset: 0, target: 0, index: i };
    });

    this.dial = el("div.lock__dial", {}, this.wheels.map((w) => w.node));

    // ---- Lo que hay dentro ---------------------------------------------
    this.frame = createPhotoFrame(this.ctx, {
      photo: this.photos[0] || null,
      shape: "rect",
      ratio: "4 / 5",
      parallax: 0.9,
      zoomable: true,
    });

    this.inside = el("div.lock__inside", {}, [
      this.frame.node,
      el("div.lock__note.paper.paper--aged", {}, [
        el("h2.lock__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("p.lock__text", { text: ch?.text || "" }),
        ch?.reveal ? el("p.lock__reveal", { text: ch.reveal }) : null,
      ]),
    ]);

    this.hintEl = el("p.lock__hint");
    this.box = el("div.lock__box", {}, [
      el("div.lock__lid", {}, [
        el("span.lock__label", { text: ch?.kicker || "" }),
        this.dial,
        el("div.lock__shackle"),
      ]),
    ]);

    this.root.append(
      el("div.lock__stage", {}, [this.box, this.inside]),
      this.hintEl
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.attempts = 0;
    this.opened = false;
    // Si ya lo abrió en otra visita, no la obligamos a repetirlo.
    if (this.ctx.store.hasSecret(this.entry.secret)) {
      this.#open(false);
      return;
    }

    for (const wheel of this.wheels) this.#bind(wheel);
    this.addTicker((dt, time) => this.#frame(dt, time), 11);
  }

  #bind(wheel) {
    let startOffset = 0;
    let lastNotch = 0;

    this.addGestures(
      new Gestures(
        wheel.node,
        {
          onPanStart: () => {
            startOffset = wheel.offset;
            lastNotch = Math.round(wheel.offset);
            wheel.node.classList.add("is-turning");
          },
          onPan: (e) => {
            wheel.offset = startOffset - e.dy / WHEEL_STEP;
            const notch = Math.round(wheel.offset);
            if (notch !== lastNotch) {
              lastNotch = notch;
              // Un tope por dígito: la rueda se siente mecánica.
              this.ctx.haptics.play("tick");
              this.ctx.audio.play("turn", { volume: 0.1, rate: 2.2 });
            }
          },
          onPanEnd: (e) => {
            wheel.node.classList.remove("is-turning");
            // Se imanta al dígito más cercano. La inercia suma, pero poco y
            // acotada: con un multiplicador alto, un giro corto y decidido se
            // pasaba siempre un dígito y la combinación era imposible de acertar.
            const fling = clamp(-e.vy * 0.45, -2, 2);
            wheel.target = Math.round(wheel.offset + fling);
            this.#check();
          },
          onTap: () => {
            wheel.target = Math.round(wheel.offset) + 1;
            this.ctx.haptics.play("tick");
            this.#check();
          },
        },
        { axis: "y", exclusive: true, threshold: 4 }
      )
    );
  }

  #frame(dt, time) {
    if (this.opened) {
      this.frame.tick(dt, time);
      return;
    }

    for (const wheel of this.wheels) {
      wheel.offset = damp(wheel.offset, wheel.target, 12, dt);
      // El módulo mantiene el valor en 0–9 aunque la rueda gire indefinidamente.
      wheel.value = ((Math.round(wheel.offset) % 10) + 10) % 10;
      wheel.node.setAttribute("aria-valuenow", String(wheel.value));
      // Se desplaza la tira dentro del bloque central. El porcentaje es del
      // alto de la TIRA (30 dígitos), así que un dígito son 100/30 = 3,33%.
      const wrapped = ((wheel.offset % 10) + 10) % 10;
      const perDigit = 100 / 30;
      wheel.strip.style.transform = `translate3d(0, ${-(wrapped + 10) * perDigit}%, 0)`;
    }
  }

  #check() {
    if (this.opened) return;
    // Espera a que las ruedas se asienten antes de juzgar.
    clearTimeout(this.checkTimer);
    this.checkTimer = setTimeout(() => {
      const current = this.wheels.map((w) => w.value);
      const ok = current.every((v, i) => v === this.code[i]);
      if (ok) this.#open(true);
      else if (current.some((v, i) => v !== this.code[i])) this.#maybeHint(current);
    }, 420);
  }

  /** Sólo cuenta como intento si movió todas las ruedas de su sitio inicial. */
  #maybeHint(current) {
    const moved = current.some((v) => v !== 0);
    if (!moved) return;

    this.attempts++;
    if (this.attempts === 3) {
      this.hintEl.textContent = this.chapter?.combinationHint || "una fecha nuestra";
      this.hintEl.classList.add("is-visible");
      this.box.classList.remove("is-wrong");
      void this.box.offsetWidth;
      this.box.classList.add("is-wrong");
      this.ctx.haptics.play("error");
    } else if (this.attempts >= 6) {
      // Nunca dejarla fuera: a la sexta, la caja cede.
      this.hintEl.textContent = "…está bien, ábrela";
      this.#open(true);
    }
  }

  async #open(celebrate) {
    if (this.opened) return;
    this.opened = true;
    clearTimeout(this.checkTimer);

    this.root.classList.add("is-open");
    this.hintEl.classList.remove("is-visible");

    if (celebrate) {
      this.ctx.haptics.play("open");
      this.ctx.audio.play("open", { volume: 0.6 });
      this.ctx.gl?.flash(0.4);
      this.ctx.gl?.pulse(0.9);
      this.unlockSecret();
    }

    await wait(celebrate ? 520 : 0);
    await this.frame.load();
    this.root.classList.add("is-showing");
    if (!this.tickerOn) {
      this.tickerOn = true;
      this.addTicker((dt, time) => this.frame.tick(dt, time), 11);
    }
  }

  destroy() {
    clearTimeout(this.checkTimer);
    this.frame?.destroy();
    super.destroy();
  }
}
