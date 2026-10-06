/**
 * GIPHY — buscar GIFs y stickers (API oficial de GIPHY Developers).
 *
 * La clave NO está escrita en el código (el repositorio y el sitio son
 * públicos: cualquiera podría copiarla). En orden, el editor usa:
 *   1. un proxy que guarda la clave por ti:
 *        · el servidor local `node herramientas/servir.mjs` (lee la clave de la
 *          variable GIPHY_KEY o del archivo .giphy-clave, que git ignora), o
 *        · un Worker de Cloudflare (herramientas/giphy-proxy/), cuya dirección
 *          se pone una vez en el editor;
 *   2. si no hay proxy, la clave pegada UNA vez en este aparato (se guarda
 *      sólo en este navegador, nunca en el proyecto ni en el .zip).
 * El librito exportado nunca la necesita: los GIF que usas se descargan y
 * viajan dentro del proyecto, como una foto más.
 */
const CLAVE = "editordev:giphy-clave";
const PROXY = "editordev:giphy-proxy";
export const USUARIO = "YonathanPG";

const leer = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
const escribir = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* nada */ } };

export class SinConexion extends Error {}

let local = null;
/** ¿Hay un proxy en el mismo servidor (herramientas/servir.mjs)? */
export async function proxyLocal() {
  if (local !== null) return local;
  try {
    const u = new URL("../giphy/ping", location.href);
    const r = await fetch(u, { cache: "no-store" });
    local = r.ok && (await r.text()).trim() === "giphy-ok" ? new URL("../giphy", location.href).href : "";
  } catch (e) { local = ""; }
  return local;
}

export const config = () => ({ clave: leer(CLAVE), proxy: leer(PROXY) });
export async function listo() { const c = config(); return !!(c.proxy || c.clave || (await proxyLocal())); }
export async function como() { const c = config(); if (c.proxy) return "proxy"; if (await proxyLocal()) return "local"; return c.clave ? "clave" : ""; }
export function ponerClave(k) { escribir(CLAVE, String(k || "").trim()); }
export function ponerProxy(u) { escribir(PROXY, String(u || "").trim().replace(/\/+$/, "")); }
export function olvidar() { escribir(CLAVE, ""); escribir(PROXY, ""); }

/** Prueba una clave (o el proxy) con una búsqueda chiquita. */
export async function probar() { await buscar("gifs", "love", 0, 1); return true; }

const elegirUrl = (...xs) => xs.find((x) => x) || "";
function normalizar(g) {
  const im = g.images || {};
  const fw = im.fixed_width || {};
  return {
    id: g.id,
    titulo: (g.title || "").replace(/\s*(GIF|Sticker)(\s+by\s+.*)?$/i, "").trim() || (g.type === "sticker" ? "Sticker" : "GIF"),
    autor: g.user?.display_name || g.username || "",
    mini: elegirUrl(im.fixed_width_downsampled?.webp, fw.webp, im.fixed_width_downsampled?.url, fw.url),
    w: +(fw.width || 200), h: +(fw.height || 200),
    vista: elegirUrl(im.downsized_medium?.url, im.fixed_height?.url, im.original?.url),
    im,
    analitica: g.analytics || null,
    enlace: g.url || "",
  };
}

/**
 * Busca. tipo: "gifs" | "stickers". Devuelve { items, total, siguiente }.
 * Lanza SinConexion si todavía no hay clave ni proxy.
 */
export async function buscar(tipo, q, offset = 0, limite = 24, senal) {
  const c = config();
  const base = c.proxy || (await proxyLocal());
  const params = new URLSearchParams({ q: q || "love", offset: String(offset), limit: String(limite), rating: "pg-13", lang: "es" });
  let url;
  if (base) url = `${base}/v1/${tipo}/search?${params}`;
  else if (c.clave) { params.set("api_key", c.clave); url = `https://api.giphy.com/v1/${tipo}/search?${params}`; }
  else throw new SinConexion("Falta conectar GIPHY");
  let r;
  try { r = await fetch(url, { signal: senal, referrerPolicy: "no-referrer", credentials: "omit" }); }
  catch (e) { if (e.name === "AbortError") throw e; throw new Error("Sin conexión con GIPHY. ¿Hay internet?"); }
  if (r.status === 401 || r.status === 403) throw new Error("GIPHY no aceptó la clave (¿está bien copiada o se venció?).");
  if (r.status === 429) throw new Error("GIPHY pidió esperar un ratito: demasiadas búsquedas seguidas.");
  if (!r.ok) throw new Error(`GIPHY no respondió (${r.status}).`);
  const d = await r.json();
  const pag = d.pagination || {};
  const items = (d.data || []).map(normalizar);
  return { items, total: pag.total_count ?? items.length, siguiente: (pag.offset ?? offset) + (pag.count ?? items.length) };
}

/** Avisarle a GIPHY que se vio o se usó (lo piden sus reglas; sin datos personales). */
export function contar(item, que) {
  const u = item?.analitica?.[que]?.url;
  if (!u) return;
  try { fetch(`${u}${u.includes("?") ? "&" : "?"}ts=${Date.now()}`, { mode: "no-cors", keepalive: true, credentials: "omit", referrerPolicy: "no-referrer" }).catch(() => {}); } catch (e) { /* nada */ }
}

/**
 * El archivo que se guarda en el proyecto:
 *   GIF       el GIF «mediano» (≤ 5 MB) o uno más chico
 *   sticker   WebP animado (mejor borde transparente) o GIF si no hay
 * `paraFondo` = la versión chica en GIF (para quitarle el fondo cuadro a cuadro).
 */
export function rendicion(item, tipo, paraFondo = false) {
  const im = item.im;
  if (paraFondo) {
    const r = [im.fixed_height, im.downsized, im.fixed_width, im.downsized_medium, im.original].find((x) => x?.url && (+x.size || 0) < 4e6) || im.fixed_width;
    return { url: r.url, w: +r.width, h: +r.height, tipo: "image/gif" };
  }
  if (tipo === "stickers") {
    const o = im.original || {};
    if (o.webp && (+o.webp_size || 0) < 3.2e6) return { url: o.webp, w: +o.width, h: +o.height, tipo: "image/webp" };
    const f = im.fixed_height || im.fixed_width || {};
    if (f.webp) return { url: f.webp, w: +f.width, h: +f.height, tipo: "image/webp" };
  }
  const r = [im.downsized_medium, im.downsized, im.fixed_height, im.original].find((x) => x?.url && (+x.size || 0) < 5.2e6) || im.fixed_width;
  return { url: r.url, w: +r.width, h: +r.height, tipo: "image/gif" };
}

export async function descargar(r) {
  const res = await fetch(r.url, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer" });
  if (!res.ok) throw new Error("No se pudo descargar de GIPHY (" + res.status + ")");
  const b = await res.blob();
  return b.type ? b : new Blob([b], { type: r.tipo });
}
