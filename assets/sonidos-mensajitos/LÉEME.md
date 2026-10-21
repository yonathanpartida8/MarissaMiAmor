# Los sonidos de Mensajitos

Todos los sonidos del chat viven aquí, aparte de los del editor
(`assets/sonidos-editor/`). Cada uno trae tres versiones (`-2`, `-3`) que se
turnan para que nunca suene igual dos veces seguidas.

| Archivo | Cuándo suena |
| --- | --- |
| `mensaje-enviar` | mandas un mensajito (texto, GIF, sticker o audio) |
| `mensaje-llega` | te llega uno |
| `mensaje-menu` | mantienes presionado un mensajito (su menú) |
| `mensaje-editar` | guardas un mensajito editado |
| `mensaje-borrar` | borras un mensajito |
| `sticker-pegar` | pegas un sticker encima del chat |
| `sticker-crear` | haces un sticker con tu foto |
| `favorito` | marcas un sticker o un GIF como favorito |
| `audio-grabar` · `audio-listo` | empiezas y terminas de grabar un audio |
| `audio-play` | le das play o pausa a un audio |
| `teclado-letra` · `teclado-espacio` · `teclado-borrar` | escribes (se apagan en ⋮ → «Sonidos del teclado») |

**Para cambiar uno**, deja aquí tu archivo con el mismo nombre (`.mp3`, `.m4a`,
`.ogg` o `.wav`; por ejemplo `mensaje-llega.mp3`): el tuyo manda y los de
fábrica dejan de sonar. Las reacciones (te amo, me encantó…) siguen en
`assets/sonidos-editor/`, porque también suenan en Detallitos.

Los de fábrica se hacen con `node herramientas/sonidos-editor.mjs`.
