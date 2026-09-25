/**
 * BURBUJAS — cada burbuja que revienta suelta una palabra.
 *
 * Suben despacio y se mecen. Al tocar una, estalla y la siguiente palabra de
 * la frase aparece abajo; cuando la frase está completa, sale lo último. La
 * que revienta vuelve a nacer abajo al rato: siempre queda alguna.
 */

import { BasePage } from "../BasePage.js";
import { el, setVars } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";

const CUANTAS = 11;

export default class BurbujasPage extends BasePage {
  static type = "burbujas";

  build() {
    const ch = this.chapter;
    this.palabras = ch?.lines || [];
    this.root = el("section.page.burbujas", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--b": this.palette.b });

    this.cielo = el("div.bur__cielo", { "data-claim-drag": "" });
    this.frase = el("p.bur__frase", { "aria-live": "polite" });
    this.reveal = el("p.bur__reveal", { text: ch?.reveal || "" });

    this.root.append(
      el("header.bur__head.entra--sube", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.bur__title", { text: ch?.title || "" }),
      ]),
      this.cielo,
      el("div.bur__pie.hueco-barra", {}, [this.frase, this.reveal])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.dichas === undefined) this.dichas = 0;
    this.rng = seeded(`burbujas-${Date.now()}`);
    this.cielo.textContent = "";
    for (let i = 0; i < CUANTAS; i++) this.#nacer(i * 0.9);
  }

  #nacer(retraso = 0) {
    const r = this.rng;
    const tam = r.range(46, 84);
    const b = el("button.bur__burbuja", { type: "button", "aria-label": "Una burbuja" });
    setVars(b, {
      "--x": `${r.range(4, 96 - (tam / 4)).toFixed(1)}%`,
      "--tam": `${tam.toFixed(0)}px`,
      "--dur": `${r.range(9, 15).toFixed(1)}s`,
      "--delay": `-${(retraso + r.range(0, 8)).toFixed(1)}s`,
      "--meneo": `${r.range(10, 26).toFixed(0)}px`,
      "--tono": `${r.range(-30, 40).toFixed(0)}deg`,
    });
    this.on(b, "pointerdown", (e) => this.#reventar(b, e), { passive: true });
    this.cielo.append(b);
  }

  #reventar(b, e) {
    if (b.classList.contains("is-rota")) return;
    b.classList.add("is-rota");
    this.feedback("turn", "tick", { volume: 0.3, rate: 2.4 });
    this.later(() => b.remove(), 420);
    this.later(() => this.active && this.#nacer(), 2200);

    if (this.dichas < this.palabras.length) {
      const palabra = el("span.bur__palabra", { text: this.palabras[this.dichas] });
      this.frase.append(palabra, " ");
      this.dichas++;
      if (this.dichas === this.palabras.length) {
        this.root.classList.add("is-completa");
        this.unlockSecret();
        for (let k = 0; k < 6; k++) this.later(() => this.corazon(e.clientX, e.clientY), k * 110);
      }
    } else {
      this.corazon(e.clientX, e.clientY);
    }
  }
}
