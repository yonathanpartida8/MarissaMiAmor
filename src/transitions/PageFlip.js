/**
 * PAGEFLIP — pasar la hoja de verdad.
 *
 * No es un fundido disfrazado: la hoja gira sobre su lomo en 3D, se ve su
 * reverso, proyecta sombra sobre la página de debajo y se curva por el centro.
 * Y, sobre todo, **se puede arrastrar**: el dedo controla el ángulo, y al
 * soltar un muelle decide si termina de pasar o vuelve atrás, con la inercia
 * que llevara el gesto.
 *
 * Progreso 0 = hoja cerrada en su sitio · 1 = hoja completamente pasada.
 */

import { clamp01, spring, springSettled } from "../utils/math.js";
import { easeInOutCubic } from "../utils/easing.js";
import { resetLeaf } from "./effects.js";

export class PageFlip {
  /**
   * @param {HTMLElement} stage
   * @param {import("../core/Loop.js").Loop} loop
   * @param {object} services  { audio, haptics }
   */
  constructor(stage, loop, services = {}) {
    this.stage = stage;
    this.loop = loop;
    this.audio = services.audio;
    this.haptics = services.haptics;

    this.active = false;
    this.progress = 0;
    this.velocity = 0;
    this.direction = "next";
    this.turning = null; // hoja que gira
    this.under = null;   // hoja que se descubre
    this.soundFired = false;
  }

  /**
   * Prepara el giro.
   * @param {HTMLElement} outgoing hoja actual
   * @param {HTMLElement} incoming hoja destino
   * @param {"next"|"prev"} direction
   */
  begin(outgoing, incoming, direction = "next") {
    this.active = true;

    // Las dos hojas entran al giro sin restos de otras transiciones. Un
    // `opacity: 0` en línea de una salida anterior le gana a `leaf--under`
    // y dejaba la hoja de debajo invisible durante todo el volteo.
    resetLeaf(outgoing);
    resetLeaf(incoming);
    this.direction = direction;
    this.soundFired = false;
    this.velocity = 0;

    if (direction === "next") {
      // La hoja actual se va: gira hacia la izquierda y descubre la siguiente.
      this.turning = outgoing;
      this.under = incoming;
      this.progress = 0;
    } else {
      // Volvemos atrás: la hoja anterior entra desde la izquierda, ya girada.
      this.turning = incoming;
      this.under = outgoing;
      this.progress = 1;
    }

    this.turning.classList.add("leaf--turning");
    this.under.classList.add("leaf--under");
    this.turning.style.zIndex = "3";
    this.under.style.zIndex = "2";

    this.#apply(this.progress);
  }

  /** Coloca el giro en un punto concreto. Lo llama el dedo. */
  setProgress(p) {
    if (!this.active) return;
    this.progress = clamp01(p);
    this.#apply(this.progress);

    // El "clac" del papel suena cuando la hoja cruza la vertical, no al soltar.
    const crossed = this.progress > 0.42 && this.progress < 0.92;
    if (crossed && !this.soundFired) {
      this.soundFired = true;
      this.audio?.play("turn", { volume: 0.85, rate: 0.96 + Math.random() * 0.08 });
      this.haptics?.play("tick");
    } else if (this.progress < 0.3) {
      this.soundFired = false;
    }
  }

  /**
   * Suelta la hoja y deja que la física decida.
   * @param {number} target 0 (vuelve) o 1 (pasa)
   * @param {number} [velocity] px/ms del gesto, convertidos a velocidad de progreso
   * @returns {Promise<boolean>} true si terminó de pasar
   */
  settle(target, velocity = 0) {
    if (!this.active) return Promise.resolve(false);
    this.velocity = velocity;

    return new Promise((resolve) => {
      const stop = this.loop.add((dt) => {
        const step = spring(this.progress, target, this.velocity, dt, 168, 24);
        this.progress = step.value;
        this.velocity = step.velocity;
        this.#apply(this.progress);

        if (springSettled(this.progress, target, this.velocity, 0.0015)) {
          this.progress = target;
          this.#apply(target);
          stop();
          resolve(target > 0.5);
        }
      }, 5);
    });
  }

  /** Giro completo sin dedo de por medio (botones, teclado). */
  async run(duration = 900) {
    const from = this.direction === "next" ? 0 : 1;
    const to = this.direction === "next" ? 1 : 0;
    const start = performance.now();

    this.audio?.play("turn", { volume: 0.9, rate: 0.97 + Math.random() * 0.06 });
    this.haptics?.play("turn");
    this.soundFired = true;

    await new Promise((resolve) => {
      const stop = this.loop.add(() => {
        const t = Math.min(1, (performance.now() - start) / duration);
        this.setProgressSilent(from + (to - from) * easeInOutCubic(t));
        if (t >= 1) {
          stop();
          resolve();
        }
      }, 5);
    });
    return true;
  }

  /** Como setProgress pero sin disparar sonido (ya lo dio `run`). */
  setProgressSilent(p) {
    this.progress = clamp01(p);
    this.#apply(this.progress);
  }

  /**
   * Traduce el progreso a transformaciones.
   * El truco de realismo está en tres detalles: el ángulo no es lineal
   * (el papel acelera al pasar la vertical), la hoja se levanta un poco del
   * lomo, y la sombra recorre la página de debajo.
   */
  #apply(p) {
    if (!this.turning) return;

    // Curva de papel: arranca lento, cruza rápido, aterriza suave.
    const eased = easeInOutCubic(p);
    const angle = -180 * eased;

    // La hoja se separa del plano al pasar por el centro: da volumen.
    const lift = Math.sin(p * Math.PI);
    const z = lift * 42;
    // Y se curva ligerísimamente, como el papel real bajo su propio peso.
    const bend = lift * 3.2;

    this.turning.style.transform =
      `translateZ(${z}px) rotateY(${angle}deg) rotateX(${bend}deg)`;

    // Sombra proyectada sobre la hoja de debajo: máxima a mitad de giro.
    if (this.under) {
      this.under.style.setProperty("--under-shade", String(lift * 0.55));
      this.under.style.setProperty("--under-scale", String(0.965 + eased * 0.035));

      // Y aparece conforme la de arriba se levanta. Muchas páginas son
      // transparentes (lo que se ve vive en el lienzo de WebGL), así que con
      // la hoja de debajo al 100% desde el primer fotograma se veía a través
      // de la que todavía no se había movido: el fondo cambiaba de golpe
      // antes de que la hoja hubiera girado un solo grado.
      this.under.style.setProperty("--under-reveal", String(0.04 + clamp01(p * 1.7) * 0.96));
    }

    // Sombreado propio de la hoja que gira: la cara que se aleja se oscurece.
    const faceShade = p < 0.5 ? p * 1.3 : (1 - p) * 1.3;
    this.turning.style.setProperty("--leaf-shade", String(faceShade));
    this.turning.style.setProperty("--leaf-progress", String(p));
  }

  /** Deshace todo el andamiaje y deja las hojas limpias. */
  end() {
    if (!this.active) return;
    for (const leaf of [this.turning, this.under]) {
      if (!leaf) continue;
      leaf.classList.remove("leaf--turning", "leaf--under");
      leaf.style.transform = "";
      leaf.style.zIndex = "";
      leaf.style.removeProperty("--leaf-shade");
      leaf.style.removeProperty("--leaf-progress");
      leaf.style.removeProperty("--under-shade");
      leaf.style.removeProperty("--under-scale");
    }
    this.turning = null;
    this.under = null;
    this.active = false;
    this.progress = 0;
    this.velocity = 0;
  }
}
