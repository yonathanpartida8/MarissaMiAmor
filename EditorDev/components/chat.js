/**
 * MENSAJITOS — el chat de los dos (Fases 30, 31 y 34), dentro de Detallitos.
 *
 *   · como la foto (Fase 34): lila suavecito con corazoncitos dibujados; arriba sólo su foto y su nombre
 *     (con «Siempre juntos ∞»), videollamada y llamada (todavía no: «Ay ora jeje») y ⋮ (ajustes y
 *     privacidad); abajo los ánimos (todavía no hacen nada) y la barra: + (las cositas), escribir con 🙂,
 *     stickers, GIF y 🎤 (que se vuelve «mandar»)
 *   · burbujas nuevas: las tuyas lila con rosita, las suyas de vidrio blanco; al mandar, la tuya sale
 *     volando desde donde escribiste y aterriza con un rebotito y un brillo; las suyas llegan flotando
 *   · mantener presionado un mensajito (o clic derecho): reaccionar a lo suyo, y Editar, Copiar o
 *     Eliminar lo tuyo. Lo editado dice «Editado» abajito, sin tapar nada
 *   · mensajes de voz: tocar 🎤 graba (con sus ondas en vivo), y se escuchan en x1, x1.5, x2 y x3
 *   · stickers como en WhatsApp: «Stickers» son los que TÚ haces con tus fotos (favoritos arriba y luego
 *     los que más usas) y «Explorar stickers» los de GIPHY; GIFs: «GIFs favoritos» y «Explorar GIFs»;
 *     emojis, sólo emojis. Los stickers se pueden arrastrar y pegar donde sea, y tu amorcito los ve ahí
 *   · dibujar en el chat con el dedo: se ve EN VIVO del otro lado, y «+ Espacio» para tener más lugar
 *   · todo llega al instante: el chat se queda esperando al servidor (hasta 22 s) y contesta en cuanto
 *     cambia algo
 *   · todo lo que escriben se pone como TEXTO, nunca como HTML
 */
import { el, aviso, confirmar, debounce } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as G from "../integraciones/giphy.js";
import * as PF from "./perfil.js";
import { animosChat } from "./chat-animos.js";
import { REACCIONES, reaccion, svgReaccion, estallido } from "./reacciones.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { vibrar } from "../config/preferencias.js";
import * as PUSH from "../integraciones/avisos.js";
import * as VOZ from "./chat-voz.js";
import { elegirImagen, creadorSticker } from "./chat-sticker.js";

export const ICONO_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6c-5 0-9 3.3-9 7.4 0 2.3 1.3 4.4 3.4 5.8l-.8 3.6 3.9-2.1c.8.2 1.6.3 2.5.3 5 0 9-3.3 9-7.4S17 3.6 12 3.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 13.8s-2.8-1.6-3.4-3.3c-.4-1.3.4-2.5 1.6-2.5.8 0 1.4.5 1.8 1.1.4-.6 1-1.1 1.8-1.1 1.2 0 2 1.2 1.6 2.5-.6 1.7-3.4 3.3-3.4 3.3z" fill="currentColor"/></svg>';
const svg = (cuerpo, extra = "", vb = "0 0 24 24") => `<svg viewBox="${vb}" aria-hidden="true"${extra}>${cuerpo}</svg>`;
const LINEA = ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const CORAZON = "M12 20.3s-7.6-4.6-8.8-9.7C2.4 7.2 4.6 4.6 7.6 4.6c1.9 0 3.3 1.1 4.4 2.7 1.1-1.6 2.5-2.7 4.4-2.7 3 0 5.2 2.6 4.4 6-1.2 5.1-8.8 9.7-8.8 9.7z";
const ESTRELLA = "M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z";
const IC = {
  chevron: svg('<path d="m14.8 5.4-6.6 6.6 6.6 6.6"/>', ' fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'),
  video: svg('<rect x="2.6" y="6.2" width="12.6" height="11.6" rx="3.2"/><path d="m15.2 10.4 5.2-3v9.2l-5.2-3"/>', LINEA),
  tel: svg('<path d="M6.7 3.6h2.5l1.4 4-2 1.5a12.2 12.2 0 0 0 6.3 6.3l1.5-2 4 1.4v2.5a2 2 0 0 1-2.2 2A17.4 17.4 0 0 1 4.7 5.8a2 2 0 0 1 2-2.2z"/>', LINEA),
  puntos: svg('<circle cx="12" cy="5.6" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="18.4" r="1.9"/>', ' fill="currentColor"'),
  mas: svg('<path d="M12 5v14M5 12h14"/>', ' fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"'),
  carita: svg('<circle cx="12" cy="12" r="8.6"/><path d="M8.6 14.2c.9 1.3 2 1.9 3.4 1.9s2.5-.6 3.4-1.9"/><path d="M9.2 9.6v.8M14.8 9.6v.8"/>', LINEA),
  gato: svg('<path d="M5.3 9.6 4.8 4.6l3.8 2.6a8.8 8.8 0 0 1 6.8 0l3.8-2.6-.5 5A7.3 7.3 0 0 1 20 13.2c0 3.8-3.6 6.3-8 6.3s-8-2.5-8-6.3a7.3 7.3 0 0 1 1.3-3.6z"/><path d="M8.8 12.8q.8-.9 1.6 0M13.6 12.8q.8-.9 1.6 0M11 15.4q1 .7 2 0"/>', LINEA),
  mic: svg('<rect x="9" y="3.2" width="6" height="11" rx="3"/><path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6V21"/>', LINEA),
  enviar: svg('<path d="M3.6 10.9 19.4 4.3c.9-.4 1.8.5 1.4 1.4l-6.6 15.8c-.4.9-1.7.8-1.9-.1l-1.5-6.2-6.2-1.5c-.9-.2-1-1.5-.1-1.9z" fill="currentColor"/><path d="m11 13 4.2-4.2" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>'),
  palomita: svg('<path d="m5 12.6 4.4 4.4L19 7.4"/>', ' fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"'),
  lapiz: svg('<path d="m4 20 1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z"/><path d="m13.8 7 3.2 3.2"/>', LINEA),
  espacio: svg('<path d="M5 4.5h14M5 19.5h14M12 8v8M8.8 12.8 12 16l3.2-3.2"/>', LINEA),
  corazon: svg(`<path d="${CORAZON}"/>`, LINEA),
  lleno: svg(`<path d="${CORAZON}"/>`, ' fill="currentColor"'),
  estrella: svg(`<path d="${ESTRELLA}"/>`, LINEA),
  estrellaLlena: svg(`<path d="${ESTRELLA}"/>`, ' fill="currentColor"'),
  estrellaNo: svg(`<path d="${ESTRELLA}"/><path d="M4 4l16 16"/>`, LINEA),
  infinito: svg('<path d="M12 12c-2-2.6-3.4-3.8-5.2-3.8a3.8 3.8 0 0 0 0 7.6c1.8 0 3.2-1.2 5.2-3.8zm0 0c2 2.6 3.4 3.8 5.2 3.8a3.8 3.8 0 0 0 0-7.6c-1.8 0-3.2 1.2-5.2 3.8z"/>', LINEA),
  check: svg('<path d="M1.6 10.6 5 14l6.6-7.2M8.2 13.4l.6.6 6.6-7.2"/>', LINEA, "0 0 17 20"),
  bote: svg('<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8L17.5 7M10 10.5v6.5M14 10.5v6.5"/>', LINEA),
  brillo: svg('<path d="M12 3.5c.6 3.6 1.9 4.9 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.6 4.9-1.9 5.5-5.5zM18.5 14.5c.3 1.6.8 2.1 2.4 2.4-1.6.3-2.1.8-2.4 2.4-.3-1.6-.8-2.1-2.4-2.4 1.6-.3 2.1-.8 2.4-2.4z"/>', ' fill="currentColor"'),
  foto: svg('<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="3.4"/><circle cx="9" cy="10" r="1.8"/><path d="m4.4 17.4 4.8-4.6 3.4 3.2 2.6-2.4 4.6 4.2"/>', LINEA),
};
// Los ánimos (Happy, Sad, Hot, Hormonal): sus efectos viven en chat-animos.js.
const NUBE = "M11 30h19a6.5 6.5 0 0 0 .8-13A9 9 0 0 0 13.3 15 7.6 7.6 0 0 0 11 30z";
const ANIMOS = [
  { id: "happy", t: "Happy", s: svg(`<path d="${NUBE}" fill="#fff" stroke="#b49af5" stroke-width="1.8"/><path d="M15.4 22.6q1.3-1.6 2.6 0M22.4 22.6q1.3-1.6 2.6 0M18.4 25.4q1.6 1.4 3.2 0" fill="none" stroke="#6a4fb3" stroke-width="1.5" stroke-linecap="round"/><circle cx="14.2" cy="25.2" r="1.5" fill="#ffa8cc" opacity=".8"/><circle cx="26.4" cy="25.2" r="1.5" fill="#ffa8cc" opacity=".8"/><path d="M33.5 6.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM6.5 9l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#f4b3d0"/>`, "", "0 0 40 40") },
  { id: "sad", t: "Sad", s: svg(`<path d="${NUBE}" fill="#f1ecff" stroke="#9f86ea" stroke-width="1.8"/><path d="M15.4 21.6q1.3 1.1 2.6 0M22.4 21.6q1.3 1.1 2.6 0M18.4 26.2q1.6-1.3 3.2 0" fill="none" stroke="#5c46a3" stroke-width="1.5" stroke-linecap="round"/><path d="M29 27.6c1 1.4 1.5 2.3 1.5 3a1.5 1.5 0 0 1-3 0c0-.7.5-1.6 1.5-3z" fill="#86aaff"/><path d="M34 8l.6 1.4 1.4.6-1.4.6L34 12l-.6-1.4L32 10l1.4-.6z" fill="#c9b6ff"/>`, "", "0 0 40 40") },
  { id: "hot", t: "Hot", s: svg(`<defs><linearGradient id="chLlama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5f92"/><stop offset="1" stop-color="#ffb37a"/></linearGradient></defs><path d="M20 4c1.6 5 9.6 8.6 9.6 17A9.6 9.6 0 0 1 20 30.6 9.6 9.6 0 0 1 10.4 21c0-4.4 2.4-7.4 4.6-9 0 3 1.4 5 3.2 5.8-.8-5.2.6-10.4 1.8-13.8z" fill="url(#chLlama)"/><path d="M20 15c.9 2.6 4.6 4.4 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-2 1.1-3.5 2.2-4.3.1 1.4.7 2.3 1.5 2.7-.3-2.5.3-4.9.9-6.8z" fill="#ffd8b4" opacity=".75"/><circle cx="17.6" cy="23.6" r="1.1" fill="#7a2140"/><circle cx="22.4" cy="23.6" r="1.1" fill="#7a2140"/><path d="M18.9 26q1.1.9 2.2 0" fill="none" stroke="#7a2140" stroke-width="1.2" stroke-linecap="round"/>`, "", "0 0 40 34") },
  { id: "hormonal", t: "Hormonal", s: svg(`<path d="M12.6 10.6 11 5.4l4.4 3.4M27.4 10.6 29 5.4l-4.4 3.4" fill="#b08cff" stroke="#b08cff" stroke-width="1.2" stroke-linejoin="round"/><path d="M10.4 15 9.6 8.8l5.6 3.6a10.6 10.6 0 0 1 9.6 0l5.6-3.6-.8 6.2a10.4 10.4 0 0 1 1.9 6c0 5.8-5.1 9.6-11.5 9.6S8.5 26.8 8.5 21a10.4 10.4 0 0 1 1.9-6z" fill="#efe6ff" stroke="#a487f0" stroke-width="1.6"/><path d="M14.8 20.6q1.4-1.4 2.8 0M22.4 20.6q1.4-1.4 2.8 0M18.2 24.2q1.8 1.5 3.6 0" fill="none" stroke="#5c46a3" stroke-width="1.5" stroke-linecap="round"/><path d="M29.6 33s-3.2-1.9-3.2-4a1.7 1.7 0 0 1 3.2-.9 1.7 1.7 0 0 1 3.2.9c0 2.1-3.2 4-3.2 4z" fill="#ff7aa8"/>`, "", "0 0 40 36") },
];
const I = (n, t) => `${ico(n)}<span>${t}</span>`;
const I2 = (s, t) => `<i class="ch-i">${s}</i><span>${t}</span>`;
const SEGUIDOS = 4 * 60 * 1000;
// Stickers cute de verdad (y nada de los viejitos): sus etiquetas buscan lo más tierno de GIPHY.
const ETIQUETAS = {
  stickers: [["Milk & Mocha", "milk and mocha"], ["Bubu Dudu", "bubu dudu"], ["Mochi", "mochi cat"], ["Ositos", "cute bear love"], ["Gatitos", "kawaii cat"], ["Corazones", "kawaii heart"], ["Besitos", "cute kiss"], ["Abrazos", "cute hug"]],
  gifs: [["Te amo", "te amo"], ["Te extraño", "te extraño"], ["Abrazo", "cute hug"], ["Beso", "cute kiss"], ["Buenas noches", "buenas noches"], ["Jaja", "jaja"], ["Cute", "cute love"]],
};
const VISTAS = { stickers: [["mios", "Stickers"], ["explorar", "Explorar stickers"]], gifs: [["mios", "GIFs favoritos"], ["explorar", "Explorar GIFs"]] };
const PISTAS = {
  "stickers:mios": "Toca para mandarlo · mantenlo para favoritos o arrástralo al chat",
  "stickers:explorar": "Toca para mandarlo · mantenlo y arrástralo para pegarlo donde quieras",
  "gifs:mios": "Toca para mandarlo · mantenlo para quitarlo de favoritos",
  "gifs:explorar": "Toca para mandarlo · mantenlo para guardarlo en favoritos",
  "emojis:emojis": "Toca uno para ponerlo en tu mensajito",
};
const EMOJIS = "🥰 😍 😘 🥺 🥹 😊 🤭 😳 😂 🤣 😭 😴 😇 😈 🙈 🤗 🫶 🤍 💜 💗 💖 💕 💞 💘 💝 💌 ❤️‍🔥 💋 😚 😙 🫠 🤤 😌 🥲 😮‍💨 😤 🙄 😏 🤫 🫣 👀 🙃 ✨ 🌸 🌷 🌹 💐 🦋 🎀 🧸 🐻 🐱 🐰 🐶 🐣 🍓 🍒 🍰 🍫 🍩 ☕ 🧋 🌙 ⭐ 🌈 ☁️ 🔥 🎁 🎶 📸 💍 👑 🫧 🤞 🙏 👏 💪".split(" ");
const ELIMINADO = "Aquí se eliminó un mensajito, tal vez foto o algo más";
const PRIMEROS = ["Te amo 💜", "Te extraño 🥺", "¿Cómo amaneciste, mi amor?", "Buenas noches, mi vida 🌙"];
const COLORES = ["#a57cff", "#ff6fa8", "#6fb6ff", "#5fd3a7", "#ffb04d", "#e0325f"];
const GROSORES = [3, 6, 11];
const NUEVOS_DESDE = 2018; // los stickers subidos antes se ven viejitos: no salen

/* — Ajustes de este aparato (los de privacidad viven en el servidor) — */
const CLAVE = "editordev:chat";
const BASE = { sonidos: true, teclado: true, avisos: true, fondo: true, grande: false, vel: 1 };
export function prefChat() {
  try { return { ...BASE, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; } catch (e) { return { ...BASE }; }
}
const guardarPref = (p) => { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch (e) { /* sin guardar */ } };

const real = (m) => typeof m.id === "number";
const orden = (a, b) => (real(a) ? 0 : 1) - (real(b) ? 0 : 1) || (real(a) && real(b) ? a.id - b.id : 0);
const firmaBurbuja = (m) => JSON.stringify([!!m.borrado, m.texto, m.gif?.u, m.audio?.u, m.espacio, (m.stickers || []).filter((s) => !s.l).length]);
const firma = (m) => JSON.stringify([!!m.borrado, m.texto, m.gif?.u, m.audio?.u, m.reaccion, m.visto, m.editado, m.espacio, (m.stickers || []).map((s) => [s.i, s.x, s.y, s.s])]);
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
/** El fondo: corazoncitos lilas dibujados a mano, brillitos y «Tú y yo siempre». */
function fondoDibujado() {
  const c = (x, y, t, r, o = 1) => el("i.ch-doodle", { style: { left: x, top: y, width: t + "px", height: t + "px", transform: `rotate(${r}deg)`, opacity: o }, html: IC.corazon });
  const b = (x, y, t, o = 1) => el("i.ch-doodle.brillo", { style: { left: x, top: y, width: t + "px", height: t + "px", opacity: o }, html: IC.brillo });
  return el("div.ch-fondo", { "aria-hidden": "true" }, [
    c("5%", "5%", 44, -12), c("13%", "30%", 30, 8, 0.75), c("83%", "5%", 24, 10, 0.7), c("79%", "44%", 50, 14), c("6%", "72%", 38, -8, 0.85),
    c("45%", "2%", 16, -6, 0.6), c("62%", "88%", 20, 12, 0.6), c("91%", "68%", 18, -14, 0.6),
    b("50%", "79%", 22), b("27%", "14%", 14, 0.7), b("88%", "27%", 16, 0.8),
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
    editando: null, grabando: null, blobs: [],
  };
  const capaDet = det.capa;
  const flota = (n) => { capaDet.append(n); return n; }; // lo que va encima (menús, el sticker que arrastras): fuera de lo que se anima
  const M = (u) => SRV.media(u);

  /* — Arriba: sólo su foto y su nombre — */
  const atras = el("button.ch-atras", { type: "button", "aria-label": "Atrás", html: IC.chevron, onClick: () => det.atras() });
  const ahoraNo = (b) => { aviso("Ay ora jeje", 2600); if (!reducido()) b.animate([{ transform: "rotate(0)" }, { transform: "rotate(-12deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(0)" }], { duration: 480 }); };
  const bVideo = el("button.ch-cab-b", { type: "button", "aria-label": "Videollamada", html: IC.video, onClick: () => ahoraNo(bVideo) });
  const bTel = el("button.ch-cab-b", { type: "button", "aria-label": "Llamar", html: IC.tel, onClick: () => ahoraNo(bTel) });
  const bPuntos = el("button.ch-cab-b", { type: "button", "aria-label": "Ajustes y privacidad del chat", "aria-haspopup": "menu", html: IC.puntos, onClick: () => hojaAjustes() });
  const cab = el("header.ch-cab", {}, [
    atras,
    pa ? PF.avatar("pareja", "ch-cab-av") : el("span.av.ch-cab-av"),
    el("div.ch-cab-t", {}, [
      el("b.ch-cab-nombre", { text: nombre }),
      el("span.ch-juntos", {}, [el("i", { html: IC.lleno }), el("span", { text: "Siempre juntos" }), el("i.inf", { html: IC.infinito })]),
    ]),
    el("div.ch-cab-acc", {}, [bVideo, bTel, bPuntos]),
  ]);

  /* — La lista (con su capa de dibujos y stickers libres) — */
  const lista = el("div.ch-lista", { role: "log", "aria-label": `Chat con ${nombre}`, "aria-live": "polite" });
  const inicio = el("div.ch-inicio");
  const fin = el("div.ch-fin", { "aria-hidden": "true" });
  const trazosSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  trazosSvg.setAttribute("class", "ch-trazos");
  const capa = el("div.ch-capa", { "aria-hidden": "true" }, [trazosSvg]);
  const vacio = el("div.ch-vacio", {}, [
    el("i.ch-vacio-ico", { html: ICONO_CHAT }),
    el("b", { text: "Su chat empieza aquí" }),
    el("p", { text: `Mándale el primer mensajito a ${nombre}: texto, un audio, un GIF, un sticker o un dibujito.` }),
    el("div.ch-sugeridos", {}, PRIMEROS.map((t) => el("button.ch-sugerido", { type: "button", text: t, onClick: () => { input.value = t; alEscribir(); input.focus(); } }))),
  ]);
  const bajarT = el("span");
  const bajar = el("button.ch-bajar", { type: "button", hidden: "", "aria-label": "Ir a lo más nuevo", onClick: () => alFondo(true) }, [el("i", { html: ico("abajo") }), bajarT]);
  const lienzo = el("div.ch-lienzo", { hidden: "", "aria-label": "Dibuja aquí con un dedo; con dos, desliza" });
  const fondo = fondoDibujado();
  const marco = el("div.ch-marco", {}, [fondo, lista, lienzo, bajar]);

  /* — Los ánimos: tocas uno y se enciende; otra vez, y se apaga — */
  const animos = el("div.ch-animos", { role: "group", "aria-label": "Cómo te sientes" }, ANIMOS.map((a) => {
    const b = el("button.ch-animo", { type: "button", "aria-label": a.t, "aria-pressed": "false", dataset: { a: a.id } }, [el("i", { html: a.s }), el("span", { text: a.t })]);
    b.addEventListener("click", () => {
      const ya = AN.poner(a.id);
      for (const x of animos.children) { x.classList.toggle("activo", x.dataset.a === ya); x.setAttribute("aria-pressed", String(x.dataset.a === ya)); }
      if (!reducido()) b.animate([{ transform: "scale(1)" }, { transform: "scale(.9) rotate(-3deg)" }, { transform: "scale(1.06) rotate(2deg)" }, { transform: "scale(1)" }], { duration: 420, easing: "ease-out" });
    });
    return b;
  }));

  /* — Escribir (y editar, y grabar audios) — */
  const input = el("textarea.ch-input", { rows: 1, maxlength: 2000, placeholder: "Escribe un mensaje...", "aria-label": "Tu mensajito", enterkeyhint: "send", autocomplete: "off", onInput: () => alEscribir() });
  const bMas = el("button.ch-mas", { type: "button", "aria-label": "Más cositas", "aria-haspopup": "menu", html: IC.mas, onClick: () => hojaMas() });
  const bEmoji = el("button.ch-emoji-b", { type: "button", "aria-label": "Emojis", html: IC.carita, onClick: () => panel("emojis") });
  const bSt = el("button.ch-b.ch-b-st", { type: "button", "aria-label": "Stickers", html: IC.gato, onClick: () => panel("stickers") });
  bSt.querySelector("svg").insertAdjacentHTML("beforeend", `<path class="ch-b-cor" d="M18.6 21.6s-2.6-1.5-2.6-3.3a1.4 1.4 0 0 1 2.6-.8 1.4 1.4 0 0 1 2.6.8c0 1.8-2.6 3.3-2.6 3.3z"/>`);
  const bGif = el("button.ch-b.ch-b-gif", { type: "button", "aria-label": "GIFs", html: "<b>GIF</b>", onClick: () => panel("gifs") });
  const bMandar = el("button.ch-mandar", { type: "button", "aria-label": "Mensaje de voz", html: `<i class="ch-ic-mic">${IC.mic}</i><i class="ch-ic-env">${IC.enviar}</i><i class="ch-ic-ok">${IC.palomita}</i>`, onClick: () => alMandar() });
  // Tocar «Mandar» no le quita el teclado al campo (en el teléfono se queda abierto para seguir escribiendo).
  bMandar.addEventListener("mousedown", (e) => e.preventDefault());
  const grabT = el("span.ch-grab-t", { text: "0:00" });
  const grabOndas = el("div.ch-grab-ondas", { "aria-hidden": "true" }, Array.from({ length: 30 }, () => el("i")));
  const grabBar = el("div.ch-grabando", { hidden: "", role: "group", "aria-label": "Grabando un mensaje de voz" }, [
    el("button.ch-grab-x", { type: "button", "aria-label": "Tirar el audio", html: IC.bote, onClick: () => cancelarGrabacion() }),
    el("span.ch-grab-punto", { "aria-hidden": "true" }), grabT, grabOndas,
    el("button.ch-grab-si", { type: "button", "aria-label": "Mandar el audio", html: IC.enviar, onClick: () => terminarGrabacion() }),
  ]);
  const escribir = el("div.ch-escribir", {}, [bMas, el("div.ch-caja", {}, [input, bEmoji]), bSt, bGif, bMandar, grabBar]);
  const editT = el("span.ch-editando-t");
  const editBar = el("div.ch-editando", { hidden: "" }, [
    el("i", { html: IC.lapiz }), el("span.ch-editando-in", {}, [el("b", { text: "Editando tu mensajito" }), editT]),
    el("button.ch-editando-x", { type: "button", "aria-label": "Cancelar la edición", html: ico("cerrar"), onClick: () => dejarDeEditar() }),
  ]);

  /* — Stickers (los tuyos y explorar), GIFs (favoritos y explorar) y emojis — */
  const P = { tipo: "", vista: "", q: "", sig: 0, total: 0, cargando: false, ctl: null };
  const COL = { stickers: null, gifs: null, pide: null };
  const nodosCol = new Map();
  const tabsN = el("div.ch-tabs", { role: "tablist" });
  const tituloP = el("b.ch-panel-titulo", { text: "Emojis" });
  const buscar = el("input.ch-buscar", { type: "search", enterkeyhint: "search", autocomplete: "off", "aria-label": "Buscar en GIPHY" });
  const buscarCaja = el("label.ch-buscar-caja", {}, [el("i", { html: ico("buscar") }), buscar]);
  const chips = el("div.ch-chips");
  const rejilla = el("div.ch-rejilla");
  const pista = el("small.ch-pista");
  const giphyMarca = el("small.ch-giphy", { text: "Con GIPHY" });
  const panelN = el("div.ch-panel", { hidden: "", role: "dialog", "aria-label": "Stickers, GIFs y emojis" }, [
    el("div.ch-panel-cab", {}, [tabsN, tituloP, el("button.ch-panel-x", { type: "button", "aria-label": "Cerrar", html: ico("cerrar"), onClick: () => panel(null) })]),
    buscarCaja, chips, rejilla,
    el("div.ch-panel-pie", {}, [pista, giphyMarca]),
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
  const raiz = el("section.dt-pantalla.ch" + (PR.fondo ? "" : ".sin-fondo") + (PR.grande ? ".letra-grande" : ""), {}, [cab, marco, animos, panelN, barraDibujo, editBar, escribir]);
  // El color de cada quien en «Hormonal» sale del género que eligió en su perfil (sólo «Mujer» es rosa).
  const generoDe = (mio) => (mio ? PF.datos().yo?.genero : det.amor?.pareja?.genero ?? PF.datos().pareja?.genero) || "";
  const AN = animosChat({ raiz, marco, lista, tono: (mio) => (generoDe(mio) === "Mujer" ? "rosa" : "carmesi") });

  /**
   * Mantener presionado (o clic derecho) hace `al()`; un toque normal sigue siendo un toque.
   * Mientras se aprieta, se hunde un poquito (la clase `apretando`).
   */
  function presionLarga(n, al, ms = 420) {
    let t = 0, x0 = 0, y0 = 0;
    const fuera = () => { clearTimeout(t); t = 0; n.classList.remove("apretando"); };
    n.addEventListener("pointerdown", (e) => {
      n._largo = false;
      if (e.button > 0 || S.dibujo || S.arrastre) return;
      x0 = e.clientX; y0 = e.clientY;
      n.classList.add("apretando");
      t = setTimeout(() => { t = 0; n.classList.remove("apretando"); n._largo = true; sinToqueAlSoltar(e); vibrar(14); al(); }, ms);
    });
    n.addEventListener("pointermove", (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 9) fuera(); });
    for (const k of ["pointerup", "pointercancel", "pointerleave"]) n.addEventListener(k, fuera);
    n.addEventListener("contextmenu", (e) => { e.preventDefault(); if (n._largo || S.arrastre) return; fuera(); n._largo = true; al(); });
    // Lo que se apretó largo no cuenta también como toque (ni en los botoncitos de adentro).
    n.addEventListener("click", (e) => { if (n._largo) { n._largo = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }

  /**
   * Al soltar el dedo después de mantenerlo, el teléfono manda un «toque» donde quedó el dedo: si ahí ya
   * está el menú (o su velo), ese toque lo cerraría. Se le quita al soltar.
   */
  function sinToqueAlSoltar(e) {
    if (e.pointerType !== "touch") return;
    addEventListener("touchend", (t) => { if (t.cancelable) t.preventDefault(); }, { capture: true, passive: false, once: true });
  }

  /* — Una burbuja — */
  function nodo(m) {
    if (m.espacio) {
      return el("div.ch-espacio", { dataset: { id: String(m.id) }, style: { height: m.espacio + "px" } }, [
        el("span.ch-espacio-t", {}, [el("i", { html: IC.lapiz }), el("span", { text: "Espacio para dibujar" })]),
        m.mio ? el("button.ch-espacio-x", { type: "button", html: I("borrar", "Quitar"), onClick: () => borrar(m, "este espacio") }) : null,
      ]);
    }
    if (m.borrado) {
      // Lo que se eliminó deja su huellita (para los dos): sin menú, sólo el aviso.
      return el("div.ch-fila.borrado." + (m.mio ? "mio" : "suyo"), { dataset: { id: String(m.id) } }, [
        el("div.ch-cuerpo", {}, [el("div.ch-burbuja.eliminado", { role: "note" }, [el("i", { html: IC.bote }), el("span", { text: ELIMINADO })]), el("small.ch-hora")]),
      ]);
    }
    const rx = reaccion(m.reaccion), st = !!m.gif?.s, em = !m.gif && !m.audio && soloEmoji(m.texto);
    const que = m.audio ? `un mensaje de voz de ${VOZ.minutos(m.audio.dur)}` : m.texto || (st ? "un sticker" : "un GIF");
    const b = el("div.ch-burbuja" + (m.audio ? ".audio" : m.gif ? (st ? ".sticker" : ".gif") : "") + (em ? ".emoji" : ""), {
      tabindex: "0", role: m.audio ? "group" : "button", "aria-haspopup": "menu", "aria-label": `${m.mio ? "Tú" : nombre}: ${que}${rx ? ", " + rx.corto : ""}. Mantén presionado para ver opciones.`,
    });
    if (m.audio) {
      b.append(VOZ.reproductor(m.audio, {
        url: M(m.audio.u), vel: () => PR.vel || 1, alVel: (v) => { PR.vel = v; guardarPref(PR); }, alSonar: () => sonar("audio-play"),
        alError: () => aviso("Ese audio no se pudo escuchar ahora.", 3500, "error"),
      }));
    }
    if (m.gif) {
      const k = st ? Math.min(1, 150 / m.gif.w, 150 / m.gif.h) : Math.min(1, 240 / m.gif.w, 260 / m.gif.h);
      const im = el("img." + (st ? "ch-st-img" : "ch-gif"), { src: M(m.gif.u), alt: st ? "Sticker" : "GIF", width: Math.round(m.gif.w * k), height: Math.round(m.gif.h * k), decoding: "async", referrerpolicy: "no-referrer", draggable: "false" });
      im.addEventListener("load", () => { if (S.pegado) alFondo(false); }, { once: true });
      b.append(im);
    }
    if (m.texto) b.append(el("span.ch-texto", { text: m.texto }));
    const pegados = (m.stickers || []).filter((x) => !x.l);
    if (pegados.length) b.append(el("span.ch-pegados", { "aria-hidden": "true" }, pegados.map((x) => {
      const i = el("img.ch-sticker", { src: M(x.u), alt: "", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" });
      i.style.left = (x.x * 100).toFixed(1) + "%"; i.style.top = (x.y * 100).toFixed(1) + "%";
      i.style.setProperty("--r", (+x.r || 0) + "deg"); i.style.setProperty("--s", +x.s || 1);
      return i;
    })));
    const f = el("div.ch-fila." + (m.mio ? "mio" : "suyo") + (m._enviando ? ".enviando" : "") + (st ? ".con-sticker" : ""), { dataset: { id: String(m.id) } }, [
      el("div.ch-cuerpo", {}, [b, el("small.ch-hora")]),
    ]);
    ponerRx(f, m);
    presionLarga(b, () => { const x = deFila(f); if (x && real(x)) abrirMenu(x, f); });
    b.addEventListener("keydown", (e) => {
      if (e.target !== b || !["Enter", " ", "ContextMenu"].includes(e.key)) return;
      e.preventDefault();
      const x = deFila(f);
      if (x && real(x)) abrirMenu(x, f, true);
    });
    b.addEventListener("click", () => enseñarPista());
    return f;
  }
  /** La primera vez que tocan un mensajito: cómo se abren sus opciones. */
  const PISTA_MENU = "editordev:chat-pista-menu";
  function enseñarPista() {
    try { if (localStorage.getItem(PISTA_MENU)) return; localStorage.setItem(PISTA_MENU, "1"); } catch (e) { return; }
    aviso("Mantén presionado un mensajito para editarlo, copiarlo o eliminarlo 💜", 3600);
  }
  /** La reacción, en su lugar (sin rehacer la burbuja). */
  function ponerRx(f, m, animar = false) {
    const b = f?.querySelector(".ch-burbuja"), rx = reaccion(m.reaccion);
    if (!b) return;
    b.querySelector(".ch-rx")?.remove();
    f.classList.toggle("con-rx", !!rx);
    if (rx) b.append(el("span.ch-rx" + (animar ? ".nueva" : ""), { title: m.mio ? `${nombre} ${rx.largo}` : rx.tuyo, html: svgReaccion(rx.id) }));
  }
  /** Abajito de la burbuja: «Editado», la hora y ✓✓ (lilas cuando ya lo vio). */
  function ponerHora(f, m) {
    const n = f.querySelector(".ch-hora");
    if (!n) return;
    const t = m._enviando ? "Enviando…" : hora(m.creado), visto = !!(m.mio && m.visto), ed = !!m.editado;
    const k = t + visto + ed;
    f.classList.toggle("editado", ed);
    if (n._k === k) return;
    n._k = k;
    n.replaceChildren(...(ed ? [el("em.ch-editado", { text: "Editado" })] : []), el("span", { text: t }),
      ...(m.mio && !m._enviando && !m.borrado ? [el("i.ch-check" + (visto ? ".visto" : ""), { title: visto ? "Visto" : "Enviado", html: IC.check })] : []));
  }

  /** Pone la lista al día moviendo sólo lo que cambió (lo que ya está no se vuelve a animar ni a cargar). */
  function pintar() {
    if (S.extraFin && !S.arrastre && S.ms.length !== S.nExtra) S.extraFin = 0;
    S.nExtra = S.ms.length;
    const hijos = [inicio];
    let prev = null;
    S.ms.forEach((m, i) => {
      const dk = diaDe(m.creado);
      if (!prev || diaDe(prev.creado) !== dk) {
        let d = S.dias.get(dk);
        if (!d) S.dias.set(dk, (d = el("div.ch-dia", {}, [el("span", { text: nombreDia(m.creado) })])));
        hijos.push(d);
        prev = null;
      }
      let f = S.nodos.get(m.id);
      if (!f) { f = nodo(m); S.nodos.set(m.id, f); }
      if (S.nuevos.delete(m.id) && !reducido()) { f.classList.add("llega"); setTimeout(() => f.classList.remove("llega"), 1000); }
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
      if (!real(m) || m.borrado) continue; // (a lo eliminado no se le pega nada)
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
    // Lo que se pegó o dibujó DEBAJO de un mensajito (más allá de su orilla) le aparta su lugar: así el
    // mensaje que llegue después se pone abajo de eso, en su orden, y no encima (Fase 36).
    const alto = (id) => S.nodos.get(id)?.offsetHeight || 0, ext = new Map();
    const extender = (id, y) => { if (y > alto(id) + 24) ext.set(id, Math.max(ext.get(id) || 0, y)); };
    for (const [, t] of S.trazos) if (t.ancla && t.p.length) { let my = -1e9; for (const [, y] of t.p) my = Math.max(my, y); extender(t.ancla, my + t.a); }
    for (const m of S.ms) for (const x of m.stickers || []) if (x.l) extender(m.id, x.y + 56 * (+x.s || 1));
    for (const m of S.ms) {
      const f = S.nodos.get(m.id);
      if (!f) continue;
      const e = ext.get(m.id), k = e ? Math.round(e - f.offsetHeight + 8) + "px" : "";
      if (f.style.marginBottom !== k) f.style.marginBottom = k;
    }
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
        const L = x.x * W, T = top + x.y, src = M(x.u);
        n = [...capa.querySelectorAll("img.ch-libre")].find((z) => !vistos.has(z.dataset.k) && z.getAttribute("src") === src && !S.ms.some((mm) => (mm.stickers || []).some((y) => y.l && mm.id + ":" + (y.i || y._t) === z.dataset.k)) && Math.abs(parseFloat(z.style.left) - L) < 3 && Math.abs(parseFloat(z.style.top) - T) < 3);
        if (n) n.dataset.k = k;
        else {
          n = el("img.ch-libre" + (x.mio ? ".mio" : "") + (x._nuevo ? ".nuevo" : ""), { src, alt: "", decoding: "async", referrerpolicy: "no-referrer", draggable: "false", dataset: { k } });
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
    const falta = Math.max(0, Math.round(abajo + 24 - base)) + (S.extraFin || 0);
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
      cargarColeccion().catch(() => {}); // tus stickers y GIFs favoritos, listos para cuando abras el panel
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

  /** Lo que llegó (nuevos) y lo que cambió (reacciones, ediciones, stickers, vistos, borrados). */
  function recibir(nuevos, cambios, propio = false) {
    const pegado = cerca();
    let llegaron = 0, suyo = false;
    const deEl = [];
    for (const m of nuevos) {
      if ((m.borrado && m.espacio) || S.nodos.has(m.id) || S.ms.some((x) => x.id === m.id)) continue;
      // Tu mensajito llegó por aquí antes que la respuesta de «mandar»: la burbuja que ya se ve pasa a ser ésa.
      const t = m.mio && S.ms.find((x) => x._enviando && !x._real && x.texto === m.texto && (x.gif?.u || "") === (m.gif?.u || "") && (x.audio ? x.audio._u || "?" : "") === (m.audio?.u || ""));
      if (t) { adoptar(t, m); continue; }
      S.ms.push(m); S.nuevos.add(m.id); llegaron++;
      if (!m.mio && !m.espacio && !m.borrado) { suyo = true; deEl.push(m.id); }
    }
    S.ms.sort(orden);
    S.ultimo = Math.max(S.ultimo, ...S.ms.filter(real).map((m) => m.id));
    for (const c of cambios) {
      const a = S.ms.find((m) => m.id === c.id);
      if (!a) continue;
      if (c.borrado) {
        const nuevo = !a.borrado && !a.espacio && !c.espacio;
        marcarEliminado(c);
        if (nuevo && !(c.mio ?? a.mio)) { aviso(`${nombre} eliminó un mensajito`, 3200); sonar("mensaje-borrar"); }
        continue;
      }
      if (firma(a) === firma(c)) continue;
      const editado = c.editado && c.editado !== a.editado && c.texto !== a.texto;
      aplicar(c, false);
      if (editado && !c.mio) entintar(c.id);
      if (c.mio && c.reaccion && c.reaccion !== a.reaccion) festejar(c);
      const st = c.stickers || [];
      if (st.length > (a.stickers || []).length && !st[st.length - 1].mio) sonar("sticker-pegar");
    }
    pintar();
    for (const id of deEl) AN.llego(S.nodos.get(id));
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
      if (viejo?.isConnected) { for (const k of ["primero", "ultimo"]) n.classList.toggle(k, viejo.classList.contains(k)); n.classList.toggle("con-rx", !!reaccion(m.reaccion)); viejo.replaceWith(n); }
    } else if (m.reaccion !== antes.reaccion) ponerRx(S.nodos.get(m.id), m, !!m.reaccion);
    if (repintar) pintar();
  }
  /** Un mensajito que se fue (borrado aquí o del otro lado): se encoge, se desvanece y su lugar se cierra. */
  function quitar(id) {
    const f = S.nodos.get(id);
    S.ms = S.ms.filter((m) => m.id !== id);
    S.nodos.delete(id);
    if (S.editando?.id === id) dejarDeEditar();
    if (!f?.isConnected || reducido()) { pintar(); return; }
    const c = f.querySelector(".ch-cuerpo") || f, h = f.offsetHeight;
    f.style.pointerEvents = "none";
    c.animate([{ opacity: 1, transform: "none", filter: "blur(0)" }, { opacity: 0, transform: "scale(.62) translateY(-6px)", filter: "blur(6px)" }], { duration: 320, easing: "cubic-bezier(.4, 0, .6, 1)", fill: "forwards" }).onfinish = () => {
      if (!f.isConnected) return pintar();
      f.style.overflow = "hidden";
      f.animate([{ height: h + "px", marginTop: getComputedStyle(f).marginTop }, { height: "0px", marginTop: "0px" }], { duration: 220, easing: "ease-in-out", fill: "forwards" }).onfinish = () => pintar();
    };
  }
  /** Un mensajito eliminado (aquí o del otro lado): se desvanece y en su lugar queda su burbujita. */
  function marcarEliminado(c) {
    const a = S.ms.find((x) => x.id === c.id);
    if (!a || a.borrado) return;
    if (S.editando?.id === c.id) dejarDeEditar();
    if (a.espacio || c.espacio) { quitar(c.id); return; }
    const t = { id: c.id, mio: c.mio ?? a.mio, creado: c.creado || a.creado, borrado: true, texto: "", gif: null, audio: null, stickers: [], reaccion: "", visto: a.visto, editado: "" };
    const cuerpo = S.nodos.get(c.id)?.querySelector(".ch-cuerpo");
    const poner = () => {
      aplicar(t);
      const n = S.nodos.get(c.id)?.querySelector(".ch-cuerpo");
      if (n && !reducido()) n.animate([{ opacity: 0, transform: "scale(.86)", filter: "blur(3px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 380, easing: "cubic-bezier(.2, .9, .3, 1.2)" });
    };
    if (cuerpo?.isConnected && !reducido()) cuerpo.animate([{ opacity: 1, transform: "none", filter: "blur(0)" }, { opacity: 0, transform: "scale(.7)", filter: "blur(6px)" }], { duration: 260, easing: "ease-in", fill: "forwards" }).onfinish = poner;
    else poner();
  }
  function festejar(m) {
    sonar("reaccion-" + m.reaccion);
    const r = S.nodos.get(m.id)?.querySelector(".ch-rx")?.getBoundingClientRect();
    const l = lista.getBoundingClientRect();
    if (r && r.bottom > l.top && r.top < l.bottom) estallido(r.left + r.width / 2, r.top + r.height / 2, m.reaccion);
  }
  /** Un mensajito recién editado: se «vuelve a escribir» con un brillito. */
  function entintar(id) {
    const b = S.nodos.get(id)?.querySelector(".ch-burbuja");
    if (!b || reducido()) return;
    b.animate([{ transform: "scale(.95)", filter: "blur(1.5px)", opacity: 0.6 }, { transform: "scale(1.03)", filter: "blur(0)", opacity: 1, offset: 0.6 }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.2, .9, .3, 1)" });
    b.classList.add("brilla");
    setTimeout(() => b.classList.remove("brilla"), 1100);
  }

  /* — Mandar — */
  function alEscribir() {
    input.style.height = "auto";
    input.style.height = Math.min(124, input.scrollHeight) + "px";
    const hay = !!input.value.trim();
    escribir.classList.toggle("con-texto", hay);
    bMandar.setAttribute("aria-label", S.editando ? "Guardar el cambio" : hay ? "Mandar" : "Mensaje de voz");
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
    else if (e.key === "Escape" && S.editando) { e.preventDefault(); dejarDeEditar(); }
  });
  // Al irse el teclado, la pantalla vuelve a su lugar (el iPhone a veces la deja corrida).
  input.addEventListener("blur", () => setTimeout(() => { if ((scrollY || scrollX) && document.activeElement !== input) scrollTo(0, 0); }, 260));
  input.addEventListener("focus", () => { if (!panelN.hidden && P.tipo !== "emojis") panel(null); if (S.pegado) setTimeout(() => alFondo(false), 260); });
  function alMandar() {
    if (S.grabando) return;
    if (input.value.trim()) return mandarTexto();
    if (S.editando) { input.focus(); return; }
    empezarGrabacion();
  }
  function mandarTexto() {
    const t = input.value.trim();
    if (!t) { input.focus(); return; }
    if (S.editando) { guardarEdicion(t); return; }
    input.value = ""; alEscribir();
    mandar({ texto: t });
  }
  /** La burbuja de «enviando…», mientras el servidor contesta. */
  function burbujaNueva(datos) {
    const t = { id: "t" + ++S.temp, mio: true, texto: "", gif: null, audio: null, ...datos, creado: new Date().toISOString(), visto: "", reaccion: "", editado: "", stickers: [], _enviando: true };
    S.ms.push(t); S.ms.sort(orden); S.listo = true;
    pintar(); alFondo(false);
    volar(S.nodos.get(t.id));
    AN.mando(S.nodos.get(t.id));
    return t;
  }
  function noSeMando(t, e) {
    S.nodos.get(t.id)?.remove();
    S.nodos.delete(t.id);
    S.ms = S.ms.filter((x) => x !== t);
    pintar();
    if (t.texto && !input.value) { input.value = t.texto; alEscribir(); }
    aviso(mensajeError(e), 5000, "error");
    sonar("error");
  }
  async function mandar({ texto = "", gif = null }) {
    const t = burbujaNueva({ texto, gif });
    sonar("mensaje-enviar");
    try {
      const m = await SRV.mandarMensaje({ texto, gif });
      if (!S.vivo) return true;
      if (!t._real) adoptar(t, m);
      return true;
    } catch (e) { noSeMando(t, e); return false; }
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
  /**
   * Tu mensajito sale volando desde donde lo escribiste: hace una curvita, aterriza con un rebotito
   * (se aplasta tantito, como gelatina), deja un halo lila y salen corazoncitos del botón.
   */
  function volar(f) {
    if (!f || reducido()) return;
    const c = f.querySelector(".ch-cuerpo"), b = f.querySelector(".ch-burbuja"), h = f.querySelector(".ch-hora");
    const rb = b.getBoundingClientRect(), ri = escribir.getBoundingClientRect();
    const dx = ri.left + Math.min(rb.width / 2 + 60, ri.width / 2) - (rb.left + rb.width / 2), dy = ri.top + ri.height / 2 - (rb.top + rb.height / 2);
    c.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: 0, filter: "blur(3px)" },
      { transform: `translate(${dx * 0.42}px, ${dy * 0.3}px) scale(.86)`, opacity: 1, filter: "blur(.6px)", offset: 0.34 },
      { transform: "translate(0, -7px) scale(1.045, .965)", filter: "blur(0)", offset: 0.7 },
      { transform: "translate(0, 1px) scale(.985, 1.015)", offset: 0.86 },
      { transform: "none" },
    ], { duration: 780, easing: "cubic-bezier(.22, 1, .36, 1)" });
    b.classList.add("recien");
    setTimeout(() => b.classList.remove("recien"), 1300);
    h?.animate([{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: 520, fill: "backwards" });
    const r = bMandar.getBoundingClientRect();
    det._chispas?.(r.left + r.width / 2, r.top + r.height / 2, 7);
  }

  /* — Mantener presionado un mensajito: su menú (con la burbuja nítida encima de todo) — */
  const deFila = (f) => S.ms.find((m) => String(m.id) === f.dataset.id);
  function abrirMenu(m, f, conTeclado) {
    if (S.dibujo || S.grabando) return;
    cerrarMenu(); cerrarHoja();
    const b = f.querySelector(".ch-burbuja");
    if (!b) return;
    const partes = [];
    if (!m.mio) partes.push(el("div.ch-menu-rx", { role: "group", "aria-label": "Reaccionar" }, REACCIONES.map((r) => el("button.ch-menu-rxb" + (m.reaccion === r.id ? ".on" : ""), {
      type: "button", title: r.corto, "aria-label": r.corto, "aria-pressed": String(m.reaccion === r.id), html: svgReaccion(r.id), onClick: () => reaccionar(m, r.id),
    }))));
    const acc = [];
    if (m.mio && m.texto && !m.audio) acc.push(el("button.ch-menu-b", { type: "button", role: "menuitem", html: I("editar", "Editar"), onClick: () => editar(m) }));
    if (m.texto) acc.push(el("button.ch-menu-b", { type: "button", role: "menuitem", html: I("copiar", "Copiar"), onClick: async () => { cerrarMenu(); try { await navigator.clipboard.writeText(m.texto); aviso("Copiado 💜", 1800); } catch (err) { aviso("No se pudo copiar aquí", 2600, "error"); } } }));
    if (m.mio) acc.push(el("button.ch-menu-b.peligro", { type: "button", role: "menuitem", html: I("borrar", "Eliminar"), onClick: () => { cerrarMenu(); borrar(m); } }));
    if (acc.length) partes.push(el("div.ch-menu-acc", {}, acc));
    if (!partes.length) return;
    const velo = flota(el("div.ch-velo.foco", { onClick: () => cerrarMenu() }));
    const copia = flota(el("div", { "aria-hidden": "true" }, [b.cloneNode(true)]));
    copia.className = f.className.replace(/\b(llega|enviando)\b/g, "") + " ch-copia";
    copia.querySelector(".ch-burbuja").classList.remove("apretando", "recien", "brilla");
    copia.querySelectorAll(".ed-onda-capa").forEach((n) => n.remove());
    const caja = flota(el("div.ch-menu" + (m.mio ? ".mio" : ""), { role: "menu", "aria-label": "Qué hacer con este mensajito" }, partes));
    b.classList.add("elegida");
    S.menu = { caja, velo, b, mio: m.mio, copia };
    colocarMenu();
    sonar("mensaje-menu");
    if (conTeclado) caja.querySelector("button")?.focus({ preventScroll: true });
  }
  /** Un menú chiquito junto a algo del panel (un sticker tuyo, un GIF). */
  function menuChico(ancla, botones) {
    cerrarMenu();
    const velo = flota(el("div.ch-velo", { onClick: () => cerrarMenu() }));
    const caja = flota(el("div.ch-menu.chico", { role: "menu" }, [el("div.ch-menu-acc", {}, botones)]));
    ancla.classList.add("elegida");
    S.menu = { caja, velo, b: ancla, chico: true };
    colocarMenu();
    sonar("mensaje-menu");
  }
  function colocarMenu() {
    const { caja, b, mio, copia, chico } = S.menu, w = caja.offsetWidth, h = caja.offsetHeight;
    // Su lugar de verdad (sin el «hundido» de mantenerla presionada, que todavía se está deshaciendo).
    const q = b.getBoundingClientRect(), bw = b.offsetWidth || q.width, bh = b.offsetHeight || q.height;
    const l = q.left + q.width / 2 - bw / 2, t = q.top + q.height / 2 - bh / 2;
    const r = { left: l, top: t, right: l + bw, bottom: t + bh, width: bw };
    if (copia) Object.assign(copia.style, { left: r.left + "px", top: r.top + "px", width: Math.ceil(bw) + 1 + "px" }); // (+1: que el texto no se acomode distinto)
    const x = Math.max(10, Math.min(innerWidth - w - 10, chico ? r.left + r.width / 2 - w / 2 : mio ? r.right - w : r.left));
    const abajo = !chico && r.bottom + 10 + h < innerHeight - 10, arriba = r.top - h - 10 > 10;
    const y = abajo ? r.bottom + 10 : arriba ? r.top - h - 10 : innerHeight - h - 10;
    caja.style.left = x + "px"; caja.style.top = Math.max(10, y) + "px";
    caja.style.transformOrigin = `${chico ? "center" : mio ? "right" : "left"} ${abajo ? "top" : "bottom"}`;
  }
  function cerrarMenu() {
    const m = S.menu;
    if (!m) return false;
    S.menu = null;
    m.b.classList.remove("elegida");
    if (reducido()) { m.velo.remove(); m.caja.remove(); m.copia?.remove(); return true; }
    m.velo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }).onfinish = () => m.velo.remove();
    m.caja.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.9)" }], { duration: 150, easing: "ease-in", fill: "forwards" }).onfinish = () => m.caja.remove();
    m.copia?.animate([{ transform: "scale(1.035)" }, { transform: "none" }], { duration: 170, easing: "ease-out", fill: "forwards" }).finished.then(() => m.copia.remove(), () => m.copia.remove());
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
    if (!(await confirmar(`¿Eliminar ${que}? Se elimina para los dos.`, "Eliminar"))) return;
    try {
      await SRV.borrarMensaje(m.id);
      sonar("mensaje-borrar");
      if (m.espacio) quitar(m.id);
      else { marcarEliminado({ ...m, borrado: true }); aviso(`Eliminaste un mensajito (a ${nombre} también le avisamos)`, 3200); }
    }
    catch (e) { aviso(mensajeError(e), 4000, "error"); }
  }

  /* — Editar tu mensajito — */
  function editar(m) {
    cerrarMenu();
    if (S.grabando) return;
    panel(null);
    dejarDeEditar(false);
    S.editando = m;
    editT.textContent = m.texto;
    editBar.hidden = false;
    raiz.classList.add("editando");
    S.nodos.get(m.id)?.classList.add("editandose");
    input.value = m.texto;
    alEscribir();
    input.focus();
    try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) { /* nada */ }
    if (!reducido()) editBar.animate([{ opacity: 0, transform: "translateY(14px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 280, easing: "cubic-bezier(.2, .9, .3, 1.1)" });
    sonar("abrir");
  }
  function dejarDeEditar(limpiar = true) {
    if (!S.editando) return false;
    S.nodos.get(S.editando.id)?.classList.remove("editandose");
    S.editando = null;
    editBar.hidden = true;
    raiz.classList.remove("editando");
    if (limpiar) { input.value = ""; }
    alEscribir();
    return true;
  }
  async function guardarEdicion(texto) {
    const m = S.ms.find((x) => x.id === S.editando.id) || S.editando;
    dejarDeEditar();
    if (texto === m.texto) return;
    aplicar({ ...m, texto, editado: new Date().toISOString() });
    sonar("mensaje-editar");
    entintar(m.id);
    try { aplicar(await SRV.editarMensaje(m.id, texto)); }
    catch (e) { aplicar(m); aviso(mensajeError(e), 4500, "error"); }
  }

  /* — Mensajes de voz — */
  async function empezarGrabacion() {
    if (S.grabando) return;
    if (!VOZ.puedeGrabar()) { aviso(window.isSecureContext === false ? "Para grabar audios, abre el editor con https." : "Este navegador no deja grabar audios aquí.", 4500, "error"); return; }
    panel(null); salirDibujo(); cerrarMenu();
    S.grabando = { cargando: true };
    let g;
    // El aviso de «empezar» (sonido y vibración) va ANTES de grabar, y mientras grabas el editor se calla:
    // así en el audio sólo queda tu voz.
    sonar("audio-grabar");
    vibrar(18);
    if (son) son.callado = true;
    try { g = await VOZ.grabar({ espera: PR.sonidos ? 380 : 120 }); }
    catch (e) {
      S.grabando = null;
      if (son) son.callado = false;
      aviso(e?.name === "NotAllowedError" || e?.name === "SecurityError" ? "Necesito permiso para usar tu micrófono 🎤 (dáselo en los ajustes del navegador)." : e?.name === "NotFoundError" ? "No encontré ningún micrófono en este aparato." : "No se pudo empezar a grabar.", 5500, "error");
      return;
    }
    if (!S.vivo) { g.cancelar(); if (son) son.callado = false; return; }
    S.grabando = g;
    input.blur();
    escribir.classList.add("grabando");
    grabBar.hidden = false;
    if (!reducido()) grabBar.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 280, easing: "cubic-bezier(.2, .9, .3, 1.1)" });
    const barras = [...grabOndas.children], niveles = barras.map(() => 0.08);
    let antes = 0;
    const paso = (t) => {
      if (S.grabando !== g) return;
      const s = g.segundos();
      grabT.textContent = VOZ.minutos(s);
      if (t - antes > 70) { antes = t; niveles.shift(); niveles.push(Math.max(0.08, g.nivel())); barras.forEach((b, i) => { b.style.transform = `scaleY(${niveles[i]})`; }); }
      if (s >= VOZ.MAX_SEG) { terminarGrabacion(); return; }
      g.cuadro = requestAnimationFrame(paso);
    };
    g.cuadro = requestAnimationFrame(paso);
  }
  function soltarGrabacion() {
    const g = S.grabando;
    if (!g || g.cargando) return null;
    cancelAnimationFrame(g.cuadro);
    S.grabando = null;
    escribir.classList.remove("grabando");
    grabBar.hidden = true;
    if (son) setTimeout(() => { son.callado = false; }, 250); // (el toque de mandar tampoco se cuela)
    return g;
  }
  function cancelarGrabacion() {
    const g = soltarGrabacion();
    if (!g) return false;
    g.cancelar();
    sonar("borrar");
    return true;
  }
  async function terminarGrabacion() {
    const g = soltarGrabacion();
    if (!g) return;
    let a;
    try { a = await g.parar(); } catch (e) { aviso("No se pudo preparar el audio.", 4500, "error"); return; }
    if (!S.vivo) return;
    if (a.dur < 0.6) { aviso("Ese audio quedó muy cortito 🎤", 2600); return; }
    const local = URL.createObjectURL(a.blob);
    S.blobs.push(local);
    const t = burbujaNueva({ audio: { u: local, dur: a.dur, ondas: a.ondas } });
    sonar("audio-listo");
    try {
      const r = await SRV.subirMedia(a.blob, "audio");
      t.audio._u = r.u;
      const m = await SRV.mandarMensaje({ audio: { u: r.u, dur: a.dur, ondas: a.ondas } });
      if (!S.vivo) return;
      if (!t._real) adoptar(t, m);
    } catch (e) { noSeMando(t, e); }
  }

  /* — Las hojitas de ⋮ (ajustes y privacidad) y de + (las cositas) — */
  function abrirHoja(nodoHoja, desde, clase) {
    cerrarHoja(); cerrarMenu();
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
  async function hojaAjustes() {
    S.push = await PUSH.estado().catch(() => S.push); // el estado de verdad de este aparato, justo ahora
    const pref = (k) => (v) => { PR[k] = v; guardarPref(PR); raiz.classList.toggle("sin-fondo", !PR.fondo); raiz.classList.toggle("letra-grande", PR.grande); requestAnimationFrame(pintarCapa); };
    abrirHoja(el("div.ch-hoja-in", {}, [
      el("div.ch-hoja-cab", {}, [el("i", { html: IC.lleno }), el("b", { text: "Ajustes del chat" })]),
      el("small.ch-hoja-sec", { text: "En este aparato" }),
      interruptor("Sonidos del chat", "Al mandar, al llegar, audios y stickers", PR.sonidos, pref("sonidos")),
      interruptor("Sonidos del teclado", "Al escribir tus mensajitos", PR.teclado, pref("teclado")),
      interruptor("Avisos dentro del editor", "Cuando el chat está cerrado", PR.avisos, pref("avisos")),
      interruptor("Fondo con corazoncitos", "", PR.fondo, pref("fondo")),
      interruptor("Letra grande", "", PR.grande, pref("grande")),
      (() => { const b = el("button.ch-hoja-item.ch-temas", { type: "button", role: "menuitem" }, [el("i.ch-temas-ico", { html: ico("diseno") }), el("span.ch-hoja-t", {}, [el("b", { text: "Temas del chat" }), el("small", { text: "Colores y fondos para su chat" })]), el("em.ch-pronto-tag", { text: "Muy pronto" })]);
        b.addEventListener("click", () => { if (!reducido()) b.animate([{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 300 }); });
        return b; })(),
      ...seccionPush(),
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
  /** ⋮ → Notificaciones: aunque el editor esté cerrado (Android, compu y iPhone con la app en inicio). */
  function seccionPush() {
    const e = S.push || {};
    const cab = el("small.ch-hoja-sec", { text: "Notificaciones" });
    if (!e.soportado) return [cab, el("p.ch-hoja-nota", { text: e.necesitaInstalar ? "En iPhone: toca Compartir → «Agregar a inicio» y abre el editor desde ese ícono; ahí aparece para prender las notificaciones." : "Este navegador no puede recibir notificaciones (prueba con Chrome, o en iPhone con la app en tu pantalla de inicio)." })];
    return [cab,
      interruptor("Notificaciones push", "Aunque el editor esté cerrado, con sonido", !!e.prendidas, async (v) => {
        try {
          if (v) { await PUSH.prender(); aviso(`¡Listo! Te aviso cuando ${nombre} te escriba 💜`, 3500); }
          else { await PUSH.apagar(); aviso("Notificaciones apagadas en este aparato"); }
          S.push = await PUSH.estado();
          return true;
        } catch (err) { aviso(err.message || "No se pudieron prender", 6500, "error"); return false; }
      }),
      el("button.ch-hoja-item", { type: "button", role: "menuitem", html: I("campana", "Probar notificación"), onClick: async () => {
        try { const r = await PUSH.probar(); aviso(r.enviadas ? `Te mandé una de prueba (${r.enviadas} de ${r.total} ${r.total === 1 ? "aparato" : "aparatos"}) 🔔` : "El servicio de notificaciones no la aceptó: apágalas y vuelve a prenderlas.", 4500, r.enviadas ? "" : "error"); }
        catch (err) { aviso(mensajeError(err), 5000, "error"); }
      } }),
    ];
  }
  /** La primera vez: una invitación chiquita para prender las notificaciones (o, en iPhone, cómo hacerlo). */
  const INVITA = "editordev:push-invitado";
  function invitar(e) {
    try { if (localStorage.getItem(INVITA)) return; } catch (x) { return; }
    const puede = e.soportado && e.permiso === "default", iphone = !e.soportado && e.necesitaInstalar;
    if (!puede && !iphone) return;
    const listo = () => { try { localStorage.setItem(INVITA, "1"); } catch (x) { /* nada */ } caja.classList.add("fuera"); setTimeout(() => caja.remove(), 300); };
    const caja = el("div.ch-invita", { role: "status" }, [
      el("i", { html: ico("campana") }),
      el("span", { text: puede ? `¿Te aviso cuando ${nombre} te escriba, aunque el editor esté cerrado?` : "Para que te avise en tu iPhone aunque esté cerrado: Compartir → «Agregar a inicio», y abre el editor desde ese ícono." }),
      puede ? el("button.ch-invita-si", { type: "button", text: "Activar", onClick: async () => {
        try { await PUSH.prender(); S.push = await PUSH.estado(); aviso(`¡Listo! Te aviso cuando ${nombre} te escriba 💜`, 3500); listo(); }
        catch (err) { aviso(err.message, 6500, "error"); listo(); }
      } }) : null,
      el("button.ch-invita-no", { type: "button", text: puede ? "Ahora no" : "Entendido", onClick: listo }),
    ]);
    marco.append(caja);
  }
  PUSH.estado().then((e) => { S.push = e; if (S.vivo) invitar(e); }).catch(() => {});

  function hojaMas() {
    const item = (icono, t, sub, al, clase = "") => el("button.ch-hoja-item.ch-cosita" + clase, { type: "button", role: "menuitem", onClick: () => { cerrarHoja(); al(); } }, [el("i.ch-cosita-ico", { html: icono }), el("span.ch-hoja-t", {}, [el("b", { text: t }), el("small", { text: sub })])]);
    abrirHoja(el("div.ch-hoja-in", {}, [
      el("div.ch-hoja-cab", {}, [el("i", { html: IC.brillo }), el("b", { text: "Cositas" })]),
      el("div.ch-cositas", {}, [
        item(IC.lapiz, "Dibujar", "En vivo, en todo el chat", () => entrarDibujo(), ".rosa"),
        item(IC.espacio, "Espacio", "Más lugar para dibujar", () => { entrarDibujo(); masEspacio(); }, ".lila"),
        item(IC.foto, "Crear sticker", "Con tus fotos", () => crearSticker(), ".durazno"),
        item(IC.mic, "Nota de voz", "Grábale un audio", () => empezarGrabacion(), ".menta"),
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
      const lineas = todos.filter((m) => !m.espacio).map((m) => m.borrado ? `[${new Date(m.creado).toLocaleString("es-MX")}] ${m.mio ? yo : nombre}: [mensajito eliminado]` : `[${new Date(m.creado).toLocaleString("es-MX")}] ${m.mio ? yo : nombre}: ${m.audio ? `[mensaje de voz ${VOZ.minutos(m.audio.dur)}]` : ""}${m.texto || ""}${m.gif ? (m.texto ? " " : "") + (m.gif.s ? "[sticker]" : "[GIF]") : ""}${m.editado ? " (editado)" : ""}`);
      const b = new Blob([`Mensajitos de ${yo} y ${nombre} 💜\n\n${lineas.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
      const a = el("a", { href: URL.createObjectURL(b), download: `mensajitos-con-${SRV.nombreLimpio(nombre)}.txt` });
      document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    } catch (e) { aviso(mensajeError(e), 4500, "error"); }
  }

  /* — El panel: Stickers / Explorar stickers, GIFs favoritos / Explorar GIFs, o sólo emojis — */
  function panel(tipo, vista) {
    if (!tipo || (tipo === P.tipo && !vista && !panelN.hidden)) {
      if (panelN.hidden) return false;
      P.ctl?.abort();
      P.tipo = ""; P.vista = "";
      [bGif, bSt, bEmoji].forEach((b) => b.classList.remove("on"));
      raiz.classList.remove("con-panel");
      if (reducido()) panelN.hidden = true;
      else panelN.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(22px) scale(.97)" }], { duration: 200, easing: "ease-in" }).onfinish = () => { if (!P.tipo) panelN.hidden = true; };
      sonar("cerrar");
      return true;
    }
    if (S.grabando) return false;
    if (S.dibujo) salirDibujo();
    const abriendo = panelN.hidden, otroTipo = tipo !== P.tipo, vs = VISTAS[tipo] || [];
    if (tipo === "emojis") vista = "emojis";
    else if (!vista) vista = !otroTipo && P.vista ? P.vista : tipo === "gifs" && COL.gifs && !COL.gifs.length ? "explorar" : "mios";
    const antesI = vs.findIndex(([v]) => v === P.vista), ahoraI = vs.findIndex(([v]) => v === vista);
    const cambio = otroTipo || vista !== P.vista;
    P.tipo = tipo; P.vista = vista;
    tabsN.hidden = !vs.length; tituloP.hidden = !!vs.length;
    if (otroTipo || tabsN.childElementCount !== vs.length) tabsN.replaceChildren(...vs.map(([v, t]) => el("button.ch-tab", { type: "button", role: "tab", dataset: { v }, text: t, onClick: () => { if (P.vista !== v) panel(tipo, v); } })));
    tabsN.querySelectorAll(".ch-tab").forEach((b) => { const on = b.dataset.v === vista; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    tabsN.style.setProperty("--i", Math.max(0, ahoraI));
    [[bGif, "gifs"], [bSt, "stickers"], [bEmoji, "emojis"]].forEach(([b, t]) => b.classList.toggle("on", t === tipo));
    const explorar = vista === "explorar";
    buscarCaja.hidden = chips.hidden = giphyMarca.hidden = !explorar;
    pista.textContent = PISTAS[tipo + ":" + vista] || "";
    raiz.classList.add("con-panel");
    if (abriendo) {
      panelN.hidden = false;
      if (tipo !== "emojis") input.blur();
      if (!reducido()) panelN.animate([{ opacity: 0, transform: "translateY(28px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 340, easing: "cubic-bezier(.2, .9, .3, 1.12)" });
      sonar("abrir");
      if (S.pegado) setTimeout(() => alFondo(false), 40);
    } else if (cambio && !reducido()) {
      const dir = otroTipo || antesI < 0 ? 0 : ahoraI > antesI ? 1 : -1;
      rejilla.animate([{ opacity: 0, transform: `translateX(${dir * 22}px)` }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2, .9, .3, 1)" });
    }
    if (!cambio && !abriendo) return true;
    P.ctl?.abort();
    rejilla.scrollTop = 0;
    if (vista === "emojis") {
      rejilla.className = "ch-rejilla emojis";
      rejilla.replaceChildren(...EMOJIS.map((x) => el("button.ch-emo", { type: "button", text: x, onClick: () => ponerEmoji(x) })));
      return true;
    }
    if (vista === "mios") { verMios(); return true; }
    rejilla.className = "ch-rejilla explorar " + tipo;
    buscar.value = "";
    buscar.placeholder = tipo === "gifs" ? "Busca un GIF…" : "Busca un sticker cute…";
    chips.replaceChildren(...ETIQUETAS[tipo].map(([t, q], i) => el("button.ch-chip" + (i === 0 ? ".on" : ""), { type: "button", text: t, dataset: { q }, onClick: (e) => { buscar.value = ""; P.q = q; chips.querySelectorAll(".ch-chip").forEach((c) => c.classList.toggle("on", c === e.currentTarget)); hacerBusqueda(true); } })));
    P.q = ETIQUETAS[tipo][0][1];
    hacerBusqueda(true);
    return true;
  }
  /** Cerrar el panel sin animación (mientras está escondido por un arrastre). */
  function cerrarPanelYa() {
    P.ctl?.abort();
    P.tipo = ""; P.vista = "";
    [bGif, bSt, bEmoji].forEach((b) => b.classList.remove("on"));
    raiz.classList.remove("con-panel");
    panelN.hidden = true;
  }
  function ponerEmoji(x) {
    const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? a;
    input.value = input.value.slice(0, a) + x + input.value.slice(b);
    input.selectionStart = input.selectionEnd = a + x.length;
    alEscribir();
  }

  /* Tu colección (del servidor): favoritos arriba y luego lo que más usas. */
  function cargarColeccion() {
    COL.pide ??= SRV.coleccion().then((d) => { COL.stickers = d.stickers || []; COL.gifs = d.gifs || []; }).finally(() => { COL.pide = null; });
    return COL.pide;
  }
  const ordenar = (l) => l.map((x, i) => [x, i]).sort(([a, i], [b, j]) => (b.favorito - a.favorito) || ((b.usos || 0) - (a.usos || 0)) || ((b._t || 0) - (a._t || 0)) || i - j).map(([x]) => x);
  const delTipo = (tipo, id) => (COL[tipo] || []).find((z) => z.id === id);
  function usado(tipo, u) {
    const x = (COL[tipo] || []).find((z) => z.u === u);
    if (x) { x.usos = (x.usos || 0) + 1; x._t = Date.now(); }
  }
  function verMios() {
    const tipo = P.tipo;
    rejilla.className = "ch-rejilla mios " + tipo;
    if (COL[tipo]) pintarMios(false);
    else rejilla.replaceChildren(el("div.dt-cargando", {}, [el("i"), el("span", { text: "Abriendo tu colección…" })]));
    cargarColeccion().then(() => { if (P.vista === "mios" && P.tipo === tipo) pintarMios(true); }).catch((e) => {
      if (P.vista === "mios" && P.tipo === tipo && !COL[tipo]) rejilla.replaceChildren(el("p.ch-nada", { text: mensajeError(e) }));
    });
  }
  const deCol = (k, hacer) => { let n = nodosCol.get(k); if (!n) { n = hacer(); n.dataset.k = k; nodosCol.set(k, n); } return n; };
  /** Pinta tus stickers (o tus GIFs favoritos); con `animar`, los que cambiaron de lugar se deslizan solitos. */
  function pintarMios(animar) {
    const tipo = P.tipo, l = ordenar(COL[tipo] || []), hijos = [];
    const titulo = (k, t, icono) => deCol(tipo + ":" + k, () => el("p.ch-col-t", {}, [icono ? el("i", { html: icono }) : null, el("span", { text: t })]));
    if (tipo === "stickers") {
      const fav = l.filter((x) => x.favorito), resto = l.filter((x) => !x.favorito);
      const crear = deCol("crear", () => el("button.ch-mini.ch-crear-b", { type: "button", "aria-label": "Crear un sticker con tus fotos", onClick: () => crearSticker() }, [el("i", { html: IC.mas }), el("span", { text: "Crear" })]));
      if (fav.length) hijos.push(titulo("fav", "Favoritos", IC.estrellaLlena), ...fav.map((x) => miniMio(x, tipo)), titulo("mios", "Mis stickers"));
      hijos.push(crear, ...resto.map((x) => miniMio(x, tipo)));
      if (!l.length) hijos.push(deCol("vacio-st", () => el("p.ch-col-vacio", { text: "Crea tus propios stickers con tus fotos 💜 Tus favoritos y los que más uses se van acomodando hasta arriba." })));
    } else {
      hijos.push(...l.map((x) => miniMio(x, tipo)));
      if (!l.length) hijos.push(deCol("vacio-gif", () => el("div.ch-col-vacio", {}, [
        el("p", { text: "Aquí van a vivir tus GIFs favoritos. Mantén presionado un GIF en «Explorar GIFs» para guardarlo." }),
        el("button.ch-chip.on", { type: "button", text: "Explorar GIFs", onClick: () => panel("gifs", "explorar") }),
      ])));
    }
    for (const x of l) nodosCol.get("c" + x.id)?.classList.toggle("fav", !!x.favorito);
    const antes = animar && !reducido() ? new Map([...rejilla.children].map((n) => [n, n.getBoundingClientRect()])) : null;
    rejilla.replaceChildren(...hijos);
    if (antes) for (const n of hijos) {
      const a = antes.get(n);
      if (!a) continue;
      const r = n.getBoundingClientRect(), dx = a.left - r.left, dy = a.top - r.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.2, .9, .3, 1)" });
    }
    if (S.nuevoSticker) {
      const n = nodosCol.get("c" + S.nuevoSticker);
      S.nuevoSticker = 0;
      if (n && !reducido()) { n.classList.add("nace"); setTimeout(() => n.classList.remove("nace"), 900); }
      if (n) { const rr = rejilla.getBoundingClientRect(), nr = n.getBoundingClientRect(); if (nr.top < rr.top || nr.bottom > rr.bottom) rejilla.scrollBy({ top: nr.top - rr.top - 8, behavior: reducido() ? "auto" : "smooth" }); }
    }
  }
  function miniMio(x, tipo) {
    return deCol("c" + x.id, () => {
      const b = el("button.ch-mini.mio" + (tipo === "stickers" ? ".st" : ""), { type: "button", "aria-label": tipo === "stickers" ? "Tu sticker" : "Tu GIF favorito", style: tipo === "gifs" ? { aspectRatio: `${x.w} / ${x.h}` } : {} }, [
        el("img", { src: M(x.u), alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" }),
        el("i.ch-mini-fav", { "aria-hidden": "true", html: IC.estrellaLlena }),
      ]);
      const yo = () => delTipo(tipo, x.id) || x;
      const menu = () => menuColeccion(b, yo(), tipo);
      if (tipo === "stickers") arrastrable(b, { u: M(x.u), alSoltar: (p) => { if (p) { const z = yo(); usado("stickers", z.u); pegarLibre({ u: z.u, w: z.w, h: z.h }, p); } }, alQuieto: menu });
      else presionLarga(b, menu);
      b.addEventListener("click", () => {
        if (b._arrastrado) { b._arrastrado = false; return; }
        const z = yo();
        usado(tipo, z.u);
        panel(null);
        mandar({ gif: { u: z.u, w: z.w, h: z.h, ...(tipo === "stickers" ? { s: 1 } : {}) } });
      });
      return b;
    });
  }
  function menuColeccion(n, x, tipo) {
    const botones = [];
    if (tipo === "stickers") botones.push(el("button.ch-menu-b", { type: "button", role: "menuitem", html: I2(x.favorito ? IC.estrellaNo : IC.estrella, x.favorito ? "Quitar de favoritos" : "Agregar a favoritos"), onClick: () => { cerrarMenu(); favorito(x, !x.favorito); } }));
    botones.push(el("button.ch-menu-b.peligro", { type: "button", role: "menuitem", html: tipo === "stickers" ? I("borrar", "Eliminar sticker") : I2(IC.estrellaNo, "Quitar de favoritos"), onClick: () => { cerrarMenu(); quitarDeCol(x, tipo); } }));
    menuChico(n, botones);
  }
  async function favorito(x, v) {
    x.favorito = v;
    sonar("favorito");
    vibrar(12);
    if (P.vista === "mios") pintarMios(true);
    try { Object.assign(x, await SRV.favoritoColeccion(x.id, v), { _t: x._t }); }
    catch (e) { x.favorito = !v; if (P.vista === "mios") pintarMios(true); aviso(mensajeError(e), 4500, "error"); }
  }
  async function quitarDeCol(x, tipo) {
    const n = nodosCol.get("c" + x.id), antes = COL[tipo];
    COL[tipo] = (COL[tipo] || []).filter((z) => z.id !== x.id);
    sonar("borrar");
    const listo = () => { nodosCol.delete("c" + x.id); if (P.tipo === tipo && P.vista === "mios") pintarMios(true); };
    if (n?.isConnected && !reducido()) n.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.4) rotate(-8deg)" }], { duration: 240, easing: "ease-in", fill: "forwards" }).onfinish = listo;
    else listo();
    try { await SRV.quitarDeColeccion(x.id); }
    catch (e) { COL[tipo] = antes; if (P.vista === "mios") pintarMios(true); aviso(mensajeError(e), 4500, "error"); }
  }
  async function guardarGif(g, b) {
    const ya = (COL.gifs || []).find((z) => z.u === g.u);
    if (ya) { quitarDeCol(ya, "gifs"); b.classList.remove("fav"); return; }
    b.classList.add("fav");
    sonar("favorito");
    try {
      const item = await SRV.ponerEnColeccion({ tipo: "gif", u: g.u, w: g.w, h: g.h, favorito: true });
      COL.gifs = [item, ...(COL.gifs || []).filter((z) => z.id !== item.id)];
      aviso("Guardado en tus GIFs favoritos ★", 1800);
    } catch (e) { b.classList.remove("fav"); aviso(mensajeError(e), 4500, "error"); }
  }
  async function crearSticker() {
    if (S.grabando) return;
    const f = await elegirImagen();
    if (!f || !S.vivo) return;
    await creadorSticker({ archivo: f, flota, sonar, alCrear: async ({ blob, w, h }) => {
      let item;
      try {
        const r = await SRV.subirMedia(blob, "sticker");
        item = await SRV.ponerEnColeccion({ tipo: "sticker", u: r.u, w, h });
      } catch (e) { throw new Error(mensajeError(e)); }
      COL.stickers = [item, ...(COL.stickers || []).filter((x) => x.id !== item.id)];
      sonar("sticker-crear");
      vibrar(20);
      S.nuevoSticker = item.id;
      if (P.tipo === "stickers" && P.vista === "mios" && !panelN.hidden) pintarMios(true);
      else panel("stickers", "mios");
    } });
  }

  /* Explorar (GIPHY). */
  buscar.addEventListener("input", debounce(() => {
    if (P.vista !== "explorar") return;
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
  rejilla.addEventListener("scroll", () => { if (P.vista === "explorar" && rejilla.scrollTop + rejilla.clientHeight > rejilla.scrollHeight - 320) hacerBusqueda(false); }, { passive: true });
  function mini(it, tipo) {
    const fw = it.im?.fixed_width || {};
    const g = { u: fw.webp || fw.url || it.mini, w: +fw.width || it.w || 200, h: +fw.height || it.h || 200 };
    const b = el("button.ch-mini" + (tipo === "stickers" ? ".st" : ""), { type: "button", "aria-label": it.titulo, title: it.titulo, style: { aspectRatio: `${g.w} / ${g.h}` } }, [
      el("img", { src: it.mini || g.u, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" }),
      el("i.ch-mini-fav", { "aria-hidden": "true", html: IC.estrellaLlena }),
    ]);
    if (tipo === "stickers") prepararArrastre(b, { u: g.u, w: g.w, h: g.h, it });
    else {
      if ((COL.gifs || []).some((z) => z.u === g.u)) b.classList.add("fav");
      presionLarga(b, () => menuChico(b, [el("button.ch-menu-b", { type: "button", role: "menuitem", html: b.classList.contains("fav") ? I2(IC.estrellaNo, "Quitar de favoritos") : I2(IC.estrella, "Agregar a favoritos"), onClick: () => { cerrarMenu(); guardarGif(g, b); } })]));
    }
    b.addEventListener("click", () => { if (b._arrastrado) { b._arrastrado = false; return; } elegir(it, g, tipo); });
    return b;
  }
  async function elegir(it, g, tipo) {
    G.contar(it, "onclick");
    if (tipo === "gifs") usado("gifs", g.u);
    panel(null);
    if (await mandar({ gif: tipo === "stickers" ? { ...g, s: 1 } : g })) G.contar(it, "onsent");
  }

  /* — Arrastrar stickers: del panel a cualquier parte del chat, o los tuyos de un lugar a otro — */
  const bote = el("div.ch-bote", { "aria-hidden": "true" }, [el("i", { html: IC.bote }), el("span", { text: "Suelta aquí para quitarlo" })]);
  /**
   * Mantener presionado (o, con ratón, empezar a mover) un sticker lo levanta. Si lo sueltas donde
   * mismo (o, con ratón, lo dejas presionado sin moverlo), es `alQuieto` (su menú, si tiene).
   */
  function arrastrable(n, { u, alSoltar, alQuieto, conBote = false }) {
    let espera = 0, raton = 0, x0 = 0, y0 = 0, pid = null;
    const limpiar = () => { clearTimeout(espera); espera = 0; clearTimeout(raton); raton = 0; n._mouse = null; };
    const marcar = () => { n._arrastrado = true; setTimeout(() => { n._arrastrado = false; }, 450); };
    n.addEventListener("pointerdown", (e) => {
      n._tipo = e.pointerType;
      if (e.button > 0 || S.arrastre || S.dibujo) return;
      x0 = e.clientX; y0 = e.clientY; pid = e.pointerId;
      if (document.activeElement === input) input.blur(); // el teclado se va: el sticker se pone donde sea, sin brincos
      const empezar = () => { limpiar(); sinToqueAlSoltar(e); levantar(n, u, x0, y0, pid, (p, alBote, quieto) => { marcar(); if (quieto) alQuieto?.(); else alSoltar(p, alBote); }, conBote); };
      if (e.pointerType === "mouse") {
        n._mouse = empezar;
        if (alQuieto) raton = setTimeout(() => { limpiar(); marcar(); vibrar(12); alQuieto(); }, 420);
        return;
      }
      espera = setTimeout(empezar, 320); // (si se mueve antes, era para deslizar el panel)
    });
    n.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      const lejos = Math.hypot(e.clientX - x0, e.clientY - y0) > 7;
      if (n._mouse && lejos) { clearTimeout(raton); raton = 0; const f = n._mouse; n._mouse = null; f(); }
      else if (espera && lejos) limpiar(); // se movió antes de tiempo: quería deslizar
    });
    for (const t of ["pointerup", "pointercancel", "pointerleave"]) n.addEventListener(t, () => limpiar());
    n.addEventListener("contextmenu", (e) => { e.preventDefault(); if (n._tipo === "mouse" && alQuieto && !S.arrastre) { marcar(); alQuieto(); } });
  }
  function prepararArrastre(b, st) {
    arrastrable(b, { u: st.u, alSoltar: (p) => { if (p) pegarLibre(st, p); } });
  }
  /** Tus stickers libres: al soltarlos se busca cuál es (por su clave de ese momento). */
  function prepararArrastreLibre(n) {
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
    // El panel se hace a un lado mientras lo llevas: TODO el chat queda libre para soltarlo.
    const desdePanel = panelN.contains(origen);
    // (La lista crece donde estaba el panel: abajo se le da ese mismo espacio, para que nada brinque.)
    const t0 = lista.scrollTop;
    if (desdePanel && !panelN.hidden) { S.extraFin = panelN.offsetHeight + 12; pintarCapa(); }
    raiz.classList.add("soltando");
    if (S.extraFin) { pintarCapa(); lista.scrollTop = t0; }
    // Mientras lo llevas, nada de la pantalla se desliza (ni el panel, ni la lista, ni la página).
    const quieta = (e) => { if (e.cancelable) e.preventDefault(); };
    addEventListener("touchmove", quieta, { capture: true, passive: false });
    if (conBote) { flota(bote); requestAnimationFrame(() => bote.classList.add("ver")); }
    const A = (S.arrastre = { activo: true, x: cx, y: cy, lejos: 0, medio: false, borde: 0 });
    let auto = 0;
    const mover = (x, y) => {
      A.x = x; A.y = y;
      A.lejos = Math.max(A.lejos, Math.hypot(x - cx, y - cy));
      fantasma.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(-6deg) scale(1.1)`;
      const r = lista.getBoundingClientRect();
      A.dentro = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && !A.enPanel(x, y);
      A.alBote = conBote && (() => { const b = bote.getBoundingClientRect(); return x >= b.left - 10 && x <= b.right + 10 && y >= b.top - 10 && y <= b.bottom + 10; })();
      bote.classList.toggle("encima", !!A.alBote);
      fantasma.classList.toggle("fuera", !A.dentro && !A.alBote);
      // Cerca de arriba o de abajo, la lista se va moviendo sola, pero sólo si ya pasaste por en medio
      // y te quedas un ratito en la orilla (al venir del panel, cruzar la orilla no la mueve).
      if (A.dentro && y > r.top + 60 && y < r.bottom - 60) A.medio = true;
      const v = !A.medio || !A.dentro ? 0 : y < r.top + 60 ? -1 : y > r.bottom - 60 ? 1 : 0;
      if (v !== A.v) {
        A.v = v; A.borde = performance.now();
        cancelAnimationFrame(auto);
        if (v) { const paso = (t) => { if (t - A.borde > 380) { lista.scrollTop += v * 9; pintarCapa(); } auto = requestAnimationFrame(paso); }; auto = requestAnimationFrame(paso); }
      }
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
      removeEventListener("touchmove", quieta, { capture: true });
      origen.classList.remove("levantado");
      bote.classList.remove("ver", "encima");
      setTimeout(() => bote.remove(), 250);
      S.arrastre = null;
      const quieto = e.type === "pointerup" && A.lejos < 12;
      const ok = !quieto && e.type === "pointerup" && (A.dentro || A.alBote);
      // Ya lo pegaste: el panel se queda cerrado (si no, vuelve a su lugar).
      if (ok && desdePanel && !A.alBote) cerrarPanelYa();
      raiz.classList.remove("soltando");
      // Si se pegó, el espacio de abajo se queda (nada brinca) hasta que llegue o mandes otro mensajito.
      if (S.extraFin && !(ok && desdePanel && !A.alBote)) { S.extraFin = 0; requestAnimationFrame(() => pintarCapa()); }
      if (!reducido()) fantasma.animate([{ opacity: 1 }, { opacity: 0, transform: fantasma.style.transform.replace("scale(1.1)", ok ? "scale(.95)" : "scale(.4)") }], { duration: ok ? 120 : 220 }).onfinish = () => fantasma.remove();
      else fantasma.remove();
      alSoltar(ok && !A.alBote ? { x: A.x, y: A.y } : null, !!A.alBote && ok, quieto);
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
    if (Math.abs(h - innerHeight) < 2 && t <= 0) { c.style.top = c.style.height = c.style.bottom = ""; if (scrollY || scrollX) scrollTo(0, 0); }
    else { c.style.top = t + "px"; c.style.height = h + "px"; c.style.bottom = "auto"; }
    if (S.pegado && !S.arrastre) alFondo(false);
  };
  vv?.addEventListener("resize", ajustarVV);
  vv?.addEventListener("scroll", ajustarVV);

  // Atrás (o Esc): primero se cierra lo que esté abierto encima del chat.
  det._chatAtras = () => cerrarMenu() || cerrarHoja() || cancelarGrabacion() || dejarDeEditar() || salirDibujo() || panel(null);
  det._limpiezas.push(() => {
    S.vivo = false;
    AN.limpiar();
    P.ctl?.abort();
    vigia.disconnect();
    VOZ.pararVoz();
    if (S.grabando && !S.grabando.cargando) { cancelAnimationFrame(S.grabando.cuadro); S.grabando.cancelar(); }
    S.grabando = null;
    if (son) son.callado = false;
    if (S.dibujo) { terminarTrazo(); S.dibujo = null; }
    for (const t of S.trazos.values()) clearInterval(t.reloj);
    document.removeEventListener("visibilitychange", alVolver);
    vv?.removeEventListener("resize", ajustarVV);
    vv?.removeEventListener("scroll", ajustarVV);
    if (S.menu) { S.menu.velo.remove(); S.menu.caja.remove(); S.menu.copia?.remove(); S.menu = null; }
    if (S.hoja) { S.hoja.velo.remove(); S.hoja.h.remove(); S.hoja = null; }
    bote.remove();
    capaDet.querySelectorAll(".ch-fantasma").forEach((n) => n.remove());
    setTimeout(() => S.blobs.forEach((u) => URL.revokeObjectURL(u)), 1000);
    if (det.capa) det.capa.style.top = det.capa.style.height = det.capa.style.bottom = "";
    det._chatAtras = null;
  });
  // Si había un aviso de «te mandó mensajitos», ya no hace falta: aquí están.
  const av = app.avisoChat;
  if (av?.isConnected) { av.classList.remove("ver"); setTimeout(() => av.remove(), 300); }
  cargar();
  return raiz;
}
