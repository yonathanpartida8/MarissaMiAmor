/**
 * ANIMAR — compacto, con vista previa antes de usar.
 *
 *   Al aparecer · Mientras está · Al irse      (la fase que se elige)
 *   Integradas      las de siempre
 *   Mías            las que escribes (CSS @keyframes, JSON o JS) y reutilizas
 *   De la carpeta   assets/animaciones/ (aparecen solas)
 *
 * Tocar una la PRUEBA en lo elegido (sin cambiar nada) y abajo aparece
 * «Atrás · Usar». Dos toques = usarla directo. Las mías se borran con su ×.
 * «Probar página» abre la página entera a pantalla completa.
 */
import { el, seccion, boton, aviso, confirmar } from "../ui.js";
import { ico } from "../iconos.js";
import { hojita } from "../hoja.js";
import { extras, leerDeCarpeta, mias, guardarMia, borrarMia, alProyecto, interpretar } from "../../recursos/extras.js";

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const FASES = [["entrada", "Al aparecer"], ["bucle", "Mientras está"], ["salida", "Al irse"]];
const NADA = { entrada: "ninguna", bucle: "ninguno", salida: "ninguna" };

/** Los fotogramas de una animación (integrada o propia) con los ajustes del elemento. */
function fotogramas(fase, tipo, e, def) {
  if (def) return def.fotogramas;
  const d = RT.ANIM[fase]?.[tipo];
  if (!d?.f) return null;
  const p = { ...RT.ANIM_DEF[fase], ...(e?.anim?.[fase] || {}) };
  for (const k in RT.ANIM_DEF[fase]) if (p[k] == null) p[k] = RT.ANIM_DEF[fase][k];
  try { return d.f(p); } catch (x) { return null; }
}

/** Una prueba sin guardar nada: la animación corre una vez en lo elegido. */
function ensayar(app, fase, tipo, def) {
  const L = app.lienzo;
  const E = app.estado;
  for (const e of E.seleccionados) {
    const n = L.pag?.nodos.get(e.id);
    if (!n) continue;
    const k = fotogramas(fase, tipo, e, def);
    if (!k) continue;
    const capa = fase === "bucle" ? n._rt.ab : n._rt.ae;
    const dur = def?.dur || e.anim?.[fase]?.dur || RT.ANIM_DEF[fase].dur;
    try { capa.animate(k, { duration: dur, easing: def?.facil && !RT.FACIL[def.facil] ? def.facil : (RT.FACIL[def?.facil || "suave"] || RT.FACIL.suave).v, iterations: fase === "bucle" ? 2 : 1 }); } catch (x) { /* nada */ }
  }
}

/** La muestrita de cada botón: un cuadrito que hace la animación. */
function muestra(nodo, k, fase, dur) {
  if (!k) return;
  try { nodo.animate(k, { duration: Math.min(1400, dur || 800), iterations: fase === "bucle" ? 2 : 1, easing: "ease-out" }); } catch (x) { /* nada */ }
}

export const ANIMAR = {
  _animar(c) {
    const E = this.E;
    const app = this.app;
    const sel = E.seleccionados;
    const fase = this.faseAnim || "entrada";
    // Arriba: probar la página entera, la línea de tiempo y lo fino.
    c.append(el("div.ed-anim-barra", {}, [
      boton(I("play", "Probar página"), () => app.prueba.abrir(), "primario chico"),
      boton(I("tiempo", "Línea de tiempo"), () => app.tiempo.alternar(true), "chico"),
      sel.length ? boton(I("herramientas", "Ajustes finos"), () => app.insp.abrir("animar"), "chico") : null,
    ].filter(Boolean)));
    const fases = el("div.ed-seg.ed-anim-fases", {}, FASES.map(([v, t]) => el("button" + (v === fase ? ".on" : ""), { type: "button", text: t, onClick: () => { this.faseAnim = v; this.rehacer(); } })));
    c.append(fases);
    if (!sel.length) {
      c.append(el("p.ed-nota.suave", { text: "Toca algo de la hoja para animarlo. Aquí lo pruebas antes de usarlo." }));
      c.append(boton(I("animar", "Animar toda la página en cascada"), () => app.insp.abrir("animar"), "chico"));
    }
    const actual = sel.length === 1 ? sel[0].anim?.[fase]?.tipo : null;
    // La barra de «Atrás · Usar» de la prueba.
    const accion = el("div.ed-anim-accion", { hidden: "" });
    let elegida = null;
    const usar = async (tipo, def) => {
      if (!sel.length) { aviso("Primero toca algo de la hoja"); return; }
      let id = tipo;
      if (def) id = alProyecto(E, "animacion", def);
      E.transaccion("Animación", () => {
        for (const x of E.seleccionados) {
          const a = { ...(x.anim?.[fase] || RT.ANIM_DEF[fase]), tipo: id };
          if (def) Object.assign(a, { dur: def.dur, facil: def.facil });
          E.setEl(x.id, { ["anim." + fase]: a }, "Animación");
        }
      });
      accion.hidden = true;
      elegida = null;
      aviso(id === NADA[fase] ? "Sin animación" : "Animación puesta");
    };
    const probar = (b, tipo, def) => {
      for (const x of c.querySelectorAll(".ed-anim-t.probando")) x.classList.remove("probando");
      b.classList.add("probando");
      const k = fotogramas(fase, tipo, sel[0], def);
      muestra(b.querySelector("i"), k, fase, def?.dur);
      if (!sel.length) return;
      ensayar(app, fase, tipo, def);
      elegida = { tipo, def, b };
      accion.hidden = false;
      accion.querySelector("b").textContent = def?.n || RT.ANIM[fase][tipo]?.n || tipo;
    };
    accion.append(
      el("b"),
      boton(I("refrescar", "Otra vez"), () => elegida && ensayar(app, fase, elegida.tipo, elegida.def), "chico"),
      boton(I("volver", "Atrás"), () => { accion.hidden = true; elegida?.b.classList.remove("probando"); elegida = null; }, "chico"),
      boton(I("ok", "Usar"), () => elegida && usar(elegida.tipo, elegida.def), "chico primario"),
    );
    const tile = (tipo, nombre, def, borrar) => {
      const b = el("button.ed-anim-t" + (actual && (actual === tipo || actual === def?.id) ? ".on" : ""), { type: "button", title: nombre + " · toca para probar, dos veces para usar" }, [el("i.ed-anim-muestra"), el("span", { text: nombre }), borrar ? el("u.ed-anim-x", { html: ico("cerrar"), title: "Borrar", onClick: (ev) => { ev.stopPropagation(); borrar(); } }) : null].filter(Boolean));
      let ult = 0;
      b.addEventListener("click", () => {
        const t = performance.now();
        if (t - ult < 380) { usar(tipo, def); return; }
        ult = t;
        if (tipo === NADA[fase]) { usar(tipo, null); return; }
        probar(b, tipo, def);
      });
      return b;
    };
    // Integradas.
    const integradas = Object.entries(RT.ANIM[fase] || {}).filter(([, d]) => !d.propia).map(([k, d]) => tile(k, d.n));
    c.append(seccion("Integradas", [el("div.ed-anim-rejilla", {}, integradas)], { clase: "compacta" }));
    // Mías (en este aparato) + crear.
    const m = Object.values(mias().animaciones).filter((d) => d.fase === fase);
    const misT = m.map((d) => tile(d.id, d.n, d, async () => { if (await confirmar(`¿Borrar «${d.n}» de tus animaciones? (Lo que ya la usa no cambia.)`, "Borrar")) { borrarMia("animaciones", d.id); this.rehacer(); } }));
    const nueva = el("button.ed-anim-t.nueva", { type: "button", title: "Crear una animación con CSS, JSON o JS", onClick: () => crearPorCodigo(app, "animacion", fase).then((d) => { if (d) { this.faseAnim = d.fase; this.rehacer(); } }) }, [el("i", { html: ico("varita") }), el("span", { text: "Crear" })]);
    c.append(seccion("Mías", [el("div.ed-anim-rejilla", {}, [nueva, ...misT])], { clase: "compacta" }));
    // De la carpeta.
    const carpeta = el("div.ed-anim-rejilla", {}, [el("small.ed-ayuda", { text: "Buscando en assets/animaciones/…" })]);
    c.append(seccion("De la carpeta", [carpeta], { clase: "compacta", abierta: true }));
    extras().then(async (ex) => {
      const lista = [];
      for (const it of ex.animaciones) { try { const d = await leerDeCarpeta(it, "animacion"); if (d.fase === fase) lista.push(tile(d.id, d.n, d)); } catch (er) { console.warn(it.id, er.message); } }
      carpeta.textContent = "";
      if (lista.length) carpeta.append(...lista);
      else carpeta.append(el("small.ed-ayuda", { text: "Deja carpetas en assets/animaciones/ (con su animacion.json, .css o .js) y aparecen aquí." }));
    });
    c.append(accion);
    c.append(seccion("Entre páginas", [boton(I("transiciones", "Transiciones"), () => app.abrirSeccion("transiciones"), "chico")], { abierta: false }));
  },
};

/**
 * Crear una animación (o transición) escribiendo su código. Se cumple con la
 * definición guardada en «Mías» (o null).
 */
export async function crearPorCodigo(app, tipo, fase = "entrada") {
  const esAnim = tipo === "animacion";
  const nombre = el("input.ed-txt", { type: "text", placeholder: esAnim ? "Nombre (por ejemplo: Flotar suave)" : "Nombre (por ejemplo: Cortina rosa)" });
  let f = fase;
  const fases = esAnim ? el("div.ed-seg", {}, FASES.map(([v, t]) => el("button" + (v === f ? ".on" : ""), { type: "button", text: t, onClick: (ev) => { f = v; for (const x of fases.children) x.classList.toggle("on", x === ev.currentTarget); } }))) : null;
  const dur = el("input.ed-txt", { type: "number", min: 80, max: 20000, step: 50, value: esAnim ? 900 : 800, inputmode: "numeric" });
  const area = el("textarea.ed-codigo.ed-escribible.chico", { spellcheck: "false", autocapitalize: "off", wrap: "off", placeholder: esAnim
    ? "@keyframes mia {\n  from { opacity: 0; transform: translateY(20px); }\n  to   { opacity: 1; transform: none; }\n}\n\n(o un JSON con «fotogramas», o JS que haga return [ … ])"
    : "@keyframes entra { from { transform: translateX(100%); } to { transform: none; } }\n@keyframes sale  { from { opacity: 1; } to { opacity: .3; } }" });
  const muestraA = el("div.ed-codigo-muestra", {}, esAnim ? [el("i")] : [el("i.a", { text: "A" }), el("i.b", { text: "B" })]);
  const error = el("small.ed-cp-error");
  const leer = async () => {
    const d = await interpretar(area.value, null, tipo, nombre.value.trim());
    if (esAnim) { d.fase = f; d.dur = +dur.value || d.dur; } else d.dur = +dur.value || d.dur;
    return d;
  };
  const probar = async () => {
    error.textContent = "";
    try {
      const d = await leer();
      if (esAnim) muestraA.firstChild.animate(d.fotogramas, { duration: d.dur, iterations: f === "bucle" ? 2 : 1 });
      else { const [a, b] = muestraA.children; if (d.sale) a.animate(d.sale, { duration: d.dur, fill: "both" }).finished.then((x) => x.cancel()).catch(() => {}); if (d.entra) b.animate(d.entra, { duration: d.dur, fill: "both" }).finished.then((x) => x.cancel()).catch(() => {}); }
      return d;
    } catch (e) { error.textContent = e.message; return null; }
  };
  let cerrar = null;
  const pie = el("div.ed-hojita-pie", {}, [
    boton(I("volver", "Atrás"), () => cerrar?.(null), ""),
    boton(I("guardar", "Guardar"), async () => { const d = await probar(); if (d) cerrar?.(d); }, "primario"),
  ]);
  const d = await hojita({
    titulo: esAnim ? "Crear una animación" : "Crear una transición",
    clase: "ed-crear-codigo",
    contenido: [
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Nombre" }), nombre]),
      fases ? el("div.ed-fila", {}, [el("span.ed-et", { text: "Cuándo" }), fases]) : null,
      el("label.ed-fila", {}, [el("span.ed-et", { text: "Duración (ms)" }), dur]),
      area,
      el("div.ed-codigo-prueba", {}, [muestraA, boton(I("play", "Probar"), probar, "chico")]),
      error,
      el("small.ed-ayuda", { text: "Se acepta CSS (@keyframes), JSON o JavaScript que devuelva los fotogramas (corre aislado: no puede tocar nada del editor). Se guarda en «Mías» para usarla en cualquier librito." }),
      pie,
    ].filter(Boolean),
    alAbrir: (panel, c) => { cerrar = c; },
  });
  if (!d) return null;
  const g = guardarMia(esAnim ? "animaciones" : "transiciones", d);
  aviso(`«${g.n}» guardada en tus ${esAnim ? "animaciones" : "transiciones"}`);
  return g;
}
