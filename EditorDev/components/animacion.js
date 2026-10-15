/**
 * ANIMACIONES QUE SE REUTILIZAN — copiar, pegar y encadenar.
 *
 *   Copiar animación   guarda TODA la animación de un elemento (entrada,
 *                      bucle, salida, propia con sus fotogramas, magia y
 *                      reacción). Queda en este aparato: se puede pegar en
 *                      otro elemento, en varios a la vez o en otro librito.
 *   Secuencia          ordena la entrada de varios (de arriba abajo, de
 *                      izquierda a derecha, del centro, por capas o al azar)
 *                      cada tanto o encadenados con solape.
 */
import { aviso } from "./ui.js";

const RT = window.LibritoRT;
const CLAVE = "editordev:anim-copiada";
let memoria = null;

const limpia = (a) => JSON.parse(JSON.stringify(a || {}));

export function copiarAnim(e) {
  if (!e) return;
  memoria = { anim: limpia(e.anim), de: e.nombre || "" };
  try { localStorage.setItem(CLAVE, JSON.stringify(memoria)); } catch (x) { /* sólo en memoria */ }
  aviso(`Animación de «${memoria.de}» copiada: pégala en otro elemento`, 2600);
}

function leer() {
  if (memoria) return memoria;
  try { memoria = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (x) { memoria = null; }
  return memoria;
}

export const hayAnimCopiada = () => !!leer();

/** Pega en uno o varios (cada uno conserva cuándo aparece y se va). */
export function pegarAnim(E, ids) {
  const m = leer();
  if (!m || !ids.length) return;
  E.transaccion("Pegar animación", () => { for (const id of ids) if (E.el(id)) E.setEl(id, { anim: limpia(m.anim) }, "Pegar animación"); });
  aviso(ids.length > 1 ? `Animación pegada en ${ids.length} elementos` : "Animación pegada", 2200);
}

/** Pone en secuencia la entrada de `els` según `op` ({ orden, modo, paso, solape }). */
export function secuencia(E, els, op) {
  const lista = [...els];
  const cx = (e) => e.x + (e.w || 0) / 2, cy = (e) => e.y + (e.h || 0) / 2;
  const W = E.proyecto?.ajustes?.ancho || 400, H = E.proyecto?.ajustes?.alto || 700;
  const orden = {
    arriba: (a, b) => a.y - b.y || a.x - b.x,
    izquierda: (a, b) => a.x - b.x || a.y - b.y,
    centro: (a, b) => Math.hypot(cx(a) - W / 2, cy(a) - H / 2) - Math.hypot(cx(b) - W / 2, cy(b) - H / 2),
    capas: (a, b) => E.pagina.els.indexOf(a) - E.pagina.els.indexOf(b),
  }[op.orden];
  if (orden) lista.sort(orden);
  else {
    // Al azar, pero el mismo azar para la misma página (no cambia cada vez que se toca).
    let h = 7;
    const az = () => { h = (h * 9301 + 49297) % 233280; return h / 233280; };
    for (let i = lista.length - 1; i > 0; i--) { const j = Math.floor(az() * (i + 1)); [lista[i], lista[j]] = [lista[j], lista[i]]; }
  }
  E.transaccion("Secuencia", () => {
    let t = 0;
    lista.forEach((e, i) => {
      const en = e.anim?.entrada && e.anim.entrada.tipo !== "ninguna" ? e.anim.entrada : { ...RT.ANIM_DEF.entrada, tipo: "aparecer" };
      const dur = RT.num(+en.dur, 800);
      const ret = op.modo === "cadena" ? Math.max(0, Math.round(t)) : i * (+op.paso || 0);
      E.setEl(e.id, { "anim.entrada": { ...en, retraso: ret } }, "Secuencia");
      t = ret + dur - (+op.solape || 0);
    });
  });
}
