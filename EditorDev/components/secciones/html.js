/**
 * HTML — tu index.html entero, sin separar nada.
 *
 *   Nueva página HTML        una página EN BLANCO con un bloque que ocupa toda la
 *                            hoja: pegas tu index.html → Guardar → Probar
 *   Pegar en esta página     lo mismo, en la página en la que estás
 *   Bloque HTML              un trozo de HTML en un rectángulo de la hoja
 *   Abrir un .html           desde un archivo
 * Cada uno se vuelve a editar cuando quieras (dos toques sobre él, o «Editar»).
 */
import { el, seccion, boton } from "../ui.js";
import { ico } from "../iconos.js";
import { nuevaPagina, nuevoEl } from "../../core/modelo.js";
import { elegirArchivos } from "../../assets/biblioteca.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

export const HTML = {
  /** Una página nueva, en blanco, con su HTML a pantalla completa; abre el editor. */
  async paginaHtml(desdeArchivo) {
    const app = this.app;
    const E = this.E;
    const A = app.acciones;
    let codigo = "";
    if (desdeArchivo) {
      const [f] = await elegirArchivos({ accept: ".html,.htm,text/html", multiple: false });
      if (!f) return;
      codigo = await f.text();
    }
    const L = app.lienzo;
    const p = A.nuevaPagina(nuevaPagina(E.proyecto, { nombre: "Página HTML", fondo: { tipo: "color", color: "#ffffff" } }));
    E.irPagina(p.id);
    const e = nuevoEl("html", E.proyecto, { nombre: "Página HTML", html: { codigo, interactivo: true, completo: !!codigo } });
    Object.assign(e, L.guardarCaja(e, { x: 0, y: 0, w: L.W, h: L.H }, false), { ancla: { h: "estirar", v: "estirar" } });
    E.agregarEl(e);
    app.alAnadir?.();
    app.lateral?.cerrar();
    app.cerrarHojaSec?.();
    return app.html.abrir(E.el(e.id), { nuevo: true, pagina: true, paginaNueva: true });
  },

  _html(c) {
    const A = this.app.acciones;
    const E = this.E;
    const app = this.app;
    const bloques = E.pagina?.els.filter((e) => e.tipo === "html" || e.tipo === "pagina") || [];
    c.append(el("div.ed-html-hero", {}, [
      el("b", { html: `${ico("html")}<span>Pega tu index.html completo</span>` }),
      el("p.ed-ayuda", { text: "Con su <style>, su <script> y todo lo demás, en un solo bloque: Pegar → Guardar → Probar. Funciona como una página de verdad y va aislada (no puede romper el editor ni el librito)." }),
      boton(I("nuevo", "Nueva página HTML"), () => this.paginaHtml(), "primario ancho"),
      el("div.ed-botonera", {}, [
        boton(I("pagina", "Pegar en esta página"), () => A.htmlCompleto(), "chico"),
        boton(I("html", "Bloque HTML"), () => A.html(), "chico"),
        boton(I("carpeta", "Abrir un .html"), () => this.paginaHtml(true), "chico"),
      ]),
    ]));
    c.append(seccion("En esta página", bloques.length ? bloques.map((e) => el("div.ed-bloque", {}, [
      el("b", { html: ico(e.tipo === "html" ? "html" : "pagina") }),
      el("span", { text: e.nombre }),
      e.tipo === "html" ? boton(I("editar", "Editar"), () => { E.seleccionar([e.id]); A.editarHtml(e); }, "chico") : boton("Hacer editable", () => { E.seleccionar([e.id]); app.importar.hacerEditable(e); }, "chico"),
      boton(ico("play"), () => app.prueba.abrir(), "chico ico", "Probar la página"),
    ])) : [el("p.ed-vacio-txt", { text: "Esta página no tiene bloques HTML." })]));
    c.append(seccion("Fondo con HTML", [
      el("p.ed-ayuda", { text: "Un fondo animado (partículas, degradados, canvas…) detrás de todo, que no estorba al editar." }),
      boton(I("fondo", "Fondos de esta página"), () => app.abrirSeccion("diseno"), "chico"),
    ], { abierta: false }));
    c.append(seccion("Tus páginas HTML del librito", [
      el("p.ed-ayuda", { text: "Úsalas tal cual (funcionan con todo su JavaScript) o conviértelas en plantilla editable." }),
      boton(I("biblioteca", "Elegir una de mis páginas"), () => app.importar.misPaginas(), "chico"),
    ], { abierta: false }));
  },
};
