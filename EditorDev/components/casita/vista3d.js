/**
 * EL CUARTO EN 3D (Fase 80): darle la vuelta al cuarto para ver sus cuatro paredes, como una casita de muñecas que
 * giras en la mano.
 *
 *   · Todo se pinta en UN solo lienzo (nada de cientos de capas: así no parpadea ni se pone lento en el teléfono): el
 *     piso con su textura, las cuatro paredes con su tapiz y su lambrín, las puertas, lo colgado en la pared, las
 *     alfombras, los muebles y los dos monitos.
 *   · Las medidas son las de verdad: lo hondo del cuarto sale de la perspectiva de la cajita (lo de atrás se veía más
 *     chiquito), así que cada cosa queda donde está, con el espacio que de verdad ocupa.
 *   · Los muebles se ven de verdad desde cada ángulo: son las mismas vistas de volumen de siempre (girar.js), de 22.5
 *     en 22.5 grados, que se preparan de a poquito (primero las que se van a ver). Al soltar, el cuarto se acomoda
 *     suavecito en el ángulo más cercano, así que quieto todo está exacto.
 *   · Las paredes que quedan de tu lado se bajan (el corte de la casita de muñecas) y se vuelven a subir al pasar
 *     atrás, poco a poco, sin brincos. Las puertas se ven en su pared (y, en las bajitas, como un hueco para pasar).
 *   · Los monitos son los de bulto (monito3d.js): caminan moviendo piernas y brazos, miran hacia donde van, parpadean,
 *     y sentados o acostados se ven adentro de su mueble.
 *   · De noche el cuarto se oscurece y las lámparas prendidas alumbran a su alrededor.
 *   · Se gira deslizando (con su impulso), con los botones de los lados o con las flechas del teclado; se acerca con
 *     dos dedos, la ruedita o tocando dos veces. «Listo» (o atrás) regresa al cuarto de siempre, girando de vuelta.
 */
import { el } from "../ui.js";
import { sinMovimiento as reducido } from "../transiciones.js";
import { H, PISO, FONDO_3D, FRENTE_3D, cuarto, inicioDe, enCuarto } from "./cuartos.js";
import { vistaGirada, vistaFrenteYa, hondura, ELEV_GIRO as E } from "./girar.js";
import { modelo, pintar, POSES, CEL } from "./monito3d.js";
import { colorDe } from "./catalogo/index.js";
import { texParedR, texPisoR, texLambrin, texPuerta } from "./texturas.js";
import { hondoPuerta } from "./puertas.js";
import { ICO } from "./iconos.js";
import { nivel } from "./graficos.js";

const HW = 498, T = 18, BASE = 30, CORTE = 44, PASO = 22.5, DW = 92, DH = 184, LAMB = 155, SP = 6;
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (g) => ((g % 360) + 360) % 360;
const rad = (g) => (g * Math.PI) / 180;
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const escalon = (t) => t * t * (3 - 2 * t);
const B3 = FRENTE_3D - FONDO_3D, KZ = (H - PISO) / (E * B3);
/** De la «y» del mundo (lo hondo en la cajita, con su perspectiva) a lo hondo de verdad, contado desde enfrente. */
export const hondo = (y) => KZ * Math.log(FRENTE_3D / (FONDO_3D + B3 * lim((y - PISO) / (H - PISO), 0, 1)));
const DZ = hondo(PISO);
const COL = { tapa: "#fff7f3", filo: "#cfa9bb", muro: "#f3e1e6", muroO: "#e5c9d3", base: "#e8cdd8", baseO: "#cfa7b9", umbral: "#d8ae8a", hueco: "#4b3047" };

/* ── Imágenes: las vistas traen su lienzo; lo demás (dibujos y vistas guardadas) se lee una vez ── */
const IMGS = new Map(), VIVOS = new Map();
function imagen(url, listo) {
  if (!url) return null;
  let it = IMGS.get(url);
  if (!it) {
    const im = new Image();
    it = { im, ok: false };
    im.onload = () => { it.ok = true; listo?.(); };
    im.onerror = () => { it.mal = true; };
    im.src = url;
    IMGS.set(url, it);
    if (IMGS.size > 500) IMGS.delete(IMGS.keys().next().value);
  }
  return it.ok ? it.im : null;
}
/** El dibujo de una cosa como imagen (con su medida; si ya traía `xmlns`, `width` o `height`, no se repiten). */
const conMedida = (svg, w, h) => String(svg).replace(/^\s*<svg\b([^>]*)>/, (m, at) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"${at.replace(/\s(?:xmlns|width|height)="[^"]*"/g, "")}>`);
const svgUrl = (svg, w, h) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(conMedida(svg, Math.max(1, Math.round(w)), Math.max(1, Math.round(h))));

export class Vista3D {
  constructor(j) {
    this.j = j; this.abierta = false; this.cerrando = false; this.n = null;
    this.th = 0; this.vel = 0; this.zoom = 1; this.pan = [0, 0]; this.tw = null;
    this.vistas = new Map(); this.planos = new Set(); this.cola = new Map(); this.trabajando = false;
    this.modelos = new Map(); this.pats = new Map(); this.ptr = new Map();
    this.sucio = true; this._vol = []; this._faltan = 0;
    this._ciclo = this._ciclo.bind(this);
  }
  /** Sólo adentro (afuera no hay paredes que girar) y no mientras acomodas. */
  puede() { const j = this.j; return !!(j.vivo && j.vistaCuarto && !cuarto(j.vistaCuarto).afuera && !j.editando); }

  /* ═══ Abrir y cerrar ═══ */
  abrir() {
    if (this.abierta || !this.puede()) return;
    const j = this.j;
    j.cerrarMenu?.();
    if (!this.n) this._armar();
    this.abierta = true; this.cerrando = false;
    this.th = 0; this.vel = 0; this.zoom = 1; this.pan = [0, 0]; this.tw = null; this.sucio = true; this.c = j.vistaCuarto;
    j.escena.append(this.n);
    this._ro.observe(this.n);
    this._medir();
    // (Fase 81) En el celular parado el cuarto completo sale chiquito: se abre ya acercado (se aleja con dos dedos o
    // dos toques), centrado un poquito abajo, donde están el piso y los muebles.
    if (this.vw < this.vh * 0.8) { this.zoom = 1.42; this.pan = [0, -this.vh * 0.04]; this._limitarPan(); this.zoom0 = 1.42; } else this.zoom0 = 1;
    this._titulo();
    this.n.classList.remove("ver");
    void this.n.offsetWidth;
    requestAnimationFrame(() => this.n?.classList.add("ver"));
    j.raiz.classList.add("vista3d");
    clearTimeout(this._tQuieto);
    // (Ya que se ve el 3D, la casita de abajo deja de pintarse: no se ve y así el teléfono descansa.)
    this._tQuieto = setTimeout(() => { if (this.abierta && !this.cerrando) j.raiz?.classList.add("vista3d-quieta"); }, 420);
    const meta = 45;
    this._preparar([PASO, meta, meta + PASO, 0]);
    if (reducido()) this.th = meta;
    else this.tw = { th0: 0, th1: meta, t0: performance.now() + 160, ms: 1250 };
    this._tAnt = 0;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this._ciclo);
    try { this.n.focus({ preventScroll: true }); } catch (e) { /* nada */ }
    j.sonar?.("whoosh", { volumen: 0.5 });
  }
  /** Regresa al cuarto de siempre: gira de vuelta hasta quedar de frente y se desvanece. */
  cerrar(rapido = false) {
    if (!this.abierta || this.cerrando) return;
    const j = this.j;
    this.cerrando = true; this.vel = 0; this.arr = null; this.pinza = null; this.ptr.clear();
    j.raiz?.classList.remove("vista3d-quieta");
    const fin = () => {
      this.n?.classList.remove("ver");
      setTimeout(() => {
        if (!this.cerrando) return;
        this.abierta = false; this.cerrando = false; this.tw = null;
        cancelAnimationFrame(this.raf); this.raf = 0;
        this._ro?.disconnect(); this.n?.remove(); this.cola.clear();
        j.raiz?.classList.remove("vista3d", "vista3d-quieta");
      }, rapido ? 0 : 250);
    };
    if (rapido || reducido()) { fin(); return; }
    const vuelta = Math.round(this.th / 360) * 360;
    this.tw = { th0: this.th, th1: vuelta, z0: this.zoom, z1: this.zoom0 || 1, p0: [...this.pan], p1: [...this.pan], t0: performance.now(), ms: Math.min(950, 380 + Math.abs(vuelta - this.th) * 5), fin };
    j.sonar?.("whoosh", { volumen: 0.35 });
  }
  destruir() { this.cerrando = true; this.abierta = false; cancelAnimationFrame(this.raf); this._ro?.disconnect(); this.n?.remove(); this.cola.clear(); this.vistas.clear(); }
  /** Un cuarto de vuelta (con los botones o las flechas). */
  girarPaso(dir) {
    if (!this.abierta || this.cerrando) return;
    const meta = Math.round((this.th + dir * 90) / PASO) * PASO;
    this.vel = 0;
    if (reducido()) { this.th = meta; this.sucio = true; }
    else this.tw = { th0: this.th, th1: meta, t0: performance.now(), ms: 640 };
    this.j.sonar?.("clic", { volumen: 0.35 });
  }

  /* ═══ Lo de la pantalla: el lienzo, el título, «Listo» y los botones para girar ═══ */
  _armar() {
    const b = (cls, t, al) => el("button.ca-3d-b." + cls, { type: "button", "aria-label": t, title: t, onClick: al }, [el("i", { html: ICO.girar })]);
    this.cv = el("canvas.ca-3d-lienzo", { "aria-hidden": "true" });
    this.tituloN = el("b", { text: "" });
    this.cargaN = el("small.ca-3d-ayuda", { role: "status", "aria-live": "polite", text: "Desliza para darle la vuelta" });
    this.n = el("div.ca-3d", { role: "dialog", "aria-label": "El cuarto en 3D", tabindex: "-1" }, [
      this.cv,
      el("div.ca-3d-arriba", {}, [
        el("div.ca-3d-t", {}, [this.tituloN, this.cargaN]),
        el("button.ca-3d-listo", { type: "button", onClick: () => this.cerrar() }, [el("span", { text: "Listo" })]),
      ]),
      el("div.ca-3d-abajo", {}, [b("izq", "Girar hacia la izquierda", () => this.girarPaso(-1)), b("der", "Girar hacia la derecha", () => this.girarPaso(1))]),
    ]);
    this.ctx = this.cv.getContext("2d");
    const cv = this.cv;
    cv.addEventListener("pointerdown", (e) => this._abajo(e));
    cv.addEventListener("pointermove", (e) => this._mover(e));
    cv.addEventListener("pointerup", (e) => this._arriba(e, false));
    cv.addEventListener("pointercancel", (e) => this._arriba(e, true));
    cv.addEventListener("lostpointercapture", (e) => this._arriba(e, true));
    cv.addEventListener("wheel", (e) => { e.preventDefault(); this._acercar(Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY); }, { passive: false });
    cv.addEventListener("contextmenu", (e) => e.preventDefault());
    this.n.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); this.girarPaso(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); this.girarPaso(1); }
    });
    this._ro = new ResizeObserver(() => { if (this.abierta) { this._medir(); this.sucio = true; } });
  }
  _titulo() { const j = this.j; this.tituloN.textContent = j.nombreCuarto?.(j.vistaCuarto) || cuarto(j.vistaCuarto).n; }
  _medir() {
    const r = this.n.getBoundingClientRect();
    this.rect = r; this.vw = Math.max(1, r.width); this.vh = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1) * (nivel(this.j.gfx) < 1 ? 0.75 : 1);
    this.dpr = dpr;
    const W = Math.max(1, Math.round(this.vw * dpr)), Hc = Math.max(1, Math.round(this.vh * dpr));
    if (this.cv.width !== W || this.cv.height !== Hc) { this.cv.width = W; this.cv.height = Hc; }
    const ar = this.n.querySelector(".ca-3d-arriba"), ab = this.n.querySelector(".ca-3d-abajo");
    this.arriba = ar ? Math.max(40, ar.getBoundingClientRect().bottom - r.top) : 60;
    this.abajo = ab ? Math.max(40, r.bottom - ab.getBoundingClientRect().top) : 70;
  }
  /** La escala para que el cuarto quepa entero desde cualquier ángulo (así no se acerca y se aleja al girarlo). */
  _escala(w) {
    const Rd = Math.hypot(w / 2 + T, DZ / 2 + T), libre = Math.max(80, this.vh - this.arriba - this.abajo);
    return { Rd, k0: Math.min((this.vw * 0.97) / (2 * Rd), (libre * 0.97) / (HW + BASE + 2 * Rd * E)), libre };
  }
  _centro() { return [this.rect.left + this.vw / 2, this.rect.top + this.arriba + Math.max(80, this.vh - this.arriba - this.abajo) / 2]; }
  _limitarPan() {
    const w = cuarto(this.j.vistaCuarto).w, { Rd, k0 } = this._escala(w), kz = k0 * this.zoom;
    const lx = Math.max(0, (2 * Rd * kz - this.vw) / 2 + 40), ly = Math.max(0, ((HW + BASE + 2 * Rd * E) * kz - (this.vh - this.arriba - this.abajo)) / 2 + 40);
    this.pan = [lim(this.pan[0], -lx, lx), lim(this.pan[1], -ly, ly)];
  }

  /* ═══ Los dedos: deslizar gira (con su impulso), dos dedos acercan, dos toquecitos acercan o alejan ═══ */
  _gpp() { return Math.max(0.2, 230 / Math.max(320, this.vw)); }
  _abajo(e) {
    if (this.cerrando) return;
    try { this.cv.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
    this.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.tw = null; this.vel = 0;
    const ahora = performance.now();
    if (this.ptr.size === 1) this.arr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, th0: this.th, p0: [...this.pan], hist: [[ahora, e.clientX]], mov: false };
    else if (this.ptr.size === 2) {
      const [a, b] = [...this.ptr.values()];
      this.pinza = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: this.zoom, m0: [(a.x + b.x) / 2, (a.y + b.y) / 2], p0: [...this.pan] };
      this.arr = null;
    }
  }
  _mover(e) {
    const p = this.ptr.get(e.pointerId);
    if (!p || this.cerrando) return;
    p.x = e.clientX; p.y = e.clientY;
    if (this.pinza && this.ptr.size >= 2) {
      const [a, b] = [...this.ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, m = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      const z = lim((this.pinza.z0 * d) / this.pinza.d0, 1, 2.8), f = z / this.pinza.z0, C = this._centro(), P0 = this.pinza;
      this.pan = [m[0] - C[0] - (P0.m0[0] - C[0] - P0.p0[0]) * f, m[1] - C[1] - (P0.m0[1] - C[1] - P0.p0[1]) * f];
      this.zoom = z; this._limitarPan(); this.sucio = true;
      return;
    }
    const A = this.arr;
    if (!A || A.id !== e.pointerId) return;
    const dx = e.clientX - A.x0, dy = e.clientY - A.y0;
    if (!A.mov && Math.hypot(dx, dy) > 6) A.mov = true;
    if (!A.mov) return;
    // (Fase 81) Un dedo de lado a lado siempre gira; acercado, de arriba abajo mueve la vista (con dos dedos, a donde sea).
    this.th = A.th0 + dx * this._gpp();
    if (this.zoom > 1.02) { this.pan = [this.pan[0], A.p0[1] + dy]; this._limitarPan(); }
    A.hist.push([performance.now(), e.clientX]);
    if (A.hist.length > 8) A.hist.shift();
    this.sucio = true;
  }
  _arriba(e, cancelado) {
    if (!this.ptr.has(e.pointerId)) return;
    this.ptr.delete(e.pointerId);
    if (this.pinza) {
      if (this.ptr.size < 2) {
        this.pinza = null; this.arr = null;
        if (this.ptr.size === 1) { const [id, p] = [...this.ptr.entries()][0]; this.arr = { id, x0: p.x, y0: p.y, th0: this.th, p0: [...this.pan], hist: [[performance.now(), p.x]], mov: true }; }
      }
      return;
    }
    const A = this.arr;
    this.arr = null;
    if (!A || A.id !== e.pointerId) return;
    const ahora = performance.now();
    if (!A.mov) {
      if (cancelado) return;
      if (ahora - (this._toque || 0) < 330) { this._toque = 0; this._dobleToque(e.clientX, e.clientY); }
      else this._toque = ahora;
      return;
    }
    // Su impulso: lo que se movió en el último ratito.
    const h = A.hist.filter(([t]) => ahora - t < 120);
    if (!cancelado && h.length >= 2 && !reducido()) {
      const [t0, x0] = h[0], [t1, x1] = h[h.length - 1];
      this.vel = t1 > t0 ? lim(((x1 - x0) / (t1 - t0)) * this._gpp(), -1.1, 1.1) : 0;
    }
  }
  _acercar(f, x, y) {
    if (!this.abierta || this.cerrando) return;
    const z0 = this.zoom, z = lim(z0 * f, 1, 2.8), C = this._centro(), q = z / z0;
    this.pan = [x - C[0] - (x - C[0] - this.pan[0]) * q, y - C[1] - (y - C[1] - this.pan[1]) * q];
    this.zoom = z; this._limitarPan(); this.sucio = true;
  }
  _dobleToque(x, y) {
    const C = this._centro(), z0 = this.zoom;
    if (z0 > 1.3) { this.tw = { th0: this.th, th1: this.th, z0, z1: 1, p0: [...this.pan], p1: [0, 0], t0: performance.now(), ms: 420 }; return; }
    const z1 = 2.1, q = z1 / z0, p1 = [x - C[0] - (x - C[0] - this.pan[0]) * q, y - C[1] - (y - C[1] - this.pan[1]) * q];
    const guarda = [this.pan, this.zoom];
    this.pan = p1; this.zoom = z1; this._limitarPan(); const p1b = this.pan; [this.pan, this.zoom] = guarda;
    this.tw = { th0: this.th, th1: this.th, z0, z1, p0: [...this.pan], p1: p1b, t0: performance.now(), ms: 420 };
  }

  /* ═══ Las vistas de cada mueble (se hacen de a una, primero las que se van a ver) ═══ */
  _clave(r) { return r.o.id + "|" + r.o.t + "|" + JSON.stringify(r.o.e || {}); }
  /** La vista de una cosa a ese ángulo; si todavía no está, la más cercana que ya esté (y ésta se pide). */
  _vistaEn(r, g, g0, f) {
    const k = this._clave(r);
    let m = this.vistas.get(k);
    if (!m) { m = new Map(); this.vistas.set(k, m); if (this.vistas.size > 180) this.vistas.delete(this.vistas.keys().next().value); }
    if (!m.has(g)) { m.set(g, null); this.cola.set(k + "@" + g, { r, g, g0, f, m, k }); this._trabajar(); }
    const v = m.get(g);
    if (v) return [v, g];
    for (let i = 1; i <= 8; i++) for (const s of [1, -1]) { const g2 = norm(g + s * i * PASO), v2 = m.get(g2); if (v2) return [v2, g2]; }
    return [null, g];
  }
  _preparar(angulos) {
    const j = this.j, c = j.vistaCuarto;
    for (const r of j.objs.values()) {
      if (r.o.c !== c || !this._conVolumen(r)) continue;
      const g0 = j._giro(r.d, r.o), f = !!r.o.f;
      for (const a of angulos) { const q = norm(Math.round(a / PASO) * PASO); this._vistaEn(r, norm(f ? g0 - q : g0 + q), g0, f); }
    }
  }
  async _trabajar() {
    if (this.trabajando) return;
    this.trabajando = true;
    try {
      while (this.abierta && !this.cerrando && this.cola.size) {
        // La que más pronto se va a ver: la más cerca del ángulo de ahorita (y si va girando, hacia donde va).
        const tq = Math.round(this.th / PASO) * PASO, dir = Math.sign(this.vel || (this.tw ? this.tw.th1 - this.th : 0));
        let mejor = null, dm = 1e9;
        for (const [kk, t] of this.cola) {
          const quiere = norm(t.f ? t.g0 - tq : t.g0 + tq), d0 = norm(t.g - quiere), d = Math.min(d0, 360 - d0);
          const lado = (t.f ? -1 : 1) * (d0 <= 180 ? 1 : -1), pena = dir && lado !== dir ? PASO * 0.6 : 0;
          if (d + pena < dm) { dm = d + pena; mejor = [kk, t]; }
        }
        const [kk, t] = mejor;
        this.cola.delete(kk);
        const { r, g, m } = t;
        if (this.j.objs.get(r.o.id) !== r) { m.delete(g); continue; }
        let v = null;
        try { v = await vistaGirada(r.d, r.o.e, colorDe(r.d, r.o.e), g); } catch (e) { v = null; }
        if (v?.plano) this.planos.add(t.k);
        m.set(g, v && !v.plano && (v.cv || v.url) ? v : false);
        this.sucio = true;
        // (Mientras giras con el dedo, un respiro entre una y otra: así no da tirones.)
        await new Promise((ok) => setTimeout(ok, this.arr || Math.abs(this.vel) > 0.02 ? 70 : 0));
      }
    } finally { this.trabajando = false; }
  }
  /** Con calma, se van preparando las demás vueltas (para que girar después ya salga parejito). */
  _rellenar() {
    if (this.trabajando || this.cola.size || this.arr || this.tw) return;
    const tq = Math.round(this.th / PASO) * PASO;
    for (const { r, g0, f } of this._vol) {
      const m = this.vistas.get(this._clave(r));
      for (let i = 0; i < 16; i++) for (const s of [1, -1]) {
        const q = norm(tq + s * i * PASO), g = norm(f ? g0 - q : g0 + q);
        if (!m || !m.has(g)) { this._vistaEn(r, g, g0, f); return; }
      }
    }
  }
  /** Lo que se ve de bulto (y gira de verdad): los muebles; lo chiquito y lo redondo se ve igual desde todos lados. */
  _conVolumen(r) {
    const d = r.d;
    if (!this.j._girable(d) || d.propio || d.torno || this.planos.has(this._clave(r))) return false;
    return !!(d.lugares?.length || (d.w >= 44 && d.h >= 30));
  }

  /* ═══ El ciclo: se pinta cuando algo cambia (girando, monitos caminando) y si no, de vez en cuando ═══ */
  _ciclo(ms) {
    this.raf = 0;
    if (!this.abierta) return;
    this.raf = requestAnimationFrame(this._ciclo);
    if (document.hidden) return;
    const ahora = performance.now(), dt = this._tAnt ? Math.min(50, ahora - this._tAnt) : 16;
    this._tAnt = ahora;
    const j = this.j;
    if (!j.vivo || !j.vistaCuarto || cuarto(j.vistaCuarto).afuera) { this.cerrar(true); return; }
    if (j.vistaCuarto !== this.c) { this.c = j.vistaCuarto; this.cola.clear(); this._titulo(); this._preparar([this.th]); this.sucio = true; }
    const mueve = this._avanzar(ahora, dt);
    const cada = this._caminan ? 33 : 120;
    if (mueve || this.sucio || ahora - (this._ultimo || 0) > cada) {
      this.sucio = false; this._ultimo = ahora;
      try { this._dibujar(ahora); } catch (e) { try { console.debug("DBG 3d", e?.message); } catch (e2) { /* nada */ } }
      const est = (this._faltan > 0 ? 1 : 0) + (this.zoom > 1.05 ? 2 : 0);
      if (est !== this._estAyuda) { this._estAyuda = est; this._ayuda(); }
    }
    if (ahora - (this._tRell || 0) > 400) { this._tRell = ahora; this._rellenar(); this._ayuda(); }
  }
  _avanzar(ahora, dt) {
    if (this.tw) {
      const W = this.tw, f = lim((ahora - W.t0) / W.ms, 0, 1), q = W.curva ? W.curva(f) : suave(f);
      this.th = W.th0 + (W.th1 - W.th0) * q;
      if (W.z1 != null) this.zoom = W.z0 + (W.z1 - W.z0) * q;
      if (W.p1) this.pan = [W.p0[0] + (W.p1[0] - W.p0[0]) * q, W.p0[1] + (W.p1[1] - W.p0[1]) * q];
      if (f >= 1) { this.tw = null; W.fin?.(); }
      return true;
    }
    if (this.arr || this.pinza || this.cerrando) return false;
    if (Math.abs(this.vel) > 0.004) { this.th += this.vel * dt; this.vel *= Math.pow(0.935, dt / 16); return true; }
    this.vel = 0;
    // Quieto: se acomoda suavecito en el ángulo más cercano (así cada mueble queda exacto).
    const meta = Math.round(this.th / PASO) * PASO;
    if (Math.abs(meta - this.th) > 0.05) { this.tw = { th0: this.th, th1: meta, t0: ahora, ms: 260, curva: (f) => 1 - (1 - f) * (1 - f) }; return true; }
    if (this.th !== meta) { this.th = meta; return true; }
    // (Ya acomodado: el ángulo se guarda entre 0 y 360.)
    if (this.th >= 360 || this.th < 0) this.th = norm(this.th);
    return false;
  }
  _ayuda() {
    const t = this._faltan > 0 ? "Preparando la vuelta…" : this.zoom > 1.05 ? "Desliza para girar · dos dedos: acercar y mover" : "Desliza para darle la vuelta";
    if (this.cargaN && this.cargaN.textContent !== t) this.cargaN.textContent = t;
    this.cargaN?.classList.toggle("cargando", this._faltan > 0);
  }

  /* ═══ Pintar ═══ */
  _pat(clave, cv, s, dx = 0, dy = 0) {
    const ctx = this.ctx, k = clave + "|" + s;
    let p = this.pats.get(k);
    if (!p) { p = ctx.createPattern(cv, "repeat"); this.pats.set(k, p); if (this.pats.size > 40) this.pats.delete(this.pats.keys().next().value); }
    try { p.setTransform(new DOMMatrix([s, 0, 0, s, dx, dy])); } catch (e) { /* nada */ }
    return p;
  }
  _dibujar(ahora) {
    const j = this.j, ctx = this.ctx, cv = this.cv, c = j.vistaCuarto, cu = cuarto(c), cfg = j.cfgCuarto(c) || {}, w = cu.w, x0 = inicioDe(c);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const { Rd, k0, libre } = this._escala(w), dpr = this.dpr, k = k0 * this.zoom * dpr;
    const ox = (this.vw / 2 + this.pan[0]) * dpr, oy = (this.arriba + libre / 2 + this.pan[1]) * dpr + ((HW - BASE) / 2) * k;
    const th = this.th, a = rad(th), co = Math.cos(a), si = Math.sin(a), cx = w / 2, cz = DZ / 2, TQ = Math.round(th / PASO) * PASO;
    ctx.imageSmoothingEnabled = k < 0.95;
    const P = (x, z, h = 0) => { const A = x - cx, Bz = z - cz; return [A * co - Bz * si, -h - (A * si + Bz * co) * E, A * si + Bz * co]; };
    const base = () => ctx.setTransform(k, 0, 0, k, ox, oy);
    const plano = (h = 0) => { base(); const p = P(0, 0, h); ctx.transform(co, -si * E, -si, -co * E, p[0], p[1]); };
    /** Una cara de pie sobre la línea A→B: (u a lo largo, v hacia abajo desde la altura h). */
    const cara = (A, Bp, h) => {
      const L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]) || 1e-6, ux = (Bp[0] - A[0]) / L, uz = (Bp[1] - A[1]) / L, p = P(A[0], A[1], h);
      base(); ctx.transform(ux * co - uz * si, -(ux * si + uz * co) * E, 0, 1, p[0], p[1]);
      return L;
    };
    const poli = (pts, h, fill) => { plano(h); ctx.beginPath(); pts.forEach(([x, z], i) => (i ? ctx.lineTo(x, z) : ctx.moveTo(x, z))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
    const ve = (nx, nz) => nx * si + nz * co < -1e-6;                 // ¿esa cara te ve?
    const luzDe = (nx, nz) => nx * co - nz * si;                       // <0: mira a la izquierda (le da la luz)
    const noche = j.esNoche?.(), tarde = !noche && j.mundo?.classList.contains("tarde");
    this.n.classList.toggle("noche", !!noche);
    this._faltan = 0; this._caminan = false;

    // ── La sombra de la casita y su base ──
    plano(-BASE - 2);
    { const g = ctx.createRadialGradient(cx, cz, Rd * 0.2, cx, cz, Rd * 1.18); g.addColorStop(0, "rgba(100,44,84,.26)"); g.addColorStop(1, "rgba(100,44,84,0)"); ctx.fillStyle = g; ctx.fillRect(cx - Rd * 1.2, cz - Rd * 1.2, Rd * 2.4, Rd * 2.4); }
    const caja = (xa, xb, za, zb, h0, h1, col, colO, tapa) => {
      for (const [A, Bp, nx, nz] of [[[xa, za], [xb, za], 0, -1], [[xb, zb], [xa, zb], 0, 1], [[xa, zb], [xa, za], -1, 0], [[xb, za], [xb, zb], 1, 0]]) {
        if (!ve(nx, nz)) continue;
        const L = cara(A, Bp, h1);
        ctx.fillStyle = luzDe(nx, nz) < 0 ? col : colO; ctx.fillRect(0, 0, L, h1 - h0);
      }
      if (tapa) poli([[xa, za], [xb, za], [xb, zb], [xa, zb]], h1, tapa);
    };
    caja(-T, w + T, -T, DZ + T, -BASE, 0, COL.base, COL.baseO, null);
    // (Una rayita clara en la orilla de arriba de la base.)
    for (const [A, Bp, nx, nz] of [[[-T, -T], [w + T, -T], 0, -1], [[w + T, DZ + T], [-T, DZ + T], 0, 1], [[-T, DZ + T], [-T, -T], -1, 0], [[w + T, -T], [w + T, DZ + T], 1, 0]]) {
      if (!ve(nx, nz)) continue;
      const L = cara(A, Bp, 0); ctx.fillStyle = "rgba(255,248,244,.75)"; ctx.fillRect(0, 0, L, 3);
    }

    // ── El piso ──
    const tipoP = cfg.piso || cu.piso, tp = texPisoR(tipoP);
    plano(0);
    ctx.fillStyle = this._pat("f" + tipoP, tp.cv, SP); ctx.fillRect(0, 0, w, DZ);
    { const g = ctx.createRadialGradient(cx, cz * 0.9, 20, cx, cz, Math.max(w, DZ) * 0.75); g.addColorStop(0, "rgba(255,250,240,.16)"); g.addColorStop(1, "rgba(80,30,60,.10)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, DZ); }

    // ── Las paredes: las de atrás altas con su tapiz; las de tu lado bajitas (el corte de la casita) ──
    const pared = cfg.pared || cu.pared, patron = cfg.patron || cu.patron;
    const MUROS = [
      { k: "atras", A: [0, DZ], B: [w, DZ], n: [0, -1], o: [0, 1] },
      { k: "frente", A: [w, 0], B: [0, 0], n: [0, 1], o: [0, -1] },
      { k: "izq", A: [0, 0], B: [0, DZ], n: [1, 0], o: [-1, 0] },
      { k: "der", A: [w, DZ], B: [w, 0], n: [-1, 0], o: [1, 0] },
    ];
    const porK = {};
    for (const M of MUROS) {
      M.nz = M.n[0] * si + M.n[1] * co; M.lejos = M.nz < -1e-6;
      M.h = M.lejos ? HW : CORTE + (HW - CORTE) * (1 - escalon(lim(M.nz / 0.32, 0, 1)));
      M.L = Math.hypot(M.B[0] - M.A[0], M.B[1] - M.A[1]); M.puertas = []; porK[M.k] = M;
    }
    // Las puertas de cada pared (dónde quedan a lo largo de la pared, desde su punta A).
    const zp = hondo(hondoPuerta()), colorP = j.puertasN?.colorDe?.(c) || "#f2b1c6";
    for (const p of j.puertasN?.de(c) || []) {
      const ab = (j.puertasN.ap?.get(p.id) || 0) > 0.5;
      if (p.pared === "atras") porK.atras.puertas.push({ u: lim(p.x, DW / 2 + 6, w - DW / 2 - 6), ab });
      else if (p.pared === "izq") porK.izq.puertas.push({ u: zp, ab });
      else if (p.pared === "der") porK.der.puertas.push({ u: DZ - zp, ab });
    }
    const ESQ = [
      { x: [-T, 0], z: [DZ, DZ + T], a: "atras", b: "izq" }, { x: [w, w + T], z: [DZ, DZ + T], a: "atras", b: "der" },
      { x: [-T, 0], z: [-T, 0], a: "frente", b: "izq" }, { x: [w, w + T], z: [-T, 0], a: "frente", b: "der" },
    ];
    for (const q of ESQ) { const A = porK[q.a], Bm = porK[q.b], d = Bm.h > A.h + 0.5 ? Bm : A; q.h = d.h; q.lejos = d.lejos; }
    const exterior = (M) => [[M.B[0] + M.o[0] * T, M.B[1] + M.o[1] * T], [M.A[0] + M.o[0] * T, M.A[1] + M.o[1] * T]];
    const tapaMuro = (M, h, u0 = 0, u1 = M.L) => {
      const ux = (M.B[0] - M.A[0]) / M.L, uz = (M.B[1] - M.A[1]) / M.L, p = (u, t) => [M.A[0] + ux * u + M.o[0] * t, M.A[1] + uz * u + M.o[1] * t];
      poli([p(u0, 0), p(u1, 0), p(u1, T), p(u0, T)], h, COL.tapa);
      plano(h); ctx.beginPath(); ctx.moveTo(...p(u0, 0)); ctx.lineTo(...p(u1, 0)); ctx.strokeStyle = COL.filo; ctx.lineWidth = 2.2; ctx.stroke();
    };
    const tp2 = texParedR(pared, patron), tl = texLambrin(pared), tpu = texPuerta(colorP);
    const pilares = (lejos) => { for (const q of ESQ) if (q.lejos === lejos) caja(q.x[0], q.x[1], q.z[0], q.z[1], 0, q.h, COL.muro, COL.muroO, COL.tapa); };
    // Las de atrás (de su lado de adentro, con su tapiz).
    pilares(true);
    for (const M of MUROS) {
      if (!M.lejos) continue;
      const L = cara(M.A, M.B, HW);
      ctx.fillStyle = this._pat("p" + pared + patron, tp2.cv, 4); ctx.fillRect(0, 0, L, HW - LAMB);
      ctx.fillStyle = this._pat("l" + pared, tl.cv, LAMB / tl.th, 0, HW - LAMB); ctx.fillRect(0, HW - LAMB, L, LAMB);
      // Su luz: la que mira a la izquierda, más clarita; arriba un poquito más clara; y las esquinas en su sombrita.
      const lz = luzDe(M.n[0], M.n[1]);
      ctx.fillStyle = lz < 0 ? `rgba(255,252,246,${(-lz * 0.1).toFixed(3)})` : `rgba(70,30,60,${(lz * 0.12).toFixed(3)})`; ctx.fillRect(0, 0, L, HW);
      { const g = ctx.createLinearGradient(0, 0, 0, HW); g.addColorStop(0, "rgba(255,255,255,.12)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(70,30,60,.06)"); ctx.fillStyle = g; ctx.fillRect(0, 0, L, HW); }
      for (const [u, s] of [[0, 1], [L, -1]]) { const g = ctx.createLinearGradient(u, 0, u + s * 34, 0); g.addColorStop(0, "rgba(70,30,60,.2)"); g.addColorStop(1, "rgba(70,30,60,0)"); ctx.fillStyle = g; ctx.fillRect(Math.min(u, u + s * 34), 0, 34, HW); }
      // Las puertas.
      for (const p of M.puertas) {
        const x = p.u - DW / 2, y = HW - DH, hx = x + (DW * 2) / 21, hy = y + (DH * 3) / 42, hw = (DW * 17) / 21, hh = (DH * 39) / 42;
        if (p.ab) { ctx.fillStyle = COL.hueco; ctx.fillRect(hx, hy, hw, hh); ctx.drawImage(tpu.hojaCv, hx, hy, hw * 0.3, hh); }
        else ctx.drawImage(tpu.hojaCv, hx, hy, hw, hh);
        ctx.drawImage(tpu.marcoCv, x, y, DW, DH);
      }
      // Lo colgado en la pared de atrás.
      if (M.k === "atras") this._enMuro(ctx, c, ahora);
      // Y la sombrita del piso junto a la pared.
      plano(0);
      { const ux = (M.B[0] - M.A[0]) / M.L, uz = (M.B[1] - M.A[1]) / M.L, n = M.n, g = ctx.createLinearGradient(M.A[0], M.A[1], M.A[0] + n[0] * 44, M.A[1] + n[1] * 44); g.addColorStop(0, "rgba(70,30,60,.2)"); g.addColorStop(1, "rgba(70,30,60,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(M.A[0], M.A[1]); ctx.lineTo(M.B[0], M.B[1]); ctx.lineTo(M.B[0] + n[0] * 44, M.B[1] + n[1] * 44); ctx.lineTo(M.A[0] + n[0] * 44, M.A[1] + n[1] * 44); ctx.closePath(); ctx.fill(); void ux; void uz; }
    }
    for (const M of MUROS) if (M.lejos) tapaMuro(M, HW);

    // ── Las alfombras (en el piso, debajo de todo lo demás) ──
    for (const r of j.objs.values()) if (r.o.c === c && r.d.capa === "alfombra" && !r.n?.hidden) this._alfombra(ctx, r, plano);

    // ── Lo de adentro, de lo más lejano a lo más cercano ──
    const cosas = this._cosas(c, x0, P, TQ, ahora);
    cosas.sort((p, q) => q.z - p.z);
    for (const it of cosas) { try { it.pintar(ctx, base); } catch (e) { /* nada */ } }

    // ── Las paredes de tu lado (bajitas, con el hueco de sus puertas) ──
    pilares(false);
    for (const M of MUROS) {
      if (M.lejos) continue;
      const [Ao, Bo] = exterior(M), L = M.L, h = M.h;
      // Los huecos de las puertas (contados desde la punta B, porque por fuera se ve al revés).
      const huecos = M.puertas.map((p) => [L - p.u - DW / 2, L - p.u + DW / 2]).sort((x, y) => x[0] - y[0]);
      const tramos = []; let u = 0;
      for (const [g0, g1] of huecos) { if (g0 > u) tramos.push([u, g0]); u = Math.max(u, g1); }
      if (u < L) tramos.push([u, L]);
      const lz = luzDe(M.o[0], M.o[1]), col = lz < 0 ? COL.muro : COL.muroO;
      cara(Ao, Bo, h);
      ctx.fillStyle = col;
      for (const [u0, u1] of tramos) ctx.fillRect(u0, 0, u1 - u0, h);
      if (h > DH) for (const [g0, g1] of huecos) ctx.fillRect(g0, 0, g1 - g0, h - DH);
      { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(80,30,60,.1)"); ctx.fillStyle = g; for (const [u0, u1] of tramos) ctx.fillRect(u0, 0, u1 - u0, h); }
      // Los lados del hueco, el umbral y la tapa.
      for (const [g0, g1] of huecos) {
        const ux = (M.B[0] - M.A[0]) / L, uz = (M.B[1] - M.A[1]) / L, ui = (t) => L - t;   // de «desde B» a «desde A»
        const pA = (t, s) => [M.A[0] + ux * ui(t) + M.o[0] * s, M.A[1] + uz * ui(t) + M.o[1] * s];
        poli([pA(g0, 0), pA(g1, 0), pA(g1, T), pA(g0, T)], 0.5, COL.umbral);
        const hh = Math.min(h, DH);
        for (const [t, sgn] of [[g0, 1], [g1, -1]]) {
          const nx = -ux * sgn, nz = -uz * sgn;   // (el lado del hueco mira hacia adentro del hueco)
          if (!ve(nx, nz)) continue;
          const Lj = cara(pA(t, 0), pA(t, T), hh); ctx.fillStyle = COL.muroO; ctx.fillRect(0, 0, Lj, hh);
        }
      }
      for (const [u0, u1] of tramos) tapaMuro(M, h, L - u1, L - u0);
      if (h > DH) for (const [g0, g1] of huecos) tapaMuro(M, h, L - g1, L - g0);
    }

    // ── La noche (o la tarde): oscurito, y las lámparas prendidas alumbran ──
    const apagado = cfg.luz === false;
    const ll = { lluvia: 0.5, tormenta: 0.8, extra: 1 }[j.climaActual?.()] || 0;
    let oscuro = noche ? (apagado ? 0.72 : 0.5) : tarde ? 0.2 : apagado ? 0.36 : 0;
    oscuro = Math.min(0.8, oscuro + ll * 0.1);
    if (oscuro > 0.01) this._noche(ctx, oscuro, noche ? "18,12,46" : tarde ? "120,58,46" : "40,26,60", this._luces(c, P), k, ox, oy);
  }

  /** Lo colgado en la pared de atrás (cuadros, repisas, ventanas…), del tamaño de verdad. Ya está puesta la cara. */
  _enMuro(ctx, c, ahora) {
    const j = this.j;
    for (const r of j.objs.values()) {
      const o = r.o, d = r.d, e = o.e || {};
      if (o.c !== c || d.capa !== "pared" || e.tirado || d.techo || r.n?.hidden) continue;
      const C = colorDe(d, e), v = vistaFrenteYa(d, e, C);
      let img = v ? (v.cv || imagen(v.url, () => (this.sucio = true))) : null, iw = v?.w, ih = v?.h, pad = 4;
      if (!img) { img = imagen(svgUrl(d.arte(e, C), d.w, d.h), () => (this.sucio = true)); iw = d.w; ih = d.h; pad = 0; if (!img) continue; }
      const hb = (PISO - o.y) / FONDO_3D, vb = HW - hb, u = o.x;
      ctx.save();
      ctx.translate(u, vb - d.h);
      if (+e.chueco) ctx.rotate(rad(+e.chueco));
      ctx.save();
      if (o.f) ctx.scale(-1, 1);
      ctx.drawImage(img, -iw / 2, d.h - ih + pad, iw, ih);
      // (Y sus partes vivas encima —las hojas de la maceta, el neón, el cielo de la ventana—, como en la cajita.)
      if (pad) this._vivoPlano(ctx, r, -d.w / 2, 0);
      ctx.restore();
      // (Lo que va encima en la página: las fotos o iniciales de los dos en «Nuestras fotos».)
      if (d.dom) this._fotos(ctx, r, -d.w / 2, 0);
      ctx.restore();
    }
    void ahora;
  }
  /** Una alfombra: su dibujo acostado en el piso (lo que en la cajita se veía de lado, aquí mide lo hondo de verdad). */
  _alfombra(ctx, r, plano) {
    const o = r.o, d = r.d, e = o.e || {}, C = colorDe(d, e), v = vistaFrenteYa(d, e, C);
    let img = v ? (v.cv || imagen(v.url, () => (this.sucio = true))) : null, iw = v?.w || d.w, ih = v?.h || d.h, pad = v ? 4 : 0;
    if (!img) { img = imagen(svgUrl(d.arte(e, C), d.w, d.h), () => (this.sucio = true)); iw = d.w; ih = d.h; pad = 0; }
    if (!img) return;
    const prof = (d.h * 1) / E, zf = hondo(o.y), zt = zf + prof, sc = prof / d.h;
    plano(0.2);
    ctx.translate(o.x, zt);
    ctx.scale(o.f ? -1 : 1, -sc);
    ctx.drawImage(img, -iw / 2, -pad, iw, ih);
  }

  /** La lista de lo que hay adentro (muebles, cositas, lo que cuelga del techo y los monitos), cada uno con lo hondo
   *  con que se ordena y cómo se pinta. */
  _cosas(c, x0, P, TQ, ahora) {
    const j = this.j, lista = [], vol = [];
    const sentados = new Map();
    for (const m of [j.yo, j.suyo]) if (m?._3d?.r && m._3dUlt && !m.n?.hidden) { const id = m._3d.r.o.id; if (!sentados.has(id)) sentados.set(id, []); sentados.get(id).push(m); }
    for (const r of j.objs.values()) {
      const o = r.o, d = r.d, e = o.e || {};
      if (o.c !== c || r.n?.hidden || d.capa === "alfombra") continue;
      if (d.capa === "pared" && !e.tirado) {
        if (!d.techo) continue;
        // Lo que cuelga del techo: a media altura del cuarto, de frente (la cuerdita llega hasta arriba).
        const p = P(o.x, DZ * 0.5, HW);
        lista.push({ z: p[2], pintar: (ctx, base) => this._cartel(ctx, base, r, p, true) });
        continue;
      }
      // ¿Está encima de un mueble? Entonces va a la altura de su tapa y un poquito más adelante que el mueble.
      let h = 0, zc, zOrden = null;
      const a = puedeSubirse(d) ? j._encima(r.gx, o.y, o.id) : null;
      if (a) {
        const s = a.r;
        h = Math.max(0, s.o.y - a.y);
        zc = hondo(s.o.y) + lim((a.y - o.y) / E, 0, Math.max(0, hondura(s.d) - 8)) + 6;
        zOrden = P(s.o.x, hondo(s.o.y) + hondura(s.d) / 2)[2] - 0.5 - (a.y - o.y) * 0.001;
      } else zc = hondo(o.y) + hondura(d) / 2;
      const p = P(o.x, zc, h), z = zOrden ?? p[2], monos = sentados.get(o.id) || [];
      if (!a && this._conVolumen(r)) {
        const g0 = j._giro(d, o), f = !!o.f, gq = norm(f ? g0 - TQ : g0 + TQ);
        vol.push({ r, g0, f });
        lista.push({ z, pintar: (ctx, base) => {
          const [v, gv] = this._vistaEn(r, gq, g0, f);
          if (gv !== gq || !v) this._faltan++;
          if (!v) { this._cartel(ctx, base, r, p, false, monos); return; }
          const img = v.cv || imagen(v.url, () => (this.sucio = true));
          if (!img) { this._faltan++; this._cartel(ctx, base, r, p, false, monos); return; }
          base(); ctx.translate(p[0], p[1]); if (f) ctx.scale(-1, 1);
          this._vivo(ctx, r, v, false);
          ctx.drawImage(img, -v.ax, -v.ay, v.w, v.h);
          this._vivo(ctx, r, v, true);
          for (const m of monos.sort((x, y) => (y._3dUlt?.[1]?.[2] ?? 0) - (x._3dUlt?.[1]?.[2] ?? 0))) this._sentado(ctx, m, v, gv, null);
        } });
      } else lista.push({ z, pintar: (ctx, base) => this._cartel(ctx, base, r, p, false, monos) });
    }
    this._vol = vol;
    // Los monitos (de pie o caminando; los sentados van con su mueble).
    for (const m of [j.yo, j.suyo]) {
      if (!m || m._3d || m.n?.hidden || !m.ropa) continue;
      const pos = this._donde(m, ahora);
      if (enCuarto(pos.gx).c !== c) continue;
      const M = this._modelo(m);
      if (!M) continue;
      const x = pos.gx - x0, z = hondo(pos.y), p = P(x, z, 0);
      if (pos.mov) this._caminan = true;
      lista.push({ z: p[2], pintar: (ctx, base) => this._monito(ctx, base, m, M, pos, p, TQ, ahora) });
    }
    return lista;
  }
  /** Lo que se ve de frente desde cualquier lado (lo chiquito, lo redondo, las mascotas, tus fotos…): su dibujo de
   *  siempre, parado en su lugar. */
  _cartel(ctx, base, r, p, colgado, monos = []) {
    const d = r.d, o = r.o, e = o.e || {}, C = colorDe(d, e), bajo = colgado ? 0 : (hondura(d) * E) / 2;
    // (ax, ay): el punto de la imagen que va en su lugar; (bx, by): dónde empieza el dibujo de siempre en la imagen.
    let v = null, ax = 0, ay = 0, bx = 0, by = 0, img = null, girada = false;
    if (d.propio) { v = d.vista?.(); if (v) { ax = v.w / 2; ay = v.h - bajo; by = v.h - d.h; bx = (v.w - d.w) / 2; } }
    else if (r.vg && !colgado) { v = r.vg; ax = v.ax; ay = v.ay; girada = true; }
    else {
      v = vistaFrenteYa(d, e, C);
      if (v && v.ax != null && v.fx != null) { ax = v.ax; ay = v.ay; bx = v.fx; by = v.fy; }
      else if (v) { ax = v.w / 2; ay = v.h - 4 - bajo; bx = 4; by = 4; }
    }
    if (v) img = v.cv || imagen(v.url, () => (this.sucio = true));
    let w = v?.w, h = v?.h;
    if (!img) { img = imagen(svgUrl(d.arte(e, C), d.w, d.h), () => (this.sucio = true)); w = d.w; h = d.h; ax = d.w / 2; ay = d.h - bajo; bx = 0; by = 0; girada = false; }
    if (!img) return;
    base(); ctx.translate(p[0], p[1]);
    if (colgado) ctx.translate(0, d.h);   // (cuelga: lo de arriba del dibujo queda en el techo)
    if (o.f) ctx.scale(-1, 1);
    ctx.drawImage(img, -ax, -ay, w, h);
    // Sus partes vivas encima (la flamita, la pantalla, las hojas…): con la vista girada, en su plano; con la de frente,
    // en el dibujo de siempre.
    if (girada) { ctx.save(); ctx.translate(ax - v.ax, ay - v.ay); this._vivo(ctx, r, { ...v, ax: v.ax, ay: v.ay }, true); ctx.restore(); }
    else if (v && !d.propio) this._vivoPlano(ctx, r, bx - ax, by - ay);
    // Si alguien está sentado aquí (una silla chiquita, la hamaca, o mientras se prepara la vista de este ángulo), con
    // la vista de siempre de ese mueble, igualito que en la cajita.
    for (const m of monos) {
      const S = m._3d;
      if (!S) continue;
      if (girada && S.v?.H) this._sentado(ctx, m, S.v, S.g, null);
      else this._sentado(ctx, m, S.v, S.g, { x: bx - ax, y: by - ay });
    }
  }
  /** Las partes vivas de una cosa vista de frente, encima de su dibujo de siempre (que empieza en x, y): una «foto» del
   *  dibujo tal como se ve ahorita en la cajita (la cortina abierta o cerrada, el cielo de la ventana según la hora, las
   *  letras del cuadro, la lámpara prendida…), con lo quieto transparente, igual que en la vista de siempre. */
  _vivoPlano(ctx, r, x, y) {
    const url = this._foto(r);
    if (!url) return;
    const img = imagen(url, () => (this.sucio = true));
    if (img) ctx.drawImage(img, x, y, r.d.w, r.d.h);
  }
  /** Las fotitas (o iniciales) que van encima de un cuadro, donde están en la cajita. */
  _fotos(ctx, r, x0, y0) {
    const d = r.d, k = "fotos|" + r.o.id + "|" + JSON.stringify(r.o.e || {}) + "|" + (r.n?.querySelector(".ca-fotos-dentro")?.innerHTML.length || 0);
    let lista = VIVOS.get(k);
    if (lista == null) {
      lista = [];
      try {
        const A = r.n.querySelector(":scope > .ca-obj-arte")?.getBoundingClientRect(), sx = A ? A.width / d.w : 0, sy = A ? A.height / d.h : 0;
        if (sx > 0 && sy > 0) for (const f of r.n.querySelectorAll(".ca-foto")) {
          const R = f.getBoundingClientRect(), cs = getComputedStyle(f), im = f.querySelector("img");
          if (R.width < 1) continue;
          lista.push({ x: (R.left - A.left) / sx, y: (R.top - A.top) / sy, w: R.width / sx, h: R.height / sy, src: im?.currentSrc || im?.src || "", txt: (f.textContent || "").trim().slice(0, 3), bg: /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) ? (/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i.exec(cs.backgroundImage || "")?.[0] || "#ff9cbf") : cs.backgroundColor, col: cs.color, fs: parseFloat(cs.fontSize) / sy, fw: cs.fontWeight, ff: cs.fontFamily, rad: parseFloat(cs.borderTopLeftRadius) / sx || 0 });
        }
      } catch (e) { lista = []; }
      VIVOS.set(k, lista);
    }
    for (const f of lista) {
      const x = x0 + f.x, y = y0 + f.y, rr = Math.min(f.rad, f.w / 2, f.h / 2);
      ctx.save();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, f.w, f.h, rr) : ctx.rect(x, y, f.w, f.h); ctx.clip();
      ctx.fillStyle = f.bg; ctx.fillRect(x, y, f.w, f.h);
      const im = f.src ? imagen(f.src, () => (this.sucio = true)) : null;
      if (im) ctx.drawImage(im, x, y, f.w, f.h);
      else if (f.txt) { ctx.fillStyle = f.col; ctx.font = `${f.fw} ${f.fs.toFixed(1)}px ${f.ff}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(f.txt, x + f.w / 2, y + f.h / 2 + f.fs * 0.04); }
      ctx.restore();
    }
  }
  _foto(r) {
    const sv = r.n?.querySelector(":scope > .ca-obj-arte > svg");
    if (!sv) return "";
    const j = this.j, k = r.o.id + "|" + JSON.stringify(r.o.e || {}) + "|" + (j.mundo?.className || "") + "|" + r.n.className + "|" + sv.childElementCount;
    let url = VIVOS.get(k);
    if (url != null) return url;
    url = "";
    try {
      const copia = sv.cloneNode(true), de = [sv, ...sv.querySelectorAll("*")], a = [copia, ...copia.querySelectorAll("*")];
      let hay = false;
      for (let i = 0; i < de.length; i++) {
        const cs = getComputedStyle(de[i]), n = a[i];
        if (!n || n.nodeName === "style" || n.nodeName === "defs") continue;
        if (cs.display === "none") { n.setAttribute("style", "display:none"); continue; }
        let st = `opacity:${cs.opacity};fill:${cs.fill};fill-opacity:${cs.fillOpacity};stroke:${cs.stroke};stroke-opacity:${cs.strokeOpacity};`;
        if (cs.transform && cs.transform !== "none" && i) st += `transform:${cs.transform};transform-origin:${cs.transformOrigin};transform-box:${cs.transformBox};`;
        n.setAttribute("style", st);
        // (La visibilidad no se copia: mientras se ve el 3D, la cajita de abajo está escondida y todo saldría escondido.)
        if (i && +cs.opacity > 0.02) hay = true;
      }
      copia.removeAttribute("class");
      if (hay) url = svgUrl(new XMLSerializer().serializeToString(copia), r.d.w, r.d.h);
    } catch (e) { url = ""; }
    VIVOS.set(k, url);
    if (VIVOS.size > 300) VIVOS.delete(VIVOS.keys().next().value);
    return url;
  }
  /** Las partes vivas de un mueble girado (la pantalla, la flamita…): quietas aquí, en su lugar. */
  _vivo(ctx, r, v, enfrente) {
    if (!v.vivo || !v.matriz || !!v.frente !== enfrente) return;
    const img = imagen(svgUrl(v.vivo, r.d.w, r.d.h), () => (this.sucio = true));
    if (!img) return;
    ctx.save(); ctx.translate(-v.ax, -v.ay); ctx.transform(...v.matriz); ctx.drawImage(img, 0, 0, r.d.w, r.d.h); ctx.restore();
  }
  /** Un monito sentado o acostado adentro de su mueble (con lo hondo del mueble, para que lo de enfrente lo tape).
   *  `arte`: dónde empieza el dibujo de siempre del mueble (cuando se ve de frente y no con su vista de volumen). */
  _sentado(ctx, m, v, gv, arte) {
    const S = m._3d, U = m._3dUlt;
    if (!S || !U) return;
    const d = S.r.d, cara = m._cara3d || (m.accion === "dormido" ? "dormido" : m.accion === "banando" || m.accion === "columpio" ? "feliz" : "normal");
    const im = pintar(S.M, U[0], { clave: S.clave, g: gv, yaw: U[3] ?? S.L.yaw, ancla: U[1], ancla3d: U[2], cel: S.cel, vg: v?.zb ? v : null, cara, sinUrl: true });
    if (arte) ctx.drawImage(im.cv, arte.x + d.w / 2 + im.x, arte.y + im.y - (v?.H ? v.H * 4 : d.h) + d.h - (hondura(d) * E) / 2, im.w, im.h);
    else if (v?.H) ctx.drawImage(im.cv, im.x, im.y - v.H * 4, im.w, im.h);
  }
  /** Dónde va ahorita un monito (a medio paso, sin tocar lo suyo) y si va caminando. */
  _donde(m, ahora) {
    const Q = m._paso;
    if (Q && Q.ms > 0) {
      const t = ahora - Q.t0;
      if (t >= 0 && t < Q.ms) {
        const f = t / Q.ms, q = Q.frena ? 1 - (1 - f) * (1 - f) : f;
        return { gx: Q.gx0 + (Q.gx1 - Q.gx0) * q, y: Q.y0 + (Q.y1 - Q.y0) * q, mov: true, dx: Q.gx1 - Q.gx0, dz: hondo(Q.y1) - hondo(Q.y0) };
      }
    }
    return { gx: m.gx, y: m.y, mov: false };
  }
  _modelo(m) {
    const k = JSON.stringify(m.ropa || {});
    const ya = this.modelos.get(k);
    if (ya && ya !== "…") return ya;
    if (!ya) { this.modelos.set(k, "…"); modelo(m.ropa).then((M) => { this.modelos.set(k, M); this.sucio = true; }, () => this.modelos.delete(k)); }
    return null;
  }
  /** Un monito de pie: mira hacia donde camina (moviendo piernas y brazos) o hacia donde estaba viendo. */
  _monito(ctx, base, m, M, pos, p, TQ, ahora) {
    let yaw;
    if (pos.mov && Math.hypot(pos.dx, pos.dz) > 1) yaw = (Math.atan2(pos.dx, -pos.dz) * 180) / Math.PI;
    else if (m.n?.classList.contains("atras")) yaw = 180;
    else if (m.n?.classList.contains("lado")) yaw = (m.mira || 1) * 90;
    else yaw = (m.mira || 1) * 18;
    const yq = Math.round(yaw / PASO) * PASO, cel = CEL * (m.alto || 1);
    const paso = pos.mov ? [0, 1, 0, -1][Math.floor(ahora / 135) % 4] : 0;
    const pose = paso ? { ...POSES.parado, zancada: paso * 26 } : POSES.parado;
    // Parpadea cada ratito (cada quien a su ritmo).
    const ritmo = m === this.j.yo ? 4100 : 4700, cara = !pos.mov && ahora % ritmo < 140 ? "dormido" : "normal";
    const im = pintar(M, pose, { clave: JSON.stringify(m.ropa) + (m.alto || 1), g: TQ, yaw: yq, ancla: [0, 0, 0], ancla3d: "cadera", cel, cara, sinUrl: true });
    const cadera = (M.pie - M.cadera) * cel;
    // Su sombrita en el piso.
    base();
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, E); ctx.beginPath(); ctx.arc(0, 0, 17 * (m.alto || 1), 0, Math.PI * 2); ctx.fillStyle = "rgba(80,30,64,.22)"; ctx.fill(); ctx.restore();
    ctx.drawImage(im.cv, p[0] + im.x, p[1] - cadera + im.y + (paso ? -1.2 : 0), im.w, im.h);
  }
  /** Las lámparas prendidas de este cuarto, en el 3D (dónde y qué tan lejos alumbran). */
  _luces(c, P) {
    const j = this.j, lista = [];
    for (const r of j.objs.values()) {
      if (r.o.c !== c || !r.glow || !r.glow.classList.contains("on") || !r.d.brilla) continue;
      const b = r.d.brilla, o = r.o, d = r.d, dx = (o.f ? d.w - b.x : b.x) - d.w / 2;
      let p;
      if (d.capa === "pared" && d.techo) p = P(o.x + dx, DZ * 0.5, HW - b.y);
      else if (d.capa === "pared") p = P(o.x + dx, DZ - 4, (PISO - o.y) / FONDO_3D + d.h - b.y);
      else p = P(o.x + dx, hondo(o.y) + hondura(d) / 2, d.h - b.y);
      const n = /^#?([0-9a-f]{6})$/i.exec(b.c || "") ? parseInt(b.c.replace("#", ""), 16) : 0xfff1d0;
      lista.push({ p, r: b.cuarto ? 1100 : Math.max(170, b.r * 2.2), i: b.cuarto ? 1 : 0.9, c: [n >> 16, (n >> 8) & 255, n & 255] });
    }
    return lista;
  }
  _noche(ctx, oscuro, tinta, luces, k, ox, oy) {
    const cv = this.cv, q = 0.34, W = Math.max(1, Math.round(cv.width * q)), Hh = Math.max(1, Math.round(cv.height * q));
    const mc = this._mc || (this._mc = document.createElement("canvas"));
    if (mc.width !== W || mc.height !== Hh) { mc.width = W; mc.height = Hh; }
    const m = mc.getContext("2d");
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = "source-over"; m.clearRect(0, 0, W, Hh);
    m.fillStyle = `rgba(${tinta},${oscuro.toFixed(3)})`; m.fillRect(0, 0, W, Hh);
    m.globalCompositeOperation = "destination-out";
    for (const L of luces) {
      const x = (ox + L.p[0] * k) * q, y = (oy + L.p[1] * k) * q, rr = L.r * k * q;
      const g = m.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(0,0,0,${(0.95 * L.i).toFixed(3)})`); g.addColorStop(0.42, `rgba(0,0,0,${(0.55 * L.i).toFixed(3)})`); g.addColorStop(1, "rgba(0,0,0,0)");
      m.fillStyle = g; m.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const suav = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(mc, 0, 0, cv.width, cv.height);
    // El brillito cálido alrededor de cada luz.
    ctx.globalCompositeOperation = "lighter";
    for (const L of luces) {
      const x = ox + L.p[0] * k, y = oy + L.p[1] * k, rr = Math.min(L.r, 230) * k, g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, `rgba(${L.c.join(",")},${(0.2 * L.i * oscuro).toFixed(3)})`); g.addColorStop(1, `rgba(${L.c.join(",")},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = suav;
  }
}
/** Lo que se puede poner encima de un mueble (lo mismo que en index.js). */
const puedeSubirse = (d) => d.capa === "piso" && d.h <= 120 && d.tope == null && !d.topes && !d.superficie;
