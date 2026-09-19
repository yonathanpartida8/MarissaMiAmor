/**
 * NOCHE ESTRELLADA — la última página del libro.
 *
 * No vive en `paginas-html/` como las demás: es una experiencia entera
 * con su propia carpeta y sus propios sonidos, así que está fuera, al
 * mismo nivel. Por eso tiene su propio módulo en vez de salir del
 * barrido de la carpeta.
 *
 * ── POR QUÉ ES UNA PÁGINA DE TIPO `html` ──────────────────────────────
 * Porque el libro ya sabe hacer esto: coge un archivo HTML, lo mete en
 * un iframe con el tamaño exacto de la hoja, le presta los colores y
 * los márgenes seguros, le cede los gestos y lo APAGA ENTERO al salir
 * —relojes, audio, WebGL, todo—.
 *
 * Esa última parte es la que importa aquí: esta experiencia tiene una
 * fogata animada, seis ambientes sonando y un bucle a 60 Hz. Si al
 * pasar de página siguiera corriendo de fondo, se quedaría comiéndose
 * la batería para nadie. Vaciando el iframe se apaga sola y no hay que
 * acordarse de nada.
 *
 * ── POR QUÉ VA LA ÚLTIMA DE TODO ──────────────────────────────────────
 * El orden del libro es: páginas de siempre → las HTML → las fotos. Las
 * fotos se buscan en la red y pueden llegar antes o después, así que
 * con un `push` normal esta página acabaría unas veces detrás de las
 * fotos y otras en medio. Se marca con `ultima: true` y el manifiesto
 * la respeta: nada se coloca después de ella. Nunca.
 */

/** Dónde está el archivo, visto desde la raíz del libro. */
export const CARPETA_NOCHE = "noche-estrellada/";
export const ARCHIVO_NOCHE = `${CARPETA_NOCHE}index.html`;

/** El acto al que pertenece, para que el índice la agrupe aparte. */
export const actoNoche = { id: "noche", number: 10, title: "La noche" };

const ID = "noche-estrellada";

/** El capítulo: lo que se lee de ella en el índice y en la barra. */
export const capituloNoche = {
  id: ID,
  act: "noche",
  title: "Noche estrellada",
  subtitle: "una fogata, una cabaña y el cielo entero",
  palette: { a: "#8fa8ff", b: "#2a3a7a", deep: "#05070f" },
  mood: "night",
};

/** La entrada del manifiesto. */
export const entradaNoche = {
  id: ID,
  type: "html",
  chapter: ID,
  src: ARCHIVO_NOCHE,
  /* Un fundido y no un giro: esto no es una hoja más, es el final del
     libro. Girarla como las demás le quitaría el peso que tiene. */
  transition: "fade",
  act: "noche",
  custom: true,
  /* La marca que lo cambia todo: el manifiesto no deja que nada se
     coloque después de ésta. */
  ultima: true,
};

/**
 * ¿Está la carpeta ahí?
 *
 * Se pregunta antes de añadir la página. Si alguien se lleva la carpeta
 * —o la borra por error—, el libro es exactamente el mismo libro y nadie
 * se entera, en vez de acabar con una hoja que no abre.
 *
 * Se pide sólo la cabecera (`HEAD`): no hace falta descargar el archivo
 * entero para saber si existe, y esto corre durante el arranque.
 */
export async function existeLaNoche() {
  try {
    const r = await fetch(ARCHIVO_NOCHE, { method: "HEAD" });
    if (r.ok) return true;
    /* Algunos servidores de archivos no contestan a HEAD. Se reintenta
       pidiendo sólo el primer kilobyte, que sigue siendo casi nada. */
    if (r.status === 405 || r.status === 501) {
      const g = await fetch(ARCHIVO_NOCHE, { headers: { Range: "bytes=0-1023" } });
      return g.ok;
    }
    return false;
  } catch {
    return false;
  }
}
