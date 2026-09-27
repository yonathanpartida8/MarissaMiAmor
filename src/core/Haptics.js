/**
 * HAPTICS — el libro se siente en los dedos.
 *
 * Vocabulario táctil corto y consistente: cada gesto tiene su vibración.
 * Android responde con navigator.vibrate. iPhone no lo tiene, pero desde
 * iOS 18 un interruptor (`<input type="checkbox" switch>`) da un toquecito
 * al cambiar: se usa uno invisible, pulsado desde aquí, para que el iPhone
 * también vibre. Si no hay ninguna de las dos cosas, nada: sin errores.
 */

/** Cuántos toquecitos de iPhone equivalen a cada patrón (y su separación). */
const TOQUES_IOS = {
  tick: [0],
  tap: [0],
  turn: [0],
  open: [0, 130],
  reveal: [0, 110],
  secret: [0, 110, 220],
  heart: [0, 120],
  error: [0, 90],
};

function esIOS() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

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
    this.ios = !capabilities.vibrate && !capabilities.reducedMotion && esIOS();
    this.enabled = (capabilities.vibrate || this.ios) && !capabilities.reducedMotion;
    this.muted = false;
    this.#last = 0;
  }

  #last = 0;
  #interruptor = null;

  /** Un toquecito de iPhone: cambia un interruptor invisible. */
  #toqueIOS() {
    try {
      if (!this.#interruptor) {
        const label = document.createElement("label");
        label.setAttribute("aria-hidden", "true");
        label.style.cssText = "position:fixed;left:-99px;top:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.setAttribute("switch", "");
        input.tabIndex = -1;
        label.append(input);
        // Que nadie más del libro se entere de estos clics.
        label.addEventListener("click", (e) => e.stopPropagation());
        input.addEventListener("click", (e) => e.stopPropagation());
        document.body.append(label);
        this.#interruptor = label;
      }
      // Si ella estaba escribiendo en algo, que no pierda el foco.
      const antes = document.activeElement;
      this.#interruptor.click();
      if (antes && antes !== document.body && document.activeElement !== antes) antes.focus?.({ preventScroll: true });
    } catch {
      this.ios = false;
    }
  }

  #vibrar(pattern, name) {
    if (this.ios) {
      for (const ms of TOQUES_IOS[name] || [0]) {
        if (ms) setTimeout(() => this.#toqueIOS(), ms);
        else this.#toqueIOS();
      }
      return;
    }
    navigator.vibrate(pattern);
  }

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
      this.#vibrar(pattern, name);
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
      if (this.ios) this.#toqueIOS();
      else navigator.vibrate(ms);
    } catch {
      this.enabled = false;
    }
  }

  stop() {
    if (!this.enabled || this.ios) return;
    try {
      navigator.vibrate(0);
    } catch {
      /* nada */
    }
  }
}
