/**
 * EL LIENZO — la hoja que se edita.
 *
 * La hoja la pinta el MISMO código que el librito exportado (runtime/), así
 * lo que ves aquí es lo que sale. Encima va una capa de pantalla con lo del
 * editor: la caja de lo seleccionado, sus manijas, las líneas del imán, el
 * marco de selección y la barrita flotante.
 *
 * Gestos:
 *   arrastrar un elemento       moverlo (con imán; Mayús = sólo en un eje)
 *   manijas                     tamaño (esquinas de fotos guardan proporción;
 *                               Mayús lo invierte, Alt crece desde el centro)
 *   manija redonda              girar (se pega a 0/45/90…; Mayús = de 15 en 15)
 *   doble toque                 editar el texto / recortar la foto / abrir el HTML
 *   dos dedos · Ctrl+rueda      zoom; rueda o espacio+arrastrar: desplazar
 *   arrastrar en vacío (ratón)  seleccionar varios
 */
import { el } from "../components/ui.js";
import { rutaAUrl } from "../assets/biblioteca.js";
import { cajaDe, union, candidatos, imanMover, imanBorde, pintarRegla } from "./guias.js";
import { tocaZona } from "../componentes/analizar.js";

const RT = window.LibritoRT;
const PROPORCION = new Set(["imagen", "dibujo", "trazo", "video", "componente"]);
const MANIJAS = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0] };
const REGLA = 20;

export class Lienzo {
  constructor(app, raiz) {
    this.app = app;
    this.estado = app.estado;
    this.raiz = raiz;
    this.v = { z: 1, px: 0, py: 0, ajustar: true };
    this.pag = null;
    this.lineas = { x: [], y: [] };
    this.punteros = new Map();
    this.herramienta = null;
    this.ctx = {
      modo: "editor",
      url: (id) => app.bib.url(id),
      ruta: (r) => rutaAUrl(r),
      pedir: true,
    };
    this._construir();
    this._escuchar();
    this._gestos();
  }

  get P() { return this.estado.proyecto; }
  get W() { return this.P.ajustes.ancho; }
  get H() { return this.P.ajustes.alto; }

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
    this.vistaEl = el("div.ed-vista", { tabindex: "-1" }, [this.mundo, this.sobre]);
    this.flotante = el("div.ed-flotante", { hidden: "" });
    this.aviso = el("div.ed-lienzo-aviso", { hidden: "" });
    r.append(this.reglaX, this.reglaY, this.esquina, this.vistaEl, this.flotante, this.aviso);
    new ResizeObserver(() => { if (this.v.ajustar) this.ajustar(); else this.pintarVista(); }).observe(this.vistaEl);
  }

  _escuchar() {
    const E = this.estado;
    E.on("cargado", () => { this.montar(); this.ajustar(); });
    E.on("actual", () => { this.terminarTexto(); this.salirRecorte(); this.montar(); });
    E.on("els", ({ p }) => { if (p === E.paginaId && this.pag) { this.pag.sincronizar(E.pagina); this.pintarSobre(); } });
    E.on("pagina", ({ p }) => { if (p === E.paginaId && this.pag) { this.pag.sincronizar(E.pagina); this.pintarSobre(); } });
    E.on("el", ({ p, e, ruta }) => {
      if (p !== E.paginaId || !this.pag) return;
      const x = E.el(e);
      if (!x) return;
      // Cambiar un elemento puede cambiar qué se esconde en la página original de debajo.
      if (ruta === "origen" || x.origen) this.pag.sincronizar(E.pagina); else this.pag.actualizar(x);
      this.pintarSobre();
    });
    E.on("proyecto", ({ ruta }) => {
      if (/^ajustes\.(ancho|alto)/.test(ruta)) { this.montar(); this.ajustar(); }
      else if (/^editor/.test(ruta)) this.pintarVista();
    });
    E.on("assets", () => { if (this.pag) { for (const n of this.pag.nodos.values()) n._rt.firma = null; this.pag.sincronizar(E.pagina); } });
    E.on("sel", () => { this.salirRecorte(); if (this.probando && !E.sel.includes(this.probando)) this.salirProbar(); this.pintarSobre(); });
  }

  /** Pinta la página actual (y suelta la anterior entera). */
  montar() {
    if (this.pag) { this.pag.destruir(); this.pag = null; }
    const p = this.estado.pagina;
    this.hoja.style.width = this.W + "px";
    this.hoja.style.height = this.H + "px";
    if (!p) { this.pintarVista(); return; }
    this.pag = new RT.Pagina(p, this.ctx, this.W, this.H);
    this.hoja.append(this.pag.nodo);
    RT.cargarFuentes(p.els.map((e) => e.texto?.fuente || e.boton?.fuente));
    this.pintarVista();
  }

  /* ── Zoom y desplazamiento ──────────────────────────────────────── */
  ajustar() {
    const r = this.vistaEl.getBoundingClientRect();
    if (!r.width || !this.P) return;
    const mx = r.width < 600 ? 16 : 56, my = r.width < 600 ? 16 : 48;
    const z = Math.max(0.05, Math.min((r.width - mx) / this.W, (r.height - my) / this.H));
    this.v = { z, px: (r.width - this.W * z) / 2, py: (r.height - this.H * z) / 2, ajustar: true };
    this.pintarVista();
  }

  zoom(z, cx, cy) {
    if (z === "ajustar") return this.ajustar();
    const r = this.vistaEl.getBoundingClientRect();
    if (cx == null) { cx = r.width / 2; cy = r.height / 2; }
    z = Math.max(0.1, Math.min(8, z));
    const wx = (cx - this.v.px) / this.v.z, wy = (cy - this.v.py) / this.v.z;
    this.v = { z, px: cx - wx * z, py: cy - wy * z, ajustar: false };
    this.pintarVista();
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
    this.rejilla.style.backgroundSize = `${paso}px ${paso}px, ${paso * 5}px ${paso * 5}px`;
    this.margen.hidden = !ed.margenes;
    const m = ed.margen || 0;
    Object.assign(this.margen.style, { left: m + "px", top: m + "px", width: this.W - 2 * m + "px", height: this.H - 2 * m + "px" });
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

  _pintarSobre() {
    const s = this.sobre;
    s.textContent = "";
    const E = this.estado;
    if (!E.pagina) { this.flotante.hidden = true; return; }
    const { z } = this.v;
    const sel = E.seleccionados;
    const caja = (e, clase) => {
      const c = this.aPantalla(e.x + e.w / 2, e.y + e.h / 2);
      const n = el("div." + clase, { style: { left: c.x - (e.w * z) / 2 + "px", top: c.y - (e.h * z) / 2 + "px", width: e.w * z + "px", height: e.h * z + "px", transform: e.rot ? `rotate(${e.rot}deg)` : "" } });
      s.append(n);
      return n;
    };
    if (this.hover && !E.sel.includes(this.hover)) { const h = E.el(this.hover); if (h) caja(h, "ed-hover"); }
    const unico = sel.length === 1 ? sel[0] : null;
    for (const e of sel) {
      const n = caja(e, "ed-caja" + (e.bloqueado ? ".bloq" : "") + (this.editando === e.id ? ".editando" : ""));
      if (unico && !e.bloqueado && !this.editando && !this.recortando) {
        for (const m of Object.keys(MANIJAS)) n.append(el("i.ed-manija.m-" + m, { dataset: { m } }));
        n.append(el("i.ed-manija.m-rot", { dataset: { m: "rot" }, title: "Girar" }));
        if (this.gestoTam) n.append(el("b.ed-medida", { text: `${Math.round(e.w)} × ${Math.round(e.h)}` + (e.rot ? ` · ${Math.round(e.rot)}°` : "") }));
      }
      if (this.recortando === e.id) n.classList.add("recortando");
    }
    if (sel.length > 1) {
      const u = union(sel.map(cajaDe));
      const g = caja({ ...u, rot: 0 }, "ed-caja-grupo");
      if (!sel.some((e) => e.bloqueado) && !this.editando) for (const m of ["nw", "ne", "se", "sw"]) g.append(el("i.ed-manija.m-" + m, { dataset: { m, grupo: "1" } }));
    }
    // Las zonas que detectó el editor en un componente (sólo para el editor).
    if (unico && unico.tipo === "componente" && unico.componente?.analisis) {
      const k = unico.componente, an = k.analisis;
      const W = k.ajuste === "adaptar" ? unico.w : k.ancho || unico.w, H = k.ajuste === "adaptar" ? unico.h : k.alto || unico.h;
      const sx = unico.w / W, sy = unico.h / H;
      const marco = caja(unico, "ed-zonas");
      const poner = (z, clase, txt) => marco.append(el("i." + clase, { title: txt || "", style: { left: z.x * sx * this.v.z + "px", top: z.y * sy * this.v.z + "px", width: z.w * sx * this.v.z + "px", height: z.h * sy * this.v.z + "px" } }));
      for (const z of an.interactivos || []) poner(z, "ed-zona-toca", "zona táctil: " + (z.que || ""));
      if (!(an.interactivos || []).length) for (const z of an.visual || []) poner(z, "ed-zona-ve");
      if (k.sinFondo) marco.classList.add("sin-fondo");
    }
    const tl = this.aPantalla(0, 0);
    for (const x of this.lineas.x) { const p = this.aPantalla(x, 0); s.append(el("i.ed-iman.v", { style: { left: p.x + "px", top: tl.y + "px", height: this.H * z + "px" } })); }
    for (const y of this.lineas.y) { const p = this.aPantalla(0, y); s.append(el("i.ed-iman.h", { style: { top: p.y + "px", left: tl.x + "px", width: this.W * z + "px" } })); }
    if (this.marco) s.append(el("div.ed-marco", { style: this.marco }));
    if (this.trazoVivo) s.append(this.trazoVivo);
    this._pintarFlotante(sel);
  }

  _pintarFlotante(sel) {
    const f = this.flotante;
    if (!sel.length || this.gestoActivo || this.editando || this.herramienta) { f.hidden = true; return; }
    const u = union(sel.map(cajaDe));
    const a = this.aPantalla(u.x + u.w / 2, u.y);
    const b = this.aPantalla(u.x + u.w / 2, u.y + u.h);
    this.app.acciones.barraFlotante(f, sel);
    f.hidden = false;
    const vw = this.vistaEl.clientWidth, fw = f.offsetWidth || 260, fh = f.offsetHeight || 44;
    const ox = this.vistaEl.offsetLeft, oy = this.vistaEl.offsetTop;
    let top = a.y - fh - 34;
    if (top < 6) top = Math.min(b.y + 34, this.vistaEl.clientHeight - fh - 6);
    f.style.left = Math.max(6, Math.min(vw - fw - 6, a.x - fw / 2)) + ox + "px";
    f.style.top = top + oy + "px";
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
      if (!e || e.oculto || (!conBloqueados && e.bloqueado)) continue;
      // Un componente sólo se agarra por su zona real (su botón, lo que se ve),
      // no por todo su rectángulo: así no tapa lo que hay debajo.
      if (e.tipo === "componente" && e.componente?.seleccion !== "todo" && !this._enZona(e, w.x, w.y)) continue;
      arriba = e;
      break;
    }
    // Lo ya elegido se agarra por toda su caja (para arrastrarlo), salvo que
    // encima haya otra cosa: entonces gana la de encima.
    for (const e of this.estado.seleccionados) {
      if (e.bloqueado && !conBloqueados) continue;
      if (this._dentro(e, w.x, w.y) && (!arriba || els.indexOf(e) >= els.indexOf(arriba))) return e;
    }
    return arriba;
  }

  /** Punto de la hoja → coordenadas propias del elemento (sin giro). */
  _local(e, x, y) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const r = (-(e.rot || 0) * Math.PI) / 180;
    const dx = x - cx, dy = y - cy;
    return { x: dx * Math.cos(r) - dy * Math.sin(r) + e.w / 2, y: dx * Math.sin(r) + dy * Math.cos(r) + e.h / 2 };
  }

  _dentro(e, x, y) { const l = this._local(e, x, y); return l.x >= 0 && l.y >= 0 && l.x <= e.w && l.y <= e.h; }

  _enZona(e, x, y) {
    const k = e.componente || {};
    const l = this._local(e, x, y);
    if (l.x < 0 || l.y < 0 || l.x > e.w || l.y > e.h) return false;
    if (k.ajuste === "adaptar") return tocaZona(k.analisis, l.x, l.y);
    return tocaZona(k.analisis, (l.x * (k.ancho || e.w)) / e.w, (l.y * (k.alto || e.h)) / e.h, 6 * ((k.ancho || e.w) / e.w));
  }

  /** Los del mismo grupo que `e` (o sólo él). */
  _grupo(e) {
    if (!e.grupo || this.dentroGrupo === e.grupo) return [e.id];
    return this.estado.pagina.els.filter((x) => x.grupo === e.grupo && !x.oculto).map((x) => x.id);
  }

  /** Tocar un componente de verdad, aquí mismo, sin salir del editor. */
  probarAqui(e) {
    this.salirProbar();
    const n = this.pag?.nodos.get(e.id);
    if (!n) return;
    n.classList.add("ed-probando");
    this.probando = e.id;
    this.aviso.hidden = false;
    this.aviso.innerHTML = "";
    this.aviso.append(el("span", { text: "Probando: tócalo como en el librito" }), el("button.ed-btn.primario", { type: "button", text: "Listo", onClick: () => this.salirProbar() }));
    this.pintarSobre();
  }

  salirProbar() {
    if (!this.probando) return;
    this.pag?.nodos.get(this.probando)?.classList.remove("ed-probando");
    this.probando = null;
    this.aviso.hidden = true;
    this.pintarSobre();
  }

  /* ── Gestos ─────────────────────────────────────────────────────── */
  _gestos() {
    const v = this.vistaEl;
    v.addEventListener("pointerdown", (ev) => this._abajo(ev));
    v.addEventListener("pointermove", (ev) => this._hover(ev));
    v.addEventListener("pointerleave", () => { if (this.hover) { this.hover = null; this.pintarSobre(); } });
    const fuera = (ev) => { this.punteros.delete(ev.pointerId); if (this.punteros.size < 2) this.pellizco = null; };
    addEventListener("pointerup", fuera, true);
    addEventListener("pointercancel", fuera, true);
    v.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      const r = v.getBoundingClientRect();
      if (this.recortando && !ev.ctrlKey) return this._zoomRecorte(ev.deltaY);
      if (ev.ctrlKey || ev.metaKey) this.zoom(this.v.z * Math.exp(-ev.deltaY * 0.012), ev.clientX - r.left, ev.clientY - r.top);
      else { this.v.px -= ev.deltaX; this.v.py -= ev.deltaY; this.v.ajustar = false; this.pintarVista(); }
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

  _hover(ev) {
    if (ev.pointerType !== "mouse" || this.gestoActivo || this.punteros.size) return;
    const e = this.tocar(ev.clientX, ev.clientY);
    const id = e ? e.id : null;
    if (id !== this.hover) { this.hover = id; this.pintarSobre(); }
  }

  _seguir(ev, mover, soltar) {
    const v = this.vistaEl;
    try { v.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    const id = ev.pointerId;
    const m = (e) => { if (e.pointerId === id && !this.pellizco) mover(e); };
    const u = (e) => {
      if (e.pointerId !== id) return;
      v.removeEventListener("pointermove", m);
      v.removeEventListener("pointerup", u);
      v.removeEventListener("pointercancel", u);
      this.gestoActivo = false;
      soltar(e, e.type === "pointercancel");
      this.pintarSobre();
    };
    v.addEventListener("pointermove", m);
    v.addEventListener("pointerup", u);
    v.addEventListener("pointercancel", u);
  }

  _abajo(ev) {
    if (this.editando && ev.target.closest(".ed-editando")) return;
    if (this.editando) this.terminarTexto();
    this.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (this.punteros.size === 2) return this._pellizcar();
    if (this.punteros.size > 2) return;
    if (ev.button === 2) return;
    if (ev.pointerType === "mouse") ev.preventDefault();
    this.vistaEl.focus({ preventScroll: true });
    const man = ev.target.closest(".ed-manija");
    if (man) { ev.preventDefault(); return man.dataset.grupo ? this._escalarGrupo(ev, man.dataset.m) : this._manija(ev, man.dataset.m); }
    if (this.herramienta === "lapiz") return this._lapiz(ev);
    if (ev.button === 1 || this.espacio) return this._pan(ev);
    const e = this.tocar(ev.clientX, ev.clientY);
    if (this.recortando) {
      if (e && e.id === this.recortando) return this._recorte(ev, e);
      this.salirRecorte();
    }
    if (this.probando) this.salirProbar();
    if (e) {
      const sel = this.estado.sel;
      if (ev.target.closest("[data-pedir]") && sel.length === 1 && sel[0] === e.id) { this.app.acciones.pedirArchivoPara(e); return; }
      if (e.grupo !== this.dentroGrupo) this.dentroGrupo = null;
      if (ev.shiftKey || ev.metaKey || ev.ctrlKey) { this.estado.seleccionar(this._grupo(e), true); return; }
      if (!sel.includes(e.id)) this.estado.seleccionar(this._grupo(e));
      this._mover(ev, e);
    } else if (ev.pointerType === "mouse") this._marco(ev);
    else this._pan(ev, true);
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

  _mover(ev, tocado) {
    const E = this.estado;
    const sel = E.seleccionados.filter((e) => !e.bloqueado);
    const x0 = ev.clientX, y0 = ev.clientY, z = this.v.z;
    const orig = sel.map((e) => ({ id: e.id, x: e.x, y: e.y }));
    const caja0 = sel.length ? union(sel.map(cajaDe)) : null;
    const cand = sel.length ? candidatos(this.P, E.pagina, new Set(sel.map((e) => e.id))) : null;
    const ed = this.P.editor || {};
    let fin = null;
    this._seguir(ev, (m) => {
      if (!sel.length) return;
      const sx = m.clientX - x0, sy = m.clientY - y0;
      if (!fin) { if (Math.hypot(sx, sy) < (m.pointerType === "touch" ? 7 : 3)) return; fin = E.gesto("Mover"); this.gestoActivo = true; }
      let dx = sx / z, dy = sy / z;
      if (m.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      this.lineas = { x: [], y: [] };
      if (ed.iman !== false && !m.altKey) {
        const r = imanMover({ ...caja0, x: caja0.x + dx, y: caja0.y + dy }, cand, 6 / z, ed.cuadricula ? ed.paso : 0);
        if (!m.shiftKey || dx) dx += r.dx;
        if (!m.shiftKey || dy) dy += r.dy;
        this.lineas = { x: r.lx, y: r.ly };
      }
      for (const o of orig) E.setEl(o.id, { x: Math.round(o.x + dx), y: Math.round(o.y + dy) }, "Mover");
    }, (u, cancelado) => {
      this.lineas = { x: [], y: [] };
      if (fin) fin();
      else if (!cancelado) this._toque(tocado);
    });
  }

  _manija(ev, m) {
    const E = this.estado;
    const e = E.unico;
    if (!e || e.bloqueado) return;
    const z = this.v.z;
    const cx0 = e.x + e.w / 2, cy0 = e.y + e.h / 2;
    const fin = E.gesto(m === "rot" ? "Girar" : "Cambiar tamaño");
    this.gestoActivo = true;
    this.gestoTam = true;
    const ed = this.P.editor || {};
    if (m === "rot") {
      const c = this.aPantalla(cx0, cy0);
      const r = this.vistaEl.getBoundingClientRect();
      const a0 = Math.atan2(ev.clientY - r.top - c.y, ev.clientX - r.left - c.x);
      const rot0 = e.rot || 0;
      this._seguir(ev, (mv) => {
        const a = Math.atan2(mv.clientY - r.top - c.y, mv.clientX - r.left - c.x);
        let rot = rot0 + ((a - a0) * 180) / Math.PI;
        if (mv.shiftKey) rot = Math.round(rot / 15) * 15;
        else { const k = Math.round(rot / 45) * 45; if (Math.abs(rot - k) < 3) rot = k; }
        rot = ((((rot + 180) % 360) + 360) % 360) - 180;
        E.setEl(e.id, { rot: Math.round(rot * 10) / 10 }, "Girar");
      }, () => { this.gestoTam = false; fin(); });
      return;
    }
    const [sx, sy] = MANIJAS[m];
    const rad = ((e.rot || 0) * Math.PI) / 180, co = Math.cos(rad), si = Math.sin(rad);
    const w0 = e.w, h0 = e.h, x0 = ev.clientX, y0 = ev.clientY;
    const esquina = sx && sy;
    const cand = candidatos(this.P, E.pagina, new Set([e.id]));
    this._seguir(ev, (mv) => {
      const dxw = (mv.clientX - x0) / z, dyw = (mv.clientY - y0) / z;
      const lx = dxw * co + dyw * si, ly = -dxw * si + dyw * co;
      const k = mv.altKey ? 2 : 1;
      let nw = sx ? w0 + sx * lx * k : w0;
      let nh = sy ? h0 + sy * ly * k : h0;
      this.lineas = { x: [], y: [] };
      if (!e.rot && ed.iman !== false && !mv.altKey) {
        const rej = ed.cuadricula ? ed.paso : 0;
        if (sx) {
          const borde = sx > 0 ? e.x + nw : e.x + w0 - nw;
          const r = imanBorde(borde, cand.x, 6 / z, rej);
          nw = sx > 0 ? r.v - e.x : e.x + w0 - r.v;
          if (r.linea != null) this.lineas.x.push(r.linea);
        }
        if (sy) {
          const borde = sy > 0 ? e.y + nh : e.y + h0 - nh;
          const r = imanBorde(borde, cand.y, 6 / z, rej);
          nh = sy > 0 ? r.v - e.y : e.y + h0 - r.v;
          if (r.linea != null) this.lineas.y.push(r.linea);
        }
      }
      const guardar = esquina && (PROPORCION.has(e.tipo) !== !!mv.shiftKey);
      if (guardar) {
        const f = Math.abs(nw / w0 - 1) > Math.abs(nh / h0 - 1) ? nw / w0 : nh / h0;
        nw = w0 * f; nh = h0 * f;
      }
      nw = Math.max(6, nw); nh = Math.max(6, nh);
      let cx = cx0, cy = cy0;
      if (!mv.altKey) {
        const ox = (sx * (nw - w0)) / 2, oy = (sy * (nh - h0)) / 2;
        cx += ox * co - oy * si; cy += ox * si + oy * co;
      }
      E.setEl(e.id, { x: Math.round(cx - nw / 2), y: Math.round(cy - nh / 2), w: Math.round(nw), h: Math.round(nh) }, "Cambiar tamaño");
    }, () => { this.lineas = { x: [], y: [] }; this.gestoTam = false; fin(); });
  }

  /** Escalar varios a la vez (un grupo) desde una esquina. */
  _escalarGrupo(ev, m) {
    const E = this.estado;
    const sel = E.seleccionados;
    const u = union(sel.map(cajaDe));
    const orig = sel.map((e) => ({ id: e.id, x: e.x, y: e.y, w: e.w, h: e.h, tam: e.texto?.tam, tamB: e.boton?.tam }));
    const [sx, sy] = MANIJAS[m];
    const ax = sx > 0 ? u.x : u.x + u.w, ay = sy > 0 ? u.y : u.y + u.h;
    const x0 = ev.clientX, y0 = ev.clientY, z = this.v.z;
    const fin = E.gesto("Escalar grupo");
    this.gestoActivo = true;
    this._seguir(ev, (mv) => {
      const dx = ((mv.clientX - x0) / z) * sx, dy = ((mv.clientY - y0) / z) * sy;
      const k = Math.max(0.1, Math.max((u.w + dx) / u.w, (u.h + dy) / u.h));
      for (const o of orig) {
        const c = { x: Math.round(ax + (o.x - ax) * k), y: Math.round(ay + (o.y - ay) * k), w: Math.round(o.w * k), h: Math.round(o.h * k) };
        if (o.tam) c["texto.tam"] = Math.round(o.tam * k * 10) / 10;
        if (o.tamB) c["boton.tam"] = Math.round(o.tamB * k * 10) / 10;
        E.setEl(o.id, c, "Escalar grupo");
      }
    }, () => fin());
  }

  _pan(ev, tocarDeselecciona = false) {
    const x0 = ev.clientX, y0 = ev.clientY, px = this.v.px, py = this.v.py;
    let movio = false;
    this.vistaEl.classList.add("panea");
    this._seguir(ev, (m) => {
      if (!movio && Math.hypot(m.clientX - x0, m.clientY - y0) < 6) return;
      movio = true; this.gestoActivo = true;
      this.v.px = px + m.clientX - x0; this.v.py = py + m.clientY - y0; this.v.ajustar = false;
      this.pintarVista();
    }, () => {
      this.vistaEl.classList.remove("panea");
      if (!movio && tocarDeselecciona) this.estado.seleccionar([]);
    });
  }

  _pellizcar() {
    this.gestoActivo = false;
    const [a, b] = [...this.punteros.values()];
    const r = this.vistaEl.getBoundingClientRect();
    this.pellizco = { d0: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top, z0: this.v.z, px: this.v.px, py: this.v.py };
    const mover = (ev) => {
      if (!this.pellizco || !this.punteros.has(ev.pointerId)) return;
      this.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      const [p, q] = [...this.punteros.values()];
      const P = this.pellizco;
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      const mx = (p.x + q.x) / 2 - r.left, my = (p.y + q.y) / 2 - r.top;
      const z = Math.max(0.1, Math.min(8, (P.z0 * d) / P.d0));
      const wx = (P.mx - P.px) / P.z0, wy = (P.my - P.py) / P.z0;
      this.v = { z, px: mx - wx * z, py: my - wy * z, ajustar: false };
      this.pintarVista();
    };
    const fin = () => { if (this.punteros.size < 2) { removeEventListener("pointermove", mover, true); removeEventListener("pointerup", fin, true); this.pellizco = null; } };
    addEventListener("pointermove", mover, true);
    addEventListener("pointerup", fin, true);
  }

  _marco(ev) {
    const r = this.vistaEl.getBoundingClientRect();
    const x0 = ev.clientX - r.left, y0 = ev.clientY - r.top;
    let movio = false;
    this._seguir(ev, (m) => {
      const x1 = m.clientX - r.left, y1 = m.clientY - r.top;
      if (!movio && Math.hypot(x1 - x0, y1 - y0) < 4) return;
      movio = true;
      this.marco = { left: Math.min(x0, x1) + "px", top: Math.min(y0, y1) + "px", width: Math.abs(x1 - x0) + "px", height: Math.abs(y1 - y0) + "px" };
      this.pintarSobre();
    }, (u) => {
      this.marco = null;
      if (!movio) { this.estado.seleccionar([]); return; }
      const a = this.aMundo(Math.min(ev.clientX, u.clientX), Math.min(ev.clientY, u.clientY));
      const b = this.aMundo(Math.max(ev.clientX, u.clientX), Math.max(ev.clientY, u.clientY));
      const ids = this.estado.pagina.els.filter((e) => {
        if (e.bloqueado || e.oculto) return false;
        const c = cajaDe(e);
        return c.x < b.x && c.x + c.w > a.x && c.y < b.y && c.y + c.h > a.y;
      }).map((e) => e.id);
      this.estado.seleccionar(ids, u.shiftKey);
    });
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
    else if (e.tipo === "boton" || e.tipo === "componente") this.app.insp?.abrir("diseno");
  }

  editarTexto(e) {
    const n = this.pag?.nodos.get(e.id);
    const t = n?.querySelector(".rt-t");
    if (!t) return;
    this.editando = e.id;
    n.classList.add("ed-editando");
    t.contentEditable = "true";
    t.spellcheck = true;
    t.focus();
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

  terminarTexto() {
    if (!this.editando) return;
    const id = this.editando;
    this.editando = null;
    this._quitarCrecer?.();
    const n = this.pag?.nodos.get(id);
    const t = n?.querySelector(".rt-t");
    const e = this.estado.el(id);
    if (!t || !e) return;
    t.contentEditable = "false";
    n.classList.remove("ed-editando");
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
    this.aviso.append(el("span", { text: "Arrastra para encuadrar · rueda o dos dedos para acercar" }), el("button.ed-btn.primario", { type: "button", text: "Listo", onClick: () => this.salirRecorte() }));
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
    const fin = this.estado.gesto("Encuadrar foto");
    this.gestoActivo = true;
    this._seguir(ev, (m) => {
      const k = 100 / (r0.zoom * this.v.z);
      const x = Math.max(0, Math.min(100, r0.x - ((m.clientX - x0) * k) / e.w * 1.6));
      const y = Math.max(0, Math.min(100, r0.y - ((m.clientY - y0) * k) / e.h * 1.6));
      this.estado.setEl(e.id, { "imagen.recorte": { ...r0, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } }, "Encuadrar foto");
    }, () => fin());
  }

  _zoomRecorte(d) {
    const e = this.estado.el(this.recortando);
    if (!e) return;
    const r = { x: 50, y: 50, zoom: 1, ...(e.imagen.recorte || {}) };
    r.zoom = Math.max(1, Math.min(5, Math.round(r.zoom * Math.exp(-d * 0.004) * 100) / 100));
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
    const pintar = () => { path.setAttribute("d", "M" + pts.map((p) => { const s = this.aPantalla(p.x, p.y); return s.x.toFixed(1) + " " + s.y.toFixed(1); }).join("L")); };
    this._seguir(ev, (m) => {
      const p = this.aMundo(m.clientX, m.clientY);
      const u = pts[pts.length - 1];
      if (Math.hypot(p.x - u.x, p.y - u.y) * this.v.z < 2) return;
      pts.push(p);
      pintar();
      this.pintarSobre();
    }, () => {
      this.trazoVivo = null;
      if (pts.length < 2) return;
      this.app.acciones.crearTrazo(pts, op);
    });
  }
}
