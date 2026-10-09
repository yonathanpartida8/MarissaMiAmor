/**
 * CREAR LIBRITO — arranque del editor.
 *
 * Aquí sólo se conectan las piezas; cada una vive en su carpeta:
 *
 *   core/        el modelo y el estado (la única puerta para cambiar algo)
 *   history/     deshacer y rehacer
 *   storage/     borradores en IndexedDB y autoguardado
 *   assets/      biblioteca de archivos, fotos optimizadas, dibujos, el librito de siempre
 *   componentes/ los componentes HTML de assets/ (catálogo y zona táctil)
 *   canvas/      el lienzo: gestos, selección, transformaciones, imán, guías, reglas
 *   pages/       la lista de páginas
 *   templates/   plantillas ligeras
 *   timeline/    la línea de tiempo (como un editor de vídeo)
 *   audio/       el sonido del editor: MusicaDev, efectos y «ducking»
 *   html/        el editor de HTML aislado (documentos completos) y el importador
 *   export/      el .zip (escribir y leer)
 *   components/  barra lateral, paneles, inspector, barra contextual, vista previa…
 *   runtime/     el reproductor: lo usan el lienzo, la vista previa y el .zip
 *                (rt-3d.js: escenas WebGL2, se carga sólo si hay una)
 *   recursos/    lo que se amplía solo desde assets/ (animaciones, transiciones,
 *                efectos, fondos, sonidos del editor, iconos)
 *   integraciones/  GIPHY (GIFs y stickers) y quitar el fondo de un GIF animado
 *   components/secciones/  cada sección grande del panel en su archivo
 */
import { el, aviso, modal, esMovil, menu, popover } from "./components/ui.js";
import { Estado } from "./core/estado.js";
import { nuevoProyecto, nuevaPagina, nuevoEl, normalizar, clonar, uid, tamAuto } from "./core/modelo.js";
import { Biblioteca, elegirArchivos } from "./assets/biblioteca.js";
import { Autoguardado } from "./storage/autoguardado.js";
import { cargar, guardarTodo, borrar, leerArchivo, guardarArchivo } from "./storage/db.js";
import { Lienzo, DISPOSITIVOS } from "./canvas/lienzo.js";
import { Acciones } from "./components/acciones.js";
import { Inspector } from "./components/inspector.js";
import { Paneles } from "./components/paneles.js";
import { PanelPaginas } from "./pages/panel.js";
import { Linea } from "./timeline/linea.js";
import { EditorHtml } from "./html/editorHtml.js";
import { Importador, registrarFuentes } from "./html/importar.js";
import { Vista } from "./components/vista.js";
import { pantallaInicio } from "./components/inicio.js";
import { atajos } from "./components/teclado.js";
import { PLANTILLAS } from "./templates/plantillas.js";
import { BarraContextual } from "./components/barra.js";
import { Lateral } from "./components/lateral.js";
import { guardasDeApp } from "./components/guardas.js";
import { AudioEditor } from "./audio/mezclador.js";
import { ico } from "./components/iconos.js";
import { Hoja } from "./components/hoja.js";
import { vigilarPantalla } from "./components/pantalla.js";
import { Prueba } from "./components/prueba.js";
import { Salida } from "./components/salir.js";
import { Ajustes } from "./components/ajustes.js";
import { Ayuda } from "./components/ayuda.js";
import { SonidosEditor } from "./audio/sonidos-editor.js";
import { aplicarIconos } from "./recursos/extras.js";
import { asegurarBotones } from "./components/secciones/navegacion.js";
import { PREF, aplicar as aplicarPref, vibrar } from "./config/preferencias.js";
import { medirHz } from "./config/cuadros.js";
import { Configuracion } from "./components/configuracion.js";
import { Herramientas } from "./canvas/herramientas.js";

const RT = window.LibritoRT;
const ULTIMO = "editordev:ultimo";
const $ = (s) => document.querySelector(s);

/** Las categorías del riel: [id, icono, nombre]. */
const SECCIONES = [
  ["paginas", "paginas", "Páginas"],
  ["elementos", "elementos", "Elementos"],
  ["texto", "texto", "Texto"],
  ["imagenes", "imagen", "Imágenes"],
  ["gifs", "gif", "GIFs"],
  ["stickers", "sticker", "Stickers"],
  ["video", "video", "Vídeo"],
  ["audio", "audio", "Audio"],
  ["efectos", "efectos", "Efectos"],
  ["animar", "animar", "Animar"],
  ["transiciones", "transiciones", "Transiciones"],
  ["interactivo", "interactivo", "Interactivo"],
  ["componentes", "biblioteca", "Recursos"],
  ["html", "html", "HTML"],
  ["3d", "cubo", "3D"],
  ["diseno", "diseno", "Tema"],
  ["herramientas", "herramientas", "Herramientas"],
];
// Nombres viejos que otros sitios todavía piden.
const ALIAS = { fotos: "imagenes", ajustes: "herramientas" };
// En el teléfono, estas secciones se abren en una hojita de abajo (compacta)
// para que la página se siga viendo: lo elegido, su efecto, su animación…
const HOJAS = new Set(["animar", "efectos", "transiciones", "gifs", "stickers"]);

const app = {};
window.EditorDev = app;

function guardarUltimo(id) { try { if (id) localStorage.setItem(ULTIMO, id); else localStorage.removeItem(ULTIMO); } catch (e) { /* nada */ } }
function leerUltimo() { try { return localStorage.getItem(ULTIMO); } catch (e) { return null; } }

async function arrancar() {
  guardasDeApp();
  aplicarPref();
  vigilarPantalla();
  setTimeout(() => medirHz(), 1200); // con la página ya quieta, para medir bien
  // Iconos propios de assets/iconos/ (si hay), antes de pintar nada.
  await Promise.race([aplicarIconos().catch(() => 0), new Promise((r) => setTimeout(r, 700))]);
  const E = new Estado();
  Object.assign(app, { estado: E });
  app.bib = new Biblioteca(E);
  app.audio = new AudioEditor(app);
  app.acciones = new Acciones(app);
  app.html = new EditorHtml(app);
  app.importar = new Importador(app);
  app.vista = new Vista(app);
  app.prueba = new Prueba(app);
  app.ajustes = new Ajustes(app);
  app.sonidos = new SonidosEditor(app.audio);
  app.sonidos.conectar(app);
  app.plantilla = (id) => PLANTILLAS.find((t) => t.id === id).crear(E.proyecto);

  app.lienzo = new Lienzo(app, $(".ed-centro"));
  app.insp = new Inspector(app, $(".ed-insp"));
  app.paneles = new Paneles(app);
  app.paginas = new PanelPaginas(app);
  app.tiempo = new Linea(app, $(".ed-linea"));
  app.barra = new BarraContextual(app, $(".ed-contexto"));
  app.lateral = new Lateral({ raiz: $(".ed-lateral"), velo: $(".ed-velo"), borde: $(".ed-borde-izq"), asa: $(".ed-asa-lateral"), alCambiar: (on) => { if (on) { cerrarHoja(); cerrarHojaSec(); } } });
  app.gifs = app.paneles;
  app.abrirSeccion = (id) => abrirSeccion(id, true);

  const estadoGuardado = $(".ed-guardado");
  app.auto = new Autoguardado(E, (st) => {
    estadoGuardado.dataset.st = st;
    estadoGuardado.textContent = st === "guardando" ? "Guardando…" : st === "error" ? "No se pudo guardar" : st === "sin-guardar" ? "Sin guardar" : "Guardado";
    if (st === "error") aviso("No se pudo guardar en este navegador (¿sin espacio?). Exporta el .zip para no perder nada.", 5000, "error");
  });

  construirBarra();
  construirRiel();
  atajos(app);
  app.salida = new Salida(app);
  app.ayuda = new Ayuda(app);
  app.config = new Configuracion(app);
  app.herramientas = new Herramientas(app);
  tactil();
  E.on("historial", pintarHistorial);
  E.on("proyecto", ({ ruta }) => { if (ruta === "nombre") pintarNombre(); });
  E.on("cargado", () => { pintarNombre(); pintarHistorial(); abrirSeccion(app.seccion || "elementos"); pintarPaginas(); });
  E.on("actual", () => { if (esMovil()) cerrarHoja(); pintarPaginas(); });
  E.on("paginas", pintarPaginas);

  const ultimo = leerUltimo();
  const P = ultimo ? await cargar(ultimo).catch(() => null) : null;
  if (P) await app.abrirProyecto(P);
  else await pantallaInicio(app);
  document.body.classList.add("listo");
}

/* ── Barra de arriba ─────────────────────────────────────────────────── */
/** «2/5»: la página en la que estás; abre Páginas. */
function pintarPaginas() {
  const E = app.estado, b = $(".ed-paginas-b span");
  if (!b || !E.proyecto) return;
  b.textContent = `${Math.max(1, E.proyecto.orden.indexOf(E.paginaId) + 1)}/${E.proyecto.orden.length}`;
}

/** La notita: tocar = encender/apagar (con fundido); mantener = volumen. */
function botonMusica() {
  const b = $(".ed-musica-b"), AU = app.audio;
  const pintar = () => {
    const on = !!AU?.pref.on;
    b.innerHTML = ico(on ? "musica" : "musicaNo");
    b.classList.toggle("on", on && !!AU?.sonando);
    b.classList.toggle("apagada", !on);
    b.setAttribute("aria-pressed", String(on));
  };
  pintar();
  AU?.alCambiar(pintar);
  let largo = 0, abrio = false;
  const volumen = () => {
    abrio = true;
    const r = el("input", { type: "range", min: 0, max: 1, step: 0.05, value: AU.pref.vol, "aria-label": "Volumen de la música" });
    r.addEventListener("input", () => AU.ponerPref({ vol: +r.value, on: true }));
    popover(b, [el("b.ed-pop-t", { text: "Música" }), el("div.ed-musica-vol", {}, [el("span", { html: ico("volumen") }), r])]);
  };
  b.addEventListener("pointerdown", () => { abrio = false; clearTimeout(largo); largo = setTimeout(volumen, 480); });
  for (const t of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(t, () => clearTimeout(largo));
  b.addEventListener("contextmenu", (e) => { e.preventDefault(); if (!abrio) volumen(); });
  b.addEventListener("click", () => {
    if (abrio || !AU) return;
    AU.ponerPref({ on: !AU.pref.on });
    aviso(AU.pref.on ? (AU.disponible ? "Música encendida 🎶" : "No encontré MusicaDev.mp3") : "Música apagada", 1600);
  });
}

/** Detalles táctiles: vibración suave al tocar botones y etiquetas al pasar el ratón. */
function tactil() {
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" && e.target.closest("button, .ed-cb, [role=button]")) vibrar(6);
  }, { capture: true, passive: true });
  let tip = null, t = 0;
  const quitar = () => { clearTimeout(t); tip?.remove(); tip = null; };
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const b = e.target.closest?.("[title], [data-tip]");
    if (!b) return quitar();
    if (b.hasAttribute("title")) { b.dataset.tip = b.getAttribute("title"); b.removeAttribute("title"); }
    if (!PREF.tooltips || !b.dataset.tip || tip?._de === b) return;
    quitar();
    t = setTimeout(() => {
      const r = b.getBoundingClientRect();
      tip = el("div.ed-tip", { text: b.dataset.tip });
      tip._de = b;
      document.body.append(tip);
      const w = tip.offsetWidth;
      tip.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + "px";
      tip.style.top = (r.bottom + 8 + 30 > innerHeight ? r.top - 34 : r.bottom + 8) + "px";
    }, 450);
  }, { passive: true });
  document.addEventListener("pointerdown", quitar, true);
  addEventListener("scroll", quitar, true);
}
function construirBarra() {
  const E = app.estado;
  $(".ed-volver").innerHTML = ico("volver");
  $(".ed-ajustes-b").innerHTML = ico("tuerca");
  $(".ed-mas").innerHTML = ico("puntos");
  $(".ed-deshacer").innerHTML = ico("deshacer");
  $(".ed-rehacer").innerHTML = ico("rehacer");
  $(".ed-guardar").innerHTML = ico("guardar");
  $(".ed-ver").innerHTML = ico("telefono");
  $(".ed-previa").insertAdjacentHTML("afterbegin", ico("biblioteca"));
  $(".ed-probar").insertAdjacentHTML("afterbegin", ico("play"));
  $(".ed-probar").addEventListener("click", () => app.prueba.abrir());
  $(".ed-exportar").insertAdjacentHTML("afterbegin", ico("exportar"));
  const nombre = $(".ed-nombre input");
  nombre.addEventListener("change", () => { const n = nombre.value.trim(); if (n) E.setProy({ nombre: n }, "Nombre"); });
  nombre.addEventListener("keydown", (e) => { if (e.key === "Enter") nombre.blur(); e.stopPropagation(); });
  $(".ed-ajustes-b").addEventListener("click", () => app.config.abrir());
  $(".ed-paginas-b").addEventListener("click", () => abrirSeccion(app.seccion === "paginas" && !document.body.classList.contains("sin-panel") && !esMovil() ? null : "paginas", true));
  botonMusica();
  // «Más»: lo que no cabe en el teléfono (los mismos botones de siempre).
  $(".ed-mas").addEventListener("click", (e) => menu(e.currentTarget, [
    { t: `${ico("biblioteca")}<span>Ver el librito entero</span>`, al: () => $(".ed-previa").click() },
    { t: `${ico("telefono")}<span>Ver como…</span>`, al: () => $(".ed-ver").click() },
    { t: `${ico("guardar")}<span>Guardar y borradores…</span>`, al: () => $(".ed-guardar").click() },
    { t: `${ico("exportar")}<span>Exportar (.zip)</span>`, al: () => app.exportar() },
    { t: `${ico("herramientas")}<span>Herramientas</span>`, al: () => abrirSeccion("herramientas", true) },
  ]));
  $(".ed-deshacer").addEventListener("click", () => E.deshacer());
  $(".ed-rehacer").addEventListener("click", () => E.rehacer());
  $(".ed-previa").addEventListener("click", () => app.vista.abrir(Math.max(0, E.proyecto.orden.indexOf(E.paginaId)), { portadilla: false }));
  $(".ed-exportar").addEventListener("click", () => app.exportar());
  const t = (i, x) => `${ico(i)}<span>${x}</span>`;
  $(".ed-guardar").addEventListener("click", (e) => menu(e.currentTarget, [
    { t: t("guardar", "Guardar borrador ahora"), al: () => app.guardarYa() },
    { t: t("carpeta", "Abrir borrador…"), al: () => app.inicio() },
    { t: t("nuevo", "Empezar uno nuevo"), al: () => app.nuevo() },
    { t: t("subir", "Abrir archivo (.zip / .json)…"), al: () => app.abrirArchivo() },
    "-",
    { t: t("exportar", "Exportar ZIP"), al: () => app.exportar() },
  ]));
  $(".ed-ver").addEventListener("click", (e) => app.menuVerComo(e.currentTarget));
  const zoom = $(".ed-zoom");
  zoom.addEventListener("change", () => { const v = zoom.value; app.lienzo.zoom(v === "ajustar" ? "ajustar" : +v); zoom.value = ""; });
  app.alZoom = (v) => { $(".ed-zoom option[value='']").textContent = v.ajustar ? "Ajustar" : Math.round(v.z * 100) + "%"; };
  app.alVerComo = (id) => { $(".ed-ver").innerHTML = ico(DISPOSITIVOS[id]?.ico || "telefono"); };
  app.alVerComo(app.lienzo.ver);
}

/** Con la hoja automática: en qué pantalla probarla. */
app.menuVerComo = (ancla) => {
  const L = app.lienzo;
  menu(ancla, Object.entries(DISPOSITIVOS).map(([k, d]) => ({
    t: `${ico(d.ico)}<span>${d.n}${d.w ? ` · ${d.w}×${d.h}` : ""}</span>${L.ver === k ? ico("ok") : ""}`,
    al: () => L.verComo(k),
  })));
};

function pintarNombre() {
  const P = app.estado.proyecto;
  if (!P) return;
  $(".ed-nombre input").value = P.nombre;
  document.title = P.nombre + " · Crear librito";
}

function pintarHistorial() {
  const h = app.estado.historial;
  const d = $(".ed-deshacer"), r = $(".ed-rehacer");
  d.disabled = !h.puedeDeshacer;
  r.disabled = !h.puedeRehacer;
  d.title = h.puedeDeshacer ? `Deshacer: ${h.anteriorNombre} (Ctrl+Z)` : "Nada que deshacer";
  r.title = h.puedeRehacer ? `Rehacer: ${h.siguienteNombre} (Ctrl+Mayús+Z)` : "Nada que rehacer";
}

/* ── Riel, panel y hojas (en el teléfono) ────────────────────────────── */
function construirRiel() {
  const riel = $(".ed-riel");
  for (const [id, icono, n] of SECCIONES) {
    if (id === "paginas") continue; // Páginas va arriba (botón «1/3»), no compite con las herramientas
    riel.append(el("button", { type: "button", dataset: { s: id }, title: n, "aria-label": n, onClick: () => {
      const activo = app.seccion === id;
      if (esMovil()) { if (activo && app.lateral.abierto) app.lateral.cerrar(); else abrirSeccion(id, true); }
      else abrirSeccion(activo && !document.body.classList.contains("sin-panel") ? null : id, true);
    } }, [el("b", { html: ico(icono) }), el("span", { text: n })]));
  }
  $(".ed-panel-x").innerHTML = ico("cerrar");
  $(".ed-panel-x").addEventListener("click", () => { if (esMovil()) app.lateral.cerrar(); else abrirSeccion(null); });
  $(".ed-asa-lateral").innerHTML = ico("derecha");
  // El inspector en el teléfono: una hoja que sigue al dedo desde su asa de color.
  const insp = $(".ed-insp");
  const asaInsp = insp.querySelector(".ed-hoja-asa");
  asaInsp.className = "ed-asa-hoja";
  asaInsp.innerHTML = "<i></i>";
  hojaInsp = new Hoja(insp, { asa: asaInsp, puntos: [1, 0.55], cerrable: true, alCerrar: () => { if (document.body.dataset.hoja?.startsWith("insp:")) delete document.body.dataset.hoja; } });
  // Las secciones compactas del teléfono (Animar, Efectos, GIFs…): otra hoja, a media altura.
  const hs = $(".ed-hoja-sec");
  hs.querySelector(".ed-hoja-sec-x").innerHTML = ico("cerrar");
  hs.querySelector(".ed-hoja-sec-x").addEventListener("click", () => cerrarHojaSec());
  hojaSec = new Hoja(hs, {
    asa: hs.querySelector(".ed-asa-hoja"), agarres: [hs.querySelector(".ed-hoja-sec-cab h2")], puntos: [1, 0.62], cerrable: true,
    alCerrar: () => {
      document.body.classList.remove("con-hoja-sec");
      if (app.paneles.cont === hs.querySelector(".ed-hoja-sec-cuerpo")) { app.paneles._limpiar?.(); app.paneles._limpiar = null; app.paneles.cont = null; }
      if (esMovil()) for (const b of document.querySelectorAll(".ed-riel button")) b.classList.remove("on");
    },
  });
  // Al pasar a la computadora, las hojas vuelven a ser paneles fijos.
  matchMedia("(max-width: 1023px)").addEventListener("change", (m) => {
    if (m.matches) return;
    for (const [h, n] of [[hojaInsp, insp], [hojaSec, hs]]) { h.parar?.(); h.abierta = false; n.classList.remove("abierta"); n.style.transform = ""; n.style.visibility = ""; }
    delete document.body.dataset.hoja;
    document.body.classList.remove("con-hoja-sec");
  });
  app.mostrarInspector = () => { if (esMovil()) { app.lateral.cerrar(); cerrarHojaSec(); abrirHoja("insp:" + app.insp.tab); } };
  app.cerrarHoja = cerrarHoja;
  app.cerrarHojaSec = cerrarHojaSec;
  app.alElegirPagina = () => { if (esMovil()) app.lateral.cerrar(); };
  app.alDibujar = () => { if (esMovil()) app.lateral.cerrar(); };
  // En el teléfono, lo recién añadido se ve en la hoja (no debajo del cajón).
  app.alAnadir = () => { if (esMovil() && !document.querySelector(".ed-modal-fondo")) app.lateral.cerrar(); };
}

function abrirSeccion(id, desdeUsuario) {
  id = ALIAS[id] || id;
  const cont = $(".ed-panel-cuerpo");
  for (const b of document.querySelectorAll(".ed-riel button")) b.classList.toggle("on", b.dataset.s === id);
  document.body.classList.toggle("sin-panel", !id);
  if (!id) { if (esMovil()) app.lateral.cerrar(); cerrarHojaSec(); return; }
  app.seccion = id;
  const titulo = SECCIONES.find((s) => s[0] === id) || SECCIONES[1];
  // Teléfono + sección compacta: en una hojita abajo, con la página a la vista.
  if (esMovil() && HOJAS.has(id) && desdeUsuario) {
    const hs = $(".ed-hoja-sec");
    const cuerpo = hs.querySelector(".ed-hoja-sec-cuerpo");
    hs.querySelector(".ed-hoja-sec-cab h2").innerHTML = `${ico(titulo[1])}<span>${titulo[2]}</span>`;
    app.lateral.cerrar();
    cerrarHoja();
    app.paneles._limpiar?.();
    cuerpo.textContent = "";
    cuerpo.scrollTop = 0;
    app.paneles.abrir(id, cuerpo);
    document.body.classList.add("con-hoja-sec");
    hojaSec.abrir(hojaSec.abierta ? 0 : 1);
    requestAnimationFrame(() => setTimeout(() => app.lienzo.mostrarSeleccion?.(hs.offsetHeight * 0.62 + 12), 320));
    return;
  }
  cerrarHojaSec();
  $(".ed-panel-titulo").innerHTML = `${ico(titulo[1])}<span>${titulo[2]}</span>`;
  app.paneles._limpiar?.();
  cont.textContent = "";
  cont.scrollTop = 0;
  if (id === "paginas") { app.paneles.actual = null; app.paginas.construir(cont); }
  else app.paneles.abrir(id, cont);
  // Lo de dentro entra escalonado sólo al cambiar de sección (no al repintar).
  if (cont._sec !== id) {
    cont._sec = id;
    cont.classList.remove("entra"); void cont.offsetWidth; cont.classList.add("entra");
    clearTimeout(cont._entra); cont._entra = setTimeout(() => cont.classList.remove("entra"), 700);
  }
  if (id === "animar" && !esMovil()) { app.insp.abrir("animar"); app.tiempo.alternar(true); }
  if (esMovil() && desdeUsuario) app.lateral.abrir();
}

let hojaInsp = null, hojaSec = null;
function abrirHoja(id) { document.body.dataset.hoja = id; hojaInsp?.abrir(0); }
function cerrarHoja() { if (hojaInsp?.abierta) hojaInsp.cerrar(); delete document.body.dataset.hoja; }
function cerrarHojaSec() { if (hojaSec?.abierta) hojaSec.cerrar(); }

/* ── Proyectos ──────────────────────────────────────────────────────── */
app.abrirProyecto = async (P, guardar = false) => {
  P = normalizar(P);
  RT.registrarExtras?.(P.ajustes); // sus animaciones y transiciones propias
  registrarFuentes(P.ajustes.fuentesExtra);
  await asegurarBotones(P); // las flechas siempre salen de assets/deslizar/
  if (!P.orden.length) { const pg = nuevaPagina(P, { nombre: "Portada" }); P.paginas[pg.id] = pg; P.orden.push(pg.id); }
  await app.bib.preparar(P);
  if (guardar) await guardarTodo(P);
  app.vista.cerrar();
  app.tiempo.parar(false);
  app.estado.cargar(P);
  guardarUltimo(P.id);
  document.querySelector(".ed-inicio")?.remove();
};

app.abrir = async (id) => {
  if (app.auto.pendiente) await app.auto.ahora();
  const P = await cargar(id);
  if (!P) { aviso("No se encontró ese borrador"); return app.inicio(); }
  await app.abrirProyecto(P);
};

app.nuevo = async (nombre, formato = "movil") => {
  if (app.auto.pendiente) await app.auto.ahora();
  if (!nombre) { pantallaInicio(app, { cerrable: !!app.estado.proyecto }); return; }
  const P = nuevoProyecto(nombre, formato);
  if (formato === "auto" && matchMedia("(pointer: coarse)").matches) { const t = tamAuto(); P.ajustes.ancho = t.w; P.ajustes.alto = t.h; }
  const pg = PLANTILLAS.find((t) => t.id === "portada").crear(P);
  pg.nombre = "Portada";
  P.paginas[pg.id] = pg;
  P.orden.push(pg.id);
  P.ajustes.portada = pg.id;
  await app.abrirProyecto(P, true);
  RT.cargarFuentes(pg.els.map((e) => e.texto?.fuente));
  aviso("Tu librito nuevo. Empieza tocando cualquier cosa de la portada");
};

app.inicio = async () => {
  if (app.auto.pendiente) await app.auto.ahora();
  pantallaInicio(app, { cerrable: !!app.estado.proyecto });
};

app.guardarYa = async () => {
  await app.auto.ahora();
  if (!app.auto.error) { app.sonidos?.sonar("guardar"); dispatchEvent(new CustomEvent("ed-evento", { detail: "guardado" })); }
  aviso(app.auto.error ? "No se pudo guardar" : "Borrador guardado", 2600, app.auto.error ? "error" : "");
};

app.duplicarProyecto = async (id) => {
  if (app.auto.pendiente) await app.auto.ahora();
  const P = clonar(id ? await cargar(id) : app.estado.proyecto);
  if (!P) return;
  P.id = uid("lib");
  P.nombre = P.nombre + " (copia)";
  P.creado = P.editado = Date.now();
  // Las fotos subidas se copian con otro id (cada borrador borra las suyas).
  const mapa = {};
  const assets = {};
  for (const a of Object.values(P.assets)) {
    if (a.fuente !== "local") { assets[a.id] = a; continue; }
    const nid = uid("a");
    const b = await leerArchivo(a.id);
    if (b) await guardarArchivo(P.id, nid, b);
    mapa[a.id] = nid;
    assets[nid] = { ...a, id: nid };
  }
  P.assets = assets;
  const cambiar = (o) => {
    let t = JSON.stringify(o);
    for (const [v, n] of Object.entries(mapa)) t = t.split(JSON.stringify(v)).join(JSON.stringify(n));
    return JSON.parse(t);
  };
  P.paginas = cambiar(P.paginas);
  P.ajustes = cambiar(P.ajustes);
  await guardarTodo(P);
  if (!id) { await app.abrirProyecto(P); aviso("Ahora estás en la copia"); }
};

app.borrarProyecto = async () => {
  const id = app.estado.proyecto.id;
  await borrar(id);
  guardarUltimo(null);
  app.estado.proyecto = null;
  pantallaInicio(app);
};

app.abrirArchivo = async () => {
  const [f] = await elegirArchivos({ accept: ".zip,.json,application/zip,application/json", multiple: false });
  if (!f) return;
  const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("p", { text: "Abriendo " + f.name + "…" })])]);
  document.body.append(capa);
  try {
    const { abrirArchivo } = await import("./export/abrir.js");
    if (app.auto.pendiente) await app.auto.ahora();
    const P = await abrirArchivo(f);
    await app.abrirProyecto(P, true);
    aviso(`«${P.nombre}» abierto como borrador nuevo`);
  } catch (e) {
    console.error(e);
    aviso("No se pudo abrir: " + e.message, 4500, "error");
  } finally { capa.remove(); }
};

app.exportar = async () => {
  if (app.auto.pendiente) await app.auto.ahora();
  const t = el("p", { text: "Juntando todo…" });
  const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("b", { text: "Exportando tu librito" }), t])]);
  document.body.append(capa);
  try {
    const { exportar, descargar } = await import("./export/exportar.js");
    const r = await exportar(app, { alProgreso: (x) => { t.textContent = x; } });
    descargar(r.blob, r.nombre);
    app.sonidos?.sonar("exito");
    dispatchEvent(new CustomEvent("ed-evento", { detail: "exportado" }));
    const mb = (r.blob.size / 1024 / 1024).toFixed(1);
    aviso(`Listo: ${r.nombre} · ${mb} MB · ${r.archivos} archivos`, 4500);
    if (r.faltan.length) aviso("No se encontraron: " + r.faltan.join(", "), 6000, "error");
  } catch (e) {
    console.error(e);
    aviso("No se pudo exportar: " + e.message, 5000, "error");
  } finally { capa.remove(); }
};

/**
 * Cambiar el tamaño de la hoja (y, si se quiere, acomodar lo que ya hay).
 * «auto» = Automática: la zona segura sale de esta pantalla y en cada
 * teléfono, tableta u orientación la hoja se adapta sola.
 */
app.cambiarTamano = async (w, h, formato) => {
  const E = app.estado;
  const P = E.proyecto;
  const { ancho: W, alto: H } = P.ajustes;
  // En el teléfono, la zona segura sale de su pantalla; en la computadora se
  // queda la forma que ya tiene la hoja (y se prueba en otras con «Ver como»).
  if (formato === "auto") { if (matchMedia("(pointer: coarse)").matches) { const t = tamAuto(); w = t.w; h = t.h; } else { w = W; h = H; } }
  if (w === W && h === H) {
    E.setProy({ "ajustes.formato": formato }, "Tamaño");
    if (formato === "auto") aviso("Hoja automática: se adapta a cada pantalla. Pruébala con «Ver como».", 4200);
    return;
  }
  const hay = P.orden.some((pid) => P.paginas[pid].els.length);
  let escalar = false;
  if (hay) {
    const r = await modal({ titulo: "Nuevo tamaño de hoja", ancho: 440, contenido: el("p", { text: `De ${W}×${H} a ${w}×${h}${formato === "auto" ? " (automática)" : ""}. ¿Acomodo lo que ya hay al nuevo tamaño?` }), acciones: [["Cancelar", null], ["Dejarlo igual", "no"], ["Acomodar", "si", "primario"]] });
    if (!r) { app.paneles.rehacer(); return; }
    escalar = r === "si";
  }
  E.transaccion("Tamaño de hoja", () => {
    E.setProy({ "ajustes.ancho": w, "ajustes.alto": h, "ajustes.formato": formato });
    if (!escalar) return;
    const k = Math.min(w / W, h / H), dx = (w - W * k) / 2, dy = (h - H * k) / 2;
    for (const pid of P.orden) for (const e of P.paginas[pid].els) {
      const c = { x: Math.round(e.x * k + dx), y: Math.round(e.y * k + dy), w: Math.round(e.w * k), h: Math.round(e.h * k) };
      if (e.tipo === "texto") c["texto.tam"] = Math.round(e.texto.tam * k * 10) / 10;
      if (e.tipo === "pagina") Object.assign(c, { x: 0, y: 0, w, h });
      E.setEl(e.id, c, "Tamaño de hoja", null, pid);
    }
  });
  if (formato === "auto") aviso("Hoja automática: se adapta a cada pantalla. Pruébala con «Ver como».", 4200);
};

app.dejarDeDibujar = () => {
  if (app.herramientas) app.herramientas.usar(null); else app.lienzo.lapiz(null);
  document.querySelectorAll(".ed-btn.on").forEach((b) => { if (/Dibujar/.test(b.textContent)) b.classList.remove("on"); });
};

void nuevoEl;
arrancar().catch((e) => {
  console.error(e);
  document.body.append(el("p.ed-fallo", { text: "El editor no pudo arrancar: " + e.message }));
});
