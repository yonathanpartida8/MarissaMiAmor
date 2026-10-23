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
import * as RD from "./components/rendimiento.js";
import { ModoPro } from "./components/modo-pro.js";
import { Juntitos } from "./components/juntitos.js";
import * as UB from "./components/ubicacion.js";
import { FxEditor } from "./canvas/fx.js";
import { el, aviso, modal, esMovil, menu, popover } from "./components/ui.js";
import { Estado } from "./core/estado.js";
import { nuevoProyecto, nuevaPagina, nuevoEl, normalizar, clonar, uid, tamAuto } from "./core/modelo.js";
import { Biblioteca, elegirArchivos } from "./assets/biblioteca.js";
import { Autoguardado } from "./storage/autoguardado.js";
import { IndicadorGuardado } from "./components/guardado.js";
import { cargarSeguro, quitarRescate } from "./storage/seguro.js";
import { borrarCopias, listarCopias, leerCopia } from "./storage/respaldos.js";
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
import { pantallaInicio, quitarInicio } from "./components/inicio.js";
import { MenuPrincipal } from "./components/menu-principal.js";
import { MenuExportar } from "./components/exportar-menu.js";
import { Detallitos } from "./components/detallitos.js";
import * as SRV from "./integraciones/servidor.js";
import * as NUBE from "./integraciones/nube.js";
import * as PF from "./components/perfil.js";
import { atajos } from "./components/teclado.js";
import { PLANTILLAS } from "./templates/plantillas.js";
import { BarraContextual } from "./components/barra.js";
import { Lateral } from "./components/lateral.js";
import { guardasDeApp } from "./components/guardas.js";
import { prefChat } from "./components/chat.js";
import * as PUSH from "./integraciones/avisos.js";
import { AudioEditor } from "./audio/mezclador.js";
import { ico } from "./components/iconos.js";
import { Hoja } from "./components/hoja.js";
import { vigilarPantalla } from "./components/pantalla.js";
import { iniciarTacto } from "./components/tacto.js";
import { Prueba } from "./components/prueba.js";
import { Salida } from "./components/salir.js";
import { Ajustes } from "./components/ajustes.js";
import { Ayuda } from "./components/ayuda.js";
import { SonidosEditor } from "./audio/sonidos-editor.js";
import { EditorZonas } from "./components/toques.js";
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
// El riel, de arriba hacia abajo (Fase 38): primero cómo se pasa la página y lo que arma la hoja
// (Bloques, Recursos, Elementos), luego el contenido (Texto, Músicas, Imágenes, Videos), lo que
// adorna, lo que se toca y al final lo avanzado. Nada se repite en otro menú.
const SECCIONES = [
  ["paginas", "paginas", "Páginas"],
  ["publicadas", "publicar", "Páginas publicadas"],   // (vive en el menú ⋯, no en el riel)
  ["navegacion", "pasar", "Pasar página"],
  ["bloques", "bloques", "Bloques"],
  ["componentes", "biblioteca", "Recursos"],
  ["elementos", "elementos", "Elementos"],
  ["texto", "texto", "Texto"],
  ["audio", "audio", "Músicas"],
  ["imagenes", "imagen", "Imágenes"],
  ["video", "video", "Videos"],
  // Adornar
  ["stickers", "sticker", "Stickers"],
  ["gifs", "gif", "GIFs"],
  // Tocar
  ["toques", "toque", "Al tocar"],
  ["interactivo", "interactivo", "Interactivo"],
  // Avanzado
  ["diseno", "diseno", "Temas"],
  ["html", "html", "HTML"],
  ["3d", "cubo", "3D"],
  ["herramientas", "herramientas", "Herramientas"],
  // Dar vida a la página: en la barra de abajo (no en el riel)
  ["animar", "animar", "Animar"],
  ["efectos", "efectos", "Efectos"],
  ["transiciones", "transiciones", "Transiciones"],
];
// Separadores del riel: antes de cada una, un título chiquito.
const GRUPOS_RIEL = { stickers: "Adornar", toques: "Tocar", diseno: "Avanzado" };
// Lo que ya está en la barra de abajo no se repite en el riel.
const EN_LA_BARRA = new Set(["animar", "efectos", "transiciones"]);
// Nombres viejos que otros sitios todavía piden.
const ALIAS = { fotos: "imagenes", ajustes: "herramientas" };
// En el teléfono, estas secciones se abren en una hojita de abajo (compacta)
// para que la página se siga viendo: lo elegido, su efecto, su animación…
const HOJAS = new Set(["animar", "efectos", "transiciones", "gifs", "stickers", "toques"]);

const app = {};
app.rendimiento = RD;
window.EditorDev = app;

// Red de seguridad: un error suelto nunca deja el editor trabado. Suelta los
// toques que hubieran quedado «puestos», quita velos de ajuste, guarda y avisa
// (como mucho un aviso cada 10 s). Los errores de dentro de los HTML aislados
// no llegan aquí: no pueden romper el editor.
let ultimoError = 0;
function rescatar(motivo, avisar) {
  console.error("[editor]", motivo);
  try { app.lienzo?._limpiarToques?.(); } catch (e) { /* nada */ }
  document.body.classList.remove("ed-ajustando");
  for (const n of document.querySelectorAll(".ed-viendo")) n.classList.remove("ed-viendo");
  if (!avisar || Date.now() - ultimoError < 10000) return;
  ultimoError = Date.now();
  try { app.guardarYa?.(); } catch (e) { /* nada */ }
  aviso("Algo se trabó, pero ya lo solté. Tu trabajo está guardado.", 3200);
}
addEventListener("error", (ev) => { if (ev.error || ev.message) rescatar(ev.error || ev.message, true); });
addEventListener("unhandledrejection", (ev) => rescatar(ev.reason, false));

function guardarUltimo(id) { try { if (id) localStorage.setItem(ULTIMO, id); else localStorage.removeItem(ULTIMO); } catch (e) { /* nada */ } }
function leerUltimo() { try { return localStorage.getItem(ULTIMO); } catch (e) { return null; } }

async function arrancar() {
  guardasDeApp();
  aplicarPref();
  // Lo primero que se ve: el menú principal (el editor se carga por detrás).
  app.detallitos = new Detallitos(app);
  app.exportarMenu = new MenuExportar(app);
  app.menuPrincipal = new MenuPrincipal(app);
  app.menuPrincipal.abrir();
  vigilarPantalla();
  iniciarTacto();
  setTimeout(() => medirHz(), 1200); // con la página ya quieta, para medir bien
  // Iconos propios de assets/iconos/ (si hay), antes de pintar nada.
  await Promise.race([aplicarIconos().catch(() => 0), new Promise((r) => setTimeout(r, 700))]);
  const E = new Estado();
  Object.assign(app, { estado: E });
  app.bib = new Biblioteca(E);
  app.bib.alAviso = (t) => aviso(t, 3400);
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
  app.sonidos.conectarLienzo(app.lienzo);
  app.fx = new FxEditor(app);
  app.insp = new Inspector(app, $(".ed-insp"));
  app.paneles = new Paneles(app);
  app.paginas = new PanelPaginas(app);
  app.tiempo = new Linea(app, $(".ed-linea"));
  app.pro = new ModoPro(app); // la línea de tiempo, como un editor de vídeo (Fase 38)
  app.juntitos = new Juntitos(app); // Cositas Juntitos: «Nuestros días juntos» (Fase 38)
  app.barra = new BarraContextual(app, $(".ed-contexto"));
  app.lateral = new Lateral({ raiz: $(".ed-lateral"), riel: $(".ed-riel"), velo: $(".ed-velo"), alCambiar: (on) => { if (on) { cerrarHoja(); cerrarHojaSec(); } else app.audio?.detenerEscucha?.(); } });
  app.gifs = app.paneles;
  app.abrirSeccion = (id) => abrirSeccion(id, true);

  app.guardado = new IndicadorGuardado(app, $(".ed-guardado"));
  app.auto = new Autoguardado(E, (st, err) => {
    app.guardado.poner(st, err);
    // Un solo aviso por tanda de errores (los reintentos no repiten el aviso).
    if (st === "error" && !app._avisoError) { app._avisoError = true; aviso("No se pudo guardar. Tu última versión buena sigue intacta y lo nuevo se reintenta solo. Toca el indicador de guardado para más opciones.", 6000, "error"); }
    if (st === "guardado") { app._avisoError = false; NUBE.programar(); }
  });
  // Tu nube (M.YNTHN): lo guardado aquí sube solo unos segundos después, y se abre desde cualquier aparato.
  app.nube = NUBE;
  NUBE.conectar(app);

  construirBarra();
  construirRiel();
  atajos(app);
  app.salida = new Salida(app);
  app.ayuda = new Ayuda(app);
  app.config = new Configuracion(app);
  app.herramientas = new Herramientas(app);
  app.zonas = new EditorZonas(app);
  tactil();
  E.on("historial", pintarHistorial);
  E.on("proyecto", ({ ruta }) => { if (ruta === "nombre") pintarNombre(); });
  E.on("cargado", () => { pintarNombre(); pintarHistorial(); abrirSeccion(app.seccion || "elementos"); pintarPaginas(); });
  E.on("actual", () => { if (esMovil()) cerrarHoja(); pintarPaginas(); });
  E.on("paginas", pintarPaginas);

  // Al volver a abrir el editor: el último librito, tal como quedó (con sus redes de seguridad).
  const ultimo = leerUltimo();
  const r = ultimo ? await cargarSeguro(ultimo).catch(() => ({ P: null, notas: [] })) : { P: null, notas: [] };
  if (r.P) await app.abrirProyecto(r.P, r.notas.length > 0, r.notas);
  else await pantallaInicio(app);
  document.body.classList.add("listo");
  // Un enlace de emparejamiento (…/EditorDev/#servidor=https://…): se guarda la dirección de tu servidor.
  if (SRV.revisarEnlace()) aviso(`Conectado a ${SRV.NOMBRE}`, 3000);
}

/* ── Barra de arriba ─────────────────────────────────────────────────── */
/** «2/5»: la página en la que estás; abre Páginas. */
function pintarPaginas() {
  const E = app.estado, btn = $(".ed-paginas-b"), b = btn?.querySelector("span");
  if (!b || !E.proyecto) return;
  // Un montoncito de hojas (son páginas) con la que estás y cuántas hay.
  const i = Math.max(1, E.proyecto.orden.indexOf(E.paginaId) + 1), n = E.proyecto.orden.length;
  const ic = btn.querySelector(".ed-pg-ico");
  if (ic && !ic.firstChild) ic.innerHTML = ico("hojas");
  b.textContent = `${i}/${n}`;
  btn.setAttribute("aria-label", `Páginas: estás en la ${i} de ${n}`);
  btn.title = `Páginas del librito (${i} de ${n})`;
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
    if (e.pointerType !== "mouse" && e.target.closest?.("button, .ed-cb, [role=button]")) vibrar(6);
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
  // Mientras deslizas un control, su panel se vuelve translúcido (sólo queda
  // firme la fila que mueves): ves el objeto cambiar en la hoja, sin adivinar.
  const PANELES = ".ed-insp, .ed-panel, .ed-hojita, .ed-pop, .ed-hoja-sec, .ed-modal, .ed-dock-op, .ed-lateral";
  document.addEventListener("pointerdown", (e) => {
    const c = e.target.closest?.('input[type="range"], .ed-rango, .ed-num');
    const panel = c?.closest(PANELES);
    if (!panel) return;
    const fila = c.closest(".ed-fila, .ed-dock-rango, label") || c;
    const t = setTimeout(() => { panel.classList.add("ed-viendo"); fila.classList.add("ed-viendo-fila"); document.body.classList.add("ed-ajustando"); }, 120);
    const fin = () => {
      clearTimeout(t);
      panel.classList.remove("ed-viendo"); fila.classList.remove("ed-viendo-fila"); document.body.classList.remove("ed-ajustando");
      removeEventListener("pointerup", fin, true); removeEventListener("pointercancel", fin, true);
    };
    addEventListener("pointerup", fin, true);
    addEventListener("pointercancel", fin, true);
  }, true);
}
function construirBarra() {
  const E = app.estado;
  $(".ed-volver").innerHTML = ico("volver") + '<span class="ed-volver-t">Menú</span>';
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
  // «Más» (⋯), de lo más importante a lo menos. Lo que ya se ve arriba (en la compu) no se repite aquí;
  // en el teléfono, donde esos botones no caben, sí aparece.
  const escondido = (sel) => { const b = $(sel); return !b || getComputedStyle(b).display === "none"; };
  $(".ed-mas").addEventListener("click", (e) => menu(e.currentTarget, [
    { t: `${ico("detallito")}<span>Enviar Detallito</span><i class="ed-menu-chispa" aria-hidden="true"></i>`, clase: "ed-menu-destacado", al: () => app.detallitos.abrir($(".ed-mas")) },
    escondido(".ed-guardar") ? { t: `${ico("guardar")}<span>Guardar y borradores…</span>`, al: () => $(".ed-guardar").click() } : null,
    escondido(".ed-previa") ? { t: `${ico("biblioteca")}<span>Ver el librito entero</span>`, al: () => $(".ed-previa").click() } : null,
    { t: `${ico("compartir")}<span>Compartir por WhatsApp…</span>`, al: () => app.compartir() },
    escondido(".ed-exportar") ? { t: `${ico("exportar")}<span>Exportar…</span>`, al: () => app.exportarMenu.abrir() } : null,
    { t: `${ico("publicar")}<span>Páginas publicadas</span>`, al: () => abrirSeccion("publicadas", true) },
    escondido(".ed-ver") ? { t: `${ico("telefono")}<span>Ver como…</span>`, al: () => $(".ed-ver").click() } : null,
    { t: `${ico("escudo")}<span>Copias de seguridad…</span>`, al: () => app.guardado.abrir() },
    { t: `${ico("rayo")}<span>Revisar recursos…</span>`, al: () => app.revisarRecursos() },
    escondido(".ed-ajustes-b") ? { t: `${ico("tuerca")}<span>Configuración del editor</span>`, al: () => app.config.abrir() } : null,
    { t: `${ico("foco")}<span>Recorrido con la abejita</span>`, al: () => app.ayuda?.recorrido() },
  ]));
  $(".ed-deshacer").addEventListener("click", () => E.deshacer());
  $(".ed-rehacer").addEventListener("click", () => E.rehacer());
  $(".ed-previa").addEventListener("click", () => app.vista.abrir(Math.max(0, E.proyecto.orden.indexOf(E.paginaId)), { portadilla: false }));
  $(".ed-exportar").addEventListener("click", () => app.exportarMenu.abrir());
  const t = (i, x) => `${ico(i)}<span>${x}</span>`;
  $(".ed-guardar").addEventListener("click", (e) => menu(e.currentTarget, [
    { t: t("guardar", "Guardar borrador ahora"), al: () => app.guardarAMano() },
    { t: t("carpeta", "Abrir borrador…"), al: () => app.inicio() },
    { t: t("nuevo", "Empezar uno nuevo"), al: () => app.nuevo() },
    { t: t("subir", "Abrir archivo (.zip / .json)…"), al: () => app.abrirArchivo() },
    "-",
    { t: t("exportar", "Descargar página completa (.zip)"), al: () => app.exportar() },
    { t: t("compartir", "Compartir por WhatsApp…"), al: () => app.compartir() },
    { t: t("escudo", "Copias de seguridad…"), al: () => app.guardado.abrir() },
    { t: t("rayo", "Revisar recursos…"), al: () => app.revisarRecursos() },
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
  document.title = P.nombre + " · My Love Pages";
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
    if (id === "publicadas") continue; // Páginas publicadas: en el menú de los tres puntos (⋯)
    if (EN_LA_BARRA.has(id)) continue; // Animar, Efectos y Transición: en la barra de abajo (no se repiten)
    if (GRUPOS_RIEL[id]) riel.append(el("i.ed-riel-sep", { "aria-hidden": "true" }, [el("small", { text: GRUPOS_RIEL[id] })]));
    riel.append(el("button", { type: "button", dataset: { s: id }, title: n, "aria-label": n, onClick: () => {
      const activo = app.seccion === id;
      if (esMovil()) { if (activo && app.lateral.abierto) app.lateral.cerrar(); else abrirSeccion(id, true); } // (en hojita: abrirSeccion la cierra)
      else abrirSeccion(activo && !document.body.classList.contains("sin-panel") ? null : id, true);
    } }, [el("b", { html: ico(icono) }), el("span", { text: n })]));
  }
  $(".ed-panel-x").innerHTML = ico("cerrar");
  $(".ed-panel-x").addEventListener("click", () => { if (esMovil()) app.lateral.cerrar(); else abrirSeccion(null); });
  // El inspector en el teléfono: una hoja que sigue al dedo desde su asa de color.
  const insp = $(".ed-insp");
  const asaInsp = insp.querySelector(".ed-hoja-asa");
  asaInsp.className = "ed-asa-hoja";
  asaInsp.innerHTML = "<i></i>";
  hojaInsp = new Hoja(insp, { asa: asaInsp, puntos: [1, 0.55], cerrable: true, alAbrir: () => app.insp.alMostrar(), alCerrar: () => { if (document.body.dataset.hoja?.startsWith("insp:")) delete document.body.dataset.hoja; } });
  // Las secciones compactas del teléfono (Animar, Efectos, GIFs…): otra hoja, a media altura.
  const hs = $(".ed-hoja-sec");
  hs.querySelector(".ed-hoja-sec-x").innerHTML = ico("cerrar");
  hs.querySelector(".ed-hoja-sec-x").addEventListener("click", () => cerrarHojaSec());
  hojaSec = new Hoja(hs, {
    asa: hs.querySelector(".ed-asa-hoja"), agarres: [hs.querySelector(".ed-hoja-sec-cab h2")], puntos: [1, 0.62], cerrable: true,
    alCerrar: () => {
      document.body.classList.remove("con-hoja-sec");
      app.audio?.detenerEscucha?.();
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
    app.insp.alMostrar();
  });
  app.mostrarInspector = () => { if (esMovil()) { app.lateral.cerrar(); cerrarHojaSec(); abrirHoja("insp:" + app.insp.tab); } };
  app.cerrarHoja = cerrarHoja;
  app.cerrarHojaSec = cerrarHojaSec;
  app.cerrarHojaInsp = cerrarHoja;
  app.temaDeHoja = (pid) => import("./components/temas-hoja.js").then((m) => m.temaDeHoja(app, pid));
  // Un menú que se abre encima de lo elegido (teléfono): la hoja se corre para que se vea.
  addEventListener("ed-menu-abierto", (ev) => { const r = ev.detail; if (!r || !app.estado.sel.length) return; if (esMovil()) app.lienzo.mostrarSeleccion?.(innerHeight - r.top + 10); else app.lienzo.apartarDe?.(r); });
  app.alElegirPagina = () => { if (esMovil()) app.lateral.cerrar(); };
  app.alDibujar = () => { if (esMovil()) app.lateral.cerrar(); };
  // En el teléfono, lo recién añadido se ve en la hoja (no debajo del cajón).
  app.alAnadir = () => { if (esMovil() && !document.querySelector(".ed-modal-fondo")) app.lateral.cerrar(); };
}

/* Cada sección recuerda dónde ibas: al volver a ella (o al repintarse) sigue ahí, sin
   saltar arriba ni repetir la entrada escalonada (ésa, sólo la primera vez que se abre). */
const DESPLAZADO = new Map(), VISTAS = new Set();
function devolverDesplazado(cont, id) {
  // Se anota al desplazarse (pasivo: nunca obliga a recalcular el diseño al cambiar de sección).
  if (!cont._oyeDespl) { cont._oyeDespl = true; cont.addEventListener("scroll", () => { if (cont._sec) DESPLAZADO.set(cont._sec, cont.scrollTop); }, { passive: true }); }
  const y = DESPLAZADO.get(id) || 0;
  if (!y) return;
  cont.scrollTop = y;
  // Lo que carga después (miniaturas, listas de assets/) puede alargarla: se reintenta un ratito.
  let n = 0, tocado = false;
  const toca = () => { tocado = true; };
  cont.addEventListener("pointerdown", toca, { once: true, passive: true });
  cont.addEventListener("wheel", toca, { once: true, passive: true });
  const otra = () => { if (tocado || cont._sec !== id || cont.scrollTop >= y - 1 || ++n > 10) return; cont.scrollTop = y; setTimeout(otra, 120); };
  setTimeout(otra, 60);
}

function abrirSeccion(id, desdeUsuario) {
  id = ALIAS[id] || id;
  // Tocar otra vez lo que ya está abierto (en su hojita de abajo) lo cierra (Fase 39).
  if (desdeUsuario && id && esMovil() && HOJAS.has(id) && document.body.classList.contains("con-hoja-sec") && $(".ed-hoja-sec-cuerpo")?._sec === id) { cerrarHojaSec(); return; }
  // Lo que se estaba escuchando para al cambiar de pestaña (o al cerrarla).
  if (id !== app.seccion || !id) app.audio?.detenerEscucha?.();
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
    app.paneles.abrir(id, cuerpo);
    cuerpo._sec = id;
    devolverDesplazado(cuerpo, id);
    document.body.classList.add("con-hoja-sec");
    hojaSec.abrir(hojaSec.abierta ? 0 : 1);
    requestAnimationFrame(() => setTimeout(() => app.lienzo.mostrarSeleccion?.(hs.offsetHeight * 0.62 + 12), 320));
    return;
  }
  cerrarHojaSec();
  $(".ed-panel-titulo").innerHTML = `${ico(titulo[1])}<span>${titulo[2]}</span>`;
  app.paneles._limpiar?.();
  cont.textContent = "";
  if (id === "paginas") { app.paneles.actual = null; app.paginas.construir(cont); }
  else app.paneles.abrir(id, cont);
  // Lo de dentro entra escalonado sólo la primera vez que se abre la sección (no al volver ni al repintar).
  if (cont._sec !== id && !VISTAS.has(id)) {
    cont.classList.remove("entra"); void cont.offsetWidth; cont.classList.add("entra");
    clearTimeout(cont._entra); cont._entra = setTimeout(() => cont.classList.remove("entra"), 700);
  } else if (cont.classList.contains("entra") && cont._sec !== id) { clearTimeout(cont._entra); cont.classList.remove("entra"); }
  VISTAS.add(id);
  cont._sec = id;
  devolverDesplazado(cont, id);
  if (id === "animar" && !esMovil()) app.insp.abrir("animar"); // (la línea de tiempo es el modo profesional: se abre con «Tiempo»)
  if (esMovil() && desdeUsuario) app.lateral.abrir();
}

let hojaInsp = null, hojaSec = null;
function abrirHoja(id) { document.body.dataset.hoja = id; hojaInsp?.abrir(0); }
function cerrarHoja() { if (hojaInsp?.abierta) hojaInsp.cerrar(); delete document.body.dataset.hoja; }
function cerrarHojaSec() { if (hojaSec?.abierta) hojaSec.cerrar(); }

/* ── Proyectos ──────────────────────────────────────────────────────── */
app.abrirProyecto = async (P, guardar = false, notas = []) => {
  P = normalizar(P);
  RT.registrarExtras?.(P.ajustes); // sus animaciones y transiciones propias
  registrarFuentes(P.ajustes.fuentesExtra);
  await asegurarBotones(P); // las flechas siempre salen de assets/deslizar/
  if (!P.orden.length) { const pg = nuevaPagina(P, { nombre: "Portada" }); P.paginas[pg.id] = pg; P.orden.push(pg.id); }
  await app.bib.preparar(P);
  // Si no se pudo guardar ahora, nada se pierde: queda marcado y el autoguardado reintenta.
  let porGuardar = false;
  if (guardar) await guardarTodo(P).then(() => quitarRescate(P.id), () => { porGuardar = true; });
  app.vista.cerrar();
  app.tiempo.parar(false);
  app.estado.cargar(P);
  guardarUltimo(P.id);
  quitarInicio();
  if (porGuardar) { app.estado.sucio = { meta: true, paginas: new Set(P.orden), borradas: new Set() }; app.auto.programar(); }
  if (notas.length) { const t = notas.join("; "); aviso("Tu librito está a salvo: " + t + (/[.!]$/.test(t) ? "" : "."), 6000); }
};

app.abrir = async (id) => {
  if (app.auto.pendiente) await app.auto.ahora();
  const { P, notas } = await cargarSeguro(id);
  if (!P) { aviso("No se encontró ese borrador"); return app.inicio(); }
  await app.abrirProyecto(P, notas.length > 0, notas);
};

app.nuevo = async (nombre, formato = "movil", { portada = "portada", imagen = null } = {}) => {
  if (app.auto.pendiente) await app.auto.ahora();
  if (!nombre) { pantallaInicio(app, { cerrable: !!app.estado.proyecto }); return; }
  const P = nuevoProyecto(nombre, formato);
  if (formato === "auto" && matchMedia("(pointer: coarse)").matches) { const t = tamAuto(); P.ajustes.ancho = t.w; P.ajustes.alto = t.h; }
  const pg = (PLANTILLAS.find((t) => t.id === portada && t.cat === "portadas") || PLANTILLAS.find((t) => t.id === "portada")).crear(P);
  pg.nombre = "Portada";
  P.paginas[pg.id] = pg;
  P.orden.push(pg.id);
  P.ajustes.portada = pg.id;
  await app.abrirProyecto(P, true);
  RT.cargarFuentes(pg.els.map((e) => e.texto?.fuente));
  // Tu propia imagen: va al hueco de foto de la portada (o de fondo si no tiene).
  if (imagen) {
    try {
      const [a] = await app.bib.subir([imagen]);
      const pag = app.estado.proyecto.paginas[pg.id];
      const hueco = a && pag.els.find((e) => e.tipo === "imagen" && !e.imagen?.asset);
      if (hueco) app.estado.setEl(hueco.id, { "imagen.asset": a.id }, "Foto de portada", null, pg.id);
      else if (a) app.estado.setPag({ fondo: { ...(pag.fondo || {}), imagen: { asset: a.id, ajuste: "cover", pos: "center", opacidad: 1 } } }, "Foto de portada", null, pg.id);
    } catch (e) { aviso("No se pudo poner tu imagen: tócala en la portada para elegirla otra vez", 4000, "error"); }
  }
  aviso("Tu librito nuevo. Empieza tocando cualquier cosa de la portada");
};

app.inicio = async (op = {}) => {
  if (app.auto.pendiente) await app.auto.ahora();
  pantallaInicio(app, { cerrable: !!app.estado.proyecto, a: op.a });
};

app.guardarYa = async () => {
  await app.auto.ahora();
  if (!app.auto.error) { app.sonidos?.sonar("guardar"); dispatchEvent(new CustomEvent("ed-evento", { detail: "guardado" })); }
  aviso(app.auto.error ? "Error al guardar: tu última versión buena sigue intacta" : "Guardado correctamente", 2600, app.auto.error ? "error" : "");
};

/* Guardar A MANO (Guardar, Ctrl+S): además del borrador, lo sube ya a tu nube de
   M.YNTHN y deja ahí una copia (no más de una por minuto) si tienes la sesión abierta. */
let subiendoCopia = false, ultimaCopia = 0;
app.guardarAMano = async () => {
  await app.guardarYa();
  const P = app.estado.proyecto;
  if (!SRV.conectado() || app.auto.error || subiendoCopia || !P) return;
  if (NUBE.quitado(P.id) || !NUBE.esMio(P.id) || Date.now() - ultimaCopia < 60000) { NUBE.programar(800); return; }
  subiendoCopia = true;
  try {
    const r = await NUBE.guardarCopia();
    ultimaCopia = Date.now();
    if (r) aviso(`También quedó en tu nube de ${SRV.NOMBRE} (${r.copias} ${r.copias === 1 ? "copia" : "copias"} de este librito)`, 3600);
  } catch (e) { aviso(`Quedó guardado en este aparato, pero no se pudo subir a ${SRV.NOMBRE}: ${e.message}`, 5000, "error"); }
  finally { subiendoCopia = false; }
};

/* El latido: cada tanto se le pregunta a M.YNTHN si tu amorcito te mandó un detallito. */
app.amorNuevos = 0;
// (Una sola vez a la vez: si un latido sigue en camino, el siguiente lo reutiliza.)
const latir = () => RD.unaVez("latido", latirYa);
async function latirYa() {
  if (!SRV.conectado() || document.hidden) return;
  try {
    const r = await SRV.latido();
    // Sólo lo que se ve (el «visto hace…» cambia en cada latido y no debe repintar nada).
    const firma = (p) => (p ? [p.usuario, !!p.en_linea, p.nombre, p.foto_v, p.novios, p.cumple].join("|") : "");
    const antes = app.amorNuevos, parejaAntes = firma(app.pareja), rxAntes = app.amorReacciones || 0, chatAntes = app.amorChat || 0;
    app.amorNuevos = r.nuevos || 0;
    app.amorReacciones = r.reacciones || 0;
    app.amorChat = r.chat || 0;
    PUSH.insignia(app.amorNuevos + app.amorChat + app.amorReacciones);
    app.pareja = r.pareja;
    PF.poner({ pareja: r.pareja || null });
    // El globito va en Exportar y en «Más» (en el teléfono, Exportar vive dentro de «Más»).
    // El globito se cambia en su lugar (quitarlo y ponerlo cada latido lo hacía parpadear).
    for (const b of [$(".ed-exportar"), $(".ed-mas")]) {
      if (!b) continue;
      const g = b.querySelector(".dt-globo"), n = String(app.amorNuevos);
      if (!app.amorNuevos) g?.remove();
      else if (!g) b.append(el("i.dt-globo", { text: n }));
      else if (g.textContent !== n) g.textContent = n;
    }
    if (app.amorNuevos > antes) {
      app.sonidos?.sonar("exito");
      const desde = () => [$(".ed-exportar"), $(".ed-mas")].find((b) => b?.offsetParent);
      aviso(`${PF.nombreDe(r.pareja) || "Tu amorcito"} te mandó una página`, 7000, "", { t: "Verla", al: () => app.detallitos.abrir(desde(), "coleccion") });
    }
    // Reaccionó a una de tus páginas (sólo se avisa si la colección no está abierta: ahí ya se ve).
    if (app.amorReacciones > rxAntes && !(app.detallitos.abierto && app.detallitos.actual === "coleccion")) {
      app.sonidos?.sonar("brillo");
      aviso(`${PF.nombreDe(r.pareja) || "Tu amorcito"} reaccionó a tu página`, 7000, "", { t: "Verla", al: () => app.detallitos.abrir(null, "coleccion") });
    }
    // Un mensajito nuevo (si el chat no está abierto: ahí ya llegó solo).
    if (app.amorChat > chatAntes && !(app.detallitos.abierto && app.detallitos.actual === "chat") && prefChat().avisos) {
      app.sonidos?.sonar("mensaje-llega");
      app.avisoChat = aviso(`${PF.nombreDe(r.pareja) || "Tu amorcito"} te mandó ${app.amorChat - chatAntes === 1 ? "un mensajito" : "mensajitos"}`, 7000, "", { t: "Verlos", al: () => app.detallitos.abrir(null, "chat") });
    }
    if (app.amorNuevos !== antes || app.amorReacciones !== rxAntes || app.amorChat !== chatAntes || firma(app.pareja) !== parejaAntes) dispatchEvent(new CustomEvent("ed-amor"));
  } catch (e) { /* sin conexión: la próxima */ }
}
setTimeout(latir, 4000);
/* Notificaciones push (Fase 33): el ayudante de fondo se registra y, si ya estaban prendidas, el servidor
   se pone al día. Tocar una notificación abre el chat o Detallitos (con el editor abierto o cerrado). */
const abrirAviso = (u) => {
  if (!SRV.conectado()) return;
  if (u === "#chat") app.detallitos.abrir(null, "chat");
  else if (u === "#detallitos") app.detallitos.abrir(null, "coleccion");
  else if (u === "#cositas") app.juntitos.abrir("cositas");
  else if (u === "#cositas-mapa") app.juntitos.abrir("mapa");
};
setTimeout(() => PUSH.registrar().then(() => PUSH.alDia()), 2500);
addEventListener("ed-cuenta", () => setTimeout(() => PUSH.alDia(), 400));
navigator.serviceWorker?.addEventListener("message", (e) => { if (e.data?.tipo === "aviso-abrir") abrirAviso(e.data.u); });
const desdeAviso = (espera) => {
  if (!/^#(chat|detallitos|cositas|cositas-mapa)$/.test(location.hash)) return;
  const u = location.hash;
  history.replaceState(history.state, "", location.pathname + location.search);
  setTimeout(() => abrirAviso(u), espera);
};
desdeAviso(1600);
addEventListener("hashchange", () => desdeAviso(0));
RD.cada(latir, 25000); // con la página oculta no despierta al aparato
// La ubicación sólo sigue compartiéndose si TÚ lo decidiste antes (y sólo con la app a la vista).
setTimeout(() => UB.iniciar(), 3000);
addEventListener("ed-cuenta", () => setTimeout(latir, 300));
addEventListener("ed-detallito-visto", () => setTimeout(latir, 300));
addEventListener("ed-chat-visto", () => setTimeout(latir, 300));
document.addEventListener("visibilitychange", () => { if (!document.hidden) latir(); });

/** Duplica un librito (o, con `desde`, una copia completa guardada) como uno nuevo, aparte. */
app.duplicarProyecto = async (id, op = {}) => {
  if (app.auto.pendiente) await app.auto.ahora();
  const P = clonar(op.desde || (id ? await cargar(id) : app.estado.proyecto));
  if (!P) return;
  P.id = uid("lib");
  P.nombre = op.nombre || P.nombre + " (copia)";
  P.creado = P.editado = Date.now();
  delete P.rev; delete P.guardado;
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
  if (!id || op.abrir) { await app.abrirProyecto(P); aviso(op.aviso || "Ahora estás en la copia", 4000); }
};

/** Abre una copia completa automática como un librito aparte (el original no se toca). */
app.abrirCopia = async (lib, hueco, t) => {
  const p = await leerCopia(lib, hueco).catch(() => null);
  if (!p) { aviso("Esa copia no está entera; prueba con otra", 3500, "error"); return; }
  const hora = new Date(t || p.guardado || Date.now()).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  await app.duplicarProyecto(lib, { desde: p, abrir: true, nombre: `${p.nombre} (copia ${hora})`, aviso: "Abrí la copia como un librito aparte: el original sigue igual" });
};

app.borrarProyecto = async () => {
  const id = app.estado.proyecto.id;
  app.auto.descartar();
  await borrar(id);
  borrarCopias(id).catch(() => {});
  quitarRescate(id);
  guardarUltimo(null);
  app.estado.proyecto = null;
  pantallaInicio(app);
};

app.abrirArchivo = async (archivo) => {
  const [f] = archivo ? [archivo] : await elegirArchivos({ accept: ".zip,.json,application/zip,application/json", multiple: false });
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

/**
 * «Mis libritos» (Fase 33): copias de seguridad. Importar trae la copia de TODOS tus datos (vuelven los
 * borradores que no estén aquí) o la de un solo librito (se abre como borrador nuevo).
 */
app.importarCopia = async () => {
  const [f] = await elegirArchivos({ accept: ".zip,.json,application/zip,application/json", multiple: false });
  if (!f) return;
  if (!/\.zip$/i.test(f.name) && f.type !== "application/zip") return app.abrirArchivo(f);
  const t = el("p", { text: "Leyendo la copia…" });
  const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("b", { text: "Importando copia de seguridad" }), t])]);
  document.body.append(capa);
  try {
    const [{ leerZip }, C] = await Promise.all([import("./export/zip.js"), import("./storage/copia-total.js")]);
    const zip = await leerZip(f);
    if (!C.esCopiaDeTodo(zip)) { capa.remove(); return app.abrirArchivo(f); }
    const r = await C.restaurarTodo(zip, (x) => { t.textContent = x; });
    app.sonidos?.sonar("exito");
    aviso(r.nuevos ? `Volvieron ${r.nuevos} ${r.nuevos === 1 ? "borrador" : "borradores"}${r.estaban ? ` (${r.estaban} ya estaban aquí)` : ""} 💗` : `Ya tenías todos los de esa copia (${r.estaban})`, 5000);
    app.inicio({ a: "borradores" });
  } catch (e) { aviso("No se pudo importar: " + e.message, 5000, "error"); }
  finally { capa.remove(); }
};
app.copiaDeTodo = async () => {
  if (app.auto.pendiente) await app.auto.ahora();
  const t = el("p", { text: "Juntando tus borradores…" });
  const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("b", { text: "Haciendo la copia de seguridad" }), t])]);
  document.body.append(capa);
  try {
    const [C, { descargar }] = await Promise.all([import("./storage/copia-total.js"), import("./export/exportar.js")]);
    const r = await C.copiaDeTodo((x) => { t.textContent = x; });
    if (!r.n) { aviso("Todavía no hay borradores para guardar", 3500); return; }
    const dia = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
    descargar(r.blob, `Mis libritos (copia de seguridad ${dia}).zip`);
    app.sonidos?.sonar("exito");
    aviso(`Copia de seguridad lista: ${r.n} ${r.n === 1 ? "borrador" : "borradores"} 💗 Guárdala donde quieras.`, 5000);
  } catch (e) { aviso("No se pudo hacer la copia: " + e.message, 5000, "error"); }
  finally { capa.remove(); }
};

/** Compartir (WhatsApp y otras apps, con el menú del teléfono) y revisar recursos. */
app.compartir = () => import("./components/compartir.js").then((m) => m.abrirCompartir(app));
app.revisarRecursos = () => import("./components/recursos.js").then((m) => m.abrirRecursos(app));

app.exportar = async ({ completo = false } = {}) => {
  if (app.auto.pendiente) await app.auto.ahora();
  const t = el("p", { text: "Juntando todo…" });
  const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("b", { text: "Exportando tu librito" }), t])]);
  document.body.append(capa);
  try {
    const { exportar, descargar } = await import("./export/exportar.js");
    const r = await exportar(app, { completo, alProgreso: (x) => { t.textContent = x; }, deLaNube: NUBE.originalDeLaNube });
    if (completo) try { localStorage.setItem("editordev:copia-descargada:" + app.estado.proyecto.id, String(Date.now())); } catch (e) { /* nada */ }
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
