# Noche estrellada

Una noche en el bosque, junto a una fogata, cerca de una cabaña.

Se abre sola dentro del librito (es la última página) y **también funciona
suelta**: abre `noche-estrellada/index.html` y ya está.

---

## Dónde van tus sonidos

Ésta es la parte importante. Las rutas son **exactamente** éstas y no
cambian nunca:

```
noche-estrellada/
├── index.html
├── musica.mp3              ← la cajita musical
├── misterio.mp3            ← el búho
├── rag.mp3                 ← lo que se oye en el bosque
│
├── sonidos/                ← UNA CARPETA POR SONIDO de la fila (en bucle)
│   ├── fogata/                (deja ahí uno o varios audios con el nombre
│   ├── grillos/                que quieras; si hay varios, suena uno al azar)
│   ├── buhos/
│   ├── aire/
│   ├── bosque/
│   ├── rio/
│   ├── lluvia/
│   └── tormenta/
│
├── audio/                  ← lo de siempre, por si la carpeta está vacía
│   ├── fogata.mp3          ← en bucle
│   ├── grillos.mp3         ← en bucle
│   ├── aire.mp3            ← en bucle
│   ├── lluvia.mp3          ← en bucle
│   ├── relampagos.mp3      ← en bucle
│   ├── bosque.mp3          ← en bucle
│   │
│   ├── trueno1.mp3         ← sueltos: suenan una vez
│   ├── trueno2.mp3            (pon los que quieras, la lista
│   ├── trueno3.mp3             se lee entera)
│   ├── disparo.mp3
│   ├── pasos.mp3
│   ├── buho.mp3
│   └── puerta.mp3
│
└── Cabaña/
    ├── door.open.mp3
    ├── door.close.mp3
    ├── escaleras.mp3
    ├── cuarto.mp3
    └── cama.mp3
```

**Deja tus archivos ahí con esos nombres y ya está.** No hay que tocar
ni una línea de código.

**La fila de sonidos** de la cabaña ya no está siempre abajo: se saca y
se esconde con el botón **♫ sonidos** de arriba a la derecha, así no se
cruza con los botones de pasar página del librito. Van en este orden:
fogata, grillos, búhos, aire, bosque, río, lluvia y tormenta.

> **La cajita musical, además**, mira en `assets/audio/musica.mp3` si no
> encuentra `noche-estrellada/musica.mp3`. Es para que una canción que ya
> esté en el proyecto suene sin tener que copiarla dos veces. El de
> `noche-estrellada/` manda siempre: si lo pones ahí, ése es el que se
> usa.

### Y si todavía no los tienes

No pasa nada: **la experiencia funciona igual desde el primer momento**.

Cada sonido tiene un gemelo sintetizado con la Web Audio API. El código
intenta cargar el `.mp3`; si no está, usa el gemelo. En cuanto dejes el
archivo de verdad en su sitio, se usa el tuyo y el gemelo no vuelve a
sonar.

Los gemelos no son pitidos: la fogata es ruido rosa grave con chasquidos
sueltos, los grillos son pulsos agudos en grupos de tres, el viento es
ruido con un filtro que se abre y se cierra, el trueno es ruido muy
grave con una envolvente de tres picos —el golpe y los dos rebotes en
las nubes—, y el búho son dos notas con vibrato y el aire de la
garganta, que sin él suena a flauta y no a bicho.

### Formatos

Vale cualquier cosa que sepa abrir el navegador: `.mp3`, `.m4a`, `.ogg`,
`.wav`. Si usas otra extensión, cambia la ruta en el bloque
`CONF.rutas` del principio del `<script>`.

Los seis primeros de `audio/` **se reproducen en bucle**, así que
conviene que empiecen y acaben parecido para que no se note el salto.
Los cinco de `Cabaña/` suenan **una sola vez y en orden**, esperando
cada uno a que termine el anterior.

Los demás de `audio/` —los truenos, el disparo, los pasos,
el búho, la puerta— son **sueltos**: suenan una vez, cuando pasa lo que
tiene que pasar, con dos milisegundos de rampa a cada lado para que no
hagan «clac». No hace falta que estén todos: los que falten se
sintetizan.

Los truenos son una **lista** a propósito. Con un solo archivo la
tormenta se convierte en el mismo ruido cada veinte segundos, y eso se
oye a la segunda vez; con tres o cuatro, eligiendo al azar y sin
repetir el anterior, parece una tormenta. Si quieres más, añádelos a
`CONF.rutas.sueltos.truenos`.

### La barra de volumen es sólo volumen

Antes, subirle el sonido a la lluvia hacía llover más: el mismo número
era las dos cosas. Sonaba bonito de explicar y en la mano era un
fastidio, porque no había manera de tener lluvia fuerte y callada.

Ahora la piedra **encendida** dice si llueve y cuánto; la **barra** dice
cuánto se oye. Dos cosas, dos mandos.

### La tormenta arrecia

Mientras está puesta, va a peor: los rayos se acercan —de uno cada
siete-veinte segundos a uno cada tres-diez—, los truenos llegan antes,
y de vez en cuando caen dos seguidos. Al quitarla, amaina, así que
volver a ponerla empieza otra vez suave.

---

## La historia

Ahora hay una. Se puede ignorar entera —la fogata, el bombón y la
cajita siguen ahí para quien sólo quiera estar— pero si se tira del
hilo, lleva a algún sitio:

1. **El claro.** La fogata, la cabaña, los bombones. Y a la izquierda,
   entre dos troncos, un hueco por el que se cuela un poco de verde.
2. **El sendero.** Se toca y se ANDA hasta el bosque de dentro. La
   cámara se mete, la escena se apaga, cruzan hojas y motas, y el
   sonido cambia sin cortarse.
3. **La espesura.** Tres pantallas de bosque. Se anda arrastrando el
   dedo, o con las dos flechas de abajo. Hay sitios: una marca en el
   suelo, un búho que habla, una pala apoyada en un tocón, un reloj de
   pie recargado en un árbol, y algo que mira desde el fondo.
4. **La X.** Medio tapada de hojas. Se destapa, y entonces hace falta
   una pala.
5. **La pala.** Está al otro extremo del bosque. Se coge, se queda en
   la bolsa, y se pone en la mano tocándola ahí.
6. **Cavar.** Cuatro paladas, y cada una distinta: tierra, una grieta,
   algo que suena debajo, y lo que había.
7. **El misterio.** Sale de la tierra encendido. Al tocarlo, el bosque
   se entera.
8. **Y lo que viene después.** No se cuenta aquí.

### La cacería

Al final del todo del bosque, tirada entre las hojas, hay una escopeta.
Hay que andar el bosque entero para dar con ella, y aun así no salta a
la vista: lo único que hace es un destello por el cañón cada cuatro o
cinco segundos. (Hay una pista escondida por ahí que apunta hacia allá.
Una sola, y no avisa de que es una pista.)

Al recogerla se abre el cielo. Llueve, oscurece, y del bosque sale de
todo en **diez rondas** cada vez más grandes. Se tienen **cinco
vidas**, arriba y por el centro. Se dispara tocando: el dedo es el
gatillo —sin esperas ni recargas: cada toque es un tiro, tan rápido
como toques—, y ese mismo dedo, arrastrando, te mueve por el bosque. No hay
botones de andar: se desliza y ya. Al que le das no se muere,
**revienta en luz**.

No todos son búhos, y hay que mirar qué viene:

- el **búho** de ojos rojos va derecho y cae al primer tiro;
- el **murciélago** es chico, rapidísimo y va a bandazos. Cuesta
  apuntarle. Bate las alas al doble de velocidad, así que se reconoce
  de un vistazo aunque los dos sean siluetas negras;
- el **cuervo** aguanta **dos**. El primer tiro no lo mata: lo enfada.
  Se pone rojo entero y acelera, así que se sabe perfectamente que
  sigue viniendo.

Los murciélagos salen desde la segunda ronda y los cuervos desde la
cuarta. Y nunca hay más de **ocho a la vez** en pantalla: los demás
esperan turno, así que las rondas de arriba aprietan mucho pero se
pueden ganar.

Si te queda menos de la mitad de la vida, de vez en cuando un bicho
suelta un **corazón** al reventar. Baja flotando y hay que **tocarlo**
antes de que se caiga por abajo. Con la vida llena no cae ninguno.

**La décima ronda es otra cosa.** No vienen más búhos: viene uno solo,
mucho más grande, y no se acerca: se planta y **escupe fuego**. Aguanta
treinta impactos y el fuego quema en cuanto te alcanza, así que no se
puede pelear a pecho descubierto.

Para eso está **la roca**. Es una piedra grande, plantada en el suelo
como cualquier otra cosa del bosque, y las cosas **chocan de verdad**
contra ella: la bola de fuego revienta contra la piedra y se apaga, y
lo que venga volando se estrella también. No es una zona segura
invisible.

Pero detrás de la roca **no hay tiro**. Hay que asomarse, disparar y
volver a meterse. Sin esas dos mitades no sería una cobertura: sería
un sitio donde se gana sin hacer nada. Y él se da cuenta de cuándo le
das, y contesta.

Si se acaban las vidas, te caes y despiertas en la cabaña a las tres.
No pasa nada: se puede volver a empezar tocando la escopeta en la
bolsa.

Y al acabar con él vuelve el que llevaba toda la noche vigilando, con
los ojos encendidos, a decir una cosa. Después se va… pero **no
desaparece**. Sigue en el bosque, en otra rama, y en una distinta cada
vez que se entra. Hay que volver a encontrarlo.

Lo que se descubre se GUARDA. Si cierras y vuelves mañana, la pala
sigue siendo tuya y la X sigue cavada. Lo único que no se guarda es
dónde estabas: siempre se vuelve al claro.

## Qué se puede hacer

- Tostar un bombón en el palo y comérselo. **Hay que girarlo**: se
  tuesta por caras, así que el lado de abajo se quema mientras el de
  arriba sigue blanco, igual que uno de verdad.
- Sacudir los árboles. Se mueven con un muelle, no con una animación.
- Tocar la llama. No lo hagas.
- Encender y apagar ambientes en las piedras de delante. Se arrastra de
  lado sobre una piedra para subirle el volumen.
- Poner la lluvia y ver cómo le va ganando a la fogata, poco a poco.
- Abrir la cajita musical.
- Entrar en la cabaña y acabar tumbado mirando por la ventana.
- Tocar la luna desde fuera y desde dentro.
- Atrapar una estrella fugaz al vuelo.
- Dormirse.

### Y quedarse mirando la cabaña sin hacer nada

Es lo que casi nadie hace, y por eso está casi todo ahí:

- Una vez cada minuto y pico, la chimenea echa un **corazón de humo**.
  No se puede provocar, no da nada y no se cuenta en ningún sitio: o lo
  ves o no lo ves.
- Cada tanto **una sombra cruza por detrás de una ventana**. Alguien
  vive ahí.
- Mucho más de tarde en tarde, algo **se asoma a la lumbrera** del
  desván, ese agujero negro de lo alto del hastial.
- Al farol colgado del alero le entra una racha de viento y se queda
  **a nada de apagarse**. Depende del viento de verdad, así que no pasa
  dos veces igual.
- Cuando llueve, el barril de debajo del alero **junta agua**, y en el
  agua se ve la luna.

Y cuando ya se han encontrado seis secretos, alguna noche el cielo se
pone a escribir. Las letras no están pintadas encima: **son estrellas**,
una a una, encendiéndose de izquierda a derecha, detrás de las nubes.
Si pasa una nube por delante, tapa un trozo.

### Y en el bosque

Contesta todo lo que hay en el suelo: los helechos se abren, las
piedras se ladean, la hierba se dobla, las setas sueltan esporas, las
luciérnagas se espantan y los charcos hacen ondas. Casi nada de eso da
nada, y ésa es la idea: están para que valga la pena tocar lo que sí.

Los charcos sólo existen cuando llueve, y reflejan. Uno de cada cuatro
refleja, a ratos, algo que no está arriba.

Y de vez en cuando se oye algo lejos: una rama que se parte, algo
pesado entre la hojarasca, un ulular. No hay nada que mirar, a
propósito.

### El libro del suelo

Tirado en las tablas, entre el tapete y la mesilla. Cerrado no llama la
atención: es un bulto marrón en la penumbra. **Tócalo.** Se abre con su
peso y un segundo después le prende fuego rosa por la costura, y encima
queda escrito «Juntos por siempre». Se puede cerrar y volver a abrir
todas las veces que quieras.

### La botella del cajón

Después de leer su papel, si la sigues tocando se va **rajando**: una
grieta más por toque a partir del tercero, sonando cada vez más agudo.
Al séptimo **revienta**. No se pierde nada —el papel ya está leído y
guardado— pero la botella ya no vuelve.

### Y dentro del cuarto

Casi todo lo que hay se puede tocar, y casi todo contesta:

- El radio de la repisa se prende y se apaga, con su estática y una
  melodía de fondo.
- La guitarra recargada en la pared tiene seis cuerdas y suenan las
  seis, cada una la suya.
- La planta, la taza, los tres libros de la mesilla, el tapete de
  trapo, el apagador, la vela del alféizar.
- Once estrellitas de las que brillan en la oscuridad, pegadas arriba.
  Brillan menos con la lámpara encendida y más a oscuras, como las de
  verdad.

El cajón de la mesilla se abre —y guarda algo—, las cortinas se corren
a toque o arrastrándolas, y la manta se sube hasta la barbilla.

Y unos cuantos secretos que no se explican y que nadie te va a decir.
Uno está muy metido en el bosque, es verde y casi no se ve. Otro tiene
los ojos verdes y se cambia de árbol cada vez que lo encuentras. Hay
algo al fondo que se va si te acercas. Hay algo debajo del tapete. Hay
algo dentro del último libro. Hay algo grabado en una tabla del suelo.
Las once estrellas no están puestas al azar. Y la chimenea de la
cabaña, una vez cada minuto y pico, hace una cosa que no se puede
provocar: o la ves o no la ves.

Ninguno de esos secretos hace falta para nada. No abren puertas y no
desbloquean nada. Sólo están.

### La escena se acuerda

Lo que pasa se guarda en el navegador. Cuántas veces has encontrado al
búho, cuántas estrellas has pillado, si ya cayó el papel del árbol, si
ya se te apagó la fogata: todo eso cambia lo que se dice la próxima
vez. Un secreto que se comporta igual siempre se gasta a la segunda.

Si tienes las cookies bloqueadas o estás en una ventana privada, no
pasa nada: se acuerda sólo durante esa visita, que ya es bastante.

---

## Qué se puede cambiar sin saber programar

Todo lo que se dice y casi todo lo que se ve está en el bloque
`CONF = { … }`, arriba del todo del `<script>`:

| qué | dónde |
|---|---|
| las rutas de los sonidos | `CONF.rutas` |
| qué ambientes hay y cuáles empiezan puestos | `CONF.ambientes` |
| lo que se dice al comerse el bombón | `CONF.alComer` |
| lo que se dice al tocar el fuego | `CONF.alQuemarse` |
| lo que dice la luna | `CONF.alTocarLuna` |
| la carta escondida y su firma | `CONF.bosqueSecreto` |
| lo que se lee al dormir | `CONF.alDormir` |
| lo deprisa que se tuesta el bombón | `CONF.bombon` |
| el peso del palo y del bombón | `CONF.bombon.fisica` |
| dónde se esconde el búho y qué dice | `CONF.buho` |
| los ojos del fondo | `CONF.ojosRojos` |
| la lluvia y lo que tarda en apagar el fuego | `CONF.lluvia` |
| lo que se dice en cada escalón de apagarse | `CONF.fuegoLluvia` |
| la nota que guarda un árbol | `CONF.arbolNota` |
| lo de la luna a los diez toques | `CONF.dona` |
| el susto de la ventana | `CONF.ventana` |
| lo que sabe la cajita | `CONF.cajita` |
| el sendero y lo que se dice al andar | `CONF.espesura` |
| cuántas paladas y qué se dice en cada una | `CONF.cavar` |
| lo que dice el misterio | `CONF.misterio` |
| lo que dice el búho del bosque | `CONF.buhoEsp` |
| lo del reloj de las tres | `CONF.tres` |
| lo que dice el reloj del bosque | `CONF.relojBosque` |
| la escopeta y toda la cacería | `CONF.caza` |
| cuántos búhos trae cada ronda, y cuántas vidas hay | `OLEADAS` y `VIDAS` |
| cuál es la ronda del jefe y cuánto aguanta | `OLEADA_JEFE` y `jefe.vidaMax` |
| qué dice el cielo, y cuántos secretos hacen falta para que lo diga | `CONF.cieloMensaje` |
| todo lo del cuarto: radio, frasco, planta, guitarra, tapete, estrellitas, libros, taza, vela, el nudo del suelo y el deseo | `CONF.cuarto` |
| las tres frases de la cuenta de secretos | `CONF.logros` |
| lo ancho que es el bosque y sus capas | `ESP` |

Si añades o quitas secretos, la cuenta va en `TODO_LO_ESCONDIDO`: es la
lista de todo lo escondido que hay, y de su tamaño salen el tercio, los
dos tercios y el final.

---

## Rendimiento

Mide su propio ritmo durante los primeros dos segundos y medio. Si no
llega a 46 fotogramas por segundo, baja la calidad **una vez** y no
vuelve a tocarla: un ajuste que sube y baja solo se nota más que ir
siempre un poco peor.

Y no baja todo de golpe: primero apaga **el brillo** —el bloom de
WebGL2— porque es lo único que se puede quitar sin que cambie nada de
lo que pasa. La escena sigue entera debajo; sólo le baja el resplandor.
Si con eso basta, no se toca nada más. Si no, entonces sí bajan la
resolución del lienzo, el número de partículas y de estrellas, y cada
cuánto salen chispas y humo.

El brillo también se apaga solo si el navegador no tiene WebGL2, o si
la GPU se lleva el contexto al bloquear el móvil. En los tres casos se
vuelve a ver el lienzo normal, que nunca ha dejado de pintarse.

Cuando la pestaña se va a segundo plano, el bucle se para y los
ambientes se callan. No gasta batería para nadie.
