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
  components/           piezas reutilizables (ornamentos, superficie rascable…)
  transitions/          volteo de hoja + efectos de luz
  data/
    chapters.js         LOS TEXTOS
    photos.js           inventario y reparto de las 85 ilustraciones
    manifest.js         EL ORDEN DEL LIBRO
  styles/               tokens, base y una hoja por página
  utils/                matemáticas, easing, DOM, aleatoriedad sembrada
```

---

## Las páginas

Veintidós páginas, y ninguna funciona igual que la anterior.

| # | Página | Qué hay que hacer |
| --- | --- | --- |
| 01 | Portada | Mantener el dedo sobre el lacre hasta que se rompe. La tapa se inclina con el móvil. |
| 02 | El Primer Encuentro | Arrastrar el sello de cera. El sobre se abre y la carta se desdobla. |
| 03 | La Distancia | Inclinar el teléfono: la ilustración tiene profundidad real (shader). |
| 04 | Mi Única Certeza | Rascar la lámina de plata. |
| 05 | El Jardín de Recuerdos | Diez polaroids que se arrastran con inercia y se voltean con doble toque. |
| 06 | La Tormenta | Limpiar el vaho del cristal con el dedo. Llueve y caen relámpagos. |
| 07 | Tus Gestos | Acariciar la pantalla para retirar el velo (shader). |
| 08 | El Espejo | El reflejo va con retraso y te sigue. |
| 09 | Noches de Invierno | Un carrete de catorce fotogramas con inercia e imantado. |
| 10 | Lo Que Viene | Arrastrar hacia abajo: la carta se escribe a mano delante de ti. |
| 11 | Nuestra Conexión | Veinticuatro recuerdos en una esfera 3D. Girar y tocar uno. |
| 12 | Solo Tú | Sostener el dedo: una linterna que hay que aguantar encendida. |
| 13 | Mi Elección | Tocar la brújula. Dé las vueltas que dé, siempre acaba señalando lo mismo. |
| 14 | Estoy Contigo | Unir doce estrellas con el dedo. |
| 15 | Lo Que Siento | Medallón que se revela. |
| 16 | A Mi Manera | Velo, otra vez, con dos ilustraciones. |
| 17 | Amarte en Silencio | Está escrito muy bajito: hay que mantener el dedo para subirle la voz. |
| 18 | Más de lo que parece | Rascar. |
| 19 | Por Nosotros | Medallón. |
| 20 | Crecer Contigo | Profundidad 3D. |
| 21 | Eres Increíble | Ocho polaroids más. |
| 22 | Final | Tocar la pantalla: las partículas se recogen y forman un corazón que late. |

Hay **doce secretos** repartidos. Ninguno se anuncia: aparecen al hacer las
cosas de verdad (romper el sello, mover todas las polaroids, llegar al final del
carrete…). El contador vive en la barra inferior y el balance sale en la última
página.

---

## Cómo añadir una página

Es lo único que hay que saber para ampliar el libro.

**1. Escribe el capítulo** en `src/data/chapters.js`:

```js
{
  id: "nuevo",
  number: 21,
  title: "El título",
  kicker: "una frase corta",
  text: "Lo que le quieres decir.",
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
  transition: "flip",       // flip · dissolve · zoom · fold
  hint: "la pista, si hace falta",
  secret: "id-del-secreto", // opcional
}
```

Ya está. La navegación, el progreso, la precarga, la limpieza de memoria y la
paleta de la atmósfera se ajustan solos.

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
- La tipografía escala respecto al **ancho de la hoja**, no al de la ventana:
  en apaisado son cosas muy distintas.
- El giroscopio se pide dentro del primer toque, como exige iOS.
- Vibración en Android; en iOS se ignora en silencio.

---

## Los textos

Los veinte capítulos están **tal cual fueron escritos**, sin corregir ni una
coma. Las erratas y la forma de hablar son parte de lo que se está regalando.
Si algún día quieres retocarlos, están todos juntos en
`src/data/chapters.js` y no hay que tocar nada más.

---

## Créditos

- [Three.js](https://threejs.org) — MIT, incluido en `vendor/three/`.
- Tipografías: Cormorant Garamond, Caveat y Jost (Google Fonts, SIL Open Font License).
- Las ilustraciones, la música y las palabras: de ellos dos.
