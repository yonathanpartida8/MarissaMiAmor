/**
 * MINIATURAS QUIETAS (Fase 42) — los SVG animados, quietos en las listas y vivos al pasarles el ratón.
 *
 * Un SVG animado puesto como <img> obliga al navegador a recalcular estilos, diseño y pintura de la
 * pantalla ENTERA en cada cuadro: con el panel de Elementos abierto eran 60 veces por segundo (unos
 * 110 ms de cada segundo, con el editor quieto). En las listas se ve un cuadrito de su animación (no el
 * primero, que a veces es transparente); al pasarle el ratón o enfocarlo, se mueve. En la hoja y en el
 * librito se mueve siempre: esto sólo toca las miniaturas.
 */
import { el } from "../components/ui.js";

const ANIMADO = /@keyframes|<animate|<set\b|animation\s*:/i;
const SMIL = /<(animate|animateTransform|animateMotion|set)\b[^>]*?(\/>|>[\s\S]*?<\/\1>)/gi;
const FIJO = "<style>*,*::before,*::after{animation-play-state:paused!important;animation-delay:-.8s!important;transition:none!important}</style>";
const cache = new Map(); // url → Promise<url de la versión quieta | null si no se mueve>

function quieta(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => (r.ok ? r.text() : "")).then((t) => {
      if (!t || !ANIMADO.test(t)) return null;
      const fijo = t.replace(SMIL, "").replace(/<svg\b[^>]*>/i, (m) => m + FIJO);
      return URL.createObjectURL(new Blob([fijo], { type: "image/svg+xml" }));
    }).catch(() => null));
  }
  return cache.get(url);
}

/** Un <img> para una lista: si es un SVG animado, quieto hasta que lo señalas. */
export function miniatura(url, attrs = {}) {
  const img = el("img", { alt: "", loading: "lazy", decoding: "async", draggable: "false", ...attrs });
  if (!/\.svg([?#]|$)/i.test(url)) { img.src = url; return img; }
  quieta(url).then((q) => {
    img.src = q || url;
    if (!q) return;
    const caja = img.closest("button") || img.parentElement || img;
    const vivo = () => { img.src = url; }, quieto = () => { img.src = q; };
    caja.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") vivo(); });
    caja.addEventListener("pointerleave", quieto);
    caja.addEventListener("focusin", vivo);
    caja.addEventListener("focusout", quieto);
  });
  return img;
}
