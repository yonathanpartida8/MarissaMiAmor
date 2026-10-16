/**
 * EFECTITOS DEL EDITOR — que se sienta vivo al trabajar, sin estorbar.
 *
 *   elegir      un anillo de luz que se abre y unos destellos en las esquinas
 *   soltar      una ondita donde quedó (y las guías del imán brillan si pegó)
 *   colocar     lo nuevo llega con un «pop» de brillitos
 *   duplicar    destellos que van de la copia original a la nueva
 *   borrar      se deshace en un puñito de polvo
 *
 * Van en una capa encima de la hoja que NUNCA recibe toques (pointer-events:
 * none), sólo con transform/opacidad (las mueve la tarjeta gráfica) y con un
 * tope de piezas. Respetan «Partículas» y «Movimiento» de la configuración
 * y suenan a la vez que se ven (audio/sonidos-editor.js).
 */
import { PREF } from "../config/preferencias.js";

const RT = window.LibritoRT;
const MAX = 60;
const ESTRELLA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor"/></svg>';

export class FxEditor {
  constructor(app) {
    this.app = app;
    this.vivas = 0;
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
      if (k && k !== antes && !L.g && !L.gestoActivo) requestAnimationFrame(() => { const b = this._union(E.sel); if (b) this.elegir(b); });
      antes = k;
    });
    E.on("actual", () => { this.capa.textContent = ""; this.vivas = 0; });
  }

  get nivel() {
    if (PREF.movimiento === "nada" || PREF.particulas === false || RT.menosMovimiento?.()) return 0;
    return PREF.movimiento === "reducido" ? 0.5 : 1;
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
  _enEl(id, que) { const b = this._caja(id); if (b) (que === "duplicar" ? this.duplicar(b) : this.colocar(b)); }

  _pieza(x, y, tam, css, html, k, op) {
    if (this.vivas >= MAX) return;
    const p = document.createElement("i");
    p.style.cssText = `left:${x - tam / 2}px;top:${y - tam / 2}px;width:${tam}px;height:${tam}px;${css || ""}`;
    if (html) p.innerHTML = html;
    this.capa.append(p);
    this.vivas++;
    let fuera = false;
    const quitar = () => { if (fuera) return; fuera = true; this.vivas--; p.remove(); };
    try { const a = p.animate(k, { easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards", ...op }); a.onfinish = quitar; a.oncancel = quitar; } catch (e) { /* nada */ }
    setTimeout(quitar, (op.duration || 600) + (op.delay || 0) + 200);
  }

  _destellos(cx, cy, n, R, color, dur = 650) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, d = R * (0.7 + Math.random() * 0.5), t = 6 + Math.random() * 6;
      this._pieza(cx, cy, t, `color:${i % 2 ? "#fff6d0" : color};filter:drop-shadow(0 0 3px ${color})`, ESTRELLA, [
        { transform: "translate(0,0) scale(0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1) rotate(140deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${Math.cos(a) * d * 1.1}px,${Math.sin(a) * d * 1.1}px) scale(0) rotate(220deg)`, opacity: 0 },
      ], { duration: dur * (0.85 + Math.random() * 0.3) });
    }
  }

  _anillo(b, color, desde = 0.92, hasta = 1.12, dur = 520) {
    this._pieza(b.x + b.w / 2, b.y + b.h / 2, 1, `width:${b.w}px;height:${b.h}px;margin:${-b.h / 2 + 0.5}px 0 0 ${-b.w / 2 + 0.5}px;border-radius:10px;border:2px solid ${color};box-shadow:0 0 14px ${color},inset 0 0 10px ${color}`, "", [
      { transform: `scale(${desde})`, opacity: 0.85 },
      { transform: `scale(${hasta})`, opacity: 0 },
    ], { duration: dur });
  }

  elegir(b) {
    const k = this.nivel;
    if (!k) return;
    this._anillo(b, "rgba(232,93,154,.75)", 0.96, 1.08, 480);
    if (k < 1) return;
    // Un destellito en dos esquinas opuestas.
    for (const [x, y, r] of [[b.x, b.y, 0], [b.x + b.w, b.y + b.h, 120]]) {
      this._pieza(x, y, 12, "color:#ffd6ec;filter:drop-shadow(0 0 4px #ff7fae)", ESTRELLA, [
        { transform: `scale(0) rotate(${r}deg)`, opacity: 1 }, { transform: `scale(1) rotate(${r + 90}deg)`, opacity: 1, offset: 0.5 }, { transform: `scale(0) rotate(${r + 180}deg)`, opacity: 0 },
      ], { duration: 560 });
    }
  }

  soltar(b, pego) {
    const k = this.nivel;
    if (!k) return;
    const d = Math.max(b.w, b.h);
    this._pieza(b.x + b.w / 2, b.y + b.h / 2, d, "border-radius:50%;border:2px solid rgba(232,93,154,.55)", "", [{ transform: "scale(.6)", opacity: 0.7 }, { transform: "scale(1.25)", opacity: 0 }], { duration: 420 });
    if (pego) this._anillo(b, "rgba(47,140,255,.7)", 1, 1.04, 380);
  }

  colocar(b) {
    const k = this.nivel;
    if (!k) return;
    this._anillo(b, "rgba(255,127,174,.8)", 0.8, 1.1, 560);
    this._destellos(b.x + b.w / 2, b.y + b.h / 2, Math.round(8 * k), Math.max(b.w, b.h) * 0.6, "#ff7fae");
  }

  duplicar(b) {
    const k = this.nivel;
    if (!k) return;
    this._anillo(b, "rgba(139,92,240,.8)", 0.9, 1.08, 520);
    this._destellos(b.x + b.w / 2, b.y + b.h / 2, Math.round(6 * k), Math.max(b.w, b.h) * 0.5, "#b79cff", 560);
  }

  polvo(b) {
    const k = this.nivel;
    if (!k) return;
    const n = Math.round(12 * k);
    for (let i = 0; i < n; i++) {
      const x = b.x + Math.random() * b.w, y = b.y + Math.random() * b.h, t = 3 + Math.random() * 4;
      this._pieza(x, y, t, `border-radius:50%;background:${i % 3 ? "#d9c3d0" : "#ff9cc2"}`, "", [
        { transform: "translate(0,0) scale(1)", opacity: 0.9 },
        { transform: `translate(${(Math.random() - 0.5) * 40}px,${-20 - Math.random() * 40}px) scale(.2)`, opacity: 0 },
      ], { duration: 520 + Math.random() * 300 });
    }
  }
}
