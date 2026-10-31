/**
 * LAS TRAES (Fase 58): el juego de atraparse, los dos en la casita.
 *
 *   · Desde el menú de tu amorcito: «Jugar a las traes». Quien invita la trae primero.
 *   · Mientras juegan, NADIE corre más rápido que el otro: los dos caminan a la misma velocidad
 *     (en los dos teléfonos), así que se gana con estrategia, no con el dedo.
 *   · Quien la trae y alcanza al otro, ¡lo atrapa!: ahora la trae el otro (con dos segundos para escapar).
 *   · Dura dos minutos; al final dice quién atrapó más veces. Quita el aburrimiento.
 *   · Se avisa con los eventos del monito (ev «traes»): «ini» (yo la traigo), «toca» (te atrapé) y «fin».
 */
import { el, aviso } from "../ui.js";
import { vibrar } from "../../integraciones/plataforma.js";

export const VEL_TRAES = 250;        // la misma para los dos (unidades del mundo por segundo)
const DURA = 120000, ALCANCE = 48, ESCAPE = 2000;

export class LasTraes {
  constructor(j) { this.j = j; this.activo = false; }
  /** Empezar (quien invita la trae). `desdeElla`: la invitación llegó de tu amorcito. */
  empezar(desdeElla = false) {
    const j = this.j;
    this.activo = true; this.trae = desdeElla ? "suyo" : "yo"; this.puntos = { yo: 0, suyo: 0 };
    this.fin = performance.now() + DURA; this.inmune = performance.now() + ESCAPE;
    if (!desdeElla) j._mandarYo({ ev: { k: "traes", t: "ini" } });
    j.raiz.classList.add("jugando-traes");
    this._armarChip();
    clearInterval(this._t);
    this._t = setInterval(() => this._tic(), 120);
    j.sonar("traes"); vibrar(16);
    j._globo(desdeElla ? j.suyo : j.yo, "¡La traigo! ¡Corre!", 2600);
    this._pintar();
  }
  _armarChip() {
    this.chip?.remove();
    this.chipT = el("b"); this.chipS = el("small");
    this.chip = el("div.ca-traes", { role: "status", "aria-live": "polite" }, [el("i.ca-traes-ico"), el("span", {}, [this.chipT, this.chipS]), el("button.ca-traes-x", { type: "button", text: "Terminar", onClick: () => this.terminar(true) })]);
    this.j.raiz.append(this.chip);
  }
  _pintar() {
    if (!this.chip) return;
    const j = this.j, s = Math.max(0, Math.ceil((this.fin - performance.now()) / 1000));
    this.chip.classList.toggle("yo-trae", this.trae === "yo");
    this.chipT.textContent = this.trae === "yo" ? `¡La traes! Atrapa a ${j.pareja}` : `¡Corre! ${j.pareja} la trae`;
    this.chipS.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} · Tú ${this.puntos.yo} – ${this.puntos.suyo} ${j.pareja}`;
    j.yo.n.classList.toggle("la-trae", this.trae === "yo");
    j.suyo.n.classList.toggle("la-trae", this.trae === "suyo");
  }
  /** Dónde va de verdad un monito ahorita (aunque vaya caminando). */
  _donde(m) {
    const R = m.n.getBoundingClientRect(), M = this.j.mundo.getBoundingClientRect(), k = this.j.k || 1;
    return { x: (R.left - M.left) / k, y: (R.top - M.top) / k };
  }
  _tic() {
    const j = this.j;
    if (!this.activo || !j.vivo) return;
    if (performance.now() >= this.fin) { this.terminar(true); return; }
    this._pintar();
    // Sólo quien la trae decide si atrapó (en su teléfono), y se lo avisa al otro.
    if (this.trae !== "yo" || performance.now() < this.inmune) return;
    const a = this._donde(j.yo), b = this._donde(j.suyo);
    if (Math.hypot(a.x - b.x, (a.y - b.y) * 1.4) < ALCANCE) {
      this.puntos.yo++;
      this._cambia("suyo");
      j._mandarYo({ ev: { k: "traes", t: "toca" } });
      j._globo(j.yo, "¡Te atrapé!", 1800);
    }
  }
  _cambia(quien) {
    const j = this.j;
    this.trae = quien; this.inmune = performance.now() + ESCAPE;
    j.sonar("traes"); vibrar(26);
    const m = quien === "yo" ? j.yo : j.suyo;
    j.particulas("chispa", { gx: m.gx, y: m.y - 120 }, 0, 0, 6);
    j.gesto(m, "sorpresa", false);
    this._pintar();
  }
  /** Lo que llega de tu amorcito. */
  evento(t) {
    if (t === "ini") { if (!this.activo) this.empezar(true); return; }
    if (!this.activo) return;
    if (t === "toca") { this.puntos.suyo++; this._cambia("yo"); aviso(`¡${this.j.pareja} te atrapó! Ahora la traes tú`, 2000); }
    if (t === "fin") this.terminar(false);
  }
  terminar(avisar = true) {
    const j = this.j;
    if (!this.activo) return;
    this.activo = false;
    clearInterval(this._t);
    if (avisar) j._mandarYo({ ev: { k: "traes", t: "fin" } });
    j.raiz.classList.remove("jugando-traes");
    j.yo.n.classList.remove("la-trae"); j.suyo.n.classList.remove("la-trae");
    this.chip?.remove(); this.chip = null;
    const { yo, suyo } = this.puntos;
    aviso(yo > suyo ? `¡Ganaste! Atrapaste ${yo} ${yo === 1 ? "vez" : "veces"} a ${j.pareja}` : suyo > yo ? `Ganó ${j.pareja} (${suyo} a ${yo}). ¡La revancha!` : `¡Empate! ${yo} a ${suyo}`, 3600);
    j.necesidades?.sumar("diversion", 35);
    j.sonar("aplauso");
  }
  limpiar() { clearInterval(this._t); this.chip?.remove(); this.activo = false; }
}
