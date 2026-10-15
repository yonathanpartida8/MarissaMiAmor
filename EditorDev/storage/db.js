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
 *
 * Seguridad de los datos:
 *   - cada guardado es UNA transacción: se escribe todo o nada, así que uno
 *     fallido o cortado nunca pisa la última versión buena;
 *   - se escribe con durabilidad «estricta» (el navegador confirma cuando ya
 *     está en el disco) y después se vuelve a leer para comprobarlo;
 *   - si Safari pierde la conexión (pasa con la pestaña en segundo plano) se
 *     vuelve a abrir y se reintenta una vez;
 *   - aparte, en otra base (EditorDev-respaldos), las 3 últimas copias
 *     COMPLETAS de cada librito, con su suma de control (ver respaldos.js).
 */

const NOMBRE = "EditorDev-libritos";
const cache = new Map(); // nombre de la base → promesa de la conexión

/** Abre (una sola vez) una base; si se cierra o la pide otra pestaña, se vuelve a abrir en el próximo uso. */
export function abrirBase(nombre, version, crear) {
  if (cache.has(nombre)) return cache.get(nombre);
  const p = new Promise((ok, mal) => {
    let r;
    try { r = indexedDB.open(nombre, version); } catch (e) { mal(e); return; }
    r.onupgradeneeded = () => crear(r.result);
    r.onsuccess = () => {
      const db = r.result;
      db.onversionchange = () => { db.close(); cache.delete(nombre); };
      db.onclose = () => cache.delete(nombre);
      ok(db);
    };
    r.onerror = () => mal(r.error || new Error("No se pudo abrir el almacén del navegador"));
    r.onblocked = () => mal(new Error("Cierra las otras pestañas del editor y vuelve a intentarlo."));
  });
  p.catch(() => cache.delete(nombre));
  cache.set(nombre, p);
  return p;
}

export function abrir() {
  return abrirBase(NOMBRE, 1, (db) => {
    db.createObjectStore("proyectos", { keyPath: "id" });
    db.createObjectStore("paginas", { keyPath: "clave" }).createIndex("lib", "lib");
    db.createObjectStore("archivos", { keyPath: "id" }).createIndex("lib", "lib");
  });
}

export function req(r) {
  return new Promise((ok, mal) => { r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
}

// Errores de «la conexión se perdió» (Safari en segundo plano, base cerrada por otra pestaña…).
const perdida = (e) => !!e && (e.name === "InvalidStateError" || e.name === "UnknownError" || /connection|closing|closed|lost|database/i.test(e.message || ""));

/** Una transacción: se resuelve sólo cuando el navegador confirma que terminó (todo o nada). */
export async function txEn(abrirFn, cajones, modo, fn, intento = 0) {
  const db = await abrirFn();
  try {
    return await new Promise((ok, mal) => {
      let t;
      try { t = modo === "readwrite" ? db.transaction(cajones, modo, { durability: "strict" }) : db.transaction(cajones, modo); } catch (e) { mal(e); return; }
      let res;
      Promise.resolve(fn(t)).then((v) => { res = v; }, (e) => { try { t.abort(); } catch (x) { /* ya terminó */ } mal(e); });
      t.oncomplete = () => ok(res);
      t.onerror = () => mal(t.error);
      t.onabort = () => mal(t.error || new Error("Se canceló la escritura (¿espacio lleno?)"));
    });
  } catch (e) {
    if (intento === 0 && perdida(e)) { cache.delete(db.name); try { db.close(); } catch (x) { /* ya cerrada */ } return txEn(abrirFn, cajones, modo, fn, 1); }
    throw e;
  }
}

const tx = (cajones, modo, fn) => txEn(abrir, cajones, modo, fn);

/** Lo general del proyecto, sin las páginas. */
export function metaDe(p) {
  const { paginas, ...meta } = p;
  return { ...meta, nPaginas: p.orden.length };
}

/**
 * Escribe lo que cambió (en una sola transacción: todo o nada). `rev` sube en
 * cada guardado y sirve para comprobar después que lo escrito es lo de ahora.
 */
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

/** Lee sólo la revisión guardada de un librito (para confirmar un guardado). */
export async function revGuardada(id) {
  const m = await tx(["proyectos"], "readonly", (t) => req(t.objectStore("proyectos").get(id)));
  return m ? { rev: m.rev || 0, guardado: m.guardado || 0 } : null;
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
