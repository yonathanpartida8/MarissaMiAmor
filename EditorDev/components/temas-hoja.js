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

const RT = window.LibritoRT;
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

const corazon = (c) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 31s-7-4.3-9-8.6C11.6 19.3 13.5 16 16.8 16c1.9 0 3.3 1.1 4 2.2.8-1.1 2.2-2.2 4.1-2.2 3.3 0 5.2 3.3 3.8 6.4C29 26.7 22 31 22 31z' fill='%23${c}'/%3E%3C/svg%3E") 0 0/44px 44px`;
// Rosetas en rejillas de tamaños distintos: juntas no se nota que se repiten.
const roseta = (x, y, a, b, w, h) => `radial-gradient(ellipse ${a}px ${b}px at 50% 50%, #9a6a35 0 40%, #2a170a 47% 68%, transparent 74%) ${x}px ${y}px/${w}px ${h}px`;
const mancha = (x, y, r, w, h) => `radial-gradient(circle at 50% 50%, #2a170a 0 ${r}px, transparent ${r + 0.6}px) ${x}px ${y}px/${w}px ${h}px`;

/** [id, nombre, color base, css]. El color base va debajo (se puede cambiar en el inspector). */
export const PAPELES = [
  ["liso", "Liso", "#fffaf6", ""],
  ["rayada", "Rayada", "#fffdf7", "repeating-linear-gradient(180deg, transparent 0 27px, rgba(90,120,170,.26) 27px 28px), linear-gradient(90deg, transparent 0 42px, rgba(224,69,127,.38) 42px 43.5px, transparent 43.5px)"],
  ["cuadros", "Cuadriculada", "#fdfdfb", "linear-gradient(rgba(90,120,170,.17) 1px, transparent 1px) 0 0/22px 22px, linear-gradient(90deg, rgba(90,120,170,.17) 1px, transparent 1px) 0 0/22px 22px"],
  ["puntitos", "Puntitos", "#fffaf6", "radial-gradient(rgba(60,40,60,.24) 1.2px, transparent 1.7px) 0 0/18px 18px"],
  ["acuarela", "Acuarela", "#fffaf7", "radial-gradient(60% 42% at 18% 16%, rgba(255,179,207,.55), transparent 70%), radial-gradient(55% 40% at 86% 82%, rgba(159,211,199,.45), transparent 70%), radial-gradient(42% 32% at 78% 24%, rgba(255,217,184,.5), transparent 70%)"],
  ["pergamino", "Pergamino", "#f2dfb8", "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(120,80,30,.24)), linear-gradient(175deg, rgba(255,250,235,.5), rgba(200,160,100,.15))"],
  ["kraft", "Kraft", "#d2b07f", "radial-gradient(rgba(255,255,255,.13) 1px, transparent 1.5px) 0 0/7px 7px, radial-gradient(rgba(70,40,10,.12) 1px, transparent 1.5px) 3px 4px/9px 9px"],
  ["vichy", "Picnic", "#ffffff", "linear-gradient(90deg, rgba(224,69,127,.2) 50%, transparent 0) 0 0/28px 28px, linear-gradient(rgba(224,69,127,.2) 50%, transparent 0) 0 0/28px 28px"],
  ["corazones", "Corazoncitos", "#fff5f8", corazon("ffc4d9")],
  ["noche", "Noche estrellada", "#1b1035", "radial-gradient(1.6px 1.6px at 20px 30px, #fff, transparent) 0 0/150px 120px, radial-gradient(1px 1px at 90px 80px, rgba(255,255,255,.7), transparent) 0 0/150px 120px, radial-gradient(1.2px 1.2px at 125px 18px, rgba(255,236,200,.9), transparent) 0 0/150px 120px, linear-gradient(180deg, #1b1035, #3a1d4f)"],
  ["pizarron", "Pizarrón", "#26332d", "radial-gradient(120% 100% at 50% 35%, rgba(255,255,255,.07), transparent 70%)"],
  ["corcho", "Corcho", "#b98a5a", "radial-gradient(rgba(90,50,20,.35) 1px, transparent 1.6px) 0 0/6px 6px, radial-gradient(rgba(255,230,190,.25) 1px, transparent 1.6px) 3px 2px/8px 8px"],
  ["leopardo", "Leopardo", "#d6b48c", [roseta(0, 0, 13, 10, 86, 74), roseta(43, 37, 11, 9, 86, 74), roseta(20, 12, 9, 12, 61, 67), roseta(7, 40, 12, 8, 97, 83), mancha(5, 9, 2.6, 37, 41), mancha(11, 7, 2, 53, 29)].join(", ")],
];
const PAPEL = Object.fromEntries(PAPELES.map((p) => [p[0], p]));

/** Fondo de página para un papel (conserva la foto/HTML de fondo que hubiera). */
export function fondoDePapel(id, antes = {}) {
  const p = PAPEL[id] || PAPEL.liso;
  const f = { tipo: "color", color: p[2] };
  if (p[3]) { f.css = p[3]; f.papel = p[0]; }
  if (antes.imagen) f.imagen = antes.imagen;
  if (antes.html) f.html = antes.html;
  return f;
}
export const nombrePapel = (id) => PAPEL[id]?.[1] || "";
/** Estilo para pintar una muestra (ficha) de un papel. */
export const muestraPapel = (id) => { const p = PAPEL[id] || PAPEL.liso; return p[3] ? `${p[3]}, ${p[2]}` : p[2]; };

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
