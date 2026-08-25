/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  LA LUZ DEL CAPÍTULO                                             ║
 * ║                                                                  ║
 * ║  Un capítulo no pinta sólo su niebla de fondo: pinta el libro.    ║
 * ║  El papel coge su temperatura, la tinta su tono, la barra de      ║
 * ║  abajo su oscuridad, las sombras su color.                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ── POR QUÉ ───────────────────────────────────────────────────────────
 * Hasta ahora el color del capítulo se quedaba en el fondo. El papel era
 * siempre el mismo crema y sus sombras eran de un pardo neutro heredado
 * de cuando el libro tenía azules: sobre una luz rosa, un pardo neutro se
 * lee GRIS. El resultado era una hoja apagada flotando sobre una
 * atmósfera encendida, dos cosas distintas en la misma pantalla.
 *
 * Aquí se hacen una sola. De los tres colores del capítulo salen los
 * dieciséis tonos que usa el resto del libro, y todos van a `<html>`, que
 * es de donde el CSS los hereda sin que ninguna página tenga que enterarse.
 *
 * ── CÓMO SE USA ───────────────────────────────────────────────────────
 * No hay que llamarla desde ninguna página. El router la llama al cambiar
 * de hoja, en el mismo instante en que la atmósfera cambia de color, y
 * todo lo demás llega solo.
 */

import { contraste, mezclar, trio } from "./color.js";

/**
 * El papel de base: crema con una gota de rosa. Estos son los valores que
 * viven en `tokens.css`; aquí se repiten porque son el punto de partida de
 * la mezcla, no el resultado.
 */
const PAPEL = {
  claro: "#fffaf4",
  medio: "#fbf0e8",
  hondo: "#f3e2da",
  bajo: "#e7d0c8",
  borde: "#d4b3ab",
  tinta: "#3d2a2b",
  tintaSuave: "#705558",
};

/**
 * Cuánto se deja teñir cada cosa. Son números pequeños a propósito: el
 * papel tiene que seguir siendo papel. Lo que se busca es que la hoja
 * parezca estar DENTRO de esa luz, no que se ponga del color del capítulo.
 */
const TINTE = {
  claro: 0.05,
  medio: 0.09,
  hondo: 0.14,
  bajo: 0.2,
  borde: 0.26,
  tinta: 0.16,
  tintaSuave: 0.2,
};

/** Un pardo cálido: lo que la sombra del papel tiene de sombra. */
const SOMBRA_BASE = "#a8836a";
/** Un blanco cálido: lo que la luz que entra por arriba tiene de luz. */
const LUZ_BASE = "#fffdf6";

/** Hacia dónde se oscurece una tinta que no se lee: vino, nunca negro. */
const HACIA_LA_SOMBRA = "#2a0813";
/** El mínimo de la WCAG para texto normal. */
const CONTRASTE_MINIMO = 4.5;

/**
 * Devuelve el mismo color, oscurecido lo justo para que se lea sobre el
 * papel. Si ya se lee, lo devuelve intacto.
 *
 * Es la red de seguridad de todo esto. Un capítulo puede pedir el color
 * que quiera —y las paletas están hechas para ser bonitas sobre la niebla
 * negra del fondo, no sobre crema—, pero la capitular, el filete y la
 * firma van encima de una hoja clara. `nacar` sobre papel daba 2.5 a 1:
 * precioso y prácticamente ilegible. Así ninguna paleta futura puede
 * romper la lectura por muy bien que quede en el fondo.
 *
 * @param {string} color
 * @param {string} sobre el fondo contra el que hay que leerlo
 */
function legible(color, sobre) {
  let c = color;
  // Ocho pasos de 16% llegan de sobra desde cualquier punto de partida;
  // el tope está por si alguien pone un fondo oscuro y no hay salida.
  for (let i = 0; i < 8 && contraste(c, sobre) < CONTRASTE_MINIMO; i++) {
    c = mezclar(c, HACIA_LA_SOMBRA, 0.16);
  }
  return c;
}

/**
 * Última paleta aplicada. Sirve para no tocar el DOM cuando dos páginas
 * seguidas comparten color, que pasa a menudo: repintar la hoja de estilo
 * invalida el estilo del documento entero, y hacerlo para dejarlo igual es
 * trabajo tirado justo cuando el móvil está ocupado con la transición.
 */
let ultima = null;

/**
 * La hoja de estilo donde vive la luz.
 *
 * ── POR QUÉ UNA HOJA Y NO VEINTE `setProperty` EN `<html>` ────────────
 * Primero se hizo de la otra manera: veinte `setProperty` seguidos en el
 * elemento raíz. Funciona, pero es la forma cara de hacerlo.
 *
 * Una propiedad personalizada SE HEREDA, y el elemento raíz es el ancestro
 * de todo: cada escritura marca como sucio el documento entero. Veinte
 * escrituras son veinte invalidaciones, y si entre medias alguien lee un
 * estilo —basta con un `getComputedStyle`—, el navegador tiene que rehacer
 * la cuenta ahí mismo antes de seguir.
 *
 * Cambiar el texto de UNA hoja de estilo es una sola invalidación y un solo
 * recálculo, pase lo que pase. El resultado en pantalla es idéntico —está
 * comprobado píxel a píxel—, y la escritura pasa de veinte operaciones a
 * una.
 */
let hoja = null;

function laHoja() {
  if (hoja) return hoja;
  hoja = document.createElement("style");
  hoja.id = "luz-del-capitulo";
  // Al final de la cabecera: después de `tokens.css`, para ganarle sin
  // tener que subir la especificidad ni escribir un `!important`.
  document.head.append(hoja);
  return hoja;
}

/**
 * Derrama la luz de un capítulo por todo el libro.
 *
 * @param {{a: string, b: string, deep: string}} paleta
 */
export function aplicarLuz(paleta) {
  if (!paleta || !paleta.a) return;
  if (paleta === ultima) return;
  ultima = paleta;

  const { a, b, deep } = paleta;

  // El papel, dentro de esa luz. La zona más oscura de la hoja
  // (`--paper-200`) es la que manda en la cuenta del contraste: si algo se
  // lee ahí, se lee en toda la hoja.
  const papel200 = mezclar(PAPEL.hondo, a, TINTE.hondo);

  laHoja().textContent = `:root{
    /* Los tres, tal cual, para quien los quiera enteros. */
    --luz-a:${a};
    --luz-b:${b};
    --luz-deep:${deep};

    /* Y en trío, para las transparencias. */
    --luz-a-rgb:${trio(a)};
    --luz-b-rgb:${trio(b)};
    --luz-deep-rgb:${trio(deep)};

    /* «--accent» es el nombre con el que medio libro pide «el color de esta
       página». Sale de aquí, y no de la interfaz, para que haya un solo
       sitio donde se decide. */
    --accent:${a};

    /* El acento hondo es el que va ENCIMA del papel: capitulares, filetes y
       firmas. Por eso pasa por la red de legibilidad y «--accent» no: el
       acento claro vive sobre el fondo oscuro, donde brillar es justo lo
       que tiene que hacer. */
    --accent-deep:${legible(b, papel200)};

    --paper-000:${mezclar(PAPEL.claro, a, TINTE.claro)};
    --paper-100:${mezclar(PAPEL.medio, a, TINTE.medio)};
    --paper-200:${papel200};
    --paper-300:${mezclar(PAPEL.bajo, a, TINTE.bajo)};
    --paper-edge:${mezclar(PAPEL.borde, b, TINTE.borde)};

    /* La tinta se tiñe MUY poco y siempre hacia el color hondo, que es
       oscuro: así la hoja gana temperatura sin perder ni un punto de
       contraste. Teñirla hacia la luz la aclararía, y entonces habría que
       elegir entre que sea bonita y que se lea. */
    --paper-ink:${legible(mezclar(PAPEL.tinta, b, TINTE.tinta), papel200)};
    --paper-ink-soft:${legible(mezclar(PAPEL.tintaSuave, b, TINTE.tintaSuave), papel200)};

    /* Las dos capas que hacen que el papel parezca estar en una habitación.
       Antes eran un pardo fijo y un blanco fijo; ahora la habitación es la
       del capítulo. */
    --paper-shade-rgb:${trio(mezclar(b, SOMBRA_BASE, 0.52))};
    --paper-glow-rgb:${trio(mezclar(a, LUZ_BASE, 0.66))};

    /* El cromo: la barra flotante, el índice, los avisos. No se pintan del
       color del capítulo —serían un cartel— sino de SU oscuridad, que es la
       misma que hay detrás de la hoja. Así el cromo parece recortado sobre
       el fondo y no pegado encima. */
    --chrome-rgb:${trio(mezclar(deep, b, 0.22))};
    --chrome-alto-rgb:${trio(mezclar(deep, b, 0.4))};
  }`;
}

/** Para las pruebas: olvida lo aplicado y obliga a repintar. */
export function olvidarLuz() {
  ultima = null;
}
