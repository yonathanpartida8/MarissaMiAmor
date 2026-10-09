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
 *   assets/<categoría>/algo.html                 → componente de UN SOLO ARCHIVO (HTML,
 *       CSS y JS juntos). Su nombre sale de <title> (o del archivo); opcional:
 *       <meta name="tamaño" content="320x200">, <meta name="descripcion" …>,
 *       <meta name="decorativo" content="si"> (no recibe toques)
 *   assets/<categoría>/algo.png|jpg|webp|gif|svg → una imagen o adorno
 *   assets/<categoría>/algo.mp3|m4a|ogg|wav      → un sonido
 *   assets/<categoría>/algo.glb|gltf|obj         → un modelo 3D (elemento «Escena 3D»)
 *   musica assets/*.mp3|m4a|ogg|wav              → la biblioteca de música
 *   DevMusic/*.mp3|m4a|ogg|wav                   → la música que suena MIENTRAS editas
 *
 * Carpetas especiales (lo que el editor ofrece en sus paneles, no como piezas):
 *   assets/animaciones/<nombre>/animacion.json|css|js   → Animar (+ miniatura.*)
 *   assets/transiciones/<nombre>/transicion.json|css|js → Transiciones
 *   assets/efectos/<nombre>.json  (o <nombre>/efecto.json) → Efectos (filtros listos)
 *   assets/fondos/<nombre>/index.html  (o <nombre>.html)   → Fondos con HTML
 *   assets/sonidos-editor/<categoría>/*.mp3|wav|ogg        → sonidos del propio editor
 *   assets/iconos/<nombre>.svg                              → cambia un icono del editor
 *   assets/deslizar/<estilo>/izquierda.*|derecha.*          → botones para pasar página
 *   (una carpeta con index.html dentro de animaciones/ o efectos/ sigue siendo una pieza)
 *
 * Nada de esto toca los archivos: sólo los lista.
 */
import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const IMG = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const AUD = /\.(mp3|m4a|ogg|wav|aac)$/i;
const MOD = /\.(glb|gltf|obj)$/i;
const PREVIEW = /^(preview|miniatura|thumb)\.(png|jpe?g|webp|svg|gif)$/i;
const NOMBRES = {
  buttons: "Botones", botones: "Botones", players: "Reproductores", reproductores: "Reproductores",
  portraits: "Retratos", retratos: "Retratos", effects: "Efectos", efectos: "Efectos",
  animations: "Animaciones", animaciones: "Animaciones", decorations: "Decoraciones", decoraciones: "Decoraciones",
  frames: "Marcos", marcos: "Marcos", ui: "Interfaz", cards: "Tarjetas", tarjetas: "Tarjetas",
  audio: "Sonidos", sonidos: "Sonidos", img: "Imágenes", imagenes: "Imágenes", stickers: "Stickers",
  elementos: "Elementos", "efectos-animados": "Efectos animados", dibujos: "Dibujos", textos: "Textos", fondos: "Fondos", hojas: "Hojas", otros: "Otros", gifs: "GIFs",
  "3d": "3D", modelos: "3D", models: "3D",
};
const ORDEN = ["elementos", "botones", "buttons", "marcos", "frames", "tarjetas", "cards", "hojas", "dibujos", "efectos-animados", "decoraciones", "players", "portraits", "effects", "animations", "decorations", "stickers", "ui"];
const SOLO_EXTRAS = new Set(["sonidos-editor", "iconos", "fondos", "transiciones", "deslizar"]);
const DEF = { animaciones: /^animacion\.(json|css|js)$/i, transiciones: /^transicion\.(json|css|js)$/i };

const bonito = (s) => s.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
// En assets/elementos/ el nombre sale del archivo (rayos.html → «Rayos»); el
// <title> sólo se usa si dice lo mismo con tildes («Corazón neón»).
const sinTilde = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
// Un <title> genérico («Document», «Untitled», «index»…) no es un nombre: se usa el del archivo.
const GENERICO = /^(document|documento|untitled|sin t[ií]tulo|new page|nueva p[aá]gina|p[aá]gina|page|index|home|inicio|test|prueba|html|html5|my page|mi p[aá]gina|title|t[ií]tulo|web|website)\s*\d*$/i;
const nombreDe = (cat, f, titulo) => {
  const archivo = bonito(f.split("/").pop());
  if (!titulo || titulo.length < 2 || GENERICO.test(titulo.trim())) return archivo;
  return cat === "elementos" && sinTilde(titulo) !== sinTilde(archivo) ? archivo : titulo;
};
// «Efectos Animados», «efectos_animados», «Botónes» → la misma carpeta de siempre.
const normCat = (c) => sinTilde(c).replace(/[\s_]+/g, "-");
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

/** Lo que un .html de un solo archivo dice de sí mismo (<title> y <meta>). */
function metaHtml(p) {
  try {
    const t = readFileSync(p, "utf8").slice(0, 6000);
    const meta = (n) => (new RegExp(`<meta[^>]+name=["']${n}["'][^>]*content=["']([^"']*)["']`, "i").exec(t) || new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${n}["']`, "i").exec(t) || [])[1];
    const r = {};
    const ti = /<title>([^<]{1,80})<\/title>/i.exec(t);
    if (ti && ti[1].trim()) r.nombre = ti[1].trim();
    const tam = /(\d{2,4})\s*[x×]\s*(\d{2,4})/.exec(meta("tama(?:ñ|n)o") || meta("size") || "");
    if (tam) { r.ancho = +tam[1]; r.alto = +tam[2]; }
    const d = meta("descripci(?:ó|o)n") || meta("description");
    if (d) r.descripcion = d.slice(0, 140);
    if (/^(si|sí|true|1)$/i.test(meta("decorativo") || "")) r.decorativo = true;
    return r;
  } catch (e) { return {}; }
}

function medida(p) {
  if (/\.svg$/i.test(p)) return medidaSvg(p);
  if (/\.png$/i.test(p)) return medidaPng(p);
  return {};
}

/** Lo de las carpetas especiales (animaciones, transiciones, efectos, fondos, sonidos, iconos). */
function extrasDe(raiz) {
  const ex = { animaciones: [], transiciones: [], efectos: [], fondos: [], sonidos: {}, iconos: {}, deslizar: [] };
  const lista = (d) => (existsSync(d) ? readdirSync(d).filter((f) => !f.startsWith(".") && !/^(léeme|leeme|readme)\.(md|txt)$/i.test(f)).sort(orden) : []);
  for (const tipo of ["animaciones", "transiciones"]) {
    const d = join(raiz, tipo);
    for (const f of lista(d)) {
      const p = join(d, f);
      if (!esDir(p)) continue;
      const archivos = todos(p);
      const def = archivos.filter((a) => DEF[tipo].test(a));
      if (!def.length) continue;
      const prev = archivos.find((a) => PREVIEW.test(a));
      ex[tipo].push({ id: `${tipo}/${f}`, nombre: bonito(f), ruta: `assets/${tipo}/${f}/`, definicion: def, miniatura: prev ? `assets/${tipo}/${f}/${prev}` : null });
    }
  }
  const de = join(raiz, "efectos");
  for (const f of lista(de)) {
    const p = join(de, f);
    if (esDir(p)) { if (existsSync(join(p, "efecto.json"))) { const prev = todos(p).find((a) => PREVIEW.test(a)); ex.efectos.push({ id: `efectos/${f}`, nombre: bonito(f), ruta: `assets/efectos/${f}/efecto.json`, miniatura: prev ? `assets/efectos/${f}/${prev}` : null }); } }
    else if (/\.json$/i.test(f)) ex.efectos.push({ id: `efectos/${f}`, nombre: bonito(f), ruta: `assets/efectos/${f}`, miniatura: null });
  }
  const df = join(raiz, "fondos");
  for (const f of lista(df)) {
    const p = join(df, f);
    if (esDir(p)) {
      if (!existsSync(join(p, "index.html"))) continue;
      const archivos = todos(p);
      const prev = archivos.find((a) => PREVIEW.test(a));
      ex.fondos.push({ tipo: "html", id: `fondos/${f}`, nombre: bonito(f), ruta: `assets/fondos/${f}/index.html`, base: `assets/fondos/${f}/`, archivos, miniatura: prev ? `assets/fondos/${f}/${prev}` : null });
    } else if (/\.html?$/i.test(f)) ex.fondos.push({ tipo: "html", id: `fondos/${f}`, nombre: bonito(f), ruta: `assets/fondos/${f}`, base: "assets/fondos/", archivos: [f], miniatura: null });
    else if (IMG.test(f)) ex.fondos.push({ tipo: "imagen", id: `fondos/${f}`, nombre: bonito(f), ruta: `assets/fondos/${f}`, miniatura: `assets/fondos/${f}` });
  }
  const ds = join(raiz, "sonidos-editor");
  for (const c of lista(ds)) {
    const p = join(ds, c);
    if (!esDir(p)) continue;
    const sons = todos(p).filter((a) => AUD.test(a)).map((a) => `assets/sonidos-editor/${c}/${a}`);
    if (sons.length) ex.sonidos[c.toLowerCase()] = sons;
  }
  const di = join(raiz, "iconos");
  for (const f of lista(di)) if (/\.svg$/i.test(f)) ex.iconos[f.replace(/\.svg$/i, "")] = `assets/iconos/${f}`;
  const dd = join(raiz, "deslizar");
  for (const f of lista(dd)) {
    const p = join(dd, f);
    if (!esDir(p)) continue;
    const fs = readdirSync(p);
    const izq = fs.find((a) => /^(izquierda|left)\.(svg|png|webp|gif|avif)$/i.test(a));
    const der = fs.find((a) => /^(derecha|right)\.(svg|png|webp|gif|avif)$/i.test(a));
    if (izq && der) ex.deslizar.push({ id: `deslizar/${f}`, nombre: bonito(f), izquierda: `assets/deslizar/${f}/${izq}`, derecha: `assets/deslizar/${f}/${der}` });
  }
  return ex;
}

/** Fecha en que llegó cada archivo: la del catálogo anterior (estable), la de git
 *  (cuándo se añadió) o, si es nuevo de verdad, ahora. Así lo nuevo sale primero. */
function fechas(RAIZ) {
  const previas = new Map();
  try {
    const t = readFileSync(join(RAIZ, "assets", "catalogo.js"), "utf8");
    const json = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
    for (const g of json.categorias || []) for (const it of g.items || []) if (it.fecha) previas.set(it.id, it.fecha);
  } catch (e) { /* primera vez */ }
  const git = new Map();
  try {
    const log = execSync("git log --diff-filter=A --format=@%ct --name-only -- assets", { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 32 << 20 });
    let ts = 0;
    for (const l of log.split("\n")) {
      if (l.startsWith("@")) ts = +l.slice(1) * 1000;
      else if (l && !git.has(l)) git.set(l, ts);
    }
  } catch (e) { /* sin git */ }
  return { previas, git, habia: previas.size > 0 };
}

export function catalogo(RAIZ) {
  const raiz = join(RAIZ, "assets");
  const categorias = [];
  const F = fechas(RAIZ);
  const fechaDe = (id, ruta, abs) => F.previas.get(id) || F.git.get(ruta) || (F.habia ? Date.now() : Math.round(statSync(abs).mtimeMs));
  const SALTAR = (f) => f.startsWith(".") || f.startsWith("_") || /^(l[ée]eme|readme)\.(md|txt)$/i.test(f) || PREVIEW.test(f) || /^asset\.json$/i.test(f);
  if (existsSync(raiz)) {
    const cats = readdirSync(raiz).filter((c) => !c.startsWith(".") && !c.startsWith("_") && !SOLO_EXTRAS.has(normCat(c)) && esDir(join(raiz, c)));
    cats.sort((a, b) => ((ORDEN.indexOf(normCat(a)) + 1 || 99) - (ORDEN.indexOf(normCat(b)) + 1 || 99)) || orden(a, b));
    for (const cat of cats) {
      const items = [];
      const nc = normCat(cat);
      // Un componente con carpeta: index.html, o el ÚNICO .html de la carpeta (con su css/js/imágenes al lado).
      const componente = (p, rel, entrada) => {
        let meta = {};
        if (existsSync(join(p, "asset.json"))) { try { meta = JSON.parse(readFileSync(join(p, "asset.json"), "utf8")); } catch (e) { meta = { error: "asset.json no se pudo leer" }; } }
        const m = entrada === "index.html" ? {} : metaHtml(join(p, entrada));
        const archivos = todos(p);
        const peso = archivos.reduce((s, a) => s + statSync(join(p, a)).size, 0);
        const prev = archivos.find((a) => PREVIEW.test(a));
        const id = `${cat}/${rel}`, ruta = `assets/${cat}/${rel}`;
        items.push({
          tipo: "componente", id, nombre: meta.nombre || (entrada === "index.html" ? bonito(rel.split("/").pop()) : nombreDe(nc, entrada, m.nombre)), descripcion: meta.descripcion || m.descripcion || "",
          ruta: ruta + "/", entrada, ancho: meta.ancho || m.ancho || null, alto: meta.alto || m.alto || null,
          parametros: meta.parametros || [], decorativo: !!(meta.decorativo || m.decorativo), aislado: !!meta.aislado,
          miniatura: prev ? `${ruta}/${prev}` : null, archivos, peso, fecha: fechaDe(id, `${ruta}/${entrada}`, join(p, entrada)),
        });
      };
      // Recorre la carpeta de la categoría y sus subcarpetas (para ordenar en grupos).
      const recorrer = (dir, rel) => {
        for (const f of readdirSync(dir).sort(orden)) {
          if (SALTAR(f)) continue;
          const p = join(dir, f), r = rel + f;
          const ruta = `assets/${cat}/${r}`;
          if (esDir(p)) {
            const dentro = readdirSync(p).filter((x) => !SALTAR(x));
            const htmls = dentro.filter((x) => /\.html?$/i.test(x) && !esDir(join(p, x)));
            // Una animación de assets/animaciones/ no es una pieza (sí lo es si sólo trae index.html).
            if (nc === "animaciones" && dentro.some((a) => DEF.animaciones.test(a))) continue;
            if (nc === "efectos" && existsSync(join(p, "efecto.json")) && !htmls.length) continue;
            if (htmls.some((x) => x.toLowerCase() === "index.html")) componente(p, r, htmls.find((x) => x.toLowerCase() === "index.html"));
            else if (htmls.length === 1) componente(p, r, htmls[0]);
            else recorrer(p, r + "/"); // varios .html sueltos (o subcarpetas): cada uno es una pieza
          } else if (nc === "efectos" && /\.json$/i.test(f)) {
            continue; // un filtro listo (va en extras.efectos)
          } else if (/\.html?$/i.test(f)) {
            const m = metaHtml(p), id = `${cat}/${r}`;
            items.push({ tipo: "componente", id, nombre: nombreDe(nc, f, m.nombre), descripcion: m.descripcion || "", ruta: `assets/${cat}/${rel}`, entrada: f, ancho: m.ancho || null, alto: m.alto || null, parametros: [], decorativo: !!m.decorativo, miniatura: null, archivos: [f], peso: statSync(p).size, suelto: true, fecha: fechaDe(id, ruta, p) });
          } else if (IMG.test(f)) {
            items.push({ tipo: "imagen", id: `${cat}/${r}`, nombre: bonito(f), ruta, ...medida(p), peso: statSync(p).size, fecha: fechaDe(`${cat}/${r}`, ruta, p) });
          } else if (AUD.test(f)) {
            items.push({ tipo: "audio", id: `${cat}/${r}`, nombre: bonito(f), ruta, peso: statSync(p).size, fecha: fechaDe(`${cat}/${r}`, ruta, p) });
          } else if (MOD.test(f)) {
            items.push({ tipo: "modelo", id: `${cat}/${r}`, nombre: bonito(f), ruta, peso: statSync(p).size, fecha: fechaDe(`${cat}/${r}`, ruta, p) });
          }
        }
      };
      recorrer(join(raiz, cat), "");
      // Lo más nuevo primero (y a igual fecha, por nombre).
      items.sort((a, b) => (b.fecha || 0) - (a.fecha || 0) || orden(a.nombre, b.nombre));
      const nombre = NOMBRES[nc] || bonito(cat);
      const ya = categorias.find((g) => g.nombre === nombre); // «botones» y «buttons» van juntas
      if (ya) { ya.items.push(...items); ya.items.sort((a, b) => (b.fecha || 0) - (a.fecha || 0) || orden(a.nombre, b.nombre)); }
      else if (items.length) categorias.push({ id: cat, nombre, items });
    }
  }
  const dirMusica = join(RAIZ, "musica assets");
  const musica = existsSync(dirMusica)
    ? todos(dirMusica).filter((f) => AUD.test(f)).map((f) => ({ nombre: bonito(f.split("/").pop()), ruta: `musica assets/${f}`, peso: statSync(join(dirMusica, f)).size }))
    : [];
  const dirDev = join(RAIZ, "DevMusic");
  const devMusic = existsSync(dirDev)
    ? todos(dirDev).filter((f) => AUD.test(f)).map((f) => ({ nombre: bonito(f.split("/").pop()), ruta: `DevMusic/${f}`, peso: statSync(join(dirDev, f)).size }))
    : [];
  return { categorias, musica, devMusic, estilos: estilosDe(RAIZ), extras: extrasDe(raiz) };
}

/* Cada estilo del editor en su carpeta: EditorDev/estilos/<estilo>/
     musica/*.mp3…   canciones que suenan con ese estilo
     musica.txt      (opcional) canciones del repositorio, una ruta por línea
     fuentes/*.woff2|ttf|otf  su letra propia (opcional) */
function estilosDe(RAIZ) {
  const base = join(RAIZ, "EditorDev", "estilos");
  const r = {};
  if (!existsSync(base)) return r;
  for (const e of readdirSync(base).filter((x) => !x.startsWith(".") && esDir(join(base, x))).sort(orden)) {
    const dir = join(base, e), rel = `EditorDev/estilos/${e}`;
    const musica = existsSync(join(dir, "musica")) ? todos(join(dir, "musica")).filter((f) => AUD.test(f)).map((f) => `${rel}/musica/${f}`) : [];
    if (existsSync(join(dir, "musica.txt"))) {
      for (const l of readFileSync(join(dir, "musica.txt"), "utf8").split(/\r?\n/)) {
        const ruta = l.replace(/#.*/, "").trim().replace(/^\/+/, "");
        if (ruta && AUD.test(ruta) && existsSync(join(RAIZ, ruta)) && statSync(join(RAIZ, ruta)).size > 1024 && !musica.includes(ruta)) musica.push(ruta);
      }
    }
    const fuentes = existsSync(join(dir, "fuentes")) ? todos(join(dir, "fuentes")).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f)).map((f) => `${rel}/fuentes/${f}`) : [];
    r[e] = { musica, fuentes };
  }
  return r;
}

export function textoCatalogo(RAIZ) {
  return "// GENERADO por `node herramientas/contenido.mjs`: lo que hay en assets/ y en «musica assets/».\n" +
    "// No se edita a mano: deja tus componentes, imágenes y canciones en sus carpetas y se rehace solo.\n" +
    `export default ${JSON.stringify(catalogo(RAIZ), null, 1)};\n`;
}
