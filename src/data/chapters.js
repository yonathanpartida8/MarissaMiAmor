/**
 * CAPÍTULOS — las palabras.
 *
 * Aquí está lo que dice el libro. Todo lo demás (páginas, animaciones,
 * efectos) sólo es la forma de enseñarlo.
 *
 * ── DÓNDE ESTÁ CADA COSA ──────────────────────────────────────────────
 *   el texto de una página  →  aquí
 *   sus fotos               →  `fotos.js`
 *   el orden del libro      →  `manifest.js`
 *
 * Cinco páginas tienen tanto que decir que sus palabras viven al lado de
 * su código, para no mezclarlo todo aquí. Se cambian igual de fácil:
 *   · el candado          `src/pages/combinacion/textos.js`  (y la clave)
 *   · el pulso            `src/pages/pulso/textos.js`
 *   · la nota escondida   `src/pages/secreto/textos.js`
 *   · el cajón            `src/pages/ultima-sorpresa/textos.js`
 *   · tus fotos           `src/pages/amor/textos.js`
 * ──────────────────────────────────────────────────────────────────────
 *
 * El texto puede ser tan largo como quieras: si no cabe en la pantalla,
 * la página lo deja desplazarse con el dedo en vez de cortarlo.
 *
 * Cada capítulo puede llevar:
 *   id       identificador estable; el manifiesto lo usa para colocarlo
 *   act      a qué parte del libro pertenece
 *   title    el título de la página
 *   kicker   la línea pequeña de arriba
 *   text     el cuerpo. Largo o corto: el ritmo del libro depende de mezclarlos
 *   lines    frases sueltas que la página reparte (pétalos, estrellas, reversos
 *            de las fotos, piezas de un mosaico…). Son las que se descubren
 *            interactuando, no leyendo
 *   reveal   la frase que aparece al resolver la interacción de la página
 *   palette  DE QUÉ COLOR es esa página. Un nombre de `paletas.js`:
 *            amanecer · rubor · seda · nacar · azucar · brasa · latido ·
 *            vino · granate. Todos de la misma familia, que este libro va
 *            de una sola cosa
 *   mood     el carácter del fondo: cuánto se mueve y cuánto respira.
 *            dawn · night · amber · bloom · storm · glass · winter ·
 *            cosmos · light
 */

import { razones } from "./razones.js";
import { resolverPaleta } from "./paletas.js";

const acts = [
  { id: "antes", number: 0, title: "Antes de todo" },
  { id: "encontrarte", number: 1, title: "Encontrarte" },
  { id: "conocerte", number: 2, title: "Conocerte" },
  { id: "extranarte", number: 3, title: "Extrañarte" },
  { id: "elegirte", number: 4, title: "Elegirte" },
];

export const chapters = [
  // ═══════════════════════════════════════════════════════════════
  //  ANTES DE TODO — sus dos páginas de inicio y el candado
  //  (el título de las dos primeras lo pone su propio <title>)
  // ═══════════════════════════════════════════════════════════════
  { id: "inicio-1", act: "antes", title: "Inicio", palette: "rubor", mood: "night" },
  { id: "inicio-2", act: "antes", title: "Inicio II", palette: "vino", mood: "night" },
  { id: "puerta", act: "antes", title: "Nuestra fecha", palette: "latido", mood: "cosmos" },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO I — ENCONTRARTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "abreme",
    act: "encontrarte",
    title: "Ábreme despacio",
    kicker: "antes de empezar",
    text: "Mi amorcito <: si estás leyendo esto es porque encontraste la manera de abrir el sobre, así que ya empezamos bien :>\nEste librito no se lee de corrido en algunas páginas. Hay que tocarlo, moverlo, buscarle cositas y secretos, puedes quedarte un rato en las páginas, no hay prisa. Léelo cuando quieras, en el orden que quieras, y vuelve las veces que quieras <: aquí va a seguir estando, incluso mejorándose.\npara ti, Marissa mi niña linda 🥹",
    palette: "amanecer",
    mood: "dawn",
  },
  {
    id: "en-voz-alta",
    act: "encontrarte",
    title: "La primera vez que dije tu nombre en voz alta literalmente...",
    kicker: "un recuerdo cursi que recuerdo perfecto",
    text: "Estaba solo en mi cuarto. No había nadie escuchando y no hacía falta decirlo. Solo que neta lo dije nada más para oír cómo sonaba, y aunque lo dije mal, igual me sonrojé. Después lo dije correcto, Marissa, y me dio risa lo mucho que me gusta cómo suena.\nEse día dejé de llamarle curiosidad...",
    palette: "rubor",
    mood: "dawn",
  },
  {
    id: "tres-de-la-manana",
    act: "encontrarte",
    title: "Las tres de la mañana",
    kicker: "nuestra hora",
    text: "Hay una hora en la que parece que el mundo se vuelve raro, y nosotros cambiamos: a partir de las 3 de la mañana, hora de acá, ¡nos ponemos raros!\nA veces sólo quedamos nosotros a través de la pantalla encendida. Charlando, pero hay algo raro lindo, pues nuestro amor no sólo sube, sino que nos solemos poner raros: a veces yo con los ojos cerrándose, tú diciendo que ya nos durmamos, y ninguno de los dos lo hace. Aunque nos despidamos varias veces, solemos tener pláticas más íntimas y curiosas.\nDe verdad me gusta y neta siempre más te amo a todas horas <: en ese rato raro en el que ya no queda nada que decir y aun así nadie se va, sino que nos despedimos una y otra vez 😭",
    palette: "vino",
    mood: "night",
  },
  {
    id: "lo-que-no-dije",
    act: "encontrarte",
    title: "Lo que no te dije ese día",
    kicker: "confesión pequeña",
    text: "Que me quedé mirando la pantalla un buen rato después de que te fueras. Que revisé más de 40 veces si seguías en línea.\nY que me dio un poquito de miedo lo demasiado rápido que me estabas importando, ¡y muchísimo!\nNeta, antes de que fuéramos novios yo solía revisar si estabas en línea a cada minuto, como si necesitara saber que seguías ahí.",
    reveal: "Y lo más chistoso es que eso no ha cambiado. 🥹",
    palette: "brasa",
    mood: "amber",
  },
  {
    id: "postal-primera",
    act: "encontrarte",
    title: "Postal desde aquí",
    kicker: "date la vuelta",
    text: "Hoy hizo un día bonito y lo primero que se me ocurrió fue que te lo quería contar. Ni siquiera pasó nada especial. Sólo hizo bonito, tú no estabas, y eso ya me pareció motivo suficiente para escribirte.",
    reveal: "Te escribo por cosas así de pequeñas. Ojalá nunca dejen de parecerme importantes.",
    palette: "seda",
    mood: "glass",
  },
  {
    id: "tu-voz",
    act: "encontrarte",
    title: "Cómo dices mi nombre",
    kicker: "un detalle que nadie más nota",
    text: "Tu voz cambia un poquito cuando dices mi nombre, y no sé cómo explicarlo, pero me encanta… aunque también me hace sentir regañado 😭.\nHay algo en la forma en que lo dices que hace que se sienta diferente, como si por un segundo sólo existiéramos tú y yo.\nY aunque probablemente tú sí te das cuenta, pues me siento regañado cada vez que lo dices así, aunque la verdad me gusta 😭.\nY a decir verdad, creo que podría escucharte decir mi nombre mil veces y nunca me cansaría. Aunque me duela a veces 🤣.\n— siempre tuyo",
    palette: "amanecer",
    mood: "bloom",
  },
  {
    id: "deshojando",
    act: "encontrarte",
    title: "Deshojando",
    kicker: "no hace falta, pero por si acaso",
    text: "Quítalas todas. Ya sabemos cómo termina.",
    lines: [
      "me ama",
      "me ama muchísimo",
      "me ama en martes cualquiera",
      "me ama con la voz dormida",
      "me ama aunque yo tarde en contestar",
      "me ama cuando no estoy siendo fácil",
      "me ama de lejos, que es más difícil",
      "me ama y no le da vergüenza decirlo",
    ],
    reveal: "Ves. Siempre sale lo mismo.",
    palette: "azucar",
    mood: "bloom",
  },
  {
    id: "nuestro-desorden",
    act: "encontrarte",
    title: "Recuerdos",
    kicker: "muévelas donde quieras",
    text: "Nunca hemos necesitado tener todo planeado. Muchas de nuestras mejores cosas simplemente pasan: se nos ocurre algo de la nada, terminamos haciéndolo a nuestra manera, nos reímos y al final se convierte en otro recuerdo que quiero guardar contigo.\nPor eso estos recuerdos están así, sin ningún orden. Porque así los guardo yo también: todos revueltos en mi cabeza, apareciendo de repente, pero cada uno con algo que me hace sonreír. Y aunque sean pequeños, todos tienen algo en común: tú estás en ellos.",
    lines: [
      "esta me la quedo yo",
      "aquí me acordé de ti sin motivo",
      "un día vamos a repetir esto en persona",
      "guardé esta para un día malo",
      "mírate, por favor",
      "esta la vi como cien veces",
      "no sé si te lo dije, pero me encanta",
      "para cuando dudes de algo",
    ],
    palette: "brasa",
    mood: "amber",
  },
  {
    id: "llueve-alla",
    act: "encontrarte",
    title: "Cuando llueve allá",
    kicker: "límpialo con el dedo",
    text: "Cuando me cuentas que está lloviendo allá, me quedo un ratito imaginando el sonido de la lluvia mientras estamos juntos, acostados en la cama, sin hacer nada más que estar cerquita.\nNo sé bien por qué, pero imaginarlo me pone de buen humor. Supongo que porque, aunque estemos lejos, por un ratito siento que estamos juntos.",
    palette: "granate",
    mood: "storm",
  },
  {
    id: "huellas",
    act: "conocerte",
    title: "Caminar juntos",
    kicker: "desliza el dedo por el camino",
    text: "",
    // Van saliendo mientras caminan. La cuarta cae en el tramo difícil.
    lines: [
      "No sé exactamente a dónde vamos.",
      "Pero sé con quién quiero ir.",
      "Habrá tramos difíciles.",
      "Y en esos, si te cansas, te cargo yo.",
      "Y cuando el cansado sea yo, sé que me vas a esperar.",
      "A tu paso. Ni adelante, ni atrás: a tu lado.",
    ],
    reveal: "A donde vayas, quiero ir contigo.",
    palette: "seda",
    mood: "dawn",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO II — CONOCERTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "lista-pendiente",
    act: "conocerte",
    title: "Cosas que todavía no sé de ti",
    kicker: "que pienso averiguar",
    text: "Qué cara pones justo antes de dormirte. Qué haces cuando me dices que pondrás a cargar tu teléfono y nos quedamos desconectados. Si eres igual de cariñosa en persona que por chat o llamada. Si seguirás oliendo igual.\nTengo la lista muy larga y no tengo prisa. Pienso ir descubriéndolo todo poquito a poquito, una cosa a la vez, y quiero que dure. Porque todavía me queda muchísimo de ti por conocer.",
    palette: "seda",
    mood: "dawn",
  },
  {
    id: "por-pedacitos",
    act: "conocerte",
    title: "Te fui armando",
    kicker: "toca cada pieza",
    text: "No te conocí de golpe. Fue por pedacitos: una manía aquí, una historia allá, un día en que te enojaste y aprendí algo nuevo. Y lo raro es que cada pedazo que aparecía me gustaba más que el anterior. Todavía me faltan piezas. Ojalá me falten siempre algunas.",
    palette: "azucar",
    mood: "glass",
  },
  {
    id: "me-caigo-mejor",
    act: "conocerte",
    title: "Contigo me caigo mejor",
    kicker: "y no sé explicarlo mejor",
    text: "Hay una versión de mí que sólo aparece cuando estoy contigo a unas horas específicas: a eso de la 1 o las 3 de la madrugada, hora de acá, todo se pone raro, especialmente nosotros. Hablamos de cosas curiosas, cosas picantes, se nos dispara la confianza hasta los cielos, y neta me gusta eso.\nNo sé exactamente qué sucede para sacar nuestras versiones así, pero me encanta. Sabes que contigo no siento que tenga que fingir lo que digo.\nY lo más bonito es que, cuando colgamos, esa versión se queda conmigo un ratito más.",
    palette: "rubor",
    mood: "glass",
  },
  {
    id: "razones",
    act: "conocerte",
    title: "Razones por las que te amo",
    kicker: "desliza cada carta",
    text: "",
    // Las cien razones están en `src/data/razones.js`.
    lines: razones,
    reveal: "Y eso que sólo cupieron cien. Las razones no se me acaban.",
    palette: "rubor",
    mood: "bloom",
  },
  {
    // (El id se queda como estaba para no perder lo que ya recuerda el
    // libro; lo que se ve es «Pines que me recordaron a ti».)
    id: "nuestra-pelicula",
    act: "conocerte",
    title: "Pines que me recordaron a ti",
    kicker: "desliza los pines",
    text: "Cada vez que ando en Pinterest me pasa lo mismo: veo algo bonito y pienso en ti. Un color, una frase, una canción, un lugar al que quiero ir contigo, una tontería que sé que te daría risa.\nLos fui guardando sin decirte nada, uno por uno, como quien junta piedritas bonitas en la playa.\nAquí están. Son pedacitos del mundo que, sin saberlo, tenían algo tuyo.",
    palette: "vino",
    mood: "winter",
  },
  {
    id: "pines-dedicados",
    act: "conocerte",
    title: "Pines que te dedico",
    kicker: "estos son para ti",
    text: "Éstos no me recordaron a ti: éstos los escogí para ti.\nCada uno lo guardé pensando «esto se lo quiero dedicar», porque hay cosas que siento y que no me salen en palabras, pero que de repente encuentro en una imagen.\nSi algún día no sabes cuánto te amo, ven aquí y pasa los pines despacito. Todos dicen lo mismo.",
    palette: "azucar",
    mood: "bloom",
  },
  {
    id: "con-mi-letra",
    act: "conocerte",
    title: "Con mi letra",
    kicker: "arrastra y lo escribo",
    text: "Te lo escribo así, despacio y sin borrar, porque quiero que se note que lo estoy pensando mientras lo digo. Si me sale torcido, mejor. Nunca se me ha dado bien decir las cosas bonito a la primera, pero cuando las digo, las digo en serio.\nA veces no sé cómo explicar todo lo que siento por ti, así que prefiero escribirlo como me salga, aunque no sea perfecto. Porque esto no busca ser perfecto, sólo quiero que sea mío y que cuando lo leas puedas sentir un poquito de todo lo que siento por ti.\nQuiero que algún día, cuando vuelvas a leer estas palabras, recuerdes que hubo un momento en el que estaba aquí, pensando en ti y sonriendo mientras escribía esto.\nte amo, mi amorcito. 🥹",
    palette: "seda",
    mood: "night",
  },
  {
    id: "la-combinacion",
    act: "conocerte",
    title: "Sólo tú sabes abrirlo",
    kicker: "gira hasta dar con ello",
    text: "Aquí dentro hay algo guardado y no pienso darte la combinación, porque ya te la sabes. Es un número que a cualquier otra persona no le diría nada.",
    reveal: "Ese día no pasó nada del otro mundo. Pero yo lo cuento como el principio de todo.",
    // ⬇ CÁMBIALO por vuestra fecha (día y mes, o mes y año: cuatro cifras).
    //   La pista sale sola si falla tres veces, y a la sexta la caja se abre.
    combination: "1408",
    combinationHint: "el día que empezó todo",
    palette: "brasa",
    mood: "amber",
  },
  {
    id: "mi-norte",
    act: "conocerte",
    title: "Mi norte",
    kicker: "gírala, muévela, da igual",
    text: "Hay días en los que no sé muy bien hacia dónde voy. Pero en cuanto pienso en ti se me acomoda todo. Puedes darle todas las vueltas que quieras.",
    reveal: "Siempre acaba apuntando al mismo lado: a ti.",
    palette: "melocoton",
    mood: "amber",
  },
  {
    id: "botella",
    act: "conocerte",
    title: "Carta en una botella",
    kicker: "quítale el corcho",
    text: "Escribo esto para ti, mi amorcito, como si pudiera meter un pedacito de mi corazón en esta botella y hacértelo llegar hasta donde estás.\nQuiero que, cuando lo leas, sientas que estoy cerquita de ti, aunque entre nosotros haya una pantalla y tantos kilómetros. Imagíname ahí, hablándote bajito, diciéndote cuánto te amo y cuánto me gustaría poder abrazarte mientras te digo todo esto.\nHay tantas cosas que quisiera decirte estando a tu lado: mirarte, tomar tu mano, acercarme a ti y simplemente quedarme ahí contigo, sin necesitar decir nada.\nAsí que mientras llega ese momento, te dejo esto. Un pedacito de mí, guardado aquí para ti.\nÁbrelo despacito, amorcito.\nY cuando termines de leerlo, acuérdate de que en algún lugar de aquí estoy yo, pensando en ti y queriéndote muchísimo.\nTe amo. Siempre tuyo. 🥹",
    palette: "seda",
    mood: "winter",
  },
  {
    id: "todo-lo-que-guardo",
    act: "conocerte",
    title: "Todo lo que guardo",
    kicker: "gíralo · toca uno",
    text: "Tengo una carpeta que no le he enseñado a nadie. No es nada del otro mundo: capturas, cosas que dijiste, imágenes que me recordaron a ti sin razón. Ábrela y verás que no hay ningún orden. Es lo más honesto que tengo.",
    palette: "vino",
    mood: "cosmos",
  },
  {
    // Este capítulo ya sólo pone la paleta y el ambiente: lo que dice la
    // página —y cuáles son las palabras que esconden algo— está en
    // `src/pages/secreto/textos.js`.
    id: "en-voz-baja",
    act: "conocerte",
    title: "Lo que no se ve de primeras",
    kicker: "hay cosas escritas entre líneas",
    text: "Esto no lo diría fuerte. No porque me dé vergüenza, sino porque hay cosas que se dicen mejor bajito, cuando no las oye nadie más.",
    palette: "granate",
    mood: "glass",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO III — EXTRAÑARTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "regalo",
    act: "extranarte",
    title: "Ábrelo",
    kicker: "tira del listón",
    text: "No es nada material y ya lo sabías… bueno, en realidad sí es un regalito esta vez 🥹.\nEs mi regalo de cumpleaños. De verdad, feliz cumpleaños, mi niña linda, quiero darte tu regalito. Quiero comprarte ropita de SHEIN y quiero que tú elijas lo que quieras. De verdad, no te preocupes por qué escoger ni por el precio; pueden ser blusitas, pantalones, pijamas, ropa interior o cualquier cosita que te guste. Quiero que elijas lo que de verdad quieras y necesites.\nSé que necesitas ropita y me hace mucha ilusión poder regalártela. Lo que te guste, mándame tus cositas para comprártelas yo. 🥹💗\nAsí que sí, este es mi regalito también para ti, mi amorcito. No es sólo ropa; es una pequeña manera de decirte que me encanta consentirte y poder darte cositas 🥹.",
    reveal: "Feliz cumpleaños, mi niña linda. Te amo muchísimo.",
    palette: "azucar",
    mood: "bloom",
  },
  {
    id: "cupones",
    act: "extranarte",
    title: "Vales de amor",
    kicker: "arranca uno",
    text: "",
    lines: [
      "Vale por un abrazo de esos que no se terminan.",
      "Vale por una videollamada hasta que nos quedemos dormidos.",
      "Vale por un beso en la frente (canjeable en persona).",
      "Vale por un día en el que yo te consienta en todo.",
      "Vale por una cita, la que tú escojas.",
      "Vale por escucharte sin interrumpir, aunque sea de madrugada.",
      "Vale por un masajito cuando estés cansada.",
      "Vale por una canción dedicada, cantada mal pero con amor.",
    ],
    reveal: "Vale por lo que tú quieras, cuando tú quieras. Sin fecha de caducidad.",
    palette: "azucar",
    mood: "bloom",
  },
  {
    id: "la-distancia",
    act: "extranarte",
    title: "La distancia",
    kicker: "acércalos con el dedo",
    text: "La distancia no me da miedo. Pero sí me pesa muchísimo. Me pesa no poder abrazarte cuando quiero, no poder tomarte de la mano, no poder estar a tu lado en esos momentos pequeños que quisiera compartir contigo.\nA veces quisiera que no existieran tantos kilómetros entre nosotros y que una pantalla no fuera la única manera de sentirte cerca.\nPero incluso con todo eso, te sigo eligiendo. Porque todo este tiempo esperando vale la pena por algo que deseo muchísimo: una tarde cualquiera contigo, sin prisas, sin pantallas y sin tener que despedirnos. Sólo tú y yo, juntos, disfrutando de tenernos por fin cerquita.\nY cuando llegue ese día, quiero abrazarte tan fuerte que por un ratito se me olvide toda la distancia que tuvimos que soportar.",
    reveal: "Y esto, tarde o temprano, se cierra.",
    palette: "medianoche",
    mood: "cosmos",
  },
  {
    id: "manos",
    act: "extranarte",
    title: "Nuestras manos",
    kicker: "acerca tu mano a la mía",
    text: "",
    // Salen mientras se acercan, y la última si se quedan juntas un rato.
    lines: [
      "Aunque ahora estemos lejos,",
      "cada día estamos un poquito más cerca.",
      "Y cuando por fin pase, no te voy a soltar.",
    ],
    reveal: "Algún día, sin pantalla de por medio.",
    palette: "latido",
    mood: "cosmos",
  },
  {
    id: "mi-pulso",
    act: "extranarte",
    title: "Mi pulso",
    kicker: "pon el dedo aquí",
    text: "Si pudiera mandarte esto en vez de un mensaje, te lo mandaría. Es más honesto que cualquier cosa que escriba.",
    reveal: "Se acelera un poco cuando aparece tu nombre. Siempre.",
    palette: "latido",
    mood: "bloom",
  },
  {
    id: "mismo-cielo",
    act: "extranarte",
    title: "El mismo cielo",
    kicker: "une los puntos",
    text: "Me dijeron una vez que las constelaciones no existen: que son estrellas sueltas, a distancias imposibles unas de otras, y que la figura la pone quien mira. Me pareció la cosa más romántica que he oído. Nosotros también estamos lejísimos y también hacemos figura.",
    lines: [
      "un mensaje a las 2:14",
      "la vez que te reíste tanto",
      "cuando me dijiste que sí",
      "el audio que no borré",
      "un lunes cualquiera",
      "la foto que mandaste sin querer",
      "cuando te enojaste con razón",
      "la primera videollamada",
      "esa canción que ya es tuya",
      "el día que se te olvidó colgar",
    ],
    palette: "medianoche",
    mood: "cosmos",
  },
  {
    id: "farolitos",
    act: "extranarte",
    title: "Farolitos de deseos",
    kicker: "toca el cielo para soltar un deseo",
    text: "",
    lines: [
      "Que un día despertemos en el mismo lugar.",
      "Que nunca nos falte de qué platicar.",
      "Que tus sueños se cumplan todos, y yo esté ahí para verlos.",
      "Que la distancia sea sólo un recuerdo.",
      "Que sigamos siendo raros juntos a las 3 a. m.",
      "Que te sientas amada todos los días.",
      "Que nuestra primera cita sea tan bonita como la imagino.",
      "Que me sigas eligiendo, como yo a ti.",
    ],
    reveal: "Todos los deseos van al mismo lugar: a nosotros.",
    palette: "melocoton",
    mood: "night",
  },
  {
    id: "postal-segunda",
    act: "extranarte",
    title: "Otra postal",
    kicker: "date la vuelta",
    text: "Aquí son las once y pico y estoy pensando en ti otra vez, que es una noticia poco original. Te la mando igual.",
    reveal: "Lo curioso es que ya no me pesa extrañarte. Me gusta. Significa que hay algo bueno esperando.",
    palette: "seda",
    mood: "amber",
  },
  {
    id: "burbujas",
    act: "extranarte",
    title: "Revienta las burbujas",
    kicker: "cada una guarda una palabra",
    text: "",
    lines: [
      "Aunque",
      "estemos",
      "lejos,",
      "cada",
      "burbuja",
      "que",
      "revientas",
      "es",
      "un",
      "beso",
      "que",
      "te",
      "mando.",
    ],
    reveal: "Revienta las que quieras: los besos no se acaban. 💋",
    palette: "lila",
    mood: "glass",
  },
  {
    id: "te-lo-digo-bajito",
    act: "extranarte",
    title: "Nada del otro mundo",
    kicker: "acércate",
    text: "No tengo una frase enorme para hoy. Sólo esto: me gusta que existas, y me gusta que existas hoy también.",
    palette: "ciruela",
    mood: "light",
  },
  {
    id: "debajo-de-esto",
    act: "extranarte",
    title: "Debajo de esto",
    kicker: "rasca",
    text: "Hay días en los que no me sale ser cariñoso. No es que no lo sienta, no es que no lo quiera o que te ame menos, es que a veces simplemente se me atora. A veces me siento mal, me cuesta pensar y hasta me cuesta encontrar las palabras.\nSi algún día me notas raro, quiero que recuerdes esto: no significa que algo haya cambiado entre nosotros. Debajo de todo eso sigues estando tú.\nPorque aunque algunos días no sepa cómo demostrarlo, mi amor por ti sigue ahí. Sigue siendo el mismo, incluso cuando no sé cómo expresarlo.",
    reveal: "Créeme, mi amorcito, te sigo amando muchísimo.",
    palette: "granate",
    mood: "glass",
  },
  {
    id: "faro",
    act: "extranarte",
    title: "Aunque esté oscuro",
    kicker: "encuentra el barquito con la luz",
    // Sale cuando el barquito llega a la orilla.
    text: "Hay días en que todo se pone oscuro y no se ve la orilla. En esos días no tienes que saber el camino: sólo busca la luz. Yo la voy a dejar prendida.",
    reveal: "Siempre vas a tener a dónde volver.",
    palette: "medianoche",
    mood: "night",
  },
  {
    id: "confesion",
    act: "extranarte",
    title: "Una confesión",
    kicker: "se escribe sola · mantén para ir más rápido",
    text: "Una confesión: antes leía tu mensaje, sabía perfectamente qué quería contestarte y, aunque me moría de ganas de responderte, lo dejaba ahí unos minutos.\nNo es que no tuviera ganas. Al contrario, tenía muchísimas. Es que me ponía nervioso, muy nervioso, y me quedaba pensando demasiado en cómo responderte bien, porque contigo me importa mucho decir las cosas como las siento.\nYa sé que desde fuera puede parecer lo contrario, como si no me importara o no tuviera ganas de hablarte.\nPero quería contártelo para que nunca más lo confundas con falta de interés. Si alguna vez tardé en responderte, muchas veces era justamente porque me importabas demasiado.",
    palette: "vino",
    mood: "night",
  },
  {
    id: "sin-adornos",
    act: "extranarte",
    title: "Sin adornos",
    kicker: "inclina el teléfono",
    text: "Eres mi todo.\nY quizá suene como una de esas frases que se dicen cuando alguien ama muchísimo, pero cuando te lo digo yo, lo siento de verdad. Porque desde que llegaste a mi vida, te convertiste en una parte de mí que ya no sé imaginar sin ella.\nCambiaste mis días, mis pensamientos, mis ganas y hasta la manera en la que imagino mi futuro. Ahora hay una persona que quiero tener en cada momento importante, en cada cosa bonita y hasta en las cosas más pequeñas, neta en todo.\nPor eso digo que eres mi todo. Porque cuando pienso en lo que más quiero, deseo y más amo, estás tú. Cuando imagino lo que me hace feliz, estás tú. Y cuando pienso en todo lo que quiero conservar en mi vida, siempre terminas apareciendo tú.\nNo sé cómo explicarlo de una manera más bonita, pero siento que sin ti mi vida perdería una parte enorme de lo que hoy la hace especial.\nEres mi todo, mi amorcito. Y no quiero imaginar mi vida sin ti.",
    palette: "nacar",
    mood: "glass",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO IV — ELEGIRTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "aburridos",
    act: "elegirte",
    title: "Aburridos juntos",
    kicker: "mi plan favorito",
    text: "Creo que la mayoría de la gente se imagina viajes, fiestas y un montón de cosas cuando piensa en estar con la persona que ama…\nPuff, yo me imagino una tarde sin nada que hacer contigo.\nLos dos juntos, hablando de cualquier cosa, diciendo puras tonterías, riéndonos por cualquier estupidez y simplemente disfrutando de estar ahí, sin necesitar hacer algo especial.\nY si algún día estamos aburridos juntos, neta voy a ser insoportablemente feliz. Porque hasta aburrirme contigo me gustaría.\nCreo que ese sería uno de esos momentos en los que pensaría: “Sí, quiero esto. Quiero poder pasar una tarde entera contigo sin hacer absolutamente nada y aun así sentir que fue uno de mis días favoritos”.\nPorque contigo hasta el aburrimiento se sentiría bonito.\nY probablemente terminaríamos haciendo alguna tontería de todos modos, porque somos twins 😭.\n— siempre tuyo, mi niña bonita.",
    palette: "amanecer",
    mood: "amber",
  },
  {
    id: "relojes",
    act: "elegirte",
    title: "Dos relojes",
    kicker: "pon tu reloj a la hora del mío",
    // Sale cuando los dos relojes se juntan.
    text: "Tus días y los míos no siempre caminan igual: a veces tú apenas empiezas cuando yo ya voy terminando. Pero siempre encontramos un ratito que es sólo de los dos.",
    reveal: "Y en ese ratito, el tiempo es nuestro.",
    palette: "granate",
    mood: "night",
  },
  {
    id: "rompecabezas-dos",
    act: "elegirte",
    title: "No como alguien perfecto",
    kicker: "descubre la imagen",
    text: "No te veo como alguien perfecto, porque creo que alguien así sería hasta aburridísimo.\nTe veo cuando estás segura de tener la razón y también cuando después te das cuenta de que quizá no la tenías. Te veo cansada y aun así tratando de estar para mí. Te veo cuando algo te cuesta y, aunque no siempre sea fácil, sigues intentándolo.\nY eso último es de las cosas que más me gustan de ti.\nNo que todo te salga bien, ni que siempre sepas qué hacer, sino que lo intentas. Que te importa. Que sigues poniendo de tu parte incluso cuando las cosas no salen como quieres.\nEso es algo que quizá no se dice lo suficiente, pero yo sí quiero que lo sepas.\nMe encanta la persona que eres, con todo lo que te hace ser tú.\nY no cambiaría eso por alguien perfecta.",
    palette: "azucar",
    mood: "bloom",
  },
  {
    id: "acariciar",
    act: "elegirte",
    title: "Lo que quiero de ti",
    kicker: "acaricia la pantalla",
    text: "No quiero que seas perfecta ni que estés siempre bien. Quiero que me cuentes cuando no lo estés. Quiero conocer tus días pesados, tus mensajes mal escritos, esos ratitos en los que no tienes ganas de hablar y hasta esos momentos en los que sólo quieres estar tranquila.\nAunque estemos lejos, quiero conocer todas esas partes de ti. Quiero saber cómo fue tu día, qué te hizo sonreír, qué te preocupó y qué cosas quizá no me contarías si no te preguntara.\nNo quiero conocer solamente la versión de ti que aparece cuando hablamos y todo está bien. Quiero que sientas que también puedes llegar conmigo cuando estés cansada, triste o simplemente no tengas palabras.\nPorque aunque haya kilómetros entre nosotros, quiero que sientas que conmigo puedes ser tú completamente.\nY quizá eso es una de las cosas más bonitas que puedo pedirte: que nunca sientas que tienes que esconderme ninguna parte de ti.",
    palette: "rubor",
    mood: "bloom",
  },
  {
    id: "mejorar",
    act: "elegirte",
    title: "Lo que estoy haciendo",
    kicker: "en presente, no en promesas",
    text: "No te voy a prometer que nunca voy a cambiar, porque sé que las personas cambiamos con el tiempo.\nPero sí quiero que confíes en algo <: si cambio, quiero que sepas que será siempre para bien. Para aprender, para crecer y para saber amarte cada vez mejor.\nEstoy aprendiendo a decir las cosas cuando pasan y no días después. Estoy aprendiendo a preguntarte en vez de escucharte, quiero charlar mejor contigo.\nSé que no siempre voy a hacerlo perfecto. Voy a equivocarme, pero no quiero quedarme en el mismo error. Quiero aprender de él y volver a intentarlo al día siguiente.\nY sobre todo, quiero que tengas la tranquilidad de que nunca voy a dejar de tratarte con amor, respeto y cariño. No quiero hacerte sentir menos, lastimarte a propósito ni hacerte dudar de lo que siento por ti.\nQuiero que confíes en mí, no solamente por lo que te digo, sino por la manera en que te lo demuestro con el tiempo.\nPorque no quiero ser alguien que simplemente te prometa que va a ser mejor.\nQuiero ser alguien que realmente lo sea.",
    palette: "amanecer",
    mood: "glass",
  },
  {
    id: "promesas",
    act: "elegirte",
    title: "Lo que te prometo",
    kicker: "sella cada una con el lacre",
    text: "",
    // Una tarjeta por promesa. Se sellan de una en una.
    lines: [
      "Te prometo escucharte, incluso cuando no sepa qué decir.",
      "Te prometo que ninguna pelea va a durar más que las ganas de abrazarte.",
      "Te prometo cuidar tus sueños como si fueran míos.",
      "Te prometo decirte la verdad, aunque cueste.",
      "Te prometo elegirte también en los días grises.",
      "Te prometo no dejar de aprender a amarte mejor.",
    ],
    reveal: "Y todas las firmo con lo mismo: con todo lo que soy.",
    palette: "ciruela",
    mood: "amber",
  },
  {
    id: "cosas-tuyas",
    act: "elegirte",
    title: "Unas de tantas fotitos tuyas",
    kicker: "muévelas · dales la vuelta",
    text: "Que me encantan.",
    lines: [
      "cómo escribes cuando tienes sueño",
      "los audios que empiezan riéndote",
      "que te tardas más si es importante",
      "tu forma de decir «ya sé»",
      "cuando mandas tres mensajes seguidos",
      "el punto final cuando estás seria",
      "que preguntas si comí",
      "cómo suenas recién despierta",
    ],
    palette: "seda",
    mood: "light",
  },
  {
    id: "frasco",
    act: "elegirte",
    title: "Un frasco de notitas",
    kicker: "toca el frasco",
    text: "",
    lines: [
      "Hoy pensé en ti al despertar, y otra vez antes de dormir.",
      "Tu risa es mi canción favorita.",
      "Si pudiera, te mandaría un abrazo por correo urgente.",
      "Eres mi lugar seguro, aunque estés lejos.",
      "Gracias por existir justo como eres.",
      "Me encanta cuando me cuentas tu día con todos los detalles.",
      "Te debo un millón de besos. Voy a pagarlos todos.",
      "Un día vamos a leer esto juntos y nos vamos a reír.",
      "Eres mi persona favorita, en cualquier idioma.",
      "Te amo más de lo que cabe en este frasco.",
    ],
    reveal: "Ya las leíste todas… pero el frasco se vuelve a llenar cada día.",
    palette: "lila",
    mood: "amber",
  },
  {
    id: "no-se-me-pasa",
    act: "elegirte",
    title: "No se me pasa",
    kicker: "pásalo entero, hasta el último",
    text: "Llevo el tiempo suficiente como para que ya se me hubiera pasado, si esto fuera de esas cosas que con el tiempo desaparecen.\nY no.\nAl contrario. Cada día me doy cuenta de que estoy más enamorado de ti. Ya no es esa emoción de los primeros días que hace tanto ruido; ahora es algo más tranquilo, más profundo y mucho más seguro.\nMe sigues poniendo nervioso, me sigues haciendo sonreír por cualquier tontería y todavía hay momentos en los que me quedo pensando en ti y digo: “¿Cómo puede gustarme tanto esta niña?”\nSupongo que eso es lo bonito.\nQue no se me está pasando.\nMe estoy enamorando de ti cada vez más.",
    palette: "rubor",
    mood: "cosmos",
  },
  {
    id: "gracias",
    act: "elegirte",
    title: "Gracias por quedarte",
    kicker: "esto sí es serio",
    text: "Por los días en que no fui fácil. Por esperar sin echármelo en cara. Por no irte cuando tenías todo el derecho de hacerlo. No sé si te lo he dicho con estas palabras, así que aquí quedan escritas: gracias por quedarte.",
    palette: "nacar",
    mood: "amber",
  },
  {
    // Este capítulo ya sólo pone la paleta y el ambiente: lo que dice la
    // página está en `src/pages/ultima-sorpresa/textos.js`.
    id: "ultimo-secreto",
    act: "elegirte",
    title: "El cajón",
    kicker: "hay seis cosas aquí",
    text: "Te reservé esto para el final, porque es lo que más me cuesta decir de frente y lo que más en serio va.",
    reveal: "No te amo para pasar el rato. Te amo para lo lento: para los años, los lunes y las cosas aburridas.",
    palette: "brasa",
    mood: "bloom",
  },
  {
    id: "te-elijo",
    act: "elegirte",
    title: "Te elijo",
    kicker: "y mañana otra vez",
    text: "No porque me falte nada. No porque no haya más gente en el mundo. Te elijo despierto, sabiendo lo que cuesta, sabiendo que estás lejos y que hay días difíciles. Te elegí, te elijo y pienso seguir eligiéndote, que es lo único que de verdad depende de mí.",
    palette: "latido",
    mood: "bloom",
  },
  {
    id: "un-dia",
    act: "elegirte",
    title: "Un día cualquiera contigo",
    kicker: "desliza de la mañana a la noche",
    text: "",
    // Un momento por cada hora del día, de la mañana a la noche.
    lines: [
      "Despertarte con café y dejarte cinco minutos más.",
      "Ir al súper y discutir qué pan llevar.",
      "Comer lo que sea, pero en la misma mesa.",
      "Una siesta que se nos alarga sin querer.",
      "Caminar sin rumbo mientras baja el sol.",
      "Ver una película que ninguno de los dos termina.",
      "Y quedarnos dormidos a media plática.",
    ],
    reveal: "Nada especial. Justo eso es lo que más quiero contigo.",
    palette: "amanecer",
    mood: "dawn",
  },
];

/** Acceso por id, para que el manifiesto no dependa del orden del array. */
/**
 * Cada capítulo dice de qué color es por su NOMBRE («vino», «latido»…) y
 * aquí se traduce a los tres colores de verdad. Se hace una sola vez, al
 * cargar, y también con los capítulos que él añada desde `mis-paginas/`,
 * que pueden seguir escribiendo su trío a mano si quieren.
 */
function pintar(chapter) {
  chapter.palette = resolverPaleta(chapter.palette);
  return chapter;
}

chapters.forEach(pintar);

export const chapterById = Object.fromEntries(chapters.map((c) => [c.id, c]));

/**
 * Registra los capítulos de las páginas que él añade en `mis-paginas/`.
 * Se llama al arrancar, antes de construir nada.
 */
export function registerCustomChapters(list, act) {
  // El acto se registra aunque no venga ningún capítulo: las páginas de
  // `images/amores/` forman su propio acto en el índice y no tienen texto.
  if (act && !actById[act.id]) {
    acts.push(act);
    actById[act.id] = act;
  }
  if (!list?.length) return;
  for (const chapter of list) {
    pintar(chapter);
    chapters.push(chapter);
    chapterById[chapter.id] = chapter;
  }
}

export const getChapter = (id) => {
  const chapter = chapterById[id];
  if (!chapter) console.warn(`[chapters] no existe el capítulo "${id}"`);
  return chapter;
};

export const actById = Object.fromEntries(acts.map((a) => [a.id, a]));

/** Texto de cierre, que no es un capítulo pero también se escribe aquí. */
export const finale = {
  kicker: "y esto no se acaba aquí",
  lines: ["Por ahora."],
  body: "Este librito termina aquí, pero todo lo que siento por ti no.\nQuiero que sepas que mi corazón está contigo. Que me entrego a ti con todo lo que soy, con mis cosas buenas, mis defectos, mis días bonitos y también los que no lo son tanto, todo de mí.\nSoy tuyo, mi amorcito. No a medias, no por un ratito y no sólo cuando todo está bien.\nSoy tuyo porque te elegí y porque, cada día, te sigo eligiendo a ti, y no como una opción 🤍\nQuiero cuidarte, respetarte, amarte bonito y seguir creciendo contigo. Quiero que tengas la tranquilidad de saber que mi amor está aquí, para ti y sólo para ti, y que no me iré.\nAsí que sí, este librito termina aquí, pero mis palabras no terminan: tengo millones de palabras que necesito decirte, tantas cosas lindas…\npero lo mío contigo apenas sigue.",
  sign: "Te amo, mi amorcito\nSiempre tuyo. 🥹",
  /** Lo último de todo, debajo de la firma. */
  continuara: "continuará",
};
