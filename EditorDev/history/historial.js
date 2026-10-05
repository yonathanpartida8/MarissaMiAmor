/**
 * HISTORIAL — deshacer y rehacer sin copiar el librito entero.
 *
 * Cada paso guarda sólo lo que cambió: «la x de este elemento pasó de 40 a
 * 120», «se insertó este elemento en la posición 3». Deshacer es aplicar lo
 * mismo al revés. Arrastrar una foto son cien movimientos pero un solo paso
 * (se agrupan por gesto), y mover un deslizador seguido también (se funden
 * los cambios con la misma `clave` que llegan casi juntos).
 */

const FUSION_MS = 900;

export class Historial {
  constructor(max = 150) {
    this.max = max;
    this.pila = [];
    this.i = 0; // cuántos pasos están aplicados
  }

  get puedeDeshacer() { return this.i > 0; }
  get puedeRehacer() { return this.i < this.pila.length; }
  get siguienteNombre() { return this.pila[this.i]?.nombre; }
  get anteriorNombre() { return this.pila[this.i - 1]?.nombre; }

  registrar(paso) {
    if (!paso.ops.length) return;
    this.pila.length = this.i; // lo deshecho se pierde al hacer algo nuevo
    const ult = this.pila[this.i - 1];
    if (ult && paso.clave && ult.clave === paso.clave && paso.t - ult.t < FUSION_MS) {
      fundir(ult, paso);
      ult.t = paso.t;
      return;
    }
    this.pila.push(paso);
    if (this.pila.length > this.max) this.pila.shift();
    this.i = this.pila.length;
  }

  deshacer() { return this.puedeDeshacer ? this.pila[--this.i] : null; }
  rehacer() { return this.puedeRehacer ? this.pila[this.i++] : null; }
  vaciar() { this.pila = []; this.i = 0; }
}

const mismaRef = (a, b) => a.t === "set" && b.t === "set" && a.ruta === b.ruta && a.ref.p === b.ref.p && a.ref.e === b.ref.e;

/** Mete los cambios de `nuevo` dentro de `viejo` (conservando el «antes» más antiguo). */
export function fundir(viejo, nuevo) {
  for (const op of nuevo.ops) {
    const igual = viejo.ops.find((o) => mismaRef(o, op));
    if (igual) igual.despues = op.despues;
    else viejo.ops.push(op);
  }
}
