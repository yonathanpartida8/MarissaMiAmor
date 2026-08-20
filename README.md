# Marissa · Mi Amorcito

Un librito de amor interactivo. No es una web con fotos: es un objeto que se
toca, se arrastra, se rasca y se descubre.

Se abre en `index.html`. No hay que compilar nada, ni instalar nada, ni ejecutar
ningún comando: se sube el repositorio a GitHub Pages y funciona.

---

## Cómo está hecho

| Capa | Qué es |
| --- | --- |
| **HTML/CSS moderno** | Módulos ES nativos, sin empaquetador. Cada página tiene su hoja de estilos. |
| **Nueve transiciones** | Ninguna página llega igual que la anterior: volteo de hoja, fundido, travelling, pliegue, diafragma, empuje con paralaje, mancha de tinta, marea y floración. |
| **23 tipos de página** | Ninguna mecánica se repite dos veces seguidas. Y las fotos que él añada se convierten en un tipo más, al final. |
| **WebGL2 + Three.js** | Una sola escena para toda la app: la atmósfera de fondo, el polvo en suspensión y las páginas 3D. Three.js va incluido en `vendor/`, no se descarga de ningún CDN. |
| **GLSL** | Cuatro shaders escritos a mano: niebla, partículas, profundidad y velo. |
| **Canvas 2D** | Texturas de papel y grano generadas al vuelo, superficies que se rascan, lluvia. |
| **Pointer Events** | Un reconocedor de gestos propio: toque, doble toque, pulsación larga, arrastre con inercia y pinza. |

### Sin dependencias externas

Todo lo necesario está en el repositorio. Lo único que se pide fuera es la
tipografía de Google Fonts, y si no llega hay una familia de respaldo
equivalente: el libro se abre igual sin conexión al segundo intento.

---

## Estructura

```
index.html              el único HTML; carga estilos y arranca src/main.js
assets/
  img/                  las 85 ilustraciones
  audio/                música y efectos
images/
  amores/               TUS FOTOS: amor1.png, amor2.png… se vuelven páginas solas
mis-paginas/            TUS páginas: fotos, vídeos y textos que añadas a mano
  paginas.js            la lista (lo único que se edita)
  fotos/  videos/       tus archivos
vendor/three/           Three.js vendorizado (licencia MIT incluida)
src/
  main.js               punto de entrada
  core/                 el motor
    App.js              arranque y coreografía de apertura
    Router.js           qué página se ve y cómo se llega a ella
    Loop.js             UN solo requestAnimationFrame para todo el proyecto
    Gestures.js         el vocabulario táctil
    Pointer.js          dedo + giroscopio, suavizados en un único sitio
    Capabilities.js     de qué es capaz este aparato
    Viewport.js         tamaño real de pantalla, notch, rotación
    AssetLoader.js      cola de imágenes con prioridades
    AudioBus.js         música y efectos
    Haptics.js          vibración
    Store.js            memoria: por dónde iba, qué secretos encontró
    Context.js          la maleta de servicios que recibe cada página
    Emitter.js          bus de eventos
  gl/
    GLStage.js          el único contexto WebGL2
    shaders/            atmosphere · dust · depth · veil
  pages/                UNA CARPETA POR PÁGINA (ver abajo)
    BasePage.js         el contrato común
    registry.js         tipo → módulo (carga perezosa)
  components/           piezas reutilizables
    PhotoFrame.js       CÓMO se enseña cada fotografía (revelado, paralaje, brillo, zoom)
    Sparkles.js         el polvo suspendido de las páginas de papel
    ornaments.js        los ornamentos de los capítulos
    ScratchSurface.js   superficies que se borran con el dedo
    textures.js         papel y grano generados en canvas
  ui/
    UI.js               barra, progreso, pistas y avisos
    Index.js            el índice del libro, por actos
    EdgeNav.js          los botones de los lados y el arrastre
  transitions/          volteo de hoja + efectos de luz
  data/
    chapters.js         LOS TEXTOS (lo único que hay que tocar para cambiarlos)
    photos.js           inventario y reparto de las 85 ilustraciones
    manifest.js         EL ORDEN DEL LIBRO
    custom.js           traduce mis-paginas/paginas.js al formato interno
    amores.js           busca solo las fotos de images/amores/
  styles/               tokens, base y lo común a todas las páginas
  utils/                matemáticas, easing, DOM, aleatoriedad sembrada
```

### Cada página, en su carpeta

Nada de recursos mezclados. Cada tipo de página tiene lo suyo dentro:

```
src/pages/combinacion/
  index.js              la lógica y el DOM
  textos.js             LO QUE DICE  ← lo único que hay que tocar
  estilos.css           cómo se ve
```

Las veinticinco carpetas: `portada · sobre · capitulo · profundidad · rascar ·
polaroids · velo · carrete · escrito · recuerdos · secreto · constelacion ·
final · maquina · postal · petalos · mosaico · combinacion · botella · regalo ·
pulso · distancia · ultima-sorpresa · amor` (más `foto`, `galeria`, `video` y la
hoja compartida `mias/` para las páginas de `mis-paginas/`).

Las que tienen `textos.js` —candado, pulso, secreto, última sorpresa y las
páginas de fotos— se cambian ahí y no hace falta abrir su código para nada.
Las demás siguen leyendo de `src/data/chapters.js`.

---

## Las páginas

Treinta y nueve páginas repartidas en cuatro actos —**Encontrarte, Conocerte,
Extrañarte, Elegirte**— y veintitrés mecánicas distintas. Ninguna se repite dos
veces seguidas. Detrás de todas ellas van las fotos de `images/amores/`, tantas
como él deje ahí.

| Mecánica | Qué hay que hacer |
| --- | --- |
| **Portada** | Mantener el dedo en el lacre hasta que se rompe. La tapa se inclina con el móvil. |
| **Sobre** | Arrastrar el sello de cera; la carta sale y se desdobla. |
| **Máquina de escribir** | El texto se escribe solo, con el ritmo de quien piensa. Manteniendo el dedo va más rápido. |
| **Profundidad 3D** | Inclinar el teléfono: la ilustración tiene fondo (shader de parallax). |
| **Rascar** | Quitar la lámina de plata con el dedo. |
| **Postal** | Arrastrarla para darle la vuelta. Gira en 3D hacia los dos lados, con muelle. |
| **Capítulo** | Papel escrito, y cada uno con un ornamento distinto: **medallón** (foto que se revela), **cristal empañado** (hay que limpiarlo con el dedo, con lluvia y relámpagos), **espejo** (el reflejo va con retraso y te sigue), **brújula** (se toca y gira hasta parar siempre en el mismo sitio) y **susurro** (hay que mantener el dedo para oírlo). |
| **Deshojar** | Arrancar los pétalos uno a uno. Cada uno dice algo al caer. |
| **Polaroids** | Arrastrarlas con inercia; doble toque para ver el reverso. |
| **Velo** | Acariciar la pantalla para retirarlo (shader). |
| **Mosaico** | Girar las piezas hasta armar la imagen. |
| **Carrete de cine** | Deslizar con inercia e imantado; el texto está al final. |
| **Escrito a mano** | Arrastrar hacia abajo y la carta se escribe delante de ti. |
| **Candado** | Girar cuatro ruedas hasta dar con la combinación. |
| **Botella** | Tirar del corcho; el papel sale y se desenrolla. |
| **Campo de recuerdos** | Esfera 3D de fotos: girarla y tocar una. |
| **La nota** | Una nota corriente. Corriente hasta que se tocan las palabras: unas cuantas están marcadas y, al tocarlas, sueltan al margen lo que de verdad querían decir. Nada indica cuáles son. Y hay un lacre en la esquina que, si se mantiene pulsado, se ablanda y confiesa. |
| **Regalo** | Tirar del listón hasta desatarlo. |
| **La distancia** | Acercar dos puntos que se resisten. |
| **Pulso** | Poner el dedo y no quitarlo. El corazón late, la línea lo dibuja y el teléfono vibra con él. No mide nada: es una manera de enseñar cómo se pone. |
| **Constelación** | Unir las estrellas con el dedo. |
| **El cajón** | Seis cosas sobre una mesa y seis maneras distintas de tocarlas: una cerilla que se enciende, un papel que se desdobla en dos tiempos, una llave que se gira, una concha que hay que sostener para oírla, una estrella que se toca dos veces y cae, y un anillo que da vueltas. Cuando están las seis, se juntan. |
| **Final** | Tocar la pantalla: las partículas forman un corazón que late. |
| **Tus fotos** | Cada `amorN.png` que dejes en `images/amores/` es una página más al final: a pantalla completa, sobre su propio desenfoque, tocables y con pellizco para acercar. |

Hay **veintisiete secretos** repartidos. Ninguno se anuncia: se abren al hacer
las cosas de verdad. El contador vive en la barra y el balance sale al final.

### El índice

Con tantas páginas, la barra tiene un botón `☰` que abre el índice: los cuatro
actos —cinco, si hay fotos en `images/amores/`—, por dónde va, y qué páginas
esconden algo. Las que todavía no ha visto salen sin título —sólo el número—
para no reventarle las sorpresas de un vistazo. Puede saltar a cualquiera
igualmente: esto no es un videojuego.

---

## Los textos

Ni una sola frase vive dentro del código. Están en dos sitios, y sólo en dos:

**1 · `src/data/chapters.js`** — los capítulos, las frases sueltas que sueltan
los pétalos y las polaroids, las que aparecen al resolver cada página y el
cierre. Junto y en orden.

**2 · El `textos.js` de cada carpeta** — las páginas con mucho que decir se
llevaron lo suyo dentro:

| Página | Su fichero |
| --- | --- |
| El candado | `src/pages/combinacion/textos.js` (aquí está la **combinación**) |
| El pulso | `src/pages/pulso/textos.js` |
| La nota | `src/pages/secreto/textos.js` (las palabras entre `*asteriscos*` son las que esconden algo) |
| El cajón | `src/pages/ultima-sorpresa/textos.js` |
| Tus fotos | `src/pages/amor/textos.js` |

Cada uno lleva arriba un cartelito diciendo qué es cada campo. Cambiar lo que
dice el libro es editar esos ficheros y nada más.

Algunos campos que quizá quieras tocar:

- `combinacion` en `src/pages/combinacion/textos.js` — la clave del candado.
  Por defecto `1408`; cámbiala por vuestra fecha. A los tres fallos sale la
  pista, a los cinco el candado sopla el número, y a los siete se rinde y se
  abre solo: nunca se queda encallada delante de él.
- `lines` — las frases que reparte una página (un pétalo, una polaroid, una
  estrella). Cuantas más pongas, más hay que descubrir.
- `reveal` — lo que aparece **después** de resolver la interacción.

---

## Las imágenes

Las ochenta y cinco ilustraciones se quedan donde están y con el nombre que
tienen. Para cambiarlas, **sustituye los archivos de `assets/img/`
conservando el nombre** (`imagen1.png`, `imagen2.png`…). No hay que tocar código.

Si quieres cambiar qué imagen sale en qué página, mueve los números en los
grupos de `src/data/photos.js`. Hay una comprobación que avisa por consola si
alguna se queda sin usar o sale dos veces.

Cómo se presentan sí cambió mucho: todas pasan por `PhotoFrame`, que las
revela en tres tiempos (marco → velada → nítida), les da paralaje contra el
marco, un brillo que sigue a la inclinación, sombra que cae al lado contrario
de la luz y pellizco para acercarlas. Tocar ese componente cambia el libro entero.

---

## Tus fotos — la carpeta `images/amores/`

Esto no hay ni que configurarlo. Se dejan ahí las fotos:

```
images/amores/amor1.png
images/amores/amor2.png
images/amores/amor3.png
…
```

y cada una **se convierte sola en una página**, sin tocar ni una línea de
código. Se pueden meter dos hoy y siete el mes que viene: el índice, el
progreso, la navegación y la precarga se ajustan solos.

**Siempre van al final.** Después de la portada, de los cuatro actos, de las
experiencias, de los secretos, del cajón y del cierre. Nunca se cuelan antes de
las páginas principales, hagas lo que hagas.

Cómo quedan: a pantalla completa, sobre un fondo que es la misma foto
desenfocada —así no hay barras negras nunca—, entran desenfocadas y se enfocan
en tres tiempos, las cruza un barrido de luz al llegar, derivan despacio y se
mueven con la inclinación del móvil. Se tocan: sale un corazón donde toques,
dos toques o un pellizco la acercan, y arrastrando la recorres. Sin texto
encima, que la foto es lo importante — si a alguna quieres ponerle una frase,
se escribe en `src/pages/amor/textos.js` con su número.

Dos cosas que hay que respetar y ya está:

- **Numeradas seguidas desde 1.** Si te saltas más de tres seguidas, el libro
  entiende que se acabaron y deja de buscar.
- **La primera manda la extensión.** También valen `.jpg`, `.jpeg` y `.webp`,
  pero es más limpio si todas van igual.

<details>
<summary>Por qué salen unos «404» en la consola (y por qué están bien)</summary>

GitHub Pages sirve archivos y punto: no sabe decir qué hay dentro de una
carpeta. Así que `src/data/amores.js` lo averigua preguntando —`amor1`,
`amor2`, `amor3`…— hasta que se acaban, y las últimas preguntas dejan un aviso
de «no está» en la consola del navegador. Es el precio de que esto funcione sin
servidor. Está exprimido para que sean pocas: la extensión se averigua una sola
vez con `amor1`, se pregunta de ocho en ocho y se para a los tres huecos, así
que son cuatro o cinco avisos, no cientos. Ella no ve nada de esto.

</details>

---

## Tus propias páginas — la carpeta `mis-paginas/`

Para añadir contenido sin entrar en el motor: **fotos, vídeos y textos tuyos**,
en un solo archivo escrito en español.

```js
// mis-paginas/paginas.js
export default [
  {
    tipo: "foto",
    titulo: "Nuestra tarde",
    texto: "Lo que quieras contar.",
    foto: "mis-paginas/fotos/tarde.jpg",
  },
  {
    tipo: "video",
    titulo: "Esto lo grabé para ti",
    video: "mis-paginas/videos/mensaje.mp4",
    poster: "mis-paginas/fotos/caratula.jpg",
  },
];
```

Con eso la página ya está en el libro, en el índice y en el contador de
progreso. Sin compilar, sin instalar, sin tocar `manifest.js` ni `chapters.js`.

- **Tipos rápidos:** `foto` · `galeria` · `video` · `carta`. Y si te quedas con
  ganas, valen también los veintidós del libro (`polaroids`, `mosaico`,
  `rascar`, `postal`, `candado`…).
- **Dónde cae:** por defecto justo antes de la última página, en un acto nuevo
  llamado «Tuyas». Con `donde: "inicio"` o `donde: 12` la colocas donde quieras,
  y entonces adopta el acto de sus vecinas para que el índice se lea seguido.
- **Nada de esto puede romper el libro.** Una página mal escrita se salta con un
  aviso claro en la consola; si el archivo entero tiene un error de sintaxis,
  el libro se abre igual con sus páginas de siempre.
- **Los vídeos no se descargan** hasta que ella le da al play, y se liberan de
  memoria al pasar de página.

Las instrucciones completas, con todos los campos y los fallos habituales, están
en **[`mis-paginas/README.md`](mis-paginas/README.md)**.

---

## Cómo añadir una página desde dentro

Lo de arriba cubre casi todo. Esto es para cuando quieras una página del propio
libro, con su capítulo y su sitio en el manifiesto.

**1. Escribe el capítulo** en `src/data/chapters.js`:

```js
{
  id: "nuevo",
  number: 21,
  title: "El título",
  kicker: "una frase corta",
  text: "Lo que le quieres decir.",
  act: "elegirte",  // encontrarte · conocerte · extranarte · elegirte
  palette: { a: "#ec6f92", b: "#4c1d95", deep: "#10001a" },
  mood: "bloom",   // dawn · night · amber · bloom · storm · glass · winter · cosmos · light
}
```

**2. Añádelo al orden** en `src/data/manifest.js`, donde quieras que aparezca:

```js
{
  id: "nuevo-21",
  type: "chapter",          // cualquier tipo del registro
  chapter: "nuevo",
  photos: groups.nuevoGrupo,
  transition: "ink",        // ver la tabla de abajo
  hint: "la pista, si hace falta",
  secret: "id-del-secreto", // opcional
}
```

### Las nueve maneras de llegar a una página

| `transition` | Cómo entra |
| --- | --- |
| `flip` | La hoja gira sobre su lomo, en 3D. Es la única que **se puede arrastrar** con el dedo. |
| `dissolve` | La anterior se deshace en luz mientras la nueva se condensa. |
| `zoom` | Travelling: la cámara atraviesa una página y aterriza en la siguiente. |
| `fold` | Se pliega sobre sí misma, como una carta que se guarda. |
| `iris` | Diafragma de cámara que se abre desde el centro. |
| `slide` | La nueva empuja a la anterior, que se retrasa y pierde luz: paralaje. |
| `ink` | Cala como una mancha de tinta: tres manchas que crecen a distinto ritmo. |
| `tide` | Sube como la marea, con el borde ondulado que se va calmando. |
| `bloom` | Se abre en el sitio, desenfocada y de más, y se enfoca. |

Están repartidas para que **ninguna se repita en dos páginas seguidas**.

Ya está. La navegación, el índice, el progreso, la precarga, la limpieza de
memoria y la paleta de la atmósfera se ajustan solos. El libro está pensado
para crecer: da igual que sean cuarenta páginas o cuatrocientas.

### Y para inventar un tipo de página nuevo

Se crea una carpeta, `src/pages/mi-pagina/`, con sus tres archivos dentro:

```
src/pages/mi-pagina/
  index.js
  textos.js      (si tiene mucho que decir)
  estilos.css
```

`index.js`:

```js
import { BasePage } from "../BasePage.js";
import { el } from "../../utils/dom.js";
import textos from "./textos.js";

export default class MiPagina extends BasePage {
  static type = "mipagina";

  build() {
    this.root = el("section.page.paper.mipagina");
    // …construye el DOM y devuélvelo
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    // …anima, escucha gestos: this.addGestures(...), this.addTicker(...)
  }
}
```

Y se enchufa en dos sitios: una línea en `src/pages/registry.js`
(`mipagina: () => import("./mi-pagina/index.js")`), otra en `index.html`
(`<link rel="stylesheet" href="src/pages/mi-pagina/estilos.css">`), y ya se
puede usar en el manifiesto.

`BasePage` se encarga de limpiar listeners, gestos, tickers e imágenes cuando la
página se destruye. No hay que acordarse de nada.

---

## Rendimiento

El libro mide el aparato en el que se está abriendo y se adapta:

- **Tres niveles de calidad** (`low` / `mid` / `high`) que deciden resolución,
  número de partículas, desenfoques, grano y pasos de shader.
- **Degradación en caliente**: si los fps bajan de 45 durante dos ventanas
  seguidas, la calidad se recorta sola. La fluidez siempre gana a la vistosidad.
- **Un solo `requestAnimationFrame`** para todo el proyecto, que se detiene por
  completo cuando la pestaña deja de verse.
- **Un solo contexto WebGL**. Dos serían la forma más rápida de que el navegador
  móvil descarte uno.
- **Carga de imágenes con prioridades** y liberación de las que ya no se ven:
  las 85 ilustraciones nunca están todas en memoria a la vez.
- **Módulos perezosos**: el código de la constelación no se descarga hasta que
  hace falta.
- **Las variables CSS recuerdan lo último que se escribió.** Se heredan, así
  que tocar una en la raíz de una página obliga a recalcular el estilo de
  todos sus descendientes; y los relojes de cada página escriben sesenta veces
  por segundo. Escribiendo sólo cuando el valor cambia de verdad —y redondeando
  para que el suavizado converja— el recálculo de estilo con el libro parado
  baja de 30-44 ms por segundo y medio a prácticamente cero.
- **El texto se aplana al terminar de entrar.** Un párrafo se parte en cien
  `<span>` para escribirse palabra a palabra; cuando acaba, los cien vuelven a
  ser un único nodo de texto. En gama baja no se parte siquiera.
- **La atmósfera se dibuja a 30 fps** en gama media y baja. Es fondo: nadie la
  mira fijamente, y es el shader más caro del libro.
- **Sólo tica la página que se ve.** El router mantiene vivas las hojas vecinas
  para que arrastrar responda al instante, pero sus relojes están parados: nadie
  calcula físicas ni partículas para una página que no está en pantalla.
- **Modo ahorro durante las transiciones.** El instante más caro del libro es el
  cambio de página: dos desenfoques a pantalla completa y la atmósfera de fondo a
  la vez. Ahí el lienzo WebGL baja a dos tercios de resolución —invisible,
  porque todo está desenfocado o en marcha— y vuelve a plena calidad al aterrizar.
- **Los desenfoques grandes se pintan pequeños y se estiran.** El fondo de las
  páginas de fotos es la misma imagen desenfocada a pantalla completa, que es de
  lo más caro que existe. Se pinta a un cuarto de tamaño —dieciséis veces menos
  píxeles— y se escala después: se ve idéntico y la página pasa de ir a tirones
  a ser de las más fluidas del libro.
- **La búsqueda de las fotos no retrasa la apertura.** Averiguar cuántas hay en
  `images/amores/` son varias idas y venidas a la red; se lanzan a la vez que se
  descarga la portada y se recogen cuando ésa ya ha terminado, así que salen
  gratis.
- **Movimiento reducido, de verdad.** Si el sistema lo pide, no basta con acortar
  los tokens de duración: hay una regla global que apaga toda animación y
  transición del proyecto, incluidas las que llevan los milisegundos escritos a
  mano. Todo llega igual a su estado final; nada se queda a medio camino.

Y si no hay WebGL, el libro sigue siendo un libro: todas las páginas tienen su
versión en DOM, sin una sola pantalla vacía.

Para depurar se puede forzar el nivel por URL: `index.html?tier=low`.

---

## Pasar de página

Cuatro maneras, todas equivalentes:

1. **Los botones redondos** de los cantos, abajo a izquierda y derecha. Están
   siempre a la vista y caen donde llega el pulgar sin recolocar la mano.
2. **Arrastrar desde el canto**: el botón acompaña al dedo y se enciende al
   pasar el punto de no retorno.
3. **Arrastrar la hoja** por el centro, en las páginas de papel: gira de
   verdad, con muelle e inercia.
4. **El índice** (`☰`), para saltar a cualquier página.

---

## Detalles de móvil

- Áreas seguras (`env(safe-area-inset-*)`) respetadas en todas las páginas: nada
  toca el notch, la Dynamic Island ni la barra de gestos.
- Alto de viewport real, con respaldo para los Safari que no entienden `dvh`.
- Zonas táctiles de 44px como mínimo.
- Zoom por doble toque y por pellizco desactivados, para que el pinch lo puedan
  usar las páginas que lo quieren.
- Sin rebote elástico ni «tirar para recargar».
- **Los bordes siempre pasan de página.** Casi todas las páginas se quedan el
  dedo (la máquina de escribir, el candado, el mosaico, las que se sostienen sin
  soltar…), y eso dejaba al lector encerrado. Ahora hay dos franjas en los cantos
  de la pantalla que escuchan en fase de captura, antes de que ninguna página
  pueda cortar el gesto: no hay página, presente ni futura, de la que no se pueda
  salir arrastrando. Las primeras veces que se llega a una de ellas, las flechas
  se asoman un momento para que se sepa que están ahí.
- **Con el teléfono tumbado, la hoja se tumba con él.** Antes se quedaba
  vertical: una tarjeta de 312 px en una ventana de 844, con los títulos
  partidos en tres líneas y el texto a cinco palabras por renglón. Ahora la
  hoja es apaisada y las páginas se reordenan a dos columnas —la foto a un
  lado, el texto al otro— que es justo para lo que se gira el móvil.
- La tipografía escala respecto a **la hoja**, no a la ventana: al ancho en
  vertical, al alto en apaisado, que es lo que escasea en cada caso.
- La barra flotante no se apoya nunca sobre el texto: los paneles que se
  posan abajo le reservan su hueco (`--bar-space`). No se le suma al relleno
  de la página entera a propósito, para no encoger las superficies con las
  que se juega —el velo, la lámina de rascar, el tablero del mosaico—.
- El giroscopio se pide dentro del primer toque, como exige iOS.
- **Vibración con sustituto, no con hueco.** En Android el libro vibra; en Safari
  de iPhone no hay API que valga, y ahí la página del pulso cambia la vibración
  por un golpe grave muy bajito que se siente casi más que se oye. Ninguna
  página se queda sin respuesta física por el aparato que sea.

---

## Créditos

- [Three.js](https://threejs.org) — MIT, incluido en `vendor/three/`.
- Tipografías: Cormorant Garamond, Caveat y Jost (Google Fonts, SIL Open Font License).
- Las ilustraciones, la música y las palabras: de ellos dos.
