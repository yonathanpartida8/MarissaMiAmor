/**
 * Matemáticas pequeñas y muy usadas.
 * Todo aquí es puro: sin estado, sin DOM.
 */

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export const clamp01 = (v) => clamp(v, 0, 1);

export const lerp = (a, b, t) => a + (b - a) * t;

/** Interpolación independiente del framerate. `speed` ~ 1..20 */
export const damp = (a, b, speed, dt) => lerp(a, b, 1 - Math.exp(-speed * dt));

export const inverseLerp = (a, b, v) => (b - a === 0 ? 0 : (v - a) / (b - a));

export const remap = (v, inMin, inMax, outMin, outMax) =>
  lerp(outMin, outMax, clamp01(inverseLerp(inMin, inMax, v)));

/** Curva suave clásica de Ken Perlin (más plana en los extremos). */
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp01(inverseLerp(edge0, edge1, x));
  return t * t * (3 - 2 * t);
};

export const smootherstep = (edge0, edge1, x) => {
  const t = clamp01(inverseLerp(edge0, edge1, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const TAU = Math.PI * 2;

export const degToRad = (d) => (d * Math.PI) / 180;

export const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);

/**
 * Integrador de muelle crítico. Devuelve la nueva posición y velocidad.
 * Es lo que da la sensación "física" al soltar una página.
 *
 * @param {number} value    posición actual
 * @param {number} target   destino
 * @param {number} velocity velocidad actual
 * @param {number} dt       delta en segundos
 * @param {number} stiffness rigidez (120–260 se siente bien en papel)
 * @param {number} damping  amortiguación (14–30)
 */
export function spring(value, target, velocity, dt, stiffness = 180, damping = 22) {
  const step = Math.min(dt, 1 / 30); // estabilidad si el hilo se atasca
  const force = -stiffness * (value - target);
  const drag = -damping * velocity;
  const v = velocity + (force + drag) * step;
  return { value: value + v * step, velocity: v };
}

/** ¿El muelle ya llegó? Para poder parar de animar y liberar CPU. */
export const springSettled = (value, target, velocity, eps = 0.001) =>
  Math.abs(value - target) < eps && Math.abs(velocity) < eps;
