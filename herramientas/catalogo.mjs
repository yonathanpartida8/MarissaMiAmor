/**
 * EL CATÁLOGO DE ASSETS — lo que hay en `assets/` y en `musica assets/`.
 *
 * Un sitio de archivos no sabe listar carpetas, así que esta herramienta lo
 * hace por él y escribe `assets/catalogo.js`. La llama `contenido.mjs` (y la
 * acción de GitHub a cada subida): añadir un componente es sólo dejar su
 * carpeta en su sitio.
 *
 *   assets/<categoría>/<componente>/index.html   → un componente HTML de verdad
 *       (con todo lo que tenga al lado: css, js, imágenes, audio, fuentes…;
 *        opcional `asset.json` con nombre, tamaño y parámetros, y
 *        `preview.png|jpg|webp|svg` como miniatura)
 *   assets/<categoría>/algo.html                 → componente de un solo archivo
 *   assets/<categoría>/algo.png|jpg|webp|gif|svg → una imagen o adorno
 *   assets/<categoría>/algo.mp3|m4a|ogg|wav      → un sonido
 *   musica assets/*.mp3|m4a|ogg|wav              → la biblioteca de música
 *
 * Nada de esto toca los archivos: sólo los lista.
 */
import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const IMG = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const AUD = /\.(mp3|m4a|ogg|wav|aac)$/i;
const PREVIEW = /^(preview|miniatura|thumb)\.(png|jpe?g|webp|svg|gif)$/i;
const NOMBRES = {
  buttons: "Botones", botones: "Botones", players: "Reproductores", reproductores: "Reproductores",
  portraits: "Retratos", retratos: "Retratos", effects: "Efectos", efectos: "Efectos",
  animations: "Animaciones", animaciones: "Animaciones", decorations: "Decoraciones", decoraciones: "Decoraciones",
  frames: "Marcos", marcos: "Marcos", ui: "Interfaz", cards: "Tarjetas", tarjetas: "Tarjetas",
  audio: "Sonidos", sonidos: "Sonidos", img: "Imágenes", imagenes: "Imágenes", stickers: "Stickers",
};
const ORDEN = ["buttons", "players", "portraits", "frames", "cards", "effects", "animations", "decorations", "stickers", "ui"];

const bonito = (s) => s.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const orden = (a, b) => a.localeCompare(b, "es", { numeric: true });
const esDir = (p) => { try { return statSync(p).isDirectory(); } catch (e) { return false; } };

function todos(dir, base = "") {
  const r = [];
  for (const f of readdirSync(dir).sort(orden)) {
    if (f.startsWith(".")) continue;
    const p = join(dir, f);
    if (esDir(p)) r.push(...todos(p, base + f + "/"));
    else r.push(base + f);
  }
  return r;
}

function medidaSvg(p) {
  try {
    const t = readFileSync(p, "utf8").slice(0, 2000);
    const vb = /viewBox=["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(t);
    if (vb) return { ancho: Math.round(+vb[1]), alto: Math.round(+vb[2]) };
  } catch (e) { /* nada */ }
  return {};
}

function medidaPng(p) {
  try {
    const b = readFileSync(p).subarray(0, 32);
    if (b.readUInt32BE(12) === 0x49484452) return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) };
  } catch (e) { /* nada */ }
  return {};
}

function medida(p) {
  if (/\.svg$/i.test(p)) return medidaSvg(p);
  if (/\.png$/i.test(p)) return medidaPng(p);
  return {};
}

export function catalogo(RAIZ) {
  const raiz = join(RAIZ, "assets");
  const categorias = [];
  if (existsSync(raiz)) {
    const cats = readdirSync(raiz).filter((c) => !c.startsWith(".") && !c.startsWith("_") && esDir(join(raiz, c)));
    cats.sort((a, b) => ((ORDEN.indexOf(a) + 1 || 99) - (ORDEN.indexOf(b) + 1 || 99)) || orden(a, b));
    for (const cat of cats) {
      const items = [];
      for (const f of readdirSync(join(raiz, cat)).sort(orden)) {
        if (f.startsWith(".") || /^(léeme|leeme|readme)\.md$/i.test(f)) continue;
        const p = join(raiz, cat, f);
        const ruta = `assets/${cat}/${f}`;
        if (esDir(p)) {
          if (!existsSync(join(p, "index.html"))) continue;
          let meta = {};
          if (existsSync(join(p, "asset.json"))) { try { meta = JSON.parse(readFileSync(join(p, "asset.json"), "utf8")); } catch (e) { meta = { error: "asset.json no se pudo leer" }; } }
          const archivos = todos(p);
          const peso = archivos.reduce((s, a) => s + statSync(join(p, a)).size, 0);
          const prev = archivos.find((a) => PREVIEW.test(a));
          items.push({
            tipo: "componente", id: `${cat}/${f}`, nombre: meta.nombre || bonito(f), descripcion: meta.descripcion || "",
            ruta: ruta + "/", entrada: "index.html", ancho: meta.ancho || null, alto: meta.alto || null,
            parametros: meta.parametros || [], decorativo: !!meta.decorativo, aislado: !!meta.aislado,
            miniatura: prev ? `${ruta}/${prev}` : null, archivos, peso,
          });
        } else if (/\.html?$/i.test(f)) {
          items.push({ tipo: "componente", id: `${cat}/${f}`, nombre: bonito(f), descripcion: "", ruta: `assets/${cat}/`, entrada: f, ancho: null, alto: null, parametros: [], miniatura: null, archivos: [f], peso: statSync(p).size });
        } else if (IMG.test(f)) {
          items.push({ tipo: "imagen", id: `${cat}/${f}`, nombre: bonito(f), ruta, ...medida(p), peso: statSync(p).size });
        } else if (AUD.test(f)) {
          items.push({ tipo: "audio", id: `${cat}/${f}`, nombre: bonito(f), ruta, peso: statSync(p).size });
        }
      }
      if (items.length) categorias.push({ id: cat, nombre: NOMBRES[cat.toLowerCase()] || bonito(cat), items });
    }
  }
  const dirMusica = join(RAIZ, "musica assets");
  const musica = existsSync(dirMusica)
    ? todos(dirMusica).filter((f) => AUD.test(f)).map((f) => ({ nombre: bonito(f.split("/").pop()), ruta: `musica assets/${f}`, peso: statSync(join(dirMusica, f)).size }))
    : [];
  return { categorias, musica };
}

export function textoCatalogo(RAIZ) {
  return "// GENERADO por `node herramientas/contenido.mjs`: lo que hay en assets/ y en «musica assets/».\n" +
    "// No se edita a mano: deja tus componentes, imágenes y canciones en sus carpetas y se rehace solo.\n" +
    `export default ${JSON.stringify(catalogo(RAIZ), null, 1)};\n`;
}
