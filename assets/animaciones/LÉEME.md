# assets/animaciones/ — animaciones nuevas para «Animar»

Cada carpeta es una animación. Aparece sola en el editor (**Animar → De la carpeta**)
en cuanto se sube (o al correr `node herramientas/contenido.mjs`).

```
animaciones/mi-animacion/
├── animacion.json   ← o animacion.css, o animacion.js (una de las tres)
└── miniatura.png    ← opcional (si no, el editor la dibuja sola)
```

- **animacion.json**: `nombre`, `fase` (`entrada`, `bucle` o `salida`), `duracion` (ms),
  `ritmo` (como en CSS) y `fotogramas` (los de CSS, en una lista). Mira `flotando/`.
- **animacion.css**: un `@keyframes` normal. Arriba, en un comentario, la fase, la
  duración y el ritmo: `/* fase: entrada · duracion: 900 · ritmo: ease-out */`. Mira `rebote/`.
- **animacion.js**: código que **devuelve** los fotogramas (`return [...]`). Corre una
  sola vez y aislado (no puede tocar nada del editor). Mira `latido-con-codigo/`.

Cuando la usas, la animación se guarda DENTRO del librito: el .zip no necesita esta carpeta.
