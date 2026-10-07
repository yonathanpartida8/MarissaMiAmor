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

A la izquierda, las categorías con su icono y su nombre: Páginas, Elementos,
Texto, Imágenes, Vídeo, Audio, Efectos, Animar, Transiciones, Interactivo,
Piezas, HTML, 3D, Tema y Herramientas. En la computadora van fijas (el panel
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
| **Música** | `EditorDev/MusicaDev.mp3` (una cajita musical suave en bucle; cámbiala por la tuya con el mismo nombre). Intenta sonar al entrar y, si el navegador no deja, empieza con el primer toque. Un solo reproductor para todo el editor: no se reinicia al cambiar de sección. La notita de arriba la enciende/apaga con fundido; mantenerla presionada abre el volumen. Lo de `DevMusic/` suena después |
| **Barra de arriba** | ⚙ Configuración · nombre · deshacer/rehacer · **1/3 (Páginas)** · música · Probar · y «⋯ Más» en el teléfono (librito, ver como, guardar, exportar, herramientas). Páginas ya no está en la barra lateral |
| **⚙ Configuración** | modos Rendimiento / Equilibrado / Calidad; refresco 30–144 Hz **sólo hasta lo que da tu pantalla** (se mide con requestAnimationFrame); calidad; partículas; efectos en la hoja; FPS; diagnóstico; movimiento e intensidad; música, efectos y voz de la abejita; vibración; ayudas, etiquetas y consejos; tema, tamaño y transparencias; restaurar y limpiar datos temporales. Se guarda en el aparato |
| **Abejita** | mascota con caras (feliz, guiño, enamorada, sorpresa…), alas, rebotes, vueltas y brillitos; se mueve sola mientras está y nunca bloquea botones. Reacciona al insertar, guardar, borrar y exportar. Su voz son blips hechos con Web Audio (sin archivos) |
| **dialogos.txt** | en la carpeta principal. Una frase por línea, `#` = comentario, una línea con `-` = evento especial: «hackeo» con glitch, terminal, «OH... ESTOY SIENDO HACKEADO...» y luego el mensaje. Todo es sólo texto: nunca se ejecuta nada |
| **Recursos** | biblioteca por categorías (botones, marcos, tarjetas, hojas, dibujos, efectos, reproductores, retratos, GIFs, stickers, decoraciones, otros) con vista previa real aislada (sandbox), descripción e «Insertar». Sólo se animan las que se ven |
| **GIPHY** | ya viene conectado (`integraciones/giphy-config.js`); un proxy o el servidor local siguen teniendo prioridad si los configuras |

Código: `config/` (preferencias, cuadros/Hz), `mascota/` (abeja, dialogos, glitch), `components/configuracion.js`, `components/secciones/biblioteca.js`.

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
│                morfo.js (repintar sin parpadeo) · prueba.js · salir.js · ajustes.js · ayuda.js
│   └── secciones/  animar · efectos · transiciones · giphy · audio · html · fondo · navegacion
├── recursos/    extras.js (animaciones, transiciones, efectos y fondos propios o de assets/)
├── integraciones/ giphy.js (clave protegida) · gif.js (leer GIF, quitar fondo → APNG)
├── runtime/     EL REPRODUCTOR: rt-base · rt-render (y la hoja automática) · rt-anim (y el tiempo) ·
│                rt-comps · rt-3d (WebGL2) · rt-trans · rt-musica · rt-player · librito.css · reproductor.html
└── styles/      editor.css
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
  sitio, se borran: exporta el .zip para guardarlos de verdad.
