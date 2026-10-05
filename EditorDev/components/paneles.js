/**
 * LOS PANELES DE LA IZQUIERDA (en el teléfono, las hojas de abajo).
 *
 *   🧩 Añadir       texto, fotos, álbum, carrusel, formas, dibujos, botón,
 *                   vídeo, HTML y tu biblioteca de archivos
 *   🎨 Diseño       tema del librito: colores, letras y paletas
 *   🎞️ Transiciones entre páginas: la de todo el librito y la de ésta
 *   🎵 Música       la del librito, la de esta página y tus canciones
 *   </> HTML        bloques de HTML propio, aislados
 *   ⚙️ Ajustes      nombre, tamaño, portada, reproducción, exportar, borradores
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

const RT = window.LibritoRT;
const FUENTES = Object.keys(RT.FUENTES).map((f) => [f, f]);

export class Paneles {
  constructor(app) {
    this.app = app;
    this.E = app.estado;
    this.v = new Vinculos();
    const pronto = () => { if (this._r) return; this._r = requestAnimationFrame(() => { this._r = null; this.v.refrescar(); }); };
    this.E.on("proyecto", ({ ruta }) => { if (/musica\.asset|transicion\.(tipo|sonido)|formato/.test(ruta) && /audio|transiciones|ajustes/.test(this.actual)) this.rehacer(); else pronto(); });
    this.E.on("pagina", ({ ruta }) => { if (/^musica|^transicion/.test(ruta) && /audio|transiciones/.test(this.actual)) this.rehacer(); else pronto(); });
    this.E.on("actual", () => { if (/audio|transiciones|html/.test(this.actual)) this.rehacer(); });
    this.E.on("els", () => { if (this.actual === "html") this.rehacer(); });
    this.E.on("assets", () => { if (/fotos/.test(this.actual)) this.rehacer(); });
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

  /* ── Piezas comunes de los paneles ──────────────────────────────── */
  _pieza(icono, nombre, al, titulo) {
    return el("button.ed-pieza", { type: "button", title: titulo || nombre, onClick: al }, [el("b", { html: icono }), el("span", { text: nombre })]);
  }

  _iconoForma(id) {
    if (id === "rect") return '<i class="ed-ico-forma" style="border-radius:3px"></i>';
    if (id === "circulo") return '<i class="ed-ico-forma" style="border-radius:50%"></i>';
    if (id === "linea") return '<i class="ed-ico-forma" style="height:3px"></i>';
    return `<svg viewBox="0 0 100 100" width="26" height="26"><path d="${RT.FIGURAS[id]}" fill="currentColor"/></svg>`;
  }

  /* ── ✿ Elementos ────────────────────────────────────────────────── */
  _elementos(c) {
    const A = this.app.acciones;
    const pz = (...a) => this._pieza(...a);
    c.append(seccion("Formas", [el("div.ed-piezas.chicas", {}, FORMAS.map((f) => pz(this._iconoForma(f.id), f.n, () => A.forma(f.id))))]));
    const lapiz = { color: this.P.ajustes.tema.acento, grosor: 5 };
    const btnLapiz = boton("✏️ Dibujar a mano", () => {
      const on = !this.app.lienzo.herramienta;
      this.app.lienzo.lapiz(on ? lapiz : null);
      btnLapiz.classList.toggle("on", on);
      opLapiz.hidden = !on;
      if (on) { aviso("Dibuja con el dedo o el ratón sobre la hoja ✏️"); this.app.alDibujar?.(); }
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
      for (const g of cat.categorias) for (const it of g.items) if (it.tipo === "imagen") adornos.append(el("button.ed-asset", { type: "button", title: `${it.nombre} · ${g.nombre}`, onClick: () => A.imagenCatalogo(it) }, [el("img", { src: rutaAUrl(it.ruta), loading: "lazy", decoding: "async", alt: "" })]));
    });
    const marcos = [["polaroid", "Polaroid"], ["cinta", "Con cinta"], ["washi", "Washi"], ["vintage", "Vintage"], ["sello", "Sello"], ["doble", "Doble"]];
    c.append(seccion("Marcos", [
      el("div.ed-piezas", {}, [
        pz("▢", "Marco vacío", () => A.marcoFoto()),
        ...marcos.map(([m, n]) => pz(`<i class="ed-ico-marco m-${m}"></i>`, n, () => A.agregar("imagen", { nombre: "Marco " + n.toLowerCase(), imagen: { marco: m } }))),
      ]),
      el("small.ed-ayuda", { text: "Los marcos de assets/frames/ están en 🧩 Componentes." }),
    ]));
    c.append(seccion("Tarjetas", [el("div.ed-piezas", {}, [
      pz("🗒", "Nota adhesiva", () => A.tarjeta("nota")), pz("💌", "Tarjeta", () => A.tarjeta("romantica")),
      pz("🎟", "Boleto", () => A.tarjeta("boleto")), pz("📷", "Polaroid con frase", () => A.tarjeta("polaroid")),
      pz("✉️", "Sobre", () => A.tarjeta("sobre")),
    ])]));
    c.append(seccion("Interactivos", [el("div.ed-piezas", {}, [
      pz("⏺", "Botón", () => A.boton()), pz("📸", "Álbum", () => A.album()), pz("🎞️", "Carrusel", () => A.carrusel()),
      pz("▶", "Vídeo", () => A.video(), "Sube un vídeo tuyo"), pz("&lt;/&gt;", "HTML", () => A.html(), "Un bloque de HTML propio, aislado"),
      pz("📄", "Página original", () => this.app.importar.misPaginas(), "Una de tus páginas HTML del librito"),
    ])]));
  }

  /* ── T Texto ────────────────────────────────────────────────────── */
  _texto(c) {
    const A = this.app.acciones;
    const t = this.P.ajustes.tema;
    const muestra = (estilo, html, css) => el("button.ed-texto-muestra", { type: "button", onClick: () => A.texto(estilo), style: css }, [el("span", { html })]);
    c.append(boton("＋ Añadir un cuadro de texto", () => A.texto("parrafo"), "primario ancho"));
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
      el("small.ed-ayuda", { text: "Elige un texto en la hoja y cambia su letra desde la barra de arriba (o abajo, en el teléfono)." }),
    ], { abierta: false }));
    RT.cargarFuentes(Object.keys(RT.FUENTES));
  }

  /* ── 🖼 Fotos ───────────────────────────────────────────────────── */
  _fotos(c) {
    const A = this.app.acciones;
    c.append(el("button.ed-subir", { type: "button", onClick: () => A.foto() }, [el("b", { text: "＋" }), el("span", { text: "Subir fotos" }), el("small", { text: "se optimizan solas · el editor nunca pone fotos por su cuenta" })]));
    c.append(el("div.ed-botonera", {}, [boton("▢ Marco vacío", () => A.marcoFoto(), "chico"), boton("📸 Álbum", () => A.album(), "chico"), boton("🎞️ Carrusel", () => A.carrusel(), "chico"), boton("▶ Vídeo", () => A.video(), "chico")]));
    c.append(this._biblioteca());
  }

  /** Tus archivos: lo subido a este librito, con cuántas veces se usa. */
  _biblioteca() {
    const P = this.P;
    const A = this.app.acciones;
    const usados = assetsUsados(P);
    const todos = Object.values(P.assets).sort((a, b) => b.creado - a.creado);
    const fotos = todos.filter((a) => a.tipo === "imagen");
    const otros = todos.filter((a) => a.tipo === "video");
    const rej = el("div.ed-rejilla-assets", {}, fotos.map((a) => el("button.ed-asset" + (usados.has(a.id) ? ".usado" : ""), { type: "button", title: `${a.nombre}${a.tam ? " · " + formatoBytes(a.tam) : ""}\nToca para ponerla en la página`, onClick: () => A._poner(A._elFoto(a.id)) }, [
      el("img", { src: this.app.bib.url(a.id) || "", loading: "lazy", decoding: "async", alt: "" }),
      usados.has(a.id) ? null : el("i.ed-borrar-asset", { html: "✕", title: "Quitar de la biblioteca", onClick: (e) => { e.stopPropagation(); this._quitarAsset(a); } }),
    ])));
    const lista = el("div.ed-rejilla-assets.lista", {}, otros.map((a) => el("div.ed-asset", {}, [
      el("b", { text: "▶" }), el("span", { text: a.nombre }), el("small", { text: usados.has(a.id) ? "en uso" : a.tam ? formatoBytes(a.tam) : "" }),
      usados.has(a.id) ? null : el("button.ed-quitar", { type: "button", html: "✕", title: "Quitar", onClick: () => this._quitarAsset(a) }),
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
          for (const ruta of cp.fotos) r.append(el("button.ed-asset", { type: "button", title: "Toca para ponerla en la página", onClick: () => { const a = this.app.bib.delLibrito(ruta, "imagen", ruta.split("/").slice(-2).join(" · ")); A._poner(A._elFoto(a.id)); } }, [el("img", { src: rutaAUrl(ruta), loading: "lazy", decoding: "async", alt: "" })]));
        });
        libFotos.append(sub);
      }
    });
    return seccion("Tu biblioteca", [
      fotos.length ? rej : el("p.ed-vacio-txt", { text: "Aquí aparecerán las fotos que subas." }),
      otros.length ? lista : null,
      d,
    ].filter(Boolean));
  }

  async _quitarAsset(a) {
    if (!(await confirmar(`¿Quitar «${a.nombre}» de la biblioteca de este librito?`, "Quitar"))) return;
    if (a.fuente === "local") borrarArchivo(a.id).catch(() => {});
    this.E.quitarAsset(a.id);
  }

  /* ── 🧩 Componentes (assets/) ───────────────────────────────────── */
  _componentes(c) {
    const A = this.app.acciones;
    const buscar = el("input.ed-txt.ed-buscar", { type: "search", placeholder: "Buscar componentes…" });
    const lista = el("div");
    c.append(buscar, lista);
    const vivas = new IntersectionObserver((xs) => {
      for (const x of xs) {
        if (!x.isIntersecting) continue;
        vivas.unobserve(x.target);
        const it = x.target._it;
        const W = it.ancho || 360, H = it.alto || 360;
        const k = Math.min(132 / W, 96 / H);
        const f = el("iframe.ed-comp-vivo", { src: rutaAUrl(it.ruta + (it.entrada || "index.html")), title: it.nombre, tabindex: "-1", loading: "lazy", style: { width: W + "px", height: H + "px", transform: `scale(${k})`, marginLeft: -(W * k) / 2 + "px", marginTop: -(H * k) / 2 + "px" } });
        x.target.append(f);
      }
    }, { root: c, rootMargin: "80px" });
    this._limpiar = () => vivas.disconnect();
    catalogo().then((cat) => {
      const pintar = () => {
        const q = buscar.value.trim().toLowerCase();
        lista.textContent = "";
        let hay = 0;
        for (const g of cat.categorias) {
          const items = g.items.filter((it) => it.tipo === "componente" && (!q || (it.nombre + " " + it.descripcion + " " + g.nombre).toLowerCase().includes(q)));
          if (!items.length) continue;
          hay += items.length;
          lista.append(seccion(g.nombre, [el("div.ed-comps", {}, items.map((it) => {
            const prev = el("div.ed-comp-prev");
            if (it.miniatura) prev.append(el("img", { src: rutaAUrl(it.miniatura), alt: "", loading: "lazy" }));
            else { prev._it = it; vivas.observe(prev); }
            return el("button.ed-comp", { type: "button", title: it.descripcion || it.nombre, onClick: () => A.componente(it) }, [prev, el("b", { text: it.nombre }), it.parametros?.length ? el("small", { text: "se puede personalizar" }) : null].filter(Boolean));
          }))]));
        }
        if (!hay) lista.append(el("p.ed-vacio-txt", { text: q ? "Nada con ese nombre." : "Todavía no hay componentes en assets/." }));
      };
      buscar.addEventListener("input", debounce(pintar, 200));
      pintar();
    });
    c.append(seccion("¿Cómo añado los míos?", [
      el("p.ed-ayuda", { html: "Crea una carpeta en <b>assets/&lt;categoría&gt;/&lt;nombre&gt;/</b> con su <b>index.html</b> (y su css, js, imágenes, sonidos…). Aparece aquí sola en cuanto se sube a GitHub. Su HTML no se modifica nunca: el editor sólo lo coloca. Más detalles en <b>assets/LÉEME.md</b>." }),
    ], { abierta: false }));
  }

  /* ── 🎵 Audio ───────────────────────────────────────────────────── */
  _audio(c) {
    const E = this.E;
    const p = this._proy();
    const g = this._pag();
    const nombre = (id) => (id && this.P.assets[id]?.nombre) || null;
    const escuchar = this._escuchar();
    const gm = this.P.ajustes.musica;
    c.append(seccion("Música de todo el librito", [
      el("div.ed-cancion", {}, [el("b", { text: "♪" }), el("span", { text: nombre(gm.asset) || "Sin música" }), gm.asset ? escuchar(gm.asset) : null].filter(Boolean)),
      el("div.ed-botonera", {}, [
        boton(gm.asset ? "⟳ Cambiar canción" : "＋ Añadir canción", async () => { const [id] = await elegir(this.app, "audio", { titulo: "Música del librito" }); if (id) E.setProy({ "ajustes.musica.asset": id }, "Música del librito"); }, gm.asset ? "chico" : "chico primario"),
        gm.asset ? boton("Quitar", () => E.setProy({ "ajustes.musica.asset": null }, "Quitar música"), "chico") : null,
      ].filter(Boolean)),
      fila("Volumen", p("ajustes.musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05 })),
      fila("En bucle", p("ajustes.musica.bucle", { tipo: "toggle" })),
    ]));
    const pm = E.pagina?.musica || { modo: "global" };
    const pag = [fila("Aquí suena", g("musica.modo", { tipo: "segmento", opciones: [["global", "La del librito"], ["propia", "Su canción"], ["silencio", "Silencio"]], def: "global" }))];
    if (pm.modo === "propia") pag.push(
      el("div.ed-cancion", {}, [el("b", { text: "♪" }), el("span", { text: nombre(pm.asset) || "Elige una canción" }), pm.asset ? escuchar(pm.asset) : null].filter(Boolean)),
      boton(pm.asset ? "⟳ Cambiar canción" : "＋ Añadir canción", async () => { const [id] = await elegir(this.app, "audio", { titulo: "Canción de esta página" }); if (id) E.setPag({ "musica.asset": id }, "Canción de la página"); }, pm.asset ? "chico" : "chico primario"),
      fila("Volumen", g("musica.volumen", { tipo: "rango", min: 0, max: 1, paso: 0.05, def: 0.85 })),
      fila("En bucle", g("musica.bucle", { tipo: "toggle", def: true })),
    );
    pag.push(el("small.ed-ayuda", { text: "Al cambiar de canción se funden: una baja mientras la otra sube." }));
    c.append(seccion("Esta página", pag));
    // La biblioteca: «musica assets/», los sonidos de assets/ y lo subido.
    const lib = el("div");
    c.append(seccion("Biblioteca de audio", [lib, boton("＋ Subir canción o sonido", async () => { await elegir(this.app, "audio"); this.rehacer(); }, "chico")]));
    const fila_ = (nom, ruta, peso) => {
      const a = () => this.app.bib.delLibrito(ruta, "audio", nom, { tam: peso });
      const b = el("button.ed-play", { type: "button", html: "▶", title: "Escuchar" });
      b.addEventListener("click", () => this._sonar(rutaAUrl(ruta), b));
      return el("div.ed-asset", {}, [b, el("span", { text: nom }), peso ? el("small", { text: formatoBytes(peso) }) : null,
        el("button.ed-btn.chico", { type: "button", text: "De fondo", title: "Música de todo el librito", onClick: () => E.setProy({ "ajustes.musica.asset": a().id }, "Música del librito") }),
        el("button.ed-btn.chico", { type: "button", text: "Aquí", title: "Sólo en esta página", onClick: () => E.setPag({ musica: { modo: "propia", asset: a().id, volumen: 0.85, bucle: true } }, "Canción de la página") }),
      ].filter(Boolean));
    };
    catalogo().then((cat) => {
      const musica = cat.musica.map((m) => fila_(m.nombre, m.ruta, m.peso));
      const sonidos = [];
      for (const gr of cat.categorias) for (const it of gr.items) if (it.tipo === "audio") sonidos.push(fila_(`${it.nombre} · ${gr.nombre.toLowerCase()}`, it.ruta, it.peso));
      const mios = Object.values(this.P.assets).filter((a) => a.tipo === "audio" && a.fuente === "local").map((a) => el("div.ed-asset", {}, [escuchar(a.id), el("span", { text: a.nombre }), el("small", { text: formatoBytes(a.tam) })]));
      lib.append(
        el("b.ed-sub", { text: "🎵 Música (musica assets/)" }),
        musica.length ? el("div.ed-rejilla-assets.lista", {}, musica) : el("p.ed-vacio-txt", { text: "Deja tus canciones en la carpeta «musica assets/» y aparecen aquí solas." }),
        el("b.ed-sub", { text: "🔔 Sonidos (assets/)" }),
        sonidos.length ? el("div.ed-rejilla-assets.lista", {}, sonidos) : el("p.ed-vacio-txt", { text: "Pon .mp3 cortos en cualquier carpeta de assets/." }),
        mios.length ? el("b.ed-sub", { text: "⬆ Subidas a este librito" }) : null,
        mios.length ? el("div.ed-rejilla-assets.lista", {}, mios) : null,
      );
    });
    c.append(seccion("Reproducción", [
      fila("Tocar para empezar", p("ajustes.reproduccion.tocarParaEmpezar", { tipo: "toggle" }), "los teléfonos no dejan sonar música hasta el primer toque"),
      el("small.ed-ayuda", { text: "Los sonidos de cada botón o elemento se eligen en su sección «Sonidos» (inspector); el de pasar página, en 🎞️ Transiciones." }),
    ], { abierta: false }));
  }

  _sonar(url, b) {
    const a = Paneles._audio || (Paneles._audio = new Audio());
    if (Paneles._sonando === url && !a.paused) { a.pause(); b.innerHTML = "▶"; return; }
    document.querySelectorAll(".ed-play").forEach((x) => { x.innerHTML = "▶"; });
    a.preload = "none";
    a.src = url;
    a.play().catch(() => aviso("No se pudo reproducir"));
    Paneles._sonando = url;
    b.innerHTML = "❚❚";
    a.onended = () => { b.innerHTML = "▶"; };
  }

  /** Un botoncito ▶ que suena sólo cuando se pide (y para a los demás). */
  _escuchar() {
    return (id) => {
      const b = el("button.ed-play", { type: "button", html: "▶", title: "Escuchar" });
      b.addEventListener("click", () => this._sonar(this.app.bib.url(id), b));
      return b;
    };
  }

  /* ── 🎨 Diseño (tema) ───────────────────────────────────────────── */
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
      boton("🎨 Fondo de esta página", () => { E.seleccionar([]); this.app.insp.abrir("diseno"); }, "chico"),
    ]));
    RT.cargarFuentes(["Playfair Display", "Dancing Script", "Great Vibes", "Quicksand"]);
  }

  /* ── 🎞️ Transiciones ────────────────────────────────────────────── */
  _transiciones(c) {
    const p = this._proy();
    const g = this._pag();
    const E = this.E;
    const tipos = Object.entries(RT.TRANS).map(([k, v]) => [k, v.n]);
    const dirs = [["auto", "Según hacia dónde pases"], ["izquierda", "Hacia la izquierda"], ["derecha", "Hacia la derecha"], ["arriba", "Hacia arriba"], ["abajo", "Hacia abajo"]];
    const facil = Object.entries(RT.FACIL).map(([k, v]) => [k, v.n]);
    const gT = this.P.ajustes.transicion;
    const global = [
      el("div.ed-trans", {}, tipos.map(([k, n]) => el("button" + (gT.tipo === k ? ".on" : ""), { type: "button", onClick: () => E.setProy({ "ajustes.transicion.tipo": k }, "Transición") }, [el("i.ed-trans-ico.t-" + k), el("span", { text: n })]))),
      fila("Duración", p("ajustes.transicion.dur", { tipo: "rango", min: 150, max: 2500, paso: 50, unidad: "ms" })),
      RT.TRANS[gT.tipo]?.dir ? fila("Dirección", p("ajustes.transicion.dir", { tipo: "select", opciones: dirs })) : null,
      fila("Ritmo", p("ajustes.transicion.facil", { tipo: "select", opciones: facil })),
    ];
    if (gT.tipo === "personalizada") global.push(...this._transPropia(p, "ajustes.transicion.propia"));
    global.push(this._sonidoFila(() => this.P.ajustes.transicion.sonido, (id) => E.setProy({ "ajustes.transicion.sonido": id }, "Sonido al pasar"), "Sonido al pasar"));
    c.append(seccion("Entre todas las páginas", global.filter(Boolean)));
    const pt = E.pagina?.transicion;
    const propia = [
      fila("Usar", control(this.v, { tipo: "segmento", opciones: [["global", "La del librito"], ["propia", "Una propia"]], leer: () => (E.pagina?.transicion ? "propia" : "global"), escribir: (x) => E.setPag({ transicion: x === "propia" ? { ...this.P.ajustes.transicion } : null }, "Transición de la página") })),
    ];
    if (pt) {
      propia.push(
        fila("Tipo", g("transicion.tipo", { tipo: "select", opciones: tipos })),
        fila("Duración", g("transicion.dur", { tipo: "rango", min: 150, max: 2500, paso: 50, unidad: "ms" })),
        RT.TRANS[pt.tipo]?.dir ? fila("Dirección", g("transicion.dir", { tipo: "select", opciones: dirs })) : null,
        fila("Ritmo", g("transicion.facil", { tipo: "select", opciones: facil })),
      );
      if (pt.tipo === "personalizada") propia.push(...this._transPropia(g, "transicion.propia"));
      propia.push(this._sonidoFila(() => E.pagina?.transicion?.sonido, (id) => E.setPag({ "transicion.sonido": id }, "Sonido al llegar"), "Sonido al llegar"));
    }
    propia.push(el("small.ed-ayuda", { text: "Es la transición con la que se LLEGA a esta página." }));
    c.append(seccion("Al llegar a esta página", propia.filter(Boolean)));
    c.append(boton("▶ Ver cómo se ve", () => {
      const i = this.P.orden.indexOf(E.paginaId);
      this.app.vista.abrir(Math.max(0, i - 1), { avanzar: i > 0 });
    }, "primario"));
  }

  _sonidoFila(leer, escribir, etiqueta) {
    const nombre = () => { const id = leer(); return id ? this.P.assets[id]?.nombre || "sonido" : "ninguno"; };
    const b = boton("♪ " + nombre(), async () => { const [id] = await elegir(this.app, "audio", { titulo: etiqueta }); if (id) escribir(id); }, "chico");
    this.v.add(() => { b.innerHTML = "♪ " + nombre(); });
    return fila(etiqueta, el("div.ed-botonera", {}, [b, boton("▶", () => { const id = leer(); if (id) RT.sonar(this.app.bib.url(id)); }, "chico ico", "Escuchar"), boton("✕", () => escribir(null), "chico ico", "Quitar")]));
  }

  _transPropia(ctl, base) {
    return [
      el("small.ed-ayuda", { text: "Cómo entra la página nueva (la que se va hace lo contrario):" }),
      el("div.ed-rejilla2", {}, [
        fila("Mover ↔", ctl(base + ".x", { min: -120, max: 120, unidad: "%", def: 30 })),
        fila("Mover ↕", ctl(base + ".y", { min: -120, max: 120, unidad: "%", def: 0 })),
        fila("Escala", ctl(base + ".escala", { min: 0, max: 2, paso: 0.05, def: 0.95 })),
        fila("Giro", ctl(base + ".rot", { min: -180, max: 180, unidad: "°", def: 0 })),
        fila("Opacidad", ctl(base + ".opacidad", { min: 0, max: 1, paso: 0.05, def: 0 })),
        fila("Desenfoque", ctl(base + ".desenfoque", { min: 0, max: 40, unidad: "px", def: 0 })),
      ]),
    ];
  }

  /* ── </> HTML ───────────────────────────────────────────────────── */
  _html(c) {
    const A = this.app.acciones;
    const E = this.E;
    const bloques = E.pagina?.els.filter((e) => e.tipo === "html" || e.tipo === "pagina") || [];
    c.append(seccion("Inyectar HTML", [
      el("p.ed-ayuda", { text: "Pega o escribe tu propio HTML, CSS y JavaScript. Cada bloque vive en su marco aislado: no puede romper el editor, la navegación ni las otras páginas." }),
      el("div.ed-botonera", {}, [
        boton("＋ Bloque HTML", () => A.html(), "primario"),
        boton("＋ Página HTML completa", () => { const pg = this.app.plantilla("html"); A.nuevaPagina(pg); setTimeout(() => A.editarHtml(this.E.pagina.els[0]), 50); }),
      ]),
    ]));
    c.append(seccion("En esta página", bloques.length ? bloques.map((e) => el("div.ed-bloque", {}, [
      el("b", { text: e.tipo === "html" ? "</>" : "📄" }),
      el("span", { text: e.nombre }),
      e.tipo === "html" ? boton("Editar", () => { E.seleccionar([e.id]); A.editarHtml(e); }, "chico") : boton("Hacer editable", () => { E.seleccionar([e.id]); this.app.importar.hacerEditable(e); }, "chico"),
    ])) : [el("p.ed-vacio-txt", { text: "Esta página no tiene bloques HTML." })]));
    c.append(seccion("Tus páginas HTML del librito", [
      el("p.ed-ayuda", { text: "Úsalas tal cual (funcionan con todo su JavaScript) o conviértelas en plantilla editable." }),
      boton("📚 Elegir una de mis páginas", () => this.app.importar.misPaginas(), "chico"),
    ]));
  }

  /* ── ⚙️ Ajustes ─────────────────────────────────────────────────── */
  _ajustes(c) {
    const p = this._proy();
    const E = this.E;
    const app = this.app;
    const formatos = Object.entries(FORMATOS).map(([k, f]) => [k, `${f.n} · ${f.w}×${f.h}`]);
    c.append(seccion("El librito", [
      fila("Nombre", p("nombre", { tipo: "texto", alcambiar: true, nombre: "Nombre" })),
      fila("Tamaño de hoja", control(this.v, {
        tipo: "select", opciones: [...formatos, ["propio", "A mi medida…"]],
        leer: () => this.P.ajustes.formato,
        escribir: (k) => {
          if (k === "propio") { E.setProy({ "ajustes.formato": "propio" }, "Tamaño"); this.rehacer(); return; }
          app.cambiarTamano(FORMATOS[k].w, FORMATOS[k].h, k);
        },
      })),
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
    c.append(seccion("Cómo se lee", [
      fila("Flechas ‹ ›", p("ajustes.reproduccion.flechas", { tipo: "toggle" })),
      fila("Pasar deslizando", p("ajustes.reproduccion.deslizar", { tipo: "toggle" })),
      fila("Barrita de progreso", p("ajustes.reproduccion.progreso", { tipo: "toggle" })),
      fila("Índice ☰", p("ajustes.reproduccion.indice", { tipo: "toggle" })),
      fila("«Toca para abrir»", p("ajustes.reproduccion.tocarParaEmpezar", { tipo: "toggle" })),
      fila("Al terminar", p("ajustes.reproduccion.alFinal", { tipo: "segmento", opciones: [["quedarse", "Quedarse"], ["portada", "Volver a empezar"]] })),
      fila("Pasar solas", p("ajustes.reproduccion.autoAvance", { tipo: "rango", min: 0, max: 30, unidad: " s" }), "0 = sólo cuando ella pase la hoja"),
    ], { abierta: false }));
    c.append(seccion("Editor", [
      fila("Cuadrícula", p("editor.cuadricula", { tipo: "toggle", nombre: "Cuadrícula" })),
      fila("Paso", p("editor.paso", { tipo: "rango", min: 4, max: 50, unidad: "px", nombre: "Cuadrícula" })),
      fila("Imán", p("editor.iman", { tipo: "toggle", nombre: "Imán" }), "se pega a bordes, centros y guías"),
      fila("Reglas", p("editor.reglas", { tipo: "toggle", nombre: "Reglas" }), "arrastra desde ellas para poner guías"),
      fila("Márgenes seguros", p("editor.margenes", { tipo: "toggle", nombre: "Márgenes" })),
      fila("Margen", p("editor.margen", { tipo: "rango", min: 0, max: 80, unidad: "px", nombre: "Margen" })),
      (this.P.editor.guias || []).length ? boton("Quitar todas las guías", () => E.setProy({ "editor.guias": [] }, "Quitar guías"), "chico") : null,
    ].filter(Boolean), { abierta: false }));
    const usados = assetsUsados(this.P);
    c.append(seccion("Guardar y exportar", [
      el("p.ed-ayuda", { text: "Se guarda solo mientras editas (en este navegador). Para llevártelo, exporta el .zip: trae sólo lo que de verdad se usa." }),
      el("div.ed-botonera", {}, [
        boton("💾 Exportar ZIP", () => app.exportar(), "primario"),
        boton("Guardar ya", () => app.guardarYa(), "chico"),
      ]),
      el("small.ed-ayuda", { text: `${this.P.orden.length} páginas · ${usados.size} archivos en uso de ${Object.keys(this.P.assets).length} en la biblioteca` }),
    ]));
    const esp = el("small.ed-ayuda");
    espacio().then((e) => { if (e) esp.textContent = `Espacio usado por el navegador: ${formatoBytes(e.usage)} de ${formatoBytes(e.quota)}`; });
    c.append(seccion("Borradores", [
      el("div.ed-botonera", {}, [
        boton("📂 Abrir otro", () => app.inicio(), "chico"),
        boton("🆕 Empezar uno nuevo", () => app.nuevo(), "chico"),
        boton("⧉ Duplicar este", () => app.duplicarProyecto(), "chico"),
        boton("📥 Abrir archivo (.zip / .json)", () => app.abrirArchivo(), "chico"),
      ]),
      boton("🗑 Borrar este borrador", async () => { if (await confirmar(`Se borrará «${this.P.nombre}» de este navegador, con sus fotos subidas. Si no lo exportaste, se pierde.`, "Borrar borrador")) app.borrarProyecto(); }, "chico peligro"),
      esp,
    ], { abierta: false }));
  }
}
