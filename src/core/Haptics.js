/**
 * HAPTICS — el libro se siente en los dedos.
 *
 * Vocabulario táctil corto y consistente: cada gesto tiene su vibración.
 * Android responde con navigator.vibrate; iOS Safari lo ignora en silencio,
 * así que nunca damos por hecho que existe.
 */

const PATTERNS = {
  tick: 8,               // rozar, arrastrar un tope
  tap: 14,               // tocar algo interactivo
  turn: [10, 24, 16],    // pasar página
  open: [16, 40, 12, 30, 22], // abrir el libro / romper un sello
  reveal: [8, 26, 8, 26], // descubrir algo escondido
  secret: [12, 30, 12, 30, 26, 60], // encontrar un secreto
  heart: [26, 90, 34],   // latido
  error: [40, 60, 40],
};

export class Haptics {
  constructor(capabilities) {
    this.enabled = capabilities.vibrate && !capabilities.reducedMotion;
    this.muted = false;
    this.#last = 0;
  }

  #last = 0;

  /** @param {keyof typeof PATTERNS} name */
  play(name) {
    if (!this.enabled || this.muted) return;
    const pattern = PATTERNS[name];
    if (!pattern) return;

    // Estrangula: dos vibraciones seguidas se sienten como un fallo, no como diseño.
    const now = performance.now();
    if (now - this.#last < 45) return;
    this.#last = now;

    try {
      navigator.vibrate(pattern);
    } catch {
      this.enabled = false;
    }
  }

  /** Vibración proporcional a la fuerza de un gesto (arrastre, rasca). */
  scrub(intensity = 0.5) {
    if (!this.enabled || this.muted) return;
    const ms = Math.round(4 + Math.min(1, Math.max(0, intensity)) * 10);
    const now = performance.now();
    if (now - this.#last < 60) return;
    this.#last = now;
    try {
      navigator.vibrate(ms);
    } catch {
      this.enabled = false;
    }
  }

  stop() {
    if (!this.enabled) return;
    try {
      navigator.vibrate(0);
    } catch {
      /* nada */
    }
  }
}
