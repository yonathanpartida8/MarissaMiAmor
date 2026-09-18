# Páginas HTML

Aquí dentro puedes poner **archivos HTML sueltos** y cada uno se convierte en
una página más del librito. No hay que tocar el código para nada: dejas el
archivo, recargas, y ahí está.

---

## Cómo se llaman los archivos

Tienen que llamarse **exactamente así**, cambiando sólo el número:

```
paginas-html/
    página.html1.html
    página.html2.html
    página.html3.html
    página.html4.html
    …
```

Salen en el librito **en orden numérico**: la 1, la 2, la 3…

Tres cosas que conviene saber:

- **Empieza por el 1.** Si no existe `página.html1.html`, el librito da por
  hecho que la carpeta está vacía y no busca más.
- **Puedes saltarte un número.** Si tienes la 1, la 2 y la 4, salen las tres.
  Lo que corta la búsqueda son dos huecos seguidos.
- **La tilde da igual.** Vale `página.html1.html` y vale `pagina.html1.html`.
  Eso sí: usa siempre la misma forma en todos los archivos de la carpeta.

---

## Qué puedes poner dentro

Lo que quieras. Un archivo HTML normal y corriente:

- botones y cosas que se pulsan
- animaciones y efectos
- CSS, todo el que quieras
- JavaScript, todo el que quieras
- imágenes, vídeo y audio
- un juego pequeño, una carta que se abre, una cuenta atrás…

Tu página se muestra **dentro de su propia hoja**, aislada del resto del
librito. Eso quiere decir dos cosas buenas:

1. **Nada de lo que escribas puede romper el librito.** Puedes usar la clase
   que quieras y cambiar el `body` entero sin miedo.
2. **Nada del librito se te cuela dentro.** Empiezas con una hoja en blanco de
   verdad; lo que se vea lo pones tú.

---

## Cómo se pasa de página

Igual que en el resto del librito: **deslizando de lado**, con las flechas
`‹ ›` de los bordes, o con la barra de abajo.

El deslizamiento funciona por encima de tu página, pero **no te quita tus
gestos**: si el dedo empieza encima de un botón, un enlace, un campo de texto,
un `<canvas>`, un vídeo o un audio, el gesto es tuyo entero.

Si tienes cualquier otra cosa que necesite arrastrarse —una tarjeta que se
mueve, un control deslizante hecho a mano— márcala así y el librito no te
quitará el dedo:

```html
<div data-claim-drag> … lo que se arrastra … </div>
```

---

## Cómo se llama tu página

Ponle un `<title>` y ése será su nombre en la barra de abajo y en el índice:

```html
<title>Nuestro juego</title>
```

Si no le pones ninguno, se llamará «Página 1», «Página 2»…

---

## Los colores del librito, si los quieres

Tu página puede usar los colores del capítulo sin que tengas que copiar ni un
hexadecimal. Están disponibles como variables de CSS:

| variable | qué es |
|---|---|
| `--acento` | la luz del capítulo (rosa claro) |
| `--acento-hondo` | su color hondo, el que se lee bien sobre papel |
| `--fondo` | el casi negro del capítulo |
| `--papel` | el crema de las hojas |
| `--texto` | la tinta, para leer sobre el papel |
| `--texto-claro` | el marfil, para leer sobre fondo oscuro |
| `--tipo` | la tipografía de la interfaz |
| `--tipo-titulo` | la de los títulos |
| `--tipo-mano` | la de la letra a mano |
| `--seguro-arriba`, `--seguro-abajo`, `--seguro-lado` | los márgenes seguros del móvil (la muesca, la barra de gestos) |
| `--hueco-barra` | lo que ocupa la barra flotante del librito, por si tienes algo pegado abajo |

Por ejemplo:

```css
button {
  background: var(--acento);
  color: var(--fondo);
  font-family: var(--tipo);
}
```

Si no las usas no pasa nada: tu página se ve como la hayas hecho.

---

## Cosas que ya están resueltas (no tienes que hacerlas tú)

- **El tamaño.** Tu página ocupa exactamente la hoja del librito, ni un píxel
  más. No hace falta que pongas `<meta viewport>`: si no lo pones, se pone
  solo.
- **Que no se salga nada.** Las imágenes, los vídeos y las tablas se quedan
  dentro del ancho de la hoja.
- **Las barras de desplazamiento.** Tu página puede ser más larga que la hoja
  y se desplaza hacia abajo, pero sin barra a la vista.
- **Apagarlo todo al salir.** Cuando se pasa de página, tu HTML se descarga
  entero: se paran tus animaciones, tus `requestAnimationFrame`, tus
  intervalos, tu audio y tu WebGL. No tienes que liberar nada a mano. Al
  volver, tu página arranca de cero y limpia.

---

## Si tu página es de noche

El librito echa una viñeta por encima de todo, y la aprieta más o menos
según lo que haya debajo. Sobre papel la pone a la mitad; sobre una escena
oscura la deja entera, que es lo que le da el borde de cine.

Lo averigua solo. Pero si tu página es oscura y quieres asegurarte, díselo
con la etiqueta de siempre:

```html
<meta name="color-scheme" content="dark">
```

## Los ejemplos

En esta misma carpeta hay cinco, y son distintos a propósito. El primero es
el bueno para empezar; los otros cuatro son para ver hasta dónde se puede
llegar con un solo archivo y sin descargar nada de fuera.

| archivo | qué es |
|---|---|
| `página.html1.html` | **El sencillo.** Un botón y una animación. Cópialo, renómbralo al número siguiente y cámbialo. |
| `página.html2.html` | **El rincón de arena.** Una playa en perspectiva que se excava con una palita. Once cosas enterradas, cartas que se abren y una llave con su código. |
| `página.html3.html` | **El hilo rojo.** Dos esferas unidas por un listón, escribiéndose cartas. Se arrastran, se resisten a juntarse, y al conseguirlo el listón hace un corazón. |
| `página.html4.html` | **Un jardín para ti.** Se toca la tierra y crece una flor. Cada una guarda una frase. Si plantas bastantes, cae la noche. |
| `página.html5.html` | **La ventana.** Llueve y el cristal está empañado. Se limpia con el dedo y detrás hay algo escrito. |

Los cuatro grandes tienen **secretos escondidos** que no se anuncian: cosas
que pasan si insistes, si dibujas algo, si esperas sin prisa o si tocas dos
veces. Están para que los encuentre ella, no para explicarlos aquí.

Y todos llevan, arriba del todo de su `<script>`, una sección marcada
`CONFIGURACIÓN EDITABLE` con las frases, los colores, los números y dónde
está escondida cada cosa. Para cambiar lo que dicen no hace falta entender
nada de lo demás: se cambia ahí y ya.

---

## Dónde salen en el librito

El orden del librito es siempre éste:

```
1. las páginas de siempre  (y el final)
2. TUS PÁGINAS HTML        ← esta carpeta
3. las fotos de images/amores/
```

Las fotos son siempre lo último. Una página HTML nueva nunca se cuela entre
ellas, por muchas que añadas.
