/**
 * PUBLICAR EN GITHUB PAGES — sube un librito a tu propio repositorio, sin
 * servidor de por medio: el teléfono habla directo con la API de GitHub.
 *
 *   · Todo en UN commit (Git Data API): los archivos del librito en
 *     publicaciones/<nombre>/ y la lista publicaciones/lista.json. Si el
 *     nombre ya existe, se usa <nombre>-2, -3… (actualizar es aparte).
 *   · Sólo se suben los archivos que cambiaron (se compara la huella SHA-1
 *     de git, calculada aquí): actualizar un librito con 40 fotos y una
 *     frase nueva sube una frase.
 *   · Al actualizar, lo que ya no está en el librito se borra.
 *
 * GitHub Pages (Fase 15): ver si está encendido, encenderlo con la rama
 * correcta, pedirle que se vuelva a publicar y ver si la última vez falló.
 * Y sin token: el editor arma un .zip que se sube a publicar/ desde la web de
 * GitHub y la acción «publicar-subidas» lo abre en publicaciones/<nombre>/.
 * Y con tu servidor (servidor/): el token vive allá, no aquí (servidor.js).
 *
 * El token (un «fine-grained token» con permiso de Contenido sólo para ese
 * repositorio) se guarda SÓLO en este aparato: en localStorage si eliges
 * «recordarlo», si no en sessionStorage (se olvida al cerrar). Nunca viaja a
 * ningún otro sitio que api.github.com.
 */
const CLAVE = "editordev:github";
/** La carpeta de todas las páginas publicadas (una subcarpeta por librito). */
export const CARPETA = "publicaciones";

/** Un nombre que no choque: «nombre», y si ya está, «nombre-2», «nombre-3»… */
export function nombreLibre(base, usados) {
  let slug = base, n = 2;
  while (usados.has(slug)) { const suf = `-${n++}`; slug = base.slice(0, 40 - suf.length) + suf; }
  return slug;
}
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

/** La dirección de GitHub Pages que le toca a un repositorio (usuario/repo). */
export function sitioDe(repo) {
  const [dueno = "", nombre = ""] = String(repo || "").split("/");
  return nombre.toLowerCase() === `${dueno.toLowerCase()}.github.io` ? `https://${dueno.toLowerCase()}.github.io/` : `https://${dueno.toLowerCase()}.github.io/${nombre}/`;
}

export const nombreLimpio = (s) => String(s || "librito").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "librito";

async function api(c, ruta, op = {}) {
  let r;
  try {
    r = await fetch(API + ruta, {
      method: op.method, body: op.body, cache: "no-store", referrerPolicy: "no-referrer",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${c.token}`, "X-GitHub-Api-Version": "2022-11-28", ...(op.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch (e) { throw new Error("Sin conexión con GitHub. Revisa el internet e inténtalo otra vez."); }
  if (!r.ok) {
    let m = "";
    try { m = (await r.json()).message || ""; } catch (e) { /* nada */ }
    const err = new Error(r.status === 401 ? "El token no es válido o ya caducó." : r.status === 403 ? `El token no tiene permiso para esto (necesita ${op.permiso || "«Contents: Read and write»"}).` : r.status === 404 ? "No encontré el repositorio o la rama (o el token no tiene acceso)." : m || `GitHub contestó ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return r.status === 204 ? null : r.json();
}

/** Comprueba el token y averigua la rama de GitHub Pages y la dirección del sitio. */
export async function conectar(c) {
  const repo = await api(c, `/repos/${c.repo}`);
  if (repo.permissions && !repo.permissions.push) throw new Error("Ese token puede ver el repositorio pero no escribir en él.");
  let rama = "", sitio = sitioDe(c.repo);
  const pg = await estadoPages(c);
  if (pg.activo) { rama = pg.rama || ""; sitio = pg.sitio || sitio; }
  // Sin Pages (o sin permiso para verlo): la rama con lo más nuevo, no a ciegas la principal
  // (la principal puede ir muy atrás y publicar ahí no se vería).
  if (!rama) { try { rama = (await ramas(c))[0]?.nombre || ""; } catch (e) { /* nada */ } }
  return { rama: c.rama || rama || repo.default_branch, sitio, privado: !!repo.private, pages: pg };
}

/**
 * Cómo está GitHub Pages: { activo: true, rama, carpeta, sitio, estado } · { activo: false }
 * (apagado: por eso sale 404) · { activo: null } (el token no tiene permiso de verlo).
 */
export async function estadoPages(c) {
  try {
    const pg = await api(c, `/repos/${c.repo}/pages`, { permiso: "«Pages: Read»" });
    const sitio = pg?.html_url ? (pg.html_url.endsWith("/") ? pg.html_url : pg.html_url + "/") : sitioDe(c.repo);
    return { activo: true, rama: pg?.source?.branch || "", carpeta: pg?.source?.path || "/", sitio, estado: pg?.status || "", tipo: pg?.build_type || "legacy" };
  } catch (e) {
    if (e.status === 404) return { activo: false, sitio: sitioDe(c.repo) };
    if (e.status === 401) throw e;
    return { activo: null, sitio: sitioDe(c.repo), error: e.message };
  }
}

/** Las ramas del repositorio, la más reciente primero: [{ nombre, fecha }]. */
export async function ramas(c) {
  const l = (await api(c, `/repos/${c.repo}/branches?per_page=100`)) || [];
  const con = await Promise.all(l.slice(0, 12).map(async (b) => {
    try { const k = await api(c, `/repos/${c.repo}/git/commits/${b.commit.sha}`); return { nombre: b.name, fecha: k.committer?.date || k.author?.date || "" }; }
    catch (e) { return { nombre: b.name, fecha: "" }; }
  }));
  return [...con.sort((a, b) => (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0)), ...l.slice(12).map((b) => ({ nombre: b.name, fecha: "" }))];
}

const PERMISO_PAGES = "«Pages: Read and write» y «Administration: Read and write»";

/** Enciende GitHub Pages desde una rama (o cambia de rama si ya estaba encendido). */
export async function encenderPages(c, rama) {
  const cuerpo = JSON.stringify({ build_type: "legacy", source: { branch: rama, path: "/" } });
  try { await api(c, `/repos/${c.repo}/pages`, { method: "POST", body: cuerpo, permiso: PERMISO_PAGES }); }
  catch (e) {
    // 409: ya existía. 422: ya existía con otra configuración. → se cambia en vez de crear.
    if (e.status !== 409 && e.status !== 422) throw e;
    await api(c, `/repos/${c.repo}/pages`, { method: "PUT", body: cuerpo, permiso: PERMISO_PAGES });
  }
  return estadoPages(c);
}

/** Le pide a GitHub Pages que vuelva a publicar el sitio ya. */
export async function reconstruirPages(c) {
  await api(c, `/repos/${c.repo}/pages/builds`, { method: "POST", permiso: "«Pages: Read and write»" });
}

/** Cómo salió la última publicación de GitHub Pages: { estado, error, fecha } o null. */
export async function ultimaPublicacion(c) {
  try {
    const b = await api(c, `/repos/${c.repo}/pages/builds/latest`, { permiso: "«Pages: Read»" });
    return { estado: b?.status || "", error: b?.error?.message || "", fecha: b?.updated_at || b?.created_at || "" };
  } catch (e) { return null; }
}

/** Sin token: ¿el sitio público contesta? true (en línea) · false (404: Pages apagado) · null (no se sabe). */
export async function sitioEnLinea(sitio) {
  try {
    const r = await fetch(sitio, { method: "GET", cache: "no-store", mode: "cors", referrerPolicy: "no-referrer" });
    return r.ok ? true : r.status === 404 ? false : null;
  } catch (e) { return null; }
}

/**
 * Sin token (repositorio público): la rama de GitHub Pages si se deja ver; si
 * no, la última a la que se subió algo; si no, la principal. "" si no se sabe.
 */
export async function ramaPublica(repo) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || "")) return "";
  const pedir = async (ruta) => {
    const r = await fetch(API + ruta, { cache: "no-store", referrerPolicy: "no-referrer", headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  };
  try { const pg = await pedir(`/repos/${repo}/pages`); if (pg?.source?.branch) return pg.source.branch; } catch (e) { /* sin permiso o apagado */ }
  try {
    const ev = await pedir(`/repos/${repo}/events?per_page=30`);
    const push = (ev || []).find((e) => e.type === "PushEvent" && /^refs\/heads\//.test(e.payload?.ref || ""));
    if (push) return push.payload.ref.slice(11);
  } catch (e) { /* nada */ }
  try { return (await pedir(`/repos/${repo}`)).default_branch || ""; } catch (e) { return ""; }
}

/** Sin token: lo publicado, leído del sitio público (publicaciones/lista.json). */
export async function listarPublico(sitio) {
  try {
    const r = await fetch(`${sitio}${CARPETA}/lista.json`, { cache: "no-store", mode: "cors", referrerPolicy: "no-referrer" });
    return r.ok ? ((await r.json()).paginas || []) : [];
  } catch (e) { return []; }
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

/** La lista de lo publicado (publicaciones/lista.json). */
export async function listar(c) {
  try {
    const r = await api(c, `/repos/${c.repo}/contents/${CARPETA}/lista.json?ref=${encodeURIComponent(c.rama)}`);
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
 * Publica un librito nuevo en publicaciones/<nombre>/ (con otro nombre si ese ya
 * existe) o, con `reemplazar`, actualiza uno que ya estaba.
 * `archivos`: [{ ruta, datos: Uint8Array }]. Devuelve { slug, enlace, subidos, borrados }.
 */
export async function publicar(c, { slug, titulo, paginas, archivos, alProgreso, reemplazar = "" }) {
  alProgreso?.("Preparando…");
  const { commit, arbol } = await estado(c);
  if (reemplazar) slug = reemplazar;
  else {
    const usados = new Set(["lista"]);
    for (const n of arbol) if (n.path.startsWith(CARPETA + "/")) usados.add(n.path.split("/")[1]);
    slug = nombreLibre(slug, usados);
  }
  const carpeta = `${CARPETA}/${slug}`;
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
  entradas.push({ path: `${CARPETA}/lista.json`, mode: "100644", type: "blob", sha: await blobTexto(c, JSON.stringify({ paginas: lista }, null, 1)) });
  alProgreso?.("Guardando en GitHub…");
  await confirmarCambios(c, { commit, entradas, mensaje: `Publicar «${titulo}»` });
  // Por si acaso: que GitHub Pages lo publique ya (si el token no tiene permiso de Pages, se publica solo igual).
  reconstruirPages(c).catch(() => {});
  return { slug, enlace, subidos, borrados };
}

/** Quita un librito publicado (sus archivos y su línea en la lista). */
export async function despublicar(c, slug) {
  const carpeta = `${CARPETA}/${slug}`;
  const { commit, arbol } = await estado(c);
  const entradas = arbol.filter((n) => n.type === "blob" && n.path.startsWith(carpeta + "/")).map((n) => ({ path: n.path, mode: "100644", type: "blob", sha: null }));
  const lista = (await listar(c)).filter((p) => p.slug !== slug);
  entradas.push({ path: `${CARPETA}/lista.json`, mode: "100644", type: "blob", sha: await blobTexto(c, JSON.stringify({ paginas: lista }, null, 1)) });
  await confirmarCambios(c, { commit, entradas, mensaje: `Despublicar «${slug}»` });
}
