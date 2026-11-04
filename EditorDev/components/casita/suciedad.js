/**
 * LA SUCIEDAD (Fase 64): las hojitas que sueltan los árboles (afuera) y las pelusitas de polvo (adentro).
 *
 *   · Cada árbol (del escenario o del catálogo) suelta una hojita cada ratito; caen meciéndose y se quedan en el
 *     piso juntándose (hasta 4 por árbol). Adentro, de vez en cuando sale una pelusita de polvo.
 *   · Dónde cae cada una sale de una semilla (el árbol y su número): así los dos teléfonos ven lo mismo sin mandar
 *     nada. Lo único que se guarda es cuándo se barrió alrededor de cada árbol (`h:<id>` en el cuarto).
 *   · Se recogen con la escoba, el rastrillo, el trapeador o la aspiradora (acciones.js → limpiar).
 */
import { el } from "../ui.js";
import { cuarto, inicioDe, FONDO, frenteDe } from "./cuartos.js";
import { ESCENARIO, MEDIDAS, ES_ARBOL, hash, pisable } from "./exterior.js";

const MAX_FUENTE = 4, TOPE = 170;
const ahora = () => Math.floor(Date.now() / 1000);
const semilla = (id) => { let h = 7; for (const ch of String(id)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0; return h; };
const sinMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Suciedad {
  constructor(j) { this.j = j; this.nodos = new Map(); this.cuarto = ""; this.t = 0; }
  /** Lo que ensucia el cuarto c: sus árboles (afuera) y, adentro, el cuarto mismo (polvito). */
  fuentes(c) {
    const j = this.j, cu = cuarto(c), x0 = inicioDe(c), l = [];
    if (cu.mapa) for (const e of ESCENARIO) if (ES_ARBOL.has(e.k)) { const m = MEDIDAS[e.k]; l.push({ id: e.id, gx: x0 + e.x, y: e.y, ancho: m.w, alto: m.h, color: m.hojas, cada: 45 + (hash(e.x, e.y, 3) * 50) | 0, fase: (hash(e.x, e.y, 4) * 90) | 0 }); }
    for (const r of j.objs.values()) if (r.o.c === c && r.d.hojas && !(r.o.e?.dano >= 2)) l.push({ id: r.o.id, gx: r.gx, y: r.o.y, ancho: r.d.w * 0.8, alto: r.d.h, color: r.d.hojas, cada: 60, fase: (hash(r.o.x | 0, r.o.y | 0, 5) * 60) | 0 });
    // Adentro, el polvito sale por zonas (tres franjas del cuarto): así se limpia donde barres, no todo el cuarto.
    if (!cu.afuera) for (let z = 0; z < 3; z++) l.push({ id: "p" + z, polvo: true, zona: z, cada: 280 + z * 40, fase: z * 70, max: 2, color: "#cfc6d6" });
    return l;
  }
  /** Lo que hay tirado de una fuente ahorita. */
  _de(c, f, t) {
    const cfg = this.j.cfgCuarto(c), limpio = +cfg["h:" + f.id] || 0, max = f.max || MAX_FUENTE;
    const kAhora = Math.floor((t - f.fase) / f.cada), kLimpio = Math.floor((limpio - f.fase) / f.cada), l = [];
    for (let k = Math.max(kLimpio + 1, kAhora - max + 1); k <= kAhora; k++) { const p = this._lugar(c, f, k); if (p) l.push(p); }
    return l;
  }
  _lugar(c, f, k) {
    const s = semilla(f.id), h1 = hash(k, 1, s), h2 = hash(k, 2, s), cu = cuarto(c), x0 = inicioDe(c);
    let gx, y;
    if (f.polvo) { const ancho = (cu.w - 140) / 3; gx = x0 + 70 + (f.zona + h1) * ancho; y = FONDO + 20 + h2 * 100; }
    else { const a = h1 * Math.PI * 2, r = 0.25 + h2 * 0.75; gx = f.gx + Math.cos(a) * f.ancho * 0.5 * r; y = f.y + 6 + Math.sin(a) * 30 * r; }
    if (y < FONDO + 4 || y > frenteDe(c) - 4 || gx < x0 + 16 || gx > x0 + cu.w - 16) return null;
    if (cu.mapa && !pisable(gx - x0, y)) return null;
    return { id: f.id + ":" + k, f, gx, y, rot: (hash(k, 3, s) * 4) | 0 };
  }
  todo(c, t = ahora()) { const l = []; for (const f of this.fuentes(c)) l.push(...this._de(c, f, t)); return l.slice(-TOPE); }
  /** Dibuja lo del cuarto que se ve (lo nuevo cae desde su árbol). */
  pintar(caer = true) {
    const j = this.j, c = j.vistaCuarto;
    if (!j.mundo || !c) return;
    const cambio = c !== this.cuarto;
    if (cambio) { for (const n of this.nodos.values()) n.remove(); this.nodos.clear(); this.cuarto = c; }
    const lista = this.todo(c), vistos = new Set();
    for (const p of lista) {
      vistos.add(p.id);
      if (this.nodos.has(p.id)) continue;
      const v = j._vista(p.gx, p.y), n = el("i.ca-sucio" + (p.f.polvo ? ".polvo" : ".hoja") + ".r" + p.rot, { "aria-hidden": "true", style: { left: v.x.toFixed(1) + "px", top: p.y.toFixed(1) + "px", "--c": p.f.color, "--s3": v.s.toFixed(3), zIndex: Math.round(p.y) - 1 } });
      j.mundo.append(n);
      this.nodos.set(p.id, n);
      if (caer && !cambio && !p.f.polvo && !sinMov() && j._visible?.({ gx: p.gx, y: p.y })) this._cae(n, p);
    }
    for (const [id, n] of this.nodos) if (!vistos.has(id)) { this.nodos.delete(id); this._fuera(n); }
  }
  /** Una hojita cayendo desde la copa, meciéndose de lado a lado. */
  _cae(n, p) {
    const alto = Math.min(260, p.f.alto * (0.5 + hash(p.gx | 0, p.y | 0, 8) * 0.25)), lado = (hash(p.y | 0, p.gx | 0, 9) - 0.5) * 60;
    n.animate([
      { transform: `translate(${lado}px, ${-alto}px) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${-lado * 0.6}px, ${-alto * 0.66}px) rotate(160deg)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${lado * 0.5}px, ${-alto * 0.34}px) rotate(320deg)`, offset: 0.55 },
      { transform: `translate(${-lado * 0.2}px, ${-alto * 0.08}px) rotate(420deg)`, offset: 0.85 },
      { transform: "translate(0, 0) rotate(450deg)" },
    ], { duration: 2600 + alto * 6, easing: "ease-in-out" });
  }
  _fuera(n) {
    if (sinMov()) { n.remove(); return; }
    n.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "translateY(-10px) scale(.4)", opacity: 0 }], { duration: 360, easing: "ease-in" }).onfinish = () => n.remove();
  }
  /** Las hojitas que caen de a mentiras al sacudir un árbol (no se quedan). */
  sacudir(gx, y, alto, color, n = 4) {
    const j = this.j;
    if (sinMov()) return;
    for (let i = 0; i < n; i++) {
      const x = gx + (Math.random() - 0.5) * 120, yy = y + Math.random() * 20, v = j._vista(x, yy);
      const h = el("i.ca-sucio.hoja.r" + (i % 4), { "aria-hidden": "true", style: { left: v.x.toFixed(1) + "px", top: yy.toFixed(1) + "px", "--c": color, zIndex: Math.round(yy) } });
      j.mundo.append(h);
      this._cae(h, { gx: x, y: yy, f: { alto } });
      setTimeout(() => this._fuera(h), 2800 + i * 180);
    }
  }
  /** Barrer alrededor de (gx, y): se va lo de cada árbol que tenga algo cerquita. Devuelve cuántas se fueron. */
  limpiar(c, gx, y, radio = 90) {
    const j = this.j, t = ahora(), v = {}, idos = [];
    for (const p of this.todo(c, t)) if (Math.hypot(p.gx - gx, (p.y - y) * 1.6) <= radio) { v["h:" + p.f.id] = t; idos.push(p); }
    const k = Object.keys(v);
    for (let i = 0; i < k.length; i += 8) j.sync.op({ o: "cuarto", k: c, v: Object.fromEntries(k.slice(i, i + 8).map((x) => [x, t])) });
    if (k.length) { j.casa = j.sync.casa(); this.pintar(false); }
    return idos.length;
  }
  /** ¿Hay algo que barrer cerquita? */
  hayCerca(c, gx, y, radio = 90) { return this.todo(c).some((p) => Math.hypot(p.gx - gx, (p.y - y) * 1.6) <= radio); }
  prender() { clearInterval(this.t); this.t = setInterval(() => { if (this.j.vivo && !document.hidden) this.pintar(); }, 4000); }
  limpiarTodo() { clearInterval(this.t); for (const n of this.nodos.values()) n.remove(); this.nodos.clear(); }
}
