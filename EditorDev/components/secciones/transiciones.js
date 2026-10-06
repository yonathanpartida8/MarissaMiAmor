/**
 * TRANSICIONES — con miniatura, previsualización y «Atrás · Usar».
 *
 *   Integradas      las de siempre (fundido, deslizar, pasar la hoja…)
 *   Mías            las que escribes (CSS con @keyframes entra/sale, JSON o JS)
 *   De la carpeta   assets/transiciones/ (aparecen solas)
 *
 * Tocar una abre «Previsualización de la transición»: se ve de verdad, de la
 * página anterior a ésta (en chiquito), se puede repetir, y se elige si va
 * en esta página o en todo el librito. Abajo siguen los ajustes finos.
 */
import { el, seccion, fila, boton, control, aviso, confirmar } from "../ui.js";
import { ico } from "../iconos.js";
import { hojita } from "../hoja.js";
import { rutaAUrl } from "../../assets/biblioteca.js";
import { extras, leerDeCarpeta, mias, borrarMia, alProyecto } from "../../recursos/extras.js";
import { crearPorCodigo } from "./animar.js";

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

/** Una página en chiquito (sin marcos ni vídeos: sólo cómo se ve). */
function mini(app, pagina, ancho) {
  const L = app.lienzo;
  const W = L.W, H = L.H;
  const k = ancho / W;
  const caja = el("div.ed-mini-pag", { style: { width: ancho + "px", height: Math.round(H * k) + "px" } });
  if (!pagina) { caja.classList.add("vacia"); return caja; }
  const p = new RT.Pagina(pagina, { modo: "mini", url: (id) => app.bib.url(id), ruta: (r) => rutaAUrl(r), medidas: L.m }, W, H);
  p.nodo.style.transform = `scale(${k})`;
  p.nodo.style.transformOrigin = "0 0";
  caja.append(p.nodo);
  caja._pag = p;
  return caja;
}

export const TRANSICIONES = {
  _transiciones(c) {
    const p = this._proy();
    const g = this._pag();
    const E = this.E;
    const app = this.app;
    const gT = this.P.ajustes.transicion;
    const pt = E.pagina?.transicion;
    const actual = (pt?.tipo ? pt : gT).tipo;
    const tile = (k, n, def, borrar) => {
      const b = el("button.ed-trans-t" + (actual === k || actual === def?.id ? ".on" : ""), { type: "button", title: n }, [
        el("span.ed-trans-escena", {}, [el("i.a"), el("i.b")]),
        el("span", { text: n }),
        borrar ? el("u.ed-anim-x", { html: ico("cerrar"), title: "Borrar", onClick: (ev) => { ev.stopPropagation(); borrar(); } }) : null,
      ].filter(Boolean));
      b.addEventListener("pointerenter", (ev) => { if (ev.pointerType === "mouse") this._miniTrans(b, k, def); });
      b.addEventListener("click", () => { this._miniTrans(b, k, def); this._previaTrans(k, n, def); });
      return b;
    };
    const integradas = Object.entries(RT.TRANS).filter(([k, v]) => !v.propia && k !== "personalizada").map(([k, v]) => tile(k, v.n));
    integradas.push(tile("personalizada", "A mi medida"));
    c.append(seccion("Transiciones", [el("div.ed-trans-rejilla", {}, integradas), el("small.ed-ayuda", { text: "Toca una para verla antes de usarla. Es la transición con la que se LLEGA a la página." })]));
    const m = Object.values(mias().transiciones);
    const nueva = el("button.ed-trans-t.nueva", { type: "button", onClick: () => crearPorCodigo(app, "transicion").then((d) => { if (d) this.rehacer(); }) }, [el("span.ed-trans-escena", { html: ico("varita") }), el("span", { text: "Crear" })]);
    c.append(seccion("Mías", [el("div.ed-trans-rejilla", {}, [nueva, ...m.map((d) => tile(d.id, d.n, d, async () => { if (await confirmar(`¿Borrar «${d.n}» de tus transiciones?`, "Borrar")) { borrarMia("transiciones", d.id); this.rehacer(); } }))])], { clase: "compacta" }));
    const carpeta = el("div.ed-trans-rejilla", {}, [el("small.ed-ayuda", { text: "Buscando en assets/transiciones/…" })]);
    c.append(seccion("De la carpeta", [carpeta], { clase: "compacta" }));
    extras().then(async (ex) => {
      const lista = [];
      for (const it of ex.transiciones) { try { const d = await leerDeCarpeta(it, "transicion"); lista.push(tile(d.id, d.n, d)); } catch (er) { console.warn(it.id, er.message); } }
      carpeta.textContent = "";
      if (lista.length) carpeta.append(...lista); else carpeta.append(el("small.ed-ayuda", { text: "Deja carpetas en assets/transiciones/ (con transicion.json, .css o .js) y aparecen aquí." }));
    });
    // Los ajustes finos (lo de siempre).
    const dirs = [["auto", "Según hacia dónde pases"], ["izquierda", "Hacia la izquierda"], ["derecha", "Hacia la derecha"], ["arriba", "Hacia arriba"], ["abajo", "Hacia abajo"]];
    const facil = Object.entries(RT.FACIL).map(([k, v]) => [k, v.n]);
    const global = [
      fila("Duración", p("ajustes.transicion.dur", { tipo: "rango", min: 150, max: 2500, paso: 50, unidad: "ms" })),
      RT.TRANS[gT.tipo]?.dir ? fila("Dirección", p("ajustes.transicion.dir", { tipo: "select", opciones: dirs })) : null,
      fila("Ritmo", p("ajustes.transicion.facil", { tipo: "select", opciones: facil })),
    ];
    if (gT.tipo === "personalizada") global.push(...this._transPropia(p, "ajustes.transicion.propia"));
    global.push(this._sonidoFila(() => this.P.ajustes.transicion.sonido, (id) => E.setProy({ "ajustes.transicion.sonido": id }, "Sonido al pasar"), "Sonido al pasar"));
    c.append(seccion(`Todo el librito · ${RT.TRANS[gT.tipo]?.n || gT.tipo}`, global.filter(Boolean), { abierta: false }));
    const propia = [fila("Usar", control(this.v, { tipo: "segmento", opciones: [["global", "La del librito"], ["propia", "Una propia"]], leer: () => (E.pagina?.transicion ? "propia" : "global"), escribir: (x) => E.setPag({ transicion: x === "propia" ? { ...this.P.ajustes.transicion } : null }, "Transición de la página") }))];
    if (pt) {
      propia.push(
        fila("Duración", g("transicion.dur", { tipo: "rango", min: 150, max: 2500, paso: 50, unidad: "ms" })),
        RT.TRANS[pt.tipo]?.dir ? fila("Dirección", g("transicion.dir", { tipo: "select", opciones: dirs })) : null,
        fila("Ritmo", g("transicion.facil", { tipo: "select", opciones: facil })),
      );
      if (pt.tipo === "personalizada") propia.push(...this._transPropia(g, "transicion.propia"));
      propia.push(this._sonidoFila(() => E.pagina?.transicion?.sonido, (id) => E.setPag({ "transicion.sonido": id }, "Sonido al llegar"), "Sonido al llegar"));
    }
    c.append(seccion(`Al llegar a esta página${pt ? " · " + (RT.TRANS[pt.tipo]?.n || pt.tipo) : ""}`, propia.filter(Boolean), { abierta: !!pt }));
    c.append(boton(I("play", "Verla en el librito"), () => {
      const i = this.P.orden.indexOf(E.paginaId);
      app.vista.abrir(Math.max(0, i - 1), { avanzar: i > 0 });
    }, "chico"));
  },

  /** La miniatura de un botón: dos rectangulitos haciendo la transición. */
  _miniTrans(b, k, def) {
    const [a, bb] = b.querySelectorAll(".ed-trans-escena i");
    if (!a) return;
    const d = def ? { entra: def.entra, sale: def.sale, encima: def.encima } : RT.TRANS[k]?.f?.("izquierda", false, this.P.ajustes.transicion.propia);
    if (!d) return;
    bb.style.zIndex = d.encima === "sale" ? 1 : 2;
    a.style.zIndex = d.encima === "sale" ? 2 : 1;
    const op = { duration: def?.dur || 700, easing: "ease-in-out" };
    try { if (d.sale) a.animate(d.sale, op); if (d.entra) bb.animate(d.entra, op); } catch (x) { /* nada */ }
  },

  /** Previsualización con las páginas de verdad (en chiquito). */
  _previaTrans(k, nombre, def) {
    const E = this.E;
    const app = this.app;
    const P = this.P;
    const i = P.orden.indexOf(E.paginaId);
    const antes = P.paginas[P.orden[i - 1]] || null;
    const ancho = Math.min(260, innerWidth - 80);
    const escena = el("div.ed-trans-previa");
    let donde = E.pagina?.transicion ? "pagina" : "todo";
    const base = { ...(E.pagina?.transicion || P.ajustes.transicion) };
    const cfg = () => ({ ...base, tipo: def ? def.id : k, dur: def?.dur || base.dur || 700, facil: def ? "entraSale" : base.facil });
    if (def) RT.TRANS[def.id] = RT.TRANS[def.id] || { n: def.n, propia: true, f: () => ({ entra: def.entra, sale: def.sale, encima: def.encima }) };
    const jugar = () => {
      escena.textContent = "";
      const a = mini(app, antes || { fondo: { color: "#3b2a3f" }, els: [] }, ancho);
      const b = mini(app, E.pagina, ancho);
      escena.style.height = a.style.height;
      escena.append(a, b);
      requestAnimationFrame(() => RT.transicion(a, b, cfg(), false).then(() => { setTimeout(() => { if (a.isConnected) a.style.visibility = "hidden"; }, 30); }));
    };
    const dondeSeg = el("div.ed-seg", {}, [["pagina", "Esta página"], ["todo", "Todo el librito"]].map(([v, t]) => el("button" + (v === donde ? ".on" : ""), { type: "button", text: t, onClick: (ev) => { donde = v; for (const x of dondeSeg.children) x.classList.toggle("on", x === ev.currentTarget); } })));
    hojita({
      titulo: "Previsualización de la transición",
      clase: "ed-previa-trans",
      contenido: [
        escena,
        el("div.ed-previa-trans-pie", {}, [el("b", { text: nombre }), boton(I("refrescar", "Otra vez"), jugar, "chico")]),
        el("div.ed-fila", {}, [el("span.ed-et", { text: "Usarla en" }), dondeSeg]),
        antes ? null : el("small.ed-ayuda", { text: "Es la primera página: se ve llegando desde una página oscura." }),
      ].filter(Boolean),
      acciones: [[I("volver", "Atrás"), null], [I("ok", "Usar"), "usar", "primario"]],
      alAbrir: () => setTimeout(jugar, 260),
    }).then((r) => {
      for (const m of escena.querySelectorAll(".ed-mini-pag")) m._pag?.destruir();
      if (r !== "usar") return;
      const tipo = def ? alProyecto(E, "transicion", def) : k;
      const extra = def ? { dur: def.dur } : {};
      if (donde === "pagina") E.setPag({ transicion: { ...(E.pagina?.transicion || P.ajustes.transicion), tipo, ...extra } }, "Transición de la página");
      else E.transaccion("Transición", () => { E.setProy({ "ajustes.transicion.tipo": tipo, ...(def ? { "ajustes.transicion.dur": def.dur } : {}) }, "Transición"); if (E.pagina?.transicion) E.setPag({ transicion: null }, "Transición de la página"); });
      aviso(`Transición «${nombre}» puesta${donde === "pagina" ? " en esta página" : " en todo el librito"}`);
    });
  },
};
