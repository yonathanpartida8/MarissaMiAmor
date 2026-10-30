/**
 * Ayuditas para dibujar las cosas de la casita (SVG plano, suave y con contornito, sin degradados con id
 * para que nunca choquen entre sí). Cada objeto del catálogo dibuja con esto.
 */
export const OL = 'stroke="#4b2e42" stroke-opacity=".2" stroke-width="2.5" stroke-linejoin="round"';
export const OL2 = 'stroke="#4b2e42" stroke-opacity=".16" stroke-width="2" stroke-linejoin="round"';
export const svg = (w, h, cuerpo) => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${cuerpo}</svg>`;
export const MADERA = "#dcae84", MADERA_O = "#b8865c", MADERA_C = "#ecc9a4";

/** Un color más oscuro (k < 1) o más clarito (k > 1). */
export function tono(c, k) {
  const n = parseInt(String(c).slice(1), 16) || 0;
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 1) { r *= k; g *= k; b *= k; } else { const t = Math.min(1, k - 1); r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
export const brillo = (x, y, w, h, r = 6, o = 0.3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" opacity="${o}"/>`;
/** Un corazoncito centrado en (x, y); s = escala (1 ≈ 16 de ancho). */
export const corazon = (x, y, s, c, extra = "") => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-3c-2-4-9-3-8 2 1 4 8 8 8 8s7-4 8-8c1-5-6-6-8-2z" fill="${c}" ${extra}/>`;
/** Una estrellita de 5 picos. */
export function estrella(x, y, r, c, extra = "") {
  let d = "";
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + (x + Math.cos(a) * rr).toFixed(1) + " " + (y + Math.sin(a) * rr).toFixed(1); }
  return `<path d="${d}z" fill="${c}" ${extra}/>`;
}
/** Una hojita (para plantas). */
export const hoja = (x, y, a, l, c) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 0C${l * 0.3}-${l * 0.25} ${l * 0.75}-${l * 0.2} ${l} 0 ${l * 0.75} ${l * 0.2} ${l * 0.3} ${l * 0.25} 0 0z" fill="${c}" ${OL2}/>`;
/** El sitio de un monito sentado: su pie va 34 abajo del asiento. */
export const sentado = (dx, asiento, extra = {}) => ({ dx, dy: asiento + 34, pose: "sentado", z: 1, ...extra });
