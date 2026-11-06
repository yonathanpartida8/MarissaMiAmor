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
 * afuera) · exterior.js y patio.js (el patio grande, Fase 64) · suciedad.js (hojitas y polvito) · girar.js (girar
 * las cosas con perspectiva) · ruta.js y puertas.js (caminos y puertas, Fase 63). Para crecer, casi siempre basta con
 * agregar en uno de ellos.
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
import { H, PISO, FONDO, FRENTE, SUELO, CUARTOS, CUARTOS_NUEVOS, ANCHO, inicioDe, cuarto, enCuarto, global, casaInicial, opsCuartoNuevo, proyectar, desproyectar, escala3d, corteDe, COLOR_PUERTA, LIMITE_EDIT, frenteDe, opsMudanza, FRENTE_3D, FONDO_3D } from "./cuartos.js";
import { MAPA, FACHADA, MUDANZA, editable as editableMapa } from "./exterior.js";
import { Patio } from "./patio.js";
import { Suciedad } from "./suciedad.js";
import { Viento } from "./viento.js";
import { Recolectar, FORRAJE, imagenForraje } from "./recolectar.js";
import { Vida } from "./vida.js";
import { Fisica } from "./fisica.js";
/** (Fase 68) El paso de los monitos (del mundo por segundo): caminando, trotando (viajes de más de TROTE_DESDE). */
const VEL_PASO = 168, VEL_TROTE = 246, TROTE_DESDE = 640;
import { giroDe, vistaGirada, vistaPlana, lugarGirado, hondura, ELEV_GIRO } from "./girar.js";
import { modelo as modelo3d, pintar as pintar3d, lugarEn as lugar3d, POSES as POSES3D, CEL as CEL3D } from "./monito3d.js";
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
import { CieloVivo } from "./cielo.js";
import { texPared, texPiso, texLluvia, texCharcos, pintarFrente, texAuto, texSol, texLuna, texRayos, pintarCaja, claveTapiz, clavePiso, sombraPx, conoLuzPx } from "./texturas.js";
import { Luces } from "./luces.js";
import { Puertas, hondoPuerta } from "./puertas.js";
import { Navegacion } from "./ruta.js";

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const MAX_OBJETOS = 300;
/** (Fase 66) Las poses que hace el monito de bulto (en cualquier ángulo del mueble). */
const POSE_3D = new Set(["sentado", "dormido", "banando", "columpio"]);
const PUERTA_T = 0.41;   // (Fase 60) a qué hondura del piso está la puerta de cada pared (0 = al fondo, 1 = enfrente)
const RECIENTES = "editordev:casita-recientes";
const POSES = ["sentado", "dormido", "banando", "columpio", "cocinando", "duchando"];
const nuevoId = () => Math.random().toString(36).slice(2, 10);
const REGALITO = "editordev:casita-regalito";
const PLEGADO = "editordev:casita-cuartos-plegados";
const PIXEL = "editordev:casita-pixel";
// Los monitos van siempre enfrente de los muebles (y las mascotas, enfrente de los muebles pero detrás de ellos).
const zMono = (y) => Math.round(y) + 2;     // (detrás del sillón, el sillón lo tapa; enfrente, se ve encima)
const zMascota = (y) => Math.round(y) + 1;   // (Fase 61: por hondura, como todo; ya no siempre encima de los muebles)
const puedeSubir = (d) => d.capa === "piso" && d.h <= 120 && d.tope == null && !d.topes && !d.superficie;
// (Fase 64) Lo que no se rompe al caer (es suavecito o está vivo) y qué tanto se daña según de qué tan alto cayó.
const blando = (d) => !!d.mascota || d.capa === "alfombra" || /cojin|peluche|puff|osito|almohada|globo|cobija|fuerte|flores|arbusto|arbol|tapete|hamaca|cama|pasto/.test(d.k);
const danoPor = (alto) => (alto > 400 ? 3 : alto > 210 ? 2 : alto > 90 ? 1 : 0);
const enPared = (o, d) => d.capa === "pared" && !o.e?.tirado;
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
    this.luces = new Luces(this); this.luces.armar();   // (Fase 61) la luz de verdad
    // (Fase 63) Las puertas de verdad, la navegación que rodea los muebles y el cuarto que se ve (uno a la vez).
    this.puertasN = new Puertas(this); this.nav = new Navegacion(this); this.vistaCuarto = "sala";
    // (Fase 64) El patio grande (su terreno, la fachada y el escenario) y las hojitas y el polvito.
    this.patio = new Patio(this); this.patio.armar(this.cuartosN.get("jardin"));
    this.suciedad = new Suciedad(this); this.suciedad.prender();
    this.viento = new Viento(this); this.viento.prender();
    // (Fase 67) Lo que se recoge en el patio (bayas, hongos, flores, piñas) y la canasta de los dos.
    this.recolectar = new Recolectar(this); this.recolectar.armar();
    this.vida = new Vida(this); this.vida.prender();
    this.fisica = new Fisica(this);
    this._tReco = setInterval(() => { if (this.vivo && !document.hidden && this.vistaCuarto === "jardin") this.recolectar.pintar(); }, 30000);
    this.cielo = new CieloVivo(this);
    this.cielo.armar();
    // Los monitos (la primera vez, cada quien de un lado de la sala: igual en los dos teléfonos).
    const izq = String(d.yo?.usuario || "") <= String(d.pareja?.usuario || "");
    this.yo = this._monito("yo", ropaDe(d.yo?.genero), "Tú", global("sala", izq ? 130 : 520));
    this.suyo = this._monito("pareja", ropaDe(d.pareja?.genero), PF.nombreDe(d.pareja) || this.pareja, global("sala", izq ? 520 : 130));
    this.mundo.append(this.yo.n, this.suyo.n);
    this.escena = el("div.ca-escena", {}, [this.vistaN]);
    this.raiz = el("div.ca", { dataset: { sinOnda: "" } }, [this.escena]);
    try { this.raiz.style.setProperty("--cono-px", conoLuzPx().url); } catch (e) { /* nada */ }
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
      if (this.vistaN.scrollTop && !cuarto(this.vistaCuarto).mapa) this.vistaN.scrollTop = 0;
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
    this.suciedad?.limpiarTodo();
    this.viento?.apagar();
    clearInterval(this._tReco); this.recolectar?.limpiar(); this.vida?.apagar(); this.fisica?.apagar();
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
    this.cielo?.limpiar();
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
    this._tocarObj(mejor);   // (Fase 63: si está en otro cuarto, tu monito va por las puertas)
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
      if (c.mapa) n.classList.add("px", "mapa");   // (Fase 64: el patio grande lo arma patio.js)
      else if (c.terraza) n.append(cielo(), el("canvas.ca-fondo-px", { "aria-hidden": "true" }), el("div.ca-lomas"), el("div.ca-ciudad"), el("div.ca-baranda"), el("canvas.ca-frente-px", { "aria-hidden": "true" }));
      else if (c.afuera) n.append(
        cielo(), el("canvas.ca-fondo-px", { "aria-hidden": "true" }),
        el("div.ca-lomas"), el("div.ca-cerca"), el("div.ca-camino"),
        el("div.ca-fachada", {}, [el("i.ca-techo"), el("i.ca-fachada-ventana"), el("i.ca-fachada-ventana.v2")]),
        el("canvas.ca-frente-px", { "aria-hidden": "true" }),
      );
      // (Fase 61) Adentro, cada cuarto es una cajita 3D: piso y paredes de los lados en perspectiva (un lienzo pixel).
      else n.append(el("canvas.ca-caja-cv", { "aria-hidden": "true" }), el("i.ca-columna"), el("i.ca-techo-r"), c.foco ? el("i.ca-pendiente", { style: { left: c.foco + "px" } }, [el("i.ca-pendiente-luz")]) : null);
      this.mundo.append(n);
      this.cuartosN.set(c.k, n);
      const o = el("i.ca-oscuro." + c.k, { style: { left: inicioDe(c.k) + "px", width: c.w + "px" } });
      this.oscuroN.set(c.k, o);
      // (Fase 60) La luz ambiental de cada cuarto (cálida en la cocina, lila en la recámara, fresca en el baño…).
      this.mundo.append(el("i.ca-ambiente." + c.k, { "aria-hidden": "true", style: { left: inicioDe(c.k) + "px", width: c.w + "px" } }));
      this.mundo.append(o);
      if (c.afuera) {
        const ch = el("i.ca-charcos");
        try { const t = texCharcos(c.w); ch.style.setProperty("--charcos", t.url); } catch (e) { /* nada */ }
        // (En el patio grande la lluvia sencilla cubre todo lo hondo del mapa.)
        n.append(el("i.ca-lluvia", c.mapa ? { style: { height: MAPA.alto + MAPA.arriba + 900 + "px" } } : {}), ch);
      }
      if (c.afuera) {
        // (Fase 58) El sol y la luna en pixel, con su brillo; se mueven y cambian con la hora.
        const fp = n.querySelector(".ca-fondo-px");
        const sol = el("i.ca-astro.sol", { "aria-hidden": "true" }), luna = el("i.ca-astro.luna", { "aria-hidden": "true" });
        try { luna.style.backgroundImage = texLuna().url; } catch (e) { /* nada */ }
        if (fp) fp.after(sol, luna); else n.append(sol, luna);
      }
      // (Fase 69) Ya no hay franja de «sólo para caminar»: todo el piso se puede acomodar.
      if (c.k === "jardin" && !c.mapa) {
        // El carrito pasa por la calle, DETRÁS de la cerca (antes pasaba por dentro).
        const auto = el("i.ca-auto");
        try { auto.style.backgroundImage = texAuto().url; } catch (e) { /* nada */ }
        const fp = n.querySelector(".ca-fondo-px");
        if (fp) fp.after(auto); else n.append(auto);
      }
    }
    // Entre cuarto y cuarto (adentro), una pared con su puerta que se abre sola al pasar.
    this.puertas = [];   // (Fase 63: ya no hay paredes que se crucen por la orilla; las puertas son de cada cuarto)
    for (let i = 1; i < CUARTOS.length; i++) {
      const a = CUARTOS[i - 1], b = CUARTOS[i];
      const ext = !!(a.afuera || b.afuera);   // (Fase 60) también la pared de la casa con su puerta (antes no había: se atravesaba)
      // (Fase 59) Con su base en perspectiva sobre el piso (2.5D), que se acomoda según dónde mires.
      const x = inicioDe(b.k);
      // (Fase 62) El corte de la pared entre los dos cuartos (como en una casita de muñecas): de arriba abajo, encima de
      // los monitos (al cruzar la puerta pasan por detrás de él) y sin la V de antes.
      const ca = corteDe(a.k), cb = corteDe(b.k);
      if (ca + cb > 0) this.mundo.append(el("i.ca-tabique" + (ext ? ".exterior" : ""), { "aria-hidden": "true", style: { left: (x - ca).toFixed(1) + "px", width: (ca + cb).toFixed(1) + "px" } }));
      // (Fase 63: ya no se cruza de un cuarto al de al lado por la orilla: se pasa por las puertas de verdad.)
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
      this.selGirarB = el("button.ca-sel-b.girar", { type: "button", "aria-label": "Girar (o arrastra para girar libre)", title: "Girar (o arrastra para girar libre)", html: ICO.girar }),
      this.selArreglarB = el("button.ca-sel-b", { type: "button", "aria-label": "Arreglar", title: "Arreglar", html: ICO.arreglar, hidden: "", onClick: () => this._arreglar() }),
      this.selColorB = el("button.ca-sel-b", { type: "button", "aria-label": "Otro color", title: "Otro color", html: ICO.color, onClick: () => this._otroColor() }),
      this.selPuertaB = el("button.ca-sel-b", { type: "button", "aria-label": "A dónde lleva", title: "A dónde lleva", html: ICO.cuartos, hidden: "", onClick: () => { const r = this.sel; if (r) this.puertasN.tocar("o:" + r.o.id); } }),
      this.selColoresN = el("div.ca-sel-colores", { role: "radiogroup", "aria-label": "Colores" }),
      el("button.ca-sel-b", { type: "button", "aria-label": "Duplicar", title: "Duplicar", html: ICO.duplicar, onClick: () => this._duplicar() }),
      el("button.ca-sel-b.peligro", { type: "button", "aria-label": "Quitar", title: "Quitar", html: ICO.borrar, onClick: () => { const r = this.sel; if (r) this._borrar(r); } }),
    ]);
    {
      const gb = this.selGirarB; let gi = null;
      gb.addEventListener("pointerdown", (e) => { const r = this.sel; if (!r) return; e.preventDefault(); gi = { id: e.pointerId, x: e.clientX, g0: giroDe(r.o), g: giroDe(r.o), mov: false }; try { gb.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } });
      gb.addEventListener("pointermove", (e) => {
        if (!gi || e.pointerId !== gi.id) return;
        const dx = e.clientX - gi.x;
        if (Math.abs(dx) > 6) gi.mov = true;
        if (!gi.mov || !this.sel) return;
        const g = (((gi.g0 + Math.round(dx / 14) * 15) % 360) + 360) % 360;
        if (g !== gi.g) { gi.g = g; this._dibujarObj(this.sel, { ...this.sel.o, e: { ...(this.sel.o.e || {}), giro: g } }); this.sonar("clic", { volumen: 0.3 }); }
      });
      const fin = (e) => { if (!gi || e.pointerId !== gi.id) return; const G = gi; gi = null; if (this.sel) this._girar(this.sel, G.mov ? G.g : (G.g0 + 45) % 360); };
      gb.addEventListener("pointerup", fin);
      gb.addEventListener("pointercancel", (e) => { if (gi && e.pointerId === gi.id) { gi = null; if (this.sel) this._dibujarObj(this.sel, this.sel.o); } });
      gb.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && this.sel) { e.preventDefault(); this._girar(this.sel, (giroDe(this.sel.o) + 45) % 360); } });
    }
    this.volverN = el("div.ca-barra", {}, [
      el("button.ca-volver", { type: "button", onClick: () => this._volver() }, [el("i", { html: ICO.volver }), el("span", { text: "Volver atrás" })]),
      this.climaB = el("button.ca-ajustes-b.clima", { type: "button", "aria-label": "El clima y la hora", title: "El clima y la hora", html: ICO.sol, onClick: () => P.clima(this) }),
      this.vozB = el("button.ca-ajustes-b.voz", { type: "button", "aria-label": "Voz en vivo", title: "Hablar en vivo los dos", html: ICO.mic, hidden: puedeVoz() ? null : "", onClick: () => this.voz.alternar() }),
      this.mudoB = el("button.ca-ajustes-b.mudo", { type: "button", "aria-label": "Silenciar mi micrófono", title: "Silenciar mi micrófono", html: ICO.mudo, hidden: "", onClick: () => this.voz.silenciar() }),
      el("button.ca-ajustes-b", { type: "button", "aria-label": "Ajustes", title: "Ajustes", html: ICO.sonido, onClick: () => P.ajustes(this) }),
    ]);
    this.flashN = el("i.ca-flash", { "aria-hidden": "true" });
    // (Fase 64) Volver a ver a tu monito (si moviste la cámara): chiquito y discreto.
    this._enfocarB = el("button.ca-enfocar", { type: "button", "aria-label": "Ver a mi monito", title: "Ver a mi monito", html: ICO.enfocar, onClick: () => this.enfocar() });
    // (Fase 67) La canasta de lo que recogen en el patio (con cuántas cosas trae).
    this.canastaB = el("button.ca-canasta-b", { type: "button", "aria-label": "La canasta", title: "La canasta", hidden: "", onClick: () => this._abrirCanasta() }, [el("i.ca-canasta-ico"), el("b.ca-canasta-n")]);
    this.escena.append(this.flashN, this.hudN, this.necesidades.armar(), this.cuartosB, this.edicionN, this.basuraN, this._enfocarB, this.canastaB);
    this.raiz.append(this.selN, this.volverN);
  }

  /** (Fase 67) La canasta: el botoncito (en el patio, o donde sea si trae algo) y su panel. */
  _pintarCanasta() {
    const b = this.canastaB;
    if (!b || !this.recolectar) return;
    const c = this.recolectar.canasta(), n = Object.values(c).reduce((a, x) => a + x, 0);
    b.hidden = this.editando || (!n && this.vistaCuarto !== "jardin");
    b.querySelector(".ca-canasta-n").textContent = n ? String(n) : "";
    if (this._canastaN?.isConnected) this._abrirCanasta(true);
  }
  _abrirCanasta(refrescar = false) {
    this._canastaN?.remove();
    if (refrescar && !this._canastaAbierta) return;
    this._canastaAbierta = true;
    const c = this.recolectar.canasta(), cerrar = () => { this._canastaAbierta = false; p.remove(); };
    const filas = Object.keys(FORRAJE).filter((k) => c[k]).map((k) => el("div.ca-canasta-fila", {}, [
      el("img", { src: imagenForraje(k, 4), alt: "" }), el("span", { text: `${FORRAJE[k].n} ×${c[k]}` }),
      FORRAJE[k].come ? el("button.ca-canasta-acc", { type: "button", text: "Comer", onClick: () => { this.recolectar.sacar(k, true); } }) : null,
      el("button.ca-canasta-acc", { type: "button", text: "A la mano", onClick: () => { this.recolectar.sacar(k); cerrar(); } }),
    ].filter(Boolean)));
    const p = (this._canastaN = el("div.ca-canasta", { role: "dialog", "aria-label": "La canasta" }, [
      el("div.ca-canasta-tit", {}, [el("b", { text: "La canasta de los dos" }), el("button.ca-canasta-x", { type: "button", "aria-label": "Cerrar", text: "×", onClick: cerrar })]),
      filas.length ? el("div.ca-canasta-lista", {}, filas) : el("p.ca-canasta-vacia", { text: "Todavía no recogen nada. En el patio hay zarzas con bayas, hongos bajo los árboles, flores en el pasto y piñas bajo los pinos." }),
    ]));
    this.escena.append(p);
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
  /** (Fase 61) La cajita 3D de un cuarto de adentro: su piso y sus paredes de los lados con su tapiz, en perspectiva,
   *  y las puertas en la pared de su lado (abiertas o cerradas). Se repinta sólo si cambia algo. */
  _caja(k, cfg = this.cfgCuarto(k), soloPuertas = false) {
    const cu = cuarto(k), n = this.cuartosN?.get(k), cv = n?.querySelector(":scope > .ca-caja-cv");
    if (!cv || cu.afuera) return;
    try {
      texPared(cfg.pared, cfg.patron); texPiso(cfg.piso);   // (deja listos los cuadritos del tapiz y del piso)
      // (Fase 63) Las puertas de los lados de ESTE cuarto (si las hay), qué tan abiertas y de qué color.
      const lado = (pared) => { const q = this.puertasN?.de(k).find((x) => x.pared === pared); return q && { puerta: true, ap: Math.round((this.puertasN.ap.get(q.id) || 0) * 4) / 4, exterior: !!cuarto(q.va).afuera, color: COLOR_PUERTA[k] }; };
      const izq = lado("izq"), der = lado("der");
      const c = { w: cu.w, pared: claveTapiz(cfg.pared, cfg.patron), piso: clavePiso(cfg.piso), izq, der };
      const clave = JSON.stringify(c);
      if (cv._clave === clave) return;
      const soloP = soloPuertas && cv._base === `${cfg.pared}|${cfg.patron}|${cfg.piso}`;
      cv._clave = clave; cv._base = `${cfg.pared}|${cfg.patron}|${cfg.piso}`;
      pintarCaja(cv, c, soloP);
    } catch (e) { /* nada: se queda la pared de siempre */ }
  }
  /** (Fase 57) Paredes y pisos en pixel art: su tapiz y su piso como texturas chiquitas agrandadas sin suavizar. */
  _texturas(k, cfg) {
    const n = this.cuartosN?.get(k);
    if (!n) return;
    const on = this.raiz.classList.contains("pixel"), clave = on ? `${cfg.pared}|${cfg.patron}|${cfg.piso}` : "";
    this._caja(k, cfg);
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
    // (Fase 63) La luz con WebGL 2 en TODOS los modos (los ligeros, a menos resolución y menos cuadros). Si el teléfono
    // no tiene WebGL 2, se queda el mapa de luz en lienzo (lo mismo, más sencillo).
    if (this.capa) this.capa.ajustar(nivel(k));
    if (!this.capa) {
      this.capa = crearCapaGL(this, nivel(k));
      if (this.capa) { this.capa.nv = nivel(k); this.escena.insertBefore(this.capa.n, this.hudN); }
      else if (avisar && k === "ultra") aviso("Tu teléfono no tiene WebGL 2: la luz va en modo sencillo", 3200);
    }
    this.capa?.prender();
    R.classList.toggle("gl", !!this.capa);
    if (this.casa) this._clima();
  }
  _sinGL(t) { this.capa?.destruir(); this.capa = null; this.raiz?.classList.remove("gl"); if (t) aviso(t + ": la luz sigue en modo sencillo", 2600); }
  /** Lo que la capa WebGL necesita en cada cuadro: las luces prendidas (en la pantalla), la hora y el clima. */
  estadoGL() {
    // (Fase 63) Las luces del cuarto que se ve (las mismas del mapa de luz), en el lienzo de la capa; y qué tan oscuro.
    const c = this.vistaCuarto, cu = cuarto(c), k = this.k, luces = [], noche = this.esNoche(), tarde = !noche && this.mundo.classList.contains("tarde");
    const G = this.capa?.n.getBoundingClientRect(), M = this.mundo.getBoundingClientRect(), ox = M.left - (G?.left || 0), oy = M.top - (G?.top || 0), x0 = inicioDe(c);
    const cl = this.climaActual(), ll = { sol: 0, lluvia: 0.5, tormenta: 0.8, extra: 1 }[cl] || 0;
    const apagado = !cu.afuera && this.cfgCuarto(c).luz === false;
    let oscuro = noche ? (cu.afuera ? 0.42 : apagado ? 0.72 : 0.5) : tarde ? 0.2 : apagado ? 0.36 : 0;
    oscuro = Math.min(0.8, oscuro + ll * 0.1);
    if (oscuro > 0) for (const f of this.luces?._fuentes(c) || []) luces.push({ x: ox + (x0 + f.x) * k, y: oy + f.y * k, r: f.r * k, i: Math.min(1, f.i), c: "#" + f.k.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") });
    return { luces, noche: noche ? 1 : tarde ? 0.45 : 0, oscuro, lluvia: ll, viento: cl === "extra" ? 1.6 : cl === "tormenta" ? 0.9 : 0.35, flash: Math.min(1, this._flash || 0), afuera: !!cu.afuera, ambiente: noche ? [0.07, 0.05, 0.16] : ll ? [0.1, 0.12, 0.18] : [0.22, 0.1, 0.16] };
  }
  /** El fondo pixel de afuera (jardín y terraza): se dibuja sólo cuando cambia la hora, el clima o el perfil. */
  _pintarFondos() {
    if (!this.cuartosN || !this.mundo) return;
    const hora = this.esNoche() ? "noche" : this.mundo.classList.contains("tarde") ? "tarde" : "dia", clima = this.climaActual();
    const clave = `${hora}|${clima}|${this.gfx}`;
    if (clave === this._fondoClave) return;
    this._fondoClave = clave;
    for (const c of CUARTOS) {
      // (Fase 69) El sol (con sus rayos que destellan) y la luna con la fase de hoy, también en el patio grande.
      if (c.afuera) {
        const na = this.cuartosN.get(c.k), sol = na?.querySelector(".ca-astro.sol"), luna = na?.querySelector(".ca-astro.luna");
        try {
          if (sol) { const t = hora === "tarde"; sol.style.backgroundImage = texSol(t).url; sol.style.setProperty("--rayos-a", texRayos(t, 0).url); sol.style.setProperty("--rayos-b", texRayos(t, 1).url); }
          if (luna) luna.style.backgroundImage = texLuna().url;
        } catch (e) { /* nada */ }
      }
      if (c.mapa) { this.patio?.pintarHora(hora, clima); continue; }
      const n = c.afuera && this.cuartosN.get(c.k), cv = n?.querySelector(".ca-fondo-px");
      if (!cv) continue;
      const cielo = n.querySelector(".ca-cielo");
      try {
        const r = pintarFondo(cv, { ancho: c.w + 300, hora, clima, tipo: c.terraza ? "ciudad" : "barrio", semilla: c.terraza ? 7 : 3 });
        n.classList.add("px");
        if (cielo) cielo.style.background = r.arriba;   // arriba del dibujo, el mismo color del cielo
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
    const abajo = this.editando ? Math.min(vh * 0.45, (this.cajonN?._altoChico || this.cajonN?.offsetHeight || 150) + 18) : 58;
    this.k = lim(Math.min((vh - abajo) / H, vw / 400), 0.42, 1.45);
    // (Fase 64) En el patio grande el mundo es más hondo: se desliza también para abajo (y se ve un poquito de cielo).
    const mapa = !!cuarto(this.vistaCuarto || "sala").mapa;
    this.offY = mapa ? MAPA.arriba * this.k : Math.max(0, vh - abajo - H * this.k);
    this._moverMundo();
    this.mundo.style.setProperty("--techo", (-this.offY / this.k).toFixed(1) + "px");
    // (Fase 63) El lienzo mide sólo el cuarto que se ve: no se puede deslizar a los otros (y quedan ocultos).
    this.lienzo.style.width = Math.round(cuarto(this.vistaCuarto || "sala").w * this.k) + "px";
    this.lienzo.style.height = (mapa ? Math.round((MAPA.alto + MAPA.arriba) * this.k) : vh) + "px";
    this._ubicarSel();
    this._profundidad();
  }
  /** `_subir`: cuánto se sube la casita para que tu monito y su burbujita se vean arriba del teclado. */
  _moverMundo() { this.mundo.style.transform = `translate(${(-inicioDe(this.vistaCuarto || "sala") * this.k).toFixed(1)}px, ${(this.offY - (this._subir || 0)).toFixed(1)}px) scale(${this.k.toFixed(4)})`; }
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
  /** (Fase 61) Dónde se ve un punto del mundo: adentro, con la perspectiva de la cajita (prof = qué tan hondo está en el piso). */
  _vista(gx, y, prof = y) { const P = proyectar(gx, prof); return { x: P.x, y: prof - (prof - y) * P.s, s: P.s }; }
  /** (Fase 61) Qué tan hondo está un punto que no está en el piso: si cae sobre un monito o un mueble, a la hondura de su base. */
  _profDe(gx, y) {
    let mejor = null;
    const ver = (base, cerca) => { if (cerca && y <= base + 4 && (mejor == null || base < mejor)) mejor = base; };
    for (const m of [this.yo, this.suyo]) { const b = m?.prof ?? m?.y; if (m) ver(b, Math.abs(m.gx - gx) < 50 && y >= b - 190); }
    for (const r of this.objs?.values() || []) if (r.d.capa !== "pared" && r.d.capa !== "alfombra") ver(r.o.y, Math.abs(r.gx - gx) <= r.d.w / 2 && y >= r.o.y - r.d.h - 10);
    return lim(mejor ?? y, PISO, H);
  }
  enPantalla(gx, y, prof = this._profDe(gx, y)) { const r = this.mundo.getBoundingClientRect(), v = this._vista(gx, y, prof); return { x: r.left + v.x * this.k, y: r.top + v.y * this.k }; }
  /** Del dedo al mundo: X es lo que se ve; x es dónde queda en el piso (sin la perspectiva), según lo hondo de y. */
  _xy(e) { const r = this.mundo.getBoundingClientRect(), X = (e.clientX - r.left) / this.k, y = (e.clientY - r.top) / this.k; return { X, x: desproyectar(X, lim(y, PISO, H)), y }; }
  irCuarto(k, suave = true) {
    // (Fase 63: cada cuarto se ve solito; esto muestra uno, centrado. Tu monito se mueve de cuarto por las puertas.)
    this._camPausa = performance.now() + 3500; cancelAnimationFrame(this._rqCam); this._rqCam = 0;
    this._mostrarCuarto(cuarto(k).k);
  }
  /** (Fase 60) Cámara suave: mientras tu monito camina, la vista lo va siguiendo despacito (sin brincos);
   *  si tú mueves la vista con el dedo, la cámara te deja. */
  _seguir(gx) {
    // (Fase 64) Si moviste la cámara con el dedo, ya no lo sigue (hasta que tocas «Ver a mi monito»).
    if (this._camLibre) { this._verEnfocar(); return; }
    const v = this.vistaN, mapa = !!cuarto(this.vistaCuarto).mapa, k = this.k;
    const px = (gx - inicioDe(this.vistaCuarto)) * k, py = mapa ? ((this.yo.y || 0) + MAPA.arriba - 70) * k : 0;
    const mx = Math.min(90, v.clientWidth * 0.2), my = Math.min(130, v.clientHeight * 0.22);
    const fuera = () => px < v.scrollLeft + mx || px > v.scrollLeft + v.clientWidth - mx || (mapa && (py < v.scrollTop + my || py > v.scrollTop + v.clientHeight - my));
    if (reducido()) { if (fuera()) { v.scrollLeft = px - v.clientWidth / 2; if (mapa) v.scrollTop = py - v.clientHeight / 2; } return; }
    // Quieto (abrir la burbujita, sentarse…): sólo se asegura de que se vea, con un deslizamiento suave.
    if (!this.yo.n.classList.contains("camina") && !this.yo._enRuta) { if (fuera()) v.scrollTo({ left: px - v.clientWidth / 2, top: mapa ? py - v.clientHeight / 2 : 0, behavior: "smooth" }); return; }
    if (this._rqCam) return;
    const paso = () => {
      this._rqCam = 0;
      // (Sólo mientras camina: al llegar la vista se queda quieta; tampoco si escribes, si mueves la cámara o elegiste un cuarto.)
      if (!this.vivo || this._dedoAbajo || this._congelado || this._camLibre || performance.now() < (this._camPausa || 0) || (!this.yo.n.classList.contains("camina") && !this.yo._enRuta)) return;
      const R = this.yo.n.getBoundingClientRect(), V = v.getBoundingClientRect();
      const dx = R.left + R.width / 2 - V.left - v.clientWidth / 2, dy = R.top + R.height * 0.5 - V.top - v.clientHeight / 2;
      // Zona muerta en medio; afuera de ella, se acerca suave (con tope de velocidad: la vista nunca brinca).
      const tope = this.yo.n.classList.contains("corre") ? 20 : 14;
      if (Math.abs(dx) > v.clientWidth * 0.12) v.scrollLeft += lim(dx * 0.08, -tope, tope);
      if (mapa && Math.abs(dy) > v.clientHeight * 0.12) v.scrollTop += lim(dy * 0.08, -tope, tope);
      this._rqCam = requestAnimationFrame(paso);
    };
    this._rqCam = requestAnimationFrame(paso);
  }
  /** (Fase 64) El botoncito para volver a ver a tu monito: sale si moviste la cámara o si tu monito no se ve. */
  _verEnfocar() {
    const b = this._enfocarB;
    if (!b) return;
    const ver = !this.editando && (this._camLibre || !this._visible(this.yo, 0.02));
    b.classList.toggle("ver", ver);
  }
  /** Volver a ver a tu monito (y que la cámara lo siga otra vez). */
  enfocar() {
    this._camLibre = false;
    const m = this.yo, c = enCuarto(m.gx).c;
    if (c !== this.vistaCuarto) { this._mostrarCuarto(c, m.gx, m.y); this._verEnfocar(); return; }
    const v = this.vistaN, mapa = !!cuarto(c).mapa, k = this.k;
    v.scrollTo({ left: (m.gx - inicioDe(c)) * k - v.clientWidth / 2, top: mapa ? (m.y + MAPA.arriba - 70) * k - v.clientHeight / 2 : 0, behavior: reducido() ? "auto" : "smooth" });
    this._enfocarB?.classList.remove("ver");
    this.sonar("whoosh", { volumen: 0.4 });
    if (m.n.classList.contains("camina") || m._enRuta) setTimeout(() => this.vivo && this._seguir(m.gx), 400);
  }
  /** (Fase 60) La flechita en el piso: dónde vas a llegar y hacia dónde. */
  _flecha(gx, y) {
    if (!this._flechaN) { this._flechaN = el("i.ca-flecha", { "aria-hidden": "true", html: '<svg viewBox="0 0 9 7" shape-rendering="crispEdges"><path d="M0 2h4V0h1v1h1v1h1v1h1v1H7v1H6v1H5v1H4V5H0z" fill="#fff"/><path d="M1 3h4V2h1v1h1v1H6v1H5V4H1z" fill="#ff6fa5"/></svg>' }); this.mundo.append(this._flechaN); }
    const f = this._flechaN, m = this.yo, a = Math.atan2((y - m.y) * 0.6, gx - m.gx) * 180 / Math.PI;
    const v = this._vista(gx, y);
    f.style.left = v.x.toFixed(1) + "px"; f.style.top = y + "px"; f.style.scale = v.s.toFixed(3); f.style.setProperty("--a", a.toFixed(0) + "deg");
    f.classList.remove("ver"); void f.offsetWidth; f.classList.add("ver");
  }
  /** (Fase 60) La sombra del monito: sale del lado contrario a la luz más cercana (lámpara prendida, o el sol afuera)
   *  y se alarga mientras más de lado le pegue. */
  _sombra(m) {
    if (!m?.n || !this.cuartosN) return;
    const { c } = enCuarto(m.gx), cu = cuarto(c), mx = proyectar(m.gx, m.prof ?? m.y).x;
    let lx = null, fuerza = 0.6;
    for (const r of this.objs.values()) {
      if (!r.glow || r.o.c !== c || !r.glow.classList.contains("on")) continue;
      const x = parseFloat(r.glow.style.left) + r.d.brilla.r;
      if (lx == null || Math.abs(x - mx) < Math.abs(lx - mx)) { lx = x; fuerza = 1; }
    }
    // (Con la luz del cuarto prendida y sin lámparas, el foco del techo.)
    if (lx == null && !cu.afuera && cu.foco && this.cfgCuarto(c).luz !== false && this.esNoche()) { lx = inicioDe(c) + cu.foco; fuerza = 0.8; }
    if (lx == null && cu.afuera && !this.esNoche()) lx = inicioDe(c) + cu.w * 0.86;   // el sol
    let sx = 0, ss = 1, so = 0.85;
    if (lx != null) {
      const dx = mx - lx, largo = lim(Math.abs(dx) / 240, 0.15, 1.4);
      sx = Math.sign(dx || 1) * largo * 13 * (m.mira < 0 ? -1 : 1); ss = 1 + largo * 0.9; so = lim(1.05 - Math.abs(dx) / 900, 0.5, 1) * fuerza + (1 - fuerza) * 0.7;
    }
    m.n.style.setProperty("--sx", sx.toFixed(1) + "px"); m.n.style.setProperty("--ss", ss.toFixed(2)); m.n.style.setProperty("--so", so.toFixed(2));
  }
  /** (Fase 60) Tu monito voltea la cabecita hacia tu dedo (y al soltarlo vuelve a verte de frente). */
  _mirarDedo(x, y) {
    const m = this.yo, cab = m?.n.querySelector(".ca-cabeza");
    if (!cab) return;
    if (x == null) { m.n.classList.remove("siguiendo"); for (const k of ["--hx", "--hr", "--ox", "--oy"]) m.n.style.removeProperty(k); return; }
    const R = cab.getBoundingClientRect(), vx0 = lim((x - (R.left + R.width / 2)) / 150, -1, 1) * (m.mira < 0 ? -1 : 1), vy = lim((y - (R.top + R.height / 2)) / 220, -1, 1);
    m.n.classList.add("siguiendo");
    m.n.style.setProperty("--hx", Math.round(vx0 * 1.2) * 4 + "px");
    m.n.style.setProperty("--hr", (vx0 * 7).toFixed(1) + "deg");
    m.n.style.setProperty("--ox", Math.round(vx0 * 1.3) * 4 + "px");
    m.n.style.setProperty("--oy", Math.round(vy * 1.2) * 4 + "px");
  }
  /** (Fase 59) 2.5D: la ciudad y el cielo se mueven más despacio que la casa (están lejos) y la base de las
   *  paredes entre cuartos se ve en perspectiva según dónde esté la cámara. */
  _profundidad() {
    // (Fase 64) El fondo ya no se recorre con el dedo (eso daba tironcitos): se queda fijo y estable.
    if (this.vivo) return;
    const v = this.vistaN, k = this.k || 1;
    if (!v || !this.cuartosN) return;
    const centro = (v.scrollLeft + v.clientWidth / 2) / k + inicioDe(this.vistaCuarto), vista = v.clientWidth / k;
    for (const c of CUARTOS) {
      if (!c.afuera) continue;
      const n = this.cuartosN.get(c.k), dx = centro - (inicioDe(c.k) + c.w / 2);
      if (Math.abs(dx) > c.w / 2 + vista) continue;
      n.style.setProperty("--px-ciudad", lim(dx * 0.2, -150, 150).toFixed(1) + "px");
      n.style.setProperty("--px-cielo", lim(dx * 0.35, -260, 260).toFixed(1) + "px");
    }
  }
  /** (Fase 63) El monito camina a una puerta (rodeando lo que haya) y la cruza; luego `luego` en el otro cuarto. */
  _caminarAPuerta(m, p, luego = null, viaje = null) {
    const pi = this.puertasN.pie(p);
    this._caminar(m, pi.gx, pi.y, () => this.puertasN.cruzar(m, p, luego), false, false, viaje, true);
  }
  /** (Fase 63) La transición de cuarto: un iris que se cierra sobre la puerta y se abre en la del otro lado. */
  _iris(cerrar, pt) {
    if (!this.irisN) { this.irisN = el("i.ca-iris", { "aria-hidden": "true", hidden: "" }); this.escena.append(this.irisN); }
    const n = this.irisN, R = this.escena.getBoundingClientRect(), x = (pt?.x ?? R.left + R.width / 2) - R.left, y = (pt?.y ?? R.top + R.height / 2) - R.top;
    const max = Math.hypot(Math.max(x, R.width - x), Math.max(y, R.height - y)) + 24, ms = reducido() ? 1 : cerrar ? 320 : 420, t0 = performance.now();
    n.hidden = false;
    const pinta = (f) => { const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2, r = (cerrar ? 1 - e : e) * max; n.style.background = `radial-gradient(circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, transparent ${r.toFixed(1)}px, rgba(38, 25, 48, .97) ${(r + 2).toFixed(1)}px)`; };
    return new Promise((ok) => {
      let listo = false;
      const fin = () => { if (listo) return; listo = true; pinta(1); if (!cerrar) n.hidden = true; ok(); };
      const paso = (t) => { if (listo) return; const f = Math.min(1, (t - t0) / ms); pinta(f); if (f < 1) requestAnimationFrame(paso); else fin(); };
      requestAnimationFrame(paso); setTimeout(fin, ms + 220);   // (si la pestaña se esconde, igual termina)
    });
  }
  /** (Fase 63) Qué cuarto se ve: uno a la vez (los demás quedan fuera del lienzo, ocultos, y no se pueden deslizar). */
  _mostrarCuarto(k, gx = null, gy = null) {
    if (!this.cuartosN || !CUARTOS.some((c) => c.k === k)) return;
    const cambio = k !== this.vistaCuarto;
    this.vistaCuarto = k;
    this.raiz.dataset.cuarto = k;
    this._medir();
    const v = this.vistaN, cu = cuarto(k), x = (gx ?? inicioDe(k) + cu.w / 2) - inicioDe(k);
    v.scrollLeft = Math.max(0, x * this.k - v.clientWidth / 2);
    // (Fase 64) En el patio, también a la altura de tu monito (o de la puerta).
    if (cu.mapa) this.patio?.pintarTerreno();
    if (cu.mapa) { const y = gy ?? (enCuarto(this.yo.gx).c === k ? this.yo.y : MAPA.fondo + 160); v.scrollTop = Math.max(0, (y + MAPA.arriba - 70) * this.k - v.clientHeight / 2); }
    else v.scrollTop = 0;
    if (cambio) { this._camLibre = false; this._pintado = false; this.puertasN.pintar(); this.suciedad?.pintar(); try { this.luces?.pintar(); } catch (e) { /* nada */ } }
    this._alDeslizar();
  }
  /** Lo que dice el HUD de tu amorcito (Fase 63: en qué cuarto anda, si no está contigo). */
  _estado() {
    if (!this.estadoN) return;
    const c = enCuarto(this.suyo?.gx || 0).c;
    this.estadoN.textContent = !this._parejaAqui ? `${this.pareja} no está ahorita` : c === this.vistaCuarto ? `${this.pareja} está aquí` : `${this.pareja} está en ${cuarto(c).n}`;
  }
  /** Ver un punto del mundo (cambia al cuarto donde está). */
  verX(gx, gy = null) { this._mostrarCuarto(enCuarto(gx).c, gx, gy); }
  _alDeslizar() {
    this._profundidad();
    this._verEnfocar();
    const c = this.vistaCuarto;
    this._ubicarSel();
    if (c === this.cuartoActual && this._pintado) return;
    this._pintado = true;
    this.cuartoActual = c;
    this.nombreN.textContent = cuarto(c).n; this._estado();
    this.edCuartoN.textContent = cuarto(c).n;
    for (const b of this.cuartosB.children) { const on = b.dataset.k === c; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); }
    this._musicas();
    this._lejos();
  }
  /** Lo que queda a más de un cuarto de distancia no se dibuja ni se anima (menos trabajo, menos calor). */
  _lejos() {
    if (!this.vistaN || !this.k) return;
    // (Lo que se ve, más casi un cuarto de cada lado: así nunca se nota al deslizar.)
    // (Fase 63: sólo el cuarto que se ve.)
    const cerca = new Set([this.vistaCuarto]);
    for (const c of CUARTOS) { const n = this.cuartosN.get(c.k); n?.classList.toggle("lejos", !cerca.has(c.k)); }
    this.patio?.lejos(!cerca.has("jardin"));
    for (const { n } of this.recolectar?.nodos.values() || []) n.classList.toggle("lejos", !cerca.has("jardin"));
    this._pintarCanasta?.();
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
      // (Fase 62: afuera manda el sol: apagar el interruptor de afuera sólo apaga los faroles, nunca oscurece de día.)
      const oscuro = !c.afuera && cfg.luz === false;
      this.oscuroN.get(c.k).classList.toggle("apagado", oscuro);
      n.classList.toggle("apagado", oscuro);
    }
    const vistos = new Set();
    for (const o of casa.objetos || []) {
      const d = CATALOGO[o.t];
      if (!d || !CUARTOS.some((c) => c.k === o.c)) continue;
      vistos.add(o.id);
      let r = this.objs.get(o.id);
      const nuevo = !r;
      if (!r) { r = this._crearObj(o, d); this.objs.set(o.id, r); }
      else if ((r.o.e?.col | 0) !== (o.e?.col | 0) || giroDe(r.o) !== giroDe(o) || (r.o.e?.dano | 0) !== (o.e?.dano | 0)) this._dibujarObj(r, o);
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
      for (const m of [this.yo, this.suyo]) if (m.mueble.startsWith(id + ":")) { this._pose(m, ""); m.y = lim((m.prof ?? m.y) + 10, FONDO, FRENTE); this._ponerMono(m); }
      this._quitarNodo(r);
    }
    this._yaPintada = true;
    this.nav?.invalidar(); this.puertasN?.pintar();   // (Fase 63)
    this.suciedad?.pintar();   // (Fase 64)
    this.recolectar?.pintar();   // (Fase 67)
    this._alturas();   // (Fase 65)
    this._lejos();
    for (const mm of [this.yo, this.suyo]) this._sombra(mm);
    this._marcarOcupados();
    this._musicas();
    this.mensajes.marcas();
    this._tiempo();
    this._clima();
  }
  _crearObj(o, d) {
    const n = el("div.ca-obj." + d.k + ".capa-" + d.capa + (d.mascota ? ".mascota" : "") + (d.portatil ? ".portatil" : "") + (d.pixel ? ".ya-pixel" : ""), { dataset: { id: o.id }, role: d.al || d.lugares || d.portatil ? "button" : null, "aria-label": d.n, style: { width: d.w + "px", height: d.h + "px" } });
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
    // (Fase 64) Girado: se ve desde ese ángulo (se prepara un ratito; mientras, el dibujo de siempre).
    const g = this._girable(r.d) ? giroDe(o) : 0, t = (r._tg = (r._tg || 0) + 1);
    if (!g || !r.vg) { arte.innerHTML = r.d.arte(o.e || {}, C); r.n.classList.remove("plana"); if (r.vg) { r.vg = null; this._colocar(r); } this._reponer3d(r); }
    // (Fase 67) De frente también es pixel de verdad: la imagen en cuadritos abajo y el dibujo encima con lo quieto
    // transparente (así se sigue tocando donde tiene forma y lo que se mueve se sigue moviendo).
    if (!g && !r.d.mascota) vistaPlana(r.d, o.e, C).then((v) => {
      if (r._tg !== t || !r.n.isConnected || !v || r.n.classList.contains("plana")) return;
      if (!arte.querySelector(":scope > svg")) return;
      arte.insertAdjacentHTML("afterbegin", `<img class="ca-plana" alt="" draggable="false" src="${v.url}" style="width:${v.w}px;height:${v.h}px">`);
      r.n.classList.add("plana");
    });
    r.n.classList.toggle("girado", !!g);
    // (Fase 66) Su sombrita en pixel, del ancho de su base (girado, la sombra ya viene dibujada con su vista).
    if (r.d.capa === "piso") { try { const c = (r.d.w * 0.84) / 4; r.n.style.setProperty("--sombra", sombraPx(c).url); r.n.style.setProperty("--sombra-sol", sombraPx(c, true).url); } catch (e) { /* nada */ } }
    // (Fase 65) Lo largo (la escoba) se dibuja recargado o acostado, girando sobre su base.
    // (Fase 68) Y lo que se cayó de lado (una silla, una lámpara, un jarrón) también: se acuesta sobre su orilla.
    const pose = r.d.larga || r.d.capa === "piso" ? o.e?.pose || "" : "";
    r.n.classList.toggle("recargada", !!pose); r.n.classList.toggle("en-suelo", pose === "suelo"); r.n.classList.toggle("hacia-izq", pose === "suelo" && +o.e.ang < 0);
    r.n.classList.toggle("tumbado", pose === "suelo" && !r.d.larga);
    if (pose) r.n.style.setProperty("--ang", (+o.e.ang || 0) + "deg"); else r.n.style.removeProperty("--ang");
    if (r.fr) { r.fr.innerHTML = `<div class="ca-obj-arte">${r.d.frente(o.e || {}, C)}</div>`; r.fr.hidden = !!g; }
    if (r.d.guarda) this._pintarGuardado(r);
    if (g) vistaGirada(r.d, o.e, C, g).then((v) => {
      if (r._tg !== t || !r.n.isConnected) return;
      // (Fase 65) Lo que se mueve casi entero no se gira: se queda de frente, con todas sus animaciones.
      if (!v || v.plano) { arte.innerHTML = r.d.arte(o.e || {}, C); r.vg = null; r.n.classList.remove("girado"); if (v?.plano && this.sel === r) aviso("Esta cosa se mueve toda: se queda de frente para no perder su animación", 2600); this._colocar(r); this._reponer3d(r); return; }
      r.vg = v;
      // El cuerpo girado (pixel) y, encima, sus partes vivas (con sus animaciones) alineadas con el frente girado.
      const m = v.matriz.map((x) => +x.toFixed(4));
      arte.innerHTML = `<img class="ca-girado" alt="" draggable="false" src="${v.url}">` + (v.vivo ? `<div class="ca-vivo${v.frente ? "" : " tras"}" style="width:${r.d.w}px;height:${r.d.h}px;transform:matrix(${m.join(",")})">${v.vivo}</div>` : "");
      if (this.arrastrandoId !== r.o.id) this._colocar(r);
      this._reponer3d(r);
    });
  }
  /** (Fase 64) Lo que se puede girar: lo del piso (las mascotas no, ellas solitas se voltean). */
  _girable(d) { return d.capa === "piso" && !d.mascota && !d.noGira && d.k !== "cosita"; }
  /** (Fase 64) Qué herramienta de limpieza trae tu monito (barrer, trapear, aspirar, sacudir, regar) o "". */
  herramienta() { return COSAS_MANO[this.yo.lleva]?.herramienta || ""; }
  /** Limpiar donde está tu monito con lo que trae (las hojitas, el polvito): unos segunditos barriendo y listo. */
  async _limpiar() {
    const m = this.yo, k = m.lleva, h = this.herramienta(), c = enCuarto(m.gx).c, cu = cuarto(c);
    if (!this.vivo || !["barrer", "trapear", "aspirar"].includes(h)) return;
    if (h !== "barrer" && cu.afuera) { this._globo(m, h === "aspirar" ? "La aspiradora es para adentro de la casa" : "El trapeador es para adentro de la casa", 2400); this.sonar("nop"); return; }
    const orden = m.orden;
    m.n.classList.add("limpiando", "l-" + h);
    this.sonar(h === "aspirar" ? "viento" : h === "trapear" ? "burbujas" : "hojas", { volumen: 0.7 });
    for (let i = 0; i < 3; i++) setTimeout(() => this.vivo && this.particulas(h === "trapear" ? "burbuja" : "polvo", { gx: m.gx + 26 * m.mira, y: m.y - 4 }, 0, 0, 3), i * 420);
    this._mandarYo({ ev: { k: "limpia", t: h } });
    await this.esperar(1400);
    m.n.classList.remove("limpiando", "l-" + h);
    if (m.orden !== orden || m.lleva !== k) return;
    const n = this.suciedad.limpiar(c, m.gx, m.y, h === "aspirar" ? 130 : 100);
    if (n) { this.particulas("brillo", { gx: m.gx, y: m.y - 30 }, 0, 0, 5); this.necesidades?.sumar("diversion", 2); this.sonar("ding", { volumen: 0.5 }); }
    this._globo(m, n ? (n > 3 ? "¡Quedó rechinando de limpio!" : "Listo, ya está limpiecito") : cu.afuera ? "Aquí no hay hojitas" : "Aquí no hay polvito", 2200);
  }
  /** Sacudirle el polvo a un mueble con el plumero. */
  async _sacudirObj(r) {
    if (!(await this.irJunto({ id: r.o.id }))) return;
    const m = this.yo;
    m.n.classList.add("limpiando", "l-sacudir"); r.n.classList.add("reluce");
    this.sonar("hojas", { volumen: 0.6 }); this.particulas("polvo", { gx: r.gx, y: r.o.y - r.d.h * 0.6 }, 0, 0, 5);
    await this.esperar(1200);
    m.n.classList.remove("limpiando", "l-sacudir"); setTimeout(() => r.n.classList.remove("reluce"), 1800);
    this.particulas("brillo", { gx: r.gx, y: r.o.y - r.d.h * 0.7 }, 0, 0, 5);
    this.suciedad.limpiar(r.o.c, r.gx, r.o.y + 10, 90);
    this._globo(m, "¡Sin polvito!", 1800); this.necesidades?.sumar("diversion", 1);
  }
  /** Regar una planta (las flores crecen). */
  async _regarObj(r) {
    if (!(await this.irJunto({ id: r.o.id }))) return;
    ACCIONES.regar(this, { ...r.o, def: r.d, gx: r.gx }, r.n);
    this.yo.n.classList.add("limpiando", "l-regar"); setTimeout(() => this.yo.n.classList.remove("limpiando", "l-regar"), 1200);
    this.necesidades?.sumar("diversion", 1);
  }
  _colocar(r) {
    const { o, d } = r, gx = global(o.c, o.x);
    r.gx = gx;
    let z = d.capa === "alfombra" ? 3 : enPared(o, d) ? 10 + Math.round(o.y / 60) : Math.round(o.y);
    if (d.mascota) z = zMascota(o.y);
    // (Encima de un mueble: justo enfrente de él.)
    else if (puedeSubir(d)) { const a = this._encima(gx, o.y, o.id); if (a) z = (parseInt(a.r.n.style.zIndex, 10) || 0) + 1; }
    r.n.style.zIndex = z;
    if (r.fr) r.fr.style.zIndex = z + 2;
    this._ponerObj(r, gx, o.y);
  }
  /** (Fase 61) Dibuja una cosa en (gx, y) con la perspectiva de la cajita: más al fondo, más chiquita y hacia el centro.
   *  (Lo de la pared, en la pared de atrás; lo que está encima de un mueble, a la hondura de ese mueble.) */
  _ponerObj(r, gx, y, prof = null) {
    const { o, d } = r;
    const pared = enPared(o, d) && !(prof != null && prof > PISO);
    if (prof == null) prof = pared ? PISO : (puedeSubir(d) && this._encima(gx, y, o.id)?.r.o.y) || y;
    const P = proyectar(gx, Math.max(PISO, Math.min(H, prof))), s = P.s, yv = pared ? y : prof - (prof - y) * s;
    r.v = { x: P.x, y: yv, s };
    for (const n of [r.n, r.fr]) {
      if (!n) continue;
      if (r.vg && n === r.n) {
        // (Fase 64) Girado: del tamaño de su vista, anclado al centro de su base (gira en su lugar).
        const ya = yv - (hondura(d) * ELEV_GIRO * s) / 2;
        Object.assign(n.style, { left: (P.x - r.vg.ax).toFixed(1) + "px", top: (ya - r.vg.ay).toFixed(1) + "px", width: r.vg.w + "px", height: r.vg.h + "px", transformOrigin: `${r.vg.ax.toFixed(1)}px ${r.vg.ay.toFixed(1)}px` });
        // (Fase 65) Volteado: se voltea sobre el centro de su base, no sobre el centro de la vista.
        n.style.setProperty("--ax", r.vg.ax.toFixed(1) + "px");
      } else {
        n.style.left = (P.x - d.w / 2).toFixed(1) + "px"; n.style.top = (yv - d.h).toFixed(1) + "px";
        if (n === r.n && n.style.transformOrigin) { Object.assign(n.style, { width: d.w + "px", height: d.h + "px", transformOrigin: "" }); n.style.removeProperty("--ax"); }
      }
      if (s < 0.999) n.style.setProperty("--s3", s.toFixed(3)); else n.style.removeProperty("--s3");
      n.classList.toggle("f", !!o.f);
    }
    if (r.glow) {
      const b = d.brilla, x = P.x + ((o.f ? d.w - b.x : b.x) - d.w / 2) * s, yy = yv - (d.h - b.y) * s;
      r.glow.style.left = (x - b.r).toFixed(1) + "px"; r.glow.style.top = (yy - b.r).toFixed(1) + "px";
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
      if (r.o.id === sinId || (r.d.tope == null && !r.d.topes) || Math.abs(gx - r.gx) > r.d.w / 2 - 4) continue;
      // (Fase 68) Un estante tiene varios niveles: se queda en el de abajo de donde lo sueltas.
      for (const t of r.d.topes || [r.d.tope]) {
        const tope = r.o.y - r.d.h + t;
        if (tope < y - 16) continue;
        if (!mejor || tope < mejor.y) mejor = { y: tope, r };
      }
    }
    return mejor;
  }
  /** Física de juguete: cae desde `alto` (con su rebotito, polvito y sonido al tocar). */
  _caer(r, alto, golpe = 0, luego = null) {
    if (reducido() || Math.abs(alto) < 6) { luego?.(); return; }
    const t = Math.min(760, 260 + Math.sqrt(Math.abs(alto)) * 26);
    // (Fase 64) Al pegar en el piso: si se dañó, tiembla, suena y suelta astillitas.
    if (golpe) setTimeout(() => { if (!this.vivo) return; r.n.classList.remove("crac"); void r.n.offsetWidth; r.n.classList.add("crac"); setTimeout(() => r.n.classList.remove("crac"), 420); this.particulas("migaja", { gx: r.gx, y: r.o.y - 8 }, 0, 0, 3 + golpe * 2); this.sonar(golpe >= 2 ? "poof" : "nop", { volumen: 0.8 }); vibrar(golpe * 12); if (golpe === 1) aviso("Se despostilló un poquito", 1800); else if (golpe === 2) aviso("Se rompió: se queda de adorno (lo puedes arreglar)", 2600); }, t * 0.62);
    if (luego) setTimeout(() => this.vivo && luego(), t * 0.66);
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
    // (Fase 68) Lo colgado puede quedar chueco (después de un golpe en la pared).
    if (+e.chueco) n.style.setProperty("--chueco", +e.chueco + "deg"); else n.style.removeProperty("--chueco");
    if (r.d.luz) n.classList.toggle("apagada", apagado);
    if (e.receta && RECETAS[e.receta]) n.style.setProperty("--comida", RECETAS[e.receta].color);
    if (r.d.superficie) pintarPlatos(r);
    if (r.d.guarda) this._pintarGuardado(r);
    if (r.glow) {
      const b = r.d.brilla, p = b.propio;
      const on = (e.dano | 0) < 2 && (b.siempre ? true : p ? (p[0] === "!" ? !e[p.slice(1)] : !!e[p]) : !apagado);
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
    try { this.luces?.pintar(); } catch (e) { /* nada */ }   // (las sombras del sol se van si se nubla)
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
    for (const mm of [this.yo, this.suyo]) this._sombra(mm);
    this.raiz?.classList.toggle("es-noche", noche);
    for (const r of this.objs.values()) if (r.d.k === "reloj") this._ponerReloj(r.n);
    this._pintarFondos();
    try { this.luces?.pintar(); } catch (e) { /* nada */ }
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
    n.style.left = proyectar(gx, SUELO).x.toFixed(1) + "px";
    return { quien, n, caja, cuerpo, llevaN, globo, globos, nombreN, gx, y: SUELO, prof: SUELO, ropa: { ...ropa }, accion: "", mueble: "", lleva: "", mira: 1, orden: 0, t: 0, evAt: 0, dt: 0 };
  }
  _vestirMono(m, ropa) { m.ropa = { ...m.ropa, ...ropa }; m.cuerpo.innerHTML = monitoSVG(m.ropa); if (m.lleva) this._ponerLleva(m, m.lleva); if (m._3d) this._sentar3d(m, m._3d.r, m._3d.jx, true); }
  /** 2.5D: más atrás (y chica) se ve un poquito más chiquito; adelante, normal. */
  _prof(m, y = m.y, gx = m.gx) {
    const c = enCuarto(gx).c;
    m.n.style.setProperty("--prof", (cuarto(c).afuera ? 0.9 + 0.1 * lim((y - FONDO) / (FRENTE - FONDO), 0, 1) : escala3d(c, y)).toFixed(3));
  }
  /** (Fase 61) Pone al monito donde se ve: (gx, y) en el mundo, prof = lo hondo del piso donde está parado (o su mueble). */
  _ponerMono(m, gx = m.gx, y = m.y, prof = y) {
    const v = this._vista(gx, y, lim(prof, PISO, H));
    m.n.style.left = v.x.toFixed(1) + "px"; m.n.style.top = v.y.toFixed(1) + "px";
    m.prof = prof; this._prof(m, prof, gx);
  }
  /** Voltear: al instante, con un saltito (antes giraba como hoja de papel). */
  _mirar(m, lado) {
    const antes = m.mira;
    m.mira = lado < 0 ? -1 : 1; m.n.classList.toggle("izq", m.mira < 0);
    if (antes !== m.mira) this._sombra(m);
    if (antes !== m.mira && !reducido() && nivel(this.gfx) >= 1) m.caja.animate([{ translate: "0 0" }, { translate: "0 -3px" }, { translate: "0 0" }], { duration: 150, easing: "ease-out" });
  }
  _visible(m, dentro = 0) {
    if (enCuarto(m.gx).c !== this.vistaCuarto) return false;
    const v = this.vistaN, px = (m.gx - inicioDe(this.vistaCuarto)) * this.k, mx = dentro ? v.clientWidth * dentro : -40;
    if (px < v.scrollLeft + mx || px > v.scrollLeft + v.clientWidth - mx) return false;
    if (!cuarto(this.vistaCuarto).mapa) return true;
    const py = (m.y + MAPA.arriba) * this.k, my = dentro ? v.clientHeight * dentro : -40;
    return py > v.scrollTop + my && py - 140 * this.k < v.scrollTop + v.clientHeight - my;
  }
  /** Caminar hasta (gx, y) (y es lo hondo del piso) y luego `luego()`. */
  _caminar(m, gx, y, luego = null, ya = false, tramo = false, viaje = null, ultimo = true) {
    clearTimeout(m.tc); clearInterval(m.tp); clearTimeout(m.tGiro);
    // (Fase 65) Si estaba sentado, primero baja del asiento por el lado por donde llegó (no lo atraviesa).
    if (m.mueble && m._lugarDe && !ya && !tramo) { m.gx = m._lugarDe.lx; m.y = m._lugarDe.ly; }
    if (!tramo) m._lugarDe = m.mueble ? m._lugarDe : null;
    this._pose(m, "");
    m.n.classList.remove("entra");
    gx = lim(gx, 24, ANCHO - 24); y = lim(y, FONDO, frenteDe(enCuarto(gx).c));
    const ci = enCuarto(m.gx).c, cf = enCuarto(gx).c;
    if (!tramo && !ya) {
      m.tkPuerta = (m.tkPuerta || 0) + 1; m._cruzando = false;   // (si iba cruzando una puerta, se cancela)
      // (Todo el viaje decide una vez si va corriendo: no cambia de caminar a correr en cada tramo.)
      // (Fase 68) Sólo trota en los viajes largos de verdad (cambiar de cuarto ya no lo hace correr).
      if (!viaje) { viaje = { corre: !!m._trote || Math.hypot(gx - m.gx, (y - m.y) * 1.6) > TROTE_DESDE, pasos: 0, embiste: !!m._embiste }; m.meta = { gx, y }; m._trote = false; m._embiste = false; }
      viaje.pasos++;
      // (Fase 63) A otro cuarto: camina a la primera puerta del camino, la cruza y del otro lado sigue.
      if (ci !== cf) {
        m._enRuta = true;   // (a tu amorcito le llega a DÓNDE vas, no la puerta por la que pasas)
        const p = viaje.pasos <= 10 ? this.puertasN.siguiente(ci, cf) : null;
        if (p) return this._caminarAPuerta(m, p, () => this._caminar(m, gx, y, luego, false, false, viaje), viaje);
        return this._caminar(m, gx, y, luego, true, false, viaje);   // (no hay puerta hacia allá: aparece de una vez)
      }
      // (Fase 63) En el mismo cuarto: la ruta que rodea los muebles (nunca los atraviesa ni se sube), tramo por tramo.
      const ruta = this.nav.ruta(ci, m.gx, m.y, gx, y);
      // (Fase 68) Cuándo llega al final de TODO el camino (no sólo del primer tramo): así lo que hace al llegar (empujar
      // el columpio, abrazar…) se ve a su tiempo en el teléfono de tu amorcito.
      {
        const v0 = (this.traes?.activo ? VEL_TRAES : viaje.corre ? VEL_TROTE : VEL_PASO) * (!this.traes?.activo && m.n.classList.contains("n-sueno") ? 0.7 : 1);
        let tot = 0, px = m.gx, py = m.y;
        for (const [rx, ry] of ruta.length ? ruta : [[gx, y]]) { tot += Math.max(0.18, Math.hypot(rx - px, (ry - py) * 1.6) / v0) + 0.03; px = rx; py = ry; }
        m.llegaFin = performance.now() + (tot + 56 / v0) * 1000;
      }
      if (ruta.length > 1) {
        m._enRuta = true;
        const ir = (i) => { const fin = i === ruta.length - 1; this._caminar(m, ruta[i][0], ruta[i][1], fin ? () => { m._enRuta = false; luego?.(); } : () => ir(i + 1), false, true, viaje, fin); };
        return ir(0);
      }
      [gx, y] = ruta[0] || [gx, y];
      m._enRuta = false;
    }
    if (ya && m === this.yo && cf !== this.vistaCuarto) this._mostrarCuarto(cf, gx);
    // (Al caminar se sueltan los gestos y lo que hacía con las manos: así los brazos nunca se quedan en un loop raro.)
    this._limpiarGestos(m); clearTimeout(m.ttoca);
    const dx = gx - m.gx, dy = y - m.y, d = Math.hypot(dx, dy * 1.6);
    // (Fase 63) De lado si va más de lado; hacia el fondo, de espaldas; hacia ti, de frente.
    const deLado = Math.abs(dx) >= Math.abs(dy) * 1.1, atras = !deLado && dy < -2;
    if (deLado && Math.abs(dx) > 2) this._mirar(m, dx);
    // (Cerquita camina; lejos, corre. Jugando a las traes, los dos igual de rápido. Con sueño, más lento.)
    // (Fase 68) A paso de verdad: caminando siempre igual (no más rápido mientras más lejos) y, en los viajes largos,
    // un trotecito; nunca a toda velocidad. Así el jardín se siente grande.
    const corre = !this.traes?.activo && (viaje ? viaje.corre : d > TROTE_DESDE);
    const lento = !this.traes?.activo && m.n.classList.contains("n-sueno") ? 0.7 : 1;
    const vel = (this.traes?.activo ? VEL_TRAES : corre ? VEL_TROTE : VEL_PASO) * lento;
    // (Fase 68) Frenar de verdad: llega a su paso parejo y sólo en los últimos pasitos frena suave (antes la curva de
    // frenado aceleraba a la mitad para llegar a tiempo y se veía un jaloncito).
    if (ultimo && !ya && !reducido() && !this.traes?.activo && d > 96) {
      const q = 56 / d, px = gx - (gx - m.gx) * q, py = y - (y - m.y) * q;
      return this._caminar(m, px, py, () => this._caminar(m, gx, y, luego, false, true, viaje, true), false, true, viaje, false);
    }
    const frena = ultimo && !ya && !reducido() && d > 8;
    const s = ya || reducido() ? 0 : frena ? Math.max(0.3, (2 * d) / vel) : Math.max(0.18, d / vel);
    m.n.classList.toggle("corre", corre && s > 0.2);
    m.n.style.transitionDuration = s + "s";
    m.n.style.transitionTimingFunction = frena ? "cubic-bezier(.33, .67, .67, 1)" : "linear";
    m.n.style.zIndex = zMono(Math.max(m.y, y));
    // (Fase 68) Lo chiquito del piso por donde pasa se patea.
    if (m === this.yo && s > 0.15 && !ya) this.fisica?.tramo(m, m.gx, m.y, gx, y, s, corre);
    this._ponerMono(m, gx, y);
    m.gx = gx; m.y = y;
    m.llega = performance.now() + s * 1000;
    if (ultimo) m.llegaFin = m.llega;
    m.n.classList.toggle("lado", s > 0.2 && deLado);
    m.n.classList.toggle("atras", s > 0.2 && atras);
    if (s > 0.2) {
      // (Fase 64) Al arrancar, un apachurradito de impulso (sin brincos).
      if (!m.n.classList.contains("camina") && !reducido() && nivel(this.gfx) >= 1) m.caja.animate([{ scale: "1 1" }, { scale: "1.05 .94", offset: 0.45 }, { scale: "1 1" }], { duration: 200, easing: "ease-out" });
      m.n.classList.add("camina");
      if (m.quien === "yo" || this._visible(m)) { let i = 0; clearInterval(m.tp); m.tp = setInterval(() => this.sonar(i++ % 2 ? "paso" : "paso2", { volumen: m.quien === "yo" ? 0.9 : 0.5 }), corre ? 300 : 400); }
    }
    m.tc = setTimeout(() => {
      const iba = m.n.classList.contains("camina");
      clearInterval(m.tp); m.n.style.zIndex = zMono(y);
      if (ultimo) {
        m.n.classList.remove("camina", "corre");
        // Al llegar: un rebotito de frenar y, tantito después, voltea suave a verte de frente.
        if (iba && !reducido()) { m.n.classList.remove("llega"); void m.n.offsetWidth; m.n.classList.add("llega"); setTimeout(() => m.n.classList.remove("llega"), 380); }
        m.tGiro = setTimeout(() => this._orientar(m, "frente"), 160);
        if (m.quien === "yo") this._flechaN?.classList.remove("ver");
        // (Fase 68) Si iba corriendo contra la pared: ¡pum!; si hay vidrios cerquita, avisa.
        if (m === this.yo) this.fisica?.llegar(m, !!viaje?.embiste && corre && iba);
      }
      this._sombra(m);
      luego?.();
    }, s * 1000 + 30);
    if (m.quien === "yo" && !ya) this._seguir(gx);
  }
  /** (Fase 63) Voltear con un giro suavecito (no de golpe): de frente, de espaldas o de lado. */
  _orientar(m, hacia) {
    clearTimeout(m.tGiro);
    const antes = m.n.classList.contains("atras") ? "atras" : m.n.classList.contains("lado") ? "lado" : "frente";
    if (antes === hacia) return;
    m.n.classList.toggle("atras", hacia === "atras"); m.n.classList.toggle("lado", hacia === "lado");
    if (!reducido() && nivel(this.gfx) >= 1) m.caja.animate([{ scale: "0.86 1" }, { scale: "1 1" }], { duration: 170, easing: "cubic-bezier(.3,.8,.4,1)" });
  }
  /** Lo que está encima de una mesa (no estorba en el piso). */
  _esEncima(r) { return puedeSubir(r.d) && !!this._encima(r.gx, r.o.y, r.o.id); }
  _pose(m, pose, mueble = "", z = null) {
    if (m._3d && (pose !== m.accion || mueble !== m.mueble)) this._quitar3d(m, !!pose === false);
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
    // (Fase 64) Si la cosa está girada, el asiento gira con ella y el monito mira hacia donde mira el mueble.
    // (Fase 65) Llega por el lado hacia donde mira el asiento, se voltea de espaldas a él y se sienta (bajando, con su
    // apachurradito); con más estatura, la cadera queda igual en el asiento y las piernas cuelgan más.
    const sx = r.o.f ? -1 : 1, G = lugarGirado(l, this._girable(r.d) ? giroDe(r.o) : 0, sx), gx = r.gx + G.dx;
    const esc = cuarto(r.o.c).afuera ? 1 : escala3d(r.o.c, r.o.y), ySit = r.o.y + G.dy + ((m.alto || 1) - 1) * 47 * esc;
    const sienta = l.pose === "sentado", orden = ++m.orden;
    const [lx, ly] = this.nav.libre(r.o.c, gx + (sienta ? G.llega[0] : 0), lim(r.o.y + (sienta ? G.llega[1] : 22), FONDO, frenteDe(r.o.c)));
    return new Promise((ok) => {
      this._caminar(m, lx, ly, () => {
        if (m.orden !== orden || !this.vivo || !this.objs.has(r.o.id)) return ok(false);
        clearTimeout(m.tGiro);
        // (Fase 65) Con la escoba en la mano no se sienta nadie: la deja recargada junto (y luego la vuelve a agarrar).
        if (m === this.yo && !ya && COSAS_MANO[m.lleva]?.larga && l.pose !== "cocinando") this.soltar(false, r);
        m._lugarDe = { lx, ly };
        m.n.classList.toggle("atras", sienta && G.cara === "atras"); m.n.classList.toggle("lado", sienta && (G.cara === "der" || G.cara === "izq"));
        if (G.mira) this._mirar(m, G.mira);
        // (Fase 66) Cocinando en una estufa girada: de cara a la estufa (de lado, o del otro lado viéndote a ti).
        if (l.pose === "cocinando" && G.cara !== "frente") { m.n.classList.toggle("lado", G.cara !== "atras"); if (G.cara !== "atras") this._mirar(m, G.cara === "der" ? -1 : 1); }
        m.n.style.transitionDuration = ya || reducido() ? "0s" : ".42s";
        if (!ya && !reducido() && sienta) { m.n.classList.remove("sentandose"); void m.n.offsetWidth; m.n.classList.add("sentandose"); setTimeout(() => m.n.classList.remove("sentandose"), 500); }
        m.y = ySit; this._ponerMono(m, gx, ySit, r.o.y);
        const zo = parseInt(r.n.style.zIndex, 10) || 0, z = (sienta || l.pose === "cocinando") && G.cara === "atras" ? zo - 1 : sienta && G.cara !== "frente" ? zo + 1 : l.z != null ? zo + l.z : Math.round(ySit);
        this._pose(m, l.pose, `${r.o.id}:${jx}`, z);
        // (Fase 66) Sentado, acostado, en la tina o en el columpio: el monito de bulto, adentro del mueble.
        if (POSE_3D.has(l.pose)) this._sentar3d(m, r, jx, ya);
        ok(true);
      }, ya);
    });
  }
  /* ── (Fase 66) El monito de bulto (monito3d.js): se sienta, se acuesta o se baña en el mueble, con el ángulo del
     mueble, y va ADENTRO de su dibujo (lo de enfrente del mueble lo tapa pixel por pixel). Al llegar, unos cuadritos
     de transición (se agacha y se sienta; se sienta en la orilla y se acuesta); al pararse, al revés. ── */
  async _sentar3d(m, r, jx, ya = false) {
    const l = r.d.lugares?.[jx], tk = (m._t3 = (m._t3 || 0) + 1), clave = `${r.o.id}:${jx}`;
    if (!l) return;
    try {
      const g = this._girable(r.d) ? giroDe(r.o) : 0;
      const [M, vg] = await Promise.all([modelo3d(m.ropa), vistaGirada(r.d, r.o.e, colorDe(r.d, r.o.e), g)]);
      if (m._t3 !== tk || m.mueble !== clave || !this.objs.has(r.o.id) || !this.vivo) return;
      const v = vg && !vg.plano ? vg : null, cel = CEL3D * (m.alto || 1), L = lugar3d(M, r.d, l, jx, v, cel);
      m._3d = { r, jx, M, v, g, cel, L, clave: JSON.stringify(m.ropa) + (m.alto || 1) };
      m.n.classList.add("en3d");
      const cuadros = [];
      if (!ya && !reducido()) {
        const [x, y, z] = L.ancla;
        if (l.pose === "dormido") {
          // Se sienta en la orilla de enfrente y se va acostando de ladito.
          const yS = y + (M.medio - 2.4) * cel - 1.4 * cel, zS = -((v?.D ?? 20) * 4) / 2 + 3 * cel;
          cuadros.push([POSES3D.sentado, [x, yS, zS], "cadera"], [{ ...POSES3D.medio, rodar: L.pose.rodar / 2 }, [x, (y + yS) / 2, (z + zS) / 2], "centro"]);
        } else {
          // (Fase 67) Más cuadritos: se agacha, va bajando y se acomoda.
          const mitad = Object.fromEntries(Object.keys(L.pose).map((k) => [k, POSES3D.agachado[k] + (L.pose[k] - POSES3D.agachado[k]) * 0.55]));
          cuadros.push([POSES3D.agachado, [x, y - 4 * cel, z - 4 * cel], "cadera"], [mitad, [x, y - 1.8 * cel, z - 1.8 * cel], "cadera"]);
        }
      }
      cuadros.push([L.pose, L.ancla, L.ancla3d]);
      for (let i = 0; i < cuadros.length; i++) {
        if (i) { await this.esperar(105); if (m._t3 !== tk || m.mueble !== clave) return; }
        this._cuadro3d(m, ...cuadros[i]);
      }
      this._parpadeo3d(m, tk);
    } catch (e) { if (m._t3 === tk) { m.n.classList.remove("en3d"); m._3d = null; m._img3d?.remove(); } }
  }
  /** Un cuadrito del monito de bulto en su mueble. */
  _cuadro3d(m, pose, ancla, ancla3d) {
    const S = m._3d;
    if (!S) return;
    const { r, M, v, g, cel, L } = S, d = r.d;
    m._3dUlt = [pose, ancla, ancla3d];
    // La carita: dormido con los ojitos cerrados; en la tina y el columpio, feliz; si no, la de siempre (o la que toque
    // ahorita: un parpadeo, una sonrisa).
    const cara = m._cara3d || (m.accion === "dormido" ? "dormido" : m.accion === "banando" || m.accion === "columpio" ? "feliz" : "normal");
    const im = pintar3d(M, pose, { clave: S.clave, g, yaw: L.yaw, ancla, ancla3d, cel, vg: v, cara });
    const arte = r.n.querySelector(":scope > .ca-obj-arte");
    if (!arte) return;
    let n = m._img3d;
    if (!n) n = m._img3d = el("img.ca-mono-3d", { alt: "", draggable: "false", "aria-hidden": "true" });
    if (n.parentNode !== arte) arte.append(n);
    // De la vista del mueble (girada, o el dibujo de siempre) a la cajita del dibujo.
    const left = r.vg ? im.x + r.vg.ax : im.x + d.w / 2, top = r.vg ? im.y - r.vg.H * 4 + r.vg.ay : im.y - (v ? v.H * 4 : d.h) + d.h - (hondura(d) * ELEV_GIRO) / 2;
    n.src = im.url;
    Object.assign(n.style, { left: left.toFixed(1) + "px", top: top.toFixed(1) + "px", width: im.w.toFixed(1) + "px", height: im.h.toFixed(1) + "px" });
    n.dataset.z = ancla[2].toFixed(1);
    // (Dos en el mismo mueble: el de más adelante va encima.)
    const otros = [...arte.querySelectorAll(":scope > .ca-mono-3d")];
    if (otros.length > 1) otros.sort((a, b) => +b.dataset.z - +a.dataset.z).forEach((x) => arte.append(x));
  }
  /** (Fase 67) Sentado parpadea cada ratito, y si su amorcito está cerquita a veces le sonríe. */
  _parpadeo3d(m, tk) {
    clearTimeout(m._tParp);
    m._tParp = setTimeout(() => {
      if (!this.vivo || m._t3 !== tk || !m._3d || !m._3dUlt || m.accion === "dormido") return;
      const otro = m === this.yo ? this.suyo : this.yo, cerca = otro && Math.hypot(otro.gx - m.gx, (otro.y - m.y) * 1.6) < 170;
      const sonrie = cerca && Math.random() < 0.35;
      m._cara3d = sonrie ? "feliz" : "dormido"; this._cuadro3d(m, ...m._3dUlt);
      setTimeout(() => { if (m._t3 !== tk || !m._3d) return; m._cara3d = null; this._cuadro3d(m, ...m._3dUlt); this._parpadeo3d(m, tk); }, sonrie ? 1600 : 140);
    }, 2400 + Math.random() * 3200);
  }
  /** Quitar el monito de bulto (al pararse: un cuadrito agachándose y vuelve el de siempre). */
  _quitar3d(m, animar = true) {
    const S = m._3d, n = m._img3d;
    m._3d = null; m._t3 = (m._t3 || 0) + 1; clearTimeout(m._tParp); m._cara3d = null;
    const fin = () => { n?.remove(); if (!m._3d) m.n.classList.remove("en3d"); };
    if (!S || !n || !animar || reducido() || !n.isConnected) { fin(); return; }
    const [x, y, z] = S.L.ancla;
    m._3d = S; this._cuadro3d(m, S.L.ancla3d === "centro" ? { ...POSES3D.sentado } : POSES3D.agachado, S.L.ancla3d === "centro" ? [x, y, z] : [x, y - 4 * S.cel, z - 4 * S.cel], "cadera"); m._3d = null;
    setTimeout(fin, 140);
  }
  /** Al redibujar un mueble (se giró, se movió, cambió de color): sus monitos de bulto vuelven a su lugar. */
  _reponer3d(r) {
    for (const m of [this.yo, this.suyo]) if (m?._3d?.r === r || (m?._3d && m._3d.r.o.id === r.o.id)) { m._3d.r = r; this._sentar3d(m, r, m._3d.jx, true); }
  }
  _posYo() { const m = this.yo, gx = m._enRuta ? m.meta.gx : m.gx, y = m._enRuta ? m.meta.y : m.y, { c, x } = enCuarto(gx); return { c, x: Math.round(x), y: Math.round(y), mira: m.mira }; }
  _mandarYo(d = {}) { this.sync?.yo({ ...this._posYo(), accion: this.yo.accion, mueble: this.yo.mueble, ...d }); }

  // ── Lo que usan las acciones (acciones.js) ──
  sonar(n, op) { this.son.sonar(n, op); }
  esperar(ms) { return new Promise((r) => setTimeout(r, ms)); }
  sigueEn(o) { return this.yo.mueble.startsWith(o.id + ":"); }
  /** ¿Ese lugar lo tiene (o va hacia él) ese monito? (Lo de tu amorcito llega antes de que termine de caminar.) */
  ocupado(m, lugar) { return m.mueble === lugar || m.destino === lugar; }
  async usarLugar(o, jx = null) {
    { const r0 = this.objs.get(o.id); if (r0 && r0.o.e?.pose === "suelo" && this.fisica) return this.fisica.levantar(r0); }
    const r = this.objs.get(o.id);
    if (!r?.d.lugares) return false;
    if (this.sigueEn(o) && jx == null) { this.pararse(); return false; }
    const libres = r.d.lugares.map((_, i) => i).filter((i) => !this.ocupado(this.suyo, `${o.id}:${i}`));
    const j = jx != null && libres.includes(jx) ? jx : libres[0];
    if (j == null) { this.decir("Ya está ocupado", false); this.sonar("nop"); return false; }
    const l = r.d.lugares[j], sx = r.o.f ? -1 : 1, G = lugarGirado(l, this._girable(r.d) ? giroDe(r.o) : 0, sx);
    const { c, x } = enCuarto(r.gx + G.dx);
    this.sync.yo({ c, x: Math.round(x), y: Math.round(r.o.y + G.dy), mira: G.mira || this.yo.mira, accion: l.pose, mueble: `${o.id}:${j}` });
    const ok = await this._irLugar(this.yo, r, j);
    if (ok && l.pose === "columpio") setTimeout(() => this.vivo && this.sigueEn(o) && this._globo(this.yo, `Pídele a ${this.pareja} que te empuje`, 4600), 400);
    if (ok) { vibrar(8); this.sonar({ dormido: "dormir", banando: "burbujas", columpio: "whoosh" }[l.pose] || "sentar"); if (l.pose === "banando") this.particulas("burbuja", { gx: this.yo.gx, y: this.yo.y - 60 }, 0, 0, 5); }
    return ok;
  }
  pararse() {
    const m = this.yo;
    if (!m.mueble) return;
    const r = this.objs.get(m.mueble.split(":")[0]);
    // (Fase 65) Se levanta estirándose y baja del asiento por el lado por donde llegó (sin atravesar el mueble).
    const L = m._lugarDe || { lx: m.gx, ly: lim((r?.o.y ?? m.y) + 26, FONDO, frenteDe(enCuarto(m.gx).c)) };
    this._pose(m, ""); clearTimeout(m.tc); m.orden++;
    if (!reducido()) { m.n.classList.remove("levantandose"); void m.n.offsetWidth; m.n.classList.add("levantandose"); setTimeout(() => m.n.classList.remove("levantandose"), 420); }
    m.n.style.transitionDuration = reducido() ? "0s" : ".36s"; m.n.style.transitionTimingFunction = "ease-out";
    m.gx = L.lx; m.y = L.ly; this._ponerMono(m, L.lx, L.ly); m.n.style.zIndex = zMono(L.ly);
    m._lugarDe = null;
    m.tGiro = setTimeout(() => this._orientar(m, "frente"), 380);
    this._mandarYo({ accion: "", mueble: "" });
  }
  /* ── (Fase 65) La estatura de cada monito: se guarda en la casa (la eligen los dos) y lo hace más alto o más bajito
     parejo (cabeza, cuerpo, brazos y piernas en su proporción); al sentarse, la cadera queda en el asiento. ── */
  _claveAlto(u) { let h = 7; for (const ch of String(u || "")) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0; return "al:" + (h >>> 0).toString(36).slice(0, 8); }
  estaturaDe(u) { const v = +this.casa?.cuartos?.monos?.[this._claveAlto(u)]; return v >= 0.8 && v <= 1.2 ? v : 1; }
  ponerEstatura(u, v) { this.sync.op({ o: "cuarto", k: "monos", v: { [this._claveAlto(u)]: v } }); this._pintarCasa(this.sync.casa()); this.sonar("pop", { volumen: 0.6 }); }
  _alturas() {
    for (const [m, u] of [[this.yo, this.yoUsuario], [this.suyo, this.parejaUsuario]]) {
      const a = this.estaturaDe(u);
      if (!m || m.alto === a) continue;
      m.alto = a; m.n.style.setProperty("--alto", String(a));
      if (m.mueble) { const [id, jx] = m.mueble.split(":"), ro = this.objs.get(id); if (ro?.d.lugares?.[+jx]) { m._3d = null; this._irLugar(m, ro, +jx, true); } }
    }
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
    const mano = m.cuerpo.querySelector(".ca-mano-cosa"), largo = m.cuerpo.querySelector(".ca-mano-larga"), L = COSAS_MANO[m.lleva]?.larga, dL = CATALOGO[L];
    largo?.replaceChildren();
    // (Fase 65) La escoba y el rastrillo de su tamaño: el palo pasa por la mano y las cerdas llegan al piso.
    if (largo && dL) {
      const t = document.createElement("template"); t.innerHTML = dL.arte({}, dL.colores?.[0] || null);
      const sv = t.content.querySelector("svg"), [x, y] = COSAS_MANO[m.lleva].mano || [72 - dL.w / 2, 166 - dL.h];
      if (sv) { for (const [k, v] of [["x", x], ["y", y], ["width", dL.w], ["height", dL.h]]) sv.setAttribute(k, v); largo.append(sv); }
      // (El brazo se abre un poquito, -14°, y la escoba va al revés: así queda derechita, el palo por fuera del brazo
      // y agarrado por la mano.)
      largo.setAttribute("transform", "rotate(14 72 102)");
      mano?.replaceChildren();
    } else if (mano) {
      mano.replaceChildren();
      if (m.lleva) {
        const t = document.createElement("template"); t.innerHTML = COSAS_MANO[cosa].arte;
        const sv = t.content.querySelector("svg");
        if (sv) { for (const [k, v] of [["x", 59], ["y", 88], ["width", 27], ["height", 27]]) sv.setAttribute(k, v); mano.append(sv); }
      }
    } else { m.llevaN.hidden = !m.lleva; m.llevaN.innerHTML = m.lleva ? COSAS_MANO[cosa].arte : ""; }
    m.n.classList.toggle("con-cosa", !!m.lleva);
    m.n.classList.toggle("con-larga", !!(largo && dL));
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
  /** (Fase 61) Suelta TODO gesto que tenga puesto (los de uno y los de juntos: manita, abrazo, selfie…): así las manos
   *  nunca se quedan pegadas ni en un loop raro cuando un gesto interrumpe a otro. */
  _limpiarGestos(m) {
    clearTimeout(m.tgesto);
    const quitar = [...m.n.classList].filter((c) => c.startsWith("g-") || c === "enamorado" || c === "tocando" || c === "comiendo");
    if (quitar.length) m.n.classList.remove(...quitar);
  }
  gesto(m, k, mandar = true) {
    const g = GESTOS.find((x) => x[0] === k);
    if (!g) return;
    if (m.accion && !["saluda", "besito", "rie", "volado", "corazon", "guino", "sorpresa", "piensa", "triste", "enojado"].includes(k)) { if (m === this.yo) this.pararse(); else this._pose(m, ""); }
    this._limpiarGestos(m);
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
    this._limpiarGestos(m);
    m.n.classList.add("g-come");
    this.sonar("comer");
    this.particulas("migaja", { gx: m.gx + 18 * m.mira, y: m.y - 92 }, 0, 0, 4);
    m.tgesto = setTimeout(() => { m.n.classList.remove("g-come"); this._ponerLleva(m, ""); this._mandarYo({ lleva: "" }); this._globo(m, "¡Qué rico!", 1800); }, 1600);
    this._mandarYo({ ev: { k: "come", t: m.lleva } });
  }
  /** Soltar lo que traes: se queda tirado en el piso (cae con su rebotito) y se recoge al tocarlo. */
  soltar(alBote = false, junto = null) {
    const m = this.yo, k = m.lleva;
    if (!k) return;
    this._ponerLleva(m, ""); this._mandarYo({ lleva: "" });
    if (alBote || this.objs.size >= MAX_OBJETOS) return;
    this.sonar("soltar");
    // (Fase 65) La escoba (o el rastrillo) se vuelve un objeto de verdad: se recarga en el mueble o la pared de junto,
    // o se cae al piso; ahí se queda hasta que la vuelvas a agarrar.
    const L = COSAS_MANO[k]?.larga;
    if (L && CATALOGO[L]) {
      const c0 = enCuarto(m.gx).c, A = this._recargar(CATALOGO[L], c0, m.gx + 30 * m.mira, lim(m.y + 6, FONDO + 6, frenteDe(c0) - 6), "", m.mira, junto);
      const o = { id: nuevoId(), t: L, c: c0, x: Math.round(A.gx - inicioDe(c0)), y: Math.round(A.y), f: false, e: { pose: A.pose, ang: A.ang } };
      this.sync.op({ o: "pon", obj: o });
      this._pintarCasa(this.sync.casa());
      const r = this.objs.get(o.id);
      if (r) { this._caer(r, 26); this._volcar(r); }
      return;
    }
    const gx = lim(m.gx + 28 * m.mira, 24, ANCHO - 24), { c, x } = enCuarto(gx);
    const o = { id: nuevoId(), t: "cosita", c, x: Math.round(x), y: Math.round(lim(m.y + 8, FONDO, FRENTE)), f: false, e: { k } };
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    const r = this.objs.get(o.id);
    if (r) this._caer(r, 70);
  }
  /** (Fase 65) Dónde y cómo queda algo largo que sueltas (una escoba): recargado en el mueble de junto (inclinado lo
   *  justo para que la punta toque su orilla), en la pared de atrás, o tirado en el piso (hacia donde caiga).
   *  Nunca atraviesa: se queda fuera de la huella del mueble y dentro del cuarto. Devuelve { gx, y, pose, ang }. */
  _recargar(d, c, gx, y, id = "", dir = 1, junto = null) {
    const cu = cuarto(c), x0 = inicioDe(c), a = x0 + 20, b = x0 + cu.w - 20, hueco = 22;
    let mejor = null;
    // (Con `junto`, se recarga en ese mueble, del lado que le quede más cerca: así se deja junto al asiento.)
    for (const q of junto ? [junto] : this.objs.values()) {
      if (q.o.id === id || q.o.c !== c || q.d.capa !== "piso" || q.d.mascota || q.d.portatil || q.d.larga) continue;
      const h = this.nav.huella(q);
      if (!h || (!junto && (y < h.y0 - 18 || y > h.y1 + 18)) || q.d.h < 50) continue;
      let izq = gx < (h.x0 + h.x1) / 2, bx = izq ? h.x0 - hueco : h.x1 + hueco;
      if (bx < a || bx > b) { izq = !izq; bx = izq ? h.x0 - hueco : h.x1 + hueco; }
      const dist = Math.abs(gx - bx);
      if ((junto || dist <= 60) && bx >= a && bx <= b && (!mejor || dist < mejor.dist)) mejor = { q, h, izq, bx, dist };
    }
    if (mejor) {
      const { q, h, izq, bx } = mejor, alto = Math.min(q.d.h * 0.9, d.h - 8), ang = (Math.atan2(hueco - 4, alto) * 180) / Math.PI;
      return { gx: bx, y: lim(y, h.y0 + 6, h.y1 - 4), pose: "mueble", ang: Math.round(izq ? ang : -ang) };
    }
    // La pared de atrás (adentro) o la fachada (en el patio): casi derechita, recargada hacia atrás.
    const enFachada = cu.mapa && gx - x0 > FACHADA.x0 + 20 && gx - x0 < FACHADA.x1 - 20 && Math.abs(gx - x0 - FACHADA.puerta) > 70 && y <= MAPA.fondo + 44;
    if ((!cu.afuera && y <= FONDO + 44) || enFachada) return { gx: lim(gx, a, b), y: enFachada ? MAPA.fondo + 10 : FONDO + 8, pose: "pared", ang: dir < 0 ? -5 : 5 };
    // Al piso: cae acostada; si del lado que cae no cabe (la orilla del cuarto, el agua), cae para el otro.
    let lado = dir < 0 ? -1 : 1;
    const cabe = (s) => { const fin = gx + s * (d.h - 10); return fin >= a && fin <= b && (!cu.mapa || this.nav.libreEn(c, fin, y)); };
    if (!cabe(lado) && cabe(-lado)) lado = -lado;
    return { gx: lim(gx, a, b), y, pose: "suelo", ang: 90 * lado };
  }
  /** Cómo cae algo largo: si se recarga, se inclina hasta tocar; si se cae al piso, se va de lado y rebota. */
  _volcar(r) {
    const a = r.n.querySelector(":scope > .ca-obj-arte"), ang = +r.o.e?.ang || 0;
    if (!a || reducido() || !ang) return;
    const tumba = Math.abs(ang) > 45;
    a.animate(tumba
      ? [{ rotate: "0deg", easing: "cubic-bezier(.55,0,1,.6)" }, { rotate: ang * 1.04 + "deg", offset: 0.72, easing: "ease-out" }, { rotate: ang * 0.95 + "deg", offset: 0.86 }, { rotate: ang + "deg" }]
      : [{ rotate: "0deg", easing: "ease-in" }, { rotate: ang * 1.18 + "deg", offset: 0.7, easing: "ease-out" }, { rotate: ang + "deg" }], { duration: tumba ? 620 : 420 });
    if (tumba) setTimeout(() => { if (!this.vivo) return; this.sonar("soltar", { volumen: 0.6 }); this.particulas("polvo", { gx: r.gx + (ang > 0 ? 50 : -50), y: r.o.y }, 0, 0, 3); }, 440);
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
    m.n.style.transitionDuration = ".25s"; this._ponerMono(m, m.gx, o.y - 20, o.y); m.n.style.zIndex = zMono(o.y + 40);
    m.n.classList.add("g-trampolin");
    this._mandarYo({ ev: { k: "gesto", t: "brinca" } });
    let i = 0;
    const t = setInterval(() => { if (!this.vivo || m.orden !== orden || i++ > 5) { clearInterval(t); m.n.classList.remove("g-trampolin"); if (this.vivo && m.orden === orden) { this._ponerMono(m, m.gx, y0); m.n.style.zIndex = zMono(y0); } return; } this.sonar("trampolin"); rebote(n, "salta"); }, 560);
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
    const poner = (m, clases, ms = 2300) => { this._limpiarGestos(m); void m.n.offsetWidth; m.n.classList.add(...clases); m.tgesto = setTimeout(() => m.n.classList.remove(...clases), ms); };
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
    const gx0 = (ref.gx ?? 0) + dx, y0 = (ref.y ?? ref.o?.y ?? SUELO) + dy;
    // (Fase 61: a la hondura de quien las suelta, con la perspectiva de la cajita.)
    const quien = [this.yo, this.suyo].find((m) => m && Math.abs(m.gx - (ref.gx ?? 0)) < 90 && (m.prof ?? m.y) >= y0 - 4);
    const v = this._vista(gx0, y0, lim(ref.prof ?? quien?.prof ?? quien?.y ?? y0, PISO, H)), gx = v.x, y = v.y;
    for (let i = 0; i < n; i++) {
      const p = el("i.ca-part." + tipo, { style: { left: gx + (Math.random() * 44 - 22) * v.s + "px", top: y + (Math.random() * 16 - 8) + "px", animationDelay: (i * 0.09).toFixed(2) + "s", "--dx": (Math.random() * 60 - 30).toFixed(0) + "px", "--rot": (Math.random() * 60 - 30).toFixed(0) + "deg" } });
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
      // (Fase 64) Con el mouse, arrastrar el piso mueve la cámara (como deslizar con el dedo).
      if (e.pointerType === "mouse" && !this.editando && !g.mono && !g.obj) g.pan = { sl: this.vistaN.scrollLeft, st: this.vistaN.scrollTop };
      if (this.editando || g.jugando) {
        if (g.obj) { g.off = { dx: (g.obj.v?.x ?? g.obj.gx) - p.X, dy: g.obj.o.y - p.y }; try { m.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
      } else if (g.mono === this.yo) { try { m.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
    });
    m.addEventListener("pointermove", (e) => {
      if (!g || e.pointerId !== g.id) return;
      g.mov = Math.max(g.mov, Math.hypot(e.clientX - g.x0, e.clientY - g.y0));
      if (g.mov < 7) return;
      g.ultimo = e;
      if (g.pan) { this.vistaN.scrollLeft = g.pan.sl - (e.clientX - g.x0); this.vistaN.scrollTop = g.pan.st - (e.clientY - g.y0); this._libreCam?.(); return; }
      if ((this.editando || g.jugando) && g.obj) { this._arrastrarObj(g, e); e.preventDefault(); }
      else if (!this.editando && g.mono === this.yo) { this._cargar(g, e); e.preventDefault(); }
    });
    const fin = (e, cancelado = false) => {
      if (!g || e.pointerId !== g.id) return;
      const G = g; g = null;
      cancelAnimationFrame(this._rqAuto);
      if (G.arrastra) { this._soltarObj(G, e); return; }
      if (G.cargando) { this._soltarMono(G, e); return; }
      if (cancelado || G.mov > 10 || performance.now() - G.t0 > 700 || this._mirando) return;   // (dedo presionado = sólo mirar)
      // (Fase 63) Una puerta: tu monito va, la abre y entra (al acomodar: eliges a dónde lleva).
      const pu = G.blanco?.closest?.(".ca-puerta");
      if (pu && !G.mono) return this.puertasN.tocar(pu.dataset.puerta);
      if (this.editando) { this._seleccionar(G.obj || null); return; }
      // (Fase 64) Algo del escenario del patio (un árbol, la fuente, un letrero…).
      // (Fase 67) Algo para recoger (una zarza con bayas, un hongo, una flor, una piña).
      const fo = !G.mono && !G.obj && G.blanco?.closest?.(".ca-forraje");
      if (fo) return this.recolectar.tocar(fo.dataset.forraje);
      const es = !G.mono && !G.obj && G.blanco?.closest?.(".ca-esc");
      if (es) return this.patio.tocar(es.dataset.esc);
      if (G.mono === this.yo) return this._menuYo();
      if (G.mono === this.suyo) return this._menuSuyo();
      if (G.obj) return this._tocarObj(G.obj);
      // El piso (o la pared): camina hasta ahí. (Lloviendo, si tocas un charco, ¡brincas en él!)
      const p = this._xy(e);
      const ch = this.climaActual() !== "sol" ? charcoEn(p.x, p.y) : null;
      if (ch) { this.brincarCharco(ch); return; }
      const ay0 = lim(p.y >= PISO - 10 ? p.y : this.yo.mueble ? SUELO : this.yo.y, FONDO, frenteDe(this.vistaCuarto)), x0 = inicioDe(this.vistaCuarto);
      // (Fase 63: si tocaste encima de un mueble, la flechita sale en el lugar libre más cercano, a donde de verdad llega.)
      let [ax, ay] = this.nav.libre(this.vistaCuarto, lim(desproyectar(p.X, ay0), x0 + 20, x0 + cuarto(this.vistaCuarto).w - 20), ay0);
      // (Fase 68) Si tocas la pared desde lejos, tu monito se avienta corriendo contra ella (¡pum!).
      const cuV = cuarto(this.vistaCuarto);
      this.yo._trote = this.yo._embiste = false;
      if (p.y < PISO - 10 && !cuV.afuera && !this.yo.mueble && !this.herramienta()) {
        const bx = lim(desproyectar(p.X, FONDO), x0 + 30, x0 + cuV.w - 30), [px, py] = this.nav.libre(this.vistaCuarto, bx, FONDO + 2);
        if (Math.hypot(px - this.yo.gx, (py - this.yo.y) * 1.6) > 300 && Math.abs(py - FONDO) < 30) { ax = px; ay = py; this.yo._trote = true; this.yo._embiste = true; }
      }
      this._flecha(ax, ay);
      // (Fase 64) Con la escoba (o el trapeador, la aspiradora…) en la mano: va y limpia ahí.
      if (["barrer", "trapear", "aspirar"].includes(this.herramienta())) this._caminar(this.yo, ax, ay, () => this._limpiar());
      else this._caminar(this.yo, ax, ay);
      this.yo.orden++;
      this._mandarYo({ accion: "", mueble: "" });
    };
    m.addEventListener("pointerup", (e) => fin(e));
    m.addEventListener("pointercancel", (e) => fin(e, true));
    m.addEventListener("contextmenu", (e) => e.preventDefault());
    // (Fase 60) Mientras tu dedo está en la pantalla: la cámara no te pelea y tu monito voltea a verlo.
    const v = this.vistaN;
    let rqMira = 0, ult = null;
    const mira = (x, y) => { ult = [x, y]; if (!rqMira) rqMira = requestAnimationFrame(() => { rqMira = 0; if (ult) this._mirarDedo(...ult); }); };
    const suelta = () => { this._dedoAbajo = false; ult = null; cancelAnimationFrame(rqMira); rqMira = 0; this._mirarDedo(null); };
    v.addEventListener("pointerdown", (e) => { this._dedoAbajo = true; this._dedo0 = [e.clientX, e.clientY]; cancelAnimationFrame(this._rqCam); this._rqCam = 0; mira(e.clientX, e.clientY); }, { passive: true });
    // (Fase 64) Si deslizas la vista con el dedo (o la rueda del mouse), la cámara te deja explorar: ya no regresa sola.
    const libre = () => { if (this.arrastrandoId || this.yo.n.classList.contains("cargado") || this._mirando || this.editando) return; if (!this._camLibre) { this._camLibre = true; cancelAnimationFrame(this._rqCam); this._rqCam = 0; } this._verEnfocar(); };
    v.addEventListener("touchmove", (e) => { const t = e.touches[0], d0 = this._dedo0; if (t && d0 && Math.hypot(t.clientX - d0[0], t.clientY - d0[1]) > 14) libre(); }, { passive: true });
    v.addEventListener("wheel", () => libre(), { passive: true });
    this._libreCam = libre;
    v.addEventListener("pointermove", (e) => { if (this._dedoAbajo) mira(e.clientX, e.clientY); }, { passive: true });
    v.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) { this._dedoAbajo = true; mira(t.clientX, t.clientY); } }, { passive: true });
    for (const ev of ["pointerup", "pointercancel", "touchend", "touchcancel"]) v.addEventListener(ev, (e) => { if (e.type === "pointercancel" && e.pointerType === "touch") return; if (e.touches?.length) return; suelta(); }, { passive: true });
    // (Fase 62) Dedo PRESIONADO (quieto un ratito): la cámara ya no se mueve y tu monito te sigue con la cabecita y los
    // ojitos a donde muevas el dedo; al soltarlo vuelve a verte de frente (y no camina).
    let tMira = 0, x0 = 0, y0 = 0;
    const quitarMira = () => { clearTimeout(tMira); tMira = 0; if (this._mirando) { this._mirando = false; this.raiz?.classList.remove("mirando"); } };
    v.addEventListener("pointerdown", (e) => {
      quitarMira();
      if (this.editando || e.button > 0 || e.target.closest?.(".ca-monito, button, .ca-menu")) return;
      const o = e.target.closest?.(".ca-obj");
      if (o && this.objs.get(o.dataset.id)?.d.portatil) return;
      x0 = e.clientX; y0 = e.clientY;
      tMira = setTimeout(() => { tMira = 0; this._mirando = true; this.raiz?.classList.add("mirando"); vibrar(6); }, 320);
    }, { passive: true });
    const movio = (x, y) => { if (tMira && Math.hypot(x - x0, y - y0) > 10) { clearTimeout(tMira); tMira = 0; } };
    v.addEventListener("pointermove", (e) => movio(e.clientX, e.clientY), { passive: true });
    v.addEventListener("touchmove", (e) => { if (this._mirando && e.cancelable) e.preventDefault(); const t = e.touches[0]; if (t) movio(t.clientX, t.clientY); }, { passive: false });
    for (const ev of ["pointerup", "pointercancel", "touchend", "touchcancel"]) v.addEventListener(ev, (e) => { if (e.touches?.length) return; setTimeout(quitarMira, 0); }, { passive: true });
    // Con el teclado (Enter sobre una cosa), lo mismo que tocarla.
    m.addEventListener("keydown", (e) => { const pu = (e.key === "Enter" || e.key === " ") && e.target.closest?.(".ca-puerta"); if (pu) { e.preventDefault(); this.puertasN.tocar(pu.dataset.puerta); return; } if ((e.key === "Enter" || e.key === " ") && e.target.closest?.(".ca-obj")) { e.preventDefault(); const r = this.objs.get(e.target.closest(".ca-obj").dataset.id); if (r) this._tocarObj(r); } });
  }
  _tocarObj(r) {
    const d = r.d, o = { ...r.o, def: d, gx: r.gx };
    // (Fase 68) Lo que se cayó (o se chueó) se levanta: tu monito va y lo pone en su lugar.
    if (!this.herramienta() && this.fisica?.levantable(r)) return this.fisica.levantar(r);
    // (Fase 64) Lo que se rompió se queda de adorno: ya no se usa (se arregla al acomodar).
    if ((r.o.e?.dano | 0) >= 2) { rebote(r.n); this.sonar("nop"); this._globo(this.yo, "Está roto: lo puedes arreglar al acomodar", 2800); return; }
    // (Fase 64) Con una herramienta en la mano: el plumero sacude, la regadera riega y la escoba barre junto a lo que tocaste.
    const h = this.herramienta();
    if (h === "sacudir" && !d.mascota && d.al !== "herramienta") return this._sacudirObj(r);
    if (h === "regar" && /flor|planta|maceta|arbol|arbusto|cactus|jardinera|monstera|huerto|colgante|rosita|arbolito/.test(d.k)) return this._regarObj(r);
    if (["barrer", "trapear", "aspirar"].includes(h) && d.al !== "herramienta" && d.al !== "basura" && !d.lugares) { this.irJunto({ id: r.o.id }).then((ok) => ok && this._limpiar()); return; }
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
    const h = this.herramienta();
    if (["barrer", "trapear", "aspirar"].includes(h)) ops.unshift(["escoba", { barrer: "Barrer aquí", trapear: "Trapear aquí", aspirar: "Aspirar aquí" }[h], () => this._limpiar()]);
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
    if (!g.cargando) { g.cargando = true; m.orden++; m._enRuta = false; clearTimeout(m.tc); clearInterval(m.tp); this._pose(m, ""); m.n.classList.remove("camina"); m.n.classList.add("cargado"); m.n.style.transitionDuration = "0s"; vibrar(10); this.sonar("levantar"); }
    const x0 = inicioDe(this.vistaCuarto);
    m.y = Math.min(frenteDe(this.vistaCuarto), p.y + 74); m.gx = lim(desproyectar(p.X, lim(m.y, PISO, H)), x0 + 20, x0 + cuarto(this.vistaCuarto).w - 20);
    m.n.style.left = p.X.toFixed(1) + "px"; m.n.style.top = m.y.toFixed(1) + "px";
    this._autoDeslizar(e);
  }
  _soltarMono(g, e) {
    const m = this.yo, p = this._xy(e);
    m.n.classList.remove("cargado");
    // ¿Lo soltaste encima de algo para sentarse o acostarse? Lo usa.
    for (const r of [...this.objs.values()].reverse()) {
      if (!r.d.lugares || r.d.al === "estufa" || r.d.al === "parrilla") continue;
      const v = r.v || { x: r.gx, y: r.o.y, s: 1 }, w = r.d.w * v.s, x0 = v.x - w / 2, y0 = v.y - r.d.h * v.s;
      if (p.X >= x0 && p.X <= x0 + w && p.y + 40 >= y0 && p.y + 40 <= v.y + 20) { this.usarLugar({ id: r.o.id }); return; }
    }
    m.y = lim(m.y, FONDO, frenteDe(this.vistaCuarto));
    // (Fase 64) Si lo soltaste en el agua, las espinas o encima de algo, cae en el lugar libre más cercano.
    [m.gx, m.y] = this.nav.libre(this.vistaCuarto, m.gx, m.y);
    m.n.style.transitionDuration = ".34s"; this._ponerMono(m); m.n.style.zIndex = zMono(m.y);
    m.n.classList.add("aterriza"); setTimeout(() => m.n.classList.remove("aterriza"), 480);
    this.sonar("boing"); this.particulas("polvo", { gx: m.gx, y: m.y }, 0, 0, 3);
    this._mandarYo({ accion: "", mueble: "" });
  }
  /** Si arrastras cerca de la orilla, la casita se desliza sola hacia ese lado. */
  _autoDeslizar(e) {
    cancelAnimationFrame(this._rqAuto);
    const v = this.vistaN, R = v.getBoundingClientRect(), borde = Math.min(60, R.width * 0.12), mapa = !!cuarto(this.vistaCuarto).mapa;
    const dir = e.clientX < R.left + borde ? -1 : e.clientX > R.right - borde ? 1 : 0;
    // (Fase 64) En el patio, también para arriba y para abajo.
    const fondoV = R.bottom - (this.editando ? (this.cajonN?.offsetHeight || 0) + 12 : 0);
    const dirY = !mapa ? 0 : e.clientY < R.top + borde * 1.4 ? -1 : e.clientY > fondoV - borde * 1.6 && e.clientY < fondoV ? 1 : 0;
    if (!dir && !dirY) return;
    const paso = () => { v.scrollLeft += dir * 9; v.scrollTop += dirY * 9; this._rqAuto = requestAnimationFrame(paso); };
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
    this.puertasN.pintar();   // (al acomodar se ven también los lugares de las puertas que quitaste, para volver a ponerlas)
  }
  /** Lo último que pusiste (para la pestaña «Recientes» del cajón). */
  recientes() { try { const v = JSON.parse(localStorage.getItem(RECIENTES) || "[]"); return Array.isArray(v) ? v.filter((k) => CATALOGO[k]).slice(0, 12) : []; } catch (e) { return []; } }
  _recordar(t) { try { localStorage.setItem(RECIENTES, JSON.stringify([t, ...this.recientes().filter((k) => k !== t)].slice(0, 12))); } catch (e) { /* nada */ } }
  /** Arrastrar una cosa del cajón: aparece bajo tu dedo y la sueltas donde la quieras (o en la basura). */
  arrastrarNuevo(t, ev) {
    const d = CATALOGO[t];
    if (!d || !this.editando) return;
    if (this.objs.size >= MAX_OBJETOS) { aviso("Ya hay muchísimas cosas: quita alguna para poner otra", 2800); this.sonar("nop"); return; }
    const p = this._xy(ev), y = d.capa === "pared" ? d.y : lim(p.y + d.h / 2, FONDO, frenteDe(this.vistaCuarto));
    const x0 = inicioDe(this.vistaCuarto), gx = lim(desproyectar(p.X, d.capa === "pared" ? PISO : y), x0 + d.w * 0.3, x0 + cuarto(this.vistaCuarto).w - d.w * 0.3), { c, x } = enCuarto(gx);
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
    const v = this.vistaN, c = this.vistaCuarto, cu = cuarto(c), w = cu.w, x0 = inicioDe(c);
    let gx = (v.scrollLeft + v.clientWidth / 2) / this.k + x0 + (Math.random() * 60 - 30), y = d.y;
    const e = {};
    // (Fase 64) Lo nuevo cae en un lugar donde sí se puede acomodar (y que se ve): lo de la pared, en una pared de verdad.
    if (d.capa === "pared") {
      if (cu.mapa) { gx = x0 + FACHADA.puerta + (gx > x0 + FACHADA.puerta ? 1 : -1) * 230; y = Math.min(FACHADA.base - 20, FACHADA.pared + d.h + 30); }
      if (!this._enPared(c, gx, y, d)) { e.tirado = true; y = cu.mapa ? 560 : 560; }
    } else if (cu.mapa) {
      const cy = (v.scrollTop + v.clientHeight * 0.62) / this.k - MAPA.arriba, L = this._lugarEditable(c, gx, lim(cy, FONDO + 40, frenteDe(c) - 40));
      if (L) { gx = L.x; y = L.y; } else y = 600;
    } else if (d.capa !== "alfombra") y = lim(LIMITE_EDIT - 6 - Math.random() * 26, FONDO, LIMITE_EDIT);
    if (e.tirado && cu.mapa) { const L = this._lugarEditable(c, gx, y); if (L) { gx = L.x; y = L.y; } }
    // (Fase 65) Una escoba nueva tampoco se para solita: se recarga en lo de junto o en la pared, o cae acostada.
    if (d.larga) { const A = this._recargar(d, c, gx, y, "", Math.random() < 0.5 ? -1 : 1); gx = A.gx; y = A.y; e.pose = A.pose; e.ang = A.ang; }
    const x = lim(gx - x0, d.w / 2 + 4, w - d.w / 2 - 4);
    const o = { id: nuevoId(), t, c, x: Math.round(x), y: Math.round(y), f: false, e };
    this.pila.push([{ o: "quita", id: o.id }]);
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    const r = this.objs.get(o.id);
    if (r && !reducido()) { r.n.classList.remove("aparece"); r.n.classList.add("cae"); setTimeout(() => { r.n.classList.remove("cae"); this.particulas("polvo", { gx: r.gx, y: r.o.y }, 0, 0, 3); this.sonar("boing", { volumen: 0.7 }); if (d.larga) this._volcar(r); }, 430); }
    this.sonar("pop"); vibrar(8);
    this._seleccionar(r);
    this.deshacerB.disabled = false;
  }
  _seleccionar(r) {
    if (this.sel?.n) this.sel.n.classList.remove("sel");
    this.sel = r || null;
    if (r) { r.n.classList.add("sel"); rebote(r.n, "toque"); this.selColorB.hidden = !r.d.colores; this.selPuertaB.hidden = r.d.al !== "puerta"; this.selArreglarB.hidden = !(r.o.e?.dano > 0); this.selGirarB.hidden = !this._girable(r.d); this._pintarColores(); this.sonar("pop", { volumen: 0.5 }); }
    this.selN.hidden = !r;
    this._ubicarSel();
  }
  _ubicarSel() {
    const r = this.sel;
    if (!r || this.selN.hidden) return;
    const B = r.n.getBoundingClientRect(), p = { x: (B.left + B.right) / 2, y: B.top }, R = this.raiz.getBoundingClientRect(), w = this.selN.offsetWidth || 150;
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
  /** (Fase 64) Girar lo elegido a ese ángulo (se guarda y lo ve tu amorcito). */
  _girar(r, g) {
    if (!r || !this._girable(r.d)) return;
    const id = r.o.id;
    if (giroDe(r.o) !== g) this._guardarObj(r, { e: { ...(r.o.e || {}), giro: g } }, "whoosh");
    else this._dibujarObj(r, r.o);
    const n = this.objs.get(id);
    if (n) { this.sel = null; this._seleccionar(n); }
  }
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
    const o = { ...JSON.parse(JSON.stringify(r.o)), id: nuevoId(), x: Math.round(lim(x, d.w / 2 + 4, w - d.w / 2 - 4)), y: enPared(r.o, d) ? r.o.y : Math.round(lim(r.o.y + 8, FONDO, cuarto(r.o.c).mapa ? frenteDe(r.o.c) : LIMITE_EDIT)) };
    // (Fase 64) La copia también en un lugar permitido.
    if (!enPared(o, d) && !this._editableEn(o.c, global(o.c, o.x), o.y)) { const L = this._lugarEditable(o.c, global(o.c, o.x), o.y); if (L) { o.x = Math.round(L.x - inicioDe(o.c)); o.y = Math.round(L.y); } }
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
    let y = p.y + g.off.dy;
    // (Fase 64) Se puede levantar a donde sea (si no hay de qué sostenerse, al soltarlo se cae) y lo de la pared también
    // se puede bajar al piso. Lo alfombrado sólo va en el piso.
    const cu0 = cuarto(this.vistaCuarto), techo = cu0.mapa ? -MAPA.arriba + 10 : -this.offY / this.k + 6, fr = frenteDe(this.vistaCuarto);
    if (d.capa === "alfombra") y = lim(y, FONDO + 24, fr);
    else y = lim(y, techo + d.h, fr + 4);
    // (Fase 61: el dedo está en lo que se ve; se regresa al mundo según la hondura a la que va.)
    const x0 = inicioDe(this.vistaCuarto), x1 = x0 + cuarto(this.vistaCuarto).w;   // (Fase 63: dentro del cuarto que se ve)
    const enAire = d.capa === "pared" ? y < PISO : false;
    const gx = lim(desproyectar(p.X + g.off.dx, enAire ? PISO : lim(y, PISO, H)), x0 + d.w * 0.3, x1 - d.w * 0.3);
    g.vx = 0.7 * g.vx + 0.3 * (gx - (g.gx ?? gx));
    g.gx = gx; g.y = y;
    this._ponerObj(r, gx, y, enAire ? PISO : y);
    // (Al pasar por donde no se puede acomodar, se nota.)
    if (!g.jugando) r.n.classList.toggle("no-cabe", !this._sePuede(r, gx, y));
    for (const n of [r.n, r.fr]) n?.style.setProperty("--incl", lim(g.vx * 1.4, -9, 9).toFixed(1) + "deg");
    r.n.style.zIndex = 9000; if (r.fr) r.fr.style.zIndex = 9001;
    if (!g.jugando) {
      const B = this.basuraN.getBoundingClientRect();
      g.basura = e.clientX >= B.left - 10 && e.clientX <= B.right + 10 && e.clientY >= B.top - 14 && e.clientY <= B.bottom + 10;
      this.basuraN.classList.toggle("encima", g.basura);
      r.n.classList.toggle("a-la-basura", g.basura);
    }
    this._autoDeslizar(e);
  }
  /** (Fase 61) El lugar libre más cercano para un mueble del piso: sin encimarse en otro ni salirse del cuarto.
   *  Se recorre poquito de lado (nunca brinca lejos); si ahí no cabe, un pasito al frente; si tampoco, se queda donde lo soltaste. */
  _libre(r, gx, y) {
    const { c } = enCuarto(gx), x0 = inicioDe(c), cw = cuarto(c).w, w2 = r.d.w / 2, a = x0 + w2 + 4, b = x0 + cw - w2 - 4;
    const todos = [...this.objs.values()].filter((q) => q !== r && q.o.c === c && q.d.capa === "piso" && !q.d.mascota && !q.d.portatil && !(puedeSubir(q.d) && this._encima(q.gx, q.o.y, q.o.id)));
    // (Fase 65) Se compara lo que de verdad toca el piso (las huellas medidas), no el ancho de los dibujos: una
    // maceta cabe junto al sillón y debajo de lo que cuelga, y dos cosas nunca se enciman.
    const hs = todos.map((q) => this.nav.huella(q)).filter(Boolean);
    const libre = (x, yy) => {
      const h = this.nav.huella({ d: r.d, o: { ...r.o, id: "", y: yy }, gx: x });
      if (!h) return true;
      return !hs.some((q) => h.x0 < q.x1 - 2 && h.x1 > q.x0 + 2 && h.y0 < q.y1 - 2 && h.y1 > q.y0 + 2);
    };
    if (libre(gx, y)) return { x: gx, y };
    for (let dx = 12; dx <= 170; dx += 12) for (const x of [gx - dx, gx + dx]) if (x >= a && x <= b && libre(x, y)) return { x, y };
    for (const yy of [y + 30, y + 60]) if (yy <= FRENTE && libre(gx, yy)) return { x: gx, y: yy };
    return { x: gx, y };
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
    // (Fase 69) Una cosita soltada encima de un organizador se guarda adentro, en el siguiente hueco libre.
    { const q = this._guardaEn(r, g.gx, g.y); if (q) { this._guardar(q, r); return; } }
    // Física: si lo aventaste, se resbala un poquito; si quedó en el aire, cae al mueble de abajo o al piso.
    if (g.jugando) g.gx = lim(g.gx + lim(g.vx * 6, -90, 90), r.d.w * 0.3, ANCHO - r.d.w * 0.3);
    r.n.classList.remove("no-cabe");
    const d = r.d, soltadoEn = g.y, c0 = enCuarto(g.gx).c, e0 = { ...(r.o.e || {}) };
    let tirado = false;
    if (d.capa === "pared") {
      // (Fase 64) Lo de la pared sólo se cuelga donde de verdad hay pared (adentro, la de atrás; en el patio, la fachada).
      // En el cielo o en el piso no se sostiene: se cae y queda tirado en el piso.
      if (!this._enPared(c0, g.gx, g.y, d)) { tirado = true; if (g.y < FONDO + 6) g.y = cuarto(c0).mapa ? MAPA.fondo + 34 : FONDO + 10; }
    } else if (puedeSubir(d)) {
      const a = this._apoyo(g.gx, g.y, r.o.id);
      // En el aire: cae al mueble de abajo o al piso. En el piso, pero sobre el tablero de un mueble de más adelante: se queda encima.
      if (g.y < FONDO) g.y = a ? a.y : FONDO + 8;
      else if (a && a.r.o.y > g.y + 4 && a.y <= g.y + 30) g.y = a.y;
    } else if (g.y < FONDO) g.y = cuarto(c0).mapa ? MAPA.fondo + 34 : FONDO + 8;
    const cayo = Math.max(0, g.y - soltadoEn), encima = puedeSubir(d) && !!this._encima(g.gx, g.y, r.o.id);
    // (Fase 64) Donde no se puede acomodar (lo naranja): se recorre al lugar permitido más cercano. Jugando, al piso libre.
    if ((d.capa !== "pared" || tirado) && !encima) {
      if (g.jugando) { if (cuarto(c0).mapa) [g.gx, g.y] = this.nav.libre(c0, g.gx, g.y); }
      else if (!this._editableEn(c0, g.gx, g.y)) { const L = this._lugarEditable(c0, g.gx, g.y); if (L) { g.gx = L.x; g.y = L.y; } this._noAqui(); }
    }
    // (Fase 61) Colisiones al acomodar: un mueble del piso no se mete dentro de otro; se recorre al lugar libre más cercano.
    if (d.capa === "piso" && !d.mascota && !d.portatil && !encima) { const L = this._libre(r, g.gx, g.y); g.gx = L.x; g.y = L.y; }
    // (Fase 65) Una escoba no se para solita: se recarga en lo de junto o en la pared, o se cae al piso.
    if (d.larga) { const A = this._recargar(d, c0, g.gx, g.y, r.o.id, g.gx >= r.gx ? 1 : -1); g.gx = A.gx; g.y = A.y; e0.pose = A.pose; e0.ang = A.ang; }
    const { c, x } = enCuarto(g.gx);
    // (Fase 64) Si cayó de alto, se daña: poquito (despostillado), roto (de adorno) o hecho pedacitos (se quita; se puede deshacer).
    // (Fase 68) Lo de vidrio o talavera se rompe (con sus pedacitos en el piso).
    if (this.fisica?.seRompe(d, cayo, !!g.jugando)) { this._ponerObj(r, g.gx, g.y); this._caer(r, cayo, 3, () => this.fisica.romper(r, g.gx, g.y)); return; }
    const golpe = blando(d) ? 0 : danoPor(cayo), dano = Math.max(e0.dano | 0, golpe);
    if (d.capa === "pared") { if (tirado) e0.tirado = true; else delete e0.tirado; }
    if (dano) e0.dano = dano;
    if (golpe >= 3) { this._ponerObj(r, g.gx, g.y); this._caer(r, cayo, 3, () => this._hechoPedazos(r)); return; }
    const nuevo = { c, x: Math.round(x), y: Math.round(g.y), e: e0 };
    // Jugando (una mascota, el osito…): se queda donde lo soltaste, rebota y hace su ruidito.
    if (g.jugando) {
      this.sync.op({ o: "pon", obj: { ...JSON.parse(JSON.stringify(r.o)), ...nuevo } });
      this._pintarCasa(this.sync.casa());
      if (cayo > 8) this._caer(this.objs.get(r.o.id) || r, cayo, golpe);
      else if (!reducido()) { r.n.classList.add("aterriza"); setTimeout(() => r.n.classList.remove("aterriza"), 480); }
      this.particulas("polvo", { gx: g.gx, y: g.y }, 0, 0, 3);
      this.sonar({ miau: "miau", guau: "guau", chillido: "chillido", cuac: "cuac" }[r.d.al] || "boing", { volumen: 0.8 });
      return;
    }
    this._guardarObj(r, nuevo, "soltar");
    const rn = this.objs.get(r.o.id) || r;
    if (cayo > 8) this._caer(rn, cayo, golpe);
    if (d.larga) this._volcar(rn);
    if (!reducido()) { rn.n.classList.add("aterriza"); setTimeout(() => rn.n.classList.remove("aterriza"), 480); }
    if (!enPared(rn.o, d)) this.particulas("polvo", { gx: g.gx, y: g.y }, 0, 0, 3);
    this._seleccionar(rn);
  }
  /** (Fase 64) ¿Se puede acomodar algo del piso aquí? (en el patio, sólo en el pasto libre; adentro, no en lo de enfrente) */
  _editableEn(c, gx, y) { return cuarto(c).mapa ? editableMapa(gx - inicioDe(c), y) : y <= frenteDe(c) - 4; }
  /** ¿Hay pared para colgar algo aquí? (adentro, la de atrás; en el patio, la fachada fuera de la puerta; en la terraza no hay) */
  _enPared(c, gx, y, d) {
    const cu = cuarto(c), x = gx - inicioDe(c);
    if (cu.mapa) return x - d.w / 2 >= FACHADA.x0 + 12 && x + d.w / 2 <= FACHADA.x1 - 12 && y - d.h >= FACHADA.pared - 6 && y <= FACHADA.base - 20 && Math.abs(x - FACHADA.puerta) > d.w / 2 + 64;
    if (cu.afuera) return false;
    return y <= PISO - 6;
  }
  /** ¿Se queda donde está? (para el aviso naranja mientras lo arrastras) */
  _sePuede(r, gx, y) {
    const c = enCuarto(gx).c, d = r.d;
    if (d.capa === "pared" && (y < PISO || cuarto(c).mapa) && this._enPared(c, gx, y, d)) return true;
    if (y < FONDO) return true;   // (en el aire: se va a caer, eso sí se puede)
    return (puedeSubir(d) && !!this._encima(gx, y, r.o.id)) || this._editableEn(c, gx, y);
  }
  /** El lugar para acomodar más cercano (si lo soltaste donde no se puede). */
  _lugarEditable(c, gx, y) {
    const cu = cuarto(c), x0 = inicioDe(c), fr = frenteDe(c);
    if (!cu.mapa) return { x: gx, y: Math.min(y, fr - 4) };
    for (let rr = 14; rr <= 700; rr += 14) for (let a = 0; a < 24; a++) {
      const x = gx + Math.cos((a / 24) * Math.PI * 2) * rr, yy = y + Math.sin((a / 24) * Math.PI * 2) * rr * 0.7;
      if (x > x0 + 40 && x < x0 + cu.w - 40 && yy > FONDO && yy < fr && this._editableEn(c, x, yy)) return { x, y: yy };
    }
    return null;
  }
  _noAqui() {
    const R = this.raiz;
    R.classList.remove("no-aqui"); void R.offsetWidth; R.classList.add("no-aqui");
    clearTimeout(this._tNoAqui); this._tNoAqui = setTimeout(() => R.classList.remove("no-aqui"), 1200);
    this.sonar("nop"); vibrar(12);
    if (performance.now() - (this._avNoAqui || 0) > 6000) { this._avNoAqui = performance.now(); aviso("Ahí no se puede acomodar (lo naranja es para caminar): quedó en el lugar libre más cercano", 2600); }
  }
  /** Se rompió en pedacitos (cayó de muy alto): se quita, con sus astillitas. Se puede deshacer. */
  /* ── (Fase 69) El organizador ── */
  /** El organizador donde cae lo que sueltas (sólo cositas chiquitas), si hay uno ahí. */
  _guardaEn(r, gx, y) {
    const d = r.d;
    if (!d.portatil || d.mascota || d.guarda || d.h > 120 || d.capa !== "piso") return null;
    for (const q of this.objs.values()) {
      if (!q.d.guarda || q.o.id === r.o.id || enCuarto(gx).c !== q.o.c) continue;
      if (Math.abs(gx - q.gx) <= q.d.w / 2 && y >= q.o.y - q.d.h - 10 && y <= q.o.y + 14) return q;
    }
    return null;
  }
  /** Lo guarda en el primer hueco libre (y se abre tantito para que lo veas entrar). */
  _guardar(q, r) {
    const n = q.d.guarda.huecos.length, e = q.o.e || {}, i = [...Array(n).keys()].find((k) => !e["g" + k]);
    if (i == null) { this._colocar(r); aviso("El organizador ya está lleno: saca algo primero", 2400); this.sonar("nop"); return; }
    const col = r.o.e?.col | 0;
    this.sync.op({ o: "quita", id: r.o.id });
    this._pintarCasa(this.sync.casa());
    this.estado(q.o, { ["g" + i]: col ? `${r.o.t}:${col}` : r.o.t, abierto: true });
    this.sonar("pop"); setTimeout(() => this.vivo && this.sonar("ding", { volumen: 0.4 }), 200);
    const qn = this.objs.get(q.o.id);
    if (qn) { rebote(qn.n); this.particulas("brillo", { gx: qn.gx, y: qn.o.y - qn.d.h / 2 }, 0, 0, 4); }
    aviso(`${r.d.n} quedó guardado en el organizador`, 2000);
  }
  /** Saca lo del hueco i y lo pone en el piso, enfrentito. */
  _sacarGuardado(q, i) {
    const e = q.o.e || {}, v = String(e["g" + i] || "");
    if (!v) return;
    const [t, col] = v.split(":"), d = CATALOGO[t];
    if (!d) { this.estado(q.o, { ["g" + i]: "" }); return; }
    const c = q.o.c, x0 = inicioDe(c), lado = (i % 2 ? 1 : -1) * (24 + Math.random() * 30);
    const o = { id: nuevoId(), t, c, x: Math.round(lim(q.gx - x0 + lado, 30, cuarto(c).w - 30)), y: Math.round(lim(q.o.y + 22 + Math.random() * 16, FONDO + 8, frenteDe(c) - 8)), f: false, e: col ? { col: +col } : {} };
    this.estado(q.o, { ["g" + i]: "" });
    this.sync.op({ o: "pon", obj: o });
    this._pintarCasa(this.sync.casa());
    this.sonar("levantar");
    const rn = this.objs.get(o.id);
    if (rn && !reducido()) { rn.n.classList.add("aterriza"); setTimeout(() => rn.n.classList.remove("aterriza"), 480); }
  }
  /** Ordena lo guardado (por tipo y nombre), sin huecos en medio. */
  _ordenarGuardado(q) {
    const n = q.d.guarda.huecos.length, e = q.o.e || {}, l = [];
    for (let i = 0; i < n; i++) if (e["g" + i]) l.push(String(e["g" + i]));
    const cat = (v) => CATALOGO[v.split(":")[0]] || {};
    l.sort((a, b) => String(cat(a).cat).localeCompare(String(cat(b).cat)) || String(cat(a).n).localeCompare(String(cat(b).n), "es"));
    const c = {};
    for (let i = 0; i < n; i++) c["g" + i] = l[i] || "";
    this.estado(q.o, c);
    this.sonar("hoja");
  }
  /** Lo guardado se ve adentro, cada cosa en su hueco (paradita en su repisa). */
  _pintarGuardado(r) {
    const arte = r.n.querySelector(":scope > .ca-obj-arte");
    if (!arte) return;
    let capa = arte.querySelector(":scope > .ca-guardado");
    if (!capa) { capa = el("div.ca-guardado", { "aria-hidden": "true" }); arte.append(capa); }
    const e = r.o.e || {}, huecos = r.d.guarda.huecos, firma = huecos.map((_, i) => e["g" + i] || "").join("|");
    if (capa.dataset.firma === firma) return;
    capa.dataset.firma = firma;
    capa.replaceChildren();
    huecos.forEach(([x, y, w, h], i) => {
      const v = String(e["g" + i] || ""), [t, col] = v.split(":"), d = CATALOGO[t];
      if (!d) return;
      const ee = col ? { col: +col } : {};
      vistaPlana(d, ee, colorDe(d, ee)).then((p) => {
        if (!p || capa.dataset.firma !== firma) return;
        const s = Math.min(1, (w - 4) / p.w, (h - 2) / p.h), iw = p.w * s, ih = p.h * s;
        capa.append(el("img", { src: p.url, alt: "", draggable: "false", style: { left: (x + (w - iw) / 2).toFixed(1) + "px", top: (y + h - ih + 3 * s).toFixed(1) + "px", width: iw.toFixed(1) + "px", height: ih.toFixed(1) + "px" } }));
      });
    });
  }
  /** La hojita del organizador abierto: sus huecos (toca uno para sacarlo), ordenar y cerrar. */
  panelGuarda(id) {
    const q = this.objs.get(id);
    if (!q?.d.guarda) return;
    const pintar = () => {
      const r = this.objs.get(id);
      if (!r) return;
      const e = r.o.e || {};
      const huecos = r.d.guarda.huecos.map((_, i) => {
        const v = String(e["g" + i] || ""), [t, col] = v.split(":"), d = CATALOGO[t];
        const b = el("button.ca-guarda-h" + (d ? "" : ".vacio"), { type: "button", "aria-label": d ? `Sacar ${d.n}` : "Hueco vacío", disabled: d ? null : "", onClick: () => { this._sacarGuardado(this.objs.get(id), i); setTimeout(pintar, 60); } }, [el("i"), el("small", { text: d ? d.n : "Libre" })]);
        if (d) { const ee = col ? { col: +col } : {}; vistaPlana(d, ee, colorDe(d, ee)).then((p) => { if (p) b.querySelector("i").style.backgroundImage = `url("${p.url}")`; }); }
        return b;
      });
      cuerpo.replaceChildren(
        el("div.ca-guarda-huecos", {}, huecos),
        el("p.ca-guarda-pista", { text: Object.keys(e).some((k) => /^g\d+$/.test(k) && e[k]) ? "Toca una cosa para sacarla. Para guardar, en «Acomodar» suelta una cosita chiquita encima del organizador." : "Está vacío. Para guardar, en «Acomodar» suelta una cosita chiquita encima del organizador." }),
        el("div.ca-guarda-botones", {}, [
          el("button.ca-chip", { type: "button", onClick: () => { this._ordenarGuardado(this.objs.get(id)); setTimeout(pintar, 60); } }, [el("span", { text: "Ordenar" })]),
          el("button.ca-chip.primario", { type: "button", onClick: () => { const r2 = this.objs.get(id); if (r2) { this.estado(r2.o, { abierto: false }); this.sonar("cerrar"); } this.cerrarPanelGuarda(); } }, [el("span", { text: "Cerrar puertitas" })]),
        ]),
      );
    };
    const cuerpo = el("div.ca-guarda");
    this._hojaGuarda = P.hoja(this, q.d.n, cuerpo, "guarda");
    pintar();
  }
  cerrarPanelGuarda() { const h = this._hojaGuarda; this._hojaGuarda = null; if (h && this.panel === h) this.cerrarHoja(); }
  _hechoPedazos(r) {
    if (!this.objs.has(r.o.id)) return;
    this.particulas("polvo", { gx: r.gx, y: r.o.y - 10 }, 0, 0, 8);
    this.particulas("chispa", { gx: r.gx, y: r.o.y - 20 }, 0, 0, 5);
    vibrar([20, 30, 20]);
    this._borrar(r);
    aviso("¡Cayó de muy alto y se hizo pedacitos! Puedes deshacerlo.", 2800);
  }
  /** (Fase 64) Arreglar algo dañado (al acomodar). */
  _arreglar() {
    const r = this.sel;
    if (!r || !(r.o.e?.dano > 0)) return;
    this._guardarObj(r, { e: { ...(r.o.e || {}), dano: 0 } }, "ding");
    const n = this.objs.get(r.o.id);
    if (n) { this.sel = null; this._seleccionar(n); this.particulas("brillo", { gx: n.gx, y: n.o.y - n.d.h / 2 }, 0, 0, 6); }
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
        if (!r.casa.objetos.some((o) => o.t === "casita_perro" && o.c === "jardin")) ops.push({ o: "pon", obj: { id: "ja8", t: "casita_perro", c: "jardin", x: 1530, y: 600, f: false, e: {} } });
        ops.push({ o: "cuarto", k: "jardin", v: { v55: true } });
      }
      // (Fase 64) El jardín chiquito de antes se muda al patio grande (una sola vez).
      if (!r.casa.cuartos?.jardin?.mapa) ops.push(...opsMudanza(r.casa, MUDANZA, editableMapa, (t) => CATALOGO[t]?.capa));
      if (ops.length) this.sync.ops(ops);
    }
    this._pintarCasa(this.sync.casa());
    this.mensajes.recibir(r.msgs, primera);
    this._parejaAqui = !!r.pareja_aqui; this._estado();
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
      requestAnimationFrame(() => this._mostrarCuarto(enCuarto(this.yo.gx).c, this.yo.gx));
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
    const m = this.suyo, yo = this.yo, espera = Math.max(0, Math.max(m.llega || 0, m.llegaFin || 0) - performance.now()) + 40;
    if (ev.k === "comemesa") laPareja(this, ev, espera);
    else if (ev.k === "rompe") { if (enCuarto(m.gx).c === this.vistaCuarto) this.sonar("vidrio", { volumen: 0.7 }); }
    else if (ev.k === "choca") setTimeout(() => this.vivo && this.fisica?.chocar(m), espera);
    else if (ev.k === "sirve" && RECETAS[ev.t]) { aviso(`${this.pareja} sirvió ${RECETAS[ev.t].n.toLowerCase()} en la mesa`, 2800); this.sonar("mesa", { volumen: 0.7 }); }
    else if (ev.k === "cocina" && RECETAS[ev.t]) { if (this._visible(m)) this._globo(m, `Cocinando ${RECETAS[ev.t].n.toLowerCase()}…`, 2600); }
    else if (ev.k === "notas") this._notasDeElla(ev.t, espera);
    else if (ev.k === "toca") setTimeout(() => {
      m.n.classList.add("tocando"); setTimeout(() => m.n.classList.remove("tocando"), 2400);
      this.particulas("nota", { gx: m.gx, y: m.y - 140 }, 0, 0, 3);
      if (this._visible(m)) this.sonar(ev.t === "guitarra" ? "guitarra" : "piano", { volumen: 0.5 });
    }, espera);
    else if (ev.k === "gesto") setTimeout(() => this.gesto(m, ev.t, false), espera);
    else if (ev.k === "limpia") setTimeout(() => { m.n.classList.add("limpiando", "l-" + ev.t); setTimeout(() => m.n.classList.remove("limpiando", "l-" + ev.t), 1400); if (this._visible(m)) { this.particulas(ev.t === "trapear" ? "burbuja" : "polvo", { gx: m.gx + 26 * m.mira, y: m.y - 4 }, 0, 0, 4); this.sonar(ev.t === "aspirar" ? "viento" : "hojas", { volumen: 0.4 }); } }, espera);
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
    const n = el("button.ca-regalito", { type: "button", "aria-label": "Regalito del día", style: { left: this._vista(gx, y).x - 26 + "px", top: y - 54 + "px", zIndex: y } }, [
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
