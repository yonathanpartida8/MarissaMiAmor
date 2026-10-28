# Hacia la app nativa de Android (Fase 46)

Hoy **My Love Pages** es una página web. El APK de esta carpeta (`app/`) sólo la abre a pantalla completa
dentro de una vista web (`MainActivity.java`), con cámara, micrófono, ubicación, descargas y el botón «atrás».
La meta es una app **verdaderamente nativa** (no una PWA). Esto es lo que ya quedó listo para llegar ahí
sin romper la web, y el orden recomendado para hacerla.

## Lo que ya está separado (y por qué ayuda)

| Capa | Dónde vive | Qué hace | En la app nativa |
|---|---|---|---|
| Servidor (M.YNTHN) | `servidor/servidor.py` | Cuentas, pareja, chat, Detallitos, Mesecitos, mapa, mensajitos rápidos, push | **Se queda igual.** La app nativa habla con la misma API |
| Contrato de la API | `servidor/API.md` (sale de `python3 servidor/servidor.py rutas`) | Cada ruta, quién puede usarla y qué hace | Es la lista de lo que la app nativa tiene que llamar |
| Cliente de la API | `EditorDev/integraciones/servidor.js` | Toda la app pide al servidor SÓLO por aquí (token, reintentos, búsqueda del servidor que se movió) | Se traduce 1:1 a un repositorio en Kotlin (Retrofit/Ktor) |
| Lógica sin pantalla | `EditorDev/core/` (estado, historial, modelo del librito) | El editor sin depender del navegador | Se puede portar o seguir usando dentro de una vista web sólo para el editor |
| Lo del aparato | `EditorDev/integraciones/plataforma.js` | Vibrar, ubicación, push, compartir: se pide aquí, no al navegador | Aquí se conecta el puente nativo (`window.MyLovePagesNativa`) |

Reglas que se siguen desde ahora para no estorbar la transición:

1. **Nada del aparato directo al navegador** en código nuevo: va por `plataforma.js`.
2. **Nada de lógica de negocio en el HTML/CSS**: las reglas (meses cumplidos, cápsulas selladas, quién ve qué)
   viven en el servidor; la app sólo muestra.
3. **Fechas del aparato**: el «hoy» lo manda el aparato (`?hoy=AAAA-MM-DD`), así funciona igual en México y en
   EE. UU. La app nativa debe mandar su fecha local igual.
4. **Sin secretos en la app**: ni contraseñas ni llaves (como hoy). La llave de firma vive sólo en GitHub Actions.

## El puente nativo (cuando exista)

La app nativa expone a la parte web (si alguna pantalla sigue siendo web, como el editor) un objeto
`window.MyLovePagesNativa` con:

- `capacidades()` → JSON con lo que sabe hacer, p. ej. `["vibrar","compartir","ubicacion-fondo","push"]`
- `vibrar(ms)`, `compartir(json)` y, después, `ubicacionFondo(prender)` y `registrarPush(token)`

`plataforma.js` ya lo busca: si no está, todo sigue como en la web.

## Orden recomendado

1. **Notificaciones nativas (FCM)** con canales y **sonidos propios** por mensajito rápido (besitos, te amo,
   cuídate, el escrito): el servidor ya manda `tag: "toque-<tipo>"`.
2. **Ubicación en segundo plano** (servicio en primer plano con su notificación, permiso «todo el tiempo»): así
   los avisos de **llegar y salir de un lugar** funcionan con la app cerrada (la web no puede).
3. **Pantallas nativas** de lo más usado: Nuestros días (mapa, mensajitos, Mesecitos), Mensajitos y el menú.
4. **El editor** al final (es lo más grande): mientras tanto puede abrirse en una vista web dentro de la app.

## Lo que NO cambia

- La página web sigue funcionando igual (navegador, iPhone, compu).
- El APK de hoy (vista web) se sigue construyendo con `.github/workflows/apk.yml`.
