# Sonidos del editor

**Todo lo que suena en el editor** (botones, menús, Detallitos, las reacciones, el
gatito del menú, la abejita…) tiene **su nombre** aquí. Para cambiar un sonido,
pon tu archivo con ese nombre y listo: no hay que tocar nada del editor.

- **Con tu archivo:** `reaccion-te-amo.mp3` (también `.m4a`, `.ogg` o `.aac`).
  **Tu archivo manda:** en cuanto hay uno tuyo con ese nombre, los `.wav` de
  fábrica de ese nombre dejan de sonar (no hace falta borrarlos). También puedes
  reemplazar el `.wav` directamente.
- **El nombre se lee fácil:** sin importar mayúsculas, acentos ni espacios
  (`Reacción Te Amo.mp3` = `reaccion-te-amo`).
- **Varias versiones, para que nada se repita:** añade `-2`, `-3`… al final
  (`reaccion-te-amo-2.mp3`). Se turnan solas y nunca suena la misma dos veces
  seguidas. Los de fábrica ya vienen en **tres versiones** cada uno (otra
  figura u otro tono), salvo los que suben por la escala al repetirse.
- **Quitar un sonido:** borra sus archivos; ese momento suena con un sonidito
  suave hecho por el editor (o con nada, si no tiene).
- **Volumen o silencio:** Herramientas → Sonidos del editor.
- **Que no suenen robóticos:** cada vez suenan con un tono apenas distinto, y
  lo que se repite seguido (elegir, pegar con el imán, colocar, duplicar,
  ordenar capas, fotogramas) **sube por la escala** como una escalerita.

Los de aquí los genera `node herramientas/sonidos-editor.mjs`, **con estilo de
interfaz profesional** (como los de un sistema operativo o una app de trabajo):
las interacciones son toques táctiles cortitos de un material suave (polímero,
madera mate o metal suave), lo que se abre o se desliza es aire limpio, y sólo
los avisos llevan tono, de piano eléctrico suave y en re mayor. Cortos,
bajitos y cada uno con su propia figura (no hay dos iguales). Si cambias uno a mano, no vuelvas a correr esa herramienta o lo
sobrescribe (puedes pasarle sólo los nombres que quieras rehacer:
`node herramientas/sonidos-editor.mjs tocar-boton`).

Después de añadir o cambiar archivos, el catálogo se rehace solo al subir
(o con `node herramientas/contenido.mjs`). Con el servidor de casa suenan al
momento.

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

### El menú principal, la pareja y Detallitos

| Archivo | Cuándo suena |
| --- | --- |
| `brillo` | entrar a tu cuenta, guardar tu perfil |
| `girar-tarjeta` | la tarjeta que gira (tu cuenta, vincular) |
| `abrir-sobre` | un detallito que sale de su sobre |
| `latido` | el corazón del hilo rojo al vincularse |
| `vincular-pareja` | se vincularon (campanitas) |
| `desvincular` | se desvincularon |
| `tecla-codigo` | cada letra del código de tu amorcito |
| `coleccion-abrir` | abrir Detallitos: la colección de los dos |
| `detallito-abrir` | abrir una página de la colección |
| `reaccion-te-amo` | reaccionar «Te amo» a una página de tu amorcito |
| `reaccion-me-encanto` | reaccionar «Me encantó» |
| `reaccion-llore` | reaccionar «Me hiciste llorar» |
| `reaccion-abrazo` | reaccionar «Un abrazo» |
| `reaccion-beso` | reaccionar «Un beso» |
| `reaccion-risa` | reaccionar «Me hiciste reír» |
| `reaccion-quitar` | quitar tu reacción |
| `gatito-ronroneo` | tocar al gatito dormido del menú |

### La abejita y el huevito de pascua (también de fábrica)

| Archivo | Cuándo suena |
| --- | --- |
| `abejita-habla` | la abejita habla |
| `abejita-hola` / `abejita-adios` | la abejita llega o se va |
| `abejita-feliz` / `abejita-susto` | la abejita se alegra o se asusta |
| `abejita-zumbido` | la abejita revolotea |
| `secreto-interferencia` / `secreto-campanita` | el huevito de pascua escondido |

Si quieres que un momento use otro archivo, la lista está en
`EditorDev/audio/sonidos-editor.js` (`ARCHIVO`).
