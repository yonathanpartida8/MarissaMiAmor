/**
 * SECRETO — lo que está escrito entre líneas.
 *
 * Una nota corriente sobre papel. Corriente hasta que se tocan las palabras:
 * unas cuantas están marcadas y, al tocarlas, se encienden y sueltan al margen
 * lo que de verdad querían decir. No hay ninguna indicación de cuáles son —
 * eso es la gracia— pero si pasa un rato sin encontrar ninguna, la página
 * empuja un poco. Nunca se queda encallada.
 *
 * Es una carta de verdad: papel rayado con su margen, cinta en las esquinas,
 * la fecha, una florecita prensada y una mancha de café. Cada palabra
 * encontrada queda rodeada con un círculo a mano, como quien la subraya.
 *
 * Y hay tres cosas más que nadie tiene por qué encontrar:
 *   · la LINTERNA de abajo: encendida, al pasar el dedo por la carta
 *     aparecen frases escritas con tinta invisible;
 *   · el lacre de la esquina, si se mantiene pulsado, se ablanda y confiesa;
 *   · un doble toque en el papel suelta un corazón que sube.
 *
 * Todo lo que dice —incluidas las palabras marcadas— está en `textos.js`.
 */

import { BasePage } from "../BasePage.js";
import { Gestures } from "../../core/Gestures.js";
import { createSparkles } from "../../components/Sparkles.js";
import { el, svgEl as svg, setVars, wait } from "../../utils/dom.js";
import { seeded } from "../../utils/rng.js";
import textos from "./textos.js";

/** Cuántas hay que encontrar para que se abra el final. */
const PARA_TERMINAR = (total) => Math.max(1, total - 1);

/** Si no encuentra nada en este rato, la página ayuda un poco. */
const EMPUJON_MS = 7000;

export default class SecretoPage extends BasePage {
  static type = "secret";

  build() {
    // El título de `textos.js` manda también fuera de la página: es el que
    // sale en la barra de abajo y en el índice del libro.
    this.chapter = { ...this.chapter, title: textos.titulo };

    this.root = el("section.page.secreto.paper.paper--aged", {
      "data-page": this.id,
      "aria-label": textos.titulo,
    });
    setVars(this.root, { "--accent": this.palette.a });

    // ── La nota, con sus palabras marcadas ────────────────────────────
    this.marcadas = [];
    const parrafo = el("p.secreto__nota");

    // El texto se parte por *asteriscos*: lo de dentro es una palabra marcada.
    String(textos.nota).split(/(\*[^*]+\*)/).forEach((trozo) => {
      if (!trozo) return;
      if (trozo.startsWith("*") && trozo.endsWith("*")) {
        const i = this.marcadas.length;
        const palabra = el("button.secreto__palabra", {
          type: "button",
          text: trozo.slice(1, -1),
          "aria-label": `Descubrir lo que esconde «${trozo.slice(1, -1)}»`,
          dataset: { i: String(i) },
        });
        // El círculo a mano que la rodea cuando se encuentra.
        palabra.append(
          svg("svg", { class: "secreto__circulo", viewBox: "0 0 100 40", preserveAspectRatio: "none", "aria-hidden": "true" }, [
            svg("path", { d: "M8,24 C3,10 38,3 62,5 C86,7 98,14 94,25 C90,35 58,38 36,36 C15,34 2,27 10,14", pathLength: "1" }),
          ])
        );
        this.marcadas.push({ node: palabra, frase: textos.escondidas[i] || "", found: false });
        parrafo.append(palabra);
      } else {
        parrafo.append(document.createTextNode(trozo));
      }
    });

    this.margen = el("div.secreto__margen", { "aria-live": "polite" });

    // ── El lacre de la esquina (easter egg) ───────────────────────────
    this.lacre = el("button.secreto__lacre", {
      type: "button",
      "aria-label": "Un lacre",
      html: `<span class="secreto__lacre-txt">${textos.lacre}</span>`,
    });

    this.confesion = el("p.secreto__confesion", { text: textos.secretoDelLacre });

    // ── Polvo en la luz ───────────────────────────────────────────────
    this.sparkles = createSparkles(this.ctx, { seed: `secreto-${this.id}`, scale: 0.55 });

    this.contador = el("div.secreto__contador", { "aria-hidden": "true" });
    this.marcadas.forEach(() => this.contador.append(el("i.secreto__pip")));

    this.finalEl = el("p.secreto__final", { text: textos.final });

    // ── La tinta invisible y su linterna ──────────────────────────────
    this.invisibles = (textos.invisibles || []).map((t) => {
      const n = el("span.secreto__invisible", { text: t.texto });
      setVars(n, { "--x": `${t.x}%`, "--y": `${t.y}%`, "--giro": `${t.giro || 0}deg` });
      return { node: n, visto: false };
    });
    this.uv = el("div.secreto__uv", { "aria-hidden": "true" }, this.invisibles.map((i) => i.node));
    this.lampara = el("button.secreto__lampara", { type: "button", "aria-pressed": "false" }, [
      el("span.secreto__lampara-foco", { "aria-hidden": "true" }),
      el("span.secreto__lampara-txt", { text: textos.linterna }),
    ]);

    // ── Los detalles del papel ────────────────────────────────────────
    const flor = svg("svg", { class: "secreto__flor", viewBox: "0 0 80 110", "aria-hidden": "true" }, [
      svg("path", { class: "secreto__flor-tallo", d: "M40,108 C42,90 36,72 40,50" }),
      svg("path", { class: "secreto__flor-hoja", d: "M39,86 C28,82 22,74 24,66 C33,68 39,76 39,86Z" }),
      svg("path", { class: "secreto__flor-hoja", d: "M41,74 C50,70 58,62 57,54 C48,56 42,64 41,74Z" }),
      ...[0, 72, 144, 216, 288].map((a) => svg("ellipse", { class: "secreto__flor-petalo", cx: "40", cy: "30", rx: "8", ry: "15", transform: `rotate(${a} 40 44)` })),
      svg("circle", { class: "secreto__flor-centro", cx: "40", cy: "44", r: "5.5" }),
    ]);

    this.hoja = el("div.secreto__hoja", {}, [
      el("span.secreto__cinta.secreto__cinta--izq", { "aria-hidden": "true" }),
      el("span.secreto__cinta.secreto__cinta--der", { "aria-hidden": "true" }),
      el("span.secreto__mancha", { "aria-hidden": "true" }),
      flor,
      el("header.secreto__head", {}, [
        el("span.kicker", { text: textos.arriba }),
        el("h2.title.secreto__titulo", { text: textos.titulo }),
      ]),
      el("div.secreto__encabezado", {}, [
        el("span.secreto__saludo", { text: textos.saludo || "" }),
        el("span.secreto__fecha", { text: textos.fecha || "" }),
      ]),
      // La nota, la firma y lo que va saliendo entre líneas, en un solo
      // desplazamiento: así nunca se queda una frase escondida por debajo.
      el("div.lectura.secreto__scroll", {}, [parrafo, el("p.secreto__firma", { text: textos.firma || "" }), this.margen]),
      this.contador,
      this.finalEl,
      this.uv,
    ]);

    this.root.append(this.hoja, this.lampara, this.lacre, this.confesion, this.sparkles.node);
    return this.root;
  }

  async enter(direction) {
    await super.enter(direction);
    requestAnimationFrame(() => this.root.classList.add("is-entered"));

    this.rng = seeded(`secreto-${this.id}`);
    this.encontradas = 0;
    this.meta = PARA_TERMINAR(this.marcadas.length);

    // Si ya lo descubrió otro día, se abre entero: no se repite el juego.
    if (this.ctx.store.hasSecret(this.entry.secret)) {
      this.marcadas.forEach((m, i) => this.#descubrir(m, i, false));
      this.#terminar(false);
    } else {
      this.marcadas.forEach((m, i) => this.#bind(m, i));
      // Si pasa un rato sin encontrar nada, las palabras parpadean.
      this.empujon = setTimeout(() => {
        if (this.encontradas === 0) {
          this.root.classList.add("is-nudging");
          this.#susurrar(textos.empujoncito);
        }
      }, EMPUJON_MS);
    }

    this.#easterEggs();
    this.#linterna();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  La linterna
  // ═══════════════════════════════════════════════════════════════════

  #linterna() {
    this.encendida = false;
    this.root.classList.remove("is-linterna");
    const mover = (x, y) => {
      const r = this.hoja.getBoundingClientRect();
      const lx = x - r.left;
      const ly = y - r.top;
      setVars(this.uv, { "--lx": `${lx.toFixed(0)}px`, "--ly": `${ly.toFixed(0)}px` });
      // ¿Qué frases ha tocado ya la luz?
      for (const inv of this.invisibles) {
        if (inv.visto) continue;
        const q = inv.node.getBoundingClientRect();
        const cx = q.left + q.width / 2;
        const cy = q.top + q.height / 2;
        if (Math.abs(x - cx) < q.width / 2 + 20 && Math.abs(y - cy) < 40) {
          inv.visto = true;
          inv.node.classList.add("is-vista");
          this.ctx.haptics.play("tick");
          if (this.invisibles.every((i) => i.visto)) {
            this.escondite("secreto-linterna", textos.linternaTodas, { x, y });
          }
        }
      }
    };

    this.on(this.lampara, "click", () => {
      this.encendida = !this.encendida;
      this.root.classList.toggle("is-linterna", this.encendida);
      // Con la linterna en la mano, arrastrar por la carta es mover la luz,
      // no pasar de página.
      this.hoja.toggleAttribute("data-claim-drag", this.encendida);
      this.lampara.setAttribute("aria-pressed", String(this.encendida));
      this.ctx.haptics.play("tap");
      if (this.encendida) {
        const r = this.hoja.getBoundingClientRect();
        mover(r.left + r.width / 2, r.top + r.height * 0.45);
        this.#susurrar(textos.linternaAyuda);
      }
    });
    this.on(this.hoja, "pointerdown", (e) => this.encendida && mover(e.clientX, e.clientY));
    this.on(this.hoja, "pointermove", (e) => this.encendida && mover(e.clientX, e.clientY));
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Las palabras
  // ═══════════════════════════════════════════════════════════════════

  #bind(marca, i) {
    this.on(marca.node, "click", () => this.#descubrir(marca, i, true));
  }

  #descubrir(marca, i, celebrar) {
    if (marca.found) return;
    marca.found = true;
    this.encontradas++;

    marca.node.classList.add("is-found");
    marca.node.disabled = true;
    this.contador.children[i]?.classList.add("is-on");
    this.root.classList.remove("is-nudging");
    clearTimeout(this.empujon);

    if (celebrar) {
      this.ctx.haptics.play("reveal");
      this.ctx.audio.play("turn", { volume: 0.16, rate: 1.9 });
      this.ctx.gl?.pulse(0.35);
    }

    // La frase escondida cae al margen, con su propia entrada.
    const linea = el("p.secreto__linea", { text: marca.frase });
    setVars(linea, { "--tilt": `${this.rng.range(-1.6, 1.6).toFixed(2)}deg` });
    this.margen.append(linea);
    if (celebrar) {
      requestAnimationFrame(() => linea.classList.add("is-in"));
      this.later(() => linea.scrollIntoView?.({ block: "nearest", behavior: "smooth" }), 250);
    } else linea.classList.add("is-in");

    // Un corazón pequeño sube desde la palabra tocada.
    if (celebrar) this.#corazon(marca.node);

    if (this.encontradas >= this.meta) this.#terminar(celebrar);
  }

  async #terminar(celebrar) {
    if (this.terminada) return;
    this.terminada = true;
    this.root.classList.add("is-lit");

    if (!celebrar) {
      this.root.classList.add("is-said");
      return;
    }

    this.ctx.haptics.play("secret");
    this.ctx.gl?.flash(0.28);
    this.ctx.gl?.pulse(0.9);
    await wait(560);
    this.root.classList.add("is-said");
    this.unlockSecret();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Los que nadie tiene por qué encontrar
  // ═══════════════════════════════════════════════════════════════════

  #easterEggs() {
    // 1. El lacre: mantenerlo pulsado lo ablanda y confiesa.
    this.addGestures(
      new Gestures(
        this.lacre,
        {
          onDown: () => this.lacre.classList.add("is-pressing"),
          onUp: () => this.lacre.classList.remove("is-pressing"),
          onLongPress: () => {
            if (this.lacreAbierto) return;
            this.lacreAbierto = true;
            this.lacre.classList.add("is-melted");
            this.root.classList.add("is-confessed");
            this.ctx.haptics.play("secret");
            this.ctx.audio.play("open", { volume: 0.4, rate: 1.3 });
            this.#corazon(this.lacre);
          },
        },
        { exclusive: true, threshold: 12, longPressMs: 620 }
      )
    );

    // 2. Doble toque en el papel: sube un corazón con su frase.
    this.addGestures(
      new Gestures(
        this.hoja,
        {
          onDoubleTap: (e) => {
            this.ctx.haptics.play("tap");
            this.corazon(e.x, e.y, textos.corazonSuelto);
          },
        },
        { threshold: 16 }
      )
    );
  }

  /** Un corazón que sube desde un elemento de la página. */
  #corazon(desde, frase) {
    const r = desde.getBoundingClientRect();
    this.corazon(r.left + r.width / 2, r.top + r.height / 2, frase);
  }

  #susurrar(frase) {
    this.ctx.ui?.toast?.(frase, 2400);
  }

  destroy() {
    clearTimeout(this.empujon);
    this.sparkles?.destroy();
    super.destroy();
  }
}
