/**
 * LA ABEJITA — la mascota del editor.
 *
 * Sólo dibujo, movimiento, caras, globito y su voz. Qué dice y cuándo lo
 * decide `components/ayuda.js`. Nunca recibe toques (pointer-events: none):
 * no tapa ningún botón; sólo su globito se puede tocar.
 *
 *   venir(desde)       aparece desde el foquito con un saludo
 *   irse()             se despide y se va volando
 *   decir(texto, op)   habla en su globito (con voz) · callar()
 *   cara(nombre, ms)   normal | feliz | guino | enamorada | sorpresa | asustada | dormida
 *   reaccionar(tipo)   insertar | guardar | borrar | hackeo | carino
 *   volarA(p) · casa() · visitar(rect)
 * Mientras está, se mueve sola todo el tiempo (con tope de movimiento de
 * Configuración, y quieta del todo si se pide «sin movimiento»).
 */
import { el } from "../../src/utils/dom.js";
import { PREF, movimiento } from "../config/preferencias.js";

const DIBUJO = `<svg viewBox="0 0 80 74" aria-hidden="true">
<defs>
  <radialGradient id="ab-cuerpo" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff3a6"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#f4a71d"/></radialGradient>
  <linearGradient id="ab-ala-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".55" stop-color="#dcefff" stop-opacity=".72"/><stop offset="1" stop-color="#ffd3ea" stop-opacity=".62"/></linearGradient>
  <clipPath id="ab-recorte"><circle cx="40" cy="44" r="22"/></clipPath>
</defs>
<g class="ab-alas">
  <ellipse class="ab-ala ab-ala-i" cx="26" cy="25" rx="11" ry="15" transform="rotate(-24 26 25)"/>
  <ellipse class="ab-ala ab-ala-d" cx="54" cy="25" rx="11" ry="15" transform="rotate(24 54 25)"/>
</g>
<path class="ab-tallos" d="M33 25q-5-9-8-15M47 25q5-9 8-15" fill="none" stroke="#4a3320" stroke-width="2" stroke-linecap="round"/>
<path class="ab-antena" d="M25 10c-3-3-7 1-3 4l3 3 3-3c4-3 0-7-3-4z" fill="#ff7aa2"/>
<path class="ab-antena" d="M55 10c-3-3-7 1-3 4l3 3 3-3c4-3 0-7-3-4z" fill="#ff7aa2"/>
<path class="ab-patas" d="M33.5 63.5q-1.2 3.6-3.6 5M46.5 63.5q1.2 3.6 3.6 5" fill="none" stroke="#4a3320" stroke-width="2" stroke-linecap="round"/>
<path d="M40 70l-3.5-5h7z" fill="#4a3320"/>
<circle cx="40" cy="44" r="22" fill="url(#ab-cuerpo)"/>
<g class="ab-rayas" clip-path="url(#ab-recorte)" fill="#4a3320" opacity=".9"><rect x="14" y="54" width="52" height="5" rx="2.5"/><rect x="14" y="61.5" width="52" height="4" rx="2"/></g>
<circle class="ab-borde" cx="40" cy="44" r="22" fill="none" stroke="#4a3320" stroke-width="2.2"/>
<ellipse class="ab-luz" cx="31" cy="31.5" rx="7.5" ry="3.6" transform="rotate(-28 31 31.5)" fill="#fff" opacity=".5"/>
<circle cx="49" cy="29.5" r="1.4" fill="#fff" opacity=".7"/>
<g class="ab-cara">
  <g data-o="normal" class="ab-ojos-n"><ellipse cx="32" cy="41" rx="3.4" ry="4.2" fill="#2b1d12"/><ellipse cx="48" cy="41" rx="3.4" ry="4.2" fill="#2b1d12"/><circle cx="33.3" cy="39.3" r="1.4" fill="#fff"/><circle cx="49.3" cy="39.3" r="1.4" fill="#fff"/><circle cx="31.2" cy="43" r=".6" fill="#fff"/><circle cx="47.2" cy="43" r=".6" fill="#fff"/></g>
  <g data-o="feliz" fill="none" stroke="#2b1d12" stroke-width="2.2" stroke-linecap="round"><path d="M28.5 42q3.5-5 7 0M44.5 42q3.5-5 7 0"/></g>
  <g data-o="guino"><ellipse cx="32" cy="41" rx="3.4" ry="4.2" fill="#2b1d12"/><circle cx="33.3" cy="39.3" r="1.4" fill="#fff"/><path d="M44.5 41.5q3.5 3 7 0" fill="none" stroke="#2b1d12" stroke-width="2.2" stroke-linecap="round"/></g>
  <g data-o="corazon" fill="#ff4f7f"><path d="M32 45l-4-4c-2-2 0-5 2.2-4l1.8 1.3 1.8-1.3c2.2-1 4.2 2 2.2 4z"/><path d="M48 45l-4-4c-2-2 0-5 2.2-4l1.8 1.3 1.8-1.3c2.2-1 4.2 2 2.2 4z"/></g>
  <g data-o="susto"><circle cx="32" cy="41" r="4.6" fill="#fff" stroke="#2b1d12" stroke-width="1.6"/><circle cx="48" cy="41" r="4.6" fill="#fff" stroke="#2b1d12" stroke-width="1.6"/><circle cx="32" cy="41.5" r="1.6" fill="#2b1d12"/><circle cx="48" cy="41.5" r="1.6" fill="#2b1d12"/><path d="M58 33q2 4 0 6q-2-2 0-6z" fill="#8fd3ff"/></g>
  <g data-o="dormida" fill="none" stroke="#2b1d12" stroke-width="2" stroke-linecap="round"><path d="M28.5 41.5h7M44.5 41.5h7"/></g>
  <ellipse class="ab-chapa" cx="26.5" cy="48" rx="3.6" ry="2.2" fill="#ff8fa3" opacity=".75"/><ellipse class="ab-chapa" cx="53.5" cy="48" rx="3.6" ry="2.2" fill="#ff8fa3" opacity=".75"/>
  <path data-b="sonrisa" d="M36.5 48.5q3.5 3.4 7 0" fill="none" stroke="#2b1d12" stroke-width="1.9" stroke-linecap="round"/>
  <path data-b="grande" d="M35.5 47.5q4.5 6.5 9 0z" fill="#c2324f" stroke="#2b1d12" stroke-width="1.6" stroke-linejoin="round"/>
  <path data-b="gato" d="M35.5 48q2.2 2.4 4.5 0q2.3 2.4 4.5 0" fill="none" stroke="#2b1d12" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse data-b="o" cx="40" cy="49.5" rx="2.4" ry="3" fill="#c2324f" stroke="#2b1d12" stroke-width="1.5"/>
  <g class="ab-baddie">
    <path d="M28.8 38.3l-2.9-1.6M29.6 37.2l-1.9-2.6M31 36.6l-.8-3M51.2 38.3l2.9-1.6M50.4 37.2l1.9-2.6M49 36.6l.8-3" fill="none" stroke="#120a0e" stroke-width="1.35" stroke-linecap="round"/>
    <circle cx="25.2" cy="47.2" r=".75" fill="#fff"/><circle cx="52.2" cy="47.2" r=".75" fill="#fff"/>
    <g class="ab-labios"><path d="M35.4 48.4q2.3-1.9 4.6-.5q2.3-1.4 4.6.5q-1.7 3.8-4.6 3.8q-2.9 0-4.6-3.8z" fill="#d4002a" stroke="#7a0018" stroke-width=".8" stroke-linejoin="round"/><path d="M37.6 50.3q2.4.9 4.8 0" fill="none" stroke="#ff9db2" stroke-width=".7" stroke-linecap="round"/></g>
    <path class="ab-brillito" d="M63 19l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#fff"/>
    <path class="ab-brillito" d="M15 33l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="#ffd1ea" style="animation-delay:.9s"/>
  </g>
</g>
</svg>`;

const CARAS = {
  normal: ["normal", "sonrisa"], feliz: ["feliz", "grande"], guino: ["guino", "gato"], enamorada: ["corazon", "sonrisa"],
  sorpresa: ["susto", "o"], asustada: ["susto", "o"], dormida: ["dormida", "gato"],
};
const azar = (a, b) => a + Math.random() * (b - a);

export class Abeja {
  constructor(app) {
    this.app = app;
    this.n = null;
    this.pos = { x: 0, y: 0 };
  }

  get viva() { return !!this.n; }

  /* ── Voz: blips cortitos hechos con Web Audio (nada que descargar) ── */
  sonar(tipo = "habla", silabas = 3) {
    if (!PREF.abejaSonido) return;
    const AU = this.app.audio, ac = AU?.ac;
    if (!ac || ac.state !== "running") return;
    const vol = 0.32 * Math.max(0.05, this.app.sonidos?.pref?.vol ?? 0.35);
    const notas = {
      hola: [[880, 0, 0.11], [1318, 0.12, 0.16]],
      feliz: [[988, 0, 0.09], [1245, 0.09, 0.09], [1568, 0.18, 0.16]],
      susto: [[1400, 0, 0.12, 700], [900, 0.13, 0.2, 380]],
      adios: [[1318, 0, 0.1], [988, 0.11, 0.1], [784, 0.22, 0.18]],
      zumbido: [[180, 0, 0.45, 200, "triangle", 0.35]],
    }[tipo] || Array.from({ length: Math.max(2, Math.min(5, silabas)) }, (_, i) => [azar(820, 1250), i * 0.085, 0.07]);
    const t0 = ac.currentTime + 0.01;
    for (const [f, d, dur, hasta, forma = "sine", k = 1] of notas) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = forma;
      o.frequency.setValueAtTime(f, t0 + d);
      o.frequency.exponentialRampToValueAtTime(hasta || f * 1.12, t0 + d + dur);
      g.gain.setValueAtTime(0, t0 + d);
      g.gain.linearRampToValueAtTime(vol * k, t0 + d + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + d + dur);
      o.connect(g).connect(AU.general);
      o.start(t0 + d); o.stop(t0 + d + dur + 0.02);
      o.onended = () => { try { g.disconnect(); } catch (e) { /* nada */ } };
    }
  }

  /* ── Aparecer y desaparecer ─────────────────────────────────────── */
  venir(desde) {
    if (this.n) return Promise.resolve();
    const n = el("div.ed-abeja", { "aria-hidden": "true", html: `<div class="ed-abeja-in"><div class="ed-abeja-cuerpo">${DIBUJO}</div></div>` });
    document.body.append(n);
    this.n = n;
    this.cara("feliz", 1600);
    this.pos = { x: desde.x - 40, y: desde.y - 36 };
    this._poner(this.pos);
    n.querySelector(".ed-abeja-cuerpo").animate([{ opacity: 0, scale: 0.2, rotate: "-40deg" }, { opacity: 1, scale: 1.18, rotate: "8deg", offset: 0.65 }, { opacity: 1, scale: 1, rotate: "0deg" }], { duration: 520, easing: "cubic-bezier(.3,1.4,.5,1)" });
    this.sonar("hola");
    this.chispas(7);
    return this.volarA(this.casa(), 760).then(() => this._vivir());
  }

  irse() {
    const n = this.n;
    if (!n) return;
    this.n = null;
    clearTimeout(this._t);
    this.callar();
    this.destruirGlobo();
    this._quietar(n);
    n.classList.add("se-va");
    this._caraEn(n, "guino");
    this.sonar("adios");
    const o = this.pos, p = { x: innerWidth + 60, y: Math.max(-90, o.y - 200) };
    n.animate([
      { transform: `translate3d(${o.x}px,${o.y}px,0)` },
      { transform: `translate3d(${o.x - 26}px,${o.y + 12}px,0) rotate(-10deg)`, offset: 0.22 },
      { transform: `translate3d(${p.x}px,${p.y}px,0) rotate(14deg) scale(.6)`, opacity: 0 },
    ], { duration: movimiento() ? 950 : 220, easing: "cubic-bezier(.5,0,.6,1)", fill: "forwards" }).finished.catch(() => {}).then(() => n.remove());
  }

  /* ── Moverse ────────────────────────────────────────────────────── */
  _poner(p) { this.pos = p; if (this.n) this.n.style.transform = `translate3d(${p.x}px,${p.y}px,0)`; }

  /** Donde está ahora de verdad (aunque vaya volando). */
  _aqui() {
    const n = this.n;
    if (!n) return this.pos;
    // Sólo se mueve con transform (las caras y los saltos van en el interior).
    const m = new DOMMatrixReadOnly(getComputedStyle(n).transform);
    for (const a of n.getAnimations()) a.cancel();
    this._poner({ x: m.m41, y: m.m42 });
    return this.pos;
  }

  _quietar(n = this.n) { if (n) for (const a of n.getAnimations()) a.cancel(); }

  /** Su sitio: junto al foquito, por encima, sin tapar nada importante. */
  casa() {
    const f = document.querySelector(".ed-foco")?.getBoundingClientRect();
    const x = f ? f.left - 70 : innerWidth - 120, y = f ? f.top - 88 : innerHeight - 160;
    return { x: Math.max(6, Math.min(innerWidth - 86, x)), y: Math.max(56, Math.min(innerHeight - 90, y)) };
  }

  /** Vuela en curva hasta `p` (se inclina hacia donde va). */
  volarA(p, ms = 900) {
    if (!this.n) return Promise.resolve();
    const o = this._aqui();
    const k = movimiento();
    if (!k) { this._poner(p); return Promise.resolve(); }
    const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1;
    const lado = Math.min(80, d * 0.3) * (Math.random() < 0.5 ? -1 : 1);
    const mx = (o.x + p.x) / 2 - (dy / d) * lado, my = (o.y + p.y) / 2 + (dx / d) * lado - 18;
    const giro = Math.max(-14, Math.min(14, dx / 14));
    this._poner(p);
    return this.n.animate([
      { transform: `translate3d(${o.x}px,${o.y}px,0)` },
      { transform: `translate3d(${mx}px,${my}px,0) rotate(${giro}deg)`, offset: 0.5 },
      { transform: `translate3d(${p.x}px,${p.y}px,0)` },
    ], { duration: ms / Math.max(0.6, k), easing: "cubic-bezier(.45,.05,.35,1)" }).finished.catch(() => {});
  }

  /** Va a mirar algo (una zona de la pantalla) y vuelve después. */
  visitar(r) {
    if (!this.n || !r) return;
    const x = r.right + 80 < innerWidth ? r.right - 10 : r.left - 70, y = Math.max(56, r.top - 60);
    this.volarA({ x: Math.max(6, Math.min(innerWidth - 86, x)), y: Math.min(innerHeight - 90, y) }, 800);
  }

  /** Vida: cada ratito cambia de sitio, da un saltito, una vuelta o zumba. */
  _vivir() {
    clearTimeout(this._t);
    if (!this.n) return;
    const k = movimiento();
    const otra = (ms) => { this._t = setTimeout(() => this._vivir(), ms); };
    if (document.hidden || !k || this.hablando) return otra(2200);
    const r = Math.random();
    if (r < 0.66) {
      const c = this.casa();
      const p = { x: c.x + azar(-70, 34) * k, y: c.y + azar(-50, 26) * k };
      p.x = Math.max(6, Math.min(innerWidth - 86, p.x)); p.y = Math.max(56, Math.min(innerHeight - 90, p.y));
      this.volarA(p, azar(1500, 2400)).then(() => otra(azar(500, 1600)));
    } else if (r < 0.82) { this.saltito(); otra(azar(1400, 2200)); }
    else if (r < 0.92) { this._clase("vuelta", 900); if (Math.random() < 0.5) this.chispas(4); otra(2200); }
    else { if (Math.random() < 0.4) this.sonar("zumbido"); this.cara(Math.random() < 0.5 ? "guino" : "enamorada", 1400); otra(azar(1600, 2600)); }
  }

  saltito() { this._clase("salta", 600); }
  _clase(c, ms) { const i = this.n?.firstChild; if (!i) return; i.classList.remove(c); void i.offsetWidth; i.classList.add(c); setTimeout(() => i.classList.remove(c), ms); }

  /* ── Caras y reacciones ─────────────────────────────────────────── */
  _caraEn(n, nombre) { const [o, b] = CARAS[nombre] || CARAS.normal; n.dataset.ojos = o; n.dataset.boca = b; }
  cara(nombre = "normal", ms = 0) {
    if (!this.n) return;
    clearTimeout(this._tc);
    this._caraEn(this.n, nombre);
    if (ms) this._tc = setTimeout(() => this.n && this._caraEn(this.n, "normal"), ms);
  }

  reaccionar(tipo) {
    if (!this.n) return;
    const r = {
      insertar: ["feliz", "feliz", 6], guardar: ["enamorada", "feliz", 8], borrar: ["sorpresa", "habla", 0],
      hackeo: ["asustada", "susto", 0], carino: ["enamorada", "hola", 10],
    }[tipo] || ["feliz", "habla", 3];
    this.cara(r[0], 1800);
    this.sonar(r[1]);
    this.saltito();
    if (r[2]) this.chispas(r[2], tipo === "guardar" || tipo === "carino" ? "♥" : "✦");
    if (tipo === "hackeo") this._clase("tiembla", 2400);
  }

  /** Brillitos que salen de ella (si las partículas están encendidas). */
  chispas(n = 5, letra = "✦") {
    if (!this.n || !PREF.particulas || !movimiento()) return;
    const c = { x: this.pos.x + 40, y: this.pos.y + 36 };
    for (let i = 0; i < n; i++) {
      const s = el("i.ed-chispa", { text: Math.random() < 0.3 ? "♥" : letra });
      const a = (i / n) * Math.PI * 2 + azar(-0.3, 0.3), d = azar(30, 62);
      s.style.cssText = `left:${c.x}px;top:${c.y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 14}px;color:${["#ffd23f", "#ff7aa2", "#b58cff", "#7fd1ff"][i % 4]}`;
      document.body.append(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  /* ── El globito ─────────────────────────────────────────────────── */
  /**
   * Habla. `op`: { cara, botones: [[html, fn, clase]], cuenta, dura (ms, 0 = hasta que se cierre) }.
   * El texto entra como TEXTO (nunca HTML).
   */
  async decir(texto, op = {}) {
    if (!this.n) return;
    this.hablando = true;
    clearTimeout(this._t);
    clearTimeout(this._tg);
    const c = this.casa();
    if (Math.hypot(c.x - this.pos.x, c.y - this.pos.y) > 120) await this.volarA(c, 650);
    if (!this.n) return;
    let g = this.g;
    if (!g) {
      g = el("div.ed-abeja-globo", { role: "status", "aria-live": "polite" }, [el("p"), el("div.ed-abeja-pie")]);
      document.body.append(g);
      this.g = g;
    }
    const p = g.firstChild, pie = g.lastChild;
    pie.replaceChildren(
      el("small", { text: op.cuenta || "" }),
      ...(op.botones || []).map(([html, fn, cl]) => el("button.ed-btn.chico" + (cl ? "." + cl : ""), { type: "button", html, onClick: fn })),
    );
    pie.hidden = !op.cuenta && !(op.botones || []).length;
    // Escribe rapidito; lo que falta ya ocupa su sitio (el globito no salta).
    clearInterval(this._tecla);
    p.setAttribute("aria-label", texto);
    const ya = el("span"), falta = el("span.falta", { text: texto });
    p.replaceChildren(ya, falta);
    let i = 0;
    const cada = movimiento() ? 2 : texto.length;
    this.n.classList.add("hablando");
    this._tecla = setInterval(() => {
      i += cada;
      ya.textContent = texto.slice(0, i); falta.textContent = texto.slice(i);
      if (i >= texto.length) { clearInterval(this._tecla); this.n?.classList.remove("hablando"); }
    }, 22);
    this.cara(op.cara || "normal", op.cara ? 2600 : 0);
    this.sonar(op.voz || "habla", Math.ceil(texto.length / 18));
    this._colocar();
    g.classList.add("ver");
    if (op.dura) this._tg = setTimeout(() => this.callar(), op.dura);
  }

  _colocar() {
    const g = this.g;
    if (!g) return;
    const w = Math.min(290, innerWidth - 24);
    g.style.width = w + "px";
    const h = g.offsetHeight || 110;
    const cx = this.pos.x + 40;
    const x = Math.max(12, Math.min(innerWidth - w - 12, cx > innerWidth / 2 ? cx - w + 28 : cx - 28));
    const arriba = this.pos.y - h - 4 > 8;
    const y = arriba ? this.pos.y - h - 2 : Math.min(innerHeight - h - 12, this.pos.y + 74);
    g.style.transform = `translate3d(${x}px,${y}px,0)`;
    g.classList.toggle("abajo", !arriba);
    g.style.setProperty("--cola", `${Math.max(18, Math.min(w - 22, cx - x))}px`);
  }

  get globoVisible() { return !!this.g?.classList.contains("ver"); }

  callar() {
    clearInterval(this._tecla);
    clearTimeout(this._tg);
    this.n?.classList.remove("hablando");
    const g = this.g;
    if (g) { g.classList.remove("ver"); }
    if (this.hablando) { this.hablando = false; if (this.n) { clearTimeout(this._t); this._t = setTimeout(() => this._vivir(), 900); } }
  }

  /** Quitar el globito del todo (al irse). */
  destruirGlobo() { const g = this.g; this.g = null; if (g) { g.classList.remove("ver"); setTimeout(() => g.remove(), 300); } }
}

