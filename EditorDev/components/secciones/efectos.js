/**
 * EFECTOS — cada uno con su miniatura y una previsualización antes de usarlo.
 *
 * Tocar un efecto abre «Previsualización del efecto»: se ve aplicado en lo
 * elegido (de verdad, en la hoja, pero sin guardarse) con un control de
 * intensidad, y abajo «Atrás» (lo deja como estaba) o «Usar».
 * Funciona igual con fotos, GIF, textos, formas, piezas, vídeo, 3D…
 * Los filtros de assets/efectos/ aparecen solos; los efectos ANIMADOS
 * (assets/effects/, una pieza encima de la página) también se previsualizan.
 */
import { el, seccion, boton, control, Vinculos, fila, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import { hojita } from "../hoja.js";
import { catalogo } from "../../componentes/catalogo.js";
import { rutaAUrl } from "../../assets/biblioteca.js";
import { extras, leerEfecto } from "../../recursos/extras.js";

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

/** Los de siempre y unos cuantos más. */
export const EFECTOS = [
  ["Sombra suave", { sombra: { x: 0, y: 8, blur: 16, color: "rgba(60,20,45,.32)" } }],
  ["Resplandor", { resplandor: { color: "#ffc4dc", tam: 14 } }],
  ["Desenfoque", { desenfoque: 3 }],
  ["Blanco y negro", { byn: 100 }],
  ["Sepia", { sepia: 80 }],
  ["Vintage", { sepia: 45, contraste: 110, saturacion: 80, brillo: 105 }],
  ["Más brillo", { brillo: 125, saturacion: 115 }],
  ["Colores vivos", { saturacion: 160, contraste: 108 }],
  ["Arcoíris", { tono: 180 }],
  ["Luz suave", { luz: 45, saturacion: 108 }],
  ["Dramático", { contraste: 135, exposicion: -0.3, saturacion: 90 }],
  ["Desvanecido", { contraste: 82, saturacion: 75, luz: 25 }],
  ["Atardecer", { temperatura: 70, saturacion: 118, exposicion: 0.15 }],
  ["Luna", { temperatura: -60, exposicion: -0.4, saturacion: 80 }],
  ["Neón", { saturacion: 180, contraste: 115, resplandor: { color: "#ff5fa2", tam: 12 } }],
];
const NEUTRO = { brillo: 100, contraste: 100, saturacion: 100 };

/** El efecto a una intensidad (0…1): los números se acercan a «normal». */
export function aIntensidad(f, k) {
  if (k >= 0.999) return f;
  const r = {};
  for (const [c, v] of Object.entries(f)) {
    if (typeof v === "number") { const n = NEUTRO[c] ?? 0; r[c] = Math.round((n + (v - n) * k) * 100) / 100; }
    else if (v && typeof v === "object") {
      const o = { ...v };
      for (const q of ["blur", "tam", "y"]) if (typeof o[q] === "number") o[q] = Math.round(o[q] * k * 10) / 10;
      if (k > 0.05) r[c] = o;
    }
  }
  return r;
}

/** Imagen de muestra para las miniaturas (si lo elegido es una foto, se usa ésa). */
const MUESTRA = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3cf"/><stop offset=".55" stop-color="#ffd9b8"/><stop offset="1" stop-color="#9fd3c7"/></linearGradient></defs><rect width="80" height="80" fill="url(#c)"/><circle cx="58" cy="22" r="10" fill="#fff6d8"/><path d="M0 62l18-16 14 10 16-18 32 26v16H0z" fill="#6b8fb3"/><path d="M40 50c-6-6-14-1-10 6l10 10 10-10c4-7-4-12-10-6z" fill="#e0457f"/></svg>`);

export const EFECTOS_SEC = {
  _efectos(c) {
    const E = this.E;
    const app = this.app;
    const sel = E.seleccionados;
    const foto = sel.length === 1 && sel[0].tipo === "imagen" && sel[0].imagen?.asset ? app.bib.url(sel[0].imagen.asset) : null;
    if (!sel.length) c.append(el("p.ed-nota.suave", { text: "Toca algo de la hoja para elegirlo; luego toca un efecto para verlo antes de usarlo." }));
    const miniatura = (nombre, f) => {
      const b = el("button.ed-efecto", { type: "button", title: nombre }, [
        el("span.ed-efecto-img", {}, [el("img", { src: foto || MUESTRA, alt: "", loading: "lazy", decoding: "async", draggable: "false", style: { filter: RT.efectos(f) } })]),
        el("span", { text: nombre }),
      ]);
      b.addEventListener("click", () => { if (!E.sel.length) { aviso("Primero toca algo de la hoja"); return; } this._previaEfecto(nombre, f); });
      return b;
    };
    const rej = el("div.ed-efectos", {}, EFECTOS.map(([n, f]) => miniatura(n, f)));
    c.append(seccion(sel.length > 1 ? `Filtros · ${sel.length} elementos` : "Filtros", [rej]));
    // Los de assets/efectos/.
    extras().then(async (ex) => {
      for (const it of ex.efectos) { try { const d = await leerEfecto(it); rej.append(miniatura(d.n, d.efectos)); } catch (er) { /* se salta */ } }
    });
    c.append(el("div.ed-botonera", {}, [
      sel.length ? boton(I("luz", "Luz, brillo y color…"), () => app.ajustes.abrir(sel[0].id), "chico") : null,
      sel.length ? boton(I("filtros", "Afinar"), () => app.insp.abrir("diseno", "Efectos"), "chico") : null,
      sel.length ? boton(I("borrar", "Quitar efectos"), () => E.transaccion("Quitar efectos", () => { for (const x of sel) E.setEl(x.id, { efectos: null }, "Quitar efectos"); }), "chico") : null,
    ].filter(Boolean)));
    // Efectos animados: piezas encima de la página.
    const vivos = el("div.ed-comps");
    c.append(seccion("Efectos animados", [vivos, el("small.ed-ayuda", { text: "Lluvias, brillos y partículas de assets/effects/ (y assets/efectos/): se ponen como piezas encima de la página." })]));
    catalogo().then((cat) => {
      for (const g of cat.categorias) {
        if (!/effects|efectos|animations|animaciones/i.test(g.id)) continue;
        for (const it of g.items) if (it.tipo === "componente") vivos.append(el("button.ed-comp", { type: "button", title: it.descripcion || it.nombre, onClick: () => this._previaPieza(it) }, [el("div.ed-comp-prev", { html: it.miniatura ? `<img src="${rutaAUrl(it.miniatura)}" alt="" loading="lazy">` : ico("efectos") }), el("b", { text: it.nombre })]));
      }
      if (!vivos.childElementCount) vivos.append(el("p.ed-vacio-txt", { text: "Todavía no hay efectos animados en assets/effects/." }));
    });
  },

  /** Previsualización: el efecto se ve en lo elegido (sin guardarse) hasta «Usar». */
  _previaEfecto(nombre, f) {
    const E = this.E;
    const app = this.app;
    const ids = [...E.sel];
    const nodos = ids.map((id) => [id, app.lienzo.pag?.nodos.get(id)]).filter(([, n]) => n);
    let k = 1;
    const mezcla = (x) => ({ ...(x.efectos || {}), ...aIntensidad(f, k) });
    const poner = () => { for (const [id, n] of nodos) { const x = E.el(id); if (x) n._rt.c.style.filter = RT.efectos(mezcla(x)); } antes.style.filter = RT.efectos(E.el(ids[0])?.efectos); despues.style.filter = RT.efectos(mezcla(E.el(ids[0]) || {})); };
    const volver = () => { for (const [id, n] of nodos) { const x = E.el(id); if (x) n._rt.c.style.filter = RT.efectos(x.efectos); } };
    const x0 = E.el(ids[0]);
    const src = x0?.tipo === "imagen" && x0.imagen?.asset ? app.bib.url(x0.imagen.asset) : MUESTRA;
    const antes = el("img", { src, alt: "", draggable: "false" });
    const despues = el("img", { src, alt: "", draggable: "false" });
    const v = new Vinculos();
    const intensidad = fila("Intensidad", control(v, { tipo: "rango", min: 0, max: 100, paso: 1, unidad: "%", leer: () => Math.round(k * 100), escribir: (x) => { k = x / 100; poner(); } }));
    poner();
    hojita({
      titulo: "Previsualización del efecto",
      clase: "ed-previa-efecto",
      velo: false,
      sobre: this.cont?.closest?.(".ed-panel"),
      contenido: [
        el("div.ed-antes-despues", {}, [el("figure", {}, [antes, el("figcaption", { text: "Antes" })]), el("figure", {}, [despues, el("figcaption", { text: nombre })])]),
        intensidad,
        el("small.ed-ayuda", { text: ids.length > 1 ? `Se ve en los ${ids.length} elementos elegidos.` : "Se ve en la hoja, pero no se guarda hasta que pulses «Usar»." }),
      ],
      acciones: [[I("volver", "Atrás"), null], [I("ok", "Usar"), "usar", "primario"]],
      alAbrir: (panel) => { v.refrescar(); requestAnimationFrame(() => app.lienzo.mostrarSeleccion?.(panel.offsetHeight + 12)); },
    }).then((r) => {
      volver();
      if (r !== "usar") return;
      E.transaccion("Efecto: " + nombre, () => { for (const id of ids) { const x = E.el(id); if (x) E.setEl(id, { efectos: mezcla(x) }, "Efecto"); } });
    });
  },

  /** Un efecto animado (pieza): se ve en vivo antes de ponerlo. */
  _previaPieza(it) {
    const W = it.ancho || 360, H = it.alto || 360;
    const k = Math.min(300 / W, 220 / H, 1);
    const marco = el("div.ed-previa-pieza", {}, [el("iframe", { src: rutaAUrl(it.ruta + (it.entrada || "index.html")), title: it.nombre, tabindex: "-1", style: { width: W + "px", height: H + "px", transform: `scale(${k})` } })]);
    marco.style.height = Math.round(H * k) + "px";
    hojita({
      titulo: "Previsualización del efecto",
      contenido: [marco, el("b", { text: it.nombre }), it.descripcion ? el("small.ed-ayuda", { text: it.descripcion }) : null].filter(Boolean),
      acciones: [[I("volver", "Atrás"), null], [I("mas", "Usar"), "usar", "primario"]],
    }).then((r) => { if (r === "usar") this.app.acciones.componente(it); });
  },
};
