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
 * Módulos: cuartos.js (cuartos y acomodo de entrada) · catalogo/ (las cosas, una categoría por archivo)
 * · monito.js (dibujo y ropa) · acciones.js (qué pasa al tocar) · paneles.js (hojitas) · sonidos.js ·
 * sincro.js (servidor) · iconos.js. Para crecer, casi siempre basta con agregar en uno de ellos.
 */
import { el, aviso } from "../ui.js";
import * as PF from "../perfil.js";
import { vibrar } from "../../integraciones/plataforma.js";
import { sinMovimiento as reducido } from "../transiciones.js";
import { H, PISO, FONDO, FRENTE, SUELO, CUARTOS, ANCHO, inicioDe, cuarto, enCuarto, global, casaInicial } from "./cuartos.js";
import { CATALOGO, COSAS_MANO, colorDe } from "./catalogo/index.js";
import { monitoSVG, ropaDe } from "./monito.js";
import { crearSonidos } from "./sonidos.js";
import { ACCIONES, GESTOS, JUNTOS, rebote } from "./acciones.js";
import { Sincro } from "./sincro.js";
import { ICO } from "./iconos.js";
import * as P from "./paneles.js";

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const MAX_OBJETOS = 300;
const POSES = ["sentado", "dormido", "banando", "columpio", "cocinando"];
const nuevoId = () => Math.random().toString(36).slice(2, 10);

export class Casita {
  constructor(app, { pareja = "tu amorcito", volver = null } = {}) {
    this.app = app; this.pareja = pareja; this.volver = volver;
    this.vivo = false; this.objs = new Map(); this.musicas = new Map();
    this.editando = false; this.pila = []; this.cuartoActual = "sala"; this.k = 1; this.offY = 0;
    this.son = crearSonidos(app);
  }

  /* ═════════════ Armar ═════════════ */
  montar(cont) {
    this.vivo = true;
    const d = PF.datos();
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
    this._armarHud();
    cont.replaceChildren(this.raiz);
    this._enlazar();
    this._medir();
    this._ro = new ResizeObserver(() => this._medir());
    this._ro.observe(this.vistaN);
    this.vistaN.addEventListener("scroll", () => {
      if (this.vistaN.scrollTop) this.vistaN.scrollTop = 0;
      cancelAnimationFrame(this._rqS); this._rqS = requestAnimationFrame(() => this._alDeslizar());
    }, { passive: true });
    this._fs = () => { if (!document.fullscreenElement && this._pedida) { this._pedida = false; this._completa(false); } };
    document.addEventListener("fullscreenchange", this._fs);
    requestAnimationFrame(() => this.irCuarto("sala", false));
    this._tiempo();
    this._reloj = setInterval(() => this._tiempo(), 30000);
    this.sync = new Sincro({ alRecibir: (r, p) => (r ? this._recibir(r, p) : this._pintarCasa(this.sync.casa())), alEstado: (t, k) => this._guardado(t, k) });
    this.sync.iniciar();
  }

  limpiar() {
    this.vivo = false;
    this.sync?.parar();
    this._ro?.disconnect();
    clearInterval(this._reloj);
    for (const m of [this.yo, this.suyo]) if (m) { clearTimeout(m.tc); clearTimeout(m.tg); clearInterval(m.tp); clearTimeout(m.tgesto); }
    for (const parar of this.musicas.values()) parar();
    this.musicas.clear();
    document.removeEventListener("fullscreenchange", this._fs);
    if (this.raiz?.classList.contains("completa")) this._completa(false);
    cancelAnimationFrame(this._rqAuto);
  }

  /** Atrás: primero lo que esté abierto (menú, hojita, selección, Acomodar, pantalla completa). */
  atras() {
    if (this.cerrarMenu()) return true;
    if (this.cerrarHoja()) return true;
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
      if (c.afuera) n.append(
        el("div.ca-cielo", {}, [el("i.ca-sol"), el("i.ca-nube.n1"), el("i.ca-nube.n2"), el("i.ca-nube.n3"), el("i.ca-estrellas"), el("i.ca-mariposa.m1"), el("i.ca-mariposa.m2"), el("i.ca-luciernagas")]),
        el("div.ca-lomas"), el("div.ca-cerca"), el("div.ca-camino"),
        el("div.ca-fachada", {}, [el("i.ca-techo"), el("i.ca-fachada-ventana"), el("i.ca-fachada-ventana.v2")]),
      );
      else n.append(el("i.ca-columna"), el("i.ca-techo-r"), c.foco ? el("i.ca-pendiente", { style: { left: c.foco + "px" } }, [el("i.ca-pendiente-luz")]) : null);
      this.mundo.append(n);
      this.cuartosN.set(c.k, n);
      const o = el("i.ca-oscuro." + c.k, { style: { left: inicioDe(c.k) + "px", width: c.w + "px" } });
      this.oscuroN.set(c.k, o);
      this.mundo.append(o);
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
      el("div.ca-hud-der", {}, [boton("decir", "Decir", () => P.decir(this)), boton("vestir", "Vestir", () => this.vestidor()), boton("acomodar", "Acomodar", () => this._editar(true)), this.completaB]),
    ]);
    this.cuartosB = el("div.ca-hud-cuartos", { role: "tablist", "aria-label": "Cuartos" }, CUARTOS.map((c) => el("button.ca-cuarto-b", { type: "button", role: "tab", "aria-label": c.n, title: c.n, dataset: { k: c.k }, html: ICO[c.k] || ICO.corazon, onClick: () => { this.irCuarto(c.k); this.sonar("whoosh", { volumen: 0.5 }); } })));
    this.edCuartoN = el("small");
    this.deshacerB = boton("deshacer", "Deshacer", () => this._deshacer());
    this.edicionN = el("div.ca-edicion", {}, [
      el("div.ca-ed-arriba", {}, [el("div.ca-ed-t", {}, [el("b", { text: "Acomodando" }), this.edCuartoN]), el("span.ca-hueco"), this.deshacerB, boton("listo", "Listo", () => this._editar(false), ".primario")]),
      this.cajonN = P.cajonCatalogo(this),
    ]);
    this.basuraN = el("div.ca-basura", { "aria-hidden": "true" }, [el("i", { html: ICO.borrar }), el("span", { text: "Suelta aquí para quitar" })]);
    this.selN = el("div.ca-sel", { hidden: "" }, [
      el("button.ca-sel-b", { type: "button", "aria-label": "Voltear", title: "Voltear", html: ICO.voltear, onClick: () => this._voltear() }),
      this.selColorB = el("button.ca-sel-b", { type: "button", "aria-label": "Otro color", title: "Otro color", html: ICO.color, onClick: () => this._otroColor() }),
      el("button.ca-sel-b.peligro", { type: "button", "aria-label": "Quitar", title: "Quitar", html: ICO.borrar, onClick: () => { const r = this.sel; if (r) this._borrar(r); } }),
    ]);
    this.volverN = el("button.ca-volver", { type: "button", onClick: () => this._volver() }, [el("i", { html: ICO.volver }), el("span", { text: "Volver atrás" })]);
    this.escena.append(this.hudN, this.cuartosB, this.edicionN, this.basuraN);
    this.raiz.append(this.selN, this.volverN);
  }

  /* ═════════════ Cámara y medidas ═════════════ */
  _medir() {
    const vh = this.vistaN.clientHeight, vw = this.vistaN.clientWidth;
    if (!vh || !vw) return;
    // El alto manda, pero en un teléfono parado no se agranda tanto que no quepa casi nada de un cuarto.
    // (Abajo se deja lugar para los cuartitos (o, al acomodar, para el cajón): ahí se ve el piso, que sigue.)
    const abajo = this.editando ? Math.min(vh * 0.45, (this.cajonN?.offsetHeight || 150) + 18) : 58;
    this.k = lim(Math.min((vh - abajo) / H, vw / 400), 0.42, 1.45);
    this.offY = Math.max(0, vh - abajo - H * this.k);
    this.mundo.style.transform = `translate(0px, ${this.offY.toFixed(1)}px) scale(${this.k.toFixed(4)})`;
    this.mundo.style.setProperty("--techo", (-this.offY / this.k).toFixed(1) + "px");
    this.lienzo.style.width = Math.round(ANCHO * this.k) + "px";
    this.lienzo.style.height = vh + "px";
    this._ubicarSel();
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
    this._marcarOcupados();
    this._musicas();
  }
  _crearObj(o, d) {
    const n = el("div.ca-obj." + d.k + ".capa-" + d.capa, { dataset: { id: o.id }, role: d.al || d.lugares ? "button" : null, "aria-label": d.n, style: { width: d.w + "px", height: d.h + "px" } });
    const r = { o, d, n, fr: null, gx: 0 };
    if (d.frente) { r.fr = el("div.ca-obj-frente." + d.k, { style: { width: d.w + "px", height: d.h + "px" } }); this.mundo.append(r.fr); }
    this._dibujarObj(r, o);
    if (d.dom) n.append(d.dom());
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
    const z = d.capa === "alfombra" ? 3 : d.capa === "pared" ? 10 + Math.round(o.y / 60) : Math.round(o.y);
    for (const n of [r.n, r.fr]) { if (!n) continue; n.style.left = (gx - d.w / 2).toFixed(1) + "px"; n.style.top = (o.y - d.h).toFixed(1) + "px"; n.classList.toggle("f", !!o.f); }
    r.n.style.zIndex = z;
    if (r.fr) r.fr.style.zIndex = z + 2;
  }
  _estadoClases(r) {
    const e = r.o.e || {}, n = r.n;
    for (const c of [...n.classList]) if (c.startsWith("e-") && !e[c.slice(2)]) n.classList.remove(c);
    for (const [k, v] of Object.entries(e)) {
      if (k === "col") continue;
      if (typeof v === "boolean") { n.classList.toggle("e-" + k, v); r.fr?.classList.toggle("e-" + k, v); }
      else n.dataset[k] = String(v);
    }
    if (r.d.luz) n.classList.toggle("apagada", this.cfgCuarto(r.o.c).luz === false);
  }
  _quitarNodo(r) {
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

  /** La música (tocadiscos, cajita): suena si está prendida y estás viendo ese cuarto. */
  _musicas() {
    let quiere = null;
    for (const r of this.objs.values()) if (r.d.musica && r.o.e?.on && r.o.c === this.cuartoActual && !this.editando) { quiere = r; break; }
    for (const [id, parar] of this.musicas) if (id !== quiere?.o.id) { parar(); this.musicas.delete(id); }
    if (quiere && !this.musicas.has(quiere.o.id)) this.musicas.set(quiere.o.id, this.son.musica(quiere.d.musica));
  }
  _tiempo() {
    const h = new Date().getHours();
    this.mundo.classList.toggle("noche", h >= 20 || h < 7);
    this.mundo.classList.toggle("tarde", h >= 18 && h < 20);
    for (const r of this.objs.values()) if (r.d.k === "reloj") this._ponerReloj(r.n);
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
    const nombreN = el("span.ca-mono-nombre", { text: nombre });
    const n = el("div.ca-monito." + quien, { role: "img", "aria-label": nombre, style: { left: gx + "px", top: SUELO + "px", zIndex: SUELO } }, [caja, globo, nombreN]);
    return { quien, n, caja, cuerpo, llevaN, globo, nombreN, gx, y: SUELO, ropa: { ...ropa }, accion: "", mueble: "", lleva: "", mira: 1, orden: 0, t: 0, evAt: 0, dt: 0 };
  }
  _vestirMono(m, ropa) { m.ropa = { ...m.ropa, ...ropa }; m.cuerpo.innerHTML = monitoSVG(m.ropa); }
  _mirar(m, lado) { m.mira = lado < 0 ? -1 : 1; m.n.classList.toggle("izq", m.mira < 0); }
  _visible(m) { const v = this.vistaN, px = m.gx * this.k; return px > v.scrollLeft - 40 && px < v.scrollLeft + v.clientWidth + 40; }
  /** Caminar hasta (gx, y) (y es lo hondo del piso) y luego `luego()`. */
  _caminar(m, gx, y, luego = null, ya = false) {
    clearTimeout(m.tc); clearInterval(m.tp);
    this._pose(m, "");
    gx = lim(gx, 24, ANCHO - 24); y = lim(y, FONDO, FRENTE);
    const d = Math.hypot(gx - m.gx, (y - m.y) * 1.6);
    if (Math.abs(gx - m.gx) > 2) this._mirar(m, gx - m.gx);
    // (Cerquita camina; lejos, corre: cruzar la casa no tarda una eternidad.)
    const vel = lim(d * 0.55, 210, 620), s = ya || reducido() ? 0 : Math.max(0.18, d / vel);
    m.n.classList.toggle("corre", vel > 330);
    m.n.style.transitionDuration = s + "s";
    m.n.style.zIndex = Math.round(Math.max(m.y, y));
    m.n.style.left = gx.toFixed(1) + "px"; m.n.style.top = y.toFixed(1) + "px";
    m.gx = gx; m.y = y;
    m.llega = performance.now() + s * 1000;
    if (s > 0.2) {
      m.n.classList.add("camina");
      if (m.quien === "yo" || this._visible(m)) { let i = 0; m.tp = setInterval(() => this.sonar(i++ % 2 ? "paso" : "paso2", { volumen: m.quien === "yo" ? 0.9 : 0.5 }), vel > 330 ? 170 : 260); }
    }
    m.tc = setTimeout(() => { m.n.classList.remove("camina", "corre"); clearInterval(m.tp); m.n.style.zIndex = Math.round(y); luego?.(); }, s * 1000 + 30);
    if (m.quien === "yo" && !ya) this._seguir(gx);
  }
  _pose(m, pose, mueble = "", z = null) {
    m.accion = pose; m.mueble = mueble;
    m.n.classList.remove(...POSES);
    if (pose) m.n.classList.add(pose);
    if (z != null) m.n.style.zIndex = z;
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
        m.n.style.top = ySit + "px"; m.y = ySit;
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
  async usarLugar(o, jx = null) {
    const r = this.objs.get(o.id);
    if (!r?.d.lugares) return false;
    if (this.sigueEn(o) && jx == null) { this.pararse(); return false; }
    const libres = r.d.lugares.map((_, i) => i).filter((i) => this.suyo.mueble !== `${o.id}:${i}`);
    const j = jx != null && libres.includes(jx) ? jx : libres[0];
    if (j == null) { this.decir("Ya está ocupado", false); this.sonar("nop"); return false; }
    const l = r.d.lugares[j], sx = r.o.f ? -1 : 1;
    const { c, x } = enCuarto(r.gx + l.dx * sx);
    this.sync.yo({ c, x: Math.round(x), y: Math.round(r.o.y + l.dy), mira: l.mira ? l.mira * sx : this.yo.mira, accion: l.pose, mueble: `${o.id}:${j}` });
    const ok = await this._irLugar(this.yo, r, j);
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
  _ponerLleva(m, cosa) {
    m.lleva = COSAS_MANO[cosa] ? cosa : "";
    m.llevaN.hidden = !m.lleva;
    m.llevaN.innerHTML = m.lleva ? COSAS_MANO[cosa].arte : "";
    m.n.classList.toggle("con-cosa", !!m.lleva);
  }
  decir(t, mandar = true) {
    this._globo(this.yo, t);
    if (mandar) { this._mandarYo({ dice: String(t).slice(0, 60) }); this.sonar("pop"); }
  }
  _globo(m, t, ms = 4200) {
    m.globo.classList.remove("zzz");
    m.globo.hidden = false; m.globo.textContent = t;
    m.globo.classList.remove("sale"); void m.globo.offsetWidth; m.globo.classList.add("sale");
    clearTimeout(m.tg);
    m.tg = setTimeout(() => { if (m.accion === "dormido") { m.globo.textContent = "z z z"; m.globo.classList.add("zzz"); } else m.globo.hidden = true; }, ms);
  }
  vestidor() { P.vestidor(this); }
  vestir(r) { this._vestirMono(this.yo, r); clearTimeout(this._tRopa); this._tRopa = setTimeout(() => this._mandarYo({ ropa: { ...this.yo.ropa } }), 500); }
  /** Un gesto (saludar, bailar, brincar, besito, aplaudir, reír). */
  gesto(m, k, mandar = true) {
    const g = GESTOS.find((x) => x[0] === k);
    if (!g) return;
    if (m.accion && k !== "saluda" && k !== "besito" && k !== "rie") { if (m === this.yo) this.pararse(); else this._pose(m, ""); }
    clearTimeout(m.tgesto);
    m.n.classList.remove(...GESTOS.map((x) => "g-" + x[0]));
    void m.n.offsetWidth;
    m.n.classList.add("g-" + k);
    m.tgesto = setTimeout(() => m.n.classList.remove("g-" + k), g[3]);
    if (m === this.yo || this._visible(m)) this.sonar(g[2], { volumen: m === this.yo ? 1 : 0.6 });
    const sobre = { gx: m.gx, y: m.y - 130 };
    if (k === "besito") this.particulas("corazon", sobre, 10 * m.mira, 30, 5);
    if (k === "baila") this.particulas("nota", sobre, 0, 0, 4);
    if (k === "aplaude") this.particulas("chispa", sobre, 0, 40, 5);
    if (mandar) this._mandarYo({ ev: { k: "gesto", t: k } });
  }
  emote(k) { this.gesto(this.yo, k); }
  comer() {
    const m = this.yo, c = COSAS_MANO[m.lleva];
    if (!c?.comible) return;
    clearTimeout(m.tgesto);
    m.n.classList.add("g-come");
    this.sonar("comer");
    this.particulas("migaja", { gx: m.gx + 18 * m.mira, y: m.y - 92 }, 0, 0, 4);
    m.tgesto = setTimeout(() => { m.n.classList.remove("g-come"); this._ponerLleva(m, ""); this._mandarYo({ lleva: "" }); this._globo(m, "¡Qué rico!", 1800); }, 1600);
    this._mandarYo({ ev: { k: "come", t: m.lleva } });
  }
  soltar() { const m = this.yo; if (!m.lleva) return; this._ponerLleva(m, ""); this.sonar("soltar"); this.particulas("polvo", { gx: m.gx, y: m.y }, 0, 0, 3); this._mandarYo({ lleva: "" }); }

  /** Lo que hacen juntos: tu monito va con el de tu amorcito y lo hacen los dos. */
  juntos(k) {
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
    // Abrazo, besito y chócalas: primero se acerca.
    const lado = yo.gx < el2.gx ? -1 : 1, enPiso = !el2.mueble;
    const gx = el2.gx + lado * (k === "choca" ? 58 : 44), y = enPiso ? el2.y : lim(el2.y + 30, FONDO, FRENTE);
    if (yo.mueble) this._pose(yo, "");
    const orden = ++yo.orden;
    this._caminar(yo, gx, y, () => {
      if (yo.orden !== orden || !this.vivo) return;
      this._mirar(yo, -lado);
      this._juntosHacer(k, yo, el2);
    });
    this._mandarYo({ accion: "", mueble: "", ...enCuartoXY(gx, y), mira: -lado, ev: { k, t: "" } });
  }
  _juntosHacer(k, a, b) {
    const clase = { abrazo: "g-abrazo", beso: "g-besito", choca: "g-choca" }[k];
    this.ultimoJuntos = k;
    for (const m of [a, b]) {
      if (m.accion && m.accion !== "sentado") continue;
      clearTimeout(m.tgesto);
      m.n.classList.add(clase);
      m.tgesto = setTimeout(() => m.n.classList.remove(clase), 2300);
    }
    if (!b.mueble) this._mirar(b, a.gx < b.gx ? -1 : 1);
    const medio = { gx: (a.gx + b.gx) / 2, y: Math.min(a.y, b.y) - 120 };
    if (k === "abrazo") { this.sonar("abrazo"); this.particulas("corazon", medio, 0, 0, 7); vibrar(14); }
    if (k === "beso") { this.sonar("beso"); this.particulas("corazon", medio, 0, 10, 9); vibrar(12); }
    if (k === "choca") { this.sonar("aplauso", { volumen: 0.8 }); this.particulas("chispa", medio, 0, 0, 7); vibrar(10); }
  }

  /** Partículas (corazones, burbujas, chispas, notas, vapor, agua, hojas, polvo, migajas…). */
  particulas(tipo, ref, dx = 0, dy = 0, n = 4) {
    if (!this.vivo) return;
    const ultra = document.body.classList.contains("ed-ultra");
    if (reducido()) n = Math.min(n, 1); else if (ultra) n = Math.min(n, 2);
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
      if (this.editando) {
        if (g.obj) { g.off = { dx: g.obj.gx - p.x, dy: g.obj.o.y - p.y }; try { m.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
      } else if (g.mono === this.yo) { try { m.setPointerCapture(e.pointerId); } catch (er) { /* nada */ } }
    });
    m.addEventListener("pointermove", (e) => {
      if (!g || e.pointerId !== g.id) return;
      g.mov = Math.max(g.mov, Math.hypot(e.clientX - g.x0, e.clientY - g.y0));
      if (g.mov < 7) return;
      g.ultimo = e;
      if (this.editando && g.obj) { this._arrastrarObj(g, e); e.preventDefault(); }
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
      // El piso (o la pared): camina hasta ahí.
      const p = this._xy(e);
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
    if (d.al && ACCIONES[d.al]) { ACCIONES[d.al](this, o, r.n); return; }
    if (d.lugares) { this.usarLugar(o); return; }
    rebote(r.n); this.sonar("pop", { volumen: 0.6 });
  }
  _menuYo() {
    const m = this.yo, ops = GESTOS.map(([k, t]) => [k, t, () => this.gesto(m, k)]);
    const c = COSAS_MANO[m.lleva];
    if (c?.comible) ops.unshift(["comer", `Comer ${c.n.toLowerCase()}`, () => this.comer()]);
    if (m.lleva) ops.push(["soltar", "Soltar", () => this.soltar()]);
    if (m.mueble) ops.unshift(["brinca", "Pararme", () => this.pararse()]);
    P.menuMonito(this, m, ops);
  }
  _menuSuyo() {
    const ops = JUNTOS.map(([k, t]) => [k, t, () => this.juntos(k)]);
    if (this.yo.lleva) ops.unshift(["regalo", `Regalarle ${COSAS_MANO[this.yo.lleva].n.toLowerCase()}`, () => this.juntos("regalo")]);
    P.menuMonito(this, this.suyo, ops);
  }
  cerrarMenu() { const n = this.menu; if (!n) return false; this.menu = null; n.classList.remove("ver"); setTimeout(() => n.remove(), 180); return true; }
  cerrarHoja() { const h = this.panel; if (!h) return false; this.panel = null; h.classList.remove("ver"); h.style.transform = ""; setTimeout(() => h.remove(), 260); this.sonar("cerrar", { volumen: 0.5 }); return true; }

  // ── Cargar a tu monito con el dedo ──
  _cargar(g, e) {
    const m = this.yo, p = this._xy(e);
    if (!g.cargando) { g.cargando = true; m.orden++; clearTimeout(m.tc); clearInterval(m.tp); this._pose(m, ""); m.n.classList.remove("camina"); m.n.classList.add("cargado"); m.n.style.transitionDuration = "0s"; vibrar(10); this.sonar("levantar"); }
    const vx = e.movementX || 0;
    m.gx = lim(p.x, 24, ANCHO - 24); m.y = Math.min(FRENTE, p.y + 74);
    m.n.style.left = m.gx + "px"; m.n.style.top = m.y + "px";
    if (Math.abs(vx) > 1) this._mirar(m, vx);
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
    m.n.style.transitionDuration = ".34s"; m.n.style.top = m.y + "px"; m.n.style.zIndex = Math.round(m.y);
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
  agregar(t) {
    const d = CATALOGO[t];
    if (!d) return;
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
    if (r) { r.n.classList.add("sel"); rebote(r.n, "toque"); this.selColorB.hidden = !r.d.colores; this.sonar("pop", { volumen: 0.5 }); }
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
  _otroColor() { const r = this.sel; if (!r?.d.colores) return; this._guardarObj(r, { e: { ...(r.o.e || {}), col: ((r.o.e?.col | 0) + 1) % r.d.colores.length } }, "pop"); rebote(r.n, "toque"); }
  _borrar(r) {
    this.pila.push([{ o: "pon", obj: JSON.parse(JSON.stringify(r.o)) }]);
    this._seleccionar(null);
    this.sonar("poof"); vibrar(14);
    this.particulas("polvo", { gx: r.gx, y: r.o.y - r.d.h / 2 }, 0, 0, 6);
    this.sync.op({ o: "quita", id: r.o.id });
    this._pintarCasa(this.sync.casa());
    this.deshacerB.disabled = false;
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
      this._seleccionar(null);
      r.n.classList.add("levantado"); r.fr?.classList.add("levantado");
      this.basuraN.classList.add("ver");
      this.sonar("levantar"); vibrar(10);
      g.vx = 0;
    }
    let gx = lim(p.x + g.off.dx, d.w * 0.3, ANCHO - d.w * 0.3), y = p.y + g.off.dy;
    if (d.capa === "pared") y = lim(y, d.h + 8, PISO - 6);
    else if (d.capa === "alfombra") y = lim(y, FONDO + 24, H);
    else y = lim(y, FONDO, FRENTE + 4);
    g.vx = 0.7 * g.vx + 0.3 * (gx - (g.gx ?? gx));
    g.gx = gx; g.y = y;
    for (const n of [r.n, r.fr]) { if (!n) continue; n.style.left = gx - d.w / 2 + "px"; n.style.top = y - d.h + "px"; n.style.setProperty("--incl", lim(g.vx * 1.4, -9, 9).toFixed(1) + "deg"); }
    r.n.style.zIndex = 9000; if (r.fr) r.fr.style.zIndex = 9001;
    const B = this.basuraN.getBoundingClientRect();
    g.basura = e.clientX >= B.left - 10 && e.clientX <= B.right + 10 && e.clientY >= B.top - 14 && e.clientY <= B.bottom + 10;
    this.basuraN.classList.toggle("encima", g.basura);
    r.n.classList.toggle("a-la-basura", g.basura);
    this._autoDeslizar(e);
  }
  _soltarObj(g) {
    const r = g.obj;
    this.arrastrandoId = null;
    this.raiz.classList.remove("arrastrando");
    this.basuraN.classList.remove("ver", "encima");
    for (const n of [r.n, r.fr]) { if (!n) continue; n.classList.remove("levantado", "a-la-basura"); n.style.removeProperty("--incl"); }
    if (g.basura) { this._colocar(r); this._borrar(r); return; }
    if (g.gx == null) { this._colocar(r); return; }
    const { c, x } = enCuarto(g.gx);
    this._guardarObj(r, { c, x: Math.round(x), y: Math.round(g.y) }, "soltar");
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
    // La casa: la primera vez (o si era la de antes), se arma la de entrada.
    if (!r.casa?.objetos?.length && !this._iniciada) { this._iniciada = true; this.sync.op({ o: "iniciar", casa: casaInicial(r.casa) }); }
    this._pintarCasa(this.sync.casa());
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
    }
    const p = r.pareja, m = this.suyo;
    if (!p) return;
    const ropa = JSON.stringify(p.ropa || null);
    if (p.ropa && ropa !== m._ropaVista) { m._ropaVista = ropa; this._vestirMono(m, p.ropa); }
    if (p.t !== m.t && p.c && CUARTOS.some((c) => c.k === p.c)) {
      m.t = p.t;
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
    if (ev.k === "gesto") setTimeout(() => this.gesto(m, ev.t, false), espera);
    else if (ev.k === "come") { m.n.classList.add("g-come"); setTimeout(() => m.n.classList.remove("g-come"), 1600); if (this._visible(m)) this.sonar("comer", { volumen: 0.6 }); }
    else if (ev.k === "bailemos") { this.gesto(m, "baila", false); if (!yo.mueble) this.gesto(yo, "baila", false); this._globo(m, "¡Bailemos!", 1800); }
    else if (ev.k === "abrazo" || ev.k === "beso" || ev.k === "choca") setTimeout(() => { this._mirar(m, yo.gx < m.gx ? -1 : 1); this._juntosHacer(ev.k, m, yo); }, espera);
    else if (ev.k === "regalo" && COSAS_MANO[ev.t]) {
      this._volar(ev.t, m.gx, m.y - 60, yo.gx, yo.y - 60);
      setTimeout(() => {
        if (!this.vivo) return;
        this.sonar("regalo"); this.particulas("corazon", { gx: yo.gx, y: yo.y - 130 }, 0, 0, 6);
        aviso(`${this.pareja} te regaló ${COSAS_MANO[ev.t].n.toLowerCase()}`, 3000);
        if (!yo.lleva) { this._ponerLleva(yo, ev.t); this._mandarYo({ lleva: ev.t }); }
      }, 520);
    }
  }
}

const enCuartoXY = (gx, y) => { const { c, x } = enCuarto(gx); return { c, x: Math.round(x), y: Math.round(y) }; };
