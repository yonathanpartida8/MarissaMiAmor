# Tus páginas

Esta carpeta es tuya. Todo lo que pongas aquí se añade al libro sin tocar
el motor.

```
mis-paginas/
  paginas.js     ← la lista de tus páginas (es lo único que editas)
  fotos/         ← tus imágenes
  videos/        ← tus vídeos
```

---

## Lo más fácil: sólo dejar el archivo

Cualquier vídeo que dejes en `mis-paginas/videos/` y cualquier foto que dejes
en `mis-paginas/fotos/` sale **sola** como una página, sin escribir nada.
Si además la pones en `paginas.js` (con título, texto…), sale sólo esa.

La lista de lo que hay en las carpetas (`src/data/contenido.js`) la rehace
GitHub solo a cada subida. Si trabajas en el ordenador: `node herramientas/contenido.mjs`.

## En tres pasos

1. **Sube el archivo** a `mis-paginas/fotos/` o `mis-paginas/videos/`.
2. **Añade una entrada** en `paginas.js`.
3. **Sube los cambios.** Ya está.

La página aparece sola en el libro, en el índice y en el contador de progreso.
No hay que compilar, instalar ni ejecutar nada.

---

## El ejemplo más corto que funciona

```js
export default [
  {
    titulo: "Nuestra tarde",
    texto: "Lo que quieras contar.",
    foto: "mis-paginas/fotos/tarde.jpg",
  },
];
```

Con eso ya tienes una página. Sólo `titulo` es obligatorio.

---

## Tipos de página

| `tipo` | Qué hace |
| --- | --- |
| `"foto"` | Una imagen a pantalla completa con el texto encima. Se mueve con la inclinación del móvil y se acerca con dos dedos. |
| `"galeria"` | Varias imágenes que se pasan deslizando, con inercia. |
| `"video"` | Un vídeo con su carátula. Se toca para reproducir. |
| `"carta"` | Sólo texto, sobre papel. |

Si no pones `tipo`, se deduce: con `video` es un vídeo, con varias `foto` es
una galería, con una es una foto, y sin nada es una carta.

### Los tipos del propio libro

Si te quedas con ganas, también valen éstos. Necesitan lo que dice la columna
de la derecha:

| `tipo` | Necesita |
| --- | --- |
| `"polaroids"` | varias `foto`; `frases` para el reverso |
| `"mosaico"` | una `foto` |
| `"rascar"` | una `foto` |
| `"postal"` | una `foto`; `secreto` para el reverso |
| `"velo"` | una o dos `foto` |
| `"profundidad"` | una `foto` |
| `"carrete"` | varias `foto` |
| `"constelacion"` | varias `foto`; `frases` |
| `"campo"` | muchas `foto` |
| `"secreto"` | una `foto`; `secreto` |
| `"escrito"` | sólo texto (se escribe a mano) |
| `"maquina"` | sólo texto (se teclea solo) |
| `"petalos"` | `frases` |
| `"sobre"` | sólo texto (llega en un sobre) |
| `"botella"` | sólo texto (llega en una botella) |
| `"regalo"` | sólo texto; `secreto` |
| `"candado"` | sólo texto; una `foto` dentro de la caja (opcional) |
| `"pulso"` | sólo texto |
| `"distancia"` | sólo texto |

Si pides un tipo que necesita foto y no se la das, la página se muestra como
carta y te lo dice en la consola. Nada se rompe.

---

## Dónde acaba cada página

Por defecto (`donde: "final"`) tus páginas van **justo antes de la última**,
agrupadas en un acto nuevo que se llama **«Tuyas»**.

- `donde: "inicio"` la pone después de la portada.
- `donde: 12` la pone en la posición 12.

Cuando la metes en medio del libro, la página adopta el acto de sus vecinas,
para que el índice se siga leyendo en orden.

---

## Todos los campos

| Campo | Para qué |
| --- | --- |
| `titulo` | El título grande. **Es el único obligatorio.** |
| `arriba` | La línea pequeña encima del título. |
| `texto` | El cuerpo. |
| `foto` | Una ruta, o una lista de rutas. |
| `video` | Una ruta a un `.mp4` o `.webm`. |
| `poster` | Imagen fija que se ve antes de darle al play. |
| `frases` | Lista de frases sueltas que se descubren tocando. |
| `secreto` | Lo que aparece **después** de resolver la página. |
| `color` | Color de acento, ej. `"#ec6f92"`. Tiñe también el fondo. |
| `humor` | Carácter del fondo: `dawn` `night` `amber` `bloom` `storm` `glass` `winter` `cosmos` `light`. |
| `donde` | `"final"` (por defecto), `"inicio"`, o el número de página donde insertarla. |
| `transicion` | Cómo se llega: `flip` `dissolve` `zoom` `fold` `iris` `slide` `ink` `tide` `bloom`. Si no lo pones, se elige una que pegue con el tipo de página. |
| `pista` | El susurro que sale si se queda quieta sin saber qué hacer. |

---

## Vídeos: léete esto

Los vídeos pesan mucho y esto se abre desde el móvil, muchas veces con datos.

- **Menos de 15 MB** por vídeo, idealmente menos de 8.
- **`.mp4` (H.264)** es lo que reproduce todo. `.webm` no funciona en iPhones
  antiguos.
- **Vertical** (9:16) si es para verlo en el móvil.
- Pon siempre un `poster`: es lo que se ve mientras carga.
- GitHub avisa a partir de 50 MB por archivo y rechaza a partir de 100 MB.

El vídeo **no se descarga hasta que ella llega a esa página**, y se descarga
sólo al darle al play. Al pasar de página se libera de memoria.

---

## Si algo no aparece

El libro nunca se rompe por un error tuyo: si una página está mal escrita, se
salta y sigue. Para ver qué pasó, abre el libro y mira la consola del
navegador (F12 → «Consola»): sale un aviso claro diciendo cuál falló y por qué.

Fallos habituales:

- **La ruta.** Tiene que empezar por `mis-paginas/`, no por `/` ni por `./`.
- **Mayúsculas.** `Foto.JPG` y `foto.jpg` son archivos distintos.
- **Falta una coma** entre dos páginas, o sobra al final.
- **Comillas.** Si tu texto lleva comillas dobles, usa comillas simples fuera:
  `texto: 'Me dijiste "hola" y ya'`.

---

## Un consejo

No hace falta que uses todos los tipos. Una foto tuya con dos líneas honestas
funciona mejor que la página más complicada del libro.
