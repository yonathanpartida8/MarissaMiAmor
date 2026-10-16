/**
 * EL COMPILADOR DE RECURSOS — que el librito pese y cueste lo justo, sin
 * perder nada.
 *
 *   Huella        cada archivo subido lleva su huella (SHA-256): si se vuelve
 *                 a subir la misma foto, se usa la que ya estaba (sin copia).
 *   Validar       lo que no se puede leer (una foto dañada) no entra.
 *   Originales    si una foto se achica para trabajar ligera, el ORIGINAL se
 *                 guarda aparte («orig:») y va en la copia de seguridad.
 *   Miniaturas    versiones chiquitas (320 px) para las rejillas y listas:
 *                 se hacen en calma y se guardan («mini:»); nunca sustituyen
 *                 a la foto en la página.
 *   Revisar       duplicados, lo que no se usa, fotos enormes, archivos que
 *                 faltan y animaciones que piden mucho al teléfono. NADA se
 *                 borra ni se achica sin que lo pidas (y se pregunta antes).
 * Precarga y carga perezosa: el reproductor ya deja lista la página siguiente
 * en calma (rt-player.js, _adelantar) y las rejillas cargan al verse.
 */
import { leerArchivo, guardarArchivo, borrarArchivo } from "../storage/db.js";
import { optimizarImagen, esAnimada } from "./optimizar.js";
import { assetsUsados } from "../core/modelo.js";

const MINI = 320;
const enCalma = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 120));

/** La huella de un archivo (SHA-256; si el navegador no deja, una suma propia). Archivos enormes: por muestras. */
export async function huella(blob) {
  const G = 32 * 1048576, T = 4 * 1048576;
  const partes = blob.size > G ? [blob.slice(0, T), blob.slice(Math.floor(blob.size / 2), Math.floor(blob.size / 2) + T), blob.slice(blob.size - T)] : [blob];
  const datos = new Uint8Array(await new Blob(partes).arrayBuffer());
  const pre = (blob.size > G ? "m" : "") + blob.size.toString(36) + ":";
  try {
    if (crypto?.subtle) {
      const h = await crypto.subtle.digest("SHA-256", datos);
      return pre + [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) { /* abajo */ }
  let a = 2166136261, b = 5381;
  for (let i = 0; i < datos.length; i++) { a ^= datos[i]; a = Math.imul(a, 16777619); b = (Math.imul(b, 33) + datos[i]) | 0; }
  return pre + "f" + (a >>> 0).toString(16) + (b >>> 0).toString(16);
}

/** ¿Ya hay en la biblioteca un archivo con esta huella (la del original subido o la del archivo guardado)? */
export function porHuella(P, h) { return Object.values(P.assets || {}).find((a) => (a.huella === h || a.huellaArchivo === h) && a.fuente !== "falta") || null; }

/** Una miniatura (URL) de una foto local; se hace una vez y se guarda. */
export async function miniatura(bib, id) {
  const a = bib.assets[id];
  if (!a || a.tipo !== "imagen" || a.fuente !== "local" || /svg/i.test(a.mime || "")) return null;
  let b = await leerArchivo("mini:" + id).catch(() => null);
  if (!b) {
    const orig = await leerArchivo(id).catch(() => null);
    if (!orig || (await esAnimada(orig))) return null;
    let bmp;
    try { bmp = await createImageBitmap(orig); } catch (e) { return null; }
    const k = Math.min(1, MINI / Math.max(bmp.width, bmp.height));
    if (k >= 1 && orig.size < 120 * 1024) { bmp.close?.(); return null; } // ya es chiquita: no hace falta
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close?.();
    b = await new Promise((ok) => c.toBlob(ok, "image/webp", 0.82));
    if (!b || !/webp/.test(b.type)) b = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
    if (!b) return null;
    await guardarArchivo(bib.estado.proyecto.id, "mini:" + id, b).catch(() => {});
  }
  return URL.createObjectURL(b);
}

/** Prepara en calma las miniaturas que falten (de una en una: nada se traba). */
export function prepararMiniaturas(bib, ids, alUna) {
  const cola = [...ids];
  const paso = () => {
    const id = cola.shift();
    if (!id) return;
    if (bib.minis.has(id)) { enCalma(paso); return; }
    miniatura(bib, id).then((u) => { if (u) { bib.minis.set(id, u); alUna?.(id); } }).finally(() => enCalma(paso));
  };
  enCalma(paso);
}

/** Revisión completa (no cambia nada; anota las huellas que falten). */
export async function revisar(app, alProgreso) {
  const E = app.estado, P = E.proyecto, usados = assetsUsados(P);
  const lista = Object.values(P.assets || {});
  const r = { total: lista.length, bytes: 0, usados: 0, sinUsar: [], duplicados: [], grandes: [], faltan: [], originales: 0, minis: 0, pesadas: [] };
  const grupos = new Map();
  let i = 0;
  for (const a of lista) {
    alProgreso?.(++i, lista.length, a.nombre);
    r.bytes += a.tam || 0;
    if (usados.has(a.id)) r.usados++; else r.sinUsar.push(a);
    if (a.fuente === "falta") r.faltan.push(a);
    if (a.original) r.originales++;
    if (app.bib.minis?.has(a.id)) r.minis++;
    if (a.fuente !== "local") continue;
    // Se compara lo GUARDADO (así también se encuentran repetidos de antes de las huellas).
    if (!a.huellaArchivo) {
      const b = await leerArchivo(a.id).catch(() => null);
      if (b) E.anotarAsset(a.id, { huellaArchivo: await huella(b) });
    }
    if (a.huellaArchivo) { const l = grupos.get(a.huellaArchivo) || []; l.push(a); grupos.set(a.huellaArchivo, l); }
    if (a.tipo === "imagen" && !/gif|svg/i.test(a.mime || "") && ((a.w || 0) > 2600 || (a.h || 0) > 2600 || (a.tam || 0) > 3 * 1048576)) r.grandes.push(a);
  }
  r.duplicados = [...grupos.values()].filter((l) => l.length > 1);
  // Lo que más le pide al teléfono (sólo se avisa: no se cambia nada).
  for (const pid of P.orden) {
    for (const e of P.paginas[pid].els) {
      const an = e.anim || {}, mg = (an.magia || []).length;
      const filtro = /arcoiris|resplandor|latidoLuz/.test(an.bucle?.tipo || "");
      if (mg > 4) r.pesadas.push({ pid, e, motivo: `${mg} efectos mágicos a la vez` });
      else if (filtro && mg >= 2) r.pesadas.push({ pid, e, motivo: "bucle con brillo/color y magia encima" });
    }
  }
  return r;
}

/** Une duplicados: todo lo que usaba una copia pasa a usar la primera. No borra archivos. */
export function unificar(app, grupos) {
  const E = app.estado, P = E.proyecto;
  const cambio = new Map();
  for (const l of grupos) { const [queda, ...resto] = l; for (const a of resto) cambio.set(a.id, queda.id); }
  if (!cambio.size) return 0;
  const re = new RegExp(`"(${[...cambio.keys()].map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})"`, "g");
  const pasar = (v) => JSON.parse(JSON.stringify(v).replace(re, (_, id) => `"${cambio.get(id)}"`));
  let n = 0;
  E.transaccion("Unificar duplicados", () => {
    for (const pid of P.orden) {
      const pg = P.paginas[pid];
      for (const e of pg.els) {
        const nuevo = pasar(e);
        for (const k of Object.keys(nuevo)) if (JSON.stringify(nuevo[k]) !== JSON.stringify(e[k])) { E.setEl(e.id, { [k]: nuevo[k] }, "Unificar duplicados", undefined, pid); n++; }
      }
      for (const k of Object.keys(pg)) {
        if (k === "els") continue;
        const v = pasar(pg[k]);
        if (JSON.stringify(v) !== JSON.stringify(pg[k])) { E.setPag({ [k]: v }, "Unificar duplicados", undefined, pid); n++; }
      }
    }
    const aj = pasar(P.ajustes);
    if (JSON.stringify(aj) !== JSON.stringify(P.ajustes)) { E.setProy({ ajustes: aj }, "Unificar duplicados"); n++; }
  });
  return n;
}

/** Quita de la biblioteca (y sus archivos, original y miniatura). Sólo tras confirmar. */
export async function quitar(app, ids) {
  for (const id of ids) {
    const a = app.estado.proyecto.assets[id];
    if (!a) continue;
    if (a.fuente === "local") for (const k of [id, "orig:" + id, "mini:" + id]) await borrarArchivo(k).catch(() => {});
    app.bib.olvidar?.(id);
    app.estado.quitarAsset(id);
  }
}

/** Versión ligera para trabajar (2048 px), guardando el ORIGINAL aparte. */
export async function aligerar(app, id) {
  const E = app.estado, a = E.proyecto.assets[id];
  if (!a || a.fuente !== "local" || a.tipo !== "imagen") return false;
  const blob = await leerArchivo(id).catch(() => null);
  if (!blob) return false;
  const r = await optimizarImagen(new File([blob], a.archivo || a.nombre, { type: blob.type || a.mime }));
  if (!r.blob || r.blob === blob || r.blob.size >= blob.size * 0.92) return false;
  const lib = E.proyecto.id;
  if (!a.original) await guardarArchivo(lib, "orig:" + id, blob);
  await guardarArchivo(lib, id, r.blob);
  await borrarArchivo("mini:" + id).catch(() => {});
  app.bib.renovar?.(id, r.blob);
  E.agregarAsset({ ...a, sha: undefined, shaTam: undefined, tam: r.blob.size, mime: r.blob.type, w: r.w, h: r.h, huellaArchivo: await huella(r.blob), huella: a.huella || a.huellaArchivo, original: a.original || { tam: blob.size, mime: blob.type, w: a.w, h: a.h } });
  return true;
}
