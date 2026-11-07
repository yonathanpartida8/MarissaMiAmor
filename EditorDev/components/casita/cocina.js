/**
 * LA COCINA DE VERDAD (Fase 73).
 *
 *   · Cada platillo tarda lo suyo (entre 12 segundos y 1 minuto, nunca más): unos huevitos son rápidos, el pozole
 *     y la pizza tardan más, y cada vez varía un poquito.
 *   · Lo que se cocina vive en el estado de la estufa (receta, cuánto dura, cuánto lleva y si va al doble), así que
 *     SIGUE COCINÁNDOSE SOLO aunque tu monito se vaya a hacer otra cosa (o cierres el juego), y tu amorcito ve lo
 *     mismo en su teléfono.
 *   · Si tu monito (o el de tu amorcito) se queda junto a la estufa, va AL DOBLE: la pastillita de arriba lo dice
 *     («x2», rosita y con sus rayitas corriendo), el fuego crece, sale más vapor y el chisporroteo suena más seguido.
 *   · Al terminar, el platillo se queda listo en la estufa: si estás junto lo tomas solito; si no, tocas la estufa
 *     y tu monito va por él.
 *   · Los efectos son pixel art de verdad, en un lienzo chiquito (cuadritos de 4) que sólo se anima mientras se ve:
 *     la llama de gas (base azul, lenguas que lamen los lados del sartén), humo y vapor que suben con tamaños,
 *     velocidades y direcciones distintas (y se deshacen en tramado), chispitas, burbujas en la olla, chisporroteo
 *     en el sartén, ondas de calor y, ya listo, su vaporcito y unos brillitos.
 */
import { el } from "../ui.js";
import { RECETAS, arteReceta } from "./catalogo/index.js";
import { enCuarto } from "./cuartos.js";

/** Cuánto tarda cada cosa (segundos, a velocidad normal). Nunca más de un minuto. */
const BASE = { sarten: 26, olla: 38, horno: 52, parrilla: 34, micro: 18, licuadora: 12 };
const AJUSTE = { huevos: 0.85, quesadillas: 0.9, hotcakes: 1, sopa: 0.95, pasta: 1.05, ramen: 1, pozole: 1.14, chocolate: 0.72, pizza: 1.1, pastel: 1.12, galletas: 0.9, elote: 0.85, hamburguesa: 1, brochetas: 1.05, palomitas: 1, licuado: 1, tacos: 0.95, papas: 0.8, donas: 1.1, sushi: 0.9, pollo: 1.12, cuernitos: 1, hotdog: 0.75 };
export const MAX_S = 60, MIN_S = 10;
export const segundosDe = (rc) => Math.max(MIN_S, Math.min(MAX_S, Math.round((BASE[rc.en] || 30) * (AJUSTE[rc.k] || 1))));
const ahora = () => Date.now() / 1000;
const r1 = (v) => Math.round(v * 10) / 10;
/** Cuánto lleva (0 a 1): lo guardado más lo que ha pasado desde entonces (al doble si alguien está junto). */
export const avance = (c, t = ahora()) => (!c ? 0 : Math.min(1, (+c.p || 0) + (Math.max(0, t - (+c.t || t)) / Math.max(1, +c.d || 30)) * (c.x ? 2 : 1)));

/** Dónde está la lumbre en cada aparato (desde su esquina de arriba a la izquierda, en el mundo). */
const FOGON = {
  estufa: { x: 46, y: 32, medio: 7.5, gas: true },
  parrilla: { x: 53, y: 30, medio: 11, brasas: true },
  micro: { x: 60, y: 30, medio: 0, sinFuego: true },
  licuadora: { x: 60, y: 20, medio: 0, sinFuego: true },
};
const W = 34, HH = 40, PX = 4, BX = 17, BY = 36;   // el lienzo de efectos: 34 × 40 cuadritos; la lumbre en (17, 36)
const PAL_FUEGO = [null, [92, 22, 26, 150], [158, 38, 28, 200], [206, 66, 30, 235], [236, 116, 40, 255], [255, 162, 54, 255], [255, 204, 72, 255], [255, 236, 124, 255], [255, 250, 214, 255]];
const AZUL = [[64, 104, 196, 210], [124, 176, 238, 230]];

export class Cocina {
  constructor(j) {
    this.j = j; this.fx = new Map(); this._ult = 0;
    this.t = setInterval(() => this.tick(), 200);
    this._cuadro = (ts) => this._animar(ts);
  }
  limpiar() { clearInterval(this.t); cancelAnimationFrame(this._raf); for (const f of this.fx.values()) f.n.remove(); this.fx.clear(); }

  /** ¿Ese monito está junto a la estufa? (Con un poquito de margen para no prender y apagar el x2 en la orilla.) */
  cerca(m, r, ya = false) {
    if (!m || m.gx == null || !r) return false;
    if (enCuarto(m.gx).c !== r.o.c) return false;
    const k = ya ? 1.3 : 1;
    return Math.abs(m.gx - r.gx) < (r.d.w / 2 + 56) * k && Math.abs((m.y ?? 0) - r.o.y) < 96 * k;
  }
  _alguienCerca(r, ya) { const j = this.j; return this.cerca(j.yo, r, ya) || (!!j._parejaAqui && this.cerca(j.suyo, r, ya)); }

  /** Empezar a cocinar una receta en esa estufa (tu monito ya está junto). */
  empezar(r, k) {
    const j = this.j, rc = RECETAS[k];
    if (!rc || !r) return;
    const s = Math.max(MIN_S, Math.min(MAX_S, segundosDe(rc) * (0.84 + Math.random() * 0.3)));
    const trasto = rc.en === "olla" || rc.en === "horno" ? rc.en : "sarten";
    j.estado({ id: r.o.id }, { on: true, receta: k, trasto, listo: "", coc: { k, d: r1(s), p: 0, t: r1(ahora()), x: this._alguienCerca(r) ? 1 : 0 } });
    j._mandarYo({ ev: { k: "cocina", t: k } });
    j.sonar(SONIDO[rc.en] || "sarten", { volumen: 0.8 });
    try { j.luces?.pintar(); } catch (e) { /* nada */ }
    this.tick();
  }
  /** Tocar una estufa ocupada: si ya está listo, ir por él; si se está cocinando, ir a cuidarlo (al doble). */
  async tocar(r) {
    const j = this.j, e = r.o.e || {};
    if (e.listo && RECETAS[e.listo]) return this.tomar(r);
    if (!e.coc) return false;
    const ok = r.d.lugares ? await j.usarLugar({ id: r.o.id }, 0) : await j.irJunto({ id: r.o.id });
    if (ok && j.vivo) j._globo(j.yo, "Aquí lo cuido: va al doble", 2200);
    return true;
  }
  /** Tomar el platillo que quedó listo en la estufa. */
  async tomar(r, yaJunto = false) {
    const j = this.j, k = r.o.e?.listo;
    if (!k || !RECETAS[k]) return false;
    if (!yaJunto && !this.cerca(j.yo, r)) {
      if (!(await j.irJunto({ id: r.o.id }))) return true;
      r = j.objs.get(r.o.id);
      if (!r || r.o.e?.listo !== k) return true;
    }
    j.estado({ id: r.o.id }, { listo: "", on: false });
    j.dar(k, { gx: r.gx, y: r.o.y, def: r.d });
    if (j.yo.mueble?.startsWith(r.o.id + ":")) j.pararse();
    setTimeout(() => { if (j.vivo && j.yo.lleva === k) j._globo(j.yo, `¡${RECETAS[k].n} listo! Sírvelo en una mesa`, 2800); }, 700);
    return true;
  }
  _terminar(r, c) {
    const j = this.j;
    if (r._terminando) return;
    r._terminando = true; setTimeout(() => { r._terminando = false; }, 1500);
    j.estado({ id: r.o.id }, { on: false, coc: null, listo: c.k });
    if (r.o.c === j.vistaCuarto) { j.sonar("horno-listo"); j.particulas("chispa", { gx: r.gx, y: r.o.y - r.d.h }, 0, 0, 6); }
    try { j.luces?.pintar(); } catch (e) { /* nada */ }
    if (this.cerca(j.yo, r)) setTimeout(() => { const rr = j.objs.get(r.o.id); if (rr && j.vivo) this.tomar(rr, this.cerca(j.yo, rr)); }, 650);
  }

  /** Cada quinto de segundo: el avance, el x2, la pastillita y, al terminar, el platillo listo. */
  tick() {
    const j = this.j;
    if (!j.vivo || !j.objs) return;
    const t = ahora();
    let animar = false;
    for (const r of j.objs.values()) {
      const e = r.o.e || {}, c = e.coc && RECETAS[e.coc.k] ? e.coc : null, listo = e.listo && RECETAS[e.listo] ? e.listo : "";
      if (!c && !listo) { if (this.fx.has(r.o.id)) this._quitar(r.o.id); continue; }
      let x = c ? c.x | 0 : 0;
      if (c) {
        const p = avance(c, t);
        if (p >= 1) { this._terminar(r, c); continue; }
        const ahoraX = this._alguienCerca(r, !!c.x) ? 1 : 0;
        if (ahoraX !== x && t - (r._cocW || 0) > 1) {
          r._cocW = t; x = ahoraX;
          j.estado({ id: r.o.id }, { coc: { ...c, p: Math.round(p * 1000) / 1000, t: r1(t), x } });
          if (x && r.o.c === j.vistaCuarto) { j.sonar("pop", { volumen: 0.5 }); j.particulas("chispa", { gx: r.gx, y: r.o.y - r.d.h - 10 }, 0, 0, 3); }
          try { j.luces?.pintar(); } catch (er) { /* nada */ }
        }
        this._pintar(r, p, x, c.k, "");
        // El sonidito de lo que se cocina (más seguido al doble), sólo si estás en ese cuarto.
        if (r.o.c === j.vistaCuarto && t - (r._cocS || 0) > (x ? 1.6 : 2.8)) { r._cocS = t; j.sonar(SONIDO[RECETAS[c.k].en] || "sarten", { volumen: x ? 0.55 : 0.35 }); }
      } else this._pintar(r, 1, 0, listo, listo);
      if (r.o.c === j.vistaCuarto && !j.raiz?.classList.contains("ahorro")) animar = true;
    }
    if (animar && !this._raf) this._raf = requestAnimationFrame(this._cuadro);
  }
  /** La pastillita de arriba (avance, x2 o «¡Listo!») y el lienzo de efectos. */
  _pintar(r, p, x, k, listo) {
    let f = this.fx.get(r.o.id);
    if (!f || !f.n.isConnected || f.n.parentNode !== r.n) {
      if (f) f.n.remove();
      const fog = FOGON[r.d.al] || FOGON[r.d.k] || { x: r.d.w * 0.4, y: 30, medio: 7 };
      const cv = el("canvas.ca-coc-fx", { width: W, height: HH, "aria-hidden": "true", style: { left: fog.x - BX * PX + "px", top: fog.y - BY * PX + "px", width: W * PX + "px", height: HH * PX + "px" } });
      const barra = el("b"), plato = el("i.ca-coc-plato"), pista = el("small");
      const n = el("div.ca-coc-capa", { "aria-hidden": "true" }, [cv, el("div.ca-coc", {}, [plato, el("span.ca-coc-barra", {}, [barra]), el("em.ca-coc-x2", { text: "x2" }), pista])]);
      r.n.append(n);
      f = { n, cv, ctx: cv.getContext("2d"), img: null, barra, plato, pista, fog, calor: new Uint8Array(W * HH), humo: [], chispas: [], k: "", r };
      f.img = f.ctx.createImageData(W, HH);
      this.fx.set(r.o.id, f);
    }
    f.r = r; f.p = p; f.x = x; f.listo = listo;
    if (f.k !== k) { f.k = k; f.plato.innerHTML = arteReceta(RECETAS[k]); }
    f.barra.style.width = (p * 100).toFixed(1) + "%";
    f.n.classList.toggle("doble", !!x); f.n.classList.toggle("listo", !!listo);
    f.pista.textContent = listo ? "¡Listo!" : "";
    r.n.classList.toggle("con-fx", !listo);
  }
  _quitar(id) { const f = this.fx.get(id); if (!f) return; f.n.remove(); f.r?.n.classList.remove("con-fx"); this.fx.delete(id); }

  /* ── Los efectos en pixel (unos 15 cuadros por segundo, sólo lo que se ve) ── */
  _animar(ts) {
    this._raf = 0;
    const j = this.j;
    if (!j.vivo) return;
    let hay = false;
    if (ts - this._ult >= 64) {
      this._ult = ts;
      for (const f of this.fx.values()) {
        if (!f.r || f.r.o.c !== j.vistaCuarto) continue;
        hay = true;
        this._cuadroFx(f, ts / 1000);
      }
    } else hay = [...this.fx.values()].some((f) => f.r?.o.c === j.vistaCuarto);
    if (hay && !document.hidden) this._raf = requestAnimationFrame(this._cuadro);
  }
  _cuadroFx(f, t) {
    const d = f.img.data, C = f.calor, fog = f.fog, x2 = !!f.x, rc = RECETAS[f.k], listo = !!f.listo;
    d.fill(0);
    const pon = (x, y, c, a = c[3]) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= HH) return; const o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = Math.max(d[o + 3], a); };
    const trasto = f.r.o.e?.trasto || "sarten", horno = trasto === "horno";
    // 1) La lumbre: fuego que sube (cada cuadrito toma el calor del de abajo, se enfría un poco y se ladea al azar).
    if (!listo && !fog.sinFuego && !horno) {
      const medio = fog.medio, ancho = medio + 2, alto = x2 ? 5 : 3;
      for (let x = 0; x < W; x++) {
        const dx = Math.abs(x - BX);
        C[(HH - 1) * W + x] = dx <= ancho ? (Math.random() < 0.85 ? 8 : 6) : 0;
      }
      for (let y = HH - 1; y > 0; y--) for (let x = 0; x < W; x++) {
        const h = C[y * W + x];
        const lado = x + ((Math.random() * 3) | 0) - 1, enfria = Math.random() < (x2 ? 0.5 : 0.62) ? (Math.random() < 0.25 ? 2 : 1) : 0;
        if (lado >= 0 && lado < W) C[(y - 1) * W + lado] = Math.max(0, h - enfria);
      }
      // Debajo del sartén (o la olla) la llama apenas se asoma; a los lados lame hacia arriba.
      for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
        const dx = Math.abs(x - BX), sube = HH - 1 - y, tope = dx <= medio - 1 ? (fog.brasas ? 2 : 1) : dx <= medio + 2 ? alto - (dx > medio + 1 ? 1 : 0) : 0;
        if (sube > tope) { C[y * W + x] = 0; continue; }
        const h = C[y * W + x];
        if (h) pon(x, y - (HH - 1 - BY), PAL_FUEGO[Math.min(8, h)]);
      }
      // La base azul del gas.
      if (fog.gas) for (let x = Math.floor(BX - medio - 2); x <= BX + medio + 2; x++) if (Math.random() < 0.8) pon(x, BY, AZUL[(x + ((t * 9) | 0)) & 1]);
      // Las brasas del asador: un renglón que palpita.
      if (fog.brasas) for (let x = Math.floor(BX - medio); x <= BX + medio; x++) pon(x, BY + 1, PAL_FUEGO[2 + ((((x * 7 + t * 5) | 0) % 3) + 3) % 3]);
    }
    // 2) Burbujas en la olla y chisporroteo en el sartén.
    if (!listo && rc) {
      if (trasto === "olla") { for (let i = 0; i < (x2 ? 3 : 2); i++) if (Math.random() < 0.6) pon(BX - 6 + Math.random() * 12, BY - 8, [255, 255, 255, 230]); }
      else if (trasto === "sarten" || fog.brasas) { for (let i = 0; i < (x2 ? 4 : 2); i++) if (Math.random() < 0.55) pon(BX - 5 + Math.random() * 10, BY - 4 - Math.random() * 2, i % 2 ? [255, 250, 220, 255] : [255, 214, 120, 255]); }
    }
    // 3) Humo o vapor: bocanadas de tamaños y velocidades distintas que suben, se mecen y se deshacen.
    const vapor = trasto === "olla" || trasto === "horno" || listo || fog.sinFuego;
    const tasa = listo ? 0.12 : (fog.brasas ? 0.5 : 0.32) * (x2 ? 1.7 : 1);
    if (Math.random() < tasa && f.humo.length < 26) {
      const sube = listo ? 0.18 : 0.28 + Math.random() * 0.3;
      f.humo.push({ x: BX + (Math.random() - 0.5) * (fog.medio * 1.4 || 6), y: BY - (horno ? 9 : trasto === "olla" ? 9 : 5), vx: (Math.random() - 0.5) * 0.16, vy: -sube * (x2 ? 1.3 : 1), r: 0.8 + Math.random() * 0.9, crece: 0.03 + Math.random() * 0.05, vida: 0, max: 22 + Math.random() * 26, fase: Math.random() * 6, vapor: vapor || Math.random() < 0.35 });
    }
    f.humo = f.humo.filter((h) => {
      h.vida++; h.x += h.vx + Math.sin(h.fase + h.vida * 0.22) * 0.12; h.y += h.vy; h.r += h.crece; h.vy *= 0.995;
      const a = 1 - h.vida / h.max;
      if (a <= 0 || h.y < -3) return false;
      const col = h.vapor ? [255, 255, 255] : [198, 188, 206], al = (h.vapor ? 200 : 170) * a;
      const R = Math.ceil(h.r);
      for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) {
        const dd = Math.hypot(xx, yy) / h.r;
        if (dd > 1) continue;
        // (La orilla se deshace en tramado, como en los juegos de antes.)
        if (dd > 0.6 && ((Math.round(h.x + xx) + Math.round(h.y + yy) + (h.vida >> 2)) & 1)) continue;
        if (a < 0.35 && ((Math.round(h.x + xx) + Math.round(h.y + yy)) & 1)) continue;
        pon(h.x + xx, h.y + yy, col, al * (dd < 0.5 ? 1 : 0.75));
      }
      return true;
    });
    // 4) Chispitas que brincan del fuego (más al doble y en el asador).
    if (!listo && !fog.sinFuego && !horno && Math.random() < (fog.brasas ? 0.5 : 0.22) * (x2 ? 2 : 1)) f.chispas.push({ x: BX + (Math.random() - 0.5) * (fog.medio * 2 + 4), y: BY - 2, vx: (Math.random() - 0.5) * 0.5, vy: -0.6 - Math.random() * 0.7, vida: 0, max: 8 + Math.random() * 10 });
    f.chispas = f.chispas.filter((c) => { c.vida++; c.x += c.vx; c.y += c.vy; c.vy += 0.03; if (c.vida > c.max) return false; pon(c.x, c.y, c.vida % 3 ? [255, 214, 90, 255] : [255, 140, 50, 255]); return true; });
    // 5) Ondas de calor: rayitas tenues que se mecen arriba de la lumbre.
    if (!listo && !fog.sinFuego) for (let i = 0; i < (x2 ? 3 : 2); i++) {
      const y0 = BY - 12 - ((t * 6 + i * 5) % 12);
      for (let x = BX - 5; x <= BX + 5; x++) if ((x + i) % 2 === 0) pon(x, y0 + Math.round(Math.sin(x * 0.7 + t * 5 + i) * 0.8), [255, 236, 214, 46]);
    }
    // 6) Ya listo: unos brillitos que parpadean.
    if (listo && Math.random() < 0.25) { const x = BX + (Math.random() - 0.5) * 14, y = BY - 10 - Math.random() * 8; pon(x, y, [255, 246, 170, 255]); pon(x - 1, y, [255, 230, 120, 160]); pon(x + 1, y, [255, 230, 120, 160]); pon(x, y - 1, [255, 230, 120, 160]); pon(x, y + 1, [255, 230, 120, 160]); }
    f.ctx.putImageData(f.img, 0, 0);
  }
}
const SONIDO = { sarten: "sarten", olla: "burbujas", horno: "tic", parrilla: "sarten", micro: "micro", licuadora: "licuadora" };

/** La luz cálida de la lumbre (de noche se nota): la toma luces.js para su mapa de luz. */
export function lucesCocina(j, c, x0) {
  const out = [];
  for (const r of j.objs.values()) {
    const e = r.o.e;
    if (r.o.c !== c || !e?.coc || !RECETAS[e.coc.k]) continue;
    const fog = FOGON[r.d.al] || FOGON[r.d.k];
    if (!fog || fog.sinFuego || e.trasto === "horno") continue;
    out.push({ x: r.gx - r.d.w / 2 + fog.x - x0, y: r.o.y - r.d.h + fog.y, r: e.coc.x ? 190 : 140, k: [255, 150, 70], i: e.coc.x ? 0.9 : 0.7 });
  }
  return out;
}
