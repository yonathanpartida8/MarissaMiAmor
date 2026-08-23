/**
 * SCRATCHSURFACE — una capa que se borra con el dedo.
 *
 * La usan dos experiencias muy distintas: rascar una lámina plateada para
 * descubrir una foto, y limpiar el vaho de una ventana en una noche de
 * tormenta. Lo que cambia es lo que se pinta encima; el mecanismo es el mismo.
 *
 * Detalles que importan:
 *  · el trazo es continuo (interpola entre dos posiciones del dedo), si no
 *    aparecen puntos sueltos cuando se mueve rápido
 *  · el porcentaje descubierto se calcula muestreando, no píxel a píxel:
 *    leer un canvas entero cada frame en un móvil cuesta media pantalla
 */

import { clamp01 } from "../utils/math.js";

export class ScratchSurface {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   * @param {(ctx:CanvasRenderingContext2D, w:number, h:number)=>void} options.paint capa a borrar
   * @param {number} [options.brush] radio del dedo en px CSS
   * @param {number} [options.threshold] proporción a partir de la cual se considera "descubierto"
   * @param {(p:number)=>void} [options.onProgress]
   * @param {()=>void} [options.onComplete]
   * @param {number} [options.dpr]
   */
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.paint = options.paint;
    this.brush = options.brush ?? 44;
    this.threshold = options.threshold ?? 0.52;
    this.onProgress = options.onProgress;
    this.onComplete = options.onComplete;
    this.dpr = Math.min(options.dpr ?? window.devicePixelRatio ?? 1, 2);

    this.progress = 0;
    this.completed = false;
    this.last = null;
    this.sinceSample = 0;
  }

  resize(width, height) {
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.clearRect(0, 0, width, height);
    this.paint(this.ctx, width, height);

    // Rehacer la capa borra lo ya rascado; se reconstruye el progreso a 0.
    this.progress = 0;
    this.completed = false;
    this.last = null;
  }

  /** Borra en un punto (coordenadas relativas al canvas, en px CSS). */
  scratch(x, y, pressure = 1) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "destination-out";

    const radius = this.brush * (0.75 + pressure * 0.35);

    if (this.last) {
      // Trazo continuo: sin esto, un dedo rápido deja el rastro a topos.
      ctx.lineWidth = radius * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(this.last.x, this.last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    this.last = { x, y };
    this.#maybeSample();
  }

  /** Levanta el dedo: el siguiente trazo empieza de cero. */
  lift() {
    this.last = null;
  }

  /**
   * Muestreo en rejilla: mira ~1.500 píxeles en vez de un millón.
   * El error es de décimas y cuesta una milésima de lo mismo.
   */
  #maybeSample() {
    if (this.completed) return;
    if (++this.sinceSample < 6) return;
    this.sinceSample = 0;

    const step = 12;
    const w = this.canvas.width;
    const h = this.canvas.height;
    let clear = 0;
    let total = 0;

    try {
      const data = this.ctx.getImageData(0, 0, w, h).data;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const alpha = data[(y * w + x) * 4 + 3];
          if (alpha < 40) clear++;
          total++;
        }
      }
    } catch {
      return; // canvas contaminado: mejor no romper la página
    }

    this.progress = clamp01(total ? clear / total : 0);
    this.onProgress?.(this.progress);

    if (this.progress >= this.threshold) {
      this.completed = true;
      this.onComplete?.();
    }
  }

  /** Termina de borrar la capa con una animación, cuando ya se ha ganado. */
  dissolve(duration = 620) {
    return new Promise((resolve) => {
      const start = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        this.canvas.style.opacity = String(1 - t);
        if (t < 1) requestAnimationFrame(step);
        else {
          this.ctx.clearRect(0, 0, this.width, this.height);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }
}

/** Capa de plata rascable, con brillo y textura. */
export function silverLayer(accent = "#d7ae72") {
  return (ctx, w, h) => {
    // Base metálica: contraste alto y frío, para que no se confunda con papel.
    const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
    g.addColorStop(0, "#4a4d58");
    g.addColorStop(0.22, "#b2a2a5");
    g.addColorStop(0.38, "#6b5b60");
    g.addColorStop(0.58, "#d6c6c8");
    g.addColorStop(0.74, "#666a77");
    g.addColorStop(1, "#3e414b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Rayado fino en diagonal: el aluminio cepillado de las tarjetas de verdad.
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h * 0.35, h);
      ctx.stroke();
    }

    // Vetas irregulares, que rompen la regularidad del cepillado.
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 44; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = Math.random() > 0.45 ? "#fff6f2" : "#37292d";
      ctx.lineWidth = Math.random() * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (Math.random() - 0.5) * 30);
      ctx.stroke();
    }

    // Y un reflejo cálido que cruza: el único color de toda la lámina.
    ctx.globalAlpha = 0.3;
    const sheen = ctx.createLinearGradient(0, h, w, 0);
    sheen.addColorStop(0, "transparent");
    sheen.addColorStop(0.44, "transparent");
    sheen.addColorStop(0.5, accent);
    sheen.addColorStop(0.55, "#fffaf0");
    sheen.addColorStop(0.6, accent);
    sheen.addColorStop(0.68, "transparent");
    sheen.addColorStop(1, "transparent");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  };
}

/** Cristal empañado: para la noche de tormenta. */
export function fogLayer() {
  return (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(240, 228, 226, 0.94)");
    g.addColorStop(0.55, "rgba(232, 210, 210, 0.9)");
    g.addColorStop(1, "rgba(214, 182, 186, 0.95)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Gotas condensadas.
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 3 + 0.6;
      ctx.globalAlpha = Math.random() * 0.45;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Regueros que bajan.
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.6;
      const len = 30 + Math.random() * 140;
      ctx.globalAlpha = 0.3 + Math.random() * 0.3;
      ctx.lineWidth = 1 + Math.random() * 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 4, y + len * 0.4, x - 4, y + len * 0.7, x + 1, y + len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };
}
