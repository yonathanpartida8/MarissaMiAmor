/**
 * SERVIR EL PROYECTO EN TU COMPUTADORA (para usar el editor sin GitHub).
 *
 *   node herramientas/servir.mjs            → http://localhost:8080/EditorDev/
 *   PUERTO=9000 node herramientas/servir.mjs
 *
 * Además:
 *   · lista las carpetas (el editor ve al instante lo que dejes en assets/,
 *     sin volver a generar el catálogo);
 *   · /giphy/…  un proxy para GIPHY que pone la clave AQUÍ (no en el
 *     navegador): la lee de la variable GIPHY_KEY o del archivo `.giphy-clave`
 *     en la raíz del proyecto (git lo ignora; nunca se sube).
 */
import { createServer } from "node:http";
import { readFile, stat, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, extname, normalize } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname;
const PUERTO = +(process.env.PUERTO || 8080);
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav", ".mp4": "video/mp4", ".webm": "video/webm", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".md": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

function clave() {
  if (process.env.GIPHY_KEY) return process.env.GIPHY_KEY.trim();
  const f = join(RAIZ, ".giphy-clave");
  return existsSync(f) ? readFileSync(f, "utf8").trim() : "";
}

async function giphy(req, res, ruta) {
  if (ruta === "/giphy/ping") { res.writeHead(clave() ? 200 : 404, { "content-type": "text/plain" }); return res.end(clave() ? "giphy-ok" : "sin clave"); }
  const m = ruta.match(/^\/giphy\/v1\/(gifs|stickers)\/(search|trending)$/);
  if (!m || !clave()) { res.writeHead(404); return res.end(); }
  const q = new URL(req.url, "http://x").searchParams;
  q.set("api_key", clave());
  try {
    const r = await fetch(`https://api.giphy.com/v1/${m[1]}/${m[2]}?${q}`);
    res.writeHead(r.status, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) { res.writeHead(502); res.end(); }
}

createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta.startsWith("/giphy/")) return giphy(req, res, ruta);
  const archivo = normalize(join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ) || /\/\.(git|giphy-clave)/.test(archivo)) { res.writeHead(403); return res.end(); }
  try {
    const s = await stat(archivo);
    if (s.isDirectory()) {
      if (!ruta.endsWith("/")) { res.writeHead(301, { location: ruta + "/" }); return res.end(); }
      if (existsSync(join(archivo, "index.html"))) { res.writeHead(200, { "content-type": TIPOS[".html"] }); return res.end(await readFile(join(archivo, "index.html"))); }
      const lista = (await readdir(archivo, { withFileTypes: true })).filter((d) => !d.name.startsWith("."));
      res.writeHead(200, { "content-type": TIPOS[".html"] });
      return res.end(`<!doctype html><title>${ruta}</title><ul>${lista.map((d) => `<li><a href="${encodeURIComponent(d.name)}${d.isDirectory() ? "/" : ""}">${d.name}</a></li>`).join("")}</ul>`);
    }
    res.writeHead(200, { "content-type": TIPOS[extname(archivo).toLowerCase()] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(await readFile(archivo));
  } catch (e) { res.writeHead(404); res.end("No está"); }
}).listen(PUERTO, () => {
  console.log(`Listo: http://localhost:${PUERTO}/EditorDev/`);
  console.log(clave() ? "GIPHY: conectado por este servidor (la clave no sale de tu computadora)." : "GIPHY: sin clave (pon GIPHY_KEY=… o un archivo .giphy-clave para usar el proxy).");
});
