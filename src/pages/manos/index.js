/**
 * MANOS — dos manos dibujadas a una sola línea, una a cada lado, con un
 * hilo rojo atado a los meñiques.
 *
 * Se arrastra la tuya hacia la mía; la mía también se acerca al final.
 * Por el camino van saliendo frases, y cuando las puntas de los dedos se
 * tocan hay un destello, ondas como un latido y la frase de la página.
 *
 * Si se quedan juntas tres segundos, se dibuja un corazón encima y sale la
 * última frase. Escondido: tocar tres veces mi mano, y saluda.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";
import { clamp, damp, smoothstep } from "../../utils/math.js";

// Una mano que señala a la derecha, del puño a la punta del índice.
// La muñeca está en x = 0 y se desvanece; la punta del dedo, en x ≈ 171.
const MANO =
  "M0,30 C20,26 44,18 70,18 C84,18 94,22 104,27 C122,34 142,40 160,45 " +
  "C168,47 171,54 166,57 C160,60 150,58 140,57 C128,55 120,54 112,56 " +
  "C126,59 128,69 116,71 C125,75 122,84 108,84 C115,89 107,96 94,94 " +
  "C72,96 40,93 0,89";
const PULGAR = "M60,50 C76,48 92,52 101,59 C105,63 102,67 97,65";
const UNA = "M155,48 C159,48 162,50 163,52";
const PUNTA = 171;
const MENIQUE = { x: 100, y: 92 };
const ALTO = 60; // dónde van las manos en el lienzo
const CORAZON = "M220,94 C184,74 166,54 180,36 C192,22 211,26 220,41 C229,26 248,22 260,36 C274,54 256,74 220,94Z";

export default class ManosPage extends BasePage {
  static type = "manos";

  build() {
    const ch = this.chapter;
    this.lineas = ch?.lines || [];
    this.root = el("section.page.manos", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a });

    const mano = (quien) =>
      svg("g", { class: `man__mano man__mano--${quien}` }, [
        svg("g", { mask: "url(#manos-desvanece)" }, [
          svg("path", { class: "man__piel", d: MANO }),
          svg("path", { class: "man__trazo", d: MANO, pathLength: "1" }),
          svg("path", { class: "man__trazo man__trazo--fino", d: PULGAR, pathLength: "1" }),
          svg("path", { class: "man__trazo man__trazo--fino", d: UNA, pathLength: "1" }),
        ]),
      ]);

    this.tuya = mano("tuya");
    this.mia = mano("mia");
    this.hilo = svg("path", { class: "man__hilo" });
    this.luz = svg("path", { class: "man__hilo-luz", pathLength: "1" });
    this.nudos = [svg("circle", { class: "man__nudo", r: "2.6" }), svg("circle", { class: "man__nudo", r: "2.6" })];

    const lienzo = svg("svg", { class: "man__lienzo", viewBox: "52 16 336 180", preserveAspectRatio: "xMidYMid meet", "aria-hidden": "true" }, [
      svg("defs", {}, [
        svg("linearGradient", { id: "manos-fundido" }, [
          svg("stop", { offset: "0", "stop-color": "#000" }),
          svg("stop", { offset: "0.34", "stop-color": "#fff" }),
        ]),
        svg("mask", { id: "manos-desvanece", maskContentUnits: "objectBoundingBox" }, [
          svg("rect", { width: "1", height: "1", fill: "url(#manos-fundido)" }),
        ]),
        svg("radialGradient", { id: "manos-brillo" }, [
          svg("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0.95" }),
          svg("stop", { class: "man__tono", offset: "0.35", "stop-opacity": "0.7" }),
          svg("stop", { class: "man__tono", offset: "1", "stop-opacity": "0" }),
        ]),
      ]),
      this.hilo,
      this.luz,
      ...this.nudos,
      svg("g", { class: "man__ondas" }, [
        svg("circle", { class: "man__onda", cx: "220", cy: "112", r: "18" }),
        svg("circle", { class: "man__onda", cx: "220", cy: "112", r: "18" }),
        svg("circle", { class: "man__onda", cx: "220", cy: "112", r: "18" }),
      ]),
      svg("circle", { class: "man__brillo", cx: "220", cy: "112", r: "34", fill: "url(#manos-brillo)" }),
      this.tuya,
      this.mia,
      svg("path", { class: "man__corazon", d: CORAZON, pathLength: "1" }),
      svg("g", { class: "man__chispas" }, [0, 1, 2, 3, 4, 5].map((k) =>
        svg("circle", { class: "man__chispa", cx: "220", cy: "112", r: String(1.6 + (k % 3) * 0.5), style: `--k:${k}` })
      )),
    ]);

    this.escena = el("div.man__escena", { "data-claim-drag": "", role: "slider", "aria-label": "Acerca tu mano a la mía", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" }, [lienzo]);
    this.guia = el("p.man__guia.escena__nota", { text: "arrastra tu mano hacia la mía" });
    this.frase = el("p.man__frase.escena__reveal", { "aria-live": "polite" });

    this.root.append(
      el("header.man__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.man__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.man__centro", {}, [this.escena, el("div.man__pie.hueco-barra", {}, [this.frase, this.guia])])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    // Lo que se ve persigue a lo que pide el dedo, con un poco de inercia.
    if (this.meta === undefined) {
      this.meta = 0;
      this.v = 0;
      this.juntasK = 0;
    }
    this.#pintar(0);

    let desde = 0;
    this.addGestures(
      new Gestures(
        this.escena,
        {
          onPanStart: () => {
            desde = this.meta;
            this.arrastrando = true;
            this.root.classList.add("is-moviendo");
          },
          onPan: (e) => {
            const ancho = this.escena.clientWidth || 320;
            this.meta = clamp(desde + e.dx / (ancho * 0.5), 0, 1);
          },
          onPanEnd: () => {
            this.arrastrando = false;
            this.root.classList.remove("is-moviendo");
            // Cerquita ya cuenta: se terminan de juntar solas.
            if (this.meta > 0.86) this.meta = 1;
          },
          onTap: (e) => {
            // Un toque del lado de mi mano también acerca un poco la tuya.
            if (this.#tocaMiMano(e)) return;
            this.meta = clamp(this.meta + 0.2, 0, 1);
            if (this.meta > 0.86) this.meta = 1;
          },
        },
        { axis: "x", exclusive: true, threshold: 4 }
      )
    );

    this.saludos = 0;
    this.addTicker((dt, time) => this.#tick(dt, time));
  }

  #tocaMiMano(e) {
    const r = this.mia.getBoundingClientRect();
    if (e.x < r.left || e.x > r.right || e.y < r.top - 10 || e.y > r.bottom + 10) return false;
    this.mia.classList.remove("is-saluda");
    void this.mia.getBoundingClientRect();
    this.mia.classList.add("is-saluda");
    this.ctx.haptics.play("tap");
    if (++this.saludos === 3) this.escondite("manos-aqui", "Aquí sigo. No me muevo de aquí.", { x: e.x, y: e.y });
    return true;
  }

  #tick(dt, time) {
    this.v = damp(this.v, this.meta, this.arrastrando ? 18 : 7, dt);
    const juntas = this.meta >= 0.99 && this.v > 0.975;
    this.juntasK = damp(this.juntasK, juntas ? 1 : 0, 6, dt);
    this.#pintar(time);
    this.#momento(juntas);
  }

  /** Coloca las dos manos y el hilo según lo cerca que estén. */
  #pintar(time) {
    const v = this.v;
    const flota = 1 - this.juntasK;
    const t = time || 0;
    const tuX = -70 + 118 * v;
    const tuY = ALTO + Math.sin(t * 1.3) * 3 * flota;
    // La mía también se acerca, pero sólo al final: cuando ya vienes.
    const inclina = smoothstep(0.5, 1, v);
    const miX = 20 + 28 * inclina;
    const miY = ALTO + Math.sin(t * 1.1 + 1.7) * 3 * flota;
    this.tuya.setAttribute("transform", `translate(${tuX.toFixed(2)} ${tuY.toFixed(2)})`);
    this.mia.setAttribute("transform", `translate(${(440 - miX).toFixed(2)} ${miY.toFixed(2)}) scale(-1 1)`);

    // El hilo rojo va de meñique a meñique; cuanto más cerca, más flojo.
    const a = { x: tuX + MENIQUE.x, y: tuY + MENIQUE.y };
    const b = { x: 440 - miX - MENIQUE.x, y: miY + MENIQUE.y };
    const cae = 14 + 42 * v;
    const d = `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${((a.x + b.x) / 2).toFixed(1)},${(Math.max(a.y, b.y) + cae).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    this.hilo.setAttribute("d", d);
    this.luz.setAttribute("d", d);
    this.nudos[0].setAttribute("cx", a.x.toFixed(1));
    this.nudos[0].setAttribute("cy", a.y.toFixed(1));
    this.nudos[1].setAttribute("cx", b.x.toFixed(1));
    this.nudos[1].setAttribute("cy", b.y.toFixed(1));

    setVars(this.root, { "--acerca": v.toFixed(3), "--juntas": this.juntasK.toFixed(3) });
    this.escena.setAttribute("aria-valuenow", String(Math.round(v * 100)));
  }

  /** Lo que pasa según el momento: frases, el toque y el corazón. */
  #momento(juntas) {
    const v = this.v;
    this.guia.classList.toggle("is-fuera", v > 0.08);
    if (!this.juntas) {
      if (v > 0.62) this.#decir(this.lineas[1]);
      else if (v > 0.26) this.#decir(this.lineas[0]);
      else this.#decir("");
    }

    if (juntas && !this.juntas) {
      this.juntas = true;
      this.root.classList.add("is-juntas");
      this.#decir(this.chapter?.reveal || "");
      this.feedback("open", "secret", { volume: 0.45 });
      this.unlockSecret();
      const r = this.escena.getBoundingClientRect();
      for (let k = 0; k < 4; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + r.height * 0.55), k * 160);
      clearTimeout(this.relojCorazon);
      this.relojCorazon = this.later(() => {
        if (!this.juntas) return;
        this.root.classList.add("is-corazon");
        this.#decir(this.lineas[2]);
        this.escondite("manos-corazon", "");
      }, 3000);
    } else if (!juntas && this.juntas && this.meta < 0.97) {
      this.juntas = false;
      this.root.classList.remove("is-juntas", "is-corazon");
      clearTimeout(this.relojCorazon);
    }
  }

  #decir(texto = "") {
    if (texto === this.dicho) return;
    this.dicho = texto;
    this.frase.classList.add("is-cambia");
    clearTimeout(this.relojFrase);
    this.relojFrase = this.later(() => {
      this.frase.textContent = texto;
      this.frase.classList.toggle("is-vacia", !texto);
      this.frase.classList.remove("is-cambia");
    }, 260);
  }
}
