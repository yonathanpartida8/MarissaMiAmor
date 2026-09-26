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
| **Diez transiciones** | Ninguna página llega igual que la anterior: volteo de hoja, fundido, travelling, pliegue, diafragma, empuje con paralaje, mancha de tinta, marea, floración y corazón. |
| **36 tipos de página** | Ninguna mecánica se repite: cada página tiene la suya, y cada una esconde además su propia sorpresa. |
| **WebGL2 + Three.js** | Una sola escena para toda la app: la atmósfera de fondo, el polvo en suspensión y las páginas 3D. Three.js va incluido en `vendor/`, no se descarga de ningún CDN. |
| **GLSL** | Cuatro shaders escritos a mano: niebla, partículas, profundidad y velo. |
| **Canvas 2D** | Texturas de papel y grano generadas al vuelo, superficies que se rascan, lluvia. |
| **Pointer Events** | Un reconocedor de gestos propio: toque, doble toque, pulsación larga, arrastre con inercia y pinza. |

### Sin dependencias externas

Todo lo necesario está en el repositorio. Lo único que se pide fuera es la
tipografía de Google Fonts, y si no llega hay una familia de respaldo
equivalente: el libro se abre igual sin conexión al segundo intento.

---

## Instalarlo en el teléfono

Se puede añadir a la pantalla de inicio y se abre a pantalla completa, sin
barras del navegador, como una aplicación. Y una vez instalado se abre **sin
internet**, porque guarda su propia copia.

- **Android (Chrome):** menú ⋮ → «Instalar aplicación».
- **iPhone (Safari):** botón de compartir → «Añadir a pantalla de inicio».

También hay un botón que lo explica dentro del libro: se abre el índice (☰) y
está en el pie, junto al de empezar de cero.

### El icono

Se deja caer cualquier imagen en la carpeta **`icono/`** con el nombre
`icono.png` —también vale `.jpg`, `.jpeg`, `.webp` o `.svg`— y ya está. No hay
que preparar tamaños ni tocar una línea de código: el libro la busca al
arrancar, la recorta cuadrada por el centro y rehace el manifiesto con las
medidas que pide cada sistema, más una versión con aire por los lados para el
recorte redondo de Android.

Ahora mismo hay puesta una copia de la portada; para cambiarla basta con subir
otra `icono/icono.png`. Consejo: cuadrada y con lo importante en el centro, de
512×512 para arriba.

### Empezar de cero

En el mismo pie del índice. Avisa dos veces —el segundo toque dice exactamente
qué se pierde— y borra las tres cosas que guardan estado: la memoria del libro,
la de la noche estrellada y la copia guardada para abrirlo sin internet.

---

## Cómo empieza: dos páginas y un candado

El libro se abre con **`paginas-html/inicio.html1.html`** e
**`inicio.html2.html`**, dos páginas HTML tuyas (se cambian enteras sin tocar
nada más). Justo después hay un **candado de fecha**: hasta que no se pone
**23 · ago · 2025** no se puede pasar, ni deslizando, ni con las flechas, ni
con la barra, ni desde el índice. Al abrirse pasa sola a la portada y ya no se
vuelve a pedir.

Hay un **segundo candado** dentro del libro («Sólo tú sabes abrirlo») que
funciona igual: tampoco deja pasar de él hasta poner la fecha. En el índice,
lo que queda detrás de un candado cerrado sale con 🔒.

Las fechas están en `src/pages/puerta/textos.js` y
`src/pages/combinacion/textos.js`. Ninguno de los dos se abre solo ni se
rinde: lo único que crece con los intentos es la ayuda (dos pistas y, al
final, marcar qué rueda ya está bien).

---

## Publicar y mantenerlo

No hace falta instalar nada. Dos acciones de GitHub hacen el trabajo solas a
cada subida:

| Acción | Qué hace |
| --- | --- |
| **Lista de contenido** (`.github/workflows/contenido.yml`) | Rehace `src/data/contenido.js`: la lista de fotos, vídeos, páginas HTML y sonidos que hay en las carpetas. Gracias a ella el libro **nunca pide un archivo que no existe** (cero «404») y funciona igual abierto como archivo en el móvil. |
| **Verificar el libro** (`.github/workflows/verificar.yml`) | Revisa que cada página tenga su tipo, su texto, sus fotos y su sorpresa, que las fechas de los candados existan, que no falte ningún archivo enlazado y que todo el código se pueda leer. Si algo falla, la subida sale con una cruz roja y el registro dice qué y dónde. |

En el ordenador se pueden lanzar a mano:

```
node herramientas/contenido.mjs     # rehace las listas
node herramientas/verificar.mjs     # revisa el libro entero
```

---

## Estructura

```
index.html              el único HTML; carga estilos y arranca src/main.js
assets/
  audio/                música y efectos
fotos-paginas/          LAS FOTOS: una carpeta por página (imagen1, imagen2…)
icono/icono.png         el icono de la app
sorpresas/              fotos propias para las sorpresas (opcional)
images/
  amores/               TUS FOTOS: amor1.png, amor2.png… se vuelven páginas solas
paginas-html/           TUS PÁGINAS HTML: página.html1.html, …2.html… idem
mis-paginas/            TUS páginas: fotos, vídeos y textos que añadas a mano
  paginas.js            la lista (lo único que se edita)
  fotos/  videos/       tus archivos
mis-vales/vales.txt     LOS VALES de «Vales de amor», uno por línea
mis-sonidos/            sonidos propios: corazón.mp3 (el latido de «Mi pulso»)
noche-estrellada/       la escena final (bosque, cabaña, cacería)
herramientas/
  contenido.mjs         rehace la lista de lo que hay en las carpetas
  verificar.mjs         revisa el libro entero antes de publicar
.github/workflows/      las dos acciones que hacen eso solas a cada subida
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
    Sorpresa.js         la sorpresa escondida de cada página
    ScratchSurface.js   superficies que se borran con el dedo
    textures.js         papel y grano generados en canvas
  ui/
    UI.js               barra, progreso, pistas y avisos
    Index.js            el índice del libro, por actos
    EdgeNav.js          los botones de los lados y el arrastre
    Extras.js           álbum de sorpresas, notita del día y corazoncitos
  transitions/          volteo de hoja + efectos de luz
  data/
    chapters.js         LOS TEXTOS de cada página
    fotos.js            qué carpeta de fotos-paginas/ usa cada página
    sorpresas.js        las 46 sorpresas: frase y escena de cada página
    razones.js          las cien razones por las que te amo
    paletas.js          los trece colores del libro
    contenido.js        GENERADO: lo que hay en las carpetas (sin 404)
    escondidos.js       lo que dicen los ocho escondites
    manifest.js         EL ORDEN DEL LIBRO
    custom.js           traduce mis-paginas/paginas.js al formato interno
    amores.js           las fotos de images/amores/, según la lista
    paginas-html.js     los archivos de paginas-html/, según la lista
  styles/               tokens, base, entradas y lo común a todas las páginas
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

Cincuenta y una páginas repartidas en cuatro actos —**Encontrarte,
Conocerte, Extrañarte, Elegirte**—, cada una con su mecánica. Delante van las
dos de inicio y el candado; detrás, las páginas HTML de `paginas-html/`, las
fotos de `images/amores/` y, al final de todo, la noche estrellada.

El orden del libro es siempre éste, y no se mezcla nunca:

```
[ inicio 1 · inicio 2 · candado ]  [ portada · … · tus vídeos y fotos · el final ]
  [ paginas-html/ ]  [ images/amores/ ]  [ la noche estrellada ]
```

| Mecánica | Qué hay que hacer |
| --- | --- |
| **Portada** | Mantener el dedo en el lacre hasta que se rompe. La tapa se inclina con el móvil. |
| **Sobre** | Arrastrar el sello de cera; la carta sale y se desdobla. |
| **Máquina de escribir** | El texto se escribe solo, con el ritmo de quien piensa. Manteniendo el dedo va más rápido. |
| **Profundidad 3D** | Inclinar el teléfono: la ilustración tiene fondo (shader de parallax). |
| **Rascar** | Quitar la lámina de plata con el dedo. |
| **Postal** | Arrastrarla para darle la vuelta. Gira en 3D hacia los dos lados, con muelle. |
| **Capítulo** | Papel escrito, y cada uno con un ornamento distinto: **medallón** (foto que se revela), **cristal empañado** (hay que limpiarlo con el dedo, con lluvia y relámpagos), **espejo** (el reflejo va con retraso y te sigue), **brújula** (se toca y gira hasta parar siempre en el mismo sitio), **susurro** (hay que mantener el dedo para oírlo), **onda de voz** (mantener el dedo y la voz se dibuja mientras aparece el texto) y **velita** (se enciende al tocarla). |
| **Deshojar** | Arrancar los pétalos uno a uno. Cada uno dice algo al caer. |
| **Polaroids** | Arrastrarlas con inercia; doble toque para ver el reverso. |
| **Velo** | Acariciar la pantalla para retirarlo (shader). |
| **Mosaico** | Girar las piezas hasta armar la imagen. |
| **Carrete de cine** | Deslizar: una foto por gesto, con el desplazamiento propio del teléfono. Flechas propias y la foto del centro se abre en grande al tocarla. El texto está al final. |
| **Pines** (dos páginas: «Pines que me recordaron a ti» y «Pines que te dedico») | Un tablero de Pinterest que se pasa con el dedo: cada foto es un pin clavado con su chincheta, un poco torcido, y el del centro se endereza y crece. Tocarlo lo abre en grande; **doble toque lo guarda** (sale el corazón rojo, y el libro se acuerda). Al final, la carta. Cada página lee las fotos de su carpeta. |
| **Mi norte** | Una brújula antigua de latón con su rosa de los vientos. La esfera se gira con el dedo (con inercia) y tu foto, en un medallón, se puede arrastrar a cualquier sitio: la aguja la busca, se pasa, vuelve y se queda temblando hacia ella. Cada letra, tocada, dice lo que significa (N de «nunca me pierdo»…). Si se gira muy rápido, la aguja se marea… y aun así acaba en ella. |
| **Escrito a mano** | Arrastrar hacia abajo y la carta se escribe delante de ti. |
| **Candado** | Girar las tres ruedas (día, mes, año) hasta dar con la fecha. No deja pasar de página hasta abrirlo. |
| **Botella** | Tirar del corcho; el papel sale y se desenrolla. |
| **Campo de recuerdos** | Esfera 3D de fotos: girarla y tocar una. |
| **Lo que no se ve de primeras** | Una carta de verdad: papel rayado con su margen rojo, cinta en las esquinas, la fecha, «Para Marissa», una florecita prensada y una mancha de café. Hay palabras que esconden algo: al tocarlas quedan **rodeadas con un círculo a mano** y lo que querían decir se escribe al margen. Abajo hay una **linterna**: encendida, al pasar el dedo por la carta aparecen frases escritas con **tinta invisible**. Y el lacre de la esquina, mantenido, se ablanda y confiesa. |
| **Regalo** | Del nudo cuelgan dos colas del listón que son cuerdas de verdad: pesan, se mecen y rebotan. Se tira de la derecha: se estira, el lazo se aprieta y la caja se inclina hacia el tirón. Cuando cede, los lazos salen volando, la tapa se abre con una bisagra que rebota y cae confeti que gira y planea. |
| **La distancia** | Un mapa de papel con «tú» y «yo» en los extremos, una ruta punteada y un avioncito de papel que va y viene. Al arrastrar uno hacia el otro **el mapa se dobla en acordeón** (en 3D, con luz y sombra en cada pliegue) y los kilómetros bajan. Cuesta: si se suelta antes de tiempo, el papel se vuelve a abrir con un rebote. Cuando se tocan, se funden en un corazón y sale la carta. |
| **Pulso** | Poner el dedo y no quitarlo. El corazón late, la línea lo dibuja, el teléfono vibra con él y **cada latido suena** (`corazón.mp3` si lo subes a `mis-sonidos/`; si no, un «pum-pum» hecho por el libro). No mide nada: es una manera de enseñar cómo se pone. |
| **Constelación** | Unir las estrellas con el dedo. |
| **El cajón** | Un cajón de madera con su forro de terciopelo y su tirador de latón, que se abre al llegar. Seis cosas y seis maneras de tocarlas: la huella de un beso (un toque), una carta (dos), un mechón (desenrollarlo), un corazón (sostenerlo), una estrella (doble toque) y un anillo (uno). Cada una encontrada lleva su etiquetita a mano. Si se va a medias y vuelve, lo que ya encontró se queda. |
| **Razones** | Un mazo de **cien** cartas «razones por las que te amo». Se lanzan con el dedo (o tocando); con **doble toque** se guarda una (le sale un sello) y al final se pueden repasar sólo las guardadas. El libro se acuerda de por cuál iba, dice algo en la 25, la 50 y la 75, y al final se puede barajar. Las razones están en `src/data/razones.js`. |
| **Vales de amor** | Una libretita de vales que se arrancan. Al arrancar el último aparece el vale dorado. **Los vales se cambian en `mis-vales/vales.txt`** (uno por línea; el dorado en la línea que empieza por `dorado:`). |
| **Nuestras manos** | Dos manos dibujadas a una sola línea, con un hilo rojo entre los meñiques. Se arrastra la tuya hacia la mía (la mía también se acerca al final); por el camino salen frases y, al tocarse, hay un destello y ondas como un latido. Si se quedan juntas tres segundos se dibuja un corazón. Mi mano saluda si se toca tres veces. |
| **Farolitos** | Cada toque en el cielo suelta un farolito con un deseo. La luna, tocada tres veces, suelta el dorado. |
| **Burbujas** | Cada burbuja que revienta suelta una palabra de la frase, hace **pop** (un chasquido de aire y un «blup»; las grandes, más graves) y suelta gotitas. Si se revientan seguidas, cada una suena un poquito más aguda: da gusto encadenarlas. |
| **Dos relojes** | Tu hora y la mía. Se gira la manecilla larga del tuyo (una vuelta, una hora) hasta las 8:23, como nuestro 23 del 8: los dos relojes se juntan en uno y los segunderos laten a la vez. Si se deja en las 3:00, sale la luna. |
| **Frasco de notitas** | Tocar el frasco: se sacude y sale una notita que se despliega. |
| **Caminar juntos** | Deslizar hacia arriba por un camino: quedan dos pares de huellas lado a lado y dos lucecitas al frente. En el tramo difícil, con piedras, sólo quedan unas huellas más hondas («te cargo yo»). Al llegar, la banquita del final se puede tocar. |
| **Aunque esté oscuro** | Un mar de noche y un faro. Se mueve la luz con el dedo hasta alumbrar al barquito perdido; enciende su farolito y navega hasta la orilla siguiendo la luz. El faro, tocado tres veces, parpadea: te a-mo. |
| **Lo que te prometo** | Una tarjetita por promesa con su lacre: se deja el dedo hasta llenar el anillo, se estampa un corazón en la cera y la tarjeta se guarda en el cofrecito. Al final aparece una más, boca abajo. |
| **Un día cualquiera contigo** | Deslizar de la mañana a la noche sobre una casita: amanece, sale el humo del café, se encienden las ventanas, sale la luna. A cada rato le toca una cosa pequeña de las que quiero contigo. De noche, tres toques a la luna y cruza una estrella fugaz. |
| **Final** | «Esto no se acaba aquí». Tocar la pantalla: miles de partículas forman un corazón que late (ahora se ve entero en cualquier pantalla), cruzan estrellas fugaces, y la carta del cierre se va diciendo párrafo a párrafo en su propio cristal, con la firma y un «continuará…». El botón «seguir» pasa a lo que venga después. |
| **Tus páginas HTML** | Cada `página.htmlN.html` que dejes en `paginas-html/` es una página más: tu HTML entero, con sus botones, sus animaciones y su JavaScript, encajado en la hoja del libro. Ver [`paginas-html/LÉEME.md`](paginas-html/LÉEME.md). |
| **Tus fotos** | Cada `amorN.png` que dejes en `images/amores/` es una página más al final: a pantalla completa, sobre su propio desenfoque, tocables y con pellizco para acercar. |

Hay **treinta y ocho secretos** repartidos. Ninguno se anuncia: se abren al hacer
las cosas de verdad. El contador vive en la barra y el balance sale al final.

### Y aparte, ocho escondites

Los secretos hay que encontrarlos para terminar una página. Los **escondites**
no: no cuentan para nada, no bloquean nada y probablemente no aparezcan nunca.
Están para el día que se le ocurra tocar donde no toca. Ninguno se repite y
todos van de lo mismo — dos personas lejos que se las apañan:

| Dónde | Qué hay que hacer |
| --- | --- |
| **Portada** | Tres toques en el borde de abajo de la tapa (no en el lacre). |
| **Cualquier capítulo** | Doble toque en el número del capítulo. Cada uno de los ocho dice una cosa distinta. |
| **Postal** | Mantener el dedo en el sello hasta que le cae el matasellos. |
| **Carrete** | Seguir tirando hacia atrás cuando ya está el primer fotograma. |
| **Candado** | Marcar `0000` dando la vuelta entera a las cuatro ruedas. |
| **La distancia** | Separar los dos puntos en vez de juntarlos. |
| **Pulso** | Cuando ya salió la frase, debajo del corazón se lee **«Besa tus dos dedos y ponlos para ver mi pulso»**. Con **dos dedos** a la vez (o tocando esa línea) el corazón se dispara hasta **420 latidos por minuto**, la página se sonroja, y sale un diálogo: «¡Jhsusbsy 😭 me chivié!». Al final, «otro besito» lo repite. Los textos están en `src/pages/pulso/textos.js`. |
| **Final** | No soltar la pantalla cuando el corazón ya está formado. |

Lo que dicen está todo junto en **`src/data/escondidos.js`**, que es el fichero
que hay que abrir para cambiarlos por lo vuestro — son los que más se notan si
suenan a algo que pasó de verdad.

Además, cada página tiene los suyos propios dentro de su carpeta: la nota
esconde frases en las palabras marcadas y un lacre que se ablanda, y el cajón
suelta una luciérnaga si se toca tres veces el hueco vacío.

### Una sorpresa en cada página, y su álbum

Aparte de todo lo anterior, **cada página esconde una sorpresa distinta** (46
en total): una tarjetita con su frase y su escena. Las páginas de pareja
(manos, relojes, caminar juntos, el faro, las promesas y un día cualquiera)
no la llevan a propósito: van sin emojis y guardan su secreto dentro de la
propia escena. En `manifest.js` llevan `sorpresa: false`. La manera de encontrarla
cambia de una página a la siguiente —una estrellita escondida, tocar tres
veces el título, dejar el dedo en las letras de arriba, tocar una esquina o
tamborilear— y si tarda en dar con ella sale una pista, una sola vez.

Las frases y las escenas están en `src/data/sorpresas.js`. Para poner una
**foto tuya** en la sorpresa de una página, se sube a `sorpresas/` con el
nombre de la página (por ejemplo `sorpresas/tu-voz.jpg`).

En el índice está el **Álbum de sorpresas**: las encontradas con su escena y
su frase, las que faltan con la página donde se esconden, y una barra de
progreso. Tocar cualquiera lleva a su página.

### La notita del día y los corazoncitos

Al abrir el libro aparece un sobrecito arriba a la derecha con **una notita
distinta cada día** (31 mensajes, en `src/ui/Extras.js`). Y cada toque en un
hueco libre deja un corazoncito que sube.

### El índice

Con tantas páginas, la barra tiene un botón `☰` que abre el índice: los cuatro
actos —cinco, si hay fotos en `images/amores/`—, por dónde va, y qué páginas
esconden algo. Las que todavía no ha visto salen sin título —sólo el número—
para no reventarle las sorpresas de un vistazo. Puede saltar a cualquiera
igualmente: esto no es un videojuego.

### Los colores

Cada capítulo dice de qué color es con un nombre de `src/data/paletas.js`, y
hay trece, todos de la misma familia: **amanecer, rubor, seda, nácar,
melocotón, azúcar, brasa, latido, lila, ciruela, medianoche, vino y
granate**. Las lavandas (lila, ciruela, medianoche) están para que el libro
no sea un solo rojo de principio a fin: las páginas de noche y de cielo
—el mismo cielo, la distancia, el faro— respiran mejor en violeta, y las
cálidas —la brújula, los farolitos— van en durazno. Para cambiarle el color
a una página basta con escribir otro nombre en su `palette` de `chapters.js`.

De noche, la luz de los velos ya no se quema: por encima de cierto brillo
sube a la mitad de ritmo, así que los acentos claros no dejan una mancha
blanca detrás de los títulos. En pastel, los paneles de cristal son ciruela
en vez de negros.

El texto va alineado a la izquierda y no justificado (en un teléfono,
justificar sin guiones abre ríos de espacios), los títulos reparten sus
palabras en líneas parejas y los párrafos evitan dejar una palabra sola en
la última línea.

### El sonido

La música de fondo **se aparta sola** cada vez que suena otra cosa —pasar
página, abrir un sobre, el corazón, las burbujas— y vuelve con un fundido al
terminar. Si suenan varias cosas seguidas, se queda baja hasta que acaba la
última. Funciona también en iPhone: publicado, la música pasa por un control
de volumen de WebAudio, porque Safari no deja cambiarle el volumen a un
`<audio>`.

### Las dos habitaciones

En la barra, junto al `☰`, hay un botón que alterna entre dos modos (el
claro se quitó):

| | | |
|---|---|---|
| 🌸 | **Pastel** | el rubor de la tarde |
| 🌙 | **Noche** | la lámpara encendida y nadie más despierto |

No son dos paletas ni dos interfaces: **los colores de cada capítulo mandan
en los dos**. Un capítulo «vino» es vino de día y es vino de noche. Lo que
cambia es la habitación donde está el libro, no el libro.

La primera vez se abre en el modo que prefiera su teléfono (pastel si usa modo
claro, noche si usa oscuro); a partir de ahí, en el que ella elija. La
elección se guarda con lo demás.

La barra de abajo no sale sola: se abre y se cierra con la pestañita **︿** del
centro, y el libro recuerda cómo la dejó. Los botones ‹ › de los lados
funcionan siempre.

Lo que hace que cambiar de habitación sea de verdad y no un filtro encima:

- **El fondo cambia de forma de pintar.** La niebla del libro es un shader que
  *suma* luz sobre un color casi negro, que es como se dibuja algo que brilla
  en la oscuridad. En pastel los mismos velos *tiñen* en vez de sumar —de
  linterna a vidriera— y se mueven exactamente igual.
- **El papel, la tinta, la barra y su texto se recalculan enteros.** Salen del
  color del capítulo y de la habitación, en `src/utils/luz.js`, y llegan al
  resto del libro como tokens de CSS (`--text`, `--text-soft`…). Las páginas
  que ponen letra sobre el fondo usan esos tokens, así que se leen igual de
  bien en pastel (letra oscura) que en noche (letra clara).

Para tocarlos está `src/utils/temas.js`. El modo claro sigue descrito ahí,
pero fuera de la rueda (`ORDEN`): quien lo tuviera guardado pasa a pastel.

---

## Los textos

Ni una sola frase vive dentro del código. Están en tres sitios, y sólo en tres:

**1 · `src/data/chapters.js`** — los capítulos, las frases sueltas que sueltan
los pétalos y las polaroids, las que aparecen al resolver cada página y el
cierre. Junto y en orden.

**2 · `src/data/escondidos.js`** — lo que dicen los ocho escondites.

**Y dos carpetas para cambiar cosas sin tocar código:**

- **`mis-vales/vales.txt`** — los vales de «Vales de amor», uno por línea.
- **`mis-sonidos/`** — `corazón.mp3`, el latido de «Mi pulso». Ver
  `mis-sonidos/LÉEME.md`.

**3 · El `textos.js` de cada carpeta** — las páginas con mucho que decir se
llevaron lo suyo dentro:

| Página | Su fichero |
| --- | --- |
| El candado | `src/pages/combinacion/textos.js` (aquí está la **combinación**) |
| El pulso | `src/pages/pulso/textos.js` |
| La nota | `src/pages/secreto/textos.js` (las palabras entre `*asteriscos*` son las que esconden algo) |
| El cajón | `src/pages/ultima-sorpresa/textos.js` |
| Las cien razones | `src/data/razones.js` |
| Tus fotos | `src/pages/amor/textos.js` |

Cada uno lleva arriba un cartelito diciendo qué es cada campo. Cambiar lo que
dice el libro es editar esos ficheros y nada más.

Algunos campos que quizá quieras tocar:

- `fecha` en `src/pages/combinacion/textos.js` y en `src/pages/puerta/textos.js`
  — la fecha de cada candado, como `"23-08-2025"`. Ninguno se abre solo: a los
  tres fallos sale una pista, a los seis otra, y a los nueve el candado marca
  qué rueda ya está bien puesta.
- `lines` — las frases que reparte una página (un pétalo, una polaroid, una
  estrella). Cuantas más pongas, más hay que descubrir.
- `reveal` — lo que aparece **después** de resolver la interacción.

---

## Las imágenes

Cada página con fotos tiene **su propia carpeta** dentro de
**`fotos-paginas/`**, numeradas en el orden del libro:

```
fotos-paginas/01-portada/imagen1.png
fotos-paginas/06-recuerdos/imagen1.png … imagen8.png
fotos-paginas/11-pines-que-me-recordaron-a-ti/imagen1.png … imagen10.png
fotos-paginas/11b-pines-que-te-dedico/imagen1.jpg …   ← (vacía: sube aquí tus pines)
```

- **Cambiar una foto:** se sube otra a esa carpeta con el **mismo nombre**.
  Vale `.png`, `.jpg`, `.jpeg`, `.webp` y `.gif`.
- **Poner más o menos:** se añaden `imagen9`, `imagen10`… o se borran. La
  página enseña las que haya, en orden; las de una sola foto usan `imagen1`.

Qué carpeta usa cada página está en `src/data/fotos.js`, y qué hay en cada
carpeta lo sabe la lista de contenido, que GitHub rehace sola. La tabla con
todas las carpetas está en [`fotos-paginas/LÉEME.md`](fotos-paginas/LÉEME.md).

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

- **Numeradas:** `amor1`, `amor2`… salen en ese orden. Si te saltas un número
  no pasa nada.
- Valen `.png`, `.jpg`, `.jpeg`, `.webp` y `.gif`.

<details>
<summary>Por qué ya no salen «404» en la consola</summary>

GitHub Pages no sabe decir qué hay dentro de una carpeta. Antes el libro lo
averiguaba pidiendo `amor1`, `amor2`… hasta que fallaban, y cada fallo era un
«404». Ahora hay una lista (`src/data/contenido.js`) que GitHub rehace sola a
cada subida, y el libro sólo pide lo que está en ella.

</details>

---

## Tus páginas HTML — la carpeta `paginas-html/`

Igual de simple que la de las fotos: se deja el archivo y aparece.

```
paginas-html/
    página.html1.html
    página.html2.html
    página.html3.html
```

Salen **en orden numérico**, después del final del libro y antes de las fotos
de `images/amores/`. Empieza por el `1`; puedes saltarte un número (con la 1,
la 2 y la 4 salen las tres); y la tilde da igual, vale también
`pagina.html1.html`.

Dentro va **lo que quieras**: botones, animaciones, CSS, JavaScript, audio,
imágenes, un juego pequeño. Se muestra dentro de su propia hoja, aislado del
resto: nada de lo que escribas puede romper el libro, y nada del libro se te
cuela dentro.

**Cómo se llama tu página**: ponle un `<title>` y ése será su nombre en la
barra y en el índice.

**El sonido**: si tu página suena, la música del libro baja sola y vuelve
despacio al terminar (lo hace `paginas-html/sonido-libro.js`). La canción de
la caja de música es `paginas-html/ojos.mp3`, y las del tocadiscos van en la
carpeta `tocadiscos musica/` como `musica1.mp3` … `musica5.mp3`. Las de la radio, en `la radio/` como `music1.mp3`, `music2.mp3`… (las que quieras).

**Los colores del libro, si los quieres**: `var(--acento)`, `var(--papel)`,
`var(--texto)`, `var(--tipo-titulo)`, `var(--hueco-barra)`… la lista entera
está en [`paginas-html/LÉEME.md`](paginas-html/LÉEME.md).

**Cómo se pasa de página**: deslizando, igual que en el resto. El barrido
funciona por encima de tu página, pero si el dedo empieza sobre un botón, un
enlace, un campo, un `<canvas>` o algo marcado con `data-claim-drag`, el gesto
es tuyo entero.

<details>
<summary>Por qué un iframe, y qué resuelve eso</summary>

Pegar el HTML directamente en la página era la opción obvia y es la mala:

1. **Se pisarían.** Un archivo tuyo que declare `body { background: white }` o
   una clase `.page` reventaría el libro entero desde dentro.
2. **No habría manera de apagarlo.** Un `<script>` pegado en el documento deja
   intervalos, `requestAnimationFrame`, escuchas en `window`, audio sonando y
   contextos de WebGL abiertos. Quitar el nodo no para nada de eso: a las tres
   páginas tendrías tres bucles corriendo a la vez para nadie.

Un documento aparte resuelve las dos. Y por eso **no tienes que liberar nada a
mano**: al pasar de página el libro descarga el documento entero y con él se
van sus relojes, su sonido y su GPU. Al volver, tu página arranca de cero.

El `src` sólo se pone al ENTRAR en la hoja, nunca al construirla: el libro
prepara las hojas vecinas por adelantado, y si se pusiera ahí, tu página
estaría ejecutándose de fondo antes de que nadie la haya visto.

</details>

<details>
<summary>Sin «404» aquí tampoco</summary>

Las páginas que hay en esta carpeta también salen de la lista de contenido,
así que no se pregunta a ciegas por ninguna.

</details>

---

## Tus propias páginas — la carpeta `mis-paginas/`

Para añadir contenido sin entrar en el motor: **fotos, vídeos y textos tuyos**,
en un solo archivo escrito en español.

Y lo más fácil de todo: **cualquier vídeo que se deje en `mis-paginas/videos/`
y cualquier foto en `mis-paginas/fotos/` sale sola como página**, sin escribir
nada. Si además se pone en `paginas.js` (con título, texto…), sale sólo esa.

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

### Y cómo aparece lo primero de cada página

La transición es cómo llega la hoja. La **entrada** es cómo se enciende lo que
trae dentro, y es lo que hace que dos páginas con la misma transición no se
parezcan. Están en `src/styles/entradas.css` y cada página se pone la suya con
una clase en su `index.js`:

| Firma | Qué hace | Dónde |
| --- | --- | --- |
| `entra--teclea` | Las letras llegan separadas y se asientan | Máquina de escribir |
| `entra--revela` | Sobreexpuesto y lavado, va cogiendo color | Polaroids |
| `entra--enfoca` | Desenfocado y se enfoca | Rascar |
| `entra--traza` | Se descubre de izquierda a derecha, como una pluma | Escrito a mano |
| `entra--corre` | Entra de lado, con tirón de mecanismo | Carrete |
| `entra--encaja` | Llega grande y torcido y se asienta | Mosaico |
| `entra--acerca` | Llega de muy atrás, no de arriba | La distancia |
| `entra--prende` | No se mueve: enciende | Constelación |
| `entra--cajon` | Sube desde abajo | El cajón |
| `entra--cae` | Baja girando, sin prisa | Deshojar |

Se repiten **en cada llegada**, también al volver a una página ya vista: antes
la clase se quedaba puesta y al regresar la página aparecía de golpe, sin su
gesto.

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
- **Saber qué fotos y páginas hay no cuesta nada.** Lo dice la lista de
  contenido, que viaja con el código: no hay que preguntar a la red por cada
  archivo antes de abrir el libro.
- **Una página HTML sólo corre mientras se ve.** El `src` del documento se pone
  al entrar en la hoja y se vacía al salir. No hay manera de que un archivo tuyo
  se quede dando vueltas de fondo, y tampoco hace falta que te acuerdes de
  pararlo: descargar el documento se lleva sus relojes, su audio y su GPU.
- **La luz del capítulo se escribe de una vez.** Los dieciséis tonos que salen
  del color de un capítulo se aplican cambiando el texto de una hoja de estilo,
  no con veinte `setProperty` en el elemento raíz. Una propiedad personalizada
  se hereda, así que cada escritura en la raíz ensucia el documento entero:
  veinte escrituras son veinte invalidaciones, y una hoja es una.
- **Movimiento reducido, de verdad.** Si el sistema lo pide, no basta con acortar
  los tokens de duración: hay una regla global que apaga toda animación y
  transición del proyecto, incluidas las que llevan los milisegundos escritos a
  mano. Todo llega igual a su estado final; nada se queda a medio camino.
- **Las hojas que no se ven no animan.** El router mantiene vivas las hojas
  vecinas para que arrastrar responda al instante, y `visibility: hidden` las
  esconde pero no detiene una sola animación de CSS: el lacre de la portada
  seguía respirando eternamente por detrás de la página que estás leyendo. Ahora
  se pausan —no se anulan—, así que al volver siguen donde estaban.
- **Nada se reescribe si no se ha movido.** El carrete y el carrusel de fotos
  reescribían la posición de cada fotograma sesenta veces por segundo aunque
  estuvieran completamente parados: cientos de mutaciones de estilo por segundo
  para dejarlo todo igual. Quietos, ahora no cuestan nada.
- **Las variables que laten viven abajo, no en la raíz.** El `--beat` del pulso
  se escribía en la página entera, y como las variables de CSS se heredan, cada
  latido obligaba a recalcular el estilo de sus setecientas cajas. Escrito sólo
  en el círculo, la página pasó de ser la más cara del libro a costar un tercio.
- **Los recuerdos miran a cámara todos a la vez.** Ochenta y cinco `lookAt` por
  fotograma —cada uno monta una matriz y la descompone en cuaternión— eran lo
  más caro de todo el proyecto. Como lo que se quiere es que las cartas queden
  planas hacia quien mira, basta deshacer el giro del grupo una vez y copiarlo.

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
