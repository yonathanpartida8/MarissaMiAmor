/**
 * HUELLAS — caminar juntos.
 *
 * Un camino que sube por la página. Al deslizar el dedo hacia arriba por
 * él van quedando dos pares de huellas, las tuyas y las mías, lado a lado,
 * y dos lucecitas que caminan al frente. Hay un tramo difícil, con
 * piedras: ahí sólo quedan unas huellas, más hondas, porque ahí te cargo.
 *
 * Por el camino salen las frases; al llegar arriba, la última. Escondido:
 * al terminar, tocar la banquita del final.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";
import { clamp, damp } from "../../utils/math.js";

const CAMINO = "M100,392 C36,344 164,300 100,252 C36,204 164,160 100,112 C64,84 112,52 100,26";
const PASO = 15; // unidades del dibujo entre huella y huella
const DIFICIL = [0.44, 0.62]; // el tramo con piedras, en fracción del camino
const LADO = 8.5; // cuánto se separa cada uno del centro del camino
// Cuándo sale cada frase, en fracción del camino.
const MARCAS = [0.06, 0.24, 0.4, 0.5, 0.68, 0.84];

const pisada = (clase) =>
  svg("g", { class: `hue__huella ${clase}` }, [
    svg("ellipse", { cx: "0", cy: "-2.2", rx: "2.5", ry: "4.1" }),
    svg("ellipse", { cx: "0", cy: "4.6", rx: "2", ry: "2.3" }),
  ]);

export default class HuellasPage extends BasePage {
  static type = "huellas";

  build() {
    const ch = this.chapter;
    this.lineas = ch?.lines || [];
    this.root = el("section.page.huellas", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    this.camino = svg("path", { class: "hue__camino", d: CAMINO });
    this.huellas = svg("g", { class: "hue__huellas" });
    this.piedras = svg("g", { class: "hue__piedras" });
    this.orillas = svg("g", { class: "hue__orillas" });
    this.tuLuz = svg("circle", { class: "hue__luz hue__luz--tuya", r: "3.6" });
    this.miLuz = svg("circle", { class: "hue__luz hue__luz--mia", r: "3.6" });
    this.banca = svg("g", { class: "hue__banca", transform: "translate(100 14)" }, [
      svg("rect", { class: "hue__banca-cuerpo", x: "-16", y: "-6", width: "32", height: "4", rx: "1.5" }),
      svg("rect", { class: "hue__banca-cuerpo", x: "-16", y: "-13", width: "32", height: "3", rx: "1.5" }),
      svg("line", { x1: "-12", y1: "-2", x2: "-12", y2: "5" }),
      svg("line", { x1: "12", y1: "-2", x2: "12", y2: "5" }),
      svg("rect", { class: "hue__banca-toque", x: "-24", y: "-20", width: "48", height: "30", fill: "transparent" }),
    ]);

    this.lienzo = svg("svg", { class: "hue__lienzo", viewBox: "0 0 200 400", preserveAspectRatio: "xMidYMid meet", "aria-hidden": "true" }, [
      this.orillas,
      svg("path", { class: "hue__orilla", d: CAMINO }),
      this.camino,
      svg("path", { class: "hue__tramo", d: CAMINO, pathLength: "1", "stroke-dasharray": `0 ${DIFICIL[0]} ${DIFICIL[1] - DIFICIL[0]} 2` }),
      svg("path", { class: "hue__centro", d: CAMINO }),
      this.piedras,
      this.huellas,
      this.banca,
      this.tuLuz,
      this.miLuz,
    ]);

    this.escena = el("div.hue__escena", { "data-claim-drag": "", role: "slider", "aria-label": "Camina conmigo: desliza hacia arriba", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, [this.lienzo]);
    this.frase = el("p.hue__frase.escena__reveal", { "aria-live": "polite" });
    this.guia = el("p.hue__guia.escena__nota", { text: "sube despacito, paso a paso" });

    this.root.append(
      el("header.hue__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.hue__title.escena__title", { text: ch?.title || "" }),
      ]),
      this.escena,
      el("div.hue__pie.hueco-barra", {}, [this.frase, this.guia])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    if (!this.largo) this.#preparar();
    if (this.meta === undefined) {
      this.meta = 0;
      this.v = 0;
    }

    const avanzar = (y) => {
      const p = this.#fraccionEn(y);
      // Se sigue al dedo hacia delante, pero sin saltos: tocar arriba del
      // todo no se salta el camino.
      if (p > this.meta) this.meta = Math.min(p, this.meta + 0.05);
    };
    this.addGestures(
      new Gestures(
        this.escena,
        {
          onPanStart: (e) => avanzar(e.y),
          onPan: (e) => avanzar(e.y),
          onTap: (e) => {
            if (this.#tocaBanca(e)) return;
            this.meta = clamp(this.meta + 0.035, 0, 1);
          },
        },
        { axis: "y", exclusive: true, threshold: 3 }
      )
    );
    this.addTicker((dt) => this.#tick(dt));
  }

  /** Mide el camino y deja listas todas las huellas (ocultas) y las piedras. */
  #preparar() {
    this.largo = this.camino.getTotalLength();
    this.pasos = [];
    const n = Math.floor(this.largo / PASO);
    for (let i = 1; i <= n; i++) {
      const s = i * PASO;
      const f = s / this.largo;
      const { x, y, nx, ny, grados } = this.#punto(s);
      const pie = i % 2 ? -1 : 1;
      const dificil = f > DIFICIL[0] && f < DIFICIL[1];
      const nodos = [];
      const poner = (lado, clase) => {
        const g = pisada(clase);
        g.setAttribute("transform", `translate(${(x + nx * lado).toFixed(2)} ${(y + ny * lado).toFixed(2)}) rotate(${grados.toFixed(1)})`);
        this.huellas.append(g);
        nodos.push(g);
      };
      if (dificil) {
        // Un solo par, más hondo: aquí vas en mis brazos.
        poner(pie * 3, "hue__huella--honda");
      } else {
        poner(-LADO + pie * 2.6, "hue__huella--tuya");
        poner(LADO - pie * 2.6, "hue__huella--mia");
      }
      this.pasos.push({ f, nodos, puesto: false });
    }

    // Piedritas a los lados del tramo difícil.
    for (let k = 0; k < 22; k++) {
      const f = DIFICIL[0] + ((k + 0.5) / 22) * (DIFICIL[1] - DIFICIL[0]);
      const { x, y, nx, ny } = this.#punto(f * this.largo);
      const lado = (k % 2 ? 1 : -1) * (13 + ((k * 7) % 9));
      this.piedras.append(svg("ellipse", {
        cx: (x + nx * lado).toFixed(1), cy: (y + ny * lado).toFixed(1),
        rx: (2.6 + (k % 3) * 1.1).toFixed(1), ry: (1.9 + (k % 2) * 0.9).toFixed(1),
      }));
    }

    // Hierbitas y florecitas a los dos lados, siempre en el mismo sitio.
    let semilla = 7;
    const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 34; k++) {
      const f = 0.03 + azar() * 0.94;
      if (f > DIFICIL[0] - 0.02 && f < DIFICIL[1] + 0.02) continue;
      const { x, y, nx, ny } = this.#punto(f * this.largo);
      const lado = (azar() < 0.5 ? -1 : 1) * (30 + azar() * 34);
      const px = x + nx * lado;
      const py = y + ny * lado;
      if (px < 6 || px > 194) continue;
      const retraso = `${(f * 1.4).toFixed(2)}s`;
      if (azar() < 0.62) {
        const h = 5 + azar() * 4;
        this.orillas.append(svg("path", {
          class: "hue__hierba",
          style: `--d:${retraso}`,
          d: `M${(px - 3).toFixed(1)},${py.toFixed(1)} q1,-${(h * 0.7).toFixed(1)} -1,-${h.toFixed(1)} M${px.toFixed(1)},${py.toFixed(1)} q0,-${h.toFixed(1)} 1,-${(h * 1.25).toFixed(1)} M${(px + 3).toFixed(1)},${py.toFixed(1)} q-1,-${(h * 0.7).toFixed(1)} 1.5,-${h.toFixed(1)}`,
        }));
      } else {
        const flor = svg("g", { class: "hue__flor", style: `--d:${retraso}`, transform: `translate(${px.toFixed(1)} ${py.toFixed(1)})` });
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          flor.append(svg("circle", { cx: (Math.cos(a) * 2.2).toFixed(2), cy: (Math.sin(a) * 2.2).toFixed(2), r: "1.6" }));
        }
        flor.append(svg("circle", { class: "hue__flor-centro", r: "1.2" }));
        this.orillas.append(flor);
      }
    }

    // Para pasar de la altura del dedo a un punto del camino.
    this.tabla = [];
    for (let k = 0; k <= 200; k++) this.tabla.push(this.camino.getPointAtLength((k / 200) * this.largo).y);
  }

  /** Punto del camino, su normal y hacia dónde mira (en grados). */
  #punto(s) {
    const a = this.camino.getPointAtLength(Math.max(0, s - 1));
    const b = this.camino.getPointAtLength(Math.min(this.largo, s + 1));
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const l = Math.hypot(tx, ty) || 1;
    const p = this.camino.getPointAtLength(s);
    return { x: p.x, y: p.y, nx: -ty / l, ny: tx / l, grados: (Math.atan2(ty, tx) * 180) / Math.PI + 90 };
  }

  /** Qué fracción del camino queda a la altura del dedo. */
  #fraccionEn(clientY) {
    const m = this.lienzo.getScreenCTM();
    if (!m) return 0;
    const y = (clientY - m.f) / m.d;
    const t = this.tabla;
    // El camino siempre sube, así que la altura baja con la fracción.
    for (let k = 0; k < t.length; k++) if (t[k] <= y) return k / (t.length - 1);
    return 1;
  }

  #tocaBanca(e) {
    const r = this.banca.getBoundingClientRect();
    if (e.x < r.left - 12 || e.x > r.right + 12 || e.y < r.top - 12 || e.y > r.bottom + 12) return false;
    if (!this.llegamos) return false;
    this.root.classList.add("is-mirar");
    this.escondite("huellas-banca", "Y cuando lleguemos, nos sentamos a ver todo lo que caminamos.", { x: e.x, y: e.y });
    return true;
  }

  #tick(dt) {
    const antes = this.v;
    this.v = damp(this.v, this.meta, 3.2, dt);
    if (this.meta - this.v < 0.0005) this.v = this.meta;
    if (antes === this.v && this.pintado) return;
    this.pintado = true;

    const v = this.v;
    for (const paso of this.pasos) {
      if (!paso.puesto && paso.f <= v) {
        paso.puesto = true;
        for (const n of paso.nodos) n.classList.add("is-puesta");
        if (paso.f > 0.05) this.ctx.haptics.play("tick");
      }
    }

    // Las dos lucecitas, al frente. En el tramo difícil van en una sola.
    const { x, y, nx, ny } = this.#punto(Math.max(0.5, v * this.largo));
    const dificil = v > DIFICIL[0] && v < DIFICIL[1];
    const lado = dificil ? 0.6 : LADO;
    this.tuLuz.setAttribute("cx", (x - nx * lado).toFixed(2));
    this.tuLuz.setAttribute("cy", (y - ny * lado).toFixed(2));
    this.miLuz.setAttribute("cx", (x + nx * lado).toFixed(2));
    this.miLuz.setAttribute("cy", (y + ny * lado).toFixed(2));
    this.root.classList.toggle("is-dificil", dificil);
    setVars(this.root, { "--avance": v.toFixed(3) });
    this.escena.setAttribute("aria-valuenow", String(Math.round(v * 100)));

    let cual = -1;
    MARCAS.forEach((m, k) => { if (v >= m && k < this.lineas.length) cual = k; });
    this.guia.classList.toggle("is-fuera", v > 0.03);

    if (v >= 0.995 && !this.llegamos) {
      this.llegamos = true;
      this.root.classList.add("is-llegamos");
      this.#decir(this.chapter?.reveal || "");
      this.unlockSecret();
      this.feedback("open", "secret", { volume: 0.4 });
      const r = this.banca.getBoundingClientRect();
      for (let k = 0; k < 4; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top), k * 150);
    } else if (!this.llegamos) {
      this.#decir(cual >= 0 ? this.lineas[cual] : "");
    }
  }

  #decir(texto = "") {
    if (texto === this.dicho) return;
    this.dicho = texto;
    this.frase.classList.add("is-cambia");
    clearTimeout(this.relojFrase);
    this.relojFrase = this.later(() => {
      this.frase.textContent = texto;
      this.frase.classList.remove("is-cambia");
    }, 260);
  }
}
