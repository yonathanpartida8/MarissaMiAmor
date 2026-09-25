/**
 * CUPONES — una libretita de vales de amor.
 *
 * Se arranca el de arriba (tocándolo o tirando de él) y sale volando a su
 * montoncito. Easter egg: al arrancar el último aparece el vale DORADO.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars } from "../../utils/dom.js";

const COLORES = ["#ffd6e0", "#ffe9b8", "#d7ecff", "#dff5d8", "#eadcff", "#ffdcc8"];

export default class CuponesPage extends BasePage {
  static type = "cupones";

  build() {
    const ch = this.chapter;
    this.textos = ch?.lines || [];
    this.root = el("section.page.cupones", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    this.libreta = el("div.cup__libreta", { "data-claim-drag": "" });
    this.monton = el("div.cup__monton", { "aria-hidden": "true" });
    this.dorado = el("div.cup__vale.cup__vale--dorado", {}, [
      el("span.cup__sello", { text: "✦ vale dorado ✦" }),
      el("p.cup__texto", { text: ch?.reveal || "" }),
    ]);
    this.cuenta = el("span.cup__cuenta");

    this.root.append(
      el("header.cup__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.cup__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.cup__mesa", {}, [this.monton, this.dorado, this.libreta]),
      el("p.cup__pie.escena__nota.hueco-barra", {}, [this.cuenta])
    );
    this.#rellenar();
    return this.root;
  }

  #rellenar() {
    this.libreta.textContent = "";
    this.monton.textContent = "";
    this.root.classList.remove("is-dorado");
    this.vales = this.textos.map((t, i) => {
      const v = el("div.cup__vale", {}, [
        el("span.cup__sello", { text: `vale nº ${String(i + 1).padStart(2, "0")}` }),
        el("p.cup__texto", { text: t }),
        el("span.cup__firma", { text: "firmado: tu amorcito ♥" }),
      ]);
      setVars(v, { "--col": COLORES[i % COLORES.length], "--i": String(i) });
      return v;
    });
    [...this.vales].reverse().forEach((v) => this.libreta.append(v));
    this.arrancados = 0;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    this.#contar();
    let vale = null;
    this.addGestures(
      new Gestures(
        this.libreta,
        {
          onPanStart: () => { vale = this.vales[this.arrancados]; vale?.classList.add("is-tirando"); },
          onPan: (e) => {
            if (!vale) return;
            const dy = Math.min(0, e.dy);
            vale.style.transform = `translate(${e.dx * 0.5}px, ${dy}px) rotate(${e.dx * 0.04}deg)`;
          },
          onPanEnd: (e) => {
            if (!vale) return;
            vale.classList.remove("is-tirando");
            if (e.dy < -60 || Math.hypot(e.dx, e.dy) > 110) this.#arrancar();
            else vale.style.transform = "";
            vale = null;
          },
          onTap: () => this.#arrancar(),
        },
        { axis: "free", exclusive: true, threshold: 6 }
      )
    );
    this.on(this.dorado, "click", () => {
      this.#rellenar();
      this.#contar();
    });
  }

  #contar() {
    const quedan = this.vales.length - this.arrancados;
    this.cuenta.textContent = quedan > 0 ? `quedan ${quedan} vales · son canjeables para siempre` : "toca el vale dorado para rellenar la libreta";
  }

  #arrancar() {
    const vale = this.vales[this.arrancados];
    if (!vale) return;
    this.arrancados++;
    vale.classList.add("is-arrancado");
    vale.style.transform = "";
    this.feedback("turn", "tick", { volume: 0.35, rate: 0.8 });
    this.later(() => {
      vale.classList.remove("is-arrancado");
      vale.classList.add("en-monton");
      setVars(vale, { "--g": `${(Math.random() * 16 - 8).toFixed(1)}deg` });
      this.monton.append(vale);
    }, 480);
    this.#contar();
    if (this.arrancados === this.vales.length) {
      this.later(() => {
        this.root.classList.add("is-dorado");
        this.unlockSecret();
        this.feedback("open", "secret", { volume: 0.5 });
        const r = this.dorado.getBoundingClientRect();
        for (let k = 0; k < 7; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + r.height / 2, k === 3 ? "canjéalo cuando quieras" : ""), k * 120);
      }, 600);
    }
  }
}
