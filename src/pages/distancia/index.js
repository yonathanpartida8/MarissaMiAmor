/**
 * LA DISTANCIA — doblar el mapa hasta que estemos juntos.
 *
 * Un mapa de papel, con «tú» en un extremo y «yo» en el otro, una ruta
 * punteada entre los dos y un avioncito de papel que va y viene por ella.
 * Arriba, los kilómetros.
 *
 * Se arrastra cualquiera de los dos hacia el otro y EL MAPA SE DOBLA en
 * acordeón (cada tira del papel gira en 3D, con su luz y su sombra): el
 * mundo se encoge, la ruta se acorta y los kilómetros bajan. Cuesta: el
 * papel se resiste y, si se suelta antes de tiempo, vuelve a abrirse con
 * un rebote. Cuando por fin se tocan, se funden en un corazón y sale la
 * carta.
 *
 * Escondido: tirar de ellos hacia fuera, para alejarlos. Eso ni de broma.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, splitWords, setVars } from "../../utils/dom.js";
import { clamp, clamp01 } from "../../utils/math.js";
import escondidos from "../../data/escondidos.js";

const TIRAS = 6;
const KM = 2587; // lo que marca con el mapa abierto
const PIN_TU = 0.1; // dónde está cada uno en el mapa (fracción del ancho)
const PIN_YO = 0.9;
const JUNTOS = 0.1; // con el mapa cerrado a este coseno, ya se tocan

/** El mapa, dibujado una vez y copiado en cada tira. */
const MAPA = `
<svg class="orb__mapa-svg" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <radialGradient id="orb-papel" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0" stop-color="#fbf3e2"/>
      <stop offset="0.7" stop-color="#f1e2c6"/>
      <stop offset="1" stop-color="#e2cda7"/>
    </radialGradient>
  </defs>
  <rect width="600" height="300" fill="url(#orb-papel)"/>
  <g class="orb__rejilla">
    ${[50, 100, 150, 200, 250].map((y) => `<path d="M0 ${y} Q300 ${y + (y - 150) * 0.08} 600 ${y}"/>`).join("")}
    ${[75, 150, 225, 300, 375, 450, 525].map((x) => `<path d="M${x} 0 Q${x + (x - 300) * 0.06} 150 ${x} 300"/>`).join("")}
  </g>
  <g class="orb__tierra">
    <path d="M22 70 C40 42 92 36 118 58 C140 76 132 104 150 122 C168 140 150 178 118 186 C86 194 70 170 50 172 C28 174 12 150 18 128 C24 106 8 92 22 70Z"/>
    <path d="M150 214 C176 200 214 206 222 228 C230 252 204 272 176 270 C150 268 132 236 150 214Z"/>
    <path d="M250 60 C284 40 336 50 352 76 C366 100 340 116 346 138 C352 162 322 176 296 166 C270 156 262 130 244 118 C226 104 228 74 250 60Z"/>
    <path d="M396 150 C420 128 468 132 486 154 C500 172 494 200 470 214 C444 228 418 222 404 204 C390 186 382 166 396 150Z"/>
    <path d="M450 40 C488 24 548 34 572 62 C592 86 586 120 560 132 C532 144 506 128 482 118 C458 108 432 94 432 72 C432 56 438 46 450 40Z"/>
  </g>
  <g class="orb__olas">
    <path d="M200 110 q6 -5 12 0 t12 0"/><path d="M380 250 q6 -5 12 0 t12 0"/><path d="M90 250 q6 -5 12 0 t12 0"/><path d="M520 200 q6 -5 12 0 t12 0"/>
  </g>
  <g class="orb__rosa" transform="translate(560 262)">
    <path d="M0 -20 L4 0 L0 20 L-4 0Z"/><path d="M-20 0 L0 -4 L20 0 L0 4Z"/>
    <circle r="3"/>
  </g>
  <rect class="orb__borde" x="6" y="6" width="588" height="288" rx="4"/>
</svg>`;

export default class OrbitPage extends BasePage {
  static type = "orbit";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.orbit", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a, "--near": "0" });

    this.tiras = Array.from({ length: TIRAS }, (_, i) => {
      const t = el("div.orb__tira", { "aria-hidden": "true", html: MAPA });
      setVars(t, { "--i": String(i) });
      return t;
    });
    this.mapa = el("div.orb__mapa", {}, this.tiras);

    this.ruta = svg("path", { class: "orb__ruta-linea" });
    this.avion = svg("path", { class: "orb__avion", d: "M-9,-5 L10,0 L-9,5 L-5,0Z M-5,0 L10,0" });
    this.capaRuta = svg("svg", { class: "orb__ruta", "aria-hidden": "true" }, [this.ruta, this.avion]);

    this.tu = this.#pin("tú", "tu");
    this.yo = this.#pin("yo", "yo");
    this.union = el("div.orb__union", { "aria-hidden": "true" });

    this.field = el("div.orb__field", { "data-claim-drag": "" }, [this.mapa, this.capaRuta, this.union, this.tu, this.yo]);
    this.gauge = el("span.orb__gauge", { text: `${KM.toLocaleString("es")} km` });
    this.pista = el("p.orb__pista.escena__nota", { text: "al acercarnos, el mapa se dobla" });

    this.proseEl = el("div.orb__prose.selectable");
    this.proseEl.append(splitWords(ch?.text || "").frag);
    this.revealEl = el("p.orb__reveal", { text: ch?.reveal || "" });

    this.root.append(
      el("header.orb__head.entra--acerca", {}, [el("span.kicker", { text: ch?.kicker || "" }), this.gauge]),
      el("div.orb__centro", {}, [this.field, this.pista]),
      el("div.vidrio.orb__panel.hueco-barra", {}, [
        el("h2.orb__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.lectura.orb__scroll", {}, [this.proseEl]),
        this.revealEl,
      ])
    );
    return this.root;
  }

  #pin(texto, clave) {
    return el(`button.orb__pin.orb__pin--${clave}`, { type: "button", "aria-label": `Arrastra «${texto}»` }, [
      el("span.orb__pin-onda", { "aria-hidden": "true" }),
      el("span.orb__pin-gota", { "aria-hidden": "true" }),
      el("span.orb__pin-texto", { text: texto }),
    ]);
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    if (this.cos === undefined) {
      this.cos = 1; // coseno del pliegue: 1 = abierto, 0 = cerrado
      this.cosV = 0;
      this.meta = 1;
      this.joined = false;
    }
    this.agarrado = false;
    this.vuelo = 0;
    this.#medir();
    this.track(this.ctx.viewport.on("resize", () => this.#medir()));
    // El campo cambia de alto cuando sale la carta de abajo: se vuelve a
    // medir para que el mapa doblado no se salga por arriba.
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => this.#medir());
      ro.observe(this.field);
      this.track(() => ro.disconnect());
    }

    for (const [pin, lado] of [[this.tu, -1], [this.yo, 1]]) {
      this.addGestures(
        new Gestures(
          pin,
          {
            onPanStart: () => {
              if (this.joined) return;
              this.agarrado = true;
              pin.classList.add("is-held");
              this.ctx.haptics.play("tick");
            },
            onPan: (e) => {
              if (this.joined || !this.w) return;
              // Dónde quiere el dedo que esté este punto → cuánto se dobla.
              const r = this.field.getBoundingClientRect();
              const desdeCentro = (e.x - (r.left + r.width / 2)) * lado; // + hacia fuera
              const separacion = Math.max(0, desdeCentro * 2);
              const quiere = separacion / (this.w * (PIN_YO - PIN_TU));
              if (quiere > 1.12) this.escondite("distancia-al-reves", escondidos.distancia);
              this.meta = clamp(quiere, 0, 1);
            },
            onPanEnd: () => {
              pin.classList.remove("is-held");
              this.agarrado = false;
              if (!this.joined) this.meta = 1; // se suelta: el papel vuelve a abrirse
            },
          },
          { exclusive: true, threshold: 4 }
        )
      );
    }
    this.addTicker((dt) => this.#tick(Math.min(dt, 1 / 30)), 11);
  }

  #medir() {
    const r = this.field.getBoundingClientRect();
    this.w = r.width;
    this.h = r.height;
    this.capaRuta.setAttribute("viewBox", `0 0 ${this.w.toFixed(1)} ${this.h.toFixed(1)}`);
    // El mapa conserva su proporción (8:5) y se centra en el campo.
    this.mw = Math.min(this.w, this.h * 1.6);
    this.mh = this.mw / 1.6;
    setVars(this.field, { "--mw": `${this.mw.toFixed(1)}px`, "--mh": `${this.mh.toFixed(1)}px` });
  }

  #tick(dt) {
    if (!this.w) return;

    // El papel sigue al dedo con un poco de resistencia, y al soltarlo
    // vuelve a abrirse con rebote (un muelle poco amortiguado).
    const rigidez = this.agarrado ? 160 : 90;
    const freno = this.agarrado ? 22 : 9;
    // Los últimos centímetros cuestan: cerca del final el papel empuja.
    const resiste = this.agarrado ? (1 - this.cos) ** 2 * 18 : 0;
    this.cosV += ((this.meta - this.cos) * rigidez + resiste - this.cosV * freno) * dt;
    this.cos = clamp(this.cos + this.cosV * dt, 0.02, 1);
    if (this.joined) this.cos = Math.max(0.02, this.cos - dt * 0.6);

    const cos = this.cos;
    const ang = Math.acos(cos) * (180 / Math.PI);
    const ancho = this.mw * cos; // lo que ocupa el mapa doblado
    const tira = this.mw / TIRAS;
    const x0 = this.w / 2 - ancho / 2;

    this.tiras.forEach((t, i) => {
      const cx = x0 + (i + 0.5) * tira * cos;
      const sentido = i % 2 ? 1 : -1;
      // Una cara mira a la luz y la otra se queda en sombra.
      const luz = sentido > 0 ? 1 - Math.sin(ang * Math.PI / 180) * 0.38 : 1 - Math.sin(ang * Math.PI / 180) * 0.08;
      setVars(t, {
        "--cx": `${cx.toFixed(1)}px`,
        "--rot": `${(sentido * ang).toFixed(2)}deg`,
        "--luz": luz.toFixed(3),
      });
    });

    // Los dos puntos, sobre su sitio del mapa (van encima, sin deformarse).
    const y = this.h / 2 - this.mh * 0.05;
    const xTu = x0 + PIN_TU * this.mw * cos;
    const xYo = x0 + PIN_YO * this.mw * cos;
    setVars(this.tu, { "--px": `${xTu.toFixed(1)}px`, "--py": `${(y - this.mh * 0.12).toFixed(1)}px` });
    setVars(this.yo, { "--px": `${xYo.toFixed(1)}px`, "--py": `${(y + this.mh * 0.14).toFixed(1)}px` });

    // La ruta: un arco que se achica con la distancia, y el avioncito.
    const a = { x: xTu, y: y - this.mh * 0.12 };
    const b = { x: xYo, y: y + this.mh * 0.14 };
    const alto = Math.hypot(b.x - a.x, b.y - a.y) * 0.32;
    const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - alto };
    this.ruta.setAttribute("d", `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`);
    this.vuelo = (this.vuelo + dt / (1.2 + 2.2 * cos)) % 2;
    const k = this.vuelo < 1 ? this.vuelo : 2 - this.vuelo; // va y vuelve
    const q = (u) => ({
      x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
      y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
    });
    const p = q(k);
    const p2 = q(clamp01(k + (this.vuelo < 1 ? 0.01 : -0.01)));
    const giro = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI);
    this.avion.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${giro.toFixed(1)})`);

    const near = clamp01((1 - cos) / (1 - JUNTOS));
    setVars(this.root, { "--near": near.toFixed(3) });
    this.gauge.textContent = this.joined ? "0 km" : `${Math.round(KM * clamp01((cos - JUNTOS) / (1 - JUNTOS))).toLocaleString("es")} km`;

    // Crujidos del papel al pasar cada pliegue.
    const tramo = Math.floor(ang / 22);
    if (this.agarrado && tramo !== this.tramoAnterior) {
      this.tramoAnterior = tramo;
      this.ctx.haptics.scrub(near);
      this.ctx.audio.play("turn", { volume: 0.12, rate: 0.8 + near * 0.5 });
    }

    if (!this.joined && this.agarrado && cos <= JUNTOS + 0.02) this.#juntar();
  }

  #juntar() {
    this.joined = true;
    this.agarrado = false;
    this.meta = 0.02;
    this.root.classList.add("is-joined");
    this.ctx.haptics.play("heart");
    this.ctx.audio.play("open", { volume: 0.45 });
    this.ctx.gl?.flash(0.4);
    this.ctx.gl?.pulse(1);
    const r = this.union.getBoundingClientRect();
    for (let k = 0; k < 6; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + r.height / 2), k * 130);
    this.later(() => {
      this.root.classList.add("is-told");
      this.proseEl.classList.add("is-writing");
      this.unlockSecret();
    }, 700);
  }
}
