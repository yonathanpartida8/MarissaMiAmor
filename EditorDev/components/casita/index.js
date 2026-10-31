/**
 * NUESTRA CASITA (Fase 53) — el jueguito de los dos, estilo casita de muñecas en 2D.
 *
 * El mundo es una tira de cuartos (cuartos.js) llena de cosas del catálogo (catalogo/) que se usan,
 * se acomodan, se voltean, se pintan de otro color y se quitan. Hay profundidad: lo que está más
 * adelante tapa a lo de atrás (los monitos también). Cada quien tiene su monito (monito.js) que camina,
 * se sienta, se acuesta, se baña, cocina, trae cosas en la mano, hace gestos y, con el de su amorcito,
 * se abrazan, se dan besitos, chocan las manos, bailan y se regalan cosas. Todo se ve en el teléfono del
 * otro al momento y se guarda solo (sincro.js). Los sonidos son de juguete (sonidos.js).
 *
 * Módulos: cuartos.js (cuartos y acomodo de entrada) · catalogo/ (las cosas, una categoría por archivo, y
 * las recetas) · monito.js (dibujo y ropa) · acciones.js (qué pasa al tocar) · mesa.js (cocinar, servir y
 * comer juntos) · mensajes.js (mensajitos y cartitas) · paneles.js (hojitas) · sonidos.js · sincro.js
 * (servidor) · iconos.js · graficos.js (los 5 perfiles y la capa WebGL 2) · fondo.js (el fondo pixel de
 * afuera). Para crecer, casi siempre basta con agregar en uno de ellos.
 *
 * Fase 54: cuartos Estudio y Terraza, muchas cosas nuevas, cocinar con recetas y comer juntos en la mesa,
 * mensajes y cartitas, monitos 2.0, cosas que se llevan con el dedo, regalito del día, mascotas que pasean,
 * luz suave (rayos de sol, lámparas que alumbran de noche, fiesta) y la canción del editor callada aquí.
 *
 * Fase 56: fondo pixel de atardecer, clima (lluvia, tormenta, tormentota con relámpagos y truenos), cinco
 * perfiles de gráficos (Ultra con WebGL 2), mensajes dentro de la burbujita, vaciar, «Compilando las
 * cositas» al entrar y todo cerrado al salir.
 */
import { el, aviso } from "../ui.js";
import * as PF from "../perfil.js";
import { vibrar } from "../../integraciones/plataforma.js";
import { sinMovimiento as reducido } from "../transiciones.js";
import { H, PISO, FONDO, FRENTE, SUELO, CUARTOS, CUARTOS_NUEVOS, ANCHO, inicioDe, cuarto, enCuarto, global, casaInicial, opsCuartoNuevo } from "./cuartos.js";
import { CATALOGO, COSAS_MANO, RECETAS, colorDe } from "./catalogo/index.js";
import { monitoSVG, ropaDe } from "./monito.js";
import { crearSonidos } from "./sonidos.js";
import { ACCIONES, GESTOS, JUNTOS, rebote } from "./acciones.js";
import { Sincro } from "./sincro.js";
import { ICO } from "./iconos.js";
import * as P from "./paneles.js";
import { cocinar, pintarPlatos, laPareja } from "./mesa.js";
import { Mensajes } from "./mensajes.js";
import { leerGfx, guardarGfx, nivel, maxParticulas, filtroPixel, crearCapaGL } from "./graficos.js";
import { pintarFondo } from "./fondo.js";
import { LluviaFisica, charcoEn } from "./lluvia.js";
import { Necesidades, NECESIDADES } from "./necesidades.js";
import { LasTraes, VEL_TRAES } from "./traes.js";
import { VozEnVivo, puedeVoz } from "./voz.js";
import { texPared, texPiso, texLluvia, texCharcos, pintarFrente, texAuto, texSol, texLuna } from "./texturas.js";

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const MAX_OBJETOS = 300;
const RECIENTES = "editordev:casita-recientes";
const POSES = ["sentado", "dormido", "banando", "columpio", "cocinando", "duchando"];
const nuevoId = () => Math.random().toString(36).slice(2, 10);
const REGALITO = "editordev:casita-regalito";
const PLEGADO = "editordev:casita-cuartos-plegados";
const PIXEL = "editordev:casita-pixel";
// Los monitos van siempre enfrente de los muebles (y las mascotas, enfrente de los muebles pero detrás de ellos).
const zMono = (y) => 1000 + Math.round(y);
const zMascota = (y) => 900 + Math.round(y);
const puedeSubir = (d) => d.capa === "piso" && d.h <= 120 && d.tope == null && !d.superficie;
export const CLIMAS = ["sol", "lluvia", "tormenta", "extra"];
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

export class Casita {
  constructor(app, { pareja = "tu amorcito", volver = null } = {}) {
    this.app = app; this.pareja = pareja; this.volver = volver;
    this.vivo = false; this.objs = new Map(); this.musicas = new Map();
    this.editando = false; this.pila = []; this.cuartoActual = "sala"; this.k = 1; this.offY = 0;
    this.son = crearSonidos(app);
    this.mensajes = new Mensajes(this);
    this.gfx = leerGfx();
  }

  /* ═════════════ Armar ═════════════ */
  montar(cont) {
    this.vivo = true;
    // Aquí suenan los sonidos de la casita, pero no la canción del editor (vuelve sola al salir).
    this.app.audio?.pausarParaVista?.(true, "casita");
    this.app.audio?.mantenerDespierto?.("casita", true);
    const d = PF.datos();
    this.yoUsuario = d.yo?.usuario || ""; this.parejaUsuario = d.pareja?.usuario || "";
    // (Fase 58) Las necesidades de tu monito, las traes y la voz en vivo.
    this.necesidades = new Necesidades(this);
    this.traes = new LasTraes(this);
    this.voz = new VozEnVivo(this);
    this.mundo = el("div.ca-mundo");
    this.lienzo = el("div.ca-lienzo", {}, [this.mundo]);
    this.vistaN = el("div.ca-vista", {}, [this.lienzo]);
    this._armarCuartos();
    // Los monitos (la primera vez, cada quien de un lado de la sala: igual en los dos teléfonos).
    const izq = String(d.yo?.usuario || "") <= String(d.pareja?.usuario || "");
    this.yo = this._monito("yo", ropaDe(d.yo?.genero), "Tú", global("sala", izq ? 130 : 520));
    this.suyo = this._monito("pareja", ropaDe(d.pareja?.genero), PF.nombreDe(d.pareja) || this.pareja, global("sala", izq ? 520 : 130));
    this.mundo.append(this.yo.n, this.suyo.n);
    this.escena = el("div.ca-escena", {}, [this.vistaN]);
    this.raiz = el("div.ca", { dataset: { sinOnda: "" } }, [this.escena]);
    // Estilo pixel (se puede quitar en Ajustes): un filtro que cuadricula cada cosa y a los monitos
    // (lo pone graficos(), más fino o más grueso según el perfil).
    this.pixel(this.leerPixel());
    this._armarHud();
    this._primera = new Promise((ok) => { this._yaLlego = ok; });
    cont.replaceChildren(this.raiz);
    this.lluviaF = new LluviaFisica(this);
    this.escena.insertBefore(this.lluviaF.cv, this.flashN);
    this.graficos(this.gfx, false);
    this._compilar();
    this._enlazar();
    this._medir();
    this._ro = new ResizeObserver(() => this._medir());
    this._ro.observe(this.vistaN);
    this.vistaN.addEventListener("scroll", () => {
      if (this.vistaN.scrollTop) this.vistaN.scrollTop = 0;
      cancelAnimationFrame(this._rqS); this._rqS = requestAnimationFrame(() => this._alDeslizar());
    }, { passive: true });
    // Pantalla completa, girar el teléfono o volver de otra app: medir y repintar (sin pantalla negra).
    this._fs = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement && this._pedida) { this._pedida = false; this._completa(false); } this._reparar(); };
    document.addEventListener("fullscreenchange", this._fs);
    document.addEventListener("webkitfullscreenchange", this._fs);
    this._gira = () => this._reparar();
    window.addEventListener("orientationchange", this._gira);
    this._vis = () => { if (document.hidden) { this.capa?.parar(); clearTimeout(this._tRayo); return; } this._reparar(); this.capa?.prender(); this._programarRayo(); if (this.raiz.classList.contains("lluvia-cv")) this.lluviaF?.prender(); };
    document.addEventListener("visibilitychange", this._vis);
    this._toque = (e) => this._alToque(e.detail || {});
    addEventListener("ed-toque-llega", this._toque);
    requestAnimationFrame(() => this.irCuarto("sala", false));
    this._tiempo();
    this._reloj = setInterval(() => this._tiempo(), 30000);
    this._amb = setInterval(() => this._ambienteTic(), 3500);
    this._tNec = setInterval(() => { if (this.vivo && !document.hidden) this.necesidades.tic(1); }, 1000);
    this.sync = new Sincro({ alRecibir: (r, p) => { this._yaLlego?.(); return r ? this._recibir(r, p) : this._pintarCasa(this.sync.casa()); }, alEstado: (t, k) => this._guardado(t, k) });
    this.sync.iniciar();
  }

  limpiar() {
    this.vivo = false;
    this.sync?.parar();
    this._ro?.disconnect();
    clearInterval(this._reloj); clearInterval(this._amb);
    this._lluviaS?.parar(); this._lluviaS = null;
    clearInterval(this._tNotas);
    for (const m of [this.yo, this.suyo]) if (m) { clearTimeout(m.tc); clearTimeout(m.tg); clearInterval(m.tp); clearTimeout(m.tgesto); clearTimeout(m.tcome); }
    for (const parar of this.musicas.values()) parar();
    this.musicas.clear();
    this._paraPrueba?.();
    this.app.audio?.mantenerDespierto?.("casita", false);
    this.app.audio?.pausarParaVista?.(false, "casita");
    document.removeEventListener("fullscreenchange", this._fs);
    document.removeEventListener("webkitfullscreenchange", this._fs);
    window.removeEventListener("orientationchange", this._gira);
    document.removeEventListener("visibilitychange", this._vis);
    removeEventListener("ed-toque-llega", this._toque);
    if (this.raiz?.classList.contains("completa")) this._completa(false);
    cancelAnimationFrame(this._rqAuto);
    // (Fase 56) Al salir se cierra todo de verdad: la capa de luces, los rayos, el teclado y la casita.
    clearTimeout(this._tRayo); clearTimeout(this._tRep); clearTimeout(this._tRel);
    this.mensajes.cerrarTodo();
    clearInterval(this._tNec); this.necesidades?.guardar();
    this.traes?.limpiar();
    this.voz?.apagar(true);
    this.capa?.destruir(); this.capa = null;
    this.lluviaF?.destruir();
    this.raiz?.remove();
  }

  /** El botón de la voz: apagado, llamando (late) o en vivo (verde); el de silenciar sólo en vivo. */
  alCambiarVoz(estado, mudo) {
    if (!this.vozB) return;
    this.vozB.classList.toggle("llamando", estado === "llamando");
    this.vozB.classList.toggle("en-vivo", estado === "en-vivo");
    this.vozB.setAttribute("aria-label", estado === "apagada" ? "Voz en vivo" : "Colgar la voz");
    this.mudoB.hidden = estado !== "en-vivo";
    this.mudoB.classList.toggle("on", !!mudo);
    this.raiz?.classList.toggle("con-voz", estado === "en-vivo");
  }
  /** (Fase 58) Tocar una necesidad: tu monito va solito a lo que la llena (la cama, la regadera, el refri…). */
  ayudaNecesidad(k) {
    const QUE = { sueno: ["cama", "hamaca", "camastro"], ducha: ["regadera", "tina"], bano: ["inodoro"], hambre: ["refri", "frutero", "galletas", "hielera"], sed: ["lavabo", "refri", "hielera", "cafetera"], diversion: ["columpio", "trampolin", "arcade", "consola"] };
    const nom = NECESIDADES.find((x) => x[0] === k);
    if (k === "diversion" && this.suyo && !this.traes.activo && this.estadoN?.classList.contains("aqui")) { aviso(`¡Jueguen a las traes! (o toca a ${this.pareja})`, 2600); this._menuSuyo(); return; }
    let mejor = null, dist = Infinity;
    for (const r of this.objs.values()) {
      if (!(QUE[k] || []).includes(r.d.k)) continue;   // (exacto: la «regadera» del baño no es la del jardín)
      const dd = Math.abs(r.gx - this.yo.gx);
      if (dd < dist) { dist = dd; mejor = r; }
    }
    if (!mejor) { aviso(nom ? nom[2] : "", 3200); return; }
    aviso(`${nom[1]}: ${nom[2].split(":")[0].toLowerCase()}`, 2200);
    this.irCuarto(mejor.o.c);
    this._tocarObj(mejor);
  }
  /** Un ratito en el que «Atrás» y «Volver atrás» no sacan del juego (al abrir/cerrar el teclado o mandar un mensaje). */
  protegerSalida(ms = 1400) { this._sinSalirHasta = performance.now() + ms; }
  _protegido() { return performance.now() < (this._sinSalirHasta || 0) || !!this._congelado; }
  /** Atrás: primero lo que esté abierto (menú, hojita, selección, Acomodar, pantalla completa). */
  atras() {
    if (this._protegido()) { if (this.mensajes.abierto()) this.mensajes.barra(false); return true; }
    if (this.cerrarMenu()) return true;
    if (this.cerrarHoja()) return true;
    if (this.mensajes.abierto()) { this.mensajes.barra(false); return true; }
    if (this.sel) { this._seleccionar(null); return true; }
    if (this.editando) { this._editar(false); return true; }
    if (this.raiz?.classList.contains("completa")) { this._completa(false); return true; }
    return false;
  }

  _armarCuartos() {
    this.cuartosN = new Map();
    this.oscuroN = new Map();
    for (const c of CUARTOS) {
      const n = el("div.ca-cuarto." + c.k + (c.afuera ? ".afuera" : ""), { dataset: { k: c.k }, style: { left: inicioDe(c.k) + "px", width: c.w + "px" } }, [
        el("div.ca-pared"), el("div.ca-zoclo"), el("div.ca-piso"),
      ]);
      const cielo = () => el("div.ca-cielo", {}, [el("i.ca-sol"), el("i.ca-nube.n1"), el("i.ca-nube.n2"), el("i.ca-nube.n3"), el("i.ca-estrellas"), el("i.ca-mariposa.m1"), el("i.ca-mariposa.m2"), el("i.ca-luciernagas")]);
      // La terraza: cielo, la ciudad a lo lejos y su barandal (sin la cerca ni la fachada del jardín).
      // (Fase 56: el fondo de afuera es pixel art dibujado una vez en un lienzo chiquito, fondo.js.)
      if (c.terraza) n.append(cielo(), el("canvas.ca-fondo-px", { "aria-hidden": "true" }), el("div.ca-lomas"), el("div.ca-ciudad"), el("div.ca-baranda"), el("canvas.ca-frente-px", { "aria-hidden": "true" }));
      else if (c.afuera) n.append(
        cielo(), el("canvas.ca-fondo-px", { "aria-hidden": "true" }),
        el("div.ca-lomas"), el("div.ca-cerca"), el("div.ca-camino"),
        el("div.ca-fachada", {}, [el("i.ca-techo"), el("i.ca-fachada-ventana"), el("i.ca-fachada-ventana.v2")]),
        el("canvas.ca-frente-px", { "aria-hidden": "true" }),
      );
      else n.append(el("i.ca-columna"), el("i.ca-techo-r"), c.foco ? el("i.ca-pendiente", { style: { left: c.foco + "px" } }, [el("i.ca-pendiente-luz")]) : null);
      this.mundo.append(n);
      this.cuartosN.set(c.k, n);
      const o = el("i.ca-oscuro." + c.k, { style: { left: inicioDe(c.k) + "px", width: c.w + "px" } });
      this.oscuroN.set(c.k, o);
      this.mundo.append(o);
      if (c.afuera) {
        const ch = el("i.ca-charcos");
        try { const t = texCharcos(c.w); ch.style.setProperty("--charcos", t.url); } catch (e) { /* nada */ }
        n.append(el("i.ca-lluvia"), ch);
      }
      if (c.afuera) {
        // (Fase 58) El sol y la luna en pixel, con su brillo; se mueven y cambian con la hora.
        const fp = n.querySelector(".ca-fondo-px");
        const sol = el("i.ca-astro.sol", { "aria-hidden": "true" }), luna = el("i.ca-astro.luna", { "aria-hidden": "true" });
        try { luna.style.backgroundImage = texLuna().url; } catch (e) { /* nada */ }
        fp?.after(sol, luna);
      }
      if (c.k === "jardin") {
        // El carrito pasa por la calle, DETRÁS de la cerca (antes pasaba por dentro).
        const auto = el("i.ca-auto");
        try { auto.style.backgroundImage = texAuto().url; } catch (e) { /* nada */ }
        const fp = n.querySelector(".ca-fondo-px");
        if (fp) fp.after(auto); else n.append(auto);
      }
    }
    // Entre cuarto y cuarto (adentro), una pared con su puerta que se abre sola al pasar.
    this.puertas = [];
    for (let i = 1; i < CUARTOS.length; i++) {
      const a = CUARTOS[i - 1], b = CUARTOS[i];
      if (a.afuera || b.afuera) continue;
      const x = inicioDe(b.k), n = el("div.ca-muro", { style: { left: x + "px" } }, [el("i.ca-muro-pared"), el("i.ca-puerta-marco"), el("i.ca-puerta-hoja", {}, [el("i.ca-puerta-perilla")])]);
      this.mundo.append(n);
      this.puertas.push({ x, n });
    }
  }
  /** Las puertas que cruza un monito en su camino se abren justo cuando pasa. */
  _puertasEnCamino(m, x0, x1, s) {
    for (const p of this.puertas || []) {
      if ((p.x - x0) * (p.x - x1) >= 0) continue;
      const t = s ? (Math.abs(p.x - x0) / Math.abs(x1 - x0)) * s * 1000 : 0;
      setTimeout(() => {
        if (!this.vivo) return;
        p.n.classList.add("abierta"); clearTimeout(p.t);
        p.t = setTimeout(() => p.n.classList.remove("abierta"), 950);
        if (m.quien === "yo" || this._visible(m)) this.sonar("puerta-cuarto", { volumen: m.quien === "yo" ? 0.7 : 0.4 });
      }, Math.max(0, t - 260));
    }
  }

  _armarHud() {
    const boton = (k, t, al, extra = "") => el("button.ca-r." + k + extra, { type: "button", "aria-label": t, title: t, onClick: al }, [el("i", { html: ICO[k] }), el("span", { text: t })]);
    this.nombreN = el("b.ca-hud-cuarto", { text: "Sala" });
    this.estadoN = el("small.ca-hud-estado", { text: "Entrando a su casita…" });
    this.guardadoN = el("small.ca-hud-guardado", { text: "Todo guardado", dataset: { k: "listo" } });
    this.completaB = boton("completa", "Pantalla completa", () => this._completa());
    this.completaB.querySelector("span").textContent = "Completa";
    this.hudN = el("div.ca-hud", {}, [
      el("div.ca-hud-izq", {}, [this.nombreN, el("div.ca-hud-linea", {}, [this.estadoN, this.guardadoN])]),
      el("div.ca-hud-der", {}, [this.mensajesB = boton("mensajes", "Mensajes", () => this.mensajes.barra()), boton("vestir", "Vestir", () => this.vestidor()), boton("acomodar", "Acomodar", () => this._editar(true)), this.completaB]),
    ]);
    this.badgeN = el("b.ca-badge", { hidden: "", "aria-label": "Sin leer" });
    this.mensajesB.append(this.badgeN);
    this.plegarB = el("button.ca-cuarto-b.plegar", { type: "button", "aria-label": "Esconder los cuartos", title: "Esconder los cuartos", html: ICO.plegar, onClick: () => this._plegar() });
    this.cuartosB = el("div.ca-hud-cuartos", { role: "tablist", "aria-label": "Cuartos" }, CUARTOS.map((c) => el("button.ca-cuarto-b", { type: "button", role: "tab", "aria-label": c.n, title: c.n, dataset: { k: c.k }, html: ICO[c.k] || ICO.corazon, onClick: () => { this.irCuarto(c.k); this.sonar("whoosh", { volumen: 0.5 }); } })));
    this.cuartosB.prepend(this.plegarB);
    try { if (localStorage.getItem(PLEGADO) === "1") this._plegar(true); } catch (e) { /* nada */ }
    this.edCuartoN = el("small");
    this.deshacerB = boton("deshacer", "Deshacer", () => this._deshacer());
    this.edicionN = el("div.ca-edicion", {}, [
      el("div.ca-ed-arriba", {}, [el("div.ca-ed-t", {}, [el("b", { text: "Acomodando" }), this.edCuartoN]), el("span.ca-hueco"), boton("vaciar", "Vaciar", () => P.vaciar(this)), this.deshacerB, boton("listo", "Listo", () => this._editar(false), ".primario")]),
      this.cajonN = P.cajonCatalogo(this),
    ]);
    this.basuraN = el("div.ca-basura", { "aria-hidden": "true" }, [el("i", { html: ICO.borrar }), el("span", { text: "Suelta aquí para quitar" })]);
    this.selN = el("div.ca-sel", { hidden: "" }, [
      el("button.ca-sel-b", { type: "button", "aria-label": "Voltear", title: "Voltear", html: ICO.voltear, onClick: () => this._voltear() }),
      this.selColorB = el("button.ca-sel-b", { type: "button", "aria-label": "Otro color", title: "Otro color", html: ICO.color, onClick: () => this._otroColor() }),
      this.selColoresN = el("div.ca-sel-colores", { role: "radiogroup", "aria-label": "Colores" }),
      el("button.ca-sel-b", { type: "button", "aria-label": "Duplicar", title: "Duplicar", html: ICO.duplicar, onClick: () => this._duplicar() }),
      el("button.ca-sel-b.peligro", { type: "button", "aria-label": "Quitar", title: "Quitar", html: ICO.borrar, onClick: () => { const r = this.sel; if (r) this._borrar(r); } }),
    ]);
    this.volverN = el("div.ca-barra", {}, [
      el("button.ca-volver", { type: "button", onClick: () => this._volver() }, [el("i", { html: ICO.volver }), el("span", { text: "Volver atrás" })]),
      this.climaB = el("button.ca-ajustes-b.clima", { type: "button", "aria-label": "El clima y la hora", title: "El clima y la hora", html: ICO.sol, onClick: () => P.clima(this) }),
      this.vozB = el("button.ca-ajustes-b.voz", { type: "button", "aria-label": "Voz en vivo", title: "Hablar en vivo los dos", html: ICO.mic, hidden: puedeVoz() ? null : "", onClick: () => this.voz.alternar() }),
      this.mudoB = el("button.ca-ajustes-b.mudo", { type: "button", "aria-label": "Silenciar mi micrófono", title: "Silenciar mi micrófono", html: ICO.mudo, hidden: "", onClick: () => this.voz.silenciar() }),
      el("button.ca-ajustes-b", { type: "button", "aria-label": "Ajustes", title: "Ajustes", html: ICO.sonido, onClick: () => P.ajustes(this) }),
    ]);
    this.flashN = el("i.ca-flash", { "aria-hidden": "true" });
    this.escena.append(this.flashN, this.hudN, this.necesidades.armar(), this.cuartosB, this.edicionN, this.basuraN);
    this.raiz.append(this.selN, this.volverN);
  }

  /** Esconder (o mostrar) los botones de los cuartos: queda sólo su botoncito. */
  _plegar(on = !this.cuartosB.classList.contains("plegado")) {
    this.cuartosB.classList.toggle("plegado", on);
    this.plegarB.innerHTML = on ? ICO.cuartos : ICO.plegar;
    this.plegarB.setAttribute("aria-label", on ? "Mostrar los cuartos" : "Esconder los cuartos");
    try { localStorage.setItem(PLEGADO, on ? "1" : "0"); } catch (e) { /* nada */ }
  }
  leerPixel() { try { return localStorage.getItem(PIXEL) !== "0"; } catch (e) { return true; } }
  pixel(on) {
    this.raiz.classList.toggle("pixel", !!on);
    try { localStorage.setItem(PIXEL, on ? "1" : "0"); } catch (e) { /* nada */ }
    if (this.casa) for (const c of CUARTOS) this._texturas(c.k, this.cfgCuarto(c.k));
  }
  /** (Fase 57) Paredes y pisos en pixel art: su tapiz y su piso como texturas chiquitas agrandadas sin suavizar. */
  _texturas(k, cfg) {
    const n = this.cuartosN?.get(k);
    if (!n) return;
    const on = this.raiz.classList.contains("pixel"), clave = on ? `${cfg.pared}|${cfg.patron}|${cfg.piso}` : "";
    if (n._tex === clave) return;
    n._tex = clave;
    const pared = n.querySelector(":scope > .ca-pared"), piso = n.querySelector(":scope > .ca-piso");
    const limpiar = (x) => Object.assign(x.style, { backgroundImage: "", backgroundSize: "", backgroundRepeat: "" });
    if (!on) { limpiar(pared); limpiar(piso); return; }
    try { Object.assign(pared.style, texPared(cfg.pared, cfg.patron)); Object.assign(piso.style, texPiso(cfg.piso)); }
    catch (e) { limpiar(pared); limpiar(piso); }
  }

  /* ═════════════ Gráficos (Fase 56): cinco perfiles que de verdad cambian lo que se dibuja ═════════════ */
  graficos(k, avisar = true) {
    this.gfx = k; guardarGfx(k);
    const nv = nivel(k), R = this.raiz;
    R.dataset.gfx = k;
    for (let i = 1; i <= 4; i++) R.classList.toggle("fx" + i, nv >= i);
    R.querySelector(".ca-filtros")?.remove();
    R.insertAdjacentHTML("afterbegin", filtroPixel(k));
    this._fondoClave = ""; this._pintarFondos();
    // Ultra: la capa WebGL 2 de luces (si el teléfono no la tiene, se queda con lo de Calidad).
    if (k === "ultra" && !reducido()) {
      if (!this.capa) {
        this.capa = crearCapaGL(this);
        if (this.capa) this.escena.insertBefore(this.capa.n, this.hudN);
        else if (avisar) aviso("Tu teléfono no tiene WebGL 2: Ultra usa los efectos de Calidad", 3200);
      }
      this.capa?.prender();
    } else { this.capa?.destruir(); this.capa = null; }
    R.classList.toggle("gl", !!this.capa);
    if (this.casa) this._clima();
  }
  _sinGL(t) { this.capa?.destruir(); this.capa = null; this.raiz?.classList.remove("gl"); if (t) aviso(t + ": Ultra sigue con los efectos de Calidad", 2600); }
  /** Lo que la capa WebGL necesita en cada cuadro: las luces prendidas (en la pantalla), la hora y el clima. */
  estadoGL() {
    const k = this.k, sx = this.vistaN.scrollLeft, oy = this.offY - (this._subir || 0), vw = this.vistaN.clientWidth, luces = [];
    const noche = this.esNoche() ? 1 : this.mundo.classList.contains("tarde") ? 0.45 : 0;
    for (const r of this.objs.values()) {
      const g = r.glow;
      if (!g || g.hidden || !g.classList.contains("on")) continue;
      const b = r.d.brilla, x = (parseFloat(g.style.left) + b.r) * k - sx;
      if (x < -b.r * k || x > vw + b.r * k) continue;
      luces.push({ x, y: oy + (parseFloat(g.style.top) + b.r) * k, r: b.r * k * 1.25, i: g.classList.contains("cuarto-oscuro") || noche ? 0.95 : 0.5, c: b.c || "#ffd68c" });
    }
    const cl = this.climaActual(), ll = { sol: 0, lluvia: 0.5, tormenta: 0.8, extra: 1 }[cl] || 0;
    return { luces, noche, lluvia: ll, viento: cl === "extra" ? 1.6 : cl === "tormenta" ? 0.9 : 0.35, flash: this._flash || 0, afuera: !!cuarto(this.cuartoActual).afuera, ambiente: noche ? [0.07, 0.06, 0.2] : ll ? [0.12, 0.14, 0.22] : [0.25, 0.12, 0.2] };
  }
  /** El fondo pixel de afuera (jardín y terraza): se dibuja sólo cuando cambia la hora, el clima o el perfil. */
  _pintarFondos() {
    if (!this.cuartosN || !this.mundo) return;
    const hora = this.esNoche() ? "noche" : this.mundo.classList.contains("tarde") ? "tarde" : "dia", clima = this.climaActual();
    const clave = `${hora}|${clima}|${this.gfx}`;
    if (clave === this._fondoClave) return;
    this._fondoClave = clave;
    for (const c of CUARTOS) {
      const n = c.afuera && this.cuartosN.get(c.k), cv = n?.querySelector(".ca-fondo-px");
      if (!cv) continue;
      const cielo = n.querySelector(".ca-cielo");
      try {
        const r = pintarFondo(cv, { ancho: c.w, hora, clima, tipo: c.terraza ? "ciudad" : "barrio", semilla: c.terraza ? 7 : 3 });
        n.classList.add("px");
        if (cielo) cielo.style.background = r.arriba;   // arriba del dibujo, el mismo color del cielo
        const sol = n.querySelector(".ca-astro.sol");
        if (sol) sol.style.backgroundImage = texSol(hora === "tarde").url;
        const fr = n.querySelector(".ca-frente-px");
        if (fr) pintarFrente(fr, { tipo: c.terraza ? "terraza" : "jardin", ancho: c.w, hora });
      } catch (e) { n.classList.remove("px"); if (cielo) cielo.style.background = ""; }
    }
  }
  /** «Compilando las cositas»: prepara todo antes de jugar (dibujos, fondo, sonidos, luces y la casa) para que luego vaya fluido. */
  async _compilar() {
    const barra = el("i.ca-carga-barra"), txt = el("small", { text: "Preparando…" });
    const n = el("div.ca-carga", { role: "status", "aria-live": "polite" }, [el("div.ca-carga-caja", {}, [
      el("i.ca-carga-ico", { html: ICO.cuartos }), el("b", { text: "Compilando las cositas" }), el("div.ca-carga-pista", {}, [barra]), txt,
    ])]);
    this.raiz.append(n);
    this.cargaN = n;
    const pasos = [
      ["Dibujando los muebles", () => { for (const d of Object.values(CATALOGO)) { try { d.arte({}, colorDe(d, {})); } catch (e) { /* nada */ } } }],
      ["Pintando el cielo y la ciudad", () => this._pintarFondos()],
      ["Afinando los sonidos", () => this.son.precargar()],
      ["Prendiendo las luces", () => this.capa?.prender()],
      ["Abriendo la puerta", () => this._primera],
    ];
    for (let i = 0; i < pasos.length; i++) {
      if (!this.vivo) return;
      txt.textContent = pasos[i][0] + "…";
      barra.style.transform = `scaleX(${((i + 0.4) / pasos.length).toFixed(2)})`;
      await new Promise((ok) => requestAnimationFrame(() => setTimeout(ok, 0)));
      try { await Promise.race([pasos[i][1](), new Promise((ok) => setTimeout(ok, 4000))]); } catch (e) { /* sigue */ }
    }
    barra.style.transform = "scaleX(1)";
    n.classList.add("fuera");
    setTimeout(() => { n.remove(); if (this.cargaN === n) this.cargaN = null; }, 380);
  }

  /* ═════════════ Cámara y medidas ═════════════ */
  _medir() {
    // (Mientras escribes, la casita no cambia de tamaño aunque el teclado achique la pantalla.)
    if (this._congelado) { this._moverMundo(); return; }
    const vh = this.vistaN.clientHeight, vw = this.vistaN.clientWidth;
    if (!vh || !vw) return;
    // El alto manda, pero en un teléfono parado no se agranda tanto que no quepa casi nada de un cuarto.
    // (Abajo se deja lugar para los cuartitos (o, al acomodar, para el cajón): ahí se ve el piso, que sigue.)
    const abajo = this.editando ? Math.min(vh * 0.45, (this.cajonN?.offsetHeight || 150) + 18) : 58;
    this.k = lim(Math.min((vh - abajo) / H, vw / 400), 0.42, 1.45);
    this.offY = Math.max(0, vh - abajo - H * this.k);
    this._moverMundo();
    this.mundo.style.setProperty("--techo", (-this.offY / this.k).toFixed(1) + "px");
    this.lienzo.style.width = Math.round(ANCHO * this.k) + "px";
    this.lienzo.style.height = vh + "px";
    this._ubicarSel();
  }
  /** `_subir`: cuánto se sube la casita para que tu monito y su burbujita se vean arriba del teclado. */
  _moverMundo() { this.mundo.style.transform = `translate(0px, ${(this.offY - (this._subir || 0)).toFixed(1)}px) scale(${this.k.toFixed(4)})`; }
  /** Después de pantalla completa, girar el teléfono o volver de otra app: medir de nuevo y repintar las capas
   *  (algunos teléfonos se quedaban con la pantalla negra). */
  _reparar() {
    if (!this.vivo) return;
    clearTimeout(this._tRep);
    const una = () => {
      if (!this.vivo || !this.mundo.isConnected) return;
      this.mensajes._sinDesplazar();
      this.mundo.style.display = "none"; void this.mundo.offsetHeight; this.mundo.style.display = "";
      this._medir(); this._seguir(this.yo.gx);
    };
    requestAnimationFrame(() => requestAnimationFrame(una));
    this._tRep = setTimeout(una, 450);
  }
  /** Un punto del mundo en la pantalla. */
  enPantalla(gx, y) { const r = this.mundo.getBoundingClientRect(); return { x: r.left + gx * this.k, y: r.top + y * this.k }; }
  _xy(e) { const r = this.mundo.getBoundingClientRect(); return { x: (e.clientX - r.left) / this.k, y: (e.clientY - r.top) / this.k }; }
  irCuarto(k, suave = true) {
    const c = cuarto(k), x = (inicioDe(c.k) + c.w / 2) * this.k - this.vistaN.clientWidth / 2;
    this.vistaN.scrollTo({ left: Math.max(0, x), behavior: suave && !reducido() ? "smooth" : "auto" });
  }
  _seguir(gx) {
    const v = this.vistaN, px = gx * this.k, m = Math.min(90, v.clientWidth * 0.2);
    if (px < v.scrollLeft + m || px > v.scrollLeft + v.clientWidth - m) v.scrollTo({ left: px - v.clientWidth / 2, behavior: reducido() ? "auto" : "smooth" });
  }
  _alDeslizar() {
    const centro = (this.vistaN.scrollLeft + this.vistaN.clientWidth / 2) / (this.k || 1);
    const { c } = enCuarto(centro);
    this._ubicarSel();
    if (c === this.cuartoActual && this._pintado) return;
    this._pintado = true;
    this.cuartoActual = c;
    this.nombreN.textContent = cuarto(c).n;
    this.edCuartoN.textContent = cuarto(c).n;
    for (const b of this.cuartosB.children) { const on = b.dataset.k === c; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); }
    this._musicas();
    this._lejos();
  }
  /** Lo que queda a más de un cuarto de distancia no se dibuja ni se anima (menos trabajo, menos calor). */
  _lejos() {
    if (!this.vistaN || !this.k) return;
    // (Lo que se ve, más casi un cuarto de cada lado: así nunca se nota al deslizar.)
    const a = this.vistaN.scrollLeft / this.k - 900, b = (this.vistaN.scrollLeft + this.vistaN.clientWidth) / this.k + 900;
    const cerca = new Set(CUARTOS.filter((c) => inicioDe(c.k) < b && inicioDe(c.k) + c.w > a).map((c) => c.k));
    for (const c of CUARTOS) { const n = this.cuartosN.get(c.k); n?.classList.toggle("lejos", !cerca.has(c.k)); }
    for (const r of this.objs.values()) { const lejos = !cerca.has(r.o.c) && r.o.id !== this.arrastrandoId; r.n.classList.toggle("lejos", lejos); r.fr?.classList.toggle("lejos", lejos); if (r.glow) r.glow.classList.toggle("lejos", lejos); }
  }

  /* ═════════════ La casa: cuartos y objetos ═════════════ */
  cfgCuarto(k) { const c = cuarto(k); return { pared: c.pared, patron: c.patron, piso: c.piso, luz: true, ...(this.casa?.cuartos?.[k] || {}) }; }
  ponerCuarto(k, v) {
    const antes = this.cfgCuarto(k);
    this.pila.push([{ o: "cuarto", k, v: Object.fromEntries(Object.keys(v).map((x) => [x, antes[x]])) }]);
    this.sync.op({ o: "cuarto", k, v });
    this._pintarCasa(this.sync.casa());
  }
  cuartoLuz(k) { const on = this.cfgCuarto(k).luz === false; this.sync.op({ o: "cuarto", k, v: { luz: on } }); this._pintarCasa(this.sync.casa()); }

  _pintarCasa(casa) {
    if (!casa) return;
    this.casa = casa;
    for (const c of CUARTOS) {
      const n = this.cuartosN.get(c.k), cfg = this.cfgCuarto(c.k);
      n.style.setProperty("--pared", cfg.pared);
      n.dataset.patron = cfg.patron; n.dataset.piso = cfg.piso;
      this._texturas(c.k, cfg);
      this.oscuroN.get(c.k).classList.toggle("apagado", cfg.luz === false);
      n.classList.toggle("apagado", cfg.luz === false);
    }
    const vistos = new Set();
    for (const o of casa.objetos || []) {
      const d = CATALOGO[o.t];
      if (!d || !CUARTOS.some((c) => c.k === o.c)) continue;
      vistos.add(o.id);
      let r = this.objs.get(o.id);
      const nuevo = !r;
      if (!r) { r = this._crearObj(o, d); this.objs.set(o.id, r); }
      else if ((r.o.e?.col | 0) !== (o.e?.col | 0)) this._dibujarObj(r, o);
      const movio = !nuevo && (r.o.x !== o.x || r.o.y !== o.y || r.o.c !== o.c);
      r.o = JSON.parse(JSON.stringify(o));
      if (o.id === this.arrastrandoId) continue;
      if (movio && !reducido()) { r.n.classList.add("se-mueve"); r.fr?.classList.add("se-mueve"); clearTimeout(r.tm); r.tm = setTimeout(() => { r.n.classList.remove("se-mueve"); r.fr?.classList.remove("se-mueve"); }, 520); }
      this._colocar(r);
      this._estadoClases(r);
      if (nuevo && this._yaPintada && !reducido()) { r.n.classList.add("aparece"); setTimeout(() => r.n.classList.remove("aparece"), 600); }
    }
    for (const [id, r] of this.objs) {
      if (vistos.has(id)) continue;
      this.objs.delete(id);
      if (this.sel === r) this._seleccionar(null);
      for (const m of [this.yo, this.suyo]) if (m.mueble.startsWith(id + ":")) { this._pose(m, ""); m.y = lim(m.y + 30, FONDO, FRENTE); m.n.style.top = m.y + "px"; }
      this._quitarNodo(r);
    }
    this._yaPintada = true;
    this._lejos();
    this._marcarOcupados();
    this._musicas();
    this.mensajes.marcas();
    this._tiempo();
    this._clima();
  }
  _crearObj(o, d) {
    const n = el("div.ca-obj." + d.k + ".capa-" + d.capa + (d.mascota ? ".mascota" : "") + (d.portatil ? ".portatil" : ""), { dataset: { id: o.id }, role: d.al || d.lugares || d.portatil ? "button" : null, "aria-label": d.n, style: { width: d.w + "px", height: d.h + "px" } });
    const r = { o, d, n, fr: null, gx: 0 };
    if (d.frente) { r.fr = el("div.ca-obj-frente." + d.k, { style: { width: d.w + "px", height: d.h + "px" } }); this.mundo.append(r.fr); }
    this._dibujarObj(r, o);
    if (d.dom) n.append(d.dom());
    // La luz del sol que entra por la ventana (con su polvito) y el brillo de las lámparas de noche.
    if (d.rayo) n.prepend(el("i.ca-rayo", {}, [el("i.ca-polvito")]));
    if (d.brilla) { r.glow = el("i.ca-brillo", { style: { width: d.brilla.r * 2 + "px", height: d.brilla.r * 2 + "px", "--c": d.brilla.c || "#ffd68c" } }); this.mundo.append(r.glow); }
    this.mundo.append(n);
    if (d.k === "reloj") this._ponerReloj(n);
    return r;
  }
  _dibujarObj(r, o) {
    const C = colorDe(r.d, o.e);
    const arte = r.n.querySelector(":scope > .ca-obj-arte") || r.n.appendChild(el("div.ca-obj-arte"));
    arte.innerHTML = r.d.arte(o.e || {}, C);
    if (r.fr) r.fr.innerHTML = `<div class="ca-obj-arte">${r.d.frente(o.e || {}, C)}</div>`;
  }
  _colocar(r) {
    const { o, d } = r, gx = global(o.c, o.x);
    r.gx = gx;
    let z = d.capa === "alfombra" ? 3 : d.capa === "pared" ? 10 + Math.round(o.y / 60) : Math.round(o.y);
    if (d.mascota) z = zMascota(o.y);
    // (Encima de un mueble: justo enfrente de él.)
    else if (puedeSubir(d)) { const a = this._encima(gx, o.y, o.id); if (a) z = (parseInt(a.r.n.style.zIndex, 10) || 0) + 1; }
    for (const n of [r.n, r.fr]) { if (!n) continue; n.style.left = (gx - d.w / 2).toFixed(1) + "px"; n.style.top = (o.y - d.h).toFixed(1) + "px"; n.classList.toggle("f", !!o.f); }
    r.n.style.zIndex = z;
    if (r.fr) r.fr.style.zIndex = z + 2;
    if (r.glow) {
      const b = d.brilla, x = gx - d.w / 2 + (o.f ? d.w - b.x : b.x), y = o.y - d.h + b.y;
      r.glow.style.left = (x - b.r).toFixed(1) + "px"; r.glow.style.top = (y - b.r).toFixed(1) + "px";
    }
  }
  /** La superficie de un mueble justo debajo de (gx, y): para que lo que sueltas se quede encima. */
  /** ¿Está encima de un mueble (sobre su tablero)? Con el piso hondo, una mesa de adelante tiene su tablero más abajo que el fondo. */
  _encima(gx, y, sinId) {
    const a = this._apoyo(gx, y, sinId);
    return a && Math.abs(a.y - y) <= 3 && (y < FONDO || a.r.o.y > y + 4) ? a : null;
  }
  _apoyo(gx, y, sinId) {
    let mejor = null;
    for (const r of this.objs.values()) {
      if (r.o.id === sinId || r.d.tope == null || Math.abs(gx - r.gx) > r.d.w / 2 - 4) continue;
      const tope = r.o.y - r.d.h + r.d.tope;
      if (tope < y - 16) continue;
      if (!mejor || tope < mejor.y) mejor = { y: tope, r };
    }
    return mejor;
  }
  /** Física de juguete: cae desde `alto` (con su rebotito, polvito y sonido al tocar). */
  _caer(r, alto) {
    if (reducido() || Math.abs(alto) < 6) return;
    const t = Math.min(700, 260 + Math.sqrt(Math.abs(alto)) * 28);
    r.n.animate([
      { transform: `translateY(${-alto}px)`, easing: "cubic-bezier(.55,0,1,.45)" },
      { transform: "translateY(0) scale(1.08,.9)", offset: 0.62, easing: "ease-out" },
      { transform: `translateY(${-Math.min(26, alto * 0.22)}px)`, offset: 0.8, easing: "ease-in" },
      { transform: "translateY(0)" },
    ], { duration: t });
    setTimeout(() => { if (!this.vivo) return; this.particulas("polvo", { gx: r.gx, y: r.o.y }, 0, 0, 2); this.sonar("boing", { volumen: 0.45 }); }, t * 0.62);
  }
  _estadoClases(r) {
    const e = r.o.e || {}, n = r.n;
    for (const c of [...n.classList]) if (c.startsWith("e-") && !e[c.slice(2)]) n.classList.remove(c);
    for (const [k, v] of Object.entries(e)) {
      if (k === "col" || (r.d.superficie && /^p\d+$/.test(k))) continue;
      if (typeof v === "boolean") { n.classList.toggle("e-" + k, v); r.fr?.classList.toggle("e-" + k, v); }
      else n.dataset[k] = String(v);
    }
    const apagado = this.cfgCuarto(r.o.c).luz === false;
    if (r.d.luz) n.classList.toggle("apagada", apagado);
    if (e.receta && RECETAS[e.receta]) n.style.setProperty("--comida", RECETAS[e.receta].color);
    if (r.d.superficie) pintarPlatos(r);
    if (r.glow) {
      const b = r.d.brilla, p = b.propio;
      const on = b.siempre ? true : p ? (p[0] === "!" ? !e[p.slice(1)] : !!e[p]) : !apagado;
      r.glow.classList.toggle("on", on);
      r.glow.classList.toggle("cuarto-oscuro", apagado);
    }
  }
  _quitarNodo(r) {
    r.glow?.remove();
    const fuera = () => { r.n.remove(); r.fr?.remove(); };
    if (reducido()) return fuera();
    r.n.classList.add("se-va"); r.fr?.classList.add("se-va");
    setTimeout(fuera, 420);
  }
  _marcarOcupados() {
    const oc = new Set([this.yo.mueble, this.suyo.mueble].filter(Boolean).map((m) => m.split(":")[0]));
    for (const [id, r] of this.objs) { r.n.classList.toggle("ocupado", oc.has(id)); r.fr?.classList.toggle("ocupado", oc.has(id)); }
  }
  /** Un estado del objeto que se guarda y ve tu amorcito (prendido, canal, cortinas…). */
  estado(o, cambios) {
    const r = this.objs.get(o.id);
    if (!r) return;
    r.o.e = { ...(r.o.e || {}), ...cambios };
    o.e = r.o.e;
    this._estadoClases(r);
    this.sync.op({ o: "estado", id: o.id, e: cambios });
    this._musicas();
  }
  /** Algo que pasa un ratito sólo aquí (la puerta del refri abierta, el agua corriendo…). */
  mientras(o, clase, ms) { const r = this.objs.get(o.id); if (!r) return; r.n.classList.add(clase); r.fr?.classList.add(clase); setTimeout(() => { r.n.classList.remove(clase); r.fr?.classList.remove(clase); }, ms); }

  /** La música (tocadiscos, cajita, bocina): suena si está prendida y estás viendo ese cuarto. Con la
   *  bocina de fiesta prendida, su cuarto se llena de lucecitas de colores. */
  _musicas() {
    let quiere = null;
    const fiesta = new Set();
    for (const r of this.objs.values()) {
      if (!r.d.musica || !r.o.e?.on) continue;
      if (r.d.fiesta) fiesta.add(r.o.c);
      if (!quiere && r.o.c === this.cuartoActual && !this.editando && this.son.pref.musica !== false) quiere = r;
    }
    for (const [k, o] of this.oscuroN) o.classList.toggle("fiesta", fiesta.has(k));
    for (const [id, parar] of this.musicas) if (id !== quiere?.o.id) { parar(); this.musicas.delete(id); }
    if (quiere && !this.musicas.has(quiere.o.id)) this.musicas.set(quiere.o.id, this.son.musica(quiere.d.musica));
  }
  /** (Ajustes) Al prender o apagar la música de los aparatos. */
  alCambiarMusica() { for (const parar of this.musicas.values()) parar(); this.musicas.clear(); this._musicas(); }
  /** Una canción un ratito (karaoke y para escucharla en Ajustes). */
  probarMusica(nombre, ms = 3500) {
    this._paraPrueba?.();
    const parar = this.son.musica(nombre);
    const t = setTimeout(() => this._paraPrueba?.(), ms);
    this._paraPrueba = () => { clearTimeout(t); parar?.(); this._paraPrueba = null; };
  }
  esNoche() { return this.mundo.classList.contains("noche"); }
  /** El reloj: día → tarde → noche → la hora de verdad (lo ven los dos). */
  cambiarHora() {
    const orden = ["dia", "tarde", "noche", "real"], ahora = this.casa?.cuartos?.jardin?.hora || "real";
    const sig = orden[(orden.indexOf(ahora) + 1) % orden.length];
    this.sync.op({ o: "cuarto", k: "jardin", v: { hora: sig } });
    this._pintarCasa(this.sync.casa());
    this.decir({ dia: "¡Ya es de día!", tarde: "Ya es de tarde", noche: "Ya es de noche", real: "Como la hora de verdad" }[sig], false);
  }
  /** La hora elegida (dia, tarde, noche o la de verdad). */
  ponerHora(k) {
    if ((this.casa?.cuartos?.jardin?.hora || "real") === k) return;
    this.sync.op({ o: "cuarto", k: "jardin", v: { hora: k } });
    this._pintarCasa(this.sync.casa());
  }
  /** El clima (lo ven los dos): sol, lluvia, tormenta o tormentota. Con lluvia, el perrito se mete a su casita. */
  climaActual() { const j = this.casa?.cuartos?.jardin; return CLIMAS.includes(j?.clima) ? j.clima : j?.lluvia ? "lluvia" : "sol"; }
  ponerClima(k) {
    if (!CLIMAS.includes(k) || k === this.climaActual()) return;
    this.sync.op({ o: "cuarto", k: "jardin", v: { clima: k, lluvia: k !== "sol" } });
    this._pintarCasa(this.sync.casa());
    if (k === "sol") this.sonar("pajaritos");
    if (k === "tormenta" || k === "extra") setTimeout(() => this._relampago(true), 500);
    aviso({ sol: "Salió el sol", lluvia: "Empezó a llover", tormenta: "Se soltó una tormenta", extra: "¡Tormentota! Con viento y muchos rayos" }[k], 2000);
  }
  _clima() {
    const cl = this.climaActual(), lluvia = cl !== "sol";
    this.mundo.classList.toggle("lluvia", lluvia);
    this.mundo.classList.toggle("tormenta", cl === "tormenta" || cl === "extra");
    this.mundo.classList.toggle("extra", cl === "extra");
    if (lluvia) { try { this.mundo.style.setProperty("--lluvia-px", texLluvia(cl).url); } catch (e) { /* nada */ } }
    // (Fase 58) La lluvia con física (gotas, salpicaduras y ondas en los charcos); en Máximo rendimiento, la sencilla.
    const fisica = lluvia && this.gfx !== "max" && !reducido();
    this.raiz.classList.toggle("lluvia-cv", fisica);
    if (fisica) this.lluviaF?.prender();
    this.climaB?.classList.toggle("on", lluvia);
    if (this.climaB && this.climaB.dataset.k !== cl) { this.climaB.dataset.k = cl; this.climaB.innerHTML = ICO[{ sol: "sol", lluvia: "lluvia", tormenta: "rayo", extra: "extra" }[cl]]; }
    for (const r of this.objs.values()) {
      if (r.d.k !== "perrito") continue;
      const casa = cuarto(r.o.c).afuera ? [...this.objs.values()].find((x) => x.d.k === "casita_perro" && x.o.c === r.o.c) : null;
      const dentro = lluvia && !!casa;
      if (casa) { r.n.style.setProperty("--a-x", (casa.gx - r.gx).toFixed(0) + "px"); r.n.style.setProperty("--a-y", (casa.o.y - r.o.y).toFixed(0) + "px"); casa.n.classList.toggle("con-perro", dentro); }
      r.n.classList.toggle("refugiado", dentro);
    }
    if (cl !== this._climaVisto) { this._climaVisto = cl; this._ambienteTic(true); this._programarRayo(); }
    this._pintarFondos();
  }
  /** Con tormenta, un relámpago cada tantito (con tormentota, más seguido y más cerca). */
  _programarRayo() {
    clearTimeout(this._tRayo);
    const cl = this.climaActual();
    if (!this.vivo || document.hidden || (cl !== "tormenta" && cl !== "extra")) return;
    const espera = cl === "extra" ? 3500 + Math.random() * 5500 : 7000 + Math.random() * 9000;
    this._tRayo = setTimeout(() => { this._relampago(Math.random() < (cl === "extra" ? 0.6 : 0.35)); this._programarRayo(); }, espera);
  }
  /** Un relámpago: destella (más afuera), lo de enfrente echa sombra y el trueno llega después, según qué tan lejos cayó. */
  _relampago(cerca = false, lejos = false) {
    if (!this.vivo || document.hidden) return;
    const afuera = !!cuarto(this.cuartoActual).afuera, dist = lejos ? 0.95 : cerca ? 0.1 + Math.random() * 0.2 : 0.35 + Math.random() * 0.4;
    const F = (1 - dist) * (afuera ? 1 : 0.45);
    if (!reducido()) {
      this.flashN.style.setProperty("--fuerza", F.toFixed(2));
      this.flashN.classList.remove("ver"); void this.flashN.offsetWidth; this.flashN.classList.add("ver");
      this.mundo.classList.add("relampago"); clearTimeout(this._tRel);
      this._tRel = setTimeout(() => { this.mundo.classList.remove("relampago"); this.flashN.classList.remove("ver"); }, 720);
      // (En Ultra lo dibuja también la capa WebGL: un destello doble que se apaga.)
      if (this.capa) {
        const t0 = performance.now();
        const paso = () => { const t = performance.now() - t0; this._flash = t < 90 ? F : t < 160 ? F * 0.25 : t < 260 ? F * 0.8 : Math.max(0, F * 0.8 * (1 - (t - 260) / 440)); if (t < 700 && this.vivo) requestAnimationFrame(paso); else this._flash = 0; };
        paso();
      }
    }
    // La luz llega antes que el sonido: mientras más lejos, más tarda y más bajito.
    setTimeout(() => { if (!this.vivo) return; this.sonar(dist < 0.5 ? "trueno" : "trueno-lejos", { volumen: (afuera ? 1 : 0.5) * (1.1 - dist * 0.7) }); if (dist < 0.3) vibrar(20); }, 120 + dist * 2600);
  }
  /** El ambiente de afuera: lluvia (y truenos), pajaritos de día, grillos de noche y carros que pasan. */
  _ambienteTic(soloLluvia = false) {
    if (!this.vivo || document.hidden) return;
    const afuera = !!cuarto(this.cuartoActual).afuera, cl = this.climaActual(), lluvia = cl !== "sol";
    const fuerza = { lluvia: 1, tormenta: 1.3, extra: 1.6 }[cl] || 0, nv = afuera ? fuerza : fuerza * 0.35;
    if (lluvia) { if (!this._lluviaS) this._lluviaS = this.son.lluvia(nv); else this._lluviaS.nivel(nv); }
    else if (this._lluviaS) { this._lluviaS.parar(); this._lluviaS = null; }
    // (Para los reflejos de Ultra en el piso mojado: quién anda afuera.)
    for (const m of [this.yo, this.suyo]) m?.n.classList.toggle("fuera", !!cuarto(enCuarto(m.gx).c).afuera);
    if (soloLluvia || this.editando) return;
    const r = Math.random();
    if (cl === "lluvia" && r < 0.05) this._relampago(false, true);
    if (cl === "extra" && r < 0.35) this.sonar("viento", { volumen: afuera ? 0.75 : 0.3 });
    if (!lluvia && afuera) { if (this.esNoche()) { if (r < 0.55) this.sonar("grillo", { volumen: 0.5 }); } else if (r < 0.4) this.sonar("pajaritos", { volumen: 0.55 }); }
    if (r > 0.86) {
      this.sonar("auto", { volumen: afuera ? 0.8 : 0.22 });
      if (Math.random() < 0.25) setTimeout(() => this.sonar("claxon", { volumen: afuera ? 0.5 : 0.15 }), 800);
      const a = this.cuartosN.get("jardin")?.querySelector(".ca-auto");
      if (a && !reducido()) { a.classList.remove("pasa"); void a.offsetWidth; a.classList.add("pasa"); }
    }
  }
  _tiempo() {
    const modo = this.casa?.cuartos?.jardin?.hora || "real", h = new Date().getHours();
    const noche = modo === "noche" || (modo === "real" && (h >= 20 || h < 7)), tarde = modo === "tarde" || (modo === "real" && h >= 18 && h < 20);
    this.mundo.classList.toggle("noche", noche);
    this.mundo.classList.toggle("tarde", !noche && tarde);
    this.raiz?.classList.toggle("es-noche", noche);
    for (const r of this.objs.values()) if (r.d.k === "reloj") this._ponerReloj(r.n);
    this._pintarFondos();
  }
  _ponerReloj(n) {
    const d = new Date(), m = d.getMinutes(), h = (d.getHours() % 12) + m / 60;
    n.style.setProperty("--h", h * 30 + "deg"); n.style.setProperty("--m", m * 6 + "deg");
  }

  /* ═════════════ Los monitos ═════════════ */
  _monito(quien, ropa, nombre, gx) {
    const cuerpo = el("div.ca-mono-cuerpo", { html: monitoSVG(ropa) });
    const llevaN = el("i.ca-lleva", { hidden: "" });
    const flip = el("div.ca-mono-flip", {}, [cuerpo, llevaN]);
    const caja = el("div.ca-mono-caja", {}, [flip]);
    const globo = el("div.ca-globo", { hidden: "" });
    const globos = el("div.ca-globos", { "aria-live": "polite" });
    const nombreN = el("span.ca-mono-nombre", { text: nombre });
    const n = el("div.ca-monito." + quien, { role: "img", "aria-label": nombre, style: { left: gx + "px", top: SUELO + "px", zIndex: zMono(SUELO) } }, [caja, globo, globos, nombreN]);
    return { quien, n, caja, cuerpo, llevaN, globo, globos, nombreN, gx, y: SUELO, ropa: { ...ropa }, accion: "", mueble: "", lleva: "", mira: 1, orden: 0, t: 0, evAt: 0, dt: 0 };
  }
  _vestirMono(m, ropa) { m.ropa = { ...m.ropa, ...ropa }; m.cuerpo.innerHTML = monitoSVG(m.ropa); if (m.lleva) this._ponerLleva(m, m.lleva); }
  /** 2.5D: más atrás (y chica) se ve un poquito más chiquito; adelante, normal. */
  _prof(m, y = m.y) { m.n.style.setProperty("--prof", (0.9 + 0.1 * lim((y - FONDO) / (FRENTE - FONDO), 0, 1)).toFixed(3)); }
  /** Voltear: al instante, con un saltito (antes giraba como hoja de papel). */
  _mirar(m, lado) {
    const antes = m.mira;
    m.mira = lado < 0 ? -1 : 1; m.n.classList.toggle("izq", m.mira < 0);
    if (antes !== m.mira && !reducido() && nivel(this.gfx) >= 1) m.caja.animate([{ translate: "0 0" }, { translate: "0 -3px" }, { translate: "0 0" }], { duration: 150, easing: "ease-out" });
  }
  _visible(m) { const v = this.vistaN, px = m.gx * this.k; return px > v.scrollLeft - 40 && px < v.scrollLeft + v.clientWidth + 40; }
  /** Caminar hasta (gx, y) (y es lo hondo del piso) y luego `luego()`. */
  _caminar(m, gx, y, luego = null, ya = false) {
    clearTimeout(m.tc); clearInterval(m.tp);
    this._pose(m, "");
    gx = lim(gx, 24, ANCHO - 24); y = lim(y, FONDO, FRENTE);
    // (Al caminar se sueltan los gestos y lo que hacía con las manos: así los brazos nunca se quedan en un loop raro.)
    m.n.classList.remove("tocando", "comiendo", ...GESTOS.map((x) => "g-" + x[0])); clearTimeout(m.tgesto); clearTimeout(m.ttoca);
    this._prof(m, y);
    const d = Math.hypot(gx - m.gx, (y - m.y) * 1.6);
    if (Math.abs(gx - m.gx) > 2) this._mirar(m, gx - m.gx);
    // (Cerquita camina; lejos, corre: cruzar la casa no tarda una eternidad.)
    // (Jugando a las traes, los dos caminan igual de rápido: nadie corre más que el otro.)
    const vel = this.traes?.activo ? VEL_TRAES : lim(d * 0.55, 210, 620), s = ya || reducido() ? 0 : Math.max(0.18, d / vel);
    m.n.classList.toggle("corre", vel > 330);
    m.n.style.transitionDuration = s + "s";
    m.n.style.zIndex = zMono(Math.max(m.y, y));
    m.n.style.left = gx.toFixed(1) + "px"; m.n.style.top = y.toFixed(1) + "px";
    this._puertasEnCamino(m, m.gx, gx, s);
    m.gx = gx; m.y = y;
    m.llega = performance.now() + s * 1000;
    if (s > 0.2) {
      m.n.classList.add("camina");
      if (m.quien === "yo" || this._visible(m)) { let i = 0; m.tp = setInterval(() => this.sonar(i++ % 2 ? "paso" : "paso2", { volumen: m.quien === "yo" ? 0.9 : 0.5 }), vel > 330 ? 170 : 260); }
    }
    m.tc = setTimeout(() => { m.n.classList.remove("camina", "corre"); clearInterval(m.tp); m.n.style.zIndex = zMono(y); luego?.(); }, s * 1000 + 30);
    if (m.quien === "yo" && !ya) this._seguir(gx);
  }
  _pose(m, pose, mueble = "", z = null) {
    m.accion = pose; m.mueble = mueble;
    m.n.classList.remove(...POSES);
    if (pose) m.n.classList.add(pose);
    if (z != null) m.n.style.zIndex = z;
    // (En la hamaca se acomoda en la curva de la tela, más chiquito y meciéndose.)
    m.n.classList.toggle("en-hamaca", pose === "dormido" && this.objs.get(mueble.split(":")[0])?.d.k === "hamaca");
    if (pose === "dormido") { m.globo.hidden = false; m.globo.textContent = "z z z"; m.globo.classList.add("zzz"); }
    else if (m.globo.classList.contains("zzz")) { m.globo.classList.remove("zzz"); m.globo.hidden = true; }
    this._marcarOcupados?.();
  }
  /** Llevar a un monito a un lugar de un mueble (caminando, o de una vez). */
  _irLugar(m, r, jx, ya = false) {
    const l = r.d.lugares?.[jx];
    if (!l) return Promise.resolve(false);
    const sx = r.o.f ? -1 : 1, gx = r.gx + l.dx * sx, ySit = r.o.y + l.dy;
    const orden = ++m.orden;
    return new Promise((ok) => {
      this._caminar(m, gx, lim(r.o.y + 22, FONDO, FRENTE), () => {
        if (m.orden !== orden || !this.vivo || !this.objs.has(r.o.id)) return ok(false);
        m.n.style.transitionDuration = ya || reducido() ? "0s" : ".32s";
        m.n.style.top = ySit + "px"; m.y = ySit; this._prof(m, r.o.y);
        if (l.mira) this._mirar(m, l.mira * sx);
        const z = l.z != null ? (parseInt(r.n.style.zIndex, 10) || 0) + l.z : Math.round(ySit);
        this._pose(m, l.pose, `${r.o.id}:${jx}`, z);
        ok(true);
      }, ya);
    });
  }
  _posYo() { const { c, x } = enCuarto(this.yo.gx); return { c, x: Math.round(x), y: Math.round(this.yo.y), mira: this.yo.mira }; }
  _mandarYo(d = {}) { this.sync?.yo({ ...this._posYo(), accion: this.yo.accion, mueble: this.yo.mueble, ...d }); }

  // ── Lo que usan las acciones (acciones.js) ──
  sonar(n, op) { this.son.sonar(n, op); }
  esperar(ms) { return new Promise((r) => setTimeout(r, ms)); }
  sigueEn(o) { return this.yo.mueble.startsWith(o.id + ":"); }
  /** ¿Ese lugar lo tiene (o va hacia él) ese monito? (Lo de tu amorcito llega antes de que termine de caminar.) */
  ocupado(m, lugar) { return m.mueble === lugar || m.destino === lugar; }
  async usarLugar(o, jx = null) {
    const r = this.objs.get(o.id);
    if (!r?.d.lugares) return false;
    if (this.sigueEn(o) && jx == null) { this.pararse(); return false; }
    const libres = r.d.lugares.map((_, i) => i).filter((i) => !this.ocupado(this.suyo, `${o.id}:${i}`));
    const j = jx != null && libres.includes(jx) ? jx : libres[0];
    if (j == null) { this.decir("Ya está ocupado", false); this.sonar("nop"); return false; }
    const l = r.d.lugares[j], sx = r.o.f ? -1 : 1;
    const { c, x } = enCuarto(r.gx + l.dx * sx);
    this.sync.yo({ c, x: Math.round(x), y: Math.round(r.o.y + l.dy), mira: l.mira ? l.mira * sx : this.yo.mira, accion: l.pose, mueble: `${o.id}:${j}` });
    const ok = await this._irLugar(this.yo, r, j);
    if (ok && l.pose === "columpio") setTimeout(() => this.vivo && this.sigueEn(o) && this._globo(this.yo, `Pídele a ${this.pareja} que te empuje`, 4600), 400);
    if (ok) { vibrar(8); this.sonar({ dormido: "dormir", banando: "burbujas", columpio: "whoosh" }[l.pose] || "sentar"); if (l.pose === "banando") this.particulas("burbuja", { gx: this.yo.gx, y: this.yo.y - 60 }, 0, 0, 5); }
    return ok;
  }
  pararse() {
    const m = this.yo;
    if (!m.mueble) return;
    const r = this.objs.get(m.mueble.split(":")[0]);
    this._caminar(m, m.gx + (r ? 0 : 0), lim((r?.o.y ?? m.y) + 26, FONDO, FRENTE));
    this._mandarYo({ accion: "", mueble: "" });
  }
  irJunto(o) {
    const r = this.objs.get(o.id);
    if (!r) return Promise.resolve(false);
    const j = r.d.junto || { dx: 0, dy: 24 }, sx = r.o.f ? -1 : 1;
    const gx = r.gx + j.dx * sx, y = lim(r.o.y + j.dy, FONDO, FRENTE), m = this.yo, orden = ++m.orden;
    return new Promise((ok) => {
      this._caminar(m, gx, y, () => { if (m.orden !== orden || !this.vivo) return ok(false); this._mirar(m, j.dx ? -j.dx * sx : m.mira); ok(true); });
      this._mandarYo({ accion: "", mueble: "" });
    });
  }
  /** Entrar a un cuarto caminando (la puerta del jardín lleva a la sala). */
  entrarA(k) {
    const gx = global(k, 90);
    this.yo.orden++;
    this._caminar(this.yo, gx, SUELO);
    this._mandarYo({ accion: "", mueble: "" });
    this.irCuarto(k);
  }
  /** Algo a la mano de tu monito (vuela desde donde salió). */
  dar(cosa, desde = null) {
    if (!COSAS_MANO[cosa]) return;
    const m = this.yo;
    if (desde) this._volar(cosa, desde.gx ?? m.gx, (desde.y ?? m.y) - (desde.def?.h || 80) * 0.6, m.gx + 22 * m.mira, m.y - 60);
    setTimeout(() => { if (!this.vivo) return; this._ponerLleva(m, cosa); this.sonar("pop"); this._mandarYo({ lleva: cosa }); }, desde ? 520 : 0);
  }
  _volar(cosa, gx0, y0, gx1, y1) {
    if (reducido()) return;
    const a = this.enPantalla(gx0, y0), b = this.enPantalla(gx1, y1), R = this.raiz.getBoundingClientRect();
    const s = el("i.ca-vuela", { html: COSAS_MANO[cosa].arte, style: { left: a.x - R.left - 18 + "px", top: a.y - R.top - 18 + "px" } });
    this.raiz.append(s);
    s.animate([{ transform: "translate(0,0) scale(.6)" }, { transform: `translate(${(b.x - a.x) / 2}px, ${(b.y - a.y) / 2 - 60}px) scale(1.15)`, offset: 0.5 }, { transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(.9)` }], { duration: 520, easing: "cubic-bezier(.3,.7,.4,1)" }).onfinish = () => s.remove();
  }
  /** (Fase 58) Lo que carga va dentro de su mano (en el brazo del dibujo), así se mueve con él. */
  _ponerLleva(m, cosa) {
    m.lleva = COSAS_MANO[cosa] ? cosa : "";
    m.llevaN.hidden = true;
    const mano = m.cuerpo.querySelector(".ca-mano-cosa");
    if (mano) {
      mano.replaceChildren();
      if (m.lleva) {
        const t = document.createElement("template"); t.innerHTML = COSAS_MANO[cosa].arte;
        const sv = t.content.querySelector("svg");
        if (sv) { for (const [k, v] of [["x", 59], ["y", 88], ["width", 27], ["height", 27]]) sv.setAttribute(k, v); mano.append(sv); }
      }
    } else { m.llevaN.hidden = !m.lleva; m.llevaN.innerHTML = m.lleva ? COSAS_MANO[cosa].arte : ""; }
    m.n.classList.toggle("con-cosa", !!m.lleva);
  }
  decir(t, mandar = true) {
    this._globo(this.yo, t);
    if (mandar) { this._mandarYo({ dice: String(t).slice(0, 60) }); this.sonar("pop"); }
  }
  /** Un globito arriba del monito (como en Roblox: hasta 3 seguidos; al llegar otro, se va el más viejo). */
  _globo(m, t, ms = 4200) {
    const b = el("div.ca-globito", { text: String(t) });
    m.globos.append(b);
    while (m.globos.children.length > 3) m.globos.firstElementChild.remove();
    setTimeout(() => { b.classList.add("se-va"); setTimeout(() => b.remove(), 320); }, ms);
  }
  vestidor() { P.vestidor(this); }
  vestir(r) { this._vestirMono(this.yo, r); if (this._visible(this.yo)) this.particulas("chispa", { gx: this.yo.gx, y: this.yo.y - 80 }, 0, 0, 3); clearTimeout(this._tRopa); this._tRopa = setTimeout(() => this._mandarYo({ ropa: { ...this.yo.ropa } }), 500); }
  /** Un gesto (saludar, bailar, brincar, besito, aplaudir, reír). */
  gesto(m, k, mandar = true) {
    const g = GESTOS.find((x) => x[0] === k);
    if (!g) return;
    if (m.accion && !["saluda", "besito", "rie", "volado", "corazon", "guino", "sorpresa", "piensa", "triste", "enojado"].includes(k)) { if (m === this.yo) this.pararse(); else this._pose(m, ""); }
    clearTimeout(m.tgesto);
    m.n.classList.remove(...GESTOS.map((x) => "g-" + x[0]));
    void m.n.offsetWidth;
    m.n.classList.add("g-" + k);
    m.tgesto = setTimeout(() => m.n.classList.remove("g-" + k), g[3]);
    if (m === this.yo || this._visible(m)) this.sonar(g[2], { volumen: m === this.yo ? 1 : 0.6 });
    const sobre = { gx: m.gx, y: m.y - 130 };
    if (k === "besito") this.particulas("corazon", sobre, 10 * m.mira, 30, 5);
    if (k === "volado") setTimeout(() => this.vivo && this.particulas("corazon", sobre, 50 * m.mira, 20, 6), 500);
    if (k === "corazon") this.particulas("corazon", sobre, 0, -10, 7);
    if (k === "triste") this.particulas("agua", { gx: m.gx, y: m.y - 100 }, 0, 0, 3);
    if (k === "enojado") this.particulas("vapor", sobre, 0, 10, 3);
    if (k === "piensa") this._globo(m, "…", 2000);
    if (k === "baila") this.particulas("nota", sobre, 0, 0, 4);
    if (k === "aplaude") this.particulas("chispa", sobre, 0, 40, 5);
    if (mandar) this._mandarYo({ ev: { k: "gesto", t: k } });
  }
  emote(k) { this.gesto(this.yo, k); }
  comer() {
    const m = this.yo, c = COSAS_MANO[m.lleva];
    if (!c?.comible) return;
    this.necesidades?.comio(m.lleva, !!c.plato);
    clearTimeout(m.tgesto);
    m.n.classList.add("g-come");
    this.sonar("comer");
    this.particulas("migaja", { gx: m.gx + 18 * m.mira, y: m.y - 92 }, 0, 0, 4);
    m.tgesto = setTimeout(() => { m.n.classList.remove("g-come"); this._ponerLleva(m, ""); this._mandarYo({ lleva: "" }); this._globo(m, "¡Qué rico!", 1800); }, 1600);
    this._mandarYo({ ev: { k: "come", t: m.lleva } });
  }
  /** Soltar lo que traes: se queda tirado en el piso (cae con su rebotito) y se recoge al tocarlo. */
  soltar(alBote = false) {
    const m = this.yo, k = m.lleva;
    if (!k) return;
    this._ponerLleva(m, ""); this._mandarYo({ lleva: "" });
    if (alBote || this.objs.size >= MAX_OBJETOS) return;
    this.sonar("soltar");
    const gx = lim(m.gx + 28 * m.mira, 24, ANCHO - 24), { c, x } = enCuarto(gx);
    const o = { id: nuevoId(), t: "cosita", c, x: Math.round(x), y: Math.round(lim(m.y + 8, FONDO, FRENTE)), f: false, e: { k } };
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    const r = this.objs.get(o.id);
    if (r) this._caer(r, 70);
  }
  /** Recoger algo del piso (si traías otra cosa, la deja ahí). */
  async recoger(o) {
    const r = this.objs.get(o.id), k = r?.o.e?.k;
    if (!r || !COSAS_MANO[k]) return;
    if (!(await this.irJunto({ id: o.id }))) return;
    if (!this.objs.has(o.id)) return;
    if (this.yo.lleva) this.soltar();
    this.sync.op({ o: "quita", id: o.id });
    this._pintarCasa(this.sync.casa());
    this._ponerLleva(this.yo, k); this.sonar("levantar"); this._mandarYo({ lleva: k });
  }
  /** Brincar en el trampolín un ratito (rebota y suena). */
  trampolin(o, n) {
    const m = this.yo, y0 = m.y, orden = ++m.orden;
    m.n.style.transitionDuration = ".25s"; m.n.style.top = o.y - 20 + "px"; m.n.style.zIndex = zMono(o.y + 40);
    m.n.classList.add("g-trampolin");
    this._mandarYo({ ev: { k: "gesto", t: "brinca" } });
    let i = 0;
    const t = setInterval(() => { if (!this.vivo || m.orden !== orden || i++ > 5) { clearInterval(t); m.n.classList.remove("g-trampolin"); if (this.vivo && m.orden === orden) { m.n.style.top = y0 + "px"; m.n.style.zIndex = zMono(y0); } return; } this.sonar("trampolin"); rebote(n, "salta"); }, 560);
  }
  /** Cocinar algo (mesa.js): desde «¿Qué cocinamos?», el micro o la licuadora. */
  cocinar(o, k) { return cocinar(this, o, k); }
  /** Una tecla del piano: su nota, notitas que salen y tu monito tocando (tu amorcito lo ve). */
  tocarNota(o, midi) {
    const m = this.yo;
    this.sonar("piano", { nota: midi });
    this.mientras(o, "suena", 800);
    this.particulas("nota", { gx: o.gx + (Math.random() * 60 - 30), y: o.y - (o.def?.h || 140) - 10 }, 0, 0, 1);
    clearTimeout(m.ttoca);
    m.n.classList.add("tocando");
    m.ttoca = setTimeout(() => m.n.classList.remove("tocando"), 700);
    // Las notas viajan en grupitos para que tu amorcito las oiga si está cerca.
    (this._notas ||= []).push(midi);
    if (!this._tNotas) this._tNotas = setInterval(() => {
      const ns = (this._notas || []).splice(0, 8);
      if (!ns.length) { clearInterval(this._tNotas); this._tNotas = null; return; }
      this._mandarYo({ ev: { k: "notas", t: ns.join(".") } });
    }, 380);
  }

  /** Lo que hacen juntos: tu monito va con el de tu amorcito y lo hacen los dos. */
  juntos(k) {
    this.necesidades?.sumar("diversion", 6);
    const yo = this.yo, el2 = this.suyo;
    if (k === "regalo") {
      if (!yo.lleva) return;
      const cosa = yo.lleva;
      this._volar(cosa, yo.gx + 20 * yo.mira, yo.y - 60, el2.gx, el2.y - 60);
      this._ponerLleva(yo, "");
      this.sonar("regalo");
      setTimeout(() => this.particulas("corazon", { gx: el2.gx, y: el2.y - 130 }, 0, 0, 5), 500);
      this._mandarYo({ lleva: "", ev: { k: "regalo", t: cosa } });
      return;
    }
    if (k === "bailemos") { this.gesto(yo, "baila", false); this.gesto(el2, "baila", false); this._mandarYo({ ev: { k: "bailemos" } }); return; }
    // Abrazo, besito, chócalas, de la mano, cosquillas, selfie o empujar el columpio: primero se acerca.
    const lado = yo.gx < el2.gx ? -1 : 1, enPiso = !el2.mueble;
    const gx = el2.gx + lado * ({ choca: 58, manita: 52, selfie: 50, empujar: 62 }[k] || 44), y = enPiso ? el2.y : lim(el2.y + 30, FONDO, FRENTE);
    if (yo.mueble) this._pose(yo, "");
    const orden = ++yo.orden;
    this._caminar(yo, gx, y, () => {
      if (yo.orden !== orden || !this.vivo) return;
      this._mirar(yo, -lado);
      this._juntosHacer(k, yo, el2);
    });
    this._mandarYo({ accion: "", mueble: "", ...enCuartoXY(gx, y), mira: -lado, ev: { k, t: "" } });
  }
  /** `a` hace la cosa con `b` (en los dos teléfonos se ve igual). */
  _juntosHacer(k, a, b) {
    this.ultimoJuntos = k;
    const poner = (m, clases, ms = 2300) => { clearTimeout(m.tgesto); m.n.classList.add(...clases); m.tgesto = setTimeout(() => m.n.classList.remove(...clases), ms); };
    // Empujar el columpio: quien empuja estira los brazos y quien va sentado vuela alto un ratito.
    if (k === "empujar") {
      poner(a, ["g-empuja"], 1200);
      b.n.classList.add("empujado"); clearTimeout(b.tEmpuje);
      const arbol = this.objs.get(String(b.mueble).split(":")[0]);
      arbol?.n.classList.add("empujado");
      b.tEmpuje = setTimeout(() => { b.n.classList.remove("empujado"); arbol?.n.classList.remove("empujado"); }, 4600);
      this.sonar("columpio"); setTimeout(() => this.vivo && this.sonar("columpio", { volumen: 0.6 }), 1300);
      this._globo(b, "¡Wiii!", 1800);
      vibrar(10);
      return;
    }
    const clase = { abrazo: ["g-abrazo", "enamorado"], beso: ["g-besito", "enamorado"], choca: ["g-choca"], manita: ["g-manita", "enamorado"], selfie: ["g-saluda", "g-selfie"] }[k];
    for (const m of [a, b]) {
      if (m.accion && m.accion !== "sentado") continue;
      if (k === "cosquillas") poner(m, m === a ? ["g-cosquillas"] : ["g-rie"], 2000);
      else if (clase) poner(m, clase, k === "manita" ? 3600 : 2300);
    }
    if (!b.mueble) this._mirar(b, a.gx < b.gx ? -1 : 1);
    const medio = { gx: (a.gx + b.gx) / 2, y: Math.min(a.y, b.y) - 120 };
    if (k === "abrazo") { this.sonar("abrazo"); this.particulas("corazon", medio, 0, 0, 7); vibrar(14); }
    if (k === "beso") { this.sonar("beso"); this.particulas("corazon", medio, 0, 10, 9); vibrar(12); }
    if (k === "choca") { this.sonar("aplauso", { volumen: 0.8 }); this.particulas("chispa", medio, 0, 0, 7); vibrar(10); }
    if (k === "manita") { this.sonar("beso", { volumen: 0.6 }); this.particulas("corazon", medio, 0, 30, 4); }
    if (k === "cosquillas") { this.sonar("risa"); this.particulas("chispa", { gx: b.gx, y: b.y - 90 }, 0, 0, 5); }
    if (k === "selfie") { this.sonar("clic"); this.raiz.classList.remove("flash"); void this.raiz.offsetWidth; this.raiz.classList.add("flash"); this.particulas("estrella", medio, 0, 0, 5); if (a === this.yo) aviso("¡Qué bonita foto de los dos!", 2200); }
  }

  /** (Fase 58) Brincar en un charquito: camina, brinca, salpica (con su sonido) y tu amorcito lo ve. */
  brincarCharco(ch, m = this.yo, mandar = true) {
    const orden = ++m.orden;
    const brinca = () => {
      if (m.orden !== orden || !this.vivo) return;
      this.gesto(m, "brinca", false);
      setTimeout(() => {
        if (!this.vivo) return;
        this.lluviaF?.chapoteo(ch.gx, ch.y);
        this.particulas("agua", { gx: ch.gx, y: ch.y }, 0, -6, 6);
        if (m === this.yo || this._visible(m)) this.sonar("charco", { volumen: m === this.yo ? 1 : 0.6 });
        if (m === this.yo) { vibrar(18); this.necesidades?.sumar("diversion", 6); }
      }, 260);
    };
    this._caminar(m, ch.gx, ch.y, brinca);
    if (mandar) this._mandarYo({ accion: "", mueble: "", ev: { k: "charco", t: `${Math.round(ch.gx)},${Math.round(ch.y)}` } });
  }

  /** (Fase 57) Si tu amorcito te manda un mensajito rápido mientras están en la casita, su monito te lo dice. */
  _alToque({ tipo, texto }) {
    if (!this.vivo) return;
    const m = this.suyo;
    this.gesto(m, { besitos: "volado", teamo: "corazon", cuidate: "saluda" }[tipo] || "saluda", false);
    this._globo(m, texto || { besitos: "¡Muak, muak!", teamo: "¡Te amo!", cuidate: "¡Cuídate mucho!" }[tipo] || "", 5200);
    if (this._visible(m)) this.particulas("corazon", { gx: m.gx, y: m.y - 120 }, 0, 0, 6);
  }

  /** Partículas (corazones, burbujas, chispas, notas, vapor, agua, hojas, polvo, migajas…). */
  particulas(tipo, ref, dx = 0, dy = 0, n = 4) {
    if (!this.vivo) return;
    // (Cuántas, según el perfil de gráficos: de 1 en Máximo rendimiento a más en Ultra.)
    n = reducido() ? Math.min(n, 1) : Math.min(this.gfx === "ultra" ? Math.ceil(n * 1.4) : n, maxParticulas(this.gfx));
    const gx = (ref.gx ?? 0) + dx, y = (ref.y ?? ref.o?.y ?? SUELO) + dy;
    for (let i = 0; i < n; i++) {
      const p = el("i.ca-part." + tipo, { style: { left: gx + (Math.random() * 44 - 22) + "px", top: y + (Math.random() * 16 - 8) + "px", animationDelay: (i * 0.09).toFixed(2) + "s", "--dx": (Math.random() * 60 - 30).toFixed(0) + "px", "--rot": (Math.random() * 60 - 30).toFixed(0) + "deg" } });
      this.mundo.append(p);
      setTimeout(() => p.remove(), 1700 + i * 90);
    }
  }

  /* ═════════════ Tocar, cargar y acomodar ═════════════ */
  _enlazar() {
    let g = null;
    const m = this.mundo;
    m.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      this.cerrarMenu();
      const t = e.target, mono = t.closest(".ca-monito"), on = t.closest(".ca-obj");
      const p = this._xy(e);
      g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), mov: 0, blanco: t, mono: mono === this.yo.n ? this.yo : mono === this.suyo.n ? this.suyo : null, obj: on ? this.objs.get(on.dataset.id) : null, p0: p };
      // Al acomodar todo se agarra; jugando, tu monito y las cosas portátiles (mascotas, osito, cojín…).
      g.jugando = !this.editando && !g.mono && !!g.obj?.d.portatil;
      if (this.editando || g.jugando) {
        if (g.obj) { g.off = { dx: g.obj.gx - p.x, dy: g.obj.o.y - p.y }; try { m.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
      } else if (g.mono === this.yo) { try { m.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
    });
    m.addEventListener("pointermove", (e) => {
      if (!g || e.pointerId !== g.id) return;
      g.mov = Math.max(g.mov, Math.hypot(e.clientX - g.x0, e.clientY - g.y0));
      if (g.mov < 7) return;
      g.ultimo = e;
      if ((this.editando || g.jugando) && g.obj) { this._arrastrarObj(g, e); e.preventDefault(); }
      else if (!this.editando && g.mono === this.yo) { this._cargar(g, e); e.preventDefault(); }
    });
    const fin = (e, cancelado = false) => {
      if (!g || e.pointerId !== g.id) return;
      const G = g; g = null;
      cancelAnimationFrame(this._rqAuto);
      if (G.arrastra) { this._soltarObj(G, e); return; }
      if (G.cargando) { this._soltarMono(G, e); return; }
      if (cancelado || G.mov > 10 || performance.now() - G.t0 > 700) return;
      if (this.editando) { this._seleccionar(G.obj || null); return; }
      if (G.mono === this.yo) return this._menuYo();
      if (G.mono === this.suyo) return this._menuSuyo();
      if (G.obj) return this._tocarObj(G.obj);
      // El piso (o la pared): camina hasta ahí. (Lloviendo, si tocas un charco, ¡brincas en él!)
      const p = this._xy(e);
      const ch = this.climaActual() !== "sol" ? charcoEn(p.x, p.y) : null;
      if (ch) { this.brincarCharco(ch); return; }
      this._caminar(this.yo, p.x, p.y >= PISO - 10 ? p.y : this.yo.mueble ? SUELO : this.yo.y);
      this.yo.orden++;
      this._mandarYo({ accion: "", mueble: "" });
    };
    m.addEventListener("pointerup", (e) => fin(e));
    m.addEventListener("pointercancel", (e) => fin(e, true));
    m.addEventListener("contextmenu", (e) => e.preventDefault());
    // Con el teclado (Enter sobre una cosa), lo mismo que tocarla.
    m.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest?.(".ca-obj")) { e.preventDefault(); const r = this.objs.get(e.target.closest(".ca-obj").dataset.id); if (r) this._tocarObj(r); } });
  }
  _tocarObj(r) {
    const d = r.d, o = { ...r.o, def: d, gx: r.gx };
    if (["trampolin", "consola", "arcade", "guitarra", "pintar", "telescopio", "bici", "musica", "boing"].includes(d.al)) this.necesidades?.sumar("diversion", 5);
    if (d.al && ACCIONES[d.al]) { ACCIONES[d.al](this, o, r.n); return; }
    if (d.lugares) { this.usarLugar(o); return; }
    rebote(r.n); this.sonar("pop", { volumen: 0.6 });
  }
  _menuYo() {
    const m = this.yo, ops = GESTOS.map(([k, t]) => [k, t, () => this.gesto(m, k)]);
    ops.unshift(["decir", "Decir algo", () => this.mensajes.barra(true)]);   // (lo más fácil: tocarte y escribir; lo del momento va antes)
    if (m.accion === "columpio") ops.unshift(["empujar", "Pedir que me empuje", () => { this._globo(m, `${this.pareja}, ¡empújame!`, 3800); this._mandarYo({ dice: "¡Empújame!" }); }]);
    const c = COSAS_MANO[m.lleva];
    if (c?.comible) ops.unshift(["comer", `Comer ${c.n.toLowerCase()}`, () => this.comer()]);
    if (m.lleva) ops.push(["soltar", "Soltar", () => this.soltar()]);
    if (m.mueble) ops.unshift(["brinca", "Pararme", () => this.pararse()]);
    P.menuMonito(this, m, ops, "Tú");
  }
  _menuSuyo() {
    const ops = JUNTOS.map(([k, t]) => [k, t, () => this.juntos(k)]);
    ops.unshift(this.traes.activo ? ["traes", "Terminar las traes", () => this.traes.terminar(true)] : ["traes", "Jugar a las traes", () => this.traes.empezar()]);
    if (this.yo.lleva) ops.unshift(["regalo", `Regalarle ${COSAS_MANO[this.yo.lleva].n.toLowerCase()}`, () => this.juntos("regalo")]);
    if (this.suyo.accion === "columpio") ops.unshift(["empujar", "Empujar el columpio", () => this.juntos("empujar")]);
    P.menuMonito(this, this.suyo, ops, `Con ${this.pareja}`);
  }
  cerrarMenu() { const n = this.menu; if (!n) return false; this.menu = null; n.classList.remove("ver"); setTimeout(() => n.remove(), 180); return true; }
  cerrarHoja() { const h = this.panel; if (!h) return false; this.panel = null; h.classList.remove("ver"); h.style.transform = ""; setTimeout(() => h.remove(), 260); this.sonar("cerrar", { volumen: 0.5 }); return true; }

  // ── Cargar a tu monito con el dedo ──
  _cargar(g, e) {
    const m = this.yo, p = this._xy(e);
    if (!g.cargando) { g.cargando = true; m.orden++; clearTimeout(m.tc); clearInterval(m.tp); this._pose(m, ""); m.n.classList.remove("camina"); m.n.classList.add("cargado"); m.n.style.transitionDuration = "0s"; vibrar(10); this.sonar("levantar"); }
    m.gx = lim(p.x, 24, ANCHO - 24); m.y = Math.min(FRENTE, p.y + 74);
    m.n.style.left = m.gx + "px"; m.n.style.top = m.y + "px";
    this._autoDeslizar(e);
  }
  _soltarMono(g, e) {
    const m = this.yo, p = this._xy(e);
    m.n.classList.remove("cargado");
    // ¿Lo soltaste encima de algo para sentarse o acostarse? Lo usa.
    for (const r of [...this.objs.values()].reverse()) {
      if (!r.d.lugares || r.d.al === "estufa" || r.d.al === "parrilla") continue;
      const x0 = r.gx - r.d.w / 2, y0 = r.o.y - r.d.h;
      if (p.x >= x0 && p.x <= x0 + r.d.w && p.y + 40 >= y0 && p.y + 40 <= r.o.y + 20) { this.usarLugar({ id: r.o.id }); return; }
    }
    m.y = lim(m.y, FONDO, FRENTE);
    m.n.style.transitionDuration = ".34s"; m.n.style.top = m.y + "px"; m.n.style.zIndex = zMono(m.y); this._prof(m);
    m.n.classList.add("aterriza"); setTimeout(() => m.n.classList.remove("aterriza"), 480);
    this.sonar("boing"); this.particulas("polvo", { gx: m.gx, y: m.y }, 0, 0, 3);
    this._mandarYo({ accion: "", mueble: "" });
  }
  /** Si arrastras cerca de la orilla, la casita se desliza sola hacia ese lado. */
  _autoDeslizar(e) {
    cancelAnimationFrame(this._rqAuto);
    const v = this.vistaN, R = v.getBoundingClientRect(), borde = Math.min(60, R.width * 0.12);
    const dir = e.clientX < R.left + borde ? -1 : e.clientX > R.right - borde ? 1 : 0;
    if (!dir) return;
    const paso = () => { v.scrollLeft += dir * 9; this._rqAuto = requestAnimationFrame(paso); };
    this._rqAuto = requestAnimationFrame(paso);
  }

  /* ═════════════ Acomodar (editar la casa) ═════════════ */
  _editar(on) {
    if (on === this.editando) return;
    this.editando = on;
    this.cerrarMenu(); this.cerrarHoja();
    this.raiz.classList.toggle("editando", on);
    if (!on) { this._seleccionar(null); this.sonar("ding"); }
    else { this.sonar("abrir"); vibrar(8); this.cajonN.ponerCat(this.cuartoActual); }
    this.deshacerB.disabled = !this.pila.length;
    this._musicas();
    // La casita se aleja un poquito (o regresa) sin perder lo que estabas viendo.
    const centro = (this.vistaN.scrollLeft + this.vistaN.clientWidth / 2) / this.k;
    if (!reducido()) { this.mundo.classList.add("ajusta"); clearTimeout(this._tAj); this._tAj = setTimeout(() => this.mundo.classList.remove("ajusta"), 420); }
    this._medir();
    this.vistaN.scrollLeft = Math.max(0, centro * this.k - this.vistaN.clientWidth / 2);
  }
  /** Lo último que pusiste (para la pestaña «Recientes» del cajón). */
  recientes() { try { const v = JSON.parse(localStorage.getItem(RECIENTES) || "[]"); return Array.isArray(v) ? v.filter((k) => CATALOGO[k]).slice(0, 12) : []; } catch (e) { return []; } }
  _recordar(t) { try { localStorage.setItem(RECIENTES, JSON.stringify([t, ...this.recientes().filter((k) => k !== t)].slice(0, 12))); } catch (e) { /* nada */ } }
  /** Arrastrar una cosa del cajón: aparece bajo tu dedo y la sueltas donde la quieras (o en la basura). */
  arrastrarNuevo(t, ev) {
    const d = CATALOGO[t];
    if (!d || !this.editando) return;
    if (this.objs.size >= MAX_OBJETOS) { aviso("Ya hay muchísimas cosas: quita alguna para poner otra", 2800); this.sonar("nop"); return; }
    const p = this._xy(ev), gx = lim(p.x, d.w * 0.3, ANCHO - d.w * 0.3), { c, x } = enCuarto(gx);
    const y = d.capa === "pared" ? d.y : lim(p.y + d.h / 2, FONDO, FRENTE);
    const o = { id: nuevoId(), t, c, x: Math.round(lim(x, d.w / 2 + 4, cuarto(c).w - d.w / 2 - 4)), y: Math.round(y), f: false, e: {} };
    const base = this.pila.length;
    this.pila.push([{ o: "quita", id: o.id }]);
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    const r = this.objs.get(o.id);
    if (!r) return;
    this._recordar(t);
    this._seleccionar(null);
    const g = { id: ev.pointerId, obj: r, off: { dx: 0, dy: d.h / 2 }, mov: 99 };
    this._arrastrarObj(g, ev);
    const mover = (e) => { if (e.pointerId === g.id) { e.preventDefault(); this._arrastrarObj(g, e); } };
    const soltar = (e) => {
      if (e.pointerId !== g.id) return;
      removeEventListener("pointermove", mover); removeEventListener("pointerup", soltar); removeEventListener("pointercancel", soltar);
      cancelAnimationFrame(this._rqAuto);
      if (!this.objs.has(o.id)) return;
      this._soltarObj(g, e);
      // «Deshacer» la quita de una vez (y si fue a dar a la basura, ni cuenta).
      this.pila.length = Math.min(this.pila.length, base + (g.basura ? 0 : 1));
      this.deshacerB.disabled = !this.pila.length;
    };
    addEventListener("pointermove", mover, { passive: false }); addEventListener("pointerup", soltar); addEventListener("pointercancel", soltar);
    this.deshacerB.disabled = false;
  }
  agregar(t) {
    const d = CATALOGO[t];
    if (!d) return;
    this._recordar(t);
    if (this.objs.size >= MAX_OBJETOS) { aviso("Ya hay muchísimas cosas: quita alguna para poner otra", 2800); this.sonar("nop"); return; }
    const centro = (this.vistaN.scrollLeft + this.vistaN.clientWidth / 2) / this.k;
    const { c } = enCuarto(centro), w = cuarto(c).w;
    const x = lim(centro - inicioDe(c) + (Math.random() * 60 - 30), d.w / 2 + 4, w - d.w / 2 - 4);
    // (Lo nuevo cae hasta adelante, para que se vea y se pueda agarrar luego luego.)
    const y = d.capa === "piso" ? lim(FRENTE - 6 - Math.random() * 10, FONDO, FRENTE) : d.y;
    const o = { id: nuevoId(), t, c, x: Math.round(x), y: Math.round(y), f: false, e: {} };
    this.pila.push([{ o: "quita", id: o.id }]);
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    const r = this.objs.get(o.id);
    if (r && !reducido()) { r.n.classList.remove("aparece"); r.n.classList.add("cae"); setTimeout(() => { r.n.classList.remove("cae"); this.particulas("polvo", { gx: r.gx, y: r.o.y }, 0, 0, 3); this.sonar("boing", { volumen: 0.7 }); }, 430); }
    this.sonar("pop"); vibrar(8);
    this._seleccionar(r);
    this.deshacerB.disabled = false;
  }
  _seleccionar(r) {
    if (this.sel?.n) this.sel.n.classList.remove("sel");
    this.sel = r || null;
    if (r) { r.n.classList.add("sel"); rebote(r.n, "toque"); this.selColorB.hidden = !r.d.colores; this._pintarColores(); this.sonar("pop", { volumen: 0.5 }); }
    this.selN.hidden = !r;
    this._ubicarSel();
  }
  _ubicarSel() {
    const r = this.sel;
    if (!r || this.selN.hidden) return;
    const p = this.enPantalla(r.gx, r.o.y - r.d.h), R = this.raiz.getBoundingClientRect(), w = this.selN.offsetWidth || 150;
    this.selN.style.left = lim(p.x - R.left - w / 2, 8, R.width - w - 8) + "px";
    this.selN.style.top = lim(p.y - R.top - 52, 64, R.height - 120) + "px";
  }
  _guardarObj(r, cambios, sonido = "pop") {
    const antes = JSON.parse(JSON.stringify(r.o));
    const o = { ...antes, ...cambios };
    this.pila.push([{ o: "pon", obj: antes }]);
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    if (sonido) this.sonar(sonido);
    this.deshacerB.disabled = false;
  }
  _voltear() { const r = this.sel; if (!r) return; this._guardarObj(r, { f: !r.o.f }, "whoosh"); rebote(r.n, "gira"); }
  _otroColor() { const r = this.sel; if (!r?.d.colores) return; this._ponerColor(((r.o.e?.col | 0) + 1) % r.d.colores.length); }
  /** Los colorcitos de la cosa elegida, para escoger uno de un toque. */
  _pintarColores() {
    const r = this.sel, cols = r?.d.colores || [], act = Math.abs(r?.o.e?.col | 0) % (cols.length || 1);
    this.selColoresN.hidden = !cols.length;
    this.selColoresN.replaceChildren(...cols.map((c, i) => el("button.ca-sel-col" + (i === act ? ".on" : ""), { type: "button", role: "radio", "aria-checked": String(i === act), "aria-label": `Color ${i + 1}`, style: { "--c": c }, onClick: () => this._ponerColor(i) })));
  }
  _ponerColor(i) {
    const r = this.sel;
    if (!r?.d.colores || (r.o.e?.col | 0) === i) return;
    this._guardarObj(r, { e: { ...(r.o.e || {}), col: i } }, "pop");
    // (Al repintar, la cosa es otro nodo: se vuelve a elegir para que la barrita siga ahí.)
    const n = this.objs.get(r.o.id);
    if (n) { this.sel = null; this._seleccionar(n); rebote(n.n, "toque"); this.particulas("brillo", { gx: n.gx, y: n.o.y - n.d.h / 2 }, 0, 0, 3); }
  }
  /** Otra igualita, junto a la elegida (con su color y volteada igual). */
  _duplicar() {
    const r = this.sel;
    if (!r) return;
    if (this.objs.size >= MAX_OBJETOS) { aviso("Ya hay muchísimas cosas: quita alguna para poner otra", 2800); this.sonar("nop"); return; }
    const w = cuarto(r.o.c).w, d = r.d;
    let x = r.o.x + d.w * 0.6 + 10;
    if (x > w - d.w / 2 - 4) x = r.o.x - d.w * 0.6 - 10;
    const o = { ...JSON.parse(JSON.stringify(r.o)), id: nuevoId(), x: Math.round(lim(x, d.w / 2 + 4, w - d.w / 2 - 4)), y: d.capa === "pared" ? r.o.y : Math.round(lim(r.o.y + 8, FONDO, FRENTE)) };
    this.pila.push([{ o: "quita", id: o.id }]);
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    const n = this.objs.get(o.id);
    if (n && !reducido()) { n.n.classList.remove("aparece"); n.n.classList.add("cae"); setTimeout(() => n.n.classList.remove("cae"), 430); }
    this.sonar("pop"); vibrar(8);
    this._seleccionar(n);
    this.deshacerB.disabled = false;
  }
  _borrar(r) {
    this.pila.push([{ o: "pon", obj: JSON.parse(JSON.stringify(r.o)) }]);
    this._seleccionar(null);
    this.sonar("poof"); vibrar(14);
    this.particulas("polvo", { gx: r.gx, y: r.o.y - r.d.h / 2 }, 0, 0, 6);
    this.sync.op({ o: "quita", id: r.o.id });
    this._pintarCasa(this.sync.casa());
    this.deshacerB.disabled = false;
  }
  /** Vaciar este cuarto (o toda la casa, aunque quede vacía de verdad): se puede deshacer con «Deshacer». */
  vaciar(todo = false) {
    const quitar = [...this.objs.values()].filter((r) => todo || r.o.c === this.cuartoActual);
    if (!quitar.length) { aviso(todo ? "La casita ya está vacía" : "Este cuarto ya está vacío", 2000); this.sonar("nop"); return; }
    this._seleccionar(null);
    const inv = quitar.map((r) => ({ o: "pon", obj: JSON.parse(JSON.stringify(r.o)) }));
    const ops = quitar.map((r) => ({ o: "quita", id: r.o.id }));
    if (todo) ops.push({ o: "cuarto", k: "jardin", v: { vacia: true } });
    this.pila.push(inv);
    this.sync.ops(ops);
    this._pintarCasa(this.sync.casa());
    this.sonar("poof"); vibrar(16);
    this.deshacerB.disabled = false;
    aviso(`${todo ? "La casita quedó vacía" : `${cuarto(this.cuartoActual).n}: vacío`}. Puedes deshacerlo.`, 2600);
  }
  _deshacer() {
    const inv = this.pila.pop();
    this.deshacerB.disabled = !this.pila.length;
    if (!inv) return;
    this._seleccionar(null);
    this.sync.ops(inv);
    this._pintarCasa(this.sync.casa());
    this.sonar("whoosh");
  }
  _arrastrarObj(g, e) {
    const r = g.obj, d = r.d, p = this._xy(e);
    if (!g.arrastra) {
      g.arrastra = true; this.arrastrandoId = r.o.id; this.raiz.classList.add("arrastrando");
      if (!g.jugando) { this._seleccionar(null); this.basuraN.classList.add("ver"); }
      r.n.classList.add("levantado"); r.fr?.classList.add("levantado");
      if (r.glow) r.glow.hidden = true;
      this.sonar("levantar"); vibrar(10);
      g.vx = 0;
    }
    let gx = lim(p.x + g.off.dx, d.w * 0.3, ANCHO - d.w * 0.3), y = p.y + g.off.dy;
    if (d.capa === "pared") y = lim(y, d.h + 8, PISO - 6);
    else if (d.capa === "alfombra") y = lim(y, FONDO + 24, H);
    else if (puedeSubir(d)) y = lim(y, 150, FRENTE + 4);
    else y = lim(y, FONDO, FRENTE + 4);
    g.vx = 0.7 * g.vx + 0.3 * (gx - (g.gx ?? gx));
    g.gx = gx; g.y = y;
    for (const n of [r.n, r.fr]) { if (!n) continue; n.style.left = gx - d.w / 2 + "px"; n.style.top = y - d.h + "px"; n.style.setProperty("--incl", lim(g.vx * 1.4, -9, 9).toFixed(1) + "deg"); }
    r.n.style.zIndex = 9000; if (r.fr) r.fr.style.zIndex = 9001;
    if (!g.jugando) {
      const B = this.basuraN.getBoundingClientRect();
      g.basura = e.clientX >= B.left - 10 && e.clientX <= B.right + 10 && e.clientY >= B.top - 14 && e.clientY <= B.bottom + 10;
      this.basuraN.classList.toggle("encima", g.basura);
      r.n.classList.toggle("a-la-basura", g.basura);
    }
    this._autoDeslizar(e);
  }
  _soltarObj(g) {
    const r = g.obj;
    this.arrastrandoId = null;
    this.raiz.classList.remove("arrastrando");
    this.basuraN.classList.remove("ver", "encima");
    for (const n of [r.n, r.fr]) { if (!n) continue; n.classList.remove("levantado", "a-la-basura"); n.style.removeProperty("--incl"); }
    if (r.glow) r.glow.hidden = false;
    if (g.basura) { this._colocar(r); this._borrar(r); return; }
    if (g.gx == null) { this._colocar(r); return; }
    // Física: si lo aventaste, se resbala un poquito; si quedó en el aire, cae al mueble de abajo o al piso.
    if (g.jugando) g.gx = lim(g.gx + lim(g.vx * 6, -90, 90), r.d.w * 0.3, ANCHO - r.d.w * 0.3);
    const soltadoEn = g.y;
    if (puedeSubir(r.d)) {
      const a = this._apoyo(g.gx, g.y, r.o.id);
      // En el aire: cae al mueble de abajo o al piso. En el piso, pero sobre el tablero de un mueble de más adelante: se queda encima.
      if (g.y < FONDO) g.y = a ? a.y : FONDO + 8;
      else if (a && a.r.o.y > g.y + 4 && a.y <= g.y + 30) g.y = a.y;
    }
    const { c, x } = enCuarto(g.gx);
    // Jugando (una mascota, el osito…): se queda donde lo soltaste, rebota y hace su ruidito.
    if (g.jugando) {
      this.sync.op({ o: "pon", obj: { ...JSON.parse(JSON.stringify(r.o)), c, x: Math.round(x), y: Math.round(g.y) } });
      this._pintarCasa(this.sync.casa());
      if (g.y - soltadoEn > 8) this._caer(r, g.y - soltadoEn);
      else if (!reducido()) { r.n.classList.add("aterriza"); setTimeout(() => r.n.classList.remove("aterriza"), 480); }
      this.particulas("polvo", { gx: g.gx, y: g.y }, 0, 0, 3);
      this.sonar({ miau: "miau", guau: "guau", chillido: "chillido", cuac: "cuac" }[r.d.al] || "boing", { volumen: 0.8 });
      return;
    }
    this._guardarObj(r, { c, x: Math.round(x), y: Math.round(g.y) }, "soltar");
    if (g.y - soltadoEn > 8) this._caer(r, g.y - soltadoEn);
    if (!reducido()) { r.n.classList.add("aterriza"); setTimeout(() => r.n.classList.remove("aterriza"), 480); }
    if (r.d.capa !== "pared") this.particulas("polvo", { gx: g.gx, y: g.y }, 0, 0, 3);
    this._seleccionar(r);
  }

  /* ═════════════ Pantalla completa y volver ═════════════ */
  _completa(on = !this.raiz.classList.contains("completa")) {
    this.raiz.classList.toggle("completa", on);
    document.body.classList.toggle("ca-en-completa", on);
    if (on) {
      const pedir = document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
      if (pedir?.then) pedir.then(() => { this._pedida = true; }).catch(() => {});
    } else if (document.fullscreenElement) { this._pedida = false; document.exitFullscreen?.().catch(() => {}); }
    this.completaB.querySelector("i").innerHTML = on ? ICO.salirCompleta : ICO.completa;
    this.completaB.querySelector("span").textContent = on ? "Salir" : "Completa";
    this.completaB.setAttribute("aria-label", on ? "Salir de pantalla completa" : "Pantalla completa");
    this.sonar(on ? "abrir" : "cerrar");
    requestAnimationFrame(() => requestAnimationFrame(() => { this._medir(); this._seguir(this.yo.gx); }));
  }
  _volver() {
    if (this._protegido()) return;
    if (this.editando) this._editar(false);
    if (this.raiz.classList.contains("completa")) this._completa(false);
    this.sonar("cerrar");
    this.volver?.();
  }
  _guardado(t, k) {
    this.guardadoN.textContent = k === "listo" ? "Todo guardado" : t;
    this.guardadoN.dataset.k = k;
  }

  /* ═════════════ En tiempo real ═════════════ */
  _recibir(r, primera) {
    if (r.voz?.length) this.voz.recibir(r.voz);
    // La casa: la primera vez (o si era la de antes), se arma la de entrada.
    if (!r.casa?.objetos?.length && !r.casa?.cuartos?.jardin?.vacia && !this._iniciada) { this._iniciada = true; this.sync.op({ o: "iniciar", casa: casaInicial(r.casa) }); }
    // Una casita de antes también estrena los cuartos nuevos (con su acomodo de entrada), una sola vez.
    else if (r.casa?.objetos?.length && !this._estrenados) {
      this._estrenados = true;
      const ops = CUARTOS_NUEVOS.filter((k) => !r.casa.cuartos?.[k]).flatMap(opsCuartoNuevo);
      // (Fase 55: el perrito necesita su casita para cuando llueve.)
      if (!r.casa.cuartos?.jardin?.v55) {
        if (!r.casa.objetos.some((o) => o.t === "casita_perro" && o.c === "jardin")) ops.push({ o: "pon", obj: { id: "ja8", t: "casita_perro", c: "jardin", x: 430, y: 470, f: false, e: {} } });
        ops.push({ o: "cuarto", k: "jardin", v: { v55: true } });
      }
      if (ops.length) this.sync.ops(ops);
    }
    this._pintarCasa(this.sync.casa());
    this.mensajes.recibir(r.msgs, primera);
    this.estadoN.textContent = r.pareja_aqui ? `${this.pareja} está aquí` : `${this.pareja} no está ahorita`;
    this.estadoN.classList.toggle("aqui", !!r.pareja_aqui);
    this.suyo.n.classList.toggle("ausente", !r.pareja_aqui);
    if (primera) {
      const y = r.yo;
      if (y?.ropa) this._vestirMono(this.yo, y.ropa);
      if (y?.c && CUARTOS.some((c) => c.k === y.c)) {
        if (y.mira) this._mirar(this.yo, y.mira);
        const [id, jx] = String(y.mueble || "").split(":");
        const ro = this.objs.get(id);
        if (ro?.d.lugares?.[+jx]) this._irLugar(this.yo, ro, +jx, true);
        else this._caminar(this.yo, global(y.c, y.x), y.y ?? SUELO, null, true);
        if (y.lleva) this._ponerLleva(this.yo, y.lleva);
        this.yo.evAt = y.ev?.at || 0;
      } else this._mandarYo({ ropa: this.yo.ropa });
      requestAnimationFrame(() => { this.vistaN.scrollLeft = Math.max(0, this.yo.gx * this.k - this.vistaN.clientWidth / 2); });
      setTimeout(() => this._regalito(), 1400);
    }
    const p = r.pareja, m = this.suyo;
    if (!p) return;
    const ropa = JSON.stringify(p.ropa || null);
    if (p.ropa && ropa !== m._ropaVista) { m._ropaVista = ropa; this._vestirMono(m, p.ropa); }
    if (p.t !== m.t && p.c && CUARTOS.some((c) => c.k === p.c)) {
      m.t = p.t;
      m.destino = String(p.mueble || "");
      const [id, jx] = String(p.mueble || "").split(":");
      const ro = this.objs.get(id);
      if (ro?.d.lugares?.[+jx]) { if (m.mueble !== p.mueble) this._irLugar(m, ro, +jx, primera); }
      else {
        const gx = global(p.c, p.x), y = p.y ?? SUELO;
        if (Math.abs(gx - m.gx) > 1 || Math.abs(y - m.y) > 1 || m.mueble) this._caminar(m, gx, y, () => { if (p.mira) this._mirar(m, p.mira); }, primera);
        else if (p.mira) this._mirar(m, p.mira);
      }
      if ((p.lleva || "") !== m.lleva) this._ponerLleva(m, p.lleva || "");
    }
    // Lo que acaba de hacer (sólo si es nuevo).
    if (p.ev?.at && p.ev.at !== m.evAt) { m.evAt = p.ev.at; if (!primera) this._evento(p.ev); }
    if (p.dt && p.dt !== m.dt) { if (!primera && p.dice) { this._globo(m, p.dice); if (this._visible(m)) this.sonar("pop", { volumen: 0.6 }); } m.dt = p.dt; }
  }
  _evento(ev) {
    const m = this.suyo, yo = this.yo, espera = Math.max(0, (m.llega || 0) - performance.now()) + 40;
    if (ev.k === "comemesa") laPareja(this, ev, espera);
    else if (ev.k === "sirve" && RECETAS[ev.t]) { aviso(`${this.pareja} sirvió ${RECETAS[ev.t].n.toLowerCase()} en la mesa`, 2800); this.sonar("mesa", { volumen: 0.7 }); }
    else if (ev.k === "cocina" && RECETAS[ev.t]) { if (this._visible(m)) this._globo(m, `Cocinando ${RECETAS[ev.t].n.toLowerCase()}…`, 2600); }
    else if (ev.k === "notas") this._notasDeElla(ev.t, espera);
    else if (ev.k === "toca") setTimeout(() => {
      m.n.classList.add("tocando"); setTimeout(() => m.n.classList.remove("tocando"), 2400);
      this.particulas("nota", { gx: m.gx, y: m.y - 140 }, 0, 0, 3);
      if (this._visible(m)) this.sonar(ev.t === "guitarra" ? "guitarra" : "piano", { volumen: 0.5 });
    }, espera);
    else if (ev.k === "gesto") setTimeout(() => this.gesto(m, ev.t, false), espera);
    else if (ev.k === "traes") this.traes.evento(ev.t);
    else if (ev.k === "charco") { const [gx, y] = String(ev.t).split(",").map(Number); if (Number.isFinite(gx) && Number.isFinite(y)) setTimeout(() => { this.lluviaF?.chapoteo(gx, y); this.particulas("agua", { gx, y }, 0, -6, 4); if (this._visible(m)) this.sonar("charco", { volumen: 0.6 }); }, espera + 260); }
    else if (ev.k === "come") { m.n.classList.add("g-come"); setTimeout(() => m.n.classList.remove("g-come"), 1600); if (this._visible(m)) this.sonar("comer", { volumen: 0.6 }); }
    else if (ev.k === "bailemos") { this.gesto(m, "baila", false); if (!yo.mueble) this.gesto(yo, "baila", false); this._globo(m, "¡Bailemos!", 1800); }
    else if (["abrazo", "beso", "choca", "manita", "cosquillas", "selfie", "empujar"].includes(ev.k)) setTimeout(() => { if (ev.k !== "empujar") this._mirar(m, yo.gx < m.gx ? -1 : 1); this._juntosHacer(ev.k, m, yo); }, espera);
    else if (ev.k === "regalo" && COSAS_MANO[ev.t]) {
      this._volar(ev.t, m.gx, m.y - 60, yo.gx, yo.y - 60);
      setTimeout(() => {
        if (!this.vivo) return;
        this.sonar("regalo"); this.particulas("corazon", { gx: yo.gx, y: yo.y - 130 }, 0, 0, 6);
        aviso(`${this.pareja} te regaló ${COSAS_MANO[ev.t].n.toLowerCase()}`, 3000);
        yo.n.classList.add("sorpresa"); setTimeout(() => yo.n.classList.remove("sorpresa"), 1400);
        if (!yo.lleva) { this._ponerLleva(yo, ev.t); this._mandarYo({ lleva: ev.t }); }
      }, 520);
    }
  }

  /** El piano de tu amorcito: lo oyes si estás cerquita (más bajito entre más lejos). */
  _notasDeElla(t, espera) {
    const m = this.suyo, notas = String(t || "").split(".").map(Number).filter((n) => n >= 36 && n <= 96).slice(0, 8);
    const d = Math.abs(m.gx - this.yo.gx), mismo = enCuarto(m.gx).c === enCuarto(this.yo.gx).c;
    setTimeout(() => {
      if (!this.vivo) return;
      m.n.classList.add("tocando"); clearTimeout(m.ttoca); m.ttoca = setTimeout(() => m.n.classList.remove("tocando"), notas.length * 120 + 500);
      this.particulas("nota", { gx: m.gx, y: m.y - 140 }, 0, 0, Math.min(3, notas.length));
      if (!mismo && d > 520) return;
      const v = lim(1 - d / 800, 0.25, 1);
      notas.forEach((n, i) => setTimeout(() => this.vivo && this.sonar("piano", { nota: n, volumen: v }), i * 120));
    }, espera);
  }

  /* ═════════════ El regalito del día (sólo tuyo: uno cada día) ═════════════ */
  _regalito() {
    if (!this.vivo || this.regaloN) return;
    try { if (localStorage.getItem(REGALITO) === hoy()) return; } catch (e) { /* sin memoria: igual sale */ }
    const gx = global("sala", 400), y = 552;
    const n = el("button.ca-regalito", { type: "button", "aria-label": "Regalito del día", style: { left: gx - 26 + "px", top: y - 54 + "px", zIndex: y } }, [
      el("i.ca-regalito-tapa"), el("i.ca-regalito-caja"), el("i.ca-regalito-lazo"),
    ]);
    n.addEventListener("pointerdown", (e) => e.stopPropagation());
    n.addEventListener("click", () => this._abrirRegalito());
    this.regaloN = n;
    this.mundo.append(n);
  }
  async _abrirRegalito() {
    const n = this.regaloN;
    if (!n || n.classList.contains("abierto")) return;
    n.classList.add("abierto");
    try { localStorage.setItem(REGALITO, hoy()); } catch (e) { /* nada */ }
    const gx = global("sala", 400), m = this.yo, orden = ++m.orden;
    await new Promise((ok) => this._caminar(m, gx + 46 * (m.gx < gx ? -1 : 1), 548, ok));
    if (!this.vivo || m.orden !== orden) { n.classList.remove("abierto"); return; }
    this._mandarYo({ accion: "", mueble: "" });
    this._mirar(m, gx - m.gx);
    this.sonar("regalito"); vibrar(14);
    this.particulas("chispa", { gx, y: 500 }, 0, 0, 8); this.particulas("corazon", { gx, y: 480 }, 0, 0, 4);
    const cosa = ["estrellita", "flor", "helado", "galleta", "carta", "osito", "pelotita", "paleta"][Math.floor(Math.random() * 8)];
    setTimeout(() => { if (!this.vivo) return; this.dar(cosa, { gx, y: 548, def: { h: 50 } }); aviso(`Regalito del día: ${COSAS_MANO[cosa].n.toLowerCase()}`, 2800); }, 400);
    setTimeout(() => { n.remove(); this.regaloN = null; }, 1300);
  }
}

const enCuartoXY = (gx, y) => { const { c, x } = enCuarto(gx); return { c, x: Math.round(x), y: Math.round(y) }; };
