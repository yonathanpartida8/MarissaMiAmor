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

/** Los .html sueltos que todavía no están en el catálogo (sólo con servidor local). */
async function recienDejados(c) {
  const dirs = await listar("assets/");
  if (!dirs) return;
  for (const d of dirs.filter((h) => h.endsWith("/") && !SOLO_EXTRAS.test(h.slice(0, -1)))) {
    const id = d.slice(0, -1);
    const fs = ((await listar(`assets/${d}`)) || []).filter((f) => /\.html?$/i.test(f));
    if (!fs.length) continue;
    let g = c.categorias.find((x) => x.id === id);
    for (const f of fs) {
      if (g?.items.some((it) => it.id === `${id}/${f}`)) continue;
      let m = {};
      try { m = metaHtml((await (await fetch(rutaAUrl(`assets/${d}${f}`), { cache: "no-store" })).text()).slice(0, 6000)); } catch (e) { /* nada */ }
      if (!g) { g = { id, nombre: bonito(id), items: [] }; c.categorias.push(g); }
      g.items.push({ tipo: "componente", id: `${id}/${f}`, nombre: id === "elementos" && sinTilde(m.nombre) !== sinTilde(bonito(f)) ? bonito(f) : m.nombre || bonito(f), descripcion: "", ruta: `assets/${d}`, entrada: f, ancho: m.ancho || null, alto: m.alto || null, parametros: [], miniatura: null, archivos: [f], peso: 0, suelto: true });
    }
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
