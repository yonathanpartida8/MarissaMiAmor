/**
 * LA CÁMARA (Fase 45) — en Mensajitos: fotos con filtros para mandárselas a tu amorcito.
 *
 *   · usa la cámara del aparato (la de enfrente o la de atrás, la mejor resolución que dé) y, si la
 *     tiene, su linterna; pide el permiso al abrirse y, si no lo das, dice cómo darlo
 *   · filtros (efectos.js): los del teléfono si el navegador los presta, Suavizar, Fondo borroso y el
 *     Teletransporte de Goku (el índice y el medio en tu frente 3 s: el obturador se va llenando)
 *   · el obturador grande (o con cuenta de 3 s); un destello y la foto: Repetir · Guardar · Mandar ♥
 *   · lo que se manda es la foto tal cual se vio (con su filtro), sin el efecto espejo de la selfie
 * Atrás (o ✕) la cierra y suelta la cámara (se apaga su lucecita).
 */
import { el, aviso } from "../components/ui.js";
import { Efectos, nativos, ponerNativo } from "./efectos.js";

const svg = (c) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${c}</svg>`;
export const ICONO_CAMARA = svg('<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.3" r="3.6"/>');
const IC = {
  cerrar: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  voltear: svg('<path d="M4 9.5A8 8 0 0 1 18.4 6.4L20 8M20 4v4h-4M20 14.5a8 8 0 0 1-14.4 3.1L4 16M4 20v-4h4"/>'),
  luz: svg('<path d="M13 2 5 13.5h6L10 22l8-11.5h-6z"/>'),
  reloj: svg('<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.4 1.6M10 2.5h4"/>'),
  enviar: svg('<path d="M4 12 20 4l-6.5 16-2.5-6.5z"/><path d="m11 13.5 9-9.5"/>'),
  guardar: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
  repetir: svg('<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5M4 4v4.5h4.5"/>'),
};
const VIDEO = (frente, exacto = true) => ({ facingMode: frente ? "user" : exacto ? { exact: "environment" } : "environment", width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } });
const FILTROS = [["", "Natural", "✨"], ["suave", "Suavizar", "🌸"], ["fondo", "Fondo borroso", "🌫️"], ["goku", "Teletransporte", "🫡"]];
const MAX_FOTO = 1600;
const vib = (p) => { try { navigator.vibrate?.(p); } catch (e) { /* nada */ } };

let abierta = null;
/** ¿Hay una cámara abierta? La cierra (para el «atrás» del teléfono). */
export function cerrarCamara() { if (!abierta) return false; abierta.cerrar(); return true; }

/** Abre la cámara. `alMandar(blob, ancho, alto)` manda la foto (la cámara se cierra al tocar «Mandar»). */
export function abrirCamara(op = {}) {
  if (abierta) return abierta;
  if (!navigator.mediaDevices?.getUserMedia) { aviso("Este navegador no deja usar la cámara: ábrelo en Chrome o Safari.", 4200); return null; }
  abierta = new Camara(op);
  return abierta;
}

class Camara {
  constructor({ alMandar = null, nombre = "tu amorcito" } = {}) {
    this.alMandar = alMandar;
    this.nombre = nombre;
    this.frente = true;
    this.cam = null;
    this.filtro = "";
    this.cuenta = false;
    this.ef = new Efectos({ alCambio: (f, v) => this._efecto(f, v) });
    this._armar();
    this._prender();
  }

  /* ── La pantalla ── */
  _armar() {
    const b = (cls, html, etiqueta, al) => el("button.cm-b" + (cls ? "." + cls : ""), { type: "button", "aria-label": etiqueta, title: etiqueta, html, onClick: (ev) => { ev.stopPropagation(); al(ev); } });
    this.video = el("video.cm-video", { autoplay: true, playsinline: true });
    this.video.muted = true;
    this.vista = el("div.cm-vista", {}, [this.video]);
    this.bLuz = b("", IC.luz, "Linterna", () => this._linterna());
    this.bLuz.hidden = true;
    this.bReloj = b("", IC.reloj, "Cuenta de 3 segundos", () => { this.cuenta = !this.cuenta; this.bReloj.classList.toggle("on", this.cuenta); this.bReloj.setAttribute("aria-pressed", String(this.cuenta)); vib(6); });
    this.bVoltear = b("", IC.voltear, "Voltear la cámara", () => this.voltear());
    this.bVoltear.hidden = true;
    this.disparo = el("button.cm-disparo", { type: "button", "aria-label": "Tomar foto", onClick: () => this.tomar() }, [el("i")]);
    this.chips = el("div.cm-filtros", { role: "radiogroup", "aria-label": "Filtros" });
    this.ayuda = el("div.cm-ayuda", { hidden: true }, [
      el("span", { text: "Índice y medio juntitos en tu frente 3 segundos… ¡y desapareces 5 segundos! (muévete un poquito antes: así se aprende el fondo)" }),
      el("button.cm-probar", { type: "button", text: "Probar ahora", onClick: (ev) => { ev.stopPropagation(); this.ef.teletransportar().catch(() => aviso("No se pudo cargar el efecto (¿estás sin internet?).", 3600)); } }),
    ]);
    this.letrero = el("div.cm-letrero", { "aria-live": "polite" });
    this.permiso = el("div.cm-permiso", { hidden: true });
    this.numero = el("div.cm-numero", { "aria-live": "assertive" });
    this.capa = el("div.cm-capa", { role: "dialog", "aria-modal": "true", "aria-label": "Cámara" }, [
      this.vista,
      el("div.cm-arriba", {}, [b("", IC.cerrar, "Cerrar la cámara", () => this.cerrar()), el("span.cm-titulo", { text: "Cámara" }), el("div.cm-arriba-d", {}, [this.bLuz, this.bReloj])]),
      this.letrero, this.numero, this.permiso,
      el("div.cm-abajo", {}, [
        this.ayuda,
        this.chips,
        el("div.cm-controles", {}, [el("span.cm-hueco"), this.disparo, el("div.cm-lado", {}, [this.bVoltear])]),
      ]),
    ]);
    this._pintarFiltros([]);
    document.body.append(this.capa);
    requestAnimationFrame(() => this.capa.classList.add("ver"));
  }

  _pintarFiltros(tel) {
    const chip = (k, t, emoji, extra = {}) => el("button.cm-filtro", { type: "button", role: "radio", "aria-checked": "false", dataset: { k }, ...extra }, [el("i", { text: emoji }), el("span", { text: t })]);
    this.chips.replaceChildren(
      ...FILTROS.map(([k, t, e]) => chip(k, t, e, { onClick: (ev) => this.poner(k, ev.currentTarget) })),
      // Los del teléfono (sólo si el navegador los presta): se prenden y apagan aparte.
      ...tel.map((x) => chip("tel:" + x.k, x.t, "📱", { "aria-checked": String(x.on), disabled: x.fijo || null, onClick: async (ev) => {
        const bt = ev.currentTarget;
        try { const on = await ponerNativo(this.cam, x.k, bt.getAttribute("aria-checked") !== "true"); bt.setAttribute("aria-checked", String(on)); } catch (e) { aviso("Tu teléfono no dejó cambiarlo.", 2600); }
      } })),
    );
    this._marcar();
  }

  _marcar() {
    for (const c of this.chips.querySelectorAll(".cm-filtro:not([data-k^='tel:'])")) c.setAttribute("aria-checked", String(c.dataset.k === this.filtro));
    this.ayuda.hidden = this.filtro !== "goku";
  }

  /* ── La cámara ── */
  async _prender() {
    const anterior = this.cam;
    let s;
    try {
      try { s = await navigator.mediaDevices.getUserMedia({ video: VIDEO(this.frente), audio: false }); }
      catch (e) {
        if (e.name !== "OverconstrainedError" && e.name !== "NotFoundError") throw e;
        s = await navigator.mediaDevices.getUserMedia({ video: this.frente ? true : VIDEO(false, false), audio: false });
      }
    } catch (e) {
      this._sinPermiso(e);
      return;
    }
    if (abierta !== this) { s.getTracks().forEach((t) => t.stop()); return; }
    this.permiso.hidden = true;
    this.cam = s.getVideoTracks()[0];
    this.cam.contentHint = "detail";
    this.ef.camara(this.cam);
    anterior?.stop();
    this.video.srcObject = new MediaStream([this.cam]);
    this.video.play().catch(() => {});
    this.vista.classList.toggle("espejo", this.frente);
    this._ver();
    this._pintarFiltros(nativos(this.cam));
    let caps = {};
    try { caps = this.cam.getCapabilities?.() || {}; } catch (e) { /* nada */ }
    this.bLuz.hidden = !caps.torch;
    this.bLuz.classList.remove("on");
    try { this.bVoltear.hidden = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput").length < 2; } catch (e) { /* nada */ }
  }

  _sinPermiso(e) {
    const negado = e?.name === "NotAllowedError" || e?.name === "SecurityError";
    this.permiso.hidden = false;
    this.permiso.replaceChildren(
      el("b", { text: negado ? "La cámara necesita tu permiso" : e?.name === "NotFoundError" ? "Este aparato no tiene cámara" : "No se pudo abrir la cámara" }),
      el("p", { text: negado ? "Toca el candadito (o los ajustes del sitio) junto a la dirección, deja que use la cámara y vuelve a intentarlo." : e?.name === "NotReadableError" ? "Otra app la está usando: ciérrala y vuelve a intentarlo." : "Revisa que nada más la esté usando y vuelve a intentarlo." }),
      el("button.cm-probar", { type: "button", text: "Intentar otra vez", onClick: () => { this.permiso.hidden = true; this._prender(); } }),
    );
  }

  /** Lo que se ve: con filtro, el lienzo del efecto; sin filtro, la cámara tal cual. */
  _ver() {
    const conEfecto = this.ef.activo;
    const lienzo = this.ef.salida;
    if (conEfecto && lienzo.parentNode !== this.vista) { lienzo.classList.add("cm-video"); this.vista.append(lienzo); }
    this.video.hidden = conEfecto;
    lienzo.hidden = !conEfecto;
  }

  async voltear() {
    vib(8);
    this.frente = !this.frente;
    this.vista.classList.add("gira");
    setTimeout(() => this.vista.classList.remove("gira"), 420);
    await this._prender();
  }

  async _linterna() {
    if (!this.cam) return;
    const on = !this.bLuz.classList.contains("on");
    try { await this.cam.applyConstraints({ advanced: [{ torch: on }] }); this.bLuz.classList.toggle("on", on); vib(6); } catch (e) { aviso("La linterna no se pudo prender.", 2400); }
  }

  /** Un filtro (uno a la vez; «Natural» = sin filtro). */
  async poner(k, boton) {
    if (!this.cam) return;
    vib(6);
    const antes = this.filtro;
    this.filtro = k;
    this._marcar();
    boton?.classList.add("cargando");
    try {
      for (const x of ["suave", "fondo", "goku"]) if (x !== k && this.ef.on[x]) await this.ef.poner(x, false);
      if (k) await this.ef.poner(k, true);
      this._ver();
      if (k === "goku") aviso("Pon el índice y el medio juntitos en tu frente 3 segundos 🫡", 4200);
    } catch (e) {
      aviso("No se pudo cargar el filtro (¿estás sin internet?).", 3600);
      this.filtro = antes === k ? "" : antes;
      if (k) await this.ef.poner(k, false).catch(() => {});
      this._marcar(); this._ver();
    } finally { boton?.classList.remove("cargando"); }
  }

  _efecto(f, v) {
    if (f === "carga") { this.disparo.style.setProperty("--carga", String(v)); this.capa.classList.toggle("cargando", v > 0); return; }
    if (f === "lento") return;
    this.capa.dataset.goku = f;
    this.capa.classList.remove("cargando");
    if (f === "ida" || f === "vuelta") { this._fiuu(f === "ida"); vib(f === "ida" ? [40, 30, 90] : 60); }
    this._ver();
  }

  /* ── La foto ── */
  async tomar() {
    if (!this.cam || this.tomando) return;
    this.tomando = true;
    try {
      if (this.cuenta) {
        for (let n = 3; n > 0; n--) { this.numero.textContent = String(n); this.numero.classList.remove("late"); void this.numero.offsetWidth; this.numero.classList.add("late"); this._clic(true); await new Promise((r) => setTimeout(r, 1000)); if (abierta !== this) return; }
        this.numero.textContent = "";
      }
      const fuente = this.ef.activo ? this.ef.salida : this.video;
      const w0 = fuente.videoWidth || fuente.width, h0 = fuente.videoHeight || fuente.height;
      if (!w0 || !h0) { aviso("La cámara todavía no está lista.", 2000); return; }
      const k = Math.min(1, MAX_FOTO / Math.max(w0, h0)), w = Math.round(w0 * k), h = Math.round(h0 * k);
      const c = el("canvas", { width: w, height: h });
      c.getContext("2d").drawImage(fuente, 0, 0, w, h);
      this._clic(); vib(20);
      this.capa.classList.remove("flash"); void this.capa.offsetWidth; this.capa.classList.add("flash");
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
      if (!blob || abierta !== this) return;
      this._revisar(blob, w, h);
    } finally { this.tomando = false; }
  }

  /** Ver la foto: Repetir · Guardar · Mandar. */
  _revisar(blob, w, h) {
    const url = URL.createObjectURL(blob);
    const b = (cls, html, t, al) => el("button.cm-acc" + (cls ? "." + cls : ""), { type: "button", onClick: al }, [el("i", { html }), el("span", { text: t })]);
    const quitar = () => { r.classList.add("fuera"); setTimeout(() => { r.remove(); URL.revokeObjectURL(url); }, 260); };
    const r = el("div.cm-revisar", {}, [
      el("img.cm-foto", { src: url, alt: "Tu foto" }),
      el("div.cm-revisar-abajo", {}, [
        b("", IC.repetir, "Repetir", () => quitar()),
        b("", IC.guardar, "Guardar", () => {
          const a = el("a", { href: url, download: `foto-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg` });
          document.body.append(a); a.click(); a.remove();
          aviso("Foto guardada en tus descargas", 2400);
        }),
        this.alMandar ? b("rosa", IC.enviar, `Mandar a ${this.nombre}`, () => { this.alMandar(blob, w, h); this.cerrar(); }) : null,
      ]),
    ]);
    this.capa.append(r);
    requestAnimationFrame(() => r.classList.add("ver"));
  }

  /* ── Sonidos (WebAudio: nada que descargar) ── */
  _audio() { try { this._ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (this._ac.state === "suspended") this._ac.resume().catch(() => {}); return this._ac; } catch (e) { return null; } }
  _clic(suave = false) {
    const ac = this._audio(); if (!ac) return;
    const t = ac.currentTime + 0.005, n = Math.floor(ac.sampleRate * 0.06), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    s.buffer = buf; f.type = "highpass"; f.frequency.value = suave ? 2400 : 900; g.gain.value = suave ? 0.12 : 0.4;
    s.connect(f).connect(g).connect(ac.destination); s.start(t);
  }
  _fiuu(ida) {
    const ac = this._audio(); if (!ac) return;
    const t = ac.currentTime + 0.01, dura = 0.45, n = Math.floor(ac.sampleRate * dura), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = "bandpass"; f.Q.value = 6;
    f.frequency.setValueAtTime(ida ? 500 : 3200, t); f.frequency.exponentialRampToValueAtTime(ida ? 3600 : 450, t + dura);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dura);
    s.connect(f).connect(g).connect(ac.destination); s.start(t);
  }

  cerrar() {
    if (abierta === this) abierta = null;
    try { this.ef.cerrar(); } catch (e) { /* nada */ }
    this.cam?.stop();
    this.cam = null;
    this.video.srcObject = null;
    try { this._ac?.close(); } catch (e) { /* nada */ }
    this.capa.classList.remove("ver");
    this.capa.classList.add("fuera");
    setTimeout(() => this.capa.remove(), 300);
  }
}
