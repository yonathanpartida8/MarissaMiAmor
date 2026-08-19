/**
 * COVERPAGE — la portada.
 *
 * Lo primero que se ve tiene que prometer todo lo demás. Aquí la promesa es:
 * esto responde. La cubierta se inclina con el dedo y con el giroscopio, la
 * luz la recorre según cómo la sujetes, y para abrir el libro no basta con
 * tocar: hay que mantener el dedo sobre el sello hasta que cede, como quien
 * rompe un lacre de verdad.
 */

import { BasePage } from "./BasePage.js";
import { Gestures } from "../core/Gestures.js";
import { el, qs, setVars } from "../utils/dom.js";
import { clamp01, damp } from "../utils/math.js";

const HOLD_SECONDS = 1.25;

export default class CoverPage extends BasePage {
  static type = "cover";

  get palette() {
    return { a: "#e9a6bf", b: "#4b2270", deep: "#0b0512" };
  }

  get mood() {
    return "dawn";
  }

  build() {
    this.root = el("section.page.cover", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": "Portada",
    });
    setVars(this.root, { "--accent": this.palette.a });

    this.card = el("div.cover__card", {}, [
      el("div.cover__photo"),
      el("div.cover__grain"),
      el("div.cover__sheen"),
      el("div.cover__border"),
      el("div.cover__content", {}, [
        el("span.cover__kicker", { text: "un librito de amor para" }),
        el("h1.cover__name", { text: "Marissa" }),
        el("div.cover__flourish", {
          html: `<svg viewBox="0 0 120 12" aria-hidden="true">
            <path d="M2 6 Q 30 0, 58 6 T 118 6" fill="none" stroke="currentColor" stroke-width="0.8"/>
            <circle cx="60" cy="6" r="2.2" fill="currentColor"/>
          </svg>`,
        }),
        el("span.cover__sub", { text: "mi amorcito" }),
      ]),
    ]);

    this.seal = el("button.cover__seal", {
      type: "button",
      "aria-label": "Mantén pulsado para abrir el libro",
      html: `
        <svg class="seal__ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="seal__track" cx="50" cy="50" r="44"/>
          <circle class="seal__prog" cx="50" cy="50" r="44"/>
        </svg>
        <span class="seal__wax">
          <span class="seal__letter">M</span>
        </span>`,
    });

    this.root.append(
      this.card,
      el("div.cover__sealwrap", {}, [
        this.seal,
        el("span.cover__sealtext", { text: "mantén pulsado" }),
      ])
    );

    this.progressCircle = qs(".seal__prog", this.seal);
    return this.root;
  }

  async preload() {
    const first = this.photos[0];
    if (!first) return;
    await this.ctx.assets.load(first.src).catch(() => null);
  }

  async enter(direction) {
    await super.enter(direction);

    const photo = this.photos[0];
    if (photo) qs(".cover__photo", this.root).style.backgroundImage = `url("${photo.src}")`;

    this.ctx.gl?.setIntensity(1);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    // Circunferencia del anillo de progreso, para animar stroke-dashoffset.
    const r = 44;
    this.circumference = 2 * Math.PI * r;
    this.progressCircle.style.strokeDasharray = String(this.circumference);
    this.progressCircle.style.strokeDashoffset = String(this.circumference);

    this.hold = 0;
    this.holding = false;
    this.opening = false;
    this.tiltX = 0;
    this.tiltY = 0;

    this.addGestures(
      new Gestures(
        this.seal,
        {
          onDown: () => {
            if (this.opening) return;
            this.holding = true;
            this.ctx.haptics.play("tap");
            this.seal.classList.add("is-pressing");
          },
          onUp: () => {
            this.holding = false;
            this.seal.classList.remove("is-pressing");
          },
        },
        { exclusive: true }
      )
    );

    this.addTicker((dt, time, realDt) => this.#frame(dt, time, realDt), 12);
  }

  #frame(dt, time, realDt) {
    // ---- Inclinación de la cubierta ------------------------------------
    const p = this.ctx.pointer.influence;
    this.tiltX = damp(this.tiltX, p.x, 4.5, dt);
    this.tiltY = damp(this.tiltY, p.y, 4.5, dt);

    // Respiración lentísima: la portada nunca está del todo quieta.
    const breath = Math.sin(time * 0.55) * 0.6;

    this.card.style.transform =
      `rotateX(${this.tiltY * 9 + breath}deg) rotateY(${this.tiltX * 12}deg) translateZ(0)`;

    // La luz se mueve en sentido contrario al giro: así parece una fuente fija.
    setVars(this.root, {
      "--sheen-x": `${(50 - this.tiltX * 46).toFixed(1)}%`,
      "--sheen-y": `${(50 - this.tiltY * 40).toFixed(1)}%`,
      "--depth-x": `${(this.tiltX * -14).toFixed(1)}px`,
      "--depth-y": `${(this.tiltY * 10).toFixed(1)}px`,
    });

    // ---- Presión sobre el sello ----------------------------------------
    if (this.opening) return;

    const before = this.hold;
    // Tiempo real, no el acotado: lo que se mide aquí es la paciencia
    // de quien sujeta el sello, no una simulación.
    this.hold = clamp01(this.hold + (this.holding ? realDt / HOLD_SECONDS : -realDt / 0.5));
    if (this.hold === before) return;

    this.progressCircle.style.strokeDashoffset = String(this.circumference * (1 - this.hold));
    setVars(this.root, { "--hold": String(this.hold) });

    // Vibración creciente: se nota que el lacre está a punto de ceder.
    if (this.holding && Math.random() < realDt * (4 + this.hold * 14)) {
      this.ctx.haptics.scrub(this.hold);
    }

    if (this.hold >= 1) this.#open();
  }

  async #open() {
    this.opening = true;
    this.holding = false;
    this.seal.classList.add("is-broken");
    this.root.classList.add("is-opening");

    this.ctx.haptics.play("open");
    this.ctx.audio.play("open", { volume: 0.9 });
    this.ctx.gl?.flash(0.75);
    this.ctx.gl?.pulse(1);

    // Un respiro antes de pasar: que se vea el lacre partirse.
    this.later(() => this.ctx.router.next(), 620);
  }
}
