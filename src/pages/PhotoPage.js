/**
 * PHOTOPAGE — una imagen suya, a pantalla completa.
 *
 * Es la página más sencilla del libro y la que más se va a usar: una foto
 * grande que se mueve con la inclinación del móvil, se acerca con dos dedos, y
 * un texto que entra por debajo. Está pensada para que él pueda añadir
 * cincuenta sin que ninguna se parezca a una plantilla vacía.
 */

import { BasePage } from "./BasePage.js";
import { createPhotoFrame } from "../components/PhotoFrame.js";
import { createSparkles } from "../components/Sparkles.js";
import { el, splitWords, setVars } from "../utils/dom.js";

export default class PhotoPage extends BasePage {
  static type = "photo";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.mine.mine--photo", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    this.frame = createPhotoFrame(this.ctx, {
      photo: this.photos[0] || null,
      shape: "rect",
      ratio: "3 / 4",
      parallax: 1,
      zoomable: true,
    });

    this.proseEl = el("div.mine__prose.selectable");
    if (ch?.text) this.proseEl.append(splitWords(ch.text).frag);

    this.sparkles = createSparkles(this.ctx, { seed: `foto-${this.id}`, scale: 0.7 });

    this.root.append(
      el("div.mine__stage", {}, [this.frame.node]),
      el("div.mine__panel", {}, [
        ch?.kicker ? el("span.kicker", { text: ch.kicker }) : null,
        el("h2.mine__title", { text: ch?.title || "" }),
        ch?.text ? el("hr.rule") : null,
        ch?.text ? el("div.mine__scroll", {}, [this.proseEl]) : null,
        ch?.reveal ? el("p.mine__reveal", { text: ch.reveal }) : null,
      ]),
      this.sparkles.node
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    await this.frame.load();

    requestAnimationFrame(() => {
      this.root.classList.add("is-entered");
      this.proseEl.classList.add("is-writing");
    });

    // Si escribió un "secreto", se descubre al llegar: esta página no pide
    // resolver nada, y dejarlo sin aparecer sería esconderlo para siempre.
    if (this.entry.secret) setTimeout(() => this.unlockSecret(), 1400);

    this.addTicker((dt, time) => this.frame.tick(dt, time), 11);
  }

  destroy() {
    this.frame?.destroy();
    this.sparkles?.destroy();
    super.destroy();
  }
}
