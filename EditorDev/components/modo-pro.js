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
 *                nada      → Cortar página, Transición y las pestañas (Bloques, Recursos, Elementos,
 *                            Texto, Música, Imágenes, Videos, Stickers, Efectos, Sonido)
 *                un clip   → Dividir, Empieza aquí, Termina aquí, Correr, Animación, Efectos, Luz y color,
 *                            Fotograma, Capa, Ocultar, Bloquear, Duplicar, Borrar
 *                un audio  → Volumen, Silenciar, Bucle, Empieza/Termina aquí, Duplicar, Quitar
 * Lo que añades aquí aparece en el cabezal (como en un editor de vídeo) y al reproducir suena la
 * música de la página. En ⋯ está lo de la línea: imán, bucle, música al reproducir, marcador y zoom.
 */
import { el, menu, popover } from "./ui.js";
import { ico } from "./iconos.js";
import { sinMovimiento as reducido } from "./transiciones.js";
import { abrirEfectos } from "./efectos-sonido.js";

const CON_LUZ = /^(imagen|video|album|carrusel|componente|forma|dibujo|escena3d)$/;
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
    // Deshacer y rehacer van en la fila del reproductor (como en CapCut).
    this.dh = el("div.pro-dh", {}, [b("deshacer", "Deshacer", () => this.E.deshacer()), b("rehacer", "Rehacer", () => this.E.rehacer())]);
    app.tiempo?.cab?.append(this.dh);
    this.herr = el("nav.pro-herr", { "aria-label": "Herramientas de LovEdit" });
    document.body.append(this.barra, this.herr);
    this.E.on("sel", () => this.refrescar());
    this.E.on("actual", () => { this._ids = new Set((this.E.pagina?.els || []).map((x) => x.id)); this._titulo(); });
    this.E.on("els", () => this._nuevos());
    addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && this.abierto && !document.querySelector(".ed-modal-fondo, .ed-pop, .ed-menu, .ed-hoja-sec.abierta, .ed-hojita")) this.cerrar();
    });
  }

  get L() { return this.app.tiempo; }

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
  refrescar() {
    if (!this.abierto) return;
    this._titulo();
    const L = this.L, E = this.E, sel = E.seleccionados;
    const audio = !sel.length && L.audioSel ? L._pista(L.audioSel) : null;
    const clave = audio ? `a:${audio.id}:${!!audio.silencio}:${!!audio.bucle}` : sel.length ? "c:" + sel.map((x) => `${x.id}${x.bloqueado ? 1 : 0}${x.oculto ? 1 : 0}`).join() : "nada";
    if (clave === this._clave) return;
    this._clave = clave;
    const b = (i, t, al, cls = "") => el("button.pro-b" + cls, { type: "button", "aria-label": t, onClick: (ev) => al(ev.currentTarget) }, [el("i", { html: ico(i) }), el("span", { text: t })]);
    const sep = () => el("i.pro-sep", { "aria-hidden": "true" });
    const A = this.app.acciones, app = this.app;
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
      xs = [
        b("izquierda", "Listo", () => E.seleccionar([]), ".atras"),
        sep(),
        uno ? b("tijeras", "Dividir", () => L.dividir(uno)) : null,
        uno ? b("izqA", "Empieza aquí", () => L._ponerTiempo(uno, "inicio")) : null,
        uno ? b("derA", "Termina aquí", () => L._ponerTiempo(uno, "fin")) : null,
        b("mover", "Correr", (n) => this._correr(n)),
        b("animar", "Animación", () => (innerWidth >= 1024 ? app.insp.abrir("animar") : app.abrirSeccion("animar"))),
        b("efectos", "Efectos", () => app.abrirSeccion("efectos")),
        uno && CON_LUZ.test(uno.tipo) ? b("luz", "Luz y color", () => app.ajustes?.abrir(uno.id)) : null,
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
      // Lo nuevo aparece en el cabezal (ver `_nuevos`). Las pestañas del editor, en chiquito.
      // Tocar otra vez la misma pestaña la cierra (Fase 39).
      const sec = (id) => (app.seccion === id && app.lateral?.abierto ? app.lateral.cerrar() : app.abrirSeccion(id, true));
      xs = [
        b("tijeras", "Cortar página", () => L.dividirPagina()),
        b("transiciones", "Transición", (n) => L._elegirTrans(E.paginaId, n)),
        sep(),
        b("bloques", "Bloques", () => sec("bloques")),
        b("biblioteca", "Recursos", () => sec("componentes")),
        b("elementos", "Elementos", () => sec("elementos")),
        b("texto", "Texto", () => A.texto("parrafo")),
        b("audio", "Música", () => sec("audio")),
        b("imagen", "Imágenes", () => sec("imagenes")),
        b("video", "Videos", () => sec("video")),
        b("sticker", "Stickers", () => sec("stickers")),
        b("efectos", "Efectos", () => sec("efectos")),
        b("campana", "Sonido", (n) => abrirEfectos(app, n)),
      ];
    }
    this.herr.replaceChildren(...xs.filter(Boolean));
    this.herr.dataset.modo = audio ? "audio" : sel.length ? "clip" : "nada";
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
