# Crear librito — el editor

Un taller visual para armar libritos interactivos (o editar el de siempre)
sin tocar código. Se abre desde el librito: **índice → «Crear librito»**,
o directo en `EditorDev/index.html`. Funciona como una app en Android, iPhone,
tableta (vertical u horizontal) y computadora.

Todo vive aquí dentro. El libro no carga nada del editor hasta que se entra,
y el editor no toca ni un archivo del libro: lee sus listas y sus páginas,
pero lo que hagas se guarda aparte.

---

## Qué se puede hacer

| | |
| --- | --- |
| **Páginas** | nuevas en blanco, desde plantilla o desde tus páginas HTML; duplicar, borrar, reordenar arrastrando su asa, renombrar, dejar en blanco (una o todas), **dejar sólo una en blanco**, poner de portada |
| **Añadir** | textos (título, subtítulo, párrafo, a mano, frase, etiqueta), fotos, marco vacío, **álbum**, **carrusel**, 12 formas, 27 dibujos y adornos, **dibujo a mano**, botón, vídeo, HTML propio, página original |
| **Editar en la hoja** | arrastrar, cambiar tamaño (esquinas y lados, manijas grandes), girar (se pega a 0/45/90°), **dos dedos sobre lo elegido = tamaño y giro**, duplicar, borrar, bloquear, ocultar, alinear, repartir, traer adelante/atrás, varios a la vez (Mayús o marco), doble toque: escribir el texto directo / recortar la foto / abrir el HTML; **mantener presionado = su menú** |
| **Permisos** | por elemento: permitir mover, cambiar el tamaño, girar, elegirlo tocándolo, salir un poco de la hoja, tocarlo en el librito; proporción según el tipo / mantener / libre |
| **Límites** | nada se pierde fuera de la hoja: al arrastrar siempre queda un pedazo dentro (o nada fuera, si así lo pides); el borde se ilumina al tocarlo; «Traer dentro de la hoja» y un aviso si algo quedó fuera |
| **Texto** | contenido, letra (16, se piden sólo las usadas), tamaño, color, grosor, cursiva, subrayado, mayúsculas, alineación, vertical, interletra, interlínea, sombra, opacidad, giro, posición, animación |
| **Fotos** | subir (se optimizan solas: 2048 px y WebP), cambiar, **recortar/encuadrar**, acercar, forma (círculo, corazón, estrella, arco…), marco polaroid o cinta, bordes, esquinas, sombra, filtros (brillo, contraste, color, b/n, sepia, desenfoque), opacidad |
| **Álbum** | cuadrícula, mosaico, tira que se desliza, polaroids sueltas o pila; columnas, espacio, esquinas, marco, proporción, ampliar al tocar, **cómo aparecen** las fotos (en cascada) |
| **Carrusel** | deslizar, fundido o cartas 3D; horizontal o vertical; solo, cada cuánto, velocidad, bucle, puntitos, flechas, espacio, esquinas |
| **Animaciones** | por elemento: **entrada** (13), **bucle** (13), **salida** (7) y **animación propia** con fotogramas (x, y, escala, giro, opacidad, desenfoque); duración, retraso, ritmo, dirección, distancia, repeticiones, ida y vuelta |
| **Línea de tiempo** | como un editor de vídeo (ver abajo): cuándo aparece y cuándo se va cada cosa, sus animaciones, sonidos, música y duración de la página; reproducir, pausar, avanzar, retroceder |
| **Transiciones** | 11: fundido, disolver, deslizar, desplazamiento, zoom, voltear, pasar la hoja, desenfoque, círculo, cortina y **personalizada**; la del librito y la de cada página; duración, dirección, ritmo |
| **Música** | la del librito y la de cada página (o silencio), volumen, bucle; tus canciones o las que ya están en el librito; se funden al cambiar |
| **HTML** | **una página HTML completa en un solo bloque** (`<!DOCTYPE html>`, `<head>`, `<style>`, `<script>`, `<body>`…) o un trozo; pegar, abrir un .html o escribir, con vista previa que funciona; **aislada** en su propio marco (no puede tocar el editor, la navegación, las otras páginas ni los estilos) |
| **3D (WebGL2)** | figuras (corazón, esfera, dona, nudo, estrella…) o tus modelos **.glb / .gltf / .obj** con sus colores, texturas y animaciones; material, luz, fondo, giro solo y cámara que se gira con el dedo |
| **Mis páginas** | tus `paginas-html/` como **plantilla editable** o **tal cual** (ver abajo) |
| **Herramientas** | nombre, tamaño de hoja (**Automática**, 5 fijos o a medida, con «acomodar lo que hay»), «Ver como», portada, flechas, deslizar, progreso, índice, «toca para abrir», al terminar, pasar solas |
| **Editor** | cuadrícula, imán, reglas, **guías** (se arrastran desde las reglas), márgenes seguros, zoom (ajustar, 50–200 %, rueda, pellizco) |
| **Guardar** | **autoguardado** (espera 0,8 s sin tocar, como mucho 5 s; sólo lo que cambió), deshacer/rehacer (150 pasos, sólo lo que cambió), borradores: abrir, nuevo, duplicar, borrar |
| **Exportar** | **.zip** con todo lo necesario y SÓLO lo usado; se vuelve a abrir en el editor |

## La barra lateral

A la izquierda, las categorías con su icono y su nombre, ordenadas para
construir en cuatro grupos: **Crear** (Bloques, Elementos, Texto, Imágenes,
Vídeo, Recursos) · **Adornar** (GIFs, Stickers, Efectos, Animar, Transiciones)
· **Tocar y oír** (Interactivo, Audio) · **Avanzado** (HTML, 3D, Tema,
Herramientas). Páginas está arriba (el botón «1/3»). En la computadora van fijas (el panel
se pliega con el botón de arriba o tocando la categoría abierta). En el
teléfono y la tableta es un **cajón**: se abre deslizando el dedo desde el
borde izquierdo, con la pestañita o con el botón de arriba, y se cierra
deslizándolo hacia la izquierda o tocando fuera. Mientras se arrastra, **sigue
al dedo**. Los iconos son del editor (SVG), no emojis: se ven igual en
Android y en iPhone.

## Hoja automática

En Herramientas → Tamaño → **Automática**, la hoja se adapta a cada pantalla
(teléfonos chicos y grandes, tabletas, vertical u horizontal) sin escalar todo
a lo bruto ni cortar nada: su tamaño guardado es la **zona segura** (en el
teléfono sale de su pantalla; en la computadora se queda la forma que ya
tenía) y en cada pantalla la hoja crece por un lado. Cada elemento tiene un
**ancla** (izquierda/centro/derecha/estirar y arriba/en medio/abajo/estirar;
«Sola» la deduce por dónde está): lo de arriba se queda arriba, lo de abajo
abajo, lo centrado centrado y los fondos se estiran. Con **Ver como**
(arriba) se prueba en otras pantallas sin salir del editor. El librito
exportado hace lo mismo y se recoloca al girar el teléfono.

## Línea de tiempo

Abajo del lienzo (Animar → Línea de tiempo, o «Tiempo» en la barra). Como en
un editor de vídeo:

- **Regla y cabezal**: tocar o arrastrar = ir a ese instante; la hoja se queda
  mostrando ese momento de verdad (las mismas animaciones que el librito).
- **Reproducir / pausar / atrás y adelante medio segundo / al principio y al
  final**; con ♪ también suena la música de la página.
- **Página**: su transición al llegar y cuándo pasa sola (arrastra su marca).
- **Música**: la canción de esa página (o la del librito).
- **Una pista por elemento** (la de arriba es la que se ve delante; su asa
  cambia la capa): el **clip** dice cuándo está en la página — arrastrarlo
  lo mueve en el tiempo, sus bordes cambian **cuándo aparece** y **cuándo se
  va** —; dentro, la entrada (arrastrar = retraso, borde = duración), la
  animación propia, el bucle y la salida (que termina justo al irse); marcas
  de sonido, de «al tocarlo» y de «empieza escondido».
- Mantener presionado un clip: «que aparezca/se vaya aquí», «que se quede
  hasta el final», sus animaciones, probar sólo ése. Dos dedos o Ctrl+rueda
  acercan; el borde de arriba cambia el alto.

## Sonido mientras editas: MusicaDev.mp3

Mientras editas suena **MusicaDev.mp3** (la música de trabajo del editor), no
la del librito: las canciones que le pongas al proyecto se guardan y sólo
suenan cuando las pides (▶ en la biblioteca, la vista previa o la línea de
tiempo). Déjala en **`EditorDev/MusicaDev.mp3`** (o en `musica assets/` o en
la raíz). Cuando suena otra cosa (un efecto, una canción que escuchas, un
componente), baja sola con un fundido corto y vuelve poco a poco al
terminar. Se enciende, se apaga y se ajusta en **Audio → Música del
editor**. En la vista previa se calla (ahí suena la del librito, que también
baja un momento con los sonidos de los elementos). Todo el volumen va por Web
Audio porque en iPhone es la única forma de controlarlo.

## Como una app

Mantener presionado no selecciona texto ni abre «copiar/pegar» (salvo en los
campos de texto, donde todo funciona normal); no se arrastran imágenes de la
página; el pellizco no agranda la interfaz entera ni la página rebota o se
recarga al tirar hacia abajo. El lienzo usa Pointer Events (ratón, dedo y
lápiz igual): un dedo mueve, dos dedos acercan (o cambian el tamaño y el
giro de lo elegido); si el segundo dedo llega mientras el primero movía
algo, ese movimiento se deshace. Los movimientos se pintan una vez por
cuadro y un arrastre entero es un solo paso de deshacer.

## Componentes de `assets/` (HTML de verdad)

Todo lo que dejes en **`assets/<categoría>/<componente>/index.html`** (con su
CSS, JS, imágenes, sonidos y fuentes al lado) aparece solo en
**Piezas**, agrupado por categoría y con su miniatura en vivo. Las
imágenes sueltas de `assets/` salen en **Elementos → Dibujos y adornos** y los
sonidos en **Audio**. La guía para crearlos está en `assets/LÉEME.md`.

- **El componente no se toca nunca.** Se muestra en su propio marco con sus
  rutas, estilos, scripts, eventos y zona táctil tal cual. Cada copia en una
  página guarda sólo dónde va, su tamaño, giro, capa, animación, sonidos,
  efectos y sus **parámetros** (los que declare su `asset.json`: texto,
  color, foto, canción…).
- **Zona táctil detectada.** Al ponerlo, el editor lo mira por dentro (sin
  cambiar nada) y separa lo que se toca (botones, enlaces, `cursor: pointer`…),
  lo que se ve y el **fondo decorativo**. En la hoja, el componente se elige
  por su zona real: si su botón es pequeño y su fondo grande, tocar fuera del
  botón elige lo de abajo. Las zonas se dibujan al elegirlo («toca»). Se
  puede cambiar a «por todo el cuadro» o volver a detectar.
- **Eliminar fondo** es una acción tuya y sólo tuya (barra contextual o
  inspector): afecta sólo a esa copia y se deshace. Detectar no quita nada.
- **Dejar pasar los toques** (opcional): en el librito, lo transparente
  alrededor del componente deja tocar lo de abajo.
- **▶ Probar aquí**: lo tocas de verdad sin salir del editor.
- Los componentes pueden pedirle cosas al librito (pasar de página, pausar
  la música, sonar algo) con `LibritoComponente.enviar(…)`.
- Al exportar va su carpeta entera (y lo que pida de fuera); si le quitaste
  el fondo, una copia aparte con eso, sin tocar la original.

## Música y sonidos

- **`musica assets/`**: deja ahí tus canciones y salen en **Audio**, con
  «De fondo» (todo el librito) o «Aquí» (sólo esta página).
- **Sonidos** para cualquier elemento: al tocarlo y al aparecer (inspector →
  Sonidos), y al pasar de página (Transiciones → «Sonido al pasar», o el
  de llegar a una página concreta).
- **Acciones al tocar** (cualquier elemento): pasar/ir a página, **mostrar,
  esconder o animar otro elemento** (con «Empieza escondido» se hacen
  sorpresas que aparecen al tocar algo), hacer sonar algo, abrir un enlace o
  pausar la música.

## La barra contextual (como en Canva)

Arriba del lienzo (abajo en el teléfono) cambia según lo elegido: letra,
tamaño (−/+), color, negrita, cursiva, subrayado, alineación y espaciado
para textos; cambiar, recortar, marco y forma para fotos; color y borde
para formas; personalizar, probar y eliminar fondo para componentes;
agrupar y alinear para varios. Y para todo: animar, transparencia,
posición (capas y alinear) y «⋯» (duplicar, copiar, pegar, efectos,
sonidos, al tocarlo, empieza escondido, bloquear, borrar).

También: **efectos** para cualquier elemento (sombra, resplandor,
desenfoque, brillo, contraste, color, b/n, sepia, tono), **grupos** (se
eligen y escalan juntos; doble toque para editar uno), **tarjetas** hechas
(nota adhesiva, tarjeta, boleto, polaroid con frase, sobre), **marcos**
(polaroid, cinta, washi, vintage, sello, doble) y animaciones nuevas
(sello, pegarse, elástico, círculo, rebotar, aletear, arcoíris, resplandor).

## Tus páginas HTML como plantilla

En **Páginas → Mis páginas** (o Interactivo → «Página original»):

- **Usar tal cual** — la página entra como capa «Página original»: se ve y
  funciona igual que en el librito, con todo su JavaScript. Puedes poner
  cosas encima.
- **Editar como plantilla** — se abre escondida a tamaño de hoja, se deja
  que se arme y se sacan a capas editables sus **textos** (con su letra,
  tamaño, color, degradado…), **fotos**, **dibujos SVG**, **cajas** con
  fondo, borde y sombra, y sus **animaciones** (se pueden cambiar de
  duración, retraso, repeticiones y sentido). Dos maneras:
  - **Conservar lo interactivo** (recomendado): la original sigue debajo
    funcionando (lienzos, juegos, botones) y sólo se esconde en ella lo que
    se sacó a capas. Si borras una capa, vuelve a verse la original.
  - **Sólo lo que se ve**: todo pasa a capas (los dibujos de `<canvas>` se
    vuelven fotos) y se quita la original.
- **Importar mi librito** — un proyecto nuevo con todo el librito de
  siempre: las páginas HTML tal cual (con «Hacer editable») y las de
  mecánica propia del libro (sobre, rascar, candado…) como cartas editables
  con su texto y sus fotos. No descarga nada al importar. Las escenas
  pesadas (la ciudad 3D…) sólo entran si lo pides.

El editor **nunca añade fotos ni canciones por su cuenta**: hay siempre un
«＋ Añadir foto», «＋ Añadir canción»… y eliges tú.

## El .zip

```
MiLibrito.zip
├── index.html               ábrelo y ya (también como archivo, sin servidor)
├── pages/pagina-01.js …     una por página; se cargan cuando hacen falta
│   └── originales/          tus páginas usadas tal cual y lo que piden
├── assets/images/ audio/ video/ drawings/ other/
├── styles/librito.css
├── scripts/librito.js       el reproductor (el mismo que pinta el lienzo)
├── scripts/datos.js
├── EditorData/              editor.json y LÉEME.txt
└── project.json             el proyecto, para volver a abrirlo
```

Para publicarlo: sube el contenido del .zip a GitHub Pages (o cualquier
sitio de archivos). Para seguir editándolo: **Ajustes → Abrir archivo**.

## Rendimiento

- Sólo existe en el DOM la página que se ve; las demás no gastan nada.
- El editor carga el exportador, el lector de .zip y las listas del libro
  sólo cuando se usan. Sin librerías (salvo three.js para el 3D, a pedido).
- Animaciones con la API del navegador (`transform` y `opacity`); la línea de
  tiempo las pausa y las lleva a cualquier instante.
- Las miniaturas se pintan cuando aparecen y se repintan un rato después de
  tocar la página, nunca a cada tecla. El panel no se rehace al arrastrar:
  sólo cambian los números.
- Las fotos se reducen al subirlas. En el librito exportado se adelanta la
  siguiente página (datos y fotos) mientras ella lee.
- La capa del editor (cajas, manijas, líneas del imán) recicla sus nodos: a
  cada cuadro sólo se mueven. Varios cambios a un elemento avisan una sola
  vez; un arrastre se guarda como un solo paso.
- El motor 3D (three.js, ya en `vendor/three`) se carga sólo si una página
  tiene una escena 3D; cada escena dibuja sólo cuando se ve y suelta la
  memoria de la tarjeta gráfica al quitarla. El .zip lo incluye sólo si hace
  falta.

## Teléfono, tableta y computadora

En el teléfono (y la tableta en vertical, y el teléfono acostado): el lienzo
ocupa la pantalla, la barra de herramientas de lo elegido va abajo, las
categorías en el cajón de la izquierda y el inspector sube como hoja.
Manijas grandes (con zona de toque de 44 px o más, que no se salen de la
pantalla), dos dedos para acercar o para cambiar tamaño y giro, mantener
presionado para el menú, doble toque en vacío para acercar.

En la computadora, además, atajos:

| | |
| --- | --- |
| Ctrl+Z / Ctrl+Mayús+Z | deshacer / rehacer |
| Ctrl+D · Ctrl+C/X/V | duplicar · copiar/cortar/pegar |
| Supr · Esc | borrar · soltar |
| Flechas (Mayús) | mover 1 px (10 px) |
| Enter | escribir en el texto elegido |
| Ctrl+A · G | elegir todo · cuadrícula |
| Ctrl + / − / 0 | zoom · ajustar |
| Espacio + arrastrar | mover la vista |
| RePág / AvPág | página anterior / siguiente |

## HTML libre, Probar y lo nuevo

| | |
| --- | --- |
| **Página HTML libre** | HTML → «Nueva página HTML»: página en blanco con un bloque a hoja completa. Pegas tu `index.html` entero (sin separar HTML, CSS ni JS) → **Guardar** → **Probar**. Guardar guarda exactamente lo escrito; se vuelve a editar con dos toques. Fotos o audios que use: «Archivos» y se enlazan solos por su nombre |
| **Probar página** | botón «Probar» (arriba) o el aviso tras guardar: los menús se van suaves hacia su borde y la página llena la pantalla, sola. Al salir vuelven poco a poco (aparecen, se acomodan, quedan firmes), más lento cuanto más duró la prueba |
| **Salir** | la flecha siempre avisa que podría perderse el progreso (y dice si ahora mismo hay algo sin guardar): «Guardar y salir · Salir · Quedarme un rato más» |
| **Hojas con asa** | todos los paneles que suben (secciones, inspector, menús, línea de tiempo) tienen un asa de color: siguen al dedo, rebotan con física, se quedan en sus paradas y se cierran al bajarlas |
| **Nada se mueve solo** | con el dedo, deslizar sobre algo NO elegido sólo desplaza la vista; tocar = elegir; ya elegido, arrastrar = mover. En la línea de tiempo igual, o mantener presionado un clip para agarrarlo |
| **Mantener presionado** | abre sus ajustes de luz: luz, exposición, brillo, contraste, saturación, temperatura, desenfoque, opacidad (dos toques en una etiqueta la regresa a cero) |
| **Animar** | compacto: entrada / bucle / salida; integradas, **Mías** (CSS `@keyframes`, JSON o JS) y **de la carpeta** `assets/animaciones/`. Tocar = verla, «Usar» / «Atrás» |
| **Efectos y transiciones** | cada uno con miniatura → «Previsualización» con intensidad, «Atrás · Usar». Propios en `assets/efectos/` y `assets/transiciones/` |
| **Fondo con HTML** | Diseño → «Fondo animado»: partículas, degradados, canvas… detrás de todo, sin estorbar al editar. Propios en `assets/fondos/<nombre>/index.html` |
| **Pistas de audio** | Audio → «Añadir audio a esta página»: con su onda, escuchar, volumen, bucle; en la línea de tiempo se arrastra y se recorta |
| **GIFs y Stickers** | GIPHY (Powered by GIPHY): buscar, cargar más, previsualizar, Usar. A un GIF se le puede **quitar el fondo sin perder la animación** (método local cambiable por un servicio externo: `editordev:quitar-fondo-url`) |
| **Sonidos del editor** | `assets/sonidos-editor/<momento>/*.wav`: al azar sin repetir, con fundidos; encender, volumen y cuántos a la vez en Herramientas |
| **La abejita** | toca el foquito (esquina de abajo; brilla cuando hay un consejo nuevo): llega volando una abejita que te cuenta el consejo de ese momento con un «bzz-pip» y, si habla de un botón, vuela hasta él. Flota sin tapar la hoja; vuelve a tocar el foquito y se va volando |
| **Piezas de un solo .html** | deja `algo.html` (HTML, CSS y JS juntos) en cualquier carpeta de `assets/` (`efectos-animados/`, `botones/`, `marcos/`, `tarjetas/`, `dibujos/`…) y sale en **Piezas** con su nombre (el de su `<title>`) |
| **Letras** | 40 letras por grupos (a mano, elegantes, modernas, divertidas, de máquina), cada una escrita con su letra y con buscador; se cargan al elegirlas y el texto se mide cuando ya llegaron |
| **Vídeo** | reproducción automática o manual (se toca para verlo), marcos (polaroid, redondeado, cine, neón, con cinta, tele antigua), resplandor con sus propios colores, efectos y ajustes de luz |
| **Pasar página** | flechas de `assets/deslizar/<estilo>/izquierda|derecha` (Herramientas → «Botones para pasar página»), deslizar con el dedo en el librito y, en el editor, deslizar rápido de lado sobre la hoja entera |
| **Música del editor** | todo lo que haya en la carpeta `DevMusic/` (varias = una tras otra) |

### La clave de GIPHY (que no quede en el código)

La clave **no** está en ningún archivo del repositorio. Tres formas, de la más
segura a la más simple:

1. **Proxy propio** (Cloudflare Worker): `herramientas/giphy-proxy/worker.js`;
   la clave va como secreto `GIPHY_KEY`. En el editor: GIFs → Conectar → «Uso
   un proxy» y pega su dirección.
2. **Servidor local**: `GIPHY_KEY=… node herramientas/servir.mjs` (o la clave
   en `.giphy-clave`, ignorado por git) y abre `http://localhost:8080/EditorDev/`.
   El editor lo detecta solo.
3. **Sólo en este aparato**: GIFs → Conectar → pega la clave. Se guarda en el
   navegador, nunca en el librito ni en el .zip.

## Fase 4: configuración, música, abejita y biblioteca

| | |
| --- | --- |
| **Música** | `DevMusic/MusicaDev.mp3` (también vale en `EditorDev/`). Intenta sonar al entrar y, si el navegador no deja, empieza con el primer toque. Un solo reproductor para todo el editor: no se reinicia al cambiar de sección. La notita de arriba la enciende/apaga con fundido; mantenerla presionada abre el volumen. Lo de `DevMusic/` suena después |
| **Barra de arriba** | ⚙ Configuración · nombre · deshacer/rehacer · **1/3 (Páginas)** · música · Probar · y «⋯ Más» en el teléfono (librito, ver como, guardar, exportar, herramientas). Páginas ya no está en la barra lateral |
| **⚙ Configuración** | modos Rendimiento / Equilibrado / Calidad; refresco 30–144 Hz **sólo hasta lo que da tu pantalla** (se mide con requestAnimationFrame); calidad; partículas; efectos en la hoja; FPS; diagnóstico; movimiento e intensidad; música, efectos y voz de la abejita; vibración; ayudas, etiquetas y consejos; tema, tamaño y transparencias; restaurar y limpiar datos temporales. Se guarda en el aparato |
| **Abejita** | mascota con caras (feliz, guiño, enamorada, sorpresa…), alas, rebotes, vueltas y brillitos; se mueve sola mientras está y nunca bloquea botones. Reacciona al insertar, guardar, borrar y exportar. Su voz son blips hechos con Web Audio (sin archivos) |
| **dialogos.txt** | en la carpeta principal. Una frase por línea, `#` = comentario, una línea con `-` = evento especial: «hackeo» con glitch, terminal, «OH... ESTOY SIENDO HACKEADO...» y luego el mensaje. Todo es sólo texto: nunca se ejecuta nada |
| **Recursos** | biblioteca por categorías (botones, marcos, tarjetas, hojas, dibujos, efectos, reproductores, retratos, GIFs, stickers, decoraciones, otros) con vista previa real aislada (sandbox), descripción e «Insertar». Sólo se animan las que se ven |
| **GIPHY** | ya viene conectado (`integraciones/giphy-config.js`); un proxy o el servidor local siguen teniendo prioridad si los configuras |

Código: `config/` (preferencias, cuadros/Hz), `mascota/` (abeja, dialogos, glitch), `components/configuracion.js`, `components/secciones/biblioteca.js`.

## Fase 5: herramientas, dibujo y RetroMyLove

| | |
| --- | --- |
| **Herramientas del lienzo** | a la derecha de la hoja, siempre visibles: **Seleccionar · Dibujar · Borrador** (la activa se marca y cambia el cursor) y **Pegar · Deshacer · Rehacer**. Esc vuelve a Seleccionar |
| **Dibujo** | los trazos del lápiz son dibujo, no objetos: no se eligen al tocarlos ni tapan lo de debajo. Colores, grosor (se recuerdan), «Elegir el dibujo» para moverlo o recolorearlo, y todo con deshacer |
| **Borrador** | borra partes de los trazos de verdad (los corta en pedazos), sólo trazos (nunca fotos ni textos), con tamaño de goma y «Borrar todo el dibujo»; cada pasada es un paso de deshacer |
| **Barrita del objeto** | (también en el teléfono) Copiar · Cortar · Duplicar · Más (capas, alinear, animar, luz, bloquear) · **Eliminar** en rojo (con el número si hay varios). Las cosas chiquitas se eligen aunque el dedo caiga un poquito al lado |
| **GIF e imágenes animadas** | los efectos se aplican al GIF sin reiniciarlo, en la hoja, al probar y en el librito. Los WebP/PNG animados que subes ya no se vuelven fotos quietas. Si los efectos están ocultos en la hoja (⚙ Rendimiento), un aviso lo dice con «mostrar» |
| **RetroMyLove** | ⚙ → Estilo del editor. Computadora retro de los 90 + papel viejo + rosa pastel: ventanas con rayitas y corazón de píxeles, botones biselados que se hunden, letras de píxel (VT323/Silkscreen) para menús y legible (Nunito) para textos, trama (dither), semitono (halftone), selección con «hormigas», apariciones a píxeles y **grano vivo** (una sola textura que se desplaza con transform; se apaga en ⚙). Parpadeo analógico opcional. El librito y la prueba nunca llevan grano |

Código nuevo: `canvas/herramientas.js` (dock y opciones), `config/estilo.js` (estilos y textura del grano), `styles/retromylove.css` (todo el estilo, por tokens).

## Fase 6: tocar, zonas, bloques, vídeo y Baddie

Tres niveles: **acciones rápidas** (herramientas junto a la hoja y la barrita
del objeto: copiar, pegar, duplicar, capas, bloquear, eliminar con
«Deshacer»), **herramientas de edición** (el riel en grupos) y **opciones
avanzadas** (grupo «Avanzado» y secciones cerradas del inspector).

| | |
| --- | --- |
| **Dibujo y toques** | el lápiz y la goma se quedan puestos hasta cambiar de herramienta; un toque dibuja un punto; «Detrás de todo» dibuja debajo. Los toques que se quedaban «trabados» (dedo que se levanta sobre un marco HTML, app en segundo plano) se limpian solos |
| **Capas** | orden correcto con varios elegidos; en Capas, barra Al frente · Adelante · Atrás · Al fondo y flechitas ▲▼ en cada fila; todo se ve al instante en la hoja |
| **Paneles translúcidos** | mientras arrastras un deslizador, el panel se vuelve casi transparente (sólo queda esa fila) para ver el cambio en la hoja |
| **Recursos** | el cajón ya no se cierra al deslizar las categorías ni al insertar; arriba eliges el **fondo de las vistas previas** (oscuro, cuadritos o claro) |
| **Elementos propios** | `assets/elementos/`: un `.html` todo-en-uno (sin CSS aparte) aparece solo, con el **nombre del archivo** (`rayos.html` → «Rayos»). Vienen nueve: rayos, aurora, lluvia de pétalos, corazón neón, contador de días, hilo rojo, vinilo, luciérnagas y mensajito |
| **Efectos al tocar** | en el inspector: lo que sale del dedo (ondas, corazones, destellos, estrellitas, confeti, burbujas, «te amo») y lo que hace el elemento (latido, rebote, saltito, sacudida, giro, crecer, brillo, color, opacidad), con color y cantidad. Cada ficha se prueba al instante. También «Al tocar la página» |
| **Zonas táctiles** | «Efectos al tocar → Crear zonas»: 1 dibuja rectángulos sobre el elemento (ideal para HTML), 2 toca uno y elige su efecto, sonido y acción (mostrar, esconder, animar, ir a una página, enlace, música, vibrar), 3 «Probar» esconde las marcas para tocar como ella. Se mueven, se agrandan, se duplican y se borran; viven dentro del elemento, así que siguen alineadas aunque lo muevas, lo gires o le cambies el tamaño. En el librito son invisibles |
| **Bloques** | secciones listas: portada, carta, galería, recuerdo, frase, razones, vídeo con título, contador de días, anterior/siguiente y pie. Se ponen agrupadas, con tus letras y colores, en el hueco libre más cercano |
| **Vídeo** | barra de controles propia (reproducir, adelantar, tiempo, sonido, pantalla completa) que se esconde sola; **resplandor épico** con los colores del vídeo; estilos (sueño, cine, VHS, recuerdo, noche, vivo). Si el teléfono no deja sonido, empieza en silencio con «Toca para el sonido». Los vídeos nuevos empiezan solos y en bucle |
| **Música al previsualizar** | la canción que escuchas en Audio da vueltas sola y se pausa al cambiar de pestaña, cerrar el panel o salir de la app |
| **Probar** | los menús se vuelven translúcidos antes de irse y la página crece desde la hoja |
| **Miniaturas** | en Páginas, lo que no se puede pintar chiquito (vídeo, HTML, 3D, piezas) es una tarjetita oscura con icono y nombre |
| **Hacer editable** | el HTML original nunca se borra: con «Sólo lo que se ve» queda escondido en Capas |
| **Estilo Baddie** | ⚙ → Estilo: negro brillante, rosa fuerte, cromo y brillitos; vidrio oscuro, botones de gloss, títulos en cursiva. La abejita se pone **pestañas, labial rojo y chapitas** |
| **Abejita** | más detallada (alas tornasol, brillo, patitas, ojitos que miran) y con consejos para todo lo nuevo |
| **Formas** | pasaron al final de Elementos, en «Formas básicas» (cerrada) |

Código nuevo: `runtime/rt-toques.js` (efectos y zonas en el librito), `components/toques.js` (inspector y editor de zonas), `components/secciones/bloques.js`, `styles/baddie.css`, `assets/elementos/`.

## Fase 7: barra útil, estilos con carpeta y música, Baddie leopardo y recorrido

| | |
| --- | --- |
| **Barra derecha** | ahora con lo que más se usa al armar: **Deshacer · Rehacer │ Pegar · Duplicar · Capas │ Imán · Ver toda la hoja**. El dibujo a mano sigue en Elementos → «Dibujar a mano»; mientras dibujas sale la tirita con **Lápiz / Goma**, colores, grosor y «Listo» |
| **Barra de abajo** | se probó tocando cada botón de cada tipo (página, texto, forma, foto, botón, vídeo, HTML): todos responden |
| **Cada estilo en su carpeta** | `estilos/<estilo>/` con su `estilo.css`, sus imágenes, `fuentes/`, `musica/` y `musica.txt`. Cuaderno, RetroMyLove y Baddie |
| **Música por estilo** | suena lo de `estilos/<estilo>/musica/` y lo que diga su `musica.txt` (canciones que ya están en el repositorio: Cuaderno → DevMusic, RetroMyLove → musica arena, Baddie → la radio). Al cambiar de estilo, la música cambia con un fundido |
| **Baddie girl leopard** | rehecho a partir de la foto: estampado de leopardo (beige, negro y café), besos de labial rojo, barra y riel negros, botones crema con filo negro y principal rojo labial, títulos con letra estilo Barbie (**Pacifico**; si dejas la fuente de Barbie en `estilos/baddie/fuentes/`, se usa ésa). Sin animaciones infinitas ni desenfoques: ya no parpadea. La abejita: pestañas, labial rojo, chapitas y moñito de leopardo |
| **Recursos sin fondo** | los marcos HTML siempre se pintan transparentes, también con estilos oscuros |
| **Recorrido con la abejita** | la primera vez lo ofrece; después, en su globito («Enséñame todo») o en ⋯. Vuela a cada parte, la ilumina y la explica, con Atrás / Siguiente / Salir; el globito nunca tapa lo que explica |
| **Estabilidad** | si algo falla, el editor suelta los toques trabados, quita velos, guarda y avisa en vez de congelarse |

## Fase 8: menús que no tapan, efectos al tocar, HTML que aparecen solos y temas por hoja

| | |
| --- | --- |
| **Menús y hojas** | nada queda fuera de la pantalla: las hojas a media altura dejan desplazar hasta lo último. En el teléfono, los menús salen en dos columnas (la mitad de alto). Si un menú, una ventanita o una vista previa tapa lo elegido, la hoja se corre sola para dejarlo a la vista |
| **Efectos al tocar** | sección nueva **«Al tocar»** (en la barra de abajo, en el riel y en el inspector) con categorías: Combinados, Partículas, Ondas y texto, Movimiento, Luz y color. Al tocar una ficha, el efecto **se ve en el propio elemento** y se repite solo; ahí mismo se cambia lo que sale del dedo, lo que hace el elemento, el color y la cantidad. Nada se guarda hasta **«Usar»**; «Atrás» lo deja como estaba. Nuevos: Besitos, Pétalos y Flotar, y combinados listos (Amor, Te amo, Magia, Fiesta, Romántico…) |
| **Vista previa sin tapar** | en el teléfono se apartan los paneles de atrás y la hoja se corre; en la computadora la vista previa se acomoda sobre el panel de donde salió (también la de Efectos) |
| **HTML que aparecen solos** | ver `assets/LÉEME.md`: cada carpeta es una categoría; un `.html` todo-en-uno, una carpeta con su `index.html` o varias páginas sueltas en una subcarpeta aparecen solos, con buen nombre (si el título dice «Document», se usa el nombre del archivo), su vista previa y **los más nuevos primero** (con la marquita «Nuevo»). Los que no dicen su tamaño se miden solos al insertarlos (ya no salen cortados). Las vistas previas vivas se cargan de una en una y sólo mientras se ven |
| **Temas por hoja** | **mantén presionada la hoja** (o botón derecho) → «Tema de esta hoja…»: 12 temas (Cuaderno, Carta antigua, Rosa acuarela, Noche de estrellas, Baddie leopardo, Picnic, Corazoncitos, Kraft, Pizarrón, Tablero de corcho, Apuntes, Minimal) que cambian el papel, los colores y las letras **sólo de esa página**. Tocar uno lo muestra en la hoja; «Usar» lo guarda con un solo deshacer. Las fotos de fondo y lo bloqueado no se tocan |
| **Estilos de hoja** | en el inspector de la página: Liso, Rayada, Cuadriculada, Puntitos, Acuarela, Pergamino, Kraft, Picnic, Corazoncitos, Noche estrellada, Pizarrón, Corcho y Leopardo. CSS puro (`templates/papeles.js`): se adaptan a cualquier tamaño de hoja y se ven igual en el librito |
| **Transiciones** | ordenadas en Suaves, Deslizar, Como un libro, Con forma y A tu medida; cada miniatura **se mueve sola** y muestra de qué hoja (la de rayitas) a cuál (la del corazón) pasa |
| **Portadas nuevas** | con foto, de noche, baddie, sobre y minimal. La galería de plantillas está por grupos (Para empezar, Portadas, Fotos, Cartas y frases, Música y más). Todas las plantillas se revisaron en teléfono, tableta, cuadrado y horizontal: ya no se enciman |
| **Arreglos** | al deshacer un cambio de toda la página ya no queda todo elegido (el siguiente deslizamiento arrastraba todo); el inspector de la página se actualiza cuando cambia el fondo entero |

Código nuevo: `components/temas-hoja.js`, `templates/papeles.js`; la sección «Al tocar» vive en `components/toques.js`.

## Fase 9: recuadro justo, música, selectores, hoja que se acomoda, línea de tiempo y portadas

| | |
| --- | --- |
| **Recuadro justo** | al poner un componente HTML se mira qué se ve de verdad (cuatro miradas seguidas, píxeles pintados de los lienzos incluidos) y el recuadro se ajusta a eso en vez de a todo su marco (la lámpara pasó de 370×601 a 95×349). Lo que se mueve por toda la hoja (lluvias, estrellas fugaces) conserva su marco entero. En el inspector: «Su recuadro: Sólo lo que se ve / Todo el HTML». Al insertar, nada sale gigante: lo grande entra a lo sumo en ~60–70 % del ancho y la mitad del alto, en un hueco libre. Lo ya mirado se recuerda: poner el mismo componente otra vez es al instante |
| **Música** | la música de trabajo del editor sólo suena mientras editas: al reproducir la línea de tiempo, al «Probar aquí» o al probar la página se calla, y suena **tu** canción (o nada si no pusiste ninguna) |
| **Botón de música en la hoja** | cada página nueva trae un botón delgado de reproducir/pausar arriba (o en el rincón que esté libre). Se puede mover, cambiar de estilo, de texto y de colores, y ponerlo en todas las páginas. En el librito sólo se ve si hay canción. Se quita en Audio → «Botón de música en la hoja» |
| **Letras y colores** | selector de letras nuevo: tu propio texto escrito con cada letra, grupos (Recientes, A mano, Elegantes, Modernas, Divertidas…), buscador y una animación al elegir. Selector de color nuevo: cuadro de tono y brillo que se arrastra (un solo deshacer por arrastre), código, cuentagotas, y filas de «En esta página», «Del tema», «Recientes» y paleta |
| **La hoja se acomoda** | en el teléfono y la tableta, al abrir un menú, una hojita o el inspector, la página se encoge y se corre animada (como el vídeo de Instagram al abrir los comentarios) para que lo elegido nunca quede tapado; al cerrar vuelve como estaba. En la computadora, si un menú o una ventanita tapa lo elegido, la hoja se corre a un lado y regresa al cerrarla |
| **Todo a la vista** | las secciones del inspector y de los paneles ya no vienen plegadas como carpetas; arriba hay un índice de chips para saltar a cada una. El menú «Más» de la barra quedó sin repetidos. «Pasar página» tiene su propio sitio en el riel, con el estado de esta página y «Ponerlos aquí» |
| **Pasar página con prioridad** | los botones de pasar y volver (y el de música) van siempre por encima de lo demás y anclados a su borde: no se salen de la pantalla. Al **Probar**, si la página no tiene botones para pasar, la abejita lo avisa y dice dónde se ponen («Ponerlos ahora», «Llévame ahí» o «Ahora no»); si uno se sale de la hoja, ofrece meterlo |
| **Icono de páginas** | el botón de arriba muestra unas hojitas apiladas con «1/3», no sólo el número |
| **Línea de tiempo profesional** | dividir en el cabezal (tijeras o S), marcadores en la regla (M; tocarlo lleva ahí, mantenerlo lo quita) que también sirven de imán, imán apagable, repetir en bucle, zoom con deslizador y «Ver todo» (0), pasos finos de 0,1 s (Mayús: 1 s), marcas finas en la regla al acercar, ojo y candado en cada pista. Atajos (con la línea tocada): Espacio, ←/→, Inicio/Fin, S, M, +/−, 0. En la computadora, si las herramientas no caben bajan a una segunda fila |
| **Portada al empezar** | la tarjeta «Librito nuevo» muestra cada estilo de portada en chiquito y deja **usar tu propia imagen**: se ve puesta en cada estilo antes de crear y va al hueco de foto (o de fondo). Portadas nuevas: **Revista (como la de Marissa)** —cabecera «Nº 01 · edición de amor», su nombre en dorado, foto con cinta, hojas debajo, sticker «edición única» y el sello con su inicial que abre el librito—, **Con tu foto de fondo**, **Lluvia de corazones**, **Tres polaroids** y **Estreno**. Todas animadas, sin tapar el botón de música y revisadas en cinco tamaños de hoja |
| **Arreglos** | los menús del teléfono a veces no se veían (quedaban transparentes); las letras a veces no se podían elegir (los títulos de grupo tapaban los toques); el índice del inspector tapaba el título de la sección al saltar; las páginas importadas del librito ponen su botón de música en un rincón libre |

Código nuevo: `components/selectores.js` (letras y colores), `componentes/analizar.js` (lo que se ve de cada HTML); el acomodo de la hoja vive en `canvas/lienzo.js` y la línea de tiempo en `timeline/linea.js`.

## Fase 10: guardado a prueba de fallos, pantallas de cualquier tamaño y efectos de sonido

| | |
| --- | --- |
| **Se guarda solo** | a los pocos segundos de cada cambio (sólo lo que cambió) y, además, **cada 5 minutos una copia COMPLETA** del librito (páginas, textos, fotos, dibujos, elementos, posiciones, tamaños, colores, efectos, animaciones y ajustes). También se hace una copia al abrir y al salir. Se guardan las 3 últimas, aparte, con su suma de control |
| **Nunca se pisa lo bueno** | cada guardado es una sola transacción (todo o nada) con escritura «estricta» y se comprueba volviéndolo a leer. «Guardado correctamente» sólo aparece después de esa comprobación. Si algo falla, la versión buena anterior se queda, lo nuevo queda pendiente y se reintenta solo (5 s, 10 s, 20 s… hasta cada minuto). Si el librito estuviera dañado, no se escribe |
| **Al salir** | al cerrar, cambiar de app o de pestaña, se intenta guardar normal y, por si el navegador corta antes, se deja al instante un rescate de lo pendiente. Al volver a abrir el editor se abre el último librito tal como quedó: si el rescate es más nuevo se aplica, y si faltara una página se completa con la última copia buena (avisa qué recuperó) |
| **Indicador** | junto al nombre (en el teléfono, sólo el icono; el texto se asoma un momento): «Guardando…», «Guardado correctamente» o «Error al guardar». Tocarlo abre **«Tu trabajo está a salvo»**: último guardado, las copias automáticas (abrir una crea un librito aparte, el original no se toca), espacio usado, si el navegador lo protege, «Hacer una copia ahora» y la **copia de seguridad en archivo**: un .zip con TODO (también lo subido que aún no se usa) que se restaura con «Restaurar desde archivo…» |
| **Compatibilidad** | IndexedDB en Safari (iPhone/iPad), Chrome/Android y escritorio; si Safari pierde la conexión con la pestaña en segundo plano, se reconecta sola. En Safari sin instalar, el navegador puede borrar lo guardado tras 7 días sin abrir el sitio: la ventanita lo explica y recomienda instalarlo o bajar una copia |
| **La hoja se acomoda** | al abrir cualquier panel de abajo (inspector, hojas, ventanitas, diálogos y ahora también la línea de tiempo) la hoja entera sube y se escala en proporción para verse completa; al cerrarlo vuelve suave a como estaba. Si el panel ocupa casi toda la pantalla, la hoja no se encoge hasta volverse un sello |
| **Cualquier pantalla** | el teléfono ya no agranda la página (antes, en 360–390 px la barra de arriba no cabía y la de abajo quedaba detrás de los botones de Android). Arriba, a los lados y abajo se respetan la muesca, la barra de gestos y los botones de navegación. En teléfonos angostos la barra de arriba se compacta (páginas como icono con insignia; el engrane pasa a «Más» sólo si no cabe) y la hoja ajustada no queda debajo de la barra flotante |
| **Sin resaltado azul** | en los 88 HTML del repositorio, en el HTML que se pega y en el librito exportado ya no aparece el resaltado azul al tocar ni al mantener presionado; en los campos de escritura se sigue pudiendo seleccionar |
| **Un solo botón de música** | al probar (y en el librito), si se usa el botón de música de la hoja, el chip viejo «♪» ya no sale |
| **Efectos de sonido** | 18 efectos listos, hechos en el navegador (Toques, Magia y brillo, Amor, Movimiento y Celebración): tocar para oír; «+» para ponerlo en el cabezal de la línea de tiempo o para que suene al tocar o al aparecer lo elegido. Se guardan como audio del librito (10–56 KB) y suenan igual en el librito exportado. Están en la campanita de la línea de tiempo, arriba de todo en Audio y en Sonidos del inspector |
| **Línea de tiempo** | cada pista de audio se puede silenciar sin quitarla; nuevos atajos: ↑/↓ saltar entre cortes, Supr quitar, Ctrl/Cmd+D duplicar y Alt+←/→ correr lo elegido 0,1 s (Mayús: 1 s); duplicar y silenciar también en el menú de la pista |
| **Pulido** | foco visible con teclado, respuesta suave al tocar, desactivados más claros, barras de desplazamiento finas del color del tema y menos movimiento para quien lo pide en su sistema |

Código nuevo: `storage/respaldos.js` (copias completas), `storage/seguro.js` (revisar, rescatar y recuperar), `components/guardado.js` (indicador y ventanita), `audio/efectos.js` (sintetizador de efectos) y `components/efectos-sonido.js` (elegirlos y ponerlos).

## Fase 11: más fluido, animaciones de editor de vídeo, magia y compartir

| | |
| --- | --- |
| **Sin tirones** | medido con la CPU 4× más lenta en un teléfono de 390×844: al elegir se pasó de 4 bloqueos (≈1,2 s en total) a 1 corto; al arrastrar, de 7 bloqueos a ninguno (60 fps estables); editar propiedades, de 33 a 16,7 ms por cuadro. Causas reales que se quitaron: el inspector se reconstruía entero aunque estuviera cerrado; el marco, las manijas, la barrita flotante, el cabezal, las reglas, el panel lateral y las hojas medían la página en medio del pintado (la obligaban a recalcularse varias veces por cuadro); las barritas del botón de música repintaban la página 60 veces por segundo; el giro del guardado y las miniaturas de «Al tocar» se animaban aunque no se vieran |
| **Sin parpadeos** | durante un gesto el marco y las manijas se pintan en el MISMO cuadro que el elemento (antes iban uno detrás y parecían despegarse); marco, manijas y barrita en su propia capa; cambiar de página no deja ningún cuadro vacío; editar no reinicia animaciones (comprobado). Nada de calidad se bajó |
| **Animaciones nuevas** | entradas: en arco, espiral, desde el fondo (3D), caer en 3D, desplegar (3D), rebotes con física (cuántos rebotes), orgánica (llega y se acomoda), cinematográfica y aparición mágica. Salidas: en arco, espiral, hacia el fondo, saltito y se va, polvo mágico y caer en 3D. Bucles: órbita, ocho, deriva orgánica, péndulo, gelatina y latido con luz. Todas con **intensidad**; los bucles, con **velocidad**. Funcionan igual en el librito exportado |
| **Curvas de ritmo a mano** | junto a cada «Ritmo» (entrada, bucle, salida, animación propia y cada fotograma) un botón abre la curva: dos asas que se arrastran (puede pasarse para rebotar o tomar impulso), una bolita que la recorre y las de siempre a un toque |
| **Magia combinable** | chispas, brillitos, estela, resplandor, ondas de energía, corazones, polvo mágico y halo; se ponen varias a la vez, cada una al aparecer, mientras está, al irse o al tocarlo, con color, cantidad y retraso. Su azar es fijo por elemento: la línea de tiempo muestra siempre lo mismo |
| **Reacciones** | al presionarlo en el librito: hundirse, crecer, brillar, gelatina o inclinarse (vuelve con un rebotito al soltar) |
| **Fotogramas por propiedad** | en la línea de tiempo, la flechita de una pista abre sus propiedades (posición con curva del camino, escala, giro, opacidad, desenfoque, color y brillo) con sus rombos ◆. Arrastrarlos los mueve (se pegan al cabezal, marcadores y otros fotogramas); tocarlos abre valores, «ritmo hasta el siguiente» (o una curva a mano), Ir aquí, Duplicar, Copiar y Quitar. **◆+** (o K) pone un fotograma en el cabezal: cambiar un valor deja el rombo de esa propiedad. «Pegar» pone el copiado en el cabezal; ↑/↓ saltan también entre fotogramas; todo se deshace con Deshacer. Las animaciones propias de antes se ven igual |
| **Reutilizar y encadenar** | «Copiar animación» / «Pegar animación» (en uno o en varios, también en otro librito) y **Secuencia**: de arriba abajo, de izquierda a derecha, del centro hacia afuera, por capas o al azar; cada tanto o encadenados con solape |
| **Transiciones de cine** | zoom de cine, profundidad 3D, paralaje, destello de luz y remolino |
| **Efectitos al trabajar** | anillo y destellos al elegir, ondita al soltar (brillo azul si el imán pegó), pop de brillitos al colocar, destellos al duplicar y polvito al borrar. Nunca reciben toques y respetan «Partículas» y «Movimiento» de la configuración |
| **Sonidos del editor** | suaves y digitales para duplicar, colocar, ajustar deslizadores, herramientas, fotogramas y lo que no tenga carpeta propia; con tono distinto cada vez, tope por momento (de 20 «tic» seguidos suenan 3) y volumen/apagado en Herramientas → Sonidos del editor |
| **Recursos** | al subir: se valida (una foto dañada no entra), la misma foto otra vez se reutiliza (huella SHA-256) y si se achica para trabajar ligera **el original se guarda aparte** y va en la copia de seguridad (y vuelve al restaurarla). Miniaturas de 320 px para rejillas y listas. **Revisar recursos** (Más, Guardar o Herramientas): peso, repetidos (unificar), sin usar (quitar, preguntando), fotos enormes (versión ligera conservando el original), archivos que faltan y animaciones que piden mucho. Nada se borra ni se achica sin preguntar |
| **Compartir por WhatsApp** | «Compartir por WhatsApp…» prepara el librito completo para seguir editándolo, el ligero para verlo, o fotos/música/vídeos sueltos, y abre el menú Compartir del teléfono (ahí se elige WhatsApp; ninguna app web puede abrir un chat directo con un archivo). Si el navegador no deja compartir ese archivo (Chrome en Android no deja los .zip), se descarga y explica cómo mandarlo como Documento |

Código nuevo: `runtime/rt-magia.js` (magia y reacciones), `components/curva.js` (curvas a mano), `components/animacion.js` (copiar, pegar y secuencias), `timeline/fotogramas.js` (fotogramas por propiedad), `canvas/fx.js` (efectitos del editor), `components/vivo.js` (animar sólo lo que se ve), `assets/compilador.js` + `components/recursos.js` (revisar recursos) y `components/compartir.js`.

## Fase 12: correcciones — posición fiel, vídeos, pantalla completa, abejita y sonidos

Sólo arreglos y mejoras de lo que ya había (nada se quitó ni se rediseñó).

| | |
| --- | --- |
| **«Probar página» idéntica a la hoja** | la causa: el editor y la prueba medían la pantalla distinto (barras del navegador, teclado, zona segura) y en formato «Automático» cada pieza de un bloque se acomodaba por su cuenta. Ahora la prueba usa exactamente la medida de la hoja (`pantallaDeHoja`) y las piezas de un bloque se anclan juntas (`RT.cajasGrupo`): mismas coordenadas, tamaño, giro, capas y separación. Medido en teléfono vertical, apaisado y computadora: diferencia máxima 1 px; entrar y salir no cambia el diseño |
| **Vídeos** | «Automático» (si el navegador deja; si no, en silencio) o «Al tocar». **Controles**: sólo se ven si están activados; sin controles no hay botón de reproducir, barra ni chip de sonido, pero se sigue pudiendo tocar (pausa o da sonido). Un solo manejador por vídeo (sin dobles), en el editor un toque elige y no reproduce, y al volver a la app siguen los que sonaban |
| **Pantalla completa** | «Probar página» pide la pantalla completa real del sistema (Android y computadora) y la suelta al salir; respeta la zona segura. En iPhone Safari no existe para páginas: usa toda el área visible. El vídeo en pantalla completa ocupa todo sin deformarse |
| **Sin saltos** | la barra de abajo conserva su desplazamiento al repintarse y aparece suave sólo cuando cambia lo elegido |
| **Bloques** | un toque elige el bloque, dos toques una pieza (como antes); ahora una pista breve lo explica la primera vez |
| **Abejita al momento** | consejos cortos la primera vez que mueves (con o sin imán), giras, cambias tamaño, ordenas capas, abres efectos o un vídeo. Cada uno sale una vez (el del bloque, hasta tres), nunca durante un gesto ni con una ventana abierta, y como mucho uno cada 15 s |
| **Sonidos en carpetas** | `assets/sonidos-editor/<categoría>/<acción>/` (ver su LÉEME): interaccion, movimiento, transformacion, organizacion, interfaz, edicion, paginas, multimedia y animaciones. Cambiar un sonido es cambiar archivos; qué carpeta usa cada acción está en una sola tabla (`CARPETA`, `audio/sonidos-editor.js`) |
| **Sonidos en cada acción** | pulsar, elegir/soltar la selección, arrastrar y soltar, desplazar la vista, girar, zoom (una vez por tanda), cambiar tamaño, agrupar/desagrupar, duplicar, eliminar, capas, abrir/cerrar/minimizar/restaurar paneles, lápiz, goma, color, efectos, animaciones, páginas y escuchar canciones. Una vez por acción, nunca por cuadro; los de poca importancia ceden ante uno más importante |
| **Mezcla** | los efectos pasan por un limitador suave (no saturan aunque coincidan) y la música del editor baja un poco mientras suenan y vuelve sola (medido: de 0,45 a ~0,27 y de vuelta a 0,45). Los volúmenes elegidos no cambian |
| **Controles de música** | el botón de música de cada hoja es su control: si se oculta no aparece ningún otro (tampoco el ♪ viejo) y la música sigue sonando |

No probado en aparatos reales: Android, iPhone/iPad Safari y Safari de Mac se comprobaron con Chromium emulando esas pantallas, no en los equipos.

### Fase 12b: ir atrás sin parpadeos, más estabilidad y más sonidos

| | |
| --- | --- |
| **Atrás en las vistas previas** | al pulsar «Atrás» (o el atrás del teléfono) en la vista previa de efectos, transiciones, fondos o «Al tocar», la hoja de la página se agrandaba y volvía a encogerse: la hoja de atrás reaparecía recién al terminar la animación y el lienzo medía a mitad de camino. Ahora vuelve al EMPEZAR a cerrarse y el lienzo mide cómo quedará: un solo movimiento |
| **La hoja vuelve a su sitio** | al abrir y cerrar menús muy rápido la hoja de la página quedaba más chica (teléfono) o corrida (computadora): si un menú se cerraba a mitad de la animación se creía que la habías movido a mano y se olvidaba dónde estaba; en la computadora cada vista previa la subía aunque no la tapara y nunca la bajaba. Ahora recuerda su sitio aunque se cierre a mitad, sólo se aparta si de verdad algo la tapa, vuelve al cerrar y se reajusta si la barrita de la derecha reaparece |
| **Volver a una sección** | sigue donde ibas (antes saltaba arriba) y sin repetir la entrada escalonada (ésa, sólo la primera vez) |
| **Más fluido** | abrir una sección ya no obliga a recalcular el diseño de la pantalla en balde (≈12 % menos al abrir, con la CPU 4× más lenta) |
| **Probado a lo bruto** | atrás doble y rápido, atrás del teléfono dos veces seguidas, cambiar de sección 20 veces seguidas, inspector abierto y cerrado al instante: no queda nada trabado (ni velos, ni hojas a medias, ni la vista previa pegada) y la hoja vuelve exacta |
| **Más sonidos** | atrás en menús, activar y desactivar interruptores, el imán al pegarse a una guía, el menú al mantener presionado, «Probar página», bloquear/desbloquear, ocultar/mostrar (también el ojito y el candado de «Capas»), borrar y reordenar páginas y empezar a escribir un texto. Cada carpeta trae ahora al menos 3 variantes. Sin dobles: «Atrás» no suena además a «cerrar», ni «Probar» además a «abrir» |

### Fase 13: rendimiento (iPhone, Android y computadora)

| | |
| --- | --- |
| **Código desde el teléfono** | el editor comparte el ayudante de segundo plano del libro: mientras no se publique nada nuevo, sus casi noventa módulos salen de la caché sin tocar la red (una sola petición por apertura); al publicar, la primera apertura ya trae lo nuevo, sin mezclar versiones. Detalle en «Rendimiento» del README principal |
| **Módulos de una vez** | `index.html` del editor lleva su lista de `modulepreload` (la rehace `node herramientas/contenido.mjs`, igual que la del libro): el teléfono pide los módulos todos juntos y no en cascada. La primera apertura, ≈11 % antes en el servidor de pruebas, y más en GitHub Pages, que los sirve en paralelo |
| **Sin fugas** | cuatro ciclos enteros (todas las secciones, vistas previas de efectos, inspector y «Probar página»): nodos, oyentes y documentos quietos; la memoria crece ≈0,1 MB por ciclo |

### Fase 14: efectos lindos, un sonido por interacción y Páginas publicadas

| | |
| --- | --- |
| **Estela de acuarela** | al arrastrar sale por DETRÁS del objeto un trazo de acuarela pastel (lila → rosa → durazno), con granito de papel y gotitas si vas rápido; se seca y desaparece solo en ≈1 s y nunca pinta encima del objeto. Un único lienzo con gotas ya dibujadas (cuesta muy poco) y se apaga solo cuando no queda pintura |
| **Elegir** | una cinta de colores que se DIBUJA alrededor y florcitas y estrellitas que se abren con resorte en las esquinas (lila si eliges varios) |
| **Soltar** | una mancha de acuarela que florece debajo y pétalos que se posan; si el imán pegó, brillitos sobre la guía |
| **Colocar, duplicar, borrar** | colocar: halo tibio y confeti de corazones, flores y estrellas que suben y caen con su peso. Duplicar: un fantasma punteado que se asienta. Borrar: nubecitas que se deshacen y pétalos que caen |
| **Zoom** | con dos dedos, rueda, botones o doble toque: un globito con el porcentaje junto a los dedos (lupa con «+» o «−») |
| **Un sonido por interacción** | 55 archivos en `assets/sonidos-editor/`, uno por cosa, con su nombre (`seleccionar-elemento`, `arrastrar-pintura`, `soltar-objeto`, `zoom-acercar`, `zoom-alejar`, `zoom-paso`…). La tabla de qué suena cuándo está en el LÉEME de esa carpeta; para cambiar uno basta poner otro archivo con el mismo nombre. Todos en la misma escala (kalimba, campanitas, marimba, gotitas, pincel, papel, aire), con un poquito de sala para que suenen suaves |
| **Sincronizados** | cada sonido sale en el mismo cuadro que su efecto. Al pellizcar con dos dedos suena un barrido al empezar (sube al acercar, baja al alejar) y un «tin» por escalón, más agudo cuanto más cerca. Arrastrar: pincel al empezar y un roce suave de vez en cuando (más fuerte cuanto más rápido). Lo que se repite seguido (elegir, imán, colocar, duplicar, capas, fotogramas) sube por la escala como una escalerita en vez de sonar igual. Deshacer y rehacer suenan distinto |
| **Páginas publicadas** | nueva opción en la barra de la izquierda. Se conecta tu GitHub una vez (un token sólo para tu repositorio, guardado sólo en ese aparato) y publica el librito en `publicadas/<nombre>/` de tu GitHub Pages, en un solo commit; al actualizar sube sólo lo que cambió y borra lo que ya no se usa. Lista lo publicado con Abrir, Copiar enlace, Compartir y Quitar. Lo publicado va sin `project.json` (no se puede abrir en el editor), con `noindex` y sin decir de dónde viene el clic (`no-referrer`) |

Código nuevo: `canvas/fx.js` (rehecho), `herramientas/sonidos-editor.mjs` (rehecho: un archivo por interacción), `components/secciones/publicadas.js` y `integraciones/github.js`.

### Fase 15: GitHub Pages que no falle, publicar sin token, sonido del menú y 20 recursos nuevos

> Desde la Fase 17 lo de publicar con token o sin token ya no está en el editor:
> todo se publica por M.YNTHN (ver más abajo). Lo demás de esta fase sigue igual.

| | |
| --- | --- |
| **GitHub Pages** | en «Páginas publicadas» hay una sección que dice si GitHub Pages está **encendido** (si está apagado, todo da 404: es lo que pasa cuando un repositorio pasa a privado y vuelve a público). Con token: lo enciende con la rama elegida (la más nueva va primero, no a ciegas la principal), cambia de rama, «Volver a publicar el sitio» y avisa si la última publicación falló. Sin token: revisa si el sitio contesta y explica los 4 pasos a mano con un botón directo a Settings → Pages. Al conectar, si Pages está apagado ya no se elige `main` por descarte |
| **Publicar sin token** | «1 · Descargar el .zip para subir» (sólo para ver: sin `project.json` ni `EditorData/`) → «2 · Subirlo en GitHub» abre `publicar/` de tu repositorio (Add file → Upload files) → la acción **Publicar páginas subidas** lo abre en `publicadas/<nombre>/`, lo apunta en `publicadas/lista.json`, borra el .zip y le pide a GitHub Pages que publique. La lista se lee del sitio público. Rutas raras dentro del .zip (`..`, absolutas) se rechazan |
| **Sonido del menú de recursos** | sacar y guardar el menú (riel, cajón del teléfono que sigue al dedo, su hojita, la X, el velo o «atrás») suena con su propio sonido: `abrir-recursos` (una cajita mágica que se abre) y `cerrar-recursos`. Cambiar de sección con el menú abierto sigue sonando a herramienta; nunca suenan dos a la vez |
| **20 recursos nuevos** | Elementos (se tocan): corazón latiendo, sobre con carta, girasol, globos de corazón, gatito, luna dormilona, reloj de arena, frasco de estrellas, arcoíris, taza de café, plantita, osito, fresita, nubecita de amor. Efectos animados: pétalos de sakura, hojas de otoño, nieve suave, notas musicales, polvo de hadas (sigue el dedo), destellos arcoíris. Todos transparentes, ligeros (DPR ≤ 2, pausan en segundo plano) y con `prefers-reduced-motion` |

Código nuevo: `herramientas/publicar-subidas.mjs`, `.github/workflows/publicar-subidas.yml`, `publicar/LÉEME.md`; cambios en `integraciones/github.js`, `components/secciones/publicadas.js` y `audio/sonidos-editor.js`.

### Fase 16: tu propio servidor (Termux), cuentas y publicaciones/ a pantalla completa

| | |
| --- | --- |
| **Tu servidor** | `servidor/` (Python, sólo biblioteca estándar) corre en un teléfono viejo con Termux: cuentas propias (registro con aprobación o invitación, administrador/editor), el **token de GitHub cifrado allá** (nunca en el editor ni en el repositorio), un panel web para almacenamiento, publicaciones, proyectos, usuarios, GitHub, túnel y actividad, y un túnel https de Cloudflare. Guía completa: `servidor/LÉEME.md` |
| **Editor ↔ servidor** | Páginas publicadas → **Tu servidor**: se empareja con el enlace del panel (`#servidor=…`), solo (servidor.json en tu sitio) o pegando la dirección; se entra con usuario y contraseña del servidor (sesión Bearer, nada de GitHub) y se publica con barrita de avance. Mis publicaciones (ver, copiar, compartir, actualizar con el mismo enlace, subir a GitHub, quitar) y copias de proyectos en el servidor (guardar y abrir como borrador nuevo). Código: `integraciones/servidor.js` |
| **publicaciones/** | todo lo publicado (servidor, token o sin token) va a `publicaciones/<nombre>/` con `publicaciones/lista.json`; si el nombre ya existe, `<nombre>-2`, `-3`… (actualizar es aparte) |
| **Visor a pantalla completa** | lo publicado lleva `runtime/visor.js`: carga con un corazón que late, botón de pantalla completa que aparece al tocar (y tecla F), pantalla que no se apaga, manifiesto e iconos para «Agregar a inicio» (se abre a pantalla completa). Es sólo para ver: sin `project.json`, con `soloVer`, y el editor se niega a abrirlo |

### Fase 17: M.YNTHN para todos, Exportar con tres opciones, Detallitos y menú principal

| | |
| --- | --- |
| **Menú principal** | lo primero al abrir el editor (el editor se carga por detrás): **Entrar al editor**, **Detallitos** (con globito si hay nuevos), **Iniciar sesión o crear cuenta** (ahí mismo) o Salir de mi cuenta, y Volver al librito. Básico y lindo, con corazoncitos que flotan |
| **M.YNTHN** | el servidor de `servidor/` ahora es **público**: cualquiera crea su usuario y contraseña y entra al momento (nada de tokens, direcciones ni GitHub en el editor; sólo iniciar sesión). El editor lo encuentra solo (`servidor.json` de tu sitio) |
| **Exportar** | el botón Exportar (en el teléfono: Más → Exportar…) abre una hoja con tres opciones: **Descargar página completa** (el .zip de siempre), **Publicar en servidor M.YNTHN** (entrar si hace falta → publicar con barrita → enlace, ver, copiar, compartir) y **Enviar Detallito** |
| **Páginas publicadas** | rehecha: sólo M.YNTHN. Tu cuenta, Publicar, **Mis páginas publicadas** (ver, copiar, compartir, actualizar, subir, quitar) y **Copias de mis proyectos** agrupadas por proyecto, con lo que ocupas de tu espacio |
| **Copias al guardar** | cada vez que guardas **a mano** (Guardar borrador ahora o Ctrl+S) se sube una copia completa del proyecto a tu carpeta de M.YNTHN (una por minuto como mucho; el autoguardado no sube nada). Se abre en cualquier aparato como borrador nuevo |
| **Detallitos** | menú completo a pantalla entera que se abre con una transición en círculo desde el botón, burbujitas y chispitas, y se cierra con atrás (botón, Esc o el atrás del teléfono, paso por paso). **Vincular a tu Amorcito**: tu código único `AMOR-XXXX-XXXX` (copiar, compartir, otro código) y un lugar para pegar el de tu amorcito (con «Pegar»); al vincular, los dos corazones se juntan. Luego: **Mandar esta página** (título, mensajito, un sobre que sale volando) y la colección en notitas: **De mi amorcito** (con «Nuevo») y **Mis enviados**. Abrir uno lo muestra en una ventanita aislada, a pantalla completa, «Guardar en mis borradores» o quitarlo de tu colección. La pastilla de arriba dice si tu amorcito está **en línea** |
| **Avisos** | cada 45 s (y al volver a la app) se pregunta si llegó algo: globito en Exportar y en Más, sonidito y un aviso «Verlo» |

Código nuevo: `components/menu-principal.js`, `components/exportar-menu.js`, `components/detallitos.js`, `components/cuenta.js`, `components/myn.js`, `styles/myn.css`; `integraciones/servidor.js` rehecho; `components/secciones/publicadas.js` rehecho; `export/exportar.js` puede armar una sola página (`soloPaginas`) con su proyecto. Se quitaron `integraciones/github.js`, `herramientas/publicar-subidas.mjs`, su acción y `publicar/`.

### Fase 18: M.YNTHN que prende fácil, menú principal nuevo y vista previa del detallito

| | |
| --- | --- |
| **Servidor** | instalar = un asistente de 3 pasitos en Termux (lo necesario, tu administrador, GitHub) que lo deja prendido y abre el panel; el código de instalación ya no cambia solo (era el «no es ese») y en el mismo teléfono ni se pide; `librito` solito lo prende o dice cómo va; el túnel se prueba desde internet y se reabre si no contesta; la dirección se reanuncia hasta que entra. Detalles en `servidor/LÉEME.md` |
| **Menú principal** | rediseñado: un librito que pasa sus hojas, saludo según la hora, tu cuenta arriba (con puntito verde), botón grande «Entrar al editor» con destello, dos tarjetas (Detallitos —con el estado de tu amorcito y los nuevos— y tu cuenta), auroras de fondo y corazones que suben. Con mouse, la tarjeta se inclina apenas |
| **Vista previa al mandar** | en Detallitos, la página se ve **terminada** (el mismo reproductor del librito, sin sonido) en un teléfono chiquito junto al sobre, con una notita que repite tu mensajito mientras escribes. Al tocarla se ve en grande y se puede tocar como la verá. Al enviar: la página entra al sobre, se cierra con su sello, late mientras sube y sale volando con chispitas; si falla, el sobre se abre y la página vuelve a salir |
| **Conexión** | si el teléfono del servidor se reinició y cambió de dirección, el editor busca la nueva (sin esperar la caché de GitHub Pages) y reintenta solo; si no contesta, lo dice claro («puede estar apagado o sin internet; tus cosas siguen en este aparato») |

### Fase 19: tu nube en M.YNTHN — tus libritos en cualquier aparato

| | |
| --- | --- |
| **Para quién** | para todos los que usan el editor: nadie instala nada. Abren el enlace, crean su cuenta (al momento) y entran; sólo el dueño del servidor tiene Termux |
| **Se guarda solo en tu nube** | todo se guarda primero en el aparato (al instante, sin internet) y ~10 s después se sube a tu nube **sólo lo que cambió**: el `project.json` del librito y cada foto, canción o video que falte, reconocido por su huella SHA-256 (lo que ya está no se vuelve a subir). Los archivos suben en partes de 8 MB y, si se corta, siguen donde quedaron. Al entrar a tu cuenta se suben también los demás libritos de ese aparato (`integraciones/nube.js`) |
| **Desde otro aparato** | en «Tus borradores» salen los de aquí y los de tu nube, cada uno con su etiqueta: *En tu nube*, *Sólo en este aparato*, *Hay uno más nuevo en tu nube*, *Cambió en dos aparatos*. Tocar uno que sólo está en la nube lo baja entero (con barrita) y lo abre con el **mismo** id |
| **Dos aparatos a la vez** | al abrir un librito, o al volver a la pestaña, si en la nube hay uno más nuevo y aquí no lo tocaste, se trae solo («Traje la versión más nueva…»). Si cambió en los dos, pregunta: **La de aquí**, **La de mi nube** o **Las dos** (la de aquí queda como librito aparte y también sube). Nunca se pisa sin preguntar |
| **Borrar** | «Borrar de este aparato» (en tu nube sigue) o «Borrar de todos lados». Si se borró de la nube desde otro aparato, aquí no se revive: queda sólo aquí, con «Subirlo otra vez» |
| **Guardar a mano** | además de subirlo ya, deja una **copia** en tu nube (no duplica fotos ni videos). «Copias de mis proyectos» las muestra por librito y abre cualquiera como borrador nuevo (con sus fotos con otro nombre, para no chocar). Las copias .zip de antes siguen ahí |
| **Ajustes** | la configuración del editor, sonidos, letras, colores y extras también viajan (gana el último que cambió) |
| **Publicar y Detallitos** | las fotos y videos ya están en la nube, así que el .zip lleva sólo su huella (`publicar.json` → `nube`) y el servidor los pone: lo que cruza el túnel es chiquito aunque el librito pese cientos de MB. En el servidor, los archivos de más de 20 MB van a GitHub con `git push` (adiós «Sorry, your input was too large to process») |
| **Se ve** | el indicador de guardado lleva un puntito: verde al día, latiendo subiendo, hueco sin conexión, naranja si hay que elegir o la nube está llena. Su panel tiene «Tu nube · M.YNTHN» con lo que pasa y «Subir ahora» |
| **Arreglos** | en la computadora, el «⋯» de cada borrador del inicio estaba escondido (lo tapaba la regla del «Más» de la barra): ya se ve; «1 página» en singular |

### Fase 20: menú principal y Detallitos nuevos, tu perfil, emparejamiento animado y sin parpadeos

| | |
| --- | --- |
| **Menú principal** | un álbum de los dos: tu foto y la de tu amorcito en polaroids con cinta washi, unidas por un hilo rojo con un corazón que late (y su puntito verde si está en línea). Debajo, **cuántos días llevan juntos** (el número sube al abrir) y **lo que viene**: aniversario, mesiversario o un cumpleaños (el día mero, la etiqueta festeja). Sin vincular: tu polaroid y una vacía que invita a vincularse. Luego «Crear librito», el botón grande y tres tarjetas: Detallitos, Mis libritos y Mi perfil. Fondo de luces suaves, corazones y destellos |
| **Tu perfil** | toca tu foto arriba (o «Mi perfil»): foto (la eliges, la mueves con el dedo y la acercas en un círculo; sube recortada y chiquita), tu nombre, tu cumpleaños y «somos novios desde» (es de los dos). Ahí mismo, tu amorcito y «Salir de mi cuenta». Se guarda en M.YNTHN y una copia chiquita en el aparato, para que todo se vea al instante (`components/perfil.js`) |
| **Detallitos** | arriba, sus dos fotos con su corazón y el puntito en línea; las pestañas «De ‹su nombre›» / «Mis enviados» con una lucecita que se desliza; cada notita lleva la foto de quien la mandó; la hoja para escribir tiene renglones y cinta. Las pantallas salen al instante con lo que ya se sabe y se ponen al día por detrás (nunca en blanco) |
| **Vincular** | una escenita: tu foto, el hilo rojo con su lucecita y un «?» que se mece. Tu código sale en fichitas que se voltean una por una; el de tu amorcito se escribe solito con su formato (AMOR-XXXX-XXXX) y llena 8 corazones con un «tic» por letra. Al vincularse: su foto aparece de un brinco, se acercan, el hilo se recoge en un corazón grande con chispitas y campanitas, y todo crece en un círculo hacia sus detallitos. Al desvincularse, se separan y el hilo se suelta |
| **Transiciones** | cada camino la suya, con su sonido (`components/transiciones.js`): el perfil se abre como una **hoja que se da vuelta** y regresa igual; tu cuenta **gira como una tarjeta**; al entrar, todo **crece en un círculo** desde el botón; vincular gira; un detallito **sale de su sobre**; la vista previa **se acerca**; atrás **se desliza**. Sonidos nuevos hechos aquí mismo (brillo, giro, sobre, latido, campanas, separar y el «tic» del código), cambiables poniendo un archivo con su nombre en `assets/sonidos-editor/` |
| **Parpadeos** | la causa: el menú y Detallitos se volvían a armar enteros (con sus animaciones de entrada) cada vez que llegaba un latido, y el «visto hace…» de tu amorcito cambia en **cada** latido (cada 45 s); además, el globito de Exportar se quitaba y se volvía a poner. Ahora sólo se cambia el pedacito que cambió (un nombre, una foto, el puntito en línea, el número del globito). Fuera también el vidrio esmerilado y los desenfoques grandes animados del fondo (lo más pesado y lo que parpadeaba en Android): ahora todo se mueve con transform y opacity |

### Fase 21: menos parpadeos, más fluido y toques que se sienten

Medido con un detector propio que graba la pantalla cuadro por cuadro con el procesador 4 veces más lento (como un teléfono): destellos, animaciones que se reinician solas, saltos de diseño, tareas largas y cuadros por segundo, antes y después.

| | |
| --- | --- |
| **Animaciones que repintaban** | el destello del botón grande se movía con `left`; los puntitos «en línea», el brillo de las notitas nuevas y el botón «Vincularnos» latían con `box-shadow`; el brillito de la vista previa movía un fondo. Todo eso se repintaba en **cada cuadro**. Ahora son capitas aparte que sólo cambian transform y opacity (las mueve la tarjeta de video, no el procesador) |
| **La tarjeta del menú** | ya no lleva una perspectiva 3D fija (dejaba el texto borroso y una capa enorme siempre encendida): sólo se inclina cuando mueves el mouse |
| **Letras que saltaban** | el menú espera a que estén sus letras (Caveat y Jost) antes de aparecer —como mucho un segundo— y, la primera vez en un aparato, también a tu perfil: así no se ve primero con otra letra ni «sola» y luego cambia de golpe. El contador de días empieza cuando ya se ve |
| **Cambios suaves** | si cambia la fecha o lo que viene, esa parte crece o se encoge suave en vez de empujar todo; las fotos nuevas se preparan antes de ponerse (nunca un circulito vacío un instante); la lista de borradores sólo cambia las filas que cambiaron cuando llega tu nube; el «Guardado» del teléfono se asoma como mucho cada 30 s (la barra ya no baila a cada cambio); el velo de los menús sólo se desenfoca con mouse |
| **Al tocar** (`components/tacto.js`) | cada botón suelta una **onda** suave desde tu dedo (rosita; blanca en los de color) y los botones principales, unos **corazoncitos** y una vibración chiquita en Android. Nunca en la hoja que editas ni en «Probar página». Con «sin movimiento» o calidad baja, no hay |
| **Al desplazar** | la cabecera de cada panel se separa con una sombrita en cuanto bajas; las fichas y los borradores **van apareciendo** al llegar a la vista (lo hace el navegador en la tarjeta de video; donde no se puede, simplemente están) |
| **Resultado** (teléfono simulado) | menú de **41 a 51–54** cuadros por segundo; 0 destellos; el salto al arrancar desapareció; tareas largas del arranque de 1,8 s a 1,1 s en total. En computadora, el menú de **~38 a ~48**; editor y Detallitos igual que antes |

### Fase 22: tus propios sonidos, el menú álbum con su gatito y la colección de los dos

| | |
| --- | --- |
| **Sonidos que tú cambias** (`assets/sonidos-editor/`) | **todo** lo que suena en el editor tiene un nombre: el menú, Detallitos, las reacciones, el gatito, la abejita y los secretos. Pon ahí tu `nombre.mp3` (o .m4a, .ogg, .aac) y suena el tuyo en lugar del de fábrica; el nombre no distingue mayúsculas, acentos ni espacios («Reacción te amo.mp3» sirve para `reaccion-te-amo`). Si pones `nombre-2.mp3` y `nombre-3.mp3`, se turnan sin repetir el último. La lista completa y qué es cada uno: `assets/sonidos-editor/LÉEME.md`. El catálogo se rehace solo al subir (o con `node herramientas/contenido.mjs`) |
| **Los de fábrica** | rehechos todos con timbres de **cristal, vidrio y arpa** (campanitas con armónicos de copa, nada de silbatos ni «boing»), con su sala de eco suave, y **tres versiones de cada uno** en tonos distintos que se turnan: nunca suena dos veces igual seguido. Los que suenan muy seguido (elegir, mover, zoom, deslizar) tienen una sola para no cansar. Se hacen con `node herramientas/sonidos-editor.mjs` |
| **Menú principal** (`components/menu-principal.js`, `album-arte.js`) | ahora es un **álbum de recortes**, como la foto: papel con textura, cuadrícula y ramitas; arriba el corazón pixelado, M.YNTHN y su lema, y tu nombre en una etiqueta rasgada con coronita. Sus dos fotos en **polaroids con cinta washi** que caen y se mecen, unidas por el **hilo rojo** con su corazón y la notita «Juntos siempre es mejor». La tarjeta rasgada con clip dice **cuántos días llevan juntos** y lo que viene («Faltan 3 días para el cumple de…», mesiversario, aniversario) con su **barrita que se llena**. El botón grande «Crear librito» y a su lado el **gatito negro dormido**: respira, mueve la cola y la cabecita y suelta sus «z»; si lo tocas, ronronea y suelta corazoncitos. Las tres cartas (Detallitos, Mis libritos, Mi perfil) caen de una en una; abajo la cinta oscura «Volver al librito», la foto de la esquina y «Cada página también es un beso». Todo con transform y opacity, en pausa hasta que están las letras y tu perfil |
| **Detallitos desde el menú** | sólo **la colección de los dos**, nada de publicar ni mandar. Cada página con su **portadita** (una miniatura de su primera hoja, dibujada al mandarla), una etiqueta con la cara y **«Yo»** o **el nombre de quien la mandó**, el título y la fecha; separadas por mes, con filtros Todas / De ‹su nombre› / Mías, y se desplaza suave. Las que te llegaron y no has abierto dicen «Nueva». Las de antes, sin portadita, llevan una tapita de colores hecha con su color |
| **Reacciones** (`components/reacciones.js`) | a lo que te mandó le pones una: **te amo, me encantó, lloré, abrazo, beso o me reí**. Cada una con su dibujito, su lluvia (corazones que suben, destellos dorados, gotitas que caen despacio, aros tibios, besitos, burbujitas) y **su sonido de cristal en tres versiones**. Tocar la misma la quita. Quien la mandó ve tu reacción en la portadita y en la página, y le llega un aviso («‹nombre› te dijo «te amo»») que abre la colección. Necesita M.YNTHN 1.5.0 (`librito actualizar`) |
| **Mandar** (Exportar → Enviar Detallito) | igual que antes, y la tarjeta «Nuestra colección» con las miniaturas de las últimas lleva a la colección |
| **Resultado** (teléfono simulado, procesador 4 veces más lento) | el menú álbum va a **56–59** cuadros por segundo (antes 51–54), 0 destellos; Detallitos y el editor a 61 |

### Fase 23: sonidos tibios, toques que siguen al objeto, atrás al menú y portaditas para todas

| | |
| --- | --- |
| **Sin brillitos** | el menú de recursos ya no suena a campanitas agudas: se desliza como papel, hace un «plop» de burbujita con un golpecito de madera y un acorde tibio de **piano de fieltro**. Igual se rehicieron los demás que eran brillitos (cerrar recursos, entrar a tu cuenta, aplicar efecto o animación, probar, publicar, «listo», vincularse, abrir un detallito o la colección, colocar y duplicar); las reacciones siguen de cristal pero una octava más abajo y sin siseo. Todos con sus tres versiones y cambiables con tu `nombre.mp3` |
| **Los toques siguen a lo que tocas** (`components/tacto.js`) | la onda nace **dentro** del botón o la carta que tocaste, así que si se desliza, se encoge o se va con la pantalla, la onda va con él (antes se quedaba fija donde estaba); los corazoncitos también lo acompañan. En el editor, la cinta y las florcitas de elegir, el confeti de colocar y la mancha de soltar **siguen al objeto** si lo arrastras justo después o haces zoom (`canvas/fx.js`) |
| **El gatito** | al tocarlo ya no sale onda, ni recuadro, ni lluvia: sólo sus **Zzz** que flotan (y su ronroneo) |
| **Atrás = menú principal** (`components/salir.js`) | la flecha de arriba del editor (dice «Menú» si hay espacio) y el «atrás» del teléfono cierran primero lo abierto y luego te regresan al **menú principal**, guardando por detrás, sin preguntar. Desde «Crear librito», atrás también vuelve al menú. Sólo en el menú principal, atrás pregunta si te vas del todo; para ir al librito está «Volver al librito» abajo |
| **Portaditas para todas** (`components/portadita.js`) | las páginas que se mandaron antes de que existieran las portaditas ya no se quedan con la tapita de colores: al asomar en la colección, el editor dibuja su primera hoja con su paquete (de una en una, sólo las que se ven) y la sube, así a los dos ya les sale para siempre. Las nuevas se dibujan más nítidas (480 px) |
| **Estabilidad** | abrir y cerrar el menú muchas veces no deja nada acumulado (ondas, corazones, grupos de efectos, menús viejos); probado con 12 vueltas seguidas en teléfono y computadora, sin errores |

### Fase 24: todos los sonidos en pixel art

| | |
| --- | --- |
| **Los 82 sonidos, rehechos** (`herramientas/sonidos-editor.mjs`) | todo lo que suena en el editor ahora es **pixel art**, como una consola de 8 bits: cuadrada al 12, 25 y 50 %, triangular de 4 bits y ruido de consola, con el tono y el volumen cambiando a pasitos (eso es lo que suena «a pixel»). Pero **suaves y serios**: registro grave y medio, un pasa-bajos al final para que nada chille, sin fanfarrias, sin estrellitas, sin campanitas agudas; los que abren algo llevan un eco cortito de consola |
| **Ninguno igual** | cada sonido tiene su propia figura (notas, intervalos, onda y ritmo) y sale en tres versiones que se turnan; se comprobó que ningún archivo se repite ni quedó igual al de antes |
| **La abejita y el huevito** | ahora también traen sus sonidos de fábrica en pixel art (su voz es un «blip» de consola que cambia de tono, como en los juegos), y siguen siendo cambiables con tu archivo |
| **Si falta un archivo** | el sonidito de respaldo que hace el editor también es de consola (triangular y cuadrada, filtradas) |

### Fase 25: sonidos entre «Cute UI / Pop» y «Glass UI»

| | |
| --- | --- |
| **Los 82 sonidos, rehechos otra vez** (`herramientas/sonidos-editor.mjs`) | en lugar del pixel art, una mezcla de dos estilos de interfaz: **cute / pop** (burbujitas redondas que hacen «plop» hacia arriba o hacia abajo, pulsaditos de madera suave, gotitas) y **glass / glassmorphism** (el «tink» limpio de una copa, copas que se quedan sonando y el aire de un vidrio esmerilado cuando algo se abre o se desliza). Por ejemplo: tocar un botón es una burbujita con un filito de cristal; abrir recursos, un panel de vidrio que se desliza y asienta con un «plop» y una copa; guardar, una copa con su tink |
| **Suaves y sin repetirse** | nada de cascadas de notas ni fanfarrias (como mucho dos o tres notas, como un acorde), registro medio, un pasa-bajos suave y una sala chiquita en los de vidrio. Cada sonido tiene su propia figura y tres versiones; se comprobó que ningún archivo se repite ni quedó igual a los del pixel art ni a los de antes |
| **Si falta un archivo** | el respaldo vuelve a tonos redondos (de burbuja y copa), filtrados |

### Fase 26: sonidos de interfaz profesionales

| | |
| --- | --- |
| **Los 82 sonidos, rehechos** (`herramientas/sonidos-editor.mjs`) | con el criterio de los sonidos de un sistema operativo o una app de trabajo: las interacciones (tocar, elegir, soltar, teclas, interruptores, seguros) son **toques táctiles**: un contacto cortísimo y la resonancia de un material suave (polímero, madera mate o metal suave) que se apaga enseguida; lo que se abre o se desliza (menús, recursos, hojas, páginas) es **aire limpio** filtrado, sin temblores; y sólo los avisos (guardar, listo, error, publicar, Detallitos, reacciones) llevan **tono**, de piano eléctrico suave (FM), todos en re mayor y nunca más de dos o tres notas |
| **Cortos y discretos** | los frecuentes duran alrededor de una décima de segundo y suenan bajito; la sala es casi imperceptible. Cada uno con su propia figura y tres versiones: ningún archivo se repite ni quedó igual a los de las fases 23, 24 y 25 |

### Fase 27: la estela al mover objetos, precisa y más linda

| | |
| --- | --- |
| **Precisa** (`canvas/fx.js`) | antes eran manchitas sueltas que salían del borde de atrás según una dirección «suavizada» (se atrasaba en las curvas y a veces salía por otro lado). Ahora es **una sola cinta continua** que pasa exactamente por donde pasó el centro de lo que arrastras (también si el imán lo pegó a una guía), suavizada con una curva que pasa por cada punto: sin esquinas ni huecos aunque lo muevas rápido. Sale de detrás del objeto y nunca pinta encima |
| **Linda, con el mismo estilo** | sigue siendo acuarela pastel: un velo ancho y un centro más intenso, el borde de agua que deja la acuarela al secarse, el granito de papel y un degradado entre dos tonos que cambian en cada arrastre; se afila hacia la cola y, si vas rápido, salpica unas pocas gotitas. Al soltar (o si te quedas quieta) se seca encogiéndose hacia el objeto |
| **Medido** | en teléfono y computadora: la pintura está justo sobre el camino recorrido, nada a 70 px de él, nada encima del objeto, al soltar no queda ni un pixel y el arrastre va a 59–60 cuadros por segundo |

### Fase 28: correcciones importantes

| | |
| --- | --- |
| **Ya no se añaden cosas solas** (`components/tacto.js`) | en el teléfono (sobre todo en iPhone), el «+» abre su menú, la pestañita el cajón de elementos y GIFs/Stickers su hojita justo donde está el dedo; el «clic» de ese mismo toque caía sobre lo que aparecía y **añadía una ficha sin querer** o **cerraba la hojita en el acto** (por eso parecía que GIFs o Stickers no funcionaban). Ahora un clic sólo cuenta si cae en lo mismo que se tocó al bajar el dedo; los del teclado y los de una etiqueta a su casilla, siempre |
| **Botones para pasar página** (`runtime/rt-player.js`) | si la hoja trae sus propios botones («En esta página»), las flechas del librito ya no salen encima (antes eran **4 botones**); los que no tienen a dónde ir se esconden («volver» en la primera hoja, «seguir» en la última, los dos en una página suelta) y en «Probar página» funcionan de verdad |
| **Un solo botón de música** | en el librito exportado (lo que le llega a ella) las hojas llegan de una en una y el ♪ del librito salía junto al botón de música de la hoja; ahora se mira en cada hoja y nunca se duplica |
| **Se ve igual en cualquier pantalla** (`export/exportar.js`) | el librito exportado (Detallitos, publicar, descargar) guarda la pantalla con que se ve en el editor y **sólo se escala**: una hoja automática hecha en la compu ya no se rearma para el teléfono de ella (ahí se amontonaba todo). Si la hoja es acostada y el teléfono está parado, una pastillita invita a girarlo |
| **Probar página en un celular** (`components/prueba.js`) | un escenario oscuro con el brillo del color de tu página y, al centro, un celular (marco, isla, botones y reflejo); tu página va dentro con su pantalla exacta. Entra subiendo desde la hoja con un rebote suave y un destello en el vidrio, y al terminar regresa a la hoja. Fluido: sólo transform y opacidad (fuera los desenfoques animados) y la página carga cuando el celular ya llegó. Se puede pasar de hoja ahí mismo |
| **Portaditas bien acomodadas** | en la colección, la portadita se ve **entera** (antes se recortaba al centro: se perdía el título de las páginas altas y los lados de las anchas), como una hojita con sombra sobre un velo de sus propios colores |
| **Medido** | en teléfono y computadora simulados: el clic fantasma no añade nada y un toque de verdad sí; GIFs y Stickers se quedan abiertos; Probar entra a 56–59 cuadros/s con el celular entero en pantalla, sin flechas repetidas, «siguiente» pasa de hoja y al terminar todo vuelve; la página exportada se arma con la misma hoja en el teléfono |

### Fase 29: ver un detallito dentro de un celular y reacciones exageradas

| | |
| --- | --- |
| **La página, en un celular** (`components/detallitos.js`) | al abrir un detallito, su página sale dentro del mismo celular de «Probar página». Ya no se abre tal cual se subió (con su reproductor de entonces, la portada negra «Toca para abrir», botones repetidos o todo amontonado): se arma con su paquete y el **reproductor de hoy**, así **todas las páginas ya subidas se ven bien** sin volver a mandarlas: directo, con sus botones funcionando y con la pantalla con que se hicieron (las de antes, con su hoja base) |
| **Nada se tapa** | el celular se ajusta para que el mensaje, quién la mandó y las reacciones quepan a la vista (antes la barra de reacciones tapaba el mensaje) |
| **Ver en grande** | el mismo celular a pantalla completa, en su escenario, **sin recargar** la página; «Cerrar» o el atrás del teléfono lo regresan |
| **Reacciones exageradas, sin estrellas** (`components/reacciones.js`) | toda la pantalla se tiñe un instante de su color, su dibujo brota **gigante** al centro (con rebote, late y se va flotando) y una lluvia del doble de piezas, más grandes y que llegan lejos. «Me encantó» ya no es una estrellita: es una carita con ojos de corazón y su lluvia son corazones dorados y rosas con burbujitas de luz |
| **Sus sonidos, más bonitos** | más largos y tibios, de piano eléctrico sobre un colchón suave: «te amo» con un latido y un acorde que se abre nota a nota; «me encantó», tres notas que suben y quedan cantando; «lloré», una melodía tierna que baja; «abrazo», un acorde grave que crece y te envuelve; «beso», un besito y una nota que sube; «me reí», notitas que rebotan. Tres versiones de cada una |
| **Medido** | en teléfono (360×780) y computadora: la página carga en el celular con el reproductor de hoy, sin portada, celular + mensaje + reacciones caben sin taparse, la reacción pone velo, dibujo gigante y 30 piezas sin ninguna estrella, «Ver en grande» crece sin recargar y atrás lo regresa; sin errores |

### Fase 30: Mensajitos (el chat de los dos), el detallito como la foto y sin zoom

| | |
| --- | --- |
| **Mensajitos** (`components/chat.js`) | un chat lindo dentro de Detallitos: tus burbujas a la derecha (rosas), las suyas a la izquierda con su foto, por día («Hoy», «Ayer»…), pegaditas cuando se mandan seguido; sólo emojis = grandotes. Se entra desde el menú principal («Mensajitos», con el globito de los que no has leído), desde la colección y desde cada detallito («Contestarle con un mensajito») |
| **GIFs y stickers encima** | GIF → se manda como mensajito. Sticker → eliges uno y **tocas el mensajito donde lo quieres pegar** (el tuyo o el suyo): ahí se queda, chuequito, y lo ven los dos (hasta 8 por mensajito). Buscador de GIPHY con sugerencias («te amo», «abrazo», «beso»…) |
| **Reaccionar** | tocar su mensajito abre su menú: las seis reacciones de las páginas (con su fiesta y su sonido), «Pegarle un sticker», «Copiar»; en los tuyos, «Borrar para los dos». Si tu amorcito reacciona a lo tuyo con el chat abierto, también hay fiesta |
| **Se desliza y llega solo** | abre en lo más nuevo; al subir se cargan los de antes de a poquito sin perder dónde ibas; lo nuevo llega solo (al instante desde la Fase 31) con su sonido, se marca «visto» y, si estabas leyendo arriba, sale «↓ 1 nuevo». Con el chat cerrado, el latido (cada 25 s) avisa «te mandó un mensajito» |
| **Seguro** | lo que escriben se pone siempre como texto (nunca HTML); el servidor sólo acepta GIFs y stickers de GIPHY (`media*.giphy.com`/`i.giphy.com`); sólo quien lo recibió reacciona y sólo quien lo mandó borra. Necesita el servidor 1.6.0 (`librito actualizar`) |
| **Sonidos nuevos** | `mensaje-enviar` (un airecito y dos notas que suben), `mensaje-llega` (dos notas tibias de marimba) y `sticker-pegar` (se despega y se aprieta), en el mismo estilo profesional, con sus tres versiones |
| **El detallito, como la foto** (`components/detallitos.js`) | el celular **grande** (lo más que quepa), debajo su mensajito **escrito a mano**, quién la mandó, «Ver en grande» (rosa, con ojito) y «Guardar en mis borradores» (lila) **lado a lado**, las reacciones sueltas y más grandes (sin tarjeta), «Contestarle con un mensajito» y **«Más detallitos»**: sus otros, con portadita, mensajito, cuándo y su reacción (tocar uno lo abre ahí; atrás regresa a la colección). «Quitar» quedó como enlace discreto. En la compu: el celular a la izquierda y todo lo demás a su lado. Lindo también en modo oscuro |
| **Sin zoom donde no hace falta** | en Detallitos, el chat y el menú principal ni pellizcar ni tocar dos veces agrandan la página (sólo se desliza); en «Probar página» y en el celular de los detallitos, pellizcar la página ya no agranda todo el editor; los campos de texto tienen letra de 16 px (el iPhone no se acerca al escribir); y la colección ya no hace zoom cada vez que llega un latido o una reacción |
| **Medido** | en teléfono (360×780, claro y oscuro) y computadora: mandar, recibir solo, texto nunca HTML, GIF, sticker pegado donde tocaste, reaccionar con fiesta, su reacción a lo tuyo, borrar, subir para ver lo de antes, atrás cierra lo de encima y luego sale, globito del menú; el detallito con celular grande, botones lado a lado, reacciones sin tarjeta, «Más detallitos» y atrás a la colección; y siguen pasando Probar página, toques fantasma, la estela y los 237 sonidos. No probado en un iPhone ni un Android de verdad |

### Fase 31: Mensajitos como la foto, stickers que se arrastran y dibujar en vivo

| | |
| --- | --- |
| **Como la foto** (`components/chat.js`) | arriba, su foto con un corazoncito, «Mensajitos ♡», «con Maru ♡» y la pastilla «Siempre juntos ∞»; el fondo rosita con corazones dibujados a mano y «Tú y yo siempre»; «Hoy» entre corazoncitos; tus burbujas rosas con letra a mano, su hora y ✓✓ (rosas cuando ya lo vio); las suyas blancas con la hora adentro; los GIF con marco rosa y los stickers solitos, sin burbuja. Lindo también en modo oscuro |
| **Videollamada y llamada** | dicen «Ay ora jeje» (todavía no llaman). El 🎤 también, hasta que haya notas de voz; en cuanto escribes, se vuelve «mandar» |
| **Ánimos** | Happy, Sad, Hot y Hormonal, con sus dibujitos (nube feliz, nube con lagrimita, llamita y diablita): por ahora sólo rebotan al tocarlos |
| **⋮ Ajustes y privacidad** | un menú que se abre animado: sonidos del chat, avisos de mensajitos, fondo con corazoncitos y letra grande (en este aparato); y en privacidad: **mostrar mi «visto»** (si lo apagas, tu amorcito ya no ve cuándo leíste), **guardar una copia del chat** (.txt) y **borrar mis dibujos** |
| **+ Cositas** | un menú lindo con Dibujar, Espacio, Stickers y GIFs, y un lugar para «más cositas muy pronto» |
| **Stickers cute que se arrastran** | etiquetas tiernas (Milk & Mocha, Bubu Dudu, Mochi, ositos, gatitos…) y nada de stickers viejitos (los subidos a GIPHY antes de 2018 no salen). Tocar uno lo manda solito; **mantenerlo y arrastrarlo lo pega donde lo sueltes**, en cualquier parte del chat (la lista se mueve sola cerca de las orillas), y tu amorcito lo ve ahí mismo. Los tuyos se vuelven a arrastrar, o se sueltan en el botecito para quitarlos |
| **Dibujar en vivo** | con el dedo en todo el chat: 6 colores, 3 grosores, deshacer y **«+ Espacio»** (más lugar abajo para dibujar sin mandar ningún mensaje; lo tienen los dos). Tu amorcito ve el trazo **mientras lo haces**. Con un dedo se dibuja y con dos se desliza |
| **Todo al instante** | el chat se queda esperando al servidor (hasta 22 s) y éste contesta en cuanto cambia algo: mensajitos, reacciones, stickers y dibujos llegan al momento. Con un servidor viejo, pregunta cada 2.5 s |
| **Dónde queda cada cosa** | los stickers libres y los dibujos se guardan pegados a un mensajito: a lo ancho, en proporción; a lo alto, en px desde ese mensajito. Así caen en el mismo lugar en cualquier teléfono (en pantallas de distinto ancho, lo dibujado se estira un poquito a lo ancho) |
| **Medido** | en teléfono (390×844, claro y oscuro) y computadora: cabecera, fondo, ánimos y barra como la foto; «Ay ora jeje»; ánimos sin hacer nada; ⋮ con interruptores que funcionan (fondo y «visto» privado); + con sus cositas; trazo visto en vivo por el otro antes de soltarlo; lo que dibuja el otro aparece solo; «+ Espacio»; deshacer; etiquetas cute sin stickers viejitos; sticker arrastrado cae justo donde lo soltaste; tocar uno lo manda; moverlo; quitarlo en el botecito; el del otro aparece y no se mueve; mensajito del otro en menos de 2 s; emojis; y siguen pasando el detallito, Probar página, toques fantasma, la estela y los 237 sonidos. No probado en un iPhone ni un Android de verdad. Necesita el servidor **1.7.0** (`librito actualizar`) |

### Fase 32: celular a la medida, chat sin parpadeos, teclado con sonido

| | |
| --- | --- |
| **El celular, a la medida de la página** (`components/detallitos.js`) | al abrir una página de la colección, el celular toma la forma de la hoja de verdad (se mide ya cargada): las de tamaño fijo (p. ej. 1080×1350) se guardaban con la forma de la pantalla del editor y sobraban franjas rellenas; ahora la página llena el celular |
| **Sin parpadeos** (`components/chat.js`) | la burbuja ya no se rehace cuando cambia el «visto» o la reacción (se cambian en su lugar); tu mensajito que llega por el tiempo real antes que la respuesta de «mandar» se queda en la misma burbuja (antes se veía doble un instante); los stickers que pasan de «pegándose» a guardados no se vuelven a cargar; y el trazo en vivo de tu amorcito ya no titila |
| **Mandar, más bonito** | tu mensajito sale volando desde donde lo escribiste, con un rebotito y corazoncitos |
| **Sonidos de teclado** | letra, espacio y borrar (también con el teclado del teléfono), suavecitos; se apagan en ⋮ → «Sonidos del teclado» |
| **Stickers sin brincos** | al tocar o arrastrar un sticker se cierra el teclado, y la lista no se mueve sola mientras lo llevas |
| **Temas del chat** | en ⋮, con su «Muy pronto»: todavía no hace nada |
| **Tiempo real más fluido** | lo que dibujas sale cada 45 ms (antes 140, a cambio de usar más red) y lo que dibuja tu amorcito se va trazando suavecito en vez de a brincos; sólo se repinta el trazo que cambió |
| **Medido** | teléfono y computadora: celular con la forma de una hoja 1080×1350 y la página llenándolo; teclado con sus tres sonidos y apagable; mandar con vuelo y sin repetirse; ✓✓ sin rehacer la burbuja del GIF; «Temas» sin hacer nada; el teclado se cierra al arrastrar un sticker; y siguen pasando el chat, el detallito, Probar página y los 246 sonidos. No probado en un iPhone ni un Android de verdad |

### Fase 33: notificaciones push, menú lateral, Mis libritos y la cuenta del dueño

| | |
| --- | --- |
| **Notificaciones push** (`integraciones/avisos.js`, `sw.js`, `manifest.webmanifest`, `iconos/`) | avisos **aunque el editor esté cerrado**: cuando tu amorcito te escribe un mensajito, te manda una página o reacciona. Llegan con el **ícono de la app** (el gatito con su tulipán), la insignia de corazón en Android, el **sonido de notificaciones del teléfono** y vibración; tocar una abre el editor directo en Mensajitos o en Detallitos, y el ícono de la app muestra cuántas tienes sin ver. Si tienes el chat abierto, no te avisa (ya lo ves ahí) |
| **Dónde funcionan** | Android y compu (Chrome, Edge, Samsung Internet, Firefox) directo. **iPhone/iPad: iOS 16.4 o más nuevo**, con el editor en la pantalla de inicio (Safari → Compartir → «Agregar a inicio») y abierto desde ese ícono: así lo pide Apple. El sonido es el de notificaciones del teléfono (la web no puede poner un sonido propio) |
| **Prenderlas** | en el chat, ⋮ → Notificaciones → «Notificaciones push» (y «Probar notificación»). La primera vez el chat invita con un «Activar»; en iPhone sin instalar, explica cómo agregarlo a inicio. Se apagan igual, y al salir de tu cuenta ese teléfono deja de recibirlas |
| **Menú lateral** | Recursos quedó justo debajo de Bloques. «Páginas publicadas» salió del menú lateral y vive en el menú de los tres puntos (⋯), que ahora se ve también en la compu |
| **Mis libritos = copias de seguridad** (`storage/copia-total.js`) | sólo «Borradores y copias»: **Importar copia de seguridad** (la de todos tus datos o la de un solo librito) y **Hacer copia de seguridad de mis datos** (un .zip con todos tus borradores y sus fotos, sonidos, videos y dibujos). Al importarla vuelven los que no estén en este aparato; los que ya están no se tocan. «Librito nuevo» quedó sólo en «Crear librito» |
| **Medido** | el cifrado de los avisos sale idéntico al ejemplo de la RFC 8291 y la firma VAPID la valida una librería independiente; de punta a punta con un servicio de avisos de prueba: suscribirse, aviso de mensajito/página/reacción descifrado con la llave del teléfono, nada si tienes el chat abierto, «Probar», aparato vencido que se borra, salir de la cuenta. En el navegador: ayudante de fondo y manifiesto, prender/apagar en ⋮, la notificación mostrada con su ícono, insignia y sonido, y abrir el chat desde ella. Menú lateral, ⋯, Mis libritos, copia de todo y su importación (sin duplicar). No probado con los servicios reales de Google y Apple ni en un iPhone o Android de verdad |

### Fase 34: Mensajitos nuevo (lila, audios, stickers tuyos, editar) y el editor más cómodo

| | |
| --- | --- |
| **Como la foto** (`components/chat.js`, `styles/mensajitos.css`) | lila suavecito de vidrio con corazoncitos dibujados, letra redondita (Nunito), botones blancos esponjaditos. Arriba **sólo su foto (sin corazón) y su nombre**, con «Siempre juntos ∞»; ya no dice «Mensajitos». Los ánimos, videollamada y llamada siguen igual (todavía no hacen nada / «Ay ora jeje») |
| **Burbujas y animaciones** | las tuyas lila con rosita, las suyas de vidrio blanco; al mandar, la tuya sale volando desde la barra con una curvita, aterriza con un rebotito tipo gelatina, un brillo que la cruza y un halo lila; las suyas llegan flotando desde su lado con un giro chiquito; al eliminar, se encoge, se desenfoca y su lugar se cierra suavecito |
| **Mantener presionado** | un mensajito (o clic derecho en la compu) se hunde despacito y abre su menú con todo lo demás borroso y la burbuja nítida encima: reacciones a lo suyo, y **Editar**, **Copiar** y **Eliminar** lo tuyo. Un toque normal ya no abre nada |
| **Editado** | al editar sale arriba de la barra «Editando tu mensajito» y el botón se vuelve ✓; abajito de la burbuja (sin taparla) dice **«Editado · hora»**, también del lado de tu amorcito y al instante |
| **Mensajes de voz** (`components/chat-voz.js`) | tocar 🎤 graba (con su punto rojo, su tiempo y ondas en vivo; el bote lo tira, ➤ lo manda; hasta 4 minutos). Se guardan en WAV para que suenen en todos los teléfonos. La burbuja es chiquita: ▶ con ondas que se expanden mientras suena, sus 48 rayitas que se van llenando (tocarlas adelanta) y la velocidad **x1 → x1.5 → x2 → x3** (se recuerda) |
| **Stickers como WhatsApp** (`components/chat-sticker.js`) | el gatito abre sólo **Stickers** (los que TÚ haces) y **Explorar stickers** (GIPHY). «Crear» usa una foto tuya: la mueves y acercas con los dedos, eliges corazón, círculo, redondito o completa, con borde blanco, y se sube. Mantener uno: **Agregar a favoritos** (★, hasta arriba) o eliminarlo; los demás se acomodan solitos por lo que más usas, con deslizamiento suave. Se siguen arrastrando a cualquier parte del chat |
| **GIFs y emojis** | GIF abre **GIFs favoritos** y **Explorar GIFs** (mantener un GIF lo guarda en favoritos); el 🙂 abre **sólo emojis** |
| **Sonidos propios** (`assets/sonidos-mensajitos/`) | todos los del chat en su carpeta: mandar (más suave), llegar, teclado, grabar, audio listo, play, menú, editar, eliminar, crear sticker y favorito |
| **Probar sin flechas solas** (`components/prueba.js`, `runtime/rt-player.js`) | al probar ya no salen las flechas del librito ni la abejita pidiendo poner botones: sólo los botones que tú pusiste (se pasa deslizando). En el teléfono la página va **a pantalla completa y del tamaño justo** (sin el celular de mentira ni espacios de sobra); en la compu sigue el celular lindo |
| **Crear librito** | sin «Mi librito de siempre»: quedan Librito nuevo y Abrir archivo |
| **Toques limpios** | lo de «pasar el ratón» ya sólo existe donde hay ratón (en el teléfono se quedaba pegado al tocar) y la onda del toque siempre se quita |
| **Menú principal sin deslizar** | todo cabe en la pantalla (probado de 320×568 a 1280×860): los tamaños siguen al alto de la pantalla y lo que sobra se reparte parejito. **Mensajitos** es ahora una tarjeta más, de dos en dos con Detallitos, Mis libritos y Mi perfil; ya no sale el globito con «0» |
| **Medido** | teléfono, compu y modo oscuro: cabecera sin «Mensajitos» ni corazón; un toque no abre el menú y mantener sí (con Editar/Copiar/Eliminar sólo en lo tuyo); editar con «Editado» abajito de los dos lados; eliminar para los dos; pestañas de cada panel; crear un sticker con una foto, favorito hasta arriba y mandarlo; GIF a favoritos; grabar con un micrófono de prueba, mandarlo como WAV, escucharlo y las cuatro velocidades; animaciones de llegar y mandar. Probar sin flechas y a pantalla completa en el teléfono; el menú sin deslizar en 6 tamaños; y siguen pasando dibujar en vivo, stickers libres, notificaciones, Mis libritos, el detallito, Probar página y los 270 sonidos. **No probado en un iPhone ni un Android de verdad** (el micrófono fue uno de prueba de Chromium y GIPHY, uno de mentira) |

### Fase 35: editor ordenado y aparte del librito de Marissa

| | |
| --- | --- |
| **Audio, más sencillo** (`components/secciones/audio.js`) | va justo debajo de Vídeo y sólo tiene **Música** y **Botón de música**. «Elegir canción» abre tus canciones (sólo **.mp3 o .wav**, guardadas en el librito y ordenadas por nombre) o sube una; al elegirla pregunta **«Sólo en esta página»** o **«En todo el librito»**. Su volumen y quitarla. Se fueron los duplicados: efectos, pistas, biblioteca, música del editor (está en ⚙) y reproducción |
| **Pistas y efectos en la línea de tiempo** | la campanita (efectos de sonido) y la onda (añadir pista) viven ahí, con el menú de cada pista: escuchar, volumen, bucle, silenciar, duplicar, recortar y quitar |
| **Sin sonidos predeterminados** (`herramientas/catalogo.mjs`) | los sonidos sueltos de `assets/` ya no salen en el editor: sólo los que tú subes |
| **Proyecto aparte** | sin «Volver al librito» (ni en el menú principal, ni en Crear librito, ni la flecha de arriba, que ahora vuelve al menú) y sin nada compartido con el libro: ni sus fotos, ni sus páginas HTML, ni sus canciones, ni `assets/audio`, `assets/img` o `musica assets/`, ni las canciones de los estilos que venían de sus carpetas. **El libro no se tocó** (sus archivos siguen ahí) y desde el libro se sigue entrando al editor |
| **Sin duplicados** | «Interactivo» ya no repite Vídeo, HTML, Piezas ni Escena 3D (cada uno tiene su pestaña) |
| **Stickers sin trabas** (`components/chat.js`) | al levantar un sticker el panel se hace a un lado y **todo el chat** queda libre para soltarlo, desde el primer intento (antes la parte del panel lo rechazaba); ya pegado, el panel se cierra. Nada de la pantalla se desliza mientras lo llevas y la lista sólo se mueve sola si te quedas en su orilla. El panel se recorre con el dedo sin levantar stickers por accidente (se levantan al mantenerlos un poquito más) |
| **Eliminar avisa** (servidor 1.10.0) | lo eliminado deja **«Aquí se eliminó un mensajito, tal vez foto o algo más»** para los dos (también al volver a abrir el chat); a ti te avisa y a tu amorcito también (con notificación si no tiene el chat abierto) |
| **Audios en HD** (`components/chat-voz.js`) | WAV de **48 kHz** (antes 16), sin el volumen automático del navegador (que deformaba), sin retumbos, con un compresor suavecito y al volumen justo sin saturar |
| **Tiendita Cool** | la tarjeta de abajo (donde estaba Mi perfil, con tu foto y fechas) ahora es «Tiendita Cool»: por ahora dice «En construcción xd...». Tu perfil se abre desde tu nombre, arriba |
| **Medido** | teléfono, compu y modo oscuro: Audio con sólo sus dos partes y debajo de Vídeo; subir una .wav, «En todo el librito» y «Sólo en esta página»; el selector sin nada del libro; efectos y pistas en la línea de tiempo; menú sin «Volver al librito» y con la Tiendita; eliminar con su burbujita de los dos lados y al reabrir; deslizar el panel de stickers; pegar un sticker al primer intento donde estaba el panel; la pantalla sin correrse; audio en 48 kHz; y siguen pasando las pruebas de antes (chat, Probar, Mis libritos, notificaciones, detallito, 270 sonidos, servidor). **No probado en un iPhone ni un Android de verdad**, ni con tu voz real (el micrófono es uno de prueba) |

### Fase 36: Sonidos, Crear Detallito, los ánimos del chat y tu género

| | |
| --- | --- |
| **Sonidos** (`components/secciones/audio.js`) | cuatro partes: **Música de la página** (la canción de esta página o de todo el librito), **Tus músicas** (todas con su nombre: las que subes y las de la carpeta, para escucharlas y usarlas), **Música del editor** (la que suena mientras editas, sólo para ti: nunca toca la de las páginas) y **Botón de música** |
| **La carpeta `EditorDev/musica/`** | pega ahí tus .mp3 o .wav y salen solas en «Tus músicas» y en «Música del editor», sin tocar código (`herramientas/catalogo.mjs` las pone en `musicaEditor`; recién pegadas, el editor mira la carpeta). La música de siempre de los estilos volvió (`estilos/*/musica.txt`) |
| **Arreglos** | los vídeos del iPhone ya entran (iOS los prepara después de cerrar el selector: el editor los espera); con un sticker suelto abajo, tu mensajito nuevo sale al final y debajo del sticker (ya no arriba); los audios ya no se graban con el clic del botón (se calla y empieza un ratito después; también se recorta la orilla) |
| **Menú principal** (`components/menu-principal.js`) | «**Crear Detallito**» con su frase («Convierte sus momentos juntos en una página hecha por ti, llena de recuerdos.»), la tarjeta «Ir al editor», el corazón y el hilo rojo entre las fotos más finos y animados, y al tocar los días juntos sale «**Próximamente, en construcción**» con brillitos (y se va solo) |
| **Editor** | Animar y Efectos van primero en la barra de abajo (y ya no en el menú deslizable); cada botón de abajo dice qué es; con la línea de tiempo abierta, el imán y centrar pantalla se suben a la esquina para no tapar nada; en el ⋯, «**Enviar Detallito**» va primero y resaltado con un brillito |
| **Los ánimos del chat** (`components/chat-animos.js`) | **Happy** (cálido, un sol sin carita y florecitas que se mecen), **Sad** (nubes y lluvia suave), **Hot** (llamitas al entrar y luego una brisa que quema, luz cálida) y **Hormonal** (destello carmesí con pétalos y chispitas; luego brasas que suben por las orillas, ondas de calor, reflejos sedosos que pasan por la cabecera y la barra, pétalos de vez en cuando y corazoncitos que aparecen y se van). Tocas uno y se enciende; otra vez, y se apaga; al cambiar, lo anterior se va antes de que llegue lo nuevo. Todo va **detrás** de los mensajes y de los botones (no tapa ni atrapa toques) y sólo anima transform y opacity. Con «menos movimiento» sólo cambian los colores |
| **Hormonal y tu género** | cada mensajito se anima según el género de quien lo manda: **Mujer** → rosa pastel (salpica agüita, late y escurre con gotitas brillantes, sin estirarse); cualquier otro → carmesí (se estira, late como corazón acelerado y escurre con gotas y salpicaduras, con su brillo carmesí). Al mandar escurre; al llegarte, un pulso tibio y un corazoncito del color de quien lo mandó. Al apagarlo, se enfrían tantito y vuelven a ser los de siempre (sin emojis). Las gotitas se borran al terminar y nada cambia el tamaño, el orden ni el lugar de los mensajitos |
| **Tu género** (`components/perfil.js`, servidor 1.11.0) | en tu perfil: Hombre, Mujer, LGBTQ+ u Otro. Lo eliges tú y sólo tú lo cambias; nunca se adivina. Sólo «Mujer» es rosa pastel |
| **Medido** | teléfono, compu y modo oscuro: los cuatro ánimos (encender, apagar, cambiar sin restos), que no tapen ni atrapen toques, Hormonal con ella rosa y tú carmesí, mandar y recibir, el frío al apagar, los mensajitos sin moverse, el orden con un sticker abajo, Sonidos con una canción pegada en la carpeta, el menú sin deslizar (390×844, 360×640, 1280×860), «Próximamente», la barra de abajo y «Enviar Detallito»; y siguen pasando las pruebas de antes. **No probado en un iPhone ni un Android de verdad** (tampoco el vídeo del iPhone ni tu voz real: el micrófono es uno de prueba) |

### Fase 37: que no caliente el celular (rendimiento), Enojado y menús ordenados

| | |
| --- | --- |
| **Lo que calentaba** (medido) | el menú principal tenía 75 animaciones corriendo **también escondido** debajo del chat y de Detallitos; «Crear librito», escondido, animaba 33 barritas de música de sus miniaturas; cada burbuja del chat desenfocaba lo de atrás (al deslizar, un desenfoque por burbuja en cada cuadro); y los ánimos movían cosas detrás de la cabecera y la barra con desenfoque. Con el chat abierto el gasto bajó de **22,6 % a menos de 1 %** de procesador (en la máquina de pruebas) |
| **Sistema inteligente** (`components/rendimiento.js`) | **oculta** (segundo plano): todo lo animado se pausa y nada despierta al aparato (el chat, el latido, la copia de cada 5 min y la abejita esperan a que vuelvas); **reposo**: tras 15 s sin tocar, lo decorativo (menú, ánimos, abejita, lo que se mueve en la hoja, demos de los paneles) se queda quieto donde iba y sigue al tocar (nunca mientras reproduces la línea de tiempo o suena un vídeo); **tapado**: lo que queda debajo de una pantalla completa se pausa; **ahorro**: si el aparato sufre (muchos cuadros lentos, la presión del procesador, pila baja sin cargar, ahorro de datos o muy poca memoria) quita los desenfoques, deja quieto lo decorativo, las partículas a la mitad y lo animado en JS a 30 cuadros; se quita solo al recuperarse (mínimo 2 min). `unaVez()` evita correr lo mismo dos veces a la vez; `ambito()` suelta escuchas, relojes y URLs de un jalón; cada 30 s mira si la memoria o los nodos sólo crecen (y libera cachés). En la consola: `EditorDev.rendimiento.informe()` |
| **Audio** | el motor de audio del editor y el de las páginas se **duerme** con la página oculta o la música apagada (encendido sin sonar gasta pila, sobre todo en el iPhone) y despierta justo antes de sonar |
| **Red** | lo mismo pedido dos veces a la vez viaja una sola vez (cada quien recibe su copia); el servidor 1.12.0 **comprime** (gzip) lo que vale la pena, contesta «304, no cambió» con lo que ya tienes (ETag) y sigue reutilizando la conexión (HTTP/1.1) |
| **Carga sólo lo necesario** | los GIFs y stickers del chat y de GIPHY cargan cuando se ven (`loading="lazy"`); las miniaturas de páginas se ven quietas, como foto |
| **Enojado** (antes Hot) | tormenta oscura con brasas rojas: nubes de tormenta, algún relámpago suave, vapor que sube por las orillas y venitas de enojo; al entrar, un destello rojo y la tormenta se sacude tantito (los mensajes nunca se mueven). **Iconos nuevos y distintos**: sol (Happy), nube con lluvia (Sad), carita enojada (Enojado) y corazón con cuernitos (Hormonal); los cuatro caben a lo ancho del teléfono |
| **Menús ordenados, sin repetir** | riel: Texto, Imágenes, Vídeo, Sonidos · Stickers, GIFs, Elementos, Bloques, Recursos · Al tocar, Pasar página, Interactivo · Tema, HTML, 3D, Herramientas (Transiciones ya no se repite: está abajo). Barra de abajo: Animar, Efectos, Fondo, Transición, Tiempo (Música vive en Sonidos). ⋯: Enviar Detallito, Guardar, Ver el librito, Compartir, Exportar, Páginas publicadas, Ver como, Copias, Revisar recursos, Recorrido (sin Herramientas, y lo que ya se ve arriba en la compu no se repite). Configuración: Rendimiento, Interfaz, Audio, Animaciones, Interacción, Abejita, Otros. Chat: «+» = Dibujar, Crear sticker, Espacio (la nota de voz es el micrófono de al lado); ajustes = Notificaciones, Privacidad, En este aparato, Temas, copia y borrar |
| **Medido** | teléfono, compu y modo oscuro: menú tapado y quieto con el chat encima, miniaturas quietas, reposo y vuelta al tocar, página oculta sin animaciones ni relojes, `unaVez`, un solo pedido para dos iguales, sin desenfoques en ahorro, gzip y 304 en el servidor, Enojado e iconos, el riel, la barra, el ⋯ y siguen pasando las pruebas de antes. **No probado en un iPhone ni un Android de verdad**: la temperatura y la pila reales hay que sentirlas en tus aparatos |

### Fase 38: editor reorganizado, modo profesional, Cositas Juntitos, mesecitos y ubicación

| | |
| --- | --- |
| **El riel, siempre a la vista** (`app.js`, `components/lateral.js`) | de arriba hacia abajo: **Pasar página, Bloques, Recursos, Elementos, Texto, Músicas** (antes «Sonidos»), **Imágenes, Videos**; luego Adornar (Stickers, GIFs), Tocar (Al tocar, Interactivo) y Avanzado (Temas, HTML, 3D, Herramientas). En el teléfono ya no hay pestañita: el riel se queda a la izquierda y al tocar una herramienta sale su panel de detrás. Animar, Efectos y Transición viven en la barra de abajo (no se repiten) |
| **Temas que sí funcionan** (`components/paneles.js`) | tocar un tema lo aplica a todo el librito: el fondo de cada página (liso o degradado), los textos y adornos que usaban sus colores; lo que pintaste de otro color se respeta. Cambiar Fondo/Texto/Acento o las letras también se aplica al momento. Todo se deshace de un jalón |
| **Mantener presionado = su menú** (`canvas/lienzo.js`) | Bloquear/Desbloquear, Ocultar/Mostrar, Traer al frente, Enviar atrás, Enviar al fondo, Alinear…, Animar al tocar, Añadir sonido, Añadir interacción y **Luz y color sólo donde tiene sentido** (fotos, vídeos, formas…, nunca en un texto). Ya no abre la luz directo. Lo oculto no se borra: «Mostrar lo oculto» en el menú de la hoja. La barra de lo elegido ya no repite nada de esto |
| **Modo profesional** (`components/modo-pro.js`) | «Tiempo» lleva con una transición suave a una pantalla aparte (noche de ciruela con acentos pastel): vista previa arriba, transporte y pistas (página, música, audios y una por elemento) y abajo las herramientas según lo elegido: **nada** → Texto, Imagen, Video, Música, Sonido, Sticker, Efectos, Transición (lo nuevo aparece en el cabezal); **un clip** → Dividir, Empieza/Termina aquí, Correr (±0,1 s / ±1 s), Animación, Efectos, Luz y color, Fotograma, Capa, Ocultar, Bloquear, Duplicar, Borrar; **un audio** → Volumen, Silenciar, Bucle, Empieza/Termina aquí, Correr, Duplicar, Quitar. Reproducir suena con la música. ⋯ guarda imán, bucle, música, marcador y zoom. «‹ Editor» (o Atrás/Esc) vuelve; todo queda en la página |
| **Página principal** | sin desplazamiento de 320×568 a 1366×768 (medido en 9 tamaños), sin nombres cortados. Tocar los días juntos abre **Cositas Juntitos**; el día que cumplen un mes más, una cintita lo dice y abre sus Mesecitos |
| **Cositas Juntitos** (`components/juntitos.js`, `styles/juntitos.css`) | «Cositas Juntitos» · «Selecciona qué hacer con tu pareja o amiga/o». **Te extraño** y **Decir te amo** le llegan (con notificación); **caca, pis, agua y palabrotas** cuentan (hoy y en total); **chismes, enojos y colapsos** se escriben (privados salvo que los compartas); **¿Hoy me duché?** es sí/no con racha. Mantener presionada una tarjeta: compartir ese contador o quitar el último. Barra de abajo: Cositas, Mesecitos, Mapa, Diario. La página se desliza; la barra siempre a la mano |
| **Mesecitos** | con la fecha de novios se calcula cada mes cumplido (el 31 + 1 mes = el último día del mes siguiente). Cada mes tiene **una sola** página (título, carta, hasta 6 fotos y color), la hace quien llegue primero, a la otra persona le llega el aviso y se reabre cuando quieran, como una cartita con sello |
| **Ubicación compartida** (`components/ubicacion.js`) | la de verdad (GPS/servicios del aparato), **sólo si tú tocas «Compartir mi ubicación»**; «Dejar de compartir» la apaga y la borra del servidor. Mapa (Leaflet + OpenStreetMap, se carga sólo al abrirlo) con la foto de cada quien, desde cuándo está en ese lugar y cuándo se actualizó; avisa si alguien no comparte o no hay conexión. Cuida la pila: poca exigencia, sólo con la app a la vista, manda si te moviste 25 m o cada 2 min. **Lugares** (hasta 10): nombre, radio de 50 m a 2 km, a quién avisar y avisos encendidos/apagados; el servidor detecta entrar/salir (con margen para el GPS) y manda la notificación |
| **Lo que falta para la ubicación en segundo plano** | la web **no puede** seguirte con la app cerrada o en segundo plano: los avisos de lugares funcionan mientras la app está abierta en el aparato de quien se mueve. Para que funcionen siempre hace falta la **app nativa** (Capacitor/Android/iOS) con ubicación en segundo plano (Android: permiso `ACCESS_BACKGROUND_LOCATION` y `GeofencingClient`; iOS: «Siempre» y `CLLocationManager` con regiones) que mande la posición al mismo `PUT /api/ubicacion`; el servidor ya está listo |
| **Medido** | teléfono, compu y modo oscuro: el riel y sus nombres sin cortar, temas aplicados y deshechos, el menú de mantener (texto sin luz), bloquear que no se mueve, capas en orden real, ocultar y mostrar, el modo profesional (transición, herramientas sin cortar, añadir en el cabezal, correr 0,1 s, reproducir, volver), las 10 cositas con sus datos y su privacidad, el mesecito sin duplicados, la ubicación con permiso, el lugar y dejar de compartir, y siguen pasando las pruebas de antes. **No probado en un iPhone ni un Android de verdad**, ni las notificaciones de lugares en la calle |

### Fase 39: línea de tiempo como CapCut, idiomas, editor más finito y arreglos

| | |
| --- | --- |
| **La abejita ya no congela** (`mascota/abeja.js`) | con el aparato en ahorro, esperar «a que toques algo» se volvía un bucle sin fin que dejaba la pantalla en blanco (aun al recargar). Ahora descansa con reloj; medido: la página sigue a ~60 cuadros/s con la abejita en ahorro. |
| **Tocar otra vez cierra** (`components/ui.js`, `app.js`, `components/modo-pro.js`) | menús ⋯, popovers, pestañas del riel y las del modo profesional: el segundo toque cierra (antes se volvían a abrir). |
| **Menú principal sin desplazarse de verdad** (`components/menu-principal.js`) | usa el alto que de verdad se ve (`visualViewport`, sin la barra del navegador) y, si no cabe, todo se acomoda un poquito más chico. Medido en 320×480, 360×640, 390×664 y 390×844. Las fotitos llevan sólo la **inicial** y el corazoncito. |
| **Más finito** (`styles/editor.css`) | en el teléfono: barra de arriba, riel, cajón, barra de abajo y el globito de la abejita más chicos, para que se vea más la página. |
| **Sonido de girar constante** (`audio/sonidos-editor.js`) | suena todo el giro (más agudo cuanto más rápido), baja a un murmullo si el dedo se queda quieto y se apaga al soltar. |
| **Línea de tiempo como CapCut** (`components/modo-pro.js`, `timeline/linea.js`) | negra; arriba ✕ · la página (para cambiar de página) · ⋯ · **Probar**. La fila del reproductor: reloj · ▶ · deshacer/rehacer. **Cabezal blanco fijo al centro**: se desplaza la línea (desplazar = ir en el tiempo; al reproducir, la línea corre debajo). La página es el **clip principal con sus cuadritos**, con la anterior y la siguiente asomándose, el **cuadrito de transición** entre ellas (tócalo y elige) y el **+** para otra página. Clips de colores con su nombre dentro, **«Añadir audio»** y herramientas con su nombre abajo. |
| **Cortar página** | corta la página en el cabezal: lo de antes se queda (y pasa sola a la segunda en ese instante), lo de después pasa a una página nueva con sus tiempos corridos (también audios y marcadores). Se deshace de un toque. |
| **Pestañas finitas en la línea** | Bloques, Recursos, Elementos, Texto, Música, Imágenes, Videos, Stickers, Efectos y Sonido abren un panel finito encima de las pistas (la vista previa se sigue viendo). |
| **Vídeos al reproducir** | los vídeos de la hoja se reproducen con la línea, a su hora y desde su punto; en pausa muestran ese cuadro. |
| **Idiomas** (`config/preferencias.js`, `mascota/dialogos.js`) | Configuración → **Idioma**: **Latinoamérica** (de fábrica), **México** y **Dev** (el de antes). Fuera de Dev no salen los textos que dicen dónde añadir cada cosa ni los consejos automáticos; en Dev sí, con las frases de `dialogos.txt`. **«Habilitar lenguaje poquitito explícito»**: la abejita habla más suelta («wey», «qué onda», «no manches»…). |
| **Mapa en satélite** (`components/juntitos.js`) | satélite con calles y nombres encima (o mapa de calles, se recuerda), botón para ver a los dos, un hilito entre ustedes y **a cuánto están**; pines con su latido (se calma en ahorro). |
| **Medido** | `ed39` (34 comprobaciones, teléfono y compu), `jt39` (mapa), y de nuevo `ed38`, `rend37`, `menu36`, `chat36`, `editor36`, `libritos33`, `fantasma28`, `probar28`, `sonidos24` y `verificar`: todo en verde. **No probado en aparatos de verdad** (sólo Chromium con pantalla de teléfono). |

### Fase 40: My Love Pages, LovEdit, Dibujar Juntos y un servidor que se muda de teléfono

| | |
| --- | --- |
| **Nombres** | la app ahora se llama **My Love Pages** (título, ícono en la pantalla de inicio, menú principal y Configuración); la línea de tiempo se llama **LovEdit** (con su nombre arriba). Su servidor sigue siendo M.YNTHN. |
| **Dibujar Juntos** (`components/dibujo-juntos.js`) | en Cositas Juntitos, en lugar de Diario: una hoja de los dos **en tiempo real** (ves crecer el trazo de tu amorcito, con su lápiz y su nombre). 8 pinceles (lápiz, pluma, marcador, acuarela, neón, brillitos, corazones, borrador), colores, grosor, deshacer, varias hojas con nombre y fondo (papel, cuadritos, rayitas, rosita, noche), guardar o compartir como imagen. Cada pincel **suena** mientras lo mueves. **Lápiz virtual**: con el dedo, la punta queda arriba del dedo (se ve el lápiz y una guía), así el dedo no tapa lo que dibujas. |
| **Cositas Juntitos más vivo** (`components/juntitos.js`, `styles/juntitos.css`) | la barra de abajo con una pastillita que se desliza, páginas que entran desde el lado de su pestaña, tarjetitas que aparecen una tras otra, título con brillo; todo se calma en ahorro o reposo. **Cada pestaña con lo suyo arriba**: Cositas → **Notas** (lo que era Diario: tus chismes, enojos y colapsos y lo que te compartieron; también manteniendo presionada su tarjetita), Mesecitos → cuánto falta para el siguiente. |
| **Medido** | `jt40` (Cositas, Notas, Mesecitos, mapa y Dibujar Juntos con dos cuentas: lo que dibuja una le llega a la otra, el lápiz virtual queda 64 px arriba del dedo, el sonido suena, su lápiz y «… está dibujando» en vivo, deshacer, hojas nuevas), en teléfono y compu; y de nuevo `ed39`, `ed38`, `rend37`, `menu36`, `chat36`, `libritos33`, `fantasma28`, `probar28`, `sonidos24`, `verificar`. **No probado en aparatos de verdad.** |

### Fase 41: LovEdit de corrido, páginas profesionales, una abejita que revisa y bloques pro

| | |
| --- | --- |
| **LovEdit de corrido, como CapCut** (`timeline/linea.js`) | ya no hay que tocar las páginas para editarlas: la pista principal trae **todas las páginas seguidas** (cada una es un clip con su nombre; la de ahora, con aro blanco) y el **cuadrito de transición** entre cada una. Al desplazar la línea, la página cambia **sola** al cruzar a la siguiente y la transición se ve **en vivo** en la vista previa; al reproducir, pasa de una página a otra con su transición. El reloj cuenta el tiempo de todo el librito. Las pistas de la página de ahora se ven en su lugar dentro del tiempo total. Al elegir una transición, se reproduce desde un poquito antes para verla. |
| **La pestañita** (`components/modo-pro.js`) | en el teléfono, en LovEdit: una pestañita a la izquierda; tócala o deslízala a la derecha y sale el menú (Bloques, Recursos, Elementos…) **por un lado, encima de las pistas**: la página de arriba se sigue viendo entera. Tocarla otra vez lo cierra. En la compu, «Bloques» y lo demás están en la barra de abajo de LovEdit. **LovEdit va primero** en la barra de abajo del editor. |
| **Páginas profesionales con tu enlace** (`components/myn.js`, `integraciones/servidor.js`) | al publicar: **tu enlace** (`…/publicaciones/<el-que-tú-quieras>/`) con aviso al momento de si está libre (y una sugerencia si ya es de otra página), una descripción **para compartir** y la **tarjeta** que sale al mandar el enlace por WhatsApp o redes (1200×630, con la portadita). Al terminar: el enlace, un **código QR** y **enlace a cada página** (`#2` abre directo en la página 2). El librito publicado trae su título, descripción e imagen para compartir (`og:`/`twitter:`). |
| **La abejita revisa tu librito** (`mascota/revisor.js`, `components/ayuda.js`) | «Revisa mi librito» (en su globito y en Configuración → Abejita): saca su **lupa**, mira cada página y te dice qué **se ve un poco mal** (algo que se sale de la hoja, letra muy chiquita, texto del mismo color que lo de atrás, página vacía, sin cómo pasar de página, un botón cuyo enlace está vacío o que muestra algo que ya no existe), qué **se puede mejorar** (textos encimados, foto borrosa o estirada, casi centrado, texto larguísimo, falta poner una foto, botón de música sin canción) e **ideas** (muchas letras distintas, muchas transiciones, sin música, enlaces de ejemplo). **«Enséñamelos»** va a cada cosa y la elige; **«Arréglalo»** la arregla de un toque cuando se puede. A ratos, sola, te avisa «Psst…» si algo de la página que ves se ve mal (una vez cada cosa). |
| **Nunca tapa** (`mascota/abeja.js`, `canvas/lienzo.js`) | ella y su globito buscan un hueco libre (sin tapar la hoja, la línea de tiempo ni lo abierto). Si no hay (teléfono), el globito se pone abajo, a lo ancho, con ella adentro, y **la hoja se hace a un ladito hacia arriba** para que tu página siempre se vea entera. |
| **Más viva y más chistosa** (`mascota/abeja.js`, `mascota/dialogos.js`) | ojitos que siguen tu dedo y parpadean, antenitas que se mueven, bailecito al guardar y publicar, se asoma a mirar; muchas frases nuevas (Latinoamérica, México y poquitito explícito) y comentarios según la hora, cuánto llevas editando, cuántas páginas y si hay música. |
| **Bloques profesionales** (`components/secciones/bloques.js`) | ahora en grupos (Para empezar, Nuestra historia, Fotos y vídeo, Para tocar, Para terminar) y 11 nuevos: **Portada pro** (banda de color, título enorme, Empezar y Música), **Separador**, **Nuestra historia** (línea del tiempo con fechas), **Nuestros números**, **Nuestra canción** (disco y «Escuchar»), **Mural de fotos**, **Sorpresa** (un mensaje escondido que sale al tocar «Ábrelo»), **Preguntas** (tocas cada pregunta y aparece su respuesta), **¿Sí o no?** (el «No» brinca cuando lo tocas), **Enlaces** (tu foto y botones a tu playlist, chat o lugar) y **Final** (volver a empezar). Todos con las letras y colores de tu librito, y cada botón hace algo de verdad. |
| **Medido** | `ed41` (LovEdit de corrido, pestañita, revisión de la abejita sin tapar, Enséñamelos/Arréglalo, los 21 bloques, preguntas que se abren en el librito), `pub41` (enlace propio libre/ocupado, sugerencia, tarjeta, `#2`), en teléfono y compu; y de nuevo `ed39`, `ed38`, `jt40`, `rend37`, `menu36`, `chat36`, `editor36`, `libritos33`, `fantasma28`, `probar28`, `sonidos24`, `srv40`, `srv38` y `verificar`. **No probado en aparatos de verdad** (sólo Chromium con pantalla de teléfono y de compu). |

## Cómo está hecho

```
EditorDev/
├── index.html · app.js     el editor y su arranque
├── core/        modelo.js (cómo es un librito) · estado.js (la única puerta para cambiarlo)
├── history/     historial.js (deshacer/rehacer por parches)
├── storage/     db.js (IndexedDB: proyectos, páginas y archivos por separado) · autoguardado.js
├── assets/      biblioteca.js · optimizar.js · dibujos.js · selector.js · librito.js (el librito de siempre)
├── canvas/      lienzo.js (selección, transformaciones, límites, hoja automática) ·
│                gestos.js (un cuadro por movimiento, nodos reciclables) · guias.js (imán, reglas)
├── pages/       panel.js (lista con miniaturas)
├── templates/   plantillas.js
├── timeline/    linea.js (línea de tiempo tipo editor de vídeo)
├── audio/       mezclador.js (MusicaDev, pistas con onda, «ducking») · sonidos-editor.js
├── html/        editorHtml.js (HTML completo en un bloque) · importar.js (hacer editable, importar el librito)
├── export/      zip.js (escribir y leer .zip) · exportar.js · abrir.js
├── componentes/ catalogo.js (lo que hay en assets/) · analizar.js (zona táctil y fondo, sin tocar nada)
├── components/  lateral.js (cajón que sigue al dedo) · guardas.js (comportarse como app) ·
│                ui.js · inspector.js · paneles.js · barra.js (contextual) · iconos.js (SVG) ·
│                acciones.js · vista.js · inicio.js · teclado.js ·
│                hoja.js (hojas con asa y resorte) · pantalla.js (teclado virtual, orientación) ·
│                morfo.js (repintar sin parpadeo) · prueba.js · salir.js · ajustes.js · ayuda.js ·
│                menu-principal.js · exportar-menu.js · detallitos.js · chat.js (Mensajitos) · cuenta.js · myn.js (M.YNTHN)
│   └── secciones/  animar · efectos · transiciones · giphy · audio · html · fondo · navegacion
├── sw.js · manifest.webmanifest · iconos/   el editor como app: notificaciones push con su ícono
├── recursos/    extras.js (animaciones, transiciones, efectos y fondos propios o de assets/)
├── integraciones/ giphy.js (clave protegida) · gif.js (leer GIF, quitar fondo → APNG) · servidor.js (M.YNTHN)
├── runtime/     EL REPRODUCTOR: rt-base · rt-render (y la hoja automática) · rt-anim (y el tiempo) ·
│                rt-comps · rt-3d (WebGL2) · rt-trans · rt-toques (efectos al tocar y zonas) · rt-musica ·
│                rt-player · librito.css · reproductor.html
├── estilos/     cuaderno · retromylove · baddie (cada uno: estilo.css, imágenes, fuentes/, musica/, musica.txt)
└── styles/      editor.css (la base de todo) · myn.css (menú principal, Exportar, Detallitos)
```

- Reusa del libro `src/utils/dom.js` (`el`), `src/core/Emitter.js`,
  `src/utils/color.js`, las paletas de `src/data/paletas.js` y las listas de
  `src/data/contenido.js`, `manifest.js` y `chapters.js`.
- El reproductor (`runtime/`) son guiones clásicos (no módulos) para que el
  .zip abra también como archivo suelto en el teléfono.
- `herramientas/verificar.mjs` revisa también la sintaxis de todo `EditorDev/`.
- `herramientas/catalogo.mjs` (lo llama `contenido.mjs`, también en GitHub a
  cada subida) escribe `assets/catalogo.js` con lo que hay en `assets/` y en
  `musica assets/`.
- Separación: **interfaz** (components/, canvas/), **motor del libro**
  (runtime/: el mismo para el lienzo, la vista previa y el .zip), **assets**
  (componentes/, assets/), **datos** (core/, storage/, history/), **exportar**
  (export/). Los componentes viven en su propio documento (su CSS y su JS no
  tocan ni el editor ni los demás).
- Los borradores viven en el navegador (IndexedDB). Si borras los datos del
  sitio, se borran: con tu cuenta de M.YNTHN cada guardado a mano deja una
  copia en tu carpeta del servidor, y el .zip sigue sirviendo para guardarlos.
