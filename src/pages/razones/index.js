/**
 * RAZONES — un mazo de cien cartas: «razones por las que te amo».
 *
 * La de arriba se arrastra hacia un lado (o se toca) y sale volando; debajo
 * espera la siguiente. Con doble toque se GUARDA (le sale un sello) y queda
 * en «tus guardadas». El libro se acuerda de por cuál iba: con cien cartas
 * nadie quiere empezar de cero cada vez.
 *
 * En la 25, la 50 y la 75 dice algo. Al acabar el mazo sale la última frase
 * y se puede volver a barajar o repasar sólo las guardadas.
 *
 * Las razones están en `src/data/razones.js`.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";

/** Cuántas cartas hay de verdad en la mesa: las de debajo no se ven. */
const VISIBLES = 4;
const TINTES = ["#ffd9e3", "#ffe8cf", "#f3dcff", "#dcecff", "#ffe0ec", "#e3f5e6"];
const ADORNOS = ["♥", "✿", "✦", "☾", "❀", "♡"];
const HITOS = {
  25: "Ya van 25… y apenas voy calentando.",
  50: "La mitad. Y todavía me sobran razones.",
  75: "75. Si te cansas, descansa: aquí siguen.",
};

export default class RazonesPage extends BasePage {
  static type = "razones";

  build() {
    const ch = this.chapter;
    this.razones = ch?.lines || [];
    this.root = el("section.page.razones", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--b": this.palette.b });

    this.mazo = el("div.raz__mazo", { "data-claim-drag": "", "aria-live": "polite" });
    this.cuenta = el("span.raz__cuenta");
    this.guardadasEl = el("span.raz__guardadas");
    this.barra = el("span.raz__barra");
    this.botonGuardadas = el("button.raz__otra.raz__otra--suave", { type: "button", text: "ver mis guardadas", onClick: () => this.#soloGuardadas() });
    this.fin = el("div.raz__fin", {}, [
      el("p.raz__reveal.escena__reveal", { text: ch?.reveal || "" }),
      el("div.raz__botones", {}, [
        el("button.raz__otra", { type: "button", text: "barajar otra vez", onClick: () => this.#barajar(true) }),
        this.botonGuardadas,
      ]),
    ]);

    this.root.append(
      el("header.raz__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.raz__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.raz__mesa", {}, [this.fin, this.mazo]),
      el("div.raz__pie.hueco-barra", {}, [
        el("span.raz__progreso", { "aria-hidden": "true" }, [this.barra]),
        el("p.raz__datos.escena__nota", {}, [this.cuenta, this.guardadasEl]),
        el("p.raz__ayuda.escena__nota", { text: "toca para la siguiente · doble toque la guarda" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (!this.orden) this.#recuperar();
    this.#pintar();
    this.#bind();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Estado (y memoria)
  // ═══════════════════════════════════════════════════════════════════

  get guardadas() {
    return new Set(this.ctx.store.get("razonesGuardadas") || []);
  }

  #recuperar() {
    const n = this.razones.length;
    const memoria = this.ctx.store.get("razones");
    const valida = memoria?.orden?.length === n && memoria.orden.every((i) => i >= 0 && i < n);
    this.orden = valida ? memoria.orden : [...Array(n).keys()];
    this.van = valida ? Math.min(memoria.van || 0, n) : 0;
    this.soloFavoritas = false;
  }

  #recordar() {
    if (this.soloFavoritas) return;
    this.ctx.store.set("razones", { orden: this.orden, van: this.van });
  }

  #barajar(conSonido = false) {
    const rng = seeded(`razones-${Date.now()}`);
    const orden = [...Array(this.razones.length).keys()];
    for (let i = orden.length - 1; i > 0; i--) {
      const j = Math.floor(rng.range(0, i + 1));
      [orden[i], orden[j]] = [orden[j], orden[i]];
    }
    this.orden = orden;
    this.van = 0;
    this.soloFavoritas = false;
    this.#recordar();
    this.#pintar(true);
    if (conSonido) this.feedback("turn", "tap", { volume: 0.4, rate: 1.3 });
  }

  #soloGuardadas() {
    const g = [...this.guardadas].filter((i) => i < this.razones.length).sort((a, b) => a - b);
    if (!g.length) return;
    this.orden = g;
    this.van = 0;
    this.soloFavoritas = true;
    this.#pintar(true);
    this.feedback("turn", "tap", { volume: 0.4, rate: 1.2 });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  La mesa
  // ═══════════════════════════════════════════════════════════════════

  #carta(indice) {
    const texto = this.razones[indice];
    const guardada = this.guardadas.has(indice);
    const c = el(`article.raz__carta${guardada ? ".is-guardada" : ""}`, { "data-i": String(indice) }, [
      el("span.raz__marca", { "aria-hidden": "true", text: String(indice + 1) }),
      el("span.raz__num", { text: `razón nº ${indice + 1}` }),
      el("p.raz__texto", { text: texto }),
      el("span.raz__adorno", { "aria-hidden": "true", text: ADORNOS[indice % ADORNOS.length] }),
      el("span.raz__sello", { "aria-hidden": "true", text: "guardada" }),
    ]);
    const rng = seeded(`razon-${indice}`);
    setVars(c, { "--giro": `${rng.range(-4.5, 4.5).toFixed(1)}deg`, "--tinte": TINTES[indice % TINTES.length] });
    return c;
  }

  /** Pone en la mesa las pocas cartas que se ven, la de arriba al final. */
  #pintar(nuevo = false) {
    this.mazo.textContent = "";
    const quedan = this.orden.slice(this.van, this.van + VISIBLES);
    this.cartas = quedan.map((i) => this.#carta(i));
    [...this.cartas].reverse().forEach((c, k) => {
      setVars(c, { "--i": String(this.cartas.length - 1 - k) });
      if (nuevo) c.classList.add("is-reparte");
      this.mazo.append(c);
    });
    this.cartas[0]?.classList.add("is-arriba");
    this.root.classList.toggle("is-acabado", this.van >= this.orden.length);
    this.root.classList.toggle("is-favoritas", this.soloFavoritas);
    this.#contar();
  }

  /** Tras lanzar una, la siguiente sube y entra otra por debajo. */
  #reponer() {
    this.cartas.shift();
    const siguiente = this.orden[this.van + this.cartas.length];
    if (siguiente !== undefined) {
      const c = this.#carta(siguiente);
      this.mazo.prepend(c);
      this.cartas.push(c);
    }
    this.cartas.forEach((c, k) => {
      setVars(c, { "--i": String(k) });
      c.classList.toggle("is-arriba", k === 0);
    });
  }

  #contar() {
    const n = this.orden.length;
    const g = this.guardadas.size;
    if (this.soloFavoritas) this.cuenta.textContent = this.van < n ? `guardada ${this.van + 1} de ${n}` : "ésas son tus guardadas";
    else this.cuenta.textContent = this.van < n ? `${this.van + 1} de ${n}` : `las ${n}, leídas`;
    this.guardadasEl.textContent = g ? ` · ${g} guardada${g === 1 ? "" : "s"}` : "";
    this.botonGuardadas.hidden = !g;
    setVars(this.barra, { "--p": (Math.min(this.van, n) / Math.max(1, n)).toFixed(4) });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  El dedo
  // ═══════════════════════════════════════════════════════════════════

  #bind() {
    let carta = null;
    this.addGestures(
      new Gestures(
        this.mazo,
        {
          onPanStart: () => {
            carta = this.cartas[0];
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
          onDoubleTap: (e) => this.#guardar(e),
        },
        { axis: "free", exclusive: true, threshold: 6 }
      )
    );
  }

  #guardar(e) {
    const carta = this.cartas[0];
    if (!carta) return;
    const i = Number(carta.dataset.i);
    const g = this.guardadas;
    const ya = g.has(i);
    if (ya) g.delete(i);
    else g.add(i);
    this.ctx.store.set("razonesGuardadas", [...g]);
    carta.classList.toggle("is-guardada", !ya);
    if (!ya) {
      carta.classList.remove("is-estampa");
      void carta.offsetWidth;
      carta.classList.add("is-estampa");
      this.corazon(e.x, e.y);
      this.ctx.haptics.play("secret");
    } else this.ctx.haptics.play("tap");
    this.#contar();
  }

  #lanzar(lado) {
    const carta = this.cartas[0];
    if (!carta) return;
    carta.classList.add("is-volando");
    carta.style.transform = `translate(${lado * 130}vw, -8vh) rotate(${lado * 28}deg)`;
    this.feedback("turn", "tick", { volume: 0.35, rate: 1.5 });
    this.later(() => carta.remove(), 560);
    this.van++;
    this.#reponer();
    this.#recordar();
    this.#contar();

    if (!this.soloFavoritas && HITOS[this.van]) this.ctx.ui?.toast?.(HITOS[this.van], 3200);

    if (this.van >= this.orden.length) {
      this.root.classList.add("is-acabado");
      if (!this.soloFavoritas) this.unlockSecret();
      const r = this.mazo.getBoundingClientRect();
      for (let k = 0; k < 6; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + r.height / 2), k * 120);
    }
  }
}
