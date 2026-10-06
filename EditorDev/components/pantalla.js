/**
 * LA PANTALLA Y EL TECLADO DEL TELÉFONO
 *
 * Cuando sale el teclado, cada sistema hace algo distinto:
 *   Android   achica la página (como si la pantalla fuera más bajita)
 *   iPhone    no la achica: el teclado TAPA la parte de abajo y a veces
 *             corre la vista hacia arriba
 * Aquí se mide lo que de verdad se ve (`visualViewport`) y se deja en
 * variables de CSS para que todo se acomode al espacio que queda:
 *   --vvh  alto visible     --vvt  cuánto se corrió la vista     --kb  alto del teclado
 *   body.con-teclado   mientras se escribe con el teclado abierto
 *   body.acostado      teléfono acostado (por la orientación de la PANTALLA,
 *                      no por el tamaño de la ventana: el teclado no lo cambia)
 *
 * Así: nada se agranda ni se reacomoda «como si se hubiera girado» al salir
 * el teclado, las barras de abajo y las hojas suben por encima de él, y el
 * campo que se está escribiendo se queda a la vista.
 */
const CAMPO = "input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=color]):not([type=button]):not([type=file]), textarea, select, [contenteditable='true'], [contenteditable='']";

/** Vertical u horizontal según la pantalla (no según la ventana, que el teclado achica). */
export function orientacion() {
  const t = screen.orientation?.type;
  if (t) return t.startsWith("landscape") ? "h" : "v";
  if (typeof window.orientation === "number") return Math.abs(window.orientation) === 90 ? "h" : "v";
  return innerWidth > innerHeight ? "h" : "v";
}

export const escribiendo = () => { const a = document.activeElement; return !!(a && a !== document.body && a.matches?.(CAMPO)); };

export const PANTALLA = { teclado: false, kb: 0, alto: innerHeight, orientacion: orientacion() };

export function vigilarPantalla() {
  const raiz = document.documentElement;
  const body = document.body;
  const vv = window.visualViewport;
  let ori = orientacion();
  let altoLibre = innerHeight;          // el alto sin teclado en esta orientación
  let antes = "";
  const medir = () => {
    const o = orientacion();
    if (o !== ori) { ori = o; altoLibre = innerHeight; }
    const escr = escribiendo();
    if (!escr) altoLibre = innerHeight;
    else altoLibre = Math.max(altoLibre, innerHeight);
    const h = vv ? vv.height : innerHeight;
    const top = vv ? Math.max(0, vv.offsetTop) : 0;
    const kb = Math.max(0, Math.round(innerHeight - h - top));
    // Android achica la página (kb ≈ 0) e iPhone la tapa (kb > 0): las dos cuentan.
    const teclado = escr && (kb > 120 || innerHeight < altoLibre - 120);
    const firma = `${Math.round(h)}|${Math.round(top)}|${kb}|${teclado}|${o}`;
    if (firma === antes) return;
    antes = firma;
    raiz.style.setProperty("--vvh", Math.round(h) + "px");
    raiz.style.setProperty("--vvt", Math.round(top) + "px");
    raiz.style.setProperty("--kb", (teclado ? kb : 0) + "px");
    const cambio = teclado !== PANTALLA.teclado;
    Object.assign(PANTALLA, { teclado, kb: teclado ? kb : 0, alto: h, orientacion: o });
    body.classList.toggle("con-teclado", teclado);
    body.classList.toggle("acostado", o === "h" && Math.min(screen.width || innerWidth, screen.height || innerHeight) < 600);
    if (cambio) {
      if (teclado) {
        // Que el campo que se escribe quede a la vista (dentro de su panel).
        const a = document.activeElement;
        if (a && !a.isContentEditable) setTimeout(() => { try { a.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }); } catch (e) { /* nada */ } }, 60);
      } else if (scrollY || document.scrollingElement?.scrollTop) {
        // iPhone deja la página corrida al cerrar el teclado: de vuelta arriba.
        scrollTo(0, 0);
      }
      dispatchEvent(new CustomEvent("ed-teclado", { detail: { ...PANTALLA } }));
    }
  };
  let id = 0;
  const pronto = () => { if (!id) id = requestAnimationFrame(() => { id = 0; medir(); }); };
  vv?.addEventListener("resize", pronto);
  vv?.addEventListener("scroll", pronto);
  addEventListener("resize", pronto);
  addEventListener("orientationchange", () => setTimeout(medir, 250));
  document.addEventListener("focusin", () => setTimeout(pronto, 50));
  document.addEventListener("focusout", () => setTimeout(pronto, 120));
  medir();
}
