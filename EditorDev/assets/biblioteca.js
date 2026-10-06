/**
 * BIBLIOTECA — los archivos del librito y cómo se llega a cada uno.
 *
 * Un archivo puede venir de tres sitios:
 *   local    lo subiste tú: el Blob vive en IndexedDB
 *   librito  ya estaba en el repositorio (fotos-paginas/…, la radio/…):
 *            no se copia, se apunta a él
 *   url      una dirección de internet
 *
 * `url(id)` es síncrona porque el lienzo pinta de un tirón: los Blob se
 * leen una vez al abrir el proyecto y se quedan como direcciones `blob:`.
 * El Blob no se carga en memoria por eso: es sólo un asa al archivo.
 */
import { uid } from "../core/modelo.js";
import { guardarArchivo, leerArchivo, pedirPersistencia } from "../storage/db.js";
import { optimizarImagen, medirVideo } from "./optimizar.js";

/** La raíz del repositorio, vista desde EditorDev/. */
export const RAIZ = new URL("../", location.href).href;

export const rutaAUrl = (ruta) => RAIZ + String(ruta).split("/").map(encodeURIComponent).join("/");

export class Biblioteca {
  constructor(estado) {
    this.estado = estado;
    this.urls = new Map();
  }

  get assets() { return this.estado.proyecto?.assets || {}; }

  /** Al abrir un proyecto: prepara las direcciones de lo subido. */
  async preparar(proyecto = this.estado.proyecto) {
    this.liberar();
    const locales = Object.values(proyecto?.assets || {}).filter((a) => a.fuente === "local");
    await Promise.all(locales.map(async (a) => {
      const b = await leerArchivo(a.id).catch(() => null);
      if (b) this.urls.set(a.id, URL.createObjectURL(b));
    }));
  }

  liberar() {
    for (const u of this.urls.values()) URL.revokeObjectURL(u);
    this.urls.clear();
    this._datos?.clear();
    this._listos?.clear();
  }

  url(id) {
    const a = this.assets[id];
    if (!a) return null;
    if (a.fuente === "local") return this.urls.get(id) || null;
    if (a.fuente === "librito") return rutaAUrl(a.ruta);
    return a.ruta || null;
  }

  /** Todas las direcciones usadas (para la vista previa). */
  mapa() {
    const m = {};
    for (const id of Object.keys(this.assets)) { const u = this.url(id); if (u) m[id] = u; }
    return m;
  }

  blob(id) { return leerArchivo(id); }

  /**
   * El archivo como dirección `data:` (la necesitan los HTML aislados: un marco
   * sin permisos no puede abrir las `blob:` del editor). Se calcula una vez.
   */
  datos(id) {
    this._datos = this._datos || new Map();
    if (this._datos.has(id)) return this._datos.get(id);
    const a = this.assets[id];
    if (!a) return Promise.resolve(null);
    const p = (a.fuente === "local" ? leerArchivo(id) : fetch(this.url(id)).then((r) => (r.ok ? r.blob() : null)))
      .then((b) => (b ? new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(null); r.readAsDataURL(b); }) : null))
      .then((u) => { if (u) { this._listos = this._listos || new Map(); this._listos.set(id, u); this.alDatos?.(id); } return u; })
      .catch(() => null);
    this._datos.set(id, p);
    return p;
  }

  /** La `data:` si ya está (si no, la pide y avisa con `alDatos` cuando esté). */
  urlDatos(id) {
    const u = this._listos?.get(id);
    if (u) return u;
    this.datos(id);
    return null;
  }

  /** Sube archivos elegidos por quien edita. Devuelve los assets nuevos. */
  async subir(files, alProgreso) {
    const lib = this.estado.proyecto.id;
    const nuevos = [];
    pedirPersistencia();
    let n = 0;
    for (const f of files) {
      alProgreso?.(n++, files.length, f.name);
      const tipo = /^image\//.test(f.type) ? "imagen" : /^audio\//.test(f.type) ? "audio" : /^video\//.test(f.type) ? "video" : /\.(mp3|m4a|ogg|wav|aac)$/i.test(f.name) ? "audio" : /\.(mp4|webm|mov|m4v)$/i.test(f.name) ? "video" : /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name) ? "imagen" : /\.(glb|gltf|obj)$/i.test(f.name) ? "modelo" : null;
      if (!tipo) continue;
      let blob = f, w = 0, h = 0, dur = 0;
      if (tipo === "imagen") ({ blob, w, h } = await optimizarImagen(f));
      else if (tipo === "video") ({ w, h, dur } = await medirVideo(f));
      const id = uid("a");
      await guardarArchivo(lib, id, blob);
      this.urls.set(id, URL.createObjectURL(blob));
      const a = { id, tipo, nombre: f.name.replace(/\.[^.]+$/, ""), archivo: f.name, mime: blob.type || f.type, tam: blob.size, w, h, dur, fuente: "local", creado: Date.now() };
      this.estado.agregarAsset(a);
      nuevos.push(a);
    }
    alProgreso?.(files.length, files.length);
    return nuevos;
  }

  /** Un archivo que ya está en el repositorio (no se copia nada). */
  delLibrito(ruta, tipo, nombre, extra = {}) {
    const ya = Object.values(this.assets).find((a) => a.fuente === "librito" && a.ruta === ruta);
    if (ya) return ya;
    return this.estado.agregarAsset({ id: uid("a"), tipo, nombre: nombre || ruta.split("/").pop(), archivo: ruta.split("/").pop(), fuente: "librito", ruta, creado: Date.now(), ...extra });
  }

  /** Un Blob creado por el editor (una foto sacada de una página importada…). */
  async deBlob(blob, tipo, nombre, extra = {}) {
    const id = uid("a");
    await guardarArchivo(this.estado.proyecto.id, id, blob);
    this.urls.set(id, URL.createObjectURL(blob));
    return this.estado.agregarAsset({ id, tipo, nombre, archivo: nombre, mime: blob.type, tam: blob.size, fuente: "local", creado: Date.now(), ...extra });
  }
}

/** Abre el selector de archivos del sistema. */
export function elegirArchivos({ accept = "*/*", multiple = true } = {}) {
  return new Promise((ok) => {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = accept;
    i.multiple = multiple;
    i.style.display = "none";
    document.body.append(i);
    i.addEventListener("change", () => { ok([...(i.files || [])]); i.remove(); }, { once: true });
    // Si se cancela no hay evento en todos los navegadores: se limpia al volver.
    addEventListener("focus", () => setTimeout(() => { if (!i.files?.length) { ok([]); i.remove(); } }, 800), { once: true });
    i.click();
  });
}
