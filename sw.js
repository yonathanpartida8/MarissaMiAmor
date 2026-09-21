/* ══════════════════════════════════════════════════════════════════════
   EL AYUDANTE DE SEGUNDO PLANO
   ══════════════════════════════════════════════════════════════════════

   Está por dos cosas:

   1. Para que el librito se pueda INSTALAR. Android no ofrece instalar
      nada que no tenga uno de éstos con su manejador de peticiones.
   2. Para que, una vez instalado, se abra SIN INTERNET. Es un regalo:
      tiene que abrirse en un avión, en el metro y con el teléfono en
      modo avión a las tres de la mañana.

   ── LA REGLA, QUE ES LA MITAD DEL ASUNTO ────────────────────────────
   Las páginas van a la RED PRIMERO y lo demás va a la CACHÉ PRIMERO.

   Al revés —todo a la caché— es el error clásico: se publica una
   corrección, la novia abre el libro, y sigue viendo el de antes para
   siempre, porque su teléfono ya tiene una copia y no vuelve a
   preguntar. Con las páginas pidiendo a la red, cualquier arreglo entra
   en el siguiente arranque; y si no hay red, sale la copia guardada,
   que es justo para lo que está.                                       */

const VERSION = "marissa-v1";
const ESENCIALES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  /* `addAll` falla entero si UNA sola no está, así que van de una en
     una: que falte un archivo no puede dejar el libro sin instalar. */
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(ESENCIALES.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "saltar") self.skipWaiting();
  /* Vaciar del todo: lo usa el botón de «empezar de cero». */
  if (e.data === "olvidar") {
    e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))));
  }
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // letras de Google y demás: ni tocarlas

  const esPagina = req.mode === "navigate"
    || (req.headers.get("accept") || "").includes("text/html");

  if (esPagina) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(req, copia)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html"))),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((guardada) => {
      if (guardada) return guardada;
      return fetch(req).then((r) => {
        /* Sólo se guarda lo que ha ido bien. Guardar un 404 es guardar
           el error para siempre. */
        if (r && r.ok && r.type === "basic") {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(req, copia)).catch(() => {});
        }
        return r;
      }).catch(() => guardada);
    }),
  );
});
