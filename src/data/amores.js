/**
 * AMORES — las páginas que salen solas de `images/amores/`.
 *
 * Él deja ahí `amor1.png`, `amor2.png`, `amor3.png`… y cada una se convierte
 * en una página del libro sin tocar una línea de código. Al final de todo,
 * después de la última experiencia, que es donde tienen que ir.
 *
 * ── Cómo se detectan sin servidor ─────────────────────────────────────
 * Esto se publica en GitHub Pages, que sirve archivos y nada más: no hay
 * manera de pedirle «dime qué hay en esta carpeta». Así que se prueba: se
 * pide amor1, amor2, amor3… y se para cuando faltan tres seguidas.
 *
 * Preguntar por un archivo que no está deja una línea roja en la consola del
 * navegador, y eso no hay forma de evitarlo desde aquí (pasa igual con `fetch`
 * que con `Image`). Lo que sí se puede es preguntar lo menos posible, y a eso
 * va toda la maña de este archivo:
 *
 *   · la extensión se averigua UNA vez, con `amor1`, y a partir de ahí sólo se
 *     pregunta por ésa;
 *   · se pregunta en bloques de ocho a la vez, no de una en una, para que en
 *     una conexión de datos no tarde una eternidad;
 *   · en cuanto faltan tres seguidas, se para.
 *
 * Con veinte fotos eso son veintitantas peticiones y tres avisos de «no está»,
 * que son los tres huecos del final. Con la carpeta vacía, seis y para casa.
 */

import textos from "../pages/amor/textos.js";

/** Dónde busca. */
export const CARPETA = "images/amores/";

/** Cómo se llaman. `%` es el número. */
const PATRON = "amor%";

/**
 * Extensiones que valen, en orden. El `.png` va primero porque es el nombre
 * que dice el LÉEME y, por tanto, el caso normal.
 */
const EXTENSIONES = ["png", "jpg", "jpeg", "webp", "PNG", "JPG"];

/** Hasta cuántas busca. */
const MAXIMO = 200;

/** De cuántas en cuántas pregunta a la vez. */
const BLOQUE = 8;

/** Cuántos números seguidos puede saltarse antes de darse por terminada. */
const HUECOS = 3;

/** Si una petición se queda colgada, se da por perdida a los tantos ms. */
const ESPERA_MAX = 6000;

/** Y la búsqueda entera nunca retrasa la apertura del libro más de esto. */
const PRESUPUESTO = 5000;

/** ¿Existe este archivo? Devuelve sus medidas, o null. */
function probar(ruta) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";

    let cerrado = false;
    const fin = (valor) => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(reloj);
      img.onload = img.onerror = null;
      resolve(valor);
    };

    // Una imagen colgada no lanza nunca `error`: sin esto, una conexión mala
    // dejaría el libro esperando en la pantalla de carga para siempre.
    const reloj = setTimeout(() => {
      img.src = "";
      fin(null);
    }, ESPERA_MAX);

    img.onload = () => fin({ ruta, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => fin(null);
    img.src = ruta;
  });
}

/** La ruta de la foto número N con una extensión dada. */
const rutaDe = (numero, ext) => `${CARPETA}${PATRON.replace("%", numero)}.${ext}`;

/**
 * Averigua con `amor1` cómo se llaman las fotos de esta carpeta.
 *
 * Dos tiempos, y el orden importa porque esto retrasa la apertura del libro:
 *   1. `.png` a solas, que es el caso normal. Una pregunta y a correr.
 *   2. Si no está, las otras cinco A LA VEZ. En serie eran seis idas y venidas
 *      —más de un segundo con datos móviles y la carpeta vacía— y así son dos.
 *
 * @returns {Promise<{ext:string, primera:object}|null>}
 */
async function averiguarExtension() {
  const [preferida, ...resto] = EXTENSIONES;

  const directa = await probar(rutaDe(1, preferida));
  if (directa) return { ext: preferida, primera: directa };

  const otras = await Promise.all(resto.map((ext) => probar(rutaDe(1, ext))));
  const i = otras.findIndex(Boolean);
  return i < 0 ? null : { ext: resto[i], primera: otras[i] };
}

/**
 * Rescate para las que no siguen la extensión de la primera.
 * Aquí sí se va de una en una: esto sólo pasa con huecos sueltos en medio de
 * la carpeta, son pocos, y parando en la primera que conteste se ahorran
 * peticiones que en el caso normal no hacen ninguna falta.
 */
async function buscarConCualquiera(numero, salvo) {
  for (const ext of EXTENSIONES) {
    if (ext === salvo) continue;
    const r = await probar(rutaDe(numero, ext));
    if (r) return r;
  }
  return null;
}

/**
 * Recorre la carpeta y devuelve lo que haya.
 *
 * Nunca lanza y nunca se eterniza: si algo va mal o se acaba el tiempo,
 * devuelve lo que llevara y el libro se abre igual.
 *
 * @returns {Promise<{numero:number, src:string, w:number, h:number}[]>}
 */
export async function descubrirAmores() {
  const encontradas = [];

  try {
    // 1. La primera manda: nos dice si hay fotos y cómo se llaman.
    const cabecera = await averiguarExtension();
    if (!cabecera) return [];

    const { ext, primera } = cabecera;
    encontradas.push({ numero: 1, src: primera.ruta, w: primera.w, h: primera.h });

    // 2. Y a partir de ahí, sólo esa extensión y de ocho en ocho.
    const limite = Date.now() + PRESUPUESTO;
    let huecosSeguidos = 0;
    let siguiente = 2;

    while (siguiente <= MAXIMO && huecosSeguidos < HUECOS) {
      const lote = [];
      for (let i = 0; i < BLOQUE && siguiente + i <= MAXIMO; i++) lote.push(siguiente + i);

      const resultados = await Promise.all(lote.map((n) => probar(rutaDe(n, ext))));

      // Un hueco ANTES de la última encontrada no es el final de la carpeta:
      // es un archivo que existe con otra extensión (bajó unas en .png y otras
      // en .jpg, que es lo más normal del mundo). A ésas se les da otra
      // oportunidad. A las de después no: ésas sí son el final, y preguntar
      // por ellas seis veces sólo llenaría la consola de avisos.
      let ultima = -1;
      for (let i = resultados.length - 1; i >= 0; i--) {
        if (resultados[i]) { ultima = i; break; }
      }
      for (let i = 0; i < ultima; i++) {
        if (!resultados[i]) resultados[i] = await buscarConCualquiera(lote[i], ext);
      }

      for (let i = 0; i < resultados.length; i++) {
        const r = resultados[i];
        if (r) {
          // Un hueco al que sigue una foto no cuenta: sólo cortan los del final.
          huecosSeguidos = 0;
          encontradas.push({ numero: lote[i], src: r.ruta, w: r.w, h: r.h });
        } else {
          huecosSeguidos++;
        }
      }

      // Se ha pasado del tiempo que puede robarle a la apertura: se queda con
      // lo que ya tiene. Mejor doce fotos hoy que una pantalla de carga eterna.
      if (Date.now() > limite) {
        console.warn(
          `[amores] la búsqueda tardaba demasiado; se quedan ${encontradas.length}.`
        );
        break;
      }

      siguiente += BLOQUE;
    }
  } catch (err) {
    console.warn("[amores] no se pudieron buscar las imágenes", err);
  }

  encontradas.sort((a, b) => a.numero - b.numero);
  return encontradas;
}

/**
 * Convierte lo encontrado en entradas de manifiesto.
 * Van todas al final del libro, después de la última experiencia.
 */
export function entradasDeAmores(lista) {
  return lista.map((img, i) => ({
    // Sólo en la primera, y sólo si se queda quieta un rato: así se entera de
    // que las fotos se tocan sin que nadie se lo suelte encima de la imagen.
    hint: i === 0 ? textos.primeraVez : undefined,
    id: `amor-${img.numero}`,
    type: "amor",
    photos: [{ id: `amor-${img.numero}`, src: img.src, custom: true }],
    // Alternan para que dos seguidas no lleguen igual.
    transition: ["bloom", "ink", "slide", "tide"][i % 4],
    gl: true,
    amor: img.numero,
    total: lista.length,
    orden: i + 1,
    ancho: img.w,
    alto: img.h,
    act: "amores",
    custom: true,
  }));
}

/** El acto al que pertenecen, para que el índice las agrupe aparte. */
export const actoAmores = { id: "amores", number: 9, title: "Nosotros" };
