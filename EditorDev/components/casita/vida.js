/**
 * LA VIDA DE LOS MONITOS (Fase 67): un poquito de inteligencia para que la casita se sienta viva.
 *
 *   · Cuando tu amorcito no está conectado, su monito no se queda congelado: vive solito en tu pantalla (sin mandar
 *     nada, sólo lo ves tú). Camina por el cuarto donde se quedó, se sienta en lo que esté libre (con su pose de
 *     bulto, del lado que mire el mueble), se asoma a verte, y de noche se va a dormir si hay cama. Si te le acercas,
 *     voltea a verte, te saluda y se pone contento. En cuanto tu amorcito vuelve, su monito regresa a donde de verdad
 *     está.
 *   · Las caritas según lo que pasa: si los dos están cerquita, de vez en cuando se sonríen (y les salen corazoncitos);
 *     lo demás (sueño, hambre, aburrimiento) ya se les nota con necesidades.js.
 *   · Decide cada ~2.6 s, y nunca mientras acomodas, te lo llevas cargando o anda a medio camino.
 */
import { cuarto, inicioDe, enCuarto, FONDO, frenteDe } from "./cuartos.js";

const azar = (a, b) => a + Math.random() * (b - a);
const elige = (l) => l[Math.floor(Math.random() * l.length)];

export class Vida {
  constructor(j) { this.j = j; this.t = 0; this.activo = false; this.hasta = 0; this.saludo = 0; this.sonrisa = 0; }
  prender() { clearInterval(this.t); this.t = setInterval(() => this._tic(), 2600); }
  apagar() { clearInterval(this.t); this._parar(); }
  _parar() {
    if (!this.activo) return;
    this.activo = false;
    const m = this.j.suyo;
    if (!m) return;
    m.n.classList.remove("vida");
    // (Para que en cuanto llegue lo que de verdad está haciendo, se ponga ahí.)
    m.t = null;
  }
  _tic() {
    const j = this.j, m = j.suyo, yo = j.yo;
    if (!j.vivo || document.hidden || !m || !yo || j.editando || j._parejaAqui === undefined) return;
    this._caritas(m, yo);
    if (j._parejaAqui) { this._parar(); return; }
    if (!this.activo) { this.activo = true; m.n.classList.add("vida"); this.hasta = performance.now() + 2000; }
    if (m.n.classList.contains("camina") || m.n.classList.contains("cargado") || m._enRuta) return;
    const ahora = performance.now(), c = enCuarto(m.gx).c, mismo = enCuarto(yo.gx).c === c, d = Math.hypot(yo.gx - m.gx, (yo.y - m.y) * 1.6);
    // Si te le acercas: voltea, te saluda y se pone contento (no a cada ratito).
    if (mismo && d < 190 && ahora - this.saludo > 45000 && !m.mueble) {
      this.saludo = ahora;
      j._mirar(m, yo.gx < m.gx ? -1 : 1);
      j.gesto(m, "saluda", false);
      this._contento(m, 1800);
      j.particulas?.("corazon", { gx: m.gx, y: m.y - 150 }, 0, 0, 3);
      this.hasta = ahora + 6000;
      return;
    }
    if (ahora < this.hasta) return;
    const noche = j.esNoche(), cu = cuarto(c);
    // Lo que puede hacer en este cuarto: dormir (de noche, si hay cama), sentarse en algo libre, caminar, o verte.
    const lugares = [];
    for (const r of j.objs.values()) {
      if (r.o.c !== c || !r.d.lugares) continue;
      r.d.lugares.forEach((l, jx) => { const id = `${r.o.id}:${jx}`; if (!j.ocupado(yo, id) && ["sentado", "dormido", "columpio"].includes(l.pose)) lugares.push({ r, jx, l }); });
    }
    const camas = lugares.filter((x) => x.l.pose === "dormido"), asientos = lugares.filter((x) => x.l.pose !== "dormido");
    if (noche && camas.length && Math.random() < 0.7) {
      const x = elige(camas);
      if (m.mueble !== `${x.r.o.id}:${x.jx}`) j._irLugar(m, x.r, x.jx);
      this.hasta = ahora + azar(60000, 120000);
      return;
    }
    const p = Math.random();
    if (asientos.length && p < 0.38 && !m.mueble) {
      const x = elige(asientos);
      j._irLugar(m, x.r, x.jx);
      this.hasta = ahora + azar(14000, 30000);
    } else if (p < 0.82) {
      // A caminar un poquito por el cuarto (en el patio, por lo de cerca).
      const x0 = inicioDe(c);
      let gx, y;
      if (cu.mapa) { gx = m.gx + azar(-320, 320); y = m.y + azar(-160, 160); }
      else { gx = azar(x0 + 90, x0 + cu.w - 90); y = azar(FONDO + 24, frenteDe(c) - 30); }
      gx = Math.max(x0 + 40, Math.min(x0 + cu.w - 40, gx)); y = Math.max(FONDO + 10, Math.min(frenteDe(c) - 10, y));
      const [lx, ly] = j.nav.libre(c, gx, y);
      j._caminar(m, lx, ly, () => { if (mismo && Math.random() < 0.5) j._mirar(m, yo.gx < m.gx ? -1 : 1); });
      this.hasta = ahora + azar(7000, 16000);
    } else {
      // Se queda viéndote (o mirando alrededor).
      if (mismo) j._mirar(m, yo.gx < m.gx ? -1 : 1); else j._mirar(m, Math.random() < 0.5 ? -1 : 1);
      this.hasta = ahora + azar(5000, 9000);
    }
  }
  /** Cerquita los dos: de vez en cuando se sonríen. */
  _caritas(m, yo) {
    const ahora = performance.now();
    if (ahora - this.sonrisa < 9000 || Math.random() > 0.35) return;
    if (enCuarto(yo.gx).c !== enCuarto(m.gx).c || Math.hypot(yo.gx - m.gx, (yo.y - m.y) * 1.6) > 150) return;
    this.sonrisa = ahora;
    for (const x of [m, yo]) if (!x.n.classList.contains("camina")) this._contento(x, 1600);
    this.j.particulas?.("corazon", { gx: (m.gx + yo.gx) / 2, y: Math.min(m.y, yo.y) - 150 }, 0, 0, 2);
  }
  _contento(m, ms) { m.n.classList.add("contento"); clearTimeout(m._tCont); m._tCont = setTimeout(() => m.n.classList.remove("contento"), ms); }
}
