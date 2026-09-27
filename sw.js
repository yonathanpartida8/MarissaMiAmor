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
   El CÓDIGO va a la red primero. Las FOTOS Y LOS SONIDOS van a la
   caché primero.

   Todo a la caché es el error clásico: se publica una corrección, ella
   abre el libro, y sigue viendo el de antes para siempre, porque su
   teléfono ya tiene una copia y no vuelve a preguntar.

   Y no basta con hacerlo sólo con las páginas. Los archivos de código
   no llevan el número de versión en el nombre, así que una página
   nueva pide exactamente los mismos `src/…` de siempre: se quedaría
   con el HTML nuevo llamando al JavaScript viejo, que es peor que no
   actualizar nada. Por eso el código entero —páginas, guiones y
   estilos— pregunta a la red.

   Las fotos y los sonidos sí van a la caché primero: pesan, no
   cambian, y son justo lo que hace que el libro tarde en abrir.

   Sin red, todo tira de la copia guardada. Que es para lo que está. */

/** ¿Es código? Entonces la red manda. */
function esCodigo(url) {
  return /\.(html?|js|mjs|css|json|webmanifest)$/i.test(url.pathname)
      || url.pathname.endsWith("/");
}

/* Cambiar este nombre tira TODO lo guardado en los teléfonos la próxima
   vez que abran el libro. Se subió a v2 porque la copia vieja seguía
   enseñando las fotos de antes aunque ya se hubieran cambiado. */
const VERSION = "marissa-v2";
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

  if (esPagina || esCodigo(url)) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(req, copia)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(req).then((r) => {
          if (r) return r;
          /* Sólo una PÁGINA puede caer en la portada. Un guión que no
             está no se sustituye por un HTML: eso da un error de
             sintaxis rarísimo en vez de un fallo claro. */
          return esPagina ? caches.match("./index.html") : Response.error();
        })),
    );
    return;
  }

  /* ── LOS TROZOS (audio y vídeo) ──────────────────────────────────
     Los reproductores piden la canción a pedazos («Range»). Si se les
     contesta con el archivo ENTERO guardado, Safari no lo acepta y la
     música no suena: era uno de los «a veces no se reproduce». Los
     pedazos van a la red; sin red, se recortan de la copia guardada. */
  if (req.headers.has("range")) {
    e.respondWith(
      fetch(req).catch(async () => {
        const guardada = await caches.match(req.url, { ignoreVary: true });
        return guardada ? recortar(guardada, req.headers.get("range")) : Response.error();
      }),
    );
    return;
  }

  /* ── LO DEMÁS (fotos, sonidos enteros) ───────────────────────────
     Se enseña lo guardado al instante y, de fondo, se pregunta a la red
     por si cambió: la próxima vez ya sale lo nuevo. Las fotos del libro
     además llevan su huella en la dirección (`?v=…`), así que una foto
     cambiada ni siquiera espera: es otra dirección. */
  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const guardada = await c.match(req);
      const red = fetch(req).then((r) => {
        /* Sólo se guarda lo que ha ido bien, y entero. Guardar un 404 es
           guardar el error para siempre, y un trozo no se puede guardar. */
        if (r && r.status === 200 && r.type === "basic") c.put(req, r.clone()).catch(() => {});
        return r;
      }).catch(() => null);
      if (guardada) {
        e.waitUntil(red);
        return guardada;
      }
      return (await red) || Response.error();
    }),
  );
});

/** Un pedazo (206) sacado de una respuesta entera guardada. */
async function recortar(resp, rango) {
  const datos = await resp.arrayBuffer();
  const total = datos.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(rango || "");
  let ini = m && m[1] ? Number(m[1]) : 0;
  let fin = m && m[2] ? Number(m[2]) : total - 1;
  if (m && !m[1] && m[2]) { ini = Math.max(0, total - Number(m[2])); fin = total - 1; }
  fin = Math.min(fin, total - 1);
  if (ini > fin) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  return new Response(datos.slice(ini, fin + 1), {
    status: 206,
    headers: {
      "Content-Type": resp.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": `bytes ${ini}-${fin}/${total}`,
      "Content-Length": String(fin - ini + 1),
      "Accept-Ranges": "bytes",
    },
  });
}
