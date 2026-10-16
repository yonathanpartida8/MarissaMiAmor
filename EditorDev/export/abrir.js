/**
 * ABRIR UN ARCHIVO — un .zip exportado antes o su project.json.
 *
 * Se abre como un borrador NUEVO (nunca pisa el que tengas): las fotos y
 * canciones que venían dentro del .zip vuelven a la biblioteca.
 */
import { leerZip } from "./zip.js";
import { normalizar, uid } from "../core/modelo.js";
import { guardarArchivo } from "../storage/db.js";

const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif", mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", wav: "audio/wav", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

export async function abrirArchivo(file) {
  let proyecto, zip = null;
  if (/\.zip$/i.test(file.name) || file.type === "application/zip") {
    zip = await leerZip(file);
    const pj = zip["project.json"];
    if (!pj && (zip["scripts/visor.js"] || zip["publicar.json"])) throw new Error("es un librito PUBLICADO: es sólo para ver y no se puede abrir ni editar en el editor (abre la copia del proyecto)");
    if (!pj) throw new Error("ese .zip no trae project.json (¿lo hizo el editor?)");
    proyecto = JSON.parse(new TextDecoder().decode(await pj()));
  } else {
    proyecto = JSON.parse(await file.text());
  }
  if (proyecto?.soloVer) throw new Error("es un librito publicado (sólo para ver)");
  if (!proyecto || !proyecto.orden || !proyecto.paginas) throw new Error("no parece un librito del editor");
  proyecto = normalizar(proyecto);
  proyecto.id = uid("lib");
  proyecto.nombre = proyecto.nombre || "Librito";
  proyecto.creado = Date.now();
  for (const a of Object.values(proyecto.assets)) {
    if (a.fuente !== "zip") continue;
    const leer = zip?.[a.archivoZip];
    if (!leer) { a.fuente = "falta"; continue; }
    const datos = await leer();
    const ext = a.archivoZip.split(".").pop().toLowerCase();
    const blob = new Blob([datos], { type: a.mime || MIME[ext] || "application/octet-stream" });
    await guardarArchivo(proyecto.id, a.id, blob);
    a.fuente = "local";
    a.tam = blob.size;
    delete a.archivoZip;
    // Su original (si la copia de seguridad lo traía).
    if (a.original?.archivoZip) {
      const lo = zip?.[a.original.archivoZip];
      if (lo) await guardarArchivo(proyecto.id, "orig:" + a.id, new Blob([await lo()], { type: a.original.mime || "application/octet-stream" }));
      else delete a.original;
      if (a.original) delete a.original.archivoZip;
    }
  }
  return proyecto;
}
