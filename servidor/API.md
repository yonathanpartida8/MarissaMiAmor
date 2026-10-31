# API de M.YNTHN (servidor 1.25.0)

Todas las respuestas son JSON. Con sesión: `Authorization: Bearer <token>` (lo da /api/entrar o /api/registro).
Las fechas de «hoy» las manda el aparato (`?hoy=AAAA-MM-DD`) para que cada quien vea su día (México, EE. UU.…).

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| GET | `/api/info` | cualquiera |  |
| GET | `/api/salud` | cualquiera | Para el vigía del túnel (y para ti): ¿contesta este servidor? |
| POST | `/api/instalar` | cualquiera |  |
| POST | `/api/registro` | cualquiera |  |
| POST | `/api/entrar` | cualquiera |  |
| POST | `/api/salir` | cualquiera |  |
| GET | `/api/yo` | cualquiera |  |
| POST | `/api/yo/contrasena` | con sesión |  |
| GET | `/api/yo/sesiones` | con sesión |  |
| DELETE | `/api/yo/sesiones/{…}` | con sesión |  |
| GET | `/api/publicaciones` | con sesión |  |
| POST | `/api/publicaciones` | con sesión |  |
| GET | `/api/publicaciones/disponible` | con sesión | ¿Ese enlace está libre? (para elegir el enlace propio de una página: …/publicaciones/<enlace>/). |
| POST | `/api/publicaciones/{…}/subir` | con sesión | Vuelve a subir a GitHub lo que ya está guardado aquí (lo publicado antes de conectar GitHub, o un error). |
| DELETE | `/api/publicaciones/{…}` | con sesión |  |
| GET | `/api/trabajos/{…}` | con sesión |  |
| GET | `/api/proyectos` | con sesión |  |
| POST | `/api/proyectos` | con sesión | Una copia nueva del proyecto, en proyectos/<usuario>/<proyecto>/<fecha>.zip (se quedan las más nuevas). |
| GET | `/api/proyectos/{…}` | con sesión |  |
| DELETE | `/api/proyectos/{…}` | con sesión |  |
| GET | `/api/nube` | con sesión |  |
| POST | `/api/nube/faltan` | con sesión | ¿Cuáles de estos archivos te faltan en la nube? (lo que ya está, aunque lo haya subido otra cuenta, no se vuelve a subir). |
| PUT | `/api/nube/archivos/{…}` | con sesión | Una parte de un archivo (?desde=<byte>&tam=<total>) |
| GET | `/api/nube/archivos/{…}` | con sesión |  |
| PUT | `/api/nube/libritos/{…}` | con sesión | El librito como está ahora (?base=<editado que conocías>; ?forzar=1 para pisar otro aparato). |
| GET | `/api/nube/libritos/{…}` | con sesión |  |
| DELETE | `/api/nube/libritos/{…}` | con sesión |  |
| POST | `/api/nube/libritos/{…}/copia` | con sesión | Guardar a mano: una instantánea del librito (no duplica fotos ni videos). |
| GET | `/api/nube/copias` | con sesión |  |
| GET | `/api/nube/copias/{…}` | con sesión |  |
| DELETE | `/api/nube/copias/{…}` | con sesión |  |
| GET | `/api/yo/ajustes` | con sesión |  |
| PUT | `/api/yo/ajustes` | con sesión |  |
| GET | `/api/yo/perfil` | con sesión |  |
| PUT | `/api/yo/perfil` | con sesión |  |
| PUT | `/api/yo/foto` | con sesión | Tu foto de perfil (jpg, png o webp, hasta 2 MB; el editor ya la manda recortada y chiquita). |
| DELETE | `/api/yo/foto` | con sesión |  |
| GET | `/api/yo/foto` | con sesión |  |
| GET | `/api/amor/foto` | con sesión |  |
| GET | `/api/amor` | con sesión |  |
| POST | `/api/amor/vincular` | con sesión |  |
| DELETE | `/api/amor` | con sesión |  |
| POST | `/api/amor/codigo` | con sesión |  |
| GET | `/api/latido` | con sesión | El editor pregunta cada tanto: así se sabe quién está en línea y si llegó un detallito. |
| GET | `/api/detallitos` | con sesión |  |
| POST | `/api/detallitos` | con sesión |  |
| POST | `/api/detallitos/{…}/visto` | con sesión |  |
| PUT | `/api/detallitos/{…}/reaccion` | con sesión | Reaccionar a una página que te mandó tu amorcito (sólo quien la recibió) |
| POST | `/api/detallitos/reacciones/vistas` | con sesión | Quien mandó las páginas ya vio cómo reaccionó su amorcito. |
| GET | `/api/chat` | con sesión | Los mensajitos de los dos: los últimos (n), los de antes de `antes`, o los nuevos después de `despues` más los que cambiaron (reacción, sticker, borrado, dibujos) desde `desde` |
| POST | `/api/chat` | con sesión | Mandar un mensajito: texto, un GIF (o un sticker solito) de GIPHY, o los dos. 1.24: con `responde` (el id de un mensajito de los dos), queda como respuesta; cada mensajito trae `responde` = `{id, mio, texto, tipo}` (una copia chiquita del original, sólo texto) |
| POST | `/api/chat/media` | con sesión | Subir un sticker hecho por ti (png, jpg o webp) o un mensaje de voz (wav). 1.27: `tipo: "animado"` para stickers animados (gif o webp, hasta 3 MB) y las fotos (`tipo: "foto"`, hasta 4 MB) también pueden ser gif. |
| GET | `/api/chat/coleccion` | con sesión | Tus stickers (los que haces) y tus GIFs favoritos: favoritos arriba y luego lo que más usas. |
| POST | `/api/chat/coleccion` | con sesión | Guardar en tu colección: un sticker tuyo (de /m/…) o un GIF de GIPHY |
| PUT | `/api/chat/coleccion/{…}` | con sesión |  |
| DELETE | `/api/chat/coleccion/{…}` | con sesión |  |
| PUT | `/api/chat/{…}` | con sesión | Editar un mensajito tuyo (queda marcado «Editado» para los dos). |
| PUT | `/api/chat/ajustes` | con sesión | Tu privacidad en el chat: si tu amorcito ve cuándo leíste lo suyo («visto»). |
| PUT | `/api/chat/{…}/reaccion` | con sesión | Reaccionar a un mensaje de tu amorcito (vacío = quitarla). |
| POST | `/api/chat/{…}/sticker` | con sesión | Pegar un sticker de GIPHY: encima de un mensajito (x, y del 0 al 1) o, con `l`, LIBRE en el chat (x de 0 a 1 a lo ancho, y en px desde ese mensajito: así cae donde lo soltaste, en cualquier pantalla). |
| PUT | `/api/chat/{…}/sticker/{…}` | con sesión | Mover (o girar y agrandar) un sticker tuyo. |
| DELETE | `/api/chat/{…}/sticker/{…}` | con sesión | Quitar un sticker tuyo. |
| DELETE | `/api/chat/{…}` | con sesión | Borrar un mensaje tuyo (para los dos). |
| POST | `/api/chat/vistos` | con sesión | Ya leíste lo que te mandó. |
| POST | `/api/chat/trazos` | con sesión | Empezar un dibujo en el chat (se ve mientras lo haces): su mensajito ancla (0 = arriba de todo), color, grosor y los primeros puntos. |
| POST | `/api/chat/trazos/{…}` | con sesión | Más puntos de tu trazo (mientras dibujas); con `fin`, se termina. |
| DELETE | `/api/chat/trazos/{…}` | con sesión | Borrar un trazo tuyo (deshacer). |
| DELETE | `/api/chat/trazos` | con sesión | Borrar todos TUS dibujos del chat (los de tu amorcito se quedan). |
| GET | `/api/dibujo` | con sesión |  |
| POST | `/api/dibujo` | con sesión |  |
| PUT | `/api/dibujo/{…}` | con sesión |  |
| DELETE | `/api/dibujo/{…}` | con sesión |  |
| GET | `/api/dibujo/{…}/trazos` | con sesión | Los trazos de una hoja (todos, o los que cambiaron desde `desde`) |
| POST | `/api/dibujo/{…}/trazos` | con sesión |  |
| POST | `/api/dibujo/{…}/trazos/{…}` | con sesión |  |
| DELETE | `/api/dibujo/{…}/trazos/{…}` | con sesión |  |
| DELETE | `/api/dibujo/{…}/trazos` | con sesión | Limpiar la hoja (todo) o sólo lo tuyo (?solo=mio). |
| GET | `/api/mesecitos` | con sesión | Los meses que ya cumplieron y la página especial de cada uno (una por mes, de la pareja). |
| PUT | `/api/mesecitos/{…}` | con sesión | Crear (o editar, si es tuya) la página especial de un mes cumplido |
| DELETE | `/api/mesecitos/{…}` | con sesión |  |
| POST | `/api/mesecitos/{…}/visto` | con sesión |  |
| PUT | `/api/mesecitos/{…}/capsula` | con sesión | Tu cápsula del tiempo para un mes que todavía no llega (una por mes; se puede cambiar mientras siga sellada). |
| DELETE | `/api/mesecitos/{…}/capsula` | con sesión |  |
| PUT | `/api/mesecitos/{…}/momento` | con sesión | Tu momento favorito de un mes (el que va o uno que ya cumplieron): texto, corazones y una foto si quieres. |
| POST | `/api/mesecitos/{…}/plan` | con sesión | Un plan para celebrar su siguiente mes (los dos pueden añadir). |
| PUT | `/api/mesecitos/plan/{…}` | con sesión |  |
| DELETE | `/api/mesecitos/plan/{…}` | con sesión |  |
| POST | `/api/toques` | con sesión | Mandarle un mensajito rápido a tu amorcito: le llega al instante (y suena distinto en su aparato). |
| GET | `/api/toques` | con sesión |  |
| POST | `/api/toques/visto` | con sesión |  |
| GET | `/api/cositas` | con sesión | Tus contadores y registros, y lo que tu amorcito quiso compartir contigo. |
| POST | `/api/cositas` | con sesión | Registrar una cosita (1.21: `n` = cuántos «te amo»/«te extraño» de un jalón, 1–999; `nivel` 1–5 para el enojómetro) |
| DELETE | `/api/cositas/{…}` | con sesión |  |
| PUT | `/api/cositas/{…}` | con sesión |  |
| PUT | `/api/cositas/ajustes` | con sesión | Que tu amorcito vea (o no) un contador tuyo |
| GET | `/api/casita` | con sesión | 1.24/1.25/1.26/1.27 · Nuestra casita: `{v, casa, yo, pareja, pareja_aqui, msgs, voz}` (1.26: `msgs`, los últimos 60 mensajes y cartitas, del más viejo al más nuevo; 1.27: `voz`, las señales de la voz en vivo que te mandó tu amorcito, que se entregan una sola vez). Con `v` (la versión que ya tienes) y `espera` (hasta 25 s), contesta en cuanto algo cambie. |
| PUT | `/api/casita/yo` | con sesión | Tu monito (sólo lo que mandes). 1.25: `c` (cuarto), `x` (0–20000, dentro del cuarto), `y` (lo hondo del piso), `mira` (1 / -1), `accion` (cualquier palabra de 16 letras minúsculas: sentado, dormido, banando…), `mueble` (`id:lugar`), `lleva` (lo que trae en la mano), `ropa` (hasta 16 textos cortos), `dice` (60 letras; guarda `dt`) y `ev` (`{k, t}`: un gesto, abrazo, besito, regalo…; el servidor le pone `at`). |
| POST | `/api/casita/ops` | con sesión | 1.25 · Cambios sueltos de la casa, en orden y de un jalón (hasta 60): `{o:"pon", obj:{id, t, c, x, y, f, e}}`, `{o:"quita", id}`, `{o:"estado", id, e}`, `{o:"cuarto", k, v}` y `{o:"iniciar", casa}` (sólo si la casa aún no tenía cosas). Hasta 300 cosas. Contesta `{ok, n, v}`. |
| PUT | `/api/casita/casa` | con sesión | La casa entera de una vez (la usaba la 1.24; hasta 150 000 letras). |
| POST | `/api/casita/mensaje` | con sesión | 1.26 · Un mensajito (`tipo: "msg"`, hasta 300 letras) o una cartita (`tipo: "carta"`, hasta 1000) para tu amorcito: `{texto, tipo}`. Se guarda como texto (sin caracteres de control), máximo 40 por minuto y 500 por pareja. Avisa por push si es cartita o si tu amorcito no está en la casita. Contesta `{msg: {id, mio, tipo, texto, leido, t}}`. |
| POST | `/api/casita/leer` | con sesión | 1.26 · Marcar leído: `{id}` (una cartita) o `{hasta}` (los mensajitos de tu amorcito hasta ese id). |
| POST | `/api/casita/voz` | con sesión | 1.27 · Señales de la voz en vivo (WebRTC) para tu amorcito: `{tipo, datos}` con `tipo` en `llamar`, `oferta`, `respuesta`, `ice`, `colgar` u `ocupado` y `datos` hasta 16 000 letras (la oferta/respuesta SDP). Duran 60 s y despiertan la escucha de `/api/casita`. El audio nunca pasa por el servidor: va directo entre los dos teléfonos. |
| GET | `/api/ubicacion` | con sesión | Dónde está cada quien (sólo quien la comparte), sus lugares y lo último que pasó en ellos. |
| PUT | `/api/ubicacion` | con sesión | Tu ubicación (sólo llega si tú decidiste compartirla) |
| DELETE | `/api/ubicacion` | con sesión | Dejar de compartir: se borra tu ubicación del servidor (no queda nada). |
| POST | `/api/lugares` | con sesión | Lugar o zona (1.21: `radio` desde 10 m; `zona` = 3–300 puntos `[lat, lng]`; `clase` lugar / aviso / segura; `emoji`) |
| PUT | `/api/lugares/{…}` | con sesión |  |
| DELETE | `/api/lugares/{…}` | con sesión |  |
| GET | `/api/push/clave` | cualquiera | La llave pública VAPID (la pide el editor para suscribirse a los avisos). |
| POST | `/api/push/suscribir` | con sesión | Este aparato quiere avisos (aunque el editor esté cerrado). |
| DELETE | `/api/push/suscribir` | con sesión | Este aparato ya no quiere avisos. |
| POST | `/api/push/probar` | con sesión | Un aviso de prueba a todos tus aparatos (y cuántos llegaron al servicio de avisos). |
| PUT | `/api/detallitos/{…}/portadita` | con sesión | La miniatura de la portada (la dibuja el editor al mandarla): jpg, png o webp, chiquita. |
| GET | `/api/detallitos/{…}/paquete` | con sesión |  |
| DELETE | `/api/detallitos/{…}` | con sesión |  |
| POST | `/api/dueno/traspaso` | cualquiera |  |
| POST | `/api/dueno/relevo` | cualquiera | El teléfono nuevo ya tiene todo (y ya contesta desde internet): éste deja de ser el servidor y se apaga. |
| POST | `/api/dueno/cancelar` | cualquiera |  |
| GET | `/api/admin/aparato` | administrador | El teléfono servidor: batería, temperatura, ritmo, RAM, espacio… y cómo va el servidor. |
| GET | `/api/admin/resumen` | administrador |  |
| GET | `/api/admin/ajustes` | administrador |  |
| PUT | `/api/admin/ajustes` | administrador |  |
| GET | `/api/admin/github` | administrador |  |
| PUT | `/api/admin/github` | administrador |  |
| DELETE | `/api/admin/github` | administrador |  |
| GET | `/api/admin/github/estado` | administrador |  |
| POST | `/api/admin/github/pages` | administrador |  |
| POST | `/api/admin/github/reconstruir` | administrador |  |
| GET | `/api/admin/usuarios` | administrador |  |
| PATCH | `/api/admin/usuarios/{…}` | administrador |  |
| POST | `/api/admin/usuarios/{…}/contrasena` | administrador |  |
| DELETE | `/api/admin/usuarios/{…}` | administrador |  |
| POST | `/api/admin/usuarios/borrar-todas` | administrador | Las cuentas de prueba: todas menos las de administrador (con «BORRAR» escrito, para no hacerlo por error). |
| GET | `/api/admin/invitaciones` | administrador |  |
| POST | `/api/admin/invitaciones` | administrador |  |
| DELETE | `/api/admin/invitaciones/{…}` | administrador |  |
| GET | `/api/admin/actividad` | administrador |  |
| POST | `/api/admin/tunel/reiniciar` | administrador |  |
