// Construye dist/: una copia para PUBLICAR con todo el JavaScript minificado y sin comentarios
// (el código fuente legible se queda sólo en el repositorio privado).
//   npm i terser && node herramientas/proteger.mjs
import { cpSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { minify } from "terser";

const SALIDA = "dist";
const FUERA = new Set([".git", ".github", "node_modules", "dist", "android", "herramientas", "vendor-src"]);
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA);
for (const f of readdirSync(".")) {
  if (FUERA.has(f) || /\.(md|mjs|jks|log)$/i.test(f) || /^(LICENSE|package(-lock)?\.json)$/.test(f)) continue;
  cpSync(f, join(SALIDA, f), { recursive: true, filter: (o) => !/\.(md|mjs|jks|log)$/i.test(o) });
}

let n = 0, antes = 0, despues = 0;
async function recorrer(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (f !== "vendor") await recorrer(p); continue; }
    if (extname(f) !== ".js" || /\.min\.js$/.test(f) || f === "sw.js") continue;
    const src = readFileSync(p, "utf8");
    if (/^(\/\/ GENERADO|export default)/.test(src.slice(0, 40)) && src.length > 400000) continue;
    const esModulo = /^\s*(import|export)\b/m.test(src);
    const r = await minify(src, { module: esModulo, parse: { bare_returns: !esModulo }, compress: { passes: 2 }, mangle: { toplevel: false }, format: { comments: false } });
    if (r.code == null) throw new Error("no se pudo minificar " + p);
    antes += src.length; despues += r.code.length; n++;
    writeFileSync(p, r.code);
  }
}
await recorrer(SALIDA);
// Los .htaccess y robots se quedan; el sw.js sólo pierde comentarios.
const sw = join(SALIDA, "sw.js");
writeFileSync(sw, (await minify(readFileSync(sw, "utf8"), { format: { comments: false } })).code);
// El sitio vive en una carpeta con nombre aleatorio; la raíz queda vacía (404) y sin pistas.
const SECRETO = "r395271632d8a144908";
mkdirSync("dist-tmp");
for (const f of readdirSync(SALIDA)) cpSync(join(SALIDA, f), join("dist-tmp", SECRETO, f), { recursive: true });
rmSync(SALIDA, { recursive: true });
cpSync("dist-tmp", SALIDA, { recursive: true });
rmSync("dist-tmp", { recursive: true });
writeFileSync(join(SALIDA, "robots.txt"), "User-agent: *\nDisallow: /\n");
writeFileSync(join(SALIDA, "index.html"), "<!doctype html><meta charset=utf-8><meta name=robots content=noindex><title></title>");
writeFileSync(join(SALIDA, "404.html"), "<!doctype html><meta charset=utf-8><meta name=robots content=noindex><title>404</title>404");
console.log(`dist/: ${n} archivos JS · ${(antes / 1024).toFixed(0)} KB → ${(despues / 1024).toFixed(0)} KB`);
