/**
 * ÚLTIMA SORPRESA — el cajón de las cosas pequeñas.
 *
 * Seis recuerdos guardados en el forro de un cajón, y cada uno se toca de
 * una manera distinta: la huella de un beso prende con un toque y enciende
 * todo lo demás, la carta se abre en dos tiempos, la espiral se desenrolla
 * arrastrando, el corazón hay que sostenerlo para notarlo, la estrella pide
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

/**
 * Dónde se posa cada cosa dentro del cajón, en % del hueco, con su
 * inclinación y su tamaño.
 *
 * Nada está alineado con nada: las cosas de un cajón caen como caen. Los
 * tamaños tampoco son iguales —la carta ocupa, el anillo casi no— porque
 * seis objetos del mismo tamaño se leen como una cuadrícula de iconos y no
 * como un puñado de recuerdos.
 */
const SITIOS = {
  beso:     { x: 26, y: 17, r: -11, s: 1.12 },
  carta:    { x: 71, y: 20, r: 7,   s: 1.20 },
  espiral:  { x: 79, y: 51, r: -5,  s: 0.94 },
  corazon:  { x: 24, y: 49, r: 13,  s: 0.98 },
  estrella: { x: 55, y: 77, r: -6,  s: 0.86 },
  anillo:   { x: 17, y: 80, r: -3,  s: 0.80 },
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

    // ── Los seis recuerdos, cada uno dibujado ─────────────────────────
    //
    // Van en SVG y no en cajas de CSS. Con `<span>`s y bordes redondeados se
    // llega hasta la llave y la concha —que era lo que había—, pero no hasta
    // la huella de un beso ni el lacre de una carta: eso pide trazo, y el
    // trazo pide un trazado. De paso cada cosa es UN nodo con UNA silueta, y
    // no tres piezas que hay que hacer coincidir.
    this.#poner("beso", `
      <svg class="obj__svg" viewBox="0 0 44 40" aria-hidden="true">
        <rect class="obj__tarjeta" x="1" y="2" width="42" height="36" rx="2.5"/>
        <g class="obj__labios">
          <path d="M11.4 17.4C11 13.3 15.1 10.6 18.4 12.1c1.8.8 3 2.4 3.6 4 .6-1.6 1.8-3.2 3.6-4 3.3-1.5 7.4 1.2 7 5.3-5.7-1.5-15.5-1.5-21.2 0z"/>
          <path d="M11.4 18.6c5.7-1 15.5-1 21.2 0-1.2 5.3-5.4 9-10.6 9s-9.4-3.7-10.6-9z"/>
          <path class="obj__labios-luz" d="M15.2 20.6c3.6-.7 10-.7 13.6 0-1 .8-2.4 1.2-3.6 1.2H18.8c-1.2 0-2.6-.4-3.6-1.2z"/>
        </g>
        <path class="obj__grieta" d="M13 30.5c5-1.2 13-1.2 18 0" />
      </svg>`);

    this.#poner("carta", `
      <svg class="obj__svg" viewBox="0 0 46 34" aria-hidden="true">
        <rect class="obj__sobre" x="1" y="1" width="44" height="32" rx="2"/>
        <path class="obj__solapa" d="M1 3.2 23 18 45 3.2"/>
        <path class="obj__renglon obj__renglon--1" d="M9 22h28"/>
        <path class="obj__renglon obj__renglon--2" d="M9 26h20"/>
        <g class="obj__lacre">
          <circle cx="23" cy="19.5" r="5.4"/>
          <path class="obj__lacre-corazon" d="M23 22.6c-2-1.5-3.3-2.6-3.3-3.9 0-1 .8-1.8 1.8-1.8.6 0 1.2.3 1.5.8.3-.5.9-.8 1.5-.8 1 0 1.8.8 1.8 1.8 0 1.3-1.3 2.4-3.3 3.9z"/>
        </g>
      </svg>`);

    this.#poner("espiral", `
      <svg class="obj__svg" viewBox="0 0 40 40" aria-hidden="true">
        <path class="obj__rizo" d="M20 4c8.8 0 16 7.2 16 16s-7.2 16-16 16S4 28.8 4 20c0-6.6 5.4-12 12-12s10 4.5 10 9.5-3.6 8-7.5 8-6.5-2.8-6.5-6.2 2.4-5.3 4.8-5.3"/>
        <circle class="obj__rizo-punta" cx="16.8" cy="14" r="1.9"/>
      </svg>`);

    this.#poner("corazon", `
      <svg class="obj__svg" viewBox="0 0 38 40" aria-hidden="true">
        <path class="obj__cadena" d="M19 1v6"/>
        <circle class="obj__argolla" cx="19" cy="8.4" r="2.6"/>
        <path class="obj__guarda" d="M19 38.5C9.8 31.6 4 26 4 19.6 4 14.9 7.6 11.2 12.2 11.2c2.7 0 5.3 1.3 6.8 3.5 1.5-2.2 4.1-3.5 6.8-3.5 4.6 0 8.2 3.7 8.2 8.4 0 6.4-5.8 12-15 18.9z"/>
        <path class="obj__guarda-luz" d="M11.6 15.4c1.6-1 3.7-.8 5.1.5-1.7.6-3.6.4-5.1-.5z"/>
      </svg>`);

    this.#poner("estrella", `
      <svg class="obj__svg" viewBox="0 0 36 36" aria-hidden="true">
        <path class="obj__punta" d="M18 1.5l4.6 10.3 11.2 1.2-8.4 7.5 2.4 11-9.8-5.7-9.8 5.7 2.4-11L2.2 13l11.2-1.2z"/>
      </svg>
      <span class="obj__estela" aria-hidden="true"></span>`);

    this.#poner("anillo", `
      <svg class="obj__svg" viewBox="0 0 34 40" aria-hidden="true">
        <path class="obj__engaste" d="M13.4 13.6 17 6.4l3.6 7.2z"/>
        <path class="obj__piedra" d="M17 3.2l4.4 4.6L17 17.4 12.6 7.8z"/>
        <ellipse class="obj__aro" cx="17" cy="26.6" rx="10.4" ry="11.2"/>
      </svg>`);

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
      "--s": String(sitio.s),
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

    this.#beso();
    this.#carta();
    this.#espiral();
    this.#corazon();
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

    // Un solo reloj para toda la página: la luz del beso y nada más.
    this.addTicker((dt) => {
      this.luz = damp(this.luz, this.objetos.beso.found ? 1 : 0, 1.6, dt);
      setVars(this.root, { "--luz": this.luz.toFixed(3) });
    }, 12);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Las seis maneras de tocar
  // ═══════════════════════════════════════════════════════════════════

  /** BESO — un toque, y la huella prende y enciende el cajón entero. */
  #beso() {
    const o = this.objetos.beso;
    this.on(o.node, "click", () => {
      if (o.found) return;
      o.node.classList.add("is-lit");
      this.ctx.audio.play("open", { volume: 0.3, rate: 1.9 });
      this.ctx.gl?.flash(0.18);
      this.#hallar("beso", true);
    });
  }

  /** CARTA — se abre en dos tiempos: el lacre y luego la solapa. */
  #carta() {
    const o = this.objetos.carta;
    let paso = 0;
    this.on(o.node, "click", () => {
      if (o.found) return;
      paso++;
      o.node.classList.add(`is-fold-${paso}`);
      this.ctx.haptics.play("tick");
      this.ctx.audio.play("turn", { volume: 0.2, rate: 1.5 });
      if (paso >= 2) this.#hallar("carta", true);
    });
  }

  /**
   * ESPIRAL — hay que desenrollarla arrastrando.
   *
   * Lo que cuenta es el CAMINO recorrido por el dedo, no la velocidad. Antes
   * se sumaba la velocidad, y eso quería decir que sólo se desenrollaba si
   * arrastrabas rápido: quien la acariciara despacio podía estar dando
   * vueltas un minuto entero sin que pasara nada. Desenrollar un mechón es
   * cuestión de cuánto tiras, no de con qué prisa.
   */
  #espiral() {
    const o = this.objetos.espiral;
    const CAMINO = 260; // píxeles de recorrido para soltarla del todo
    let recorrido = 0;
    let ultimo = null;
    let clic = 0;

    this.addGestures(
      new Gestures(
        o.node,
        {
          onPanStart: (e) => { ultimo = { x: e.x, y: e.y }; },
          onPan: (e) => {
            if (o.found) return;
            if (ultimo) recorrido += Math.hypot(e.x - ultimo.x, e.y - ultimo.y);
            ultimo = { x: e.x, y: e.y };

            const parte = Math.min(1, recorrido / CAMINO);
            setVars(o.node, { "--giro": `${(parte * 340).toFixed(0)}deg` });

            // Un clic cada tramo: se nota que va cediendo.
            const tramo = Math.floor(recorrido / 26);
            if (tramo !== clic) { clic = tramo; this.ctx.haptics.play("tick"); }

            if (parte >= 1) this.#hallar("espiral", true);
          },
          onPanEnd: () => { ultimo = null; },
        },
        { exclusive: true, threshold: 4 }
      )
    );
  }

  /** CORAZÓN — hay que sostenerlo un momento para notarlo latir. */
  #corazon() {
    const o = this.objetos.corazon;
    this.addGestures(
      new Gestures(
        o.node,
        {
          onDown: () => o.node.classList.add("is-listening"),
          onUp: () => o.node.classList.remove("is-listening"),
          onLongPress: () => {
            if (o.found) return;
            this.ctx.haptics.play("heart");
            this.ctx.audio.play("open", { volume: 0.22, rate: 0.5 });
            this.#hallar("corazon", true);
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
