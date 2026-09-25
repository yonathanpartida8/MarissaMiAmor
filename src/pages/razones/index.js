/**
 * RAZONES — un mazo de cartas: «razones por las que te amo».
 *
 * La de arriba se arrastra hacia un lado (o se toca) y sale volando; debajo
 * espera la siguiente. Al acabar el mazo aparece la última frase y se puede
 * volver a barajar.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";

export default class RazonesPage extends BasePage {
  static type = "razones";

  build() {
    const ch = this.chapter;
    this.razones = ch?.lines || [];
    this.root = el("section.page.razones", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--b": this.palette.b, "--c": this.palette.c });

    this.mazo = el("div.raz__mazo", { "data-claim-drag": "" });
    this.cuenta = el("span.raz__cuenta");
    this.fin = el("div.raz__fin", {}, [
      el("p.raz__reveal.escena__reveal", { text: ch?.reveal || "" }),
      el("button.raz__otra", { type: "button", text: "barajar otra vez ↺", onClick: () => this.#barajar() }),
    ]);

    this.root.append(
      el("header.raz__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.raz__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.raz__mesa", {}, [this.fin, this.mazo]),
      el("p.raz__pie.escena__nota.hueco-barra", {}, [this.cuenta])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (!this.cartas) this.#barajar(false);
    this.#bind();
  }

  #barajar(sonar = true) {
    const rng = seeded(`razones-${Date.now()}`);
    this.mazo.textContent = "";
    this.root.classList.remove("is-acabado");
    this.cartas = this.razones.map((texto, i) =>
      el("article.raz__carta", {}, [
        el("span.raz__num", { text: `razón #${i + 1}` }),
        el("p.raz__texto", { text: texto }),
        el("span.raz__corazon", { text: "♥" }),
      ])
    );
    // La primera razón queda arriba del todo.
    [...this.cartas].reverse().forEach((c, k) => {
      setVars(c, { "--giro": `${rng.range(-5, 5).toFixed(1)}deg`, "--i": String(this.cartas.length - 1 - k) });
      this.mazo.append(c);
    });
    this.actual = 0;
    this.#contar();
    if (sonar) this.feedback("turn", "tap", { volume: 0.4, rate: 1.3 });
  }

  #contar() {
    const n = this.cartas.length;
    this.cuenta.textContent = this.actual < n ? `${this.actual + 1} de ${n}` : "todas leídas ♥";
    this.cartas.forEach((c, i) => c.classList.toggle("is-arriba", i === this.actual));
  }

  #bind() {
    let carta = null;
    this.addGestures(
      new Gestures(
        this.mazo,
        {
          onPanStart: () => {
            carta = this.cartas[this.actual];
            carta?.classList.add("is-arrastrando");
          },
          onPan: (e) => {
            if (!carta) return;
            carta.style.transform = `translate(${e.dx}px, ${e.dy * 0.35}px) rotate(${e.dx * 0.06}deg)`;
          },
          onPanEnd: (e) => {
            if (!carta) return;
            carta.classList.remove("is-arrastrando");
            if (Math.abs(e.dx) > 80 || Math.abs(e.vx) > 0.45) this.#lanzar(Math.sign(e.dx || e.vx || 1));
            else carta.style.transform = "";
            carta = null;
          },
          onTap: () => this.#lanzar(1),
        },
        { axis: "free", exclusive: true, threshold: 6 }
      )
    );
  }

  #lanzar(lado) {
    const carta = this.cartas[this.actual];
    if (!carta) return;
    carta.classList.add("is-volando");
    carta.style.transform = `translate(${lado * 130}vw, -8vh) rotate(${lado * 28}deg)`;
    this.feedback("turn", "tick", { volume: 0.35, rate: 1.5 });
    this.later(() => carta.remove(), 520);
    this.actual++;
    this.#contar();
    if (this.actual >= this.cartas.length) {
      this.root.classList.add("is-acabado");
      this.unlockSecret();
      const r = this.mazo.getBoundingClientRect();
      for (let k = 0; k < 6; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + r.height / 2), k * 120);
    }
  }
}
