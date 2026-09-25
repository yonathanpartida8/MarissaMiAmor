/**
 * NORTE — mi norte: una brújula antigua que siempre apunta a ti.
 *
 * Arriba, tu foto en un medallón. Abajo, una brújula de latón con su rosa
 * de los vientos. Se puede:
 *   · GIRAR la esfera con el dedo (con inercia): las letras y la rosa dan
 *     vueltas, pero la aguja no se deja engañar;
 *   · ARRASTRAR el medallón a cualquier sitio: la aguja lo busca, se pasa
 *     un poquito, vuelve y se queda temblando hacia él, como una de verdad.
 *
 * Cada letra, tocada, dice lo que significa (N de nunca me pierdo…). Si la
 * esfera gira muy rápido, la aguja se marea… y aun así acaba en ti.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";
import { clamp } from "../../utils/math.js";

const GRADOS = 180 / Math.PI;
const giro = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;

const LETRAS = [
  { l: "N", a: 0, dice: "N de «nunca me pierdo, si es hacia ti»." },
  { l: "E", a: 90, dice: "E de «eres tú», siempre." },
  { l: "S", a: 180, dice: "S de «siempre», aunque apunte al revés." },
  { l: "O", a: 270, dice: "O de «ojalá ya estuviera contigo»." },
];

/** Un pico de la rosa de los vientos: dos mitades, una clara y una oscura. */
function pico(angulo, largo, ancho, clase) {
  const g = svg("g", { transform: `rotate(${angulo} 100 100)` });
  g.append(
    svg("path", { class: `${clase} nor__rosa--luz`, d: `M100,${100 - largo} L${100 + ancho},100 L100,100Z` }),
    svg("path", { class: `${clase} nor__rosa--sombra`, d: `M100,${100 - largo} L${100 - ancho},100 L100,100Z` })
  );
  return g;
}

function dibujarBrujula() {
  const marcas = [];
  for (let k = 0; k < 72; k++) {
    const larga = k % 18 === 0;
    const media = k % 6 === 0;
    marcas.push(svg("line", {
      class: larga ? "nor__marca nor__marca--larga" : media ? "nor__marca nor__marca--media" : "nor__marca",
      x1: "100", y1: "19", x2: "100", y2: larga ? "30" : media ? "27" : "24",
      transform: `rotate(${k * 5} 100 100)`,
    }));
  }
  const grados = [30, 60, 120, 150, 210, 240, 300, 330].map((a) =>
    svg("text", { class: "nor__grado", x: "100", y: "37.5", "text-anchor": "middle", transform: `rotate(${a} 100 100)`, text: String(a) })
  );
  const letras = LETRAS.map(({ l, a }) =>
    svg("text", {
      class: `nor__letra${l === "N" ? " nor__letra--n" : ""}`,
      "data-letra": l,
      x: "100", y: "50", "text-anchor": "middle", "dominant-baseline": "central",
      transform: `rotate(${a} 100 100)`,
      text: l,
    })
  );

  const esfera = svg("g", { class: "nor__esfera" }, [
    svg("circle", { class: "nor__cara", cx: "100", cy: "100", r: "84" }),
    svg("circle", { class: "nor__cara-filete", cx: "100", cy: "100", r: "76" }),
    svg("circle", { class: "nor__cara-filete", cx: "100", cy: "100", r: "58" }),
    svg("g", {}, marcas),
    svg("g", {}, grados),
    // La rosa: cuatro picos grandes, cuatro medianos y ocho chiquitos.
    svg("g", { class: "nor__rosa" }, [
      ...[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((a) => pico(a, 34, 4, "nor__pico--chico")),
      ...[45, 135, 225, 315].map((a) => pico(a, 44, 6.5, "nor__pico--medio")),
      ...[0, 90, 180, 270].map((a) => pico(a, 56, 8.5, "nor__pico--grande")),
      svg("circle", { class: "nor__rosa-aro", cx: "100", cy: "100", r: "16" }),
    ]),
    // Un corazoncito donde debería ir la flor de lis del norte.
    svg("path", { class: "nor__lis", d: "M100,31 C96,27.5 93,25 94.5,22.2 C95.6,20.2 98.4,20.4 100,22.6 C101.6,20.4 104.4,20.2 105.5,22.2 C107,25 104,27.5 100,31Z" }),
    svg("g", { class: "nor__letras" }, letras),
  ]);

  const aguja = svg("g", { class: "nor__aguja" }, [
    svg("path", { class: "nor__aguja-sur", d: "M100,100 L106,100 L100,160 L94,100Z" }),
    svg("path", { class: "nor__aguja-norte", d: "M100,100 L106,100 L100,44 L94,100Z" }),
    svg("path", { class: "nor__aguja-brillo", d: "M100,100 L100,46 L106,100Z" }),
    svg("path", { class: "nor__aguja-corazon", d: "M100,47 C97,44 95,42.2 96.2,40 C97,38.6 99,38.8 100,40.4 C101,38.8 103,38.6 103.8,40 C105,42.2 103,44 100,47Z" }),
  ]);

  const lienzo = svg("svg", { class: "nor__svg", viewBox: "0 0 200 200", "aria-hidden": "true" }, [
    svg("defs", {}, [
      svg("radialGradient", { id: "norte-laton", cx: "0.35", cy: "0.3", r: "0.9" }, [
        svg("stop", { offset: "0", "stop-color": "#fff1c9" }),
        svg("stop", { offset: "0.35", "stop-color": "#e2b86c" }),
        svg("stop", { offset: "0.7", "stop-color": "#a8742f" }),
        svg("stop", { offset: "1", "stop-color": "#6e4618" }),
      ]),
      svg("radialGradient", { id: "norte-papel", cx: "0.45", cy: "0.4", r: "0.75" }, [
        svg("stop", { offset: "0", "stop-color": "#fffaf0" }),
        svg("stop", { offset: "0.75", "stop-color": "#f5e9d3" }),
        svg("stop", { offset: "1", "stop-color": "#e8d4b3" }),
      ]),
      svg("linearGradient", { id: "norte-cristal", x1: "0", y1: "0", x2: "0.7", y2: "1" }, [
        svg("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0.5" }),
        svg("stop", { offset: "0.45", "stop-color": "#fff", "stop-opacity": "0.04" }),
        svg("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }),
      ]),
    ]),
    // El aro para colgarla, arriba.
    svg("circle", { class: "nor__argolla", cx: "100", cy: "3", r: "7" }),
    svg("circle", { class: "nor__bisel", cx: "100", cy: "100", r: "96" }),
    svg("circle", { class: "nor__bisel-dentro", cx: "100", cy: "100", r: "88" }),
    esfera,
    aguja,
    svg("circle", { class: "nor__eje", cx: "100", cy: "100", r: "6" }),
    svg("circle", { class: "nor__eje-punto", cx: "98.6", cy: "98.6", r: "1.8" }),
    svg("path", { class: "nor__cristal", d: "M30,70 A76,76 0 0 1 150,36 A92,92 0 0 0 30,70Z" }),
  ]);
  return { lienzo, esfera, aguja };
}

export default class NortePage extends BasePage {
  static type = "norte";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.norte", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    const { lienzo, esfera, aguja } = dibujarBrujula();
    this.esfera = esfera;
    this.aguja = aguja;
    this.brujula = el("div.nor__brujula", { "data-claim-drag": "", role: "img", "aria-label": "Una brújula que siempre apunta a ti" }, [lienzo]);

    const foto = this.photos[0]?.src;
    this.medallon = el("div.nor__medallon", { "data-claim-drag": "", role: "button", "aria-label": "Tú: arrástrame a donde quieras" }, [
      el("span.nor__medallon-foto", foto ? { style: { backgroundImage: `url("${foto}")` } } : {}),
      el("span.nor__medallon-tu", { text: "tú" }),
    ]);
    if (!foto) this.medallon.classList.add("sin-foto");

    this.escena = el("div.nor__escena", {}, [
      el("span.nor__rastro", { "aria-hidden": "true" }),
      this.brujula,
      this.medallon,
    ]);
    this.dice = el("p.nor__dice.escena__nota", { "aria-live": "polite", text: "gira la brújula o mueve mi norte" });

    this.root.append(
      el("header.nor__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.nor__title.escena__title", { text: ch?.title || "" }),
      ]),
      this.escena,
      el("div.nor__pie.hueco-barra", {}, [
        this.dice,
        el("p.nor__texto", { text: ch?.text || "" }),
        el("p.nor__reveal.escena__reveal", { text: ch?.reveal || "" }),
      ])
    );
    return this.root;
  }

  get criticalAssets() {
    return this.photos.slice(0, 1).map((p) => p.src);
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    if (this.cara === undefined) {
      this.cara = 0; // giro de la esfera, en grados
      this.caraV = 0;
      this.ag = -140; // la aguja entra desorientada y busca
      this.agV = 0;
      this.vueltas = 0;
      this.movido = 0;
      this.med = null; // posición del medallón (px dentro de la escena)
    }

    // ── Girar la esfera ───────────────────────────────────────────────
    let previo = null;
    let ultimoT = 0;
    const angulo = (e) => {
      const c = this.#centro();
      return Math.atan2(e.y - c.y, e.x - c.x) * GRADOS;
    };
    this.addGestures(
      new Gestures(
        this.brujula,
        {
          onPanStart: (e) => {
            previo = angulo(e);
            ultimoT = performance.now();
            this.agarrada = true;
          },
          onPan: (e) => {
            const a = angulo(e);
            const d = giro(a, previo);
            const ahora = performance.now();
            const dt = Math.max(1, ahora - ultimoT) / 1000;
            previo = a;
            ultimoT = ahora;
            this.cara += d;
            this.caraV = d / dt;
            this.vueltas += Math.abs(d) / 360;
            if (Math.floor((this.cara - d) / 30) !== Math.floor(this.cara / 30)) this.ctx.haptics.play("tick");
          },
          onPanEnd: () => {
            this.agarrada = false;
            this.#quizaRevelar();
          },
          onTap: (e) => this.#tocarLetra(e),
        },
        { axis: "free", exclusive: true, threshold: 3 }
      )
    );

    // ── Mover el medallón ─────────────────────────────────────────────
    let desde = null;
    this.addGestures(
      new Gestures(
        this.medallon,
        {
          onPanStart: () => {
            desde = { ...this.#posMedallon() };
            this.medallon.classList.add("is-arrastrado");
          },
          onPan: (e) => {
            const r = this.escena.getBoundingClientRect();
            const m = 34;
            const x = clamp(desde.x + e.dx, m, r.width - m);
            const y = clamp(desde.y + e.dy, m, r.height - m);
            this.movido += Math.hypot(x - this.med.x, y - this.med.y);
            this.med = { x, y };
            this.#ponerMedallon();
          },
          onPanEnd: () => {
            this.medallon.classList.remove("is-arrastrado");
            this.#quizaRevelar();
          },
          onTap: () => {
            this.medallon.classList.remove("is-late");
            void this.medallon.offsetWidth;
            this.medallon.classList.add("is-late");
            this.ctx.haptics.play("heart");
          },
        },
        { axis: "free", exclusive: true, threshold: 3 }
      )
    );

    const medir = () => {
      if (!this.med) {
        const r = this.escena.getBoundingClientRect();
        this.med = { x: r.width / 2, y: Math.max(40, r.height * 0.12) };
      }
      this.#ponerMedallon();
    };
    medir();
    this.later(medir, 300);
    this.track(this.ctx.viewport.on("resize", () => { this.med = null; medir(); }));
    this.addTicker((dt) => this.#tick(dt));
  }

  #centro() {
    const r = this.brujula.getBoundingClientRect();
    // El centro de la esfera, no de la caja: el aro de arriba la alarga.
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  #posMedallon() {
    return this.med || { x: 0, y: 0 };
  }

  #ponerMedallon() {
    setVars(this.medallon, { "--mx": `${this.med.x.toFixed(1)}px`, "--my": `${this.med.y.toFixed(1)}px` });
  }

  #tick(dt) {
    dt = Math.min(dt, 1 / 30);
    // La esfera sigue girando un poco al soltarla, y se frena.
    if (!this.agarrada) {
      this.caraV *= Math.exp(-2.6 * dt);
      if (Math.abs(this.caraV) < 2) this.caraV = 0;
      this.cara += this.caraV * dt;
    }

    // ¿Hacia dónde queda ella?
    const c = this.#centro();
    const e = this.escena.getBoundingClientRect();
    const hx = e.left + this.med.x;
    const hy = e.top + this.med.y;
    const objetivo = Math.atan2(hy - c.y, hx - c.x) * GRADOS + 90; // 0 = arriba

    // La aguja: un muelle con amortiguación floja, así se pasa y vuelve.
    // Si la esfera gira muy deprisa, el rozamiento la arrastra (se marea).
    const mareo = clamp(Math.abs(this.caraV) / 900, 0, 1);
    const fuerza = giro(objetivo, this.ag) * 38 * (1 - mareo * 0.85);
    this.agV += (fuerza - this.agV * 5.2 + this.caraV * mareo * 4) * dt;
    this.ag += this.agV * dt;

    if (mareo > 0.8 && !this.mareada) {
      this.mareada = true;
      this.root.classList.add("is-mareada");
    } else if (this.mareada && mareo < 0.05 && Math.abs(giro(objetivo, this.ag)) < 4) {
      this.mareada = false;
      this.root.classList.remove("is-mareada");
      this.escondite("norte-mareada", "Hasta mareada, acaba apuntando a ti.");
    }

    this.esfera.setAttribute("transform", `rotate(${this.cara.toFixed(2)} 100 100)`);
    this.aguja.setAttribute("transform", `rotate(${this.ag.toFixed(2)} 100 100)`);
    // Un rastro de luz entre la brújula y ella.
    setVars(this.escena, {
      "--ang": `${(objetivo - 90).toFixed(1)}deg`,
      "--largo": `${Math.hypot(hx - c.x, hy - c.y).toFixed(0)}px`,
      "--cx": `${(c.x - e.left).toFixed(0)}px`,
      "--cy": `${(c.y - e.top).toFixed(0)}px`,
    });
  }

  #tocarLetra(e) {
    const letra = e.target?.closest?.("[data-letra]")?.dataset.letra;
    const def = LETRAS.find((x) => x.l === letra);
    if (!def) {
      // Un toque en la esfera la hace girar un poquito, por si no se sabe.
      this.caraV += 260;
      return;
    }
    this.#decir(def.dice);
    this.ctx.haptics.play("tap");
  }

  #decir(texto) {
    this.dice.classList.remove("is-nuevo");
    void this.dice.offsetWidth;
    this.dice.textContent = texto;
    this.dice.classList.add("is-nuevo");
  }

  #quizaRevelar() {
    if (this.revelado || (this.vueltas < 1.2 && this.movido < 220)) return;
    this.revelado = true;
    this.root.classList.add("is-revelado");
    this.unlockSecret();
    this.feedback("open", "heart", { volume: 0.35 });
    const r = this.medallon.getBoundingClientRect();
    for (let k = 0; k < 4; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + r.height / 2), k * 150);
  }
}
