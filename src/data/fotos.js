/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  QUÉ FOTO SALE EN CADA PÁGINA                                    ║
 * ║                                                                  ║
 * ║  Una lista por página, con el NOMBRE DEL ARCHIVO tal cual.        ║
 * ║  Nada de números sueltos ni de rangos que hay que descifrar.      ║
 * ║                                                                  ║
 * ║  Para cambiar la foto de una página:                              ║
 * ║    1. Deja tu imagen en `assets/img/`.                            ║
 * ║    2. Escribe su nombre aquí, en la línea de esa página.          ║
 * ║                                                                  ║
 * ║  Y ya. Puedes ponerle el nombre que quieras —«la-playa.jpg»,      ║
 * ║  «tu-risa.png»— y puedes repetir la misma foto en varias          ║
 * ║  páginas si te apetece.                                          ║
 * ║                                                                  ║
 * ║  Si te equivocas al escribir un nombre, el libro NO se rompe:     ║
 * ║  esa foto simplemente no sale, y en la consola aparece un aviso   ║
 * ║  diciéndote exactamente qué nombre no encontró y en qué página.   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/** Dónde están las imágenes. Todo lo de abajo cuelga de aquí. */
export const CARPETA = "assets/img/";

/**
 * Atajo para cuando una página lleva muchas fotos seguidas y numeradas.
 * `serie("imagen", 6, 13)` es lo mismo que escribir imagen6.png … imagen13.png
 * a mano, pero sin escribir ocho líneas.
 *
 * Si prefieres nombres de verdad, no lo uses: pon la lista y ya.
 */
export const serie = (nombre, desde, hasta, ext = "png") =>
  Array.from({ length: hasta - desde + 1 }, (_, i) => `${nombre}${desde + i}.${ext}`);

/**
 * ───────────────────────────────────────────────────────────────────
 *  LA LISTA
 *
 *  A la izquierda, el nombre de la página (el mismo que sale en el
 *  índice del libro). A la derecha, sus fotos.
 * ───────────────────────────────────────────────────────────────────
 */
export const fotosDeCadaPagina = {
  // ══ ACTO I · ENCONTRARTE ═══════════════════════════════════════
  "portada":            ["imagen1.png"],
  "tres-de-la-manana":  ["imagen2.png"],
  "lo-que-no-dije":     ["imagen3.png"],
  "postal-primera":     ["imagen4.png"],
  "tu-voz":             ["imagen5.png"],
  "nuestro-desorden":   serie("imagen", 6, 13),   // las polaroids sueltas
  "llueve-alla":        ["imagen14.png"],

  // ══ ACTO II · CONOCERTE ════════════════════════════════════════
  "lista-pendiente":    serie("imagen", 15, 16),
  "por-pedacitos":      ["imagen17.png"],         // la que se arma por piezas
  "me-caigo-mejor":     ["imagen18.png"],
  "nuestra-pelicula":   serie("imagen", 19, 28),  // el carrete entero
  "la-combinacion":     ["imagen29.png"],         // lo que guarda el candado
  "mi-norte":           ["imagen30.png"],
  "todo-lo-que-guardo": serie("imagen", 31, 46),  // la esfera de recuerdos
  "en-voz-baja":        ["imagen47.png"],

  // ══ ACTO III · EXTRAÑARTE ══════════════════════════════════════
  "regalo":             ["imagen48.png"],
  "mismo-cielo":        serie("imagen", 49, 58),  // las estrellas
  "postal-segunda":     ["imagen59.png"],
  "te-lo-digo-bajito":  ["imagen60.png"],
  "debajo-de-esto":     ["imagen61.png"],         // la de debajo de la lámina
  "sin-adornos":        ["imagen62.png"],

  // ══ ACTO IV · ELEGIRTE ═════════════════════════════════════════
  "aburridos":          ["imagen63.png"],
  "rompecabezas-dos":   ["imagen64.png"],
  "acariciar":          serie("imagen", 65, 66),  // la que hay detrás del velo
  "mejorar":            ["imagen67.png"],
  "cosas-tuyas":        serie("imagen", 68, 75),  // las otras polaroids
  "no-se-me-pasa":      serie("imagen", 76, 81),  // el otro carrete
  "gracias":            ["imagen82.png"],
  "te-elijo":           ["imagen84.png"],
  "final":              ["imagen85.png"],

  // La página del cajón no enseña fotos: lo que se toca ahí son objetos.
  // «imagen83.png» está en la carpeta y no la usa nadie; si algún día quieres
  // que salga en alguna página, escribe su nombre en la línea de esa página.
};

/**
 * Traduce la lista de arriba al formato que espera el libro.
 * Nadie tiene que llamar a esto a mano: lo hace el manifiesto solo.
 */
export function fotosDe(idDePagina) {
  const lista = fotosDeCadaPagina[idDePagina];
  if (!lista) return [];
  return lista.map((archivo, i) => ({
    id: `${idDePagina}-${i}`,
    src: archivo.includes("/") ? archivo : CARPETA + archivo,
    nombre: archivo,
    pagina: idDePagina,
  }));
}

/**
 * Comprueba que todas las fotos de la lista existen de verdad.
 *
 * Se hace pidiéndolas por `Image`, que es lo mismo que hace el libro al
 * enseñarlas, así que si una está mal escrita se entera aquí y lo dice claro
 * en vez de dejar un hueco misterioso en la página.
 *
 * Sólo corre en local (lo llama `main.js`): a ella no le sirve de nada.
 */
export async function revisarFotos() {
  const problemas = [];
  const vistas = new Map();

  const existe = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });

  for (const [pagina, lista] of Object.entries(fotosDeCadaPagina)) {
    for (const archivo of lista) {
      const src = archivo.includes("/") ? archivo : CARPETA + archivo;
      if (!vistas.has(src)) vistas.set(src, existe(src));
      if (!(await vistas.get(src))) problemas.push({ pagina, archivo });
    }
  }

  if (problemas.length) {
    console.groupCollapsed(
      `%c fotos %c ${problemas.length} que no existen`,
      "background:#ec6f92;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px",
      "background:#2a1436;color:#f6e7ef;border-radius:0 3px 3px 0;padding:2px 6px"
    );
    for (const { pagina, archivo } of problemas) {
      console.warn(`· "${archivo}" no está en ${CARPETA} — lo pide la página "${pagina}"`);
    }
    console.info("La lista de qué foto va en qué página: src/data/fotos.js");
    console.groupEnd();
  } else {
    const total = new Set([...Object.values(fotosDeCadaPagina).flat()]).size;
    console.info(
      `%c fotos %c ${total} en su sitio, ninguna rota`,
      "background:#7ee0c0;color:#08201a;border-radius:3px 0 0 3px;padding:2px 6px",
      "background:#2a1436;color:#f6e7ef;border-radius:0 3px 3px 0;padding:2px 6px"
    );
  }

  return problemas;
}
