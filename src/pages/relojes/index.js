/**
 * RELOJES — tu reloj y el mío, cada uno a su hora.
 *
 * Se gira la manecilla larga del tuyo (una vuelta, una hora) hasta que
 * marque la misma hora que el mío: las 8:23, como nuestro 23 del 8. Al
 * coincidir, los dos relojes se juntan en uno solo y los segunderos laten
 * a la vez.
 *
 * Escondido: dejar tu reloj en las 3:00, nuestra hora rara, y sale la luna.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";

const DIA = 12 * 60;
const MIA = 8 * 60 + 23; // 8:23 · 23/08
const INICIO = 5 * 60 + 40;
const TRES = 3 * 60;
const TOLERANCIA = 3; // minutos de margen al soltar

const vuelta = (m) => ((m % DIA) + DIA) % DIA;
const distancia = (a, b) => {
  const d = Math.abs(vuelta(a) - vuelta(b));
  return Math.min(d, DIA - d);
};
const hora = (m) => {
  const v = vuelta(Math.round(m));
  const h = Math.floor(v / 60) || 12;
  return `${h}:${String(v % 60).padStart(2, "0")}`;
};

/** La esfera de un reloj, con sus tres manecillas. */
function esfera(quien) {
  const marcas = [];
  for (let k = 0; k < 60; k++) {
    const larga = k % 5 === 0;
    marcas.push(svg("line", {
      class: larga ? "rel__marca rel__marca--hora" : "rel__marca",
      x1: "100", y1: larga ? "14" : "16", x2: "100", y2: larga ? "25" : "20",
      transform: `rotate(${k * 6} 100 100)`,
    }));
  }
  const numero = (t, x, y) => svg("text", { class: "rel__numero", x, y, "text-anchor": "middle", "dominant-baseline": "central", text: t });
  const aguja = (tipo, largo) => svg("line", { class: `rel__aguja rel__aguja--${tipo}`, x1: "100", y1: String(100 + largo * 0.18), x2: "100", y2: String(100 - largo) });

  const horas = aguja("hora", 46);
  const minutos = aguja("minuto", 70);
  const segundos = aguja("segundo", 76);
  const lienzo = svg("svg", { class: `rel__esfera rel__esfera--${quien}`, viewBox: "0 0 200 200", "aria-hidden": "true" }, [
    svg("circle", { class: "rel__cara", cx: "100", cy: "100", r: "92" }),
    svg("circle", { class: "rel__bisel", cx: "100", cy: "100", r: "92" }),
    svg("g", { class: "rel__marcas" }, marcas),
    svg("g", { class: "rel__numeros" }, [numero("12", 100, 38), numero("3", 162, 100), numero("6", 100, 162), numero("9", 38, 100)]),
    svg("path", { class: "rel__luna", transform: "translate(100 64)", d: "M4,-10.2 A11,11 0 1 0 4,10.2 A8.5,8.5 0 1 1 4,-10.2Z" }),
    horas,
    minutos,
    segundos,
    svg("circle", { class: "rel__eje", cx: "100", cy: "100", r: "4.2" }),
  ]);
  return { lienzo, horas, minutos, segundos };
}

export default class RelojesPage extends BasePage {
  static type = "relojes";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.relojes", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--junta": "0px" });

    this.tuyo = esfera("tuya");
    this.mio = esfera("mia");
    this.tuHora = el("span.rel__digital");
    this.miHora = el("span.rel__digital", { text: hora(MIA) });

    this.relojTuyo = el("figure.rel__reloj.rel__reloj--tuyo", {}, [
      el("div.rel__giro", { "data-claim-drag": "", role: "slider", "aria-label": "Tu reloj: gira la manecilla larga", "aria-valuetext": "" }, [this.tuyo.lienzo]),
      el("figcaption.rel__pie", {}, [el("span.rel__quien.escena__nota", { text: "tu hora" }), this.tuHora]),
    ]);
    this.relojMio = el("figure.rel__reloj.rel__reloj--mio", {}, [
      this.mio.lienzo,
      el("figcaption.rel__pie", {}, [
        el("span.rel__quien.escena__nota", { text: "la mía" }),
        this.miHora,
        el("span.rel__nuestra.escena__nota", { text: "8:23 · como nuestro 23 del 8" }),
      ]),
    ]);

    this.root.append(
      el("header.rel__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.rel__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.rel__mesa", {}, [this.relojTuyo, this.relojMio]),
      el("div.rel__texto.hueco-barra", {}, [
        el("p.rel__guia.escena__nota", { text: "gira la manecilla larga" }),
        el("p.rel__cuerpo", { text: ch?.text || "" }),
        el("p.rel__reveal.escena__reveal", { text: ch?.reveal || "" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.minutos === undefined) this.minutos = INICIO;
    this.#manecillas(this.mio, MIA);
    this.#pintar(this.minutos);

    let prev = null;
    const centro = () => {
      const r = this.tuyo.lienzo.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const angulo = (e) => {
      const c = centro();
      return Math.atan2(e.y - c.y, e.x - c.x);
    };
    this.addGestures(
      new Gestures(
        this.relojTuyo.querySelector(".rel__giro"),
        {
          onPanStart: (e) => {
            if (this.juntos) return;
            prev = angulo(e);
            this.root.classList.add("is-girando");
          },
          onPan: (e) => {
            if (this.juntos || prev === null) return;
            const a = angulo(e);
            let d = a - prev;
            if (d > Math.PI) d -= Math.PI * 2;
            if (d < -Math.PI) d += Math.PI * 2;
            prev = a;
            const antes = this.minutos;
            this.minutos += (d / (Math.PI * 2)) * 60;
            if (Math.floor(antes / 5) !== Math.floor(this.minutos / 5)) this.ctx.haptics.play("tick");
            this.#pintar(this.minutos);
          },
          onPanEnd: () => {
            prev = null;
            this.root.classList.remove("is-girando");
            this.#soltar();
          },
        },
        { axis: "free", exclusive: true, threshold: 2 }
      )
    );

    // Los segunderos van con el reloj de verdad.
    this.addTicker(() => this.#segundos());
  }

  /** Pone las manecillas de un reloj a una hora (en minutos desde las 12). */
  #manecillas(reloj, m) {
    const v = vuelta(m);
    reloj.minutos.setAttribute("transform", `rotate(${((v % 60) * 6).toFixed(2)} 100 100)`);
    reloj.horas.setAttribute("transform", `rotate(${((v / 60) * 30).toFixed(2)} 100 100)`);
  }

  #pintar(m) {
    this.#manecillas(this.tuyo, m);
    this.tuHora.textContent = hora(m);
    this.relojTuyo.querySelector(".rel__giro").setAttribute("aria-valuetext", hora(m));
    const cerca = !this.juntos && distancia(m, MIA) <= TOLERANCIA;
    if (cerca && !this.cerca) this.ctx.haptics.play("tap");
    this.cerca = cerca;
    this.root.classList.toggle("is-cerca", cerca);
  }

  #segundos() {
    const ahora = new Date();
    const s = ahora.getSeconds() + ahora.getMilliseconds() / 1000;
    // Mientras no coinciden, el tuyo va medio minuto desfasado del mío.
    const tuyo = this.juntos ? s : (s + 30) % 60;
    const paso = (x) => Math.floor(x) + Math.min(1, (x % 1) * 7); // tic, no deslizamiento
    this.mio.segundos.setAttribute("transform", `rotate(${(paso(s) * 6).toFixed(1)} 100 100)`);
    this.tuyo.segundos.setAttribute("transform", `rotate(${(paso(tuyo) * 6).toFixed(1)} 100 100)`);
  }

  #soltar() {
    if (this.juntos) return;
    if (distancia(this.minutos, MIA) <= TOLERANCIA) {
      this.minutos = MIA;
      this.#pintar(MIA);
      this.#juntar();
      return;
    }
    if (distancia(this.minutos, TRES) <= 2) {
      this.root.classList.add("is-luna");
      this.escondite("relojes-tres", "Las 3:00. A esa hora el mundo se calla y nosotros seguimos platicando.");
    } else {
      this.root.classList.remove("is-luna");
    }
  }

  #juntar() {
    this.juntos = true;
    this.root.classList.remove("is-luna", "is-cerca");
    const a = this.tuyo.lienzo.getBoundingClientRect();
    const b = this.mio.lienzo.getBoundingClientRect();
    setVars(this.root, { "--junta": `${((b.left - a.left) / 2).toFixed(1)}px` });
    this.root.classList.add("is-juntos");
    this.feedback("open", "secret", { volume: 0.4 });
    this.unlockSecret();
    this.later(() => {
      const r = this.mio.lienzo.getBoundingClientRect();
      for (let k = 0; k < 5; k++) this.later(() => this.corazon(r.left, r.top + r.height * 0.3), k * 150);
    }, 900);
  }
}
