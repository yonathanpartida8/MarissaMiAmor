/**
 * RESPALDOS — copias COMPLETAS de cada librito, aparte de lo de todos los días.
 *
 * Cada 5 minutos (si hubo cambios), al abrir un librito y al salir del editor
 * se guarda una foto entera del proyecto: todas sus páginas, textos, fotos
 * puestas, dibujos, elementos, posiciones, tamaños, colores, efectos,
 * animaciones y ajustes. Viven en otra base del navegador
 * (EditorDev-respaldos), así que un problema en una no toca la otra.
 *
 * Se guardan las 3 últimas de cada librito: la nueva pisa siempre la más
 * vieja (nunca la recién hecha) y en la MISMA transacción que su índice, así
 * que si algo falla a la mitad no se pierde ninguna. Cada copia lleva su suma
 * de control: al leerla se comprueba que esté entera antes de usarla.
 *
 * Las fotos, canciones y vídeos subidos no se copian otra vez: viven una sola
 * vez en el almacén de archivos y las copias sólo los nombran.
 */
import { abrirBase, txEn, req } from "./db.js";

const abrir = () => abrirBase("EditorDev-respaldos", 1, (db) => {
  db.createObjectStore("copias", { keyPath: "clave" }).createIndex("lib", "lib");
  db.createObjectStore("indices", { keyPath: "lib" });
});
const tx = (cajones, modo, fn) => txEn(abrir, cajones, modo, fn);
export const MAX_COPIAS = 3;

/** Suma de control rápida (FNV-1a de 32 bits) del texto de la copia. */
export function suma(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

/** Guarda una copia completa (`texto` = el proyecto ya pasado a JSON). Si es igual a la última, no se repite. */
export function guardarCopia(p, texto, motivo) {
  const firma = suma(texto);
  return tx(["copias", "indices"], "readwrite", async (t) => {
    const idx = (await req(t.objectStore("indices").get(p.id))) || { lib: p.id, copias: [] };
    if (idx.copias.length && idx.copias[idx.copias.length - 1].suma === firma) return null;
    const usados = new Set(idx.copias.map((c) => c.hueco));
    let hueco = [...Array(MAX_COPIAS).keys()].find((i) => !usados.has(i));
    if (hueco === undefined) hueco = idx.copias.shift().hueco; // el de la más vieja
    const info = { hueco, t: Date.now(), rev: p.rev || 0, n: p.orden.length, nombre: p.nombre, motivo, suma: firma, largo: texto.length };
    t.objectStore("copias").put({ clave: p.id + "#" + hueco, lib: p.id, ...info, datos: texto });
    idx.copias.push(info);
    t.objectStore("indices").put(idx);
    return info;
  });
}

/** Las copias de un librito, de la más nueva a la más vieja (sin los datos). */
export async function listarCopias(lib) {
  const idx = await tx(["indices"], "readonly", (t) => req(t.objectStore("indices").get(lib)));
  return idx ? [...idx.copias].reverse() : [];
}

/** Lee una copia y comprueba que esté entera; si está dañada devuelve null. */
export async function leerCopia(lib, hueco) {
  const r = await tx(["copias"], "readonly", (t) => req(t.objectStore("copias").get(lib + "#" + hueco)));
  if (!r || typeof r.datos !== "string" || r.datos.length !== r.largo || suma(r.datos) !== r.suma) return null;
  try { const p = JSON.parse(r.datos); return p && Array.isArray(p.orden) && p.paginas ? p : null; } catch (e) { return null; }
}

/** La copia buena más nueva de un librito, con su información (o null). */
export async function ultimaCopiaBuena(lib) {
  for (const c of await listarCopias(lib)) {
    const p = await leerCopia(lib, c.hueco).catch(() => null);
    if (p) return { p, info: c };
  }
  return null;
}

/** Al borrar un librito a propósito, se van también sus copias. */
export function borrarCopias(lib) {
  return tx(["copias", "indices"], "readwrite", async (t) => {
    const s = t.objectStore("copias");
    for (const k of await req(s.index("lib").getAllKeys(lib))) s.delete(k);
    t.objectStore("indices").delete(lib);
  });
}
