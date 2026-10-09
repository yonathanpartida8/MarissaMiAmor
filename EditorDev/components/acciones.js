/**
 * ACCIONES — lo que se puede hacer, en un solo sitio.
 *
 * Los botones del panel, la barrita flotante, el teclado y el menú de cada
 * página llaman a estas mismas funciones: así «duplicar» hace lo mismo se
 * pida desde donde se pida.
 */
import { el, aviso, confirmar, menu } from "./ui.js";
import { nuevoEl, nuevaPagina, clonar, uid, TIPOS } from "../core/modelo.js";
import { elegir } from "../assets/selector.js";
import { DIBUJOS } from "../assets/dibujos.js";
import { cajaDe, union } from "../canvas/guias.js";
import { analizar } from "../componentes/analizar.js";
import { rutaAUrl, elegirArchivos } from "../assets/biblioteca.js";
import { ico } from "./iconos.js";

const RT = window.LibritoRT;

/* ── Trazos a mano: puntos ↔ curva suave ─────────────────────────── */
const r1 = (v) => (Math.round(v * 10) / 10).toString();
/** Curva suave por los puntos (cuadráticas por los puntos medios). `p` = [x, y, x, y…]. */
export function dDeTrazo(p) {
  const n = p.length / 2;
  if (n < 2) return "";
  let d = `M${r1(p[0])} ${r1(p[1])}`;
  for (let i = 1; i < n - 1; i++) d += `Q${r1(p[i * 2])} ${r1(p[i * 2 + 1])} ${r1((p[i * 2] + p[i * 2 + 2]) / 2)} ${r1((p[i * 2 + 1] + p[i * 2 + 3]) / 2)}`;
  return d + `L${r1(p[(n - 1) * 2])} ${r1(p[(n - 1) * 2 + 1])}`;
}
const muestras = new Map();
/** Los puntos de un trazo (los guardados o, para trazos viejos, sacados de su curva). */
export function puntosDeTrazo(t) {
  if (Array.isArray(t.pts) && t.pts.length >= 4) return t.pts;
  if (muestras.has(t.d)) return muestras.get(t.d);
  let svg = document.getElementById("ed-muestreo");
  if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "ed-muestreo"; svg.setAttribute("aria-hidden", "true"); svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden"; document.body.append(svg); }
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", String(t.d || "M0 0"));
  svg.append(path);
  const L = path.getTotalLength(), r = [];
  for (let s = 0; s <= L; s += 2) { const q = path.getPointAtLength(s); r.push(q.x, q.y); }
  path.remove();
  if (muestras.size > 200) muestras.clear();
  muestras.set(t.d, r);
  return r;
}
/** Mete puntos intermedios para que ningún tramo sea más largo que `paso`. */
function densificar(p, paso) {
  const r = [p[0], p[1]];
  for (let i = 2; i < p.length; i += 2) {
    const x0 = r[r.length - 2], y0 = r[r.length - 1], x = p[i], y = p[i + 1], d = Math.hypot(x - x0, y - y0);
    const n = Math.min(64, Math.floor(d / Math.max(0.5, paso)));
    for (let k = 1; k <= n; k++) r.push(x0 + ((x - x0) * k) / (n + 1), y0 + ((y - y0) * k) / (n + 1));
    r.push(x, y);
  }
  return r;
}

export class Acciones {
  constructor(app) {
    this.app = app;
    this.E = app.estado;
    this.portapapeles = null;
    this.escalon = 0;
  }

  get P() { return this.E.proyecto; }
  get tema() { return this.P.ajustes.tema; }

  /* ── Añadir ─────────────────────────────────────────────────────── */
  _poner(el_) {
    // Lo nuevo aparece en el centro de lo que se ve (con la hoja automática,
    // donde se ve en esta pantalla), un poquito corrido si ya hay algo ahí.
    const L = this.app.lienzo;
    if (!this.E.pagina) this.nuevaPagina();
    if (L && el_.tipo !== "pagina") L.colocarNuevo(el_);
    this.E.agregarEl(el_);
    this.app.alAnadir?.();
    if (el_.tipo === "texto") requestAnimationFrame(() => L?.ajustarAlto(el_.id));
    return el_;
  }

  agregar(tipo, datos = {}) { return this._poner(nuevoEl(tipo, this.P, datos)); }

  texto(estilo = "titulo") {
    const t = this.tema;
    const P = {
      titulo: { nombre: "Título", w: 330, texto: { html: "Mi amor", fuente: t.fuenteTitulos || t.fuente, tam: 46, peso: 600, color: t.texto } },
      subtitulo: { nombre: "Subtítulo", w: 300, texto: { html: "para ti, con todo mi corazón", fuente: t.fuente, tam: 24, peso: 400, cursiva: true, color: t.texto } },
      parrafo: { nombre: "Párrafo", w: 320, texto: { html: "Escribe aquí lo que sientes. Puedes poner varias líneas, cambiar la letra, el color y el tamaño.", fuente: "Jost", tam: 17, peso: 400, alin: "left", interlinea: 1.55, color: t.texto } },
      mano: { nombre: "A mano", w: 300, texto: { html: "te amo muchísimo", fuente: "Caveat", tam: 34, peso: 500, color: t.acento } },
      cita: { nombre: "Frase", w: 320, texto: { html: "«Contigo hasta lo pequeño se siente enorme»", fuente: "Cormorant Garamond", tam: 28, peso: 500, cursiva: true, color: t.texto, interlinea: 1.25 } },
      etiqueta: { nombre: "Etiqueta", w: 180, texto: { html: "NUESTRA HISTORIA", fuente: "Jost", tam: 13, peso: 500, interletra: 3, color: t.acento } },
    }[estilo];
    return this.agregar("texto", { nombre: P.nombre, w: P.w, h: 60, texto: { ...P.texto } });
  }

  async foto() {
    const ids = await elegir(this.app, "imagen", { multiple: true, titulo: "Añadir fotos" });
    let ult = null;
    for (const id of ids) ult = this._poner(this._elFoto(id));
    if (ids.length > 1) this.E.seleccionar([]);
    return ult;
  }

  _elFoto(id) {
    const a = this.P.assets[id] || {};
    const max = Math.min(300, this.P.ajustes.ancho - 60);
    const k = a.w && a.h ? a.w / a.h : 0.8;
    const w = k >= 1 ? max : Math.round(max * Math.max(0.55, k));
    const h = Math.round(w / k);
    return nuevoEl("imagen", this.P, { nombre: a.nombre || "Foto", w, h, imagen: { asset: id } });
  }

  marcoFoto() { return this.agregar("imagen", { nombre: "Marco para foto" }); }
  album() { return this.agregar("album", { nombre: "Álbum" }); }
  carrusel() { return this.agregar("carrusel", { nombre: "Carrusel" }); }
  forma(figura) { return this.agregar("forma", { nombre: "Forma", forma: { figura }, ...(figura === "linea" ? { h: 20, w: 220 } : {}) }); }
  boton() { return this.agregar("boton", { nombre: "Botón" }); }
  html() { const e = this.agregar("html", { nombre: "Bloque HTML" }); this.app.html.abrir(e, { nuevo: true }); return e; }

  /** Una página HTML entera, pegada en un solo bloque (ocupa toda la hoja). */
  async htmlCompleto(desdeArchivo) {
    let codigo = "";
    if (desdeArchivo) {
      const [f] = await elegirArchivos({ accept: ".html,.htm,text/html", multiple: false });
      if (!f) return null;
      codigo = await f.text();
    }
    const L = this.app.lienzo;
    const e = nuevoEl("html", this.P, { nombre: "Página HTML", html: { codigo, interactivo: true, completo: true } });
    Object.assign(e, L.guardarCaja(e, { x: 0, y: 0, w: L.W, h: L.H }, false), { ancla: { h: "estirar", v: "estirar" } });
    if (!this.E.pagina) this.nuevaPagina();
    this.E.agregarEl(e);
    this.app.alAnadir?.();
    this.app.html.abrir(this.E.el(e.id), { nuevo: !codigo });
    return e;
  }

  /** Una escena 3D (WebGL2): una figura o un modelo. */
  escena3d(op = {}) {
    const d = { ...op };
    const nombre = op.fuente === "archivo" ? this.P.assets[op.asset]?.nombre || "Modelo 3D" : RT.FIGURAS3D?.[op.figura] ? "3D · " + RT.FIGURAS3D[op.figura] : "Escena 3D";
    if (op.fuente === "archivo" && op.formato !== "obj") d.colores = "propios";
    return this.agregar("escena3d", { nombre, escena3d: d });
  }

  async modelo3d() {
    const [id] = await elegir(this.app, "modelo", { titulo: "Modelo 3D" });
    if (!id) return null;
    const a = this.P.assets[id] || {};
    return this.escena3d({ fuente: "archivo", asset: id, formato: (a.archivo || a.ruta || "").split(".").pop().toLowerCase() });
  }

  dibujo(id) {
    const d = DIBUJOS.find((x) => x.id === id);
    if (!d) return null;
    return this.agregar("dibujo", { nombre: d.n, dibujo: { svg: d.svg, color: this.tema.acento } });
  }

  /** Un componente de assets/: se analiza (sin tocarlo) y se pone en la hoja. */
  async componente(it) {
    const espera = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("p", { text: `Preparando «${it.nombre}»…` })])]);
    document.body.append(espera);
    try {
      const an = await analizar(rutaAUrl(it.ruta + (it.entrada || "index.html")), { ancho: it.ancho, alto: it.alto, aislado: it.aislado });
      const W = this.P.ajustes.ancho, H = this.P.ajustes.alto;
      let w = an.natural.w, h = an.natural.h;
      const k = Math.min(1, (W - 20) / w, (H - 20) / h);
      w = Math.round(w * k); h = Math.round(h * k);
      const params = {};
      for (const d of it.parametros || []) if (d.def != null && d.tipo !== "imagen" && d.tipo !== "audio") params[d.id] = d.def;
      const e = nuevoEl("componente", this.P, {
        nombre: it.nombre, w, h,
        componente: { id: it.id, ruta: it.ruta, entrada: it.entrada || "index.html", ancho: an.natural.w, alto: an.natural.h, parametros: it.parametros || [], params, decorativo: !!it.decorativo, aislado: !!it.aislado, miniatura: it.miniatura || null, analisis: an },
      });
      if (w >= W - 20 && h >= H - 20) { e.x = Math.round((W - w) / 2); e.y = Math.round((H - h) / 2); }
      this._poner(e);
      if (e.w >= W - 20 && e.h >= H - 20) this.E.setEl(e.id, { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2) }, "Centrar");
      if (an.resumen) aviso(`${it.nombre}: ${an.resumen}`);
      return e;
    } finally { espera.remove(); }
  }

  /** Volver a mirar un componente (si cambió su archivo). */
  async reanalizar(e) {
    const k = e.componente;
    const an = await analizar(rutaAUrl(k.ruta + (k.entrada || "index.html")), { ancho: k.ancho, alto: k.alto, aislado: k.aislado });
    this.E.setEl(e.id, { "componente.analisis": an }, "Detectar zona táctil");
    aviso(an.resumen || "Listo");
  }

  /** Una imagen o adorno de assets/ (no se copia: se apunta a ella). */
  imagenCatalogo(it) {
    const a = this.app.bib.delLibrito(it.ruta, "imagen", it.nombre, { w: it.ancho || 0, h: it.alto || 0 });
    const max = 160;
    const k = it.ancho && it.alto ? Math.min(max / it.ancho, max / it.alto) : 1;
    const w = it.ancho ? Math.round(it.ancho * k) : max, h = it.alto ? Math.round(it.alto * k) : max;
    return this._poner(nuevoEl("imagen", this.P, { nombre: it.nombre, w, h, imagen: { asset: a.id, ajuste: "contain" } }));
  }

  /* ── Tarjetas (varios elementos ya agrupados) ───────────────────── */
  tarjeta(tipo) {
    const t = this.tema;
    const g = uid("g");
    const W = this.P.ajustes.ancho;
    const T = (html, x, y, w, h, op) => nuevoEl("texto", this.P, { grupo: g, x, y, w, h, nombre: op.nombre || "Texto", texto: { html, fuente: op.fuente || t.fuente, tam: op.tam || 22, peso: op.peso || 500, cursiva: !!op.cursiva, alin: op.alin || "center", color: op.color || t.texto, interlinea: op.interlinea || 1.3 } });
    const F = (x, y, w, h, op) => nuevoEl("forma", this.P, { grupo: g, x, y, w, h, rot: op.rot || 0, nombre: op.nombre || "Fondo", caja: op.caja || {}, forma: { figura: "rect", relleno: op.relleno, grosor: op.grosor || 0, trazo: op.trazo || t.texto } });
    const cx = (W - 280) / 2;
    const y0 = 220;
    const recetas = {
      nota: () => [
        F(cx + 30, y0, 220, 200, { nombre: "Nota adhesiva", relleno: "#fff2a8", rot: -3, caja: { sombra: { x: 4, y: 8, blur: 14, color: "rgba(80,60,0,.22)" } } }),
        T("no olvides que te amo", cx + 50, y0 + 60, 180, 90, { nombre: "Nota", fuente: "Caveat", tam: 30, color: "#5b4224" }),
      ],
      romantica: () => [
        F(cx, y0, 280, 230, { nombre: "Tarjeta", relleno: "#fffaf6", caja: { radio: 22, borde: { ancho: 2, color: "#f2b6cc", estilo: "dashed" }, sombra: { x: 0, y: 10, blur: 26, color: "rgba(120,40,80,.18)" } } }),
        T("Para ti", cx + 20, y0 + 30, 240, 50, { nombre: "Título", fuente: t.fuenteTitulos, tam: 38, peso: 600, color: t.acento }),
        T("Escribe aquí algo bonito, corto y verdadero.", cx + 30, y0 + 96, 220, 90, { nombre: "Texto", tam: 20, cursiva: true }),
      ],
      boleto: () => [
        F(cx, y0, 280, 130, { nombre: "Boleto", relleno: "#ffe3ec", caja: { radio: 10, borde: { ancho: 3, color: t.texto, estilo: "dashed" } } }),
        T("ADMITE: 2", cx + 20, y0 + 18, 240, 30, { nombre: "Arriba", fuente: "Jost", tam: 15, peso: 600, color: t.texto }),
        T("Cita contigo", cx + 20, y0 + 50, 240, 50, { nombre: "Boleto", fuente: "Caveat", tam: 40, peso: 600, color: t.acento }),
      ],
      polaroid: () => [
        nuevoEl("imagen", this.P, { grupo: g, nombre: "Foto", x: cx + 40, y: y0, w: 200, h: 220, rot: -2, imagen: { marco: "polaroid" } }),
        T("nosotros", cx + 40, y0 + 186, 200, 40, { nombre: "Pie de foto", fuente: "Caveat", tam: 28, color: t.texto }),
      ],
      sobre: () => [
        F(cx + 10, y0, 260, 170, { nombre: "Sobre", relleno: "#fbe7d3", caja: { radio: 8, sombra: { x: 0, y: 8, blur: 18, color: "rgba(90,50,30,.2)" } } }),
        nuevoEl("dibujo", this.P, { grupo: g, nombre: "Solapa", x: cx + 10, y: y0, w: 260, h: 100, dibujo: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 0L50 36L100 0Z" fill="currentColor"/></svg>', color: "#f3cfae", estirar: true } }),
        nuevoEl("dibujo", this.P, { grupo: g, nombre: "Sello", x: cx + 118, y: y0 + 64, w: 44, h: 44, dibujo: { svg: DIBUJOS.find((d) => d.id === "corazon").svg, color: "#d8397a" } }),
      ],
    };
    const els = (recetas[tipo] || recetas.romantica)();
    this.E.transaccion("Añadir tarjeta", () => { for (const x of els) this.E.agregarEl(x, null, this.E.paginaId, false); });
    this.E.seleccionar(els.map((x) => x.id));
    this.app.alAnadir?.();
  }

  agrupar() {
    const sel = this.E.seleccionados;
    if (sel.length < 2) return;
    const g = uid("g");
    this.E.transaccion("Agrupar", () => { for (const e of sel) this.E.setEl(e.id, { grupo: g }); });
    aviso("Agrupados: se mueven juntos (doble toque para editar uno)");
  }

  desagrupar() {
    const sel = this.E.seleccionados.filter((e) => e.grupo);
    if (!sel.length) return;
    this.E.transaccion("Desagrupar", () => { for (const e of sel) this.E.setEl(e.id, { grupo: null }); });
  }

  async video() {
    const [id] = await elegir(this.app, "video");
    if (!id) return null;
    return this.videoDe(id);
  }

  videoDe(id) {
    const a = this.P.assets[id] || {};
    const w = Math.min(330, this.P.ajustes.ancho - 40);
    const h = a.w && a.h ? Math.round((w * a.h) / a.w) : Math.round(w * 0.6);
    return this._poner(nuevoEl("video", this.P, { nombre: a.nombre || "Vídeo", w, h, video: { asset: id } }));
  }

  paginaOriginal(ruta, titulo) {
    return this._poner(nuevoEl("pagina", this.P, { nombre: titulo || "Página original", pagina: { ruta, titulo }, bloqueado: false }));
  }

  /**
   * Un trazo del lápiz. Es DIBUJO, no un objeto: no se elige tocándolo (así
   * nunca tapa ni se lleva por delante lo de debajo). Se borra con el
   * borrador; si quieres moverlo, «Elegir el dibujo» en las opciones del lápiz
   * o desde Capas. Guarda sus puntos para que el borrador pueda cortarlo.
   */
  crearTrazo(pts, op) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    const pad = op.grosor;
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const w = Math.max(4, x1 - x0), h = Math.max(4, y1 - y0);
    const plano = [];
    for (const p of pts) plano.push(Math.round((p.x - x0) * 10) / 10, Math.round((p.y - y0) * 10) / 10);
    const e = nuevoEl("trazo", this.P, {
      nombre: "Dibujo", x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h),
      permisos: { seleccionar: false },
      trazo: { d: dDeTrazo(plano), pts: plano, vw: Math.round(w), vh: Math.round(h), color: op.color, grosor: op.grosor, libre: true },
    });
    this.E.agregarEl(e, null, this.E.paginaId, false);
  }

  /**
   * El borrador en el punto `p` (mundo) con radio `r`: corta los trazos que
   * toca (sólo trazos; las fotos, textos y demás no se tocan). Devuelve si
   * cambió algo. Va dentro del gesto del borrador (un solo paso de deshacer).
   */
  borrarTrazos(p, r) {
    const E = this.E, els = E.pagina?.els || [];
    let cambio = false;
    for (let i = els.length - 1; i >= 0; i--) {
      const e = els[i];
      if (e.tipo !== "trazo" || e.oculto || e.bloqueado || !e.trazo) continue;
      // Al sistema del trazo (deshaciendo su giro alrededor del centro).
      const a = (-(e.rot || 0) * Math.PI) / 180, dx = p.x - (e.x + e.w / 2), dy = p.y - (e.y + e.h / 2);
      const lx = dx * Math.cos(a) - dy * Math.sin(a) + e.w / 2, ly = dx * Math.sin(a) + dy * Math.cos(a) + e.h / 2;
      const g = (e.trazo.grosor || 4) / 2;
      if (lx < -r - g || ly < -r - g || lx > e.w + r + g || ly > e.h + r + g) continue;
      const kx = (e.trazo.vw || e.w) / e.w, ky = (e.trazo.vh || e.h) / e.h;
      const qx = lx * kx, qy = ly * ky, rr = (r + g) * (kx + ky) / 2;
      const pts = densificar(puntosDeTrazo(e.trazo), rr / 2);
      const tramos = [];
      let t = [];
      for (let j = 0; j < pts.length; j += 2) {
        if (Math.hypot(pts[j] - qx, pts[j + 1] - qy) > rr) t.push(pts[j], pts[j + 1]);
        else if (t.length) { tramos.push(t); t = []; }
      }
      if (t.length) tramos.push(t);
      const total = tramos.reduce((n, x) => n + x.length, 0);
      if (total === pts.length) continue; // no lo tocó
      cambio = true;
      const vivos = tramos.filter((x) => x.length >= 4);
      if (!vivos.length) { E.quitarEls([e.id]); continue; }
      const poner = (x) => ({ "trazo.pts": x.map((v) => Math.round(v * 10) / 10), "trazo.d": dDeTrazo(x) });
      E.setEl(e.id, poner(vivos[0]), "Borrador", "borrador" + e.id);
      for (let k = 1; k < vivos.length; k++) {
        const c = clonar(e);
        c.id = uid("e");
        Object.assign(c.trazo, { pts: poner(vivos[k])["trazo.pts"], d: dDeTrazo(vivos[k]) });
        E.agregarEl(c, i + k, E.paginaId, false);
      }
    }
    return cambio;
  }

  /** «+ Añadir foto» dentro de un elemento (o reemplazarla). */
  async pedirArchivoPara(e) {
    if (e.tipo === "imagen") {
      const [id] = await elegir(this.app, "imagen", { titulo: e.imagen?.asset ? "Cambiar la foto" : "Añadir foto" });
      if (id) this.E.setEl(e.id, { "imagen.asset": id, "imagen.recorte": { x: 50, y: 50, zoom: 1 } }, "Poner foto");
    } else if (e.tipo === "video") {
      const [id] = await elegir(this.app, "video");
      if (id) this.E.setEl(e.id, { "video.asset": id }, "Poner vídeo");
    } else if (e.tipo === "album" || e.tipo === "carrusel") {
      const ids = await elegir(this.app, "imagen", { multiple: true, titulo: "Añadir fotos" });
      if (ids.length) this.E.setEl(e.id, { [e.tipo + ".fotos"]: [...(e[e.tipo].fotos || []), ...ids] }, "Añadir fotos");
    }
  }

  editarHtml(e) { this.app.html.abrir(e); }

  /* ── Editar lo seleccionado ─────────────────────────────────────── */
  duplicar() { if (this.E.sel.length) this.E.duplicarEls(this.E.sel); }
  borrar() { if (this.E.sel.length) this.E.quitarEls(this.E.sel); }

  copiar() {
    const s = this.E.seleccionados;
    if (!s.length) return;
    this.portapapeles = clonar(s);
    this.escalon = 0;
    this.app.herramientas?.pintar();
    aviso(s.length > 1 ? `Copiaste ${s.length} elementos` : "Copiado");
  }

  cortar() { this.copiar(); this.borrar(); }

  pegar() {
    if (!this.portapapeles) return;
    this.escalon += 16;
    const ids = [];
    this.E.transaccion("Pegar", () => {
      for (const e of this.portapapeles) {
        const c = clonar(e);
        c.id = uid("e"); c.x += this.escalon; c.y += this.escalon; c.origen = null;
        this.E.agregarEl(c, null, this.E.paginaId, false);
        ids.push(c.id);
      }
    });
    this.E.seleccionar(ids);
  }

  capa(modo) {
    const els = this.E.pagina.els;
    const sel = this.E.seleccionados;
    if (!sel.length) return;
    this.E.transaccion("Cambiar capa", () => {
      const lista = modo === "subir" || modo === "frente" ? [...sel].reverse() : sel;
      for (const e of lista) {
        const i = els.indexOf(e);
        const a = modo === "frente" ? els.length - 1 : modo === "fondo" ? 0 : modo === "subir" ? i + 1 : i - 1;
        this.E.moverCapa(e.id, a);
      }
    });
  }

  alternar(prop) {
    const sel = this.E.seleccionados;
    if (!sel.length) return;
    const v = !sel.every((e) => e[prop]);
    this.E.transaccion(prop === "bloqueado" ? (v ? "Bloquear" : "Desbloquear") : v ? "Ocultar" : "Mostrar", () => {
      for (const e of sel) this.E.setEl(e.id, { [prop]: v });
    });
    if (prop === "oculto" && v) this.E.seleccionar([]);
  }

  /** Alinear: con uno solo, respecto a la hoja; con varios, entre ellos. */
  alinear(modo) {
    const sel = this.E.seleccionados.filter((e) => !e.bloqueado);
    if (!sel.length) return;
    // Con lo que se ve en esta pantalla (la hoja automática puede ser más grande que su zona segura).
    const L = this.app.lienzo;
    const vis = (e) => cajaDe(L.vis(e));
    const ref = sel.length > 1 ? union(sel.map(vis)) : { x: 0, y: 0, w: L.W, h: L.H };
    this.E.transaccion("Alinear", () => {
      for (const e of sel) {
        const b = vis(e);
        let dx = 0, dy = 0;
        if (modo === "izq") dx = ref.x - b.x;
        if (modo === "centroH") dx = ref.x + ref.w / 2 - (b.x + b.w / 2);
        if (modo === "der") dx = ref.x + ref.w - (b.x + b.w);
        if (modo === "arriba") dy = ref.y - b.y;
        if (modo === "centroV") dy = ref.y + ref.h / 2 - (b.y + b.h / 2);
        if (modo === "abajo") dy = ref.y + ref.h - (b.y + b.h);
        if (dx || dy) this.E.setEl(e.id, { x: Math.round(e.x + dx), y: Math.round(e.y + dy) });
      }
    });
  }

  distribuir(eje) {
    const sel = this.E.seleccionados.filter((e) => !e.bloqueado);
    if (sel.length < 3) { aviso("Elige 3 o más para repartirlos"); return; }
    const k = eje === "h" ? ["x", "w"] : ["y", "h"];
    const vis = (e) => cajaDe(this.app.lienzo.vis(e));
    const orden = [...sel].sort((a, b) => vis(a)[k[0]] - vis(b)[k[0]]);
    const cs = orden.map(vis);
    const total = cs.reduce((s, c) => s + c[k[1]], 0);
    const ini = cs[0][k[0]], fin = cs[cs.length - 1][k[0]] + cs[cs.length - 1][k[1]];
    const hueco = (fin - ini - total) / (cs.length - 1);
    let pos = ini;
    this.E.transaccion("Repartir", () => {
      orden.forEach((e, i) => {
        const d = pos - cs[i][k[0]];
        this.E.setEl(e.id, { [k[0]]: Math.round(e[k[0]] + d) });
        pos += cs[i][k[1]] + hueco;
      });
    });
  }

  menuAlinear(ancla) {
    const muchos = this.E.sel.length > 1;
    const t = (i, x) => `${ico(i)}<span>${x}</span>`;
    menu(ancla, [
      { t: t("izqA", "Izquierda"), al: () => this.alinear("izq") },
      { t: t("alinearH", "Centro"), al: () => this.alinear("centroH") },
      { t: t("derA", "Derecha"), al: () => this.alinear("der") },
      "-",
      { t: t("arribaA", "Arriba"), al: () => this.alinear("arriba") },
      { t: t("centroV", "En medio"), al: () => this.alinear("centroV") },
      { t: t("abajoA", "Abajo"), al: () => this.alinear("abajo") },
      muchos ? "-" : null,
      muchos ? { t: t("repartir", "Repartir a lo ancho"), al: () => this.distribuir("h") } : null,
      muchos ? { t: t("repartir", "Repartir a lo alto"), al: () => this.distribuir("v") } : null,
    ]);
  }

  /** La barrita que flota sobre lo seleccionado. */
  barraFlotante(f, sel) {
    const firma = sel.map((e) => e.id + e.bloqueado + e.tipo).join();
    if (f._firma === firma) return;
    f._firma = firma;
    f.textContent = "";
    const b = (html, titulo, al, clase = "") => el("button" + (clase ? "." + clase : ""), { type: "button", html, title: titulo, "aria-label": titulo, onClick: (ev) => { ev.stopPropagation(); al(ev); } });
    const uno = sel.length === 1 ? sel[0] : null;
    const bloq = sel.every((e) => e.bloqueado);
    if (uno && !bloq) {
      if (uno.tipo === "texto") f.append(b(ico("editar"), "Escribir", () => this.app.lienzo.editarTexto(uno)));
      if (uno.tipo === "imagen") f.append(b(ico(uno.imagen?.asset ? "cambiar" : "mas"), uno.imagen?.asset ? "Cambiar foto" : "Añadir foto", () => this.pedirArchivoPara(uno)));
      if (uno.tipo === "imagen" && uno.imagen?.asset) f.append(b(ico("recortar"), "Recortar / encuadrar", () => this.app.lienzo.recortar(uno)));
      if (uno.tipo === "album" || uno.tipo === "carrusel") f.append(b(ico("mas"), "Añadir fotos", () => this.pedirArchivoPara(uno)));
      if (uno.tipo === "html") f.append(b(ico("html"), "Editar HTML", () => this.editarHtml(uno)));
    }
    if (sel.length > 1 && !sel.every((e) => e.grupo && e.grupo === sel[0].grupo)) f.append(b(ico("enlazar"), "Agrupar", () => this.agrupar()));
    if (sel.some((e) => e.grupo)) f.append(b(ico("desenlazar"), "Desagrupar", () => this.desagrupar()));
    if (uno && /componente|html|pagina|escena3d/.test(uno.tipo)) f.append(b(ico("play"), "Probar aquí (tocarlo de verdad)", () => this.app.lienzo.probarAqui(uno)));
    // Lo de todos los días, a la vista: copiar, cortar, duplicar y eliminar.
    if (!bloq) {
      f.append(el("i.ed-flot-sep"));
      f.append(b(ico("copiar"), "Copiar (Ctrl+C)", () => this.copiar()));
      f.append(b(ico("tijeras"), "Cortar (Ctrl+X)", () => this.cortar()));
      f.append(b(ico("duplicar"), "Duplicar (Ctrl+D)", () => this.duplicar()));
    }
    // Lo demás, agrupado en «Más» (capas, alinear, animar, bloquear).
    const mas = b(ico("puntos"), "Más opciones", (ev) => menu(ev.currentTarget, [
      ...(bloq ? [] : [
        { t: `${ico("subirCapa")}<span>Traer adelante</span>`, al: () => this.capa("subir") },
        { t: `${ico("bajarCapa")}<span>Llevar atrás</span>`, al: () => this.capa("bajar") },
        { t: `${ico("alinearH")}<span>Alinear…</span>`, al: () => this.menuAlinear(mas) },
        { t: `${ico("animar")}<span>Animar</span>`, al: () => this.app.insp.abrir("animar") },
        { t: `${ico("luz")}<span>Luz y color</span>`, al: () => this.app.ajustes?.abrir(sel[0].id) },
      ]),
      { t: `${ico(bloq ? "abierto" : "candado")}<span>${bloq ? "Desbloquear" : "Bloquear"}</span>`, al: () => this.alternar("bloqueado") },
    ]));
    f.append(mas);
    if (!bloq) {
      const n = sel.length;
      f.append(el("button.peligro.ed-flot-borrar", { type: "button", title: n > 1 ? `Eliminar los ${n} (Supr)` : "Eliminar (Supr)", "aria-label": "Eliminar", html: `${ico("borrar")}${n > 1 ? `<small>${n}</small>` : ""}`, onClick: (ev) => { ev.stopPropagation(); this.borrar(); } }));
    }
  }

  /* ── Páginas ────────────────────────────────────────────────────── */
  nuevaPagina(pagina, i) {
    const p = pagina || nuevaPagina(this.P, { nombre: "Página " + (this.P.orden.length + 1) });
    const pos = i ?? (this.E.paginaId ? this.P.orden.indexOf(this.E.paginaId) + 1 : this.P.orden.length);
    this.E.agregarPagina(p, pos);
    return p;
  }

  async borrarPagina(pid = this.E.paginaId) {
    const p = this.P.paginas[pid];
    if (!p) return;
    if (p.els.length && !(await confirmar(`Se borrará «${p.nombre}» con todo lo que tiene. Puedes deshacerlo con «Deshacer».`, "Borrar página"))) return;
    this.E.quitarPagina(pid);
    if (!this.P.orden.length) this.nuevaPagina();
  }

  /** Deja una página en blanco (conserva su nombre y su lugar). */
  limpiarPagina(pid = this.E.paginaId) {
    const p = this.P.paginas[pid];
    if (!p || !p.els.length) return;
    this.E.transaccion("Dejar en blanco", () => {
      this.E.quitarEls(p.els.map((e) => e.id), pid);
      this.E.setPag({ fondo: { tipo: "color", color: this.tema.fondo || "#ffffff" }, musica: { modo: "global" }, transicion: null }, "Dejar en blanco", null, pid);
    });
    aviso("Página en blanco · puedes deshacerlo");
  }

  async limpiarTodo(soloUna) {
    const txt = soloUna ? "Se borrarán todas las páginas y quedará una sola en blanco." : "Se vaciarán todas las páginas (quedan en blanco, con su nombre y en su orden).";
    if (!(await confirmar(txt + " Tus fotos y canciones subidas se quedan en la biblioteca. Puedes deshacerlo con «Deshacer».", soloUna ? "Dejar una en blanco" : "Vaciar todas"))) return;
    this.E.transaccion(soloUna ? "Dejar una página" : "Vaciar páginas", () => {
      if (soloUna) {
        const nueva = nuevaPagina(this.P, { nombre: "Página 1" });
        for (const pid of [...this.P.orden]) this.E.quitarPagina(pid);
        this.E.agregarPagina(nueva, 0);
      } else for (const pid of this.P.orden) this.limpiarPagina(pid);
    });
  }

  ponerPortada(pid = this.E.paginaId) {
    const i = this.P.orden.indexOf(pid);
    if (i < 0) return;
    this.E.transaccion("Cambiar portada", () => {
      this.E.setProy({ "ajustes.portada": pid });
      if (i > 0) this.E.moverPagina(i, 0);
    });
    aviso("Ésta es ahora la portada");
  }

  nombreTipo(e) { return TIPOS[e.tipo]?.n || e.tipo; }
}

export { RT };
