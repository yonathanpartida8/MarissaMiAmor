/**
 * BLOQUES — secciones de página ya armadas, sobrias y profesionales (negro, grises y blanco).
 *
 * Cada bloque es un grupo de elementos normales (textos, formas, fotos,
 * botones…): se mueve junto, y con doble toque se edita cada parte. Se pone
 * en el centro de lo que se ve, en un hueco libre.
 * Añadir uno es una sola acción en el historial (un «deshacer» lo quita).
 */
import { el, seccion, aviso } from "../ui.js";
import { ico } from "../iconos.js";
import { nuevoEl, uid } from "../../core/modelo.js";
import { DIBUJOS } from "../../assets/dibujos.js";

const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Maquetas chiquitas (en grises, sólo dibujo, nada que cargar). */
const MAQUETA = {
  encabezado: '<i class="pq-t c"></i><i class="pq-t g"></i><i class="pq-l"></i><i class="pq-fila"><i class="pq-b"></i><i class="pq-b o"></i></i>',
  barra: '<i class="pq-barra"><i class="pq-t c"></i><i class="pq-links"><i></i><i></i><i></i></i><i class="pq-b mini"></i></i>',
  caracteristicas: '<i class="pq-t m"></i><i class="pq-lista"><i></i><i></i><i></i></i>',
  texto_imagen: '<i class="pq-img"></i><i class="pq-t m"></i><i class="pq-l"></i>',
  cifras: '<i class="pq-cifras"><b>98%</b><b>24/7</b><b>+5k</b></i>',
  testimonio: '<b class="pq-com">“</b><i class="pq-l"></i><i class="pq-l c"></i><i class="pq-fila"><i class="pq-av"></i><i class="pq-t c"></i></i>',
  precios: '<i class="pq-fila"><i class="pq-plan"></i><i class="pq-plan n"></i></i>',
  faq: '<i class="pq-t m"></i><i class="pq-faq"><i></i><i></i><i></i></i>',
  cta: '<i class="pq-banda"><i class="pq-t m bl"></i><i class="pq-b bl"></i></i>',
  contacto: '<i class="pq-t m"></i><i class="pq-l"></i><i class="pq-l c"></i><i class="pq-b"></i>',
  logos: '<i class="pq-t c"></i><i class="pq-logos"><i></i><i></i><i></i><i></i></i>',
  galeria: '<i class="pq-t m"></i><i class="pq-fotos"><i></i><i></i><i></i><i></i></i>',
  video: '<i class="pq-t m"></i><i class="pq-vid"></i>',
  separador: '<i class="pq-sep"></i>',
  navegacion: '<i class="pq-fila"><i class="pq-b o"></i><i class="pq-b"></i></i>',
  pie: '<i class="pq-sep"></i><i class="pq-fila"><i class="pq-t c"></i><i class="pq-links"><i></i><i></i></i></i>',
};

/** Por grupos, en el orden de una página profesional. [id, nombre, qué es] */
const GRUPOS = [
  ["Encabezado", [
    ["barra", "Barra superior", "nombre o marca, enlaces y un botón"],
    ["encabezado", "Portada", "antetítulo, título grande, texto y dos botones"],
  ]],
  ["Contenido", [
    ["caracteristicas", "Características", "tres puntos clave con su descripción"],
    ["texto_imagen", "Texto con imagen", "imagen, título, párrafo y enlace"],
    ["cifras", "Cifras", "tres números importantes con su etiqueta"],
    ["galeria", "Galería", "título y una cuadrícula de imágenes"],
    ["video", "Vídeo", "título y un vídeo"],
  ]],
  ["Confianza", [
    ["testimonio", "Testimonio", "una cita con nombre y cargo"],
    ["logos", "Logotipos", "«Con la confianza de» y cuatro logotipos"],
    ["precios", "Precios", "dos planes lado a lado"],
    ["faq", "Preguntas frecuentes", "toca cada pregunta para ver la respuesta"],
  ]],
  ["Cierre", [
    ["cta", "Llamada a la acción", "banda oscura con título y botón"],
    ["contacto", "Contacto", "correo, teléfono y botón para escribir"],
    ["separador", "Separador", "una línea fina y discreta"],
    ["navegacion", "Anterior / Siguiente", "dos botones para pasar de página"],
    ["pie", "Pie de página", "línea, derechos y enlaces"],
  ]],
];

/** Pone un bloque en la página (como grupo) centrado en lo que se ve. */
export async function ponerBloque(app, tipo) {
  const E = app.estado, A = app.acciones, L = app.lienzo, P = E.proyecto;
  if (!E.pagina) A.nuevaPagina();
  const t = P.ajustes.tema || {};
  const W = P.ajustes.ancho, Hp = P.ajustes.alto;
  const g = uid("g");
  const T = (html, x, y, w, h, op = {}) => nuevoEl("texto", P, { grupo: g, x, y, w, h, nombre: op.nombre || "Texto", texto: { html, fuente: op.fuente || t.fuente, tam: op.tam || 22, peso: op.peso || 500, cursiva: !!op.cursiva, alin: op.alin || "center", color: op.color || t.texto, interlinea: op.interlinea || 1.3, mayus: !!op.mayus, interletra: op.interletra || 0 } });
  const F = (x, y, w, h, op = {}) => nuevoEl("forma", P, { grupo: g, x, y, w, h, rot: op.rot || 0, nombre: op.nombre || "Fondo", caja: op.caja || {}, forma: { figura: op.figura || "rect", relleno: op.relleno, gradiente: op.gradiente || null, grosor: op.grosor || 0, trazo: op.trazo || "#111111" } });
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
  // (Sin colores: negro, grises y blanco, como una página profesional.)
  const NEGRO = "#111111", GRIS = "#5f6368", CLARO = "#e6e6e6", FONDO = "#f7f7f7", FUENTE = "Jost";
  const tt = (html, x, y, w, h, op = {}) => T(html, x, y, w, h, { fuente: FUENTE, color: NEGRO, ...op });
  const btn = (txt, x, y, w, accion, oscuro = true, op = {}) => B(txt, x, y, w, accion, { estilo: oscuro ? "relleno" : "borde", fondo: NEGRO, color: oscuro ? "#ffffff" : NEGRO, radio: 10, h: 48, tam: 15, peso: 600, fuente: FUENTE, ...op });
  const recetas = {
    barra: () => [
      F(0, 0, W, 64, { nombre: "Barra", relleno: "#ffffff", caja: { radio: 0, borde: { ancho: 1, color: CLARO, estilo: "solid" } } }),
      tt("Marca", m, 18, 110, 28, { nombre: "Marca", tam: 19, peso: 700, alin: "left" }),
      tt("Inicio · Servicios · Contacto", m + 112, 22, an - 112 - 104, 22, { nombre: "Enlaces", tam: 13.5, color: GRIS }),
      btn("Empezar", W - m - 96, 12, 96, "enlace", true, { h: 40, tam: 13, destino: "https://tusitio.com" }),
    ],
    encabezado: () => [
      tt("NUEVO", m, 0, an, 24, { nombre: "Antetítulo", tam: 13, peso: 600, interletra: 4, color: GRIS }),
      tt("Un título claro que explica lo que haces", m, 30, an, 120, { nombre: "Título", tam: 40, peso: 700, interlinea: 1.1 }),
      tt("Una frase corta que cuenta el beneficio principal, sin rodeos y en pocas palabras.", m + 8, 156, an - 16, 64, { nombre: "Texto", tam: 17, color: GRIS, interlinea: 1.45 }),
      btn("Empezar", m + 8, 236, (an - 32) / 2, "siguiente"),
      btn("Saber más", m + 24 + (an - 32) / 2, 236, (an - 32) / 2, "enlace", false, { destino: "https://tusitio.com" }),
    ],
    caracteristicas: () => [
      tt("Lo que ofrecemos", m, 0, an, 44, { nombre: "Título", tam: 28, peso: 700 }),
      ...[["Rápido", "Todo listo en minutos, sin pasos de más."], ["Seguro", "Tu información protegida en todo momento."], ["Cercano", "Atención real cuando la necesitas."]].flatMap(([ti, tx], i) => [
        F(m, 64 + i * 92, 44, 44, { nombre: "Ícono " + (i + 1), relleno: FONDO, caja: { radio: 10, borde: { ancho: 1, color: CLARO, estilo: "solid" } } }),
        tt(String(i + 1).padStart(2, "0"), m, 74 + i * 92, 44, 24, { nombre: "Número " + (i + 1), tam: 14, peso: 700, color: GRIS }),
        tt(ti, m + 60, 62 + i * 92, an - 60, 28, { nombre: "Punto " + (i + 1), tam: 18, peso: 600, alin: "left" }),
        tt(tx, m + 60, 90 + i * 92, an - 60, 44, { nombre: "Detalle " + (i + 1), tam: 14.5, color: GRIS, alin: "left", interlinea: 1.4 }),
      ]),
    ],
    texto_imagen: () => [
      nuevoEl("imagen", P, { grupo: g, nombre: "Imagen", x: m, y: 0, w: an, h: Math.round(an * 0.56), caja: { radio: 12 } }),
      tt("Un título para esta sección", m, Math.round(an * 0.56) + 20, an, 40, { nombre: "Título", tam: 24, peso: 700, alin: "left" }),
      tt("Cuenta aquí los detalles: qué es, para quién es y por qué importa. Dos o tres líneas bastan.", m, Math.round(an * 0.56) + 62, an, 70, { nombre: "Párrafo", tam: 15, color: GRIS, alin: "left", interlinea: 1.5 }),
      btn("Leer más →", m, Math.round(an * 0.56) + 140, 140, "enlace", false, { destino: "https://tusitio.com", h: 42, tam: 14 }),
    ],
    cifras: () => {
      const cw = an / 3;
      return [
        F(m, 0, an, 1, { nombre: "Línea", relleno: CLARO }),
        ...[["98%", "satisfacción"], ["24/7", "disponible"], ["+5k", "personas"]].flatMap(([n, l], i) => [
          tt(n, m + i * cw, 22, cw, 44, { nombre: "Cifra " + (i + 1), tam: 32, peso: 700 }),
          tt(l, m + i * cw, 68, cw, 24, { nombre: "Etiqueta " + (i + 1), tam: 13, color: GRIS, mayus: true, interletra: 1 }),
          ...(i ? [F(m + i * cw, 26, 1, 62, { nombre: "Divisor", relleno: CLARO })] : []),
        ]),
        F(m, 112, an, 1, { nombre: "Línea", relleno: CLARO }),
      ];
    },
    testimonio: () => [
      tt("“", m, 0, an, 56, { nombre: "Comillas", tam: 64, peso: 700, color: GRIS, interlinea: 1 }),
      tt("Trabajar con ellos fue sencillo y el resultado superó lo que esperábamos.", m + 10, 52, an - 20, 96, { nombre: "Cita", tam: 21, peso: 500, interlinea: 1.4 }),
      nuevoEl("imagen", P, { grupo: g, nombre: "Foto", x: W / 2 - 24, y: 160, w: 48, h: 48, imagen: { forma: "circulo" } }),
      tt("Nombre Apellido", m, 216, an, 24, { nombre: "Nombre", tam: 15, peso: 600 }),
      tt("Cargo, Empresa", m, 240, an, 22, { nombre: "Cargo", tam: 13, color: GRIS }),
    ],
    logos: () => [
      tt("CON LA CONFIANZA DE", m, 0, an, 22, { nombre: "Título", tam: 13, peso: 600, interletra: 3, color: GRIS }),
      ...[0, 1, 2, 3].flatMap((i) => { const cw = (an - 30) / 4; return [F(m + i * (cw + 10), 36, cw, 40, { nombre: "Logo " + (i + 1), relleno: FONDO, caja: { radio: 8 } }), tt("Logo", m + i * (cw + 10), 45, cw, 22, { nombre: "Nombre " + (i + 1), tam: 14, peso: 700, color: GRIS })]; }),
    ],
    precios: () => {
      const cw = (an - 14) / 2;
      return [["Básico", "$0", "Lo esencial para empezar", false], ["Pro", "$9", "Todo lo que necesitas", true]].flatMap(([n, pr, tx, os], i) => {
        const x = m + i * (cw + 14), c = os ? "#ffffff" : NEGRO, c2 = os ? "#c4c7c5" : GRIS;
        return [
          F(x, 0, cw, 250, { nombre: "Plan " + n, relleno: os ? NEGRO : "#ffffff", caja: { radio: 14, borde: { ancho: 1, color: os ? NEGRO : CLARO, estilo: "solid" } } }),
          tt(n, x + 16, 18, cw - 32, 24, { nombre: "Nombre " + n, tam: 15, peso: 600, color: c, alin: "left" }),
          tt(pr + "<small>/mes</small>", x + 16, 46, cw - 32, 46, { nombre: "Precio " + n, tam: 32, peso: 700, color: c, alin: "left" }),
          tt(tx, x + 16, 100, cw - 32, 50, { nombre: "Detalle " + n, tam: 13.5, color: c2, alin: "left", interlinea: 1.4 }),
          btn("Elegir", x + 16, 182, cw - 32, "enlace", !os, { destino: "https://tusitio.com", h: 44, ...(os ? { estilo: "relleno", fondo: "#ffffff", color: NEGRO } : {}) }),
        ];
      });
    },
    faq: () => {
      const qs = [["¿Cuánto tarda?", "Normalmente, menos de un día."], ["¿Puedo cambiarlo después?", "Sí, cuando quieras y sin costo."], ["¿Cómo los contacto?", "Por correo o desde el botón de contacto."]];
      const r = [tt("Preguntas frecuentes", m, 0, an, 44, { nombre: "Título", tam: 26, peso: 700 })];
      qs.forEach(([q, a], i) => {
        const y = 60 + i * 96;
        const resp = escondido(tt(a, m + 14, y + 52, an - 28, 36, { nombre: "Respuesta " + (i + 1), tam: 14.5, color: GRIS, alin: "left" }), "deslizar");
        r.push(B(q + "  +", m, y, an, "alternar", { destino: resp.id, estilo: "borde", fondo: CLARO, color: NEGRO, radio: 10, tam: 15, peso: 600, fuente: FUENTE }), resp);
      });
      return r;
    },
    cta: () => [
      F(0, 0, W, 230, { nombre: "Banda", relleno: NEGRO, caja: { radio: 0 } }),
      tt("¿Listo para empezar?", m, 46, an, 50, { nombre: "Título", tam: 30, peso: 700, color: "#ffffff" }),
      tt("Da el primer paso hoy.", m, 98, an, 28, { nombre: "Texto", tam: 15, color: "#c4c7c5" }),
      btn("Comenzar ahora", W / 2 - 95, 146, 190, "enlace", true, { destino: "https://tusitio.com", fondo: "#ffffff", color: NEGRO }),
    ],
    contacto: () => [
      tt("Hablemos", m, 0, an, 44, { nombre: "Título", tam: 28, peso: 700 }),
      tt("hola@tusitio.com", m, 56, an, 26, { nombre: "Correo", tam: 16 }),
      tt("+52 55 0000 0000", m, 86, an, 26, { nombre: "Teléfono", tam: 16, color: GRIS }),
      btn("Escribir", W / 2 - 80, 132, 160, "enlace", true, { destino: "mailto:hola@tusitio.com" }),
    ],
    galeria: () => [
      tt("Galería", m, 0, an, 44, { nombre: "Título", tam: 28, peso: 700 }),
      nuevoEl("album", P, { grupo: g, nombre: "Galería", x: m, y: 60, w: an, h: an }),
    ],
    video: () => [
      tt("Mira cómo funciona", m, 0, an, 44, { nombre: "Título", tam: 26, peso: 700 }),
      nuevoEl("video", P, { grupo: g, nombre: "Vídeo", x: m, y: 60, w: an, h: Math.round(an * 0.5625), video: { asset: null, modo: "auto", auto: false, bucle: false, controles: true } }),
    ],
    separador: () => [F(m, 8, an, 1, { nombre: "Línea", relleno: CLARO })],
    navegacion: () => [
      btn("Anterior", m, 0, (an - 16) / 2, "anterior", false),
      btn("Siguiente", m + (an - 16) / 2 + 16, 0, (an - 16) / 2, "siguiente"),
    ],
    pie: () => [
      F(m, 0, an, 1, { nombre: "Línea", relleno: CLARO }),
      tt("© 2026 Tu marca. Todos los derechos reservados.", m, 16, an, 22, { nombre: "Derechos", tam: 13, color: GRIS }),
      tt("Privacidad · Términos · Contacto", m, 40, an, 22, { nombre: "Enlaces", tam: 13, color: GRIS }),
    ],
  };
  const els = (recetas[tipo] || recetas.encabezado)();
  // Al centro de lo que se ve (sin salirse de la hoja).
  const alto = Math.max(...els.map((x) => x.y + x.h));
  let cy = Hp / 2;
  try { const r = L.vistaEl.getBoundingClientRect(); cy = L.aMundo(r.left + r.width / 2, r.top + r.height / 2).y; } catch (e) { /* nada */ }
  // Busca el hueco libre más cercano al centro (que no tape lo que ya hay).
  const otros = (E.pagina.els || []).filter((o) => !o.oculto && o.tipo !== "trazo" && o.tipo !== "pagina" && o.tipo !== "musica" && !(o.ancla && o.ancla.h === "estirar" && o.ancla.v === "estirar"));
  const tapa = (y) => otros.reduce((s, o) => s + Math.max(0, Math.min(y + alto, o.y + o.h) - Math.max(y, o.y)) * Math.max(0, Math.min(W, o.x + o.w) - Math.max(0, o.x)), 0);
  const ideal = tipo === "navegacion" || tipo === "pie" ? Hp - alto - 40 : tipo === "barra" ? 0 : cy - alto / 2;
  // La barra superior va pegada arriba (es de orilla a orilla).
  const tope = tipo === "barra" ? 0 : 12;
  let y0 = clamp(Math.round(ideal), tope, Math.max(tope, Hp - alto - 12)), mejor = Infinity;
  for (let y = tope; tipo !== "barra" && y <= Math.max(tope, Hp - alto - 12); y += 8) {
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
    c.append(el("p.ed-ayuda.ed-bq-intro", { text: "Secciones profesionales, en blanco y negro, para armar páginas serias. Cada parte se puede editar con doble toque." }));
    for (const [titulo, lista] of GRUPOS) c.append(seccion(titulo, [el("div.ed-bq.pro", {}, lista.map(([k, n, d]) => el("button.ed-bq-t", { type: "button", dataset: { k }, title: d, "aria-label": `${n}: ${d}`, onClick: () => ponerBloque(app, k) }, [
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
