/**
 * GRACIAS — la última página de todas.
 *
 * Un «te amo» grande, las gracias por leerlo todo con tanto detalle y la
 * promesa de más páginas. Al llegar, la canción del libro se va con un
 * fundido y entra `musica final/musicafinal.mp3`, en bucle, como nueva
 * música principal (hasta recargar). Tocar la pantalla suelta corazones.
 */

import { BasePage } from "../BasePage.js";
import { el, setVars } from "../../utils/dom.js";
import contenido from "../../data/contenido.js";

const TEXTOS = {
  arriba: "por ahora, aquí termina",
  titulo: "Te amo",
  cuerpo: "Muchas gracias por revisar todo a detalle, prometo hacerte más páginas seguido.",
  emoji: "🥹🤍",
  pie: "toca la pantalla",
};

export default class GraciasPage extends BasePage {
  static type = "gracias";

  build() {
    this.root = el("section.page.gracias", { "data-page": this.id, "aria-label": TEXTOS.titulo });
    setVars(this.root, { "--accent": this.palette.a });
    const brillos = el("div.gr__brillos", { "aria-hidden": "true" });
    for (let k = 0; k < 18; k++) {
      const b = el("i", { text: k % 3 ? "✦" : "♥" });
      setVars(b, {
        "--x": `${(k * 53) % 100}%`,
        "--t": `${(8 + (k % 5) * 1.6).toFixed(1)}s`,
        "--d": `${(-k * 0.9).toFixed(1)}s`,
        "--s": (0.6 + ((k * 7) % 6) / 10).toFixed(2),
      });
      brillos.append(b);
    }
    this.root.append(
      brillos,
      el("div.gr__carta.lectura.hueco-barra", {}, [
        el("span.gr__arriba", { text: TEXTOS.arriba }),
        el("h2.gr__titulo", { text: TEXTOS.titulo }),
        el("div.gr__latido", { "aria-hidden": "true", text: "♥" }),
        el("p.gr__cuerpo", { text: TEXTOS.cuerpo }),
        el("p.gr__emoji", { text: TEXTOS.emoji }),
        el("p.gr__pie", { text: TEXTOS.pie }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    const final = contenido?.sonidos?.final;
    if (final) this.ctx.audio?.cambiarMusica?.(final.split("/").map(encodeURIComponent).join("/"));
    this.on(this.root, "pointerdown", (e) => {
      this.ctx.haptics?.play?.("tap");
      for (let k = 0; k < 3; k++) this.later(() => this.corazon(e.clientX + (k - 1) * 14, e.clientY - k * 6), k * 90);
    });
  }
}
