/**
 * CURVA DE RITMO — cómo acelera y frena una animación, a mano.
 *
 * Dos asas que se arrastran (como en los editores de vídeo); la curva puede
 * pasarse de 0 o de 1 para que rebote o tome impulso. Una bolita la recorre
 * todo el tiempo para que se SIENTA cómo se moverá. Abajo, las de siempre
 * a un toque. Devuelve «cubic-bezier(a, b, c, d)», que entiende el librito.
 */
import { el, popover } from "./ui.js";

const RT = window.LibritoRT;
const PRESETS = [["suave", "Suave"], ["entraSale", "Entra y sale"], ["frena", "Frena"], ["acelera", "Acelera"], ["rebote", "Rebote"], ["elastico", "Elástico"], ["lineal", "Constante"]];
// El cuadro 0–1 ocupa W×H; arriba y abajo hay sitio para pasarse (rebotes y tomas de impulso).
const W = 220, H = 150, MX = 18, ARR = 0.62, ABA = 0.52;
const leer = (v) => {
  const s = RT.FACIL[v] ? RT.FACIL[v].v : v || RT.FACIL.suave.v;
  if (s === "linear") return [0, 0, 1, 1];
  const m = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(s);
  return m ? [+m[1], +m[2], +m[3], +m[4]] : [0.22, 0.8, 0.26, 1];
};
const texto = (p) => `cubic-bezier(${p.map((x) => +x.toFixed(3)).join(",")})`;

/** Abre el editor junto a `ancla`. `alUsar(valor)` recibe la curva elegida. */
export function abrirCurva(ancla, valor, alUsar, titulo = "Curva de ritmo") {
  let p = leer(valor);
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `${-MX} ${-ARR * H} ${W + 2 * MX} ${H * (1 + ARR + ABA)}`);
  svg.setAttribute("class", "ed-curva-svg");
  const mk = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); svg.append(n); return n; };
  mk("rect", { x: 0, y: 0, width: W, height: H, class: "ed-curva-caja" });
  for (let i = 1; i < 4; i++) { mk("line", { x1: (W * i) / 4, y1: 0, x2: (W * i) / 4, y2: H, class: "ed-curva-rej" }); mk("line", { x1: 0, y1: (H * i) / 4, x2: W, y2: (H * i) / 4, class: "ed-curva-rej" }); }
  mk("line", { x1: 0, y1: H, x2: W, y2: 0, class: "ed-curva-diag" });
  const b1 = mk("line", { class: "ed-curva-brazo" }), b2 = mk("line", { class: "ed-curva-brazo" });
  const curva = mk("path", { class: "ed-curva-linea" });
  const a1 = mk("circle", { r: 11, class: "ed-curva-asa", "data-i": 0 }), a2 = mk("circle", { r: 11, class: "ed-curva-asa b", "data-i": 1 });
  const X = (x) => x * W, Y = (y) => H - y * H;
  const bola = el("i.ed-curva-bola");
  const pista = el("div.ed-curva-pista", {}, [bola]);
  const val = el("code.ed-curva-val");
  let anim = null;
  const pintar = () => {
    curva.setAttribute("d", `M0 ${H} C ${X(p[0])} ${Y(p[1])}, ${X(p[2])} ${Y(p[3])}, ${W} 0`);
    for (const [a, b, i, x0, y0] of [[a1, b1, 0, 0, H], [a2, b2, 2, W, 0]]) {
      a.setAttribute("cx", X(p[i])); a.setAttribute("cy", Y(p[i + 1]));
      b.setAttribute("x1", x0); b.setAttribute("y1", y0); b.setAttribute("x2", X(p[i])); b.setAttribute("y2", Y(p[i + 1]));
    }
    val.textContent = texto(p);
    // La bolita recorre la pista con esta curva, una y otra vez.
    anim?.cancel();
    try { anim = bola.animate([{ left: "0%" }, { left: "100%" }], { duration: 1100, iterations: Infinity, easing: texto(p), endDelay: 450 }); } catch (e) { anim = null; }
    for (const c of chips.children) c.classList.toggle("on", texto(leer(c.dataset.v)) === texto(p));
  };
  // Arrastrar las asas (x entre 0 y 1; y libre para rebotar).
  svg.addEventListener("pointerdown", (ev) => {
    const a = ev.target.closest(".ed-curva-asa");
    if (!a) return;
    ev.preventDefault();
    const i = +a.dataset.i * 2;
    try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    const mover = (m) => {
      const r = svg.getBoundingClientRect(), k = (W + 2 * MX) / r.width;
      p[i] = Math.min(1, Math.max(0, ((m.clientX - r.left) * k - MX) / W));
      p[i + 1] = Math.min(1 + ARR - 0.04, Math.max(-ABA + 0.04, (H - ((m.clientY - r.top) * k - ARR * H)) / H));
      pintar();
    };
    const fin = () => { svg.removeEventListener("pointermove", mover); svg.removeEventListener("pointerup", fin); svg.removeEventListener("pointercancel", fin); };
    svg.addEventListener("pointermove", mover);
    svg.addEventListener("pointerup", fin);
    svg.addEventListener("pointercancel", fin);
  });
  const chips = el("div.ed-curva-chips", {}, PRESETS.map(([v, n]) => el("button", { type: "button", text: n, dataset: { v }, onClick: () => { p = leer(v); pintar(); } })));
  let pop = null;
  const usar = el("button.ed-btn.primario.chico", { type: "button", text: "Usar esta curva", onClick: () => { const v = PRESETS.find(([k]) => texto(leer(k)) === texto(p)); alUsar(v ? v[0] : texto(p)); anim?.cancel(); pop?.cerrar?.(); } });
  // «Usar» arriba: en el teléfono la hojita no tapa el botón aunque no quepa todo.
  pop = popover(ancla, [el("div.ed-curva-pie", {}, [el("div.ed-sub-t", { text: titulo }), usar]), svg, pista, chips, val], { clase: "ed-pop-curva" });
  pintar();
  return pop;
}
