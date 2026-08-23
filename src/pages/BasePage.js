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
import { vigilarLectura } from "../utils/lectura.js";
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
    this.timers = new Set();
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
    // UNA VISITA EMPIEZA LIMPIA.
    //
    // El router mantiene vivas las páginas vecinas, así que volver a una ya
    // visitada NO la construye de nuevo: llama otra vez a `enter()` sobre la
    // misma instancia. Y como cada página engancha ahí sus gestos, su reloj y
    // sus escuchas, todo eso se DUPLICABA en cada visita: a la tercera vuelta
    // el candado tenía nueve reconocedores de gestos y tres relojes.
    //
    // Lo que provocaba no era sutil. Cada gesto se atendía tantas veces como
    // visitas llevara la página —girar un rodillo del candado saltaba un
    // valor de más, y acertar la fecha se volvía cuestión de suerte—, y cada
    // reloj cobraba su frame entero, así que la misma página iba peor cuanto
    // más se pasaba por ella.
    //
    // Con esto, lo que quedó de la visita anterior se suelta antes de que la
    // nueva enganche nada. Ninguna página tiene que acordarse de hacerlo.
    this.#soltarVisita();

    this.active = true;
    // Lo que sobraba se carga ahora, sin bloquear nada.
    const deferred = this.deferredAssets;
    if (deferred.length) this.ctx.assets.idlePreload(deferred);
    // Si el texto de esta página no cabe, que se note que sigue.
    this.track(vigilarLectura(this.root));
  }

  /**
   * Suelta todo lo que se enganchó durante una visita.
   *
   * Ninguna página engancha nada en `build()` —lo suyo va siempre en
   * `enter()`—, así que aquí no se pierde nada que haga falta después.
   */
  #soltarVisita() {
    this.listeners.clear();
    for (const g of this.gestures) g.destroy();
    for (const stop of this.tickers) stop();
    for (const off of this.unsubs) off();
    for (const id of this.timers) clearTimeout(id);
    this.gestures.length = 0;
    this.tickers.length = 0;
    this.unsubs.length = 0;
    this.timers.clear();
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

    this.#soltarVisita();

    this.root?.remove();
    this.root = null;
  }

  // ---- Ayudas para las subclases ----------------------------------------

  /**
   * Añade un ticker que se cancela solo al destruir la página.
   *
   * El guardia de `active` está aquí a propósito y no en cada página: el
   * router mantiene vivas las hojas vecinas para que arrastrar responda al
   * instante, así que puede haber tres o cuatro páginas construidas a la vez.
   * Sin esto, todas seguirían pidiendo frames —físicas, partículas, escenas
   * 3D— para nadie. Con esto, sólo gasta CPU la que se está viendo.
   */
  addTicker(fn, order = 10) {
    const guarded = (dt, time, realDt) => {
      if (!this.active || this.destroyed) return;
      fn(dt, time, realDt);
    };
    const stop = this.ctx.loop.add(guarded, order);
    this.tickers.push(stop);
    return stop;
  }

  /**
   * `setTimeout` que se cancela solo al destruir la página.
   *
   * Un `setTimeout` suelto sobrevive a la página que lo pidió. Si ella pasa
   * hoja rápido, el temporizador se despierta en una página que ya no existe:
   * unas veces sólo toca un nodo suelto, pero otras desbloquea un secreto que
   * no ha descubierto, fuerza un cambio de página o escribe sobre `this.root`
   * cuando ya vale null. Con esto no hay que acordarse: mueren con la página.
   */
  later(fn, ms = 0) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      if (this.destroyed) return;
      fn();
    }, ms);
    this.timers.add(id);
    return id;
  }

  /**
   * Retira un objeto de la escena 3D DESVANECIÉNDOLO, no de un tijeretazo.
   *
   * Las páginas WebGL son transparentes: lo que se ve no está en el DOM, está
   * en el lienzo que hay detrás de todo. Al quitar el objeto en `leave()`, la
   * ilustración desaparecía de un fotograma para otro —antes incluso de que
   * la transición empezara— y la hoja se iba ya vacía. Ese era el parpadeo
   * que tenían TODAS las páginas de WebGL al pasar de página.
   *
   * No usa `addTicker` a propósito: ese reloj sólo corre mientras la página
   * está activa, y aquí la página ya se está yendo.
   *
   * @param {() => void} unmount  la función que devolvió `gl.mount()`
   * @param {(k: number) => void} apply  recibe 1 → 0
   * @param {number} [ms]
   */
  fadeOutGL(unmount, apply, ms = 420) {
    if (!unmount) return;
    if (this.ctx.caps.reducedMotion) return unmount();

    let done = false;
    let elapsed = 0;

    const finish = () => {
      if (done) return;
      done = true;
      stop();
      unmount();
    };

    const stop = this.ctx.loop.add((dt, time, realDt) => {
      elapsed += (realDt ?? dt) * 1000;
      const k = 1 - Math.min(1, elapsed / ms);
      apply(k * k); // se apaga rápido al principio, como una brasa
      if (k <= 0) finish();
    }, 14);

    // Si la página muere antes de terminar el desvanecido, se remata igual:
    // lo que no puede quedarse es un objeto huérfano en la escena.
    this.tickers.push(stop);
    this.unsubs.push(finish);
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

  // ---- Lo que hay escondido ----------------------------------------------

  /**
   * Suelta un corazón que sube desde un punto de la página.
   *
   * Estaba escrito tres veces, casi igual, en tres páginas distintas. Aquí
   * arriba lo tienen todas, y la capa donde caen se crea sola la primera vez
   * que hace falta: una página que no esconda nada no paga ni un nodo.
   *
   * @param {number} x  en coordenadas de ventana (las que traen los gestos)
   * @param {number} y
   * @param {string} [frase]  lo que dice el corazón mientras sube
   */
  corazon(x, y, frase = "") {
    if (this.ctx.caps.reducedMotion || this.destroyed || !this.root) return;

    if (!this.capaSecretos) {
      this.capaSecretos = el("div.escondite", { "aria-hidden": "true" });
      this.root.append(this.capaSecretos);
    }

    const caja = this.root.getBoundingClientRect();
    const nodo = el("span.escondite__corazon", { text: "♥" });
    if (frase) nodo.append(el("i.escondite__frase", { text: frase }));

    // Cada uno sube por su lado y a su ritmo; si salieran todos iguales
    // parecerían una animación en vez de una casualidad bonita.
    const az = (min, max) => min + Math.random() * (max - min);
    nodo.style.setProperty("--x", `${Math.round(x - caja.left)}px`);
    nodo.style.setProperty("--y", `${Math.round(y - caja.top)}px`);
    nodo.style.setProperty("--drift", `${Math.round(az(-28, 28))}px`);
    nodo.style.setProperty("--dur", `${Math.round(az(1500, 2200))}ms`);
    nodo.style.setProperty("--size", az(0.8, 1.3).toFixed(2));

    this.capaSecretos.append(nodo);
    this.later(() => nodo.remove(), 2400);
  }

  /**
   * Marca uno de los pequeños secretos escondidos por el libro.
   *
   * A diferencia de `unlockSecret`, esto NO desbloquea nada ni hace falta
   * para avanzar: son detalles que están ahí por si aparecen. Si el mismo
   * escondite ya salió otro día, no se vuelve a celebrar, pero sí se enseña,
   * porque volver a encontrarlo también tiene su gracia.
   *
   * @param {string} clave   identificador estable del escondite
   * @param {string} frase   lo que susurra
   * @param {{x?:number,y?:number}} [donde]  para soltar el corazón ahí mismo
   */
  escondite(clave, frase, donde = {}) {
    if (this.destroyed) return false;

    const primera = this.ctx.store.findHideout(clave);
    this.ctx.haptics.play(primera ? "secret" : "tap");
    if (frase) this.ctx.ui?.toast?.(frase, primera ? 3400 : 2400);
    if (donde.x != null) this.corazon(donde.x, donde.y, "");
    return primera;
  }
}
