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
import { readdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
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

// Sonidos que se pueden añadir sin tocar código. Se buscan en
// `assets/audio/`, en `mis-sonidos/` y en la raíz, sin importar mayúsculas
// ni acentos: «corazón.mp3», «Corazon.MP3» y «corazon.m4a» valen igual.
const sinAcentos = (s) => nfc(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const buscarSonido = (nombre) => {
  for (const dir of ["assets/audio", "mis-sonidos", "paginas-html", ""]) {
    const f = (dir ? leer(dir) : readdirSync(RAIZ)).find((f) => sinAcentos(f).replace(/\.(mp3|m4a|ogg|wav|aac)$/, "") === nombre && /\.(mp3|m4a|ogg|wav|aac)$/i.test(f));
    if (f) return dir ? `${dir}/${nfc(f)}` : nfc(f);
  }
  return null;
};
const sonidos = { corazon: buscarSonido("corazon"), ojos: buscarSonido("ojos") };

// La música del tocadiscos: `tocadiscos musica/musica1.mp3` … `musica5.mp3`,
// una por zona del disco. Da igual si la carpeta se escribe con guion, con
// tilde o con mayúsculas. Donde falte una, el tocadiscos pone su melodía.
const carpetaTocadiscos = readdirSync(RAIZ).find(
  (f) => sinAcentos(f).replace(/[\s_-]+/g, "") === "tocadiscosmusica" && !f.includes(".")
);
const tocadiscos = [1, 2, 3, 4, 5].map((n) => {
  if (!carpetaTocadiscos) return null;
  const f = leer(carpetaTocadiscos).find(
    (f) => sinAcentos(f).replace(/\.(mp3|m4a|ogg|wav|aac)$/, "") === `musica${n}` && /\.(mp3|m4a|ogg|wav|aac)$/i.test(f)
  );
  return f ? `${nfc(carpetaTocadiscos)}/${nfc(f)}` : null;
});

// Las canciones de la radio: `la radio/music1.mp3`, `music2.mp3`… (también
// vale `musica1`). Las que haya, en orden; cada una es una emisora.
const carpetaRadio = readdirSync(RAIZ).find(
  (f) => ["laradio", "radio"].includes(sinAcentos(f).replace(/[\s_-]+/g, "")) && !f.includes(".")
);
const radio = carpetaRadio
  ? leer(carpetaRadio)
      .map((f) => ({ f, m: sinAcentos(f).match(/^musica?\s*(\d+)\.(mp3|m4a|ogg|wav|aac)$/) }))
      .filter((x) => x.m)
      .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
      .map((x) => `${nfc(carpetaRadio)}/${nfc(x.f)}`)
  : [];

// Los vales de «Vales de amor», uno por línea, en `mis-vales/vales.txt`.
// Las líneas que empiezan por # son notas y no salen; la que empieza por
// «dorado:» es el vale dorado del final.
const vales = (() => {
  const ruta = join(RAIZ, "mis-vales/vales.txt");
  if (!existsSync(ruta)) return null;
  const lineas = readFileSync(ruta, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const dorado = lineas.find((l) => /^dorado\s*:/i.test(l));
  const lista = lineas.filter((l) => l !== dorado);
  return lista.length ? { lista, dorado: dorado ? dorado.replace(/^dorado\s*:\s*/i, "") : null } : null;
})();

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
  sonidos,
  vales,
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
// Lo que las páginas HTML pueden hacer sonar, visto desde `paginas-html/`.
const desdePaginas = (r) => (r ? encodeURI(r.startsWith("paginas-html/") ? r.slice(13) : `../${r}`) : null);
const archivosPaginas = {
  ojos: desdePaginas(sonidos.ojos),
  tocadiscos: tocadiscos.map(desdePaginas),
  radio: radio.map(desdePaginas),
};

const SALIDAS = {
  "paginas-html/archivos.js":
    "// GENERADO por `node herramientas/contenido.mjs`: los sonidos que existen.\n" +
    "// ojos.mp3 (la caja de música), tocadiscos musica/musica1..5 (el tocadiscos)\n" +
    "// y la radio/music1..N (la radio).\n" +
    `window.LIBRO_ARCHIVOS = ${JSON.stringify(archivosPaginas, null, 2)};\n`,
  "noche-estrellada/archivos.js":
    "// GENERADO por `node herramientas/contenido.mjs`: los sonidos que existen.\n" +
    `window.NOCHE_ARCHIVOS = ${JSON.stringify(archivosNoche, null, 2)};\n`,
  "src/data/contenido.js":
    "// GENERADO: no se edita a mano. Lo rehace `node herramientas/contenido.mjs`\n" +
    "// y, en GitHub, la acción `.github/workflows/contenido.yml` a cada subida.\n" +
    `export default ${JSON.stringify(contenido, null, 2)};\n`,
};

// Con `--comprobar` no escribe nada: sólo dice si las listas están al día.
if (process.argv.includes("--comprobar")) {
  const viejas = Object.entries(SALIDAS).filter(
    ([ruta, texto]) => !existsSync(join(RAIZ, ruta)) || readFileSync(join(RAIZ, ruta), "utf8") !== texto
  );
  if (viejas.length) {
    console.log(`listas desactualizadas: ${viejas.map(([r]) => r).join(", ")}`);
    process.exit(1);
  }
  console.log("listas al día");
  process.exit(0);
}

for (const [ruta, texto] of Object.entries(SALIDAS)) writeFileSync(join(RAIZ, ruta), texto);
console.log(
  `contenido: ${paginasHtml.length} páginas html · ${amores.length} fotos de amores · ` +
    `${misVideos.length} vídeos · ${misFotos.length} fotos · icono ${icono || "—"} · noche ${contenido.noche} · ${archivosNoche.length} sonidos de la noche · ` +
    `corazón ${sonidos.corazon || "—"} · ojos ${sonidos.ojos || "—"} · tocadiscos ${tocadiscos.filter(Boolean).length}/5 · radio ${radio.length} · ` +
    `${vales ? vales.lista.length : 0} vales`
);
