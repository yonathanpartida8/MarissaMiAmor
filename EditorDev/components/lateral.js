/**
 * LA BARRA LATERAL — el riel de categorías y su panel, a la izquierda.
 *
 * En la computadora (pantalla ancha) van fijos y el panel se pliega.
 * En el teléfono y la tableta es un cajón como el de una app:
 *   · se abre deslizando desde el borde izquierdo, tocando la pestañita o el
 *     botón de arriba; se cierra deslizándolo hacia la izquierda, tocando
 *     fuera (el velo) o el botón ✕;
 *   · mientras se arrastra, el cajón SIGUE AL DEDO (no aparece de golpe) y al
 *     soltar termina de abrirse o de cerrarse según la velocidad y la mitad;
 *   · lo de dentro sigue desplazándose de arriba a abajo: sólo un gesto
 *     claramente horizontal mueve el cajón (los deslizadores y campos de
 *     texto no lo mueven nunca).
 */
import { esMovil } from "./ui.js";
import { vibrar } from "../canvas/gestos.js";

const NO_ARRASTRA = "input, textarea, select, [contenteditable='true'], .ed-rango, .ed-seg, .ed-tl, iframe, .ed-asa, .ed-capas li, .ed-paginas li";

export class Lateral {
  constructor({ raiz, velo, borde, asa, alCambiar }) {
    this.raiz = raiz;
    this.velo = velo;
    this.borde = borde;
    this.asa = asa;
    this.alCambiar = alCambiar;
    this.abierto = false;
    this._g = null;
    this._enlazar();
  }

  get compacto() { return esMovil(); }
  get ancho() { return this.raiz.offsetWidth || 320; }

  /** `t` = cuánto se ve (0 cerrado … ancho abierto). */
  _poner(t, anim) {
    const w = this.ancho;
    t = Math.max(0, Math.min(w, t));
    this.raiz.classList.toggle("anim", !!anim);
    this.velo.classList.toggle("anim", !!anim);
    this.raiz.style.transform = `translate3d(${t - w}px, 0, 0)`;
    this.velo.style.opacity = String((t / w) * 0.42);
    this.velo.style.pointerEvents = t > 2 ? "auto" : "none";
    this.raiz.style.visibility = t > 0 || anim ? "visible" : "hidden";
  }

  abrir() {
    if (!this.compacto) { document.body.classList.remove("sin-panel"); return; }
    const antes = this.abierto;
    this.abierto = true;
    document.body.classList.add("lateral-abierto");
    this._poner(this.ancho, true);
    if (!antes) this.alCambiar?.(true);
  }

  cerrar() {
    if (!this.compacto) return;
    const antes = this.abierto;
    this.abierto = false;
    document.body.classList.remove("lateral-abierto");
    this._poner(0, true);
    if (antes) this.alCambiar?.(false);
  }

  alternar() { if (this.abierto) this.cerrar(); else this.abrir(); }

  /** Al cambiar de computadora a teléfono (o girar la tableta) se acomoda solo. */
  reacomodar() {
    if (this.compacto) this._poner(this.abierto ? this.ancho : 0, false);
    else {
      this.raiz.style.transform = "";
      this.raiz.style.visibility = "";
      this.velo.style.opacity = "";
      this.velo.style.pointerEvents = "none";
      document.body.classList.remove("lateral-abierto");
    }
  }

  _enlazar() {
    const empezar = (ev, desde) => {
      if (!this.compacto || ev.button > 0) return;
      if (desde === "dentro" && ev.target.closest(NO_ARRASTRA)) return;
      this._g = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, t0: performance.now(), base: this.abierto ? this.ancho : 0, desde, decidido: desde !== "dentro", vx: 0, ux: ev.clientX, ut: performance.now() };
      if (this._g.decidido) { try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ } }
    };
    const mover = (ev) => {
      const g = this._g;
      if (!g || g.id !== ev.pointerId) return;
      const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
      if (!g.decidido) {
        // Dentro del cajón: sólo un gesto claramente de lado lo mueve.
        if (Math.hypot(dx, dy) < 10) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.3) { this._g = null; return; }
        g.decidido = true;
        try { this.raiz.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
      }
      g.movio = g.movio || Math.abs(dx) > 4;
      const t = performance.now();
      if (t > g.ut) { g.vx = 0.7 * g.vx + 0.3 * ((ev.clientX - g.ux) / (t - g.ut)); g.ux = ev.clientX; g.ut = t; }
      cancelAnimationFrame(this._rf);
      this._rf = requestAnimationFrame(() => this._poner(g.base + dx, false));
      ev.preventDefault();
    };
    const soltar = (ev) => {
      const g = this._g;
      if (!g || g.id !== ev.pointerId) return;
      this._g = null;
      cancelAnimationFrame(this._rf);
      if (!g.decidido) return;
      if (!g.movio) {
        // Un toque: la pestañita abre, el velo cierra.
        if (g.desde === "velo") this.cerrar();
        else if (g.desde === "borde" || g.desde === "asa") this.abrir();
        return;
      }
      const dx = ev.clientX - g.x0;
      const visible = g.base + dx;
      const abrir = g.vx > 0.35 ? true : g.vx < -0.35 ? false : visible > this.ancho / 2;
      if (abrir !== this.abierto) vibrar(6);
      if (abrir) this.abrir(); else this.cerrar();
    };
    for (const [n, desde] of [[this.borde, "borde"], [this.asa, "asa"], [this.velo, "velo"], [this.raiz, "dentro"]]) {
      n.addEventListener("pointerdown", (ev) => empezar(ev, desde));
      n.addEventListener("pointermove", mover);
      n.addEventListener("pointerup", soltar);
      n.addEventListener("pointercancel", soltar);
    }
    // El botón de la pestañita también funciona con teclado.
    this.asa.addEventListener("click", (ev) => { if (ev.detail === 0) this.abrir(); });
    addEventListener("keydown", (ev) => { if (ev.key === "Escape" && this.abierto && !document.querySelector(".ed-modal-fondo, .ed-pop, .ed-menu")) this.cerrar(); });
    let antes = this.compacto;
    matchMedia("(max-width: 1023px), (max-height: 560px)").addEventListener("change", () => {
      const ahora = this.compacto;
      if (ahora !== antes) { antes = ahora; this.abierto = false; }
      this.reacomodar();
    });
    this.reacomodar();
  }
}
