/**
 * AJUSTES AL MANTENER PRESIONADO — luz, exposición, brillo, contraste…
 *
 * Mantener presionado un objeto abre una hojita (que no tapa la página) con
 * sólo lo útil para ESE objeto:
 *   fotos, GIF, vídeo, stickers, piezas, 3D, formas, dibujos
 *       Luz · Exposición · Brillo · Contraste · Saturación · Temperatura ·
 *       Opacidad · Desenfoque
 *   textos       Opacidad · Brillo · Saturación · Desenfoque
 *   HTML/página  Opacidad · Brillo · Contraste · Saturación
 * Cada deslizador es un solo paso de «deshacer» por arrastre. Las
 * animaciones NO están aquí (siguen en Animar, como siempre).
 * Abajo: Restablecer · Más opciones (el menú de siempre) · Efectos · Listo.
 */
import { el, control, Vinculos } from "./ui.js";
import { ico } from "./iconos.js";
import { hojita } from "./hoja.js";

const AJ = {
  luz: { n: "Luz", ico: "luz", min: -100, max: 100, paso: 1, neutro: 0 },
  exposicion: { n: "Exposición", ico: "exposicion", min: -2, max: 2, paso: 0.1, neutro: 0 },
  brillo: { n: "Brillo", ico: "brillo", min: 0, max: 200, paso: 1, neutro: 100, unidad: "%" },
  contraste: { n: "Contraste", ico: "contraste", min: 0, max: 200, paso: 1, neutro: 100, unidad: "%" },
  saturacion: { n: "Saturación", ico: "saturacion", min: 0, max: 200, paso: 1, neutro: 100, unidad: "%" },
  temperatura: { n: "Temperatura", ico: "temperatura", min: -100, max: 100, paso: 1, neutro: 0 },
  opacidad: { n: "Opacidad", ico: "opacidad", min: 0, max: 1, paso: 0.01, neutro: 1, propio: true },
  desenfoque: { n: "Desenfoque", ico: "gota", min: 0, max: 20, paso: 0.5, neutro: 0, unidad: "px" },
};
const POR_TIPO = {
  texto: ["opacidad", "brillo", "saturacion", "desenfoque"],
  html: ["opacidad", "brillo", "contraste", "saturacion"],
  pagina: ["opacidad", "brillo", "contraste", "saturacion"],
};
const TODOS = ["luz", "exposicion", "brillo", "contraste", "saturacion", "temperatura", "opacidad", "desenfoque"];

export class Ajustes {
  constructor(app) { this.app = app; this.abierta = null; }

  abrir(id, punto) {
    const E = this.app.estado;
    const e = E.el(id);
    if (!e) return;
    this.abierta?.cerrar?.(null);
    const ids = E.sel.includes(id) ? [...E.sel] : [id];
    const claves = POR_TIPO[e.tipo] || TODOS;
    const v = new Vinculos();
    const leer = (k) => { const x = E.el(id); if (!x) return AJ[k].neutro; return AJ[k].propio ? x.opacidad ?? 1 : x.efectos?.[k] ?? AJ[k].neutro; };
    const escribir = (k, val) => E.transaccion("Ajustes", () => {
      for (const i of ids) {
        const x = E.el(i);
        if (!x || x.bloqueado) continue;
        if (AJ[k].propio) E.setEl(i, { opacidad: val }, "Ajustes", "aj-" + k + i);
        else {
          const ef = { ...(x.efectos || {}) };
          if (val === AJ[k].neutro) delete ef[k]; else ef[k] = val;
          E.setEl(i, { efectos: Object.keys(ef).length ? ef : null }, "Ajustes", "aj-" + k + i);
        }
      }
    }, "aj-" + k);
    const filas = claves.map((k) => {
      const a = AJ[k];
      const nombre = el("button.ed-aj-et", { type: "button", title: "Toca dos veces para volver a lo normal", html: `${ico(a.ico)}<span>${a.n}</span>` });
      let ult = 0;
      nombre.addEventListener("click", () => { const t = performance.now(); if (t - ult < 380) { escribir(k, a.neutro); v.refrescar(); } ult = t; });
      return el("div.ed-aj-fila", { dataset: { k } }, [nombre, control(v, { tipo: "rango", min: a.min, max: a.max, paso: a.paso, unidad: a.unidad || "", leer: () => leer(k), escribir: (x) => escribir(k, x) })]);
    });
    const quitarOyente = E.on("el", () => v.refrescar());
    const restablecer = () => E.transaccion("Restablecer ajustes", () => {
      for (const i of ids) {
        const x = E.el(i);
        if (!x) continue;
        const ef = { ...(x.efectos || {}) };
        for (const k of claves) if (!AJ[k].propio) delete ef[k];
        E.setEl(i, { efectos: Object.keys(ef).length ? ef : null, ...(claves.includes("opacidad") ? { opacidad: 1 } : {}) }, "Restablecer ajustes");
      }
    });
    const x = punto?.x ?? innerWidth / 2, y = punto?.y ?? innerHeight / 2;
    const pie = el("div.ed-aj-pie", {}, [
      el("button.ed-btn.chico", { type: "button", html: `${ico("refrescar")}<span>Restablecer</span>`, onClick: () => { restablecer(); v.refrescar(); } }),
      el("button.ed-btn.chico", { type: "button", html: `${ico("puntos")}<span>Más opciones</span>`, onClick: () => { this.abierta?.cerrar(null); setTimeout(() => this.app.lienzo.menuEn(x, y), 60); } }),
      el("button.ed-btn.chico", { type: "button", html: `${ico("efectos")}<span>Efectos</span>`, onClick: () => { this.abierta?.cerrar(null); this.app.abrirSeccion("efectos"); } }),
    ]);
    const titulo = ids.length > 1 ? `Ajustes · ${ids.length} elementos` : `Ajustes · ${e.nombre}`;
    hojita({
      titulo, clase: "ed-ajustes", velo: false,
      contenido: [el("div.ed-aj-filas", {}, filas), pie],
      acciones: [["Listo", true, "primario"]],
      alAbrir: (panel, cerrar) => {
        this.abierta = { cerrar };
        v.refrescar();
        // Que lo elegido se vea por encima de la hojita.
        requestAnimationFrame(() => this.app.lienzo.mostrarSeleccion?.(panel.offsetHeight + 12));
      },
    }).then(() => { this.abierta = null; quitarOyente(); });
  }
}
