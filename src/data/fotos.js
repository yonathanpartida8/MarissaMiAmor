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
  "nuestra-pelicula":    "11-nuestra-pelicula",
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

/** Las fotos de una página, en el formato que espera el libro. */
export function fotosDe(idDePagina) {
  const carpeta = carpetaDeCadaPagina[idDePagina];
  const archivos = (carpeta && contenido?.fotosPaginas?.[carpeta]) || [];
  return archivos.map((archivo, i) => ({
    id: `${idDePagina}-${i}`,
    src: CARPETA + carpeta + "/" + encodeURIComponent(archivo),
    nombre: archivo,
    pagina: idDePagina,
  }));
}

/** Avisa en la consola de las páginas que se han quedado sin ninguna foto. */
export async function revisarFotos() {
  const vacias = Object.entries(carpetaDeCadaPagina).filter(([id]) => !fotosDe(id).length);
  if (vacias.length) {
    console.warn(
      "[fotos] carpetas sin imágenes: " + vacias.map(([, c]) => CARPETA + c).join(", ")
    );
  }
  return vacias;
}
