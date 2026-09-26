/**
 * EXTRAS — tres detalles que viven por encima de todas las páginas:
 *
 *   · El ÁLBUM de sorpresas: las encontradas con su escena y su frase, las
 *     que faltan como «?» con la página donde se esconden (tocar lleva ahí).
 *   · La NOTITA DEL DÍA: un sobrecito que aparece una vez al día al abrir
 *     el libro, con un mensaje distinto cada día.
 *   · CORAZONCITOS: cada toque en un hueco libre deja uno que sube.
 */

import { el, setVars } from "../utils/dom.js";
import sorpresas from "../data/sorpresas.js";
import contenido from "../data/contenido.js";
import { chapterById } from "../data/chapters.js";
import { indexOfPage } from "../data/manifest.js";

const NOTITAS = [
  "Buenos días, o buenas noches, mi amorcito: hoy también te elijo.",
  "Hoy es un buen día para recordarte que eres mi persona favorita.",
  "Si hoy te sientes cansada, apóyate en mí aunque sea de lejos.",
  "Te extrañé desde antes de abrir los ojos.",
  "Ojalá hoy te pase algo bonito. Y si no, aquí estoy yo para contártelo.",
  "Tu nombre sigue siendo mi palabra favorita.",
  "Hoy toca abrazo imaginario de los largos. Ya te lo mandé.",
  "Me gusta pensar que miramos la misma luna.",
  "Eres lo más bonito que me ha pasado, y no me cansa decirlo.",
  "Un día vamos a leer esto juntos y me vas a dar un beso por cursi.",
  "Cuando algo me sale bien, lo primero que quiero es contártelo.",
  "Hoy te amo un poquito más que ayer. Mañana, más.",
  "Gracias por existir justo así, con todo y tus cositas.",
  "Si pudiera mandarte un café calientito por la pantalla, ya lo tendrías.",
  "No hay distancia que le gane a lo que siento por ti.",
  "Me encanta cuando me cuentas tu día con todos los detalles.",
  "Hoy sonreí por ti sin que estuvieras. Pasa seguido.",
  "Eres mi lugar seguro, aunque estés a kilómetros.",
  "Tengo guardado un «te amo» para cada día del año. Éste es el de hoy.",
  "Qué bonito es amarte sin prisa.",
  "Nuestras madrugadas raras son de mis cosas favoritas del mundo.",
  "Hoy te toca consentirte. Órdenes de tu novio.",
  "Si hoy dudas de algo, que no sea de mí.",
  "Me gustas en todos tus modos: dormida, terca, risueña, seria.",
  "Cada día que pasa es uno menos para abrazarte.",
  "Contigo hasta lo aburrido suena a plan perfecto.",
  "Eres mi casualidad favorita.",
  "Te pienso más veces de las que te lo digo. Y te lo digo mucho.",
  "Hoy también quiero ser alguien que te haga bien.",
  "Me quedé pensando en tu risa. Ya estoy sonriendo.",
  "Mi amorcito: pase lo que pase hoy, al final del día estoy yo.",
];

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/* ───────────────────────────── ÁLBUM ───────────────────────────── */
export class Album {
  constructor(ctx, raiz) {
    this.ctx = ctx;
    this.cuadro = el("div.album__cuadro");
    this.cuenta = el("p.album__cuenta");
    this.barra = el("span.album__barra");
    this.root = el("div.album", { role: "dialog", "aria-label": "Álbum de sorpresas", hidden: "" }, [
      el("div.album__hoja", {}, [
        el("header.album__cabeza", {}, [
          el("div", {}, [el("h2.album__titulo", { text: "Álbum de sorpresas" }), this.cuenta]),
          el("button.album__cerrar", { type: "button", "aria-label": "Cerrar", html: "✕", onClick: () => this.cerrar() }),
        ]),
        el("div.album__progreso", {}, [this.barra]),
        el("div.lectura.album__scroll", {}, [this.cuadro]),
      ]),
    ]);
    raiz.append(this.root);
  }

  get halladas() {
    return new Set((this.ctx.store.state?.escondites || []).filter((k) => k.startsWith("sorpresa-")));
  }

  abrir() {
    const ids = Object.keys(sorpresas);
    const halladas = this.halladas;
    const n = ids.filter((id) => halladas.has(`sorpresa-${id}`)).length;
    this.cuenta.textContent = n === ids.length ? `¡Las ${n} encontradas! ♥` : `${n} de ${ids.length} encontradas`;
    setVars(this.barra, { "--p": (n / ids.length).toFixed(3) });

    this.cuadro.textContent = "";
    ids.forEach((id, i) => {
      const def = sorpresas[id];
      const ok = halladas.has(`sorpresa-${id}`);
      const titulo = id === "portada" ? "Portada" : id === "final" ? "El final" : chapterById[id]?.title || id;
      const figura = el("div.album__figura");
      if (ok) {
        const foto = contenido?.sorpresas?.[id];
        if (foto) {
          figura.style.backgroundImage = `url("sorpresas/${encodeURIComponent(foto)}")`;
          figura.classList.add("con-foto");
        } else {
          figura.append(el("span.album__emoji", { text: def.escena[0] }), el("span.album__mini", { text: def.escena.slice(1).join("") }));
        }
      } else {
        figura.append(el("span.album__misterio", { text: "?" }));
      }
      const tarjeta = el(`button.album__carta${ok ? ".is-hallada" : ""}`, { type: "button" }, [
        figura,
        el("span.album__num", { text: `#${String(i + 1).padStart(2, "0")}` }),
        el("span.album__frase", { text: ok ? def.frase : `escondida en «${titulo}»` }),
      ]);
      setVars(tarjeta, { "--d": `${Math.min(i, 24) * 22}ms` });
      tarjeta.addEventListener("click", () => {
        const idx = indexOfPage(id);
        if (idx < 0) return;
        this.cerrar();
        setTimeout(() => this.ctx.router.go(idx, { transition: "iris" }), 240);
      });
      this.cuadro.append(tarjeta);
    });

    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add("is-abierto"));
    this.ctx.haptics.play("tap");
  }

  cerrar() {
    this.root.classList.remove("is-abierto");
    setTimeout(() => (this.root.hidden = true), 320);
  }
}

/* ────────────────────────── NOTITA DEL DÍA ───────────────────────── */
export function notitaDelDia(ctx, raiz) {
  if (ctx.store.get("notitaDia") === hoy()) return;
  const d = new Date();
  const dia = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const texto = NOTITAS[dia % NOTITAS.length];

  const sobre = el("button.notita", { type: "button", "aria-label": "Una notita para hoy" }, [
    el("span.notita__sobre", { text: "💌" }),
    el("span.notita__etiqueta", { text: "notita de hoy" }),
  ]);
  const carta = el("div.notita__carta", { role: "dialog", hidden: "" }, [
    el("div.notita__papel", {}, [
      el("span.notita__fecha", { text: d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }) }),
      el("p.notita__texto", { text: texto }),
      el("span.notita__firma", { text: "— tu amorcito ♥" }),
    ]),
  ]);
  raiz.append(sobre, carta);
  requestAnimationFrame(() => sobre.classList.add("is-visible"));

  sobre.addEventListener("click", () => {
    ctx.store.set("notitaDia", hoy());
    sobre.classList.remove("is-visible");
    setTimeout(() => sobre.remove(), 400);
    carta.hidden = false;
    requestAnimationFrame(() => carta.classList.add("is-abierta"));
    ctx.haptics.play("secret");
    ctx.audio?.play?.("open", { volume: 0.45 });
  });
  carta.addEventListener("click", () => {
    carta.classList.remove("is-abierta");
    setTimeout(() => carta.remove(), 420);
  });
}

/* ─────────────────────────── CORAZONCITOS ─────────────────────────── */
const NO_TOCAR = "button, a, input, textarea, select, iframe, [role=button], [role=slider], [data-claim-drag], .bar, .toc, .album, .edges, .notita, .notita__carta, .sorpresa";

export function corazoncitos(ctx, raiz) {
  if (ctx.caps?.reducedMotion) return;
  const capa = el("div.toques", { "aria-hidden": "true" });
  raiz.append(capa);
  let inicio = null;
  let ultimo = 0;
  window.addEventListener("pointerdown", (e) => {
    inicio = e.target?.closest?.(NO_TOCAR) ? null : { x: e.clientX, y: e.clientY, t: performance.now() };
  }, { passive: true, capture: true });
  window.addEventListener("pointerup", (e) => {
    if (!inicio) return;
    const ahora = performance.now();
    const quieto = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 10 && ahora - inicio.t < 350;
    inicio = null;
    if (!quieto || ahora - ultimo < 140) return;
    ultimo = ahora;
    const c = el("span.toques__corazon", { text: ["♥", "♡", "❤", "✦"][Math.floor(Math.random() * 4)] });
    setVars(c, {
      "--x": `${e.clientX}px`,
      "--y": `${e.clientY}px`,
      "--dx": `${(Math.random() * 40 - 20).toFixed(0)}px`,
      "--s": (0.7 + Math.random() * 0.6).toFixed(2),
    });
    capa.append(c);
    setTimeout(() => c.remove(), 1300);
  }, { passive: true, capture: true });
}
