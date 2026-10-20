/**
 * LA COPIA DE SEGURIDAD DE TODO (Fase 33) — «Mis libritos».
 *
 * «Hacer copia de seguridad de mis datos»: un .zip con TODOS tus borradores de este aparato, cada
 * uno con su proyecto y sus archivos (fotos, sonidos, videos, dibujos y sus originales):
 *
 *   respaldo.json                   qué trae (nombre, páginas y cuándo se editó cada uno)
 *   libritos/001/project.json       el librito
 *   libritos/001/archivos/…         sus archivos
 *
 * «Importar copia de seguridad»: con esa copia vuelven los borradores que no estén en este aparato
 * (los que ya están no se tocan, así no se pisa nada); con la copia de UN librito (el .zip de
 * siempre), se abre como borrador nuevo.
 */
import { Zip } from "../export/zip.js";
import { listar, cargar, leerArchivo, guardarArchivo, guardarTodo } from "./db.js";
import { normalizar } from "../core/modelo.js";

const extDe = (a, b) => ((a?.nombre || "").match(/\.([a-z0-9]{2,5})$/i)?.[1] || (b.type.split("/")[1] || "bin").replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin").toLowerCase();

export async function copiaDeTodo(alAvance) {
  const z = new Zip(), lista = await listar(), libritos = [];
  let i = 0;
  for (const meta of lista) {
    i++;
    alAvance?.(`Guardando «${meta.nombre}» (${i} de ${lista.length})…`);
    const P = await cargar(meta.id);
    if (!P) continue;
    const dir = `libritos/${String(i).padStart(3, "0")}/`, copia = structuredClone(P);
    for (const a of Object.values(copia.assets || {})) {
      if (a.fuente !== "local") continue;
      const b = await leerArchivo(a.id).catch(() => null);
      if (!b) continue;
      a.fuente = "zip"; a.archivoZip = `archivos/${a.id}.${extDe(a, b)}`;
      z.agregar(dir + a.archivoZip, b);
      const o = a.original ? await leerArchivo("orig:" + a.id).catch(() => null) : null;
      if (o) { a.original.archivoZip = `archivos/orig-${a.id}.${extDe(a.original, o)}`; z.agregar(dir + a.original.archivoZip, o); }
    }
    z.agregar(dir + "project.json", JSON.stringify(copia));
    libritos.push({ carpeta: dir, id: P.id, nombre: P.nombre, paginas: P.orden.length, editado: P.editado });
  }
  z.agregar("respaldo.json", JSON.stringify({ tipo: "editordev-respaldo", version: 1, creado: Date.now(), libritos }, null, 1));
  alAvance?.("Empacando…");
  return { blob: await z.generar(), n: libritos.length };
}

/** ¿Es una copia de todo (y no la de un solo librito)? */
export const esCopiaDeTodo = (zip) => !!zip["respaldo.json"];

export async function restaurarTodo(zip, alAvance) {
  const dec = new TextDecoder();
  const info = JSON.parse(dec.decode(await zip["respaldo.json"]()));
  if (info?.tipo !== "editordev-respaldo") throw new Error("esa no es una copia de seguridad del editor");
  const ya = new Set((await listar()).map((p) => p.id));
  let nuevos = 0, estaban = 0;
  for (const l of info.libritos || []) {
    if (ya.has(l.id)) { estaban++; continue; }
    const pj = zip[l.carpeta + "project.json"];
    if (!pj) continue;
    alAvance?.(`Trayendo «${l.nombre}»…`);
    const P = normalizar(JSON.parse(dec.decode(await pj())));
    P.id = l.id;
    for (const a of Object.values(P.assets || {})) {
      if (a.fuente !== "zip") continue;
      const leer = zip[l.carpeta + a.archivoZip];
      if (!leer) { a.fuente = "falta"; continue; }
      const b = new Blob([await leer()], { type: a.mime || "" });
      await guardarArchivo(P.id, a.id, b);
      a.fuente = "local"; a.tam = b.size; delete a.archivoZip;
      if (a.original?.archivoZip) {
        const lo = zip[l.carpeta + a.original.archivoZip];
        if (lo) await guardarArchivo(P.id, "orig:" + a.id, new Blob([await lo()], { type: a.original.mime || "" }));
        delete a.original.archivoZip;
      }
    }
    await guardarTodo(P);
    nuevos++;
  }
  return { nuevos, estaban };
}
