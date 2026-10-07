/**
 * LOS PANELES DE LA BARRA LATERAL — uno por categoría del riel.
 *
 *   Elementos     formas, dibujos y adornos, dibujar a mano, marcos, tarjetas
 *   Texto         estilos de texto y letras
 *   Imágenes      subir fotos, tu biblioteca y las fotos del librito
 *   GIFs          GIPHY (empieza con «Dragon Ball»), con quitar fondo
 *   Stickers      GIPHY (empieza con «love») y los tuyos de assets/stickers/
 *   Vídeo         subir vídeos y los del librito
 *   Audio         pistas de la página (con su onda), MusicaDev y la música del librito
 *   Efectos       filtros con miniatura y previsualización, y efectos animados
 *   Animar        integradas, mías (CSS/JSON/JS) y de assets/animaciones, con prueba
 *   Transiciones  con miniatura y previsualización; propias y de assets/transiciones
 * (cada sección grande vive en components/secciones/)
 *   Interactivo   botones, álbumes, carruseles y qué pasa al tocar
 *   Piezas        los componentes HTML de assets/
 *   HTML          páginas HTML completas (en un solo bloque) y bloques
 *   3D            escenas WebGL2: figuras y modelos .glb, .gltf, .obj
 *   Tema          colores y letras del librito
 *   Herramientas  tamaño de hoja (o Automática), lienzo, capas, guardar…
 */
import { el, seccion, fila, boton, control, Vinculos, aviso, confirmar, formatoBytes, debounce } from "./ui.js";
import { leerRuta } from "../core/estado.js";
import { FORMATOS, assetsUsados } from "../core/modelo.js";
import { DIBUJOS, FORMAS } from "../assets/dibujos.js";
import { elegir } from "../assets/selector.js";
import { carpetasFotos } from "../assets/librito.js";
import { catalogo } from "../componentes/catalogo.js";
import { rutaAUrl } from "../assets/biblioteca.js";
import { borrarArchivo, espacio } from "../storage/db.js";
import { paletas } from "../../src/data/paletas.js";
import { mezclar } from "../../src/utils/color.js";
import { ico } from "./iconos.js";
import { DISPOSITIVOS } from "../canvas/lienzo.js";
import { ANIMAR } from "./secciones/animar.js";
import { EFECTOS_SEC } from "./secciones/efectos.js";
import { TRANSICIONES } from "./secciones/transiciones.js";
import { GIPHY } from "./secciones/giphy.js";
import { AUDIO } from "./secciones/audio.js";
import { HTML } from "./secciones/html.js";
import { FONDO_HTML } from "./secciones/fondo.js";
import { NAVEGACION } from "./secciones/navegacion.js";
import { BIBLIOTECA } from "./secciones/biblioteca.js";
import * as GIF from "../integraciones/giphy.js";

const RT = window.LibritoRT;
const FUENTES = Object.keys(RT.FUENTES).map((f) => [f, f]);
const I = (n, t) => `${ico(n)}<span>${t}</span>`;

export class Paneles {
  constructor(app) {
    this.app = app;
    this.E = app.estado;
    this.v = new Vinculos();
    const pronto = () => { if (this._r) return; this._r = requestAnimationFrame(() => { this._r = null; this.v.refrescar(); }); };
    this.E.on("proyecto", ({ ruta }) => { if (/musica\.asset|transicion\.(tipo|sonido)|formato/.test(ruta) && /audio|transiciones|herramientas/.test(this.actual)) this.rehacer(); else pronto(); });
    this.E.on("pagina", ({ ruta }) => { if (/^musica|^transicion/.test(ruta) && /audio|transiciones/.test(this.actual)) this.rehacer(); else pronto(); });
    this.E.on("actual", () => { if (/audio|transiciones|html|diseno/.test(this.actual)) this.rehacer(); });
    this.E.on("els", () => { if (/html|3d|video/.test(this.actual)) this.rehacer(); });
    this.E.on("sel", () => { if (/efectos|interactivo|animar/.test(this.actual)) this.rehacer(); });
    this.E.on("pagina", ({ ruta }) => { if (/^audios/.test(ruta || "") && this.actual === "audio") this.rehacer(); if (/^fondo/.test(ruta || "") && this.actual === "diseno") this.rehacer(); });
    this.E.on("assets", () => { if (/imagenes|video|3d/.test(this.actual)) this.rehacer(); });
  }

  get P() { return this.E.proyecto; }

  abrir(nombre, cont) {
    this.actual = nombre;
    this.cont = cont;
    this.rehacer();
  }

  rehacer() {
    const cont = this.cont;
    if (!cont || !this.P) return;
    this._limpiar?.();
    this._limpiar = null;
    const y = cont.scrollTop;
    this.v.vaciar();
    cont.textContent = "";
    this["_" + this.actual]?.(cont);
    this.v.refrescar();
    cont.scrollTop = y;
  }

  _proy() {
    const E = this.E;
    return (ruta, op = {}) => control(this.v, { ...op, leer: () => leerRuta(E.proyecto, ruta) ?? op.def, escribir: (x) => E.setProy({ [ruta]: x }, op.nombre || "Ajustes", ruta) });
  }

  _pag() {
    const E = this.E;
    return (ruta, op = {}) => control(this.v, { ...op, leer: () => leerRuta(E.pagina || {}, ruta) ?? op.def, escribir: (x) => E.setPag({ [ruta]: x }, op.nombre || "Página", ruta + E.paginaId) });
  }

  /* ── Piezas comunes ─────────────────────────────────────────────── */
  _pieza(icono, nombre, al, titulo) {
    return el("button.ed-pieza", { type: "button", title: titulo || nombre, onClick: al }, [el("b", { html: icono }), el("span", { text: nombre })]);
  }

  _iconoForma(id) {
    if (id === "rect") return '<i class="ed-ico-forma" style="border-radius:3px"></i>';
    if (id === "circulo") return '<i class="ed-ico-forma" style="border-radius:50%"></i>';
    if (id === "linea") return '<i class="ed-ico-forma" style="height:3px"></i>';
    return `<svg viewBox="0 0 100 100" width="26" height="26"><path d="${RT.FIGURAS[id]}" fill="currentColor"/></svg>`;
  }

  /** Para lo elegido: un aviso si no hay nada elegido. */
  _paraLoElegido(c, titulo, fn) {
    const sel = this.E.seleccionados;
    if (!sel.length) { c.append(seccion(titulo, [el("p.ed-nota.suave", { text: "Toca algo de la hoja para elegirlo y aquí aparecerán sus opciones." })])); return; }
    fn(sel);
  }

  /* ── Elementos ──────────────────────────────────────────────────── */
  _elementos(c) {
    const A = this.app.acciones;
    const pz = (...a) => this._pieza(...a);
    c.append(seccion("Formas", [el("div.ed-piezas.chicas", {}, FORMAS.map((f) => pz(this._iconoForma(f.id), f.n, () => A.forma(f.id))))]));
    const lapiz = { color: this.P.ajustes.tema.acento, grosor: 5 };
    const btnLapiz = boton(I("lapiz", "Dibujar a mano"), () => {
      const on = !this.app.lienzo.herramienta;
      this.app.lienzo.lapiz(on ? lapiz : null);
      btnLapiz.classList.toggle("on", on);
      opLapiz.hidden = !on;
      if (on) { aviso("Dibuja con el dedo o el ratón sobre la hoja"); this.app.alDibujar?.(); }
    });
    const opLapiz = el("div.ed-rejilla2", { hidden: "" }, [
      fila("Color", control(this.v, { tipo: "color", leer: () => lapiz.color, escribir: (x) => { lapiz.color = x; } })),
      fila("Grosor", control(this.v, { tipo: "rango", min: 1, max: 30, leer: () => lapiz.grosor, escribir: (x) => { lapiz.grosor = x; } })),
    ]);
    const adornos = el("div.ed-rejilla-assets.adornos");
    c.append(seccion("Dibujos y adornos", [
      el("div.ed-dibujos", {}, DIBUJOS.map((d) => el("button", { type: "button", title: d.n, html: d.svg, style: { color: this.P.ajustes.tema.acento }, onClick: () => A.dibujo(d.id) }))),
      adornos, btnLapiz, opLapiz,
    ]));
    catalogo().then((cat) => {
      for (const g of cat.categorias) for (const it of g.items) if (it.tipo === "imagen") adornos.append(el("button.ed-asset", { type: "button", title: `${it.nombre} · ${g.nombre}`, onClick: () => A.imagenCatalogo(it) }, [el("img", { src: rutaAUrl(it.ruta), loading: "lazy", decoding: "async", alt: "", draggable: "false" })]));
    });
    const marcos = [["polaroid", "Polaroid"], ["cinta", "Con cinta"], ["washi", "Washi"], ["vintage", "Vintage"], ["sello", "Sello"], ["doble", "Doble"]];
    c.append(seccion("Marcos", [
      el("div.ed-piezas", {}, [
        pz(ico("marco"), "Marco vacío", () => A.marcoFoto()),
        ...marcos.map(([m, n]) => pz(`<i class="ed-ico-marco m-${m}"></i>`, n, () => A.agregar("imagen", { nombre: "Marco " + n.toLowerCase(), imagen: { marco: m } }))),
      ]),
      el("small.ed-ayuda", { text: "Los marcos de assets/frames/ están en Piezas." }),
    ]));
    c.append(seccion("Tarjetas", [el("div.ed-piezas", {}, [
      pz(ico("nota"), "Nota adhesiva", () => A.tarjeta("nota")), pz(ico("tarjeta"), "Tarjeta", () => A.tarjeta("romantica")),
      pz(ico("boleto"), "Boleto", () => A.tarjeta("boleto")), pz(ico("polaroid"), "Polaroid con frase", () => A.tarjeta("polaroid")),
      pz(ico("sobre"), "Sobre", () => A.tarjeta("sobre")),
    ])]));
  }

  /* ── Texto ──────────────────────────────────────────────────────── */
  _texto(c) {
    const A = this.app.acciones;
    const t = this.P.ajustes.tema;
    const muestra = (estilo, html, css) => el("button.ed-texto-muestra", { type: "button", onClick: () => A.texto(estilo), style: css }, [el("span", { html })]);
    c.append(boton(I("mas", "Añadir un cuadro de texto"), () => A.texto("parrafo"), "primario ancho"));
    c.append(seccion("Estilos", [
      muestra("titulo", "Añade un título", { fontFamily: RT.pilaFuente(t.fuenteTitulos), fontSize: "28px", fontWeight: 600 }),
      muestra("subtitulo", "Añade un subtítulo", { fontFamily: RT.pilaFuente(t.fuente), fontSize: "20px", fontStyle: "italic" }),
      muestra("parrafo", "Un poquito de texto", { fontFamily: RT.pilaFuente("Jost"), fontSize: "15px" }),
      muestra("mano", "escrito a mano", { fontFamily: RT.pilaFuente("Caveat"), fontSize: "28px", color: t.acento }),
      muestra("cita", "«una frase bonita»", { fontFamily: RT.pilaFuente("Cormorant Garamond"), fontSize: "22px", fontStyle: "italic" }),
      muestra("etiqueta", "ETIQUETA", { fontFamily: RT.pilaFuente("Jost"), fontSize: "12px", letterSpacing: "3px", fontWeight: 500, color: t.acento }),
    ]));
    c.append(seccion("Letras", [
      el("div.ed-muestras", {}, Object.keys(RT.FUENTES).map((f) => el("span", { text: f, style: { fontFamily: RT.pilaFuente(f) } }))),
      el("small.ed-ayuda", { text: "Elige un texto en la hoja y cambia su letra desde la barra de herramientas (arriba en la computadora, abajo en el teléfono)." }),
    ], { abierta: false }));
    RT.cargarFuentes(Object.keys(RT.FUENTES));
  }

  /* ── Imágenes ───────────────────────────────────────────────────── */
  _imagenes(c) {
    const A = this.app.acciones;
    c.append(el("button.ed-subir", { type: "button", onClick: () => A.foto() }, [el("b", { html: ico("subir") }), el("span", { text: "Subir fotos" }), el("small", { text: "se optimizan solas · el editor nunca pone fotos por su cuenta" })]));
    c.append(el("div.ed-botonera", {}, [boton(I("marco", "Marco vacío"), () => A.marcoFoto(), "chico"), boton(I("album", "Álbum"), () => A.album(), "chico"), boton(I("carrusel", "Carrusel"), () => A.carrusel(), "chico")]));
    c.append(this._biblioteca());
  }
  _fotos(c) { this._imagenes(c); }

  /** Tus fotos: lo subido a este librito, con cuántas veces se usa. */
  _biblioteca() {
    const P = this.P;
    const A = this.app.acciones;
    const usados = assetsUsados(P);
    const fotos = Object.values(P.assets).filter((a) => a.tipo === "imagen").sort((a, b) => b.creado - a.creado);
    const rej = el("div.ed-rejilla-assets", {}, fotos.map((a) => el("button.ed-asset" + (usados.has(a.id) ? ".usado" : ""), { type: "button", title: `${a.nombre}${a.tam ? " · " + formatoBytes(a.tam) : ""}\nToca para ponerla en la página`, onClick: () => A._poner(A._elFoto(a.id)) }, [
      el("img", { src: this.app.bib.url(a.id) || "", loading: "lazy", decoding: "async", alt: "", draggable: "false" }),
      usados.has(a.id) ? null : el("i.ed-borrar-asset", { html: ico("cerrar"), title: "Quitar de la biblioteca", onClick: (e) => { e.stopPropagation(); this._quitarAsset(a); } }),
    ])));
    const libFotos = el("div");
    const d = el("details.ed-carpeta", {}, [el("summary", { text: "Fotos del librito de siempre" }), libFotos]);
    d.addEventListener("toggle", async () => {
      if (!d.open || libFotos.childElementCount) return;
      libFotos.textContent = "Buscando…";
      const cs = await carpetasFotos();
      libFotos.textContent = "";
      for (const cp of cs) {
        const r = el("div.ed-rejilla-assets");
        const sub = el("details.ed-carpeta", {}, [el("summary", { text: `${cp.nombre} · ${cp.fotos.length}` }), r]);
        sub.addEventListener("toggle", () => {
          if (!sub.open || r.childElementCount) return;
          for (const ruta of cp.fotos) r.append(el("button.ed-asset", { type: "button", title: "Toca para ponerla en la página", onClick: () => { const a = this.app.bib.delLibrito(ruta, "imagen", ruta.split("/").slice(-2).join(" · ")); A._poner(A._elFoto(a.id)); } }, [el("img", { src: rutaAUrl(ruta), loading: "lazy", decoding: "async", alt: "", draggable: "false" })]));
        });
        libFotos.append(sub);
      }
    });
    return seccion("Tu biblioteca", [fotos.length ? rej : el("p.ed-vacio-txt", { text: "Aquí aparecerán las fotos que subas." }), d]);
  }

  async _quitarAsset(a) {
    if (!(await confirmar(`¿Quitar «${a.nombre}» de la biblioteca de este librito?`, "Quitar"))) return;
    if (a.fuente === "local") borrarArchivo(a.id).catch(() => {});
    this.E.quitarAsset(a.id);
  }

  /* ── Vídeo ──────────────────────────────────────────────────────── */
  _video(c) {
    const A = this.app.acciones;
    const P = this.P;
    const usados = assetsUsados(P);
    c.append(el("button.ed-subir", { type: "button", onClick: () => A.video() }, [el("b", { html: ico("video") }), el("span", { text: "Añadir un vídeo" }), el("small", { text: "sube uno tuyo o elige uno del librito" })]));
    const vids = Object.values(P.assets).filter((a) => a.tipo === "video").sort((a, b) => b.creado - a.creado);
    const lista = el("div.ed-rejilla-assets.lista", {}, vids.map((a) => el("div.ed-asset", {}, [
      el("b", { html: ico("video") }), el("span", { text: a.nombre }),
      el("small", { text: usados.has(a.id) ? "en uso" : a.tam ? formatoBytes(a.tam) : "" }),
      el("button.ed-btn.chico", { type: "button", html: I("mas", "Poner"), onClick: () => A.videoDe(a.id) }),
      usados.has(a.id) ? null : el("button.ed-quitar", { type: "button", html: ico("cerrar"), title: "Quitar", onClick: () => this._quitarAsset(a) }),
    ])));
    c.append(seccion("Tus vídeos", [vids.length ? lista : el("p.ed-vacio-txt", { text: "Todavía no hay vídeos en este librito." })]));
    c.append(seccion("Cómo se reproducen", [
      el("p.ed-ayuda", { text: "Elige el vídeo en la hoja para decidir si empieza solo, si se repite, si va sin sonido y si se ven sus controles. En la línea de tiempo puedes decidir en qué momento aparece (y empieza)." }),
    ], { abierta: false }));
  }

  /** Un botoncito para escuchar (sólo suena cuando se pide y para a los demás). */
  _botonEscuchar(url) {
    const b = el("button.ed-play", { type: "button", html: ico("play"), title: "Escuchar", "aria-label": "Escuchar" });
    b.addEventListener("click", () => {
      const AU = this.app.audio;
      const u = url();
      if (!AU || !u) return;
      document.querySelectorAll(".ed-play.on").forEach((x) => { x.classList.remove("on"); x.innerHTML = ico("play"); });
      const suena = AU.escuchar(u, () => { b.classList.remove("on"); b.innerHTML = ico("play"); });
      b.classList.toggle("on", suena);
      b.innerHTML = ico(suena ? "parar" : "play");
    });
    return b;
  }

  /* ── Tema ───────────────────────────────────────────────────────── */
  _diseno(c) {
    const p = this._proy();
    const E = this.E;
    const t = () => this.P.ajustes.tema;
    const aplicarFondo = () => E.transaccion("Fondo a todas", () => { for (const pid of this.P.orden) E.setPag({ fondo: { tipo: "color", color: t().fondo } }, "Fondo", null, pid); });
    const aplicarLetras = () => E.transaccion("Letra a todos", () => {
      for (const pid of this.P.orden) for (const x of this.P.paginas[pid].els) if (x.tipo === "texto") E.setEl(x.id, { "texto.fuente": x.texto.tam >= 32 ? t().fuenteTitulos : t().fuente }, "Letra", null, pid);
      RT.cargarFuentes([t().fuente, t().fuenteTitulos]);
    });
    const temas = Object.entries(paletas).flatMap(([nombre, q]) => [
      { n: nombre, fondo: mezclar(q.a, "#ffffff", 0.84), texto: q.deep, acento: q.b },
      { n: nombre + " · noche", fondo: q.deep, texto: mezclar(q.a, "#ffffff", 0.55), acento: q.a },
    ]);
    const rej = el("div.ed-paletas", {}, temas.map((x) => el("button", { type: "button", title: x.n, style: { background: x.fondo }, onClick: () => E.setProy({ "ajustes.tema.fondo": x.fondo, "ajustes.tema.texto": x.texto, "ajustes.tema.acento": x.acento }, "Tema") }, [el("i", { style: { background: x.acento } }), el("i", { style: { background: x.texto } })])));
    c.append(seccion("Colores del librito", [
      el("p.ed-ayuda", { text: "Lo nuevo que añadas usa estos colores. Las paletas son las mismas del libro." }),
      rej,
      fila("Fondo", p("ajustes.tema.fondo", { tipo: "color" })),
      fila("Texto", p("ajustes.tema.texto", { tipo: "color" })),
      fila("Acento", p("ajustes.tema.acento", { tipo: "color" })),
      boton("Poner este fondo en todas las páginas", aplicarFondo, "chico"),
    ]));
    c.append(seccion("Letras", [
      fila("Títulos", p("ajustes.tema.fuenteTitulos", { tipo: "select", opciones: FUENTES })),
      fila("Textos", p("ajustes.tema.fuente", { tipo: "select", opciones: FUENTES })),
      el("div.ed-muestras", {}, ["Cormorant Garamond", "Caveat", "Jost", "Playfair Display", "Dancing Script", "Great Vibes", "Quicksand"].map((f) => el("span", { text: f, style: { fontFamily: RT.pilaFuente(f) } }))),
      boton("Usar estas letras en todos los textos", aplicarLetras, "chico"),
    ]));
    c.append(seccion("Esta página", [
      el("p.ed-ayuda", { text: "El fondo de la página (color, degradado o foto) se cambia en el inspector, sin nada elegido." }),
      boton(I("diseno", "Fondo de esta página"), () => { E.seleccionar([]); this.app.insp.abrir("diseno"); }, "chico"),
    ]));
    this._fondoHtml(c);
    RT.cargarFuentes(["Playfair Display", "Dancing Script", "Great Vibes", "Quicksand"]);
  }

  _sonidoFila(leer, escribir, etiqueta) {
    const nombre = () => { const id = leer(); return id ? this.P.assets[id]?.nombre || "sonido" : "ninguno"; };
    const b = boton(I("sonido", nombre()), async () => { const [id] = await elegir(this.app, "audio", { titulo: etiqueta }); if (id) escribir(id); }, "chico");
    this.v.add(() => { b.innerHTML = I("sonido", nombre()); });
    return fila(etiqueta, el("div.ed-botonera", {}, [b, boton(ico("play"), () => { const id = leer(); if (id) RT.sonar(this.app.bib.url(id)); }, "chico ico", "Escuchar"), boton(ico("cerrar"), () => escribir(null), "chico ico", "Quitar")]));
  }

  _transPropia(ctl, base) {
    return [
      el("small.ed-ayuda", { text: "Cómo entra la página nueva (la que se va hace lo contrario):" }),
      el("div.ed-rejilla2", {}, [
        fila("Mover a lo ancho", ctl(base + ".x", { min: -120, max: 120, unidad: "%", def: 30 })),
        fila("Mover a lo alto", ctl(base + ".y", { min: -120, max: 120, unidad: "%", def: 0 })),
        fila("Escala", ctl(base + ".escala", { min: 0, max: 2, paso: 0.05, def: 0.95 })),
        fila("Giro", ctl(base + ".rot", { min: -180, max: 180, unidad: "°", def: 0 })),
        fila("Opacidad", ctl(base + ".opacidad", { min: 0, max: 1, paso: 0.05, def: 0 })),
        fila("Desenfoque", ctl(base + ".desenfoque", { min: 0, max: 40, unidad: "px", def: 0 })),
      ]),
    ];
  }

  /* ── Interactivo ────────────────────────────────────────────────── */
  _interactivo(c) {
    const A = this.app.acciones;
    const pz = (...a) => this._pieza(...a);
    c.append(seccion("Añadir", [el("div.ed-piezas", {}, [
      pz(ico("boton"), "Botón", () => A.boton()), pz(ico("album"), "Álbum", () => A.album()), pz(ico("carrusel"), "Carrusel", () => A.carrusel()),
      pz(ico("video"), "Vídeo", () => A.video(), "Sube un vídeo tuyo"), pz(ico("html"), "HTML", () => A.html(), "Un bloque de HTML propio, aislado"),
      pz(ico("pagina"), "Página original", () => this.app.importar.misPaginas(), "Una de tus páginas HTML del librito"),
      pz(ico("componentes"), "Piezas", () => this.app.abrirSeccion("componentes"), "Componentes de assets/"),
      pz(ico("cubo"), "Escena 3D", () => this.app.abrirSeccion("3d")),
    ])]));
    this._paraLoElegido(c, "Lo elegido", (sel) => {
      const ins = this.app.insp;
      c.append(seccion(sel.length === 1 ? "«" + sel[0].nombre + "»" : `${sel.length} elementos`, [el("div.ed-piezas", {}, [
        pz(ico("toque"), "Al tocarlo…", () => ins.abrir("diseno", "Al tocarlo")),
        pz(ico("sonido"), "Sonidos", () => ins.abrir("diseno", "Sonidos")),
        pz(ico("ojoNo"), "Empieza escondido", () => ins.abrir("diseno", "Visibilidad")),
        pz(ico("mano"), "Permisos", () => ins.abrir("diseno", "Permisos")),
        pz(ico("tiempo"), "Cuándo aparece", () => this.app.tiempo.alternar(true)),
      ])]));
    });
    c.append(seccion("Sorpresas", [el("p.ed-ayuda", { text: "Pon un elemento con «Empieza escondido» y a otro (un botón, una foto…) dale «Al tocarlo → Mostrar…»: en el librito aparece con su animación de entrada cuando ella lo toque." })], { abierta: false }));
  }

  /* ── 3D (WebGL2) ────────────────────────────────────────────────── */
  _3d(c) {
    const A = this.app.acciones;
    if (!RT.hayWebGL2?.()) c.append(el("p.ed-nota", { html: `${ico("aviso")} Este navegador no tiene WebGL2: las escenas 3D no se verán aquí (en otros aparatos sí).` }));
    c.append(seccion("Figuras", [
      el("div.ed-piezas", {}, Object.entries(RT.FIGURAS3D || {}).map(([k, n]) => this._pieza(ico(k === "esfera" ? "esfera" : k === "corazon" ? "corazon" : k === "estrella" ? "estrella" : "cubo"), n, () => A.escena3d({ figura: k })))),
      el("small.ed-ayuda", { text: "Con su material, su luz y una cámara que se gira con el dedo (en el librito) y se acerca con dos." }),
    ]));
    const mios = Object.values(this.P.assets).filter((a) => a.tipo === "modelo");
    const cat = el("div.ed-rejilla-assets.lista");
    c.append(seccion("Modelos", [
      el("button.ed-subir", { type: "button", onClick: () => A.modelo3d() }, [el("b", { html: ico("cubo") }), el("span", { text: "Subir un modelo 3D" }), el("small", { text: ".glb, .gltf (con todo dentro) u .obj · con sus colores y animaciones" })]),
      mios.length ? el("div.ed-rejilla-assets.lista", {}, mios.map((a) => el("div.ed-asset", {}, [el("b", { html: ico("cubo") }), el("span", { text: a.nombre }), el("small", { text: formatoBytes(a.tam) }), el("button.ed-btn.chico", { type: "button", html: I("mas", "Poner"), onClick: () => A.escena3d({ fuente: "archivo", asset: a.id, formato: (a.archivo || "").split(".").pop() }) })]))) : null,
      cat,
    ].filter(Boolean)));
    catalogo().then((k) => {
      for (const g of k.categorias) for (const it of g.items) if (it.tipo === "modelo") cat.append(el("div.ed-asset", {}, [el("b", { html: ico("cubo") }), el("span", { text: `${it.nombre} · ${g.nombre.toLowerCase()}` }), el("button.ed-btn.chico", { type: "button", html: I("mas", "Poner"), onClick: () => { const a = this.app.bib.delLibrito(it.ruta, "modelo", it.nombre, { tam: it.peso }); A.escena3d({ fuente: "archivo", asset: a.id, formato: it.ruta.split(".").pop() }); } })]));
    });
    c.append(seccion("Más sobre 3D", [el("p.ed-ayuda", { text: "Deja modelos en assets/3d/ y aparecen aquí solos. Para escenas 3D más grandes (con tu propio código de three.js o WebGL2), pega su página completa en HTML: corre aislada dentro del librito." })], { abierta: false }));
  }

  /* ── Herramientas ───────────────────────────────────────────────── */
  _herramientas(c) {
    const p = this._proy();
    const E = this.E;
    const app = this.app;
    const auto = this.P.ajustes.formato === "auto";
    const formatos = Object.entries(FORMATOS).map(([k, f]) => [k, f.auto ? f.n : `${f.n} · ${f.w}×${f.h}`]);
    c.append(seccion("La hoja", [
      fila("Nombre", p("nombre", { tipo: "texto", alcambiar: true, nombre: "Nombre" })),
      fila("Tamaño", control(this.v, {
        tipo: "select", opciones: [...formatos, ["propio", "A mi medida…"]],
        leer: () => this.P.ajustes.formato,
        escribir: (k) => {
          if (k === "propio") { E.setProy({ "ajustes.formato": "propio" }, "Tamaño"); this.rehacer(); return; }
          app.cambiarTamano(FORMATOS[k].w, FORMATOS[k].h, k);
        },
      })),
      auto ? el("p.ed-nota", { text: `Automática: la zona segura es de ${this.P.ajustes.ancho}×${this.P.ajustes.alto} y en cada pantalla la hoja crece por un lado; cada cosa se queda pegada a su borde (elígelo en el inspector → Posición → Ancla). Nada se corta.` }) : null,
      auto ? fila("Ver como", control(this.v, { tipo: "select", opciones: Object.entries(DISPOSITIVOS).map(([k, d]) => [k, d.n + (d.w ? ` · ${d.w}×${d.h}` : "")]), leer: () => app.lienzo.ver, escribir: (k) => app.lienzo.verComo(k) })) : null,
      this.P.ajustes.formato === "propio" ? el("div.ed-rejilla2", {}, [
        fila("Ancho", control(this.v, { tipo: "numero", min: 200, max: 2000, leer: () => this.P.ajustes.ancho, escribir: (w) => { if (w >= 200) app.cambiarTamano(w, this.P.ajustes.alto, "propio"); } })),
        fila("Alto", control(this.v, { tipo: "numero", min: 200, max: 3000, leer: () => this.P.ajustes.alto, escribir: (h) => { if (h >= 200) app.cambiarTamano(this.P.ajustes.ancho, h, "propio"); } })),
      ]) : null,
      fila("Portada", control(this.v, {
        tipo: "select", opciones: this.P.orden.map((pid, i) => [pid, `${i + 1}. ${this.P.paginas[pid].nombre}`]),
        leer: () => this.P.ajustes.portada || this.P.orden[0],
        escribir: (pid) => app.acciones.ponerPortada(pid),
      }), "la primera hoja que se ve"),
    ].filter(Boolean)));
    c.append(seccion("Ver y ordenar", [el("div.ed-piezas", {}, [
      this._pieza(ico("capas"), "Capas", () => app.insp.abrir("capas")),
      this._pieza(ico("tiempo"), "Línea de tiempo", () => app.tiempo.alternar(true)),
      this._pieza(ico("ajustar"), "Ver la hoja entera", () => { app.lienzo.ajustar(); app.lateral?.cerrar(); }),
      this._pieza(ico("recuperar"), "Traer lo perdido", () => { const ids = (E.pagina?.els || []).map((x) => x.id); app.lienzo.traerALaHoja(ids); }, "Mete en la hoja todo lo que se salió"),
      this._pieza(ico("play"), "Vista previa", () => app.vista.abrir(Math.max(0, this.P.orden.indexOf(E.paginaId)))),
    ])]));
    c.append(seccion("Lienzo", [
      fila("Imán", p("editor.iman", { tipo: "toggle", nombre: "Imán" }), "se pega a bordes, centros y guías"),
      fila("Cuadrícula", p("editor.cuadricula", { tipo: "toggle", nombre: "Cuadrícula" })),
      fila("Paso", p("editor.paso", { tipo: "rango", min: 4, max: 50, unidad: "px", nombre: "Cuadrícula" })),
      fila("Reglas", p("editor.reglas", { tipo: "toggle", nombre: "Reglas" }), "arrastra desde ellas para poner guías (en la computadora)"),
      fila("Márgenes seguros", p("editor.margenes", { tipo: "toggle", nombre: "Márgenes" })),
      fila("Margen", p("editor.margen", { tipo: "rango", min: 0, max: 80, unidad: "px", nombre: "Margen" })),
      (this.P.editor.guias || []).length ? boton("Quitar todas las guías", () => E.setProy({ "editor.guias": [] }, "Quitar guías"), "chico") : null,
    ].filter(Boolean), { abierta: false }));
    this._navegacion(c);
    c.append(seccion("Cómo se lee", [
      fila("Flechas", p("ajustes.reproduccion.flechas", { tipo: "toggle" })),
      fila("Pasar deslizando", p("ajustes.reproduccion.deslizar", { tipo: "toggle" })),
      fila("Barrita de progreso", p("ajustes.reproduccion.progreso", { tipo: "toggle" })),
      fila("Índice", p("ajustes.reproduccion.indice", { tipo: "toggle" })),
      fila("«Toca para abrir»", p("ajustes.reproduccion.tocarParaEmpezar", { tipo: "toggle" })),
      fila("Al terminar", p("ajustes.reproduccion.alFinal", { tipo: "segmento", opciones: [["quedarse", "Quedarse"], ["portada", "Volver a empezar"]] })),
      fila("Pasar solas", p("ajustes.reproduccion.autoAvance", { tipo: "rango", min: 0, max: 30, unidad: " s" }), "0 = sólo cuando ella pase la hoja"),
    ], { abierta: false }));
    const SE = app.sonidos;
    if (SE) c.append(seccion("Sonidos del editor", [
      fila("Encendidos", control(this.v, { tipo: "toggle", leer: () => SE.pref.on, escribir: (on) => SE.ponerPref({ on }) })),
      fila("Volumen", control(this.v, { tipo: "rango", min: 0, max: 1, paso: 0.05, leer: () => SE.pref.vol, escribir: (vol) => SE.ponerPref({ vol }) })),
      fila("A la vez, como mucho", control(this.v, { tipo: "segmento", opciones: [[1, "1"], [2, "2"], [3, "3"], [5, "5"]], leer: () => SE.pref.max, escribir: (max) => SE.ponerPref({ max }) })),
      el("div.ed-botonera", {}, ["botones", "seleccionar", "abrir", "guardar", "exito"].map((m) => boton(m, () => SE.sonar(m), "chico"))),
      el("small.ed-ayuda", { text: SE.hay ? `Suenan al azar los de assets/sonidos-editor/ (${SE.momentos.length} momentos). Pon los tuyos en esas carpetas.` : "Deja sonidos en assets/sonidos-editor/<momento>/ (botones, seleccionar, abrir, cerrar, guardar…)." }),
    ], { abierta: false }));
    const giphy = el("div.ed-botonera");
    const pintarGiphy = async () => {
      const k = await GIF.como();
      giphy.textContent = "";
      giphy.append(el("small.ed-ayuda", { text: k === "proxy" ? "Conectado por tu proxy (la clave no está en el navegador)." : k === "local" ? "Conectado por el servidor local (la clave no sale de tu computadora)." : k === "clave" ? `Conectado con tu clave (guardada sólo en este aparato) · ${GIF.USUARIO}` : "Sin conectar: ábrelo en GIFs o Stickers." }));
      if (k === "clave" || k === "proxy") giphy.append(boton(I("borrar", "Olvidar la clave"), () => { GIF.olvidar(); pintarGiphy(); aviso("GIPHY desconectado en este aparato"); }, "chico"));
    };
    pintarGiphy();
    c.append(seccion("GIPHY", [giphy], { abierta: false }));
    const usados = assetsUsados(this.P);
    c.append(seccion("Guardar y exportar", [
      fila("Guardar solo", control(this.v, { tipo: "toggle", leer: () => app.auto.activo, escribir: (on) => app.auto.ponerActivo(on) }), "apagado: sólo se guarda al pedirlo y al salir pregunta"),
      el("p.ed-ayuda", { text: "Se guarda solo mientras editas (en este navegador). Para llevártelo, exporta el .zip: trae sólo lo que de verdad se usa." }),
      el("div.ed-botonera", {}, [
        boton(I("exportar", "Exportar ZIP"), () => app.exportar(), "primario"),
        boton(I("guardar", "Guardar ya"), () => app.guardarYa(), "chico"),
      ]),
      el("small.ed-ayuda", { text: `${this.P.orden.length} páginas · ${usados.size} archivos en uso de ${Object.keys(this.P.assets).length} en la biblioteca` }),
    ]));
    const esp = el("small.ed-ayuda");
    espacio().then((e) => { if (e) esp.textContent = `Espacio usado por el navegador: ${formatoBytes(e.usage)} de ${formatoBytes(e.quota)}`; });
    c.append(seccion("Borradores", [
      el("div.ed-botonera", {}, [
        boton(I("carpeta", "Abrir otro"), () => app.inicio(), "chico"),
        boton(I("nuevo", "Empezar uno nuevo"), () => app.nuevo(), "chico"),
        boton(I("duplicar", "Duplicar este"), () => app.duplicarProyecto(), "chico"),
        boton(I("subir", "Abrir archivo (.zip / .json)"), () => app.abrirArchivo(), "chico"),
      ]),
      boton(I("borrar", "Borrar este borrador"), async () => { if (await confirmar(`Se borrará «${this.P.nombre}» de este navegador, con sus fotos subidas. Si no lo exportaste, se pierde.`, "Borrar borrador")) app.borrarProyecto(); }, "chico peligro"),
      esp,
    ], { abierta: false }));
  }
  _ajustes(c) { this._herramientas(c); }
}

// Las secciones grandes viven cada una en su archivo (components/secciones/).
Object.assign(Paneles.prototype, ANIMAR, EFECTOS_SEC, TRANSICIONES, GIPHY, AUDIO, HTML, FONDO_HTML, NAVEGACION, BIBLIOTECA);
