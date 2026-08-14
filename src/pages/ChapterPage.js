/**
 * CHAPTERPAGE — la página de papel escrito.
 *
 * Es la base del libro, pero no es "la página aburrida": cada capítulo recibe
 * un ornamento distinto (una foto que se revela, un cristal empañado que hay
 * que limpiar, un reflejo, una brújula, un susurro), y el texto se escribe
 * solo, palabra a palabra, cuando la página termina de girar.
 */

import { BasePage } from "./BasePage.js";
import { createOrnament } from "../components/ornaments.js";
import { createSparkles } from "../components/Sparkles.js";
import { el, splitWords, setVars } from "../utils/dom.js";
import { manifest } from "../data/manifest.js";

/** Qué ornamento le toca a cada capítulo. */
const ORNAMENT_BY_CHAPTER = {
  tormenta: "fog",
  espejo: "mirror",
  eleccion: "compass",
  silencio: "whisper",
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
    setVars(this.root, {
      "--accent": accent,
      "--accent-deep": this.palette.b,
      "--drop-color": accent,
      "--accent-line": accent,
    });

    // ---- Cuerpo del texto (se construye primero: hay ornamentos que
    //      necesitan una referencia a él, como el susurro) --------------
    this.titleEl = el("h2.title.chapter__title", { text: ch?.title || "" });
    this.proseEl = el("div.prose.chapter__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    const scroll = el("div.chapter__scroll", {}, [
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
        el("span.chapter__num", { text: num }),
        el("span.chapter__kicker", { text: ch?.kicker || "" }),
      ]),
      el("div.chapter__ornament", {}, [this.ornament.node]),
      el("div.chapter__body", {}, [scroll]),
      el("footer.chapter__foot", {}, [
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

    await this.ornament.enter?.();
    this.addTicker((dt, t, realDt) => this.ornament.tick?.(dt, t, realDt), 12);
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
