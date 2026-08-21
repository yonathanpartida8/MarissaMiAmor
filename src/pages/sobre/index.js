/**
 * ENVELOPEPAGE — la primera carta.
 *
 * No se abre tocando. Hay que arrastrar el lacre hasta que cede, igual que
 * romperías el sello de una carta de verdad; entonces la solapa se abre, el
 * papel sale del sobre y se desdobla delante de ti.
 *
 * Toda la coreografía está por tiempos: sello → solapa → salida → desdoblado
 * → escritura. Cada paso espera al anterior, con su sonido y su vibración.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { el, splitWords, setVars, wait } from "../../utils/dom.js";
import { clamp01 } from "../../utils/math.js";

const BREAK_DISTANCE = 74;

export default class EnvelopePage extends BasePage {
  static type = "envelope";

  build() {
    const ch = this.chapter;
    const accent = this.palette.a;

    this.root = el("section.page.envelope", {
      "data-page": this.id,
      "data-gl": "true",
      "aria-label": ch?.title,
    });
    setVars(this.root, { "--accent": accent, "--accent-deep": this.palette.b });

    // ---- La carta que hay dentro ---------------------------------------
    this.proseEl = el("div.prose.letter__prose.selectable");
    const { frag } = splitWords(ch?.text || "");
    this.proseEl.append(frag);

    this.sheet = el("article.letter__sheet.paper.paper--aged", {}, [
      el("div.letter__crease.letter__crease--a"),
      el("div.letter__crease.letter__crease--b"),
      el("div.letter__scroll", {}, [
        el("span.kicker.letter__kicker", { text: ch?.kicker || "" }),
        el("h2.title.letter__title", { text: ch?.title || "" }),
        el("hr.rule.letter__rule"),
        this.proseEl,
        el("div.letter__sign.signature", { text: "para ti, Marissa" }),
      ]),
    ]);

    // ---- El sobre --------------------------------------------------------
    this.letter = el("div.env__letter", {}, [this.sheet]);
    this.flap = el("div.env__flap");
    this.seal = el("button.env__seal", {
      type: "button",
      "data-claim-drag": "",
      "aria-label": "Arrastra el sello para abrir la carta",
      html: `<span class="env__wax"><span class="env__waxletter">M</span></span>`,
    });

    this.envelope = el("div.env__body", {}, [
      el("div.env__back"),
      this.letter,
      el("div.env__front", {}, [el("div.env__addressee", { text: "Marissa" })]),
      this.flap,
      this.seal,
    ]);

    this.prompt = el("p.env__prompt", { text: "arrastra el sello hacia abajo" });

    this.root.append(el("div.env__stage", {}, [this.envelope]), this.prompt);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.opened = false;
    this.pull = 0;

    this.addGestures(
      new Gestures(
        this.seal,
        {
          onPan: (e) => {
            if (this.opened) return;
            // Sólo cuenta tirar hacia abajo o hacia los lados, no hacia arriba.
            const dist = Math.max(0, e.dy) + Math.abs(e.dx) * 0.5;
            this.pull = clamp01(dist / BREAK_DISTANCE);
            setVars(this.root, { "--pull": String(this.pull) });
            // El sello sigue al dedo, pero con resistencia creciente.
            // El translateZ se conserva: sin él, el lacre cae al fondo del
            // apilado 3D en cuanto el JS le escribe un transform propio.
            this.seal.style.transform =
              `translateZ(20px) translate(${e.dx * 0.35}px, ${Math.max(0, e.dy) * 0.42}px) rotate(${e.dx * 0.14}deg)`;
            if (Math.random() < 0.25) this.ctx.haptics.scrub(this.pull);
            if (this.pull >= 1) this.#open();
          },
          onPanEnd: () => {
            if (this.opened) return;
            // No llegó: el sello vuelve a su sitio con un rebote.
            this.pull = 0;
            setVars(this.root, { "--pull": "0" });
            this.seal.style.transition = "transform 520ms var(--e-spring)";
            this.seal.style.transform = "";
            this.later(() => (this.seal.style.transition = ""), 540);
            this.ctx.haptics.play("tick");
          },
          onTap: () => {
            if (this.opened) return;
            // Si sólo lo toca, se lo recordamos con un temblor.
            this.seal.classList.remove("is-nudge");
            void this.seal.offsetWidth;
            this.seal.classList.add("is-nudge");
            this.ctx.haptics.play("error");
            this.ctx.ui?.showHint("arrástralo, no lo toques");
          },
        },
        { exclusive: true, threshold: 4 }
      )
    );
  }

  /** La coreografía de apertura. */
  async #open() {
    if (this.opened) return;
    this.opened = true;

    this.ctx.haptics.play("open");
    this.ctx.audio.play("open", { volume: 0.85 });
    this.ctx.audio.duck(0.4, 6000);
    this.ctx.gl?.pulse(0.9);
    this.unlockSecret();

    // 1 · el lacre se parte
    this.seal.classList.add("is-broken");
    this.prompt.textContent = "";
    await wait(420);

    // 2 · la solapa se abre
    this.root.classList.add("is-unsealed");
    this.ctx.audio.play("turn", { volume: 0.5, rate: 0.8 });
    await wait(620);

    // 3 · la carta sale del sobre
    this.root.classList.add("is-pulling");
    this.ctx.haptics.play("reveal");
    await wait(760);

    // 4 · se desdobla y ocupa la página
    //
    // La carta tiene que salir del sobre también en el DOM. Mientras sea hija
    // de `.env__body` hereda su desvanecido (el sobre se va, y se la llevaba
    // por delante) y cualquier `position: fixed` suyo se resuelve contra ese
    // ancestro transformado, no contra la pantalla.
    //
    // Para que el cambio de padre no se note, se mide antes dónde está en
    // pantalla, se la deja clavada ahí en su nuevo sitio, y sólo en el
    // siguiente frame se lanza la transición a página completa (FLIP).
    // Técnica FLIP, y con `transform` a propósito: animar top/left/width/height
    // obliga al navegador a rehacer el layout en cada frame y se atraganta.
    // Un solo transform compuesto en GPU va fino hasta en un móvil modesto.
    const from = this.letter.getBoundingClientRect();

    this.root.append(this.letter);
    this.root.classList.add("is-unfolded");
    const to = this.letter.getBoundingClientRect(); // ya en su sitio final

    const sx = from.width / Math.max(1, to.width);
    const sy = from.height / Math.max(1, to.height);
    this.letter.style.transformOrigin = "top left";
    this.letter.style.transition = "none";
    this.letter.style.transform =
      `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`;

    await new Promise(requestAnimationFrame);
    this.letter.style.transition = "transform 700ms var(--e-out)";
    this.letter.style.transform = "none";

    this.ctx.gl?.flash(0.3);
    await wait(720);
    this.letter.style.transition = "";
    this.letter.style.transformOrigin = "";

    // 5 · y sólo entonces aparecen las palabras
    this.proseEl.classList.add("is-writing");
    this.root.classList.add("is-reading");
  }
}
