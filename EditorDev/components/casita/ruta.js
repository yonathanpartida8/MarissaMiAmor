/**
 * NAVEGACIÓN (Fase 63): el monito busca su camino rodeando los muebles.
 *
 *   · Cada cuarto tiene una rejilla del piso (cuadritos de 12): lo que ocupa cada mueble del piso (su «huella»:
 *     lo ancho de abajo y un poquito de fondo) se marca como ocupado, inflado lo que mide el monito.
 *   · Con A* (8 direcciones, sin cortar esquinas) se busca la ruta más corta; luego se «estira» (se quitan los
 *     puntos de en medio que se ven en línea recta) para que camine derechito y suave, no en zigzag.
 *   · Si el destino cae dentro de un mueble, va al lugar libre más cercano; si no hay manera de llegar, al punto
 *     alcanzable más cercano (nunca atraviesa nada para llegar).
 *   · La rejilla se rehace sólo cuando cambia algo en ese cuarto.
 */
import { cuarto, inicioDe, FONDO, frenteDe } from "./cuartos.js";
import { pisable } from "./exterior.js";
import { giroDe, huellaGirada, hondura, rasterizar } from "./girar.js";

const CEL = 8, RX = 11, RY = 5, ORILLA = 14, PESO_Y = 1.6;
/** (Fase 65) Lo que de verdad toca el piso de cada dibujo (medido de su silueta: las patas, la base), por tipo. */
const BASES = new Map();
export function medirBase(d, alListo) {
  if (BASES.has(d.k)) return BASES.get(d.k);
  BASES.set(d.k, null);
  const W = Math.max(2, Math.ceil(d.w / 4)), H = Math.max(2, Math.ceil(d.h / 4));
  rasterizar(d.arte({}, d.colores?.[0] || null), W, H).then((px) => {
    let vb = -1;
    for (let v = H - 1; v >= 0 && vb < 0; v--) for (let u = 0; u < W; u++) if (px[(v * W + u) * 4 + 3] > 100) { vb = v; break; }
    if (vb < 0) { BASES.set(d.k, { nada: true }); alListo?.(); return; }
    const banda = Math.max(2, Math.round(H * 0.14));
    let u0 = W, u1 = -1;
    for (let v = Math.max(0, vb - banda); v <= vb; v++) for (let u = 0; u < W; u++) if (px[(v * W + u) * 4 + 3] > 100) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
    // (Si lo de abajo está muy arriba del piso del dibujo, es algo que cuelga o flota: no estorba.)
    BASES.set(d.k, vb < H * 0.72 ? { nada: true } : { a: (u0 * 4) / d.w, b: ((u1 + 1) * 4) / d.w });
    alListo?.();
  }).catch(() => BASES.set(d.k, { a: 0.5 - (d.pie ?? 0.42), b: 0.5 + (d.pie ?? 0.42) }));
  return null;
}

export class Navegacion {
  constructor(j) { this.j = j; this.cache = new Map(); }
  invalidar(c) { if (c) this.cache.delete(c); else this.cache.clear(); }
  /** La huella de un mueble en el piso (coordenadas del mundo), o null si no estorba. */
  huella(r) {
    const d = r.d, j = this.j;
    if (d.capa !== "piso" || d.mascota || d.noEstorba || r.o.id === j.arrastrandoId) return null;
    if (d.larga && r.o.e?.pose === "suelo") return null;      // (Fase 65) una escoba tirada se pasa por encima
    if (j._esEncima?.(r)) return null;                       // lo que está encima de una mesa no estorba en el piso
    // (Fase 65) La huella es lo que de verdad toca el piso (su base medida), no el ancho de todo el dibujo.
    const b = d.pie == null ? medirBase(d, () => this.invalidar(r.o.c)) : null;
    if (b?.nada) return null;
    const sx = r.o.f ? -1 : 1, ca = b ? (b.a + b.b) / 2 - 0.5 : 0, cx = r.gx + ca * d.w * sx;
    const medio = b ? Math.max(8, ((b.b - b.a) * d.w) / 2) : d.w * (d.pie ?? 0.42), fondo = Math.max(10, Math.min(56, d.fondo ?? hondura(d) * 0.42)), g = j._girable?.(d) ? giroDe(r.o) : 0;
    if (g) { const G = huellaGirada(d, g, medio, fondo), cy = r.o.y - fondo / 2; return { x0: r.gx - G.medio, x1: r.gx + G.medio, y0: cy - G.fondo / 2, y1: cy + G.fondo / 2 + 3 }; }   // (Fase 64: girado)
    return { x0: cx - medio, x1: cx + medio, y0: r.o.y - fondo, y1: r.o.y + 3 };
  }
  _rejilla(c) {
    const ya = this.cache.get(c);
    if (ya) return ya;
    const cu = cuarto(c), x0 = inicioDe(c), W = Math.ceil(cu.w / CEL), H = Math.floor((frenteDe(c) - FONDO) / CEL) + 1;
    const bloq = new Uint8Array(W * H);
    const marca = (a, b, y0, y1) => {
      const i0 = Math.max(0, Math.floor((a - x0) / CEL)), i1 = Math.min(W - 1, Math.floor((b - x0) / CEL));
      const j0 = Math.max(0, Math.floor((y0 - FONDO) / CEL)), j1 = Math.min(H - 1, Math.floor((y1 - FONDO) / CEL));
      for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) bloq[jj * W + ii] = 1;
    };
    // Las paredes de los lados (un poquito de orilla).
    if (!cu.mapa) { marca(x0 - 99, x0 + ORILLA, FONDO, frenteDe(c)); marca(x0 + cu.w - ORILLA, x0 + cu.w + 99, FONDO, frenteDe(c)); }
    else {
      // (Fase 64) El patio: el agua, las espinas, el barranco, los setos y la casa no se pisan (lo dice el terreno),
      // ni los troncos, las rocas y la fuente del escenario.
      for (let jj = 0; jj < H; jj++) for (let ii = 0; ii < W; ii++) {
        const x = (ii + 0.5) * CEL, y = FONDO + jj * CEL;
        if (!pisable(x, y) || !pisable(x - 9, y) || !pisable(x + 9, y) || !pisable(x, y - 5)) bloq[jj * W + ii] = 1;
      }
      for (const h of this.j.patio?.huellas() || []) marca(x0 + h.x0 - RX * 0.6, x0 + h.x1 + RX * 0.6, h.y0 - RY, h.y1 + RY);
    }
    for (const r of this.j.objs.values()) {
      if (r.o.c !== c) continue;
      const h = this.huella(r);
      if (h) marca(h.x0 - RX, h.x1 + RX, h.y0 - RY, h.y1 + RY);
    }
    const g = { c, x0, W, H, bloq };
    this.cache.set(c, g);
    return g;
  }
  _celda(g, gx, y) { return [Math.max(0, Math.min(g.W - 1, Math.floor((gx - g.x0) / CEL))), Math.max(0, Math.min(g.H - 1, Math.round((y - FONDO) / CEL)))]; }
  _punto(g, i, jj) { return [g.x0 + (i + 0.5) * CEL, FONDO + jj * CEL]; }
  libreEn(c, gx, y) { const g = this._rejilla(c), [i, jj] = this._celda(g, gx, y); return !g.bloq[jj * g.W + i]; }
  /** El lugar libre más cercano a (gx, y) en el cuarto c. */
  libre(c, gx, y) {
    const g = this._rejilla(c), [i0, j0] = this._celda(g, gx, y);
    if (!g.bloq[j0 * g.W + i0]) return [gx, y];
    for (let r = 1; r < Math.max(g.W, g.H); r++) {
      let mejor = null, md = 1e9;
      for (let jj = j0 - r; jj <= j0 + r; jj++) for (let ii = i0 - r; ii <= i0 + r; ii++) {
        if (ii < 0 || jj < 0 || ii >= g.W || jj >= g.H || Math.max(Math.abs(ii - i0), Math.abs(jj - j0)) !== r || g.bloq[jj * g.W + ii]) continue;
        const dd = Math.hypot(ii - i0, (jj - j0) * PESO_Y);
        if (dd < md) { md = dd; mejor = [ii, jj]; }
      }
      if (mejor) return this._punto(g, ...mejor);
    }
    return [gx, y];
  }
  /** ¿Se ve en línea recta (sin pasar por nada ocupado) de una celda a otra? */
  _directo(g, a, b) {
    const [x0, y0] = a, [x1, y1] = b, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (let k = 0; k <= n; k++) {
      const t = n ? k / n : 0, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (const [ii, jj] of [[Math.floor(x + 0.5), Math.floor(y + 0.5)], [Math.floor(x + 0.25), Math.floor(y + 0.75)], [Math.floor(x + 0.75), Math.floor(y + 0.25)]]) if (g.bloq[jj * g.W + ii]) return false;
    }
    return true;
  }
  /** La ruta de (ax, ay) a (bx, by) dentro del cuarto c: puntos a seguir (sin el de salida); el último es el destino. */
  ruta(c, ax, ay, bx, by) {
    const g = this._rejilla(c), W = g.W, N = W * g.H;
    const [bxl, byl] = this.libre(c, bx, by), meta = this._celda(g, bxl, byl);
    // (Fase 65) Si el monito quedó dentro de la orilla de algo (al pararse del sillón, si movieron un mueble junto a él),
    // primero sale al lugar libre más cercano; antes se quedaba atorado sin poder caminar.
    let sale = this._celda(g, ax, ay), salida = null;
    if (g.bloq[sale[1] * W + sale[0]]) { const L = this.libre(c, ax, ay); if (Math.hypot(L[0] - ax, L[1] - ay) > 2) { salida = L; sale = this._celda(g, L[0], L[1]); } }
    const fin = meta[1] * W + meta[0], ini = sale[1] * W + sale[0];
    const con = (l) => (salida ? [salida, ...l] : l);
    if (ini === fin) return con([[bxl, byl]]);
    // Línea recta libre: sin rodeos.
    const bloqIni = g.bloq[ini]; g.bloq[ini] = 0;
    if (this._directo(g, sale, meta)) { g.bloq[ini] = bloqIni; return con([[bxl, byl]]); }
    const gc = new Float32Array(N).fill(Infinity), de = new Int32Array(N).fill(-1), cerrado = new Uint8Array(N);
    const hz = (k) => { const x = k % W, y = (k / W) | 0, dx = Math.abs(x - meta[0]), dy = Math.abs(y - meta[1]) * PESO_Y; return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy); };
    // Montículo binario chiquito para la lista abierta.
    const heap = [], f = new Float32Array(N);
    const push = (k) => { heap.push(k); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (f[heap[p]] <= f[heap[i]]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && f[heap[l]] < f[heap[m]]) m = l; if (r < heap.length && f[heap[r]] < f[heap[m]]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    gc[ini] = 0; f[ini] = hz(ini); push(ini);
    let cerca = ini, cercaH = hz(ini);
    const VEC = [[1, 0, 1], [-1, 0, 1], [0, 1, PESO_Y], [0, -1, PESO_Y], [1, 1, Math.hypot(1, PESO_Y)], [1, -1, Math.hypot(1, PESO_Y)], [-1, 1, Math.hypot(1, PESO_Y)], [-1, -1, Math.hypot(1, PESO_Y)]];
    while (heap.length) {
      const k = pop();
      if (cerrado[k]) continue;
      cerrado[k] = 1;
      if (k === fin) break;
      const h = hz(k);
      if (h < cercaH) { cercaH = h; cerca = k; }
      const x = k % W, y = (k / W) | 0;
      for (const [dx, dy, cst] of VEC) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= g.H) continue;
        const n = ny * W + nx;
        if (g.bloq[n] || cerrado[n]) continue;
        if (dx && dy && (g.bloq[y * W + nx] || g.bloq[ny * W + x])) continue;   // sin cortar esquinas
        const ng = gc[k] + cst;
        if (ng < gc[n]) { gc[n] = ng; de[n] = k; f[n] = ng + hz(n); push(n); }
      }
    }
    const llega = cerrado[fin] ? fin : cerca;
    const celdas = [];
    for (let k = llega; k !== -1; k = de[k]) celdas.push([k % W, (k / W) | 0]);
    celdas.reverse();
    // Estirar la ruta: sólo quedan las esquinas necesarias.
    const puntos = [];
    let ancla = celdas[0];
    for (let i = 1; i < celdas.length; i++) {
      if (i === celdas.length - 1 || !this._directo(g, ancla, celdas[i + 1])) { puntos.push(celdas[i]); ancla = celdas[i]; }
    }
    g.bloq[ini] = bloqIni;
    const ruta = puntos.map(([i, jj]) => this._punto(g, i, jj));
    if (llega === fin) ruta[ruta.length - 1] = [bxl, byl]; else if (!ruta.length) ruta.push(this._punto(g, ...celdas[celdas.length - 1]));
    return con(ruta.length ? ruta : [[bxl, byl]]);
  }
}
