/**
 * EL LIENZO — la hoja que se edita.
 *
 * La hoja la pinta el MISMO código que el librito exportado (runtime/), así
 * lo que ves aquí es lo que sale. Encima va una capa del editor (la caja de
 * lo elegido, sus manijas, las líneas del imán…) hecha con nodos que se
 * reciclan: a cada cuadro sólo se mueven, nunca se borran y se rehacen.
 *
 * Gestos (Pointer Events: ratón, dedo y lápiz igual):
 *   tocar                       elegir (Mayús/Ctrl: añadir o quitar)
 *   arrastrar                   mover (con imán y sin perderse fuera de la hoja)
 *   mantener presionado         menú del elemento (o de la hoja); botón derecho igual
 *   doble toque                 editar el texto / encuadrar la foto / abrir el HTML;
 *                               en un grupo, entrar a editar uno; en vacío, acercar
 *   manijas                     tamaño (las de las esquinas guardan la proporción
 *                               de fotos y dibujos; Mayús lo invierte, Alt desde el centro)
 *   manija redonda              girar (se pega a 0/45/90…; Mayús = de 15 en 15)
 *   dos dedos                   sobre lo elegido: tamaño y giro; en otro lado: zoom
 *                               y desplazar. Si el primer dedo ya estaba moviendo
 *                               algo, ese movimiento se deshace: nada se mueve sin querer.
 *   arrastrar en vacío          con el dedo, desplazar; con el ratón, elegir varios
 *   Ctrl+rueda · rueda          zoom · desplazar
 *
 * Hoja «Automática»: aquí se ve con la forma de la pantalla elegida en «Ver
 * como» (o la de este aparato) y cada elemento se coloca según su ancla.
 */
import { el, menu } from "../components/ui.js";
import { rutaAUrl } from "../assets/biblioteca.js";
import { cajaDe, union, candidatos, imanMover, imanBorde, pintarRegla } from "./guias.js";
import { tocaZona } from "../componentes/analizar.js";
import { permite } from "../core/modelo.js";
import { enCuadro, holgura, TOQUE_LARGO, vibrar, Reserva, estilo, clase } from "./gestos.js";
import { ico } from "../components/iconos.js";

const RT = window.LibritoRT;
const PROPORCION = new Set(["imagen", "dibujo", "trazo", "video", "componente", "escena3d"]);
const MANIJAS = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0] };
const CURSORES = ["ns-resize", "nesw-resize", "ew-resize", "nwse-resize"];
const VER = "editordev:ver";
const VISIBLE = 40; // lo mínimo que se queda dentro de la hoja al arrastrar hacia fuera
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** «Ver como»: en qué pantalla se prueba la hoja automática. */
export const DISPOSITIVOS = {
  este: { n: "Esta pantalla", ico: "pantalla" },
  movil: { n: "Teléfono", w: 390, h: 844, ico: "telefono" },
  chico: { n: "Teléfono chico", w: 360, h: 640, ico: "telefono" },
  grande: { n: "Teléfono grande", w: 430, h: 932, ico: "telefono" },
  tableta: { n: "Tableta", w: 768, h: 1024, ico: "tableta" },
  horizontal: { n: "Teléfono acostado", w: 844, h: 390, ico: "horizontal" },
  tabletaH: { n: "Tableta acostada", w: 1024, h: 768, ico: "horizontal" },
};

export class Lienzo {
  constructor(app, raiz) {
    this.app = app;
    this.estado = app.estado;
    this.raiz = raiz;
    this.v = { z: 1, px: 0, py: 0, ajustar: true };
    this.pag = null;
    this.lineas = { x: [], y: [] };
    this.punteros = new Map();
    this.g = null;
    this.pellizco = null;
    this.herramienta = null;
    // En el teléfono se prueba en él mismo; en la computadora, como un teléfono.
    const def = matchMedia("(pointer: coarse)").matches ? "este" : "movil";
    try { this.ver = localStorage.getItem(VER) || def; } catch (e) { this.ver = def; }
    this.m = { W: 390, H: 844, W0: 390, H0: 844, s: 1, auto: false };
    this.ctx = {
      modo: "editor",
      url: (id) => app.bib.url(id),
      ruta: (r) => rutaAUrl(r),
      pedir: true,
      medidas: this.m,
      escala: () => this.v.z,
    };
    this._construir();
    this._escuchar();
    this._gestos();
  }

  get P() { return this.estado.proyecto; }
  get W() { return this.m.W; }
  get H() { return this.m.H; }

  _construir() {
    const r = this.raiz;
    this.reglaX = el("canvas.ed-regla.ed-regla-x");
    this.reglaY = el("canvas.ed-regla.ed-regla-y");
    this.esquina = el("div.ed-regla-esq", { title: "Arrastra desde las reglas para poner una guía" });
    this.hoja = el("div.ed-hoja");
    this.rejilla = el("div.ed-rejilla");
    this.margen = el("div.ed-margen");
    this.guias = el("div.ed-guias");
    this.mundo = el("div.ed-mundo", {}, [this.hoja, this.rejilla, this.margen, this.guias]);
    this.sobre = el("div.ed-sobre");
    this.reserva = new Reserva(this.sobre);
    this.vistaEl = el("div.ed-vista", { tabindex: "-1" }, [this.mundo, this.sobre]);
    this.flotante = el("div.ed-flotante", { hidden: "" });
    this.aviso = el("div.ed-lienzo-aviso", { hidden: "" });
    this.fuera = el("button.ed-fuera", { type: "button", hidden: "", onClick: () => this.traerALaHoja(this._fueraIds || []) });
    r.append(this.reglaX, this.reglaY, this.esquina, this.vistaEl, this.flotante, this.aviso, this.fuera);
    new ResizeObserver(() => {
      if (this.editando) return this._mostrarEditando();
      if (this.v.ajustar) this.ajustar(); else this.pintarVista();
    }).observe(this.vistaEl);
    // La pantalla cambió (girar el teléfono): la hoja automática se rehace.
    const re = () => { cancelAnimationFrame(this._rre); this._rre = requestAnimationFrame(() => this._rehoja()); };
    addEventListener("resize", re);
    addEventListener("orientationchange", re);
  }

  _escuchar() {
    const E = this.estado;
    E.on("cargado", () => { this.montar(); this.ajustar(); });
    E.on("actual", () => { this.terminarTexto(); this.salirRecorte(); this.salirProbar(); this.montar(); });
    E.on("els", ({ p }) => { if (p === E.paginaId && this.pag) { this.pag.sincronizar(E.pagina); this.pintarSobre(); } });
    E.on("pagina", ({ p }) => { if (p === E.paginaId && this.pag) { this.pag.sincronizar(E.pagina); this.pintarSobre(); } });
    E.on("el", ({ p, e, rutas }) => {
      if (p !== E.paginaId || !this.pag) return;
      const x = E.el(e);
      if (!x) return;
      // Cambiar un elemento puede cambiar qué se esconde en la página original de debajo.
      if ((rutas || []).includes("origen") || x.origen) this.pag.sincronizar(E.pagina); else this.pag.actualizar(x);
      this.pintarSobre();
    });
    E.on("proyecto", ({ ruta }) => {
      if (/^ajustes\.(ancho|alto|formato)/.test(ruta)) { this.montar(); this.ajustar(); }
      else if (/^editor/.test(ruta)) this.pintarVista();
    });
    E.on("assets", () => { if (this.pag) { for (const n of this.pag.nodos.values()) n._rt.firma = null; this.pag.sincronizar(E.pagina); } });
    E.on("sel", () => { this.salirRecorte(); if (this.probando && !E.sel.includes(this.probando)) this.salirProbar(); this.pintarSobre(); });
  }

  /* ── Medidas de la hoja (fija o automática) ─────────────────────── */
  _pantalla() {
    const d = DISPOSITIVOS[this.ver];
    if (d && d.w) return { w: d.w, h: d.h };
    // En un teléfono, la pantalla entera (no cambia al salir el teclado);
    // en la computadora, la ventana.
    if (matchMedia("(pointer: coarse)").matches && screen.width) {
      const a = Math.min(screen.width, screen.height), b = Math.max(screen.width, screen.height);
      return innerWidth > innerHeight ? { w: b, h: a } : { w: a, h: b };
    }
    return { w: innerWidth, h: innerHeight };
  }

  _medir() {
    const a = this.P?.ajustes;
    if (!a) return this.m;
    const pv = RT.esAuto(a) ? this._pantalla() : { w: 0, h: 0 };
    this.m = RT.medidas(a, pv.w, pv.h);
    this.ctx.medidas = this.m;
    return this.m;
  }

  /** Probar la hoja automática en otra pantalla. */
  verComo(id) {
    if (!DISPOSITIVOS[id]) return;
    this.ver = id;
    try { localStorage.setItem(VER, id); } catch (e) { /* nada */ }
    this._rehoja(true);
    this.app.alVerComo?.(id);
  }

  _rehoja(forzar) {
    if (!this.P) return;
    const antes = this.m;
    const m = this._medir();
    if (!forzar && antes.W === m.W && antes.H === m.H) return;
    this.hoja.style.width = m.W + "px";
    this.hoja.style.height = m.H + "px";
    this.pag?.redimensionar(m.W, m.H);
    this.ajustar();
  }

  /** Dónde se ve un elemento en esta pantalla (con su giro). Siempre una copia:
      los gestos la guardan como punto de partida mientras el elemento cambia. */
  vis(e) {
    const b = RT.colocar(e, this.m);
    return { x: b.x, y: b.y, w: b.w, h: b.h, rot: e.rot, id: e.id };
  }

  /** Ancla que corresponde a una caja vista (por tercios de la hoja). */
  _anclaPara(b) {
    const W = this.W, H = this.H;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    return {
      h: b.w >= W * 0.9 ? "estirar" : cx < W / 3 ? "izq" : cx > (W * 2) / 3 ? "der" : "centro",
      v: b.h >= H * 0.9 ? "estirar" : cy < H / 3 ? "arriba" : cy > (H * 2) / 3 ? "abajo" : "centro",
    };
  }

  /** Lo que se guarda para que el elemento se vea en la caja `b` (y su ancla, si es automática). */
  guardarCaja(e, b, conAncla = true) {
    const c = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) };
    if (!this.m.auto || (this.m.W === this.m.W0 && this.m.H === this.m.H0)) return c;
    let a = RT.anclaDe(e, this.m);
    const cambios = {};
    if (conAncla && (!e.ancla || e.ancla.auto)) {
      const n = this._anclaPara(b);
      if (n.h !== a.h || n.v !== a.v || !e.ancla) { a = n; cambios.ancla = { h: n.h, v: n.v, auto: true }; }
    }
    const s = RT.descolocar(e, b, this.m, a);
    return Object.assign(cambios, { x: Math.round(s.x), y: Math.round(s.y), w: Math.round(s.w), h: Math.round(s.h) });
  }

  /** Después de soltar algo en la hoja automática: que se quede pegado a su borde nuevo. */
  _anclar(ids) {
    if (!this.m.auto || (this.m.W === this.m.W0 && this.m.H === this.m.H0)) return;
    const E = this.estado;
    for (const id of ids) {
      const e = E.el(id);
      if (!e || (e.ancla && !e.ancla.auto)) continue;
      const c = this.guardarCaja(e, this.vis(e));
      if (c.ancla) E.setEl(id, c, "Mover");
    }
  }

  /** Lo nuevo aparece en el centro de lo que se ve (un poquito corrido si ya hay algo ahí). */
  colocarNuevo(e) {
    const r = this.vistaEl.getBoundingClientRect();
    const c = this.aMundo(r.left + r.width / 2, r.top + r.height / 2);
    const b = { x: clamp(c.x - e.w / 2, 0, Math.max(0, this.W - e.w)), y: clamp(c.y - e.h / 2, 0, Math.max(0, this.H - e.h)), w: e.w, h: e.h };
    const ocupado = (x, y) => (this.estado.pagina?.els || []).some((o) => { const v = this.vis(o); return Math.abs(v.x - x) < 4 && Math.abs(v.y - y) < 4; });
    let k = 0;
    while (ocupado(b.x, b.y) && k++ < 12) { b.x += 14; b.y += 14; }
    Object.assign(e, this.guardarCaja(e, b));
    return e;
  }

  /** Pinta la página actual (y suelta la anterior entera). */
  montar() {
    if (this.pag) { this.pag.destruir(); this.pag = null; }
    this.salirProbar();
    this._medir();
    const p = this.estado.pagina;
    this.hoja.style.width = this.W + "px";
    this.hoja.style.height = this.H + "px";
    document.body.classList.toggle("hoja-auto", !!this.m.auto);
    if (!p) { this.pintarVista(); return; }
    this.pag = new RT.Pagina(p, this.ctx, this.W, this.H);
    this.hoja.append(this.pag.nodo);
    RT.cargarFuentes(p.els.map((e) => e.texto?.fuente || e.boton?.fuente));
    this.pintarVista();
  }

  /* ── Zoom y desplazamiento ──────────────────────────────────────── */
  ajustar() {
    const r = this.vistaEl.getBoundingClientRect();
    if (!r.width || !r.height || !this.P) return;
    const mx = r.width < 600 ? 20 : 56, my = r.width < 600 ? 20 : 48;
    const z = Math.max(0.05, Math.min((r.width - mx) / this.W, (r.height - my) / this.H));
    this.v = { z, px: (r.width - this.W * z) / 2, py: (r.height - this.H * z) / 2, ajustar: true };
    this.pintarVista();
  }

  zoom(z, cx, cy) {
    if (z === "ajustar") return this.ajustar();
    const r = this.vistaEl.getBoundingClientRect();
    if (cx == null) { cx = r.width / 2; cy = r.height / 2; }
    z = clamp(z, 0.1, 8);
    const wx = (cx - this.v.px) / this.v.z, wy = (cy - this.v.py) / this.v.z;
    this.v = { z, px: cx - wx * z, py: cy - wy * z, ajustar: false };
    this._acotarVista();
    this.pintarVista();
  }

  /** Que la hoja nunca se pierda de vista al desplazar o acercar. */
  _acotarVista() {
    const vw = this.vistaEl.clientWidth, vh = this.vistaEl.clientHeight;
    const w = this.W * this.v.z, h = this.H * this.v.z, q = 60;
    this.v.px = clamp(this.v.px, q - w, vw - q);
    this.v.py = clamp(this.v.py, q - h, vh - q);
  }

  pintarVista() {
    if (!this.P) return;
    const { z, px, py } = this.v;
    this.mundo.style.transform = `translate(${px}px, ${py}px) scale(${z})`;
    const ed = this.P.editor || {};
    this.raiz.classList.toggle("con-reglas", !!ed.reglas);
    const paso = ed.paso || 10;
    this.rejilla.hidden = !ed.cuadricula;
    this.rejilla.style.width = this.W + "px";
    this.rejilla.style.height = this.H + "px";
    this.rejilla.style.backgroundSize = `${paso}px ${paso}px, ${paso}px ${paso}px, ${paso * 5}px ${paso * 5}px, ${paso * 5}px ${paso * 5}px`;
    this.margen.hidden = !ed.margenes;
    const mg = ed.margen || 0;
    Object.assign(this.margen.style, { left: mg + "px", top: mg + "px", width: this.W - 2 * mg + "px", height: this.H - 2 * mg + "px" });
    this.mundo.style.setProperty("--z", z);
    this._pintarGuias();
    this._pintarReglas();
    this.app.alZoom?.(this.v);
    this.pintarSobre();
  }

  _pintarReglas() {
    if (!this.P.editor?.reglas) return;
    cancelAnimationFrame(this._rr);
    this._rr = requestAnimationFrame(() => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      pintarRegla(this.reglaX, "x", this.v.z, this.v.px, this.W, dpr);
      pintarRegla(this.reglaY, "y", this.v.z, this.v.py, this.H, dpr);
    });
  }

  _pintarGuias() {
    const gs = this.P.editor?.guias || [];
    const firma = JSON.stringify(gs) + this.W + "x" + this.H;
    if (firma === this._firmaGuias) return;
    this._firmaGuias = firma;
    this.guias.textContent = "";
    gs.forEach((g, i) => {
      const n = el("div.ed-guia.ed-guia-" + g.eje, { dataset: { i }, title: "Arrastra para mover · llévala a la regla para quitarla" });
      if (g.eje === "x") Object.assign(n.style, { left: g.pos + "px", height: this.H + "px" });
      else Object.assign(n.style, { top: g.pos + "px", width: this.W + "px" });
      this.guias.append(n);
    });
  }

  /* ── Coordenadas ────────────────────────────────────────────────── */
  aMundo(cx, cy) {
    const r = this.vistaEl.getBoundingClientRect();
    return { x: (cx - r.left - this.v.px) / this.v.z, y: (cy - r.top - this.v.py) / this.v.z };
  }
  aPantalla(x, y) { return { x: this.v.px + x * this.v.z, y: this.v.py + y * this.v.z }; }

  /* ── La capa del editor ─────────────────────────────────────────── */
  pintarSobre() {
    if (this._ps) return;
    this._ps = requestAnimationFrame(() => { this._ps = null; this._pintarSobre(); });
  }

  _caja(b, cls) {
    const z = this.v.z;
    const c = this.aPantalla(b.x + b.w / 2, b.y + b.h / 2);
    const n = this.reserva.nodo(cls.split(" ")[0]);
    clase(n, cls);
    estilo(n, { left: c.x - (b.w * z) / 2 + "px", top: c.y - (b.h * z) / 2 + "px", width: b.w * z + "px", height: b.h * z + "px", transform: b.rot ? `rotate(${b.rot}deg)` : "" });
    return n;
  }

  _pintarSobre() {
    const R = this.reserva;
    R.inicio();
    const E = this.estado;
    if (!E.pagina) { R.fin(); this.flotante.hidden = true; return; }
    const z = this.v.z;
    const sel = E.seleccionados.filter((e) => !e.oculto);
    if (this.hover && !E.sel.includes(this.hover) && !this.g) { const h = E.el(this.hover); if (h && !h.oculto) this._caja(this.vis(h), "ed-hover"); }
    const unico = sel.length === 1 ? sel[0] : null;
    for (const e of sel) {
      const fijo = e.bloqueado || !permite(e, "mover");
      this._caja(this.vis(e), "ed-caja" + (e.bloqueado ? " bloq" : fijo ? " fijo" : "") + (this.editando === e.id ? " editando" : "") + (this.recortando === e.id ? " recortando" : ""));
    }
    if (unico && !unico.bloqueado && !this.editando && !this.recortando && !this.probando) this._manijas(unico);
    if (sel.length > 1) {
      const u = union(sel.map((e) => cajaDe(this.vis(e))));
      this._caja({ ...u, rot: 0 }, "ed-caja-grupo");
      if (!sel.some((e) => e.bloqueado || !permite(e, "tamano")) && !this.editando) {
        for (const m of ["nw", "ne", "se", "sw"]) {
          const [sx, sy] = MANIJAS[m];
          const p = this._enVista(this.aPantalla(u.x + (u.w * (sx + 1)) / 2, u.y + (u.h * (sy + 1)) / 2));
          const n = R.nodo("ed-manija");
          clase(n, "ed-manija m-" + m);
          n.dataset.m = m; n.dataset.grupo = "1";
          estilo(n, { left: p.x + "px", top: p.y + "px", transform: "translate(-50%, -50%)", cursor: sx === sy ? "nwse-resize" : "nesw-resize" });
        }
      }
    }
    if (this.gestoTam && unico) {
      const b = this.vis(unico);
      const p = this._enVista(this.aPantalla(b.x + b.w / 2, b.y + b.h));
      const n = R.nodo("ed-medida");
      clase(n, "ed-medida");
      const t = `${Math.round(b.w)} × ${Math.round(b.h)}` + (unico.rot ? ` · ${Math.round(unico.rot)}°` : "");
      if (n.textContent !== t) n.textContent = t;
      estilo(n, { left: p.x + "px", top: Math.min(p.y + 26, this.vistaEl.clientHeight - 30) + "px" });
    }
    // Las zonas que detectó el editor en un componente (sólo para el editor).
    if (unico && unico.tipo === "componente" && unico.componente?.analisis && !this.g) this._zonas(unico);
    const tl = this.aPantalla(0, 0);
    for (const x of this.lineas.x) { const p = this.aPantalla(x, 0); const n = R.nodo("ed-iman"); clase(n, "ed-iman v"); estilo(n, { left: p.x + "px", top: tl.y + "px", width: "", height: this.H * z + "px" }); }
    for (const y of this.lineas.y) { const p = this.aPantalla(0, y); const n = R.nodo("ed-iman"); clase(n, "ed-iman h"); estilo(n, { top: p.y + "px", left: tl.x + "px", height: "", width: this.W * z + "px" }); }
    if (this.marco) { const n = R.nodo("ed-marco"); clase(n, "ed-marco"); estilo(n, this.marco); }
    R.fin();
    this._pintarFlotante(sel);
    if (!this.g && !this.pellizco) this._revisarFuera();
  }

  /** Un punto de la pantalla, sin salirse de la vista (las manijas siempre se alcanzan). */
  _enVista(p, pad = 14) {
    return { x: clamp(p.x, pad, this.vistaEl.clientWidth - pad), y: clamp(p.y, pad, this.vistaEl.clientHeight - pad) };
  }

  _manijas(e) {
    const R = this.reserva;
    const z = this.v.z;
    const b = this.vis(e);
    const c = this.aPantalla(b.x + b.w / 2, b.y + b.h / 2);
    const hw = (b.w * z) / 2, hh = (b.h * z) / 2;
    const rot = e.rot || 0;
    const rad = (rot * Math.PI) / 180, co = Math.cos(rad), si = Math.sin(rad);
    const pt = (lx, ly) => ({ x: c.x + lx * co - ly * si, y: c.y + lx * si + ly * co });
    const lado = Math.min(b.w, b.h) * z;
    const chico = lado < 64;
    // En lo chiquito, las manijas se apartan para que el dedo pueda agarrar el centro.
    const extra = chico ? (64 - lado) / 2 : 0;
    if (permite(e, "tamano")) {
      for (const [m, [sx, sy]] of Object.entries(MANIJAS)) {
        const esquina = sx && sy;
        if (!esquina && (chico || (sx ? b.h : b.w) * z < 44)) continue;
        const p = this._enVista(pt(sx * (hw + (esquina ? extra : 0)), sy * (hh + (esquina ? extra : 0))));
        const n = R.nodo("ed-manija");
        clase(n, "ed-manija m-" + m + (esquina ? "" : " lado"));
        n.dataset.m = m;
        delete n.dataset.grupo;
        const ang = (Math.atan2(sy, sx) * 180) / Math.PI + rot;
        const k = ((Math.round(((ang % 180) + 180) / 45) % 4) + 2) % 4;
        estilo(n, { left: p.x + "px", top: p.y + "px", transform: `translate(-50%, -50%) rotate(${rot}deg)`, cursor: CURSORES[k] });
      }
    }
    if (permite(e, "rotar")) {
      const d = hh + 34 + extra;
      let p = pt(0, d);
      if (p.y > this.vistaEl.clientHeight - 20) p = pt(0, -d);
      p = this._enVista(p, 20);
      const n = R.nodo("ed-giro");
      clase(n, "ed-giro");
      n.dataset.m = "rot";
      if (!n.firstChild) { n.innerHTML = ico("girar"); n.title = "Girar"; }
      estilo(n, { left: p.x + "px", top: p.y + "px" });
    }
  }

  _zonas(e) {
    const k = e.componente, an = k.analisis;
    const b = this.vis(e);
    const marco = this._caja(b, "ed-zonas" + (k.sinFondo ? " sin-fondo" : ""));
    const W = k.ajuste === "adaptar" ? b.w : k.ancho || b.w, H = k.ajuste === "adaptar" ? b.h : k.alto || b.h;
    const sx = (b.w / W) * this.v.z, sy = (b.h / H) * this.v.z;
    const firma = JSON.stringify([an.interactivos, an.visual]) + sx + "," + sy;
    if (marco._firma === firma) return;
    marco._firma = firma;
    marco.textContent = "";
    const poner = (q, cls, txt) => marco.append(el("i." + cls, { title: txt || "", style: { left: q.x * sx + "px", top: q.y * sy + "px", width: q.w * sx + "px", height: q.h * sy + "px" } }));
    for (const q of an.interactivos || []) poner(q, "ed-zona-toca", "zona táctil: " + (q.que || ""));
    if (!(an.interactivos || []).length) for (const q of an.visual || []) poner(q, "ed-zona-ve");
  }

  _pintarFlotante(sel) {
    const f = this.flotante;
    if (!sel.length || this.gestoActivo || this.editando || this.herramienta || this.pellizco) { if (!f.hidden) f.hidden = true; return; }
    const u = union(sel.map((e) => cajaDe(this.vis(e))));
    const a = this.aPantalla(u.x + u.w / 2, u.y);
    const b = this.aPantalla(u.x + u.w / 2, u.y + u.h);
    this.app.acciones.barraFlotante(f, sel);
    f.hidden = false;
    const vw = this.vistaEl.clientWidth, fw = f.offsetWidth || 260, fh = f.offsetHeight || 44;
    const ox = this.vistaEl.offsetLeft, oy = this.vistaEl.offsetTop;
    let top = a.y - fh - 16;
    if (top < 6) top = Math.min(b.y + 52, this.vistaEl.clientHeight - fh - 6);
    estilo(f, { left: clamp(a.x - fw / 2, 6, vw - fw - 6) + ox + "px", top: top + oy + "px" });
  }

  /** ¿Algo se quedó entero fuera de la hoja? Un botoncito para traerlo. */
  _revisarFuera() {
    const ids = (this.estado.pagina?.els || []).filter((e) => {
      if (e.oculto) return false;
      const b = cajaDe(this.vis(e));
      return b.x + b.w < 0 || b.y + b.h < 0 || b.x > this.W || b.y > this.H;
    }).map((e) => e.id);
    const t = ids.length ? `${ico("recuperar")}<span>${ids.length === 1 ? "1 elemento fuera de la hoja" : ids.length + " elementos fuera de la hoja"} · traer</span>` : "";
    this._fueraIds = ids;
    if (this.fuera._t !== t) { this.fuera._t = t; this.fuera.innerHTML = t; this.fuera.hidden = !ids.length; }
  }

  /** Traer de vuelta lo que se salió (o quedó medio fuera) de la hoja. */
  traerALaHoja(ids) {
    const E = this.estado;
    E.transaccion("Traer a la hoja", () => {
      for (const id of ids) {
        const e = E.el(id);
        if (!e) continue;
        const v = this.vis(e);
        const b = cajaDe(v);
        let dx = 0, dy = 0;
        if (b.w <= this.W) dx = clamp(b.x, 0, this.W - b.w) - b.x; else dx = (this.W - b.w) / 2 - b.x;
        if (b.h <= this.H) dy = clamp(b.y, 0, this.H - b.h) - b.y; else dy = (this.H - b.h) / 2 - b.y;
        if (dx || dy) E.setEl(id, { x: Math.round(e.x + dx), y: Math.round(e.y + dy) }, "Traer a la hoja");
      }
    });
    E.seleccionar(ids);
  }

  /* ── Qué hay bajo el dedo ───────────────────────────────────────── */
  tocar(cx, cy, conBloqueados = false) {
    const w = this.aMundo(cx, cy);
    const els = this.estado.pagina?.els || [];
    let arriba = null;
    for (const n of document.elementsFromPoint(cx, cy)) {
      const r = n.closest?.(".rt-el");
      if (!r || !this.hoja.contains(r)) continue;
      const e = this.estado.el(r.dataset.id);
      if (!e || e.oculto) continue;
      if (!conBloqueados && (e.bloqueado || !permite(e, "seleccionar"))) continue;
      // Un componente sólo se agarra por su zona real (su botón, lo que se ve),
      // no por todo su rectángulo: así no tapa lo que hay debajo.
      if (e.tipo === "componente" && e.componente?.seleccion !== "todo" && !this._enZona(e, w.x, w.y)) continue;
      arriba = e;
      break;
    }
    // Lo ya elegido se agarra por toda su caja (para arrastrarlo), salvo que
    // encima haya otra cosa: entonces gana la de encima.
    for (const e of this.estado.seleccionados) {
      if ((e.bloqueado && !conBloqueados) || e.oculto) continue;
      if (this._dentro(e, w.x, w.y) && (!arriba || els.indexOf(e) >= els.indexOf(arriba))) return e;
    }
    return arriba;
  }

  /** Punto de la hoja → coordenadas propias del elemento (sin giro). */
  _local(e, x, y) {
    const b = this.vis(e);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const r = (-(e.rot || 0) * Math.PI) / 180;
    const dx = x - cx, dy = y - cy;
    return { x: dx * Math.cos(r) - dy * Math.sin(r) + b.w / 2, y: dx * Math.sin(r) + dy * Math.cos(r) + b.h / 2, w: b.w, h: b.h };
  }

  _dentro(e, x, y, pad = 0) { const l = this._local(e, x, y); return l.x >= -pad && l.y >= -pad && l.x <= l.w + pad && l.y <= l.h + pad; }

  _enZona(e, x, y) {
    const k = e.componente || {};
    const l = this._local(e, x, y);
    if (l.x < 0 || l.y < 0 || l.x > l.w || l.y > l.h) return false;
    if (k.ajuste === "adaptar") return tocaZona(k.analisis, l.x, l.y);
    return tocaZona(k.analisis, (l.x * (k.ancho || l.w)) / l.w, (l.y * (k.alto || l.h)) / l.h, 6 * ((k.ancho || l.w) / l.w));
  }

  /** Los del mismo grupo que `e` (o sólo él). */
  _grupo(e) {
    if (!e.grupo || this.dentroGrupo === e.grupo) return [e.id];
    return this.estado.pagina.els.filter((x) => x.grupo === e.grupo && !x.oculto).map((x) => x.id);
  }

  /** Clases del editor en el nodo de un elemento (sobreviven a que se repinte). */
  _marcarNodo(id, cls, on) {
    const n = this.pag?.nodos.get(id);
    if (!n) return;
    const ex = (n._rt.extra || "").split(" ").filter((c) => c && c !== cls);
    if (on) ex.push(cls);
    n._rt.extra = ex.length ? " " + ex.join(" ") : "";
    n.classList.toggle(cls, on);
  }

  /** Tocar un componente (o un HTML, una página, una escena 3D) de verdad, aquí mismo. */
  probarAqui(e) {
    this.salirProbar();
    if (!this.pag?.nodos.get(e.id)) return;
    this._marcarNodo(e.id, "ed-probando", true);
    this.probando = e.id;
    this.aviso.hidden = false;
    this.aviso.innerHTML = "";
    this.aviso.append(el("span", { text: "Probando: tócalo como en el librito" }), el("button.ed-btn.primario", { type: "button", text: "Listo", onClick: () => this.salirProbar() }));
    this.pintarSobre();
  }

  salirProbar() {
    if (!this.probando) return;
    this._marcarNodo(this.probando, "ed-probando", false);
    this.probando = null;
    this.aviso.hidden = true;
    this.pintarSobre();
  }

  /* ── Gestos ─────────────────────────────────────────────────────── */
  _gestos() {
    const v = this.vistaEl;
    v.addEventListener("pointerdown", (ev) => this._abajo(ev));
    this._hoverCuadro = enCuadro((ev) => this._hover(ev));
    v.addEventListener("pointermove", (ev) => {
      const p = this.punteros.get(ev.pointerId);
      if (p) { p.x = ev.clientX; p.y = ev.clientY; }
      if (this.pellizco) { if (p) this.pellizco.mover(ev); return; }
      const g = this.g;
      if (g && g.id === ev.pointerId) {
        if (!g.movio && Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) >= holgura(ev)) { g.movio = true; this._cancelarLargo(); }
        if (!g.consumido) { g.cada?.(ev); g.mover(ev); }
        return;
      }
      if (!g && ev.pointerType === "mouse" && !this.punteros.size) this._hoverCuadro(ev);
    });
    v.addEventListener("pointerleave", (ev) => { if (ev.pointerType === "mouse" && this.hover && !this.g) { this.hover = null; this.pintarSobre(); } });
    const arriba = (ev) => {
      if (!this.punteros.has(ev.pointerId)) return;
      this.punteros.delete(ev.pointerId);
      if (this.pellizco) { if (this.punteros.size < 2) this._finPellizco(); return; }
      const g = this.g;
      if (!g || g.id !== ev.pointerId) return;
      this.g = null;
      this._cancelarLargo();
      g.mover.ya();
      this.gestoActivo = false;
      if (!g.consumido) g.soltar(ev, ev.type === "pointercancel");
      this.pintarSobre();
    };
    addEventListener("pointerup", arriba);
    addEventListener("pointercancel", arriba);
    // Botón derecho (o el «mantener» del navegador): nuestro menú, nunca el del navegador.
    v.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      if (this.editando || performance.now() - (this._tLargoHecho || 0) < 1500 || this._ultimoTipo !== "mouse") return;
      this.menuEn(ev.clientX, ev.clientY);
    });
    v.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      const r = v.getBoundingClientRect();
      if (this.recortando && !ev.ctrlKey) return this._zoomRecorte(ev.deltaY);
      if (ev.ctrlKey || ev.metaKey) this.zoom(this.v.z * Math.exp(-ev.deltaY * 0.012), ev.clientX - r.left, ev.clientY - r.top);
      else { this.v.px -= ev.deltaX; this.v.py -= ev.deltaY; this.v.ajustar = false; this._acotarVista(); this.pintarVista(); }
    }, { passive: false });
    // Guías desde las reglas.
    for (const [regla, eje] of [[this.reglaX, "y"], [this.reglaY, "x"]]) regla.addEventListener("pointerdown", (ev) => this._nuevaGuia(ev, eje));
    this.guias.addEventListener("pointerdown", (ev) => {
      const g = ev.target.closest(".ed-guia");
      if (g) { ev.stopPropagation(); this._moverGuia(ev, +g.dataset.i); }
    });
    addEventListener("keydown", (ev) => { if (ev.code === "Space" && !/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName) && !ev.target.isContentEditable) { this.espacio = true; v.classList.add("mano"); } });
    addEventListener("keyup", (ev) => { if (ev.code === "Space") { this.espacio = false; v.classList.remove("mano"); } });
  }

  /** Empieza un gesto de un dedo. `largo` = qué hacer si se mantiene presionado. */
  _gesto(ev, h, largo) {
    try { this.vistaEl.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    const g = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, movio: false, consumido: false, cada: h.cada, soltar: h.soltar || (() => {}), cancelar: h.cancelar || (() => {}) };
    g.mover = enCuadro((m) => { if (this.g === g) h.mover?.(m); });
    this.g = g;
    this._cancelarLargo();
    if (largo && ev.pointerType !== "mouse") {
      this._tLargo = setTimeout(() => {
        if (this.g !== g || g.movio || this.punteros.size !== 1) return;
        g.consumido = true;
        this._tLargoHecho = performance.now();
        vibrar(12);
        largo();
      }, TOQUE_LARGO);
    }
    return g;
  }

  _cancelarLargo() { clearTimeout(this._tLargo); this._tLargo = null; }

  _hover(ev) {
    const e = this.tocar(ev.clientX, ev.clientY);
    const id = e ? e.id : null;
    if (id !== this.hover) { this.hover = id; this.pintarSobre(); }
  }

  _abajo(ev) {
    this._ultimoTipo = ev.pointerType;
    if (this.editando && ev.target.closest(".ed-editando")) return;
    if (this.probando && ev.target.closest(".ed-probando")) return;
    if (this.editando) this.terminarTexto();
    if (ev.pointerType === "mouse" && ev.button === 2) return;
    this.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (this.punteros.size === 2) return this._dosDedos();
    if (this.punteros.size > 2 || this.pellizco) return;
    if (ev.pointerType === "mouse") ev.preventDefault();
    this.vistaEl.focus({ preventScroll: true });
    const man = ev.target.closest(".ed-manija, .ed-giro");
    if (man) { ev.preventDefault(); return man.dataset.grupo ? this._escalarGrupo(ev, man.dataset.m) : this._manija(ev, man.dataset.m); }
    if (this.herramienta === "lapiz") return this._lapiz(ev);
    if (ev.button === 1 || this.espacio) return this._pan(ev);
    const e = this.tocar(ev.clientX, ev.clientY);
    if (this.recortando) {
      if (e && e.id === this.recortando) return this._recorte(ev, e);
      this.salirRecorte();
    }
    if (this.probando) this.salirProbar();
    if (!e) return this._vacio(ev);
    const sel = this.estado.sel;
    if (ev.target.closest("[data-pedir]") && sel.length === 1 && sel[0] === e.id) { this.app.acciones.pedirArchivoPara(e); return; }
    if (e.grupo !== this.dentroGrupo) this.dentroGrupo = null;
    if (ev.shiftKey || ev.metaKey || ev.ctrlKey) { this.estado.seleccionar(this._grupo(e), true); return; }
    if (!sel.includes(e.id)) this.estado.seleccionar(this._grupo(e));
    this._arrastrar(ev, e);
  }

  /** Tocar fuera de todo: con el dedo desplaza, con el ratón elige varios. */
  _vacio(ev) {
    if (ev.pointerType === "mouse") return this._marco(ev);
    const x0 = ev.clientX, y0 = ev.clientY;
    let pan = null;
    this._gesto(ev, {
      mover: (m) => {
        if (!this.g?.movio) return;
        if (!pan) { pan = this._panDesde(x0, y0); this.vistaEl.classList.add("panea"); }
        pan(m);
      },
      soltar: (u, cancelado) => {
        this.vistaEl.classList.remove("panea");
        if (!pan && !cancelado) this._toqueVacio(u);
      },
    }, () => this.menuEn(x0, y0));
  }

  _toqueVacio(ev) {
    const t = performance.now();
    const u = this._ultVacio;
    if (u && t - u.t < 340 && Math.hypot(ev.clientX - u.x, ev.clientY - u.y) < 30) {
      // Doble toque en lo vacío: acercar ahí (o volver a ver la hoja entera).
      this._ultVacio = null;
      const r = this.vistaEl.getBoundingClientRect();
      if (this.v.ajustar) this.zoom(this.v.z * 2, ev.clientX - r.left, ev.clientY - r.top); else this.ajustar();
      return;
    }
    this._ultVacio = { t, x: ev.clientX, y: ev.clientY };
    this.dentroGrupo = null;
    this.estado.seleccionar([]);
  }

  _toque(e) {
    const t = performance.now();
    if (this._ult && this._ult.id === e.id && t - this._ult.t < 380) {
      this._ult = null;
      // En un grupo, el doble toque entra a editar uno solo.
      if (e.grupo && this.dentroGrupo !== e.grupo) { this.dentroGrupo = e.grupo; this.estado.seleccionar([e.id]); return; }
      this.editar(e);
      return;
    }
    this._ult = { id: e.id, t };
  }

  /** Lo que se queda dentro de la hoja al mover: casi todo puede salir un poco, nunca perderse. */
  _limitar(caja, dx, dy, estricto) {
    const W = this.W, H = this.H;
    const kx = estricto ? caja.w : Math.min(caja.w, VISIBLE), ky = estricto ? caja.h : Math.min(caja.h, VISIBLE);
    const x = caja.x + dx, y = caja.y + dy;
    const lox = estricto && caja.w > W ? W - caja.w : kx - caja.w, hix = estricto && caja.w > W ? 0 : W - kx;
    const loy = estricto && caja.h > H ? H - caja.h : ky - caja.h, hiy = estricto && caja.h > H ? 0 : H - ky;
    const nx = clamp(x, Math.min(lox, hix), Math.max(lox, hix)), ny = clamp(y, Math.min(loy, hiy), Math.max(loy, hiy));
    if (nx !== x || ny !== y) this._tocaBorde();
    return { dx: nx - caja.x, dy: ny - caja.y };
  }

  _tocaBorde() {
    if (this._borde) return;
    this.hoja.classList.add("ed-al-borde");
    this._borde = setTimeout(() => { this._borde = null; this.hoja.classList.remove("ed-al-borde"); }, 260);
  }

  _arrastrar(ev, tocado) {
    const E = this.estado;
    const movibles = E.seleccionados.filter((e) => !e.bloqueado && permite(e, "mover"));
    const x0 = ev.clientX, y0 = ev.clientY, z = this.v.z;
    const orig = movibles.map((e) => ({ id: e.id, x: e.x, y: e.y }));
    const caja0 = movibles.length ? union(movibles.map((e) => cajaDe(this.vis(e)))) : null;
    const estricto = movibles.some((e) => !permite(e, "fuera"));
    const ed = this.P.editor || {};
    let cand = null, fin = null, pan = null;
    const g = this._gesto(ev, {
      mover: (m) => {
        if (!g.movio) return;
        if (!fin && !pan) {
          // Si no se puede mover (bloqueado o fijo), con el dedo se desplaza la hoja.
          if (!movibles.length) { if (m.pointerType !== "mouse") pan = this._panDesde(x0, y0); else return; }
          else {
            fin = E.gesto("Mover");
            this.gestoActivo = true;
            cand = candidatos(this.P, E.pagina, new Set(movibles.map((e) => e.id)), { W: this.W, H: this.H, vis: (e) => this.vis(e) });
          }
        }
        if (pan) return pan(m);
        let dx = (m.clientX - x0) / z, dy = (m.clientY - y0) / z;
        if (m.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        this.lineas = { x: [], y: [] };
        if (ed.iman !== false && !m.altKey) {
          const r = imanMover({ ...caja0, x: caja0.x + dx, y: caja0.y + dy }, cand, 7 / z, ed.cuadricula ? ed.paso : 0);
          if (!m.shiftKey || dx) dx += r.dx;
          if (!m.shiftKey || dy) dy += r.dy;
          this.lineas = { x: r.lx, y: r.ly };
        }
        ({ dx, dy } = this._limitar(caja0, dx, dy, estricto));
        for (const o of orig) E.setEl(o.id, { x: Math.round(o.x + dx), y: Math.round(o.y + dy) }, "Mover");
      },
      soltar: (u) => {
        this.lineas = { x: [], y: [] };
        if (fin) { this._anclar(orig.map((o) => o.id)); fin(); fin = null; }
        else if (!pan && !g.movio) this._toque(tocado);
      },
      cancelar: () => { this.lineas = { x: [], y: [] }; if (fin) { fin(false); fin = null; } },
    }, () => this.menuEn(x0, y0));
  }

  _panDesde(x0, y0) {
    const px = this.v.px, py = this.v.py;
    this.gestoActivo = true;
    return (m) => {
      this.v.px = px + m.clientX - x0; this.v.py = py + m.clientY - y0; this.v.ajustar = false;
      this._acotarVista();
      this.pintarVista();
    };
  }

  _manija(ev, m) {
    const E = this.estado;
    const e = E.unico;
    if (!e || e.bloqueado) return;
    const z = this.v.z;
    const b0 = this.vis(e);
    const cx0 = b0.x + b0.w / 2, cy0 = b0.y + b0.h / 2;
    const fin = E.gesto(m === "rot" ? "Girar" : "Cambiar tamaño");
    this.gestoActivo = true;
    this.gestoTam = true;
    const ed = this.P.editor || {};
    const terminar = (guardar = true) => { this.lineas = { x: [], y: [] }; this.gestoTam = false; if (guardar) this._anclar([e.id]); fin(guardar); };
    if (m === "rot") {
      const c = this.aPantalla(cx0, cy0);
      const r = this.vistaEl.getBoundingClientRect();
      const a0 = Math.atan2(ev.clientY - r.top - c.y, ev.clientX - r.left - c.x);
      const rot0 = e.rot || 0;
      this._gesto(ev, {
        mover: (mv) => {
          const a = Math.atan2(mv.clientY - r.top - c.y, mv.clientX - r.left - c.x);
          let rot = rot0 + ((a - a0) * 180) / Math.PI;
          if (mv.shiftKey) rot = Math.round(rot / 15) * 15;
          else { const k = Math.round(rot / 45) * 45; if (Math.abs(rot - k) < 4) rot = k; }
          rot = ((((rot + 180) % 360) + 360) % 360) - 180;
          E.setEl(e.id, { rot: Math.round(rot * 10) / 10 }, "Girar");
        },
        soltar: () => terminar(),
        cancelar: () => terminar(false),
      });
      return;
    }
    const [sx, sy] = MANIJAS[m];
    const rad = ((e.rot || 0) * Math.PI) / 180, co = Math.cos(rad), si = Math.sin(rad);
    const w0 = b0.w, h0 = b0.h, x0 = ev.clientX, y0 = ev.clientY;
    const esquina = sx && sy;
    const cand = candidatos(this.P, E.pagina, new Set([e.id]), { W: this.W, H: this.H, vis: (x) => this.vis(x) });
    const pr = e.permisos?.proporcion;
    const estricto = !permite(e, "fuera") && !e.rot;
    const t0 = e.texto?.tam;
    this._gesto(ev, {
      mover: (mv) => {
        const dxw = (mv.clientX - x0) / z, dyw = (mv.clientY - y0) / z;
        const lx = dxw * co + dyw * si, ly = -dxw * si + dyw * co;
        const k = mv.altKey ? 2 : 1;
        let nw = sx ? w0 + sx * lx * k : w0;
        let nh = sy ? h0 + sy * ly * k : h0;
        this.lineas = { x: [], y: [] };
        if (!e.rot && ed.iman !== false && !mv.altKey) {
          const rej = ed.cuadricula ? ed.paso : 0;
          if (sx) {
            const borde = sx > 0 ? b0.x + nw : b0.x + w0 - nw;
            const r = imanBorde(borde, cand.x, 7 / z, rej);
            nw = sx > 0 ? r.v - b0.x : b0.x + w0 - r.v;
            if (r.linea != null) this.lineas.x.push(r.linea);
          }
          if (sy) {
            const borde = sy > 0 ? b0.y + nh : b0.y + h0 - nh;
            const r = imanBorde(borde, cand.y, 7 / z, rej);
            nh = sy > 0 ? r.v - b0.y : b0.y + h0 - r.v;
            if (r.linea != null) this.lineas.y.push(r.linea);
          }
        }
        // Proporción: la del elemento si se fijó; si no, según el tipo (Mayús lo invierte).
        const fija = pr === true || (pr == null && (PROPORCION.has(e.tipo) || e.tipo === "texto"));
        if (esquina && fija !== !!mv.shiftKey) {
          const f = Math.abs(nw / w0 - 1) > Math.abs(nh / h0 - 1) ? nw / w0 : nh / h0;
          nw = w0 * f; nh = h0 * f;
        }
        nw = Math.max(8, nw); nh = Math.max(8, nh);
        let cx = cx0, cy = cy0;
        if (!mv.altKey) {
          const ox = (sx * (nw - w0)) / 2, oy = (sy * (nh - h0)) / 2;
          cx += ox * co - oy * si; cy += ox * si + oy * co;
        }
        let b = { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
        if (estricto) b = this._encajar(b);
        const c = this.guardarCaja(e, b, false);
        // Con la manija de una esquina, el texto crece con su caja (como en Canva).
        if (e.tipo === "texto" && esquina && t0 && fija !== !!mv.shiftKey) c["texto.tam"] = Math.max(6, Math.round(t0 * (nw / w0) * 10) / 10);
        E.setEl(e.id, c, "Cambiar tamaño");
      },
      soltar: () => terminar(),
      cancelar: () => terminar(false),
    });
  }

  /** Una caja sin rotar, metida dentro de la hoja. */
  _encajar(b) {
    const W = this.W, H = this.H;
    let { x, y, w, h } = b;
    if (x < 0) { w += x; x = 0; }
    if (y < 0) { h += y; y = 0; }
    if (x + w > W) w = W - x;
    if (y + h > H) h = H - y;
    return { x, y, w: Math.max(8, w), h: Math.max(8, h) };
  }

  /** Escalar varios a la vez (un grupo) desde una esquina. */
  _escalarGrupo(ev, m) {
    const E = this.estado;
    const sel = E.seleccionados;
    const u = union(sel.map((e) => cajaDe(this.vis(e))));
    const orig = sel.map((e) => ({ e, b: this.vis(e), tam: e.texto?.tam, tamB: e.boton?.tam }));
    const [sx, sy] = MANIJAS[m];
    const ax = sx > 0 ? u.x : u.x + u.w, ay = sy > 0 ? u.y : u.y + u.h;
    const x0 = ev.clientX, y0 = ev.clientY, z = this.v.z;
    const fin = E.gesto("Escalar grupo");
    this.gestoActivo = true;
    this._gesto(ev, {
      mover: (mv) => {
        const dx = ((mv.clientX - x0) / z) * sx, dy = ((mv.clientY - y0) / z) * sy;
        const k = Math.max(0.1, Math.max((u.w + dx) / u.w, (u.h + dy) / u.h));
        for (const o of orig) {
          const b = { x: ax + (o.b.x - ax) * k, y: ay + (o.b.y - ay) * k, w: o.b.w * k, h: o.b.h * k };
          const c = this.guardarCaja(o.e, b, false);
          if (o.tam) c["texto.tam"] = Math.round(o.tam * k * 10) / 10;
          if (o.tamB) c["boton.tam"] = Math.round(o.tamB * k * 10) / 10;
          E.setEl(o.e.id, c, "Escalar grupo");
        }
      },
      soltar: () => { this._anclar(sel.map((e) => e.id)); fin(); },
      cancelar: () => fin(false),
    });
  }

  _pan(ev) {
    this.vistaEl.classList.add("panea");
    let pan = null;
    this._gesto(ev, {
      mover: (m) => { if (!pan) pan = this._panDesde(ev.clientX, ev.clientY); pan(m); },
      soltar: () => this.vistaEl.classList.remove("panea"),
      cancelar: () => this.vistaEl.classList.remove("panea"),
    });
  }

  /* ── Dos dedos ──────────────────────────────────────────────────── */
  _dosDedos() {
    this._cancelarLargo();
    // Lo que hacía el primer dedo se deshace: el zoom no mueve nada sin querer.
    if (this.g) { const g = this.g; this.g = null; g.mover.cancelar(); g.cancelar(); }
    if (this.trazoVivo) { this.trazoVivo.remove(); this.trazoVivo = null; }
    this.lineas = { x: [], y: [] };
    this.gestoTam = false;
    this.marco = null;
    this.vistaEl.classList.remove("panea");
    const E = this.estado;
    const [a, b] = [...this.punteros.values()];
    const r = this.vistaEl.getBoundingClientRect();
    const base = {
      d0: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), a0: Math.atan2(b.y - a.y, b.x - a.x),
      mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top, z0: this.v.z, px: this.v.px, py: this.v.py, r,
    };
    const e = E.unico;
    const enEl = (p) => { const w = this.aMundo(p.x, p.y); return this._dentro(e, w.x, w.y, 30 / this.v.z); };
    let modo = "vista", fin = null;
    if (this.recortando) { modo = "recorte"; fin = E.gesto("Acercar foto"); base.rc = { x: 50, y: 50, zoom: 1, ...(E.el(this.recortando)?.imagen?.recorte || {}) }; }
    else if (e && !e.bloqueado && !this.editando && (permite(e, "tamano") || permite(e, "rotar")) && enEl(a) && enEl(b)) {
      modo = "elemento";
      fin = E.gesto("Pellizcar");
      base.e = e; base.b0 = this.vis(e); base.rot0 = e.rot || 0; base.tam0 = e.texto?.tam; base.tamB0 = e.boton?.tam;
    }
    this.gestoActivo = true;
    this.pellizco = { modo, ...base, fin, mover: enCuadro(() => this._pellizcar()) };
    this.pintarSobre();
  }

  _pellizcar() {
    const P = this.pellizco;
    if (!P || this.punteros.size < 2) return;
    const [a, b] = [...this.punteros.values()];
    const d = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y));
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const mx = (a.x + b.x) / 2 - P.r.left, my = (a.y + b.y) / 2 - P.r.top;
    const k = d / P.d0;
    const E = this.estado;
    if (P.modo === "vista") {
      const z = clamp(P.z0 * k, 0.1, 8);
      const wx = (P.mx - P.px) / P.z0, wy = (P.my - P.py) / P.z0;
      this.v = { z, px: mx - wx * z, py: my - wy * z, ajustar: false };
      this._acotarVista();
      this.pintarVista();
    } else if (P.modo === "recorte") {
      const zoom = clamp(Math.round(P.rc.zoom * k * 100) / 100, 1, 5);
      E.setEl(this.recortando, { "imagen.recorte": { ...P.rc, zoom } }, "Acercar foto");
    } else {
      const e = P.e, b0 = P.b0, z = this.v.z;
      const puede = { tam: permite(e, "tamano"), rot: permite(e, "rotar"), mov: permite(e, "mover") };
      const kk = puede.tam ? clamp(k, 8 / Math.min(b0.w, b0.h), 20) : 1;
      const nw = b0.w * kk, nh = b0.h * kk;
      let cx = b0.x + b0.w / 2, cy = b0.y + b0.h / 2;
      if (puede.mov) { cx += (mx - P.mx) / z; cy += (my - P.my) / z; }
      const c = this.guardarCaja(e, { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh }, false);
      if (puede.rot) {
        let rot = P.rot0 + ((ang - P.a0) * 180) / Math.PI;
        const q = Math.round(rot / 45) * 45;
        if (Math.abs(rot - q) < 4) rot = q;
        c.rot = Math.round((((((rot + 180) % 360) + 360) % 360) - 180) * 10) / 10;
      }
      if (puede.tam && P.tam0) c["texto.tam"] = Math.max(6, Math.round(P.tam0 * kk * 10) / 10);
      if (puede.tam && P.tamB0) c["boton.tam"] = Math.max(6, Math.round(P.tamB0 * kk * 10) / 10);
      this.gestoTam = true;
      E.setEl(e.id, c, "Pellizcar");
    }
  }

  _finPellizco() {
    const P = this.pellizco;
    if (!P) return;
    P.mover.ya();
    this.pellizco = null;
    this.gestoActivo = false;
    this.gestoTam = false;
    if (P.fin) { if (P.modo === "elemento") this._anclar([P.e.id]); P.fin(); }
    // El dedo que queda no empieza nada nuevo hasta que se levante.
    for (const id of this.punteros.keys()) this.punteros.delete(id);
    this.pintarSobre();
  }

  _marco(ev) {
    const r = this.vistaEl.getBoundingClientRect();
    const x0 = ev.clientX - r.left, y0 = ev.clientY - r.top;
    let movio = false;
    this._gesto(ev, {
      mover: (m) => {
        const x1 = m.clientX - r.left, y1 = m.clientY - r.top;
        if (!movio && Math.hypot(x1 - x0, y1 - y0) < 4) return;
        movio = true;
        this.marco = { left: Math.min(x0, x1) + "px", top: Math.min(y0, y1) + "px", width: Math.abs(x1 - x0) + "px", height: Math.abs(y1 - y0) + "px" };
        this.pintarSobre();
      },
      soltar: (u) => {
        this.marco = null;
        if (!movio) { this.dentroGrupo = null; this.estado.seleccionar([]); return; }
        const a = this.aMundo(Math.min(ev.clientX, u.clientX), Math.min(ev.clientY, u.clientY));
        const b = this.aMundo(Math.max(ev.clientX, u.clientX), Math.max(ev.clientY, u.clientY));
        const ids = this.estado.pagina.els.filter((e) => {
          if (e.bloqueado || e.oculto || !permite(e, "seleccionar")) return false;
          const c = cajaDe(this.vis(e));
          return c.x < b.x && c.x + c.w > a.x && c.y < b.y && c.y + c.h > a.y;
        }).map((e) => e.id);
        this.estado.seleccionar(ids, u.shiftKey);
      },
      cancelar: () => { this.marco = null; },
    });
  }

  /* ── Menú del elemento (mantener presionado o botón derecho) ─────── */
  menuEn(x, y) {
    const E = this.estado;
    const A = this.app.acciones;
    const e = this.tocar(x, y, true);
    if (e && !E.sel.includes(e.id)) E.seleccionar(this._grupo(e));
    if (!e) E.seleccionar([]);
    const sel = E.seleccionados;
    const t = (i, txt) => `${ico(i)}<span>${txt}</span>`;
    const uno = sel.length === 1 ? sel[0] : null;
    let items;
    if (sel.length) {
      const bloq = sel.every((x) => x.bloqueado);
      const editar = uno && !bloq && (
        uno.tipo === "texto" ? { t: t("editar", "Escribir"), al: () => this.editarTexto(uno) }
          : uno.tipo === "imagen" ? { t: t(uno.imagen?.asset ? "recortar" : "imagen", uno.imagen?.asset ? "Encuadrar la foto" : "Poner foto"), al: () => this.editar(uno) }
            : uno.tipo === "html" ? { t: t("html", "Editar HTML"), al: () => A.editarHtml(uno) }
              : /componente|escena3d|album|carrusel|video|boton/.test(uno.tipo) ? { t: t("herramientas", "Personalizar"), al: () => this.app.insp.abrir("diseno") } : null);
      const probable = uno && /componente|html|pagina|escena3d/.test(uno.tipo);
      const agrupados = sel.some((x) => x.grupo);
      items = [
        editar,
        probable ? { t: t("play", "Probar aquí"), al: () => this.probarAqui(uno) } : null,
        editar || probable ? "-" : null,
        { t: t("duplicar", "Duplicar"), al: () => A.duplicar(), off: bloq },
        { t: t("copiar", "Copiar"), al: () => A.copiar() },
        { t: t("tijeras", "Cortar"), al: () => A.cortar(), off: bloq },
        { t: t("pegar", "Pegar"), al: () => A.pegar(), off: !A.portapapeles },
        "-",
        { t: t("alFrente", "Traer al frente"), al: () => A.capa("frente") },
        { t: t("alFondo", "Llevar al fondo"), al: () => A.capa("fondo") },
        sel.length > 1 && !agrupados ? { t: t("enlazar", "Agrupar"), al: () => A.agrupar() } : null,
        agrupados ? { t: t("desenlazar", "Desagrupar"), al: () => A.desagrupar() } : null,
        { t: t("recuperar", "Traer dentro de la hoja"), al: () => this.traerALaHoja(sel.map((x) => x.id)) },
        "-",
        { t: t(bloq ? "abierto" : "candado", bloq ? "Desbloquear" : "Bloquear"), al: () => A.alternar("bloqueado") },
        { t: t("mano", "Permisos (mover, tamaño…)"), al: () => this.app.insp.abrir("diseno", "Permisos") },
        { t: t("ojoNo", "Ocultar en el editor"), al: () => A.alternar("oculto") },
        { t: t("animar", "Animar"), al: () => this.app.insp.abrir("animar") },
        "-",
        { t: t("borrar", "Borrar"), al: () => A.borrar(), peligro: true, off: bloq },
      ];
    } else {
      items = [
        { t: t("pegar", "Pegar"), al: () => A.pegar(), off: !A.portapapeles },
        { t: t("texto", "Añadir texto"), al: () => A.texto("parrafo") },
        { t: t("ok", "Elegir todo"), al: () => E.seleccionar(E.pagina.els.filter((x) => !x.bloqueado && !x.oculto && permite(x, "seleccionar")).map((x) => x.id)) },
        "-",
        { t: t("diseno", "Fondo de la página"), al: () => this.app.insp.abrir("diseno", "Fondo") },
        { t: t("ajustar", "Ver la hoja entera"), al: () => this.ajustar() },
      ];
    }
    menu({ x, y }, items);
  }

  /* ── Guías ──────────────────────────────────────────────────────── */
  _nuevaGuia(ev, eje) {
    ev.preventDefault();
    const E = this.estado;
    const guias = [...(this.P.editor.guias || [])];
    const g = { eje, pos: 0 };
    let dentro = false;
    const r = this.vistaEl.getBoundingClientRect();
    const mover = (m) => {
      const w = this.aMundo(m.clientX, m.clientY);
      g.pos = Math.round(eje === "x" ? w.x : w.y);
      dentro = m.clientX > r.left && m.clientY > r.top;
      this.P.editor.guias = dentro ? [...guias, g] : guias;
      this._pintarGuias();
    };
    const fin = () => {
      removeEventListener("pointermove", mover);
      removeEventListener("pointerup", fin);
      this.P.editor.guias = guias;
      if (dentro) E.setProy({ "editor.guias": [...guias, g] }, "Añadir guía");
      this._pintarGuias();
    };
    addEventListener("pointermove", mover);
    addEventListener("pointerup", fin);
  }

  _moverGuia(ev, i) {
    const E = this.estado;
    const guias = (this.P.editor.guias || []).map((g) => ({ ...g }));
    const g = guias[i];
    const r = this.vistaEl.getBoundingClientRect();
    let fuera = false;
    const mover = (m) => {
      const w = this.aMundo(m.clientX, m.clientY);
      g.pos = Math.round(g.eje === "x" ? w.x : w.y);
      fuera = g.eje === "x" ? m.clientX < r.left : m.clientY < r.top;
      this.P.editor.guias = guias.filter((x) => x !== g || !fuera);
      this._pintarGuias();
    };
    const antes = this.P.editor.guias;
    const fin = () => {
      removeEventListener("pointermove", mover);
      removeEventListener("pointerup", fin);
      this.P.editor.guias = antes;
      E.setProy({ "editor.guias": guias.filter((x) => x !== g || !fuera) }, fuera ? "Quitar guía" : "Mover guía");
      this._pintarGuias();
    };
    addEventListener("pointermove", mover);
    addEventListener("pointerup", fin);
  }

  /* ── Editar en el sitio ─────────────────────────────────────────── */
  editar(e) {
    if (e.bloqueado) return;
    if (e.tipo === "texto") this.editarTexto(e);
    else if (e.tipo === "imagen" && e.imagen?.asset) this.recortar(e);
    else if (e.tipo === "imagen" || e.tipo === "video" || e.tipo === "album" || e.tipo === "carrusel") this.app.acciones.pedirArchivoPara(e);
    else if (e.tipo === "html") this.app.acciones.editarHtml(e);
    else if (e.tipo === "boton" || e.tipo === "componente" || e.tipo === "escena3d") this.app.insp?.abrir("diseno");
  }

  editarTexto(e) {
    const n = this.pag?.nodos.get(e.id);
    const t = n?.querySelector(".rt-t");
    if (!t) return;
    this.editando = e.id;
    this._marcarNodo(e.id, "ed-editando", true);
    t.contentEditable = "true";
    t.spellcheck = true;
    t.focus({ preventScroll: true });
    const rango = document.createRange();
    rango.selectNodeContents(t);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(rango);
    const crecer = () => {
      const alto = t.scrollHeight + (e.caja?.relleno || 0) * 2;
      if (alto > n.offsetHeight) n.style.height = alto + "px";
      this.pintarSobre();
    };
    t.addEventListener("input", crecer);
    t.addEventListener("keydown", (k) => {
      if (k.key === "Escape" || (k.key === "Enter" && (k.metaKey || k.ctrlKey))) { k.preventDefault(); t.blur(); }
      k.stopPropagation();
    });
    t.addEventListener("blur", () => this.terminarTexto(), { once: true });
    this._quitarCrecer = () => t.removeEventListener("input", crecer);
    this.pintarSobre();
  }

  /** Con el teclado abierto, que lo que se escribe no quede tapado (sin brincos de zoom). */
  _mostrarEditando() {
    const e = this.estado.el(this.editando);
    if (!e) return;
    const b = this.vis(e);
    const vh = this.vistaEl.clientHeight;
    const top = this.v.py + b.y * this.v.z, bot = top + Math.min(b.h * this.v.z, vh * 0.6);
    if (bot > vh - 12) this.v.py -= bot - (vh - 12);
    else if (top < 12) this.v.py += 12 - top;
    this.v.ajustar = false;
    this.pintarVista();
  }

  terminarTexto() {
    if (!this.editando) return;
    const id = this.editando;
    this.editando = null;
    this._quitarCrecer?.();
    const n = this.pag?.nodos.get(id);
    const t = n?.querySelector(".rt-t");
    const e = this.estado.el(id);
    this._marcarNodo(id, "ed-editando", false);
    if (!t || !e) return;
    t.contentEditable = "false";
    const html = RT.sanearTexto(t.innerHTML);
    const alto = Math.max(e.h, Math.ceil(t.scrollHeight + (e.caja?.relleno || 0) * 2));
    getSelection()?.removeAllRanges();
    this.estado.setEl(id, { "texto.html": html, h: alto }, "Editar texto");
    this.pintarSobre();
  }

  /** Alto que necesita un texto (después de cambiar letra, tamaño…). */
  ajustarAlto(id) {
    const e = this.estado.el(id);
    const t = this.pag?.nodos.get(id)?.querySelector(".rt-t");
    if (!e || !t || e.tipo !== "texto") return;
    const alto = Math.ceil(t.scrollHeight + (e.caja?.relleno || 0) * 2);
    if (alto > e.h) this.estado.setEl(id, { h: alto }, "Ajustar alto", "alto" + id);
  }

  /* ── Recortar una foto ──────────────────────────────────────────── */
  recortar(e) {
    this.recortando = e.id;
    this.aviso.hidden = false;
    this.aviso.innerHTML = "";
    this.aviso.append(el("span", { text: "Arrastra para encuadrar · dos dedos o rueda para acercar" }), el("button.ed-btn.primario", { type: "button", text: "Listo", onClick: () => this.salirRecorte() }));
    this.pintarSobre();
  }

  salirRecorte() {
    if (!this.recortando) return;
    this.recortando = null;
    this.aviso.hidden = true;
    this.pintarSobre();
  }

  _recorte(ev, e) {
    const x0 = ev.clientX, y0 = ev.clientY;
    const r0 = { x: 50, y: 50, zoom: 1, ...(e.imagen.recorte || {}) };
    const b = this.vis(e);
    let fin = null;
    this._gesto(ev, {
      mover: (m) => {
        if (!fin) { fin = this.estado.gesto("Encuadrar foto"); this.gestoActivo = true; }
        const k = 100 / (r0.zoom * this.v.z);
        const x = clamp(r0.x - (((m.clientX - x0) * k) / b.w) * 1.6, 0, 100);
        const y = clamp(r0.y - (((m.clientY - y0) * k) / b.h) * 1.6, 0, 100);
        this.estado.setEl(e.id, { "imagen.recorte": { ...r0, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } }, "Encuadrar foto");
      },
      soltar: () => { if (fin) fin(); },
      cancelar: () => { if (fin) fin(false); },
    });
  }

  _zoomRecorte(d) {
    const e = this.estado.el(this.recortando);
    if (!e) return;
    const r = { x: 50, y: 50, zoom: 1, ...(e.imagen.recorte || {}) };
    r.zoom = clamp(Math.round(r.zoom * Math.exp(-d * 0.004) * 100) / 100, 1, 5);
    this.estado.setEl(e.id, { "imagen.recorte": r }, "Acercar foto", "zoomfoto" + e.id);
  }

  /* ── Dibujar a mano ─────────────────────────────────────────────── */
  lapiz(opciones) {
    this.herramienta = opciones ? "lapiz" : null;
    this.lapizOp = opciones;
    this.vistaEl.classList.toggle("lapiz", !!opciones);
    if (opciones) this.estado.seleccionar([]);
    this.pintarSobre();
  }

  _lapiz(ev) {
    const pts = [this.aMundo(ev.clientX, ev.clientY)];
    const op = this.lapizOp || { color: "#d8397a", grosor: 4 };
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "ed-trazo-vivo");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", op.color);
    path.setAttribute("stroke-width", op.grosor * this.v.z);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    this.trazoVivo = svg;
    this.sobre.append(svg);
    const pintar = () => { path.setAttribute("d", "M" + pts.map((p) => { const s = this.aPantalla(p.x, p.y); return s.x.toFixed(1) + " " + s.y.toFixed(1); }).join("L")); };
    this._gesto(ev, {
      // Todos los puntos (los teléfonos rápidos mandan varios por cuadro); se pinta una vez por cuadro.
      cada: (m) => {
        const lista = m.getCoalescedEvents ? m.getCoalescedEvents() : [];
        for (const c of lista.length ? lista : [m]) {
          const p = this.aMundo(c.clientX, c.clientY);
          const u = pts[pts.length - 1];
          if (Math.hypot(p.x - u.x, p.y - u.y) * this.v.z >= 2) pts.push(p);
        }
      },
      mover: () => pintar(),
      soltar: () => {
        svg.remove();
        this.trazoVivo = null;
        if (pts.length < 2) return;
        this.app.acciones.crearTrazo(pts, op);
      },
      cancelar: () => { svg.remove(); this.trazoVivo = null; },
    });
  }
}
