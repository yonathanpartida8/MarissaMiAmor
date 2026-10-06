/**
 * AUTOGUARDADO — que nunca se pierda nada, sin escribir a cada tecla.
 *
 * Espera a que se deje de tocar un momento (800 ms), pero si se sigue y
 * sigue editando, guarda igual cada 5 s como mucho. Escribe sólo lo que
 * cambió: las páginas tocadas y lo general del proyecto. Al cerrar o
 * cambiar de pestaña guarda en el acto.
 *
 * Se puede apagar (Herramientas → Guardar): entonces sólo se guarda al pedirlo
 * y al salir del editor se pregunta qué hacer con lo que no se guardó.
 */
const PREF = "editordev:autoguardar";
import { guardarCambios } from "./db.js";

export class Autoguardado {
  constructor(estado, alEstado) {
    this.estado = estado;
    this.alEstado = alEstado || (() => {});
    this.reloj = null;
    this.primero = 0;
    this.guardando = null;
    this.error = null;
    try { this.activo = localStorage.getItem(PREF) !== "no"; } catch (e) { this.activo = true; }
    estado.on("sucio", () => this.programar());
    const ya = () => { if (this.pendiente && this.activo && !this.descartado) this.ahora(); };
    addEventListener("pagehide", ya);
    document.addEventListener("visibilitychange", () => { if (document.hidden) ya(); });
  }

  get pendiente() {
    const s = this.estado.sucio;
    return s.meta || s.paginas.size > 0 || s.borradas.size > 0;
  }

  /** Encender o apagar el guardado automático. */
  ponerActivo(on) {
    this.activo = !!on;
    try { localStorage.setItem(PREF, on ? "si" : "no"); } catch (e) { /* nada */ }
    if (on && this.pendiente) this.programar();
    else this.alEstado(this.pendiente ? "sin-guardar" : "guardado");
  }

  /** Salir sin guardar: lo pendiente se olvida (y no se guarda al cerrar la página). */
  descartar() {
    clearTimeout(this.reloj);
    this.reloj = null;
    this.descartado = true;
    this.estado.sucio = { meta: false, paginas: new Set(), borradas: new Set() };
  }

  programar() {
    if (!this.activo) { this.alEstado("sin-guardar"); return; }
    this.alEstado("guardando");
    const ahora = performance.now();
    if (!this.reloj) this.primero = ahora;
    clearTimeout(this.reloj);
    const espera = Math.max(0, Math.min(800, 5000 - (ahora - this.primero)));
    this.reloj = setTimeout(() => this.ahora(), espera);
  }

  async ahora() {
    clearTimeout(this.reloj);
    this.reloj = null;
    if (this.guardando) { await this.guardando; if (!this.pendiente) return; }
    const e = this.estado;
    const p = e.proyecto;
    if (!p) return;
    const sucias = [...e.sucio.paginas];
    const borradas = [...e.sucio.borradas];
    e.sucio = { meta: false, paginas: new Set(), borradas: new Set() };
    this.guardando = guardarCambios(p, sucias, borradas)
      .then(() => { this.error = null; this.alEstado(this.pendiente ? "guardando" : "guardado"); })
      .catch((err) => {
        // No se pudo: se vuelve a marcar para no perderlo.
        for (const s of sucias) e.sucio.paginas.add(s);
        for (const b of borradas) e.sucio.borradas.add(b);
        e.sucio.meta = true;
        this.error = err;
        this.alEstado("error", err);
      })
      .finally(() => { this.guardando = null; });
    return this.guardando;
  }
}
