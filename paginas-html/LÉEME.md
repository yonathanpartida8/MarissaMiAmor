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

## El sonido de las páginas

Todas cargan, arriba del todo, `sonido-libro.js`:

```html
<script src="sonido-libro.js"></script>
```

Con eso, **cualquier sonido de la página** —un `<audio>`, un `<video>` o
Web Audio— hace que la música del libro baje con suavidad mientras suena y
vuelva poco a poco al terminar. No hay que hacer nada más. (Si una página
nueva se olvida de ponerlo, el libro se lo añade solo.)

Para un fondo que no deba bajar la música —lluvia, viento—, se conecta con
`LibroSonido.ambiente(nodo)` en vez de a `destination`.

Los archivos que usan las páginas los encuentra `herramientas/contenido.mjs`
y los apunta en `archivos.js`:

- `ojos.mp3` (aquí mismo, en `paginas-html/`) — la canción de la caja de música.
- `tocadiscos musica/musica1.mp3` … `musica5.mp3` (la carpeta está en la raíz del proyecto) — las del tocadiscos, una por surco.
  Si falta alguna, ese surco toca una melodía hecha en el momento.

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
| `página.html5.html` | **El vaho.** Una mano invisible escribe en el cristal empañado los cinco lugares, uno por uno; se limpia con el dedo. |
| `página.html6.html` | **Las constelaciones.** Se unen estrellas arrastrando y aparece una figura con lo que significa. |
| `página.html7.html` | **La caja de música.** Papel moteado arriba, terciopelo rojo abajo, marco plateado y un reloj. Se le da cuerda y suena `ojos.mp3`; las agujas recorren la canción. |
| `página.html8.html` | **Mil grullas.** Cada toque dobla una y se va volando. Mil y se concede un deseo. |
| `página.html9.html` | **Las luciérnagas.** Se juntan en enjambre alrededor del dedo quieto y, al soltar, estallan en un corazón de luz. |
| `página.html10.html` | **Tira una piedra.** Rebota en el lago y escribe con luz «Te amo» o «Siempre tuyo». |
| `página.html11.html` | **Las polaroids.** Seis fotos sin revelar que se frotan con el dedo: las fotos que todavía nos debemos. |
| `página.html12.html` | **El tren de noche.** Pasa otro tren seguido, la ventanilla se empaña y se aclara, y se puede escribir en el vaho. |
| `página.html13.html` | **Los globos.** Cada uno se lleva un deseo escrito. |
| `página.html14.html` | **Agítala.** Una bola de nieve que se agita con el sensor de movimiento del teléfono (o arrastrando, si no hay sensor). |
| `página.html15.html` | **Coge las que quieras.** Se escogen flores y se arma un ramo con su papel, su listón y su tarjeta. |
| `página.html16.html` | **La radio.** Se enciende, se busca en el dial, y cada emisora dice lo suyo con su sintonía. |
| `página.html17.html` | **Toca un alfiler.** Un mapa con cinco alfileres; cada uno abre su momento y el camino se va entintando. |
| `página.html18.html` | **El caleidoscopio.** Se gira con el dedo o inclinando el teléfono y los cristales caen por los espejos. |
| `página.html19.html` | **El árbol de las estaciones.** Se arrastra de lado y pasa el año entero encima del mismo árbol. |
| `página.html20.html` | **La cometa.** Con física de verdad: cuerda, cola y viento. |
| `página.html21.html` | **El reloj.** De péndulo, con la hora real; cada hora sale un corazón por la puertita. |
| `página.html22.html` | **Rompe el lacre.** El sello se agrieta y salta en pedazos; la carta se despliega pliegue a pliegue. |
| `página.html23.html` | **El café.** La leche se vierte con fluidos de verdad y se dibuja con el dedo. |
| `página.html24.html` | **El tocadiscos.** Cinco surcos, cinco canciones (`tocadiscos musica/musica1…5`); la aguja salta entre ellas con fundido. |
| `página.html25.html` | **Baja despacio.** Se baja al fondo del mar entre medusas; cuanto más hondo, menos luz. |
| `página.html26.html` | **Enciende las luces.** Veinticuatro ventanas, cada una con su escena distinta, y fuegos artificiales al final. |
| `página.html27.html` | **Sigue los puntos.** Un bastidor: se borda siguiendo los puntos y al terminar florece. |
| `página.html28.html` | **Cuenta hasta el trueno.** Primero la tormenta llega, luego se cuenta desde el rayo hasta el trueno y se va acercando. |
| `página.html29.html` | **Dale al quemador.** El globo sube del prado a las nubes, ve la curva de la Tierra y llega al espacio. |
| `página.html30.html` | **Dale la vuelta.** Un planeta pequeño que se gira y se planta. Con tres dedos, revienta… y se vuelve a juntar. |

Todas menos la primera tienen **secretos escondidos** que no se anuncian:
cosas que pasan si insistes, si dibujas algo, si esperas sin prisa, si tocas
dos veces o si no tocas nada. Están para que los encuentre ella, no para
explicarlos aquí.

Y en unas cuantas de las diez últimas están escondidas **nuestras
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
