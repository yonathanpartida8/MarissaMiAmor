/**
 * ROUTER — quién está en pantalla y cómo se llega a la siguiente.
 *
 * Responsabilidades:
 *  · instanciar páginas del manifiesto bajo demanda (módulos perezosos)
 *  · precocinar la hoja vecina para que el arrastre responda al instante
 *  · elegir y ejecutar la transición correcta
 *  · dejar que el dedo controle el giro de la hoja, con inercia al soltar
 *  · liberar páginas e imágenes que ya no se ven
 */

import { Emitter } from "./Emitter.js";
import { Gestures } from "./Gestures.js";
import { PageFlip } from "../transitions/PageFlip.js";
import { effects } from "../transitions/effects.js";
import { resolvePage, warmup } from "../pages/registry.js";
import { createVerso } from "../components/Verso.js";
import { manifest } from "../data/manifest.js";
import { getChapter } from "../data/chapters.js";
import { el } from "../utils/dom.js";
import { clamp, clamp01 } from "../utils/math.js";

/** Cuántas páginas construidas mantenemos vivas a la vez. */
const LIVE_BUDGET = { low: 2, mid: 3, high: 4 };

export class Router extends Emitter {
  constructor(ctx, stageEl) {
    super();
    this.ctx = ctx;
    this.stage = stageEl;
    this.entries = manifest;
    this.index = -1;
    this.busy = false;
    this.locked = false;

    /** @type {Map<number, {page:object, leaf:HTMLElement}>} */
    this.live = new Map();

    this.flip = new PageFlip(stageEl, ctx.loop, { audio: ctx.audio, haptics: ctx.haptics });
    this.drag = null;

    this.#bindGestures();
    this.#bindKeyboard();
  }

  get current() {
    return this.live.get(this.index)?.page || null;
  }

  get entry() {
    return this.entries[this.index] || null;
  }

  get atStart() {
    return this.index <= 0;
  }

  get atEnd() {
    return this.index >= this.entries.length - 1;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Construcción de páginas
  // ═══════════════════════════════════════════════════════════════════

  async #instantiate(index) {
    if (this.live.has(index)) return this.live.get(index);
    const entry = this.entries[index];
    if (!entry) return null;

    const PageClass = await resolvePage(entry.type);
    const chapter = entry.chapter ? getChapter(entry.chapter) : null;
    const page = new PageClass(this.ctx, entry, chapter);

    await page.preload();
    if (this.live.has(index)) return this.live.get(index); // carrera resuelta

    const leaf = this.#createLeaf(page, index);
    const record = { page, leaf };
    this.live.set(index, record);
    return record;
  }

  #createLeaf(page, index) {
    const leaf = el("div.leaf", { "data-leaf": page.id });
    const front = el("div.leaf__face.leaf__face--front");
    const back = el("div.leaf__face.leaf__face--back");

    back.append(
      createVerso({
        number: index + 1,
        total: this.entries.length,
        accent: page.palette.a,
        title: page.chapter?.title || "",
      })
    );

    front.append(page.build());
    leaf.append(front, back, el("div.leaf__shade"));
    return leaf;
  }

  /**
   * Prepara una hoja vecina fuera de pantalla. Es lo que hace que arrastrar
   * responda en el primer milisegundo en vez de "pensárselo".
   */
  async prepare(index) {
    const entry = this.entries[index];
    if (!entry || this.live.has(index)) return;
    // En gama baja sólo se precocina el papel; lo pesado se construye al llegar.
    if (this.ctx.caps.tierName === "low" && entry.gl) return;

    // Una página vecina que falle al construirse no puede tumbar a la que se
    // está viendo: se registra y se intentará otra vez al llegar a ella.
    const record = await this.#instantiate(index).catch((err) => {
      console.error(`[router] no se pudo precocinar "${entry.id}"`, err);
      return null;
    });
    if (!record) return;
    if (!record.leaf.isConnected) {
      record.leaf.classList.add("leaf--staged");
      this.stage.append(record.leaf);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Navegación
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Va a una página.
   * @param {number} index
   * @param {object} [options]
   * @param {"next"|"prev"|"none"} [options.direction]
   * @param {string} [options.transition] fuerza una transición concreta
   */
  async go(index, { direction, transition } = {}) {
    if (this.busy || this.locked) return false;
    index = clamp(index, 0, this.entries.length - 1);
    if (index === this.index) return false;

    this.busy = true;
    const dir = direction || (index > this.index ? "next" : "prev");
    const outgoing = this.live.get(this.index) || null;
    const entry = this.entries[index];

    this.emit("willchange", { from: this.index, to: index, direction: dir });
    this.ctx.ui?.setBusy(true);

    // La página que se va deja de recibir frames antes de moverse un píxel.
    await outgoing?.page.leave(dir);

    const incoming = await this.#instantiate(index);
    if (!incoming) {
      this.busy = false;
      return false;
    }

    incoming.leaf.classList.remove("leaf--staged");
    if (!incoming.leaf.isConnected) this.stage.append(incoming.leaf);

    // La atmósfera cambia de color *durante* la transición, no después:
    // así el fondo y la página llegan juntos.
    this.ctx.gl?.setMood(incoming.page.palette, incoming.page.mood);

    const name = transition || entry.transition || "flip";
    // Modo ahorro: durante la transición todo está desenfocado o en marcha,
    // así que el lienzo WebGL puede rendir a menos resolución sin que se note.
    // Es justo el instante en que el móvil va más justo.
    this.ctx.gl?.setEconomy(true);
    try {
      await this.#transition(name, outgoing?.leaf, incoming.leaf, dir);
    } finally {
      this.ctx.gl?.setEconomy(false);
    }

    // Estado nuevo
    const prevIndex = this.index;
    this.index = index;
    this.ctx.store.setPage(index, entry.id);

    if (outgoing) outgoing.leaf.classList.add("leaf--hidden");
    incoming.leaf.classList.remove("leaf--hidden");

    await incoming.page.enter(dir);
    this.busy = false;
    this.ctx.ui?.setBusy(false);

    this.emit("change", {
      index,
      previous: prevIndex,
      entry,
      page: incoming.page,
      direction: dir,
    });

    this.#housekeeping();
    return true;
  }

  next() {
    return this.atEnd ? Promise.resolve(false) : this.go(this.index + 1, { direction: "next" });
  }

  prev() {
    return this.atStart ? Promise.resolve(false) : this.go(this.index - 1, { direction: "prev" });
  }

  async #transition(name, outLeaf, inLeaf, direction) {
    const payload = { outgoing: outLeaf, incoming: inLeaf, direction, ctx: this.ctx };

    if (name === "flip" && outLeaf) {
      this.flip.begin(outLeaf, inLeaf, direction);
      await this.flip.run(this.ctx.caps.reducedMotion ? 200 : 880);
      // Ocultar ANTES de limpiar los transforms: si se hace al revés, la hoja
      // que acaba de irse reaparece un frame en su sitio original y parpadea.
      outLeaf.classList.add("leaf--hidden");
      this.flip.end();
      inLeaf.classList.remove("leaf--hidden", "leaf--staged");
      return;
    }

    const effect = effects[name] || effects.dissolve;
    await effect(payload);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Arrastre: el dedo mueve la hoja
  // ═══════════════════════════════════════════════════════════════════

  #bindGestures() {
    this.gestures = new Gestures(
      this.stage,
      {
        onPanStart: (e) => this.#dragStart(e),
        onPan: (e) => this.#dragMove(e),
        onPanEnd: (e) => this.#dragEnd(e),
      },
      { axis: "x", threshold: 12 }
    );
  }

  #dragStart(e) {
    if (this.busy || this.locked || this.drag) return;
    // Las páginas con contenido arrastrable propio (polaroids, tira de cine)
    // ponen esta marca y el libro no les quita el dedo.
    if (e.target?.closest?.("[data-claim-drag]")) return;

    const dir = e.dx < 0 ? "next" : "prev";
    const target = dir === "next" ? this.index + 1 : this.index - 1;
    if (target < 0 || target >= this.entries.length) return;

    const targetEntry = this.entries[target];
    const record = this.live.get(target);

    // Sólo el papel se arrastra. Las páginas WebGL usan su transición propia.
    const draggable =
      (targetEntry.transition || "flip") === "flip" &&
      record &&
      !this.ctx.caps.reducedMotion;

    if (!draggable) {
      this.drag = { mode: "swipe", dir, target };
      return;
    }

    const outLeaf = this.live.get(this.index)?.leaf;
    if (!outLeaf) return;

    record.leaf.classList.remove("leaf--staged", "leaf--hidden");
    this.flip.begin(outLeaf, record.leaf, dir);
    this.drag = { mode: "flip", dir, target, width: this.stage.clientWidth || 1 };
    this.stage.classList.add("is-dragging");
    // Mientras el dedo lleva la hoja, la prioridad absoluta es que responda.
    this.ctx.gl?.setEconomy(true);
  }

  #dragMove(e) {
    if (!this.drag || this.drag.mode !== "flip") return;
    const ratio = clamp01(Math.abs(e.dx) / (this.drag.width * 0.62));
    // Resistencia al final del recorrido: el papel no es infinito.
    const eased = ratio > 0.85 ? 0.85 + (ratio - 0.85) * 0.4 : ratio;
    this.flip.setProgress(this.drag.dir === "next" ? eased : 1 - eased);
  }

  async #dragEnd(e) {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;

    // El gesto se ha abandonado, no terminado: otro se ha quedado el dedo.
    // Se recoge lo que hubiera empezado, pero no se pasa de página.
    if (e.cancelled) {
      if (drag.mode === "flip") {
        this.stage.classList.remove("is-dragging");
        this.busy = true;
        await this.flip.settle(drag.dir === "next" ? 0 : 1, 0);
        this.flip.end();
        const record = this.live.get(drag.target);
        if (record && drag.target !== this.index) record.leaf.classList.add("leaf--staged");
        this.busy = false;
        this.ctx.gl?.setEconomy(false);
      }
      return;
    }

    if (drag.mode === "swipe") {
      const far = Math.abs(e.dx) > this.stage.clientWidth * 0.22;
      const fast = Math.abs(e.vx) > 0.45;
      if (far || fast) this.go(drag.target, { direction: drag.dir });
      return;
    }

    this.stage.classList.remove("is-dragging");
    const progress = this.flip.progress;
    const forward = drag.dir === "next";

    // ¿Pasa o vuelve? Deciden la distancia recorrida y la velocidad del dedo.
    const travelled = forward ? progress : 1 - progress;
    const flicked = Math.abs(e.vx) > 0.5 && (forward ? e.vx < 0 : e.vx > 0);
    const commit = travelled > 0.42 || flicked;

    const target = forward ? (commit ? 1 : 0) : commit ? 0 : 1;
    // La velocidad del dedo (px/ms) se traduce a velocidad de progreso.
    const velocity = (-e.vx / (this.stage.clientWidth * 0.62)) * 1000 * (forward ? 1 : -1);

    this.busy = true;
    await this.flip.settle(target, clamp(velocity, -6, 6));

    if (commit) {
      const outgoing = this.live.get(this.index);
      const incoming = this.live.get(drag.target);

      // Misma precaución que en `#transition`: ocultar y después limpiar.
      outgoing?.leaf.classList.add("leaf--hidden");
      this.flip.end();
      incoming?.leaf.classList.remove("leaf--hidden");

      await outgoing?.page.leave(drag.dir);

      const prevIndex = this.index;
      this.index = drag.target;
      this.ctx.store.setPage(this.index, this.entries[this.index]?.id);
      this.ctx.gl?.setMood(incoming.page.palette, incoming.page.mood);
      this.ctx.haptics.play("turn");

      await incoming.page.enter(drag.dir);
      this.emit("change", {
        index: this.index,
        previous: prevIndex,
        entry: this.entries[this.index],
        page: incoming.page,
        direction: drag.dir,
      });
      this.#housekeeping();
    } else {
      this.flip.end();
      const record = this.live.get(drag.target);
      if (record && drag.target !== this.index) record.leaf.classList.add("leaf--staged");
      this.ctx.haptics.play("tick");
    }

    this.busy = false;
    this.ctx.ui?.setBusy(false);
    this.ctx.gl?.setEconomy(false);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Teclado (escritorio)
  // ═══════════════════════════════════════════════════════════════════

  #bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (this.locked) return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          this.next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          this.prev();
          break;
        case "Home":
          this.go(0);
          break;
        case "End":
          this.go(this.entries.length - 1);
          break;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Limpieza y precarga
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Precocina vecinos, destruye lo lejano y suelta las fotos que ya no se
   * usan. Sin esto, iOS mata la pestaña alrededor de la página 12.
   */
  #housekeeping() {
    // Adelanta el módulo de las dos páginas siguientes.
    for (const offset of [1, 2]) {
      const entry = this.entries[this.index + offset];
      if (entry) warmup(entry.type);
    }

    // Construye vecinos para que el arrastre sea instantáneo.
    this.prepare(this.index + 1);
    if (this.ctx.caps.tierName !== "low") this.prepare(this.index - 1);

    // Destruye lo que quede fuera del presupuesto.
    const budget = LIVE_BUDGET[this.ctx.caps.tierName] || 3;
    const keep = new Set([this.index, this.index + 1, this.index - 1]);
    if (budget > 3) keep.add(this.index + 2);

    for (const [index, record] of [...this.live]) {
      if (keep.has(index)) continue;
      record.page.destroy();
      record.leaf.remove();
      this.live.delete(index);
    }

    // Y suelta las imágenes que ya nadie mira.
    const stillNeeded = [];
    for (const index of keep) {
      const entry = this.entries[index];
      if (entry?.photos) stillNeeded.push(...entry.photos.map((p) => p.src));
    }
    if (this.ctx.assets.cachedCount > 40) this.ctx.assets.keepOnly(stillNeeded);
  }

  /** Bloquea la navegación (una página puede exigir atención un momento). */
  lock() {
    this.locked = true;
    this.gestures.setEnabled(false);
  }

  unlock() {
    this.locked = false;
    this.gestures.setEnabled(true);
  }

  destroy() {
    this.gestures.destroy();
    for (const record of this.live.values()) {
      record.page.destroy();
      record.leaf.remove();
    }
    this.live.clear();
  }
}
