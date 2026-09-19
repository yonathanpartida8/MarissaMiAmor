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
ruido con un filtro que se abre y se cierra, y el trueno es ruido muy
grave con una envolvente de tres picos —el golpe y los dos rebotes en
las nubes—.

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

- Tostar un bombón en el palo y comérselo (sale bien o sale carbón).
- Tocar la llama. No lo hagas.
- Encender y apagar ambientes en las piedras de delante. Se arrastra de
  lado sobre una piedra para subirle el volumen.
- Abrir la cajita musical.
- Entrar en la cabaña y acabar tumbado mirando por la ventana.
- Tocar la luna desde fuera y desde dentro.
- Dormirse.

Y unos cuantos secretos que no se explican. Uno está muy metido en el
bosque, es verde y casi no se ve.

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

---

## Rendimiento

Mide su propio ritmo durante los primeros dos segundos y medio. Si no
llega a 46 fotogramas por segundo, baja la calidad **una vez** y no
vuelve a tocarla: un ajuste que sube y baja solo se nota más que ir
siempre un poco peor.

Lo que baja: la resolución del lienzo, el número de partículas y de
estrellas, y cada cuánto salen chispas y humo.

Cuando la pestaña se va a segundo plano, el bucle se para y los
ambientes se callan. No gasta batería para nadie.
