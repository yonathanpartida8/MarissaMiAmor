/**
 * DIBUJAR JUNTOS (Fase 40) — una hoja de los dos, en tiempo real (en Cositas Juntitos).
 *
 *   · Las hojas viven en su M.YNTHN (hasta 30, con nombre y fondo: papel, cuadros, rayas, rosa, noche).
 *   · Mientras dibujas, tu trazo se manda a pedacitos y tu amorcito lo ve crecer, con su lápiz y su nombre.
 *   · Pinceles: lápiz, pluma (más fina si vas rápido), marcador, acuarela, neón, brillitos, corazones y borrador.
 *   · Cada pincel suena distinto mientras lo mueves (más fuerte cuanto más rápido); se apaga con 🔇.
 *   · Lápiz virtual: con el dedo, la punta queda un poquito ARRIBA del dedo (se ve el lápiz), así el
 *     dedo no tapa lo que dibujas. Con lápiz óptico no hace falta (se dibuja justo en la punta).
 *   · La hoja se guarda como imagen (o se comparte) con su fondo.
 * Los puntos van de 0 a 10000 (la hoja es 3:4): se ve igual en cualquier pantalla.
 */
import { el, aviso, confirmar, pedirTexto } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import { cuandoVisible } from "./rendimiento.js";

const svg = (d) => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const PINCELES = [
  ["lapiz", "Lápiz", svg('<path d="M6 26l2.5-7.5L22 5l5 5L13.5 23.5z"/><path d="M19 8l5 5M6 26l5-1.5"/>')],
  ["pluma", "Pluma", svg('<path d="M26 4C15 6 9 13 7 25l2 2c12-2 19-8 21-19"/><path d="M7 25l9-9"/><circle cx="18" cy="14" r="1.6"/>')],
  ["marcador", "Marcador", svg('<path d="M9 23l-3 5h7l2-3"/><path d="M9 23l12-17 6 4-12 17z"/><path d="M13 17l6 4"/>')],
  ["acuarela", "Acuarela", svg('<path d="M16 4c4 6 8 10 8 15a8 8 0 0 1-16 0c0-5 4-9 8-15z"/><path d="M12 20a4 4 0 0 0 4 4" opacity=".6"/>')],
  ["neon", "Neón", svg('<path d="M5 22c4-10 8-10 11-4s7 6 11-4"/><path d="M5 22c4-10 8-10 11-4s7 6 11-4" stroke-width="5" opacity=".25"/>')],
  ["brillitos", "Brillitos", svg('<path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z"/><path d="M23 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>')],
  ["corazones", "Corazones", svg('<path d="M16 27s-11-6.7-11-14.1A5.6 5.6 0 0 1 16 10a5.6 5.6 0 0 1 11 2.9C27 20.3 16 27 16 27z"/>')],
  ["borrador", "Borrador", svg('<path d="M12 26h14M6 20l11-11 7 7-10 10H11z"/><path d="M11 15l7 7"/>')],
];
const COLORES = ["#2b1d2a", "#d8397a", "#ff8fbf", "#8f6fe8", "#4aa3ff", "#2fbf8f", "#ffc23d", "#ff7a45", "#ffffff"];
const FONDOS = [["papel", "Papel"], ["cuadros", "Cuadritos"], ["rayas", "Rayitas"], ["rosa", "Rosita"], ["noche", "Noche"]];
const LAPIZ = svg('<path d="M6 26l2.5-7.5L22 5l5 5L13.5 23.5z" fill="#ffd27a" stroke="#7a4a1f"/><path d="M6 26l2.5-7.5 5 5z" fill="#f4c7a1" stroke="#7a4a1f"/><path d="M6 26l1.4-4 2.6 2.6z" fill="#3a2440" stroke="none"/><path d="M19 8l5 5" stroke="#7a4a1f"/>');
const AJ = "editordev:dibujo";
const leerAj = () => { try { return JSON.parse(localStorage.getItem(AJ) || "{}"); } catch (e) { return {}; } };
const guardarAj = (d) => { try { localStorage.setItem(AJ, JSON.stringify({ ...leerAj(), ...d })); } catch (e) { /* nada */ } };
const azar = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }; // igual en los dos aparatos
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/* ── Sonidos de cada pincel (Web Audio, sin archivos) ── */
class Sonido {
  constructor(app) { this.app = app; this.on = leerAj().sonido !== false; }
  ac() {
    if (!this._ac) { this._ac = this.app?.audio?.ac || new (window.AudioContext || window.webkitAudioContext)(); }
    if (this._ac.state === "suspended") this._ac.resume().catch(() => {});
    return this._ac;
  }
  empezar(pincel) {
    if (!this.on) return;
    let ac;
    try { ac = this.ac(); } catch (e) { return; }
    this.parar();
    const t = ac.currentTime, g = ac.createGain();
    g.gain.value = 0;
    const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const r = ac.createBufferSource(); r.buffer = buf; r.loop = true;
    const f = ac.createBiquadFilter();
    const cfg = { lapiz: ["bandpass", 3200, 1.1, 0.35], pluma: ["bandpass", 2200, 0.8, 0.22], marcador: ["bandpass", 900, 2.5, 0.3], acuarela: ["lowpass", 520, 0.7, 0.4],
      neon: ["bandpass", 1500, 4, 0.12], brillitos: ["highpass", 5000, 0.7, 0.06], corazones: ["lowpass", 800, 0.7, 0.08], borrador: ["lowpass", 420, 0.8, 0.45] }[pincel] || ["bandpass", 2000, 1, 0.2];
    f.type = cfg[0]; f.frequency.value = cfg[1]; f.Q.value = cfg[2];
    r.connect(f).connect(g).connect(ac.destination);
    let hum = null;
    if (pincel === "neon") { hum = ac.createOscillator(); hum.type = "sine"; hum.frequency.value = 220; const hg = ac.createGain(); hg.gain.value = 0.05; hum.connect(hg).connect(g); hum.start(t); }
    r.start(t);
    this.x = { g, r, hum, vol: cfg[3], pincel, ultimo: 0 };
  }
  mover(vel) {
    const x = this.x;
    if (!x) return;
    const ac = this._ac, t = ac.currentTime;
    x.g.gain.setTargetAtTime(x.vol * Math.min(1, vel / 1.4), t, 0.03);
    // Brillitos y corazones: un «ting» o un «pop» de vez en cuando.
    if ((x.pincel === "brillitos" || x.pincel === "corazones") && vel > 0.2 && performance.now() - x.ultimo > (x.pincel === "brillitos" ? 110 : 190)) {
      x.ultimo = performance.now();
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = "sine";
      if (x.pincel === "brillitos") { o.frequency.value = 1800 + Math.random() * 1600; } else { o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.08); }
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(x.pincel === "brillitos" ? 0.06 : 0.09, t + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(og).connect(ac.destination); o.start(t); o.stop(t + 0.25);
    }
  }
  parar() {
    const x = this.x;
    if (!x) return;
    this.x = null;
    const t = this._ac.currentTime;
    x.g.gain.setTargetAtTime(0, t, 0.04);
    try { x.r.stop(t + 0.2); x.hum?.stop(t + 0.2); } catch (e) { /* ya paró */ }
  }
  /** Tu amorcito empezó a dibujar: un «plin» suavecito. */
  plin() {
    if (!this.on || !this._ac) return;
    const ac = this._ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(988, t); o.frequency.setValueAtTime(1319, t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.32);
  }
}

/* ── Pintar un trazo (igual en la pantalla, en la imagen guardada y en el aparato de tu amorcito) ── */
function corazon(c, x, y, r, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
  c.moveTo(0, r * 0.35);
  c.bezierCurveTo(-r * 1.1, -r * 0.35, -r * 0.55, -r * 1.15, 0, -r * 0.5);
  c.bezierCurveTo(r * 0.55, -r * 1.15, r * 1.1, -r * 0.35, 0, r * 0.35);
  c.fill(); c.restore();
}
function estrella(c, x, y, r, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.32 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.restore();
}
export function pintarTrazo(c, t, w, h) {
  const p = t.p || [];
  if (!p.length) return;
  const k = w / 10000, kh = h / 10000, esc = w / 1000;
  const X = (i) => p[i][0] * k, Y = (i) => p[i][1] * kh;
  const ancho = Math.max(0.6, t.a * esc);
  c.save();
  c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = c.fillStyle = t.c;
  const camino = () => {
    c.beginPath(); c.moveTo(X(0), Y(0));
    if (p.length === 1) c.lineTo(X(0) + 0.01, Y(0));
    for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(X(i), Y(i), (X(i) + X(i + 1)) / 2, (Y(i) + Y(i + 1)) / 2);
    if (p.length > 1) c.lineTo(X(p.length - 1), Y(p.length - 1));
  };
  switch (t.pincel) {
    case "pluma":
      for (let i = 1; i < p.length; i++) {
        const d = Math.hypot(X(i) - X(i - 1), Y(i) - Y(i - 1)) / esc;
        c.lineWidth = ancho * Math.max(0.35, Math.min(1.25, 1.25 - d / 40)) * (0.6 + (p[i][2] ?? 50) / 125);
        c.beginPath(); c.moveTo(X(i - 1), Y(i - 1)); c.lineTo(X(i), Y(i)); c.stroke();
      }
      if (p.length === 1) { c.beginPath(); c.arc(X(0), Y(0), ancho / 2, 0, 7); c.fill(); }
      break;
    case "marcador": c.globalAlpha = 0.5; c.lineWidth = ancho * 2.2; c.lineCap = "square"; camino(); c.stroke(); break;
    case "acuarela":
      c.globalAlpha = 0.16; c.shadowColor = t.c; c.shadowBlur = ancho * 2;
      for (const f of [3.2, 2.4, 1.6]) { c.lineWidth = ancho * f; camino(); c.stroke(); }
      break;
    case "neon":
      c.shadowColor = t.c; c.shadowBlur = ancho * 3; c.lineWidth = ancho * 1.6; camino(); c.stroke();
      c.shadowBlur = 0; c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = Math.max(1, ancho * 0.45); camino(); c.stroke();
      break;
    case "brillitos":
    case "corazones": {
      const grande = t.pincel === "brillitos" ? 1.5 : 2;   // (que se vean: un corazón del grosor del lápiz sería un puntito)
      const paso = ancho * (t.pincel === "brillitos" ? 2.4 : 3.6);
      let falta = 0, n = 0;
      const sello = (x, y) => { const r = ancho * grande * (0.8 + azar(t.id * 31 + n) * 0.7), rot = azar(n * 7 + 3) * 6.28; c.globalAlpha = 0.65 + azar(n + 11) * 0.35; (t.pincel === "brillitos" ? estrella : corazon)(c, x, y, r, rot); n++; };
      sello(X(0), Y(0));
      for (let i = 1; i < p.length; i++) {
        const dx = X(i) - X(i - 1), dy = Y(i) - Y(i - 1), d = Math.hypot(dx, dy);
        let s = paso - falta;
        while (s <= d) { sello(X(i - 1) + (dx * s) / d, Y(i - 1) + (dy * s) / d); s += paso; }
        falta = d - (s - paso);
      }
      break;
    }
    case "borrador": c.globalCompositeOperation = "destination-out"; c.lineWidth = ancho * 3; camino(); c.stroke(); break;
    default: c.globalAlpha = 0.9; c.lineWidth = ancho; camino(); c.stroke(); // lápiz
  }
  c.restore();
}

export class DibujoJuntos {
  /** `hoja(titulo, hijos)` y `cerrarHoja()`: la hojita de abajo de Cositas Juntitos. */
  constructor(app, { pareja, hoja, cerrarHoja }) {
    this.app = app; this.pareja = pareja; this.hoja = hoja; this.cerrarHoja = cerrarHoja;
    const aj = leerAj();
    this.pincel = aj.pincel || "lapiz"; this.color = aj.color || "#d8397a"; this.grosor = aj.grosor || 6;
    this.virtual = aj.virtual !== false;
    this.sonido = new Sonido(app);
    this.trazos = new Map();   // id → trazo (los del servidor)
    this.mios = [];            // ids de lo que dibujé (para deshacer)
    this.vivo = false;
  }

  montar(cont) {
    this.vivo = true;
    this.estado = el("small.dj-estado");
    this.nombreHoja = el("b");
    const barra = el("div.dj-barra", {}, [
      el("button.dj-hojas", { type: "button", "aria-label": "Hojas", onClick: () => this._menuHojas() }, [el("i", { html: ico("paginas") }), this.nombreHoja, el("i", { html: ico("abajo") })]),
      this.estado,
      el("button.dj-b", { type: "button", "aria-label": "Deshacer lo último que dibujé", html: ico("deshacer"), onClick: () => this.deshacer() }),
      el("button.dj-b", { type: "button", "aria-label": "Guardar como imagen", html: ico("exportar"), onClick: () => this.guardarImagen() }),
    ]);
    this.base = el("canvas.dj-base");
    this.capaViva = el("canvas.dj-viva", { "aria-label": `Hoja para dibujar con ${this.pareja}`, role: "img" });
    this.lapiz = el("i.dj-lapiz", { html: LAPIZ, hidden: "" });
    this.guia = el("i.dj-guia", { hidden: "" });
    this.suLapiz = el("i.dj-su-lapiz", { hidden: "" }, [el("span", { html: LAPIZ }), el("b", { text: this.pareja })]);
    this.hojaEl = el("div.dj-hoja.papel", {}, [this.base, this.capaViva, this.guia, this.lapiz, this.suLapiz]);
    this.marco = el("div.dj-marco", {}, [this.hojaEl]);
    // Pinceles, colores y grosor.
    this.pincelesEl = el("div.dj-pinceles", { role: "toolbar", "aria-label": "Pinceles" }, PINCELES.map(([k, n, i]) => el("button.dj-pincel", { type: "button", dataset: { k }, "aria-label": n, title: n, onClick: () => this._ponerPincel(k) }, [el("i", { html: i }), el("span", { text: n })])));
    this.colorPropio = el("input.dj-color-propio", { type: "color", "aria-label": "Otro color", value: this.color });
    this.colorPropio.addEventListener("input", () => this._ponerColor(this.colorPropio.value));
    this.coloresEl = el("div.dj-colores", {}, [...COLORES.map((c) => { const b = el("button.dj-color", { type: "button", dataset: { c }, "aria-label": "Color " + c, onClick: () => this._ponerColor(c) }); b.style.setProperty("--c", c); return b; }),
      el("label.dj-color.propio", { title: "Otro color" }, [this.colorPropio])]);
    this.grosorEl = el("input.dj-grosor", { type: "range", min: "1", max: "40", step: "1", value: String(this.grosor), "aria-label": "Grosor" });
    this.grosorEl.addEventListener("input", () => { this.grosor = +this.grosorEl.value; guardarAj({ grosor: this.grosor }); this._muestra(); });
    this.muestra = el("i.dj-muestra");
    this.bVirtual = el("button.dj-b.dj-virtual", { type: "button", "aria-pressed": String(this.virtual), title: "Lápiz virtual: la punta arriba del dedo", "aria-label": "Lápiz virtual", html: LAPIZ, onClick: () => { this.virtual = !this.virtual; guardarAj({ virtual: this.virtual }); this.bVirtual.setAttribute("aria-pressed", String(this.virtual)); aviso(this.virtual ? "Lápiz virtual: la punta queda arriba de tu dedo ✏️" : "Lápiz virtual apagado: dibujas justo donde tocas", 2200); } });
    this.bSonido = el("button.dj-b", { type: "button", "aria-label": "Sonidos de los pinceles", onClick: () => { this.sonido.on = !this.sonido.on; guardarAj({ sonido: this.sonido.on }); this._iconoSonido(); } });
    this._iconoSonido();
    const herr = el("div.dj-herr", {}, [this.pincelesEl, el("div.dj-fila", {}, [this.coloresEl]), el("div.dj-fila", {}, [this.muestra, this.grosorEl, this.bVirtual, this.bSonido])]);
    cont.replaceChildren(el("div.dj", {}, [barra, this.marco, herr]));
    this._ponerPincel(this.pincel, true); this._ponerColor(this.color, true);
    this._enlazar();
    this._ro = new ResizeObserver(() => this._medir());
    this._ro.observe(this.marco);
    this._cargar();
  }

  limpiar() {
    this.vivo = false;
    this._gen = (this._gen || 0) + 1;
    this._ro?.disconnect();
    this.sonido.parar();
    clearInterval(this._tFlush);
    cancelAnimationFrame(this._raf);
  }

  _iconoSonido() { this.bSonido.innerHTML = ico(this.sonido.on ? "volumen" : "silencio"); this.bSonido.setAttribute("aria-pressed", String(this.sonido.on)); }
  _ponerPincel(k, callado) {
    this.pincel = k; guardarAj({ pincel: k });
    for (const b of this.pincelesEl.children) b.classList.toggle("on", b.dataset.k === k);
    this.hojaEl.classList.toggle("borrando", k === "borrador");
    this._muestra();
    if (!callado) this.pincelesEl.querySelector(".on")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }
  _ponerColor(c) {
    this.color = c; guardarAj({ color: c });
    for (const b of this.coloresEl.querySelectorAll("button.dj-color")) b.classList.toggle("on", b.dataset.c === c);
    this._muestra();
  }
  _muestra() {
    const px = Math.max(4, Math.min(30, this.grosor * 0.8));
    this.muestra.style.width = this.muestra.style.height = px + "px";
    this.muestra.style.background = this.pincel === "borrador" ? "transparent" : this.color;
    this.muestra.classList.toggle("borrador", this.pincel === "borrador");
  }

  /* ── Medidas: la hoja 3:4 que quepa ── */
  _medir() {
    const r = this.marco.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const w = Math.floor(Math.min(r.width, r.height * 0.75)), h = Math.floor(w / 0.75);
    this.hojaEl.style.width = w + "px"; this.hojaEl.style.height = h + "px";
    const dpr = Math.min(2, devicePixelRatio || 1);
    for (const cv of [this.base, this.capaViva]) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    this.w = w; this.h = h;
    this._todo();
  }

  /* ── Pintar ── */
  _todo() {
    if (!this.w) return;
    const c = this.base.getContext("2d");
    c.clearRect(0, 0, this.base.width, this.base.height);
    for (const t of [...this.trazos.values()].sort((a, b) => a.id - b.id)) if (t.fin) pintarTrazo(c, t, this.base.width, this.base.height);
    this._vivos();
  }
  _vivos() {
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      const c = this.capaViva.getContext("2d");
      c.clearRect(0, 0, this.capaViva.width, this.capaViva.height);
      let suyo = null;
      for (const t of this.trazos.values()) if (!t.fin) { pintarTrazo(c, t, this.capaViva.width, this.capaViva.height); if (!t.mio && Date.now() / 1000 - (t.t || 0) < 6) suyo = t; }
      if (this.actual) pintarTrazo(c, this.actual, this.capaViva.width, this.capaViva.height);
      // El lápiz de tu amorcito, donde va su trazo.
      if (suyo && suyo.p.length) {
        const u = suyo.p[suyo.p.length - 1];
        this.suLapiz.hidden = false;
        this.suLapiz.style.transform = `translate(${(u[0] / 10000) * this.w}px, ${(u[1] / 10000) * this.h}px)`;
        this.estado.textContent = `${this.pareja} está dibujando…`;
      } else { this.suLapiz.hidden = true; this.estado.textContent = ""; }
    });
  }

  /* ── Con el dedo (o el lápiz óptico) ── */
  _enlazar() {
    const cv = this.capaViva;
    let ultimo = null;
    const punto = (e) => {
      const r = cv.getBoundingClientRect();
      // Lápiz virtual: con el dedo, la punta queda 64 px arriba (y un poquito a la izquierda): el dedo no tapa.
      const off = this.virtual && e.pointerType === "touch" ? { x: -10, y: -64 } : { x: 0, y: 0 };
      const x = e.clientX + off.x - r.left, y = e.clientY + off.y - r.top;
      const pr = e.pointerType === "pen" ? Math.round((e.pressure || 0.5) * 100) : 50;
      return { x, y, pr, dedo: { x: e.clientX - r.left, y: e.clientY - r.top }, off };
    };
    const verLapiz = (q) => {
      const on = q.off.y !== 0;
      this.lapiz.hidden = !on; this.guia.hidden = !on;
      if (!on) return;
      this.lapiz.style.transform = `translate(${q.x}px, ${q.y}px)`;
      const dx = q.dedo.x - q.x, dy = q.dedo.y - q.y;
      this.guia.style.transform = `translate(${q.x}px, ${q.y}px) rotate(${Math.atan2(dy, dx)}rad)`;
      this.guia.style.width = Math.hypot(dx, dy) + "px";
    };
    const aHoja = (q) => [Math.round(Math.max(0, Math.min(1, q.x / this.w)) * 10000), Math.round(Math.max(0, Math.min(1, q.y / this.h)) * 10000), q.pr];
    cv.addEventListener("pointerdown", (e) => {
      if (!this.lienzo || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (this.actual) return; // un dedo a la vez
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
      const q = punto(e);
      verLapiz(q);
      this.dedo = e.pointerId;
      this.actual = { id: 0, mio: true, pincel: this.pincel, c: this.color, a: this.grosor, p: [aHoja(q)], fin: false, pendientes: [] };
      this.actual.pendientes.push(this.actual.p[0]);
      ultimo = { x: q.x, y: q.y, t: performance.now() };
      this.sonido.empezar(this.pincel);
      this._crear(this.actual);
      clearInterval(this._tFlush);
      this._tFlush = setInterval(() => this._mandar(this.actual), 110);
      this._vivos();
    });
    cv.addEventListener("pointermove", (e) => {
      if (!this.actual || e.pointerId !== this.dedo) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      let q = null;
      for (const ev of evs.length ? evs : [e]) {
        q = punto(ev);
        const pt = aHoja(q), u = this.actual.p[this.actual.p.length - 1];
        if (Math.hypot(pt[0] - u[0], pt[1] - u[1]) < 12) continue;
        this.actual.p.push(pt); this.actual.pendientes.push(pt);
      }
      if (!q) return;
      verLapiz(q);
      const ahora = performance.now(), d = Math.hypot(q.x - ultimo.x, q.y - ultimo.y);
      this.sonido.mover(d / Math.max(8, ahora - ultimo.t));
      ultimo = { x: q.x, y: q.y, t: ahora };
      this._vivos();
    });
    const soltar = (e) => {
      if (!this.actual || e.pointerId !== this.dedo) return;
      this.lapiz.hidden = this.guia.hidden = true;
      this.sonido.parar();
      clearInterval(this._tFlush);
      const t = this.actual;
      t.fin = true;
      this.actual = null;
      this._mandar(t);
      // Se queda en la hoja (abajo) ya mismo; el servidor lo confirma.
      pintarTrazo(this.base.getContext("2d"), t, this.base.width, this.base.height);
      if (t.id) this.trazos.set(t.id, { ...t, pendientes: undefined }); else t.alGuardar = () => this.trazos.set(t.id, { ...t, pendientes: undefined });
      this._vivos();
    };
    cv.addEventListener("pointerup", soltar);
    cv.addEventListener("pointercancel", soltar);
  }

  async _crear(t) {
    const primeros = t.pendientes.splice(0);
    t.creando = SRV.dibujoTrazo(this.lienzo.id, { pincel: t.pincel, c: t.c, a: t.a, p: primeros, fin: false }).then((r) => {
      t.id = r.id; this.mios.push(r.id); t.alGuardar?.(); return r.id;
    }).catch((e) => { t.error = true; aviso(e.message, 3000, "error"); });
    await t.creando;
    if (t.fin) this._mandar(t);
  }

  _mandar(t) {
    if (!t || !t.id || t.error || t.mandando) return;
    if (!t.pendientes.length && !(t.fin && !t.cerrado)) return;
    const p = t.pendientes.splice(0), fin = t.fin;
    t.mandando = true;
    SRV.dibujoMas(this.lienzo.id, t.id, { p, fin }).then(() => { if (fin) t.cerrado = true; })
      .catch(() => { t.pendientes.unshift(...p); })
      .finally(() => { t.mandando = false; if (t.pendientes.length || (t.fin && !t.cerrado)) setTimeout(() => this._mandar(t), 200); });
  }

  /* ── Hojas y tiempo real ── */
  async _cargar(id) {
    let d;
    try { d = await SRV.lienzos(); } catch (e) { this.estado.textContent = e.status === 409 ? "Primero vincúlate con tu amorcito." : e.message; return; }
    if (!this.vivo) return;
    this.lista = d.lienzos;
    const elegido = d.lienzos.find((l) => l.id === (id || leerAj().hoja)) || d.lienzos[0];
    this._abrirHoja(elegido);
  }

  async _abrirHoja(l) {
    this.lienzo = l; guardarAj({ hoja: l.id });
    this.nombreHoja.textContent = l.nombre;
    this.hojaEl.className = "dj-hoja " + (l.fondo || "papel") + (this.pincel === "borrador" ? " borrando" : "");
    this.trazos.clear(); this.mios = []; this.desde = 0;
    const gen = (this._gen = (this._gen || 0) + 1);
    try {
      const r = await SRV.dibujo(l.id);
      if (gen !== this._gen) return;
      for (const t of r.trazos) this.trazos.set(t.id, t);
      this.mios = r.trazos.filter((t) => t.mio).map((t) => t.id);
      this.desde = r.ahora;
      this._medir();
    } catch (e) { aviso(e.message, 3000, "error"); }
    this._escuchar(gen);
  }

  async _escuchar(gen) {
    while (this.vivo && gen === this._gen) {
      await cuandoVisible();
      if (!this.vivo || gen !== this._gen) return;
      try {
        const r = await SRV.dibujo(this.lienzo.id, this.desde, 25);
        if (gen !== this._gen) return;
        this.desde = r.ahora;
        if (r.lienzo?.borrado) { aviso(`${this.pareja} borró esta hoja`, 2600); this._cargar(); return; }
        if (r.lienzo && (r.lienzo.nombre !== this.lienzo.nombre || r.lienzo.fondo !== this.lienzo.fondo)) { this.lienzo = { ...this.lienzo, ...r.lienzo }; this.nombreHoja.textContent = this.lienzo.nombre; this.hojaEl.classList.remove(...FONDOS.map((f) => f[0])); this.hojaEl.classList.add(this.lienzo.fondo); }
        let rehacer = false, vivos = false;
        for (const t of r.trazos) {
          const antes = this.trazos.get(t.id);
          if (t.borrado) { if (antes) { this.trazos.delete(t.id); rehacer = true; } continue; }
          if (t.mio && antes?.fin) continue; // lo mío ya está pintado
          if (!t.mio && !antes) this.sonido.plin();
          this.trazos.set(t.id, t);
          if (t.fin && !(antes?.fin)) { if (t.mio) continue; pintarTrazo(this.base.getContext("2d"), t, this.base.width, this.base.height); }
          vivos = true;
        }
        if (rehacer) this._todo(); else if (vivos) this._vivos();
      } catch (e) { await esperar(4000); }
    }
  }

  async deshacer() {
    const id = this.mios.pop();
    if (!id) { aviso("No hay nada tuyo que deshacer en esta hoja", 2000); return; }
    this.trazos.delete(id);
    this._todo();
    try { await SRV.dibujoDeshacer(this.lienzo.id, id); } catch (e) { /* ya no estaba */ }
  }

  _menuHojas() {
    const L = this.lista || [];
    const fila = (l) => el("button.dj-hoja-item" + (l.id === this.lienzo?.id ? ".on" : ""), { type: "button", onClick: () => { this.cerrarHoja(); this._abrirHoja(l); } }, [el("i." + (l.fondo || "papel")), el("b", { text: l.nombre }), el("small", { text: l.trazos != null ? `${l.trazos} trazos` : "" })]);
    const fondos = el("div.dj-fondos", {}, FONDOS.map(([k, n]) => el("button.dj-fondo." + k + (this.lienzo?.fondo === k ? ".on" : ""), { type: "button", title: n, "aria-label": "Fondo " + n, onClick: async () => {
      try { this.lienzo = await SRV.editarLienzo(this.lienzo.id, { fondo: k }); this.hojaEl.classList.remove(...FONDOS.map((f) => f[0])); this.hojaEl.classList.add(k); this.cerrarHoja(); } catch (e) { aviso(e.message, 3000, "error"); }
    } }, [el("span", { text: n })])));
    this.hoja("Nuestras hojas", [
      el("div.dj-hojas-lista", {}, L.map(fila)),
      el("button.jt-btn", { type: "button", text: "Hoja nueva", onClick: async () => {
        try { const l = await SRV.nuevoLienzo({ nombre: `Hoja ${L.length + 1}`, fondo: this.lienzo?.fondo || "papel" }); this.cerrarHoja(); this.lista = [l, ...L]; this._abrirHoja(l); aviso(`Hoja nueva: ${this.pareja} también la ve`, 2000); } catch (e) { aviso(e.message, 3000, "error"); }
      } }),
      el("b.dj-sub", { text: "Fondo de esta hoja" }), fondos,
      el("div.dj-acciones", {}, [
        el("button.jt-btn.suave.chico", { type: "button", text: "Cambiar nombre", onClick: async () => { const n = await pedirTexto("Nombre de la hoja", this.lienzo.nombre); if (n?.trim()) { try { this.lienzo = await SRV.editarLienzo(this.lienzo.id, { nombre: n.trim() }); this.nombreHoja.textContent = this.lienzo.nombre; this.cerrarHoja(); } catch (e) { aviso(e.message, 3000, "error"); } } } }),
        el("button.jt-btn.suave.chico", { type: "button", text: "Guardar imagen", onClick: () => { this.cerrarHoja(); this.guardarImagen(); } }),
        el("button.jt-btn.suave.chico", { type: "button", text: "Borrar lo mío", onClick: async () => { if (await confirmar("¿Borrar todo lo que TÚ dibujaste en esta hoja? Lo de tu amorcito se queda.", "Borrar lo mío")) { await SRV.dibujoLimpiar(this.lienzo.id, true).catch((e) => aviso(e.message, 3000, "error")); this.cerrarHoja(); this._abrirHoja(this.lienzo); } } }),
        el("button.jt-btn.suave.chico.peligro", { type: "button", text: "Limpiar la hoja", onClick: async () => { if (await confirmar("¿Limpiar toda la hoja? Se borra lo de los dos.", "Limpiar")) { await SRV.dibujoLimpiar(this.lienzo.id).catch((e) => aviso(e.message, 3000, "error")); this.cerrarHoja(); this._abrirHoja(this.lienzo); } } }),
        L.length > 1 ? el("button.jt-btn.suave.chico.peligro", { type: "button", text: "Borrar esta hoja", onClick: async () => { if (await confirmar(`¿Borrar «${this.lienzo.nombre}» para los dos?`, "Borrar")) { await SRV.borrarLienzo(this.lienzo.id).catch((e) => aviso(e.message, 3000, "error")); this.cerrarHoja(); this._cargar(); } } }) : null,
      ]),
    ]);
  }

  /** La hoja como imagen (con su fondo): se comparte si el aparato puede, si no se descarga. */
  async guardarImagen() {
    const cv = document.createElement("canvas");
    cv.width = 1500; cv.height = 2000;
    const c = cv.getContext("2d");
    const f = this.lienzo?.fondo || "papel";
    c.fillStyle = { papel: "#fffdf8", cuadros: "#fffdf8", rayas: "#fffdf8", rosa: "#fff0f6", noche: "#1d1830" }[f];
    c.fillRect(0, 0, 1500, 2000);
    if (f === "cuadros" || f === "rayas") {
      c.strokeStyle = "rgba(120,140,200,.22)"; c.lineWidth = 2;
      for (let y = 60; y < 2000; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(1500, y); c.stroke(); }
      if (f === "cuadros") for (let x = 60; x < 1500; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 2000); c.stroke(); }
    }
    const capa = document.createElement("canvas");
    capa.width = 1500; capa.height = 2000;
    const cc = capa.getContext("2d");
    for (const t of [...this.trazos.values()].sort((a, b) => a.id - b.id)) pintarTrazo(cc, t, 1500, 2000);
    c.drawImage(capa, 0, 0);
    const blob = await new Promise((ok) => cv.toBlob(ok, "image/png"));
    if (!blob) return;
    const nombre = `${(this.lienzo?.nombre || "dibujo").replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "dibujo"}.png`;
    const archivo = new File([blob], nombre, { type: "image/png" });
    if (navigator.canShare?.({ files: [archivo] })) { try { await navigator.share({ files: [archivo], title: this.lienzo?.nombre }); return; } catch (e) { if (e.name === "AbortError") return; } }
    const a = el("a", { href: URL.createObjectURL(blob), download: nombre });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    aviso("Imagen guardada 🎨", 1800);
  }
}
