/**
 * Hace `src/data/contenido.js`: la lista de lo que HAY en las carpetas.
 *
 * Un sitio de archivos (GitHub Pages, o el libro abierto como archivo en
 * el móvil) no sabe decir qué hay en una carpeta. Antes el libro lo
 * averiguaba pidiendo `amor1.png`, `amor2.png`… hasta que fallaban, y cada
 * fallo era un 404 en rojo. Con esta lista no se pide nada que no exista.
 *
 *   node herramientas/contenido.mjs
 *
 * En GitHub se ejecuta solo a cada subida (`.github/workflows/contenido.yml`).
 */
import { readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname;
const leer = (dir) => (existsSync(join(RAIZ, dir)) ? readdirSync(join(RAIZ, dir)) : []);
const nfc = (s) => s.normalize("NFC");
const porNumero = (a, b) => a.numero - b.numero || a.archivo.localeCompare(b.archivo);

const paginasHtml = leer("paginas-html")
  .map((archivo) => ({ archivo, m: /^p[aá]gina\.html(\d+)\.html$/i.exec(nfc(archivo)) }))
  .filter((x) => x.m)
  .map((x) => ({ numero: +x.m[1], archivo: x.archivo }))
  .sort(porNumero);

const amores = leer("images/amores")
  .map((archivo) => ({ archivo, m: /^amor(\d+)\.(png|jpe?g|webp|gif|avif)$/i.exec(archivo) }))
  .filter((x) => x.m)
  .map((x) => ({ numero: +x.m[1], archivo: x.archivo }))
  .sort(porNumero);

const orden = (a, b) => a.localeCompare(b, "es", { numeric: true });
const misVideos = leer("mis-paginas/videos").filter((f) => /\.(mp4|webm|m4v|mov)$/i.test(f)).sort(orden);
const misFotos = leer("mis-paginas/fotos").filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f)).sort(orden);

// Una carpeta por página con imágenes: imagen1, imagen2… en orden.
const fotosPaginas = Object.fromEntries(
  leer("fotos-paginas")
    .filter((c) => !c.includes("."))
    .sort(orden)
    .map((c) => [
      c,
      leer(`fotos-paginas/${c}`)
        .map((f) => ({ f, m: /^imagen(\d+)\.(png|jpe?g|webp|gif|avif)$/i.exec(f) }))
        .filter((x) => x.m)
        .sort((a, b) => a.m[1] - b.m[1])
        .map((x) => x.f),
    ])
);

// Fotos propias para las sorpresas: `sorpresas/<id-de-la-página>.jpg`.
const sorpresas = Object.fromEntries(
  leer("sorpresas")
    .filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f))
    .map((f) => [f.replace(/\.[^.]+$/, ""), f])
);

const ICONOS = ["icono/icono.png", "icono/icono.jpg", "icono/icono.jpeg", "icono/icono.webp", "icono/icono.svg", "icono/icon.png"];
const icono = ICONOS.find((r) => existsSync(join(RAIZ, r))) || null;

const contenido = {
  paginasHtml,
  amores,
  misVideos,
  misFotos,
  icono,
  fotosPaginas,
  sorpresas,
  noche: existsSync(join(RAIZ, "noche-estrellada/index.html")),
};

// Y los sonidos que la noche puede usar, para que no pida los que faltan.
const recorrer = (dir, pre = "") =>
  leer(dir).flatMap((f) => {
    const ruta = join(dir, f);
    try {
      return readdirSync(join(RAIZ, ruta)).length >= 0 ? recorrer(ruta, `${pre}${f}/`) : [];
    } catch {
      return [`${pre}${f}`];
    }
  });
const SONIDO = /\.(mp3|ogg|wav|m4a|aac|webm)$/i;
const archivosNoche = [
  ...recorrer("noche-estrellada").filter((f) => SONIDO.test(f)),
  ...leer("assets/audio").filter((f) => SONIDO.test(f)).map((f) => `../assets/audio/${f}`),
].map(nfc).sort();
writeFileSync(
  join(RAIZ, "noche-estrellada/archivos.js"),
  "// GENERADO por `node herramientas/contenido.mjs`: los sonidos que existen.\n" +
    `window.NOCHE_ARCHIVOS = ${JSON.stringify(archivosNoche, null, 2)};\n`
);

writeFileSync(
  join(RAIZ, "src/data/contenido.js"),
  "// GENERADO: no se edita a mano. Lo rehace `node herramientas/contenido.mjs`\n" +
    "// y, en GitHub, la acción `.github/workflows/contenido.yml` a cada subida.\n" +
    `export default ${JSON.stringify(contenido, null, 2)};\n`
);
console.log(
  `contenido: ${paginasHtml.length} páginas html · ${amores.length} fotos de amores · ` +
    `${misVideos.length} vídeos · ${misFotos.length} fotos · icono ${icono || "—"} · noche ${contenido.noche} · ${archivosNoche.length} sonidos de la noche`
);
