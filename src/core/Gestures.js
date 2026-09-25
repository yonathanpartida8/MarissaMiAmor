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

/* ══════════════════════════════════════════════════════════════════════
   EL REPARTO — una sola escucha de `pointermove` para todo el libro.

   Cada reconocedor necesita seguir el dedo por TODA la ventana, no sólo
   por encima de su elemento: si no, soltar una polaroid fuera de su marco
   la dejaba pegada al dedo para siempre. Por eso el movimiento se escucha
   en `window`.

   Pero antes cada instancia enganchaba las suyas, y hay muchas a la vez:
   el router tiene la suya, la navegación de los bordes la suya, y el
   router mantiene vivas hasta cuatro páginas —cada una con los
   reconocedores de sus cosas—. Entre quince y veinte escuchas de
   `pointermove` en `window`, y el navegador las llama TODAS en cada
   movimiento del dedo. En un móvil a 120 Hz eso son más de dos mil
   llamadas por segundo sólo para que casi todas contesten «este dedo no
   es mío» y se vayan.

   Ahora hay tres escuchas en total, pase lo que pase, y son ellas las que
   reparten a quien esté vivo. El recorrido es el mismo —se sigue
   preguntando a todos, en el mismo orden— pero sin pagar el peaje de
   entrar y salir del navegador veinte veces por fotograma.

   El conjunto se recorre directamente, sin copiarlo: copiarlo sería un
   array nuevo en cada movimiento, y un reconocedor que muera mientras se
   reparte —pasar de página destruye páginas, y con ellas sus gestos— es
   un caso que `Set` ya resuelve: a los que se borran y aún no han sido
   visitados, no se les llama.
   ══════════════════════════════════════════════════════════════════════ */

/** @type {Set<{move:(e:PointerEvent)=>void, up:(e:PointerEvent)=>void}>} */
const enEscucha = new Set();
let repartoAbierto = false;

const repartirMove = (e) => {
  for (const oyente of enEscucha) oyente.move(e);
};

const repartirUp = (e) => {
  for (const oyente of enEscucha) oyente.up(e);
};

function abrirReparto() {
  if (repartoAbierto) return;
  repartoAbierto = true;
  // `passive: false` porque los reconocedores llaman a `preventDefault()`
  // en cuanto se quedan el gesto.
  const opts = { passive: false };
  window.addEventListener("pointermove", repartirMove, opts);
  window.addEventListener("pointerup", repartirUp, opts);
  window.addEventListener("pointercancel", repartirUp, opts);
}

function cerrarReparto() {
  if (!repartoAbierto || enEscucha.size) return;
  repartoAbierto = false;
  window.removeEventListener("pointermove", repartirMove);
  window.removeEventListener("pointerup", repartirUp);
  window.removeEventListener("pointercancel", repartirUp);
}

const LONG_PRESS_MS = 460;
const TAP_MAX_MS = 320;
const TAP_MAX_MOVE = 10;
const DOUBLE_TAP_MS = 280;
const PAN_THRESHOLD = 9;
const SWIPE_MIN_DIST = 46;
const SWIPE_MIN_VELOCITY = 0.32; // px por ms

export class Gestures {
  /**
   * El dedo reclamado por el libro.
   *
   * La navegación desde el borde escucha en fase de captura, por encima de
   * todo el mundo. Cuando decide que un dedo es suyo lo anuncia aquí, y todos
   * los reconocedores lo sueltan educadamente: la tira de cine termina de
   * frenar, la postal se recoloca, pero ninguno actúa sobre un gesto que ya
   * no le pertenece. Es estático a propósito: es una decisión de todo el
   * sistema, no de una instancia.
   *
   * @type {number|null}
   */
  static claimed = null;

  static claim(pointerId) {
    Gestures.claimed = pointerId;
  }

  static release(pointerId) {
    if (Gestures.claimed === pointerId) Gestures.claimed = null;
  }

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
    // Bloquea el menú contextual del long press en Android/iOS.
    this.target.addEventListener("contextmenu", this.#onContextMenu);

    // El movimiento del dedo llega por el reparto compartido (ver arriba).
    // Los dos métodos son campos de clase con flecha, así que ya vienen con
    // su `this` puesto y se pueden pasar tal cual.
    this.#turno = { move: this.#onMove, up: this.#onUp };
    enEscucha.add(this.#turno);
    abrirReparto();
  }

  /** Su sitio en el reparto. Se borra al destruirse. */
  #turno = null;

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

    // El libro se ha quedado este dedo: lo soltamos con elegancia.
    if (Gestures.claimed !== null && e.pointerId === Gestures.claimed) {
      if (this.state?.id === e.pointerId || this.pointers.has(e.pointerId)) this.#yield(e);
      return;
    }

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
        // El primer toque estaba esperando por si era uno solo: ya no lo es.
        // Sin esto, un doble toque hacía las DOS cosas (el toque y el doble).
        clearTimeout(this.tapTimer);
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

  /**
   * Abandona el gesto en curso.
   *
   * Si había un arrastre vivo se avisa con `onPanEnd({ cancelled: true })`,
   * igual que al ceder el dedo. Sin ese aviso, quien estuviera siguiendo el
   * dedo se quedaba creyendo que aún lo tiene: las ruedas del candado, por
   * ejemplo, no volvían a imantarse a su dígito nunca más.
   */
  #reset(e) {
    const s = this.state;
    clearTimeout(this.longTimer);
    clearTimeout(this.tapTimer);
    this.state = null;
    if (s?.panning) this.h.onPanEnd?.({ ...this.#detail(s, e), cancelled: true });
  }

  /**
   * Suelta el gesto porque el dedo ya no es nuestro.
   *
   * Se avisa con `onPanEnd` para que lo que estuviera moviéndose termine de
   * frenar donde toca, pero NO se dispara `onSwipe` ni `onTap`: el gesto se
   * abandona, no se completa.
   */
  #yield(e) {
    const s = this.state;
    clearTimeout(this.longTimer);
    clearTimeout(this.tapTimer);
    if (s?.panning) this.h.onPanEnd?.({ ...this.#detail(s, e), cancelled: true });
    this.pointers.delete(e.pointerId);
    this.pinch = null;
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

    if (this.#turno) {
      enEscucha.delete(this.#turno);
      this.#turno = null;
      // Cuando se va el último, el libro deja de escuchar el dedo del todo.
      cerrarReparto();
    }

    this.pointers.clear();
    this.state = null;
    this.enabled = false;
  }
}
