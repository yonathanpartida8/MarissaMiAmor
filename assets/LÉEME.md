# assets/ — la biblioteca del editor (📖 Crear librito)

Todo lo que dejes aquí aparece solo en el editor, en **🧩 Componentes**
(o en **Elementos** si es una imagen, y en **🎵 Audio** si es un sonido).
No hay que tocar el código del editor.

```
assets/
├── buttons/       botones
├── players/       reproductores
├── portraits/     retratos
├── frames/        marcos
├── effects/       efectos
├── animations/    animaciones
├── decorations/   adornos (svg/png)
├── ui/            flechas, menús…
└── la-que-quieras/   (cualquier carpeta nueva es una categoría nueva)
```

## Un componente HTML

Una carpeta con su `index.html` y todo lo que necesite al lado:

```
assets/buttons/mi-boton/
├── index.html      ← obligatorio
├── style.css  script.js  image.png  sound.mp3  fonts/ …
├── asset.json      ← opcional (nombre, tamaño, parámetros)
└── preview.png     ← opcional (miniatura en la biblioteca)
```

- **No se modifica nunca.** El editor lo muestra en su propio marco, con sus
  rutas, estilos, scripts, sonidos y eventos tal cual. Cada vez que lo usas
  en una página se guarda sólo *dónde* está y *cómo* (posición, tamaño,
  capa, animación, sonidos…), nunca dentro del componente.
- Fondo transparente: si `html` y `body` no tienen fondo, se ve lo de atrás.
- El editor detecta solo su **zona táctil** (botones, enlaces, lo que tiene
  `cursor: pointer`…) para que seleccionarlo en la hoja no tape lo demás,
  y su **fondo decorativo**. Quitar el fondo es SIEMPRE manual
  («Eliminar fondo» en el editor) y sólo afecta a esa copia en la página.

### asset.json

```json
{
  "nombre": "Botón corazón",
  "descripcion": "Lo que hace",
  "ancho": 280, "alto": 150,
  "decorativo": false,
  "aislado": false,
  "parametros": [
    { "id": "texto", "tipo": "texto", "etiqueta": "Texto", "def": "Ábreme" },
    { "id": "color", "tipo": "color", "etiqueta": "Color" },
    { "id": "foto", "tipo": "imagen", "etiqueta": "Foto" },
    { "id": "cancion", "tipo": "audio", "etiqueta": "Canción" },
    { "id": "cantidad", "tipo": "numero", "min": 1, "max": 50 },
    { "id": "accion", "tipo": "opciones", "opciones": [["siguiente", "Página siguiente"]] }
  ]
}
```

- `ancho`/`alto`: su tamaño natural (si no, 360×360).
- `decorativo: true`: no recibe toques (pasan a lo de abajo), como una lluvia de corazones.
- `aislado: true`: se ejecuta en un marco sin acceso a nada del librito.
- `parametros`: lo que el editor deja cambiar en cada copia. Llegan en la
  dirección (`index.html?p={...json...}`). Con el ayudante es una línea:

```html
<script src="../../_librito/componente.js"></script>
<script>
  const p = LibritoComponente.params();        // { texto: "…", foto: "…" }
  LibritoComponente.enviar("siguiente");        // pasar de página
  // también: "anterior", "inicio", "musica", { ir: "idPagina" }, { sonido: "url" }
</script>
```

## Imágenes y sonidos sueltos

`.png .jpg .webp .gif .svg` → adornos en la biblioteca.
`.mp3 .m4a .ogg .wav` → sonidos (para botones, animaciones, transiciones).

## Carpetas especiales

Cada una tiene su `LÉEME.md` con ejemplos. Lo que dejes aparece solo.

| Carpeta | Qué va | Dónde sale en el editor |
| --- | --- | --- |
| `animaciones/<nombre>/` | `animacion.css` (`@keyframes`), `.json` o `.js` | Animar → «De la carpeta» |
| `transiciones/` | `.json` o `.css` (`@keyframes` entra/sale) | Transiciones → «De la carpeta» |
| `efectos/` | `.json` con filtros (brillo, contraste…) | Efectos, al final |
| `fondos/<nombre>/index.html` | un fondo animado (y `miniatura.png` opcional) | Diseño → «Fondo animado» |
| `sonidos-editor/<momento>/` | `.wav/.mp3` cortitos (`botones`, `seleccionar`, `abrir`, `guardar`…) | sonidos al editar |
| `stickers/` | `.png/.webp/.gif` sin fondo | Stickers → «Tus stickers» |
| `iconos/` | `<nombre>.svg` que reemplaza un icono del editor | toda la interfaz |

## Que aparezca

En GitHub se rehace solo a cada subida (`assets/catalogo.js`). En la
computadora: `node herramientas/contenido.mjs`.
