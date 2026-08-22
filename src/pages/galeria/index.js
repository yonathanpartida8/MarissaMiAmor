/**
 * GALLERYPAGE — varias fotos suyas, que se pasan deslizando.
 *
 * Un carrusel con inercia e imantado, con la foto del centro grande y las de
 * al lado retiradas y más oscuras. Cada una entra revelándose (el mismo marco
 * que el resto del libro), se puede pellizcar para acercarla, y el texto vive
 * debajo con un contador discreto.
 *
 * Sólo se carga la foto que se ve y sus dos vecinas: una galería de treinta
 * imágenes no puede pedir treinta descargas al llegar.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createPhotoFrame } from "../../components/PhotoFrame.js";
import { el, splitWords, setVars } from "../../utils/dom.js";
import { clamp, damp } from "../../utils/math.js";

export default class GalleryPage extends BasePage {
  static type = "gallery";

  /** Sólo la primera es crítica; el resto entra según avanza. */
  get criticalAssets() {
    return this.photos.slice(0, 1).map((p) => p.src);
  }

  build() {
    const ch = this.chapter;
    this.root = el("section.page.mine.mine--gallery", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": this.palette.a });

    this.rail = el("div.gal__track", { "data-claim-drag": "" });
    this.slides = this.photos.map((photo, i) => {
      const frame = createPhotoFrame(this.ctx, {
        photo,
        shape: "rect",
        ratio: "3 / 4",
        parallax: 0.75,
        zoomable: true,
      });
      const slide = el("div.gal__slide", { dataset: { index: String(i) } }, [frame.node]);
      this.rail.append(slide);
      return { node: slide, frame, photo, loaded: false };
    });

    this.proseEl = el("div.mine__prose.selectable");
    if (ch?.text) this.proseEl.append(splitWords(ch.text).frag);

    this.counter = el("span.gal__count", { text: "" });
    this.dots = el("div.gal__dots");
    for (let i = 0; i < this.slides.length; i++) {
      this.dots.append(el("i.gal__dot", { dataset: { index: String(i) } }));
    }

    this.root.append(
      el("header.gal__head", {}, [
        ch?.kicker ? el("span.kicker", { text: ch.kicker }) : el("span"),
        this.counter,
      ]),
      el("div.gal__stage", {}, [this.rail]),
      this.dots,
      el("div.mine__panel", {}, [
        el("h2.mine__title", { text: ch?.title || "" }),
        ch?.text ? el("hr.rule") : null,
        ch?.text ? el("div.lectura.mine__scroll", {}, [this.proseEl]) : null,
      ])
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => {
      this.root.classList.add("is-entered");
      this.proseEl.classList.add("is-writing");
    });

    this.offset = 0;
    this.target = 0;
    this.velocity = 0;
    this.dragging = false;
    this.current = -1;

    this.#measure();
    this.track(this.ctx.viewport.on("resize", () => this.#measure()));

    this.addGestures(
      new Gestures(
        this.rail,
        {
          onPanStart: () => {
            this.dragging = true;
            this.start = this.offset;
            this.velocity = 0;
          },
          onPan: (e) => {
            let next = this.start + e.dx;
            const max = 0;
            const min = -(this.slides.length - 1) * this.slideWidth;
            // Resistencia elástica en los extremos, como en iOS.
            if (next > max) next = max + (next - max) * 0.32;
            if (next < min) next = min + (next - min) * 0.32;
            this.offset = next;
          },
          onPanEnd: (e) => {
            this.dragging = false;
            // Un golpe rápido pasa una foto aunque no se haya arrastrado media.
            const flick = Math.abs(e.vx) > 0.4 ? Math.sign(-e.vx) : 0;
            const nearest = Math.round(-this.offset / this.slideWidth) + flick;
            this.#goTo(nearest);
          },
        },
        { axis: "x", exclusive: true, threshold: 9 }
      )
    );

    this.addTicker((dt, time) => this.#frame(dt, time), 11);
    this.#load(0);
  }

  #measure() {
    const stage = this.root.querySelector(".gal__stage");
    const rect = stage?.getBoundingClientRect();
    if (!rect?.width) return;
    this.slideWidth = rect.width;
    for (const slide of this.slides) slide.node.style.width = `${rect.width}px`;
    this.offset = -this.currentIndex() * this.slideWidth;
    this.target = this.offset;
  }

  currentIndex() {
    return Math.max(0, this.current);
  }

  #goTo(index) {
    const clamped = clamp(index, 0, this.slides.length - 1);
    this.target = -clamped * this.slideWidth;
    this.ctx.haptics.play("tick");
  }

  #frame(dt, time) {
    if (!this.slideWidth) return;

    const desde = this.offset;
    if (!this.dragging) {
      this.offset = damp(this.offset, this.target, 11, dt);
    }

    const center = -this.offset / this.slideWidth;

    // Con el carrusel parado no se reescribe nada de la colocación: eran una
    // escritura por diapositiva más la del riel, sesenta veces por segundo,
    // para dejarlo todo exactamente igual que estaba.
    if (!this.pintado || Math.abs(this.offset - desde) > 0.01) {
      this.pintado = true;
      this.rail.style.transform = `translate3d(${this.offset}px, 0, 0)`;

      const index = clamp(Math.round(center), 0, this.slides.length - 1);
      if (index !== this.current) {
        this.current = index;
        this.counter.textContent = `${index + 1} / ${this.slides.length}`;
        for (const dot of this.dots.children) {
          dot.classList.toggle("is-on", Number(dot.dataset.index) === index);
        }
        this.#load(index);
        if (index === this.slides.length - 1 && this.entry.secret) this.unlockSecret();
      }

      // Profundidad: la del centro manda, las de al lado se retiran.
      this.slides.forEach((slide, i) => {
        const near = Math.max(0, 1 - Math.abs(i - center));
        slide.node.style.setProperty("--near", near.toFixed(3));
      });
    }

    // Los marcos sí siguen su ritmo siempre: tienen su propio paralaje y su
    // brillo, que se mueven con la inclinación aunque el carrusel esté quieto.
    // Sólo la visible y sus vecinas gastan tiempo.
    this.slides.forEach((slide, i) => {
      if (Math.abs(i - center) < 1.6) slide.frame.tick(dt, time);
    });
  }

  /** Carga la foto que se ve y sus dos vecinas, y nada más. */
  #load(index) {
    for (let i = index - 1; i <= index + 1; i++) {
      const slide = this.slides[i];
      if (!slide || slide.loaded) continue;
      slide.loaded = true;
      slide.frame.load();
    }
  }

  destroy() {
    for (const slide of this.slides) slide.frame.destroy();
    super.destroy();
  }
}
