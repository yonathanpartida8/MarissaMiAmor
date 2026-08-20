/**
 * GIFTPAGE — el regalo que hay que desatar.
 *
 * Una caja con su listón. Se tira de la punta del lazo, el nudo se deshace de
 * verdad (la cinta se acorta mientras tiras), la tapa se levanta con su
 * bisagra y de dentro sale una lluvia de destellos y, después, lo que había
 * guardado.
 *
 * Las partículas del estallido son elementos que se crean, se animan una vez y
 * se borran solos: nada queda dando vueltas cuando la página se destruye.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, splitWords, setVars, wait } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";
import { clamp01 } from "../../utils/math.js";

const UNTIE_DISTANCE = 96;

export default class GiftPage extends BasePage {
  static type = "gift";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.gift", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a, "--untie": "0" });

    this.proseEl = el("div.gift__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.ribbonEnd = el("button.gift__end", {
      type: "button",
      "data-claim-drag": "",
      "aria-label": "Tira del listón para desatar",
    });

    this.box = el("div.gift__box", {}, [
      el("div.gift__body"),
      el("div.gift__lid", {}, [el("div.gift__lidface")]),
      el("div.gift__ribbon.gift__ribbon--v"),
      el("div.gift__ribbon.gift__ribbon--h"),
      el("div.gift__bow", {}, [
        el("span.gift__loop.gift__loop--l"),
        el("span.gift__loop.gift__loop--r"),
        el("span.gift__knot"),
      ]),
      this.ribbonEnd,
    ]);

    this.burst = el("div.gift__burst", { "aria-hidden": "true" });

    this.card = el("div.gift__card.paper.paper--aged", {}, [
      el("span.kicker", { text: ch?.kicker || "" }),
      el("h2.gift__title", { text: ch?.title || "" }),
      el("hr.rule"),
      el("div.gift__scroll", {}, [this.proseEl]),
      ch?.reveal ? el("p.gift__reveal", { text: ch.reveal }) : null,
    ]);

    this.root.append(
      el("div.gift__stage", {}, [this.burst, this.box, this.card]),
      el("p.gift__prompt", { text: "tira del listón" })
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.untie = 0;
    this.opened = false;

    this.addGestures(
      new Gestures(
        this.ribbonEnd,
        {
          onPan: (e) => {
            if (this.opened) return;
            // Vale tirar hacia abajo o en diagonal: nadie tira recto.
            const dist = Math.max(0, e.dy) + Math.abs(e.dx) * 0.6;
            this.untie = clamp01(dist / UNTIE_DISTANCE);
            setVars(this.root, { "--untie": this.untie.toFixed(3) });
            setVars(this.ribbonEnd, {
              "--ex": `${e.dx * 0.7}px`,
              "--ey": `${Math.max(0, e.dy) * 0.7}px`,
            });
            if (Math.random() < 0.28) this.ctx.haptics.scrub(this.untie * 0.8);
            if (this.untie >= 1) this.#open();
          },
          onPanEnd: () => {
            if (this.opened) return;
            this.untie = 0;
            setVars(this.root, { "--untie": "0" });
            this.ribbonEnd.style.transition = "transform 460ms var(--e-spring)";
            setVars(this.ribbonEnd, { "--ex": "0px", "--ey": "0px" });
            this.later(() => (this.ribbonEnd.style.transition = ""), 480);
            this.ctx.haptics.play("tick");
          },
          onTap: () => {
            if (this.opened) return;
            this.box.classList.remove("is-shake");
            void this.box.offsetWidth;
            this.box.classList.add("is-shake");
            this.ctx.haptics.play("tap");
            this.ctx.audio.play("turn", { volume: 0.2, rate: 0.7 });
          },
        },
        { exclusive: true, threshold: 5 }
      )
    );
  }

  async #open() {
    if (this.opened) return;
    this.opened = true;

    this.ctx.haptics.play("open");
    this.ctx.audio.play("open", { volume: 0.7 });
    this.ctx.gl?.pulse(1);

    this.root.classList.add("is-untied");
    await wait(480);

    this.root.classList.add("is-lifting");
    this.#explode();
    this.ctx.gl?.flash(0.5);
    await wait(620);

    this.root.classList.add("is-open");
    this.proseEl.classList.add("is-writing");
    this.ctx.haptics.play("heart");
    this.unlockSecret();
  }

  /** Lluvia de destellos que sale de la caja. Se limpia sola. */
  #explode() {
    const count = this.ctx.caps.tierName === "low" ? 14 : this.ctx.caps.tierName === "mid" ? 30 : 54;
    const rng = seeded(`estallido-${this.id}`);

    for (let i = 0; i < count; i++) {
      const bit = el("i.gift__bit");
      const angle = rng.range(-120, -60) * (Math.PI / 180);
      const speed = rng.range(90, 260);
      bit.style.setProperty("--bx", `${Math.cos(angle) * speed}px`);
      bit.style.setProperty("--by", `${Math.sin(angle) * speed}px`);
      bit.style.setProperty("--bd", `${rng.range(700, 1500).toFixed(0)}ms`);
      bit.style.setProperty("--bl", `${rng.range(0, 220).toFixed(0)}ms`);
      bit.style.setProperty("--br", `${rng.range(-360, 360).toFixed(0)}deg`);
      bit.style.setProperty("--bs", rng.range(0.5, 1.4).toFixed(2));
      if (rng.next() < 0.28) bit.classList.add("gift__bit--heart");
      // Cada partícula se borra al terminar su animación: cero acumulación.
      bit.addEventListener("animationend", () => bit.remove(), { once: true });
      this.burst.append(bit);
    }
  }
}
