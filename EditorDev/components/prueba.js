/**
 * PROBAR PÁGINA — como abrir la página de verdad, no como esconder paneles.
 *
 *   abrir()               la página actual, con el MISMO reproductor del librito
 *                         (animaciones, interacciones, HTML, fondo, música, pistas)
 *   abrir({ html })       un HTML suelto (lo que se está escribiendo en el editor
 *                         de HTML), aislado, a pantalla completa
 *
 * Al empezar, los menús del editor se van (cada uno hacia su orilla) y la
 * página crece desde donde estaba en la hoja hasta llenar la pantalla.
 * Al terminar, la página vuelve a su sitio y los menús regresan por etapas:
 * primero se asoman un poquito, luego vuelven a su lugar y al final quedan
 * del todo visibles. Cuanto más larga fue la prueba, más pausado el regreso.
 * Se termina con «Terminar prueba», Esc o el botón «atrás» del teléfono.
 */
import { el } from "../../src/utils/dom.js";
import { ico } from "./iconos.js";
import { fuentesUsadas } from "../core/modelo.js";
import { RAIZ } from "../assets/biblioteca.js";

const RT = window.LibritoRT;
const CROMO = ".ed-barra, .ed-lateral, .ed-insp, .ed-contexto, .ed-linea:not([hidden]), .ed-asa-lateral, .ed-foco, .ed-hoja-sec.abierta, .ed-fuera:not([hidden]), .ed-hojita, .ed-codigo-pantalla, .ed-avisos";
const SUAVE = "cubic-bezier(.2,.8,.2,1)";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Hacia dónde se va cada menú: a su orilla más cercana. */
function rumbo(n) {
  const r = n.getBoundingClientRect();
  const W = innerWidth, H = innerHeight;
  if (!r.width || !r.height) return { dx: 0, dy: 24 };
  if (r.top < 8 && r.height < H * 0.4) return { dx: 0, dy: -(r.bottom + 12) };
  if (r.bottom > H - 8 && r.height < H * 0.6) return { dx: 0, dy: H - r.top + 12 };
  if (r.left < 8 && r.width < W * 0.6) return { dx: -(r.right + 12), dy: 0 };
  if (r.right > W - 8 && r.width < W * 0.6) return { dx: W - r.left + 12, dy: 0 };
  return { dx: 0, dy: 40 };
}
const tr = (d, k) => `translate3d(${(d.dx * k).toFixed(1)}px, ${(d.dy * k).toFixed(1)}px, 0)`;

/** Data URLs de lo que piden los HTML de la página (un marco aislado no abre las `blob:`). */
async function datosDe(app, pagina) {
  const ids = new Set();
  for (const e of pagina?.els || []) for (const id of Object.values(e.html?.archivos || {})) ids.add(id);
  for (const id of Object.values(pagina?.fondo?.html?.archivos || {})) ids.add(id);
  const r = {};
  await Promise.all([...ids].map(async (id) => { const u = await app.bib.datos(id).catch(() => null); if (u) r[id] = u; }));
  return r;
}

export class Prueba {
  constructor(app) { this.app = app; this.abierta = false; }

  async abrir({ html = null, archivos = null } = {}) {
    if (this.abierta) return;
    const app = this.app;
    const P = app.estado.proyecto;
    if (!P && html == null) return;
    this.abierta = true;
    this.t0 = performance.now();
    app.lienzo?.terminarTexto();
    app.tiempo?.parar(false);
    app.audio?.pausarParaVista(true);
    document.querySelector(".ed-menu")?.remove();
    document.querySelector(".ed-pop")?._cerrar?.();
    // 1 · Los menús se van, cada uno hacia su orilla.
    this._salen = [...document.querySelectorAll(CROMO)].filter((n) => n.offsetParent !== null || getComputedStyle(n).position === "fixed").map((n, i) => {
      const d = rumbo(n);
      // Primero se vuelven translúcidos (se ve la página detrás) y luego se van.
      const a = n.animate([
        { opacity: 1, transform: "none", filter: "none" },
        { opacity: 0.32, transform: tr(d, 0.12), filter: "blur(1.5px) saturate(.7)", offset: 0.45 },
        { opacity: 0, transform: tr(d, 1), filter: "blur(3px) saturate(.6)" },
      ], { duration: 460, delay: Math.min(i, 6) * 22, easing: "cubic-bezier(.45,0,.6,.5)", fill: "forwards" });
      return { n, d, a };
    });
    document.body.classList.add("ed-probando");
    // 2 · La página crece desde la hoja hasta toda la pantalla.
    const pagina = app.estado.pagina;
    const fondo = pagina?.fondo?.color || P?.ajustes?.tema?.fondo || "#111";
    const marco = el("iframe.ed-prueba-marco", { title: "Prueba de la página", allow: "autoplay; fullscreen; accelerometer; gyroscope" });
    const x = el("button.ed-prueba-x", { type: "button", html: `${ico("cerrar")}<span>Terminar prueba</span>`, onClick: () => this.cerrar() });
    const capa = el("div.ed-prueba", { role: "dialog", "aria-label": "Probando la página", style: { background: html != null ? "#fff" : fondo } }, [marco, x]);
    this.capa = capa;
    document.body.append(capa);
    const desde = this._rectHoja();
    this._entrada = capa.animate([
      { transform: `translate(${desde.left}px, ${desde.top}px) scale(${desde.width / innerWidth}, ${desde.height / innerHeight})`, borderRadius: "18px", opacity: 0.6 },
      { transform: "none", borderRadius: "0px", opacity: 1 },
    ], { duration: 480, easing: SUAVE });
    const mostrar = () => marco.classList.add("listo");
    if (html != null) {
      marco.setAttribute("sandbox", "allow-scripts allow-forms allow-modals allow-pointer-lock allow-popups");
      const ctx = { url: (id) => app.bib.url(id), urlDatos: (id) => app.bib.urlDatos(id) };
      for (const id of Object.values(archivos || {})) await app.bib.datos(id).catch(() => null);
      marco.addEventListener("load", mostrar, { once: true });
      marco.srcdoc = RT.envolverHtml(RT.conArchivos(html, archivos, ctx));
    } else {
      const datosUrls = await datosDe(app, pagina);
      marco.src = "runtime/reproductor.html";
      this._msg = (ev) => {
        if (ev.source !== marco.contentWindow) return;
        if (ev.data?.tipo === "vista-lista") {
          marco.contentWindow.postMessage({
            tipo: "librito",
            datos: { nombre: P.nombre, ajustes: P.ajustes, orden: P.orden, paginas: P.paginas, titulos: {} },
            urls: app.bib.mapa(), datosUrls, base: RAIZ, inicio: app.estado.paginaId, portadilla: false, soloPagina: true, fuentes: [...fuentesUsadas(P)],
          }, location.origin);
          setTimeout(mostrar, 90);
        } else if (ev.data?.tipo === "cerrar-vista") this.cerrar();
      };
      addEventListener("message", this._msg);
    }
    this._tecla = (e) => { if (e.key === "Escape") { e.preventDefault(); this.cerrar(); } };
    addEventListener("keydown", this._tecla);
    // El botón se hace discreto para no tapar la página (vuelve al pasar cerca).
    this._dim = setTimeout(() => x.classList.add("discreto"), 2600);
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "abrir" }));
  }

  _rectHoja() {
    const h = document.querySelector(".ed-centro .ed-hoja");
    const r = h?.getBoundingClientRect();
    if (r && r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < innerHeight) return r;
    return { left: innerWidth * 0.08, top: innerHeight * 0.08, width: innerWidth * 0.84, height: innerHeight * 0.84 };
  }

  cerrar() {
    if (!this.abierta) return;
    this.abierta = false;
    const app = this.app;
    const capa = this.capa;
    this.capa = null;
    clearTimeout(this._dim);
    removeEventListener("keydown", this._tecla);
    if (this._msg) { removeEventListener("message", this._msg); this._msg = null; }
    this._entrada?.cancel();
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "cerrar" }));
    // La página vuelve a su sitio en la hoja.
    const hasta = this._rectHoja();
    const salida = capa.animate([
      { transform: "none", borderRadius: "0px", opacity: 1 },
      { transform: `translate(${hasta.left}px, ${hasta.top}px) scale(${hasta.width / innerWidth}, ${hasta.height / innerHeight})`, borderRadius: "18px", opacity: 0 },
    ], { duration: 380, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    salida.finished.catch(() => {}).then(() => capa.remove());
    document.body.classList.remove("ed-probando");
    // Los menús regresan por etapas; más pausado cuanto más duró la prueba.
    const seg = (performance.now() - this.t0) / 1000;
    const dur = clamp(480 + seg * 14, 520, 1150);
    (this._salen || []).forEach(({ n, d, a }, i) => {
      a.cancel();
      n.animate([
        { opacity: 0, transform: tr(d, 1) },
        { opacity: 0.35, transform: tr(d, 0.55), offset: 0.3 },
        { opacity: 0.8, transform: "none", offset: 0.72 },
        { opacity: 1, transform: "none" },
      ], { duration: dur, delay: 120 + Math.min(i, 6) * 55, easing: "cubic-bezier(.25,.8,.3,1)", fill: "backwards" });
    });
    this._salen = null;
    app.audio?.pausarParaVista(false);
  }
}
