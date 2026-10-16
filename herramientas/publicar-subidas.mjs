#!/usr/bin/env node
/**
 * PUBLICAR SIN TOKEN — abre los .zip que se subieron a publicar/ (desde la web
 * de GitHub) y los deja en publicadas/<nombre>/, con su línea en
 * publicadas/lista.json. Lo corre .github/workflows/publicar-subidas.yml.
 *
 *   · El nombre sale del archivo: «mi-librito.zip» → publicadas/mi-librito/.
 *   · Si el .zip trae todo dentro de una carpeta, se usa lo de dentro.
 *   · Nunca se escribe fuera de su carpeta (rutas con «..», absolutas o raras
 *     se rechazan) y no se publica lo editable (project.json, EditorData/).
 *   · El .zip se borra al terminar (quede publicado o no).
 *
 * Variables: SITIO (la dirección de GitHub Pages, opcional) y
 * GITHUB_REPOSITORY (usuario/repo, para armar la dirección si no hay SITIO).
 * Deja en publicar/.errores lo que no se pudo publicar (y sale con código 0:
 * el paso siguiente del workflow decide).
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, renameSync, statSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const RAIZ = process.cwd();
const ENTRADA = join(RAIZ, "publicar");
const SALIDA = join(RAIZ, "publicadas");
const LISTA = join(SALIDA, "lista.json");
const MAX = 400 * 1024 * 1024;

const nombreLimpio = (s) => String(s || "librito").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "librito";

function sitio() {
  if (process.env.SITIO) return process.env.SITIO.endsWith("/") ? process.env.SITIO : process.env.SITIO + "/";
  const [d = "", n = ""] = (process.env.GITHUB_REPOSITORY || "").split("/");
  if (!d) return "./";
  return n.toLowerCase() === `${d.toLowerCase()}.github.io` ? `https://${d.toLowerCase()}.github.io/` : `https://${d.toLowerCase()}.github.io/${n}/`;
}

/** Una ruta de dentro del .zip que se puede escribir sin salir de su carpeta. */
function rutaSegura(r) {
  if (!r || r.length > 300 || r.includes("\\") || r.includes("\0") || r.startsWith("/") || /^[a-z]:/i.test(r)) return false;
  return r.split("/").every((p, i, a) => p !== ".." && p !== "." && (p !== "" || i === a.length - 1));
}

function leerLista() {
  try { return JSON.parse(readFileSync(LISTA, "utf8")).paginas || []; } catch (e) { return []; }
}

function archivosDe(dir, base = dir) {
  const out = [];
  for (const n of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, n.name);
    if (n.isSymbolicLink()) continue;
    if (n.isDirectory()) out.push(...archivosDe(p, base));
    else out.push(p.slice(base.length + 1));
  }
  return out;
}

const zips = existsSync(ENTRADA) ? readdirSync(ENTRADA).filter((n) => /\.zip$/i.test(n)) : [];
if (!zips.length) { console.log("No hay .zip en publicar/: nada que hacer."); process.exit(0); }

const errores = [];
let lista = leerLista();
for (const nombre of zips) {
  const zip = join(ENTRADA, nombre), slug = nombreLimpio(nombre.replace(/\s*\(\d+\)(?=\.zip$)/i, "").replace(/\.zip$/i, ""));
  try {
    if (statSync(zip).size > MAX) throw new Error("pesa más de 400 MB");
    const entradas = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\n").filter(Boolean);
    const malas = entradas.filter((r) => !rutaSegura(r));
    if (malas.length) throw new Error(`trae rutas no permitidas (${malas.slice(0, 3).join(", ")})`);
    const tmp = mkdtempSync(join(tmpdir(), "publicar-"));
    execFileSync("unzip", ["-q", "-o", zip, "-d", tmp, "-x", "project.json", "EditorData/*", "*/project.json", "*/EditorData/*", "__MACOSX/*"], { stdio: ["ignore", "ignore", "pipe"] });
    // ¿Todo dentro de una sola carpeta? Se usa lo de dentro.
    let base = tmp;
    const arriba = readdirSync(tmp).filter((n) => n !== ".DS_Store");
    if (!existsSync(join(tmp, "index.html")) && arriba.length === 1 && statSync(join(tmp, arriba[0])).isDirectory()) base = join(tmp, arriba[0]);
    if (!existsSync(join(base, "index.html"))) throw new Error("no trae index.html (¿es el .zip que descargó el editor?)");
    let ficha = {};
    try { ficha = JSON.parse(readFileSync(join(base, "publicar.json"), "utf8")); } catch (e) { /* opcional */ }
    rmSync(join(base, "publicar.json"), { force: true });
    const titulo = String(ficha.titulo || (readFileSync(join(base, "index.html"), "utf8").match(/<title>([^<]{1,80})<\/title>/i)?.[1] || slug)).trim().slice(0, 80);
    const paginas = Number(ficha.paginas) || (existsSync(join(base, "pages")) ? readdirSync(join(base, "pages")).filter((n) => /^pagina-\d+\.js$/.test(n)).length : 0);
    const destino = join(SALIDA, slug);
    rmSync(destino, { recursive: true, force: true });
    mkdirSync(dirname(destino), { recursive: true });
    renameSync(base, destino);
    rmSync(tmp, { recursive: true, force: true });
    const enlace = `${sitio()}publicadas/${slug}/`;
    lista = [{ slug, titulo, paginas, fecha: new Date().toISOString(), enlace }, ...lista.filter((p) => p.slug !== slug)];
    console.log(`Publicada «${titulo}» → ${enlace} (${archivosDe(destino).length} archivos)`);
  } catch (e) {
    errores.push(`${nombre}: ${e.message}`);
    console.log(`::error::No se pudo publicar ${nombre}: ${e.message}`);
  }
  rmSync(zip, { force: true });
}
mkdirSync(SALIDA, { recursive: true });
writeFileSync(LISTA, JSON.stringify({ paginas: lista }, null, 1) + "\n");
if (errores.length) writeFileSync(join(ENTRADA, ".errores"), errores.join("\n") + "\n");
