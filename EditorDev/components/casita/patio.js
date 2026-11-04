/**
 * EL PATIO EN LA PANTALLA (Fase 64): arma el exterior (exterior.js) dentro del mundo de la casita.
 *
 *   · Dentro del cuarto «jardín» (hasta atrás de todo): el paisaje, el terreno pixel, la fachada y, al acomodar,
 *     la máscara naranja de lo que no se puede acomodar.
 *   · En el mundo, con su hondura (como los muebles y los monitos): los árboles, arbustos, rocas, la fuente y los
 *     letreros. Los árboles se mecen (más con viento) y se pueden sacudir; los frutales te dan fruta.
 */
import { el, aviso } from "../ui.js";
import { inicioDe } from "./cuartos.js";
import { MAPA, FACHADA, ESCENARIO, MEDIDAS, ES_ARBOL, hash, spriteEsc, pintarTerreno, pintarPanorama, pintarFachada, pintarNoEditable, brillosAgua, huellaEsc } from "./exterior.js";

const sinMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Patio {
  constructor(j) { this.j = j; this.esc = new Map(); this.hora = ""; }
  /** Los lienzos del fondo, dentro del cuarto (que ya está hasta atrás). */
  armar(n) {
    this.n = n;
    const x0 = inicioDe("jardin"), yT = MAPA.fondo - 12;
    const cv = (cls, top, alto, z, left = 0, ancho = MAPA.w) => el("canvas." + cls, { "aria-hidden": "true", style: { left: left + "px", top: top + "px", width: ancho + "px", height: alto + "px", zIndex: z } });
    this.pan = cv("ca-panorama", -MAPA.arriba, MAPA.fondo + 6 + MAPA.arriba, 0);
    this.ter = cv("ca-terreno", yT, MAPA.alto - yT, 1);
    this.fach = cv("ca-fachada-px", 0, 0, 2);
    this.mask = cv("ca-noedit", yT, MAPA.alto - yT, 3);
    this.agua = el("div.ca-agua-brillos", { "aria-hidden": "true" }, brillosAgua().map(([x, y, h]) => el("i", { style: { left: x + "px", top: y + "px", animationDelay: -(h * 3).toFixed(2) + "s" } })));
    n.append(this.pan, this.ter, this.fach, this.agua, this.mask);
    // (El terreno se dibuja en pedacitos, al rato de entrar o al ir al patio: nunca traba la pantalla.)
    this.ter.style.background = "#6dbb66";
    this._tTer = setTimeout(() => this.pintarTerreno(), 1500);
    this._mascaraLista = false;
    // El escenario, en el mundo (para que tenga hondura con los muebles y los monitos).
    for (const e of ESCENARIO) {
      const m = MEDIDAS[e.k], s = spriteEsc(e.k, e.v), arbol = ES_ARBOL.has(e.k);
      const nodo = el("div.ca-esc." + e.k, { dataset: { esc: e.id }, role: "button", "aria-label": this._nombre(e), style: { left: (x0 + e.x - m.w / 2) + "px", top: (e.y - m.h) + "px", width: m.w + "px", height: m.h + "px", zIndex: Math.round(e.y), "--d": -(hash(e.x, e.y, 2) * 5).toFixed(2) + "s", "--p": (4 + hash(e.x, e.y, 6) * 3).toFixed(2) + "s" } }, [
        el("i.esc-toque"), el("i.esc-tronco", { style: { backgroundImage: `url(${s.tronco})` } }),
        arbol ? el("i.esc-copa", { style: { backgroundImage: `url(${s.copa})` } }) : null,
        e.k === "fuente" ? el("i.esc-chorro") : null,
      ].filter(Boolean));
      this.j.mundo.append(nodo);
      this.esc.set(e.id, { e, n: nodo });
    }
  }
  pintarTerreno() {
    clearTimeout(this._tTer);
    if (this._ter) return this._ter;
    this._ter = pintarTerreno(this.ter).then(() => { this.ter.style.background = ""; }).catch(() => { /* nada: se queda el pasto liso */ });
    return this._ter;
  }
  _nombre(e) { return { roble: "Roble", cerezo: "Cerezo en flor", frutal: e.v ? "Naranjo" : "Manzano", pino: "Pino", abedul: "Abedul", sauce: "Sauce", arbusto: "Arbusto", roca: "Roca", fuente: "Fuente de los deseos", letrero: "Letrero" }[e.k] || "Escenario"; }
  /** El paisaje y la fachada cambian con la hora (las ventanas se prenden de noche). */
  pintarHora(hora, clima) {
    const clave = hora + "|" + clima;
    if (clave === this.hora || !this.pan) return;
    this.hora = clave;
    try {
      const r = pintarPanorama(this.pan, hora, clima);
      const f = pintarFachada(this.fach, hora);
      Object.assign(this.fach.style, { left: f.left + "px", top: f.top + "px", width: f.width + "px", height: f.height + "px" });
      this.n.querySelector(".ca-cielo")?.style.setProperty("background", r.arriba);
    } catch (e) { /* nada */ }
  }
  /** Al acomodar: la máscara naranja (se dibuja la primera vez que se necesita). */
  editando(on) {
    if (on && !this._mascaraLista) { this._mascaraLista = true; try { pintarNoEditable(this.mask); } catch (e) { /* nada */ } }
  }
  lejos(on) { for (const { n } of this.esc.values()) n.classList.toggle("lejos", on); }
  /** Lo que estorba en el piso (para la navegación). */
  huellas() { return [...this.esc.values()].map(({ e }) => huellaEsc(e)); }
  /** Tocar algo del escenario: tu monito va y lo usa. */
  tocar(id) {
    const j = this.j, it = this.esc.get(id);
    if (!it) return;
    const { e, n } = it, x0 = inicioDe("jardin"), m = MEDIDAS[e.k], yo = j.yo, orden = ++yo.orden;
    const lado = yo.gx < x0 + e.x ? -1 : 1, [gx, y] = j.nav.libre("jardin", x0 + e.x + lado * (m.hw + 30), e.y + 12);
    j._flecha(gx, y);
    j._caminar(yo, gx, y, () => {
      if (yo.orden !== orden || !j.vivo) return;
      j._mirar(yo, -lado);
      // (Fase 64) Con la escoba o el rastrillo, barre las hojitas de junto; con la regadera, riega el árbol.
      const h = j.herramienta();
      if (h === "barrer") { j._limpiar(); return; }
      if (h === "regar") { j.sonar("regar"); j.particulas("agua", { gx: x0 + e.x, y: e.y - 30 }, 0, 0, 6); yo.n.classList.add("limpiando", "l-regar"); setTimeout(() => yo.n.classList.remove("limpiando", "l-regar"), 1200); j._globo(yo, "Le di su agüita", 1800); return; }
      if (ES_ARBOL.has(e.k)) {
        // Sacudir el árbol: se mueve la copa y caen hojitas (o pétalos). Los frutales te dan una fruta.
        if (!sinMov()) n.animate([{ transform: "rotate(0)" }, { transform: "rotate(-2.4deg)" }, { transform: "rotate(2deg)" }, { transform: "rotate(-1deg)" }, { transform: "rotate(0)" }], { duration: 620, easing: "ease-out" });
        j.sonar("whoosh", { volumen: 0.5 });
        j.suciedad?.sacudir(x0 + e.x, e.y, m.h * 0.7, m.hojas, e.k === "cerezo" ? 7 : 4);
        if (e.k === "frutal") setTimeout(() => j.vivo && j.dar(e.v ? "naranja" : "manzana", { gx: x0 + e.x, y: e.y, def: { h: m.h } }), 380);
        j.necesidades?.sumar("diversion", 2);
      } else if (e.k === "fuente") {
        j.gesto(yo, "beso"); j.sonar("ding");
        setTimeout(() => j.particulas("corazon", { gx: x0 + e.x, y: e.y - 120 }, 0, 0, 6), 300);
        j._globo(yo, "Pedí un deseo para los dos", 3400);
        j.necesidades?.sumar("diversion", 3);
      } else if (e.k === "letrero") {
        aviso("Izquierda: jardín de flores y estanque · Derecha: huerto · Abajo: el río y el prado", 4200);
        j.sonar("pop");
      } else { n.animate([{ transform: "scale(1)" }, { transform: "scale(1.06, .94)" }, { transform: "scale(1)" }], { duration: 300 }); j.sonar("pop", { volumen: 0.6 }); }
    });
    j._mandarYo({ accion: "", mueble: "" });
  }
  /** La fachada con sus faroles: dos luces cálidas a los lados de la puerta (para la luz de noche). */
  luces() { const x0 = inicioDe("jardin"); return [[FACHADA.puerta - 79, 318], [FACHADA.puerta + 79, 318]].map(([x, y]) => ({ x, y, r: 170, k: [255, 214, 150], i: 0.9 })); }
}
