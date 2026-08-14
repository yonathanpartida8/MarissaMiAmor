/**
 * GESTURES — el vocabulario táctil del libro.
 *
 * Un solo reconocedor basado en Pointer Events que entiende: tap, doble tap,
 * pulsación larga, arrastre con velocidad, swipe con dirección y pinza.
 *
 * Diseño importante: los reconocedores anidan. Una polaroid arrastrable
 * dentro de una página que también pasa con swipe declara `exclusive: true`
 * y se queda el gesto; la página nunca "roba" el dedo a sus hijos.
 */

const LONG_PRESS_MS = 460;
const TAP_MAX_MS = 320;
const TAP_MAX_MOVE = 10;
const DOUBLE_TAP_MS = 280;
const PAN_THRESHOLD = 9;
const SWIPE_MIN_DIST = 46;
const SWIPE_MIN_VELOCITY = 0.32; // px por ms

export class Gestures {
  /**
   * @param {HTMLElement} target
   * @param {object} handlers
   * @param {object} [options]
   * @param {"x"|"y"|"free"} [options.axis] eje que bloquea el arrastre
   * @param {boolean} [options.exclusive] impide que ancestros reciban el gesto
   * @param {boolean} [options.pinch] activa el reconocimiento de pinza
   */
  constructor(target, handlers = {}, options = {}) {
    this.target = target;
    this.h = handlers;
    this.axis = options.axis || "free";
    this.exclusive = options.exclusive === true;
    this.wantsPinch = options.pinch === true;
    this.threshold = options.threshold ?? PAN_THRESHOLD;
    this.longPressMs = options.longPressMs ?? LONG_PRESS_MS;
    this.enabled = true;

    this.pointers = new Map();
    this.state = null;
    this.lastTapAt = 0;
    this.lastTapPos = { x: 0, y: 0 };

    this.#bind();
  }

  #bind() {
    const opts = { passive: false };
    this.target.addEventListener("pointerdown", this.#onDown, opts);
    // Los movimientos se escuchan en window: el dedo puede salirse del elemento.
    window.addEventListener("pointermove", this.#onMove, opts);
    window.addEventListener("pointerup", this.#onUp, opts);
    window.addEventListener("pointercancel", this.#onUp, opts);
    // Bloquea el menú contextual del long press en Android/iOS.
    this.target.addEventListener("contextmenu", this.#onContextMenu);
  }

  #onContextMenu = (e) => {
    if (this.enabled && this.h.onLongPress) e.preventDefault();
  };

  #onDown = (e) => {
    if (!this.enabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (this.exclusive) e.stopPropagation();

    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 2 && this.wantsPinch) {
      this.#startPinch();
      return;
    }
    if (this.pointers.size > 1) return;

    this.state = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      startTime: performance.now(),
      lastTime: performance.now(),
      vx: 0,
      vy: 0,
      panning: false,
      lockedAxis: null,
      longPressed: false,
      target: e.target,
    };

    if (this.h.onLongPress) {
      this.longTimer = setTimeout(() => {
        const s = this.state;
        if (!s || s.panning) return;
        s.longPressed = true;
        this.h.onLongPress(this.#detail(s, e));
      }, this.longPressMs);
    }

    this.h.onDown?.(this.#detail(this.state, e));
  };

  #onMove = (e) => {
    if (!this.enabled) return;

    if (this.pointers.has(e.pointerId)) {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (this.pinch) {
      this.#updatePinch(e);
      return;
    }

    const s = this.state;
    if (!s || e.pointerId !== s.id) return;

    const now = performance.now();
    const dt = Math.max(1, now - s.lastTime);
    s.vx = (e.clientX - s.lastX) / dt;
    s.vy = (e.clientY - s.lastY) / dt;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.lastTime = now;
    s.x = e.clientX;
    s.y = e.clientY;

    const dx = s.x - s.startX;
    const dy = s.y - s.startY;

    if (!s.panning) {
      const dist = Math.hypot(dx, dy);
      if (dist < this.threshold) return;

      // Bloqueo de eje: decidido una sola vez, al superar el umbral.
      s.lockedAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (this.axis !== "free" && s.lockedAxis !== this.axis) {
        // El gesto va en el eje que no nos toca: lo soltamos para el ancestro.
        this.#reset();
        return;
      }

      clearTimeout(this.longTimer);
      s.panning = true;
      if (this.exclusive) e.stopPropagation();
      this.h.onPanStart?.(this.#detail(s, e));
    }

    if (s.panning) {
      // Ya somos dueños del gesto: nadie hace scroll ni recarga la página.
      if (e.cancelable) e.preventDefault();
      if (this.exclusive) e.stopPropagation();
      this.h.onPan?.(this.#detail(s, e));
    }
  };

  #onUp = (e) => {
    this.pointers.delete(e.pointerId);

    if (this.pinch && this.pointers.size < 2) {
      this.h.onPinchEnd?.({ scale: this.pinch.scale });
      this.pinch = null;
      this.state = null;
      return;
    }

    const s = this.state;
    if (!s || e.pointerId !== s.id) return;
    clearTimeout(this.longTimer);

    const detail = this.#detail(s, e);
    const elapsed = performance.now() - s.startTime;
    const dist = Math.hypot(detail.dx, detail.dy);

    if (s.panning) {
      this.h.onPanEnd?.(detail);

      const alongX = s.lockedAxis === "x";
      const travel = alongX ? Math.abs(detail.dx) : Math.abs(detail.dy);
      const speed = alongX ? Math.abs(s.vx) : Math.abs(s.vy);
      if (travel > SWIPE_MIN_DIST || speed > SWIPE_MIN_VELOCITY) {
        const dir = alongX
          ? detail.dx < 0 ? "left" : "right"
          : detail.dy < 0 ? "up" : "down";
        this.h.onSwipe?.({ ...detail, direction: dir, speed });
      }
    } else if (!s.longPressed && elapsed < TAP_MAX_MS && dist < TAP_MAX_MOVE) {
      const now = performance.now();
      const near = Math.hypot(s.x - this.lastTapPos.x, s.y - this.lastTapPos.y) < 34;
      if (this.h.onDoubleTap && now - this.lastTapAt < DOUBLE_TAP_MS && near) {
        this.lastTapAt = 0;
        this.h.onDoubleTap(detail);
      } else {
        this.lastTapAt = now;
        this.lastTapPos = { x: s.x, y: s.y };
        // Espera por si llega un segundo toque; si no hay handler, dispara ya.
        if (this.h.onDoubleTap) {
          this.tapTimer = setTimeout(() => this.h.onTap?.(detail), DOUBLE_TAP_MS);
        } else {
          this.h.onTap?.(detail);
        }
      }
    } else if (s.longPressed) {
      this.h.onLongPressEnd?.(detail);
    }

    this.h.onUp?.(detail);
    this.state = null;
  };

  // ---- Pinza -------------------------------------------------------------
  #startPinch() {
    clearTimeout(this.longTimer);
    const [a, b] = [...this.pointers.values()];
    this.pinch = {
      startDist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      scale: 1,
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
    };
    this.state = null;
    this.h.onPinchStart?.({ ...this.pinch });
  }

  #updatePinch(e) {
    if (this.pointers.size < 2) return;
    if (e.cancelable) e.preventDefault();
    const [a, b] = [...this.pointers.values()];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    this.pinch.scale = dist / this.pinch.startDist;
    this.pinch.cx = (a.x + b.x) / 2;
    this.pinch.cy = (a.y + b.y) / 2;
    this.h.onPinch?.({ ...this.pinch });
  }

  // ---- Interno -----------------------------------------------------------
  #detail(s, e) {
    return {
      x: s.x,
      y: s.y,
      startX: s.startX,
      startY: s.startY,
      dx: s.x - s.startX,
      dy: s.y - s.startY,
      vx: s.vx,
      vy: s.vy,
      axis: s.lockedAxis,
      duration: performance.now() - s.startTime,
      target: s.target,
      pointerType: e?.pointerType || "touch",
      originalEvent: e,
    };
  }

  #reset() {
    clearTimeout(this.longTimer);
    this.state = null;
  }

  setEnabled(value) {
    this.enabled = value;
    if (!value) this.#reset();
  }

  destroy() {
    clearTimeout(this.longTimer);
    clearTimeout(this.tapTimer);
    this.target.removeEventListener("pointerdown", this.#onDown);
    this.target.removeEventListener("contextmenu", this.#onContextMenu);
    window.removeEventListener("pointermove", this.#onMove);
    window.removeEventListener("pointerup", this.#onUp);
    window.removeEventListener("pointercancel", this.#onUp);
    this.pointers.clear();
    this.state = null;
  }
}
