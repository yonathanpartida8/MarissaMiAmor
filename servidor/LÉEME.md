# M.YNTHN — el servidor del librito (Termux)

**M.YNTHN** es el servidor **público** del editor de libritos: vive en tu
teléfono viejo con Termux y atiende a **todas** las personas que usan el
editor. Cada quien sólo crea su **usuario y contraseña** (al momento, sin
esperar aprobación) y ya puede publicar, guardar sus proyectos y mandarle
**Detallitos** a su amorcito. El token de GitHub es **uno solo, el tuyo**, y
vive cifrado en el teléfono: nadie lo ve, nadie lo escribe en el editor.

```
  Editor (en tu GitHub Pages) — cualquiera, con su usuario y contraseña
     │  sesión (Bearer)
     │  páginas en .zip · copias de proyectos · detallitos
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
- **Copias de sus proyectos**: cada vez que guarda **a mano** (Guardar o
  Ctrl+S) se guarda una copia completa en **su** carpeta
  (`proyectos/<usuario>/<proyecto>/`), con sus fotos, música y todo. Se
  quedan las más nuevas de cada proyecto (15, se cambia en el panel).
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

### 2 · Instalar el servidor (una línea)

Pega esto en Termux y Enter:

```sh
curl -fsSL https://yonathanpartida8.github.io/MarissaMiAmor/servidor/instalar.sh | bash
```

Hace esto, solo:
- instala `python` y `cloudflared` (con `pkg`);
- baja **sólo** la carpeta `servidor/` de tu GitHub Pages a `~/librito-servidor` (no el repositorio entero);
- crea la carpeta de datos `~/librito-datos` (sólo tu usuario puede entrar);
- genera la **llave maestra** (`llave.bin`, 32 bytes al azar) que cifra los secretos;
- deja listo el comando **`librito`**;
- te muestra el **código de instalación** (8 letras, como `K7P2-9QX4`).

> Si ya clonaste el repositorio, también vale: `bash servidor/librito.sh instalar`.

### 3 · Las claves que hacen falta

| Clave | Quién la genera | Dónde vive |
| --- | --- | --- |
| Llave maestra (cifra el token) | el servidor, solo, al instalar | `~/librito-datos/llave.bin` (0600) |
| Código de instalación | el servidor, la primera vez | en la terminal y en `codigo-instalacion.txt` (se borra al usarlo) |
| Token de GitHub | tú, en GitHub (abajo) | cifrado en `~/librito-datos/secretos.bin` |
| Tu contraseña de administrador | tú, en el panel | sólo su huella (scrypt) en `librito.db` |

**Sacar el token de GitHub (2 minutos):**

1. GitHub → foto de perfil → **Settings → Developer settings → Personal access
   tokens → Fine-grained tokens → Generate new token**.
2. Nombre: `servidor del librito`. Expiración: la que quieras (al caducar,
   pones otro en el panel).
3. **Repository access → Only select repositories →** `MarissaMiAmor`.
4. **Permissions → Repository permissions:**
   - **Contents: Read and write** (para publicar);
   - **Pages: Read and write** (para ver y pedir que publique);
   - **Administration: Read and write** (sólo si quieres que el servidor
     encienda GitHub Pages por ti; si no, déjalo).
   - Metadata queda en *Read-only* solo.
5. **Generate token** y cópialo (empieza con `github_pat_`). No lo pegues en
   ningún otro lado: sólo en el servidor (paso 5).

### 4 · Prenderlo y crear tu administrador

```sh
librito iniciar
```

Abre en el navegador **del mismo teléfono**: `http://127.0.0.1:8787`
(o desde tu compu en la misma wifi: `http://IP-del-teléfono:8787`, la muestra `librito estado`).

En el panel: escribe el **código de instalación**, tu **usuario** y una
**contraseña** (mínimo 8; mejor una frase larga) → «Crear administrador».
Desde ahí ya entras con tu usuario y contraseña. (También se puede desde la
terminal: `librito admin tu-usuario`.)

### 5 · Conectar GitHub

Dos maneras (la segunda es la más segura: el token ni pasa por el navegador):

- **Panel → GitHub:** repositorio `yonathanpartida8/MarissaMiAmor`, pega el
  token, la rama se elige sola (la de GitHub Pages o la más nueva) →
  «Guardar y probar».
- **Terminal:** `librito github` (pregunta repositorio, token —no se ve al
  escribirlo— y rama).

Luego, en **Panel → GitHub → GitHub Pages**: si dice «Apagado», elige la rama
donde está el librito más nuevo → **Encender GitHub Pages**. Si tu token no tiene «Administration»,
el panel te lleva a los ajustes de GitHub para hacerlo a mano
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

**Detallitos** (Exportar → Enviar Detallito, o desde el menú principal):

- **Vincular a tu Amorcito**: muestra tu código (copiar / compartir / otro
  código) y un lugar para **pegar el de tu amorcito**. Con que uno de los dos
  lo pegue basta. Cada cuenta se vincula con una sola; «Desvincular» lo deshace.
- **Mandar esta página**: título y un mensajito; la página abierta se envuelve
  (con su proyecto) y le llega a tu amorcito.
- **De mi amorcito / Mis enviados**: la colección, como notitas. Al abrir uno
  se ve en una ventanita (o a pantalla completa), se puede **guardar en tus
  borradores** para editarlo, o quitarlo de tu colección (al otro no se le borra).
- El editor pregunta cada 45 s si llegó algo: globito en Exportar / Más y un
  aviso «Verlo». La pastilla de arriba dice si tu amorcito está **en línea**.

Mientras el servidor no tenga GitHub conectado, lo publicado se guarda en el
servidor y se ve en `https://<tu-túnel>/p/<nombre>/`.

---

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
  librito.db             cuentas, parejas, sesiones, publicaciones, proyectos, detallitos, actividad
  publicaciones/<n>/     copia de cada publicación (se ve en /p/<n>/)
  proyectos/<usuario>/<proyecto>/   las copias de cada proyecto de cada usuario
  detallitos/<id>/       cada detallito (ver/ y paquete.zip)
  servidor.log           lo que va pasando (sin secretos)
```

**En el servidor (HTTP):** `/` panel · `/p/<nombre>/` copia local de una
publicación (aislada) · `/d/<id>/` un detallito (aislado, dirección larga al
azar) · `/api/…`:

| Método y ruta | Quién | Para qué |
| --- | --- | --- |
| `GET /api/info` | todos | nombre, si hay GitHub, modo de registro |
| `POST /api/instalar` | con el código | primer administrador |
| `POST /api/registro` · `POST /api/entrar` · `POST /api/salir` | todos | cuentas |
| `GET /api/yo` · `POST /api/yo/contrasena` · `GET/DELETE /api/yo/sesiones` | sesión | tu cuenta |
| `GET/POST /api/publicaciones` · `DELETE /api/publicaciones/<n>` · `POST /api/publicaciones/<n>/subir` | sesión | publicar (el .zip va en el cuerpo, `?titulo=&nombre=&reemplazar=`) |
| `GET /api/trabajos/<id>` | sesión | cómo va una publicación |
| `GET/POST /api/proyectos` · `GET/DELETE /api/proyectos/<id>` | sesión | copias de proyectos (`?nombre=&proyecto=`) |
| `GET/DELETE /api/amor` · `POST /api/amor/vincular` · `POST /api/amor/codigo` | sesión | tu código y el vínculo con tu amorcito |
| `GET /api/latido` | sesión | «sigo aquí» + cuántos detallitos nuevos |
| `GET/POST /api/detallitos` · `POST …/<id>/visto` · `GET …/<id>/paquete` · `DELETE …/<id>` | sesión | mandar, ver, guardar y quitar detallitos |
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

```
librito iniciar | detener | reiniciar | estado
librito direccion        la dirección https para el editor
librito registro         ver lo que pasa (Ctrl+C sale)
librito admin [usuario]  crear o reiniciar un administrador
librito github           guardar el token (cifrado) desde la terminal
librito llave-nueva      cambiar la llave maestra (vuelve a cifrar)
librito respaldar        copia de ~/librito-datos (SIN llave ni token)
librito arranque         prenderse solo (Termux:Boot)
librito actualizar       bajar la versión nueva (tus datos no se tocan)
librito primer-plano     correrlo aquí mismo para ver errores
```

## Si algo falla

| Pasa esto | Haz esto |
| --- | --- |
| El editor dice «No hay conexión con M.YNTHN» | `librito estado`: ¿prendido? ¿hay dirección? ¿«Anunciar» encendido? Si cambió, el editor la encuentra solo en un minuto. |
| «Desde internet el navegador no deja usar http://…» | Usa la dirección **https** del túnel, no la de la wifi. |
| «Falta cloudflared» | `pkg install cloudflared` y `librito reiniciar`. |
| «Este origen no puede usar el servidor» | Abriste el editor desde otra dirección: agrégala en Panel → Ajustes → Orígenes. |
| «Al token de GitHub le falta permiso» | Revisa los permisos del paso 3 (Contents y Pages en *Read and write*). |
| Lo publicado da 404 | Panel → GitHub → GitHub Pages: ¿encendido y en la misma rama donde publica el servidor? |
| Se apaga solo | Batería de Termux en «Sin restricciones» y `librito iniciar` (toma el wake lock). |
| Olvidé la contraseña del administrador | En Termux: `librito admin tu-usuario` (pide una nueva). |
| Perdí `llave.bin` | Los secretos ya no se pueden leer: `librito github` para poner el token otra vez. |

Probado en este repositorio con Python 3.11 y un GitHub simulado (cuentas,
registro abierto, cuotas, publicar, nombres repetidos, actualizar, quitar,
copias por carpeta, vincular parejas, mandar/recibir/guardar/quitar
detallitos, CORS, .zip con `../`, freno a la fuerza bruta y que el token no
salga en ninguna respuesta), y el editor en Chromium (teléfono y compu).
**No** se probó todavía en un teléfono real con Termux ni con el túnel de
Cloudflare de verdad.
