/**
 * ORBITPAGE — cerrar la distancia con el dedo.
 *
 * Dos puntos, «tú» y «yo», con la distancia escrita entre ellos. Se pueden
 * arrastrar, pero se empujan: cuanto más los acercas, más cuesta. Hay que
 * insistir. Cuando por fin se tocan, se funden en uno y aparece la frase.
 *
 * La resistencia no es un capricho: es toda la página. Se cierra, pero cuesta,
 * y por eso se siente bien cuando cede.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, splitWords, setVars, wait } from "../../utils/dom.js";
import { clamp, clamp01, distance } from "../../utils/math.js";
import escondidos from "../../data/escondidos.js";

const TOUCH_RADIUS = 0.09;  // en fracción del ancho: cuándo se consideran juntos
const REPEL = 0.9;          // fuerza con la que se separan

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

    this.field = el("div.orb__field", { "data-claim-drag": "" });

    this.a = this.#makeOrb("tú", "a");
    this.b = this.#makeOrb("yo", "b");

    this.link = el("div.orb__link");
    this.gauge = el("span.orb__gauge", { text: "" });

    // LAS CARTAS QUE CRUZAN.
    //
    // Es lo que de verdad pasa entre dos personas separadas por dos mil
    // kilómetros: van y vienen cosas por el hilo. Salen solas cada pocos
    // segundos, viajan de un punto al otro por la línea que los une, y
    // cuanto más cerca están, más seguidas van. Sin esto la página eran dos
    // bolas y una raya.
    //
    // Se reciclan cuatro nodos en vez de crear y tirar uno cada vez: esto
    // corre durante todo el rato que dure la página.
    this.cartas = [0, 1, 2, 3].map(() => {
      const carta = el("span.orb__carta", { "aria-hidden": "true" });
      carta.innerHTML = `
        <svg class="orb__carta-svg" viewBox="0 0 20 14">
          <rect x="0.6" y="0.6" width="18.8" height="12.8" rx="1.4"/>
          <path class="orb__carta-solapa" d="M0.6 1.4 10 8 19.4 1.4"/>
        </svg>`;
      return carta;
    });
    this.siguienteCarta = 0;
    this.desdeCarta = 0;

    this.capaCartas = el("div.orb__cartas", { "aria-hidden": "true" }, this.cartas);

    this.field.append(this.link, this.capaCartas, this.a.node, this.b.node);

    this.proseEl = el("div.orb__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.revealEl = el("p.orb__reveal", { text: ch?.reveal || "" });

    this.root.append(
      el("header.orb__head.entra--acerca", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        this.gauge,
      ]),
      this.field,
      el("div.vidrio.orb__panel.hueco-barra", {}, [
        el("h2.orb__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.lectura.orb__scroll", {}, [this.proseEl]),
        this.revealEl,
      ])
    );

    return this.root;
  }

  #makeOrb(label, key) {
    const node = el("button.orb", {
      type: "button",
      dataset: { orb: key },
      "aria-label": `Arrastra "${label}"`,
    }, [
      el("span.orb__halo"),
      el("span.orb__core"),
      el("span.orb__label", { text: label }),
    ]);
    return { node, x: key === "a" ? 0.24 : 0.76, y: key === "a" ? 0.34 : 0.66, vx: 0, vy: 0 };
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.joined = false;
    this.#measure();
    this.track(this.ctx.viewport.on("resize", () => this.#measure()));

    this.#bind(this.a);
    this.#bind(this.b);
    this.#place();

    this.addTicker((dt) => this.#frame(dt), 11);
  }

  #measure() {
    const rect = this.field.getBoundingClientRect();
    this.rect = rect;
    this.#place();
  }

  #bind(orb) {
    let start = null;

    this.addGestures(
      new Gestures(
        orb.node,
        {
          onPanStart: () => {
            if (this.joined) return;
            start = { x: orb.x, y: orb.y };
            orb.node.classList.add("is-held");
            orb.vx = orb.vy = 0;
            this.ctx.haptics.play("tick");
          },
          onPan: (e) => {
            if (this.joined || !start || !this.rect?.width) return;
            orb.x = clamp(start.x + e.dx / this.rect.width, 0.08, 0.92);
            orb.y = clamp(start.y + e.dy / this.rect.height, 0.08, 0.92);
            orb.dragging = true;
          },
          onPanEnd: (e) => {
            orb.node.classList.remove("is-held");
            orb.dragging = false;
            orb.vx = (e.vx * 900) / (this.rect.width || 1);
            orb.vy = (e.vy * 900) / (this.rect.height || 1);
          },
        },
        { exclusive: true, threshold: 5 }
      )
    );
  }

  #place() {
    for (const orb of [this.a, this.b]) {
      orb.node.style.left = `${orb.x * 100}%`;
      orb.node.style.top = `${orb.y * 100}%`;
    }
  }

  #frame(dt) {
    if (!this.rect?.width || this.joined) return;

    const d = distance(this.a.x, this.a.y, this.b.x, this.b.y);
    const near = clamp01(1 - (d - TOUCH_RADIUS) / 0.55);

    // Repulsión que crece al cuadrado: los últimos centímetros son los duros.
    const push = (REPEL * near * near) / Math.max(0.05, d);
    const ux = (this.b.x - this.a.x) / Math.max(0.0001, d);
    const uy = (this.b.y - this.a.y) / Math.max(0.0001, d);

    for (const [orb, sign] of [[this.a, -1], [this.b, 1]]) {
      if (orb.dragging) continue;
      orb.vx += ux * push * sign * dt;
      orb.vy += uy * push * sign * dt;
      // Y un tirón suave de vuelta a su sitio, para que nunca se pierdan.
      orb.vx += ((orb === this.a ? 0.24 : 0.76) - orb.x) * 0.5 * dt;
      orb.vy += ((orb === this.a ? 0.34 : 0.66) - orb.y) * 0.5 * dt;

      const decay = Math.exp(-2.4 * dt);
      orb.vx *= decay;
      orb.vy *= decay;
      orb.x = clamp(orb.x + orb.vx * dt, 0.08, 0.92);
      orb.y = clamp(orb.y + orb.vy * dt, 0.08, 0.92);
    }

    this.#place();
    this.#drawLink(d, near);
    this.#correo(dt, near);

    // Escondido: separarlos del todo en vez de juntarlos. La página va de
    // acercarse; alejarlos a propósito es justo lo contrario, y tiene
    // respuesta. (Se apunta una sola vez.)
    if (d > 0.78 && (this.a.dragging || this.b.dragging)) {
      this.escondite("distancia-al-reves", escondidos.distancia);
    }

    // Vibración creciente conforme se resisten.
    if (near > 0.55 && (this.a.dragging || this.b.dragging) && Math.random() < dt * 14) {
      this.ctx.haptics.scrub(near);
    }

    if (d <= TOUCH_RADIUS) this.#join();
  }

  /**
   * Suelta una carta cada tanto y la manda al otro lado.
   *
   * Van alternando de dirección —una tuya, una mía— y salen más seguidas
   * cuanto más cerca están: de una cada tres segundos y pico cuando la
   * distancia es toda, a una por segundo cuando ya casi se tocan. Es la
   * página entera contada sin una sola palabra.
   */
  #correo(dt, near) {
    if (this.ctx.caps.reducedMotion) return;

    this.relojCarta = (this.relojCarta || 0) - dt;
    if (this.relojCarta > 0) return;
    this.relojCarta = 3.4 - near * 2.3;

    const carta = this.cartas[this.siguienteCarta];
    this.siguienteCarta = (this.siguienteCarta + 1) % this.cartas.length;

    // De un punto al otro, alternando quién escribe.
    const deA = this.desdeCarta === 0;
    this.desdeCarta ^= 1;
    const o1 = deA ? this.a : this.b;
    const o2 = deA ? this.b : this.a;

    const x1 = o1.x * this.rect.width;
    const y1 = o1.y * this.rect.height;
    const x2 = o2.x * this.rect.width;
    const y2 = o2.y * this.rect.height;

    setVars(carta, {
      "--x1": `${x1.toFixed(0)}px`,
      "--y1": `${y1.toFixed(0)}px`,
      "--x2": `${x2.toFixed(0)}px`,
      "--y2": `${y2.toFixed(0)}px`,
      // Se inclina hacia donde va, como una cosa que vuela.
      "--giro": `${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI}deg`,
    });

    carta.classList.remove("is-yendo");
    void carta.offsetWidth; // relanza el viaje desde el principio
    carta.classList.add("is-yendo");
  }

  #drawLink(d, near) {
    const ax = this.a.x * this.rect.width;
    const ay = this.a.y * this.rect.height;
    const bx = this.b.x * this.rect.width;
    const by = this.b.y * this.rect.height;

    const len = Math.hypot(bx - ax, by - ay);
    const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;

    this.link.style.width = `${len}px`;
    this.link.style.transform = `translate(${ax}px, ${ay}px) rotate(${angle}deg)`;
    setVars(this.root, { "--near": near.toFixed(3) });

    // La cifra baja mientras se acercan: da una meta clara sin explicarla.
    const km = Math.round(d * 4200);
    this.gauge.textContent = `${km.toLocaleString("es")} km`;
  }

  async #join() {
    if (this.joined) return;
    this.joined = true;

    // Los dos al centro exacto, y se funden.
    const cx = (this.a.x + this.b.x) / 2;
    const cy = (this.a.y + this.b.y) / 2;
    for (const orb of [this.a, this.b]) {
      orb.x = cx;
      orb.y = cy;
    }
    this.#place();

    this.root.classList.add("is-joined");
    this.gauge.textContent = "0 km";
    this.ctx.haptics.play("heart");
    this.ctx.audio.play("open", { volume: 0.45 });
    this.ctx.gl?.flash(0.4);
    this.ctx.gl?.pulse(1);

    await wait(620);
    this.root.classList.add("is-told");
    this.proseEl.classList.add("is-writing");
    this.unlockSecret();
  }
}
