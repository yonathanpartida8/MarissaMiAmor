# 📖 Crear librito — el editor

Un taller visual para armar libritos interactivos (o editar el de siempre)
sin tocar código. Se abre desde el librito: **☰ índice → «📖 Crear librito»**,
o directo en `EditorDev/index.html`.

Todo vive aquí dentro. El libro no carga nada del editor hasta que se entra,
y el editor no toca ni un archivo del libro: lee sus listas y sus páginas,
pero lo que hagas se guarda aparte.

---

## Qué se puede hacer

| | |
| --- | --- |
| **Páginas** | nuevas en blanco, desde plantilla o desde tus páginas HTML; duplicar, borrar, reordenar arrastrando ⠿, renombrar, dejar en blanco (una o todas), **dejar sólo una en blanco**, poner de portada |
| **Añadir** | textos (título, subtítulo, párrafo, a mano, frase, etiqueta), fotos, marco vacío, **álbum**, **carrusel**, 12 formas, 27 dibujos y adornos, **dibujo a mano** ✏️, botón, vídeo, HTML propio, página original |
| **Editar en la hoja** | arrastrar, cambiar tamaño, girar (se pega a 0/45/90°), duplicar, borrar, bloquear, ocultar, alinear, repartir, traer adelante/atrás, varios a la vez (Mayús o marco), doble toque: escribir el texto directo / recortar la foto / abrir el HTML |
| **Texto** | contenido, letra (16, se piden sólo las usadas), tamaño, color, grosor, cursiva, subrayado, mayúsculas, alineación, vertical, interletra, interlínea, sombra, opacidad, giro, posición, animación |
| **Fotos** | subir (se optimizan solas: 2048 px y WebP), cambiar, **recortar/encuadrar**, acercar, forma (círculo, corazón, estrella, arco…), marco polaroid o cinta, bordes, esquinas, sombra, filtros (brillo, contraste, color, b/n, sepia, desenfoque), opacidad |
| **Álbum** | cuadrícula, mosaico, tira que se desliza, polaroids sueltas o pila; columnas, espacio, esquinas, marco, proporción, ampliar al tocar, **cómo aparecen** las fotos (en cascada) |
| **Carrusel** | deslizar, fundido o cartas 3D; horizontal o vertical; solo, cada cuánto, velocidad, bucle, puntitos, flechas, espacio, esquinas |
| **Animaciones** | por elemento: **entrada** (11), **bucle** (9), **salida** (8) y **animación propia** con fotogramas (x, y, escala, giro, opacidad, desenfoque); duración, retraso, ritmo, dirección, distancia, repeticiones, ida y vuelta; **línea de tiempo** ⏱ (arrastrar = retraso, estirar = duración, tocar la regla = ver ese instante) |
| **Transiciones** | 11: fundido, disolver, deslizar, desplazamiento, zoom, voltear, pasar la hoja, desenfoque, círculo, cortina y **personalizada**; la del librito y la de cada página; duración, dirección, ritmo |
| **Música** | la del librito y la de cada página (o silencio), volumen, bucle; tus canciones o las que ya están en el librito; se funden al cambiar |
| **HTML** | bloques `</>` con su editor y vista previa al lado, **aislados** en su propio marco (no pueden tocar el editor, la navegación, las otras páginas ni los estilos) |
| **Mis páginas** | tus `paginas-html/` como **plantilla editable** o **tal cual** (ver abajo) |
| **Ajustes** | nombre, tamaño de hoja (5 + a medida, con «acomodar lo que hay»), portada, flechas, deslizar, progreso, índice, «toca para abrir», al terminar, pasar solas |
| **Editor** | cuadrícula, imán, reglas, **guías** (se arrastran desde las reglas), márgenes seguros, zoom (ajustar, 50–200 %, rueda, pellizco) |
| **Guardar** | **autoguardado** (espera 0,8 s sin tocar, como mucho 5 s; sólo lo que cambió), deshacer/rehacer (150 pasos, sólo lo que cambió), borradores: abrir, nuevo, duplicar, borrar |
| **Exportar** | **.zip** con todo lo necesario y SÓLO lo usado; se vuelve a abrir en el editor |

## 🧩 Componentes de `assets/` (HTML de verdad)

Todo lo que dejes en **`assets/<categoría>/<componente>/index.html`** (con su
CSS, JS, imágenes, sonidos y fuentes al lado) aparece solo en
**🧩 Componentes**, agrupado por categoría y con su miniatura en vivo. Las
imágenes sueltas de `assets/` salen en **Elementos → Dibujos y adornos** y los
sonidos en **🎵 Audio**. La guía para crearlos está en `assets/LÉEME.md`.

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

## 🎵 Música y sonidos

- **`musica assets/`**: deja ahí tus canciones y salen en **🎵 Audio**, con
  «De fondo» (todo el librito) o «Aquí» (sólo esta página).
- **Sonidos** para cualquier elemento: al tocarlo y al aparecer (inspector →
  Sonidos), y al pasar de página (🎞️ Transiciones → «Sonido al pasar», o el
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

En **📄 Páginas → 📚 Mis páginas** (o 🧩 → «Página original»):

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
  siempre: las páginas HTML tal cual (con «✨ Hacer editable») y las de
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
  sólo cuando se usan. Sin librerías: ni three.js, ni zip, ni nada.
- Animaciones con la API del navegador (`transform` y `opacity`); la línea de
  tiempo las pausa y las lleva a cualquier instante.
- Las miniaturas se pintan cuando aparecen y se repintan un rato después de
  tocar la página, nunca a cada tecla. El panel no se rehace al arrastrar:
  sólo cambian los números.
- Las fotos se reducen al subirlas. En el librito exportado se adelanta la
  siguiente página (datos y fotos) mientras ella lee.

## Teléfono, tableta y computadora

En el teléfono: el lienzo ocupa la pantalla, abajo van las pestañas
(Páginas, Añadir, Diseño, Animar, Capas, Más) y los paneles suben como
hojas. Manijas grandes para el dedo, dos dedos para acercar, toque largo
para nada (no estorba al desplazarse).

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

## Cómo está hecho

```
EditorDev/
├── index.html · app.js     el editor y su arranque
├── core/        modelo.js (cómo es un librito) · estado.js (la única puerta para cambiarlo)
├── history/     historial.js (deshacer/rehacer por parches)
├── storage/     db.js (IndexedDB: proyectos, páginas y archivos por separado) · autoguardado.js
├── assets/      biblioteca.js · optimizar.js · dibujos.js · selector.js · librito.js (el librito de siempre)
├── canvas/      lienzo.js (zoom, selección, manijas, gestos) · guias.js (imán, reglas, guías)
├── pages/       panel.js (lista con miniaturas)
├── templates/   plantillas.js
├── animations/  linea.js (línea de tiempo)
├── html/        editorHtml.js · importar.js (hacer editable, importar el librito)
├── export/      zip.js (escribir y leer .zip) · exportar.js · abrir.js
├── componentes/ catalogo.js (lo que hay en assets/) · analizar.js (zona táctil y fondo, sin tocar nada)
├── components/  ui.js · inspector.js · paneles.js · barra.js (contextual) · iconos.js (a crayón) ·
│                acciones.js · vista.js · inicio.js · teclado.js
├── runtime/     EL REPRODUCTOR: rt-base · rt-render · rt-anim · rt-comps · rt-trans ·
│                rt-musica · rt-player · librito.css · reproductor.html
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
