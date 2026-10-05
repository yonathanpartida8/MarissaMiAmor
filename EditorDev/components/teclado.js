/**
 * ATAJOS DE TECLADO (en la computadora).
 *
 *   Ctrl+Z / Ctrl+Mayús+Z   deshacer / rehacer      Supr        borrar
 *   Ctrl+D                  duplicar                Flechas     mover 1 px (Mayús: 10)
 *   Ctrl+C / X / V          copiar / cortar / pegar Esc         soltar la selección
 *   Ctrl+A                  elegir todo             Enter       escribir en el texto
 *   Ctrl+S                  guardar ya              G           cuadrícula
 *   Ctrl + / − / 0          zoom / ajustar          RePág/AvPág página anterior/siguiente
 */
export function atajos(app) {
  const E = app.estado;
  const A = app.acciones;
  addEventListener("keydown", (e) => {
    if (!E.proyecto || document.querySelector(".ed-modal-fondo, .ed-inicio, .ed-previsual")) return;
    const t = e.target;
    const escribiendo = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && k === "s") { e.preventDefault(); app.guardarYa(); return; }
    if (mod && (k === "+" || k === "=")) { e.preventDefault(); app.lienzo.zoom(app.lienzo.v.z * 1.25); return; }
    if (mod && k === "-") { e.preventDefault(); app.lienzo.zoom(app.lienzo.v.z / 1.25); return; }
    if (mod && k === "0") { e.preventDefault(); app.lienzo.ajustar(); return; }
    if (escribiendo) return;
    if (mod && k === "z") { e.preventDefault(); e.shiftKey ? E.rehacer() : E.deshacer(); return; }
    if (mod && k === "y") { e.preventDefault(); E.rehacer(); return; }
    if (mod && k === "d") { e.preventDefault(); A.duplicar(); return; }
    if (mod && k === "c") { A.copiar(); return; }
    if (mod && k === "x") { A.cortar(); return; }
    if (mod && k === "v") { A.pegar(); return; }
    if (mod && k === "a") { e.preventDefault(); E.seleccionar(E.pagina.els.filter((x) => !x.bloqueado && !x.oculto).map((x) => x.id)); return; }
    if (mod) return;
    if (k === "delete" || k === "backspace") { e.preventDefault(); A.borrar(); return; }
    if (k === "escape") {
      if (app.lienzo.herramienta) app.dejarDeDibujar();
      else if (app.lienzo.recortando) app.lienzo.salirRecorte();
      else E.seleccionar([]);
      return;
    }
    if (k === "enter" && E.unico?.tipo === "texto") { e.preventDefault(); app.lienzo.editarTexto(E.unico); return; }
    if (k === "g") { E.setProy({ "editor.cuadricula": !E.proyecto.editor.cuadricula }, "Cuadrícula"); return; }
    if (k === "pageup" || k === "pagedown") {
      e.preventDefault();
      const o = E.proyecto.orden;
      const i = o.indexOf(E.paginaId) + (k === "pagedown" ? 1 : -1);
      if (o[i]) E.irPagina(o[i]);
      return;
    }
    const flecha = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k];
    if (flecha && E.sel.length) {
      e.preventDefault();
      const p = e.shiftKey ? 10 : 1;
      E.transaccion("Mover", () => {
        for (const x of E.seleccionados) if (!x.bloqueado) E.setEl(x.id, { x: x.x + flecha[0] * p, y: x.y + flecha[1] * p }, "Mover", "flechas");
      }, "flechas");
    }
  });
}
