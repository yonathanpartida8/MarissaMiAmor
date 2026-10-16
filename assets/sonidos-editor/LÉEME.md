# assets/sonidos-editor/ — los sonidos del propio editor

Una carpeta por **categoría** y, dentro, una por **acción**. En cada una, todos los
sonidos que quieras (`.wav`, `.mp3`, `.ogg`): el editor elige uno al azar cada vez
(sin repetir el último), con un fundido cortito, así no se siente robótico.

```
interaccion/     pulsar (botones) · seleccionar · deseleccionar · confirmar (al exportar) · herramienta (el riel)
movimiento/      arrastrar (al empezar a mover) · desplazar (mover la vista) · soltar
transformacion/  rotar · zoom (acercar/alejar la vista o la foto) · redimensionar
organizacion/    agrupar · desagrupar · duplicar · eliminar · ordenar-capas
interfaz/        abrir · cerrar · minimizar (bajar un panel a su parada chica) · restaurar · guardar · error
edicion/         dibujar (lápiz) · borrar (goma) · colorear · aplicar-efectos · deshacer · colocar · ajustar (deslizadores)
paginas/         crear · duplicar · cambiar
multimedia/      reproducir · pausar (escuchar una canción de la biblioteca)
animaciones/     aplicar · fotograma (línea de tiempo)
```

- **Cambiar un sonido:** reemplaza los archivos de su carpeta. **Añadir variedad:** pon más
  archivos en la misma carpeta. No hay que tocar código: aparecen solos (el catálogo se
  regenera con `node herramientas/contenido.mjs`).
- **Que una acción use otra carpeta:** una sola línea en `CARPETA`
  (`EditorDev/audio/sonidos-editor.js`). Una carpeta suelta con el nombre del momento
  (como `botones/`, la forma de antes) también sigue funcionando.
- Los que vienen son suaves y cortitos, hechos con síntesis por
  `node herramientas/sonidos-editor.mjs` (que sólo reescribe los suyos: `<acción>-N.wav`).

Cómo suenan juntos: una vez por acción (nunca por cuadro), los de poca importancia
ceden ante uno más importante, nunca más de unos pocos a la vez y por un limitador
suave para que no saturen. Mientras suenan, la música del editor baja un poquito y
vuelve sola; los volúmenes que elegiste no cambian. Se apagan, se suben o se bajan en
**Herramientas → Sonidos del editor**.
