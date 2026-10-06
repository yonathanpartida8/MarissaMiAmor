/**
 * EL MODELO — cómo es un librito por dentro.
 *
 *   proyecto
 *     ajustes     nombre, tamaño de la hoja, tema, transición y música global,
 *                 cómo se reproduce, cuál es la portada
 *     orden       los ids de las páginas, en orden
 *     paginas     { id: página }
 *     assets      { id: { tipo, nombre, mime, tam, w, h, fuente, ruta } }
 *                 (el archivo de las fotos subidas vive aparte, en IndexedDB)
 *     editor      cuadrícula, guías, imán… lo que sólo le importa al editor
 *
 *   página = { id, nombre, fondo, transicion, musica, duracion, els: [ … ] }
 *            `els` va de atrás hacia delante: el último es el que se ve encima.
 *
 *   elemento = { id, tipo, nombre, x, y, w, h, rot, opacidad, bloqueado, oculto,
 *                caja, anim, accion, origen, [tipo]: { lo propio de su tipo },
 *                permisos  { mover, tamano, rotar, seleccionar, interactuar, fuera, proporcion }
 *                          (lo que falte = permitido; proporcion: null = según el tipo)
 *                ancla     { h: auto|izq|centro|der|estirar, v: auto|arriba|centro|abajo|estirar }
 *                          (sólo cuenta con la hoja «Automática»)
 *                tiempo    { inicio, fin } ms en la línea de tiempo (fin null = se queda) }
 *
 * Todo es JSON plano: se guarda tal cual, se exporta tal cual y el
 * reproductor lo pinta tal cual.
 */

export const VERSION = 1;

export const FORMATOS = {
  // «Automática»: el tamaño sale de la pantalla en la que se elige (es la
  // zona segura) y en cada teléfono, tableta u orientación la hoja se adapta.
  auto: { n: "Automática (se adapta a cada pantalla)", w: 0, h: 0, auto: true },
  movil: { n: "Teléfono", w: 390, h: 844 },
  movilAlto: { n: "Teléfono grande", w: 430, h: 932 },
  tableta: { n: "Tableta", w: 768, h: 1024 },
  cuadrado: { n: "Cuadrado", w: 600, h: 600 },
  horizontal: { n: "Horizontal", w: 960, h: 540 },
};

/** `ico` = nombre del icono (components/iconos.js). */
export const TIPOS = {
  texto: { n: "Texto", ico: "texto" },
  imagen: { n: "Foto", ico: "imagen" },
  forma: { n: "Forma", ico: "forma" },
  dibujo: { n: "Dibujo", ico: "dibujo" },
  trazo: { n: "Trazo a mano", ico: "lapiz" },
  boton: { n: "Botón", ico: "boton" },
  album: { n: "Álbum", ico: "album" },
  carrusel: { n: "Carrusel", ico: "carrusel" },
  video: { n: "Vídeo", ico: "video" },
  html: { n: "HTML", ico: "html" },
  pagina: { n: "Página original", ico: "pagina" },
  componente: { n: "Componente", ico: "componentes" },
  escena3d: { n: "Escena 3D", ico: "cubo" },
};

/** Tamaño de la zona segura para «Automática», según la pantalla. */
export function tamAuto(vw = innerWidth, vh = innerHeight) {
  const k = 390 / Math.max(1, Math.min(vw, vh));
  return { w: Math.round(vw * k), h: Math.round(vh * k) };
}

/** ¿Se permite? (lo que no está puesto, sí). */
export const permite = (e, k) => !(e && e.permisos && e.permisos[k] === false);

export function uid(prefijo = "e") {
  const r = crypto.getRandomValues(new Uint32Array(2));
  return prefijo + "_" + r[0].toString(36) + r[1].toString(36).slice(0, 3);
}

export const clonar = (o) => (o == null ? o : typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

export function nuevoProyecto(nombre = "Mi librito", formato = "movil") {
  const f = FORMATOS[formato] || FORMATOS.movil;
  const p = {
    v: VERSION,
    id: uid("lib"),
    nombre,
    creado: Date.now(),
    editado: Date.now(),
    ajustes: {
      formato,
      ancho: f.w,
      alto: f.h,
      tema: { fondo: "#fff6f1", texto: "#3a2440", acento: "#d8397a", fuente: "Cormorant Garamond", fuenteTitulos: "Cormorant Garamond" },
      transicion: { tipo: "fundido", dur: 700, dir: "auto", facil: "entraSale" },
      musica: { asset: null, volumen: 0.7, bucle: true },
      reproduccion: { flechas: true, progreso: true, deslizar: true, indice: true, tocarParaEmpezar: true, alFinal: "quedarse", autoAvance: 0 },
      portada: null,
    },
    orden: [],
    paginas: {},
    assets: {},
    editor: { cuadricula: false, paso: 10, iman: true, guias: [], margen: 20, reglas: true, margenes: true },
  };
  return p;
}

export function nuevaPagina(proyecto, datos = {}) {
  const t = proyecto?.ajustes?.tema || {};
  return {
    id: uid("p"),
    nombre: "Página nueva",
    fondo: { tipo: "color", color: t.fondo || "#ffffff" },
    transicion: null,
    musica: { modo: "global" },
    duracion: 0,
    els: [],
    ...datos,
  };
}

const ANIM_VACIA = () => ({ entrada: { tipo: "ninguna" }, salida: { tipo: "ninguna" }, bucle: { tipo: "ninguno" }, propia: null });

/** Medidas por defecto de cada tipo (antes de centrarlo en la hoja). */
const TAM = {
  texto: [300, 60], imagen: [240, 300], forma: [160, 160], dibujo: [120, 120], trazo: [200, 120],
  boton: [200, 56], album: [330, 330], carrusel: [330, 420], video: [330, 220], html: [330, 260], pagina: [390, 844], componente: [280, 200], escena3d: [300, 300],
};

export function nuevoEl(tipo, proyecto, datos = {}) {
  const a = proyecto?.ajustes || { ancho: 390, alto: 844, tema: {} };
  const t = a.tema || {};
  const [w, h] = TAM[tipo] || [160, 160];
  const W = Math.min(w, a.ancho - 40);
  const H = tipo === "pagina" ? a.alto : Math.round(h * (W / w));
  const base = {
    id: uid("e"),
    tipo,
    nombre: TIPOS[tipo]?.n || tipo,
    x: Math.round((a.ancho - W) / 2),
    y: Math.round((a.alto - H) / 2),
    w: W,
    h: H,
    rot: 0,
    opacidad: 1,
    bloqueado: false,
    oculto: false,
    caja: {},
    anim: ANIM_VACIA(),
    accion: null,
    origen: null,
    efectos: null,      // sombra, resplandor, filtros (sobre todo el elemento)
    sonidos: null,      // { tocar, aparecer, volumen } → ids de assets de audio
    inicioOculto: false, // en el librito empieza escondido (lo muestra una acción)
    grupo: null,        // los del mismo grupo se eligen y se mueven juntos
    permisos: null,     // { mover, tamano, rotar, seleccionar, interactuar, fuera, proporcion }
    ancla: null,        // hoja automática: a qué borde se pega
    tiempo: null,       // { inicio, fin } en la línea de tiempo
  };
  if (tipo === "pagina") { base.x = 0; base.y = 0; base.w = a.ancho; }
  const propio = {
    texto: { html: "Escribe aquí", fuente: t.fuente || "Cormorant Garamond", tam: 28, peso: 500, cursiva: false, alin: "center", valin: "arriba", color: t.texto || "#3a2440", interletra: 0, interlinea: 1.3, sombra: null, mayus: false, subrayado: false },
    imagen: { asset: null, ajuste: "cover", recorte: { x: 50, y: 50, zoom: 1 }, forma: null, marco: null, filtro: null },
    forma: { figura: "rect", relleno: t.acento || "#d8397a", trazo: "#3a2440", grosor: 0, gradiente: null },
    dibujo: { svg: "", color: t.acento || "#d8397a", estirar: false },
    trazo: { d: "", vw: 100, vh: 100, color: t.acento || "#d8397a", grosor: 4 },
    boton: { texto: "Siguiente", estilo: "relleno", fuente: "Jost", tam: 18, peso: 500, color: "#ffffff", fondo: t.acento || "#d8397a", radio: 999 },
    album: { fotos: [], disposicion: "cuadricula", columnas: 2, espacio: 8, radio: 10, marco: "ninguno", proporcion: "1", ampliar: true, cascada: { tipo: "aparecer", paso: 110, dur: 650, dir: "arriba" } },
    carrusel: { fotos: [], modo: "deslizar", direccion: "horizontal", auto: true, intervalo: 3200, velocidad: 600, bucle: true, puntos: true, flechas: false, espacio: 0, radio: 16, ajuste: "cover" },
    video: { asset: null, auto: false, bucle: false, silencio: false, controles: true, ajuste: "cover" },
    html: { codigo: '<div style="display:grid;place-items:center;height:100%;font:600 22px system-ui;color:#d8397a">Hola, mi amor</div>', interactivo: true },
    pagina: { ruta: "", titulo: "" },
    // Un componente de assets/: aquí sólo se guarda CÓMO se usa esta copia;
    // el componente original no se toca nunca.
    componente: { id: "", ruta: "", entrada: "index.html", ancho: null, alto: null, parametros: [], params: {}, decorativo: false, aislado: false, miniatura: null, ajuste: "escalar", sinFondo: false, recorte: false, seleccion: "zona", analisis: null },
    // WebGL2: una figura o un modelo (.glb/.gltf/.obj) con su luz y su cámara.
    escena3d: { fuente: "figura", figura: "corazon", asset: null, color: t.acento || "#d8397a", metal: 0.15, rugosidad: 0.4, alambre: false, plano: false, luz: 1.4, luzColor: "#ffffff", ambiente: 0.7, fondo: null, girar: 0.6, orbitar: true, zoom: 1, rotX: -0.25, rotY: 0.5, animar: true },
  }[tipo];
  if (tipo === "boton") base.accion = { tipo: "siguiente" };
  if (tipo === "boton") base.caja = {};
  const el = { ...base, [tipo]: { ...propio, ...(datos[tipo] || {}) } };
  for (const k of Object.keys(datos)) if (k !== tipo && datos[k] !== undefined) el[k] = datos[k];
  return el;
}

/** ¿Qué assets usa este proyecto? (para exportar sólo eso). */
export function assetsUsados(proyecto) {
  const usados = new Set();
  const poner = (id) => { if (id) usados.add(id); };
  poner(proyecto.ajustes?.musica?.asset);
  for (const pid of proyecto.orden) {
    const p = proyecto.paginas[pid];
    if (!p) continue;
    poner(p.fondo?.imagen?.asset);
    poner(p.musica?.asset);
    for (const e of p.els) {
      poner(e.imagen?.asset);
      poner(e.video?.asset);
      if (e.escena3d?.fuente === "archivo") poner(e.escena3d.asset);
      for (const id of e.album?.fotos || []) poner(id);
      for (const id of e.carrusel?.fotos || []) poner(id);
      poner(e.sonidos?.tocar);
      poner(e.sonidos?.aparecer);
      if (e.accion?.tipo === "sonido") poner(e.accion.destino);
      for (const d of e.componente?.parametros || []) if (d.tipo === "imagen" || d.tipo === "audio") poner(e.componente.params?.[d.id]);
    }
    poner(p.transicion?.sonido);
  }
  poner(proyecto.ajustes?.transicion?.sonido);
  return usados;
}

/** Tipografías usadas (para pedir sólo ésas). */
export function fuentesUsadas(proyecto) {
  const f = new Set();
  for (const pid of proyecto.orden) {
    for (const e of proyecto.paginas[pid]?.els || []) {
      if (e.texto?.fuente) f.add(e.texto.fuente);
      if (e.boton?.fuente) f.add(e.boton.fuente);
    }
  }
  return f;
}

/** Repara lo que falte (borradores viejos o importados). */
export function normalizar(p) {
  const base = nuevoProyecto(p.nombre);
  p.v = VERSION;
  p.ajustes = { ...base.ajustes, ...(p.ajustes || {}) };
  for (const k of ["tema", "transicion", "musica", "reproduccion"]) p.ajustes[k] = { ...base.ajustes[k], ...(p.ajustes[k] || {}) };
  p.editor = { ...base.editor, ...(p.editor || {}) };
  p.orden = (p.orden || []).filter((id) => p.paginas?.[id]);
  p.paginas = p.paginas || {};
  p.assets = p.assets || {};
  for (const id of p.orden) {
    const pg = p.paginas[id];
    pg.els = pg.els || [];
    pg.fondo = pg.fondo || { tipo: "color", color: "#ffffff" };
    pg.musica = pg.musica || { modo: "global" };
    for (const e of pg.els) {
      e.anim = { ...ANIM_VACIA(), ...(e.anim || {}) };
      e.caja = e.caja || {};
    }
  }
  return p;
}
