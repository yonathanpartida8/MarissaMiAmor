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

/* ── Y LA HUELLA DE CADA PUBLICACIÓN ─────────────────────────────────
   Preguntar a la red por los ~110 archivos de código en CADA apertura
   costaba, en un iPhone con datos, uno o dos segundos de pantalla de
   carga, y sin cobertura buena se quedaba esperando. Pero GitHub Pages
   pone a todos los archivos de una publicación la misma fecha
   (`Last-Modified`, con uno o dos segundos de diferencia). Así que basta
   con preguntar por la página: si su fecha es la de lo guardado, no se
   publicó nada y el código sale de la caché sin tocar la red; si
   cambió, se estrena una caché nueva y todo se vuelve a pedir. Nunca se
   mezcla código de dos publicaciones, y una corrección se ve en la
   primera apertura después de publicarla.
   Fuera de GitHub Pages (el servidor local) no hay huella y todo sigue
   como siempre: la red manda. */

/** ¿Es código? Entonces va con la huella de la publicación (o, sin huella, a la red). */
function esCodigo(url) {
  return /\.(html?|js|mjs|css|json|webmanifest)$/i.test(url.pathname)
      || url.pathname.endsWith("/");
}

/* Cambiar este nombre tira TODO lo guardado en los teléfonos la próxima
   vez que abran el libro. Se subió a v2 porque la copia vieja seguía
   enseñando las fotos de antes aunque ya se hubieran cambiado. */
const VERSION = "marissa-v2";
const CODIGO = "marissa-codigo-";   // + la huella de la publicación
const META = "marissa-meta";
const MISMA = 15e3;                 // ms: una publicación entera cabe aquí
const AUDIO = /\.(mp3|m4a|aac|ogg|oga|opus|wav)$/i;
const TOPE_ENTERO = 12 * 1024 * 1024;
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
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== META && !k.startsWith(CODIGO)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => podarPronto()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "saltar") self.skipWaiting();
  /* Vaciar del todo: lo usa el botón de «empezar de cero». */
  if (e.data === "olvidar") {
    huellaP = null;
    e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))));
  }
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // letras de Google y demás: ni tocarlas

  const navega = req.mode === "navigate";
  if (navega && (req.destination === "document" || !req.destination)) {
    e.respondWith(navegar(e, req));
    return;
  }
  if (navega || esCodigo(url) || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(codigo(req, navega));
    return;
  }
  /* ── LOS TROZOS (audio y vídeo) ──────────────────────────────────
     Los reproductores piden la canción a pedazos («Range»). Si se les
     contesta con el archivo ENTERO guardado, Safari no lo acepta y la
     música no suena: era uno de los «a veces no se reproduce». Se
     contestan siempre con el pedazo justo. */
  if (req.headers.has("range")) {
    e.respondWith(trozo(e, req, url));
    return;
  }
  e.respondWith(medio(e, req, url));
});

/* ═══ La huella ════════════════════════════════════════════════════ */

let huellaP = null;
function huella() {
  if (!huellaP) {
    huellaP = caches.open(META).then((c) => c.match("huella")).then((r) => (r ? r.text() : "")).catch(() => "");
  }
  return huellaP;
}

const fechaDe = (r) => {
  const t = Date.parse((r && r.headers.get("last-modified")) || "");
  return Number.isFinite(t) ? t : 0;
};
const deGitHub = (r) => (r.headers.get("server") || "").toLowerCase() === "github.com";
const sirve = (r) => r && r.status === 200 && r.type === "basic" && !r.redirected;

/** ¿Esta copia es de la publicación vigente? */
async function alDia(r) {
  const id = +(await huella());
  const t = fechaDe(r);
  return !!(id && t && Math.abs(t - id) <= MISMA);
}

async function fijarHuella(t) {
  const antes = await huella();
  if (antes && Math.abs(+antes - t) <= MISMA) return antes;
  const id = String(t);
  huellaP = Promise.resolve(id);
  await (await caches.open(META)).put("huella", new Response(id));
  /* Se queda la de la publicación anterior —por si se va la red a media
     sesión— y se tiran las demás. */
  const ks = await caches.keys();
  await Promise.all(ks.filter((k) => k.startsWith(CODIGO) && k !== CODIGO + id && k !== CODIGO + antes).map((k) => caches.delete(k)));
  // El código que el ayudante viejo guardaba junto a las fotos ya sobra.
  if (!antes) {
    caches.open(VERSION).then(async (c) => {
      for (const k of await c.keys()) if (esCodigo(new URL(k.url))) await c.delete(k);
    }).catch(() => {});
  }
  return id;
}

/* ═══ Las páginas ══════════════════════════════════════════════════
   Si la red no contesta en cuatro segundos (una sola raya de cobertura,
   el wifi del metro que dice estar y no está), se abre lo guardado. Lo
   que llegue tarde ya no cambia nada: esa apertura se queda entera con
   la copia que se enseñó. */
async function paginaGuardada(req) {
  const u = new URL(req.url);
  const claves = [req.url, new URL("index.html", u).href, new URL("./", u).href];
  const id = await huella();
  if (id) {
    const c = await caches.open(CODIGO + id);
    for (const k of claves) {
      const r = await c.match(k, { ignoreSearch: true });
      if (r) return r;
    }
  }
  for (const k of claves) {
    const r = await caches.match(k, { ignoreSearch: true });
    if (r) return r;
  }
  return null;
}

async function navegar(e, req) {
  const guardada = await paginaGuardada(req);
  let tarde = false;
  const red = fetch(req).then(async (r) => {
    if (!tarde && sirve(r)) {
      const t = deGitHub(r) ? fechaDe(r) : 0;
      const id = t ? await fijarHuella(t) : "";
      const copia = r.clone();
      caches.open(id ? CODIGO + id : VERSION).then((c) => c.put(req.url, copia)).catch(() => {});
    }
    return r;
  });
  if (!guardada) {
    return red.catch(async () => (await caches.match("./index.html")) || Response.error());
  }
  e.waitUntil(red.catch(() => {}));
  return Promise.race([
    red.catch(() => guardada),
    new Promise((ok) => setTimeout(() => { tarde = true; ok(guardada); }, 4000)),
  ]);
}

/* ═══ El código ════════════════════════════════════════════════════ */
async function codigo(req, esPagina) {
  const id = await huella();
  if (!id || req.cache === "no-store" || req.cache === "reload") return redPrimero(req, esPagina);
  const c = await caches.open(CODIGO + id);
  const hit = await c.match(req.url, { ignoreVary: true });
  if (hit) return hit;
  try {
    let r = await fetch(req);
    let t = fechaDe(r);
    /* Una copia de una publicación anterior sólo puede venir de la caché
       del propio navegador (guarda diez minutos). Se pide otra vez,
       preguntando de verdad. */
    if (sirve(r) && t && t < +id - MISMA) {
      const r2 = await fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" })).catch(() => null);
      if (sirve(r2)) { r = r2; t = fechaDe(r2); }
    }
    // Sólo se guarda lo que es de ESTA publicación: si es de una más nueva,
    // la próxima apertura lo verá y estrenará caché.
    if (sirve(r) && t && Math.abs(t - +id) <= MISMA) c.put(req.url, r.clone()).catch(() => {});
    return r;
  } catch {
    return (await caches.match(req.url, { ignoreVary: true })) || Response.error();
  }
}

function redPrimero(req, esPagina) {
  return fetch(req)
    .then((r) => {
      if (sirve(r)) {
        const copia = r.clone();
        caches.open(VERSION).then((c) => c.put(req, copia)).catch(() => {});
      }
      return r;
    })
    .catch(() => caches.match(req).then((r) => {
      if (r) return r;
      /* Sólo una PÁGINA puede caer en la portada. Un guión que no
         está no se sustituye por un HTML: eso da un error de
         sintaxis rarísimo en vez de un fallo claro. */
      return esPagina ? caches.match("./index.html").then((x) => x || Response.error()) : Response.error();
    }));
}

/* ═══ Fotos y sonidos enteros ══════════════════════════════════════
   Se enseña lo guardado al instante. Las fotos del libro llevan su
   huella en la dirección (`?v=…`): eso no cambia nunca. Lo demás se
   revisa una vez por publicación: si la copia ya es de la vigente, ni se
   pregunta. */
const revisadas = new Set();

async function medio(e, req, url) {
  const c = await caches.open(VERSION);
  const fresco = req.cache === "no-store" || req.cache === "reload" || req.cache === "no-cache";
  const guardada = await c.match(req);
  if (guardada && !fresco && (url.searchParams.has("v") || revisadas.has(req.url) || await alDia(guardada))) return guardada;
  revisadas.add(req.url);
  const red = fetch(req).then((r) => {
    /* Sólo se guarda lo que ha ido bien, y entero. Guardar un 404 es
       guardar el error para siempre, y un trozo no se puede guardar. */
    if (sirve(r)) {
      c.put(req, r.clone()).then(() => {
        // Una foto con huella nueva: la de la huella vieja ya no hace falta.
        if (url.searchParams.has("v")) podarPronto(url);
        else podarPronto();
      }).catch(() => {});
    }
    return r;
  }).catch(() => null);
  if (guardada && !fresco) {
    e.waitUntil(red);
    return guardada;
  }
  return (await red) || guardada || Response.error();
}

/* ═══ Música a pedazos ═════════════════════════════════════════════
   Safari no guarda los pedazos en su caché: la canción del libro (cinco
   megas) se volvía a bajar entera en cada apertura, con datos. Ahora,
   la primera vez que suena, de fondo y sin prisa, se guarda entera; de
   ahí en adelante cada pedazo sale del teléfono: empieza al instante,
   suena sin red y no gasta datos. Los vídeos siguen yendo a la red. */
const bajando = new Set();

async function trozo(e, req, url) {
  const rango = req.headers.get("range");
  const guardada = await caches.match(req.url, { ignoreVary: true });
  if (guardada && guardada.status === 200 && (url.searchParams.has("v") || await alDia(guardada))) {
    return recortar(guardada, rango, req.url);
  }
  try {
    const r = await fetch(req);
    if (AUDIO.test(url.pathname) && !bajando.has(req.url) && r.ok) {
      const total = +String(r.headers.get("content-range") || "").split("/")[1] || +r.headers.get("content-length") || 0;
      if (total && total <= TOPE_ENTERO) e.waitUntil(guardarEntero(req.url));
    }
    /* Re-envuelto: el reproductor no deja mezclar, para una misma
       canción, pedazos traídos tal cual de la red con pedazos hechos
       aquí (lo toma por datos de dos sitios distintos y se corta). Así
       todos son del mismo tipo, vengan de donde vengan. */
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers });
  } catch {
    return guardada ? recortar(guardada, rango, req.url) : Response.error();
  }
}

async function guardarEntero(u) {
  bajando.add(u);
  try {
    // Que no le quite red a lo que está sonando ni a la página que se abre.
    await new Promise((ok) => setTimeout(ok, 6000));
    const r = await fetch(u);
    if (sirve(r)) {
      await (await caches.open(VERSION)).put(u, r);
      podarPronto();
    }
  } catch { /* la próxima vez será */ } finally {
    bajando.delete(u);
  }
}

/** Un pedazo (206) sacado de una respuesta entera guardada. */
let ultimo = null;   // el último archivo abierto: Safari pide muchos pedazos seguidos del mismo
async function recortar(resp, rango, clave) {
  const lm = resp.headers.get("last-modified") || "";
  let blob;
  if (ultimo && ultimo.clave === clave && ultimo.lm === lm) blob = ultimo.blob;
  else {
    blob = await resp.blob();
    ultimo = { clave, lm, blob };
  }
  const total = blob.size;
  const m = /bytes=(\d*)-(\d*)/.exec(rango || "");
  let ini = m && m[1] ? Number(m[1]) : 0;
  let fin = m && m[2] ? Number(m[2]) : total - 1;
  if (m && !m[1] && m[2]) { ini = Math.max(0, total - Number(m[2])); fin = total - 1; }
  fin = Math.min(fin, total - 1);
  if (ini > fin) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  /* Con las MISMAS cabeceras que el archivo (su ETag y su fecha). El
     reproductor guarda pedazos de la red en memoria y los junta con los
     de aquí; si unos traen firma y otros no, cree que la canción cambió
     a medias y se corta («data source error»). */
  const h = new Headers(resp.headers);
  h.set("Content-Type", resp.headers.get("Content-Type") || "application/octet-stream");
  h.set("Content-Range", `bytes ${ini}-${fin}/${total}`);
  h.set("Content-Length", String(fin - ini + 1));
  h.set("Accept-Ranges", "bytes");
  return new Response(blob.slice(ini, fin + 1), { status: 206, statusText: "Partial Content", headers: h });
}

/* ═══ Que la caché no crezca sin fin ═══════════════════════════════
   Antes, cada foto nueva recorría la caché entera para borrar su versión
   vieja: con cien fotos, cien recorridos. Ahora se juntan y se hace uno.
   Y si lo guardado pasa del 60 % de lo que el teléfono deja (o de 600 MB),
   se va lo más antiguo: mejor volver a bajar una foto que llenarle el
   teléfono. */
const nuevasConHuella = new Map();
let reloj = 0;
function podarPronto(url) {
  if (url) nuevasConHuella.set(url.pathname, url.searchParams.get("v"));
  clearTimeout(reloj);
  reloj = setTimeout(podar, 3000);
}

async function podar() {
  try {
    const c = await caches.open(VERSION);
    let ks = await c.keys();
    if (nuevasConHuella.size) {
      const viejas = ks.filter((k) => {
        const u = new URL(k.url);
        return nuevasConHuella.has(u.pathname) && u.searchParams.has("v") && u.searchParams.get("v") !== nuevasConHuella.get(u.pathname);
      });
      nuevasConHuella.clear();
      await Promise.all(viejas.map((k) => c.delete(k)));
      if (viejas.length) ks = await c.keys();
    }
    const est = await (self.navigator.storage && self.navigator.storage.estimate ? self.navigator.storage.estimate() : null);
    if (!est || !est.quota) return;
    let sobra = est.usage - Math.min(est.quota * 0.6, 600 * 1024 * 1024);
    for (const k of ks) {
      if (sobra <= 0) break;
      const r = await c.match(k);
      sobra -= +((r && r.headers.get("content-length")) || 0) || 200 * 1024;
      await c.delete(k);
    }
  } catch { /* nada: se intentará la próxima vez */ }
}
