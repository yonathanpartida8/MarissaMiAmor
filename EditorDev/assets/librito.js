/**
 * EL LIBRITO DE AHORA — lo que ya existe en el repositorio.
 *
 * Se lee de las mismas listas que usa el libro (`src/data/contenido.js`,
 * `manifest.js`, `chapters.js`), así el editor nunca pide un archivo que no
 * existe. Nada de esto se descarga al abrir el editor: los módulos son sólo
 * listas, y las fotos y canciones se piden cuando las tocas.
 */
import { rutaAUrl } from "./biblioteca.js";

let datos = null;

/** Se importan bajo demanda (la primera vez que se abre algo del librito). */
async function cargar() {
  if (datos) return datos;
  const [contenido, man, cap] = await Promise.all([
    import("../../src/data/contenido.js").then((m) => m.default),
    import("../../src/data/manifest.js"),
    import("../../src/data/chapters.js"),
  ]);
  datos = { contenido, manifest: man.manifest, chapterById: cap.chapterById };
  return datos;
}

/** Escenas pesadas: se pueden usar tal cual, pero no se sugieren ni se leen solas. */
export const PESADAS = /ciudad|noche-estrellada|página\.html26\.html|pagina\.html26\.html/i;

export async function paginasHtml() {
  const { contenido } = await cargar();
  const lista = [
    { ruta: "paginas-html/inicio.html1.html", titulo: "Inicio 1" },
    { ruta: "paginas-html/inicio.html2.html", titulo: "Inicio 2" },
    ...contenido.paginasHtml.map((p) => ({ ruta: "paginas-html/" + p.archivo, titulo: "Página HTML " + p.numero, numero: p.numero })),
  ];
  for (const p of lista) p.pesada = PESADAS.test(p.ruta);
  return lista;
}

/** El título de cada página (se leen 4 KB del principio, como hace el libro). */
export async function titulo(ruta) {
  try {
    const r = await fetch(rutaAUrl(ruta), { headers: { Range: "bytes=0-4095" } });
    const t = (await r.text()).slice(0, 8000);
    const m = /<title>([^<]*)<\/title>/i.exec(t);
    const s = m ? m[1].trim() : "";
    return s && !/^[,.\s]/.test(s) ? s : "";
  } catch (e) { return ""; }
}

export async function carpetasFotos() {
  const { contenido } = await cargar();
  const r = Object.entries(contenido.fotosPaginas || {}).map(([carpeta, fotos]) => ({
    carpeta,
    nombre: carpeta.replace(/^\d+b?-/, "").replace(/-/g, " "),
    fotos: fotos.map((f) => "fotos-paginas/" + carpeta + "/" + f),
  }));
  if (contenido.misFotos?.length) r.push({ carpeta: "mis-paginas/fotos", nombre: "mis fotos", fotos: contenido.misFotos.map((f) => "mis-paginas/fotos/" + f) });
  if (contenido.amores?.length) r.push({ carpeta: "images/amores", nombre: "amores", fotos: contenido.amores.map((f) => "images/amores/" + f.archivo) });
  return r;
}

export async function videos() {
  const { contenido } = await cargar();
  return (contenido.misVideos || []).map((v) => ({ ruta: "mis-paginas/videos/" + v, nombre: v.replace(/\.[^.]+$/, "") }));
}

/* Canciones que el libro ya usa. Sólo se lista lo que de verdad existe
   (se pregunta con HEAD, que no descarga la canción). */
const CANCIONES = [
  ["assets/audio/musica.mp3", "Música del librito"],
  ["la radio/music1.mp3", "La radio · 1"], ["la radio/music2.mp3", "La radio · 2"], ["la radio/music3.mp3", "La radio · 3"],
  ["la radio/music4.mp3", "La radio · 4"], ["la radio/music5.mp3", "La radio · 5"],
  ["musica arena/musica1.mp3", "El rincón de arena"],
  ["musica barco/barco-lista.m4a", "El barquito"],
  ["musica final/musicafinal-lista.m4a", "El final"],
  ["tocadiscos musica/musica1-lista.m4a", "Tocadiscos · 1"], ["tocadiscos musica/musica2-lista.m4a", "Tocadiscos · 2"], ["tocadiscos musica/musica3-lista.m4a", "Tocadiscos · 3"],
  ["paginas-html/ojos.mp3", "Caja de música"],
  ["paginas-html/enanitos.mp3", "Enanitos"],
];

let canciones = null;
export async function cancionesDelLibrito() {
  if (canciones) return canciones;
  const r = await Promise.all(CANCIONES.map(async ([ruta, nombre]) => {
    try {
      const x = await fetch(rutaAUrl(ruta), { method: "HEAD" });
      const tam = +x.headers.get("content-length") || 0;
      return x.ok && tam > 1000 ? { ruta, nombre, tam } : null;
    } catch (e) { return null; }
  }));
  canciones = r.filter(Boolean);
  return canciones;
}

/** El librito entero, para importarlo (sin abrir ninguna página). */
export async function recorrido() {
  const { manifest, chapterById } = await cargar();
  return manifest.map((e) => ({
    id: e.id,
    tipo: e.type,
    ruta: e.src || null,
    transicion: e.transition,
    cap: e.chapter ? chapterById[e.chapter] || null : null,
    fotos: (e.photos || []).map((f) => String(f.src).split("?")[0]),
  }));
}
