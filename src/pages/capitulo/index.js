/**
 * CHAPTERPAGE — la página de papel escrito.
 *
 * Es la base del libro, pero no es "la página aburrida": cada capítulo recibe
 * un ornamento distinto (una foto que se revela, un cristal empañado que hay
 * que limpiar, un reflejo, una brújula, un susurro), y el texto se escribe
 * solo, palabra a palabra, cuando la página termina de girar.
 */

import { BasePage } from "../BasePage.js";
import { createOrnament } from "../../components/ornaments.js";
import { createSparkles } from "../../components/Sparkles.js";
import { el, splitWords } from "../../utils/dom.js";
import { manifest } from "../../data/manifest.js";
import escondidos from "../../data/escondidos.js";
import { Gestures } from "../../core/Gestures.js";

/**
 * Qué ornamento le toca a cada capítulo.
 *
 * Ojo con esta tabla: las claves son ids de capítulo de `chapters.js`. Al
 * reescribir los textos cambiaron todos los ids y esta tabla se quedó
 * apuntando a capítulos que ya no existen, así que las OCHO páginas de
 * capítulo caían en el medallón. Cuatro de ellas prometían en su pista una
 * interacción —«pasa el dedo por el cristal empañado», «el reflejo te
 * sigue»— que no llegaba a existir, y el libro se sentía repetido.
 */
const ORNAMENT_BY_CHAPTER = {
  "llueve-alla": "fog",        // «pasa el dedo por el cristal empañado»
  "me-caigo-mejor": "mirror",  // «el reflejo te sigue»
  "mi-norte": "compass",       // la brújula que siempre apunta a lo mismo
  "te-lo-digo-bajito": "whisper", // «acércate: está escrito bajito»
  "tu-voz": "whisper",
  "gracias": "compass",
  // El resto se queda con el medallón, que es el que enseña foto.
};

export default class ChapterPage extends BasePage {
  static type = "chapter";

  get ornamentName() {
    return ORNAMENT_BY_CHAPTER[this.chapter?.id] || "medallion";
  }

  build() {
    const ch = this.chapter;
    const index = manifest.findIndex((e) => e.id === this.id);
    const num = String(index + 1).padStart(2, "0");
    const accent = this.palette.a;

    this.root = el("section.page.paper.chapter", {
      "data-page": this.id,
      "data-mood": this.mood,
      "data-ornament": this.ornamentName,
      "aria-label": ch?.title,
    });

    // ---- Cuerpo del texto (se construye primero: hay ornamentos que
    //      necesitan una referencia a él, como el susurro) --------------
    this.titleEl = el("h2.title.chapter__title", { text: ch?.title || "" });
    this.proseEl = el("div.prose.chapter__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    const scroll = el("div.lectura.chapter__scroll", {}, [
      this.titleEl,
      el("hr.rule.chapter__rule"),
      this.proseEl,
      el("div.chapter__sign", { text: "— siempre tuyo" }),
    ]);
    this.scrollEl = scroll;

    // ---- Ornamento: la sorpresa de este capítulo ---------------------
    this.ornament = createOrnament(this.ornamentName, this.ctx, {
      photo: this.photos[0] || null,
      accent,
      target: scroll,
      onReveal: () => this.unlockSecret(),
    });

    // Motas flotando sobre el papel: presencia, no decoración.
    this.sparkles = createSparkles(this.ctx, { seed: `cap-${this.id}` });

    // ---- Montaje ------------------------------------------------------
    this.root.append(
      el("header.chapter__head", {}, [
        (this.numEl = el("button.chapter__num", {
          type: "button",
          text: num,
          "aria-label": `Capítulo ${num}`,
        })),
        el("span.chapter__kicker", { text: ch?.kicker || "" }),
      ]),
      el("div.chapter__ornament", {}, [this.ornament.node]),
      el("div.chapter__body", {}, [scroll]),
      el("footer.chapter__foot.hueco-barra", {}, [
        el("span.chapter__mark", { text: "❦" }),
        el("span.chapter__count", { text: `${num} · ${manifest.length}` }),
      ]),
      this.sparkles.node
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    // El texto se escribe cuando la página ya está quieta, no durante el giro:
    // animar mientras algo rota en 3D se ve mal y cuesta el doble.
    requestAnimationFrame(() => {
      this.root.classList.add("is-entered");
      this.proseEl.classList.add("is-writing");
    });

    this.#escondite();
    await this.ornament.enter?.();
    this.addTicker((dt, t, realDt) => this.ornament.tick?.(dt, t, realDt), 12);
  }

  /**
   * Escondido: doble toque en el número del capítulo.
   *
   * Va arriba a la izquierda y no abajo, que es donde estaba primero: abajo
   * caía justo debajo del botón redondo de pasar página y el dedo no llegaba
   * nunca a tocarlo.
   *
   * Los ocho capítulos lo llevan, pero cada uno dice una cosa distinta —y
   * siempre la misma para ese capítulo—, así que no se repite ni parece un
   * mensaje genérico enganchado a todas las páginas.
   */
  #escondite() {
    const marca = this.numEl;
    if (!marca) return;

    const frases = escondidos.capitulo;
    let suma = 0;
    for (const c of String(this.id)) suma = (suma * 31 + c.charCodeAt(0)) >>> 0;
    const frase = frases[suma % frases.length];

    this.addGestures(
      new Gestures(
        marca,
        {
          onDoubleTap: (e) => {
            marca.classList.add("is-awake");
            this.escondite(`capitulo-${this.id}`, frase, e);
          },
        },
        { threshold: 14 }
      )
    );
  }

  async leave(direction) {
    await super.leave(direction);
    this.root?.classList.remove("is-entered");
  }

  destroy() {
    this.ornament?.destroy?.();
    this.sparkles?.destroy();
    super.destroy();
  }
}
