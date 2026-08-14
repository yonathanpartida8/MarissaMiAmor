/**
 * ASSETLOADER — 85 fotografías sin ahogar el móvil.
 *
 * Cargar todo de golpe son ~35 MB y una pantalla congelada. Aquí hay una cola
 * con prioridades y un máximo de descargas simultáneas: lo que se ve ahora va
 * primero, lo de la página siguiente se precarga de fondo, y lo demás espera.
 *
 * Además usa `img.decode()` para que la imagen ya esté descomprimida antes de
 * pintarla: sin ese paso, la primera aparición de una foto grande provoca un
 * tirón perceptible al pasar la página.
 */

import { Emitter } from "./Emitter.js";

export const PRIORITY = {
  CRITICAL: 0, // se está viendo
  NEXT: 1,     // la página siguiente
  NEAR: 2,     // dos o tres páginas más allá
  IDLE: 3,     // cuando el navegador no tenga nada mejor que hacer
};

export class AssetLoader extends Emitter {
  #cache = new Map();      // url -> HTMLImageElement resuelta
  #inflight = new Map();   // url -> Promise
  #queue = [];             // pendientes ordenados por prioridad
  #active = 0;

  constructor(capabilities) {
    super();
    this.caps = capabilities;
    // Conexiones simultáneas: pocas en móvil de gama baja para no saturar.
    this.concurrency = capabilities.tierName === "low" ? 2 : capabilities.tierName === "mid" ? 4 : 6;

    // Si el navegador reporta conexión lenta, aún más conservador.
    const conn = navigator.connection;
    if (conn && /2g/.test(conn.effectiveType || "")) this.concurrency = 1;
    this.saveData = Boolean(conn?.saveData);
  }

  has(url) {
    return this.#cache.has(url);
  }

  get(url) {
    return this.#cache.get(url) || null;
  }

  /**
   * Pide una imagen. Devuelve una promesa que resuelve con el <img> ya
   * decodificado. Llamadas repetidas comparten la misma promesa.
   */
  load(url, priority = PRIORITY.NEAR) {
    if (this.#cache.has(url)) return Promise.resolve(this.#cache.get(url));
    if (this.#inflight.has(url)) {
      this.#promote(url, priority);
      return this.#inflight.get(url);
    }

    let resolveFn;
    let rejectFn;
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });
    this.#inflight.set(url, promise);
    this.#queue.push({ url, priority, resolve: resolveFn, reject: rejectFn });
    this.#queue.sort((a, b) => a.priority - b.priority);
    this.#pump();
    return promise;
  }

  /** Carga un grupo y avisa del progreso. Usado por la pantalla de apertura. */
  async loadAll(urls, priority = PRIORITY.CRITICAL, onProgress) {
    let done = 0;
    const total = urls.length;
    const results = await Promise.all(
      urls.map((url) =>
        this.load(url, priority)
          .catch(() => null)
          .finally(() => onProgress?.(++done / total, done, total))
      )
    );
    return results;
  }

  /** Precarga silenciosa cuando el hilo principal está libre. */
  idlePreload(urls) {
    if (this.saveData) return; // respeta el "ahorro de datos" del usuario
    const run = () => urls.forEach((url) => this.load(url, PRIORITY.IDLE).catch(() => {}));
    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 1200);
  }

  #promote(url, priority) {
    const item = this.#queue.find((q) => q.url === url);
    if (item && priority < item.priority) {
      item.priority = priority;
      this.#queue.sort((a, b) => a.priority - b.priority);
    }
  }

  #pump() {
    while (this.#active < this.concurrency && this.#queue.length) {
      const item = this.#queue.shift();
      this.#active++;
      this.#fetch(item);
    }
  }

  async #fetch({ url, resolve, reject }) {
    const img = new Image();
    img.decoding = "async";
    // Necesario para poder usarla como textura WebGL sin "tainted canvas".
    img.crossOrigin = "anonymous";

    try {
      await new Promise((ok, fail) => {
        img.onload = ok;
        img.onerror = () => fail(new Error(`No se pudo cargar ${url}`));
        img.src = url;
      });
      // decode() puede fallar en navegadores viejos: no es motivo de error.
      if (img.decode) await img.decode().catch(() => {});
      this.#cache.set(url, img);
      this.#inflight.delete(url);
      this.emit("load", { url, img });
      resolve(img);
    } catch (err) {
      this.#inflight.delete(url);
      this.emit("error", { url, err });
      reject(err);
    } finally {
      this.#active--;
      this.#pump();
    }
  }

  /**
   * Libera imágenes que ya no se ven. En móvil, 85 bitmaps decodificados en
   * memoria son motivo suficiente para que iOS mate la pestaña.
   */
  release(urls) {
    for (const url of urls) {
      const img = this.#cache.get(url);
      if (!img) continue;
      img.src = "";
      this.#cache.delete(url);
    }
  }

  /** Deja sólo las N imágenes indicadas y suelta el resto. */
  keepOnly(urls) {
    const keep = new Set(urls);
    const drop = [...this.#cache.keys()].filter((url) => !keep.has(url));
    this.release(drop);
    return drop.length;
  }

  get cachedCount() {
    return this.#cache.size;
  }
}
