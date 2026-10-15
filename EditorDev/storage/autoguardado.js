/**
 * AUTOGUARDADO — que nunca se pierda nada, sin interrumpir lo que haces.
 *
 *   Al editar     espera a que se deje de tocar un momento (800 ms), pero si
 *                 se sigue y sigue editando, guarda igual cada 5 s como
 *                 mucho. Escribe sólo lo que cambió (las páginas tocadas y lo
 *                 general), en una sola transacción: todo o nada.
 *   Confirmado    «Guardado» sólo se avisa cuando el navegador confirmó la
 *                 escritura Y al volver a leer está la revisión nueva.
 *   Si falla      lo que no se guardó se vuelve a marcar y se reintenta solo
 *                 (5 s, 10 s, 20 s… hasta cada minuto); la versión buena
 *                 anterior no se toca.
 *   Cada 5 min    además, una copia COMPLETA del librito (las 3 últimas, en
 *                 otra base: ver respaldos.js). También al abrir y al salir.
 *   Al salir      (cerrar, cambiar de app o de pestaña, apagar la pantalla)
 *                 se intenta guardar y, por si el navegador corta antes, se
 *                 deja un rescate al instante en localStorage (seguro.js).
 *
 * Se puede apagar (Herramientas → Guardar): entonces sólo se guarda al pedirlo
 * y al salir del editor se pregunta qué hacer con lo que no se guardó (las
 * copias completas cada 5 minutos siguen, por si acaso).
 *
 * Estados que avisa: pendiente · escribiendo · guardado · error · sin-guardar.
 */
const PREF = "editordev:autoguardar";
export const CADA_COPIA = 5 * 60 * 1000;
import { guardarCambios, revGuardada, pedirPersistencia } from "./db.js";
import { guardarCopia } from "./respaldos.js";
import { revisar, rescatar, quitarRescate } from "./seguro.js";

const enCalma = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 60));

export class Autoguardado {
  constructor(estado, alEstado) {
    this.estado = estado;
    this.alEstado = alEstado || (() => {});
    this.reloj = null;
    this.primero = 0;
    this.guardando = null;
    this.enVuelo = null;     // lo que se está escribiendo ahora
    this.error = null;
    this.fallos = 0;
    this.ultimo = 0;         // hora del último guardado confirmado
    this.ultimaCopia = 0;    // hora de la última copia completa
    this.cambiosCopia = false;
    try { this.activo = localStorage.getItem(PREF) !== "no"; } catch (e) { this.activo = true; }
    estado.on("sucio", () => { this.cambiosCopia = true; this.programar(); });
    estado.on("cargado", () => {
      this.error = null; this.fallos = 0; this.descartado = false;
      this.cambiosCopia = true; // una copia completa al poco de abrir
      clearTimeout(this._alAbrir);
      this._alAbrir = setTimeout(() => this.copiaCompleta("al abrir"), 8000);
    });
    const salir = () => this.alSalir();
    addEventListener("pagehide", salir);
    addEventListener("freeze", salir);
    document.addEventListener("visibilitychange", () => { if (document.hidden) salir(); });
    setInterval(() => this.copiaCompleta("cada 5 minutos"), CADA_COPIA);
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
    clearTimeout(this.reintento);
    this.reloj = null;
    this.descartado = true;
    this.estado.sucio = { meta: false, paginas: new Set(), borradas: new Set() };
    if (this.estado.proyecto) quitarRescate(this.estado.proyecto.id);
  }

  programar() {
    if (!this.activo) { this.alEstado("sin-guardar"); return; }
    this.descartado = false;
    if (!this.error) this.alEstado("pendiente");
    const ahora = performance.now();
    if (!this.reloj) this.primero = ahora;
    clearTimeout(this.reloj);
    const espera = Math.max(0, Math.min(800, 5000 - (ahora - this.primero)));
    this.reloj = setTimeout(() => this.ahora(), espera);
  }

  /** Guarda ya lo pendiente. Se resuelve cuando terminó (bien o mal: ver `this.error`). */
  async ahora() {
    clearTimeout(this.reloj);
    this.reloj = null;
    if (this.guardando) { await this.guardando; if (!this.pendiente) return; }
    const e = this.estado;
    const p = e.proyecto;
    if (!p || !this.pendiente) return;
    // Con algo roto no se escribe: lo bueno que ya estaba guardado se queda.
    const fallo = revisar(p);
    if (fallo) { this.error = new Error("No se guardó para no pisar lo bueno: " + fallo); this.alEstado("error", this.error); return; }
    const sucias = [...e.sucio.paginas];
    const borradas = [...e.sucio.borradas];
    e.sucio = { meta: false, paginas: new Set(), borradas: new Set() };
    this.enVuelo = { paginas: sucias, borradas };
    p.rev = (p.rev || 0) + 1;
    p.guardado = Date.now();
    const rev = p.rev;
    this.alEstado("escribiendo");
    this.guardando = guardarCambios(p, sucias, borradas)
      .then(() => revGuardada(p.id))
      .then((g) => {
        if (!g || g.rev !== rev) throw new Error("no se pudo comprobar lo guardado");
        this.enVuelo = null;
        this.error = null;
        this.fallos = 0;
        this.ultimo = Date.now();
        if (this.ultimo - (this._persistencia || 0) > 3600000) { this._persistencia = this.ultimo; pedirPersistencia(); }
        if (this.pendiente) this.alEstado("pendiente");
        else { quitarRescate(p.id); this.alEstado("guardado"); }
      })
      .catch((err) => {
        // No se pudo: se vuelve a marcar para no perderlo y se reintenta solo.
        this.enVuelo = null;
        for (const s of sucias) e.sucio.paginas.add(s);
        for (const b of borradas) if (!p.paginas[b]) e.sucio.borradas.add(b);
        e.sucio.meta = true;
        this.error = err;
        this.fallos++;
        this.alEstado("error", err);
        clearTimeout(this.reintento);
        this.reintento = setTimeout(() => { if (this.pendiente && this.activo && !this.descartado) this.ahora(); }, Math.min(60000, 5000 * 2 ** Math.min(4, this.fallos - 1)));
      })
      .finally(() => { this.guardando = null; });
    return this.guardando;
  }

  /** Copia completa del librito (en calma, sin trabar nada; `ya` = sin esperar, para al salir). */
  copiaCompleta(motivo, ya = false) {
    const p = this.estado.proyecto;
    if (!p || !this.cambiosCopia || this.copiando || this.descartado) return this.copiando || Promise.resolve(null);
    this.cambiosCopia = false;
    const hacer = async () => {
      if (revisar(p)) { this.cambiosCopia = true; return null; } // lo roto no se copia
      let texto;
      try { texto = JSON.stringify(p); } catch (e) { this.cambiosCopia = true; return null; }
      try {
        const info = await guardarCopia(p, texto, motivo);
        this.ultimaCopia = info ? info.t : this.ultimaCopia || Date.now();
        return info;
      } catch (e) { this.cambiosCopia = true; return null; }
    };
    this.copiando = new Promise((ok) => {
      const correr = () => hacer().then(ok, () => ok(null)).finally(() => { this.copiando = null; });
      if (ya) correr(); else enCalma(correr);
    });
    return this.copiando;
  }

  /** Al cerrar, cambiar de app o apagar la pantalla. */
  alSalir() {
    const p = this.estado.proyecto;
    if (!p || this.descartado) return;
    if (this.activo && (this.pendiente || this.enVuelo)) {
      // Primero lo que llega seguro (localStorage escribe al instante)…
      const ps = new Set([...this.estado.sucio.paginas, ...(this.enVuelo?.paginas || [])]);
      const bs = new Set([...this.estado.sucio.borradas, ...(this.enVuelo?.borradas || [])]);
      rescatar(p, ps, bs);
      // …y además el guardado normal (puede no alcanzar a terminar).
      this.ahora();
    }
    if (this.cambiosCopia) this.copiaCompleta("al salir", true);
  }
}
