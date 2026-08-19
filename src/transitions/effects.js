/**
 * TRANSICIONES QUE NO SON PAPEL.
 *
 * Todas duran entre medio segundo y siete décimas. Antes rondaban el segundo,
 * y sumadas a la entrada de la página siguiente se iban a más de dos segundos
 * entre tocar y poder leer: bonito la primera vez, cansado a la quinta.
 *
 * El volteo de hoja es para las páginas de papel. Las páginas que viven en
 * WebGL (profundidad, constelación, campo de recuerdos) no pueden girarse
 * como una cartulina: allí la transición es de luz, de escala y de partículas.
 *
 * Todas comparten firma y devuelven una promesa que resuelve al terminar.
 */

import { tween } from "../utils/easing.js";
import {
  easeInOutExpo,
  easeOutExpo,
  easeOutQuint,
  easeOutCubic,
  easeInOutCubic,
} from "../utils/easing.js";

/**
 * Borra de una hoja TODO lo que una transición le haya escrito en línea.
 *
 * Esto no es cosmética: un estilo en línea gana siempre a una clase. Una hoja
 * que se fue con `opacity: 0` y media vuelta encima conservaba esos valores, y
 * al volver a ella pasando página el `leaf--under` no podía hacerla visible.
 * El resultado era una hoja fantasma durante todo el giro que aparecía de
 * golpe al terminar: el parpadeo más feo que tenía el libro.
 */
export function resetLeaf(node) {
  if (!node) return;
  const s = node.style;
  s.opacity = "";
  s.transform = "";
  s.transformOrigin = "";
  s.filter = "";
  s.willChange = "";
  s.clipPath = "";
  s.webkitClipPath = "";
  s.maskImage = "";
  s.webkitMaskImage = "";
}

/** Sin transición: aparece y ya. Para la portada al arrancar. */
export async function none({ outgoing, incoming }) {
  // Nada de `opacity: 0` en línea sobre la que se va: de ocultarla se encarga
  // la clase `leaf--hidden`, que el router pone justo después sin repintar.
  resetLeaf(outgoing);
  resetLeaf(incoming);
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
    duration: ctx.caps.reducedMotion ? 200 : 600,
    // Cúbica y no exponencial: la exponencial casi no tiene medio, hace todo
    // el recorrido en tres fotogramas y un fundido a pantalla completa así
    // no se lee como un fundido, se lee como un corte.
    ease: easeInOutCubic,
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
    duration: ctx.caps.reducedMotion ? 180 : 500,
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
    duration: ctx.caps.reducedMotion ? 200 : 580,
    ease: easeOutCubic,
    onUpdate: (t) => {
      if (outgoing) {
        outgoing.style.transform = `perspective(1200px) rotateY(${-sign * 70 * t}deg) translateZ(${-t * 120}px)`;
        // Aguanta un poco antes de empezar a irse: si se apaga desde el
        // primer instante, el pliegue se ve vacío por dentro.
        outgoing.style.opacity = String(Math.max(0, 1 - Math.max(0, t - 0.12) * 1.3));
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
    duration: ctx.caps.reducedMotion ? 200 : 660,
    ease: easeInOutCubic,
    onUpdate: (t) => {
      if (outgoing) {
        // La que se va se hunde un poco y pierde luz: da sensación de capas.
        // Y termina APAGADA del todo: antes se quedaba al 45% confiando en que
        // el diafragma la tapara, pero la página que entra es transparente en
        // muchas partes y quedaba un fantasma de la anterior encima, que
        // desaparecía de golpe al acabar. Ese salto era el parpadeo.
        outgoing.style.transform = `scale(${1 - t * 0.08})`;
        outgoing.style.opacity = String(Math.max(0, 1 - Math.max(0, t - 0.08) * 1.2));
        outgoing.style.filter = `brightness(${1 - t * 0.5})`;
      }
      if (incoming) {
        // Hasta 150%: el círculo tiene que rebasar las esquinas.
        // El radio no crece con el tiempo sino con la RAÍZ del tiempo: lo que
        // se ve es el área del círculo, que va con el cuadrado del radio. Con
        // un radio lineal, la mitad de la pantalla cambiaba en tres
        // fotogramas y el diafragma parecía un corte.
        const r = Math.pow(t, 0.62) * 150;
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

/**
 * SLIDE — la página nueva empuja a la anterior.
 *
 * La que se va no acompaña al mismo paso: se retrasa, se hunde un poco y
 * pierde luz. Esa diferencia de velocidad entre las dos capas es lo que le da
 * profundidad al movimiento en vez de dejarlo en un carrusel.
 */
export async function slide({ outgoing, incoming, direction, ctx }) {
  const sign = direction === "prev" ? -1 : 1;

  if (incoming) {
    incoming.style.transform = `translate3d(${sign * 100}%, 0, 0)`;
    incoming.style.willChange = "transform";
    // Las hojas se transforman desde su centro: el origen normal es el lomo
    // (izquierda), y con él la que se va se encogía hacia ese lado dejando
    // un hueco del fondo a la vista antes de que llegara la nueva.
    incoming.style.transformOrigin = "center";
  }
  if (outgoing) {
    outgoing.style.willChange = "transform, filter, opacity";
    outgoing.style.transformOrigin = "center";
  }

  ctx.audio?.play("turn", { volume: 0.5, rate: 1.12 });
  ctx.haptics?.play("tick");

  await tween({
    duration: ctx.caps.reducedMotion ? 180 : 500,
    ease: easeOutQuint,
    onUpdate: (t) => {
      if (outgoing) {
        // A un tercio de velocidad: la de debajo apenas se mueve. Y no se
        // apaga hasta el final: mientras la nueva no la haya tapado del todo,
        // apagarla sólo deja el fondo a la vista.
        outgoing.style.transform = `translate3d(${-sign * t * 26}%, 0, 0)`;
        outgoing.style.filter = `brightness(${1 - t * 0.45})`;
        outgoing.style.opacity = String(Math.max(0, 1 - Math.max(0, t - 0.88) * 8));
      }
      if (incoming) {
        incoming.style.transform = `translate3d(${sign * (1 - t) * 100}%, 0, 0)`;
      }
    },
  });

  cleanup(outgoing, incoming);
}

/**
 * INK — una mancha de tinta que se extiende.
 *
 * La página nueva no aparece: cala. Tres círculos de distinto tamaño crecen a
 * ritmos distintos desde puntos cercanos, y al solaparse dan un borde
 * irregular que ningún círculo solo consigue. Va con máscara, que el navegador
 * compone en la GPU.
 */
export async function ink({ outgoing, incoming, direction, ctx }) {
  // Semilla estable por dirección: hacia delante la tinta cae arriba a la
  // izquierda, hacia atrás abajo a la derecha. Así el gesto tiene sentido.
  const blots =
    direction === "prev"
      ? [[68, 74, 1], [44, 62, 0.72], [82, 52, 0.55]]
      : [[34, 30, 1], [58, 44, 0.74], [22, 56, 0.58]];

  if (incoming) {
    incoming.style.willChange = "mask-image, transform";
    incoming.style.transform = "scale(1.04)";
  }
  if (outgoing) outgoing.style.willChange = "opacity, filter";

  ctx.gl?.pulse(0.6);
  ctx.audio?.play("turn", { volume: 0.42, rate: 0.92 });
  ctx.haptics?.play("turn");

  const mask = (t) =>
    blots
      .map(([x, y, speed]) => {
        // El exponente por encima de 1 hace que arranque despacio: una
        // mancha de tinta empieza pequeña y se acelera al extenderse. Con
        // exponente 0.7 hacía justo lo contrario y se abría de golpe.
        const r = Math.pow(Math.max(0, t) * speed, 1.7) * 178;
        // `ellipse` y no `circle`: la sintaxis `circle` sólo admite un radio
        // en longitud, no en porcentaje. Con porcentaje el valor entero es
        // inválido, el navegador lo descarta sin decir nada y la máscara no
        // se llegaba a aplicar: la tinta no se veía por ninguna parte.
        return `radial-gradient(ellipse ${r.toFixed(1)}% ${r.toFixed(1)}% at ${x}% ${y}%, #000 62%, transparent 100%)`;
      })
      .join(", ");

  await tween({
    duration: ctx.caps.reducedMotion ? 200 : 700,
    ease: easeInOutCubic,
    // La mancha va con el progreso CRUDO y no con el suavizado: encadenar la
    // curva de la tinta con una curva de easing daba una aceleración tan
    // brutal que la página entera se cubría en la primera mitad y la segunda
    // no pasaba nada. La aceleración ya la pone la propia tinta.
    onUpdate: (t, raw) => {
      if (incoming) {
        const m = mask(raw);
        incoming.style.webkitMaskImage = m;
        incoming.style.maskImage = m;
        incoming.style.transform = `scale(${1.04 - t * 0.04})`;
      }
      if (outgoing) {
        outgoing.style.opacity = String(Math.max(0, 1 - Math.max(0, raw - 0.5) * 2));
        outgoing.style.filter = `brightness(${1 - t * 0.4})`;
      }
    },
  });

  if (incoming) {
    incoming.style.webkitMaskImage = "";
    incoming.style.maskImage = "";
  }
  cleanup(outgoing, incoming);
}

/**
 * TIDE — la página nueva sube como la marea, con el borde ondulado.
 *
 * El borde no es una línea recta: es una ola que además se aplana conforme
 * llega arriba, como el agua cuando pierde fuerza. Se dibuja con un polígono
 * de trece puntos que se recalcula en cada fotograma.
 */
export async function tide({ outgoing, incoming, direction, ctx }) {
  const up = direction !== "prev";
  const POINTS = 13;

  if (incoming) {
    incoming.style.willChange = "clip-path, transform";
    incoming.style.transform = `translate3d(0, ${up ? 6 : -6}%, 0)`;
  }
  if (outgoing) outgoing.style.willChange = "opacity, filter, transform";

  ctx.audio?.play("turn", { volume: 0.44, rate: 0.86 });
  ctx.haptics?.play("turn");

  await tween({
    duration: ctx.caps.reducedMotion ? 200 : 700,
    ease: easeInOutCubic,
    onUpdate: (t) => {
      if (incoming) {
        // El nivel del agua, con margen para que la ola no destape las esquinas.
        const level = up ? 112 - t * 124 : -12 + t * 124;
        // La ola se calma conforme sube.
        const amp = (1 - t) * 5.5;
        const pts = [];
        for (let i = 0; i <= POINTS; i++) {
          const x = (i / POINTS) * 100;
          const wave = Math.sin(i / POINTS * Math.PI * 2.4 + t * 5.5) * amp;
          pts.push(`${x.toFixed(1)}% ${(level + wave).toFixed(2)}%`);
        }
        const closing = up ? "100% 100%, 0% 100%" : "100% 0%, 0% 0%";
        const clip = `polygon(${pts.join(", ")}, ${closing})`;
        incoming.style.clipPath = clip;
        incoming.style.webkitClipPath = clip;
        incoming.style.transform = `translate3d(0, ${(up ? 6 : -6) * (1 - t)}%, 0)`;
      }
      if (outgoing) {
        outgoing.style.transform = `translate3d(0, ${(up ? -1 : 1) * t * 7}%, 0) scale(${1 - t * 0.04})`;
        outgoing.style.opacity = String(Math.max(0, 1 - Math.max(0, t - 0.3) * 1.6));
        outgoing.style.filter = `brightness(${1 - t * 0.35})`;
      }
    },
  });

  if (incoming) {
    incoming.style.clipPath = "";
    incoming.style.webkitClipPath = "";
  }
  cleanup(outgoing, incoming);
}

/**
 * BLOOM — la página nueva se abre como una flor y se enfoca.
 *
 * Es prima del zoom pero sin travelling: no atraviesa nada, se abre en el
 * sitio. Empieza pequeña, muy desenfocada y demasiado luminosa, y va cerrando
 * hasta su tamaño real. Para las páginas íntimas, donde un travelling sería
 * demasiado aparatoso.
 */
export async function bloom({ outgoing, incoming, ctx }) {
  const blur = ctx.caps.budget.blur;

  if (incoming) {
    incoming.style.opacity = "0";
    incoming.style.transform = "scale(0.9)";
    incoming.style.willChange = "opacity, transform, filter";
  }
  if (outgoing) outgoing.style.willChange = "opacity, transform, filter";

  ctx.gl?.pulse(0.8);
  ctx.gl?.flash(0.22);
  ctx.audio?.play("open", { volume: 0.3, rate: 1.5 });
  ctx.haptics?.play("reveal");

  await tween({
    duration: ctx.caps.reducedMotion ? 200 : 660,
    // Cúbica y no quíntica: la quíntica se come el 80% del recorrido en el
    // primer tercio y la flor se abría de un tirón.
    ease: easeOutCubic,
    onUpdate: (t) => {
      if (outgoing) {
        outgoing.style.transform = `scale(${1 + t * 0.06})`;
        outgoing.style.opacity = String(Math.max(0, 1 - t * 1.35));
        if (blur) outgoing.style.filter = `blur(${t * 10}px)`;
      }
      if (incoming) {
        const it = Math.max(0, (t - 0.12) / 0.88);
        incoming.style.transform = `scale(${0.9 + it * 0.1})`;
        incoming.style.opacity = String(Math.min(1, it * 1.25));
        if (blur) {
          incoming.style.filter = `blur(${(1 - it) * 13}px) brightness(${1 + (1 - it) * 0.35})`;
        }
      }
    },
  });

  cleanup(outgoing, incoming);
}

/**
 * Deja las DOS hojas sin un solo estilo en línea.
 *
 * Antes sólo se limpiaba la que entraba, y la que se iba se quedaba con su
 * `opacity: 0` y su transformación puestas para siempre. Eso rompía la
 * siguiente transición que la tocara.
 */
function cleanup(outgoing, incoming) {
  resetLeaf(outgoing);
  resetLeaf(incoming);
}

export const effects = { none, dissolve, zoom, fold, iris, slide, ink, tide, bloom };
