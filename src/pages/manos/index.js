/**
 * MANOS — dos manos, una a cada lado. Se arrastra la tuya hacia la mía.
 *
 * Al tocarse las puntas de los dedos saltan chispas y sale la frase.
 * Easter egg: si se quedan juntas tres segundos, aparece un anillo entre
 * las dos.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars } from "../../utils/dom.js";
import { clamp } from "../../utils/math.js";

export default class ManosPage extends BasePage {
  static type = "manos";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.manos", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--acerca": "0" });

    this.tuya = el("div.man__mano.man__mano--tuya", { "data-claim-drag": "", role: "slider", "aria-label": "Tu mano" }, [
      el("span.man__emoji", { text: "🫱" }),
      el("span.man__nombre.escena__frase", { text: "tú" }),
    ]);
    this.mia = el("div.man__mano.man__mano--mia", { "aria-hidden": "true" }, [
      el("span.man__emoji", { text: "🫲" }),
      el("span.man__nombre.escena__frase", { text: "yo" }),
    ]);
    this.chispa = el("div.man__chispa", { "aria-hidden": "true" });
    this.anillo = el("div.man__anillo", { "aria-hidden": "true", text: "💍" });

    this.root.append(
      el("header.man__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.man__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.man__escena", {}, [
        el("div.man__hilo", { "aria-hidden": "true" }),
        this.tuya,
        this.chispa,
        this.anillo,
        this.mia,
      ]),
      el("div.man__pie.hueco-barra", {}, [
        el("p.man__reveal.escena__reveal", { text: ch?.reveal || "" }),
        el("p.man__secreto.escena__reveal", { text: (ch?.lines || [])[0] || "" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    this.acerca = 0;
    this.#poner(0);

    let desde = 0;
    this.addGestures(
      new Gestures(
        this.tuya,
        {
          onPanStart: () => { desde = this.acerca; this.root.classList.add("is-moviendo"); },
          onPan: (e) => {
            const escena = this.root.querySelector(".man__escena").clientWidth || 300;
            this.#poner(clamp(desde + e.dx / (escena * 0.42), 0, 1));
          },
          onPanEnd: () => {
            this.root.classList.remove("is-moviendo");
            if (this.acerca < 0.96) this.#poner(this.acerca > 0.8 ? 1 : this.acerca);
          },
        },
        { axis: "x", exclusive: true, threshold: 4 }
      )
    );
  }

  #poner(v) {
    this.acerca = v;
    setVars(this.root, { "--acerca": v.toFixed(3) });
    const juntas = v >= 0.97;
    if (juntas && !this.juntas) {
      this.juntas = true;
      this.root.classList.add("is-juntas");
      this.feedback("open", "secret", { volume: 0.45 });
      this.unlockSecret();
      const r = this.chispa.getBoundingClientRect();
      for (let k = 0; k < 5; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top), k * 120);
      clearTimeout(this.relojAnillo);
      this.relojAnillo = this.later(() => {
        if (!this.juntas) return;
        this.root.classList.add("is-anillo");
        this.escondite("manos-anillo", "");
        this.ctx.haptics.play("secret");
      }, 3000);
    } else if (!juntas && this.juntas) {
      this.juntas = false;
      this.root.classList.remove("is-juntas", "is-anillo");
      clearTimeout(this.relojAnillo);
    }
  }
}
