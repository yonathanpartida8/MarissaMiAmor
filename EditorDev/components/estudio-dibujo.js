/**
 * EL ESTUDIO DEL DIBUJITO (Fase 47) — «Dibujito» (en Crear detallito) ya no abre el editor de páginas:
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
import { ANCHO, ALTO, PINCELES, Lienzo, pintarTrazo, pintarDesde, rellenar } from "./dibujo-motor.js";

const GUARDA = "editordev:dibujito", PREF = "editordev:dibujito-pref";
const COLORES = ["#2b2230", "#ffffff", "#ff5c93", "#ffb0cc", "#e8344e", "#ff9f6e", "#ffd84d", "#8de3b8", "#2fb27a", "#8fd3ff", "#3f7bff", "#b98bff", "#7a4fd6", "#8a5a44"];
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

/**
 * El rasgueo de lo que dibujas: ruido filtrado que sube y baja con la velocidad del trazo. Cada pincel tiene
 * su timbre (el lápiz raspa, el plumón susurra, el pincel barre). Se apaga solo si algo no avisa.
 */
export class Rasgueo {
  constructor(app) { this.app = app; this.x = null; }
  empezar(h) {
    const S = this.app.sonidos, ac = this.app.audio?.ac;
    if (this.x || !S?.pref?.on || S.callado || !ac) return;
    try {
      this.app.audio._despertar?.();
      const TONO = { lapiz: [3400, 1.3, 0.5], plumon: [1700, 0.9, 0.32], pincel: [950, 0.7, 0.4], neon: [2600, 1.6, 0.26], borrador: [700, 0.6, 0.45] }[h] || [1600, 1, 0.3];
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
    this.x = null; clearTimeout(this._t);
    if (!x || !ac) return;
    const t = ac.currentTime;
    x.g.gain.cancelScheduledValues(t); x.g.gain.setValueAtTime(x.g.gain.value, t); x.g.gain.setTargetAtTime(0, t, 0.03);
    try { x.fuente.stop(t + 0.2); } catch (e) { /* ya paró */ }
  }
}

export class EstudioDibujo {
  constructor(app) { this.app = app; this.abierto = false; }

  /** El dibujito que se quedó sin mandar (o null). */
  static guardado() { const g = leer(GUARDA, null); return g && g.v === 1 && Array.isArray(g.log) ? g : null; }
  static borrarGuardado() { try { localStorage.removeItem(GUARDA); } catch (e) { /* nada */ } }

  abrir({ nombre = "", seguir = false } = {}) {
    if (this.abierto) return;
    this.abierto = true;
    const g = seguir ? EstudioDibujo.guardado() : null;
    if (!seguir) EstudioDibujo.borrarGuardado();
    const pref = leer(PREF, {});
    this.nombre = (g?.nombre || nombre || "Un dibujito").slice(0, 60);
    this.fondo = g?.fondo || "#ffffff";
    this.herr = PINCELES[pref.herr] || pref.herr === "cubeta" ? pref.herr : "plumon";
    this.color = pref.color || "#2b2230";
    this.recientes = Array.isArray(pref.recientes) ? pref.recientes.slice(0, 3) : [];
    this.grosores = { ...Object.fromEntries(Object.entries(PINCELES).map(([k, v]) => [k, v.s])), ...(pref.grosores || {}) };
    this.objs = Array.isArray(g?.objs) ? g.objs : [];
    this.fotos = new Map(Object.entries(g?.fotos || {}));
    this.H = []; this.R = [];
    this.modo = "componer"; this.sel = null; this.enviando = false; this.enviado = false;
    this.dedos = new Map(); this.trazo = null; this.gObj = null; this.gRegla = null; this.dos = null;
    this.regla = { on: false, x: ANCHO / 2, y: ALTO * 0.46, a: -0.62, largo: 2600, grueso: 124 };
    this.rasgueo = new Rasgueo(this.app);
    this._armar();
    this._ponerFondo(this.fondo, false);
    this.lienzo = new Lienzo(this.cLienzo);
    if (g) this.lienzo.cargar(g.log);
    this.vctx = this.cVivo.getContext("2d");
    this.cVivo.width = ANCHO; this.cVivo.height = ALTO;
    document.body.append(this.capa);
    document.body.classList.add("con-dibujito");
    this._acomodar();
    this._pintarObjs(); this._pintarHerr(); this._pintarColores(); this._cambio(false);
    requestAnimationFrame(() => requestAnimationFrame(() => this.capa.classList.add("ver")));
    this.app.sonidos?.sonar("abrir");
    if (g) setTimeout(() => aviso(`Seguimos con «${this.nombre}» ♡`, 2600), 300);
    // Si todavía no se sabía quién es tu amorcito (la app acaba de abrir), se pregunta.
    if (!PF.datos?.().pareja && SRV.conectado()) this._pareja().catch(() => {});
  }

  /** Tu amorcito (lo guardado o, si no se sabe todavía, lo que diga el servidor). */
  async _pareja() {
    let pa = PF.datos?.().pareja;
    if (!pa && SRV.conectado()) pa = (await SRV.amor())?.pareja || null;
    if (pa && this.paraS) this.paraS.textContent = `para ${PF.nombreDe(pa)}`;
    return pa;
  }

  /** «Atrás» (la flecha, Escape o el del teléfono): primero lo de encima, después dibujar → componer, después salir. */
  atras() {
    if (!this.abierto) return false;
    if (this.escribiendo) { this.escribiendo.cerrar(); return true; }
    if (this.hojita) { this.hojita.cerrar(); return true; }
    if (this.listoCaja) { this.cerrar(); return true; }
    if (this.enviando) return true;
    if (this.grosorVisible) { this._grosor(false); return true; }
    if (this.modo === "dibujar") { this._modo("componer"); return true; }
    this.cerrar();
    return true;
  }

  cerrar({ sinMenu = false } = {}) {
    if (!this.abierto) return;
    this.abierto = false;
    clearTimeout(this._tg);
    if (!this.enviado) this._guardar(true);
    this.rasgueo.parar();
    removeEventListener("resize", this._alResize);
    removeEventListener("keydown", this._tecla, true);
    this.escribiendo?.cerrar(); this.hojita?.cerrar();
    const capa = this.capa;
    capa.classList.remove("ver");
    capa.classList.add("saliendo");
    setTimeout(() => capa.remove(), reducido() ? 0 : 320);
    document.body.classList.remove("con-dibujito");
    this.app.sonidos?.sonar("cerrar");
    if (!this.enviado && (this.lienzo.hayAlgo() || this.objs.length)) aviso("Tu dibujito quedó guardado: lo sigues en Crear detallito → Dibujito", 4200);
    if (!sinMenu) this.app.salida?.alMenu?.();
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
    // La hoja.
    this.cLienzo = el("canvas.dz-lienzo", { "aria-label": "Tu dibujito" });
    this.cVivo = el("canvas.dz-vivo", { "aria-hidden": "true" });
    this.capaObjs = el("div.dz-objs");
    this.reglaN = el("div.dz-regla", { hidden: "", "aria-hidden": "true" });
    this.reglaN.innerHTML = this._reglaSvg();
    this.grosorN = this._armarGrosor();
    this.pista = el("div.dz-pista", { "aria-hidden": "true" }, [el("i", { html: svgHerr("lapiz") }), el("span", { text: "Toca la hoja para dibujar" })]);
    this.cursor = el("i.dz-cursor", { "aria-hidden": "true" });
    this.hoja = el("div.dz-hoja", { style: { "--fondo": this.fondo } }, [this.cLienzo, this.cVivo, this.capaObjs, this.reglaN, this.pista, this.grosorN, this.cursor]);
    this.hoja.classList.toggle("oscura", oscuro(this.fondo));
    this.centro = el("main.dz-centro", {}, [this.hoja]);
    // Componer: lo de abajo de la hoja.
    const chip = (k, t, html, al) => b("dz-chip", { dataset: { k }, "aria-label": t, title: t, onClick: al }, [el("i", { html }), el("small", { text: t })]);
    this.chips = el("div.dz-chips", {}, [
      chip("fondo", "Fondo", '<span class="dz-chip-fondo"></span>', (e) => this._elegirFondo(e.currentTarget)),
      chip("stickers", "Stickers", `<svg viewBox="0 0 100 100" aria-hidden="true">${STICKERS.corazon}</svg>`, () => this._elegirSticker()),
      chip("texto", "Texto", '<b class="dz-chip-t">Aa</b>', () => this._escribir()),
      chip("foto", "Fotito", ico("imagen"), () => this._foto()),
    ]);
    this.deshacerB = b("dz-icono", { "aria-label": "Deshacer", title: "Deshacer (Ctrl+Z)", html: ico("deshacer"), onClick: () => this.deshacer() });
    this.rehacerB = b("dz-icono", { "aria-label": "Rehacer", title: "Rehacer (Ctrl+Y)", html: ico("rehacer"), onClick: () => this.rehacer() });
    this.grosorB = b("dz-cuadro.dz-grosor-b", { "aria-label": "Grosor", title: "Grosor", html: GROSOR_SVG, onClick: () => this._grosor(!this.grosorVisible) });
    this.barra = el("div.dz-barra", {}, [this.deshacerB, this.rehacerB, el("span.dz-hueco"), this.grosorB,
      b("dz-cuadro.dz-listo-b", { "aria-label": "Listo", onClick: () => this._modo("componer") }, [el("span", { text: "listo" }), el("i", { html: ico("ok") })])]);
    this.medio = el("div.dz-medio", {}, [this.chips, this.barra]);
    // Componer: deshacer · mandar · guardar.
    this.anillo = el("i.dz-anillo", { html: '<svg viewBox="0 0 100 100"><circle class="dz-anillo-fondo" cx="50" cy="50" r="46"/><circle class="dz-anillo-avance" cx="50" cy="50" r="46" pathLength="100"/></svg>' });
    this.mandarB = b("dz-mandar", { "aria-label": "Mandárselo a tu amorcito", title: "Mandárselo", onClick: (e) => this._carta(e.currentTarget) }, [this.anillo, el("span.dz-mandar-c", { html: AVION })]);
    this.deshacer2 = b("dz-icono.dz-grande", { "aria-label": "Deshacer", title: "Deshacer", html: ico("deshacer"), onClick: () => this.deshacer() });
    this.pie = el("div.dz-pie", {}, [this.deshacer2, this.mandarB, b("dz-icono.dz-grande", { "aria-label": "Guardar imagen", title: "Guardar imagen", html: ico("exportar"), onClick: (e) => this._guardarImagen(e.currentTarget) })]);
    // Dibujar: el cajón (colores y herramientas).
    this.coloresN = el("div.dz-colores", { role: "radiogroup", "aria-label": "Colores" });
    this.herrN = el("div.dz-herrs", { role: "toolbar", "aria-label": "Herramientas" });
    this.cajon = el("section.dz-cajon", { "aria-label": "Herramientas de dibujo" }, [el("i.dz-asa"), this.coloresN, this.herrN]);
    this.abajo = el("div.dz-abajo", {}, [this.pie, this.cajon]);
    const fondo = el("div.dz-fondo", { "aria-hidden": "true" }, [el("i"), el("i"), el("i")]);
    this.capa = el("div.dz-capa", { role: "dialog", "aria-modal": "true", "aria-label": "Dibujito" }, [fondo, this.cab, this.centro, el("div.dz-lado", {}, [this.medio, this.abajo])]);
    // Los dedos sobre la hoja.
    for (const [t, f] of [["pointerdown", (e) => this._bajar(e)], ["pointermove", (e) => this._mover(e)], ["pointerup", (e) => this._subir(e)], ["pointercancel", (e) => this._subir(e, true)], ["pointerleave", (e) => { if (e.pointerType === "mouse") { this.cursor.classList.remove("ve"); if (!this.dedos.size) this._rect = null; } }]])
      this.hoja.addEventListener(t, f);
    this.hoja.addEventListener("contextmenu", (e) => e.preventDefault());
    this._alResize = () => this._acomodar();
    addEventListener("resize", this._alResize);
    this._tecla = (e) => this._teclado(e);
    addEventListener("keydown", this._tecla, true);
  }

  /** La hoja: lo más grande que quepa, siempre 3 : 4 y del mismo tamaño en los dos momentos. */
  _acomodar() {
    const c = this.centro;
    if (!c?.isConnected) return;
    const w0 = c.clientWidth - 24, h0 = c.clientHeight - 8;
    const w = Math.max(160, Math.floor(Math.min(w0, h0 * 0.75)));
    this.hoja.style.width = w + "px";
    this.hoja.style.height = Math.round(w / 0.75) + "px";
    this.hoja.style.setProperty("--u", (w / ANCHO).toFixed(5) + "px");
    this._rect = null;
    this._u = w / ANCHO;
    this._ponerCursor();
  }

  _modo(m) {
    if (this.modo === m || this.enviando) return;
    this.modo = m;
    this.capa.classList.toggle("dibujando", m === "dibujar");
    if (m === "dibujar") this._seleccionar(null);
    else { this._grosor(false); this.cursor.classList.remove("ve"); this._guardarPref(); }
    this.app.sonidos?.sonar("dz-hoja");
    this._cambio(false);
  }

  _pintarHerr() {
    const lista = [...Object.keys(PINCELES).filter((k) => k !== "borrador"), "cubeta", "borrador", "regla"];
    const nombres = { cubeta: "Cubeta", regla: "Regla", ...Object.fromEntries(Object.entries(PINCELES).map(([k, v]) => [k, v.n])) };
    this.herrN.replaceChildren(...lista.map((k) => {
      const on = k === "regla" ? this.regla.on : this.herr === k;
      return el("button.dz-herr" + (on ? ".on" : ""), {
        type: "button", dataset: { k }, title: nombres[k], "aria-label": nombres[k], "aria-pressed": String(on), html: svgHerr(k),
        onClick: () => (k === "regla" ? this._ponerRegla(!this.regla.on) : this._elegirHerr(k)),
      });
    }), el("label.dz-arcoiris", { title: "Otro color", "aria-label": "Otro color" }, [
      el("i", { style: { background: this.color } }),
      el("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(this.color) ? this.color : "#2b2230", onInput: (e) => this._elegirColor(e.target.value, true), onChange: (e) => this._elegirColor(e.target.value, true, true) }),
    ]));
    this.capa.style.setProperty("--tinta", this.color);
  }

  _pintarColores() {
    const lista = [...COLORES, ...this.recientes.filter((c) => !COLORES.includes(c))];
    this.coloresN.replaceChildren(...lista.map((c) => el("button.dz-color" + (c === this.color ? ".on" : ""), {
      type: "button", role: "radio", "aria-checked": String(c === this.color), "aria-label": "Color " + c, style: { "--c": c }, dataset: { c },
      onClick: () => this._elegirColor(c),
    })));
  }

  _elegirHerr(k) {
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

  _elegirColor(c, propio = false, final = false) {
    if (!/^#[0-9a-f]{6}$/i.test(c)) return;
    const antes = this.color;
    this.color = c.toLowerCase();
    if (propio && final && !COLORES.includes(this.color)) { this.recientes = [this.color, ...this.recientes.filter((x) => x !== this.color)].slice(0, 3); this._pintarColores(); }
    for (const n of this.coloresN.children) { const on = n.dataset.c === this.color; n.classList.toggle("on", on); n.setAttribute("aria-checked", String(on)); }
    this.capa.style.setProperty("--tinta", this.color);
    const ar = this.herrN.querySelector(".dz-arcoiris i"); if (ar) ar.style.background = this.color;
    if (antes !== this.color && !propio) { this.app.sonidos?.sonar("dz-color"); vibrar(5); }
    if (this.herr === "borrador") this._elegirHerr("plumon");
    this._pintarPunto();
    this._ponerCursor();
  }

  _guardarPref() { escribir(PREF, { herr: this.herr, color: this.color, recientes: this.recientes, grosores: this.grosores }); }

  /* — El grosor: una barrita vertical en la orilla de la hoja (gruesa arriba, finita abajo) — */
  _armarGrosor() {
    this.grosorBola = el("i.dz-grosor-bola");
    this.grosorPunto = el("i.dz-grosor-punto");
    const n = el("div.dz-grosor", { hidden: "", role: "slider", "aria-label": "Grosor", "aria-valuemin": "2", "aria-valuemax": "90" }, [el("i.dz-grosor-riel"), this.grosorBola, this.grosorPunto]);
    let activo = null;
    const poner = (e) => {
      const r = n.getBoundingClientRect(), t = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      const s = Math.round(2 * Math.pow(45, t) * 2) / 2;
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
    const s = this.grosores[this.herr] || 14, t = Math.log(s / 2) / Math.log(45);
    this.grosorBola.style.top = ((1 - t) * 100).toFixed(2) + "%";
    this.grosorPunto.style.top = ((1 - t) * 100).toFixed(2) + "%";
    const px = Math.max(3, s * (this._u || 0.35));
    this.grosorPunto.style.width = this.grosorPunto.style.height = px.toFixed(1) + "px";
    this.grosorPunto.style.background = this.herr === "borrador" ? "#fff" : this.color;
    this.grosorPunto.classList.toggle("borra", this.herr === "borrador");
    this.grosorN.setAttribute("aria-valuenow", String(s));
  }
  _ponerCursor() {
    const s = (this.grosores?.[this.herr] || 14) * (this._u || 0.35);
    this.cursor?.style.setProperty("--d", Math.max(6, s).toFixed(1) + "px");
    this.cursor?.classList.toggle("borra", this.herr === "borrador");
    this.cursor?.classList.toggle("cubeta", this.herr === "cubeta");
  }

  /* ─────────────── Los dedos ─────────────── */

  /** Del punto de la pantalla a la hoja. (El rectángulo se mide al empezar cada gesto, no en cada movimiento.) */
  _pt(e) {
    const r = this._rect || (this._rect = this.hoja.getBoundingClientRect());
    return { x: ((e.clientX - r.left) / r.width) * ANCHO, y: ((e.clientY - r.top) / r.height) * ALTO };
  }

  _bajar(e) {
    if (this.enviando || this.escribiendo) return;
    if (e.target.closest(".dz-grosor, .dz-obj-x")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!this.dedos.size && !this.gObj) this._rect = null;
    const P = this._pt(e);
    // Un objeto en movimiento: el segundo dedo (aunque caiga fuera de él) es para girarlo o agrandarlo.
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
    if (this.dedos.size === 2) { this._dosDedos(); return; }
    if (this.dedos.size > 2) return;
    if (this.regla.on) {
      const z = this._enRegla(P);
      if (z) { this.gRegla = { modo: z, p0: P, b: { ...this.regla } }; this.reglaN.classList.add("agarrada"); return; }
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
    const P = this._pt(e);
    this.dedos.set(e.pointerId, P);
    if (e.pointerType === "mouse") { const r = this._rect; this.cursor.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`; }
    if (this.gRegla) { this._moverRegla(); return; }
    if (this.dos) { this.dos.mov = Math.max(this.dos.mov, ...[...this.dedos.entries()].map(([id, p]) => { const a = this.dos.inicio.get(id); return a ? Math.hypot(p.x - a.x, p.y - a.y) : 0; })); return; }
    const T = this.trazo;
    if (!T || T.id !== e.pointerId) return;
    const lista = e.getCoalescedEvents?.() || [e];
    for (const x of lista.length ? lista : [e]) { const q = this._pt(x); this._punto(q.x, q.y, x.pressure, x.pointerType, x.timeStamp || performance.now()); }
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
      // Dos dedos tocando a la vez (sin arrastrar) = deshacer.
      if (!cancelado && performance.now() - d.t < 380 && d.mov < 40) this.deshacer();
      return;
    }
    if (this.trazo?.id === e.pointerId) { if (cancelado && this.trazo.op.p.length < 18) this._cancelarTrazo(); else this._terminarTrazo(); }
  }

  _dosDedos() {
    const T = this.trazo;
    if (T) { if (performance.now() - T.t0 < 280 || T.op.p.length < 24) this._cancelarTrazo(); else this._terminarTrazo(); }
    const [a, b] = [...this.dedos.values()];
    if (this.regla.on && (this.gRegla || (this._enRegla(a) && this._enRegla(b)))) {
      this.gRegla = { modo: "dos", p0: [a, b], b: { ...this.regla } };
      this.reglaN.classList.add("agarrada");
      return;
    }
    this.gRegla = null;
    this.dos = { t: performance.now(), mov: 0, inicio: new Map([...this.dedos.entries()].map(([id, p]) => [id, { ...p }])) };
  }

  /* — Trazos — */
  _empezarTrazo(e, P) {
    const h = this.herr;
    const op = { k: "trazo", h, c: this.color, s: this.grosores[h] || PINCELES[h].s, p: [] };
    const ahora = performance.now();
    this.trazo = { id: e.pointerId, op, t0: ahora, tl: ahora, vel: 0, f: 100, pintados: 0, guia: this.regla.on ? this._guiaRegla(P, op.s) : null };
    if (this.grosorVisible) this._grosor(false);
    this._punto(P.x, P.y, e.pressure, e.pointerType, e.timeStamp || ahora);
    this.rasgueo.empezar(h);
    this._pintarVivo();
  }

  _punto(x, y, presion, tipo, t) {
    const T = this.trazo, p = T.op.p;
    if (T.guia) ({ x, y } = this._proyectar(T.guia, x, y));
    x = Math.max(-40, Math.min(ANCHO + 40, x)); y = Math.max(-40, Math.min(ALTO + 40, y));
    if (p.length) {
      const d = Math.hypot(x - p[p.length - 3], y - p[p.length - 2]);
      if (d < 1.5) return;
      const dt = Math.max(1, t - T.tl);
      T.vel = T.vel * 0.6 + (d / dt) * 0.4;
    }
    let f = 100;
    if (PINCELES[T.op.h]?.var) {
      if (tipo === "pen" && presion > 0) f = 22 + presion * 118;
      else { const meta = Math.max(36, Math.min(128, 128 - T.vel * 11)); T.f = T.f * 0.72 + meta * 0.28; f = T.f; }
    }
    p.push(Math.round(x * 2) / 2, Math.round(y * 2) / 2, Math.round(f));
    T.tl = t;
  }

  _pintarVivo() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      const T = this.trazo;
      if (!T) return;
      const n = T.op.p.length / 3;
      // El borrador borra en la hoja misma y el plumón (opaco, siempre igual de grueso) pinta sólo lo nuevo;
      // los demás se vuelven a pintar enteros, pero limpiando sólo la zona del trazo (no toda la hoja).
      if (T.op.h === "borrador") pintarDesde(this.lienzo.ctx, T.op, T.pintados);
      else if (T.op.h === "plumon") pintarDesde(this.vctx, T.op, T.pintados);
      else {
        const m = T.op.s * (T.op.h === "neon" ? 3 : 1.5) + 4, z = T.caja || (T.caja = [Infinity, Infinity, -Infinity, -Infinity]);
        for (let i = T.pintados; i < n; i++) { const x = T.op.p[i * 3], y = T.op.p[i * 3 + 1]; if (x < z[0]) z[0] = x; if (y < z[1]) z[1] = y; if (x > z[2]) z[2] = x; if (y > z[3]) z[3] = y; }
        this.vctx.clearRect(z[0] - m, z[1] - m, z[2] - z[0] + m * 2, z[3] - z[1] + m * 2);
        pintarTrazo(this.vctx, T.op);
      }
      T.pintados = n;
      this.rasgueo.vel(T.vel);   // (una vez por cuadro, no por punto)
    });
  }

  _terminarTrazo() {
    const T = this.trazo;
    if (!T) return;
    this.trazo = null;
    cancelAnimationFrame(this._raf); this._raf = 0;
    this.rasgueo.parar();
    if (!T.op.p.length) return;
    if (T.op.h === "borrador") pintarDesde(this.lienzo.ctx, T.op, T.pintados);
    else { this.vctx.clearRect(0, 0, ANCHO, ALTO); pintarTrazo(this.lienzo.ctx, T.op); }
    this.lienzo.agregar(T.op, true);
    this._historia({ k: "lienzo" });
  }

  _cancelarTrazo() {
    const T = this.trazo;
    if (!T) return;
    this.trazo = null;
    cancelAnimationFrame(this._raf); this._raf = 0;
    this.rasgueo.parar();
    this.vctx.clearRect(0, 0, ANCHO, ALTO);
    if (T.op.h === "borrador" && T.pintados) this.lienzo.redibujar();
  }

  _rellenar(P) {
    const op = { k: "relleno", x: Math.round(P.x), y: Math.round(P.y), c: this.color };
    if (!rellenar(this.lienzo.ctx, op.x, op.y, op.c)) { this.app.sonidos?.sonar("botones"); return; }
    this.lienzo.agregar(op, true);
    this._historia({ k: "lienzo" });
    this.app.sonidos?.sonar("dz-relleno");
    vibrar(10);
    const r = this.hoja.getBoundingClientRect(), u = r.width / ANCHO;
    const o = el("i.dz-onda", { style: { left: P.x * u + "px", top: P.y * u + "px", "--c": this.color } });
    this.hoja.append(o);
    o.addEventListener("animationend", () => o.remove(), { once: true });
    setTimeout(() => o.remove(), 900);
  }

  /* — La regla — */
  _reglaSvg() {
    const { largo: L, grueso: G } = this.regla;
    let marcas = "";
    for (let x = -L / 2 + 12, i = 0; x < L / 2; x += 12, i++) {
      const m = i % 10 === 0 ? 30 : i % 5 === 0 ? 21 : 12;
      marcas += `M${x} ${-G / 2}v${m}M${x} ${G / 2}v${-m}`;
    }
    return `<svg viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="none"><g class="dz-regla-g">
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
  /** ¿El punto cae en la regla? «giro» = en su perilla, «mover» = en el cuerpo. */
  _enRegla(P) {
    const R = this.regla, dx = P.x - R.x, dy = P.y - R.y, c = Math.cos(R.a), s = Math.sin(R.a);
    const u = dx * c + dy * s, v = -dx * s + dy * c;
    if (Math.hypot(u, v) < 52) return "giro";
    return Math.abs(v) <= R.grueso / 2 && Math.abs(u) <= R.largo / 2 ? "mover" : null;
  }
  /** Si el trazo empieza junto a una orilla, se va derechito por ella. */
  _guiaRegla(P, s) {
    const R = this.regla, dx = P.x - R.x, dy = P.y - R.y, c = Math.cos(R.a), si = Math.sin(R.a);
    const v = -dx * si + dy * c;
    if (Math.abs(v) - R.grueso / 2 > 64) return null;
    const lado = Math.sign(v) || 1;
    return { x: R.x, y: R.y, c, s: si, off: lado * (R.grueso / 2 + s / 2 + 3) };
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
      R.x = Math.max(-200, Math.min(ANCHO + 200, G.b.x + p.x - G.p0.x));
      R.y = Math.max(-200, Math.min(ALTO + 200, G.b.y + p.y - G.p0.y));
    }
    this._dibujarRegla();
  }
  /** Se pega a 0°, 15°, 30°, 45°… (con un tic y una vibracioncita al llegar). */
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
    this.H.push(e); this.R = [];
    if (this.H.length > 240) this.H.shift();
    this._cambio();
  }

  deshacer() {
    if (this.enviando || this.trazo) return;
    const e = this.H.pop();
    if (!e) { this._sacudir(this.modo === "dibujar" ? this.deshacerB : this.deshacer2); return; }
    if (e.k === "lienzo" || e.k === "limpiar") {
      if (!this.lienzo.puedeQuitar()) { this.H = []; aviso("Ya no se puede deshacer más atrás", 2200); this._cambio(); return; }
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
      this.lienzo.agregar(e.op);
      if (e.k === "limpiar") { this.objs = []; this._pintarObjs(); }
    } else if (e.k === "objs") { this.objs = e.despues; this._pintarObjs(); }
    else if (e.k === "fondo") this._ponerFondo(e.despues, false);
    this.H.push(e);
    this.app.sonidos?.sonar("rehacer");
    this._cambio();
  }

  /** Algo cambió: botones, la pista del principio y el guardado (en un ratito). */
  _cambio(guardar = true) {
    const hay = this.lienzo?.hayAlgo() || this.objs.length > 0;
    this.deshacerB.disabled = this.deshacer2.disabled = !this.H.length;
    this.rehacerB.disabled = !this.R.length;
    this.pista.classList.toggle("fuera", hay || this.modo === "dibujar");
    this.mandarB.classList.toggle("listo", hay);
    if (guardar) { clearTimeout(this._tg); this._tg = setTimeout(() => this._guardar(), 700); }
  }

  _sacudir(n) { n?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-2px)" }, { transform: "none" }], { duration: 300 }); this.app.sonidos?.sonar("botones"); }

  /** Se guarda en este aparato (para seguirlo si cierras). */
  _guardar(ya = false) {
    clearTimeout(this._tg);
    if (!this.lienzo || this.enviado) return;
    if (!this.lienzo.hayAlgo() && !this.objs.length) { EstudioDibujo.borrarGuardado(); return; }
    let mini = "";
    try {
      const c = document.createElement("canvas"); c.width = 120; c.height = 160;
      const g = c.getContext("2d"); g.fillStyle = this.fondo; g.fillRect(0, 0, 120, 160); g.drawImage(this.lienzo.canvas, 0, 0, 120, 160);
      mini = c.toDataURL("image/jpeg", 0.7);
    } catch (e) { /* sin miniatura */ }
    const datos = { v: 1, nombre: this.nombre, fondo: this.fondo, log: this.lienzo.log, objs: this.objs, fotos: Object.fromEntries(this.fotos), mini, t: Date.now() };
    if (!escribir(GUARDA, datos) && !ya) escribir(GUARDA, { ...datos, fotos: {}, objs: this.objs.filter((o) => o.t !== "foto") });
  }

  _basura() {
    if (this.enviando) return;
    if (!this.lienzo.hayAlgo() && !this.objs.length) { this._sacudir(this.hoja); return; }
    confirmar("¿Borrar todo tu dibujito? (Se puede deshacer)", "Borrar").then((si) => {
      if (!si || !this.abierto) return;
      const op = { k: "limpiar" };
      const e = { k: "limpiar", objsAntes: this.objs };
      if (!reducido()) this.hoja.animate([{ transform: "none" }, { transform: "scale(.94) rotate(-2.5deg)" }, { transform: "scale(1.02) rotate(1deg)" }, { transform: "none" }], { duration: 420, easing: "ease-out" });
      setTimeout(() => {
        this.lienzo.agregar(op);
        this.objs = []; this._pintarObjs();
        this._historia(e);
      }, reducido() ? 0 : 160);
      this.app.sonidos?.sonar("dz-basura");
      vibrar(14);
    });
  }

  /* ─────────────── Lo de componer: fondo, stickers, texto, fotito ─────────────── */

  /** Una hojita que sube desde abajo (fondo, stickers, la carta para mandarlo). */
  _hojita(titulo, hijos, clase = "") {
    this.hojita?.cerrar();
    const velo = el("div.dz-velo");
    const caja = el("section.dz-hojita" + clase, { role: "dialog", "aria-label": titulo }, [el("i.dz-asa"), el("h3", { text: titulo }), ...hijos]);
    const h = {
      cerrar: () => {
        if (this.hojita !== h) return;
        this.hojita = null;
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
    if (sonar) { this.app.sonidos?.sonar("dz-color"); vibrar(6); }
  }

  _elegirSticker() {
    const poner = (o) => { h.cerrar(); this._nuevoObj(o); this.app.sonidos?.sonar("sticker-pegar"); };
    const h = this._hojita("Stickers", [el("div.dz-stickers", {}, [
      ...Object.keys(STICKERS).map((k) => el("button.dz-sticker-b", { type: "button", "aria-label": "Sticker " + k, onClick: () => poner({ t: "sticker", svg: k }) }, [el("img", { src: urlSvg(k), alt: "", draggable: "false" })])),
      ...EMOJIS.map((e) => el("button.dz-sticker-b.emoji", { type: "button", "aria-label": "Sticker " + e, text: e, onClick: () => poner({ t: "sticker", emoji: e }) })),
    ])], ".dz-hojita-stickers");
  }

  _nuevoObj(o) {
    const antes = this.objs;
    const n = { id: nid(), x: ANCHO / 2 + (Math.random() - 0.5) * 160, y: ALTO * 0.42 + (Math.random() - 0.5) * 160, s: 1, r: (Math.random() - 0.5) * 0.3, ...o };
    this.objs = [...this.objs, n];
    this._pintarObjs();
    this._seleccionar(n.id);
    const nodo = this.capaObjs.querySelector(`[data-id="${n.id}"] .dz-obj-cont`);
    nodo?.animate?.([{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1.15)", opacity: 1, offset: 0.6 }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.3,1.4,.5,1)" });
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
    } catch (e) { aviso(e.message || "No se pudo poner esa foto", 3500, "error"); }
  }

  /** El texto: se escribe en grande sobre la hoja, con su letra y su color. */
  _escribir(o = null) {
    if (this.escribiendo) return;
    let fuente = o?.fuente || this._ultFuente || "Caveat";
    let color = o?.color || (oscuro(this.fondo) ? "#ffffff" : this.color === "#ffffff" ? "#2b2230" : this.color);
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

  /** Los objetos (stickers, textos y fotitos) sobre la hoja: se crea o actualiza lo que cambió. */
  _pintarObjs() {
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
  _ponerObj(o, n = this.capaObjs.querySelector(`[data-id="${o.id}"]`)) {
    if (!n) return;
    n.style.left = (o.x / ANCHO * 100).toFixed(3) + "%";
    n.style.top = (o.y / ALTO * 100).toFixed(3) + "%";
    n.style.transform = `translate(-50%, -50%) rotate(${o.r.toFixed(4)}rad) scale(${o.s.toFixed(4)})`;
    n.style.setProperty("--s", o.s.toFixed(4));
  }

  _objBajar(e, id, modo = "mover") {
    const o = this.objs.find((x) => x.id === id);
    if (!o) return;
    e.preventDefault();
    try { this.hoja.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    const yaSel = this.sel === id;
    this._seleccionar(id);
    if (!this.gObj) {
      // Se mueve una copia: el historial guarda lo de antes tal cual.
      this.gObj = { id, dedos: new Map(), antes: this.objs, mov: 0, t0: performance.now(), yaSel };
      this.objs = this.objs.map((x) => ({ ...x }));
    }
    // Tocarlo lo trae al frente (como en cualquier mesa de stickers).
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
    const g = this.gObj, o = this.objs.find((x) => x.id === g.id);
    if (!o) return;
    const P = this._pt(e);
    g.dedos.set(e.pointerId, P);
    const ps = [...g.dedos.values()], lim = (v) => Math.max(0.2, Math.min(6, v));
    const x = o;
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
      x.x = Math.max(-100, Math.min(ANCHO + 100, g.b.x + P.x - p0.x));
      x.y = Math.max(-100, Math.min(ALTO + 100, g.b.y + P.y - p0.y));
      g.mov = Math.max(g.mov, Math.hypot(P.x - p0.x, P.y - p0.y));
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
      // Tocar otra vez un texto elegido = cambiarlo.
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
    else if (!mod && this.modo === "dibujar") {
      const atajo = { m: "plumon", p: "pincel", l: "lapiz", n: "neon", b: "cubeta", e: "borrador" }[k];
      if (atajo) this._elegirHerr(atajo);
      else if (k === "r") this._ponerRegla(!this.regla.on);
      else if (k === "[" || k === "]") { const s = this.grosores[this.herr] || 14; this.grosores[this.herr] = Math.max(2, Math.min(90, Math.round(s * (k === "]" ? 1.25 : 0.8)))); this._pintarPunto(); this._ponerCursor(); }
    } else if ((e.key === "Delete" || e.key === "Backspace") && this.sel) { e.preventDefault(); this._quitarObj(this.sel); }
  }

  /* ─────────────── La imagen ─────────────── */

  /** El dibujo entero (hoja, trazos y objetos) en un lienzo de `ancho` px. */
  async _componer(ancho = ANCHO) {
    const k = ancho / ANCHO, c = document.createElement("canvas");
    c.width = Math.round(ancho); c.height = Math.round(ALTO * k);
    const g = c.getContext("2d");
    g.fillStyle = this.fondo; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(this.lienzo.canvas, 0, 0, c.width, c.height);
    for (const o of this.objs) {
      g.save();
      g.translate(o.x * k, o.y * k); g.rotate(o.r); g.scale(o.s * k, o.s * k);
      try { await this._dibujarObj(g, o); } catch (e) { /* uno que no se pudo: los demás sí */ }
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
  async _png() { const c = await this._componer(ANCHO); return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo hacer la imagen."))), "image/png")); }

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
    const mini = el("img.dz-carta-mini", { alt: "", draggable: "false" });
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
      z.agregar("index.html", paginaVer(titulo, mensaje, this.fondo));
      z.agregar("dibujo.png", png);
      z.agregar("dibujo.json", JSON.stringify({ v: 1, ancho: ANCHO, alto: ALTO, fondo: this.fondo, titulo, log: this.lienzo.log }));
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

  /** La hoja se encoge, se vuelve avioncito y sale volando con corazones. */
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

  /** ¡Le llegó! */
  _listo(nombre) {
    this.app.sonidos?.sonar("dz-llego");
    vibrar(30);
    const ir = (al) => () => al();
    this.listoCaja = el("div.dz-listo", { role: "status" }, [
      el("i.dz-listo-cor", { html: CORAZON }),
      el("h2", { text: `¡Le llegó a ${nombre}!` }),
      el("p", { text: "Ya está en sus Detallitos: cuando lo abra, lo verá dibujarse solito." }),
      el("div.dz-listo-botones", {}, [
        el("button.dz-pildora.primario", { type: "button", html: `${svgHerr("lapiz")}<span>Dibujar otro</span>`, onClick: ir(() => { this.cerrar({ sinMenu: true }); pantallaInicio(this.app, { cerrable: true, tipo: "dibujito" }); }) }),
        el("button.dz-pildora.suave", { type: "button", html: `${ico("corazon")}<span>Ver en Detallitos</span>`, onClick: ir(() => { this.cerrar(); this.app.detallitos?.abrir(null, "coleccion"); }) }),
        el("button.dz-pildora.texto", { type: "button", text: "Volver al menú", onClick: ir(() => this.cerrar()) }),
      ]),
    ]);
    this.centro.append(this.listoCaja);
    const r = this.centro.getBoundingClientRect(), n = document.body.classList.contains("ed-ultra") || reducido() ? 6 : 16;
    for (let i = 0; i < n; i++) setTimeout(() => this._corazoncito(r.left + r.width * (0.2 + Math.random() * 0.6), r.top + r.height * (0.35 + Math.random() * 0.3), true), i * 45);
  }
}

/** La página que se ve en /d/<id>/ (sin el editor): el dibujito en su hojita, con su título y su mensajito. */
export function paginaVer(titulo, mensaje, fondo) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Nunito:wght@700&display=swap">
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{min-height:100dvh;display:grid;place-items:center;padding:22px 16px;font-family:Nunito,system-ui,sans-serif;color:#4a3346;
background:radial-gradient(120% 60% at 100% 0%,#ffe1ec 0%,transparent 60%),radial-gradient(90% 50% at 0% 100%,#ece3ff 0%,transparent 60%),#fff6f8}
main{width:min(440px,100%);display:grid;gap:14px;text-align:center}
.hoja{width:100%;aspect-ratio:3/4;border-radius:28px;overflow:hidden;background:${/^#[0-9a-f]{6}$/i.test(fondo) ? fondo : "#fff"};box-shadow:0 18px 44px rgba(200,80,130,.22),0 0 0 6px #fff;animation:llega .8s cubic-bezier(.2,.9,.3,1.2) both}
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
