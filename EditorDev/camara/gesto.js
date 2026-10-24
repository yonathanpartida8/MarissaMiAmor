/**
 * EL GESTO DE GOKU (Fase 44, en la cámara desde la Fase 45) — la Teletransportación: el índice y el medio juntitos, en la frente.
 *
 * Funciones puras (sin cámara ni pantalla) para poder probarlas con puntos inventados:
 *   · `frente(cara)` — dónde está tu frente, con los puntos de la cara (ojos y boca);
 *   · `dedosEnFrente(mano, cara, aspecto)` — ¿tienes el índice y el medio estirados y juntos (el anular
 *     y el meñique doblados) con las puntas en la frente?;
 *   · `Carga` — cuenta los 3 segundos; perdona parpadeos cortos de la detección (la mano tapa un poco
 *     la cara y a veces no se ve un cuadro), pero si quitas la mano vuelve a empezar.
 * Los puntos vienen de MediaPipe, de 0 a 1 en la imagen: la mano son sus 21 puntos (0 muñeca, 5-8
 * índice, 9-12 medio, 13-16 anular, 17-20 meñique) y la cara los 6 de BlazeFace (0 y 1 los ojos, 3 la boca).
 * `aspecto` = ancho / alto de la imagen (para medir distancias de verdad, no estiradas).
 */
const d = (a, b, k = 1) => Math.hypot((a.x - b.x) * k, a.y - b.y);

export function frente(cara, aspecto = 1) {
  if (!cara || cara.length < 4) return null;
  const ojos = { x: (cara[0].x + cara[1].x) / 2, y: (cara[0].y + cara[1].y) / 2 }, boca = cara[3];
  // «Arriba» de la cara (aunque la cabeza esté ladeada): de la boca hacia los ojos.
  const largo = d(ojos, boca, aspecto) || 1e-6;
  const ux = ((ojos.x - boca.x) * aspecto) / largo, uy = (ojos.y - boca.y) / largo;
  return { ojos, ux, uy, largo, centro: { x: ojos.x + (ux * largo * 0.85) / aspecto, y: ojos.y + uy * largo * 0.85 } };
}

const estirado = (m, i, k) => d(m[i + 3], m[0], k) > d(m[i + 1], m[0], k) * 1.12;   // la punta más lejos de la muñeca que el nudillo de en medio
const doblado = (m, i, k) => d(m[i + 3], m[0], k) < d(m[i + 1], m[0], k) * 1.08;

export function dedosEnFrente(mano, cara, aspecto = 1) {
  if (!mano || mano.length < 21) return false;
  const f = frente(cara, aspecto);
  if (!f) return false;
  const k = aspecto;
  if (!estirado(mano, 5, k) || !estirado(mano, 9, k)) return false;          // índice y medio estirados
  if (!doblado(mano, 13, k) || !doblado(mano, 17, k)) return false;          // anular y meñique doblados
  const nudillos = d(mano[5], mano[9], k) || 1e-6;
  if (d(mano[8], mano[12], k) > nudillos * 1.6) return false;                // juntitos (no la «V» de amor y paz)
  const p = { x: (mano[8].x + mano[12].x) / 2, y: (mano[8].y + mano[12].y) / 2 };
  // Dónde quedan las puntas, medido en la cara: hacia arriba (desde los ojos) y de lado.
  const dx = (p.x - f.ojos.x) * k, dy = p.y - f.ojos.y;
  const arriba = (dx * f.ux + dy * f.uy) / f.largo, lado = Math.abs(dx * -f.uy + dy * f.ux) / f.largo;
  return arriba > 0.15 && arriba < 1.9 && lado < 1.05;
}

/** Junta tiempo mientras el gesto se sostiene. `paso(si, t)` → 0…1 (1 = ¡ya!). */
export class Carga {
  constructor(ms = 3000, perdon = 450) { this.ms = ms; this.perdon = perdon; this.reiniciar(); }
  reiniciar() { this.desde = null; this.visto = -Infinity; this.valor = 0; }
  paso(si, t = performance.now()) {
    if (si) { if (this.desde == null) this.desde = t; this.visto = t; }
    else if (this.desde != null && t - this.visto > this.perdon) this.desde = null;
    this.valor = this.desde == null ? 0 : Math.min(1, (t - this.desde) / this.ms);
    return this.valor;
  }
}
