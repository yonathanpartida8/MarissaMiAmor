/**
 * TRANSICIONES QUE NO SON PAPEL.
 *
 * El volteo de hoja es para las páginas de papel. Las páginas que viven en
 * WebGL (profundidad, constelación, campo de recuerdos) no pueden girarse
 * como una cartulina: allí la transición es de luz, de escala y de partículas.
 *
 * Todas comparten firma y devuelven una promesa que resuelve al terminar.
 */

import { tween } from "../utils/easing.js";
import { easeInOutExpo, easeOutExpo, easeOutQuint } from "../utils/easing.js";

/** Sin transición: aparece y ya. Para la portada al arrancar. */
export async function none({ outgoing, incoming }) {
  if (outgoing) outgoing.style.opacity = "0";
  if (incoming) {
    incoming.style.opacity = "1";
    incoming.style.transform = "";
  }
}

/**
 * DISSOLVE — la página anterior se deshace en luz mientras la nueva se
 * condensa. Con un barrido de brillo que cruza la pantalla en el medio.
 */
export async function dissolve({ outgoing, incoming, direction, ctx }) {
  const shift = direction === "prev" ? -1 : 1;
  const blur = ctx.caps.budget.blur;

  if (incoming) {
    incoming.style.opacity = "0";
    incoming.style.transform = `scale(1.05) translate3d(${shift * 3}%,0,0)`;
    incoming.style.willChange = "opacity, transform, filter";
  }
  if (outgoing) outgoing.style.willChange = "opacity, transform, filter";

  ctx.gl?.pulse(0.85);
  ctx.audio?.play("turn", { volume: 0.45, rate: 1.2 });

  await tween({
    duration: ctx.caps.reducedMotion ? 220 : 820,
    ease: easeInOutExpo,
    onUpdate: (t) => {
      if (outgoing) {
        outgoing.style.opacity = String(1 - Math.min(1, t * 1.6));
        outgoing.style.transform = `scale(${1 - t * 0.06}) translate3d(${-shift * t * 5}%,0,0)`;
        if (blur) outgoing.style.filter = `blur(${t * 14}px) brightness(${1 + t * 0.5})`;
      }
      if (incoming) {
        const it = Math.max(0, (t - 0.28) / 0.72);
        incoming.style.opacity = String(it);
        incoming.style.transform = `scale(${1.05 - it * 0.05}) translate3d(${shift * (1 - it) * 3}%,0,0)`;
        if (blur) incoming.style.filter = `blur(${(1 - it) * 10}px)`;
      }
    },
  });

  cleanup(outgoing, incoming);
}

/**
 * ZOOM — travelling cinematográfico. La cámara atraviesa la página actual y
 * aterriza en la siguiente. Es la transición de los momentos importantes.
 */
export async function zoom({ outgoing, incoming, direction, ctx }) {
  const forward = direction !== "prev";
  const blur = ctx.caps.budget.blur;

  if (incoming) {
    incoming.style.opacity = "0";
    incoming.style.transform = `scale(${forward ? 0.82 : 1.24})`;
    incoming.style.willChange = "opacity, transform, filter";
  }
  if (outgoing) outgoing.style.willChange = "opacity, transform, filter";

  ctx.gl?.pulse(1);
  ctx.gl?.flash(0.5);
  ctx.audio?.play("open", { volume: 0.35, rate: 1.35 });
  ctx.haptics?.play("reveal");

  await tween({
    duration: ctx.caps.reducedMotion ? 240 : 1050,
    ease: easeOutQuint,
    onUpdate: (t) => {
      if (outgoing) {
        const s = forward ? 1 + t * 0.55 : 1 - t * 0.22;
        outgoing.style.transform = `scale(${s})`;
        outgoing.style.opacity = String(Math.max(0, 1 - t * 1.7));
        if (blur) outgoing.style.filter = `blur(${t * 22}px)`;
      }
      if (incoming) {
        const it = Math.max(0, (t - 0.22) / 0.78);
        const s = forward ? 0.82 + it * 0.18 : 1.24 - it * 0.24;
        incoming.style.transform = `scale(${s})`;
        incoming.style.opacity = String(Math.min(1, it * 1.3));
        if (blur) incoming.style.filter = `blur(${(1 - it) * 16}px)`;
      }
    },
  });

  cleanup(outgoing, incoming);
}

/**
 * FOLD — la página se pliega sobre sí misma, como una carta que se guarda,
 * y la nueva se despliega. Perspectiva de verdad, no un simple escalado.
 */
export async function fold({ outgoing, incoming, direction, ctx }) {
  const sign = direction === "prev" ? -1 : 1;

  if (incoming) {
    incoming.style.opacity = "0";
    incoming.style.transformOrigin = sign > 0 ? "left center" : "right center";
    incoming.style.transform = `perspective(1200px) rotateY(${sign * 62}deg)`;
    incoming.style.willChange = "opacity, transform";
  }
  if (outgoing) {
    outgoing.style.transformOrigin = sign > 0 ? "right center" : "left center";
    outgoing.style.willChange = "opacity, transform, filter";
  }

  ctx.audio?.play("turn", { volume: 0.7, rate: 0.88 });
  ctx.haptics?.play("turn");

  await tween({
    duration: ctx.caps.reducedMotion ? 220 : 780,
    ease: easeOutExpo,
    onUpdate: (t) => {
      if (outgoing) {
        outgoing.style.transform = `perspective(1200px) rotateY(${-sign * 70 * t}deg) translateZ(${-t * 120}px)`;
        outgoing.style.opacity = String(1 - t * 1.15);
        outgoing.style.filter = `brightness(${1 - t * 0.55})`;
      }
      if (incoming) {
        const it = Math.max(0, (t - 0.2) / 0.8);
        incoming.style.transform = `perspective(1200px) rotateY(${sign * 62 * (1 - it)}deg)`;
        incoming.style.opacity = String(it);
      }
    },
  });

  cleanup(outgoing, incoming);
}

/**
 * IRIS — la página nueva se abre en círculo desde el centro, como el
 * diafragma de una cámara. Va con clip-path, que el navegador compone en la
 * GPU: es de las transiciones más baratas que hay y de las que más se notan.
 */
export async function iris({ outgoing, incoming, direction, ctx }) {
  const forward = direction !== "prev";

  if (incoming) {
    incoming.style.clipPath = "circle(0% at 50% 50%)";
    incoming.style.webkitClipPath = "circle(0% at 50% 50%)";
    incoming.style.transform = `scale(${forward ? 1.08 : 0.96})`;
    incoming.style.opacity = "1";
    incoming.style.willChange = "clip-path, transform";
  }
  if (outgoing) outgoing.style.willChange = "transform, filter, opacity";

  ctx.gl?.pulse(0.7);
  ctx.audio?.play("turn", { volume: 0.4, rate: 1.05 });
  ctx.haptics?.play("turn");

  await tween({
    duration: ctx.caps.reducedMotion ? 220 : 900,
    ease: easeInOutExpo,
    onUpdate: (t) => {
      if (outgoing) {
        // La que se va se hunde un poco y pierde luz: da sensación de capas.
        outgoing.style.transform = `scale(${1 - t * 0.08})`;
        outgoing.style.opacity = String(1 - t * 0.55);
        outgoing.style.filter = `brightness(${1 - t * 0.5})`;
      }
      if (incoming) {
        // Hasta 150%: el círculo tiene que rebasar las esquinas.
        const r = t * 150;
        const clip = `circle(${r.toFixed(1)}% at 50% 50%)`;
        incoming.style.clipPath = clip;
        incoming.style.webkitClipPath = clip;
        const s = forward ? 1.08 - t * 0.08 : 0.96 + t * 0.04;
        incoming.style.transform = `scale(${s.toFixed(4)})`;
      }
    },
  });

  if (incoming) {
    incoming.style.clipPath = "";
    incoming.style.webkitClipPath = "";
  }
  cleanup(outgoing, incoming);
}

/** Deja las hojas sin restos de estilos en línea. */
function cleanup(outgoing, incoming) {
  for (const node of [outgoing, incoming]) {
    if (!node) continue;
    node.style.filter = "";
    node.style.willChange = "";
    node.style.transformOrigin = "";
  }
  if (incoming) {
    incoming.style.opacity = "";
    incoming.style.transform = "";
  }
}

export const effects = { none, dissolve, zoom, fold, iris };
