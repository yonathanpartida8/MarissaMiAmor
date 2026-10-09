/**
 * TEMAS Y ESTILOS DE HOJA — para UNA página.
 *
 *   PAPELES         estilos de hoja (rayada, cuadriculada, kraft, leopardo…):
 *                   CSS puro, sin archivos. Se repiten o se estiran, así que
 *                   se adaptan a cualquier tamaño de hoja y se ven igual en
 *                   el librito exportado.
 *   TEMAS           un papel + colores + letras que combinan.
 *   ponerTema()     lo pone en una página: fondo, color y letra de los
 *                   textos, color de dibujos, formas y botones. La foto o el
 *                   HTML de fondo que tuviera se quedan.
 *   temaDeHoja()    la hojita con vista previa en vivo (mantener presionada
 *                   la hoja o botón derecho → «Tema de esta hoja»): tocar un
 *                   tema lo pone en la hoja; «Usar» lo deja con un solo
 *                   deshacer y «Atrás» la deja exactamente como estaba.
 */
import { el, aviso } from "./ui.js";
import { ico } from "./iconos.js";
import { hojita } from "./hoja.js";
import { PAPELES, fondoDePapel, nombrePapel, muestraPapel } from "../templates/papeles.js";

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

export { PAPELES, fondoDePapel, nombrePapel, muestraPapel };

export const TEMAS = [
  { id: "cuaderno", n: "Cuaderno", papel: "rayada", texto: "#3a2440", acento: "#e0457f", titulos: "Caveat", fuente: "Jost" },
  { id: "carta", n: "Carta antigua", papel: "pergamino", texto: "#4a2e18", acento: "#9c3d2a", titulos: "Playfair Display", fuente: "Cormorant Garamond" },
  { id: "acuarela", n: "Rosa acuarela", papel: "acuarela", texto: "#5a2a45", acento: "#e0457f", titulos: "Dancing Script", fuente: "Quicksand" },
  { id: "noche", n: "Noche de estrellas", papel: "noche", texto: "#f3e9ff", acento: "#ffc93c", titulos: "Great Vibes", fuente: "Quicksand" },
  { id: "baddie", n: "Baddie leopardo", papel: "leopardo", texto: "#17100b", acento: "#a3101c", titulos: "Pacifico", fuente: "Poppins" },
  { id: "picnic", n: "Picnic", papel: "vichy", texto: "#4a2030", acento: "#e0457f", titulos: "Caveat", fuente: "Quicksand" },
  { id: "corazones", n: "Corazoncitos", papel: "corazones", texto: "#5a2a45", acento: "#ff5c93", titulos: "Dancing Script", fuente: "Quicksand" },
  { id: "kraft", n: "Kraft", papel: "kraft", texto: "#3b2412", acento: "#7a2e1d", titulos: "Amatic SC", fuente: "Jost" },
  { id: "pizarron", n: "Pizarrón", papel: "pizarron", texto: "#f4f1e8", acento: "#ffb3cf", titulos: "Caveat", fuente: "Caveat" },
  { id: "corcho", n: "Tablero de corcho", papel: "corcho", texto: "#2e1b0e", acento: "#c8102e", titulos: "Amatic SC", fuente: "Quicksand" },
  { id: "cuadros", n: "Apuntes", papel: "cuadros", texto: "#24324a", acento: "#3d6fd1", titulos: "Caveat", fuente: "Jost" },
  { id: "minimal", n: "Minimal", papel: "liso", texto: "#222222", acento: "#e0457f", titulos: "Playfair Display", fuente: "Jost" },
];

/** Pone un tema en la página `pid` (dentro de la transacción o gesto que esté abierto). */
export function ponerTema(E, pid, tema) {
  const pag = E.proyecto.paginas[pid];
  if (!pag || !tema) return;
  E.setPag({ fondo: fondoDePapel(tema.papel, pag.fondo || {}) }, "Tema de la hoja", null, pid);
  for (const x of pag.els) {
    if (x.bloqueado) continue;
    if (x.tipo === "texto" && x.texto) E.setEl(x.id, { "texto.color": tema.texto, "texto.fuente": (x.texto.tam || 0) >= 32 ? tema.titulos : tema.fuente }, "Tema", null, pid);
    else if (x.tipo === "dibujo" && x.dibujo) E.setEl(x.id, { "dibujo.color": tema.acento }, "Tema", null, pid);
    else if (x.tipo === "forma" && x.forma && !x.forma.gradiente) E.setEl(x.id, { "forma.relleno": tema.acento }, "Tema", null, pid);
    else if (x.tipo === "boton" && x.boton) E.setEl(x.id, { "boton.fondo": tema.acento, "boton.color": "#ffffff", "boton.fuente": tema.fuente }, "Tema", null, pid);
  }
  RT.cargarFuentes?.([tema.titulos, tema.fuente]);
}

/** Ficha de muestra: el papel con un título y un renglón con sus letras y colores. */
function ficha(t) {
  return el("button.ed-tema-ficha", { type: "button", title: t.n, dataset: { k: t.id } }, [
    el("span.ed-tema-muestra", { style: { background: muestraPapel(t.papel) } }, [
      el("b", { text: "Te amo", style: { color: t.texto, fontFamily: RT.pilaFuente?.(t.titulos) || t.titulos } }),
      el("i", { style: { background: t.acento } }),
    ]),
    el("small", { text: t.n }),
  ]);
}

/**
 * La hojita «Tema de esta hoja». Mientras está abierta, lo que se toca se ve
 * en la hoja de verdad (dentro de un gesto que se puede descartar entero).
 */
export function temaDeHoja(app, pid = app.estado.paginaId) {
  const E = app.estado;
  if (!E.proyecto.paginas[pid]) return;
  if (pid !== E.paginaId) E.irPagina(pid);
  E.seleccionar([]);
  let fin = null, elegido = null;
  const terminar = (guardar) => { if (fin) { const f = fin; fin = null; f(guardar && !!elegido); } };
  const probar = (t) => {
    if (fin) fin(false);
    fin = E.gesto("Tema: " + t.n);
    ponerTema(E, pid, t);
    elegido = t;
    for (const b of rej.children) b.classList.toggle("on", b.dataset.k === t.id);
    nombre.textContent = t.n;
  };
  const rej = el("div.ed-temas", {}, TEMAS.map((t) => { const b = ficha(t); b.addEventListener("click", () => probar(t)); return b; }));
  const nombre = el("b.ed-temas-nombre", { text: "Toca uno para verlo en la hoja" });
  RT.cargarFuentes?.([...new Set(TEMAS.map((t) => t.titulos))]);
  let vista = null;
  hojita({
    titulo: "Tema de esta hoja",
    clase: "ed-previa-tema",
    velo: false,
    sobre: document.querySelector(".ed-insp"),
    contenido: [nombre, rej, el("small.ed-ayuda", { text: "Cambia el papel, los colores y las letras sólo de esta página. Las fotos y lo bloqueado no se tocan. No se guarda hasta «Usar»." })],
    // Se guarda o se descarta en el mismo toque (no al terminar de bajar la hojita).
    acciones: [[I("volver", "Atrás"), () => (terminar(false), null)], [I("ok", "Usar"), () => (terminar(true), "usar"), "primario"]],
    alAbrir: (panel) => requestAnimationFrame(() => {
      if (panel.classList.contains("acoplada")) return;
      vista = app.lienzo.verHojaArriba?.(panel.offsetHeight + 8) || null;
    }),
  }).then((r) => {
    terminar(r === "usar");
    if (vista) app.lienzo.volverVista?.(vista);
    if (r === "usar" && elegido) aviso("Tema «" + elegido.n + "» en esta hoja (se puede deshacer)");
  });
}
