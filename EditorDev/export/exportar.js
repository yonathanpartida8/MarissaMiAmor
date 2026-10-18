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
import { catalogo } from "../componentes/catalogo.js";

const RT = window.LibritoRT;
const RUNTIME = ["rt-base.js", "rt-render.js", "rt-anim.js", "rt-magia.js", "rt-comps.js", "rt-3d.js", "rt-trans.js", "rt-toques.js", "rt-musica.js", "rt-player.js"];
const DEPENDENCIA = /["'`(]((?:\.{0,2}\/)?[^"'`()\s<>:]+?\.(?:png|jpe?g|gif|webp|avif|svg|mp3|m4a|ogg|wav|aac|mp4|webm|mov|js|mjs|css|json|glb|gltf|bin|woff2?|ttf|otf))(?:\?[^"'`)\s]*)?["'`)]/gi;
const MAX_ARCHIVOS = 600;
const MAX_BYTES = 400 * 1024 * 1024;

const limpio = (s) => String(s || "librito").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "librito";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/ogg": "ogg", "audio/wav": "wav", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

function carpeta(a, ext) {
  if (a.tipo === "audio") return "assets/audio/";
  if (a.tipo === "video") return "assets/video/";
  if (a.tipo === "modelo") return "assets/models/";
  if (ext === "svg") return "assets/drawings/";
  if (a.tipo === "imagen") return "assets/images/";
  return "assets/other/";
}

/** Un icono cuadrado (corazón sobre el color del librito) para la pantalla de inicio. */
function icono(tam, fondo) {
  const c = document.createElement("canvas");
  c.width = c.height = tam;
  const g = c.getContext("2d"), k = tam / 64;
  g.fillStyle = fondo || "#fff4f8";
  g.fillRect(0, 0, tam, tam);
  const gr = g.createLinearGradient(10 * k, 11 * k, 54 * k, 51 * k);
  gr.addColorStop(0, "#ff9cc6");
  gr.addColorStop(1, "#d8397a");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(32 * k, 50 * k);
  g.bezierCurveTo(18 * k, 41 * k, 11 * k, 33 * k, 11 * k, 24.5 * k);
  g.bezierCurveTo(11 * k, 17.6 * k, 16.4 * k, 12 * k, 23 * k, 12 * k);
  g.bezierCurveTo(27 * k, 12 * k, 30 * k, 14 * k, 32 * k, 17.4 * k);
  g.bezierCurveTo(34 * k, 14 * k, 37 * k, 12 * k, 41 * k, 12 * k);
  g.bezierCurveTo(47.6 * k, 12 * k, 53 * k, 17.6 * k, 53 * k, 24.5 * k);
  g.bezierCurveTo(53 * k, 33 * k, 46 * k, 41 * k, 32 * k, 50 * k);
  g.fill();
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}

/**
 * `completo`: copia de seguridad — además de lo que se usa, van TODAS las
 * fotos, canciones y vídeos subidos a la biblioteca del librito (aunque
 * todavía no estén en ninguna página), para no perder nada al restaurarla.
 *
 * `publicar`: lo que se sube a internet — SÓLO para ver: sin project.json ni
 * EditorData/ (no se puede abrir en el editor), con el visor a pantalla
 * completa (runtime/visor.js), su manifiesto e iconos para «Agregar a inicio».
 * Con `conProyecto`, además lleva project.json (un Detallito: se ve y se
 * puede abrir como borrador). `soloPaginas`: sólo esas páginas (un Detallito
 * es una sola página).
 *
 * `nube(ids)`: (al publicar o mandar un detallito) sube a tu nube lo que falte
 * y devuelve id → huella; esos archivos NO van dentro del .zip, sólo su huella
 * en publicar.json («nube») y M.YNTHN los pone él mismo. `ficha`: lo que va en
 * publicar.json. `deLaNube(asset)`: el original de una foto achicada que este
 * aparato no tiene (copia de seguridad completa).
 */
export async function exportar(app, { alProgreso, completo = false, publicar = false, soloPaginas = null, conProyecto = false, nube = null, ficha = null, deLaNube = null } = {}) {
  const P0 = app.estado.proyecto;
  const P = soloPaginas ? {
    ...P0,
    nombre: P0.paginas[soloPaginas[0]]?.nombre || P0.nombre,
    orden: P0.orden.filter((id) => soloPaginas.includes(id)),
    paginas: Object.fromEntries(soloPaginas.filter((id) => P0.paginas[id]).map((id) => [id, P0.paginas[id]])),
    ajustes: { ...P0.ajustes, portada: soloPaginas[0] },
  } : P0;
  const bib = app.bib;
  const zip = new Zip();
  let bytes = 0;
  const avisar = (t) => alProgreso?.(t);

  /* 1 · Los archivos que se usan */
  const usados = [...new Set([...assetsUsados(P), ...(completo ? Object.keys(P.assets || {}) : [])])];
  const archivos = {};
  const faltan = [];
  const refs = {};
  // Lo que ya está (o se sube ahora) en tu nube no viaja dentro del .zip.
  const enNube = nube ? await nube(usados.filter((id) => P.assets[id]?.fuente === "local")).catch((e) => { console.warn("[nube]", e); return null; }) : null;
  let n = 0;
  for (const id of usados) {
    const a = P.assets[id];
    if (!a) continue;
    avisar(`Archivos ${++n} de ${usados.length}: ${a.nombre}`);
    if (enNube?.has(id)) {
      const ext = EXT[a.mime] || (a.archivo || "").split(".").pop().toLowerCase().slice(0, 5) || "bin";
      const ruta = carpeta(a, ext) + `${String(n).padStart(3, "0")}-${limpio(a.nombre)}.${ext}`;
      refs[ruta] = enNube.get(id);
      archivos[id] = ruta;
      continue;
    }
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
  // Los componentes de assets/: su carpeta ENTERA, tal cual (más lo que pidan de fuera).
  const cat = await catalogo();
  const porId = {};
  for (const g of cat.categorias) for (const it of g.items) porId[it.id] = it;
  const sinFondo = {};
  for (const pid of P.orden) {
    for (const e of P.paginas[pid].els) {
      if (e.tipo !== "componente" || !e.componente?.ruta) continue;
      const k = e.componente;
      const it = porId[k.id];
      const lista = it?.archivos?.length ? it.archivos : [k.entrada || "index.html"];
      for (const f of lista) if (!originales.has(k.ruta + f)) originales.set(k.ruta + f, null);
      if (k.sinFondo) sinFondo[e.id] = { base: k.ruta + (k.entrada || "index.html"), entrada: (k.entrada || "index.html").replace(/(\.html?)$/i, `.${e.id}$1`), css: RT.cssSinFondo(k.analisis) };
    }
  }
  // Los fondos con HTML de assets/fondos/: su carpeta entera, tal cual.
  for (const pid of P.orden) {
    const fh = P.paginas[pid].fondo?.html;
    if (!fh?.ruta) continue;
    const base = fh.base || fh.ruta.replace(/[^/]*$/, "");
    for (const f of fh.lista?.length ? fh.lista : [fh.ruta.slice(base.length)]) if (!originales.has(base + f)) originales.set(base + f, null);
  }
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
    // Las copias sin fondo (sólo de las que lo pediste; el original queda igual).
    for (const [, v] of Object.entries(sinFondo)) {
      const txt = originales.get(v.base);
      if (txt == null) continue;
      const estilo = `<style id="rt-sin-fondo">${v.css}</style>`;
      zip.agregar("pages/originales/" + v.base.replace(/[^/]+$/, v.entrada), /<\/head>/i.test(txt) ? txt.replace(/<\/head>/i, estilo + "</head>") : estilo + txt);
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
      if (sinFondo[e.id]) e.componente.entrada = sinFondo[e.id].entrada;
      delete e.bloqueado;
    }
    const nombre = `pages/pagina-${String(i + 1).padStart(2, "0")}.js`;
    zip.agregar(nombre, `LibritoRT.pagina(${JSON.stringify(pid)}, ${JSON.stringify(pg)});\n`);
    paginasArchivos[pid] = nombre;
    titulos[pid] = pg.nombre;
  });

  /* 4 · El reproductor y el arranque (y el motor 3D, sólo si alguna página lo usa) */
  avisar("Preparando el reproductor…");
  if (P.orden.some((pid) => P.paginas[pid].els.some((e) => e.tipo === "escena3d"))) {
    for (const f of ["three.module.min.js", "three.core.min.js", "LICENSE"]) {
      const r = await fetch(new URL("../../vendor/three/" + f, import.meta.url)).catch(() => null);
      if (r?.ok) zip.agregar("vendor/three/" + f, await r.blob());
    }
  }
  const codigo = await Promise.all(RUNTIME.map((f) => fetch(new URL("../runtime/" + f, import.meta.url)).then((r) => r.text())));
  zip.agregar("scripts/librito.js", `/* Librito · reproductor (hecho con EditorDev) */\n${codigo.join("\n")}`);
  zip.agregar("styles/librito.css", await fetch(new URL("../runtime/librito.css", import.meta.url)).then((r) => r.text()));
  const { editor, paginas, assets, ...resto } = P;
  void paginas; void editor; void assets;
  // La pantalla con la que se ve en el editor (y en la vista previa): el librito exportado se arma
  // con ella y sólo se escala, así en el teléfono de quien lo recibe todo queda en su lugar.
  const pantalla = app.lienzo?.pantallaDeHoja?.() || null;
  const datos = { nombre: P.nombre, ajustes: { ...resto.ajustes }, orden: P.orden, titulos, paginasArchivos, archivos, ...(pantalla ? { pantalla: { w: Math.round(pantalla.w), h: Math.round(pantalla.h) } } : {}), ...(publicar ? { soloVer: true } : {}) };
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
<style id="sin-resaltado">html{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}*,*::before,*::after{-webkit-tap-highlight-color:transparent}body{-webkit-user-select:none;user-select:none}input,textarea,select,[contenteditable]:not([contenteditable="false"]),[contenteditable]:not([contenteditable="false"]) *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}</style>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="${fondo}">
<meta name="robots" content="noindex, nofollow, noarchive, noimageindex">
<meta name="referrer" content="no-referrer">
<meta name="copyright" content="© ${new Date().getFullYear()} · Todos los derechos reservados">
<title>${escapar(P.nombre)}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z' fill='%23e0457f'/%3E%3C/svg%3E">
${urlF ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${urlF}">` : ""}
<link rel="stylesheet" href="styles/librito.css">
<style>html,body{margin:0;height:100%;background:${fondo};overflow:hidden}</style>${publicar ? `
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${escapar(P.nombre.slice(0, 30))}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icono-180.png">
<style>
html,body{overscroll-behavior:none;touch-action:manipulation}
#visor-carga{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;background:${fondo};transition:opacity .6s ease,visibility .6s}
#visor-carga.fuera{opacity:0;visibility:hidden}
#visor-carga i{width:58px;height:58px;background:url("icono-180.png") center/contain no-repeat;border-radius:18px;animation:visorLate 1.2s ease-in-out infinite;box-shadow:0 10px 30px rgba(216,57,122,.25)}
@keyframes visorLate{0%,100%{transform:scale(1)}15%{transform:scale(1.12)}30%{transform:scale(1)}45%{transform:scale(1.16)}}
.visor-pc{position:fixed;z-index:2147483500;top:calc(env(safe-area-inset-top) + 12px);right:calc(env(safe-area-inset-right) + 12px);width:44px;height:44px;border:0;border-radius:14px;display:grid;place-items:center;background:rgba(20,10,20,.42);color:#fff;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(0,0,0,.25);opacity:0;transform:translateY(-6px) scale(.92);pointer-events:none;transition:opacity .3s,transform .3s cubic-bezier(.3,1.4,.5,1);cursor:pointer;-webkit-tap-highlight-color:transparent}
.visor-pc.ver{opacity:1;transform:none;pointer-events:auto}
.visor-pc svg{width:22px;height:22px}
.visor-nota{position:fixed;z-index:2147483500;left:50%;bottom:calc(env(safe-area-inset-bottom) + 18px);transform:translate(-50%,20px);max-width:calc(100% - 32px);padding:11px 16px;border-radius:14px;background:rgba(20,10,20,.78);color:#fff;font:600 14px/1.35 system-ui,-apple-system,sans-serif;text-align:center;opacity:0;transition:opacity .4s,transform .4s;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.visor-nota.ver{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){#visor-carga i{animation:none}}
</style>` : ""}
</head>
<body>${publicar ? `
<div id="visor-carga" aria-hidden="true"><i></i></div>` : ""}
<div id="librito"></div>
<noscript>Este librito necesita JavaScript.</noscript>
<script src="scripts/librito.js"></script>
<script src="scripts/datos.js"></script>
<script>LibritoRT.arrancar();</script>${publicar ? `
<script src="scripts/visor.js"></script>` : ""}
</body>
</html>
`);

  if (publicar) {
    // Sólo para ver: el visor, el manifiesto y los iconos; nada del proyecto editable.
    zip.agregar("scripts/visor.js", await fetch(new URL("../runtime/visor.js", import.meta.url)).then((r) => r.text()));
    zip.agregar("manifest.webmanifest", JSON.stringify({
      name: P.nombre, short_name: P.nombre.slice(0, 14), start_url: "./", scope: "./", display: "fullscreen", orientation: "any",
      background_color: fondo, theme_color: fondo,
      icons: [{ src: "icono-192.png", sizes: "192x192", type: "image/png" }, { src: "icono-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }],
    }, null, 1));
    for (const t of [180, 192, 512]) { const b = await icono(t, fondo); if (b) zip.agregar(`icono-${t}.png`, b); }
  }
  if (ficha) zip.agregar("publicar.json", JSON.stringify({ ...ficha, ...(Object.keys(refs).length ? { nube: refs } : {}) }, null, 1));
  if (publicar && !conProyecto) {
    avisar("Comprimiendo…");
    const blob = await zip.generar((i, total) => { if (i % 10 === 0) avisar(`Comprimiendo ${i} de ${total}…`); });
    return { blob, nombre: limpio(P.nombre) + ".zip", faltan, archivos: zip.tamano, nube: refs };
  }

  /* 5 · Para volver a abrirlo en el editor */
  const proyecto = clonar(P);
  for (const [id, a] of Object.entries(proyecto.assets)) {
    if (archivos[id] && a.fuente !== "url") { a.fuente = "zip"; a.archivoZip = archivos[id]; }
    if (!usados.includes(id)) delete proyecto.assets[id];
  }
  // En la copia de seguridad van también los ORIGINALES de las fotos achicadas.
  if (completo) {
    const { leerArchivo } = await import("../storage/db.js");
    let k = 0;
    for (const [id, a] of Object.entries(proyecto.assets)) {
      if (!a.original || P.assets[id]?.fuente !== "local") continue;
      let b = await leerArchivo("orig:" + id).catch(() => null);
      if (!b && deLaNube) b = await deLaNube(P.assets[id]);
      if (!b) { delete a.original; continue; }
      avisar(`Originales ${++k}…`);
      const ext = EXT[b.type] || (a.original.archivo || "").split(".").pop().toLowerCase().slice(0, 5) || "bin";
      const ruta = `EditorData/originales/${String(k).padStart(3, "0")}-${limpio(a.nombre)}.${ext}`;
      zip.agregar(ruta, b);
      a.original.archivoZip = ruta;
    }
  }
  zip.agregar("project.json", JSON.stringify(proyecto, null, 1));
  zip.agregar("EditorData/editor.json", JSON.stringify({ version: VERSION, exportado: new Date().toISOString(), editor: P.editor, origen: "EditorDev" }, null, 1));
  zip.agregar("EditorData/LÉEME.txt", `${P.nombre}
${"=".repeat(Math.min(60, P.nombre.length))}

Para verlo: abre index.html (en el teléfono o en la computadora).
Para publicarlo: sube TODO el contenido de esta carpeta a GitHub Pages
(o a cualquier sitio de archivos) y comparte el enlace de index.html.

Para seguir editándolo: en el librito, el índice → «Crear librito» →
«Abrir archivo» y elige este .zip (o project.json).

Páginas: ${P.orden.length}
Archivos incluidos: ${Object.keys(archivos).length}${faltan.length ? `\nNo se encontraron: ${faltan.join(", ")}` : ""}
`);

  avisar("Comprimiendo…");
  const blob = await zip.generar((i, total) => { if (i % 10 === 0) avisar(`Comprimiendo ${i} de ${total}…`); });
  const dia = new Date().toISOString().slice(0, 10);
  return { blob, nombre: limpio(P.nombre) + (completo ? ` (copia de seguridad ${dia})` : "") + ".zip", faltan, archivos: zip.tamano, nube: refs };
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
