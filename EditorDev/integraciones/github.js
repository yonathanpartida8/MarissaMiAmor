/**
 * PUBLICAR EN GITHUB PAGES — sube un librito a tu propio repositorio, sin
 * servidor de por medio: el teléfono habla directo con la API de GitHub.
 *
 *   · Todo en UN commit (Git Data API): los archivos del librito en
 *     publicadas/<nombre>/ y la lista publicadas/lista.json.
 *   · Sólo se suben los archivos que cambiaron (se compara la huella SHA-1
 *     de git, calculada aquí): actualizar un librito con 40 fotos y una
 *     frase nueva sube una frase.
 *   · Al actualizar, lo que ya no está en el librito se borra.
 *
 * El token (un «fine-grained token» con permiso de Contenido sólo para ese
 * repositorio) se guarda SÓLO en este aparato: en localStorage si eliges
 * «recordarlo», si no en sessionStorage (se olvida al cerrar). Nunca viaja a
 * ningún otro sitio que api.github.com.
 */
const CLAVE = "editordev:github";
const API = "https://api.github.com";

export function leerConfig() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || sessionStorage.getItem(CLAVE) || "null"); } catch (e) { return null; }
}
export function guardarConfig(c, recordar) {
  const s = JSON.stringify(c);
  try {
    (recordar ? localStorage : sessionStorage).setItem(CLAVE, s);
    (recordar ? sessionStorage : localStorage).removeItem(CLAVE);
  } catch (e) { /* nada */ }
}
export function olvidarConfig() {
  try { localStorage.removeItem(CLAVE); sessionStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
}

/** Si el editor ya está en GitHub Pages, de qué repositorio sale. */
export function repoDeAqui() {
  const h = location.hostname;
  if (!h.endsWith(".github.io")) return "";
  const dueno = h.replace(/\.github\.io$/, ""), primero = location.pathname.split("/").filter(Boolean)[0];
  return primero && primero !== "EditorDev" ? `${dueno}/${primero}` : `${dueno}/${dueno}.github.io`;
}

export const nombreLimpio = (s) => String(s || "librito").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "librito";

async function api(c, ruta, op = {}) {
  let r;
  try {
    r = await fetch(API + ruta, {
      ...op, cache: "no-store", referrerPolicy: "no-referrer",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${c.token}`, "X-GitHub-Api-Version": "2022-11-28", ...(op.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch (e) { throw new Error("Sin conexión con GitHub. Revisa el internet e inténtalo otra vez."); }
  if (!r.ok) {
    let m = "";
    try { m = (await r.json()).message || ""; } catch (e) { /* nada */ }
    const err = new Error(r.status === 401 ? "El token no es válido o ya caducó." : r.status === 403 ? "El token no tiene permiso para esto (necesita «Contents: Read and write»)." : r.status === 404 ? "No encontré el repositorio o la rama (o el token no tiene acceso)." : m || `GitHub contestó ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return r.status === 204 ? null : r.json();
}

/** Comprueba el token y averigua la rama de GitHub Pages y la dirección del sitio. */
export async function conectar(c) {
  const repo = await api(c, `/repos/${c.repo}`);
  if (repo.permissions && !repo.permissions.push) throw new Error("Ese token puede ver el repositorio pero no escribir en él.");
  const [dueno, nombre] = c.repo.split("/");
  let rama = repo.default_branch, sitio = nombre.toLowerCase() === `${dueno.toLowerCase()}.github.io` ? `https://${dueno}.github.io/` : `https://${dueno}.github.io/${nombre}/`;
  try {
    const pg = await api(c, `/repos/${c.repo}/pages`);
    rama = pg?.source?.branch || rama;
    if (pg?.html_url) sitio = pg.html_url.endsWith("/") ? pg.html_url : pg.html_url + "/";
  } catch (e) { /* el token puede no tener permiso de Pages: se usa la rama principal */ }
  return { rama: c.rama || rama, sitio, privado: !!repo.private };
}

function base64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
const texto = (s) => new TextEncoder().encode(s);
async function huellaGit(u8) {
  const cab = texto(`blob ${u8.length}\0`), todo = new Uint8Array(cab.length + u8.length);
  todo.set(cab); todo.set(u8, cab.length);
  const h = new Uint8Array(await crypto.subtle.digest("SHA-1", todo));
  return [...h].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function estado(c) {
  const ref = await api(c, `/repos/${c.repo}/git/ref/heads/${encodeURIComponent(c.rama)}`);
  const commit = await api(c, `/repos/${c.repo}/git/commits/${ref.object.sha}`);
  const arbol = await api(c, `/repos/${c.repo}/git/trees/${commit.tree.sha}?recursive=1`);
  return { commit, arbol: arbol.tree || [], incompleto: !!arbol.truncated };
}

/** La lista de lo publicado (publicadas/lista.json). */
export async function listar(c) {
  try {
    const r = await api(c, `/repos/${c.repo}/contents/publicadas/lista.json?ref=${encodeURIComponent(c.rama)}`);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(r.content.replace(/\s/g, "")), (x) => x.charCodeAt(0)))).paginas || [];
  } catch (e) {
    if (e.status === 404) return [];
    throw e;
  }
}

async function confirmarCambios(c, { commit, entradas, mensaje }) {
  const tree = await api(c, `/repos/${c.repo}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree: entradas }) });
  const nuevo = await api(c, `/repos/${c.repo}/git/commits`, { method: "POST", body: JSON.stringify({ message: mensaje, tree: tree.sha, parents: [commit.sha] }) });
  await api(c, `/repos/${c.repo}/git/refs/heads/${encodeURIComponent(c.rama)}`, { method: "PATCH", body: JSON.stringify({ sha: nuevo.sha }) });
  return nuevo.sha;
}

async function blobTexto(c, s) {
  return (await api(c, `/repos/${c.repo}/git/blobs`, { method: "POST", body: JSON.stringify({ content: base64(texto(s)), encoding: "base64" }) })).sha;
}

/**
 * Publica (o actualiza) un librito. `archivos`: [{ ruta, datos: Uint8Array }].
 * Devuelve { enlace, subidos, borrados }.
 */
export async function publicar(c, { slug, titulo, paginas, archivos, alProgreso }) {
  const carpeta = `publicadas/${slug}`;
  alProgreso?.("Preparando…");
  const { commit, arbol } = await estado(c);
  const viejos = arbol.filter((n) => n.type === "blob" && n.path.startsWith(carpeta + "/"));
  const shaViejo = new Map(viejos.map((n) => [n.path, n.sha]));
  const entradas = [];
  let hechos = 0, subidos = 0;
  const cola = [...archivos];
  const trabajar = async () => {
    for (let a; (a = cola.shift()); ) {
      const ruta = `${carpeta}/${a.ruta}`;
      if (shaViejo.get(ruta) !== (await huellaGit(a.datos))) {
        const b = await api(c, `/repos/${c.repo}/git/blobs`, { method: "POST", body: JSON.stringify({ content: base64(a.datos), encoding: "base64" }) });
        entradas.push({ path: ruta, mode: "100644", type: "blob", sha: b.sha });
        subidos++;
      }
      alProgreso?.(`Subiendo ${++hechos} de ${archivos.length}…`);
    }
  };
  await Promise.all([trabajar(), trabajar(), trabajar()]);
  const nuevas = new Set(archivos.map((a) => `${carpeta}/${a.ruta}`));
  let borrados = 0;
  for (const v of viejos) if (!nuevas.has(v.path)) { entradas.push({ path: v.path, mode: "100644", type: "blob", sha: null }); borrados++; }
  const enlace = `${c.sitio}${carpeta}/`;
  const lista = (await listar(c)).filter((p) => p.slug !== slug);
  lista.unshift({ slug, titulo, paginas, fecha: new Date().toISOString(), enlace });
  entradas.push({ path: "publicadas/lista.json", mode: "100644", type: "blob", sha: await blobTexto(c, JSON.stringify({ paginas: lista }, null, 1)) });
  alProgreso?.("Guardando en GitHub…");
  await confirmarCambios(c, { commit, entradas, mensaje: `Publicar «${titulo}»` });
  return { enlace, subidos, borrados };
}

/** Quita un librito publicado (sus archivos y su línea en la lista). */
export async function despublicar(c, slug) {
  const carpeta = `publicadas/${slug}`;
  const { commit, arbol } = await estado(c);
  const entradas = arbol.filter((n) => n.type === "blob" && n.path.startsWith(carpeta + "/")).map((n) => ({ path: n.path, mode: "100644", type: "blob", sha: null }));
  const lista = (await listar(c)).filter((p) => p.slug !== slug);
  entradas.push({ path: "publicadas/lista.json", mode: "100644", type: "blob", sha: await blobTexto(c, JSON.stringify({ paginas: lista }, null, 1)) });
  await confirmarCambios(c, { commit, entradas, mensaje: `Despublicar «${slug}»` });
}
