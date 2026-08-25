/**
 * PÁGINAS HTML — las páginas que salen solas de `paginas-html/`.
 *
 * Él deja ahí `página.html1.html`, `página.html2.html`, `página.html3.html`…
 * y cada archivo se convierte en una página del libro sin tocar una línea de
 * código. Van después de todas las páginas normales y siempre antes de las
 * fotos de `images/amores/`, que son lo último de lo último.
 *
 * ── Cómo se detectan sin servidor ─────────────────────────────────────
 * Esto se publica en GitHub Pages, que sirve archivos y nada más: no hay
 * manera de pedirle «dime qué hay en esta carpeta». Así que se prueba: se
 * pide la 1, la 2, la 3… y se para cuando faltan dos seguidas.
 *
 * Es la misma maña que usa `amores.js` con las fotos, con dos diferencias:
 *
 *   · aquí se pregunta con `fetch` y el método HEAD, que trae las cabeceras
 *     y NO el archivo: da igual que la página pese medio mega, la pregunta
 *     cuesta lo mismo;
 *   · el nombre se averigua UNA vez con la número 1, porque hay dos maneras
 *     razonables de escribirlo —«página» con tilde, que es la que dice el
 *     LÉEME, y «pagina» sin ella, que es la que sale sin querer— y que una
 *     página no aparezca por una tilde sería para volverse loco.
 *
 * ── Lo que NO hace ────────────────────────────────────────────────────
 * No lee el HTML, no lo interpreta y no lo toca. El archivo se muestra tal
 * cual lo escribió: de eso se encarga la página `src/pages/html/`.
 */

import textos from "../pages/html/textos.js";

/** Dónde busca. */
export const CARPETA = "paginas-html/";

/**
 * Cómo se llaman. `%` es el número.
 *
 * El primero es el del LÉEME. El segundo existe porque escribir «página» con
 * tilde en el nombre de un archivo se olvida constantemente, y un libro que
 * se calla cuando no encuentra algo es un libro que da miedo usar.
 */
const PATRONES = ["página.html%", "pagina.html%"];

/** Hasta cuántas busca. */
const MAXIMO = 60;

/**
 * De cuántas en cuántas pregunta, y cómo va creciendo.
 *
 * Empieza de dos en dos y va abriendo la mano. La razón es que el caso más
 * normal de todos es tener una o dos páginas, y preguntar de seis en seis
 * significaba lanzar seis preguntas —y dejar seis avisos de «no está» en la
 * consola— para encontrar una sola. Con esto, una página cuesta dos
 * preguntas; y quien tenga veinte las encuentra igual de rápido, porque
 * para entonces ya va de seis en seis.
 */
const BLOQUES = [2, 4, 6];

/** Cuántos números seguidos puede saltarse antes de darse por terminada. */
const HUECOS = 2;

/** Si una petición se queda colgada, se da por perdida a los tantos ms. */
const ESPERA_MAX = 5000;

/** Y la búsqueda entera nunca retrasa la apertura del libro más de esto. */
const PRESUPUESTO = 4000;

/** La ruta de la página número N con un patrón dado, ya escapada. */
function rutaDe(numero, patron) {
  return CARPETA + encodeURIComponent(patron.replace("%", numero)) + ".html";
}

/**
 * ¿Existe este archivo?
 *
 * Con HEAD, que pide sólo las cabeceras. Un `GET` aquí descargaría entera
 * cada página para saber si está, y con seis o siete páginas con imágenes
 * dentro eso son megas tirados justo mientras el libro intenta abrirse.
 *
 * Nunca lanza: cualquier problema —red caída, `file://`, CORS— se responde
 * como «no está» y el libro sigue su camino.
 */
async function probar(ruta) {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MAX);
  try {
    const res = await fetch(ruta, { method: "HEAD", signal: corte.signal });
    // GitHub Pages responde a lo que no existe con su propia página de error
    // y un 404 honrado, así que `ok` basta.
    return res.ok ? ruta : null;
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

/**
 * Averigua con la número 1 cómo se llaman las páginas de esta carpeta.
 * @returns {Promise<{patron:string, primera:string}|null>}
 */
async function averiguarPatron() {
  for (const patron of PATRONES) {
    const ruta = await probar(rutaDe(1, patron));
    if (ruta) return { patron, primera: ruta };
  }
  return null;
}

/**
 * Recorre la carpeta y devuelve lo que haya, en orden numérico.
 *
 * Nunca lanza y nunca se eterniza: si algo va mal o se acaba el tiempo,
 * devuelve lo que llevara y el libro se abre igual.
 *
 * @returns {Promise<{numero:number, src:string}[]>}
 */
export async function descubrirPaginasHtml() {
  const encontradas = [];

  try {
    const cabecera = await averiguarPatron();
    if (!cabecera) {
      // Las dos líneas rojas que acaban de salir en la consola son ESTO, y no
      // algo roto. Se deja dicho para que quien abra las herramientas del
      // navegador no se lleve un susto buscando un fallo que no existe.
      console.info(
        `%c paginas-html %c la carpeta ${CARPETA} está vacía · los avisos de «404» de arriba son de mirar si había algo`,
        "background:#ffd0dc;color:#3a0a1c;border-radius:3px 0 0 3px;padding:2px 6px",
        "background:#2a1436;color:#f6e7ef;border-radius:0 3px 3px 0;padding:2px 6px"
      );
      return [];
    }

    const { patron, primera } = cabecera;
    encontradas.push({ numero: 1, src: primera });

    const limite = Date.now() + PRESUPUESTO;
    let huecosSeguidos = 0;
    let siguiente = 2;
    let vuelta = 0;

    while (siguiente <= MAXIMO && huecosSeguidos < HUECOS) {
      const bloque = BLOQUES[Math.min(vuelta, BLOQUES.length - 1)];
      const lote = [];
      for (let i = 0; i < bloque && siguiente + i <= MAXIMO; i++) lote.push(siguiente + i);

      const resultados = await Promise.all(lote.map((n) => probar(rutaDe(n, patron))));

      // La mano se abre sólo cuando el bloque entero venía lleno. Si en el
      // último ya faltaba alguna, es que se está llegando al final de la
      // carpeta y preguntar más de golpe sólo añade avisos de «no está».
      if (resultados.every(Boolean)) vuelta++;

      for (let i = 0; i < resultados.length; i++) {
        if (resultados[i]) {
          // Un hueco al que sigue una página no cuenta: si tiene la 1, la 2 y
          // la 4, salen las tres. Sólo cortan los huecos del final.
          huecosSeguidos = 0;
          encontradas.push({ numero: lote[i], src: resultados[i] });
        } else {
          huecosSeguidos++;
        }
      }

      if (Date.now() > limite) {
        console.warn(
          `[paginas-html] la búsqueda tardaba demasiado; se quedan ${encontradas.length}.`
        );
        break;
      }

      siguiente += lote.length;
    }
  } catch (err) {
    console.warn("[paginas-html] no se pudieron buscar las páginas", err);
  }

  encontradas.sort((a, b) => a.numero - b.numero);
  return encontradas;
}

/**
 * Los colores por los que van pasando, en orden. Que dos seguidas no lleguen
 * iguales, y que ninguna se salga de la familia del libro.
 */
const COLORES = ["rubor", "vino", "azucar", "brasa", "seda", "granate", "amanecer", "latido"];

/**
 * Convierte lo encontrado en entradas de manifiesto y en capítulos.
 *
 * El capítulo existe para que la página tenga NOMBRE en el índice y en la
 * barra de abajo. De momento se llama «Página 3»; en cuanto el archivo se
 * abre, la página se mira su `<title>` y se pone el suyo. Así él le pone
 * nombre a una página escribiendo `<title>Nuestro juego</title>` y no
 * viniendo aquí.
 *
 * Todas con la misma transición —la hoja que gira— a propósito. Las fotos de
 * `amores` alternan cuatro porque son un álbum y se pasan de una en una; una
 * página HTML puede ser cualquier cosa, y lo que tiene que sentirse constante
 * es justo eso: da igual lo que haya dentro, se llega igual que a las demás.
 *
 * @returns {{entries: object[], chapters: object[]}}
 */
export function entradasDePaginasHtml(lista) {
  const entries = [];
  const chapters = [];

  lista.forEach((pag, i) => {
    const id = `html-${pag.numero}`;

    chapters.push({
      id,
      act: "html",
      title: textos.sinTitulo.replace("%", pag.numero),
      palette: COLORES[i % COLORES.length],
      mood: "night",
    });

    entries.push({
      id,
      type: "html",
      chapter: id,
      src: pag.src,
      numero: pag.numero,
      orden: i + 1,
      total: lista.length,
      transition: "flip",
      // Sólo en la primera: que se entere de que esto también se pasa, sin que
      // el aviso salga siete veces seguidas.
      hint: i === 0 ? textos.primeraVez : undefined,
      act: "html",
      custom: true,
    });
  });

  return { entries, chapters };
}

/** El acto al que pertenecen, para que el índice las agrupe aparte. */
export const actoHtml = { id: "html", number: 8, title: textos.acto };
