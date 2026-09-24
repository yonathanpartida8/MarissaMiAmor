/**
 * INSTALABLE — el librito como aplicación, y con TU icono.
 *
 * ── LO QUE RESUELVE ──────────────────────────────────────────────────
 * Que se pueda añadir a la pantalla de inicio en Android y en iPhone, se
 * abra a pantalla completa sin barras, y use como icono cualquier imagen
 * que se deje caer en la carpeta `icono/`. Sin preparar tamaños, sin
 * tocar código y sin exportar nada.
 *
 * ── POR QUÉ EL MANIFIESTO SE REESCRIBE EN CALIENTE ───────────────────
 * Un manifiesto es un archivo fijo: dice «mi icono está aquí y mide
 * 512». Si la imagen que se pone mide otra cosa, o es un .jpg y ahí
 * ponía .png, Android la descarta y se queda sin icono, que es
 * exactamente lo que no se quiere.
 *
 * Así que aquí se prueban los nombres posibles, se coge el primero que
 * exista de verdad, se REDIBUJA a los tamaños que pide cada sistema
 * —cuadrado, centrado, sobre el color del libro— y se arma un
 * manifiesto nuevo con esas imágenes metidas dentro. El navegador nunca
 * ve un enlace roto porque no hay enlace: lleva la imagen encima.
 *
 * ── LA EXCEPCIÓN DE iOS ──────────────────────────────────────────────
 * iOS no mira el manifiesto para el icono: mira `apple-touch-icon`, y
 * ahí NO acepta imágenes metidas dentro, quiere una dirección de
 * verdad. Por eso a ése se le pasa el archivo tal cual. Le da igual el
 * tamaño, ya lo escala él.
 */

import contenido from "../data/contenido.js";

/* Sólo se prueba lo que la lista dice que existe: así, sin icono propio,
   no quedan seis 404 en la consola buscando uno. */
const CANDIDATOS = [contenido?.icono, "assets/img/imagen1.png"].filter(Boolean);

const FONDO = "#0a0510";

/** Carga una imagen. Devuelve null si no está, en vez de reventar. */
function cargar(src) {
  return new Promise((listo) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => listo(im.naturalWidth ? im : null);
    im.onerror = () => listo(null);
    im.src = src;
  });
}

/**
 * Recorta la imagen a un cuadrado y la pinta al tamaño pedido.
 *
 * Se recorta por el centro y NO se deforma: una foto apaisada estirada
 * a cuadrada se ve mal en la pantalla de inicio, y ahí el icono es lo
 * único que se ve del libro hasta que lo abres.
 *
 * `margen` deja aire alrededor. Android puede recortarle las esquinas
 * al icono para hacerlo redondo, así que la versión «maskable» se pinta
 * más pequeña dentro del cuadro: lo que recorte, recorta fondo.
 */
function cuadrar(im, lado, margen = 0) {
  const c = document.createElement("canvas");
  c.width = c.height = lado;
  const g = c.getContext("2d");
  g.fillStyle = FONDO;
  g.fillRect(0, 0, lado, lado);

  const dentro = lado * (1 - margen * 2);
  const lo = Math.min(im.naturalWidth, im.naturalHeight);
  const sx = (im.naturalWidth - lo) / 2;
  const sy = (im.naturalHeight - lo) / 2;
  g.imageSmoothingQuality = "high";
  g.drawImage(im, sx, sy, lo, lo, lado * margen, lado * margen, dentro, dentro);
  return c.toDataURL("image/png");
}

function ponerEnlace(rel, href, extra = {}) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.append(el);
  }
  el.href = href;
  for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
  return el;
}

/** Busca el icono, rehace el manifiesto y registra el ayudante. */
export async function prepararInstalacion(ctx) {
  /* ---- 1. EL ICONO ---- */
  let im = null;
  let ruta = "";
  for (const c of CANDIDATOS) {
    im = await cargar(c);
    if (im) { ruta = c; break; }
  }

  if (im) {
    try {
      const manifiesto = {
        name: "Marissa · Mi Amorcito",
        short_name: "Marissa",
        description: "Un librito de amor interactivo, hecho a mano.",
        lang: "es",
        start_url: "./index.html",
        scope: "./",
        id: "/marissa-mi-amorcito",
        display: "fullscreen",
        display_override: ["fullscreen", "standalone", "minimal-ui"],
        orientation: "any",
        background_color: FONDO,
        theme_color: FONDO,
        icons: [
          { src: cuadrar(im, 192), sizes: "192x192", type: "image/png", purpose: "any" },
          { src: cuadrar(im, 512), sizes: "512x512", type: "image/png", purpose: "any" },
          /* Un 12 % de aire por lado: es lo que se come el recorte
             redondo de Android en el peor de los casos. */
          { src: cuadrar(im, 512, 0.12), sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(manifiesto)], { type: "application/manifest+json" }),
      );
      ponerEnlace("manifest", url);
    } catch {
      /* Si el lienzo no deja exportar, se queda el manifiesto de
         siempre. Peor icono, pero instalable igual. */
    }

    /* iOS quiere una dirección de verdad, no una imagen metida dentro. */
    ponerEnlace("apple-touch-icon", ruta);
    ponerEnlace("icon", ruta);
  }

  /* ---- 2. EL AYUDANTE DE SEGUNDO PLANO ----
     Sin él Android no ofrece instalar nada. Va después de `load` para
     que no le quite ancho de banda a la primera pantalla. */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    const registrar = () => navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {});
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }

  /* ---- 3. EL BOTÓN DE INSTALAR ----
     Android avisa de que se puede instalar con un evento, y ese aviso
     hay que GUARDARLO: sólo se puede lanzar el diálogo desde un gesto,
     así que se espera a que toque el botón. */
  let aviso = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    aviso = e;
    ctx?.emit?.("instalable", true);
    document.documentElement.dataset.instalable = "si";
  });
  window.addEventListener("appinstalled", () => {
    aviso = null;
    delete document.documentElement.dataset.instalable;
  });

  return {
    /** ¿Ya está abierto como aplicación? */
    get instalado() {
      return window.matchMedia("(display-mode: standalone)").matches
        || window.matchMedia("(display-mode: fullscreen)").matches
        || window.navigator.standalone === true;
    },
    get puedeInstalar() { return !!aviso; },
    /** iPhone no tiene diálogo: hay que contárselo a mano. */
    get esIOS() {
      return /iphone|ipad|ipod/i.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    },
    async instalar() {
      if (!aviso) return false;
      aviso.prompt();
      const { outcome } = await aviso.userChoice.catch(() => ({ outcome: "dismissed" }));
      aviso = null;
      return outcome === "accepted";
    },
    /** Lo usa el botón de empezar de cero. */
    async olvidarTodo() {
      try {
        const regs = await navigator.serviceWorker?.getRegistrations?.();
        navigator.serviceWorker?.controller?.postMessage("olvidar");
        if (regs) await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
        if (window.caches) {
          const ks = await caches.keys();
          await Promise.all(ks.map((k) => caches.delete(k)));
        }
      } catch { /* da igual: lo importante es que se borre el progreso */ }
    },
  };
}
