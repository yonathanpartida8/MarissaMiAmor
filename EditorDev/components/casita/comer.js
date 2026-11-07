/**
 * COMER DE VERDAD (Fase 73): ya no es el mismo brazo subiendo y bajando sin parar. Cada bocado es una secuencia:
 *
 *   1. Mira la comida: se inclina tantito y la cabeza baja; la mano baja al plato (o acerca lo que trae).
 *   2. Recoge el bocado (la cuchara hace su giro chiquito) y el bocadito sale del plato.
 *   3. Lo sube a la boca mientras la cabeza se acerca a recibirlo; el bocadito viaja en arco hasta la boca.
 *   4. Muerde: boquita abierta, el bocadito desaparece, caen unas migajitas (del color de la comida) y la comida
 *      del plato se ve con menos (o a lo que trae en la mano le falta un mordisco más).
 *   5. Mastica de 3 a 5 veces con la cabeza moviéndose, mientras la mano baja a medio camino.
 *   6. Una pausa que varía; a veces cierra los ojitos de gusto («¡mmm!»).
 *
 *   · Sentado a la mesa, el monito es de bulto (monito3d.js): se mueve su brazo derecho aparte, el tronco y la cabeza,
 *     cuadro por cuadro (los cuadros se guardan: el segundo bocado ya no cuesta). De pie (lo que traes en la mano), es
 *     el dibujo de siempre con sus brazos y su codo.
 *   · Con «menos movimiento» se queda en lo simple (masticar y listo). Nada de esto viaja por internet: tu amorcito ve
 *     la misma secuencia porque su teléfono la hace con el aviso de que estás comiendo.
 */
import { el } from "../ui.js";
import { sinMovimiento as reducido } from "../transiciones.js";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const entre = (a, b) => a + Math.random() * (b - a);

/** El bocadito que va del plato (o la mano) a la boca, en arco, como un cuadrito de la comida. */
function bocadito(j, desde, hasta, color, ms) {
  if (!desde || !hasta || reducido()) return;
  const R = j.raiz.getBoundingClientRect(), k = j.k || 1, t = 6 * k;
  const n = el("i.ca-bocadito", { style: { left: desde.x - R.left - t / 2 + "px", top: desde.y - R.top - t / 2 + "px", width: t + "px", height: t + "px", "--c": color || "#f2b45a" } });
  j.raiz.append(n);
  const dx = hasta.x - desde.x, dy = hasta.y - desde.y;
  n.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 26 * k}px)`, offset: 0.5 }, { transform: `translate(${dx}px, ${dy}px) scale(.7)` }], { duration: ms, easing: "cubic-bezier(.35,.1,.35,1)", fill: "forwards" }).onfinish = () => n.remove();
}
const centro = (n, fy = 0.5) => { if (!n) return null; const R = n.getBoundingClientRect(); return R.width ? { x: R.left + R.width / 2, y: R.top + R.height * fy } : null; };

/** Sentado a la mesa: `n` bocados del plato `platoN` (el monito de bulto). `alBocado(i)` al morder. */
export async function bocados3d(j, m, { n = 2, platoN = null, color, sigue = () => true, alBocado = () => {} }) {
  if (!m._3d || !m._3dUlt) return bocadosPlanos(j, m, { n, color, sigue, alBocado, cuchara: true });
  const [p0, ancla, a3d] = m._3dUlt, base = { ...p0 }, b0 = base.brazo || 26, t0 = base.tronco || 0;
  const cuadro = (c, cara = null) => { if (!m._3d || !m._3dUlt) return false; m._cara3d = cara; j._cuadro3d(m, { ...base, ...c }, ancla, a3d); return true; };
  const boca = () => centro(m._img3d, 0.22);
  try {
    for (let i = 0; i < n; i++) {
      if (!sigue() || !m._3d) return;
      if (reducido()) { cuadro({}, "come"); await espera(260); alBocado(i); cuadro({}); await espera(700); continue; }
      const v = entre(0.85, 1.2);
      // 1) Mira el plato: se inclina y la mano baja.
      cuadro({ tronco: t0 + 4, brazoD: b0 + 8, cabezaY: 1 }); await espera(140 * v);
      cuadro({ tronco: t0 + 8, brazoD: b0 + 18, cabezaY: 1 }); await espera(220 * v);
      // 2) Recoge (un giro cortito) y el bocadito sale del plato.
      cuadro({ tronco: t0 + 8, brazoD: b0 + 24, cabezaY: 1 }); await espera(150 * v);
      cuadro({ tronco: t0 + 7, brazoD: b0 + 16, cabezaY: 1 }); await espera(110 * v);
      bocadito(j, centro(platoN, 0.4), boca(), color, 470 * v);
      // 3) A la boca: el brazo sube y se cruza hacia la cara (la cabeza sube a recibirlo).
      cuadro({ tronco: t0 + 5, brazoD: 46, brazoDz: 60, cabezaY: 1 }); await espera(130 * v);
      cuadro({ tronco: t0 + 3, brazoD: 50, brazoDz: 108, cabezaY: 0 }, "come"); await espera(140 * v);
      cuadro({ tronco: t0 + 4, brazoD: 60, brazoDz: 128, cabezaY: 0 }, "come"); await espera(170 * v);
      // 4) Muerde.
      if (!sigue()) return;
      alBocado(i);
      j.particulas("migaja", { gx: m.gx + 10 * (m.mira || 1), y: m.y - 64 }, 0, 0, 2);
      cuadro({ tronco: t0 + 3, brazoD: 56, brazoDz: 118, cabezaY: 1 }); await espera(120);
      // 5) Mastica (la mano va bajando poco a poco).
      const veces = 3 + ((Math.random() * 3) | 0), BAJA = [[52, 96], [46, 62], [40, 30], [b0 + 10, 8], [b0 + 4, 0]];
      for (let k = 0; k < veces; k++) { const [bd, bz] = BAJA[Math.min(k, BAJA.length - 1)]; cuadro({ tronco: t0 + 2, brazoD: bd, brazoDz: bz, cabezaY: k % 2 }, k % 2 ? null : "come"); await espera(entre(115, 150)); }
      cuadro({});
      // 6) La pausa: a veces de gusto, con los ojitos cerrados.
      if (Math.random() < 0.35) { cuadro({ cabezaY: 0 }, "feliz"); await espera(entre(450, 800)); cuadro({}); }
      else await espera(entre(200, 650));
    }
  } finally { if (m._3d && m._3dUlt) { m._cara3d = null; j._cuadro3d(m, base, ancla, a3d); } }
}

/** De pie (o sin monito de bulto): el dibujo de siempre, con su brazo, su codo, la cabeza y la boca. */
export async function bocadosPlanos(j, m, { n = 3, color, sigue = () => true, alBocado = () => {}, cuchara = false, lleva = false }) {
  const bd = m.n.querySelector(".ca-bd"), ante = bd?.querySelector(".ca-antebrazo");
  const anim = (nodo, kf, ms) => (nodo && !reducido() ? nodo.animate(kf, { duration: ms, easing: "cubic-bezier(.4,0,.3,1)", fill: "forwards" }).finished.catch(() => {}) : espera(ms));
  const cabeza = (r, y = 0) => { m.n.style.setProperty("--hr", r + "deg"); m.n.style.setProperty("--hy", y + "px"); };
  let rot = 10;
  const brazo = (a, ms) => { const p = anim(bd, [{ transform: `rotate(${rot}deg)` }, { transform: `rotate(${a}deg)` }], ms); rot = a; return p; };
  m.n.classList.add("come73"); m.n.classList.toggle("con-cuchara", cuchara);
  try {
    for (let i = 0; i < n; i++) {
      if (!sigue()) return;
      const v = entre(0.85, 1.2);
      // 1) Mira lo que va a comer.
      m.n.classList.add("mira-comida"); cabeza(lleva ? 4 : 7, 1);
      await brazo(lleva ? 46 : 32, 300 * v);
      // 2) Recoge (o acomoda lo que trae).
      await anim(ante, [{ transform: "rotate(0deg)" }, { transform: "rotate(-22deg)" }, { transform: "rotate(0deg)" }], 260 * v);
      m.n.classList.add("con-bocado");
      // 3) A la boca.
      m.n.classList.remove("mira-comida"); cabeza(-3, 0);
      bocadito(j, cuchara ? centro(m.n.querySelector(".ca-cuchara"), 0.2) : null, centro(m.caja, 0.3), color, 360 * v);
      await brazo(lleva ? 112 : 124, 380 * v);
      // 4) Muerde.
      if (!sigue()) return;
      m.n.classList.add("muerde"); m.n.classList.remove("con-bocado");
      alBocado(i);
      j.particulas("migaja", { gx: m.gx + 16 * (m.mira || 1), y: m.y - 92 }, 0, 0, 3);
      j.sonar("comer", { volumen: 0.45 });
      await espera(150);
      m.n.classList.remove("muerde");
      // 5) Mastica, la cabeza va y viene; la mano baja a medio camino.
      m.n.classList.add("mastica");
      const veces = 3 + ((Math.random() * 3) | 0);
      const baja = brazo(lleva ? 70 : 54, 520 * v);
      for (let k = 0; k < veces; k++) { cabeza(k % 2 ? 2 : -2, k % 2); await espera(entre(120, 160)); }
      await baja;
      m.n.classList.remove("mastica"); cabeza(0, 0);
      // 6) La pausa (a veces, de gusto).
      if (Math.random() < 0.35) { m.n.classList.add("saborea"); await espera(entre(420, 760)); m.n.classList.remove("saborea"); }
      else await espera(entre(180, 560));
    }
  } finally {
    m.n.classList.remove("come73", "con-cuchara", "mira-comida", "con-bocado", "muerde", "mastica", "saborea");
    cabeza(0, 0); m.n.style.removeProperty("--hr"); m.n.style.removeProperty("--hy");
    for (const a of bd?.getAnimations() || []) a.cancel();
    for (const a of ante?.getAnimations() || []) a.cancel();
  }
}

/** A lo que traes en la mano le falta un mordisco más (un hueco con su orillita, en cuadritos). */
const MORDIDAS = [[33, 8, 8], [8, 7, 7], [21, 3, 9], [33, 24, 8]];
export function mordida(sv, i) {
  if (!sv) return;
  const NS = "http://www.w3.org/2000/svg";
  let g = sv.querySelector(":scope > g.ca-mordido"), mask = sv.querySelector(":scope > defs > mask");
  if (!g || !mask) {
    const id = "mo" + Math.random().toString(36).slice(2, 9), defs = document.createElementNS(NS, "defs");
    mask = document.createElementNS(NS, "mask"); mask.id = id; mask.setAttribute("maskUnits", "userSpaceOnUse");
    const r = document.createElementNS(NS, "rect"); for (const [k, v] of [["x", -20], ["y", -20], ["width", 80], ["height", 80], ["fill", "#fff"]]) r.setAttribute(k, v);
    mask.append(r); defs.append(mask);
    g = document.createElementNS(NS, "g"); g.classList.add("ca-mordido"); g.setAttribute("mask", `url(#${id})`);
    while (sv.firstChild) g.append(sv.firstChild);
    sv.append(defs, g);
  }
  const [x, y, rr] = MORDIDAS[i % MORDIDAS.length];
  // (El mordisco en escalones, como pixel: tres rectángulos encimados en vez de un círculo liso.)
  for (const [w, h] of [[rr * 2, rr * 1.2], [rr * 1.5, rr * 1.7], [rr * 0.9, rr * 2]]) {
    const q = document.createElementNS(NS, "rect");
    for (const [k, v] of [["x", x - w / 2], ["y", y - h / 2], ["width", w], ["height", h], ["fill", "#000"], ["shape-rendering", "crispEdges"]]) q.setAttribute(k, v);
    mask.append(q);
  }
}
