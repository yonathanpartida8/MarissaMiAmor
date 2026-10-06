# assets/efectos/ — filtros listos para «Efectos»

Un `.json` por efecto (o una carpeta con `efecto.json` y `miniatura.png`):

```json
{ "nombre": "Cálido", "efectos": { "temperatura": 50, "saturacion": 112, "brillo": 103 } }
```

Lo que se puede poner en `efectos`: `brillo`, `contraste`, `saturacion` (100 = normal),
`exposicion` (−2…2), `luz` (−100…100), `temperatura` (−100 frío … 100 cálido),
`desenfoque` (px), `byn`, `sepia`, `invertir` (%), `tono` (grados),
`sombra` `{x, y, blur, color}` y `resplandor` `{color, tam}`.

Una carpeta con `index.html` (como las de `assets/effects/`) es un efecto ANIMADO:
se pone como pieza encima de la página.
