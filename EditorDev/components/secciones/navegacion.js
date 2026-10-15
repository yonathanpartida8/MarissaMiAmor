/**
 * PASAR PÁGINA — su propia sección en el riel (antes estaba escondida en
 * Herramientas), con todo lo de leer el librito en un solo lugar.
 *
 * Cada estilo es una carpeta de assets/deslizar/ con `izquierda.*` y
 * `derecha.*`. El librito los usa como flechas (y además se pasa deslizando).
 * «En esta página» los pone como dos botones abajo, pegados a los rincones
 * (nunca se salen de la pantalla) y siempre por encima de todo.
 */
import { el, seccion, fila, boton, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import { rutaAUrl } from "../../assets/biblioteca.js";
import { extras } from "../../recursos/extras.js";
import { uid, nuevoEl } from "../../core/modelo.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;

/** Una imagen de assets/ como asset del proyecto (sin copiarla), directo sobre el proyecto. */
function assetDe(P, ruta, nombre) {
  const ya = Object.values(P.assets).find((a) => a.fuente === "librito" && a.ruta === ruta);
  if (ya) return ya.id;
  const id = uid("a");
  P.assets[id] = { id, tipo: "imagen", nombre, archivo: ruta.split("/").pop(), fuente: "librito", ruta, creado: Date.now(), w: 64, h: 64 };
  return id;
}

/**
 * Al abrir un librito: si todavía no tiene botones de assets/deslizar/, se le
 * ponen los primeros (corazón si está). No pasa por el historial.
 */
export async function asegurarBotones(P) {
  const r = (P.ajustes.reproduccion = P.ajustes.reproduccion || {});
  const b = r.botones;
  if (b?.izq && P.assets[b.izq] && b.der && P.assets[b.der]) return;
  const lista = (await extras()).deslizar || [];
  const s = lista.find((x) => /corazon/i.test(x.id)) || lista[0];
  if (!s) return;
  r.botones = { estilo: s.id, tam: b?.tam || 52, izq: assetDe(P, s.izquierda, `${s.nombre} · izquierda`), der: assetDe(P, s.derecha, `${s.nombre} · derecha`) };
}

/** Los dos botones (anterior y siguiente) sobre la página actual, abajo en los rincones. */
export async function ponerBotonesPagina(app, s = null) {
  const E = app.estado, P = E.proyecto, L = app.lienzo;
  if (!s) {
    const lista = (await extras()).deslizar || [];
    const est = P.ajustes.reproduccion?.botones?.estilo;
    s = lista.find((x) => x.id === est) || lista.find((x) => /corazon/i.test(x.id)) || lista[0];
  }
  if (!s) { aviso("No hay estilos en assets/deslizar/"); return []; }
  const t = Math.round(Math.max(40, Math.min(64, Math.min(L.W, L.H) * 0.13)));
  const y = L.H - t - 26, ids = [];
  // Si ya había botones de pasar página en esta hoja, se cambian por los nuevos.
  const viejos = (E.pagina?.els || []).filter((x) => x.accion && /^(anterior|siguiente)$/.test(x.accion.tipo)).map((x) => x.id);
  E.transaccion("Botones para pasar página", () => {
    if (viejos.length) E.quitarEls(viejos);
    for (const [lado, ruta, x, tipo, h] of [["izquierda", s.izquierda, 14, "anterior", "izq"], ["derecha", s.derecha, L.W - t - 14, "siguiente", "der"]]) {
      const a = app.bib.delLibrito(ruta, "imagen", `${s.nombre} · ${lado}`, { w: 64, h: 64 });
      const e = nuevoEl("imagen", P, { nombre: lado === "izquierda" ? "Página anterior" : "Página siguiente", x, y, w: t, h: t, imagen: { asset: a.id, ajuste: "contain" }, accion: { tipo }, ancla: { h, v: "abajo" } });
      E.agregarEl(e, null, E.paginaId, false);
      ids.push(e.id);
    }
  });
  E.seleccionar(ids);
  return ids;
}

export const NAVEGACION = {
  _navegacion(c) {
    const E = this.E;
    const app = this.app;
    const b = () => this.P.ajustes.reproduccion?.botones || {};
    const rej = el("div.ed-deslizar");
    const usar = (s) => {
      E.transaccion("Botones para pasar página", () => {
        const izq = app.bib.delLibrito(s.izquierda, "imagen", `${s.nombre} · izquierda`, { w: 64, h: 64 }).id;
        const der = app.bib.delLibrito(s.derecha, "imagen", `${s.nombre} · derecha`, { w: 64, h: 64 }).id;
        E.setProy({ "ajustes.reproduccion.botones": { ...b(), estilo: s.id, izq, der } }, "Botones para pasar página");
      });
      for (const x of rej.children) x.classList.toggle("on", x.dataset.id === s.id);
      app.sonidos?.sonar("seleccionar");
    };
    const ponerAqui = async (s) => {
      await ponerBotonesPagina(app, s);
      aviso("Listo: al tocarlos en el librito pasan la página. Siempre quedan encima de todo.");
    };
    extras().then((ex) => {
      const lista = ex.deslizar || [];
      if (!lista.length) { rej.append(el("p.ed-vacio-txt", { text: "No hay estilos en assets/deslizar/. Deja una carpeta con izquierda.svg y derecha.svg." })); return; }
      for (const s of lista) {
        rej.append(el("div.ed-deslizar-t" + (b().estilo === s.id ? ".on" : ""), { dataset: { id: s.id } }, [
          el("button.ed-deslizar-par", { type: "button", title: `Usar «${s.nombre}» en el librito`, onClick: () => usar(s) }, [
            el("img", { src: rutaAUrl(s.izquierda), alt: "", draggable: "false" }),
            el("img", { src: rutaAUrl(s.derecha), alt: "", draggable: "false" }),
          ]),
          el("b", { text: s.nombre }),
          el("button.ed-btn.chico", { type: "button", html: I("mas", "En esta página"), title: "Ponerlos sobre la página como botones", onClick: () => ponerAqui(s).then(() => this.rehacer()) }),
        ]));
      }
    });
    const p = this._proy();
    const navs = (E.pagina?.els || []).filter((x) => x.accion && /^(anterior|siguiente)$/.test(x.accion.tipo));
    c.append(el("div.ed-nav-estado" + (navs.length ? ".bien" : ""), {}, [
      el("span", { html: ico(navs.length ? "ok" : "aviso") }),
      el("p", { text: navs.length ? `Esta página tiene ${navs.length === 1 ? "1 botón" : navs.length + " botones"} para pasar o volver.` : "Esta página todavía no tiene botones propios para pasar y volver." }),
      navs.length ? null : el("button.ed-btn.chico.primario", { type: "button", html: I("mas", "Ponerlos aquí"), onClick: () => ponerAqui(null).then(() => this.rehacer()) }),
    ].filter(Boolean)));
    c.append(seccion("Botones para pasar página", [
      rej,
      fila("Tamaño", p("ajustes.reproduccion.botones.tam", { tipo: "rango", min: 36, max: 88, unidad: " px", def: 52 })),
      el("small.ed-ayuda", { text: "Elige un estilo para las flechas de todo el librito, o toca «En esta página» para poner los dos botones abajo, en los rincones (siempre quedan encima de todo y nunca se salen de la pantalla). También se pasa deslizando con el dedo." }),
    ]));
    c.append(seccion("Cómo se lee", [
      fila("Flechas", p("ajustes.reproduccion.flechas", { tipo: "toggle" })),
      fila("Pasar deslizando", p("ajustes.reproduccion.deslizar", { tipo: "toggle" })),
      fila("Barrita de progreso", p("ajustes.reproduccion.progreso", { tipo: "toggle" })),
      fila("Índice", p("ajustes.reproduccion.indice", { tipo: "toggle" })),
      fila("«Toca para abrir»", p("ajustes.reproduccion.tocarParaEmpezar", { tipo: "toggle" })),
      fila("Al terminar", p("ajustes.reproduccion.alFinal", { tipo: "segmento", opciones: [["quedarse", "Quedarse"], ["portada", "Volver a empezar"]] })),
      fila("Pasar solas", p("ajustes.reproduccion.autoAvance", { tipo: "rango", min: 0, max: 30, unidad: " s" }), "0 = sólo cuando ella pase la hoja"),
    ]));
  },
};
