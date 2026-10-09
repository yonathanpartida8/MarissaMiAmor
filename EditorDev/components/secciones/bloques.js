/**
 * BLOQUES — secciones de página ya armadas, para construir rápido y bonito.
 *
 * Cada bloque es un grupo de elementos normales (textos, formas, fotos,
 * botones…): se mueve junto, y con doble toque se edita cada parte. Se pone
 * en el centro de lo que se ve, con el tema (letras y colores) del librito.
 * Añadir uno es una sola acción en el historial (un «deshacer» lo quita).
 */
import { el, seccion, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import { nuevoEl, uid } from "../../core/modelo.js";
import { DIBUJOS } from "../../assets/dibujos.js";
import { catalogo } from "../../componentes/catalogo.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Maquetas chiquitas para las fichas (sólo dibujo, nada que cargar). */
const MAQUETA = {
  portada: '<i class="bq-t g"></i><i class="bq-t m"></i><i class="bq-b"></i>',
  carta: '<i class="bq-caja"><i class="bq-t m"></i><i class="bq-l"></i><i class="bq-l"></i><i class="bq-l c"></i></i>',
  galeria: '<i class="bq-t m"></i><i class="bq-fotos"><i></i><i></i><i></i><i></i></i>',
  recuerdo: '<i class="bq-pola"></i><i class="bq-t c"></i><i class="bq-l c"></i>',
  cita: '<b class="bq-com">“</b><i class="bq-l"></i><i class="bq-l c"></i><i class="bq-t c"></i>',
  razones: '<i class="bq-t m"></i><i class="bq-li"></i><i class="bq-li"></i><i class="bq-li"></i>',
  navegacion: '<i class="bq-nav"><i class="bq-b chico"></i><i class="bq-b chico"></i></i>',
  video: '<i class="bq-t m"></i><i class="bq-vid"></i>',
  contador: '<i class="bq-t c"></i><b class="bq-num">365</b><i class="bq-l c"></i>',
  pie: '<i class="bq-l c"></i><b class="bq-cor">♥</b>',
};

const LISTA = [
  ["portada", "Portada", "título grande, frase y botón para empezar"],
  ["carta", "Carta", "una tarjetita con título, texto y firma"],
  ["galeria", "Galería", "título y un álbum de fotos en cuadrícula"],
  ["recuerdo", "Recuerdo", "foto polaroid con fecha y una frase"],
  ["cita", "Frase", "una frase bonita entre comillas grandes"],
  ["razones", "Razones", "«Razones por las que te amo» en lista"],
  ["video", "Vídeo con título", "un vídeo que empieza solo, con resplandor"],
  ["contador", "Contador de días", "los días desde nuestra fecha, en vivo"],
  ["navegacion", "Anterior / Siguiente", "dos botones para pasar de página"],
  ["pie", "Pie de página", "una firmita al final, con corazón"],
];

/** Pone un bloque en la página (como grupo) centrado en lo que se ve. */
export async function ponerBloque(app, tipo) {
  const E = app.estado, A = app.acciones, L = app.lienzo, P = E.proyecto;
  if (!E.pagina) A.nuevaPagina();
  if (tipo === "contador") {
    const cat = await catalogo();
    const it = cat.categorias.flatMap((g) => g.items).find((x) => x.id === "elementos/contador-de-dias.html");
    if (it) { await A.componente(it); return; }
    aviso("No encontré assets/elementos/contador-de-dias.html");
    return;
  }
  const t = P.ajustes.tema || {};
  const W = P.ajustes.ancho, Hp = P.ajustes.alto;
  const g = uid("g");
  const T = (html, x, y, w, h, op = {}) => nuevoEl("texto", P, { grupo: g, x, y, w, h, nombre: op.nombre || "Texto", texto: { html, fuente: op.fuente || t.fuente, tam: op.tam || 22, peso: op.peso || 500, cursiva: !!op.cursiva, alin: op.alin || "center", color: op.color || t.texto, interlinea: op.interlinea || 1.3, mayus: !!op.mayus, interletra: op.interletra || 0 } });
  const F = (x, y, w, h, op = {}) => nuevoEl("forma", P, { grupo: g, x, y, w, h, rot: op.rot || 0, nombre: op.nombre || "Fondo", caja: op.caja || {}, forma: { figura: op.figura || "rect", relleno: op.relleno, grosor: op.grosor || 0, trazo: op.trazo || t.texto } });
  const B = (texto, x, y, w, accion, op = {}) => nuevoEl("boton", P, { grupo: g, x, y, w, h: 52, nombre: "Botón " + texto, accion: { tipo: accion }, boton: { texto, estilo: op.estilo || "relleno", fuente: "Jost", tam: 17, peso: 500, color: op.color || "#ffffff", fondo: op.fondo || t.acento || "#d8397a", radio: 999 } });
  const D = (id, x, y, w, h, color) => nuevoEl("dibujo", P, { grupo: g, nombre: "Adorno", x, y, w, h, dibujo: { svg: (DIBUJOS.find((d) => d.id === id) || DIBUJOS[0]).svg, color: color || t.acento } });
  const m = 28, an = W - m * 2;
  const recetas = {
    portada: () => [
      D("corazon", W / 2 - 22, 0, 44, 44),
      T("Para ti", m, 56, an, 90, { nombre: "Título", fuente: t.fuenteTitulos, tam: 64, peso: 600, color: t.acento }),
      T("un librito hecho a mano, con todo mi amor", m + 20, 150, an - 40, 60, { nombre: "Frase", tam: 22, cursiva: true }),
      B("Empezar", W / 2 - 90, 236, 180, "siguiente"),
    ],
    carta: () => [
      F(m, 0, an, 330, { nombre: "Carta", relleno: "#fffaf6", caja: { radio: 22, borde: { ancho: 2, color: "#f2b6cc", estilo: "dashed" }, sombra: { x: 0, y: 10, blur: 26, color: "rgba(120,40,80,.18)" } } }),
      T("Mi amor:", m + 24, 26, an - 48, 50, { nombre: "Título", fuente: t.fuenteTitulos, tam: 36, peso: 600, color: t.acento, alin: "left" }),
      T("Escribe aquí tu carta. Lo que sientes, lo que extrañas, lo que sueñas para los dos. Aunque estemos lejos, te amo cada día más.", m + 24, 84, an - 48, 170, { nombre: "Carta", tam: 20, alin: "left", interlinea: 1.5 }),
      T("— tuyo, siempre", m + 24, 262, an - 48, 44, { nombre: "Firma", fuente: "Caveat", tam: 30, color: t.acento, alin: "right" }),
    ],
    galeria: () => [
      T("Nuestros momentos", m, 0, an, 56, { nombre: "Título", fuente: t.fuenteTitulos, tam: 38, peso: 600, color: t.acento }),
      nuevoEl("album", P, { grupo: g, nombre: "Galería", x: m, y: 70, w: an, h: an }),
    ],
    recuerdo: () => [
      nuevoEl("imagen", P, { grupo: g, nombre: "Foto", x: W / 2 - 120, y: 0, w: 240, h: 270, rot: -2, imagen: { marco: "polaroid" } }),
      T("23 · 08 · 2025", m, 290, an, 40, { nombre: "Fecha", fuente: "Jost", tam: 16, peso: 600, interletra: 3, color: t.acento }),
      T("el día que todo empezó", m, 330, an, 50, { nombre: "Frase", fuente: "Caveat", tam: 30 }),
    ],
    cita: () => [
      T("“", W / 2 - 40, 0, 80, 90, { nombre: "Comillas", fuente: t.fuenteTitulos, tam: 110, color: t.acento, interlinea: 1 }),
      T("Contigo, hasta la distancia se siente cerquita.", m + 10, 80, an - 20, 120, { nombre: "Frase", fuente: t.fuenteTitulos, tam: 32, cursiva: true, interlinea: 1.3 }),
      T("— nosotros", m, 210, an, 40, { nombre: "Autor", fuente: "Jost", tam: 16, peso: 600, interletra: 2, color: t.acento, mayus: true }),
    ],
    razones: () => [
      T("Razones por las que te amo", m, 0, an, 60, { nombre: "Título", fuente: t.fuenteTitulos, tam: 34, peso: 600, color: t.acento }),
      ...["Tu risa, que me arregla el día", "Cómo me cuidas aunque estés lejos", "Que contigo todo es más bonito"].flatMap((r, i) => [
        D("corazon", m + 6, 80 + i * 66, 26, 26),
        T(r, m + 44, 74 + i * 66, an - 50, 46, { nombre: "Razón " + (i + 1), tam: 21, alin: "left" }),
      ]),
    ],
    video: () => [
      T("Para que me veas", m, 0, an, 56, { nombre: "Título", fuente: t.fuenteTitulos, tam: 36, peso: 600, color: t.acento }),
      nuevoEl("video", P, { grupo: g, nombre: "Vídeo", x: m, y: 70, w: an, h: Math.round(an * 0.62), video: { asset: null, modo: "auto", auto: true, bucle: true, controles: true, ambiente: 0.75, epico: true } }),
    ],
    navegacion: () => [
      B("Anterior", m, 0, (an - 16) / 2, "anterior", { estilo: "borde", color: t.acento, fondo: t.acento }),
      B("Siguiente", m + (an - 16) / 2 + 16, 0, (an - 16) / 2, "siguiente"),
    ],
    pie: () => [
      T("hecho con amor, para ti", m, 0, an, 40, { nombre: "Pie", fuente: "Caveat", tam: 26 }),
      D("corazon", W / 2 - 13, 44, 26, 26),
    ],
  };
  const els = (recetas[tipo] || recetas.portada)();
  // Al centro de lo que se ve (sin salirse de la hoja).
  const alto = Math.max(...els.map((x) => x.y + x.h));
  let cy = Hp / 2;
  try { const r = L.vistaEl.getBoundingClientRect(); cy = L.aMundo(r.left + r.width / 2, r.top + r.height / 2).y; } catch (e) { /* nada */ }
  // Busca el hueco libre más cercano al centro (que no tape lo que ya hay).
  const otros = (E.pagina.els || []).filter((o) => !o.oculto && o.tipo !== "trazo" && o.tipo !== "pagina" && !(o.ancla && o.ancla.h === "estirar" && o.ancla.v === "estirar"));
  const tapa = (y) => otros.reduce((s, o) => s + Math.max(0, Math.min(y + alto, o.y + o.h) - Math.max(y, o.y)) * Math.max(0, Math.min(W, o.x + o.w) - Math.max(0, o.x)), 0);
  const ideal = tipo === "navegacion" || tipo === "pie" ? Hp - alto - 40 : cy - alto / 2;
  let y0 = clamp(Math.round(ideal), 12, Math.max(12, Hp - alto - 12)), mejor = Infinity;
  for (let y = 12; y <= Math.max(12, Hp - alto - 12); y += 8) {
    const costo = tapa(y) + Math.abs(y - ideal) * 2;
    if (costo < mejor) { mejor = costo; y0 = y; }
  }
  for (const x of els) x.y += y0;
  E.transaccion("Añadir bloque", () => { for (const x of els) E.agregarEl(x, null, E.paginaId, false); });
  E.seleccionar(els.map((x) => x.id));
  app.alAnadir?.();
  app.sonidos?.sonar?.("soltar");
  aviso("Bloque listo: doble toque en una parte para editarla", 2200);
}

export const BLOQUES = {
  _bloques(c) {
    const app = this.app;
    c.append(el("p.ed-ayuda.ed-bq-intro", { text: "Secciones ya armadas para construir tu página rápido. Se ponen con tus letras y colores, y cada parte se puede editar." }));
    c.append(seccion("Bloques", [el("div.ed-bq", {}, LISTA.map(([k, n, d]) => el("button.ed-bq-t", { type: "button", title: d, "aria-label": `${n}: ${d}`, onClick: () => ponerBloque(app, k) }, [
      el("span.ed-bq-maq", { html: MAQUETA[k] }),
      el("b", { text: n }),
      el("small", { text: d }),
    ])))]));
    c.append(el("div.ed-botonera", {}, [
      el("button.ed-btn.chico", { type: "button", html: I("biblioteca", "Más en Recursos"), onClick: () => app.abrirSeccion("componentes") }),
      el("button.ed-btn.chico", { type: "button", html: I("paginas", "Plantillas de página"), onClick: () => app.abrirSeccion("paginas") }),
    ]));
  },
};
