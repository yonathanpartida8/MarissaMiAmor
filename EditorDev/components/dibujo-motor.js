/**
 * EL MOTOR DEL DIBUJITO (Fase 47) — sólo lo que pinta, sin nada de pantalla. Lo usan el estudio
 * (estudio-dibujo.js) y quien lo recibe en Detallitos, para que el dibujito se redibuje solito.
 *
 * Todo vive en una hoja de 1080 × 1440 (3 : 4), igual en cualquier aparato. Cada cosa que haces es una
 * operación que se guarda:
 *   { k: "trazo", h: herramienta, c: color, s: grosor, p: [x, y, f, x, y, f…] }   (f = cuánto engorda, en %)
 *   { k: "relleno", x, y, c }   la cubeta (se vuelve a calcular igual, así pese poquito)
 *   { k: "limpiar" }            la basura (también se deshace)
 * Deshacer = volver a pintar desde la «base» (lo más viejo, ya aplanado en otra hoja) y quien lo recibe
 * ve cómo se fue dibujando, trazo por trazo.
 */
export const ANCHO = 1080, ALTO = 1440;

/** Los pinceles: los esenciales y nada más. `var` = el grosor cambia con la presión o la velocidad. */
export const PINCELES = {
  plumon: { n: "Plumón", s: 14, var: false },
  pincel: { n: "Pincel", s: 22, var: true },
  lapiz: { n: "Lápiz", s: 7, var: true },
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

/* El lápiz tiene grano: una textura de ruido teñida de su color (una por color, guardada). */
const GRANO = new Map();
function grano(ctx, color) {
  let t = GRANO.get(color);
  if (!t) {
    const c = document.createElement("canvas"); c.width = c.height = 96;
    const g = c.getContext("2d"), im = g.createImageData(96, 96);
    for (let i = 0; i < im.data.length; i += 4) { im.data[i + 3] = Math.random() < 0.18 ? 40 : 150 + Math.random() * 105; }
    g.putImageData(im, 0, 0);
    g.globalCompositeOperation = "source-in"; g.fillStyle = color; g.fillRect(0, 0, 96, 96);
    if (GRANO.size > 24) GRANO.delete(GRANO.keys().next().value);
    GRANO.set(color, t = c);
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

/**
 * Pinta un trazo (o sus primeros `n` puntos, para cuando se está dibujando o se repite).
 * Cada pincel a su manera; todo en unidades de la hoja.
 */
export function pintarTrazo(ctx, op, n = pts(op)) {
  if (n < 1) return;
  const p = op.p, s = op.s, c = op.c;
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (op.h === "borrador") ctx.globalCompositeOperation = "destination-out";
  if (op.h === "pincel" || op.h === "lapiz") {
    // Grosor que cambia: un pedacito a la vez (con punta fina al empezar y al terminar).
    ctx.strokeStyle = op.h === "lapiz" ? grano(ctx, c) : c;
    if (op.h === "lapiz") ctx.globalAlpha = 0.92;
    const total = pts(op);
    const ancho = (i) => {
      const punta = Math.min(1, (i + 1) / 4, (total - i) / 3);
      return Math.max(0.6, s * (p[i * 3 + 2] / 100) * (0.45 + 0.55 * Math.max(0, punta)));
    };
    if (n === 1) { ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(p[0], p[1], ancho(0) / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
    let ax = p[0], ay = p[1];
    for (let i = 1; i < n; i++) {
      const x = p[i * 3], y = p[i * 3 + 1];
      const mx = i < n - 1 ? (x + p[i * 3 + 3]) / 2 : x, my = i < n - 1 ? (y + p[i * 3 + 4]) / 2 : y;
      ctx.lineWidth = (ancho(i - 1) + ancho(i)) / 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(x, y, mx, my); ctx.stroke();
      ax = mx; ay = my;
    }
    ctx.restore();
    return;
  }
  ctx.lineWidth = s;
  if (op.h === "neon") {
    camino(ctx, p, n);
    ctx.strokeStyle = c; ctx.shadowColor = c; ctx.shadowBlur = s * 1.6; ctx.stroke();
    ctx.shadowBlur = s * 0.6; ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineWidth = Math.max(1.5, s * 0.38); ctx.strokeStyle = aclarar(c, 0.75); ctx.stroke();
  } else {
    camino(ctx, p, n);
    ctx.strokeStyle = op.h === "borrador" ? "#000" : c;
    ctx.stroke();
  }
  ctx.restore();
}

/** Un pedacito nuevo del borrador (del punto `desde` en adelante): se borra en la hoja misma, al momento. */
export function pintarDesde(ctx, op, desde) {
  const n = pts(op), i0 = Math.max(0, desde - 2);
  if (n - i0 < 1) return;
  pintarTrazo(ctx, { ...op, p: op.p.slice(i0 * 3) });
}

const RGBA = (c) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c || "");
  const n = m ? parseInt(m[1], 16) : 0;
  return [n >> 16, (n >> 8) & 255, n & 255, 255];
};

/**
 * La cubeta: rellena la zona tocada (todo lo que se le parece y está junto) con su color. Las orillas
 * suavizadas de las líneas se rellenan por debajo, así no quedan hilitos blancos entre la línea y el color.
 */
export function rellenar(ctx, x, y, color) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  const i0 = (y * W + x) * 4;
  const t = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]], f = RGBA(color);
  if (Math.abs(t[0] - f[0]) + Math.abs(t[1] - f[1]) + Math.abs(t[2] - f[2]) < 6 && t[3] > 250) return false;
  // Lo transparente se compara por su transparencia; lo de color, por su color.
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
  // La orilla (2 px alrededor): el color va «por debajo» de lo que ya estaba.
  const orilla = new Uint8Array(W * H);
  for (let v = 0; v < 2; v++) {
    const fuente = v === 0 ? zona : orilla, nueva = [];
    for (let k = W; k < W * H - W; k++) {
      if (zona[k] || orilla[k]) continue;
      if (fuente[k - 1] || fuente[k + 1] || fuente[k - W] || fuente[k + W]) nueva.push(k);
    }
    for (const k of nueva) orilla[k] = 1;
  }
  for (let k = 0; k < W * H; k++) {
    const i = k * 4;
    if (zona[k]) { d[i] = f[0]; d[i + 1] = f[1]; d[i + 2] = f[2]; d[i + 3] = 255; }
    else if (orilla[k] && d[i + 3] < 255) {
      const a = d[i + 3] / 255;
      d[i] = d[i] * a + f[0] * (1 - a); d[i + 1] = d[i + 1] * a + f[1] * (1 - a); d[i + 2] = d[i + 2] * a + f[2] * (1 - a); d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return true;
}

/** Aplica una operación a una hoja. */
export function aplicar(ctx, op) {
  if (op.k === "trazo") pintarTrazo(ctx, op);
  else if (op.k === "relleno") rellenar(ctx, op.x, op.y, op.c);
  else if (op.k === "limpiar") ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

const hoja = () => { const c = document.createElement("canvas"); c.width = ANCHO; c.height = ALTO; return c; };

/**
 * La hoja con su historia. `log` = todas las operaciones (para guardarlo y para repetirlo); las más viejas
 * se aplanan en `base` para que deshacer sea rápido aunque el dibujo sea enorme.
 */
export class Lienzo {
  constructor(canvas) {
    this.canvas = canvas; canvas.width = ANCHO; canvas.height = ALTO;
    this.ctx = canvas.getContext("2d", { willReadFrequently: false });
    this.base = hoja(); this.bctx = this.base.getContext("2d");
    this.log = []; this.baseN = 0;
  }
  /** Agrega una operación (`yaPintada`: el estudio ya la pintó mientras la dibujabas). */
  agregar(op, yaPintada = false) {
    if (!yaPintada) aplicar(this.ctx, op);
    this.log.push(op);
    // Lo muy viejo se aplana: deshacer llega hasta 60 pasos atrás.
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
    this.ctx.clearRect(0, 0, ANCHO, ALTO);
    this.ctx.drawImage(this.base, 0, 0);
    for (let i = this.baseN; i < this.log.length; i++) aplicar(this.ctx, this.log[i]);
  }
  /** Empieza con lo guardado (todo se pinta de nuevo; lo viejo, aplanado). */
  cargar(log) {
    this.log = []; this.baseN = 0;
    this.bctx.clearRect(0, 0, ANCHO, ALTO);
    for (const op of log || []) if (op && (op.k === "trazo" ? Array.isArray(op.p) && op.p.length >= 3 : true)) this.agregar(op, true);
    this.redibujar();
  }
  /** ¿Hay algo dibujado? (después de la última vez que se limpió, algo que no sea sólo borrar) */
  hayAlgo() {
    for (let i = this.log.length - 1; i >= 0; i--) {
      const op = this.log[i];
      if (op.k === "limpiar") return false;
      if (op.k === "relleno" || (op.k === "trazo" && op.h !== "borrador")) return true;
    }
    return false;
  }
}

/**
 * Repite el dibujo trazo por trazo en `canvas` (para quien lo recibe): dura entre 1.5 y 6.5 s, sea del
 * tamaño que sea. Devuelve { listo: Promise, parar() }.
 */
export function repetir(canvas, log, { alPaso = null, duracion = null } = {}) {
  canvas.width = ANCHO; canvas.height = ALTO;
  const ctx = canvas.getContext("2d"), antes = hoja(), actx = antes.getContext("2d");
  const ops = (log || []).filter(Boolean);
  const costo = (op) => op.k === "trazo" ? Math.max(6, pts(op)) : op.k === "relleno" ? 18 : 4;
  const total = ops.reduce((a, op) => a + costo(op), 0) || 1;
  const ms = duracion ?? Math.max(1500, Math.min(6500, total * 9));
  const porPunto = ms / total;
  let parado = false, fin;
  const listo = new Promise((ok) => { fin = ok; });
  let i = 0, t0 = 0, op = null;
  const siguiente = (t) => {
    if (parado) return;
    if (!op) {
      if (i >= ops.length) { fin(true); return; }
      op = ops[i]; t0 = t;
      actx.clearRect(0, 0, ANCHO, ALTO); actx.drawImage(canvas, 0, 0);
      alPaso?.(op, i);
    }
    const dur = costo(op) * porPunto, k = Math.min(1, (t - t0) / dur);
    if (op.k === "trazo") {
      ctx.clearRect(0, 0, ANCHO, ALTO); ctx.drawImage(antes, 0, 0);
      pintarTrazo(ctx, op, Math.max(1, Math.round(pts(op) * k)));
    } else if (k >= 1) aplicar(ctx, op);
    if (k >= 1) { op = null; i++; }
    requestAnimationFrame(siguiente);
  };
  requestAnimationFrame(siguiente);
  return { listo, parar() { if (parado) return; parado = true; ctx.clearRect(0, 0, ANCHO, ALTO); for (const o of ops) aplicar(ctx, o); fin(false); } };
}
