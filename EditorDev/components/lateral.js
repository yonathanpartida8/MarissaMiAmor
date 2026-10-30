/**
 * LA BARRA LATERAL — el riel de categorías y su panel, a la izquierda.
 *
 * En la computadora (pantalla ancha) van fijos y el panel se pliega.
 * En el teléfono y la tableta (Fase 44) el riel y su panel son UN cajón escondido: sólo se ve la
 * pestañita de la izquierda; el cajón es como el de una app:
 *   · se abre tocando una herramienta del riel, deslizándolo a la derecha o con
 *     la PESTAÑITA (Fase 42: volvió) que va pegada a su orilla: tócala o jálala;
 *     se cierra deslizándolo a la izquierda, tocando fuera (el velo), el botón ✕
 *     o la pestañita otra vez (ella viaja en la orilla del cajón);
 *   · mientras se arrastra, el cajón SIGUE AL DEDO (no aparece de golpe) y al
 *     soltar termina de abrirse o de cerrarse según la velocidad y la mitad;
 *   · lo de dentro sigue desplazándose de arriba a abajo: sólo un gesto
 *     claramente horizontal mueve el cajón (los deslizadores y campos de
 *     texto no lo mueven nunca).
 */
import { esMovil, COMPACTO } from "./ui.js";
import { vibrar } from "../canvas/gestos.js";

const NO_ARRASTRA = "input, textarea, select, [contenteditable='true'], .ed-rango, .ed-seg, .ed-tl, iframe, .ed-asa, .ed-capas li, .ed-paginas li";

export class Lateral {
  constructor({ raiz, riel, velo, asa = null, alAsa = null, alCambiar }) {
    this.raiz = raiz;
    this.riel = riel;
    this.velo = velo;
    this.asa = asa;
    this.alAsa = alAsa; // ("preparar" antes de jalarla, "tocar" al tocarla)
    this.alCambiar = alCambiar;
    this.abierto = false;
    this._g = null;
    // Su ancho, guardado: medirlo al abrir (con el panel recién llenado) forzaba
    // a calcular todo de golpe y el deslizamiento arrancaba con un tirón.
    this._w = 0;
    // (Si cambia de ancho cerrado —p. ej. al entrar al modo profesional—, se vuelve a esconder entero.)
    new ResizeObserver(() => { this._w = this.raiz.offsetWidth; if (this.compacto && !this.abierto) this._poner(0, false); }).observe(this.raiz);
    this._enlazar();
  }

  get compacto() { return esMovil(); }
  get ancho() { return this._w || this.raiz.offsetWidth || 320; }


  /** `t` = cuánto se ve (0 cerrado … ancho abierto). */
  _poner(t, anim) {
    const w = this.ancho, m = 0;
    t = Math.max(m, Math.min(w, t));
    this.raiz.classList.toggle("anim", !!anim);
    this.velo.classList.toggle("anim", !!anim);
    this.raiz.style.transform = `translate3d(${t - w}px, 0, 0)`;
    this.velo.style.opacity = String(((t - m) / Math.max(1, w - m)) * 0.2);
    this.velo.style.pointerEvents = t > m + 2 ? "auto" : "none";
    this.raiz.style.visibility = t > 0 || anim ? "visible" : "hidden";
    // Al terminar de cerrarse queda escondido DEL TODO (ni su sombra se asoma en la orilla).
    clearTimeout(this._tEsconder);
    if (t <= 0 && anim) this._tEsconder = setTimeout(() => { if (!this.abierto && !this._g && this.compacto) this.raiz.style.visibility = "hidden"; }, 420);
    // La pestañita va en la orilla del cajón (lo sigue mientras se jala).
    if (this.asa) { this.asa.classList.toggle("anim", !!anim); this.asa.style.transform = t > 0 ? `translate3d(${t}px, 0, 0)` : ""; this.asa.classList.toggle("abierta", t > w / 2); }
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
      if (this.asa) { this.asa.style.transform = ""; this.asa.classList.remove("abierta", "anim"); }
      this.velo.style.opacity = "";
      this.velo.style.pointerEvents = "none";
      document.body.classList.remove("lateral-abierto");
    }
  }

  /** ¿El dedo está sobre algo que se desplaza de lado (fichas, ideas, galerías)? Entonces no cierra el cajón. */
  _desplazaDeLado(n) {
    for (let x = n; x && x !== document.body; x = x.parentElement) {
      if (x.scrollWidth > x.clientWidth + 2) { const o = getComputedStyle(x).overflowX; if (o === "auto" || o === "scroll") return true; }
      if (x.classList?.contains("ed-lateral") || x.classList?.contains("ed-panel")) break;
    }
    return false;
  }

  _enlazar() {
    const empezar = (ev, desde) => {
      if (!this.compacto || ev.button > 0) return;
      if (desde === "dentro" && (ev.target.closest(NO_ARRASTRA) || this._desplazaDeLado(ev.target))) return;
      // Jalar la pestañita: el panel ya tiene que estar lleno (si no, el cajón saldría vacío).
      if (desde === "asa" && !this.abierto) this.alAsa?.("preparar");
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
      // (Un toquecito con el dedo siempre tiembla unos píxeles: hasta 10 sigue siendo un toque.)
      g.movio = g.movio || Math.abs(dx) > 10;
      if (!g.movio) return;
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
        // Un toque en el velo cierra; en la pestañita, abre o cierra.
        if (g.desde === "velo") this.cerrar();
        else if (g.desde === "asa") { vibrar(6); this.alAsa?.("tocar"); }
        return;
      }
      const dx = ev.clientX - g.x0;
      const visible = g.base + dx;
      const abrir = g.vx > 0.35 ? true : g.vx < -0.35 ? false : visible > this.ancho / 2;
      if (abrir !== this.abierto) vibrar(6);
      if (abrir) this.abrir(); else this.cerrar();
    };
    // (Deslizar el riel a la derecha también abre el panel.)
    // (Si el riel va dentro del cajón —Fase 44—, sus toques ya llegan al cajón: no se escuchan dos veces.)
    for (const [n, desde] of [[this.velo, "velo"], [this.raiz, "dentro"], [this.riel, "dentro"], [this.asa, "asa"]].filter(([n]) => n && (n === this.raiz || !this.raiz.contains(n)))) {
      n.addEventListener("pointerdown", (ev) => empezar(ev, desde));
      n.addEventListener("pointermove", mover);
      n.addEventListener("pointerup", soltar);
      n.addEventListener("pointercancel", soltar);
    }
    // En la compu (pliega o despliega el panel) y con teclado, la pestañita es un botón normal.
    this.asa?.addEventListener("click", (ev) => { if (!this.compacto || ev.detail === 0) this.alAsa?.("tocar"); });
    addEventListener("keydown", (ev) => { if (ev.key === "Escape" && this.abierto && !document.querySelector(".ed-modal-fondo, .ed-pop, .ed-menu")) this.cerrar(); });
    let antes = this.compacto;
    matchMedia(COMPACTO).addEventListener("change", () => {
      const ahora = this.compacto;
      if (ahora !== antes) { antes = ahora; this.abierto = false; }
      this.reacomodar();
    });
    this.reacomodar();
  }
}
