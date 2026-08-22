/**
 * FILMSTRIPPAGE — una tira de negativos que se pasa con el dedo.
 *
 * Catorce recuerdos en fila, con sus perforaciones y su grano. El carrete
 * corre con inercia, se frena solo y se imanta al fotograma más cercano;
 * el que queda en el centro se enciende y se lee su pie.
 *
 * El texto del capítulo va al final del carrete: para leerlo entero hay que
 * haber pasado por todos los recuerdos.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, qs, splitWords, setVars } from "../../utils/dom.js";
import { clamp, damp } from "../../utils/math.js";
import { PRIORITY } from "../../core/AssetLoader.js";
import escondidos from "../../data/escondidos.js";

export default class FilmstripPage extends BasePage {
  static type = "filmstrip";

  /** Sólo las tres primeras son críticas; el resto entra según avanza. */
  get criticalAssets() {
    return this.photos.slice(0, 3).map((p) => p.src);
  }

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.film", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent });

    this.reel = el("div.film__reel", { "data-claim-drag": "" });
    this.frames = this.photos.map((photo, i) => {
      const frame = el("figure.film__frame", { dataset: { index: String(i) } }, [
        el("div.film__img", { dataset: { src: photo.src } }),
        el("figcaption.film__no", { text: String(i + 1).padStart(2, "0") }),
      ]);
      this.reel.append(frame);
      return { node: frame, photo, loaded: false };
    });

    // El último "fotograma" es la carta.
    this.proseEl = el("div.prose.film__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);
    this.endCard = el("figure.film__frame.film__frame--end", {}, [
      el("div.film__endinner", {}, [
        el("h2.title.film__endtitle", { text: ch?.title || "" }),
        el("div.lectura.film__endscroll", {}, [this.proseEl]),
      ]),
    ]);
    this.reel.append(this.endCard);

    this.root.append(
      el("header.film__head.entra--corre", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("span.film__counter", { text: "" }),
      ]),
      el("div.film__track", {}, [
        el("div.film__perf.film__perf--top"),
        this.reel,
        el("div.film__perf.film__perf--bottom"),
      ]),
      el("div.film__caption", { text: ch?.title || "" })
    );

    this.counter = qs(".film__counter", this.root);
    this.caption = qs(".film__caption", this.root);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.offset = 0;      // desplazamiento actual en px
    this.targetOffset = 0;
    this.velocity = 0;
    this.dragging = false;
    this.activeFrame = -1;

    this.#measure();
    this.track(this.ctx.viewport.on("resize", () => this.#measure()));

    this.addGestures(
      new Gestures(
        this.reel,
        {
          onPanStart: () => {
            this.dragging = true;
            this.startOffset = this.offset;
            this.velocity = 0;
          },
          onPan: (e) => {
            // Resistencia elástica fuera de los límites.
            let next = this.startOffset + e.dx;
            if (next > 0) next *= 0.34;
            if (next < -this.maxOffset) next = -this.maxOffset + (next + this.maxOffset) * 0.34;
            this.offset = next;

            // Escondido: seguir tirando hacia atrás cuando ya está el primer
            // fotograma. Antes del primero no hay carrete… salvo esto.
            if (this.startOffset + e.dx > 190) {
              this.escondite("carrete-antes", escondidos.carrete, e);
            }
          },
          onPanEnd: (e) => {
            this.dragging = false;
            this.velocity = e.vx * 1000;
          },
          onTap: (e) => {
            const frame = e.target.closest?.(".film__frame");
            if (frame && !frame.classList.contains("film__frame--end")) {
              this.#center(Number(frame.dataset.index));
            }
          },
        },
        { axis: "x", exclusive: true, threshold: 8 }
      )
    );

    this.addTicker((dt) => this.#frame(dt), 11);
    this.#loadNear(0);
  }

  #measure() {
    const first = this.frames[0]?.node;
    if (!first) return;

    this.viewWidth = this.root.querySelector(".film__track").clientWidth;
    const frameW = first.getBoundingClientRect().width;

    // Relleno lateral para que el primer y el último fotograma también puedan
    // quedarse centrados; sin esto, el carrete siempre empieza pegado al borde.
    const pad = Math.max(6, (this.viewWidth - frameW) / 2);
    this.reel.style.paddingLeft = `${pad}px`;
    this.reel.style.paddingRight = `${pad}px`;

    this.frameWidth = frameW + parseFloat(getComputedStyle(this.reel).gap || 0);
    this.maxOffset = Math.max(0, this.reel.scrollWidth - this.viewWidth);
    this.padOffset = pad;

    // Y arranca con el primero en el centro, no a medio salir de cuadro.
    if (!this.centered) {
      this.centered = true;
      this.offset = 0;
      this.targetOffset = 0;
    }
  }

  #center(index) {
    // Con el relleno lateral, centrar el fotograma `i` es simplemente
    // desplazar el carrete `i` anchos de fotograma.
    this.targetOffset = clamp(-index * this.frameWidth, -this.maxOffset, 0);
    this.snapping = true;
    this.velocity = 0;
    this.ctx.haptics.play("tap");
  }

  #frame(dt) {
    if (!this.frameWidth) return;

    const desde = this.offset;

    if (this.dragging) {
      this.snapping = false;
    } else if (this.snapping) {
      this.offset = damp(this.offset, this.targetOffset, 9, dt);
      if (Math.abs(this.offset - this.targetOffset) < 0.4) this.snapping = false;
    } else if (Math.abs(this.velocity) > 6) {
      // Inercia con rozamiento.
      this.offset += this.velocity * dt;
      this.velocity *= Math.exp(-2.9 * dt);

      if (this.offset > 0 || this.offset < -this.maxOffset) {
        this.offset = clamp(this.offset, -this.maxOffset, 0);
        this.velocity *= -0.28;
        this.ctx.haptics.play("tick");
      }
    } else if (Math.abs(this.velocity) > 0) {
      // Se ha parado: imanta al fotograma más cercano.
      this.velocity = 0;
      const nearest = Math.round(-this.offset / this.frameWidth);
      this.#center(clamp(nearest, 0, this.frames.length));
    }

    // Con el carrete parado no hay nada que reescribir, y eso importa: abajo
    // hay una escritura de estilo por fotograma —diez o doce— más la del
    // carrete entero. Hacerlo sesenta veces por segundo con el dedo fuera
    // eran cientos de mutaciones inútiles y una página que costaba lo mismo
    // quieta que en movimiento. Ahora, quieta, no cuesta nada.
    if (this.pintado && Math.abs(this.offset - desde) < 0.01) return;
    this.pintado = true;

    this.reel.style.transform = `translate3d(${this.offset}px, 0, 0)`;

    // Qué fotograma manda ahora mismo.
    const center = -this.offset / this.frameWidth;
    const index = clamp(Math.round(center), 0, this.frames.length);
    if (index !== this.activeFrame) {
      this.activeFrame = index;
      this.#onActiveChange(index);
    }

    // Profundidad: los laterales se alejan y pierden luz.
    this.frames.forEach((frame, i) => {
      const d = Math.abs(i - center);
      const near = Math.max(0, 1 - d * 0.85);
      frame.node.style.setProperty("--near", near.toFixed(3));
    });
  }

  #onActiveChange(index) {
    this.counter.textContent =
      index >= this.frames.length ? "fin" : `${index + 1} / ${this.frames.length}`;
    this.ctx.haptics.play("tick");
    this.#loadNear(index);

    if (index >= this.frames.length) {
      // Ha llegado al final del carrete: ahí está la carta y el secreto.
      this.caption.textContent = "";
      this.proseEl.classList.add("is-writing");
      this.unlockSecret();
    } else {
      this.caption.textContent = this.chapter?.title || "";
    }
  }

  /** Carga perezosa: sólo lo que está cerca del centro del carrete. */
  #loadNear(index) {
    for (let i = index - 2; i <= index + 3; i++) {
      const frame = this.frames[i];
      if (!frame || frame.loaded) continue;
      frame.loaded = true;
      const priority = Math.abs(i - index) <= 1 ? PRIORITY.CRITICAL : PRIORITY.NEXT;
      this.ctx.assets
        .load(frame.photo.src, priority)
        .then(() => {
          const holder = qs(".film__img", frame.node);
          holder.style.backgroundImage = `url("${frame.photo.src}")`;
          holder.classList.add("is-loaded");
        })
        .catch(() => {});
    }
  }
}
