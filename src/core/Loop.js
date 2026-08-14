/**
 * LOOP — un único requestAnimationFrame para TODO el proyecto.
 *
 * Nada en el libro pide su propio rAF: partículas, muelles, shaders y páginas
 * se suscriben aquí. Así el navegador tiene un solo frame que planificar,
 * podemos pausar todo de golpe y medimos el rendimiento real en un sitio.
 */

import { Emitter } from "./Emitter.js";

export class Loop extends Emitter {
  #tasks = new Set();
  #raf = 0;
  #last = 0;
  #running = false;

  // Vigilancia de rendimiento
  #frames = 0;
  #accum = 0;
  #slowStreak = 0;

  constructor(capabilities) {
    super();
    this.caps = capabilities;
    this.time = 0;
    this.realTime = 0;
    this.dt = 0;
    this.realDt = 0;
    this.fps = 60;

    // Pausa total cuando la pestaña no se ve: cero batería gastada.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  /**
   * Registra una función por frame.
   * @param {(dt:number, time:number, realDt:number)=>void} fn
   * @param {number} [order] menor = antes (0 lógica, 10 GL, 20 UI)
   * @returns {() => void} función para darse de baja
   */
  add(fn, order = 10) {
    const task = { fn, order };
    this.#tasks.add(task);
    this.#sorted = null;
    return () => {
      this.#tasks.delete(task);
      this.#sorted = null;
    };
  }

  #sorted = null;
  get #ordered() {
    if (!this.#sorted) this.#sorted = [...this.#tasks].sort((a, b) => a.order - b.order);
    return this.#sorted;
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#last = performance.now();
    this.#raf = requestAnimationFrame(this.#frame);
  }

  stop() {
    this.#running = false;
    cancelAnimationFrame(this.#raf);
  }

  #frame = (now) => {
    if (!this.#running) return;
    this.#raf = requestAnimationFrame(this.#frame);

    // Dos relojes distintos, y la diferencia importa:
    //
    //  · `dt` va acotado a 1/20 s para que la física no explote si el hilo se
    //    atasca (una página que vuelve de segundo plano, un GC largo).
    //  · `realDt` es el tiempo que ha pasado de verdad. Todo lo que mide
    //    *duración para el usuario* —mantener pulsado un sello, sostener una
    //    linterna— tiene que usar éste: con el acotado, en un aparato a 10 fps
    //    "mantén 1,2 segundos" se convertía en mantener cuatro.
    const rawDt = (now - this.#last) / 1000;
    this.#last = now;
    this.dt = Math.min(rawDt, 1 / 20);
    // Tope generoso: sólo está para descartar el salto de volver de
    // segundo plano, no para recortar un frame lento de verdad.
    this.realDt = Math.min(rawDt, 1);
    this.time += this.dt;
    this.realTime = (this.realTime || 0) + this.realDt;

    for (const task of this.#ordered) {
      try {
        task.fn(this.dt, this.time, this.realDt);
      } catch (err) {
        console.error("[loop]", err);
        this.#tasks.delete(task);
        this.#sorted = null;
      }
    }

    this.#watch(rawDt);
  };

  /**
   * Vigilante adaptativo: si el aparato no sostiene ~45 fps durante dos
   * ventanas seguidas, se baja la calidad automáticamente. La fluidez
   * siempre gana a la vistosidad.
   */
  #watch(rawDt) {
    this.#frames++;
    this.#accum += rawDt;
    if (this.#accum < 1.2) return;

    this.fps = this.#frames / this.#accum;
    this.#frames = 0;
    this.#accum = 0;
    this.emit("fps", this.fps);

    if (this.fps < 45) {
      this.#slowStreak++;
      if (this.#slowStreak >= 2 && this.caps?.degrade()) {
        this.#slowStreak = 0;
        this.emit("degraded", this.caps.budget);
      }
    } else if (this.fps > 55) {
      this.#slowStreak = 0;
    }
  }
}
