/**
 * POLAROIDSPAGE — un puñado de recuerdos tirados sobre la mesa.
 *
 * Se arrastran con el dedo y siguen moviéndose al soltarlas, con rozamiento
 * y rebote contra los bordes. Al tocarlas dos veces se dan la vuelta y
 * enseñan lo que hay escrito detrás.
 *
 * El secreto de esta página no se anuncia: se abre cuando las ha movido
 * todas, aunque sea un poco. Quien juega con ellas lo encuentra sin querer.
 */

import { BasePage } from "./BasePage.js";
import { Gestures } from "../core/Gestures.js";
import { el, qs, splitWords, setVars } from "../utils/dom.js";
import { seeded } from "../utils/rng.js";
import { clamp } from "../utils/math.js";

/** Lo que hay escrito por detrás. Corto, como se escribe en una foto. */
const BACK_NOTES = [
  "aquí me acordé de ti",
  "esta me gusta mucho",
  "quiero un día así contigo",
  "mírame cómo te miro",
  "guardé esta para el final",
  "te amo, así de simple",
  "esto somos nosotros",
  "para cuando estés triste",
  "no la borres nunca",
  "mi favorita 🤍",
];

const FRICTION = 2.6;   // amortiguación al soltar
const BOUNCE = 0.42;    // energía que conserva al chocar

export default class PolaroidsPage extends BasePage {
  static type = "polaroids";

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;
    const rng = seeded(this.id);

    this.root = el("section.page.paper.polaroids", {
      "data-page": this.id,
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent, "--drop-color": accent, "--accent-line": accent });

    this.field = el("div.pola__field");
    this.cards = [];

    this.photos.forEach((photo, i) => {
      const note = BACK_NOTES[i % BACK_NOTES.length];
      const card = el("figure.pola", { "data-claim-drag": "", tabindex: "0" }, [
        el("div.pola__inner", {}, [
          el("div.pola__face.pola__face--front", {}, [
            el("div.pola__img", { dataset: { src: photo.src } }),
            el("figcaption.pola__caption", { text: `· ${String(i + 1).padStart(2, "0")} ·` }),
          ]),
          el("div.pola__face.pola__face--back", {}, [
            el("div.pola__note", { text: note }),
            el("div.pola__stamp", { text: "❦" }),
          ]),
        ]),
      ]);

      // Reparto sembrado: siempre caen igual, pero parece azar.
      const state = {
        node: card,
        x: rng.range(-0.34, 0.34),
        y: rng.range(-0.3, 0.3),
        vx: 0,
        vy: 0,
        rot: rng.range(-13, 13),
        vrot: 0,
        z: i,
        moved: false,
        flipped: false,
      };
      card.style.setProperty("--i", String(i));
      this.cards.push(state);
      this.field.append(card);
    });

    this.proseEl = el("div.prose.pola__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.root.append(
      el("header.pola__head", {}, [
        el("span.kicker", { text: ch?.kicker || "" }),
        el("h2.title.pola__title", { text: ch?.title || "" }),
      ]),
      this.field,
      el("div.pola__panel", {}, [el("div.pola__scroll", {}, [this.proseEl])])
    );

    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));
    this.proseEl.classList.add("is-writing");

    // Las imágenes entran una a una, no todas de golpe: así ninguna
    // decodificación bloquea el hilo mientras la página está animándose.
    this.photos.forEach(async (photo, i) => {
      await this.ctx.assets.load(photo.src).catch(() => null);
      const holder = qs(`.pola__img[data-src="${photo.src}"]`, this.root);
      if (!holder) return;
      holder.style.backgroundImage = `url("${photo.src}")`;
      this.later(() => holder.classList.add("is-loaded"), i * 70);
    });

    this.#measure();
    this.track(this.ctx.viewport.on("resize", () => this.#measure()));

    for (const card of this.cards) this.#bind(card);
    this.#place();

    this.addTicker((dt) => this.#physics(dt), 11);
  }

  #measure() {
    const rect = this.field.getBoundingClientRect();
    this.bounds = rect;

    // Los límites se calculan a partir del tamaño real de la foto para que
    // ninguna pueda salirse más de un tercio fuera de la mesa.
    const card = this.cards[0]?.node;
    const cardW = card?.offsetWidth || 120;
    const cardH = card?.offsetHeight || 150;
    this.limitX = Math.max(0.1, (rect.width - cardW * 0.7) / 2 / Math.max(1, rect.width));
    this.limitY = Math.max(0.1, (rect.height - cardH * 0.7) / 2 / Math.max(1, rect.height));

    this.#place();
  }

  #bind(card) {
    let dragging = false;
    let startX = 0;
    let startY = 0;

    this.addGestures(
      new Gestures(
        card.node,
        {
          onDown: () => {
            this.#raise(card);
            card.vx = card.vy = card.vrot = 0;
          },
          onPanStart: (e) => {
            dragging = true;
            startX = card.x;
            startY = card.y;
            card.node.classList.add("is-dragging");
            this.ctx.haptics.play("tick");
          },
          onPan: (e) => {
            if (!dragging || !this.bounds.width) return;
            card.x = clamp(startX + e.dx / this.bounds.width, -this.limitX, this.limitX);
            card.y = clamp(startY + e.dy / this.bounds.height, -this.limitY, this.limitY);
            // La inclinación acompaña al gesto: se siente el peso del papel.
            card.vrot = e.vx * 26;
            this.#apply(card);
            this.#markMoved(card);
          },
          onPanEnd: (e) => {
            dragging = false;
            card.node.classList.remove("is-dragging");
            // La velocidad del dedo pasa a ser la de la foto.
            card.vx = (e.vx * 1000) / (this.bounds.width || 1);
            card.vy = (e.vy * 1000) / (this.bounds.height || 1);
            card.vrot = e.vx * 40;
            this.ctx.haptics.play("tap");
          },
          onDoubleTap: () => this.#flip(card),
        },
        { exclusive: true, threshold: 5 }
      )
    );
  }

  #raise(card) {
    // La que se toca sube a lo más alto de la pila.
    const top = Math.max(...this.cards.map((c) => c.z));
    if (card.z === top) return;
    card.z = top + 1;
    card.node.style.zIndex = String(card.z);
  }

  #flip(card) {
    card.flipped = !card.flipped;
    card.node.classList.toggle("is-flipped", card.flipped);
    card.vrot = (Math.random() - 0.5) * 90;
    this.ctx.haptics.play("reveal");
    this.ctx.audio.play("turn", { volume: 0.3, rate: 1.5 });
    this.#markMoved(card);
  }

  #markMoved(card) {
    if (card.moved) return;
    card.moved = true;
    if (this.cards.every((c) => c.moved)) {
      this.unlockSecret();
    }
  }

  #place() {
    for (const card of this.cards) {
      card.node.style.zIndex = String(card.z);
      this.#apply(card);
    }
  }

  #apply(card) {
    // En píxeles, no en porcentaje: un `translate` porcentual se mide sobre el
    // propio tamaño de la foto, no sobre la mesa, y todas acababan amontonadas
    // en el centro por muy repartidas que estuvieran sus coordenadas.
    const w = this.bounds?.width || 0;
    const h = this.bounds?.height || 0;
    card.node.style.transform =
      `translate3d(${card.x * w}px, ${card.y * h}px, 0) rotate(${card.rot}deg)`;
  }

  /** Inercia, rozamiento y rebote contra los bordes de la mesa. */
  #physics(dt) {
    for (const card of this.cards) {
      if (Math.abs(card.vx) < 0.0004 && Math.abs(card.vy) < 0.0004 && Math.abs(card.vrot) < 0.05) {
        continue; // en reposo: ni se toca
      }

      card.x += card.vx * dt;
      card.y += card.vy * dt;
      card.rot += card.vrot * dt;

      // Rebote suave: la foto choca con el borde y pierde energía.
      if (card.x < -this.limitX || card.x > this.limitX) {
        card.x = clamp(card.x, -this.limitX, this.limitX);
        card.vx *= -BOUNCE;
        card.vrot += card.vx * 20;
      }
      if (card.y < -this.limitY || card.y > this.limitY) {
        card.y = clamp(card.y, -this.limitY, this.limitY);
        card.vy *= -BOUNCE;
      }

      const decay = Math.exp(-FRICTION * dt);
      card.vx *= decay;
      card.vy *= decay;
      card.vrot *= Math.exp(-3.4 * dt);

      this.#apply(card);
    }
  }
}
