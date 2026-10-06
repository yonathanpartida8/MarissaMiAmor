/**
 * INICIO — tus libritos guardados y cómo empezar uno.
 */
import { el, boton, menu, confirmar } from "./ui.js";
import { listar, borrar } from "../storage/db.js";
import { FORMATOS } from "../core/modelo.js";
import { ico } from "./iconos.js";
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

const hace = (t) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.round(s / 86400)} días`;
  return new Date(t).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

export async function pantallaInicio(app, { cerrable = false } = {}) {
  document.querySelector(".ed-inicio")?.remove();
  const lista = await listar().catch(() => []);
  const formato = el("select.ed-sel", {}, Object.entries(FORMATOS).map(([k, f]) => el("option", { value: k, text: f.auto ? f.n : `${f.n} · ${f.w}×${f.h}` })));
  formato.value = "movil";
  const nombre = el("input.ed-txt", { type: "text", placeholder: "Nombre del librito", value: "Mi librito" });
  const capa = el("div.ed-inicio", { role: "dialog", "aria-label": "Crear librito" }, [
    el("div.ed-inicio-caja", {}, [
      el("header", {}, [
        el("a.ed-volver", { href: "../index.html", title: "Volver al librito", html: ico("volver") }),
        el("div", {}, [el("h1", { text: "Crear librito" }), el("p", { text: "Tu taller para armar libritos interactivos: páginas, fotos, música, animaciones y HTML propio." })]),
        cerrable ? el("button.ed-x", { type: "button", html: ico("cerrar"), "aria-label": "Cerrar", onClick: () => capa.remove() }) : null,
      ]),
      el("section.ed-inicio-nuevo", {}, [
        el("div.ed-tarjeta", {}, [
          el("b", { html: I("nuevo", "Librito nuevo") }),
          el("small", { text: "Empieza con una portada en blanco." }),
          nombre, formato,
          boton("Crear", () => { capa.remove(); app.nuevo(nombre.value.trim() || "Mi librito", formato.value); }, "primario"),
        ]),
        el("div.ed-tarjeta", {}, [
          el("b", { html: I("biblioteca", "Mi librito de siempre") }),
          el("small", { text: "Una copia editable de todo el librito, sin tocar el original." }),
          boton("Importarlo", () => { capa.remove(); app.importar.importarLibrito(); }),
        ]),
        el("div.ed-tarjeta", {}, [
          el("b", { html: I("subir", "Abrir archivo") }),
          el("small", { text: "Un .zip que exportaste antes (o su project.json)." }),
          boton("Elegir archivo", () => { capa.remove(); app.abrirArchivo(); }),
        ]),
      ]),
      el("section", {}, [
        el("h2", { text: lista.length ? "Tus borradores" : "Todavía no hay borradores" }),
        lista.length ? el("ul.ed-borradores", {}, lista.map((p) => el("li", {}, [
          el("button.ed-borrador", { type: "button", onClick: () => { capa.remove(); app.abrir(p.id); } }, [
            el("b", { text: p.nombre }),
            el("small", { text: `${p.nPaginas ?? p.orden?.length ?? 0} páginas · ${hace(p.editado)}` }),
          ]),
          el("button.ed-mas", { type: "button", html: ico("puntos"), "aria-label": "Más", onClick: (e) => menu(e.currentTarget, [
            { t: "Abrir", al: () => { capa.remove(); app.abrir(p.id); } },
            { t: I("duplicar", "Duplicar"), al: async () => { await app.duplicarProyecto(p.id); pantallaInicio(app, { cerrable }); } },
            "-",
            { t: I("borrar", "Borrar"), peligro: true, al: async () => { if (await confirmar(`Se borrará «${p.nombre}» de este navegador, con sus fotos subidas.`, "Borrar")) { await borrar(p.id); if (app.estado.proyecto?.id === p.id) app.estado.proyecto = null; pantallaInicio(app, { cerrable: cerrable && !!app.estado.proyecto }); } } },
          ]) }),
        ]))) : el("p.ed-vacio-txt", { text: "Lo que hagas se guarda solo en este navegador mientras editas. Para llevártelo a otro lado, exporta el .zip." }),
      ]),
    ]),
  ]);
  document.body.append(capa);
  return capa;
}
