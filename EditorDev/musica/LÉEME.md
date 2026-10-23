# Canciones de siempre (y música para el editor)

Pon aquí tus canciones **.mp3** o **.wav**. Salen solas en el editor, en **Músicas → Canciones de
siempre**, listas para usarlas en cualquier librito (en una página o en todo el librito).

## Desde GitHub (sin compu)

1. Abre tu repositorio en GitHub y entra a la carpeta `EditorDev/musica/`.
2. **Add file → Upload files** y arrastra tus canciones.
3. **Commit changes**.

Listo: la acción de GitHub «Lista de contenido» las agrega al catálogo en un minutito. Y mientras
tanto, el editor publicado (…github.io/…) le pregunta directo a GitHub qué canciones hay, así que
aparecen aunque la acción todavía no termine.

## Desde tu compu

Pégalas en esta carpeta (puedes hacer subcarpetas) y `node herramientas/contenido.mjs` las agrega al
catálogo; mientras pruebas en tu compu, el editor también mira la carpeta directo.

## Para qué sirven

- **Música de la página**: la que suena en la página que estás creando (y en el librito).
- **Música del editor**: la que suena mientras editas (sólo para ti; nunca va en la página).

El nombre que se ve es el del archivo: `mi-cancion_favorita.mp3` se ve como «Mi cancion favorita».
