/**
 * QUE SE SIENTA COMO UNA APP — lo que el navegador hace solo y estorba.
 *
 * Sin bloquear el navegador a lo bruto: sólo se evita lo que interrumpe
 * al editar, y nunca dentro de un campo de texto (ahí sí se selecciona,
 * se copia y se pega como siempre).
 *
 *   · mantener presionado: ni lupa, ni «copiar/pegar», ni menú del sistema
 *     (el editor tiene su propio menú al mantener presionado sobre la hoja)
 *   · arrastrar fotos o enlaces fuera de la página
 *   · el zoom de toda la página con dos dedos (iPhone): el lienzo ya tiene
 *     su propio zoom, el resto de la interfaz no se agranda (el doble toque
 *     lo quita `touch-action: manipulation`, en el CSS)
 *   · tirar hacia abajo para recargar y el rebote de la página
 *   · la selección azul al tocar rápido varias veces
 */
const ESCRIBIR = "input, textarea, select, [contenteditable=''], [contenteditable='true'], .ed-escribible";
const escribe = (t) => !!(t && t.closest && t.closest(ESCRIBIR));

export function guardasDeApp() {
  // Menú del navegador al mantener presionado (o botón derecho): sólo en los campos.
  addEventListener("contextmenu", (ev) => { if (!escribe(ev.target)) ev.preventDefault(); }, { capture: true });
  // Arrastrar imágenes, enlaces o texto de la interfaz.
  addEventListener("dragstart", (ev) => { if (!escribe(ev.target)) ev.preventDefault(); }, { capture: true });
  // La selección que se queda pintada al tocar fuera de un campo.
  document.addEventListener("selectstart", (ev) => { if (!escribe(ev.target)) ev.preventDefault(); });
  // iPhone: pellizcar la página entera (el lienzo maneja sus dos dedos aparte).
  for (const t of ["gesturestart", "gesturechange"]) document.addEventListener(t, (ev) => ev.preventDefault(), { passive: false });
  // Ctrl+rueda sobre la interfaz (no sobre el lienzo): sin zoom del navegador.
  addEventListener("wheel", (ev) => { if ((ev.ctrlKey || ev.metaKey) && !ev.target.closest?.(".ed-vista")) ev.preventDefault(); }, { passive: false });
}
