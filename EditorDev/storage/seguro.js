/**
 * GUARDAR SIN PERDER NADA — revisar antes de escribir, rescatar al salir y
 * recuperar al abrir.
 *
 *   revisar(p)        ¿está entero el librito? Arregla lo pequeño (un número
 *                     roto) y dice qué impide guardarlo. Con algo roto NO se
 *                     escribe: la última versión buena se queda como está.
 *   rescatar(...)     al salir (cerrar la pestaña, cambiar de app, apagar la
 *                     pantalla) se deja una copia de lo que aún no alcanzó a
 *                     guardarse en localStorage, que escribe al instante. No
 *                     depende de eso: también se intenta guardar normal.
 *   cargarSeguro(id)  abre un librito: si lo guardado está dañado o incompleto
 *                     se completa con la última copia completa buena, y si
 *                     quedó un rescate más nuevo que lo guardado, se aplica.
 */
import { cargar, metaDe } from "./db.js";
import { ultimaCopiaBuena } from "./respaldos.js";

const RESCATE = "editordev:rescate:";
const finito = (v) => v == null || Number.isFinite(v);

/** Devuelve null si se puede guardar, o el motivo por el que no. */
export function revisar(p) {
  if (!p || typeof p !== "object" || !p.id) return "el librito no tiene identificador";
  if (!Array.isArray(p.orden) || !p.paginas || typeof p.paginas !== "object") return "faltan las páginas";
  if (!p.orden.length) return "el librito se quedó sin páginas";
  for (const pid of p.orden) {
    const pg = p.paginas[pid];
    if (!pg || !Array.isArray(pg.els)) return `falta una página (${pid})`;
    // Lo pequeño se arregla en vez de bloquear el guardado: un hueco vacío se
    // quita, a un elemento sin nombre interno se le da uno y un número roto
    // (NaN) se deja en algo que se vea.
    if (pg.els.some((e) => !e || typeof e !== "object" || !e.tipo)) pg.els = pg.els.filter((e) => e && typeof e === "object" && e.tipo);
    for (const e of pg.els) {
      if (!e.id) e.id = "e_r" + Math.random().toString(36).slice(2, 10);
      for (const k of ["x", "y", "w", "h", "rot", "opacidad"]) if (!finito(e[k])) e[k] = k === "w" || k === "h" ? 100 : k === "opacidad" ? 1 : 0;
    }
  }
  return null;
}

/** Deja en localStorage lo que todavía no está confirmado en el almacén (síncrono: llega aunque se cierre). */
export function rescatar(p, paginas, borradas) {
  if (!p) return false;
  const r = { v: 1, id: p.id, t: Date.now(), meta: metaDe(p), paginas: {}, borradas: [...borradas] };
  for (const pid of paginas) if (p.paginas[pid]) r.paginas[pid] = p.paginas[pid];
  try { localStorage.setItem(RESCATE + p.id, JSON.stringify(r)); return true; } catch (e) { return false; }
}

export function quitarRescate(id) { try { localStorage.removeItem(RESCATE + id); } catch (e) { /* nada */ } }

/** Si quedó un rescate más nuevo que lo guardado, lo aplica al librito. */
export function aplicarRescate(P) {
  let r = null;
  try { r = JSON.parse(localStorage.getItem(RESCATE + P.id) || "null"); } catch (e) { r = null; }
  if (!r || r.id !== P.id || !r.meta) return false;
  if (r.t <= (P.guardado || 0)) { quitarRescate(P.id); return false; } // ya estaba guardado
  const { nPaginas, ...meta } = r.meta;
  Object.assign(P, meta);
  for (const [pid, pg] of Object.entries(r.paginas || {})) if (pg && Array.isArray(pg.els)) P.paginas[pid] = pg;
  for (const pid of r.borradas || []) if (!P.orden.includes(pid)) delete P.paginas[pid];
  return true;
}

/**
 * Abre un librito con todas las redes de seguridad. Devuelve { P, notas[] }
 * (P = null si no hay nada que abrir).
 */
export async function cargarSeguro(id) {
  const notas = [];
  let P = null;
  try { P = await cargar(id); } catch (e) { P = null; }
  if (!P || revisar(P)) {
    const c = await ultimaCopiaBuena(id).catch(() => null);
    const hora = c ? new Date(c.info.t).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";
    if (!P && c) { P = c.p; notas.push(`no se pudo leer lo guardado; abrí la copia completa de las ${hora}`); }
    else if (P && c && Array.isArray(P.orden) && P.paginas) {
      let n = 0;
      for (const pid of P.orden) if (!P.paginas[pid] && c.p.paginas[pid]) { P.paginas[pid] = c.p.paginas[pid]; n++; }
      if (n) notas.push(`faltaba${n > 1 ? "n" : ""} ${n} página${n > 1 ? "s" : ""}; la${n > 1 ? "s" : ""} recuperé de la copia de las ${hora}`);
    }
    if (P && Array.isArray(P.orden) && P.paginas) P.orden = P.orden.filter((pid) => P.paginas[pid] && Array.isArray(P.paginas[pid].els));
  }
  if (!P) return { P: null, notas };
  if (aplicarRescate(P)) notas.push("recuperé los últimos cambios que no alcanzaron a guardarse al cerrar");
  return { P, notas };
}
