/**
 * VERIFICAR — revisa que el libro esté entero antes de publicarlo.
 *
 *   node herramientas/verificar.mjs
 *
 * No abre ningún navegador: lee los datos del libro y los archivos, y
 * comprueba que todo lo que se nombra exista de verdad. En GitHub se ejecuta
 * solo a cada subida (`.github/workflows/verificar.yml`); si algo falla, la
 * subida sale con una cruz roja y aquí se explica qué y dónde.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";

const RAIZ = new URL("..", import.meta.url).pathname;
const errores = [];
const avisos = [];
const mal = (m) => errores.push(m);
const ojo = (m) => avisos.push(m);
const existe = (r) => existsSync(join(RAIZ, r));
const leer = (r) => readFileSync(join(RAIZ, r), "utf8");

/* ── 1. Sintaxis de todo el código ─────────────────────────────────── */
function recorrer(dir, fuera = []) {
  for (const f of readdirSync(join(RAIZ, dir))) {
    const r = join(dir, f);
    if (statSync(join(RAIZ, r)).isDirectory()) recorrer(r, fuera);
    else if (r.endsWith(".js") || r.endsWith(".mjs")) fuera.push(r);
  }
  return fuera;
}
const codigo = [...recorrer("src"), ...recorrer("herramientas"), "sw.js", "mis-paginas/paginas.js"];
for (const archivo of codigo) {
  try {
    execFileSync(process.execPath, ["--experimental-default-type=module", "--check", join(RAIZ, archivo)], { stdio: "pipe" });
  } catch (e) {
    mal(`sintaxis: ${archivo}\n      ${String(e.stderr || e.message).split("\n").slice(0, 4).join("\n      ")}`);
  }
}

/* ── 2. Los datos del libro ────────────────────────────────────────── */
const { chapters, chapterById } = await import(join(RAIZ, "src/data/chapters.js"));
const { manifest } = await import(join(RAIZ, "src/data/manifest.js"));
const { carpetaDeCadaPagina, CARPETA: CARPETA_FOTOS } = await import(join(RAIZ, "src/data/fotos.js"));
const sorpresas = (await import(join(RAIZ, "src/data/sorpresas.js"))).default;
const contenido = (await import(join(RAIZ, "src/data/contenido.js"))).default;

// Qué tipos de página sabe abrir el libro (claves de registry.js).
const registro = leer("src/pages/registry.js");
const tipos = new Set([...registro.matchAll(/^\s{2}([a-z]+): \(\) => import\("\.\/([a-z-]+)\/index\.js"\)/gm)].map((m) => m[1]));
const carpetaDeTipo = Object.fromEntries([...registro.matchAll(/^\s{2}([a-z]+): \(\) => import\("\.\/([a-z-]+)\/index\.js"\)/gm)].map((m) => [m[1], m[2]]));

const ids = new Set();
for (const e of manifest) {
  if (ids.has(e.id)) mal(`página repetida: «${e.id}»`);
  ids.add(e.id);
  if (!tipos.has(e.type)) mal(`«${e.id}» es de tipo «${e.type}», que no existe en registry.js`);
  else if (!existe(`src/pages/${carpetaDeTipo[e.type]}/index.js`)) mal(`falta src/pages/${carpetaDeTipo[e.type]}/index.js`);
  if (e.chapter && !chapterById[e.chapter]) mal(`«${e.id}» pide el capítulo «${e.chapter}», que no existe en chapters.js`);
  if (e.src && !existe(decodeURIComponent(e.src))) mal(`«${e.id}» apunta a ${e.src}, que no existe`);
}

const conTexto = new Set(["chapter", "envelope", "typewriter", "depth", "scratch", "postcard", "handwriting", "bottle", "gift", "veil", "mosaic", "polaroids", "filmstrip"]);
for (const e of manifest) {
  const ch = chapterById[e.chapter];
  if (!ch) continue;
  if (!String(ch.title || "").trim()) mal(`el capítulo «${ch.id}» no tiene título`);
  if (conTexto.has(e.type) && !String(ch.text || "").trim()) ojo(`«${ch.id}» (${e.type}) no tiene texto`);
  // Espacios dobles o antes de una coma/punto (los emoticones «:>», «<:» no cuentan).
  if (/ {2,}| [,.;](?![>)(<])/.test(String(ch.text || "").replace(/\n/g, " "))) ojo(`«${ch.id}»: espacios de más en el texto`);
}
for (const ch of chapters) {
  if (!manifest.some((e) => e.chapter === ch.id) && !ch.act?.startsWith?.("html")) ojo(`el capítulo «${ch.id}» no lo usa ninguna página`);
}

/* ── 3. Estilos enlazados: que existan todos y estén los de cada tipo ─ */
const html = leer("index.html");
for (const [, href] of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
  if (!/^https?:/.test(href) && !existe(href)) mal(`index.html enlaza ${href}, que no existe`);
}
for (const [tipo, carpeta] of Object.entries(carpetaDeTipo)) {
  if (existe(`src/pages/${carpeta}/estilos.css`) && !html.includes(`src/pages/${carpeta}/estilos.css`)) {
    mal(`src/pages/${carpeta}/estilos.css existe pero no está enlazado en index.html (tipo «${tipo}»)`);
  }
}
for (const [, src] of html.matchAll(/<(?:link|script)[^>]+(?:href|src)="([^"]+\.(?:png|jpg|js|webmanifest))"/g)) {
  if (!/^https?:/.test(src) && !existe(src)) mal(`index.html pide ${src}, que no existe`);
}

/* ── 4. Fotos de cada página ───────────────────────────────────────── */
for (const [pagina, carpeta] of Object.entries(carpetaDeCadaPagina)) {
  if (!ids.has(pagina)) mal(`fotos.js: la página «${pagina}» no existe en el libro`);
  if (!existe(CARPETA_FOTOS + carpeta)) mal(`falta la carpeta ${CARPETA_FOTOS}${carpeta}`);
  else if (!(contenido.fotosPaginas?.[carpeta] || []).length) ojo(`la carpeta ${CARPETA_FOTOS}${carpeta} no tiene ninguna imagen`);
}

/* ── 5. Sorpresas ──────────────────────────────────────────────────── */
const frases = new Set();
for (const [id, s] of Object.entries(sorpresas)) {
  if (!ids.has(id)) mal(`sorpresas.js: la página «${id}» no existe en el libro`);
  if (!String(s.frase || "").trim()) mal(`la sorpresa de «${id}» no tiene frase`);
  if (!Array.isArray(s.escena) || s.escena.length < 2) mal(`la sorpresa de «${id}» necesita una escena de al menos 2 figuras`);
  if (frases.has(s.frase)) mal(`la frase de la sorpresa de «${id}» está repetida`);
  frases.add(s.frase);
}
const escenas = Object.values(sorpresas).map((s) => s.escena.join(""));
if (new Set(escenas).size !== escenas.length) mal("hay dos sorpresas con la misma escena");
for (const e of manifest) {
  if (["html", "amor", "photo", "gallery", "video"].includes(e.type)) continue;
  if (!sorpresas[e.id]) ojo(`«${e.id}» no tiene sorpresa escondida`);
}

/* ── 6. Candados: fechas bien escritas ─────────────────────────────── */
for (const f of ["src/pages/combinacion/textos.js", "src/pages/puerta/textos.js"]) {
  const m = /fecha:\s*"([^"]+)"/.exec(leer(f));
  if (!m || !/^\d{2}-\d{2}-\d{4}$/.test(m[1])) mal(`${f}: la fecha tiene que ser "DD-MM-AAAA"`);
  else {
    const [d, mes, a] = m[1].split("-").map(Number);
    const fecha = new Date(a, mes - 1, d);
    if (fecha.getDate() !== d || fecha.getMonth() !== mes - 1) mal(`${f}: ${m[1]} no es una fecha que exista`);
  }
}

/* ── 7. Listas generadas al día ────────────────────────────────────── */
try {
  execFileSync(process.execPath, [join(RAIZ, "herramientas/contenido.mjs"), "--comprobar"], { stdio: "pipe" });
} catch {
  mal("src/data/contenido.js o noche-estrellada/archivos.js están desactualizados: ejecuta `node herramientas/contenido.mjs`");
}

/* ── Informe ───────────────────────────────────────────────────────── */
console.log(`\nVerificación del librito · ${manifest.length} páginas fijas · ${chapters.length} capítulos · ${Object.keys(sorpresas).length} sorpresas · ${codigo.length} archivos de código\n`);
if (avisos.length) {
  console.log(`Avisos (${avisos.length}):`);
  for (const a of avisos) console.log(`  · ${a}`);
  console.log("");
}
if (errores.length) {
  console.log(`ERRORES (${errores.length}):`);
  for (const e of errores) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log("✓ Todo en orden.");
