/**
 * ESTADO — el librito abierto y la ÚNICA puerta para cambiarlo.
 *
 * Nadie toca el proyecto directamente: todo pasa por aquí. Así cada cambio
 *   1. queda en el historial (deshacer/rehacer),
 *   2. marca como «sucia» sólo la página que tocó (el autoguardado escribe
 *      esa página y nada más),
 *   3. avisa con un evento concreto («cambió este elemento») para que el
 *      lienzo repinte ese elemento y no la hoja entera.
 *
 * Eventos: el {p,e} · els {p} · pagina {p} · paginas · proyecto · assets ·
 *          sel · actual · historial · sucio
 */
import { Emitter } from "../../src/core/Emitter.js";
import { Historial } from "../history/historial.js";
import { clonar, uid } from "./modelo.js";

export function leerRuta(obj, ruta) {
  let o = obj;
  for (const k of ruta.split(".")) { if (o == null) return undefined; o = o[k]; }
  return o;
}

export function escribirRuta(obj, ruta, valor) {
  const ks = ruta.split(".");
  let o = obj;
  for (let i = 0; i < ks.length - 1; i++) {
    if (o[ks[i]] == null || typeof o[ks[i]] !== "object") o[ks[i]] = {};
    o = o[ks[i]];
  }
  if (valor === undefined) delete o[ks[ks.length - 1]];
  else o[ks[ks.length - 1]] = valor;
}

const igual = (a, b) => a === b || (typeof a === "object" && typeof b === "object" && JSON.stringify(a) === JSON.stringify(b));

export class Estado extends Emitter {
  constructor() {
    super();
    this.proyecto = null;
    this.paginaId = null;
    this.sel = [];
    this.historial = new Historial();
    this._tx = null;
    this.sucio = { meta: false, paginas: new Set(), borradas: new Set() };
  }

  /* ── Abrir ──────────────────────────────────────────────────────── */
  cargar(proyecto) {
    this.proyecto = proyecto;
    this.historial.vaciar();
    this.sel = [];
    this.paginaId = proyecto.orden[0] || null;
    this.sucio = { meta: false, paginas: new Set(), borradas: new Set() };
    this.emit("cargado");
    this.emit("historial");
  }

  get pagina() { return this.proyecto?.paginas[this.paginaId] || null; }
  get ajustes() { return this.proyecto.ajustes; }
  pag(pid) { return this.proyecto.paginas[pid]; }

  el(eid, pid = this.paginaId) {
    const p = this.pag(pid);
    return p ? p.els.find((e) => e.id === eid) || null : null;
  }

  get seleccionados() {
    const p = this.pagina;
    return p ? this.sel.map((id) => p.els.find((e) => e.id === id)).filter(Boolean) : [];
  }
  get unico() { return this.sel.length === 1 ? this.el(this.sel[0]) : null; }

  /* ── Selección y página actual (no van al historial) ────────────── */
  seleccionar(ids, agregar = false) {
    ids = [].concat(ids || []).filter(Boolean);
    let nuevo = ids;
    if (agregar) {
      nuevo = [...this.sel];
      for (const id of ids) { const j = nuevo.indexOf(id); if (j >= 0) nuevo.splice(j, 1); else nuevo.push(id); }
    }
    if (igual(nuevo, this.sel)) return;
    this.sel = nuevo;
    this.emit("sel");
  }

  irPagina(pid) {
    if (!this.proyecto.paginas[pid] || pid === this.paginaId) return;
    this.paginaId = pid;
    this.sel = [];
    this.emit("actual");
    this.emit("sel");
  }

  /* ── Transacciones: varios cambios = un solo paso ──────────────── */
  transaccion(nombre, fn, clave) {
    if (this._tx) { fn(); return; }
    this._tx = { nombre, clave, ops: [], t: performance.now() };
    try { fn(); } finally {
      const tx = this._tx;
      this._tx = null;
      this.historial.registrar(tx);
      this.emit("historial");
    }
  }

  /** Para arrastres: se abre al poner el dedo y se cierra al soltarlo. */
  gesto(nombre) {
    if (this._tx) return () => {};
    this._tx = { nombre, ops: [], t: performance.now() };
    return () => {
      const tx = this._tx;
      this._tx = null;
      if (tx) { this.historial.registrar(tx); this.emit("historial"); }
    };
  }

  _registrar(op, nombre, clave) {
    if (this._deshaciendo) return;
    if (this._tx) { this._tx.ops.push(op); return; }
    this.historial.registrar({ nombre, clave, ops: [op], t: performance.now() });
    this.emit("historial");
  }

  /* ── Cambios ───────────────────────────────────────────────────── */
  _objeto(ref) {
    if (ref.e) return this.el(ref.e, ref.p);
    if (ref.p) return this.pag(ref.p);
    return this.proyecto;
  }

  _marcar(ref) {
    if (ref.p) this.sucio.paginas.add(ref.p);
    else this.sucio.meta = true;
    this.proyecto.editado = Date.now();
    this.sucio.meta = true;
    this.emit("sucio");
  }

  /** Cambia un valor (por ruta con puntos: "anim.entrada.dur"). */
  set(ref, ruta, valor, nombre = "Cambio", clave) {
    const obj = this._objeto(ref);
    if (!obj) return;
    const antes = clonar(leerRuta(obj, ruta));
    if (igual(antes, valor)) return;
    const op = { t: "set", ref: { ...ref }, ruta, antes, despues: clonar(valor) };
    this._aplicar(op, false);
    this._registrar(op, nombre, clave);
  }

  setEl(eid, cambios, nombre = "Editar", clave, pid = this.paginaId) {
    this.transaccion(nombre, () => {
      for (const [ruta, v] of Object.entries(cambios)) this.set({ p: pid, e: eid }, ruta, v, nombre, clave);
    }, clave);
  }

  setPag(cambios, nombre = "Página", clave, pid = this.paginaId) {
    this.transaccion(nombre, () => {
      for (const [ruta, v] of Object.entries(cambios)) this.set({ p: pid }, ruta, v, nombre, clave);
    }, clave);
  }

  setProy(cambios, nombre = "Ajustes", clave) {
    this.transaccion(nombre, () => {
      for (const [ruta, v] of Object.entries(cambios)) this.set({}, ruta, v, nombre, clave);
    }, clave);
  }

  agregarEl(el, i, pid = this.paginaId, seleccionar = true) {
    const p = this.pag(pid);
    const pos = i == null ? p.els.length : i;
    const op = { t: "insEl", p: pid, el: clonar(el), i: pos };
    this._aplicar(op, false);
    this._registrar(op, "Añadir " + (el.nombre || el.tipo).toLowerCase());
    if (seleccionar && pid === this.paginaId) this.seleccionar([el.id]);
    return el;
  }

  quitarEls(ids, pid = this.paginaId) {
    const p = this.pag(pid);
    const quitar = p.els.map((e, i) => [e, i]).filter(([e]) => ids.includes(e.id)).reverse();
    if (!quitar.length) return;
    this.transaccion(quitar.length > 1 ? "Borrar elementos" : "Borrar " + quitar[0][0].nombre.toLowerCase(), () => {
      for (const [e, i] of quitar) {
        const op = { t: "delEl", p: pid, el: clonar(e), i };
        this._aplicar(op, false);
        this._registrar(op);
      }
    });
    this.seleccionar(this.sel.filter((id) => !ids.includes(id)));
  }

  /** Cambia la capa (0 = la de más atrás). */
  moverCapa(eid, a, pid = this.paginaId) {
    const p = this.pag(pid);
    const de = p.els.findIndex((e) => e.id === eid);
    a = Math.max(0, Math.min(p.els.length - 1, a));
    if (de < 0 || de === a) return;
    const op = { t: "movEl", p: pid, de, a };
    this._aplicar(op, false);
    this._registrar(op, "Cambiar capa");
  }

  duplicarEls(ids, desplazar = 16) {
    const p = this.pagina;
    const nuevos = [];
    this.transaccion("Duplicar", () => {
      for (const e of p.els.filter((x) => ids.includes(x.id))) {
        const c = clonar(e);
        c.id = uid("e");
        c.x += desplazar; c.y += desplazar;
        c.nombre = e.nombre.replace(/( \(copia\))*$/, "") + " (copia)";
        c.origen = null;
        this.agregarEl(c, p.els.indexOf(e) + 1 + nuevos.length, this.paginaId, false);
        nuevos.push(c.id);
      }
    });
    this.seleccionar(nuevos);
    return nuevos;
  }

  agregarPagina(pag, i) {
    const pos = i == null ? this.proyecto.orden.length : i;
    const op = { t: "insPag", pag: clonar(pag), i: pos };
    this._aplicar(op, false);
    this._registrar(op, "Añadir página");
    this.irPagina(pag.id);
    return pag;
  }

  quitarPagina(pid) {
    const i = this.proyecto.orden.indexOf(pid);
    if (i < 0) return;
    const op = { t: "delPag", pag: clonar(this.pag(pid)), i };
    this.transaccion("Borrar página", () => {
      if (this.proyecto.ajustes.portada === pid) this.set({}, "ajustes.portada", null);
      this._aplicar(op, false);
      this._registrar(op);
    });
  }

  moverPagina(de, a) {
    const o = this.proyecto.orden;
    a = Math.max(0, Math.min(o.length - 1, a));
    if (de === a) return;
    const op = { t: "movPag", de, a };
    this._aplicar(op, false);
    this._registrar(op, "Reordenar páginas");
  }

  duplicarPagina(pid) {
    const p = clonar(this.pag(pid));
    p.id = uid("p");
    p.nombre = p.nombre.replace(/( \(copia\))*$/, "") + " (copia)";
    const mapa = {};
    for (const e of p.els) { const n = uid("e"); mapa[e.id] = n; e.id = n; }
    for (const e of p.els) if (e.origen?.de) e.origen.de = mapa[e.origen.de] || e.origen.de;
    return this.agregarPagina(p, this.proyecto.orden.indexOf(pid) + 1);
  }

  /* ── Aplicar (y deshacer) una operación ─────────────────────────── */
  _aplicar(op, inverso) {
    const P = this.proyecto;
    switch (op.t) {
      case "set": {
        const obj = this._objeto(op.ref);
        if (!obj) return;
        escribirRuta(obj, op.ruta, clonar(inverso ? op.antes : op.despues));
        this._marcar(op.ref);
        if (op.ref.e) this.emit("el", { p: op.ref.p, e: op.ref.e, ruta: op.ruta });
        else if (op.ref.p) this.emit("pagina", { p: op.ref.p, ruta: op.ruta });
        else this.emit("proyecto", { ruta: op.ruta });
        break;
      }
      case "insEl": case "delEl": {
        const p = this.pag(op.p);
        const insertar = (op.t === "insEl") !== inverso;
        if (insertar) p.els.splice(op.i, 0, clonar(op.el));
        else { const j = p.els.findIndex((e) => e.id === op.el.id); if (j >= 0) p.els.splice(j, 1); }
        this._marcar({ p: op.p });
        this.emit("els", { p: op.p });
        break;
      }
      case "movEl": {
        const p = this.pag(op.p);
        const [de, a] = inverso ? [op.a, op.de] : [op.de, op.a];
        const [e] = p.els.splice(de, 1);
        p.els.splice(a, 0, e);
        this._marcar({ p: op.p });
        this.emit("els", { p: op.p });
        break;
      }
      case "insPag": case "delPag": {
        const insertar = (op.t === "insPag") !== inverso;
        if (insertar) {
          P.paginas[op.pag.id] = clonar(op.pag);
          P.orden.splice(op.i, 0, op.pag.id);
          this.sucio.paginas.add(op.pag.id);
          this.sucio.borradas.delete(op.pag.id);
        } else {
          delete P.paginas[op.pag.id];
          P.orden = P.orden.filter((id) => id !== op.pag.id);
          this.sucio.paginas.delete(op.pag.id);
          this.sucio.borradas.add(op.pag.id);
          if (this.paginaId === op.pag.id) {
            this.paginaId = P.orden[Math.min(op.i, P.orden.length - 1)] || null;
            this.sel = [];
            this.emit("actual");
          }
        }
        this._marcar({});
        this.emit("paginas");
        break;
      }
      case "movPag": {
        const [de, a] = inverso ? [op.a, op.de] : [op.de, op.a];
        const [id] = P.orden.splice(de, 1);
        P.orden.splice(a, 0, id);
        this._marcar({});
        this.emit("paginas");
        break;
      }
    }
  }

  deshacer() { this._paso(this.historial.deshacer(), true); }
  rehacer() { this._paso(this.historial.rehacer(), false); }

  _paso(paso, inverso) {
    if (!paso) return;
    this._deshaciendo = true;
    try {
      const ops = inverso ? [...paso.ops].reverse() : paso.ops;
      for (const op of ops) this._aplicar(op, inverso);
    } finally { this._deshaciendo = false; }
    // Volver a donde ocurrió, para que se vea qué se deshizo.
    const conPag = paso.ops.find((o) => o.p || o.ref?.p);
    const pid = conPag ? conPag.p || conPag.ref.p : null;
    if (pid && pid !== this.paginaId && this.proyecto.paginas[pid]) this.irPagina(pid);
    const ids = paso.ops.map((o) => o.ref?.e || o.el?.id).filter((id) => id && this.el(id));
    this.seleccionar([...new Set(ids)]);
    this.emit("historial");
  }

  /* ── Archivos (fotos, canciones…): no se deshacen, son la biblioteca ── */
  agregarAsset(a) {
    this.proyecto.assets[a.id] = a;
    this.sucio.meta = true;
    this.emit("sucio");
    this.emit("assets");
    return a;
  }

  quitarAsset(id) {
    delete this.proyecto.assets[id];
    this.sucio.meta = true;
    this.emit("sucio");
    this.emit("assets", { quitado: id });
  }

  /** Dónde se usa un archivo (para avisar antes de borrarlo). */
  usosDe(id) {
    const usos = [];
    const P = this.proyecto;
    if (P.ajustes.musica?.asset === id) usos.push("música del librito");
    for (const pid of P.orden) {
      const p = P.paginas[pid];
      if (p.fondo?.imagen?.asset === id || p.musica?.asset === id) usos.push(p.nombre);
      for (const e of p.els) {
        if (e.imagen?.asset === id || e.video?.asset === id || e.album?.fotos?.includes(id) || e.carrusel?.fotos?.includes(id)) usos.push(p.nombre);
      }
    }
    return [...new Set(usos)];
  }
}
