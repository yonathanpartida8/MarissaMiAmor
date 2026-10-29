/**
 * HERRAMIENTAS DEL LIENZO — siempre a la vista, junto a la hoja.
 *
 *   Deshacer · Rehacer │ Pegar · Duplicar · Capas │ Imán · Ver toda la hoja
 *
 * Lo que más se usa al armar una página, a un toque. El dibujo a mano vive en
 * Elementos → «Dibujar a mano»: mientras se dibuja sale abajo una tirita delgadita
 * (nunca encima de la hoja) con lápiz o goma, colores, grosor, encima/detrás,
 * «Elegir el dibujo» y «Listo» (o Esc).
 */
import { el } from "../compartido/utils/dom.js";
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
    this.bDes = b("des", "deshacer", "Deshacer (Ctrl+Z)");
    this.bRe = b("re", "rehacer", "Rehacer (Ctrl+Y)");
    this.bPegar = b("pegar", "pegar", "Pegar (Ctrl+V)");
    this.bDup = b("dup", "duplicar", "Duplicar lo elegido (Ctrl+D)");
    this.bCapas = b("capas", "capas", "Capas: ordenar, esconder y elegir");
    this.bIman = b("iman", "iman", "Imán: se pega a bordes, centros y guías");
    this.bVer = b("ver", "ajustar", "Ver toda la hoja");
    this.opciones = el("div.ed-dock-op", { hidden: "" });
    this.dock = el("div.ed-dock", { role: "toolbar", "aria-label": "Herramientas" }, [
      el("div.ed-dock-grupo.ed-dock-hist", {}, [this.bDes, this.bRe]),
      el("div.ed-dock-grupo", {}, [this.bPegar, this.bDup, this.bCapas]),
      el("div.ed-dock-grupo", {}, [this.bIman, this.bVer]),
    ]);
    this.dock.addEventListener("click", (ev) => {
      const h = ev.target.closest(".ed-dock-b")?.dataset.h;
      if (!h) return;
      const E = app.estado, A = app.acciones;
      if (h === "des") E.deshacer();
      else if (h === "re") E.rehacer();
      else if (h === "pegar") { if (A.portapapeles) { this.usar(null); A.pegar(); } else aviso("Primero copia algo (elígelo y toca Copiar)"); }
      else if (h === "dup") { if (E.sel.length) A.duplicar(); else aviso("Elige algo para duplicarlo"); }
      else if (h === "capas") { app.insp?.abrir("capas"); }
      else if (h === "iman") { const on = this.iman; E.setProy({ "editor.iman": !on }, on ? "Apagar el imán" : "Prender el imán"); aviso(on ? "Imán apagado: se mueve libre" : "Imán prendido: se pega a bordes y centros", 1600); }
      else if (h === "ver") { L.ajustar(); }
      this.pintar();
    });
    // Si los efectos están ocultos en la hoja (Configuración), se avisa aquí:
    // así nunca parece que un filtro «no funciona».
    this.chipEfectos = el("button.ed-chip-efectos", { type: "button", html: `${ico("efectos")}<span>Efectos ocultos en la hoja · mostrar</span>`, onClick: () => poner({ efectos: true }) });
    const verChip = () => { this.chipEfectos.hidden = PREF.efectos; };
    verChip();
    alCambiar(verChip);
    (document.querySelector(".ed-centro") || document.body).append(this.dock, this.opciones, this.chipEfectos);
    addEventListener("ed-herramienta", () => this.pintar());
    for (const ev of ["historial", "sel", "proyecto", "cargado"]) app.estado.on(ev, () => this.pintar());
    this.pintar();
  }

  get iman() { return this.app.estado.proyecto?.editor?.iman !== false; }

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
    this.bPegar.disabled = !this.app.acciones?.portapapeles;
    this.bDup.disabled = !E.sel.length;
    this.bIman.classList.toggle("on", this.iman);
    this.bIman.setAttribute("aria-pressed", String(this.iman));
    this.bDes.disabled = !E.historial?.puedeDeshacer;
    this.bRe.disabled = !E.historial?.puedeRehacer;
    document.body.classList.toggle("ed-dibujando", !!h);
    if (this._h !== h) { this._h = h; this._opciones(h); }
  }

  /**
   * La tirita del lápiz o de la goma (Fase 45): DELGADITA y abajo —en el teléfono, en el lugar de la
   * barra de abajo; en la compu, una pastillita al pie— para que nunca tape la hoja donde dibujas.
   *   [Lápiz | Goma] · colores · grosor · Detrás · Elegir el dibujo · (goma: Borrar todo) · ✓ Listo
   */
  _opciones(h) {
    const o = this.opciones, L = this.app.lienzo, E = this.app.estado;
    const yaVisible = !o.hidden;
    o.textContent = "";
    o.hidden = !h;
    o.classList.add("ed-trazos");
    o.setAttribute("role", "toolbar");
    o.setAttribute("aria-label", h === "borrador" ? "Goma" : "Lápiz");
    o.classList.toggle("entra", !!h && !yaVisible);
    if (!h) return;
    const dibujo = () => (E.pagina?.els || []).filter((e) => e.tipo === "trazo");
    const b = (icono, texto, titulo, al, clase = "") => el("button.ed-tz-b" + clase, { type: "button", title: titulo, "aria-label": titulo, html: `${ico(icono)}${texto ? `<span>${texto}</span>` : ""}`, onClick: al });
    const herr = el("div.ed-tz-herr", { role: "radiogroup", "aria-label": "Herramienta de dibujo" }, [["lapiz", "lapiz", "Lápiz"], ["borrador", "borrador", "Goma"]].map(([k, i, t]) =>
      el("button.ed-tz-h" + (k === h ? ".on" : ""), { type: "button", role: "radio", "aria-checked": String(k === h), title: t, "aria-label": t, html: `${ico(i)}<span>${t}</span>`, onClick: () => this.usar(k) })));
    herr.dataset.h = h;
    const medio = el("div.ed-tz-medio");
    const elegir = b("cursor", "Elegir", "Elegir el dibujo (para moverlo)", () => { const ids = dibujo().map((e) => e.id); if (!ids.length) return aviso("Todavía no hay dibujo en esta página"); this.usar(null); E.seleccionar(ids); });
    if (h === "lapiz") {
      const guardar = () => { try { localStorage.setItem(CLAVE_LAPIZ, JSON.stringify(this.lapiz)); } catch (e) { /* nada */ } L.lapizOp = this.lapiz; };
      const colores = el("div.ed-tz-colores", {}, COLORES.map((c, i) => el("button" + (c === this.lapiz.color ? ".on" : ""), { type: "button", title: c, "aria-label": "Color " + c, style: { "--c": c, "--i": i }, onClick: (ev) => { this.lapiz.color = c; guardar(); for (const x of colores.children) x.classList.toggle("on", x === ev.currentTarget); otro.value = c; rango.pintar(c); } })));
      const otro = el("input", { type: "color", value: this.lapiz.color, title: "Otro color", "aria-label": "Otro color" });
      otro.addEventListener("input", () => { this.lapiz.color = otro.value; guardar(); for (const x of colores.children) x.classList.remove("on"); rango.pintar(otro.value); });
      colores.append(el("label.ed-tz-otro", { style: { "--i": COLORES.length } }, [otro]));
      const rango = this._rango("Grosor", 1, 40, this.lapiz.grosor, (v) => { this.lapiz.grosor = v; guardar(); }, this.lapiz.color);
      const detras = b("capas", this.lapiz.detras ? "Detrás" : "Encima", "Dónde queda el dibujo: encima o detrás de lo demás", () => {
        this.lapiz.detras = !this.lapiz.detras; guardar();
        detras.querySelector("span").textContent = this.lapiz.detras ? "Detrás" : "Encima";
        detras.setAttribute("aria-pressed", String(this.lapiz.detras));
        aviso(this.lapiz.detras ? "Lo que dibujes queda detrás de fotos y textos" : "Lo que dibujes queda encima de todo", 1800);
      });
      detras.setAttribute("aria-pressed", String(!!this.lapiz.detras));
      medio.append(colores, rango, detras, elegir);
    } else {
      medio.append(
        this._rango("Tamaño de la goma", 8, 90, this.goma.tam, (v) => { this.goma.tam = v; L.borradorOp = this.goma; }),
        elegir,
        b("borrar", "Borrar todo", "Borrar todo el dibujo de esta página", async () => { const ids = dibujo().map((e) => e.id); if (!ids.length) return aviso("No hay dibujo en esta página"); if (await confirmar(`Se borran los ${ids.length} trazos de esta página (se puede deshacer).`, "Borrar el dibujo")) E.quitarEls(ids); }, ".peligro"),
      );
    }
    o.append(herr, medio, el("button.ed-tz-listo", { type: "button", title: "Listo", "aria-label": "Listo", html: `${ico("ok")}<span>Listo</span>`, onClick: () => this.usar(null) }));
  }

  /** Un deslizador delgadito con su puntito que muestra el grosor (y el color) de verdad. */
  _rango(nombre, min, max, v, alCambiar, color) {
    const tam = (x) => Math.max(4, Math.min(24, x * 0.6 + 3)) + "px";
    const muestra = el("i.ed-dock-punto", { style: { width: tam(v), height: tam(v), background: color || "transparent" } });
    const r = el("input", { type: "range", min, max, step: 1, value: v, "aria-label": nombre, title: nombre });
    r.addEventListener("input", () => { const x = +r.value; muestra.style.width = muestra.style.height = tam(x); alCambiar(x); });
    const caja = el("label.ed-dock-rango", {}, [r, el("span.ed-tz-punto", {}, [muestra])]);
    caja.pintar = (c) => { muestra.style.background = c; };
    return caja;
  }
}
