/**
 * MENSAJITOS — el chat de los dos (Fases 30 y 31), dentro de Detallitos.
 *
 *   · como la foto: arriba su foto con un corazón, «Mensajitos ♡», «con Maru ♡» y «Siempre juntos ∞»,
 *     videollamada, llamada (todavía no: «Ay ora jeje») y ⋮ (ajustes y privacidad); el fondo rosita con
 *     corazoncitos dibujados a mano; tus burbujas rosas con su hora y ✓✓ (rosas cuando ya lo vio), las
 *     suyas blancas con la hora adentro; abajo los ánimos (Happy, Sad, Hot, Hormonal: todavía no hacen
 *     nada) y la barra: + (las cositas), escribir con 🙂, stickers, GIF y 🎤 (que se vuelve «mandar»)
 *   · stickers cute (y nada de stickers viejitos): tocar uno lo manda solito; mantenerlo y arrastrarlo
 *     lo PEGA donde lo sueltes, en cualquier parte del chat, y tu amorcito lo ve ahí mismo. Los tuyos
 *     se pueden volver a arrastrar, o soltar en el botecito para quitarlos
 *   · dibujar en el chat con el dedo: se ve EN VIVO del otro lado (mientras dibujas), con colores y
 *     grosores, deshacer, y «+ Espacio» para tener más lugar abajo sin mandar ningún mensaje
 *   · todo llega al instante: el chat se queda esperando al servidor (hasta 22 s) y contesta en cuanto
 *     cambia algo; con un servidor viejo, pregunta cada 2.5 s
 *   · tocar un mensajito: reaccionar a lo suyo (con su fiesta), copiar o borrar lo tuyo
 *   · todo lo que escriben se pone como TEXTO, nunca como HTML
 */
import { el, aviso, confirmar, debounce } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as G from "../integraciones/giphy.js";
import * as PF from "./perfil.js";
import { REACCIONES, reaccion, svgReaccion, estallido } from "./reacciones.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { vibrar } from "../config/preferencias.js";

export const ICONO_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6c-5 0-9 3.3-9 7.4 0 2.3 1.3 4.4 3.4 5.8l-.8 3.6 3.9-2.1c.8.2 1.6.3 2.5.3 5 0 9-3.3 9-7.4S17 3.6 12 3.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 13.8s-2.8-1.6-3.4-3.3c-.4-1.3.4-2.5 1.6-2.5.8 0 1.4.5 1.8 1.1.4-.6 1-1.1 1.8-1.1 1.2 0 2 1.2 1.6 2.5-.6 1.7-3.4 3.3-3.4 3.3z" fill="currentColor"/></svg>';
const svg = (cuerpo, extra = "", vb = "0 0 24 24") => `<svg viewBox="${vb}" aria-hidden="true"${extra}>${cuerpo}</svg>`;
const LINEA = ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const CORAZON = "M12 20.3s-7.6-4.6-8.8-9.7C2.4 7.2 4.6 4.6 7.6 4.6c1.9 0 3.3 1.1 4.4 2.7 1.1-1.6 2.5-2.7 4.4-2.7 3 0 5.2 2.6 4.4 6-1.2 5.1-8.8 9.7-8.8 9.7z";
const IC = {
  video: svg('<rect x="2.6" y="6.2" width="12.6" height="11.6" rx="3.2"/><path d="m15.2 10.4 5.2-3v9.2l-5.2-3"/>', LINEA),
  tel: svg('<path d="M6.7 3.6h2.5l1.4 4-2 1.5a12.2 12.2 0 0 0 6.3 6.3l1.5-2 4 1.4v2.5a2 2 0 0 1-2.2 2A17.4 17.4 0 0 1 4.7 5.8a2 2 0 0 1 2-2.2z"/>', LINEA),
  puntos: svg('<circle cx="12" cy="5.6" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="18.4" r="1.9"/>', ' fill="currentColor"'),
  mas: svg('<path d="M12 5v14M5 12h14"/>', ' fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"'),
  carita: svg('<circle cx="12" cy="12" r="8.6"/><path d="M8.6 14.2c.9 1.3 2 1.9 3.4 1.9s2.5-.6 3.4-1.9"/><path d="M9.2 9.6v.8M14.8 9.6v.8"/>', LINEA),
  gato: svg('<path d="M5.3 9.6 4.8 4.6l3.8 2.6a8.8 8.8 0 0 1 6.8 0l3.8-2.6-.5 5A7.3 7.3 0 0 1 20 13.2c0 3.8-3.6 6.3-8 6.3s-8-2.5-8-6.3a7.3 7.3 0 0 1 1.3-3.6z"/><path d="M8.8 12.8q.8-.9 1.6 0M13.6 12.8q.8-.9 1.6 0M11 15.4q1 .7 2 0"/>', LINEA) ,
  mic: svg('<rect x="9" y="3.2" width="6" height="11" rx="3"/><path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6V21"/>', LINEA),
  enviar: svg('<path d="M3.6 10.9 19.4 4.3c.9-.4 1.8.5 1.4 1.4l-6.6 15.8c-.4.9-1.7.8-1.9-.1l-1.5-6.2-6.2-1.5c-.9-.2-1-1.5-.1-1.9z" fill="currentColor"/><path d="m11 13 4.2-4.2" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>'),
  lapiz: svg('<path d="m4 20 1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z"/><path d="m13.8 7 3.2 3.2"/>', LINEA),
  espacio: svg('<path d="M5 4.5h14M5 19.5h14M12 8v8M8.8 12.8 12 16l3.2-3.2"/>', LINEA),
  corazon: svg(`<path d="${CORAZON}"/>`, LINEA),
  lleno: svg(`<path d="${CORAZON}"/>`, ' fill="currentColor"'),
  infinito: svg('<path d="M12 12c-2-2.6-3.4-3.8-5.2-3.8a3.8 3.8 0 0 0 0 7.6c1.8 0 3.2-1.2 5.2-3.8zm0 0c2 2.6 3.4 3.8 5.2 3.8a3.8 3.8 0 0 0 0-7.6c-1.8 0-3.2 1.2-5.2 3.8z"/>', LINEA),
  check: svg('<path d="M1.6 10.6 5 14l6.6-7.2M8.2 13.4l.6.6 6.6-7.2"/>', LINEA, "0 0 17 20"),
  bote: svg('<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8L17.5 7M10 10.5v6.5M14 10.5v6.5"/>', LINEA),
  brillo: svg('<path d="M12 3.5c.6 3.6 1.9 4.9 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.6 4.9-1.9 5.5-5.5zM18.5 14.5c.3 1.6.8 2.1 2.4 2.4-1.6.3-2.1.8-2.4 2.4-.3-1.6-.8-2.1-2.4-2.4 1.6-.3 2.1-.8 2.4-2.4z"/>', ' fill="currentColor"'),
};
// Los ánimos (Happy, Sad, Hot, Hormonal): por ahora sólo se ven lindos y rebotan.
const NUBE = "M11 30h19a6.5 6.5 0 0 0 .8-13A9 9 0 0 0 13.3 15 7.6 7.6 0 0 0 11 30z";
const ANIMOS = [
  { id: "happy", t: "Happy", s: svg(`<path d="${NUBE}" fill="#fff" stroke="#ec7aa6" stroke-width="1.8"/><path d="M15.4 22.6q1.3-1.6 2.6 0M22.4 22.6q1.3-1.6 2.6 0M18.4 25.4q1.6 1.4 3.2 0" fill="none" stroke="#8f3a5e" stroke-width="1.5" stroke-linecap="round"/><circle cx="14.2" cy="25.2" r="1.5" fill="#ff9cc0" opacity=".75"/><circle cx="26.4" cy="25.2" r="1.5" fill="#ff9cc0" opacity=".75"/><path d="M33.5 6.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM6.5 9l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#f2a5c4"/>`, "", "0 0 40 40") },
  { id: "sad", t: "Sad", s: svg(`<path d="${NUBE}" fill="#f3eeff" stroke="#a88ce8" stroke-width="1.8"/><path d="M15.4 21.6q1.3 1.1 2.6 0M22.4 21.6q1.3 1.1 2.6 0M18.4 26.2q1.6-1.3 3.2 0" fill="none" stroke="#6b4fa8" stroke-width="1.5" stroke-linecap="round"/><path d="M29 27.6c1 1.4 1.5 2.3 1.5 3a1.5 1.5 0 0 1-3 0c0-.7.5-1.6 1.5-3z" fill="#7aa7ff"/><path d="M34 8l.6 1.4 1.4.6-1.4.6L34 12l-.6-1.4L32 10l1.4-.6z" fill="#c9b6ff"/>`, "", "0 0 40 40") },
  { id: "hot", t: "Hot", s: svg(`<defs><linearGradient id="chLlama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4f86"/><stop offset="1" stop-color="#ffb06a"/></linearGradient></defs><path d="M20 4c1.6 5 9.6 8.6 9.6 17A9.6 9.6 0 0 1 20 30.6 9.6 9.6 0 0 1 10.4 21c0-4.4 2.4-7.4 4.6-9 0 3 1.4 5 3.2 5.8-.8-5.2.6-10.4 1.8-13.8z" fill="url(#chLlama)"/><path d="M20 15c.9 2.6 4.6 4.4 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-2 1.1-3.5 2.2-4.3.1 1.4.7 2.3 1.5 2.7-.3-2.5.3-4.9.9-6.8z" fill="#ffd2a8" opacity=".75"/><circle cx="17.6" cy="23.6" r="1.1" fill="#7a2140"/><circle cx="22.4" cy="23.6" r="1.1" fill="#7a2140"/><path d="M18.9 26q1.1.9 2.2 0" fill="none" stroke="#7a2140" stroke-width="1.2" stroke-linecap="round"/>`, "", "0 0 40 34") },
  { id: "hormonal", t: "Hormonal", s: svg(`<path d="M12.6 10.6 11 5.4l4.4 3.4M27.4 10.6 29 5.4l-4.4 3.4" fill="#ff5f8f" stroke="#ff5f8f" stroke-width="1.2" stroke-linejoin="round"/><path d="M10.4 15 9.6 8.8l5.6 3.6a10.6 10.6 0 0 1 9.6 0l5.6-3.6-.8 6.2a10.4 10.4 0 0 1 1.9 6c0 5.8-5.1 9.6-11.5 9.6S8.5 26.8 8.5 21a10.4 10.4 0 0 1 1.9-6z" fill="#ffd9e8" stroke="#ec7aa6" stroke-width="1.6"/><path d="M14.8 20.6q1.4-1.4 2.8 0M22.4 20.6q1.4-1.4 2.8 0M18.2 24.2q1.8 1.5 3.6 0" fill="none" stroke="#8f3a5e" stroke-width="1.5" stroke-linecap="round"/><path d="M29.6 33s-3.2-1.9-3.2-4a1.7 1.7 0 0 1 3.2-.9 1.7 1.7 0 0 1 3.2.9c0 2.1-3.2 4-3.2 4z" fill="#ff4d88"/>`, "", "0 0 40 36") },
];
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const SEGUIDOS = 4 * 60 * 1000;
// Stickers cute de verdad (y nada de los viejitos): sus etiquetas buscan lo más tierno de GIPHY.
const ETIQUETAS = {
  stickers: [["Milk & Mocha", "milk and mocha"], ["Bubu Dudu", "bubu dudu"], ["Mochi", "mochi cat"], ["Ositos", "cute bear love"], ["Gatitos", "kawaii cat"], ["Corazones", "kawaii heart"], ["Besitos", "cute kiss"], ["Abrazos", "cute hug"]],
  gifs: [["Te amo", "te amo"], ["Te extraño", "te extraño"], ["Abrazo", "cute hug"], ["Beso", "cute kiss"], ["Buenas noches", "buenas noches"], ["Jaja", "jaja"], ["Cute", "cute love"]],
};
const EMOJIS = "🥰 😍 😘 🥺 🥹 😊 🤭 😳 😂 😭 😴 😇 😈 🙈 🤗 🫶 🤍 💗 💖 💕 💞 💘 💝 💌 ❤️‍🔥 💋 ✨ 🌸 🌷 🌹 🦋 🎀 🧸 🐻 🐱 🐰 🍓 🍰 🍫 ☕ 🌙 ⭐ 🌈 🔥 🎁 👀 🙃".split(" ");
const PRIMEROS = ["Te amo 🤍", "Te extraño 🥺", "¿Cómo amaneciste, mi amor?", "Buenas noches, mi vida 🌙"];
const COLORES = ["#ff5f9e", "#b48cff", "#6fb6ff", "#5fd3a7", "#ffb04d", "#e0325f"];
const GROSORES = [3, 6, 11];
const NUEVOS_DESDE = 2018; // los stickers subidos antes se ven viejitos: no salen

/* — Ajustes de este aparato (los de privacidad viven en el servidor) — */
const CLAVE = "editordev:chat";
const BASE = { sonidos: true, teclado: true, avisos: true, fondo: true, grande: false };
export function prefChat() {
  try { return { ...BASE, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; } catch (e) { return { ...BASE }; }
}
const guardarPref = (p) => { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch (e) { /* sin guardar */ } };

const real = (m) => typeof m.id === "number";
const orden = (a, b) => (real(a) ? 0 : 1) - (real(b) ? 0 : 1) || (real(a) && real(b) ? a.id - b.id : 0);
const firmaBurbuja = (m) => JSON.stringify([m.texto, m.gif?.u, m.espacio, (m.stickers || []).filter((s) => !s.l).length]);
const firma = (m) => JSON.stringify([m.texto, m.gif?.u, m.reaccion, m.visto, m.espacio, (m.stickers || []).map((s) => [s.i, s.x, s.y, s.s])]);
const diaDe = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const hora = (iso) => new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
function nombreDia(iso) {
  const d = new Date(iso), h = new Date();
  const n = Math.round((new Date(h.getFullYear(), h.getMonth(), h.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (n === 0) return "Hoy";
  if (n === 1) return "Ayer";
  const t = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", ...(d.getFullYear() !== h.getFullYear() ? { year: "numeric" } : {}) });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function soloEmoji(t) {
  const s = (t || "").replace(/\s/g, "");
  if (!s || s.length > 24 || /^[\d#*]+$/.test(s) || !/^[\p{Extended_Pictographic}\p{Emoji_Component}‍️]+$/u.test(s)) return false;
  return ("Segmenter" in Intl ? [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(s)].length : [...s].length) <= 3;
}
const juntos = (a, b) => !!(a && b && !a.espacio && !b.espacio && a.mio === b.mio && diaDe(a.creado) === diaDe(b.creado) && Math.abs(new Date(b.creado) - new Date(a.creado)) < SEGUIDOS);
const mensajeError = (e) => (e?.status === 404 ? `Tu ${SRV.NOMBRE} todavía no sabe hacer esto: actualízalo («librito actualizar»).` : e?.message || "No se pudo.");
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
/** Un trazo suave (curvas entre los puntos medios). */
function camino(pts) {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}l.01 0`;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) d += `Q${pts[i][0]} ${pts[i][1]} ${(pts[i][0] + pts[i + 1][0]) / 2} ${(pts[i][1] + pts[i + 1][1]) / 2}`;
  const u = pts[pts.length - 1];
  return d + `L${u[0]} ${u[1]}`;
}
/** El fondo: corazoncitos dibujados a mano y «Tú y yo siempre». */
function fondoDibujado() {
  const c = (x, y, t, r, o = 1) => el("i.ch-doodle", { style: { left: x, top: y, width: t + "px", height: t + "px", transform: `rotate(${r}deg)`, opacity: o }, html: IC.corazon });
  return el("div.ch-fondo", { "aria-hidden": "true" }, [
    c("4%", "6%", 46, -12), c("11%", "31%", 34, 8, 0.8), c("82%", "4%", 22, 10, 0.7), c("78%", "47%", 52, 14), c("6%", "74%", 40, -8, 0.85),
    c("44%", "1.5%", 16, -6, 0.6), c("60%", "88%", 20, 12, 0.6), c("90%", "70%", 18, -14, 0.6),
    el("i.ch-doodle.brillo", { style: { left: "49%", top: "80%" }, html: IC.brillo }),
    el("i.ch-garabato", { html: '<svg viewBox="0 0 100 46" preserveAspectRatio="none"><path d="M2 40 C 40 34, 70 18, 98 6"/></svg>' }),
    el("span.ch-letrero", {}, [el("span", { text: "Tú" }), el("span", { text: "y yo" }), el("span", { text: "siempre" }), el("i", { html: IC.corazon })]),
  ]);
}

/** La pantalla del chat. `det` es Detallitos (su capa, su app, su amorcito y sus limpiezas). */
export function vistaChat(det) {
  const app = det.app, son = app.sonidos;
  const pa = det.amor?.pareja, nombre = PF.nombreDe(pa) || "tu amorcito";
  const PR = prefChat();
  const sonar = (n) => { if (PR.sonidos) son?.sonar(n); };
  const S = {
    ms: [], nodos: new Map(), dias: new Map(), nuevos: new Set(), trazos: new Map(), ultimo: 0, desde: 0, hayMas: false, antes: false,
    vivo: true, pegado: true, sinVer: 0, temp: 0, menu: null, hoja: null, listo: false, verVisto: true, dibujo: null, arrastre: null,
  };
  const capaDet = det.capa;
  const flota = (n) => { capaDet.append(n); return n; }; // lo que va encima (menús, el sticker que arrastras): fuera de lo que se anima

  /* — Arriba — */
  const atras = el("button.ch-cab-b.ch-atras", { type: "button", "aria-label": "Atrás", html: ico("izquierda"), onClick: () => det.atras() });
  const ahoraNo = (b) => { aviso("Ay ora jeje", 2600); if (!reducido()) b.animate([{ transform: "rotate(0)" }, { transform: "rotate(-12deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(0)" }], { duration: 480 }); };
  const bVideo = el("button.ch-cab-b", { type: "button", "aria-label": "Videollamada", html: IC.video, onClick: () => ahoraNo(bVideo) });
  const bTel = el("button.ch-cab-b", { type: "button", "aria-label": "Llamar", html: IC.tel, onClick: () => ahoraNo(bTel) });
  const bPuntos = el("button.ch-cab-b", { type: "button", "aria-label": "Ajustes y privacidad del chat", "aria-haspopup": "menu", html: IC.puntos, onClick: () => hojaAjustes() });
  const cab = el("header.ch-cab", {}, [
    atras,
    el("span.ch-cab-foto", {}, [pa ? PF.avatar("pareja", "ch-cab-av") : el("span.av.ch-cab-av"), el("i", { html: IC.lleno })]),
    el("div.ch-cab-t", {}, [
      el("b", {}, [el("span", { text: "Mensajitos" }), el("i", { html: IC.corazon })]),
      el("small", {}, [el("span", { text: `con ${nombre}` }), el("i", { html: IC.corazon })]),
    ]),
    el("div.ch-cab-acc", {}, [bVideo, bTel, bPuntos]),
    el("span.ch-juntos", {}, [el("i", { html: IC.lleno }), el("span", { text: "Siempre juntos" }), el("i.inf", { html: IC.infinito })]),
  ]);

  /* — La lista (con su capa de dibujos y stickers libres) — */
  const lista = el("div.ch-lista", { role: "log", "aria-label": `Mensajitos con ${nombre}`, "aria-live": "polite" });
  const inicio = el("div.ch-inicio");
  const fin = el("div.ch-fin", { "aria-hidden": "true" });
  const trazosSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  trazosSvg.setAttribute("class", "ch-trazos");
  const capa = el("div.ch-capa", { "aria-hidden": "true" }, [trazosSvg]);
  const vacio = el("div.ch-vacio", {}, [
    el("i.ch-vacio-ico", { html: ICONO_CHAT }),
    el("b", { text: "Su chat empieza aquí" }),
    el("p", { text: `Mándale el primer mensajito a ${nombre}: texto, un GIF, un sticker o un dibujito.` }),
    el("div.ch-sugeridos", {}, PRIMEROS.map((t) => el("button.ch-sugerido", { type: "button", text: t, onClick: () => { input.value = t; alEscribir(); input.focus(); } }))),
  ]);
  const bajarT = el("span");
  const bajar = el("button.ch-bajar", { type: "button", hidden: "", "aria-label": "Ir a lo más nuevo", onClick: () => alFondo(true) }, [el("i", { html: ico("abajo") }), bajarT]);
  const lienzo = el("div.ch-lienzo", { hidden: "", "aria-label": "Dibuja aquí con un dedo; con dos, desliza" });
  const fondo = fondoDibujado();
  const marco = el("div.ch-marco", {}, [fondo, lista, lienzo, bajar]);

  /* — Los ánimos (todavía no hacen nada: sólo rebotan) — */
  const animos = el("div.ch-animos", { role: "group", "aria-label": "Cómo te sientes (muy pronto)" }, ANIMOS.map((a) => {
    const b = el("button.ch-animo", { type: "button", "aria-label": a.t, dataset: { a: a.id } }, [el("i", { html: a.s }), el("span", { text: a.t })]);
    b.addEventListener("click", () => { if (!reducido()) b.animate([{ transform: "scale(1)" }, { transform: "scale(.9) rotate(-3deg)" }, { transform: "scale(1.06) rotate(2deg)" }, { transform: "scale(1)" }], { duration: 420, easing: "ease-out" }); });
    return b;
  }));

  /* — Escribir — */
  const input = el("textarea.ch-input", { rows: 1, maxlength: 2000, placeholder: "Escribe un mensaje...", "aria-label": "Tu mensajito", enterkeyhint: "send", autocomplete: "off", onInput: () => alEscribir() });
  const bMas = el("button.ch-mas", { type: "button", "aria-label": "Más cositas", "aria-haspopup": "menu", html: IC.mas, onClick: () => hojaMas() });
  const bEmoji = el("button.ch-emoji-b", { type: "button", "aria-label": "Emojis", html: IC.carita, onClick: () => panel("emojis") });
  const bSt = el("button.ch-b", { type: "button", "aria-label": "Stickers", html: IC.gato, onClick: () => panel("stickers") });
  bSt.querySelector("svg").insertAdjacentHTML("beforeend", `<path class="ch-b-cor" d="M18.6 21.6s-2.6-1.5-2.6-3.3a1.4 1.4 0 0 1 2.6-.8 1.4 1.4 0 0 1 2.6.8c0 1.8-2.6 3.3-2.6 3.3z"/>`);
  const bGif = el("button.ch-b.ch-b-gif", { type: "button", "aria-label": "GIFs", html: "<b>GIF</b>", onClick: () => panel("gifs") });
  const bMandar = el("button.ch-mandar", { type: "button", "aria-label": "Nota de voz", html: `<i class="ch-ic-mic">${IC.mic}</i><i class="ch-ic-env">${IC.enviar}</i>`, onClick: () => (input.value.trim() ? mandarTexto() : ahoraNo(bMandar)) });
  // Tocar «Mandar» no le quita el teclado al campo (en el teléfono se queda abierto para seguir escribiendo).
  bMandar.addEventListener("mousedown", (e) => e.preventDefault());
  const escribir = el("div.ch-escribir", {}, [bMas, el("div.ch-caja", {}, [input, bEmoji]), bSt, bGif, bMandar]);

  /* — Stickers, GIFs y emojis — */
  const P = { tipo: "", q: "", sig: 0, total: 0, cargando: false, ctl: null };
  const tabs = [["stickers", "Stickers"], ["gifs", "GIFs"], ["emojis", "Emojis"]].map(([t, n]) => el("button.ch-tab", { type: "button", role: "tab", dataset: { t }, text: n, onClick: () => { if (P.tipo !== t) panel(t); } }));
  const buscar = el("input.ch-buscar", { type: "search", enterkeyhint: "search", autocomplete: "off", "aria-label": "Buscar en GIPHY" });
  const buscarCaja = el("label.ch-buscar-caja", {}, [el("i", { html: ico("buscar") }), buscar]);
  const chips = el("div.ch-chips");
  const rejilla = el("div.ch-rejilla");
  const pista = el("small.ch-pista");
  const panelN = el("div.ch-panel", { hidden: "", role: "dialog", "aria-label": "Stickers, GIFs y emojis" }, [
    el("div.ch-panel-cab", {}, [el("div.ch-tabs", { role: "tablist" }, tabs), el("button.ch-panel-x", { type: "button", "aria-label": "Cerrar", html: ico("cerrar"), onClick: () => panel(null) })]),
    buscarCaja, chips, rejilla,
    el("div.ch-panel-pie", {}, [pista, el("small.ch-giphy", { text: "Con GIPHY" })]),
  ]);

  /* — Dibujar — */
  const barraColores = COLORES.map((c, i) => el("button.ch-color" + (i === 0 ? ".on" : ""), { type: "button", "aria-label": "Color", style: { "--c": c }, onClick: (e) => { S.color = c; marcar(barraColores, e.currentTarget); } }));
  const barraGrosor = GROSORES.map((g, i) => el("button.ch-grosor" + (i === 1 ? ".on" : ""), { type: "button", "aria-label": ["Delgadito", "Mediano", "Gordito"][i], style: { "--g": g + "px" }, onClick: (e) => { S.grosor = g; marcar(barraGrosor, e.currentTarget); } }, [el("i")]));
  const marcar = (grupo, b) => grupo.forEach((x) => x.classList.toggle("on", x === b));
  S.color = COLORES[0]; S.grosor = GROSORES[1];
  const barraDibujo = el("div.ch-dibujo", { hidden: "", role: "toolbar", "aria-label": "Dibujar en el chat" }, [
    el("div.ch-dibujo-fila", {}, [...barraColores, el("i.ch-sep"), ...barraGrosor]),
    el("div.ch-dibujo-fila", {}, [
      el("button.ch-dibujo-b", { type: "button", html: I("deshacer", "Deshacer"), onClick: () => deshacerTrazo() }),
      el("button.ch-dibujo-b", { type: "button", html: `${IC.espacio}<span>+ Espacio</span>`, onClick: () => masEspacio() }),
      el("button.ch-dibujo-b.listo", { type: "button", html: I("ok", "Listo"), onClick: () => salirDibujo() }),
    ]),
    el("small.ch-dibujo-pista", { text: "Dibuja con un dedo · desliza con dos · lo ve en vivo" }),
  ]);
  const raiz = el("section.dt-pantalla.ch" + (PR.fondo ? "" : ".sin-fondo") + (PR.grande ? ".letra-grande" : ""), {}, [cab, marco, animos, panelN, barraDibujo, escribir]);

  /* — Una burbuja — */
  function nodo(m) {
    if (m.espacio) {
      return el("div.ch-espacio", { dataset: { id: String(m.id) }, style: { height: m.espacio + "px" } }, [
        el("span.ch-espacio-t", {}, [el("i", { html: IC.lapiz }), el("span", { text: "Espacio para dibujar" })]),
        m.mio ? el("button.ch-espacio-x", { type: "button", html: I("borrar", "Quitar"), onClick: () => borrar(m, "este espacio") }) : null,
      ]);
    }
    const rx = reaccion(m.reaccion), st = !!m.gif?.s, em = !m.gif && soloEmoji(m.texto);
    const b = el("button.ch-burbuja" + (m.gif ? (st ? ".sticker" : ".gif") : "") + (em ? ".emoji" : ""), { type: "button", "aria-haspopup": "menu", "aria-label": `${m.mio ? "Tú" : nombre}: ${m.texto || (st ? "un sticker" : "un GIF")}${rx ? ", " + rx.corto : ""}` });
    if (m.gif) {
      const k = st ? Math.min(1, 150 / m.gif.w, 150 / m.gif.h) : Math.min(1, 240 / m.gif.w, 260 / m.gif.h);
      const im = el("img." + (st ? "ch-st-img" : "ch-gif"), { src: m.gif.u, alt: st ? "Sticker" : "GIF", width: Math.round(m.gif.w * k), height: Math.round(m.gif.h * k), decoding: "async", referrerpolicy: "no-referrer", draggable: "false" });
      im.addEventListener("load", () => { if (S.pegado) alFondo(false); }, { once: true });
      b.append(im);
    }
    if (m.texto) b.append(el("span.ch-texto", { text: m.texto }));
    if (!m.mio && !st && !em) b.append(el("small.ch-hora-in"));
    const pegados = (m.stickers || []).filter((x) => !x.l);
    if (pegados.length) b.append(el("span.ch-pegados", { "aria-hidden": "true" }, pegados.map((x) => {
      const i = el("img.ch-sticker", { src: x.u, alt: "", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" });
      i.style.left = (x.x * 100).toFixed(1) + "%"; i.style.top = (x.y * 100).toFixed(1) + "%";
      i.style.setProperty("--r", (+x.r || 0) + "deg"); i.style.setProperty("--s", +x.s || 1);
      return i;
    })));
    const f = el("div.ch-fila." + (m.mio ? "mio" : "suyo") + (m._enviando ? ".enviando" : "") + (st ? ".con-sticker" : ""), { dataset: { id: String(m.id) } }, [
      el("div.ch-cuerpo", {}, [b, el("small.ch-hora")]),
    ]);
    ponerRx(f, m);
    b.addEventListener("click", (e) => tocar(e, f));
    return f;
  }
  /** La reacción, en su lugar (sin rehacer la burbuja). */
  function ponerRx(f, m, animar = false) {
    const b = f?.querySelector(".ch-burbuja"), rx = reaccion(m.reaccion);
    if (!b) return;
    b.querySelector(".ch-rx")?.remove();
    f.classList.toggle("con-rx", !!rx);
    if (rx) b.append(el("span.ch-rx" + (animar ? ".nueva" : ""), { title: m.mio ? `${nombre} ${rx.largo}` : rx.tuyo, html: svgReaccion(rx.id) }));
  }
  function ponerHora(f, m) {
    const fuera = f.querySelector(".ch-hora"), dentro = f.querySelector(".ch-hora-in");
    if (!fuera) return;
    const t = m._enviando ? "Mandando…" : hora(m.creado), visto = !!(m.mio && m.visto);
    const k = t + visto + !!dentro;
    if (fuera._k === k) return;
    fuera._k = k;
    if (dentro) { dentro.textContent = t; fuera.replaceChildren(); return; }
    fuera.replaceChildren(el("span", { text: t }), ...(m.mio && !m._enviando ? [el("i.ch-check" + (visto ? ".visto" : ""), { title: visto ? "Visto" : "Enviado", html: IC.check })] : []));
  }

  /** Pone la lista al día moviendo sólo lo que cambió (lo que ya está no se vuelve a animar ni a cargar). */
  function pintar() {
    const hijos = [inicio];
    let prev = null;
    S.ms.forEach((m, i) => {
      const dk = diaDe(m.creado);
      if (!prev || diaDe(prev.creado) !== dk) {
        let d = S.dias.get(dk);
        if (!d) S.dias.set(dk, (d = el("div.ch-dia", {}, [el("i", { html: IC.corazon }), el("span", { text: nombreDia(m.creado) }), el("i", { html: IC.corazon })])));
        hijos.push(d);
        prev = null;
      }
      let f = S.nodos.get(m.id);
      if (!f) { f = nodo(m); S.nodos.set(m.id, f); }
      if (S.nuevos.delete(m.id) && !reducido()) { f.classList.add("llega"); setTimeout(() => f.classList.remove("llega"), 600); }
      if (!m.espacio) {
        f.classList.toggle("primero", !juntos(prev, m));
        f.classList.toggle("ultimo", !juntos(m, S.ms[i + 1]));
        ponerHora(f, m);
      }
      hijos.push(f);
      prev = m;
    });
    if (!S.ms.length && S.listo) hijos.push(vacio);
    hijos.push(fin, capa);
    const quiero = new Set(hijos);
    for (const n of [...lista.children]) if (!quiero.has(n)) n.remove();
    let ref = lista.firstChild;
    for (const n of hijos) { if (n === ref) { ref = ref.nextSibling; continue; } lista.insertBefore(n, ref); }
    pintarCapa();
  }
  function pintarInicio() {
    inicio.replaceChildren(...(S.hayMas ? [el("i.ch-girando")] : S.ms.length ? [el("small", {}, [el("i", { html: IC.lleno }), el("span", { text: "Aquí empieza su historia" })])] : []));
  }

  /* — La capa: dibujos y stickers libres, cada uno pegado a su mensajito — */
  const ancho = () => lista.clientWidth || 1;
  const anclaTop = (id) => { if (!id) return 0; const n = S.nodos.get(id); return n?.isConnected ? n.offsetTop : null; };
  /** El mensajito bajo una altura (de la lista): el último que empieza arriba de ella. */
  function anclaEn(y) {
    let a = null, primero = null;
    for (const m of S.ms) {
      if (!real(m)) continue;
      const t = anclaTop(m.id);
      if (t == null) continue;
      primero ??= { id: m.id, top: t };
      if (t <= y) a = { id: m.id, top: t }; else break;
    }
    return a || primero || { id: 0, top: 0 };
  }
  function pintarCapa() {
    const W = ancho();
    let abajo = 0;
    for (const [, t] of S.trazos) {
      const top = anclaTop(t.ancla);
      if (top == null || !t.p.length) { t.el?.remove(); t.el = null; continue; }
      if (!t.el) { t.el = document.createElementNS("http://www.w3.org/2000/svg", "path"); trazosSvg.append(t.el); }
      const pts = t.vis != null ? t.p.slice(0, Math.max(1, t.vis)) : t.p;
      t.el.setAttribute("d", camino(pts.map(([x, y]) => [Math.round(x * W / 100) / 100, top + y])));
      t.el.setAttribute("stroke", t.c);
      t.el.setAttribute("stroke-width", t.a);
      for (const [, y] of t.p) abajo = Math.max(abajo, top + y + t.a);
    }
    // Los stickers libres (los tuyos se pueden volver a arrastrar).
    const vistos = new Set();
    for (const m of S.ms) for (const x of m.stickers || []) {
      if (!x.l) continue;
      const top = anclaTop(m.id);
      if (top == null) continue;
      const k = m.id + ":" + (x.i || x._t);
      vistos.add(k);
      let n = capa.querySelector(`img[data-k="${k}"]`);
      if (!n) {
        // ¿Es el mismo que ya se ve con otra clave? (el que estaba «pegándose», o que cambió de mensajito)
        const L = x.x * W, T = top + x.y;
        n = [...capa.querySelectorAll("img.ch-libre")].find((z) => !vistos.has(z.dataset.k) && z.getAttribute("src") === x.u && !S.ms.some((mm) => (mm.stickers || []).some((y) => y.l && mm.id + ":" + (y.i || y._t) === z.dataset.k)) && Math.abs(parseFloat(z.style.left) - L) < 3 && Math.abs(parseFloat(z.style.top) - T) < 3);
        if (n) n.dataset.k = k;
        else {
          n = el("img.ch-libre" + (x.mio ? ".mio" : "") + (x._nuevo ? ".nuevo" : ""), { src: x.u, alt: "", decoding: "async", referrerpolicy: "no-referrer", draggable: "false", dataset: { k } });
          if (x.mio) prepararArrastreLibre(n);
          capa.append(n);
        }
      }
      n.style.left = x.x * W + "px";
      n.style.top = top + x.y + "px";
      n.style.setProperty("--r", (+x.r || 0) + "deg");
      n.style.setProperty("--s", +x.s || 1);
      abajo = Math.max(abajo, top + x.y + 60 * (+x.s || 1));
    }
    for (const n of capa.querySelectorAll("img.ch-libre")) if (!vistos.has(n.dataset.k)) n.remove();
    // Que haya lugar abajo para todo lo dibujado (sin mandar mensajes).
    const base = fin.offsetTop;
    const falta = Math.max(0, Math.round(abajo + 24 - base));
    if (Math.abs((parseInt(fin.style.height) || 0) - falta) > 1) fin.style.height = falta + "px";
    const H = fin.offsetTop + fin.offsetHeight;
    trazosSvg.setAttribute("width", W);
    trazosSvg.setAttribute("height", H);
  }
  const vigia = new ResizeObserver(() => pintarCapa());
  vigia.observe(lista);
  document.fonts?.ready.then(() => S.vivo && pintarCapa());

  /* — Moverse — */
  const cerca = () => lista.scrollHeight - lista.scrollTop - lista.clientHeight < 140;
  function alFondo(suave) {
    lista.scrollTo({ top: lista.scrollHeight, behavior: suave && !reducido() ? "smooth" : "auto" });
    S.sinVer = 0; bajar.hidden = true; S.pegado = true;
  }
  lista.addEventListener("scroll", () => {
    S.pegado = cerca();
    if (S.menu) colocarMenu();
    if (S.pegado && !bajar.hidden) { S.sinVer = 0; bajar.hidden = true; }
    if (lista.scrollTop < 160 && S.hayMas && !S.antes) cargarAntes();
  }, { passive: true });
  // Si TÚ deslizas, el menú de un mensajito se cierra (si se mueve solo, porque llegó algo, no).
  for (const t of ["wheel", "touchmove"]) lista.addEventListener(t, () => { if (S.menu) cerrarMenu(); }, { passive: true });

  /* — Hablar con el servidor — */
  /** Los dibujos que llegan. `vivo`: los de tu amorcito se van trazando suavecito (no a brincos). */
  function recibirTrazos(lst, vivo = false) {
    const cambiaron = [];
    for (const t of lst || []) {
      const ya = S.trazos.get(t.id);
      if (t.borrado) { ya?.el?.remove(); S.trazos.delete(t.id); continue; }
      if (ya && ya.local) continue; // el que estás dibujando aquí manda
      const n = { ...t, a: +t.a || 4, el: ya?.el || null, cuando: Date.now(), vis: vivo && !t.mio && !reducido() ? Math.min(ya?.vis ?? ya?.p.length ?? 0, t.p.length) : t.p.length };
      S.trazos.set(t.id, n);
      cambiaron.push(n);
    }
    if (cambiaron.some((t) => t.vis < t.p.length)) trazar();
    return cambiaron;
  }
  let trazando = 0;
  function trazar() {
    if (trazando) return;
    const paso = () => {
      trazando = 0;
      let falta = false;
      const W = ancho();
      for (const t of S.trazos.values()) {
        if (t.vis == null || t.vis >= t.p.length) continue;
        t.vis = Math.min(t.p.length, t.vis + Math.max(1, Math.ceil((t.p.length - t.vis) / 5)));
        pintarTrazo(t, W);
        if (t.vis < t.p.length) falta = true;
      }
      if (falta && S.vivo) trazando = requestAnimationFrame(paso);
    };
    trazando = requestAnimationFrame(paso);
  }
  /** Repinta sólo un trazo (y estira el lugar de abajo si hace falta). */
  function pintarTrazo(t, W = ancho()) {
    const top = anclaTop(t.ancla);
    if (top == null || !t.p.length) return;
    if (!t.el) { t.el = document.createElementNS("http://www.w3.org/2000/svg", "path"); trazosSvg.append(t.el); t.el.setAttribute("stroke", t.c); t.el.setAttribute("stroke-width", t.a); }
    const pts = t.vis != null ? t.p.slice(0, Math.max(1, t.vis)) : t.p;
    t.el.setAttribute("d", camino(pts.map(([x, y]) => [Math.round(x * W / 100) / 100, top + y])));
    let abajo = 0;
    for (const [, y] of pts) abajo = Math.max(abajo, top + y + t.a);
    if (abajo + 24 > fin.offsetTop + fin.offsetHeight) pintarCapa();
  }
  async function cargar() {
    lista.replaceChildren(el("div.dt-cargando", {}, [el("i"), el("span", { text: "Abriendo sus mensajitos…" })]));
    try {
      const d = await SRV.chat({ n: 40 });
      if (!S.vivo) return;
      lista.replaceChildren();
      S.ms = d.mensajes.slice().sort(orden); S.hayMas = !!d.hay_mas; S.desde = d.ahora; S.listo = true;
      S.verVisto = d.ajustes?.visto !== false;
      S.ultimo = Math.max(0, ...S.ms.map((m) => m.id));
      recibirTrazos(d.trazos);
      pintarInicio(); pintar(); alFondo(false);
      requestAnimationFrame(() => alFondo(false));
      if (S.ms.some((m) => !m.mio && !m.visto && !m.espacio)) marcarVistos();
      escuchar();
    } catch (e) {
      if (!S.vivo) return;
      lista.replaceChildren(el("div.ch-vacio", {}, [el("i.ch-vacio-ico", { html: ICONO_CHAT }), el("p", { text: mensajeError(e) }), el("button.ch-sugerido", { type: "button", text: "Intentar otra vez", onClick: () => cargar() })]));
    }
  }
  async function cargarAntes() {
    const primero = S.ms.find(real);
    if (!primero) return;
    S.antes = true;
    try {
      const d = await SRV.chat({ n: 30, antes: primero.id });
      if (!S.vivo) return;
      const h0 = lista.scrollHeight, t0 = lista.scrollTop, ya = new Set(S.ms.map((m) => m.id));
      S.ms = [...d.mensajes.filter((m) => !ya.has(m.id)), ...S.ms].sort(orden);
      S.hayMas = !!d.hay_mas;
      recibirTrazos(d.trazos);
      pintarInicio(); pintar();
      lista.scrollTop = t0 + (lista.scrollHeight - h0);
    } catch (e) { /* al volver a subir */ }
    finally { S.antes = false; }
  }
  /**
   * Tiempo real: se le pregunta al servidor «¿algo nuevo?» y él se queda esperando hasta que lo haya
   * (o 22 s). Si contesta al instante sin nada (un servidor viejo), se respira 2.5 s entre preguntas.
   */
  async function escuchar() {
    if (S.escuchando) return;
    S.escuchando = true;
    while (S.vivo) {
      if (document.hidden) { await dormir(1500); continue; }
      const t0 = Date.now();
      try {
        const d = await SRV.chat(S.ultimo ? { despues: S.ultimo, desde: S.desde, espera: 22 } : { n: 40 });
        if (!S.vivo) break;
        S.desde = d.ahora;
        // (Sin mensajitos todavía se pregunta por «los últimos», que siempre traen lo mismo: ahí se respira.)
        const algo = S.ultimo ? (d.mensajes?.length || 0) + (d.cambios?.length || 0) + (d.trazos?.length || 0) : d.mensajes?.length || 0;
        const tz = recibirTrazos(d.trazos, true);
        if ((d.mensajes?.length || 0) + (d.cambios?.length || 0)) recibir(d.mensajes || [], d.cambios || []);
        else for (const t of tz) if (t.vis >= t.p.length) pintarTrazo(t);
        if (!algo && Date.now() - t0 < 1200) await dormir(2500);
      } catch (e) { await dormir(4000); }
    }
    S.escuchando = false;
  }
  const alVolver = () => { if (!document.hidden && S.listo) escuchar(); };
  document.addEventListener("visibilitychange", alVolver);
  const marcarVistos = () => SRV.chatVistos().then(() => dispatchEvent(new CustomEvent("ed-chat-visto"))).catch(() => {});

  /** Lo que llegó (nuevos) y lo que cambió (reacciones, stickers, vistos, borrados). */
  function recibir(nuevos, cambios, propio = false) {
    const pegado = cerca();
    let llegaron = 0, suyo = false;
    for (const m of nuevos) {
      if (m.borrado || S.nodos.has(m.id) || S.ms.some((x) => x.id === m.id)) continue;
      // Tu mensajito llegó por aquí antes que la respuesta de «mandar»: la burbuja que ya se ve pasa a ser ésa.
      const t = m.mio && S.ms.find((x) => x._enviando && !x._real && x.texto === m.texto && (x.gif?.u || "") === (m.gif?.u || ""));
      if (t) { adoptar(t, m); continue; }
      S.ms.push(m); S.nuevos.add(m.id); llegaron++;
      if (!m.mio && !m.espacio) suyo = true;
    }
    S.ms.sort(orden);
    S.ultimo = Math.max(S.ultimo, ...S.ms.filter(real).map((m) => m.id));
    for (const c of cambios) {
      const a = S.ms.find((m) => m.id === c.id);
      if (!a) continue;
      if (c.borrado) { quitar(c.id); continue; }
      if (firma(a) === firma(c)) continue;
      aplicar(c, false);
      if (c.mio && c.reaccion && c.reaccion !== a.reaccion) festejar(c);
      const st = c.stickers || [];
      if (st.length > (a.stickers || []).length && !st[st.length - 1].mio) sonar("sticker-pegar");
    }
    pintar();
    if (llegaron) {
      if (pegado || propio) alFondo(true);
      else { S.sinVer += llegaron; bajarT.textContent = S.sinVer === 1 ? "1 nuevo" : `${S.sinVer} nuevos`; bajar.hidden = false; }
    }
    if (suyo) { sonar("mensaje-llega"); if (!document.hidden) marcarVistos(); }
  }
  /** Cambia un mensajito por su versión nueva (en su lugar). */
  function aplicar(m, repintar = true) {
    const i = S.ms.findIndex((x) => x.id === m.id);
    if (i < 0) return;
    const antes = S.ms[i];
    S.ms[i] = m;
    // Sin parpadeos: la burbuja sólo se rehace si cambió lo que trae dentro; la reacción y el «visto»
    // se cambian en su lugar, y los stickers libres viven en la capa.
    if (firmaBurbuja(antes) !== firmaBurbuja(m)) {
      const viejo = S.nodos.get(m.id), n = nodo(m);
      S.nodos.set(m.id, n);
      if (viejo?.isConnected) { n.className = viejo.className.replace(/\bllega\b/, ""); n.classList.toggle("con-rx", !!reaccion(m.reaccion)); viejo.replaceWith(n); }
    } else if (m.reaccion !== antes.reaccion) ponerRx(S.nodos.get(m.id), m, !!m.reaccion);
    if (repintar) pintar();
  }
  function quitar(id) {
    const f = S.nodos.get(id);
    S.ms = S.ms.filter((m) => m.id !== id);
    S.nodos.delete(id);
    if (f?.isConnected && !reducido()) f.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.6)" }], { duration: 260, easing: "ease-in" }).onfinish = () => pintar();
    else pintar();
  }
  function festejar(m) {
    sonar("reaccion-" + m.reaccion);
    const r = S.nodos.get(m.id)?.querySelector(".ch-rx")?.getBoundingClientRect();
    const l = lista.getBoundingClientRect();
    if (r && r.bottom > l.top && r.top < l.bottom) estallido(r.left + r.width / 2, r.top + r.height / 2, m.reaccion);
  }

  /* — Mandar — */
  function alEscribir() {
    input.style.height = "auto";
    input.style.height = Math.min(124, input.scrollHeight) + "px";
    const hay = !!input.value.trim();
    escribir.classList.toggle("con-texto", hay);
    bMandar.setAttribute("aria-label", hay ? "Mandar" : "Nota de voz");
    if (!panelN.hidden && input.value && P.tipo !== "emojis") panel(null);
  }
  // Sonidos de teclado (se apagan en ⋮): letra, espacio y borrar, también con el teclado del teléfono.
  input.addEventListener("input", (e) => {
    if (!PR.teclado || !PR.sonidos) return;
    const t = e.inputType || "";
    son?.sonar(t.startsWith("delete") ? "teclado-borrar" : t === "insertLineBreak" || e.data === " " ? "teclado-espacio" : "teclado-letra");
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); mandarTexto(); }
  });
  input.addEventListener("focus", () => { if (!panelN.hidden && P.tipo !== "emojis") panel(null); if (S.pegado) setTimeout(() => alFondo(false), 260); });
  function mandarTexto() {
    const t = input.value.trim();
    if (!t) { input.focus(); return; }
    input.value = ""; alEscribir();
    mandar({ texto: t });
  }
  async function mandar({ texto = "", gif = null }) {
    const t = { id: "t" + ++S.temp, mio: true, texto, gif, creado: new Date().toISOString(), visto: "", reaccion: "", stickers: [], _enviando: true };
    S.ms.push(t); S.ms.sort(orden); S.listo = true;
    pintar(); alFondo(false);
    volar(S.nodos.get(t.id));
    sonar("mensaje-enviar");
    try {
      const m = await SRV.mandarMensaje({ texto, gif });
      if (!S.vivo) return true;
      if (!t._real) adoptar(t, m);
      return true;
    } catch (e) {
      S.nodos.get(t.id)?.remove();
      S.nodos.delete(t.id);
      S.ms = S.ms.filter((x) => x !== t);
      pintar();
      if (texto && !input.value) { input.value = texto; alEscribir(); }
      aviso(mensajeError(e), 5000, "error");
      sonar("error");
      return false;
    }
  }

  /** La burbuja de «mandando» pasa a ser la de verdad (la misma: no se vuelve a animar ni a cargar). */
  function adoptar(t, m) {
    t._real = m.id;
    const f = S.nodos.get(t.id);
    S.nodos.delete(t.id);
    S.ms = S.ms.filter((x) => x !== t && x.id !== m.id);
    S.ms.push(m); S.ms.sort(orden);
    if (f) { f.dataset.id = String(m.id); f.classList.remove("enviando"); S.nodos.set(m.id, f); }
    S.ultimo = Math.max(S.ultimo, m.id);
    pintar();
  }
  /** Tu mensajito sale volando desde donde lo escribiste, con un rebotito y corazoncitos. */
  function volar(f) {
    if (!f || reducido()) return;
    const b = f.querySelector(".ch-burbuja"), h = f.querySelector(".ch-hora");
    const rb = b.getBoundingClientRect(), ri = escribir.querySelector(".ch-caja").getBoundingClientRect();
    const dx = ri.left + Math.min(rb.width / 2 + 16, ri.width / 2) - (rb.left + rb.width / 2), dy = ri.top + ri.height / 2 - (rb.top + rb.height / 2);
    b.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(.62)`, opacity: 0.35, filter: "blur(1.5px)" },
      { transform: `translate(${dx * 0.18}px, ${dy * 0.12}px) scale(1.04)`, opacity: 1, filter: "blur(0)", offset: 0.55 },
      { transform: "translate(0, -3px) scale(1.06) rotate(-1deg)", offset: 0.78 },
      { transform: "none" },
    ], { duration: 620, easing: "cubic-bezier(.2, .9, .3, 1)" });
    h?.animate([{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], { duration: 300, delay: 380, fill: "backwards" });
    const r = bMandar.getBoundingClientRect();
    det._chispas?.(r.left + r.width / 2, r.top + r.height / 2, 7);
  }

  /* — Tocar un mensajito: su menú — */
  const deFila = (f) => S.ms.find((m) => String(m.id) === f.dataset.id);
  function tocar(e, f) {
    const m = deFila(f);
    if (!m || !real(m) || S.dibujo) return;
    abrirMenu(m, f, e.detail === 0);
  }
  function abrirMenu(m, f, conTeclado) {
    cerrarMenu();
    const b = f.querySelector(".ch-burbuja");
    const partes = [];
    if (!m.mio) partes.push(el("div.ch-menu-rx", { role: "group", "aria-label": "Reaccionar" }, REACCIONES.map((r) => el("button.ch-menu-rxb" + (m.reaccion === r.id ? ".on" : ""), {
      type: "button", title: r.corto, "aria-label": r.corto, "aria-pressed": String(m.reaccion === r.id), html: svgReaccion(r.id), onClick: () => reaccionar(m, r.id),
    }))));
    partes.push(el("div.ch-menu-acc", {}, [
      el("button.ch-menu-b", { type: "button", role: "menuitem", html: I("sticker", "Pegarle un sticker"), onClick: () => { cerrarMenu(); panel("stickers"); } }),
      m.texto ? el("button.ch-menu-b", { type: "button", role: "menuitem", html: I("copiar", "Copiar"), onClick: async () => { cerrarMenu(); try { await navigator.clipboard.writeText(m.texto); aviso("Copiado"); } catch (err) { aviso("No se pudo copiar aquí", 2600, "error"); } } }) : null,
      m.mio ? el("button.ch-menu-b.peligro", { type: "button", role: "menuitem", html: I("borrar", "Borrar para los dos"), onClick: () => { cerrarMenu(); borrar(m); } }) : null,
    ]));
    const caja = flota(el("div.ch-menu" + (m.mio ? ".mio" : ""), { role: "menu", "aria-label": "Qué hacer con este mensajito" }, partes));
    const velo = el("div.ch-velo", { onClick: () => cerrarMenu() });
    caja.before(velo);
    b.classList.add("elegida");
    S.menu = { caja, velo, b, mio: m.mio };
    colocarMenu();
    sonar("abrir");
    if (conTeclado) caja.querySelector("button")?.focus({ preventScroll: true });
  }
  function colocarMenu() {
    const { caja, b, mio } = S.menu, r = b.getBoundingClientRect(), w = caja.offsetWidth, h = caja.offsetHeight;
    const x = Math.max(10, Math.min(innerWidth - w - 10, mio ? r.right - w : r.left));
    const arriba = r.top - h - 10 > 70;
    const y = arriba ? r.top - h - 10 : Math.min(innerHeight - h - 10, r.bottom + 10);
    caja.style.left = x + "px"; caja.style.top = Math.max(10, y) + "px";
    caja.style.transformOrigin = `${mio ? "right" : "left"} ${arriba ? "bottom" : "top"}`;
  }
  function cerrarMenu() {
    const m = S.menu;
    if (!m) return false;
    S.menu = null;
    m.b.classList.remove("elegida");
    m.velo.remove();
    if (reducido()) m.caja.remove();
    else m.caja.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.9)" }], { duration: 140, easing: "ease-in" }).onfinish = () => m.caja.remove();
    return true;
  }
  async function reaccionar(m, id) {
    const antes = S.ms.find((x) => x.id === m.id) || m, nueva = antes.reaccion === id ? "" : id;
    cerrarMenu();
    aplicar({ ...antes, reaccion: nueva });
    if (nueva) {
      sonar("reaccion-" + nueva);
      const r = S.nodos.get(m.id)?.querySelector(".ch-burbuja")?.getBoundingClientRect();
      if (r) estallido(r.left + r.width / 2, r.top + r.height / 2, nueva);
    } else sonar("reaccion-quitar");
    try { aplicar(await SRV.reaccionarMensaje(m.id, nueva)); }
    catch (e) { aplicar(antes); aviso(mensajeError(e), 4500, "error"); }
  }
  async function borrar(m, que = "este mensajito") {
    if (!(await confirmar(`¿Borrar ${que}? Se borra para los dos.`, "Borrar"))) return;
    try { await SRV.borrarMensaje(m.id); sonar("borrar"); quitar(m.id); }
    catch (e) { aviso(mensajeError(e), 4000, "error"); }
  }

  /* — Las hojitas de ⋮ (ajustes y privacidad) y de + (las cositas) — */
  function abrirHoja(nodoHoja, desde, clase) {
    cerrarHoja();
    const velo = flota(el("div.ch-velo.suave", { onClick: () => cerrarHoja() }));
    const h = flota(el("div.ch-hoja." + clase, { role: "menu" }, [nodoHoja]));
    const r = desde.getBoundingClientRect(), w = h.offsetWidth, alto = h.offsetHeight;
    if (clase === "ajustes") { h.style.top = Math.min(innerHeight - alto - 10, r.bottom + 8) + "px"; h.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.right - w)) + "px"; h.style.transformOrigin = "top right"; }
    else { h.style.top = Math.max(10, r.top - alto - 12) + "px"; h.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.left)) + "px"; h.style.transformOrigin = "bottom left"; }
    h.querySelectorAll(".ch-hoja-item").forEach((n, i) => n.style.setProperty("--i", i));
    desde.classList.add("abierto");
    S.hoja = { h, velo, desde };
    sonar("abrir");
  }
  function cerrarHoja() {
    const o = S.hoja;
    if (!o) return false;
    S.hoja = null;
    o.desde.classList.remove("abierto");
    o.velo.remove();
    if (reducido()) o.h.remove();
    else o.h.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.88)" }], { duration: 160, easing: "ease-in" }).onfinish = () => o.h.remove();
    sonar("cerrar");
    return true;
  }
  function interruptor(texto, sub, on, al) {
    const b = el("button.ch-hoja-item.ch-switch", { type: "button", role: "menuitemcheckbox", "aria-checked": String(on) }, [
      el("span.ch-hoja-t", {}, [el("b", { text: texto }), sub ? el("small", { text: sub }) : null]), el("i.ch-switch-i", {}, [el("i")]),
    ]);
    b.addEventListener("click", async () => {
      const nuevo = b.getAttribute("aria-checked") !== "true";
      b.setAttribute("aria-checked", String(nuevo));
      if ((await al(nuevo)) === false) b.setAttribute("aria-checked", String(!nuevo));
    });
    return b;
  }
  function hojaAjustes() {
    const pref = (k) => (v) => { PR[k] = v; guardarPref(PR); raiz.classList.toggle("sin-fondo", !PR.fondo); raiz.classList.toggle("letra-grande", PR.grande); requestAnimationFrame(pintarCapa); };
    abrirHoja(el("div.ch-hoja-in", {}, [
      el("div.ch-hoja-cab", {}, [el("i", { html: IC.lleno }), el("b", { text: "Ajustes del chat" })]),
      el("small.ch-hoja-sec", { text: "En este aparato" }),
      interruptor("Sonidos del chat", "Al mandar, al llegar y al pegar", PR.sonidos, pref("sonidos")),
      interruptor("Sonidos del teclado", "Al escribir tus mensajitos", PR.teclado, pref("teclado")),
      interruptor("Avisos de mensajitos", "Cuando el chat está cerrado", PR.avisos, pref("avisos")),
      interruptor("Fondo con corazoncitos", "", PR.fondo, pref("fondo")),
      interruptor("Letra grande", "", PR.grande, pref("grande")),
      (() => { const b = el("button.ch-hoja-item.ch-temas", { type: "button", role: "menuitem" }, [el("i.ch-temas-ico", { html: ico("diseno") }), el("span.ch-hoja-t", {}, [el("b", { text: "Temas del chat" }), el("small", { text: "Colores y fondos para su chat" })]), el("em.ch-pronto-tag", { text: "Muy pronto" })]);
        b.addEventListener("click", () => { if (!reducido()) b.animate([{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 300 }); });
        return b; })(),
      el("small.ch-hoja-sec", { text: "Privacidad" }),
      interruptor("Mostrar mi «visto»", `Que ${nombre} sepa cuándo leí lo suyo`, S.verVisto, async (v) => {
        try { const r = await SRV.chatAjustes({ visto: v }); S.verVisto = r.ajustes.visto; aviso(v ? "Tu «visto» se ve otra vez" : `${nombre} ya no verá cuándo lees`); return true; }
        catch (e) { aviso(mensajeError(e), 4500, "error"); return false; }
      }),
      el("button.ch-hoja-item", { type: "button", role: "menuitem", html: I("guardar", "Guardar una copia del chat"), onClick: () => { cerrarHoja(); guardarCopia(); } }),
      el("button.ch-hoja-item.peligro", { type: "button", role: "menuitem", html: I("borrar", "Borrar mis dibujos del chat"), onClick: async () => {
        cerrarHoja();
        if (!(await confirmar(`¿Borrar todos tus dibujos del chat? (Los de ${nombre} se quedan.)`, "Borrar"))) return;
        try { await SRV.trazosBorrar(); for (const [k, t] of S.trazos) if (t.mio) { t.el?.remove(); S.trazos.delete(k); } pintarCapa(); aviso("Tus dibujos se borraron"); }
        catch (e) { aviso(mensajeError(e), 4500, "error"); }
      } }),
      el("p.ch-hoja-nota", { text: `Sólo ustedes dos ven este chat: vive en su ${SRV.NOMBRE}.` }),
    ]), bPuntos, "ajustes");
  }
  function hojaMas() {
    const item = (icono, t, sub, al, clase = "") => el("button.ch-hoja-item.ch-cosita" + clase, { type: "button", role: "menuitem", onClick: () => { cerrarHoja(); al(); } }, [el("i.ch-cosita-ico", { html: icono }), el("span.ch-hoja-t", {}, [el("b", { text: t }), el("small", { text: sub })])]);
    abrirHoja(el("div.ch-hoja-in", {}, [
      el("div.ch-hoja-cab", {}, [el("i", { html: IC.brillo }), el("b", { text: "Cositas" })]),
      el("div.ch-cositas", {}, [
        item(IC.lapiz, "Dibujar", "En vivo, en todo el chat", () => entrarDibujo(), ".rosa"),
        item(IC.espacio, "Espacio", "Más lugar para dibujar", () => { entrarDibujo(); masEspacio(); }, ".lila"),
        item(IC.gato, "Stickers", "Cute y para pegar", () => panel("stickers"), ".durazno"),
        item("<b>GIF</b>", "GIFs", "Para decirlo todo", () => panel("gifs"), ".menta"),
      ]),
      el("div.ch-pronto", {}, [el("i", { html: IC.brillo }), el("span", { text: "Aquí van a llegar más cositas muy pronto ✨" })]),
    ]), bMas, "mas");
  }
  async function guardarCopia() {
    aviso("Juntando todos sus mensajitos…", 2200);
    try {
      let todos = [], antes = 0;
      for (let i = 0; i < 300; i++) {
        const d = await SRV.chat({ n: 100, ...(antes ? { antes } : {}) });
        todos = [...d.mensajes, ...todos];
        if (!d.hay_mas || !d.mensajes.length) break;
        antes = d.mensajes[0].id;
      }
      const yo = PF.miNombre() || "Yo";
      const lineas = todos.filter((m) => !m.espacio && !m.borrado).map((m) => `[${new Date(m.creado).toLocaleString("es-MX")}] ${m.mio ? yo : nombre}: ${m.texto || ""}${m.gif ? (m.texto ? " " : "") + (m.gif.s ? "[sticker]" : "[GIF]") : ""}`);
      const b = new Blob([`Mensajitos de ${yo} y ${nombre} 💗\n\n${lineas.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
      const a = el("a", { href: URL.createObjectURL(b), download: `mensajitos-con-${SRV.nombreLimpio(nombre)}.txt` });
      document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    } catch (e) { aviso(mensajeError(e), 4500, "error"); }
  }

  /* — El panel de stickers, GIFs y emojis — */
  function panel(tipo) {
    if (!tipo || (tipo === P.tipo && !panelN.hidden)) {
      if (panelN.hidden) return false;
      P.ctl?.abort();
      P.tipo = "";
      [bGif, bSt, bEmoji].forEach((b) => b.classList.remove("on"));
      raiz.classList.remove("con-panel");
      if (reducido()) panelN.hidden = true;
      else panelN.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(18px) scale(.98)" }], { duration: 180, easing: "ease-in" }).onfinish = () => { if (!P.tipo) panelN.hidden = true; };
      sonar("cerrar");
      return true;
    }
    if (S.dibujo) salirDibujo();
    const abriendo = panelN.hidden;
    P.tipo = tipo; P.q = "";
    buscar.value = "";
    buscar.placeholder = tipo === "gifs" ? "Busca un GIF…" : "Busca un sticker cute…";
    buscarCaja.hidden = tipo === "emojis";
    tabs.forEach((b) => { const on = b.dataset.t === tipo; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    [[bGif, "gifs"], [bSt, "stickers"], [bEmoji, "emojis"]].forEach(([b, t]) => b.classList.toggle("on", t === tipo));
    pista.textContent = tipo === "stickers" ? "Toca para mandarlo · mantenlo y arrástralo para pegarlo donde quieras" : tipo === "gifs" ? "Toca uno para mandarlo" : "Toca para ponerlo en tu mensajito";
    chips.replaceChildren(...(ETIQUETAS[tipo] || []).map(([t, q], i) => el("button.ch-chip" + (i === 0 ? ".on" : ""), { type: "button", text: t, dataset: { q }, onClick: (e) => { buscar.value = ""; P.q = q; chips.querySelectorAll(".ch-chip").forEach((c) => c.classList.toggle("on", c === e.currentTarget)); hacerBusqueda(true); } })));
    chips.hidden = tipo === "emojis";
    raiz.classList.add("con-panel");
    if (abriendo) {
      panelN.hidden = false;
      if (tipo !== "emojis") input.blur();
      if (!reducido()) panelN.animate([{ opacity: 0, transform: "translateY(24px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: "cubic-bezier(.2,.9,.3,1.15)" });
      sonar("abrir");
      if (S.pegado) setTimeout(() => alFondo(false), 40);
    }
    if (tipo === "emojis") {
      P.ctl?.abort();
      rejilla.className = "ch-rejilla emojis";
      rejilla.replaceChildren(...EMOJIS.map((x) => el("button.ch-emo", { type: "button", text: x, onClick: () => ponerEmoji(x) })));
      return true;
    }
    rejilla.className = "ch-rejilla";
    P.q = ETIQUETAS[tipo][0][1];
    hacerBusqueda(true);
    return true;
  }
  function ponerEmoji(x) {
    const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? a;
    input.value = input.value.slice(0, a) + x + input.value.slice(b);
    input.selectionStart = input.selectionEnd = a + x.length;
    alEscribir();
  }
  buscar.addEventListener("input", debounce(() => {
    const q = buscar.value.trim();
    chips.querySelectorAll(".ch-chip").forEach((c) => c.classList.toggle("on", !q && c.dataset.q === P.q));
    P.q = q ? (P.tipo === "stickers" && !/cute|kawaii/i.test(q) ? q + " cute" : q) : ETIQUETAS[P.tipo][0][1];
    hacerBusqueda(true);
  }, 380));
  async function hacerBusqueda(desde0) {
    if (!desde0 && (P.cargando || P.sig >= P.total)) return;
    P.ctl?.abort();
    const ctl = (P.ctl = new AbortController());
    if (desde0) { P.sig = 0; P.total = 0; rejilla.scrollTop = 0; rejilla.replaceChildren(el("div.dt-cargando", {}, [el("i"), el("span", { text: "Buscando…" })])); }
    P.cargando = true;
    const tipo = P.tipo;
    try {
      let puestos = 0;
      // Los stickers viejitos no salen: si una página trae pocos nuevos, se pide la siguiente.
      for (let vuelta = 0; vuelta < 3 && puestos < 9; vuelta++) {
        const r = await G.buscar(tipo, P.q, P.sig, 30, ctl.signal);
        if (ctl !== P.ctl) return;
        if (desde0 && vuelta === 0) rejilla.replaceChildren();
        P.sig = r.siguiente; P.total = r.total;
        for (const it of r.items) {
          if (tipo === "stickers" && it.fecha && +it.fecha.slice(0, 4) < NUEVOS_DESDE && +it.fecha.slice(0, 4) > 1990) continue;
          rejilla.append(mini(it, tipo)); puestos++;
        }
        if (P.sig >= P.total) break;
      }
      if (!rejilla.children.length) rejilla.append(el("p.ch-nada", { text: "No salió nada. Prueba con otra palabra." }));
    } catch (e) {
      if (e.name === "AbortError" || ctl !== P.ctl) return;
      rejilla.replaceChildren(el("p.ch-nada", { text: e instanceof G.SinConexion ? "GIPHY todavía no está conectado en este aparato. Conéctalo una vez en el editor, en la sección de GIFs." : e.message }));
    } finally { if (ctl === P.ctl) P.cargando = false; }
  }
  rejilla.addEventListener("scroll", () => { if (P.tipo !== "emojis" && rejilla.scrollTop + rejilla.clientHeight > rejilla.scrollHeight - 320) hacerBusqueda(false); }, { passive: true });
  // Mientras arrastras un sticker, la rejilla no se desliza.
  rejilla.addEventListener("touchmove", (e) => { if (S.arrastre?.activo) e.preventDefault(); }, { passive: false });
  function mini(it, tipo) {
    const fw = it.im?.fixed_width || {};
    const g = { u: fw.webp || fw.url || it.mini, w: +fw.width || it.w || 200, h: +fw.height || it.h || 200 };
    const b = el("button.ch-mini" + (tipo === "stickers" ? ".st" : ""), { type: "button", "aria-label": it.titulo, title: it.titulo, style: { aspectRatio: `${g.w} / ${g.h}` } }, [
      el("img", { src: it.mini || g.u, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" }),
    ]);
    if (tipo === "stickers") prepararArrastre(b, { u: g.u, w: g.w, h: g.h, it });
    b.addEventListener("click", () => { if (b._arrastrado) { b._arrastrado = false; return; } elegir(it, g, tipo); });
    return b;
  }
  async function elegir(it, g, tipo) {
    G.contar(it, "onclick");
    panel(null);
    if (await mandar({ gif: tipo === "stickers" ? { ...g, s: 1 } : g })) G.contar(it, "onsent");
  }

  /* — Arrastrar stickers: del panel a cualquier parte del chat, o los tuyos de un lugar a otro — */
  const bote = el("div.ch-bote", { "aria-hidden": "true" }, [el("i", { html: IC.bote }), el("span", { text: "Suelta aquí para quitarlo" })]);
  /** Mantener presionado (o, con ratón, empezar a mover) un sticker lo levanta. */
  function arrastrable(n, { u, alSoltar, conBote = false }) {
    let espera = 0, x0 = 0, y0 = 0, pid = null;
    const limpiar = () => { clearTimeout(espera); espera = 0; };
    n.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || S.arrastre || S.dibujo) return;
      x0 = e.clientX; y0 = e.clientY; pid = e.pointerId;
      if (document.activeElement === input) input.blur(); // el teclado se va: el sticker se pone donde sea, sin brincos
      const empezar = () => { espera = 0; levantar(n, u, x0, y0, pid, alSoltar, conBote); };
      if (e.pointerType === "mouse") { n._mouse = empezar; return; }
      espera = setTimeout(empezar, 230);
    });
    n.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      const lejos = Math.hypot(e.clientX - x0, e.clientY - y0) > 7;
      if (n._mouse && lejos) { const f = n._mouse; n._mouse = null; f(); }
      else if (espera && lejos) limpiar(); // se movió antes de tiempo: quería deslizar
    });
    for (const t of ["pointerup", "pointercancel", "pointerleave"]) n.addEventListener(t, () => { limpiar(); n._mouse = null; });
    n.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  function prepararArrastre(b, st) {
    arrastrable(b, { u: st.u, alSoltar: (p) => { b._arrastrado = true; setTimeout(() => { b._arrastrado = false; }, 450); if (p) pegarLibre(st, p); } });
  }
  /** Tus stickers libres: al soltarlos se busca cuál es (por su clave de ese momento). */
  function prepararArrastreLibre(n) {
    n.addEventListener("touchmove", (e) => { if (S.arrastre?.activo) e.preventDefault(); }, { passive: false });
    arrastrable(n, { u: n.getAttribute("src"), conBote: true, alSoltar: (p, alBote) => {
      const [mid, sid] = n.dataset.k.split(":");
      const m = S.ms.find((z) => String(z.id) === mid), x = m?.stickers?.find((z) => z.i === sid);
      if (x) moverLibre(m.id, x, p, alBote);
    } });
  }
  function levantar(origen, u, cx, cy, pid, alSoltar, conBote) {
    document.activeElement?.blur?.();
    vibrar(12);
    sonar("arrastrar");
    const fantasma = flota(el("img.ch-fantasma", { src: u, alt: "", referrerpolicy: "no-referrer", draggable: "false" }));
    origen.classList.add("levantado");
    raiz.classList.add("soltando");
    if (conBote) { flota(bote); requestAnimationFrame(() => bote.classList.add("ver")); }
    const A = (S.arrastre = { activo: true, x: cx, y: cy });
    let auto = 0;
    const mover = (x, y) => {
      A.x = x; A.y = y;
      fantasma.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(-6deg) scale(1.1)`;
      const r = lista.getBoundingClientRect();
      A.dentro = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && !A.enPanel(x, y);
      A.alBote = conBote && (() => { const b = bote.getBoundingClientRect(); return x >= b.left - 10 && x <= b.right + 10 && y >= b.top - 10 && y <= b.bottom + 10; })();
      bote.classList.toggle("encima", !!A.alBote);
      fantasma.classList.toggle("fuera", !A.dentro && !A.alBote);
      // Cerca de arriba o de abajo, la lista se va moviendo sola.
      cancelAnimationFrame(auto);
      const v = y < r.top + 60 ? -1 : y > r.bottom - 60 && y < r.bottom ? 1 : 0;
      if (v) { const paso = () => { lista.scrollTop += v * 9; pintarCapa(); auto = requestAnimationFrame(paso); }; auto = requestAnimationFrame(paso); }
    };
    A.enPanel = (x, y) => { if (panelN.hidden) return false; const r = panelN.getBoundingClientRect(); return y >= r.top && y <= r.bottom && x >= r.left && x <= r.right; };
    mover(cx, cy);
    const alMover = (e) => { if (e.pointerId === pid || pid == null) { e.preventDefault?.(); mover(e.clientX, e.clientY); } };
    const alSoltarP = (e) => {
      if (pid != null && e.pointerId !== pid) return;
      removeEventListener("pointermove", alMover, true);
      removeEventListener("pointerup", alSoltarP, true);
      removeEventListener("pointercancel", alSoltarP, true);
      cancelAnimationFrame(auto);
      origen.classList.remove("levantado");
      raiz.classList.remove("soltando");
      bote.classList.remove("ver", "encima");
      setTimeout(() => bote.remove(), 250);
      S.arrastre = null;
      const ok = e.type === "pointerup" && (A.dentro || A.alBote);
      if (!reducido()) fantasma.animate([{ opacity: 1 }, { opacity: 0, transform: fantasma.style.transform.replace("scale(1.1)", ok ? "scale(.95)" : "scale(.4)") }], { duration: ok ? 120 : 220 }).onfinish = () => fantasma.remove();
      else fantasma.remove();
      alSoltar(ok && !A.alBote ? { x: A.x, y: A.y } : null, !!A.alBote && ok);
    };
    addEventListener("pointermove", alMover, true);
    addEventListener("pointerup", alSoltarP, true);
    addEventListener("pointercancel", alSoltarP, true);
  }
  /** Dónde cayó (en la lista): su mensajito ancla, x de 0 a 1 a lo ancho, y en px desde el mensajito. */
  function posicion(p) {
    const r = lista.getBoundingClientRect();
    const cx = p.x - r.left, cy = p.y - r.top + lista.scrollTop;
    const a = anclaEn(cy);
    return { ancla: a.id, x: Math.max(0, Math.min(1, cx / ancho())), y: Math.round(cy - a.top) };
  }
  async function pegarLibre(st, p) {
    const pos = posicion(p);
    if (!pos.ancla) { panel(null); mandar({ gif: { u: st.u, w: st.w, h: st.h, s: 1 } }); return; }
    const m = S.ms.find((z) => z.id === pos.ancla);
    const nuevo = { u: st.u, x: pos.x, y: pos.y, r: Math.round(Math.random() * 240 - 120) / 10, s: 1, l: 1, mio: true, _t: "n" + ++S.temp, _nuevo: true };
    aplicar({ ...m, stickers: [...(m.stickers || []), nuevo] });
    sonar("sticker-pegar");
    vibrar(18);
    try { aplicar(await SRV.pegarSticker(m.id, { u: st.u, x: nuevo.x, y: nuevo.y, r: nuevo.r, s: 1, l: 1 })); if (st.it) G.contar(st.it, "onsent"); }
    catch (e) { const ahora = S.ms.find((z) => z.id === m.id); if (ahora) aplicar({ ...ahora, stickers: (ahora.stickers || []).filter((z) => z._t !== nuevo._t) }); aviso(mensajeError(e), 4500, "error"); }
  }
  async function moverLibre(mid, x, p, alBote) {
    const m = S.ms.find((z) => z.id === mid);
    if (!m || (!p && !alBote)) return;
    if (alBote) {
      aplicar({ ...m, stickers: (m.stickers || []).filter((z) => z.i !== x.i) });
      sonar("borrar");
      try { aplicar(await SRV.quitarSticker(mid, x.i)); } catch (e) { aplicar(m); aviso(mensajeError(e), 4500, "error"); }
      return;
    }
    const pos = posicion(p);
    sonar("sticker-pegar");
    if (pos.ancla === mid) {
      aplicar({ ...m, stickers: m.stickers.map((z) => (z.i === x.i ? { ...z, x: pos.x, y: pos.y } : z)) });
      try { aplicar(await SRV.moverSticker(mid, x.i, { x: pos.x, y: pos.y })); } catch (e) { aplicar(m); aviso(mensajeError(e), 4500, "error"); }
      return;
    }
    // Cambió de mensajito: se quita de uno y se pega en el otro.
    const otro = S.ms.find((z) => z.id === pos.ancla);
    if (!otro) return;
    aplicar({ ...m, stickers: m.stickers.filter((z) => z.i !== x.i) });
    const nuevo = { ...x, x: pos.x, y: pos.y, i: undefined, _t: "n" + ++S.temp };
    aplicar({ ...otro, stickers: [...(otro.stickers || []), nuevo] });
    try {
      aplicar(await SRV.quitarSticker(mid, x.i));
      aplicar(await SRV.pegarSticker(otro.id, { u: x.u, x: pos.x, y: pos.y, r: x.r, s: x.s, l: 1 }));
    } catch (e) { aviso(mensajeError(e), 4500, "error"); }
  }

  /* — Dibujar en el chat, en vivo — */
  function entrarDibujo() {
    if (S.dibujo) return;
    panel(null);
    cerrarMenu();
    S.dibujo = { dedos: new Map(), trazo: null, mios: [] };
    raiz.classList.add("dibujando");
    lienzo.hidden = false;
    barraDibujo.hidden = false;
    if (!reducido()) barraDibujo.animate([{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], { duration: 280, easing: "cubic-bezier(.2,.9,.3,1.15)" });
    sonar("abrir");
  }
  function salirDibujo() {
    if (!S.dibujo) return false;
    terminarTrazo();
    S.dibujo = null;
    raiz.classList.remove("dibujando");
    lienzo.hidden = true;
    barraDibujo.hidden = true;
    sonar("cerrar");
    return true;
  }
  const enLista = (e) => { const r = lista.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top + lista.scrollTop]; };
  lienzo.addEventListener("pointerdown", (e) => {
    const D = S.dibujo;
    if (!D) return;
    lienzo.setPointerCapture?.(e.pointerId);
    D.dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (D.dedos.size === 1) D.inicio = { id: e.pointerId, p: enLista(e), t: Date.now() };
    else { // dos dedos: se desliza (y lo que apenas empezaba a dibujarse, no cuenta)
      if (D.trazo && D.trazo.p.length < 6) cancelarTrazo(); else terminarTrazo();
      D.inicio = null;
    }
  });
  lienzo.addEventListener("pointermove", (e) => {
    const D = S.dibujo;
    if (!D || !D.dedos.has(e.pointerId)) return;
    const antes = D.dedos.get(e.pointerId);
    D.dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (D.dedos.size > 1) { lista.scrollTop -= (e.clientY - antes.y) / D.dedos.size; pintarCapa(); return; }
    if (D.inicio && !D.trazo) empezarTrazo(D.inicio.p);
    if (D.trazo) agregarPunto(enLista(e));
  });
  for (const t of ["pointerup", "pointercancel"]) lienzo.addEventListener(t, (e) => {
    const D = S.dibujo;
    if (!D) return;
    D.dedos.delete(e.pointerId);
    if (D.inicio?.id === e.pointerId && !D.trazo && t === "pointerup") { empezarTrazo(D.inicio.p); } // un toquecito: un puntito
    if (!D.dedos.size) { terminarTrazo(); D.inicio = null; }
  });
  lienzo.addEventListener("wheel", (e) => { lista.scrollTop += e.deltaY; }, { passive: true });
  function empezarTrazo([cx, cy]) {
    const D = S.dibujo, a = anclaEn(cy), W = ancho();
    const t = { id: null, k: "d" + ++S.temp, local: true, mio: true, fin: false, ancla: a.id, top: a.top, c: S.color, a: S.grosor, p: [[Math.round(cx / W * 10000), Math.round(cy - a.top)]], enviados: 0, cadena: Promise.resolve(), el: null };
    D.trazo = t;
    S.trazos.set(t.k, t);
    t.reloj = setInterval(() => enviarTrazo(t), 45);
    pintarCapa();
  }
  function agregarPunto([cx, cy]) {
    const t = S.dibujo.trazo, W = ancho(), p = [Math.round(cx / W * 10000), Math.round(cy - t.top)], u = t.p[t.p.length - 1];
    if (Math.hypot((p[0] - u[0]) * W / 10000, p[1] - u[1]) < 2.2) return;
    t.p.push(p);
    if (t.p.length >= 1400) { terminarTrazo(); empezarTrazo([cx, cy]); return; }
    // Sólo se repinta este trazo (y sin rehacer todo).
    if (t.el) t.el.setAttribute("d", camino(t.p.map(([x, y]) => [Math.round(x * W / 100) / 100, t.top + y])));
    else pintarCapa();
  }
  function enviarTrazo(t, fin = false) {
    if (!fin && t.enviados >= t.p.length) return;
    t.cadena = t.cadena.then(async () => {
      const nuevos = t.p.slice(t.enviados), n = t.p.length;
      if (t.id == null) {
        const r = await SRV.trazoNuevo({ ancla: t.ancla, c: t.c, a: t.a, p: nuevos, fin });
        t.id = r.trazo.id;
        const otro = S.trazos.get(t.id); // ya había llegado por la escucha: se queda sólo éste
        if (otro && otro !== t) otro.el?.remove();
        S.trazos.delete(t.k);
        if (!t.borrar) S.trazos.set(t.id, t);
      } else if (nuevos.length || fin) await SRV.trazoMas(t.id, { p: nuevos, fin });
      t.enviados = n;
      if (t.borrar && t.id != null) { await SRV.trazoBorrar(t.id).catch(() => {}); }
    }).catch((e) => { if (!t.avisado) { t.avisado = true; aviso(mensajeError(e), 4500, "error"); } });
  }
  function terminarTrazo() {
    const D = S.dibujo, t = D?.trazo;
    if (!t) return;
    D.trazo = null;
    clearInterval(t.reloj);
    t.fin = true;
    enviarTrazo(t, true);
    t.cadena.then(() => { t.local = false; });
    D.mios.push(t);
    pintarCapa();
  }
  function cancelarTrazo() {
    const D = S.dibujo, t = D?.trazo;
    if (!t) return;
    D.trazo = null;
    clearInterval(t.reloj);
    t.borrar = true;
    t.el?.remove();
    S.trazos.delete(t.k);
    if (t.id != null) S.trazos.delete(t.id);
    enviarTrazo(t, true);
  }
  async function deshacerTrazo() {
    const D = S.dibujo;
    let t = D?.mios.pop();
    if (!t) { // los tuyos de antes: el más nuevo
      const mios = [...S.trazos.values()].filter((x) => x.mio && x.id != null).sort((a, b) => b.id - a.id);
      t = mios[0];
    }
    if (!t) { aviso("No hay dibujos tuyos para deshacer", 2400); return; }
    t.el?.remove();
    S.trazos.delete(t.id ?? t.k);
    pintarCapa();
    sonar("deshacer");
    await t.cadena?.catch(() => {});
    if (t.id != null) SRV.trazoBorrar(t.id).catch((e) => aviso(mensajeError(e), 4500, "error"));
  }
  async function masEspacio() {
    try {
      const m = await SRV.mandarMensaje({ espacio: 360 });
      if (!S.vivo) return;
      if (S.ms.some((x) => x.id === m.id)) aplicar(m); else recibir([m], [], true);
      requestAnimationFrame(() => { pintarCapa(); alFondo(true); });
      sonar("desplazar");
    } catch (e) { aviso(mensajeError(e), 4500, "error"); }
  }

  /* — El teclado del iPhone no tapa lo que escribes — */
  const vv = window.visualViewport;
  const ajustarVV = () => {
    const c = det.capa;
    if (!vv || !c) return;
    const h = Math.round(vv.height), t = Math.round(vv.offsetTop);
    if (Math.abs(h - innerHeight) < 2 && t <= 0) { c.style.top = c.style.height = c.style.bottom = ""; }
    else { c.style.top = t + "px"; c.style.height = h + "px"; c.style.bottom = "auto"; }
    if (S.pegado && !S.arrastre) alFondo(false);
  };
  vv?.addEventListener("resize", ajustarVV);
  vv?.addEventListener("scroll", ajustarVV);

  // Atrás (o Esc): primero se cierra lo que esté abierto encima del chat.
  det._chatAtras = () => cerrarMenu() || cerrarHoja() || salirDibujo() || panel(null);
  det._limpiezas.push(() => {
    S.vivo = false;
    P.ctl?.abort();
    vigia.disconnect();
    if (S.dibujo) { terminarTrazo(); S.dibujo = null; }
    for (const t of S.trazos.values()) clearInterval(t.reloj);
    document.removeEventListener("visibilitychange", alVolver);
    vv?.removeEventListener("resize", ajustarVV);
    vv?.removeEventListener("scroll", ajustarVV);
    if (S.menu) { S.menu.velo.remove(); S.menu.caja.remove(); S.menu = null; }
    if (S.hoja) { S.hoja.velo.remove(); S.hoja.h.remove(); S.hoja = null; }
    bote.remove();
    capaDet.querySelectorAll(".ch-fantasma").forEach((n) => n.remove());
    if (det.capa) det.capa.style.top = det.capa.style.height = det.capa.style.bottom = "";
    det._chatAtras = null;
  });
  // Si había un aviso de «te mandó mensajitos», ya no hace falta: aquí están.
  const av = app.avisoChat;
  if (av?.isConnected) { av.classList.remove("ver"); setTimeout(() => av.remove(), 300); }
  cargar();
  return raiz;
}
