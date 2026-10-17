/**
 * EFECTITOS DEL EDITOR — que trabajar se sienta lindo, suave y satisfactorio.
 *
 *   arrastrar   una cinta de acuarela pastel que pasa exacto por donde pasó lo
 *               que mueves: sale de detrás, se afila hacia la cola, con velo,
 *               borde de agua y granito de papel, y se seca sola; nunca pinta
 *               encima del objeto
 *   elegir      una cinta de colores que se dibuja alrededor y florcitas que
 *               se abren en las esquinas (lila si son varios)
 *   soltar      una mancha de acuarela que florece debajo y pétalos que se
 *               posan; si el imán pegó, brillitos sobre la guía
 *   colocar     un «pop» de pegatina: halo tibio y confeti de corazones,
 *               flores y estrellitas que suben y caen con su peso
 *   duplicar    un fantasma punteado que se asienta y florecitas lilas
 *   borrar      nubecitas que se deshacen y pétalos que caen
 *   zoom        un globito con el porcentaje junto a los dedos
 *
 * Todo va en capas encima de la hoja que NUNCA reciben toques, sólo con
 * transform/opacidad (los mueve la tarjeta gráfica) o en un único lienzo
 * para la estela, con tope de piezas. Respetan «Partículas» y «Movimiento»
 * de la configuración y suenan en el mismo cuadro (audio/sonidos-editor.js).
 */
import { PREF } from "../config/preferencias.js";

const RT = window.LibritoRT;
const MAX = 70;
const PASTEL = ["#ff9ec7", "#ffb3c6", "#ffc4a3", "#ffd89e", "#f6b9e2", "#dcbcff", "#c3c8ff", "#b6e0ff", "#bff0d6"];
const FORMA = {
  corazon: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21.2C5.6 16.6 2 13.2 2 8.9 2 5.9 4.3 3.6 7.2 3.6c1.9 0 3.6 1 4.8 2.6 1.2-1.6 2.9-2.6 4.8-2.6 2.9 0 5.2 2.3 5.2 5.3 0 4.3-3.6 7.7-10 12.3z" fill="currentColor"/></svg>',
  flor: '<svg viewBox="0 0 24 24" width="100%" height="100%"><g fill="currentColor"><circle cx="12" cy="6" r="4.4"/><circle cx="17.7" cy="10.2" r="4.4"/><circle cx="15.5" cy="17" r="4.4"/><circle cx="8.5" cy="17" r="4.4"/><circle cx="6.3" cy="10.2" r="4.4"/></g><circle cx="12" cy="11.8" r="3" fill="#fff6d6"/></svg>',
  estrella: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 1c.8 5.6 3.4 8.6 11 11-7.6 2.4-10.2 5.4-11 11-.8-5.6-3.4-8.6-11-11 7.6-2.4 10.2-5.4 11-11z" fill="currentColor"/></svg>',
  petalo: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2c5 4 6.5 9.5 0 20C5.5 11.5 7 6 12 2z" fill="currentColor"/></svg>',
};
// La pintura de la estela: un poco más intensa que los adornos, para que se lea sobre hojas claras.
const PINTURA = ["#ff7fb5", "#ff8fa3", "#ffa27e", "#ffbf6e", "#f38fd2", "#c69bff", "#9fb0ff", "#86ccff", "#7fdcb8"];
const azar = (a, b) => a + Math.random() * (b - a);
const elige = (l) => l[Math.floor(Math.random() * l.length)];
let idGrad = 0;

export class FxEditor {
  constructor(app) {
    this.app = app;
    this.vivas = 0;
    this.st = [];
    const L = app.lienzo, E = app.estado;
    this.capa = document.createElement("div");
    this.capa.className = "ed-fx";
    this.capa.setAttribute("aria-hidden", "true");
    L.vistaEl.append(this.capa);
    // Lo nuevo y lo duplicado.
    const agregar = E.agregarEl.bind(E);
    E.agregarEl = (el, i, pid, sel) => {
      const r = agregar(el, i, pid, sel);
      if ((pid == null || pid === E.paginaId) && !this._sinFx) {
        const dup = this._duplicando;
        requestAnimationFrame(() => this._enEl(el.id, dup ? "duplicar" : "colocar"));
        if (!dup) app.sonidos?.sonar(el.tipo === "trazo" ? "dibujar" : "colocar");
      }
      return r;
    };
    const duplicar = E.duplicarEls.bind(E);
    E.duplicarEls = (...a) => {
      this._duplicando = true;
      try { return duplicar(...a); } finally { this._duplicando = false; app.sonidos?.sonar("duplicar"); }
    };
    const quitar = E.quitarEls.bind(E);
    E.quitarEls = (ids, pid) => {
      if (pid == null || pid === E.paginaId) for (const id of ids) { const b = this._caja(id); if (b) this.polvo(b); }
      return quitar(ids, pid);
    };
    // Elegir (no mientras se arrastra: ahí estorbaría).
    let antes = "";
    E.on("sel", () => {
      const k = E.sel.join(",");
      if (k && k !== antes && !L.g && !L.gestoActivo) requestAnimationFrame(() => { const ids = E.sel.slice(), b = this._union(ids); if (b) this.siguiendo(ids, b, () => this.elegir(b, ids.length > 1)); });
      antes = k;
    });
    E.on("actual", () => { this.capa.textContent = ""; this.vivas = 0; this.st.length = 0; });
  }

  get nivel() {
    if (PREF.movimiento === "nada" || PREF.particulas === false || RT.menosMovimiento?.()) return 0;
    return PREF.movimiento === "reducido" || document.body.classList.contains("ed-calidad-baja") ? 0.5 : 1;
  }

  /** La caja de un elemento en la pantalla (coordenadas de la vista). */
  _caja(id) {
    const L = this.app.lienzo, e = this.app.estado.el(id);
    if (!e || e.oculto) return null;
    const v = L.vis(e), a = L.aPantalla(v.x, v.y), z = L.v.z;
    return { x: a.x, y: a.y, w: v.w * z, h: v.h * z };
  }
  _union(ids) {
    const cs = ids.map((id) => this._caja(id)).filter(Boolean);
    if (!cs.length) return null;
    const x = Math.min(...cs.map((c) => c.x)), y = Math.min(...cs.map((c) => c.y));
    return { x, y, w: Math.max(...cs.map((c) => c.x + c.w)) - x, h: Math.max(...cs.map((c) => c.y + c.h)) - y };
  }
  _enEl(id, que) { const b = this._caja(id); if (b) this.siguiendo([id], b, () => (que === "duplicar" ? this.duplicar(b) : this.colocar(b))); }

  /**
   * Lo que se crea dentro de `hacer` va en un grupito que SIGUE al objeto: si lo
   * arrastras justo después de tocarlo, si mueves la hoja o haces zoom, la cinta,
   * las florcitas y el confeti van con él (antes se quedaban fijos donde estaba).
   * Sólo se mueve el grupo con transform; se va solo cuando se apagan sus piezas.
   */
  siguiendo(ids, b0, hacer) {
    const g = document.createElement("i");
    g.className = "ed-fx-grupo";
    g.style.transformOrigin = `${b0.x}px ${b0.y}px`;
    this.capa.append(g);
    const antes = this._dest;
    this._dest = g;
    try { hacer(); } finally { this._dest = antes; }
    if (!g.childElementCount) { g.remove(); return; }
    const L = this.app.lienzo, z0 = L.v.z, t0 = performance.now();
    let ult = "";
    const paso = () => {
      if (!g.isConnected) return;
      if (!g.childElementCount || performance.now() - t0 > 4000) { g.remove(); return; }
      const b = this._union(ids);
      if (b) {
        const t = `translate(${(b.x - b0.x).toFixed(1)}px, ${(b.y - b0.y).toFixed(1)}px) scale(${(L.v.z / z0).toFixed(4)})`;
        if (t !== ult) g.style.transform = ult = t;
      }
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  _pieza(x, y, tam, css, html, k, op) {
    if (this.vivas >= MAX) return null;
    const p = document.createElement("i");
    p.style.cssText = `left:${x - tam / 2}px;top:${y - tam / 2}px;width:${tam}px;height:${tam}px;${css || ""}`;
    if (html) p.innerHTML = html;
    (this._dest || this.capa).append(p);
    this.vivas++;
    let fuera = false;
    const quitar = () => { if (fuera) return; fuera = true; this.vivas--; p.remove(); };
    try { const a = p.animate(k, { easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards", ...op }); a.onfinish = quitar; a.oncancel = quitar; } catch (e) { /* nada */ }
    setTimeout(quitar, (op.duration || 600) + (op.delay || 0) + 200);
    return p;
  }

  /** Una pieza que sale disparada y cae con su peso (arco), girando un poquito. */
  _confeti(cx, cy, forma, color, tam, ang, vel, dur, delay = 0) {
    const g = 0.0009, vx = Math.cos(ang) * vel, vy = Math.sin(ang) * vel, giro = azar(-200, 200);
    const pasos = [0, 0.18, 0.4, 0.65, 1].map((f) => {
      const t = f * dur;
      return { transform: `translate(${vx * t}px,${vy * t + 0.5 * g * t * t}px) rotate(${giro * f}deg) scale(${f === 0 ? 0.2 : f < 0.4 ? 1.08 : 1 - f * 0.35})`, opacity: f > 0.7 ? (1 - f) / 0.3 : 1, offset: f };
    });
    this._pieza(cx, cy, tam, `color:${color};filter:drop-shadow(0 1px 1.5px rgba(120,40,80,.18))`, FORMA[forma], pasos, { duration: dur, delay, easing: "linear" });
  }

  /** Una cinta de colores que se dibuja alrededor de la caja. */
  _cinta(b, c1, c2, dur = 420) {
    const pad = 6, w = b.w + pad * 2, h = b.h + pad * 2, r = Math.min(14, w / 4, h / 4), per = 2 * (w + h) - (8 - 2 * Math.PI) * r;
    const id = "edfxg" + (++idGrad);
    const p = this._pieza(b.x + b.w / 2, b.y + b.h / 2, 1, `width:${w}px;height:${h}px;margin:${-h / 2 + 0.5}px 0 0 ${-w / 2 + 0.5}px;overflow:visible`,
      `<svg width="${w}" height="${h}" style="overflow:visible"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="none" stroke="url(#${id})" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="${per}" stroke-dashoffset="${per}"/></svg>`,
      [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: dur + 380, easing: "linear" });
    const rect = p?.querySelector("rect");
    try { rect?.animate([{ strokeDashoffset: per }, { strokeDashoffset: 0 }], { duration: dur, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }); } catch (e) { rect?.setAttribute("stroke-dashoffset", "0"); }
  }

  /** Florcita que se abre en un punto (resorte) y se va. */
  _brote(x, y, forma, color, tam, delay = 0, giro = 0) {
    this._pieza(x, y, tam, `color:${color}`, FORMA[forma], [
      { transform: `scale(0) rotate(${giro - 40}deg)`, opacity: 1 },
      { transform: `scale(1.18) rotate(${giro + 8}deg)`, opacity: 1, offset: 0.38 },
      { transform: `scale(.94) rotate(${giro}deg)`, opacity: 1, offset: 0.58 },
      { transform: `scale(1) translateY(-6px) rotate(${giro + 10}deg)`, opacity: 0 },
    ], { duration: 720, delay, easing: "cubic-bezier(.3,.8,.3,1)" });
  }

  elegir(b, varios) {
    const k = this.nivel;
    if (!k) return;
    this._cinta(b, varios ? "#c9a6ff" : "#ff8fbf", varios ? "#8fd0ff" : "#ffc39e", 380);
    if (k < 1) return;
    const esq = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
    esq.forEach(([x, y], i) => this._brote(x, y, i % 2 ? "estrella" : "flor", varios ? elige(["#d8c2ff", "#bcd8ff"]) : elige(["#ffb3d1", "#ffd2b0", "#ffc8e6"]), i % 2 ? 9 : 11, 60 + i * 55, i * 30));
  }

  soltar(b, pego) {
    const k = this.nivel;
    this.finEstela();
    if (!k) return;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, d = Math.min(220, Math.max(b.w, b.h) * 1.15);
    const c = this._tono();
    // Una mancha de acuarela que florece debajo (borde un poco más oscuro, como el agua al secarse).
    this._pieza(cx, cy, d, `border-radius:47% 53% 56% 44% / 52% 45% 55% 48%;background:radial-gradient(circle at 50% 50%, ${c}55 0 52%, ${c}88 70%, ${c}00 74%)`, "", [
      { transform: "scale(.55) rotate(0deg)", opacity: 0.85 },
      { transform: "scale(1) rotate(8deg)", opacity: 0.55, offset: 0.45 },
      { transform: "scale(1.14) rotate(12deg)", opacity: 0 },
    ], { duration: 820, easing: "cubic-bezier(.2,.7,.3,1)" });
    // Pétalos que se posan desde el borde de abajo.
    const n = Math.round(5 * k);
    for (let i = 0; i < n; i++) {
      const lado = i % 2 ? 1 : -1;
      this._confeti(cx + lado * azar(0.1, 0.5) * b.w, b.y + b.h - 4, "petalo", elige(PASTEL), azar(7, 10), lado > 0 ? azar(-0.5, 0.2) : Math.PI - azar(-0.5, 0.2), azar(0.05, 0.11), azar(620, 900), i * 25);
    }
    if (pego) for (let i = 0; i < 3; i++) this._brote(b.x + (b.w * (i + 0.5)) / 3, b.y + (i % 2 ? b.h : 0), "estrella", "#a9d4ff", 9, i * 50);
  }

  colocar(b) {
    const k = this.nivel;
    if (!k) return;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.max(b.w, b.h);
    // Halo tibio que respira una vez.
    this._pieza(cx, cy, Math.min(280, R * 1.2), "border-radius:50%;background:radial-gradient(circle, rgba(255,214,232,.75) 0, rgba(255,196,170,.35) 45%, rgba(255,214,232,0) 70%)", "", [
      { transform: "scale(.4)", opacity: 0 }, { transform: "scale(1)", opacity: 1, offset: 0.35 }, { transform: "scale(1.2)", opacity: 0 },
    ], { duration: 700 });
    this._cinta(b, "#ff8fbf", "#ffd28f", 320);
    // Confeti cute que sube y cae.
    const n = Math.round(11 * k);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + azar(-1.25, 1.25);
      this._confeti(cx, cy, elige(["corazon", "flor", "estrella", "corazon"]), elige(PASTEL), azar(8, 13), a, azar(0.16, 0.3), azar(720, 1000), azar(0, 60));
    }
  }

  duplicar(b) {
    const k = this.nivel;
    if (!k) return;
    this._pieza(b.x + b.w / 2, b.y + b.h / 2, 1, `width:${b.w}px;height:${b.h}px;margin:${-b.h / 2 + 0.5}px 0 0 ${-b.w / 2 + 0.5}px;border-radius:12px;border:2px dashed #c4a5ff;background:rgba(214,196,255,.16)`, "", [
      { transform: "translate(-10px,-10px) scale(.92)", opacity: 0.9 }, { transform: "translate(0,0) scale(1.03)", opacity: 0.7, offset: 0.55 }, { transform: "scale(1)", opacity: 0 },
    ], { duration: 640 });
    for (let i = 0; i < Math.round(5 * k); i++) this._brote(b.x + azar(0, b.w), b.y + azar(0, b.h), i % 2 ? "estrella" : "flor", elige(["#d8c2ff", "#c3c8ff", "#f6b9e2"]), azar(8, 12), i * 45, azar(0, 90));
  }

  polvo(b) {
    const k = this.nivel;
    if (!k) return;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    // Nubecitas que se inflan y se deshacen hacia arriba.
    const n = Math.round(7 * k);
    for (let i = 0; i < n; i++) {
      const x = cx + azar(-0.4, 0.4) * b.w, y = cy + azar(-0.3, 0.3) * b.h, t = azar(18, 34);
      this._pieza(x, y, t, `border-radius:50%;background:radial-gradient(circle at 40% 35%, #fff 0, ${elige(["#ffe1ee", "#f3e6ff", "#fff1e3"])} 55%, rgba(255,255,255,0) 72%)`, "", [
        { transform: "translate(0,0) scale(.3)", opacity: 0.95 },
        { transform: `translate(${azar(-14, 14)}px,${azar(-18, -6)}px) scale(1.1)`, opacity: 0.8, offset: 0.4 },
        { transform: `translate(${azar(-20, 20)}px,${azar(-40, -22)}px) scale(1.35)`, opacity: 0 },
      ], { duration: azar(560, 760), delay: i * 22 });
    }
    for (let i = 0; i < Math.round(4 * k); i++) this._confeti(cx + azar(-0.3, 0.3) * b.w, cy, "petalo", elige(PASTEL), azar(6, 9), azar(0.3, Math.PI - 0.3), azar(0.03, 0.07), azar(700, 950), 80 + i * 40);
  }

  // ─────────────────────────────── La estela de acuarela ───────────────────────────────
  // Una cinta continua que pasa EXACTO por donde pasó el centro de lo que arrastras (también si el
  // imán lo pegó a una guía): sale de detrás del objeto, se afila hacia la cola y se seca sola.
  _tono() { return PASTEL[Math.floor((this._h || 0) / 2) % PASTEL.length]; }

  _lienzo() {
    const vista = this.app.lienzo.vistaEl;
    let c = this._cv;
    if (!c || !c.isConnected) {
      c = this._cv = document.createElement("canvas");
      c.className = "ed-fx-estela";
      c.setAttribute("aria-hidden", "true");
      // Encima de la hoja pero debajo del marco y las manijas.
      vista.insertBefore(c, this.app.lienzo.sobre || this.capa);
      this._g = c.getContext("2d");
      this._granoP = null;
    }
    const dpr = Math.min(2, devicePixelRatio || 1), w = vista.clientWidth, h = vista.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    this._dpr = dpr;
    return c;
  }

  /** El granito del papel (hecho una sola vez): se le quita a la pintura para que se vea de acuarela. */
  _grano() {
    if (this._granoP) return this._granoP;
    const s = document.createElement("canvas");
    s.width = s.height = 96;
    const g = s.getContext("2d");
    for (let i = 0; i < 520; i++) { g.fillStyle = `rgba(0,0,0,${(Math.random() * 0.55).toFixed(2)})`; g.fillRect(Math.random() * 96, Math.random() * 96, 1.4, 1.4); }
    return (this._granoP = this._g.createPattern(s, "repeat"));
  }

  /** Llamado en cada movimiento al arrastrar, con la caja en pantalla (ya movida y pegada). */
  estela(b) {
    const k = this.nivel;
    if (!k) return;
    const ahora = performance.now(), x = b.x + b.w / 2, y = b.y + b.h / 2;
    this._obj = b;
    let ci = this._viva;
    const u = ci?.pts[ci.pts.length - 1];
    if (!ci || !u || ahora - u.t > 260) {
      // Un trazo nuevo, con su par de tonos (cambian de un arrastre al otro) y su ancho según el objeto.
      this._h = ((this._h || 0) + 2) % (PINTURA.length * 2);
      const i = Math.floor(this._h / 2) % PINTURA.length;
      ci = this._viva = { pts: [{ x, y, t: ahora, v: 0 }], a: PINTURA[i], b: PINTURA[(i + 2) % PINTURA.length], W: Math.max(10, Math.min(64, Math.min(b.w, b.h) * 0.55)) * (k < 1 ? 0.8 : 1), gotas: [] };
      this.st.push(ci);
      this._viaje = 0;
      return;
    }
    const d = Math.hypot(x - u.x, y - u.y);
    if (d < 0.75) return;
    const vel = d / Math.max(8, ahora - u.t);
    ci.pts.push({ x, y, t: ahora, v: u.v * 0.6 + vel * 0.4 });
    if (ci.pts.length > 160) ci.pts.splice(0, ci.pts.length - 160);
    // Unas pocas gotitas que salpican a los lados cuando va rápido.
    if (k >= 1 && vel > 1.2 && Math.random() < 0.1) {
      const lado = Math.random() < 0.5 ? -1 : 1, nx = -(y - u.y) / d, ny = (x - u.x) / d, a = ci.W * azar(0.6, 0.95);
      ci.gotas.push({ x: u.x + nx * lado * a, y: u.y + ny * lado * a, r: ci.W * azar(0.05, 0.1), t: ahora });
    }
    this._lienzo();
    // El roce del pincel: de vez en cuando y más fuerte cuanto más rápido (nunca metralleta).
    this._viaje = (this._viaje || 0) + d;
    if (this._viaje > 230 && ahora - (this._tRoce || 0) > 280) {
      this._viaje = 0; this._tRoce = ahora;
      this.app.sonidos?.sonar("pincel", { vol: Math.max(0.35, Math.min(1, 0.3 + vel * 0.45)), tono: Math.max(0.9, Math.min(1.18, 0.92 + vel * 0.08)) });
    }
    if (!this._raf) this._raf = requestAnimationFrame(this._pintar);
  }

  finEstela() { this._viva = null; }

  /** Los puntos, suavizados con una curva que pasa por todos (Catmull-Rom): ni esquinas ni huecos. */
  _suave(p) {
    if (p.length < 3) return p;
    const r = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
      const pasos = Math.max(1, Math.min(6, Math.ceil(Math.hypot(c.x - b.x, c.y - b.y) / 7)));
      for (let s = 1; s <= pasos; s++) {
        const t = s / pasos, t2 = t * t, t3 = t2 * t;
        r.push({
          x: 0.5 * (2 * b.x + (-a.x + c.x) * t + (2 * a.x - 5 * b.x + 4 * c.x - d.x) * t2 + (-a.x + 3 * b.x - 3 * c.x + d.x) * t3),
          y: 0.5 * (2 * b.y + (-a.y + c.y) * t + (2 * a.y - 5 * b.y + 4 * c.y - d.y) * t2 + (-a.y + 3 * b.y - 3 * c.y + d.y) * t3),
          t: b.t + (c.t - b.t) * t, v: b.v + (c.v - b.v) * t,
        });
      }
    }
    return r;
  }

  /** El contorno de la cinta (ancho `k` veces el suyo) como un camino de bordes suaves. */
  _contorno(g, P, anchos, k) {
    const izq = [], der = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y;
      const l = Math.hypot(tx, ty) || 1, hw = anchos[i] * k;
      tx /= l; ty /= l;
      izq.push([P[i].x - ty * hw, P[i].y + tx * hw]);
      der.push([P[i].x + ty * hw, P[i].y - tx * hw]);
    }
    const lado = (l, primero) => {
      if (primero) g.moveTo(l[0][0], l[0][1]); else g.lineTo(l[0][0], l[0][1]);
      for (let i = 1; i < l.length - 1; i++) g.quadraticCurveTo(l[i][0], l[i][1], (l[i][0] + l[i + 1][0]) / 2, (l[i][1] + l[i + 1][1]) / 2);
      g.lineTo(l[l.length - 1][0], l[l.length - 1][1]);
    };
    g.beginPath();
    lado(izq, true);
    lado(der.reverse(), false);
    g.closePath();
  }

  /** Una cinta: velo ancho, centro más intenso, el borde de agua y el granito de papel. */
  _trazo(g, ci, ahora, vida) {
    const vivos = ci.pts.filter((p) => ahora - p.t < vida);
    const cab = vivos[vivos.length - 1];
    if (vivos.length >= 2) {
      const P = this._suave(vivos);
      // Junto al objeto, el ancho completo; hacia la cola (lo más viejo) se afila. Más rápido, un poquito más ancho.
      const anchos = P.map((p) => (ci.W / 2) * Math.pow(Math.max(0, 1 - (ahora - p.t) / vida), 0.55) * (0.82 + 0.28 * Math.min(1, p.v / 1.4)));
      const f = 1 - Math.pow(Math.min(1, (ahora - cab.t) / vida), 2);
      const gr = g.createLinearGradient(P[0].x, P[0].y, cab.x, cab.y);
      gr.addColorStop(0, ci.b);
      gr.addColorStop(1, ci.a);
      g.fillStyle = gr;
      this._contorno(g, P, anchos, 1.3);
      g.globalAlpha = 0.24 * f;
      g.fill();
      this._contorno(g, P, anchos, 1);
      g.globalAlpha = 0.44 * f;
      g.fill();
      // El borde de agua: la acuarela se oscurece un pelito donde se seca.
      g.strokeStyle = gr;
      g.lineWidth = 1.1;
      g.globalAlpha = 0.36 * f;
      g.stroke();
      // El granito del papel.
      g.globalCompositeOperation = "destination-out";
      g.globalAlpha = 0.5;
      g.fillStyle = this._grano();
      this._contorno(g, P, anchos, 1.3);
      g.fill();
      g.globalCompositeOperation = "source-over";
    }
    for (const o of ci.gotas) {
      const e = (ahora - o.t) / vida;
      if (e >= 1) continue;
      g.globalAlpha = 0.55 * (1 - e);
      g.fillStyle = ci.a;
      g.beginPath();
      g.arc(o.x, o.y, o.r * (1 + e * 0.25), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  _pintar = () => {
    const c = this._cv, g = this._g;
    if (!c || !g) { this._raf = 0; return; }
    const ahora = performance.now(), vida = this.nivel < 1 ? 650 : 1050, dpr = this._dpr || 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Se quedan las cintas que todavía tienen algo fresco (la de ahorita, siempre).
    this.st = this.st.filter((ci) => ci === this._viva || ahora - ci.pts[ci.pts.length - 1].t < vida);
    for (const ci of this.st) this._trazo(g, ci, ahora, vida);
    // Lo que está encima de la pintura (el objeto) queda limpio.
    const o = this._obj;
    if (o && this.st.length) {
      g.globalCompositeOperation = "destination-out";
      g.globalAlpha = 1;
      g.fillStyle = "#000"; // sólido: borra todo lo que quede debajo del objeto
      const m = Math.min(o.w, o.h) * 0.04, r = Math.min(12, o.w / 4, o.h / 4);
      g.beginPath();
      if (g.roundRect) g.roundRect(o.x + m, o.y + m, o.w - 2 * m, o.h - 2 * m, r); else g.rect(o.x + m, o.y + m, o.w - 2 * m, o.h - 2 * m);
      g.fill();
      g.globalCompositeOperation = "source-over";
    }
    const frescas = this.st.some((ci) => ahora - ci.pts[ci.pts.length - 1].t < vida);
    if (frescas) this._raf = requestAnimationFrame(this._pintar);
    else { this.st.length = 0; this._raf = 0; this._obj = null; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); }
  };

  // ─────────────────────────────── El globito del zoom ───────────────────────────────
  zoom(z, cx, cy, acerca) {
    const vista = this.app.lienzo.vistaEl;
    let p = this._globo;
    if (!p || !p.isConnected) {
      p = this._globo = document.createElement("div");
      p.className = "ed-fx-zoom";
      p.setAttribute("aria-hidden", "true");
      p.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5l5 5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path class="mas" d="M10.5 7.6v5.8M7.6 10.5h5.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><b></b>';
      vista.append(p);
    }
    const t = Math.round(z * 100) + " %", bt = p.querySelector("b");
    if (bt.textContent !== t) bt.textContent = t;
    const w = vista.clientWidth, h = vista.clientHeight;
    p.style.left = Math.max(56, Math.min(w - 56, cx)) + "px";
    p.style.top = Math.max(36, Math.min(h - 36, cy - 74)) + "px";
    p.classList.toggle("aleja", !acerca);
    const mas = p.querySelector(".mas"), dm = acerca ? "M10.5 7.6v5.8M7.6 10.5h5.8" : "M7.6 10.5h5.8";
    if (mas.getAttribute("d") !== dm) mas.setAttribute("d", dm);
    p.classList.add("ver");
    if (this.nivel && performance.now() - (this._tGolpe || 0) > 140) {
      this._tGolpe = performance.now();
      try { bt.animate([{ transform: "scale(1)" }, { transform: `scale(${acerca ? 1.14 : 0.9})` }, { transform: "scale(1)" }], { duration: 220, easing: "cubic-bezier(.3,.8,.3,1)" }); } catch (e) { /* nada */ }
    }
    clearTimeout(this._tGlobo);
    this._tGlobo = setTimeout(() => p.classList.remove("ver"), 850);
  }
}
