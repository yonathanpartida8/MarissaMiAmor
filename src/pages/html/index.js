/**
 * PÁGINA HTML — un archivo suyo de `paginas-html/`, dentro del libro.
 *
 * Él escribe `paginas-html/página.html1.html` con lo que quiera —botones,
 * animaciones, un juego, música— y aquí se convierte en una hoja más. No en
 * una web incrustada: en una hoja. Ocupa exactamente lo que ocupa el libro,
 * llega girando como las demás y se pasa igual que las demás.
 *
 * ── POR QUÉ UN IFRAME Y NO PEGAR EL HTML EN LA PÁGINA ─────────────────
 * Pegarlo era la opción obvia y es la mala, por dos motivos:
 *
 *   1. SE PISARÍAN. El libro tiene sus estilos, sus variables y sus nombres
 *      de clase. Un archivo suyo que declare `body { background: white }` o
 *      una clase `.page` reventaría el libro entero desde dentro, y al revés:
 *      su página heredaría cuarenta reglas que él no escribió.
 *
 *   2. NO HABRÍA MANERA DE APAGARLO. Un `<script>` pegado en el documento
 *      deja intervalos, `requestAnimationFrame`, escuchas en `window`, audio
 *      sonando y contextos de WebGL abiertos. Quitar el nodo NO para nada de
 *      eso. Al pasar tres páginas HTML tendrías tres bucles corriendo a la
 *      vez para nadie.
 *
 * Un iframe resuelve las dos: es un documento aparte, con sus estilos y su
 * `window`, y vaciarlo lo apaga TODO de golpe —relojes, sonido, GPU— sin que
 * su autor tenga que acordarse de nada.
 *
 * ── LO QUE HACE ESTA PÁGINA, ENTONCES ─────────────────────────────────
 *   · le da al invitado el tamaño exacto de la hoja, con sus márgenes
 *     seguros, para que no haya recortes ni bandas ni deformaciones;
 *   · le inyecta lo mínimo para que no se vea gigantesco en un móvil (el
 *     `viewport`) y para que pueda usar los colores del libro si quiere;
 *   · le presta los gestos: dentro del iframe el libro no ve el dedo, así
 *     que se lo cuenta, y pasar página sigue funcionando encima del HTML;
 *   · lo enciende al entrar y lo apaga al salir. Siempre.
 *
 * ── CUÁNDO SE ENCIENDE ────────────────────────────────────────────────
 * El `src` NO se pone al construir la hoja, se pone al ENTRAR en ella. El
 * router construye las hojas vecinas por adelantado para que arrastrar
 * responda al instante; si el `src` se pusiera ahí, la página de al lado
 * estaría ejecutándose de fondo antes de que nadie la haya visto. Lo que sí
 * se hace por adelantado es pedir el archivo a la red —`preload()`—, que no
 * ejecuta nada y deja la carga instantánea cuando de verdad toca.
 */

import { BasePage } from "../BasePage.js";
import { el, setVars } from "../../utils/dom.js";
import { fondoDelTema } from "../../utils/temas.js";
import textos from "./textos.js";

/**
 * Lo que se le inyecta al documento invitado.
 *
 * Es corto a propósito: esto NO es un tema, es lo mínimo para que un archivo
 * suelto se comporte dentro de una hoja de libro. Todo lo demás lo manda él.
 */
const CIMIENTOS = `
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    /* Se desplaza arriba y abajo, y no se hace zoom por accidente con dos
       dedos en mitad de una escena. El barrido horizontal NO se lo queda el
       navegador: lo reparte el libro, que sólo pasa hoja si el dedo empieza
       en el borde (ver el puente de gestos). */
    touch-action: pan-y;
    overscroll-behavior: contain;
    -webkit-text-size-adjust: 100%;
  }
  /* EL PAPEL VA AQUÍ DENTRO, y no debajo del iframe.
     Un iframe no es transparente: el navegador le pinta detrás un blanco
     opaco propio, y ese blanco no se quita ni poniendo el documento entero
     en «transparent» —está probado—. Lo que se veía era una hoja blanca de
     folio en mitad de un libro de papel crema.
     Así que el papel se lo damos AL INVITADO: lo pinta él, encima de ese
     blanco, y la hoja vuelve a ser del mismo papel que las demás. Y como es
     lo primero de la cabecera, cualquier fondo que él escriba después gana.
     (Ojo al escribir aquí: esto vive dentro de una plantilla de JavaScript,
     así que ni una comilla invertida en los comentarios.) */
  html {
    background:
      radial-gradient(ellipse 130% 80% at 20% -6%, var(--papel-luz, #fffaf4), transparent 58%),
      linear-gradient(158deg,
        var(--papel-claro, #fffaf4) 0%,
        var(--papel, #fbf0e8) 44%,
        var(--papel-hondo, #f3e2da) 100%);
  }
  body {
    /* Transparente para que se vea el papel de arriba. Si él pinta el suyo,
       el suyo gana: esta hoja va la primera de la cabecera. */
    background: transparent;
    box-sizing: border-box;
    color: var(--texto, #3d2a2b);
    font-family: var(--tipo, system-ui, -apple-system, "Segoe UI", sans-serif);
    /* Márgenes seguros del teléfono: la muesca de arriba y la barra de
       gestos de abajo. Sin esto, un botón pegado al borde cae debajo del
       cristal del móvil y no se puede pulsar. */
    padding:
      var(--seguro-arriba, 0px) var(--seguro-lado, 0px)
      var(--seguro-abajo, 0px) var(--seguro-lado, 0px);
  }
  /* Nada se sale de la hoja por ser más ancho que ella. */
  img, video, canvas, svg, iframe, table, pre {
    max-width: 100%;
  }
  img, video { height: auto; }
  /* Se puede desplazar, pero sin barra: dentro de un libro una barra de
     desplazamiento canta muchísimo. */
  html { scrollbar-width: none; }
  html::-webkit-scrollbar { display: none; }
  [data-claim-drag] { touch-action: auto; }
`;

/**
 * Lo que, si el dedo empieza encima, es suyo aunque empiece en el borde.
 *
 * Son cosas que se pulsan o se escriben, no decorado: un enlace pegado al
 * margen tiene que poder pulsarse. `[data-claim-drag]` es la manera que él
 * tiene de decir «esto lo arrastro yo», y vale también en el borde.
 *
 * Fíjate en lo que NO está: `canvas`, `video`, `audio`. Antes sí estaban, y
 * era un error —ver `#prestarGestos`—: casi todas estas páginas son un lienzo
 * a pantalla completa, así que tenerlo aquí dejaba la hoja sin salida salvo
 * que su autor se acordara de dejar unas franjas vacías en los lados.
 */
const SUYO =
  "a,button,input,select,textarea,label,summary," +
  "[contenteditable],[data-claim-drag],[role=button],[role=slider],[role=tab]";

/** Cuánto tiene que correr el dedo en horizontal para que pase la hoja. */
const BARRIDO = 46;

/** Y cuánto más horizontal que vertical, para no robarle un desplazamiento. */
const SESGO = 1.5;

/**
 * La franja de los bordes donde el barrido es del libro. Exactamente la misma
 * medida que usa la navegación de bordes del libro (`EdgeNav`), para que dentro
 * de una página HTML el gesto caiga donde cae en el resto del libro.
 */
const BANDA_MIN = 24;
const BANDA_MAX = 44;
const BANDA_PROP = 0.07;

/** Si el archivo no abre en este tiempo, se sigue adelante sin él. */
const ESPERA_MAX = 3500;

export default class HtmlPage extends BasePage {
  static type = "html";

  // ---- Construcción ------------------------------------------------------

  /**
   * Pide el archivo a la red por adelantado, sin ejecutarlo.
   *
   * Cuando el router llegue de verdad a esta página, el iframe lo sacará de
   * la caché del navegador y aparecerá en el mismo fotograma. Es la única
   * manera de tener las dos cosas: nada corriendo de fondo y nada que
   * esperar al llegar.
   */
  async preload() {
    const src = this.entry.src;
    if (!src) return;
    // Caché normal, no `force-cache`: con `force-cache` el navegador se
    // queda con la copia vieja aunque él acabe de cambiar el archivo, y
    // editar una página y no ver el cambio al recargar es de volverse loco.
    try {
      const r = await fetch(src);
      if (r.ok) this.#nombrarDesdeElTexto(await r.text());
    } catch {
      // Sin red o sin archivo: no pasa nada. El nombre provisional sirve y
      // `enter()` volverá a intentarlo con el documento ya cargado.
    }
  }

  /**
   * Saca el `<title>` del archivo SIN ejecutarlo, y con él bautiza la página.
   *
   * ── POR QUÉ AQUÍ Y NO SÓLO AL ENTRAR ──────────────────────────────────
   * El nombre de verdad se leía del documento ya vivo, o sea al ENTRAR en
   * la página. Hasta entonces, en el índice ponía «Página 3», «Página 4»…
   * Quien abriera el índice sin haber pasado por ellas veía una lista de
   * números en vez de «El hilo rojo» o «La ventana», que es justo lo que
   * hace que apetezca ir.
   *
   * Y no costaba nada averiguarlo: esta función ya descargaba el archivo
   * entero para dejarlo en la caché, y tiraba el contenido a la basura.
   * Ahora lo mira de paso. Cero peticiones de más.
   *
   * Se lee sólo el principio: el `<title>` vive en la cabecera, y estos
   * archivos pueden ocupar cien kilobytes de escena que no hace falta
   * recorrer. Y se interpreta como HTML de verdad —no a mano— para que un
   * título con `&amp;` o con acentos escapados llegue bien; parsear NO
   * ejecuta ni un script, que es lo que importa aquí.
   */
  #nombrarDesdeElTexto(texto) {
    if (!texto || !this.chapter) return;
    // Sin los comentarios: un archivo que cite <title> dentro de uno haría
    // que la búsqueda empezara ahí y arrastrara el comentario entero.
    const cabeza = texto.slice(0, 8192).replace(/<!--[\s\S]*?-->/g, "");
    const m = cabeza.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!m) return;
    let titulo = m[1];
    try {
      titulo = new DOMParser().parseFromString(m[1], "text/html").body.textContent;
    } catch {
      /* si el intérprete falla, sirve el texto tal cual */
    }
    titulo = (titulo || "").trim();
    if (titulo) this.chapter.title = titulo;
  }

  build() {
    this.root = el("section.page.pagweb", {
      "data-page": this.id,
      // Hoja clara: la viñeta del libro pesa la mitad encima (ver `base.css`).
      // Detrás del archivo hay papel, y un oscurecido fuerte sobre papel se
      // lee como suciedad gris.
      "data-claro": "true",
      "aria-label": this.chapter?.title || this.id,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // El papel de debajo. Está SIEMPRE, aunque no se vea: es lo que hay
    // mientras el archivo llega y lo que queda al irse, y es la razón de que
    // no haya ni un fotograma en blanco ni en negro en toda la transición.
    //
    // Lleva la clase `paper` de verdad, la misma que las páginas escritas:
    // así el papel que asoma por detrás de su archivo es exactamente el del
    // resto del libro —su fibra, su luz, su sombra teñida del capítulo— y no
    // una imitación que haya que mantener al día en dos sitios.
    this.fondo = el("div.pagweb__papel.paper", { "aria-hidden": "true" }, [
      el("span.pagweb__abriendo", { text: textos.abriendo }),
    ]);

    // Sin `src`: aquí no se enciende nada. Ver la cabecera del archivo.
    this.marco = el("iframe.pagweb__marco", {
      title: this.chapter?.title || this.id,
      loading: "lazy",
      referrerpolicy: "no-referrer",
      // `allow` con la lista vacía: nada de cámara, micrófono ni ubicación.
      // El sonido y la pantalla completa sí, que es lo que puede querer.
      allow: "autoplay *; fullscreen *",
    });

    this.root.append(this.fondo, this.marco);
    return this.root;
  }

  // ---- Encendido y apagado ----------------------------------------------

  async enter(direction) {
    await super.enter(direction);

    this.roto = false;
    await this.#encender();

    // Y ya con el documento dentro, el nombre de verdad. Se hace ANTES de
    // devolver el control al router, que es quien avisa a la barra y al
    // índice: así la página nunca se anuncia con su nombre provisional.
    this.#ponerseElNombre();

    requestAnimationFrame(() => this.root?.classList.add("is-entered"));
  }

  /**
   * Pone el `src`, espera al documento y lo deja listo.
   * Nunca lanza: una página que no abre enseña su aviso y el libro sigue.
   */
  #encender() {
    const src = this.entry.src;
    if (!src || !this.marco) return Promise.resolve();

    return new Promise((resolve) => {
      let cerrado = false;
      const fin = (ok) => {
        if (cerrado) return;
        cerrado = true;
        clearTimeout(reloj);
        this.marco?.removeEventListener("load", alCargar);
        if (!ok) this.#avisarRota();
        resolve();
      };

      // Un archivo que no contesta no puede dejar el libro atascado en mitad
      // de una transición: a los tantos milisegundos se sigue adelante y, si
      // llega tarde, aparece igual (el `load` sigue enganchado al fundido).
      //
      // Con `this.later` y no con `setTimeout` a secas: así el reloj se muere
      // con la página. Un `setTimeout` suelto sobrevive a la hoja que lo pidió
      // y se despierta en una que ya no existe.
      const reloj = this.later(() => fin(false), ESPERA_MAX);

      const alCargar = () => {
        // `about:blank` también dispara `load`. Ése no cuenta.
        const ventana = this.marco?.contentWindow;
        if (!ventana) return;
        // Abierto como archivo (`file://`) el documento de dentro cuenta como
        // de otro origen y leerlo lanza: se da por cargado y se sigue, sin
        // prestarle colores ni gestos, en vez de quedarse la hoja en blanco.
        let href = "ajeno";
        try { href = ventana.location.href; } catch { /* otro origen */ }
        if (href === "about:blank") return;

        try { this.#acomodar(); } catch { /* otro origen */ }
        try { this.#prestarGestos(); } catch { /* otro origen */ }
        // Si el archivo tardó tanto que ya se había dado por perdido, ahora
        // que ha llegado se retira el aviso: mejor tarde que un cartel de
        // error encima de una página que sí funciona.
        this.roto = false;
        this.root?.classList.remove("is-rota");
        this.root?.classList.add("is-lista");
        fin(true);
      };

      this.marco.addEventListener("load", alCargar);
      this.marco.src = src;
    });
  }

  /**
   * Apaga el documento invitado. Del todo.
   *
   * Poner `about:blank` DESCARGA el documento: con él se van sus relojes,
   * sus `requestAnimationFrame`, sus escuchas, su audio y sus contextos de
   * WebGL. No hay nada que su autor tenga que recordar liberar.
   *
   * Es idempotente: llamarlo dos veces no rompe nada, y por eso lo llaman
   * tanto `leave()` como `destroy()`.
   */
  #apagar() {
    this.#soltarGestos();
    this.root?.classList.remove("is-lista");
    if (!this.marco) return;
    try {
      // `replace` y no `src =`: así no deja una entrada en el historial del
      // iframe. Con `src` acumulaba una por cada visita y el botón «atrás»
      // del móvil se ponía a recorrer páginas fantasma en vez de salir.
      this.marco.contentWindow?.location.replace("about:blank");
    } catch {
      this.marco.src = "about:blank";
    }
    // Y se le quita el atributo. El documento ya está descargado, pero el
    // `src` seguía escrito en el HTML, y un iframe con `src` puesto vuelve a
    // cargarlo solo si el navegador tiene que recrear el marco. Sin atributo
    // no hay a qué volver: la página se enciende otra vez en `enter()` y sólo
    // ahí.
    this.marco.removeAttribute("src");
  }

  async leave(direction) {
    await super.leave(direction);
    this.#apagar();
    this.root?.classList.remove("is-entered");
  }

  destroy() {
    this.#apagar();
    this.marco = null;
    this.fondo = null;
    super.destroy();
  }

  // ---- El invitado, acomodado -------------------------------------------

  /**
   * Le da al documento invitado lo mínimo para vivir dentro de una hoja.
   *
   * Se hace desde aquí y no pidiéndole a él que lo escriba en cada archivo
   * porque la gracia de esto es que pueda soltar un HTML cualquiera —uno
   * que le hayan pasado, uno de hace años— y encaje.
   */
  #acomodar() {
    const doc = this.#documento();
    if (!doc?.head) return;

    // 1. EL VIEWPORT. Es lo primero y lo más importante.
    //    Un documento sin `viewport` dentro de un iframe en iOS se maqueta a
    //    980 px de ancho y luego se encoge: todo sale diminuto y borroso, que
    //    es exactamente el «se ve gigantesco / se ve raro» de siempre. Con
    //    esto, un píxel del invitado es un píxel de la hoja.
    if (!doc.querySelector("meta[name=viewport]")) {
      const meta = doc.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
      doc.head.prepend(meta);
    }

    // 2. LOS CIMIENTOS. Van los PRIMEROS del `head` para que cualquier cosa
    //    que él escriba después gane sin tener que pelear con `!important`.
    if (!doc.getElementById("libro-cimientos")) {
      const hoja = doc.createElement("style");
      hoja.id = "libro-cimientos";
      hoja.textContent = CIMIENTOS;
      doc.head.prepend(hoja);
    }

    // 3. LOS COLORES DEL LIBRO, por si los quiere.
    //    Con `var(--acento)` su página va a juego con el capítulo sin que él
    //    tenga que copiar ningún hexadecimal.
    this.#prestarColores(doc);

    // 4. ¿SU PÁGINA ES CLARA O ES OSCURA?
    this.#mirarLuz(doc);
  }

  /**
   * Averigua si el archivo invitado es claro u oscuro, y avisa al libro.
   *
   * ── POR QUÉ HACE FALTA ────────────────────────────────────────────────
   * El libro echa una viñeta por encima de TODO, y su fuerza depende de lo
   * que haya debajo: sobre papel pesa la mitad, porque oscurecer un crema
   * con un casi negro le quita el color antes que la luz y las esquinas se
   * van a un gris de fotocopia.
   *
   * Hasta ahora esta página decía SIEMPRE que era clara. Con un archivo de
   * papel es verdad. Pero en cuanto alguien deja aquí una escena nocturna
   * —un cielo estrellado, una ventana de noche— la suposición es falsa: esa
   * página se llevaba media viñeta y perdía el borde oscuro que es justo lo
   * que la hace parecer una escena y no un recorte.
   *
   * ── CÓMO SE AVERIGUA ──────────────────────────────────────────────────
   * Primero se le pregunta a él, con la etiqueta estándar que existe para
   * esto:
   *
   *     <meta name="color-scheme" content="dark">
   *
   * Y si no dice nada, se mira el fondo que tenga puesto de verdad en su
   * `<html>` o su `<body>`. Lo que NO se hace es adivinar mirando píxeles:
   * un lienzo no tiene color de fondo en CSS y la respuesta saldría mal
   * justo en las páginas que más oscuras son.
   */
  #mirarLuz(doc) {
    let oscura = false;

    const meta = doc.querySelector('meta[name="color-scheme"]')?.content || "";
    if (/dark/i.test(meta) && !/light/i.test(meta)) {
      oscura = true;
    } else {
      // El primero de los dos que tenga un fondo opaco manda.
      for (const nodo of [doc.body, doc.documentElement]) {
        if (!nodo) continue;
        const fondo = doc.defaultView?.getComputedStyle(nodo).backgroundColor;
        const n = (fondo || "").match(/[\d.]+/g)?.map(Number);
        if (!n || n.length < 3) continue;
        if (n[3] !== undefined && n[3] < 0.6) continue;   // translúcido: no cuenta
        // Luminosidad rápida: el verde pesa lo que pesa en la vista.
        const luz = (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) / 255;
        oscura = luz < 0.42;
        break;
      }
    }

    this.oscura = oscura;
    if (this.root) this.root.dataset.claro = oscura ? "false" : "true";
    // Y si esta página ya está en pantalla, el libro se entera ahora mismo:
    // el archivo llega después de la transición, así que a estas alturas la
    // viñeta ya está puesta con la suposición de antes.
    if (this.active) {
      document.documentElement.classList.toggle("hoja-clara", !oscura);
    }
  }

  /**
   * El libro ha cambiado de habitación mientras esta página estaba abierta.
   *
   * Los colores se le prestan al invitado UNA VEZ, al cargarse, copiando los
   * tokens del libro dentro de su documento. Eso está bien mientras la luz
   * no cambie, pero con los tres modos sí cambia: sin esto, pasar a modo
   * claro dejaba su página con el papel de la noche —crema oscuro sobre un
   * libro blanco— hasta que se saliera y se volviera a entrar.
   *
   * Volver a prestarlos es escribir unas cuantas variables en el elemento
   * raíz del invitado. Lo que él haya pintado encima no se toca.
   */
  alCambiarTema() {
    const doc = this.#documento();
    if (doc?.documentElement) this.#prestarColores(doc);
  }

  /** El documento de dentro, o null si aún no hay o no se deja tocar. */
  #documento() {
    try {
      return this.marco?.contentDocument || null;
    } catch {
      // Sólo pasaría si alguien apuntara esto a otro dominio. No es el caso,
      // pero una excepción aquí tumbaría la entrada a la página.
      return null;
    }
  }

  /**
   * Le pasa al invitado los colores y las medidas del libro.
   *
   * Los nombres van en español y son pocos a propósito: esto es una promesa
   * pública —lo que él puede usar en sus páginas— y cuanto más corta, más
   * fácil es no romperla nunca.
   */
  #prestarColores(doc) {
    const libro = getComputedStyle(document.documentElement);
    const hoja = getComputedStyle(this.root);
    const v = (nombre) => libro.getPropertyValue(nombre).trim();

    // La paleta que se le presta es la del capítulo YA LLEVADA a la
    // habitación del tema: la misma que ven el fondo y el papel. Prestando
    // la cruda, una página suya con `var(--acento)` se pintaba con el rosa
    // encendido de la noche mientras el libro entero estaba de día.
    const paleta = fondoDelTema(this.palette);

    const vars = {
      "--acento": paleta.a,
      "--acento-hondo": paleta.b,
      "--fondo": paleta.deep,
      // Los tres tonos del papel del libro y la luz que le entra por arriba.
      // Con ellos, la página que él escriba se pinta sobre el MISMO papel que
      // el resto del libro, teñido con el color de este capítulo.
      "--papel": v("--paper-100") || "#fbf0e8",
      "--papel-claro": v("--paper-000") || "#fffaf4",
      "--papel-hondo": v("--paper-200") || "#f3e2da",
      "--papel-luz": `rgba(${v("--paper-glow-rgb") || "255, 250, 242"}, 0.95)`,
      // El color por defecto del texto es la TINTA y no el marfil: detrás de
      // su página está el papel del libro, así que lo que no pinte fondo se
      // lee sobre crema. `--texto-claro` está para el caso contrario.
      "--texto": v("--paper-ink") || "#3d2a2b",
      "--texto-claro": v("--text") || "#fdeee9",
      "--tipo": v("--font-ui"),
      "--tipo-titulo": v("--font-display"),
      "--tipo-mano": v("--font-hand"),
      "--seguro-arriba": hoja.getPropertyValue("--safe-t").trim() || "0px",
      "--seguro-abajo": hoja.getPropertyValue("--safe-b").trim() || "0px",
      "--seguro-lado": hoja.getPropertyValue("--safe-l").trim() || "0px",
      // El hueco que ocupa la barra flotante del libro, para que no le tape
      // un botón al fondo de su página.
      "--hueco-barra": hoja.getPropertyValue("--bar-space").trim() || "0rem",
    };

    const raiz = doc.documentElement;
    for (const [nombre, valor] of Object.entries(vars)) {
      if (valor) raiz.style.setProperty(nombre, valor);
    }
  }

  /** Se pone el nombre que diga el `<title>` del archivo, si trae uno. */
  #ponerseElNombre() {
    const titulo = this.#documento()?.title?.trim();
    if (!titulo || !this.chapter) return;
    this.chapter.title = titulo;
    if (this.root) this.root.setAttribute("aria-label", titulo);
    if (this.marco) this.marco.title = titulo;
  }

  // ---- El puente de gestos ----------------------------------------------

  /**
   * Dentro de un iframe, el libro no ve el dedo.
   *
   * Los eventos de puntero no salen del documento invitado: es lo que hace
   * que sus botones funcionen perfectos, y también lo que dejaría la página
   * sin salida, porque el barrido que pasa la hoja tampoco llega.
   *
   * Así que se lo contamos. Se escucha dentro, en fase de captura y sin
   * estorbar (`passive`), y cuando el dedo hace un barrido horizontal QUE
   * EMPIEZA EN EL BORDE de la hoja, se le pide al libro que pase.
   *
   * ── POR QUÉ DESDE EL BORDE, Y NO DESDE CUALQUIER SITIO ────────────────
   * Antes valía desde cualquier sitio: si el dedo no caía encima de algo
   * «suyo», cualquier arrastre de más de 46 px hacia el lado pasaba la hoja.
   * Y eso, en una página que se juega arrastrando —cavar la arena, apartar
   * una esfera, limpiar un cristal—, es exactamente el defecto que se veía:
   * LA PÁGINA SE PASABA SOLA en mitad de lo que estabas haciendo. Un gesto
   * de juego y un gesto de pasar página eran el mismo gesto.
   *
   * Se intentó parchear por el otro lado, desde las propias páginas: cada
   * una dejaba unas franjas vacías en los lados y reclamaba el resto con
   * `data-claim-drag`. Es frágil por dos motivos: sólo protege a quien se
   * acuerde de hacerlo —un HTML cualquiera que él suelte aquí no lo hace—, y
   * en cuanto la franja no coincidía con la del libro, los dos gestos se
   * volvían a pisar.
   *
   * La regla buena es la que el libro ya usa en todas las demás páginas:
   * pasar hoja se pide DESDE EL BORDE. Dentro de la hoja el dedo es suyo,
   * entero, sin que tenga que declarar nada. Y desde el borde el barrido es
   * del libro, aunque debajo haya un lienzo a pantalla completa —por eso
   * `canvas` ya no está en `SUYO`—, salvo que ahí haya un botón, un campo o
   * algo marcado `[data-claim-drag]`, que siguen mandando.
   */
  #prestarGestos() {
    const doc = this.#documento();
    if (!doc) return;

    let gesto = null;

    const abajo = (e) => {
      gesto = null;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      // 1. ¿Empieza en el borde? Si no, no hay nada que hablar: el gesto es
      //    suyo y el libro ni se entera.
      //    Se mide cada vez, y no una: la hoja cambia de ancho al girar el
      //    teléfono, y una franja calculada en vertical se queda corta o
      //    larga en horizontal.
      const ancho = doc.documentElement?.clientWidth || this.marco?.clientWidth || 0;
      if (!ancho) return;
      const margen = Math.min(BANDA_MAX, Math.max(BANDA_MIN, ancho * BANDA_PROP));
      const desdeElBorde = e.clientX <= margen || e.clientX >= ancho - margen;
      if (!desdeElBorde) return;

      // 2. Empieza en el borde, pero puede haber algo suyo justo ahí.
      if (e.target?.closest?.(SUYO)) return;

      gesto = { id: e.pointerId, x: e.clientX, y: e.clientY, usado: false };
    };

    const mueve = (e) => {
      if (!gesto || gesto.usado) return;
      // El mismo dedo que empezó, y todavía apoyado. Sin esto, un dedo que
      // sale del marco y vuelve —o un ratón que se suelta fuera— dejaba el
      // gesto a medias, y el siguiente movimiento pasaba página sin que
      // nadie hubiera arrastrado nada.
      if (e.pointerId !== gesto.id) return;
      if (e.pointerType === "mouse" && e.buttons === 0) return void (gesto = null);

      const dx = e.clientX - gesto.x;
      const dy = e.clientY - gesto.y;
      if (Math.abs(dx) < BARRIDO || Math.abs(dx) < Math.abs(dy) * SESGO) return;

      gesto.usado = true;
      const router = this.ctx.router;
      if (dx < 0) router?.next();
      else router?.prev();
    };

    const arriba = () => {
      gesto = null;
    };

    const opciones = { capture: true, passive: true };
    doc.addEventListener("pointerdown", abajo, opciones);
    doc.addEventListener("pointermove", mueve, opciones);
    doc.addEventListener("pointerup", arriba, opciones);
    doc.addEventListener("pointercancel", arriba, opciones);

    // Se guarda cómo desengancharlo. Al vaciar el iframe estas escuchas se
    // van solas con su documento, pero soltarlas a mano deja el orden claro
    // y protege del caso raro de que el documento sobreviva a la salida.
    this.soltarGestos = () => {
      doc.removeEventListener("pointerdown", abajo, opciones);
      doc.removeEventListener("pointermove", mueve, opciones);
      doc.removeEventListener("pointerup", arriba, opciones);
      doc.removeEventListener("pointercancel", arriba, opciones);
    };
  }

  #soltarGestos() {
    try {
      this.soltarGestos?.();
    } catch {
      // El documento ya no está. Perfecto: no había nada que soltar.
    }
    this.soltarGestos = null;
  }

  // ---- Cuando algo va mal ------------------------------------------------

  #avisarRota() {
    if (this.roto || !this.fondo) return;
    this.roto = true;
    this.root?.classList.add("is-rota");
    this.fondo.replaceChildren(
      el("p.pagweb__aviso", { text: textos.rota }),
      el("p.pagweb__aviso-pista", { text: textos.rotaPista })
    );
    console.warn(`[paginas-html] no se pudo abrir "${this.entry.src}"`);
  }
}
