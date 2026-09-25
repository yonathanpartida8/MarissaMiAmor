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
import { el, qs, splitWords, setVars } from "../../utils/dom.js";
import { clamp } from "../../utils/math.js";
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
    this.reel.setAttribute("tabindex", "0");
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
        el("button.film__nav.film__nav--prev", {
          type: "button",
          "aria-label": "Foto anterior",
          html: "‹",
          onClick: () => this.#paso(-1),
        }),
        el("button.film__nav.film__nav--next", {
          type: "button",
          "aria-label": "Foto siguiente",
          html: "›",
          onClick: () => this.#paso(1),
        }),
      ]),
      el("div.film__caption.hueco-barra", { text: ch?.title || "" }),
      // La foto en grande: se abre tocando la del centro y se cierra tocando.
      (this.lupa = el("div.film__lupa", {
        "data-claim-drag": "",
        role: "button",
        "aria-label": "Cerrar la foto",
        onClick: () => this.root.classList.remove("is-lupa"),
      }))
    );

    this.counter = qs(".film__counter", this.root);
    this.caption = qs(".film__caption", this.root);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    // EL CARRETE AHORA ES EL DESPLAZAMIENTO NATIVO DEL NAVEGADOR, con imán en
    // cada foto. Antes era una física hecha a mano: un deslizamiento rápido
    // saltaba dos fotos y uno lento a veces no avanzaba. Así se comporta
    // igual que cualquier carrusel del móvil: una foto por gesto, suave en
    // Chrome y en Safari, y con la inercia del propio teléfono.
    this.activeFrame = -1;
    this.#measure();
    this.track(this.ctx.viewport.on("resize", () => this.#measure()));

    let pendiente = false;
    this.on(this.reel, "scroll", () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        this.#pintar();
      });
    }, { passive: true });

    this.on(this.reel, "click", (e) => {
      const frame = e.target.closest?.(".film__frame");
      if (!frame || frame.classList.contains("film__frame--end")) return;
      const i = Number(frame.dataset.index);
      if (i === this.activeFrame) this.#abrirLupa(i);
      else this.#center(i);
    });

    // Escondido: insistir con la flecha de atrás cuando ya está la primera.
    this.intentosAtras = 0;

    this.#pintar();
    this.#loadNear(Math.max(0, this.activeFrame));
  }

  get #nodos() {
    return [...this.frames.map((f) => f.node), this.endCard];
  }

  #measure() {
    const first = this.frames[0]?.node;
    if (!first) return;
    const ancho = this.reel.clientWidth;
    const frameW = first.getBoundingClientRect().width;
    // Relleno a los lados para que la primera y la última también se puedan
    // quedar en el centro.
    const pad = Math.max(6, (ancho - frameW) / 2);
    this.reel.style.paddingLeft = `${pad}px`;
    this.reel.style.paddingRight = `${pad}px`;
    this.#pintar();
  }

  /** Lo que se ve según dónde está el carrete: foto activa y profundidad. */
  #pintar() {
    const centro = this.reel.scrollLeft + this.reel.clientWidth / 2;
    let mejor = 0;
    let menor = Infinity;
    this.#nodos.forEach((node, i) => {
      const c = node.offsetLeft + node.offsetWidth / 2;
      const d = Math.abs(c - centro);
      if (d < menor) { menor = d; mejor = i; }
      const near = Math.max(0, 1 - d / (node.offsetWidth * 1.15));
      node.style.setProperty("--near", near.toFixed(3));
    });
    if (mejor !== this.activeFrame) {
      this.activeFrame = mejor;
      this.#onActiveChange(mejor);
    }
  }

  /** Una foto hacia un lado, con las flechas del propio carrete. */
  #paso(d) {
    if (d < 0 && this.activeFrame <= 0 && ++this.intentosAtras >= 3) {
      this.escondite("carrete-antes", escondidos.carrete);
    }
    const desde = this.activeFrame < 0 ? 0 : this.activeFrame;
    this.#center(clamp(desde + d, 0, this.frames.length));
  }

  #abrirLupa(i) {
    const src = this.frames[i]?.photo.src;
    if (!src) return;
    this.lupa.style.backgroundImage = `url("${src}")`;
    this.root.classList.add("is-lupa");
    this.ctx.haptics.play("tap");
  }

  #center(index) {
    const node = this.#nodos[index];
    if (!node) return;
    const left = node.offsetLeft + node.offsetWidth / 2 - this.reel.clientWidth / 2;
    this.reel.scrollTo({ left, behavior: this.ctx.caps.reducedMotion ? "auto" : "smooth" });
    this.ctx.haptics.play("tap");
  }

  #onActiveChange(index) {
    this.root.classList.toggle("en-principio", index <= 0);
    this.root.classList.toggle("en-final", index >= this.frames.length);
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
