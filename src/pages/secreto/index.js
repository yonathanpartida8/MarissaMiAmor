/**
 * SECRETO — lo que está escrito entre líneas.
 *
 * Una nota corriente sobre papel. Corriente hasta que se tocan las palabras:
 * unas cuantas están marcadas y, al tocarlas, se encienden y sueltan al margen
 * lo que de verdad querían decir. No hay ninguna indicación de cuáles son —
 * eso es la gracia— pero si pasa un rato sin encontrar ninguna, la página
 * empuja un poco. Nunca se queda encallada.
 *
 * Y hay dos cosas más que nadie tiene por qué encontrar:
 *   · el lacre de la esquina, si se mantiene pulsado, se ablanda y confiesa;
 *   · un doble toque en el papel suelta un corazón que sube.
 *
 * Todo lo que dice —incluidas las palabras marcadas— está en `textos.js`.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createSparkles } from "../../components/Sparkles.js";
import { el, setVars, wait } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";
import textos from "./textos.js";

/** Cuántas hay que encontrar para que se abra el final. */
const PARA_TERMINAR = (total) => Math.max(1, total - 1);

/** Si no encuentra nada en este rato, la página ayuda un poco. */
const EMPUJON_MS = 7000;

export default class SecretoPage extends BasePage {
  static type = "secret";

  build() {
    // El título de `textos.js` manda también fuera de la página: es el que
    // sale en la barra de abajo y en el índice del libro.
    this.chapter = { ...this.chapter, title: textos.titulo };

    this.root = el("section.page.secreto.paper.paper--aged", {
      "data-page": this.id,
      "aria-label": textos.titulo,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // ── La nota, con sus palabras marcadas ────────────────────────────
    this.marcadas = [];
    const parrafo = el("p.secreto__nota");

    // El texto se parte por *asteriscos*: lo de dentro es una palabra marcada.
    String(textos.nota).split(/(\*[^*]+\*)/).forEach((trozo) => {
      if (!trozo) return;
      if (trozo.startsWith("*") && trozo.endsWith("*")) {
        const i = this.marcadas.length;
        const palabra = el("button.secreto__palabra", {
          type: "button",
          text: trozo.slice(1, -1),
          "aria-label": `Descubrir lo que esconde «${trozo.slice(1, -1)}»`,
          dataset: { i: String(i) },
        });
        this.marcadas.push({ node: palabra, frase: textos.escondidas[i] || "", found: false });
        parrafo.append(palabra);
      } else {
        parrafo.append(document.createTextNode(trozo));
      }
    });

    this.margen = el("div.secreto__margen", { "aria-live": "polite" });

    // ── El lacre de la esquina (easter egg) ───────────────────────────
    this.lacre = el("button.secreto__lacre", {
      type: "button",
      "aria-label": "Un lacre",
      html: `<span class="secreto__lacre-txt">${textos.lacre}</span>`,
    });

    this.confesion = el("p.secreto__confesion", { text: textos.secretoDelLacre });

    // ── Polvo en la luz ───────────────────────────────────────────────
    this.sparkles = createSparkles(this.ctx, { seed: `secreto-${this.id}`, scale: 0.55 });

    this.contador = el("div.secreto__contador", { "aria-hidden": "true" });
    this.marcadas.forEach(() => this.contador.append(el("i.secreto__pip")));

    this.finalEl = el("p.secreto__final", { text: textos.final });

    this.hoja = el("div.secreto__hoja", {}, [
      el("header.secreto__head", {}, [
        el("span.kicker", { text: textos.arriba }),
        el("h2.title.secreto__titulo", { text: textos.titulo }),
      ]),
      el("hr.rule"),
      el("div.secreto__scroll", {}, [parrafo]),
      this.margen,
      this.contador,
      this.finalEl,
    ]);

    this.root.append(this.hoja, this.lacre, this.confesion, this.sparkles.node);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.rng = seeded(`secreto-${this.id}`);
    this.encontradas = 0;
    this.meta = PARA_TERMINAR(this.marcadas.length);

    // Si ya lo descubrió otro día, se abre entero: no se repite el juego.
    if (this.ctx.store.hasSecret(this.entry.secret)) {
      this.marcadas.forEach((m, i) => this.#descubrir(m, i, false));
      this.#terminar(false);
    } else {
      this.marcadas.forEach((m, i) => this.#bind(m, i));
      // Si pasa un rato sin encontrar nada, las palabras parpadean.
      this.empujon = setTimeout(() => {
        if (this.encontradas === 0) {
          this.root.classList.add("is-nudging");
          this.#susurrar(textos.empujoncito);
        }
      }, EMPUJON_MS);
    }

    this.#easterEggs();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Las palabras
  // ═══════════════════════════════════════════════════════════════════

  #bind(marca, i) {
    this.on(marca.node, "click", () => this.#descubrir(marca, i, true));
  }

  #descubrir(marca, i, celebrar) {
    if (marca.found) return;
    marca.found = true;
    this.encontradas++;

    marca.node.classList.add("is-found");
    marca.node.disabled = true;
    this.contador.children[i]?.classList.add("is-on");
    this.root.classList.remove("is-nudging");
    clearTimeout(this.empujon);

    if (celebrar) {
      this.ctx.haptics.play("reveal");
      this.ctx.audio.play("turn", { volume: 0.16, rate: 1.9 });
      this.ctx.gl?.pulse(0.35);
    }

    // La frase escondida cae al margen, con su propia entrada.
    const linea = el("p.secreto__linea", { text: marca.frase });
    setVars(linea, { "--tilt": `${this.rng.range(-1.6, 1.6).toFixed(2)}deg` });
    this.margen.append(linea);
    if (celebrar) requestAnimationFrame(() => linea.classList.add("is-in"));
    else linea.classList.add("is-in");

    // Un corazón pequeño sube desde la palabra tocada.
    if (celebrar) this.#corazon(marca.node);

    if (this.encontradas >= this.meta) this.#terminar(celebrar);
  }

  async #terminar(celebrar) {
    if (this.terminada) return;
    this.terminada = true;
    this.root.classList.add("is-lit");

    if (!celebrar) {
      this.root.classList.add("is-said");
      return;
    }

    this.ctx.haptics.play("secret");
    this.ctx.gl?.flash(0.28);
    this.ctx.gl?.pulse(0.9);
    await wait(560);
    this.root.classList.add("is-said");
    this.unlockSecret();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Los que nadie tiene por qué encontrar
  // ═══════════════════════════════════════════════════════════════════

  #easterEggs() {
    // 1. El lacre: mantenerlo pulsado lo ablanda y confiesa.
    this.addGestures(
      new Gestures(
        this.lacre,
        {
          onDown: () => this.lacre.classList.add("is-pressing"),
          onUp: () => this.lacre.classList.remove("is-pressing"),
          onLongPress: () => {
            if (this.lacreAbierto) return;
            this.lacreAbierto = true;
            this.lacre.classList.add("is-melted");
            this.root.classList.add("is-confessed");
            this.ctx.haptics.play("secret");
            this.ctx.audio.play("open", { volume: 0.4, rate: 1.3 });
            this.#corazon(this.lacre);
          },
        },
        { exclusive: true, threshold: 12, longPressMs: 620 }
      )
    );

    // 2. Doble toque en el papel: sube un corazón con su frase.
    this.addGestures(
      new Gestures(
        this.hoja,
        {
          onDoubleTap: (e) => {
            this.ctx.haptics.play("tap");
            this.corazon(e.x, e.y, textos.corazonSuelto);
          },
        },
        { threshold: 16 }
      )
    );
  }

  /** Un corazón que sube desde un elemento de la página. */
  #corazon(desde, frase) {
    const r = desde.getBoundingClientRect();
    this.corazon(r.left + r.width / 2, r.top + r.height / 2, frase);
  }

  #susurrar(frase) {
    this.ctx.ui?.toast?.(frase, 2400);
  }

  destroy() {
    clearTimeout(this.empujon);
    this.sparkles?.destroy();
    super.destroy();
  }
}
