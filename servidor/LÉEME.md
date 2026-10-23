# M.YNTHN — el servidor de My Love Pages (Termux)

**M.YNTHN** es el servidor **público** del editor de libritos: vive en tu
teléfono viejo con Termux y atiende a **todas** las personas que usan el
editor, estén donde estén. Cada quien sólo crea su **usuario y contraseña**
(al momento, sin esperar aprobación de nadie) y ya tiene **su nube**: sus
libritos con sus fotos, música y videos, sus copias y sus ajustes del editor
quedan guardados **en tu servidor**, y los abre desde cualquier teléfono o
computadora. También publica y le manda **Detallitos** a su amorcito. El token
de GitHub es **uno solo, el tuyo**, y vive cifrado en el teléfono: nadie lo ve,
nadie lo escribe en el editor.

> **Sólo tú instalas Termux, una vez, en tu teléfono.** Las demás personas
> —tu amorcito incluida— **no instalan nada**: abren el enlace del editor
> (`https://<usuario>.github.io/<repositorio>/EditorDev/`), tocan «Mi cuenta»,
> crean su usuario y contraseña, y listo. Da igual si están en otra ciudad o en
> otro país: el túnel de Cloudflare hace que tu servidor se vea desde todo
> internet.

```
  Editor (en tu GitHub Pages) — cualquiera, con su usuario y contraseña, desde donde sea
     │  sesión (Bearer)
     │  su nube: libritos (project.json) · fotos, música y videos (por huella) · ajustes
     │  páginas para publicar · detallitos
     ▼
  https://xxxx.trycloudflare.com  (túnel de Cloudflare, https gratis)
     ▼
  Teléfono viejo · Termux · servidor.py  ── panel web para administrar
     │  token de GitHub (cifrado, nunca sale de aquí)
     ▼
  GitHub → tu repositorio → publicaciones/<nombre>/ → GitHub Pages
```

Lo que hace por cada usuario:

- **Publicar en servidor M.YNTHN** (Editor → Exportar): la página queda en
  `https://<usuario>.github.io/<repositorio>/publicaciones/<nombre>/`, a
  **pantalla completa** como una app y **sin poder editarse**. Si el nombre ya
  existe, se usa `<nombre>-2`, `-3`… Actualizar una que ya estaba es aparte.
- **Su nube**: mientras edita, cada librito se guarda en su aparato y, unos
  segundos después, **se sube solo** a M.YNTHN (sólo lo que cambió). En otro
  aparato, con la misma cuenta, sus libritos aparecen en «Tus borradores» y se
  abren con todo. Cada vez que guarda **a mano** (Guardar o Ctrl+S) queda
  además una **copia** (se quedan las 15 más nuevas de cada librito; se cambia
  en el panel). Ver **9 · La nube**.
- **Su perfil**: foto, nombre, cumpleaños y «somos novios desde» (esa fecha
  es de los dos: si uno la pone, al otro le aparece igual). El menú principal
  muestra sus dos fotos como polaroids, cuántos días llevan juntos y lo que
  viene (aniversario, mesiversario o un cumpleaños).
- **Detallitos**: cada cuenta tiene un **código único** (`AMOR-XXXX-XXXX`).
  Con «Vincular a tu Amorcito» uno pega el código del otro y quedan
  conectados: se mandan páginas que se van coleccionando, ven si el otro está
  en línea y les llega un aviso cuando hay uno nuevo.

---

## Paso a paso desde cero

### 1 · Termux en el teléfono viejo

1. Instala **Termux desde F-Droid** (https://f-droid.org/packages/com.termux/).
   La de Play Store está vieja y no sirve.
2. Ábrelo una vez y deja que termine de prepararse.
3. Ajustes de Android → Apps → Termux → Batería → **Sin restricciones**
   (si no, Android lo duerme y el servidor se apaga).
4. (Opcional) Para guardar respaldos en la memoria del teléfono:
   `termux-setup-storage` y acepta el permiso.

### 2 · Saca tu token de GitHub (2 minutos, antes de instalar)

Así el asistente te lo pide de una vez y no hay que volver.

1. GitHub → foto de perfil → **Settings → Developer settings → Personal access
   tokens → Fine-grained tokens → Generate new token**.
2. Nombre: `servidor del librito`. Expiración: la que quieras (al caducar,
   pones otro con `librito github`).
3. **Repository access → Only select repositories →** `MarissaMiAmor`.
4. **Permissions → Repository permissions:**
   - **Contents: Read and write** (para publicar);
   - **Pages: Read and write** (para ver y pedir que publique);
   - **Administration: Read and write** (sólo si quieres que el servidor
     encienda GitHub Pages por ti; si no, déjalo).
   - Metadata queda en *Read-only* solo.
5. **Generate token** y cópialo (empieza con `github_pat_`). No lo pegues en
   ningún otro lado: sólo en Termux, cuando el asistente te lo pida.

### 3 · Instalar y prender (una línea; te va guiando)

Pega esto en Termux y Enter:

```sh
curl -fsSL https://yonathanpartida8.github.io/MarissaMiAmor/servidor/instalar.sh | bash
```

Es un asistente de **3 pasitos** y no pide ningún código:

1. **Lo necesario:** instala `python` y `cloudflared` si faltan y baja **sólo**
   la carpeta `servidor/` de tu GitHub Pages a `~/librito-servidor`.
2. **Tu administrador:** te pregunta **usuario** y **contraseña** (mínimo 8;
   no se ve al escribirla). Si no coinciden o es corta, te la vuelve a pedir.
3. **GitHub:** «¿Lo conectas ahora? [S/n]» → repositorio
   (`yonathanpartida8/MarissaMiAmor`), el token (no se ve al pegarlo) y la
   rama (Enter = la que sugiere).

Al final **lo prende**, te muestra la dirección y **abre el panel** en el
navegador del teléfono. Desde ese momento ya se escribe sólo **`librito`**:

- `librito` → si está apagado lo prende; si está prendido te dice cómo va.
- `librito panel` → abre el panel.

> Si ya clonaste el repositorio, también vale: `bash servidor/librito.sh`.

### 4 · Si te saltaste algo

- **El administrador:** `librito admin` (te pregunta usuario y contraseña), o
  abre `http://127.0.0.1:8787` **en el mismo teléfono**: ahí el panel te deja
  crearlo **sin código**.
- **Desde otro aparato** (tu compu en la misma wifi, `http://IP-del-teléfono:8787`)
  el panel sí pide el **código de instalación**: lo ves con `librito estado`.
  Ese código **no cambia** hasta que lo usas (antes cambiaba con cada
  `librito estado`: por eso decía «no es ese»), y da igual escribirlo con
  minúsculas o sin el guion.
- **GitHub:** `librito github` (lo más seguro: el token ni pasa por el
  navegador) o Panel → GitHub. **No hace falta reiniciar**: el servidor lo nota
  solo y en unos minutos anuncia su dirección.

| Clave | Quién la genera | Dónde vive |
| --- | --- | --- |
| Llave maestra (cifra el token) | el servidor, solo, al instalar | `~/librito-datos/llave.bin` (0600) |
| Código de instalación | el servidor, mientras no haya administrador | `codigo-instalacion.txt` (se borra al usarlo) |
| Token de GitHub | tú, en GitHub (paso 2) | cifrado en `~/librito-datos/secretos.bin` |
| Tu contraseña de administrador | tú | sólo su huella (scrypt) en `librito.db` |

### 5 · GitHub Pages encendido

En **Panel → GitHub → GitHub Pages**: si dice «Apagado», elige la rama donde
está el librito más nuevo → **Encender GitHub Pages**. Si tu token no tiene
«Administration», el panel te lleva a los ajustes de GitHub para hacerlo a mano
(Settings → Pages → Deploy from a branch → la rama → `/ (root)` → Save).

### 6 · Que se vea desde internet (el túnel)

El editor vive en internet (GitHub Pages, https), así que necesita una
dirección **https** para llegar al teléfono. Por eso el servidor abre solo un
**túnel de Cloudflare** (gratis, sin cuenta) al prenderse:

```sh
librito direccion        # → https://palabras-al-azar.trycloudflare.com
```

- Esa dirección **cambia** cada vez que se reinicia el túnel. No pasa nada:
  con «Anunciar la dirección» encendido (Panel → Ajustes, viene encendido),
  el servidor la escribe en `servidor.json` de tu GitHub Pages y **el editor
  la encuentra solo**.
- ¿Quieres una dirección fija? Usa un túnel con nombre de Cloudflare (con tu
  dominio) o cualquier otro proxy https, y escríbela en Panel → Ajustes →
  «Dirección fija». Entonces pon el túnel en «Sin túnel».
- **Se cuida solo:** la dirección se da por buena sólo cuando cloudflared de
  verdad conectó; cada ~3 minutos el servidor se prueba **desde internet**
  (por su propia dirección) y, si no contesta 3 veces seguidas, reabre el
  túnel y anuncia la dirección nueva. Si la red de datos bloquea el protocolo
  de fábrica (QUIC), el siguiente intento usa `http2`. En el panel → Inicio se
  ve «Probado desde internet hace X min» y si el editor ya la conoce.
- Sin internet / sólo en casa: el panel se abre por la wifi, pero el editor
  desde GitHub Pages **no** puede hablar con `http://192.168…` (el navegador
  bloquea http desde una página https). Para eso es el túnel.

### 7 · Cómo lo usa la gente (nada que configurar)

Con «Anunciar la dirección» encendido (viene así), el editor **encuentra solo**
a M.YNTHN. Quien lo abre ve primero el **menú principal**:

1. **Iniciar sesión o crear cuenta** → usuario y contraseña (mínimo 8) →
   listo, ya tiene acceso. «Recordarme» en sus aparatos; en uno prestado, no.
2. **Entrar al editor** y hacer su librito.

Para probar con un servidor que no está anunciado:
`…/EditorDev/#servidor=https://tu-túnel` (o Panel → Inicio → «Abrir el editor
emparejado»).

### 8 · Publicar, copias y Detallitos

Editor → **Exportar** abre tres opciones:

- **Descargar página completa**: el .zip de siempre, en el aparato.
- **Publicar en servidor M.YNTHN**: arma la página (sólo para ver, con el visor
  a pantalla completa), la sube con su barrita de avance y M.YNTHN la deja en
  `publicaciones/<nombre>/` de tu GitHub. Da el enlace, «Ver a pantalla
  completa», copiar y compartir.
- **Enviar Detallito**: abre el menú de Detallitos (ver abajo).

La pestaña **Páginas publicadas** del editor es sólo de M.YNTHN: publicar,
**Mis páginas publicadas** (ver, copiar, compartir, actualizar con el librito
abierto, subir a GitHub, quitar) y **Copias de mis proyectos** (abrir
cualquiera como borrador nuevo, en cualquier aparato, o borrarla).

Al publicar (o mandar un detallito), las fotos, la música y los videos **no
viajan otra vez** dentro del .zip: ya están en tu nube (o suben antes, por
partes) y el .zip lleva sólo su huella; M.YNTHN los pone él mismo. Así una
página con un video de 200 MB sube en segundos y no choca con el tope de
100 MB del túnel. Los archivos grandes (más de 20 MB) llegan a GitHub con
`git push` (no por su API), así que ya no sale «Sorry, your input was too large
to process»: por eso `librito actualizar` instala `git` en Termux.

**Detallitos** (Exportar → Enviar Detallito, o desde el menú principal):

- **Vincular a tu Amorcito**: muestra tu código (copiar / compartir / otro
  código) y un lugar para **pegar el de tu amorcito**. Con que uno de los dos
  lo pegue basta. Cada cuenta se vincula con una sola; «Desvincular» lo deshace.
- **Mandar esta página**: título y un mensajito; la página abierta se envuelve
  (con su proyecto) y le llega a tu amorcito.
- **La colección de los dos** (desde el menú principal sólo sale esto, nada
  de mandar): cada página con su **portadita** (una miniatura que el editor
  dibuja al mandarla y sube aparte), «Yo» o el nombre de quien la mandó, y
  filtros Todas / De ‹su nombre› / Mías. Al abrir una se ve en una ventanita
  (o a pantalla completa), se puede **guardar en tus borradores** para
  editarla, o quitarla de tu colección (al otro no se le borra).
- **Reacciones**: a lo que te mandó tu amorcito le puedes poner una (te amo,
  me encantó, lloré, abrazo, beso, me reí; tocar la misma la quita). Sólo
  quien la recibió puede reaccionar; quien la mandó lo ve en su colección y
  le llega un aviso con el latido.
- El editor pregunta cada 25 s si llegó algo: globito en Exportar / Más y un
  aviso «Verlo». La pastilla de arriba dice si tu amorcito está **en línea**.
- **Mensajitos** (1.6.0; 1.7.0 con tiempo real): el chat de los dos, con GIFs
  y stickers de GIPHY (que se arrastran a cualquier parte), dibujos que se ven
  mientras se hacen, reacciones y «visto» (que cada quien puede apagar). Con el
  chat abierto, el editor espera al servidor y éste le contesta en cuanto
  cambia algo; lo escrito se guarda como texto (nunca HTML) y sólo se aceptan
  imágenes de GIPHY o las que ustedes suben (1.9.0).
- **1.13.0**: las páginas de cada mes (`/api/mesecitos`, una por mes de la pareja), Cositas
  Juntitos (`/api/cositas`: contadores y registros privados salvo que se compartan; «te extraño» y
  «te amo» avisan) y la ubicación compartida (`/api/ubicacion`, sólo si cada quien la comparte; al
  dejar de compartir se borra) con sus lugares (`/api/lugares`, hasta 10, avisos al entrar o salir).
- **1.12.0**: responde comprimido (gzip) lo que vale la pena y contesta «304, no cambió»
  (ETag) cuando el navegador ya tiene el archivo: menos datos, menos radio, menos pila.
- **1.11.0**: el género de cada quien en su perfil (Hombre, Mujer, LGBTQ+ u Otro;
  sólo lo cambia cada quien), que le da su color a los mensajitos en «Hormonal».
- **1.10.0**: lo eliminado queda como «Aquí se eliminó un mensajito…» para los dos
  (y a tu amorcito se le avisa), y los mensajes de voz HD (hasta 26 MB).
- **1.9.0**: mensajes de voz (WAV), stickers hechos por ustedes con sus fotos,
  su colección (stickers y GIFs favoritos, ordenados por favoritos y por lo que
  más usan) y editar un mensajito (queda marcado «Editado» para los dos). Lo
  que suben vive en `mensajitos-media/`, con el nombre de la huella de su
  contenido (sólo PNG, JPG, WebP o WAV, revisados por dentro; hasta 30 por minuto).

Las reacciones y las portaditas necesitan M.YNTHN **1.5.0** o más nuevo, los
Mensajitos **1.6.0**, los dibujos, los stickers libres y el tiempo real
**1.7.0**, las notificaciones push **1.8.0**, y los audios, stickers propios,
favoritos y editar **1.9.0**, lo eliminado con aviso y los audios HD **1.10.0**, y el
género del perfil **1.11.0**: en
el teléfono servidor corre `librito actualizar` (tus datos no se tocan; las
columnas nuevas se agregan solas al prender). Con uno más viejo todo lo demás
sigue igual y las páginas sin portadita llevan una tapita de colores.

Mientras el servidor no tenga GitHub conectado, lo publicado se guarda en el
servidor y se ve en `https://<tu-túnel>/p/<nombre>/`.

---

### 9 · La nube (tus libritos en cualquier aparato)

Todo lo de cada cuenta vive en **tu teléfono servidor**, en
`~/librito-datos/nube/`:

- **Cada foto, canción o video se guarda una sola vez**, por su huella
  (SHA-256): si está en diez libritos, o dos personas suben la misma, ocupa un
  solo lugar. Sube **por partes** (8 MB) y, si se corta el internet, sigue
  donde quedó; al terminar, el servidor comprueba la huella (si llegó dañado,
  se vuelve a subir solo).
- **Cada librito es su `project.json`** (páginas, textos, ajustes y la huella
  de cada archivo). Guardar = mandar sólo lo nuevo.
- **Dos aparatos a la vez**: si cambiaste el librito en la compu y el teléfono
  no lo había tocado, al abrirlo (o al volver a esa pestaña) el teléfono **se
  trae solo** la versión nueva. Si cambió en los dos, el editor **pregunta**:
  «La de aquí», «La de mi nube» o «Las dos» (la de aquí queda como un librito
  aparte). Nunca se pisa nada sin preguntar.
- **Borrar**: en «Tus borradores», «Borrar de este aparato» (en tu nube sigue)
  o «Borrar de todos lados». Si lo borras de la nube desde otro aparato, en
  éste no se revive solo: se queda sólo aquí (el indicador de guardado deja
  «Subirlo otra vez»).
- **Ajustes del editor** (tema, estilo, sonidos, letras…): también viajan; gana
  el último que cambió.
- **Espacio**: cada cuenta tiene su cuota (1 GB al instalar; Panel → Ajustes,
  «Espacio por usuario»); los administradores no tienen tope. Lo que ya ningún librito ni
  copia usa se borra solo.
- **El indicador de guardado** (arriba en el editor) lleva un puntito: verde =
  al día en tu nube, latiendo = subiendo, hueco = tu nube no contesta (se sube
  sola cuando vuelva), naranja = cambió en dos aparatos o la nube está llena.
  Tocarlo explica qué pasa y deja «Subir ahora».
- **Sin internet o con el servidor apagado** se sigue editando igual: todo se
  guarda en el aparato y sube después.

### 10 · Borrar las cuentas de prueba (empezar de cero)

Para quitar de un jalón todas las cuentas que creaste para probar (todas las
que **no** son de administrador, con su nube, sus copias, sus detallitos y su
foto; tú te quedas):

- En Termux: `librito borrar-cuentas`. Te enseña la lista y pide que escribas
  **BORRAR** para confirmar. No hace falta apagar el servidor.
- O en el panel: **Usuarios → Cuentas de prueba → Borrar las N cuentas**.

No se puede deshacer. Sus publicaciones (si había) pasan a ti.

### Notificaciones push (1.8.0)

Avisan aunque el editor esté cerrado (mensajito nuevo, página nueva y
reacciones), con el ícono de la app y el sonido de notificaciones del teléfono.
Todo es Python puro (no hay que instalar nada en Termux): el servidor crea una
vez su llave **VAPID** (curva P-256, guardada cifrada con los demás secretos),
firma cada aviso y lo cifra sólo para ese aparato (RFC 8291, `aes128gcm`).
El teléfono servidor necesita internet para entregarlos a Google, Apple o
Mozilla. Si borras `secretos.bin` (o restauras un respaldo sin él), se crea una
llave nueva y cada aparato se vuelve a suscribir solo al abrir el editor. En
iPhone, el editor tiene que estar agregado a la pantalla de inicio (iOS 16.4+).

### La cuenta del dueño: YonathanPG (1.14.0)

La cuenta del servidor es **`yonathanpg`** (se escribe como quieras: YonathanPG
entra igual; la de antes, **YnthnPG.MY**, también entra y, si existía, se
renombró sola a `yonathanpg` con todo lo suyo). Al entrar con ella queda como
administrador y el servidor termina de instalarse (ya no pide el código de
instalación). Nadie puede registrar ese nombre desde fuera del teléfono. Su
contraseña **no** está en el código (el repositorio es público): ponla una vez en
Termux con

    start my             # → 6 · Cuenta del dueño (te pide la contraseña dos veces; no se ve)

y ya entras con YonathanPG desde el editor o el panel (la nube). Con esa misma
cuenta se trae el servidor a otro teléfono (abajo).

### start my — My Love Pages en Termux, con menú (1.14.0)

Escribe **`start my`** en Termux: una tarjeta con cómo va todo (prendido o
apagado y su dirección, la pila, la temperatura, el ritmo, el espacio, la RAM,
el dueño, las cuentas y GitHub) y un menú de una tecla:

```
 1 Encender / Apagar        6 Cuenta del dueño (YonathanPG)
 2 Reiniciar                7 Traer el servidor a este teléfono
 3 La dirección y el estado 8 Conectar GitHub
 4 Abrir la nube (el panel) 9 Prenderse solo al encender el teléfono
 5 Ver lo que pasa          r Respaldar · a Actualizar · s Si se apaga solo… · 0 Salir
```

También directo: `start my encender`, `start my apagar`, `start my estado`,
`start my traer`, `start my nube`… («librito» sigue funcionando igual).

### Pasar el servidor a otro teléfono (1.14.0)

Antes, si prendías el servidor en otro teléfono, ése empezaba **vacío** (sin
cuentas ni libritos) y además le quitaba la dirección al de siempre: el editor
se quedaba sin sus cosas. Ahora:

- Cada servidor tiene su **id**, y `servidor.json` lo lleva. Un servidor nuevo
  **no le quita la dirección** a otro que sigue contestando con otro id (lo dice
  en el registro y en la nube).
- En el teléfono nuevo: `start my` → **7 · Traer el servidor a este teléfono**.
  Con la cuenta del dueño (usuario y contraseña, que se escriben ahí) se trae
  **todo** por el túnel https: cuentas, nubes, chats, fotos, ajustes, GitHub y la
  llave. Mientras se copia, el de siempre queda en **sólo lectura** (nada se
  pierde a medias). Lo que hubiera en el teléfono nuevo se guarda aparte
  (`~/librito-datos.antes-…`), no se borra.
- Al terminar, el de siempre queda **relevado**: deja de anunciarse y se apaga
  solo; si lo vuelves a prender, dice que ya no es el servidor. El nuevo se
  prende con el **mismo id** y se anuncia: el editor lo encuentra solo.
- Para volver a ser el servidor en el de antes: `start my` → **v** (o
  `librito recuperar`). Para traerlo de vuelta con lo nuevo: «Traer» desde ahí.
- Si algo se corta a medio camino, no pasa nada: a los 15 minutos (o al
  cancelar) el de siempre sigue normal.

### Arranque a prueba de todo (1.14.0)

- `start my`/`librito` comprueban que el proceso **de verdad** sea el servidor
  (Android recicla los números de proceso); si el número se perdió pero el
  servidor sigue vivo, lo adoptan.
- Se prende con `setsid`: **abrir o cerrar otra terminal no lo apaga**.
- Android 12+ cierra procesos «de fondo» de Termux: `start my` → **s** explica
  cómo evitarlo (sin restricciones de batería, wake lock, «Desactivar
  restricciones de procesos secundarios» en Android 14+, o el comando adb en 12 y 13).

### El teléfono servidor, aprovechado y cuidado (1.14.0)

- **Lo que sabe del teléfono**: modelo, Android, núcleos, carga, RAM, espacio,
  la **pila** (si está cargando) y la **temperatura** (de `/sys` o, si Android no
  deja, de `termux-battery-status`: app Termux:API + `pkg install termux-api`).
  En la nube: el tablero «Tu teléfono servidor» con cuatro anillos, al día cada
  20 s. En Termux: la tarjeta de `start my`. API: `GET /api/admin/aparato`.
- **El ritmo**: con poca pila y sin cargador (**ahorro**) o caliente (**fresco**,
  ≥ 44 °C), el vigía del túnel pregunta tres veces menos, la limpieza grande
  espera y se comprime más ligero. Vuelve a **normal** solo.
- **SQLite afinado**: WAL con sincronía normal (mucho menos escritura en la
  memoria flash), tablas temporales en RAM, caché según la RAM del teléfono
  (8–48 MB), `mmap` y `PRAGMA optimize` cada hora.
- Más cola para las ráfagas del editor (64 conexiones esperando).

### Dibujar Juntos (1.14.0)

Hojas de cada pareja (hasta 30) con trazos en tiempo real (`GET …/trazos?espera=25`
se despierta en cuanto el otro dibuja). Pinceles: lápiz, pluma, marcador,
acuarela, neón, brillitos, corazones, borrador. Rutas en la tabla de abajo.

## Cuentas y autenticación

- **Registro** (Panel → Ajustes): «Abierto: cualquiera crea su cuenta y entra
  al momento» (de fábrica), «Cualquiera se registra y tú lo apruebas», «Sólo
  con código de invitación» (cada código sirve una vez y vence) o «Cerrado».
  Tope de cuentas: 1000 (se cambia).
- **Cuotas por usuario** (Panel → Ajustes, «Para todos los usuarios»): espacio
  (300 MB), publicaciones (30) y copias por proyecto (15). Lo que pase el
  espacio se rechaza con un aviso claro; al administrador no se le aplica.
- **Roles**: *administrador* (todo el panel) y *editor* (publica, ve y quita
  lo suyo, guarda sus proyectos). Nadie más que el servidor toca GitHub.
- **Contraseñas**: se guardan como huella **scrypt** con sal (nunca en
  claro). ¿Alguien la olvidó? Panel → Usuarios → «Contraseña temporal».
- **Sesiones**: el editor recibe una sesión al azar (32 bytes) que manda como
  `Authorization: Bearer …`; el servidor guarda sólo su huella SHA-256. El
  panel usa una galleta `HttpOnly; SameSite=Strict` (el JavaScript no la ve).
  Duran 30 días con «recordarme» (12 h sin él). Mi cuenta → «Sesiones
  abiertas» para cerrarlas; cambiar la contraseña cierra las demás.
- **Fuerza bruta**: 5 contraseñas mal seguidas frenan esa cuenta (y 10, esa
  IP) unos minutos, cada vez más tiempo. Los registros seguidos también se frenan.

## Rutas

**En el repositorio (GitHub):**

| Ruta | Qué es |
| --- | --- |
| `publicaciones/<nombre>/` | cada librito publicado (index.html, scripts/, pages/, assets/, visor) |
| `publicaciones/lista.json` | la lista de lo publicado (título, páginas, fecha, enlace) |
| `servidor.json` | la dirección actual del servidor (sólo si «Anunciar» está encendido) |
| `servidor/` | este código (sin ningún secreto); el instalador lo baja de aquí |

**En el teléfono:**

```
~/librito-servidor/      el código (se puede borrar y volver a bajar)
~/librito-datos/         TUS DATOS (0700)
  config.json            ajustes (sin secretos)
  llave.bin              llave maestra (0600)
  secretos.bin           token de GitHub, cifrado (0600)
  librito.db             cuentas, parejas, sesiones, publicaciones, proyectos, detallitos, mensajitos, actividad
  publicaciones/<n>/     copia de cada publicación (se ve en /p/<n>/)
  nube/archivos/ab/<huella>         cada foto, canción o video (una sola vez, por su huella)
  nube/libritos/<cuenta>/<clave>.json   cada librito de cada cuenta
  nube/copias/<cuenta>/<clave>/<id>.json  sus copias (al guardar a mano)
  proyectos/<usuario>/<proyecto>/   las copias de antes (.zip), si había
  detallitos/<id>/       cada detallito (ver/ con su portadita y paquete.zip)
  fotos/<cuenta>.jpg     la foto de perfil de cada cuenta (o .png / .webp)
  servidor.log           lo que va pasando (sin secretos)
  estado.json            pid, puerto y dirección del servidor PRENDIDO (lo lee «librito»; se borra al apagarlo)
```

**En el servidor (HTTP):** `/` panel · `/p/<nombre>/` copia local de una
publicación (aislada) · `/d/<id>/` un detallito (aislado, dirección larga al
azar) · `/api/…`:

| Método y ruta | Quién | Para qué |
| --- | --- | --- |
| `GET /api/info` | todos | nombre, si hay GitHub, modo de registro, si falta el administrador |
| `GET /api/salud` | todos | «aquí estoy» (lo usa el vigía del túnel) |
| `POST /api/instalar` | con el código | primer administrador |
| `POST /api/registro` · `POST /api/entrar` · `POST /api/salir` | todos | cuentas |
| `GET /api/yo` · `POST /api/yo/contrasena` · `GET/DELETE /api/yo/sesiones` | sesión | tu cuenta |
| `GET/POST /api/publicaciones` · `DELETE /api/publicaciones/<n>` · `POST /api/publicaciones/<n>/subir` | sesión | publicar (el .zip va en el cuerpo, `?titulo=&nombre=&reemplazar=`) |
| `GET /api/trabajos/<id>` | sesión | cómo va una publicación |
| `GET /api/nube` | sesión | tus libritos en la nube, tu espacio y tu cuota |
| `POST /api/nube/faltan` | sesión | de estas huellas, cuáles faltan (lo que ya está no se vuelve a subir) |
| `PUT /api/nube/archivos/<huella>?desde=&tam=&tipo=` · `GET …/<huella>` | sesión | subir un archivo por partes (se sigue donde quedó) y bajarlo |
| `PUT/GET/DELETE /api/nube/libritos/<clave>` (`?base=&forzar=1&aparato=`) | sesión | guardar, abrir y borrar un librito (avisa si cambió en otro aparato) |
| `POST /api/nube/libritos/<clave>/copia` · `GET /api/nube/copias` · `GET/DELETE /api/nube/copias/<id>` | sesión | copias al guardar a mano |
| `GET/PUT /api/yo/ajustes` | sesión | tus ajustes del editor |
| `GET/PUT /api/yo/perfil` | sesión | tu nombre, cumpleaños, «novios desde» (se le pone igual a tu amorcito) y tu género (`genero`: "", "Hombre", "Mujer", "LGBTQ+" u "Otro"; desde 1.11.0) |
| `GET /api/mesecitos` · `PUT/DELETE /api/mesecitos/<mes>` · `POST /api/mesecitos/<mes>/visto` | sesión (con pareja) | los meses cumplidos y su página especial (una por mes; sólo quien la hizo la edita o borra; desde 1.13.0) |
| `GET/POST /api/cositas` · `PUT/DELETE /api/cositas/<id>` · `PUT /api/cositas/ajustes` | sesión (con pareja) | tus contadores y registros; lo que tu amorcito compartió; compartir un registro o un contador |
| `GET/PUT/DELETE /api/ubicacion` · `POST /api/lugares` · `PUT/DELETE /api/lugares/<id>` | sesión (con pareja) | dónde está cada quien (sólo si la comparte), desde cuándo, sus lugares y lo último que pasó en ellos |
| `PUT/GET/DELETE /api/yo/foto` · `GET /api/amor/foto` | sesión | tu foto de perfil (jpg, png o webp, hasta 2 MB) y la de tu amorcito |
| `GET/POST /api/proyectos` · `GET/DELETE /api/proyectos/<id>` | sesión | copias de antes (.zip) |
| `GET/DELETE /api/amor` · `POST /api/amor/vincular` · `POST /api/amor/codigo` | sesión | tu código y el vínculo con tu amorcito |
| `GET /api/latido` | sesión | «sigo aquí» + cuántos detallitos nuevos, cuántas reacciones nuevas a los tuyos y cuántos mensajitos sin leer (`chat`) |
| `GET/POST /api/detallitos` · `POST …/<id>/visto` · `GET …/<id>/paquete` · `DELETE …/<id>` | sesión | mandar, ver, guardar y quitar detallitos |
| `PUT /api/detallitos/<id>/reaccion` (`{"reaccion":"te-amo"}`; vacío la quita) | quien lo recibió | reaccionar: te-amo, me-encanto, llore, abrazo, beso o risa |
| `POST /api/detallitos/reacciones/vistas` | sesión | ya viste las reacciones a lo que mandaste |
| `PUT /api/detallitos/<id>/portadita` (jpg, png o webp, hasta 600 KB) | quien lo mandó (o quien lo recibió, si todavía no tiene) | su miniatura; se ve en `/d/<id>/portadita.<ext>` |
| `GET /api/chat?n=40` · `?antes=<id>` · `?despues=<id>&desde=<ahora>&espera=22` | pareja | los mensajitos de los dos (y sus dibujos): los últimos, los de antes (para ir subiendo) o los nuevos más los que cambiaron (reacción, sticker, borrado, dibujos). Con `espera` (hasta 25 s) se queda esperando y contesta en cuanto cambia algo: **tiempo real** |
| `POST /api/chat` (`{"texto":"…","gif":{"u":"https://media.giphy.com/…","w":200,"h":150,"s":1}}` · `{"espacio":360}`) | pareja | mandar un mensajito: texto (hasta 2000), un GIF o un sticker solito (`s`) de GIPHY, o los dos; máximo 25 cada 10 s. Con `espacio`, un hueco en blanco para dibujar (si lo último ya es un hueco, se agranda) |
| `PUT /api/chat/ajustes` (`{"visto":false}`) | sesión | privacidad: si tu amorcito ve cuándo leíste lo suyo |
| `PUT` · `DELETE /api/chat/<id>/sticker/<sid>` | quien lo pegó | mover (x, y, giro, tamaño) o quitar un sticker |
| `POST /api/chat/trazos` (`{"ancla":<id>,"c":"#ff5f9e","a":6,"p":[[x,y],…]}`) · `POST /api/chat/trazos/<id>` (`{"p":[…],"fin":true}`) | pareja · quien dibuja | dibujar en el chat: x de 0 a 10000 a lo ancho, y en px desde su mensajito; se manda de a poquito mientras dibujas (hasta 1500 puntos por trazo) |
| `GET /api/dibujo` · `POST /api/dibujo` (`{"nombre":…,"fondo":"papel"\|"cuadros"\|"rayas"\|"rosa"\|"noche"}`) · `PUT`/`DELETE /api/dibujo/<id>` | pareja | Dibujar Juntos: sus hojas (la primera se crea sola; hasta 30), una nueva, cambiarle nombre o fondo, borrarla (para los dos) |
| `GET /api/dibujo/<id>/trazos?desde=<ahora>&espera=25` | pareja | los trazos de la hoja (o los que cambiaron); con `espera` contesta en cuanto el otro dibuja: **tiempo real** |
| `POST /api/dibujo/<id>/trazos` (`{"pincel":"lapiz","c":"#d8397a","a":6,"p":[[x,y,presión],…]}`) · `POST …/trazos/<tid>` (`{"p":[…],"fin":true}`) · `DELETE …/trazos/<tid>` · `DELETE …/trazos[?solo=mio]` | pareja · quien dibuja | dibujar a pedacitos (x e y de 0 a 10000; hasta 4000 puntos), deshacer lo tuyo, limpiar lo tuyo o la hoja |
| `POST /api/dueno/traspaso` · `POST /api/dueno/relevo` · `POST /api/dueno/cancelar` (`{"usuario":"YonathanPG","contrasena":…}`) | la cuenta del dueño, con su contraseña | pasar el servidor a otro teléfono: manda todo (tar) dejando éste en sólo lectura · éste queda relevado y se apaga · cancelar |
| `GET /api/admin/aparato` | admin | el teléfono servidor: pila, cargando, temperatura, ritmo, núcleos, carga, RAM, espacio, desde cuándo está prendido, quién está en línea y si hay otro servidor |
| `DELETE /api/chat/trazos/<id>` · `DELETE /api/chat/trazos` | quien lo dibujó | deshacer un trazo · borrar todos tus dibujos |
| `GET /api/push/clave` | todos | la llave pública VAPID del servidor (para suscribirse a las notificaciones) |
| `POST /api/push/suscribir` (`{"endpoint":…,"keys":{"p256dh":…,"auth":…}}`) · `DELETE /api/push/suscribir` | sesión | prender o apagar las notificaciones push en un aparato (sólo servicios de avisos de Google, Apple, Mozilla y Microsoft; hasta 10 aparatos por cuenta) |
| `POST /api/push/probar` | sesión | una notificación de prueba a tus aparatos |
| `PUT /api/chat/<id>/reaccion` (`{"reaccion":"te-amo"}`; vacío la quita) | quien lo recibió | reaccionar a un mensajito |
| `POST /api/chat/<id>/sticker` (`{"u":"https://media.giphy.com/…","x":0.8,"y":0.2,"r":-8,"s":1}`; con `"l":1`, libre: `y` en px) | pareja | pegar un sticker de GIPHY encima de un mensajito o, libre, donde lo soltaste en el chat (hasta 12 por mensajito) |
| `DELETE /api/chat/<id>` · `POST /api/chat/vistos` | quien lo mandó · sesión | borrar tu mensajito (para los dos; desde 1.10.0 queda como `{"borrado":true}` en la lista y se le avisa al otro) · ya leíste lo que te mandó |
| `PUT /api/chat/<id>` (`{"texto":"…"}`) | quien lo mandó | editar el texto de tu mensajito (no audios ni espacios); queda con `editado` |
| `POST /api/chat/media?tipo=sticker` · `?tipo=audio` (el archivo tal cual) | pareja | subir un sticker tuyo (PNG, JPG o WebP, hasta 800 KB) o un mensaje de voz (WAV, hasta 26 MB desde 1.10.0); contesta `{"u":"/m/<huella>.<ext>"}`. Se manda con `POST /api/chat` (`{"gif":{"u":"/m/…","s":1}}` o `{"audio":{"u":"/m/….wav","dur":3.2,"ondas":[0…31 ×48]}}`) |
| `GET /m/<huella>.<ext>` | todos (la dirección es larga y al azar) | el archivo (con rangos, para adelantar audios) |
| `GET /api/chat/coleccion` · `POST /api/chat/coleccion` (`{"tipo":"sticker"\|"gif","u":…,"w":…,"h":…,"favorito":true}`) | sesión | tus stickers y tus GIFs favoritos (favoritos arriba, luego lo que más usas) · guardar uno (hasta 400 de cada uno) |
| `PUT /api/chat/coleccion/<id>` (`{"favorito":true}`) · `DELETE /api/chat/coleccion/<id>` | sesión | marcar o quitar de favoritos · quitarlo de tu colección |
| `POST /api/admin/usuarios/borrar-todas` (`{"confirmar":"BORRAR"}`) | admin | borra todas las cuentas que no son de administrador |
| `/api/admin/…` (resumen, ajustes, github, usuarios, invitaciones, actividad, túnel) | admin | el panel |

## Seguridad: qué protege y qué no

**Protege:**
- El token de GitHub **nunca** sale del servidor: no está en el código del
  editor, ni en el repositorio, ni en ninguna respuesta (el panel sólo muestra
  `…abcd`). Está cifrado en reposo (flujo HMAC-SHA256 + sello) con una llave
  aparte, y los archivos son sólo de tu usuario.
- Sólo **tu GitHub Pages** (y localhost, para probar) puede usar la API desde
  un navegador (CORS); cualquier otro origen recibe 403. Puedes agregar más en
  Panel → Ajustes.
- Los .zip se revisan antes de abrirse: nada de rutas con `..`, absolutas o
  enlaces simbólicos; tope de tamaño y de archivos; nunca se publica
  `project.json` ni `EditorData/`.
- Lo publicado que se ve **en el servidor** (`/p/…` y los detallitos `/d/…`)
  corre aislado (CSP `sandbox`, origen opaco): aunque traiga JavaScript, no
  puede usar la sesión de nadie. Los detallitos sólo se dejan mostrar dentro
  del editor (tu GitHub Pages) y su dirección es larga y al azar.
- Cada quien ve y borra **sólo lo suyo** (publicaciones, copias, detallitos);
  un detallito lo pueden ver sólo los dos. Probar códigos de pareja al azar
  se frena tras unos intentos.
- El panel tiene CSP estricta (sin scripts de fuera), no se deja enmarcar y
  pide la cabecera `X-Librito` en cada cambio (además de `SameSite=Strict`).

**No puede proteger:**
- A quien tenga **el teléfono entero** desbloqueado (podría leer llave y
  secretos juntos). Ponle bloqueo de pantalla.
- Las publicaciones son públicas para quien tenga el enlace (llevan `noindex`,
  pero el repositorio, si es público, se puede ver en github.com).
- Con «Anunciar» encendido, la dirección del servidor queda en `servidor.json`
  (pública). El panel sigue pidiendo usuario y contraseña; si prefieres que no
  se vea, apágalo y empareja a mano.

## Mantenerlo prendido

- `librito iniciar` toma un *wake lock* de Termux (la notificación «Termux:
  wake lock held»): así Android no lo duerme.
- **Prenderse solo** al encender el teléfono: instala **Termux:Boot** (F-Droid),
  ábrela una vez y corre `librito arranque`.
- Déjalo conectado al cargador y en wifi.

## Comandos

Lo más fácil: **`start my`** (con menú). Lo de siempre sigue igual:

```
librito                  lo deja listo y prendido (la primera vez, te guía)
librito instalar         el asistente otra vez (paquetes, administrador, GitHub)
librito iniciar | detener | reiniciar | estado
librito panel            abre el panel en el navegador del teléfono
librito direccion        la dirección https para el editor
librito registro         ver lo que pasa (Ctrl+C sale)
librito admin [usuario]  crear o reiniciar un administrador
librito borrar-cuentas   borra todas las cuentas de prueba (menos administradores; pide BORRAR)
librito github           guardar el token (cifrado) desde la terminal
librito llave-nueva      cambiar la llave maestra (vuelve a cifrar)
librito respaldar        copia de ~/librito-datos (SIN llave ni token)
librito arranque         prenderse solo (Termux:Boot)
librito actualizar       bajar la versión nueva (tus datos no se tocan; instala lo que falte, como git)
librito primer-plano     correrlo aquí mismo para ver errores
librito dueño            la contraseña de la cuenta del dueño (YonathanPG)
librito traer            trae el servidor de siempre (con todo) a ESTE teléfono
librito recuperar        volver a ser el servidor aquí (si se había pasado a otro)
librito aparato          pila, temperatura, RAM y espacio del teléfono (JSON)
```

## Si algo falla

| Pasa esto | Haz esto |
| --- | --- |
| El editor dice «No hay conexión con M.YNTHN» | `librito estado`: ¿prendido? ¿hay dirección? ¿«Anunciar» encendido? Si cambió, el editor la encuentra solo en un minuto. |
| «Desde internet el navegador no deja usar http://…» | Usa la dirección **https** del túnel, no la de la wifi. |
| «Falta cloudflared» | `pkg install cloudflared` y `librito reiniciar`. |
| «Sorry, your input was too large to process» al publicar | Ya lo resuelve el servidor: los archivos grandes van con `git push`. Corre `librito actualizar` (instala `git`) y vuelve a publicar. |
| Mi librito no aparece en el otro aparato | ¿Entraste con la **misma cuenta**? Espera unos segundos (sube solo) o toca el indicador de guardado → «Subir ahora». El puntito dice cómo va. |
| «Tu nube está llena» | Borra libritos o copias viejas que ya no uses, o sube el espacio por cuenta en Panel → Ajustes. |
| «El código de instalación no es ese» | Ya no debería pasar (el código no cambia). Más fácil: abre el panel en el mismo teléfono (no pide código) o `librito admin`. |
| «El puerto 8787 ya está ocupado» | Ya estaba prendido: `librito estado`. Si dice apagado, `librito detener` y `librito iniciar`. |
| «Túnel: no logró conectar» en `librito registro` | Reintenta solo (y cambia a http2). Revisa que el teléfono tenga internet; dice lo que respondió cloudflared. |
| «Este origen no puede usar el servidor» | Abriste el editor desde otra dirección: agrégala en Panel → Ajustes → Orígenes. |
| «Al token de GitHub le falta permiso» | Revisa los permisos del paso 2 (Contents y Pages en *Read and write*). |
| Lo publicado da 404 | Panel → GitHub → GitHub Pages: ¿encendido y en la misma rama donde publica el servidor? |
| Se apaga solo | Batería de Termux en «Sin restricciones» y `librito iniciar` (toma el wake lock). |
| Olvidé la contraseña del administrador | En Termux: `librito admin tu-usuario` (pide una nueva). |
| Perdí `llave.bin` | Los secretos ya no se pueden leer: `librito github` para poner el token otra vez. |

Probado en este repositorio con Python 3.11 y un GitHub simulado: el asistente
de instalación de punta a punta en una terminal de verdad (también con
`curl … | bash`), el código de instalación que no cambia, crear el
administrador sin código en el mismo teléfono y con código desde «otro
aparato», `librito github` con el servidor prendido (sin reiniciar), el túnel
con un cloudflared de mentira (conecta, anuncia, el vigía lo reabre, cambia a
http2), cuentas, registro abierto, cuotas, publicar, copias, parejas,
detallitos, CORS, .zip con `../`, conexiones que quedan limpias tras un error y
que el token no salga en ninguna respuesta; la nube (subidas por partes que
siguen donde quedaron, huella dañada, dedupe entre cuentas, conflicto, forzar,
copias, ajustes, cuota, limpieza) y un video de 2.5 MB publicado por `git push`
con una API que rechaza más de 1 MB; y el editor en Chromium con **dos
aparatos y la misma cuenta** (uno crea con foto y un video de 20 MB, el otro
lo abre entero, lo cambia, el primero se pone al día solo, conflicto con «Las
dos», ajustes que viajan, publicar con la foto puesta por el servidor, borrar
de todos lados); el perfil (fotos que no son fotos o muy grandes, fechas que
no existen, «novios desde» que queda para los dos, la foto de tu amorcito sólo
si están vinculados) y borrar las cuentas de prueba desde el panel y desde
`librito borrar-cuentas`. **No** se probó todavía en un teléfono real con
Termux, ni con el túnel de Cloudflare ni con GitHub de verdad.
