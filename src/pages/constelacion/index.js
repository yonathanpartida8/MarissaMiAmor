/**
 * CONSTELLATIONPAGE — unir las estrellas.
 *
 * Doce recuerdos convertidos en estrellas sobre el cielo de la atmósfera
 * WebGL. Se arrastra de una a otra para trazar la línea; cada unión enciende
 * la estrella y muestra lo que hay dentro. Cuando están todas unidas, el
 * dibujo se cierra y aparece el capítulo.
 *
 * No hay orden correcto: cualquier camino que las recorra todas vale. Es una
 * página sobre estar acompañada, no sobre acertar.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, splitWords, setVars } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";
import { distance } from "../../utils/math.js";
import { PRIORITY } from "../../core/AssetLoader.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SNAP_RADIUS = 46; // px: generoso, esto se juega con el dedo

export default class ConstellationPage extends BasePage {
  static type = "constellation";

  get criticalAssets() {
    return this.photos.slice(0, 2).map((p) => p.src);
  }

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;
    const rng = seeded(`${this.id}-cielo`);

    this.root = el("section.page.cons", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent });

    // ---- Cielo ----------------------------------------------------------
    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("class", "cons__svg");
    this.svg.setAttribute("preserveAspectRatio", "none");
    this.linesGroup = document.createElementNS(SVG_NS, "g");
    this.liveLine = document.createElementNS(SVG_NS, "line");
    this.liveLine.setAttribute("class", "cons__live");
    this.svg.append(this.linesGroup, this.liveLine);

    this.sky = el("div.cons__sky", { "data-claim-drag": "" }, [this.svg]);

    // Estrellas repartidas evitando que se toquen entre sí.
    this.stars = [];
    const placed = [];
    this.photos.forEach((photo, i) => {
      let x;
      let y;
      let tries = 0;
      do {
        x = rng.range(0.14, 0.86);
        y = rng.range(0.12, 0.84);
        tries++;
      } while (tries < 40 && placed.some((p) => distance(p.x, p.y, x, y) < 0.19));
      placed.push({ x, y });

      const node = el("button.cons__star", {
        type: "button",
        "aria-label": `Estrella ${i + 1}`,
        dataset: { index: String(i) },
        style: { left: `${x * 100}%`, top: `${y * 100}%` },
      }, [
        el("span.cons__halo"),
        el("span.cons__core"),
        el("span.cons__photo"),
      ]);

      this.sky.append(node);
      this.stars.push({ node, photo, x, y, linked: false, index: i });
    });

    // ---- Texto ----------------------------------------------------------
    this.proseEl = el("div.prose.cons__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.root.append(
      el("header.cons__head.entra--prende", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("span.cons__count", { text: `0 / ${this.stars.length}` }),
      ]),
      this.sky,
      el("div.vidrio.cons__panel.hueco-barra", {}, [
        el("h2.title.cons__title", { text: ch?.title || "" }),
        el("hr.rule"),
        el("div.lectura.cons__scroll", {}, [this.proseEl]),
      ])
    );

    this.counter = this.root.querySelector(".cons__count");
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.linked = [];
    this.dragFrom = null;

    this.#measure();
    this.track(this.ctx.viewport.on("resize", () => this.#measure()));

    // Las fotos de las estrellas entran de fondo, sin prisa.
    this.ctx.assets.idlePreload(this.photos.map((p) => p.src));

    this.addGestures(
      new Gestures(
        this.sky,
        {
          onDown: (e) => this.#begin(e),
          onPan: (e) => this.#move(e),
          onPanEnd: () => this.#end(),
          onUp: () => this.#end(),
          onTap: (e) => {
            // Tocar también vale: se enlaza con la última encendida, para que
            // el dibujo siga siendo un trazo y no estrellas sueltas.
            const star = this.#starAt(e.x, e.y);
            if (!star || star.linked) return;
            const previous = this.linked[this.linked.length - 1];
            this.#link(star);
            if (previous) this.#drawLine(previous, star);
          },
        },
        { exclusive: true, threshold: 3 }
      )
    );
  }

  #measure() {
    this.rect = this.sky.getBoundingClientRect();
    this.svg.setAttribute("viewBox", `0 0 ${this.rect.width} ${this.rect.height}`);
    this.svg.setAttribute("width", this.rect.width);
    this.svg.setAttribute("height", this.rect.height);
    // Recolocar las líneas ya trazadas al nuevo tamaño.
    this.#redraw();
  }

  #px(star) {
    return { x: star.x * this.rect.width, y: star.y * this.rect.height };
  }

  #starAt(clientX, clientY) {
    const x = clientX - this.rect.left;
    const y = clientY - this.rect.top;
    let best = null;
    let bestDist = SNAP_RADIUS;
    for (const star of this.stars) {
      const p = this.#px(star);
      const d = distance(p.x, p.y, x, y);
      if (d < bestDist) {
        bestDist = d;
        best = star;
      }
    }
    return best;
  }

  #begin(e) {
    const star = this.#starAt(e.x, e.y);
    if (!star) return;
    this.dragFrom = star;
    if (!star.linked) this.#link(star);
    this.liveLine.classList.add("is-active");
  }

  #move(e) {
    if (!this.dragFrom) return;

    const from = this.#px(this.dragFrom);
    const x = e.x - this.rect.left;
    const y = e.y - this.rect.top;

    this.liveLine.setAttribute("x1", from.x);
    this.liveLine.setAttribute("y1", from.y);
    this.liveLine.setAttribute("x2", x);
    this.liveLine.setAttribute("y2", y);

    // Al pasar por encima de otra estrella, se une sola: no hay que soltar
    // en el punto exacto, que con el dedo sería un suplicio.
    const over = this.#starAt(e.x, e.y);
    if (over && over !== this.dragFrom && !over.linked) {
      this.#link(over);
      this.#drawLine(this.dragFrom, over);
      this.dragFrom = over;
    }
  }

  #end() {
    this.dragFrom = null;
    this.liveLine.classList.remove("is-active");
    this.liveLine.setAttribute("x2", this.liveLine.getAttribute("x1") || 0);
    this.liveLine.setAttribute("y2", this.liveLine.getAttribute("y1") || 0);
  }

  #link(star) {
    if (star.linked) return;
    star.linked = true;
    this.linked.push(star);
    star.node.classList.add("is-linked");

    this.ctx.haptics.play("tap");
    this.ctx.audio.play("turn", { volume: 0.18, rate: 1.6 + this.linked.length * 0.05 });
    this.ctx.gl?.pulse(0.25);

    this.counter.textContent = `${this.linked.length} / ${this.stars.length}`;

    // La foto de la estrella aparece justo al encenderla.
    this.ctx.assets.load(star.photo.src, PRIORITY.CRITICAL).then(() => {
      star.node.querySelector(".cons__photo").style.backgroundImage = `url("${star.photo.src}")`;
      star.node.classList.add("has-photo");
    }).catch(() => {});

    if (this.linked.length === this.stars.length) this.#complete();
  }

  #drawLine(a, b) {
    const pa = this.#px(a);
    const pb = this.#px(b);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("class", "cons__line");
    line.setAttribute("x1", pa.x);
    line.setAttribute("y1", pa.y);
    line.setAttribute("x2", pb.x);
    line.setAttribute("y2", pb.y);
    // Se dibuja sola, de una estrella a otra.
    const length = distance(pa.x, pa.y, pb.x, pb.y);
    line.style.strokeDasharray = String(length);
    line.style.strokeDashoffset = String(length);
    this.linesGroup.append(line);
    requestAnimationFrame(() => (line.style.strokeDashoffset = "0"));

    this.edges = this.edges || [];
    this.edges.push([a.index, b.index]);
  }

  /** Recoloca las líneas cuando cambia el tamaño de la pantalla. */
  #redraw() {
    if (!this.edges?.length) return;
    const lines = [...this.linesGroup.children];
    this.edges.forEach(([ai, bi], i) => {
      const line = lines[i];
      if (!line) return;
      const pa = this.#px(this.stars[ai]);
      const pb = this.#px(this.stars[bi]);
      line.setAttribute("x1", pa.x);
      line.setAttribute("y1", pa.y);
      line.setAttribute("x2", pb.x);
      line.setAttribute("y2", pb.y);
      line.style.strokeDasharray = "none";
      line.style.strokeDashoffset = "0";
    });
  }

  #complete() {
    this.root.classList.add("is-complete");
    this.proseEl.classList.add("is-writing");
    this.ctx.haptics.play("heart");
    this.ctx.gl?.flash(0.45);
    this.ctx.gl?.pulse(1);
    this.unlockSecret();
  }
}
