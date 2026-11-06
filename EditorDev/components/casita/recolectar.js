/**
 * RECOLECTAR (Fase 67): como en Stardew Valley, en el patio hay cositas para recoger que vuelven a salir solas.
 *
 *   · Zarzas con frambuesas o moras (el arbusto se queda; las bayas vuelven en unas horas), hongos bajo los árboles,
 *     flores silvestres en el pasto y piñas bajo los pinos (estos se van al recogerlos y vuelven a salir después).
 *   · Tocas una y tu monito va, se agacha y la recoge: va a la canasta de los dos (se guarda en la casa, así tu
 *     amorcito ve la misma canasta y los dos ven lo mismo en el patio: lo único que se guarda es cuándo se recogió).
 *   · De la canasta sacas una cosa a la mano: las bayas y los hongos se comen (quitan hambre) y todo se puede
 *     regalar a tu amorcito (con lo de siempre: «Regalárselo»).
 *   · Todo es pixel art (cuadritos de 3 en el patio, de 4 en la mano y en la canasta).
 */
import { el, aviso } from "../ui.js";
import { inicioDe } from "./cuartos.js";
import { editable, pisable, hash } from "./exterior.js";
import { COSAS_MANO } from "./catalogo/index.js";

const ahora = () => Math.floor(Date.now() / 1000);
const sinMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Los dibujitos (10 × 10; cada letra un color) ── */
const PAL = {
  frambuesa: { R: "#e8436a", r: "#a8244a", l: "#ff9fb8", v: "#6fbf73", V: "#3f8a4a", o: "#5a1a35" },
  mora: { R: "#6a2d84", r: "#3e1650", l: "#b58ae0", v: "#6fbf73", V: "#3f8a4a", o: "#24102e" },
  hongo: { R: "#e8434a", r: "#a82432", l: "#ffffff", c: "#f3e3d3", C: "#cdb7a4", o: "#5a1a25" },
  flor: { R: "#ff8fb8", r: "#e05c8f", l: "#fff3b0", y: "#ffd84d", v: "#6fbf73", V: "#3f8a4a", o: "#5a2a3e" },
  pina: { R: "#a8714b", r: "#6e4426", l: "#d49b68", v: "#4f9a62", o: "#3a2418" },
};
const DIBUJO = {
  frambuesa: ["....vV....", "...vVv....", "..oRRoRo..", ".oRlRrRRo.", ".oRRrRlRo.", "oRlRRoRRRo", "oRRrRRlRRo", ".oRRRRRro.", "..orRRro..", "...oooo..."],
  mora: ["....vV....", "...vVv....", "..oRRoRo..", ".oRlRrRRo.", ".oRRrRlRo.", "oRlRRoRRRo", "oRRrRRlRRo", ".oRRRRRro.", "..orRRro..", "...oooo..."],
  hongo: ["..oooooo..", ".oRRlRRRo.", "oRlRRRRlRo", "oRRRRlRRRo", "orrrrrrrro", ".oocccCoo.", "...ocCo...", "...ocCo...", "...ocCo...", "..oooooo.."],
  flor: ["...oRRo...", "..oRllRo..", ".oRlyylRo.", ".oRlyylRo.", "..oRllRo..", "...oRro...", "....Vv....", "..vVvV....", "...vVv.vV.", "....Vvv..."],
  pina: ["....oo....", "...olRo...", "..oRlrRo..", "..olRRlo..", ".oRrlRrRo.", ".olRRlRlo.", ".oRrlRrRo.", "..olRRlo..", "...oRro...", "....oo...."],
};
const CACHE = new Map();
/** El dibujito pixel como imagen (cuadrito de `k` pixeles). */
export function imagenForraje(t, k = 4) {
  const clave = t + k;
  if (CACHE.has(clave)) return CACHE.get(clave);
  const cv = document.createElement("canvas"), D = DIBUJO[t], P = PAL[t];
  cv.width = 10 * k; cv.height = 10 * k;
  const c = cv.getContext("2d");
  D.forEach((fila, j) => [...fila].forEach((ch, i) => { if (P[ch]) { c.fillStyle = P[ch]; c.fillRect(i * k, j * k, k, k); } }));
  const url = cv.toDataURL();
  CACHE.set(clave, url);
  return url;
}
/** La zarza (pixel, 16 × 12): hojitas y, si ya salieron, sus bayas. */
function imagenZarza(tipo, conBayas, sem) {
  const clave = "z" + tipo + conBayas + sem;
  if (CACHE.has(clave)) return CACHE.get(clave);
  const W = 16, H = 12, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), hojas = ["#3f8a4a", "#57a85f", "#72c26a", "#93d983"], P = PAL[tipo];
  const lleno = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const dx = (i + 0.5 - W / 2) / (W / 2), dy = (j + 0.5 - H * 0.6) / (H * 0.6), d = dx * dx + dy * dy * 1.1 + (hash(i, j, sem) - 0.5) * 0.18;
    if (d > 1 || j >= H - 1) continue;
    lleno.push([i, j]);
    const q = j < H * 0.3 ? 3 : dx > 0.3 ? 2 : dy > 0.4 ? 0 : 1;
    c.fillStyle = hojas[Math.max(0, Math.min(3, q - (hash(i, j, sem + 1) < 0.2 ? 1 : 0)))]; c.fillRect(i, j, 1, 1);
  }
  // Su contorno oscuro.
  const hay = new Set(lleno.map(([i, j]) => i + "," + j));
  c.fillStyle = "#24402b";
  for (const [i, j] of lleno) for (const [a, b] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]) if (!hay.has(a + "," + b) && a >= 0 && b >= 0 && a < W && b < H) c.fillRect(a, b, 1, 1);
  if (conBayas) for (let q = 0; q < 7; q++) {
    const [i, j] = lleno[Math.floor(hash(q, 3, sem) * lleno.length)];
    if (j > H - 3) continue;
    c.fillStyle = P.r; c.fillRect(i, j, 1, 1); c.fillStyle = P.R; c.fillRect(i, Math.max(0, j - 1), 1, 1); c.fillStyle = P.l; c.fillRect(i, Math.max(0, j - 1), 1, 1);
  }
  const url = cv.toDataURL();
  CACHE.set(clave, url);
  return url;
}

/** Lo que se recoge (y cada cuánto vuelve a salir, en segundos). */
export const FORRAJE = {
  frambuesa: { n: "Frambuesas", uno: "frambuesas", cada: 3 * 3600, come: true },
  mora: { n: "Moras", uno: "moras", cada: 3 * 3600, come: true },
  hongo: { n: "Hongo", uno: "un hongo", cada: 5 * 3600, come: true },
  flor: { n: "Flor silvestre", uno: "una flor silvestre", cada: 2 * 3600 },
  pina: { n: "Piña de pino", uno: "una piña de pino", cada: 4 * 3600 },
};
// En la mano (y para regalar): las mismas, en pixel de 4.
for (const [k, f] of Object.entries(FORRAJE)) if (!COSAS_MANO[k]) COSAS_MANO[k] = { n: f.n, comible: !!f.come, arte: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${DIBUJO[k].map((fila, j) => [...fila].map((ch, i) => (PAL[k][ch] ? `<rect x="${i * 4}" y="${j * 4}" width="4" height="4" fill="${PAL[k][ch]}"/>` : "")).join("")).join("")}</svg>` };

/* ── Dónde hay (en el patio; x desde su orilla izquierda) ── */
const ZARZAS = [[520, 860], [770, 650], [300, 1010], [990, 1380], [1430, 1420], [1840, 850], [2080, 1390], [1230, 1520]];
const SUELO = [["hongo", 690, 1100], ["hongo", 950, 1505], ["hongo", 215, 1445], ["hongo", 1660, 1110], ["hongo", 1590, 1520], ["pina", 2275, 1025], ["pina", 1745, 1105], ["pina", 2195, 1505], ["pina", 375, 1510],
  ["flor", 600, 1450], ["flor", 1150, 1470], ["flor", 1800, 1340], ["flor", 455, 600], ["flor", 1505, 640], ["flor", 1080, 640], ["flor", 860, 1240]];
/** Un lugarcito que sí se puede (en el pasto, sin caminos ni agua ni escenario): si no, busca junto. */
function acomodar(x, y) {
  for (const [dx, dy] of [[0, 0], [24, 0], [-24, 0], [0, 20], [0, -20], [44, 14], [-44, -14], [60, 0], [-60, 0]]) if (editable(x + dx, y + dy) && pisable(x + dx, y + dy)) return [x + dx, y + dy];
  return null;
}
export const LUGARES = (() => {
  const l = [];
  ZARZAS.forEach(([x, y], i) => { const p = acomodar(x, y); if (p) l.push({ id: "z" + i, t: i % 2 ? "mora" : "frambuesa", zarza: true, x: p[0], y: p[1] }); });
  SUELO.forEach(([t, x, y], i) => { const p = acomodar(x, y); if (p) l.push({ id: "s" + i, t, x: p[0], y: p[1] }); });
  return l;
})();

export class Recolectar {
  constructor(j) { this.j = j; this.nodos = new Map(); }
  /** Lo de la canasta de los dos: { tipo: cuántos }. */
  canasta() { const c = this.j.cfgCuarto("jardin"), r = {}; for (const k of Object.keys(FORRAJE)) { const n = +c["c:" + k] || 0; if (n > 0) r[k] = n; } return r; }
  hay(l, t = ahora()) { return t - (+this.j.cfgCuarto("jardin")["r:" + l.id] || 0) >= FORRAJE[l.t].cada; }
  /** Los dibujitos en el patio (en el mundo, con su hondura). */
  armar() {
    const x0 = inicioDe("jardin");
    for (const l of LUGARES) {
      const w = l.zarza ? 48 : 30, h = l.zarza ? 36 : 30;
      const n = el("div.ca-forraje." + (l.zarza ? "zarza" : "suelo"), { dataset: { forraje: l.id }, role: "button", "aria-label": FORRAJE[l.t].n, style: { left: (x0 + l.x - w / 2) + "px", top: (l.y - h) + "px", width: w + "px", height: h + "px", zIndex: Math.round(l.y) } });
      this.j.mundo.append(n);
      this.nodos.set(l.id, { l, n });
    }
    this.pintar();
  }
  pintar() {
    const t = ahora();
    for (const { l, n } of this.nodos.values()) {
      const hay = this.hay(l, t);
      n.classList.toggle("vacio", !hay);
      const url = l.zarza ? imagenZarza(l.t, hay, l.id.length + l.x) : imagenForraje(l.t, 3);
      if (n.dataset.url !== url) { n.dataset.url = url; n.style.backgroundImage = `url(${url})`; }
    }
    this.j._pintarCanasta?.();
  }
  /** Tocaste una: tu monito va, se agacha y la recoge. */
  tocar(id) {
    const j = this.j, it = this.nodos.get(id);
    if (!it) return;
    const { l } = it, x0 = inicioDe("jardin"), yo = j.yo, f = FORRAJE[l.t];
    if (!this.hay(l)) {
      const falta = Math.max(1, Math.ceil((f.cada - (ahora() - (+j.cfgCuarto("jardin")["r:" + l.id] || 0))) / 3600));
      j._globo(yo, l.zarza ? `Todavía no salen más ${f.n.toLowerCase()} (en unas ${falta} h)` : `Aquí vuelve a salir en unas ${falta} h`, 2600);
      j.sonar("nop", { volumen: 0.5 });
      return;
    }
    const orden = ++yo.orden, lado = yo.gx < x0 + l.x ? -1 : 1, [gx, y] = j.nav.libre("jardin", x0 + l.x + lado * (l.zarza ? 34 : 20), l.y + 6);
    j._flecha?.(gx, y);
    j._caminar(yo, gx, y, () => {
      if (yo.orden !== orden || !j.vivo || !this.hay(l)) return;
      j._mirar(yo, -lado);
      yo.n.classList.add("recoge");
      j.sonar("hojas", { volumen: 0.5 });
      setTimeout(() => {
        yo.n.classList.remove("recoge");
        if (!j.vivo || !this.hay(l)) return;
        const cuantos = l.zarza ? 2 + Math.floor(hash(l.x, ahora() >> 12, 7) * 3) : 1, c = j.cfgCuarto("jardin");
        j.sync.op({ o: "cuarto", k: "jardin", v: { ["r:" + l.id]: ahora(), ["c:" + l.t]: (+c["c:" + l.t] || 0) + cuantos } });
        j.casa = j.sync.casa();
        if (!sinMov()) it.n.animate([{ transform: "scale(1)" }, { transform: "scale(1.12, .9)" }, { transform: "scale(1)" }], { duration: 260 });
        this._vuela(l, cuantos);
        this.pintar();
        j.sonar("pop"); setTimeout(() => j.vivo && j.sonar("ding", { volumen: 0.45 }), 220);
        j.particulas?.("brillo", { gx: x0 + l.x, y: l.y - 16 }, 0, 0, 4);
        j._globo(yo, `+${cuantos} ${cuantos > 1 ? f.n.toLowerCase() : f.n.toLowerCase()}`, 1600);
        j.necesidades?.sumar("diversion", 2);
      }, 640);
    });
    j._mandarYo({ accion: "", mueble: "" });
  }
  /** Las cositas saltan de donde estaban a la canasta (el botoncito). */
  _vuela(l, n) {
    const j = this.j, b = j.canastaB;
    if (sinMov() || !b) return;
    const x0 = inicioDe("jardin"), a = j.enPantalla(x0 + l.x, l.y - 14), R = j.raiz.getBoundingClientRect(), B = b.getBoundingClientRect();
    for (let i = 0; i < Math.min(3, n); i++) {
      const s = el("img.ca-forraje-vuela", { src: imagenForraje(l.t, 4), alt: "", style: { left: (a.x - R.left - 10) + "px", top: (a.y - R.top - 10) + "px" } });
      j.raiz.append(s);
      const dx = B.left + B.width / 2 - a.x, dy = B.top + B.height / 2 - a.y;
      s.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx / 2 + (i - 1) * 16}px, ${dy / 2 - 70}px) scale(1.2)`, offset: 0.45 }, { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: 0.4 }], { duration: 640 + i * 90, easing: "cubic-bezier(.3,.7,.4,1)" }).onfinish = () => s.remove();
    }
    setTimeout(() => { if (!sinMov()) b.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 260 }); }, 640);
  }
  /** Sacar una cosa de la canasta a la mano (o comérsela de una vez). */
  sacar(t, comer = false) {
    const j = this.j, c = j.cfgCuarto("jardin"), n = +c["c:" + t] || 0;
    if (n <= 0) return false;
    j.sync.op({ o: "cuarto", k: "jardin", v: { ["c:" + t]: n - 1 } });
    j.casa = j.sync.casa();
    if (comer) {
      const m = j.yo;
      m.n.classList.add("g-come"); setTimeout(() => m.n.classList.remove("g-come"), 1600);
      j.sonar("comer", { volumen: 0.7 }); j.necesidades?.comio(t);
      j._mandarYo({ ev: { k: "come" } });
      j._globo(m, "¡Qué rico!", 1600);
    } else {
      if (j.yo.lleva) j.soltar();
      j._ponerLleva(j.yo, t); j.sonar("levantar"); j._mandarYo({ lleva: t });
      aviso(`Traes ${FORRAJE[t].uno} en la mano: se lo puedes regalar a tu amorcito`, 2600);
    }
    j._pintarCanasta?.();
    return true;
  }
  limpiar() { for (const { n } of this.nodos.values()) n.remove(); this.nodos.clear(); }
}
