/**
 * CAPÍTULOS — las palabras.
 *
 * Este es el único fichero que hay que tocar para cambiar lo que dice el libro.
 * Todo lo demás (páginas, animaciones, efectos) sólo es la forma de enseñarlo.
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
 *   palette  los colores que esa página impone a toda la atmósfera
 *   mood     el carácter del fondo: dawn · night · amber · bloom · storm ·
 *            glass · winter · cosmos · light
 */

export const acts = [
  { id: "encontrarte", number: 1, title: "Encontrarte" },
  { id: "conocerte", number: 2, title: "Conocerte" },
  { id: "extranarte", number: 3, title: "Extrañarte" },
  { id: "elegirte", number: 4, title: "Elegirte" },
];

export const chapters = [
  // ═══════════════════════════════════════════════════════════════
  //  ACTO I — ENCONTRARTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "abreme",
    act: "encontrarte",
    title: "Ábreme despacio",
    kicker: "antes de empezar",
    text: "Marissa: si estás leyendo esto es porque encontraste la manera de abrir el sobre, así que ya empezamos bien. Este librito no se lee de corrido. Hay que tocarlo, moverlo, buscarle las cosquillas, quedarse un rato en las páginas que no dicen nada a la primera. Un poco como me pasó contigo. No hay prisa. Léelo cuando quieras, en el orden que quieras, y vuelve las veces que quieras: aquí va a seguir estando.",
    palette: { a: "#f0a8c0", b: "#5b1f52", deep: "#150a1c" },
    mood: "dawn",
  },
  {
    id: "en-voz-alta",
    act: "encontrarte",
    title: "La primera vez que dije tu nombre en voz alta",
    kicker: "una tontería que recuerdo perfecto",
    text: "Estaba solo en mi cuarto. No había nadie escuchando y no hacía falta decirlo. Lo dije nada más para oír cómo sonaba, y me dio risa lo mucho que me gustó cómo sonaba. Ese día dejé de llamarle curiosidad.",
    palette: { a: "#c4a2f5", b: "#3b1f6e", deep: "#120a24" },
    mood: "dawn",
  },
  {
    id: "tres-de-la-manana",
    act: "encontrarte",
    title: "Las tres de la mañana",
    kicker: "nuestra hora",
    text: "Hay una hora en la que el mundo se calla y sólo queda una pantalla encendida. Ahí es donde más hemos vivido tú y yo. Yo con los ojos cerrándose, tú diciendo que ya nos durmamos, y ninguno de los dos colgando. Creo que ahí es donde más te he querido: en ese rato tonto en el que ya no queda nada que decir y aun así nadie se va.",
    palette: { a: "#7fb4f5", b: "#16306b", deep: "#040d1e" },
    mood: "night",
  },
  {
    id: "lo-que-no-dije",
    act: "encontrarte",
    title: "Lo que no te dije ese día",
    kicker: "confesión pequeña",
    text: "Que me quedé mirando la pantalla un buen rato después de que te fueras. Que revisé dos veces si seguías en línea. Y que me dio un poquito de miedo lo rápido que me estabas importando.",
    reveal: "Sigo revisando. Ya sin miedo.",
    palette: { a: "#ffc46b", b: "#7a3d0c", deep: "#1c0f04" },
    mood: "amber",
  },
  {
    id: "postal-primera",
    act: "encontrarte",
    title: "Postal desde aquí",
    kicker: "date la vuelta",
    text: "Hoy hizo un día bonito y lo primero que se me ocurrió fue que te lo quería contar. Ni siquiera pasó nada especial. Sólo hizo bonito, tú no estabas, y eso ya me pareció motivo suficiente para escribirte.",
    reveal: "Te escribo por cosas así de pequeñas. Ojalá nunca dejen de parecerme importantes.",
    palette: { a: "#7fd8c8", b: "#0f4f47", deep: "#04191a" },
    mood: "glass",
  },
  {
    id: "tu-voz",
    act: "encontrarte",
    title: "Cómo dices mi nombre",
    kicker: "un detalle que nadie más nota",
    text: "Se te sube un poquito al final, como si estuvieras preguntando algo. No lo haces con nadie más, lo he comprobado. Y yo ya me acostumbré a esperar esa subida: cuando llega, sé que lo que sigue va a ser para mí.",
    palette: { a: "#ffb0c8", b: "#7a1f45", deep: "#1a0812" },
    mood: "bloom",
  },
  {
    id: "deshojando",
    act: "encontrarte",
    title: "Deshojando",
    kicker: "no hace falta, pero por si acaso",
    text: "Quítalas todas. Ya sabemos cómo termina.",
    lines: [
      "me quiere",
      "me quiere mucho",
      "me quiere en martes cualquiera",
      "me quiere con la voz dormida",
      "me quiere aunque yo tarde en contestar",
      "me quiere cuando no estoy siendo fácil",
      "me quiere de lejos, que es más difícil",
      "me quiere y no le da vergüenza decirlo",
    ],
    reveal: "Ves. Siempre sale lo mismo.",
    palette: { a: "#ff8fb0", b: "#8a1e4a", deep: "#1c0813" },
    mood: "bloom",
  },
  {
    id: "nuestro-desorden",
    act: "encontrarte",
    title: "Nuestro desorden",
    kicker: "muévelas donde quieras",
    text: "Nunca hemos sido de planear. Se nos ocurren las cosas a media noche, las hacemos mal y nos reímos. Estos recuerdos están así, tirados sin ningún orden, porque así los tengo yo también: revueltos, y todos buenos.",
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
    palette: { a: "#ffb454", b: "#7a3a08", deep: "#1a0f03" },
    mood: "amber",
  },
  {
    id: "llueve-alla",
    act: "encontrarte",
    title: "Cuando llueve allá",
    kicker: "límpialo con el dedo",
    text: "Me contaste que estaba lloviendo y me quedé un rato imaginando el ruido en tu ventana. No sé bien por qué eso me puso de buen humor. Supongo que porque era una cosa tuya, pequeña, que me estabas dejando ver sin darle importancia.",
    palette: { a: "#8ea8f0", b: "#1c2352", deep: "#070a18" },
    mood: "storm",
  },

  // ═══════════════════════════════════════════════════════════════
  //  ACTO II — CONOCERTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "lista-pendiente",
    act: "conocerte",
    title: "Cosas que todavía no sé de ti",
    kicker: "y que pienso averiguar",
    text: "Qué cara pones justo antes de dormirte. Qué haces con las manos cuando estás nerviosa. Si te ríes igual en persona o si en persona es peor. A qué hueles. Tengo la lista larga y no tengo prisa: pienso ir tachándola de una en una, con calma, y que dure.",
    palette: { a: "#e0a6ff", b: "#4a1a72", deep: "#150a22" },
    mood: "dawn",
  },
  {
    id: "por-pedacitos",
    act: "conocerte",
    title: "Te fui armando",
    kicker: "toca cada pieza",
    text: "No te conocí de golpe. Fue por pedacitos: una manía aquí, una historia allá, un día en que te enojaste y aprendí algo nuevo. Y lo raro es que cada pedazo que aparecía me gustaba más que el anterior. Todavía me faltan piezas. Ojalá me falten siempre algunas.",
    palette: { a: "#7fd0ff", b: "#0d3c66", deep: "#04121f" },
    mood: "glass",
  },
  {
    id: "me-caigo-mejor",
    act: "conocerte",
    title: "Contigo me caigo mejor",
    kicker: "y no sé explicarlo mejor",
    text: "Hay una versión mía que sólo existe cuando estoy hablando contigo. Habla más, se ríe antes, no anda midiendo tanto lo que dice. No sé de dónde la sacas. Sé que me gusta más que la otra, y que se me queda un rato después de que colgamos.",
    palette: { a: "#6ee0c0", b: "#0d4f42", deep: "#031816" },
    mood: "glass",
  },
  {
    id: "nuestra-pelicula",
    act: "conocerte",
    title: "Nuestra película",
    kicker: "desliza el carrete",
    text: "Si esto fuera una película tendría un ritmo rarísimo. Mucho silencio, mucha pantalla, dos personas hablándose todos los días desde muy lejos. Sería lenta y no pasaría casi nada. Y aun así yo la volvería a ver entera.",
    palette: { a: "#a9c4ff", b: "#1b2a63", deep: "#060b1c" },
    mood: "winter",
  },
  {
    id: "con-mi-letra",
    act: "conocerte",
    title: "Con mi letra",
    kicker: "arrastra y lo escribo",
    text: "Te lo escribo así, despacio y sin borrar, porque quiero que se note que lo estoy pensando mientras lo digo. Si me sale torcido, mejor. Nunca se me ha dado bien decir las cosas bonito a la primera, pero cuando las digo, las digo en serio.",
    palette: { a: "#9fb8ff", b: "#22306b", deep: "#080d1f" },
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
    palette: { a: "#ffcf7a", b: "#6b4408", deep: "#170f02" },
    mood: "amber",
  },
  {
    id: "mi-norte",
    act: "conocerte",
    title: "Mi norte",
    kicker: "tócala, gírala, da igual",
    text: "Puedes darle todas las vueltas que quieras.",
    reveal: "Siempre acaba apuntando al mismo lado.",
    palette: { a: "#ffe08a", b: "#6b5008", deep: "#151102" },
    mood: "amber",
  },
  {
    id: "botella",
    act: "conocerte",
    title: "Carta en una botella",
    kicker: "quítale el corcho",
    text: "Escribo esto sin saber qué día lo vas a leer, y me gusta que sea así. Puede que estés bien, puede que estés cansada, puede que se te haya hecho tarde otra vez. Da igual cuál de las tres. Quería que en algún momento del futuro te llegara algo mío diciéndote que ese día, el que sea, yo también te estaba queriendo. No hace falta que contestes. Sólo quería que llegara.",
    palette: { a: "#6ec5e0", b: "#0d3a52", deep: "#03141d" },
    mood: "winter",
  },
  {
    id: "todo-lo-que-guardo",
    act: "conocerte",
    title: "Todo lo que guardo",
    kicker: "gíralo · toca uno",
    text: "Tengo una carpeta que no le he enseñado a nadie. No es nada del otro mundo: capturas, cosas que dijiste, imágenes que me recordaron a ti sin razón. Ábrela y verás que no hay ningún orden. Es lo más honesto que tengo.",
    palette: { a: "#ff9fbf", b: "#6b1236", deep: "#170610" },
    mood: "cosmos",
  },
  {
    id: "en-voz-baja",
    act: "conocerte",
    title: "En voz baja",
    kicker: "sostén el dedo, no lo sueltes",
    text: "Esto no lo diría fuerte. No porque me dé vergüenza, sino porque hay cosas que se dicen mejor bajito, cuando no las oye nadie más: me haces mucho bien. No sé si te has dado cuenta de cuánto.",
    palette: { a: "#a8f0c0", b: "#0f4a2c", deep: "#03150c" },
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
    text: "No es nada material y ya lo sabías. Dentro hay una promesa chiquita: la próxima vez que tengas un día horrible, avísame aunque no quieras hablar. No tengo que arreglarlo. Sólo quiero estar del otro lado mientras pasa.",
    reveal: "Eso es todo. Es tuyo desde ya.",
    palette: { a: "#ff9ea8", b: "#7a1424", deep: "#19060a" },
    mood: "bloom",
  },
  {
    id: "la-distancia",
    act: "extranarte",
    title: "La distancia",
    kicker: "acércalos con el dedo",
    text: "La distancia no me da miedo. Me da flojera, que es distinto. Es un trámite largo, aburrido y caro que hay que hacer para llegar a lo que de verdad quiero, que es una tarde cualquiera contigo sin nada que hacer.",
    reveal: "Y esto, tarde o temprano, se cierra.",
    palette: { a: "#8fa8ff", b: "#1e2670", deep: "#070a20" },
    mood: "cosmos",
  },
  {
    id: "mi-pulso",
    act: "extranarte",
    title: "Mi pulso",
    kicker: "pon el dedo aquí",
    text: "Si pudiera mandarte esto en vez de un mensaje, te lo mandaría. Es más honesto que cualquier cosa que escriba.",
    reveal: "Se acelera un poco cuando aparece tu nombre. Siempre.",
    palette: { a: "#ff7f9c", b: "#7a1030", deep: "#180510" },
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
    palette: { a: "#b8a8ff", b: "#2a1f6b", deep: "#0a071c" },
    mood: "cosmos",
  },
  {
    id: "postal-segunda",
    act: "extranarte",
    title: "Otra postal",
    kicker: "date la vuelta",
    text: "Aquí son las once y pico y estoy pensando en ti otra vez, que es una noticia poco original. Te la mando igual.",
    reveal: "Lo curioso es que ya no me pesa extrañarte. Me gusta. Significa que hay algo bueno esperando.",
    palette: { a: "#ffb98a", b: "#6b3410", deep: "#170c04" },
    mood: "amber",
  },
  {
    id: "te-lo-digo-bajito",
    act: "extranarte",
    title: "Nada del otro mundo",
    kicker: "acércate",
    text: "No tengo una frase enorme para hoy. Sólo esto: me gusta que existas, y me gusta que existas hoy también.",
    palette: { a: "#f0c8a8", b: "#5e3a1e", deep: "#150d07" },
    mood: "light",
  },
  {
    id: "debajo-de-esto",
    act: "extranarte",
    title: "Debajo de esto",
    kicker: "rasca",
    text: "Hay días en los que no me sale ser cariñoso. No es que no lo sienta; es que se me atora. Si algún día me notas raro, es esto. Debajo siempre está lo mismo.",
    reveal: "Debajo siempre estás tú.",
    palette: { a: "#d0d6e0", b: "#3a4252", deep: "#0d1017" },
    mood: "glass",
  },
  {
    id: "confesion",
    act: "extranarte",
    title: "Una confesión",
    kicker: "se escribe sola · mantén para ir más rápido",
    text: "A veces te leo el mensaje, sé perfectamente qué quiero contestar, y lo dejo ahí diez minutos. No es que no tenga ganas. Es que me quedo pensando en cómo decirlo bien porque contigo me importa decirlo bien. Ya sé que desde fuera parece lo contrario. Te lo cuento para que no se parezca a lo contrario nunca más.",
    palette: { a: "#c0a8ff", b: "#3a2072", deep: "#0e0820" },
    mood: "night",
  },
  {
    id: "sin-adornos",
    act: "extranarte",
    title: "Sin adornos",
    kicker: "inclina el teléfono",
    text: "No eres mi mitad, ni mi todo, ni ninguna de esas cosas que se dicen. Yo estaba entero antes y tú también. Lo que pasa es que desde que estás, todo lo que hago tiene a quién contárselo. Eso me cambió más de lo que parece.",
    palette: { a: "#94e0d0", b: "#0f4a44", deep: "#031614" },
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
    text: "La gente se imagina viajes y fiestas. Yo me imagino una tarde sin nada que hacer, tú haciendo lo tuyo, yo haciendo lo mío, los dos en el mismo cuarto sin hablarnos mucho. Un día vamos a estar aburridos juntos y yo voy a ser insoportablemente feliz.",
    palette: { a: "#ffd08a", b: "#6b4610", deep: "#161005" },
    mood: "amber",
  },
  {
    id: "rompecabezas-dos",
    act: "elegirte",
    title: "Cómo te veo",
    kicker: "descubre la imagen",
    text: "No como alguien perfecto, que sería aburridísimo. Te veo terca cuando tienes razón y también cuando no. Te veo cansada y aun así atenta. Te veo intentándolo. Eso último es lo que más me gusta de ti, y es lo que menos se dice.",
    palette: { a: "#ffa8d0", b: "#6b1247", deep: "#170617" },
    mood: "bloom",
  },
  {
    id: "acariciar",
    act: "elegirte",
    title: "Lo que quiero de ti",
    kicker: "acaricia la pantalla",
    text: "Ni que seas perfecta ni que estés siempre bien. Quiero enterarme cuando no lo estés. Quiero el día flojo, el mensaje mal escrito, el rato en que no tienes ganas de nada. Que la parte fácil ya la tengo, y la fácil no es la que enamora.",
    palette: { a: "#f0a0c8", b: "#5e1240", deep: "#150614" },
    mood: "bloom",
  },
  {
    id: "mejorar",
    act: "elegirte",
    title: "Lo que estoy haciendo",
    kicker: "en presente, no en promesas",
    text: "No te voy a prometer que voy a cambiar, porque las promesas son gratis. Te cuento lo que estoy haciendo: me estoy obligando a decir las cosas cuando pasan y no tres días después. Estoy aprendiendo a preguntar en vez de suponer. Me equivoco seguido y lo vuelvo a intentar al día siguiente. No lo hago para quedar bien. Lo hago porque quiero que estar conmigo te salga fácil.",
    palette: { a: "#8ee0a8", b: "#0f4a2a", deep: "#03150b" },
    mood: "glass",
  },
  {
    id: "cosas-tuyas",
    act: "elegirte",
    title: "Cosas tuyas que me sé de memoria",
    kicker: "muévelas · dales la vuelta",
    text: "Sin proponérmelo, se me quedaron. Y ahora las reconozco en cualquier parte.",
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
    palette: { a: "#ffc0a8", b: "#6b2a18", deep: "#160806" },
    mood: "light",
  },
  {
    id: "no-se-me-pasa",
    act: "elegirte",
    title: "No se me pasa",
    kicker: "desliza el carrete",
    text: "Llevo el tiempo suficiente como para que se me hubiera pasado, si fuera de esas cosas que se pasan. Y no. Cada vez es menos ruido y más certeza, que es exactamente lo contrario de lo que me habían contado.",
    palette: { a: "#ffb0e0", b: "#5e1250", deep: "#150618" },
    mood: "cosmos",
  },
  {
    id: "gracias",
    act: "elegirte",
    title: "Gracias por quedarte",
    kicker: "esto sí es serio",
    text: "Por los días en que no fui fácil. Por esperar sin echármelo en cara. Por no irte cuando tenías todo el derecho de hacerlo. No sé si te lo he dicho con estas palabras, así que aquí quedan escritas: gracias por quedarte.",
    palette: { a: "#ffd0b0", b: "#6b3a20", deep: "#160c06" },
    mood: "amber",
  },
  {
    id: "ultimo-secreto",
    act: "elegirte",
    title: "El último escondido",
    kicker: "sostén el dedo",
    text: "Te reservé una para el final, porque es la que más me cuesta decir de frente y la que más en serio va.",
    reveal: "No te quiero para pasar el rato. Te quiero para lo lento: para los años, los lunes y las cosas aburridas.",
    palette: { a: "#ff9ec0", b: "#6b0f38", deep: "#170512" },
    mood: "bloom",
  },
  {
    id: "te-elijo",
    act: "elegirte",
    title: "Te elijo",
    kicker: "y mañana otra vez",
    text: "No porque me falte nada. No porque no haya más gente en el mundo. Te elijo despierto, sabiendo lo que cuesta, sabiendo que estás lejos y que hay días difíciles. Te elegí, te elijo y pienso seguir eligiéndote, que es lo único que de verdad depende de mí.",
    palette: { a: "#ffa8c0", b: "#7a1440", deep: "#1a0713" },
    mood: "bloom",
  },
];

/** Acceso por id, para que el manifiesto no dependa del orden del array. */
export const chapterById = Object.fromEntries(chapters.map((c) => [c.id, c]));

/**
 * Registra los capítulos de las páginas que él añade en `mis-paginas/`.
 * Se llama al arrancar, antes de construir nada.
 */
export function registerCustomChapters(list, act) {
  if (!list?.length) return;
  for (const chapter of list) {
    chapters.push(chapter);
    chapterById[chapter.id] = chapter;
  }
  if (act && !actById[act.id]) {
    acts.push(act);
    actById[act.id] = act;
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
  lines: ["Hasta aquí", "por ahora."],
  body: "Este librito se queda contigo. Vuelve cuando quieras, ábrelo en la página que quieras, y si un día te hace falta que alguien te diga algo bonito, ya sabes dónde estoy.",
  sign: "Te quiero, Marissa 🤍",
};
