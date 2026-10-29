/**
 * PROBAR PÁGINA — tu página dentro de un celular, como la va a ver ella (Fase 28).
 *
 *   abrir()               el librito desde la página que estás viendo, con el MISMO
 *                         reproductor (animaciones, interacciones, HTML, fondo, música)
 *                         y SÓLO los botones para pasar de hoja que tú pusiste (Fase 34:
 *                         nada de flechas que aparecen solas; se pasa deslizando)
 *   abrir({ html })       un HTML suelto (lo que se escribe en el editor de HTML)
 *
 * En la compu: un escenario oscuro con el brillo del color de tu página y, al centro, un
 * celular (marco, isla, botones y reflejo del vidrio). En el teléfono (Fase 34): la página
 * a pantalla completa, del tamaño justo de tu pantalla (sin marco ni espacios de sobra). La página va dentro con
 * la MISMA pantalla con que se arma en el editor y sólo se escala: nada se
 * corre, ni se deforma, ni se corta (si es horizontal, el celular se acuesta).
 * Entra subiendo desde la hoja con un rebote suave y un destello en el vidrio;
 * al terminar regresa a la hoja. Todo con transform y opacidad (nada de
 * desenfoques animados, que trababan). Se termina con «Terminar prueba», Esc o
 * el botón «atrás» del teléfono.
 */
import { el } from "../compartido/utils/dom.js";
import { ico } from "./iconos.js";
import { fuentesUsadas } from "../core/modelo.js";
import { RAIZ } from "../assets/biblioteca.js";
import { DIBUJO_ABEJA } from "../mascota/abeja.js";

const RT = window.LibritoRT;
const CROMO = ".ed-barra, .ed-lateral, .ed-insp, .ed-contexto, .ed-linea:not([hidden]), .ed-riel, .ed-foco, .ed-hoja-sec.abierta, .ed-fuera:not([hidden]), .ed-hojita, .ed-codigo-pantalla, .ed-avisos";
const SUAVE = "cubic-bezier(.2,.8,.2,1)";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const BISEL = 11;

/** Data URLs de lo que piden los HTML de la página (un marco aislado no abre las `blob:`). */
export async function datosDe(app, pagina) {
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
    // La MISMA pantalla con que se arma la hoja en el editor: nada se corre al probar.
    const pant = app.lienzo?.pantallaDeHoja?.() || { w: 390, h: 844 };
    const W = Math.max(200, Math.round(pant.w)), H = Math.max(200, Math.round(pant.h));
    this.W = W; this.H = H;
    const pagina = app.estado.pagina;
    const fondo = pagina?.fondo?.color || P?.ajustes?.tema?.fondo || "#ffd9e6";
    // 1 · Los menús se desvanecen (sólo opacidad: fluido en cualquier teléfono).
    this._salen = [...document.querySelectorAll(CROMO)].filter((n) => n.offsetParent !== null || getComputedStyle(n).position === "fixed")
      .map((n) => ({ n, a: n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" }) }));
    document.body.classList.add("ed-probando");
    // 2 · El escenario y el celular.
    const marco = el("iframe.ed-prueba-marco", { title: "Prueba de la página", allow: "autoplay; fullscreen; accelerometer; gyroscope", style: { width: W + "px", height: H + "px" } });
    const movil = el("div.ed-movil" + (W > H ? ".horizontal" : ""), { style: { "--mw": W + "px", "--mh": H + "px" } }, [
      el("i.ed-movil-boton.b1"), el("i.ed-movil-boton.b2"), el("i.ed-movil-boton.b3"),
      el("div.ed-movil-pantalla", {}, [marco, el("i.ed-movil-cargando")]),
      el("i.ed-movil-isla"), el("i.ed-movil-reflejo"),
    ]);
    const x = el("button.ed-prueba-x", { type: "button", html: `${ico("cerrar")}<span>Terminar prueba</span>`, onClick: () => this.cerrar() });
    const pie = html == null ? el("p.ed-prueba-pie", { text: "Desliza para pasar de hoja" }) : null;
    // En el teléfono, la página ocupa la pantalla tal cual (el celular de mentira sólo sirve en la compu).
    const enTelefono = innerWidth < 700 || (matchMedia("(pointer: coarse)").matches && Math.min(innerWidth, innerHeight) < 700);
    const capa = el("div.ed-prueba" + (enTelefono ? ".a-pantalla" : ""), { role: "dialog", "aria-label": "Probando la página", style: { "--fondo": fondo } }, [el("i.ed-prueba-luz"), el("div.ed-prueba-escena", {}, [movil]), x, pie].filter(Boolean));
    this.capa = capa; this.movil = movil;
    document.body.append(capa);
    this._acomodar = () => {
      if (enTelefono) { movil.style.setProperty("--k", clamp(Math.min(innerWidth / W, innerHeight / H), 0.2, 3).toFixed(4)); return; }
      const s = getComputedStyle(this.capa.querySelector(".ed-prueba-escena"));
      const aw = innerWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - BISEL * 2;
      const ah = innerHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom) - BISEL * 2;
      movil.style.setProperty("--k", clamp(Math.min(1, aw / W, ah / H), 0.2, 1).toFixed(4));
    };
    this._acomodar();
    addEventListener("resize", this._acomodar);
    // En el teléfono, pantalla completa de verdad donde se pueda (más espacio para el celular).
    this._fs = false;
    const doc = document.documentElement, pedir = doc.requestFullscreen || doc.webkitRequestFullscreen;
    if (innerWidth < 700 && pedir && !(document.fullscreenElement || document.webkitFullscreenElement) && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
      try { const r = pedir.call(doc, { navigationUI: "hide" }); this._fs = true; r?.catch?.(() => { this._fs = false; }); } catch (e) { this._fs = false; }
    }
    // 3 · Entra: el escenario se ilumina y el celular sube desde la hoja con un rebote suave.
    this._desde = this._desdeHoja();
    capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
    this._entrada = movil.animate([
      { transform: this._desde, opacity: 0.35 },
      { transform: "translate3d(0, -8px, 0) scale(1.015)", opacity: 1, offset: 0.72 },
      { transform: "none", opacity: 1 },
    ], { duration: 640, easing: SUAVE });
    this._entrada.finished.then(() => movil.classList.add("brilla")).catch(() => {});
    const mostrar = () => { marco.classList.add("listo"); movil.classList.add("lista"); };
    // La página se carga cuando el celular ya llegó: así la entrada va suave (mientras, un destello).
    await this._entrada.finished.catch(() => {});
    if (!this.abierta || this.capa !== capa) return;
    if (html != null) {
      marco.setAttribute("sandbox", "allow-scripts allow-forms allow-modals allow-pointer-lock allow-popups");
      const ctx = { url: (id) => app.bib.url(id), urlDatos: (id) => app.bib.urlDatos(id) };
      for (const id of Object.values(archivos || {})) await app.bib.datos(id).catch(() => null);
      marco.addEventListener("load", mostrar, { once: true });
      marco.srcdoc = RT.envolverHtml(RT.conArchivos(html, archivos, ctx));
    } else {
      const datosUrls = {};
      for (const pid of P.orden) Object.assign(datosUrls, await datosDe(app, P.paginas[pid]));
      marco.src = "runtime/reproductor.html";
      this._msg = (ev) => {
        if (ev.source !== marco.contentWindow) return;
        if (ev.data?.tipo === "vista-lista") {
          marco.contentWindow.postMessage({
            tipo: "librito",
            datos: { nombre: P.nombre, ajustes: P.ajustes, orden: P.orden, paginas: P.paginas, titulos: {} },
            urls: app.bib.mapa(), datosUrls, base: RAIZ, inicio: app.estado.paginaId, portadilla: false, prueba: true, fuentes: [...fuentesUsadas(P)],
            fijar: { w: W, h: H }, sinNav: true,
          }, location.origin);
          setTimeout(mostrar, 90);
        } else if (ev.data?.tipo === "cerrar-vista") this.cerrar();
      };
      addEventListener("message", this._msg);
      this._revisarNavegacion(capa);
    }
    this._tecla = (e) => { if (e.key === "Escape") { e.preventDefault(); this.cerrar(); } };
    addEventListener("keydown", this._tecla);
    // El botón y la ayuda se hacen discretos para no distraer (vuelven al pasar cerca).
    this._dim = setTimeout(() => { x.classList.add("discreto"); pie?.classList.add("ido"); }, 3200);
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "abrir" }));
  }

  /**
   * La abejita avisa (una vez por página) si un botón para pasar página se sale de la hoja.
   * (Si no hay botones, no insiste: se pasa deslizando, y se ponen sólo si tú quieres.)
   */
  _revisarNavegacion(capa) {
    const app = this.app, E = app.estado, pg = E.pagina;
    if (!pg) return;
    this._avisadas = this._avisadas || new Set();
    const navs = pg.els.filter((e) => !e.oculto && e.accion && /^(anterior|siguiente|inicio|ir)$/.test(e.accion.tipo));
    const W = app.lienzo.W, H = app.lienzo.H;
    const fuera = navs.filter((e) => { const b = app.lienzo.vis(e); return b.x < -2 || b.y < -2 || b.x + b.w > W + 2 || b.y + b.h > H + 2; });
    const clave = pg.id + ":fuera";
    if (!fuera.length || this._avisadas.has(clave)) return;
    this._avisadas.add(clave);
    const texto = "Un botón para pasar página se sale de la hoja: en el librito no se vería entero.";
    const quitar = () => { clearTimeout(t); tarjeta.classList.remove("ver"); setTimeout(() => tarjeta.remove(), 300); };
    const acciones = [["Meterlo en la hoja", () => { this.cerrar(); app.lienzo.traerALaHoja(fuera.map((e) => e.id)); }, "primario"]];
    const tarjeta = el("div.ed-prueba-abeja", { role: "status" }, [
      el("span.ed-abeja.ed-abeja-mini", { html: DIBUJO_ABEJA, dataset: { ojos: "susto", boca: "o" } }),
      el("div", {}, [
        el("p", { text: texto }),
        el("div.ed-prueba-abeja-b", {}, [
          ...acciones.map(([t, fn, cl]) => el("button.ed-btn.chico" + (cl ? "." + cl : ""), { type: "button", text: t, onClick: fn })),
          el("button.ed-btn.chico", { type: "button", text: "Ahora no", onClick: quitar }),
        ]),
      ]),
    ]);
    capa.append(tarjeta);
    setTimeout(() => tarjeta.classList.add("ver"), 650);
    const t = setTimeout(quitar, 14000);
  }

  /** De dónde sale el celular: la hoja del editor (mismo centro, escalado a su tamaño). */
  _desdeHoja() {
    const r = this._rectHoja(), p = this.movil.getBoundingClientRect();
    if (!p.width || !p.height) return "scale(.9)";
    const s = Math.min(r.width / p.width, r.height / p.height) || 1;
    const dx = r.left + r.width / 2 - (p.left + p.width / 2), dy = r.top + r.height / 2 - (p.top + p.height / 2);
    return `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
  }

  _rectHoja() {
    const h = document.querySelector(".ed-centro .ed-hoja");
    const r = h?.getBoundingClientRect();
    if (r && r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < innerHeight) return r;
    return { left: innerWidth * 0.2, top: innerHeight * 0.2, width: innerWidth * 0.6, height: innerHeight * 0.6 };
  }

  cerrar() {
    if (!this.abierta) return;
    this.abierta = false;
    const app = this.app, capa = this.capa, movil = this.movil;
    this.capa = null; this.movil = null;
    clearTimeout(this._dim);
    removeEventListener("keydown", this._tecla);
    removeEventListener("resize", this._acomodar);
    if (this._msg) { removeEventListener("message", this._msg); this._msg = null; }
    this._entrada?.cancel();
    dispatchEvent(new CustomEvent("ed-hoja", { detail: "cerrar" }));
    if (this._fs && (document.fullscreenElement || document.webkitFullscreenElement)) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
    this._fs = false;
    document.body.classList.remove("ed-probando");
    // El celular regresa a la hoja y el escenario se apaga; los menús vuelven (sólo opacidad).
    movil.animate([{ transform: "none", opacity: 1 }, { transform: this._desde || "scale(.9)", opacity: 0 }], { duration: 380, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    capa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: 60, easing: "ease-in", fill: "forwards" }).finished.catch(() => {}).then(() => capa.remove());
    for (const { n, a } of this._salen || []) { a.cancel(); n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 140, easing: "ease-out", fill: "backwards" }); }
    this._salen = null;
    app.audio?.pausarParaVista(false);
  }
}
