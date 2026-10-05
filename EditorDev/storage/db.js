/**
 * ALMACÉN — los borradores viven en IndexedDB, dentro del navegador.
 *
 * Tres cajones, para que guardar sea barato:
 *   proyectos   lo general de cada librito (ajustes, orden, lista de archivos)
 *   paginas     cada página por separado: cambiar una sólo reescribe ésa
 *   archivos    las fotos, canciones y vídeos subidos (Blob), uno por uno,
 *               y sólo una vez: al subirlos
 *
 * Nada de esto sale del teléfono: no hay servidor.
 */

const NOMBRE = "EditorDev-libritos";
let abierta = null;

export function abrir() {
  if (abierta) return abierta;
  abierta = new Promise((ok, mal) => {
    const r = indexedDB.open(NOMBRE, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore("proyectos", { keyPath: "id" });
      db.createObjectStore("paginas", { keyPath: "clave" }).createIndex("lib", "lib");
      db.createObjectStore("archivos", { keyPath: "id" }).createIndex("lib", "lib");
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
    r.onblocked = () => mal(new Error("La base de datos está ocupada en otra pestaña."));
  });
  return abierta;
}

function req(r) {
  return new Promise((ok, mal) => { r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
}

async function tx(cajones, modo, fn) {
  const db = await abrir();
  return new Promise((ok, mal) => {
    const t = db.transaction(cajones, modo);
    let res;
    Promise.resolve(fn(t)).then((v) => { res = v; }, mal);
    t.oncomplete = () => ok(res);
    t.onerror = () => mal(t.error);
    t.onabort = () => mal(t.error || new Error("Se canceló la escritura (¿espacio lleno?)"));
  });
}

/** Lo general del proyecto, sin las páginas. */
export function metaDe(p) {
  const { paginas, ...meta } = p;
  return { ...meta, nPaginas: p.orden.length };
}

export function guardarCambios(p, paginasSucias, borradas) {
  return tx(["proyectos", "paginas"], "readwrite", (t) => {
    t.objectStore("proyectos").put(metaDe(p));
    const ps = t.objectStore("paginas");
    for (const pid of paginasSucias) if (p.paginas[pid]) ps.put({ clave: p.id + "/" + pid, lib: p.id, datos: p.paginas[pid] });
    for (const pid of borradas) ps.delete(p.id + "/" + pid);
  });
}

export function guardarTodo(p) {
  return guardarCambios(p, p.orden, []);
}

export async function listar() {
  const lista = await tx(["proyectos"], "readonly", (t) => req(t.objectStore("proyectos").getAll()));
  return lista.sort((a, b) => b.editado - a.editado);
}

export async function cargar(id) {
  return tx(["proyectos", "paginas"], "readonly", async (t) => {
    const meta = await req(t.objectStore("proyectos").get(id));
    if (!meta) return null;
    const pags = await req(t.objectStore("paginas").index("lib").getAll(id));
    const p = { ...meta, paginas: {} };
    delete p.nPaginas;
    for (const r of pags) p.paginas[r.datos.id] = r.datos;
    return p;
  });
}

export async function borrar(id) {
  return tx(["proyectos", "paginas", "archivos"], "readwrite", async (t) => {
    t.objectStore("proyectos").delete(id);
    for (const caj of ["paginas", "archivos"]) {
      const s = t.objectStore(caj);
      const claves = await req(s.index("lib").getAllKeys(id));
      for (const k of claves) s.delete(k);
    }
  });
}

export function guardarArchivo(lib, id, blob) {
  return tx(["archivos"], "readwrite", (t) => { t.objectStore("archivos").put({ id, lib, blob }); });
}

export async function leerArchivo(id) {
  const r = await tx(["archivos"], "readonly", (t) => req(t.objectStore("archivos").get(id)));
  return r ? r.blob : null;
}

export function borrarArchivo(id) {
  return tx(["archivos"], "readwrite", (t) => { t.objectStore("archivos").delete(id); });
}

/** Pide al navegador que no borre los borradores si se queda sin espacio. */
export async function pedirPersistencia() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch (e) { /* nada */ }
}

export async function espacio() {
  try { return navigator.storage?.estimate ? await navigator.storage.estimate() : null; } catch (e) { return null; }
}
