/**
 * GRACIAS — la última página de todas.
 *
 * Un «te amo» grande, las gracias por leerlo todo con tanto detalle y la
 * promesa de más páginas. Al llegar entra DE UNA —sin fundido—
 * `musica final/musicafinal.mp3`, en bucle, como nueva música principal
 * (hasta recargar). Tocar la pantalla suelta corazones.
 */

import { BasePage } from "../BasePage.js";
import { el, setVars, svgEl as svg } from "../../utils/dom.js";
import contenido from "../../data/contenido.js";

const TEXTOS = {
  arriba: "para ti, mi amor",
  titulo: "Te amo",
  cuerpo: "Muchas gracias por revisar todo a detalle, prometo hacerte más páginas seguido.",
  emoji: "🥹🤍",
  fin: "por ahora, aquí termina",
  pie: "toca la pantalla",
};

function corazon() {
  return svg("svg", { class: "gr__corazon", viewBox: "0 0 100 90", "aria-hidden": "true" }, [
    svg("defs", {}, [
      svg("linearGradient", { id: "gr-grad", x1: "0", y1: "0", x2: "1", y2: "1" }, [
        svg("stop", { offset: "0", "stop-color": "#ffb3d1" }),
        svg("stop", { offset: "0.55", "stop-color": "#ff6fa5" }),
        svg("stop", { offset: "1", "stop-color": "#b36ad8" }),
      ]),
    ]),
    svg("path", {
      fill: "url(#gr-grad)",
      d: "M50 86 C22 66 4 50 4 28 C4 13 16 3 29 3 C39 3 46 9 50 17 C54 9 61 3 71 3 C84 3 96 13 96 28 C96 50 78 66 50 86Z",
    }),
    svg("path", { class: "gr__brillo", d: "M22 18 C27 12 35 11 40 15", fill: "none" }),
  ]);
}

export default class GraciasPage extends BasePage {
  static type = "gracias";

  build() {
    this.root = el("section.page.gracias", { "data-page": this.id, "aria-label": TEXTOS.titulo });
    setVars(this.root, { "--accent": this.palette.a });

    const aurora = el("div.gr__aurora", { "aria-hidden": "true" }, [el("i"), el("i"), el("i")]);
    const brillos = el("div.gr__brillos", { "aria-hidden": "true" });
    for (let k = 0; k < 22; k++) {
      const b = el("i", { text: k % 3 ? "✦" : "♥" });
      setVars(b, {
        "--x": `${(k * 47) % 100}%`,
        "--t": `${(9 + (k % 5) * 1.7).toFixed(1)}s`,
        "--d": `${(-k * 0.8).toFixed(1)}s`,
        "--s": (0.6 + ((k * 7) % 6) / 10).toFixed(2),
        "--c": ["#ffb3d1", "#ffd59a", "#d9bdff", "#bff3e6"][k % 4],
      });
      brillos.append(b);
    }

    this.root.append(
      aurora,
      brillos,
      el("div.gr__carta.lectura.hueco-barra", {}, [
        el("span.gr__arriba", { text: TEXTOS.arriba }),
        el("div.gr__latido", {}, [el("span.gr__onda"), el("span.gr__onda.gr__onda--2"), corazon()]),
        el("h2.gr__titulo", { text: TEXTOS.titulo }),
        el("div.gr__filete", { "aria-hidden": "true" }, [el("i"), el("b", { text: "❦" }), el("i")]),
        el("p.gr__cuerpo", { text: TEXTOS.cuerpo }),
        el("p.gr__emoji", { text: TEXTOS.emoji }),
        el("p.gr__fin", { text: TEXTOS.fin }),
        el("p.gr__pie", { text: TEXTOS.pie }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    const final = contenido?.sonidos?.final;
    if (final) this.ctx.audio?.cambiarMusica?.(final.split("/").map(encodeURIComponent).join("/"), 0);
    this.on(this.root, "pointerdown", (e) => {
      this.ctx.haptics?.play?.("tap");
      for (let k = 0; k < 3; k++) this.later(() => this.corazon(e.clientX + (k - 1) * 16, e.clientY - k * 8), k * 90);
    });
  }
}
