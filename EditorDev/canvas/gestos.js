/**
 * GESTOS — piezas pequeñas que comparten el lienzo, la línea de tiempo y la
 * barra lateral para que los dedos se sientan igual en todos lados.
 *
 *   enCuadro(fn)        junta los movimientos de un cuadro de pantalla en uno
 *                       (un teléfono a 120 Hz manda 2-4 por cuadro: se pinta
 *                       una sola vez, con el último)
 *   Reserva             nodos que se reciclan en la capa del editor: se mueven
 *                       en vez de borrarse y crearse a cada cuadro (nada de
 *                       parpadeos ni de basura para el recolector)
 *   HOLGURA             cuánto hay que mover el dedo para que cuente como
 *                       arrastre (y no como toque)
 *   vibrar(ms)          un toquecito háptico, si el teléfono sabe
 */

export const HOLGURA = { touch: 9, pen: 6, mouse: 3 };
export const holgura = (ev) => HOLGURA[ev.pointerType] ?? 6;
export const TOQUE_LARGO = 480;

export function enCuadro(fn) {
  let ultimo = null, id = 0;
  const f = (ev) => {
    ultimo = ev;
    if (!id) id = requestAnimationFrame(() => { id = 0; const x = ultimo; ultimo = null; if (x) fn(x); });
  };
  /** Aplica ya lo que quedara pendiente (al soltar). */
  f.ya = () => { if (id) { cancelAnimationFrame(id); id = 0; } if (ultimo) { const x = ultimo; ultimo = null; fn(x); } };
  f.cancelar = () => { cancelAnimationFrame(id); id = 0; ultimo = null; };
  return f;
}

export function vibrar(ms = 8) {
  try { navigator.vibrate?.(ms); } catch (e) { /* nada */ }
}

/** Nodos reciclables, por clase. `inicio()` → `nodo("ed-caja")`… → `fin()`. */
export class Reserva {
  constructor(padre) {
    this.padre = padre;
    this.nodos = new Map();
    this.cuenta = new Map();
  }

  inicio() { this.cuenta.clear(); }

  nodo(tipo, tag = "div") {
    const i = (this.cuenta.get(tipo) || 0) + 1;
    this.cuenta.set(tipo, i);
    const k = tipo + "#" + i;
    let n = this.nodos.get(k);
    if (!n) {
      n = document.createElement(tag);
      n._k = k;
      this.nodos.set(k, n);
      this.padre.append(n);
    }
    n._usado = true;
    if (n.hidden) n.hidden = false;
    return n;
  }

  fin() {
    for (const n of this.nodos.values()) {
      if (!n._usado) { if (!n.hidden) n.hidden = true; }
      n._usado = false;
    }
  }
}

/** Pone estilos sólo si cambiaron (escribir el mismo valor también cuesta). */
export function estilo(n, props) {
  const c = n._css || (n._css = {});
  for (const k in props) {
    const v = props[k];
    if (c[k] !== v) { c[k] = v; n.style[k] = v; }
  }
}

export function clase(n, nombre) { if (n.className !== nombre) n.className = nombre; }
