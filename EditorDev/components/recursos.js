/**
 * REVISAR RECURSOS — el informe del compilador (assets/compilador.js).
 *
 * Dice cuánto pesa el librito, qué está repetido, qué no se usa, qué fotos
 * son enormes, qué falta y qué animaciones piden mucho al teléfono. Cada
 * arreglo es un botón y PREGUNTA antes: nada se borra ni se achica solo, y los
 * originales se conservan siempre.
 */
import { el, modal, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";

const mb = (b) => (b / 1048576).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " MB";
const I = (i, t) => `${ico(i)}<span>${t}</span>`;

export async function abrirRecursos(app) {
  const C = await import("../assets/compilador.js");
  const cuerpo = el("div.ed-rec", {}, [el("p.ed-ayuda", { text: "Revisando tu biblioteca…" })]);
  const btn = (t, i, fn, cl = "") => el("button.ed-btn.chico" + (cl ? "." + cl : ""), { type: "button", html: I(i, t), onClick: fn });
  const pintar = async () => {
    const r = await C.revisar(app, (i, n) => { cuerpo.firstChild.textContent = `Revisando ${i} de ${n}…`; });
    const sec = (titulo, ayuda, hijos, estado = "") => el("section.ed-rec-sec" + (estado ? "." + estado : ""), {}, [el("div.ed-sub-t", { text: titulo }), ayuda ? el("small.ed-ayuda", { text: ayuda }) : null, ...hijos].filter(Boolean));
    const nombres = (l) => el("small.ed-rec-lista", { text: l.slice(0, 8).map((a) => a.nombre).join(" · ") + (l.length > 8 ? ` y ${l.length - 8} más` : "") });
    const partes = [
      el("div.ed-rec-resumen", {}, [
        el("div", {}, [el("b", { text: String(r.total) }), el("small", { text: "archivos" })]),
        el("div", {}, [el("b", { text: mb(r.bytes) }), el("small", { text: "en total" })]),
        el("div", {}, [el("b", { text: String(r.usados) }), el("small", { text: "en uso" })]),
        el("div", {}, [el("b", { text: String(r.originales) }), el("small", { text: "originales guardados" })]),
      ]),
    ];
    const dup = r.duplicados.reduce((n, l) => n + l.length - 1, 0);
    partes.push(sec("Repetidos", dup ? `${dup} archivo${dup === 1 ? "" : "s"} igual${dup === 1 ? "" : "es"} a otro (misma huella). Unificar hace que todo use una sola copia; las otras quedan sin usar (no se borran).` : "Nada repetido: cada archivo está una sola vez.", dup ? [nombres(r.duplicados.flat()), el("div.ed-botonera", {}, [btn("Unificar repetidos", "enlazar", async () => {
      const n = C.unificar(app, r.duplicados);
      aviso(n ? "Listo: todo usa una sola copia (se puede deshacer)" : "No había nada que cambiar", 2800);
      pintar();
    }, "primario")])] : [], dup ? "aviso" : "ok"));
    partes.push(sec("Sin usar", r.sinUsar.length ? `${r.sinUsar.length} en la biblioteca y en ninguna página. No estorban (no van al exportar «para ver»), pero ocupan lugar en este aparato.` : "Todo lo de la biblioteca se usa.", r.sinUsar.length ? [nombres(r.sinUsar), el("div.ed-botonera", {}, [btn("Quitarlos de la biblioteca…", "borrar", async () => {
      if (!(await confirmar(`¿Quitar ${r.sinUsar.length} archivo${r.sinUsar.length === 1 ? "" : "s"} que no se usa${r.sinUsar.length === 1 ? "" : "n"} en ninguna página? Si quieres conservarlos, descarga antes una copia de seguridad.`, "Quitar"))) return;
      await C.quitar(app, r.sinUsar.map((a) => a.id));
      aviso("Biblioteca limpia", 2400);
      pintar();
    }, "peligro")])] : [], r.sinUsar.length ? "aviso" : "ok"));
    partes.push(sec("Fotos enormes", r.grandes.length ? `${r.grandes.length} foto${r.grandes.length === 1 ? "" : "s"} de más de 2600 px o 3 MB. Una versión ligera (2048 px) se ve igual en el librito y trabaja más fluido; el ORIGINAL se guarda aparte y va en la copia de seguridad.` : "Ninguna foto exagerada.", r.grandes.length ? [nombres(r.grandes), el("div.ed-botonera", {}, [btn("Hacer versiones ligeras…", "rayo", async (ev) => {
      if (!(await confirmar(`¿Hacer la versión ligera de ${r.grandes.length} foto${r.grandes.length === 1 ? "" : "s"}? Los originales se conservan.`, "Hacer", "primario"))) return;
      const b = ev.target.closest("button");
      let k = 0;
      for (const a of r.grandes) { b.lastChild.textContent = `Aligerando ${++k} de ${r.grandes.length}…`; await C.aligerar(app, a.id).catch(() => false); }
      aviso("Fotos aligeradas (originales a salvo)", 2600);
      pintar();
    })])] : [], r.grandes.length ? "aviso" : "ok"));
    if (r.faltan.length) partes.push(sec("Faltan", "Estos archivos no se encontraron al abrir el librito: búscalos y vuelve a ponerlos.", [nombres(r.faltan)], "error"));
    const fotos = Object.values(app.estado.proyecto.assets).filter((a) => a.tipo === "imagen" && a.fuente === "local");
    partes.push(sec("Miniaturas", `${app.bib.minis.size} de ${fotos.length} fotos con miniatura (las rejillas y listas cargan ésas: menos memoria). Se hacen solas en calma; la foto de la página siempre es la buena.`, fotos.length > app.bib.minis.size ? [el("div.ed-botonera", {}, [btn("Prepararlas ahora", "imagen", () => { C.prepararMiniaturas(app.bib, fotos.map((a) => a.id)); aviso("Preparando miniaturas en calma…", 2200); })])] : []));
    partes.push(sec("Animaciones", r.pesadas.length ? "Esto le pide mucho al teléfono (no se cambia nada: tú decides):" : "Nada que le pese al teléfono.", r.pesadas.map((x) => el("small.ed-rec-lista", { text: `«${x.e.nombre}» · ${x.motivo}` })), r.pesadas.length ? "aviso" : "ok"));
    partes.push(el("small.ed-ayuda", { text: "Además: las fotos se achican al subirlas (guardando el original), las rejillas cargan al verse y el librito deja lista la página siguiente mientras lees la actual." }));
    cuerpo.replaceChildren(...partes);
  };
  pintar().catch((e) => { cuerpo.textContent = "No se pudo revisar: " + e.message; });
  return modal({ titulo: "Revisar recursos", contenido: cuerpo, acciones: [["Cerrar", null, "primario"]], ancho: 560, clase: "ed-modal-rec" });
}
