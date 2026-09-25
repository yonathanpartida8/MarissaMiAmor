/**
 * FARO — aunque esté oscuro.
 *
 * Un mar de noche, un faro en la orilla y un barquito perdido que casi no
 * se ve. Se mueve la luz del faro con el dedo; cuando lo alumbra un
 * momento, el barquito enciende su farolito y navega hasta la orilla
 * siguiendo la luz. Entonces sale el texto.
 *
 * Escondido: tocar el faro tres veces, y parpadea tres veces: te a-mo.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";
import { clamp, damp } from "../../utils/math.js";

const GRADOS = 180 / Math.PI;
const ACIERTO = 6; // grados de margen para alumbrarlo
const HACE_FALTA = 0.6; // segundos alumbrándolo

/** Diferencia entre dos ángulos, en grados, siempre entre -180 y 180. */
const giro = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;

function dibujarFaro() {
  const franja = (y1, y2) => {
    const h = (y) => 6 + ((y - 50) / 80) * 4;
    return svg("polygon", { class: "fa__franja", points: `${30 - h(y1)},${y1} ${30 + h(y1)},${y1} ${30 + h(y2)},${y2} ${30 - h(y2)},${y2}` });
  };
  return svg("svg", { class: "fa__faro", viewBox: "0 0 60 150", "aria-hidden": "true" }, [
    svg("path", { class: "fa__roca", d: "M-6,150 C2,134 14,127 30,129 C46,127 58,134 66,150Z" }),
    svg("path", { class: "fa__torre", d: "M20,131 L24,50 L36,50 L40,131Z" }),
    franja(66, 78),
    franja(96, 108),
    svg("path", { class: "fa__puerta", d: "M27,131 L27,122 Q30,118 33,122 L33,131Z" }),
    svg("rect", { class: "fa__balcon", x: "18", y: "46", width: "24", height: "4", rx: "1" }),
    svg("rect", { class: "fa__cristal", x: "23", y: "32", width: "14", height: "14", rx: "1.5" }),
    svg("circle", { class: "fa__lampara", cx: "30", cy: "39", r: "4" }),
    svg("path", { class: "fa__techo", d: "M20,32.5 L30,21 L40,32.5Z" }),
    svg("circle", { class: "fa__punta", cx: "30", cy: "20", r: "1.6" }),
  ]);
}

function dibujarBarco() {
  return svg("svg", { class: "fa__barco", viewBox: "0 0 60 50", "aria-hidden": "true" }, [
    svg("line", { class: "fa__mastil", x1: "30", y1: "5", x2: "30", y2: "35" }),
    svg("path", { class: "fa__vela", d: "M31.5,7 L31.5,32 L51,32Z" }),
    svg("path", { class: "fa__vela fa__vela--chica", d: "M28.5,12 L28.5,32 L13,32Z" }),
    svg("path", { class: "fa__casco", d: "M5,34 L55,34 L47,44 L13,44Z" }),
    svg("circle", { class: "fa__farolito", cx: "21", cy: "38.5", r: "2" }),
  ]);
}

export default class FaroPage extends BasePage {
  static type = "faro";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.faro", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    const estrellas = el("div.fa__estrellas", { "aria-hidden": "true" });
    let semilla = 11;
    const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 34; k++) {
      const e = el("span.fa__estrella");
      setVars(e, {
        "--x": `${(azar() * 100).toFixed(1)}%`,
        "--y": `${(azar() * 46).toFixed(1)}%`,
        "--t": (0.6 + azar() * 1.4).toFixed(2),
        "--d": `${(azar() * 4).toFixed(2)}s`,
      });
      estrellas.append(e);
    }
    const ola = (k) => el(`div.fa__ola.fa__ola--${k}`, { "aria-hidden": "true" }, [
      svg("svg", { viewBox: "0 0 400 20", preserveAspectRatio: "none" }, [
        svg("path", { d: "M0,10 Q25,3 50,10 T100,10 T150,10 T200,10 T250,10 T300,10 T350,10 T400,10" }),
      ]),
    ]);

    this.faro = dibujarFaro();
    this.barco = dibujarBarco();
    this.barcoCaja = el("div.fa__barco-caja", {}, [this.barco]);
    this.haz = el("div.fa__haz", { "aria-hidden": "true" });
    this.halo = el("div.fa__halo", { "aria-hidden": "true" });
    this.mar = el("div.fa__mar", { "data-claim-drag": "", role: "slider", "aria-label": "Mueve la luz del faro" }, [
      estrellas,
      el("div.fa__horizonte", { "aria-hidden": "true" }),
      ola(1),
      this.barcoCaja,
      ola(2),
      this.haz,
      this.halo,
      el("div.fa__faro-caja", {}, [this.faro]),
      ola(3),
    ]);

    this.root.append(
      el("header.fa__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.fa__title.escena__title", { text: ch?.title || "" }),
      ]),
      this.mar,
      el("div.fa__texto.hueco-barra", {}, [
        el("p.fa__guia.escena__nota", { text: "arrastra la luz por el mar" }),
        el("p.fa__cuerpo", { text: ch?.text || "" }),
        el("p.fa__reveal.escena__reveal", { text: ch?.reveal || "" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.angulo === undefined) {
      this.angulo = -140;
      this.meta = -140;
      this.alumbrado = 0;
    }
    this.controla = false;
    this.toquesFaro = 0;

    const apuntar = (e) => {
      const l = this.#lampara();
      this.meta = Math.atan2(e.y - l.y, e.x - l.x) * GRADOS;
      this.controla = true;
      this.ultimoToque = performance.now();
    };
    this.addGestures(
      new Gestures(
        this.mar,
        {
          onDown: (e) => {
            if (this.#tocaFaro(e)) return;
            apuntar(e);
          },
          onPan: apuntar,
        },
        { axis: "free", exclusive: true, threshold: 2 }
      )
    );

    const medir = () => {
      const m = this.mar.getBoundingClientRect();
      const l = this.#lampara();
      setVars(this.mar, { "--lx": `${(l.x - m.left).toFixed(1)}px`, "--ly": `${(l.y - m.top).toFixed(1)}px` });
    };
    medir();
    this.later(medir, 400);
    this.track(this.ctx.viewport.on("resize", medir));
    this.addTicker((dt, time) => this.#tick(dt, time));
  }

  #lampara() {
    const r = this.faro.querySelector(".fa__lampara").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  #tocaFaro(e) {
    const r = this.faro.getBoundingClientRect();
    if (e.x < r.left - 6 || e.x > r.right + 6 || e.y < r.top - 6 || e.y > r.bottom) return false;
    this.ctx.haptics.play("tap");
    if (++this.toquesFaro % 3 === 0) {
      this.root.classList.remove("is-destellos");
      void this.root.offsetWidth;
      this.root.classList.add("is-destellos");
      this.later(() => this.root.classList.remove("is-destellos"), 2200);
      this.escondite("faro-destellos", "Tres destellos: te a-mo.", { x: e.x, y: e.y });
    }
    return true;
  }

  #tick(dt, time) {
    const l = this.#lampara();
    const b = this.barco.getBoundingClientRect();
    const alBarco = Math.atan2(b.top + b.height * 0.6 - l.y, b.left + b.width / 2 - l.x) * GRADOS;

    if (this.hallado) {
      // Ya lo encontró: la luz lo acompaña hasta la orilla.
      this.meta = alBarco;
    } else if (!this.controla || performance.now() - (this.ultimoToque || 0) > 6000) {
      // Mientras nadie la toca, la luz barre despacio el cielo.
      this.controla = false;
      this.meta = -140 + Math.sin(time * 0.45) * 26;
    }

    this.angulo += giro(this.meta, this.angulo) * (1 - Math.exp(-(this.hallado ? 6 : 9) * dt));
    const lejos = Math.abs(giro(alBarco, this.angulo));
    const luz = clamp(1 - lejos / 16, 0, 1);

    if (!this.hallado) {
      this.alumbrado = lejos < ACIERTO && this.controla ? this.alumbrado + dt : Math.max(0, this.alumbrado - dt * 2);
      if (this.alumbrado >= HACE_FALTA) this.#hallar();
    }
    this.luzBarco = damp(this.luzBarco || 0, this.hallado ? 1 : luz, 8, dt);
    setVars(this.mar, { "--ang": `${this.angulo.toFixed(2)}deg`, "--luz": this.luzBarco.toFixed(3) });
  }

  #hallar() {
    this.hallado = true;
    this.root.classList.add("is-hallado");
    this.feedback("open", "secret", { volume: 0.35 });
    // Del sitio donde estaba, hasta el pie del faro.
    this.later(() => this.root.classList.add("is-rumbo"), 700);
    this.later(() => {
      this.root.classList.add("is-orilla");
      this.unlockSecret();
      const r = this.barco.getBoundingClientRect();
      for (let k = 0; k < 4; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top), k * 160);
    }, 700 + 4200);
  }
}
