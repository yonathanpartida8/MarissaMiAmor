/**
 * HERRAMIENTAS DEL LIENZO — siempre a la vista, junto a la hoja.
 *
 *   Seleccionar · Dibujar · Borrador │ Pegar · Deshacer · Rehacer
 *
 * La activa se ve marcada (y la hoja cambia de cursor). Con Dibujar o
 * Borrador sale una tirita de opciones: colores y grosor del lápiz, tamaño
 * de la goma, «Elegir el dibujo» (para moverlo o cambiarle el color) y
 * «Borrar todo el dibujo». Esc o «Seleccionar» vuelven a elegir objetos.
 */
import { el } from "../../src/utils/dom.js";
import { ico } from "../components/iconos.js";
import { confirmar, aviso } from "../components/ui.js";
import { PREF, poner, alCambiar } from "../config/preferencias.js";

const COLORES = ["#3b2a3f", "#e0457f", "#ff8fb1", "#f2a03d", "#ffd23f", "#5aa86a", "#4a9ad9", "#9b6cd9", "#ffffff"];
const CLAVE_LAPIZ = "editordev:lapiz";

export class Herramientas {
  constructor(app) {
    this.app = app;
    const L = app.lienzo;
    try { this.lapiz = { color: COLORES[1], grosor: 5, ...JSON.parse(localStorage.getItem(CLAVE_LAPIZ) || "{}") }; } catch (e) { this.lapiz = { color: COLORES[1], grosor: 5 }; }
    this.goma = { tam: 26 };
    const b = (h, icono, titulo) => el("button.ed-dock-b", { type: "button", dataset: { h }, title: titulo, "aria-label": titulo, html: ico(icono) });
    this.bSel = b("sel", "cursor", "Seleccionar y mover (Esc)");
    this.bLapiz = b("lapiz", "lapiz", "Dibujar");
    this.bGoma = b("borrador", "borrador", "Borrador (sólo borra dibujo)");
    this.bPegar = b("pegar", "pegar", "Pegar (Ctrl+V)");
    this.bDes = b("des", "deshacer", "Deshacer (Ctrl+Z)");
    this.bRe = b("re", "rehacer", "Rehacer (Ctrl+Y)");
    this.opciones = el("div.ed-dock-op", { hidden: "" });
    this.dock = el("div.ed-dock", { role: "toolbar", "aria-label": "Herramientas" }, [
      el("div.ed-dock-grupo", {}, [this.bSel, this.bLapiz, this.bGoma]),
      el("div.ed-dock-grupo", {}, [this.bPegar, this.bDes, this.bRe]),
    ]);
    this.dock.addEventListener("click", (ev) => {
      const h = ev.target.closest(".ed-dock-b")?.dataset.h;
      if (!h) return;
      const E = app.estado, A = app.acciones;
      if (h === "sel") this.usar(null);
      else if (h === "lapiz") this.usar(L.herramienta === "lapiz" ? null : "lapiz");
      else if (h === "borrador") this.usar(L.herramienta === "borrador" ? null : "borrador");
      else if (h === "pegar") { if (A.portapapeles) { this.usar(null); A.pegar(); } else aviso("Primero copia algo (elígelo y toca Copiar)"); }
      else if (h === "des") E.deshacer();
      else if (h === "re") E.rehacer();
    });
    // Si los efectos están ocultos en la hoja (Configuración), se avisa aquí:
    // así nunca parece que un filtro «no funciona».
    this.chipEfectos = el("button.ed-chip-efectos", { type: "button", html: `${ico("efectos")}<span>Efectos ocultos en la hoja · mostrar</span>`, onClick: () => poner({ efectos: true }) });
    const verChip = () => { this.chipEfectos.hidden = PREF.efectos; };
    verChip();
    alCambiar(verChip);
    (document.querySelector(".ed-centro") || document.body).append(this.dock, this.opciones, this.chipEfectos);
    addEventListener("ed-herramienta", () => this.pintar());
    app.estado.on("historial", () => this.pintar());
    app.estado.on("sel", () => this.pintar());
    this.pintar();
  }

  /** null = seleccionar · "lapiz" · "borrador". */
  usar(h) {
    const L = this.app.lienzo;
    if (h === "lapiz") L.usarHerramienta("lapiz", this.lapiz);
    else if (h === "borrador") L.usarHerramienta("borrador", this.goma);
    else L.usarHerramienta(null);
    if (h) { this.app.lateral?.cerrar?.(); this.app.cerrarHojaSec?.(); }
  }

  pintar() {
    const L = this.app.lienzo, E = this.app.estado, h = L.herramienta;
    this.bSel.classList.toggle("on", !h);
    this.bLapiz.classList.toggle("on", h === "lapiz");
    this.bGoma.classList.toggle("on", h === "borrador");
    this.bPegar.disabled = !this.app.acciones?.portapapeles;
    this.bDes.disabled = !E.historial?.puedeDeshacer;
    this.bRe.disabled = !E.historial?.puedeRehacer;
    document.body.classList.toggle("ed-dibujando", !!h);
    if (this._h !== h) { this._h = h; this._opciones(h); }
  }

  /** La tirita de opciones del lápiz o de la goma. */
  _opciones(h) {
    const o = this.opciones, L = this.app.lienzo, E = this.app.estado;
    o.textContent = "";
    o.hidden = !h;
    if (!h) return;
    const dibujo = () => (E.pagina?.els || []).filter((e) => e.tipo === "trazo");
    const elegirDibujo = el("button.ed-btn.chico", { type: "button", html: `${ico("cursor")}<span>Elegir el dibujo</span>`, onClick: () => { const ids = dibujo().map((e) => e.id); if (!ids.length) return aviso("Todavía no hay dibujo en esta página"); this.usar(null); E.seleccionar(ids); } });
    if (h === "lapiz") {
      const guardar = () => { try { localStorage.setItem(CLAVE_LAPIZ, JSON.stringify(this.lapiz)); } catch (e) { /* nada */ } L.lapizOp = this.lapiz; };
      const colores = el("div.ed-dock-colores", {}, COLORES.map((c) => el("button" + (c === this.lapiz.color ? ".on" : ""), { type: "button", title: c, "aria-label": "Color " + c, style: { background: c }, onClick: (ev) => { this.lapiz.color = c; guardar(); for (const x of colores.children) x.classList.toggle("on", x === ev.currentTarget); otro.value = c; } })));
      const otro = el("input", { type: "color", value: this.lapiz.color, title: "Otro color", "aria-label": "Otro color" });
      otro.addEventListener("input", () => { this.lapiz.color = otro.value; guardar(); for (const x of colores.children) x.classList.remove("on"); });
      colores.append(otro);
      const donde = el("div.ed-seg", {}, [["encima", "Encima de todo"], ["detras", "Detrás de todo"]].map(([k, t]) => el("button" + ((k === "detras") === !!this.lapiz.detras ? ".on" : ""), { type: "button", text: t, onClick: (ev) => { this.lapiz.detras = k === "detras"; guardar(); for (const x of donde.children) x.classList.toggle("on", x === ev.currentTarget); } })));
      o.append(colores, this._rango("Grosor", 1, 40, this.lapiz.grosor, (v) => { this.lapiz.grosor = v; guardar(); }, this.lapiz.color), donde, elegirDibujo);
    } else {
      o.append(
        this._rango("Tamaño de la goma", 8, 90, this.goma.tam, (v) => { this.goma.tam = v; L.borradorOp = this.goma; }),
        elegirDibujo,
        el("button.ed-btn.chico.peligro", { type: "button", html: `${ico("borrar")}<span>Borrar todo el dibujo</span>`, onClick: async () => { const ids = dibujo().map((e) => e.id); if (!ids.length) return aviso("No hay dibujo en esta página"); if (await confirmar(`Se borran los ${ids.length} trazos de esta página (se puede deshacer).`, "Borrar el dibujo")) E.quitarEls(ids); } }),
      );
    }
    o.append(el("button.ed-btn.chico.primario", { type: "button", text: "Listo", onClick: () => this.usar(null) }));
  }

  _rango(nombre, min, max, v, alCambiar, color) {
    const muestra = el("i.ed-dock-punto", { style: { width: Math.min(28, v) + "px", height: Math.min(28, v) + "px", background: color || "transparent" } });
    const r = el("input", { type: "range", min, max, step: 1, value: v, "aria-label": nombre });
    r.addEventListener("input", () => { const x = +r.value; muestra.style.width = muestra.style.height = Math.min(28, x) + "px"; alCambiar(x); });
    return el("label.ed-dock-rango", {}, [el("span", { text: nombre }), r, muestra]);
  }
}
