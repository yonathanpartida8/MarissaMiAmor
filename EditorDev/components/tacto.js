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
 * que al tocar. La onda vive en una capita FIJA encima del botón, recortada
 * con su misma forma: el botón no se toca, así nada cambia de lugar ni parpadea.
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

/** La onda: una capita fija con la forma del botón y un círculo que crece desde el dedo. */
function onda(nodo, x, y) {
  if (vivas >= 4) return;
  const r = nodo.getBoundingClientRect();
  if (r.width < 8 || r.height < 8 || r.width > innerWidth * 1.2 || r.height > 420) return;
  const cs = getComputedStyle(nodo);
  const capa = document.createElement("span");
  capa.className = "ed-onda-capa";
  capa.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${cs.borderRadius}`;
  const lx = x - r.left, ly = y - r.top;
  const d = 2 * Math.hypot(Math.max(lx, r.width - lx), Math.max(ly, r.height - ly));
  const o = document.createElement("i");
  o.className = "ed-onda" + (nodo.matches(CLARA) ? " clara" : "");
  o.style.cssText = `width:${d}px;height:${d}px;left:${lx - d / 2}px;top:${ly - d / 2}px`;
  capa.append(o);
  document.body.append(capa);
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

/** Corazoncitos que suben y se apagan desde donde tocaste. */
function corazones(x, y) {
  if (!PREF.particulas) return;
  for (let i = 0; i < 5; i++) {
    const c = document.createElement("i");
    c.className = "ed-corazoncito";
    c.innerHTML = CORAZON;
    c.style.left = x + "px";
    c.style.top = y + "px";
    document.body.append(c);
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
    corazones(u.x, u.y);
    vibrar(6);
  }, { capture: true, passive: true });
  document.addEventListener("scroll", (e) => {
    const n = e.target;
    if (!(n instanceof Element) || n.scrollHeight - n.clientHeight < 8) return;
    pend.add(n);
    cuadro ||= requestAnimationFrame(revisar);
  }, { capture: true, passive: true });
}
