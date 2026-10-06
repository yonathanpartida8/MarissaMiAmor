/**
 * PÁGINAS — la lista de hojas del librito.
 *
 * Cada una con su miniatura, que es la página de verdad pintada en chiquito
 * (sin animaciones, sin marcos ni vídeos: sólo lo que se ve). Se pinta
 * cuando aparece en pantalla y se repinta un rato después de que la tocas,
 * nunca a cada tecla.
 */
import { el, boton, menu, pedirTexto, modal, ordenable } from "../components/ui.js";
import { PLANTILLAS } from "../templates/plantillas.js";
import { rutaAUrl } from "../assets/biblioteca.js";
import { ico } from "../components/iconos.js";
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

const RT = window.LibritoRT;
const MINI = 64;

export class PanelPaginas {
  constructor(app) {
    this.app = app;
    this.E = app.estado;
    this.minis = new Map();
    this.pendientes = new Set();
    this.obs = new IntersectionObserver((es) => {
      for (const x of es) if (x.isIntersecting) { this.obs.unobserve(x.target); this._mini(x.target.dataset.id); }
    }, { rootMargin: "120px" });
    const E = this.E;
    E.on("paginas", () => this.pintar());
    E.on("actual", () => this._marcar());
    E.on("pagina", ({ p, ruta }) => { if (ruta === "nombre") this.pintar(); else this._sucia(p); });
    E.on("el", ({ p }) => this._sucia(p));
    E.on("els", ({ p }) => this._sucia(p));
    E.on("proyecto", ({ ruta }) => { if (/portada|ancho|alto/.test(ruta)) this.pintar(); });
    this._repintar = () => { for (const p of this.pendientes) this._mini(p); this.pendientes.clear(); };
  }

  get P() { return this.E.proyecto; }

  construir(cont) {
    this.cont = cont;
    const A = this.app.acciones;
    this.lista = el("ol.ed-paginas");
    ordenable(this.lista, { item: "li", asa: ".ed-asa", alSoltar: (de, a) => this.E.moverPagina(de, a) });
    this.lista.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li || e.target.closest("button")) return;
      this.E.irPagina(li.dataset.id);
      this.app.alElegirPagina?.();
    });
    cont.append(
      el("div.ed-botonera", {}, [
        boton(I("mas", "Página en blanco"), () => A.nuevaPagina(), "primario"),
        boton(I("paginas", "Plantillas"), () => this.plantillas()),
        boton(I("biblioteca", "Mis páginas"), () => this.app.importar.misPaginas()),
      ]),
      this.lista,
      el("div.ed-botonera.ed-pie-panel", {}, [
        boton(I("limpiar", "Vaciar todas"), () => A.limpiarTodo(false), "chico"),
        boton("Dejar sólo una en blanco", () => A.limpiarTodo(true), "chico"),
      ]),
    );
    this.pintar();
  }

  pintar() {
    if (!this.lista || !this.P) return;
    this.lista.textContent = "";
    const port = this.P.ajustes.portada;
    this.P.orden.forEach((pid, i) => {
      const p = this.P.paginas[pid];
      const caja = el("div.ed-mini", { style: { aspectRatio: `${this.P.ajustes.ancho} / ${this.P.ajustes.alto}` } });
      const li = el("li" + (pid === this.E.paginaId ? ".on" : ""), { dataset: { id: pid } }, [
        el("button.ed-asa", { type: "button", html: ico("agarre"), title: "Arrastra para ordenar", "aria-label": "Ordenar" }),
        el("b.ed-pnum", { text: String(i + 1) }),
        caja,
        el("div.ed-pag-info", {}, [el("span", { text: p.nombre }), pid === port ? el("small.ed-chip", { text: "portada" }) : null, p.els.some((e) => e.tipo === "pagina") ? el("small.ed-chip", { text: "original" }) : null].filter(Boolean)),
        el("button.ed-mas", { type: "button", html: ico("puntos"), title: "Más", "aria-label": "Opciones de la página", onClick: (ev) => this._menu(ev.currentTarget, pid) }),
      ]);
      caja.dataset.id = pid;
      this.lista.append(li);
      const ya = this.minis.get(pid);
      if (ya) caja.append(ya.cont); else this.obs.observe(caja);
    });
  }

  _marcar() {
    if (!this.lista) return;
    for (const li of this.lista.children) li.classList.toggle("on", li.dataset.id === this.E.paginaId);
    this.lista.querySelector("li.on")?.scrollIntoView({ block: "nearest" });
  }

  _sucia(pid) {
    if (!this.minis.has(pid)) return;
    this.pendientes.add(pid);
    clearTimeout(this._t);
    this._t = setTimeout(this._repintar, 700);
  }

  _mini(pid) {
    const p = this.P.paginas[pid];
    if (!p) return;
    const viejo = this.minis.get(pid);
    if (viejo) viejo.pag.destruir();
    const { ancho: W, alto: H } = this.P.ajustes;
    const ctx = { modo: "mini", url: (id) => this.app.bib.url(id), ruta: (r) => rutaAUrl(r) };
    const pag = new RT.Pagina(p, ctx, W, H);
    const cont = viejo?.cont || el("div.ed-mini-escala");
    cont.textContent = "";
    pag.nodo.style.transform = `scale(${MINI / W})`;
    pag.nodo.style.transformOrigin = "0 0";
    cont.append(pag.nodo);
    this.minis.set(pid, { pag, cont });
    const caja = this.lista?.querySelector(`.ed-mini[data-id="${pid}"]`);
    if (caja && !caja.contains(cont)) caja.append(cont);
  }

  _menu(ancla, pid) {
    const A = this.app.acciones;
    const E = this.E;
    const i = this.P.orden.indexOf(pid);
    menu(ancla, [
      { t: I("editar", "Renombrar"), al: async () => { const n = await pedirTexto("Nombre de la página", this.P.paginas[pid].nombre); if (n) E.setPag({ nombre: n.trim() }, "Renombrar página", null, pid); } },
      { t: I("duplicar", "Duplicar"), al: () => E.duplicarPagina(pid) },
      { t: I("estrella", "Poner de portada"), al: () => A.ponerPortada(pid), off: this.P.ajustes.portada === pid },
      { t: I("arriba", "Subir"), al: () => E.moverPagina(i, i - 1), off: i === 0 },
      { t: I("abajo", "Bajar"), al: () => E.moverPagina(i, i + 1), off: i === this.P.orden.length - 1 },
      "-",
      { t: I("limpiar", "Dejar en blanco"), al: () => A.limpiarPagina(pid) },
      { t: I("borrar", "Borrar página"), al: () => A.borrarPagina(pid), peligro: true },
    ]);
  }

  /** La galería de plantillas (cada una pintada en chiquito, de verdad). */
  async plantillas() {
    const P = this.P;
    const { ancho: W, alto: H } = P.ajustes;
    const ctx = { modo: "mini", url: () => null };
    const vivas = [];
    const rej = el("div.ed-plantillas", {}, PLANTILLAS.map((t) => {
      const pg = t.crear(P);
      const pag = new RT.Pagina(pg, { ...ctx, modo: "editor" }, W, H);
      vivas.push(pag);
      pag.nodo.style.transform = `scale(${120 / W})`;
      pag.nodo.style.transformOrigin = "0 0";
      return el("button.ed-plantilla", { type: "button", dataset: { id: t.id } }, [
        el("div.ed-mini", { style: { aspectRatio: `${W} / ${H}`, width: "120px" } }, [el("div.ed-mini-escala", {}, [pag.nodo])]),
        el("b", { text: t.n }), el("small", { text: t.d }),
      ]);
    }));
    let elegida = null;
    rej.addEventListener("click", (e) => {
      const b = e.target.closest(".ed-plantilla");
      if (!b) return;
      elegida = b.dataset.id;
      modal.ultima.cerrar(elegida);
    });
    await modal({ titulo: "Nueva página desde plantilla", contenido: [el("p.ed-ayuda", { text: "Son puntos de partida: las fotos y las canciones las pones tú." }), rej], ancho: 760 });
    for (const v of vivas) v.destruir();
    if (!elegida) return;
    const t = PLANTILLAS.find((x) => x.id === elegida);
    const pg = t.crear(P);
    this.app.acciones.nuevaPagina(pg);
    RT.cargarFuentes(pg.els.map((x) => x.texto?.fuente));
  }
}
