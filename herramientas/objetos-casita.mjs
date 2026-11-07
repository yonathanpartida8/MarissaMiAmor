/**
 * TUS OBJETOS DE LA CASITA (Fase 76) — arma `assets/objetos-casita/indice.json` con las imágenes (.png, .jpg, .webp)
 * que dejaste en cada carpeta de categoría, para que la casita las use como objetos de verdad (un sitio de archivos no
 * sabe listar carpetas). También crea las carpetas de categoría (con su notita) y rehace el LÉEME.
 *
 *   node herramientas/objetos-casita.mjs
 *
 * La acción de GitHub «Objetos de la casita» lo corre sola cada vez que subes algo a esa carpeta.
 * Cómo se leen los nombres (frente, derecha, izquierda, atrás, abierto, funcionando1, 2…): el mismo código que usa el
 * juego, en EditorDev/components/casita/catalogo/propios-nombres.js.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";
import { CARPETAS, LEEME_CARPETA, IMAGEN, armarObjetos, carpetaDe, medida } from "../EditorDev/components/casita/catalogo/propios-nombres.js";

const RAIZ = new URL("..", import.meta.url).pathname;
const DIR = join(RAIZ, "assets", "objetos-casita");

/** El tamaño de una imagen leyendo sólo su encabezado (PNG, JPG o WEBP). */
function tamano(ruta) {
  let b;
  try { const fd = openSync(ruta, "r"); b = Buffer.alloc(256 * 1024); const n = readSync(fd, b, 0, b.length, 0); closeSync(fd); b = b.subarray(0, n); } catch (e) { return null; }
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], largo = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + largo;
    }
    return null;
  }
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const t = b.toString("ascii", 12, 16);
    if (t === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (t === "VP8L") { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
    if (t === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  }
  return null;
}

mkdirSync(DIR, { recursive: true });
const archivos = [], infos = {};
for (const c of Object.keys(CARPETAS)) {
  const d = join(DIR, c);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  const nota = join(d, "LÉEME.txt");
  const texto = `Carpeta «${c}»: ${LEEME_CARPETA[c] || ""}.\n\nDeja aquí tus imágenes (.png con fondo transparente es lo mejor; .jpg también: se le quita el fondo\nliso). Cada objeto en su carpetita (frente.png, derecha.png, izquierda.png, atras.png, abierto.png,\nfuncionando1.png, funcionando2.png…) o suelto (miobjeto.png, miobjeto-derecha.png, miobjeto-abierto.png…).\nMira el LÉEME.md de la carpeta de arriba para todos los detalles.\n`;
  if (!existsSync(nota) || readFileSync(nota, "utf8") !== texto) writeFileSync(nota, texto);
}
// Todas las carpetas que haya (también «Baño», «Recámara»… escritas a mano), con sus objetos.
for (const c of readdirSync(DIR)) {
  const dc = join(DIR, c);
  if (!statSync(dc).isDirectory() || !carpetaDe(c)) continue;
  for (const f of readdirSync(dc).sort()) {
    const p = join(dc, f), st = statSync(p);
    if (st.isFile() && IMAGEN.test(f)) { const t = tamano(p); archivos.push({ carpeta: c, objeto: null, archivo: f, ruta: `assets/objetos-casita/${c}/${f}`, w: t?.[0], h: t?.[1] }); }
    else if (st.isDirectory()) {
      for (const g of readdirSync(p).sort()) {
        const q = join(p, g);
        if (!statSync(q).isFile()) continue;
        if (IMAGEN.test(g)) { const t = tamano(q); archivos.push({ carpeta: c, objeto: f, archivo: g, ruta: `assets/objetos-casita/${c}/${f}/${g}`, w: t?.[0], h: t?.[1] }); }
        else if (/^(info|datos)\.txt$/i.test(g)) infos[`${carpetaDe(c)}/${f.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/@\d+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`] = readFileSync(q, "utf8");
      }
    }
  }
}
const objetos = armarObjetos(archivos, infos);
writeFileSync(join(DIR, "indice.json"), JSON.stringify({ version: 1, objetos }, null, 1) + "\n");

const filas = objetos.map((o) => {
  const t = o.tam[o.vistas.frente] || [], [w, h] = medida(o, t[0], t[1]);
  const lados = ["frente", "derecha", "izquierda", "atras"].filter((d) => o.vistas[d]).join(", ");
  const extra = [Object.keys(o.abierto).length ? "abierto" : "", Object.keys(o.funcionando).length ? `funcionando (${o.funcionando.frente?.length || Object.values(o.funcionando)[0].length} cuadros)` : ""].filter(Boolean).join(", ");
  return `| \`${o.id}\` | ${o.nombre} | ${lados} | ${extra || "—"} | ${w} × ${h} |`;
}).join("\n");
writeFileSync(join(DIR, "LÉEME.md"), `# Tus objetos para Nuestra casita

Aquí puedes poner tus propias imágenes y salen como objetos de verdad en «Acomodar» (en su categoría), del tamaño de
un mueble, con su sombra, que se pueden mover, girar, abrir y prender.

## Dónde van

Una carpeta por categoría: ${Object.keys(CARPETAS).map((c) => `\`${c}/\``).join(", ")}. Lo de \`pared/\` se cuelga en
la pared; lo de \`cositas/\`, \`adornos/\` y \`limpieza/\` se puede cargar con la mano y poner encima de los muebles.

## Cómo nombrar las imágenes

Cada objeto en su carpetita (recomendado) o suelto en la carpeta de su categoría:

| En su carpetita | Suelto | Qué es |
| --- | --- | --- |
| \`sala/sillon-rosa/frente.png\` | \`sala/sillon-rosa.png\` | De frente (la única que hace falta) |
| \`…/derecha.png\` | \`sillon-rosa-derecha.png\` | Visto de su lado derecho (al girarlo) |
| \`…/izquierda.png\` | \`sillon-rosa-izquierda.png\` | De su lado izquierdo (si falta, se usa el derecho al revés) |
| \`…/atras.png\` | \`sillon-rosa-atras.png\` | De espaldas |
| \`…/abierto.png\` | \`sillon-rosa-abierto.png\` | Abierto (al tocarlo se abre y se cierra) |
| \`…/funcionando1.png\`, \`funcionando2.png\`… | \`sillon-rosa-funcionando1.png\`… | Animación: al tocarlo se repite en bucle hasta que lo vuelvas a tocar |

- También: \`abierto-derecha.png\`, \`funcionando2-izquierda.png\` (el estado visto de lado).
- Sirven \`.png\` (mejor, con fondo transparente), \`.jpg\` (se le quita solo el fondo liso de las orillas) y \`.webp\`.
- **Tamaño**: el pixel art chiquito (hasta 96 pixeles) se agranda ×4, como todo el juego; una imagen grande se ajusta
  al alto de un mueble de su categoría. Para escoger el alto: \`@150\` en el nombre (\`sillon-rosa@150\`) o una notita
  \`info.txt\` en su carpetita con \`alto: 150\` (también \`nombre: Sillón de mamá\` y \`velocidad: 8\`, los cuadros por
  segundo de la animación).
- Con abierto **y** funcionando, cada toque va: cerrado → abierto → funcionando → cerrado.

La lista (\`indice.json\`) se rehace sola en GitHub al subir (acción «Objetos de la casita»); en la compu:
\`node herramientas/objetos-casita.mjs\`. Con el servidor de casa, lo recién dejado aparece sin esperar.

## Ahora

| Clave | Nombre | Lados | Estados | Tamaño en el juego |
| --- | --- | --- | --- | --- |
${filas || "| — | (todavía no hay objetos tuyos) | | | |"}
`);
console.log(`Objetos de la casita: ${objetos.length} objeto${objetos.length === 1 ? "" : "s"} tuyo${objetos.length === 1 ? "" : "s"}.`);
