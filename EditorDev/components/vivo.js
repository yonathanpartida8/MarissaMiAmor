/**
 * MUESTRAS VIVAS SÓLO A LA VISTA — las miniaturas animadas (efectos al tocar,
 * movimientos…) se mueven mientras se ven; fuera de la pantalla, dentro de un
 * panel cerrado o con la hoja abajo, se quedan quietas. Se ven igual, pero el
 * teléfono deja de repintar decenas de animaciones que nadie está mirando.
 */
let io = null;
export function vivo(n) {
  if (typeof IntersectionObserver === "undefined") { n.classList.add("ve"); return n; }
  io ||= new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle("ve", e.isIntersecting); });
  io.observe(n);
  return n;
}
