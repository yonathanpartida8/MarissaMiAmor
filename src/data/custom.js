/**
 * CUSTOM — las páginas que él añade a mano en `mis-paginas/`.
 *
 * Traduce el formato cómodo de `mis-paginas/paginas.js` (titulo, texto, foto,
 * video…) al formato interno del libro (entradas de manifiesto + capítulos).
 *
 * Reglas que se cumplen sin excepción:
 *  · nada de lo que escriba ahí puede romper el libro. Una página mal puesta
 *    se salta con un aviso claro en consola; el resto sigue funcionando.
 *  · si el archivo entero está roto (una coma de más), el libro se abre igual
 *    con sus páginas de siempre.
 *  · lo que escriba en español se traduce aquí; él nunca ve un nombre interno.
 */

import { resolverPaleta } from "./paletas.js";
import contenido from "./contenido.js";

/**
 * Título para un archivo suelto. Los nombres que pone el móvil
 * («VID-20260915-WA0017») no se enseñan: salen como «Un videíto para ti».
 */
function nombreBonito(archivo, porDefecto, n, total) {
  const base = archivo.replace(/\.[^.]+$/, "");
  const deCamara = /^(vid|img|pxl|mvimg|whatsapp|screenshot|captura|video|foto|dsc|mov)[\s_-]*\d/i.test(base) || /^\d[\d\s_-]*$/.test(base);
  if (deCamara) return total > 1 ? `${porDefecto} · ${n}` : porDefecto;
  const limpio = base.replace(/[_-]+/g, " ").trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

/**
 * Los vídeos y fotos que él deja en `mis-paginas/videos/` y `mis-paginas/fotos/`
 * y que no usa ya ninguna página de `paginas.js` salen solos, cada uno en su
 * página. Sin tocar código.
 */
function sueltos(raw) {
  const usados = new Set();
  for (const item of raw) {
    if (item?.video) usados.add(String(item.video).trim());
    for (const f of [].concat(item?.foto ?? item?.fotos ?? item?.imagen ?? item?.imagenes ?? [])) {
      usados.add(String(typeof f === "string" ? f : f?.src ?? "").trim());
    }
  }
  const vids = (contenido?.misVideos || []).map((f) => [f, `mis-paginas/videos/${f}`]).filter(([, r]) => !usados.has(r));
  const fotos = (contenido?.misFotos || []).map((f) => [f, `mis-paginas/fotos/${f}`]).filter(([, r]) => !usados.has(r));
  return [
    ...vids.map(([f, r], i) => ({
      titulo: nombreBonito(f, "Un videíto para ti", i + 1, vids.length),
      arriba: "dale play",
      video: r,
    })),
    ...fotos.map(([f, r], i) => ({
      titulo: nombreBonito(f, "Una fotito que me encanta", i + 1, fotos.length),
      arriba: "una de tantas",
      foto: r,
    })),
  ];
}

/** Nombres cómodos → tipos internos de página. */
const TYPE_ALIASES = {
  foto: "photo",
  fotos: "gallery",
  galeria: "gallery",
  galería: "gallery",
  video: "video",
  vídeo: "video",
  carta: "chapter",
  texto: "chapter",
  polaroids: "polaroids",
  polaroid: "polaroids",
  mosaico: "mosaic",
  rascar: "scratch",
  postal: "postcard",
  velo: "veil",
  profundidad: "depth",
  carrete: "filmstrip",
  cine: "filmstrip",
  constelacion: "constellation",
  constelación: "constellation",
  campo: "memoryfield",
  recuerdos: "memoryfield",
  secreto: "secret",
  escrito: "handwriting",
  mano: "handwriting",
  maquina: "typewriter",
  máquina: "typewriter",
  petalos: "petals",
  pétalos: "petals",
  flor: "petals",
  sobre: "envelope",
  botella: "bottle",
  regalo: "gift",
  candado: "lock",
  pulso: "pulse",
  distancia: "orbit",
};

const VALID_TRANSITIONS = new Set([
  "flip", "dissolve", "zoom", "fold", "iris", "slide", "ink", "tide", "bloom",
]);
const VALID_MOODS = new Set([
  "dawn", "night", "amber", "bloom", "storm", "glass", "winter", "cosmos", "light",
]);

/**
 * Paleta de una página suya, a partir del color que haya elegido.
 *
 * El hondo y el fondo salen de la paleta de la casa, no de un violeta
 * escrito a mano: una página suya tiene que verse del mismo libro aunque
 * el acento lo ponga él.
 */
function paletteFrom(color) {
  const casa = resolverPaleta();
  const accent = /^#[0-9a-f]{3,8}$/i.test(String(color || "")) ? color : casa.a;
  return { a: accent, b: casa.b, deep: casa.deep };
}

/** Deduce el tipo cuando no lo ha escrito. */
function guessType(entry, photos) {
  if (entry.video) return "video";
  if (photos.length > 3) return "gallery";
  if (photos.length > 1) return "gallery";
  if (photos.length === 1) return "photo";
  return "chapter";
}

/** Normaliza `foto` a una lista de objetos como los del inventario. */
function toPhotos(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((src) => String(src).trim())
    .filter(Boolean)
    .map((src, i) => ({ id: `mio-${i}-${src}`, src, custom: true }));
}

/**
 * Convierte una entrada suya en { entry, chapter }.
 * Devuelve null si le falta lo mínimo.
 */
function normalize(raw, index, problems) {
  if (!raw || typeof raw !== "object") {
    problems.push(`la página nº ${index + 1} no es un bloque válido`);
    return null;
  }

  const title = String(raw.titulo ?? raw.title ?? "").trim();
  if (!title) {
    problems.push(`la página nº ${index + 1} no tiene "titulo"`);
    return null;
  }

  const photos = toPhotos(raw.foto ?? raw.fotos ?? raw.imagen ?? raw.imagenes);
  const video = raw.video ? String(raw.video).trim() : null;

  const askedType = String(raw.tipo ?? raw.type ?? "").trim().toLowerCase();
  let type = askedType ? TYPE_ALIASES[askedType] : guessType(raw, photos);

  if (askedType && !type) {
    problems.push(`"${title}": el tipo "${raw.tipo}" no existe, se usa una foto`);
    type = photos.length ? "photo" : "chapter";
  }

  // Avisos de coherencia: mejor decírselo que dejar una página vacía.
  if (type === "video" && !video) {
    problems.push(`"${title}": es de tipo vídeo pero no tiene "video"`);
    type = photos.length ? "photo" : "chapter";
  }
  const needsPhoto = ["photo", "gallery", "mosaic", "scratch", "postcard", "veil", "depth", "filmstrip", "constellation", "memoryfield", "polaroids", "secret"];
  if (needsPhoto.includes(type) && !photos.length) {
    problems.push(`"${title}": "${raw.tipo || type}" necesita al menos una foto; se muestra como carta`);
    type = "chapter";
  }

  // El id tiene que ser estable entre visitas: de él depende que el libro
  // recuerde por dónde iba y qué secretos encontró.
  const slug =
    String(raw.id ?? title)
      .toLowerCase()
      .normalize("NFD")
      // Fuera los acentos (rango de diacríticos combinantes), escrito con
      // escapes para que el archivo no dependa de cómo se guarde.
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `pagina-${index + 1}`;

  const chapterId = `mio-${slug}`;
  const transition = VALID_TRANSITIONS.has(raw.transicion) ? raw.transicion : undefined;
  const mood = VALID_MOODS.has(raw.humor) ? raw.humor : "bloom";

  const chapter = {
    id: chapterId,
    act: "tuyas",
    title,
    kicker: String(raw.arriba ?? raw.kicker ?? ""),
    text: String(raw.texto ?? raw.text ?? ""),
    lines: Array.isArray(raw.frases) ? raw.frases.map(String) : undefined,
    reveal: raw.secreto ? String(raw.secreto) : undefined,
    palette: paletteFrom(raw.color),
    mood,
    video,
    poster: raw.poster ? String(raw.poster).trim() : null,
    custom: true,
  };

  const entry = {
    id: chapterId,
    type,
    chapter: chapterId,
    photos,
    transition: transition || defaultTransition(type),
    hint: raw.pista ? String(raw.pista) : defaultHint(type),
    // Las páginas suyas también pueden esconder algo.
    secret: raw.secreto ? `${chapterId}-visto` : undefined,
    gl: ["photo", "gallery", "video", "depth", "veil", "mosaic", "postcard", "memoryfield", "constellation", "orbit", "pulse", "bottle", "gift", "lock"].includes(type) || undefined,
    custom: true,
    where: raw.donde ?? raw.where ?? "final",
  };

  return { entry, chapter };
}

function defaultTransition(type) {
  if (type === "chapter") return "flip";
  if (type === "video") return "bloom";
  if (type === "gallery") return "slide";
  if (type === "photo") return "ink";
  return "dissolve";
}

function defaultHint(type) {
  if (type === "gallery") return "desliza para ver más";
  if (type === "video") return "toca para reproducir";
  if (type === "photo") return "inclina el teléfono · pellizca para acercar";
  return "";
}

/**
 * Carga `mis-paginas/paginas.js` y lo traduce.
 * Nunca lanza: si algo va mal, devuelve lo que haya podido salvar.
 */
export async function loadCustomPages() {
  const problems = [];
  let raw = [];

  try {
    // Ruta relativa a este módulo: src/data → ../../mis-paginas
    const mod = await import("../../mis-paginas/paginas.js");
    raw = mod.default ?? mod.paginas ?? [];
    if (!Array.isArray(raw)) {
      problems.push("mis-paginas/paginas.js no exporta una lista");
      raw = [];
    }
  } catch (err) {
    // Archivo ausente o con un error de sintaxis: el libro sigue abriéndose.
    problems.push(`no se pudo leer mis-paginas/paginas.js — ${err.message}`);
    raw = [];
  }

  raw = raw.concat(sueltos(raw));

  const entries = [];
  const chapters = [];
  const seen = new Set();

  raw.forEach((item, i) => {
    const result = normalize(item, i, problems);
    if (!result) return;
    // Dos páginas con el mismo título tendrían el mismo id y se pisarían.
    let id = result.entry.id;
    let n = 2;
    while (seen.has(id)) id = `${result.entry.id}-${n++}`;
    seen.add(id);
    result.entry.id = id;
    result.entry.chapter = id;
    result.chapter.id = id;
    if (result.entry.secret) result.entry.secret = `${id}-visto`;

    entries.push(result.entry);
    chapters.push(result.chapter);
  });

  return { entries, chapters, problems };
}

/** El acto al que pertenecen sus páginas, para que el índice las agrupe. */
export const customAct = { id: "tuyas", number: 5, title: "Tuyas" };
