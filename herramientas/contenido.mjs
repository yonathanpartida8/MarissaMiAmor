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
import { readdirSync, existsSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

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
// La nota de voz de «Cómo dices mi nombre»: `audio/audio.mp3` (o el primer
// audio que haya en esa carpeta).
const carpetaAudio = readdirSync(RAIZ).find((f) => sinAcentos(f) === "audio" && !f.includes("."));
const voz = (() => {
  if (!carpetaAudio) return null;
  const hay = leer(carpetaAudio).filter((f) => /\.(mp3|m4a|ogg|wav|aac)$/i.test(f)).sort(orden);
  const f = hay.find((f) => sinAcentos(f).startsWith("audio.")) || hay[0];
  return f ? `${nfc(carpetaAudio)}/${nfc(f)}` : null;
})();
const sonidos = { corazon: buscarSonido("corazon"), ojos: buscarSonido("ojos"), voz };

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

// La huella de cada foto (un trocito del hash de su contenido). El libro la
// pone al final de la dirección (`imagen1.png?v=3fa2c1d0`): si se sube otra
// foto con el MISMO nombre, la dirección cambia y el teléfono ya no enseña
// la vieja que tenía guardada.
const huellas = {};
for (const dir of ["fotos-paginas", "sorpresas", "images/amores", "mis-paginas/fotos"]) {
  const recorrerFotos = (d) => leer(d).forEach((f) => {
    const ruta = `${d}/${f}`;
    try {
      if (statSync(join(RAIZ, ruta)).isDirectory()) return recorrerFotos(ruta);
    } catch { return; }
    if (!/\.(png|jpe?g|webp|gif|avif)$/i.test(f)) return;
    huellas[nfc(ruta)] = createHash("md5").update(readFileSync(join(RAIZ, ruta))).digest("hex").slice(0, 8);
  });
  if (existsSync(join(RAIZ, dir))) recorrerFotos(dir);
}

// ── TEXTOS EN .txt ───────────────────────────────────────────────────
// La forma fácil de cambiar títulos y textos, sin tocar código:
//   · al lado de un vídeo o foto de `mis-paginas/`, un .txt con su mismo
//     nombre (`video.mp4` → `video.txt`);
//   · en cualquier carpeta de `fotos-paginas/`, un `textos.txt`.
// Dentro, una línea por cosa:
//   titulo: Te dedico este video
//   arriba: dale play 🤍
//   texto: ¡Míralo completo!
// (el texto puede seguir en las líneas de abajo). Sin «titulo:» ni nada,
// la primera línea es el título y el resto, el texto.
const CLAVES = { titulo: "titulo", "título": "titulo", title: "titulo", arriba: "arriba", encima: "arriba", texto: "texto", text: "texto" };
function leerTextos(ruta) {
  let crudo;
  try {
    crudo = readFileSync(join(RAIZ, ruta), "utf8");
  } catch {
    return null;
  }
  crudo = crudo.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!crudo) return null;
  const campos = {};
  let actual = null;
  let conClaves = false;
  for (const linea of crudo.split("\n")) {
    const m = /^\s*(t[ií]tulo|title|arriba|encima|texto|text)\s*:\s*(.*)$/i.exec(linea);
    if (m) {
      conClaves = true;
      actual = CLAVES[m[1].toLowerCase()];
      campos[actual] = m[2];
    } else if (actual) {
      campos[actual] += "\n" + linea;
    }
  }
  if (!conClaves) {
    const [primera, ...resto] = crudo.split("\n");
    campos.titulo = primera;
    campos.texto = resto.join("\n");
  }
  for (const k of Object.keys(campos)) {
    // Una línea en blanco (o varias) entre párrafos = un párrafo nuevo.
    campos[k] = campos[k].replace(/[ \t]+\n/g, "\n").replace(/\n\s*\n+/g, "\n").trim();
    if (!campos[k]) delete campos[k];
  }
  return Object.keys(campos).length ? campos : null;
}

const conTxt = (dir, archivos) =>
  Object.fromEntries(
    archivos
      .map((f) => {
        const base = f.replace(/\.[^.]+$/, "");
        const txt = leer(dir).find((x) => x.normalize("NFC").toLowerCase() === `${base}.txt`.normalize("NFC").toLowerCase());
        const t = txt && leerTextos(`${dir}/${txt}`);
        return t ? [`${dir}/${f}`, t] : null;
      })
      .filter(Boolean)
  );
const textosMios = { ...conTxt("mis-paginas/videos", misVideos), ...conTxt("mis-paginas/fotos", misFotos) };
const textosPaginas = Object.fromEntries(
  Object.keys(fotosPaginas)
    .map((c) => {
      const txt = leer(`fotos-paginas/${c}`).find((x) => /^textos\.txt$/i.test(x));
      const t = txt && leerTextos(`fotos-paginas/${c}/${txt}`);
      return t ? [c, t] : null;
    })
    .filter(Boolean)
);

// ── LA FORMA DE CADA VÍDEO ───────────────────────────────────────────
// Ancho y alto (ya girados si el teléfono lo grabó de lado) y duración,
// leídos del propio .mp4: así la página sabe desde el principio si el
// vídeo es acostado o de pie y el marco no salta al cargar.
function formaVideo(ruta) {
  let d;
  try {
    d = readFileSync(join(RAIZ, ruta));
  } catch {
    return null;
  }
  let w = 0, h = 0, dur = 0;
  for (let i = d.indexOf("tkhd"); i > 0; i = d.indexOf("tkhd", i + 4)) {
    const v = d[i + 4];
    const base = i + 4;
    const mat = base + (v === 1 ? 52 : 40);
    const tw = d.readUInt32BE(base + (v === 1 ? 88 : 76)) / 65536;
    const th = d.readUInt32BE(base + (v === 1 ? 92 : 80)) / 65536;
    if (!tw || !th) continue;
    const a = d.readInt32BE(mat), b = d.readInt32BE(mat + 4);
    const girado = a === 0 && Math.abs(b) === 65536;
    [w, h] = girado ? [th, tw] : [tw, th];
    break;
  }
  const m = d.indexOf("mvhd");
  if (m > 0) {
    const v = d[m + 4];
    const escala = d.readUInt32BE(m + 4 + (v === 1 ? 20 : 12));
    const larga = v === 1 ? Number(d.readBigUInt64BE(m + 4 + 24)) : d.readUInt32BE(m + 4 + 16);
    if (escala) dur = Math.round((larga / escala) * 10) / 10;
  }
  return w && h ? { w: Math.round(w), h: Math.round(h), dur } : null;
}
const videosForma = Object.fromEntries(
  misVideos.map((f) => [`mis-paginas/videos/${f}`, formaVideo(`mis-paginas/videos/${f}`)]).filter(([, x]) => x)
);

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
  huellas,
  textosMios,
  textosPaginas,
  videosForma,
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
// Y cuánto pesa cada uno: los largos (más de 3 MB) la noche no los carga
// enteros en memoria, los reproduce en streaming.
const pesosNoche = Object.fromEntries(
  archivosNoche.map((r) => {
    try { return [r, statSync(join(RAIZ, "noche-estrellada", r)).size]; } catch { return [r, 0]; }
  }).filter(([, t]) => t > 3_000_000)
);
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
    `window.NOCHE_ARCHIVOS = ${JSON.stringify(archivosNoche, null, 2)};\n` +
    "// Los que pesan más de 3 MB (se reproducen en streaming, no se cargan enteros).\n" +
    `window.NOCHE_PESADOS = ${JSON.stringify(pesosNoche, null, 2)};\n`,
  "src/data/contenido.js":
    "// GENERADO: no se edita a mano. Lo rehace `node herramientas/contenido.mjs`\n" +
    "// y, en GitHub, la acción `.github/workflows/contenido.yml` a cada subida.\n" +
    `export default ${JSON.stringify(contenido, null, 2)};\n`,
};

// La reserva de la portada en `index.html`: tiene que pedir EXACTAMENTE la
// misma dirección que el libro (con su huella), o la foto se baja dos veces.
{
  const portada = fotosPaginas["01-portada"]?.[0];
  const html = readFileSync(join(RAIZ, "index.html"), "utf8");
  const re = /<link rel="preload" as="image" href="[^"]*"( data-portada)?>/;
  if (portada && re.test(html)) {
    const ruta = `fotos-paginas/01-portada/${portada}`;
    const h = huellas[nfc(ruta)];
    const href = `fotos-paginas/01-portada/${encodeURIComponent(portada)}${h ? `?v=${h}` : ""}`;
    SALIDAS["index.html"] = html.replace(re, `<link rel="preload" as="image" href="${href}" data-portada>`);
  }
}

// Los módulos que el libro necesita para arrancar (todo lo que `src/main.js`
// importa, directa o indirectamente, sin contar las páginas, que se piden
// al llegar a ellas): van como `modulepreload` en `index.html` para que el
// teléfono los pida todos juntos y no en seis tandas seguidas.
{
  const MAPA = { three: "vendor/three/three.module.min.js" };
  const vistos = new Set();
  const visitar = (rel) => {
    if (vistos.has(rel) || !existsSync(join(RAIZ, rel))) return;
    vistos.add(rel);
    const src = readFileSync(join(RAIZ, rel), "utf8");
    const re = /(?:^|[;\n])\s*(?:import\s+(?:[^'"()]*?\s+from\s+)?|export\s+(?:\*|\{[^}]*\})\s+from\s+)["']([^"']+)["']/g;
    for (let m; (m = re.exec(src)); ) {
      let d = m[1];
      if (MAPA[d]) d = MAPA[d];
      else if (d.startsWith(".")) d = join(rel, "..", d).replace(/\\/g, "/");
      else continue;
      visitar(d);
    }
  };
  visitar("src/main.js");
  vistos.delete("src/main.js");
  const html = SALIDAS["index.html"] ?? readFileSync(join(RAIZ, "index.html"), "utf8");
  const re = /<!-- modulos:inicio -->[\s\S]*?<!-- modulos:fin -->/;
  if (re.test(html)) {
    const lista = [...vistos].sort().map((m) => `<link rel="modulepreload" href="${m}">`).join("\n");
    SALIDAS["index.html"] = html.replace(re, `<!-- modulos:inicio -->\n${lista}\n<!-- modulos:fin -->`);
  }
}

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
