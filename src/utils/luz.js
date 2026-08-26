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
import { temaActivo, fondoDelTema, ponerTema } from "./temas.js";

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
 * Última paleta aplicada, y con qué tema. Sirve para no tocar el DOM cuando
 * dos páginas seguidas comparten color, que pasa a menudo: repintar la hoja
 * de estilo invalida el estilo del documento entero, y hacerlo para dejarlo
 * igual es trabajo tirado justo cuando el móvil está ocupado con la
 * transición.
 *
 * El tema entra en la comparación porque la misma paleta da tokens
 * distintos en cada habitación: sin él, cambiar de modo con la misma página
 * en pantalla no repintaba nada y el libro se quedaba a medias.
 */
let ultima = null;
let ultimoTema = null;

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

/**
 * OJO AL ESCRIBIR COMENTARIOS DENTRO DEL CSS DE AQUÍ ABAJO.
 *
 * Toda la hoja de estilo se construye con una plantilla de texto, y en una
 * plantilla la comilla invertida la CIERRA. Un comentario que cite un
 * nombre de archivo entre comillas invertidas —el estilo del resto del
 * proyecto— parte la plantilla en dos y el módulo entero deja de cargar:
 * pantalla de carga congelada, sin libro y sin más pista que un «Unexpected
 * identifier» señalando a mitad de una frase en español.
 *
 * Pasó dos veces mientras se escribía esto. Dentro de la plantilla, los
 * nombres van a pelo: tokens.css, no `tokens.css`.
 */

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

  const tema = temaActivo();
  if (paleta === ultima && tema === ultimoTema) return;
  ultima = paleta;
  ultimoTema = tema;

  const { papel: PAPEL, tinte: TINTE } = tema;
  const SOMBRA_BASE = tema.sombraBase;
  const LUZ_BASE = tema.luzBase;

  // Los tres colores del capítulo, llevados a la habitación de este tema.
  // El mismo cálculo que usa el fondo de WebGL, para que la hoja y el aire
  // que la rodea sigan siendo la misma escena. Ver `temas.js`.
  const { a, b, deep } = fondoDelTema(paleta, tema);

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
       sitio donde se decide.

       Y EN LOS MODOS CLAROS PASA POR LA RED DE LEGIBILIDAD.

       De noche el acento es el color VIVO: brilla porque todo lo que tiene
       detrás —el aire, la hoja de una página oscura— está oscuro. En los
       modos claros no queda ni una superficie oscura contra la que brillar:
       el papel es casi blanco y el aire también. Ahí ese mismo acento vivo
       desaparece.

       Se comprobó en la marca ❦ de los capítulos, que lo usa: de noche daba
       4.0 a 1 y de día 2.5, o sea que se borraba. Y no era ella sola: hay
       veinticuatro sitios en el libro pidiendo «color: var(--accent)».

       Podría haberse cambiado uno por uno, decidiendo en cada sitio si cae
       sobre papel o sobre escena. Sería veinticuatro decisiones que hay que
       repetir en cada página nueva y acertar siempre. Se arregla aquí, que
       es donde se sabe qué habitación hay puesta, y se arregla para las
       veinticuatro a la vez y para las que vengan.

       De noche no cambia nada: la rama de la izquierda es el valor de
       siempre, tal cual. */
    --accent:${tema.luzAmbiente ? legible(a, papel200) : a};

    /* El acento hondo es el que va ENCIMA del papel: capitulares, filetes y
       firmas. Por eso pasa por la red de legibilidad y «--accent» no: el
       acento claro vive sobre el fondo oscuro, donde brillar es justo lo
       que tiene que hacer. */
    --accent-deep:${legible(b, papel200)};

    /* Y el acento QUE VA SOBRE EL FONDO, que no es ninguno de los dos.
       El hilo de progreso y sus marcas viven arriba del todo, encima de la
       atmósfera y no del papel. De noche el fondo es casi negro y ahí el
       acento claro brilla; de día el fondo es casi blanco y ese mismo
       acento claro desaparece —el hilo se quedaba invisible justo en el
       modo donde más se mira—. Así que de día se oscurece hasta que se lee,
       con la misma red de seguridad que usa la tinta del papel. */
    --acento-fondo:${tema.luzAmbiente ? legible(b, deep) : a};

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
       el fondo y no pegado encima.

       Y como el color hondo ya viene pasado por el tema, de día sale claro sin
       una sola línea de más: la barra es la misma pieza, hecha del mismo
       fondo, en una habitación con la luz encendida. */
    --chrome-rgb:${trio(mezclar(deep, b, tema.cromoMezcla[0]))};
    --chrome-alto-rgb:${trio(mezclar(deep, b, tema.cromoMezcla[1]))};

    /* El texto QUE VA ENCIMA DEL CROMO, no el del papel. Es lo que separa
       un modo claro de verdad de un modo oscuro con el fondo subido: si la
       barra se aclara y su texto sigue siendo marfil, no se lee nada. */
    --text:${tema.texto.base};
    --text-soft:${tema.texto.suave};
    --text-faint:${tema.texto.tenue};

    /* El filo de luz del cromo: bordes, separadores, el brillo de arriba.
       Estaba escrito a mano como blanco en veintitantos sitios, y el blanco
       sólo funciona cuando debajo hay oscuridad. Ahora es un token y cada
       tema dice de qué color es su filo. */
    --cromo-luz-rgb:${trio(tema.cromoLuz)};

    /* El dorado DEL CROMO, que no es el dorado del libro. El champán de
       tokens.css sigue intacto para las páginas, que lo ponen sobre papel o
       sobre sus propias escenas; éste es sólo para lo que va encima de la
       barra, el índice y los avisos, y por eso cambia con la habitación. */
    --oro-cromo:${tema.oro.base};
    --oro-cromo-brillo:${tema.oro.brillo};

    /* Lo que hay detrás de todo, antes de que WebGL pinte su primer
       fotograma y por debajo de él si no hay WebGL. */
    --fondo-base:${mezclar(deep, "#000000", tema.luzAmbiente ? 0 : 0.35)};

    /* Cuánta viñeta aguanta esta habitación. A plena luz, casi ninguna:
       oscurecer las esquinas de una escena clara la ensucia. */
    --vineta-fuerza:${tema.vineta.fuerza};
    --vineta-papel:${tema.vineta.sobrePapel};
    --grano-op:${tema.grano.base};
    --grano-op-alto:${tema.grano.alto};
  }`;
}

/**
 * Cambia de habitación: pone el tema y repinta el libro entero.
 *
 * Lo único que toca del DOM son tres cosas en `<html>` —la marca del tema,
 * el esquema de color que ve el navegador y el color de la barra del
 * sistema— y la hoja de estilo de aquí arriba. Todo lo demás son tokens que
 * el CSS ya estaba heredando, así que el cambio llega solo hasta el último
 * rincón sin que ninguna página se entere de que existen los temas.
 *
 * @param {string} id  «claro», «pastel» o «noche»
 * @returns {boolean}  si de verdad ha cambiado
 */
export function aplicarTema(id) {
  if (!ponerTema(id)) return false;
  const tema = temaActivo();

  const root = document.documentElement;
  root.dataset.tema = tema.id;
  // Para que el navegador pinte de su parte —barras de scroll, autocompletar,
  // la barra de estado del móvil— en el mismo idioma que el libro.
  root.style.colorScheme = tema.esquema;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", tema.barraSistema);

  // Y se repinta con la paleta que hubiera puesta. `aplicarLuz` compara
  // también el tema, así que esta llamada sí entra aunque la paleta sea la
  // misma de hace un momento.
  if (ultima) aplicarLuz(ultima);
  return true;
}

/** Para las pruebas: olvida lo aplicado y obliga a repintar. */
export function olvidarLuz() {
  ultima = null;
  ultimoTema = null;
}
