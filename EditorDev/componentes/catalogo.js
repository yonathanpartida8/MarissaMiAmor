/**
 * CATÁLOGO — lo que hay en assets/ y en «musica assets/».
 *
 * Lo escribe `herramientas/contenido.mjs` (y la acción de GitHub a cada
 * subida) en `assets/catalogo.js`. Se pide la primera vez que hace falta.
 * Si además el servidor deja listar carpetas (`herramientas/servir.mjs`), los
 * `.html` sueltos recién dejados en `assets/<carpeta>/` aparecen al momento,
 * sin rehacer el catálogo.
 */
import { rutaAUrl } from "../assets/biblioteca.js";

let cat = null;
const SOLO_EXTRAS = /^(sonidos-editor|iconos|fondos|transiciones|animaciones|efectos|deslizar|_.*)$/i;
const bonito = (s) => s.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const sinTilde = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Si el servidor deja listar una carpeta (servidor local), sus nombres. */
export async function listar(rel) {
  try {
    const r = await fetch(rutaAUrl(rel), { cache: "no-store" });
    if (!r.ok || !/text\/html/.test(r.headers.get("content-type") || "")) return null;
    const t = await r.text();
    if (!/<a\s/i.test(t) || /<title>[^<]*(librito|Crear)/i.test(t)) return null;
    return [...t.matchAll(/href="([^"?#]+)"/gi)].map((m) => decodeURIComponent(m[1])).filter((h) => !/^(\.\.?\/|\/|https?:)/.test(h) && !h.startsWith("?"));
  } catch (e) { return null; }
}

/** Nombre y tamaño que un .html de un solo archivo dice de sí mismo. */
export function metaHtml(t) {
  const r = {};
  const ti = /<title>([^<]{1,80})<\/title>/i.exec(t);
  if (ti && ti[1].trim()) r.nombre = ti[1].trim();
  const tam = /<meta[^>]+name=["'](?:tama(?:ñ|n)o|size)["'][^>]*content=["'](\d{2,4})\s*[x×]\s*(\d{2,4})/i.exec(t);
  if (tam) { r.ancho = +tam[1]; r.alto = +tam[2]; }
  return r;
}

const GENERICO = /^(document|documento|untitled|sin t[ií]tulo|new page|nueva p[aá]gina|p[aá]gina|page|index|home|inicio|test|prueba|html|html5|my page|mi p[aá]gina|title|t[ií]tulo|web|website)\s*\d*$/i;
/** El nombre de una pieza: su <title> si dice algo, si no el del archivo (igual que el catálogo). */
export function nombrePieza(cat, archivo, titulo) {
  const deArchivo = bonito(archivo.split("/").pop());
  if (!titulo || titulo.length < 2 || GENERICO.test(titulo.trim())) return deArchivo;
  return normCat(cat) === "elementos" && sinTilde(titulo) !== sinTilde(deArchivo) ? deArchivo : titulo;
}
export const normCat = (c) => sinTilde(c).replace(/[\s_]+/g, "-");

/** Lo que se acaba de dejar en assets/ y todavía no está en el catálogo (sólo con
 *  servidor local, que sabe listar carpetas): también dentro de subcarpetas.
 *  Sale PRIMERO en su categoría, marcado como nuevo. */
async function recienDejados(c) {
  const dirs = await listar("assets/");
  if (!dirs) return;
  const ya = new Set();
  for (const g of c.categorias) for (const it of g.items) ya.add((it.ruta || "") + (it.entrada || ""));
  const leerMeta = async (ruta) => { try { return metaHtml((await (await fetch(rutaAUrl(ruta), { cache: "no-store" })).text()).slice(0, 6000)); } catch (e) { return {}; } };
  for (const d of dirs.filter((h) => h.endsWith("/") && !h.startsWith("_") && !SOLO_EXTRAS.test(normCat(h.slice(0, -1))))) {
    const id = d.slice(0, -1);
    const nuevos = [];
    const pieza = async (dir, entrada, carpeta) => {
      const ruta = `assets/${d}${dir}`;
      if (ya.has(ruta + entrada)) return;
      const m = await leerMeta(ruta + entrada);
      const rel = carpeta ? dir.replace(/\/$/, "") : dir + entrada;
      nuevos.push({ tipo: "componente", id: `${id}/${rel}`, nombre: m.nombre && !GENERICO.test(m.nombre) ? m.nombre : nombrePieza(id, carpeta ? rel : entrada, m.nombre), descripcion: "", ruta, entrada, ancho: m.ancho || null, alto: m.alto || null, parametros: [], miniatura: null, archivos: [entrada], peso: 0, suelto: !carpeta, fecha: Date.now(), nuevo: true });
    };
    const lista = (await listar(`assets/${d}`)) || [];
    for (const f of lista.filter((x) => /\.html?$/i.test(x))) await pieza("", f, false);
    for (const sub of lista.filter((x) => x.endsWith("/") && !x.startsWith("_") && !x.startsWith("."))) {
      const dentro = ((await listar(`assets/${d}${sub}`)) || []).filter((x) => /\.html?$/i.test(x));
      const idx = dentro.find((x) => x.toLowerCase() === "index.html");
      if (idx || dentro.length === 1) await pieza(sub, idx || dentro[0], true);
      else for (const f of dentro) await pieza(sub, f, false);
    }
    if (!nuevos.length) continue;
    let g = c.categorias.find((x) => normCat(x.id) === normCat(id));
    if (!g) { g = { id, nombre: bonito(id), items: [] }; c.categorias.push(g); }
    g.items.unshift(...nuevos);
  }
}

export async function catalogo() {
  if (cat) return cat;
  try { cat = (await import("../../assets/catalogo.js")).default; } catch (e) { cat = null; }
  if (!cat || !Array.isArray(cat.categorias)) cat = { categorias: [], musica: [] };
  cat = { ...cat, categorias: cat.categorias.map((g) => ({ ...g, items: [...g.items] })) };
  await recienDejados(cat);
  return cat;
}

/** Todo lo de un tipo («componente», «imagen», «audio»), con su categoría. */
export async function deTipo(tipo) {
  const c = await catalogo();
  const r = [];
  for (const g of c.categorias) for (const it of g.items) if (it.tipo === tipo) r.push({ ...it, categoria: g.nombre });
  return r;
}
