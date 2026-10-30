/**
 * EN TIEMPO REAL: la casa y los monitos entre los dos teléfonos, y todo se guarda solo.
 *
 * La casa viaja como cambios sueltos («ops»: poner, quitar, estado, cuarto) que el servidor aplica en
 * orden: si los dos acomodan a la vez, no se pisan. Lo que tú cambias se ve al instante (se aplica aquí
 * encima de lo último que mandó el servidor) y se va mandando en grupitos.
 */
import * as SRV from "../../integraciones/servidor.js";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const clonar = (x) => JSON.parse(JSON.stringify(x));

/** Lo mismo que hace el servidor (servidor.py → _aplicar_ops), para verlo al instante. */
export function aplicarOps(casa, ops) {
  casa ||= {};
  casa.objetos ||= []; casa.cuartos ||= {};
  for (const op of ops) {
    if (op.o === "iniciar") { if (!casa.objetos.length && op.casa) { const n = clonar(op.casa); casa.objetos = n.objetos || []; casa.cuartos = n.cuartos || {}; } }
    else if (op.o === "pon") { const i = casa.objetos.findIndex((x) => x.id === op.obj.id); if (i >= 0) casa.objetos[i] = clonar(op.obj); else casa.objetos.push(clonar(op.obj)); }
    else if (op.o === "quita") casa.objetos = casa.objetos.filter((x) => x.id !== op.id);
    else if (op.o === "estado") { const x = casa.objetos.find((y) => y.id === op.id); if (x) x.e = { ...(x.e || {}), ...op.e }; }
    else if (op.o === "cuarto") casa.cuartos[op.k] = { ...(casa.cuartos[op.k] || {}), ...op.v };
  }
  casa.v = 2;
  return casa;
}

export class Sincro {
  constructor({ alRecibir, alEstado }) {
    this.alRecibir = alRecibir; this.alEstado = alEstado;
    this.vivo = false; this.v = -1;
    this.base = null;          // la casa como la tiene el servidor
    this.pend = [];            // cambios por mandar
    this.enviando = [];        // cambios en camino
    this.hechos = [];          // ya aplicados por el servidor, hasta que su versión nos llegue
    this.yoPend = null;
  }
  /** La casa como se ve aquí: la del servidor más lo tuyo que va en camino. */
  casa() { return aplicarOps(clonar(this.base || {}), [...this.hechos.map((h) => h.op), ...this.enviando, ...this.pend]); }

  iniciar() { this.vivo = true; this._escuchar(); }
  parar() { this.vivo = false; clearTimeout(this._t); if (this.pend.length) this._mandar(); }   // (lo pendiente sale aunque ya te vayas)

  op(o) { this.pend.push(o); this._estado(); clearTimeout(this._t); this._t = setTimeout(() => this._mandar(), 220); }
  ops(lista) { for (const o of lista) this.pend.push(o); this._estado(); clearTimeout(this._t); this._t = setTimeout(() => this._mandar(), 220); }

  async _mandar() {
    if (this.enviando.length || !this.pend.length) return;
    this.enviando = this.pend.splice(0, 60);
    this._estado();
    try {
      const r = await SRV.casitaOps(this.enviando);
      for (const op of this.enviando) this.hechos.push({ op, v: r?.v ?? 0 });
      this.enviando = [];
      this._fallas = 0;
    } catch (e) {
      if (e.status === 413 || e.status === 400) { this.enviando = []; this.alEstado?.(e.message || "No se pudo guardar ese cambio", "error"); this.alRecibir?.(null, false); return; }
      this.pend = [...this.enviando, ...this.pend]; this.enviando = [];
      this._fallas = (this._fallas || 0) + 1;
      this.alEstado?.("Sin conexión: se guardará solito al volver", "error");
      this._t = setTimeout(() => this._mandar(), Math.min(15000, 1500 * this._fallas));
      return;
    }
    this._estado();
    if (this.pend.length) this._mandar();
  }
  _estado() { this.alEstado?.(this.pend.length || this.enviando.length ? "Guardando…" : "Guardado", this.pend.length || this.enviando.length ? "guardando" : "listo"); }

  /** Tu monito: si ya va uno en camino, el siguiente se junta y sale al terminar. */
  async yo(d) {
    this.yoPend = { ...(this.yoPend || {}), ...d };
    if (this._yoEnCamino) return;
    this._yoEnCamino = true;
    while (this.yoPend && this.vivo) {
      const x = this.yoPend; this.yoPend = null;
      try { await SRV.ponerMonito(x); }
      catch (e) { if (e.status === 409 || e.status === 400) break; this.yoPend = { ...x, ...(this.yoPend || {}) }; this.alEstado?.("Sin conexión: tu monito se moverá cuando vuelva", "error"); await dormir(2500); }
    }
    this._yoEnCamino = false;
  }

  async _escuchar() {
    let primera = true;
    while (this.vivo) {
      try {
        const r = await SRV.casita(this.v, primera ? 0 : 20);
        if (!this.vivo) return;
        this.v = r.v;
        this.base = r.casa;
        this.hechos = this.hechos.filter((h) => h.v > r.v);
        this.alRecibir?.(r, primera);
        primera = false;
      } catch (e) {
        if (!this.vivo) return;
        if (e.status === 409) { this.alEstado?.("Primero vincúlate con tu amorcito", "error"); return; }
        this.alEstado?.("Sin conexión con su servidor: reintentando…", "error");
        await dormir(4000);
      }
    }
  }
}
