/**
 * CATÁLOGO — lo que hay en assets/ y en «musica assets/».
 *
 * Lo escribe `herramientas/contenido.mjs` (y la acción de GitHub a cada
 * subida) en `assets/catalogo.js`. Se pide la primera vez que hace falta.
 */
let cat = null;

export async function catalogo() {
  if (cat) return cat;
  try { cat = (await import("../../assets/catalogo.js")).default; } catch (e) { cat = null; }
  if (!cat || !Array.isArray(cat.categorias)) cat = { categorias: [], musica: [] };
  return cat;
}

/** Todo lo de un tipo («componente», «imagen», «audio»), con su categoría. */
export async function deTipo(tipo) {
  const c = await catalogo();
  const r = [];
  for (const g of c.categorias) for (const it of g.items) if (it.tipo === tipo) r.push({ ...it, categoria: g.nombre });
  return r;
}
