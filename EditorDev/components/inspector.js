/**
 * EL INSPECTOR — a la derecha (en el teléfono, la hoja de abajo).
 *
 *   Diseño   todo lo del elemento elegido; sin nada elegido, lo de la página
 *   Animar   entrada, bucle, salida y animación propia (fotogramas)
 *   Capas    qué va delante de qué, arrastrando
 *
 * Se construye una vez por selección y luego sólo se refresca: mover una
 * foto no rehace el panel, sólo cambia los números de X e Y.
 */
import { el, seccion, fila, boton, control, Vinculos, aviso, ordenable } from "./ui.js";
import { leerRuta } from "../core/estado.js";
import { TIPOS } from "../core/modelo.js";
import { DIBUJOS, FORMAS } from "../assets/dibujos.js";
import { elegir } from "../assets/selector.js";

const RT = window.LibritoRT;
const FUENTES = Object.keys(RT.FUENTES).map((f) => [f, f]);
const RECONSTRUIR = /^efectos\.(sombra|resplandor)$|^efectos$|sonidos|^componente\.(params|analisis|sinFondo)|^accion\.destino|fotos|\.tipo$|^fondo\.tipo|^accion|figura|disposicion|^carrusel\.modo|propia|^tipo$|^imagen\.asset|^video\.asset|^musica\.modo|fondo\.imagen|gradiente$|sombra$|^transicion$/;
const OPC_DIR = Object.entries(RT.DIRS);
const FACILES = Object.entries(RT.FACIL).map(([k, v]) => [k, v.n]);

export class Inspector {
  constructor(app, raiz) {
    this.app = app;
    this.E = app.estado;
    this.raiz = raiz;
    this.v = new Vinculos();
    this.tab = "diseno";
    this.pestanas = el("div.ed-insp-tabs", { role: "tablist" }, [
      ["diseno", "🎨 Diseño"], ["animar", "✨ Animar"], ["capas", "☰ Capas"],
    ].map(([k, t]) => el("button", { type: "button", role: "tab", dataset: { t: k }, html: t, onClick: () => this.abrir(k) })));
    this.cuerpo = el("div.ed-insp-cuerpo");
    raiz.append(this.pestanas, this.cuerpo);
    const E = this.E;
    const pronto = () => { if (this._r) return; this._r = requestAnimationFrame(() => { this._r = null; this.v.refrescar(); }); };
    const rehacer = () => { cancelAnimationFrame(this._rb); this._rb = requestAnimationFrame(() => this.construir()); };
    E.on("sel", rehacer);
    E.on("actual", rehacer);
    E.on("cargado", rehacer);
    E.on("el", ({ e, ruta }) => {
      if (this.tab === "capas") return rehacer();
      if (!E.sel.includes(e)) return;
      if (RECONSTRUIR.test(ruta || "")) rehacer(); else pronto();
    });
    E.on("els", () => { if (this.tab === "capas") rehacer(); else pronto(); });
    E.on("pagina", ({ ruta }) => { if (!E.sel.length) { if (RECONSTRUIR.test(ruta || "")) rehacer(); else pronto(); } });
    E.on("proyecto", pronto);
    E.on("paginas", pronto);
    E.on("assets", () => { if (!E.sel.length || E.unico?.tipo === "album" || E.unico?.tipo === "carrusel") rehacer(); });
  }

  /** Abre una pestaña y, si se pide, va directo a una sección («Efectos», «Sonidos»…). */
  abrir(tab, seccion) {
    this.tab = tab;
    this.app.mostrarInspector?.();
    this.construir();
    if (!seccion) return;
    for (const d of this.cuerpo.querySelectorAll("details.ed-sec")) {
      if (d.firstChild.textContent.trim().startsWith(seccion)) { d.open = true; requestAnimationFrame(() => d.scrollIntoView({ block: "start", behavior: "smooth" })); break; }
    }
  }

  construir() {
    const y = this.cuerpo.scrollTop;
    for (const b of this.pestanas.children) b.classList.toggle("on", b.dataset.t === this.tab);
    this.v.vaciar();
    this.cuerpo.textContent = "";
    if (!this.E.proyecto || !this.E.pagina) return;
    const sel = this.E.seleccionados;
    if (this.tab === "capas") this._capas();
    else if (this.tab === "animar") sel.length === 1 ? this._animar(sel[0]) : this._animarPagina(sel);
    else if (sel.length === 1) this._diseno(sel[0]);
    else if (sel.length > 1) this._varios(sel);
    else this._pagina();
    this.v.refrescar();
    this.cuerpo.scrollTop = y;
  }

  /* ── Atajos para ligar controles ────────────────────────────────── */
  _ctl(e) {
    const id = e.id;
    const E = this.E;
    return (ruta, op = {}) => control(this.v, {
      ...op,
      leer: () => {
        const x = E.el(id);
        if (!x) return undefined;
        const v = leerRuta(x, ruta) ?? op.def;
        return op.leerComo === "texto" ? RT.htmlATexto(v) : v;
      },
      escribir: (val) => {
        if (op.leerComo === "texto") val = RT.textoAHtml(val);
        E.setEl(id, { [ruta]: val }, op.nombre || "Editar", ruta + id);
        if (op.alto) this.app.lienzo.ajustarAlto(id);
      },
    });
  }

  _ctlPag() {
    const E = this.E;
    const pid = E.paginaId;
    return (ruta, op = {}) => control(this.v, { ...op, leer: () => leerRuta(E.pag(pid) || {}, ruta) ?? op.def, escribir: (val) => E.setPag({ [ruta]: val }, op.nombre || "Página", ruta + pid, pid) });
  }

  _ctlProy() {
    const E = this.E;
    return (ruta, op = {}) => control(this.v, { ...op, leer: () => leerRuta(E.proyecto, ruta) ?? op.def, escribir: (val) => E.setProy({ [ruta]: val }, op.nombre || "Ajustes", ruta) });
  }

  /* ── Diseño de un elemento ──────────────────────────────────────── */
  _diseno(e) {
    const c = this._ctl(e);
    const A = this.app.acciones;
    const cab = el("div.ed-insp-cab", {}, [
      el("b.ed-tipo", { text: TIPOS[e.tipo]?.icono || "•" }),
      c("nombre", { tipo: "texto", nombre: "Renombrar", alcambiar: true }),
    ]);
    this.cuerpo.append(cab);
    if (e.bloqueado) this.cuerpo.append(el("p.ed-nota", {}, ["🔒 Está bloqueado: no se mueve en la hoja. ", boton("Desbloquear", () => A.alternar("bloqueado"), "chico")]));
    if (e.origen) this.cuerpo.append(el("p.ed-nota", { text: "Sacado de la página original: el de debajo está escondido. Si lo borras, vuelve a verse el original." }));

    const propio = this["_" + e.tipo]?.(e, c);
    if (propio) this.cuerpo.append(...[].concat(propio));

    this.cuerpo.append(seccion("Posición y tamaño", [
      el("div.ed-rejilla2", {}, [
        fila("X", c("x", { unidad: "px", nombre: "Mover" })), fila("Y", c("y", { unidad: "px", nombre: "Mover" })),
        fila("Ancho", c("w", { min: 4, unidad: "px", nombre: "Tamaño" })), fila("Alto", c("h", { min: 4, unidad: "px", nombre: "Tamaño" })),
      ]),
      fila("Giro", c("rot", { tipo: "rango", min: -180, max: 180, paso: 1, unidad: "°", nombre: "Girar" })),
      fila("Opacidad", c("opacidad", { tipo: "rango", min: 0, max: 1, paso: 0.01, nombre: "Opacidad", def: 1 })),
      el("div.ed-botonera", {}, [
        boton("⇤", () => A.alinear("izq"), "ico", "Alinear a la izquierda"), boton("↔", () => A.alinear("centroH"), "ico", "Centrar a lo ancho"),
        boton("⇥", () => A.alinear("der"), "ico", "Alinear a la derecha"), boton("⤒", () => A.alinear("arriba"), "ico", "Alinear arriba"),
        boton("↕", () => A.alinear("centroV"), "ico", "Centrar a lo alto"), boton("⤓", () => A.alinear("abajo"), "ico", "Alinear abajo"),
      ]),
      el("div.ed-botonera", {}, [
        boton("⇈ Al frente", () => A.capa("frente"), "chico"), boton("⇡", () => A.capa("subir"), "ico", "Adelante"),
        boton("⇣", () => A.capa("bajar"), "ico", "Atrás"), boton("⇊ Al fondo", () => A.capa("fondo"), "chico"),
      ]),
    ]));

    if (e.tipo !== "pagina" && e.tipo !== "html" && e.tipo !== "componente") this.cuerpo.append(this._caja(e, c));
    this.cuerpo.append(this._efectos(e, c));
    if (e.tipo !== "boton") this.cuerpo.append(seccion("Al tocarlo", [this._accion(e, c)], { abierta: !!e.accion }));
    this.cuerpo.append(this._sonidos(e));
    this.cuerpo.append(seccion("Visibilidad", [
      fila("Empieza escondido", c("inicioOculto", { tipo: "toggle", nombre: "Empieza escondido" }), "en el librito no se ve hasta que otro elemento lo muestre («Al tocarlo → Mostrar…»)"),
    ], { abierta: !!e.inicioOculto }));
    this.cuerpo.append(el("div.ed-botonera.ed-pie-insp", {}, [
      boton("⧉ Duplicar", () => A.duplicar(), "chico"),
      boton(e.oculto ? "👁 Mostrar" : "🙈 Ocultar", () => A.alternar("oculto"), "chico"),
      boton(e.bloqueado ? "🔓 Desbloquear" : "🔒 Bloquear", () => A.alternar("bloqueado"), "chico"),
      boton("🗑 Borrar", () => A.borrar(), "chico peligro"),
    ]));
  }

  _caja(e, c) {
    const caja = e.caja || {};
    const hijos = [
      fila("Fondo", c("caja.fondo", { tipo: "color", nombre: "Fondo" })),
      el("div.ed-botonera", {}, [boton("Sin fondo", () => this.E.setEl(e.id, { "caja.fondo": null, "caja.gradiente": null }, "Fondo"), "chico"), boton(caja.gradiente ? "Quitar degradado" : "Degradado", () => this.E.setEl(e.id, { "caja.gradiente": caja.gradiente ? null : { a: "#ffd9ea", b: "#ff7fae", angulo: 160 } }, "Degradado"), "chico")]),
    ];
    if (caja.gradiente) hijos.push(el("div.ed-rejilla2", {}, [fila("Color 1", c("caja.gradiente.a", { tipo: "color" })), fila("Color 2", c("caja.gradiente.b", { tipo: "color" }))]), fila("Ángulo", c("caja.gradiente.angulo", { tipo: "rango", min: 0, max: 360, unidad: "°" })));
    hijos.push(
      fila("Esquinas", c("caja.radio", { tipo: "rango", min: 0, max: 200, unidad: "px", def: 0, nombre: "Esquinas" })),
      el("div.ed-rejilla2", {}, [fila("Borde", c("caja.borde.ancho", { min: 0, max: 40, unidad: "px", def: 0, nombre: "Borde" })), fila("Color", c("caja.borde.color", { tipo: "color", nombre: "Borde", def: "#3a2440" }))]),
      fila("Estilo", c("caja.borde.estilo", { tipo: "segmento", opciones: [["solid", "—"], ["dashed", "- -"], ["dotted", "···"], ["double", "="]], def: "solid" })),
      fila("Relleno", c("caja.relleno", { tipo: "rango", min: 0, max: 60, unidad: "px", def: 0, nombre: "Espaciado", alto: true })),
      fila("Sombra", control(this.v, { tipo: "toggle", leer: () => !!this.E.el(e.id)?.caja?.sombra, escribir: (on) => this.E.setEl(e.id, { "caja.sombra": on ? { x: 0, y: 10, blur: 24, color: "rgba(60,20,40,.28)" } : null }, "Sombra") })),
    );
    if (caja.sombra) hijos.push(el("div.ed-rejilla2", {}, [fila("X", c("caja.sombra.x")), fila("Y", c("caja.sombra.y")), fila("Difuso", c("caja.sombra.blur", { min: 0 })), fila("Color", c("caja.sombra.color", { tipo: "color" }))]));
    hijos.push(
      fila("Vidrio", c("caja.vidrio", { tipo: "rango", min: 0, max: 30, unidad: "px", def: 0, nombre: "Vidrio" }), "desenfoca lo que hay detrás"),
      fila("Mezcla", c("mezcla", { tipo: "select", opciones: [["", "Normal"], ["multiply", "Multiplicar"], ["screen", "Trama"], ["overlay", "Superponer"], ["soft-light", "Luz suave"], ["lighten", "Aclarar"], ["darken", "Oscurecer"]], def: "" })),
    );
    return seccion("Caja, borde y sombra", hijos, { abierta: false });
  }

  _accion(e, c) {
    const paginas = this.E.proyecto.orden.map((pid, i) => [pid, `${i + 1}. ${this.E.pag(pid).nombre}`]);
    const ac = e.accion || {};
    const hijos = [fila("Acción", control(this.v, {
      tipo: "select",
      opciones: [["", "Nada"], ["siguiente", "Pasar a la siguiente página"], ["anterior", "Volver a la anterior"], ["inicio", "Ir a la portada"], ["ir", "Ir a una página…"],
        ["mostrar", "Mostrar un elemento…"], ["ocultar", "Esconder un elemento…"], ["alternar", "Mostrar / esconder un elemento…"], ["animar", "Animar un elemento…"],
        ["sonido", "Hacer sonar algo…"], ["enlace", "Abrir un enlace…"], ["musica", "Pausar / poner la música"]],
      leer: () => this.E.el(e.id)?.accion?.tipo || "",
      escribir: (t) => this.E.setEl(e.id, { accion: t ? { tipo: t, destino: t === "ir" ? paginas[0]?.[0] : "" } : null }, "Acción"),
    }))];
    const otros = this.E.pagina.els.filter((x) => x.id !== e.id).map((x) => [x.id, (x.inicioOculto ? "🙈 " : "") + x.nombre]);
    if (ac.tipo === "ir") hijos.push(fila("Página", c("accion.destino", { tipo: "select", opciones: paginas })));
    if (/^(mostrar|ocultar|alternar|animar)$/.test(ac.tipo)) {
      hijos.push(fila("Cuál", c("accion.destino", { tipo: "select", opciones: [["", "— elige —"], ...otros] })));
      if (ac.tipo === "mostrar") hijos.push(el("small.ed-ayuda", { text: "Al otro ponle «Empieza escondido» (en Visibilidad) y aparecerá con su animación de entrada." }));
    }
    if (ac.tipo === "sonido") hijos.push(this._elegirAudio(() => this.E.el(e.id)?.accion?.destino, (id) => this.E.setEl(e.id, { "accion.destino": id }, "Sonido")));
    if (ac.tipo === "enlace") hijos.push(fila("Enlace", c("accion.destino", { tipo: "texto", placeholder: "https://…", alcambiar: true })));
    return el("div", {}, hijos);
  }

  /* — por tipo — */
  _texto(e, c) {
    return seccion("Texto", [
      c("texto.html", { tipo: "area", filas: 4, nombre: "Escribir", leerComo: "texto" }),
      el("small.ed-ayuda", { text: "Toca dos veces el texto en la hoja para escribir directo (ahí puedes poner negritas con Ctrl+B)." }),
      fila("Letra", c("texto.fuente", { tipo: "select", opciones: FUENTES, nombre: "Letra", alto: true })),
      el("div.ed-rejilla2", {}, [fila("Tamaño", c("texto.tam", { min: 6, max: 300, unidad: "px", nombre: "Tamaño", alto: true })), fila("Color", c("texto.color", { tipo: "color", nombre: "Color" }))]),
      fila("Grosor", c("texto.peso", { tipo: "segmento", opciones: [[300, "300"], [400, "400"], [500, "500"], [600, "600"], [700, "700"]], nombre: "Grosor" })),
      el("div.ed-botonera", {}, [
        el("span.ed-et", { text: "Estilo" }),
        c("texto.cursiva", { tipo: "toggle", nombre: "Cursiva" }), el("small", { text: "cursiva" }),
        c("texto.subrayado", { tipo: "toggle", nombre: "Subrayado" }), el("small", { text: "subrayado" }),
        c("texto.mayus", { tipo: "toggle", nombre: "Mayúsculas" }), el("small", { text: "MAYÚS" }),
      ]),
      fila("Alinear", c("texto.alin", { tipo: "segmento", opciones: [["left", "⇤", "Izquierda"], ["center", "↔", "Centro"], ["right", "⇥", "Derecha"], ["justify", "☰", "Justificado"]] })),
      fila("Vertical", c("texto.valin", { tipo: "segmento", opciones: [["arriba", "Arriba"], ["centro", "Centro"], ["abajo", "Abajo"]], def: "arriba" })),
      fila("Interletra", c("texto.interletra", { tipo: "rango", min: -4, max: 20, paso: 0.5, unidad: "px", def: 0, alto: true })),
      fila("Interlínea", c("texto.interlinea", { tipo: "rango", min: 0.8, max: 2.6, paso: 0.05, def: 1.3, alto: true })),
      fila("Sombra", control(this.v, { tipo: "toggle", leer: () => !!this.E.el(e.id)?.texto?.sombra, escribir: (on) => this.E.setEl(e.id, { "texto.sombra": on ? { x: 0, y: 2, blur: 10, color: "rgba(0,0,0,.35)" } : null }, "Sombra") })),
      e.texto?.sombra ? el("div.ed-rejilla2", {}, [fila("X", c("texto.sombra.x")), fila("Y", c("texto.sombra.y")), fila("Difuso", c("texto.sombra.blur", { min: 0 })), fila("Color", c("texto.sombra.color", { tipo: "color" }))]) : null,
    ].filter(Boolean));
  }

  _imagen(e, c) {
    const A = this.app.acciones;
    const im = e.imagen || {};
    const url = im.asset && this.app.bib.url(im.asset);
    return seccion("Foto", [
      url ? el("div.ed-previa", {}, [el("img", { src: url, alt: "" })]) : null,
      el("div.ed-botonera", {}, [
        boton(url ? "⟳ Cambiar foto" : "＋ Añadir foto", () => A.pedirArchivoPara(e), url ? "" : "primario"),
        url ? boton("⌗ Recortar", () => this.app.lienzo.recortar(e)) : null,
      ].filter(Boolean)),
      fila("Encaje", c("imagen.ajuste", { tipo: "segmento", opciones: [["cover", "Llenar"], ["contain", "Entera"]] })),
      fila("Acercar", c("imagen.recorte.zoom", { tipo: "rango", min: 1, max: 5, paso: 0.01, def: 1, nombre: "Acercar" })),
      el("div.ed-rejilla2", {}, [fila("Encuadre ↔", c("imagen.recorte.x", { tipo: "rango", min: 0, max: 100, def: 50, unidad: "%" })), fila("Encuadre ↕", c("imagen.recorte.y", { tipo: "rango", min: 0, max: 100, def: 50, unidad: "%" }))]),
      fila("Forma", c("imagen.forma", { tipo: "select", opciones: [["", "Normal"], ["circulo", "Círculo"], ["corazon", "Corazón"], ["estrella", "Estrella"], ["arco", "Arco"], ["gota", "Gota"], ["hexagono", "Hexágono"], ["nube", "Nube"], ["rombo", "Rombo"]], def: "" })),
      fila("Marco", c("imagen.marco", { tipo: "segmento", opciones: [["", "Ninguno"], ["polaroid", "Polaroid"], ["cinta", "Cinta"]], def: "" })),
      seccion("Filtros", [
        fila("Brillo", c("imagen.filtro.brillo", { tipo: "rango", min: 40, max: 160, def: 100, unidad: "%" })),
        fila("Contraste", c("imagen.filtro.contraste", { tipo: "rango", min: 40, max: 160, def: 100, unidad: "%" })),
        fila("Color", c("imagen.filtro.saturacion", { tipo: "rango", min: 0, max: 200, def: 100, unidad: "%" })),
        fila("Blanco y negro", c("imagen.filtro.bn", { tipo: "rango", min: 0, max: 100, def: 0, unidad: "%" })),
        fila("Sepia", c("imagen.filtro.sepia", { tipo: "rango", min: 0, max: 100, def: 0, unidad: "%" })),
        fila("Desenfoque", c("imagen.filtro.desenfoque", { tipo: "rango", min: 0, max: 20, paso: 0.5, def: 0, unidad: "px" })),
        boton("Quitar filtros", () => this.E.setEl(e.id, { "imagen.filtro": null }, "Quitar filtros"), "chico"),
      ], { abierta: false }),
    ].filter(Boolean));
  }

  _forma(e, c) {
    const f = e.forma || {};
    return seccion("Forma", [
      fila("Figura", c("forma.figura", { tipo: "select", opciones: FORMAS.map((x) => [x.id, x.n]) })),
      el("div.ed-rejilla2", {}, [fila("Relleno", c("forma.relleno", { tipo: "color" })), fila("Trazo", c("forma.trazo", { tipo: "color" }))]),
      fila("Grosor", c("forma.grosor", { tipo: "rango", min: 0, max: 30, def: 0, unidad: "px" })),
      boton(f.gradiente ? "Quitar degradado" : "Usar degradado", () => this.E.setEl(e.id, { "forma.gradiente": f.gradiente ? null : { a: "#ffd9ea", b: "#d8397a", angulo: 160 } }, "Degradado"), "chico"),
      f.gradiente ? el("div.ed-rejilla2", {}, [fila("Color 1", c("forma.gradiente.a", { tipo: "color" })), fila("Color 2", c("forma.gradiente.b", { tipo: "color" })), fila("Ángulo", c("forma.gradiente.angulo", { min: 0, max: 360, unidad: "°" }))]) : null,
      f.figura === "linea" ? fila("Puntas redondas", c("forma.redondo", { tipo: "toggle" })) : null,
    ].filter(Boolean));
  }

  _dibujo(e, c) {
    const lista = el("div.ed-dibujos.chico", {}, DIBUJOS.map((d) => el("button", { type: "button", title: d.n, html: d.svg, onClick: () => this.E.setEl(e.id, { "dibujo.svg": d.svg, nombre: d.n }, "Cambiar dibujo") })));
    return seccion("Dibujo", [
      fila("Color", c("dibujo.color", { tipo: "color", nombre: "Color" })),
      fila("Deformar al estirar", c("dibujo.estirar", { tipo: "toggle" })),
      el("small.ed-ayuda", { text: "Cambiar por otro:" }),
      lista,
    ]);
  }

  _trazo(e, c) {
    return seccion("Trazo a mano", [fila("Color", c("trazo.color", { tipo: "color" })), fila("Grosor", c("trazo.grosor", { tipo: "rango", min: 1, max: 40, unidad: "px" }))]);
  }

  _boton(e, c) {
    return [seccion("Botón", [
      fila("Texto", c("boton.texto", { tipo: "texto" })),
      fila("Estilo", c("boton.estilo", { tipo: "select", opciones: [["relleno", "Relleno"], ["borde", "Con borde"], ["suave", "Suave"], ["vidrio", "Vidrio"], ["texto", "Sólo texto"]] })),
      el("div.ed-rejilla2", {}, [fila("Color", c("boton.fondo", { tipo: "color" })), fila("Letra", c("boton.color", { tipo: "color" }))]),
      fila("Tipografía", c("boton.fuente", { tipo: "select", opciones: FUENTES })),
      el("div.ed-rejilla2", {}, [fila("Tamaño", c("boton.tam", { min: 8, max: 80, unidad: "px" })), fila("Esquinas", c("boton.radio", { min: 0, max: 999, unidad: "px" }))]),
    ]), seccion("Al tocarlo", [this._accion(e, c)])];
  }

  _listaFotos(e, c, clave) {
    const fotos = e[clave].fotos || [];
    const lista = el("div.ed-fotos", {}, fotos.map((id, i) => el("div.ed-foto-mini", { dataset: { id: String(i) } }, [
      el("img", { src: this.app.bib.url(id) || "", alt: "", loading: "lazy" }),
      el("button.ed-asa", { type: "button", html: "⠿", title: "Arrastra para ordenar", "aria-label": "Ordenar" }),
      el("button.ed-quitar", { type: "button", html: "✕", title: "Quitar del " + (clave === "album" ? "álbum" : "carrusel"), onClick: () => this.E.setEl(e.id, { [clave + ".fotos"]: fotos.filter((_, j) => j !== i) }, "Quitar foto") }),
    ])));
    ordenable(lista, { item: ".ed-foto-mini", asa: ".ed-asa", alSoltar: (de, a) => { const f = [...fotos]; const [x] = f.splice(de, 1); f.splice(a, 0, x); this.E.setEl(e.id, { [clave + ".fotos"]: f }, "Ordenar fotos"); } });
    return [
      el("div.ed-botonera", {}, [boton("＋ Añadir fotos", () => this.app.acciones.pedirArchivoPara(e), "primario"), el("small", { text: fotos.length ? `${fotos.length} foto${fotos.length > 1 ? "s" : ""}` : "todavía ninguna" })]),
      fotos.length ? lista : null,
    ].filter(Boolean);
  }

  _album(e, c) {
    const a = e.album || {};
    const cascada = Object.entries(RT.ANIM.entrada).map(([k, v]) => [k, v.n]);
    return seccion("Álbum de fotos", [
      ...this._listaFotos(e, c, "album"),
      fila("Disposición", c("album.disposicion", { tipo: "select", opciones: [["cuadricula", "Cuadrícula"], ["mosaico", "Mosaico"], ["fila", "Tira que se desliza"], ["polaroids", "Polaroids sueltas"], ["pila", "Pila (se pasan tocando)"]] })),
      a.disposicion === "cuadricula" || a.disposicion === "mosaico" || !a.disposicion ? fila("Columnas", c("album.columnas", { tipo: "rango", min: 1, max: 5 })) : null,
      a.disposicion === "fila" ? fila("Dirección", c("album.direccion", { tipo: "segmento", opciones: [["horizontal", "↔"], ["vertical", "↕"]], def: "horizontal" })) : null,
      a.disposicion === "cuadricula" || !a.disposicion ? fila("Proporción", c("album.proporcion", { tipo: "select", opciones: [["1", "Cuadrada"], ["4/5", "Retrato 4:5"], ["3/4", "Retrato 3:4"], ["4/3", "Apaisada 4:3"], ["16/9", "Panorámica"]] })) : null,
      el("div.ed-rejilla2", {}, [fila("Espacio", c("album.espacio", { min: 0, max: 40, unidad: "px" })), fila("Esquinas", c("album.radio", { min: 0, max: 60, unidad: "px" }))]),
      fila("Marco", c("album.marco", { tipo: "segmento", opciones: [["ninguno", "Ninguno"], ["blanco", "Blanco"], ["polaroid", "Polaroid"]] })),
      fila("Ampliar al tocar", c("album.ampliar", { tipo: "toggle", def: true })),
      seccion("Cómo aparecen las fotos", [
        fila("Animación", c("album.cascada.tipo", { tipo: "select", opciones: cascada })),
        el("div.ed-rejilla2", {}, [fila("Entre fotos", c("album.cascada.paso", { min: 0, max: 1000, paso: 10, unidad: "ms" })), fila("Duración", c("album.cascada.dur", { min: 100, max: 3000, paso: 50, unidad: "ms" }))]),
        fila("Dirección", c("album.cascada.dir", { tipo: "select", opciones: OPC_DIR })),
      ], { abierta: false }),
    ].filter(Boolean));
  }

  _carrusel(e, c) {
    const k = e.carrusel || {};
    return seccion("Carrusel de fotos", [
      ...this._listaFotos(e, c, "carrusel"),
      fila("Estilo", c("carrusel.modo", { tipo: "segmento", opciones: [["deslizar", "Deslizar"], ["fundido", "Fundido"], ["cartas", "Cartas 3D"]] })),
      fila("Dirección", c("carrusel.direccion", { tipo: "segmento", opciones: [["horizontal", "↔"], ["vertical", "↕"]] })),
      fila("Solo", c("carrusel.auto", { tipo: "toggle" }), "pasa las fotos sin tocar"),
      k.auto !== false ? fila("Cada", c("carrusel.intervalo", { tipo: "rango", min: 1200, max: 10000, paso: 100, unidad: "ms" })) : null,
      fila("Velocidad", c("carrusel.velocidad", { tipo: "rango", min: 150, max: 2000, paso: 50, unidad: "ms" })),
      el("div.ed-botonera", {}, [c("carrusel.bucle", { tipo: "toggle" }), el("small", { text: "vuelve a empezar" }), c("carrusel.puntos", { tipo: "toggle" }), el("small", { text: "puntitos" }), c("carrusel.flechas", { tipo: "toggle" }), el("small", { text: "flechas" })]),
      el("div.ed-rejilla2", {}, [fila("Espacio", c("carrusel.espacio", { min: 0, max: 40, unidad: "px" })), fila("Esquinas", c("carrusel.radio", { min: 0, max: 60, unidad: "px" }))]),
      fila("Encaje", c("carrusel.ajuste", { tipo: "segmento", opciones: [["cover", "Llenar"], ["contain", "Entera"]] })),
    ].filter(Boolean));
  }

  _video(e, c) {
    return seccion("Vídeo", [
      boton(e.video?.asset ? "⟳ Cambiar vídeo" : "＋ Añadir vídeo", () => this.app.acciones.pedirArchivoPara(e), e.video?.asset ? "" : "primario"),
      el("div.ed-botonera", {}, [c("video.auto", { tipo: "toggle" }), el("small", { text: "solo al llegar" }), c("video.bucle", { tipo: "toggle" }), el("small", { text: "en bucle" })]),
      el("div.ed-botonera", {}, [c("video.silencio", { tipo: "toggle" }), el("small", { text: "sin sonido" }), c("video.controles", { tipo: "toggle" }), el("small", { text: "controles" })]),
      fila("Encaje", c("video.ajuste", { tipo: "segmento", opciones: [["cover", "Llenar"], ["contain", "Entero"]] })),
      el("small.ed-ayuda", { text: "Para que empiece solo, el teléfono pide que esté sin sonido." }),
    ]);
  }

  _html(e, c) {
    return seccion("HTML", [
      boton("&lt;/&gt; Editar el HTML", () => this.app.acciones.editarHtml(e), "primario"),
      fila("Se puede tocar", c("html.interactivo", { tipo: "toggle", def: true })),
      el("small.ed-ayuda", { text: "Va dentro de su propio marco aislado: no puede romper el librito ni el editor." }),
    ]);
  }

  /** Un botoncito para elegir un sonido (de assets/, de la música o subido). */
  _elegirAudio(leer, escribir, etiqueta = "Sonido") {
    const nombre = () => { const id = leer(); return id ? this.E.proyecto.assets[id]?.nombre || "sonido" : "ninguno"; };
    const b = boton("♪ " + nombre(), async () => { const [id] = await elegir(this.app, "audio", { titulo: etiqueta }); if (id) escribir(id); }, "chico");
    const quitar = boton("✕", () => escribir(null), "chico ico", "Quitar");
    const probar = boton("▶", () => { const id = leer(); if (id) RT.sonar(this.app.bib.url(id), 0.9); }, "chico ico", "Escuchar");
    this.v.add(() => { b.innerHTML = "♪ " + nombre(); });
    return fila(etiqueta, el("div.ed-botonera", {}, [b, probar, quitar]));
  }

  _sonidos(e) {
    const E = this.E;
    const set = (k) => (id) => E.setEl(e.id, { ["sonidos." + k]: id }, "Sonido");
    const leer = (k) => () => E.el(e.id)?.sonidos?.[k] || null;
    return seccion("Sonidos", [
      this._elegirAudio(leer("tocar"), set("tocar"), "Al tocarlo"),
      this._elegirAudio(leer("aparecer"), set("aparecer"), "Al aparecer"),
      fila("Volumen", this._ctl(e)("sonidos.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05, def: 0.9 })),
      el("small.ed-ayuda", { text: "Pon tus sonidos en assets/ (cualquier carpeta) o súbelos aquí." }),
    ], { abierta: !!(e.sonidos?.tocar || e.sonidos?.aparecer) });
  }

  _efectos(e, c) {
    const f = e.efectos || {};
    const conmuta = (k, def) => control(this.v, { tipo: "toggle", leer: () => !!this.E.el(e.id)?.efectos?.[k], escribir: (on) => this.E.setEl(e.id, { ["efectos." + k]: on ? def : null }, "Efecto") });
    const hijos = [
      fila("Sombra", conmuta("sombra", { x: 0, y: 8, blur: 14, color: "rgba(60,20,45,.35)" })),
      f.sombra ? el("div.ed-rejilla2", {}, [fila("X", c("efectos.sombra.x")), fila("Y", c("efectos.sombra.y")), fila("Difuso", c("efectos.sombra.blur", { min: 0 })), fila("Color", c("efectos.sombra.color", { tipo: "color" }))]) : null,
      fila("Resplandor", conmuta("resplandor", { color: "#ffc4dc", tam: 12 })),
      f.resplandor ? el("div.ed-rejilla2", {}, [fila("Color", c("efectos.resplandor.color", { tipo: "color" })), fila("Tamaño", c("efectos.resplandor.tam", { min: 1, max: 60 }))]) : null,
      fila("Desenfoque", c("efectos.desenfoque", { tipo: "rango", min: 0, max: 20, paso: 0.5, def: 0, unidad: "px" })),
      fila("Brillo", c("efectos.brillo", { tipo: "rango", min: 30, max: 180, def: 100, unidad: "%" })),
      fila("Contraste", c("efectos.contraste", { tipo: "rango", min: 30, max: 180, def: 100, unidad: "%" })),
      fila("Color", c("efectos.saturacion", { tipo: "rango", min: 0, max: 220, def: 100, unidad: "%" })),
      fila("Blanco y negro", c("efectos.byn", { tipo: "rango", min: 0, max: 100, def: 0, unidad: "%" })),
      fila("Sepia", c("efectos.sepia", { tipo: "rango", min: 0, max: 100, def: 0, unidad: "%" })),
      fila("Tono", c("efectos.tono", { tipo: "rango", min: 0, max: 360, def: 0, unidad: "°" })),
      boton("Quitar efectos", () => this.E.setEl(e.id, { efectos: null }, "Quitar efectos"), "chico"),
    ];
    return seccion("Efectos", hijos.filter(Boolean), { abierta: !!e.efectos });
  }

  _componente(e, c) {
    const k = e.componente || {};
    const an = k.analisis;
    const A = this.app.acciones;
    const params = (k.parametros || []).map((d) => {
      const ruta = "componente.params." + d.id;
      const et = d.etiqueta || d.id;
      if (d.tipo === "color") return fila(et, c(ruta, { tipo: "color", def: d.def }));
      if (d.tipo === "numero") return fila(et, c(ruta, { tipo: "numero", min: d.min, max: d.max, def: d.def }));
      if (d.tipo === "opciones") return fila(et, c(ruta, { tipo: "select", opciones: d.opciones || [], def: d.def }));
      if (d.tipo === "si-no") return fila(et, c(ruta, { tipo: "toggle", def: d.def }));
      if (d.tipo === "audio") return this._elegirAudio(() => this.E.el(e.id)?.componente?.params?.[d.id], (id) => this.E.setEl(e.id, { [ruta]: id }, et), et);
      if (d.tipo === "imagen") {
        const id = k.params?.[d.id];
        const url = id && this.app.bib.url(id);
        return fila(et, el("div.ed-botonera", {}, [
          url ? el("img.ed-param-foto", { src: url, alt: "" }) : null,
          boton(url ? "⟳ Cambiar" : "＋ Elegir foto", async () => { const [x] = await elegir(this.app, "imagen", { titulo: et }); if (x) this.E.setEl(e.id, { [ruta]: x }, et); }, url ? "chico" : "chico primario"),
          url ? boton("✕", () => this.E.setEl(e.id, { [ruta]: null }, et), "chico ico", "Quitar") : null,
        ].filter(Boolean)));
      }
      return fila(et, c(ruta, { tipo: "texto", def: d.def, alcambiar: true }));
    });
    const hayFondo = an && (an.fondo || []).length;
    return [
      seccion("Componente", [
        el("p.ed-nota.suave", { text: `${k.id || k.ruta} — su HTML, sus estilos, sus scripts y su zona táctil se usan tal cual: aquí sólo decides dónde va y cómo se ve en esta página.` }),
        ...(params.length ? params : [el("small.ed-ayuda", { text: "Este componente no tiene parámetros (se pueden declarar en su asset.json)." })]),
        el("div.ed-botonera", {}, [
          boton("▶ Probar aquí", () => this.app.lienzo.probarAqui(e), "chico primario"),
          boton("Ver el original", () => open("../" + k.ruta + (k.entrada || "index.html"), "_blank"), "chico"),
          boton("Tamaño natural", () => { const W = k.ancho || e.w, H = k.alto || e.h; this.E.setEl(e.id, { w: W, h: H }, "Tamaño natural"); }, "chico"),
        ]),
      ]),
      seccion("Tamaño y zona táctil", [
        fila("Al cambiar el tamaño", c("componente.ajuste", { tipo: "segmento", opciones: [["escalar", "Escalar entero"], ["adaptar", "Que se acomode"]], def: "escalar" }), "escalar = se ve igual pero más grande o chico"),
        el("p.ed-nota", { text: "Detectado: " + (an ? an.resumen || "—" : "sin analizar") }),
        fila("Elegirlo en la hoja", c("componente.seleccion", { tipo: "segmento", opciones: [["zona", "Por su zona real"], ["todo", "Por todo el cuadro"]], def: "zona" }), "«zona real»: sólo su botón o lo que se ve; lo demás deja tocar lo de abajo"),
        boton("🔍 Volver a detectar", () => A.reanalizar(e), "chico"),
      ], { abierta: false }),
      seccion("Fondo", [
        el("p.ed-ayuda", { text: hayFondo ? "Este componente tiene fondo. No se quita solo: sólo si tú lo pides, y sólo en esta copia (el archivo original no cambia)." : "No se detectó un fondo propio (es transparente)." }),
        fila("Eliminar fondo", c("componente.sinFondo", { tipo: "toggle", nombre: "Eliminar fondo" })),
        fila("Dejar pasar los toques", c("componente.recorte", { tipo: "toggle", nombre: "Dejar pasar los toques" }), "en el librito, los toques fuera de lo que se ve llegan a lo de abajo"),
      ], { abierta: !!(k.sinFondo || k.recorte) }),
    ];
  }

  _pagina(e) {
    const p = e.pagina || {};
    return seccion("Página original", [
      el("p.ed-nota", { text: `${p.titulo || p.ruta}: se ve y funciona tal cual (con su JavaScript). Puedes poner cosas encima.` }),
      boton("✨ Hacer editable (sacar textos y fotos)", () => this.app.importar.hacerEditable(e), "primario"),
      boton("Abrir el original en otra pestaña", () => open("../" + p.ruta, "_blank"), "chico"),
    ]);
  }

  /* ── Varios a la vez ────────────────────────────────────────────── */
  _varios(sel) {
    const A = this.app.acciones;
    this.cuerpo.append(el("div.ed-insp-cab", {}, [el("b.ed-tipo", { text: sel.length }), el("span", { text: "elementos elegidos" })]));
    this.cuerpo.append(seccion("Alinear entre ellos", [
      el("div.ed-botonera", {}, [
        boton("⇤", () => A.alinear("izq"), "ico", "Izquierda"), boton("↔", () => A.alinear("centroH"), "ico", "Centro"), boton("⇥", () => A.alinear("der"), "ico", "Derecha"),
        boton("⤒", () => A.alinear("arriba"), "ico", "Arriba"), boton("↕", () => A.alinear("centroV"), "ico", "En medio"), boton("⤓", () => A.alinear("abajo"), "ico", "Abajo"),
      ]),
      el("div.ed-botonera", {}, [boton("Repartir ↔", () => A.distribuir("h"), "chico"), boton("Repartir ↕", () => A.distribuir("v"), "chico")]),
    ]));
    this.cuerpo.append(seccion("Todos juntos", [
      fila("Opacidad", control(this.v, { tipo: "rango", min: 0, max: 1, paso: 0.01, leer: () => this.E.el(sel[0].id)?.opacidad ?? 1, escribir: (x) => this.E.transaccion("Opacidad", () => { for (const e of sel) this.E.setEl(e.id, { opacidad: x }); }, "opvarios") })),
      el("div.ed-botonera", {}, [boton("⧉ Duplicar", () => A.duplicar(), "chico"), boton("🔒 Bloquear", () => A.alternar("bloqueado"), "chico"), boton("🗑 Borrar", () => A.borrar(), "chico peligro")]),
    ]));
  }

  /* ── La página (sin nada elegido) ───────────────────────────────── */
  _pagina() {
    const p = this.E.pagina;
    const c = this._ctlPag();
    const A = this.app.acciones;
    const f = p.fondo || {};
    this.cuerpo.append(el("div.ed-insp-cab", {}, [el("b.ed-tipo", { text: "📄" }), c("nombre", { tipo: "texto", nombre: "Renombrar página", alcambiar: true })]));
    const fondo = [fila("Tipo", c("fondo.tipo", { tipo: "segmento", opciones: [["color", "Color"], ["gradiente", "Degradado"]], def: "color" })), fila("Color", c("fondo.color", { tipo: "color", nombre: "Fondo" }))];
    if (f.tipo === "gradiente") fondo.push(
      el("div.ed-rejilla2", {}, [fila("Color 1", c("fondo.gradiente.a", { tipo: "color", def: "#ffd9ea" })), fila("Color 2", c("fondo.gradiente.b", { tipo: "color", def: "#ff9fc3" }))]),
      fila("Forma", c("fondo.gradiente.tipo", { tipo: "segmento", opciones: [["lineal", "Lineal"], ["radial", "Radial"]], def: "lineal" })),
      fila("Ángulo", c("fondo.gradiente.angulo", { tipo: "rango", min: 0, max: 360, def: 160, unidad: "°" })),
    );
    if (f.css) fondo.push(el("p.ed-nota", {}, ["Fondo traído de la página original. ", boton("Quitarlo", () => this.E.setPag({ "fondo.css": undefined }, "Fondo"), "chico")]));
    const img = f.imagen?.asset;
    fondo.push(el("div.ed-botonera", {}, [
      boton(img ? "⟳ Cambiar foto de fondo" : "＋ Foto de fondo", async () => { const [id] = await elegir(this.app, "imagen", { titulo: "Foto de fondo" }); if (id) this.E.setPag({ "fondo.imagen": { asset: id, ajuste: "cover", opacidad: 1, desenfoque: 0, pos: "center" } }, "Foto de fondo"); }, img ? "chico" : "chico primario"),
      img ? boton("Quitar", () => this.E.setPag({ "fondo.imagen": null }, "Quitar foto de fondo"), "chico") : null,
    ].filter(Boolean)));
    if (img) fondo.push(
      fila("Encaje", c("fondo.imagen.ajuste", { tipo: "segmento", opciones: [["cover", "Llenar"], ["contain", "Entera"], ["mosaico", "Mosaico"]] })),
      fila("Opacidad", c("fondo.imagen.opacidad", { tipo: "rango", min: 0, max: 1, paso: 0.01, def: 1 })),
      fila("Desenfoque", c("fondo.imagen.desenfoque", { tipo: "rango", min: 0, max: 30, def: 0, unidad: "px" })),
    );
    this.cuerpo.append(seccion("Fondo de la página", fondo));
    this.cuerpo.append(seccion("Esta página", [
      fila("Pasar sola", c("duracion", { tipo: "rango", min: 0, max: 60, def: 0, unidad: " s" }), "0 = espera a que pases la hoja"),
      el("div.ed-botonera", {}, [
        boton("🖼️ Poner de portada", () => A.ponerPortada(), "chico"),
        boton("⧉ Duplicar", () => this.E.duplicarPagina(this.E.paginaId), "chico"),
        boton("🧹 Dejar en blanco", () => A.limpiarPagina(), "chico"),
        boton("🗑 Borrar", () => A.borrarPagina(), "chico peligro"),
      ]),
      el("small.ed-ayuda", { text: "La transición y la música de esta página están en sus paneles (🎞️ y 🎵)." }),
    ]));
    this.cuerpo.append(el("p.ed-nota.suave", { text: "Toca algo de la hoja para editarlo, o añade cosas desde 🧩." }));
  }

  /* ── Animar un elemento ─────────────────────────────────────────── */
  _faseAnim(e, fase, titulo) {
    const c = this._ctl(e);
    const lista = RT.ANIM[fase];
    const def = RT.ANIM_DEF[fase];
    const a = e.anim?.[fase] || {};
    const info = lista[a.tipo] || {};
    const nada = !info.f;
    const base = "anim." + fase + ".";
    const hijos = [fila("Tipo", c(base + "tipo", { tipo: "select", opciones: Object.entries(lista).map(([k, v]) => [k, v.n]), def: def.tipo, nombre: "Animación" }))];
    if (!nada) {
      hijos.push(el("div.ed-rejilla2", {}, [
        fila("Duración", c(base + "dur", { min: 50, max: 20000, paso: 50, unidad: "ms", def: def.dur })),
        fila("Retraso", c(base + "retraso", { min: 0, max: 20000, paso: 50, unidad: "ms", def: def.retraso })),
      ]));
      if (fase !== "bucle" || !info.lineal) hijos.push(fila("Ritmo", c(base + "facil", { tipo: "select", opciones: FACILES, def: def.facil })));
      const usa = info.usa || [];
      if (usa.includes("dir")) hijos.push(fila("Dirección", c(base + "dir", { tipo: "select", opciones: OPC_DIR, def: def.dir })));
      if (usa.includes("dist")) hijos.push(fila("Distancia", c(base + "dist", { tipo: "rango", min: 0, max: 400, unidad: "px", def: def.dist })));
      if (usa.includes("escala")) hijos.push(fila("Escala", c(base + "escala", { tipo: "rango", min: fase === "bucle" ? 1 : 0, max: fase === "bucle" ? 1.6 : 1.5, paso: 0.01, def: def.escala })));
      if (usa.includes("giro")) hijos.push(fila("Giro", c(base + "giro", { tipo: "rango", min: 0, max: 360, unidad: "°", def: def.giro })));
      if (fase === "bucle") {
        hijos.push(fila("Repetir", control(this.v, {
          tipo: "select", opciones: [["inf", "Para siempre"], [1, "1 vez"], [2, "2 veces"], [3, "3 veces"], [5, "5 veces"], [10, "10 veces"]],
          leer: () => this.E.el(e.id)?.anim?.bucle?.repetir ?? "inf",
          escribir: (x) => this.E.setEl(e.id, { "anim.bucle.repetir": x }, "Repetir"),
        })));
        hijos.push(fila("Ida y vuelta", c(base + "alterna", { tipo: "toggle" })));
      }
    }
    return seccion(titulo, hijos, { abierta: !nada || fase === "entrada" });
  }

  _animar(e) {
    this.cuerpo.append(el("div.ed-insp-cab", {}, [el("b.ed-tipo", { text: "✨" }), el("span", { text: e.nombre })]));
    this.cuerpo.append(el("div.ed-botonera", {}, [
      boton("▶ Probar", () => this.app.tiempo.probar([e.id]), "primario"),
      boton("⏱ Línea de tiempo", () => this.app.tiempo.alternar(true), "chico"),
    ]));
    this.cuerpo.append(this._faseAnim(e, "entrada", "Entrada · al llegar a la página"));
    this.cuerpo.append(this._faseAnim(e, "bucle", "Mientras está · se repite"));
    this.cuerpo.append(this._faseAnim(e, "salida", "Salida · al irse de la página"));
    this.cuerpo.append(this._propia(e));
    this.cuerpo.append(el("div.ed-botonera.ed-pie-insp", {}, [
      boton("Copiar a toda la página", () => {
        const anim = JSON.parse(JSON.stringify(this.E.el(e.id).anim));
        this.E.transaccion("Copiar animación", () => { for (const x of this.E.pagina.els) if (x.id !== e.id) this.E.setEl(x.id, { anim: { ...anim, propia: x.anim?.propia || null } }); });
        aviso("Animación copiada a todos 🤍");
      }, "chico"),
      boton("Quitar animaciones", () => this.E.setEl(e.id, { anim: { entrada: { tipo: "ninguna" }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null } }, "Quitar animaciones"), "chico peligro"),
    ]));
  }

  /** Animación propia: fotogramas a mano (x, y, escala, giro, opacidad, desenfoque). */
  _propia(e) {
    const pr = e.anim?.propia;
    const c = this._ctl(e);
    if (!pr) {
      return seccion("Animación propia", [
        el("p.ed-ayuda", { text: "Inventa tu animación con fotogramas: dónde está, qué tan grande, girada y transparente en cada momento." }),
        boton("＋ Crear animación propia", () => this.E.setEl(e.id, { "anim.propia": { dur: 1600, retraso: 0, repetir: "inf", direccion: "alternate", facil: "entraSale", fotogramas: [{ t: 0, x: 0, y: 0, escala: 1, rot: 0, opacidad: 1 }, { t: 1, x: 0, y: -16, escala: 1.05, rot: 4, opacidad: 1 }] } }, "Animación propia"), "chico"),
      ], { abierta: false });
    }
    const hijos = [
      el("div.ed-rejilla2", {}, [fila("Duración", c("anim.propia.dur", { min: 50, max: 30000, paso: 50, unidad: "ms" })), fila("Retraso", c("anim.propia.retraso", { min: 0, max: 30000, paso: 50, unidad: "ms" }))]),
      fila("Repetir", control(this.v, { tipo: "select", opciones: [["inf", "Para siempre"], [1, "1 vez"], [2, "2 veces"], [3, "3 veces"], [5, "5 veces"]], leer: () => this.E.el(e.id)?.anim?.propia?.repetir ?? 1, escribir: (x) => this.E.setEl(e.id, { "anim.propia.repetir": x }, "Repetir") })),
      fila("Sentido", c("anim.propia.direccion", { tipo: "select", opciones: [["normal", "Normal"], ["reverse", "Al revés"], ["alternate", "Ida y vuelta"], ["alternate-reverse", "Vuelta e ida"]], def: "normal" })),
      fila("Ritmo", c("anim.propia.facil", { tipo: "select", opciones: FACILES, def: "suave" })),
    ];
    if (pr.raw) {
      hijos.unshift(el("p.ed-nota", { text: `Animación original de la página${pr.nombre ? " («" + pr.nombre + "»)" : ""}: ${pr.raw.length} fotogramas. Puedes cambiar su duración, retraso, repeticiones y sentido.` }));
    } else {
      const fs = pr.fotogramas || [];
      const tabla = el("div.ed-fotogramas", {}, [
        el("div.ed-fg-cab", {}, ["%", "X", "Y", "Escala", "Giro", "Opac.", "Desenf.", ""].map((t) => el("span", { text: t }))),
        ...fs.map((f, i) => {
          const campo = (k, paso, min, max) => control(this.v, {
            tipo: "numero", paso, min, max,
            leer: () => { const x = this.E.el(e.id)?.anim?.propia?.fotogramas?.[i]; return x ? (k === "t" ? Math.round((x.t || 0) * 100) : x[k] ?? (k === "escala" || k === "opacidad" ? 1 : 0)) : 0; },
            escribir: (v) => this.E.setEl(e.id, { [`anim.propia.fotogramas.${i}.${k}`]: k === "t" ? Math.max(0, Math.min(1, v / 100)) : v }, "Fotograma", "fg" + i + k + e.id),
          });
          return el("div.ed-fg", {}, [campo("t", 1, 0, 100), campo("x", 1), campo("y", 1), campo("escala", 0.05, 0), campo("rot", 1), campo("opacidad", 0.05, 0, 1), campo("desenfoque", 0.5, 0),
            el("button.ed-quitar", { type: "button", html: "✕", title: "Quitar fotograma", disabled: fs.length <= 2 || null, onClick: () => this.E.setEl(e.id, { "anim.propia.fotogramas": fs.filter((_, j) => j !== i) }, "Quitar fotograma") })]);
        }),
      ]);
      hijos.unshift(tabla, boton("＋ Fotograma", () => {
        const lista = fs.map((f) => ({ ...f }));
        const u = lista[lista.length - 1] || { t: 0 };
        if (u.t >= 1) { lista.push({ ...u }); lista.forEach((f, j) => { f.t = Math.round((j / (lista.length - 1)) * 100) / 100; }); }
        else lista.push({ ...u, t: Math.min(1, Math.round(((u.t || 0) + 0.25) * 100) / 100) });
        this.E.setEl(e.id, { "anim.propia.fotogramas": lista }, "Añadir fotograma");
      }, "chico"));
    }
    hijos.push(boton("Quitar animación propia", () => this.E.setEl(e.id, { "anim.propia": null }, "Quitar animación propia"), "chico peligro"));
    return seccion("Animación propia", hijos);
  }

  _animarPagina(sel) {
    const E = this.E;
    const els = sel.length ? sel : E.pagina.els;
    this.cuerpo.append(el("div.ed-insp-cab", {}, [el("b.ed-tipo", { text: "✨" }), el("span", { text: sel.length ? `${sel.length} elementos` : "Toda la página" })]));
    this.cuerpo.append(el("div.ed-botonera", {}, [
      boton("▶ Probar la página", () => this.app.tiempo.probar(), "primario"),
      boton("⏱ Línea de tiempo", () => this.app.tiempo.alternar(true), "chico"),
    ]));
    const cascada = (tipo, dir) => E.transaccion("Entrada en cascada", () => {
      [...els].sort((a, b) => a.y - b.y || a.x - b.x).forEach((e, i) => E.setEl(e.id, { "anim.entrada": { tipo, dur: 800, retraso: i * 160, facil: "suave", dir: dir || "arriba", dist: 30 } }));
    });
    this.cuerpo.append(seccion("Aplicar a " + (sel.length ? "los elegidos" : "todo"), [
      el("p.ed-ayuda", { text: "Aparecen uno tras otro, de arriba hacia abajo." }),
      el("div.ed-botonera", {}, [
        boton("Aparecer", () => cascada("aparecer"), "chico"), boton("Deslizar ↑", () => cascada("deslizar", "arriba"), "chico"),
        boton("Crecer", () => cascada("zoom"), "chico"), boton("Desde borroso", () => cascada("desenfoque"), "chico"),
        boton("Rebote", () => cascada("rebote"), "chico"), boton("Latido", () => cascada("latido"), "chico"),
      ]),
      boton("Quitar todas las animaciones", () => E.transaccion("Quitar animaciones", () => { for (const e of els) E.setEl(e.id, { anim: { entrada: { tipo: "ninguna" }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null } }); }), "chico peligro"),
    ]));
    this.cuerpo.append(el("p.ed-nota.suave", { text: "Elige un elemento para darle su propia entrada, su bucle y su salida." }));
  }

  /* ── Capas ──────────────────────────────────────────────────────── */
  _capas() {
    const E = this.E;
    const els = [...E.pagina.els].reverse();
    if (!els.length) { this.cuerpo.append(el("p.ed-nota.suave", { text: "Esta página está vacía. Lo que añadas aparecerá aquí: lo de arriba de la lista se ve encima." })); return; }
    const lista = el("ol.ed-capas", {}, els.map((e) => el("li" + (E.sel.includes(e.id) ? ".on" : "") + (e.oculto ? ".oculto" : ""), { dataset: { id: e.id } }, [
      el("button.ed-asa", { type: "button", html: "☰", title: "Arrastra para cambiar el orden", "aria-label": "Ordenar" }),
      el("b", { text: TIPOS[e.tipo]?.icono || "•" }),
      el("span.ed-capa-nombre", { text: (e.grupo ? "⛓ " : "") + (e.inicioOculto ? "🙈 " : "") + e.nombre }),
      el("button.ed-capa-btn", { type: "button", html: e.oculto ? "🙈" : "👁", title: e.oculto ? "Mostrar" : "Ocultar", onClick: (ev) => { ev.stopPropagation(); E.setEl(e.id, { oculto: !e.oculto }, e.oculto ? "Mostrar" : "Ocultar"); } }),
      el("button.ed-capa-btn", { type: "button", html: e.bloqueado ? "🔒" : "🔓", title: e.bloqueado ? "Desbloquear" : "Bloquear", onClick: (ev) => { ev.stopPropagation(); E.setEl(e.id, { bloqueado: !e.bloqueado }, e.bloqueado ? "Desbloquear" : "Bloquear"); } }),
    ])));
    lista.addEventListener("click", (ev) => {
      const li = ev.target.closest("li");
      if (li && !ev.target.closest(".ed-asa")) E.seleccionar([li.dataset.id], ev.shiftKey || ev.metaKey || ev.ctrlKey);
    });
    lista.addEventListener("dblclick", (ev) => {
      const li = ev.target.closest("li");
      const s = ev.target.closest(".ed-capa-nombre");
      if (!li || !s) return;
      s.contentEditable = "true"; s.focus();
      getSelection().selectAllChildren(s);
      const fin = () => { s.contentEditable = "false"; const t = s.textContent.replace(/^(⛓ |🙈 )+/, "").trim(); if (t) E.setEl(li.dataset.id, { nombre: t }, "Renombrar"); };
      s.addEventListener("blur", fin, { once: true });
      s.addEventListener("keydown", (k) => { if (k.key === "Enter") { k.preventDefault(); s.blur(); } k.stopPropagation(); });
    });
    // La lista está al revés (arriba = delante).
    ordenable(lista, { item: "li", asa: ".ed-asa", alSoltar: (de, a) => { const n = els.length; E.moverCapa(els[de].id, n - 1 - a); } });
    this.cuerpo.append(el("p.ed-ayuda", { text: "Lo de arriba se ve delante. Arrastra ☰ para cambiar el orden; doble toque en el nombre para renombrar." }), lista);
  }
}
