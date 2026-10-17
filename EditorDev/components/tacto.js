/**
 * TACTO — lo que se siente al tocar y al desplazar en TODA la interfaz
 * (editor, menú principal, Detallitos, inicio…). Nunca en la hoja que se edita
 * ni en «Probar página»: eso es del librito.
 *
 *   onda          al tocar un botón, una onda suave nace del dedo y se apaga
 *                 (rosita; blanca en los botones de color)
 *   corazoncitos  los botones principales sueltan unos corazones chiquitos
 *   desplazar     al bajar en un panel, su cabecera se separa con una sombrita
 *                 (`data-desplazado` en el que se desplaza; lo pinta el CSS)
 *
 * Un solo oyente para cada cosa (delegado en el documento) y nada se mide más
 * que al tocar. Todo SIGUE a lo que tocaste (Fase 23): la onda vive dentro del
 * botón cuando él ya es su propio marco (así se desliza, gira y se encoge con
 * él); si no, en una capita fija con su forma que lo acompaña cuadro a cuadro
 * mientras dura, igual que los corazoncitos. El botón no cambia de lugar.
 * Sólo se anima transform y opacity. Con «sin movimiento», calidad baja o
 * «menos movimiento» del sistema, no hay ondas ni corazones; la sombrita sí.
 */
import { PREF, vibrar } from "../config/preferencias.js";

const TOCABLE = "button, a[href], [role=button], [role=tab], summary, label.ed-btn, .ed-borrador, .mp-carta, .dt-nota";
// Lo que es del librito (la hoja, sus manijas) o donde una onda estorba.
const NUNCA = ".ed-mundo, .ed-sobre, .ed-hoja, input, textarea, select, [contenteditable=true], canvas, iframe, video, [data-sin-onda]";
const CLARA = ".primario, .mp-btn.primario, .dt-btn.primario, .peligro.primario";
const CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';

let vivas = 0;
const quieto = () => {
  const b = document.body.classList;
  return b.contains("ed-mov-nada") || b.contains("ed-calidad-baja") || b.contains("ed-probando") || matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/** Mueve `capa` (fija) lo mismo que se mueva `nodo` desde `r0`, mientras la capa exista. */
function seguir(nodo, capa, r0) {
  let ult = "";
  const paso = () => {
    if (!capa.isConnected || !nodo.isConnected) return;
    const r = nodo.getBoundingClientRect();
    if (r.width || r.height) {
      const t = `translate(${(r.left - r0.left).toFixed(1)}px, ${(r.top - r0.top).toFixed(1)}px)`;
      if (t !== ult) capa.style.transform = ult = t;
    }
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/** La onda: un círculo que crece desde el dedo, recortado con la forma del botón. */
function onda(nodo, x, y) {
  if (vivas >= 4) return;
  const r = nodo.getBoundingClientRect();
  if (r.width < 8 || r.height < 8 || r.width > innerWidth * 1.2 || r.height > 420) return;
  const cs = getComputedStyle(nodo);
  // Dentro del botón si ya es su propio marco: va con él aunque se deslice, gire o se encoja.
  const dentro = cs.position !== "static" && cs.display !== "inline" && nodo.offsetWidth > 0;
  const capa = document.createElement(dentro ? "ed-onda" : "span");
  capa.className = "ed-onda-capa";
  if (!dentro) capa.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${cs.borderRadius}`;
  // El punto del dedo en las medidas propias del botón (por si está encogido o agrandado).
  const ew = dentro ? nodo.offsetWidth : r.width, eh = dentro ? nodo.offsetHeight : r.height;
  const lx = (x - r.left) * (ew / r.width), ly = (y - r.top) * (eh / r.height);
  const d = 2 * Math.hypot(Math.max(lx, ew - lx), Math.max(ly, eh - ly));
  const o = document.createElement("i");
  o.className = "ed-onda" + (nodo.matches(CLARA) ? " clara" : "");
  o.style.cssText = `width:${d}px;height:${d}px;left:${lx - d / 2}px;top:${ly - d / 2}px`;
  capa.append(o);
  (dentro ? nodo : document.body).append(capa);
  if (!dentro) seguir(nodo, capa, r);
  vivas++;
  // Cada tramo con su ritmo (un solo «easing» para todo la apagaba antes de crecer).
  const a = o.animate([
    { transform: "scale(.06)", opacity: 1, easing: "cubic-bezier(.2, .7, .3, 1)" },
    { transform: "scale(1)", opacity: 0.85, offset: 0.55, easing: "cubic-bezier(.4, 0, .7, .4)" },
    { transform: "scale(1)", opacity: 0 },
  ], { duration: 640, easing: "linear" });
  const fin = () => { capa.remove(); vivas--; };
  a.onfinish = fin;
  a.oncancel = fin;
}

/** Corazoncitos que suben y se apagan desde donde tocaste (y van con el botón si se mueve). */
function corazones(nodo, x, y) {
  if (!PREF.particulas) return;
  const grupo = document.createElement("span");
  grupo.className = "ed-corazones";
  document.body.append(grupo);
  if (nodo.isConnected) seguir(nodo, grupo, nodo.getBoundingClientRect());
  setTimeout(() => grupo.remove(), 1300);
  for (let i = 0; i < 5; i++) {
    const c = document.createElement("i");
    c.className = "ed-corazoncito";
    c.innerHTML = CORAZON;
    c.style.left = x + "px";
    c.style.top = y + "px";
    grupo.append(c);
    const ang = -Math.PI / 2 + (i - 2) * 0.42 + (Math.random() - 0.5) * 0.3;
    const dist = 34 + Math.random() * 26, s = 0.6 + Math.random() * 0.5, giro = (Math.random() - 0.5) * 50;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    c.animate([
      { transform: "translate(-50%, -50%) scale(.2)", opacity: 0, easing: "cubic-bezier(.2, .9, .3, 1.3)" },
      { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55}px)) scale(${s}) rotate(${giro / 2}deg)`, opacity: 1, offset: 0.35, easing: "cubic-bezier(.3, 0, .6, 1)" },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy - 18}px)) scale(${s * 0.8}) rotate(${giro}deg)`, opacity: 0 },
    ], { duration: 760 + i * 40, delay: i * 25, easing: "linear", fill: "backwards" }).onfinish = () => c.remove();
  }
}

/* — Desplazar: la sombrita de la cabecera (sólo cambia al cruzar los 4 px) — */
const pend = new Set();
let cuadro = 0;
function revisar() {
  cuadro = 0;
  for (const n of pend) {
    const si = n.scrollTop > 4;
    if (si !== (n.dataset.desplazado === "1")) { if (si) n.dataset.desplazado = "1"; else delete n.dataset.desplazado; }
  }
  pend.clear();
}

let puesto = false;
export function iniciarTacto() {
  if (puesto) return;
  puesto = true;
  let ultimo = null;
  document.addEventListener("pointerdown", (e) => {
    ultimo = null;
    if (e.button > 0 || quieto()) return;
    const t = e.target instanceof Element ? e.target : null;
    if (!t || t.closest(NUNCA)) return;
    const nodo = t.closest(TOCABLE);
    if (!nodo || nodo.disabled || nodo.getAttribute("aria-disabled") === "true") return;
    ultimo = { nodo, x: e.clientX, y: e.clientY };
    onda(nodo, e.clientX, e.clientY);
  }, { capture: true, passive: true });
  document.addEventListener("click", (e) => {
    const u = ultimo;
    ultimo = null;
    if (!u || quieto() || !u.nodo.matches(CLARA) || !u.nodo.contains(e.target)) return;
    corazones(u.nodo, u.x, u.y);
    vibrar(6);
  }, { capture: true, passive: true });
  document.addEventListener("scroll", (e) => {
    const n = e.target;
    if (!(n instanceof Element) || n.scrollHeight - n.clientHeight < 8) return;
    pend.add(n);
    cuadro ||= requestAnimationFrame(revisar);
  }, { capture: true, passive: true });
}
