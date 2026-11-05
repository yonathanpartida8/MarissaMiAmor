/**
 * EL VIENTO (Fase 65): un solo viento para todo lo de afuera, que cambia solito y nunca se repite igual.
 *
 *   · Su fuerza (0 a 1) sale del clima (con sol, brisita; con lluvia, más; con tormenta, fuerte) y varía sola:
 *     olas lentas (senos de periodos que no coinciden) y ráfagas de vez en cuando. Cuándo llega cada ráfaga y qué
 *     tan fuerte es sale de la hora, así los dos teléfonos sienten casi el mismo viento sin mandarse nada.
 *   · Mueve las copas de los árboles (cada uno con su peso: el pino casi no, el sauce y el abedul mucho, y cada
 *     uno a su ritmo), los arbustos, los árboles del catálogo, y las olitas del agua (agua.js). En las ráfagas se
 *     sueltan más hojitas que caen volando.
 *   · Si tu monito (o tu amorcito) pasa detrás de un árbol, la copa se hace transparente para que se vean.
 *   · Un solo ciclo a ~30 cuadros por segundo, sólo afuera y sólo lo que se ve; con «menos movimiento» o con los
 *     gráficos al mínimo, los árboles se quedan quietos (y el agua también).
 */
import { cuarto, inicioDe } from "./cuartos.js";
import { MAPA, MEDIDAS, ES_ARBOL, hash } from "./exterior.js";
import { nivel } from "./graficos.js";

const BASE = { sol: 0.24, lluvia: 0.52, tormenta: 0.8, extra: 0.95 };
const PESO = { roble: 0.75, cerezo: 1, frutal: 0.85, pino: 0.42, abedul: 1.2, sauce: 1.35, arbusto: 0.7 };
const sinMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Qué tan fuerte sopla en el segundo t (0 a 1). */
export function fuerzaViento(t, clima = "sol") {
  const b = BASE[clima] ?? BASE.sol;
  const lento = 0.5 + 0.22 * Math.sin(t / 9.7) + 0.16 * Math.sin(t / 4.3 + 1.7) + 0.12 * Math.sin(t / 2.1 + 0.4);
  // Ráfagas: en cada ventanita de 8 s puede llegar una, con subida y bajada suaves.
  const k = Math.floor(t / 8), f = t / 8 - k;
  let raf = 0;
  if (hash(k, 7, 311) < 0.42 + b * 0.4) {
    const ini = 0.08 + hash(k, 8, 311) * 0.5, dur = 0.24 + hash(k, 9, 311) * 0.22, x = (f - ini) / dur;
    if (x > 0 && x < 1) raf = Math.sin(Math.PI * x) ** 2 * (0.35 + hash(k, 10, 311) * 0.55);
  }
  return Math.max(0, Math.min(1, b * (0.5 + lento * 0.75) + raf * (0.35 + b * 0.8)));
}

export class Viento {
  constructor(j) { this.j = j; this.f = 0; this.raf = 0; this._ultimo = 0; this._n = 0; this._hojaT = 0; this.activo = false; }
  prender() {
    cancelAnimationFrame(this.raf);
    const paso = (ms) => { this.raf = requestAnimationFrame(paso); this._cuadro(ms); };
    this.raf = requestAnimationFrame(paso);
  }
  apagar() { cancelAnimationFrame(this.raf); this.raf = 0; this._quieto(); }
  /** Todo de vuelta a su lugar (al salir, o con «menos movimiento»). */
  _quieto() {
    if (!this.activo) return;
    this.activo = false;
    this.j.raiz?.classList.remove("viento-js");
    for (const { n } of this.j.patio?.esc.values() || []) { for (const x of n.children) x.style.transform = ""; n.classList.remove("tapa"); }
    for (const r of this.j.objs?.values() || []) { const c = r._copa; if (c) c.style.transform = ""; }
  }
  _cuadro(ms) {
    const j = this.j;
    if (ms - this._ultimo < 32 || document.hidden || !j.vivo || !j.raiz) return;
    this._ultimo = ms;
    const c = j.vistaCuarto, cu = c && cuarto(c);
    if (!cu?.afuera || sinMov() || nivel(j.gfx) < 1) { this._quieto(); this.f = 0; return; }
    if (!this.activo) { this.activo = true; j.raiz.classList.add("viento-js"); }
    const t = Date.now() / 1000, clima = j.climaActual?.() || "sol", f = (this.f = fuerzaViento(t, clima)), cuadro = ++this._n;
    const v = j.vistaN, k = j.k, x0 = inicioDe(c), L = v.scrollLeft / k - 260, R = (v.scrollLeft + v.clientWidth) / k + 260;
    const T = v.scrollTop / k - MAPA.arriba - 80, B = (v.scrollTop + v.clientHeight) / k - MAPA.arriba + 560;
    // Los árboles y arbustos del patio que se ven.
    if (cu.mapa && j.patio) {
      const monos = [j.yo, j.suyo].filter((m) => m && !m.n.hidden);
      for (const { e, n } of j.patio.esc.values()) {
        const peso = PESO[e.k];
        if (!peso || e.x < L || e.x > R || e.y < T || e.y > B) continue;
        const ph = hash(e.x, e.y, 6) * 6.28, w = 0.55 + hash(e.y, e.x, 5) * 0.5;
        // Se inclina con el viento (siempre hacia el mismo lado, más en las ráfagas) y se mece encima a su ritmo.
        const a = peso * (f * 2.4 + Math.sin(t * w * (1 + f) + ph) * (0.35 + f * 1.1) + Math.sin(t * 3.1 * w + ph * 2) * f * 0.35);
        const copa = n.lastElementChild?.classList.contains("esc-copa") ? n.lastElementChild : n.querySelector(".esc-copa");
        if (copa) copa.style.transform = `rotate(${(a * 0.55).toFixed(2)}deg) skewX(${(-a * 0.5).toFixed(2)}deg)`;
        else if (e.k === "arbusto") { const tr = n.querySelector(".esc-tronco"); if (tr) tr.style.transform = `skewX(${(-a * 0.9).toFixed(2)}deg)`; }
        // Detrás de la copa no se pierde nadie: se hace transparente.
        if (copa && cuadro % 6 === 0) {
          const m = MEDIDAS[e.k], tapa = monos.some((mo) => mo.y < e.y - 2 && mo.y > e.y - m.h * 0.92 && Math.abs(mo.gx - x0 - e.x) < m.w * 0.4);
          n.classList.toggle("tapa", tapa);
        }
      }
    }
    // Los árboles (y lo que tenga copa) del catálogo en este cuarto.
    for (const r of j.objs.values()) {
      if (r.o.c !== c || !r.d.hojas) continue;
      const copa = r._copa?.isConnected ? r._copa : (r._copa = r.n.querySelector(".copa"));
      if (!copa) continue;
      const ph = hash(r.o.x | 0, r.o.y | 0, 6) * 6.28, a = f * 2 + Math.sin(t * (0.8 + f) + ph) * (0.4 + f);
      copa.style.transform = `rotate(${(a * 0.6).toFixed(2)}deg)`;
    }
    // En las ráfagas se sueltan hojitas que se van volando (de a mentiras: las de verdad son las de suciedad.js).
    if (f > 0.6 && t - this._hojaT > 1.4 - f && cu.mapa && j.patio) {
      this._hojaT = t;
      const vis = [...j.patio.esc.values()].filter(({ e }) => ES_ARBOL.has(e.k) && e.x > L + 200 && e.x < R - 200 && e.y > T && e.y < B - 300);
      const it = vis[Math.floor(Math.random() * vis.length)];
      if (it) { const m = MEDIDAS[it.e.k]; j.suciedad?.sacudir(x0 + it.e.x, it.e.y, m.h * 0.75, m.hojas, 1); }
    }
    // El agua (más despacito: ~12 cuadros por segundo).
    if (cu.mapa && cuadro % 3 === 0) j.patio?.agua?.cuadro(t, f);
  }
}
