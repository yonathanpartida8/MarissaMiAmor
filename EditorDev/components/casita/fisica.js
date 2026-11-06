/**
 * LA FÍSICA DE LAS COSAS (Fase 68): que lo que pasa tenga consecuencias (y se pueda arreglar).
 *
 *   · Lo de vidrio (vasos, copas, jarrones, frascos) y la talavera se rompen si se caen: quedan pedacitos en el
 *     piso (y un charquito si traían agua o jugo). Los pedacitos se barren con la escoba (o se aspiran) y el
 *     charquito se seca solito en unos minutos. Si tu monito pisa cerca de los vidrios, te avisa.
 *   · Al caminar, lo chiquito que hay en el piso por donde pasa se patea y rueda un poquito; si va trotando, lo
 *     frágil se rompe y lo alto se cae de lado.
 *   · Si tu monito se avienta corriendo contra la pared (tocas la pared desde lejos): ¡pum! Se cimbra el cuarto, lo
 *     colgado se chuequea (y si ya estaba chueco, se cae), lo que está encima de los muebles cerquita se tambalea y
 *     a veces se cae, y lo que se vuelca (sillas, lámparas, el perchero) se va de lado.
 *   · Lo que se cayó se levanta: lo tocas y tu monito va, se agacha y lo pone donde estaba (lo colgado, otra vez
 *     derechito en su lugar).
 *   · Todo lo decide el teléfono de quien lo hizo y se guarda en la casa: tu amorcito ve lo mismo.
 */
import { cuarto, inicioDe, enCuarto, FONDO, frenteDe } from "./cuartos.js";
import { vibrar } from "../../integraciones/plataforma.js";

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const azar = (a, b) => a + Math.random() * (b - a);
const elige = (l) => l[Math.floor(Math.random() * l.length)];
const sinMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const copia = (o) => JSON.parse(JSON.stringify(o));
/** Lo chiquito y ligero que se patea al pasar. */
const ligero = (d) => d.capa === "piso" && !d.mascota && !d.larga && d.w <= 90 && (d.portatil || d.h <= 70);

export class Fisica {
  constructor(j) { this.j = j; this.patadas = new Map(); this.avisos = new Set(); }
  apagar() { for (const t of this.patadas.values()) clearTimeout(t); this.patadas.clear(); }

  /** ¿Se rompe si cae de esta altura? (jugando, cualquier caidita; acomodando, sólo de alto) */
  seRompe(d, cayo, jugando = true) {
    if (!d.fragil) return false;
    const tope = d.fragil === "vidrio" ? (jugando ? 26 : 120) : (jugando ? 50 : 170);
    return cayo > tope;
  }
  /** Se hace pedacitos: los vidrios (y su charquito) se quedan en el piso hasta que los barran. */
  romper(r, gx = r.gx, y = r.o.y) {
    const j = this.j, d = r.d, c = r.o.c;
    if (!j.objs.has(r.o.id)) return;
    const yy = lim(y, FONDO + 6, frenteDe(c) - 6), xx = lim(gx, inicioDe(c) + 20, inicioDe(c) + cuarto(c).w - 20);
    j.sync.op({ o: "quita", id: r.o.id });
    j._pintarCasa(j.sync.casa());
    j.suciedad?.dejar(c, d.fragil || "vidrio", xx, yy);
    if (d.derrame) j.suciedad?.dejar(c, "charco-" + d.derrame, xx + 12, yy + 6);
    j.sonar("vidrio");
    vibrar([16, 24, 12]);
    j.particulas("chispa", { gx: xx, y: yy - 8 }, 0, 0, 6);
    if (d.derrame) j.particulas("agua", { gx: xx, y: yy - 4 }, 0, 0, 4);
    j._mandarYo({ ev: { k: "rompe", x: Math.round(xx - inicioDe(c)), y: Math.round(yy) } });
    const yo = j.yo;
    if (enCuarto(yo.gx).c === c && !yo.mueble && Math.hypot(yo.gx - xx, (yo.y - yy) * 1.6) < 420) {
      j._mirar(yo, xx < yo.gx ? -1 : 1);
      j.gesto(yo, "sorpresa", false);
      j._globo(yo, elige(["¡Ay, se rompió!", "¡Upsi! Hay que barrer los vidrios", "¡Cuidado, hay vidrios!"]), 2400);
    }
  }

  /** (Al caminar) Lo chiquito del piso por donde va a pasar tu monito: se patea cuando llega a él. */
  tramo(m, x0, y0, x1, y1, s, corre) {
    const j = this.j;
    if (m !== j.yo || j.editando || s <= 0.15) return;
    const c = enCuarto(x0).c, dx = x1 - x0, dy = (y1 - y0) * 1.6, L = Math.hypot(dx, dy);
    if (L < 10) return;
    for (const r of j.objs.values()) {
      if (r.o.c !== c || !ligero(r.d) || r.o.id === j.arrastrandoId || j._esEncima(r)) continue;
      const px = r.gx - x0, py = (r.o.y - y0) * 1.6, u = (px * dx + py * dy) / (L * L);
      if (u <= 0.04 || u > 1.04) continue;
      if (Math.abs(px * dy - py * dx) / L > Math.max(14, r.d.w * 0.42)) continue;
      clearTimeout(this.patadas.get(r.o.id));
      this.patadas.set(r.o.id, setTimeout(() => { this.patadas.delete(r.o.id); this.patear(r.o.id, dx / L, dy / L / 1.6, corre); }, Math.max(0, u * s * 1000 - 50)));
    }
  }
  patear(id, ux, uy, corre) {
    const j = this.j, r = j.objs.get(id);
    if (!r || !j.vivo || j.editando) return;
    if (corre && r.d.fragil) { this.romper(r, r.gx + ux * 22, r.o.y + uy * 22); return; }
    const c = r.o.c, x0 = inicioDe(c), cu = cuarto(c), dist = corre ? 58 : 30;
    let gx = lim(r.gx + ux * dist, x0 + 24, x0 + cu.w - 24), y = lim(r.o.y + uy * dist, FONDO + 8, frenteDe(c) - 8);
    if (cu.mapa) [gx, y] = j.nav.libre(c, gx, y);
    const e = { ...(r.o.e || {}) };
    // Trotando, lo alto (un jarrón, una lámpara) se cae de lado.
    if (corre && r.d.h > r.d.w * 1.25 && !e.pose) { e.pose = "suelo"; e.ang = ux >= 0 ? 90 : -90; }
    if (!sinMov()) { r.n.style.transition = "left .38s cubic-bezier(.2,.7,.3,1), top .38s cubic-bezier(.2,.7,.3,1)"; setTimeout(() => { if (r.n) r.n.style.transition = ""; }, 460); }
    j.sync.op({ o: "pon", obj: { ...copia(r.o), x: Math.round(gx - x0), y: Math.round(y), e } });
    j._pintarCasa(j.sync.casa());
    const rn = j.objs.get(id);
    if (rn && e.pose === "suelo") j._volcar(rn);
    j.sonar("tok", { volumen: 0.6 });
    j.particulas("polvo", { gx, y }, 0, 0, 2);
  }

  /** Al llegar: si corría hacia la pared, ¡pum!; si hay vidrios cerquita, te avisa. */
  llegar(m, embiste) {
    const j = this.j, c = enCuarto(m.gx).c;
    if (embiste && !cuarto(c).afuera && !m.mueble) return this.chocar(m);
    if (m !== j.yo) return;
    const v = j.suciedad?.vidriosCerca(c, m.gx, m.y, 46);
    if (v && !this.avisos.has(v.id)) {
      this.avisos.add(v.id);
      j.gesto(m, "sorpresa", false);
      j.sonar("auch", { volumen: 0.7 });
      j._globo(m, "¡Auch! Hay vidrios: tráete la escoba", 2600);
    }
  }
  /** ¡Pum! contra la pared. */
  chocar(m) {
    const j = this.j, c = enCuarto(m.gx).c;
    j.sonar("pum");
    if (m === j.yo) vibrar(34);
    m.n.classList.remove("choca"); void m.n.offsetWidth; m.n.classList.add("choca");
    setTimeout(() => m.n.classList.remove("choca"), 950);
    j.particulas("chispa", { gx: m.gx, y: m.y - 120 }, 0, 0, 4);
    if (!sinMov()) j.mundo.animate([{ translate: "0 0" }, { translate: "4px 0" }, { translate: "-4px 1px" }, { translate: "2px 0" }, { translate: "0 0" }], { duration: 300, easing: "ease-out", composite: "add" });
    if (m !== j.yo) return;
    j._globo(m, elige(["¡Auch!", "¡Ay, la pared!", "Uy, qué golpazo"]), 1800);
    j._mandarYo({ ev: { k: "choca" } });
    const bx = m.gx;
    for (const r of [...j.objs.values()]) {
      if (r.o.c !== c || r.d.mascota || r.o.id === j.arrastrandoId) continue;
      const dx = Math.abs(r.gx - bx), e = r.o.e || {};
      // Lo colgado se chuequea; si ya estaba muy chueco, se cae.
      if (r.d.capa === "pared" && !e.tirado && dx < 220) {
        const ch = +e.chueco || 0, nuevo = Math.round(ch + (Math.random() < 0.5 ? -1 : 1) * azar(3, 8));
        this._tiembla(r);
        if (Math.abs(ch) >= 7 && Math.random() < 0.65) this._descolgar(r);
        else j.estado(r.o, { chueco: lim(nuevo, -14, 14) });
        continue;
      }
      // Lo que está encima de un mueble pegado a la pared se tambalea y a veces se cae.
      const sop = r.d.capa === "piso" && j._esEncima(r) ? j._encima(r.gx, r.o.y, r.o.id)?.r : null;
      if (sop && dx < 240 && sop.o.y < FONDO + 110) {
        this._tiembla(r);
        if (Math.random() < 0.42) setTimeout(() => this._tirarDe(r.o.id, sop), azar(120, 520));
        continue;
      }
      // Lo que se vuelca (sillas, lámparas, el perchero) se va de lado.
      if (r.d.volcable && !e.pose && dx < 160 && r.o.y < FONDO + 90 && Math.random() < 0.6) setTimeout(() => this._tumbar(r.o.id, r.gx >= bx ? 1 : -1), azar(80, 300));
    }
  }
  _tiembla(r) {
    if (sinMov()) return;
    r.n.querySelector(":scope > .ca-obj-arte")?.animate([{ rotate: "0deg" }, { rotate: "-4deg" }, { rotate: "3deg" }, { rotate: "-2deg" }, { rotate: "0deg" }], { duration: 520, easing: "ease-out", composite: "add" });
  }
  /** Se cae de encima del mueble al piso de enfrente (y si es frágil, se rompe). */
  _tirarDe(id, sop) {
    const j = this.j, r = j.objs.get(id);
    if (!r || !j.vivo) return;
    const c = r.o.c, x0 = inicioDe(c), y = lim(sop.o.y + azar(12, 26), FONDO + 8, frenteDe(c) - 8), gx = lim(r.gx + azar(-22, 22), x0 + 20, x0 + cuarto(c).w - 20);
    const cayo = y - r.o.y;
    if (this.seRompe(r.d, cayo, true)) {
      j.sync.op({ o: "pon", obj: { ...copia(r.o), x: Math.round(gx - x0), y: Math.round(y) } });
      j._pintarCasa(j.sync.casa());
      const rn = j.objs.get(id);
      if (rn) j._caer(rn, cayo, 0, () => this.romper(j.objs.get(id) || rn, gx, y));
      return;
    }
    const e = { ...(r.o.e || {}), de: `${Math.round(r.o.x)}|${Math.round(r.o.y)}` };
    if (r.d.h > r.d.w * 1.2) { e.pose = "suelo"; e.ang = Math.random() < 0.5 ? 90 : -90; }
    j.sync.op({ o: "pon", obj: { ...copia(r.o), x: Math.round(gx - x0), y: Math.round(y), e } });
    j._pintarCasa(j.sync.casa());
    const rn = j.objs.get(id);
    if (rn) { j._caer(rn, cayo, 0); if (e.pose) setTimeout(() => j.vivo && j._volcar(rn), 260); }
    j.sonar("soltar", { volumen: 0.7 });
  }
  /** Se va de lado (y se queda así hasta que lo levanten). */
  _tumbar(id, lado) {
    const j = this.j, r = j.objs.get(id);
    if (!r || !j.vivo || r.o.e?.pose) return;
    j.sync.op({ o: "pon", obj: { ...copia(r.o), e: { ...(r.o.e || {}), pose: "suelo", ang: lado < 0 ? -90 : 90 } } });
    j._pintarCasa(j.sync.casa());
    const rn = j.objs.get(id);
    if (rn) j._volcar(rn);
    setTimeout(() => j.vivo && j.sonar("soltar", { volumen: 0.8 }), 420);
  }
  /** Lo colgado se cae al piso (y si es frágil, se rompe). */
  _descolgar(r) {
    const j = this.j, c = r.o.c, x0 = inicioDe(c), y = FONDO + 12, cayo = y - r.o.y;
    if (r.d.fragil) { this.romper(r, r.gx, y); return; }
    j.sync.op({ o: "pon", obj: { ...copia(r.o), y, e: { ...(r.o.e || {}), tirado: true, chueco: 0, de: `${Math.round(r.o.x)}|${Math.round(r.o.y)}` } } });
    j._pintarCasa(j.sync.casa());
    const rn = j.objs.get(r.o.id);
    if (rn) j._caer(rn, cayo, 0);
    setTimeout(() => j.vivo && j.sonar("soltar", { volumen: 0.8 }), 300);
    void x0;
  }

  /** ¿Se cayó (o se chueó) y se puede levantar? */
  levantable(r) {
    const e = r.o.e || {};
    if (r.d.larga) return false;
    return e.pose === "suelo" || !!e.de || (r.d.capa === "pared" && Math.abs(+e.chueco || 0) >= 2);
  }
  /** Tu monito va, se agacha y lo pone donde estaba (lo colgado, derechito en su lugar). */
  async levantar(r) {
    const j = this.j, id = r.o.id, m = j.yo;
    if (!(await j.irJunto({ id }))) return;
    const q = j.objs.get(id);
    if (!q || !j.vivo) return;
    const orden = m.orden;
    m.n.classList.add("recoge");
    j.sonar("levantar");
    await j.esperar(620);
    m.n.classList.remove("recoge");
    if (m.orden !== orden || !j.objs.has(id)) return;
    const e = { ...(q.o.e || {}) }, de = String(e.de || "");
    for (const k of ["pose", "ang", "de", "tirado", "chueco"]) delete e[k];
    let x = q.o.x, y = q.o.y;
    if (de) { const [a, b] = de.split("|").map(Number); if (Number.isFinite(a) && Number.isFinite(b)) { x = a; y = b; } }
    j.sync.op({ o: "pon", obj: { ...copia(q.o), x, y, e } });
    j._pintarCasa(j.sync.casa());
    const rn = j.objs.get(id);
    if (rn) j.particulas("brillo", { gx: rn.gx, y: rn.o.y - rn.d.h / 2 }, 0, 0, 5);
    j._globo(m, elige(["Listo, en su lugar", "Ya quedó derechito", "Como nuevo"]), 1800);
    j.necesidades?.sumar("diversion", 1);
  }
}
