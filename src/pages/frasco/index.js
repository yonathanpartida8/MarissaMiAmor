/**
 * FRASCO — un frasco de cristal lleno de notitas dobladas.
 *
 * Al tocarlo se sacude y sale volando una notita que se despliega con lo que
 * dice. Cada vez quedan menos dentro; al leerlas todas sale lo último.
 */

import { BasePage } from "../BasePage.js";
import { el, setVars } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";

const COLORES = ["#ffd1dc", "#ffe7a8", "#cfe8ff", "#d8f5d0", "#e8d6ff", "#ffd9c2"];

export default class FrascoPage extends BasePage {
  static type = "frasco";

  build() {
    const ch = this.chapter;
    this.notas = ch?.lines || [];
    this.root = el("section.page.frasco", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    const rng = seeded(`frasco-${this.id}`);
    this.dentro = this.notas.map((_, i) => {
      const n = el("span.fra__doblada");
      setVars(n, {
        "--x": `${rng.range(14, 72).toFixed(0)}%`,
        "--y": `${(78 - (i / this.notas.length) * 52 + rng.range(-6, 6)).toFixed(0)}%`,
        "--g": `${rng.range(-40, 40).toFixed(0)}deg`,
        "--col": COLORES[i % COLORES.length],
      });
      return n;
    });

    this.frasco = el("button.fra__frasco", { type: "button", "aria-label": "Sacar una notita", "data-claim-drag": "" }, [
      el("span.fra__tapa"),
      el("span.fra__cristal", {}, this.dentro),
      el("span.fra__brillo"),
      el("span.fra__etiqueta", { text: "para ti ♥" }),
    ]);
    this.nota = el("div.fra__nota", { role: "button", "aria-live": "polite" }, [el("p.fra__texto")]);
    this.cuenta = el("span.fra__cuenta.escena__nota");

    this.root.append(
      el("header.fra__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.fra__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.fra__mesa", {}, [this.frasco, this.nota]),
      el("div.fra__pie.hueco-barra", {}, [this.cuenta, el("p.fra__reveal.escena__reveal", { text: ch?.reveal || "" })])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.leidas === undefined) this.leidas = 0;
    this.#contar();
    this.on(this.frasco, "click", () => this.#sacar());
    this.on(this.nota, "click", () => this.root.classList.remove("is-leyendo"));
  }

  #contar() {
    const quedan = this.notas.length - this.leidas;
    this.cuenta.textContent = quedan > 0 ? `quedan ${quedan} notitas` : "las leíste todas ♥";
  }

  #sacar() {
    if (this.root.classList.contains("is-leyendo")) {
      this.root.classList.remove("is-leyendo");
      return;
    }
    this.frasco.classList.remove("is-sacude");
    void this.frasco.offsetWidth;
    this.frasco.classList.add("is-sacude");
    this.feedback("turn", "tap", { volume: 0.3, rate: 1.7 });

    const i = this.leidas % this.notas.length;
    const papel = this.dentro[i];
    const color = papel ? getComputedStyle(papel).getPropertyValue("--col") : COLORES[0];
    setVars(this.nota, { "--col": color });
    this.nota.firstChild.textContent = this.notas[i];
    if (this.leidas < this.notas.length) {
      papel?.classList.add("is-fuera");
      this.leidas++;
      this.#contar();
      if (this.leidas === this.notas.length) {
        this.root.classList.add("is-vacio");
        this.unlockSecret();
      }
    } else {
      this.leidas++;
    }
    this.later(() => {
      this.root.classList.add("is-leyendo");
      this.feedback("open", null, { volume: 0.35 });
    }, 260);
  }
}
