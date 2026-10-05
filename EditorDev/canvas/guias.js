/**
 * GUÍAS E IMÁN — a qué se pega lo que arrastras.
 *
 * Mientras se mueve algo se buscan, en este orden: los bordes y el centro
 * de la hoja, los márgenes seguros, tus guías y los bordes y centros de
 * los demás elementos. Si alguno queda a menos de 6 px de pantalla, se
 * pega y se dibuja la línea rosa. Si no, y la cuadrícula está puesta, se
 * redondea a su paso.
 */

/** Caja que ocupa un elemento girado (para alinear con lo que se ve). */
export function cajaDe(e) {
  if (!e.rot) return { x: e.x, y: e.y, w: e.w, h: e.h };
  const r = (e.rot * Math.PI) / 180;
  const c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  const w = e.w * c + e.h * s, h = e.w * s + e.h * c;
  return { x: e.x + e.w / 2 - w / 2, y: e.y + e.h / 2 - h / 2, w, h };
}

export function union(cajas) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of cajas) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function candidatos(proyecto, pagina, excluir) {
  const { ancho: W, alto: H } = proyecto.ajustes;
  const ed = proyecto.editor || {};
  const m = ed.margenes ? ed.margen || 0 : 0;
  const x = [0, W / 2, W], y = [0, H / 2, H];
  if (m) { x.push(m, W - m); y.push(m, H - m); }
  for (const g of ed.guias || []) (g.eje === "x" ? x : y).push(g.pos);
  for (const e of pagina.els) {
    if (excluir.has(e.id) || e.oculto) continue;
    const b = cajaDe(e);
    x.push(b.x, b.x + b.w / 2, b.x + b.w);
    y.push(b.y, b.y + b.h / 2, b.y + b.h);
  }
  return { x, y };
}

function mejor(valores, objetivos, umbral) {
  let best = null;
  for (const [v, k] of valores) {
    for (const t of objetivos) {
      const d = t - v;
      if (Math.abs(d) <= umbral && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, t, k };
    }
  }
  return best;
}

/**
 * Ajusta una caja que se mueve. Devuelve el desplazamiento extra y las
 * líneas que hay que dibujar.
 */
export function imanMover(caja, cand, umbral, rejilla) {
  const bx = mejor([[caja.x, 0], [caja.x + caja.w / 2, 1], [caja.x + caja.w, 2]], cand.x, umbral);
  const by = mejor([[caja.y, 0], [caja.y + caja.h / 2, 1], [caja.y + caja.h, 2]], cand.y, umbral);
  let dx = bx ? bx.d : 0, dy = by ? by.d : 0;
  if (!bx && rejilla) dx = Math.round(caja.x / rejilla) * rejilla - caja.x;
  if (!by && rejilla) dy = Math.round(caja.y / rejilla) * rejilla - caja.y;
  return { dx, dy, lx: bx ? [bx.t] : [], ly: by ? [by.t] : [] };
}

/** Para redimensionar: sólo se pegan los bordes que se mueven. */
export function imanBorde(v, objetivos, umbral, rejilla) {
  const b = mejor([[v, 0]], objetivos, umbral);
  if (b) return { v: b.t, linea: b.t };
  if (rejilla) return { v: Math.round(v / rejilla) * rejilla, linea: null };
  return { v, linea: null };
}

/* ── Reglas ────────────────────────────────────────────────────────── */
export function pintarRegla(canvas, eje, z, desplaz, largoMundo, dpr) {
  const g = canvas.getContext("2d");
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const css = getComputedStyle(canvas);
  g.fillStyle = css.getPropertyValue("--regla-fondo") || "#f6eef2";
  g.fillRect(0, 0, W, H);
  // la hoja
  g.fillStyle = css.getPropertyValue("--regla-hoja") || "#fff";
  if (eje === "x") g.fillRect(desplaz, 0, largoMundo * z, H); else g.fillRect(0, desplaz, W, largoMundo * z);
  const pasos = [1, 2, 5, 10, 20, 50, 100, 200, 500];
  const paso = pasos.find((p) => p * z >= 46) || 500;
  const menor = paso / (paso >= 10 && paso % 5 === 0 ? 5 : 2);
  g.strokeStyle = css.getPropertyValue("--regla-linea") || "#c9b3c0";
  g.fillStyle = css.getPropertyValue("--regla-texto") || "#8c6f85";
  g.font = "9px system-ui, sans-serif";
  g.lineWidth = 1;
  g.beginPath();
  const largo = eje === "x" ? W : H;
  const ini = Math.floor(-desplaz / z / menor) * menor;
  const fin = (largo - desplaz) / z;
  for (let v = ini; v <= fin; v += menor) {
    const p = Math.round(desplaz + v * z) + 0.5;
    const mayor = Math.abs(v / paso - Math.round(v / paso)) < 1e-6;
    const t = mayor ? 8 : 4;
    if (eje === "x") { g.moveTo(p, H); g.lineTo(p, H - t); } else { g.moveTo(W, p); g.lineTo(W - t, p); }
    if (mayor) {
      if (eje === "x") g.fillText(String(Math.round(v)), p + 3, 9);
      else { g.save(); g.translate(9, p - 3); g.rotate(-Math.PI / 2); g.fillText(String(Math.round(v)), 0, 0); g.restore(); }
    }
  }
  g.stroke();
}
