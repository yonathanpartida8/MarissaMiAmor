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
  // Fase 41: los profesionales
  hero: '<i class="bq-banda"><i class="bq-t c bl"></i><i class="bq-t g bl"></i><i class="bq-nav"><i class="bq-b chico bl"></i><i class="bq-b chico bl"></i></i></i>',
  historia: '<i class="bq-t m"></i><i class="bq-hist"><i></i><i></i><i></i></i>',
  numeros: '<i class="bq-t m"></i><i class="bq-nums"><b>365</b><b>∞</b><b>1k</b></i>',
  enlaces: '<i class="bq-avatar"></i><i class="bq-pill"></i><i class="bq-pill"></i><i class="bq-pill"></i>',
  preguntas: '<i class="bq-t m"></i><i class="bq-faq"><i></i><i class="ab"></i><i></i></i>',
  sorpresa: '<b class="bq-regalo">🎁</b><i class="bq-b chico"></i>',
  pregunta: '<i class="bq-t m"></i><i class="bq-t c"></i><i class="bq-nav"><i class="bq-b chico"></i><i class="bq-b chico"></i></i>',
  cancion: '<i class="bq-disco"><i class="bq-vinilo"></i><i class="bq-col"><i class="bq-t m"></i><i class="bq-l c"></i><i class="bq-b chico"></i></i></i>',
  collage: '<i class="bq-mural"><i class="bq-pola"></i><i class="bq-pola"></i><i class="bq-pola"></i></i><i class="bq-t c"></i>',
  separador: '<i class="bq-sep"><i></i><b class="bq-cor">♥</b><i></i></i>',
  cierre: '<i class="bq-t g"></i><i class="bq-l c"></i><i class="bq-b"></i>',
};

/** Por grupos, del principio al final del librito. [id, nombre, qué es] */
const GRUPOS = [
  ["Para empezar", [
    ["hero", "Portada pro", "banda de color, título enorme y dos botones"],
    ["portada", "Portada", "título grande, frase y botón para empezar"],
    ["carta", "Carta", "una tarjetita con título, texto y firma"],
    ["cita", "Frase", "una frase bonita entre comillas grandes"],
    ["separador", "Separador", "una línea elegante con corazón en medio"],
  ]],
  ["Nuestra historia", [
    ["historia", "Nuestra historia", "línea del tiempo con fechas y momentos"],
    ["numeros", "Nuestros números", "tres tarjetas: días, besos y te amos"],
    ["razones", "Razones", "«Razones por las que te amo» en lista"],
    ["contador", "Contador de días", "los días desde nuestra fecha, en vivo"],
    ["cancion", "Nuestra canción", "tarjeta con disco y botón para escucharla"],
  ]],
  ["Fotos y vídeo", [
    ["collage", "Mural de fotos", "tres polaroids encimaditas con una frase"],
    ["galeria", "Galería", "título y un álbum de fotos en cuadrícula"],
    ["recuerdo", "Recuerdo", "foto polaroid con fecha y una frase"],
    ["video", "Vídeo con título", "un vídeo que empieza solo, con resplandor"],
  ]],
  ["Para tocar", [
    ["sorpresa", "Sorpresa", "un regalito que se abre al tocar el botón"],
    ["preguntas", "Preguntas", "toca cada pregunta y aparece la respuesta"],
    ["pregunta", "¿Sí o no?", "una pregunta con «Sí» y un «No» que se escapa"],
    ["enlaces", "Enlaces", "tu foto y botones a tu playlist, chat o lugar"],
    ["navegacion", "Anterior / Siguiente", "dos botones para pasar de página"],
  ]],
  ["Para terminar", [
    ["cierre", "Final", "«Fin… o apenas el comienzo» y volver a empezar"],
    ["pie", "Pie de página", "una firmita al final, con corazón"],
  ]],
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
  const F = (x, y, w, h, op = {}) => nuevoEl("forma", P, { grupo: g, x, y, w, h, rot: op.rot || 0, nombre: op.nombre || "Fondo", caja: op.caja || {}, forma: { figura: op.figura || "rect", relleno: op.relleno, gradiente: op.gradiente || null, grosor: op.grosor || 0, trazo: op.trazo || t.texto } });
  const B = (texto, x, y, w, accion, op = {}) => nuevoEl("boton", P, { grupo: g, x, y, w, h: op.h || 52, nombre: "Botón " + texto, accion: { tipo: accion, ...(op.destino ? { destino: op.destino } : {}) }, boton: { texto, estilo: op.estilo || "relleno", fuente: "Jost", tam: op.tam || 17, peso: op.peso || 500, color: op.color || "#ffffff", fondo: op.fondo || t.acento || "#d8397a", radio: op.radio ?? 999 } });
  const D = (id, x, y, w, h, color) => nuevoEl("dibujo", P, { grupo: g, nombre: "Adorno", x, y, w, h, dibujo: { svg: (DIBUJOS.find((d) => d.id === id) || DIBUJOS[0]).svg, color: color || t.acento } });
  const m = 28, an = W - m * 2;
  const ac = t.acento || "#d8397a", tinta = t.texto || "#3a2440";
  // Un tono más clarito del acento (mezclado con blanco, en hex: lo entiende cualquier teléfono).
  const suave = (c, k = 0.14) => {
    const m6 = /^#?([0-9a-f]{6})$/i.exec(String(c).trim());
    if (!m6) return c;
    return "#" + [0, 2, 4].map((i) => Math.round(parseInt(m6[1].slice(i, i + 2), 16) * k + 255 * (1 - k)).toString(16).padStart(2, "0")).join("");
  };
  /** Lo que empieza escondido (lo muestra un botón) entra con una animación. */
  const escondido = (e, anim = "rebote") => { e.inicioOculto = true; e.anim = { ...(e.anim || {}), entrada: { tipo: anim, dur: 700, retraso: 0 } }; return e; };
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
    /* ── Fase 41: bloques profesionales ── */
    hero: () => [
      F(0, 0, W, 400, { nombre: "Banda", gradiente: { a: ac, b: "#7b5cff", angulo: 150 }, caja: { radio: 0 } }),
      D("brillos", m, 24, 40, 40, "#ffffff"),
      T("NUESTRA HISTORIA", m, 70, an, 30, { nombre: "Antetítulo", fuente: "Jost", tam: 14, peso: 600, interletra: 5, color: "#ffffff" }),
      T("Tú y yo", m, 104, an, 100, { nombre: "Título", fuente: t.fuenteTitulos, tam: 76, peso: 600, color: "#ffffff", interlinea: 1.05 }),
      T("todo lo que somos, en un librito hecho a mano", m + 16, 208, an - 32, 60, { nombre: "Frase", tam: 21, cursiva: true, color: "#ffffff" }),
      B("Empezar", m + 8, 300, (an - 32) / 2, "siguiente", { fondo: "#ffffff", color: ac, peso: 600 }),
      B("♪ Música", m + 24 + (an - 32) / 2, 300, (an - 32) / 2, "musica", { estilo: "borde", fondo: "#ffffff", color: "#ffffff" }),
    ],
    historia: () => {
      const hitos = [["23 · 08 · 2025", "Nos conocimos", "y algo en mí supo que eras tú"], ["14 · 02 · 2026", "Nuestra primera cita", "nervios, risas y cero ganas de despedirnos"], ["Hoy", "Seguimos aquí", "escribiendo la mejor parte juntitos"]];
      return [
        T("Nuestra historia", m, 0, an, 56, { nombre: "Título", fuente: t.fuenteTitulos, tam: 38, peso: 600, color: ac }),
        F(m + 15, 82, 3, hitos.length * 96 - 30, { nombre: "Línea", relleno: suave(ac, 0.45), caja: { radio: 3 } }),
        ...hitos.flatMap(([f, ti, tx], i) => [
          F(m + 6, 76 + i * 96, 21, 21, { nombre: "Punto " + (i + 1), figura: "circulo", relleno: ac, grosor: 4, trazo: "#ffffff" }),
          T(f, m + 44, 70 + i * 96, an - 44, 24, { nombre: "Fecha " + (i + 1), fuente: "Jost", tam: 13, peso: 600, interletra: 2, color: ac, alin: "left", mayus: true }),
          T(ti, m + 44, 92 + i * 96, an - 44, 32, { nombre: "Momento " + (i + 1), fuente: t.fuenteTitulos, tam: 24, peso: 600, alin: "left" }),
          T(tx, m + 44, 124 + i * 96, an - 44, 30, { nombre: "Detalle " + (i + 1), tam: 17, alin: "left", color: tinta }),
        ]),
      ];
    },
    numeros: () => {
      const cw = (an - 20) / 3, datos = [["365", "días juntos"], ["∞", "te amos"], ["1,000+", "besitos"]];
      return [
        T("Nuestros números", m, 0, an, 56, { nombre: "Título", fuente: t.fuenteTitulos, tam: 36, peso: 600, color: ac }),
        ...datos.flatMap(([n, l], i) => [
          F(m + i * (cw + 10), 70, cw, 124, { nombre: "Tarjeta " + (i + 1), relleno: "#ffffff", caja: { radio: 20, sombra: { x: 0, y: 8, blur: 22, color: "rgba(120,40,80,.14)" } } }),
          T(n, m + i * (cw + 10), 90, cw, 50, { nombre: "Número " + (i + 1), fuente: t.fuenteTitulos, tam: n.length > 4 ? 30 : 40, peso: 700, color: ac, interlinea: 1.1 }),
          T(l, m + i * (cw + 10) + 6, 144, cw - 12, 36, { nombre: "Qué es " + (i + 1), fuente: "Jost", tam: 14, peso: 500, color: "#3a2440" }),
        ]),
      ];
    },
    enlaces: () => {
      const ls = [["🎧 Nuestra playlist", "https://open.spotify.com/"], ["💬 Escríbeme", "https://wa.me/"], ["📍 Nuestro lugar", "https://maps.google.com/"]];
      return [
        nuevoEl("imagen", P, { grupo: g, nombre: "Tu foto", x: W / 2 - 52, y: 0, w: 104, h: 104, imagen: { forma: "circulo" }, caja: { borde: { ancho: 4, color: ac, estilo: "solid" } } }),
        T("Tú y yo", m, 116, an, 44, { nombre: "Nombre", fuente: t.fuenteTitulos, tam: 32, peso: 600, color: ac }),
        T("lo nuestro, en un solo lugar", m, 158, an, 30, { nombre: "Frase", tam: 18, cursiva: true }),
        ...ls.map(([tx, url], i) => B(tx, m + 10, 206 + i * 64, an - 20, "enlace", { destino: url, estilo: "suave", color: tinta, fondo: ac, h: 52, radio: 16 })),
      ];
    },
    preguntas: () => {
      const qs = [["¿Desde cuándo te amo?", "Desde antes de saber tu nombre completo."], ["¿Qué es lo que más me gusta de ti?", "Todo. Pero tu risa va primero."], ["¿Hasta cuándo?", "Hasta que se acaben los «para siempre»."]];
      const r = [T("Preguntas importantes", m, 0, an, 52, { nombre: "Título", fuente: t.fuenteTitulos, tam: 34, peso: 600, color: ac }), T("toca cada pregunta ♥", m, 50, an, 26, { nombre: "Pista", fuente: "Caveat", tam: 22, color: tinta })];
      qs.forEach(([q, a], i) => {
        const y = 90 + i * 108;
        const resp = escondido(T(a, m + 14, y + 56, an - 28, 44, { nombre: "Respuesta " + (i + 1), tam: 19, cursiva: true, color: tinta }), "deslizar");
        r.push(B(q, m, y, an, "alternar", { destino: resp.id, estilo: "suave", color: tinta, fondo: ac, radio: 16, tam: 17, peso: 600 }), resp);
      });
      return r;
    },
    sorpresa: () => {
      const msg = escondido(T("Te amo más que ayer y menos que mañana 💖", m, 230, an, 80, { nombre: "Mensaje", fuente: t.fuenteTitulos, tam: 30, peso: 600, color: ac }), "rebote");
      return [
        T("Tengo algo para ti…", m, 0, an, 48, { nombre: "Título", fuente: t.fuenteTitulos, tam: 32, peso: 600, color: ac }),
        D("sobre", W / 2 - 60, 56, 120, 100),
        B("Ábrelo", W / 2 - 80, 166, 160, "mostrar", { destino: msg.id }),
        msg,
      ];
    },
    pregunta: () => {
      const si = escondido(T("¡Sabía que dirías que sí! 💖", m, 210, an, 50, { nombre: "Respuesta", fuente: "Caveat", tam: 34, color: ac }), "rebote");
      const no = B("No", m + 24 + (an - 32) / 2, 130, (an - 32) / 2, "animar", { estilo: "borde", fondo: ac, color: ac });
      // El «No» se sacude cuando lo tocas (anima a sí mismo).
      no.anim = { ...(no.anim || {}), entrada: { tipo: "rebote", dur: 600, retraso: 0 } };
      return [
        T("¿Quieres seguir escribiendo esta historia conmigo?", m, 0, an, 110, { nombre: "Pregunta", fuente: t.fuenteTitulos, tam: 30, peso: 600, color: tinta, interlinea: 1.2 }),
        B("Sí 💖", m + 8, 130, (an - 32) / 2, "mostrar", { destino: si.id }),
        no,
        si,
      ];
    },
    cancion: () => {
      const tx = m + 136, tw = an - 156;
      return [
        F(m, 0, an, 170, { nombre: "Tarjeta", relleno: "#241b2b", caja: { radio: 24, sombra: { x: 0, y: 12, blur: 30, color: "rgba(40,10,40,.3)" } } }),
        F(m + 18, 33, 104, 104, { nombre: "Disco", figura: "circulo", relleno: "#120c16", grosor: 6, trazo: "#3a2c42" }),
        F(m + 55, 70, 30, 30, { nombre: "Centro del disco", figura: "circulo", relleno: ac }),
        T("NUESTRA CANCIÓN", tx, 24, tw, 22, { nombre: "Antetítulo", fuente: "Jost", tam: 13, peso: 600, interletra: 2, color: suave(ac, 0.7), alin: "left" }),
        T("La que suena cuando pienso en ti", tx, 46, tw, 56, { nombre: "Canción", fuente: t.fuenteTitulos, tam: 20, peso: 600, color: "#ffffff", alin: "left", interlinea: 1.15 }),
        B("▶ Escuchar", tx, 112, Math.min(150, tw), "musica", { h: 40, tam: 15, peso: 600 }),
      ];
    },
    collage: () => [
      nuevoEl("imagen", P, { grupo: g, nombre: "Foto 1", x: m, y: 18, w: 150, h: 172, rot: -7, imagen: { marco: "polaroid" } }),
      nuevoEl("imagen", P, { grupo: g, nombre: "Foto 2", x: W - m - 150, y: 0, w: 150, h: 172, rot: 6, imagen: { marco: "polaroid" } }),
      nuevoEl("imagen", P, { grupo: g, nombre: "Foto 3", x: W / 2 - 78, y: 120, w: 156, h: 178, rot: -2, imagen: { marco: "polaroid" } }),
      T("pedacitos de nosotros", m, 314, an, 46, { nombre: "Frase", fuente: "Caveat", tam: 32, color: ac }),
    ],
    separador: () => [
      F(m + 10, 15, an / 2 - 40, 2, { nombre: "Línea", relleno: suave(ac, 0.5), caja: { radio: 2 } }),
      D("corazon", W / 2 - 13, 2, 26, 26),
      F(W / 2 + 30, 15, an / 2 - 40, 2, { nombre: "Línea", relleno: suave(ac, 0.5), caja: { radio: 2 } }),
    ],
    cierre: () => [
      T("Fin…", m, 0, an, 80, { nombre: "Título", fuente: t.fuenteTitulos, tam: 64, peso: 600, color: ac }),
      T("o apenas el comienzo", m, 82, an, 44, { nombre: "Frase", fuente: "Caveat", tam: 32 }),
      B("↺ Volver a empezar", W / 2 - 110, 150, 220, "inicio", { estilo: "borde", fondo: ac, color: ac }),
    ],
  };
  const els = (recetas[tipo] || recetas.portada)();
  // Al centro de lo que se ve (sin salirse de la hoja).
  const alto = Math.max(...els.map((x) => x.y + x.h));
  let cy = Hp / 2;
  try { const r = L.vistaEl.getBoundingClientRect(); cy = L.aMundo(r.left + r.width / 2, r.top + r.height / 2).y; } catch (e) { /* nada */ }
  // Busca el hueco libre más cercano al centro (que no tape lo que ya hay).
  const otros = (E.pagina.els || []).filter((o) => !o.oculto && o.tipo !== "trazo" && o.tipo !== "pagina" && o.tipo !== "musica" && !(o.ancla && o.ancla.h === "estirar" && o.ancla.v === "estirar"));
  const tapa = (y) => otros.reduce((s, o) => s + Math.max(0, Math.min(y + alto, o.y + o.h) - Math.max(y, o.y)) * Math.max(0, Math.min(W, o.x + o.w) - Math.max(0, o.x)), 0);
  const ideal = tipo === "navegacion" || tipo === "pie" || tipo === "cierre" ? Hp - alto - 40 : tipo === "hero" ? 0 : cy - alto / 2;
  // La portada pro va pegada arriba (su banda es de orilla a orilla).
  const tope = tipo === "hero" ? 0 : 12;
  let y0 = clamp(Math.round(ideal), tope, Math.max(tope, Hp - alto - 12)), mejor = Infinity;
  for (let y = tope; tipo !== "hero" && y <= Math.max(tope, Hp - alto - 12); y += 8) {
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
    for (const [titulo, lista] of GRUPOS) c.append(seccion(titulo, [el("div.ed-bq", {}, lista.map(([k, n, d]) => el("button.ed-bq-t", { type: "button", title: d, "aria-label": `${n}: ${d}`, onClick: () => ponerBloque(app, k) }, [
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
