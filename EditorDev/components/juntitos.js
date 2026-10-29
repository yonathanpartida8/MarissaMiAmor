/**
 * COSITAS JUNTITOS (Fase 38) — «Nuestros días juntos»: lo de todos los días de los dos.
 *
 * Se abre al tocar los días juntos del menú principal. Desde la Fase 43 sale primero EL MAPA (de fondo)
 * y encima una hojita que se desliza de abajo hacia arriba, con botones cuadrados que abren cada cosa en
 * su pestañita (y «Nuestra casita» y «Promesa», en construcción); más abajo, dónde están y sus lugares:
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
 * Cada pestañita tiene sus cosas arriba a la derecha: en Cositas, «Notas» (lo que escribiste y lo que tu
 * amorcito te compartió, lo que antes era Diario); en Mesecitos, cuánto falta para el siguiente.
 * Todo vive en su M.YNTHN (servidor 1.14.0): nada se inventa ni se queda «de adorno».
 *
 * Fase 46: una barrita de abajo (Mapa · Cositas · Mesecitos · Dibujar) cambia de sección desde donde sea;
 * TODO lo del mapa vive en su hojita (cuántos kilómetros los separan, mensajitos rápidos con su sonido
 * —components/rapiditos.js—, dónde están, sus lugares para añadir, editar o quitar, y quién llegó o salió);
 * Mesecitos es nuevo: su anillo del mes con los cumpleaños debajo, sus meses como fotitos, su momento
 * favorito del mes, la cápsula del tiempo (sellada hasta su día) y los planes para celebrar (servidor 1.19.0).
 */
import { el, aviso, confirmar } from "./ui.js";
import { ico } from "./iconos.js";
import * as SRV from "../integraciones/servidor.js";
import * as PF from "./perfil.js";
import * as UB from "./ubicacion.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { ambito } from "./rendimiento.js";
import * as RAP from "./rapiditos.js";

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
const CALENDARIO = svg('<rect x="5" y="7" width="22" height="20" rx="4"/><path d="M5 13h22M11 4.5v5M21 4.5v5"/><path d="M16 23.4s-4-2.4-4-5a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2.6-4 5-4 5z" fill="currentColor" fill-opacity=".25"/>');
const PINCEL = svg('<path d="M5 27c3 0 5-1.5 5-4a3 3 0 0 0-3-3c-2 0-3 1.6-3 3.5 0 1.6-.6 2.6-2 3.5z" fill="currentColor" fill-opacity=".2"/><path d="M10 21L25.5 5.5a2.1 2.1 0 0 1 3 3L13 24"/>');
const CASITA = svg('<path d="M5 15L16 6l11 9"/><path d="M8 13v13h16V13"/><path d="M16 23.6s-3.4-2-3.4-4.2a1.7 1.7 0 0 1 3.4-.9 1.7 1.7 0 0 1 3.4.9c0 2.2-3.4 4.2-3.4 4.2z" fill="currentColor" fill-opacity=".3"/>');
const PROMESA = svg('<path d="M9.5 18.5c-2-1.6-3.2-3.6-3.2-5.6a3.6 3.6 0 0 1 6.4-2.3"/><path d="M22.5 18.5c2-1.6 3.2-3.6 3.2-5.6a3.6 3.6 0 0 0-6.4-2.3"/><path d="M11 21.5c1.6 1.8 3.2 3 5 4 1.8-1 3.4-2.2 5-4"/><path d="M13 16.5h6M14 13.8l2-2 2 2"/>');
/** Fase 46: la barrita de abajo (lo que antes eran los botones cuadrados de la hojita). */
const PESTANAS = ["inicio", "cositas", "mesecitos", "dibujar"];
const PRONTO = [
  ["casita", "Nuestra casita", "durazno", "Una casita de los dos para decorar juntitos, cuarto por cuarto, con sus fotos y sus cosas."],
  ["promesa", "Promesa", "cielo", "Sus promesas de amor, guardaditas con su fecha, para cumplirlas y recordarlas."],
];
const TITULOS = { cositas: "Cositas Juntitos", mesecitos: "Mesecitos", dibujar: "Dibujar Juntos", casita: "Nuestra casita", promesa: "Promesa" };
const PIN = svg('<path d="M16 28s-8.5-7.6-8.5-14.3a8.5 8.5 0 0 1 17 0C24.5 20.4 16 28 16 28z"/><circle cx="16" cy="13.6" r="3.2"/>');
// El mapa (Fase 39): satélite con calles y nombres encima (lindo y claro), o el mapa de calles.
const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_NOMBRES = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SAT_CALLES = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
// (Fase 45) Las calles, de Esri (sin clave). Las de CARTO ahora piden una clave y salían con «API KEY REQUIRED».
const CALLES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const CAPA_MAPA = "editordev:mapa-capa";
const SATELITE = svg('<circle cx="16" cy="16" r="11"/><path d="M5 16h22M16 5c3.5 3.2 5 7 5 11s-1.5 7.8-5 11c-3.5-3.2-5-7-5-11s1.5-7.8 5-11z"/>');
const MAPA = svg('<path d="M4 8.5l8-3.5 8 3.5 8-3.5v18.5l-8 3.5-8-3.5-8 3.5z"/><path d="M12 5v18.5M20 8.5V27"/>');
const CENTRAR = svg('<circle cx="16" cy="16" r="5"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5"/>');
const TEMAS = [["rosa", "Rosa"], ["lila", "Lila"], ["durazno", "Durazno"], ["menta", "Menta"], ["noche", "Noche"]];
// (Una fecha «AAAA-MM-DD» se lee en la hora de este aparato; un Date se usa tal cual: nunca con toISOString,
// que la pasa a la hora de Londres y en la noche de México o EE. UU. daba el día de mañana.)
const fechaLarga = (s) => (s ? (s instanceof Date ? s : new Date(s.length === 10 ? s + "T12:00:00" : s)).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "");
const hace = (iso) => {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
};
/** Kilómetros entre dos puntos (sobre la Tierra; sin depender del mapa). */
function kmEntre(a, b) {
  const r = Math.PI / 180, x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(x)));
}
/** «350 m», «4.2 km», «1,234 km» (y en millas si alguno de los dos vive en EE. UU.). */
function textoDistancia(km, millas = false) {
  const t = km < 1 ? `${Math.max(1, Math.round(km * 1000))} m` : `${km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString("es-MX")} km`;
  return millas && km >= 1 ? `${t} (${(km * 0.621371 < 10 ? (km * 0.621371).toFixed(1) : Math.round(km * 0.621371).toLocaleString("es-MX"))} mi)` : t;
}
const usaMillas = () => { const d = PF.datos(); return d.yo?.pais === "US" || d.pareja?.pais === "US" || /-US$/i.test(navigator.language || ""); };

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

  /**
   * Fase 43: el mapa primero, de fondo; encima, una hojita que se desliza de abajo hacia arriba con los
   * botones cuadrados (Cositas Juntitos, Mesecitos, Dibujar Juntos y, debajo, lo que viene: Nuestra
   * casita y Promesa); más abajo, dónde están, sus lugares y lo último. Cada botón abre su pestañita.
   */
  _montar() {
    this.fondo = el("div.jt-fondo", { role: "region", "aria-label": "Mapa" });
    this.dist = el("span.jt-mapa-dist", { hidden: "" });
    this.botonCapa = el("button.jt-mapa-b", { type: "button", "aria-label": "Cambiar entre satélite y mapa", onClick: () => this._ponerCapa(this.mapa?.capa === "sat" ? "calles" : "sat") });
    const ctl = el("div.jt-fondo-ctl", {}, [this.botonCapa, el("button.jt-mapa-b.redondo", { type: "button", "aria-label": "Ver a los dos", title: "Ver a los dos", html: CENTRAR, onClick: () => { if (this.mapa) { this.mapa.centrado = false; this._refrescarMapa(); } } })]);
    this.titulo = el("b.jt-cab-t", { text: "Nuestros días juntos" });
    this.chip = el("button.jt-chip", { type: "button", hidden: "", onClick: () => this._hojaIr("alto", true) }, [el("i", { html: PIN }), el("span", { text: "Compartiendo ubicación" })]);
    const cab = el("header.jt-cab.flota", {}, [el("button.jt-atras", { type: "button", "aria-label": "Atrás", html: ico("izquierda"), onClick: () => this.atras() }), this.titulo, this.chip]);
    // La hojita de abajo.
    this.sheetCuerpo = el("div.jt-sheet-cuerpo");
    this.sheet = el("section.jt-sheet", { "aria-label": "Nuestras cositas" }, [el("button.jt-sheet-asa", { type: "button", "aria-label": "Subir o bajar la hojita" }, [el("i")]), this.sheetCuerpo]);
    // La pestañita de cada botón.
    this.secTit = el("b.jt-cab-t");
    this.accion = el("div.jt-accion");
    this.vista = el("main.jt-vista");
    this.secPanel = el("section.jt-secpanel", { role: "dialog", "aria-modal": "true" }, [el("header.jt-cab", {}, [el("button.jt-atras", { type: "button", "aria-label": "Volver al mapa", html: ico("izquierda"), onClick: () => this.inicio() }), this.secTit, this.accion]), this.vista]);
    this.velo = el("div.jt-velo", { onClick: () => this._cerrarHoja() });
    this.hojaEl = el("section.jt-hoja", { role: "dialog", "aria-modal": "true" });
    // Fase 46: la barrita de abajo, siempre a la mano (cambia de sección sin volver al mapa).
    const icono = { inicio: MAPA, cositas: ICONOS.teamo, mesecitos: CALENDARIO, dibujar: PINCEL };
    this.nav = el("nav.jt-nav.v46", { "aria-label": "Secciones" }, PESTANAS.map((k) => el("button.jt-tab", { type: "button", dataset: { k }, onClick: () => (k === "inicio" ? this._alMapa() : this.ir(k)) },
      [el("i", { html: icono[k] }), el("span", { text: { inicio: "Mapa", cositas: "Cositas", mesecitos: "Mesecitos", dibujar: "Dibujar" }[k] })])));
    this.capa = el("div.jt-capa.v43.v46", { role: "dialog", "aria-label": "Nuestros días juntos" }, [this.fondo, ctl, this.dist, cab, this.sheet, this.secPanel, this.nav, this.velo, this.hojaEl]);
    // Lo que llega solo (un mensajito rápido, alguien que llegó o salió) se ve al momento en el mapa.
    for (const t of ["ed-toques", "ed-lugares"]) addEventListener(t, () => { if (this.abierto && this.tab === "inicio") { this._pintarRapidos?.(); if (t === "ed-lugares") this._refrescarMapa(); } });
    document.body.append(this.capa);
    this._gestosHoja();
  }

  abrir(tab = "inicio") {
    if (!SRV.conectado()) { aviso(`Entra a tu ${SRV.NOMBRE} y vincúlate con tu amorcito para usar Cositas Juntitos.`, 4200); return; }
    if (!this.capa) this._montar();
    this.A?.limpiar();
    this.A = ambito("juntitos");
    this.A.al(UB.alCambiar(() => { this._chip(); this._pintarUb?.(); }));
    // Mientras está abierto (y a la vista), el latido va cada 8 s: mensajitos rápidos y llegadas, casi al momento.
    this.A.cada(() => this.app.latir?.(), 8000);
    this._chip();
    this.abierto = true;
    this.capa.classList.add("ver");
    document.body.classList.add("con-juntitos");
    this.tab = "inicio";
    this._marcar("inicio");
    this._inicio();
    if (tab === "mapa" || tab === "inicio") this._hojaIr(tab === "mapa" ? "alto" : "bajo", false);
    else { this._hojaIr("bajo", false); this.ir(tab); }
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
    this.secPanel.classList.remove("ver");
    this.capa.classList.remove("ver");
    document.body.classList.remove("con-juntitos");
  }

  /** Atrás: primero la hoja abierta, luego la pestañita (vuelve al mapa), luego cierra. */
  atras() {
    if (this.hojaEl?.classList.contains("ver")) { this._cerrarHoja(); return true; }
    const carta = this.capa?.querySelector(".jt-carta-mes:not(.fuera)");
    if (carta) { carta.querySelector(".jt-x")?.click(); return true; }
    if (this.tab !== "inicio") { this.inicio(); return true; }
    if (this._hojaPos === "alto") { this._hojaIr("bajo", true); return true; }
    this.cerrar();
    return true;
  }

  _chip() { if (this.chip) this.chip.hidden = !UB.estadoUbicacion().compartiendo; }

  /** Abre la pestañita de un botón (Cositas, Mesecitos, Dibujar, o lo que viene). */
  ir(tab) {
    if (tab === "diario") tab = "cositas"; // (Diario ya vive en Cositas → Notas)
    if (tab === "mapa" || tab === "inicio") { this.inicio(); if (tab === "mapa") this._hojaIr("alto", true); return; }
    const antes = this.tab;
    this.tab = tab;
    this._marcar(tab);
    this._parar?.(); this._parar = null;
    this.dj?.limpiar(); this.dj = null;
    this.secTit.textContent = TITULOS[tab] || "";
    // (Entre pestañas, la página entra desde el lado de la que tocaste; desde el mapa, sube como siempre.)
    if (antes !== "inicio" && this.secPanel.classList.contains("ver") && !reducido()) {
      const d = PESTANAS.indexOf(tab === "casita" || tab === "promesa" ? "cositas" : tab) - PESTANAS.indexOf(antes === "casita" || antes === "promesa" ? "cositas" : antes);
      this.vista.classList.remove("entra-der", "entra-izq"); void this.vista.offsetWidth;
      if (d) this.vista.classList.add(d > 0 ? "entra-der" : "entra-izq");
    }
    this.accion.replaceChildren();
    this.capa.dataset.tab = tab;
    this.vista.scrollTop = 0;
    this.vista.replaceChildren(el("p.jt-cargando", { text: "Un momentito…" }));
    this.secPanel.classList.add("ver");
    ({ cositas: () => this._cositas(), mesecitos: () => this._mesecitos(), dibujar: () => this._dibujar(), casita: () => this._pronto("casita"), promesa: () => this._pronto("promesa") })[tab]?.();
  }

  /** La barrita: cuál está elegida (la pastillita se desliza hasta ella). */
  _marcar(tab) {
    const k = tab === "casita" || tab === "promesa" ? "cositas" : tab;
    const i = Math.max(0, PESTANAS.indexOf(k));
    this.nav?.style.setProperty("--i", i);
    for (const b of this.nav?.children || []) { const on = b.dataset.k === k; b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); }
  }

  /** «Mapa» en la barrita: si ya estás en el mapa, sube su hojita (todo lo del mapa). */
  _alMapa() {
    if (this.tab === "inicio") { this._hojaIr(this._hojaPos === "alto" ? "bajo" : "alto", true); return; }
    this.inicio();
  }

  /** De vuelta al mapa con su hojita. */
  inicio() {
    this._marcar("inicio");
    this.tab = "inicio";
    this.capa.dataset.tab = "inicio";
    this.dj?.limpiar(); this.dj = null;
    this.secPanel.classList.remove("ver");
    this._refrescarMapa();
    if (!this._parar && this.A) this._parar = this.A.cada(() => this._refrescarMapa(), 30000);
  }

  /** Lo que viene (en construcción): se ve lo que será, con cariño y sin botones de adorno. */
  _pronto(k) {
    const x = PRONTO.find((y) => y[0] === k);
    this.vista.replaceChildren(el("div.jt-pronto-pag", {}, [
      el("div.jt-pronto-ico." + x[2], { html: k === "casita" ? CASITA : PROMESA }),
      el("h1", { text: x[1] }),
      el("span.jt-pronto-tag", { text: "🚧 En construcción" }),
      el("p", { text: x[3] }),
      el("p.jt-nota", { text: "La estamos construyendo con mucho amor 🛠️💗 Cuando esté lista aparecerá aquí sola, sin que tengan que hacer nada." }),
    ]));
  }

  /* ── La hojita de abajo: se jala hacia arriba (todo) o hacia abajo (el mapa) ── */
  _hojaIr(pos, anim) {
    const s = this.sheet;
    if (!s) return;
    this._hojaPos = pos;
    const H = this.capa.clientHeight || innerHeight, alto = s.offsetHeight || H * 0.88;
    const y = pos === "alto" ? 0 : Math.max(0, alto - Math.max(250, Math.round(H * 0.42)));
    s.classList.toggle("anim", !!anim && !reducido());
    s.classList.toggle("arriba", pos === "alto");
    s.style.transform = `translate3d(0, ${y}px, 0)`;
    if (pos === "bajo") this.sheetCuerpo.scrollTop = 0;
  }

  _gestosHoja() {
    const s = this.sheet, asa = s.querySelector(".jt-sheet-asa");
    let g = null;
    const yDe = () => { const m = /translate3d\(0(?:px)?, ([\d.-]+)px/.exec(s.style.transform); return m ? +m[1] : 0; };
    const empezar = (e) => { if (e.button > 0) return; g = { id: e.pointerId, y0: e.clientY, base: yDe(), movio: false, vy: 0, uy: e.clientY, ut: performance.now() }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } };
    const mover = (e) => {
      if (!g || g.id !== e.pointerId) return;
      const dy = e.clientY - g.y0;
      if (Math.abs(dy) > 5) g.movio = true;
      const t = performance.now();
      if (t > g.ut) { g.vy = 0.7 * g.vy + 0.3 * ((e.clientY - g.uy) / (t - g.ut)); g.uy = e.clientY; g.ut = t; }
      s.classList.remove("anim");
      s.style.transform = `translate3d(0, ${Math.max(0, Math.min(s.offsetHeight - 120, g.base + dy))}px, 0)`;
    };
    const soltar = (e) => {
      if (!g || g.id !== e.pointerId) return;
      const x = g; g = null;
      if (!x.movio) { this._hojaIr(this._hojaPos === "alto" ? "bajo" : "alto", true); return; }
      const y = yDe();
      this._hojaIr(x.vy < -0.3 ? "alto" : x.vy > 0.3 ? "bajo" : y < s.offsetHeight * 0.3 ? "alto" : "bajo", true);
    };
    for (const n of [asa]) { n.addEventListener("pointerdown", empezar); n.addEventListener("pointermove", mover); n.addEventListener("pointerup", soltar); n.addEventListener("pointercancel", soltar); }
    // Desplazar lo de adentro estando abajo la sube; ya arriba, jalar hacia abajo desde el tope la baja.
    this.sheetCuerpo.addEventListener("scroll", () => { if (this._hojaPos !== "alto" && this.sheetCuerpo.scrollTop > 6) this._hojaIr("alto", true); }, { passive: true });
    let y0 = null;
    this.sheetCuerpo.addEventListener("touchstart", (e) => { y0 = this.sheetCuerpo.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    this.sheetCuerpo.addEventListener("touchmove", (e) => { if (y0 != null && this._hojaPos === "alto" && e.touches[0].clientY - y0 > 70) { y0 = null; this._hojaIr("bajo", true); } }, { passive: true });
    addEventListener("resize", () => { if (this.abierto) this._hojaIr(this._hojaPos || "bajo", false); });
  }

  /* ── Lo de inicio: el mapa de fondo y su hojita con TODO lo del mapa (Fase 46) ── */
  _inicio() {
    const estado = el("div.jt-ub-estado"), gente = el("div.jt-gente"), lugares = el("ul.jt-lugares"), eventos = el("ul.jt-eventos");
    const d = PF.datos(), j = PF.juntos(d.pareja?.novios || d.yo?.novios), pr = PF.proximo(d);
    // Cuántos kilómetros los separan (se llena con su ubicación; si falta alguien, dice qué falta).
    const km = el("div.jt-km", { "aria-live": "polite" }, [el("p.jt-km-vacio", { text: "Buscando dónde están…" })]);
    // Los mensajitos rápidos: le llegan de verdad, con su sonido.
    const rapidos = el("div.jt-rapidos", { role: "group", "aria-label": "Mensajitos rápidos" }, RAP.TOQUES.map((t) => el("button.jt-rapido." + t.c, { type: "button", dataset: { t: t.id }, onClick: (ev) => this._rapido(t, ev.currentTarget) },
      [el("span.jt-rapido-e", { text: t.e, "aria-hidden": "true" }), el("b", { text: t.n })])));
    const ultimos = el("ul.jt-rap-lista");
    this.sheetCuerpo.replaceChildren(
      el("div.jt-nosotros", {}, [
        el("div.jt-dos", { "aria-hidden": "true" }, [PF.avatar("yo", "jt-av"), PF.avatar("pareja", "jt-av")]),
        el("div.jt-nosotros-t", {}, [
          el("b", { text: `Tú y ${this.pareja}` }),
          el("span", { text: j ? `${j.dias.toLocaleString("es-MX")} ${j.dias === 1 ? "día" : "días"} juntos` : "Pon en tu perfil desde cuándo son novios" }),
          pr ? el("small", { text: pr.texto }) : null,
        ]),
      ]),
      km,
      el("section.jt-bloque", {}, [el("h2.jt-bloque-t", {}, [el("span", { text: "Mensajitos rápidos" }), el("small", { text: `Le llegan a ${this.pareja} al instante` })]), rapidos, ultimos]),
      el("section.jt-bloque", {}, [el("h2.jt-bloque-t", {}, [el("span", { text: "Dónde estamos" })]), estado, gente]),
      el("section.jt-bloque", {}, [
        el("div.jt-sec", {}, [el("h2.jt-bloque-t", {}, [el("span", { text: "Nuestros lugares" }), el("small", { text: "Avisan cuando alguien llega o sale" })]), el("button.jt-btn.chico", { type: "button", text: "+ Añadir", onClick: () => this._nuevoLugar() })]),
        lugares,
      ]),
      el("section.jt-bloque", {}, [el("h2.jt-bloque-t", {}, [el("span", { text: "Llegadas y salidas" })]), eventos]),
      el("p.jt-nota", { text: "Los avisos de llegar o salir funcionan mientras la app está abierta en el aparato de quien se mueve (la web no puede seguirte con la app cerrada; para eso hará falta la app nativa)." }),
    );
    this._pintarUb = () => {
      const e = UB.estadoUbicacion();
      estado.replaceChildren(e.compartiendo
        ? el("div.jt-ub.on", {}, [el("i", { html: PIN }), el("div", {}, [el("b", { text: "Estás compartiendo tu ubicación" }), el("small", { text: e.error || (e.enviado ? `Actualizada ${hace(e.enviado.t)}` : "Buscando dónde estás…") })]), el("button.jt-btn.suave.chico", { type: "button", text: "Dejar de compartir", onClick: async () => { await UB.dejar(); aviso("Dejaste de compartir: se borró tu ubicación del servidor.", 3200); this._refrescarMapa(); } })])
        : el("div.jt-ub", {}, [el("div", {}, [el("b", { text: "Tu ubicación no se comparte" }), el("small", { text: e.error || `Si quieres, ${this.pareja} podrá verla en este mapa. Puedes dejar de compartirla cuando quieras.` })]), el("button.jt-btn.chico", { type: "button", text: "Compartir mi ubicación", onClick: async () => { if (await UB.compartir()) { aviso("Compartiendo tu ubicación (sólo mientras la app está abierta)", 3200); this._refrescarMapa(); } } })]));
    };
    this._pintarUb();
    // Lo último de los mensajitos (de los dos), sin parpadear: sólo se repinta si cambió.
    let firmaRap = "";
    this._pintarRapidos = async () => {
      let l;
      try { l = await RAP.historial(); } catch (e) { return; }
      const f = l.slice(0, 4).map((x) => x.id).join(",");
      if (f === firmaRap || !ultimos.isConnected) return;
      firmaRap = f;
      ultimos.replaceChildren(...l.slice(0, 4).map((x) => { const t = RAP.toque(x.tipo); return el("li.jt-rap-item" + (x.mio ? ".mio" : ""), {}, [
        el("span", { text: t.e, "aria-hidden": "true" }),
        el("div", {}, [el("b", { text: x.mio ? t.mia : `${this.pareja} ${t.frase}` }), x.texto ? el("p", { text: x.texto }) : null]),
        el("small", { text: hace(x.t) }),
      ]); }));
    };
    this._pintarRapidos();
    this._mapaEls = { caja: this.fondo, gente, lugares, eventos, dist: this.dist, botonCapa: this.botonCapa, km };
    this._mapaFondo();
  }

  /** Un mensajito rápido: «Escribir» abre su cajita; los otros salen al tocarlos. */
  async _rapido(t, b) {
    if (t.id === "propio") {
      const txt = el("textarea.jt-campo", { rows: 3, maxlength: 140, placeholder: `Escríbele algo bonito a ${this.pareja}…`, "aria-label": "Tu mensajito" });
      const cuenta = el("small.jt-cuenta", { text: "0 / 140" });
      txt.addEventListener("input", () => { cuenta.textContent = `${txt.value.length} / 140`; });
      const mandarB = el("button.jt-btn", { type: "button", text: "Mandar 💌", onClick: async () => {
        const v = txt.value.trim();
        if (!v) { txt.focus(); aviso("Escribe tu mensajito", 1800); return; }
        mandarB.disabled = true;
        try { await RAP.mandar(this.app, "propio", v); this._cerrarHoja(); aviso(`Le llegó tu mensajito a ${this.pareja} 💌`, 2400); this._pintarRapidos?.(); }
        catch (e) { aviso(e.message, 3500, "error"); mandarB.disabled = false; }
      } });
      this._hoja("Un mensajito para " + this.pareja, [txt, cuenta, mandarB]);
      return;
    }
    if (b.disabled) return;
    b.disabled = true;
    b.classList.remove("pulso"); void b.offsetWidth; b.classList.add("pulso");
    if (!reducido()) this._chispa(b, t.e);
    try { await RAP.mandar(this.app, t.id); aviso(`${t.mia} a ${this.pareja} ${t.e}`, 2200); this._pintarRapidos?.(); }
    catch (e) { aviso(e.message, 3500, "error"); }
    finally { setTimeout(() => { b.disabled = false; }, 700); }
  }

  async _mapaFondo() {
    const caja = this.fondo;
    if (this.mapa) { this._refrescarMapa(); return; }
    caja.replaceChildren(el("p.jt-cargando", { text: "Cargando el mapa…" }));
    try {
      const L = await UB.cargarMapa();
      if (!this.abierto) return;
      caja.replaceChildren();
      const m = L.map(caja, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView([19.4326, -99.1332], 4);
      L.control.zoom({ position: "topleft", zoomInTitle: "Acercar", zoomOutTitle: "Alejar" }).addTo(m);
      m.attributionControl.setPrefix(false);
      // (Los mapas piden saber desde qué página se usan: se manda sólo el origen, nunca la dirección completa.)
      const op = { maxZoom: 19, maxNativeZoom: 18, referrerPolicy: "strict-origin-when-cross-origin" };
      const bases = {
        sat: L.layerGroup([
          L.tileLayer(SAT, { ...op, attribution: "Imágenes © Esri, Maxar, Earthstar" }),
          L.tileLayer(SAT_CALLES, { ...op, opacity: 0.85 }),
          L.tileLayer(SAT_NOMBRES, { ...op }),
        ]),
        calles: L.tileLayer(CALLES, { ...op, attribution: "Mapa © Esri, HERE, Garmin, OpenStreetMap" }),
      };
      this.mapa = { L, m, bases, capa: null, capas: L.layerGroup().addTo(m), centrado: false };
      let capa = "sat";
      try { capa = localStorage.getItem(CAPA_MAPA) === "calles" ? "calles" : "sat"; } catch (e) { /* nada */ }
      this._ponerCapa(capa, false);
      m.on("click", (ev) => { if (this._eligiendo) { this._eligiendo = false; caja.classList.remove("eligiendo"); this._formLugar({ lat: ev.latlng.lat, lng: ev.latlng.lng }); } });
      this.A?.al(() => { m.remove(); this.mapa = null; });
    } catch (e) { caja.replaceChildren(el("p.jt-cargando", { text: e.message })); }
    await this._refrescarMapa();
    // Mientras se ve el mapa, se pregunta cada 30 s (con la página oculta no se pregunta nada).
    this._parar = this.A?.cada(() => this._refrescarMapa(), 30000);
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
      // (Lo que viene, chiquito y aparte: antes vivía en la hojita del mapa.)
      el("div.jt-pronto-fila", {}, [el("small", { text: "Pronto" }), ...PRONTO.map((x) => el("button.jt-pronto-b", { type: "button", dataset: { k: x[0] }, onClick: () => this.ir(x[0]) }, [el("i", { html: x[0] === "casita" ? CASITA : PROMESA }), el("span", { text: x[1] })]))]),
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

  /* ════ Mesecitos (Fase 46: diseño nuevo) ════
     Arriba, su anillo del mes (cuánto va del mes que corre) con los cumpleaños debajo; luego sus meses como
     fotitos (cada uno con su página especial), su momento favorito del mes (cada quien el suyo), la cápsula
     del tiempo (una cartita sellada hasta el día de su siguiente mes) y los planes para celebrarlo. */
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
    const sig = d.siguiente ? new Date(d.siguiente + "T12:00:00") : null;
    const hoy0 = new Date(); hoy0.setHours(12, 0, 0, 0);
    const faltan = sig ? Math.max(0, Math.round((sig - hoy0) / 86400000)) : 0;
    if (sig) this.accion.replaceChildren(el("span.jt-accion-pill", { text: faltan === 0 ? "¡Hoy cumplen! 💗" : `Faltan ${faltan} ${faltan === 1 ? "día" : "días"}` }));
    this.vista.replaceChildren(
      this._mesAnillo(d, faltan),
      this._cumples(),
      this._mesFotitos(d),
      el("div.jt-m-cosas", {}, [this._mesMomento(d), this._mesCapsula(d), this._mesPlanes(d)]),
      el("p.jt-nota", { text: "Cada mes tiene una sola página (la hace quien llegue primero). El momento, la cápsula y los planes se guardan en su servidor y le llegan a tu amorcito con aviso." }),
    );
  }

  /** El anillo: el número de meses al centro y cuánto va del mes que corre. */
  _mesAnillo(d, faltan) {
    const ini = d.meses ? mesDe(d.novios, d.meses) : mesDe(d.novios, 0), fin = mesDe(d.novios, d.meses + 1);
    const hoy0 = new Date(); hoy0.setHours(12, 0, 0, 0);
    const total = Math.max(1, Math.round((fin - ini) / 86400000)), va = Math.min(total, Math.max(0, Math.round((hoy0 - ini) / 86400000)));
    const R = 52, C = 2 * Math.PI * R, k = faltan === 0 && d.meses ? 1 : va / total;
    const anillo = `<svg viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="jtAnillo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8fbf"/><stop offset="1" stop-color="#a985e8"/></linearGradient></defs>
      <circle cx="64" cy="64" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".14" stroke-width="11"/>
      <circle class="jt-anillo-va" cx="64" cy="64" r="${R}" fill="none" stroke="url(#jtAnillo)" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - k)).toFixed(1)}" transform="rotate(-90 64 64)" style="--c:${C.toFixed(1)}"/></svg>`;
    return el("section.jt-m-hero" + (faltan === 0 && d.meses ? ".hoy" : ""), {}, [
      el("div.jt-anillo", {}, [el("i", { html: anillo }), el("div.jt-anillo-n", {}, [el("b", { text: String(d.meses) }), el("small", { text: d.meses === 1 ? "mes" : "meses" })])]),
      el("div.jt-m-hero-t", {}, [
        el("small", { text: "Llevan juntitos" }),
        el("b", { text: faltan === 0 && d.meses ? `¡Hoy cumplen ${d.meses} ${d.meses === 1 ? "mes" : "meses"}! 💗` : `${d.meses} ${d.meses === 1 ? "mes" : "meses"} y ${va} ${va === 1 ? "día" : "días"}` }),
        d.siguiente ? el("p", { text: faltan === 0 ? `El siguiente: ${fechaLarga(mesDe(d.novios, d.meses + 1))}` : `Su mes ${d.meses + 1}: ${fechaLarga(d.siguiente)} · faltan ${faltan} ${faltan === 1 ? "día" : "días"}` }) : null,
      ]),
    ]);
  }

  /** Los cumpleaños, debajo del contador: el de tu amorcito y el tuyo, cada uno con su nombre (nunca al revés). */
  _cumples() {
    const D = PF.datos(), filas = [];
    const una = (quien, p, nombre) => {
      if (!p?.cumple) return el("div.jt-cumple.vacio", {}, [el("i", { text: "🎂", "aria-hidden": "true" }), el("div", {}, [el("b", { text: quien === "yo" ? "Tu cumpleaños" : `Cumpleaños de ${nombre}` }), el("small", { text: quien === "yo" ? "Ponlo en tu perfil" : `${nombre} todavía no lo pone en su perfil` })])]);
      const c = PF.cumpleDe(p.cumple);
      return el("div.jt-cumple" + (c.hoy ? ".hoy" : ""), {}, [
        el("i", { text: c.hoy ? "🥳" : "🎂", "aria-hidden": "true" }),
        el("div", {}, [el("b", { text: quien === "yo" ? "Tu cumpleaños" : `Cumpleaños de ${nombre}` }), el("small", { text: `${c.fecha}${c.hoy ? ` · ¡hoy cumple${quien === "yo" ? "s" : ""} ${c.anios}!` : ` · faltan ${c.dias} ${c.dias === 1 ? "día" : "días"}`}` })]),
      ]);
    };
    if (D.pareja) filas.push(una("pareja", D.pareja, this.pareja));
    filas.push(una("yo", D.yo, "ti"));
    return el("section.jt-cumples", { "aria-label": "Cumpleaños" }, filas);
  }

  /** Sus meses como fotitos en una tira (el más reciente primero); cada uno abre o crea su página. */
  _mesFotitos(d) {
    const porMes = new Map(d.paginas.map((x) => [x.mes, x]));
    if (!d.meses) return el("section.jt-bloque", {}, [el("h2.jt-bloque-t", {}, [el("span", { text: "Sus meses" })]), el("div.jt-vacio-chico", { text: "Cuando cumplan su primer mes, aquí podrán hacerle su página especial." })]);
    const tira = [];
    for (let n = d.meses; n >= 1; n--) {
      const p = porMes.get(n), f = mesDe(d.novios, n), nueva = p && !p.mio && !p.visto;
      const foto = p?.fotos?.[0];
      tira.push(el("button.jt-mesito" + (p ? ".con.tema-" + p.tema : "") + (n === d.meses ? ".este" : ""), { type: "button", "aria-label": `Mes ${n}: ${p ? p.titulo : "sin página todavía"}`, onClick: () => (p ? this._verMes(p) : this._editarMes(n)) }, [
        el("span.jt-mesito-foto", {}, [foto ? el("img", { src: SRV.media(foto), alt: "", loading: "lazy" }) : el("b", { text: String(n) })]),
        el("b.jt-mesito-n", { text: p ? p.titulo : `Mes ${n}` }),
        el("small", { text: f.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) }),
        nueva ? el("span.jt-nuevo", { text: "¡Nueva!" }) : !p ? el("span.jt-mesito-mas", { text: "+ Crear" }) : null,
      ]));
    }
    return el("section.jt-bloque", {}, [el("h2.jt-bloque-t", {}, [el("span", { text: "Sus meses" }), el("small", { text: "Una página especial por cada mes" })]), el("div.jt-mesitos", {}, tira)]);
  }

  /** Su momento favorito del mes que corre: el tuyo y el de tu amorcito, lado a lado. */
  _mesMomento(d) {
    const mes = d.meses + 1;
    const de = (mio) => d.momentos.find((x) => x.mes === mes && x.mio === mio);
    const lado = (mio) => {
      const m = de(mio), quien = mio ? "Tú" : this.pareja;
      return el("div.jt-momento" + (m ? ".con" : ""), {}, [
        el("small", { text: quien }),
        m ? el("p", { text: m.texto }) : el("p.suave", { text: mio ? "Todavía no eliges el tuyo" : `${this.pareja} todavía no elige el suyo` }),
        m?.foto ? el("img", { src: SRV.media(m.foto), alt: "", loading: "lazy" }) : null,
        m ? el("span.jt-corazones", { "aria-label": `${m.corazones} de 5 corazones`, text: "♥".repeat(m.corazones) + "♡".repeat(5 - m.corazones) }) : null,
      ]);
    };
    const pasados = [...new Set(d.momentos.filter((x) => x.mes < mes).map((x) => x.mes))].sort((a, b) => b - a);
    return el("section.jt-m-cosa.momento", {}, [
      el("div.jt-m-cosa-cab", {}, [el("i", { text: "✨", "aria-hidden": "true" }), el("div", {}, [el("b", { text: "Nuestro momento del mes" }), el("small", { text: `Lo más bonito de su mes ${mes}, cada quien el suyo` })])]),
      el("div.jt-momentos", {}, [lado(true), lado(false)]),
      el("button.jt-btn.chico", { type: "button", text: de(true) ? "Cambiar el mío" : "Elegir el mío", onClick: () => this._editarMomento(mes, de(true)) }),
      pasados.length ? el("details.jt-pasados", {}, [el("summary", { text: `Momentos de otros meses (${pasados.length})` }), ...pasados.map((n) => el("div.jt-pasado", {}, [el("b", { text: `Mes ${n}` }),
        ...d.momentos.filter((x) => x.mes === n).map((x) => el("p", {}, [el("small", { text: x.mio ? "Tú: " : `${this.pareja}: ` }), document.createTextNode(x.texto)]))]))]) : null,
    ]);
  }

  _editarMomento(mes, m) {
    const t = el("textarea.jt-campo", { rows: 3, maxlength: 280, placeholder: "Ese día que… 💭", "aria-label": "Tu momento favorito" });
    t.value = m?.texto || "";
    let corazones = m?.corazones || 5, foto = m?.foto || "";
    const cor = el("div.jt-cor-elegir", { role: "radiogroup", "aria-label": "¿Cuánto lo amaste?" });
    const pintarCor = () => cor.replaceChildren(...[1, 2, 3, 4, 5].map((n) => el("button", { type: "button", role: "radio", "aria-checked": String(n === corazones), "aria-label": `${n} ${n === 1 ? "corazón" : "corazones"}`, text: n <= corazones ? "♥" : "♡", onClick: () => { corazones = n; pintarCor(); } })));
    pintarCor();
    const fotoCaja = el("div.jt-fotos");
    const pintarFoto = () => fotoCaja.replaceChildren(foto
      ? el("span.jt-foto", {}, [el("img", { src: SRV.media(foto), alt: "" }), el("button", { type: "button", "aria-label": "Quitar foto", html: ico("cerrar"), onClick: () => { foto = ""; pintarFoto(); } })])
      : el("button.jt-foto-mas", { type: "button", "aria-label": "Añadir una foto", html: ico("mas"), onClick: () => this._subirFoto().then((u) => { if (u) { foto = u; pintarFoto(); } }) }));
    pintarFoto();
    const b = el("button.jt-btn", { type: "button", text: "Guardar mi momento", onClick: async () => {
      if (!t.value.trim()) { t.focus(); aviso("Cuéntalo en unas palabritas", 1800); return; }
      b.disabled = true;
      try { const r = await SRV.ponerMomento(mes, { texto: t.value, corazones, foto }); this.mes = { ...this.mes, ...r }; this._cerrarHoja(); aviso(m ? "Listo, quedó tu momento ✨" : `¡Tu momento quedó! A ${this.pareja} le llega el aviso ✨`, 2600); this.ir("mesecitos"); }
      catch (e) { aviso(e.message, 3500, "error"); b.disabled = false; }
    } });
    this._hoja(`Tu momento del mes ${mes}`, [t, el("small.jt-et", { text: "¿Cuánto lo amaste?" }), cor, el("small.jt-et", { text: "Una fotito (si quieres)" }), fotoCaja, b]);
  }

  /** La cápsula del tiempo: una cartita para el día de su siguiente mes (sellada hasta entonces, también para ti). */
  _mesCapsula(d) {
    const mes = d.meses + 1, abre = fechaLarga(mesDe(d.novios, mes));
    const mia = d.capsulas.find((x) => x.mes === mes && x.mio), suya = d.capsulas.find((x) => x.mes === mes && !x.mio);
    const abiertas = d.capsulas.filter((x) => x.abierta && !x.mio).sort((a, b) => b.mes - a.mes);
    const sobre = (x, tuyo) => el("div.jt-sobre" + (x ? ".lleno" : ""), {}, [
      el("i", { text: x ? "💌" : "✉️", "aria-hidden": "true" }),
      el("div", {}, [el("b", { text: tuyo ? (x ? "Tu cápsula está guardada" : "Todavía no guardas la tuya") : x ? `${this.pareja} te guardó una 🔒` : `${this.pareja} todavía no guarda la suya` }),
        el("small", { text: x ? `Se abre el ${abre}` : tuyo ? "Escríbele algo para leerlo ese día" : "" })]),
    ]);
    return el("section.jt-m-cosa.capsula", {}, [
      el("div.jt-m-cosa-cab", {}, [el("i", { text: "💌", "aria-hidden": "true" }), el("div", {}, [el("b", { text: "Cápsula del tiempo" }), el("small", { text: `Una cartita que nadie puede leer hasta su mes ${mes}` })])]),
      sobre(mia, true), sobre(suya, false),
      el("div.jt-botones.izq", {}, [
        el("button.jt-btn.chico", { type: "button", text: mia ? "Cambiar la mía" : "Escribir la mía", onClick: () => this._editarCapsula(mes, mia, abre) }),
        mia ? el("button.jt-btn.chico.suave", { type: "button", text: "Quitarla", onClick: async () => { if (!(await confirmar("¿Quitar tu cápsula de este mes?", "Quitar"))) return; try { await SRV.borrarCapsula(mes); this.ir("mesecitos"); } catch (e) { aviso(e.message, 3000, "error"); } } }) : null,
      ]),
      abiertas.length ? el("details.jt-pasados", { open: abiertas.some((x) => x.mes === d.meses) ? "" : null }, [el("summary", { text: `Cápsulas que ya se abrieron (${abiertas.length})` }),
        ...abiertas.map((x) => el("div.jt-pasado.carta", {}, [el("b", { text: `Mes ${x.mes} · de ${this.pareja}` }), el("p", { text: x.texto })]))]) : null,
    ]);
  }

  _editarCapsula(mes, x, abre) {
    const t = el("textarea.jt-campo", { rows: 6, maxlength: 2000, placeholder: `Querido/a ${this.pareja}: cuando leas esto…`, "aria-label": "Tu cápsula" });
    t.value = x?.texto || "";
    const b = el("button.jt-btn", { type: "button", text: "Sellar la cápsula 💌", onClick: async () => {
      if (!t.value.trim()) { t.focus(); aviso("Escribe algo para guardarlo", 1800); return; }
      b.disabled = true;
      try { await SRV.ponerCapsula(mes, t.value); this._cerrarHoja(); aviso(x ? "Cápsula cambiada (sigue sellada)" : `¡Sellada! ${this.pareja} la podrá leer el ${abre} 💌`, 3000); this.ir("mesecitos"); }
      catch (e) { aviso(e.message, 3500, "error"); b.disabled = false; }
    } });
    this._hoja(`Cápsula para su mes ${mes}`, [el("p.jt-hoja-p.suave", { text: `Nadie la puede leer antes del ${abre} (ni ${this.pareja}). Ese día se abre sola.` }), t, b]);
  }

  /** Los planes para celebrar su siguiente mes: los dos añaden, palomean o quitan. */
  _mesPlanes(d) {
    const mes = d.meses + 1;
    const lista = el("ul.jt-planes");
    const pintar = (planes) => {
      const mios = planes.filter((x) => x.mes === mes);
      lista.replaceChildren(...(mios.length ? mios.map((x) => {
        const c = el("input", { type: "checkbox", "aria-label": `Hecho: ${x.texto}` });
        c.checked = x.hecho;
        c.addEventListener("change", () => SRV.palomearPlan(x.id, c.checked).then((r) => { if (c.checked) this.app.sonidos?.sonar("favorito"); pintar(r.planes); }).catch((e) => { c.checked = !c.checked; aviso(e.message, 3000, "error"); }));
        return el("li.jt-plan" + (x.hecho ? ".hecho" : ""), {}, [el("label", {}, [c, el("span", { text: x.texto })]), el("small", { text: x.mio ? "tú" : this.pareja }),
          el("button.jt-icono", { type: "button", "aria-label": `Quitar «${x.texto}»`, html: ico("borrar"), onClick: () => SRV.borrarPlan(x.id).then((r) => pintar(r.planes)).catch((e) => aviso(e.message, 3000, "error")) })]);
      }) : [el("li.jt-vacio-chico", { text: "Todavía no hay planes. ¿Una cena, una peli, una cartita…?" })]));
    };
    pintar(d.planes);
    const campo = el("input.jt-campo", { type: "text", maxlength: 90, placeholder: "Añadir un plan…", "aria-label": "Nuevo plan", enterkeyhint: "done" });
    const anadir = async () => {
      const v = campo.value.trim();
      if (!v) { campo.focus(); return; }
      campo.disabled = true;
      try { const r = await SRV.nuevoPlan(mes, v); campo.value = ""; pintar(r.planes); }
      catch (e) { aviso(e.message, 3500, "error"); }
      finally { campo.disabled = false; campo.focus({ preventScroll: true }); }
    };
    campo.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); anadir(); } });
    return el("section.jt-m-cosa.planes", {}, [
      el("div.jt-m-cosa-cab", {}, [el("i", { text: "🗓️", "aria-hidden": "true" }), el("div", {}, [el("b", { text: `Planes para su mes ${mes}` }), el("small", { text: "Lo que quieren hacer para celebrarlo" })])]),
      lista,
      el("div.jt-plan-nuevo", {}, [campo, el("button.jt-btn.chico", { type: "button", text: "Añadir", onClick: anadir })]),
    ]);
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
          if (this.tab === "mesecitos") this.ir("mesecitos");   // (su fotito ya se ve en la tira al cerrar la carta)
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
        el("small.jt-carta-mes-n", { text: `Mes ${p.mes}${f ? " · " + fechaLarga(f) : ""}` }),
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
    if (!E || !this.abierto || this.tab !== "inicio") return;
    let d;
    try { d = await SRV.ubicacion(); } catch (e) { E.gente.replaceChildren(el("p.jt-aviso", { text: "Sin conexión con su servidor: no se puede ver dónde están ahora." })); return; }
    this.ub = d;
    this._pintarKm(d);
    const persona = (quien, nom, u) => el("div.jt-persona." + quien, {}, [
      PF.avatar(quien === "yo" ? "yo" : "pareja", "jt-av"),
      el("div", {}, [el("b", { text: nom }), el("small", { text: u ? `Ahí desde ${hace(u.desde)} · actualizada ${hace(u.t)}` : quien === "yo" ? "No compartes tu ubicación" : `${this.pareja} no está compartiendo su ubicación` })]),
    ]);
    E.gente.replaceChildren(persona("yo", "Tú", d.yo), persona("pareja", this.pareja, d.pareja));
    E.lugares.replaceChildren(...(d.lugares.length ? d.lugares.map((l) => el("li.jt-lugar", {}, [
      el("i.jt-lugar-pin", { html: PIN, "aria-hidden": "true" }),
      el("button.jt-lugar-t", { type: "button", "aria-label": `Editar «${l.nombre}»`, onClick: () => this._formLugar({ lat: l.lat, lng: l.lng }, l) }, [el("b", { text: l.nombre }), el("small", { text: `${Math.round(l.radio)} m · avisa ${{ yo: "a quien llega o se va", pareja: "a su pareja", ambos: "a los dos" }[l.avisar] || ""} · tocar para editar` })]),
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
      E.dist.textContent = `💞 a ${textoDistancia(kmEntre(d.yo, d.pareja))} de ${this.pareja}`;
      E.dist.hidden = false;
    } else E.dist.hidden = true;
    if (!M.centrado && puntos.length) { M.centrado = true; if (puntos.length === 1) m.setView(puntos[0], 15); else m.fitBounds(puntos, { padding: [40, 40], maxZoom: 16 }); }
  }

  /** «Estamos a … de distancia»: la tarjetita de los kilómetros (Fase 46). */
  _pintarKm(d) {
    const caja = this._mapaEls?.km;
    if (!caja) return;
    if (d.yo && d.pareja) {
      const km = kmEntre(d.yo, d.pareja), cerca = km < 0.15;
      const k = textoDistancia(km, usaMillas());
      if (caja._k === k) return;   // igual que antes: nada se repinta
      caja._k = k;
      caja.replaceChildren(
        el("div.jt-km-dibujo", { "aria-hidden": "true" }, [PF.avatar("yo", "jt-av"), el("i.jt-km-hilo", {}, [el("b", { text: "♥" })]), PF.avatar("pareja", "jt-av")]),
        el("div.jt-km-t", {}, [el("small", { text: cerca ? "¡Están juntitos!" : "Estamos a" }), el("b", { text: cerca ? "💞 aquí mismo" : k }), el("small", { text: cerca ? `Tú y ${this.pareja}, en el mismo lugar` : `de distancia de ${this.pareja}` })]),
      );
      caja.classList.toggle("juntos", cerca);
      return;
    }
    const falta = !d.yo && !d.pareja ? `Compartan su ubicación los dos para saber cuántos kilómetros los separan.` : !d.yo ? "Comparte tu ubicación para saber cuántos kilómetros los separan." : `Cuando ${this.pareja} comparta su ubicación, aquí verán cuántos kilómetros los separan.`;
    if (caja._k === falta) return;
    caja._k = falta;
    caja.classList.remove("juntos");
    caja.replaceChildren(el("div.jt-km-dibujo.vacio", { "aria-hidden": "true" }, [PF.avatar("yo", "jt-av"), el("i.jt-km-hilo", {}, [el("b", { text: "?" })]), PF.avatar("pareja", "jt-av")]), el("p.jt-km-vacio", { text: falta }));
  }

  _nuevoLugar() {
    if ((this.ub?.lugares?.length || 0) >= 10) { aviso("Ya tienen 10 lugares: quita alguno para añadir otro.", 3200); return; }
    this._hoja("Añadir lugar", [
      el("p.jt-hoja-p", { text: "Elige dónde está:" }),
      el("button.jt-btn", { type: "button", text: "Tocar el lugar en el mapa", onClick: () => { this._cerrarHoja(); if (!this.mapa) { aviso("El mapa no cargó: usa tu ubicación actual.", 3000); return; } this._eligiendo = true; this._mapaEls.caja.classList.add("eligiendo"); this._hojaIr("bajo", true); aviso("Toca el mapa donde está el lugar", 2600); } }),
      el("button.jt-btn.suave", { type: "button", text: "Usar mi ubicación actual", onClick: () => {
        if (!UB.puede()) { aviso("Este navegador no da la ubicación.", 3000, "error"); return; }
        navigator.geolocation.getCurrentPosition((p) => this._formLugar({ lat: p.coords.latitude, lng: p.coords.longitude }), (e) => aviso(e.code === 1 ? "No diste permiso de ubicación." : "No se pudo saber dónde estás.", 3200, "error"), { enableHighAccuracy: true, timeout: 20000 });
      } }),
    ]);
  }

  /** Un lugar nuevo (o, con `l`, editar uno: nombre, tamaño de la zona y a quién avisar). */
  _formLugar(pos, l = null) {
    const nombre = el("input.jt-campo", { type: "text", maxlength: 40, placeholder: "Casa, escuela, gimnasio…", "aria-label": "Nombre del lugar" });
    nombre.value = l?.nombre || "";
    const r0 = Math.round(Math.min(2000, Math.max(50, l?.radio || 150)) / 25) * 25;
    const radio = el("input", { type: "range", min: 50, max: 2000, step: 25, value: r0, "aria-label": "Radio" }), rt = el("b", { text: r0 + " m" });
    radio.addEventListener("input", () => { rt.textContent = radio.value + " m"; });
    const avisar = el("select.jt-campo", { "aria-label": "A quién avisar" }, [["pareja", "A su pareja"], ["yo", "A quien llega o se va"], ["ambos", "A los dos"]].map(([v, t]) => el("option", { value: v, text: t })));
    avisar.value = l?.avisar || "pareja";
    const alertas = el("input", { type: "checkbox" });
    alertas.checked = l ? !!l.alertas : true;
    const guardar = el("button.jt-btn", { type: "button", text: l ? "Guardar cambios" : "Guardar lugar", onClick: async () => {
      if (!nombre.value.trim()) { nombre.focus(); aviso("Ponle un nombre", 1800); return; }
      guardar.disabled = true;
      const datos = { nombre: nombre.value, radio: +radio.value, avisar: avisar.value, alertas: alertas.checked };
      try {
        if (l) await SRV.editarLugar(l.id, datos); else await SRV.nuevoLugar({ ...datos, lat: pos.lat, lng: pos.lng });
        this._cerrarHoja(); aviso(`«${nombre.value.trim()}» ${l ? "quedó como querías" : "guardado"}`, 2000);
        if (this.mapa && !l) this.mapa.centrado = false;
        this._refrescarMapa();
      } catch (e) { aviso(e.message, 3500, "error"); guardar.disabled = false; }
    } });
    this._hoja(l ? `Editar «${l.nombre}»` : "Nuevo lugar", [
      nombre,
      el("label.jt-rango", {}, [el("span", { text: "Tamaño de la zona" }), radio, rt]),
      el("label.jt-fila", {}, [el("span", { text: "Cuando alguien entra o sale, avisar…" }), avisar]),
      el("label.jt-interruptor", {}, [alertas, el("span", { text: "Avisos encendidos" })]),
      guardar,
      l ? el("div.jt-botones", {}, [
        el("button.jt-btn.suave", { type: "button", text: "Ver en el mapa", onClick: () => { this._cerrarHoja(); this._hojaIr("bajo", true); this.mapa?.m.setView([l.lat, l.lng], 16, { animate: !reducido() }); } }),
        el("button.jt-btn.peligro", { type: "button", text: "Quitar", onClick: async () => { if (await confirmar(`¿Quitar «${l.nombre}»?`, "Quitar")) { try { await SRV.borrarLugar(l.id); this._cerrarHoja(); this._refrescarMapa(); } catch (e) { aviso(e.message, 3000, "error"); } } } }),
      ]) : null,
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
    // (Fase 48: Dibujar juntos se carga hasta que lo abres; el resto del tiempo no ocupa nada.)
    const vista = this.vista, vez = (this._vezDj = {});
    import("./dibujo-juntos.js").then(({ DibujoJuntos }) => {
      if (this._vezDj !== vez || !this.abierto || !vista.isConnected) return;
      this.dj = new DibujoJuntos(this.app, { pareja: this.pareja, hoja: (t, h) => this._hoja(t, h), cerrarHoja: () => this._cerrarHoja() });
      this.dj.montar(vista);
    }).catch((e) => aviso("No se pudo abrir Dibujar juntos: " + e.message, 4000, "error"));
  }
}
