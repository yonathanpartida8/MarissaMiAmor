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
  /** Un brinco en un charco: muchas salpicaduras y ondas (lo llama el juego). Todo en coordenadas del mundo. */
  chapoteo(gx, y) {
    for (let i = 0; i < 18; i++) this.salpicas.push({ x: gx + azar(-14, 14), y, vx: azar(-160, 160), vy: azar(-320, -140), v: azar(0.4, 0.75) });
    this.ondas.push({ x: gx, y, r: 2, max: 46 }, { x: gx, y, r: -10, max: 60 });
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
    const d = Math.min(2, window.devicePixelRatio || 1), w = this.cv.clientWidth, h = this.cv.clientHeight;
    if (!w || !h) return;
    if (this.cv.width !== Math.round(w * d) || this.cv.height !== Math.round(h * d)) { this.cv.width = Math.round(w * d); this.cv.height = Math.round(h * d); }
    // (Fase 59) Las gotas viven en el MUNDO: al deslizar la vista no te siguen, se quedan cayendo en su lugar.
    const k = j.k, sx = j.vistaN.scrollLeft, oy = j.offY - (j._subir || 0), W = this.cv.width, Hc = this.cv.height;
    const X = (x) => (x * k - sx) * d, Y = (y) => (oy + y * k) * d;
    const vx0 = sx / k - 60, vx1 = (sx + w) / k + 60, arriba = -oy / k - 20;
    // Lo de afuera que se ve (más un poquito de cada lado).
    const rangos = CUARTOS.filter((c) => c.afuera).map((c) => ({ a: Math.max(inicioDe(c.k), vx0), b: Math.min(inicioDe(c.k) + c.w, vx1) })).filter((r) => r.b > r.a);
    const ancho = rangos.reduce((s, r) => s + r.b - r.a, 0);
    const meta = llueve ? Math.round((GOTAS[gfx] || 0) * (MAS[cl] || 1) * ancho / Math.max(1, w / k)) : 0;
    const viento = VIENTO[cl] || 30;
    const nueva = (g, todo) => {
      let u = Math.random() * ancho, r = rangos[0];
      for (const x of rangos) { if (u <= x.b - x.a) { r = x; break; } u -= x.b - x.a; }
      if (!r) return null;
      const suelo = azar(FONDO, H - 4);
      // (Del lado de donde viene el viento salen un poquito antes, para que no quede una orilla sin lluvia.)
      Object.assign(g, { x: azar(r.a, r.b) - viento * (todo ? 0 : 0.7), y: todo ? azar(arriba, suelo) : arriba - azar(0, 80), vx: viento * azar(0.85, 1.15), vy: azar(500, 700), suelo, a: r.a, b: r.b });
      return g;
    };
    while (this.gotas.length < meta) { const g = nueva({}, true); if (!g) break; this.gotas.push(g); }
    if (this.gotas.length > meta) this.gotas.length = meta;
    const c = this.c;
    c.clearRect(0, 0, W, Hc); this.limpio = false;
    // Las gotas: caen con gravedad hasta su velocidad final y se rompen al tocar el piso.
    const px = Math.max(1, Math.round(3 * k * d));
    c.fillStyle = "rgba(214, 230, 255, .78)";
    for (const g of this.gotas) {
      g.vy = Math.min(900, g.vy + 1600 * dt); g.x += g.vx * dt; g.y += g.vy * dt;
      // Si la vista se movió y esta gota quedó fuera, se vuelve a poner dentro (a cualquier altura: sin huecos).
      if (g.x < vx0 - 80 || g.x > vx1 + 80 || g.x > g.b + 40) { nueva(g, true); continue; }
      if (g.y >= g.suelo) {
        if (g.x > g.a && g.x < g.b) {
          for (let i = 0; i < 2; i++) this.salpicas.push({ x: g.x, y: g.suelo, vx: azar(-70, 70), vy: azar(-170, -70), v: azar(0.18, 0.32) });
          if (charcoEn(g.x, g.suelo, 0)) this.ondas.push({ x: g.x, y: g.suelo, r: 1, max: azar(10, 20) });
        }
        nueva(g, false);
        continue;
      }
      if (g.x < g.a) continue;   // (aún no entra a lo de afuera)
      const inc = g.vx / Math.max(1, g.vy), gx = X(g.x), gy = Y(g.y);
      for (let i = 0; i < 3; i++) c.fillRect(Math.round(gx - inc * px * i), Math.round(gy - px * i), px, px);
    }
    // Salpicaduras (con gravedad).
    c.fillStyle = "rgba(230, 240, 255, .9)";
    for (let i = this.salpicas.length - 1; i >= 0; i--) {
      const p = this.salpicas[i];
      p.v -= dt; p.vy += 1120 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.v <= 0) { this.salpicas.splice(i, 1); continue; }
      c.fillRect(Math.round(X(p.x)), Math.round(Y(p.y)), px, px);
    }
    // Ondas en los charcos.
    c.strokeStyle = "rgba(235, 245, 255, .75)"; c.lineWidth = Math.max(1, px * 0.6);
    for (let i = this.ondas.length - 1; i >= 0; i--) {
      const o = this.ondas[i];
      o.r += 60 * dt;
      if (o.r >= o.max) { this.ondas.splice(i, 1); continue; }
      if (o.r <= 0) continue;
      c.globalAlpha = 1 - o.r / o.max;
      c.beginPath(); c.ellipse(X(o.x), Y(o.y), o.r * k * d, o.r * k * d * 0.3, 0, 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1;
    if (this.salpicas.length > 400) this.salpicas.splice(0, this.salpicas.length - 400);
  }
}

/** El charco (del mundo) que quedó bajo un punto del mundo, o null. */
export function charcoEn(gx, y, holgura = 1) {
  for (const c of CUARTOS) {
    if (!c.afuera) continue;
    for (const [fx, wy, rx, ry] of CHARCOS) {
      const cx = inicioDe(c.k) + fx * c.w;
      if (((gx - cx) / (rx + 8 * holgura)) ** 2 + ((y - wy) / (ry * (holgura ? 1 : 1.6) + 10 * holgura)) ** 2 <= 1) return { gx: cx, y: wy };
    }
  }
  return null;
}
