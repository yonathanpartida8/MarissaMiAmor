/**
 * CREAR LIBRITO — arranque del editor.
 *
 * Aquí sólo se conectan las piezas; cada una vive en su carpeta:
 *
 *   core/        el modelo y el estado (la única puerta para cambiar algo)
 *   history/     deshacer y rehacer
 *   storage/     borradores en IndexedDB y autoguardado
 *   assets/      biblioteca de archivos, fotos optimizadas, dibujos, el librito de siempre
 *   canvas/      el lienzo: zoom, selección, manijas, imán, guías, reglas
 *   pages/       la lista de páginas
 *   templates/   plantillas ligeras
 *   animations/  la línea de tiempo
 *   html/        el editor de HTML aislado y el importador de páginas
 *   export/      el .zip (escribir y leer)
 *   components/  inspector, paneles, vista previa, inicio, atajos, piezas de interfaz
 *   runtime/     el reproductor: lo usan el lienzo, la vista previa y el .zip
 */
import { el, aviso, modal, boton, esMovil, menu } from "./components/ui.js";
import { Estado } from "./core/estado.js";
import { nuevoProyecto, nuevaPagina, nuevoEl, normalizar, clonar, uid } from "./core/modelo.js";
import { Biblioteca, elegirArchivos } from "./assets/biblioteca.js";
import { Autoguardado } from "./storage/autoguardado.js";
import { cargar, guardarTodo, borrar, leerArchivo, guardarArchivo } from "./storage/db.js";
import { Lienzo } from "./canvas/lienzo.js";
import { Acciones } from "./components/acciones.js";
import { Inspector } from "./components/inspector.js";
import { Paneles } from "./components/paneles.js";
import { PanelPaginas } from "./pages/panel.js";
import { Linea } from "./animations/linea.js";
import { EditorHtml } from "./html/editorHtml.js";
import { Importador, registrarFuentes } from "./html/importar.js";
import { Vista } from "./components/vista.js";
import { pantallaInicio } from "./components/inicio.js";
import { atajos } from "./components/teclado.js";
import { PLANTILLAS } from "./templates/plantillas.js";
import { BarraContextual } from "./components/barra.js";
import { ico } from "./components/iconos.js";

const RT = window.LibritoRT;
const ULTIMO = "editordev:ultimo";
const $ = (s) => document.querySelector(s);

const SECCIONES = [
  ["paginas", "paginas", "Páginas"],
  ["elementos", "elementos", "Elementos"],
  ["texto", "texto", "Texto"],
  ["fotos", "fotos", "Fotos"],
  ["componentes", "componentes", "Componentes"],
  ["audio", "audio", "Audio"],
  ["animar", "animar", "Animar"],
  ["diseno", "diseno", "Tema"],
  ["transiciones", "transiciones", "Transiciones"],
  ["html", "html", "HTML"],
  ["ajustes", "ajustes", "Ajustes"],
];

const app = {};
window.EditorDev = app;

function guardarUltimo(id) { try { if (id) localStorage.setItem(ULTIMO, id); else localStorage.removeItem(ULTIMO); } catch (e) { /* nada */ } }
function leerUltimo() { try { return localStorage.getItem(ULTIMO); } catch (e) { return null; } }

async function arrancar() {
  const E = new Estado();
  Object.assign(app, { estado: E });
  app.bib = new Biblioteca(E);
  app.acciones = new Acciones(app);
  app.html = new EditorHtml(app);
  app.importar = new Importador(app);
  app.vista = new Vista(app);
  app.plantilla = (id) => PLANTILLAS.find((t) => t.id === id).crear(E.proyecto);

  app.lienzo = new Lienzo(app, $(".ed-centro"));
  app.insp = new Inspector(app, $(".ed-insp"));
  app.paneles = new Paneles(app);
  app.paginas = new PanelPaginas(app);
  app.tiempo = new Linea(app, $(".ed-linea"));
  app.barra = new BarraContextual(app, $(".ed-contexto"));
  app.abrirSeccion = (id) => abrirSeccion(id, true);

  const estadoGuardado = $(".ed-guardado");
  app.auto = new Autoguardado(E, (st) => {
    estadoGuardado.dataset.st = st;
    estadoGuardado.textContent = st === "guardando" ? "● Guardando…" : st === "error" ? "⚠ No se pudo guardar" : "✓ Guardado";
    if (st === "error") aviso("No se pudo guardar en este navegador (¿sin espacio?). Exporta el .zip para no perder nada.", 5000, "error");
  });

  construirBarra();
  construirRiel();
  atajos(app);
  E.on("historial", pintarHistorial);
  E.on("proyecto", ({ ruta }) => { if (ruta === "nombre") pintarNombre(); });
  E.on("cargado", () => { pintarNombre(); pintarHistorial(); abrirSeccion(app.seccion || (esMovil() ? null : "paginas")); });
  E.on("actual", () => { if (esMovil()) cerrarHoja(); });

  const ultimo = leerUltimo();
  const P = ultimo ? await cargar(ultimo).catch(() => null) : null;
  if (P) await app.abrirProyecto(P);
  else await pantallaInicio(app);
  document.body.classList.add("listo");
}

/* ── Barra de arriba ─────────────────────────────────────────────────── */
function construirBarra() {
  const E = app.estado;
  // Los iconos a crayón de la barra de arriba.
  $(".ed-deshacer").innerHTML = ico("deshacer");
  $(".ed-rehacer").innerHTML = ico("rehacer");
  $(".ed-guardar").innerHTML = ico("guardar");
  $(".ed-previa").insertAdjacentHTML("afterbegin", ico("play"));
  $(".ed-exportar").insertAdjacentHTML("afterbegin", ico("exportar"));
  const nombre = $(".ed-nombre input");
  nombre.addEventListener("change", () => { const n = nombre.value.trim(); if (n) E.setProy({ nombre: n }, "Nombre"); });
  nombre.addEventListener("keydown", (e) => { if (e.key === "Enter") nombre.blur(); e.stopPropagation(); });
  $(".ed-deshacer").addEventListener("click", () => E.deshacer());
  $(".ed-rehacer").addEventListener("click", () => E.rehacer());
  $(".ed-previa").addEventListener("click", () => app.vista.abrir(Math.max(0, E.proyecto.orden.indexOf(E.paginaId)), { portadilla: false }));
  $(".ed-exportar").addEventListener("click", () => app.exportar());
  $(".ed-guardar").addEventListener("click", (e) => menu(e.currentTarget, [
    { t: "💾 Guardar borrador ahora", al: () => app.guardarYa() },
    { t: "📂 Abrir borrador…", al: () => app.inicio() },
    { t: "🆕 Empezar uno nuevo", al: () => app.nuevo() },
    { t: "📥 Abrir archivo (.zip / .json)…", al: () => app.abrirArchivo() },
    "-",
    { t: "📦 Exportar ZIP", al: () => app.exportar() },
  ]));
  const zoom = $(".ed-zoom");
  zoom.addEventListener("change", () => { const v = zoom.value; app.lienzo.zoom(v === "ajustar" ? "ajustar" : +v); zoom.value = ""; });
  app.alZoom = (v) => { $(".ed-zoom option[value='']").textContent = v.ajustar ? "Ajustar" : Math.round(v.z * 100) + "%"; };
}

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

/* ── Riel, paneles y hojas (en el teléfono) ──────────────────────────── */
function construirRiel() {
  const riel = $(".ed-riel");
  const tabs = $(".ed-tabs");
  for (const [id, icono, n] of SECCIONES) {
    riel.append(el("button", { type: "button", dataset: { s: id }, title: n, onClick: () => abrirSeccion(app.seccion === id && !esMovil() ? null : id, true) }, [el("b", { html: ico(icono) }), el("span", { text: n })]));
  }
  const movil = [["paginas", "paginas", "Páginas"], ["elementos", "elementos", "Elementos"], ["texto", "texto", "Texto"], ["fotos", "fotos", "Fotos"], ["componentes", "componentes", "Piezas"], ["mas", "mas", "Más"]];
  for (const [id, icono, n] of movil) {
    tabs.append(el("button", { type: "button", dataset: { s: id }, onClick: (e) => {
      if (id === "mas") {
        menu(e.currentTarget, [
          { t: "🎵 Audio y música", al: () => abrirSeccion("audio", true) },
          { t: "✨ Animar", al: () => abrirSeccion("animar", true) },
          { t: "🎨 Diseño del elemento", al: () => { app.insp.abrir("diseno"); abrirHoja("insp:diseno"); } },
          { t: "☰ Capas", al: () => { app.insp.abrir("capas"); abrirHoja("insp:capas"); } },
          { t: "🌸 Tema y letras", al: () => abrirSeccion("diseno", true) },
          { t: "🎞️ Transiciones", al: () => abrirSeccion("transiciones", true) },
          { t: "</> HTML", al: () => abrirSeccion("html", true) },
          { t: "⏱ Línea de tiempo", al: () => app.tiempo.alternar() },
          { t: "⚙️ Ajustes y exportar", al: () => abrirSeccion("ajustes", true) },
        ]);
        return;
      }
      const activo = document.body.dataset.hoja === id;
      if (activo) { cerrarHoja(); return; }
      if (id.startsWith("insp:")) { app.insp.abrir(id.slice(5)); abrirHoja(id); }
      else abrirSeccion(id, true);
    } }, [el("b", { html: ico(icono) }), el("span", { text: n })]));
  }
  // El asa: tocarla o arrastrarla hacia abajo cierra la hoja.
  let y0 = null;
  for (const asa of document.querySelectorAll(".ed-hoja-asa")) {
    asa.addEventListener("click", cerrarHoja);
    asa.addEventListener("pointerdown", (e) => { y0 = e.clientY; });
  }
  addEventListener("pointerup", (e) => { if (y0 != null && e.clientY - y0 > 60) cerrarHoja(); y0 = null; });
  app.mostrarInspector = () => { if (esMovil()) abrirHoja("insp:" + app.insp.tab); };
  app.alElegirPagina = () => { if (esMovil()) cerrarHoja(); };
  app.alDibujar = () => { if (esMovil()) cerrarHoja(); };
  // En el teléfono, lo recién añadido se ve en la hoja (no debajo del panel).
  app.alAnadir = () => { if (esMovil() && !document.querySelector(".ed-modal-fondo")) cerrarHoja(); };
}

function abrirSeccion(id, desdeUsuario) {
  app.seccion = id;
  const cont = $(".ed-panel-cuerpo");
  for (const b of document.querySelectorAll(".ed-riel button")) b.classList.toggle("on", b.dataset.s === id);
  document.body.classList.toggle("sin-panel", !id);
  if (!id) { if (esMovil()) cerrarHoja(); return; }
  const titulo = SECCIONES.find((s) => s[0] === id);
  $(".ed-panel-titulo").innerHTML = `${ico(titulo[1])}<span>${titulo[2]}</span>`;
  cont.textContent = "";
  cont.scrollTop = 0;
  if (id === "animar") {
    app.insp.abrir("animar");
    if (!esMovil()) app.tiempo.alternar(true);
    cont.append(el("p.ed-ayuda", { text: "Elige un elemento en la hoja y dale su entrada, su bucle, su salida o una animación propia (a la derecha). Abajo está la línea de tiempo." }));
    cont.append(boton("▶ Probar la página", () => app.tiempo.probar(), "primario"), boton("⏱ Línea de tiempo", () => app.tiempo.alternar(), "chico"));
    if (esMovil() && desdeUsuario) abrirHoja("insp:animar");
    return;
  }
  if (id === "paginas") { app.paneles.actual = null; app.paginas.construir(cont); }
  else app.paneles.abrir(id, cont);
  if (esMovil() && desdeUsuario) abrirHoja(id);
}

function abrirHoja(id) {
  document.body.dataset.hoja = id;
  for (const b of document.querySelectorAll(".ed-tabs button")) b.classList.toggle("on", b.dataset.s === id);
}

function cerrarHoja() {
  delete document.body.dataset.hoja;
  for (const b of document.querySelectorAll(".ed-tabs button")) b.classList.remove("on");
}

/* ── Proyectos ──────────────────────────────────────────────────────── */
app.abrirProyecto = async (P, guardar = false) => {
  P = normalizar(P);
  registrarFuentes(P.ajustes.fuentesExtra);
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
  const pg = PLANTILLAS.find((t) => t.id === "portada").crear(P);
  pg.nombre = "Portada";
  P.paginas[pg.id] = pg;
  P.orden.push(pg.id);
  P.ajustes.portada = pg.id;
  await app.abrirProyecto(P, true);
  RT.cargarFuentes(pg.els.map((e) => e.texto?.fuente));
  aviso("Tu librito nuevo 🤍 Empieza tocando cualquier cosa de la portada");
};

app.inicio = async () => {
  if (app.auto.pendiente) await app.auto.ahora();
  pantallaInicio(app, { cerrable: !!app.estado.proyecto });
};

app.guardarYa = async () => {
  await app.auto.ahora();
  aviso(app.auto.error ? "No se pudo guardar 😟" : "Borrador guardado ✓");
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
  const capa = el("div.ed-ocupado", {}, [el("div", {}, [el("i.ed-girando"), el("b", { text: "📦 Exportando tu librito" }), t])]);
  document.body.append(capa);
  try {
    const { exportar, descargar } = await import("./export/exportar.js");
    const r = await exportar(app, { alProgreso: (x) => { t.textContent = x; } });
    descargar(r.blob, r.nombre);
    const mb = (r.blob.size / 1024 / 1024).toFixed(1);
    aviso(`Listo: ${r.nombre} · ${mb} MB · ${r.archivos} archivos`, 4500);
    if (r.faltan.length) aviso("No se encontraron: " + r.faltan.join(", "), 6000, "error");
  } catch (e) {
    console.error(e);
    aviso("No se pudo exportar: " + e.message, 5000, "error");
  } finally { capa.remove(); }
};

/** Cambiar el tamaño de la hoja (y, si se quiere, acomodar lo que ya hay). */
app.cambiarTamano = async (w, h, formato) => {
  const E = app.estado;
  const P = E.proyecto;
  const { ancho: W, alto: H } = P.ajustes;
  if (w === W && h === H) { E.setProy({ "ajustes.formato": formato }, "Tamaño"); return; }
  const hay = P.orden.some((pid) => P.paginas[pid].els.length);
  let escalar = false;
  if (hay) {
    const r = await modal({ titulo: "Nuevo tamaño de hoja", ancho: 440, contenido: el("p", { text: `De ${W}×${H} a ${w}×${h}. ¿Acomodo lo que ya hay al nuevo tamaño?` }), acciones: [["Cancelar", null], ["Dejarlo igual", "no"], ["Acomodar", "si", "primario"]] });
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
};

app.dejarDeDibujar = () => {
  app.lienzo.lapiz(null);
  document.querySelectorAll(".ed-btn.on").forEach((b) => { if (/Dibujar/.test(b.textContent)) b.classList.remove("on"); });
};

void nuevoEl;
arrancar().catch((e) => {
  console.error(e);
  document.body.append(el("p.ed-fallo", { text: "El editor no pudo arrancar: " + e.message }));
});
