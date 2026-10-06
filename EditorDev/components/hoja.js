/**
 * HOJAS QUE SE DESLIZAN — todas con su asa de color arriba.
 *
 *   new Hoja(panel, op)   el panel sigue al dedo desde su asa (y desde lo que
 *                         se le pase en `agarres`, como su cabecera):
 *       puntos     cuánto se ve en cada parada, de más a menos ([1, .5])
 *       cerrable   si se puede bajar del todo (y entonces se cierra)
 *       alCerrar   al terminar de cerrarse (motivo: "dedo" | "toque" | …)
 *
 *   hojita({ titulo, contenido, acciones })   una hoja de previsualización
 *       (efectos, transiciones, GIFs…): sube desde abajo sin tapar toda la
 *       página y se cumple con lo que se eligió (o null con «Atrás»).
 *
 * Cómo se siente:
 *   · nada se mueve hasta que el dedo se desplaza de verdad y en vertical
 *     (un roce o un gesto de lado no la tocan);
 *   · mientras se arrastra la hoja va pegada al dedo; más arriba de lo
 *     abierto «estira» con resistencia;
 *   · al soltar, un resorte la lleva a la parada más cercana según la
 *     velocidad del dedo (un tirón rápido hacia abajo la cierra);
 *   · tocar el asa alterna entre las paradas.
 * Todo con `transform` (lo mueve la GPU) y un solo cuadro por movimiento.
 */
import { el } from "../../src/utils/dom.js";
import { holgura, vibrar } from "../canvas/gestos.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Un resorte casi crítico (llega sin rebotar de más). Llama a `cuadro(x)` en
 * cada cuadro y a `fin()` al llegar. Devuelve una función para pararlo.
 */
export function resorte(desde, hasta, { v0 = 0, rigidez = 380, amort = 0.9, cuadro, fin } = {}) {
  let x = desde, v = v0, t = performance.now(), id = 0;
  const c = 2 * Math.sqrt(rigidez) * amort;
  const paso = (ahora) => {
    const dt = Math.min(0.034, Math.max(0.001, (ahora - t) / 1000));
    t = ahora;
    const a = -rigidez * (x - hasta) - c * v;
    v += a * dt;
    x += v * dt;
    if (Math.abs(x - hasta) < 0.4 && Math.abs(v) < 12) { cuadro(hasta); id = 0; fin?.(); return; }
    cuadro(x);
    id = requestAnimationFrame(paso);
  };
  id = requestAnimationFrame(paso);
  return () => { cancelAnimationFrame(id); id = 0; };
}

/** Las hojas abiertas, de la más vieja a la más nueva (Esc y «atrás» cierran la última). */
export const PILA = [];

export function asa(clase = "") {
  return el("button.ed-asa-hoja" + (clase ? "." + clase : ""), { type: "button", "aria-label": "Arrastra para subir o bajar · toca para cambiar" }, [el("i")]);
}

export class Hoja {
  constructor(panel, { asa: a, agarres = [], puntos = [1], cerrable = true, alCerrar, alAbrir, alMover } = {}) {
    this.panel = panel;
    this.puntos = puntos;
    this.cerrable = cerrable;
    this.alCerrar = alCerrar;
    this.alAbrir = alAbrir;
    this.alMover = alMover;
    this.y = null;          // px hacia abajo desde «abierta del todo» (null = cerrada)
    this.parar = null;
    this.abierta = false;
    panel.classList.add("ed-desliza");
    for (const n of [a, ...agarres].filter(Boolean)) this._agarre(n);
  }

  get alto() { return this.panel.offsetHeight || 1; }
  _paradas() { const h = this.alto; return this.puntos.map((f) => Math.round(h * (1 - f))); }
  _cerrada() { return this.alto + 28; }

  _poner(y) {
    this.y = y;
    this.panel.style.transform = y > 0.5 || y < -0.5 ? `translate3d(0, ${y.toFixed(1)}px, 0)` : "translate3d(0, 0, 0)";
    this.alMover?.(y, this.alto);
  }

  _ir(destino, v0, alFin) {
    this.parar?.();
    this.parar = resorte(this.y ?? this._cerrada(), destino, { v0, cuadro: (x) => this._poner(x), fin: () => { this.parar = null; alFin?.(); } });
  }

  /** Abre en la parada `i` (0 = la más abierta). */
  abrir(i = 0) {
    const nueva = !this.abierta;
    this.abierta = true;
    this.panel.classList.add("abierta");
    this.panel.style.visibility = "visible";
    if (nueva) { this._poner(this._cerrada()); if (!PILA.includes(this)) PILA.push(this); this.alAbrir?.(); dispatchEvent(new CustomEvent("ed-hoja", { detail: "abrir" })); }
    // Un cuadro después: ya se sabe su alto de verdad.
    requestAnimationFrame(() => { if (this.abierta) this._ir(this._paradas()[clamp(i, 0, this.puntos.length - 1)] ?? 0, 0); });
  }

  /** Cierra (con su resorte). `motivo` le llega a `alCerrar`. */
  cerrar(motivo = "codigo", v0 = 0) {
    if (!this.abierta) return;
    this.abierta = false;
    const i = PILA.indexOf(this);
    if (i >= 0) PILA.splice(i, 1);
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "cerrar" }));
    this._ir(this._cerrada(), v0, () => {
      if (this.abierta) return;
      this.panel.classList.remove("abierta");
      this.panel.style.visibility = "hidden";
      this.alCerrar?.(motivo);
    });
  }

  /** Lleva a la parada `i` sin cerrar. */
  parada(i) { if (this.abierta) this._ir(this._paradas()[clamp(i, 0, this.puntos.length - 1)], 0); }

  _agarre(n) {
    n.style.touchAction = "none";
    n.addEventListener("pointerdown", (ev) => {
      if (ev.button > 0 || !this.abierta) return;
      ev.stopPropagation();
      const id = ev.pointerId;
      try { n.setPointerCapture(id); } catch (e) { /* nada */ }
      this.parar?.();
      this.parar = null;
      const x0 = ev.clientX, y0 = ev.clientY, base = this.y ?? 0;
      let movio = false, lado = false, vel = 0, ultY = y0, ultT = performance.now(), cuadro = 0, pend = null;
      const mover = (m) => {
        if (m.pointerId !== id || lado) return;
        const dx = m.clientX - x0, dy = m.clientY - y0;
        if (!movio) {
          if (Math.hypot(dx, dy) < holgura(m)) return;
          if (Math.abs(dx) > Math.abs(dy) * 1.2) { lado = true; return; } // de lado: no es para la hoja
          movio = true;
          this.panel.classList.add("arrastrando");
        }
        const t = performance.now();
        const dt = Math.max(1, t - ultT);
        vel = vel * 0.6 + ((m.clientY - ultY) / dt) * 1000 * 0.4;
        ultY = m.clientY; ultT = t;
        let y = base + dy;
        if (y < 0) y = -Math.sqrt(-y) * 3.2; // más arriba de lo abierto: estira con resistencia
        pend = y;
        if (!cuadro) cuadro = requestAnimationFrame(() => { cuadro = 0; if (pend != null) this._poner(pend); });
      };
      const soltar = (u) => {
        if (u.pointerId !== id) return;
        n.removeEventListener("pointermove", mover);
        n.removeEventListener("pointerup", soltar);
        n.removeEventListener("pointercancel", soltar);
        cancelAnimationFrame(cuadro);
        this.panel.classList.remove("arrastrando");
        if (pend != null) this._poner(pend);
        if (!this.abierta) return;
        if (!movio) {
          if (lado || u.type === "pointercancel") { this._ir(base, 0); return; }
          // Un toque en el asa: cambiar de parada (o cerrar si ya está en la última).
          const ps = this._paradas();
          let i = ps.findIndex((p) => Math.abs(p - base) < 8);
          if (i < 0) i = 0;
          if (i < ps.length - 1) this._ir(ps[i + 1], 0);
          else if (i > 0) this._ir(ps[0], 0);
          else if (this.cerrable) this.cerrar("toque");
          else this._ir(base, 0);
          return;
        }
        if (performance.now() - ultT > 120) vel = 0; // el dedo se detuvo antes de soltar: sin impulso
        const y = this.y ?? 0;
        const proyectada = y + clamp(vel, -2600, 2600) * 0.2;
        const ps = this._paradas();
        if (this.cerrable && (proyectada > this.alto * 0.62 || (vel > 1100 && y > ps[ps.length - 1] - 40))) {
          vibrar(6);
          this.cerrar("dedo", vel);
          return;
        }
        let mejor = ps[0];
        for (const p of ps) if (Math.abs(p - proyectada) < Math.abs(mejor - proyectada)) mejor = p;
        this._ir(mejor, vel);
      };
      n.addEventListener("pointermove", mover);
      n.addEventListener("pointerup", soltar);
      n.addEventListener("pointercancel", soltar);
    });
  }
}

/**
 * Una hoja de previsualización (no bloquea la página: se ve detrás).
 *   acciones: [[texto, valor, clase]]   el valor puede ser una función
 *   Se cumple con el valor elegido, o null si se baja, se toca fuera o «atrás».
 */
export function hojita({ titulo, contenido, acciones = [], clase = "", puntos = [1], velo = true, alAbrir } = {}) {
  return new Promise((resolver) => {
    const a = asa();
    const cab = el("header.ed-hojita-cab", {}, [el("h3", { text: titulo || "" })]);
    const pie = acciones.length ? el("footer.ed-hojita-pie", {}, acciones.map(([t, v, cl]) => el("button.ed-btn" + (cl ? "." + cl.split(" ").join(".") : ""), { type: "button", html: t, onClick: () => cerrar(typeof v === "function" ? v() : v) }))) : null;
    const panel = el("section.ed-hojita" + (clase ? "." + clase : ""), { role: "dialog", "aria-label": titulo || "Opciones" }, [a, cab, el("div.ed-hojita-cuerpo", {}, [].concat(contenido)), pie]);
    const fondo = velo ? el("div.ed-hojita-velo") : null;
    let valor = null, hecho = false;
    const cerrar = (v) => { if (hecho) return; hecho = true; valor = v; h.cerrar(v == null ? "atras" : "elegido"); };
    const h = new Hoja(panel, {
      asa: a, agarres: [cab], puntos, cerrable: true,
      alMover: (y, alto) => { if (fondo) fondo.style.opacity = String(clamp(1 - y / alto, 0, 1)); },
      alCerrar: () => { panel.remove(); fondo?.remove(); document.removeEventListener("keydown", tecla, true); resolver(valor); },
    });
    const tecla = (e) => { if (e.key === "Escape") { e.stopPropagation(); cerrar(null); } };
    if (fondo) fondo.addEventListener("pointerdown", (e) => { e.preventDefault(); cerrar(null); });
    document.addEventListener("keydown", tecla, true);
    document.body.append(...[fondo, panel].filter(Boolean));
    panel.cerrar = cerrar;
    h.cerrarDesde = cerrar;
    h.abrir(0);
    alAbrir?.(panel, cerrar);
  });
}

/** Cierra la hoja de más arriba (Esc o el botón «atrás» del teléfono). ¿Había alguna? */
export function cerrarUltima() {
  const h = PILA[PILA.length - 1];
  if (!h) return false;
  if (h.cerrarDesde) h.cerrarDesde(null); else h.cerrar("atras");
  return true;
}
