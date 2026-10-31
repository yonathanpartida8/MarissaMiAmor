/**
 * EL CIELO VIVO (Fase 59): lo que se mueve en el cielo de afuera (jardín y terraza), en pixel art.
 *
 *   · Nubecitas que pasan despacito (más grises si llueve; casi no se ven de noche).
 *   · De noche: estrellitas que titilan y, de vez en cuando, una estrella fugaz.
 *   · De día (sin lluvia): pajaritos que cruzan aleteando.
 *   · Todo es CSS (barato) y sólo trabaja el cuarto que se ve; en Máximo rendimiento se queda quieto.
 */
import { texNubePx, texPajaro } from "./texturas.js";
import { CUARTOS } from "./cuartos.js";

const azar = (a, b) => a + Math.random() * (b - a);

export class CieloVivo {
  constructor(j) { this.j = j; this.capas = new Map(); }
  /** Pone el cielo vivo en cada cuarto de afuera (justo encima del fondo pintado). */
  armar() {
    for (const c of CUARTOS) {
      if (!c.afuera) continue;
      const n = this.j.cuartosN.get(c.k), fondo = n?.querySelector(".ca-fondo-px");
      if (!fondo) continue;
      const capa = document.createElement("div");
      capa.className = "ca-cielo-vivo";
      capa.setAttribute("aria-hidden", "true");
      // Nubecitas: cada una con su altura, su tamaño y su velocidad.
      for (let i = 0; i < 4; i++) {
        const t = texNubePx(i), nube = document.createElement("i"), esc = [3, 2, 4, 3][i];
        nube.className = "ca-nubepx";
        Object.assign(nube.style, { backgroundImage: t.url, width: 52 * esc + "px", height: 16 * esc + "px", top: [345, 405, 460, 515][i] + "px", animationDuration: [150, 110, 190, 130][i] + "s", animationDelay: -azar(0, 120) + "s" });
        nube.style.setProperty("--w", c.w + "px");
        capa.append(nube);
      }
      // Estrellitas que titilan (de noche).
      for (let i = 0; i < 14; i++) {
        const e = document.createElement("i");
        e.className = "ca-titila" + (i % 4 === 0 ? " grande" : "");
        Object.assign(e.style, { left: azar(2, 98).toFixed(1) + "%", top: Math.round(azar(300, 640)) + "px", animationDelay: -azar(0, 4).toFixed(2) + "s", animationDuration: azar(2.2, 4.5).toFixed(2) + "s" });
        capa.append(e);
      }
      // Pajaritos (de día): una parvadita que cruza de vez en cuando.
      const parva = document.createElement("div");
      parva.className = "ca-parva";
      const p = texPajaro();
      for (const [x, y, d] of [[0, 0, 0], [26, -12, 0.15], [30, 14, 0.3]]) {
        const b = document.createElement("i");
        b.className = "ca-pajarito";
        Object.assign(b.style, { backgroundImage: p.url, left: x + "px", top: y + "px", animationDelay: d + "s" });
        parva.append(b);
      }
      parva.style.setProperty("--w", c.w + "px");
      parva.style.animationDelay = -azar(0, 30) + "s";
      capa.append(parva);
      fondo.after(capa);
      this.capas.set(c.k, capa);
    }
    this._fugaces();
  }
  /** Una estrella fugaz de vez en cuando (de noche, sin nubes de lluvia, en el cuarto de afuera que se ve). */
  _fugaces() {
    clearTimeout(this.t);
    this.t = setTimeout(() => { this._fugaz(); this._fugaces(); }, azar(6000, 15000));
  }
  _fugaz() {
    const j = this.j;
    if (!j.vivo || document.hidden || j.gfx === "max" || !j.mundo.classList.contains("noche") || j.climaActual() !== "sol") return;
    const capa = this.capas.get(j.cuartoActual);
    if (!capa) return;
    const f = document.createElement("i");
    f.className = "ca-fugaz";
    Object.assign(f.style, { left: azar(25, 95).toFixed(1) + "%", top: Math.round(azar(320, 520)) + "px" });
    capa.append(f);
    setTimeout(() => f.remove(), 1400);
  }
  limpiar() { clearTimeout(this.t); }
}
