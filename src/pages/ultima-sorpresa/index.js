/**
 * ÚLTIMA SORPRESA — el cajón de las cosas pequeñas.
 *
 * Seis objetos sobre una mesa a oscuras, y cada uno se toca de una manera
 * distinta: la cerilla se enciende con un toque, el papel se desdobla, la
 * llave se gira arrastrando, la concha hay que sostenerla, la estrella pide
 * dos toques y el anillo uno. Ninguno dice cómo: se descubren tocando.
 *
 * No hay orden. No hay manera de hacerlo mal. Si lleva un rato sin encontrar
 * nada, uno de los objetos respira para que se sepa por dónde empezar.
 *
 * Con los seis, todos se elevan, se juntan en un corazón y sale el final.
 *
 * Escondido: tres toques en el hueco vacío sueltan una luciérnaga que sigue
 * al dedo. No sirve para nada y por eso está.
 *
 * Todo lo que dice está en `textos.js`, al lado.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, setVars, wait } from "../../utils/dom.js";
import { damp } from "../../utils/math.js";
import { seeded } from "../../utils/rng.js";
import textos from "./textos.js";

/** Dónde se posa cada cosa sobre la mesa, en % del hueco. */
const SITIOS = {
  cerilla:  { x: 22, y: 18, r: -14 },
  papel:    { x: 70, y: 15, r: 8 },
  llave:    { x: 78, y: 48, r: -6 },
  concha:   { x: 26, y: 52, r: 12 },
  estrella: { x: 52, y: 78, r: 0 },
  anillo:   { x: 15, y: 82, r: -4 },
};

const EMPUJON_MS = 8000;

export default class UltimaSorpresaPage extends BasePage {
  static type = "sorpresa";

  build() {
    // El título de `textos.js` manda también fuera de la página: es el que
    // sale en la barra de abajo y en el índice del libro.
    this.chapter = { ...this.chapter, title: textos.titulo };

    this.root = el("section.page.sorpresa", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": textos.titulo,
    });
    setVars(this.root, { "--accent": this.palette.a, "--luz": "0" });

    this.mesa = el("div.sorpresa__mesa", { "data-claim-drag": "" });
    this.objetos = {};

    // ── Los seis objetos, cada uno con su forma ───────────────────────
    this.#poner("cerilla", `
      <span class="obj__palo"></span>
      <span class="obj__cabeza"></span>
      <span class="obj__llama"></span>`);

    this.#poner("papel", `
      <span class="obj__hoja obj__hoja--1"></span>
      <span class="obj__hoja obj__hoja--2"></span>
      <span class="obj__escrito">Marissa</span>`);

    this.#poner("llave", `
      <span class="obj__anilla"></span>
      <span class="obj__vastago"></span>
      <span class="obj__dientes"></span>`);

    this.#poner("concha", `
      <span class="obj__valva"></span>
      <span class="obj__eco"></span>`);

    this.#poner("estrella", `<span class="obj__punta"></span><span class="obj__estela"></span>`);

    this.#poner("anillo", `<span class="obj__aro"></span><span class="obj__piedra"></span>`);

    // ── Lo que va diciendo cada cosa ──────────────────────────────────
    this.dicho = el("p.sorpresa__dice", { "aria-live": "polite" });
    this.contador = el("div.sorpresa__contador", { "aria-hidden": "true" });
    for (let i = 0; i < 6; i++) this.contador.append(el("i.sorpresa__pip"));

    // ── El final ──────────────────────────────────────────────────────
    this.finalEl = el("div.sorpresa__final", {}, [
      el("p.sorpresa__final-chico", { text: textos.final }),
      el("p.sorpresa__final-grande", { text: textos.finalGrande }),
      el("p.sorpresa__firma", { text: textos.firma }),
    ]);

    this.corazon = el("div.sorpresa__corazon", { "aria-hidden": "true" });
    this.bichos = el("div.sorpresa__bichos", { "aria-hidden": "true" });

    this.root.append(
      el("header.sorpresa__head.entra--cajon", {}, [
        el("span.kicker", { text: textos.arriba }),
        el("h2.sorpresa__titulo", { text: textos.titulo }),
        el("p.sorpresa__intro", { text: textos.intro }),
      ]),
      this.mesa,
      this.dicho,
      this.contador,
      this.corazon,
      this.finalEl,
      this.bichos
    );

    return this.root;
  }

  /** Coloca un objeto en su sitio de la mesa. */
  #poner(nombre, html) {
    const sitio = SITIOS[nombre];
    const nodo = el(`button.sorpresa__obj.obj--${nombre}`, {
      type: "button",
      "aria-label": `Una cosa del cajón: ${nombre}`,
      dataset: { obj: nombre },
    });
    nodo.innerHTML = html;
    setVars(nodo, {
      "--x": `${sitio.x}%`,
      "--y": `${sitio.y}%`,
      "--r": `${sitio.r}deg`,
    });
    this.mesa.append(nodo);
    this.objetos[nombre] = { node: nodo, found: false, nombre };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Vida
  // ═══════════════════════════════════════════════════════════════════

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.rng = seeded(`sorpresa-${this.id}`);
    this.encontrados = 0;
    this.luz = 0;
    this.toquesVacios = 0;

    const yaVisto = this.ctx.store.hasSecret(this.entry.secret);

    this.#cerilla();
    this.#papel();
    this.#llave();
    this.#concha();
    this.#estrella();
    this.#anillo();
    this.#luciernagas();

    if (yaVisto) {
      // Ya lo descubrió otro día: se abre entero, sin obligarla a repetirlo.
      for (const nombre of Object.keys(this.objetos)) this.#hallar(nombre, false);
    } else {
      this.empujon = setTimeout(() => {
        if (this.encontrados === 0) {
          this.root.classList.add("is-nudging");
          this.ctx.ui?.toast?.(textos.empujoncito, 2600);
        }
      }, EMPUJON_MS);
    }

    // Un solo reloj para toda la página: la luz de la cerilla y nada más.
    this.addTicker((dt) => {
      this.luz = damp(this.luz, this.objetos.cerilla.found ? 1 : 0, 1.6, dt);
      setVars(this.root, { "--luz": this.luz.toFixed(3) });
    }, 12);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Las seis maneras de tocar
  // ═══════════════════════════════════════════════════════════════════

  /** CERILLA — un toque y prende. Ilumina toda la mesa. */
  #cerilla() {
    const o = this.objetos.cerilla;
    this.on(o.node, "click", () => {
      if (o.found) return;
      o.node.classList.add("is-lit");
      this.ctx.audio.play("open", { volume: 0.3, rate: 1.9 });
      this.ctx.gl?.flash(0.18);
      this.#hallar("cerilla", true);
    });
  }

  /** PAPEL — se desdobla en dos tiempos. */
  #papel() {
    const o = this.objetos.papel;
    let paso = 0;
    this.on(o.node, "click", () => {
      if (o.found) return;
      paso++;
      o.node.classList.add(`is-fold-${paso}`);
      this.ctx.haptics.play("tick");
      this.ctx.audio.play("turn", { volume: 0.2, rate: 1.5 });
      if (paso >= 2) this.#hallar("papel", true);
    });
  }

  /** LLAVE — hay que girarla arrastrando. */
  #llave() {
    const o = this.objetos.llave;
    let giro = 0;
    this.addGestures(
      new Gestures(
        o.node,
        {
          onPan: (e) => {
            if (o.found) return;
            giro += Math.abs(e.vx) + Math.abs(e.vy);
            setVars(o.node, { "--giro": `${(giro * 26).toFixed(0)}deg` });
            if (Math.floor(giro * 4) % 2 === 0) this.ctx.haptics.play("tick");
            if (giro > 4) this.#hallar("llave", true);
          },
        },
        { exclusive: true, threshold: 4 }
      )
    );
  }

  /** CONCHA — hay que sostenerla para oír lo que suena dentro. */
  #concha() {
    const o = this.objetos.concha;
    this.addGestures(
      new Gestures(
        o.node,
        {
          onDown: () => o.node.classList.add("is-listening"),
          onUp: () => o.node.classList.remove("is-listening"),
          onLongPress: () => {
            if (o.found) return;
            this.ctx.audio.play("open", { volume: 0.22, rate: 0.5 });
            this.#hallar("concha", true);
          },
        },
        { exclusive: true, threshold: 14, longPressMs: 700 }
      )
    );
  }

  /** ESTRELLA — dos toques y se cae. */
  #estrella() {
    const o = this.objetos.estrella;
    this.addGestures(
      new Gestures(
        o.node,
        {
          onTap: () => {
            if (o.found) return;
            o.node.classList.remove("is-blink");
            void o.node.offsetWidth;
            o.node.classList.add("is-blink");
            this.ctx.haptics.play("tick");
          },
          onDoubleTap: () => {
            if (o.found) return;
            o.node.classList.add("is-falling");
            this.ctx.gl?.pulse(0.5);
            this.#hallar("estrella", true);
          },
        },
        { exclusive: true, threshold: 12 }
      )
    );
  }

  /** ANILLO — un toque y gira. */
  #anillo() {
    const o = this.objetos.anillo;
    this.on(o.node, "click", () => {
      if (o.found) return;
      o.node.classList.add("is-spinning");
      this.ctx.audio.play("turn", { volume: 0.18, rate: 2.4 });
      this.#hallar("anillo", true);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Encontrar
  // ═══════════════════════════════════════════════════════════════════

  #hallar(nombre, celebrar) {
    const o = this.objetos[nombre];
    if (!o || o.found) return;
    o.found = true;
    o.node.classList.add("is-found");
    o.node.disabled = false; // se puede seguir tocando: acariciarlas es gratis
    this.encontrados++;

    this.contador.children[this.encontrados - 1]?.classList.add("is-on");
    this.root.classList.remove("is-nudging");
    clearTimeout(this.empujon);

    if (celebrar) {
      this.ctx.haptics.play("reveal");
      this.#decir(textos.objetos[nombre]?.dice);
    }

    if (this.encontrados >= 6) this.#terminar(celebrar);
    else if (celebrar && this.encontrados >= 4) {
      this.later(() => this.#decir(textos.quedan(6 - this.encontrados)), 2600);
    }
  }

  #decir(frase) {
    if (!frase) return;
    this.dicho.textContent = frase;
    this.dicho.classList.remove("is-visible");
    void this.dicho.offsetWidth;
    this.dicho.classList.add("is-visible");
    clearTimeout(this.decirTimer);
    this.decirTimer = setTimeout(() => this.dicho.classList.remove("is-visible"), 3600);
  }

  /**
   * El final: las seis cosas se elevan, se juntan en el centro y se deshacen
   * en un corazón. Después, y sólo después, el texto.
   */
  async #terminar(celebrar) {
    if (this.terminada) return;
    this.terminada = true;

    if (!celebrar) {
      this.root.classList.add("is-done", "is-said");
      return;
    }

    this.ctx.haptics.play("secret");
    this.ctx.audio.play("open", { volume: 0.55 });
    await wait(420);

    this.root.classList.add("is-rising");
    this.ctx.gl?.pulse(1);
    await wait(760);

    this.#formarCorazon();
    this.root.classList.add("is-done");
    this.ctx.haptics.play("heart");
    this.ctx.gl?.flash(0.4);
    await wait(900);

    this.root.classList.add("is-said");
    this.unlockSecret();
  }

  /** Los corazones que salen del centro al terminar. */
  #formarCorazon() {
    if (this.ctx.caps.reducedMotion) return;
    const cuantos = this.ctx.caps.tierName === "low" ? 10 : 20;

    for (let i = 0; i < cuantos; i++) {
      const t = (i / cuantos) * Math.PI * 2;
      // Curva de corazón: la de toda la vida, en paramétricas.
      const hx = 16 * Math.sin(t) ** 3;
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const nodo = el("span.sorpresa__latido", { text: "♥" });
      setVars(nodo, {
        "--hx": `${(hx * 5.4).toFixed(1)}px`,
        "--hy": `${(hy * 5.4).toFixed(1)}px`,
        "--delay": `${(i * 26).toFixed(0)}ms`,
        "--size": this.rng.range(0.65, 1.25).toFixed(2),
      });
      this.corazon.append(nodo);
    }
    this.later(() => (this.corazon.textContent = ""), 4200);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Lo que no sirve para nada (y por eso está)
  // ═══════════════════════════════════════════════════════════════════

  #luciernagas() {
    this.addGestures(
      new Gestures(
        this.mesa,
        {
          onTap: (e) => {
            // Sólo cuenta si toca el hueco, no un objeto.
            if (e.target?.closest?.(".sorpresa__obj")) return;
            this.toquesVacios++;
            if (this.toquesVacios !== 3 || this.bicho) return;

            this.bicho = el("span.sorpresa__bicho");
            this.bichos.append(this.bicho);
            this.ctx.ui?.toast?.(textos.luciernaga, 2000);
            this.ctx.haptics.play("tap");

            // Sigue al dedo con retraso: es lo que la hace parecer viva.
            //
            // La caja de la página se mide UNA vez y se guarda. Medirla dentro
            // del reloj obligaba al navegador a recalcular la maquetación
            // sesenta veces por segundo para saber algo que no cambia mientras
            // la página está abierta; y encima justo cuando hay una animación
            // en marcha, que es cuando peor sienta.
            const caja = this.root.getBoundingClientRect();
            this.bichoPos = { x: e.x - caja.left, y: e.y - caja.top };
            this.addTicker((dt) => {
              const p = this.ctx.pointer.influence;
              const destino = {
                x: caja.width * (0.5 + p.x * 0.42),
                y: caja.height * (0.5 + p.y * 0.42),
              };
              this.bichoPos.x = damp(this.bichoPos.x, destino.x, 1.6, dt);
              this.bichoPos.y = damp(this.bichoPos.y, destino.y, 1.6, dt);
              setVars(this.bicho, {
                "--bx": `${this.bichoPos.x.toFixed(0)}px`,
                "--by": `${this.bichoPos.y.toFixed(0)}px`,
              });
            }, 13);
          },
        },
        { threshold: 14 }
      )
    );
  }

  destroy() {
    clearTimeout(this.empujon);
    clearTimeout(this.decirTimer);
    super.destroy();
  }
}
