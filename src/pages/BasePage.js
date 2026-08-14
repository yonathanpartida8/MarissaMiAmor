/**
 * BASEPAGE — el contrato de toda página del libro.
 *
 * Cada experiencia (sobre, polaroids, constelación…) hereda de aquí y sólo
 * implementa lo que necesita. La clase se encarga de lo aburrido: limpiar
 * listeners, darse de baja del bucle, soltar gestos y liberar imágenes.
 *
 * Ciclo de vida, en orden:
 *   preload() → build() → [transición de entrada] → enter() → tick()… →
 *   leave() → [transición de salida] → destroy()
 */

import { listenerGroup, el } from "../utils/dom.js";
import { PRIORITY } from "../core/AssetLoader.js";

export class BasePage {
  /** Clave con la que se registra en registry.js */
  static type = "base";

  /**
   * @param {import("../core/Context.js").Context} ctx  servicios del motor
   * @param {import("../data/manifest.js").PageEntry} entry
   * @param {object} [chapter] capítulo resuelto, si lo tiene
   */
  constructor(ctx, entry, chapter = null) {
    this.ctx = ctx;
    this.entry = entry;
    this.chapter = chapter;
    this.photos = entry.photos || [];
    this.id = entry.id;

    this.root = null;
    this.listeners = listenerGroup();
    this.gestures = [];
    this.tickers = [];
    this.unsubs = [];
    this.destroyed = false;
    this.active = false;
  }

  // ---- Metadatos ---------------------------------------------------------

  /** Transición preferida para llegar a esta página. */
  get transition() {
    return this.entry.transition || "flip";
  }

  /** Paleta que esta página impone a la atmósfera WebGL. */
  get palette() {
    return this.chapter?.palette || { a: "#ec6f92", b: "#4c1d95", deep: "#0a0510" };
  }

  get mood() {
    return this.chapter?.mood || "night";
  }

  /** Imágenes imprescindibles antes de mostrarse. */
  get criticalAssets() {
    return this.photos.slice(0, 4).map((p) => p.src);
  }

  /** Imágenes que puede ir cargando mientras ya se ve. */
  get deferredAssets() {
    return this.photos.slice(4).map((p) => p.src);
  }

  // ---- Ciclo de vida -----------------------------------------------------

  /** Carga lo imprescindible. El router espera a esta promesa. */
  async preload() {
    const critical = this.criticalAssets;
    if (critical.length) {
      await this.ctx.assets.loadAll(critical, PRIORITY.CRITICAL).catch(() => {});
    }
  }

  /**
   * Construye el DOM y lo devuelve. No animar aquí: la página aún no se ve.
   * @returns {HTMLElement}
   */
  build() {
    this.root = el("section.page", {
      "data-page": this.id,
      "data-type": this.constructor.type,
      "aria-label": this.chapter?.title || this.id,
    });
    return this.root;
  }

  /**
   * La página ya está en pantalla y la transición ha terminado.
   * Aquí sí: animaciones de entrada, escuchar gestos, arrancar el reloj.
   * @param {"next"|"prev"|"none"} direction
   */
  async enter(direction = "next") {
    this.active = true;
    // Lo que sobraba se carga ahora, sin bloquear nada.
    const deferred = this.deferredAssets;
    if (deferred.length) this.ctx.assets.idlePreload(deferred);
  }

  /**
   * Un frame. Sólo se llama mientras la página está activa: en cuanto
   * empieza a salir, deja de recibir tiempo y libera CPU.
   */
  tick(dt, time) {}

  /** Empieza a irse. Devuelve una promesa si necesita despedirse. */
  async leave(direction = "next") {
    this.active = false;
  }

  /** Se acabó: suelta absolutamente todo. */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.active = false;

    this.listeners.clear();
    for (const g of this.gestures) g.destroy();
    for (const stop of this.tickers) stop();
    for (const off of this.unsubs) off();
    this.gestures.length = 0;
    this.tickers.length = 0;
    this.unsubs.length = 0;

    this.root?.remove();
    this.root = null;
  }

  // ---- Ayudas para las subclases ----------------------------------------

  /** Añade un ticker que se cancela solo al destruir la página. */
  addTicker(fn, order = 10) {
    const stop = this.ctx.loop.add(fn, order);
    this.tickers.push(stop);
    return stop;
  }

  /** Registra un reconocedor de gestos con limpieza automática. */
  addGestures(gestures) {
    this.gestures.push(gestures);
    return gestures;
  }

  /** Escucha un evento con limpieza automática. */
  on(target, type, handler, options) {
    return this.listeners.on(target, type, handler, options);
  }

  /** Guarda una función de baja (de un Emitter) para llamarla al destruir. */
  track(unsubscribe) {
    if (typeof unsubscribe === "function") this.unsubs.push(unsubscribe);
    return unsubscribe;
  }

  /** Marca un secreto como encontrado y celebra si es la primera vez. */
  unlockSecret(id = this.entry.secret) {
    if (!id) return false;
    const isNew = this.ctx.store.unlockSecret(id);
    if (isNew) {
      this.ctx.haptics.play("secret");
      this.ctx.ui?.celebrateSecret?.(id);
    }
    return isNew;
  }

  /** Atajo: sonido + vibración a la vez, que casi siempre van juntos. */
  feedback(sound, haptic, opts) {
    if (sound) this.ctx.audio.play(sound, opts);
    if (haptic) this.ctx.haptics.play(haptic);
  }
}
