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
| **22 tipos de página** | Ninguna mecánica se repite dos veces seguidas. |
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
  pages/                una clase por tipo de experiencia
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
    EdgeNav.js          los bordes que siempre pasan de página
  transitions/          volteo de hoja + efectos de luz
  data/
    chapters.js         LOS TEXTOS (lo único que hay que tocar para cambiarlos)
    photos.js           inventario y reparto de las 85 ilustraciones
    manifest.js         EL ORDEN DEL LIBRO
    custom.js           traduce mis-paginas/paginas.js al formato interno
  styles/               tokens, base y una hoja por página
  utils/                matemáticas, easing, DOM, aleatoriedad sembrada
```

---

## Las páginas

Treinta y nueve páginas repartidas en cuatro actos —**Encontrarte, Conocerte,
Extrañarte, Elegirte**— y veintidós mecánicas distintas. Ninguna se repite dos
veces seguidas.

| Mecánica | Qué hay que hacer |
| --- | --- |
| **Portada** | Mantener el dedo en el lacre hasta que se rompe. La tapa se inclina con el móvil. |
| **Sobre** | Arrastrar el sello de cera; la carta sale y se desdobla. |
| **Máquina de escribir** | El texto se escribe solo, con el ritmo de quien piensa. Manteniendo el dedo va más rápido. |
| **Profundidad 3D** | Inclinar el teléfono: la ilustración tiene fondo (shader de parallax). |
| **Rascar** | Quitar la lámina de plata con el dedo. |
| **Postal** | Arrastrarla para darle la vuelta. Gira en 3D hacia los dos lados, con muelle. |
| **Capítulo** | Papel escrito, cada uno con su ornamento: medallón, cristal empañado, reflejo, brújula o susurro. |
| **Deshojar** | Arrancar los pétalos uno a uno. Cada uno dice algo al caer. |
| **Polaroids** | Arrastrarlas con inercia; doble toque para ver el reverso. |
| **Velo** | Acariciar la pantalla para retirarlo (shader). |
| **Mosaico** | Girar las piezas hasta armar la imagen. |
| **Carrete de cine** | Deslizar con inercia e imantado; el texto está al final. |
| **Escrito a mano** | Arrastrar hacia abajo y la carta se escribe delante de ti. |
| **Candado** | Girar cuatro ruedas hasta dar con la combinación. |
| **Botella** | Tirar del corcho; el papel sale y se desenrolla. |
| **Campo de recuerdos** | Esfera 3D de fotos: girarla y tocar una. |
| **Secreto** | Sostener el dedo: una linterna que hay que aguantar encendida. |
| **Regalo** | Tirar del listón hasta desatarlo. |
| **La distancia** | Acercar dos puntos que se resisten. |
| **Pulso** | Poner el dedo y no quitarlo mientras late. |
| **Constelación** | Unir las estrellas con el dedo. |
| **Final** | Tocar la pantalla: las partículas forman un corazón que late. |

Hay **veintisiete secretos** repartidos. Ninguno se anuncia: se abren al hacer
las cosas de verdad. El contador vive en la barra y el balance sale al final.

### El índice

Con tantas páginas, la barra tiene un botón `☰` que abre el índice: los cuatro
actos, por dónde va, y qué páginas esconden algo. Las que todavía no ha visto
salen sin título —sólo el número— para no reventarle las sorpresas de un
vistazo. Puede saltar a cualquiera igualmente: esto no es un videojuego.

---

## Los textos

Los treinta y siete capítulos, las frases sueltas que sueltan los pétalos y las
polaroids, las que aparecen al resolver cada página y el cierre: **todo está en
`src/data/chapters.js`**, junto y en orden. Ni una sola frase vive dentro del
código.

Cambiar lo que dice el libro es editar ese fichero y nada más.

Algunos campos que quizá quieras tocar:

- `combination` en el capítulo **La combinación** — la clave del candado.
  Por defecto `1408`; cámbiala por vuestra fecha. Si falla tres veces sale la
  pista (`combinationHint`), y a la sexta la caja se abre igual.
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
  transition: "flip",       // flip · dissolve · zoom · fold · iris
  hint: "la pista, si hace falta",
  secret: "id-del-secreto", // opcional
}
```

Ya está. La navegación, el índice, el progreso, la precarga, la limpieza de
memoria y la paleta de la atmósfera se ajustan solos. El libro está pensado
para crecer: da igual que sean cuarenta páginas o cuatrocientas.

### Y para inventar un tipo de página nuevo

Crea `src/pages/MiPagina.js` extendiendo `BasePage`, regístrala en
`src/pages/registry.js` y úsala en el manifiesto:

```js
import { BasePage } from "./BasePage.js";
import { el } from "../utils/dom.js";

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
- **Sólo tica la página que se ve.** El router mantiene vivas las hojas vecinas
  para que arrastrar responda al instante, pero sus relojes están parados: nadie
  calcula físicas ni partículas para una página que no está en pantalla.
- **Modo ahorro durante las transiciones.** El instante más caro del libro es el
  cambio de página: dos desenfoques a pantalla completa y la atmósfera de fondo a
  la vez. Ahí el lienzo WebGL baja a dos tercios de resolución —invisible,
  porque todo está desenfocado o en marcha— y vuelve a plena calidad al aterrizar.

Y si no hay WebGL, el libro sigue siendo un libro: todas las páginas tienen su
versión en DOM, sin una sola pantalla vacía.

Para depurar se puede forzar el nivel por URL: `index.html?tier=low`.

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
- Vibración en Android; en iOS se ignora en silencio.

---

## Créditos

- [Three.js](https://threejs.org) — MIT, incluido en `vendor/three/`.
- Tipografías: Cormorant Garamond, Caveat y Jost (Google Fonts, SIL Open Font License).
- Las ilustraciones, la música y las palabras: de ellos dos.
