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
│
├── audio/
│   ├── fogata.mp3
│   ├── grillos.mp3
│   ├── aire.mp3
│   ├── lluvia.mp3
│   ├── relampagos.mp3
│   └── bosque.mp3
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

Los seis de `audio/` **se reproducen en bucle**, así que conviene que
empiecen y acaben parecido para que no se note el salto. Los cinco de
`Cabaña/` suenan **una sola vez y en orden**, esperando cada uno a que
termine el anterior.

---

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
- Pillar una estrella fugaz al vuelo.
- Dormirse.

Y unos cuantos secretos que no se explican. Uno está muy metido en el
bosque, es verde y casi no se ve. Otro tiene los ojos verdes y se
cambia de árbol cada vez que lo encuentras. Y hay algo al fondo que se
va si te acercas.

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
