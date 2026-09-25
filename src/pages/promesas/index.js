/**
 * PROMESAS — lo que te prometo.
 *
 * Una tarjetita por promesa, cada una con su lacre sin sellar. Se deja el
 * dedo en el lacre hasta que se llena el anillo: se estampa un corazón en
 * la cera, la tarjeta se guarda en el cofrecito de abajo y llega la
 * siguiente. Con todas selladas sale la frase final.
 *
 * Escondido: al terminar aparece una tarjeta más, boca abajo.
 */

import { BasePage } from "../BasePage.js";
import { el, svgEl as svg, setVars } from "../../utils/dom.js";

const SELLAR = 0.9; // segundos con el dedo en el lacre
const CORAZON = "M0,9 C-9,3 -13,-3 -9,-7.5 C-6,-11 -1.5,-10 0,-6 C1.5,-10 6,-11 9,-7.5 C13,-3 9,3 0,9Z";

export default class PromesasPage extends BasePage {
  static type = "promesas";

  build() {
    const ch = this.chapter;
    this.promesas = ch?.lines || [];
    this.root = el("section.page.promesas", { "data-page": this.id, "aria-label": ch?.title });
    setVars(this.root, { "--accent": this.palette.a, "--carga": "0" });

    this.num = el("span.pro__num");
    this.texto = el("p.pro__promesa");
    this.anillo = svg("circle", { class: "pro__anillo", cx: "40", cy: "40", r: "36", pathLength: "1" });
    this.lacre = el("button.pro__lacre", { type: "button", "aria-label": "Sellar esta promesa: mantén el dedo" }, [
      svg("svg", { class: "pro__lacre-svg", viewBox: "0 0 80 80", "aria-hidden": "true" }, [
        svg("circle", { class: "pro__anillo-fondo", cx: "40", cy: "40", r: "36" }),
        this.anillo,
        svg("path", { class: "pro__cera", d: "M40,12 C53,11 66,19 67,33 C69,45 64,59 51,66 C41,71 27,69 19,59 C11,50 11,34 18,24 C23,17 31,12 40,12Z" }),
        svg("path", { class: "pro__cera-brillo", d: "M27,24 C31,20 37,18 42,18" }),
        svg("g", { class: "pro__estampa", transform: "translate(40 41) scale(1.25)" }, [
          svg("circle", { class: "pro__estampa-aro", r: "15" }),
          svg("path", { class: "pro__estampa-corazon", d: CORAZON }),
        ]),
      ]),
    ]);
    this.carta = el("article.pro__carta", {}, [this.num, this.texto, this.lacre]);

    this.extra = el("button.pro__extra", { type: "button", "aria-label": "Una tarjeta más, boca abajo" }, [
      el("span.pro__extra-cara.pro__extra-cara--atras", {}, [el("span", { text: "una más" }), el("small", { text: "tócala" })]),
      el("span.pro__extra-cara.pro__extra-cara--frente", { text: "Y te prometo que esta lista va a seguir creciendo." }),
    ]);

    this.cofre = el("div.pro__cofre", { "aria-hidden": "true" }, this.promesas.map(() => el("span.pro__mini")));
    this.guia = el("p.pro__guia.escena__nota", { text: "mantén el dedo en el lacre" });

    this.root.append(
      el("header.pro__head.escena__head.entra--sube", {}, [
        el("span.kicker.escena__kicker", { text: ch?.kicker || "" }),
        el("h2.title.pro__title.escena__title", { text: ch?.title || "" }),
      ]),
      el("div.pro__mesa", {}, [this.carta, this.extra]),
      el("div.pro__pie.hueco-barra", {}, [
        this.cofre,
        this.guia,
        el("p.pro__reveal.escena__reveal", { text: ch?.reveal || "" }),
      ])
    );
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    if (this.selladas === undefined) {
      this.selladas = 0;
      this.#mostrar();
    } else if (this.ocupada && this.selladas < this.promesas.length) {
      // Se fue a media animación (y sus temporizadores murieron con la
      // visita): lo sellado cuenta, y se sigue con la siguiente.
      if (this.carta.classList.contains("is-sellada")) this.selladas++;
      this.carta.classList.remove("is-sale", "is-llega");
      this.ocupada = false;
      this.#mostrar();
    }
    this.carga = 0;
    this.apretando = false;

    const soltar = () => {
      this.apretando = false;
      this.lacre.classList.remove("is-apretado");
    };
    this.on(this.lacre, "pointerdown", (e) => {
      if (this.ocupada || this.selladas >= this.promesas.length) return;
      e.preventDefault();
      this.lacre.setPointerCapture?.(e.pointerId);
      this.apretando = true;
      this.lacre.classList.add("is-apretado");
      this.ctx.haptics.play("tap");
    });
    for (const tipo of ["pointerup", "pointercancel", "lostpointercapture"]) this.on(this.lacre, tipo, soltar);
    this.on(this.lacre, "contextmenu", (e) => e.preventDefault());
    // Con el teclado también: mantener Enter o Espacio.
    this.on(this.lacre, "keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.apretando = true; } });
    this.on(this.lacre, "keyup", soltar);

    this.on(this.extra, "click", () => {
      if (this.extra.classList.contains("is-volteada")) return;
      this.extra.classList.add("is-volteada");
      this.escondite("promesas-una-mas", "");
      const r = this.extra.getBoundingClientRect();
      for (let k = 0; k < 3; k++) this.later(() => this.corazon(r.left + r.width / 2, r.top + 10), k * 160);
    });

    this.addTicker((dt) => this.#tick(dt));
  }

  #tick(dt) {
    if (this.ocupada) return;
    const antes = this.carga;
    this.carga = this.apretando ? Math.min(1, this.carga + dt / SELLAR) : Math.max(0, this.carga - dt * 2.5);
    if (this.carga !== antes) {
      setVars(this.root, { "--carga": this.carga.toFixed(3) });
      this.anillo.style.strokeDashoffset = (1 - this.carga).toFixed(3);
    }
    if (this.carga >= 1) this.#sellar();
  }

  /** Pone en la tarjeta la promesa que toca. */
  #mostrar() {
    const n = this.promesas.length;
    this.num.textContent = `${Math.min(this.selladas + 1, n)} de ${n}`;
    this.texto.textContent = this.promesas[this.selladas] || "";
    this.carta.classList.remove("is-sellada");
    this.anillo.style.strokeDashoffset = "1";
    [...this.cofre.children].forEach((m, k) => m.classList.toggle("is-llena", k < this.selladas));
    if (this.selladas >= n) this.#terminar(false);
  }

  #sellar() {
    this.ocupada = true;
    this.apretando = false;
    this.carga = 0;
    setVars(this.root, { "--carga": "0" });
    this.lacre.classList.remove("is-apretado");
    this.carta.classList.add("is-sellada");
    this.feedback("open", "secret", { volume: 0.3, rate: 1.2 });

    // Se queda un momento para ver el sello, y se va al cofrecito.
    this.later(() => this.carta.classList.add("is-sale"), 900);
    this.later(() => {
      this.selladas++;
      const mini = this.cofre.children[this.selladas - 1];
      mini?.classList.add("is-llena", "is-nueva");
      this.later(() => mini?.classList.remove("is-nueva"), 700);
      this.carta.classList.remove("is-sale");
      if (this.selladas >= this.promesas.length) {
        this.#terminar(true);
        return;
      }
      this.#mostrar();
      this.carta.classList.add("is-llega");
      this.later(() => {
        this.carta.classList.remove("is-llega");
        this.ocupada = false;
      }, 650);
    }, 1500);
  }

  #terminar(ahora) {
    this.root.classList.add("is-todas");
    this.ocupada = true;
    if (!ahora) return;
    this.unlockSecret();
    const r = this.cofre.getBoundingClientRect();
    for (let k = 0; k < 5; k++) this.later(() => this.corazon(r.left + (r.width * (k + 0.5)) / 5, r.top), k * 130);
  }
}
