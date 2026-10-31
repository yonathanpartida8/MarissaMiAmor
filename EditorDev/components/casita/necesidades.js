/**
 * LAS NECESIDADES DE TU MONITO (Fase 58): hambre, sed, baño, ducha, sueño y diversión (aburrimiento).
 *
 *   · Bajan poquito a poquito mientras juegan (y más despacito con la app cerrada).
 *   · Se llenan haciendo la acción: dormir en la cama, bañarse (regadera o tina) e ir al baño llenan del 0
 *     al 100 en un minuto; la comida llena según lo que comas (una galleta poquito, un platillo mucho) y
 *     las bebidas quitan la sed; jugar juntos (las traes, el columpio, el trampolín, brincar en charcos,
 *     abrazos y besitos…) quita el aburrimiento.
 *   · Cuando algo ya hace falta, tu monito lo dice. Se guardan en este teléfono (son de tu monito).
 */
import { el } from "../ui.js";
import * as SRV from "../../integraciones/servidor.js";

export const NECESIDADES = [
  ["hambre", "Hambre", "Come algo: del refri, el frutero o un platillo en la mesa", "#ff9e7a"],
  ["sed", "Sed", "Toma agua de la llave, una limonada, un café o un licuado", "#7ec8ff"],
  ["bano", "Baño", "Siéntate un ratito en el excusado", "#ffd36e"],
  ["ducha", "Ducha", "Métete a la regadera o a la tina", "#86e0d4"],
  ["sueno", "Sueño", "Duérmete en la cama o en la hamaca", "#b9a2ff"],
  ["diversion", "Diversión", "Jueguen juntos: las traes, columpio, trampolín, charcos…", "#ff8fb8"],
];
// Cuántos minutos tarda en vaciarse cada una mientras juegan (con la app cerrada, 4 veces más).
const VACIA_MIN = { hambre: 45, sed: 32, bano: 50, ducha: 90, sueno: 120, diversion: 28 };
/** Lo que llena la comida (del 0 al 100) y lo que quita la sed. */
const COMIDA = { manzana: 14, hotcakes: 34, tostada: 18, elote: 22, helado: 12, sandia: 16, galleta: 10, platano: 14, uvas: 12, paleta: 8, malvavisco: 8, cafe: 4, limonada: 4 };
const BEBIDA = { cafe: 26, limonada: 40, licuado: 45, paleta: 16, helado: 8, sandia: 22, agua: 34 };
const PLATILLO = 45;   // un platillo de las recetas (mesa)
const DICE = {
  hambre: "Tengo hambre… ¿y si comemos algo?", sed: "Tengo sed", bano: "¡Necesito ir al baño!", ducha: "Me hace falta un bañito",
  sueno: "Tengo sueñito…", diversion: "Me aburro… ¿jugamos a las traes?",
};
const ICON = {
  hambre: '<path d="M7 3v8a3 3 0 0 0 3 3v7M10 3v6M13 3v8M17 3c-2 2-2 7 0 9v9"/>',
  sed: '<path d="M7 4h10l-1.5 16h-7z"/><path d="M8 9h8"/>',
  bano: '<path d="M6 4h8v6H6zM4 12h14a6 6 0 0 1-6 6H9z"/><path d="M9 18v3h6v-3"/>',
  ducha: '<path d="M5 20V8a4 4 0 0 1 8 0"/><path d="M10 9h6M11 13v1M14 13v1M17 13v1M11 17v1M14 17v1M17 17v1"/>',
  sueno: '<path d="M18 15A7 7 0 0 1 9 6a7 7 0 1 0 9 9z"/><path d="M15 4h4l-4 4h4"/>',
  diversion: '<circle cx="12" cy="12" r="8"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
};
const ico = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const lim = (v) => Math.max(0, Math.min(100, v));

export class Necesidades {
  constructor(j) {
    this.j = j;
    this.clave = `editordev:casita-necesidades:${String(j.yoUsuario || SRV.usuario?.() || "yo")}`;
    this.v = Object.fromEntries(NECESIDADES.map(([k]) => [k, 85]));
    try {
      const g = JSON.parse(localStorage.getItem(this.clave) || "null");
      if (g?.v) {
        // Lo que bajó mientras no estaban (4 veces más despacio; nunca menos de 15).
        const min = Math.min(60 * 24, Math.max(0, (Date.now() - (g.t || Date.now())) / 60000));
        for (const [k] of NECESIDADES) if (Number.isFinite(+g.v[k])) this.v[k] = Math.max(Math.min(15, +g.v[k]), lim(+g.v[k] - (100 / VACIA_MIN[k]) * min / 4));
      }
    } catch (e) { /* empieza llenito */ }
    this.ultDice = 0; this.llenando = "";
  }
  guardar() { try { localStorage.setItem(this.clave, JSON.stringify({ v: this.v, t: Date.now() })); } catch (e) { /* nada */ } }
  /** La barrita del HUD (compacta; al tocarla se abre con nombres y consejos). */
  armar() {
    this.filas = {};
    this.n = el("div.ca-nec", { role: "group", "aria-label": "Necesidades de tu monito" }, NECESIDADES.map(([k, t, ayuda, c]) => {
      const barra = el("i.ca-nec-barra", { style: { "--c": c } }, [el("b")]);
      const f = el("button.ca-nec-f", { type: "button", dataset: { k }, title: `${t}: ${ayuda}`, "aria-label": t, onClick: () => this.j.ayudaNecesidad?.(k) }, [el("i.ca-nec-ico", { html: ico(k) }), barra, el("small", { text: t })]);
      this.filas[k] = { f, b: barra.firstChild };
      return f;
    }));
    this.n.addEventListener("click", (e) => { if (!e.target.closest(".ca-nec-f")) this.n.classList.toggle("abierta"); });
    this.pintar();
    return this.n;
  }
  pintar() {
    for (const [k] of NECESIDADES) {
      const x = this.filas?.[k];
      if (!x) continue;
      const v = Math.round(this.v[k]);
      x.b.style.width = v + "%";
      x.f.classList.toggle("baja", v < 25);
      x.f.classList.toggle("muy-baja", v < 12);
      x.f.classList.toggle("llena", this.llenando === k);
      x.f.setAttribute("aria-valuenow", String(v));
    }
  }
  sumar(k, n) {
    if (!(k in this.v)) return;
    const antes = this.v[k];
    this.v[k] = lim(antes + n);
    if (antes < 99.5 && this.v[k] >= 99.5) { this.j.sonar("necesidad", { volumen: 0.6 }); this.j.particulas?.("estrella", { gx: this.j.yo.gx, y: this.j.yo.y - 150 }, 0, 0, 3); }
    this.pintar(); this.guardar();
  }
  /** Comiste algo de la mano (o un platillo de la mesa). */
  comio(cosa, platillo = false) {
    if (platillo) { this.sumar("hambre", PLATILLO); return; }
    if (COMIDA[cosa]) this.sumar("hambre", COMIDA[cosa]);
    if (BEBIDA[cosa]) this.sumar("sed", BEBIDA[cosa]);
    if (!COMIDA[cosa] && !BEBIDA[cosa]) this.sumar("hambre", 16);
  }
  bebio(cosa = "agua") { this.sumar("sed", BEBIDA[cosa] || 30); }
  /** Cada segundo: bajan, o suben si estás haciendo la acción (un minuto del 0 al 100). */
  tic(dt = 1) {
    const j = this.j, m = j.yo, mueble = j.objs.get(String(m.mueble || "").split(":")[0])?.d.k || "";
    const llena = m.accion === "dormido" ? "sueno" : m.accion === "duchando" || m.accion === "banando" ? "ducha" : m.accion === "sentado" && mueble === "inodoro" ? "bano" : "";
    this.llenando = llena;
    for (const [k] of NECESIDADES) {
      if (k === llena) this.v[k] = lim(this.v[k] + (100 / 60) * dt);
      else this.v[k] = lim(this.v[k] - (100 / (VACIA_MIN[k] * 60)) * dt * (m.accion === "dormido" && k === "diversion" ? 0.3 : 1));
    }
    // Jugar quita el aburrimiento solito: columpio, trampolín y las traes.
    if (m.accion === "columpio" || j.traes?.activo) this.v.diversion = lim(this.v.diversion + 1.6 * dt);
    if (llena && this.v[llena] >= 99.5 && this._avisoLleno !== llena) { this._avisoLleno = llena; this.j.sonar("necesidad", { volumen: 0.6 }); }
    if (!llena) this._avisoLleno = "";
    this.pintar();
    if ((this._g = (this._g || 0) + dt) > 10) { this._g = 0; this.guardar(); }
    // Si algo ya hace falta, tu monito lo dice (de vez en cuando, nunca a cada rato).
    const ahora = performance.now();
    if (ahora - this.ultDice > 45000 && !m.accion) {
      const peor = NECESIDADES.map(([k]) => k).sort((a, b) => this.v[a] - this.v[b])[0];
      if (this.v[peor] < 22) {
        this.ultDice = ahora;
        j._globo(m, DICE[peor].replace("las traes", `las traes con ${j.pareja}`), 4200);
        if (peor === "sueno") { j.gesto(m, "estira"); j.sonar("bostezo", { volumen: 0.6 }); }
      }
    }
  }
}
