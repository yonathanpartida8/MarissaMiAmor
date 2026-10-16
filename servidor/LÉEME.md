# Servidor del librito (Termux)

Tu propio servidor de **publicación y almacenamiento** en un teléfono viejo.
El editor le manda el librito, y el servidor lo publica en tu GitHub Pages
con **tu** token de GitHub, que vive cifrado en el teléfono. En el editor no
hay ninguna llave: ahí cada quien entra con **su usuario y contraseña del
servidor**.

```
  Editor (en tu GitHub Pages, o donde lo abras)
     │  usuario + contraseña  →  sesión (Bearer)
     │  el librito en .zip (sólo para ver)
     ▼
  https://xxxx.trycloudflare.com  (túnel de Cloudflare, https gratis)
     ▼
  Teléfono viejo · Termux · servidor.py  ── panel web para administrar
     │  token de GitHub (cifrado, nunca sale de aquí)
     ▼
  GitHub → tu repositorio → publicaciones/<nombre>/ → GitHub Pages
```

Lo publicado queda en `https://<usuario>.github.io/<repositorio>/publicaciones/<nombre>/`,
se ve **a pantalla completa** como una app y **no se puede editar** (no lleva
el proyecto). Si el nombre ya existe, se usa `<nombre>-2`, `-3`… Actualizar una
que ya estaba es aparte: botón «Actualizar con este librito».

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
curl -fsSL https://raw.githubusercontent.com/yonathanpartida8/MarissaMiAmor/refs/heads/claude/interactive-love-book-redesign-5p93fv/servidor/instalar.sh | bash
```

Hace esto, solo:
- instala `python` y `cloudflared` (con `pkg`);
- baja **sólo** la carpeta `servidor/` a `~/librito-servidor` (no el repositorio entero);
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
(`claude/interactive-love-book-redesign-5p93fv` mientras no la juntes con
`main`) → **Encender GitHub Pages**. Si tu token no tiene «Administration»,
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

### 7 · Emparejar el editor

Cualquiera de estas tres:

1. **Panel → Inicio → «Abrir el editor emparejado»**: abre el editor con la
   dirección ya puesta (`…/EditorDev/#servidor=https://…`).
2. **Solo**: abre el editor → **Páginas publicadas → Tu servidor**. Si el
   servidor la anunció, dice «Encontré tu servidor» → «Conectar».
3. **A mano**: copia la dirección (`librito direccion` o el panel) y pégala en
   Páginas publicadas → Tu servidor → «Conectar».

Luego **Entrar** con tu usuario y contraseña del servidor (o «Crear cuenta»
para alguien más: queda esperando tu aprobación). Marca «Recordarme» en tus
aparatos; en uno prestado, no.

### 8 · Publicar

Editor → **Páginas publicadas → Tu servidor**:

- **Publicar en mi GitHub**: arma el librito (sólo para ver, con el visor a
  pantalla completa), lo sube al servidor con su barrita de avance y el
  servidor lo deja en `publicaciones/<nombre>/`. Te da el enlace, «Ver a
  pantalla completa», copiar y compartir.
- **Mis publicaciones**: ver, copiar, compartir, **Actualizar con este
  librito** (mismo enlace), **Subir a GitHub** (si se publicó antes de
  conectar GitHub) y **Quitar** (deja de verse en internet).
- **Copias de mis proyectos**: «Guardar este proyecto en el servidor» guarda
  el .zip **completo** (con todo para volver a editarlo; se quedan las 8 más
  nuevas de cada nombre). «Abrir como borrador nuevo» lo trae de vuelta al
  editor, en cualquier aparato.

Mientras el servidor no tenga GitHub conectado, lo publicado se guarda en el
servidor y se ve en `https://<tu-túnel>/p/<nombre>/`.

---

## Cuentas y autenticación

- **Registro** (Panel → Usuarios): «Cualquiera se registra y tú lo apruebas»
  (de fábrica), «Sólo con código de invitación» (cada código sirve una vez y
  vence) o «Cerrado».
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
| `servidor/` | este código (sin ningún secreto) |
| `publicar/` | para publicar sin token (subiendo un .zip desde la web de GitHub) |

**En el teléfono:**

```
~/librito-servidor/      el código (se puede borrar y volver a bajar)
~/librito-datos/         TUS DATOS (0700)
  config.json            ajustes (sin secretos)
  llave.bin              llave maestra (0600)
  secretos.bin           token de GitHub, cifrado (0600)
  librito.db             cuentas, sesiones, publicaciones, proyectos, actividad
  publicaciones/<n>/     copia de cada publicación (se ve en /p/<n>/)
  proyectos/<id>/        copias completas de proyectos
  servidor.log           lo que va pasando (sin secretos)
```

**En el servidor (HTTP):** `/` panel · `/p/<nombre>/` copia local de una
publicación (aislada) · `/api/…`:

| Método y ruta | Quién | Para qué |
| --- | --- | --- |
| `GET /api/info` | todos | nombre, si hay GitHub, modo de registro |
| `POST /api/instalar` | con el código | primer administrador |
| `POST /api/registro` · `POST /api/entrar` · `POST /api/salir` | todos | cuentas |
| `GET /api/yo` · `POST /api/yo/contrasena` · `GET/DELETE /api/yo/sesiones` | sesión | tu cuenta |
| `GET/POST /api/publicaciones` · `DELETE /api/publicaciones/<n>` · `POST /api/publicaciones/<n>/subir` | sesión | publicar (el .zip va en el cuerpo, `?titulo=&nombre=&reemplazar=`) |
| `GET /api/trabajos/<id>` | sesión | cómo va una publicación |
| `GET/POST /api/proyectos` · `GET/DELETE /api/proyectos/<id>` | sesión | copias de proyectos |
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
- Lo publicado que se ve **en el servidor** (`/p/…`) corre aislado (CSP
  `sandbox`, origen opaco): aunque traiga JavaScript, no puede usar tu sesión
  del panel.
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
| El editor dice «No hay conexión con tu servidor» | `librito estado`: ¿prendido? ¿hay dirección? Si cambió, el editor la encuentra solo (o pégala). |
| «Desde internet el navegador no deja usar http://…» | Usa la dirección **https** del túnel, no la de la wifi. |
| «Falta cloudflared» | `pkg install cloudflared` y `librito reiniciar`. |
| «Este origen no puede usar el servidor» | Abriste el editor desde otra dirección: agrégala en Panel → Ajustes → Orígenes. |
| «Al token de GitHub le falta permiso» | Revisa los permisos del paso 3 (Contents y Pages en *Read and write*). |
| Lo publicado da 404 | Panel → GitHub → GitHub Pages: ¿encendido y en la misma rama donde publica el servidor? |
| Se apaga solo | Batería de Termux en «Sin restricciones» y `librito iniciar` (toma el wake lock). |
| Olvidé la contraseña del administrador | En Termux: `librito admin tu-usuario` (pide una nueva). |
| Perdí `llave.bin` | Los secretos ya no se pueden leer: `librito github` para poner el token otra vez. |

Probado en este repositorio con Python 3.11 y un GitHub simulado (cuentas,
publicar, nombres repetidos, actualizar, quitar, proyectos, CORS, .zip con
`../`, freno a la fuerza bruta y que el token no salga en ninguna respuesta).
**No** se probó todavía en un teléfono real con Termux ni con el túnel de
Cloudflare de verdad.
