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
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Fija variables CSS personalizadas de una tacada. */
export function setVars(node, vars) {
  for (const [key, value] of Object.entries(vars)) {
    if (value == null) continue;
    node.style.setProperty(key.startsWith("--") ? key : `--${key}`, String(value));
  }
}

/** Espera a que termine la transición/animación CSS de un elemento. */
export function afterTransition(node, fallback = 1200) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      node.removeEventListener("transitionend", finish);
      node.removeEventListener("animationend", finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, fallback);
    node.addEventListener("transitionend", finish, { once: true });
    node.addEventListener("animationend", finish, { once: true });
  });
}

/** Fuerza un reflow para que la siguiente clase sí anime. */
export const reflow = (node) => node.offsetHeight;

export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

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

/** Divide un texto en <span> por palabra, para animarlas escalonadas. */
export function splitWords(text, className = "word") {
  const frag = document.createDocumentFragment();
  const words = String(text).split(/(\s+)/);
  let index = 0;
  for (const chunk of words) {
    if (/^\s+$/.test(chunk)) {
      frag.append(document.createTextNode(chunk));
      continue;
    }
    const span = el(`span.${className}`, { text: chunk });
    span.style.setProperty("--i", index++);
    frag.append(span);
  }
  return { frag, count: index };
}
