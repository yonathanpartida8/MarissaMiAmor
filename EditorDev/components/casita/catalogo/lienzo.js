/**
 * (Fase 78) EL LIENZO DE CARPINTERO: para dibujar muebles cuadrito por cuadrito (cada letra, un color de la paleta de
 * pixel.js) con herramientas de carpintería: cajas, marcos, tableros con realce o hundidos, líneas, elipses, patas.
 * Es el mismo lienzo de la cocina (Fase 75), con más herramientas, para los muebles de todos los cuartos.
 *
 *   · `pon(x, y, c, si)`: un cuadrito (si `si` es una cadena, sólo encima de esas letras).
 *   · `caja`: un rectángulo lleno; `marco`: sólo su orilla.
 *   · `realce(x0, y0, x1, y1, fondo, luz, sombra)`: un tablero que sobresale (luz arriba e izquierda, sombra abajo y derecha).
 *   · `hundido(...)`: al revés (un tablero metido).
 *   · `elipse(cx, cy, rx, ry, c, borde)`: una elipse llena (con su orilla de otra letra).
 *   · `patas(xs, y0, y1, c, sombra)`: patitas de dos cuadritos de ancho.
 */
export function lienzo(W, H) {
  const G = Array.from({ length: H }, () => Array(W).fill("."));
  const pon = (x, y, c, si = null) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || !c) return; if (si && !si.includes(G[y][x])) return; G[y][x] = c; };
  const en = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? "." : G[y][x]);
  const caja = (x0, y0, x1, y1, c, si) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pon(x, y, c, si); };
  const marco = (x0, y0, x1, y1, c) => { for (let x = x0; x <= x1; x++) { pon(x, y0, c); pon(x, y1, c); } for (let y = y0; y <= y1; y++) { pon(x0, y, c); pon(x1, y, c); } };
  const realce = (x0, y0, x1, y1, fondo, luz, sombra) => { caja(x0, y0, x1, y1, fondo); for (let x = x0; x <= x1; x++) { pon(x, y0, luz); pon(x, y1, sombra); } for (let y = y0; y <= y1; y++) { pon(x0, y, luz); pon(x1, y, sombra); } pon(x1, y0, fondo); pon(x0, y1, fondo); };
  const hundido = (x0, y0, x1, y1, fondo, sombra, luz) => realce(x0, y0, x1, y1, fondo, sombra, luz);
  const linea = (x0, y0, x1, y1, c, si) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1; for (let t = 0; t <= n; t++) pon(x0 + ((x1 - x0) * t) / n, y0 + ((y1 - y0) * t) / n, c, si); };
  const elipse = (cx, cy, rx, ry, c, borde = null) => {
    const d = (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (!d(x, y)) continue;
      const orilla = borde && (!d(x - 1, y) || !d(x + 1, y) || !d(x, y - 1) || !d(x, y + 1));
      pon(x, y, orilla ? borde : c);
    }
  };
  /** Patitas (dos cuadritos de ancho): la de la izquierda clara, la de la derecha en sombra, y su pie oscuro. */
  const patas = (xs, y0, y1, c, sombra, pie = null) => { for (const x of xs) { caja(x, y0, x, y1, c); caja(x + 1, y0, x + 1, y1, sombra); if (pie) { pon(x, y1, pie); pon(x + 1, y1, pie); } } };
  const filas = () => G.map((f) => f.join(""));
  return { W, H, G, pon, en, caja, marco, realce, hundido, linea, elipse, patas, filas };
}
/** Una semillita pareja (para vetas, motitas): entre 0 y 1, siempre igual para el mismo cuadrito. */
export const hash = (a, b) => { let h = Math.imul(a * 73856093 ^ b * 19349663, 2654435761) >>> 0; return (h % 1000) / 1000; };
/** Un rectángulo de SVG (para lo vivo en pixel). */
export const R = (x, y, w, h, c, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`;
