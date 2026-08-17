/**
 * EDGENAV — la salida de emergencia del libro.
 *
 * ── El problema ────────────────────────────────────────────────────────
 * Casi todas las páginas se quedan el dedo: la máquina de escribir, el
 * candado, el mosaico, el campo de recuerdos, las que se sostienen sin
 * soltar… Todas declaran `exclusive` y cortan el evento antes de que llegue
 * al libro. Eso está bien —si no, arrastrar una polaroid pasaría de página—
 * pero deja un agujero enorme: en esas páginas el dedo queda ATRAPADO y no
 * hay forma de pasar hoja arrastrando.
 *
 * ── La solución ────────────────────────────────────────────────────────
 * Dos franjas invisibles en los bordes de la pantalla, reservadas para el
 * libro. Lo importante es CÓMO escuchan: en fase de captura sobre `window`.
 * La captura baja desde la raíz hasta el objetivo, así que este reconocedor
 * ve el `pointerdown` ANTES de que ninguna página pueda cortarlo. No hay
 * página, presente ni futura, que pueda dejarla encerrada.
 *
 * Y como no ponemos ningún elemento por encima, la página sigue recibiendo
 * el gesto igual que antes: no se le quita nada a nadie.
 *
 * ── El gesto ───────────────────────────────────────────────────────────
 * Empieza pegado a un borde, se arrastra en horizontal y la hoja acompaña
 * al dedo con una flecha que crece. Al pasar el punto de no retorno, un
 * pequeño toque háptico avisa de que ya está: al soltar, cambia la página.
 */

import { el } from "../utils/dom.js";
import { clamp01 } from "../utils/math.js";
import { Gestures } from "../core/Gestures.js";

/** Anchura de la zona sensible. Generosa con el pulgar, discreta con la página. */
const EDGE_MIN = 24;
const EDGE_MAX = 44;

/** Cuánto hay que arrastrar para que cuente. */
const COMMIT_RATIO = 0.2; // del ancho de pantalla
const COMMIT_MIN = 62; // px, para pantallas muy estrechas
const FLICK_SPEED = 0.45; // px/ms: un golpe rápido vale aunque sea corto

export class EdgeNav {
  constructor(ctx) {
    this.ctx = ctx;
    this.drag = null;
    this.armed = false;
    this.hintsShown = 0;
  }

  build() {
    this.root = el("div.edges", { "aria-hidden": "true" }, [
      el("div.edge.edge--prev", {}, [el("span.edge__arrow", { text: "‹" })]),
      el("div.edge.edge--next", {}, [el("span.edge__arrow", { text: "›" })]),
    ]);
    this.prevEl = this.root.querySelector(".edge--prev");
    this.nextEl = this.root.querySelector(".edge--next");

    // Captura sobre window: nadie puede cortarnos el paso.
    const opts = { capture: true, passive: false };
    window.addEventListener("pointerdown", this.#onDown, opts);
    window.addEventListener("pointermove", this.#onMove, opts);
    window.addEventListener("pointerup", this.#onUp, opts);
    window.addEventListener("pointercancel", this.#onUp, opts);

    return this.root;
  }

  get #edgeWidth() {
    return Math.min(EDGE_MAX, Math.max(EDGE_MIN, window.innerWidth * 0.07));
  }

  #onDown = (e) => {
    // Un dedo nuevo cancela cualquier reserva antigua sobre ese mismo id.
    // Sin esto, un `pointerup` que no llega (el dedo sale de la ventana, la
    // pestaña pierde el foco) dejaría el dedo reservado para siempre y con
    // él el libro entero sordo a los gestos.
    Gestures.release(e.pointerId);

    if (this.drag) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const router = this.ctx.router;
    if (!router || router.busy || router.locked) return;

    // Si está tocando la interfaz (barra, índice, botones), no es asunto nuestro.
    if (e.target?.closest?.(".bar, .toc, .toast, button")) return;

    const w = this.#edgeWidth;
    const fromLeft = e.clientX <= w;
    const fromRight = e.clientX >= window.innerWidth - w;
    if (!fromLeft && !fromRight) return;

    this.drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      side: fromLeft ? "left" : "right",
      time: performance.now(),
      lastX: e.clientX,
      lastTime: performance.now(),
      vx: 0,
      live: false,
      dir: null,
      past: false,
    };
  };

  #onMove = (e) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;

    const now = performance.now();
    const dt = Math.max(1, now - d.lastTime);
    d.vx = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastTime = now;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.live) {
      // Si el libro ya ha cogido el gesto por su cuenta, esta página NO tiene
      // atrapado el dedo y aquí no pintamos nada: dos navegadores sobre el
      // mismo dedo pasarían dos páginas de una vez.
      if (this.ctx.router.drag) {
        this.drag = null;
        return;
      }

      // Sólo nos quedamos el gesto si es claramente horizontal y va hacia
      // dentro de la pantalla. Un desliz vertical sigue siendo de la página.
      if (Math.abs(dx) < 16) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.3) {
        this.drag = null; // era vertical: se lo devolvemos a la página
        return;
      }
      const inward = d.side === "left" ? dx > 0 : dx < 0;
      if (!inward) {
        this.drag = null;
        return;
      }

      const dir = dx < 0 ? "next" : "prev";
      const router = this.ctx.router;
      if ((dir === "next" && router.atEnd) || (dir === "prev" && router.atStart)) {
        this.drag = null;
        return;
      }

      d.live = true;
      d.dir = dir;
      // A partir de aquí el dedo es del libro: la página lo suelta.
      Gestures.claim(d.id);
      this.root.classList.add("is-pulling");
      (dir === "next" ? this.nextEl : this.prevEl).classList.add("is-pulling");
      this.ctx.haptics.play("tick");
    }

    // Ya es nuestro: que nadie más haga scroll ni recargue.
    if (e.cancelable) e.preventDefault();

    const threshold = Math.max(COMMIT_MIN, window.innerWidth * COMMIT_RATIO);
    const pull = clamp01(Math.abs(dx) / threshold);
    const target = d.dir === "next" ? this.nextEl : this.prevEl;
    target.style.setProperty("--pull", pull.toFixed(3));

    // El punto de no retorno se anuncia con el pulgar, no con la vista.
    const past = pull >= 1;
    if (past !== d.past) {
      d.past = past;
      target.classList.toggle("is-ready", past);
      if (past) this.ctx.haptics.play("tap");
    }
  };

  #onUp = (e) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    Gestures.release(d.id);
    if (!d.live) return;

    this.#relax();

    const flicked =
      Math.abs(d.vx) > FLICK_SPEED && (d.dir === "next" ? d.vx < 0 : d.vx > 0);

    if (d.past || flicked) this.ctx.router[d.dir]();
  };

  #relax() {
    this.root.classList.remove("is-pulling");
    for (const node of [this.prevEl, this.nextEl]) {
      node.classList.remove("is-pulling", "is-ready");
      node.style.setProperty("--pull", "0");
    }
  }

  /**
   * Enseña las flechas un momento.
   *
   * Se llama al llegar a una página que se queda el dedo, y sólo las primeras
   * veces: una vez que sabe que los bordes están ahí, recordárselo en cada
   * página sería ruido.
   */
  hint() {
    if (this.hintsShown >= 3 || this.ctx.caps?.reducedMotion) return;
    this.hintsShown++;
    this.root.classList.remove("is-hinting");
    void this.root.offsetWidth;
    this.root.classList.add("is-hinting");
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.root.classList.remove("is-hinting"), 2600);
  }

  destroy() {
    const opts = { capture: true };
    window.removeEventListener("pointerdown", this.#onDown, opts);
    window.removeEventListener("pointermove", this.#onMove, opts);
    window.removeEventListener("pointerup", this.#onUp, opts);
    window.removeEventListener("pointercancel", this.#onUp, opts);
    clearTimeout(this.hintTimer);
  }
}
