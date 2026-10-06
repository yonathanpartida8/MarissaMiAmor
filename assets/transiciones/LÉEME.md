# assets/transiciones/ — transiciones nuevas entre páginas

Cada carpeta es una transición (aparece sola en **Transiciones**, con su vista previa).

```
transiciones/mi-transicion/
├── transicion.json   ← o transicion.css, o transicion.js
└── miniatura.png     ← opcional
```

- **transicion.json**: `nombre`, `duracion`, `ritmo`, `encima` (`entra` o `sale`: cuál va
  delante) y los fotogramas de la página que **entra** y de la que **sale**. Mira `deslizar/`.
- **transicion.css**: dos `@keyframes`, uno llamado `entra` y otro `sale`. Mira `zoom/`.
- **transicion.js**: código que devuelve `{ entra: [...], sale: [...] }`.

Al usarla se guarda dentro del librito (el .zip no necesita esta carpeta).
