/**
 * COSITAS JUNTITOS (Fase 38) — «Nuestros días juntos»: lo de todos los días de los dos.
 *
 * Se abre al tocar los días juntos del menú principal. Es una página aparte (se desliza de arriba
 * a abajo) con su barra de abajo, siempre a la mano:
 *
 *   Cositas    las tarjetitas: «Te extraño» y «Decir te amo» le llegan a tu amorcito (con aviso);
 *              caca, pis, agua y palabrotas son contadores (hoy y en total); chismes, enojos y colapsos
 *              se escriben (privados, salvo que tú los compartas); «¿Hoy me duché?» es sí o no, con racha.
 *   Mesecitos  cada mes que cumplen (desde la fecha de novios de su perfil) puede tener su página especial:
 *              una sola por mes, con título, carta, fotos y color; se guarda en su servidor y se reabre.
 *   Mapa       la ubicación compartida (de verdad y sólo si tú quieres) y sus lugares con avisos.
 *   Dibujar    Dibujar Juntos (Fase 40, en lugar de Diario): una hoja de los dos en tiempo real, con
 *              pinceles, sonidos y lápiz virtual (components/dibujo-juntos.js).
 *
 * Cada pestaña tiene sus cosas arriba a la derecha: en Cositas, «Notas» (lo que escribiste y lo que tu
 * amorcito te compartió, lo que antes era Diario); en Mesecitos, cuánto falta para el siguiente.
 * Todo vive en su M.YNTHN (servidor 1.14.0): nada se inventa ni se queda «de adorno».
 */
import { el, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as PF from "./perfil.js";
import * as UB from "./ubicacion.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { ambito } from "./rendimiento.js";
import { DibujoJuntos } from "./dibujo-juntos.js";

const svg = (d, vb = "0 0 32 32") => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONOS = {
  extrano: svg('<path d="M16 26.5S5 19.8 5 12.4A5.6 5.6 0 0 1 16 9.6a5.6 5.6 0 0 1 11 2.8c0 7.4-11 14.1-11 14.1z"/><path d="M22.5 17.5c1 1.4 1.5 2.3 1.5 3a1.5 1.5 0 0 1-3 0c0-.7.5-1.6 1.5-3z" fill="currentColor" stroke="none" opacity=".55"/>'),
  teamo: svg('<path d="M16 26.5S5 19.8 5 12.4A5.6 5.6 0 0 1 16 9.6a5.6 5.6 0 0 1 11 2.8c0 7.4-11 14.1-11 14.1z" fill="currentColor" fill-opacity=".18"/><path d="M26 3.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor"/>'),
  caca: svg('<path d="M9 25h14a4 4 0 0 0 .6-7.9 3.6 3.6 0 0 0-2.6-4.6A4 4 0 0 0 16 7.5a3 3 0 0 1-2.2 3.7 3.6 3.6 0 0 0-3.4 4.5A4 4 0 0 0 9 25z"/><circle cx="13.4" cy="19.6" r=".9" fill="currentColor"/><circle cx="18.6" cy="19.6" r=".9" fill="currentColor"/>'),
  pis: svg('<path d="M16 5c3.8 5.2 7 9.2 7 13a7 7 0 0 1-14 0c0-3.8 3.2-7.8 7-13z"/><path d="M12.6 18.6a3.4 3.4 0 0 0 2.6 3.2" opacity=".6"/>'),
  agua: svg('<path d="M9 6h14l-1.8 19.2a2 2 0 0 1-2 1.8h-6.4a2 2 0 0 1-2-1.8z"/><path d="M10 13.5c2-1 4-1 6 0s4 1 6 0" opacity=".7"/>'),
  palabrotas: svg('<path d="M6 8.5h20v12H14l-5 4.5v-4.5H6z"/><path d="M11 12.5l1 4M13.5 12.5l1 4M10.5 14h4.5M17.6 12.6v2.6M17.6 16.6v.1M20.5 12.5l1.6 4" />'),
  chismes: svg('<path d="M5 9.5h15v10H11l-4 3.5v-3.5H5z"/><path d="M20 12.5h7v9h-2v3l-3.5-3H17"/><circle cx="9" cy="14.5" r=".8" fill="currentColor"/><circle cx="12.5" cy="14.5" r=".8" fill="currentColor"/><circle cx="16" cy="14.5" r=".8" fill="currentColor"/>'),
  enojos: svg('<circle cx="16" cy="17" r="9"/><path d="M11.5 14l3 1.4M20.5 14l-3 1.4M12.6 21.4q3.4-2.4 6.8 0"/><path d="M24 4.5c.2 1.4-.6 2.3-2 2.5M28 4.5c-.2 1.4.6 2.3 2 2.5" />'),
  colapsos: svg('<path d="M7 16c0-5 4-9 9-9s9 4 9 9-4 9-9 9"/><path d="M16 25c-3 0-5.5-2.4-5.5-5.5S13 14 16 14s4 1.8 4 4-1.6 3.4-3.4 3.4"/>'),
  ducha: svg('<path d="M8 27V9a4 4 0 0 1 8 0"/><path d="M12.5 10.5h7l-1 2.5h-5z"/><path d="M13.5 16v1.4M16 17v1.4M18.5 16v1.4M14.8 20.4v1.4M17.4 20.8v1.4"/>'),
};
/** Las diez cositas: qué son, de qué color y cómo se usan. */
const COSAS = [
  { t: "extrano", n: "Te extraño", c: "rosa", modo: "manda", hint: "Le llega al instante" },
  { t: "teamo", n: "Decir te amo", c: "lila", modo: "manda", hint: "Le llega al instante" },
  { t: "caca", n: "Veces que he hecho caca", c: "durazno", modo: "cuenta" },
  { t: "chismes", n: "Chismes", c: "menta", modo: "escribe" },
  { t: "enojos", n: "Enojos", c: "rosa", modo: "escribe" },
  { t: "colapsos", n: "Colapsos", c: "lila", modo: "escribe" },
  { t: "pis", n: "Veces que he hecho pis", c: "amarillo", modo: "cuenta" },
  { t: "agua", n: "Cuántas veces he tomado agua", c: "cielo", modo: "cuenta" },
  { t: "palabrotas", n: "Palabrotas dichas", c: "durazno", modo: "cuenta" },
  { t: "ducha", n: "¿Hoy me duché?", c: "menta", modo: "si" },
];
const PIN = svg('<path d="M16 28s-8.5-7.6-8.5-14.3a8.5 8.5 0 0 1 17 0C24.5 20.4 16 28 16 28z"/><circle cx="16" cy="13.6" r="3.2"/>');
// El mapa (Fase 39): satélite con calles y nombres encima (lindo y claro), o el mapa de calles.
const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_NOMBRES = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SAT_CALLES = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
const CALLES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CAPA_MAPA = "editordev:mapa-capa";
const SATELITE = svg('<circle cx="16" cy="16" r="11"/><path d="M5 16h22M16 5c3.5 3.2 5 7 5 11s-1.5 7.8-5 11c-3.5-3.2-5-7-5-11s1.5-7.8 5-11z"/>');
const MAPA = svg('<path d="M4 8.5l8-3.5 8 3.5 8-3.5v18.5l-8 3.5-8-3.5-8 3.5z"/><path d="M12 5v18.5M20 8.5V27"/>');
const CENTRAR = svg('<circle cx="16" cy="16" r="5"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5"/>');
const TEMAS = [["rosa", "Rosa"], ["lila", "Lila"], ["durazno", "Durazno"], ["menta", "Menta"], ["noche", "Noche"]];
const fechaLarga = (s) => (s ? new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "");
const hace = (iso) => {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
};
/** El mes `n` después de la fecha de novios (el 31 + 1 mes = el último día del mes siguiente). */
function mesDe(novios, n) {
  const [a, m, d] = novios.split("-").map(Number);
  const y = a + Math.floor((m - 1 + n) / 12), mm = (m - 1 + n) % 12;
  return new Date(y, mm, Math.min(d, new Date(y, mm + 1, 0).getDate()));
}

export class Juntitos {
  constructor(app) {
    this.app = app;
    this.abierto = false;
    this.tab = "cositas";
    this.capa = null;
    this.ultimos = {}; // lo último que contaste en esta visita (para «quitar uno»)
    this.A = null;     // lo que vive mientras está abierto (escuchas, relojes, el mapa)
  }

  get pareja() { return PF.nombreDe(PF.datos().pareja) || "tu amorcito"; }

  _montar() {
    const tabs = [["cositas", "Cositas", ICONOS.teamo], ["mesecitos", "Mesecitos", svg('<rect x="5" y="7" width="22" height="20" rx="4"/><path d="M5 13h22M11 4.5v5M21 4.5v5"/><path d="M16 23.4s-4-2.4-4-5a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2.6-4 5-4 5z" fill="currentColor" fill-opacity=".25"/>')], ["mapa", "Mapa", PIN], ["dibujar", "Dibujar", svg('<path d="M5 27c3 0 5-1.5 5-4a3 3 0 0 0-3-3c-2 0-3 1.6-3 3.5 0 1.6-.6 2.6-2 3.5z" fill="currentColor" fill-opacity=".2"/><path d="M10 21L25.5 5.5a2.1 2.1 0 0 1 3 3L13 24"/>')]];
    this.nav = el("nav.jt-nav", { "aria-label": "Cositas Juntitos" }, tabs.map(([k, n, i]) => el("button.jt-tab", { type: "button", dataset: { k }, onClick: () => this.ir(k) }, [el("i", { html: i }), el("span", { text: n })])));
    this.vista = el("main.jt-vista");
    this.titulo = el("b.jt-cab-t");
    this.chip = el("button.jt-chip", { type: "button", hidden: "", onClick: () => this.ir("mapa") }, [el("i", { html: PIN }), el("span", { text: "Compartiendo ubicación" })]);
    this.accion = el("div.jt-accion");
    const cab = el("header.jt-cab", {}, [el("button.jt-atras", { type: "button", "aria-label": "Atrás", html: ico("izquierda"), onClick: () => this.atras() }), this.titulo, this.accion, this.chip]);
    this.velo = el("div.jt-velo", { onClick: () => this._cerrarHoja() });
    this.hojaEl = el("section.jt-hoja", { role: "dialog", "aria-modal": "true" });
    this.capa = el("div.jt-capa", { role: "dialog", "aria-label": "Cositas Juntitos" }, [cab, this.vista, this.nav, this.velo, this.hojaEl]);
    document.body.append(this.capa);
  }

  abrir(tab = "cositas") {
    if (!SRV.conectado()) { aviso(`Entra a tu ${SRV.NOMBRE} y vincúlate con tu amorcito para usar Cositas Juntitos.`, 4200); return; }
    if (!this.capa) this._montar();
    this.A?.limpiar();
    this.A = ambito("juntitos");
    this.A.al(UB.alCambiar(() => this._chip()));
    this._chip();
    this.abierto = true;
    this.capa.classList.add("ver");
    document.body.classList.add("con-juntitos");
    this.ir(tab);
  }

  cerrar() {
    if (!this.abierto) return;
    this.abierto = false;
    this._cerrarHoja();
    this.A?.limpiar();
    this.A = null;
    this.dj?.limpiar(); this.dj = null;
    if (this.mapa) { this.mapa.m.remove(); this.mapa = null; }
    this.capa.querySelectorAll(".jt-carta-mes").forEach((n) => n.remove());
    this.capa.classList.remove("ver");
    document.body.classList.remove("con-juntitos");
  }

  /** Atrás: primero la hoja abierta, luego vuelve a Cositas, luego cierra. */
  atras() {
    if (this.hojaEl?.classList.contains("ver")) { this._cerrarHoja(); return true; }
    const carta = this.capa?.querySelector(".jt-carta-mes:not(.fuera)");
    if (carta) { carta.querySelector(".jt-x")?.click(); return true; }
    if (this.tab !== "cositas") { this.ir("cositas"); return true; }
    this.cerrar();
    return true;
  }

  _chip() { if (this.chip) this.chip.hidden = !UB.estadoUbicacion().compartiendo; }

  ir(tab) {
    if (tab === "diario") tab = "cositas"; // (Diario ya vive en Cositas → Notas)
    const ORDEN = ["cositas", "mesecitos", "mapa", "dibujar"];
    const antes = this.tab;
    this.tab = tab;
    this._parar?.();
    this._parar = null;
    this._eligiendo = false;
    this.dj?.limpiar(); this.dj = null;
    if (this.mapa) { this.mapa.m.remove(); this.mapa = null; } // un solo mapa vivo, y sólo en su pestaña
    for (const b of this.nav.children) { const on = b.dataset.k === tab; b.classList.toggle("on", on); b.setAttribute("aria-current", on ? "page" : "false"); }
    this.nav.style.setProperty("--i", String(ORDEN.indexOf(tab)));
    this.titulo.textContent = { cositas: "Nuestros días juntos", mesecitos: "Mesecitos", mapa: "Dónde estamos", dibujar: "Dibujar Juntos" }[tab];
    this.accion.replaceChildren();
    this.capa.dataset.tab = tab;
    this.vista.scrollTop = 0;
    // La página nueva entra desde el lado de la pestaña (izquierda o derecha).
    this.vista.classList.remove("entra-izq", "entra-der");
    if (!reducido() && antes && antes !== tab) { void this.vista.offsetWidth; this.vista.classList.add(ORDEN.indexOf(tab) > ORDEN.indexOf(antes) ? "entra-der" : "entra-izq"); }
    this.vista.replaceChildren(el("p.jt-cargando", { text: "Un momentito…" }));
    ({ cositas: () => this._cositas(), mesecitos: () => this._mesecitos(), mapa: () => this._mapa(), dibujar: () => this._dibujar() })[tab]();
  }

  _error(e) { this.vista.replaceChildren(el("div.jt-vacio", {}, [el("b", { text: "No se pudo cargar" }), el("p", { text: e.status === 409 ? "Primero vincúlate con tu amorcito (en el menú principal)." : e.message || "Sin conexión." }), el("button.jt-btn", { type: "button", text: "Reintentar", onClick: () => this.ir(this.tab) })])); }

  /* ── Hoja (abajo) ── */
  _hoja(titulo, hijos) {
    this.hojaEl.replaceChildren(el("div.jt-hoja-asa"), el("h3", { text: titulo }), ...hijos.filter(Boolean));
    this.velo.classList.add("ver");
    this.hojaEl.classList.add("ver");
    requestAnimationFrame(() => this.hojaEl.querySelector("textarea, input:not([type=checkbox]):not([type=range])")?.focus({ preventScroll: true }));
  }
  _cerrarHoja() { this.velo?.classList.remove("ver"); this.hojaEl?.classList.remove("ver"); }

  /* ════ Cositas ════ */
  async _cositas() {
    let d;
    try { d = await SRV.cositas(); } catch (e) { this._error(e); return; }
    if (this.tab !== "cositas") return;
    this.d = d;
    const p = d.pareja, nombre = this.pareja;
    const suyo = [p.extrano.hoy ? `te extrañó ${p.extrano.hoy === 1 ? "una vez" : p.extrano.hoy + " veces"}` : "", p.teamo.hoy ? `te dijo «te amo» ${p.teamo.hoy === 1 ? "una vez" : p.teamo.hoy + " veces"}` : ""].filter(Boolean);
    this.cartas = new Map();
    const nNotas = (d.notas?.length || 0) + (d.de_pareja?.length || 0);
    this.accion.replaceChildren(el("button.jt-accion-b", { type: "button", onClick: () => this._notas() }, [el("i", { html: ICONOS.chismes }), el("span", { text: "Notas" }), nNotas ? el("b", { text: String(nNotas) }) : null]));
    this.vista.replaceChildren(...[
      el("div.jt-hola", {}, [el("h1", { text: "Cositas Juntitos" }), el("p", { text: "Selecciona qué hacer con tu pareja o amiga/o" })]),
      suyo.length ? el("div.jt-suyo", {}, [el("i", { html: ICONOS.teamo }), el("span", { text: `Hoy ${nombre} ${suyo.join(" y ")} 💗` })]) : null,
      el("div.jt-rejilla", {}, COSAS.map((c) => { const n = this._carta(c); this.cartas.set(c.t, n); return n; })),
      el("p.jt-nota", { text: `«Te extraño» y «Te amo» le llegan a ${nombre}. Lo demás es sólo tuyo, salvo que tú lo compartas (mantén presionada una tarjeta).` }),
    ].filter(Boolean));
    for (const c of COSAS) this._pintarCarta(c);
  }

  _carta(c) {
    const b = el("button.jt-carta." + c.c, { type: "button", dataset: { t: c.t } }, [
      el("i.jt-carta-ico", { html: ICONOS[c.t] }),
      el("b.jt-carta-n", { text: c.n }),
      el("span.jt-carta-num"),
      el("span.jt-carta-ac"),
    ]);
    let largo = 0, hizoLargo = false;
    // (Al soltar después de mantener, ese «toque» no debe caer en lo que se acaba de abrir.)
    const tragarToque = () => { const f = (e) => { e.stopPropagation(); e.preventDefault(); }; addEventListener("click", f, { capture: true, once: true }); setTimeout(() => removeEventListener("click", f, { capture: true }), 700); };
    b.addEventListener("pointerdown", () => { hizoLargo = false; clearTimeout(largo); largo = setTimeout(() => { hizoLargo = true; tragarToque(); this._detalle(c); }, 520); });
    for (const t of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(t, () => clearTimeout(largo));
    b.addEventListener("contextmenu", (e) => { e.preventDefault(); this._detalle(c); });
    b.addEventListener("click", () => { if (!hizoLargo) this._usar(c, b); });
    return b;
  }

  _pintarCarta(c) {
    const b = this.cartas?.get(c.t), m = this.d?.mias?.[c.t];
    if (!b || !m) return;
    const num = b.querySelector(".jt-carta-num"), ac = b.querySelector(".jt-carta-ac");
    if (c.modo === "si") {
      num.replaceChildren(el("b", { text: m.hoy ? "¡Sí! ✓" : "Todavía no" }), el("small", { text: m.racha ? `${m.racha} ${m.racha === 1 ? "día" : "días"} seguidos` : "Sin racha" }));
      ac.textContent = m.hoy ? "Tocar si no" : "Ya me duché";
      b.classList.toggle("hecho", !!m.hoy);
    } else {
      num.replaceChildren(el("b", { text: String(m.hoy) }), el("small", { text: `hoy · ${m.total} en total` }));
      ac.textContent = c.modo === "manda" ? "Mandar" : c.modo === "escribe" ? "Escribir" : "+1";
    }
    b.setAttribute("aria-label", `${c.n}: ${c.modo === "si" ? (m.hoy ? "sí" : "todavía no") : `${m.hoy} hoy, ${m.total} en total`}. ${ac.textContent}`);
  }

  async _usar(c, b) {
    if (c.modo === "escribe") { this._escribir(c); return; }
    b.classList.add("pulso");
    setTimeout(() => b.classList.remove("pulso"), 520);
    if (!reducido() && c.modo !== "si") this._chispa(b, c.modo === "manda" ? "💗" : "+1");
    try {
      const r = await SRV.cosita(c.t);
      if (r.id) (this.ultimos[c.t] = this.ultimos[c.t] || []).push(r.id);
      this.d.mias = r.resumen;
      this._pintarCarta(c);
      if (c.modo === "manda") aviso(c.t === "extrano" ? `Le llegó a ${this.pareja}: te extraña 🥺` : `Le dijiste «te amo» a ${this.pareja} 💗`, 2200);
    } catch (e) { aviso(e.message, 3500, "error"); }
  }

  _chispa(b, txt) {
    const r = b.getBoundingClientRect();
    const s = el("i.jt-chispa", { text: txt, style: { left: r.left + r.width / 2 + "px", top: r.top + 18 + "px" } });
    this.capa.append(s);
    setTimeout(() => s.remove(), 900);
  }

  /** Mantener presionada: el detalle (compartir el contador, quitar el último). */
  _detalle(c) {
    const m = this.d?.mias?.[c.t];
    if (!m) return;
    if (c.modo === "escribe") { this._notas(c.t); return; }
    const comp = el("input", { type: "checkbox", checked: m.compartir ? "" : null });
    comp.checked = !!m.compartir;
    comp.addEventListener("change", async () => {
      try { await SRV.ajusteCosita(c.t, comp.checked); m.compartir = comp.checked; aviso(comp.checked ? `${this.pareja} ya puede ver este contador` : "Ahora es sólo tuyo", 2200); }
      catch (e) { comp.checked = !comp.checked; aviso(e.message, 3500, "error"); }
    });
    const ult = this.ultimos[c.t] || [];
    this._hoja(c.n, [
      el("p.jt-hoja-p", { text: c.modo === "si" ? `${m.hoy ? "Hoy sí" : "Hoy todavía no"} · racha de ${m.racha || 0} ${m.racha === 1 ? "día" : "días"}` : `${m.hoy} hoy · ${m.total} en total` }),
      c.modo === "manda" ? el("p.jt-hoja-p.suave", { text: `${this.pareja} siempre ve estos (es para decírselo).` }) : el("label.jt-interruptor", {}, [comp, el("span", { text: `Que ${this.pareja} vea este contador` })]),
      c.modo === "cuenta" && ult.length ? el("button.jt-btn.suave", { type: "button", text: "Quitar el último que conté", onClick: async () => {
        try { await SRV.borrarCosita(ult.pop()); this._cerrarHoja(); this.ir("cositas"); } catch (e) { aviso(e.message, 3500, "error"); }
      } }) : null,
      el("button.jt-btn", { type: "button", text: "Listo", onClick: () => this._cerrarHoja() }),
    ]);
  }

  /** Chismes, enojos y colapsos: se escriben (privados salvo que lo compartas). */
  _escribir(c) {
    const t = el("textarea.jt-campo", { rows: 4, maxlength: 600, placeholder: { chismes: "¿Qué chisme pasó?", enojos: "¿Qué te hizo enojar?", colapsos: "¿Qué pasó? Desahógate aquí…" }[c.t] });
    const comp = el("input", { type: "checkbox" });
    this._hoja(c.n, [
      t,
      el("label.jt-interruptor", {}, [comp, el("span", { text: `Compartirlo con ${this.pareja}` })]),
      el("p.jt-hoja-p.suave", { text: "Si no lo compartes, sólo tú lo ves (en Notas)." }),
      el("button.jt-btn", { type: "button", text: "Guardar", onClick: async () => {
        try {
          const r = await SRV.cosita(c.t, { nota: t.value.trim(), compartida: comp.checked });
          this.d.mias = r.resumen; this._pintarCarta(c); this._cerrarHoja();
          aviso(comp.checked ? `Guardado y compartido con ${this.pareja}` : "Guardado (sólo para ti)", 2200);
        } catch (e) { aviso(e.message, 3500, "error"); }
      } }),
    ]);
  }

  /* ════ Mesecitos ════ */
  async _mesecitos() {
    let d;
    try { d = await SRV.mesecitos(); } catch (e) { this._error(e); return; }
    if (this.tab !== "mesecitos") return;
    this.mes = d;
    if (!d.novios) {
      this.vista.replaceChildren(el("div.jt-vacio", {}, [el("i", { html: ICONOS.teamo }), el("b", { text: "¿Desde cuándo son novios?" }), el("p", { text: "Pon la fecha en tu perfil y aquí aparecerá cada mes que cumplan, con su página especial." }),
        el("button.jt-btn", { type: "button", text: "Ir a mi perfil", onClick: () => { this.cerrar(); this.app.menuPrincipal?.ir?.("perfil"); } })]));
      return;
    }
    const porMes = new Map(d.paginas.map((x) => [x.mes, x]));
    const sig = d.siguiente ? new Date(d.siguiente + "T12:00:00") : null, faltan = sig ? Math.max(0, Math.ceil((sig - Date.now()) / 86400000)) : 0;
    if (sig) this.accion.replaceChildren(el("span.jt-accion-pill", { text: faltan === 0 ? "¡Hoy cumplen! 💗" : `Faltan ${faltan} ${faltan === 1 ? "día" : "días"}` }));
    const filas = [];
    for (let n = d.meses; n >= 1; n--) {
      const p = porMes.get(n), f = mesDe(d.novios, n);
      const nueva = p && !p.mio && !p.visto;
      filas.push(el("li.jt-mes" + (p ? ".con" : "") + (n === d.meses ? ".este" : ""), {}, [
        el("div.jt-mes-n", {}, [el("b", { text: String(n) }), el("small", { text: n === 1 ? "mes" : "meses" })]),
        el("div.jt-mes-t", {}, [el("b", { text: p ? p.titulo : n === d.meses ? "¡Su mes más reciente!" : `Mes ${n}` }), el("small", { text: `${fechaLarga(f.toISOString().slice(0, 10))}${p ? ` · ${p.mio ? "la hiciste tú" : `la hizo ${this.pareja}`}` : ""}` })]),
        nueva ? el("span.jt-nuevo", { text: "¡Nueva!" }) : null,
        el("button.jt-btn" + (p ? ".suave" : ""), { type: "button", text: p ? "Abrir" : "Crear", onClick: () => (p ? this._verMes(p) : this._editarMes(n)) }),
      ]));
    }
    this.vista.replaceChildren(
      el("div.jt-mes-hero", {}, [el("small", { text: "Llevan" }), el("b", { text: `${d.meses} ${d.meses === 1 ? "mes" : "meses"} ♡` }), sig ? el("p", { text: faltan ? `El siguiente: ${fechaLarga(d.siguiente)} · faltan ${faltan} ${faltan === 1 ? "día" : "días"}` : "¡Hoy cumplen un mes más!" }) : null]),
      d.meses ? el("ul.jt-meses", {}, filas) : el("div.jt-vacio", {}, [el("b", { text: "Su primer mes ya casi llega" }), el("p", { text: "Cuando lo cumplan, aquí podrán hacerle su página especial." })]),
      el("p.jt-nota", { text: "Cada mes tiene una sola página (la hace quien llegue primero) y se guarda en su servidor para volver a verla cuando quieran." }),
    );
  }

  _editarMes(n, p = null) {
    const titulo = el("input.jt-campo", { type: "text", maxlength: 80, value: p?.titulo || `Nuestro mes ${n}`, "aria-label": "Título" });
    const texto = el("textarea.jt-campo", { rows: 6, maxlength: 4000, placeholder: "Escríbele una cartita…", "aria-label": "Carta" });
    texto.value = p?.texto || "";
    let fotos = [...(p?.fotos || [])], tema = p?.tema || "rosa";
    const caja = el("div.jt-fotos");
    const pintarFotos = () => caja.replaceChildren(...fotos.map((u, i) => el("span.jt-foto", {}, [el("img", { src: SRV.media(u), alt: "", loading: "lazy" }), el("button", { type: "button", "aria-label": "Quitar foto", html: ico("cerrar"), onClick: () => { fotos.splice(i, 1); pintarFotos(); } })])),
      ...(fotos.length < 6 ? [el("button.jt-foto-mas", { type: "button", "aria-label": "Añadir foto", html: ico("mas"), onClick: () => this._subirFoto().then((u) => { if (u) { fotos.push(u); pintarFotos(); } }) })] : []));
    pintarFotos();
    const temas = el("div.jt-temas", { role: "radiogroup", "aria-label": "Color" }, TEMAS.map(([k, nom]) => {
      const b = el("button.jt-tema." + k, { type: "button", role: "radio", title: nom, "aria-label": nom, "aria-checked": String(k === tema), onClick: () => { tema = k; for (const x of temas.children) x.setAttribute("aria-checked", String(x === b)); } });
      return b;
    }));
    this._hoja(p ? `Editar el mes ${n}` : `La página de su mes ${n}`, [
      titulo, texto, el("small.jt-et", { text: "Fotos (hasta 6)" }), caja, el("small.jt-et", { text: "Color" }), temas,
      el("button.jt-btn", { type: "button", text: p ? "Guardar cambios" : "Guardar su página", onClick: async (ev) => {
        ev.currentTarget.disabled = true;
        try {
          const pg = await SRV.ponerMesecito(n, { titulo: titulo.value, texto: texto.value, fotos, tema });
          this._cerrarHoja();
          aviso(p ? "Listo, quedó guardada" : `¡Su página del mes ${n} quedó lista! A ${this.pareja} le llega el aviso 💗`, 3200);
          this._verMes(pg);
        } catch (e) { aviso(e.message, 4000, "error"); ev.currentTarget.disabled = false; }
      } }),
    ]);
  }

  /** Una foto: se achica en este aparato si es muy grande (y se sube a su servidor). */
  _subirFoto() {
    return new Promise((ok) => {
      const i = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp", hidden: "" });
      i.addEventListener("change", async () => {
        const f = i.files?.[0];
        i.remove();
        if (!f) { ok(null); return; }
        try {
          let blob = f;
          if (f.size > 1.5e6 || f.type === "image/png") {
            const bm = await createImageBitmap(f);
            const k = Math.min(1, 1600 / Math.max(bm.width, bm.height));
            const c = document.createElement("canvas");
            c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
            c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height);
            bm.close?.();
            blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
          }
          aviso("Subiendo la foto…", 1500);
          ok((await SRV.subirMedia(blob, "foto")).u);
        } catch (e) { aviso(e.message || "No se pudo subir la foto.", 3500, "error"); ok(null); }
      }, { once: true });
      document.body.append(i);
      i.click();
    });
  }

  /** La página especial: se abre como una cartita. */
  _verMes(p) {
    const f = this.mes?.novios ? mesDe(this.mes.novios, p.mes) : null;
    const cerrar = () => { v.classList.add("fuera"); setTimeout(() => v.remove(), reducido() ? 0 : 320); };
    const v = el("article.jt-carta-mes.tema-" + p.tema, { role: "dialog", "aria-label": p.titulo }, [
      el("button.jt-x", { type: "button", "aria-label": "Cerrar", html: ico("cerrar"), onClick: cerrar }),
      el("div.jt-carta-in", {}, [
        el("small.jt-carta-mes-n", { text: `Mes ${p.mes}${f ? " · " + fechaLarga(f.toISOString().slice(0, 10)) : ""}` }),
        el("h2", { text: p.titulo }),
        p.fotos.length ? el("div.jt-carta-fotos" + (p.fotos.length === 1 ? ".una" : ""), {}, p.fotos.map((u) => el("img", { src: SRV.media(u), alt: "", loading: "lazy" }))) : null,
        p.texto ? el("p.jt-carta-txt", { text: p.texto }) : null,
        el("small.jt-carta-de", { text: p.mio ? "Hecha por ti ♡" : `Con amor, ${this.pareja} ♡` }),
        p.mio ? el("div.jt-botones", {}, [
          el("button.jt-btn.suave", { type: "button", text: "Editar", onClick: () => { cerrar(); this._editarMes(p.mes, p); } }),
          el("button.jt-btn.peligro", { type: "button", text: "Borrar", onClick: async () => {
            if (!(await confirmar(`¿Borrar la página del mes ${p.mes}? (Se puede volver a hacer.)`, "Borrar"))) return;
            try { await SRV.borrarMesecito(p.mes); cerrar(); this.ir("mesecitos"); } catch (e) { aviso(e.message, 3500, "error"); }
          } }),
        ]) : null,
      ]),
    ]);
    this.capa.append(v);
    if (!p.mio && !p.visto) SRV.mesecitoVisto(p.mes).then(() => { p.visto = new Date().toISOString(); }).catch(() => {});
  }

  /* ════ Mapa ════ */
  async _mapa() {
    const estado = el("div.jt-ub-estado");
    const caja = el("div.jt-mapa", { role: "region", "aria-label": "Mapa" }, [el("p.jt-cargando", { text: "Cargando el mapa…" })]);
    const dist = el("span.jt-mapa-dist", { hidden: "" });
    const botonCapa = el("button.jt-mapa-b", { type: "button", "aria-label": "Cambiar entre satélite y mapa", onClick: () => this._ponerCapa(this.mapa?.capa === "sat" ? "calles" : "sat") });
    const marco = el("div.jt-mapa-marco", {}, [caja, dist, el("div.jt-mapa-ctl", {}, [
      botonCapa,
      el("button.jt-mapa-b.redondo", { type: "button", "aria-label": "Ver a los dos", title: "Ver a los dos", html: CENTRAR, onClick: () => { if (this.mapa) { this.mapa.centrado = false; this._refrescarMapa(); } } }),
    ])]);
    const gente = el("div.jt-gente"), lugares = el("ul.jt-lugares"), eventos = el("ul.jt-eventos");
    this.vista.replaceChildren(estado, marco, gente,
      el("div.jt-sec", {}, [el("h2", { text: "Lugares" }), el("button.jt-btn.chico", { type: "button", text: "Añadir lugar", onClick: () => this._nuevoLugar() })]), lugares,
      el("p.jt-nota", { text: "Los avisos de entrar o salir funcionan mientras la app está abierta en el aparato de quien se mueve (la web no puede seguirte con la app cerrada; para eso hace falta la app nativa)." }),
      el("div.jt-sec", {}, [el("h2", { text: "Lo último" })]), eventos);
    const pintarEstado = () => {
      const e = UB.estadoUbicacion();
      estado.replaceChildren(e.compartiendo
        ? el("div.jt-ub.on", {}, [el("i", { html: PIN }), el("div", {}, [el("b", { text: "Estás compartiendo tu ubicación" }), el("small", { text: e.error || (e.enviado ? `Actualizada ${hace(e.enviado.t)}` : "Buscando dónde estás…") })]), el("button.jt-btn.suave.chico", { type: "button", text: "Dejar de compartir", onClick: async () => { await UB.dejar(); aviso("Dejaste de compartir: se borró tu ubicación del servidor.", 3200); this._refrescarMapa(); } })])
        : el("div.jt-ub", {}, [el("div", {}, [el("b", { text: "Tu ubicación no se comparte" }), el("small", { text: e.error || `Si quieres, ${this.pareja} podrá verla en este mapa. Puedes dejar de compartirla cuando quieras.` })]), el("button.jt-btn.chico", { type: "button", text: "Compartir mi ubicación", onClick: async () => { if (await UB.compartir()) { aviso("Compartiendo tu ubicación (sólo mientras la app está abierta)", 3200); this._refrescarMapa(); } } })]));
    };
    pintarEstado();
    this.A.al(UB.alCambiar(pintarEstado));
    this._mapaEls = { caja, gente, lugares, eventos, dist, botonCapa };
    try {
      const L = await UB.cargarMapa();
      if (this.tab !== "mapa") return;
      caja.replaceChildren();
      const m = L.map(caja, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView([19.4326, -99.1332], 4);
      L.control.zoom({ position: "bottomright", zoomInTitle: "Acercar", zoomOutTitle: "Alejar" }).addTo(m);
      m.attributionControl.setPrefix(false);
      // (Los mapas piden saber desde qué página se usan: se manda sólo el origen, nunca la dirección completa.)
      const op = { maxZoom: 19, maxNativeZoom: 18, referrerPolicy: "strict-origin-when-cross-origin" };
      const bases = {
        sat: L.layerGroup([
          L.tileLayer(SAT, { ...op, attribution: "Imágenes © Esri, Maxar, Earthstar" }),
          L.tileLayer(SAT_CALLES, { ...op, opacity: 0.85 }),
          L.tileLayer(SAT_NOMBRES, { ...op }),
        ]),
        calles: L.tileLayer(CALLES, { ...op, subdomains: "abcd", maxNativeZoom: 19, attribution: "© OpenStreetMap · © CARTO" }),
      };
      this.mapa = { L, m, bases, capa: null, capas: L.layerGroup().addTo(m), centrado: false };
      let capa = "sat";
      try { capa = localStorage.getItem(CAPA_MAPA) === "calles" ? "calles" : "sat"; } catch (e) { /* nada */ }
      this._ponerCapa(capa, false);
      m.on("click", (ev) => { if (this._eligiendo) { this._eligiendo = false; caja.classList.remove("eligiendo"); this._formLugar({ lat: ev.latlng.lat, lng: ev.latlng.lng }); } });
      this.A.al(() => { m.remove(); this.mapa = null; });
    } catch (e) { caja.replaceChildren(el("p.jt-cargando", { text: e.message })); }
    await this._refrescarMapa();
    // Mientras se ve el mapa, se pregunta cada 30 s (con la página oculta no se pregunta nada).
    this._parar = this.A.cada(() => this._refrescarMapa(), 30000);
  }

  /** Satélite (con calles y nombres) o el mapa de calles; se recuerda en este aparato. */
  _ponerCapa(capa, guardar = true) {
    const M = this.mapa, E = this._mapaEls;
    if (!M) return;
    if (M.capa && M.bases[M.capa]) M.m.removeLayer(M.bases[M.capa]);
    M.capa = capa;
    M.bases[capa].addTo(M.m);
    E?.caja.classList.toggle("sat", capa === "sat");
    if (E?.botonCapa) E.botonCapa.innerHTML = capa === "sat" ? `${MAPA}<span>Mapa</span>` : `${SATELITE}<span>Satélite</span>`;
    if (guardar) try { localStorage.setItem(CAPA_MAPA, capa); } catch (e) { /* nada */ }
  }

  async _refrescarMapa() {
    const E = this._mapaEls;
    if (!E || this.tab !== "mapa") return;
    let d;
    try { d = await SRV.ubicacion(); } catch (e) { E.gente.replaceChildren(el("p.jt-aviso", { text: "Sin conexión con su servidor: no se puede ver dónde están ahora." })); return; }
    this.ub = d;
    const persona = (quien, nom, u) => el("div.jt-persona." + quien, {}, [
      PF.avatar(quien === "yo" ? "yo" : "pareja", "jt-av"),
      el("div", {}, [el("b", { text: nom }), el("small", { text: u ? `Ahí desde ${hace(u.desde)} · actualizada ${hace(u.t)}` : quien === "yo" ? "No compartes tu ubicación" : `${this.pareja} no está compartiendo su ubicación` })]),
    ]);
    E.gente.replaceChildren(persona("yo", "Tú", d.yo), persona("pareja", this.pareja, d.pareja));
    E.lugares.replaceChildren(...(d.lugares.length ? d.lugares.map((l) => el("li.jt-lugar", {}, [
      el("div", {}, [el("b", { text: l.nombre }), el("small", { text: `${Math.round(l.radio)} m · avisa ${{ yo: "a quien llega o se va", pareja: "a su pareja", ambos: "a los dos" }[l.avisar] || ""}` })]),
      (() => { const c = el("input", { type: "checkbox", "aria-label": "Avisos de este lugar" }); c.checked = l.alertas; c.addEventListener("change", () => SRV.editarLugar(l.id, { alertas: c.checked }).then(() => aviso(c.checked ? "Avisos encendidos" : "Avisos apagados", 1600)).catch((e) => { c.checked = !c.checked; aviso(e.message, 3000, "error"); })); return el("label.jt-mini-int", { title: "Avisos" }, [c, el("span", { text: "Avisos" })]); })(),
      el("button.jt-icono", { type: "button", "aria-label": `Quitar «${l.nombre}»`, html: ico("borrar"), onClick: async () => { if (await confirmar(`¿Quitar «${l.nombre}»?`, "Quitar")) { await SRV.borrarLugar(l.id).catch((e) => aviso(e.message, 3000, "error")); this._refrescarMapa(); } } }),
    ])) : [el("li.jt-vacio-chico", { text: "Todavía no guardan lugares (casa, escuela, gimnasio…). Pueden guardar hasta 10." })]));
    E.eventos.replaceChildren(...(d.eventos.length ? d.eventos.slice(0, 8).map((x) => el("li", {}, [el("b", { text: `${x.mio ? "Tú" : this.pareja} ${x.tipo === "entro" ? (x.mio ? "llegaste a" : "llegó a") : (x.mio ? "saliste de" : "salió de")} «${x.lugar}»` }), el("small", { text: hace(x.t) })])) : [el("li.jt-vacio-chico", { text: "Aquí aparecerá cuando alguien llegue o salga de sus lugares." })]));
    // El mapa: los dos (con su foto) y sus lugares (un círculo cada uno).
    const M = this.mapa;
    if (!M) return;
    const { L, m, capas } = M;
    capas.clearLayers();
    const puntos = [];
    const marcador = (quien, u) => {
      const av = PF.avatar(quien, "jt-av-mapa");
      const icono = L.divIcon({ className: "jt-pin " + quien, html: `<span class="jt-pin-in">${av.outerHTML}</span>`, iconSize: [46, 54], iconAnchor: [23, 52] });
      L.marker([u.lat, u.lng], { icon: icono, title: quien === "yo" ? "Tú" : this.pareja }).addTo(capas).bindPopup(`<b>${quien === "yo" ? "Tú" : this.pareja.replace(/[<>&]/g, "")}</b><br>Aquí desde ${hace(u.desde)}<br><small>Actualizada ${hace(u.t)}</small>`);
      if (u.prec) L.circle([u.lat, u.lng], { radius: u.prec, color: quien === "yo" ? "#9b7bea" : "#f07aa8", weight: 1, fillOpacity: 0.08 }).addTo(capas);
      puntos.push([u.lat, u.lng]);
    };
    for (const l of d.lugares) { L.circle([l.lat, l.lng], { radius: l.radio, color: "#f2a65a", weight: 1.5, dashArray: "4 4", fillOpacity: 0.1 }).addTo(capas).bindTooltip(l.nombre); puntos.push([l.lat, l.lng]); }
    if (d.yo) marcador("yo", d.yo);
    if (d.pareja) marcador("pareja", d.pareja);
    // Los dos a la vista: un hilito entre ustedes y a cuánto están.
    if (d.yo && d.pareja) {
      L.polyline([[d.yo.lat, d.yo.lng], [d.pareja.lat, d.pareja.lng]], { color: "#ff8fbf", weight: 3, opacity: 0.9, dashArray: "2 9", lineCap: "round", interactive: false }).addTo(capas);
      const km = m.distance([d.yo.lat, d.yo.lng], [d.pareja.lat, d.pareja.lng]) / 1000;
      E.dist.textContent = `💞 ${km < 1 ? `a ${Math.max(1, Math.round(km * 1000))} m` : `a ${km < 10 ? km.toFixed(1) : Math.round(km)} km`} de ${this.pareja}`;
      E.dist.hidden = false;
    } else E.dist.hidden = true;
    if (!M.centrado && puntos.length) { M.centrado = true; if (puntos.length === 1) m.setView(puntos[0], 15); else m.fitBounds(puntos, { padding: [40, 40], maxZoom: 16 }); }
  }

  _nuevoLugar() {
    if ((this.ub?.lugares?.length || 0) >= 10) { aviso("Ya tienen 10 lugares: quita alguno para añadir otro.", 3200); return; }
    this._hoja("Añadir lugar", [
      el("p.jt-hoja-p", { text: "Elige dónde está:" }),
      el("button.jt-btn", { type: "button", text: "Tocar el lugar en el mapa", onClick: () => { this._cerrarHoja(); if (!this.mapa) { aviso("El mapa no cargó: usa tu ubicación actual.", 3000); return; } this._eligiendo = true; this._mapaEls.caja.classList.add("eligiendo"); this._mapaEls.caja.scrollIntoView({ behavior: reducido() ? "auto" : "smooth", block: "center" }); aviso("Toca el mapa donde está el lugar", 2600); } }),
      el("button.jt-btn.suave", { type: "button", text: "Usar mi ubicación actual", onClick: () => {
        if (!UB.puede()) { aviso("Este navegador no da la ubicación.", 3000, "error"); return; }
        navigator.geolocation.getCurrentPosition((p) => this._formLugar({ lat: p.coords.latitude, lng: p.coords.longitude }), (e) => aviso(e.code === 1 ? "No diste permiso de ubicación." : "No se pudo saber dónde estás.", 3200, "error"), { enableHighAccuracy: true, timeout: 20000 });
      } }),
    ]);
  }

  _formLugar(pos) {
    const nombre = el("input.jt-campo", { type: "text", maxlength: 40, placeholder: "Casa, escuela, gimnasio…", "aria-label": "Nombre del lugar" });
    const radio = el("input", { type: "range", min: 50, max: 2000, step: 25, value: 150, "aria-label": "Radio" }), rt = el("b", { text: "150 m" });
    radio.addEventListener("input", () => { rt.textContent = radio.value + " m"; });
    const avisar = el("select.jt-campo", { "aria-label": "A quién avisar" }, [["pareja", "A su pareja"], ["yo", "A quien llega o se va"], ["ambos", "A los dos"]].map(([v, t]) => el("option", { value: v, text: t })));
    const alertas = el("input", { type: "checkbox" });
    alertas.checked = true;
    this._hoja("Nuevo lugar", [
      nombre,
      el("label.jt-rango", {}, [el("span", { text: "Tamaño de la zona" }), radio, rt]),
      el("label.jt-fila", {}, [el("span", { text: "Cuando alguien entra o sale, avisar…" }), avisar]),
      el("label.jt-interruptor", {}, [alertas, el("span", { text: "Avisos encendidos" })]),
      el("button.jt-btn", { type: "button", text: "Guardar lugar", onClick: async () => {
        if (!nombre.value.trim()) { nombre.focus(); aviso("Ponle un nombre", 1800); return; }
        try { await SRV.nuevoLugar({ nombre: nombre.value, lat: pos.lat, lng: pos.lng, radio: +radio.value, avisar: avisar.value, alertas: alertas.checked }); this._cerrarHoja(); aviso(`«${nombre.value.trim()}» guardado`, 2000); if (this.mapa) this.mapa.centrado = false; this._refrescarMapa(); }
        catch (e) { aviso(e.message, 3500, "error"); }
      } }),
    ]);
  }

  /* ════ Notas (lo que era Diario): tus chismes, enojos y colapsos, y lo que tu amorcito te compartió ════ */
  async _notas(tipo = null) {
    try { const n = await SRV.cositas(); this.d = { ...(this.d || {}), ...n }; } catch (e) { if (!this.d) { aviso(e.message, 3000, "error"); return; } }
    const d = this.d;
    const nombreTipo = { chismes: "Chisme", enojos: "Enojo", colapsos: "Colapso" };
    const de = (l) => (tipo ? l.filter((x) => x.tipo === tipo) : l);
    const fila = (x, mio) => {
      const comp = el("input", { type: "checkbox", "aria-label": `Compartir con ${this.pareja}` });
      comp.checked = x.compartida;
      comp.addEventListener("change", () => SRV.compartirCosita(x.id, comp.checked).then(() => { x.compartida = comp.checked; aviso(comp.checked ? `Compartido con ${this.pareja}` : "Ahora es sólo tuyo", 1800); }).catch((e) => { comp.checked = !comp.checked; aviso(e.message, 3000, "error"); }));
      const li = el("li.jt-entrada." + x.tipo, {}, [
        el("i", { html: ICONOS[x.tipo] }),
        el("div", {}, [el("small", { text: `${nombreTipo[x.tipo]} · ${fechaLarga(x.dia)}` }), el("p", { text: x.nota || "(sin nota)" })]),
        mio ? el("div.jt-entrada-ac", {}, [el("label.jt-mini-int", {}, [comp, el("span", { text: "Compartir" })]),
          el("button.jt-icono", { type: "button", "aria-label": "Borrar", html: ico("borrar"), onClick: async () => {
            if (!(await confirmar("¿Borrar esta nota?", "Borrar"))) return;
            try { const r = await SRV.borrarCosita(x.id); d.notas = d.notas.filter((y) => y.id !== x.id); if (r?.resumen) d.mias = r.resumen; li.remove(); } catch (e) { aviso(e.message, 3000, "error"); }
          } })]) : null,
      ]);
      return li;
    };
    const mias = de(d.notas || []), suyas = de(d.de_pareja || []);
    this._hoja(tipo ? `${{ chismes: "Chismes", enojos: "Enojos", colapsos: "Colapsos" }[tipo]}` : "Notas", [
      tipo ? el("button.jt-btn", { type: "button", text: "Escribir otra", onClick: () => this._escribir(COSAS.find((c) => c.t === tipo)) }) : null,
      el("b.jt-hoja-sub", { text: "Lo que escribiste" }),
      mias.length ? el("ul.jt-entradas", {}, mias.map((x) => fila(x, true))) : el("p.jt-vacio-chico", { text: "Todavía nada. Sólo tú lo ves, salvo que lo compartas." }),
      el("b.jt-hoja-sub", { text: `Lo que ${this.pareja} te compartió` }),
      suyas.length ? el("ul.jt-entradas", {}, suyas.map((x) => fila(x, false))) : el("p.jt-vacio-chico", { text: "Todavía nada." }),
    ]);
  }

  /* ════ Dibujar Juntos ════ */
  _dibujar() {
    if (!PF.datos().pareja) { this.vista.replaceChildren(el("div.jt-vacio", {}, [el("b", { text: "Para dibujar juntos" }), el("p", { text: "Primero vincúlate con tu amorcito (en el menú principal)." })])); return; }
    this.dj = new DibujoJuntos(this.app, { pareja: this.pareja, hoja: (t, h) => this._hoja(t, h), cerrarHoja: () => this._cerrarHoja() });
    this.dj.montar(this.vista);
  }
}
