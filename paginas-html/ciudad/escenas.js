/*
 * LAS ESCENAS DE LAS VENTANAS — las mismas 83 de «Enciende las luces».
 * Cada una se pinta en un canvas 2D (w × h, t = segundos); la ciudad 3D
 * las usa para las ventanas que se prenden y para la tarjeta de cerca.
 */
let g = null;
const TAU = Math.PI * 2;
const azar = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const elegir = (l) => l[Math.floor(Math.random() * l.length)];
let ac = null, salida = null, nota = null, voz = null, ruido = null;

export const ESCENAS = [
  { id: "rgb", dice: ["Mira, amor, esa tiene luces RGB. Seguro es gamer :>", "Otra vez las lucecitas de colores… ya parece antro jajaja"] },
  { id: "fiesta", dice: ["¡Uy, en esa tienen fiestota! ¿Nos colamos? :>", "Siguen de fiesta… y ni nos invitaron, qué groseros 😤"] },
  { id: "grito", grita: "¡AAAAH!", dice: ["¿Escuchaste, amor? ¡Está loco! 😳", "Otra vez gritó… ya no le prendas jajaja"] },
  { id: "saluda", dice: ["Nos está saludando, ush, no saludes, me da celos.", "Otra vez saludando… ya, señor, ella es mi novia 😤"] },
  { id: "gato", dice: ["Mira, un gatito. Nos está viendo, aww 🥹", "El michi sigue ahí, juzgándonos :>"] },
  { id: "baile", dice: ["Esos dos bailan lentito… así te voy a sacar a bailar, eh 🤍", "Siguen bailando, aww 🥹 Me debes un baile, ¿eh?"] },
  { id: "cocina", dice: ["Alguien cocinando a esta hora. Huele rico… ¿te preparo algo, amor? :>", "Sigue cocinando. Ya me dio hambre jajaja"] },
  { id: "tele", dice: ["Ese se quedó dormido viendo la tele, pobrecito jajaja", "Ni se enteró de que lo prendimos :>"] },
  { id: "plantas", dice: ["Cuántas plantitas. Tú serías la flor más bonita de todas 🌷", "Qué verde está todo ahí, aww 🌿"] },
  { id: "lee", dice: ["Alguien leyendo con su lamparita. Qué paz, ¿verdad? 🤍", "Sigue leyendo… ha de estar bien bueno ese libro :>"] },
  { id: "perro", grita: "¡Guau!", dice: ["¡Un perrito! Nos ladró 🥹", "Otra vez nos ladró… ya lo hicimos enojar jajaja"] },
  { id: "sombras", dice: ["Está haciendo sombras con las manos… ¡es un pajarito! :>", "Ahora el pajarito aletea, aww 🕊️"] },
  { id: "guitarra", dice: ["Alguien toca la guitarra. Imagínate que es una serenata para ti 🎶🤍", "Otra canción… esta te la dedico yo :>"] },
  { id: "navidad", dice: ["Esa tiene lucecitas de navidad todo el año. Me cae bien :>", "Navidad en cualquier mes, así me siento contigo 🎄🤍"] },
  { id: "cortina", dice: ["Uy, cerró la cortina. Nos vio jajaja 🙈", "¡Otra vez nos cachó! 🙈"] },
  { id: "telescopio", dice: ["Ese ve las estrellas con telescopio. Yo prefiero verte a ti 🤍", "Busca estrellas y la más bonita está aquí conmigo :>"] },
  { id: "ejercicio", dice: ["Alguien haciendo ejercicio a medianoche… ¿quién hace eso? 😂", "Sigue y sigue… me cansé nomás de verlo jajaja"] },
  { id: "pastel", dice: ["¡Están festejando un cumpleaños! Feliz cumple, desconocido 🎂", "Ya partieron el pastel… ¿nos guardarán una rebanada? :>"] },
  { id: "pecera", dice: ["Una pecera. Qué bonita luz da, aww 🐟", "Los pescaditos nadan en círculos, como yo pensando en ti :>"] },
  { id: "pintor", dice: ["Alguien pinta un cuadro… le salió un corazón. También está enamorado :>", "Otro corazón. Yo te pintaría a ti, pero no me saldría tan bonita 🥹"] },
  { id: "telefono", dice: ["Alguien habla por teléfono, como yo contigo 🥹📱", "Sigue en la llamada… ojalá fuera la nuestra 🤍"] },
  { id: "corazon", dice: ["Alguien dibujó un corazón en el vidrio, aww 🥹🤍", "Ese corazón es para ti, que conste :>"] },
  { id: "brinca", dice: ["Un niño brincando en la cama. ¡Ya duérmete, chamaco! 😂", "Sigue brincando… mañana no se levanta jajaja"] },
  { id: "burbujas", dice: ["Están haciendo burbujas de jabón. Qué bonito :>", "Más burbujitas, aww 🫧"] },
  { id: "videollamada", dice: ["Una videollamada. Así nos vemos tú y yo, a la distancia 🥹🤍", "Se mandan corazones… como nosotros, aww 🥹"] },
  { id: "karaoke", grita: "♪ ¡Laaa laaa! ♪", dice: ["Está cantando karaoke… y bien desafinado jajaja", "Tú cantas más bonito, eh :>"] },
  { id: "fantasma", dice: ["¿Viste eso? Dime que tú también lo viste… 👻", "Amor, ya no prendas esa, me da miedito 😳"] },
  { id: "ojos", dice: ["Esa prendió… pero no hay nadie. Solo dos ojitos 👀", "Siguen ahí los ojitos… agárrame la mano 😬"] },
  { id: "lampara", dice: ["Esa luz parpadea sola. Mejor sigamos, ¿no? 😬", "Otra vez parpadea… no me gusta nada jajaja"] },
  { id: "abuelitos", dice: ["Unos abuelitos tomados de la mano. Así quiero que lleguemos tú y yo 🥹🤍", "Siguen agarraditos, aww 🥹 Así, siempre."] },
  { id: "bebe", dice: ["Shhh, ahí hay un bebé dormido. Aww 🥹", "Shhh… que no se despierte :>"] },
  { id: "videojuegos", dice: ["Ese está jugando videojuegos. Seguro va perdiendo jajaja 🎮", "Ya perdió otra vez, se nota en su cara 😂"] },
  { id: "tiktok", dice: ["Ese está grabando un TikTok… ¿y si grabamos uno juntos? :>", "Le salió otro bailecito, y tú lo harías más bonito 🤍"] },
  { id: "carta", dice: ["Alguien escribiendo una carta. Seguro está enamorado, como yo de ti 💌", "Sigue escribiendo… yo te escribiría mil :>"] },
  { id: "disco", dice: ["¡Una bola disco! Ahí sí saben 🪩", "Siguen bailando… ¿nos animamos? :>"] },
  { id: "canario", grita: "¡Pío, pío!", dice: ["Un pajarito cantando a medianoche. Te está cantando a ti :>", "Otra vez cantó, aww 🐤"] },
  { id: "tejiendo", dice: ["Una abuelita tejiendo una bufanda. Qué ternura 🧶", "La bufanda ya va más larga, aww 🥹"] },
  { id: "yoga", dice: ["Alguien haciendo yoga. Namasté 🧘", "Qué flexible… yo me quiebro jajaja"] },
  { id: "cafe", dice: ["Alguien tomando cafecito a esta hora. No va a dormir jajaja ☕", "Otro cafecito… ese ya no duerme 😂"] },
  { id: "estrellitas", dice: ["Tiene estrellitas que brillan en el techo, aww ✨", "Como las que te bajaría si pudiera :>"] },
  { id: "trompeta", grita: "♪ ¡Tururú! ♪", dice: ["¡Uno practicando la trompeta! ¿A esta hora? 😂", "Pobres vecinos jajaja"] },
  { id: "pizza", dice: ["Alguien comiendo pizza a medianoche. Se me antojó… ¿compartimos? 🍕", "Otra rebanada. Ese sí sabe vivir :>"] },
  { id: "almohadas", grita: "¡Toma!", dice: ["¡Guerra de almohadas! Yo te ganaría, eh :>", "Hay plumas por todos lados jajaja"] },
  { id: "mariachi", grita: "♪ ¡Ay, ay, ay, ay! ♪", dice: ["¡Un mariachi en la sala! Esa serenata es para ti 🤍", "Otra canción… ¡cántale, mariachi! :>"] },
  { id: "pinata", grita: "¡Dale, dale, dale!", dice: ["¡Rompieron la piñata! Ahí van los dulces 🪅", "Otra piñata… yo me agarro los dulces jajaja"] },
  { id: "luchador", dice: ["Un luchador entrenando con máscara y todo 😂 Yo igual te defiendo, eh.", "Sigue sacando músculo jajaja"] },
  { id: "trastes", dice: ["Alguien lavando trastes a medianoche. Qué responsable :>", "Ojalá yo fuera así de juicioso jajaja"] },
  { id: "planchando", dice: ["Alguien planchando a esta hora… ¿quién plancha de noche? 😂", "Sigue planchando. Mañana va bien guapo :>"] },
  { id: "ronca", grita: "¡Zzzrrr!", dice: ["¡Cómo ronca! Hasta acá se escucha jajaja", "Otra vez… parece motor 😂"] },
  { id: "beso", dice: ["Uy, se están besando 🙈 …me debes uno, eh :>", "Siguen de románticos, aww 🥹🤍"] },
  { id: "espejo", dice: ["Alguien arreglándose frente al espejo. Tú ni lo necesitas, ya eres hermosa 🤍", "Sigue arreglándose… tú así como estás, perfecta :>"] },
  { id: "gatocaja", dice: ["Un gatito metido en una caja. Lo más lindo que he visto hoy… después de ti :>", "Se volvió a esconder, aww 🥹"] },
  { id: "hamster", dice: ["Un hámster corriendo en su ruedita. Así corro yo para verte 🥹", "No se cansa, aww 🐹"] },
  { id: "loro", grita: "¡Te amo! ¡Te amo!", dice: ["¡Ese loro dice «te amo»! Seguro se lo enseñé yo :>", "Lo volvió a decir… tiene razón 🤍"] },
  { id: "miedo", grita: "¡AAAH!", dice: ["Están viendo película de miedo… yo te abrazaría fuerte 🙈", "¡Otro susto! Ven, aquí conmigo 🤍"] },
  { id: "palomitas", dice: ["Palomitas y peli. Plan perfecto contigo 🍿🤍", "Siguen saltando las palomitas :>"] },
  { id: "pijamada", dice: ["Una pijamada con mascarillas… ¿esas son rodajas de pepino? jajaja", "Qué relajados se ven, aww 🥒"] },
  { id: "robot", dice: ["¡Un robotito caminando solo! ¿Quién lo prendió? 🤖", "Sigue caminando… ya tiene vida propia jajaja"] },
  { id: "mago", dice: ["Un mago sacó un conejo del sombrero. Yo nomás sé sacarte sonrisas :>", "¡Otra vez el conejito! 🐰"] },
  { id: "malabares", dice: ["Alguien haciendo malabares. Yo con tres pelotas ya me pego jajaja", "No se le cae ninguna, qué pro :>"] },
  { id: "globos", dice: ["Un cuarto lleno de globos, aww 🎈", "Alguien va a tener una sorpresa bonita :>"] },
  { id: "dj", dice: ["Un DJ practicando… se cree de festival jajaja 🎧", "Subió el volumen, ya se prendió 😂"] },
  { id: "bateria", grita: "¡Pum, pum, tsss!", dice: ["¡Uno tocando la batería! Los vecinos lo odian 😂", "Otra vez… ya, señor, son las 3 de la mañana jajaja"] },
  { id: "violin", dice: ["Alguien tocando el violín bien bonito. Se siente como película 🎻🤍", "Esa canción suena a ti :>"] },
  { id: "piano", dice: ["Alguien toca el piano. Si yo supiera, te tocaría una canción :>", "Qué bonito toca, aww 🥹🎹"] },
  { id: "kdrama", dice: ["Mira… como nosotros próximamente 🤍", "Siguen con su K-drama, bien acurrucaditos… así vamos a estar tú y yo 🥹", "Ya lloró ella con el drama jajaja, igualita a ti 🤍"] },
  { id: "dino", grita: "¡Rawr!", dice: ["¿Eso es… un dinosaurio bailando? JAJAJA 🦖", "Sigue bailando el dino, no puedo 😂"] },
  { id: "alien", dice: ["Amor… ese no es de aquí 👽 Y también nos saluda.", "Sigue saludando el alien… ush, a ese sí le perdono :>"] },
  { id: "bruja", dice: ["¿Una bruja en escoba? Ya me dio miedito… agárrame la mano 🧹", "¡Pasó otra vez! 😳"] },
  { id: "sombra", dice: ["Esa sombra no se mueve… ni parpadea. Siguiente ventana, por favor 😬", "Sigue ahí… parada. No me gusta jajaja"] },
  { id: "cuadro", dice: ["Ese cuadro nos sigue con los ojos… ¿o nomás yo lo veo? 👀", "Ya, ya, no nos veas así 😳"] },
  { id: "oso", dice: ["Un osote de peluche gigante. Te mereces uno así, pero más grande 🧸🤍", "El osito te manda un abrazo :>"] },
  { id: "rosas", dice: ["Un ramo de rosas en la mesa. Algún día te voy a llenar la casa de flores 🌹", "Se cayó un pétalo, aww 🥹"] },
  { id: "pandulce", dice: ["Alguien cenando pan dulce con cafecito. Conchita de vainilla, seguro :>", "Ya se va a acabar la concha jajaja"] },
  { id: "tacos", dice: ["¡Están cenando tacos! Ahora sí tengo hambre 🌮", "Otro tacote… ¿con todo? :>"] },
  { id: "loteria", grita: "¡Lotería!", dice: ["¡Están jugando lotería! Y ya ganó uno jajaja", "¡Otra vez! Ese hace trampa 😂"] },
  { id: "gol", grita: "¡GOOOL!", dice: ["¡Metieron gol! Ese grito se escuchó hasta tu casa 😂", "¡Otro gol! Qué emoción jajaja"] },
  { id: "gatocompu", dice: ["Un gatito caminando sobre la compu… ahí va el trabajo de alguien jajaja", "Ya escribió «asdfgh», qué inteligente :>"] },
  { id: "mudanza", dice: ["Puras cajas… alguien se está mudando. Algún día nosotros también, juntitos 🥹🏠", "Una caja tiene un corazón, aww 🤍"] },
  { id: "calendario", dice: ["Alguien tachando días en su calendario. Como yo, contando los días para verte 🥹🤍", "Ya falta menos :>"] },
  { id: "avioncito", dice: ["Aventó un avioncito de papel. Si llegara hasta tu casa, te mandaba uno 🤍", "Otro avioncito… este sí llega :>"] },
  { id: "foco", dice: ["A ese se le prendió el foco 💡 Literal jajaja", "Otra idea… ¿será buena? :>"] },
  { id: "aspiradora", dice: ["Un gato montado en la aspiradora robot. Qué nivel 😂", "Ahí va otra vuelta, de lo más tranquilo jajaja"] },
];
/* Lo que dice cada vez que se prende: la primera frase, luego la otra, y
   así, dando vueltas. */
export const linea = (x, vez) => (Array.isArray(x) ? x[(Math.max(1, vez) - 1) % x.length] : x);
export const FINAL = "Mira, amor, despertaste a toda la ciudad 🥹🤍";

function persona(x, y, s, col = "#1a1020", brazo = 0) {
  g.fillStyle = col;
  g.beginPath(); g.arc(x, y - s * 0.95, s * 0.22, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(x - s * 0.3, y); g.quadraticCurveTo(x - s * 0.32, y - s * 0.7, x, y - s * 0.72); g.quadraticCurveTo(x + s * 0.32, y - s * 0.7, x + s * 0.3, y); g.fill();
  if (brazo) { g.strokeStyle = col; g.lineWidth = s * 0.1; g.lineCap = "round"; g.beginPath(); g.moveTo(x + s * 0.2, y - s * 0.6); g.lineTo(x + s * 0.2 + Math.cos(brazo) * s * 0.45, y - s * 0.6 - Math.sin(brazo) * s * 0.45); g.stroke(); }
}
function corazonEn(x, y, r) {
  g.beginPath();
  g.moveTo(x, y + r * 0.8);
  g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.55, y - r * 1.05, x, y - r * 0.35);
  g.bezierCurveTo(x + r * 0.55, y - r * 1.05, x + r * 1.4, y - r * 0.1, x, y + r * 0.8);
}
/* Lo mismo que se dibuje dentro, pero visto en el espejo alrededor de `x`:
   el segundo de una pareja, o el otro brazo de alguien. */
function reflejado(x, dibujar) { g.save(); g.translate(x * 2, 0); g.scale(-1, 1); dibujar(); g.restore(); }
const fondoCalido = (w, h, c = "#ffd89a") => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c); gr.addColorStop(1, "#e8a860"); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
const letra = (tx, x, y, tam, col) => { g.fillStyle = col; g.font = `${tam}px serif`; g.fillText(tx, x, y); };
const DIBUJOS = {
  rgb(w, h, t) {
    const hue = (t * 120) % 360;
    g.fillStyle = `hsl(${hue},90%,55%)`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.fillStyle = `hsl(${(hue + i * 60) % 360},100%,65%)`; g.fillRect(i * w / 6, 0, w / 6, h * 0.08); }
    g.fillStyle = "#0a0a14"; g.fillRect(w * 0.2, h * 0.55, w * 0.6, h * 0.25);
    g.fillStyle = `hsl(${(hue + 180) % 360},100%,60%)`; g.fillRect(w * 0.25, h * 0.6, w * 0.5, h * 0.12);
  },
  fiesta(w, h, t) {
    const c = ["#ff2d7a", "#2de2ff", "#ffe02d", "#8a2dff", "#2dff8a"];
    g.fillStyle = c[Math.floor(t * 8) % c.length]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.fillStyle = Math.sin(t * 20 + i * 2) > 0.3 ? "#fff" : c[i % 5]; g.beginPath(); g.arc((i + 0.5) * w / 9, h * 0.1, 2, 0, TAU); g.fill(); }
    for (let i = 0; i < 3; i++) persona(w * (0.25 + i * 0.25), h - Math.abs(Math.sin(t * 9 + i)) * h * 0.1, h * 0.5, "rgba(20,5,30,.9)", Math.sin(t * 9 + i) + 1.5);
  },
  grito(w, h, t) {
    fondoCalido(w, h, "#ffcf85");
    const sale = clamp(t < 1.6 ? Math.sin(Math.min(1, t / 0.4) * Math.PI / 2) : 1 - (t - 1.6) / 0.6, 0, 1);
    persona(w / 2, h + h * 0.1 - sale * h * 0.2, h * (0.6 + sale * 0.35), "#2a1422");
    if (sale > 0.5) { g.fillStyle = "#2a1422"; g.beginPath(); g.ellipse(w / 2, h * 0.45 - sale * h * 0.1, w * 0.06, h * 0.08, 0, 0, TAU); g.fill(); }
  },
  gato(w, h, t) {
    fondoCalido(w, h);
    g.fillStyle = "#231820";
    g.beginPath(); g.ellipse(w * 0.5, h * 0.84, w * 0.24, h * 0.12, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(w * 0.62, h * 0.66, w * 0.12, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(w * 0.53, h * 0.6); g.lineTo(w * 0.56, h * 0.48); g.lineTo(w * 0.61, h * 0.57); g.fill();
    g.beginPath(); g.moveTo(w * 0.65, h * 0.57); g.lineTo(w * 0.7, h * 0.48); g.lineTo(w * 0.72, h * 0.6); g.fill();
    g.strokeStyle = "#231820"; g.lineWidth = w * 0.05; g.lineCap = "round";
    g.beginPath(); g.moveTo(w * 0.28, h * 0.84); g.quadraticCurveTo(w * 0.12, h * (0.7 + Math.sin(t * 3) * 0.1), w * 0.2, h * 0.52); g.stroke();
    const parpadea = Math.sin(t * 1.7) > 0.95 ? 0.2 : 1;
    g.fillStyle = "#9cff7a"; g.beginPath(); g.ellipse(w * 0.58, h * 0.66, 2, 2 * parpadea, 0, 0, TAU); g.ellipse(w * 0.66, h * 0.66, 2, 2 * parpadea, 0, 0, TAU); g.fill();
  },
  saluda(w, h, t) {
    fondoCalido(w, h, "#ffe0a8");
    persona(w * 0.45, h * 1.02, h * 0.75, "#2a1a30", 1.3 + Math.sin(t * 10) * 0.5);
  },
  baile(w, h, t) {
    fondoCalido(w, h, "#ffb4a0");
    const a = Math.sin(t * 1.5) * w * 0.06;
    persona(w * 0.4 + a, h, h * 0.7, "#3a1020");
    persona(w * 0.58 + a, h, h * 0.62, "#3a1020");
    if (Math.sin(t * 1.5) > 0.9) { g.fillStyle = "#ff5a8a"; corazonEn(w * 0.5 + a, h * 0.2, w * 0.08); g.fill(); }
  },
  cocina(w, h, t) {
    fondoCalido(w, h, "#fff0c0");
    persona(w * 0.35, h, h * 0.65, "#2a2020", 0.3);
    g.fillStyle = "#333"; g.fillRect(w * 0.55, h * 0.72, w * 0.35, h * 0.06);
    for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; g.fillStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; g.beginPath(); g.arc(w * 0.72 + Math.sin(k * 6 + i) * 4, h * 0.7 - k * h * 0.5, 3 + k * 4, 0, TAU); g.fill(); }
  },
  tele(w, h, t) {
    const b = 0.5 + 0.5 * Math.sin(t * 13) * Math.sin(t * 7);
    g.fillStyle = `rgb(${60 + b * 40},${90 + b * 60},${170 + b * 60})`; g.fillRect(0, 0, w, h);
    g.fillStyle = "#101428"; g.fillRect(w * 0.1, h * 0.6, w * 0.8, h * 0.4);
    persona(w * 0.5, h * 1.05, h * 0.5, "#0c0e1e");
    letra("z", w * 0.62, h * (0.4 - (t % 2) * 0.1), h * 0.18, "#fff");
  },
  plantas(w, h, t) {
    fondoCalido(w, h, "#ffe6b0");
    for (let i = 0; i < 3; i++) {
      const x = w * (0.2 + i * 0.3);
      g.fillStyle = "#b0603a"; g.fillRect(x - w * 0.08, h * 0.8, w * 0.16, h * 0.2);
      g.strokeStyle = "#2f7a3a"; g.lineWidth = 2;
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x, h * 0.8); g.quadraticCurveTo(x + (k - 1.5) * w * 0.06, h * 0.6, x + (k - 1.5) * w * 0.08 + Math.sin(t * 2 + k) * 2, h * (0.45 + (k % 2) * 0.08)); g.stroke(); }
    }
  },
  lee(w, h) {
    g.fillStyle = "#3a2a3a"; g.fillRect(0, 0, w, h);
    const lz = g.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, w * 0.8);
    lz.addColorStop(0, "#ffe6a8"); lz.addColorStop(1, "rgba(255,230,168,0)");
    g.fillStyle = lz; g.fillRect(0, 0, w, h);
    persona(w * 0.55, h, h * 0.6, "#241624");
    g.fillStyle = "#fff8e8"; g.fillRect(w * 0.6, h * 0.62, w * 0.2, h * 0.12);
  },
  perro(w, h, t) {
    fondoCalido(w, h, "#ffdca0");
    const salto = Math.max(0, Math.sin(t * 6)) * h * 0.05 * (t < 2 ? 1 : 0.2);
    g.fillStyle = "#6a3a1a";
    g.beginPath(); g.ellipse(w * 0.45, h * 0.82 - salto, w * 0.22, h * 0.12, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(w * 0.66, h * 0.66 - salto, w * 0.12, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(w * 0.6, h * 0.66 - salto, w * 0.04, h * 0.1, 0.4, 0, TAU); g.fill();
    g.strokeStyle = "#6a3a1a"; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.24, h * 0.8 - salto); g.lineTo(w * 0.14, h * (0.66 + Math.sin(t * 20) * 0.05) - salto); g.stroke();
  },
  sombras(w, h, t) {
    g.fillStyle = "#fff0d0"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#2a1a1a";
    const al = Math.sin(t * 5) * 0.4;
    g.beginPath(); g.ellipse(w * 0.5, h * 0.55, w * 0.1, h * 0.08, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(w * 0.45, h * 0.52); g.quadraticCurveTo(w * 0.2, h * (0.3 - al * 0.3), w * 0.12, h * (0.4 - al * 0.2)); g.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.45, h * 0.58); g.fill();
    g.beginPath(); g.moveTo(w * 0.55, h * 0.52); g.quadraticCurveTo(w * 0.8, h * (0.3 - al * 0.3), w * 0.88, h * (0.4 - al * 0.2)); g.quadraticCurveTo(w * 0.7, h * 0.55, w * 0.55, h * 0.58); g.fill();
  },
  guitarra(w, h, t) {
    fondoCalido(w, h, "#f0c890");
    persona(w * 0.45, h, h * 0.68, "#2a1a1a");
    g.fillStyle = "#8a4a1a"; g.beginPath(); g.ellipse(w * 0.55, h * 0.78, w * 0.12, h * 0.08, -0.4, 0, TAU); g.fill();
    g.fillStyle = "#3a2010"; g.save(); g.translate(w * 0.55, h * 0.78); g.rotate(-0.4); g.fillRect(0, -2, w * 0.35, 4); g.restore();
    letra("♪", w * 0.7, h * (0.4 - (t * 0.3) % 0.3), h * 0.2, "#5a2a1a");
  },
  navidad(w, h, t) {
    g.fillStyle = "#3a2030"; g.fillRect(0, 0, w, h);
    const c = ["#ff4a4a", "#ffd24a", "#4aff7a", "#4ab4ff"];
    for (let i = 0; i < 10; i++) {
      const x = (i + 0.5) / 10 * w, y = h * 0.15 + Math.sin(i / 9 * Math.PI) * h * 0.15;
      const on = Math.sin(t * 3 + i * 1.3) > 0;
      g.fillStyle = on ? c[i % 4] : "#40303a";
      g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill();
      if (on) { g.fillStyle = c[i % 4] + "44"; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); }
    }
    g.fillStyle = "#1e5a2a"; g.beginPath(); g.moveTo(w * 0.5, h * 0.35); g.lineTo(w * 0.72, h * 0.95); g.lineTo(w * 0.28, h * 0.95); g.fill();
    g.fillStyle = "#ffd24a"; g.beginPath(); g.arc(w * 0.5, h * 0.35, 3, 0, TAU); g.fill();
  },
  cortina(w, h, t) {
    fondoCalido(w, h, "#ffe0a0");
    persona(w * 0.5, h, h * 0.7, "#2a1a28");
    const c = clamp((t - 0.7) / 0.6, 0, 1);
    g.fillStyle = "#b8405a";
    g.fillRect(0, 0, w * 0.5 * c, h); g.fillRect(w - w * 0.5 * c, 0, w * 0.5 * c, h);
    g.fillStyle = "rgba(0,0,0,.2)"; for (let i = 0; i < 6; i++) g.fillRect(i * w / 12 * c, 0, 1.5, h);
  },
  telescopio(w, h, t) {
    g.fillStyle = "#2a3050"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffe4a0"; g.fillRect(0, h * 0.85, w, h * 0.15);
    persona(w * 0.35, h, h * 0.62, "#101020");
    g.save(); g.translate(w * 0.45, h * 0.55); g.rotate(-0.7 + Math.sin(t * 0.5) * 0.1);
    g.fillStyle = "#c8ccd8"; g.fillRect(0, -3, w * 0.45, 6); g.restore();
  },
  ejercicio(w, h, t) {
    g.fillStyle = "#e8f0ff"; g.fillRect(0, 0, w, h);
    const s = Math.abs(Math.sin(t * 5));
    persona(w * 0.5, h - s * h * 0.12, h * 0.62, "#20243a", 1.2 + s);
  },
  pastel(w, h, t) {
    fondoCalido(w, h, "#ffcf90");
    persona(w * 0.22, h, h * 0.55, "#3a2030"); persona(w * 0.8, h, h * 0.5, "#3a2030");
    g.fillStyle = "#fff4f0"; g.fillRect(w * 0.35, h * 0.68, w * 0.3, h * 0.2);
    g.fillStyle = "#ff8fb0"; g.fillRect(w * 0.35, h * 0.68, w * 0.3, h * 0.05);
    for (let i = 0; i < 3; i++) { const x = w * (0.42 + i * 0.08); g.fillStyle = "#fff"; g.fillRect(x - 1, h * 0.6, 2, h * 0.08); g.fillStyle = "#ffcc33"; g.beginPath(); g.ellipse(x, h * 0.58 + Math.sin(t * 12 + i) * 1, 2, 3.5, 0, 0, TAU); g.fill(); }
  },
  pecera(w, h, t) {
    g.fillStyle = "#1a2a48"; g.fillRect(0, 0, w, h);
    const agua = g.createLinearGradient(0, h * 0.35, 0, h);
    agua.addColorStop(0, "#3aa8ff"); agua.addColorStop(1, "#1a5aa8");
    g.fillStyle = agua; g.fillRect(w * 0.15, h * 0.4, w * 0.7, h * 0.5);
    for (let i = 0; i < 3; i++) { const x = w * (0.3 + ((t * 0.15 + i * 0.3) % 0.5)), y = h * (0.55 + i * 0.1); g.fillStyle = ["#ff8a2a", "#ffd02a", "#ff5a8a"][i]; g.beginPath(); g.ellipse(x, y, 5, 3, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x - 9, y - 3); g.lineTo(x - 9, y + 3); g.fill(); }
    g.fillStyle = "rgba(255,255,255,.6)"; for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; g.beginPath(); g.arc(w * 0.7, h * 0.88 - k * h * 0.45, 1.5, 0, TAU); g.fill(); }
  },
  pintor(w, h, t) {
    g.fillStyle = "#fff4e0"; g.fillRect(0, 0, w, h);
    persona(w * 0.3, h, h * 0.62, "#2a1a24", 0.2 + Math.sin(t * 4) * 0.3);
    g.fillStyle = "#fff"; g.fillRect(w * 0.55, h * 0.4, w * 0.32, h * 0.38);
    g.strokeStyle = "#8a5a3a"; g.lineWidth = 1.5; g.strokeRect(w * 0.55, h * 0.4, w * 0.32, h * 0.38);
    const k = Math.min(1, t / 3);
    g.fillStyle = "#ff8fa0"; corazonEn(w * 0.71, h * 0.58, w * 0.07 * k); g.fill();
  },
  telefono(w, h, t) {
    fondoCalido(w, h, "#ffd8b0");
    const x = w * (0.3 + (Math.sin(t * 0.8) + 1) * 0.2);
    persona(x, h, h * 0.66, "#2a1a28");
    g.fillStyle = "#e8f4ff"; g.fillRect(x + h * 0.08, h * 0.32, 4, 8);
  },
  corazon(w, h, t) {
    g.fillStyle = "#c8b4d8"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, 0, w, h);
    const k = Math.min(1, t / 1.4);
    g.strokeStyle = "#ffc0d0"; g.lineWidth = 3; g.lineCap = "round";
    g.setLineDash([k * 200, 400]); corazonEn(w * 0.5, h * 0.5, w * 0.22); g.stroke(); g.setLineDash([]);
  },
  brinca(w, h, t) {
    fondoCalido(w, h, "#ffe4b0");
    g.fillStyle = "#6a8aff"; g.fillRect(w * 0.1, h * 0.85, w * 0.8, h * 0.15);
    const s = Math.abs(Math.sin(t * 5));
    persona(w * 0.5, h * 0.88 - s * h * 0.3, h * 0.42, "#2a1a28", 1.5 + s);
  },
  burbujas(w, h, t) {
    g.fillStyle = "#fff0d8"; g.fillRect(0, 0, w, h);
    persona(w * 0.3, h, h * 0.6, "#2a1a28", 0.8);
    for (let i = 0; i < 5; i++) { const k = (t * 0.5 + i / 5) % 1; g.strokeStyle = `rgba(120,160,255,${0.8 * (1 - k)})`; g.lineWidth = 1.2; g.beginPath(); g.arc(w * (0.45 + k * 0.45), h * (0.5 - Math.sin(k * 3 + i) * 0.2), 3 + i % 3 * 2, 0, TAU); g.stroke(); }
  },
  videollamada(w, h, t) {
    g.fillStyle = "#2a2440"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#6fa8ff"; g.fillRect(w * 0.2, h * 0.35, w * 0.6, h * 0.36);
    persona(w * 0.5, h * 0.71, h * 0.28, "#ffe0c8");
    g.fillStyle = "#1a1a28"; g.fillRect(w * 0.15, h * 0.71, w * 0.7, h * 0.05);
    persona(w * 0.5, h * 1.05, h * 0.42, "#15101e");
    if (Math.sin(t * 2) > 0.6) { g.fillStyle = "#ff6f9a"; corazonEn(w * 0.7, h * 0.3 - (t % 1) * h * 0.1, w * 0.06); g.fill(); }
  },
  karaoke(w, h, t) {
    g.fillStyle = `hsl(${280 + Math.sin(t * 3) * 30},70%,45%)`; g.fillRect(0, 0, w, h);
    persona(w * 0.5, h, h * 0.7, "#1a0c20", 1.9);
    g.fillStyle = "#ccc"; g.fillRect(w * 0.64, h * 0.3, 3, 8);
    letra("♫", w * (0.15 + Math.sin(t * 5) * 0.05), h * 0.35, h * 0.22, "#ffe0ff");
  },
  fantasma(w, h, t) {
    g.fillStyle = "#1a2030"; g.fillRect(0, 0, w, h);
    const sale = clamp(Math.sin(clamp(t / 2.2, 0, 1) * Math.PI), 0, 1);
    const a0 = g.globalAlpha;
    g.globalAlpha = a0 * sale;
    g.fillStyle = "#eef4ff";
    const x = w * (0.2 + t * 0.12), y = h * 0.62;
    g.beginPath(); g.arc(x, y - h * 0.18, w * 0.16, Math.PI, 0);
    g.lineTo(x + w * 0.16, y + h * 0.1);
    for (let k = 0; k < 4; k++) g.lineTo(x + w * 0.16 - (k + 0.5) * w * 0.08, y + h * (k % 2 ? 0.1 : 0.04));
    g.lineTo(x - w * 0.16, y + h * 0.1); g.fill();
    g.fillStyle = "#101020"; g.beginPath(); g.arc(x - w * 0.05, y - h * 0.2, 2, 0, TAU); g.arc(x + w * 0.05, y - h * 0.2, 2, 0, TAU); g.fill();
    g.globalAlpha = a0;
  },
  ojos(w, h, t) {
    g.fillStyle = "#0a0c18"; g.fillRect(0, 0, w, h);
    const parp = (t % 2.4) > 2.25 ? 0.15 : 1;
    const x = w * 0.5 + Math.sin(t * 0.6) * w * 0.1;
    g.fillStyle = "#ffe36a";
    g.beginPath(); g.ellipse(x - w * 0.1, h * 0.5, 2.5, 3 * parp, 0, 0, TAU); g.ellipse(x + w * 0.1, h * 0.5, 2.5, 3 * parp, 0, 0, TAU); g.fill();
  },
  lampara(w, h, t) {
    const on = Math.sin(t * 23) * Math.sin(t * 7.3) > -0.2 && !(t % 1.7 > 1.5);
    fondoCalido(w, h, on ? "#ffe6b0" : "#3a2a20");
    if (!on) { g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(0, 0, w, h); }
    g.fillStyle = "#222"; g.fillRect(w * 0.49, 0, 2, h * 0.3);
    g.fillStyle = on ? "#fff8d0" : "#555"; g.beginPath(); g.arc(w * 0.5, h * 0.33, 4, 0, TAU); g.fill();
  },
  abuelitos(w, h, t) {
    fondoCalido(w, h, "#ffd8a8");
    persona(w * 0.36, h, h * 0.58, "#3a2a2a"); persona(w * 0.64, h, h * 0.55, "#3a2a2a");
    g.fillStyle = "#ddd"; g.beginPath(); g.arc(w * 0.36, h * 0.44, h * 0.08, Math.PI, 0); g.fill();
    g.strokeStyle = "#3a2a2a"; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.42, h * 0.72); g.quadraticCurveTo(w * 0.5, h * 0.78, w * 0.58, h * 0.72); g.stroke();
    if ((t % 3) < 1.5) { g.fillStyle = "#ff7a9a"; corazonEn(w * 0.5, h * 0.3 - (t % 3) * h * 0.08, w * 0.06); g.fill(); }
  },
  bebe(w, h, t) {
    g.fillStyle = "#e8d8ff"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff"; g.fillRect(w * 0.2, h * 0.65, w * 0.6, h * 0.2);
    g.strokeStyle = "#caa"; g.lineWidth = 1; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(w * (0.2 + k * 0.1), h * 0.65); g.lineTo(w * (0.2 + k * 0.1), h * 0.85); g.stroke(); }
    g.save(); g.translate(w * 0.5, h * 0.2); g.rotate(t * 0.8);
    g.strokeStyle = "#888"; g.beginPath(); g.moveTo(-w * 0.2, 0); g.lineTo(w * 0.2, 0); g.stroke();
    for (const [dx, c] of [[-0.2, "#ffb0c8"], [0.2, "#b0d8ff"]]) { g.fillStyle = c; g.beginPath(); g.arc(dx * w, h * 0.08, 3.5, 0, TAU); g.fill(); }
    g.restore();
    letra("z", w * 0.6, h * (0.55 - (t % 2) * 0.06), h * 0.14, "#8a7aa8");
  },
  videojuegos(w, h, t) {
    const f = Math.floor(t * 6) % 3;
    g.fillStyle = ["#2a3a9a", "#9a2a5a", "#2a8a5a"][f]; g.fillRect(0, 0, w, h);
    g.fillStyle = "#0a0a14"; g.fillRect(w * 0.1, h * 0.65, w * 0.8, h * 0.35);
    persona(w * 0.5, h * 1.05, h * 0.5, "#0c0e1e", 0.4);
    if ((t % 3) > 2.5) letra("!!", w * 0.62, h * 0.3, h * 0.2, "#fff");
  },
  tiktok(w, h, t) {
    fondoCalido(w, h, "#ffd0e8");
    const s = Math.sin(t * 8);
    persona(w * 0.4 + s * w * 0.05, h, h * 0.65, "#2a1428", 1.5 + s);
    g.fillStyle = "#222"; g.fillRect(w * 0.78, h * 0.4, 4, h * 0.6);
    g.fillStyle = "#ff2d55"; g.beginPath(); g.arc(w * 0.8, h * 0.36, 3, 0, TAU); g.fill();
  },
  carta(w, h, t) {
    const lz = g.createRadialGradient(w * 0.7, h * 0.5, 0, w * 0.7, h * 0.5, w);
    lz.addColorStop(0, "#ffe4a8"); lz.addColorStop(1, "#5a3a2a");
    g.fillStyle = lz; g.fillRect(0, 0, w, h);
    persona(w * 0.4, h, h * 0.6, "#2a1a20", 0.1 + Math.sin(t * 12) * 0.1);
    g.fillStyle = "#fff8ec"; g.fillRect(w * 0.5, h * 0.72, w * 0.3, h * 0.08);
    if ((t % 4) > 3) { g.fillStyle = "#ff6f8a"; corazonEn(w * 0.65, h * 0.5, w * 0.05); g.fill(); }
  },
  disco(w, h, t) {
    g.fillStyle = "#1a0a2a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { const a = t * 1.5 + i; g.fillStyle = `hsl(${(i * 40 + t * 90) % 360},100%,70%)`; g.fillRect(w * (0.5 + Math.cos(a) * 0.45), h * (0.55 + Math.sin(a * 1.3) * 0.4), 2.5, 2.5); }
    g.fillStyle = "#ccd"; g.beginPath(); g.arc(w * 0.5, h * 0.18, w * 0.1, 0, TAU); g.fill();
    for (let i = 0; i < 2; i++) persona(w * (0.33 + i * 0.34), h - Math.abs(Math.sin(t * 7 + i)) * h * 0.06, h * 0.52, "#0a0612", 1.8 + Math.sin(t * 7 + i) * 0.5);
  },
  canario(w, h, t) {
    fondoCalido(w, h, "#fff0c8");
    g.strokeStyle = "#8a6a3a"; g.lineWidth = 1;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(w * (0.3 + k * 0.08), h * 0.3); g.lineTo(w * (0.3 + k * 0.08), h * 0.8); g.stroke(); }
    g.beginPath(); g.arc(w * 0.5, h * 0.3, w * 0.2, Math.PI, 0); g.stroke();
    const b = Math.abs(Math.sin(t * 8)) * h * 0.03;
    g.fillStyle = "#ffd21a"; g.beginPath(); g.ellipse(w * 0.5, h * 0.6 - b, w * 0.08, h * 0.06, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(w * 0.56, h * 0.54 - b, w * 0.045, 0, TAU); g.fill();
  },
  tejiendo(w, h, t) {
    fondoCalido(w, h, "#ffd8b8");
    persona(w * 0.42, h, h * 0.6, "#3a2a30");
    g.fillStyle = "#ddd"; g.beginPath(); g.arc(w * 0.42, h * 0.44, h * 0.08, Math.PI, 0); g.fill();
    g.fillStyle = "#e0507a"; g.beginPath(); g.arc(w * 0.72, h * 0.86, w * 0.08, 0, TAU); g.fill();
    g.strokeStyle = "#e0507a"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(w * 0.72, h * 0.86); g.quadraticCurveTo(w * 0.62, h * 0.7, w * 0.52, h * 0.62 + Math.sin(t * 6) * 2); g.stroke();
  },
  yoga(w, h, t) {
    g.fillStyle = "#e8fff0"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#6ac8a0"; g.fillRect(w * 0.15, h * 0.9, w * 0.7, h * 0.05);
    const s = (Math.sin(t * 1.2) + 1) / 2;
    persona(w * 0.5, h * 0.9, h * 0.55, "#1a3a2a", 1.57 + s * 0.3);
    g.save(); g.scale(-1, 1); persona(-w * 0.5, h * 0.9, h * 0.55, "#1a3a2a", 1.57 + s * 0.3); g.restore();
  },
  cafe(w, h, t) {
    fondoCalido(w, h, "#f4d0a0");
    persona(w * 0.4, h, h * 0.62, "#2a1a1a", 1.1);
    g.fillStyle = "#fff"; g.fillRect(w * 0.6, h * 0.45, 7, 8);
    for (let i = 0; i < 2; i++) { const k = (t * 0.5 + i / 2) % 1; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.62 + i * 3, h * 0.44 - k * h * 0.2); g.quadraticCurveTo(w * 0.6 + Math.sin(k * 6) * 3, h * 0.38 - k * h * 0.2, w * 0.63, h * 0.34 - k * h * 0.2); g.stroke(); }
  },
  estrellitas(w, h, t) {
    g.fillStyle = "#1a1a3a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(200,255,180,${0.5 + 0.5 * Math.sin(t * 2 + i)})`;
      const x = (i * 37 % 100) / 100 * w, y = (i * 23 % 60) / 100 * h + 4;
      g.beginPath();
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; g.lineTo(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5); g.lineTo(x + Math.cos(a + TAU / 10) * 1.5, y + Math.sin(a + TAU / 10) * 1.5); }
      g.fill();
    }
    persona(w * 0.5, h * 1.1, h * 0.45, "#0a0a1a");
  },
  trompeta(w, h, t) {
    fondoCalido(w, h, "#ffc890");
    persona(w * 0.35, h, h * 0.66, "#2a1a1a");
    g.fillStyle = "#e8c040"; g.save(); g.translate(w * 0.42, h * 0.42); g.rotate(-0.15); g.fillRect(0, -2, w * 0.3, 4); g.beginPath(); g.moveTo(w * 0.3, -2); g.lineTo(w * 0.42, -7); g.lineTo(w * 0.42, 7); g.lineTo(w * 0.3, 2); g.fill(); g.restore();
    letra("♪", w * 0.8, h * (0.35 - (t * 0.4) % 0.3), h * 0.2, "#5a2a1a");
  },
  pizza(w, h, t) {
    fondoCalido(w, h, "#ffd8a0");
    persona(w * 0.34, h, h * 0.62, "#2a1a20", 1.25 + Math.sin(t * 3) * 0.15);
    const m = Math.sin(t * 3) * h * 0.02;
    g.fillStyle = "#f2c14e"; g.beginPath(); g.moveTo(w * 0.52, h * 0.34 + m); g.lineTo(w * 0.82, h * 0.3 + m); g.lineTo(w * 0.64, h * 0.56 + m); g.fill();
    g.fillStyle = "#c8342a"; for (const [a, b] of [[0.62, 0.36], [0.7, 0.35], [0.65, 0.44]]) { g.beginPath(); g.arc(w * a, h * b + m, 1.6, 0, TAU); g.fill(); }
    g.fillStyle = "#e8d8b8"; g.fillRect(w * 0.55, h * 0.84, w * 0.4, h * 0.06);
  },
  almohadas(w, h, t) {
    fondoCalido(w, h, "#ffe2c0");
    const s = Math.sin(t * 6);
    persona(w * 0.28, h, h * 0.58, "#2a1a30", 1 + s * 0.6);
    reflejado(w * 0.74, () => persona(w * 0.74, h, h * 0.55, "#3a1a28", 1 - s * 0.6));
    g.fillStyle = "#fff";
    g.beginPath(); g.roundRect(w * 0.36, h * (0.28 - s * 0.06), w * 0.18, h * 0.1, 3); g.fill();
    g.beginPath(); g.roundRect(w * 0.48, h * (0.3 + s * 0.06), w * 0.18, h * 0.1, 3); g.fill();
    for (let i = 0; i < 7; i++) { const k = (t * 0.35 + i / 7) % 1; g.fillStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; g.beginPath(); g.ellipse(w * (0.15 + i * 0.12) + Math.sin(t * 3 + i) * 3, h * (0.08 + k * 0.85), 2, 1, t + i, 0, TAU); g.fill(); }
  },
  mariachi(w, h, t) {
    fondoCalido(w, h, "#ffb070");
    const s = h * 0.66, x = w * 0.42, cab = h - s * 0.95;
    persona(x, h, s, "#1a1010");
    g.fillStyle = "#1a1010"; g.beginPath(); g.ellipse(x, cab - s * 0.14, w * 0.3, h * 0.04, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(x, cab - s * 0.14, s * 0.2, Math.PI, 0); g.fill();
    g.strokeStyle = "#e8c040"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, cab - s * 0.14, w * 0.3, h * 0.04, 0, 0, TAU); g.stroke();
    g.fillStyle = "#e8c040"; g.save(); g.translate(x + s * 0.12, cab + s * 0.12); g.rotate(-0.2 + Math.sin(t * 5) * 0.05); g.fillRect(0, -2, w * 0.3, 4); g.beginPath(); g.moveTo(w * 0.3, -2); g.lineTo(w * 0.42, -7); g.lineTo(w * 0.42, 7); g.lineTo(w * 0.3, 2); g.fill(); g.restore();
    letra("♪", w * 0.78, h * (0.3 - (t * 0.4) % 0.25), h * 0.18, "#5a1a0a");
  },
  pinata(w, h, t) {
    fondoCalido(w, h, "#ffcfe0");
    const rota = t > 2.4;
    const a = Math.sin(t * 5) * 0.4, px = w * 0.55 + Math.sin(a) * w * 0.2, py = h * 0.32;
    g.strokeStyle = "#5a3a2a"; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.55, 0); g.lineTo(px, py); g.stroke();
    if (!rota) {
      g.fillStyle = "#ffd23a"; g.beginPath(); g.arc(px, py, w * 0.09, 0, TAU); g.fill();
      const c = ["#ff4a7a", "#3ac8ff", "#6ae06a", "#ff9a2a", "#b06aff"];
      for (let k = 0; k < 5; k++) { const an = k * TAU / 5 + t; g.fillStyle = c[k]; g.beginPath(); g.moveTo(px + Math.cos(an - 0.3) * w * 0.08, py + Math.sin(an - 0.3) * w * 0.08); g.lineTo(px + Math.cos(an) * w * 0.2, py + Math.sin(an) * w * 0.2); g.lineTo(px + Math.cos(an + 0.3) * w * 0.08, py + Math.sin(an + 0.3) * w * 0.08); g.fill(); }
    } else {
      for (let i = 0; i < 12; i++) { const k = clamp((t - 2.4) * 0.9 - i * 0.02, 0, 1); g.fillStyle = ["#ff4a7a", "#3ac8ff", "#ffd23a", "#6ae06a"][i % 4]; g.fillRect(px + (i - 6) * w * 0.035 * (1 + k), py + k * h * 0.55, 3, 3); }
    }
    persona(w * 0.22, h, h * 0.5, "#2a1a30", 1.1 + Math.abs(Math.sin(t * 6)) * 0.7);
  },
  luchador(w, h, t) {
    fondoCalido(w, h, "#ffd0a0");
    const s = h * 0.7, x = w * 0.5, fl = 1.5 + Math.sin(t * 4) * 0.25;
    persona(x, h, s, "#2a1a3a", fl);
    reflejado(x, () => persona(x, h, s, "#2a1a3a", fl));
    const cy = h - s * 0.95, r = s * 0.22;
    g.fillStyle = "#d8283a"; g.beginPath(); g.arc(x, cy, r, 0, TAU); g.fill();
    g.fillStyle = "#ffe36a"; g.fillRect(x - 1, cy - r, 2, r * 2);
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x - r * 0.4, cy - r * 0.1, r * 0.25, r * 0.15, 0, 0, TAU); g.ellipse(x + r * 0.4, cy - r * 0.1, r * 0.25, r * 0.15, 0, 0, TAU); g.fill();
  },
  trastes(w, h, t) {
    fondoCalido(w, h, "#e8f4ff");
    g.strokeStyle = "rgba(120,150,190,.25)"; g.lineWidth = 1; for (let y = h * 0.1; y < h * 0.7; y += h * 0.1) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    persona(w * 0.36, h, h * 0.62, "#2a2030", 0.25 + Math.sin(t * 8) * 0.15);
    g.fillStyle = "#b8c4d0"; g.fillRect(w * 0.48, h * 0.7, w * 0.48, h * 0.08);
    g.fillStyle = "#fff"; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(w * 0.82, h * (0.66 - k * 0.04), w * 0.1, h * 0.015, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; g.strokeStyle = `rgba(160,200,255,${0.8 * (1 - k)})`; g.beginPath(); g.arc(w * (0.58 + i * 0.05), h * (0.68 - k * 0.3), 1.5 + k * 2, 0, TAU); g.stroke(); }
  },
  planchando(w, h, t) {
    fondoCalido(w, h, "#fff0d8");
    persona(w * 0.3, h, h * 0.62, "#302030", 0.2);
    g.fillStyle = "#6a8ad0"; g.beginPath(); g.roundRect(w * 0.4, h * 0.7, w * 0.56, h * 0.05, 3); g.fill();
    g.strokeStyle = "#555"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(w * 0.55, h * 0.75); g.lineTo(w * 0.8, h); g.moveTo(w * 0.8, h * 0.75); g.lineTo(w * 0.55, h); g.stroke();
    const ix = w * (0.52 + (Math.sin(t * 3) + 1) * 0.14);
    g.fillStyle = "#e0e4ec"; g.beginPath(); g.moveTo(ix - w * 0.08, h * 0.7); g.lineTo(ix + w * 0.1, h * 0.7); g.lineTo(ix + w * 0.06, h * 0.63); g.lineTo(ix - w * 0.06, h * 0.63); g.fill();
    for (let i = 0; i < 2; i++) { const k = (t * 0.8 + i / 2) % 1; g.fillStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; g.beginPath(); g.arc(ix + Math.sin(k * 5) * 3, h * (0.6 - k * 0.3), 2 + k * 3, 0, TAU); g.fill(); }
  },
  ronca(w, h, t) {
    g.fillStyle = "#2a2a50"; g.fillRect(0, 0, w, h);
    const lz = g.createRadialGradient(w * 0.8, h * 0.2, 0, w * 0.8, h * 0.2, w * 0.7); lz.addColorStop(0, "rgba(255,220,160,.55)"); lz.addColorStop(1, "rgba(255,220,160,0)"); g.fillStyle = lz; g.fillRect(0, 0, w, h);
    g.fillStyle = "#e8e0ff"; g.fillRect(w * 0.06, h * 0.74, w * 0.88, h * 0.2);
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(w * 0.22, h * 0.72, w * 0.14, h * 0.05, 0, 0, TAU); g.fill();
    g.fillStyle = "#1a1420"; g.beginPath(); g.arc(w * 0.24, h * 0.66, w * 0.09, 0, TAU); g.fill();
    const r = 1 + Math.sin(t * 2.5) * 0.12;
    g.fillStyle = "#8a6ad0"; g.beginPath(); g.ellipse(w * 0.6, h * 0.74, w * 0.3, h * 0.07 * r, 0, Math.PI, 0); g.fill();
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; letra("Z", w * (0.36 + k * 0.3), h * (0.52 - k * 0.4), h * (0.1 + k * 0.1), `rgba(255,255,255,${1 - k})`); }
  },
  beso(w, h, t) {
    fondoCalido(w, h, "#ffb8c8");
    const a = Math.min(1, t / 1) * w * 0.05;
    persona(w * 0.36 + a, h, h * 0.66, "#3a1020");
    reflejado(w * 0.64 - a, () => persona(w * 0.64 - a, h, h * 0.6, "#3a1020"));
    if (t > 0.9) { const k = (t - 0.9) % 2; g.fillStyle = `rgba(255,74,122,${1 - k / 2})`; corazonEn(w * 0.5, h * 0.22 - k * h * 0.08, w * 0.09); g.fill(); }
  },
  espejo(w, h, t) {
    fondoCalido(w, h, "#ffe0f0");
    g.fillStyle = "#cfe6ff"; g.beginPath(); g.ellipse(w * 0.7, h * 0.45, w * 0.17, h * 0.22, 0, 0, TAU); g.fill();
    g.strokeStyle = "#d8a84a"; g.lineWidth = 2.5; g.stroke();
    g.save(); g.beginPath(); g.ellipse(w * 0.7, h * 0.45, w * 0.16, h * 0.21, 0, 0, TAU); g.clip();
    persona(w * 0.7, h * 0.72, h * 0.3, "rgba(60,30,60,.45)"); g.restore();
    persona(w * 0.34, h, h * 0.6, "#2a1428", 1.8 + Math.sin(t * 6) * 0.25);
    if (Math.sin(t * 2) > 0.7) { g.fillStyle = "#fff"; g.beginPath(); g.arc(w * 0.62, h * 0.32, 1.8, 0, TAU); g.fill(); }
  },
  gatocaja(w, h, t) {
    fondoCalido(w, h, "#ffe4b8");
    const sale = Math.max(0, Math.sin(t * 1.4)) * h * 0.1;
    g.fillStyle = "#231820";
    g.beginPath(); g.arc(w * 0.5, h * 0.6 - sale, w * 0.13, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(w * 0.39, h * 0.56 - sale); g.lineTo(w * 0.41, h * 0.44 - sale); g.lineTo(w * 0.47, h * 0.52 - sale); g.moveTo(w * 0.53, h * 0.52 - sale); g.lineTo(w * 0.59, h * 0.44 - sale); g.lineTo(w * 0.61, h * 0.56 - sale); g.fill();
    const p = Math.sin(t * 1.9) > 0.94 ? 0.2 : 1;
    g.fillStyle = "#9cff7a"; g.beginPath(); g.ellipse(w * 0.45, h * 0.6 - sale, 1.8, 2 * p, 0, 0, TAU); g.ellipse(w * 0.55, h * 0.6 - sale, 1.8, 2 * p, 0, 0, TAU); g.fill();
    g.fillStyle = "#c89058"; g.fillRect(w * 0.24, h * 0.64, w * 0.52, h * 0.3);
    g.fillStyle = "#a87038"; g.beginPath(); g.moveTo(w * 0.24, h * 0.64); g.lineTo(w * 0.14, h * 0.56); g.lineTo(w * 0.3, h * 0.56); g.fill(); g.beginPath(); g.moveTo(w * 0.76, h * 0.64); g.lineTo(w * 0.86, h * 0.56); g.lineTo(w * 0.7, h * 0.56); g.fill();
  },
  hamster(w, h, t) {
    fondoCalido(w, h, "#fff0d0");
    const cx = w * 0.5, cy = h * 0.6, r = w * 0.27;
    g.strokeStyle = "#8a8aa0"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    g.lineWidth = 1; for (let k = 0; k < 6; k++) { const a = t * 6 + k * TAU / 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); }
    g.fillStyle = "#6a6a80"; g.fillRect(cx - 1.5, cy, 3, h - cy);
    const b = Math.abs(Math.sin(t * 14)) * 2;
    g.fillStyle = "#d8a060"; g.beginPath(); g.ellipse(cx, cy + r - 5 - b, w * 0.1, h * 0.04, 0, 0, TAU); g.fill();
    g.fillStyle = "#fff0e0"; g.beginPath(); g.arc(cx + w * 0.08, cy + r - 6 - b, 2.5, 0, TAU); g.fill();
  },
  loro(w, h, t) {
    fondoCalido(w, h, "#e0ffe0");
    g.fillStyle = "#7a4a2a"; g.fillRect(w * 0.15, h * 0.72, w * 0.7, 3);
    const b = Math.sin(t * 6) * h * 0.02, x = w * 0.5, y = h * 0.52 + b;
    g.fillStyle = "#2ec85a"; g.beginPath(); g.ellipse(x, y, w * 0.11, h * 0.16, 0.15, 0, TAU); g.fill();
    g.beginPath(); g.arc(x + w * 0.04, y - h * 0.15, w * 0.09, 0, TAU); g.fill();
    g.fillStyle = "#e83a3a"; g.beginPath(); g.ellipse(x - w * 0.04, y + h * 0.02, w * 0.06, h * 0.1, 0.3, 0, TAU); g.fill();
    g.fillStyle = "#ffb020"; g.beginPath(); g.moveTo(x + w * 0.11, y - h * 0.16); g.lineTo(x + w * 0.19, y - h * 0.12); g.lineTo(x + w * 0.11, y - h * 0.1); g.fill();
    g.fillStyle = "#111"; g.beginPath(); g.arc(x + w * 0.07, y - h * 0.17, 1.5, 0, TAU); g.fill();
    g.fillStyle = "#1a8a3a"; g.fillRect(x - w * 0.02, y + h * 0.15, w * 0.04, h * 0.1);
  },
  miedo(w, h, t) {
    const susto = (t % 3) > 2.4;
    const b = 0.5 + 0.5 * Math.sin(t * 11) * Math.sin(t * 5);
    g.fillStyle = susto ? "#e8ecff" : `rgb(${30 + b * 20},${40 + b * 30},${90 + b * 40})`; g.fillRect(0, 0, w, h);
    if (susto) { g.fillStyle = "#101018"; g.beginPath(); g.arc(w * 0.4, h * 0.3, 3, 0, TAU); g.arc(w * 0.6, h * 0.3, 3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(w * 0.5, h * 0.42, 4, 6, 0, 0, TAU); g.fill(); }
    const tiembla = susto ? Math.sin(t * 60) * 2 : 0;
    g.fillStyle = "#6a5a9a"; g.beginPath(); g.ellipse(w * 0.5 + tiembla, h * 0.86, w * 0.36, h * 0.2, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(w * 0.45 + tiembla, h * 0.76, 2, 0, TAU); g.arc(w * 0.55 + tiembla, h * 0.76, 2, 0, TAU); g.fill();
  },
  palomitas(w, h, t) {
    const b = 0.5 + 0.5 * Math.sin(t * 7);
    fondoCalido(w, h, `rgb(${220 + b * 20},${200 + b * 20},${160 + b * 30})`);
    persona(w * 0.3, h, h * 0.55, "#2a1a20", 1.0);
    const bx = w * 0.6, by = h * 0.72;
    for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? "#fff" : "#e8283a"; g.beginPath(); g.moveTo(bx + k * w * 0.06, by); g.lineTo(bx + (k + 1) * w * 0.06, by); g.lineTo(bx + (k + 0.9) * w * 0.055, h); g.lineTo(bx + k * w * 0.055, h); g.fill(); }
    g.fillStyle = "#fff8e0"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(bx + w * 0.03 + i * w * 0.045, by - 2, 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 3; i++) { const k = (t * 1.2 + i / 3) % 1; g.beginPath(); g.arc(bx + w * (0.06 + i * 0.08), by - Math.sin(k * Math.PI) * h * 0.25, 2.5, 0, TAU); g.fill(); }
  },
  pijamada(w, h, t) {
    fondoCalido(w, h, "#ffd8f0");
    for (const [x, s] of [[0.3, 0.6], [0.7, 0.56]]) {
      const px = w * x + Math.sin(t * 2 + x * 9) * 1.5, ps = h * s;
      persona(px, h, ps, "#3a2a40");
      const cy = h - ps * 0.95, r = ps * 0.22;
      g.fillStyle = "#9ad89a"; g.beginPath(); g.arc(px, cy, r, 0, TAU); g.fill();
      g.fillStyle = "#4aa84a"; g.beginPath(); g.arc(px - r * 0.4, cy - r * 0.1, r * 0.32, 0, TAU); g.arc(px + r * 0.4, cy - r * 0.1, r * 0.32, 0, TAU); g.fill();
      g.fillStyle = "#dff5c8"; g.beginPath(); g.arc(px - r * 0.4, cy - r * 0.1, r * 0.18, 0, TAU); g.arc(px + r * 0.4, cy - r * 0.1, r * 0.18, 0, TAU); g.fill();
    }
  },
  robot(w, h, t) {
    g.fillStyle = "#303a5a"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#454f70"; g.fillRect(0, h * 0.82, w, h * 0.18);
    const k = (t * 0.18) % 1, x = w * (0.15 + (k < 0.5 ? k * 2 : 2 - k * 2) * 0.7), p = Math.sin(t * 10) * 2;
    g.fillStyle = "#c0c8d8"; g.fillRect(x - w * 0.1, h * 0.56, w * 0.2, h * 0.18); g.fillRect(x - w * 0.07, h * 0.44, w * 0.14, h * 0.11);
    g.fillStyle = "#5af0ff"; g.fillRect(x - w * 0.045, h * 0.48, 3, 3); g.fillRect(x + w * 0.02, h * 0.48, 3, 3);
    g.strokeStyle = "#c0c8d8"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, h * 0.44); g.lineTo(x, h * 0.38); g.stroke();
    g.fillStyle = Math.sin(t * 8) > 0 ? "#ff3a3a" : "#6a2020"; g.beginPath(); g.arc(x, h * 0.37, 2, 0, TAU); g.fill();
    g.fillStyle = "#8a92a8"; g.fillRect(x - w * 0.07, h * 0.74, 3, h * 0.08 + p); g.fillRect(x + w * 0.04, h * 0.74, 3, h * 0.08 - p);
  },
  mago(w, h, t) {
    fondoCalido(w, h, "#e0c8ff");
    persona(w * 0.32, h, h * 0.62, "#1a1030", 0.9);
    const sale = clamp((t % 4) / 1.2, 0, 1);
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(w * 0.64, h * (0.62 - sale * 0.12), w * 0.07, h * 0.06, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(w * 0.61, h * (0.52 - sale * 0.12), w * 0.02, h * 0.07, -0.2, 0, TAU); g.ellipse(w * 0.67, h * (0.52 - sale * 0.12), w * 0.02, h * 0.07, 0.2, 0, TAU); g.fill();
    g.fillStyle = "#101018"; g.fillRect(w * 0.52, h * 0.64, w * 0.24, h * 0.2); g.fillRect(w * 0.47, h * 0.64, w * 0.34, h * 0.03);
    g.fillStyle = "#d83a5a"; g.fillRect(w * 0.52, h * 0.78, w * 0.24, h * 0.03);
    for (let i = 0; i < 4; i++) if (Math.sin(t * 5 + i * 2) > 0.3) { g.fillStyle = "#fff6a0"; g.fillRect(w * (0.5 + i * 0.1), h * (0.35 + (i % 2) * 0.1), 2, 2); }
  },
  malabares(w, h, t) {
    fondoCalido(w, h, "#fff0c8");
    persona(w * 0.5, h, h * 0.6, "#2a1a2a", 1.1 + Math.sin(t * 8) * 0.2);
    reflejado(w * 0.5, () => persona(w * 0.5, h, h * 0.6, "#2a1a2a", 1.1 - Math.sin(t * 8) * 0.2));
    const c = ["#ff4a6a", "#4ab4ff", "#ffd24a"];
    for (let i = 0; i < 3; i++) { const ph = t * 4 + i * TAU / 3; g.fillStyle = c[i]; g.beginPath(); g.arc(w * 0.5 + Math.cos(ph) * w * 0.24, h * 0.34 - Math.abs(Math.sin(ph)) * h * 0.2, 3, 0, TAU); g.fill(); }
  },
  globos(w, h, t) {
    fondoCalido(w, h, "#ffe8f0");
    const c = ["#ff5a8a", "#ffd24a", "#6ab4ff", "#b06aff", "#ff8a4a"];
    for (let i = 0; i < 5; i++) {
      const x = w * (0.14 + i * 0.18), y = h * (0.26 + (i % 2) * 0.1) + Math.sin(t * 1.6 + i) * h * 0.03;
      g.strokeStyle = "rgba(90,60,80,.6)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y + h * 0.08); g.quadraticCurveTo(x + 3, y + h * 0.3, x, h * 0.9); g.stroke();
      g.fillStyle = c[i]; g.beginPath(); g.ellipse(x, y, w * 0.08, h * 0.08, 0, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(x - w * 0.025, y - h * 0.03, 1.5, 0, TAU); g.fill();
    }
  },
  dj(w, h, t) {
    g.fillStyle = `hsl(${270 + Math.sin(t * 2) * 30},60%,${22 + Math.abs(Math.sin(t * 8)) * 12}%)`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { g.fillStyle = `hsla(${(t * 90 + i * 120) % 360},100%,65%,.25)`; g.beginPath(); g.moveTo(w * 0.5, 0); g.lineTo(w * (0.1 + i * 0.4) + Math.sin(t * 2 + i) * w * 0.2, h); g.lineTo(w * (0.25 + i * 0.4) + Math.sin(t * 2 + i) * w * 0.2, h); g.fill(); }
    const s = h * 0.66, x = w * 0.5;
    persona(x, h * 1.02 - Math.abs(Math.sin(t * 8)) * h * 0.03, s, "#0a0616", 1.7);
    g.strokeStyle = "#ff3aa0"; g.lineWidth = 2; g.beginPath(); g.arc(x, h * 1.02 - s * 0.95 - Math.abs(Math.sin(t * 8)) * h * 0.03, s * 0.26, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.fillStyle = "#1a1a2a"; g.fillRect(w * 0.1, h * 0.8, w * 0.8, h * 0.2);
    g.strokeStyle = "#8a8aa8"; g.lineWidth = 1; g.beginPath(); g.arc(w * 0.3, h * 0.88, w * 0.08, t * 8, t * 8 + 4); g.stroke();
  },
  bateria(w, h, t) {
    fondoCalido(w, h, "#ffc0a0");
    const golpe = Math.abs(Math.sin(t * 10));
    persona(w * 0.5, h * 0.95, h * 0.6, "#1a1018", 1.3 + golpe * 0.7);
    reflejado(w * 0.5, () => persona(w * 0.5, h * 0.95, h * 0.6, "#1a1018", 1.3 + (1 - golpe) * 0.7));
    g.fillStyle = "#c83a3a"; g.beginPath(); g.ellipse(w * 0.5, h * 0.86, w * 0.2, h * 0.1, 0, 0, TAU); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(w * 0.5, h * 0.86, w * 0.13, h * 0.065, 0, 0, TAU); g.fill();
    g.save(); g.translate(w * 0.82, h * 0.55); g.rotate(Math.sin(t * 22) * 0.18); g.fillStyle = "#e8c040"; g.fillRect(-w * 0.14, -1.5, w * 0.28, 3); g.restore();
    g.save(); g.translate(w * 0.18, h * 0.6); g.rotate(-Math.sin(t * 18) * 0.15); g.fillStyle = "#e8c040"; g.fillRect(-w * 0.12, -1.5, w * 0.24, 3); g.restore();
  },
  violin(w, h, t) {
    fondoCalido(w, h, "#f4d8b8");
    const s = h * 0.66, x = w * 0.42, cy = h - s * 0.95;
    persona(x, h, s, "#2a1818");
    g.save(); g.translate(x + s * 0.18, cy + s * 0.2); g.rotate(0.5);
    g.fillStyle = "#9a4a1a"; g.beginPath(); g.ellipse(0, 0, w * 0.07, w * 0.11, 0, 0, TAU); g.fill();
    g.fillStyle = "#2a1008"; g.fillRect(-1, -w * 0.24, 2, w * 0.14); g.restore();
    const arco = Math.sin(t * 5) * w * 0.12;
    g.strokeStyle = "#e8d8b0"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + s * 0.02 + arco, cy + s * 0.45); g.lineTo(x + s * 0.5 + arco, cy + s * 0.05); g.stroke();
    letra("♫", w * 0.76, h * (0.32 - (t * 0.35) % 0.22), h * 0.17, "#6a2a1a");
  },
  piano(w, h, t) {
    fondoCalido(w, h, "#f0e0d0");
    g.fillStyle = "#101014"; g.fillRect(w * 0.4, h * 0.46, w * 0.58, h * 0.4); g.fillRect(w * 0.42, h * 0.86, 3, h * 0.14); g.fillRect(w * 0.92, h * 0.86, 3, h * 0.14);
    g.fillStyle = "#fff"; g.fillRect(w * 0.42, h * 0.62, w * 0.54, h * 0.06);
    g.fillStyle = "#101014"; for (let k = 0; k < 7; k++) g.fillRect(w * (0.45 + k * 0.075), h * 0.62, 2, h * 0.035);
    persona(w * 0.28, h, h * 0.58, "#2a1a24", 0.1 + Math.abs(Math.sin(t * 6)) * 0.2);
    letra("♪", w * (0.6 + Math.sin(t) * 0.1), h * (0.36 - (t * 0.3) % 0.2), h * 0.16, "#4a2a3a");
  },
  /* La pareja viendo su K-drama: el sillón, la cobija, las palomitas, el
     gato dormido, los foquitos y la tele con su drama. Todo va en medidas
     relativas, así se dibuja igual en la ventanita que en grande. */
  kdrama(w, h, t) {
    const a0 = g.globalAlpha, u = Math.min(w, h * 1.3);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffcba6"); gr.addColorStop(1, "#e2906e"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const tele = 0.5 + 0.5 * Math.sin(t * 2.3) * Math.sin(t * 5.1);
    g.globalAlpha = a0 * (0.1 + tele * 0.1); g.fillStyle = "#6a8cff"; g.fillRect(w * 0.42, 0, w * 0.58, h); g.globalAlpha = a0;
    // la lámpara de pie
    const lg = g.createRadialGradient(w * 0.05, h * 0.36, 0, w * 0.05, h * 0.36, u * 0.4);
    lg.addColorStop(0, "rgba(255,236,170,.75)"); lg.addColorStop(1, "rgba(255,236,170,0)"); g.fillStyle = lg; g.fillRect(0, 0, w * 0.5, h);
    g.fillStyle = "#4a3028"; g.fillRect(w * 0.045, h * 0.38, Math.max(1, w * 0.012), h * 0.5);
    g.fillStyle = "#fff1c8"; g.beginPath(); g.moveTo(w * 0.01, h * 0.4); g.lineTo(w * 0.09, h * 0.4); g.lineTo(w * 0.075, h * 0.3); g.lineTo(w * 0.025, h * 0.3); g.fill();
    // el cuadrito con corazón
    g.fillStyle = "#a8683e"; g.fillRect(w * 0.18, h * 0.2, w * 0.14, h * 0.14);
    g.fillStyle = "#ffe8f0"; g.fillRect(w * 0.192, h * 0.212, w * 0.116, h * 0.116);
    g.fillStyle = "#ff6fa0"; corazonEn(w * 0.25, h * 0.27, u * 0.03); g.fill();
    // la serie de foquitos
    g.strokeStyle = "#5a3a2a"; g.lineWidth = Math.max(0.5, u * 0.006);
    g.beginPath(); g.moveTo(0, h * 0.06); g.quadraticCurveTo(w * 0.5, h * 0.22, w, h * 0.06); g.stroke();
    for (let k = 0; k < 9; k++) {
      const q = (k + 0.5) / 9, x = q * w, y = h * 0.06 + Math.sin(q * Math.PI) * h * 0.08 + h * 0.018;
      g.globalAlpha = a0 * (0.5 + 0.5 * Math.sin(t * 3 + k * 1.3));
      g.fillStyle = ["#ffe38a", "#ff9ec4", "#a8e0ff", "#b8ffb0"][k % 4];
      g.beginPath(); g.arc(x, y, Math.max(0.8, u * 0.014), 0, TAU); g.fill();
    }
    g.globalAlpha = a0;
    // la tele con su drama: dos que se acercan bajo un cerezo y se dicen te amo
    const tx = w * 0.64, ty = h * 0.3, tw = w * 0.32, th = h * 0.25;
    g.fillStyle = "#5a3a2a"; g.fillRect(tx - w * 0.05, ty + th + h * 0.05, tw + w * 0.1, h * 0.06);
    g.fillStyle = "#1a1420"; g.fillRect(tx - w * 0.012, ty - h * 0.015, tw + w * 0.024, th + h * 0.03);
    g.fillRect(tx + tw * 0.4, ty + th, tw * 0.2, h * 0.05);
    g.save(); g.beginPath(); g.rect(tx, ty, tw, th); g.clip();
    const cg = g.createLinearGradient(0, ty, 0, ty + th); cg.addColorStop(0, "#ff9ec8"); cg.addColorStop(1, "#ffd6a2"); g.fillStyle = cg; g.fillRect(tx, ty, tw, th);
    g.fillStyle = "#6a3a3a"; g.fillRect(tx + tw * 0.8, ty + th * 0.35, Math.max(1, tw * 0.035), th * 0.6);
    g.fillStyle = "#f07aa8"; g.beginPath(); g.arc(tx + tw * 0.82, ty + th * 0.3, tw * 0.17, 0, TAU); g.fill();
    const ciclo = (t % 8) / 8, cerca = Math.min(1, ciclo * 1.6);
    const px1 = tx + tw * (0.16 + cerca * 0.2), px2 = tx + tw * (0.7 - cerca * 0.18), py = ty + th * 0.96;
    persona(px1, py, th * 0.62, "#2e2840"); persona(px2, py, th * 0.58, "#b8487a");
    if (ciclo > 0.62) { const k = (ciclo - 0.62) / 0.38; g.globalAlpha = a0 * Math.min(1, k * 3); g.fillStyle = "#ff2d6e"; corazonEn((px1 + px2) / 2, py - th * 0.72 - k * th * 0.18, tw * 0.07); g.fill(); g.globalAlpha = a0; }
    for (let k = 0; k < 6; k++) { const q = (t * 0.22 + k * 0.19) % 1; g.fillStyle = "#fff0f6"; g.fillRect(tx + tw * ((k * 0.21 + q * 0.3) % 1), ty + th * q, Math.max(0.7, tw * 0.02), Math.max(0.7, tw * 0.02)); }
    g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(tx + tw * 0.12, ty + th * 0.8, tw * 0.76, th * 0.15);
    if (w > 140) { g.fillStyle = "#fff"; g.font = `${Math.round(th * 0.11)}px sans-serif`; g.textAlign = "center"; g.fillText(ciclo > 0.62 ? "사랑해… (te amo)" : ciclo > 0.3 ? "No te vayas…" : "…", tx + tw / 2, ty + th * 0.91); g.textAlign = "left"; }
    else { g.fillStyle = "#fff"; g.fillRect(tx + tw * 0.25, ty + th * 0.86, tw * 0.5, Math.max(0.6, th * 0.03)); }
    g.restore();
    const brillo = g.createRadialGradient(tx + tw / 2, ty + th / 2, 0, tx + tw / 2, ty + th / 2, u * 0.5);
    brillo.addColorStop(0, `rgba(255,170,210,${0.22 + tele * 0.1})`); brillo.addColorStop(1, "rgba(255,170,210,0)"); g.fillStyle = brillo; g.fillRect(w * 0.3, 0, w * 0.7, h);
    // el sillón
    g.fillStyle = "#8a3c6c"; g.beginPath(); g.roundRect(w * 0.03, h * 0.52, w * 0.56, h * 0.24, u * 0.04); g.fill();
    g.fillStyle = "#b25a8c"; g.fillRect(w * 0.04, h * 0.72, w * 0.54, h * 0.13);
    g.fillStyle = "#7a2e5e"; g.beginPath(); g.roundRect(w * 0.005, h * 0.62, w * 0.07, h * 0.24, u * 0.03); g.roundRect(w * 0.55, h * 0.62, w * 0.07, h * 0.24, u * 0.03); g.fill();
    g.fillStyle = "#e8a8c8"; g.beginPath(); g.ellipse(w * 0.1, h * 0.62, w * 0.04, h * 0.05, -0.3, 0, TAU); g.fill();
    g.fillStyle = "#3a2030"; g.fillRect(w * 0.06, h * 0.85, w * 0.02, h * 0.04); g.fillRect(w * 0.54, h * 0.85, w * 0.02, h * 0.04);
    // el gato dormido en el brazo del sillón, moviendo la colita
    g.fillStyle = "#d8883a"; g.beginPath(); g.ellipse(w * 0.035, h * 0.6, w * 0.045, h * 0.032, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(w * 0.07, h * 0.585, h * 0.027, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(w * 0.06, h * 0.565); g.lineTo(w * 0.066, h * 0.54); g.lineTo(w * 0.074, h * 0.562); g.fill();
    g.strokeStyle = "#d8883a"; g.lineWidth = Math.max(0.8, u * 0.012); g.lineCap = "round";
    g.beginPath(); g.moveTo(w * -0.005, h * 0.6); g.quadraticCurveTo(w * -0.02, h * (0.57 + Math.sin(t * 2) * 0.02), w * 0.005, h * 0.55); g.stroke();
    // la pareja: él con el brazo por encima de ella, ella recargada en su hombro
    const bx = w * 0.24, gx = w * 0.39, base = h * 0.74, respira = Math.sin(t * 1.6) * h * 0.004;
    g.fillStyle = "#2e3a5a"; g.beginPath(); g.roundRect(bx - w * 0.065, base - h * 0.21 + respira, w * 0.13, h * 0.21, u * 0.04); g.fill();
    g.fillStyle = "#c89a7a"; g.beginPath(); g.arc(bx + w * 0.012, base - h * 0.26 + respira, h * 0.056, 0, TAU); g.fill();
    g.fillStyle = "#16121a"; g.beginPath(); g.arc(bx + w * 0.006, base - h * 0.275 + respira, h * 0.058, Math.PI * 1.02, Math.PI * 2.05); g.fill();
    const llora = (t % 11) > 8.6;
    g.fillStyle = "#e27aa8"; g.beginPath(); g.roundRect(gx - w * 0.055, base - h * 0.185, w * 0.11, h * 0.185, u * 0.04); g.fill();
    g.fillStyle = "#3a2418"; g.beginPath(); g.ellipse(gx - w * 0.012, base - h * 0.19, w * 0.05, h * 0.085, 0.15, 0, TAU); g.fill();
    g.fillStyle = "#e0b89a"; g.beginPath(); g.arc(gx - w * 0.02, base - h * 0.235, h * 0.05, 0, TAU); g.fill();
    g.fillStyle = "#3a2418"; g.beginPath(); g.arc(gx - w * 0.024, base - h * 0.248, h * 0.052, Math.PI * 0.95, Math.PI * 2.1); g.fill();
    g.strokeStyle = "#2e3a5a"; g.lineWidth = Math.max(1.2, u * 0.03);
    g.beginPath(); g.moveTo(bx + w * 0.04, base - h * 0.18 + respira); g.quadraticCurveTo(gx - w * 0.02, base - h * 0.22, gx + w * 0.045, base - h * 0.15); g.stroke();
    if (llora) { g.strokeStyle = "#e27aa8"; g.lineWidth = Math.max(1, u * 0.022); g.beginPath(); g.moveTo(gx + w * 0.03, base - h * 0.12); g.lineTo(gx + w * 0.005, base - h * 0.225); g.stroke(); g.fillStyle = "#8ad0ff"; g.beginPath(); g.arc(gx - w * 0.005, base - h * 0.2 + ((t * 0.6) % 0.4) * h * 0.1, Math.max(0.6, u * 0.009), 0, TAU); g.fill(); }
    // la cobija sobre las piernas, con sus corazoncitos
    g.fillStyle = "#fff0e2"; g.beginPath(); g.moveTo(w * 0.14, base - h * 0.03);
    for (let k = 0; k <= 6; k++) g.lineTo(w * (0.14 + k * 0.066), base - h * 0.03 + Math.sin(k * 1.7 + t * 0.6) * h * 0.012);
    g.lineTo(w * 0.54, h * 0.86); g.lineTo(w * 0.13, h * 0.86); g.fill();
    g.fillStyle = "#ff9ec4"; for (let k = 0; k < 4; k++) { corazonEn(w * (0.2 + k * 0.09), h * 0.8 + (k % 2) * h * 0.02, u * 0.012); g.fill(); }
    // las palomitas: el tazón y las que brincan
    g.fillStyle = "#e84a5a"; g.beginPath(); g.moveTo(w * 0.29, base - h * 0.04); g.lineTo(w * 0.37, base - h * 0.04); g.lineTo(w * 0.355, base + h * 0.005); g.lineTo(w * 0.305, base + h * 0.005); g.fill();
    g.fillStyle = "#fff6d8"; g.beginPath(); g.arc(w * 0.33, base - h * 0.045, w * 0.036, Math.PI, 0); g.fill();
    for (let k = 0; k < 3; k++) { const q = (t * 1.3 + k * 0.37) % 1; g.fillRect(w * (0.31 + k * 0.02), base - h * 0.06 - Math.sin(q * Math.PI) * h * 0.07, Math.max(0.8, u * 0.012), Math.max(0.8, u * 0.012)); }
    // la mesita con dos tazas humeando
    g.fillStyle = "#6a4028"; g.fillRect(w * 0.64, h * 0.86, w * 0.26, h * 0.035); g.fillRect(w * 0.66, h * 0.89, w * 0.02, h * 0.1); g.fillRect(w * 0.86, h * 0.89, w * 0.02, h * 0.1);
    g.fillStyle = "#fff"; g.fillRect(w * 0.69, h * 0.81, w * 0.04, h * 0.05); g.fillStyle = "#ffb3cf"; g.fillRect(w * 0.79, h * 0.81, w * 0.04, h * 0.05);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = Math.max(0.6, u * 0.008);
    for (const vx of [0.71, 0.81]) { g.beginPath(); for (let k = 0; k <= 8; k++) { const q = k / 8, x = w * vx + Math.sin(q * 6 + t * 3 + vx * 9) * w * 0.012, y = h * (0.8 - q * 0.12); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    // corazoncitos que se escapan
    for (let k = 0; k < 3; k++) {
      const q = (t * 0.28 + k / 3) % 1;
      g.globalAlpha = a0 * Math.sin(q * Math.PI);
      g.fillStyle = "#ff5c95"; corazonEn(w * 0.32 + Math.sin(q * 6 + k) * w * 0.035, base - h * 0.33 - q * h * 0.22, u * 0.024); g.fill();
    }
    g.globalAlpha = a0;
  },
  dino(w, h, t) {
    fondoCalido(w, h, "#d8ffc8");
    const b = Math.abs(Math.sin(t * 6)) * h * 0.05, x = w * 0.46, y = h * 0.78 - b;
    g.fillStyle = "#3aa85a";
    g.beginPath(); g.ellipse(x, y, w * 0.2, h * 0.16, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - w * 0.16, y + h * 0.04); g.quadraticCurveTo(x - w * 0.4, y + h * 0.1, x - w * 0.42, y + h * 0.18); g.lineTo(x - w * 0.12, y + h * 0.12); g.fill();
    g.beginPath(); g.ellipse(x + w * 0.18, y - h * 0.2, w * 0.14, h * 0.08, -0.2, 0, TAU); g.fill();
    g.fillStyle = "#2a8a4a"; for (let k = 0; k < 4; k++) { const sx = x - w * 0.14 + k * w * 0.09; g.beginPath(); g.moveTo(sx, y - h * 0.13 + Math.abs(k - 1.5) * h * 0.02); g.lineTo(sx + w * 0.04, y - h * 0.22 + Math.abs(k - 1.5) * h * 0.02); g.lineTo(sx + w * 0.08, y - h * 0.13 + Math.abs(k - 1.5) * h * 0.02); g.fill(); }
    g.strokeStyle = "#3aa85a"; g.lineWidth = 2.5; g.lineCap = "round"; g.beginPath(); g.moveTo(x + w * 0.14, y - h * 0.04); g.lineTo(x + w * 0.22, y - h * (0.08 + Math.sin(t * 12) * 0.04)); g.stroke();
    g.fillStyle = "#101018"; g.beginPath(); g.arc(x + w * 0.22, y - h * 0.22, 1.6, 0, TAU); g.fill();
    g.fillStyle = "#fff"; g.fillRect(x + w * 0.24, y - h * 0.17, 2, 2); g.fillRect(x + w * 0.28, y - h * 0.17, 2, 2);
  },
  alien(w, h, t) {
    g.fillStyle = "#102a20"; g.fillRect(0, 0, w, h);
    const lz = g.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7); lz.addColorStop(0, "rgba(120,255,160,.45)"); lz.addColorStop(1, "rgba(120,255,160,0)"); g.fillStyle = lz; g.fillRect(0, 0, w, h);
    const x = w * 0.46;
    g.fillStyle = "#8aff9a";
    g.beginPath(); g.ellipse(x, h * 0.46, w * 0.17, h * 0.15, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - w * 0.12, h); g.quadraticCurveTo(x, h * 0.6, x + w * 0.12, h); g.fill();
    g.fillStyle = "#081008"; g.beginPath(); g.ellipse(x - w * 0.07, h * 0.47, w * 0.05, h * 0.03, 0.5, 0, TAU); g.ellipse(x + w * 0.07, h * 0.47, w * 0.05, h * 0.03, -0.5, 0, TAU); g.fill();
    g.strokeStyle = "#8aff9a"; g.lineWidth = 2.5; g.lineCap = "round"; const a = -1.2 + Math.sin(t * 8) * 0.4;
    g.beginPath(); g.moveTo(x + w * 0.1, h * 0.72); g.lineTo(x + w * 0.1 + Math.cos(a) * w * 0.2, h * 0.72 + Math.sin(a) * w * 0.2); g.stroke();
  },
  bruja(w, h, t) {
    g.fillStyle = "#2a1a40"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff4c8"; g.beginPath(); g.arc(w * 0.6, h * 0.36, w * 0.24, 0, TAU); g.fill();
    const k = (t * 0.35) % 1.6, x = w * (-0.4 + k * 1.2), y = h * (0.5 - Math.sin(k * 2) * 0.1);
    g.fillStyle = "#120a1a";
    g.fillRect(x - w * 0.22, y + 2, w * 0.44, 2);
    g.beginPath(); g.moveTo(x - w * 0.22, y); g.lineTo(x - w * 0.34, y - 4); g.lineTo(x - w * 0.34, y + 8); g.fill();
    g.beginPath(); g.moveTo(x - w * 0.08, y + 2); g.quadraticCurveTo(x, y - h * 0.16, x + w * 0.06, y + 2); g.fill();
    g.beginPath(); g.arc(x, y - h * 0.16, w * 0.045, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - w * 0.08, y - h * 0.18); g.lineTo(x + w * 0.08, y - h * 0.18); g.lineTo(x + w * 0.02, y - h * 0.32); g.fill();
  },
  sombra(w, h, t) {
    fondoCalido(w, h, "#d8b890");
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 0, w, h);
    const s = h * 0.82;
    persona(w * 0.5, h * 1.02, s, "#050305");
    g.fillStyle = "#050305"; g.fillRect(w * 0.5 - s * 0.24, h * 1.02 - s * 1.14, s * 0.48, 2.5); g.fillRect(w * 0.5 - s * 0.15, h * 1.02 - s * 1.36, s * 0.3, s * 0.22);
    if (t > 1.5 && (t % 3) < 2.7) { g.fillStyle = "#fff"; g.fillRect(w * 0.5 - s * 0.08, h * 1.02 - s * 0.98, 2, 1.5); g.fillRect(w * 0.5 + s * 0.05, h * 1.02 - s * 0.98, 2, 1.5); }
  },
  cuadro(w, h, t) {
    fondoCalido(w, h, "#e0c8a0");
    g.fillStyle = "#6a4020"; g.fillRect(w * 0.2, h * 0.14, w * 0.6, h * 0.62);
    g.fillStyle = "#2a3a4a"; g.fillRect(w * 0.26, h * 0.2, w * 0.48, h * 0.5);
    g.fillStyle = "#e8c8a0"; g.beginPath(); g.ellipse(w * 0.5, h * 0.4, w * 0.12, h * 0.12, 0, 0, TAU); g.fill();
    g.fillStyle = "#1a1010"; g.beginPath(); g.moveTo(w * 0.3, h * 0.7); g.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.7, h * 0.7); g.fill();
    const o = Math.sin(t * 0.9) * 2.2;
    g.fillStyle = "#fff"; g.beginPath(); g.arc(w * 0.46, h * 0.38, 2.4, 0, TAU); g.arc(w * 0.54, h * 0.38, 2.4, 0, TAU); g.fill();
    g.fillStyle = "#101010"; g.beginPath(); g.arc(w * 0.46 + o, h * 0.38, 1.2, 0, TAU); g.arc(w * 0.54 + o, h * 0.38, 1.2, 0, TAU); g.fill();
  },
  oso(w, h, t) {
    fondoCalido(w, h, "#ffe0e8");
    const a = Math.sin(t * 1.5) * 0.06, x = w * 0.5, y = h * 0.64;
    g.save(); g.translate(x, h); g.rotate(a); g.translate(-x, -h);
    g.fillStyle = "#b07850";
    g.beginPath(); g.ellipse(x, y + h * 0.14, w * 0.26, h * 0.22, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(x, y - h * 0.16, w * 0.2, 0, TAU); g.fill();
    g.beginPath(); g.arc(x - w * 0.16, y - h * 0.3, w * 0.08, 0, TAU); g.arc(x + w * 0.16, y - h * 0.3, w * 0.08, 0, TAU); g.fill();
    g.fillStyle = "#e8c8a0"; g.beginPath(); g.ellipse(x, y - h * 0.1, w * 0.09, h * 0.05, 0, 0, TAU); g.fill();
    g.fillStyle = "#1a1010"; g.beginPath(); g.arc(x - w * 0.07, y - h * 0.2, 1.8, 0, TAU); g.arc(x + w * 0.07, y - h * 0.2, 1.8, 0, TAU); g.arc(x, y - h * 0.12, 1.8, 0, TAU); g.fill();
    g.fillStyle = "#ff4a7a"; corazonEn(x, y + h * 0.12, w * 0.08); g.fill();
    g.restore();
  },
  rosas(w, h, t) {
    fondoCalido(w, h, "#ffe8e0");
    g.fillStyle = "#5a8ac8"; g.beginPath(); g.moveTo(w * 0.38, h * 0.62); g.lineTo(w * 0.62, h * 0.62); g.lineTo(w * 0.58, h * 0.9); g.lineTo(w * 0.42, h * 0.9); g.fill();
    g.strokeStyle = "#2f7a3a"; g.lineWidth = 1.5;
    const flores = [[0.36, 0.3], [0.5, 0.24], [0.64, 0.3], [0.43, 0.4], [0.58, 0.4]];
    for (const [fx, fy] of flores) { g.beginPath(); g.moveTo(w * 0.5, h * 0.64); g.lineTo(w * fx, h * fy); g.stroke(); }
    for (const [fx, fy] of flores) { g.fillStyle = "#d81d3f"; g.beginPath(); g.arc(w * fx, h * fy, w * 0.07, 0, TAU); g.fill(); g.strokeStyle = "#8a0a20"; g.lineWidth = 0.8; g.beginPath(); g.arc(w * fx, h * fy, w * 0.035, 0, 5); g.stroke(); g.strokeStyle = "#2f7a3a"; g.lineWidth = 1.5; }
    const k = (t * 0.3) % 1; g.fillStyle = `rgba(216,29,63,${1 - k})`; g.beginPath(); g.ellipse(w * (0.64 + Math.sin(k * 6) * 0.05), h * (0.36 + k * 0.55), 2.5, 1.5, k * 5, 0, TAU); g.fill();
  },
  pandulce(w, h, t) {
    fondoCalido(w, h, "#ffe0b0");
    persona(w * 0.28, h, h * 0.58, "#2a1a1a", 1.0);
    g.fillStyle = "#8a5a3a"; g.fillRect(w * 0.38, h * 0.76, w * 0.58, h * 0.05);
    g.fillStyle = "#f4dcb8"; g.beginPath(); g.ellipse(w * 0.58, h * 0.76, w * 0.14, h * 0.09, 0, Math.PI, 0); g.fill();
    g.strokeStyle = "#c8a078"; g.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(w * (0.58 + k * 0.045), h * 0.76); g.lineTo(w * (0.58 + k * 0.03), h * 0.68); g.stroke(); }
    g.fillStyle = "#fff"; g.fillRect(w * 0.8, h * 0.66, w * 0.1, h * 0.1);
    for (let i = 0; i < 2; i++) { const k = (t * 0.5 + i / 2) % 1; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.84 + i * 3, h * 0.64 - k * h * 0.2); g.quadraticCurveTo(w * 0.82 + Math.sin(k * 6) * 3, h * 0.58 - k * h * 0.2, w * 0.85, h * 0.54 - k * h * 0.2); g.stroke(); }
  },
  tacos(w, h, t) {
    fondoCalido(w, h, "#ffd890");
    persona(w * 0.22, h, h * 0.56, "#2a1a1a", 1.1 + Math.sin(t * 3) * 0.2);
    reflejado(w * 0.78, () => persona(w * 0.78, h, h * 0.52, "#3a2020", 0.6));
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(w * 0.5, h * 0.82, w * 0.24, h * 0.05, 0, 0, TAU); g.fill();
    for (let k = 0; k < 3; k++) { const x = w * (0.38 + k * 0.12); g.fillStyle = "#f2c860"; g.beginPath(); g.arc(x, h * 0.8, w * 0.06, Math.PI, 0); g.fill(); g.fillStyle = k % 2 ? "#c8342a" : "#3aa04a"; g.fillRect(x - w * 0.04, h * 0.77, w * 0.08, 2); }
  },
  loteria(w, h, t) {
    fondoCalido(w, h, "#ffe8c0");
    const gana = (t % 4) > 3;
    persona(w * 0.22, h, h * 0.55, "#2a1a24", gana ? 1.6 + Math.sin(t * 14) * 0.3 : 0.2);
    persona(w * 0.8, h, h * 0.5, "#3a2a1a");
    g.fillStyle = "#8a5a3a"; g.fillRect(w * 0.3, h * 0.78, w * 0.45, h * 0.05);
    for (let k = 0; k < 2; k++) { const x = w * (0.36 + k * 0.2); g.fillStyle = "#fff"; g.fillRect(x, h * 0.62, w * 0.14, h * 0.15); for (let i = 0; i < 4; i++) { g.fillStyle = ["#ff5a5a", "#5a8aff", "#ffd24a", "#5ac85a"][i]; g.fillRect(x + (i % 2) * w * 0.07 + 1, h * 0.63 + Math.floor(i / 2) * h * 0.07, w * 0.06, h * 0.06); } g.fillStyle = "#3a1a0a"; g.beginPath(); g.arc(x + w * 0.035, h * 0.66, 1.3, 0, TAU); g.arc(x + w * 0.105, h * 0.73, 1.3, 0, TAU); g.fill(); }
  },
  gol(w, h, t) {
    g.fillStyle = "#1a2a1a"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#3aa84a"; g.fillRect(w * 0.12, h * 0.22, w * 0.76, h * 0.34);
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.strokeRect(w * 0.14, h * 0.24, w * 0.72, h * 0.3); g.beginPath(); g.moveTo(w * 0.5, h * 0.24); g.lineTo(w * 0.5, h * 0.54); g.stroke();
    const k = (t * 0.5) % 1; g.fillStyle = "#fff"; g.beginPath(); g.arc(w * (0.2 + k * 0.6), h * (0.4 - Math.sin(k * Math.PI) * 0.1), 2, 0, TAU); g.fill();
    const grito = (t % 2) > 1.5, s = h * 0.5, y = h * 1.02 - (grito ? h * 0.08 : 0);
    persona(w * 0.5, y, s, "#0c0e1e", grito ? 1.3 : 0.2);
    if (grito) reflejado(w * 0.5, () => persona(w * 0.5, y, s, "#0c0e1e", 1.3));
  },
  gatocompu(w, h, t) {
    fondoCalido(w, h, "#e8f0ff");
    g.fillStyle = "#3a3a4a"; g.fillRect(w * 0.2, h * 0.36, w * 0.6, h * 0.34);
    g.fillStyle = "#8ac8ff"; g.fillRect(w * 0.24, h * 0.4, w * 0.52, h * 0.26);
    g.fillStyle = "#2a3a5a"; const n = Math.floor(t * 4) % 8; for (let k = 0; k < n; k++) g.fillRect(w * (0.27 + (k % 4) * 0.12), h * (0.44 + Math.floor(k / 4) * 0.06), w * 0.08, 2);
    g.fillStyle = "#5a5a6a"; g.fillRect(w * 0.14, h * 0.7, w * 0.72, h * 0.06);
    const x = w * (0.2 + (Math.sin(t * 0.9) + 1) * 0.3);
    g.fillStyle = "#231820"; g.beginPath(); g.ellipse(x, h * 0.66, w * 0.12, h * 0.05, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(x + w * 0.11, h * 0.6, w * 0.06, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x + w * 0.07, h * 0.57); g.lineTo(x + w * 0.08, h * 0.51); g.lineTo(x + w * 0.11, h * 0.56); g.moveTo(x + w * 0.12, h * 0.56); g.lineTo(x + w * 0.15, h * 0.51); g.lineTo(x + w * 0.16, h * 0.58); g.fill();
    g.strokeStyle = "#231820"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - w * 0.12, h * 0.66); g.quadraticCurveTo(x - w * 0.2, h * (0.56 + Math.sin(t * 3) * 0.04), x - w * 0.16, h * 0.48); g.stroke();
  },
  mudanza(w, h, t) {
    fondoCalido(w, h, "#f0e0c8");
    const cajas = [[0.08, 0.72, 0.3, 0.22], [0.12, 0.52, 0.24, 0.2], [0.62, 0.7, 0.32, 0.24]];
    for (const [x, y, cw, ch] of cajas) { g.fillStyle = "#c89058"; g.fillRect(w * x, h * y, w * cw, h * ch); g.fillStyle = "#e8d8a8"; g.fillRect(w * (x + cw / 2) - 1.5, h * y, 3, h * ch); }
    g.fillStyle = "#e8405a"; corazonEn(w * 0.78, h * 0.8, w * 0.04); g.fill();
    const x = w * (0.42 + Math.sin(t * 1.2) * 0.08);
    persona(x, h, h * 0.58, "#2a2030", 1.5);
    g.fillStyle = "#c89058"; g.fillRect(x - w * 0.02, h * 0.3, w * 0.18, h * 0.14);
  },
  calendario(w, h, t) {
    fondoCalido(w, h, "#fff4e0");
    g.fillStyle = "#fff"; g.fillRect(w * 0.44, h * 0.12, w * 0.46, h * 0.5);
    g.fillStyle = "#e8405a"; g.fillRect(w * 0.44, h * 0.12, w * 0.46, h * 0.08);
    const n = Math.min(11, Math.floor(t * 2.2));
    for (let k = 0; k < 12; k++) {
      const cx = w * (0.48 + (k % 3) * 0.14), cy = h * (0.25 + Math.floor(k / 3) * 0.09);
      if (k === 11) { g.fillStyle = "#e8405a"; corazonEn(cx + w * 0.03, cy + h * 0.02, w * 0.03); g.fill(); continue; }
      g.fillStyle = "#d8d0c8"; g.fillRect(cx, cy, w * 0.07, h * 0.05);
      if (k < n) { g.strokeStyle = "#e8405a"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + w * 0.07, cy + h * 0.05); g.moveTo(cx + w * 0.07, cy); g.lineTo(cx, cy + h * 0.05); g.stroke(); }
    }
    persona(w * 0.24, h, h * 0.6, "#2a1a28", 0.6 + Math.sin(t * 5) * 0.1);
  },
  avioncito(w, h, t) {
    fondoCalido(w, h, "#e8f4ff");
    persona(w * 0.2, h, h * 0.58, "#2a1a28", 0.8);
    const k = (t * 0.45) % 1, x = w * (0.28 + k * 0.72), y = h * (0.45 - Math.sin(k * Math.PI) * 0.22);
    g.fillStyle = "#fff"; g.strokeStyle = "#9ab"; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x + w * 0.1, y); g.lineTo(x - w * 0.06, y - h * 0.04); g.lineTo(x - w * 0.02, y); g.lineTo(x - w * 0.06, y + h * 0.03); g.closePath(); g.fill(); g.stroke();
  },
  foco(w, h, t) {
    const on = (t % 2) > 1;
    if (on) fondoCalido(w, h, "#fff4c0"); else { g.fillStyle = "#2a2a3a"; g.fillRect(0, 0, w, h); }
    const s = h * 0.6, x = w * 0.5, cy = h - s * 0.95;
    persona(x, h, s, on ? "#2a1a1a" : "#12121c", on ? 1.7 : 0.4);
    const by = cy - s * 0.42;
    if (on) { const lz = g.createRadialGradient(x, by, 0, x, by, w * 0.3); lz.addColorStop(0, "rgba(255,240,140,.9)"); lz.addColorStop(1, "rgba(255,240,140,0)"); g.fillStyle = lz; g.fillRect(0, 0, w, h); }
    g.fillStyle = on ? "#ffe860" : "#555"; g.beginPath(); g.arc(x, by, w * 0.07, 0, TAU); g.fill();
    g.fillStyle = "#888"; g.fillRect(x - w * 0.035, by + w * 0.06, w * 0.07, w * 0.05);
  },
  aspiradora(w, h, t) {
    fondoCalido(w, h, "#f0f0ff");
    g.fillStyle = "#d8d0e0"; g.fillRect(0, h * 0.84, w, h * 0.16);
    const k = (t * 0.2) % 1, x = w * (0.2 + (k < 0.5 ? k * 2 : 2 - k * 2) * 0.6);
    g.fillStyle = "#2a2a3a"; g.beginPath(); g.ellipse(x, h * 0.84, w * 0.18, h * 0.05, 0, 0, TAU); g.fill();
    g.fillStyle = Math.sin(t * 6) > 0 ? "#5aff8a" : "#1a5a2a"; g.beginPath(); g.arc(x + w * 0.1, h * 0.83, 1.5, 0, TAU); g.fill();
    g.fillStyle = "#e8a060"; g.beginPath(); g.ellipse(x, h * 0.74, w * 0.09, h * 0.07, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(x + w * 0.05, h * 0.64, w * 0.06, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x + w * 0.01, h * 0.62); g.lineTo(x + w * 0.02, h * 0.56); g.lineTo(x + w * 0.05, h * 0.6); g.moveTo(x + w * 0.06, h * 0.6); g.lineTo(x + w * 0.09, h * 0.56); g.lineTo(x + w * 0.1, h * 0.62); g.fill();
    g.fillStyle = "#101010"; g.fillRect(x + w * 0.03, h * 0.63, 1.5, 1.5); g.fillRect(x + w * 0.07, h * 0.63, 1.5, 1.5);
  },
};

/* Pinta la escena `id` en el contexto 2D `ctx`. */
export function pintarEscena(ctx, id, w, h, t, v = {}) {
  const antes = g; g = ctx;
  try { (DIBUJOS[id] || ((W, Hh) => fondoCalido(W, Hh)))(w, h, t, v); } finally { g = antes; }
}

/* El sonido de cada escena, con las piezas de audio de la ciudad. */
export function sonarEscena(id, piezas) {
  ({ ac, salida, nota, voz, ruido } = piezas);
  if (!ac || !SONIDOS[id]) return;
  try { SONIDOS[id](); } catch (e) { /* sin sonido */ }
}
const SONIDOS = {
  grito() { voz(420, 380, 1.1, 0.14, "sawtooth", 2, 900, 0.2); },
  perro() { voz(500, 260, 0.14, 0.15, "sawtooth", 1.5, 1100, 0.1); voz(500, 260, 0.14, 0.15, "sawtooth", 1.5, 1100, 0.38); },
  guitarra() { const t = ac.currentTime; [196, 246.94, 293.66, 392, 493.88].forEach((f, i) => nota(f, t + i * 0.03, 2.2, 0.05, "triangle")); },
  fiesta() { const t = ac.currentTime; for (let i = 0; i < 8; i++) { nota(60, t + i * 0.25, 0.2, 0.25); nota(i % 2 ? 880 : 660, t + i * 0.25 + 0.12, 0.1, 0.03, "square"); } },
  pastel() { const t = ac.currentTime; [392, 392, 440, 392, 523.25, 493.88].forEach((f, i) => nota(f, t + i * 0.3, 0.4, 0.05, "triangle")); },
  rgb() { const t = ac.currentTime; nota(220, t, 0.6, 0.04, "sawtooth"); nota(330, t + 0.1, 0.6, 0.03, "sawtooth"); },
  gato() { voz(700, 1000, 0.25, 0.06, "triangle", 1, 1200); voz(1000, 600, 0.3, 0.06, "triangle", 1, 1200, 0.25); },
  karaoke() { [0, 0.4, 0.8].forEach((r, i) => voz(330 + i * 40, 300 + i * 70, 0.38, 0.1, "sawtooth", 3, 800, r)); },
  fantasma() { const t = ac.currentTime; const o = ac.createOscillator(), gg = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain(); o.frequency.value = 520; l.frequency.value = 5; lg.gain.value = 30; l.connect(lg).connect(o.frequency); gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(0.06, t + 0.6); gg.gain.linearRampToValueAtTime(0, t + 2.2); o.connect(gg).connect(salida); o.start(t); l.start(t); o.stop(t + 2.3); l.stop(t + 2.3); },
  ojos() { const t = ac.currentTime; nota(55, t, 2.5, 0.12, "sine"); nota(58, t, 2.5, 0.08, "sine"); },
  bebe() { const t = ac.currentTime; [784, 659, 698, 523, 587, 659].forEach((f, i) => nota(f, t + i * 0.35, 0.8, 0.035, "sine")); },
  videojuegos() { const t = ac.currentTime; [523, 659, 784, 1046, 784, 1046].forEach((f, i) => nota(f, t + i * 0.08, 0.1, 0.035, "square")); },
  disco() { const t = ac.currentTime; for (let i = 0; i < 8; i++) { nota(55, t + i * 0.24, 0.18, 0.3); if (i % 2) nota(8000, t + i * 0.24, 0.04, 0.01, "square"); } },
  canario() { for (let i = 0; i < 4; i++) voz(2200, 3200, 0.08, 0.05, "sine", 1, 2600, i * 0.12); },
  trompeta() { const n = [523, 659, 784, 1046]; [0, 0.2, 0.4, 0.8].forEach((r, i) => voz(n[i], n[i], 0.18, 0.08, "sawtooth", 1, 1500, r)); },
  telefono() { const t = ac.currentTime; nota(440, t, 0.2, 0.03); nota(480, t, 0.2, 0.03); },
  tiktok() { const t = ac.currentTime; for (let i = 0; i < 6; i++) nota(i % 2 ? 330 : 440, t + i * 0.15, 0.12, 0.05, "square"); },
  lampara() { const t = ac.currentTime; nota(120, t, 1.2, 0.04, "sawtooth"); },
  pizza() { const t = ac.currentTime; nota(660, t, 0.12, 0.03, "triangle"); nota(880, t + 0.1, 0.18, 0.03, "triangle"); },
  almohadas() { [0, 0.34, 0.68].forEach((r) => ruido(0.16, 320, 0.8, 0.22, r, "lowpass")); },
  mariachi() { const n = [659, 784, 880, 784, 659, 587, 659]; n.forEach((f, i) => voz(f, f, 0.2, 0.07, "sawtooth", 1, 1500, i * 0.22)); const t = ac.currentTime; [196, 246.94, 293.66].forEach((f, i) => nota(f, t + i * 0.02, 1.6, 0.04, "triangle")); },
  pinata() { [0, 0.3, 0.6, 1.1, 1.4, 1.7].forEach((r) => voz(420, 380, 0.16, 0.08, "sawtooth", 2, 900, r)); ruido(0.35, 900, 0.7, 0.25, 2.4); const t = ac.currentTime; [1046, 1318, 1568].forEach((f, i) => nota(f, t + 2.5 + i * 0.08, 0.5, 0.03)); },
  luchador() { ruido(1.2, 1200, 0.4, 0.07, 0, "bandpass"); voz(180, 240, 0.6, 0.08, "sawtooth", 2, 700, 0.2); },
  trastes() { const t = ac.currentTime; [0, 0.28, 0.5, 0.9].forEach((r, i) => nota(2400 + i * 180, t + r, 0.18, 0.03, "triangle")); ruido(0.8, 3000, 0.6, 0.02, 0, "highpass"); },
  planchando() { ruido(0.6, 5000, 0.8, 0.06, 0.3, "highpass"); ruido(0.4, 5000, 0.8, 0.05, 1.3, "highpass"); },
  ronca() { voz(90, 70, 1.0, 0.14, "sawtooth", 2, 380, 0.1); ruido(0.7, 2600, 1, 0.03, 1.2, "highpass"); },
  beso() { ruido(0.05, 2500, 2, 0.25, 0.9); voz(900, 1400, 0.1, 0.05, "sine", 1, 1200, 0.93); },
  espejo() { const t = ac.currentTime; [1568, 2093, 2637].forEach((f, i) => nota(f, t + i * 0.09, 0.6, 0.025)); },
  gatocaja() { SONIDOS.gato(); },
  hamster() { [0, 0.15, 0.3].forEach((r) => voz(2200, 2800, 0.06, 0.04, "sine", 1, 2500, r)); ruido(1.2, 700, 2, 0.02, 0, "bandpass"); },
  loro() { [0, 0.5].forEach((r) => { voz(900, 1300, 0.16, 0.08, "square", 3, 1500, r); voz(1300, 1000, 0.18, 0.08, "square", 3, 1500, r + 0.18); }); },
  miedo() { const t = ac.currentTime; nota(55, t, 2.4, 0.08); nota(58, t, 2.4, 0.06); voz(900, 1300, 0.6, 0.1, "sawtooth", 3, 1400, 2.4); },
  palomitas() { for (let i = 0; i < 10; i++) ruido(0.03, 1800, 3, 0.22, Math.random() * 1.6); },
  pijamada() { [0, 0.14, 0.28, 0.42].forEach((r, i) => voz(520 - i * 20, 480 - i * 20, 0.1, 0.05, "triangle", 2, 1000, r)); },
  robot() { const t = ac.currentTime; [880, 660, 990, 740].forEach((f, i) => nota(f, t + i * 0.16, 0.12, 0.04, "square")); },
  mago() { const t = ac.currentTime; [523, 659, 784, 1046, 1318].forEach((f, i) => nota(f, t + i * 0.07, 0.5, 0.035)); [523, 659, 784].forEach((f) => nota(f, t + 0.55, 0.9, 0.03, "triangle")); },
  malabares() { const t = ac.currentTime; [0, 0.25, 0.5].forEach((r, i) => nota(700 + i * 120, t + r, 0.1, 0.03, "sine")); },
  globos() { voz(700, 1100, 0.2, 0.04, "triangle", 2, 900); voz(900, 1300, 0.2, 0.04, "triangle", 2, 900, 0.3); },
  dj() { const t = ac.currentTime; for (let i = 0; i < 8; i++) nota(55, t + i * 0.22, 0.16, 0.3); voz(200, 900, 0.15, 0.06, "sawtooth", 3, 1200, 0.9); voz(900, 200, 0.15, 0.06, "sawtooth", 3, 1200, 1.05); },
  bateria() { const t = ac.currentTime; for (let i = 0; i < 6; i++) { nota(60, t + i * 0.18, 0.15, 0.3); if (i % 2) ruido(0.1, 1800, 0.8, 0.16, i * 0.18); ruido(0.04, 8000, 1, 0.05, i * 0.18 + 0.09, "highpass"); } ruido(0.7, 7000, 0.6, 0.08, 1.1, "highpass"); },
  violin() { [659, 698, 784, 880, 784].forEach((f, i) => voz(f, f * 1.005, 0.36, 0.05, "sawtooth", 1, 2200, i * 0.36)); },
  piano() { const t = ac.currentTime; [523, 659, 784, 1046, 784, 659, 523].forEach((f, i) => nota(f, t + i * 0.2, 0.9, 0.04, "triangle")); },
  kdrama() { const t = ac.currentTime; [523, 659, 784, 659, 880, 784].forEach((f, i) => nota(f, t + i * 0.3, 1.1, 0.03, "triangle")); },
  dino() { voz(170, 90, 0.8, 0.16, "sawtooth", 1.2, 480, 0.1); },
  alien() { voz(600, 950, 0.8, 0.05, "sine", 1, 900); voz(950, 500, 0.8, 0.05, "sine", 1, 900, 0.8); },
  bruja() { for (let i = 0; i < 6; i++) voz(760 + (i % 2) * 140, 700 + (i % 2) * 140, 0.09, 0.05, "sawtooth", 3, 1300, i * 0.11); },
  sombra() { const t = ac.currentTime; nota(49, t, 2.6, 0.1); nota(52, t + 0.2, 2.4, 0.06); },
  cuadro() { voz(120, 170, 0.9, 0.08, "sawtooth", 8, 300); },
  oso() { const t = ac.currentTime; [784, 988, 1175].forEach((f, i) => nota(f, t + i * 0.12, 0.7, 0.03)); },
  rosas() { const t = ac.currentTime; [1318, 1568, 2093].forEach((f, i) => nota(f, t + i * 0.1, 0.8, 0.025)); },
  pandulce() { const t = ac.currentTime; nota(1046, t, 0.2, 0.025, "triangle"); nota(1318, t + 0.12, 0.3, 0.025, "triangle"); },
  tacos() { ruido(1.2, 6000, 0.5, 0.04, 0, "highpass"); },
  loteria() { [0, 0.16, 0.32, 0.48].forEach((r, i) => voz(380 + i * 30, 360 + i * 30, 0.14, 0.09, "sawtooth", 2, 1000, r)); },
  gol() { ruido(1.8, 1100, 0.4, 0.1, 0, "bandpass"); voz(300, 380, 1.5, 0.1, "sawtooth", 2, 900, 0.1); },
  gatocompu() { for (let i = 0; i < 9; i++) ruido(0.02, 4000, 2, 0.12, i * 0.1); SONIDOS.gato(); },
  mudanza() { ruido(0.16, 220, 1, 0.25, 0.1, "lowpass"); ruido(0.16, 220, 1, 0.2, 0.6, "lowpass"); },
  calendario() { [0, 0.45, 0.9, 1.35].forEach((r) => ruido(0.1, 3200, 2, 0.06, r)); },
  avioncito() { ruido(0.8, 1500, 0.7, 0.07, 0, "bandpass"); },
  foco() { const t = ac.currentTime; nota(1568, t + 1, 0.8, 0.05); nota(2093, t + 1.08, 0.8, 0.035); },
  aspiradora() { voz(110, 116, 2, 0.035, "sawtooth", 1, 600); },
};
