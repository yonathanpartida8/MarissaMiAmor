/**
 * POSTCARDPAGE — una postal que hay que darle la vuelta.
 *
 * Delante, la ilustración con su marco, su sello y su matasellos. Detrás, lo
 * escrito a mano. No se voltea con un botón: se arrastra, la postal sigue al
 * dedo en 3D, y al soltar decide un muelle si termina de girar o se vuelve.
 * Exactamente como una postal de verdad entre los dedos.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createPhotoFrame } from "../../components/PhotoFrame.js";
import { createSparkles } from "../../components/Sparkles.js";
import { el, splitWords, setVars } from "../../utils/dom.js";
import { spring, springSettled, clamp } from "../../utils/math.js";

export default class PostcardPage extends BasePage {
  static type = "postcard";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.postcard", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // ---- Cara delantera: la ilustración -------------------------------
    this.frame = createPhotoFrame(this.ctx, {
      photo: this.photos[0] || null,
      shape: "postcard",
      ratio: "3 / 4",
      parallax: 0.6,
    });

    const front = el("div.pc__face.pc__face--front", {}, [
      this.frame.node,
      el("div.pc__stamp", {}, [
        el("span.pc__stampmark", { text: "❤" }),
        el("span.pc__stampedge"),
      ]),
      el("div.pc__postmark", {}, [
        el("span", { text: "PARA" }),
        el("strong", { text: "MARISSA" }),
      ]),
    ]);

    // ---- Cara trasera: lo escrito -------------------------------------
    this.proseEl = el("div.pc__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    const back = el("div.pc__face.pc__face--back.paper.paper--aged", {}, [
      el("div.pc__backhead", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.pc__title", { text: ch?.title || "" }),
      ]),
      el("div.pc__lines"),
      el("div.pc__scroll", {}, [this.proseEl]),
      ch?.reveal ? el("p.pc__reveal", { text: ch.reveal }) : null,
      el("div.pc__sign", { text: "— para ti" }),
    ]);

    this.card = el("div.pc__card", {}, [front, back]);
    this.sparkles = createSparkles(this.ctx, { seed: `pc-${this.id}`, scale: 0.6 });

    // El gesto pertenece a toda la zona, no sólo a la cartulina: acertar
    // justo encima de una postal que además está girando es incómodo, y si
    // el dedo caía fuera por un píxel el libro entendía "pasar página".
    this.stage = el("div.pc__stage", { "data-claim-drag": "" }, [this.card]);

    this.root.append(
      this.stage,
      el("p.pc__prompt", { text: "arrástrala para darle la vuelta" }),
      this.sparkles.node
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    await this.frame.load();
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.angle = 0;        // grados, 0 = delante, 180 = detrás
    this.velocity = 0;
    this.target = 0;
    this.dragging = false;
    this.flipped = false;

    this.addGestures(
      new Gestures(
        this.stage,
        {
          onPanStart: () => {
            this.dragging = true;
            this.startAngle = this.angle;
            this.velocity = 0;
            this.card.classList.add("is-held");
          },
          onPan: (e) => {
            const width = this.card.clientWidth || 1;
            // Recorrido completo con medio ancho de arrastre: un gesto corto.
            // Y hacia los dos lados: nadie mira una postal girándola siempre
            // en la misma dirección.
            this.angle = this.startAngle + (e.dx / (width * 0.5)) * 180;
            this.angle = clamp(this.angle, -210, 390);
            this.#apply();
          },
          onPanEnd: (e) => {
            this.dragging = false;
            this.card.classList.remove("is-held");
            // La cara más cercana, con el impulso del dedo como voto.
            const projected = this.angle + e.vx * 240;
            this.target = clamp(Math.round(projected / 180) * 180, -180, 360);
            this.velocity = e.vx * 420;
            this.ctx.audio.play("turn", { volume: 0.32, rate: 1.25 });
          },
          onTap: () => {
            this.target = this.angle + (this.#isBack() ? -180 : 180);
            this.velocity = 0;
            this.ctx.haptics.play("tap");
            this.ctx.audio.play("turn", { volume: 0.32, rate: 1.25 });
          },
        },
        { axis: "x", exclusive: true, threshold: 7 }
      )
    );

    this.addTicker((dt, time) => this.#frame(dt, time), 11);
  }

  #frame(dt, time) {
    this.frame.tick(dt, time);

    if (!this.dragging) {
      const step = spring(this.angle, this.target, this.velocity, dt, 150, 20);
      this.angle = step.value;
      this.velocity = step.velocity;
      this.#apply();

      if (springSettled(this.angle, this.target, this.velocity, 0.05)) {
        this.angle = this.target;
        this.velocity = 0;
        this.#apply();
        this.#settled();
      }
    }
  }

  /** ¿Se está viendo el reverso? Vale para cualquier número de vueltas. */
  #isBack(angle = this.angle) {
    const norm = ((angle % 360) + 360) % 360;
    return norm > 90 && norm < 270;
  }

  #apply() {
    // Al pasar por el canto, la postal se levanta un poco: le da grosor.
    const norm = ((this.angle % 360) + 360) % 360;
    const lift = Math.abs(Math.sin((norm / 180) * Math.PI));
    setVars(this.root, {
      "--flip": `${this.angle}deg`,
      "--lift": `${lift * 46}px`,
      "--shade": (lift * 0.5).toFixed(3),
    });
    this.root.classList.toggle("is-back", this.#isBack());
  }

  #settled() {
    const nowFlipped = this.#isBack(this.target);
    if (nowFlipped === this.flipped) return;
    this.flipped = nowFlipped;

    if (nowFlipped) {
      this.proseEl.classList.add("is-writing");
      this.root.classList.add("is-read");
      this.ctx.haptics.play("reveal");
      this.ctx.gl?.pulse(0.4);
      this.unlockSecret();
    }
  }

  destroy() {
    this.frame?.destroy();
    this.sparkles?.destroy();
    super.destroy();
  }
}
