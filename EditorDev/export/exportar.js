/**
 * EXPORTAR — el librito entero en un .zip, con SÓLO lo que se usa.
 *
 *   MiLibrito.zip
 *   ├── index.html               ábrelo y ya: funciona sin internet y como archivo
 *   ├── pages/                   una página por archivo (se cargan cuando hacen falta)
 *   │   └── originales/          tus páginas HTML usadas tal cual, con lo que piden
 *   ├── assets/
 *   │   ├── images/  audio/  video/  drawings/  other/
 *   ├── styles/librito.css
 *   ├── scripts/librito.js       el reproductor (el mismo del editor)
 *   ├── scripts/datos.js         orden, ajustes y dónde está cada archivo
 *   ├── EditorData/              lo que sólo le importa al editor
 *   └── project.json             el proyecto completo, para volver a abrirlo
 *
 * Un archivo de la biblioteca que no se usa en ninguna página NO entra.
 */
import { Zip } from "./zip.js";
import { assetsUsados, fuentesUsadas, clonar, VERSION } from "../core/modelo.js";
import { RAIZ, rutaAUrl } from "../assets/biblioteca.js";

const RT = window.LibritoRT;
const RUNTIME = ["rt-base.js", "rt-render.js", "rt-anim.js", "rt-comps.js", "rt-trans.js", "rt-musica.js", "rt-player.js"];
const DEPENDENCIA = /["'`(]((?:\.{0,2}\/)?[^"'`()\s<>:]+?\.(?:png|jpe?g|gif|webp|avif|svg|mp3|m4a|ogg|wav|aac|mp4|webm|mov|js|mjs|css|json|glb|gltf|bin|woff2?|ttf|otf))(?:\?[^"'`)\s]*)?["'`)]/gi;
const MAX_ARCHIVOS = 600;
const MAX_BYTES = 400 * 1024 * 1024;

const limpio = (s) => String(s || "librito").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "librito";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/ogg": "ogg", "audio/wav": "wav", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

function carpeta(a, ext) {
  if (a.tipo === "audio") return "assets/audio/";
  if (a.tipo === "video") return "assets/video/";
  if (ext === "svg") return "assets/drawings/";
  if (a.tipo === "imagen") return "assets/images/";
  return "assets/other/";
}

export async function exportar(app, { alProgreso } = {}) {
  const P = app.estado.proyecto;
  const bib = app.bib;
  const zip = new Zip();
  let bytes = 0;
  const avisar = (t) => alProgreso?.(t);

  /* 1 · Los archivos que se usan */
  const usados = [...assetsUsados(P)];
  const archivos = {};
  const faltan = [];
  let n = 0;
  for (const id of usados) {
    const a = P.assets[id];
    if (!a) continue;
    avisar(`Archivos ${++n} de ${usados.length}: ${a.nombre}`);
    let blob = null;
    try {
      if (a.fuente === "local") blob = await bib.blob(id);
      else if (a.fuente === "librito") { const r = await fetch(rutaAUrl(a.ruta)); if (r.ok) blob = await r.blob(); }
      else if (a.fuente === "url") { const r = await fetch(a.ruta, { mode: "cors" }).catch(() => null); if (r?.ok) blob = await r.blob(); }
    } catch (e) { blob = null; }
    if (!blob) {
      if (a.fuente === "url") archivos[id] = a.ruta; // se queda apuntando a internet
      else faltan.push(a.nombre);
      continue;
    }
    const ext = EXT[blob.type] || (a.archivo || a.ruta || "").split(".").pop().toLowerCase().slice(0, 5) || "bin";
    const ruta = carpeta(a, ext) + `${String(n).padStart(3, "0")}-${limpio(a.nombre)}.${ext}`;
    zip.agregar(ruta, blob);
    bytes += blob.size;
    archivos[id] = ruta;
  }

  /* 2 · Tus páginas HTML usadas tal cual (y lo que piden) */
  const variantes = {};
  const originales = new Map();
  for (const pid of P.orden) {
    const pg = P.paginas[pid];
    const ocultos = RT.ocultosDe(pg);
    for (const e of pg.els) {
      if (e.tipo !== "pagina" || !e.pagina?.ruta) continue;
      const css = ocultos[e.id] || "";
      const ruta = e.pagina.ruta;
      if (!originales.has(ruta)) originales.set(ruta, null);
      if (css) {
        const v = ruta.replace(/(\.html?)$/i, `.${e.id}$1`);
        variantes[e.id] = { ruta: v, base: ruta, css };
      }
    }
  }
  if (originales.size) {
    avisar("Copiando tus páginas HTML y lo que usan…");
    const cola = [...originales.keys()];
    const vistos = new Set(cola);
    while (cola.length && zip.tamano < MAX_ARCHIVOS && bytes < MAX_BYTES) {
      const ruta = cola.shift();
      let r;
      try { r = await fetch(rutaAUrl(ruta)); } catch (e) { r = null; }
      if (!r || !r.ok) continue;
      const tipo = r.headers.get("content-type") || "";
      const esTexto = /\.(html?|js|mjs|css|json)$/i.test(ruta) || /text|javascript|json/.test(tipo);
      if (esTexto) {
        const txt = await r.text();
        if (/\.html?$/i.test(ruta)) originales.set(ruta, txt);
        zip.agregar("pages/originales/" + ruta, txt);
        bytes += txt.length;
        const base = rutaAUrl(ruta);
        for (const m of txt.matchAll(DEPENDENCIA)) {
          if (/^(https?:|data:|blob:|\/\/)/i.test(m[1])) continue;
          let dep;
          try { dep = new URL(m[1], base).href; } catch (e) { continue; }
          if (!dep.startsWith(RAIZ)) continue;
          const rd = decodeURIComponent(dep.slice(RAIZ.length).split(/[?#]/)[0]);
          if (!vistos.has(rd) && !/^EditorDev\//.test(rd)) { vistos.add(rd); cola.push(rd); }
        }
      } else {
        const b = await r.blob();
        zip.agregar("pages/originales/" + ruta, b);
        bytes += b.size;
      }
    }
    // Las copias con lo sacado a capas ya escondido (así funciona también como archivo).
    for (const v of Object.values(variantes)) {
      const txt = originales.get(v.base);
      if (txt == null) continue;
      const estilo = `<style id="rt-ocultos">${v.css}</style>`;
      zip.agregar("pages/originales/" + v.ruta, /<\/head>/i.test(txt) ? txt.replace(/<\/head>/i, estilo + "</head>") : estilo + txt);
    }
  }

  /* 3 · Las páginas, una por archivo */
  avisar("Escribiendo las páginas…");
  const paginasArchivos = {};
  const titulos = {};
  P.orden.forEach((pid, i) => {
    const pg = clonar(P.paginas[pid]);
    for (const e of pg.els) {
      if (variantes[e.id]) e.pagina.ruta = variantes[e.id].ruta;
      delete e.bloqueado;
    }
    const nombre = `pages/pagina-${String(i + 1).padStart(2, "0")}.js`;
    zip.agregar(nombre, `LibritoRT.pagina(${JSON.stringify(pid)}, ${JSON.stringify(pg)});\n`);
    paginasArchivos[pid] = nombre;
    titulos[pid] = pg.nombre;
  });

  /* 4 · El reproductor y el arranque */
  avisar("Preparando el reproductor…");
  const codigo = await Promise.all(RUNTIME.map((f) => fetch(new URL("../runtime/" + f, import.meta.url)).then((r) => r.text())));
  zip.agregar("scripts/librito.js", `/* Librito · reproductor (hecho con EditorDev) */\n${codigo.join("\n")}`);
  zip.agregar("styles/librito.css", await fetch(new URL("../runtime/librito.css", import.meta.url)).then((r) => r.text()));
  const { editor, paginas, assets, ...resto } = P;
  void paginas; void editor; void assets;
  const datos = { nombre: P.nombre, ajustes: { ...resto.ajustes }, orden: P.orden, titulos, paginasArchivos, archivos };
  zip.agregar("scripts/datos.js", `window.LIBRITO_DATOS = ${JSON.stringify(datos)};\n`);
  const fuentes = [...fuentesUsadas(P)];
  for (const [nom, g] of Object.entries(P.ajustes.fuentesExtra || {})) if (fuentes.includes(nom) && !RT.FUENTES[nom]) RT.FUENTES[nom] = { g, pila: "Georgia, serif" };
  const urlF = RT.urlFuentes(fuentes);
  const portada = P.ajustes.portada && P.paginas[P.ajustes.portada];
  const fondo = portada?.fondo?.color || P.ajustes.tema.fondo || "#111";
  zip.agregar("index.html", `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="${fondo}">
<title>${escapar(P.nombre)}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E💗%3C/text%3E%3C/svg%3E">
${urlF ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${urlF}">` : ""}
<link rel="stylesheet" href="styles/librito.css">
<style>html,body{margin:0;height:100%;background:${fondo};overflow:hidden}</style>
</head>
<body>
<div id="librito"></div>
<noscript>Este librito necesita JavaScript.</noscript>
<script src="scripts/librito.js"></script>
<script src="scripts/datos.js"></script>
<script>LibritoRT.arrancar();</script>
</body>
</html>
`);

  /* 5 · Para volver a abrirlo en el editor */
  const proyecto = clonar(P);
  for (const [id, a] of Object.entries(proyecto.assets)) {
    if (archivos[id] && a.fuente !== "url") { a.fuente = "zip"; a.archivoZip = archivos[id]; }
    if (!usados.includes(id)) delete proyecto.assets[id];
  }
  zip.agregar("project.json", JSON.stringify(proyecto, null, 1));
  zip.agregar("EditorData/editor.json", JSON.stringify({ version: VERSION, exportado: new Date().toISOString(), editor: P.editor, origen: "EditorDev" }, null, 1));
  zip.agregar("EditorData/LÉEME.txt", `${P.nombre}
${"=".repeat(Math.min(60, P.nombre.length))}

Para verlo: abre index.html (en el teléfono o en la computadora).
Para publicarlo: sube TODO el contenido de esta carpeta a GitHub Pages
(o a cualquier sitio de archivos) y comparte el enlace de index.html.

Para seguir editándolo: en el librito, ☰ → «📖 Crear librito» →
«Abrir archivo» y elige este .zip (o project.json).

Páginas: ${P.orden.length}
Archivos incluidos: ${Object.keys(archivos).length}${faltan.length ? `\nNo se encontraron: ${faltan.join(", ")}` : ""}
`);

  avisar("Comprimiendo…");
  const blob = await zip.generar((i, total) => { if (i % 10 === 0) avisar(`Comprimiendo ${i} de ${total}…`); });
  return { blob, nombre: limpio(P.nombre) + ".zip", faltan, archivos: zip.tamano };
}

function escapar(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }

export function descargar(blob, nombre) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}
