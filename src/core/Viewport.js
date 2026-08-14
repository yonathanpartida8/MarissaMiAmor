/**
 * VIEWPORT — el tamaño real de la pantalla, con todas sus trampas.
 *
 * Resuelve: la barra de direcciones de iOS que aparece y desaparece, el notch,
 * la Dynamic Island, la rotación, y el gesto de zoom accidental. Publica un
 * único evento `resize` con medidas ya normalizadas.
 */

import { Emitter } from "./Emitter.js";

export class Viewport extends Emitter {
  constructor() {
    super();
    this.width = 0;
    this.height = 0;
    this.aspect = 1;
    this.orientation = "portrait";
    this.isPhone = false;
    this.isTablet = false;
    this.isDesktop = false;

    this.#measure();
    this.#bind();
  }

  #bind() {
    // visualViewport es la fuente fiable en iOS; window.resize como respaldo.
    const onResize = () => this.#schedule();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", () => {
      // iOS reporta medidas viejas justo al rotar: espera dos frames.
      requestAnimationFrame(() => requestAnimationFrame(() => this.#measure(true)));
    });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });

    // Bloquea el zoom por doble toque y por pellizco del navegador,
    // para que el pinch lo gestionen las páginas que sí lo quieren.
    let lastTouch = 0;
    document.addEventListener(
      "touchend",
      (e) => {
        const now = Date.now();
        if (now - lastTouch < 300) e.preventDefault();
        lastTouch = now;
      },
      { passive: false }
    );
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    // Evita el "pull to refresh" y el rebote elástico del documento.
    document.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 1) e.preventDefault();
      },
      { passive: false }
    );
  }

  #raf = 0;
  #schedule() {
    cancelAnimationFrame(this.#raf);
    this.#raf = requestAnimationFrame(() => this.#measure());
  }

  #measure(force = false) {
    const vv = window.visualViewport;
    const width = Math.round(vv?.width || window.innerWidth);
    const height = Math.round(vv?.height || window.innerHeight);

    // Ignora los cambios de alto minúsculos de la barra de direcciones,
    // que si no provocan reflows constantes al hacer scroll en móvil.
    const dw = Math.abs(width - this.width);
    const dh = Math.abs(height - this.height);
    if (!force && dw === 0 && dh < 90) return;

    this.width = width;
    this.height = height;
    this.aspect = width / Math.max(1, height);
    this.orientation = width > height ? "landscape" : "portrait";

    // Clasificación por el lado corto para separar móvil de tableta, y por el
    // ancho para separar tableta de escritorio: un portátil de 1440x900 tiene
    // el lado corto por debajo de 1024 y con la regla ingenua se hacía pasar
    // por tableta.
    const min = Math.min(width, height);
    this.isPhone = min < 600;
    this.isTablet = !this.isPhone && width < 1100;
    this.isDesktop = !this.isPhone && width >= 1100;

    const root = document.documentElement;
    // Respaldo de dvh para navegadores antiguos.
    root.style.setProperty("--vh", `${height * 0.01}px`);
    root.style.setProperty("--app-h", `${height}px`);
    root.dataset.orientation = this.orientation;
    root.dataset.device = this.isPhone ? "phone" : this.isTablet ? "tablet" : "desktop";

    this.emit("resize", this);
  }

  /** Coordenadas normalizadas -1..1 (útil para shaders y parallax). */
  toNdc(x, y) {
    return [(x / this.width) * 2 - 1, -((y / this.height) * 2 - 1)];
  }
}
