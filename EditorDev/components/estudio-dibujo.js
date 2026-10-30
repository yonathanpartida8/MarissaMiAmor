/**
 * EL ESTUDIO DEL DIBUJITO (Fases 47–48) — «Dibujito» (en Crear detallito) ya no abre el editor de páginas:
 * es una hojita para dibujarle algo a tu amorcito con tus manos y mandárselo a sus Detallitos.
 *
 *   · La hoja: blanca (o del color que elijas), redondita, sin nada de página.
 *   · Dos momentos, como en noteit:
 *       componer — fondo, stickers, texto y fotito (se mueven con un dedo, se giran y agrandan con dos o
 *                  con su manijita), deshacer, MANDAR (el avión, con su anillo de avance) y guardar la imagen;
 *       dibujar  — se entra tocando la hoja (ese mismo toque ya pinta): deshacer y rehacer, el grosor (una
 *                  barrita vertical en la orilla), «listo» y abajo el cajón con colores y herramientas.
 *   · Herramientas: plumón, pincel, lápiz, neón, cubeta, borrador y la REGLA (se mueve con un dedo, se gira
 *     con dos o con su perilla, se pega a 0°, 15°, 30°, 45°…; lo que dibujas junto a su orilla sale derechito).
 *   · Dos dedos tocando a la vez = deshacer.
 *   · Sonidos: un rasgueo suavecito mientras dibujas (distinto en cada pincel), y cada cosa con el suyo.
 *   · Fase 48: el cajón se desliza hacia arriba (Bonita, Fondo, Stickers, Texto, Imágenes); «Bonita» cambia el papel,
 *     el tamaño de la hoja y prende la HOJA INFINITA (acercas sin fin y dibujas adentro de tu dibujo). Con dos dedos
 *     se acerca y aleja también en la hoja normal. La regla guía cualquier trazo que llegue a su orilla. Lápiz
 *     virtual (lo mueves sin pintar, un toque lo arma). Crayón, opacidad, la ruedita con su cuadrito y el gotero.
 *     Lo que dibujas se ve exacto a como queda (sin rastros) y el borrador borra justo lo que pasas.
 *   · Se guarda solo en este aparato mientras dibujas: si cierras, lo sigues después.
 *   · Al mandarlo, la hoja se encoge, se vuelve avioncito y sale volando con corazones. Le llega a tu
 *     amorcito en Detallitos como dibujo (no como página) y ahí se redibuja solito, trazo por trazo.
 */
import { el, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as PF from "./perfil.js";
import { vibrar } from "../integraciones/plataforma.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { elegirImagen } from "./chat-sticker.js";
import { pantallaInicio } from "./inicio.js";
import { ANCHO, ALTO, TAMANOS, VISTA, PINCELES, Lienzo, LienzoInfinito, pintarTrazo, rellenar, aplicar, ocultas } from "./dibujo-motor.js";

const GUARDA = "editordev:dibujito", PREF = "editordev:dibujito-pref";
const COLORES = ["#3a2a35", "#ffffff", "#ff5c93", "#ffadc9", "#f0435e", "#ff9b7a", "#ffc98b", "#ffe27a", "#b8e986", "#6fd3a6", "#86d6f2", "#7aa7ff", "#c3a6ff", "#9b6be0", "#a07155", "#5a3b2e"];
const FONDOS = [["#ffffff", "Blanco"], ["#fff7e8", "Crema"], ["#ffe4ee", "Rosita"], ["#efe6ff", "Lila"], ["#e3f7ee", "Menta"], ["#e3f2ff", "Cielo"], ["#ffe9dc", "Durazno"], ["#2a2233", "Nochecita"]];
const FUENTES = [["Caveat", "A mano", 700], ["Patrick Hand", "Cuadernito", 400], ["Nunito", "Redondita", 800], ["Cormorant Garamond", "Elegante", 600]];
const EMOJIS = ["💗", "💖", "💕", "💘", "💌", "💋", "🌸", "🌷", "🌹", "🌼", "⭐", "✨", "🌙", "☁️", "🌈", "🦋", "🧸", "🐻", "🐱", "🐰", "🍓", "🍰", "🎀", "🫶"];
const CARA = (y = 46) => `<circle cx="38" cy="${y}" r="4" fill="#4a2a3a"/><circle cx="62" cy="${y}" r="4" fill="#4a2a3a"/><path d="M44 ${y + 9}q6 6 12 0" stroke="#4a2a3a" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="${y + 9}" rx="5" ry="3" fill="#ffadc8"/><ellipse cx="70" cy="${y + 9}" rx="5" ry="3" fill="#ffadc8"/>`;
/* Stickers hechos aquí (con su orilla blanca de sticker). */
const STICKERS = {
  corazon: `<path d="M50 90S8 63 8 35C8 20 19 10 32 10c8 0 14 4 18 11 4-7 10-11 18-11 13 0 24 10 24 25 0 28-42 55-42 55z" fill="#ff7aa8" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>${CARA(42)}`,
  estrella: `<path d="M50 6l12 27 29 3-22 20 7 29-26-15-26 15 7-29L9 36l29-3z" fill="#ffd84d" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>${CARA(50)}`,
  nube: `<path d="M26 78a18 18 0 0 1-2-36 24 24 0 0 1 46-6 20 20 0 0 1 6 42z" fill="#fff" stroke="#bfe0ff" stroke-width="5" stroke-linejoin="round"/>${CARA(56)}`,
  flor: `<g stroke="#fff" stroke-width="5">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="50" cy="27" rx="17" ry="23" fill="#ffb0cc" transform="rotate(${a} 50 50)"/>`).join("")}</g><circle cx="50" cy="50" r="15" fill="#ffd84d" stroke="#fff" stroke-width="5"/>`,
  carta: `<rect x="10" y="24" width="80" height="56" rx="10" fill="#fff" stroke="#ffb0cc" stroke-width="5"/><path d="M12 28l38 28 38-28" fill="none" stroke="#ffb0cc" stroke-width="5" stroke-linejoin="round"/><path d="M50 72s-13-8-13-16c0-4 3-7 7-7 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 3 7 7 0 8-13 16-13 16z" fill="#ff5c93"/>`,
  brillo: `<path d="M50 4c4 26 20 42 46 46-26 4-42 20-46 46-4-26-20-42-46-46C30 46 46 30 50 4z" fill="#c8a6ff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="50" r="8" fill="#fff" opacity=".8"/>`,
  gatito: `<path d="M18 30 22 6l20 16h16L78 6l4 24c8 8 10 18 10 26 0 22-20 36-42 36S8 78 8 56c0-8 2-18 10-26z" fill="#ffe3b8" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>${CARA(52)}<path d="M50 60v4" stroke="#4a2a3a" stroke-width="3" stroke-linecap="round"/>`,
  arcoiris: `<g fill="none" stroke-linecap="round"><path d="M12 72a38 38 0 0 1 76 0" stroke="#fff" stroke-width="34"/><path d="M14 72a36 36 0 0 1 72 0" stroke="#ff8fb3" stroke-width="9"/><path d="M23 72a27 27 0 0 1 54 0" stroke="#ffd84d" stroke-width="9"/><path d="M32 72a18 18 0 0 1 36 0" stroke="#8fd3ff" stroke-width="9"/></g>`,
};
const svgDe = (k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${STICKERS[k] || ""}</svg>`;
const urlSvg = (k) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgDe(k));

/* Los dibujitos de las herramientas: el cuerpo gris y la punta del color que tienes. */
const HERR_SVG = {
  plumon: '<path class="dz-i-cuerpo" d="M11 30V18l2-3h6l2 3v12z"/><path class="dz-i-punta" d="M13 15l1.6-7.4a1.4 1.4 0 0 1 2.8 0L19 15z"/>',
  pincel: '<path class="dz-i-cuerpo" d="M14.4 30h3.2l.6-13h-4.4z"/><path class="dz-i-metal" d="M13.5 17h5l.4-3.4h-5.8z"/><path class="dz-i-punta" d="M13.1 13.6c0-4 1.5-8 2.9-11.6 1.4 3.6 2.9 7.6 2.9 11.6z"/>',
  lapiz: '<path class="dz-i-cuerpo" d="M12 30V14h8v16z"/><path class="dz-i-madera" d="M12 14l4-9.5 4 9.5z"/><path class="dz-i-punta" d="M14.6 7.8 16 4.5l1.4 3.3z"/><path class="dz-i-raya" d="M14.7 15v15M17.3 15v15"/>',
  neon: '<path class="dz-i-cuerpo" d="M12 30V17l1.5-2h5l1.5 2v13z"/><path class="dz-i-punta" d="M13.5 15l1-6.5h3l1 6.5z"/><path class="dz-i-brillo" d="M25 3l1 2.4 2.5 1-2.5 1L25 10l-1-2.6-2.5-1 2.5-1z"/>',
  cubeta: '<path class="dz-i-cuerpo" d="M6.5 14.5 15 6l9.5 9.5L16 24z"/><path class="dz-i-metal" d="M6.5 14.5h18"/><path class="dz-i-punta" d="M25.5 17c2 2.8 3.2 4.7 3.2 6.2a3.2 3.2 0 0 1-6.4 0c0-1.5 1.2-3.4 3.2-6.2z"/><path class="dz-i-asa" d="M10.5 10.5c-2-3.5 1-7.5 4.5-5"/>',
  borrador: '<g transform="rotate(-40 16 16)"><rect class="dz-i-cuerpo" x="10" y="6" width="12" height="20" rx="3"/><rect class="dz-i-rosa" x="10" y="19" width="12" height="7" rx="2.5"/></g>',
  crayon: '<path class="dz-i-cuerpo" d="M11.5 30V15.5l1.2-1.5h6.6l1.2 1.5V30z"/><path class="dz-i-papel" d="M11.5 19h9v7h-9z"/><path class="dz-i-punta" d="M12.7 14l1.8-7.2a1.6 1.6 0 0 1 3 0l1.8 7.2z"/>',
  regla: '<g transform="rotate(-40 16 16)"><rect class="dz-i-cuerpo" x="3" y="11.5" width="26" height="9" rx="2"/><path class="dz-i-raya" d="M7 11.5v3.5M10.5 11.5v2.2M14 11.5v3.5M17.5 11.5v2.2M21 11.5v3.5M24.5 11.5v2.2"/></g>',
};
const svgHerr = (k) => `<svg viewBox="0 0 32 32" aria-hidden="true">${HERR_SVG[k]}</svg>`;
const AVION = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M5 30 59 7 45 57 32 39z" fill="#ff8fb8"/><path d="M32 39 59 7 23 34z" fill="#ffc6da"/><path d="M32 39l-4 15 10-9z" fill="#e5679a"/></svg>';
const GROSOR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6c5-3 11 3 16 0M4 12c5-3 11 3 16 0M4 18c5-3 11 3 16 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const GIRO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 0 1 12-4.9M19 12a7 7 0 0 1-12 4.9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M17.5 3.5v4h-4M6.5 20.5v-4h4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" fill="currentColor"/></svg>';

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch (e) { return d; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const oscuro = (c) => { const n = parseInt((c || "#fff").slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 110; };
const cargarImg = (src) => new Promise((ok, mal) => { const im = new Image(); im.decoding = "async"; im.onload = () => ok(im); im.onerror = () => mal(new Error("No se pudo abrir la imagen.")); im.src = src; });
const nid = () => Math.random().toString(36).slice(2, 9);
const limpio = (s) => (s || "dibujito").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "dibujito";
const escapar = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* Papeles para la hoja (Bonita). */
const PAPELES = [["liso", "Lisito"], ["puntos", "Puntitos"], ["cuadros", "Cuadritos"], ["rayas", "Rayitas"], ["corazones", "Corazoncitos"]];
const LAPIZV_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><path class="dz-lv-cuerpo" d="M14 40 38 16l-6-6L8 34z"/><path class="dz-lv-goma" d="M38 16l4-4a3 3 0 0 0 0-4l-2-2a3 3 0 0 0-4 0l-4 4z"/><path class="dz-lv-madera" d="M8 34l6 6-9 3z"/><path class="dz-lv-punta" d="M5 43l2.2-6.4 4.2 4.2z"/></svg>';
const MANO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 17.5 6.5l-2.5-2.5L2.5 16.5 2 20z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 18c1.5 1.4 3.6 2 5.6 1.4M16.5 14.5c1 .9 2.3 1.2 3.5.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const GOTERO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5a2.8 2.8 0 0 1 4 4l-1.8 1.8 1 1-1.6 1.6-6-6 1.6-1.6 1 1z" fill="currentColor"/><path d="M10.4 8.6 4 15l-.8 4.6.2.2 4.6-.8 6.4-6.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
const LUPA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const MAS = [["bonita", "Bonita", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 4.6 4.9.4-3.7 3.2 1.1 4.8L12 13.5 7.8 16l1.1-4.8L5.2 8l4.9-.4z" fill="currentColor"/><path d="M5 20h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'],
  ["fondo", "Fondo", '<span class="dz-chip-fondo"></span>'], ["stickers", "Stickers", null], ["texto", "Texto", '<b class="dz-chip-t">Aa</b>'], ["foto", "Imágenes", null]];

/* Colores ↔ HSV (para la ruedita y el cuadrito). */
const aHsv = (hex) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m;
  let h = 0;
  if (d) h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: M ? d / M : 0, v: M };
};
const aHex = ({ h, s, v }) => {
  const f = (k) => { const x = (k + h / 60) % 6; return v - v * s * Math.max(0, Math.min(x, 4 - x, 1)); };
  return "#" + [f(5), f(3), f(1)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
};

/**
 * El rasgueo de lo que dibujas: ruido filtrado que sube y baja con la velocidad del trazo. Cada pincel tiene
 * su timbre. Se apaga solo si algo no avisa, al esconder la app y cuando se cierra lo que lo usaba.
 */
export class Rasgueo {
  constructor(app) { this.app = app; this.x = null; }
  empezar(h) {
    const S = this.app.sonidos, ac = this.app.audio?.ac;
    if (this.x || !S?.pref?.on || S.callado || !ac || document.hidden) return;
    try {
      this.app.audio._despertar?.();
      const TONO = { lapiz: [3400, 1.3, 0.5], crayon: [2200, 0.8, 0.5], plumon: [1700, 0.9, 0.32], pincel: [950, 0.7, 0.4], neon: [2600, 1.6, 0.26], borrador: [700, 0.6, 0.45] }[h] || [1600, 1, 0.3];
      if (!Rasgueo.buf || Rasgueo.buf.sampleRate !== ac.sampleRate) {
        const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        Rasgueo.buf = b;
      }
      const t = ac.currentTime, fuente = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      fuente.buffer = Rasgueo.buf; fuente.loop = true;
      bp.type = "bandpass"; bp.frequency.value = TONO[0]; bp.Q.value = TONO[1];
      g.gain.setValueAtTime(0, t);
      fuente.connect(bp).connect(g).connect(S._bus?.() || ac.destination);
      fuente.start(t, Math.random());
      this.x = { fuente, bp, g, vol: Math.max(0, Math.min(1, S.pref.vol)) * TONO[2], f: TONO[0] };
      Rasgueo.todos.add(this);
      clearTimeout(this._t); this._t = setTimeout(() => this.parar(), 30000);
    } catch (e) { this.x = null; }
  }
  vel(v) {
    const x = this.x, ac = this.app.audio?.ac;
    if (!x || !ac) return;
    const k = Math.min(1, v / 5), t = ac.currentTime;
    x.g.gain.setTargetAtTime(x.vol * (0.08 + k * 0.92), t, 0.04);
    x.bp.frequency.setTargetAtTime(x.f * (0.85 + k * 0.4), t, 0.05);
  }
  parar() {
    const x = this.x, ac = this.app.audio?.ac;
    this.x = null; clearTimeout(this._t); Rasgueo.todos.delete(this);
    if (!x || !ac) return;
    const t = ac.currentTime;
    x.g.gain.cancelScheduledValues(t); x.g.gain.setValueAtTime(x.g.gain.value, t); x.g.gain.setTargetAtTime(0, t, 0.03);
    try { x.fuente.stop(t + 0.2); } catch (e) { /* ya paró */ }
  }
}
Rasgueo.todos = new Set();
document.addEventListener("visibilitychange", () => { if (document.hidden) for (const r of [...Rasgueo.todos]) r.parar(); });

/** El papel de la hoja (liso, puntitos, cuadritos, rayitas o corazoncitos) sobre su color. */
function pintarPapel(g, W, H, tipo, fondo) {
  g.fillStyle = fondo; g.fillRect(0, 0, W, H);
  if (!tipo || tipo === "liso") return;
  const os = oscuro(fondo), tinta = os ? "rgba(255,255,255,.16)" : "rgba(120,70,100,.15)";
  g.save();
  if (tipo === "puntos") { g.fillStyle = tinta; for (let y = 36; y < H; y += 44) for (let x = 36; x < W; x += 44) { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); } }
  else if (tipo === "cuadros") { g.strokeStyle = tinta; g.lineWidth = 2; g.beginPath(); for (let x = 48; x < W; x += 48) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = 48; y < H; y += 48) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); }
  else if (tipo === "rayas") {
    g.strokeStyle = tinta; g.lineWidth = 2.4; g.beginPath(); for (let y = 120; y < H; y += 56) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
    g.strokeStyle = os ? "rgba(255,170,200,.35)" : "rgba(255,120,160,.38)"; g.lineWidth = 3; g.beginPath(); g.moveTo(96, 0); g.lineTo(96, H); g.stroke();
  } else if (tipo === "corazones") {
    g.fillStyle = os ? "rgba(255,180,210,.22)" : "rgba(255,120,165,.18)";
    const c = new Path2D("M0 9C-6 4-10 1-10-3a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 4-4 7-10 12z");
    let f = 0;
    for (let y = 50; y < H + 40; y += 92, f++) for (let x = f % 2 ? 96 : 50; x < W + 40; x += 92) { g.save(); g.translate(x, y); g.rotate(((x + y) % 7 - 3) * 0.08); g.fill(c); g.restore(); }
  }
  g.restore();
}

export class EstudioDibujo {
  constructor(app) { this.app = app; this.abierto = false; }

  /** El dibujito que se quedó sin mandar (o null). */
  static guardado() { const g = leer(GUARDA, null); return g && (g.v === 1 || g.v === 2) && Array.isArray(g.log) ? g : null; }
  static borrarGuardado() { try { localStorage.removeItem(GUARDA); } catch (e) { /* nada */ } }

  abrir({ nombre = "", seguir = false } = {}) {
    if (this.abierto) return;
    this.abierto = true;
    const g = seguir ? EstudioDibujo.guardado() : null;
    if (!seguir) EstudioDibujo.borrarGuardado();
    const pref = leer(PREF, {});
    this.nombre = (g?.nombre || nombre || "Un dibujito").slice(0, 60);
    this.fondo = g?.fondo || "#ffffff";
    this.tam = TAMANOS[g?.tam] ? g.tam : "3:4";
    [this.W, this.H] = TAMANOS[this.tam];
    this.papel = g?.papel || "liso";
    this.infinito = !!g?.infinito;
    this.vista = g?.vista && this.infinito ? { s: g.vista.s || 1, x: g.vista.x || 0, y: g.vista.y || 0 } : { s: 1, x: 0, y: 0 };
    this.herr = PINCELES[pref.herr] || pref.herr === "cubeta" ? pref.herr : "plumon";
    this.color = pref.color || "#3a2a35";
    this.opac = Math.max(0.05, Math.min(1, +pref.opac || 1));
    this.recientes = Array.isArray(pref.recientes) ? pref.recientes.slice(0, 6) : [];
    this.grosores = { ...Object.fromEntries(Object.entries(PINCELES).map(([k, v]) => [k, v.s])), ...(pref.grosores || {}) };
    this.virtual = !!pref.virtual;
    this.objs = Array.isArray(g?.objs) ? g.objs : [];
    this.fotos = new Map(Object.entries(g?.fotos || {}));
    this.H_ = []; this.R = [];
    this.modo = "componer"; this.sel = null; this.enviando = false; this.enviado = false;
    this.dedos = new Map(); this.trazo = null; this.gObj = null; this.gRegla = null; this.dos = null; this.gV = null;
    this.puntaV = null; this.armado = false; this.gotero = false;
    this.regla = { on: false, x: this.W / 2, y: this.H * 0.46, a: -0.62, largo: 2800, grueso: 124 };
    this.rasgueo = new Rasgueo(this.app);
    this._armar();
    this._ponerFondo(this.fondo, false);
    this._crearLienzo(g?.log || []);
    document.body.append(this.capa);
    document.body.classList.add("con-dibujito");
    this._acomodar();
    this._pintarObjs(); this._pintarHerr(); this._pintarColores(); this._cambio(false);
    requestAnimationFrame(() => requestAnimationFrame(() => this.capa.classList.add("ver")));
    this.app.sonidos?.sonar("abrir");
    if (g) setTimeout(() => aviso(`Seguimos con «${this.nombre}» ♡`, 2200), 300);
    if (!PF.datos?.().pareja && SRV.conectado()) this._pareja().catch(() => {});
  }

  async _pareja() {
    let pa = PF.datos?.().pareja;
    if (!pa && SRV.conectado()) pa = (await SRV.amor())?.pareja || null;
    if (pa && this.paraS) this.paraS.textContent = `para ${PF.nombreDe(pa)}`;
    return pa;
  }

  atras() {
    if (!this.abierto) return false;
    if (this.escribiendo) { this.escribiendo.cerrar(); return true; }
    if (this.hojita) { this.hojita.cerrar(); return true; }
    if (this.listoCaja) { this.cerrar(); return true; }
    if (this.enviando) return true;
    if (this.gotero) { this._ponerGotero(false); return true; }
    if (this.grosorVisible) { this._grosor(false); return true; }
    if (this.cajon.classList.contains("alto")) { this._cajonAlto(false); return true; }
    if (this.modo === "dibujar") { this._modo("componer"); return true; }
    this.cerrar();
    return true;
  }

  cerrar({ sinMenu = false } = {}) {
    if (!this.abierto) return;
    this.abierto = false;
    clearTimeout(this._tg); clearTimeout(this._tRender);
    if (!this.enviado) this._guardar(true);
    this.rasgueo.parar();
    removeEventListener("resize", this._alResize);
    removeEventListener("keydown", this._tecla, true);
    this.escribiendo?.cerrar(); this.hojita?.cerrar();
    const capa = this.capa;
    capa.classList.remove("ver");
    capa.classList.add("saliendo");
    setTimeout(() => { capa.remove(); this._soltarMemoria(); }, reducido() ? 0 : 320);
    document.body.classList.remove("con-dibujito");
    this.app.sonidos?.sonar("cerrar");
    if (!this.enviado && (this.lienzo.hayAlgo() || this.objs.length)) aviso("Tu dibujito quedó guardado: lo sigues en Crear detallito → Dibujito", 4200);
    if (!sinMenu) this.app.salida?.alMenu?.();
  }

  /** El dibujo para mandarlo: sin lo que quedó totalmente tapado (pesa menos y se repite más rápido). */
  _logLimpio() {
    const log = this.lienzo.log;
    if (this.infinito) return log;
    const oc = ocultas(log, this.W, this.H);
    return oc.size ? log.filter((o) => !oc.has(o)) : log;
  }

  /** Al cerrar, los lienzos grandes se sueltan (en el teléfono, cada uno pesa varios MB). */
  _soltarMemoria() {
    for (const c of [this.cLienzo, this.cVivo, this.cPapel, this.antes]) if (c) { c.width = 1; c.height = 1; }
    this.lienzo = null; this.fotos?.clear();
  }

  /* ─────────────── La pantalla ─────────────── */

  _armar() {
    const b = (clase, props, hijos) => el("button." + clase, { type: "button", ...props }, hijos);
    const pareja = PF.datos?.().pareja;
    this.tituloB = el("b", { text: this.nombre });
    this.cab = el("header.dz-cab", {}, [
      b("dz-redondo.dz-atras", { "aria-label": "Atrás", html: ico("izquierda"), onClick: () => this.atras() }),
      el("div.dz-titulo", {}, [this.tituloB, this.paraS = el("small", { text: pareja ? `para ${PF.nombreDe(pareja)}` : "un dibujito" })]),
      b("dz-redondo.dz-basura", { "aria-label": "Borrar todo", title: "Borrar todo", html: ico("borrar"), onClick: () => this._basura() }),
    ]);
    // La hoja: papel, trazos, el trazo de ahora y los objetos van en «el mundo» (lo que se acerca y aleja).
    this.cPapel = el("canvas.dz-papel", { "aria-hidden": "true" });
    this.cLienzo = el("canvas.dz-lienzo", { "aria-label": "Tu dibujito" });
    this.cVivo = el("canvas.dz-vivo", { "aria-hidden": "true" });
    this.capaObjs = el("div.dz-objs");
    this.mundo = el("div.dz-mundo", {}, [this.cPapel, this.cLienzo, this.cVivo, this.capaObjs]);
    this.reglaN = el("div.dz-regla", { hidden: "", "aria-hidden": "true" });
    this.grosorN = this._armarGrosor();
    this.pista = el("div.dz-pista", { "aria-hidden": "true" }, [el("i", { html: svgHerr("lapiz") }), el("span", { text: "Toca la hoja para dibujar" })]);
    this.cursor = el("i.dz-cursor", { "aria-hidden": "true" });
    this.lapizV = el("i.dz-lapizv", { hidden: "", "aria-hidden": "true", html: LAPIZV_SVG });
    this.hoja = el("div.dz-hoja", { style: { "--fondo": this.fondo } }, [this.mundo, this.reglaN, this.pista, this.lapizV, this.grosorN, this.cursor]);
    this.centro = el("main.dz-centro", {}, [this.hoja]);
    // Componer: lo de abajo de la hoja.
    const chip = (k, t, html, al) => b("dz-chip", { dataset: { k }, "aria-label": t, title: t, onClick: al }, [el("i", { html }), el("small", { text: t })]);
    const corazon = `<svg viewBox="0 0 100 100" aria-hidden="true">${STICKERS.corazon}</svg>`;
    this.chips = el("div.dz-chips", {}, [
      chip("bonita", "Bonita", MAS[0][2], () => this._bonita()),
      chip("fondo", "Fondo", '<span class="dz-chip-fondo"></span>', () => this._elegirFondo()),
      chip("stickers", "Stickers", corazon, () => this._elegirSticker()),
      chip("texto", "Texto", '<b class="dz-chip-t">Aa</b>', () => this._escribir()),
      chip("foto", "Imágenes", ico("imagen"), () => this._foto()),
    ]);
    this.deshacerB = b("dz-icono", { "aria-label": "Deshacer", title: "Deshacer (Ctrl+Z)", html: ico("deshacer"), onClick: () => this.deshacer() });
    this.rehacerB = b("dz-icono", { "aria-label": "Rehacer", title: "Rehacer (Ctrl+Y)", html: ico("rehacer"), onClick: () => this.rehacer() });
    this.zoomB = b("dz-zoom-b", { hidden: "", title: "Volver al tamaño de la hoja", "aria-label": "Volver al tamaño de la hoja", onClick: () => this._zoomInicio() }, [el("i", { html: LUPA_SVG }), el("span", { text: "100%" })]);
    this.centro.append(this.zoomB);   // flota sobre la hoja: no empuja la barrita
    this.virtualB = b("dz-cuadro.dz-virtual-b", { "aria-label": "Lápiz virtual", title: "Lápiz virtual: lo mueves sin pintar y un toque lo arma", "aria-pressed": String(this.virtual), html: MANO_SVG, onClick: () => this._ponerVirtual(!this.virtual) });
    this.grosorB = b("dz-cuadro.dz-grosor-b", { "aria-label": "Grosor", title: "Grosor", html: GROSOR_SVG, onClick: () => this._grosor(!this.grosorVisible) });
    this.barra = el("div.dz-barra", {}, [this.deshacerB, this.rehacerB, el("span.dz-hueco"), this.virtualB, this.grosorB,
      b("dz-cuadro.dz-listo-b", { "aria-label": "Listo", onClick: () => this._modo("componer") }, [el("span", { text: "listo" }), el("i", { html: ico("ok") })])]);
    this.medio = el("div.dz-medio", {}, [this.chips, this.barra]);
    // Componer: deshacer · mandar · guardar.
    this.anillo = el("i.dz-anillo", { html: '<svg viewBox="0 0 100 100"><circle class="dz-anillo-fondo" cx="50" cy="50" r="46"/><circle class="dz-anillo-avance" cx="50" cy="50" r="46" pathLength="100"/></svg>' });
    this.mandarB = b("dz-mandar", { "aria-label": "Mandárselo a tu amorcito", title: "Mandárselo", onClick: (e) => this._carta(e.currentTarget) }, [this.anillo, el("span.dz-mandar-c", { html: AVION })]);
    this.deshacer2 = b("dz-icono.dz-grande", { "aria-label": "Deshacer", title: "Deshacer", html: ico("deshacer"), onClick: () => this.deshacer() });
    this.pie = el("div.dz-pie", {}, [this.deshacer2, this.mandarB, b("dz-icono.dz-grande", { "aria-label": "Guardar imagen", title: "Guardar imagen", html: ico("exportar"), onClick: (e) => this._guardarImagen(e.currentTarget) })]);
    // Dibujar: el cajón (se desliza hacia arriba para ver Bonita, Fondo, Stickers, Texto e Imágenes).
    this.coloresN = el("div.dz-colores", { role: "radiogroup", "aria-label": "Colores" });
    this.herrN = el("div.dz-herrs", { role: "toolbar", "aria-label": "Herramientas" });
    this.masN = el("div.dz-cajon-mas", {}, MAS.map(([k, t, html]) => b("dz-mas-b", { dataset: { k }, "aria-label": t, onClick: () => this._opcion(k) }, [
      el("i", { html: html || (k === "stickers" ? corazon : ico("imagen")) }), el("small", { text: t }),
    ])));
    this.asa = el("button.dz-asa-zona", { type: "button", "aria-label": "Más opciones (desliza)", "aria-expanded": "false" }, [el("i.dz-asa")]);
    this.cajon = el("section.dz-cajon", { "aria-label": "Herramientas de dibujo" }, [this.asa, this.masN, this.coloresN, this.herrN]);
    this._enlazarCajon();
    this.abajo = el("div.dz-abajo", {}, [this.pie, this.cajon]);
    const fondo = el("div.dz-fondo", { "aria-hidden": "true" }, [el("i"), el("i"), el("i")]);
    this.capa = el("div.dz-capa", { role: "dialog", "aria-modal": "true", "aria-label": "Dibujito" }, [fondo, this.cab, this.centro, el("div.dz-lado", {}, [this.medio, this.abajo])]);
    for (const [t, f] of [["pointerdown", (e) => this._bajar(e)], ["pointermove", (e) => this._mover(e)], ["pointerup", (e) => this._subir(e)], ["pointercancel", (e) => this._subir(e, true)], ["pointerleave", (e) => { if (e.pointerType === "mouse") { this.cursor.classList.remove("ve"); if (!this.dedos.size) this._rect = null; } }]])
      this.hoja.addEventListener(t, f);
    this.hoja.addEventListener("contextmenu", (e) => e.preventDefault());
    // Lápiz virtual: el otro dedo puede tocar en cualquier parte de la pantalla (no sólo en la hoja).
    this.capa.addEventListener("pointerdown", (e) => {
      if (!this.virtual || !this.gV || e.pointerType !== "touch" || this.hoja.contains(e.target) || e.target.closest("button, input, textarea")) return;
      e.preventDefault();
      this._toqueVirtual();
    });
    this.hoja.addEventListener("wheel", (e) => this._rueda(e), { passive: false });
    this._alResize = () => this._acomodar();
    addEventListener("resize", this._alResize);
    this._tecla = (e) => this._teclado(e);
    addEventListener("keydown", this._tecla, true);
  }

  /** La hoja (normal o infinita) con lo que ya había. */
  _crearLienzo(log) {
    const L = this.infinito ? new LienzoInfinito(this.cLienzo, this.W, this.H) : new Lienzo(this.cLienzo, this.W, this.H);
    if (this.infinito) L.cargar(log, this.vista); else L.cargar(log);
    this.lienzo = L;
    this.vctx = this.cVivo.getContext("2d");
    this.cVivo.width = this.W; this.cVivo.height = this.H;
    this.antes ||= document.createElement("canvas");
    this.antes.width = this.W; this.antes.height = this.H;
    this.cPapel.width = this.W; this.cPapel.height = this.H;
    // El papel: en la hoja normal se acerca con todo; en la infinita se queda quieto (es la hoja, no el mundo).
    (this.infinito ? this.hoja : this.mundo).prepend(this.cPapel);
    this._pintarPapel();
    this.reglaN.innerHTML = this._reglaSvg();
    if (this.regla.on) this._dibujarRegla();
    this.capa.style.setProperty("--ar", `${this.W} / ${this.H}`);
    this._aplicarVista();
  }
  _pintarPapel() { pintarPapel(this.cPapel.getContext("2d"), this.W, this.H, this.papel, this.fondo); }

  _acomodar() {
    const c = this.centro;
    if (!c?.isConnected) return;
    const w0 = c.clientWidth - 24, h0 = c.clientHeight - 8, ar = this.W / this.H;
    const w = Math.max(160, Math.floor(Math.min(w0, h0 * ar)));
    this.hoja.style.width = w + "px";
    this.hoja.style.height = Math.round(w / ar) + "px";
    this._u = w / this.W;
    this.hoja.style.setProperty("--u", this._u.toFixed(5) + "px");
    this.mundo.style.width = this.W + "px"; this.mundo.style.height = this.H + "px";
    this.mundo.style.setProperty("--k", this._u.toFixed(5));
    this._rect = null;
    this._aplicarVista();
    this._ponerCursor();
  }

  _modo(m) {
    if (this.modo === m || this.enviando) return;
    this.modo = m;
    this.capa.classList.toggle("dibujando", m === "dibujar");
    if (m === "dibujar") this._seleccionar(null);
    else { this._grosor(false); this._cajonAlto(false); this.cursor.classList.remove("ve"); this._ponerGotero(false); this._guardarPref(); }
    this._verLapizV();
    this.app.sonidos?.sonar("dz-hoja");
    this._cambio(false);
  }

  _pintarHerr() {
    const lista = ["plumon", "pincel", "lapiz", "crayon", "neon", "cubeta", "borrador", "regla"];
    const nombres = { cubeta: "Cubeta", regla: "Regla", ...Object.fromEntries(Object.entries(PINCELES).map(([k, v]) => [k, v.n])) };
    this.herrN.replaceChildren(...lista.map((k) => {
      const on = k === "regla" ? this.regla.on : this.herr === k;
      return el("button.dz-herr" + (on ? ".on" : ""), {
        type: "button", dataset: { k }, title: nombres[k], "aria-label": nombres[k], "aria-pressed": String(on), html: svgHerr(k),
        onClick: () => (k === "regla" ? this._ponerRegla(!this.regla.on) : this._elegirHerr(k)),
      });
    }), this.arcoiris = el("button.dz-arcoiris", { type: "button", title: "Tu color (ruedita, cuadrito, opacidad y gotero)", "aria-label": "Elegir color", onClick: () => this._selectorColor() }, [el("i")]));
    this._pintarTinta();
  }
  _pintarTinta() {
    this.capa.style.setProperty("--tinta", this.color);
    this.capa.style.setProperty("--opac", String(this.opac));
    const i = this.arcoiris?.querySelector("i");
    if (i) i.style.background = `linear-gradient(${this._rgba(this.color, this.opac)}, ${this._rgba(this.color, this.opac)}), repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0 / 10px 10px`;
  }
  _rgba(c, a) { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  _pintarColores() {
    const lista = COLORES;   // (tus colores están en la ruedita: así todos caben sin deslizar)
    this.coloresN.replaceChildren(...lista.map((c) => el("button.dz-color" + (c === this.color ? ".on" : ""), {
      type: "button", role: "radio", "aria-checked": String(c === this.color), "aria-label": "Color " + c, style: { "--c": c }, dataset: { c },
      onClick: () => this._elegirColor(c),
    })));
  }

  _elegirHerr(k) {
    this._ponerGotero(false);
    if (this.herr === k) { if (k !== "cubeta") this._grosor(!this.grosorVisible); return; }
    this.herr = k;
    this.app.sonidos?.sonar("dz-herramienta");
    vibrar(6);
    for (const n of this.herrN.querySelectorAll(".dz-herr")) if (n.dataset.k !== "regla") { const on = n.dataset.k === k; n.classList.toggle("on", on); n.setAttribute("aria-pressed", String(on)); }
    this.herrN.querySelector(`[data-k="${k}"]`)?.animate?.([{ transform: "translateY(-6px) scale(1.12)" }, { transform: "translateY(-10px) scale(.96)" }, { transform: "" }], { duration: 320, easing: "cubic-bezier(.3,1.5,.5,1)" });
    this.capa.classList.toggle("con-cubeta", k === "cubeta");
    if (this.grosorVisible) this._grosor(k !== "cubeta");
    this._ponerCursor();
  }

  _elegirColor(c, sinSonido = false, reciente = false) {
    if (!/^#[0-9a-f]{6}$/i.test(c)) return;
    const antes = this.color;
    this.color = c.toLowerCase();
    if (reciente && !COLORES.includes(this.color)) { this.recientes = [this.color, ...this.recientes.filter((x) => x !== this.color)].slice(0, 6); this._pintarColores(); }
    for (const n of this.coloresN.children) { const on = n.dataset.c === this.color; n.classList.toggle("on", on); n.setAttribute("aria-checked", String(on)); }
    this._pintarTinta();
    if (antes !== this.color && !sinSonido) { this.app.sonidos?.sonar("dz-color"); vibrar(5); }
    if (this.herr === "borrador") this._elegirHerr("plumon");
    this._pintarPunto();
  }

  _guardarPref() { escribir(PREF, { herr: this.herr, color: this.color, opac: this.opac, recientes: this.recientes, grosores: this.grosores, virtual: this.virtual }); }

  /* — El cajón: se desliza para arriba (más opciones) y para abajo — */
  _enlazarCajon() {
    let g = null;
    const fin = (e) => {
      if (!g || e.pointerId !== g.id) return;
      const dy = e.clientY - g.y, rapido = performance.now() - g.t < 260 && Math.abs(dy) < 6;
      this.cajon.style.transform = "";
      this.cajon.classList.remove("arrastrando");
      if (rapido) this._cajonAlto(!this.cajon.classList.contains("alto"));
      else if (dy < -18) this._cajonAlto(true);
      else if (dy > 18) this._cajonAlto(false);
      g = null;
    };
    this.asa.addEventListener("pointerdown", (e) => { g = { id: e.pointerId, y: e.clientY, t: performance.now() }; try { this.asa.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } this.cajon.classList.add("arrastrando"); });
    this.asa.addEventListener("pointermove", (e) => {
      if (!g || e.pointerId !== g.id) return;
      const dy = e.clientY - g.y, alto = this.cajon.classList.contains("alto");
      this.cajon.style.transform = `translateY(${Math.max(alto ? -10 : -90, Math.min(alto ? 90 : 30, dy)) * (alto ? 1 : 0.5)}px)`;
    });
    this.asa.addEventListener("pointerup", fin); this.asa.addEventListener("pointercancel", fin);
    this.asa.addEventListener("click", (e) => { if (e.detail === 0) this._cajonAlto(!this.cajon.classList.contains("alto")); });
  }
  _cajonAlto(si) {
    if (this.cajon.classList.contains("alto") === !!si) return;
    this.cajon.classList.toggle("alto", !!si);
    this.asa.setAttribute("aria-expanded", String(!!si));
    this.app.sonidos?.sonar(si ? "abrir" : "cerrar");
    vibrar(5);
  }
  _opcion(k) {
    this._cajonAlto(false);
    if (k === "bonita") this._bonita();
    else if (k === "fondo") this._elegirFondo();
    else if (k === "stickers") this._elegirSticker();
    else if (k === "texto") this._escribir();
    else if (k === "foto") this._foto();
  }

  /* — El grosor: barrita vertical en la orilla — */
  _armarGrosor() {
    this.grosorBola = el("i.dz-grosor-bola");
    this.grosorPunto = el("i.dz-grosor-punto");
    const n = el("div.dz-grosor", { hidden: "", role: "slider", "aria-label": "Grosor", "aria-valuemin": "2", "aria-valuemax": "500" }, [el("i.dz-grosor-riel"), this.grosorBola, this.grosorPunto]);
    let activo = null;
    const poner = (e) => {
      const r = n.getBoundingClientRect(), t = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      // (Fase 51: de 2 a 500, mucho más grueso; abajo sigue finito y preciso.)
      const s = Math.round(2 * Math.pow(250, t) * 2) / 2;
      if (this.herr !== "cubeta") this.grosores[this.herr] = s;
      this._pintarPunto();
      this._grosorEspera();
    };
    n.addEventListener("pointerdown", (e) => { e.stopPropagation(); activo = e.pointerId; n.setPointerCapture(e.pointerId); poner(e); this.app.sonidos?.sonar("ajustar"); });
    n.addEventListener("pointermove", (e) => { if (e.pointerId === activo) { e.stopPropagation(); poner(e); } });
    const fin = (e) => { if (e.pointerId === activo) { e.stopPropagation(); activo = null; this._guardarPref(); } };
    n.addEventListener("pointerup", fin); n.addEventListener("pointercancel", fin);
    return n;
  }
  _grosor(si) {
    if (si && this.herr === "cubeta") this._elegirHerr("plumon");
    this.grosorVisible = !!si;
    this.grosorN.hidden = !si;
    this.grosorB.classList.toggle("on", !!si);
    if (si) { this._pintarPunto(); this._grosorEspera(); this.grosorN.animate?.([{ opacity: 0, transform: "translateX(14px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" }); }
    else clearTimeout(this._tgr);
  }
  _grosorEspera() { clearTimeout(this._tgr); this._tgr = setTimeout(() => this._grosor(false), 2600); }
  _pintarPunto() {
    if (!this.grosorBola) return;
    const s = this.grosores[this.herr] || 14, t = Math.min(1, Math.log(s / 2) / Math.log(250));
    this.grosorBola.style.top = ((1 - t) * 100).toFixed(2) + "%";
    this.grosorPunto.style.top = ((1 - t) * 100).toFixed(2) + "%";
    const px = Math.min(120, Math.max(3, s * (this._u || 0.35)));   // (la muestrita no tapa toda la hoja)
    this.grosorPunto.style.width = this.grosorPunto.style.height = px.toFixed(1) + "px";
    this.grosorPunto.style.background = this.herr === "borrador" ? "#fff" : this._rgba(this.color, this.opac);
    this.grosorPunto.classList.toggle("borra", this.herr === "borrador");
    this.grosorN.setAttribute("aria-valuenow", String(s));
  }
  _ponerCursor() {
    const s = (this.grosores?.[this.herr] || 14) * (this._u || 0.35);
    this.cursor?.style.setProperty("--d", Math.max(6, s).toFixed(1) + "px");
    this.cursor?.classList.toggle("borra", this.herr === "borrador");
    this.cursor?.classList.toggle("cubeta", this.herr === "cubeta" || this.gotero);
  }

  /* ─────────────── La vista: acercar, alejar y la hoja infinita ─────────────── */

  /** Del punto de la pantalla a la hoja (unidades de la hoja). El rectángulo se mide al empezar cada gesto. */
  _hp(e) {
    const r = this._rect || (this._rect = this.hoja.getBoundingClientRect());
    return { x: ((e.clientX - r.left) / r.width) * this.W, y: ((e.clientY - r.top) / r.height) * this.H };
  }
  /** De la hoja al mundo (donde viven los trazos y los objetos). */
  _mundoDe(P) { const v = this.vista; return { x: P.x / v.s + v.x, y: P.y / v.s + v.y }; }
  _pt(e) { return this._mundoDe(this._hp(e)); }
  /** La vista con la que se pinta en el lienzo: la normal es la hoja tal cual; la infinita, la que se pintó. */
  _vl() { return this.lienzo.infinito ? this.lienzo.vista : VISTA; }

  _aplicarVista() {
    if (!this.mundo || !this._u) return;
    const v = this.vista, u = this._u;
    if (!this.infinito) this.mundo.style.transform = `translate(${(-v.x * v.s * u).toFixed(2)}px, ${(-v.y * v.s * u).toFixed(2)}px) scale(${(v.s * u).toFixed(5)})`;
    else {
      const r = this.lienzo?.vista || v, k = v.s / r.s;
      this.mundo.style.transform = `translate(${((r.x - v.x) * v.s * u).toFixed(2)}px, ${((r.y - v.y) * v.s * u).toFixed(2)}px) scale(${(k * u).toFixed(5)})`;
    }
    const lejos = Math.abs(v.s - 1) > 0.01 || Math.abs(v.x) > 0.5 || Math.abs(v.y) > 0.5;
    // La infinita empieza en «Zoom 0» (lo más lejos) y de ahí sólo se entra: todo el acercamiento es tuyo.
    // (Sólo se toca lo que cambió: cambiar clases o textos a cada cuadro hacía que el zoom se trabara.)
    const ocultar = !lejos && !this.infinito;
    if (this.zoomB.hidden !== ocultar) this.zoomB.hidden = ocultar;
    const pct = this.infinito ? "Zoom " + Math.max(0, Math.round(Math.log2(v.s))) : Math.round(v.s * 100) + "%";
    if (this.zoomB.lastChild.textContent !== pct) this.zoomB.lastChild.textContent = pct;
    if (this._lejos !== lejos) { this._lejos = lejos; this.capa.classList.toggle("con-zoom", lejos); }
  }
  /** Acercar/alejar alrededor de un punto de la hoja. */
  _zoomEn(f, P, base = this.vista) {
    const w = { x: P.x / base.s + base.x, y: P.y / base.s + base.y };
    let s = base.s * f;
    s = this.infinito ? Math.max(1, Math.min(1e7, s)) : Math.max(1, Math.min(8, s));
    this.vista = { s, x: w.x - P.x / s, y: w.y - P.y / s };
    this._limitarVista();
  }
  _limitarVista() {
    if (this.infinito) return;
    const v = this.vista;
    v.x = Math.max(0, Math.min(this.W - this.W / v.s, v.x));
    v.y = Math.max(0, Math.min(this.H - this.H / v.s, v.y));
  }
  /** En la hoja infinita: se vuelve a pintar con la vista nueva (nítido a cualquier acercamiento). */
  _renderInfinito() {
    clearTimeout(this._tRender);
    if (!this.infinito || !this.lienzo) return;
    this.lienzo.ponerVista(this.vista);
    this._aplicarVista();
    this._pintarObjs();
  }
  _renderPronto(ms = 120) { if (this.infinito) { clearTimeout(this._tRender); this._tRender = setTimeout(() => this._renderInfinito(), ms); } }
  _zoomInicio() {
    this.vista = { s: 1, x: 0, y: 0 };
    if (!reducido()) this.mundo.animate?.([{ opacity: 0.6 }, { opacity: 1 }], { duration: 220 });
    if (this.infinito) this._renderInfinito(); else this._aplicarVista();
    this.app.sonidos?.sonar("zoom-alejar");
    this._cambio();
  }
  _rueda(e) {
    if (this.enviando || this.escribiendo) return;
    e.preventDefault();
    const P = this._hp(e), f = Math.exp(-(e.deltaY || 0) * (e.ctrlKey ? 0.01 : 0.0022));
    this._zoomEn(f, P);
    this._aplicarVista();
    this._renderPronto(140);
    this._guardarPronto();
  }

  /* ─────────────── Los dedos ─────────────── */

  _bajar(e) {
    if (this.enviando || this.escribiendo) return;
    if (e.target.closest(".dz-grosor, .dz-obj-x")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!this.dedos.size && !this.gObj && !this.gV) this._rect = null;
    const P = this._hp(e);
    if (this.gObj) { this._objBajar(e, this.gObj.id); return; }
    if (this.modo === "componer") {
      const o = e.target.closest(".dz-obj");
      if (o) { this._objBajar(e, o.dataset.id, e.target.closest(".dz-obj-giro") ? "giro" : "mover"); return; }
      if (this.sel) { this._seleccionar(null); return; }
      this._modo("dibujar");   // tocar la hoja = a dibujar (y ese mismo toque ya pinta)
    }
    try { this.hoja.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    e.preventDefault();
    this.dedos.set(e.pointerId, P);
    // Lápiz virtual: mientras lo mueves, un toque con otro dedo empieza a dibujar y otro lo para.
    if (this.virtual && this.gV && e.pointerType === "touch" && this.dedos.size === 2) { this._toqueVirtual(); return; }
    if (this.dedos.size === 2) { this._dosDedos(); return; }
    if (this.dedos.size > 2) return;
    if (this.regla.on) {
      const z = this._enRegla(P);
      if (z) { this.gRegla = { modo: z, p0: P, b: { ...this.regla } }; this.reglaN.classList.add("agarrada"); return; }
    }
    if (this.gotero) { this._gotear(P); return; }
    // Lápiz virtual: con el dedo, el lápiz se mueve sin pintar; un toque lo arma.
    if (this.virtual && e.pointerType === "touch") {
      if (!this.puntaV) this.puntaV = { x: Math.max(0, P.x - 10 / this._u), y: Math.max(0, P.y - 72 / this._u) };
      this.gV = { id: e.pointerId, ult: P, t: performance.now(), mov: 0 };
      this._verLapizV();
      return;
    }
    if (this.herr === "cubeta") { this._rellenar(P); return; }
    this._empezarTrazo(e, P);
  }

  _mover(e) {
    if (e.pointerType === "mouse" && this.modo === "dibujar" && !this.dedos.size) {
      const r = this._rect || (this._rect = this.hoja.getBoundingClientRect());
      this.cursor.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      this.cursor.classList.add("ve");
    }
    if (this.gObj?.dedos.has(e.pointerId)) { this._objMover(e); return; }
    if (!this.dedos.has(e.pointerId)) return;
    const P = this._hp(e);
    this.dedos.set(e.pointerId, P);
    if (e.pointerType === "mouse") { const r = this._rect; this.cursor.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`; }
    if (this.gRegla) { this._moverRegla(); return; }
    if (this.dos) { this._moverDos(); return; }
    if (this.gV?.id === e.pointerId) { this._moverVirtual(e); return; }
    const T = this.trazo;
    if (!T || T.id !== e.pointerId) return;
    const lista = e.getCoalescedEvents?.() || [e];
    for (const x of lista.length ? lista : [e]) this._punto(this._hp(x), x.pressure, x.pointerType, x.timeStamp || performance.now());
    this._pintarVivo();
  }

  _subir(e, cancelado = false) {
    if (this.gObj?.dedos.has(e.pointerId)) { this._objSubir(e, cancelado); return; }
    if (!this.dedos.has(e.pointerId)) return;
    this.dedos.delete(e.pointerId);
    if (this.gRegla) {
      if (this.dedos.size) { this.gRegla = { modo: "mover", p0: [...this.dedos.values()][0], b: { ...this.regla } }; return; }
      this.gRegla = null; this.reglaN.classList.remove("agarrada", "girando"); this._iman = null;
      return;
    }
    if (this.dos) {
      if (this.dedos.size) return;
      const d = this.dos; this.dos = null;
      this.capa.classList.remove("zoomeando");
      if (d.zoom) { this._renderInfinito(); this._guardarPronto(); return; }
      // Dos dedos tocando a la vez (sin arrastrar) = deshacer.
      if (!cancelado && performance.now() - d.t < 380 && d.mov < 40) this.deshacer();
      return;
    }
    if (this.gV?.id === e.pointerId) { this._soltarVirtual(cancelado); return; }
    if (this.trazo?.id === e.pointerId) { if (cancelado && this.trazo.op.p.length < 18) this._cancelarTrazo(); else this._terminarTrazo(); }
  }

  _dosDedos() {
    const T = this.trazo;
    if (T) { if (performance.now() - T.t0 < 280 || T.op.p.length < 24) this._cancelarTrazo(); else this._terminarTrazo(); }
    if (this.gV) { this.gV = null; }
    const [a, b] = [...this.dedos.values()];
    if (this.regla.on && (this.gRegla || (this._enRegla(a) && this._enRegla(b)))) {
      this.gRegla = { modo: "dos", p0: [a, b], b: { ...this.regla } };
      this.reglaN.classList.add("agarrada");
      return;
    }
    this.gRegla = null;
    this.dos = { t: performance.now(), mov: 0, zoom: false, p0: [{ ...a }, { ...b }], v0: { ...this.vista }, ultRender: performance.now() };
  }

  /** Dos dedos que se mueven: acercar, alejar y pasearse por la hoja. */
  _moverDos() {
    const d = this.dos, ps = [...this.dedos.values()];
    if (ps.length < 2) return;
    const [a0, b0] = d.p0, [a, b] = ps;
    d.mov = Math.max(d.mov, Math.hypot(a.x - a0.x, a.y - a0.y), Math.hypot(b.x - b0.x, b.y - b0.y));
    const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y) || 1, d1 = Math.hypot(b.x - a.x, b.y - a.y);
    if (!d.zoom && d.mov < 30 && Math.abs(d1 / d0 - 1) < 0.08) return;
    d.zoom = true;
    const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 }, m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    // El punto del mundo que estaba bajo los dedos se queda bajo los dedos.
    const w = { x: m0.x / d.v0.s + d.v0.x, y: m0.y / d.v0.s + d.v0.y };
    let s = d.v0.s * d1 / d0;
    s = this.infinito ? Math.max(1, Math.min(1e7, s)) : Math.max(1, Math.min(8, s));
    this.vista = { s, x: w.x - m.x / s, y: w.y - m.y / s };
    this._limitarVista();
    // Un solo cambio por cuadro de pantalla (los dedos mandan más movimientos que cuadros).
    if (!this._rqVista) this._rqVista = requestAnimationFrame(() => { this._rqVista = 0; this._aplicarVista(); });
    if (!this.capa.classList.contains("zoomeando")) this.capa.classList.add("zoomeando");
    // En la infinita, de vez en cuando se vuelve a pintar (para que se vea nítido aunque sigas acercando).
    if (this.infinito && performance.now() - d.ultRender > 260) {
      const r = this.lienzo.vista.s / s;
      if (r > 1.8 || r < 0.55) { d.ultRender = performance.now(); this._renderInfinito(); }
    }
  }

  /* — Lápiz virtual — */
  _ponerVirtual(si) {
    this.virtual = !!si;
    this.armado = false;
    this.virtualB.classList.toggle("on", this.virtual);
    this.virtualB.setAttribute("aria-pressed", String(this.virtual));
    this.app.sonidos?.sonar(si ? "activar" : "desactivar");
    vibrar(6);
    if (si) aviso("Lápiz virtual: muévelo con un dedo; mientras lo mueves, toca con otro dedo para dibujar y otra vez para parar ✏️", 4200);
    this._verLapizV();
    this._guardarPref();
  }
  _verLapizV() {
    // (Con el lápiz virtual, toda la pantalla es para los dedos: así el segundo dedo no hace que el navegador cancele el primero.)
    this.capa.classList.toggle("con-virtual", this.virtual && this.modo === "dibujar");
    const ve = this.virtual && this.modo === "dibujar" && !!this.puntaV;
    this.lapizV.hidden = !ve;
    if (!ve) return;
    this.lapizV.classList.toggle("armado", this.armado);
    this.lapizV.style.transform = `translate(${(this.puntaV.x * this._u).toFixed(1)}px, ${(this.puntaV.y * this._u).toFixed(1)}px)`;
  }
  _moverVirtual(e) {
    const G = this.gV, lista = e.getCoalescedEvents?.() || [e];
    for (const x of lista.length ? lista : [e]) {
      const P = this._hp(x), dx = P.x - G.ult.x, dy = P.y - G.ult.y;
      G.ult = P; G.mov += Math.hypot(dx, dy) * this._u;
      this.puntaV = { x: Math.max(0, Math.min(this.W, this.puntaV.x + dx)), y: Math.max(0, Math.min(this.H, this.puntaV.y + dy)) };
      if ((this.armado || G.dibuja) && this.herr !== "cubeta") {
        if (!this.trazo && G.mov > 4) this._empezarTrazo({ pointerId: G.id, pressure: 0.5, pointerType: "touch", timeStamp: x.timeStamp }, this.puntaV);
        else if (this.trazo) this._punto(this.puntaV, 0.5, "touch", x.timeStamp || performance.now());
      }
    }
    this._verLapizV();
    if (this.trazo) this._pintarVivo();
  }
  /** El otro dedo tocó mientras mueves el lápiz: empieza o para el trazo justo en la punta. */
  _toqueVirtual() {
    const G = this.gV;
    if (this.herr === "cubeta") { this._rellenar(this.puntaV); return; }
    G.dibuja = !this.trazo;
    if (this.trazo) this._terminarTrazo();
    else this._empezarTrazo({ pointerId: G.id, pressure: 0.5, pointerType: "touch", timeStamp: performance.now() }, this.puntaV);
    vibrar(G.dibuja ? 10 : 5);
    this.lapizV.classList.toggle("armado", G.dibuja || this.armado);
  }
  _soltarVirtual(cancelado) {
    const G = this.gV; this.gV = null;
    if (G.dibuja) { if (this.trazo) this._terminarTrazo(); this._verLapizV(); return; }
    const tap = !cancelado && performance.now() - G.t < 260 && G.mov < 9;
    if (this.trazo) { this._terminarTrazo(); return; }
    if (!tap) return;
    if (this.herr === "cubeta" && this.armado) { this._rellenar(this.puntaV); return; }
    this.armado = !this.armado;
    this.app.sonidos?.sonar(this.armado ? "activar" : "desactivar");
    vibrar(this.armado ? 12 : 6);
    this._verLapizV();
  }

  /* — Trazos — */
  _empezarTrazo(e, P) {
    const h = this.herr;
    const op = { k: "trazo", h, c: this.color, s: (this.grosores[h] || PINCELES[h].s) / this.vista.s, p: [] };
    if (this.opac < 0.999) op.o = +this.opac.toFixed(3);
    const ahora = performance.now();
    this.trazo = { id: e.pointerId, op, t0: ahora, tl: ahora, vel: 0, f: 100, guia: null, sm: null, crudo: null };
    if (h === "borrador") { const a = this.antes.getContext("2d"); a.clearRect(0, 0, this.W, this.H); a.drawImage(this.cLienzo, 0, 0); }
    if (this.grosorVisible) this._grosor(false);
    this._punto(P, e.pressure, e.pointerType, e.timeStamp || ahora);
    this.rasgueo.empezar(h);
    this._pintarVivo();
  }

  /** Un punto del trazo (en la hoja): la regla lo guía, se suaviza el temblorcito del dedo y se guarda en el mundo. */
  _punto(P, presion, tipo, t, ultimo = false) {
    const T = this.trazo, p = T.op.p;
    T.crudo = P;
    // La regla: si el trazo llega a su orilla, desde ahí sigue derechito por ella (y se suelta si te alejas).
    if (this.regla.on) {
      const g = this._guiaRegla(P, T.op.s * this.vista.s, T.guia);
      if (g !== T.guia) { T.guia = g; if (g) { this.app.sonidos?.sonar("iman"); vibrar(5); } }
      if (T.guia) { P = this._proyectar(T.guia, P.x, P.y); T.sm = P; }
    }
    if (!T.guia) {
      const a = tipo === "pen" ? 0.72 : 0.5;
      T.sm = !T.sm || ultimo ? P : { x: T.sm.x + (P.x - T.sm.x) * a, y: T.sm.y + (P.y - T.sm.y) * a };
      P = T.sm;
    }
    const w = this._mundoDe(P), q = 4 * this.vista.s;
    const x = Math.round(w.x * q) / q, y = Math.round(w.y * q) / q;
    if (p.length) {
      const d = Math.hypot(x - p[p.length - 3], y - p[p.length - 2]) * this.vista.s;
      if (d < 1.2 && !ultimo) return;
      const dt = Math.max(1, t - T.tl);
      T.vel = T.vel * 0.6 + (d / dt) * 0.4;
    }
    let f = 100;
    if (PINCELES[T.op.h]?.var) {
      if (tipo === "pen" && presion > 0) f = 22 + presion * 118;
      else { const meta = Math.max(36, Math.min(128, 128 - T.vel * 11)); T.f = T.f * 0.72 + meta * 0.28; f = T.f; }
      if (T.op.h === "crayon") f = 70 + (f - 36) * 0.4;
    }
    p.push(x, y, Math.round(f));
    T.tl = t;
  }

  /** Lo que estás dibujando se ve EXACTO a como queda (se pinta entero cada cuadro): nada de rastros raros. */
  _pintarVivo() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      const T = this.trazo;
      if (!T) return;
      const v = this._vl();
      if (T.op.h === "borrador") {
        const c = this.lienzo.ctx;
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.W, this.H); c.drawImage(this.antes, 0, 0); c.restore();
        pintarTrazo(c, T.op, undefined, v);
      } else {
        this.vctx.setTransform(1, 0, 0, 1, 0, 0);
        this.vctx.clearRect(0, 0, this.W, this.H);
        pintarTrazo(this.vctx, T.op, undefined, v);
      }
      this.rasgueo.vel(T.vel);
    });
  }

  _terminarTrazo() {
    const T = this.trazo;
    if (!T) return;
    // El último punto, sin suavizar: el trazo llega justo hasta donde levantaste el dedo.
    if (T.crudo && !T.guia) this._punto(T.crudo, 0.5, "touch", performance.now(), true);
    this.trazo = null;
    cancelAnimationFrame(this._raf); this._raf = 0;
    this.rasgueo.parar();
    if (!T.op.p.length) return;
    const v = this._vl();
    if (T.op.h === "borrador") {
      const c = this.lienzo.ctx;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.W, this.H); c.drawImage(this.antes, 0, 0); c.restore();
      pintarTrazo(c, T.op, undefined, v);
    } else { this.vctx.setTransform(1, 0, 0, 1, 0, 0); this.vctx.clearRect(0, 0, this.W, this.H); pintarTrazo(this.lienzo.ctx, T.op, undefined, v); }
    this.lienzo.agregar(T.op, true);
    this._historia({ k: "lienzo" });
  }

  _cancelarTrazo() {
    const T = this.trazo;
    if (!T) return;
    this.trazo = null;
    cancelAnimationFrame(this._raf); this._raf = 0;
    this.rasgueo.parar();
    this.vctx.setTransform(1, 0, 0, 1, 0, 0);
    this.vctx.clearRect(0, 0, this.W, this.H);
    if (T.op.h === "borrador") { const c = this.lienzo.ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.W, this.H); c.drawImage(this.antes, 0, 0); c.restore(); }
  }

  _rellenar(P) {
    const w = this._mundoDe(P), inf = this.infinito;
    const px = inf ? P : w;   // (en la hoja normal, el lienzo ES el mundo; en la infinita, es lo que se ve)
    const op = { k: "relleno", x: Math.round(w.x * 100) / 100, y: Math.round(w.y * 100) / 100, c: this.color, z: inf ? +this.vista.s.toPrecision(6) : 1 };
    if (this.opac < 0.999) op.o = +this.opac.toFixed(3);
    if (!rellenar(this.lienzo.ctx, px.x, px.y, op.c, op.o ?? 1)) { this.app.sonidos?.sonar("botones"); return; }
    this.lienzo.agregar(op, true);
    this._historia({ k: "lienzo" });
    this.app.sonidos?.sonar("dz-relleno");
    vibrar(10);
    const o = el("i.dz-onda", { style: { left: P.x * this._u + "px", top: P.y * this._u + "px", "--c": this.color } });
    this.hoja.append(o);
    o.addEventListener("animationend", () => o.remove(), { once: true });
    setTimeout(() => o.remove(), 900);
  }

  /* — El gotero: toca la hoja y te llevas ese color — */
  _ponerGotero(si) {
    if (this.gotero === !!si) return;
    this.gotero = !!si;
    this.capa.classList.toggle("con-gotero", this.gotero);
    this._ponerCursor();
    if (si) { if (this.modo !== "dibujar") this._modo("dibujar"); aviso("Toca la hoja para tomar ese color 💧", 2200); }
  }
  _gotear(P) {
    const px = this.infinito ? P : this._mundoDe(P);
    let c = this.fondo;
    try {
      const d = this.lienzo.ctx.getImageData(Math.max(0, Math.min(this.W - 1, Math.round(px.x))), Math.max(0, Math.min(this.H - 1, Math.round(px.y))), 1, 1).data;
      const f = parseInt(this.fondo.slice(1), 16), fr = f >> 16, fg = (f >> 8) & 255, fb = f & 255, a = d[3] / 255;
      const mez = (x, y) => Math.round(x * a + y * (1 - a));
      c = "#" + [mez(d[0], fr), mez(d[1], fg), mez(d[2], fb)].map((n) => n.toString(16).padStart(2, "0")).join("");
    } catch (e) { /* sin permiso para leer: se queda el fondo */ }
    this._ponerGotero(false);
    this._elegirColor(c, false, true);
    this._selCol?.(c);
    const o = el("i.dz-onda.chica", { style: { left: P.x * this._u + "px", top: P.y * this._u + "px", "--c": c } });
    this.hoja.append(o);
    setTimeout(() => o.remove(), 700);
  }

  /* — La regla (vive en la hoja, no en el mundo: no se encoge al acercarte) — */
  _reglaSvg() {
    const { largo: L, grueso: G } = this.regla;
    let marcas = "";
    for (let x = -L / 2 + 12, i = 0; x < L / 2; x += 12, i++) {
      const m = i % 10 === 0 ? 30 : i % 5 === 0 ? 21 : 12;
      marcas += `M${x} ${-G / 2}v${m}M${x} ${G / 2}v${-m}`;
    }
    return `<svg viewBox="0 0 ${this.W} ${this.H}" preserveAspectRatio="none"><g class="dz-regla-g">
      <rect class="dz-regla-cuerpo" x="${-L / 2}" y="${-G / 2}" width="${L}" height="${G}" rx="14"/>
      <path class="dz-regla-marcas" d="${marcas}"/>
      <g class="dz-regla-perilla"><circle r="34"/><path d="M-13 -2a13 13 0 0 1 22-8M13 2a13 13 0 0 1-22 8" fill="none"/><path d="M9-18v8h-8M-9 18v-8h8" fill="none"/></g>
      <text class="dz-regla-grados" y="-80" text-anchor="middle"></text>
    </g></svg>`;
  }
  _ponerRegla(si) {
    this.regla.on = !!si;
    this.reglaN.hidden = !si;
    this.app.sonidos?.sonar(si ? "activar" : "desactivar");
    vibrar(6);
    const b = this.herrN.querySelector('[data-k="regla"]');
    if (b) { b.classList.toggle("on", !!si); b.setAttribute("aria-pressed", String(!!si)); }
    if (si) { this._dibujarRegla(); this.reglaN.animate?.([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.9,.3,1.2)" }); }
  }
  _dibujarRegla() {
    const R = this.regla, g = this.reglaN.querySelector(".dz-regla-g");
    g?.setAttribute("transform", `translate(${R.x.toFixed(1)} ${R.y.toFixed(1)}) rotate(${(R.a * 180 / Math.PI).toFixed(2)})`);
    const t = this.reglaN.querySelector(".dz-regla-grados");
    if (t) { let d = Math.round(((-R.a * 180 / Math.PI) % 180 + 180) % 180); if (d > 90) d -= 180; t.textContent = `${Math.abs(d)}°`; }
  }
  _enRegla(P) {
    const R = this.regla, dx = P.x - R.x, dy = P.y - R.y, c = Math.cos(R.a), s = Math.sin(R.a);
    const u = dx * c + dy * s, v = -dx * s + dy * c;
    if (Math.hypot(u, v) < 52) return "giro";
    return Math.abs(v) <= R.grueso / 2 && Math.abs(u) <= R.largo / 2 ? "mover" : null;
  }
  /**
   * ¿El trazo va por la orilla de la regla? Si llega a menos de 70 unidades de una orilla (por fuera), se pega a ella y
   * sigue derechito; ya pegado, sólo se suelta si te alejas bastante (140) o te pasas al otro lado.
   */
  _guiaRegla(P, s, actual) {
    const R = this.regla, dx = P.x - R.x, dy = P.y - R.y, c = Math.cos(R.a), si = Math.sin(R.a);
    const v = -dx * si + dy * c, lado = Math.sign(v) || 1, fuera = Math.abs(v) - R.grueso / 2;
    if (actual) { if (lado === actual.lado && fuera < 140) return actual; return null; }
    if (fuera > 70 || fuera < -R.grueso / 2 + 8) return null;
    return { x: R.x, y: R.y, c, s: si, lado, off: lado * (R.grueso / 2 + s / 2 + 3) };
  }
  _proyectar(g, x, y) {
    const u = (x - g.x) * g.c + (y - g.y) * g.s;
    return { x: g.x + u * g.c - g.off * g.s, y: g.y + u * g.s + g.off * g.c };
  }
  _moverRegla() {
    const G = this.gRegla, R = this.regla, ps = [...this.dedos.values()];
    if (G.modo === "dos" && ps.length >= 2) {
      const [a0, b0] = G.p0, [a, b] = ps;
      R.x = G.b.x + ((a.x + b.x) - (a0.x + b0.x)) / 2;
      R.y = G.b.y + ((a.y + b.y) - (a0.y + b0.y)) / 2;
      R.a = this._iman2(G.b.a + Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x));
      this.reglaN.classList.add("girando");
    } else if (G.modo === "giro") {
      const p = ps[0];
      R.a = this._iman2(G.b.a + Math.atan2(p.y - R.y, p.x - R.x) - Math.atan2(G.p0.y - R.y, G.p0.x - R.x));
      this.reglaN.classList.add("girando");
    } else {
      const p = ps[0];
      R.x = Math.max(-200, Math.min(this.W + 200, G.b.x + p.x - G.p0.x));
      R.y = Math.max(-200, Math.min(this.H + 200, G.b.y + p.y - G.p0.y));
    }
    this._dibujarRegla();
  }
  _iman2(a) {
    const d = a * 180 / Math.PI, m = Math.round(d / 15) * 15;
    if (Math.abs(d - m) < 2.6) {
      if (this._iman !== m) { this._iman = m; this.app.sonidos?.sonar("dz-regla"); vibrar(5); }
      return m * Math.PI / 180;
    }
    this._iman = null;
    return a;
  }

  /* ─────────────── Deshacer y rehacer ─────────────── */

  _historia(e) {
    this.H_.push(e); this.R = [];
    if (this.H_.length > 240) this.H_.shift();
    this._cambio();
  }

  deshacer() {
    if (this.enviando || this.trazo) return;
    const e = this.H_.pop();
    if (!e) { this._sacudir(this.modo === "dibujar" ? this.deshacerB : this.deshacer2); return; }
    if (e.k === "lienzo" || e.k === "limpiar") {
      if (!this.lienzo.puedeQuitar()) { this.H_ = []; aviso("Ya no se puede deshacer más atrás", 2200); this._cambio(); return; }
      e.op = this.lienzo.quitar();
      if (e.k === "limpiar") { this.objs = e.objsAntes; this._pintarObjs(); }
    } else if (e.k === "objs") { this.objs = e.antes; this._pintarObjs(); }
    else if (e.k === "fondo") this._ponerFondo(e.antes, false);
    this.R.push(e);
    this.app.sonidos?.sonar("deshacer");
    vibrar(6);
    this._cambio();
  }

  rehacer() {
    if (this.enviando || this.trazo) return;
    const e = this.R.pop();
    if (!e) { this._sacudir(this.rehacerB); return; }
    if (e.k === "lienzo" || e.k === "limpiar") {
      if (this.infinito && e.op.k !== "limpiar") { this.lienzo.log.push(e.op); this.lienzo.redibujar(); } else this.lienzo.agregar(e.op);
      if (e.k === "limpiar") { this.objs = []; this._pintarObjs(); }
    } else if (e.k === "objs") { this.objs = e.despues; this._pintarObjs(); }
    else if (e.k === "fondo") this._ponerFondo(e.despues, false);
    this.H_.push(e);
    this.app.sonidos?.sonar("rehacer");
    this._cambio();
  }

  _cambio(guardar = true) {
    if (!this.lienzo) return;
    const hay = this.lienzo.hayAlgo() || this.objs.length > 0;
    this.deshacerB.disabled = this.deshacer2.disabled = !this.H_.length;
    this.rehacerB.disabled = !this.R.length;
    this.pista.classList.toggle("fuera", hay || this.modo === "dibujar");
    this.mandarB.classList.toggle("listo", hay);
    if (guardar) this._guardarPronto();
  }
  _guardarPronto() { clearTimeout(this._tg); this._tg = setTimeout(() => this._guardar(), 700); }

  _sacudir(n) { n?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-2px)" }, { transform: "none" }], { duration: 300 }); this.app.sonidos?.sonar("botones"); }

  _guardar(ya = false) {
    clearTimeout(this._tg);
    if (!this.lienzo || this.enviado) return;
    if (!this.lienzo.hayAlgo() && !this.objs.length) { EstudioDibujo.borrarGuardado(); return; }
    let mini = "";
    try {
      const c = document.createElement("canvas"), ar = this.W / this.H; c.width = 120; c.height = Math.round(120 / ar);
      const g = c.getContext("2d"); g.drawImage(this.cPapel, 0, 0, c.width, c.height); g.drawImage(this.cLienzo, 0, 0, c.width, c.height);
      mini = c.toDataURL("image/jpeg", 0.7);
    } catch (e) { /* sin miniatura */ }
    const datos = { v: 2, nombre: this.nombre, fondo: this.fondo, tam: this.tam, papel: this.papel, infinito: this.infinito, vista: this.vista, log: this.lienzo.log, objs: this.objs, fotos: Object.fromEntries(this.fotos), mini, t: Date.now() };
    if (!escribir(GUARDA, datos) && !ya) escribir(GUARDA, { ...datos, fotos: {}, objs: this.objs.filter((o) => o.t !== "foto") });
  }

  _basura() {
    if (this.enviando) return;
    if (!this.lienzo.hayAlgo() && !this.objs.length) { this._sacudir(this.hoja); return; }
    confirmar("¿Borrar todo tu dibujito? (Se puede deshacer)", "Borrar").then((si) => {
      if (!si || !this.abierto) return;
      const op = { k: "limpiar" }, e = { k: "limpiar", objsAntes: this.objs };
      if (!reducido()) this.hoja.animate([{ transform: "none" }, { transform: "scale(.94) rotate(-2.5deg)" }, { transform: "scale(1.02) rotate(1deg)" }, { transform: "none" }], { duration: 420, easing: "ease-out" });
      setTimeout(() => { this.lienzo.agregar(op); this.objs = []; this._pintarObjs(); this._historia(e); }, reducido() ? 0 : 160);
      this.app.sonidos?.sonar("dz-basura");
      vibrar(14);
    });
  }

  /* ─────────────── Hojitas: Bonita, fondo, stickers, color, la carta ─────────────── */

  _hojita(titulo, hijos, clase = "") {
    this.hojita?.cerrar();
    const velo = el("div.dz-velo");
    const caja = el("section.dz-hojita" + clase, { role: "dialog", "aria-label": titulo }, [el("i.dz-asa"), el("h3", { text: titulo }), ...hijos]);
    const h = {
      caja,
      cerrar: () => {
        if (this.hojita !== h) return;
        this.hojita = null; this._selCol = null;
        velo.classList.remove("ver"); caja.classList.remove("ver");
        setTimeout(() => { velo.remove(); caja.remove(); }, reducido() ? 0 : 260);
      },
    };
    velo.addEventListener("pointerdown", (e) => { e.preventDefault(); h.cerrar(); });
    this.capa.append(velo, caja);
    this.hojita = h;
    requestAnimationFrame(() => requestAnimationFrame(() => { velo.classList.add("ver"); caja.classList.add("ver"); }));
    this.app.sonidos?.sonar("abrir");
    return h;
  }

  /** Bonita: el papel de tu hoja, su tamaño y la hoja infinita. */
  _bonita() {
    const fila = (titulo, hijos) => el("div.dz-bonita-fila", {}, [el("b", { text: titulo }), el("div.dz-bonita-ops", {}, hijos)]);
    const papeles = PAPELES.map(([k, n]) => {
      const c = el("canvas", { width: 84, height: 112 });
      const g = c.getContext("2d"); g.scale(84 / 360, 112 / 480); pintarPapel(g, 360, 480, k, this.fondo);
      return el("button.dz-bonita-b" + (k === this.papel ? ".on" : ""), { type: "button", dataset: { k }, onClick: (e) => {
        this.papel = k; this._pintarPapel(); this._guardarPronto(); this.app.sonidos?.sonar("dz-color");
        for (const x of e.currentTarget.parentElement.children) x.classList.toggle("on", x === e.currentTarget);
      } }, [c, el("small", { text: n })]);
    });
    const tams = Object.keys(TAMANOS).map((k) => {
      const [w, h] = TAMANOS[k];
      return el("button.dz-bonita-b.dz-tam" + (k === this.tam ? ".on" : ""), { type: "button", dataset: { k }, onClick: (e) => {
        if (k === this.tam) return;
        this._ponerTam(k);
        for (const x of e.currentTarget.parentElement.children) x.classList.toggle("on", x === e.currentTarget);
      } }, [el("i", { style: { aspectRatio: `${w} / ${h}` } }), el("small", { text: k })]);
    });
    const sw = el("button.dz-switch" + (this.infinito ? ".on" : ""), { type: "button", role: "switch", "aria-checked": String(this.infinito), "aria-label": "Zoom infinito", onClick: () => {
      this._ponerInfinito(!this.infinito);
      sw.classList.toggle("on", this.infinito); sw.setAttribute("aria-checked", String(this.infinito));
    } }, [el("i")]);
    this._hojita("Tu hoja bonita ✨", [
      fila("Papel", papeles),
      fila("Tamaño de la hoja", tams),
      el("div.dz-bonita-inf", {}, [
        el("span", {}, [el("b", { text: "Zoom infinito" }), el("small", { text: "Acércate sin fin y dibuja adentro de tu dibujo: al alejarte y acercarte vas descubriendo dibujo tras dibujo." })]),
        sw,
      ]),
    ], ".dz-hojita-bonita");
  }

  _ponerTam(k) {
    if (!TAMANOS[k]) return;
    this.tam = k;
    [this.W, this.H] = TAMANOS[k];
    this.vista = this.infinito ? this.vista : { s: 1, x: 0, y: 0 };
    this.regla.x = Math.min(this.regla.x, this.W); this.regla.y = Math.min(this.regla.y, this.H);
    this._crearLienzo(this.lienzo.log);
    this._acomodar();
    this._pintarObjs();
    if (!reducido()) this.hoja.animate([{ transform: "scale(.94)", opacity: 0.6 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.9,.3,1.2)" });
    this.app.sonidos?.sonar("dz-hoja");
    this._guardarPronto();
  }

  _ponerInfinito(si) {
    if (this.infinito === !!si) return;
    this.infinito = !!si;
    this.vista = { s: 1, x: 0, y: 0 };   // (la infinita arranca en Zoom 0)
    this._crearLienzo(this.lienzo.log);
    this._pintarObjs();
    this.app.sonidos?.sonar(si ? "activar" : "desactivar");
    if (si) aviso("Hoja infinita: acerca con dos dedos (o la rueda) y dibuja más chiquito adentro 🔍", 4200);
    this._guardarPronto();
  }

  _elegirFondo() {
    const h = this._hojita("El color de tu hoja", [el("div.dz-fondos", {}, FONDOS.map(([c, n]) => el("button.dz-fondo-b" + (c === this.fondo ? ".on" : ""), {
      type: "button", style: { "--c": c }, "aria-label": n, onClick: () => { const antes = this.fondo; if (antes !== c) { this._ponerFondo(c); this._historia({ k: "fondo", antes, despues: c }); } h.cerrar(); },
    }, [el("i"), el("small", { text: n })])))]);
  }
  _ponerFondo(c, sonar = true) {
    this.fondo = c;
    this.hoja.style.setProperty("--fondo", c);
    this.capa?.style.setProperty("--fondo-hoja", c);
    this.hoja.classList.toggle("oscura", oscuro(c));
    if (this.cPapel?.width > 1) this._pintarPapel();
    if (sonar) { this.app.sonidos?.sonar("dz-color"); vibrar(6); }
  }

  /** Tu color: la ruedita (el tono), el cuadrito (qué tan vivo y qué tan claro), la opacidad y el gotero. */
  _selectorColor() {
    let hsv = aHsv(this.color), opac = this.opac;
    const anillo = el("i.dz-rueda-anillo"), bolaR = el("i.dz-rueda-bola"), sv = el("i.dz-sv"), bolaSV = el("i.dz-sv-bola");
    const rueda = el("div.dz-rueda", {}, [anillo, bolaR, sv, bolaSV]);
    const ahora = el("i.dz-muestra-ahora"), antesM = el("i.dz-muestra-antes", { style: { background: this._rgba(this.color, this.opac) } });
    const hex = el("b.dz-hex");
    const barra = el("div.dz-opac", { role: "slider", "aria-label": "Opacidad", "aria-valuemin": "5", "aria-valuemax": "100" }, [el("i.dz-opac-fondo"), el("i.dz-opac-bola")]);
    const pct = el("small.dz-opac-pct");
    const pintar = () => {
      const c = aHex(hsv);
      rueda.style.setProperty("--h", hsv.h.toFixed(1));
      const a = hsv.h * Math.PI / 180;
      bolaR.style.left = (50 + Math.cos(a) * 43.5).toFixed(2) + "%"; bolaR.style.top = (50 + Math.sin(a) * 43.5).toFixed(2) + "%";
      bolaSV.style.left = (21 + hsv.s * 58).toFixed(2) + "%"; bolaSV.style.top = (21 + (1 - hsv.v) * 58).toFixed(2) + "%";
      bolaSV.style.background = c;
      ahora.style.background = this._rgba(c, opac);
      hex.textContent = c.toUpperCase();
      barra.style.setProperty("--c", c);
      barra.lastChild.style.left = (opac * 100).toFixed(1) + "%";
      barra.setAttribute("aria-valuenow", String(Math.round(opac * 100)));
      pct.textContent = Math.round(opac * 100) + "%";
    };
    const aplicar = (final = false) => { this.opac = opac; this._elegirColor(aHex(hsv), true, final); this._pintarTinta(); this._pintarPunto(); };
    let modo = null;
    const pos = (e) => { const r = rueda.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5, }; };
    const mover = (e) => {
      const p = pos(e);
      if (modo === "h") hsv = { ...hsv, h: (Math.atan2(p.y, p.x) * 180 / Math.PI + 360) % 360 };
      else if (modo === "sv") hsv = { ...hsv, s: Math.max(0, Math.min(1, (p.x + 0.29) / 0.58)), v: Math.max(0, Math.min(1, 1 - (p.y + 0.29) / 0.58)) };
      pintar(); aplicar();
    };
    rueda.addEventListener("pointerdown", (e) => {
      const p = pos(e), d = Math.hypot(p.x, p.y);
      modo = Math.abs(p.x) <= 0.3 && Math.abs(p.y) <= 0.3 ? "sv" : d > 0.36 && d < 0.52 ? "h" : null;
      if (!modo) return;
      e.preventDefault(); rueda.setPointerCapture(e.pointerId); mover(e);
    });
    rueda.addEventListener("pointermove", (e) => { if (modo) mover(e); });
    const fin = () => { if (modo) { modo = null; aplicar(true); this.app.sonidos?.sonar("dz-color"); } };
    rueda.addEventListener("pointerup", fin); rueda.addEventListener("pointercancel", fin);
    let mo = false;
    const moverO = (e) => { const r = barra.getBoundingClientRect(); opac = Math.max(0.05, Math.min(1, (e.clientX - r.left) / r.width)); pintar(); aplicar(); };
    barra.addEventListener("pointerdown", (e) => { mo = true; barra.setPointerCapture(e.pointerId); moverO(e); });
    barra.addEventListener("pointermove", (e) => { if (mo) moverO(e); });
    barra.addEventListener("pointerup", () => { mo = false; this._guardarPref(); });
    const recientes = el("div.dz-recientes", {}, this.recientes.map((c) => el("button.dz-color", { type: "button", style: { "--c": c }, "aria-label": "Color " + c, onClick: () => { hsv = aHsv(c); pintar(); aplicar(true); } })));
    const h = this._hojita("Tu color 🎨", [
      el("div.dz-picker", {}, [rueda, el("div.dz-picker-der", {}, [el("div.dz-muestras", {}, [antesM, ahora]), hex,
        el("button.dz-pildora.suave.dz-gotero-b", { type: "button", html: `${GOTERO_SVG}<span>Gotero</span>`, onClick: () => { h.cerrar(); this._ponerGotero(true); } })])]),
      el("div.dz-opac-fila", {}, [el("b", { text: "Opacidad" }), barra, pct]),
      this.recientes.length ? el("div.dz-recientes-fila", {}, [el("b", { text: "Tus colores" }), recientes]) : null,
      el("button.dz-pildora.primario", { type: "button", html: `<span>Listo</span>${ico("ok")}`, onClick: () => { aplicar(true); this._guardarPref(); h.cerrar(); } }),
    ], ".dz-hojita-color");
    this._selCol = (c) => { hsv = aHsv(c); pintar(); };
    pintar();
  }

  _elegirSticker() {
    const poner = (o) => { h.cerrar(); this._nuevoObj(o); this.app.sonidos?.sonar("sticker-pegar"); };
    const h = this._hojita("Stickers", [el("div.dz-stickers", {}, [
      ...Object.keys(STICKERS).map((k) => el("button.dz-sticker-b", { type: "button", "aria-label": "Sticker " + k, onClick: () => poner({ t: "sticker", svg: k }) }, [el("img", { src: urlSvg(k), alt: "", draggable: "false" })])),
      ...EMOJIS.map((e) => el("button.dz-sticker-b.emoji", { type: "button", "aria-label": "Sticker " + e, text: e, onClick: () => poner({ t: "sticker", emoji: e }) })),
    ])], ".dz-hojita-stickers");
  }

  _nuevoObj(o) {
    if (this.modo === "dibujar") this._modo("componer");   // para poder moverlo enseguida
    const antes = this.objs, v = this.vista;
    const c = this._mundoDe({ x: this.W / 2 + (Math.random() - 0.5) * 160, y: this.H * 0.42 + (Math.random() - 0.5) * 160 });
    const n = { id: nid(), x: c.x, y: c.y, s: 1 / v.s, r: (Math.random() - 0.5) * 0.3, ...o };
    if (o.s) n.s = o.s / v.s;
    this.objs = [...this.objs, n];
    this._pintarObjs();
    this._seleccionar(n.id);
    this.capaObjs.querySelector(`[data-id="${n.id}"] .dz-obj-cont`)?.animate?.([{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1.15)", opacity: 1, offset: 0.6 }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.3,1.4,.5,1)" });
    vibrar(8);
    this._historia({ k: "objs", antes, despues: this.objs });
  }

  async _foto() {
    const f = await elegirImagen();
    if (!f || !this.abierto) return;
    try {
      const url = URL.createObjectURL(f);
      let im;
      try { im = await cargarImg(url); } finally { URL.revokeObjectURL(url); }
      const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      const id = nid();
      this.fotos.set(id, c.toDataURL("image/jpeg", 0.86));
      this._nuevoObj({ t: "foto", foto: id, w: c.width, h: c.height, s: 0.9 });
      this.app.sonidos?.sonar("colocar");
    } catch (e) { aviso(e.message || "No se pudo poner esa imagen", 3500, "error"); }
  }

  _escribir(o = null) {
    if (this.escribiendo) return;
    let fuente = o?.fuente || this._ultFuente || "Caveat";
    let color = o?.color || (oscuro(this.fondo) ? "#ffffff" : this.color === "#ffffff" ? "#3a2a35" : this.color);
    const txt = el("textarea.dz-escribir-txt", { rows: 3, maxlength: 160, placeholder: "Escribe algo bonito…", "aria-label": "Tu texto", spellcheck: "false" });
    txt.value = o?.texto || "";
    const pintar = () => {
      const f = FUENTES.find((x) => x[0] === fuente) || FUENTES[0];
      txt.style.fontFamily = `"${f[0]}", cursive`; txt.style.fontWeight = String(f[2]); txt.style.color = color;
      for (const b of fuentesN.children) b.classList.toggle("on", b.dataset.f === fuente);
      for (const b of coloresN.children) b.classList.toggle("on", b.dataset.c === color);
    };
    const fuentesN = el("div.dz-escribir-fuentes", {}, FUENTES.map(([f, n, w]) => el("button.dz-pildora", { type: "button", dataset: { f }, style: { fontFamily: `"${f}"`, fontWeight: String(w) }, text: n, onClick: () => { fuente = f; pintar(); txt.focus(); } })));
    const coloresN = el("div.dz-escribir-colores", {}, COLORES.map((c) => el("button.dz-color", { type: "button", dataset: { c }, style: { "--c": c }, "aria-label": "Color " + c, onClick: () => { color = c; pintar(); txt.focus(); } })));
    const listo = () => {
      const t = txt.value.trim();
      cerrar();
      this._ultFuente = fuente;
      const antes = this.objs;
      if (o) {
        if (!t) this.objs = this.objs.filter((x) => x.id !== o.id);
        else this.objs = this.objs.map((x) => (x.id === o.id ? { ...x, texto: t, fuente, color } : x));
        if (JSON.stringify(antes) !== JSON.stringify(this.objs)) { this._pintarObjs(); this._historia({ k: "objs", antes, despues: this.objs }); this.app.sonidos?.sonar("escribir"); }
      } else if (t) { this._nuevoObj({ t: "texto", texto: t, fuente, color, tam: 92, r: (Math.random() - 0.5) * 0.12 }); this.app.sonidos?.sonar("escribir"); }
    };
    const capa = el("div.dz-escribir", { role: "dialog", "aria-label": "Escribir" }, [
      el("div.dz-escribir-arriba", {}, [
        el("button.dz-pildora.suave", { type: "button", text: "Cancelar", onClick: () => cerrar() }),
        el("button.dz-pildora.primario", { type: "button", html: `<span>Listo</span>${ico("ok")}`, onClick: listo }),
      ]),
      txt, fuentesN, coloresN,
    ]);
    const cerrar = () => { if (this.escribiendo !== h) return; this.escribiendo = null; capa.classList.remove("ver"); setTimeout(() => capa.remove(), reducido() ? 0 : 220); };
    const h = { cerrar };
    this.escribiendo = h;
    this.capa.append(capa);
    pintar();
    requestAnimationFrame(() => { capa.classList.add("ver"); txt.focus(); });
  }

  _seleccionar(id) {
    if (this.sel === id) return;
    this.sel = id;
    for (const n of this.capaObjs.children) n.classList.toggle("sel", n.dataset.id === id);
    if (id) this.app.sonidos?.sonar("seleccionar");
  }

  _quitarObj(id) {
    const antes = this.objs;
    const n = this.capaObjs.querySelector(`[data-id="${id}"]`);
    this.objs = this.objs.filter((o) => o.id !== id);
    this.sel = null;
    this._historia({ k: "objs", antes, despues: this.objs });
    this.app.sonidos?.sonar("borrar");
    if (n && !reducido()) { n.style.pointerEvents = "none"; n.querySelector(".dz-obj-cont")?.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.3) rotate(20deg)", opacity: 0 }], { duration: 220, easing: "ease-in" }).finished.then(() => this._pintarObjs(), () => this._pintarObjs()); }
    else this._pintarObjs();
  }

  _pintarObjs() {
    if (!this.capaObjs) return;
    const hay = new Map([...this.capaObjs.children].map((n) => [n.dataset.id, n]));
    const orden = [];
    for (const o of this.objs) {
      const firma = JSON.stringify([o.t, o.svg, o.emoji, o.texto, o.fuente, o.color, o.foto]);
      let n = hay.get(o.id);
      if (n && n.dataset.firma !== firma) { n.remove(); n = null; }
      if (!n) n = this._nodoObj(o, firma);
      hay.delete(o.id);
      this._ponerObj(o, n);
      n.classList.toggle("sel", o.id === this.sel);
      orden.push(n);
    }
    for (const n of hay.values()) n.remove();
    orden.forEach((n, i) => { if (this.capaObjs.children[i] !== n) this.capaObjs.insertBefore(n, this.capaObjs.children[i] || null); });
    if (this.sel && !this.objs.some((o) => o.id === this.sel)) this.sel = null;
  }
  _nodoObj(o, firma) {
    let cont;
    if (o.t === "texto") {
      const f = FUENTES.find((x) => x[0] === o.fuente) || FUENTES[0];
      cont = el("span.dz-obj-cont.dz-obj-texto", { text: o.texto, style: { fontFamily: `"${f[0]}", cursive`, fontWeight: String(f[2]), color: o.color, "--tam": o.tam || 92 } });
    } else if (o.t === "foto") cont = el("span.dz-obj-cont.dz-obj-foto", { style: { "--ar": (o.w / o.h).toFixed(4) } }, [el("img", { src: this.fotos.get(o.foto) || "", alt: "", draggable: "false" })]);
    else if (o.emoji) cont = el("span.dz-obj-cont.dz-obj-emoji", { text: o.emoji });
    else cont = el("span.dz-obj-cont.dz-obj-sticker", {}, [el("img", { src: urlSvg(o.svg), alt: "", draggable: "false" })]);
    return el("div.dz-obj", { dataset: { id: o.id, firma } }, [
      cont,
      el("button.dz-obj-x", { type: "button", "aria-label": "Quitar", html: ico("cerrar"), onClick: (e) => { e.stopPropagation(); this._quitarObj(o.id); } }),
      el("i.dz-obj-giro", { html: GIRO_SVG, "aria-hidden": "true" }),
    ]);
  }
  /** Dónde va un objeto: en el mundo (en la hoja normal, el mundo es la hoja; en la infinita, con la vista pintada). */
  _ponerObj(o, n = this.capaObjs.querySelector(`[data-id="${o.id}"]`)) {
    if (!n) return;
    const v = this.infinito ? this.lienzo.vista : VISTA;
    const x = (o.x - v.x) * v.s, y = (o.y - v.y) * v.s, s = o.s * v.s;
    n.style.left = (x / this.W * 100).toFixed(3) + "%";
    n.style.top = (y / this.H * 100).toFixed(3) + "%";
    n.style.transform = `translate(-50%, -50%) rotate(${o.r.toFixed(4)}rad) scale(${s.toFixed(5)})`;
    // (--s = qué tan grande se ve en la pantalla: así sus manijitas y su marco miden siempre lo mismo.)
    n.style.setProperty("--s", Math.max(0.01, o.s * this.vista.s * (this._u || 0.35)).toFixed(4));
    n.hidden = this.infinito && (s < 0.01 || s > 80);
  }

  _objBajar(e, id, modo = "mover") {
    const o = this.objs.find((x) => x.id === id);
    if (!o) return;
    e.preventDefault();
    try { this.hoja.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    const yaSel = this.sel === id;
    this._seleccionar(id);
    if (!this.gObj) {
      this.gObj = { id, dedos: new Map(), antes: this.objs, mov: 0, t0: performance.now(), yaSel };
      this.objs = this.objs.map((x) => ({ ...x }));
    }
    if (this.objs[this.objs.length - 1].id !== id) { this.objs = [...this.objs.filter((x) => x.id !== id), this.objs.find((x) => x.id === id)]; this._pintarObjs(); this.gObj.alFrente = true; }
    this.gObj.dedos.set(e.pointerId, this._pt(e));
    this.gObj.modo = this.gObj.dedos.size >= 2 ? "dos" : modo;
    this._objBase();
  }
  _objBase() {
    const g = this.gObj, o = this.objs.find((x) => x.id === g.id);
    g.b = { x: o.x, y: o.y, s: o.s, r: o.r };
    g.p0 = [...g.dedos.values()].map((p) => ({ ...p }));
  }
  _objMover(e) {
    const g = this.gObj, x = this.objs.find((y) => y.id === g.id);
    if (!x) return;
    const P = this._pt(e);
    g.dedos.set(e.pointerId, P);
    const ps = [...g.dedos.values()], lim = (v) => Math.max(0.2 / this.vista.s, Math.min(6 / this.vista.s, v));
    if (g.modo === "dos" && ps.length >= 2) {
      const [a0, b0] = g.p0, [a, b] = ps;
      const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y) || 1, d = Math.hypot(b.x - a.x, b.y - a.y);
      x.s = lim(g.b.s * d / d0);
      x.r = g.b.r + Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x);
      x.x = g.b.x + ((a.x + b.x) - (a0.x + b0.x)) / 2;
      x.y = g.b.y + ((a.y + b.y) - (a0.y + b0.y)) / 2;
      g.mov = 99;
    } else if (g.modo === "giro") {
      const p0 = g.p0[0], v0x = p0.x - g.b.x, v0y = p0.y - g.b.y, vx = P.x - g.b.x, vy = P.y - g.b.y;
      x.s = lim(g.b.s * Math.hypot(vx, vy) / (Math.hypot(v0x, v0y) || 1));
      x.r = g.b.r + Math.atan2(vy, vx) - Math.atan2(v0y, v0x);
      g.mov = 99;
    } else {
      const p0 = g.p0[0];
      x.x = g.b.x + P.x - p0.x; x.y = g.b.y + P.y - p0.y;
      if (!this.infinito) { x.x = Math.max(-100, Math.min(this.W + 100, x.x)); x.y = Math.max(-100, Math.min(this.H + 100, x.y)); }
      g.mov = Math.max(g.mov, Math.hypot(P.x - p0.x, P.y - p0.y) * this.vista.s);
    }
    this._ponerObj(x);
  }
  _objSubir(e) {
    const g = this.gObj;
    g.dedos.delete(e.pointerId);
    if (g.dedos.size) { g.modo = "mover"; this._objBase(); return; }
    this.gObj = null;
    if (g.mov > 6 || g.alFrente) {
      if (g.mov > 6) this.app.sonidos?.sonar("soltar");
      this._historia({ k: "objs", antes: g.antes, despues: this.objs });
    } else if (g.yaSel && performance.now() - g.t0 < 350) {
      const o = this.objs.find((x) => x.id === g.id);
      if (o?.t === "texto") this._escribir(o);
    }
  }

  /* ─────────────── Teclado (en la compu) ─────────────── */
  _teclado(e) {
    if (!this.abierto || this.app.detallitos?.abierto || document.querySelector(".ed-modal-fondo")) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    const enCampo = e.target.closest?.("textarea, input");
    e.stopPropagation();   // (el editor de páginas, debajo, no se entera)
    if (enCampo) { if (e.key === "Escape") { e.preventDefault(); this.atras(); } return; }
    if (e.key === "Escape") { e.preventDefault(); this.atras(); }
    else if (mod && k === "z" && !e.shiftKey) { e.preventDefault(); this.deshacer(); }
    else if (mod && (k === "y" || (k === "z" && e.shiftKey))) { e.preventDefault(); this.rehacer(); }
    else if (!mod && (k === "+" || k === "=" || k === "-")) { this._zoomEn(k === "-" ? 1 / 1.25 : 1.25, { x: this.W / 2, y: this.H / 2 }); this._aplicarVista(); this._renderPronto(); }
    else if (!mod && k === "0") this._zoomInicio();
    else if (!mod && this.modo === "dibujar") {
      const atajo = { m: "plumon", p: "pincel", l: "lapiz", c: "crayon", n: "neon", b: "cubeta", e: "borrador" }[k];
      if (atajo) this._elegirHerr(atajo);
      else if (k === "r") this._ponerRegla(!this.regla.on);
      else if (k === "i") this._ponerGotero(!this.gotero);
      else if (k === "v") this._ponerVirtual(!this.virtual);
      else if (k === "[" || k === "]") { const s = this.grosores[this.herr] || 14; this.grosores[this.herr] = Math.max(2, Math.min(500, Math.round(s * (k === "]" ? 1.25 : 0.8)))); this._pintarPunto(); this._ponerCursor(); }
    } else if ((e.key === "Delete" || e.key === "Backspace") && this.sel) { e.preventDefault(); this._quitarObj(this.sel); }
  }

  /* ─────────────── La imagen ─────────────── */

  /** El dibujo entero (papel, trazos y objetos) en un lienzo de `ancho` px. En la infinita, lo que estás viendo. */
  async _componer(ancho = this.W) {
    const k = ancho / this.W, c = document.createElement("canvas");
    c.width = Math.round(ancho); c.height = Math.round(this.H * k);
    const g = c.getContext("2d");
    g.save(); g.scale(k, k); pintarPapel(g, this.W, this.H, this.papel, this.fondo); g.restore();
    const v = this.infinito ? { ...this.vista, k } : { s: 1, x: 0, y: 0, k };
    if (!this.infinito) g.drawImage(this.lienzo.canvas, 0, 0, c.width, c.height);
    else {
      const t = document.createElement("canvas"); t.width = c.width; t.height = c.height;
      const tc = t.getContext("2d");
      let desde = 0; const log = this.lienzo.log;
      for (let i = log.length - 1; i >= 0; i--) if (log[i].k === "limpiar") { desde = i + 1; break; }
      for (let i = desde; i < log.length; i++) aplicar(tc, log[i], v);
      g.drawImage(t, 0, 0);
    }
    for (const o of this.objs) {
      const e = v.s * v.k;
      g.save();
      g.translate((o.x - v.x) * e, (o.y - v.y) * e); g.rotate(o.r); g.scale(o.s * e, o.s * e);
      try { await this._dibujarObj(g, o); } catch (er) { /* uno que no se pudo: los demás sí */ }
      g.restore();
    }
    return c;
  }
  async _dibujarObj(g, o) {
    g.shadowColor = "rgba(80, 30, 60, .22)"; g.shadowBlur = 14; g.shadowOffsetY = 5;
    if (o.t === "texto") {
      const f = FUENTES.find((x) => x[0] === o.fuente) || FUENTES[0], tam = o.tam || 92;
      await document.fonts?.load(`${f[2]} ${tam}px "${f[0]}"`).catch(() => {});
      g.shadowColor = "transparent";
      g.font = `${f[2]} ${tam}px "${f[0]}", cursive`;
      g.fillStyle = o.color; g.textAlign = "center"; g.textBaseline = "middle";
      const lineas = o.texto.split("\n"), lh = tam * 1.12;
      lineas.forEach((l, i) => g.fillText(l, 0, (i - (lineas.length - 1) / 2) * lh));
    } else if (o.t === "foto") {
      const im = await cargarImg(this.fotos.get(o.foto) || "");
      const w = 560, h = w / (o.w / o.h), b = 16;
      g.fillStyle = "#fff"; g.beginPath(); g.roundRect?.(-w / 2 - b, -h / 2 - b, w + b * 2, h + b * 2, 20) ?? g.rect(-w / 2 - b, -h / 2 - b, w + b * 2, h + b * 2); g.fill();
      g.shadowColor = "transparent";
      g.save(); g.beginPath(); g.roundRect?.(-w / 2, -h / 2, w, h, 10) ?? g.rect(-w / 2, -h / 2, w, h); g.clip(); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
    } else if (o.emoji) {
      g.font = '200px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(o.emoji, 0, 10);
    } else {
      const im = await cargarImg(urlSvg(o.svg));
      g.drawImage(im, -120, -120, 240, 240);
    }
  }
  async _png() { const c = await this._componer(this.W); return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo hacer la imagen."))), "image/png")); }

  async _guardarImagen(b) {
    if (!this.lienzo.hayAlgo() && !this.objs.length) { this._sacudir(b); aviso("Primero dibuja algo ✏️", 2200); return; }
    try {
      const blob = await this._png(), nombre = limpio(this.nombre) + ".png";
      const archivo = new File([blob], nombre, { type: "image/png" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [archivo] })) {
        try { await navigator.share({ files: [archivo], title: this.nombre }); return; } catch (e) { if (e?.name === "AbortError") return; }
      }
      const u = URL.createObjectURL(blob), a = el("a", { href: u, download: nombre });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
      this.app.sonidos?.sonar("guardar");
      aviso("Imagen guardada ♡", 2200);
    } catch (e) { aviso(e.message || "No se pudo guardar la imagen", 3500, "error"); }
  }

  /* ─────────────── Mandárselo ─────────────── */

  async _carta(b) {
    if (this.enviando || this._preguntando) return;
    if (!this.lienzo.hayAlgo() && !this.objs.length) { this._sacudir(this.hoja); aviso("Primero dibújale algo ✏️", 2400); return; }
    this._preguntando = true;
    const pareja = await this._pareja().catch(() => PF.datos?.().pareja || null).finally(() => { this._preguntando = false; });
    if (!this.abierto) return;
    if (!SRV.conectado() || !pareja) {
      this._guardar(true);
      aviso(SRV.conectado() ? "Primero vincúlate con tu amorcito: tu dibujito te espera aquí" : "Entra a tu cuenta para mandárselo: tu dibujito te espera aquí", 4200);
      this.app.detallitos?.abrir(b, "vincular");
      return;
    }
    const nombre = PF.nombreDe(pareja) || "tu amorcito";
    const msg = el("textarea.dz-carta-msg", { maxlength: 280, rows: 3, placeholder: `Escríbele algo a ${nombre}… (opcional)`, "aria-label": "Mensajito" });
    const mini = el("img.dz-carta-mini", { alt: "", draggable: "false", style: { aspectRatio: `${this.W} / ${this.H}` } });
    this._componer(240).then((c) => { mini.src = c.toDataURL("image/jpeg", 0.82); }).catch(() => {});
    const h = this._hojita(`Para ${nombre} 💌`, [
      el("div.dz-carta", {}, [mini, el("div.dz-carta-der", {}, [el("b", { text: this.nombre }), msg])]),
      el("button.dz-pildora.primario.dz-carta-b", { type: "button", html: `${AVION}<span>Mandárselo a ${nombre}</span>`, onClick: () => { const m = msg.value.trim(); h.cerrar(); this._enviar(m, nombre); } }),
    ], ".dz-hojita-carta");
  }

  async _enviar(mensaje, nombre) {
    if (this.enviando) return;
    this._modo("componer"); this._seleccionar(null);
    this.enviando = true;
    this.capa.classList.add("enviando");
    this.mandarB.classList.add("subiendo");
    this._anillo(0.04);
    let volo = null;
    try {
      const [png, mini] = await Promise.all([this._png(), this._componer(480).then((c) => new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.86)))]);
      const { Zip } = await import("../export/zip.js");
      const z = new Zip();
      const titulo = this.nombre;
      z.agregar("index.html", paginaVer(titulo, mensaje, this.fondo, this.W, this.H));
      z.agregar("dibujo.png", png);
      z.agregar("dibujo.json", JSON.stringify({ v: 2, ancho: this.W, alto: this.H, fondo: this.fondo, papel: this.papel, titulo, infinito: this.infinito, vista: this.infinito ? this.vista : null, log: this._logLimpio() }));
      const blob = await z.generar();
      volo = this._volar();
      const det = await SRV.mandarDetallito(blob, { titulo, mensaje, color: this.fondo, tipo: "dibujito" }, (p) => this._anillo(0.04 + p * 0.94));
      if (mini && det?.id) await SRV.subirPortadita(det.id, mini).catch(() => {});
      await volo;
      this._anillo(1);
      this.enviado = true;
      EstudioDibujo.borrarGuardado();
      this._listo(nombre);
    } catch (e) {
      await volo?.catch?.(() => {});
      this._regresar();
      this.app.sonidos?.sonar("error");
      aviso(e.message || "No se pudo mandar: inténtalo otra vez", 5000, "error");
    } finally {
      this.enviando = false;
      this.capa.classList.remove("enviando");
      this.mandarB.classList.remove("subiendo");
      if (!this.enviado) this._anillo(0);
    }
  }

  _anillo(p) { this.anillo.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3)); }

  async _volar() {
    this.app.sonidos?.sonar("dz-volar");
    if (reducido()) { await this.hoja.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).finished.catch(() => {}); return; }
    const r = this.hoja.getBoundingClientRect();
    this.hoja.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.5) rotate(-6deg)", opacity: 1, offset: 0.6 }, { transform: "scale(.1) rotate(14deg)", opacity: 0 }], { duration: 560, easing: "cubic-bezier(.55,0,.7,.4)", fill: "forwards" });
    await espera(380);
    const avion = el("i.dz-avion", { html: AVION, style: { left: r.left + r.width / 2 + "px", top: r.top + r.height / 2 + "px" } });
    this.capa.append(avion);
    const dx = innerWidth - r.left + 80, dy = -(r.top + r.height / 2) - 120;
    const a = avion.animate([
      { transform: "translate(-50%, -50%) scale(.3) rotate(-24deg)", opacity: 0 },
      { transform: "translate(-50%, -50%) translate(-26px, 22px) scale(1) rotate(-14deg)", opacity: 1, offset: 0.22 },
      { transform: `translate(-50%, -50%) translate(${dx * 0.42}px, ${dy * 0.3}px) scale(.92) rotate(6deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(.55) rotate(16deg)`, opacity: 0 },
    ], { duration: 1150, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" });
    const t0 = performance.now(), ultra = document.body.classList.contains("ed-ultra");
    const estela = () => {
      if (!avion.isConnected || performance.now() - t0 > 1000) return;
      const b = avion.getBoundingClientRect();
      this._corazoncito(b.left + b.width * 0.25, b.top + b.height * 0.65);
      setTimeout(estela, ultra ? 160 : 75);
    };
    setTimeout(estela, 220);
    await a.finished.catch(() => {});
    avion.remove();
  }
  _corazoncito(x, y, grande = false) {
    const c = el("i.dz-corazon" + (grande ? ".grande" : ""), { html: CORAZON, style: { left: x + "px", top: y + "px", "--dx": ((Math.random() - 0.5) * (grande ? 160 : 40)).toFixed(0) + "px", "--rot": ((Math.random() - 0.5) * 60).toFixed(0) + "deg", "--c": ["#ff5c93", "#ffb0cc", "#b98bff", "#ff8fb8"][Math.floor(Math.random() * 4)] } });
    this.capa.append(c);
    c.addEventListener("animationend", () => c.remove(), { once: true });
    setTimeout(() => c.remove(), 2200);
  }
  _regresar() {
    for (const a of this.hoja.getAnimations()) a.cancel();
    if (!reducido()) this.hoja.animate([{ transform: "scale(.6)", opacity: 0 }, { transform: "scale(1.03)", opacity: 1, offset: 0.7 }, { transform: "none", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.2,.9,.3,1.2)" });
  }

  _listo(nombre) {
    this.app.sonidos?.sonar("dz-llego");
    vibrar(30);
    this.listoCaja = el("div.dz-listo", { role: "status" }, [
      el("i.dz-listo-cor", { html: CORAZON }),
      el("h2", { text: `¡Le llegó a ${nombre}!` }),
      el("p", { text: "Ya está en sus Detallitos: cuando lo abra, lo verá dibujarse solito." }),
      el("div.dz-listo-botones", {}, [
        el("button.dz-pildora.primario", { type: "button", html: `${svgHerr("lapiz")}<span>Dibujar otro</span>`, onClick: () => { this.cerrar({ sinMenu: true }); pantallaInicio(this.app, { cerrable: true, tipo: "dibujito" }); } }),
        el("button.dz-pildora.suave", { type: "button", html: `${ico("corazon")}<span>Ver en Detallitos</span>`, onClick: () => { this.cerrar(); this.app.detallitos?.abrir(null, "coleccion"); } }),
        el("button.dz-pildora.texto", { type: "button", text: "Volver al menú", onClick: () => this.cerrar() }),
      ]),
    ]);
    this.centro.append(this.listoCaja);
    const r = this.centro.getBoundingClientRect(), n = document.body.classList.contains("ed-ultra") || reducido() ? 6 : 16;
    for (let i = 0; i < n; i++) setTimeout(() => this._corazoncito(r.left + r.width * (0.2 + Math.random() * 0.6), r.top + r.height * (0.35 + Math.random() * 0.3), true), i * 45);
  }
}

/** La página que se ve en /d/<id>/ (sin el editor): el dibujito en su hojita, con su título y su mensajito. */
export function paginaVer(titulo, mensaje, fondo, w = ANCHO, h = ALTO) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Nunito:wght@700&display=swap">
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{min-height:100dvh;display:grid;place-items:center;padding:22px 16px;font-family:Nunito,system-ui,sans-serif;color:#4a3346;
background:radial-gradient(120% 60% at 100% 0%,#ffe1ec 0%,transparent 60%),radial-gradient(90% 50% at 0% 100%,#ece3ff 0%,transparent 60%),#fff6f8}
main{width:min(440px,100%);display:grid;gap:14px;text-align:center}
.hoja{width:100%;aspect-ratio:${+w || 3}/${+h || 4};border-radius:28px;overflow:hidden;background:${/^#[0-9a-f]{6}$/i.test(fondo) ? fondo : "#fff"};box-shadow:0 18px 44px rgba(200,80,130,.22),0 0 0 6px #fff;animation:llega .8s cubic-bezier(.2,.9,.3,1.2) both}
.hoja img{width:100%;height:100%;display:block}
h1{margin:6px 0 0;font:700 40px/1 Caveat,cursive;color:#e5679a}
p{margin:0;font-size:16px;line-height:1.45;white-space:pre-wrap}
@keyframes llega{from{opacity:0;transform:translateY(20px) rotate(-2deg) scale(.94)}}
@media (prefers-reduced-motion:reduce){.hoja{animation:none}}
</style></head><body><main>
<div class="hoja"><img src="dibujo.png" alt="${escapar(titulo)}"></div>
<h1>${escapar(titulo)}</h1>${mensaje ? `<p>${escapar(mensaje)}</p>` : ""}
</main></body></html>`;
}
