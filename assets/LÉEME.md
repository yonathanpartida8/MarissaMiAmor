# assets/ — la biblioteca del editor (📖 Crear librito)

Todo lo que dejes aquí aparece solo en el editor, en **🧩 Componentes**
(o en **Elementos** si es una imagen, y en **🎵 Audio** si es un sonido).
No hay que tocar el código del editor.

## ¿Dónde pongo cada HTML?

Deja el archivo en la carpeta de su tipo y aparece solo en **Recursos**,
**primero** en su lista y con la etiqueta **Nuevo** durante unos días.

| Carpeta | Para qué | Sale en Recursos como |
| --- | --- | --- |
| `elementos/` | cosas animadas o tocables (contadores, letreros, vinilos…) | Elementos |
| `botones/` (o `buttons/`) | botones bonitos | Botones |
| `reproductores/` (o `players/`) | reproductores de música | Reproductores |
| `retratos/` (o `portraits/`) | marcos de foto con estilo | Retratos |
| `marcos/` (o `frames/`) | marcos y bordes | Marcos |
| `tarjetas/` | tarjetas, cartas, notas | Tarjetas |
| `dibujos/` | dibujos que se animan | Dibujos |
| `efectos-animados/` | lluvias, brillitos, confeti (decorativos) | Efectos |
| `efectos/` (o `effects/`) | efectos con HTML (los `.json` de aquí son filtros) | Efectos |
| `hojas/` | hojas y fondos de página | Hojas |
| `decoraciones/` | adornos en imagen (svg/png/webp) | Decoraciones |
| `audio/` · `«musica assets»/` | sonidos y música | Audio |
| `otros/` o cualquier carpeta nueva | lo demás | Otros (o su propia categoría) |

Da igual si la carpeta tiene mayúsculas, espacios o tildes: «Efectos Animados»
y «efectos-animados» son la misma.

**Tres formas de dejar un HTML** (todas funcionan, sin separar CSS ni JS):

1. **Un solo archivo**: `assets/botones/boton-rosa.html` (con su `<style>` y `<script>` dentro).
2. **Una carpeta con su HTML y sus cosas**: `assets/marcos/mi-marco/` con `mi-marco.html`
   (o `index.html`) y al lado sus imágenes, css o js.
3. **Una subcarpeta para ordenar varios**: `assets/tarjetas/amor/carta-1.html`,
   `assets/tarjetas/amor/carta-2.html`… cada uno es una pieza.

**El nombre** sale del `<title>` del HTML; si no tiene, o dice algo genérico
(«Document», «Untitled», «index»…), sale del archivo: `boton-rosa.html` → «Boton rosa».

Al subirlos a GitHub, la acción «Lista de contenido» rehace `assets/catalogo.js`
sola en un minuto. Con el servidor local, aparecen al recargar el editor.

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

## Piezas de un solo archivo

Un `.html` suelto en cualquier carpeta (`efectos-animados/soleado.html`,
`botones/`, `marcos/`, `tarjetas/`, `dibujos/`…) es una pieza: su HTML, su CSS
y su JS van juntos en el mismo archivo. Sale en el editor (Piezas) con el
nombre de su `<title>`. Opcional, dentro de `<head>`:

```html
<title>Soleado</title>
<meta name="tamaño" content="320x320">        <!-- su tamaño al ponerlo -->
<meta name="descripcion" content="Un solecito que brilla">
<meta name="decorativo" content="si">          <!-- deja pasar los toques -->
```

Fondo transparente (`html,body{background:transparent}`) para que se vea lo
de detrás. Para ampliar, sólo hay que añadir archivos: nada más que tocar.

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
| `deslizar/<estilo>/` | `izquierda.svg` y `derecha.svg` (o .png/.webp/.gif) | las flechas para pasar página |
| `sonidos-editor/abeja/` | la voz de la abejita (si no hay, hace un «bzz-pip» sola) | el foquito de ayuda |

## Que aparezca

En GitHub se rehace solo a cada subida (`assets/catalogo.js`). En la
computadora: `node herramientas/contenido.mjs`.
