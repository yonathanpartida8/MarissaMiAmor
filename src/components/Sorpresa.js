/**
 * SORPRESA — el easter egg de cada página (ver `data/sorpresas.js`).
 *
 * La forma de encontrarla cambia de una página a la siguiente, y si tarda
 * en dar con ella sale una pista una sola vez. Al encontrarla aparece una
 * tarjetita con su escena (o su foto de `sorpresas/`) y su frase.
 */

import { el, setVars } from "../utils/dom.js";
import { seeded } from "../utils/rng.js";
import sorpresas from "../data/sorpresas.js";
import contenido from "../data/contenido.js";

const ORDEN = Object.keys(sorpresas);
const TIPOS = ["estrella", "triple", "mantener", "esquina", "tamborilea"];
const GLIFOS = ["✦", "♡", "☾", "✿", "⋆", "❀", "✧"];
const PISTA_TRAS = 24000;
const pistasDadas = new Set();

function pista(tipo, lado) {
  switch (tipo) {
    case "estrella": return "psst… hay algo brillando escondido en esta página ✦";
    case "triple": return "psst… toca tres veces el título";
    case "mantener": return "psst… deja el dedo quietito sobre las letras de arriba";
    case "esquina": return `psst… toca tres veces la esquina de arriba a la ${lado}`;
    default: return "psst… tamborilea cinco veces rapidito sobre la página";
  }
}

/** Engancha la sorpresa de la página. Todo se suelta solo al irse. */
export function montarSorpresa(page) {
  const def = sorpresas[page.id];
  const root = page.root;
  if (!def || !root) return;

  const orden = ORDEN.indexOf(page.id);
  const rng = seeded(`sorpresa-${page.id}`);
  const titulo = root.querySelector("h1, h2, .title, [class*='__title'], [class*='titulo']");
  const letras = root.querySelector(".kicker, [class*='kicker']") || titulo;
  let tipo = TIPOS[orden % TIPOS.length];
  if ((tipo === "triple" && !titulo) || (tipo === "mantener" && !letras)) tipo = "estrella";
  const lado = orden % 2 ? "izquierda" : "derecha";

  let hecha = false;
  const revelar = (x, y) => {
    if (hecha || page.destroyed) return;
    hecha = true;
    mostrar(page, def, x, y);
  };
  const toques = (n, ventana) => {
    let marcas = [];
    return () => {
      const ahora = performance.now();
      marcas = marcas.filter((t) => ahora - t < ventana).concat(ahora);
      return marcas.length >= n;
    };
  };
  const opts = { capture: true, passive: true };

  if (tipo === "estrella") {
    const glifo = GLIFOS[orden % GLIFOS.length];
    const btn = el("button.sorpresa-estrella", { type: "button", "aria-label": "Algo brilla aquí", text: glifo });
    setVars(btn, {
      "--x": `${rng.range(10, 84).toFixed(1)}%`,
      "--y": `${rng.range(16, 66).toFixed(1)}%`,
      "--r": `${rng.range(-25, 25).toFixed(0)}deg`,
    });
    root.append(btn);
    page.track(() => btn.remove());
    page.on(btn, "click", (e) => {
      btn.classList.add("is-hallada");
      revelar(e.clientX, e.clientY);
    });
  } else if (tipo === "triple") {
    const tres = toques(3, 900);
    page.on(titulo, "pointerdown", (e) => tres() && revelar(e.clientX, e.clientY), opts);
  } else if (tipo === "mantener") {
    let reloj = null;
    let desde = null;
    const soltar = () => { clearTimeout(reloj); reloj = null; };
    page.on(letras, "pointerdown", (e) => {
      desde = { x: e.clientX, y: e.clientY };
      soltar();
      reloj = setTimeout(() => revelar(desde.x, desde.y), 900);
    }, opts);
    page.on(window, "pointermove", (e) => {
      if (reloj && desde && Math.hypot(e.clientX - desde.x, e.clientY - desde.y) > 14) soltar();
    }, { passive: true });
    page.on(window, "pointerup", soltar, { passive: true });
    page.on(window, "pointercancel", soltar, { passive: true });
    page.track(soltar);
  } else if (tipo === "esquina") {
    const tres = toques(3, 1600);
    page.on(root, "pointerdown", (e) => {
      const r = root.getBoundingClientRect();
      const enX = lado === "derecha" ? e.clientX > r.right - 90 : e.clientX < r.left + 90;
      if (enX && e.clientY < r.top + 110 && tres()) revelar(e.clientX, e.clientY);
    }, opts);
  } else {
    const cinco = toques(5, 1700);
    page.on(root, "pointerdown", (e) => cinco() && revelar(e.clientX, e.clientY), opts);
  }

  // Una pista, una sola vez por página y por visita al libro.
  if (!pistasDadas.has(page.id) && !page.ctx.store.state?.escondites?.includes(`sorpresa-${page.id}`)) {
    page.later(() => {
      if (hecha || !page.active || pistasDadas.has(page.id)) return;
      pistasDadas.add(page.id);
      page.ctx.ui?.toast?.(pista(tipo, lado), 3600);
    }, PISTA_TRAS);
  }
}

function mostrar(page, def, x, y) {
  const { ctx } = page;
  const clave = `sorpresa-${page.id}`;
  const nueva = ctx.store.findHideout(clave);
  const halladas = (ctx.store.state?.escondites || []).filter((k) => k.startsWith("sorpresa-")).length;

  const archivo = contenido?.sorpresas?.[page.id];
  const img = el("div.sorpresa__img");
  if (archivo) {
    img.classList.add("con-foto");
    img.style.backgroundImage = `url("sorpresas/${encodeURIComponent(archivo)}")`;
  } else {
    const [principal, ...resto] = def.escena;
    img.append(el("span.sorpresa__main", { text: principal }));
    const rng = seeded(`escena-${page.id}`);
    const giro = rng.range(0, Math.PI * 2);
    resto.forEach((emoji, k) => {
      const a = giro + (k / resto.length) * Math.PI * 2;
      const sat = el("span.sorpresa__sat", { text: emoji });
      setVars(sat, {
        "--x": `${(50 + Math.cos(a) * 34).toFixed(1)}%`,
        "--y": `${(50 + Math.sin(a) * 30).toFixed(1)}%`,
        "--d": `${(k * 0.35).toFixed(2)}s`,
        "--s": rng.range(0.8, 1.15).toFixed(2),
      });
      img.append(sat);
    });
  }

  const capa = el("div.sorpresa", { role: "dialog", "aria-label": "Una sorpresa", "data-claim-drag": "" }, [
    el("div.sorpresa__carta", {}, [
      img,
      el("p.sorpresa__frase", { text: def.frase }),
      el("span.sorpresa__cuenta", {
        text: `✦ sorpresa ${halladas} de ${ORDEN.length}${nueva ? "" : " · ya la conocías"}`,
      }),
      el("span.sorpresa__cerrar", { text: "toca para cerrar" }),
    ]),
  ]);
  setVars(capa, { "--a": page.palette.a, "--b": page.palette.b, "--c": page.palette.c });

  const cerrar = () => {
    capa.classList.add("is-saliendo");
    setTimeout(() => capa.remove(), 380);
  };
  capa.addEventListener("click", cerrar);
  page.root.append(capa);
  page.track(() => capa.remove());
  requestAnimationFrame(() => capa.classList.add("is-visible"));

  ctx.haptics.play(nueva ? "secret" : "tap");
  ctx.audio?.play("open", { volume: 0.5 });
  ctx.gl?.pulse?.(0.6);
  for (let k = 0; k < 5; k++) page.later(() => page.corazon(x, y), k * 110);
}
