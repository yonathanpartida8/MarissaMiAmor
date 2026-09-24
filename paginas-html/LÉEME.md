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

Igual que en el resto del librito: **deslizando desde el borde**, con las
flechas `‹ ›`, o con la barra de abajo.

**Desde el borde**, y eso es lo importante para ti: el librito sólo se queda
el deslizamiento que **empieza** en los primeros ~30 píxeles de la izquierda o
de la derecha de la hoja. Todo lo demás es tuyo.

O sea: **puedes arrastrar por toda tu página sin miedo.** Cavar, dibujar,
mover una ficha, tirar de algo de un lado a otro. La hoja no se va a pasar
sola en mitad de lo que estés haciendo, y no tienes que declarar nada ni
dejar franjas libres en los lados.

Si además quieres el borde —porque justo ahí tienes algo que se arrastra—,
márcalo y el librito ni se acerca:

```html
<div data-claim-drag> … lo que se arrastra … </div>
```

Los botones, los enlaces y los campos de texto ya están protegidos aunque
estén pegadísimos al margen; no hace falta marcarlos.

> Si marcas con `data-claim-drag` algo que ocupa la hoja **entera**, de borde
> a borde, dejarás a tu página sin deslizamiento. Se seguirá saliendo con las
> flechas y con la barra, pero piénsalo antes.

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

## Las que ya hay

Hay **treinta**, y son distintas a propósito. La primera es la buena para
empezar; las demás son para ver hasta dónde se puede llegar con un solo
archivo y sin descargar nada de fuera.

| archivo | qué es |
|---|---|
| `página.html1.html` | **El sencillo.** Un botón y una animación. Cópialo, renómbralo al número siguiente y cámbialo. |
| `página.html2.html` | **El rincón de arena.** Una playa en perspectiva que se excava con una palita. Once cosas enterradas, cartas que se abren y una llave con su código. |
| `página.html3.html` | **El hilo rojo.** Dos bolitas unidas por un listón, escribiéndose cartas. Se arrastran, se resisten a juntarse, y al conseguirlo el listón hace un corazón. |
| `página.html4.html` | **Un jardín para ti.** Se toca la tierra y crece una flor. Cada una guarda una frase. Si plantas bastantes, cae la noche. |
| `página.html5.html` | **La ventana.** Llueve y el cristal está empañado. Se limpia con el dedo y detrás hay algo escrito. |
| `página.html6.html` | **Las constelaciones.** Se unen estrellas arrastrando y aparece una figura con lo que significa. |
| `página.html7.html` | **La caja de música.** Se levanta la tapa, gira la bailarina y suena una melodía. Siete teclas, cada una con su frase. |
| `página.html8.html` | **Mil grullas.** Cada toque dobla una y se va volando. Mil y se concede un deseo. |
| `página.html9.html` | **Las luciérnagas.** Se acercan al dedo quieto y huyen del que corre. Va de tener paciencia. |
| `página.html10.html` | **El lago de los deseos.** Se tiran piedras, las ondas se suman y el cielo reflejado se retuerce al pasar. |
| `página.html11.html` | **Las polaroids.** Seis fotos sin revelar que se frotan con el dedo. Cada una es un recuerdo. |
| `página.html12.html` | **El tren de noche.** Se escribe en el vaho de la ventanilla mientras pasa el paisaje y las estaciones. |
| `página.html13.html` | **Los globos.** Cada uno se lleva un deseo escrito. |
| `página.html14.html` | **La bola de nieve.** Se agita de verdad, arrastrando de un lado a otro, y dentro hay una casita con la luz puesta. |
| `página.html15.html` | **El ramo.** Se cogen flores del prado y se van juntando, con su papel y su lazo. |
| `página.html16.html` | **La radio.** Se enciende, se busca en el dial, y cada emisora dice lo suyo con su sintonía. |
| `página.html17.html` | **El mapa de nosotros.** Siete alfileres, siete sitios, y una línea que los une en orden. |
| `página.html18.html` | **La máquina de escribir.** Escribes y te contesta. Hay palabras que sabe. |
| `página.html19.html` | **El árbol de las estaciones.** Se arrastra de lado y pasa el año entero encima del mismo árbol. |
| `página.html20.html` | **La cometa.** Se corre con el carrete y el viento hace el resto. |
| `página.html21.html` | **El reloj de nosotros.** Se giran las agujas y el día entero pasa por delante. Cada hora tiene la suya. |
| `página.html22.html` | **La carta doblada.** Cerrada con lacre. Se rompe, y se va desdoblando pliegue a pliegue. |
| `página.html23.html` | **El café de las siete.** Se echa la leche arrastrando el dedo. Despacio sale blanco; deprisa se corta. |
| `página.html24.html` | **El tocadiscos.** Se baja la aguja donde quieras y suena lo que haya grabado en ese surco. Se puede rascar. |
| `página.html25.html` | **Las medusas.** Se arrastra hacia arriba para bajar. Cuanto más hondo, menos luz y más ellas. |
| `página.html26.html` | **La ciudad dormida.** Se van encendiendo ventanas, y en cada una hay alguien haciendo algo. |
| `página.html27.html` | **El bordado.** Está marcado a lápiz en la tela; se pasa el dedo por encima y se borda. |
| `página.html28.html` | **La tormenta.** Se cuenta desde el rayo hasta el trueno, y esos segundos dicen lo lejos que está. |
| `página.html29.html` | **El globo.** Se aprieta para dar gas y se sube. El aire se enfría, así que hay que estar. |
| `página.html30.html` | **El planeta pequeño.** Se gira y se planta lo que quieras encima. Hay algo en la otra cara. |

Todas menos la primera tienen **secretos escondidos** que no se anuncian:
cosas que pasan si insistes, si dibujas algo, si esperas sin prisa, si tocas
dos veces o si no tocas nada. Están para que los encuentre ella, no para
explicarlos aquí.

Y en unas cuantas de las diez últimas están escondidas **vuestras
iniciales**: grabadas en la chapa de un péndulo, estampadas en un lacre,
dibujadas en la espuma de un café, en la etiqueta de un disco, bordadas a
mano, cosidas en la tela de un globo y clavadas en una banderita. Hay una
más que no está en esta lista, y ésa no la digo.

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

---

## Las dos páginas del principio y el candado

`inicio.html1.html` e `inicio.html2.html` son **las dos primeras páginas del
librito**, antes incluso de la portada. Son tuyas: cámbialas enteras o pega
ahí tu propio HTML (conserva el `<title>`, que es su nombre en el índice).

Justo después sale **un candadito** que pide la fecha **23 · ago · 2025**.
Hasta que no se pone, no se puede pasar de ahí: ni deslizando, ni con las
flechas, ni con la barra, ni desde el índice. Al abrirlo pasa sola a la
portada y ya no se vuelve a pedir (salvo con «Empezar de cero»).

La fecha y lo que dice el candado están en `src/pages/puerta/textos.js`.
