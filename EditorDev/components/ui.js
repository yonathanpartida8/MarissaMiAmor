/**
 * PIEZAS DE INTERFAZ — los controles de todos los paneles.
 *
 * Cada control sabe leer su valor y escribirlo. Los paneles no se rehacen
 * cada vez que algo cambia: se construyen una vez y luego cada control se
 * «refresca» solo (y no si lo estás tocando, para no quitarte el foco).
 */
import { el } from "../../src/utils/dom.js";
import { ico } from "./iconos.js";
import { Hoja, asa } from "./hoja.js";

export { el };

/** Lista de refrescos de un panel. */
export class Vinculos {
  constructor() { this.fns = []; }
  add(fn) { this.fns.push(fn); return fn; }
  refrescar() { for (const f of this.fns) { try { f(); } catch (e) { console.warn(e); } } }
  vaciar() { this.fns = []; }
}

const enfocado = (n) => n && (n === document.activeElement || n.contains(document.activeElement));

export function seccion(titulo, hijos, { abierta = true, clase = "", extra = null } = {}) {
  const d = el("details.ed-sec" + (clase ? "." + clase : ""), { open: abierta || null }, [
    el("summary", {}, [el("span", { text: titulo }), extra].filter(Boolean)),
    el("div.ed-sec-cuerpo", {}, hijos),
  ]);
  return d;
}

export function fila(etiqueta, control, ayuda) {
  return el("label.ed-fila", {}, [el("span.ed-et", { text: etiqueta }), control, ayuda ? el("small.ed-ayuda", { text: ayuda }) : null]);
}

export function boton(texto, al, clase = "", titulo) {
  return el("button.ed-btn" + (clase ? "." + clase.split(" ").join(".") : ""), { type: "button", html: texto, title: titulo || null, "aria-label": titulo || null, onClick: al });
}

/**
 * Un control ligado a un valor.
 *   tipo: numero | rango | color | texto | area | select | toggle | segmento
 */
export function control(v, { tipo = "numero", leer, escribir, min, max, paso = 1, opciones = [], unidad = "", placeholder = "", filas = 3, alcambiar = false }) {
  let n;
  const poner = (x) => { try { escribir(x); } catch (e) { console.error(e); } };
  switch (tipo) {
    case "numero": {
      n = el("div.ed-num", {}, [el("input", { type: "number", min, max, step: paso, inputmode: "decimal" }), unidad ? el("i", { text: unidad }) : null]);
      const i = n.firstChild;
      i.addEventListener("input", () => { if (i.value !== "" && !isNaN(+i.value)) poner(+i.value); });
      v.add(() => { if (!enfocado(i)) { const x = leer(); i.value = x == null ? "" : Math.round(x * 100) / 100; } });
      break;
    }
    case "rango": {
      n = el("div.ed-rango", {}, [el("input", { type: "range", min, max, step: paso }), el("output")]);
      const [i, o] = n.children;
      const pintar = (x) => { o.textContent = (Math.round(x * 100) / 100) + unidad; i.style.setProperty("--p", ((x - min) / (max - min)) * 100 + "%"); };
      i.addEventListener("input", () => { pintar(+i.value); poner(+i.value); });
      // Si el dedo sólo pasaba por encima para desplazar el panel, el navegador
      // cancela el gesto: el valor vuelve a como estaba (nada cambia sin querer).
      let v0 = null;
      i.addEventListener("pointerdown", () => { v0 = i.value; });
      i.addEventListener("pointerup", () => { v0 = null; });
      i.addEventListener("pointercancel", () => { if (v0 != null && i.value !== v0) { i.value = v0; pintar(+v0); poner(+v0); } v0 = null; });
      v.add(() => { if (!enfocado(i)) { const x = leer() ?? min; i.value = x; pintar(+x); } });
      break;
    }
    case "color": {
      n = el("div.ed-color", {}, [el("input", { type: "color" }), el("input", { type: "text", spellcheck: "false", placeholder: "#rrggbb" })]);
      const [c, t] = n.children;
      c.addEventListener("input", () => { t.value = c.value; poner(c.value); });
      t.addEventListener("change", () => { const x = t.value.trim(); if (x) { poner(x); if (/^#[0-9a-f]{6}$/i.test(x)) c.value = x; } });
      v.add(() => { const x = leer() || ""; if (!enfocado(t)) t.value = x; if (/^#[0-9a-f]{6}$/i.test(x)) c.value = x; });
      break;
    }
    case "texto": case "area": {
      n = tipo === "texto" ? el("input.ed-txt", { type: "text", placeholder }) : el("textarea.ed-txt", { rows: filas, placeholder });
      n.addEventListener(alcambiar ? "change" : "input", () => poner(n.value));
      v.add(() => { if (!enfocado(n)) n.value = leer() ?? ""; });
      break;
    }
    case "select": {
      n = el("select.ed-sel", {}, opciones.map(([val, txt]) => el("option", { value: val, text: txt })));
      n.addEventListener("change", () => { const o = opciones.find(([val]) => String(val) === n.value); poner(o ? o[0] : n.value); });
      v.add(() => { const x = leer(); n.value = x == null ? "" : String(x); });
      break;
    }
    case "toggle": {
      n = el("button.ed-toggle", { type: "button", role: "switch" }, [el("i")]);
      n.addEventListener("click", () => poner(!leer()));
      v.add(() => { const on = !!leer(); n.classList.toggle("on", on); n.setAttribute("aria-checked", on); });
      break;
    }
    case "segmento": {
      n = el("div.ed-seg", {}, opciones.map(([val, txt, tit]) => el("button", { type: "button", html: txt, title: tit || null, "aria-label": tit || null, dataset: { v: String(val) }, onClick: () => poner(val) })));
      v.add(() => { const x = String(leer()); for (const b of n.children) b.classList.toggle("on", b.dataset.v === x); });
      break;
    }
  }
  return n;
}

/* ── Avisos ───────────────────────────────────────────────────────── */
let pila = null;
export function aviso(texto, ms = 2600, tipo = "", accion = null) {
  if (!pila) { pila = el("div.ed-avisos", { role: "status", "aria-live": "polite" }); document.body.append(pila); }
  const t = el("div.ed-aviso" + (tipo ? "." + tipo : ""), { text: texto });
  // Un botón dentro del aviso («Probar», «Deshacer»…).
  if (accion) t.append(el("button.ed-aviso-b", { type: "button", html: accion.t, onClick: () => { t.classList.remove("ver"); setTimeout(() => t.remove(), 300); accion.al(); } }));
  pila.append(t);
  if (tipo) dispatchEvent(new CustomEvent("ed-aviso", { detail: tipo }));
  requestAnimationFrame(() => t.classList.add("ver"));
  setTimeout(() => { t.classList.remove("ver"); setTimeout(() => t.remove(), 300); }, ms);
}

/* ── Ventanas ─────────────────────────────────────────────────────── */
export const MODALES = [];

export function modal({ titulo, contenido, acciones = [], ancho = 520, clase = "", antesDeCerrar = null, cabecera = null }) {
  return new Promise((resolver) => {
    let hecho = false, preguntando = false;
    const hoja = esMovil();
    /** Cierra con un valor. `antesDeCerrar(v)` puede negarse (false) o cambiar el valor ({ valor }). */
    const cerrar = async (v, forzar) => {
      if (hecho || preguntando) return;
      if (!forzar && antesDeCerrar) {
        preguntando = true;
        let r;
        try { r = await antesDeCerrar(v); } finally { preguntando = false; }
        if (r === false) { if (h && !h.abierta) h.abrir(0); return; }
        if (r && typeof r === "object" && "valor" in r) v = r.valor;
      }
      hecho = true;
      const i = MODALES.indexOf(caja);
      if (i >= 0) MODALES.splice(i, 1);
      document.removeEventListener("keydown", tecla, true);
      if (h && h.abierta) { valor = v; h.cerrar("codigo"); return; }
      fondo.classList.remove("ver");
      setTimeout(() => fondo.remove(), 240);
      dispatchEvent(new CustomEvent("ed-hoja", { detail: "cerrar" }));
      resolver(v);
    };
    let valor = null;
    const tecla = (e) => { if (e.key === "Escape" && MODALES[MODALES.length - 1] === caja) { e.stopPropagation(); cerrar(null); } };
    const a = hoja ? asa() : null;
    const cab = el("header", {}, [el("h2", { text: titulo }), cabecera, el("button.ed-x", { type: "button", "aria-label": "Cerrar", html: ico("cerrar"), onClick: () => cerrar(null) })].filter(Boolean));
    const caja = el("div.ed-modal" + (clase ? "." + clase : ""), { role: "dialog", "aria-modal": "true", style: { maxWidth: ancho + "px" } }, [
      a,
      cab,
      el("div.ed-modal-cuerpo", {}, [].concat(contenido)),
      acciones.length ? el("footer", {}, acciones.map(([txt, val, cl]) => el("button.ed-btn" + (cl ? "." + cl.split(" ").join(".") : ""), { type: "button", html: txt, onClick: () => cerrar(typeof val === "function" ? val() : val) }))) : null,
    ].filter(Boolean));
    const fondo = el("div.ed-modal-fondo" + (hoja ? ".hoja" : ""), {}, [caja]);
    fondo.addEventListener("pointerdown", (e) => { if (e.target === fondo) cerrar(null); });
    document.addEventListener("keydown", tecla, true);
    document.body.append(fondo);
    // En el teléfono es una hoja que sube y se baja con el dedo desde su asa.
    const h = hoja ? new Hoja(caja, {
      asa: a, agarres: [cab.firstChild], cerrable: true,
      alMover: (y, alto) => { fondo.style.setProperty("--velo", String(Math.max(0, Math.min(1, 1 - y / alto)))); },
      alCerrar: (motivo) => {
        if (!hecho) { cerrar(null); if (!hecho) return; }
        fondo.classList.remove("ver");
        setTimeout(() => fondo.remove(), 200);
        resolver(motivo === "codigo" ? valor : null);
      },
    }) : null;
    requestAnimationFrame(() => fondo.classList.add("ver"));
    if (h) h.abrir(0); else dispatchEvent(new CustomEvent("ed-hoja", { detail: "abrir" }));
    caja.cerrar = cerrar;
    MODALES.push(caja);
    modal.ultima = caja;
  });
}

/** Cierra la ventana de más arriba (botón «atrás» del teléfono). ¿Había alguna? */
export function cerrarUltimoModal() {
  const c = MODALES[MODALES.length - 1];
  if (!c) return false;
  c.cerrar(null);
  return true;
}

export const confirmar = (texto, si = "Sí", clase = "peligro") =>
  modal({ titulo: "¿Seguro?", contenido: el("p", { text: texto }), acciones: [["Cancelar", false], [si, true, clase]], ancho: 420 });

export function pedirTexto(titulo, valor = "", placeholder = "") {
  const i = el("input.ed-txt", { type: "text", value: valor, placeholder });
  setTimeout(() => { i.focus(); i.select(); }, 60);
  const p = modal({ titulo, contenido: i, acciones: [["Cancelar", null], ["Aceptar", () => i.value, "primario"]], ancho: 420 });
  i.addEventListener("keydown", (e) => { if (e.key === "Enter") i.closest(".ed-modal").cerrar(i.value); });
  return p;
}

/* ── Menú contextual ──────────────────────────────────────────────── */
export function menu(ancla, items) {
  document.querySelector(".ed-menu")?.remove();
  const m = el("div.ed-menu", { role: "menu" }, items.filter(Boolean).map((it) => it === "-" ? el("hr") : el("button" + (it.peligro ? ".peligro" : ""), { type: "button", role: "menuitem", html: it.t, disabled: it.off || null, onClick: () => { cerrar(); it.al(); } })));
  document.body.append(m);
  // Se ancla a un botón… o a un punto de la pantalla (el del dedo).
  const r = ancla.getBoundingClientRect ? ancla.getBoundingClientRect() : { left: ancla.x, right: ancla.x, top: ancla.y, bottom: ancla.y };
  const W = innerWidth, H = innerHeight;
  const mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(W - mw - 8, r.left)) + "px";
  m.style.top = (r.bottom + mh + 8 > H ? Math.max(8, r.top - mh - 4) : r.bottom + 4) + "px";
  const fuera = (e) => { if (!m.contains(e.target)) cerrar(); };
  const cerrar = () => { m.remove(); document.removeEventListener("pointerdown", fuera, true); };
  setTimeout(() => document.addEventListener("pointerdown", fuera, true), 0);
  return m;
}

/** Ordenar arrastrando (páginas, capas, fotos de un álbum). Ratón y dedo. */
export function ordenable(lista, { item = "[data-id]", asa = null, alSoltar }) {
  let arr = null;
  lista.addEventListener("pointerdown", (e) => {
    const it = e.target.closest(item);
    if (!it || !lista.contains(it) || e.button > 0) return;
    if (asa && !e.target.closest(asa)) return;
    if (e.target.closest("button:not(.ed-asa), input, select, textarea")) return;
    const y0 = e.clientY, x0 = e.clientX;
    const items = () => [...lista.querySelectorAll(item)];
    const de = items().indexOf(it);
    let activo = false, a = de, espera = null;
    const empezar = () => {
      activo = true;
      it.classList.add("ed-arrastrando");
      lista.classList.add("ed-ordenando");
      try { it.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
    };
    // Con dedo, un toque largo (para no robarle el desplazamiento a la lista).
    if (e.pointerType === "touch" && !asa) espera = setTimeout(empezar, 320);
    const mover = (ev) => {
      if (!activo) {
        if (espera && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) { clearTimeout(espera); espera = null; fin(); return; }
        if (!espera && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 5) empezar(); else return;
      }
      ev.preventDefault();
      const dy = ev.clientY - y0;
      it.style.transform = `translateY(${dy}px)`;
      const hs = items();
      a = de;
      for (let j = 0; j < hs.length; j++) {
        if (hs[j] === it) continue;
        const r = hs[j].getBoundingClientRect();
        const c = r.top + r.height / 2;
        if (j > de && ev.clientY > c) a = j;
        if (j < de && ev.clientY < c && a === de) a = j;
      }
      hs.forEach((h, j) => {
        if (h === it) return;
        const alto = it.offsetHeight + 6;
        h.style.transform = j > de && j <= a ? `translateY(${-alto}px)` : j < de && j >= a ? `translateY(${alto}px)` : "";
      });
    };
    const fin = () => {
      clearTimeout(espera);
      lista.removeEventListener("pointermove", mover);
      removeEventListener("pointerup", fin);
      removeEventListener("pointercancel", fin);
      if (!activo) return;
      for (const h of items()) h.style.transform = "";
      it.classList.remove("ed-arrastrando");
      lista.classList.remove("ed-ordenando");
      if (a !== de) alSoltar(de, a);
    };
    lista.addEventListener("pointermove", mover);
    addEventListener("pointerup", fin);
    addEventListener("pointercancel", fin);
  });
}

export function formatoBytes(n) {
  if (!n) return "0 KB";
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

export function debounce(fn, ms) {
  let t = null;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.cancelar = () => clearTimeout(t);
  return d;
}

/** Teléfono (vertical o acostado) y tableta vertical: cajón lateral y hojas de abajo.
    Sólo por el ancho: el teclado achica el alto y no debe cambiar la forma del editor. */
export const COMPACTO = "(max-width: 1023px)";
export const esMovil = () => matchMedia(COMPACTO).matches;

/* ── Globito de opciones (la barra contextual lo usa) ─────────────── */
export function popover(ancla, contenido, { clase = "" } = {}) {
  document.querySelector(".ed-pop")?._cerrar?.();
  const p = el("div.ed-pop" + (clase ? "." + clase : ""), { role: "dialog" }, [].concat(contenido));
  document.body.append(p);
  const r = ancla.getBoundingClientRect();
  if (!esMovil()) {
    const W = innerWidth, H = innerHeight;
    const pw = p.offsetWidth, ph = p.offsetHeight;
    p.style.left = Math.max(8, Math.min(W - pw - 8, r.left + r.width / 2 - pw / 2)) + "px";
    p.style.top = (r.bottom + ph + 10 > H ? Math.max(8, r.top - ph - 8) : r.bottom + 8) + "px";
  }
  const fuera = (e) => { if (!p.contains(e.target) && !ancla.contains(e.target)) cerrar(); };
  const tecla = (e) => { if (e.key === "Escape") cerrar(); };
  let h = null;
  const quitar = () => { p.remove(); document.removeEventListener("pointerdown", fuera, true); removeEventListener("keydown", tecla); };
  const cerrar = () => { if (h && h.abierta) { h.cerrar("codigo"); document.removeEventListener("pointerdown", fuera, true); removeEventListener("keydown", tecla); } else quitar(); };
  p._cerrar = cerrar;
  setTimeout(() => { document.addEventListener("pointerdown", fuera, true); addEventListener("keydown", tecla); }, 0);
  if (esMovil()) {
    // En el teléfono: una hojita con su asa, que se baja con el dedo.
    const a = asa();
    p.prepend(a);
    h = new Hoja(p, { asa: a, cerrable: true, alCerrar: quitar });
    h.abrir(0);
  } else requestAnimationFrame(() => p.classList.add("ver"));
  return { nodo: p, cerrar };
}
