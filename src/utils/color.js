/**
 * COLOR — cuatro cuentas para mezclar tonos.
 *
 * Lo justo para que la luz de un capítulo pueda teñir el papel y el cromo
 * sin traerse una librería entera. Trabaja en sRGB directo: para lavados
 * suaves entre colores de la misma familia —y aquí todos lo son— la
 * diferencia con una mezcla lineal no se ve, y sale mucho más barata.
 */

/**
 * «#ffa9bf» → [255, 169, 191]. Acepta también la forma corta «#fab».
 * @param {string} hex
 * @returns {[number, number, number]}
 */
export function aRgb(hex) {
  let s = String(hex).trim().replace("#", "");
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const n = parseInt(s, 16);
  if (!Number.isFinite(n) || s.length !== 6) return [255, 255, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** [255, 169, 191] → «#ffa9bf». */
export function aHex([r, g, b]) {
  const dos = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${dos(r)}${dos(g)}${dos(b)}`;
}

/**
 * Mezcla dos colores. `t = 0` devuelve el primero; `t = 1`, el segundo.
 * @param {string} hexA
 * @param {string} hexB
 * @param {number} t
 * @returns {string} hexadecimal
 */
export function mezclar(hexA, hexB, t) {
  const a = aRgb(hexA);
  const b = aRgb(hexB);
  return aHex([
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]);
}

/**
 * «#ffa9bf» → «255, 169, 191», que es lo que come `rgba(…)` en CSS.
 * Guardar el trío suelto —y no el color entero— es lo que deja escribir
 * `rgba(var(--luz-a-rgb), 0.2)` y sacar veinte transparencias distintas
 * de un solo token.
 */
export function trio(hex) {
  return aRgb(hex).join(", ");
}

/**
 * Luminancia relativa (WCAG). 0 es negro, 1 es blanco.
 * @param {string} hex
 */
export function luz(hex) {
  const [r, g, b] = aRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Contraste entre dos colores, en la escala de la WCAG: de 1 (iguales) a
 * 21 (negro sobre blanco). Texto normal quiere 4.5; texto grande, 3.
 */
export function contraste(hexA, hexB) {
  const a = luz(hexA);
  const b = luz(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
