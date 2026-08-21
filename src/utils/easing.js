/**
 * Curvas de easing usadas por las animaciones en JS.
 * Las de CSS viven en tokens.css; éstas son sus gemelas para el canvas/WebGL.
 */

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** El "expo out" es el que da esa sensación premium de frenada suave. */
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

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
