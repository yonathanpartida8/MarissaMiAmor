# deslizar/ — los botones para pasar página

Cada carpeta es un estilo con **dos archivos**: `izquierda.*` y `derecha.*`
(`.svg`, `.png`, `.webp` o `.gif`). El librito los usa como flechas para pasar
de página, y en el editor (Herramientas → «Botones para pasar página») se
elige el estilo o se ponen sobre una página como botones que se pueden mover.

```
deslizar/
  corazon/   izquierda.svg  derecha.svg
  mi-estilo/ izquierda.png  derecha.png   ← deja el tuyo y aparece solo
```

Un SVG puede traer su propia animación (`<style>` con `@keyframes`) dentro.
Tamaño recomendado: cuadrado, 64×64 o más.
