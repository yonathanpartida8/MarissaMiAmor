/**
 * Ayudantes de DOM. Sin librerías: sólo lo justo para que las páginas
 * se lean bien y no repitan `document.createElement` cien veces.
 */

/**
 * Crea un elemento.
 * @param {string} tag  "div", "div.clase", "button.a.b"
 * @param {object} [props] atributos; `class`, `text`, `html`, `style`(objeto), `dataset`
 * @param {(Node|string)[]} [children]
 */
export function el(tag, props = {}, children = []) {
  const [name, ...classes] = tag.split(".");
  const node = document.createElement(name || "div");
  if (classes.length) node.classList.add(...classes);

  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") node.classList.add(...String(value).split(/\s+/).filter(Boolean));
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "style" && typeof value === "object") Object.assign(node.style, value);
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? "" : String(value));
  }

  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const qs = (sel, root = document) => root.querySelector(sel);

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Lo mismo que `el`, pero para dibujos SVG: los atributos van tal cual
 * (`viewBox`, `d`, `pathLength`…) y `class` se escribe como atributo, que
 * es lo único que entienden los nodos SVG.
 */
export function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

/**
 * Fija variables CSS personalizadas de una tacada.
 *
 * Con memoria de lo último escrito, y NO es un detalle. Las variables CSS se
 * heredan: tocar una en la raíz de una página obliga al navegador a
 * recalcular el estilo de TODOS sus descendientes. Estas funciones se llaman
 * desde los relojes de cada página, sesenta veces por segundo, así que
 * escribir el mismo valor otra vez costaba treinta o cuarenta milisegundos de
 * recálculo por segundo con el libro parado. Ahora, si el valor no ha
 * cambiado, no se escribe: con el dedo quieto el coste baja a cero.
 *
 * Para que esto sirva, quien llame desde un reloj debe redondear lo que
 * manda; si no, el suavizado exponencial nunca deja de cambiar en el sexto
 * decimal y siempre parece un valor nuevo.
 */
const varMemory = new WeakMap();

export function setVars(node, vars) {
  // Se llama muchas veces desde temporizadores y animaciones; si para cuando
  // llega el turno la página ya se ha ido, no es un error: no hay nada que
  // pintar y no tiene por qué reventar nada.
  if (!node?.style) return;

  let seen = varMemory.get(node);
  if (!seen) varMemory.set(node, (seen = new Map()));

  for (const [key, value] of Object.entries(vars)) {
    if (value == null) continue;
    const name = key.startsWith("--") ? key : `--${key}`;
    const next = String(value);
    if (seen.get(name) === next) continue;
    seen.set(name, next);
    node.style.setProperty(name, next);
  }
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Registro de listeners con limpieza en bloque. Cada página crea el suyo
 * y lo vacía al desmontarse: cero fugas de memoria.
 */
export function listenerGroup() {
  const entries = [];
  return {
    on(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      entries.push([target, type, handler, options]);
      return handler;
    },
    clear() {
      for (const [target, type, handler, options] of entries) {
        target.removeEventListener(type, handler, options);
      }
      entries.length = 0;
    },
  };
}

/**
 * Divide un texto en <span> por palabra, para animarlas escalonadas.
 *
 * El retraso NO es lineal a propósito. Con `i * 26ms`, un párrafo de cien
 * palabras tardaba casi tres segundos en terminar de aparecer: las primeras
 * frases ya se estaban leyendo mientras las últimas seguían borrosas, y daba
 * la sensación de que la página iba lenta.
 *
 * Esta curva se satura: arranca igual de escalonada que antes —que es donde
 * se nota la gracia— y se va comprimiendo, sin pasar nunca de ~0,44 s. Los
 * textos cortos se ven idénticos; los largos, escritos de un tirón.
 */
const WORD_STEP = 17; // ms entre las primeras palabras
const WORD_SATURATION = 26; // a partir de aquí el escalonado se comprime

/** El texto tal cual, con cada salto de línea convertido en un párrafo corto. */
export function textoPlano(text) {
  const frag = document.createDocumentFragment();
  String(text).split(/\s*\n\s*/).forEach((trozo, i) => {
    if (i) frag.append(el("span.parrafo", { "aria-hidden": "true" }));
    frag.append(document.createTextNode(trozo));
  });
  return frag;
}

export function splitWords(text, className = "word") {
  const frag = document.createDocumentFragment();
  const words = String(text).split(/(\s+)/);

  // En gama baja el texto no se parte. Cien <span>, cada uno con su propia
  // animación, es la factura más cara de todo el libro en un móvil justo: la
  // página entra igual, con el fundido del contenedor, y va fluida.
  if (document.documentElement.dataset.tier === "low") {
    frag.append(textoPlano(text));
    return { frag, count: 0 };
  }

  const made = [];
  let index = 0;
  let last = null;

  for (const chunk of words) {
    if (/^\s+$/.test(chunk)) {
      const node = chunk.includes("\n")
        ? el("span.parrafo", { "aria-hidden": "true" })
        : document.createTextNode(chunk);
      made.push(node);
      frag.append(node);
      continue;
    }
    const span = el(`span.${className}`, { text: chunk });
    const delay = (WORD_STEP * index) / (1 + index / WORD_SATURATION);
    span.style.setProperty("--i", index);
    span.style.setProperty("--d", `${Math.round(delay)}ms`);
    index++;
    made.push(span);
    frag.append(span);
    last = span;
  }

  // Terminada la entrada, los <span> ya no pintan nada: se sustituyen por un
  // único nodo de texto. Un párrafo largo pasa de cien elementos con
  // animación viva —que el navegador sigue recalculando en cada frame— a uno
  // solo. Es lo que hace que las páginas de texto dejen de ir pesadas.
  if (last) {
    last.addEventListener(
      "animationend",
      () => {
        const parent = last.parentNode;
        if (!parent || !made[0]?.isConnected) return;
        parent.insertBefore(textoPlano(text), made[0]);
        for (const node of made) node.remove();
      },
      { once: true }
    );
  }

  return { frag, count: index };
}
