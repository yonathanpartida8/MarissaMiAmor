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

/** Cuántas piezas, según el tamaño de pantalla: siempre cómodas de tocar. */
const PIEZAS = { phone: 12, tablet: 20, desktop: 20 };

/**
 * Columnas y filas para una foto de proporción `ar` (ancho / alto): las
 * piezas salen lo más cuadradas posible, sea la foto de pie o acostada.
 */
function rejilla(ar, n) {
  let cols = Math.max(2, Math.min(6, Math.round(Math.sqrt(n * ar))));
  let rows = Math.max(2, Math.min(7, Math.round(n / cols)));
  return [cols, rows];
}

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
    // El tablero toma la forma de la foto: antes era siempre de 3×4 y la
    // foto se estiraba para caber, así que salía deformada.
    this.ar = 3 / 4;
    if (photo) {
      const img = await this.ctx.assets.load(photo.src).catch(() => null);
      this.src = photo.src;
      this.wholeEl.style.backgroundImage = `url("${photo.src}")`;
      if (img?.naturalWidth && img?.naturalHeight) this.ar = img.naturalWidth / img.naturalHeight;
    }

    const device = document.documentElement.dataset.device || "phone";
    const [cols, rows] = rejilla(this.ar, PIEZAS[device] || PIEZAS.phone);
    this.total = cols * rows;
    this.turned = 0;

    setVars(this.board, { "--cols": String(cols), "--rows": String(rows) });

    // Orden de aparición sembrado: siempre el mismo, pero sin patrón visible.
    this.board.replaceChildren();
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
        // Cada pieza enseña su recorte exacto de la imagen completa. El
        // tamaño y la posición van en píxeles del tablero (ver #layout).
        face.style.backgroundImage = `url("${this.src}")`;
      }

      tile.style.setProperty("--d", String(order.indexOf(i)));
      this.board.append(tile);
      this.tiles.push({ node: tile, index: i, col, row, turned: false });
    }

    this.cols = cols;
    this.rows = rows;
    this.#layout();
    this.track(this.ctx.viewport.on("resize", () => this.#layout()));

    // Si ya se armó en una visita anterior, se queda armada.
    if (this.completado) {
      for (const t of this.tiles) { t.turned = true; t.node.classList.add("is-turned"); }
      this.turned = this.total;
    }

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

    const ratio = this.ar || this.cols / this.rows;
    let w = rect.width;
    let h = w / ratio;
    if (h > rect.height) {
      h = rect.height;
      w = h * ratio;
    }
    w = Math.floor(w);
    h = Math.floor(h);

    for (const node of [this.board, this.wholeEl]) {
      node.style.width = `${w}px`;
      node.style.height = `${h}px`;
    }

    // Cada cara lleva la foto al tamaño del tablero entero, corrida hasta
    // su trozo: juntas, las piezas son la foto tal cual, sin estirar.
    if (!this.src) return;
    const pw = w / this.cols, ph = h / this.rows;
    for (const t of this.tiles) {
      const face = t.node.lastElementChild;
      face.style.backgroundSize = `${w}px ${h}px`;
      face.style.backgroundPosition = `${(-t.col * pw).toFixed(1)}px ${(-t.row * ph).toFixed(1)}px`;
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
    this.completado = true;
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
