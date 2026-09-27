/**
 * FOTOS — qué carpeta de `fotos-paginas/` usa cada página.
 *
 * Cada página con imágenes tiene SU carpeta, en el orden del libro:
 *
 *   fotos-paginas/02-las-tres-de-la-manana/imagen1.png
 *   fotos-paginas/06-recuerdos/imagen1.png … imagen8.png
 *
 * Para cambiar una foto, se sube otra con el MISMO nombre a esa carpeta.
 * Para poner más o menos, se añaden o quitan `imagen9`, `imagen10`… y la
 * página enseña las que haya, en orden. Vale .png, .jpg, .jpeg, .webp y .gif.
 *
 * Qué hay en cada carpeta lo sabe `contenido.js`, que se rehace solo en
 * GitHub a cada subida: nunca se pide una foto que no exista.
 */

import contenido from "./contenido.js";
import { conHuella } from "./huella.js";

export const CARPETA = "fotos-paginas/";

export const carpetaDeCadaPagina = {
  "portada":             "01-portada",
  "tres-de-la-manana":   "02-las-tres-de-la-manana",
  "lo-que-no-dije":      "03-lo-que-no-te-dije-ese-dia",
  "postal-primera":      "04-postal-desde-aqui",
  "tu-voz":              "05-como-dices-mi-nombre",
  "nuestro-desorden":    "06-recuerdos",
  "llueve-alla":         "07-cuando-llueve-alla",
  "lista-pendiente":     "08-cosas-que-todavia-no-se-de-ti",
  "por-pedacitos":       "09-te-fui-armando",
  "me-caigo-mejor":      "10-contigo-me-caigo-mejor",
  "nuestra-pelicula":    "11-pines-que-me-recordaron-a-ti",
  "pines-dedicados":     "11b-pines-que-te-dedico",
  "la-combinacion":      "12-solo-tu-sabes-abrirlo",
  "mi-norte":            "13-mi-norte",
  "todo-lo-que-guardo":  "14-todo-lo-que-guardo",
  "en-voz-baja":         "15-lo-que-no-se-ve-de-primeras",
  "regalo":              "16-abrelo",
  "mismo-cielo":         "17-el-mismo-cielo",
  "postal-segunda":      "18-otra-postal",
  "te-lo-digo-bajito":   "19-nada-del-otro-mundo",
  "debajo-de-esto":      "20-debajo-de-esto",
  "sin-adornos":         "21-sin-adornos",
  "aburridos":           "22-aburridos-juntos",
  "rompecabezas-dos":    "23-no-como-alguien-perfecto",
  "acariciar":           "24-lo-que-quiero-de-ti",
  "mejorar":             "25-lo-que-estoy-haciendo",
  "cosas-tuyas":         "26-unas-de-tantas-fotitos-tuyas",
  "no-se-me-pasa":       "27-no-se-me-pasa",
  "gracias":             "28-gracias-por-quedarte",
  "te-elijo":            "29-te-elijo",
  "final":               "30-el-final",
};

/*
 * ── LAS PÁGINAS SIN FOTO ─────────────────────────────────────────────
 * Si una carpeta se queda vacía (o se borra su foto), la página NO se
 * queda en blanco: enseña un recuadro que dice «Aquí va la foto 1», «la
 * foto 2»… con el nombre del archivo que hay que subir y a qué carpeta.
 * En cuanto se sube la foto de verdad, el recuadro desaparece solo.
 *
 * Cuántos recuadros sale en cada página: los de aquí abajo; las demás, 1.
 * (Los pines que le dedicas no llevan: vacía, esa página enseña la carta.)
 */
const HUECOS = {
  "nuestro-desorden": 8,
  "lista-pendiente": 2,
  "nuestra-pelicula": 6,
  "todo-lo-que-guardo": 8,
  "mismo-cielo": 6,
  "acariciar": 2,
  "cosas-tuyas": 6,
  "no-se-me-pasa": 6,
  "pines-dedicados": 0,
};

/** La imagen del recuadro, dibujada aquí mismo: no hay que subir nada. */
function recuadro(n, carpeta) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
<defs>
<radialGradient id="f" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#fff6f1"/><stop offset="1" stop-color="#f0cfd6"/></radialGradient>
<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf7"/><stop offset="1" stop-color="#fbe6ea"/></linearGradient>
</defs>
<rect width="1000" height="1000" fill="url(#f)"/>
<g opacity=".5" fill="#e79aad"><path d="M170 190c-14-20-46-8-38 16 6 18 38 34 38 34s32-16 38-34c8-24-24-36-38-16z"/><path d="M842 780c-11-16-37-6-30 13 5 14 30 27 30 27s25-13 30-27c7-19-19-29-30-13z"/><circle cx="820" cy="210" r="7"/><circle cx="190" cy="800" r="6"/><circle cx="870" cy="330" r="4"/><circle cx="130" cy="640" r="4"/></g>
<rect x="175" y="150" width="650" height="700" rx="46" fill="url(#m)" stroke="#c98a97" stroke-width="6" stroke-dasharray="22 16"/>
<g transform="translate(500 322) scale(1.35)" fill="none" stroke="#b56d80" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
<path d="M-78 -36h34l16-24h56l16 24h34a14 14 0 0 1 14 14v92a14 14 0 0 1-14 14h-156a14 14 0 0 1-14-14v-92a14 14 0 0 1 14-14z"/>
<circle cx="0" cy="22" r="34"/><circle cx="58" cy="-12" r="3" fill="#b56d80"/>
</g>
<text x="500" y="522" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="64" fill="#9c5a6c">Aquí va</text>
<text x="500" y="628" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="104" fill="#7a3a4e">la foto ${n}</text>
<text x="500" y="712" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="38" fill="#9c5a6c">sube «imagen${n}.jpg» a</text>
<text x="500" y="770" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="${carpeta.length > 20 ? 26 : 32}" fill="#b07d8a">fotos-paginas/${carpeta}</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/** Las fotos de una página, en el formato que espera el libro. */
export function fotosDe(idDePagina) {
  const carpeta = carpetaDeCadaPagina[idDePagina];
  const archivos = (carpeta && contenido?.fotosPaginas?.[carpeta]) || [];
  if (!archivos.length && carpeta) {
    const n = HUECOS[idDePagina] ?? 1;
    return Array.from({ length: n }, (_, i) => ({
      id: `${idDePagina}-${i}`,
      src: recuadro(i + 1, carpeta),
      nombre: `imagen${i + 1}.jpg`,
      pagina: idDePagina,
      hueco: true,
    }));
  }
  return archivos.map((archivo, i) => ({
    id: `${idDePagina}-${i}`,
    src: CARPETA + carpeta + "/" + encodeURIComponent(archivo) + conHuella(CARPETA + carpeta + "/" + archivo),
    nombre: archivo,
    pagina: idDePagina,
  }));
}

/** Avisa en la consola de las páginas que se han quedado sin ninguna foto. */
export async function revisarFotos() {
  const vacias = Object.entries(carpetaDeCadaPagina).filter(([id]) => !fotosDe(id).some((f) => !f.hueco));
  if (vacias.length) {
    console.warn(
      "[fotos] carpetas sin imágenes: " + vacias.map(([, c]) => CARPETA + c).join(", ")
    );
  }
  return vacias;
}
