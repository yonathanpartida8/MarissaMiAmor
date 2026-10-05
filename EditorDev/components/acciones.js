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

const RT = window.LibritoRT;

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
    // Lo nuevo aparece en el centro de lo que se ve, un poquito corrido si ya hay algo ahí.
    const L = this.app.lienzo;
    if (L && el_.tipo !== "pagina") {
      const r = L.vistaEl.getBoundingClientRect();
      const c = L.aMundo(r.left + r.width / 2, r.top + r.height / 2);
      const W = this.P.ajustes.ancho, H = this.P.ajustes.alto;
      el_.x = Math.round(Math.max(0, Math.min(W - el_.w, c.x - el_.w / 2)));
      el_.y = Math.round(Math.max(0, Math.min(H - el_.h, c.y - el_.h / 2)));
      const ocupado = (x, y) => this.E.pagina.els.some((o) => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 4);
      let k = 0;
      while (ocupado(el_.x, el_.y) && k++ < 12) { el_.x += 14; el_.y += 14; }
    }
    if (!this.E.pagina) this.nuevaPagina();
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
  html() { const e = this.agregar("html", { nombre: "Bloque HTML" }); this.editarHtml(e); return e; }

  dibujo(id) {
    const d = DIBUJOS.find((x) => x.id === id);
    if (!d) return null;
    return this.agregar("dibujo", { nombre: d.n, dibujo: { svg: d.svg, color: this.tema.acento } });
  }

  async video() {
    const [id] = await elegir(this.app, "video");
    if (!id) return null;
    const a = this.P.assets[id] || {};
    const w = Math.min(330, this.P.ajustes.ancho - 40);
    const h = a.w && a.h ? Math.round((w * a.h) / a.w) : Math.round(w * 0.6);
    return this._poner(nuevoEl("video", this.P, { nombre: a.nombre || "Vídeo", w, h, video: { asset: id } }));
  }

  paginaOriginal(ruta, titulo) {
    return this._poner(nuevoEl("pagina", this.P, { nombre: titulo || "Página original", pagina: { ruta, titulo }, bloqueado: false }));
  }

  crearTrazo(pts, op) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    const pad = op.grosor;
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const w = Math.max(4, x1 - x0), h = Math.max(4, y1 - y0);
    // Curva suave: puntos medios con cuadráticas.
    const q = pts.map((p) => [Math.round((p.x - x0) * 10) / 10, Math.round((p.y - y0) * 10) / 10]);
    let d = `M${q[0][0]} ${q[0][1]}`;
    for (let i = 1; i < q.length - 1; i++) d += `Q${q[i][0]} ${q[i][1]} ${((q[i][0] + q[i + 1][0]) / 2).toFixed(1)} ${((q[i][1] + q[i + 1][1]) / 2).toFixed(1)}`;
    d += `L${q[q.length - 1][0]} ${q[q.length - 1][1]}`;
    const e = nuevoEl("trazo", this.P, { nombre: "Trazo a mano", x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h), trazo: { d, vw: Math.round(w), vh: Math.round(h), color: op.color, grosor: op.grosor } });
    this.E.agregarEl(e, null, this.E.paginaId, false);
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
    const W = this.P.ajustes.ancho, H = this.P.ajustes.alto;
    const ref = sel.length > 1 ? union(sel.map(cajaDe)) : { x: 0, y: 0, w: W, h: H };
    this.E.transaccion("Alinear", () => {
      for (const e of sel) {
        const b = cajaDe(e);
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
    const orden = [...sel].sort((a, b) => cajaDe(a)[k[0]] - cajaDe(b)[k[0]]);
    const cs = orden.map(cajaDe);
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
    menu(ancla, [
      { t: "⇤ Izquierda", al: () => this.alinear("izq") },
      { t: "↔ Centro", al: () => this.alinear("centroH") },
      { t: "⇥ Derecha", al: () => this.alinear("der") },
      "-",
      { t: "⤒ Arriba", al: () => this.alinear("arriba") },
      { t: "↕ En medio", al: () => this.alinear("centroV") },
      { t: "⤓ Abajo", al: () => this.alinear("abajo") },
      muchos ? "-" : null,
      muchos ? { t: "Repartir a lo ancho", al: () => this.distribuir("h") } : null,
      muchos ? { t: "Repartir a lo alto", al: () => this.distribuir("v") } : null,
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
      if (uno.tipo === "texto") f.append(b("✎", "Editar texto", () => this.app.lienzo.editarTexto(uno)));
      if (uno.tipo === "imagen") f.append(b(uno.imagen?.asset ? "⟳" : "＋", uno.imagen?.asset ? "Cambiar foto" : "Añadir foto", () => this.pedirArchivoPara(uno)));
      if (uno.tipo === "imagen" && uno.imagen?.asset) f.append(b("⌗", "Recortar / encuadrar", () => this.app.lienzo.recortar(uno)));
      if (uno.tipo === "album" || uno.tipo === "carrusel") f.append(b("＋", "Añadir fotos", () => this.pedirArchivoPara(uno)));
      if (uno.tipo === "html") f.append(b("&lt;/&gt;", "Editar HTML", () => this.editarHtml(uno)));
    }
    if (!bloq) {
      f.append(b("⧉", "Duplicar (Ctrl+D)", () => this.duplicar()));
      f.append(b("⇡", "Traer adelante", () => this.capa("subir")));
      f.append(b("⇣", "Llevar atrás", () => this.capa("bajar")));
      f.append(b("⊞", "Alinear", (ev) => this.menuAlinear(ev.currentTarget)));
      f.append(b("✨", "Animar", () => this.app.insp.abrir("animar")));
    }
    f.append(b(bloq ? "🔓" : "🔒", bloq ? "Desbloquear" : "Bloquear", () => this.alternar("bloqueado")));
    if (!bloq) f.append(b("🗑", "Borrar (Supr)", () => this.borrar(), "peligro"));
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
    if (p.els.length && !(await confirmar(`Se borrará «${p.nombre}» con todo lo que tiene. Puedes deshacerlo con ↶.`, "Borrar página"))) return;
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
    aviso("Página en blanco · ↶ para deshacer");
  }

  async limpiarTodo(soloUna) {
    const txt = soloUna ? "Se borrarán todas las páginas y quedará una sola en blanco." : "Se vaciarán todas las páginas (quedan en blanco, con su nombre y en su orden).";
    if (!(await confirmar(txt + " Tus fotos y canciones subidas se quedan en la biblioteca. Puedes deshacerlo con ↶.", soloUna ? "Dejar una en blanco" : "Vaciar todas"))) return;
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
    aviso("Ésta es ahora la portada 🖼️");
  }

  nombreTipo(e) { return TIPOS[e.tipo]?.n || e.tipo; }
}

export { RT };
