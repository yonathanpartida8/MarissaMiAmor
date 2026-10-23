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
 *
 * Fase 41: NUNCA tapa lo tuyo. Ella y su globito buscan un hueco libre (fuera de la hoja, de las
 * hojitas abiertas y de la línea de tiempo); si no hay ninguno (el teléfono, con la hoja a todo lo
 * ancho), el globito se pone abajo y la hoja se hace a un ladito para que se vea entera. Además: sus
 * ojos siguen tu dedo, parpadea, baila cuando guardas o publicas y saca su lupa cuando revisa.
 */
import { R, cuandoActivo } from "../components/rendimiento.js";
import { el } from "../../src/utils/dom.js";
import { PREF, movimiento } from "../config/preferencias.js";

/* Fase 42: por capas. Lo que se mueve todo el tiempo (alitas, antenas, patitas y ojitos) va en su
   propia capa y se anima la capa entera: el navegador la mueve sin recalcular nada. Animado por dentro
   del SVG, cada cuadro obligaba a recalcular estilos y diseño de la pantalla (y más aún al mover el dedo). */
const DIBUJO = `<svg class="ab-capa ab-c-ala ab-c-ala-i" viewBox="0 0 80 74" aria-hidden="true"><ellipse class="ab-ala" cx="26" cy="25" rx="11" ry="15" transform="rotate(-24 26 25)"/></svg>
<svg class="ab-capa ab-c-ala ab-c-ala-d" viewBox="0 0 80 74" aria-hidden="true"><ellipse class="ab-ala" cx="54" cy="25" rx="11" ry="15" transform="rotate(24 54 25)"/></svg>
<svg class="ab-capa ab-c-patas" viewBox="0 0 80 74" aria-hidden="true"><path class="ab-patas" d="M33.5 63.5q-1.2 3.6-3.6 5M46.5 63.5q1.2 3.6 3.6 5" fill="none" stroke="#4a3320" stroke-width="2" stroke-linecap="round"/></svg>
<svg class="ab-capa ab-c-cuerpo" viewBox="0 0 80 74" aria-hidden="true">
<defs>
  <radialGradient id="ab-cuerpo" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff3a6"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#f4a71d"/></radialGradient>
  <linearGradient id="ab-ala-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".55" stop-color="#dcefff" stop-opacity=".72"/><stop offset="1" stop-color="#ffd3ea" stop-opacity=".62"/></linearGradient>
  <clipPath id="ab-recorte"><circle cx="40" cy="44" r="22"/></clipPath>
</defs>

<path class="ab-tallos" d="M33 25q-5-9-8-15M47 25q5-9 8-15" fill="none" stroke="#4a3320" stroke-width="2" stroke-linecap="round"/>
<g class="ab-lupa"><path d="M57 58l7 8" stroke="#7a4a1f" stroke-width="3.4" stroke-linecap="round"/><circle cx="54" cy="53" r="8" fill="rgba(210,236,255,.55)" stroke="#4a3320" stroke-width="2.2"/><path d="M50 50q2-2.5 5-2.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></g>
<path d="M40 70l-3.5-5h7z" fill="#4a3320"/>
<circle cx="40" cy="44" r="22" fill="url(#ab-cuerpo)"/>
<g class="ab-rayas" clip-path="url(#ab-recorte)" fill="#4a3320" opacity=".9"><rect x="14" y="54" width="52" height="5" rx="2.5"/><rect x="14" y="61.5" width="52" height="4" rx="2"/></g>
<circle class="ab-borde" cx="40" cy="44" r="22" fill="none" stroke="#4a3320" stroke-width="2.2"/>
<ellipse class="ab-luz" cx="31" cy="31.5" rx="7.5" ry="3.6" transform="rotate(-28 31 31.5)" fill="#fff" opacity=".5"/>
<circle cx="49" cy="29.5" r="1.4" fill="#fff" opacity=".7"/>
<g class="ab-cara">
  
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
    <g class="ab-labios"><path d="M35.4 48.4q2.3-1.9 4.6-.5q2.3-1.4 4.6.5q-1.7 3.8-4.6 3.8q-2.9 0-4.6-3.8z" fill="#a3101c" stroke="#5c0710" stroke-width=".8" stroke-linejoin="round"/><path d="M37.6 50.3q2.4.9 4.8 0" fill="none" stroke="#f08a96" stroke-width=".7" stroke-linecap="round"/></g>
    <g class="ab-mono" stroke="#17100b" stroke-width="1" stroke-linejoin="round"><path d="M40 24.5l-8.5-5.2q-2 4.6 0 9.6z" fill="#d6b48c"/><path d="M40 24.5l8.5-5.2q2 4.6 0 9.6z" fill="#d6b48c"/><circle cx="40" cy="24.5" r="2.3" fill="#a3101c"/><g fill="#17100b" stroke="none"><circle cx="34" cy="22.6" r=".9"/><circle cx="35.6" cy="26.4" r=".8"/><circle cx="46" cy="22.6" r=".9"/><circle cx="44.4" cy="26.4" r=".8"/></g></g>
  </g>
</g>
</svg>
<svg class="ab-capa ab-c-antena ab-c-antena-i" viewBox="0 0 80 74" aria-hidden="true"><path d="M25 10c-3-3-7 1-3 4l3 3 3-3c4-3 0-7-3-4z" fill="#ff7aa2"/></svg>
<svg class="ab-capa ab-c-antena ab-c-antena-d" viewBox="0 0 80 74" aria-hidden="true"><path d="M55 10c-3-3-7 1-3 4l3 3 3-3c4-3 0-7-3-4z" fill="#ff7aa2"/></svg>
<svg class="ab-capa ab-c-ojos" viewBox="0 0 80 74" aria-hidden="true"><g data-o="normal" class="ab-ojos-n"><ellipse cx="32" cy="41" rx="3.4" ry="4.2" fill="#2b1d12"/><ellipse cx="48" cy="41" rx="3.4" ry="4.2" fill="#2b1d12"/><circle cx="33.3" cy="39.3" r="1.4" fill="#fff"/><circle cx="49.3" cy="39.3" r="1.4" fill="#fff"/><circle cx="31.2" cy="43" r=".6" fill="#fff"/><circle cx="47.2" cy="43" r=".6" fill="#fff"/></g></svg>`;

/** El dibujo de la abejita (para avisos fuera de su globito, como en «Probar»). */
export const DIBUJO_ABEJA = DIBUJO;

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
    // Sus ojos siguen tu dedo (o el ratón): una vez por cuadro como mucho.
    let pend = null;
    addEventListener("pointermove", (e) => {
      if (!this.n || pend) return;
      pend = requestAnimationFrame(() => {
        pend = null;
        if (!this.n) return;
        const cx = this.pos.x + 36, cy = this.pos.y + 32, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
        // Sólo se mueve la capita de los ojos (cambiar una variable de toda la abejita la recalculaba entera),
        // y sólo si de verdad cambió (menos de un cuarto de píxel no se nota).
        const o = this._ojos?.isConnected ? this._ojos : (this._ojos = this.n.querySelector(".ab-c-ojos"));
        if (!o) return;
        const x = Math.round((dx / d) * 1.8 * k * 4) / 4, y = Math.round((dy / d) * 1.5 * k * 4) / 4;
        if (x === this._mx && y === this._my) return;
        this._mx = x; this._my = y;
        o.style.translate = `${x}px ${y}px`;
      });
    }, { passive: true });
  }

  /* ── Dónde NO ponerse (Fase 41) ── */
  /** Lo que importa (la hoja, lo abierto, la línea de tiempo) pesa 1; las barras, poquito. */
  _zonas() {
    const z = [], B = document.body.classList;
    const pon = (b, k = 1) => { if (b && b.width > 2 && b.height > 2 && b.bottom > 0 && b.right > 0 && b.top < innerHeight && b.left < innerWidth) z.push({ l: b.left, t: b.top, r: b.right, b: b.bottom, k }); };
    const L = this.app.lienzo;
    if (L?.hoja && !B.contains("ed-probando")) pon(L.hoja.getBoundingClientRect());
    for (const n of document.querySelectorAll(".ed-hoja-sec.abierta, .ed-insp.abierta, .ed-hojita.abierta, .ed-modal, .ed-menu, .ed-pop.ver, .ed-linea:not([hidden]), .pro-menu.abierto, .jt-capa.ver, .mp-capa.ver")) pon(n.getBoundingClientRect());
    if (B.contains("lateral-abierto")) pon(document.querySelector(".ed-lateral")?.getBoundingClientRect());
    for (const n of document.querySelectorAll(".ed-barra, .ed-contexto, .ed-riel, .ed-dock, .pro-barra, .pro-herr")) pon(n.getBoundingClientRect(), 0.25);
    return z;
  }
  /** El hueco de w×h que menos tapa (y más cerca de `cerca`). `extra`: más cosas que no tapar. */
  _libre(w, h, cerca, extra = []) {
    const z = this._zonas();
    for (const b of extra) if (b) z.push({ l: b.left, t: b.top, r: b.right, b: b.bottom, k: 1.5 });
    const W = innerWidth, H = innerHeight, m = 6, paso = 14;
    let mejor = null;
    for (let y = 50; y <= H - h - m; y += paso) for (let x = m; x <= W - w - m; x += paso) {
      let tapa = 0;
      for (const q of z) { const ix = Math.min(x + w, q.r) - Math.max(x, q.l), iy = Math.min(y + h, q.b) - Math.max(y, q.t); if (ix > 0 && iy > 0) tapa += ix * iy * q.k; }
      const s = tapa * 4 + Math.hypot(x - cerca.x, y - cerca.y);
      if (!mejor || s < mejor.s) mejor = { x, y, s, tapa };
    }
    return mejor || { x: cerca.x, y: cerca.y, tapa: 0 };
  }

  get viva() { return !!this.n; }

  /* ── Voz: blips cortitos hechos con Web Audio (nada que descargar) ── */
  sonar(tipo = "habla", silabas = 3) {
    if (!PREF.abejaSonido) return;
    // Con tu archivo (assets/sonidos-editor/abejita-<tipo>.mp3), suena ése.
    if (this.app.sonidos?.tiene?.("abeja-" + tipo)) { this.app.sonidos.sonar("abeja-" + tipo); return; }
    const AU = this.app.audio, ac = AU?.ac;
    if (!ac || ac.state !== "running") return;
    const vol = 0.32 * Math.max(0.05, this.app.sonidos?.pref?.vol ?? 0.35);
    const notas = {
      hola: [[880, 0, 0.11], [1318, 0.12, 0.16]],
      feliz: [[988, 0, 0.09], [1245, 0.09, 0.09], [1568, 0.18, 0.16]],
      susto: [[1400, 0, 0.12, 700], [900, 0.13, 0.2, 380]],
      adios: [[1318, 0, 0.1], [988, 0.11, 0.1], [784, 0.22, 0.18]],
      zumbido: [[180, 0, 0.45, 200, "triangle", 0.35]],
      // Una palabra: un «pip» cortito, cada uno un poquito distinto (como una vocecita).
      palabra: [[azar(720, 1180), 0, 0.055, 0, "sine", 0.75]],
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
    this._parpadear();
    return this.volarA(this.casa(), 760).then(() => this._vivir());
  }

  irse() {
    const n = this.n;
    if (!n) return;
    this.n = null;
    clearTimeout(this._t);
    clearTimeout(this._tp);
    this._cola = [];
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

  /** Su sitio: cerca del foquito, en el hueco libre más cercano (sin tapar la hoja ni lo abierto). */
  casa() {
    const f = document.querySelector(".ed-foco")?.getBoundingClientRect();
    const x = f && f.width ? f.left - 70 : innerWidth - 120, y = f && f.height ? f.top - 88 : innerHeight - 160;
    const cerca = { x: Math.max(6, Math.min(innerWidth - 86, x)), y: Math.max(56, Math.min(innerHeight - 90, y)) };
    const l = this._libre(76, 64, cerca);
    return l.tapa > 76 * 64 * 0.3 ? cerca : { x: l.x, y: l.y };
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
    if (!this.n || !r) return Promise.resolve();
    const x = r.right + 80 < innerWidth ? r.right - 10 : r.left - 70, y = Math.max(56, r.top - 60);
    return this.volarA({ x: Math.max(6, Math.min(innerWidth - 86, x)), y: Math.min(innerHeight - 90, y) }, 800);
  }

  /** Vida: cada ratito cambia de sitio, da un saltito, una vuelta o zumba. */
  _vivir() {
    clearTimeout(this._t);
    if (!this.n) return;
    const k = movimiento();
    const otra = (ms) => { this._t = setTimeout(() => this._vivir(), ms); };
    // Oculta, en reposo o con el aparato sufriendo: no vuela (espera a que vuelvas a tocar algo).
    if (document.hidden || R.reposo) { const n = this.n; this._t = 0; cuandoActivo().then(() => { if (this.n === n && !this._t) this._vivir(); }); return; }
    // Con el aparato en ahorro descansa un ratito (con reloj: esperar «a que toque algo» aquí era un bucle
    // sin fin que congelaba la página y la dejaba en blanco).
    if (R.ahorro) return otra(8000);
    if (!k || this.hablando) return otra(2200);
    const r = Math.random();
    if (r < 0.6) {
      // Revolotea por los huecos libres cercanos (nunca encima de la hoja si hay otro sitio).
      const c = this.casa();
      const quiere = { x: c.x + azar(-90, 50) * k, y: c.y + azar(-70, 30) * k };
      const l = this._libre(76, 64, quiere);
      const p = l.tapa > 76 * 64 * 0.3 ? c : { x: l.x, y: l.y };
      this.volarA(p, azar(1500, 2400)).then(() => otra(azar(500, 1600)));
    } else if (r < 0.74) { this.saltito(); otra(azar(1400, 2200)); }
    else if (r < 0.84) { this._clase("vuelta", 900); if (Math.random() < 0.5) this.chispas(4); otra(2200); }
    else if (r < 0.9) { this._clase("baila", 1300); otra(2400); }
    else if (r < 0.95) { this._clase("mira", 1600); this.cara("sorpresa", 900); otra(2400); }
    else { if (Math.random() < 0.4) this.sonar("zumbido"); this.cara(Math.random() < 0.5 ? "guino" : "enamorada", 1400); otra(azar(1600, 2600)); }
  }

  /** Parpadea de vez en cuando (a veces dos seguiditos). Una animación cortita cada pocos segundos, no
   *  un bucle infinito: el parpadeo en bucle hacía recalcular la pantalla 60 veces por segundo. */
  _parpadear() {
    clearTimeout(this._tp);
    if (!this.n) return;
    this._tp = setTimeout(() => {
      const o = this.n?.querySelector(".ab-c-ojos");
      const uno = () => o?.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.08)", offset: 0.45 }, { transform: "scaleY(1)" }], { duration: 170, easing: "ease-in-out" });
      if (o && movimiento() && !document.hidden && !R.reposo && !R.ahorro) { uno(); if (Math.random() < 0.2) setTimeout(uno, 260); }
      this._parpadear();
    }, azar(2600, 5600));
  }

  saltito() { this._clase("salta", 600); }
  /** Un bailecito (al guardar, publicar o cuando todo está bonito). */
  bailar() { this._clase("baila", 1300); this.chispas(8, "♥"); }
  /** Saca (o guarda) su lupa: está revisando tu librito. */
  lupa(on = true) { if (this.n) this.n.toggleAttribute("data-lupa", on); }
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
      insertar: ["feliz", "feliz", 6], guardar: ["enamorada", "feliz", 8], borrar: ["sorpresa", "habla", 0], publicar: ["enamorada", "feliz", 12],
      hackeo: ["asustada", "susto", 0], carino: ["enamorada", "hola", 10],
    }[tipo] || ["feliz", "habla", 3];
    this.cara(r[0], 1800);
    this.sonar(r[1]);
    this.saltito();
    if (r[2]) this.chispas(r[2], tipo === "guardar" || tipo === "carino" ? "♥" : "✦");
    if (tipo === "hackeo") this._clase("tiembla", 2400);
    if (tipo === "guardar" || tipo === "publicar") setTimeout(() => this._clase("baila", 1300), 300);
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
    // Uno a la vez (Fase 43): lo que dice por su cuenta espera a que termine lo que estabas leyendo.
    if (op.espera && this.globoVisible) {
      this._cola = (this._cola || []).filter((x) => x[0] !== texto).slice(-1);
      this._cola.push([texto, op]);
      return;
    }
    this.hablando = true;
    clearTimeout(this._t);
    clearTimeout(this._tg);
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
    // Escribe letra por letra y suena un sonidito con cada palabra (Fase 43). Por letras de verdad
    // (los emojis no se parten a la mitad).
    const letras = Array.from(texto);
    let i = 0;
    const cada = movimiento() ? 1 : letras.length;
    this.n.classList.add("hablando");
    this._tecla = setInterval(() => {
      const antes = i;
      i = Math.min(letras.length, i + cada);
      ya.textContent = letras.slice(0, i).join(""); falta.textContent = letras.slice(i).join("");
      for (let k = antes; k < i; k++) if (/[\p{L}\p{N}]/u.test(letras[k]) && (k === 0 || !/[\p{L}\p{N}'’]/u.test(letras[k - 1]))) { this.sonar("palabra"); break; }
      if (i >= letras.length) { clearInterval(this._tecla); this.n?.classList.remove("hablando"); }
    }, 30);
    this.cara(op.cara || "normal", op.cara ? 2600 : 0);
    if (op.voz) this.sonar(op.voz);
    this._evitar = op.evitar || null;
    this._colocar();
    g.classList.add("ver");
    if (op.dura) this._tg = setTimeout(() => this.callar(), op.dura);
  }

  /**
   * Fase 41: el globito busca un hueco que no tape nada (y ella se pone a su lado). Si no hay
   * (teléfono con la hoja a lo ancho), va abajo, ella dentro de él, y la hoja se hace a un ladito
   * hacia arriba (lienzo → «acomodo»): así lo tuyo siempre se ve entero.
   */
  _colocar() {
    const g = this.g;
    if (!g || !this.n) return;
    // En LovEdit, delgadito (Fase 43): hay poco espacio y lo importante es la página y las pistas.
    const w = Math.min(document.body.classList.contains("modo-pro") ? 240 : 290, innerWidth - 24);
    // Si ya estaba abajo (la hoja hecha a un lado por él), se queda abajo: medir huecos con la hoja
    // encogida daría un «hueco» que deja de serlo en cuanto la hoja vuelve a su tamaño.
    const seguia = g.classList.contains("acomoda") && g.classList.contains("ver");
    g.style.width = w + "px";
    g.classList.remove("acomoda");
    const h = g.offsetHeight || 110;
    const extra = this._evitar ? [this._evitar] : [];
    const l = seguia ? { tapa: Infinity } : this._libre(w, h, { x: this.pos.x - w / 2, y: this.pos.y - h }, extra);
    let fx, fy, junto;
    if (l.tapa < 40) {
      fx = l.x; fy = l.y;
      // Ella, pegadita al globito, también en un hueco.
      const caja = { left: fx, top: fy, right: fx + w, bottom: fy + h };
      const b = this._libre(76, 64, { x: fx + w - 50, y: fy + h + 4 }, [...extra, caja]);
      junto = b.tapa < 76 * 64 * 0.4 ? { x: b.x, y: b.y } : { x: Math.min(innerWidth - 82, fx + w - 40), y: Math.max(50, fy - 60) };
    } else {
      // Sin hueco: abajo, a lo ancho, con ella adentro; la hoja se acomoda arriba.
      const vw = this.app.lienzo?.vistaEl?.getBoundingClientRect().width || innerWidth;
      g.style.width = Math.min(360, (vw > 200 ? vw : innerWidth) - 16) + "px";
      g.classList.add("acomoda");
      ({ fx, fy, junto } = this._abajo());
      // Si cambia el espacio de la hoja (se va una barra), el globito baja con ella.
      if (!this._ro && window.ResizeObserver && this.app.lienzo?.vistaEl) {
        this._ro = new ResizeObserver(() => {
          if (!this.globoVisible || !this.g.classList.contains("acomoda")) return;
          const a = this._abajo();
          this.g.style.transform = `translate3d(${a.fx}px,${a.fy}px,0)`;
          this.volarA(a.junto, 300);
          dispatchEvent(new CustomEvent("ed-hoja", { detail: "abeja" }));
        });
        this._ro.observe(this.app.lienzo.vistaEl);
      }
    }
    g.style.transform = `translate3d(${fx}px,${fy}px,0)`;
    const cx = junto.x + 38, arriba = junto.y + 30 < fy;
    g.classList.toggle("abajo", arriba);
    g.classList.toggle("suelto", g.classList.contains("acomoda") || cx < fx + 10 || cx > fx + w - 10);
    g.style.setProperty("--cola", `${Math.max(18, Math.min(w - 22, cx - fx))}px`);
    if (Math.hypot(junto.x - this.pos.x, junto.y - this.pos.y) > 4) this.volarA(junto, 520);
    // Que la hoja se acomode (o vuelva a su sitio).
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "abeja" }));
  }

  /** El sitio del globito «acomodado»: abajo de la hoja, centrado, con ella adentro. */
  _abajo() {
    const g = this.g, v = this.app.lienzo?.vistaEl?.getBoundingClientRect();
    // Centrado en el espacio de la hoja (no detrás del riel de la izquierda).
    const a = v && v.width > 200 ? v : { left: 0, width: innerWidth };
    const hh = g.offsetHeight || 110, fx = Math.round(a.left + (a.width - g.offsetWidth) / 2);
    // (En LovEdit las pistas tapan la parte de abajo de la vista: se pone justo encima de ellas.)
    const lin = document.body.classList.contains("modo-pro") ? document.querySelector(".ed-linea:not([hidden])")?.getBoundingClientRect() : null;
    const piso = Math.min(v && v.bottom > 120 ? v.bottom : innerHeight - 70, lin && lin.top > 120 ? lin.top : Infinity);
    const fy = Math.round(piso - hh - 8);
    return { fx, fy, junto: { x: fx + 2, y: fy + Math.max(0, hh / 2 - 34) } };
  }

  get globoVisible() { return !!this.g?.classList.contains("ver"); }

  callar() {
    clearInterval(this._tecla);
    clearTimeout(this._tg);
    this.n?.classList.remove("hablando");
    const g = this.g;
    if (g) { const acomodaba = g.classList.contains("acomoda"); g.classList.remove("ver", "acomoda"); if (acomodaba) dispatchEvent(new CustomEvent("ed-hoja", { detail: "abeja" })); }
    this.lupa(false);
    if (this.hablando) { this.hablando = false; if (this.n) { clearTimeout(this._t); this._t = setTimeout(() => this._vivir(), 900); } }
    // Lo que esperaba su turno, un ratito después (para que se note que es otro diálogo).
    clearTimeout(this._tcola);
    if (this._cola?.length) this._tcola = setTimeout(() => { const x = this._cola?.shift(); if (x && this.n && !this.globoVisible) this.decir(x[0], x[1]); }, 1100);
  }

  /** Quitar el globito del todo (al irse). */
  destruirGlobo() { const g = this.g; this.g = null; if (g) { g.classList.remove("ver"); setTimeout(() => g.remove(), 300); } }
}

