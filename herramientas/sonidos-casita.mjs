/**
 * LOS SONIDOS DE LA CASITA — arma `assets/sonidos-casita/indice.json` (qué archivos hay en cada
 * carpeta) para que la app sepa cuáles son tuyos sin tener que listar carpetas (un sitio de archivos
 * no sabe hacerlo). También crea la carpeta de cada sonido nuevo (con su notita) y rehace el LÉEME.
 *
 *   node herramientas/sonidos-casita.mjs
 *
 * La acción de GitHub «Sonidos de la casita» lo corre sola cada vez que subes algo a esa carpeta.
 * La lista de sonidos sale de EditorDev/components/casita/sonidos.js (SONIDOS).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname;
const DIR = join(RAIZ, "assets", "sonidos-casita");
const AUD = /\.(mp3|m4a|ogg|wav|aac)$/i;

// La lista (nombre y cuándo suena), leída del código del juego.
const codigo = readFileSync(join(RAIZ, "EditorDev", "components", "casita", "sonidos.js"), "utf8");
const bloque = (codigo.match(/export const SONIDOS = \[([\s\S]*?)\n\];/) || [])[1] || "";
const sonidos = [...bloque.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\]/g)].map((m) => [m[1], m[2]]);
if (!sonidos.length) { console.error("No encontré la lista SONIDOS en sonidos.js"); process.exit(1); }

mkdirSync(DIR, { recursive: true });
const indice = {};
for (const [n, cuando] of sonidos) {
  const d = join(DIR, n);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  const nota = join(d, "LÉEME.txt");
  const texto = `Sonido «${n}»: ${cuando}.\n\nDeja aquí tu archivo (.mp3, .m4a, .ogg o .wav, con el nombre que quieras) y suena el tuyo\nen lugar del de fábrica. Si dejas varios, se turnan. Si borras los tuyos, vuelve el de fábrica.\n`;
  if (!existsSync(nota) || readFileSync(nota, "utf8") !== texto) writeFileSync(nota, texto);
  const fs = readdirSync(d).filter((f) => AUD.test(f) && statSync(join(d, f)).isFile()).sort();
  if (fs.length) indice[n] = fs.map((f) => `assets/sonidos-casita/${n}/${f}`);
}
writeFileSync(join(DIR, "indice.json"), JSON.stringify(indice, null, 1) + "\n");

const filas = sonidos.map(([n, c]) => `| \`${n}/\` | ${c} | ${indice[n] ? indice[n].length + " tuyo" + (indice[n].length > 1 ? "s" : "") : "de fábrica"} |`).join("\n");
writeFileSync(join(DIR, "LÉEME.md"), `# Los sonidos de Nuestra casita

Cada sonido del juego tiene aquí su carpeta. **Para cambiar uno, deja tu archivo dentro de su
carpeta** (\`.mp3\`, \`.m4a\`, \`.ogg\` o \`.wav\`, con el nombre que quieras) y súbelo: la casita lo
usa en lugar del de fábrica. Si dejas varios en la misma carpeta, se turnan; si los borras, vuelve el
de fábrica. Para el piano basta una sola nota **Do** (el juego la afina para cada tecla). Las
\`musica-…\` son canciones que se repiten mientras el aparato está prendido.

La lista de qué hay en cada carpeta (\`indice.json\`) se rehace sola en GitHub al subir (acción
«Sonidos de la casita»); en la compu: \`node herramientas/sonidos-casita.mjs\`.

| Carpeta | Cuándo suena | Ahora |
| --- | --- | --- |
${filas}
`);
console.log(`Sonidos de la casita: ${sonidos.length} carpetas, ${Object.keys(indice).length} con archivos tuyos.`);
