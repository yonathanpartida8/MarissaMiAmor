/**
 * FAROLITOS — cada toque suelta un farolito de papel con un deseo.
 *
 * Suben despacio, se mecen y se van apagando arriba. Al soltarlos todos sale
 * la última frase. Easter egg: tocar la luna tres veces suelta un farolito
 * dorado con el deseo secreto.
 */

import { BasePage } from "../BasePage.js";
import { el, setVars } from "../../utils/dom.js";

export default class FarolitosPage extends BasePage {
  static type = "farolitos";

  build() {
    const ch = this.chapter;
    this.deseos = ch?.lines || [];
    this.root = el("section.page.farolitos", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    this.cielo = el("div.far__cielo", { "data-claim-drag": "", role: "button", "aria-label": "Soltar un farolito" });
    this.luna = el("button.far__luna", { type: "button", "aria-label": "La luna" });
    this.cuenta = el("span.far__cuenta");

    this.root.append(
      el("header.far__head.entra--sube", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.far__title", { text: ch?.title || "" }),
      ]),
      this.cielo,
      el("div.far__pie.hueco-barra", {}, [this.cuenta, el("p.far__reveal", { text: ch?.reveal || "" })])
    );
    this.actual = el("p.far__actual", { "aria-live": "polite" });
    this.cielo.append(this.luna, el("div.far__agua", { "aria-hidden": "true" }), this.actual);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.soltados === undefined) this.soltados = 0;
    this.#contar();
    this.toquesLuna = 0;
    // Al primer contacto y no con `click`: el navegador se come los clics
    // seguidos y rápidos, y aquí se toca muchas veces seguidas.
    this.on(this.cielo, "pointerdown", (e) => {
      if (e.target === this.luna) return;
      this.#soltar(e);
    }, { passive: true });
    this.on(this.luna, "pointerdown", (e) => {
      this.luna.classList.remove("is-guina");
      void this.luna.offsetWidth;
      this.luna.classList.add("is-guina");
      if (++this.toquesLuna === 3) this.#soltar(e, "Deseo secreto: que esto dure para siempre. 🤍", true);
    }, { passive: true });
  }

  #contar() {
    const n = this.deseos.length;
    this.cuenta.textContent = this.soltados < n ? `${n - this.soltados} deseos por soltar` : "todos los deseos van volando ✨";
  }

  #soltar(e, textoEspecial = "", dorado = false) {
    const r = this.cielo.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const texto = textoEspecial || this.deseos[this.soltados % this.deseos.length];
    const f = el("div.far__farol" + (dorado ? ".far__farol--dorado" : ""), {}, [el("span.far__papel")]);
    // El deseo se lee abajo, uno a la vez: encima de cada farol se encimaban.
    this.actual.textContent = texto;
    this.actual.classList.remove("is-nuevo");
    void this.actual.offsetWidth;
    this.actual.classList.add("is-nuevo");
    setVars(f, {
      "--x": `${Math.min(88, Math.max(12, x)).toFixed(1)}%`,
      "--meneo": `${(8 + Math.random() * 16).toFixed(0)}px`,
      "--dur": `${(7 + Math.random() * 3).toFixed(1)}s`,
    });
    this.cielo.append(f);
    this.later(() => f.remove(), 11000);
    this.feedback("turn", "tap", { volume: 0.25, rate: 0.7 });

    if (dorado) {
      this.escondite("farolito-dorado", "");
      return;
    }
    this.soltados++;
    this.#contar();
    if (this.soltados === this.deseos.length) {
      this.root.classList.add("is-todos");
      this.unlockSecret();
    }
  }
}
