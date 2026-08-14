/**
 * POINTER — dónde está el dedo (o el ratón) y cómo está inclinado el teléfono.
 *
 * Es la fuente de "vida" del libro: la usan la atmósfera WebGL, los brillos de
 * la portada y todos los parallax. Un único suavizado central evita que cada
 * efecto reinvente su propio lerp y se desincronicen entre sí.
 */

import { clamp, damp } from "../utils/math.js";

export class Pointer {
  constructor(viewport, capabilities) {
    this.viewport = viewport;
    this.caps = capabilities;

    // Posición cruda y suavizada, en NDC (-1..1)
    this.raw = { x: 0, y: 0 };
    this.smooth = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.down = false;
    this.pressure = 0; // 0..1, sube al mantener pulsado

    // Inclinación del dispositivo (-1..1)
    this.tilt = { x: 0, y: 0 };
    this.tiltSmooth = { x: 0, y: 0 };
    this.tiltEnabled = false;
    this.#baseTilt = null;

    this.#bind();
  }

  #baseTilt = null;

  #bind() {
    const onMove = (e) => {
      this.raw.x = (e.clientX / this.viewport.width) * 2 - 1;
      this.raw.y = -((e.clientY / this.viewport.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", (e) => {
      this.down = true;
      onMove(e);
    }, { passive: true });
    window.addEventListener("pointerup", () => (this.down = false), { passive: true });
    window.addEventListener("pointercancel", () => (this.down = false), { passive: true });

    // Al salir el ratón de la ventana, vuelve al centro con suavidad.
    document.addEventListener("pointerleave", () => {
      this.raw.x = 0;
      this.raw.y = 0;
    });
  }

  /**
   * Activa el giroscopio. En iOS 13+ hace falta permiso explícito lanzado
   * desde un gesto del usuario, por eso esto no se llama solo.
   */
  async enableTilt() {
    if (this.tiltEnabled) return true;
    const granted = await this.caps.requestMotionPermission();
    if (!granted) return false;

    window.addEventListener("deviceorientation", this.#onOrientation, { passive: true });
    this.tiltEnabled = true;
    return true;
  }

  #onOrientation = (e) => {
    if (e.beta == null || e.gamma == null) return;
    // La primera lectura fija el "reposo": el libro se calibra a cómo lo
    // esté sujetando en ese momento, no a una postura teórica.
    if (!this.#baseTilt) this.#baseTilt = { beta: e.beta, gamma: e.gamma };

    const dBeta = clamp((e.beta - this.#baseTilt.beta) / 34, -1, 1);
    const dGamma = clamp((e.gamma - this.#baseTilt.gamma) / 34, -1, 1);
    this.tilt.x = dGamma;
    this.tilt.y = -dBeta;
  };

  /** Vuelve a tomar la postura actual como reposo. */
  recalibrate() {
    this.#baseTilt = null;
  }

  /** Lo llama el Loop una vez por frame, antes que nada más. */
  update(dt) {
    const px = this.smooth.x;
    const py = this.smooth.y;
    this.smooth.x = damp(this.smooth.x, this.raw.x, 6, dt);
    this.smooth.y = damp(this.smooth.y, this.raw.y, 6, dt);
    this.velocity.x = (this.smooth.x - px) / Math.max(dt, 0.001);
    this.velocity.y = (this.smooth.y - py) / Math.max(dt, 0.001);

    this.tiltSmooth.x = damp(this.tiltSmooth.x, this.tilt.x, 3.2, dt);
    this.tiltSmooth.y = damp(this.tiltSmooth.y, this.tilt.y, 3.2, dt);

    this.pressure = damp(this.pressure, this.down ? 1 : 0, this.down ? 5 : 8, dt);
  }

  /**
   * Influencia combinada dedo + inclinación, que es lo que consumen los
   * efectos. En móvil manda el giroscopio; en escritorio, el ratón.
   */
  get influence() {
    return {
      x: this.smooth.x * 0.65 + this.tiltSmooth.x * 0.85,
      y: this.smooth.y * 0.65 + this.tiltSmooth.y * 0.85,
    };
  }
}
