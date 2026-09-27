/**
 * RELOJES — tu reloj y el mío, con dos horas de diferencia.
 *
 * El tuyo marca la hora de tu teléfono; el mío, la de acá, que va
 * `diferenciaHoras` por delante (lo dice el capítulo, en `chapters.js`).
 * Se gira la manecilla larga del tuyo (una vuelta, una hora) hasta ponerlo
 * a mi hora: mientras giras, te dice cuánto te falta. Al coincidir, los dos
 * relojes se juntan en uno y los segunderos laten a la vez.
 *
 * Escondidos: dejar tu reloj en las 8:23 (como nuestro 23 del 8) o en las
 * 3:00, nuestra hora rara, que saca la luna.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";

const DIA = 12 * 60;
const OCHO23 = 8 * 60 + 23; // 8:23 · 23/08
const TRES = 3 * 60;
const TOLERANCIA = 4; // minutos de margen al soltar

const vuelta = (m) => ((m % DIA) + DIA) % DIA;
const distancia = (a, b) => {
  const d = Math.abs(vuelta(a) - vuelta(b));
  return Math.min(d, DIA - d);
};
/** Diferencia con signo más corta en la esfera (de -6 h a +6 h). */
const falta = (a, b) => {
  let d = vuelta(b - a);
  if (d > DIA / 2) d -= DIA;
  return d;
};
const ahoraMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
};
/** 14:05 → «2:05 p. m.» (en minutos desde medianoche, 24 h). */
const hora = (m) => {
  const v = ((Math.floor(m) % 1440) + 1440) % 1440;
  const h24 = Math.floor(v / 60);
  const h = h24 % 12 || 12;
  return `${h}:${String(v % 60).padStart(2, "0")} ${h24 < 12 ? "a. m." : "p. m."}`;
};
const momento = (m) => {
  const h = Math.floor((((m % 1440) + 1440) % 1440) / 60);
  if (h < 5) return { icono: "🌙", dice: "acá ya es de madrugada… nuestra hora rara" };
  if (h < 12) return { icono: "☀️", dice: "acá ya es de mañana y ya te estoy pensando" };
  if (h < 19) return { icono: "🌤️", dice: "acá es de tarde y te extraño igualito" };
  return { icono: "🌙", dice: "acá ya es de noche, ¿ya cenaste, mi amor?" };
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
    this.dif = (Number(ch?.diferenciaHoras) || 2) * 60;
    this.root = el("section.page.relojes", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--junta": "0px" });

    this.tuyo = esfera("tuya");
    this.mio = esfera("mia");
    this.tuHora = el("span.rel__digital");
    this.miHora = el("span.rel__digital");
    this.miIcono = el("span.rel__icono");
    this.tuIcono = el("span.rel__icono");

    this.relojTuyo = el("figure.rel__reloj.rel__reloj--tuyo", {}, [
      el("div.rel__giro", { "data-claim-drag": "", role: "slider", "aria-label": "Tu reloj: gira la manecilla larga", "aria-valuetext": "" }, [this.tuyo.lienzo]),
      el("figcaption.rel__pie", {}, [el("span.rel__quien.escena__nota", {}, [this.tuIcono, " tu hora · allá"]), this.tuHora]),
    ]);
    this.relojMio = el("figure.rel__reloj.rel__reloj--mio", {}, [
      this.mio.lienzo,
      el("figcaption.rel__pie", {}, [(this.miQuien = el("span.rel__quien.escena__nota", {}, [this.miIcono, " la mía · acá"])), this.miHora]),
    ]);

    const h = Math.abs(this.dif / 60);
    this.guia = el("p.rel__guia.escena__nota", { text: `gira la manecilla larga: mi reloj va ${h} ${h === 1 ? "hora" : "horas"} ${this.dif >= 0 ? "adelante" : "atrás"}` });
    this.faltaEl = el("p.rel__falta");
    this.momentoEl = el("p.rel__momento.escena__nota");

    this.root.append(
      el("header.rel__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.rel__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.rel__mesa", {}, [this.relojTuyo, el("span.rel__puente", { "aria-hidden": "true" }, [el("i"), el("b", { text: `${this.dif >= 0 ? "+" : "−"}${h} h` }), el("i")]), this.relojMio]),
      el("div.rel__texto.hueco-barra", {}, [
        this.faltaEl,
        this.guia,
        this.momentoEl,
        el("p.rel__cuerpo", { text: ch?.text || "" }),
        el("p.rel__reveal.escena__reveal", { text: ch?.reveal || "" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    // Cuánto ha girado ella su reloj, en minutos (empieza en su hora real).
    if (this.ajuste === undefined) this.ajuste = 0;
    this.#pintar();

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
            const antes = this.ajuste;
            this.ajuste += (d / (Math.PI * 2)) * 60;
            if (Math.floor(antes / 5) !== Math.floor(this.ajuste / 5)) this.ctx.haptics.play("tick");
            if (Math.floor(antes / 60) !== Math.floor(this.ajuste / 60)) this.ctx.haptics.play("tap");
            this.#pintar();
          },
          onPanEnd: () => {
            prev = null;
            this.root.classList.remove("is-girando");
            this.#soltar();
          },
          onTap: (e) => {
            if (this.juntos) this.corazon(e.x, e.y, "misma hora 🤍");
          },
        },
        { axis: "free", exclusive: true, threshold: 2 }
      )
    );

    // Los relojes van con la hora de verdad.
    this.addTicker(() => this.#latido());
  }

  /** Pone las manecillas de un reloj a una hora (en minutos desde las 12). */
  #manecillas(reloj, m) {
    const v = vuelta(m);
    reloj.minutos.setAttribute("transform", `rotate(${((v % 60) * 6).toFixed(2)} 100 100)`);
    reloj.horas.setAttribute("transform", `rotate(${((v / 60) * 30).toFixed(2)} 100 100)`);
  }

  #pintar() {
    const ahora = ahoraMin();
    const mia = ahora + this.dif;
    const tuya = this.juntos ? mia : ahora + this.ajuste;
    this.#manecillas(this.mio, mia);
    this.#manecillas(this.tuyo, tuya);
    const tuTexto = hora(tuya), miTexto = hora(mia);
    if (tuTexto !== this.tuTexto) { this.tuTexto = tuTexto; this.tuHora.textContent = tuTexto; }
    if (miTexto !== this.miTexto) { this.miTexto = miTexto; this.miHora.textContent = miTexto; }
    const mm = momento(mia), tm = momento(ahora);
    this.miIcono.textContent = mm.icono;
    this.tuIcono.textContent = tm.icono;
    if (this.momentoEl.textContent !== mm.dice) this.momentoEl.textContent = mm.dice;
    this.relojTuyo.querySelector(".rel__giro").setAttribute("aria-valuetext", tuTexto);

    if (this.juntos) return;
    const f = falta(this.ajuste, this.dif);
    const cerca = Math.abs(f) <= TOLERANCIA;
    if (cerca && !this.cerca) this.ctx.haptics.play("tap");
    this.cerca = cerca;
    this.root.classList.toggle("is-cerca", cerca);
    const txt = cerca
      ? "¡ya casi! suéltalo 🥹"
      : this.ajuste === 0
        ? ""
        : `te ${Math.abs(f) >= 90 ? "faltan" : "falta"} ${Math.floor(Math.abs(f) / 60) ? `${Math.floor(Math.abs(f) / 60)} h ` : ""}${Math.round(Math.abs(f) % 60)} min ${f > 0 ? "hacia adelante" : "hacia atrás"}`;
    if (this.faltaEl.textContent !== txt) this.faltaEl.textContent = txt;
  }

  #latido() {
    const ahora = new Date();
    const s = ahora.getSeconds() + ahora.getMilliseconds() / 1000;
    // Mientras no coinciden, el tuyo va medio minuto desfasado del mío.
    const tuyo = this.juntos ? s : (s + 30) % 60;
    const paso = (x) => Math.floor(x) + Math.min(1, (x % 1) * 7); // tic, no deslizamiento
    this.mio.segundos.setAttribute("transform", `rotate(${(paso(s) * 6).toFixed(1)} 100 100)`);
    this.tuyo.segundos.setAttribute("transform", `rotate(${(paso(tuyo) * 6).toFixed(1)} 100 100)`);
    if (Math.floor(s) !== this.ultimoSeg) {
      this.ultimoSeg = Math.floor(s);
      this.#pintar();
    }
  }

  #soltar() {
    if (this.juntos) return;
    if (Math.abs(falta(this.ajuste, this.dif)) <= TOLERANCIA) {
      this.ajuste = this.dif;
      this.#juntar();
      return;
    }
    const tuya = ahoraMin() + this.ajuste;
    if (distancia(tuya, OCHO23) <= 2) {
      this.escondite("relojes-823", "8:23… como nuestro 23 del 8. Esa hora también es nuestra 🤍");
    }
    if (distancia(tuya, TRES) <= 2) {
      this.root.classList.add("is-luna");
      this.escondite("relojes-tres", "Las 3:00. A esa hora el mundo se calla y nosotros seguimos platicando.");
    } else {
      this.root.classList.remove("is-luna");
    }
  }

  #juntar() {
    this.juntos = true;
    this.root.classList.remove("is-luna", "is-cerca");
    this.faltaEl.textContent = "misma hora, mismo ratito 🤍";
    this.miQuien.replaceChildren("🤍 la de los dos");
    this.#pintar();
    const a = this.tuyo.lienzo.getBoundingClientRect();
    const b = this.mio.lienzo.getBoundingClientRect();
    setVars(this.root, { "--junta": `${((b.left - a.left) / 2).toFixed(1)}px` });
    this.root.classList.add("is-juntos");
    this.feedback("open", "secret", { volume: 0.4 });
    this.unlockSecret();
    this.later(() => {
      const r = this.mio.lienzo.getBoundingClientRect();
      for (let k = 0; k < 6; k++) this.later(() => this.corazon(r.left + (Math.random() - 0.5) * 40, r.top + r.height * 0.3), k * 150);
    }, 900);
  }
}
