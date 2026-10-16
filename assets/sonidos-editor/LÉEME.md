# Sonidos del editor

Cada interacción del editor tiene **su propio archivo**, con el nombre de lo
que hace. Para cambiar un sonido, pon otro archivo con **el mismo nombre**
(`.wav`, `.mp3`, `.ogg` o `.m4a`) y listo: no hay que tocar nada del editor.

- **Varias versiones del mismo sonido:** añade `-2`, `-3`… al final del nombre
  (`seleccionar-elemento-2.wav`). Se turnan solas, sin repetir la última.
- **Quitar un sonido:** borra su archivo; ese momento suena con un sonidito
  suave hecho por el editor (o con nada, si no tiene).
- **Volumen o silencio:** Herramientas → Sonidos del editor.
- **Que no se repitan iguales:** cada vez suenan con un tono apenas distinto, y
  lo que se repite seguido (elegir, pegar con el imán, colocar, duplicar,
  ordenar capas, fotogramas) **sube por la escala** como una escalerita; tras
  una pausa vuelve a empezar.

Los de aquí los genera `node herramientas/sonidos-editor.mjs` (todos en la
misma escala, para que combinen). Si cambias uno a mano, no vuelvas a correr
esa herramienta o lo sobrescribe (puedes pasarle sólo los nombres que quieras
rehacer: `node herramientas/sonidos-editor.mjs tocar-boton`).

Después de añadir o cambiar archivos, el catálogo se rehace solo al subir
(o con `node herramientas/contenido.mjs`).

## Qué suena cuándo

| Archivo | Cuándo suena |
| --- | --- |
| `tocar-boton` | tocar cualquier botón |
| `seleccionar-elemento` | elegir un elemento de la hoja |
| `seleccionar-varios` | elegir varios a la vez |
| `deseleccionar` | dejar de elegir (tocar la hoja vacía) |
| `elegir-herramienta` | una herramienta del riel o de la línea de tiempo |
| `menu-mantener` | mantener presionado para abrir el menú |
| `deslizador` | mover un deslizador (un «tic» muy suave, con tope) |
| `arrastrar-pintura` | empezar a arrastrar un elemento (sale la estela de pintura) |
| `pincel-roce` | mientras se arrastra, de vez en cuando (más fuerte cuanto más rápido) |
| `soltar-objeto` | soltar lo que se arrastraba |
| `iman-pegar` | cuando el imán lo pega a una guía |
| `mover-hoja` | desplazar la hoja con el dedo |
| `girar-objeto` | empezar a girar |
| `cambiar-tamano` | empezar a cambiar el tamaño (manijas o dos dedos sobre el elemento) |
| `zoom-acercar` | empezar a acercar la hoja (dos dedos, rueda, botones o doble toque) |
| `zoom-alejar` | empezar a alejar la hoja |
| `zoom-paso` | cada escalón de zoom: más agudo cuanto más cerca |
| `colocar-objeto` | poner algo nuevo en la hoja |
| `duplicar` | duplicar |
| `borrar-objeto` | borrar |
| `agrupar` / `desagrupar` | agrupar y desagrupar |
| `ordenar-capas` | subir o bajar de capa |
| `bloquear` / `desbloquear` | el candado |
| `ocultar` / `mostrar` | el ojito |
| `dibujar-trazo` | terminar un trazo de dibujo |
| `borrador` | borrar con el borrador |
| `elegir-color` | elegir un color |
| `aplicar-efecto` | poner un efecto |
| `aplicar-animacion` | poner una animación o una secuencia |
| `fotograma` | poner o mover un fotograma clave |
| `escribir-texto` | empezar a escribir un texto |
| `deshacer` / `rehacer` | deshacer y rehacer |
| `guardar` | se guardó |
| `listo-exito` | algo terminó bien (exportar, compartir…) |
| `aviso-error` | algo salió mal |
| `abrir-menu` / `cerrar-menu` | abrir y cerrar paneles y hojas |
| `abrir-recursos` / `cerrar-recursos` | sacar y guardar el menú de recursos (Elementos, Stickers, Efectos, GIFs…), en el riel, el cajón del teléfono o su hojita |
| `bajar-hoja` / `subir-hoja` | bajar una hoja deslizable a una parada más chica o volver a subirla |
| `atras` | «Atrás» en un menú o el atrás del teléfono |
| `interruptor-encender` / `interruptor-apagar` | los interruptores |
| `probar-pagina` | abrir «Probar página» |
| `pagina-nueva` / `pagina-duplicar` / `pagina-cambiar` | crear, duplicar o cambiar de página |
| `pagina-borrar` / `pagina-reordenar` | borrar o mover una página |
| `reproducir` / `pausar` | escuchar una canción de la biblioteca |
| `publicar` | publicar una página en «Páginas publicadas» |

Si quieres que un momento use otro archivo, la lista está en
`EditorDev/audio/sonidos-editor.js` (`ARCHIVO`).
