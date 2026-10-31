/**
 * LA LLUVIA DE VERDAD (Fase 58): gotitas pixel que caen con el viento sobre TODO lo de afuera, con física
 * (gravedad hasta su velocidad final, viento según el clima), que al tocar el piso se rompen en salpicaduras
 * y que en los charquitos hacen ondas. Es un lienzo encima de la vista: sólo trabaja si llueve y se ve algo de
 * afuera; cuántas gotas y cuántos cuadros por segundo, según el perfil de gráficos (en Máximo rendimiento se
 * queda la lluvia sencilla de CSS).
 */
import { CUARTOS, inicioDe, FONDO, H } from "./cuartos.js";
import { CHARCOS } from "./texturas.js";

const GOTAS = { rend: 50, equi: 110, cal: 170, ultra: 240 };
const FPS = { rend: 30, equi: 30, cal: 60, ultra: 60 };
const VIENTO = { lluvia: 30, tormenta: 110, extra: 260 };
const MAS = { lluvia: 1, tormenta: 1.35, extra: 1.7 };
const azar = (a, b) => a + Math.random() * (b - a);

export class LluviaFisica {
  constructor(j) {
    this.j = j;
    this.cv = document.createElement("canvas");
    this.cv.className = "ca-lluvia-cv";
    this.cv.setAttribute("aria-hidden", "true");
    this.c = this.cv.getContext("2d");
    this.gotas = []; this.salpicas = []; this.ondas = [];
    this.rq = 0; this.ult = 0; this.limpio = true;
  }
  /** ¿Debe estar prendida? (llueve, el perfil la permite y la casita está viva). */
  prender() { if (!this.rq) { this.ult = 0; this.rq = requestAnimationFrame((t) => this._cuadro(t)); } }
  apagar() { cancelAnimationFrame(this.rq); this.rq = 0; this._limpiar(); this.gotas.length = 0; this.salpicas.length = 0; this.ondas.length = 0; }
  destruir() { this.apagar(); this.cv.remove(); }
  _limpiar() { if (!this.limpio) { this.c.clearRect(0, 0, this.cv.width, this.cv.height); this.limpio = true; } }
  /** Un brinco en un charco: muchas salpicaduras y ondas (lo llama el juego). */
  chapoteo(gx, y) {
    const j = this.j, k = j.k, d = this.dpr || 1;
    const x = (gx * k - j.vistaN.scrollLeft) * d, yy = (j.offY - (j._subir || 0) + y * k) * d;
    for (let i = 0; i < 18; i++) this.salpicas.push({ x: x + azar(-14, 14) * k * d, y: yy, vx: azar(-160, 160) * k * d, vy: azar(-320, -140) * k * d, v: azar(0.4, 0.75) });
    this.ondas.push({ x, y: yy, r: 2, max: 46 * k * d }, { x, y: yy, r: -10 * k * d, max: 60 * k * d });
    this.prender();
  }
  _cuadro(t) {
    this.rq = 0;
    const j = this.j;
    if (!j.vivo || document.hidden) return this._limpiar();
    const gfx = j.gfx, cl = j.climaActual(), llueve = cl !== "sol" && GOTAS[gfx];
    if (!llueve && !this.salpicas.length && !this.ondas.length) return this._limpiar();
    this.rq = requestAnimationFrame((x) => this._cuadro(x));
    const paso = 1000 / (FPS[gfx] || 30) - 2;
    if (this.ult && t - this.ult < paso) return;
    const dt = this.ult ? Math.min(0.06, (t - this.ult) / 1000) : 0.016;
    this.ult = t;
    // Tamaño del lienzo (con la densidad de la pantalla, sin pasarse de 2×).
    const d = (this.dpr = Math.min(2, window.devicePixelRatio || 1)), w = this.cv.clientWidth, h = this.cv.clientHeight;
    if (!w || !h) return;
    if (this.cv.width !== Math.round(w * d) || this.cv.height !== Math.round(h * d)) { this.cv.width = Math.round(w * d); this.cv.height = Math.round(h * d); }
    const k = j.k, sx = j.vistaN.scrollLeft, oy = j.offY - (j._subir || 0), W = this.cv.width, Hc = this.cv.height;
    const px = Math.max(1, Math.round(3 * k * d));
    // Lo de afuera que se ve (en la pantalla).
    const rangos = CUARTOS.filter((c) => c.afuera).map((c) => ({ c, a: (inicioDe(c.k) * k - sx) * d, b: ((inicioDe(c.k) + c.w) * k - sx) * d })).filter((r) => r.b > 0 && r.a < W);
    const ancho = rangos.reduce((s, r) => s + Math.min(W, r.b) - Math.max(0, r.a), 0);
    const meta = llueve ? Math.round((GOTAS[gfx] || 0) * (MAS[cl] || 1) * (ancho / Math.max(1, W))) : 0;
    const viento = (VIENTO[cl] || 30) * k * d, sueloA = (oy + FONDO * k) * d, sueloB = (oy + H * k) * d;
    const nueva = (g = {}) => {
      if (!rangos.length) return null;
      const r = rangos[Math.floor(Math.random() * rangos.length)], a = Math.max(0, r.a), b = Math.min(W, r.b);
      Object.assign(g, { x: azar(a - viento * 0.3, b), y: azar(-Hc * 0.25, 0), vx: viento * azar(0.85, 1.15), vy: azar(500, 700) * k * d, suelo: azar(sueloA, sueloB), a, b });
      return g;
    };
    while (this.gotas.length < meta) { const g = nueva(); if (!g) break; g.y = azar(-Hc * 0.25, Hc); this.gotas.push(g); }
    if (this.gotas.length > meta) this.gotas.length = meta;
    const c = this.c;
    c.clearRect(0, 0, W, Hc); this.limpio = false;
    // Las gotas: caen con gravedad hasta su velocidad final y se rompen al tocar el piso.
    c.fillStyle = "rgba(214, 230, 255, .78)";
    const vmax = 900 * k * d, g9 = 1600 * k * d;
    for (const g of this.gotas) {
      g.vy = Math.min(vmax, g.vy + g9 * dt); g.x += g.vx * dt; g.y += g.vy * dt;
      if (g.y >= g.suelo) {
        if (g.x > g.a && g.x < g.b) {
          for (let i = 0; i < 2; i++) this.salpicas.push({ x: g.x, y: g.suelo, vx: azar(-70, 70) * k * d, vy: azar(-170, -70) * k * d, v: azar(0.18, 0.32) });
          // ¿Cayó en un charco? Una ondita.
          if (this._enCharco(g.x, g.suelo, k, sx, oy, d)) this.ondas.push({ x: g.x, y: g.suelo, r: 1, max: azar(10, 20) * k * d });
        }
        nueva(g);
        continue;
      }
      if (g.x < g.a - 40 || g.x > g.b + 40) { nueva(g); continue; }
      const inc = g.vx / Math.max(1, g.vy);
      for (let i = 0; i < 3; i++) c.fillRect(Math.round(g.x - inc * px * i), Math.round(g.y - px * i), px, px);
    }
    // Salpicaduras (con gravedad).
    c.fillStyle = "rgba(230, 240, 255, .9)";
    for (let i = this.salpicas.length - 1; i >= 0; i--) {
      const p = this.salpicas[i];
      p.v -= dt; p.vy += g9 * 0.7 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.v <= 0) { this.salpicas.splice(i, 1); continue; }
      c.fillRect(Math.round(p.x), Math.round(p.y), px, px);
    }
    // Ondas en los charcos.
    c.strokeStyle = "rgba(235, 245, 255, .75)"; c.lineWidth = Math.max(1, px * 0.6);
    for (let i = this.ondas.length - 1; i >= 0; i--) {
      const o = this.ondas[i];
      o.r += 60 * k * d * dt;
      if (o.r >= o.max) { this.ondas.splice(i, 1); continue; }
      if (o.r <= 0) continue;
      c.globalAlpha = 1 - o.r / o.max;
      c.beginPath(); c.ellipse(o.x, o.y, o.r, o.r * 0.3, 0, 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1;
    if (this.salpicas.length > 400) this.salpicas.splice(0, this.salpicas.length - 400);
  }
  _enCharco(x, y, k, sx, oy, d) {
    for (const c of CUARTOS) {
      if (!c.afuera) continue;
      for (const [fx, wy, rx, ry] of CHARCOS) {
        const cx = ((inicioDe(c.k) + fx * c.w) * k - sx) * d, cy = (oy + wy * k) * d;
        if (((x - cx) / (rx * k * d)) ** 2 + ((y - cy) / (ry * k * d * 1.6)) ** 2 <= 1) return true;
      }
    }
    return false;
  }
}

/** El charco (del mundo) que quedó bajo un punto del mundo, o null. */
export function charcoEn(gx, y) {
  for (const c of CUARTOS) {
    if (!c.afuera) continue;
    for (const [fx, wy, rx, ry] of CHARCOS) {
      const cx = inicioDe(c.k) + fx * c.w;
      if (((gx - cx) / (rx + 8)) ** 2 + ((y - wy) / (ry + 10)) ** 2 <= 1) return { gx: cx, y: wy };
    }
  }
  return null;
}
