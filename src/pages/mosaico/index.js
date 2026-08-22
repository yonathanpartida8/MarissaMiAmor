/**
 * MOSAICPAGE — la imagen aparece por pedazos.
 *
 * La ilustración está partida en piezas boca abajo. Cada toque gira una y
 * descubre su trozo; las que quedan alrededor se levantan un poco, como si la
 * mesa se hubiera movido. Cuando están todas, las juntas desaparecen y la
 * imagen se queda entera un momento antes de que llegue el texto.
 *
 * Es la página que mejor cuenta lo de "no te conocí de golpe".
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, splitWords, setVars, wait } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";

/** Rejilla según el tamaño de pantalla: piezas siempre cómodas de tocar. */
const GRID = { phone: [3, 4], tablet: [4, 5], desktop: [4, 5] };

export default class MosaicPage extends BasePage {
  static type = "mosaic";

  build() {
    const ch = this.chapter;
    this.root = el("section.page.mosaic", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    this.board = el("div.mos__board", { "data-claim-drag": "" });
    this.proseEl = el("div.mos__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.counter = el("span.mos__count", { text: "" });

    this.root.append(
      el("header.mos__head.entra--encaja", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        this.counter,
      ]),
      el("div.mos__stage", {}, [this.board, el("div.mos__whole")]),
      el("div.vidrio.mos__panel.hueco-barra", {}, [
        el("h2.mos__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.lectura.mos__scroll", {}, [this.proseEl]),
      ])
    );

    this.wholeEl = this.root.querySelector(".mos__whole");
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);

    const photo = this.photos[0];
    if (photo) {
      await this.ctx.assets.load(photo.src).catch(() => {});
      this.src = photo.src;
      this.wholeEl.style.backgroundImage = `url("${photo.src}")`;
    }

    const device = document.documentElement.dataset.device || "phone";
    const [cols, rows] = GRID[device] || GRID.phone;
    this.total = cols * rows;
    this.turned = 0;

    setVars(this.board, { "--cols": String(cols), "--rows": String(rows) });

    // Orden de aparición sembrado: siempre el mismo, pero sin patrón visible.
    const rng = seeded(`mosaico-${this.id}`);
    const order = rng.shuffle([...Array(this.total).keys()]);

    this.tiles = [];
    for (let i = 0; i < this.total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const tile = el("button.mos__tile", {
        type: "button",
        "aria-label": `Pieza ${i + 1}`,
        dataset: { index: String(i) },
      }, [
        el("span.mos__face.mos__face--back", {}, [el("i.mos__mark", { text: "❦" })]),
        el("span.mos__face.mos__face--front"),
      ]);

      const face = tile.querySelector(".mos__face--front");
      if (this.src) {
        face.style.backgroundImage = `url("${this.src}")`;
        // Cada pieza enseña su recorte exacto de la imagen completa.
        face.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
        face.style.backgroundPosition =
          `${cols > 1 ? (col / (cols - 1)) * 100 : 0}% ${rows > 1 ? (row / (rows - 1)) * 100 : 0}%`;
      }

      tile.style.setProperty("--d", String(order.indexOf(i)));
      this.board.append(tile);
      this.tiles.push({ node: tile, index: i, col, row, turned: false });
    }

    this.cols = cols;
    this.rows = rows;
    this.#layout();
    this.track(this.ctx.viewport.on("resize", () => this.#layout()));

    this.#updateCount();
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.addGestures(
      new Gestures(
        this.board,
        {
          onTap: (e) => {
            const node = e.target?.closest?.(".mos__tile");
            if (node) this.#turn(this.tiles[Number(node.dataset.index)]);
          },
          onPan: (e) => {
            // Arrastrando por encima también se van girando: es más satisfactorio
            // que ir tocando una por una, y se descubre solo.
            const node = document.elementFromPoint(e.x, e.y)?.closest?.(".mos__tile");
            if (node) this.#turn(this.tiles[Number(node.dataset.index)]);
          },
        },
        { exclusive: true, threshold: 6 }
      )
    );
  }

  /**
   * Encaja el tablero en el hueco disponible conservando su proporción.
   * En CSS puro esto acaba siempre desbordando o deformándose; con dos
   * medidas y una multiplicación queda exacto.
   */
  #layout() {
    const stage = this.root.querySelector(".mos__stage");
    const rect = stage?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return;

    const ratio = this.cols / this.rows;
    let w = rect.width;
    let h = w / ratio;
    if (h > rect.height) {
      h = rect.height;
      w = h * ratio;
    }

    for (const node of [this.board, this.wholeEl]) {
      node.style.width = `${Math.floor(w)}px`;
      node.style.height = `${Math.floor(h)}px`;
    }
  }

  #turn(tile) {
    if (!tile || tile.turned) return;
    tile.turned = true;
    tile.node.classList.add("is-turned");
    this.turned++;

    this.ctx.haptics.play("tap");
    this.ctx.audio.play("turn", { volume: 0.14, rate: 1.5 + Math.random() * 0.4 });

    // Las vecinas se estremecen: la mesa se movió.
    for (const other of this.tiles) {
      if (other.turned) continue;
      const d = Math.abs(other.col - tile.col) + Math.abs(other.row - tile.row);
      if (d > 1) continue;
      other.node.classList.remove("is-nudged");
      void other.node.offsetWidth;
      other.node.classList.add("is-nudged");
    }

    this.#updateCount();
    if (this.turned >= this.total) this.#complete();
  }

  #updateCount() {
    this.counter.textContent = `${this.turned} / ${this.total}`;
  }

  async #complete() {
    this.root.classList.add("is-joined");
    this.ctx.haptics.play("reveal");
    this.ctx.gl?.pulse(0.7);

    // Las juntas se cierran y la imagen queda entera un momento, sola.
    await wait(900);
    this.root.classList.add("is-whole");
    this.ctx.gl?.flash(0.25);

    await wait(700);
    this.root.classList.add("is-told");
    this.proseEl.classList.add("is-writing");
    this.unlockSecret();
  }
}
