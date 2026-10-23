/**
 * MODO PROFESIONAL — LovEdit como CapCut (Fase 38; como CapCut de verdad desde la 39).
 *
 * Al tocar «Tiempo» (o al abrir la línea desde cualquier sitio) una transición suave lleva a una
 * pantalla aparte, negra como CapCut:
 *   arriba     ✕ (volver al editor) · la página (cambiar de página) · ⋯ · «Probar»
 *   en medio   la vista previa: la misma hoja, en vivo (lo que cambias aquí ES la página)
 *   abajo      el reloj, reproducir y deshacer/rehacer; y las pistas con el cabezal FIJO al centro
 *              (se desplaza la línea): lo de la hoja arriba, la página como clip principal con sus
 *              cuadritos (y las páginas vecinas con su transición y el «+»), la música y «Añadir audio»
 *   al fondo   las herramientas, según lo elegido (nunca todas a la vez):
 *                nada      → Menú (todas, Fase 43), Cortar página, Transición, Estilo, Texto, Bloques,
 *                            Elementos, Música, Imágenes, Stickers, Efectos, Al tocar, HTML, Sonido
 *                un clip   → Editar texto / Cambiar foto, Dividir, Empieza aquí, Termina aquí, Correr,
 *                            Acción, Al tocar, Animación, Efectos, Color, Opacidad, Centrar, Luz y color,
 *                            Fotograma, Capa, Ocultar, Bloquear, Duplicar, Borrar
 *                un audio  → Volumen, Silenciar, Bucle, Empieza/Termina aquí, Duplicar, Quitar
 * Lo que añades aquí aparece en el cabezal (como en un editor de vídeo) y al reproducir suena la
 * música de la página. En ⋯ está lo de la línea: imán, bucle, música al reproducir, marcador y zoom.
 */
import { el, menu, popover } from "./ui.js";
import { ico } from "./iconos.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { abrirEfectos } from "./efectos-sonido.js";
import { elegirColor } from "./selectores.js";
import { elegir } from "../assets/selector.js";
import { vibrar } from "../canvas/gestos.js";

const CON_LUZ = /^(imagen|video|album|carrusel|componente|forma|dibujo|escena3d)$/;
/** El menú de LovEdit (Fase 43): TODAS las herramientas, sin repetir. [id de sección, ícono, nombre] */
const MENU = [
  ["bloques", "bloques", "Bloques"], ["componentes", "biblioteca", "Recursos"], ["elementos", "elementos", "Elementos"], ["texto", "texto", "Texto"],
  ["imagenes", "imagen", "Imágenes"], ["video", "video", "Videos"], ["audio", "audio", "Músicas"], ["stickers", "sticker", "Stickers"],
  ["gifs", "gif", "GIFs"], ["estilo", "fondo", "Estilo"], ["diseno", "diseno", "Temas"], ["animar", "animar", "Animar"],
  ["efectos", "efectos", "Efectos"], ["transiciones", "transiciones", "Transiciones"], ["toques", "toque", "Al tocar"], ["interactivo", "interactivo", "Interactivo"],
  ["navegacion", "pasar", "Pasar página"], ["html", "html", "HTML"], ["3d", "cubo", "3D"], ["paginas", "paginas", "Páginas"], ["herramientas", "herramientas", "Herramientas"],
];
/** Qué hace al tocarlo (lo mismo que en el inspector, en un menú rápido). */
const ACCIONES = [["siguiente", "Pasar a la siguiente página"], ["anterior", "Volver a la anterior"], ["inicio", "Ir a la portada"], ["musica", "Pausar o poner la música"]];
const fmt = (ms) => { const s = Math.max(0, ms) / 1000; return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`; };

export class ModoPro {
  constructor(app) {
    this.app = app;
    this.E = app.estado;
    this.abierto = false;
    this._clave = "";
    this._ids = new Set();
    const b = (i, t, al, cls = "") => el("button.pro-tb" + cls, { type: "button", title: t, "aria-label": t, html: ico(i), onClick: (ev) => al(ev.currentTarget) });
    this.titulo = el("b");
    this.sub = el("small");
    this.barra = el("header.pro-barra", { role: "toolbar", "aria-label": "Modo profesional" }, [
      b("cerrar", "Volver al editor", () => this.cerrar(), ".pro-x"),
      el("b.pro-marca", { text: "LovEdit" }),
      el("i.pro-esp"),
      el("button.pro-tit", { type: "button", "aria-label": "Cambiar de página", onClick: (ev) => this._paginas(ev.currentTarget) }, [this.titulo, this.sub, el("i", { html: ico("abajo") })]),
      b("puntos", "Opciones de la línea", (a) => this._opciones(a)),
      el("button.pro-probar", { type: "button", onClick: () => this.app.prueba?.abrir() }, [el("i", { html: ico("play") }), el("span", { text: "Probar" })]),
    ]);
    // Deshacer y rehacer van en la fila del reproductor (como en CapCut); y «Centrar» (Fase 43): la página
    // vuelve al centro de la vista previa, entera y del mejor tamaño.
    this.dh = el("div.pro-dh", {}, [b("ajustar", "Centrar la página", () => this.centrar(), ".pro-centrar"), b("deshacer", "Deshacer", () => this.E.deshacer()), b("rehacer", "Rehacer", () => this.E.rehacer())]);
    app.tiempo?.cab?.append(this.dh);
    this.herr = el("nav.pro-herr", { "aria-label": "Herramientas de LovEdit" });
    // El menú (Fase 43): todas las herramientas. Se abre con «Menú» (abajo) o deslizando desde la orilla
    // izquierda; sale por encima de las pistas (la página de arriba se sigue viendo) y, cerrado, no queda
    // nada asomado.
    this.chips = el("nav.pro-menu-chips", { "aria-label": "Herramientas" });
    this.menuCuerpo = el("div.pro-menu-cuerpo");
    this.menuEl = el("section.pro-menu", { hidden: "", "aria-label": "Herramientas de LovEdit" }, [
      el("header.pro-menu-cab", {}, [
        el("button.pro-menu-todo", { type: "button", "aria-label": "Todas las herramientas", title: "Todas las herramientas", html: ico("menu"), onClick: () => this.verMenu(null) }),
        this.chips,
        el("button.pro-menu-x", { type: "button", "aria-label": "Cerrar el menú", title: "Cerrar", html: ico("cerrar"), onClick: () => this.cerrarMenu() }),
      ]),
      this.menuCuerpo,
    ]);
    this.borde = el("div.pro-borde", { "aria-hidden": "true" });
    this._gestos();
    document.body.append(this.barra, this.herr, this.menuEl, this.borde);
    this.E.on("sel", () => this.refrescar());
    this.E.on("actual", () => { this._ids = new Set((this.E.pagina?.els || []).map((x) => x.id)); this._titulo(); });
    this.E.on("els", () => this._nuevos());
    addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && this.abierto && !document.querySelector(".ed-modal-fondo, .ed-pop, .ed-menu, .ed-hoja-sec.abierta, .ed-hojita")) this.cerrar();
    });
  }

  get L() { return this.app.tiempo; }

  /* ── El menú de todas las herramientas (Fase 43) ─────────────────────── */
  get menuAbierto() { return !this.menuEl.hidden && this.menuEl.classList.contains("abierto"); }

  /** Abre el menú en una sección (o, sin ella, con todas las herramientas en cuadritos). */
  verMenu(id = null) {
    const app = this.app;
    if (id === "fotos") id = "imagenes";
    if (id && !MENU.some((m) => m[0] === id)) id = null;
    this.menuEl.hidden = false;
    this.chips.replaceChildren(...MENU.map(([k, i, n]) => el("button.pro-chip" + (k === id ? ".on" : ""), { type: "button", dataset: { s: k }, onClick: () => this.verMenu(k) }, [el("i", { html: ico(i) }), el("span", { text: n })])));
    this._soltarPaneles();
    const c = this.menuCuerpo;
    c.textContent = "";
    this._sec = id;
    this.menuEl.dataset.vista = id ? "seccion" : "todo";
    if (!id) {
      c.append(el("p.pro-menu-t", { text: "Todas las herramientas" }), el("div.pro-menu-rejilla", {}, MENU.map(([k, i, n]) => el("button.pro-menu-ficha", { type: "button", dataset: { s: k }, onClick: () => this.verMenu(k) }, [el("i", { html: ico(i) }), el("span", { text: n })]))));
    } else {
      // (Las secciones se pintan con los mismos paneles del editor, aquí en grande.)
      app.seccion = id;
      if (id === "paginas") { app.paneles.actual = null; app.paginas.construir(c); } else app.paneles.abrir(id, c);
      c._sec = id;
      requestAnimationFrame(() => this.chips.querySelector(".on")?.scrollIntoView({ inline: "center", block: "nearest", behavior: reducido() ? "auto" : "smooth" }));
    }
    c.scrollTop = 0;
    if (!this.menuEl.classList.contains("abierto")) this._ponerMenu(1, true);
    this.refrescar(true);
  }

  cerrarMenu() {
    if (this.menuEl.hidden) return;
    this._ponerMenu(0, true);
    this._soltarPaneles(true);
    this.refrescar(true);
  }

  /** Los paneles del editor se pintan en un solo sitio a la vez: al usar el menú (o al cerrarlo) se sueltan. */
  _soltarPaneles(cerrando = false) {
    const P = this.app.paneles;
    const del = document.querySelector(".ed-panel-cuerpo");
    if (del) del._sec = null; // el cajón del editor se volverá a pintar al abrirlo
    if (cerrando && P.cont === this.menuCuerpo) { P._limpiar?.(); P._limpiar = null; P.cont = null; this.menuCuerpo.textContent = ""; }
  }

  /** `k` = cuánto se ve (0 escondido … 1 abierto); con `anim`, termina de abrirse o cerrarse suave. */
  _ponerMenu(k, anim) {
    const m = this.menuEl;
    k = Math.max(0, Math.min(1, k));
    m.classList.toggle("anim", !!anim);
    m.style.transform = `translate3d(${(k - 1) * 100}%, 0, 0)`;
    if (anim) {
      m.classList.toggle("abierto", k === 1);
      document.body.classList.toggle("pro-menu-abierto", k === 1);
      clearTimeout(this._tm);
      if (k === 0) this._tm = setTimeout(() => { if (!m.classList.contains("abierto")) { m.hidden = true; m.style.transform = ""; } }, reducido() ? 0 : 340);
    }
  }

  /** Deslizar desde la orilla izquierda abre el menú siguiendo el dedo; deslizarlo a la izquierda lo cierra. */
  _gestos() {
    let g = null;
    const ancho = () => this.menuEl.offsetWidth || innerWidth;
    const empezar = (ev, desde) => {
      if (!this.abierto || ev.button > 0) return;
      if (desde === "menu" && ev.target.closest("input, textarea, select, [contenteditable='true'], .ed-rango, .pro-menu-chips, .ed-tl")) return;
      g = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, desde, decidido: desde === "borde", movio: false, vx: 0, ux: ev.clientX, ut: performance.now(), base: desde === "borde" ? 0 : 1 };
      if (desde === "borde") {
        try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
        if (this.menuEl.hidden) { this.menuEl.hidden = false; if (!this._sec && !this.menuCuerpo.firstChild) this.verMenuQuieto(); }
      }
    };
    const mover = (ev) => {
      if (!g || g.id !== ev.pointerId) return;
      const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
      if (!g.decidido) {
        if (Math.hypot(dx, dy) < 10) return;
        // Dentro del menú sólo un gesto claramente hacia la izquierda lo mueve (lo demás desplaza).
        if (dx > -10 || Math.abs(dx) < Math.abs(dy) * 1.4) { g = null; return; }
        g.decidido = true;
        try { this.menuEl.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
      }
      g.movio = g.movio || Math.abs(dx) > 4;
      const t = performance.now();
      if (t > g.ut) { g.vx = 0.7 * g.vx + 0.3 * ((ev.clientX - g.ux) / (t - g.ut)); g.ux = ev.clientX; g.ut = t; }
      cancelAnimationFrame(this._rf);
      this._rf = requestAnimationFrame(() => this._ponerMenu(g ? g.base + dx / ancho() : 0, false));
      ev.preventDefault();
    };
    const soltar = (ev) => {
      if (!g || g.id !== ev.pointerId) return;
      const x = g; g = null;
      cancelAnimationFrame(this._rf);
      if (!x.decidido) return;
      if (!x.movio) { if (x.desde === "borde") this.cerrarMenu(); return; }
      const k = x.base + (ev.clientX - x.x0) / ancho();
      const abrir = x.vx > 0.35 ? true : x.vx < -0.35 ? false : k > 0.4;
      vibrar(6);
      if (abrir) { if (!this.menuCuerpo.firstChild) this.verMenu(null); else { this._ponerMenu(1, true); this.refrescar(true); } }
      else this.cerrarMenu();
    };
    for (const [n, desde] of [[this.borde, "borde"], [this.menuEl, "menu"]]) {
      n.addEventListener("pointerdown", (ev) => empezar(ev, desde));
      n.addEventListener("pointermove", mover);
      n.addEventListener("pointerup", soltar);
      n.addEventListener("pointercancel", soltar);
    }
  }

  /** (Al jalar desde la orilla por primera vez: la rejilla de herramientas, sin animar todavía.) */
  verMenuQuieto() {
    this.chips.replaceChildren(...MENU.map(([k, i, n]) => el("button.pro-chip", { type: "button", dataset: { s: k }, onClick: () => this.verMenu(k) }, [el("i", { html: ico(i) }), el("span", { text: n })])));
    this.menuCuerpo.replaceChildren(el("p.pro-menu-t", { text: "Todas las herramientas" }), el("div.pro-menu-rejilla", {}, MENU.map(([k, i, n]) => el("button.pro-menu-ficha", { type: "button", dataset: { s: k }, onClick: () => this.verMenu(k) }, [el("i", { html: ico(i) }), el("span", { text: n })]))));
    this.menuEl.dataset.vista = "todo";
  }

  /** La página, centrada y entera en la vista previa (con una animación suave). */
  centrar() {
    const L = this.app.lienzo;
    if (!L) return;
    const h = L._vistaAjustada?.();
    if (h && L._animarVista) L._animarVista(h, 320); else L.ajustar?.();
  }

  /* ── Entrar y salir (con una transición suave) ─────────────────────── */
  abrir(desde) {
    if (this.abierto) return;
    this._telon(desde, () => {
      this.abierto = true;
      document.body.classList.add("modo-pro");
      // Pocos paneles a la vez: el de herramientas se guarda (lo vuelve a abrir lo que lo necesite).
      if (innerWidth >= 1024) document.body.classList.add("sin-panel");
      this.app.lateral?.cerrar();
      this.app.cerrarHoja?.();
      const L = this.L;
      L.conMusica = true; // en el modo profesional se oye todo al reproducir
      L._alternarCrudo(true);
      const barra = this.barra.offsetHeight || 46, abajo = this.herr.offsetHeight || 62;
      L._alto(Math.round((innerHeight - barra - abajo) * (innerWidth >= 1024 ? 0.44 : 0.47)));
      // El cabezal fijo al centro: la línea arranca donde iba.
      requestAnimationFrame(() => { L.pintar(); L._irScroll(L.x(L.t)); });
      this._ids = new Set((this.E.pagina?.els || []).map((x) => x.id));
      this._clave = "";
      this._titulo();
      this.refrescar();
      requestAnimationFrame(() => this.app.lienzo?.ajustar?.());
    });
  }

  cerrar() {
    if (!this.abierto) return;
    this._telon(null, () => {
      this.abierto = false;
      this.cerrarMenu();
      this.L.pausar?.();
      document.body.classList.remove("modo-pro");
      this.L._alternarCrudo(false);
      requestAnimationFrame(() => this.app.lienzo?.ajustar?.());
    });
  }

  /** Un círculo que crece desde el botón y se desvanece: cambia de modo sin brincos. */
  _telon(desde, alMedio) {
    if (reducido()) { alMedio(); return; }
    const r = desde?.getBoundingClientRect?.() || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
    const t = el("div.pro-telon", { "aria-hidden": "true" });
    document.body.append(t);
    t.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${x}px ${y}px)` }], { duration: 360, easing: "cubic-bezier(.7, 0, .3, 1)", fill: "forwards" })
      .finished.then(() => { alMedio(); return t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: "ease-out", fill: "forwards" }).finished; })
      .catch(() => alMedio())
      .finally(() => t.remove());
  }

  _titulo() {
    const P = this.E.proyecto, i = P?.orden?.indexOf(this.E.paginaId) ?? 0;
    this.titulo.textContent = `Página ${i + 1}`;
    this.sub.textContent = `de ${P?.orden?.length || 1}`;
  }

  /** La página que se edita (como el «1080P ▾» de CapCut, pero para ir de página en página). */
  _paginas(ancla) {
    const P = this.E.proyecto;
    menu(ancla, P.orden.map((pid, i) => ({ t: `<span>${i + 1}. ${(P.paginas[pid]?.nombre || "Página").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</span>`, al: () => this.E.irPagina(pid), clase: pid === this.E.paginaId ? "on" : "" })));
  }

  /** Lo que se añade en el modo profesional aparece en el cabezal. */
  _nuevos() {
    if (!this.abierto) return;
    const p = this.E.pagina;
    if (!p) return;
    const t = Math.round((this.L.t || 0) / 50) * 50;
    const nuevos = p.els.filter((x) => !this._ids.has(x.id));
    for (const x of p.els) this._ids.add(x.id);
    if (t > 0 && nuevos.length) queueMicrotask(() => this.E.transaccion("Aparece en el cabezal", () => { for (const x of nuevos) if (!x.tiempo?.inicio) this.E.setEl(x.id, { "tiempo.inicio": t }, "Aparece en el cabezal"); }));
  }

  /* ── Las herramientas de abajo: según lo elegido ────────────────────── */
  refrescar(forzar = false) {
    if (!this.abierto) return;
    this._titulo();
    const L = this.L, E = this.E, sel = E.seleccionados;
    const audio = !sel.length && L.audioSel ? L._pista(L.audioSel) : null;
    const clave = (audio ? `a:${audio.id}:${!!audio.silencio}:${!!audio.bucle}` : sel.length ? "c:" + sel.map((x) => `${x.id}${x.bloqueado ? 1 : 0}${x.oculto ? 1 : 0}${x.accion?.tipo || ""}${x.anim?.alTocar || x.anim?.reaccion?.presionar || ""}`).join() : "nada") + (this.menuAbierto ? ":m" + this._sec : "");
    if (clave === this._clave && !forzar) return;
    this._clave = clave;
    const b = (i, t, al, cls = "") => el("button.pro-b" + cls, { type: "button", "aria-label": t, onClick: (ev) => al(ev.currentTarget) }, [el("i", { html: ico(i) }), el("span", { text: t })]);
    const sep = () => el("i.pro-sep", { "aria-hidden": "true" });
    const A = this.app.acciones, app = this.app;
    // Una sección: abre el menú ahí (o lo cierra si ya se ve esa misma).
    const sec = (id) => (this.menuAbierto && this._sec === id ? this.cerrarMenu() : this.verMenu(id));
    const enMenu = (id) => (this.menuAbierto && this._sec === id ? ".on" : "");
    let xs;
    if (audio) {
      xs = [
        b("izquierda", "Listo", () => { L.audioSel = null; L.pintar(); }, ".atras"),
        sep(),
        b("volumen", "Volumen", (n) => { const r = n.getBoundingClientRect(); L._volumenPista(audio, r.left + r.width / 2, r.top); }),
        b(audio.silencio ? "volumen" : "silencio", audio.silencio ? "Que suene" : "Silenciar", () => L._ponerPista(audio.id, { silencio: !audio.silencio }, "Silenciar pista")),
        b("bucle", audio.bucle ? "Sin bucle" : "En bucle", () => L._ponerPista(audio.id, { bucle: !audio.bucle }, "Bucle"), audio.bucle ? ".on" : ""),
        b("izqA", "Empieza aquí", () => L._ponerPista(audio.id, { inicio: Math.round(L.t / 50) * 50 }, "Mover pista")),
        b("derA", "Termina aquí", () => { if (L.t > (audio.inicio || 0) + 200) L._ponerPista(audio.id, { dur: Math.round(L.t / 50) * 50 - (audio.inicio || 0) }, "Recortar pista"); }),
        b("mover", "Correr", (n) => this._correr(n)),
        b("duplicar", "Duplicar", () => L.duplicarClip()),
        b("borrar", "Quitar", () => L.quitarPista(audio.id), ".peligro"),
      ];
    } else if (sel.length) {
      const uno = sel.length === 1 ? sel[0] : null, bloq = sel.every((x) => x.bloqueado), oculto = sel.every((x) => x.oculto);
      const t = uno?.tipo;
      const conColor = uno && /^(texto|forma|dibujo|boton)$/.test(t);
      xs = [
        b("izquierda", "Listo", () => E.seleccionar([]), ".atras"),
        sep(),
        t === "texto" ? b("editar", "Editar texto", () => app.lienzo?.editarTexto?.(uno)) : null,
        t === "imagen" ? b("cambiar", "Cambiar foto", () => this._cambiarFoto(uno)) : null,
        uno ? b("tijeras", "Dividir", () => L.dividir(uno)) : null,
        uno ? b("izqA", "Empieza aquí", () => L._ponerTiempo(uno, "inicio")) : null,
        uno ? b("derA", "Termina aquí", () => L._ponerTiempo(uno, "fin")) : null,
        b("mover", "Correr", (n) => this._correr(n)),
        uno ? b("enlace", "Acción", (n) => this._accion(n, uno), uno.accion?.tipo ? ".on" : "") : null,
        uno ? b("toque", "Al tocar", (n) => this._alTocar(n, uno), uno.anim?.alTocar || uno.anim?.reaccion?.presionar ? ".on" : "") : null,
        b("animar", "Animación", () => sec("animar"), enMenu("animar")),
        b("efectos", "Efectos", () => sec("efectos"), enMenu("efectos")),
        conColor ? b("gota", "Color", (n) => this._color(n, uno)) : null,
        b("opacidad", "Opacidad", (n) => this._opacidad(n)),
        b("alinearH", "Centrar", (n) => menu(n, [
          { t: `${ico("alinearH")}<span>Al centro de la página</span>`, al: () => { A.alinear("centroH"); A.alinear("centroV"); } },
          { t: `${ico("alinearH")}<span>Centrar a lo ancho</span>`, al: () => A.alinear("centroH") },
          { t: `${ico("centroV")}<span>Centrar a lo alto</span>`, al: () => A.alinear("centroV") },
        ])),
        uno && CON_LUZ.test(t) ? b("luz", "Luz y color", () => app.ajustes?.abrir(uno.id)) : null,
        uno ? b("fotogramaMas", "Fotograma", (n) => L.fotogramaAqui(n)) : null,
        b("capas", "Capa", (n) => menu(n, [
          { t: `${ico("alFrente")}<span>Traer al frente</span>`, al: () => A.capa("frente") },
          { t: `${ico("bajarCapa")}<span>Enviar atrás</span>`, al: () => A.capa("bajar") },
          { t: `${ico("alFondo")}<span>Enviar al fondo</span>`, al: () => A.capa("fondo") },
        ])),
        b(oculto ? "ojo" : "ojoNo", oculto ? "Mostrar" : "Ocultar", () => A.alternar("oculto")),
        b(bloq ? "abierto" : "candado", bloq ? "Desbloquear" : "Bloquear", () => A.alternar("bloqueado"), bloq ? ".on" : ""),
        b("duplicar", "Duplicar", () => L.duplicarClip()),
        b("borrar", "Borrar", () => A.borrar(), ".peligro"),
      ];
    } else {
      // Lo nuevo aparece en el cabezal (ver `_nuevos`). «Menú» abre todas; las de siempre, a la mano.
      xs = [
        b("menu", "Menú", () => (this.menuAbierto ? this.cerrarMenu() : this.verMenu(null)), this.menuAbierto && !this._sec ? ".on.menu" : ".menu"),
        b("tijeras", "Cortar página", () => L.dividirPagina()),
        b("transiciones", "Transición", (n) => L._elegirTrans(E.paginaId, n)),
        b("fondo", "Estilo", () => sec("estilo"), enMenu("estilo")),
        sep(),
        b("texto", "Texto", () => A.texto("parrafo")),
        b("bloques", "Bloques", () => sec("bloques"), enMenu("bloques")),
        b("elementos", "Elementos", () => sec("elementos"), enMenu("elementos")),
        b("audio", "Música", () => sec("audio"), enMenu("audio")),
        b("imagen", "Imágenes", () => sec("imagenes"), enMenu("imagenes")),
        b("sticker", "Stickers", () => sec("stickers"), enMenu("stickers")),
        b("efectos", "Efectos", () => sec("efectos"), enMenu("efectos")),
        b("toque", "Al tocar", () => sec("toques"), enMenu("toques")),
        b("html", "HTML", () => sec("html"), enMenu("html")),
        b("campana", "Sonido", (n) => abrirEfectos(app, n)),
      ];
    }
    this.herr.replaceChildren(...xs.filter(Boolean));
    this.herr.dataset.modo = audio ? "audio" : sel.length ? "clip" : "nada";
  }

  /** Qué hace al tocarlo (Fase 43): pasar página, ir a otra, mostrar o esconder algo, abrir un enlace… */
  _accion(ancla, e) {
    const E = this.E, P = E.proyecto, ac = e.accion || {};
    const poner = (accion, nombre = "Acción") => E.setEl(e.id, { accion }, nombre);
    const t = (i, x, on) => `${ico(i)}<span>${x}</span>${on ? "<b>✓</b>" : ""}`;
    const otros = () => E.pagina.els.filter((x) => x.id !== e.id && x.tipo !== "musica");
    menu(ancla, [
      { t: t("cerrar", "Nada", !ac.tipo), al: () => poner(null, "Sin acción") },
      ...ACCIONES.map(([k, n]) => ({ t: t(k === "musica" ? "audio" : k === "anterior" ? "izquierda" : k === "inicio" ? "inicio" : "derecha", n, ac.tipo === k), al: () => poner({ tipo: k }) })),
      { t: t("paginas", "Ir a una página…", ac.tipo === "ir"), al: () => menu(ancla, P.orden.map((pid, i) => ({ t: t("paginas", `${i + 1}. ${(P.paginas[pid]?.nombre || "Página").replace(/[<>&]/g, "")}`, ac.tipo === "ir" && ac.destino === pid), al: () => poner({ tipo: "ir", destino: pid }) }))) },
      { t: t("ojo", "Mostrar algo escondido…", ac.tipo === "mostrar"), off: !otros().length, al: () => menu(ancla, otros().map((x) => ({ t: t("ojo", (x.nombre || x.tipo).replace(/[<>&]/g, ""), ac.destino === x.id), al: () => E.transaccion("Mostrar al tocar", () => { poner({ tipo: "mostrar", destino: x.id }); E.setEl(x.id, { inicioOculto: true }, "Empieza escondido"); }) }))) },
      { t: t("ojoNo", "Esconder algo…", ac.tipo === "ocultar"), off: !otros().length, al: () => menu(ancla, otros().map((x) => ({ t: t("ojoNo", (x.nombre || x.tipo).replace(/[<>&]/g, ""), ac.destino === x.id), al: () => poner({ tipo: "ocultar", destino: x.id }) }))) },
      { t: t("enlace", "Abrir un enlace…", ac.tipo === "enlace"), al: () => this._enlace(ancla, e) },
      "-",
      { t: t("campana", "Sonido al tocarlo…", !!e.sonidos?.tocar), al: () => abrirEfectos(this.app, ancla, { donde: "tocar" }) },
    ]);
  }

  _enlace(ancla, e) {
    const inp = el("input.ed-in", { type: "url", inputmode: "url", placeholder: "https://…", value: e.accion?.tipo === "enlace" ? e.accion.destino || "" : "" });
    const listo = () => {
      const v = inp.value.trim();
      const url = /^(https?:|mailto:|tel:)/i.test(v) ? v : v ? "https://" + v.replace(/^\/+/, "") : "";
      if (url) this.E.setEl(e.id, { accion: { tipo: "enlace", destino: url } }, "Abrir un enlace");
      p.cerrar?.();
    };
    inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") listo(); });
    const p = popover(ancla, [el("b.ed-pop-t", { text: "Al tocarlo, abre…" }), inp, el("div.ed-botonera", {}, [el("button.ed-btn.chico.primario", { type: "button", text: "Listo", onClick: listo })])]);
    setTimeout(() => inp.focus(), 60);
  }

  /** Al tocarlo: una animación (de una vez) y/o una reacción mientras lo presionan. */
  _alTocar(ancla, e) {
    const E = this.E, RT = window.LibritoRT, an = e.anim || {};
    const t = (x, on) => `<span>${x}</span>${on ? "<b>✓</b>" : ""}`;
    menu(ancla, [
      { t: `<small class="pro-menu-sub">Al tocarlo, hace…</small>`, off: true, al: () => {} },
      ...(RT.AL_TOCAR || []).map(([k, n]) => ({ t: t(n, (an.alTocar || "") === k), al: () => E.setEl(e.id, { "anim.alTocar": k || null }, "Animación al tocar") })),
      "-",
      { t: `<small class="pro-menu-sub">Mientras lo presionan…</small>`, off: true, al: () => {} },
      ...(RT.REACCIONES || []).filter(([k]) => k).map(([k, n]) => ({ t: t(n, an.reaccion?.presionar === k), al: () => E.setEl(e.id, { "anim.reaccion.presionar": an.reaccion?.presionar === k ? "" : k }, "Reacción") })),
    ]);
  }

  _color(ancla, e) {
    const ruta = { texto: "texto.color", forma: "forma.relleno", dibujo: "dibujo.color", boton: "boton.fondo" }[e.tipo];
    const leer = () => { const x = this.E.el(e.id); return ruta.split(".").reduce((o, k) => o?.[k], x) || "#d8397a"; };
    elegirColor(ancla, { titulo: "Color", leer, poner: (c) => this.E.transaccion("Color", () => { for (const x of this.E.seleccionados) this.E.setEl(x.id, { [ruta]: c }, "Color", "color"); }, "color"), pagina: this.E.pagina, tema: this.E.proyecto.ajustes.tema });
  }

  _opacidad(ancla) {
    const E = this.E, sel = E.seleccionados;
    const v = Math.round((sel[0]?.opacidad ?? 1) * 100);
    const num = el("b", { text: v + " %" });
    const r = el("input.ed-rango", { type: "range", min: "0", max: "100", step: "1", value: String(v), "aria-label": "Opacidad" });
    r.addEventListener("input", () => {
      num.textContent = r.value + " %";
      E.transaccion("Opacidad", () => { for (const x of E.seleccionados) E.setEl(x.id, { opacidad: +r.value / 100 }, "Opacidad", "op"); }, "op");
    });
    popover(ancla, [el("b.ed-pop-t", {}, ["Opacidad ", num]), r]);
  }

  async _cambiarFoto(e) {
    const [id] = await elegir(this.app, "imagen", { titulo: "Cambiar foto" });
    if (id) this.E.setEl(e.id, { "imagen.asset": id }, "Cambiar foto");
  }

  /** Correr con precisión: de a 0,1 s o de a 1 s (también con Alt+←/→ en el teclado). */
  _correr(n) {
    const L = this.L;
    const c = (t, dt) => el("button.ed-btn.chico", { type: "button", text: t, onClick: () => L.empujar(dt) });
    popover(n, [el("b.ed-pop-t", { text: "Correr en el tiempo" }), el("div.ed-botonera", {}, [c("−1 s", -1000), c("−0,1 s", -100), c("+0,1 s", 100), c("+1 s", 1000)])]);
  }

  /** ⋯: lo de la línea (no se repite abajo). */
  _opciones(ancla) {
    const L = this.L, t = (i, x) => `${ico(i)}<span>${x}</span>`;
    menu(ancla, [
      { t: t("iman", L.iman ? "Imán: encendido" : "Imán: apagado"), al: () => { L.iman = !L.iman; L.pintar(); } },
      { t: t("bucle", L.bucle ? "Repetir al reproducir: sí" : "Repetir al reproducir: no"), al: () => { L.bucle = !L.bucle; L.pintar(); } },
      { t: t("audio", L.conMusica ? "Música al reproducir: sí" : "Música al reproducir: no"), al: () => { L.conMusica = !L.conMusica; L.pintar(); } },
      "-",
      { t: t("estrella", "Marcador en el cabezal"), al: () => L.marcar() },
      { t: t("ajustar", "Ver toda la línea"), al: () => L.verTodo() },
      { t: t("zoomMas", "Acercar"), al: () => L._zoom(L.pps * 1.4) },
      { t: t("zoomMenos", "Alejar"), al: () => L._zoom(L.pps / 1.4) },
    ]);
  }
}
