/**
 * ACTUALIZAR SIN REHACER — para lo que se repinta mucho (la línea de tiempo).
 *
 * Se arma lo nuevo fuera de la pantalla y se compara con lo que ya está:
 * sólo se tocan los atributos y textos que cambiaron. Los nodos que ya
 * existen se quedan (con su capa en la GPU, su foco y su desplazamiento),
 * así elegir o arrastrar algo nunca hace parpadear nada.
 *
 * `data-k` identifica un nodo entre sus hermanos (si cambia, se reemplaza).
 * Los manejadores de eventos van delegados en un contenedor fijo: a un nodo
 * reutilizado no le llegan los `onClick` del nuevo.
 */
const igual = (x, y) => x.nodeType === y.nodeType && x.nodeName === y.nodeName
  && (x.nodeType !== 1 || (x.getAttribute("data-k") || "") === (y.getAttribute("data-k") || ""));

export function parchear(a, b) {
  if (a.nodeType !== 1) { if (a.data !== b.data) a.data = b.data; return; }
  const na = a.attributes, nb = b.attributes;
  for (let i = na.length - 1; i >= 0; i--) { const n = na[i].name; if (!b.hasAttribute(n)) a.removeAttribute(n); }
  for (let i = 0; i < nb.length; i++) { const { name, value } = nb[i]; if (a.getAttribute(name) !== value) a.setAttribute(name, value); }
  hijos(a, b);
}

/** Deja los hijos de `a` como los de `b` (moviendo a `a` los nodos nuevos de `b`). */
export function hijos(a, b) {
  const nuevos = Array.from(b.childNodes);
  for (let i = 0; i < nuevos.length; i++) {
    const y = nuevos[i], x = a.childNodes[i];
    if (x && igual(x, y)) parchear(x, y);
    else if (x) a.replaceChild(y, x);
    else a.appendChild(y);
  }
  while (a.childNodes.length > nuevos.length) a.removeChild(a.lastChild);
}
