/**
 * EL MOTOR DEL DIBUJITO (Fases 47–48) — sólo lo que pinta, sin nada de pantalla. Lo usan el estudio
 * (estudio-dibujo.js) y quien lo recibe en Detallitos, para que el dibujito se redibuje solito.
 *
 * La hoja mide W × H unidades (3 : 4 = 1080 × 1440, o el tamaño que elijas). Cada cosa que haces es una
 * operación que se guarda:
 *   { k: "trazo", h: herramienta, c: color, o: opacidad, s: grosor, p: [x, y, f, x, y, f…] }   (f = cuánto engorda, en %)
 *   { k: "relleno", x, y, c, o, z }   la cubeta (z = el zoom con que se rellenó, en la hoja infinita)
 *   { k: "limpiar" }                  la basura (también se deshace)
 *
 * «Vista» = cómo se mira el mundo: { s: zoom, x, y: la esquina de arriba, k: pixeles del lienzo por unidad }.
 * La hoja normal es la vista { s: 1, x: 0, y: 0, k: 1 }; la infinita guarda los trazos en el mundo y los vuelve a
 * pintar con la vista de cada momento (por eso, al acercarte, aparecen los dibujitos chiquitos de adentro).
 *
 * Sin rastros raros: un trazo con transparencia, textura (lápiz, crayón) o que se borra a medias se pinta ENTERO
 * aparte y después se pega una sola vez (si no, las uniones de cada pedacito salen más oscuras).
 */
export const ANCHO = 1080, ALTO = 1440;
export const TAMANOS = { "3:4": [1080, 1440], "1:1": [1200, 1200], "9:16": [1080, 1920], "4:3": [1440, 1080] };
export const VISTA = { s: 1, x: 0, y: 0, k: 1 };

/** Los pinceles: los esenciales y nada más. `var` = el grosor cambia con la presión o la velocidad. */
export const PINCELES = {
  plumon: { n: "Plumón", s: 14, var: false },
  pincel: { n: "Pincel", s: 22, var: true },
  lapiz: { n: "Lápiz", s: 7, var: true },
  crayon: { n: "Crayón", s: 20, var: true },
  neon: { n: "Neón", s: 12, var: false },
  borrador: { n: "Borrador", s: 44, var: false },
};

const pts = (op) => op.p.length / 3;

/** Una línea suave por los puntos (por los puntos medios: sin picos). */
function camino(ctx, p, n) {
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  if (n === 1) { ctx.lineTo(p[0] + 0.01, p[1]); return; }
  for (let i = 1; i < n - 1; i++) {
    const x = p[i * 3], y = p[i * 3 + 1];
    ctx.quadraticCurveTo(x, y, (x + p[i * 3 + 3]) / 2, (y + p[i * 3 + 4]) / 2);
  }
  ctx.lineTo(p[(n - 1) * 3], p[(n - 1) * 3 + 1]);
}

/* La textura del lápiz (grano fino) y del crayón (grano grueso, con huequitos): una por color, guardada. */
const GRANO = new Map();
function grano(ctx, color, grueso) {
  const clave = color + (grueso ? "|c" : "|l");
  let t = GRANO.get(clave);
  if (!t) {
    const L = grueso ? 64 : 96, c = document.createElement("canvas"); c.width = c.height = L;
    const g = c.getContext("2d"), im = g.createImageData(L, L);
    for (let i = 0; i < im.data.length; i += 4) {
      im.data[i + 3] = grueso ? (Math.random() < 0.3 ? 0 : 170 + Math.random() * 85) : (Math.random() < 0.18 ? 40 : 150 + Math.random() * 105);
    }
    g.putImageData(im, 0, 0);
    if (grueso) { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 26; i++) { g.fillRect(Math.random() * L, Math.random() * L, 1 + Math.random() * 4, 1); } g.globalCompositeOperation = "source-over"; }
    g.globalCompositeOperation = "source-in"; g.fillStyle = color; g.fillRect(0, 0, L, L);
    if (GRANO.size > 32) GRANO.delete(GRANO.keys().next().value);
    GRANO.set(clave, t = c);
  }
  return ctx.createPattern(t, "repeat");
}

/** Mezcla un color con blanco (el centro brillante del neón). */
function aclarar(c, k) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/** Lo que ocupa un trazo en el mundo (guardado). */
const CAJAS = new WeakMap();
export function cajaDe(op) {
  // (Se guarda junto con cuántos puntos tenía: mientras se dibuja, el trazo crece y su caja también.)
  const g = CAJAS.get(op);
  if (g && g.n === op.p.length) return g.z;
  if (op.k !== "trazo") return null;
  let z;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < op.p.length; i += 3) { const x = op.p[i], y = op.p[i + 1]; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  const m = op.s * (op.h === "neon" ? 2.6 : 1.4) + 1;
  z = [x0 - m, y0 - m, x1 + m, y1 + m];
  CAJAS.set(op, { n: op.p.length, z });
  return z;
}

/* La hoja de apoyo para pegar un trazo entero de una sola vez. */
let apoyo = null;
function hojaApoyo(w, h) {
  if (!apoyo) apoyo = document.createElement("canvas");
  if (apoyo.width < w || apoyo.height < h) { apoyo.width = Math.max(apoyo.width, w); apoyo.height = Math.max(apoyo.height, h); }
  return apoyo;
}

/** Los pixeles (en el lienzo) que ocupa un trazo con esa vista. */
function rect(op, v, W, H) {
  const z = cajaDe(op), e = v.s * v.k;
  const x0 = Math.max(0, Math.floor((z[0] - v.x) * e) - 2), y0 = Math.max(0, Math.floor((z[1] - v.y) * e) - 2);
  const x1 = Math.min(W, Math.ceil((z[2] - v.x) * e) + 2), y1 = Math.min(H, Math.ceil((z[3] - v.y) * e) + 2);
  return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
}

/** El trazo tal cual, opaco, con la vista ya puesta en `ctx`. */
function trazoCrudo(ctx, op, n, e) {
  const p = op.p, s = op.s, c = op.c;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (op.h === "pincel" || op.h === "lapiz" || op.h === "crayon") {
    ctx.strokeStyle = op.h === "pincel" ? c : grano(ctx, c, op.h === "crayon");
    const total = pts(op);
    const ancho = (i) => {
      const punta = Math.min(1, (i + 1) / 4, (total - i) / 3);
      const k = op.h === "crayon" ? 0.75 + 0.25 * Math.max(0, punta) : 0.45 + 0.55 * Math.max(0, punta);
      return Math.max(0.6 / e, s * (p[i * 3 + 2] / 100) * k);
    };
    if (n === 1) { ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(p[0], p[1], ancho(0) / 2, 0, Math.PI * 2); ctx.fill(); return; }
    let ax = p[0], ay = p[1];
    for (let i = 1; i < n; i++) {
      const x = p[i * 3], y = p[i * 3 + 1];
      const mx = i < n - 1 ? (x + p[i * 3 + 3]) / 2 : x, my = i < n - 1 ? (y + p[i * 3 + 4]) / 2 : y;
      ctx.lineWidth = (ancho(i - 1) + ancho(i)) / 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(x, y, mx, my); ctx.stroke();
      ax = mx; ay = my;
    }
    return;
  }
  ctx.lineWidth = s;
  camino(ctx, p, n);
  if (op.h === "neon") {
    ctx.strokeStyle = c; ctx.shadowColor = c; ctx.shadowBlur = s * 1.6 * e; ctx.stroke();
    ctx.shadowBlur = s * 0.6 * e; ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineWidth = Math.max(1.5 / e, s * 0.38); ctx.strokeStyle = aclarar(c, 0.75); ctx.stroke();
  } else {
    ctx.strokeStyle = op.h === "borrador" ? "#000" : c;
    ctx.stroke();
  }
}

/**
 * Pinta un trazo (o sus primeros `n` puntos, mientras se dibuja o se repite) con una vista.
 * Lo que tiene transparencia o textura se arma aparte y se pega una sola vez.
 */
export function pintarTrazo(ctx, op, n = pts(op), v = VISTA) {
  if (n < 1) return;
  const e = v.s * v.k, o = op.o ?? 1, textura = op.h === "lapiz" || op.h === "crayon";
  const alfa = o * (op.h === "lapiz" ? 0.92 : op.h === "crayon" ? 0.95 : 1);
  const W = ctx.canvas.width, H = ctx.canvas.height;
  if (alfa >= 0.999 && !textura) {
    ctx.save();
    ctx.setTransform(e, 0, 0, e, -v.x * e, -v.y * e);
    if (op.h === "borrador") ctx.globalCompositeOperation = "destination-out";
    trazoCrudo(ctx, op, n, e);
    ctx.restore();
    return;
  }
  const r = rect(op, v, W, H);
  if (!r) return;
  const A = hojaApoyo(W, H), a = A.getContext("2d");
  a.setTransform(1, 0, 0, 1, 0, 0);
  a.clearRect(r[0], r[1], r[2], r[3]);
  a.save();
  a.beginPath(); a.rect(r[0], r[1], r[2], r[3]); a.clip();
  a.setTransform(e, 0, 0, e, -v.x * e, -v.y * e);
  trazoCrudo(a, op, n, e);
  a.restore();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alfa;
  if (op.h === "borrador") ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(A, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]);
  ctx.restore();
}

/** ¿El trazo se ve con esta vista? (ni fuera, ni tan chiquito que no se distingue) */
export function seVe(op, v, W, H) {
  if (op.k !== "trazo") return true;
  const z = cajaDe(op), e = v.s * v.k;
  if ((z[2] - z[0]) * e < 0.4 && (z[3] - z[1]) * e < 0.4) return false;
  return (z[2] - v.x) * e > 0 && (z[3] - v.y) * e > 0 && (z[0] - v.x) * e < W && (z[1] - v.y) * e < H;
}

const RGBA = (c) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c || "");
  const n = m ? parseInt(m[1], 16) : 0;
  return [n >> 16, (n >> 8) & 255, n & 255, 255];
};

/**
 * La cubeta: rellena la zona tocada (todo lo que se le parece y está junto) con su color, en PIXELES del lienzo.
 * Las orillas suavizadas de las líneas se rellenan por debajo, así no quedan hilitos blancos.
 */
export function rellenar(ctx, x, y, color, o = 1) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  const i0 = (y * W + x) * 4;
  const t = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]], f = RGBA(color);
  const fa = Math.round(255 * Math.max(0.05, Math.min(1, o)));
  if (Math.abs(t[0] - f[0]) + Math.abs(t[1] - f[1]) + Math.abs(t[2] - f[2]) < 6 && Math.abs(t[3] - fa) < 6) return false;
  const parece = t[3] < 30
    ? (i) => d[i + 3] < 110
    : (i) => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) + Math.abs(d[i + 3] - t[3]) < 96;
  const zona = new Uint8Array(W * H), pila = [x, y];
  while (pila.length) {
    const py = pila.pop(), px = pila.pop();
    let l = px;
    while (l >= 0 && !zona[py * W + l] && parece((py * W + l) * 4)) l--;
    l++;
    let arriba = false, abajo = false;
    for (let r = l; r < W; r++) {
      const k = py * W + r;
      if (zona[k] || !parece(k * 4)) break;
      zona[k] = 1;
      if (py > 0) { const a = !zona[k - W] && parece((k - W) * 4); if (a && !arriba) pila.push(r, py - 1); arriba = a; }
      if (py < H - 1) { const b = !zona[k + W] && parece((k + W) * 4); if (b && !abajo) pila.push(r, py + 1); abajo = b; }
    }
  }
  const orilla = new Uint8Array(W * H);
  for (let v = 0; v < 2; v++) {
    const fuente = v === 0 ? zona : orilla, nueva = [];
    for (let k = W; k < W * H - W; k++) {
      if (zona[k] || orilla[k]) continue;
      if (fuente[k - 1] || fuente[k + 1] || fuente[k - W] || fuente[k + W]) nueva.push(k);
    }
    for (const k of nueva) orilla[k] = 1;
  }
  const fA = fa / 255;
  for (let k = 0; k < W * H; k++) {
    const i = k * 4;
    if (zona[k]) {
      if (fa >= 255) { d[i] = f[0]; d[i + 1] = f[1]; d[i + 2] = f[2]; d[i + 3] = 255; }
      else {
        // Transparente: el color se pone encima de lo que había (como pintar con acuarela).
        const a0 = d[i + 3] / 255, aR = fA + a0 * (1 - fA);
        for (let c = 0; c < 3; c++) d[i + c] = aR ? (f[c] * fA + d[i + c] * a0 * (1 - fA)) / aR : 0;
        d[i + 3] = aR * 255;
      }
    } else if (orilla[k] && d[i + 3] < 255 && fa >= 255) {
      const a = d[i + 3] / 255;
      d[i] = d[i] * a + f[0] * (1 - a); d[i + 1] = d[i + 1] * a + f[1] * (1 - a); d[i + 2] = d[i + 2] * a + f[2] * (1 - a); d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return true;
}

/** Aplica una operación a un lienzo con una vista (en la infinita, un relleno de otra escala no se repite). */
export function aplicar(ctx, op, v = VISTA) {
  if (op.k === "trazo") { if (seVe(op, v, ctx.canvas.width, ctx.canvas.height)) pintarTrazo(ctx, op, undefined, v); }
  else if (op.k === "relleno") {
    const z = op.z || 1, r = v.s / z;
    if (r < 1 / 12 || r > 12) return;
    rellenar(ctx, (op.x - v.x) * v.s * v.k, (op.y - v.y) * v.s * v.k, op.c, op.o ?? 1);
  } else if (op.k === "limpiar") { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); }
}

const hoja = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

/**
 * La hoja de siempre (W × H) con su historia. `log` = todas las operaciones (para guardarlo y para repetirlo); las
 * más viejas se aplanan en `base` para que deshacer sea rápido aunque el dibujo sea enorme.
 */
export class Lienzo {
  constructor(canvas, w = ANCHO, h = ALTO) {
    this.canvas = canvas; canvas.width = w; canvas.height = h;
    this.W = w; this.H = h;
    this.ctx = canvas.getContext("2d");
    this.base = hoja(w, h); this.bctx = this.base.getContext("2d");
    this.log = []; this.baseN = 0;
    this.vista = VISTA;
  }
  agregar(op, yaPintada = false) {
    if (!yaPintada) aplicar(this.ctx, op);
    this.log.push(op);
    if (this.log.length - this.baseN > 80) {
      for (let i = this.baseN; i < this.baseN + 20; i++) aplicar(this.bctx, this.log[i]);
      this.baseN += 20;
    }
  }
  puedeQuitar() { return this.log.length > this.baseN; }
  quitar() {
    if (!this.puedeQuitar()) return null;
    const op = this.log.pop();
    this.redibujar();
    return op;
  }
  redibujar() {
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.drawImage(this.base, 0, 0);
    for (let i = this.baseN; i < this.log.length; i++) aplicar(this.ctx, this.log[i]);
  }
  cargar(log) {
    this.log = []; this.baseN = 0;
    this.bctx.clearRect(0, 0, this.W, this.H);
    for (const op of log || []) if (valida(op)) this.agregar(op, true);
    this.redibujar();
  }
  hayAlgo() { return hayAlgo(this.log); }
}

/**
 * La hoja infinita: los trazos viven en el mundo y se vuelven a pintar con la vista de cada momento
 * (sólo los que se ven y no son microscópicos). Mismo trato que `Lienzo`.
 */
export class LienzoInfinito {
  constructor(canvas, w = ANCHO, h = ALTO) {
    this.canvas = canvas; canvas.width = w; canvas.height = h;
    this.W = w; this.H = h;
    this.ctx = canvas.getContext("2d");
    this.log = []; this.baseN = 0;
    this.vista = { s: 1, x: 0, y: 0, k: 1 };
    this.infinito = true;
  }
  agregar(op, yaPintada = false) { if (!yaPintada) aplicar(this.ctx, op, this.vista); this.log.push(op); }
  puedeQuitar() { return this.log.length > 0; }
  quitar() { const op = this.log.pop(); this.redibujar(); return op || null; }
  redibujar() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.W, this.H);
    let desde = 0;
    for (let i = this.log.length - 1; i >= 0; i--) if (this.log[i].k === "limpiar") { desde = i + 1; break; }
    for (let i = desde; i < this.log.length; i++) aplicar(this.ctx, this.log[i], this.vista);
  }
  ponerVista(v) { this.vista = { ...this.vista, ...v, k: 1 }; this.redibujar(); }
  cargar(log, vista) { this.log = (log || []).filter(valida); if (vista) this.vista = { s: vista.s || 1, x: vista.x || 0, y: vista.y || 0, k: 1 }; this.redibujar(); }
  hayAlgo() { return hayAlgo(this.log); }
}

const valida = (op) => op && (op.k === "trazo" ? Array.isArray(op.p) && op.p.length >= 3 : op.k === "relleno" || op.k === "limpiar");
function hayAlgo(log) {
  for (let i = log.length - 1; i >= 0; i--) {
    const op = log[i];
    if (op.k === "limpiar") return false;
    if (op.k === "relleno" || (op.k === "trazo" && op.h !== "borrador")) return true;
  }
  return false;
}

/**
 * Repite el dibujo trazo por trazo en `canvas` (para quien lo recibe): dura entre 1.5 y 6.5 s, sea del tamaño
 * que sea. `k` < 1 lo repite a menor resolución (mucho más ligero en el teléfono; se ve igual de lindo en
 * chiquito). Se detiene solo si el lienzo ya no está en la pantalla. Devuelve { listo: Promise<bool>, parar() }.
 */
export function repetir(canvas, log, { alPaso = null, duracion = null, w = ANCHO, h = ALTO, k = 1, vista = null } = {}) {
  canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
  const v = vista ? { s: vista.s || 1, x: vista.x || 0, y: vista.y || 0, k } : { s: 1, x: 0, y: 0, k };
  const ctx = canvas.getContext("2d"), antes = hoja(canvas.width, canvas.height), actx = antes.getContext("2d");
  let ops = (log || []).filter(valida);
  for (let i = ops.length - 1; i >= 0; i--) if (ops[i].k === "limpiar") { ops = ops.slice(i + 1); break; }
  if (vista) ops = ops.filter((op) => op.k !== "trazo" || seVe(op, v, canvas.width, canvas.height));
  const costo = (op) => op.k === "trazo" ? Math.max(6, pts(op)) : op.k === "relleno" ? 18 : 4;
  const total = ops.reduce((a, op) => a + costo(op), 0) || 1;
  const ms = duracion ?? Math.max(1500, Math.min(6500, total * 9));
  const porPunto = ms / total;
  let parado = false, fin, vueltas = 0;
  const listo = new Promise((ok) => { fin = ok; });
  let i = 0, t0 = 0, op = null;
  const terminar = (completo) => { if (parado) return; parado = true; fin(completo); };
  const paso = (t) => {
    if (parado) return;
    if (++vueltas > 2 && !canvas.isConnected) { terminar(false); return; }
    if (!op) {
      if (i >= ops.length) { terminar(true); return; }
      op = ops[i]; t0 = t;
      actx.clearRect(0, 0, antes.width, antes.height); actx.drawImage(canvas, 0, 0);
      alPaso?.(op, i);
    }
    const dur = costo(op) * porPunto, f = Math.min(1, (t - t0) / dur);
    if (op.k === "trazo") {
      const r = rect(op, v, canvas.width, canvas.height);
      if (r) { ctx.clearRect(r[0], r[1], r[2], r[3]); ctx.drawImage(antes, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); }
      pintarTrazo(ctx, op, Math.max(1, Math.round(pts(op) * f)), v);
    } else if (f >= 1) aplicar(ctx, op, v);
    if (f >= 1) { op = null; i++; }
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  return {
    listo,
    /** Termina ya: pone el dibujo completo (si `completar`) y avisa que no se vio entero. */
    parar(completar = true) {
      if (parado) return;
      parado = true;
      if (completar && canvas.isConnected) { ctx.clearRect(0, 0, canvas.width, canvas.height); for (const o of ops) aplicar(ctx, o, v); }
      fin(false);
    },
  };
}
