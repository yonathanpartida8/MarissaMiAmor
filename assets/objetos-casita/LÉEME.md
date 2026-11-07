# Tus objetos para Nuestra casita

Aquí puedes poner tus propias imágenes y salen como objetos de verdad en «Acomodar» (en su categoría), del tamaño de
un mueble, con su sombra, que se pueden mover, girar, abrir y prender.

## Dónde van

Una carpeta por categoría: `sala/`, `cocina/`, `recamara/`, `bano/`, `estudio/`, `terraza/`, `jardin/`, `cositas/`, `adornos/`, `plantas/`, `pared/`, `limpieza/`. Lo de `pared/` se cuelga en
la pared; lo de `cositas/`, `adornos/` y `limpieza/` se puede cargar con la mano y poner encima de los muebles.

## Cómo nombrar las imágenes

Cada objeto en su carpetita (recomendado) o suelto en la carpeta de su categoría:

| En su carpetita | Suelto | Qué es |
| --- | --- | --- |
| `sala/sillon-rosa/frente.png` | `sala/sillon-rosa.png` | De frente (la única que hace falta) |
| `…/derecha.png` | `sillon-rosa-derecha.png` | Visto de su lado derecho (al girarlo) |
| `…/izquierda.png` | `sillon-rosa-izquierda.png` | De su lado izquierdo (si falta, se usa el derecho al revés) |
| `…/atras.png` | `sillon-rosa-atras.png` | De espaldas |
| `…/abierto.png` | `sillon-rosa-abierto.png` | Abierto (al tocarlo se abre y se cierra) |
| `…/funcionando1.png`, `funcionando2.png`… | `sillon-rosa-funcionando1.png`… | Animación: al tocarlo se repite en bucle hasta que lo vuelvas a tocar |

- También: `abierto-derecha.png`, `funcionando2-izquierda.png` (el estado visto de lado).
- Sirven `.png` (mejor, con fondo transparente), `.jpg` (se le quita solo el fondo liso de las orillas) y `.webp`.
- **Tamaño**: el pixel art chiquito (hasta 96 pixeles) se agranda ×4, como todo el juego; una imagen grande se ajusta
  al alto de un mueble de su categoría. Para escoger el alto: `@150` en el nombre (`sillon-rosa@150`) o una notita
  `info.txt` en su carpetita con `alto: 150` (también `nombre: Sillón de mamá` y `velocidad: 8`, los cuadros por
  segundo de la animación).
- Con abierto **y** funcionando, cada toque va: cerrado → abierto → funcionando → cerrado.

La lista (`indice.json`) se rehace sola en GitHub al subir (acción «Objetos de la casita»); en la compu:
`node herramientas/objetos-casita.mjs`. Con el servidor de casa, lo recién dejado aparece sin esperar.

## Ahora

| Clave | Nombre | Lados | Estados | Tamaño en el juego |
| --- | --- | --- | --- | --- |
| — | (todavía no hay objetos tuyos) | | | |
