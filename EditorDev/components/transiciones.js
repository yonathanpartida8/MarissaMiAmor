/**
 * TRANSICIONES — pasar de una pantalla a otra (menú principal, perfil,
 * Detallitos…) con estilo y con su sonidito. Cada camino tiene la suya:
 *
 *   pagina     la hoja se da vuelta desde el lomo, como el librito
 *   regresa    la hoja vuelve (el «atrás» de «pagina»)
 *   circulo    la nueva crece en un círculo desde donde tocaste
 *   carta      la tarjeta gira y del otro lado está la nueva
 *   sobre      sale como una carta de su sobre, de abajo y con rebote
 *   zoom       la nueva llega desde el fondo y la anterior se va hacia ti
 *   deslizar   entra de lado y la anterior se va por el otro
 *   atras      lo mismo, al revés
 *
 * Sólo se animan transform, opacity y clip-path (lo que el teléfono mueve sin
 * volver a pintar): nada de parpadeos. La de antes se queda quieta, encima o
 * debajo, hasta que termina; la caja cambia de alto suave. Si llega otra antes
 * de acabar, la anterior termina al instante. Con «menos movimiento», un
 * fundido cortito y sin sonido de más.
 */
const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("ed-mov-nada");

const RESORTE = "cubic-bezier(.2, .9, .3, 1.15)", SUAVE = "cubic-bezier(.65, 0, .35, 1)", SALE = "cubic-bezier(.55, 0, .8, .4)", LLEGA = "cubic-bezier(.15, .85, .3, 1)";
const P = "perspective(1300px) ";

/** [sonido, duración, quién va encima, salida, entrada]. Los keyframes reciben el punto del toque (x, y) y el radio. */
const TIPOS = {
  pagina: ["pagina-cambiar", 760, "sale",
    { k: [{ transform: P + "rotateY(0)", opacity: 1, easing: SUAVE }, { transform: P + "rotateY(-104deg)", opacity: 0.35, offset: 0.85 }, { transform: P + "rotateY(-110deg)", opacity: 0 }], origen: "left center", easing: "linear" },
    { k: [{ transform: "scale(.965)", opacity: 0.25 }, { transform: "none", opacity: 1 }], easing: LLEGA }],
  regresa: ["pagina-cambiar", 720, "entra",
    { k: [{ transform: "none", opacity: 1 }, { transform: "scale(.965)", opacity: 0.2 }], easing: SUAVE },
    { k: [{ transform: P + "rotateY(-110deg)", opacity: 0, easing: "cubic-bezier(.3, 0, .4, 1)" }, { transform: P + "rotateY(-14deg)", opacity: 1, offset: 0.62, easing: "cubic-bezier(.3, .6, .4, 1.2)" }, { transform: P + "rotateY(0)", opacity: 1 }], origen: "left center", easing: "linear" }],
  circulo: ["abrir", 680, "entra",
    { k: [{ transform: "none", opacity: 1 }, { transform: "scale(.94)", opacity: 0.4 }], easing: SUAVE },
    { k: (x, y, r) => [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }], easing: "cubic-bezier(.7, 0, .2, 1)" }],
  // Cada mitad con su ritmo (un solo «easing» para todo encimaba las dos caras).
  carta: ["giro", 760, "entra",
    { k: [{ transform: P + "rotateY(0)", opacity: 1, easing: "cubic-bezier(.5, 0, .9, .5)" }, { transform: P + "rotateY(90deg) scale(.94)", opacity: 1, offset: 0.46 }, { transform: P + "rotateY(90deg) scale(.94)", opacity: 0, offset: 0.47 }, { transform: P + "rotateY(90deg) scale(.94)", opacity: 0 }], easing: "linear" },
    { k: [{ transform: P + "rotateY(-90deg) scale(.94)", opacity: 0 }, { transform: P + "rotateY(-90deg) scale(.94)", opacity: 0, offset: 0.46 }, { transform: P + "rotateY(-90deg) scale(.94)", opacity: 1, offset: 0.47, easing: "cubic-bezier(.15, .7, .35, 1.15)" }, { transform: P + "rotateY(0)", opacity: 1 }], easing: "linear" }],
  sobre: ["sobre", 700, "entra",
    { k: [{ transform: "none", opacity: 1 }, { transform: "translateY(-26px) scale(.93)", opacity: 0 }], easing: SALE, dur: 0.55 },
    { k: [{ transform: "translateY(70px) rotate(-2.5deg) scale(.9)", opacity: 0, easing: LLEGA }, { transform: "translateY(-6px) rotate(.6deg) scale(1.01)", opacity: 1, offset: 0.7, easing: SUAVE }, { transform: "none", opacity: 1 }], easing: "linear" }],
  zoom: ["restaurar", 620, "entra",
    { k: [{ transform: "none", opacity: 1 }, { transform: "scale(1.12)", opacity: 0 }], easing: SALE, dur: 0.6 },
    { k: [{ transform: "scale(.82)", opacity: 0 }, { transform: "none", opacity: 1 }], easing: RESORTE }],
  deslizar: ["desplazar", 520, "entra",
    { k: [{ transform: "none", opacity: 1 }, { transform: "translateX(-56px) scale(.97)", opacity: 0 }], easing: SALE, dur: 0.7 },
    { k: [{ transform: "translateX(64px) scale(.97)", opacity: 0 }, { transform: "none", opacity: 1 }], easing: RESORTE }],
  atras: ["atras", 500, "entra",
    { k: [{ transform: "none", opacity: 1 }, { transform: "translateX(56px) scale(.97)", opacity: 0 }], easing: SALE, dur: 0.7 },
    { k: [{ transform: "translateX(-64px) scale(.97)", opacity: 0 }, { transform: "none", opacity: 1 }], easing: RESORTE }],
};
export const NOMBRES = Object.keys(TIPOS);

/**
 * Pone `nuevo` en `caja` en lugar de lo que había, con la transición `tipo`.
 * `desde`: un elemento o un {x, y} de la pantalla (de donde crece «circulo»).
 * Devuelve una promesa que se cumple al terminar.
 */
export function cambiar(caja, nuevo, { tipo = "deslizar", sonidos = null, desde = null, sinSonido = false } = {}) {
  caja._terminar?.();
  const viejo = caja._actual && caja._actual.parentNode === caja ? caja._actual : null;
  caja._actual = nuevo;
  const t = TIPOS[tipo] || TIPOS.deslizar;
  if (!sinSonido && viejo) sonidos?.sonar(t[0]);
  if (!viejo) { caja.replaceChildren(nuevo); return Promise.resolve(); }
  if (getComputedStyle(caja).position === "static") caja.style.position = "relative";
  // La de antes se queda donde estaba, encima o debajo, sin moverse de lugar.
  const rc = caja.getBoundingClientRect(), rv = viejo.getBoundingClientRect();
  const h0 = rc.height;
  Object.assign(viejo.style, { position: "absolute", left: rv.left - rc.left + "px", top: rv.top - rc.top + "px", width: rv.width + "px", margin: "0", pointerEvents: "none" });
  viejo.setAttribute("aria-hidden", "true");
  viejo.inert = true;
  caja.append(nuevo);
  const h1 = caja.getBoundingClientRect().height;
  const encima = t[2] === "sale" ? viejo : nuevo;
  encima.style.zIndex = "2";
  (encima === viejo ? nuevo : viejo).style.zIndex = "1";
  const dur = quieto() ? 180 : t[1];
  const anims = [];
  if (quieto()) {
    anims.push(viejo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, fill: "both" }));
    anims.push(nuevo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, fill: "both" }));
  } else {
    const rn = nuevo.getBoundingClientRect();
    const p = desde?.getBoundingClientRect ? (() => { const r = desde.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : desde;
    const x = p ? p.x - rn.left : rn.width / 2, y = p ? p.y - rn.top : rn.height / 2;
    const radio = Math.hypot(Math.max(x, rn.width - x), Math.max(y, rn.height - y)) + 8;
    for (const [nodo, s] of [[viejo, t[3]], [nuevo, t[4]]]) {
      if (s.origen) nodo.style.transformOrigin = s.origen;
      nodo.style.backfaceVisibility = "hidden";
      nodo.style.willChange = "transform, opacity";
      const k = typeof s.k === "function" ? s.k(x, y, radio) : s.k;
      anims.push(nodo.animate(k, { duration: dur * (s.dur || 1), easing: s.easing, fill: "both" }));
    }
    if (Math.abs(h1 - h0) > 2) anims.push(caja.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: Math.min(dur, 560), easing: SUAVE }));
  }
  let hecho = false;
  const fin = () => {
    if (hecho) return;
    hecho = true;
    caja._terminar = null;
    for (const a of anims) { try { a.cancel(); } catch (e) { /* ya terminó */ } }
    viejo.remove();
    for (const prop of ["zIndex", "transformOrigin", "backfaceVisibility", "willChange"]) nuevo.style[prop] = "";
  };
  caja._terminar = fin;
  return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(fin);
}

/** Una animación de entrada para lo que se acaba de poner (sin cambiar de pantalla). */
export function aparecer(nodo, tipo = "sobre") {
  if (quieto()) return;
  const t = TIPOS[tipo] || TIPOS.sobre;
  const k = typeof t[4].k === "function" ? null : t[4].k;
  if (k) nodo.animate(k, { duration: t[1], easing: t[4].easing, fill: "backwards" });
}

export const sinMovimiento = quieto;
