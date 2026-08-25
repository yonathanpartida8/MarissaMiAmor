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
    /* El dedo se mueve arriba y abajo dentro de la página; el barrido
       horizontal es del libro, que es quien pasa la hoja. Cualquier cosa
       suya que necesite el gesto entero lo pide con [data-claim-drag]. */
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

/** Lo que, si se toca, es suyo: el libro no le quita el dedo. */
const SUYO =
  "a,button,input,select,textarea,label,summary,canvas,video,audio," +
  "[contenteditable],[data-claim-drag],[role=button],[role=slider],[role=tab]";

/** Cuánto tiene que correr el dedo en horizontal para que pase la hoja. */
const BARRIDO = 46;

/** Y cuánto más horizontal que vertical, para no robarle un desplazamiento. */
const SESGO = 1.5;

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
    await fetch(src).catch(() => {});
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
      allow: "autoplay; fullscreen",
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
        if (!ventana || ventana.location.href === "about:blank") return;

        this.#acomodar();
        this.#prestarGestos();
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

    const vars = {
      "--acento": this.palette.a,
      "--acento-hondo": this.palette.b,
      "--fondo": this.palette.deep,
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
   * estorbar (`passive`), y cuando el dedo hace un barrido claramente
   * horizontal sobre algo que NO es suyo, se le pide al libro que pase.
   *
   * Lo que es suyo —botones, enlaces, campos, lienzos, o cualquier cosa
   * marcada con `data-claim-drag`— no se toca jamás.
   */
  #prestarGestos() {
    const doc = this.#documento();
    if (!doc) return;

    let gesto = null;

    const abajo = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const suyo = e.target?.closest?.(SUYO);
      gesto = suyo ? null : { id: e.pointerId, x: e.clientX, y: e.clientY, usado: false };
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
