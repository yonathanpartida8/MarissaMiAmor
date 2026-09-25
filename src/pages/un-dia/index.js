/**
 * UN DÍA — un día cualquiera contigo.
 *
 * Un cielo sobre una casita. Al deslizar el dedo de izquierda a derecha
 * pasa el día entero: amanece, sale humo de la chimenea (el café), el sol
 * cruza, atardece, se encienden las ventanas, sale la luna y al final se
 * apagan. A cada rato del día le toca una cosa pequeña de las que quiero
 * contigo; cuando se han visto todas, sale la frase.
 *
 * Escondido: de noche, tocar la luna tres veces, y cruza una estrella fugaz.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";
import { clamp, damp, lerp, smoothstep } from "../../utils/math.js";

const DESDE = 6; // 6:00
const HASTA = 24.5; // 00:30 del día siguiente
const OCASO = 19.8;

// El color del cielo a cada hora: [hora, arriba, abajo].
const CIELO = [
  [6, "#3b2a5c", "#f3a58f"],
  [7.5, "#f2ae9f", "#ffe1c2"],
  [10, "#8fc3ea", "#e3f2fb"],
  [14, "#6fb2e6", "#d4ecfa"],
  [17, "#e3a77a", "#ffe0b0"],
  [19, "#b8567a", "#f59a78"],
  [20.5, "#3a2556", "#8a4a6e"],
  [22, "#141638", "#2f2250"],
  [24.5, "#070a22", "#161433"],
];

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mezcla = (a, b, k) => {
  const x = rgb(a);
  const y = rgb(b);
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], k))).join(",")})`;
};
function colorDelCielo(t) {
  for (let i = 0; i < CIELO.length - 1; i++) {
    const [h0, a0, b0] = CIELO[i];
    const [h1, a1, b1] = CIELO[i + 1];
    if (t <= h1) {
      const k = smoothstep(h0, h1, t);
      return [mezcla(a0, a1, k), mezcla(b0, b1, k)];
    }
  }
  const u = CIELO[CIELO.length - 1];
  return [u[1], u[2]];
}

/** 7.5 → «7:30 a. m.» */
function reloj(t) {
  let m = Math.round((t * 60) / 5) * 5;
  const h24 = Math.floor(m / 60) % 24;
  m %= 60;
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${h24 < 12 ? "a. m." : "p. m."}`;
}

export default class UnDiaPage extends BasePage {
  static type = "undia";

  build() {
    const ch = this.chapter;
    this.momentos = ch?.lines || [];
    this.root = el("section.page.undia", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    const estrellas = el("div.dia__estrellas", { "aria-hidden": "true" });
    let semilla = 5;
    const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 30; k++) {
      const e = el("span.dia__estrella");
      setVars(e, { "--x": `${(azar() * 100).toFixed(1)}%`, "--y": `${(azar() * 55).toFixed(1)}%`, "--t": (0.6 + azar()).toFixed(2), "--d": `${(azar() * 3).toFixed(2)}s` });
      estrellas.append(e);
    }

    this.sol = el("div.dia__sol", { "aria-hidden": "true" });
    this.luna = el("div.dia__luna", { "aria-hidden": "true" });
    this.fugaz = el("div.dia__fugaz", { "aria-hidden": "true" });
    this.hora = el("span.dia__hora");

    const paisaje = svg("svg", { class: "dia__paisaje", viewBox: "0 0 300 110", preserveAspectRatio: "xMidYMax slice", "aria-hidden": "true" }, [
      svg("path", { class: "dia__colina dia__colina--lejos", d: "M0,62 C40,40 80,44 120,56 C160,68 200,38 240,42 C270,45 290,52 300,56 L300,110 L0,110Z" }),
      svg("path", { class: "dia__colina dia__colina--cerca", d: "M0,84 C50,70 90,72 140,80 C190,88 240,70 300,74 L300,110 L0,110Z" }),
      // La casita
      svg("g", { class: "dia__casa", transform: "translate(186 52)" }, [
        svg("rect", { class: "dia__chimenea", x: "26", y: "2", width: "6", height: "12" }),
        svg("path", { class: "dia__techo", d: "M-4,20 L20,2 L44,20Z" }),
        svg("rect", { class: "dia__pared", x: "0", y: "19", width: "40", height: "27" }),
        svg("rect", { class: "dia__ventana dia__ventana--1", x: "5", y: "25", width: "9", height: "8", rx: "1" }),
        svg("rect", { class: "dia__ventana dia__ventana--2", x: "26", y: "25", width: "9", height: "8", rx: "1" }),
        svg("rect", { class: "dia__puerta", x: "16", y: "32", width: "8", height: "14", rx: "1" }),
      ]),
      // Un arbolito
      svg("g", { class: "dia__arbol", transform: "translate(92 62)" }, [
        svg("rect", { class: "dia__tronco", x: "-1.5", y: "8", width: "3", height: "12" }),
        svg("circle", { class: "dia__copa", cx: "0", cy: "4", r: "9" }),
        svg("circle", { class: "dia__copa", cx: "-6", cy: "9", r: "6" }),
        svg("circle", { class: "dia__copa", cx: "6", cy: "9", r: "6" }),
      ]),
    ]);
    const humo = el("div.dia__humo", { "aria-hidden": "true" }, [el("span"), el("span"), el("span")]);

    this.cielo = el("div.dia__cielo", { "data-claim-drag": "", role: "slider", "aria-label": "La hora del día", "aria-valuemin": String(DESDE), "aria-valuemax": String(HASTA) }, [
      estrellas,
      this.sol,
      this.luna,
      this.fugaz,
      paisaje,
      humo,
      this.hora,
      el("div.dia__riel", { "aria-hidden": "true" }, [el("span.dia__riel-punto")]),
    ]);

    this.momento = el("p.dia__momento", { "aria-live": "polite" });
    this.puntos = el("div.dia__puntos", { "aria-hidden": "true" }, this.momentos.map(() => el("span")));

    this.root.append(
      el("header.dia__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.dia__title.escena__title", { text: ch?.title || "" }),
      ]),
      this.cielo,
      el("div.dia__pie.hueco-barra", {}, [
        this.momento,
        this.puntos,
        el("p.dia__reveal.escena__reveal", { text: ch?.reveal || "" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.meta === undefined) {
      this.meta = DESDE + 0.4;
      this.t = DESDE;
      this.vistos = new Set();
    }
    this.toquesLuna = 0;

    const aHora = (e) => {
      const r = this.cielo.getBoundingClientRect();
      const f = clamp((e.x - r.left - r.width * 0.04) / (r.width * 0.92), 0, 1);
      this.meta = DESDE + f * (HASTA - DESDE);
    };
    this.addGestures(
      new Gestures(
        this.cielo,
        {
          onDown: (e) => {
            if (this.#tocaLuna(e)) return;
            aHora(e);
          },
          onPan: aHora,
        },
        { axis: "x", exclusive: true, threshold: 2 }
      )
    );
    this.#medir();
    this.later(() => this.#medir(), 500);
    this.track(this.ctx.viewport.on("resize", () => this.#medir()));
    this.addTicker((dt) => this.#tick(dt));
  }

  /** El humo sale de la chimenea, y la chimenea cambia de sitio según el ancho. */
  #medir() {
    const c = this.cielo.getBoundingClientRect();
    const r = this.cielo.querySelector(".dia__chimenea")?.getBoundingClientRect();
    if (!r || !c.width) return;
    setVars(this.cielo, { "--hx": `${(r.left + r.width / 2 - c.left).toFixed(1)}px`, "--hy": `${(r.top - c.top).toFixed(1)}px` });
  }

  #tocaLuna(e) {
    if (this.t < 20.5) return false;
    const r = this.luna.getBoundingClientRect();
    if (Math.hypot(e.x - (r.left + r.width / 2), e.y - (r.top + r.height / 2)) > r.width) return false;
    this.ctx.haptics.play("tap");
    if (++this.toquesLuna % 3 === 0) {
      this.fugaz.classList.remove("is-cruza");
      void this.fugaz.offsetWidth;
      this.fugaz.classList.add("is-cruza");
      this.escondite("un-dia-deseo", "Pedí un deseo: que todos los días se parezcan a éste.", { x: e.x, y: e.y });
    }
    return true;
  }

  #tick(dt) {
    const antes = this.t;
    this.t = damp(this.t, this.meta, 7, dt);
    if (Math.abs(this.meta - this.t) < 0.002) this.t = this.meta;
    if (antes === this.t && this.pintado) return;
    this.pintado = true;
    const t = this.t;

    // El cielo y el paisaje.
    const [arriba, abajo] = colorDelCielo(t);
    const noche = smoothstep(19.6, 21.6, t) + (1 - smoothstep(5.6, 6.8, t)) * 0.6;
    const luces = smoothstep(18.4, 19.6, t) * (1 - smoothstep(23.6, 24.2, t));
    const humo = 1 - smoothstep(8.5, 9.8, t);

    // El sol cruza en arco de un lado al otro; la luna sale después.
    const u = clamp((t - DESDE) / (OCASO - DESDE), 0, 1);
    const sol = { x: 6 + u * 88, y: 66 - Math.sin(u * Math.PI) * 52 };
    const calidez = 1 - Math.sin(u * Math.PI); // naranja al salir y al ponerse
    const w = clamp((t - 19.4) / 6.4, 0, 1);
    const luna = { x: 8 + w * 60, y: 64 - Math.sin(w * Math.PI * 0.62) * 46 };

    setVars(this.cielo, {
      "--arriba": arriba,
      "--abajo": abajo,
      "--noche": clamp(noche, 0, 1).toFixed(3),
      "--luces": luces.toFixed(3),
      "--humo": humo.toFixed(3),
      "--sx": `${sol.x.toFixed(2)}%`,
      "--sy": `${sol.y.toFixed(2)}%`,
      "--sol-o": (smoothstep(DESDE - 0.2, DESDE + 0.6, t) * (1 - smoothstep(OCASO - 0.5, OCASO + 0.2, t))).toFixed(3),
      "--calido": calidez.toFixed(3),
      "--lx": `${luna.x.toFixed(2)}%`,
      "--ly": `${luna.y.toFixed(2)}%`,
      "--luna-o": smoothstep(19.6, 20.6, t).toFixed(3),
      "--f": ((t - DESDE) / (HASTA - DESDE)).toFixed(4),
    });
    this.hora.textContent = reloj(t);
    this.cielo.setAttribute("aria-valuenow", t.toFixed(2));
    this.cielo.setAttribute("aria-valuetext", reloj(t));

    // A qué rato del día le toca, y lo que pasa en ese rato.
    const n = this.momentos.length;
    const i = clamp(Math.floor(((t - DESDE) / (HASTA - DESDE)) * n), 0, n - 1);
    if (i !== this.actual) {
      this.actual = i;
      this.#decir(this.momentos[i]);
      if (!this.vistos.has(i)) {
        this.vistos.add(i);
        this.ctx.haptics.play("tick");
      }
      [...this.puntos.children].forEach((p, k) => {
        p.classList.toggle("is-visto", this.vistos.has(k));
        p.classList.toggle("is-ahora", k === i);
      });
    }
    if (!this.completo && this.vistos.size === n) {
      this.completo = true;
      this.root.classList.add("is-completo");
      this.unlockSecret();
      this.later(() => this.feedback("open", "secret", { volume: 0.35 }), 400);
    }
  }

  #decir(texto = "") {
    this.momento.classList.add("is-cambia");
    clearTimeout(this.relojFrase);
    this.relojFrase = this.later(() => {
      this.momento.textContent = texto;
      this.momento.classList.remove("is-cambia");
    }, 220);
  }
}
