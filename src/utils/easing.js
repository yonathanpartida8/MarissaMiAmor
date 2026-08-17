/**
 * Curvas de easing usadas por las animaciones en JS.
 * Las de CSS viven en tokens.css; éstas son sus gemelas para el canvas/WebGL.
 */

export const linear = (t) => t;

export const easeInQuad = (t) => t * t;
export const easeOutQuad = (t) => t * (2 - t);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

export const easeInCubic = (t) => t * t * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** El "expo out" es el que da esa sensación premium de frenada suave. */
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutExpo = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

export const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

export const easeOutBack = (t, overshoot = 1.7) => {
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
};

export const easeOutElastic = (t) => {
  const c4 = (2 * Math.PI) / 3;
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/** Rebote de papel al asentarse. */
export const easeOutPaper = (t) => {
  const e = easeOutExpo(t);
  return e + Math.sin(t * Math.PI * 3) * 0.02 * (1 - t);
};

/**
 * Tween mínimo basado en rAF. Devuelve una promesa y una función de cancelado.
 * Se usa para animaciones puntuales que no merecen entrar en el bucle global.
 */
export function tween({ from = 0, to = 1, duration = 400, ease = easeOutCubic, onUpdate, onComplete }) {
  let raf = 0;
  let cancelled = false;
  const start = performance.now();

  const promise = new Promise((resolve) => {
    const frame = (now) => {
      if (cancelled) return resolve(false);
      // El reloj se acota por ABAJO además de por arriba, y no es un detalle:
      // `requestAnimationFrame` entrega la marca de tiempo del fotograma, que
      // puede ser ANTERIOR al momento en que se pidió el rAF si se pidió a
      // mitad de ese mismo fotograma. Con `t` negativo, las curvas de easing
      // extrapolan —una quíntica devolvía -1.85 en el primer fotograma— y la
      // página daba un salto de doscientos píxeles antes de empezar a
      // animarse. Ese era el tirón que se veía al arrancar cada transición.
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      onUpdate?.(from + (to - from) * ease(t), t);
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        onComplete?.();
        resolve(true);
      }
    };
    raf = requestAnimationFrame(frame);
  });

  promise.cancel = () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
  return promise;
}
